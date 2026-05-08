export interface GastoResponse {
  id: string;
  fechaGasto: string;
  descripcion: string;
  categoria: string;
  monto: number;
  esFijo: boolean;
  creadoPor: string;
  creadoPorNombre: string;
  createdAt: string;
  updatedAt: string;
}

export interface GastoRequest {
  fechaGasto: string;
  descripcion: string;
  categoria: string;
  monto: number;
  esFijo?: boolean;
  creadoPor: string;
}
