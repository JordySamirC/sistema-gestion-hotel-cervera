import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ReservaService } from '../../../core/services/reserva.service';
import { PagoService } from '../../../core/services/pago.service';
import { ExcelReportService, ItemExcelReport } from '../../../core/services/excel-report.service';
import { PanelReservaItem, ExtenderReservaRequest, ExtenderGrupoRequest, CancelarReservaRequest, CancelarGrupoRequest } from '../../../core/models/reserva';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';

type ModalType = 'extender' | 'cancelar' | 'detalles_grupo' | null;

@Component({
  selector: 'app-panel-reservas',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, MatInputModule, MatDatepickerModule, MatNativeDateModule, MatFormFieldModule],
  template: `
    <div class="page-container fade-in">
      <!-- CABECERA DE LA PÁGINA (ESTILO BANNER PREMIUM DE MARCA) -->
      <div class="header-section">
        <div class="title-area">
          <h2><i class="header-icon-premium bi bi-calendar-check-fill"></i> Gestión de Reservas</h2>
          <p class="subtitle">Administre y supervise el estado de las reservas individuales y grupales en tiempo real</p>
        </div>
      </div>

      <!-- BARRA DE ACCIONES Y BÚSQUEDA GLASSMORPHIC -->
      <div class="filters-card glass-panel">
        <div class="search-row">
          <div class="search-box">
            <span class="search-icon"><i class="bi bi-search"></i></span>
            <input type="text" placeholder="Buscar por código, cliente, grupo o habitación..."
                   [(ngModel)]="terminoBusqueda" (input)="aplicarFiltros()">
            <button *ngIf="terminoBusqueda" class="clear-btn" (click)="terminoBusqueda = ''; aplicarFiltros()">✕</button>
          </div>
        </div>

        <!-- FILTRO DE RANGO DE FECHAS PREMIUM -->
        <div class="date-filter-row">
          <div class="date-input-group">
            <div class="date-field">
              <label class="filter-label"><i class="bi bi-calendar-event text-verde-selva mr-1"></i> Desde</label>
              <input type="date" [(ngModel)]="fechaInicio" class="date-input">
            </div>
            <div class="date-field">
              <label class="filter-label"><i class="bi bi-calendar-event text-verde-selva mr-1"></i> Hasta</label>
              <input type="date" [(ngModel)]="fechaFin" class="date-input">
            </div>
            <div class="date-buttons">
              <button class="btn-apply-dates" (click)="aplicarFiltros()">
                <i class="bi bi-calendar-range mr-1"></i> Aplicar Fechas
              </button>
              <button *ngIf="fechaInicio || fechaFin" class="btn-clear-dates" (click)="limpiarFechas()">
                <i class="bi bi-x-circle mr-1"></i> Limpiar
              </button>
            </div>
          </div>
        </div>

        <div class="filters-and-actions-grid">
          <div class="filter-group">
            <label class="filter-label"><i class="bi bi-funnel-fill text-verde-selva mr-1"></i> Filtros Rápidos</label>
            <div class="filtros-rapidos">
              <button [class.active]="filtro === 'todas'" (click)="filtro='todas'; aplicarFiltros()">Todas</button>
              <button [class.active]="filtro === 'individuales'" (click)="filtro='individuales'; aplicarFiltros()">Individuales</button>
              <button [class.active]="filtro === 'grupos'" (click)="filtro='grupos'; aplicarFiltros()">Grupos</button>
              <button [class.active]="filtro === 'reservadas'" (click)="filtro='reservadas'; aplicarFiltros()">Reservadas</button>
              <button [class.active]="filtro === 'hospedados'" (click)="filtro='hospedados'; aplicarFiltros()">Hospedadas</button>
              <button [class.active]="filtro === 'finalizadas'" (click)="filtro='finalizadas'; aplicarFiltros()">Finalizadas</button>
              <button [class.active]="filtro === 'canceladas'" (click)="filtro='canceladas'; aplicarFiltros()">Canceladas</button>
            </div>
          </div>

          <div class="action-buttons">
            <a routerLink="/reservas/grupo/nuevo" class="btn-secondary">
              <i class="bi bi-people-fill"></i> Reserva Grupal
            </a>
            <a routerLink="/reservas/individual/nueva" class="btn-primary">
              <i class="bi bi-calendar-plus-fill"></i> Nueva Reserva
            </a>
          </div>
        </div>
      </div>

      <!-- LISTADO DE RESERVAS EN TARJETA PREMIUM -->
      <div class="table-card glass-panel">
        <div class="table-header-title">
          <h3><i class="bi bi-journal-text text-verde-selva mr-1"></i> Listado y Control de Reservas</h3>
          <span class="results-badge">{{ reservasFiltradas.length }} registros en total</span>
        </div>

        <div class="table-container">
          <table class="reservas-table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Cliente</th>
                <th>Ingreso</th>
                <th>Salida</th>
                <th>Grupo</th>
                <th>Estado</th>
                <th>Total Estimado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              <ng-container *ngFor="let item of reservasPaginadas">
                <!-- REGISTRO INDIVIDUAL -->
                <tr *ngIf="item.tipo === 'INDIVIDUAL'" class="fila-individual table-row">
                  <td class="codigo">{{ item.codigo }}</td>
                  <td class="cliente-cell">
                    <span class="icono-titular"><i class="bi bi-person-fill text-dorado-amazonico mr-1"></i></span> 
                    <span class="nombre-texto">{{ item.cliente }}</span> 
                    <span class="rol-label">(Titular)</span>
                  </td>
                  <td>{{ item.fechaIngreso | date:'dd/MM/yyyy' }}</td>
                  <td>{{ item.fechaSalida | date:'dd/MM/yyyy' }}</td>
                  <td class="no-group">{{ item.grupoNombre || '---' }}</td>
                  <td><span class="status-badge" [ngClass]="badgeClass(item)">{{ estadoLabel(item) }}</span></td>
                  <td class="precio-total">S/ {{ item.precioTotal | number:'1.2-2' }}</td>
                  <td class="acciones-cell">
                    <div class="btn-grupo-acciones">
                      <button class="btn-accion-ver" [routerLink]="['/reservas', item.codigo]"><i class="bi bi-eye mr-1"></i> Ver</button>
                      <button *ngIf="item.estado === 'RESERVADA'" class="btn-accion-cancelar" (click)="abrirCancelar(item)"><i class="bi bi-trash mr-1"></i> Cancelar</button>
                      <button *ngIf="item.estado === 'RESERVADA' || item.estado === 'HOSPEDADO'" class="btn-accion-extender" (click)="abrirExtender(item)"><i class="bi bi-calendar-plus mr-1"></i> Extender</button>
                    </div>
                  </td>
                </tr>

                <!-- REGISTRO DE GRUPO -->
                <ng-container *ngIf="item.tipo === 'GRUPO'">
                  <tr class="fila-grupo table-row">
                    <td class="codigo">{{ item.codigo }}</td>
                    <td class="cliente-cell">
                      <span class="icono-responsable"><i class="bi bi-person-badge-fill text-verde-selva mr-1"></i></span> 
                      <span class="nombre-texto">{{ item.cliente }}</span> 
                      <span class="rol-label info-label">(Resp. pago)</span>
                    </td>
                    <td>{{ item.fechaIngreso | date:'dd/MM/yyyy' }}</td>
                    <td>{{ item.fechaSalida | date:'dd/MM/yyyy' }}</td>
                    <td><span class="badge-grupo-tag"><i class="bi bi-people-fill mr-1"></i> {{ item.grupoNombre }}</span></td>
                    <td><span class="status-badge badge-grupo-estado" [ngClass]="badgeClass(item)">{{ estadoLabel(item) }}</span></td>
                    <td class="precio-total">S/ {{ item.precioTotal | number:'1.2-2' }}</td>
                    <td class="acciones-cell">
                      <div class="btn-grupo-acciones">
                        <button class="btn-accion-ver" (click)="abrirDetallesGrupo(item)"><i class="bi bi-eye mr-1"></i> Ver</button>
                        <button class="btn-expandir" (click)="toggleGrupo(item)">
                          {{ item.expandido ? '▲' : '▼' }} Habitaciones
                        </button>
                        <button *ngIf="item.estado === 'RESERVADA'" class="btn-accion-cancelar" (click)="abrirCancelar(item)"><i class="bi bi-trash mr-1"></i> Cancelar</button>
                        <button *ngIf="item.estado === 'RESERVADA' || item.estado === 'ACTIVO'" class="btn-accion-extender" (click)="abrirExtender(item)"><i class="bi bi-calendar-plus mr-1"></i> Extender</button>
                      </div>
                    </td>
                  </tr>
                  
                  <!-- HIJAS DEL GRUPO -->
                  <ng-container *ngIf="item.expandido">
                    <tr *ngFor="let hija of item.hijas" class="fila-hija table-row">
                      <td class="indentado codigo">{{ hija.codigo }}</td>
                      <td class="indentado cliente-cell">
                        <span class="icono-titular"><i class="bi bi-person-fill text-dorado-amazonico mr-1"></i></span> 
                        <span class="nombre-texto">{{ hija.cliente }}</span> 
                        <span class="rol-label">(Titular)</span>
                      </td>
                      <td>{{ hija.fechaIngreso | date:'dd/MM/yyyy' }}</td>
                      <td>{{ hija.fechaSalida | date:'dd/MM/yyyy' }}</td>
                      <td class="no-group">---</td>
                      <td><span class="status-badge" [ngClass]="badgeClass(hija)">{{ estadoLabel(hija) }}</span></td>
                      <td class="precio-total">S/ {{ hija.precioTotal | number:'1.2-2' }}</td>
                      <td class="acciones-cell">
                        <div class="btn-grupo-acciones">
                          <button class="btn-accion-ver" [routerLink]="['/reservas', hija.codigo]"><i class="bi bi-eye mr-1"></i> Ver</button>
                          <button *ngIf="hija.estado === 'RESERVADA'" class="btn-accion-cancelar" (click)="abrirCancelar(hija)"><i class="bi bi-trash mr-1"></i> Cancelar</button>
                          <button *ngIf="hija.estado === 'RESERVADA' || hija.estado === 'HOSPEDADO'" class="btn-accion-extender" (click)="abrirExtender(hija)"><i class="bi bi-calendar-plus mr-1"></i> Extender</button>
                        </div>
                      </td>
                    </tr>
                  </ng-container>
                </ng-container>
              </ng-container>
              
              <!-- ESTADO VACÍO -->
              <tr *ngIf="reservasFiltradas.length === 0">
                <td colspan="8" class="empty-state">
                  <div class="empty-icon"><i class="bi bi-calendar-x text-slate-400"></i></div>
                  <p>No se encontraron reservas que coincidan con los filtros seleccionados.</p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- PAGINACIÓN PREMIUM CON CONTROLES DE MARCA -->
        <div class="paginator-container" *ngIf="reservasFiltradas.length > 0">
          <div class="paginator-info">
            Mostrando <b>{{ getRangoInicio() }} - {{ getRangoFin() }}</b> de <b>{{ reservasFiltradas.length }}</b> registros
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
    </div>

    <!-- MODAL BOUTIQUE EXTENDER O CANCELAR -->
    <div class="modal-overlay" *ngIf="modalActivo" (click)="cerrarModal()">
      <div class="modal-content animate-in" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>{{ modalTitulo }}</h3>
          <button class="modal-close" (click)="cerrarModal()">&times;</button>
        </div>

        <div class="modal-body" *ngIf="modalActivo === 'extender'">
          <div class="form-group">
            <label class="form-label">Código</label>
            <input type="text" [value]="modalItem?.codigo" disabled class="form-control">
          </div>
          <div class="form-group">
            <label class="form-label">Salida actual</label>
            <input type="text" [value]="modalItem?.fechaSalida | date:'dd/MM/yyyy'" disabled class="form-control">
          </div>
          <div class="form-group">
            <label class="form-label">Nueva fecha de salida *</label>
            <mat-form-field appearance="outline" class="full-width" subscriptSizing="dynamic">
              <input matInput [matDatepicker]="extendPicker"
                     [(ngModel)]="extendForm.nuevaFechaSalida"
                     name="nuevaFechaSalida"
                     required
                     [min]="minFechaExtension"
                     placeholder="dd/mm/aaaa">
              <mat-datepicker-toggle matSuffix [for]="extendPicker"></mat-datepicker-toggle>
              <mat-datepicker #extendPicker startView="month"></mat-datepicker>
            </mat-form-field>
            <small *ngIf="extendForm.nuevaFechaSalida" class="help-text">
              Se extenderá hasta el {{ extendForm.nuevaFechaSalida | date:'dd/MM/yyyy' }}
            </small>
          </div>
        </div>

        <div class="modal-body" *ngIf="modalActivo === 'cancelar'">
          <div class="form-group">
            <label class="form-label">Código</label>
            <input type="text" [value]="modalItem?.codigo" disabled class="form-control">
          </div>
          <div class="form-group">
            <label class="form-label">Cliente</label>
            <input type="text" [value]="modalItem?.cliente" disabled class="form-control">
          </div>
          <div class="form-group">
            <label class="form-label">Motivo de cancelación *</label>
            <select [(ngModel)]="cancelFormMotivoSeleccionado" class="form-control">
              <option value="">Seleccione un motivo...</option>
              <option value="Cliente anula por cambio de planes">Cliente anula por cambio de planes</option>
              <option value="Cliente anula sin motivo específico">Cliente anula sin motivo específico</option>
              <option value="Emergencia (salud/familia)">Emergencia (salud/familia)</option>
              <option value="Problemas con el pago / tarjeta">Problemas con el pago / tarjeta</option>
              <option value="Inasistencia">No se presentó</option>
              <option value="Problemas con la habitación">Problemas con la habitación</option>
              <option value="Otro (especificar)">Otro (especificar)</option>
            </select>
            <input *ngIf="cancelFormMotivoSeleccionado === 'Otro (especificar)'" type="text" [(ngModel)]="cancelFormMotivoOtro" placeholder="Especifique el motivo de la cancelación..." class="form-control mt-2">
          </div>
          <div class="form-group">
            <label class="form-label">Observaciones (opcional)</label>
            <textarea [(ngModel)]="cancelForm.observaciones" placeholder="Detalles adicionales sobre la cancelación..." class="form-control" rows="3"></textarea>
          </div>
        </div>

        <div class="modal-body" *ngIf="modalActivo === 'detalles_grupo'">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
            <div class="form-group">
              <label class="form-label">Código de Grupo</label>
              <input type="text" [value]="modalItem?.codigo" disabled class="form-control" style="background: #f8fafc; cursor: not-allowed; font-weight: 600;">
            </div>
            <div class="form-group">
              <label class="form-label">Nombre del Grupo</label>
              <input type="text" [value]="modalItem?.grupoNombre" disabled class="form-control" style="background: #f8fafc; cursor: not-allowed; font-weight: 600;">
            </div>
            <div class="form-group">
              <label class="form-label">Responsable de Pago</label>
              <input type="text" [value]="modalItem?.cliente" disabled class="form-control" style="background: #f8fafc; cursor: not-allowed; font-weight: 600;">
            </div>
            <div class="form-group">
              <label class="form-label">Estado</label>
              <input type="text" [value]="estadoLabel(modalItem)" disabled class="form-control" style="background: #f8fafc; cursor: not-allowed; font-weight: 600;">
            </div>
            <div class="form-group">
              <label class="form-label">Ingreso</label>
              <input type="text" [value]="modalItem?.fechaIngreso | date:'dd/MM/yyyy'" disabled class="form-control" style="background: #f8fafc; cursor: not-allowed; font-weight: 600;">
            </div>
            <div class="form-group">
              <label class="form-label">Salida</label>
              <input type="text" [value]="modalItem?.fechaSalida | date:'dd/MM/yyyy'" disabled class="form-control" style="background: #f8fafc; cursor: not-allowed; font-weight: 600;">
            </div>
            <div class="form-group">
              <label class="form-label">Total Habitaciones</label>
              <input type="text" [value]="(modalItem?.hijas?.length || 0) + ' habitación(es)'" disabled class="form-control" style="background: #f8fafc; cursor: not-allowed; font-weight: 600;">
            </div>
            <div class="form-group">
              <label class="form-label">Costo Total Estimado</label>
              <input type="text" [value]="'S/ ' + (modalItem?.precioTotal | number:'1.2-2')" disabled class="form-control" style="background: #f8fafc; cursor: not-allowed; font-weight: 600; color: #2D5A27;">
            </div>
          </div>
          <div style="margin-top: 20px; padding: 16px; background: rgba(212, 168, 67, 0.1); border: 1px solid rgba(212, 168, 67, 0.3); border-radius: 8px; color: #8a6d28; font-size: 0.88rem; display: flex; align-items: center;">
             <i class="bi bi-info-circle-fill mr-2" style="font-size: 1.2rem;"></i> 
             <span>Para ver los detalles completos de cada huésped o cambiar sus datos, expanda el grupo en el panel principal y presione el botón <strong>"Habitaciones"</strong> y haga clic en <strong>"Ver"</strong> en la reserva individual correspondiente.</span>
          </div>
          <h3 style="margin-top: 25px; margin-bottom: 15px; font-size: 1.1rem; color: #1e293b; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">
            <i class="bi bi-credit-card mr-2"></i> FACTURACIÓN DEL GRUPO
          </h3>

          <div class="modo-facturacion" *ngIf="estadoLabel(modalItem) === 'Finalizado'" style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px;">
              <div *ngIf="modoFacturacion === 'CARGANDO'" style="text-align: center; color: #64748b; font-size: 0.9rem;">
                <i class="bi bi-hourglass-split mr-2"></i> Cargando información de facturación...
              </div>

              <div *ngIf="modoFacturacion === 'CONSOLIDADO'" class="modo-consolidado" style="margin-bottom: 15px;">
                  <span style="display: inline-block; padding: 4px 10px; background: #e0f2fe; color: #0369a1; border-radius: 4px; font-weight: 600; font-size: 0.85rem; margin-bottom: 8px;">
                    ● Facturación Grupal Consolidada
                  </span>
                  <p style="margin: 0; font-size: 0.9rem; color: #475569;">
                    Se emitió <strong>un solo comprobante</strong> a nombre del responsable de pago <strong>{{ modalItem?.cliente }}</strong>  que incluye todas las habitaciones del grupo.
                  </p>
              </div>

              <div *ngIf="modoFacturacion === 'INDIVIDUAL'" class="modo-individual" style="margin-bottom: 15px;">
                  <span style="display: inline-block; padding: 4px 10px; background: #f1f5f9; color: #475569; border-radius: 4px; font-weight: 600; font-size: 0.85rem; margin-bottom: 8px;">
                    ○ Facturación Individual
                  </span>
                  <p style="margin: 0; font-size: 0.9rem; color: #475569;">
                    Se emitieron <strong>comprobantes separados</strong> para cada habitación individualmente.
                  </p>
              </div>

              <div style="display: flex; align-items: center; justify-content: flex-start; border-top: 1px solid #e2e8f0; padding-top: 15px; margin-top: 10px;" *ngIf="modoFacturacion === 'CONSOLIDADO'">
                <button class="btn-save" (click)="descargarExcelGrupo()" [disabled]="modalGuardando" style="background: #107c41; padding: 8px 16px; font-size: 0.9rem;">
                  <i class="bi bi-file-earmark-excel mr-2"></i> {{ modalGuardando ? 'Descargando...' : 'Descargar Excel de Facturación' }}
                </button>
              </div>
          </div>

          <div *ngIf="estadoLabel(modalItem) !== 'Finalizado'" style="margin-top: 20px; padding: 16px; background: rgba(148, 163, 184, 0.1); border: 1px dashed rgba(148, 163, 184, 0.4); border-radius: 8px; color: #64748b; font-size: 0.88rem; text-align: center;">
             La información de facturación estará disponible cuando el grupo realice el registro de salida y se genere el comprobante de pago.
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn-cancel" (click)="cerrarModal()">{{ modalActivo === 'detalles_grupo' ? 'Cerrar' : 'Volver' }}</button>
          <button *ngIf="modalActivo !== 'detalles_grupo'" class="btn-save" (click)="guardarModal()" [disabled]="modalGuardando || (modalActivo === 'cancelar' && (!cancelFormMotivoSeleccionado || (cancelFormMotivoSeleccionado === 'Otro (especificar)' && !cancelFormMotivoOtro.trim()))) || (modalActivo === 'extender' && !extendForm.nuevaFechaSalida)">
            {{ modalGuardando ? 'Guardando...' : 'Confirmar' }}
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
      max-width: 1400px;
      margin: 0 auto;
      width: 100%;
    }

    /* CABECERA ALINEADA CON LA IDENTIDAD DE MARCA (VERDE SELVA & OSCURO PREMIUM & SOL DORADO) */
    .header-section {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 24px 32px;
      background: linear-gradient(135deg, #1A211B 0%, #2D5A27 100%); /* Fondo Oscuro Premium a Verde Selva */
      border: 1px solid rgba(212, 168, 67, 0.2); /* Borde sutil Dorado Amazónico */
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
      width: 160px;
      height: 160px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(212, 168, 67, 0.15) 0%, rgba(212, 168, 67, 0) 70%); /* Sol Dorado Amazónico */
      pointer-events: none;
    }

    .header-section h2 {
      margin: 0;
      font-size: 1.8rem;
      font-weight: 800;
      color: #ffffff; /* Alto contraste */
      letter-spacing: -0.02em;
      display: flex;
      align-items: center;
      gap: 10px;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    }

    .header-section .subtitle {
      margin: 6px 0 0;
      font-size: 0.98rem;
      color: rgba(255, 255, 255, 0.85); /* Alto contraste */
      font-weight: 500;
    }

    /* CONTENEDORES GLASSMORPHIC */
    .glass-panel {
      background: rgba(255, 255, 255, 0.85);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border: 1px solid rgba(45, 90, 39, 0.08);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.03);
    }

    /* FILTROS CARD Y BÚSQUEDA */
    .filters-card {
      border-radius: 16px;
      padding: 24px;
      margin-bottom: 24px;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .search-row {
      display: flex;
      gap: 12px;
    }

    .search-box {
      position: relative;
      flex: 1;
      display: flex;
      align-items: center;
    }

    .search-icon {
      position: absolute;
      left: 16px;
      color: #64748b;
      font-size: 1.05rem;
    }

    .search-box input {
      width: 100%;
      padding: 12px 14px 12px 46px;
      border: 1px solid #cbd5e1;
      border-radius: 10px;
      font-size: 0.92rem;
      font-family: inherit;
      outline: none;
      transition: all 0.25s ease;
      background: rgba(248, 250, 252, 0.7);
    }

    .search-box input:focus {
      border-color: #2D5A27; /* Verde Selva */
      box-shadow: 0 0 0 3px rgba(45, 90, 39, 0.12);
      background: white;
    }

    .clear-btn {
      position: absolute;
      right: 14px;
      background: none;
      border: none;
      color: #94a3b8;
      cursor: pointer;
      font-size: 1rem;
      padding: 4px;
    }

    .clear-btn:hover {
      color: #64748b;
    }

    .date-filter-row {
      margin-top: 16px;
      padding-top: 16px;
      border-top: 1px dashed rgba(45, 90, 39, 0.1);
      width: 100%;
    }

    .date-input-group {
      display: flex;
      align-items: flex-end;
      gap: 16px;
      flex-wrap: wrap;
    }

    .date-field {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .date-input {
      padding: 9px 14px;
      border: 1px solid #cbd5e1;
      border-radius: 10px;
      font-size: 0.88rem;
      outline: none;
      background: white;
      transition: all 0.25s ease;
      color: #334155;
      font-family: inherit;
      box-sizing: border-box;
      min-width: 160px;
    }

    .date-input:focus {
      border-color: #2D5A27;
      box-shadow: 0 0 0 3px rgba(45, 90, 39, 0.12);
      background: white;
    }

    .date-buttons {
      display: flex;
      gap: 10px;
      align-items: center;
    }

    .btn-apply-dates {
      padding: 10px 20px;
      background: linear-gradient(135deg, #2D5A27 0%, #1A211B 100%); /* Verde Selva */
      color: white;
      border: 1px solid rgba(212, 168, 67, 0.1);
      border-radius: 10px;
      font-weight: 700;
      font-size: 0.85rem;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 2px 6px rgba(45, 90, 39, 0.15);
    }

    .btn-apply-dates:hover {
      background: linear-gradient(135deg, #4E8D46 0%, #2D5A27 100%);
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(78, 141, 70, 0.25);
    }

    .btn-clear-dates {
      padding: 10px 16px;
      background: white;
      color: #8B5A2B; /* Marrón Madera */
      border: 1px solid rgba(139, 90, 43, 0.35);
      border-radius: 10px;
      font-weight: 700;
      font-size: 0.85rem;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .btn-clear-dates:hover {
      background: rgba(139, 90, 43, 0.06);
      border-color: #8B5A2B;
    }

    .filters-and-actions-grid {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      flex-wrap: wrap;
      gap: 18px;
    }

    .filter-group {
      display: flex;
      flex-direction: column;
      gap: 10px;
      flex: 1;
      min-width: 320px;
    }

    .filter-label {
      font-size: 0.82rem;
      font-weight: 700;
      color: #2D5A27; /* Verde Selva */
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }

    .filtros-rapidos {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }

    .filtros-rapidos button {
      padding: 8px 16px;
      border: 1px solid #cbd5e1;
      border-radius: 20px;
      background: white;
      color: #475569;
      cursor: pointer;
      font-size: 0.82rem;
      font-weight: 600;
      transition: all 0.2s ease;
    }

    .filtros-rapidos button:hover {
      background: rgba(78, 141, 70, 0.05);
      color: #2D5A27;
      border-color: #2D5A27;
    }

    .filtros-rapidos button.active {
      background: #2D5A27; /* Verde Selva */
      color: white;
      border-color: #2D5A27;
      box-shadow: 0 2px 6px rgba(45, 90, 39, 0.2);
    }

    .action-buttons {
      display: flex;
      gap: 12px;
    }

    .btn-primary {
      padding: 11px 22px;
      background: linear-gradient(135deg, #2D5A27 0%, #1A211B 100%); /* Verde Selva a Oscuro Premium */
      color: white;
      border: 1px solid rgba(212, 168, 67, 0.2);
      border-radius: 10px;
      font-weight: 700;
      font-size: 0.9rem;
      cursor: pointer;
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 4px 10px rgba(45, 90, 39, 0.15);
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }

    .btn-primary:hover {
      background: linear-gradient(135deg, #4E8D46 0%, #2D5A27 100%); /* Verde Tropical a Verde Selva */
      transform: translateY(-1px);
      box-shadow: 0 6px 14px rgba(78, 141, 70, 0.25);
    }

    .btn-secondary {
      padding: 11px 22px;
      background: #ffffff;
      color: #8B5A2B; /* Marrón Madera */
      border: 1px solid rgba(139, 90, 43, 0.35);
      border-radius: 10px;
      font-weight: 700;
      font-size: 0.9rem;
      cursor: pointer;
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }

    .btn-secondary:hover {
      background: rgba(139, 90, 43, 0.06);
      border-color: #8B5A2B;
    }

    /* TABLE CARD */
    .table-card {
      border-radius: 16px;
      overflow: hidden;
      margin-bottom: 24px;
    }

    .table-header-title {
      padding: 20px 28px;
      border-bottom: 1px solid rgba(45, 90, 39, 0.08);
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: rgba(78, 141, 70, 0.03);
      border-left: 5px solid #D4A843; /* Detalle Dorado Amazónico */
    }

    .table-header-title h3 {
      margin: 0;
      font-size: 1.15rem;
      color: #2D5A27; /* Verde Selva */
      font-weight: 800;
      letter-spacing: -0.01em;
    }

    .results-badge {
      background: rgba(78, 141, 70, 0.1);
      color: #2D5A27;
      border: 1px solid rgba(78, 141, 70, 0.2);
      font-size: 0.75rem;
      font-weight: 700;
      padding: 4px 12px;
      border-radius: 20px;
    }

    .table-container {
      overflow-x: auto;
      width: 100%;
    }

    .reservas-table {
      width: 100%;
      border-collapse: collapse;
    }

    .reservas-table th, .reservas-table td {
      padding: 16px 24px;
      text-align: left;
      font-size: 0.9rem;
      border-bottom: 1px solid rgba(45, 90, 39, 0.06);
      white-space: nowrap;
    }

    .reservas-table th {
      background: rgba(78, 141, 70, 0.02);
      color: #475569;
      font-weight: 800;
      font-size: 0.76rem;
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }

    .table-row {
      transition: background 0.2s ease;
    }

    .table-row:hover {
      background: rgba(78, 141, 70, 0.04); /* Hover Verde Tropical sutil */
    }

    .codigo {
      font-size: 1.05rem;
      font-weight: 800;
      color: #2D5A27; /* Verde Selva */
      font-family: 'Outfit', sans-serif;
    }

    .cliente-cell {
      font-weight: 700;
      color: #1A211B;
    }

    .nombre-texto {
      margin-left: 4px;
    }

    .rol-label {
      color: #64748b;
      font-size: 0.75rem;
      font-weight: 500;
      margin-left: 4px;
    }

    .no-group {
      color: #94a3b8;
    }

    .badge-grupo-tag {
      background: rgba(78, 141, 70, 0.12); /* Verde Tropical */
      color: #4E8D46;
      border: 1px solid rgba(78, 141, 70, 0.25);
      padding: 3px 10px;
      border-radius: 12px;
      font-size: 0.76rem;
      font-weight: 700;
    }

    .fila-grupo {
      background-color: rgba(78, 141, 70, 0.02);
      border-left: 4px solid #8B5A2B; /* Borde Marrón Madera */
    }

    .fila-grupo:hover {
      background-color: rgba(78, 141, 70, 0.05);
    }

    .fila-hija td {
      font-size: 0.86rem;
      background-color: rgba(248, 250, 252, 0.5);
    }

    .indentado {
      padding-left: 38px !important;
    }

    /* BADGES DE ESTADO COMPATIBLES Y BRANDED */
    .status-badge {
      padding: 5px 12px;
      border-radius: 20px;
      font-weight: 700;
      font-size: 0.78rem;
      display: inline-block;
      letter-spacing: 0.01em;
      box-shadow: 0 1px 3px rgba(0,0,0,0.01);
    }

    .badge-grupo-estado {
      background: rgba(78, 141, 70, 0.12) !important;
      color: #4E8D46 !important;
      border: 1px solid rgba(78, 141, 70, 0.25) !important;
    }

    .estado-reservada {
      background: rgba(212, 168, 67, 0.12); /* Dorado Amazónico */
      color: #D4A843;
      border: 1px solid rgba(212, 168, 67, 0.25);
    }

    .estado-hospedado {
      background: rgba(78, 141, 70, 0.12); /* Verde Tropical */
      color: #4E8D46;
      border: 1px solid rgba(78, 141, 70, 0.25);
    }

    .estado-finalizado {
      background: rgba(45, 90, 39, 0.12); /* Verde Selva */
      color: #2D5A27;
      border: 1px solid rgba(45, 90, 39, 0.25);
    }

    .estado-cancelada, .estado-cancelado, .estado-no_show {
      background: rgba(220, 38, 38, 0.12); /* Red */
      color: #dc2626;
      border: 1px solid rgba(220, 38, 38, 0.25);
    }

    .estado-activo {
      background: rgba(78, 141, 70, 0.12); /* Verde Tropical */
      color: #4E8D46;
      border: 1px solid rgba(78, 141, 70, 0.25);
    }

    .precio-total {
      font-size: 1.05rem;
      font-weight: 800;
      color: #8B5A2B; /* Marrón Madera */
      font-family: 'Outfit', sans-serif;
    }

    /* ACCIONES DE CELDA */
    .acciones-cell {
      white-space: nowrap;
    }

    .btn-grupo-acciones {
      display: inline-flex;
      gap: 6px;
      flex-wrap: wrap;
    }

    .btn-grupo-acciones button {
      padding: 6px 12px;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-size: 0.78rem;
      font-weight: 700;
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      white-space: nowrap;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }

    .btn-accion-ver {
      background: rgba(78, 141, 70, 0.08);
      color: #2D5A27; /* Verde Selva */
      border: 1px solid rgba(78, 141, 70, 0.2);
    }

    .btn-accion-ver:hover {
      background: #2D5A27;
      color: #ffffff;
      border-color: #2D5A27;
    }

    .btn-accion-cancelar {
      background: rgba(220, 38, 38, 0.08);
      color: #dc2626;
      border: 1px solid rgba(220, 38, 38, 0.2);
    }

    .btn-accion-cancelar:hover {
      background: #dc2626;
      color: #ffffff;
      border-color: #dc2626;
      box-shadow: 0 4px 8px rgba(220, 38, 38, 0.15);
    }

    .btn-accion-extender {
      background: rgba(139, 90, 43, 0.08);
      color: #8B5A2B; /* Marrón Madera */
      border: 1px solid rgba(139, 90, 43, 0.2);
    }

    .btn-accion-extender:hover {
      background: #8B5A2B;
      color: #ffffff;
      border-color: #8B5A2B;
      box-shadow: 0 4px 8px rgba(139, 90, 43, 0.15);
    }

    .btn-expandir {
      background: transparent;
      color: #2D5A27; /* Verde Selva */
      border: 1px solid rgba(45, 90, 39, 0.25);
    }

    .btn-expandir:hover {
      background: rgba(45, 90, 39, 0.08);
    }

    .empty-state {
      text-align: center;
      padding: 56px;
      color: #64748b;
    }

    .empty-icon {
      font-size: 2.8rem;
      margin-bottom: 14px;
    }

    /* MODAL DE DIÁLOGO PREMIUM */
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(26, 33, 27, 0.45); /* Fondo Oscuro Premium */
      backdrop-filter: blur(5px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .modal-content {
      background: white;
      border-radius: 20px;
      width: 100%;
      max-width: 500px;
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: 0 25px 50px -12px rgba(0,0,0,0.15);
      border: 1px solid rgba(45, 90, 39, 0.12);
      display: flex;
      flex-direction: column;
    }

    .animate-in {
      animation: modalSlideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }

    @keyframes modalSlideUp {
      from { transform: translateY(24px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 28px;
      border-bottom: 1px solid rgba(45, 90, 39, 0.08);
      background: linear-gradient(135deg, #1A211B 0%, #2D5A27 100%); /* Gradiente de marca */
      color: white;
    }

    .modal-header h3 {
      margin: 0;
      font-size: 1.2rem;
      color: #ffffff;
      font-weight: 800;
      text-shadow: 0 1px 2px rgba(0,0,0,0.15);
    }

    .modal-close {
      background: none;
      border: none;
      font-size: 1.5rem;
      cursor: pointer;
      color: rgba(255, 255, 255, 0.8);
      padding: 0;
      line-height: 1;
      transition: color 0.2s ease;
    }

    .modal-close:hover {
      color: #ffffff;
    }

    .modal-body {
      padding: 28px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
      margin-bottom: 12px;
    }

    .form-label {
      font-size: 0.85rem;
      font-weight: 700;
      color: #2D5A27; /* Verde Selva */
      text-transform: uppercase;
      letter-spacing: 0.02em;
    }

    .form-control {
      width: 100%;
      padding: 12px 14px;
      border: 1px solid #cbd5e1;
      border-radius: 10px;
      font-size: 0.92rem;
      font-family: inherit;
      outline: none;
      transition: all 0.25s ease;
      background: #f8fafc;
      box-sizing: border-box;
    }

    .form-control:focus {
      border-color: #2D5A27; /* Verde Selva */
      box-shadow: 0 0 0 3px rgba(45, 90, 39, 0.12);
      background: white;
    }

    .form-control:disabled {
      background: #f1f5f9;
      color: #64748b;
      cursor: not-allowed;
      border-color: #cbd5e1;
    }

    textarea.form-control {
      resize: vertical;
    }

    .help-text {
      display: block;
      margin-top: 6px;
      font-size: 0.78rem;
      color: #8B5A2B; /* Marrón Madera */
      font-weight: 600;
    }

    .modal-footer {
      padding: 20px 28px;
      border-top: 1px solid rgba(45, 90, 39, 0.08);
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      background: #f8fafc;
    }

    .btn-cancel {
      padding: 11px 22px;
      background: white;
      border: 1px solid rgba(139, 90, 43, 0.35); /* Marrón Madera */
      border-radius: 10px;
      color: #8B5A2B;
      font-weight: 700;
      font-size: 0.88rem;
      cursor: pointer;
      transition: all 0.25s ease;
    }

    .btn-cancel:hover {
      background: rgba(139, 90, 43, 0.06);
      border-color: #8B5A2B;
    }

    .btn-save {
      padding: 11px 26px;
      background: linear-gradient(135deg, #2D5A27 0%, #1A211B 100%); /* Verde Selva a Oscuro Premium */
      color: white;
      border: 1px solid rgba(212, 168, 67, 0.2);
      border-radius: 10px;
      font-weight: 700;
      font-size: 0.88rem;
      cursor: pointer;
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 4px 10px rgba(45, 90, 39, 0.15);
    }

    .btn-save:hover:not(:disabled) {
      background: linear-gradient(135deg, #4E8D46 0%, #2D5A27 100%);
      transform: translateY(-1px);
      box-shadow: 0 6px 14px rgba(78, 141, 70, 0.25);
    }

    .btn-save:disabled {
      background: #cbd5e1;
      color: #94a3b8;
      cursor: not-allowed;
      border-color: #cbd5e1;
      box-shadow: none;
    }

    /* PAGINACIÓN PREMIUM CON COLORES DE LA MARCA */
    .paginator-container {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 18px 28px;
      border-top: 1px solid rgba(45, 90, 39, 0.08);
      background: rgba(78, 141, 70, 0.02);
      flex-wrap: wrap;
      gap: 16px;
    }

    .paginator-info {
      font-size: 0.86rem;
      color: #64748b;
    }

    .paginator-controls {
      display: flex;
      align-items: center;
      gap: 24px;
      flex-wrap: wrap;
    }

    .page-size-selector {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.86rem;
      color: #64748b;
    }

    .size-select {
      padding: 5px 10px;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      font-size: 0.86rem;
      outline: none;
      background: white;
      cursor: pointer;
      transition: border-color 0.2s ease;
    }

    .size-select:focus {
      border-color: #2D5A27;
    }

    .pagination-buttons {
      display: flex;
      gap: 6px;
    }

    .pag-btn {
      padding: 7px 14px;
      background: white;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      font-size: 0.84rem;
      font-weight: 700;
      color: #475569;
      cursor: pointer;
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .pag-btn:hover:not(:disabled) {
      background: rgba(78, 141, 70, 0.08);
      border-color: #2D5A27;
      color: #2D5A27;
    }

    .pag-btn:disabled {
      color: #cbd5e1;
      cursor: not-allowed;
      background: #f8fafc;
    }

    .num-btn.active {
      background: #2D5A27; /* Verde Selva */
      color: white;
      border-color: #2D5A27;
      box-shadow: 0 2px 6px rgba(45, 90, 39, 0.25);
    }

    @media (max-width: 992px) {
      .filters-and-actions-grid {
        flex-direction: column;
        align-items: stretch;
      }
      .filter-group {
        min-width: auto;
      }
      .action-buttons {
        flex-direction: column;
      }
      .btn-primary, .btn-secondary {
        justify-content: center;
      }
    }

    @media (max-width: 768px) {
      .page-container {
        padding: 16px;
      }
      .header-section {
        padding: 20px 24px;
      }
      .header-section h2 {
        font-size: 1.5rem;
      }
      .filters-card {
        padding: 16px;
      }
      .filtros-rapidos button {
        padding: 6px 12px;
        font-size: 0.78rem;
      }
      .reservas-table th, .reservas-table td {
        padding: 12px 16px;
        font-size: 0.84rem;
      }
    }
  `]
})
export class PanelReservasComponent implements OnInit {
  reservas: PanelReservaItem[] = [];
  reservasFiltradas: PanelReservaItem[] = [];
  filtro = 'todas';
  terminoBusqueda = '';
  fechaInicio = '';
  fechaFin = '';

