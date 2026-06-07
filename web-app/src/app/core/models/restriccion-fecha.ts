export interface RestriccionFecha {
  id?: number;
  tipo: string;
  fechaInicio: string;
  fechaFin?: string | null;
  minLos?: number | null;
  maxLos?: number | null;
  diasCheckIn?: string | null;
  diasCheckOut?: string | null;
  motivo?: string | null;
  activo?: boolean;
  fechaCreacion?: string;
  fechaActualizacion?: string;
}
