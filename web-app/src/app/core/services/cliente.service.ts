import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ClienteResponse, ClienteRequest } from '../models/cliente';
import { ApiResponse } from '../models/api-response';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class ClienteService extends ApiService {
  constructor(private http: HttpClient) {
    super();
  }

  getAll(): Observable<ClienteResponse[]> {
    return this.http.get<ClienteResponse[]>(`${this.baseUrl}/clientes`);
  }

  buscarResponsables(termino: string): Observable<ClienteResponse[]> {
    return this.http.get<ClienteResponse[]>(`${this.baseUrl}/clientes/search`, {
      params: { termino }
    });
  }

  getById(id: string): Observable<ClienteResponse> {
    return this.http.get<ClienteResponse>(`${this.baseUrl}/clientes/${id}`);
  }

  buscar(tipoDocumento: string, numeroDocumento: string): Observable<ClienteResponse> {
    return this.http.get<ClienteResponse>(`${this.baseUrl}/clientes/buscar`, {
      params: { tipoDocumento, numeroDocumento }
    });
  }

  create(request: ClienteRequest): Observable<ClienteResponse> {
    return this.http.post<ClienteResponse>(`${this.baseUrl}/clientes`, request);
  }

  update(id: string, request: ClienteRequest): Observable<ClienteResponse> {
    return this.http.put<ClienteResponse>(`${this.baseUrl}/clientes/${id}`, request);
  }

  cambiarEstado(id: string, estado: string): Observable<ClienteResponse> {
    return this.http.patch<ClienteResponse>(`${this.baseUrl}/clientes/${id}/estado`, { estado });
  }

  delete(id: string): Observable<ApiResponse> {
    return this.http.delete<ApiResponse>(`${this.baseUrl}/clientes/${id}`);
  }
}
