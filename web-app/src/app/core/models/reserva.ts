export interface ReservaResponse {
  id: string;
  codigo: string;
  fechaReserva: string;
  fechaIngreso: string;
  fechaSalida: string;
  clienteId: string;
  clienteNombre: string;
  estado: string;
  motivoCancelacion: string | null;
  creadoPor: string;
  creadoPorNombre: string;
  adultos: number;
  adolescentes: number;
  ninos: number;
  bebes: number;
  canalVenta: string;
  tipoCliente: string;
  cambiosReserva: number;
  solicitudesEspeciales: number;
  cancelacionesPrevias: number;
  createdAt: string;
  updatedAt: string;
  detalles: ReservaDetalleResponse[];
}

export interface ReservaDetalleResponse {
  id: string;
  reservaId: string;
  habitacionId: string;
  habitacionNumero: string;
  precioAplicado: number;
  createdAt: string;
}

export interface ReservaRequest {
  fechaIngreso: string;
  fechaSalida: string;
  clienteId: string;
  creadoPor: string;
  adultos: number;
  adolescentes?: number;
  ninos?: number;
  bebes?: number;
  canalVenta?: string;
  tipoCliente?: string;
  habitacionesIds: string[];
}

export interface ReservaDetalleRequest {
  habitacionId: string;
}

export interface CancelarReservaRequest {
  motivoCancelacion: string;
}

export interface EstadiaResponse {
  id: string;
  reservaId: string;
  reservaCodigo: string;
  fechaCheckIn: string;
  fechaCheckOut: string | null;
  noches: number;
  montoTotal: number;
  estado: string;
  createdAt: string;
  updatedAt: string;
}

export interface CheckInRequest {
  reservaId: string;
  fechaCheckIn?: string;
}

export interface CheckOutRequest {
  estadiaId: string;
  fechaCheckOut?: string;
}
