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
import { HuespedRequest, ReservaEnGrupoRequest, GrupoRequest, CanalVenta } from '../../../core/models/reserva';
import { clasificarEdad } from '../../../core/utils/edad';

interface HabitacionEnFormulario {
  habitacionId: string;
  numero: string;
  tipoNombre: string;
  capacidadMax: number;
  titular: ClienteResponse | null;
  acompanantes: ClienteResponse[];
}

@Component({
  selector: 'app-grupo-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="page">
      <div class="page-header">
        <h2>Nueva Reserva Grupal</h2>
        <a routerLink="/reservas" class="btn-secondary">Volver</a>
      </div>

      <div class="card">
        <div class="card-body">
          <form (ngSubmit)="onCreate()" class="form">
            <h3>Datos del Grupo</h3>
            <div class="form-row">
              <div class="form-group">
                <label>Nombre del Grupo <span class="required">*</span></label>
                <input type="text" [(ngModel)]="form.nombreGrupo" name="nombreGrupo" required placeholder="Ej: Familia Pérez, Tour Grupo A" />
              </div>
              <div class="form-group">
                <label>Responsable de Pago <span class="required">*</span></label>
                <select [(ngModel)]="form.responsablePagoId" name="responsablePago" required>
                  <option value="">Seleccione...</option>
                  <option *ngFor="let c of clientes" [value]="c.id">{{ c.nombres }} {{ c.apellidos }} - {{ c.numeroDocumento }}</option>
                </select>
              </div>
            </div>

            <div class="form-group">
              <label>Canal de Venta <span class="required">*</span></label>
              <div class="canales-grid">
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

            <h3>Habitaciones</h3>
            <div *ngIf="habitacionesDisponibles.length > 0" class="form-group">
              <label class="section-subtitle">Disponibles</label>
              <div class="checkbox-grid">
                <label class="checkbox-label" *ngFor="let h of habitacionesDisponibles">
                  <input type="checkbox" [value]="h.id" (change)="toggleHabitacion(h, $any($event.target).checked)" />
                  <strong>{{ h.numero }}</strong> - {{ h.tipoNombre }} <span class="cap-badge">Cap. {{ h.capacidadMax }}</span>
                </label>
              </div>
            </div>

            <div *ngIf="habitacionesNoDisponibles.length > 0 && allHabitaciones.length > 0" class="form-group">
              <label class="section-subtitle no-disponible-label">No disponibles</label>
              <div class="checkbox-grid">
                <div class="checkbox-label no-disponible" *ngFor="let h of habitacionesNoDisponibles">
                  <strong>{{ h.numero }}</strong> - {{ h.tipoNombre }} <span class="cap-badge">Cap. {{ h.capacidadMax }}</span>
                  <span class="motivo-badge">{{ h.motivo }}</span>
                </div>
              </div>
            </div>

            <div *ngFor="let h of habitacionesSeleccionadas; let i = index" class="room-card">
              <div class="room-header">
                <span class="room-title">HABITACIÓN {{ h.numero }} ({{ h.tipoNombre }} - Cap. {{ h.capacidadMax }})</span>
                <button type="button" class="btn-icon btn-danger-icon" (click)="quitarHabitacion(i)" title="Eliminar habitación">&times;</button>
              </div>

              <div class="room-summary">
                <span class="badge badge-adultos-mayores">{{ countCategoria(h, 'adulto_mayor') }} Adulto(s) Mayor(es)</span>
                <span class="badge badge-adultos">{{ countCategoria(h, 'adulto') }} Adulto(s)</span>
                <span class="badge badge-adolescentes">{{ countCategoria(h, 'adolescente') }} Adolescente(s)</span>
                <span class="badge badge-ninos">{{ countCategoria(h, 'nino') }} Ni&ntilde;o(s)</span>
              </div>

              <div class="room-section">
                <div class="section-label">👑 TITULAR</div>
                <div *ngIf="h.titular" class="guest-card titular-card">
                  <div class="guest-info">
                    <strong>{{ h.titular.nombres }} {{ h.titular.apellidos }}</strong>
                    <span class="guest-detail">DNI: {{ h.titular.numeroDocumento }}</span>
                  </div>
                  <button type="button" class="btn-sm" (click)="cambiarTitularConConfirm(h)">Cambiar Titular</button>
                </div>
                <button *ngIf="!h.titular" type="button" class="btn-add" (click)="abrirModal(h, 'titular')">+ Elegir Titular 👑</button>
              </div>

              <div class="room-divider">&mdash; O &mdash;</div>

              <div class="room-section">
                <div class="section-label">
                  👥 ACOMPA&Ntilde;ANTES
                  <span class="plazas-libres" [class.plazas-llenas]="getPlazasLibres(h) <= 0">
                    ({{ getPlazasLibres(h) }} plaza{{ getPlazasLibres(h) !== 1 ? 's' : '' }} libre{{ getPlazasLibres(h) !== 1 ? 's' : '' }})
                  </span>
                </div>
                <div *ngIf="h.acompanantes.length === 0" class="text-muted">Sin acompa&ntilde;antes</div>
                <div *ngFor="let a of h.acompanantes; let j = index" class="guest-card">
                  <div class="guest-info">
                    <strong>{{ a.nombres }} {{ a.apellidos }}</strong>
                    <span class="guest-detail">DNI: {{ a.numeroDocumento }}</span>
                  </div>
                  <button type="button" class="btn-icon btn-danger-icon btn-icon-sm" (click)="quitarAcompanante(h, j)" title="Quitar acompa&ntilde;ante">&times;</button>
                </div>
                <button
                  type="button"
                  class="btn-add"
                  [class.btn-disabled]="getPlazasLibres(h) <= 0"
                  [disabled]="getPlazasLibres(h) <= 0"
                  (click)="abrirModal(h, 'acompanante')">
                  + Agregar Acompa&ntilde;ante 👤
                </button>
              </div>

              <div class="ocupacion-bar-container">
                <span class="ocupacion-label">Ocupaci&oacute;n:</span>
                <div class="ocupacion-bar">
                  <div
                    class="ocupacion-fill"
                    [style.width.%]="getOcupacionPorcentaje(h)"
                    [style.background]="getOcupacionColor(h)">
                  </div>
                </div>
                <span class="ocupacion-text">{{ getCapacidadAsignada(h) }}/{{ h.capacidadMax }}</span>
                <span *ngIf="getPlazasLibres(h) <= 0" class="badge-completa">Completa</span>
              </div>
            </div>

            <div *ngIf="error" class="alert alert-error">{{ error }}</div>

            <div class="form-actions">
              <a routerLink="/reservas" class="btn-secondary">Cancelar</a>
              <button type="submit" class="btn-primary"
                [disabled]="!puedeEnviar()">
                Crear Grupo
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <div *ngIf="modalAbierto" class="modal-overlay" (click)="cerrarModal($event)">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>{{ accionModal === 'titular' ? 'Elegir Titular 👑' : 'Agregar Acompa&ntilde;ante 👤' }}</h3>
          <button type="button" class="btn-icon" (click)="cerrarModal()">&times;</button>
        </div>
        <div class="modal-body">
          <input
            type="text"
            [(ngModel)]="busquedaTermino"
            (input)="filtrarClientes()"
            placeholder="Buscar por nombre, DNI o tel&eacute;fono..."
            class="search-input"
            autofocus
          />
          <div *ngIf="busquedaTermino.trim() && clientesFiltrados.length === 0" class="text-muted search-empty">
            Sin resultados para "<strong>{{ busquedaTermino }}</strong>"
          </div>
          <div *ngFor="let c of clientesFiltrados" class="result-row">
            <div class="result-info">
              <strong>{{ c.nombres }} {{ c.apellidos }}</strong>
              <span class="result-detail">DNI: {{ c.numeroDocumento }} | Tel: {{ c.telefono }}</span>
            </div>
            <div class="result-actions">
              <button type="button" class="btn-titular" (click)="elegirTitular(habitacionModal!, c)">Elegir como Titular 👑</button>
              <button type="button" class="btn-acompanante" (click)="agregarAcompanante(habitacionModal!, c)">Agregar como Acompa&ntilde;ante 👤</button>
            </div>
          </div>
          <div class="modal-footer-link">
            <a routerLink="/clientes/nuevo" class="crear-cliente-link">+ Crear nuevo cliente</a>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page { max-width: 900px; margin: 0 auto; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
    .page-header h2 { margin: 0; font-size: 1.3rem; color: #333; }
    .card { background: white; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
    .card-body { padding: 24px; }
    h3 { margin: 24px 0 16px; font-size: 1rem; color: #333; border-bottom: 1px solid #eee; padding-bottom: 8px; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .form-group { margin-bottom: 16px; }
    label { display: block; margin-bottom: 4px; font-size: 0.8rem; color: #555; font-weight: 500; }
    .required { color: #c62828; }
    input, select { width: 100%; padding: 10px 12px; border: 1px solid #ddd; border-radius: 6px; font-size: 0.85rem; box-sizing: border-box; transition: border-color 0.2s; }
    input:focus, select:focus { outline: none; border-color: #1a237e; box-shadow: 0 0 0 3px rgba(26,35,126,0.1); }
    .checkbox-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 8px; }
    .checkbox-label { display: flex; align-items: center; gap: 8px; font-size: 0.85rem; cursor: pointer; padding: 8px 12px; border: 1px solid #eee; border-radius: 6px; transition: all 0.2s; }
    .checkbox-label:hover { border-color: #1a237e; background: #f5f5ff; }
    .checkbox-label:has(input:checked) { border-color: #1a237e; background: #e8eaf6; }
    .cap-badge { font-size: 0.7rem; color: #666; background: #f5f5f5; padding: 1px 6px; border-radius: 4px; margin-left: auto; }
    .room-card { background: #fafafa; border: 1px solid #e0e0e0; border-radius: 8px; padding: 16px; margin-bottom: 16px; }
    .room-summary { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 12px; }
    .badge { padding: 3px 10px; border-radius: 12px; font-size: 0.7rem; font-weight: 500; }
    .badge-adultos { background: #e3f2fd; color: #1565c0; }
    .badge-adultos-mayores { background: #f3e5f5; color: #7b1fa2; }
    .badge-adolescentes { background: #e8f5e9; color: #2e7d32; }
    .badge-ninos { background: #fff3e0; color: #e65100; }
    .room-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
    .room-title { font-weight: 700; font-size: 0.85rem; color: #1a237e; }
    .room-section { margin-bottom: 8px; }
    .section-label { font-size: 0.75rem; font-weight: 600; color: #555; text-transform: uppercase; margin-bottom: 6px; letter-spacing: 0.5px; }
    .plazas-libres { font-weight: 400; color: #666; text-transform: none; letter-spacing: 0; }
    .plazas-llenas { color: #c62828; }
    .guest-card { display: flex; justify-content: space-between; align-items: center; background: white; border: 1px solid #e8e8e8; border-radius: 6px; padding: 8px 12px; margin-bottom: 6px; }
    .titular-card { border-color: #c8a84e; background: #fffdf5; }
    .guest-info { display: flex; flex-direction: column; gap: 2px; }
    .guest-info strong { font-size: 0.85rem; color: #333; }
    .guest-detail { font-size: 0.75rem; color: #888; }
    .room-divider { text-align: center; color: #ccc; font-size: 0.8rem; margin: 6px 0; }
    .text-muted { color: #999; font-size: 0.8rem; font-style: italic; margin-bottom: 8px; }
    .btn-primary { padding: 10px 24px; background: #1a237e; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 0.85rem; font-weight: 500; }
    .btn-primary:hover { background: #283593; }
    .btn-primary:disabled { background: #9fa8da; cursor: not-allowed; }
    .btn-secondary { padding: 10px 24px; background: #f5f5f5; color: #555; border: 1px solid #ddd; border-radius: 6px; cursor: pointer; font-size: 0.85rem; text-decoration: none; display: inline-block; }
    .btn-secondary:hover { background: #eee; }
    .btn-sm { padding: 5px 12px; background: #e8eaf6; color: #1a237e; border: none; border-radius: 4px; cursor: pointer; font-size: 0.72rem; font-weight: 500; white-space: nowrap; }
    .btn-sm:hover { background: #c5cae9; }
    .btn-add { display: inline-flex; align-items: center; gap: 4px; padding: 6px 14px; background: transparent; color: #1a237e; border: 1px dashed #1a237e; border-radius: 6px; cursor: pointer; font-size: 0.8rem; font-weight: 500; margin-top: 4px; transition: all 0.2s; }
    .btn-add:hover { background: #e8eaf6; }
    .btn-disabled { opacity: 0.4; cursor: not-allowed; }
    .btn-disabled:hover { background: transparent; }
    .btn-icon { background: none; border: none; cursor: pointer; font-size: 1.2rem; color: #999; padding: 2px 6px; border-radius: 4px; line-height: 1; }
    .btn-icon:hover { background: #f5f5f5; color: #333; }
    .btn-danger-icon { color: #c62828; }
    .btn-danger-icon:hover { background: #ffebee; }
    .btn-icon-sm { font-size: 1rem; padding: 0 4px; }
    .canales-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: 10px; }
    .canal-card { display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 16px 12px; border: 2px solid #e0e0e0; border-radius: 12px; background: white; cursor: pointer; transition: all 0.2s; font-family: inherit; position: relative; }
    .canal-card:hover { border-color: #90caf9; background: #f5f8ff; transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
    .canal-card.selected { border-color: #1a237e; background: #e8eaf6; box-shadow: 0 2px 8px rgba(26,35,126,0.15); }
    .canal-icono { font-size: 1.8rem; line-height: 1; }
    .canal-nombre { font-size: 0.8rem; font-weight: 600; color: #333; }
    .check-mark { position: absolute; top: 6px; right: 8px; font-size: 0.7rem; color: #1a237e; font-weight: 700; background: #c5cae9; border-radius: 50%; width: 18px; height: 18px; display: flex; align-items: center; justify-content: center; }
    .ocupacion-bar-container { display: flex; align-items: center; gap: 8px; margin-top: 10px; padding-top: 10px; border-top: 1px solid #eee; }
    .ocupacion-label { font-size: 0.75rem; color: #666; white-space: nowrap; }
    .ocupacion-bar { flex: 1; height: 8px; background: #e0e0e0; border-radius: 4px; overflow: hidden; }
    .ocupacion-fill { height: 100%; border-radius: 4px; transition: width 0.3s ease, background 0.3s ease; min-width: 0; }
    .ocupacion-text { font-size: 0.75rem; color: #666; font-weight: 500; white-space: nowrap; }
    .badge-completa { font-size: 0.65rem; font-weight: 600; color: white; background: #c62828; padding: 2px 8px; border-radius: 8px; text-transform: uppercase; }
    .section-subtitle { font-size: 0.8rem; font-weight: 600; color: #555; margin-bottom: 8px; display: block; }
    .no-disponible-label { color: #999; }
    .checkbox-label.no-disponible { background: #f9f9f9; border-color: #e8e8e8; cursor: default; opacity: 0.65; }
    .checkbox-label.no-disponible:hover { border-color: #e8e8e8; background: #f9f9f9; }
    .motivo-badge { font-size: 0.65rem; font-weight: 600; color: #888; background: #f0f0f0; padding: 2px 8px; border-radius: 8px; white-space: nowrap; margin-left: auto; }
    .form-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 24px; padding-top: 16px; border-top: 1px solid #eee; }
    .alert { padding: 10px 14px; border-radius: 6px; font-size: 0.8rem; margin: 12px 0; }
    .alert-error { background: #ffebee; color: #c62828; border: 1px solid #ffcdd2; }
    .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: flex-start; justify-content: center; padding-top: 60px; z-index: 1000; }
    .modal-content { background: white; border-radius: 12px; width: 520px; max-width: 92vw; max-height: 75vh; display: flex; flex-direction: column; box-shadow: 0 20px 60px rgba(0,0,0,0.3); }
    .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border-bottom: 1px solid #eee; }
    .modal-header h3 { margin: 0; border: none; padding: 0; font-size: 1rem; }
    .modal-body { padding: 16px 20px; overflow-y: auto; flex: 1; }
    .search-input { width: 100%; padding: 10px 14px; border: 1px solid #ddd; border-radius: 8px; font-size: 0.9rem; box-sizing: border-box; margin-bottom: 12px; }
    .search-input:focus { outline: none; border-color: #1a237e; box-shadow: 0 0 0 3px rgba(26,35,126,0.1); }
    .search-empty { text-align: center; padding: 20px 0; }
    .result-row { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid #f0f0f0; gap: 12px; }
    .result-row:last-child { border-bottom: none; }
    .result-info { display: flex; flex-direction: column; gap: 2px; flex: 1; min-width: 0; }
    .result-info strong { font-size: 0.85rem; color: #333; }
    .result-detail { font-size: 0.75rem; color: #888; }
    .result-actions { display: flex; gap: 6px; flex-shrink: 0; }
    .btn-titular { padding: 5px 10px; background: #fff8e1; color: #f57f17; border: 1px solid #ffe082; border-radius: 4px; cursor: pointer; font-size: 0.7rem; font-weight: 500; white-space: nowrap; }
    .btn-titular:hover { background: #ffecb3; }
    .btn-acompanante { padding: 5px 10px; background: #e3f2fd; color: #1565c0; border: 1px solid #90caf9; border-radius: 4px; cursor: pointer; font-size: 0.7rem; font-weight: 500; white-space: nowrap; }
    .btn-acompanante:hover { background: #bbdefb; }
    .modal-footer-link { padding: 12px 0 4px; border-top: 1px solid #f0f0f0; margin-top: 8px; }
    .crear-cliente-link { color: #1a237e; font-size: 0.85rem; font-weight: 500; text-decoration: none; }
    .crear-cliente-link:hover { text-decoration: underline; }
  `]
})
export class GrupoFormComponent implements OnInit {
  clientes: ClienteResponse[] = [];
  habitacionesDisponibles: HabitacionResponse[] = [];
  allHabitaciones: HabitacionResponse[] = [];
  habitacionesNoDisponibles: (HabitacionResponse & { motivo: string })[] = [];
  habitacionesSeleccionadas: HabitacionEnFormulario[] = [];
  canalesVenta: CanalVenta[] = [];
  error = '';

  modalAbierto = false;
  busquedaTermino = '';
  clientesFiltrados: ClienteResponse[] = [];
  habitacionModal: HabitacionEnFormulario | null = null;
  accionModal: 'titular' | 'acompanante' | null = null;

  form: any = {
    nombreGrupo: '',
    responsablePagoId: '',
    fechaIngreso: '',
    fechaSalida: '',
    canalVentaId: null,
    canalVentaOtro: ''
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

  onFechasChange(): void {
    if (this.form.fechaIngreso && this.form.fechaSalida) {
      this.habitacionService.getDisponibles(this.form.fechaIngreso, this.form.fechaSalida)
        .subscribe({ next: (data) => {
          this.habitacionesDisponibles = data;
          this.clasificarNoDisponibles();
          const disponiblesIds = new Set(data.map(h => h.id));
          const removed = this.habitacionesSeleccionadas.filter(h => !disponiblesIds.has(h.habitacionId));
          if (removed.length > 0) {
            this.habitacionesSeleccionadas = this.habitacionesSeleccionadas.filter(h => disponiblesIds.has(h.habitacionId));
            this.error = `Las siguientes habitaciones ya no están disponibles para las fechas seleccionadas y fueron removidas: ${removed.map(h => h.numero).join(', ')}`;
          }
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

  toggleHabitacion(h: HabitacionResponse, checked: boolean): void {
    if (checked) {
      this.habitacionesSeleccionadas.push({
        habitacionId: h.id,
        numero: h.numero,
        tipoNombre: h.tipoNombre,
        capacidadMax: h.capacidadMax,
        titular: null,
        acompanantes: []
      });
    } else {
      this.habitacionesSeleccionadas = this.habitacionesSeleccionadas.filter(x => x.habitacionId !== h.id);
    }
  }

  abrirModal(h: HabitacionEnFormulario, accion: 'titular' | 'acompanante'): void {
    this.habitacionModal = h;
    this.accionModal = accion;
    this.busquedaTermino = '';
    this.clientesFiltrados = [];
    this.modalAbierto = true;
  }

  cerrarModal(event?: MouseEvent): void {
    this.modalAbierto = false;
    this.busquedaTermino = '';
    this.clientesFiltrados = [];
    this.habitacionModal = null;
    this.accionModal = null;
  }

  filtrarClientes(): void {
    const term = this.busquedaTermino.toLowerCase().trim();
    if (!term) {
      this.clientesFiltrados = [];
      return;
    }
    this.clientesFiltrados = this.clientes.filter(c =>
      c.nombres.toLowerCase().includes(term) ||
      c.apellidos.toLowerCase().includes(term) ||
      c.numeroDocumento.toLowerCase().includes(term) ||
      c.telefono.toLowerCase().includes(term)
    );
  }

  elegirTitular(h: HabitacionEnFormulario, c: ClienteResponse): void {
    if (h.titular) {
      if (!confirm(`¿Reemplazar a ${h.titular.nombres} ${h.titular.apellidos} como titular?`)) return;
    }
    h.titular = c;
    h.acompanantes = h.acompanantes.filter(a => a.id !== c.id);
    this.cerrarModal();
  }

  agregarAcompanante(h: HabitacionEnFormulario, c: ClienteResponse): void {
    if (c.id === h.titular?.id) {
      alert(`${c.nombres} ${c.apellidos} ya es el titular de esta habitación`);
      return;
    }
    if (h.acompanantes.some(a => a.id === c.id)) {
      alert(`${c.nombres} ${c.apellidos} ya está agregado como acompañante`);
      return;
    }
    if (h.acompanantes.length >= h.capacidadMax - 1) {
      alert(`No se puede agregar más acompañantes. La habitación ${h.numero} (${h.tipoNombre}) ya está completa (${this.getCapacidadAsignada(h)}/${h.capacidadMax} ocupantes).`);
      return;
    }
    if (!h.titular) {
      if (!confirm(`La habitación ${h.numero} no tiene titular asignado. ¿Desea agregar a ${c.nombres} ${c.apellidos} como acompañante igualmente?`)) return;
    }
    h.acompanantes.push(c);
    this.cerrarModal();
  }

  cambiarTitularConConfirm(h: HabitacionEnFormulario): void {
    if (!h.titular) return;
    if (!confirm(`¿Reemplazar a ${h.titular.nombres} ${h.titular.apellidos} como titular?`)) return;
    this.abrirModal(h, 'titular');
  }

  quitarAcompanante(h: HabitacionEnFormulario, idx: number): void {
    const a = h.acompanantes[idx];
    if (!confirm(`¿Quitar a ${a.nombres} ${a.apellidos} como acompañante?`)) return;
    h.acompanantes.splice(idx, 1);
  }

  quitarHabitacion(idx: number): void {
    if (!confirm(`¿Eliminar esta habitación de la reserva?`)) return;
    this.habitacionesSeleccionadas.splice(idx, 1);
  }

  countCategoria(h: HabitacionEnFormulario, categoria: string): number {
    const allGuests = [...(h.titular ? [h.titular] : []), ...h.acompanantes];
    return allGuests.filter(g => clasificarEdad(g.fechaNacimiento) === categoria).length;
  }

  getCapacidadAsignada(h: HabitacionEnFormulario): number {
    return (h.titular ? 1 : 0) + h.acompanantes.length;
  }

  getPlazasLibres(h: HabitacionEnFormulario): number {
    return Math.max(0, h.capacidadMax - this.getCapacidadAsignada(h));
  }

  getOcupacionPorcentaje(h: HabitacionEnFormulario): number {
    if (!h.capacidadMax) return 0;
    return Math.round((this.getCapacidadAsignada(h) / h.capacidadMax) * 100);
  }

  getOcupacionColor(h: HabitacionEnFormulario): string {
    const pct = this.getOcupacionPorcentaje(h);
    if (pct >= 100) return '#c62828';
    if (pct >= 75) return '#e65100';
    return '#1a237e';
  }

  puedeEnviar(): boolean {
    if (!this.form.nombreGrupo || !this.form.responsablePagoId || !this.form.fechaIngreso || !this.form.fechaSalida || !this.form.canalVentaId || this.habitacionesSeleccionadas.length === 0) return false;
    if (this.canalSeleccionadoEsOtro() && !this.form.canalVentaOtro?.trim()) return false;
    return true;
  }

  onCreate(): void {
    this.error = '';
    const user = this.auth.getUsuario();
    if (!user?.id) { this.error = 'Usuario no autenticado'; return; }

    for (const h of this.habitacionesSeleccionadas) {
      if (!h.titular && h.acompanantes.length === 0) {
        this.error = `La habitación ${h.numero} (${h.tipoNombre}) no tiene huéspedes asignados. Cada habitación debe tener al menos un titular.`;
        return;
      }
      if (!h.titular && h.acompanantes.length > 0) {
        this.error = `La habitación ${h.numero} (${h.tipoNombre}) tiene acompañantes pero no tiene un titular asignado`;
        return;
      }
    }

    const reservas: ReservaEnGrupoRequest[] = this.habitacionesSeleccionadas.map(h => {
      const allGuests = [...(h.titular ? [h.titular] : []), ...h.acompanantes];
      const adultos = allGuests.filter(g =>
        clasificarEdad(g.fechaNacimiento) === 'adulto' ||
        clasificarEdad(g.fechaNacimiento) === 'adolescente' ||
        clasificarEdad(g.fechaNacimiento) === 'adulto_mayor'
      ).length;
      const ninos = allGuests.filter(g => clasificarEdad(g.fechaNacimiento) === 'nino').length;
      return {
        habitacionId: h.habitacionId,
        adultos,
        ...(ninos > 0 ? { ninos } : {}),
        huespedes: [
          ...(h.titular ? [{ clienteId: h.titular.id, esTitular: true }] : []),
          ...h.acompanantes.map(a => ({ clienteId: a.id, esTitular: false }))
        ]
      };
    });

    const request: GrupoRequest = {
      nombreGrupo: this.form.nombreGrupo,
      responsablePagoId: this.form.responsablePagoId,
      fechaIngreso: this.form.fechaIngreso,
      fechaSalida: this.form.fechaSalida,
      canalVentaId: this.form.canalVentaId,
      canalVentaOtro: this.form.canalVentaOtro || undefined,
      reservas,
      creadoPor: user.id
    };

    this.service.crearGrupo(request).subscribe({
      next: () => this.router.navigate(['/reservas']),
      error: (err) => this.error = err.error?.message || 'Error al crear el grupo'
    });
  }
}
