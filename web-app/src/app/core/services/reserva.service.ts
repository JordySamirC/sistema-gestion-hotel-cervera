import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ActualizarReservaRequest, AgregarHuespedRequest, CambiarHabitacionRequest, ExtenderReservaRequest, ExtenderGrupoRequest, CancelarGrupoRequest, ReservaResponse, ReservaRequest, ReservaDetalleResponse, ReservaDetalleRequest, CancelarReservaRequest, EstadiaResponse, CheckInRequest, CheckOutRequest, GrupoResponse, GrupoRequest, GrupoUpdateRequest, AddHabitacionRequest, ReservaHuespedResponse, PanelReservaItem, CanalVenta } from '../models/reserva';
import { HabitacionResponse } from '../models/habitacion';
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

  update(id: string, request: ActualizarReservaRequest): Observable<ReservaResponse> {
    return this.http.patch<ReservaResponse>(`${this.baseUrl}/reservas/${id}`, request);
  }

  extender(id: string, request: ExtenderReservaRequest): Observable<ReservaResponse> {
    return this.http.patch<ReservaResponse>(`${this.baseUrl}/reservas/${id}/extender`, request);
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

  getAllGrupos(): Observable<GrupoResponse[]> {
    return this.http.get<GrupoResponse[]>(`${this.baseUrl}/grupos`);
  }

  getGrupo(id: string): Observable<GrupoResponse> {
    return this.http.get<GrupoResponse>(`${this.baseUrl}/grupos/${id}`);
  }

  crearGrupo(request: GrupoRequest): Observable<GrupoResponse> {
    return this.http.post<GrupoResponse>(`${this.baseUrl}/grupos`, request);
  }

  updateGrupo(id: string, request: GrupoUpdateRequest): Observable<GrupoResponse> {
    return this.http.put<GrupoResponse>(`${this.baseUrl}/grupos/${id}`, request);
  }

  deleteGrupo(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/grupos/${id}`);
  }

  addHabitacionToGrupo(grupoId: string, request: AddHabitacionRequest): Observable<GrupoResponse> {
    return this.http.post<GrupoResponse>(`${this.baseUrl}/grupos/${grupoId}/habitaciones`, request);
  }

  removeHabitacionFromGrupo(grupoId: string, habitacionId: string): Observable<GrupoResponse> {
    return this.http.delete<GrupoResponse>(`${this.baseUrl}/grupos/${grupoId}/habitaciones/${habitacionId}`);
  }

  getHuespedes(reservaId: string): Observable<ReservaHuespedResponse[]> {
    return this.http.get<ReservaHuespedResponse[]>(`${this.baseUrl}/grupos/${reservaId}/huespedes`);
  }

  extenderGrupo(id: string, request: ExtenderGrupoRequest): Observable<GrupoResponse> {
    return this.http.patch<GrupoResponse>(`${this.baseUrl}/grupos/${id}/extender`, request);
  }

  cancelarGrupo(id: string, request: CancelarGrupoRequest, usuarioId: string): Observable<ApiResponse> {
    return this.http.patch<ApiResponse>(`${this.baseUrl}/grupos/${id}/cancelar?usuarioId=${usuarioId}`, request);
  }

  removeDetalle(reservaId: string, detalleId: string): Observable<ApiResponse> {
    return this.http.delete<ApiResponse>(`${this.baseUrl}/reservas/${reservaId}/detalles/${detalleId}`);
  }

  getCanalesVenta(): Observable<CanalVenta[]> {
    return this.http.get<CanalVenta[]>(`${this.baseUrl}/canales-venta`);
  }

  getPanel(): Observable<PanelReservaItem[]> {
    return this.http.get<PanelReservaItem[]>(`${this.baseUrl}/reservas/panel`);
  }

  addHuesped(reservaId: string, request: AgregarHuespedRequest): Observable<ReservaHuespedResponse> {
    return this.http.post<ReservaHuespedResponse>(`${this.baseUrl}/reservas/${reservaId}/huespedes`, request);
  }

  removeHuesped(reservaId: string, huespedId: string): Observable<ApiResponse> {
    return this.http.delete<ApiResponse>(`${this.baseUrl}/reservas/${reservaId}/huespedes/${huespedId}`);
  }

  changeHabitacion(reservaId: string, request: CambiarHabitacionRequest): Observable<ReservaResponse> {
    return this.http.patch<ReservaResponse>(`${this.baseUrl}/reservas/${reservaId}/habitacion`, request);
  }

  getHabitacionesDisponibles(fechaIngreso: string, fechaSalida: string): Observable<HabitacionResponse[]> {
    return this.http.get<HabitacionResponse[]>(`${this.baseUrl}/habitaciones/disponibles`, {
      params: { fechaIngreso, fechaSalida }
    });
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

  checkOutGrupo(grupoId: string, request: import('../models/pago').PagoGrupoRequest): Observable<EstadiaResponse[]> {
    return this.http.post<EstadiaResponse[]>(`${this.baseUrl}/estadias/grupo/${grupoId}/check-out`, request);
  }
}
