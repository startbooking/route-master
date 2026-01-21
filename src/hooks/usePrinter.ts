// ============================================
// USE PRINTER HOOK - Gestión de impresora térmica
// Soporta: WebUSB (Ubuntu /dev/usb/lp*) y Web Serial
// ============================================

import { useState, useCallback, useEffect } from 'react';
import { Ticket } from '@/types';
import { 
  thermalPrinter, 
  generateInvoiceHTML, 
  buildInvoiceData, 
  buildInvoiceBytes,
  PrinterConnectionType,
} from '@/lib/thermalPrinter';
import { toast } from '@/hooks/use-toast';

export interface PrinterCapabilities {
  serial: boolean;
  usb: boolean;
  any: boolean;
}

export function usePrinter() {
  const [isConnected, setIsConnected] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [connectionType, setConnectionType] = useState<PrinterConnectionType>('none');
  const [capabilities, setCapabilities] = useState<PrinterCapabilities>({
    serial: false,
    usb: false,
    any: false,
  });

  useEffect(() => {
    setCapabilities({
      serial: thermalPrinter.isSerialSupported(),
      usb: thermalPrinter.isUSBSupported(),
      any: thermalPrinter.isSupported(),
    });
  }, []);

  // Connect to thermal printer (auto-detect: USB first, then Serial)
  const connectPrinter = useCallback(async (): Promise<boolean> => {
    if (!capabilities.any) {
      toast({
        title: 'No soportado',
        description: 'Tu navegador no soporta WebUSB ni Web Serial API. Usa Chrome o Edge en escritorio.',
        variant: 'destructive',
      });
      return false;
    }

    try {
      const connected = await thermalPrinter.connect();
      setIsConnected(connected);
      setConnectionType(thermalPrinter.getConnectionType());
      
      if (connected) {
        const connType = thermalPrinter.getConnectionType();
        const typeLabel = connType === 'usb' ? 'USB (lp)' : 'Serial';
        toast({
          title: 'Impresora conectada',
          description: `Conectada vía ${typeLabel}. Lista para imprimir.`,
        });
      } else {
        toast({
          title: 'Error de conexión',
          description: 'No se pudo conectar. Verifica permisos del grupo lp (Ubuntu) o dialout.',
          variant: 'destructive',
        });
      }
      
      return connected;
    } catch (error) {
      console.error('Error connecting to printer:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Error desconocido',
        variant: 'destructive',
      });
      return false;
    }
  }, [capabilities.any]);

  // Connect specifically via USB (for Ubuntu /dev/usb/lp*)
  const connectUSB = useCallback(async (): Promise<boolean> => {
    if (!capabilities.usb) {
      toast({
        title: 'No soportado',
        description: 'WebUSB no disponible. Usa Chrome o Edge.',
        variant: 'destructive',
      });
      return false;
    }

    try {
      const connected = await thermalPrinter.connectUSB();
      setIsConnected(connected);
      setConnectionType(thermalPrinter.getConnectionType());
      
      if (connected) {
        toast({
          title: 'Impresora USB conectada',
          description: 'Conectada vía WebUSB (/dev/usb/lp*). Lista para imprimir.',
        });
      }
      return connected;
    } catch (error) {
      console.error('USB connection error:', error);
      return false;
    }
  }, [capabilities.usb]);

  // Connect specifically via Serial
  const connectSerial = useCallback(async (): Promise<boolean> => {
    if (!capabilities.serial) {
      toast({
        title: 'No soportado',
        description: 'Web Serial no disponible.',
        variant: 'destructive',
      });
      return false;
    }

    try {
      const connected = await thermalPrinter.connectSerial();
      setIsConnected(connected);
      setConnectionType(thermalPrinter.getConnectionType());
      
      if (connected) {
        toast({
          title: 'Impresora Serial conectada',
          description: 'Conectada vía Web Serial. Lista para imprimir.',
        });
      }
      return connected;
    } catch (error) {
      console.error('Serial connection error:', error);
      return false;
    }
  }, [capabilities.serial]);

  // Disconnect printer
  const disconnectPrinter = useCallback(async () => {
    await thermalPrinter.disconnect();
    setIsConnected(false);
    setConnectionType('none');
    toast({
      title: 'Impresora desconectada',
      description: 'La impresora térmica ha sido desconectada.',
    });
  }, []);

  // Print ticket invoice directly to thermal printer
  const printTicketThermal = useCallback(async (ticket: Ticket): Promise<boolean> => {
    if (!isConnected) {
      const connected = await connectPrinter();
      if (!connected) return false;
    }

    setIsPrinting(true);
    
    try {
      const success = await thermalPrinter.printInvoice(ticket);
      
      if (success) {
        toast({
          title: 'Impresión exitosa',
          description: `Factura ${ticket.numeroTicket} impresa correctamente.`,
        });
      } else {
        toast({
          title: 'Error de impresión',
          description: 'No se pudo imprimir la factura.',
          variant: 'destructive',
        });
      }
      
      return success;
    } catch (error) {
      console.error('Error printing ticket:', error);
      toast({
        title: 'Error',
        description: 'Ocurrió un error al imprimir.',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsPrinting(false);
    }
  }, [isConnected, connectPrinter]);

  // Print using browser window (fallback)
  const printTicketWindow = useCallback((ticket: Ticket) => {
    const html = generateInvoiceHTML(ticket);
    const printWindow = window.open('', '_blank', 'width=300,height=600');
    
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      
      printWindow.onload = () => {
        printWindow.print();
        printWindow.onafterprint = () => {
          printWindow.close();
        };
      };
    } else {
      toast({
        title: 'Error',
        description: 'No se pudo abrir la ventana de impresión.',
        variant: 'destructive',
      });
    }
  }, []);

  // Auto print - tries thermal first, falls back to window print
  const autoPrint = useCallback(async (ticket: Ticket): Promise<void> => {
    if (isConnected) {
      await printTicketThermal(ticket);
      return;
    }

    if (capabilities.any) {
      const connected = await connectPrinter();
      if (connected) {
        await printTicketThermal(ticket);
        return;
      }
    }

    // Fallback to window print
    printTicketWindow(ticket);
  }, [isConnected, capabilities.any, connectPrinter, printTicketThermal, printTicketWindow]);

  // Get invoice data for preview
  const getInvoiceData = useCallback((ticket: Ticket) => {
    return buildInvoiceData(ticket);
  }, []);

  // Get raw bytes for debugging
  const getInvoiceBytes = useCallback((ticket: Ticket) => {
    const data = buildInvoiceData(ticket);
    return buildInvoiceBytes(data);
  }, []);

  return {
    // State
    isConnected,
    isPrinting,
    connectionType,
    capabilities,
    
    // Connection methods
    connectPrinter,      // Auto-detect (USB first, then Serial)
    connectUSB,          // Force USB (Ubuntu /dev/usb/lp*)
    connectSerial,       // Force Serial (/dev/ttyUSB*)
    disconnectPrinter,
    
    // Print methods
    printTicketThermal,
    printTicketWindow,
    autoPrint,
    
    // Utils
    getInvoiceData,
    getInvoiceBytes,
  };
}
