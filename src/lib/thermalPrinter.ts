// ============================================
// THERMAL PRINTER SERVICE - ESC/POS Commands
// Para impresoras Epson TM-U (TMU220, TMU295, etc.)
// ============================================

import { Ticket, Empresa } from '@/types';
import QRCode from 'qrcode';

// Información de la empresa (configurable)
export const EMPRESA_CONFIG: Empresa & { 
  direccion: string; 
  telefono: string; 
  correo: string; 
  regimen: string;
} = {
  id: 1,
  nit: '800.123.456-7',
  razonSocial: 'TRANSPORTES VELOZ S.A.',
  direccion: 'Terminal de Transportes de Bogotá - Módulo 3',
  telefono: '(601) 123-4567',
  correo: 'facturacion@transveloz.com',
  regimen: 'Responsable de IVA',
  activo: true,
};

// ESC/POS Command Constants
const ESC = 0x1B;
const GS = 0x1D;
const LF = 0x0A;

// Helper to convert string to Uint8Array
function textToBytes(text: string): Uint8Array {
  const encoder = new TextEncoder();
  return encoder.encode(text);
}

// ESC/POS Command Builders
export const ESCPOSCommands = {
  // Initialize printer
  init: new Uint8Array([ESC, 0x40]),
  
  // Text alignment
  alignLeft: new Uint8Array([ESC, 0x61, 0x00]),
  alignCenter: new Uint8Array([ESC, 0x61, 0x01]),
  alignRight: new Uint8Array([ESC, 0x61, 0x02]),
  
  // Text formatting
  boldOn: new Uint8Array([ESC, 0x45, 0x01]),
  boldOff: new Uint8Array([ESC, 0x45, 0x00]),
  doubleHeight: new Uint8Array([GS, 0x21, 0x01]),
  doubleWidth: new Uint8Array([GS, 0x21, 0x10]),
  doubleSize: new Uint8Array([GS, 0x21, 0x11]),
  normalSize: new Uint8Array([GS, 0x21, 0x00]),
  underlineOn: new Uint8Array([ESC, 0x2D, 0x01]),
  underlineOff: new Uint8Array([ESC, 0x2D, 0x00]),
  
  // Line feeds
  lineFeed: new Uint8Array([LF]),
  feedLines: (n: number) => new Uint8Array([ESC, 0x64, n]),
  
  // Paper cut
  fullCut: new Uint8Array([GS, 0x56, 0x00]),
  partialCut: new Uint8Array([GS, 0x56, 0x01]),
  
  // Cash drawer
  openDrawer: new Uint8Array([ESC, 0x70, 0x00, 0x19, 0xFA]),
  
  // Line separator
  separator: textToBytes('================================'),
  dottedSeparator: textToBytes('--------------------------------'),
  
  // QR Code Commands (GS ( k)
  // Function 165: Set QR model
  qrModel: new Uint8Array([GS, 0x28, 0x6B, 0x04, 0x00, 0x31, 0x41, 0x32, 0x00]), // Model 2
  // Function 167: Set QR size (1-16)
  qrSize: (size: number) => new Uint8Array([GS, 0x28, 0x6B, 0x03, 0x00, 0x31, 0x43, size]),
  // Function 169: Set QR error correction (48=L, 49=M, 50=Q, 51=H)
  qrErrorCorrection: new Uint8Array([GS, 0x28, 0x6B, 0x03, 0x00, 0x31, 0x45, 0x31]), // M level
  // Function 180: Store QR data
  qrStoreData: (data: string) => {
    const dataBytes = textToBytes(data);
    const len = dataBytes.length + 3;
    const pL = len % 256;
    const pH = Math.floor(len / 256);
    const header = new Uint8Array([GS, 0x28, 0x6B, pL, pH, 0x31, 0x50, 0x30]);
    const result = new Uint8Array(header.length + dataBytes.length);
    result.set(header, 0);
    result.set(dataBytes, header.length);
    return result;
  },
  // Function 181: Print QR code
  qrPrint: new Uint8Array([GS, 0x28, 0x6B, 0x03, 0x00, 0x31, 0x51, 0x30]),
};

