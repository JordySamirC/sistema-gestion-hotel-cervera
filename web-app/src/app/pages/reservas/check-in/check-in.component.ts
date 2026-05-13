import { Component, OnInit } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReservaService } from '../../../core/services/reserva.service';
import { AuthService } from '../../../core/services/auth.service';
import { ReservaResponse } from '../../../core/models/reserva';

@Component({
  selector: 'app-check-in',
  standalone: true,
  imports: [NgFor, NgIf, FormsModule],
  template: `
    <div class="page">
      <h2>Check-In</h2>
      <p class="subtitle">Registrar ingreso de huéspedes</p>

      <div class="card">
        <div class="card-body">
          <div class="form-row">
            <div class="form-group">
              <label>Buscar por código de reserva</label>
              <input type="text" [(ngModel)]="codigoBusqueda" placeholder="Ej: RES-001" />
            </div>
            <button class="btn-primary" (click)="buscarReserva()" [disabled]="!codigoBusqueda">Buscar</button>
          </div>
        </div>
      </div>

      <div class="table-container" *ngIf="reservasConfirmadas.length > 0">
        <h3>Reservas listas para Check-In</h3>
        <table class="table">
          <thead>
            <tr>
              <th>Código</th>
              <th>Cliente</th>
              <th>Habitaciones</th>
              <th>Ingreso</th>
              <th>Salida</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let r of reservasConfirmadas">
              <td class="codigo">{{ r.codigo }}</td>
              <td>{{ r.clienteNombre }}</td>
              <td>
                <span *ngFor="let d of r.detalles" class="room-tag">{{ d.habitacionNumero }}</span>
              </td>
              <td>{{ r.fechaIngreso }}</td>
              <td>{{ r.fechaSalida }}</td>
              <td>
                <button class="btn-success" (click)="realizarCheckIn(r.id)">Check-In</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="empty-state" *ngIf="reservasConfirmadas.length === 0 && !codigoBusqueda">
        No hay reservas pendientes de check-in
      </div>
    </div>
  `,
  styles: [`
    .page { }
    h2 { margin: 0 0 4px; font-size: 1.3rem; color: #333; }
    .subtitle { color: #888; font-size: 0.85rem; margin-bottom: 20px; }
    .card { background: white; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); margin-bottom: 20px; }
    .card-body { padding: 20px; }
    .form-row { display: flex; gap: 12px; align-items: flex-end; }
    .form-group { flex: 1; }
    label { display: block; margin-bottom: 4px; font-size: 0.8rem; color: #555; }
    input { width: 100%; padding: 8px 10px; border: 1px solid #ddd; border-radius: 4px; font-size: 0.85rem; box-sizing: border-box; }
    .btn-primary { padding: 8px 20px; background: #1a237e; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.85rem; white-space: nowrap; }
    .btn-success { padding: 6px 16px; background: #2e7d32; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.8rem; }
    .table-container { background: white; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); padding: 20px; }
    .table-container h3 { margin: 0 0 16px; font-size: 1rem; color: #333; }
    .table { width: 100%; border-collapse: collapse; }
    .table th, .table td { padding: 12px 16px; text-align: left; font-size: 0.85rem; border-bottom: 1px solid #f0f0f0; }
    .table th { background: #fafafa; color: #666; font-weight: 600; }
    .codigo { font-weight: 600; color: #1a237e; font-family: monospace; }
    .room-tag { display: inline-block; background: #e8eaf6; color: #1a237e; padding: 2px 8px; border-radius: 4px; font-size: 0.75rem; margin: 2px; }
    .empty-state { text-align: center; color: #999; padding: 40px; }
  `]
})
export class CheckInComponent implements OnInit {
  reservasConfirmadas: ReservaResponse[] = [];
  codigoBusqueda = '';

  constructor(
    private service: ReservaService,
    private auth: AuthService
  ) {}

  ngOnInit(): void {
    this.service.getAll('pendiente').subscribe({
      next: (data) => this.reservasConfirmadas = data
    });
  }

  buscarReserva(): void {
    if (!this.codigoBusqueda) return;
    this.service.getByCodigo(this.codigoBusqueda).subscribe({
      next: (reserva) => {
        if (reserva.estado === 'pendiente') {
          this.reservasConfirmadas = [reserva];
        } else {
          alert(`La reserva ${this.codigoBusqueda} no está pendiente de check-in`);
        }
      },
      error: () => alert('Reserva no encontrada')
    });
  }

  realizarCheckIn(reservaId: string): void {
    if (!confirm('¿Confirmar check-in para esta reserva?')) return;
    this.service.checkIn({
      reservaId,
      fechaCheckIn: new Date().toISOString()
    }).subscribe({
      next: () => {
        alert('Check-In exitoso');
        this.reservasConfirmadas = this.reservasConfirmadas.filter(r => r.id !== reservaId);
      },
      error: () => alert('Error al realizar check-in')
    });
  }
}
