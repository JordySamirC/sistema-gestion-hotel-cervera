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
  correoElectronico: string;
  vecesHospedado: number;
  fechaNacimiento: string;
  fechaCreacion: string;
  fechaActualizacion: string;
}

export interface ClienteRequest {
  tipoDocumento: string;
  numeroDocumento: string;
  nombres: string;
  apellidos: string;
  nacionalidad: string;
  genero: string;
  telefono: string;
  correoElectronico: string | null;
  fechaNacimiento: string | null;
}
