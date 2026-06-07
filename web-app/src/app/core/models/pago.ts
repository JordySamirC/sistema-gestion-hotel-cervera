export interface PagoResponse {
  id: string;
  estadiaId: string;
  comprobanteNumero: string;
  fechaPago: string;
  montoTotal: number;
  metodoPago: string;
  tipoComprobante: string;
  serie: string;
  numero: number;
  
  // Datos del cliente
  clienteNombre?: string;
  clienteTipoDocumento?: string;
  clienteDocumento?: string;
  clienteRuc?: string;
  clienteRazonSocial?: string;

  // Datos del emisor
  emisorRuc: string;
  emisorRazonSocial: string;

  referenciaPago?: string;
  observaciones?: string;
  
  montoNeto: number;
  igv: number;
  fechaCreacion: string;

  // Trazabilidad
  modoPago?: string;
  descripcionHabitaciones?: string;
  cantidadHabitaciones?: number;
  grupoId?: string;
}

export interface PagoRequest {
  estadiaId: string;
  montoTotal: number;
  metodoPago: string;
  tipoComprobante: string; // 'BOLETA' o 'FACTURA'
  serie: string; // 'B001' o 'F001'
  
  // Datos del cliente
  clienteNombre?: string;
  clienteTipoDocumento?: string;
  clienteDocumento?: string;
  clienteRuc?: string;
  clienteRazonSocial?: string;

  referenciaPago?: string;
  observaciones?: string;
  
  montoNeto: number;
  igv: number;
  creadoPor?: string;

  // Trazabilidad
  modoPago?: string;
  descripcionHabitaciones?: string;
  cantidadHabitaciones?: number;
  grupoId?: string;
  estadiaIds?: string[];
}

export interface PagoGrupoRequest extends Omit<PagoRequest, 'estadiaId'> {
  grupoId: string;
}
