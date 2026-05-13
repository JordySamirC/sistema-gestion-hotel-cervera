export interface CanalVenta {
  id: number;
  nombre: string;
  icono: string;
  activo: boolean;
  orden: number;
}

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
  observacionesCancelacion: string | null;
  fechaCancelacion: string | null;
  canceladoPor: string | null;
  canceladoPorNombre: string | null;
  creadoPor: string;
  creadoPorNombre: string;
  adultos: number;
  ninos: number;
  canalVentaNombre: string;
  canalVentaIcono: string;
  canalVentaOtro: string;
  createdAt: string;
  updatedAt: string;
  grupoId?: string;
  nombreGrupo?: string;
  detalles: ReservaDetalleResponse[];
  huespedes: ReservaHuespedResponse[];
}

export interface ReservaHuespedResponse {
  id: string;
  reservaId: string;
  clienteId: string;
  clienteNombre: string;
  clienteDocumento: string;
  esTitular: boolean;
  createdAt: string;
}

export interface GrupoResponse {
  id: string;
  nombreGrupo: string;
  responsablePagoId: string;
  responsablePagoNombre: string;
  fechaIngreso: string;
  fechaSalida: string;
  canalVentaNombre: string;
  canalVentaIcono: string;
  canalVentaOtro: string;
  creadoPor: string;
  creadoPorNombre: string;
  createdAt: string;
  updatedAt: string;
  reservas: ReservaResponse[];
}

export interface HuespedRequest {
  clienteId: string;
  esTitular: boolean;
}

export interface ReservaEnGrupoRequest {
  habitacionId: string;
  adultos: number;
  ninos?: number;
  huespedes: HuespedRequest[];
}

export interface GrupoRequest {
  nombreGrupo: string;
  responsablePagoId: string;
  fechaIngreso: string;
  fechaSalida: string;
  canalVentaId: number;
  canalVentaOtro?: string;
  reservas: ReservaEnGrupoRequest[];
  creadoPor: string;
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
  ninos?: number;
  canalVentaId: number;
  canalVentaOtro?: string;
  habitacionesIds: string[];
}

export interface ReservaDetalleRequest {
  habitacionId: string;
}

export interface CancelarReservaRequest {
  motivoCancelacion: string;
  observaciones?: string;
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

export interface PanelReservaItem {
  tipo: 'INDIVIDUAL' | 'GRUPO' | 'HIJA';
  codigo: string;
  cliente: string;
  fechaIngreso: string;
  fechaSalida: string;
  grupoNombre: string | null;
  estado: string;
  hijas?: PanelReservaItem[];
  expandido?: boolean;
}

export interface CheckInRequest {
  reservaId: string;
  fechaCheckIn?: string;
}

export interface CheckOutRequest {
  estadiaId: string;
  fechaCheckOut?: string;
}

export interface AddHabitacionRequest {
  habitacionId: string;
  adultos?: number;
  ninos?: number;
  huespedes: HuespedRequest[];
}

export interface GrupoUpdateRequest {
  nombreGrupo?: string;
  responsablePagoId?: string;
  fechaIngreso?: string;
  fechaSalida?: string;
  canalVentaId?: number;
  canalVentaOtro?: string;
}
