import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RestriccionFechaService } from '../../core/services/restriccion-fecha.service';
import { RestriccionFecha } from '../../core/models/restriccion-fecha';

const TIPO_LABELS: Record<string, string> = {
  FECHA_CERRADA: 'Hotel Cerrado',
  CHECK_IN_CERRADO: 'Ingreso Bloqueado',
  CHECK_OUT_CERRADO: 'Salida Bloqueada'
};

@Component({
  selector: 'app-restricciones-fecha-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-container fade-in">
      <!-- CABECERA BANNER -->
      <div class="header-section">
        <div class="title-area">
          <h2><i class="header-icon-premium bi bi-calendar-x-fill"></i> Restricciones de Fecha</h2>
          <p class="subtitle">Administre bloqueos de calendario, cierres operacionales del hotel o suspensión de Ingresos/Salidas</p>
        </div>
        <button class="btn-primary" (click)="abrirModal()"><i class="bi bi-plus-lg mr-1"></i> Nueva Restricción</button>
      </div>

      <!-- ESTADO VACÍO -->
      <div class="empty-state glass-panel" *ngIf="!cargando && items.length === 0">
        <i class="bi bi-info-circle-fill text-verde-selva mr-2"></i> No hay restricciones de fechas activas registradas en el PMS.
      </div>

      <!-- CONTENEDOR DE TARIFAS Y RESTRICCIONES -->
      <div class="cards-grid">
        <div *ngFor="let r of items" class="card glass-panel" [class.inactivo]="!r.activo">
          <div class="card-header">
            <div class="card-tags">
              <span class="tipo-badge" [class.tipo-cerrada]="r.tipo === 'FECHA_CERRADA'"
                                       [class.tipo-checkin]="r.tipo === 'CHECK_IN_CERRADO'"
                                       [class.tipo-checkout]="r.tipo === 'CHECK_OUT_CERRADO'">
                <i class="bi mr-1" 
                   [class.bi-building-fill]="r.tipo === 'FECHA_CERRADA'"
                   [class.bi-key-fill]="r.tipo === 'CHECK_IN_CERRADO'"
                   [class.bi-door-open-fill]="r.tipo === 'CHECK_OUT_CERRADO'"></i>
                {{ TIPO_LABELS[r.tipo] || r.tipo }}
              </span>
              <span class="estado-badge" [class.activo]="r.activo" [class.inactivo]="!r.activo">
                {{ r.activo ? 'Activo' : 'Inactivo' }}
              </span>
            </div>
            <div class="card-actions">
              <button class="btn-icon btn-edit" (click)="editar(r)" title="Editar"><i class="bi bi-pencil-fill"></i></button>
              <button class="btn-icon btn-delete" (click)="eliminar(r)" title="Eliminar"><i class="bi bi-trash-fill"></i></button>
            </div>
          </div>
          <div class="card-body">
            <div class="fechas">
              <span class="fecha-label">Período:</span>
              <span class="fecha-valor">{{ r.fechaInicio | date:'dd/MM/yyyy' }}</span>
              <span *ngIf="r.fechaFin" class="fecha-sep">→</span>
              <span *ngIf="r.fechaFin" class="fecha-valor">{{ r.fechaFin | date:'dd/MM/yyyy' }}</span>
            </div>
            <div class="motivo" *ngIf="r.motivo">
              <strong>Motivo registrado:</strong> {{ r.motivo }}
            </div>
          </div>
        </div>
      </div>

      <!-- MODAL DE EDICIÓN BOUTIQUE -->
      <div *ngIf="modalAbierto" class="modal-overlay" (click)="cerrarModal()">
        <div class="modal animate-in" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3><i class="bi mr-2" [class.bi-pencil-square]="editando" [class.bi-plus-lg]="!editando"></i> {{ editando ? 'Editar' : 'Nueva' }} Restricción de Fecha</h3>
            <button class="btn-cerrar" (click)="cerrarModal()">✕</button>
          </div>
          <form (ngSubmit)="guardar()" class="modal-body">
            
            <div class="form-group">
              <label>Tipo de Bloqueo / Restricción <span class="required">*</span></label>
              <select [(ngModel)]="form.tipo" name="tipo" class="form-control" required>
                <option value="">Seleccione tipo...</option>
                <option value="FECHA_CERRADA">Hotel cerrado (Bloqueo Total)</option>
                <option value="CHECK_IN_CERRADO">Registro de Ingreso bloqueado (No ingresos)</option>
                <option value="CHECK_OUT_CERRADO">Registro de Salida bloqueado (No salidas)</option>
              </select>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Fecha Inicio <span class="required">*</span></label>
                <input type="date" [(ngModel)]="form.fechaInicio" name="fechaInicio" class="form-control" required>
              </div>
              <div class="form-group">
                <label>Fecha Fin (Opcional)</label>
                <input type="date" [(ngModel)]="form.fechaFin" name="fechaFin" class="form-control">
              </div>
            </div>

            <div class="form-group">
              <label>Motivo Explicativo</label>
              <input type="text" [(ngModel)]="form.motivo" name="motivo" class="form-control" placeholder="Ej: Feriados nacionales, mantenimiento anual, etc.">
            </div>

            <div class="form-group checkbox-align" *ngIf="editando">
              <label class="checkbox-inline">
                <input type="checkbox" [(ngModel)]="form.activo" name="activo" class="custom-checkbox-input">
                <span class="custom-checkbox-box"></span>
                <span class="label-text-checkbox">Mantener esta restricción activa</span>
              </label>
            </div>

            <div *ngIf="error" class="alert alert-error"><i class="bi bi-exclamation-triangle-fill mr-1"></i> {{ error }}</div>
            
            <div class="form-actions">
              <button type="button" class="btn-secondary" (click)="cerrarModal()">Cancelar</button>
              <button type="submit" class="btn-primary" [disabled]="!puedeGuardar()">
                <i class="bi mr-1" [class.bi-floppy-fill]="editando" [class.bi-plus-lg]="!editando"></i> {{ editando ? 'Actualizar Bloqueo' : 'Crear Restricción' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-container {
      padding: 24px;
      font-family: 'Outfit', 'Inter', -apple-system, sans-serif;
      background: #f8fafc;
      min-height: 85vh;
      max-width: 900px;
      margin: 0 auto;
    }

    /* HEADER BANNER */
    .header-section {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 24px 32px;
      background: linear-gradient(135deg, #1A211B 0%, #2D5A27 100%);
      border: 1px solid rgba(212, 168, 67, 0.2);
      border-radius: 20px;
      box-shadow: 0 10px 30px rgba(45, 90, 39, 0.15);
      margin-bottom: 24px;
      position: relative;
      overflow: hidden;
      flex-wrap: wrap;
      gap: 16px;
    }

    .header-section::before {
      content: '';
      position: absolute;
      right: -30px;
      top: -30px;
      width: 150px;
      height: 150px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(212, 168, 67, 0.15) 0%, rgba(212, 168, 67, 0) 70%);
      pointer-events: none;
    }

    .header-section h2 {
      margin: 0;
      font-size: 1.6rem;
      font-weight: 800;
      color: #ffffff;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    }

    .header-section .subtitle {
      margin: 6px 0 0;
      font-size: 0.9rem;
      color: rgba(255, 255, 255, 0.85);
      font-weight: 500;
    }

    /* GLASS COMMON */
    .glass-panel {
      background: rgba(255, 255, 255, 0.9);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border: 1px solid rgba(45, 90, 39, 0.08);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.03);
    }

    /* CARDS GRID */
    .cards-grid {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .card {
      border-radius: 16px;
      border: 1px solid rgba(45, 90, 39, 0.08);
      transition: all 0.25s ease;
      overflow: hidden;
    }

    .card.inactivo {
      opacity: 0.55;
      background: rgba(248, 250, 252, 0.8);
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 20px 0;
    }

    .card-tags {
      display: flex;
      gap: 8px;
      align-items: center;
    }

    .card-actions {
      display: flex;
      gap: 6px;
    }

    .card-body {
      padding: 14px 20px 18px;
    }

    /* TYPE BADGES */
    .tipo-badge {
      font-size: 0.74rem;
      font-weight: 800;
      padding: 5px 12px;
      border-radius: 20px;
      text-transform: uppercase;
      letter-spacing: 0.02em;
    }

    .tipo-badge.tipo-cerrada {
      background: rgba(220, 38, 38, 0.08);
      color: #dc2626;
      border: 1px solid rgba(220, 38, 38, 0.15);
    }

    .tipo-badge.tipo-checkin {
      background: rgba(212, 168, 67, 0.08);
      color: #8B5A2B;
      border: 1px solid rgba(212, 168, 67, 0.18);
    }

    .tipo-badge.tipo-checkout {
      background: rgba(78, 141, 70, 0.08);
      color: #4E8D46;
      border: 1px solid rgba(78, 141, 70, 0.15);
    }

    /* ESTADO BADGE */
    .estado-badge {
      font-size: 0.72rem;
      padding: 2px 10px;
      border-radius: 8px;
      font-weight: 700;
      text-transform: uppercase;
    }

    .estado-badge.activo {
      background: rgba(78, 141, 70, 0.08);
      color: #4E8D46;
      border: 1px solid rgba(78, 141, 70, 0.15);
    }

    .estado-badge.inactivo {
      background: #f1f5f9;
      color: #64748b;
      border: 1px solid #e2e8f0;
    }

    /* FECHAS DISPLAY */
    .fechas {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 0.94rem;
      font-weight: 700;
      color: #1A211B;
      font-family: 'Outfit', sans-serif;
    }

    .fecha-label {
      color: #64748b;
      font-size: 0.76rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .fecha-valor {
      color: #2D5A27;
    }

    .fecha-sep {
      color: #94a3b8;
      font-size: 1.1rem;
    }

    .motivo {
      margin-top: 10px;
      font-size: 0.84rem;
      color: #8B5A2B; /* Marrón Madera */
      background: rgba(139, 90, 43, 0.04);
      padding: 10px 14px;
      border-radius: 8px;
      border-left: 3px solid #8B5A2B;
      line-height: 1.4;
    }

    .empty-state {
      text-align: center;
      color: #64748b;
      padding: 60px 20px;
      border-radius: 16px;
      font-size: 0.95rem;
      font-weight: 600;
    }

    /* BUTTONS */
    .btn-primary {
      padding: 10px 24px;
      background: linear-gradient(135deg, #2D5A27 0%, #1A211B 100%);
      color: white;
      border: 1px solid rgba(212, 168, 67, 0.15);
      border-radius: 10px;
      font-weight: 700;
      font-size: 0.85rem;
      cursor: pointer;
      transition: all 0.25s ease;
      box-shadow: 0 4px 10px rgba(45, 90, 39, 0.15);
    }

    .btn-primary:hover:not(:disabled) {
      background: linear-gradient(135deg, #4E8D46 0%, #2D5A27 100%);
      transform: translateY(-1px);
    }

    .btn-primary:disabled {
      background: #cbd5e1;
      color: #94a3b8;
      border-color: #cbd5e1;
      cursor: not-allowed;
      box-shadow: none;
    }

    .btn-secondary {
      padding: 10px 20px;
      background: white;
      color: #8B5A2B;
      border: 1px solid rgba(139, 90, 43, 0.35);
      border-radius: 8px;
      font-weight: 700;
      font-size: 0.82rem;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .btn-secondary:hover {
      background: rgba(139, 90, 43, 0.06);
    }

    .btn-icon {
      background: none;
      border: none;
      cursor: pointer;
      font-size: 0.9rem;
      padding: 6px 10px;
      border-radius: 6px;
      transition: all 0.2s;
      border: 1px solid transparent;
    }

    .btn-edit {
      color: #2D5A27;
      background: rgba(45, 90, 39, 0.05);
      border-color: rgba(45, 90, 39, 0.1);
    }
    .btn-edit:hover {
      background: #2D5A27;
      color: white;
    }

    .btn-delete {
      color: #dc2626;
      background: rgba(220, 38, 38, 0.05);
      border-color: rgba(220, 38, 38, 0.1);
    }
    .btn-delete:hover {
      background: #dc2626;
      color: white;
    }

    /* MODAL DE EDICIÓN BOUTIQUE */
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(26, 33, 27, 0.4);
      backdrop-filter: blur(8px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .modal {
      background: white;
      border-radius: 20px;
      width: 480px;
      max-width: 90vw;
      box-shadow: 0 15px 50px rgba(0, 0, 0, 0.2);
      border: 1px solid rgba(212, 168, 67, 0.25);
      overflow: hidden;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 24px;
      background: linear-gradient(135deg, #1A211B 0%, #2D5A27 100%);
      border-bottom: 1px solid rgba(212, 168, 67, 0.2);
      color: white;
    }

    .modal-header h3 {
      margin: 0;
      font-size: 0.95rem;
      font-weight: 800;
      letter-spacing: 0.05em;
    }

    .btn-cerrar {
      background: none;
      border: none;
      font-size: 1.4rem;
      cursor: pointer;
      color: rgba(255, 255, 255, 0.8);
      padding: 0;
      line-height: 1;
      transition: color 0.2s;
    }

    .btn-cerrar:hover {
      color: white;
    }

    .modal-body {
      padding: 24px;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
      margin-bottom: 16px;
    }

    .form-group label {
      font-size: 0.82rem;
      font-weight: 700;
      color: #2D5A27;
      text-transform: uppercase;
      letter-spacing: 0.02em;
    }

    .required {
      color: #dc2626;
      font-weight: bold;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px;
    }

    .form-control {
      width: 100%;
      padding: 10px 14px;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      font-size: 0.88rem;
      font-family: inherit;
      outline: none;
      transition: all 0.25s ease;
      background: rgba(248, 250, 252, 0.7);
      box-sizing: border-box;
    }

    .form-control:focus {
      border-color: #2D5A27;
      box-shadow: 0 0 0 3px rgba(45, 90, 39, 0.12);
      background: white;
    }

    .checkbox-align {
      margin-top: 10px;
    }

    /* CUSTOM CHECKBOX */
    .checkbox-inline {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 0.86rem;
      cursor: pointer;
      user-select: none;
      font-weight: 700;
      color: #1A211B;
    }

    .custom-checkbox-input {
      position: absolute;
      opacity: 0;
      cursor: pointer;
      height: 0;
      width: 0;
    }

    .custom-checkbox-box {
      width: 18px;
      height: 18px;
      background: white;
      border: 2px solid #cbd5e1;
      border-radius: 6px;
      display: inline-block;
      flex-shrink: 0;
      position: relative;
      transition: all 0.2s ease;
    }

    .checkbox-inline:hover input ~ .custom-checkbox-box {
      border-color: #2D5A27;
    }

    .checkbox-inline input:checked ~ .custom-checkbox-box {
      background: #2D5A27;
      border-color: #2D5A27;
    }

    .custom-checkbox-box::after {
      content: "";
      position: absolute;
      display: none;
      left: 5px;
      top: 1px;
      width: 4px;
      height: 8px;
      border: solid white;
      border-width: 0 2px 2px 0;
      transform: rotate(45deg);
    }

    .checkbox-inline input:checked ~ .custom-checkbox-box::after {
      display: block;
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-top: 20px;
      padding-top: 16px;
      border-top: 1px solid #f1f5f9;
    }

    .alert {
      padding: 10px 14px;
      border-radius: 8px;
      font-size: 0.8rem;
      margin-bottom: 12px;
      font-weight: 600;
    }

    .alert-error {
      background: rgba(220, 38, 38, 0.06);
      color: #dc2626;
      border: 1px solid rgba(220, 38, 38, 0.15);
    }

    /* ANIMATIONS */
    .fade-in {
      animation: fadeIn 0.4s ease-out forwards;
    }

    .animate-in {
      animation: slideDown 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(8px); }
      to { opacity: 1; transform: translateY(0); }
    }

    @keyframes slideDown {
      from { opacity: 0; transform: translateY(-10px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class RestriccionesFechaListComponent implements OnInit {
  readonly TIPO_LABELS = TIPO_LABELS;
  items: RestriccionFecha[] = [];
  cargando = true;
  modalAbierto = false;
  editando = false;
  error = '';

  form: any = { tipo: '', fechaInicio: '', fechaFin: null, motivo: '', activo: true };

  constructor(private service: RestriccionFechaService) { }

  ngOnInit(): void {
    this.cargar();
  }

  private cargar(): void {
    this.cargando = true;
    this.service.getAll().subscribe({
      next: (data) => { this.items = data; this.cargando = false; },
      error: () => this.cargando = false
    });
  }

  abrirModal(): void {
    this.editando = false;
    this.form = { tipo: '', fechaInicio: '', fechaFin: null, motivo: '', activo: true };
    this.error = '';
    this.modalAbierto = true;
  }

  editar(r: RestriccionFecha): void {
    this.editando = true;
    this.form = { ...r };
    this.error = '';
    this.modalAbierto = true;
  }

  cerrarModal(): void {
    this.modalAbierto = false;
    this.error = '';
  }

  puedeGuardar(): boolean {
    return !!this.form.tipo && !!this.form.fechaInicio;
  }

  guardar(): void {
    if (!this.puedeGuardar()) return;
    this.error = '';

    const obs = this.editando
      ? this.service.update(this.form.id!, this.form)
      : this.service.create(this.form);

    obs.subscribe({
      next: () => { this.cerrarModal(); this.cargar(); },
      error: (err) => this.error = err.error?.message || 'Error al guardar'
    });
  }

  eliminar(r: RestriccionFecha): void {
    if (!confirm(`¿Eliminar restricción "${TIPO_LABELS[r.tipo] || r.tipo}" del ${r.fechaInicio}?`)) return;
    this.service.delete(r.id!).subscribe({ next: () => this.cargar() });
  }
}
