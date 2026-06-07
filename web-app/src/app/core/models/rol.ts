export interface RolResponse {
  id: string;
  nombre: string;
  descripcion: string;
  fechaCreacion: string;
  fechaActualizacion: string;
}

export interface RolRequest {
  nombre: string;
  descripcion?: string;
}
