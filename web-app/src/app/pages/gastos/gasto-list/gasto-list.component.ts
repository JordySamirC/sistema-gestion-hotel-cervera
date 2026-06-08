import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GastoService } from '../../../core/services/gasto.service';
import { AuthService } from '../../../core/services/auth.service';
import { ExcelReportService } from '../../../core/services/excel-report.service';
import { GastoResponse, GastoRequest, CategoriaGasto, TipoGasto } from '../../../core/models/gasto';

@Component({
  selector: 'app-gasto-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-container fade-in">
      <!-- CABECERA DE LA PÁGINA (ESTILO BANNER PREMIUM DE MARCA) -->
      <div class="header-section">
        <div class="title-area">
          <h2><i class="header-icon-premium bi bi-wallet2"></i> Control de Egresos y Gastos</h2>
          <p class="subtitle">Clasificación, control contable mensual y trazabilidad de caja chica del hotel</p>
        </div>
        <div class="header-actions">
          <button class="btn-success" (click)="exportarExcel()" [disabled]="gastos.length === 0">
            <i class="bi bi-file-earmark-excel-fill"></i> Exportar Excel
          </button>
          <button class="btn-primary" (click)="abrirModalRegistro()">
            <i class="bi bi-plus-lg"></i> Registrar Gasto
          </button>
        </div>
      </div>

      <!-- PANEL DE FILTROS GLASSMORPHIC -->
      <div class="filtros-panel glass-panel">
        <div class="filtros-inputs">
          <div class="filtro-group flex-1">
            <label><i class="bi bi-calendar3 text-verde-selva mr-1"></i> Desde:</label>
            <input type="date" [(ngModel)]="fechaDesde" class="form-control">
          </div>
          <div class="filtro-group flex-1">
            <label><i class="bi bi-calendar3 text-verde-selva mr-1"></i> Hasta:</label>
            <input type="date" [(ngModel)]="fechaHasta" class="form-control">
          </div>
          <div class="filtro-group flex-1">
            <label><i class="bi bi-tags-fill text-verde-selva mr-1"></i> Categoría:</label>
            <select [(ngModel)]="categoriaIdSelected" class="form-control">
              <option [value]="null">Todas las categorías</option>
              <option *ngFor="let cat of categorias" [value]="cat.id">{{ cat.nombre }}</option>
            </select>
          </div>
          <div class="filtro-group flex-1">
            <label><i class="bi bi-bar-chart-fill text-verde-selva mr-1"></i> Tipo:</label>
            <select [(ngModel)]="tipoGastoIdSelected" class="form-control">
              <option [value]="null">Todos los tipos</option>
              <option *ngFor="let tip of tipos" [value]="tip.id">{{ tip.nombre }}</option>
            </select>
          </div>
        </div>
        <div class="filtros-acciones">
          <div class="spacer"></div>
          <button (click)="limpiarFiltros()" class="btn-secondary">
            <i class="bi bi-arrow-counterclockwise"></i> Limpiar Filtros
          </button>
          <button (click)="cargarGastos()" class="btn-primary">
            <i class="bi bi-search"></i> Aplicar Filtros
          </button>
        </div>
      </div>

      <!-- KPI RESUMEN CARDS (Warm & Sleek Palette) -->
      <div class="summary-cards">
        <div class="card card-total">
          <div class="card-icon-wrapper"><i class="bi bi-wallet-fill"></i></div>
          <div class="card-info">
            <span class="card-label">TOTAL GASTOS</span>
            <span class="card-value">S/ {{ totalGastos | number:'1.2-2' }}</span>
          </div>
        </div>
        <div class="card glass-panel">
          <div class="card-icon-wrapper blue"><i class="bi bi-people-fill"></i></div>
          <div class="card-info">
            <span class="card-label">Personal</span>
            <span class="card-value">S/ {{ totalPersonal | number:'1.2-2' }}</span>
          </div>
        </div>
        <div class="card glass-panel">
          <div class="card-icon-wrapper purple"><i class="bi bi-router-fill"></i></div>
          <div class="card-info">
            <span class="card-label">Internet</span>
            <span class="card-value">S/ {{ totalInternet | number:'1.2-2' }}</span>
          </div>
        </div>
        <div class="card glass-panel">
          <div class="card-icon-wrapper madera"><i class="bi bi-wrench-adjustable"></i></div>
          <div class="card-info">
            <span class="card-label">Mantenimiento</span>
            <span class="card-value">S/ {{ totalMantenimiento | number:'1.2-2' }}</span>
          </div>
        </div>
        <div class="card glass-panel">
          <div class="card-icon-wrapper green"><i class="bi bi-boxes"></i></div>
          <div class="card-info">
            <span class="card-label">Suministros</span>
            <span class="card-value">S/ {{ totalSuministros | number:'1.2-2' }}</span>
          </div>
        </div>
        <div class="card glass-panel">
          <div class="card-icon-wrapper dorado"><i class="bi bi-tags-fill"></i></div>
          <div class="card-info">
            <span class="card-label">Otros Egresos</span>
            <span class="card-value">S/ {{ totalOtros | number:'1.2-2' }}</span>
          </div>
        </div>
      </div>

      <!-- TABLA PRINCIPAL DE EGRESOS -->
      <div class="table-card glass-panel">
        <div class="table-header-title">
          <h3><i class="bi bi-list-stars text-verde-selva mr-1"></i> Historial de Egresos</h3>
          <span class="results-badge">{{ gastos.length }} transacciones en rango</span>
        </div>

        <div class="table-responsive">
          <table class="table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Descripción</th>
                <th>Categoría</th>
                <th>Tipo</th>
                <th class="text-right">Monto</th>
                <th>Registrado por</th>
                <th>Estado</th>
                <th class="text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let g of gastosPaginados" [class.cancelled-row]="g.estado === 'ANULADO'" class="table-row-hover">
                <td class="date-cell">{{ g.fechaGasto | date:'dd/MM/yyyy' }}</td>
                <td class="desc-cell" [title]="g.descripcion">{{ g.descripcion }}</td>
                <td>
                  <span class="badge badge-cat">{{ g.categoriaNombre }}</span>
                </td>
                <td>
                  <span class="badge badge-type" [class.badge-fijo]="g.tipoGastoNombre === 'Fijo'">
                    {{ g.tipoGastoNombre }}
                  </span>
                </td>
                <td class="monto-cell text-right">S/ {{ g.monto | number:'1.2-2' }}</td>
                <td class="usuario-cell">{{ g.creadoPorNombre }}</td>
                <td>
                  <span class="badge-status" [class.status-activo]="g.estado === 'ACTIVO'" [class.status-anulado]="g.estado === 'ANULADO'">
                    {{ g.estado }}
                  </span>
                </td>
                <td class="text-center actions-cell">
                  <button class="btn-action" (click)="verDetalle(g)">
                    <i class="bi bi-eye-fill"></i> Ver Detalle
                  </button>
                </td>
              </tr>
              <tr *ngIf="gastos.length === 0">
                <td colspan="8" class="empty-state">
                  <i class="bi bi-exclamation-circle-fill"></i> No se encontraron gastos registrados para el periodo seleccionado.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <!-- PAGINACIÓN PREMIUM CON CONTROLES DE MARCA -->
        <div class="paginator-container" *ngIf="gastos.length > 0">
          <div class="paginator-info">
            Mostrando <b>{{ getRangoInicio() }} - {{ getRangoFin() }}</b> de <b>{{ gastos.length }}</b> registros
          </div>
          <div class="paginator-controls">
            <div class="page-size-selector">
              <span>Mostrar:</span>
              <select [(ngModel)]="elementosPorPagina" (change)="onPageSizeChange()" class="size-select">
                <option [value]="5">5</option>
                <option [value]="10">10</option>
                <option [value]="20">20</option>
                <option [value]="9999">Todos</option>
              </select>
            </div>
            
            <div class="pagination-buttons" *ngIf="totalPaginas > 1">
              <button 
                class="pag-btn" 
                [disabled]="paginaActual === 1" 
                (click)="cambiarPagina(paginaActual - 1)"
              >
                ◀ Ant
              </button>
              
              <button 
                *ngFor="let p of getPaginasArray()" 
                class="pag-btn num-btn" 
                [class.active]="p === paginaActual"
                (click)="cambiarPagina(p)"
              >
                {{ p }}
              </button>

              <button 
                class="pag-btn" 
                [disabled]="paginaActual === totalPaginas" 
                (click)="cambiarPagina(paginaActual + 1)"
              >
                Sig ▶
              </button>
            </div>
          </div>
        </div>

      </div>

      <!-- ================= MODAL REGISTRO / EDICION ================= -->
      <div class="modal-overlay" *ngIf="showRegistroModal">
        <div class="modal-card glass-panel">
          <div class="modal-header">
            <h3><i class="bi bi-wallet2 text-dorado-amazonico mr-2"></i> {{ isEditMode ? 'Editar Ficha de Gasto' : 'Registrar Gasto Operativo' }}</h3>
            <button class="btn-close" (click)="cerrarModalRegistro()"><i class="bi bi-x"></i></button>
          </div>
          <form (ngSubmit)="guardarGasto()" class="modal-form">
            <div class="form-row">
              <div class="form-group">
                <label class="form-label"><i class="bi bi-calendar3 text-verde-selva mr-1"></i> Fecha del Gasto *</label>
                <input type="date" [(ngModel)]="newGasto.fechaGasto" name="fecha" required class="form-control">
              </div>
              <div class="form-group">
                <label class="form-label"><i class="bi bi-cash-stack text-verde-selva mr-1"></i> Monto (S/) *</label>
                <div class="input-monto-wrapper">
                  <span class="currency-prefix">S/</span>
                  <input type="number" [(ngModel)]="newGasto.monto" name="monto" required min="0.01" step="0.01" class="form-control pl-5">
                </div>
              </div>
            </div>
            
            <div class="form-group">
              <label class="form-label"><i class="bi bi-file-earmark-text-fill text-verde-selva mr-1"></i> Descripción *</label>
              <input type="text" [(ngModel)]="newGasto.descripcion" name="desc" required maxlength="200" placeholder="Ej. Pago de servicio de agua del mes" class="form-control">
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label"><i class="bi bi-tags-fill text-verde-selva mr-1"></i> Categoría *</label>
                <select [(ngModel)]="newGasto.categoriaId" name="cat" required class="form-control">
                  <option *ngFor="let cat of categorias" [value]="cat.id">{{ cat.nombre }}</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label"><i class="bi bi-bar-chart-fill text-verde-selva mr-1"></i> Tipo de Gasto *</label>
                <select [(ngModel)]="newGasto.tipoGastoId" name="tipo" required class="form-control">
                  <option *ngFor="let tip of tipos" [value]="tip.id">{{ tip.nombre }}</option>
                </select>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label"><i class="bi bi-chat-left-text-fill text-verde-selva mr-1"></i> Observaciones (opcional)</label>
              <textarea [(ngModel)]="newGasto.observaciones" name="obs" rows="3" placeholder="Detalles o referencias del pago..." class="form-control"></textarea>
            </div>

            <div class="modal-footer">
              <button type="button" class="btn-secondary" (click)="cerrarModalRegistro()">Cancelar</button>
              <button type="submit" class="btn-primary">✅ Guardar Gasto</button>
            </div>
          </form>
        </div>
      </div>

      <!-- ================= MODAL VER DETALLE / TRAZABILIDAD ================= -->
      <div class="modal-overlay" *ngIf="showDetalleModal && selectedGasto">
        <div class="modal-card modal-detail-card glass-panel">
          <div class="modal-header">
            <h3><i class="bi bi-info-circle-fill text-dorado-amazonico mr-2"></i> Detalle Operativo del Gasto</h3>
            <button class="btn-close" (click)="selectedGasto = null; showDetalleModal = false;"><i class="bi bi-x"></i></button>
          </div>
          
          <div class="detail-section">
            <h4 class="section-title">Información del Egreso</h4>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label"><i class="bi bi-calendar3 text-slate-500 mr-1"></i> Fecha:</span>
                <span class="info-value font-mono">{{ selectedGasto.fechaGasto | date:'dd/MM/yyyy' }}</span>
              </div>
              <div class="info-item">
                <span class="info-label"><i class="bi bi-cash-stack text-slate-500 mr-1"></i> Monto Registrado:</span>
                <span class="info-value value-monto font-mono">S/ {{ selectedGasto.monto | number:'1.2-2' }}</span>
              </div>
              <div class="info-item col-span-2">
                <span class="info-label"><i class="bi bi-file-earmark-text-fill text-slate-500 mr-1"></i> Descripción:</span>
                <span class="info-value font-semibold">{{ selectedGasto.descripcion }}</span>
              </div>
              <div class="info-item">
                <span class="info-label"><i class="bi bi-tags-fill text-slate-500 mr-1"></i> Categoría:</span>
                <div><span class="badge badge-cat">{{ selectedGasto.categoriaNombre }}</span></div>
              </div>
              <div class="info-item">
                <span class="info-label"><i class="bi bi-bar-chart-fill text-slate-500 mr-1"></i> Tipo:</span>
                <div><span class="badge badge-type" [class.badge-fijo]="selectedGasto.tipoGastoNombre === 'Fijo'">{{ selectedGasto.tipoGastoNombre }}</span></div>
              </div>
              <div class="info-item col-span-2">
                <span class="info-label"><i class="bi bi-chat-left-text-fill text-slate-500 mr-1"></i> Observaciones:</span>
                <span class="info-value italic">{{ selectedGasto.observaciones || 'Sin observaciones registradas.' }}</span>
              </div>
            </div>
          </div>

          <div class="detail-section detail-trazabilidad">
            <h4 class="section-title">Historial de Auditoría y Trazabilidad</h4>
            <div class="trace-list">
              <div class="trace-item">
                <i class="bi bi-check-circle-fill icon-trace text-green"></i>
                <div class="trace-content">
                  <p class="trace-title">Creado por <strong>{{ selectedGasto.creadoPorNombre }}</strong></p>
                  <p class="trace-time">{{ selectedGasto.fechaCreacion | date:'dd/MM/yyyy hh:mm a' }}</p>
                </div>
              </div>
              
              <div class="trace-item" *ngIf="selectedGasto.actualizadoPor">
                <i class="bi bi-pencil-fill icon-trace text-blue"></i>
                <div class="trace-content">
                  <p class="trace-title">Última modificación por <strong>{{ selectedGasto.actualizadoPorNombre }}</strong></p>
                  <p class="trace-time">{{ selectedGasto.fechaActualizacion | date:'dd/MM/yyyy hh:mm a' }}</p>
                </div>
              </div>

              <div class="trace-item cancelled-trace" *ngIf="selectedGasto.estado === 'ANULADO'">
                <i class="bi bi-x-circle-fill icon-trace text-red"></i>
                <div class="trace-content">
                  <p class="trace-title">Anulado por <strong>{{ selectedGasto.anuladoPorNombre }}</strong></p>
                  <p class="trace-time">{{ selectedGasto.fechaAnulacion | date:'dd/MM/yyyy hh:mm a' }}</p>
                  <div class="trace-reason">
                    <p class="reason-label">Motivo de Anulación:</p>
                    <p class="reason-text">"{{ selectedGasto.motivoAnulacion }}"</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="modal-footer footer-actions">
            <div class="actions-left">
              <button class="btn-secondary" *ngIf="selectedGasto.estado === 'ACTIVO'" (click)="iniciarEdicion(selectedGasto)">
                <i class="bi bi-pencil-square"></i> Editar Gasto
              </button>
              <button class="btn-danger-custom" *ngIf="selectedGasto.estado === 'ACTIVO'" (click)="abrirAnulacion(selectedGasto)">
                <i class="bi bi-trash-fill"></i> Anular Gasto
              </button>
            </div>
            <button class="btn-secondary" (click)="selectedGasto = null; showDetalleModal = false;">Cerrar</button>
          </div>
        </div>
      </div>

      <!-- ================= MODAL ANULACION CON MOTIVO OBLIGATORIO ================= -->
      <div class="modal-overlay" *ngIf="showAnulacionModal && selectedGasto">
        <div class="modal-card modal-confirm-card glass-panel">
          <div class="modal-header header-warning">
            <h3><i class="bi bi-exclamation-triangle-fill text-amber-500 mr-2"></i> Confirmar Anulación</h3>
            <button class="btn-close" (click)="showAnulacionModal = false; selectedGasto = null;"><i class="bi bi-x"></i></button>
          </div>
          <div class="modal-body">
            <div class="gasto-summary">
              <p>Vas a anular el gasto: <strong>{{ selectedGasto.descripcion }}</strong></p>
              <p>Monto del egreso: <strong class="text-red">S/ {{ selectedGasto.monto | number:'1.2-2' }}</strong></p>
            </div>
            
            <div class="alert-danger-box">
              <i class="bi bi-exclamation-triangle-fill"></i>
              <span>Esta acción registrará la anulación permanentemente y restará la cifra del balance de reportes operativos.</span>
            </div>

            <div class="form-group mt-3">
              <label class="form-label"><i class="bi bi-chat-square-quote-fill text-verde-selva mr-1"></i> Motivo de Anulación (Requerido) *</label>
              <textarea [(ngModel)]="motivoAnulacion" rows="3" placeholder="Detalle los motivos para realizar la anulación de este gasto..." class="form-control" required></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-secondary" (click)="showAnulacionModal = false;">Cancelar</button>
            <button class="btn-danger-custom" [disabled]="!motivoAnulacion || motivoAnulacion.trim().length === 0" (click)="confirmarAnulacion()">
              ❌ Confirmar Anulación
            </button>
          </div>
        </div>
      </div>

    </div>
  `,
  styles: [`
    /* Layout y Contenedores */
    .page-container {
      padding: 24px;
      font-family: 'Outfit', 'Inter', -apple-system, sans-serif;
      background: #FAF9F6; /* Soft warm premium background */
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

    .header-actions {
      display: flex;
      gap: 12px;
    }

    /* GLASSMORPHIC PANELS */
    .glass-panel {
      background: rgba(255, 255, 255, 0.9);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border: 1px solid rgba(45, 90, 39, 0.08);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.03);
    }

    .filtros-panel {
      padding: 20px 24px;
      border-radius: 16px;
      margin-bottom: 24px;
    }

    .filtros-inputs {
      display: flex;
      gap: 20px;
      margin-bottom: 20px;
      align-items: flex-end;
      flex-wrap: wrap;
    }

    .filtro-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .filtro-group.flex-1 {
      flex: 1;
      min-width: 200px;
    }

    .filtro-group label {
      font-size: 0.8rem;
      font-weight: 700;
      color: #2D5A27;
      text-transform: uppercase;
      letter-spacing: 0.02em;
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

    .form-label {
      font-size: 0.85rem;
      font-weight: 700;
      color: #2D5A27;
      margin-bottom: 6px;
      display: block;
    }

    .filtros-acciones {
      display: flex;
      gap: 12px;
      align-items: center;
      border-top: 1px solid rgba(45, 90, 39, 0.08);
      padding-top: 16px;
      flex-wrap: wrap;
    }

    .spacer {
      flex: 1;
    }

    /* BOTONES CUSTOM */
    .btn-primary {
      padding: 10px 20px;
      background: linear-gradient(135deg, #2D5A27 0%, #1A211B 100%);
      color: white;
      border: 1px solid rgba(212, 168, 67, 0.15);
      border-radius: 8px;
      font-weight: 700;
      font-size: 0.82rem;
      cursor: pointer;
      transition: all 0.2s ease;
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }

    .btn-primary:hover {
      background: linear-gradient(135deg, #4E8D46 0%, #2D5A27 100%);
      transform: translateY(-1px);
      box-shadow: 0 4px 10px rgba(45, 90, 39, 0.15);
    }

    .btn-secondary {
      padding: 10px 20px;
      background: white;
      color: #8B5A2B;
      border: 1px solid rgba(139, 90, 43, 0.35); /* Marrón Madera */
      border-radius: 8px;
      font-weight: 700;
      font-size: 0.82rem;
      cursor: pointer;
      transition: all 0.2s ease;
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }

    .btn-secondary:hover {
      background: rgba(139, 90, 43, 0.06);
    }

    .btn-success {
      padding: 10px 22px;
      background: linear-gradient(135deg, #4E8D46 0%, #2D5A27 100%);
      color: white;
      border: 1px solid rgba(212, 168, 67, 0.2);
      border-radius: 8px;
      font-weight: 700;
      font-size: 0.82rem;
      cursor: pointer;
      transition: all 0.2s ease;
      box-shadow: 0 4px 10px rgba(45, 90, 39, 0.12);
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }

    .btn-success:hover {
      background: linear-gradient(135deg, #2D5A27 0%, #1A211B 100%);
      transform: translateY(-1px);
    }

    .btn-danger-custom {
      padding: 10px 20px;
      background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%);
      color: white;
      border: 1px solid rgba(220, 38, 38, 0.15);
      border-radius: 8px;
      font-weight: 700;
      font-size: 0.82rem;
      cursor: pointer;
      transition: all 0.2s ease;
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }

    .btn-danger-custom:hover:not(:disabled) {
      background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
      transform: translateY(-1px);
      box-shadow: 0 4px 10px rgba(220, 38, 38, 0.2);
    }

    .btn-danger-custom:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    /* SUMMARY CARDS BOUTIQUE */
    .summary-cards {
      display: grid;
      grid-template-columns: repeat(6, 1fr);
      gap: 15px;
      margin-bottom: 24px;
    }

    @media (max-width: 1200px) {
      .summary-cards {
        grid-template-columns: repeat(3, 1fr);
      }
    }
    @media (max-width: 768px) {
      .summary-cards {
        grid-template-columns: repeat(2, 1fr);
      }
    }
    @media (max-width: 480px) {
      .summary-cards {
        grid-template-columns: 1fr;
      }
    }

    .card {
      border-radius: 16px;
      padding: 16px 20px;
      display: flex;
      align-items: center;
      gap: 16px;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .card:hover {
      transform: translateY(-3px);
      box-shadow: 0 12px 24px rgba(45, 90, 39, 0.08);
    }

    .card-icon-wrapper {
      width: 46px;
      height: 46px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.4rem;
      background: rgba(45, 90, 39, 0.08);
      color: #2D5A27;
      transition: all 0.3s ease;
    }

    .card-icon-wrapper.blue { background: rgba(37, 99, 235, 0.08); color: #2563eb; }
    .card-icon-wrapper.purple { background: rgba(147, 51, 234, 0.08); color: #9333ea; }
    .card-icon-wrapper.madera { background: rgba(139, 90, 43, 0.08); color: #8B5A2B; }
    .card-icon-wrapper.green { background: rgba(78, 141, 70, 0.08); color: #4E8D46; }
    .card-icon-wrapper.dorado { background: rgba(212, 168, 67, 0.08); color: #D4A843; }

    .card-total {
      background: linear-gradient(135deg, #1A211B 0%, #2D5A27 100%);
      color: white;
      border: 1px solid rgba(212, 168, 67, 0.22);
      box-shadow: 0 8px 24px rgba(45, 90, 39, 0.15);
    }

    .card-total .card-icon-wrapper {
      background: rgba(212, 168, 67, 0.16);
      color: #D4A843;
      filter: drop-shadow(0 2px 6px rgba(212, 168, 67, 0.4));
    }

    .card-info {
      display: flex;
      flex-direction: column;
    }

    .card-label {
      font-size: 0.72rem;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .card-total .card-label {
      color: rgba(255, 255, 255, 0.75);
    }

    .card-value {
      font-size: 1.25rem;
      font-weight: 800;
      color: #0f172a;
      margin-top: 3px;
    }

    .card-total .card-value {
      color: #D4A843;
      text-shadow: 0 1px 3px rgba(0, 0, 0, 0.25);
    }

    /* BOUTIQUE TABLE */
    .table-card {
      border-radius: 16px;
      overflow: hidden;
      margin-bottom: 24px;
    }

    .table-header-title {
      padding: 20px 24px;
      border-bottom: 1px solid rgba(45, 90, 39, 0.08);
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #ffffff;
    }

    .table-header-title h3 {
      margin: 0;
      font-size: 1.1rem;
      font-weight: 800;
      color: #1A211B;
    }

    .results-badge {
      font-size: 0.75rem;
      background: rgba(78, 141, 70, 0.08);
      color: #2D5A27;
      padding: 4px 10px;
      border-radius: 20px;
      font-weight: 700;
    }

    .table-responsive {
      overflow-x: auto;
    }

    .table {
      width: 100%;
      border-collapse: collapse;
      background: white;
    }

    .table th, .table td {
      padding: 16px 24px;
      font-size: 0.85rem;
      border-bottom: 1px solid #f1f5f9;
      vertical-align: middle;
    }

    .table th {
      background: #fafbfd;
      font-weight: 700;
      color: #2D5A27;
      text-transform: uppercase;
      font-size: 0.75rem;
      letter-spacing: 0.05em;
    }

    .table-row-hover {
      transition: background-color 0.2s ease;
    }

    .table-row-hover:hover {
      background-color: #fafbfd;
    }

    .date-cell {
      color: #64748b;
      font-weight: 600;
    }

    .desc-cell {
      font-weight: 600;
      color: #1a211b;
      max-width: 220px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .monto-cell {
      font-weight: 700;
      color: #b91c1c;
      font-size: 0.9rem;
    }

    .usuario-cell {
      color: #475569;
      font-weight: 600;
    }

    /* BADGES */
    .badge {
      display: inline-flex;
      padding: 4px 10px;
      border-radius: 20px;
      font-size: 0.72rem;
      font-weight: 700;
      text-transform: uppercase;
    }

    .badge-cat {
      background-color: rgba(78, 141, 70, 0.08);
      color: #2D5A27;
    }

    .badge-type {
      background-color: rgba(139, 90, 43, 0.08);
      color: #8B5A2B;
    }

    .badge-fijo {
      background-color: rgba(212, 168, 67, 0.1);
      color: #AA812A;
    }

    .badge-status {
      display: inline-flex;
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 0.7rem;
      font-weight: 800;
      letter-spacing: 0.02em;
    }

    .status-activo {
      background-color: #dcfce7;
      color: #166534;
    }

    .status-anulado {
      background-color: #fee2e2;
      color: #991b1b;
    }

    /* FILA ANULADA */
    .cancelled-row {
      background-color: rgba(220, 38, 38, 0.02);
      opacity: 0.75;
    }

    .cancelled-row td {
      text-decoration: line-through;
      text-decoration-color: #f87171;
    }

    .cancelled-row .actions-cell, .cancelled-row .badge-status {
      text-decoration: none !important;
    }

    .cancelled-row .monto-cell {
      color: #64748b;
    }

    /* BOTÓN ACCIÓN */
    .btn-action {
      background: white;
      border: 1px solid rgba(139, 90, 43, 0.25);
      color: #8B5A2B;
      border-radius: 6px;
      padding: 6px 12px;
      font-size: 0.75rem;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.15s ease;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }

    .btn-action:hover {
      background: rgba(139, 90, 43, 0.08);
      border-color: #8B5A2B;
    }

    .empty-state {
      text-align: center;
      color: #64748b;
      padding: 48px !important;
      font-size: 0.9rem;
      font-weight: 600;
    }

    /* MODALES ESTILO PREMIUM */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(26, 33, 27, 0.45);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      animation: fadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .modal-card {
      border-radius: 20px;
      width: 90%;
      max-width: 520px;
      overflow: hidden;
      animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      border: 1px solid rgba(212, 168, 67, 0.25);
      box-shadow: 0 20px 50px rgba(26, 33, 27, 0.25);
    }

    .modal-header {
      padding: 20px 28px;
      border-bottom: 1px solid rgba(45, 90, 39, 0.08);
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: linear-gradient(135deg, #1A211B 0%, #2D5A27 100%);
      color: white;
    }

    .modal-header h3 {
      margin: 0;
      font-size: 1.15rem;
      font-weight: 800;
      color: #ffffff;
    }

    .modal-header .btn-close {
      background: none;
      border: none;
      font-size: 1.6rem;
      color: rgba(255, 255, 255, 0.85);
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
    }

    .modal-header .btn-close:hover {
      color: #D4A843;
      transform: scale(1.1);
    }

    .modal-form {
      padding: 24px 28px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }

    .input-monto-wrapper {
      position: relative;
      display: flex;
      align-items: center;
    }

    .currency-prefix {
      position: absolute;
      left: 12px;
      font-weight: 700;
      color: #2D5A27;
      font-size: 0.85rem;
    }

    .pl-5 {
      padding-left: 32px !important;
    }

    textarea.form-control {
      resize: none;
      font-family: inherit;
    }

    .modal-footer {
      border-top: 1px solid rgba(45, 90, 39, 0.08);
      padding: 16px 28px;
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      background-color: #fafbfd;
    }

    /* MODAL VER DETALLE */
    .modal-detail-card {
      max-width: 600px;
    }

    .detail-section {
      padding: 20px 28px;
      border-bottom: 1px solid rgba(45, 90, 39, 0.08);
    }

    .section-title {
      font-size: 0.8rem;
      font-weight: 800;
      color: #2D5A27;
      margin: 0 0 14px;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      border-left: 3px solid #D4A843;
      padding-left: 10px;
    }

    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px;
    }

    .info-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .info-label {
      font-size: 0.72rem;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.02em;
    }

    .info-value {
      font-size: 0.88rem;
      color: #1a211b;
      font-weight: 500;
    }

    .value-monto {
      font-weight: 800;
      color: #b91c1c;
      font-size: 1rem;
    }

    /* HISTORIAL DE TRAZABILIDAD */
    .detail-trazabilidad {
      background-color: rgba(78, 141, 70, 0.02);
    }

    .trace-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .trace-item {
      display: flex;
      gap: 14px;
      align-items: flex-start;
    }

    .icon-trace {
      font-size: 1.15rem;
      margin-top: 2px;
    }

    .text-green { color: #16a34a; }
    .text-blue { color: #2563eb; }
    .text-red { color: #dc2626; }

    .trace-content {
      display: flex;
      flex-direction: column;
    }

    .trace-title {
      margin: 0;
      font-size: 0.84rem;
      color: #1e293b;
      font-weight: 500;
    }

    .trace-time {
      margin: 2px 0 0;
      font-size: 0.72rem;
      color: #64748b;
    }

    .trace-reason {
      background: rgba(220, 38, 38, 0.05);
      border: 1px solid rgba(220, 38, 38, 0.15);
      border-radius: 8px;
      padding: 10px 14px;
      margin-top: 6px;
      max-width: 460px;
    }

    .reason-label {
      margin: 0 0 3px;
      font-size: 0.7rem;
      font-weight: 800;
      color: #991b1b;
      text-transform: uppercase;
      letter-spacing: 0.02em;
    }

    .reason-text {
      margin: 0;
      font-size: 0.82rem;
      color: #7f1d1d;
      font-style: italic;
      line-height: 1.4;
    }

    .footer-actions {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
      box-sizing: border-box;
    }

    .actions-left {
      display: flex;
      gap: 8px;
    }

    /* MODAL ANULACIÓN */
    .modal-confirm-card {
      max-width: 460px;
    }

    .header-warning {
      background: linear-gradient(135deg, #8B5A2B 0%, #1A211B 100%);
      border-bottom: 1px solid rgba(212, 168, 67, 0.2);
    }

    .header-warning h3 {
      color: #ffffff;
    }

    .modal-body {
      padding: 24px 28px;
    }

    .gasto-summary {
      background: rgba(78, 141, 70, 0.03);
      border: 1px solid rgba(45, 90, 39, 0.08);
      border-radius: 8px;
      padding: 14px;
      margin-bottom: 16px;
      font-size: 0.88rem;
      color: #1a211b;
    }

    .gasto-summary p {
      margin: 6px 0;
    }

    .alert-danger-box {
      display: flex;
      gap: 12px;
      align-items: flex-start;
      padding: 14px;
      border-radius: 8px;
      font-size: 0.8rem;
      line-height: 1.4;
      background-color: rgba(220, 38, 38, 0.06);
      border: 1px solid rgba(220, 38, 38, 0.15);
      color: #991b1b;
      font-weight: 500;
    }

    .alert-danger-box i {
      font-size: 1.2rem;
      color: #dc2626;
      line-height: 1;
    }

    /* PAGINACIÓN BOUTIQUE */
    .paginator-container {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 24px;
      background: white;
      border-top: 1px solid rgba(45, 90, 39, 0.08);
      flex-wrap: wrap;
      gap: 16px;
    }

    .paginator-info {
      font-size: 0.85rem;
      color: #64748b;
    }

    .paginator-info b {
      color: #1A211B;
    }

    .paginator-controls {
      display: flex;
      align-items: center;
      gap: 24px;
    }

    .page-size-selector {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.85rem;
      color: #64748b;
    }

    .size-select {
      padding: 6px 12px;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      background: white;
      color: #1A211B;
      font-weight: 600;
      cursor: pointer;
      outline: none;
      font-family: inherit;
    }

    .size-select:focus {
      border-color: #2D5A27;
    }

    .pagination-buttons {
      display: flex;
      gap: 4px;
    }

    .pag-btn {
      padding: 6px 12px;
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      color: #64748b;
      font-weight: 600;
      font-size: 0.85rem;
      cursor: pointer;
      transition: all 0.2s ease;
      font-family: inherit;
    }

    .pag-btn:hover:not(:disabled) {
      background: rgba(45, 90, 39, 0.05);
      color: #2D5A27;
      border-color: #2D5A27;
    }

    .pag-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .pag-btn.num-btn {
      min-width: 36px;
      padding: 6px;
    }

    .pag-btn.active {
      background: linear-gradient(135deg, #2D5A27 0%, #1A211B 100%);
      color: white;
      border-color: transparent;
      box-shadow: 0 4px 10px rgba(45, 90, 39, 0.15);
    }

    /* Animaciones */
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slideUp { from { transform: translateY(15px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
  `]
})
export class GastoListComponent implements OnInit {
  // Lista y Filtros
  gastos: GastoResponse[] = [];
  gastosPaginados: GastoResponse[] = [];
  categorias: CategoriaGasto[] = [];
  tipos: TipoGasto[] = [];
  
  fechaDesde: string = '';
  fechaHasta: string = '';
  categoriaIdSelected: number | null = null;
  tipoGastoIdSelected: number | null = null;

  // Totales
  totalGastos = 0;
  totalPersonal = 0;
  totalInternet = 0;
  totalMantenimiento = 0;
  totalSuministros = 0;
  totalOtros = 0;

  // Modales
  showRegistroModal = false;
  showDetalleModal = false;
  showAnulacionModal = false;
  
  // Modos de formulario
  isEditMode = false;
  selectedGasto: GastoResponse | null = null;
  motivoAnulacion: string = '';
  hoy: string = new Date().toISOString().split('T')[0];

  // Paginación
  elementosPorPagina: number = 10;
  paginaActual: number = 1;
  totalPaginas: number = 1;

  newGasto: GastoRequest = {
    fechaGasto: new Date().toISOString().split('T')[0],
    descripcion: '',
    categoriaId: 0,
    tipoGastoId: 0,
    monto: 0,
    observaciones: '',
    creadoPor: ''
  };

  constructor(
    private service: GastoService,
    private auth: AuthService,
    private excelService: ExcelReportService
  ) {}

  ngOnInit(): void {
    // Rango de fechas por defecto: Mes actual (Desde el 1 del mes hasta hoy)
    const hoyDate = new Date();
    const primerDiaMes = new Date(hoyDate.getFullYear(), hoyDate.getMonth(), 1);
    
    this.fechaDesde = primerDiaMes.toISOString().split('T')[0];
    this.fechaHasta = hoyDate.toISOString().split('T')[0];

    // Cargar Catálogos
    this.service.getCategorias().subscribe({
      next: (cats) => {
        this.categorias = cats;
        // Asignar primer elemento por defecto en el form
        if (cats.length > 0) this.newGasto.categoriaId = cats[0].id;
      }
    });

    this.service.getTipos().subscribe({
      next: (tips) => {
        this.tipos = tips;
        // Asignar primer elemento por defecto en el form
        if (tips.length > 0) this.newGasto.tipoGastoId = tips[0].id;
      }
    });

    this.cargarGastos();
  }

  cargarGastos(): void {
    if (!this.fechaDesde || !this.fechaHasta) {
      alert('Las fechas Desde y Hasta son requeridas para filtrar.');
      return;
    }

    this.service.getConFiltros(
      this.fechaDesde,
      this.fechaHasta,
      this.categoriaIdSelected !== null ? Number(this.categoriaIdSelected) : undefined,
      this.tipoGastoIdSelected !== null ? Number(this.tipoGastoIdSelected) : undefined
    ).subscribe({
      next: (data) => {
        this.gastos = data;
        this.calcularResumen();
        this.paginaActual = 1;
        this.actualizarPaginacion();
      },
      error: (err) => {
        console.error('Error al cargar gastos:', err);
        alert('No se pudieron recuperar los gastos del sistema.');
      }
    });
  }

  limpiarFiltros(): void {
    const hoyDate = new Date();
    const primerDiaMes = new Date(hoyDate.getFullYear(), hoyDate.getMonth(), 1);
    
    this.fechaDesde = primerDiaMes.toISOString().split('T')[0];
    this.fechaHasta = hoyDate.toISOString().split('T')[0];
    this.categoriaIdSelected = null;
    this.tipoGastoIdSelected = null;

    this.cargarGastos();
  }

  calcularResumen(): void {
    this.totalGastos = 0;
    this.totalPersonal = 0;
    this.totalInternet = 0;
    this.totalMantenimiento = 0;
    this.totalSuministros = 0;
    this.totalOtros = 0;

    this.gastos.forEach((g) => {
      // Regla de Negocio: No contabilizar egresos de gastos anulados
      if (g.estado === 'ACTIVO') {
        this.totalGastos += g.monto;
        
        switch (g.categoriaNombre) {
          case 'Personal':
            this.totalPersonal += g.monto;
            break;
          case 'Internet':
            this.totalInternet += g.monto;
            break;
          case 'Mantenimiento':
            this.totalMantenimiento += g.monto;
            break;
          case 'Suministros':
            this.totalSuministros += g.monto;
            break;
          default:
            this.totalOtros += g.monto;
            break;
        }
      }
    });
  }

  abrirModalRegistro(): void {
    this.isEditMode = false;
    this.newGasto = {
      fechaGasto: new Date().toISOString().split('T')[0],
      descripcion: '',
      categoriaId: this.categorias.length > 0 ? this.categorias[0].id : 0,
      tipoGastoId: this.tipos.length > 0 ? this.tipos[0].id : 0,
      monto: 0,
      observaciones: '',
      creadoPor: this.auth.getUsuario()?.id || ''
    };
    this.showRegistroModal = true;
  }

  abrirModalEdicion(gasto: GastoResponse): void {
    this.isEditMode = true;
    this.selectedGasto = gasto;
    this.newGasto = {
      fechaGasto: gasto.fechaGasto,
      descripcion: gasto.descripcion,
      categoriaId: gasto.categoriaId,
      tipoGastoId: gasto.tipoGastoId,
      monto: gasto.monto,
      observaciones: gasto.observaciones || '',
      creadoPor: this.auth.getUsuario()?.id || ''
    };
    this.showRegistroModal = true;
  }

  cerrarModalRegistro(): void {
    this.showRegistroModal = false;
    this.selectedGasto = null;
  }

  guardarGasto(): void {
    // Validaciones basicas
    if (this.newGasto.monto <= 0) {
      alert('El monto del gasto debe ser mayor a 0.');
      return;
    }
    if (this.newGasto.fechaGasto > this.hoy) {
      alert('La fecha del gasto no puede ser en el futuro.');
      return;
    }

    if (this.isEditMode && this.selectedGasto) {
      this.service.update(this.selectedGasto.id, this.newGasto).subscribe({
        next: () => {
          this.cerrarModalRegistro();
          this.cargarGastos();
        },
        error: (err) => {
          console.error(err);
          let msg = err.error?.message || 'Error al actualizar el gasto.';
          if (err.error?.data && typeof err.error.data === 'object') {
            const details = Object.entries(err.error.data)
              .map(([key, val]) => `• ${val}`)
              .join('\n');
            msg += ':\n' + details;
          }
          alert(msg);
        }
      });
    } else {
      this.service.create(this.newGasto).subscribe({
        next: () => {
          this.cerrarModalRegistro();
          this.cargarGastos();
        },
        error: (err) => {
          console.error(err);
          let msg = err.error?.message || 'Error al registrar el gasto.';
          if (err.error?.data && typeof err.error.data === 'object') {
            const details = Object.entries(err.error.data)
              .map(([key, val]) => `• ${val}`)
              .join('\n');
            msg += ':\n' + details;
          }
          alert(msg);
        }
      });
    }
  }

  verDetalle(gasto: GastoResponse): void {
    this.selectedGasto = gasto;
    this.showDetalleModal = true;
  }

  iniciarEdicion(gasto: GastoResponse): void {
    this.showDetalleModal = false;
    this.abrirModalEdicion(gasto);
  }

  abrirAnulacion(gasto: GastoResponse): void {
    this.showDetalleModal = false;
    this.selectedGasto = gasto;
    this.motivoAnulacion = '';
    this.showAnulacionModal = true;
  }

  confirmarAnulacion(): void {
    if (!this.selectedGasto) return;
    if (!this.motivoAnulacion || this.motivoAnulacion.trim().length === 0) {
      alert('Debe ingresar un motivo para anular el gasto.');
      return;
    }

    const userId = this.auth.getUsuario()?.id;
    if (!userId) {
      alert('No se pudo identificar al usuario activo.');
      return;
    }

    this.service.anularGasto(this.selectedGasto.id, this.motivoAnulacion, userId).subscribe({
      next: () => {
        this.showAnulacionModal = false;
        this.selectedGasto = null;
        this.cargarGastos();
      },
      error: (err) => {
        console.error(err);
        alert(err.error?.message || 'Error al anular el gasto.');
      }
    });
  }

  exportarExcel(): void {
    this.excelService.generarExcelGastos(this.gastos)
      .then(() => console.log('Excel de gastos generado con éxito.'))
      .catch((err) => {
        console.error(err);
        alert('Hubo un error al intentar exportar los gastos a Excel.');
      });
  }

  // MÉTODOS DE PAGINACIÓN
  actualizarPaginacion(): void {
    this.totalPaginas = Math.ceil(this.gastos.length / this.elementosPorPagina) || 1;
    if (this.paginaActual > this.totalPaginas) {
      this.paginaActual = this.totalPaginas;
    }
    
    const inicio = (this.paginaActual - 1) * this.elementosPorPagina;
    const fin = inicio + parseInt(this.elementosPorPagina.toString());
    
    this.gastosPaginados = this.gastos.slice(inicio, fin);
  }

  cambiarPagina(pagina: number): void {
    if (pagina >= 1 && pagina <= this.totalPaginas) {
      this.paginaActual = pagina;
      this.actualizarPaginacion();
      
      const table = document.querySelector('.table-card');
      if (table) {
        table.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }

  onPageSizeChange(): void {
    this.paginaActual = 1;
    this.actualizarPaginacion();
  }

  getRangoInicio(): number {
    if (this.gastos.length === 0) return 0;
    return (this.paginaActual - 1) * this.elementosPorPagina + 1;
  }

  getRangoFin(): number {
    return Math.min(this.paginaActual * this.elementosPorPagina, this.gastos.length);
  }

  getPaginasArray(): number[] {
    const arr = [];
    let start = Math.max(1, this.paginaActual - 2);
    let end = Math.min(this.totalPaginas, start + 4);
    
    if (end - start < 4) {
      start = Math.max(1, end - 4);
    }
    
    for (let i = start; i <= end; i++) {
      arr.push(i);
    }
    return arr;
  }
}
