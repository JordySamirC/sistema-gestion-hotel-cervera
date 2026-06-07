import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { RestriccionFecha } from '../models/restriccion-fecha';

@Injectable({ providedIn: 'root' })
export class RestriccionFechaService extends ApiService {
  constructor(private http: HttpClient) { super(); }

  getAll(): Observable<RestriccionFecha[]> {
    return this.http.get<RestriccionFecha[]>(`${this.baseUrl}/restricciones-fecha`);
  }

  getById(id: number): Observable<RestriccionFecha> {
    return this.http.get<RestriccionFecha>(`${this.baseUrl}/restricciones-fecha/${id}`);
  }

  create(data: RestriccionFecha): Observable<RestriccionFecha> {
    return this.http.post<RestriccionFecha>(`${this.baseUrl}/restricciones-fecha`, data);
  }

  update(id: number, data: RestriccionFecha): Observable<RestriccionFecha> {
    return this.http.put<RestriccionFecha>(`${this.baseUrl}/restricciones-fecha/${id}`, data);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/restricciones-fecha/${id}`);
  }
}
