import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ReservaService } from '../../../core/services/reserva.service';
import { ClienteService } from '../../../core/services/cliente.service';
import { HabitacionService } from '../../../core/services/habitacion.service';
import { AuthService } from '../../../core/services/auth.service';
import { ClienteResponse } from '../../../core/models/cliente';
import { HabitacionResponse } from '../../../core/models/habitacion';
import { CanalVenta } from '../../../core/models/reserva';
import { clasificarEdad } from '../../../core/utils/edad';

@Component({
  selector: 'app-reserva-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="page">
      <div class="page-header">
        <h2>Nueva Reserva Individual</h2>
        <a routerLink="/reservas" class="btn-secondary">Volver</a>
      </div>

      <div class="card">
        <div class="card-body">
          <form (ngSubmit)="onCreate()" class="form">
            <div class="form-row">
              <div class="form-group">
                <label>Cliente <span class="required">*</span></label>
                <select [(ngModel)]="form.clienteId" name="cliente" required (change)="onClienteChange()">
                  <option value="">Seleccione...</option>
                  <option *ngFor="let c of clientes" [value]="c.id">{{ c.nombres }} {{ c.apellidos }} - {{ c.numeroDocumento }}</option>
                </select>
              </div>
            </div>

            <div class="form-group">
              <label>Canal de Venta <span class="required">*</span></label>
              <div *ngIf="canalesVenta.length === 0" class="loading-canales">Cargando canales...</div>
              <div class="canales-grid" *ngIf="canalesVenta.length > 0">
                <button
                  type="button"
                  *ngFor="let c of canalesVenta"
                  class="canal-card"
                  [class.selected]="form.canalVentaId === c.id"
                  (click)="seleccionarCanal(c)"
                >
                  <span class="canal-icono">{{ c.icono }}</span>
                  <span class="canal-nombre">{{ c.nombre }}</span>
                  <span *ngIf="form.canalVentaId === c.id" class="check-mark">✓</span>
                </button>
              </div>
              <div *ngIf="form.canalVentaId && canalSeleccionadoEsOtro()" class="form-group" style="margin-top: 8px;">
                <label>Especifique el canal <span class="required">*</span></label>
                <input type="text" [(ngModel)]="form.canalVentaOtro" name="canalVentaOtro" placeholder="¿A través de qué medio nos contactó?" required />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Fecha Ingreso <span class="required">*</span></label>
                <input type="date" [(ngModel)]="form.fechaIngreso" name="fechaIngreso" required (change)="onFechasChange()" />
              </div>
              <div class="form-group">
                <label>Fecha Salida <span class="required">*</span></label>
                <input type="date" [(ngModel)]="form.fechaSalida" name="fechaSalida" required (change)="onFechasChange()" />
              </div>
            </div>

            <div *ngIf="habitacionesDisponibles.length > 0" class="form-group">
              <label>Habitaciones Disponibles <span class="required">*</span></label>
              <div class="checkbox-grid">
                <label class="checkbox-label" *ngFor="let h of habitacionesDisponibles">
                  <input type="checkbox" [value]="h.id" (change)="toggleHabitacion(h.id, $any($event.target).checked)" />
                  <span class="room-card">
                    <strong>{{ h.numero }}</strong>
                    <small>{{ h.tipoNombre }}</small>
                  </span>
                </label>
              </div>
            </div>

            <div *ngIf="habitacionesNoDisponibles.length > 0 && allHabitaciones.length > 0" class="form-group">
              <label class="no-disponible-label">No disponibles</label>
              <div class="checkbox-grid">
                <div class="checkbox-label no-disponible" *ngFor="let h of habitacionesNoDisponibles">
                  <span class="room-card">
                    <strong>{{ h.numero }}</strong>
                    <small>{{ h.tipoNombre }}</small>
                  </span>
                  <span class="motivo-badge">{{ h.motivo }}</span>
                </div>
              </div>
            </div>

            <div *ngIf="error" class="alert alert-error">{{ error }}</div>

            <div class="form-actions">
              <a routerLink="/reservas" class="btn-secondary">Cancelar</a>
              <button type="submit" class="btn-primary" [disabled]="!puedeEnviar()">
                Crear Reserva
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page { max-width: 800px; margin: 0 auto; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
    .page-header h2 { margin: 0; font-size: 1.3rem; color: #333; }
    .card { background: white; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
    .card-body { padding: 24px; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .form-group { margin-bottom: 16px; }
    label { display: block; margin-bottom: 4px; font-size: 0.8rem; color: #555; font-weight: 500; }
    .required { color: #c62828; }
    input, select { width: 100%; padding: 10px 12px; border: 1px solid #ddd; border-radius: 6px; font-size: 0.85rem; box-sizing: border-box; transition: border-color 0.2s; }
    input:focus, select:focus { outline: none; border-color: #1a237e; box-shadow: 0 0 0 3px rgba(26,35,126,0.1); }
    .checkbox-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 8px; }
    .checkbox-label { display: flex; align-items: center; gap: 8px; font-size: 0.85rem; cursor: pointer; padding: 8px 12px; border: 1px solid #eee; border-radius: 6px; transition: all 0.2s; }
    .checkbox-label:hover { border-color: #1a237e; background: #f5f5ff; }
    .checkbox-label input:checked + .room-card { color: #1a237e; }
    .checkbox-label:has(input:checked) { border-color: #1a237e; background: #e8eaf6; }
    .room-card { display: flex; flex-direction: column; }
    .room-card small { color: #888; font-size: 0.75rem; }
    .canales-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: 10px; }
    .canal-card { display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 16px 12px; border: 2px solid #e0e0e0; border-radius: 12px; background: white; cursor: pointer; transition: all 0.2s; font-family: inherit; position: relative; }
    .canal-card:hover { border-color: #90caf9; background: #f5f8ff; transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
    .canal-card.selected { border-color: #1a237e; background: #e8eaf6; box-shadow: 0 2px 8px rgba(26,35,126,0.15); }
    .canal-icono { font-size: 1.8rem; line-height: 1; }
    .canal-nombre { font-size: 0.8rem; font-weight: 600; color: #333; }
    .check-mark { position: absolute; top: 6px; right: 8px; font-size: 0.7rem; color: #1a237e; font-weight: 700; background: #c5cae9; border-radius: 50%; width: 18px; height: 18px; display: flex; align-items: center; justify-content: center; }
    .form-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 20px; padding-top: 16px; border-top: 1px solid #eee; }
    .btn-primary { padding: 10px 24px; background: #1a237e; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 0.85rem; font-weight: 500; }
    .btn-primary:hover { background: #283593; }
    .btn-primary:disabled { background: #9fa8da; cursor: not-allowed; }
    .btn-secondary { padding: 10px 24px; background: #f5f5f5; color: #555; border: 1px solid #ddd; border-radius: 6px; cursor: pointer; font-size: 0.85rem; text-decoration: none; }
    .btn-secondary:hover { background: #eee; }
    .alert { padding: 10px 14px; border-radius: 6px; font-size: 0.8rem; margin: 12px 0; }
    .alert-error { background: #ffebee; color: #c62828; border: 1px solid #ffcdd2; }
    .no-disponible-label { color: #999; margin-top: 12px; }
    .checkbox-label.no-disponible { background: #f9f9f9; border-color: #e8e8e8; cursor: default; opacity: 0.7; pointer-events: none; }
    .checkbox-label.no-disponible:hover { border-color: #e8e8e8; background: #f9f9f9; }
    .motivo-badge { font-size: 0.65rem; font-weight: 600; color: #888; background: #f0f0f0; padding: 2px 8px; border-radius: 8px; white-space: nowrap; margin-left: auto; }
  `]
})
export class ReservaFormComponent implements OnInit {
  clientes: ClienteResponse[] = [];
  clientesMap = new Map<string, ClienteResponse>();
  habitacionesDisponibles: HabitacionResponse[] = [];
  allHabitaciones: HabitacionResponse[] = [];
  habitacionesNoDisponibles: (HabitacionResponse & { motivo: string })[] = [];
  canalesVenta: CanalVenta[] = [];
  error = '';

  form: any = {
    fechaIngreso: '', fechaSalida: '', clienteId: '', creadoPor: '',
    adultos: 0, ninos: 0,
    canalVentaId: null, canalVentaOtro: '', habitacionesIds: []
  };

  constructor(
    private service: ReservaService,
    private clienteService: ClienteService,
    private habitacionService: HabitacionService,
    private auth: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.clienteService.getAll().subscribe({ next: (data) => {
      this.clientes = data;
      this.clientesMap = new Map(data.map(c => [c.id, c]));
    }});
    this.habitacionService.getAll().subscribe({ next: (data) => {
      this.allHabitaciones = data;
      this.clasificarHabitaciones();
    }});
    this.service.getCanalesVenta().subscribe({ next: (data) => this.canalesVenta = data });
  }

  canalSeleccionadoEsOtro(): boolean {
    const canal = this.canalesVenta.find(c => c.id === this.form.canalVentaId);
    return canal?.nombre === 'Otro';
  }

  seleccionarCanal(c: CanalVenta): void {
    this.form.canalVentaId = c.id;
    if (c.nombre !== 'Otro') {
      this.form.canalVentaOtro = '';
    }
  }

  onClienteChange(): void {
    const cliente = this.clientesMap.get(this.form.clienteId);
    this.form.adultos = 0;
    this.form.ninos = 0;
    if (cliente) {
      const cat = clasificarEdad(cliente.fechaNacimiento);
      if (cat === 'adulto' || cat === 'adolescente' || cat === 'adulto_mayor') this.form.adultos = 1;
      else if (cat === 'nino') this.form.ninos = 1;
    }
  }

  onFechasChange(): void {
    if (this.form.fechaIngreso && this.form.fechaSalida) {
      this.habitacionService.getDisponibles(this.form.fechaIngreso, this.form.fechaSalida)
        .subscribe({ next: (data) => {
          this.habitacionesDisponibles = data;
          this.clasificarNoDisponibles();
        }});
    } else {
      this.clasificarHabitaciones();
    }
  }

  private clasificarHabitaciones(): void {
    const disponiblesEstados = new Set(['disponible', 'por_limpiar']);
    this.habitacionesDisponibles = this.allHabitaciones.filter(h => disponiblesEstados.has(h.estadoActual));
    this.clasificarNoDisponibles();
  }

  private clasificarNoDisponibles(): void {
    const disponiblesIds = new Set(this.habitacionesDisponibles.map(h => h.id));
    this.habitacionesNoDisponibles = this.allHabitaciones
      .filter(h => !disponiblesIds.has(h.id))
      .map(h => ({ ...h, motivo: this.obtenerMotivoNoDisponible(h) }));
  }

  private obtenerMotivoNoDisponible(h: HabitacionResponse): string {
    switch (h.estadoActual) {
      case 'mantenimiento': return 'En mantenimiento';
      case 'ocupada': return 'Ocupada';
      case 'en_limpieza': return 'En limpieza';
      case 'remodelacion': return 'En remodelación';
      case 'inabitable': return 'Inabitable';
      default: return 'Reservada en esas fechas';
    }
  }

  toggleHabitacion(id: string, checked: boolean): void {
    if (checked) this.form.habitacionesIds.push(id);
    else this.form.habitacionesIds = this.form.habitacionesIds.filter((h: string) => h !== id);
  }

  puedeEnviar(): boolean {
    if (!this.form.clienteId || !this.form.fechaIngreso || !this.form.fechaSalida || !this.form.canalVentaId || this.form.habitacionesIds.length === 0) return false;
    if (this.canalSeleccionadoEsOtro() && !this.form.canalVentaOtro?.trim()) return false;
    return true;
  }

  onCreate(): void {
    const user = this.auth.getUsuario();
    if (!user?.id) { this.error = 'Usuario no autenticado'; return; }
    this.form.creadoPor = user.id;
    this.service.create(this.form).subscribe({
      next: () => this.router.navigate(['/reservas']),
      error: (err) => this.error = err.error?.message || 'Error al crear reserva'
    });
  }
}
