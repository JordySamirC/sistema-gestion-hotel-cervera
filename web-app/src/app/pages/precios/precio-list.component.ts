import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PrecioHistoricoService } from '../../core/services/precio-historico.service';
import { HabitacionService } from '../../core/services/habitacion.service';
import { AuthService } from '../../core/services/auth.service';
import { TipoHabitacionResponse, PrecioHistoricoResponse, PrecioHistoricoRequest } from '../../core/models/habitacion';

interface TipoConPrecio {
  tipo: TipoHabitacionResponse;
  precioActual: number | null;
  precioId: string | null;
}

@Component({
  selector: 'app-precio-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-container fade-in">
      <!-- CABECERA BANNER -->
      <div class="header-section">
        <div class="title-area">
          <h2><i class="header-icon-premium bi bi-tags-fill"></i> Tarifas y Precios de Habitaciones</h2>
          <p class="subtitle">Establezca los precios por noche para cada tipo de habitación en tiempo real</p>
        </div>
      </div>

      <!-- NOTA DE INFORMACIÓN GLASS -->
      <div class="info-card glass-panel">
        <span class="info-icon">💡</span>
        <span class="info-text">Los cambios de tarifas se aplican instantáneamente para las nuevas reservas. Las reservas existentes mantendrán el precio pactado al momento de su creación original.</span>
      </div>

      <!-- CUADRÍCULA DE TARIFAS -->
      <div class="precios-grid">
        <div class="tipo-card glass-panel" *ngFor="let item of tiposConPrecio">
          <div class="tipo-header">
            <span class="tipo-nombre">{{ item.tipo.nombre }}</span>
            <span class="tipo-capacidad">{{ item.tipo.configuracionCamas || item.tipo.capacidadMax + ' cama' + (item.tipo.capacidadMax > 1 ? 's' : '') }}</span>
          </div>

          <div class="tipo-precio">
            <span class="precio-actual-label">Precio Vigente por Noche</span>
            <span class="precio-actual-valor" [class.sin-precio]="!item.precioActual">
              {{ item.precioActual ? ('S/ ' + (item.precioActual | number:'1.2-2')) : 'Sin tarifa fija' }}
            </span>
          </div>

          <div class="tipo-actions">
            <button class="btn-editar" (click)="abrirModal(item)">
              <i class="bi bi-tag-fill mr-1"></i> Modificar Tarifa
            </button>
          </div>
        </div>
      </div>

      <div class="empty-state" *ngIf="tiposConPrecio.length === 0">
        <i class="bi bi-info-circle-fill text-verde-selva mr-2"></i> Consultando tipos de habitación e inventario actual...
      </div>
    </div>

    <!-- MODAL DE CAMBIO DE PRECIO BOUTIQUE -->
    <div class="modal-overlay" *ngIf="modalAbierto" (click)="cerrarModal()">
      <div class="modal animate-in" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3><i class="bi bi-tag-fill text-dorado-amazonico mr-2"></i> CAMBIAR TARIFA - {{ itemSeleccionado?.tipo?.nombre?.toUpperCase() }}</h3>
          <button class="modal-close" (click)="cerrarModal()">&times;</button>
        </div>
        <div class="modal-body">
          <div class="modal-info-card">
            <div class="modal-info-icon"><i class="bi bi-door-closed-fill"></i></div>
            <div class="modal-info-text">
              <strong>{{ itemSeleccionado?.tipo?.nombre }}</strong>
              <span>{{ itemSeleccionado?.tipo?.configuracionCamas || (itemSeleccionado?.tipo?.capacidadMax + ' cama' + ((itemSeleccionado?.tipo?.capacidadMax ?? 0) > 1 ? 's' : '')) }} | Capacidad: {{ itemSeleccionado?.tipo?.capacidadMax }} {{ (itemSeleccionado?.tipo?.capacidadMax ?? 0) === 1 ? 'persona' : 'personas' }}</span>
            </div>
          </div>

          <div class="campo">
            <label class="campo-label">Tarifa Actual Registrada</label>
            <div class="precio-actual-box">
              S/ {{ itemSeleccionado?.precioActual ? (itemSeleccionado?.precioActual | number:'1.2-2') : '—' }}
            </div>
          </div>

          <div class="campo">
            <label class="campo-label">Nuevo Precio por Noche <span class="required">*</span></label>
            <div class="input-prefix">
              <span class="input-prefix-text">S/</span>
              <input type="number" [(ngModel)]="nuevoPrecio" class="edit-input" min="1" step="0.5" placeholder="0.00">
            </div>
          </div>

          <div class="nota-card">
            <div class="nota-header"><i class="bi bi-exclamation-triangle-fill mr-1"></i> Importante para auditoría interna:</div>
            <div class="nota-body">
              Este cambio modificará únicamente el precio de las <strong>nuevas reservas</strong> que se registren a partir de este momento.<br>
              Las estadías activas o reservas ya pactadas mantendrán su precio original de S/ {{ itemSeleccionado?.precioActual ? (itemSeleccionado?.precioActual | number:'1.2-2') : '—' }}.
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-cancelar-modal" (click)="cerrarModal()">Cancelar</button>
          <button class="btn-guardar-modal" (click)="guardarPrecio()" [disabled]="!nuevoPrecio || nuevoPrecio <= 0">
            <i class="bi bi-floppy-fill mr-1"></i> Aplicar Nueva Tarifa
          </button>
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

    /* INFO CARD GLASS */
    .glass-panel {
      background: rgba(255, 255, 255, 0.9);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border: 1px solid rgba(45, 90, 39, 0.08);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.03);
    }

    .info-card {
      display: flex;
      align-items: center;
      gap: 16px;
      border-radius: 12px;
      padding: 16px 20px;
      margin-bottom: 28px;
      border: 1px solid rgba(212, 168, 67, 0.2);
      background: rgba(255, 255, 255, 0.8);
    }

    .info-icon {
      font-size: 1.4rem;
    }

    .info-text {
      font-size: 0.88rem;
      color: #2D5A27;
      font-weight: 600;
      line-height: 1.4;
    }

    /* GRID OF TARIFAS */
    .precios-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(290px, 1fr));
      gap: 20px;
    }

    .tipo-card {
      border-radius: 16px;
      padding: 24px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      border: 1px solid rgba(45, 90, 39, 0.08);
      transition: all 0.25s ease;
    }

    .tipo-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(45, 90, 39, 0.08);
    }

    .tipo-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      padding-bottom: 14px;
      border-bottom: 1px solid rgba(45, 90, 39, 0.06);
    }

    .tipo-nombre {
      font-size: 1.15rem;
      font-weight: 800;
      color: #2D5A27;
      text-transform: capitalize;
    }

    .tipo-capacidad {
      font-size: 0.74rem;
      color: #8B5A2B;
      background: rgba(139, 90, 43, 0.08);
      padding: 4px 12px;
      border-radius: 12px;
      font-weight: 700;
      border: 1px solid rgba(139, 90, 43, 0.15);
    }

    .tipo-precio {
      margin-bottom: 20px;
    }

    .precio-actual-label {
      display: block;
      font-size: 0.75rem;
      color: #64748b;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      margin-bottom: 6px;
    }

    .precio-actual-valor {
      font-size: 1.9rem;
      font-weight: 800;
      color: #2D5A27;
      font-family: 'Outfit', monospace;
    }

    .precio-actual-valor.sin-precio {
      color: #94a3b8;
      font-weight: 500;
      font-size: 1rem;
      font-family: inherit;
    }

    .btn-editar {
      width: 100%;
      padding: 10px 16px;
      background: rgba(45, 90, 39, 0.08);
      color: #2D5A27;
      border: 1px solid rgba(45, 90, 39, 0.15);
      border-radius: 8px;
      cursor: pointer;
      font-size: 0.84rem;
      font-weight: 700;
      transition: all 0.2s ease;
    }

    .btn-editar:hover {
      background: #2D5A27;
      color: white;
    }

    .empty-state {
      text-align: center;
      color: #64748b;
      padding: 60px;
      font-size: 0.95rem;
      font-weight: 600;
    }

    /* MODAL CAMBIO PRECIO BOUTIQUE */
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
      width: 500px;
      max-width: 92vw;
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

    .modal-close {
      background: none;
      border: none;
      font-size: 1.8rem;
      cursor: pointer;
      color: rgba(255, 255, 255, 0.8);
      padding: 0;
      line-height: 1;
      transition: color 0.2s;
    }

    .modal-close:hover {
      color: white;
    }

    .modal-body {
      padding: 24px;
    }

    .modal-info-card {
      display: flex;
      gap: 14px;
      background: rgba(45, 90, 39, 0.04);
      border-radius: 12px;
      padding: 14px 18px;
      margin-bottom: 20px;
      border: 1px solid rgba(45, 90, 39, 0.08);
      align-items: center;
    }

    .modal-info-icon {
      font-size: 1.6rem;
    }

    .modal-info-text {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .modal-info-text strong {
      font-size: 0.96rem;
      color: #1A211B;
      text-transform: capitalize;
      font-weight: 800;
    }

    .modal-info-text span {
      font-size: 0.8rem;
      color: #64748b;
      font-weight: 600;
    }

    .campo {
      margin-bottom: 20px;
    }

    .campo-label {
      display: block;
      font-size: 0.8rem;
      color: #2D5A27;
      margin-bottom: 6px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.02em;
    }

    .campo-label .required {
      color: #dc2626;
      font-weight: bold;
    }

    .precio-actual-box {
      font-size: 1.4rem;
      font-weight: 800;
      color: #8B5A2B; /* Marrón Madera */
      padding: 10px 16px;
      background: #f8fafc;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
      font-family: 'Outfit', monospace;
    }

    /* INPUT PREFIX IN GREEN/GOLD */
    .input-prefix {
      display: flex;
      align-items: stretch;
      border: 2px solid #2D5A27;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(45, 90, 39, 0.05);
    }

    .input-prefix:focus-within {
      border-color: #4E8D46;
      box-shadow: 0 0 0 3px rgba(78, 141, 70, 0.15);
    }

    .input-prefix-text {
      padding: 0 16px;
      font-weight: 800;
      color: #2D5A27;
      background: rgba(45, 90, 39, 0.06);
      font-size: 1rem;
      display: flex;
      align-items: center;
      border-right: 1px solid #2D5A27;
    }

    .edit-input {
      flex: 1;
      padding: 10px 14px;
      border: none;
      font-size: 1.05rem;
      font-weight: 700;
      outline: none;
      font-family: 'Outfit', sans-serif;
    }

    .nota-card {
      background: rgba(212, 168, 67, 0.06);
      border: 1px solid rgba(212, 168, 67, 0.25);
      border-radius: 12px;
      padding: 14px 18px;
      margin-top: 8px;
    }

    .nota-header {
      font-size: 0.8rem;
      font-weight: 800;
      color: #8B5A2B; /* Marrón */
      margin-bottom: 4px;
      text-transform: uppercase;
      letter-spacing: 0.02em;
    }

    .nota-body {
      font-size: 0.78rem;
      color: #8B5A2B;
      line-height: 1.5;
      font-weight: 500;
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      padding: 16px 24px 24px;
      border-top: 1px solid #f1f5f9;
    }

    .btn-cancelar-modal {
      padding: 10px 20px;
      background: transparent;
      color: #64748b;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      cursor: pointer;
      font-size: 0.84rem;
      font-weight: 700;
      transition: all 0.2s ease;
    }

    .btn-cancelar-modal:hover {
      background: #f1f5f9;
    }

    .btn-guardar-modal {
      padding: 10px 22px;
      background: linear-gradient(135deg, #2D5A27 0%, #1A211B 100%);
      color: white;
      border: 1px solid rgba(212, 168, 67, 0.15);
      border-radius: 8px;
      cursor: pointer;
      font-weight: 700;
      font-size: 0.84rem;
      transition: all 0.2s ease;
      box-shadow: 0 4px 10px rgba(45, 90, 39, 0.15);
    }

    .btn-guardar-modal:disabled {
      background: #cbd5e1;
      color: #94a3b8;
      border-color: #cbd5e1;
      cursor: not-allowed;
      box-shadow: none;
    }

    .btn-guardar-modal:hover:not(:disabled) {
      background: linear-gradient(135deg, #4E8D46 0%, #2D5A27 100%);
      transform: translateY(-1px);
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
export class PrecioListComponent implements OnInit {
  tiposConPrecio: TipoConPrecio[] = [];
  modalAbierto = false;
  itemSeleccionado: TipoConPrecio | null = null;
  nuevoPrecio = 0;

  error = '';

  constructor(
    private precioService: PrecioHistoricoService,
    private habitacionService: HabitacionService,
    private auth: AuthService
  ) {}

  ngOnInit(): void {
    this.cargarDatos();
  }

  private cargarDatos(): void {
    this.habitacionService.getTiposHabitacion().subscribe({
      next: (tipos) => {
        this.tiposConPrecio = tipos.map(t => ({
          tipo: t,
          precioActual: null,
          precioId: null
        }));
        this.cargarPreciosVigentes();
      }
    });
  }

  private cargarPreciosVigentes(): void {
    const today = new Date().toISOString().split('T')[0];
    this.tiposConPrecio.forEach(item => {
      this.precioService.getVigente(item.tipo.id, today).subscribe({
        next: (res) => {
          item.precioActual = res['precioNoche'];
        },
        error: () => {
          item.precioActual = null;
        }
      });
    });
  }

  abrirModal(item: TipoConPrecio): void {
    this.itemSeleccionado = item;
    this.nuevoPrecio = item.precioActual || 0;
    this.modalAbierto = true;
  }

  cerrarModal(): void {
    this.modalAbierto = false;
    this.itemSeleccionado = null;
    this.nuevoPrecio = 0;
  }

  guardarPrecio(): void {
    if (!this.nuevoPrecio || this.nuevoPrecio <= 0 || !this.itemSeleccionado) return;

    const user = this.auth.getUsuario();
    if (!user?.id) { this.error = 'Usuario no autenticado'; return; }

    const request: PrecioHistoricoRequest = {
      tipoHabitacionId: this.itemSeleccionado.tipo.id,
      precioNoche: this.nuevoPrecio,
      fechaInicio: new Date().toISOString().split('T')[0],
      creadoPor: user.id
    };

    this.precioService.create(request).subscribe({
      next: () => {
        this.itemSeleccionado!.precioActual = this.nuevoPrecio;
        this.cerrarModal();
      },
      error: (err) => {
        this.error = err.error?.message || 'Error al actualizar precio';
      }
    });
  }
}
