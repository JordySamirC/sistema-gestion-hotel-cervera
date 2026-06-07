import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class ReporteService extends ApiService {
  constructor(private http: HttpClient) {
    super();
  }

  getOcupacionDiaria(fecha?: string): Observable<Record<string, any>> {
    let params: any = {};
    if (fecha) params.fecha = fecha;
    return this.http.get<Record<string, any>>(`${this.baseUrl}/reportes/ocupacion-diaria`, { params });
  }

  getIngresos(desde: string, hasta: string): Observable<Record<string, any>> {
    return this.http.get<Record<string, any>>(`${this.baseUrl}/reportes/ingresos`, { params: { desde, hasta } });
  }

  getGananciasNetas(desde: string, hasta: string): Observable<Record<string, any>> {
    return this.http.get<Record<string, any>>(`${this.baseUrl}/reportes/ganancias-netas`, { params: { desde, hasta } });
  }

  getLimpieza(): Observable<Record<string, any>> {
    return this.http.get<Record<string, any>>(`${this.baseUrl}/reportes/limpieza`);
  }

  getCancelaciones(): Observable<Record<string, any>> {
    return this.http.get<Record<string, any>>(`${this.baseUrl}/reportes/cancelaciones`);
  }

  getProyeccionOcupacion(): Observable<Record<string, any>> {
    return this.http.get<Record<string, any>>(`${this.baseUrl}/reportes/proyeccion-ocupacion`);
  }

  getReporteCompleto(desde: string, hasta: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/reportes/completo`, { params: { desde, hasta } });
  }
}