  // Paginación
  paginaActual = 1;
  elementosPorPagina = 5;

  modalActivo: ModalType = null;
  modalItem: PanelReservaItem | null = null;
  modalGuardando = false;
  modoFacturacion: 'CONSOLIDADO' | 'INDIVIDUAL' | 'NO_DETERMINADO' | 'CARGANDO' = 'NO_DETERMINADO';

  extendForm: ExtenderReservaRequest = { nuevaFechaSalida: '' };
  cancelForm: CancelarReservaRequest = { motivoCancelacion: '', observaciones: '' };
  cancelFormMotivoSeleccionado = '';
  cancelFormMotivoOtro = '';

  readonly estadosLabel: Record<string, string> = {
    RESERVADA: 'Reservada',
    HOSPEDADO: 'Hospedado',
    FINALIZADO: 'Finalizado',
    CANCELADA: 'Cancelada',
    CANCELADO: 'Cancelado',
    ACTIVO: 'Activo'
  };

  // Getters para Paginación
  get totalPaginas(): number {
    return Math.ceil(this.reservasFiltradas.length / this.elementosPorPagina);
  }

  get reservasPaginadas(): PanelReservaItem[] {
    const inicio = (this.paginaActual - 1) * this.elementosPorPagina;
    const fin = inicio + Number(this.elementosPorPagina);
    return this.reservasFiltradas.slice(inicio, fin);
  }

