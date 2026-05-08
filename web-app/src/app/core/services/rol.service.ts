import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { RolResponse, RolRequest } from '../models/rol';
import { ApiResponse } from '../models/api-response';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class RolService extends ApiService {
  constructor(private http: HttpClient) {
    super();
  }

  getAll(): Observable<RolResponse[]> {
    return this.http.get<RolResponse[]>(`${this.baseUrl}/roles`);
  }

  getById(id: string): Observable<RolResponse> {
    return this.http.get<RolResponse>(`${this.baseUrl}/roles/${id}`);
  }

  create(request: RolRequest): Observable<RolResponse> {
    return this.http.post<RolResponse>(`${this.baseUrl}/roles`, request);
  }

  update(id: string, request: RolRequest): Observable<RolResponse> {
    return this.http.put<RolResponse>(`${this.baseUrl}/roles/${id}`, request);
  }

  delete(id: string): Observable<ApiResponse> {
    return this.http.delete<ApiResponse>(`${this.baseUrl}/roles/${id}`);
  }
}
