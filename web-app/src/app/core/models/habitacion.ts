export interface HabitacionResponse {
  id: string;
  numero: string;
  piso: number;
  tipoId: string;
  tipoNombre: string;
  capacidadMax: number;
  estadoActual: string;
  notas: string;
  fechaCreacion: string;
  fechaActualizacion: string;
}

export interface HabitacionRequest {
  numero: string;
  piso: number;
  tipoId: string;
  estado?: string;
  notas?: string;
}

export interface CambiarEstadoHabitacionRequest {
  estadoActual: string;
}

export interface TipoHabitacionResponse {
  id: string;
  nombre: string;
  capacidadMax: number;
  configuracionCamas: string;
  descripcion: string;
  fechaCreacion: string;
  fechaActualizacion: string;
}

export interface TipoHabitacionRequest {
  nombre: string;
  capacidadMax: number;
  configuracionCamas?: string;
  descripcion?: string;
}

export interface PrecioHistoricoResponse {
  id: string;
  tipoHabitacionId: string;
  tipoHabitacionNombre: string;
  precioNoche: number;
  fechaInicio: string;
  fechaFin: string | null;
  fechaCreacion: string;
  creadoPor: string;
}

export interface PrecioHistoricoRequest {
  tipoHabitacionId: string;
  precioNoche: number;
  fechaInicio: string;
  fechaFin?: string;
  creadoPor: string;
}