  getRangoInicio(): number {
    if (this.reservasFiltradas.length === 0) return 0;
    return (this.paginaActual - 1) * this.elementosPorPagina + 1;
  }

  getRangoFin(): number {
    const fin = this.paginaActual * this.elementosPorPagina;
    return fin > this.reservasFiltradas.length ? this.reservasFiltradas.length : fin;
  }

  getPaginasArray(): number[] {
    const total = this.totalPaginas;
    const array: number[] = [];
    for (let i = 1; i <= total; i++) {
      array.push(i);
    }
    return array;
  }

  onPageSizeChange(): void {
    this.paginaActual = 1;
  }

  cambiarPagina(p: number): void {
    if (p < 1 || p > this.totalPaginas) return;
    this.paginaActual = p;
  }

  constructor(
    private service: ReservaService,
    private pagoService: PagoService,
    private excelService: ExcelReportService
  ) { }

  ngOnInit(): void {
    this.loadPanel();
  }

  loadPanel(): void {
    this.service.getPanel().subscribe({
      next: (data) => {
        this.reservas = data.map(r => ({ ...r, expandido: false }));
        this.aplicarFiltros();
      }
    });
  }

  toggleGrupo(item: PanelReservaItem): void {
    item.expandido = !item.expandido;
  }

  abrirDetallesGrupo(item: PanelReservaItem): void {
    this.modalItem = item;
    this.modalActivo = 'detalles_grupo';
    this.modoFacturacion = 'NO_DETERMINADO';

    if (this.estadoLabel(item) === 'Finalizado') {
      this.modoFacturacion = 'CARGANDO';
      this.pagoService.getByGrupo(item.id).subscribe({
        next: (pago) => {
          this.modoFacturacion = pago.modoPago === 'CONSOLIDADO' ? 'CONSOLIDADO' : 'INDIVIDUAL';
        },
        error: () => {
          this.modoFacturacion = 'INDIVIDUAL';
        }
      });
    }
  }

