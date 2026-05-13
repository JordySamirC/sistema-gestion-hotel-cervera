import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ReservaService } from '../../../core/services/reserva.service';
import { AuthService } from '../../../core/services/auth.service';
import { ReservaResponse, CancelarReservaRequest } from '../../../core/models/reserva';

@Component({
  selector: 'app-reserva-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="page">
      <div class="page-header">
        <h2>Reservas</h2>
        <div class="actions">
          <select (change)="filtrarEstado($any($event.target).value)" class="filter-select">
            <option value="">Todas</option>
            <option value="pendiente">Pendiente</option>
            <option value="checked_in">Check-In</option>
            <option value="no_show">No Show</option>
            <option value="cancelada">Cancelada</option>
          </select>
          <a routerLink="/reservas/grupo/nuevo" class="btn-secondary">Reserva Grupal</a>
          <a routerLink="/reservas/nueva" class="btn-primary">Nueva Reserva</a>
        </div>
      </div>

      <div class="table-container">
        <table class="table">
          <thead>
            <tr>
              <th>Código</th>
              <th>Cliente</th>
              <th>Ingreso</th>
              <th>Salida</th>
              <th>Grupo</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let r of reservasFiltradas">
              <td class="codigo">{{ r.codigo }}</td>
              <td>{{ r.clienteNombre }}</td>
              <td>{{ r.fechaIngreso | date:'dd/MM/yyyy' }}</td>
              <td>{{ r.fechaSalida | date:'dd/MM/yyyy' }}</td>
              <td>
                <span *ngIf="r.nombreGrupo" class="badge badge-grupo" [routerLink]="['/reservas', r.id]">{{ r.nombreGrupo }}</span>
              </td>
              <td><span class="badge" [class]="getEstadoClass(r.estado)">{{ estadoLabel(r.estado) }}</span></td>
              <td>
                <button class="btn-sm" [routerLink]="['/reservas', r.id]">Ver</button>
                <button class="btn-sm" [routerLink]="['/check-in']">Check-In</button>
                <button class="btn-sm btn-cancel" (click)="abrirCancelacion(r)" *ngIf="auth.esGerente() && r.estado === 'pendiente'">Cancelar</button>
              </td>
            </tr>
            <tr *ngIf="reservasFiltradas.length === 0">
              <td colspan="7" class="empty">No hay reservas</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="modal-overlay" *ngIf="cancelandoReserva" (click)="cerrarCancelacion()">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>Cancelar reserva #{{ cancelandoReserva.codigo }}</h3>
            <button class="modal-close" (click)="cerrarCancelacion()">&times;</button>
          </div>
          <div class="modal-body">
            <p><strong>Huésped:</strong> {{ cancelandoReserva.clienteNombre }}</p>
            <p><strong>Fechas:</strong> {{ cancelandoReserva.fechaIngreso | date:'dd/MM/yyyy' }} - {{ cancelandoReserva.fechaSalida | date:'dd/MM/yyyy' }}</p>
            <div class="alert alert-warning">Al cancelar, la habitaci\u00F3n quedar\u00E1 disponible.</div>
            <div class="form-group">
              <label>Motivo de cancelaci\u00F3n</label>
              <select [(ngModel)]="cancelacionMotivo" class="form-control">
                <option value="">Seleccione...</option>
                <option value="Cliente anula">Cliente anula por cambio de planes</option>
                <option value="No Show">Cliente no se presenta</option>
                <option value="Overbooking">Overbooking - Hotel cancela</option>
                <option value="Otro">Otro</option>
              </select>
            </div>
            <div class="form-group">
              <label>Observaciones</label>
              <textarea [(ngModel)]="cancelacionObservaciones" class="form-control" rows="3" placeholder="Ej: Cliente llam\u00F3 el d\u00EDa antes..."></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-secondary" (click)="cerrarCancelacion()">Volver</button>
            <button class="btn-danger" (click)="confirmarCancelacion()" [disabled]="!cancelacionMotivo">Confirmar Cancelaci\u00F3n</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page, .page-header { margin-bottom: 20px; }
    .page-header { display: flex; justify-content: space-between; align-items: center; }
    .page-header h2 { margin: 0; font-size: 1.3rem; color: #333; }
    .actions { display: flex; gap: 8px; }
    .filter-select { padding: 8px 12px; border: 1px solid #ddd; border-radius: 6px; font-size: 0.85rem; background: white; }
    .form-group { margin-bottom: 12px; }
    label { display: block; margin-bottom: 4px; font-size: 0.8rem; color: #555; }
    input, select { width: 100%; padding: 8px 10px; border: 1px solid #ddd; border-radius: 4px; font-size: 0.85rem; box-sizing: border-box; }
    .btn-primary { padding: 8px 20px; background: #1a237e; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.85rem; text-decoration: none; display: inline-block; }
    .btn-secondary { padding: 8px 20px; background: #f5f5f5; color: #555; border: 1px solid #ddd; border-radius: 4px; cursor: pointer; font-size: 0.85rem; text-decoration: none; display: inline-block; }
    .btn-secondary:hover { background: #eee; }
    .btn-sm { padding: 4px 10px; background: #e8eaf6; color: #1a237e; border: none; border-radius: 4px; cursor: pointer; font-size: 0.75rem; margin-right: 4px; }
    .table-container { background: white; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); overflow-x: auto; }
    .table { width: 100%; border-collapse: collapse; }
    .table th, .table td { padding: 12px 16px; text-align: left; font-size: 0.85rem; border-bottom: 1px solid #f0f0f0; }
    .table th { background: #fafafa; color: #666; font-weight: 600; }
    .codigo { font-weight: 600; color: #1a237e; font-family: monospace; }
    .badge { padding: 3px 10px; border-radius: 12px; font-size: 0.75rem; font-weight: 500; background: #e0e0e0; }
    .badge-grupo { background: #e8f5e9; color: #2e7d32; cursor: pointer; text-decoration: none; }
    .badge-grupo:hover { background: #c8e6c9; }
    .estado-pendiente { background: #fff3e0; color: #e65100; }
    .estado-checked_in { background: #e3f2fd; color: #1565c0; }
    .estado-no_show { background: #f3e5f5; color: #6a1b9a; }
    .estado-cancelada { background: #ffebee; color: #c62828; }
    .btn-cancel { background: #ffebee; color: #c62828; }
    .btn-cancel:hover { background: #ffcdd2; }
    .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; z-index: 1000; }
    .modal { background: white; border-radius: 12px; width: 480px; max-width: 90vw; box-shadow: 0 8px 32px rgba(0,0,0,0.2); }
    .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 20px 24px 0; }
    .modal-header h3 { margin: 0; font-size: 1.1rem; color: #333; }
    .modal-close { background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #999; padding: 0; line-height: 1; }
    .modal-body { padding: 16px 24px; }
    .modal-body p { margin: 4px 0; font-size: 0.85rem; color: #555; }
    .modal-footer { display: flex; justify-content: flex-end; gap: 8px; padding: 16px 24px 20px; }
    .form-control { width: 100%; padding: 8px 10px; border: 1px solid #ddd; border-radius: 4px; font-size: 0.85rem; box-sizing: border-box; }
    .form-control:focus { outline: none; border-color: #1a237e; }
    textarea.form-control { resize: vertical; font-family: inherit; }
    .alert { padding: 10px 14px; border-radius: 6px; font-size: 0.8rem; margin: 12px 0; }
    .alert-warning { background: #fff3e0; color: #e65100; border: 1px solid #ffe0b2; }
    .btn-danger { padding: 8px 20px; background: #c62828; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.85rem; }
    .btn-danger:hover { background: #b71c1c; }
    .btn-danger:disabled { background: #ef9a9a; cursor: not-allowed; }
    .empty { text-align: center; color: #999; padding: 20px; }
  `]
})
export class ReservaListComponent implements OnInit {
  reservas: ReservaResponse[] = [];
  reservasFiltradas: ReservaResponse[] = [];
  filtroEstado = '';

  readonly estadosLabel: Record<string, string> = {
    pendiente: 'Pendiente',
    checked_in: 'Check-In',
    no_show: 'No Show',
    cancelada: 'Cancelada'
  };

  estadoLabel(estado: string): string {
    return this.estadosLabel[estado] ?? estado;
  }

  cancelandoReserva: ReservaResponse | null = null;
  cancelacionMotivo = '';
  cancelacionObservaciones = '';

  constructor(
    private service: ReservaService,
    public auth: AuthService
  ) {}

  ngOnInit(): void {
    this.loadReservas();
  }

  loadReservas(): void {
    this.service.getAll().subscribe({ next: (data) => { this.reservas = data; this.aplicarFiltro(); } });
  }

  filtrarEstado(estado: string): void { this.filtroEstado = estado; this.aplicarFiltro(); }

  getEstadoClass(estado: string): string {
    return 'estado-' + estado.toLowerCase().replace(/ /g, '-');
  }

  private aplicarFiltro(): void {
    this.reservasFiltradas = this.filtroEstado
      ? this.reservas.filter(r => r.estado === this.filtroEstado)
      : this.reservas;
  }

  abrirCancelacion(r: ReservaResponse): void {
    this.cancelandoReserva = r;
    this.cancelacionMotivo = '';
    this.cancelacionObservaciones = '';
  }

  cerrarCancelacion(): void {
    this.cancelandoReserva = null;
    this.cancelacionMotivo = '';
    this.cancelacionObservaciones = '';
  }

  confirmarCancelacion(): void {
    if (!this.cancelandoReserva || !this.cancelacionMotivo) return;
    const request: CancelarReservaRequest = {
      motivoCancelacion: this.cancelacionMotivo,
      observaciones: this.cancelacionObservaciones || undefined
    };
    this.service.cancelar(this.cancelandoReserva.id, request).subscribe({
      next: () => {
        this.cerrarCancelacion();
        this.loadReservas();
      },
      error: () => alert('Error al cancelar la reserva')
    });
  }

}
