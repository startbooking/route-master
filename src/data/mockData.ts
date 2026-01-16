// ============================================
// MOCK DATA - Para desarrollo frontend sin backend
// ============================================

import { 
  Municipio, 
  Empresa, 
  Ruta, 
  Conductor, 
  Bus, 
  PlanillaDespacho, 
  Pasajero,
  Ticket,
  Usuario 
} from '@/types';

export const mockMunicipios: Municipio[] = [
  { id: 1, nombre: 'Bogotá', departamento: 'Cundinamarca', activo: true },
  { id: 2, nombre: 'Medellín', departamento: 'Antioquia', activo: true },
  { id: 3, nombre: 'Cali', departamento: 'Valle del Cauca', activo: true },
  { id: 4, nombre: 'Barranquilla', departamento: 'Atlántico', activo: true },
  { id: 5, nombre: 'Cartagena', departamento: 'Bolívar', activo: true },
  { id: 6, nombre: 'Bucaramanga', departamento: 'Santander', activo: true },
];

export const mockEmpresas: Empresa[] = [
  { id: 1, nit: '900123456-1', razonSocial: 'Transportes Ejemplo S.A.', activo: true },
  { id: 2, nit: '900789012-3', razonSocial: 'Flota Nacional Ltda.', activo: true },
];

export const mockConductores: Conductor[] = [
  { id: 1, numeroDocumento: '12345678', nombreCompleto: 'Carlos Ramírez García', licenciaNumero: 'C1-12345', activo: true },
  { id: 2, numeroDocumento: '87654321', nombreCompleto: 'María López Hernández', licenciaNumero: 'C1-67890', activo: true },
  { id: 3, numeroDocumento: '11223344', nombreCompleto: 'José Martínez Ruiz', licenciaNumero: 'C1-11223', activo: true },
];

export const mockRutas: Ruta[] = [
  { 
    id: 1, 
    municipioOrigenId: 1, 
    municipioDestinoId: 2, 
    valorTarifa: 85000, 
    distanciaKm: 420, 
    tiempoEstimadoMinutos: 540,
    activo: true,
    municipioOrigen: mockMunicipios[0],
    municipioDestino: mockMunicipios[1],
  },
  { 
    id: 2, 
    municipioOrigenId: 1, 
    municipioDestinoId: 3, 
    valorTarifa: 95000, 
    distanciaKm: 480, 
    tiempoEstimadoMinutos: 600,
    activo: true,
    municipioOrigen: mockMunicipios[0],
    municipioDestino: mockMunicipios[2],
  },
  { 
    id: 3, 
    municipioOrigenId: 2, 
    municipioDestinoId: 3, 
    valorTarifa: 75000, 
    distanciaKm: 350, 
    tiempoEstimadoMinutos: 420,
    activo: true,
    municipioOrigen: mockMunicipios[1],
    municipioDestino: mockMunicipios[2],
  },
  { 
    id: 4, 
    municipioOrigenId: 1, 
    municipioDestinoId: 6, 
    valorTarifa: 65000, 
    distanciaKm: 380, 
    tiempoEstimadoMinutos: 480,
    activo: true,
    municipioOrigen: mockMunicipios[0],
    municipioDestino: mockMunicipios[5],
  },
];

export const mockBuses: Bus[] = [
  { id: 1, placa: 'ABC-123', capacidad: 40, marca: 'Mercedes-Benz', modelo: 'OF-1721', estado: 'DESPACHADO', conductorAsignado: mockConductores[0] },
  { id: 2, placa: 'DEF-456', capacidad: 42, marca: 'Volvo', modelo: 'B7R', estado: 'DESPACHADO', conductorAsignado: mockConductores[1] },
  { id: 3, placa: 'GHI-789', capacidad: 38, marca: 'Scania', modelo: 'K310', estado: 'DISPONIBLE', conductorAsignado: undefined },
  { id: 4, placa: 'JKL-012', capacidad: 45, marca: 'Mercedes-Benz', modelo: 'O-500', estado: 'MANTENIMIENTO', conductorAsignado: mockConductores[2] },
];

export const mockPlanillas: PlanillaDespacho[] = [
  {
    id: 1,
    numeroPlanilla: 'PL-2024-0001',
    bus: mockBuses[0],
    conductor: mockConductores[0],
    ruta: mockRutas[0],
    fechaDespacho: '2024-01-15',
    horaProgramada: '06:00',
    estado: 'DESPACHADO',
    asientosOcupados: 12,
  },
  {
    id: 2,
    numeroPlanilla: 'PL-2024-0002',
    bus: mockBuses[1],
    conductor: mockConductores[1],
    ruta: mockRutas[1],
    fechaDespacho: '2024-01-15',
    horaProgramada: '08:00',
    estado: 'DESPACHADO',
    asientosOcupados: 8,
  },
  {
    id: 3,
    numeroPlanilla: 'PL-2024-0003',
    bus: mockBuses[2],
    conductor: mockConductores[2],
    ruta: mockRutas[2],
    fechaDespacho: '2024-01-15',
    horaProgramada: '10:00',
    estado: 'PROGRAMADO',
    asientosOcupados: 0,
  },
];

export const mockPasajeros: Pasajero[] = [
  { id: 1, numeroDocumento: '1001234567', tipoDocumento: 'CC', nombreCompleto: 'Ana María Torres', telefono: '3001234567' },
  { id: 2, numeroDocumento: '1007654321', tipoDocumento: 'CC', nombreCompleto: 'Pedro González Silva', telefono: '3109876543' },
];

export const mockTickets: Ticket[] = [
  {
    id: 1,
    numeroTicket: 'TK-2024-000001',
    planilla: mockPlanillas[0],
    pasajero: mockPasajeros[0],
    ruta: mockRutas[0],
    numeroAsiento: 5,
    valorPagado: 85000,
    formaPago: 'EFECTIVO',
    estado: 'ACTIVO',
    fechaVenta: '2024-01-15T05:45:00',
  },
];

export const mockUsuario: Usuario = {
  id: 1,
  nombreCompleto: 'Juan Pérez Vendedor',
  email: 'juan.perez@transporte.com',
  tipoVinculacion: 'EMPLEADO',
  municipio: mockMunicipios[0],
};

// Función para generar número de ticket
let ticketCounter = mockTickets.length;
export const generateTicketNumber = (): string => {
  ticketCounter++;
  return `TK-2024-${String(ticketCounter).padStart(6, '0')}`;
};

// Función para obtener asientos ocupados de una planilla
export const getAsientosOcupados = (planillaId: number): number[] => {
  return mockTickets
    .filter(t => t.planilla.id === planillaId && t.estado === 'ACTIVO')
    .map(t => t.numeroAsiento)
    .filter((a): a is number => a !== undefined);
};
