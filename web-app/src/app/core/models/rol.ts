export interface RolResponse {
  id: string;
  nombre: string;
  descripcion: string;
  createdAt: string;
  updatedAt: string;
}

export interface RolRequest {
  nombre: string;
  descripcion?: string;
}
