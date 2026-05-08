export interface HabitacionResponse {
  id: string;
  numero: string;
  piso: number;
  tipoId: string;
  tipoNombre: string;
  estadoActual: string;
  notas: string;
  createdAt: string;
  updatedAt: string;
}

export interface HabitacionRequest {
  numero: string;
  piso: number;
  tipoId: string;
  notas?: string;
}

export interface CambiarEstadoHabitacionRequest {
  estadoActual: string;
}

export interface TipoHabitacionResponse {
  id: string;
  nombre: string;
  capacidadMax: number;
  descripcion: string;
  createdAt: string;
  updatedAt: string;
}

export interface TipoHabitacionRequest {
  nombre: string;
  capacidadMax: number;
  descripcion?: string;
}

export interface PrecioHistoricoResponse {
  id: string;
  tipoHabitacionId: string;
  tipoHabitacionNombre: string;
  precioNoche: number;
  fechaInicio: string;
  fechaFin: string | null;
  createdAt: string;
  createdBy: string;
}

export interface PrecioHistoricoRequest {
  tipoHabitacionId: string;
  precioNoche: number;
  fechaInicio: string;
  fechaFin?: string;
  createdBy: string;
}
