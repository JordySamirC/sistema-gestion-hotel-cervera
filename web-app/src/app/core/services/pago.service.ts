import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PagoResponse, PagoRequest } from '../models/pago';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class PagoService extends ApiService {
  constructor(private http: HttpClient) {
    super();
  }

  getAll(): Observable<PagoResponse[]> {
    return this.http.get<PagoResponse[]>(`${this.baseUrl}/pagos`);
  }

  getById(id: string): Observable<PagoResponse> {
    return this.http.get<PagoResponse>(`${this.baseUrl}/pagos/${id}`);
  }

  getByEstadia(estadiaId: string): Observable<PagoResponse> {
    return this.http.get<PagoResponse>(`${this.baseUrl}/pagos/estadia/${estadiaId}`);
  }

  getByGrupo(grupoId: string): Observable<PagoResponse> {
    return this.http.get<PagoResponse>(`${this.baseUrl}/pagos/grupo/${grupoId}`);
  }

  getByPeriodo(desde: string, hasta: string): Observable<PagoResponse[]> {
    return this.http.get<PagoResponse[]>(`${this.baseUrl}/pagos/periodo`, {
      params: { desde, hasta }
    });
  }

  create(request: PagoRequest): Observable<PagoResponse> {
    return this.http.post<PagoResponse>(`${this.baseUrl}/pagos`, request);
  }
}