  descargarExcelGrupo(): void {
    if (!this.modalItem) return;
    this.modalGuardando = true;
    this.pagoService.getByGrupo(this.modalItem.id).subscribe({
      next: (pagoReal) => {
        const habitaciones = this.modalItem!.hijas || [];
        const length = habitaciones.length || 1;
        const noches = 1; // Podría calcularse desde la fecha, pero para facturación se asume 1 si no hay detalle exacto de estadía individual en esta vista
        const itemsExcel: ItemExcelReport[] = habitaciones.map(h => {
          return {
            descripcion: `Hospedaje - Hab. ${h.habitacionNumero || 'N/A'}`,
            cantidad: noches,
            precioUnitarioSinIgv: (pagoReal.montoNeto / length) / noches,
            montoNeto: pagoReal.montoNeto / length,
            igv: pagoReal.igv / length,
            total: pagoReal.montoTotal / length
          } as ItemExcelReport;
        });
        this.excelService.generarExcelContador(pagoReal, itemsExcel);
        this.modalGuardando = false;
      },
      error: () => {
        alert('No se pudo encontrar el comprobante de pago para este grupo.');
        this.modalGuardando = false;
      }
    });
  }

  abrirExtender(item: PanelReservaItem): void {
    this.modalItem = item;
    this.modalActivo = 'extender';
    this.extendForm = { nuevaFechaSalida: '' };
  }

