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
  fechaCreacion: string;
  fechaActualizacion: string;
  grupoId?: string;
  nombreGrupo?: string;
  detalles: ReservaDetalleResponse[];
  huespedes: ReservaHuespedResponse[];
  precioTotal?: number;
}

export interface ReservaHuespedResponse {
  id: string;
  reservaId: string;
  clienteId: string;
  clienteNombre: string;
  clienteDocumento: string;
  esTitular: boolean;
  fechaCreacion: string;
}

export interface GrupoResponse {
  id: string;
  nombreGrupo: string;
  responsablePagoId: string;
  responsablePagoNombre: string;
  fechaIngreso: string;
  fechaSalida: string;
  estado: string;
  canalVentaNombre: string;
  canalVentaIcono: string;
  canalVentaOtro: string;
  creadoPor: string;
  creadoPorNombre: string;
  fechaCreacion: string;
  fechaActualizacion: string;
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
  tipoNombre: string;
  capacidadMax: number;
  precioAplicado: number;
  fechaCreacion: string;
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
  fechaIngreso: string;
  fechaSalida: string | null;
  noches: number;
  montoTotal: number;
  estado: string;
  fechaCreacion: string;
  fechaActualizacion: string;
}

export interface ActualizarReservaRequest {
  fechaIngreso?: string;
  fechaSalida?: string;
  adultos?: number;
  ninos?: number;
}

export interface ExtenderReservaRequest {
  nuevaFechaSalida: string;
}

export interface PanelReservaItem {
  id: string;
  tipo: 'INDIVIDUAL' | 'GRUPO' | 'HIJA';
  codigo: string;
  cliente: string;
  fechaIngreso: string;
  fechaSalida: string;
  grupoNombre: string | null;
  estado: string;
  hijas?: PanelReservaItem[];
  expandido?: boolean;
  precioTotal?: number;
  habitacionNumero?: string;
}

export interface CheckInRequest {
  reservaId: string;
  fechaIngreso?: string;
}

export interface CheckOutRequest {
  estadiaId: string;
  fechaSalida?: string;
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

export interface ExtenderGrupoRequest {
  nuevaFechaSalida: string;
}

export interface CancelarGrupoRequest {
  motivoCancelacion: string;
  observaciones?: string;
}

export interface AgregarHuespedRequest {
  clienteId: string;
}

export interface CambiarHabitacionRequest {
  nuevaHabitacionId: string;
}
