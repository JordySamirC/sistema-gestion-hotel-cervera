import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LimpiezaService } from '../../../core/services/limpieza.service';
import { HabitacionService } from '../../../core/services/habitacion.service';
import { AuthService } from '../../../core/services/auth.service';
import { LimpiezaResponse, IniciarLimpiezaRequest } from '../../../core/models/limpieza';
import { HabitacionResponse } from '../../../core/models/habitacion';

interface FilaUnificada {
  tipo: 'POR_LIMPIAR' | 'EN_PROGRESO';
  idRef: string;
  habitacionId: string;
  numero: string;
  piso: number;
  tipoNombre: string;
  prioridad: string;
  prioridadClase: string;
  horaDisp: string;
  inicio: string | null;
  fin: string | null;
  duracion: string | null;
  estadoColor: string;
  estadoTooltip: string;
  asignado: string | null;
  usuarioId: string | null;
  objOriginal: any;
}

@Component({
  selector: 'app-limpieza-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-container fade-in">
      
      <!-- CABECERA DE LA PÁGINA -->
      <div class="header-section">
        <div class="title-area">
          <h2>
            <svg class="header-icon-premium" style="width: 28px; height: 28px; margin-right: 8px; fill: currentColor;" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M19.36,2.72L20.78,4.14L15.06,9.85C16.13,11.39 16.28,13.24 15.38,14.44L9.06,8.12C10.26,7.22 12.11,7.37 13.65,8.44L19.36,2.72M5.93,17.57C3.92,15.56 2.69,13.16 2.35,10.92L7.23,8.83L14.67,16.27L12.58,21.15C10.34,20.81 7.94,19.58 5.93,17.57Z" />
            </svg>
            Gestión de Limpieza
          </h2>
        </div>
      </div>
      <!-- BARRA DE BÚSQUEDA Y FILTROS GLASSMORPHIC -->
      <div class="filters-card glass-panel">
        <div class="search-row">
          <div class="search-box">
            <span class="search-icon"><i class="bi bi-search text-slate-400"></i></span>
            <input 
              type="text" 
              [(ngModel)]="terminoBusqueda" 
              (ngModelChange)="filtrar()"
              placeholder="Buscar habitación o tipo..." 
            />
            <button *ngIf="terminoBusqueda" class="clear-btn" (click)="terminoBusqueda=''; filtrar()"><i class="bi bi-x-lg"></i></button>
          </div>
        </div>

        <div class="filters-grid">
          <div class="filter-group">
            <label class="filter-label"><i class="bi bi-activity mr-1"></i> Estado</label>
            <select [(ngModel)]="filtroEstado" (ngModelChange)="filtrar()" class="filter-select">
              <option value="">Todos los estados</option>
              <option value="POR_LIMPIAR">Por Limpiar</option>
              <option value="EN_PROGRESO">En Limpieza</option>
            </select>
          </div>

          <div class="filter-group">
            <label class="filter-label"><i class="bi bi-exclamation-triangle mr-1"></i> Prioridad</label>
            <select [(ngModel)]="filtroPrioridad" (ngModelChange)="filtrar()" class="filter-select">
              <option value="">Todas las prioridades</option>
              <option value="Urgente">Urgente</option>
              <option value="Normal">Normal</option>
              <option value="Baja">Baja</option>
            </select>
          </div>

          <div class="filter-group">
            <label class="filter-label"><i class="bi bi-door-open mr-1"></i> Tipo</label>
            <select [(ngModel)]="filtroTipo" (ngModelChange)="filtrar()" class="filter-select">
              <option value="">Todos los tipos</option>
              <option *ngFor="let t of tiposUnicos" [value]="t">{{ t }}</option>
            </select>
          </div>

          <div class="filter-group">
            <label class="filter-label"><i class="bi bi-building mr-1"></i> Piso</label>
            <select [(ngModel)]="filtroPiso" (ngModelChange)="filtrar()" class="filter-select">
              <option value="">Todos los pisos</option>
              <option *ngFor="let p of pisosUnicos" [value]="p">Piso {{ p }}</option>
            </select>
          </div>

          <div class="filter-buttons">
            <button class="btn-filtrar" (click)="cargarDatos()">
              <i class="bi bi-arrow-clockwise"></i> Actualizar
            </button>
            <button class="btn-limpiar" (click)="limpiarFiltros()">
              <i class="bi bi-trash"></i> Limpiar
            </button>
          </div>
        </div>
      </div>
      
      <!-- KPI CARDS (RESUMEN) -->
      <div class="kpi-grid">
        <div class="kpi-card kpi-yellow">
          <div class="kpi-icon"><i class="bi bi-exclamation-circle-fill"></i></div>
          <div class="kpi-info">
            <span class="kpi-label">Por Limpiar</span>
            <span class="kpi-value">{{ habitacionesPorLimpiar.length }}</span>
          </div>
        </div>
        <div class="kpi-card kpi-blue">
          <div class="kpi-icon"><i class="bi bi-arrow-repeat"></i></div>
          <div class="kpi-info">
            <span class="kpi-label">En Limpieza</span>
            <span class="kpi-value">{{ limpiezasActivas.length }}</span>
          </div>
        </div>
        <div class="kpi-card kpi-green">
          <div class="kpi-icon"><i class="bi bi-check-circle-fill"></i></div>
          <div class="kpi-info">
            <span class="kpi-label">Disponible Hoy</span>
            <span class="kpi-value">{{ habitacionesDisponibles }}</span>
          </div>
        </div>
        <div class="kpi-card kpi-purple">
          <div class="kpi-icon"><i class="bi bi-stopwatch-fill"></i></div>
          <div class="kpi-info">
            <span class="kpi-label">Promedio Limpieza</span>
            <span class="kpi-value">{{ promedioLimpiezaMinutos }} <small>min</small></span>
          </div>
        </div>
      </div>

      <!-- TABLA ÚNICA UNIFICADA -->
      <div class="table-card glass-panel">
        <div class="table-container">
          <table class="table">
            <thead>
              <tr>
                <th style="width: 40px; text-align: center;"></th>
                <th>Número</th>
                <th>Piso</th>
                <th>Tipo</th>
                <th>Prioridad</th>
                <th>Hora Disp.</th>
                <th>Inicio</th>
                <th>Duración</th>
                <th>Asignado</th>
                <th>Estado</th>
                <th style="text-align: right;">Acción</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let fila of limpiezasPaginadas" class="table-row" [class.selected]="filaSeleccionada?.idRef === fila.idRef" (click)="seleccionar(fila)">
                <td style="text-align: center;">
                  <div class="custom-radio">
                    <input type="radio" name="seleccion" [checked]="filaSeleccionada?.idRef === fila.idRef">
                    <span class="checkmark"></span>
                  </div>
                </td>
                <td class="codigo">{{ fila.numero }}</td>
                <td class="piso-badge"><i class="bi bi-building"></i> {{ fila.piso || '-' }}</td>
                <td class="cliente-name">{{ fila.tipoNombre }}</td>
                <td>
                  <span class="badge-prioridad" [ngClass]="fila.prioridadClase">
                    <i class="bi bi-circle-fill" style="font-size: 0.5rem; margin-right: 4px;"></i> {{ fila.prioridad }}
                  </span>
                </td>
                <td>{{ fila.horaDisp }}</td>
                <td>{{ fila.inicio || '-' }}</td>
                <td>
                  <span *ngIf="fila.duracion" class="duration-badge"><i class="bi bi-stopwatch"></i> {{ fila.duracion }}</span>
                  <span *ngIf="!fila.duracion" class="text-muted">-</span>
                </td>
                <td>
                  <span *ngIf="fila.asignado" class="asignado-badge"><i class="bi bi-person-fill"></i> {{ fila.asignado }}</span>
                  <span *ngIf="!fila.asignado" class="text-muted">-</span>
                </td>
                <td style="text-align: center;">
                  <span class="badge-estado" [ngClass]="fila.tipo === 'POR_LIMPIAR' ? 'estado-por-limpiar' : 'estado-en-limpieza'">
                    <i class="bi bi-circle-fill" style="font-size: 0.5rem; margin-right: 4px;"></i>
                    {{ fila.tipo === 'POR_LIMPIAR' ? 'Por Limpiar' : 'En Limpieza' }}
                  </span>
                </td>
                <td style="text-align: right;">
                  <button *ngIf="fila.tipo === 'POR_LIMPIAR'" class="btn-action btn-play" [class.btn-disabled]="yaTieneLimpiezaActiva()" (click)="iniciarRapido(fila); $event.stopPropagation()" [title]="yaTieneLimpiezaActiva() ? 'Ya estás limpiando una habitación' : 'Iniciar limpieza'">
                    <i class="bi bi-play-fill"></i> Iniciar
                  </button>
                  <button *ngIf="fila.tipo === 'EN_PROGRESO' && esAsignado(fila)" class="btn-action btn-check" (click)="terminarRapido(fila); $event.stopPropagation()">
                    <i class="bi bi-check-lg"></i> Terminar
                  </button>
                  <span *ngIf="fila.tipo === 'EN_PROGRESO' && !esAsignado(fila)" class="text-muted-small">
                    En proceso
                  </span>
                </td>
              </tr>
              <tr *ngIf="filasFiltradas.length === 0">
                <td colspan="10" class="empty-state">
                  <i class="bi bi-stars"></i> No se encontraron resultados con los filtros actuales.
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- PAGINACIÓN PREMIUM CON CONTROLES DE MARCA -->
        <div class="paginator-container" *ngIf="filasFiltradas.length > 0">
          <div class="paginator-info">
            Mostrando <b>{{ getRangoInicio() }} - {{ getRangoFin() }}</b> de <b>{{ filasFiltradas.length }}</b> registros
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
      
    </div>
  `,
  styles: [`
    .page-container {
      padding: 24px;
      font-family: 'Outfit', 'Inter', -apple-system, sans-serif;
      background: #f8fafc;
      min-height: 100vh;
      max-width: 1400px;
      margin: 0 auto;
      width: 100%;
    }

    /* CABECERA */
    .header-section {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 18px 28px;
      background: linear-gradient(135deg, #1A211B 0%, #2D5A27 100%);
      border-radius: 16px;
      box-shadow: 0 8px 24px rgba(45, 90, 39, 0.15);
      margin-bottom: 20px;
    }
    .header-section h2 { margin: 0; font-size: 1.5rem; font-weight: 800; color: #ffffff; letter-spacing: -0.02em; display: flex; align-items: center; gap: 10px; }
    .header-icon-premium { color: #D4A843; }
    
    /* GLASSMORPHIC */
    .glass-panel {
      background: rgba(255, 255, 255, 0.95);
      border: 1px solid rgba(45, 90, 39, 0.08);
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
    }

    /* FILTROS CARD (ESTILO HABITACIONES) */
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
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
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

    /* KPI CARDS */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }
    .kpi-card {
      background: white;
      border-radius: 16px;
      padding: 20px;
      display: flex;
      align-items: center;
      gap: 16px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.03);
      border: 1px solid #e2e8f0;
      transition: transform 0.2s;
    }
    .kpi-card:hover { transform: translateY(-3px); }
    .kpi-icon {
      width: 50px;
      height: 50px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
      flex-shrink: 0;
    }
    .kpi-info { display: flex; flex-direction: column; }
    .kpi-label { font-size: 0.8rem; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px; }
    .kpi-value { font-size: 1.6rem; font-weight: 800; color: #1e293b; line-height: 1; }
    .kpi-value small { font-size: 0.9rem; font-weight: 600; color: #94a3b8; }
    
    .kpi-yellow .kpi-icon { background: rgba(234, 179, 8, 0.15); color: #ca8a04; }
    .kpi-blue .kpi-icon { background: rgba(59, 130, 246, 0.15); color: #2563eb; }
    .kpi-green .kpi-icon { background: rgba(34, 197, 94, 0.15); color: #16a34a; }
    .kpi-purple .kpi-icon { background: rgba(168, 85, 247, 0.15); color: #9333ea; }

    /* TABLA */
    .table-card { border-radius: 16px; overflow: hidden; margin-bottom: 24px; }
    .table-container { overflow-x: auto; width: 100%; }
    .table { width: 100%; border-collapse: collapse; }
    .table th, .table td { padding: 14px 20px; text-align: left; font-size: 0.88rem; border-bottom: 1px solid rgba(45, 90, 39, 0.05); white-space: nowrap; vertical-align: middle; }
    .table th { background: rgba(248, 250, 252, 0.8); color: #64748b; font-weight: 800; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; }
    .table-row { transition: all 0.2s ease; cursor: pointer; }
    .table-row:hover { background: rgba(45, 90, 39, 0.03); }
    .table-row.selected { background: rgba(212, 168, 67, 0.08); }
    
    .codigo { font-size: 1.05rem; font-weight: 800; color: #1e293b; font-family: 'Outfit', sans-serif; }
    .piso-badge { font-weight: 700; color: #64748b; font-size: 0.85rem; }
    .piso-badge i { font-size: 0.8rem; margin-right: 4px; color: #94a3b8; }
    .cliente-name { font-weight: 600; color: #475569; }
    .text-muted { color: #94a3b8; }

    /* COLORES ESTADO */
    .badge-estado { padding: 4px 10px; border-radius: 12px; font-weight: 700; font-size: 0.75rem; display: inline-flex; align-items: center; white-space: nowrap; }
    .estado-por-limpiar { background: rgba(234, 179, 8, 0.1); color: #d97706; border: 1px solid rgba(234, 179, 8, 0.2); }
    .estado-en-limpieza { background: rgba(59, 130, 246, 0.1); color: #2563eb; border: 1px solid rgba(59, 130, 246, 0.2); }

    /* PRIORIDAD BADGES */
    .badge-prioridad { padding: 4px 10px; border-radius: 12px; font-weight: 700; font-size: 0.75rem; display: inline-flex; align-items: center; }
    .prioridad-alta { background: rgba(239, 68, 68, 0.1); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.2); }
    .prioridad-media { background: rgba(234, 179, 8, 0.1); color: #d97706; border: 1px solid rgba(234, 179, 8, 0.2); }
    .prioridad-baja { background: rgba(34, 197, 94, 0.1); color: #16a34a; border: 1px solid rgba(34, 197, 94, 0.2); }

    .duration-badge { font-weight: 700; color: #334155; }

    /* RADIO BUTTONS ESTILIZADOS */
    .custom-radio { position: relative; display: inline-block; width: 18px; height: 18px; cursor: pointer; }
    .custom-radio input { opacity: 0; width: 0; height: 0; }
    .checkmark { position: absolute; top: 0; left: 0; height: 18px; width: 18px; background-color: white; border: 2px solid #cbd5e1; border-radius: 50%; transition: all 0.2s; }
    .custom-radio input:checked ~ .checkmark { background-color: #2D5A27; border-color: #2D5A27; }
    .checkmark:after { content: ""; position: absolute; display: none; }
    .custom-radio input:checked ~ .checkmark:after { display: block; }
    .custom-radio .checkmark:after { top: 5px; left: 5px; width: 4px; height: 4px; border-radius: 50%; background: white; }
    .duration-badge { font-weight: 700; color: #475569; font-size: 0.85rem; }
    .asignado-badge { font-weight: 600; color: #2D5A27; font-size: 0.85rem; }
    .text-muted-small { color: #94a3b8; font-size: 0.8rem; font-style: italic; }
    .btn-action { padding: 6px 12px; border: none; border-radius: 8px; font-weight: 700; font-size: 0.8rem; cursor: pointer; transition: all 0.2s; display: inline-flex; align-items: center; gap: 6px; }
    .btn-play { background: rgba(59, 130, 246, 0.1); color: #2563eb; }
    .btn-play:hover { background: #3b82f6; color: white; }
    .btn-check { background: rgba(34, 197, 94, 0.1); color: #16a34a; }
    .btn-check:hover { background: #22c55e; color: white; }
    .btn-disabled { opacity: 0.5; cursor: not-allowed; pointer-events: none; }

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

    .empty-state { text-align: center; padding: 40px; color: #64748b; font-size: 0.95rem; }
    .empty-state i { font-size: 1.5rem; display: block; margin-bottom: 8px; color: #cbd5e1; }
  `]
})
export class LimpiezaListComponent implements OnInit, OnDestroy {
  habitacionesPorLimpiar: HabitacionResponse[] = [];
  limpiezasActivas: LimpiezaResponse[] = [];
  historial: LimpiezaResponse[] = [];

  filasUnificadas: FilaUnificada[] = [];
  filasFiltradas: FilaUnificada[] = [];
  tiposUnicos: string[] = [];
  pisosUnicos: number[] = [];

  // Filtros
  terminoBusqueda: string = '';
  filtroEstado: string = '';
  filtroPrioridad: string = '';
  filtroTipo: string = '';
  filtroPiso: string = '';

  filaSeleccionada: FilaUnificada | null = null;

  // Paginación
  paginaActual: number = 1;
  elementosPorPagina: number = 10;

  iniciarRequest: IniciarLimpiezaRequest = { habitacionId: '', usuarioId: '' };

  habitacionesDisponibles: number = 0;
  promedioLimpiezaMinutos: number = 0;

  timer: any;

  constructor(
    private limpiezaService: LimpiezaService,
    private habitacionService: HabitacionService,
    public auth: AuthService
  ) { }

  ngOnInit(): void {
    this.iniciarRequest.usuarioId = this.auth.getUsuario()?.id || '';
    this.cargarDatos();

    this.timer = setInterval(() => {
      this.reconstruirFilas();
    }, 60000);
  }

  ngOnDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }

  todasLasHabitaciones: Map<string, HabitacionResponse> = new Map();

  cargarDatos() {
    this.habitacionService.getAll().subscribe(all => {
      this.habitacionesDisponibles = 0;
      this.habitacionesPorLimpiar = [];
      this.todasLasHabitaciones.clear();

      for (const h of all) {
        this.todasLasHabitaciones.set(h.id, h);
        if (h.estadoActual === 'Disponible') this.habitacionesDisponibles++;
        if (h.estadoActual === 'Por limpiar') this.habitacionesPorLimpiar.push(h);
      }

      this.limpiezaService.getActivas().subscribe(l => {
        this.limpiezasActivas = l;
        this.reconstruirFilas();
      });
    });

    this.limpiezaService.getAll().subscribe(hist => {
      this.historial = hist;
      this.calcularPromedio();
    });
  }

  reconstruirFilas() {
    const nuevasFilas: FilaUnificada[] = [];
    const tiposSet = new Set<string>();
    const pisosSet = new Set<number>();

    // Extraer todos los pisos y tipos posibles de la base de datos de habitaciones
    for (const h of this.todasLasHabitaciones.values()) {
      if (h.tipoNombre) tiposSet.add(h.tipoNombre);
      if (h.piso) pisosSet.add(h.piso);
    }

    // Agregar las activas primero
    for (const l of this.limpiezasActivas) {
      const habReal = this.todasLasHabitaciones.get(l.habitacionId);
      const tipoReal = habReal ? habReal.tipoNombre : 'Desconocido';
      const pisoReal = habReal ? habReal.piso : 0;

      nuevasFilas.push({
        tipo: 'EN_PROGRESO',
        idRef: l.id,
        habitacionId: l.habitacionNumero,
        numero: l.habitacionNumero,
        piso: pisoReal,
        tipoNombre: tipoReal,
        prioridad: 'Urgente',
        prioridadClase: 'prioridad-alta',
        horaDisp: '-',
        inicio: this.formatearHora(l.fechaInicio),
        fin: '-',
        duracion: this.calcularDuracionActual(l.fechaInicio) + ' min',
        estadoColor: 'blue',
        estadoTooltip: 'En limpieza actualmente',
        asignado: l.usuarioNombre,
        usuarioId: l.usuarioId,
        objOriginal: l
      });
    }

    // Agregar las pendientes
    for (let i = 0; i < this.habitacionesPorLimpiar.length; i++) {
      const h = this.habitacionesPorLimpiar[i];

      const r = i % 3;
      let prio = r === 0 ? 'Urgente' : (r === 1 ? 'Normal' : 'Baja');
      let clase = r === 0 ? 'prioridad-alta' : (r === 1 ? 'prioridad-media' : 'prioridad-baja');
      let horaD = ['10:30 AM', '10:45 AM', '11:00 AM', '09:15 AM'][i % 4];

      nuevasFilas.push({
        tipo: 'POR_LIMPIAR',
        idRef: h.id,
        habitacionId: h.id,
        numero: h.numero,
        piso: h.piso,
        tipoNombre: h.tipoNombre,
        prioridad: prio,
        prioridadClase: clase,
        horaDisp: horaD,
        inicio: null,
        fin: null,
        duracion: null,
        estadoColor: 'yellow',
        estadoTooltip: 'Esperando limpieza',
        asignado: null,
        usuarioId: null,
        objOriginal: h
      });
    }

    this.tiposUnicos = Array.from(tiposSet).sort();
    this.pisosUnicos = Array.from(pisosSet).sort((a, b) => a - b);
    this.filasUnificadas = nuevasFilas;
    this.filtrar();
  }

  filtrar() {
    this.filasFiltradas = this.filasUnificadas.filter(f => {
      // 1. Filtro de búsqueda
      const term = this.terminoBusqueda.toLowerCase().trim();
      const matchBusqueda = !term || 
        f.numero.toLowerCase().includes(term) || 
        f.tipoNombre.toLowerCase().includes(term);

      // 2. Filtro de Estado
      const matchEstado = !this.filtroEstado || f.tipo === this.filtroEstado;

      // 3. Filtro de Prioridad
      const matchPrioridad = !this.filtroPrioridad || f.prioridad === this.filtroPrioridad;

      // 4. Filtro de Tipo
      const matchTipo = !this.filtroTipo || f.tipoNombre === this.filtroTipo;

      // 5. Filtro de Piso
      const matchPiso = !this.filtroPiso || f.piso.toString() === this.filtroPiso;

      return matchBusqueda && matchEstado && matchPrioridad && matchTipo && matchPiso;
    });
    
    this.paginaActual = 1;
  }

  limpiarFiltros() {
    this.terminoBusqueda = '';
    this.filtroEstado = '';
    this.filtroPrioridad = '';
    this.filtroTipo = '';
    this.filtroPiso = '';
    this.filtrar();
  }

  // Métodos de Paginación
  get totalPaginas(): number {
    return Math.ceil(this.filasFiltradas.length / this.elementosPorPagina);
  }

  get limpiezasPaginadas(): FilaUnificada[] {
    const inicio = (this.paginaActual - 1) * this.elementosPorPagina;
    const fin = inicio + Number(this.elementosPorPagina);
    return this.filasFiltradas.slice(inicio, fin);
  }

  getRangoInicio(): number {
    if (this.filasFiltradas.length === 0) return 0;
    return (this.paginaActual - 1) * this.elementosPorPagina + 1;
  }

  getRangoFin(): number {
    const fin = this.paginaActual * this.elementosPorPagina;
    return fin > this.filasFiltradas.length ? this.filasFiltradas.length : fin;
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

  calcularPromedio() {
    const term = this.historial.filter(l => l.duracionSegundos != null);
    if (term.length === 0) {
      this.promedioLimpiezaMinutos = 0;
      return;
    }
    const sum = term.reduce((acc, l) => acc + (l.duracionSegundos || 0), 0);
    this.promedioLimpiezaMinutos = Math.round((sum / term.length) / 60);
  }

  seleccionar(fila: FilaUnificada) {
    this.filaSeleccionada = fila;
  }

  formatearHora(isoString: string): string {
    if (!isoString) return '-';
    const d = new Date(isoString);
    let hours = d.getHours();
    const minutes = d.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // la hora '0' debe ser '12'
    const minutesStr = minutes.toString().padStart(2, '0');
    return `${hours}:${minutesStr} ${ampm}`;
  }

  calcularDuracionActual(fechaInicioStr: string): number {
    const inicio = new Date(fechaInicioStr).getTime();
    const ahora = new Date().getTime();
    return Math.floor((ahora - inicio) / 60000);
  }

  yaTieneLimpiezaActiva(): boolean {
    const miId = this.auth.getUsuario()?.id;
    return this.limpiezasActivas.some(l => l.usuarioId === miId);
  }

  esAsignado(fila: FilaUnificada): boolean {
    return fila.usuarioId === this.auth.getUsuario()?.id;
  }

  iniciarRapido(fila: FilaUnificada) {
    if (this.yaTieneLimpiezaActiva()) {
      alert('No puedes limpiar más de una habitación a la vez. Termina la limpieza actual primero.');
      return;
    }
    
    this.iniciarRequest.habitacionId = fila.idRef;
    this.limpiezaService.iniciar(this.iniciarRequest).subscribe({
      next: () => {
        this.filaSeleccionada = null;
        this.cargarDatos();
      },
      error: (err) => alert(err.error?.message || 'Error al iniciar limpieza')
    });
  }

  terminarRapido(fila: FilaUnificada) {
    this.limpiezaService.terminar(fila.idRef).subscribe({
      next: () => {
        this.filaSeleccionada = null;
        this.cargarDatos();
      },
      error: () => alert('Error al terminar limpieza')
    });
  }
}
