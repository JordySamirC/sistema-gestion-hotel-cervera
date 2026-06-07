export interface CategoriaGasto {
  id: number;
  nombre: string;
  descripcion?: string;
  activo: boolean;
  orden: number;
}

export interface TipoGasto {
  id: number;
  nombre: string;
}

export interface GastoResponse {
  id: string;
  fechaGasto: string;
  descripcion: string;
  
  categoriaId: number;
  categoriaNombre: string;
  
  tipoGastoId: number;
  tipoGastoNombre: string;
  
  monto: number;
  observaciones?: string;
  estado: string; // 'ACTIVO' | 'ANULADO'
  
  creadoPor: string;
  creadoPorNombre: string;
  fechaCreacion: string;
  
  actualizadoPor?: string;
  actualizadoPorNombre?: string;
  fechaActualizacion: string;
  
  fechaAnulacion?: string;
  anuladoPor?: string;
  anuladoPorNombre?: string;
  motivoAnulacion?: string;
}

export interface GastoRequest {
  fechaGasto: string;
  descripcion: string;
  categoriaId: number;
  tipoGastoId: number;
  monto: number;
  observaciones?: string;
  creadoPor: string;
}
