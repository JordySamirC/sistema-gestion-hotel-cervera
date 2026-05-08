export interface LimpiezaResponse {
  id: string;
  habitacionId: string;
  habitacionNumero: string;
  usuarioId: string;
  usuarioNombre: string;
  fechaInicio: string;
  fechaFin: string | null;
  duracionSegundos: number | null;
  createdAt: string;
}

export interface IniciarLimpiezaRequest {
  habitacionId: string;
  usuarioId: string;
}
