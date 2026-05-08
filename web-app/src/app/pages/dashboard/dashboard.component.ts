import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HabitacionService } from '../../core/services/habitacion.service';
import { ReservaService } from '../../core/services/reserva.service';
import { AuthService } from '../../core/services/auth.service';
import { HabitacionResponse } from '../../core/models/habitacion';
import { EstadiaResponse } from '../../core/models/reserva';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="dashboard">
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">🏨</div>
          <div class="stat-info">
            <span class="stat-value">{{ totalHabitaciones }}</span>
            <span class="stat-label">Total Habitaciones</span>
          </div>
        </div>
        <div class="stat-card green">
          <div class="stat-icon">✅</div>
          <div class="stat-info">
            <span class="stat-value">{{ disponibles }}</span>
            <span class="stat-label">Disponibles</span>
          </div>
        </div>
        <div class="stat-card orange">
          <div class="stat-icon">🛏️</div>
          <div class="stat-info">
            <span class="stat-value">{{ ocupadas }}</span>
            <span class="stat-label">Ocupadas</span>
          </div>
        </div>
        <div class="stat-card red">
          <div class="stat-icon">🧹</div>
          <div class="stat-info">
            <span class="stat-value">{{ porLimpiar }}</span>
            <span class="stat-label">Por Limpiar</span>
          </div>
        </div>
      </div>

      <div class="dashboard-grid">
        <div class="card">
          <div class="card-header">
            <h3>Habitaciones por Piso</h3>
          </div>
          <div class="card-body">
            <div class="piso-section" *ngFor="let piso of pisos">
              <h4>Piso {{ piso.numero }}</h4>
              <div class="habitaciones-grid">
                <div
                  class="habitacion-card"
                  *ngFor="let h of piso.habitaciones"
                  [class.disponible]="h.estadoActual === 'Disponible'"
                  [class.ocupada]="h.estadoActual === 'Ocupada'"
                  [class.limpiar]="h.estadoActual === 'Por limpiar'"
                  [class.limpieza]="h.estadoActual === 'En limpieza'"
                  [class.mantenimiento]="h.estadoActual === 'Mantenimiento'"
                  [routerLink]="['/habitaciones']"
                >
                  <span class="numero">{{ h.numero }}</span>
                  <span class="tipo">{{ h.tipoNombre }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="card" *ngIf="auth.esGerente()">
          <div class="card-header">
            <h3>Estadías Activas</h3>
          </div>
          <div class="card-body">
            <div *ngIf="estadiasActivas.length === 0" class="empty-state">
              No hay estadías activas
            </div>
            <div class="estadia-item" *ngFor="let e of estadiasActivas">
              <span class="estadia-codigo">{{ e.reservaCodigo }}</span>
              <span class="estadia-noches">{{ e.noches }} noches</span>
              <span class="estadia-monto">S/ {{ e.montoTotal }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard { display: flex; flex-direction: column; gap: 24px; }
    .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; }
    .stat-card { background: white; border-radius: 8px; padding: 20px; display: flex; align-items: center; gap: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
    .stat-card.green .stat-value { color: #2e7d32; }
    .stat-card.orange .stat-value { color: #e65100; }
    .stat-card.red .stat-value { color: #c62828; }
    .stat-icon { font-size: 2rem; }
    .stat-info { display: flex; flex-direction: column; }
    .stat-value { font-size: 1.8rem; font-weight: 700; color: #1a237e; }
    .stat-label { font-size: 0.8rem; color: #888; }
    .dashboard-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 16px; }
    .card { background: white; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
    .card-header { padding: 16px 20px; border-bottom: 1px solid #eee; }
    .card-header h3 { margin: 0; font-size: 1rem; color: #333; }
    .card-body { padding: 16px 20px; }
    .piso-section { margin-bottom: 16px; }
    .piso-section h4 { margin: 0 0 8px; font-size: 0.85rem; color: #666; }
    .habitaciones-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(70px, 1fr)); gap: 8px; }
    .habitacion-card { display: flex; flex-direction: column; align-items: center; padding: 8px; border-radius: 6px; cursor: pointer; transition: transform 0.1s; background: #e8f5e9; border: 1px solid #c8e6c9; }
    .habitacion-card.ocupada { background: #ffebee; border-color: #ffcdd2; }
    .habitacion-card.limpiar { background: #fff3e0; border-color: #ffe0b2; }
    .habitacion-card.limpieza { background: #e3f2fd; border-color: #bbdefb; }
    .habitacion-card.mantenimiento { background: #f3e5f5; border-color: #e1bee7; }
    .habitacion-card:hover { transform: scale(1.05); }
    .numero { font-weight: 700; font-size: 0.9rem; color: #333; }
    .tipo { font-size: 0.6rem; color: #888; }
    .empty-state { text-align: center; color: #999; padding: 20px; font-size: 0.85rem; }
    .estadia-item { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f5f5f5; font-size: 0.85rem; }
    .estadia-codigo { font-weight: 600; color: #333; }
    .estadia-noches { color: #666; }
    .estadia-monto { color: #1a237e; font-weight: 600; }
    @media (max-width: 768px) { .dashboard-grid { grid-template-columns: 1fr; } }
  `]
})
export class DashboardComponent implements OnInit {
  totalHabitaciones = 0;
  disponibles = 0;
  ocupadas = 0;
  porLimpiar = 0;
  pisos: { numero: number; habitaciones: HabitacionResponse[] }[] = [];
  estadiasActivas: EstadiaResponse[] = [];

  constructor(
    private habitacionService: HabitacionService,
    private reservaService: ReservaService,
    public auth: AuthService
  ) {}

  ngOnInit(): void {
    this.habitacionService.getAll().subscribe({
      next: (habitaciones) => {
        this.totalHabitaciones = habitaciones.length;
        this.disponibles = habitaciones.filter(h => h.estadoActual === 'Disponible').length;
        this.ocupadas = habitaciones.filter(h => h.estadoActual === 'Ocupada').length;
        this.porLimpiar = habitaciones.filter(h => h.estadoActual === 'Por limpiar' || h.estadoActual === 'En limpieza').length;

        const pisosMap = new Map<number, HabitacionResponse[]>();
        habitaciones.forEach(h => {
          if (!pisosMap.has(h.piso)) pisosMap.set(h.piso, []);
          pisosMap.get(h.piso)!.push(h);
        });
        this.pisos = Array.from(pisosMap.entries())
          .map(([numero, habitaciones]) => ({ numero, habitaciones }))
          .sort((a, b) => a.numero - b.numero);
      }
    });

    if (this.auth.esGerente()) {
      this.reservaService.getEstadiasActivas().subscribe({
        next: (estadias) => this.estadiasActivas = estadias
      });
    }
  }
}
