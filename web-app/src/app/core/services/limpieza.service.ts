import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { LimpiezaResponse, IniciarLimpiezaRequest } from '../models/limpieza';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class LimpiezaService extends ApiService {
  constructor(private http: HttpClient) {
    super();
  }

  getAll(): Observable<LimpiezaResponse[]> {
    return this.http.get<LimpiezaResponse[]>(`${this.baseUrl}/limpiezas`);
  }

  getById(id: string): Observable<LimpiezaResponse> {
    return this.http.get<LimpiezaResponse>(`${this.baseUrl}/limpiezas/${id}`);
  }

  getActivas(): Observable<LimpiezaResponse[]> {
    return this.http.get<LimpiezaResponse[]>(`${this.baseUrl}/limpiezas/activas`);
  }

  getHistorialHabitacion(habitacionId: string): Observable<LimpiezaResponse[]> {
    return this.http.get<LimpiezaResponse[]>(`${this.baseUrl}/limpiezas/historial/habitacion/${habitacionId}`);
  }

  getHistorialUsuario(usuarioId: string): Observable<LimpiezaResponse[]> {
    return this.http.get<LimpiezaResponse[]>(`${this.baseUrl}/limpiezas/historial/usuario/${usuarioId}`);
  }

  iniciar(request: IniciarLimpiezaRequest): Observable<LimpiezaResponse> {
    return this.http.post<LimpiezaResponse>(`${this.baseUrl}/limpiezas/iniciar`, request);
  }

  terminar(id: string): Observable<LimpiezaResponse> {
    return this.http.put<LimpiezaResponse>(`${this.baseUrl}/limpiezas/${id}/terminar`, {});
  }
}
