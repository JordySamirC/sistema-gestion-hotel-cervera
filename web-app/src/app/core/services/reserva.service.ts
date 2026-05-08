import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ReservaResponse, ReservaRequest, ReservaDetalleResponse, ReservaDetalleRequest, CancelarReservaRequest, EstadiaResponse, CheckInRequest, CheckOutRequest } from '../models/reserva';
import { ApiResponse } from '../models/api-response';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class ReservaService extends ApiService {
  constructor(private http: HttpClient) {
    super();
  }

  getAll(estado?: string): Observable<ReservaResponse[]> {
    let params: any = {};
    if (estado) params.estado = estado;
    return this.http.get<ReservaResponse[]>(`${this.baseUrl}/reservas`, { params });
  }

  getById(id: string): Observable<ReservaResponse> {
    return this.http.get<ReservaResponse>(`${this.baseUrl}/reservas/${id}`);
  }

  getByCodigo(codigo: string): Observable<ReservaResponse> {
    return this.http.get<ReservaResponse>(`${this.baseUrl}/reservas/codigo/${codigo}`);
  }

  getByCliente(clienteId: string): Observable<ReservaResponse[]> {
    return this.http.get<ReservaResponse[]>(`${this.baseUrl}/reservas/cliente/${clienteId}`);
  }

  create(request: ReservaRequest): Observable<ReservaResponse> {
    return this.http.post<ReservaResponse>(`${this.baseUrl}/reservas`, request);
  }

  cancelar(id: string, request: CancelarReservaRequest): Observable<ReservaResponse> {
    return this.http.patch<ReservaResponse>(`${this.baseUrl}/reservas/${id}/cancelar`, request);
  }

  delete(id: string): Observable<ApiResponse> {
    return this.http.delete<ApiResponse>(`${this.baseUrl}/reservas/${id}`);
  }

  getDetalles(reservaId: string): Observable<ReservaDetalleResponse[]> {
    return this.http.get<ReservaDetalleResponse[]>(`${this.baseUrl}/reservas/${reservaId}/detalles`);
  }

  addDetalle(reservaId: string, request: ReservaDetalleRequest): Observable<ReservaDetalleResponse> {
    return this.http.post<ReservaDetalleResponse>(`${this.baseUrl}/reservas/${reservaId}/detalles`, request);
  }

  removeDetalle(reservaId: string, detalleId: string): Observable<ApiResponse> {
    return this.http.delete<ApiResponse>(`${this.baseUrl}/reservas/${reservaId}/detalles/${detalleId}`);
  }

  getEstadiasActivas(): Observable<EstadiaResponse[]> {
    return this.http.get<EstadiaResponse[]>(`${this.baseUrl}/estadias/activas`);
  }

  getEstadiaPorReserva(reservaId: string): Observable<EstadiaResponse> {
    return this.http.get<EstadiaResponse>(`${this.baseUrl}/estadias/reserva/${reservaId}`);
  }

  checkIn(request: CheckInRequest): Observable<EstadiaResponse> {
    return this.http.post<EstadiaResponse>(`${this.baseUrl}/estadias/check-in`, request);
  }

  checkOut(estadiaId: string, request?: CheckOutRequest): Observable<EstadiaResponse> {
    return this.http.put<EstadiaResponse>(`${this.baseUrl}/estadias/${estadiaId}/check-out`, request ?? {});
  }
}