  abrirCancelar(item: PanelReservaItem): void {
    this.modalItem = item;
    this.modalActivo = 'cancelar';
    this.cancelForm = { motivoCancelacion: '', observaciones: '' };
    this.cancelFormMotivoSeleccionado = '';
    this.cancelFormMotivoOtro = '';
  }

  get modalTitulo(): string {
    if (!this.modalActivo) return '';
    if (this.modalActivo === 'detalles_grupo') {
      return 'DETALLES DE RESERVA GRUPAL - ' + this.modalItem?.grupoNombre;
    }
    const esGrupo = this.modalItem?.tipo === 'GRUPO';
    const map: Record<string, string> = {
      extender: esGrupo ? 'Extender Grupo' : 'Extender Reserva',
      cancelar: esGrupo ? 'Cancelar Grupo' : 'Cancelar Reserva'
    };
    return map[this.modalActivo];
  }

  get minFechaExtension(): Date | null {
    if (!this.modalItem || !this.modalItem.fechaSalida) return null;
    const fString = this.modalItem.fechaSalida.includes('T') ? this.modalItem.fechaSalida : this.modalItem.fechaSalida + 'T00:00:00';
    const f = new Date(fString);
    f.setDate(f.getDate() + 1);
    return f;
  }

  cerrarModal(): void {
    this.modalActivo = null;
    this.modalItem = null;
    this.modalGuardando = false;
    this.cancelFormMotivoSeleccionado = '';
    this.cancelFormMotivoOtro = '';
  }

