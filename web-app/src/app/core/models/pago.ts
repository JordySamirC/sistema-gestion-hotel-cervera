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
  rucRazonSocial: string | null;
  montoNeto: number;
  igv: number;
  createdAt: string;
}

export interface PagoRequest {
  estadiaId: string;
  comprobanteNumero: string;
  montoTotal: number;
  metodoPago: string;
  tipoComprobante: string;
  serie: string;
  numero: number;
  rucRazonSocial?: string;
  montoNeto: number;
  igv: number;
}
