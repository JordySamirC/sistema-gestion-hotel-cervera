import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { HabitacionResponse, HabitacionRequest, CambiarEstadoHabitacionRequest, TipoHabitacionResponse } from '../models/habitacion';
import { ApiResponse } from '../models/api-response';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class HabitacionService extends ApiService {
  constructor(private http: HttpClient) {
    super();
  }

  getAll(piso?: number, estado?: string): Observable<HabitacionResponse[]> {
    let params: any = {};
    if (piso) params.piso = piso;
    if (estado) params.estado = estado;
    return this.http.get<HabitacionResponse[]>(`${this.baseUrl}/habitaciones`, { params });
  }

  getById(id: string): Observable<HabitacionResponse> {
    return this.http.get<HabitacionResponse>(`${this.baseUrl}/habitaciones/${id}`);
  }

  getDisponibles(fechaIngreso: string, fechaSalida: string): Observable<HabitacionResponse[]> {
    return this.http.get<HabitacionResponse[]>(`${this.baseUrl}/habitaciones/disponibles`, {
      params: { fechaIngreso, fechaSalida }
    });
  }

  create(request: HabitacionRequest): Observable<HabitacionResponse> {
    return this.http.post<HabitacionResponse>(`${this.baseUrl}/habitaciones`, request);
  }

  update(id: string, request: HabitacionRequest): Observable<HabitacionResponse> {
    return this.http.put<HabitacionResponse>(`${this.baseUrl}/habitaciones/${id}`, request);
  }

  cambiarEstado(id: string, request: CambiarEstadoHabitacionRequest): Observable<HabitacionResponse> {
    return this.http.patch<HabitacionResponse>(`${this.baseUrl}/habitaciones/${id}/estado`, request);
  }

  delete(id: string): Observable<ApiResponse> {
    return this.http.delete<ApiResponse>(`${this.baseUrl}/habitaciones/${id}`);
  }

  getTiposHabitacion(): Observable<TipoHabitacionResponse[]> {
    return this.http.get<TipoHabitacionResponse[]>(`${this.baseUrl}/tipos-habitacion`);
  }
}
