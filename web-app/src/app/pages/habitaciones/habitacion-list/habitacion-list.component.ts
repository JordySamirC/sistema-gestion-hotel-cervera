import { Component, OnInit } from '@angular/core';
import { NgFor, NgIf, CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HabitacionService } from '../../../core/services/habitacion.service';
import { AuthService } from '../../../core/services/auth.service';
import { HabitacionResponse, HabitacionRequest, TipoHabitacionResponse } from '../../../core/models/habitacion';

@Component({
  selector: 'app-habitacion-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-container fade-in">
      <!-- CABECERA DE LA PÁGINA (ESTILO BANNER PREMIUM DE MARCA) -->
      <div class="header-section">
        <div class="title-area">
          <h2><i class="header-icon-premium bi bi-door-open-fill"></i> Gestión de Habitaciones</h2>
          <p class="subtitle">Administre la configuración, el estado operativo y el mantenimiento de las habitaciones</p>
        </div>
      </div>

      <!-- BARRA DE BÚSQUEDA Y FILTROS GLASSMORPHIC -->
      <div class="filters-card glass-panel">
        <div class="search-row">
          <div class="search-box">
            <span class="search-icon"><i class="bi bi-search text-slate-400"></i></span>
            <input 
              type="text" 
              [(ngModel)]="queryBusqueda" 
              (ngModelChange)="aplicarFiltros()"
              placeholder="Buscar por número de habitación..." 
            />
            <button *ngIf="queryBusqueda" class="clear-btn" (click)="clearSearch()"><i class="bi bi-x-lg"></i></button>
          </div>
        </div>

        <div class="filters-grid">
          <div class="filter-group">
            <label class="filter-label"><i class="bi bi-building mr-1"></i> Piso</label>
            <select [(ngModel)]="filtroPiso" (ngModelChange)="aplicarFiltros()" class="filter-select">
              <option value="">Todos los pisos</option>
              <option [value]="2">Piso 2</option>
              <option [value]="3">Piso 3</option>
            </select>
          </div>

          <div class="filter-group">
            <label class="filter-label"><i class="bi bi-info-circle mr-1"></i> Estado</label>
            <select [(ngModel)]="filtroEstado" (ngModelChange)="aplicarFiltros()" class="filter-select">
              <option value="">Todos los estados</option>
              <option value="Disponible">● Disponible</option>
              <option value="Ocupada">● Ocupada</option>
              <option value="Por limpiar">● Por limpiar</option>
              <option value="En limpieza">● En limpieza</option>
              <option value="Mantenimiento">● Mantenimiento</option>
              <option value="Remodelación">● Remodelación</option>
              <option value="Inhabitable">● Inhabitable</option>
            </select>
          </div>

          <div class="filter-group">
            <label class="filter-label"><i class="bi bi-house mr-1"></i> Tipo</label>
            <select [(ngModel)]="filtroTipo" (ngModelChange)="aplicarFiltros()" class="filter-select">
              <option value="">Todos los tipos</option>
              <option *ngFor="let t of tipos" [value]="t.nombre">{{ t.nombre }}</option>
            </select>
          </div>

          <div class="filter-buttons">
            <button class="btn-filtrar" (click)="aplicarFiltros()">
              <i class="bi bi-search"></i> Filtrar
            </button>
            <button class="btn-limpiar" (click)="limpiarFiltros()">
              <i class="bi bi-trash"></i> Limpiar
            </button>
          </div>
        </div>
      </div>

      <!-- LISTADO DE HABITACIONES EN TARJETA PREMIUM -->
      <div class="table-card glass-panel">
        <div class="table-header-title">
          <h3><i class="bi bi-list-task text-dorado-amazonico mr-1"></i> Listado de Habitaciones</h3>
          <span class="results-badge">{{ habitacionesFiltradas.length }} habitaciones encontradas</span>
        </div>

        <div class="table-container">
          <table class="table">
            <thead>
              <tr>
                <th>Número</th>
                <th>Tipo</th>
                <th>Capacidad</th>
                <th>Piso</th>
                <th>Estado Actual</th>
                <th *ngIf="auth.esGerente()">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let h of habitacionesPaginadas" class="table-row">
                <td class="room-number">{{ h.numero }}</td>
                <td class="room-type-cell">
                  <span class="type-tag">{{ h.tipoNombre }}</span>
                </td>
                <td class="capacity-cell">
                  <span class="capacity-badge"><i class="bi bi-people-fill mr-1"></i> {{ h.capacidadMax }} pers.</span>
                </td>
                <td class="floor-cell">Piso {{ h.piso }}</td>
                <td>
                  <span class="status-badge" [class]="getEstadoClass(h.estadoActual)">
                    <i [class]="getEstadoIconClass(h.estadoActual)"></i> {{ h.estadoActual }}
                  </span>
                </td>
                <td *ngIf="auth.esGerente()">
                  <button class="btn-edit" (click)="abrirEditar(h)">
                    <i class="bi bi-pencil-square mr-1"></i> Editar
                  </button>
                </td>
              </tr>
              <tr *ngIf="habitacionesFiltradas.length === 0">
                <td colspan="6" class="empty-state">
                  <div class="empty-icon"><i class="bi bi-door-closed text-slate-300"></i></div>
                  <p>No se encontraron habitaciones con los criterios seleccionados.</p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- PAGINACIÓN PREMIUM CON CONTROLES DE MARCA -->
        <div class="paginator-container" *ngIf="habitacionesFiltradas.length > 0">
          <div class="paginator-info">
            Mostrando <b>{{ getRangoInicio() }} - {{ getRangoFin() }}</b> de <b>{{ habitacionesFiltradas.length }}</b> habitaciones
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
                <i class="bi bi-chevron-left"></i> Ant
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
                Sig <i class="bi bi-chevron-right"></i>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- MODAL DE EDICIÓN - SOLO GERENTE (ALINEACIÓN CROMÁTICA LUXURY) -->
      <div class="modal-backdrop" *ngIf="mostrarModal">
        <div class="modal-content animate-in">
          <div class="modal-header">
            <h3><i class="bi bi-pencil-square mr-1 text-dorado-amazonico"></i> Editar Habitación - {{ habitacionSeleccionada?.numero }}</h3>
            <button class="close-btn" (click)="cerrarModal()">✕</button>
          </div>
          
          <form (ngSubmit)="guardarCambios()" class="modal-form">
            <div class="modal-body">
              
              <!-- NÚMERO -->
              <div class="form-group">
                <label class="form-label"><i class="bi bi-hash mr-1"></i> Número *</label>
                <input 
                  type="text" 
                  [(ngModel)]="requestForm.numero" 
                  name="numero" 
                  required 
                  maxlength="10" 
                  class="form-control"
                  placeholder="Ej: 201"
                />
              </div>

              <!-- PISO -->
              <div class="form-group">
                <label class="form-label"><i class="bi bi-building mr-1"></i> Piso *</label>
                <select [(ngModel)]="requestForm.piso" name="piso" required class="form-select">
                  <option [value]="2">Piso 2</option>
                  <option [value]="3">Piso 3</option>
                </select>
              </div>

              <!-- TIPO -->
              <div class="form-group">
                <label class="form-label"><i class="bi bi-house mr-1"></i> Tipo *</label>
                <select [(ngModel)]="requestForm.tipoId" name="tipoId" required class="form-select">
                  <option *ngFor="let t of tipos" [value]="t.id">
                    {{ t.nombre }} ({{ t.capacidadMax }} personas)
                  </option>
                </select>
              </div>

              <!-- ESTADO -->
              <div class="form-group">
                <label class="form-label"><i class="bi bi-info-circle mr-1"></i> Estado (Solo para cambios del gerente)</label>
                <select [(ngModel)]="requestForm.estado" name="estado" required class="form-select">
                  <!-- Si el estado actual es operativo, se muestra inactivo -->
                  <option 
                    *ngIf="esEstadoOperativo(habitacionSeleccionada!.estadoActual)" 
                    [value]="habitacionSeleccionada!.estadoActual" 
                    disabled>
                    ● {{ habitacionSeleccionada!.estadoActual }} (En Operación)
                  </option>
                  <option value="Disponible">● Disponible</option>
                  <option value="Mantenimiento">● Mantenimiento</option>
                  <option value="Remodelación">● Remodelación</option>
                  <option value="Inhabitable">● Inhabitable</option>
                </select>
                <p class="form-help">
                  Los estados operativos (Ocupada, Por limpiar, En limpieza) se gestionan automáticamente a través de los flujos de recepción y limpieza.
                </p>
              </div>

              <!-- NOTAS -->
              <div class="form-group">
                <label class="form-label"><i class="bi bi-journal-text mr-1"></i> Notas (opcional)</label>
                <textarea 
                  [(ngModel)]="requestForm.notas" 
                  name="notas" 
                  rows="3" 
                  class="form-textarea"
                  placeholder="Detalles sobre averías, equipamiento extra, observaciones..."
                ></textarea>
              </div>

            </div>

            <div class="modal-footer">
              <button type="button" class="btn-cancel" (click)="cerrarModal()">Cancelar</button>
              <button type="submit" class="btn-save" [disabled]="guardando">
                <i class="bi" [class.bi-hourglass-split]="guardando" [class.bi-check-lg]="!guardando"></i>
                {{ guardando ? ' Guardando...' : ' Actualizar' }}
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

    /* FILTROS CARD */
    .filters-card {
      border-radius: 16px;
      padding: 24px;
      margin-bottom: 24px;
      display: flex;
      flex-direction: column;
      gap: 18px;
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
      border-color: #2D5A27; /* Verde Selva Principal */
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
      transition: color 0.2s ease;
    }

    .clear-btn:hover {
      color: #64748b;
    }

    .filters-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 18px;
      align-items: flex-end;
    }

    .filter-group {
      display: flex;
      flex-direction: column;
      gap: 8px;
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

    .filter-buttons {
      display: flex;
      gap: 10px;
    }

    .btn-filtrar {
      flex: 1.3;
      padding: 11px 18px;
      background: linear-gradient(135deg, #2D5A27 0%, #1A211B 100%); /* Verde Selva a Oscuro Premium */
      color: white;
      border: 1px solid rgba(212, 168, 67, 0.2);
      border-radius: 10px;
      font-weight: 700;
      font-size: 0.9rem;
      cursor: pointer;
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 4px 10px rgba(45, 90, 39, 0.15);
    }

    .btn-filtrar:hover {
      background: linear-gradient(135deg, #4E8D46 0%, #2D5A27 100%); /* Verde Tropical a Verde Selva */
      transform: translateY(-1px);
      box-shadow: 0 6px 14px rgba(78, 141, 70, 0.25);
    }

    .btn-limpiar {
      flex: 0.9;
      padding: 11px 16px;
      background: #ffffff;
      color: #8B5A2B; /* Marrón Madera */
      border: 1px solid rgba(139, 90, 43, 0.35);
      border-radius: 10px;
      font-weight: 700;
      font-size: 0.9rem;
      cursor: pointer;
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .btn-limpiar:hover {
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
      padding: 16px 28px;
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

    .room-number {
      font-size: 1.25rem;
      font-weight: 800;
      color: #2D5A27; /* Verde Selva */
      font-family: 'Outfit', sans-serif;
    }

    .room-type-cell {
      font-weight: 700;
      color: #1A211B;
    }

    .type-tag {
      background: rgba(45, 90, 39, 0.06);
      color: #2D5A27;
      border: 1px solid rgba(45, 90, 39, 0.12);
      padding: 3px 10px;
      border-radius: 6px;
      font-size: 0.8rem;
      font-weight: 600;
    }

    .capacity-badge {
      background: rgba(139, 90, 43, 0.08); /* Marrón Madera */
      color: #8B5A2B;
      padding: 3px 10px;
      border-radius: 12px;
      font-size: 0.8rem;
      font-weight: 700;
      border: 1px solid rgba(139, 90, 43, 0.15);
    }

    .floor-cell {
      font-weight: 600;
      color: #475569;
    }

    /* BADGES DE ESTADO (BRAND ALIGNED) */
    .status-badge {
      padding: 5px 12px;
      border-radius: 20px;
      font-weight: 700;
      font-size: 0.78rem;
      display: inline-block;
      letter-spacing: 0.01em;
      box-shadow: 0 1px 3px rgba(0,0,0,0.02);
    }

    .status-disponible {
      background: rgba(78, 141, 70, 0.12); /* Verde Tropical Secundario */
      color: #4E8D46;
      border: 1px solid rgba(78, 141, 70, 0.25);
    }

    .status-ocupada {
      background: rgba(139, 90, 43, 0.12); /* Marrón Madera */
      color: #8B5A2B;
      border: 1px solid rgba(139, 90, 43, 0.25);
    }

    .status-por-limpiar {
      background: rgba(212, 168, 67, 0.12); /* Dorado Amazónico */
      color: #D4A843;
      border: 1px solid rgba(212, 168, 67, 0.25);
    }

    .status-en-limpieza {
      background: rgba(45, 90, 39, 0.12); /* Verde Selva Principal */
      color: #2D5A27;
      border: 1px solid rgba(45, 90, 39, 0.25);
    }

    .status-mantenimiento {
      background: rgba(100, 116, 139, 0.12); /* Slate */
      color: #64748b;
      border: 1px solid rgba(100, 116, 139, 0.25);
    }

    .status-remodelacion {
      background: rgba(217, 119, 6, 0.12); /* Orange */
      color: #d97706;
      border: 1px solid rgba(217, 119, 6, 0.25);
    }

    .status-inhabitable {
      background: rgba(220, 38, 38, 0.12); /* Red */
      color: #dc2626;
      border: 1px solid rgba(220, 38, 38, 0.25);
    }

    .btn-edit {
      padding: 7px 14px;
      background: rgba(78, 141, 70, 0.08);
      color: #2D5A27; /* Verde Selva */
      border: 1px solid rgba(78, 141, 70, 0.2);
      border-radius: 8px;
      cursor: pointer;
      font-size: 0.8rem;
      font-weight: 700;
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .btn-edit:hover {
      background: #2D5A27;
      color: #ffffff;
      border-color: #2D5A27;
      transform: translateY(-1px);
      box-shadow: 0 4px 10px rgba(45, 90, 39, 0.18);
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

    /* MODAL DE EDICIÓN BOUTIQUE HOTEL */
    .modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(26, 33, 27, 0.45); /* Fondo Oscuro Premium de sombra */
      backdrop-filter: blur(5px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 16px;
    }

    .modal-content {
      background: white;
      border-radius: 20px;
      width: 100%;
      max-width: 520px;
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

    .close-btn {
      background: none;
      border: none;
      color: rgba(255, 255, 255, 0.8);
      font-size: 1.25rem;
      cursor: pointer;
      padding: 4px;
      transition: color 0.2s ease;
    }

    .close-btn:hover {
      color: #ffffff;
    }

    .modal-body {
      padding: 28px;
      display: flex;
      flex-direction: column;
      gap: 18px;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .form-label {
      font-size: 0.85rem;
      font-weight: 700;
      color: #2D5A27; /* Verde Selva */
      text-transform: uppercase;
      letter-spacing: 0.02em;
    }

    .form-control, .form-select, .form-textarea {
      padding: 12px 14px;
      border: 1px solid #cbd5e1;
      border-radius: 10px;
      font-size: 0.92rem;
      font-family: inherit;
      outline: none;
      transition: all 0.25s ease;
      background: #f8fafc;
    }

    .form-control:focus, .form-select:focus, .form-textarea:focus {
      border-color: #2D5A27; /* Verde Selva */
      box-shadow: 0 0 0 3px rgba(45, 90, 39, 0.12);
      background: white;
    }

    .form-help {
      margin: 4px 0 0;
      color: #64748b;
      font-size: 0.76rem;
      line-height: 1.4;
    }

    .form-textarea {
      resize: vertical;
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
      .filters-grid {
        grid-template-columns: 1fr;
      }
      .table th, .table td {
        padding: 12px 16px;
        font-size: 0.84rem;
      }
      .paginator-container {
        padding: 14px 16px;
        flex-direction: column;
        align-items: flex-start;
      }
    }
  `]
})
export class HabitacionListComponent implements OnInit {
  habitaciones: HabitacionResponse[] = [];
  habitacionesFiltradas: HabitacionResponse[] = [];
  tipos: TipoHabitacionResponse[] = [];

  // Filtros
  queryBusqueda = '';
  filtroPiso = '';
  filtroEstado = '';
  filtroTipo = '';

  // Paginación
  paginaActual = 1;
  elementosPorPagina = 5;

  // Modal de Edición
  mostrarModal = false;
  habitacionSeleccionada: HabitacionResponse | null = null;
  requestForm: HabitacionRequest = { numero: '', piso: 2, tipoId: '', estado: '', notas: '' };
  guardando = false;

  constructor(
    private habitacionService: HabitacionService,
    public auth: AuthService
  ) {}

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.habitacionService.getAll().subscribe({
      next: (data) => {
        this.habitaciones = data;
        this.aplicarFiltros();
      },
      error: () => alert('Error al cargar las habitaciones')
    });

    this.habitacionService.getTiposHabitacion().subscribe({
      next: (data) => this.tipos = data,
      error: () => alert('Error al cargar los tipos de habitación')
    });
  }

  aplicarFiltros(): void {
    let filtradas = [...this.habitaciones];

    // 1. Filtro por búsqueda de número
    if (this.queryBusqueda && this.queryBusqueda.trim()) {
      const q = this.queryBusqueda.toLowerCase().trim();
      filtradas = filtradas.filter(h => h.numero.toLowerCase().includes(q));
    }

    // 2. Filtro por piso
    if (this.filtroPiso) {
      const pisoNum = Number(this.filtroPiso);
      filtradas = filtradas.filter(h => h.piso === pisoNum);
    }

    // 3. Filtro por estado
    if (this.filtroEstado) {
      filtradas = filtradas.filter(h => h.estadoActual.toLowerCase() === this.filtroEstado.toLowerCase());
    }

    // 4. Filtro por tipo
    if (this.filtroTipo) {
      filtradas = filtradas.filter(h => h.tipoNombre.toLowerCase() === this.filtroTipo.toLowerCase());
    }

    this.habitacionesFiltradas = filtradas;
    this.paginaActual = 1; // Reiniciar a la primera página al aplicar filtros
  }

  limpiarFiltros(): void {
    this.queryBusqueda = '';
    this.filtroPiso = '';
    this.filtroEstado = '';
    this.filtroTipo = '';
    this.aplicarFiltros();
  }

  clearSearch(): void {
    this.queryBusqueda = '';
    this.aplicarFiltros();
  }

  // Getters para Paginación
  get totalPaginas(): number {
    return Math.ceil(this.habitacionesFiltradas.length / this.elementosPorPagina);
  }

  get habitacionesPaginadas(): HabitacionResponse[] {
    const inicio = (this.paginaActual - 1) * this.elementosPorPagina;
    const fin = inicio + Number(this.elementosPorPagina);
    return this.habitacionesFiltradas.slice(inicio, fin);
  }

  getRangoInicio(): number {
    if (this.habitacionesFiltradas.length === 0) return 0;
    return (this.paginaActual - 1) * this.elementosPorPagina + 1;
  }

  getRangoFin(): number {
    const fin = this.paginaActual * this.elementosPorPagina;
    return fin > this.habitacionesFiltradas.length ? this.habitacionesFiltradas.length : fin;
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

  // Helper de Clases de CSS
  getEstadoClass(estado: string): string {
    const map: { [key: string]: string } = {
      'Disponible': 'status-disponible',
      'Ocupada': 'status-ocupada',
      'Por limpiar': 'status-por-limpiar',
      'En limpieza': 'status-en-limpieza',
      'Mantenimiento': 'status-mantenimiento',
      'Remodelación': 'status-remodelacion',
      'Inhabitable': 'status-inhabitable'
    };
    return map[estado] || '';
  }

  // Helper de Iconos de Estado
  getEstadoIconClass(estado: string): string {
    const map: { [key: string]: string } = {
      'Disponible': 'bi bi-check-circle-fill mr-1',
      'Ocupada': 'bi bi-dash-circle-fill mr-1',
      'Por limpiar': 'bi bi-clock-history mr-1',
      'En limpieza': 'bi bi-stars mr-1',
      'Mantenimiento': 'bi bi-tools mr-1',
      'Remodelación': 'bi bi-hammer mr-1',
      'Inhabitable': 'bi bi-exclamation-octagon-fill mr-1'
    };
    return map[estado] || 'bi bi-pin-angle-fill mr-1';
  }

  esEstadoOperativo(estado: string): boolean {
    return ['Ocupada', 'Por limpiar', 'En limpieza'].includes(estado);
  }

  // Modal de Edición
  abrirEditar(h: HabitacionResponse): void {
    this.habitacionSeleccionada = h;
    this.requestForm = {
      numero: h.numero,
      piso: h.piso,
      tipoId: h.tipoId,
      estado: h.estadoActual,
      notas: h.notas || ''
    };
    this.guardando = false;
    this.mostrarModal = true;
  }

  cerrarModal(): void {
    this.mostrarModal = false;
    this.habitacionSeleccionada = null;
    this.requestForm = { numero: '', piso: 2, tipoId: '', estado: '', notas: '' };
  }

  guardarCambios(): void {
    if (!this.habitacionSeleccionada) return;
    this.guardando = true;

    // Asegurarse de castear el piso a número por si acaso
    this.requestForm.piso = Number(this.requestForm.piso);

    this.habitacionService.update(this.habitacionSeleccionada.id, this.requestForm).subscribe({
      next: () => {
        alert('Habitación actualizada con éxito.');
        this.guardando = false;
        this.cerrarModal();
        this.cargarDatos(); // Recargar datos y aplicar filtros
      },
      error: (err) => {
        alert(err.error?.message || 'Ocurrió un error al actualizar la habitación.');
        this.guardando = false;
      }
    });
  }
}
