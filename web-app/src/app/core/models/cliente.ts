export interface ClienteResponse {
  id: string;
  tipoDocumento: string;
  numeroDocumento: string;
  nombres: string;
  apellidos: string;
  nacionalidad: string;
  genero: string;
  estado: string;
  telefono: string;
  email: string;
  vecesHospedado: number;
  fechaNacimiento: string;
  createdAt: string;
  updatedAt: string;
}

export interface ClienteRequest {
  tipoDocumento: string;
  numeroDocumento: string;
  nombres: string;
  apellidos: string;
  nacionalidad: string;
  genero: string;
  telefono: string;
  email: string | null;
  fechaNacimiento: string | null;
}
