export interface ClienteResponse {
  id: string;
  tipoDocumento: string;
  numeroDocumento: string;
  nombres: string;
  apellidos: string;
  nacionalidad: string;
  telefono: string;
  email: string;
  vecesHospedado: number;
  createdAt: string;
  updatedAt: string;
}

export interface ClienteRequest {
  tipoDocumento: string;
  numeroDocumento: string;
  nombres: string;
  apellidos: string;
  nacionalidad: string;
  telefono?: string;
  email?: string;
}
