import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { GastoResponse, GastoRequest, CategoriaGasto, TipoGasto } from '../models/gasto';
import { ApiResponse } from '../models/api-response';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class GastoService extends ApiService {
  constructor(private http: HttpClient) {
    super();
  }

  getConFiltros(desde: string, hasta: string, categoriaId?: number, tipoGastoId?: number): Observable<GastoResponse[]> {
    const params: any = { desde, hasta };
    if (categoriaId !== undefined && categoriaId !== null) {
      params.categoriaId = categoriaId;
    }
    if (tipoGastoId !== undefined && tipoGastoId !== null) {
      params.tipoGastoId = tipoGastoId;
    }
    return this.http.get<GastoResponse[]>(`${this.baseUrl}/gastos`, { params });
  }

  getById(id: string): Observable<GastoResponse> {
    return this.http.get<GastoResponse>(`${this.baseUrl}/gastos/${id}`);
  }

  getCategorias(): Observable<CategoriaGasto[]> {
    return this.http.get<CategoriaGasto[]>(`${this.baseUrl}/gastos/categorias`);
  }

  getTipos(): Observable<TipoGasto[]> {
    return this.http.get<TipoGasto[]>(`${this.baseUrl}/gastos/tipos`);
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

  anularGasto(id: string, motivo: string, usuarioId: string): Observable<GastoResponse> {
    return this.http.post<GastoResponse>(`${this.baseUrl}/gastos/${id}/anular`, null, {
      params: { motivo, usuarioId }
    });
  }
}
