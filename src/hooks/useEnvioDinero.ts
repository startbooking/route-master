import { useState, useCallback } from 'react';
import { EnvioDinero, CreateEnvioDineroDTO, Conductor, Municipio } from '@/types';
import { mockMunicipios, mockConductores } from '@/data/mockData';
import { toast } from '@/hooks/use-toast';
import { usePrinter } from '@/hooks/usePrinter';
import { 
  thermalPrinter, 
  buildEnvioReciboBytes, 
  generateEnvioReciboHTML 
} from '@/lib/thermalPrinter';

// Mock data for envios
const mockEnvios: EnvioDinero[] = [];

const COMISION_PORCENTAJE = 0.05; // 5% de comisión

export function generateEnvioNumber(): string {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `ENV-${year}${month}${day}-${random}`;
}

export function useEnvioDinero() {
  const [envios, setEnvios] = useState<EnvioDinero[]>(mockEnvios);
  const [loading, setLoading] = useState(false);
  const [lastCreatedEnvio, setLastCreatedEnvio] = useState<EnvioDinero | null>(null);
  const printer = usePrinter();

  const createEnvio = useCallback(async (
    dto: CreateEnvioDineroDTO,
    municipioOrigen: Municipio
  ): Promise<EnvioDinero | null> => {
    setLoading(true);

    try {
      // Validaciones
      if (dto.monto <= 0) {
        toast({
          title: 'Error de validación',
          description: 'El monto debe ser mayor a 0',
          variant: 'destructive',
        });
        return null;
      }

      // Buscar conductor
      const conductor = mockConductores.find(c => c.id === dto.conductorId);
      if (!conductor) {
        toast({
          title: 'Error',
          description: 'Conductor no encontrado',
          variant: 'destructive',
        });
        return null;
      }

      // Buscar municipio destino
      const municipioDestino = mockMunicipios.find(m => m.id === dto.municipioDestinoId);
      if (!municipioDestino) {
        toast({
          title: 'Error',
          description: 'Municipio destino no encontrado',
          variant: 'destructive',
        });
        return null;
      }

      // Simular delay de red
      await new Promise(resolve => setTimeout(resolve, 500));

      const comision = Math.round(dto.monto * COMISION_PORCENTAJE);
      const montoTotal = dto.monto + comision;

      const newEnvio: EnvioDinero = {
        id: envios.length + 1,
        numeroEnvio: generateEnvioNumber(),
        remitente: {
          numeroDocumento: dto.remitenteDocumento,
          tipoDocumento: dto.remitenteTipoDocumento,
          nombreCompleto: dto.remitenteNombre,
          telefono: dto.remitenteTelefono,
        },
        destinatario: {
          numeroDocumento: dto.destinatarioDocumento,
          nombreCompleto: dto.destinatarioNombre,
          telefono: dto.destinatarioTelefono,
        },
        monto: dto.monto,
        comision,
        montoTotal,
        conductor,
        municipioOrigen,
        municipioDestino,
        estado: 'PENDIENTE',
        fechaCreacion: new Date().toISOString(),
        observaciones: dto.observaciones,
      };

      setEnvios(prev => [...prev, newEnvio]);
      setLastCreatedEnvio(newEnvio);

      toast({
        title: '¡Envío registrado!',
        description: `Número: ${newEnvio.numeroEnvio}`,
      });

      // Auto print receipts
      await printEnvioReceipts(newEnvio);

      return newEnvio;
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo registrar el envío',
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [envios]);

  const printEnvioReceipts = async (envio: EnvioDinero) => {
    try {
      // Print remitente receipt
      if (printer.isConnected) {
        const remitenteBytes = buildEnvioReciboBytes(envio, 'remitente');
        await thermalPrinter.printBytes(remitenteBytes);
        
        // Small delay between prints
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Print conductor receipt
        const conductorBytes = buildEnvioReciboBytes(envio, 'conductor');
        await thermalPrinter.printBytes(conductorBytes);
      } else {
        // Fallback to browser print
        printEnvioWindow(envio, 'remitente');
        setTimeout(() => {
          printEnvioWindow(envio, 'conductor');
        }, 2000);
      }
    } catch (error) {
      console.error('Error printing envio receipts:', error);
      toast({
        title: 'Advertencia',
        description: 'Envío registrado pero hubo un error al imprimir los recibos',
        variant: 'destructive',
      });
    }
  };

  const printEnvioWindow = (envio: EnvioDinero, tipo: 'remitente' | 'conductor') => {
    const html = generateEnvioReciboHTML(envio, tipo);
    const printWindow = window.open('', '_blank', 'width=400,height=600');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.onload = () => {
        printWindow.print();
        setTimeout(() => printWindow.close(), 1000);
      };
    }
  };

  const cancelEnvio = useCallback(async (envioId: number): Promise<boolean> => {
    setLoading(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 300));

      setEnvios(prev =>
        prev.map(e =>
          e.id === envioId ? { ...e, estado: 'CANCELADO' as const } : e
        )
      );

      toast({
        title: 'Envío cancelado',
        description: 'El envío ha sido cancelado exitosamente',
      });

      return true;
    } catch {
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const markAsDelivered = useCallback(async (envioId: number): Promise<boolean> => {
    setLoading(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 300));

      setEnvios(prev =>
        prev.map(e =>
          e.id === envioId 
            ? { ...e, estado: 'ENTREGADO' as const, fechaEntrega: new Date().toISOString() } 
            : e
        )
      );

      toast({
        title: 'Envío entregado',
        description: 'El envío ha sido marcado como entregado',
      });

      return true;
    } catch {
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    envios,
    loading,
    lastCreatedEnvio,
    createEnvio,
    cancelEnvio,
    markAsDelivered,
    printEnvioReceipts,
    printer,
  };
}