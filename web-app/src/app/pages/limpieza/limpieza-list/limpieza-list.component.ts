import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LimpiezaService } from '../../../core/services/limpieza.service';
import { HabitacionService } from '../../../core/services/habitacion.service';
import { AuthService } from '../../../core/services/auth.service';
import { LimpiezaResponse, IniciarLimpiezaRequest } from '../../../core/models/limpieza';
import { HabitacionResponse } from '../../../core/models/habitacion';

@Component({
  selector: 'app-limpieza-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <h2>Gestión de Limpieza</h2>
      <p class="subtitle">Habitaciones que requieren limpieza</p>

      <div class="card">
        <div class="card-body">
          <h3>Iniciar Limpieza</h3>
          <div class="form-row">
            <div class="form-group">
              <label>Seleccionar Habitación</label>
              <select [(ngModel)]="iniciarRequest.habitacionId" name="habitacion">
                <option value="">Seleccione...</option>
                <option *ngFor="let h of habitacionesPorLimpiar" [value]="h.id">
                  {{ h.numero }} - {{ h.tipoNombre }}
                </option>
              </select>
            </div>
            <button class="btn-primary" (click)="iniciarLimpieza()" [disabled]="!iniciarRequest.habitacionId">
              Iniciar Limpieza
            </button>
          </div>
        </div>
      </div>

      <div class="table-container" *ngIf="limpiezasActivas.length > 0">
        <h3>Limpiezas en Curso</h3>
        <table class="table">
          <thead>
            <tr>
              <th>Habitación</th>
              <th>Personal</th>
              <th>Inicio</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let l of limpiezasActivas">
              <td>{{ l.habitacionNumero }}</td>
              <td>{{ l.usuarioNombre }}</td>
              <td>{{ l.fechaInicio | date:'dd/MM/yyyy HH:mm' }}</td>
              <td><button class="btn-success" (click)="terminarLimpieza(l.id)">Terminar</button></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="table-container">
        <h3>Historial Reciente</h3>
        <table class="table">
          <thead>
            <tr>
              <th>Habitación</th>
              <th>Personal</th>
              <th>Inicio</th>
              <th>Fin</th>
              <th>Duración</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let l of historial">
              <td>{{ l.habitacionNumero }}</td>
              <td>{{ l.usuarioNombre }}</td>
              <td>{{ l.fechaInicio | date:'dd/MM/yyyy HH:mm' }}</td>
              <td>{{ (l.fechaFin | date:'dd/MM/yyyy HH:mm') || '-' }}</td>
              <td>{{ l.duracionSegundos ? (l.duracionSegundos / 60 | number:'1.0-0') + ' min' : '-' }}</td>
            </tr>
            <tr *ngIf="historial.length === 0">
              <td colspan="5" class="empty">Sin historial</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .page { }
    h2 { margin: 0 0 4px; font-size: 1.3rem; color: #333; }
    .subtitle { color: #888; font-size: 0.85rem; margin-bottom: 20px; }
    .card { background: white; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); margin-bottom: 20px; }
    .card-body { padding: 20px; }
    .card-body h3 { margin: 0 0 16px; font-size: 1rem; color: #333; }
    .form-row { display: flex; gap: 12px; align-items: flex-end; }
    .form-group { flex: 1; }
    label { display: block; margin-bottom: 4px; font-size: 0.8rem; color: #555; }
    select { width: 100%; padding: 8px 10px; border: 1px solid #ddd; border-radius: 4px; font-size: 0.85rem; }
    .btn-primary { padding: 8px 20px; background: #1a237e; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.85rem; white-space: nowrap; }
    .btn-success { padding: 6px 14px; background: #2e7d32; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.8rem; }
    .table-container { background: white; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); padding: 20px; margin-bottom: 20px; }
    .table-container h3 { margin: 0 0 16px; font-size: 1rem; color: #333; }
    .table { width: 100%; border-collapse: collapse; }
    .table th, .table td { padding: 12px 16px; text-align: left; font-size: 0.85rem; border-bottom: 1px solid #f0f0f0; }
    .table th { background: #fafafa; color: #666; font-weight: 600; }
    .empty { text-align: center; color: #999; padding: 20px; }
  `]
})
export class LimpiezaListComponent implements OnInit {
  habitacionesPorLimpiar: HabitacionResponse[] = [];
  limpiezasActivas: LimpiezaResponse[] = [];
  historial: LimpiezaResponse[] = [];

  iniciarRequest: IniciarLimpiezaRequest = { habitacionId: '', usuarioId: '' };

  constructor(
    private limpiezaService: LimpiezaService,
    private habitacionService: HabitacionService,
    private auth: AuthService
  ) {}

  ngOnInit(): void {
    this.iniciarRequest.usuarioId = this.auth.getUsuario()?.id || '';

    this.habitacionService.getAll(undefined, 'Por limpiar').subscribe({
      next: (data) => this.habitacionesPorLimpiar = data
    });

    this.limpiezaService.getActivas().subscribe({
      next: (data) => this.limpiezasActivas = data
    });

    if (this.auth.esGerente()) {
      this.limpiezaService.getAll().subscribe({
        next: (data) => this.historial = data.slice(0, 20)
      });
    }
  }

  iniciarLimpieza(): void {
    this.limpiezaService.iniciar(this.iniciarRequest).subscribe({
      next: () => {
        alert('Limpieza iniciada');
        this.iniciarRequest.habitacionId = '';
        this.ngOnInit();
      },
      error: () => alert('Error al iniciar limpieza')
    });
  }

  terminarLimpieza(id: string): void {
    this.limpiezaService.terminar(id).subscribe({
      next: () => {
        alert('Limpieza terminada');
        this.ngOnInit();
      },
      error: () => alert('Error al terminar limpieza')
    });
  }
}
