import { Component, OnInit } from '@angular/core';
import { NgFor, NgIf, CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HabitacionService } from '../../../core/services/habitacion.service';
import { AuthService } from '../../../core/services/auth.service';
import { HabitacionResponse, TipoHabitacionResponse } from '../../../core/models/habitacion';

@Component({
  selector: 'app-habitacion-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page">
      <div class="page-header">
        <h2>Habitaciones</h2>
        <div class="filters">
          <select (change)="filtrarPiso($any($event.target).value)" class="filter-select">
            <option value="">Todos los pisos</option>
            <option *ngFor="let p of [2,3]" [value]="p">Piso {{ p }}</option>
          </select>
          <select (change)="filtrarEstado($any($event.target).value)" class="filter-select">
            <option value="">Todos los estados</option>
            <option value="Disponible">Disponible</option>
            <option value="Ocupada">Ocupada</option>
            <option value="Por limpiar">Por limpiar</option>
            <option value="En limpieza">En limpieza</option>
            <option value="Mantenimiento">Mantenimiento</option>
            <option value="Remodelación">Remodelación</option>
            <option value="Inhabitable">Inhabitable</option>
          </select>
        </div>
      </div>
      <div class="habitaciones-grid">
        <div class="hab-card" *ngFor="let h of habitacionesFiltradas" [class]="getEstadoClass(h.estadoActual)">
          <div class="hab-header">
            <span class="hab-numero">{{ h.numero }}</span>
            <span class="hab-tipo">{{ h.tipoNombre }}</span>
          </div>
          <div class="hab-body">
            <span class="hab-piso">Piso {{ h.piso }}</span>
            <span class="hab-estado">{{ h.estadoActual }}</span>
          </div>
          <div class="hab-actions" *ngIf="auth.esGerente()">
            <button class="btn-sm" [routerLink]="['/habitaciones', h.id]">Editar</button>
          </div>
        </div>
      </div>
      <div class="empty-state" *ngIf="habitacionesFiltradas.length === 0">
        No se encontraron habitaciones
      </div>
    </div>
  `,
  styles: [`
    .page { }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 12px; }
    .page-header h2 { margin: 0; font-size: 1.3rem; color: #333; }
    .filters { display: flex; gap: 8px; }
    .filter-select { padding: 8px 12px; border: 1px solid #ddd; border-radius: 6px; font-size: 0.85rem; background: white; }
    .habitaciones-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 12px; }
    .hab-card { background: white; border-radius: 8px; padding: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); border-left: 4px solid #ddd; }
    .hab-card.estado-disponible { border-left-color: #4caf50; }
    .hab-card.estado-ocupada { border-left-color: #f44336; }
    .hab-card.estado-por-limpiar { border-left-color: #ff9800; }
    .hab-card.estado-en-limpieza { border-left-color: #2196f3; }
    .hab-card.estado-mantenimiento { border-left-color: #9c27b0; }
    .hab-card.estado-remodelacion { border-left-color: #795548; }
    .hab-card.estado-inhabitable { border-left-color: #607d8b; }
    .hab-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
    .hab-numero { font-size: 1.4rem; font-weight: 700; color: #333; }
    .hab-tipo { font-size: 0.7rem; color: #888; background: #f5f5f5; padding: 2px 8px; border-radius: 10px; }
    .hab-body { display: flex; justify-content: space-between; font-size: 0.8rem; color: #666; margin-bottom: 8px; }
    .hab-estado { font-weight: 500; }
    .hab-actions { display: flex; gap: 4px; }
    .btn-sm { padding: 4px 12px; background: #e8eaf6; color: #1a237e; border: none; border-radius: 4px; cursor: pointer; font-size: 0.75rem; text-decoration: none; }
    .btn-sm:hover { background: #c5cae9; }
    .empty-state { text-align: center; color: #999; padding: 40px; }
  `]
})
export class HabitacionListComponent implements OnInit {
  habitaciones: HabitacionResponse[] = [];
  habitacionesFiltradas: HabitacionResponse[] = [];
  filtroPiso = '';
  filtroEstado = '';

  constructor(
    private habitacionService: HabitacionService,
    public auth: AuthService
  ) {}

  ngOnInit(): void {
    this.habitacionService.getAll().subscribe({
      next: (data) => {
        this.habitaciones = data;
        this.aplicarFiltros();
      }
    });
  }

  filtrarPiso(piso: string): void { this.filtroPiso = piso; this.aplicarFiltros(); }
  filtrarEstado(estado: string): void { this.filtroEstado = estado; this.aplicarFiltros(); }

  getEstadoClass(estado: string): string {
    return 'estado-' + estado.toLowerCase().replace(/ /g, '-');
  }

  private aplicarFiltros(): void {
    this.habitacionesFiltradas = this.habitaciones.filter(h => {
      if (this.filtroPiso && h.piso !== Number(this.filtroPiso)) return false;
      if (this.filtroEstado && h.estadoActual !== this.filtroEstado) return false;
      return true;
    });
  }
}
