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
    <div class="page-container fade-in">
      <!-- CABECERA DE LA PÁGINA (ESTILO BANNER PREMIUM DE MARCA) -->
      <div class="header-section">
        <div class="title-area">
          <h2><i class="header-icon-premium bi bi-calendar-check-fill"></i> Gestión de Reservas</h2>
          <p class="subtitle">Gestione el historial, los ingresos and las políticas de reservas individuales o grupales</p>
        </div>
      </div>

      <!-- ACCIONES Y FILTROS GLASSMORPHIC -->
      <div class="filters-card glass-panel">
        <div class="filter-row">
          <div class="filter-group">
            <label class="filter-label"><i class="bi bi-funnel-fill text-verde-selva mr-1"></i> Filtrar por Estado</label>
            <select (change)="filtrarEstado($any($event.target).value)" class="filter-select">
              <option value="">Todas las reservas</option>
              <option value="pendiente">Pendiente</option>
              <option value="checked_in">Hospedado</option>
              <option value="no_show">Cancelada</option>
              <option value="cancelada">Cancelada</option>
            </select>
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
          <h3><i class="bi bi-journal-text text-verde-selva mr-1"></i> Historial de Reservas</h3>
          <span class="results-badge">{{ reservasFiltradas.length }} reservas registradas</span>
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
                <th>Total</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let r of reservasPaginadas" class="table-row">
                <td class="codigo">{{ r.codigo }}</td>
                <td class="cliente-name">{{ r.clienteNombre }}</td>
                <td>{{ r.fechaIngreso | date:'dd/MM/yyyy' }}</td>
                <td>{{ r.fechaSalida | date:'dd/MM/yyyy' }}</td>
                <td>
                  <span *ngIf="r.nombreGrupo" class="badge badge-grupo" [routerLink]="['/reservas', r.id]">
                    <i class="bi bi-people-fill mr-1"></i> {{ r.nombreGrupo }}
                  </span>
                  <span *ngIf="!r.nombreGrupo" class="no-group">—</span>
                </td>
                <td>
                  <span class="status-badge" [class]="getEstadoClass(r.estado)">
                    {{ estadoLabel(r.estado) }}
                  </span>
                </td>
                <td class="precio-total">S/ {{ r.precioTotal | number:'1.2-2' }}</td>
                <td class="actions-cell">
                  <button class="btn-sm btn-ver" [routerLink]="['/reservas', r.id]">
                    <i class="bi bi-eye"></i> Ver
                  </button>
                  <button class="btn-sm btn-ingreso" [routerLink]="['/registrar-ingreso']" *ngIf="r.estado === 'pendiente'">
                    <i class="bi bi-key-fill"></i> Ingreso
                  </button>
                  <button class="btn-sm btn-cancel" (click)="abrirCancelacion(r)" *ngIf="auth.esGerente() && r.estado === 'pendiente'">
                    <i class="bi bi-x-circle"></i> Cancelar
                  </button>
                </td>
              </tr>
              <tr *ngIf="reservasFiltradas.length === 0">
                <td colspan="8" class="empty-state">
                  <div class="empty-icon"><i class="bi bi-calendar-x text-slate-400"></i></div>
                  <p>No se encontraron reservas registradas para este filtro.</p>
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

      <!-- MODAL DE CANCELACIÓN BOUTIQUE RESORT -->
      <div class="modal-overlay" *ngIf="cancelandoReserva" (click)="cerrarCancelacion()">
        <div class="modal animate-in" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>Cancelar Reserva #{{ cancelandoReserva.codigo }}</h3>
            <button class="modal-close" (click)="cerrarCancelacion()">&times;</button>
          </div>
          <div class="modal-body">
            <p><strong>Huésped:</strong> {{ cancelandoReserva.clienteNombre }}</p>
            <p><strong>Fechas:</strong> {{ cancelandoReserva.fechaIngreso | date:'dd/MM/yyyy' }} - {{ cancelandoReserva.fechaSalida | date:'dd/MM/yyyy' }}</p>
            
            <div class="alert alert-warning">
              <i class="bi bi-exclamation-triangle-fill text-amber-500 mr-2"></i> Al cancelar, la habitación asignada quedará disponible inmediatamente en el inventario.
            </div>
            
            <div class="form-group">
              <label class="form-label">Motivo de cancelación *</label>
              <select [(ngModel)]="cancelacionMotivo" class="form-control">
                <option value="">Seleccione un motivo...</option>
                <option value="Cliente anula por cambio de planes">Cliente anula por cambio de planes</option>
                <option value="Cliente anula sin motivo específico">Cliente anula sin motivo específico</option>
                <option value="Emergencia (salud/familia)">Emergencia (salud/familia)</option>
                <option value="Problemas con el pago / tarjeta">Problemas con el pago / tarjeta</option>
                <option value="Inasistencia">No se presentó</option>
                <option value="Problemas con la habitación">Problemas con la habitación</option>
                <option value="Otro (especificar)">Otro (especificar)</option>
              </select>
              <input *ngIf="cancelacionMotivo === 'Otro (especificar)'" type="text" [(ngModel)]="cancelacionMotivoOtro" placeholder="Especifique el motivo de la cancelación..." class="form-control mt-2">
            </div>
            
            <div class="form-group">
              <label class="form-label">Observaciones adicionales</label>
              <textarea 
                [(ngModel)]="cancelacionObservaciones" 
                class="form-control" 
                rows="3" 
                placeholder="Detalle el motivo del desestimiento..."
              ></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-secondary" (click)="cerrarCancelacion()">Volver</button>
            <button class="btn-danger" (click)="confirmarCancelacion()" [disabled]="!cancelacionMotivo || (cancelacionMotivo === 'Otro (especificar)' && !cancelacionMotivoOtro.trim())">
              Confirmar Cancelación
            </button>
          </div>
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

    /* FILTROS CARD Y ACCIONES */
    .filters-card {
      border-radius: 16px;
      padding: 20px 24px;
      margin-bottom: 24px;
    }

    .filter-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      flex-wrap: wrap;
      gap: 16px;
    }

    .filter-group {
      display: flex;
      flex-direction: column;
      gap: 8px;
      min-width: 250px;
    }

    .filter-label {
      font-size: 0.82rem;
      font-weight: 700;
      color: #2D5A27; /* Verde Selva */
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }

    .filter-select {
      padding: 11px 14px;
      border: 1px solid #cbd5e1;
      border-radius: 10px;
      font-size: 0.9rem;
      font-family: inherit;
      outline: none;
      background: white;
      cursor: pointer;
      transition: all 0.25s ease;
    }

    .filter-select:focus {
      border-color: #2D5A27; /* Verde Selva */
      box-shadow: 0 0 0 3px rgba(45, 90, 39, 0.1);
    }

    .action-buttons {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
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

    .table {
      width: 100%;
      border-collapse: collapse;
    }

    .table th, .table td {
      padding: 16px 24px;
      text-align: left;
      font-size: 0.9rem;
      border-bottom: 1px solid rgba(45, 90, 39, 0.06);
      white-space: nowrap;
    }

    .table th {
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

    .cliente-name {
      font-weight: 700;
      color: #1A211B;
    }

    .no-group {
      color: #94a3b8;
    }

    .badge {
      padding: 4px 10px;
      border-radius: 12px;
      font-size: 0.76rem;
      font-weight: 700;
      display: inline-block;
    }

    .badge-grupo {
      background: rgba(78, 141, 70, 0.12); /* Verde Tropical */
      color: #4E8D46;
      border: 1px solid rgba(78, 141, 70, 0.25);
      cursor: pointer;
      text-decoration: none;
      transition: all 0.2s ease;
    }

    .badge-grupo:hover {
      background: #4E8D46;
      color: white;
      box-shadow: 0 2px 6px rgba(78, 141, 70, 0.2);
    }

    /* BADGES DE ESTADO COMPATIBLES */
    .status-badge {
      padding: 5px 12px;
      border-radius: 20px;
      font-weight: 700;
      font-size: 0.78rem;
      display: inline-block;
      letter-spacing: 0.01em;
    }

    .estado-pendiente {
      background: rgba(212, 168, 67, 0.12); /* Dorado Amazónico */
      color: #D4A843;
      border: 1px solid rgba(212, 168, 67, 0.25);
    }

    .estado-checked_in {
      background: rgba(78, 141, 70, 0.12); /* Verde Tropical */
      color: #4E8D46;
      border: 1px solid rgba(78, 141, 70, 0.25);
    }

    .estado-no_show {
      background: rgba(100, 116, 139, 0.12); /* Slate */
      color: #64748b;
      border: 1px solid rgba(100, 116, 139, 0.25);
    }

    .estado-cancelada {
      background: rgba(220, 38, 38, 0.12); /* Red */
      color: #dc2626;
      border: 1px solid rgba(220, 38, 38, 0.25);
    }

    .precio-total {
      font-size: 1.05rem;
      font-weight: 800;
      color: #8B5A2B; /* Marrón Madera */
      font-family: 'Outfit', sans-serif;
    }

    /* ACCIONES CELDA */
    .actions-cell {
      display: flex;
      gap: 6px;
    }

    .btn-sm {
      padding: 6px 12px;
      background: rgba(78, 141, 70, 0.08);
      color: #2D5A27; /* Verde Selva */
      border: 1px solid rgba(78, 141, 70, 0.2);
      border-radius: 8px;
      cursor: pointer;
      font-size: 0.78rem;
      font-weight: 700;
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }

    .btn-sm:hover {
      background: #2D5A27;
      color: #ffffff;
      border-color: #2D5A27;
      box-shadow: 0 4px 8px rgba(45, 90, 39, 0.18);
    }

    .btn-sm.btn-cancel {
      background: rgba(220, 38, 38, 0.08);
      color: #dc2626;
      border-color: rgba(220, 38, 38, 0.2);
    }

    .btn-sm.btn-cancel:hover {
      background: #dc2626;
      color: #ffffff;
      border-color: #dc2626;
      box-shadow: 0 4px 8px rgba(220, 38, 38, 0.18);
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

    /* MODAL DE CANCELACIÓN PREMIUM BOUTIQUE */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(26, 33, 27, 0.45); /* Fondo Oscuro Premium */
      backdrop-filter: blur(5px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .modal {
      background: white;
      border-radius: 20px;
      width: 100%;
      max-width: 500px;
      box-shadow: 0 25px 50px -12px rgba(0,0,0,0.15);
      border: 1px solid rgba(45, 90, 39, 0.12);
      overflow: hidden;
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
      padding: 20px 28px;
      border-bottom: 1px solid rgba(45, 90, 39, 0.08);
      display: flex;
      justify-content: space-between;
      align-items: center;
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

    .modal-body p {
      margin: 4px 0;
      font-size: 0.9rem;
      color: #334155;
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

    textarea.form-control {
      resize: vertical;
    }

    .alert {
      padding: 12px 16px;
      border-radius: 8px;
      font-size: 0.82rem;
      margin: 12px 0;
      font-weight: 600;
      line-height: 1.4;
    }

    .alert-warning {
      background: rgba(212, 168, 67, 0.12);
      color: #D4A843;
      border: 1px solid rgba(212, 168, 67, 0.25);
    }

    .modal-footer {
      padding: 20px 28px;
      border-top: 1px solid rgba(45, 90, 39, 0.08);
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      background: #f8fafc;
    }

    .btn-danger {
      padding: 11px 26px;
      background: linear-gradient(135deg, #dc2626, #b91c1c); /* Rojo de marca */
      color: white;
      border: none;
      border-radius: 10px;
      font-weight: 700;
      font-size: 0.88rem;
      cursor: pointer;
      transition: all 0.25s ease;
      box-shadow: 0 4px 10px rgba(220, 38, 38, 0.15);
    }

    .btn-danger:hover:not(:disabled) {
      background: #b91c1c;
      transform: translateY(-1px);
      box-shadow: 0 6px 14px rgba(220, 38, 38, 0.25);
    }

    .btn-danger:disabled {
      background: #cbd5e1;
      color: #94a3b8;
      cursor: not-allowed;
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
      .filter-row {
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
      .table th, .table td {
        padding: 12px 16px;
        font-size: 0.84rem;
      }
    }
  `]
})
export class ReservaListComponent implements OnInit {
  reservas: ReservaResponse[] = [];
  reservasFiltradas: ReservaResponse[] = [];
  filtroEstado = '';

  // Paginación
  paginaActual = 1;
  elementosPorPagina = 5;

  readonly estadosLabel: Record<string, string> = {
    pendiente: 'Pendiente',
    checked_in: 'Hospedado',
    no_show: 'Cancelada',
    cancelada: 'Cancelada'
  };

  estadoLabel(estado: string): string {
    return this.estadosLabel[estado] ?? estado;
  }

  cancelandoReserva: ReservaResponse | null = null;
  cancelacionMotivo = '';
  cancelacionMotivoOtro = '';
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

  // Getters para Paginación
  get totalPaginas(): number {
    return Math.ceil(this.reservasFiltradas.length / this.elementosPorPagina);
  }

  get reservasPaginadas(): ReservaResponse[] {
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

  private aplicarFiltro(): void {
    this.reservasFiltradas = this.filtroEstado
      ? this.reservas.filter(r => r.estado === this.filtroEstado)
      : this.reservas;
    this.paginaActual = 1;
  }

  abrirCancelacion(r: ReservaResponse): void {
    this.cancelandoReserva = r;
    this.cancelacionMotivo = '';
    this.cancelacionObservaciones = '';
  }

  cerrarCancelacion(): void {
    this.cancelandoReserva = null;
    this.cancelacionMotivo = '';
    this.cancelacionMotivoOtro = '';
    this.cancelacionObservaciones = '';
  }

  confirmarCancelacion(): void {
    if (!this.cancelandoReserva || !this.cancelacionMotivo) return;
    let motivo = this.cancelacionMotivo;
    if (motivo === 'Otro (especificar)') {
      motivo = this.cancelacionMotivoOtro.trim();
    }
    const request: CancelarReservaRequest = {
      motivoCancelacion: motivo,
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