  guardarModal(): void {
    if (!this.modalItem) return;
    this.modalGuardando = true;
    const esGrupo = this.modalItem.tipo === 'GRUPO';

    if (this.modalActivo === 'extender') {
      const payload: any = { ...this.extendForm };
      if (payload.nuevaFechaSalida instanceof Date) {
        payload.nuevaFechaSalida = payload.nuevaFechaSalida.toISOString().split('T')[0];
      }

      if (esGrupo) {
        this.service.extenderGrupo(this.modalItem.id, payload as any).subscribe({
          next: () => { this.cerrarModal(); this.loadPanel(); },
          error: () => { this.modalGuardando = false; }
        });
      } else {
        this.service.extender(this.modalItem.id, payload as any).subscribe({
          next: () => { this.cerrarModal(); this.loadPanel(); },
          error: () => { this.modalGuardando = false; }
        });
      }
    } else if (this.modalActivo === 'cancelar') {
      let motivo = this.cancelFormMotivoSeleccionado;
      if (motivo === 'Otro (especificar)') {
        motivo = this.cancelFormMotivoOtro.trim();
      }
      this.cancelForm.motivoCancelacion = motivo;

      if (esGrupo) {
        const userId = localStorage.getItem('userId') || '';
        this.service.cancelarGrupo(this.modalItem.id, this.cancelForm, userId).subscribe({
          next: () => { this.cerrarModal(); this.loadPanel(); },
          error: () => { this.modalGuardando = false; }
        });
      } else {
        this.service.cancelar(this.modalItem.id, this.cancelForm).subscribe({
          next: () => { this.cerrarModal(); this.loadPanel(); },
          error: () => { this.modalGuardando = false; }
        });
      }
    }
  }

