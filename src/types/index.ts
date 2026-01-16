// ============================================
// FRONTEND TYPES
// ============================================

export interface Municipio {
  id: number;
  nombre: string;
  departamento: string;
  activo: boolean;
}

export interface Empresa {
  id: number;
  nit: string;
  razonSocial: string;
  activo: boolean;
}

export interface Ruta {
  id: number;
  municipioOrigenId: number;
  municipioDestinoId: number;
  valorTarifa: number;
  distanciaKm?: number;
  tiempoEstimadoMinutos?: number;
  activo: boolean;
  municipioOrigen?: Municipio;
  municipioDestino?: Municipio;
}

export interface Conductor {
  id: number;
  numeroDocumento: string;
  nombreCompleto: string;
  licenciaNumero: string;
  activo: boolean;
}

export type EstadoBus = 'DISPONIBLE' | 'DESPACHADO' | 'EN_RUTA' | 'MANTENIMIENTO' | 'INACTIVO';

export interface Bus {
  id: number;
  placa: string;
  capacidad: number;
  marca?: string;
  modelo?: string;
  estado: EstadoBus;
  conductorAsignado?: Conductor;
}

export interface Pasajero {
  id: number;
  numeroDocumento: string;
  tipoDocumento: 'CC' | 'CE' | 'TI' | 'PA' | 'RC';
  nombreCompleto: string;
  telefono?: string;
}

export type EstadoPlanilla = 'PROGRAMADO' | 'DESPACHADO' | 'EN_RUTA' | 'FINALIZADO' | 'CANCELADO';

export interface PlanillaDespacho {
  id: number;
  numeroPlanilla: string;
  bus: Bus;
  conductor: Conductor;
  ruta: Ruta;
  fechaDespacho: string;
  horaProgramada: string;
  estado: EstadoPlanilla;
  asientosOcupados: number;
}

export type FormaPago = 'EFECTIVO' | 'TARJETA' | 'TRANSFERENCIA' | 'QR';
export type EstadoTicket = 'ACTIVO' | 'USADO' | 'CANCELADO' | 'REEMBOLSADO';

export interface Ticket {
  id: number;
  numeroTicket: string;
  planilla: PlanillaDespacho;
  pasajero: Pasajero;
  ruta: Ruta;
  numeroAsiento?: number;
  valorPagado: number;
  formaPago: FormaPago;
  estado: EstadoTicket;
  fechaVenta: string;
}

export interface CreateTicketDTO {
  planillaDespachoId: number;
  pasajeroDocumento: string;
  pasajeroNombre: string;
  pasajeroTelefono?: string;
  numeroAsiento?: number;
  formaPago: FormaPago;
}

export interface Usuario {
  id: number;
  nombreCompleto: string;
  email: string;
  tipoVinculacion: 'EMPLEADO' | 'CONCESION';
  municipio: Municipio;
}
