import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PrecioHistoricoResponse, PrecioHistoricoRequest } from '../models/habitacion';
import { ApiResponse } from '../models/api-response';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class PrecioHistoricoService extends ApiService {
  constructor(private http: HttpClient) {
    super();
  }

  getAll(): Observable<PrecioHistoricoResponse[]> {
    return this.http.get<PrecioHistoricoResponse[]>(`${this.baseUrl}/precios-historicos`);
  }

  getById(id: string): Observable<PrecioHistoricoResponse> {
    return this.http.get<PrecioHistoricoResponse>(`${this.baseUrl}/precios-historicos/${id}`);
  }

  getByTipo(tipoHabitacionId: string): Observable<PrecioHistoricoResponse[]> {
    return this.http.get<PrecioHistoricoResponse[]>(`${this.baseUrl}/precios-historicos/por-tipo/${tipoHabitacionId}`);
  }

  getVigente(tipoHabitacionId: string, fecha: string): Observable<Record<string, any>> {
    return this.http.get<Record<string, any>>(`${this.baseUrl}/precios-historicos/vigente`, {
      params: { tipoHabitacionId, fecha }
    });
  }

  create(request: PrecioHistoricoRequest): Observable<PrecioHistoricoResponse> {
    return this.http.post<PrecioHistoricoResponse>(`${this.baseUrl}/precios-historicos`, request);
  }

  update(id: string, request: PrecioHistoricoRequest): Observable<PrecioHistoricoResponse> {
    return this.http.put<PrecioHistoricoResponse>(`${this.baseUrl}/precios-historicos/${id}`, request);
  }

  delete(id: string): Observable<ApiResponse> {
    return this.http.delete<ApiResponse>(`${this.baseUrl}/precios-historicos/${id}`);
  }
}