  limpiarFechas(): void {
    this.fechaInicio = '';
    this.fechaFin = '';
    this.aplicarFiltros();
  }

  aplicarFiltros(): void {
    let resultado = [...this.reservas];

    if (this.filtro === 'individuales') {
      resultado = resultado.filter(r => r.tipo === 'INDIVIDUAL');
    } else if (this.filtro === 'grupos') {
      resultado = resultado.filter(r => r.tipo === 'GRUPO');
    } else if (this.filtro === 'reservadas') {
      resultado = resultado.filter(r =>
        (r.tipo === 'INDIVIDUAL' && r.estado === 'RESERVADA') ||
        (r.tipo === 'GRUPO' && (r.estado === 'RESERVADA' || r.hijas?.some(h => h.estado === 'RESERVADA')))
      );
    } else if (this.filtro === 'hospedados') {
      resultado = resultado.filter(r =>
        (r.tipo === 'INDIVIDUAL' && r.estado === 'HOSPEDADO') ||
        (r.tipo === 'GRUPO' && (r.estado === 'ACTIVO' || r.hijas?.some(h => h.estado === 'HOSPEDADO')))
      );
    } else if (this.filtro === 'finalizadas') {
      resultado = resultado.filter(r =>
        (r.tipo === 'INDIVIDUAL' && r.estado === 'FINALIZADO') ||
        (r.tipo === 'GRUPO' && r.estado === 'FINALIZADO')
      );
    } else if (this.filtro === 'canceladas') {
      resultado = resultado.filter(r =>
        (r.tipo === 'INDIVIDUAL' && (r.estado === 'CANCELADA' || r.estado === 'CANCELADO')) ||
        (r.tipo === 'GRUPO' && (r.estado === 'CANCELADO' || r.estado === 'CANCELADA'))
      );
    }

    if (this.terminoBusqueda) {
      const term = this.terminoBusqueda.toLowerCase();
      resultado = resultado.filter(item => {
        if (item.tipo === 'GRUPO') {
          const match = item.codigo?.toLowerCase().includes(term) ||
            item.cliente?.toLowerCase().includes(term) ||
            item.grupoNombre?.toLowerCase().includes(term) ||
            item.hijas?.some(h =>
              h.codigo?.toLowerCase().includes(term) ||
              h.cliente?.toLowerCase().includes(term)
            );
          if (match) item.expandido = true;
          return match;
        }
        return item.codigo?.toLowerCase().includes(term) ||
          item.cliente?.toLowerCase().includes(term) ||
          item.grupoNombre?.toLowerCase().includes(term);
      });
    }

    // Filtrar por Rango de Fechas
    if (this.fechaInicio) {
      const inicio = new Date(this.fechaInicio + 'T00:00:00');
      resultado = resultado.filter(r => {
        const fString = r.fechaIngreso.includes('T') ? r.fechaIngreso : r.fechaIngreso + 'T00:00:00';
        const f = new Date(fString);
        f.setHours(0, 0, 0, 0);
        return f >= inicio;
      });
    }

    if (this.fechaFin) {
      const fin = new Date(this.fechaFin + 'T00:00:00');
      resultado = resultado.filter(r => {
        const fString = r.fechaSalida.includes('T') ? r.fechaSalida : r.fechaSalida + 'T00:00:00';
        const f = new Date(fString);
        f.setHours(0, 0, 0, 0);
        return f <= fin;
      });
    }

    this.reservasFiltradas = resultado;
    this.paginaActual = 1;
  }

  estadoLabel(item: any): string {
    let estadoReal = item.estado;
    if (item.tipo === 'GRUPO' && estadoReal === 'ACTIVO') {
      if (item.hijas?.some((h: any) => h.estado === 'HOSPEDADO')) estadoReal = 'HOSPEDADO';
      else if (item.hijas?.some((h: any) => h.estado === 'RESERVADA')) estadoReal = 'RESERVADA';
    }
    return this.estadosLabel[estadoReal] ?? estadoReal;
  }

  badgeClass(item: any): string {
    let estadoReal = item.estado;
    if (item.tipo === 'GRUPO' && estadoReal === 'ACTIVO') {
      if (item.hijas?.some((h: any) => h.estado === 'HOSPEDADO')) estadoReal = 'HOSPEDADO';
      else if (item.hijas?.some((h: any) => h.estado === 'RESERVADA')) estadoReal = 'RESERVADA';
    }
    return 'estado-' + estadoReal.toLowerCase().replace(/ /g, '_');
  }
}
