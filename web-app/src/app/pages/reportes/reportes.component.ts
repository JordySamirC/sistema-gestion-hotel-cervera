import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReporteService } from '../../core/services/reporte.service';

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <h2>Reportes</h2>
      <p class="subtitle">Indicadores y estadísticas del hotel</p>

      <div class="report-grid">
        <div class="card">
          <div class="card-header">
            <h3>Ocupación Diaria</h3>
          </div>
          <div class="card-body">
            <div class="form-row">
              <input type="date" [(ngModel)]="fechaOcupacion" name="fecha" />
              <button class="btn-sm" (click)="cargarOcupacion()">Consultar</button>
            </div>
            <pre class="data" *ngIf="ocupacion">{{ ocupacion | json }}</pre>
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <h3>Ingresos</h3>
          </div>
          <div class="card-body">
            <div class="form-row">
              <input type="date" [(ngModel)]="fechaDesde" name="desde" />
              <input type="date" [(ngModel)]="fechaHasta" name="hasta" />
              <button class="btn-sm" (click)="cargarIngresos()">Consultar</button>
            </div>
            <pre class="data" *ngIf="ingresos">{{ ingresos | json }}</pre>
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <h3>Ganancias Netas</h3>
          </div>
          <div class="card-body">
            <button class="btn-sm" (click)="cargarGananciasNetas()">Calcular</button>
            <pre class="data" *ngIf="gananciasNetas">{{ gananciasNetas | json }}</pre>
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <h3>Estado de Limpieza</h3>
          </div>
          <div class="card-body">
            <button class="btn-sm" (click)="cargarLimpieza()">Ver</button>
            <pre class="data" *ngIf="limpieza">{{ limpieza | json }}</pre>
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <h3>Cancelaciones</h3>
          </div>
          <div class="card-body">
            <button class="btn-sm" (click)="cargarCancelaciones()">Ver</button>
            <pre class="data" *ngIf="cancelaciones">{{ cancelaciones | json }}</pre>
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <h3>Proyección 7 Días</h3>
          </div>
          <div class="card-body">
            <button class="btn-sm" (click)="cargarProyeccion()">Ver</button>
            <pre class="data" *ngIf="proyeccion">{{ proyeccion | json }}</pre>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page { }
    h2 { margin: 0 0 4px; font-size: 1.3rem; color: #333; }
    .subtitle { color: #888; font-size: 0.85rem; margin-bottom: 20px; }
    .report-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); gap: 16px; }
    .card { background: white; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
    .card-header { padding: 16px 20px; border-bottom: 1px solid #eee; }
    .card-header h3 { margin: 0; font-size: 1rem; color: #333; }
    .card-body { padding: 16px 20px; }
    .form-row { display: flex; gap: 8px; margin-bottom: 12px; flex-wrap: wrap; }
    input { padding: 8px 10px; border: 1px solid #ddd; border-radius: 4px; font-size: 0.85rem; }
    .btn-sm { padding: 6px 14px; background: #1a237e; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.8rem; }
    .data { background: #f5f5f5; padding: 12px; border-radius: 4px; font-size: 0.8rem; max-height: 200px; overflow-y: auto; white-space: pre-wrap; }
  `]
})
export class ReportesComponent implements OnInit {
  fechaOcupacion = new Date().toISOString().split('T')[0];
  fechaDesde = '';
  fechaHasta = '';

  ocupacion: any = null;
  ingresos: any = null;
  gananciasNetas: any = null;
  limpieza: any = null;
  cancelaciones: any = null;
  proyeccion: any = null;

  constructor(private service: ReporteService) {}

  ngOnInit(): void {
    this.cargarOcupacion();
  }

  cargarOcupacion(): void {
    this.service.getOcupacionDiaria(this.fechaOcupacion).subscribe({ next: (d: any) => this.ocupacion = d });
  }

  cargarIngresos(): void {
    this.service.getIngresos(this.fechaDesde, this.fechaHasta).subscribe({ next: (d: any) => this.ingresos = d });
  }

  cargarGananciasNetas(): void {
    this.service.getGananciasNetas(this.fechaDesde, this.fechaHasta).subscribe({ next: (d: any) => this.gananciasNetas = d });
  }

  cargarLimpieza(): void {
    this.service.getLimpieza().subscribe({ next: (d: any) => this.limpieza = d });
  }

  cargarCancelaciones(): void {
    this.service.getCancelaciones().subscribe({ next: (d: any) => this.cancelaciones = d });
  }

  cargarProyeccion(): void {
    this.service.getProyeccionOcupacion().subscribe({ next: (d: any) => this.proyeccion = d });
  }
}