// Generate CUDE (Código Único de Documento Electrónico) - Mock
function generateCUDE(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let cude = '';
  for (let i = 0; i < 64; i++) {
    cude += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return cude;
}

// Format currency
function formatCurrency(value: number): string {
  return `$${value.toLocaleString('es-CO')}`;
}

// Format date
function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('es-CO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

// Format time
function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString('es-CO', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

// Build invoice data for a ticket
export interface InvoiceData {
  empresa: typeof EMPRESA_CONFIG;
  ticket: Ticket;
  numeroFactura: string;
  fechaEmision: Date;
  valorNeto: number;
  tasaTerminal: number;
  total: number;
  cude: string;
  rangoAutorizacion: string;
}

export function buildInvoiceData(ticket: Ticket): InvoiceData {
  const tasaTerminal = 5000;
  const valorNeto = ticket.valorPagado;
  const total = valorNeto + tasaTerminal;
  
  return {
    empresa: EMPRESA_CONFIG,
    ticket,
    numeroFactura: `TPE-${ticket.id.toString().padStart(5, '0')}`,
    fechaEmision: new Date(),
    valorNeto,
    tasaTerminal,
    total,
    cude: generateCUDE(),
    rangoAutorizacion: 'Autorización DIAN No. 187600000001 del 01/01/2026. Prefijo TPE del 1 al 100.000.',
  };
}

// Build ESC/POS byte array for the invoice
export function buildInvoiceBytes(data: InvoiceData): Uint8Array {
  const parts: Uint8Array[] = [];
  
  const addCommand = (cmd: Uint8Array) => parts.push(cmd);
  const addText = (text: string) => parts.push(textToBytes(text));
  const addLine = () => addCommand(ESCPOSCommands.lineFeed);
  
  // Initialize
  addCommand(ESCPOSCommands.init);
  
  // === HEADER ===
  addCommand(ESCPOSCommands.alignCenter);
  addCommand(ESCPOSCommands.boldOn);
  addCommand(ESCPOSCommands.doubleSize);
  addText(data.empresa.razonSocial);
  addLine();
  addCommand(ESCPOSCommands.normalSize);
  addCommand(ESCPOSCommands.boldOff);
  
  addText(`NIT: ${data.empresa.nit}`);
  addLine();
  addText(data.empresa.direccion);
  addLine();
  addText(`Tel: ${data.empresa.telefono}`);
  addLine();
  addText(data.empresa.correo);
  addLine();
  addText(`Régimen: ${data.empresa.regimen}`);
  addLine();
  addLine();
  
  // === TITLE ===
  addCommand(ESCPOSCommands.separator);
  addLine();
  addCommand(ESCPOSCommands.boldOn);
  addText('TIQUETE DE TRANSPORTE');
  addLine();
  addText('DE PASAJEROS ELECTRÓNICO');
  addLine();
  addCommand(ESCPOSCommands.boldOff);
  addCommand(ESCPOSCommands.separator);
  addLine();
  addLine();
  
  // === INVOICE INFO ===
  addCommand(ESCPOSCommands.alignLeft);
  addCommand(ESCPOSCommands.boldOn);
  addText(`Número: ${data.numeroFactura}`);
  addLine();
  addCommand(ESCPOSCommands.boldOff);
  addText(`Fecha Emisión: ${formatDate(data.fechaEmision.toISOString())}`);
  addLine();
  addText(`Hora: ${formatTime(data.fechaEmision.toISOString())}`);
  addLine();
  addText(`Fecha Viaje: ${data.ticket.planilla.fechaDespacho}`);
  addLine();
  addText(`Hora Salida: ${data.ticket.planilla.horaProgramada}`);
  addLine();
  addLine();
  
  // === PASSENGER DATA ===
  addCommand(ESCPOSCommands.alignCenter);
  addCommand(ESCPOSCommands.dottedSeparator);
  addLine();
  addCommand(ESCPOSCommands.boldOn);
  addText('DATOS DEL PASAJERO');
  addLine();
  addCommand(ESCPOSCommands.dottedSeparator);
  addLine();
  addCommand(ESCPOSCommands.boldOff);
  addCommand(ESCPOSCommands.alignLeft);
  addLine();
  
  addText(`Nombre: ${data.ticket.pasajero.nombreCompleto}`);
  addLine();
  addText(`Identificación: ${data.ticket.pasajero.numeroDocumento}`);
  addLine();
  if (data.ticket.pasajero.telefono) {
    addText(`Teléfono: ${data.ticket.pasajero.telefono}`);
    addLine();
  }
  addLine();
  
  // === SERVICE DETAILS ===
  addCommand(ESCPOSCommands.alignCenter);
  addCommand(ESCPOSCommands.dottedSeparator);
  addLine();
  addCommand(ESCPOSCommands.boldOn);
  addText('DETALLE DEL SERVICIO');
  addLine();
  addCommand(ESCPOSCommands.dottedSeparator);
  addLine();
  addCommand(ESCPOSCommands.boldOff);
  addCommand(ESCPOSCommands.alignLeft);
  addLine();
  
  addText('Modo: Terrestre Automotor');
  addLine();
  addText(`Origen: ${data.ticket.ruta.municipioOrigen?.nombre || 'N/A'} (${data.ticket.ruta.municipioOrigen?.departamento || ''})`);
  addLine();
  addText(`Destino: ${data.ticket.ruta.municipioDestino?.nombre || 'N/A'} (${data.ticket.ruta.municipioDestino?.departamento || ''})`);
  addLine();
  addText(`Vehículo (Placa): ${data.ticket.planilla.bus.placa}`);
  addLine();
  addText(`Marca/Modelo: ${data.ticket.planilla.bus.marca || ''} ${data.ticket.planilla.bus.modelo || ''}`);
  addLine();
  if (data.ticket.numeroAsiento) {
    addText(`Silla: ${data.ticket.numeroAsiento}`);
    addLine();
  }
  addText('Tipo de Servicio: Intermunicipal');
  addLine();
  addLine();
  
  // === FINANCIAL INFO ===
  addCommand(ESCPOSCommands.alignCenter);
  addCommand(ESCPOSCommands.dottedSeparator);
  addLine();
  addCommand(ESCPOSCommands.boldOn);
  addText('INFORMACIÓN FINANCIERA');
  addLine();
  addCommand(ESCPOSCommands.dottedSeparator);
  addLine();
  addCommand(ESCPOSCommands.boldOff);
  addCommand(ESCPOSCommands.alignLeft);
  addLine();
  
  addText(`Valor Neto Pasaje    ${formatCurrency(data.valorNeto)}`);
  addLine();
  addText(`Tasa Uso Terminal    ${formatCurrency(data.tasaTerminal)}`);
  addLine();
  addCommand(ESCPOSCommands.separator);
  addLine();
  addCommand(ESCPOSCommands.boldOn);
  addCommand(ESCPOSCommands.doubleHeight);
  addText(`TOTAL A PAGAR  ${formatCurrency(data.total)}`);
  addLine();
  addCommand(ESCPOSCommands.normalSize);
  addCommand(ESCPOSCommands.boldOff);
  addCommand(ESCPOSCommands.separator);
  addLine();
  addLine();
  
  // Payment method
  const formaPagoLabels: Record<string, string> = {
    'EFECTIVO': 'Contado (Efectivo)',
    'TARJETA': 'Contado (Tarjeta)',
    'TRANSFERENCIA': 'Contado (Transferencia)',
    'QR': 'Contado (Código QR)',
  };
  addText(`Forma de Pago: ${formaPagoLabels[data.ticket.formaPago] || data.ticket.formaPago}`);
  addLine();
  addLine();
  
  // === DIAN LEGAL INFO ===
  addCommand(ESCPOSCommands.alignCenter);
  addCommand(ESCPOSCommands.dottedSeparator);
  addLine();
  addCommand(ESCPOSCommands.boldOn);
  addText('INFORMACIÓN LEGAL DIAN');
  addLine();
  addCommand(ESCPOSCommands.dottedSeparator);
  addLine();
  addCommand(ESCPOSCommands.boldOff);
  addCommand(ESCPOSCommands.alignLeft);
  addLine();
  
  addText('CUDE:');
  addLine();
  // Split CUDE into chunks for readability
  const cudeChunks = data.cude.match(/.{1,32}/g) || [];
  cudeChunks.forEach(chunk => {
    addText(chunk);
    addLine();
  });
  addLine();
  
  addText('Rango de Numeración:');
  addLine();
  addText(data.rangoAutorizacion);
  addLine();
  addLine();
  
  // === QR CODE ===
  addCommand(ESCPOSCommands.alignCenter);
  addLine();
  addCommand(ESCPOSCommands.boldOn);
  addText('ESCANEA PARA VERIFICAR');
  addLine();
  addCommand(ESCPOSCommands.boldOff);
  addLine();
  
  // Build QR data URL
  const qrData = `https://verify.transveloz.com/ticket/${data.numeroFactura}?cude=${data.cude.substring(0, 16)}`;
  
  // QR Code ESC/POS Commands
  addCommand(ESCPOSCommands.qrModel);
  addCommand(ESCPOSCommands.qrSize(6)); // Size 6 for good readability
  addCommand(ESCPOSCommands.qrErrorCorrection);
  addCommand(ESCPOSCommands.qrStoreData(qrData));
  addCommand(ESCPOSCommands.qrPrint);
  addLine();
  addLine();
  
  // === FOOTER ===
  addCommand(ESCPOSCommands.alignCenter);
  addCommand(ESCPOSCommands.separator);
  addLine();
  addText('¡Gracias por viajar con nosotros!');
  addLine();
  addText('Conserve este tiquete hasta');
  addLine();
  addText('finalizar su viaje');
  addLine();
  addCommand(ESCPOSCommands.separator);
  addLine();
  
  // Feed 5 lines up before cut (more paper feed for clean cut)
  addCommand(ESCPOSCommands.feedLines(8)); // 8 lines total (5 extra + 3 original)
  addCommand(ESCPOSCommands.partialCut);
  
  // Combine all parts
  const totalLength = parts.reduce((sum, part) => sum + part.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const part of parts) {
    result.set(part, offset);
    offset += part.length;
  }
  
  return result;
}

// Extended navigator type for Web Serial API and WebUSB API
declare global {
  interface Navigator {
    serial?: {
      requestPort(options?: { filters?: { usbVendorId?: number }[] }): Promise<SerialPortInstance>;
      getPorts(): Promise<SerialPortInstance[]>;
    };
    usb?: {
      requestDevice(options: { filters: { vendorId?: number; productId?: number }[] }): Promise<USBDeviceInstance>;
      getDevices(): Promise<USBDeviceInstance[]>;
    };
  }
}

interface SerialPortInstance {
  open(options: { baudRate: number; dataBits?: number; stopBits?: number; parity?: string }): Promise<void>;
  close(): Promise<void>;
  writable?: WritableStream<Uint8Array>;
  readable?: ReadableStream<Uint8Array>;
  getInfo?(): { usbVendorId?: number; usbProductId?: number };
}

interface USBDeviceInstance {
  open(): Promise<void>;
  close(): Promise<void>;
  selectConfiguration(configurationValue: number): Promise<void>;
  claimInterface(interfaceNumber: number): Promise<void>;
  releaseInterface(interfaceNumber: number): Promise<void>;
  transferOut(endpointNumber: number, data: BufferSource): Promise<USBOutTransferResult>;
  configuration?: {
    interfaces: Array<{
      interfaceNumber: number;
      alternate: {
        endpoints: Array<{
          endpointNumber: number;
          direction: 'in' | 'out';
          type: 'bulk' | 'interrupt' | 'isochronous';
        }>;
      };
    }>;
  };
  productName?: string;
  manufacturerName?: string;
  vendorId: number;
  productId: number;
}

interface USBOutTransferResult {
  bytesWritten: number;
  status: 'ok' | 'stall' | 'babble';
}

// Connection type enum
export type PrinterConnectionType = 'serial' | 'usb' | 'none';

// Common thermal printer USB vendor IDs
const THERMAL_PRINTER_VENDORS = [
  0x04B8, // Epson
  0x0519, // Star Micronics
  0x0DD4, // Custom Engineering
  0x0FE6, // ICS Electronics (CH340)
  0x1A86, // QinHeng Electronics (CH340/CH341)
  0x067B, // Prolific (PL2303)
  0x0483, // STMicroelectronics
  0x1504, // Metapace
  0x0416, // Winbond
  0x0525, // Netchip Technology (USB gadget)
];

// Web Serial API and WebUSB interface for thermal printer
class ThermalPrinterService {
  private serialPort: SerialPortInstance | null = null;
  private usbDevice: USBDeviceInstance | null = null;
  private usbEndpoint: number = 0;
  private connectionType: PrinterConnectionType = 'none';
  private isConnectedStatus = false;
  
  // Check if Web Serial API is supported
  isSerialSupported(): boolean {
    return typeof navigator !== 'undefined' && 'serial' in navigator;
  }
  
  // Check if WebUSB API is supported
  isUSBSupported(): boolean {
    return typeof navigator !== 'undefined' && 'usb' in navigator;
  }
  
  // Check if any print API is supported
  isSupported(): boolean {
    return this.isSerialSupported() || this.isUSBSupported();
  }
  
  // Get current connection type
  getConnectionType(): PrinterConnectionType {
    return this.connectionType;
  }
  
  // Connect to the printer via Web Serial (for /dev/ttyUSB*, /dev/ttyACM*)
  async connectSerial(): Promise<boolean> {
    if (!this.isSerialSupported() || !navigator.serial) {
      console.error('Web Serial API not supported');
      return false;
    }
    
    try {
      // Request port with vendor filters
      this.serialPort = await navigator.serial.requestPort({
        filters: THERMAL_PRINTER_VENDORS.map(vendorId => ({ usbVendorId: vendorId }))
      });
      
      // Open the port with typical thermal printer settings
      await this.serialPort.open({
        baudRate: 9600,
        dataBits: 8,
        stopBits: 1,
        parity: 'none',
      });
      
      this.connectionType = 'serial';
      this.isConnectedStatus = true;
      console.log('Printer connected via Web Serial API');
      return true;
    } catch (error) {
      console.error('Failed to connect via Serial:', error);
      return false;
    }
  }
  
  // Connect to the printer via WebUSB (for /dev/usb/lp* on Ubuntu - grupo lp)
  async connectUSB(): Promise<boolean> {
    if (!this.isUSBSupported() || !navigator.usb) {
      console.error('WebUSB API not supported');
      return false;
    }
    
    try {
      // Request USB device - user will see a dialog to select printer
      this.usbDevice = await navigator.usb.requestDevice({
        filters: THERMAL_PRINTER_VENDORS.map(vendorId => ({ vendorId }))
      });
      
      await this.usbDevice.open();
      
      // Select the first configuration (usually configuration 1)
      if (this.usbDevice.configuration === null || this.usbDevice.configuration === undefined) {
        await this.usbDevice.selectConfiguration(1);
      }
      
      // Find the printer interface (usually class 7 = Printer)
      const printerInterface = this.usbDevice.configuration?.interfaces.find(iface => 
        iface.alternate.endpoints.some(ep => ep.direction === 'out' && ep.type === 'bulk')
      );
      
      if (!printerInterface) {
        throw new Error('No se encontró interfaz de impresora válida');
      }
      
      await this.usbDevice.claimInterface(printerInterface.interfaceNumber);
      
      // Find the OUT endpoint for sending data
      const outEndpoint = printerInterface.alternate.endpoints.find(
        ep => ep.direction === 'out' && ep.type === 'bulk'
      );
      
      if (!outEndpoint) {
        throw new Error('No se encontró endpoint de salida');
      }
      
      this.usbEndpoint = outEndpoint.endpointNumber;
      this.connectionType = 'usb';
      this.isConnectedStatus = true;
      
      console.log(`Printer connected via WebUSB: ${this.usbDevice.productName || 'Unknown'}`);
      console.log(`  Vendor: ${this.usbDevice.manufacturerName || 'Unknown'} (0x${this.usbDevice.vendorId.toString(16).toUpperCase()})`);
      console.log(`  Endpoint: ${this.usbEndpoint}`);
      
      return true;
    } catch (error) {
      console.error('Failed to connect via USB:', error);
      return false;
    }
  }
  
  // Try to connect - first USB (for Ubuntu /dev/usb/lp*), then Serial as fallback
  async connect(): Promise<boolean> {
    // Try WebUSB first (works with /dev/usb/lp* on Ubuntu - grupo lp)
    if (this.isUSBSupported()) {
      console.log('Attempting WebUSB connection (Ubuntu /dev/usb/lp*)...');
      const usbConnected = await this.connectUSB();
      if (usbConnected) return true;
    }
    
    // Fall back to Web Serial (works with /dev/ttyUSB*, /dev/ttyACM*)
    if (this.isSerialSupported()) {
      console.log('Attempting Web Serial connection...');
      const serialConnected = await this.connectSerial();
      if (serialConnected) return true;
    }
    
    console.error('No connection method available or user cancelled');
    return false;
  }
  
  // Disconnect from the printer
  async disconnect(): Promise<void> {
    try {
      if (this.connectionType === 'serial' && this.serialPort) {
        await this.serialPort.close();
        this.serialPort = null;
      } else if (this.connectionType === 'usb' && this.usbDevice) {
        await this.usbDevice.close();
        this.usbDevice = null;
      }
    } catch (error) {
      console.error('Error disconnecting:', error);
    }
    
    this.connectionType = 'none';
    this.isConnectedStatus = false;
  }
  
  // Get connection status
  getConnectionStatus(): boolean {
    return this.isConnectedStatus;
  }
  
  // Print raw bytes
  async printBytes(data: Uint8Array): Promise<boolean> {
    if (!this.isConnectedStatus) {
      console.error('Printer not connected');
      return false;
    }
    
    try {
      if (this.connectionType === 'serial' && this.serialPort) {
        const writer = this.serialPort.writable?.getWriter();
        if (!writer) {
          console.error('Cannot get serial writer');
          return false;
        }
        await writer.write(data);
        writer.releaseLock();
        return true;
        
      } else if (this.connectionType === 'usb' && this.usbDevice) {
        // Create a fresh ArrayBuffer copy for WebUSB compatibility
        const buffer = new ArrayBuffer(data.length);
        new Uint8Array(buffer).set(data);
        const result = await this.usbDevice.transferOut(this.usbEndpoint, buffer);
        console.log(`USB transfer: ${result.bytesWritten} bytes written, status: ${result.status}`);
        return result.status === 'ok';
      }
      
      return false;
    } catch (error) {
      console.error('Failed to print:', error);
      return false;
    }
  }
  
  // Print ticket invoice
  async printInvoice(ticket: Ticket): Promise<boolean> {
    const invoiceData = buildInvoiceData(ticket);
    const invoiceBytes = buildInvoiceBytes(invoiceData);
    return this.printBytes(invoiceBytes);
  }
}

// Singleton instance
export const thermalPrinter = new ThermalPrinterService();

// Generate printable HTML for fallback/preview
export function generateInvoiceHTML(ticket: Ticket): string {
  const data = buildInvoiceData(ticket);
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Tiquete ${data.numeroFactura}</title>
  <style>
    @page {
      size: 80mm auto;
      margin: 0;
    }
    body {
      font-family: 'Courier New', monospace;
      font-size: 12px;
      width: 72mm;
      margin: 4mm;
      line-height: 1.3;
    }
    .center { text-align: center; }
    .bold { font-weight: bold; }
    .double { font-size: 16px; font-weight: bold; }
    .separator { border-top: 1px dashed #000; margin: 8px 0; }
    .total { font-size: 14px; font-weight: bold; }
    .small { font-size: 10px; }
    h1 { font-size: 14px; margin: 0; }
    h2 { font-size: 12px; margin: 8px 0 4px; }
    p { margin: 2px 0; }
    .row { display: flex; justify-content: space-between; }
  </style>
</head>
<body>
  <div class="center">
    <h1>${data.empresa.razonSocial}</h1>
    <p>NIT: ${data.empresa.nit}</p>
    <p>${data.empresa.direccion}</p>
    <p>Tel: ${data.empresa.telefono}</p>
    <p>${data.empresa.correo}</p>
    <p>Régimen: ${data.empresa.regimen}</p>
  </div>
  
  <div class="separator"></div>
  <div class="center bold">
    <p>TIQUETE DE TRANSPORTE</p>
    <p>DE PASAJEROS ELECTRÓNICO</p>
  </div>
  <div class="separator"></div>
  
  <p class="bold">Número: ${data.numeroFactura}</p>
  <p>Fecha Emisión: ${formatDate(data.fechaEmision.toISOString())}</p>
  <p>Hora: ${formatTime(data.fechaEmision.toISOString())}</p>
  <p>Fecha Viaje: ${data.ticket.planilla.fechaDespacho}</p>
  <p>Hora Salida: ${data.ticket.planilla.horaProgramada}</p>
  
  <div class="separator"></div>
  <h2 class="center">DATOS DEL PASAJERO</h2>
  <div class="separator"></div>
  
  <p>Nombre: ${data.ticket.pasajero.nombreCompleto}</p>
  <p>Identificación: ${data.ticket.pasajero.numeroDocumento}</p>
  ${data.ticket.pasajero.telefono ? `<p>Teléfono: ${data.ticket.pasajero.telefono}</p>` : ''}
  
  <div class="separator"></div>
  <h2 class="center">DETALLE DEL SERVICIO</h2>
  <div class="separator"></div>
  
  <p>Modo: Terrestre Automotor</p>
  <p>Origen: ${data.ticket.ruta.municipioOrigen?.nombre || 'N/A'} (${data.ticket.ruta.municipioOrigen?.departamento || ''})</p>
  <p>Destino: ${data.ticket.ruta.municipioDestino?.nombre || 'N/A'} (${data.ticket.ruta.municipioDestino?.departamento || ''})</p>
  <p>Vehículo (Placa): ${data.ticket.planilla.bus.placa}</p>
  <p>Marca/Modelo: ${data.ticket.planilla.bus.marca || ''} ${data.ticket.planilla.bus.modelo || ''}</p>
  ${data.ticket.numeroAsiento ? `<p>Silla: ${data.ticket.numeroAsiento}</p>` : ''}
  <p>Tipo de Servicio: Intermunicipal</p>
  
  <div class="separator"></div>
  <h2 class="center">INFORMACIÓN FINANCIERA</h2>
  <div class="separator"></div>
  
  <div class="row">
    <span>Valor Neto Pasaje</span>
    <span>${formatCurrency(data.valorNeto)}</span>
  </div>
  <div class="row">
    <span>Tasa Uso Terminal</span>
    <span>${formatCurrency(data.tasaTerminal)}</span>
  </div>
  <div class="separator"></div>
  <div class="row total">
    <span>TOTAL A PAGAR</span>
    <span>${formatCurrency(data.total)}</span>
  </div>
  <div class="separator"></div>
  
  <p>Forma de Pago: ${
    data.ticket.formaPago === 'EFECTIVO' ? 'Contado (Efectivo)' :
    data.ticket.formaPago === 'TARJETA' ? 'Contado (Tarjeta)' :
    data.ticket.formaPago === 'TRANSFERENCIA' ? 'Contado (Transferencia)' :
    'Contado (Código QR)'
  }</p>
  
  <div class="separator"></div>
  <h2 class="center">INFORMACIÓN LEGAL DIAN</h2>
  <div class="separator"></div>
  
  <p class="small">CUDE:</p>
  <p class="small" style="word-break: break-all;">${data.cude}</p>
  <p class="small">Rango de Numeración:</p>
  <p class="small">${data.rangoAutorizacion}</p>
  
  <div class="separator"></div>
  <div class="center">
    <p class="bold">ESCANEA PARA VERIFICAR</p>
    <div id="qrcode" style="margin: 10px auto;"></div>
  </div>
  <div class="separator"></div>
  
  <div class="center">
    <p>¡Gracias por viajar con nosotros!</p>
    <p>Conserve este tiquete hasta</p>
    <p>finalizar su viaje</p>
  </div>
  <div class="separator"></div>
  
  <script src="https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js"></script>
  <script>
    QRCode.toCanvas(document.createElement('canvas'), 'https://verify.transveloz.com/ticket/${data.numeroFactura}?cude=${data.cude.substring(0, 16)}', { width: 120 }, function(err, canvas) {
      if (!err) document.getElementById('qrcode').appendChild(canvas);
    });
  </script>
</body>
</html>`;
}
