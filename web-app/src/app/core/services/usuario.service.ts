import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UsuarioResponse, UsuarioRequest, UsuarioUpdateRequest, CambiarPasswordRequest } from '../models/usuario';
import { ApiResponse } from '../models/api-response';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class UsuarioService extends ApiService {
  constructor(private http: HttpClient) {
    super();
  }

  getAll(): Observable<UsuarioResponse[]> {
    return this.http.get<UsuarioResponse[]>(`${this.baseUrl}/usuarios`);
  }

  getById(id: string): Observable<UsuarioResponse> {
    return this.http.get<UsuarioResponse>(`${this.baseUrl}/usuarios/${id}`);
  }

  create(request: UsuarioRequest): Observable<UsuarioResponse> {
    return this.http.post<UsuarioResponse>(`${this.baseUrl}/usuarios`, request);
  }

  update(id: string, request: UsuarioUpdateRequest): Observable<UsuarioResponse> {
    return this.http.put<UsuarioResponse>(`${this.baseUrl}/usuarios/${id}`, request);
  }

  delete(id: string): Observable<ApiResponse> {
    return this.http.delete<ApiResponse>(`${this.baseUrl}/usuarios/${id}`);
  }

  cambiarPassword(id: string, request: CambiarPasswordRequest): Observable<ApiResponse> {
    return this.http.put<ApiResponse>(`${this.baseUrl}/usuarios/${id}/cambiar-password`, request);
  }
}
