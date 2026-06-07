import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface ResumenDashboardResponse {
  totalHabitaciones: number;
  disponibles: number;
  ocupadas: number;
  porLimpiar: number;
  checkInsHoy: number;
  checkOutsHoy: number;
  ingresosHoy: number;
  ingresosMes: number;
  ocupacionPorcentaje: number;
}

export interface OcupacionPunto {
  name: string;
  value: number;
}

export interface IngresosTipo {
  name: string;
  value: number;
}

export interface EstadoConteo {
  name: string;
  value: number;
}

export interface RankingPopularidad {
  name: string;
  value: number;
}

export interface DashboardGraficosResponse {
  ocupacionSemana: OcupacionPunto[];
  ingresosTipo: IngresosTipo[];
  distribucionEstados: EstadoConteo[];
  rankingHabitaciones: RankingPopularidad[];
}

export interface AlertaDashboardResponse {
  tipo: string;    // 'URGENTE' | 'ADVERTENCIA' | 'INFO' | 'EXITO'
  mensaje: string;
  icono: string;
  fecha: string;
}

@Injectable({ providedIn: 'root' })
export class DashboardService extends ApiService {
  constructor(private http: HttpClient) {
    super();
  }

  getResumen(): Observable<ResumenDashboardResponse> {
    return this.http.get<ResumenDashboardResponse>(`${this.baseUrl}/dashboard/resumen`);
  }

  getGraficos(): Observable<DashboardGraficosResponse> {
    return this.http.get<DashboardGraficosResponse>(`${this.baseUrl}/dashboard/graficos`);
  }

  getAlertas(): Observable<AlertaDashboardResponse[]> {
    return this.http.get<AlertaDashboardResponse[]>(`${this.baseUrl}/dashboard/alertas`);
  }
}
