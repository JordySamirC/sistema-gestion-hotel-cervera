import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { GastoResponse, GastoRequest } from '../models/gasto';
import { ApiResponse } from '../models/api-response';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class GastoService extends ApiService {
  constructor(private http: HttpClient) {
    super();
  }

  getAll(): Observable<GastoResponse[]> {
    return this.http.get<GastoResponse[]>(`${this.baseUrl}/gastos`);
  }

  getById(id: string): Observable<GastoResponse> {
    return this.http.get<GastoResponse>(`${this.baseUrl}/gastos/${id}`);
  }

  getByPeriodo(desde: string, hasta: string): Observable<GastoResponse[]> {
    return this.http.get<GastoResponse[]>(`${this.baseUrl}/gastos/periodo`, {
      params: { desde, hasta }
    });
  }

  getByCategoria(categoria: string): Observable<GastoResponse[]> {
    return this.http.get<GastoResponse[]>(`${this.baseUrl}/gastos/categoria/${categoria}`);
  }

  getResumenPorCategoria(desde: string, hasta: string): Observable<Record<string, number>> {
    return this.http.get<Record<string, number>>(`${this.baseUrl}/gastos/resumen-por-categoria`, {
      params: { desde, hasta }
    });
  }

  create(request: GastoRequest): Observable<GastoResponse> {
    return this.http.post<GastoResponse>(`${this.baseUrl}/gastos`, request);
  }

  update(id: string, request: GastoRequest): Observable<GastoResponse> {
    return this.http.put<GastoResponse>(`${this.baseUrl}/gastos/${id}`, request);
  }

  delete(id: string): Observable<ApiResponse> {
    return this.http.delete<ApiResponse>(`${this.baseUrl}/gastos/${id}`);
  }
}
