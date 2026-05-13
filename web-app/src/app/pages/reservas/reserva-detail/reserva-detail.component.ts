import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ReservaService } from '../../../core/services/reserva.service';
import { AuthService } from '../../../core/services/auth.service';
import { ReservaResponse } from '../../../core/models/reserva';

@Component({
  selector: 'app-reserva-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="detalle" *ngIf="reserva">
      <div class="detalle-header">
        <h2>Reserva #{{ reserva.codigo }}</h2>
        <button class="btn-close" (click)="volver()">&times;</button>
      </div>

      <div class="volver-section">
        <button class="btn-volver" (click)="volver()">&larr; Volver</button>
      </div>

      <div class="seccion">
        <h3>INFORMACI&Oacute;N GENERAL</h3>
        <div class="info-grid">
          <div class="campo">
            <span class="label">C&oacute;digo:</span>
            <span class="valor codigo">{{ reserva.codigo }}</span>
          </div>
          <div class="campo">
            <span class="label">Estado:</span>
            <span class="badge" [ngClass]="badgeClass(reserva.estado)">{{ estadoLabel }}</span>
          </div>
          <div class="campo">
            <span class="label">Fecha de Reserva:</span>
            <span class="valor">{{ reserva.fechaReserva | date:'dd/MM/yyyy HH:mm' }}</span>
          </div>
          <div class="campo">
            <span class="label">Cliente:</span>
            <span class="valor">{{ reserva.clienteNombre }}</span>
          </div>
          <div class="campo">
            <span class="label">Fecha Ingreso:</span>
            <span class="valor">{{ reserva.fechaIngreso | date:'dd/MM/yyyy' }}</span>
          </div>
          <div class="campo">
            <span class="label">Fecha Salida:</span>
            <span class="valor">{{ reserva.fechaSalida | date:'dd/MM/yyyy' }}</span>
          </div>
          <div class="campo">
            <span class="label">Creado por:</span>
            <span class="valor">{{ reserva.creadoPorNombre }}</span>
          </div>
          <div class="campo" *ngIf="reserva.nombreGrupo">
            <span class="label">Grupo:</span>
            <span class="valor grupo-badge">{{ reserva.nombreGrupo }}</span>
          </div>
        </div>
      </div>

      <div class="seccion">
        <h3>HU&Eacute;SPEDES</h3>
        <ul class="huespedes-lista" *ngIf="reserva.huespedes && reserva.huespedes.length > 0; else sinHuespedes">
          <li *ngFor="let h of reserva.huespedes">
            <span class="huesped-nombre">{{ h.clienteNombre }}</span>
            <span class="titular-badge" *ngIf="h.esTitular">👑 Titular</span>
          </li>
        </ul>
        <ng-template #sinHuespedes>
          <p class="text-muted">Sin hu&eacute;spedes registrados</p>
        </ng-template>
      </div>

      <div class="seccion">
        <h3>HABITACIONES</h3>
        <table class="habitaciones-tabla">
          <thead>
            <tr><th>#</th><th>Habitaci&oacute;n</th><th>Precio Aplicado</th></tr>
          </thead>
          <tbody>
            <tr *ngFor="let d of reserva.detalles; let i = index">
              <td>{{ i + 1 }}</td>
              <td>{{ d.habitacionNumero }}</td>
              <td>S/ {{ d.precioAplicado | number:'1.2-2' }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="seccion" *ngIf="reserva.motivoCancelacion">
        <h3>CANCELACI&Oacute;N</h3>
        <div class="info-grid">
          <div class="campo"><span class="label">Motivo:</span><span class="valor">{{ reserva.motivoCancelacion }}</span></div>
          <div class="campo" *ngIf="reserva.observacionesCancelacion"><span class="label">Observaciones:</span><span class="valor">{{ reserva.observacionesCancelacion }}</span></div>
          <div class="campo" *ngIf="reserva.fechaCancelacion"><span class="label">Fecha:</span><span class="valor">{{ reserva.fechaCancelacion | date:'dd/MM/yyyy HH:mm' }}</span></div>
        </div>
      </div>

      <div class="acciones">
        <button class="btn btn-editar" (click)="editar()">Editar</button>
        <button class="btn btn-checkin" (click)="checkIn()" *ngIf="reserva.estado === 'pendiente'">Check-In</button>
        <button class="btn btn-cancelar" (click)="cancelar()" *ngIf="auth.esGerente() && reserva.estado === 'pendiente'">Cancelar</button>
        <button class="btn btn-extender" (click)="extender()" *ngIf="reserva.estado === 'checked_in'">Extender</button>
      </div>
    </div>

    <div class="cargando" *ngIf="!reserva && !error">
      Cargando reserva...
    </div>

    <div class="error" *ngIf="error">
      <p>{{ error }}</p>
      <button class="btn-volver" (click)="volver()">&larr; Volver al listado</button>
    </div>
  `,
  styles: [`
    .detalle { max-width: 900px; margin: 0 auto; }
    .detalle-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
    .detalle-header h2 { margin: 0; font-size: 1.3rem; color: #333; }
    .btn-close { background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #999; padding: 0; line-height: 1; }
    .btn-close:hover { color: #333; }
    .volver-section { margin-bottom: 20px; }
    .btn-volver { padding: 6px 14px; background: #f5f5f5; color: #555; border: 1px solid #ddd; border-radius: 6px; cursor: pointer; font-size: 0.85rem; text-decoration: none; }
    .btn-volver:hover { background: #eee; }
    .seccion { background: white; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); margin-bottom: 16px; padding: 20px; }
    .seccion h3 { margin: 0 0 16px; font-size: 1rem; color: #333; border-bottom: 1px solid #eee; padding-bottom: 8px; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4px; }
    .campo { display: flex; justify-content: space-between; padding: 6px 0; font-size: 0.85rem; border-bottom: 1px solid #f5f5f5; }
    .campo .label { color: #888; font-weight: 500; flex-shrink: 0; margin-right: 12px; }
    .campo .valor { color: #333; text-align: right; }
    .codigo { font-weight: 600; color: #1a237e; font-family: monospace; }
    .grupo-badge { display: inline-block; background: #e8f5e9; color: #2e7d32; padding: 2px 10px; border-radius: 12px; font-size: 0.75rem; font-weight: 500; }
    .badge { padding: 3px 10px; border-radius: 12px; font-size: 0.75rem; font-weight: 500; }
    .estado-pendiente { background: #fff3e0; color: #e65100; }
    .estado-checked_in { background: #e3f2fd; color: #1565c0; }
    .estado-checked_out { background: #f3e5f5; color: #6a1b9a; }
    .estado-cancelada { background: #ffebee; color: #c62828; }
    .estado-no_show { background: #f3e5f5; color: #6a1b9a; }
    .huespedes-lista { list-style: none; padding: 0; margin: 0; }
    .huespedes-lista li { display: flex; align-items: center; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f5f5f5; font-size: 0.85rem; }
    .huespedes-lista li:last-child { border-bottom: none; }
    .huesped-nombre { color: #333; }
    .titular-badge { color: #1a237e; font-size: 0.8rem; font-weight: 500; }
    .text-muted { color: #999; font-size: 0.8rem; font-style: italic; margin: 0; }
    .habitaciones-tabla { width: 100%; border-collapse: collapse; }
    .habitaciones-tabla th, .habitaciones-tabla td { padding: 10px 12px; text-align: left; font-size: 0.85rem; border-bottom: 1px solid #f0f0f0; }
    .habitaciones-tabla th { background: #fafafa; color: #666; font-weight: 600; }
    .acciones { display: flex; gap: 8px; margin-top: 20px; }
    .btn { padding: 10px 24px; border: none; border-radius: 6px; cursor: pointer; font-size: 0.85rem; font-weight: 500; }
    .btn-editar { background: #e8eaf6; color: #1a237e; }
    .btn-editar:hover { background: #c5cae9; }
    .btn-checkin { background: #e8f5e9; color: #2e7d32; }
    .btn-checkin:hover { background: #c8e6c9; }
    .btn-cancelar { background: #ffebee; color: #c62828; }
    .btn-cancelar:hover { background: #ffcdd2; }
    .btn-extender { background: #fff3e0; color: #e65100; }
    .btn-extender:hover { background: #ffe0b2; }
    .cargando, .error { text-align: center; padding: 40px; color: #999; }
    .error p { color: #c62828; margin-bottom: 16px; }
  `]
})
export class ReservaDetailComponent implements OnInit {
  reserva: ReservaResponse | null = null;
  error: string | null = null;

  readonly estadosLabel: Record<string, string> = {
    pendiente: 'Pendiente',
    checked_in: 'Check-In',
    checked_out: 'Check-Out',
    cancelada: 'Cancelada',
    no_show: 'No Show'
  };

  constructor(
    private route: ActivatedRoute,
    private service: ReservaService,
    public auth: AuthService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      if (id.startsWith('RES-') || id.startsWith('GRP-')) {
        this.service.getByCodigo(id).subscribe({
          next: (data) => this.reserva = data,
          error: () => this.error = 'No se encontr&oacute; la reserva con c&oacute;digo ' + id
        });
      } else {
        this.service.getById(id).subscribe({
          next: (data) => this.reserva = data,
          error: () => this.error = 'No se encontr&oacute; la reserva solicitada'
        });
      }
    }
  }

  get estadoLabel(): string {
    if (!this.reserva) return '';
    return this.estadosLabel[this.reserva.estado] ?? this.reserva.estado;
  }

  badgeClass(estado: string): string {
    return 'estado-' + estado.toLowerCase().replace(/ /g, '_');
  }

  volver(): void {
    window.history.back();
  }

  editar(): void {
    alert('Funcionalidad de edici&oacute;n pr&oacute;ximamente');
  }

  checkIn(): void {
    alert('Redirigiendo a Check-In...');
  }

  cancelar(): void {
    if (!confirm('Confirmar cancelaci&oacute;n de la reserva ' + this.reserva?.codigo + '?')) return;
    this.service.cancelar(this.reserva!.id, { motivoCancelacion: 'Cliente anula' }).subscribe({
      next: () => window.location.reload(),
      error: () => alert('Error al cancelar la reserva')
    });
  }

  extender(): void {
    alert('Funcionalidad de extensi&oacute;n pr&oacute;ximamente');
  }
}
