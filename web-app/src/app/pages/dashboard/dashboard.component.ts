import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HabitacionService } from '../../core/services/habitacion.service';
import { ReservaService } from '../../core/services/reserva.service';
import { AuthService } from '../../core/services/auth.service';
import { DashboardService, ResumenDashboardResponse, DashboardGraficosResponse, AlertaDashboardResponse } from '../../core/services/dashboard.service';
import { HabitacionResponse } from '../../core/models/habitacion';
import { EstadiaResponse } from '../../core/models/reserva';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="dashboard-premium fade-in">
      <!-- Encabezado de Página -->
      <header class="dashboard-header glass-panel">
        <div class="header-main">
          <h1><i class="header-icon-premium bi bi-speedometer2"></i> Panel de Control del Gerente</h1>
          <p class="subtitle">Estado operativo en tiempo real y análisis de rentabilidad hotelera</p>
        </div>
      </header>

      <!-- Navigation Tabs (Sleek Glassmorphic Pill Selectors) -->
      <div class="tabs-navigation-wrapper">
        <nav class="tabs-header-container">
          <button class="tab-btn" [class.active]="tabActivo === 'resumen'" (click)="tabActivo = 'resumen'">
            <i class="bi bi-bar-chart-fill mr-1"></i> Resumen
          </button>
          <button class="tab-btn" [class.active]="tabActivo === 'analisis'" (click)="tabActivo = 'analisis'">
            <i class="bi bi-graph-up-arrow mr-1"></i> Análisis
          </button>
          <button class="tab-btn" [class.active]="tabActivo === 'mapa'" (click)="tabActivo = 'mapa'">
            <i class="bi bi-building mr-1"></i> Mapa Físico
          </button>
        </nav>
      </div>

      <!-- Tab Content Area -->
      <div class="tab-content">

        <!-- TAB 1: RESUMEN -->
        <div *ngIf="tabActivo === 'resumen'" class="tab-pane fade-in">
          
          <!-- Panel de Alertas Operativas -->
          <section class="alerts-section glass-panel" *ngIf="alertas.length > 0">
            <div class="section-title">
              <span class="icon"><i class="bi bi-bell-fill text-dorado-amazonico"></i></span>
              <h2>Alertas Operativas de la Jornada ({{ alertas.length }} activas)</h2>
            </div>
            <div class="alerts-container">
              <div 
                *ngFor="let alert of alertas" 
                class="alert-card" 
                [ngClass]="'alert-' + alert.tipo.toLowerCase()"
              >
                <div class="alert-icon"><i [class]="getAlertIcon(alert.tipo)"></i></div>
                <div class="alert-content">
                  <p class="alert-message">{{ alert.mensaje }}</p>
                  <span class="alert-time">{{ alert.fecha }}</span>
                </div>
                <span class="alert-badge" [ngClass]="alert.tipo.toLowerCase()">{{ alert.tipo }}</span>
              </div>
            </div>
          </section>

          <!-- Tarjetas de Métricas Clave (KPIs) -->
          <section class="stats-grid">
            <!-- Ocupación Card -->
            <div class="kpi-card glass-panel pct-card">
              <div class="kpi-bg-gradient"></div>
              <div class="kpi-body">
                <div class="kpi-icon"><i class="bi bi-graph-up-arrow"></i></div>
                <div class="kpi-info">
                  <span class="kpi-label">Ocupación Promedio</span>
                  <span class="kpi-value">{{ resumen?.ocupacionPorcentaje }}%</span>
                  <div class="kpi-progress-bar">
                    <div class="kpi-progress-fill" [style.width.%]="resumen?.ocupacionPorcentaje || 0"></div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Disponibles Card -->
            <div class="kpi-card glass-panel green-card">
              <div class="kpi-body">
                <div class="kpi-icon"><i class="bi bi-check-circle-fill"></i></div>
                <div class="kpi-info">
                  <span class="kpi-label">Hab. Disponibles</span>
                  <span class="kpi-value">{{ resumen?.disponibles }}</span>
                  <span class="kpi-subtext">Listas para check-in</span>
                </div>
              </div>
            </div>

            <!-- Ocupadas Card -->
            <div class="kpi-card glass-panel indigo-card">
              <div class="kpi-body">
                <div class="kpi-icon"><i class="bi bi-door-closed-fill"></i></div>
                <div class="kpi-info">
                  <span class="kpi-label">Hab. Ocupadas</span>
                  <span class="kpi-value">{{ resumen?.ocupadas }}</span>
                  <span class="kpi-subtext">Huéspedes activos</span>
                </div>
              </div>
            </div>

            <!-- Por Limpiar Card -->
            <div class="kpi-card glass-panel orange-card">
              <div class="kpi-body">
                <div class="kpi-icon"><i class="bi bi-brush-fill"></i></div>
                <div class="kpi-info">
                  <span class="kpi-label">Hab. Por Limpiar</span>
                  <span class="kpi-value">{{ resumen?.porLimpiar }}</span>
                  <span class="kpi-subtext">Requieren limpieza</span>
                </div>
              </div>
            </div>

            <!-- Movimientos de Hoy Card -->
            <div class="kpi-card glass-panel movements-card">
              <div class="kpi-body">
                <div class="kpi-icon"><i class="bi bi-door-open-fill"></i></div>
                <div class="kpi-info">
                  <span class="kpi-label">Movimientos Hoy</span>
                  <span class="kpi-value small" style="color: #059669; font-weight: 850;">
                    {{ resumen?.checkInsHoy || 0 }} <span class="sub">Hospedadas</span>
                  </span>
                  <span class="kpi-subtext primary" style="color: #d97706; margin-top: 4px; font-weight: 750;">
                    {{ resumen?.checkOutsHoy || 0 }} <span class="sub">Finalizadas</span>
                  </span>
                </div>
              </div>
            </div>

            <!-- Finanzas Card -->
            <div class="kpi-card glass-panel finance-card">
              <div class="kpi-body">
                <div class="kpi-icon"><i class="bi bi-cash-stack"></i></div>
                <div class="kpi-info">
                  <span class="kpi-label">Ingresos Registrados</span>
                  <span class="kpi-value small">S/ {{ resumen?.ingresosHoy }} <span class="sub">Hoy</span></span>
                  <span class="kpi-subtext primary">S/ {{ resumen?.ingresosMes }} <span class="sub">Mes</span></span>
                </div>
              </div>
            </div>
          </section>

          <!-- Gráficos Principales -->
          <section class="charts-grid m-top">
            <!-- Gráfico 1: Tendencia de Ocupación (Líneas SVG) -->
            <div class="chart-card glass-panel">
              <div class="chart-header">
                <h3><i class="bi bi-graph-up-arrow text-verde-selva mr-2"></i> Tendencia de Ocupación (Últimos 7 Días)</h3>
                <span class="chart-subtitle">Porcentaje diario de ocupación de habitaciones</span>
              </div>
              <div class="chart-body ocupacion-chart-body" (mouseleave)="clearTooltip()" style="position: relative;">
                <!-- SVG Line Chart -->
                <svg viewBox="0 0 500 240" class="svg-chart">
                  <!-- Defs for Gradients -->
                  <defs>
                    <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stop-color="#2D5A27" stop-opacity="0.3"/>
                      <stop offset="100%" stop-color="#2D5A27" stop-opacity="0"/>
                    </linearGradient>
                  </defs>

                  <!-- Grid Lines -->
                  <line x1="40" y1="20" x2="480" y2="20" stroke="#f1f5f9" stroke-width="1" />
                  <line x1="40" y1="70" x2="480" y2="70" stroke="#f1f5f9" stroke-width="1" />
                  <line x1="40" y1="120" x2="480" y2="120" stroke="#f1f5f9" stroke-width="1" />
                  <line x1="40" y1="170" x2="480" y2="170" stroke="#f1f5f9" stroke-width="1" />
                  <line x1="40" y1="220" x2="480" y2="220" stroke="#cbd5e1" stroke-width="1.5" />

                  <!-- Y Axis Labels -->
                  <text x="30" y="24" class="svg-label text-right">100%</text>
                  <text x="30" y="74" class="svg-label text-right">75%</text>
                  <text x="30" y="124" class="svg-label text-right">50%</text>
                  <text x="30" y="174" class="svg-label text-right">25%</text>
                  <text x="30" y="224" class="svg-label text-right">0%</text>

                  <!-- Area Path Under the Line -->
                  <path [attr.d]="svgAreaPath" fill="url(#lineGrad)" class="chart-path-area" />

                  <!-- Line Path -->
                  <path [attr.d]="svgLinePath" fill="none" stroke="#2D5A27" stroke-width="3" class="chart-path-line" />

                  <!-- Dots and Interaction Markers -->
                  <g *ngFor="let point of lineChartPoints; let idx = index">
                    <!-- Invisible large hover zone -->
                    <circle 
                      [attr.cx]="point.x" 
                      [attr.cy]="point.y" 
                      r="20" 
                      fill="transparent" 
                      style="cursor: pointer;"
                      (mouseenter)="showTooltip($event, point.label + ': ' + point.val + '%', 'ocupacion')"
                    />
                    <!-- Visible tiny dot -->
                    <circle 
                      [attr.cx]="point.x" 
                      [attr.cy]="point.y" 
                      r="6" 
                      fill="#ffffff" 
                      stroke="#2D5A27" 
                      stroke-width="2.5" 
                      class="chart-dot"
                      style="pointer-events: none;"
                    />
                    <!-- Label for X Axis -->
                    <text [attr.x]="point.x" y="236" class="svg-label text-center">{{ point.label }}</text>
                  </g>
                </svg>

                <!-- Local Tooltip -->
                <div 
                  class="chart-tooltip" 
                  [class.visible]="tooltipVisible && activeChart === 'ocupacion'" 
                  [style.left.px]="tooltipX" 
                  [style.top.px]="tooltipY"
                >
                  {{ tooltipText }}
                </div>
              </div>
            </div>

            <!-- Gráfico 2: Distribución de Estados (Rosca SVG) -->
            <div class="chart-card glass-panel">
              <div class="chart-header">
                <h3><i class="bi bi-pie-chart-fill text-verde-selva mr-2"></i> Distribución de Estados de Habitaciones</h3>
                <span class="chart-subtitle">Estado de la oferta hotelera total</span>
              </div>
              <div class="chart-body estados-chart-body" (mouseleave)="clearTooltip()" style="position: relative;">
                <div class="donut-container">
                  <svg viewBox="0 0 200 200" class="svg-donut">
                    <circle cx="100" cy="100" r="70" fill="none" stroke="#f1f5f9" stroke-width="22" />
                    <g *ngFor="let slice of donutSlices">
                      <circle 
                        cx="100" 
                        cy="100" 
                        r="70" 
                        fill="none" 
                        [attr.stroke]="slice.color" 
                        stroke-width="22" 
                        [attr.stroke-dasharray]="donutCircumference" 
                        [attr.stroke-dashoffset]="slice.offset" 
                        [attr.transform]="slice.transform"
                        class="donut-segment"
                        (mouseenter)="showTooltip($event, slice.label + ': ' + slice.val + ' habs', 'estados')"
                      />
                    </g>
                  </svg>
                  <div class="donut-center">
                    <span class="donut-center-val">{{ totalHabitaciones }}</span>
                    <span class="donut-center-lbl">Habitaciones</span>
                  </div>
                </div>
                <!-- Legend Grid -->
                <div class="legend-grid">
                  <div *ngFor="let slice of donutSlices" class="legend-item" (mouseenter)="showTooltip($event, slice.label + ': ' + slice.val + ' habs', 'estados')">
                    <span class="legend-color" [style.background-color]="slice.color"></span>
                    <span class="legend-text">{{ slice.label }} ({{ slice.val }})</span>
                  </div>
                </div>

                <!-- Local Tooltip -->
                <div 
                  class="chart-tooltip" 
                  [class.visible]="tooltipVisible && activeChart === 'estados'" 
                  [style.left.px]="tooltipX" 
                  [style.top.px]="tooltipY"
                >
                  {{ tooltipText }}
                </div>
              </div>
            </div>
          </section>

        </div>

        <!-- TAB 2: ANÁLISIS DETALLADO -->
        <div *ngIf="tabActivo === 'analisis'" class="tab-pane fade-in">
          
          <section class="charts-grid">
            <!-- Gráfico 1: Ingresos por Tipo de Habitación (Barras Verticales SVG) -->
            <div class="chart-card glass-panel">
              <div class="chart-header">
                <h3><i class="bi bi-bar-chart-fill text-verde-selva mr-2"></i> Ingresos Acumulados por Tipo de Habitación</h3>
                <span class="chart-subtitle">Matrimonial vs Doble vs Triple</span>
              </div>
              <div class="chart-body ingresos-chart-body" (mouseleave)="clearTooltip()" style="position: relative;">
                <svg viewBox="0 0 500 240" class="svg-chart">
                  <!-- Y Axis Lines -->
                  <line x1="50" y1="20" x2="480" y2="20" stroke="#f1f5f9" stroke-width="1" />
                  <line x1="50" y1="70" x2="480" y2="70" stroke="#f1f5f9" stroke-width="1" />
                  <line x1="50" y1="120" x2="480" y2="120" stroke="#f1f5f9" stroke-width="1" />
                  <line x1="50" y1="170" x2="480" y2="170" stroke="#f1f5f9" stroke-width="1" />
                  <line x1="50" y1="220" x2="480" y2="220" stroke="#cbd5e1" stroke-width="1.5" />

                  <text x="40" y="24" class="svg-label text-right">S/{{ barMaxVal }}</text>
                  <text x="40" y="124" class="svg-label text-right">S/{{ barMaxVal / 2 }}</text>
                  <text x="40" y="224" class="svg-label text-right">S/0</text>

                  <!-- Bars -->
                  <g *ngFor="let bar of barChartPoints; let idx = index">
                    <!-- Bar Base shadow/background (Column Hover Zone) -->
                    <rect 
                      [attr.x]="bar.x - 20" 
                      y="20" 
                      width="40" 
                      height="200" 
                      fill="#f8fafc" 
                      rx="4"
                      style="cursor: pointer;"
                      (mouseenter)="showTooltip($event, bar.label + ': S/ ' + bar.val, 'ingresos')"
                    />
                    <!-- Active Bar -->
                    <rect 
                      [attr.x]="bar.x - 20" 
                      [attr.y]="bar.y" 
                      width="40" 
                      [attr.height]="bar.height" 
                      [attr.fill]="bar.color" 
                      rx="6" 
                      class="chart-bar"
                      style="pointer-events: none;"
                    />
                    <!-- Label for X Axis -->
                    <text [attr.x]="bar.x" y="236" class="svg-label text-center font-semibold">{{ bar.label }}</text>
                  </g>
                </svg>

                <!-- Local Tooltip -->
                <div 
                  class="chart-tooltip" 
                  [class.visible]="tooltipVisible && activeChart === 'ingresos'" 
                  [style.left.px]="tooltipX" 
                  [style.top.px]="tooltipY"
                >
                  {{ tooltipText }}
                </div>
              </div>
            </div>

            <!-- Gráfico 2: Habitaciones Más Reservadas (Barras Horizontales SVG) -->
            <div class="chart-card glass-panel">
              <div class="chart-header">
                <h3><i class="bi bi-award-fill text-dorado-amazonico mr-2"></i> Habitaciones Más Reservadas por Tipo</h3>
                <span class="chart-subtitle">Volumen total de reservas confirmadas por categoría</span>
              </div>
              <div class="chart-body horizontal-bars">
                <div class="horizontal-bar-row" *ngFor="let rank of ranking; let idx = index">
                  <div class="row-header">
                    <span class="rank-badge">{{ idx + 1 }}</span>
                    <span class="rank-name font-semibold">{{ rank.name }}</span>
                    <span class="rank-val">{{ rank.value }} reservas</span>
                  </div>
                  <div class="progress-bar-container">
                    <div 
                      class="progress-bar-fill" 
                      [style.width.%]="rank.percentage" 
                      [style.background]="idx === 0 ? 'linear-gradient(to right, #2D5A27, #4E8D46)' : (idx === 1 ? 'linear-gradient(to right, #D4A843, #B88E2F)' : 'linear-gradient(to right, #8B5A2B, #6E441F)')"
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </section>

        </div>

        <!-- TAB 3: MAPA FÍSICO INTERACTIVO -->
        <div *ngIf="tabActivo === 'mapa'" class="tab-pane fade-in">
          
          <section class="floors-section">
            <div class="floors-header-panel glass-panel">
              <div class="map-header-grid">
                <div class="section-title">
                  <span class="icon"><i class="bi bi-building text-dorado-amazonico"></i></span>
                  <div>
                    <h2>Mapa Físico de Habitaciones</h2>
                    <p class="section-subtitle">Visualización estructural por niveles and estados operacionales</p>
                  </div>
                </div>

                <!-- Barra de Filtros Interactiva Glassmorphic -->
                <div class="map-filters-panel">
                  <div class="filter-input-wrapper">
                    <input 
                      type="text" 
                      [(ngModel)]="busquedaNumero" 
                      placeholder="Buscar número..." 
                      class="filter-input"
                    />
                  </div>
                  <div class="filter-select-wrapper">
                    <select [(ngModel)]="filtroPiso" class="filter-select">
                      <option value="">Todos los pisos</option>
                      <option value="2">Piso 2</option>
                      <option value="3">Piso 3</option>
                    </select>
                  </div>
                  <div class="filter-select-wrapper">
                    <select [(ngModel)]="filtroEstado" class="filter-select">
                      <option value="">Todos los estados</option>
                      <option value="Disponible">Disponible</option>
                      <option value="Ocupada">Ocupada</option>
                      <option value="Por limpiar">Por limpiar</option>
                      <option value="En limpieza">En limpieza</option>
                      <option value="Mantenimiento">Mantenimiento</option>
                      <option value="Remodelación">Remodelación</option>
                      <option value="Inhabitable">Inhabitable</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <!-- Floors Grid Wrapper -->
            <div class="floors-container">
              <div *ngFor="let piso of getPisosFiltrados()" class="floor-group glass-panel" [class.collapsed]="floorCollapsedMap[piso.numero]">
                <div class="floor-header" (click)="toggleFloor(piso.numero)">
                  <div class="floor-title">
                    <span class="chevron"></span>
                    <h3>Piso {{ piso.numero }}</h3>
                    <span class="rooms-count-badge">{{ piso.habitaciones.length }} habitaciones</span>
                  </div>
                  <div class="floor-summary-badges">
                    <span class="badge disponible">Disponibles: {{ getRoomsCountByEstado(piso.habitaciones, 'Disponible') }}</span>
                    <span class="badge ocupada">Ocupadas: {{ getRoomsCountByEstado(piso.habitaciones, 'Ocupada') }}</span>
                  </div>
                </div>
                
                <div class="floor-content-wrapper">
                  <div class="habitaciones-grid">
                    <div
                      class="habitacion-card"
                      *ngFor="let h of piso.habitaciones"
                      [class.disponible]="h.estadoActual === 'Disponible'"
                      [class.ocupada]="h.estadoActual === 'Ocupada'"
                      [class.limpiar]="h.estadoActual === 'Por limpiar'"
                      [class.limpieza]="h.estadoActual === 'En limpieza'"
                      [class.mantenimiento]="h.estadoActual === 'Mantenimiento'"
                      [class.remodelacion]="h.estadoActual === 'Remodelación'"
                      [class.inhabitable]="h.estadoActual === 'Inhabitable'"
                      [routerLink]="['/habitaciones']"
                    >
                      <div class="hab-badge">{{ h.estadoActual }}</div>
                      <span class="numero">{{ h.numero }}</span>
                      <span class="tipo">{{ h.tipoNombre }}</span>
                    </div>
                  </div>
                  <div *ngIf="piso.habitaciones.length === 0" class="empty-floor-state">
                    No se encontraron habitaciones en este piso con los filtros seleccionados.
                  </div>
                </div>
              </div>
            </div>
          </section>

        </div>

      </div>
    </div>
  `,
  styles: [`
    .dashboard-premium {
      position: relative;
    }

    /* Tabs navigation container */
    .tabs-navigation-wrapper {
      display: flex;
      justify-content: center;
      margin: -10px 0 10px 0;
      width: 100%;
    }

    .tabs-header-container {
      display: flex;
      gap: 8px;
      padding: 6px;
      background: rgba(255, 255, 255, 0.7);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border-radius: 20px;
      border: 1px solid rgba(255, 255, 255, 0.6);
      box-shadow: 0 12px 30px rgba(0, 0, 0, 0.04);
    }

    .tab-btn {
      padding: 10px 22px;
      background: transparent;
      border: none;
      cursor: pointer;
      font-size: 0.95rem;
      font-weight: 700;
      color: #64748b;
      border-radius: 15px;
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      display: flex;
      align-items: center;
      gap: 8px;
      user-select: none;
      letter-spacing: 0.3px;
    }

    .tab-btn:hover {
      color: #2D5A27;
      background: rgba(78, 141, 70, 0.08);
    }

    .tab-btn.active {
      color: white;
      background: linear-gradient(135deg, #2D5A27, #1A211B);
      border: 1px solid rgba(212, 168, 67, 0.3);
      box-shadow: 0 8px 20px rgba(45, 90, 39, 0.25);
      transform: translateY(-1px);
    }

    .tab-btn:active {
      transform: scale(0.96);
    }

    .tab-pane {
      display: flex;
      flex-direction: column;
      gap: 28px;
    }

    .m-top {
      margin-top: 4px;
    }

    /* Filters on the Map Floor Panel */
    .map-header-grid {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 16px;
      width: 100%;
    }

    .map-filters-panel {
      display: flex;
      gap: 12px;
      align-items: center;
      flex-wrap: wrap;
    }

    .filter-input-wrapper {
      position: relative;
    }

    .filter-input {
      padding: 10px 16px;
      background: rgba(255, 255, 255, 0.9);
      border: 1px solid #cbd5e1;
      border-radius: 10px;
      font-size: 0.88rem;
      font-weight: 600;
      color: #1e293b;
      outline: none;
      width: 200px;
      transition: all 0.2s ease;
    }

    .filter-input:focus {
      border-color: #2D5A27;
      box-shadow: 0 0 0 3px rgba(78, 141, 70, 0.15);
    }

    .filter-select {
      padding: 10px 16px;
      background: rgba(255, 255, 255, 0.9);
      border: 1px solid #cbd5e1;
      border-radius: 10px;
      font-size: 0.88rem;
      font-weight: 600;
      color: #1e293b;
      outline: none;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .filter-select:focus {
      border-color: #2D5A27;
      box-shadow: 0 0 0 3px rgba(78, 141, 70, 0.15);
    }

    .empty-floor-state {
      text-align: center;
      color: #94a3b8;
      padding: 24px;
      font-weight: 500;
      font-size: 0.88rem;
      width: 100%;
    }

    .dashboard-premium {
      display: flex;
      flex-direction: column;
      gap: 28px;
      font-family: 'Outfit', 'Inter', sans-serif;
      padding: 4px;
      max-width: 1400px;
      margin: 0 auto;
      width: 100%;
    }

    .glass-panel {
      background: rgba(255, 255, 255, 0.7);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border: 1px solid rgba(255, 255, 255, 0.5);
      border-radius: 16px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
      padding: 24px;
      transition: box-shadow 0.3s ease;
    }

    .glass-panel:hover {
      box-shadow: 0 6px 30px rgba(0, 0, 0, 0.07);
    }

    /* Header */
    /* Header aligned with Brand Theme */
    .dashboard-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 24px 32px;
      background: linear-gradient(135deg, #1A211B 0%, #2D5A27 100%); /* Fondo Oscuro Premium a Verde Selva */
      border: 1px solid rgba(212, 168, 67, 0.2); /* Borde Dorado Amazónico */
      border-radius: 20px;
      box-shadow: 0 10px 30px rgba(45, 90, 39, 0.15);
      position: relative;
      overflow: hidden;
    }

    .dashboard-header::before {
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

    .dashboard-header h1 {
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

    .dashboard-header .subtitle {
      margin: 6px 0 0;
      font-size: 0.98rem;
      color: rgba(255, 255, 255, 0.85); /* Alto contraste */
      font-weight: 500;
    }

    .header-profile {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .profile-info {
      display: flex;
      flex-direction: column;
      text-align: right;
    }

    .profile-name {
      font-weight: 700;
      font-size: 0.95rem;
      color: #0f172a;
    }

    .profile-role {
      font-size: 0.75rem;
      color: #6366f1;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .profile-avatar {
      font-size: 1.4rem;
      background: rgba(99, 102, 241, 0.1);
      color: #4f46e5;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      border: 1.5px solid rgba(99, 102, 241, 0.2);
    }

    /* Alerts section */
    .alerts-section {
      background: rgba(254, 242, 242, 0.6);
      border-color: rgba(239, 68, 68, 0.15);
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .section-title {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .section-title h2 {
      margin: 0;
      font-size: 1.15rem;
      font-weight: 800;
      color: #2D5A27; /* Verde Selva Principal */
      letter-spacing: -0.01em;
    }

    .alerts-container {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .alert-card {
      display: flex;
      align-items: center;
      gap: 14px;
      background: white;
      border-radius: 12px;
      padding: 12px 18px;
      border-left: 5px solid #cbd5e1;
      box-shadow: 0 2px 10px rgba(0,0,0,0.02);
      transition: transform 0.2s ease;
    }

    .alert-card:hover {
      transform: translateX(4px);
    }

    .alert-card.alert-urgente {
      border-left-color: #ef4444;
    }

    .alert-card.alert-advertencia {
      border-left-color: #f59e0b;
    }

    .alert-card.alert-info {
      border-left-color: #3b82f6;
    }

    .alert-card.alert-exito {
      border-left-color: #10b981;
    }

    .alert-icon {
      font-size: 1.3rem;
    }

    .alert-content {
      flex: 1;
    }

    .alert-message {
      margin: 0;
      font-size: 0.88rem;
      color: #334155;
      font-weight: 500;
    }

    .alert-time {
      font-size: 0.75rem;
      color: #94a3b8;
      display: block;
      margin-top: 2px;
    }

    .alert-badge {
      font-size: 0.7rem;
      font-weight: 700;
      text-transform: uppercase;
      padding: 3px 8px;
      border-radius: 999px;
    }

    .alert-badge.urgente { background: #fee2e2; color: #991b1b; }
    .alert-badge.advertencia { background: #fef3c7; color: #92400e; }
    .alert-badge.info { background: #dbeafe; color: #1e40af; }
    .alert-badge.exito { background: #d1fae5; color: #065f46; }

    /* KPIs Stats Grid */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(6, 1fr);
      gap: 24px;
    }

    .kpi-card {
      position: relative;
      overflow: hidden;
      padding: 20px;
    }

    .kpi-body {
      display: flex;
      align-items: center;
      gap: 16px;
      position: relative;
      z-index: 2;
    }

    .kpi-icon {
      font-size: 2.2rem;
      background: rgba(255, 255, 255, 0.9);
      width: 54px;
      height: 54px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 12px;
      box-shadow: 0 4px 10px rgba(0,0,0,0.03);
    }

    .kpi-info {
      display: flex;
      flex-direction: column;
      flex: 1;
    }

    .kpi-label {
      font-size: 0.8rem;
      color: #64748b;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .kpi-value {
      font-size: 1.7rem;
      font-weight: 800;
      color: #0f172a;
      line-height: 1.2;
      margin: 2px 0;
    }

    .kpi-value.small {
      font-size: 1.25rem;
    }

    .kpi-value.small .sub {
      font-size: 0.75rem;
      color: #64748b;
      font-weight: 500;
    }

    .kpi-subtext {
      font-size: 0.75rem;
      color: #94a3b8;
      font-weight: 500;
    }

    .kpi-subtext.primary {
      color: #2D5A27; /* Verde Selva */
      font-weight: 700;
    }

    .kpi-subtext.primary .sub {
      color: #64748b;
      font-weight: 500;
    }

    .kpi-progress-bar {
      width: 100%;
      height: 6px;
      background: #e2e8f0;
      border-radius: 10px;
      margin-top: 8px;
      overflow: hidden;
    }

    .kpi-progress-fill {
      height: 100%;
      background: #2D5A27; /* Verde Selva */
      border-radius: 10px;
      transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
    }

    /* KPI colors aligned to Hotel Brand Palette */
    .pct-card { background: linear-gradient(135deg, rgba(240, 253, 244, 0.8), rgba(220, 252, 231, 0.8)); border-color: rgba(78, 141, 70, 0.2); }
    .pct-card .kpi-value { color: #2D5A27; }
    .green-card .kpi-value { color: #4E8D46; } /* Verde Tropical */
    .green-card { background: linear-gradient(135deg, rgba(240, 253, 244, 0.8), rgba(220, 252, 231, 0.8)); border-color: rgba(78, 141, 70, 0.2); }
    .indigo-card .kpi-value { color: #8B5A2B; } /* Marrón Madera */
    .indigo-card { background: linear-gradient(135deg, rgba(251, 243, 235, 0.8), rgba(246, 229, 212, 0.8)); border-color: rgba(139, 90, 43, 0.2); }
    .orange-card .kpi-value { color: #D4A843; } /* Dorado Amazónico */
    .orange-card { background: linear-gradient(135deg, rgba(255, 251, 235, 0.8), rgba(254, 243, 199, 0.8)); border-color: rgba(212, 168, 67, 0.2); }


    /* Charts grid */
    .charts-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(360px, 1fr));
      gap: 24px;
    }

    .chart-card {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .chart-header {
      display: flex;
      flex-direction: column;
    }

    .chart-header h3 {
      margin: 0;
      font-size: 1.05rem;
      font-weight: 800;
      color: #2D5A27; /* Verde Selva Principal */
    }

    .chart-subtitle {
      font-size: 0.8rem;
      color: #64748b;
      margin-top: 2px;
    }

    .chart-body {
      min-height: 220px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .svg-chart {
      width: 100%;
      height: auto;
      overflow: visible;
    }

    .svg-label {
      font-size: 10px;
      fill: #64748b;
      font-family: inherit;
    }

    .svg-label.text-right { text-anchor: end; }
    .svg-label.text-center { text-anchor: middle; }

    /* SVG line chart */
    .chart-path-line {
      stroke-dasharray: 1000;
      stroke-dashoffset: 1000;
      animation: drawLine 2s forwards ease-in-out;
    }

    .chart-path-area {
      opacity: 0;
      animation: fadeIn 1.5s 0.8s forwards ease;
    }

    .chart-dot {
      cursor: pointer;
      transition: r 0.2s ease, fill 0.2s ease;
    }

    .chart-dot:hover {
      r: 8px;
      fill: #2D5A27;
    }

    /* Bar chart */
    .chart-bar {
      cursor: pointer;
      transition: transform 0.2s ease, filter 0.2s ease;
      transform-origin: bottom;
      animation: growBar 1.2s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
    }

    .chart-bar:hover {
      filter: brightness(1.1);
      transform: scaleY(1.03);
    }

    /* Donut chart */
    .donut-chart-body {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      justify-content: space-around;
      padding-top: 10px;
    }

    .donut-container {
      position: relative;
      width: 150px;
      height: 150px;
    }

    .svg-donut {
      width: 100%;
      height: 100%;
      transform: rotate(-90deg);
    }

    .donut-segment {
      cursor: pointer;
      transition: stroke-width 0.3s ease, filter 0.3s ease;
    }

    .donut-segment:hover {
      stroke-width: 25;
      filter: brightness(1.08);
    }

    .donut-center {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
    }

    .donut-center-val {
      font-size: 1.8rem;
      font-weight: 850;
      color: #0f172a;
      line-height: 1;
    }

    .donut-center-lbl {
      font-size: 0.65rem;
      color: #64748b;
      font-weight: 700;
      text-transform: uppercase;
      margin-top: 2px;
    }

    .legend-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 8px;
      width: 100%;
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.8rem;
      color: #334155;
      cursor: pointer;
      padding: 4px;
      border-radius: 6px;
      transition: background 0.2s ease;
    }

    .legend-item:hover {
      background: #f1f5f9;
    }

    .legend-color {
      width: 10px;
      height: 10px;
      border-radius: 3px;
      display: inline-block;
    }

    .legend-text {
      font-weight: 600;
      white-space: nowrap;
      text-overflow: ellipsis;
      overflow: hidden;
    }

    /* Horizontal ranking bars */
    .horizontal-bars {
      display: flex;
      flex-direction: column;
      gap: 16px;
      justify-content: center;
      width: 100%;
    }

    .horizontal-bar-row {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .row-header {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 0.88rem;
    }

    .rank-badge {
      background: #f1f5f9;
      color: #475569;
      font-weight: 850;
      font-size: 0.72rem;
      width: 22px;
      height: 22px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 6px;
    }

    .rank-name {
      color: #0f172a;
      flex: 1;
    }

    .rank-val {
      color: #64748b;
      font-size: 0.8rem;
    }

    .progress-bar-container {
      width: 100%;
      height: 10px;
      background: #e2e8f0;
      border-radius: 99px;
      overflow: hidden;
    }

    .progress-bar-fill {
      height: 100%;
      border-radius: 99px;
      width: 0;
      transition: width 1s cubic-bezier(0.175, 0.885, 0.32, 1.1) 0.2s;
    }

    /* Tooltip */
    .chart-tooltip {
      position: absolute;
      background: rgba(15, 23, 42, 0.95);
      color: white;
      padding: 8px 12px;
      border-radius: 8px;
      font-size: 0.78rem;
      font-weight: 600;
      pointer-events: none;
      z-index: 9999;
      box-shadow: 0 4px 15px rgba(0,0,0,0.15);
      opacity: 0;
      transform: scale(0.9);
      transition: opacity 0.15s ease, transform 0.15s ease;
      white-space: nowrap;
      border: 1px solid rgba(255,255,255,0.1);
    }

    .chart-tooltip.visible {
      opacity: 1;
      transform: scale(1);
    }

    /* Floors section map */
    .floors-section {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .floors-header-panel {
      padding: 16px 24px;
    }

    .floors-header-panel h2 {
      margin: 0;
      font-size: 1.2rem;
      font-weight: 750;
      color: #0f172a;
    }

    .section-subtitle {
      margin: 2px 0 0;
      font-size: 0.85rem;
      color: #64748b;
    }

    .floors-container {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .floor-group {
      padding: 0;
      overflow: hidden;
    }

    .floor-header {
      padding: 18px 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      cursor: pointer;
      background: rgba(255, 255, 255, 0.3);
      user-select: none;
      transition: background 0.2s ease;
    }

    .floor-header:hover {
      background: rgba(78, 141, 70, 0.05);
    }

    .floor-title {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .floor-title h3 {
      margin: 0;
      font-size: 1.05rem;
      font-weight: 750;
      color: #1e293b;
    }

    .chevron {
      width: 8px;
      height: 8px;
      border-right: 2px solid #64748b;
      border-bottom: 2px solid #64748b;
      transform: rotate(45deg);
      transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      margin-right: 4px;
    }

    .floor-group.collapsed .chevron {
      transform: rotate(-45deg);
    }

    .floor-group.collapsed .floor-content-wrapper {
      height: 0;
      padding: 0 24px;
      opacity: 0;
      pointer-events: none;
    }

    .floor-content-wrapper {
      padding: 20px 24px 24px;
      border-top: 1px solid rgba(0,0,0,0.04);
      height: auto;
      opacity: 1;
      transition: height 0.35s cubic-bezier(0.4, 0, 0.2, 1), padding 0.35s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.25s ease;
    }

    .rooms-count-badge {
      background: rgba(78, 141, 70, 0.1);
      color: #2D5A27;
      font-size: 0.72rem;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 99px;
    }

    .floor-summary-badges {
      display: flex;
      gap: 10px;
    }

    .floor-summary-badges .badge {
      font-size: 0.72rem;
      font-weight: 600;
      padding: 3px 10px;
      border-radius: 6px;
    }

    .floor-summary-badges .badge.disponible { background: #e0f2fe; color: #0369a1; }
    .floor-summary-badges .badge.ocupada { background: #f3e8ff; color: #6b21a8; }

    /* Rooms Grid */
    .habitaciones-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
      gap: 12px;
    }

    .habitacion-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 12px 8px;
      border-radius: 12px;
      cursor: pointer;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s ease, border-color 0.2s ease;
      text-decoration: none;
      position: relative;
    }

    .habitacion-card:hover {
      transform: translateY(-4px) scale(1.02);
      box-shadow: 0 4px 12px rgba(0,0,0,0.06);
    }

    .hab-badge {
      font-size: 0.58rem;
      font-weight: 700;
      text-transform: uppercase;
      padding: 1px 6px;
      border-radius: 4px;
      margin-bottom: 6px;
    }

    .habitacion-card .numero {
      font-weight: 800;
      font-size: 1.15rem;
      color: #0f172a;
      line-height: 1.1;
    }

    .habitacion-card .tipo {
      font-size: 0.65rem;
      color: #64748b;
      margin-top: 4px;
      font-weight: 600;
      text-transform: capitalize;
    }

    /* Room status colors */
    .habitacion-card.disponible {
      background: #f0fdf4;
      border-color: #bbf7d0;
    }
    .habitacion-card.disponible .hab-badge { background: #dcfce7; color: #166534; }

    .habitacion-card.ocupada {
      background: #fdf2f8;
      border-color: #fbcfe8;
    }
    .habitacion-card.ocupada .hab-badge { background: #fce7f3; color: #9d174d; }

    .habitacion-card.limpiar {
      background: #fffbeb;
      border-color: #fde68a;
    }
    .habitacion-card.limpiar .hab-badge { background: #fef3c7; color: #92400e; }

    .habitacion-card.limpieza {
      background: #eff6ff;
      border-color: #bfdbfe;
    }
    .habitacion-card.limpieza .hab-badge { background: #dbeafe; color: #1e40af; }

    .habitacion-card.mantenimiento {
      background: #faf5ff;
      border-color: #e9d5ff;
    }
    .habitacion-card.mantenimiento .hab-badge { background: #f3e8ff; color: #6b21a8; }

    .habitacion-card.remodelacion {
      background: #fff7ed;
      border-color: #ffedd5;
    }
    .habitacion-card.remodelacion .hab-badge { background: #ffedd5; color: #c2410c; }

    .habitacion-card.inhabitable {
      background: #f1f5f9;
      border-color: #cbd5e1;
    }
    .habitacion-card.inhabitable .hab-badge { background: #cbd5e1; color: #334155; }

    /* Active stays list */
    .estadias-section {
      margin-top: 10px;
    }

    .table-responsive-wrapper {
      width: 100%;
      overflow-x: auto;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
    }

    .premium-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
      font-size: 0.88rem;
    }

    .premium-table th {
      background: #f8fafc;
      padding: 14px 18px;
      font-weight: 700;
      color: #475569;
      border-bottom: 1.5px solid #e2e8f0;
      text-transform: uppercase;
      font-size: 0.72rem;
      letter-spacing: 0.05em;
    }

    .premium-table td {
      padding: 14px 18px;
      color: #334155;
      border-bottom: 1px solid #f1f5f9;
    }

    .premium-table tr:hover td {
      background: rgba(78, 141, 70, 0.015);
    }

    .premium-table .font-semibold { font-weight: 600; }
    .premium-table .font-bold { font-weight: 800; }
    .premium-table .text-indigo { color: #2D5A27; }
    
    .premium-table .monto-total {
      font-weight: 850;
      color: #0f172a;
    }

    .premium-table .badge {
      font-size: 0.72rem;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: 6px;
    }

    .active-badge {
      background: #d1fae5;
      color: #065f46;
    }

    .empty-state {
      padding: 28px;
      color: #94a3b8;
      font-weight: 500;
    }

    /* Animations */
    .fade-in {
      animation: fadeIn 0.4s ease-out forwards;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(8px); }
      to { opacity: 1; transform: translateY(0); }
    }

    @keyframes drawLine {
      to { stroke-dashoffset: 0; }
    }

    @keyframes growBar {
      from { transform: scaleY(0); }
      to { transform: scaleY(1); }
    }

    @media (max-width: 1200px) {
      .stats-grid {
        grid-template-columns: repeat(3, 1fr) !important;
        gap: 20px;
      }
    }

    @media (max-width: 1024px) {
      .dashboard-premium {
        padding: 4px;
        gap: 20px;
      }
      .dashboard-header {
        padding: 16px 20px;
      }
      .dashboard-header h1 {
        font-size: 1.5rem;
      }
    }

    @media (max-width: 768px) {
      .dashboard-premium {
        gap: 16px;
      }
      .dashboard-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 12px;
        padding: 14px 16px;
      }
      .header-profile {
        align-self: flex-start;
        margin-top: 4px;
      }
      .charts-grid {
        grid-template-columns: 1fr !important;
        gap: 16px;
      }
      .glass-panel {
        padding: 16px;
      }
      .tabs-navigation-wrapper {
        margin: -4px 0 4px 0;
        justify-content: flex-start;
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;
        padding: 4px 0;
        width: 100%;
      }
      .tabs-navigation-wrapper::-webkit-scrollbar {
        display: none; /* Oculta barra de scroll para estética limpia */
      }
      .tabs-header-container {
        padding: 4px;
        border-radius: 12px;
        flex-shrink: 0;
      }
      .tab-btn {
        padding: 8px 14px;
        font-size: 0.82rem;
        border-radius: 8px;
        white-space: nowrap;
      }
    }

    @media (max-width: 576px) {
      .stats-grid {
        grid-template-columns: repeat(2, 1fr) !important;
        gap: 12px !important;
      }
      .kpi-card {
        padding: 12px !important;
      }
      .kpi-body {
        gap: 10px !important;
      }
      .kpi-icon {
        font-size: 1.5rem !important;
        width: 40px !important;
        height: 40px !important;
        border-radius: 8px !important;
      }
      .kpi-label {
        font-size: 0.7rem !important;
      }
      .kpi-value {
        font-size: 1.15rem !important;
      }
      .kpi-value.small {
        font-size: 0.95rem !important;
      }
      .kpi-subtext {
        font-size: 0.62rem !important;
      }
      .movement-stats {
        gap: 4px !important;
        font-size: 0.75rem !important;
        margin: 2px 0 !important;
      }
      
      .map-header-grid {
        gap: 12px;
      }
      .map-filters-panel {
        flex-direction: column;
        align-items: stretch;
        width: 100%;
        gap: 8px;
      }
      .filter-input-wrapper, .filter-select-wrapper, .filter-input, .filter-select {
        width: 100% !important;
      }
      
      .table-responsive-wrapper {
        border-radius: 8px;
      }
      .premium-table th, .premium-table td {
        padding: 10px 12px;
        font-size: 0.78rem;
      }
      
      .floor-header {
        padding: 12px 14px !important;
      }
      .floor-header h3 {
        font-size: 0.92rem !important;
      }
      .rooms-count-badge {
        font-size: 0.68rem !important;
        padding: 2px 6px !important;
      }
      .floor-summary-badges .badge {
        font-size: 0.62rem !important;
        padding: 2px 6px !important;
      }
      
      .habitaciones-grid {
        grid-template-columns: repeat(auto-fill, minmax(80px, 1fr)) !important;
        gap: 8px !important;
      }
      .habitacion-card {
        padding: 8px 4px !important;
        border-radius: 8px !important;
      }
      .habitacion-card .numero {
        font-size: 0.95rem !important;
      }
      .habitacion-card .tipo {
        font-size: 0.58rem !important;
        margin-top: 2px !important;
      }
      .hab-badge {
        font-size: 0.5rem !important;
        padding: 1px 4px !important;
        margin-bottom: 4px !important;
      }
    }
  `]
})
export class DashboardComponent implements OnInit {
  resumen?: ResumenDashboardResponse;
  graficos?: DashboardGraficosResponse;
  alertas: AlertaDashboardResponse[] = [];
  todasHabitaciones: HabitacionResponse[] = [];
  estadiasActivas: EstadiaResponse[] = [];

  tabActivo = 'resumen';
  busquedaNumero = '';
  filtroEstado = '';
  filtroPiso = '';

  // Collapsed state map for floors
  floorCollapsedMap: { [key: number]: boolean } = {
    2: false,
    3: false
  };

  // 1. Ocupación Line Chart Calculations
  svgLinePath = '';
  svgAreaPath = '';
  lineChartPoints: { x: number; y: number; label: string; val: number }[] = [];

  // 2. Ingresos Bar Chart Calculations
  barChartPoints: { x: number; y: number; height: number; label: string; val: number; color: string }[] = [];
  barMaxVal = 10000;

  // 3. Distribución Estados Donut Chart Calculations
  donutSlices: { label: string; val: number; color: string; offset: number; transform: string }[] = [];
  donutCircumference = 2 * Math.PI * 70; // 439.82
  totalHabitaciones = 56;

  // 4. Ranking progress
  ranking: { name: string; value: number; percentage: number }[] = [];

  // Tooltip UI State
  tooltipVisible = false;
  tooltipText = '';
  tooltipX = 0;
  tooltipY = 0;
  activeChart = '';

  constructor(
    private habitacionService: HabitacionService,
    private reservaService: ReservaService,
    private dashboardService: DashboardService,
    public auth: AuthService
  ) { }

  getAlertIcon(tipo: string): string {
    if (!tipo) return 'bi bi-info-circle-fill text-sky-600';
    const t = tipo.toUpperCase();
    if (t === 'URGENTE') return 'bi bi-exclamation-circle-fill text-red-600';
    if (t === 'ADVERTENCIA') return 'bi bi-exclamation-triangle-fill text-amber-500';
    if (t === 'EXITO' || t === 'ÉXITO') return 'bi bi-check-circle-fill text-emerald-600';
    return 'bi bi-info-circle-fill text-sky-600';
  }

  ngOnInit(): void {
    // 1. Cargar KPIs Resumen
    this.dashboardService.getResumen().subscribe({
      next: (res) => {
        this.resumen = res;
      }
    });

    // 2. Cargar Gráficos
    this.dashboardService.getGraficos().subscribe({
      next: (res) => {
        this.graficos = res;
        this.calcularGraficoLineas(res.ocupacionSemana);
        this.calcularGraficoBarras(res.ingresosTipo);
        this.calcularGraficoDonut(res.distribucionEstados);
        this.calcularRanking(res.rankingHabitaciones);
      }
    });

    // 3. Cargar Alertas
    this.dashboardService.getAlertas().subscribe({
      next: (res) => {
        this.alertas = res;
      }
    });

    // 4. Cargar listados de habitaciones agrupadas
    this.habitacionService.getAll().subscribe({
      next: (habitaciones) => {
        this.totalHabitaciones = habitaciones.length;
        this.todasHabitaciones = habitaciones;
      }
    });

    // 5. Cargar estadías activas
    if (this.auth.esGerente()) {
      this.reservaService.getEstadiasActivas().subscribe({
        next: (estadias) => {
          this.estadiasActivas = estadias;
        }
      });
    }
  }

  // Reactive filters getter for Floor Map
  getPisosFiltrados(): { numero: number; habitaciones: HabitacionResponse[] }[] {
    let filtradas = this.todasHabitaciones.filter(h => h.piso === 2 || h.piso === 3);

    if (this.busquedaNumero) {
      const term = this.busquedaNumero.trim();
      filtradas = filtradas.filter(h => h.numero.includes(term));
    }
    if (this.filtroEstado) {
      filtradas = filtradas.filter(h => h.estadoActual.toLowerCase() === this.filtroEstado.toLowerCase());
    }
    if (this.filtroPiso) {
      filtradas = filtradas.filter(h => h.piso === parseInt(this.filtroPiso));
    }

    const pisosMap = new Map<number, HabitacionResponse[]>();
    filtradas.forEach(h => {
      if (!pisosMap.has(h.piso)) pisosMap.set(h.piso, []);
      pisosMap.get(h.piso)!.push(h);
    });

    return Array.from(pisosMap.entries())
      .map(([numero, habitaciones]) => ({ numero, habitaciones }))
      .sort((a, b) => a.numero - b.numero);
  }

  // Toggle Floor view
  toggleFloor(pisoNum: number): void {
    this.floorCollapsedMap[pisoNum] = !this.floorCollapsedMap[pisoNum];
  }

  // Count helper
  getRoomsCountByEstado(rooms: HabitacionResponse[], estado: string): number {
    return rooms.filter(r => r.estadoActual === estado).length;
  }



  // Calculation for Line Chart (Occupancy)
  calcularGraficoLineas(puntos: { name: string; value: number }[]): void {
    if (!puntos || puntos.length === 0) return;
    const paddingLeft = 60;
    const paddingRight = 460;
    const width = paddingRight - paddingLeft;
    const step = width / (puntos.length - 1);

    this.lineChartPoints = puntos.map((p, i) => {
      const x = paddingLeft + i * step;
      // Convert percentage (0 to 100) to Y coordinates (220 to 20)
      const y = 220 - (p.value * 200) / 100;
      return { x, y, label: p.name, val: p.value };
    });

    // Construct path line
    this.svgLinePath = this.lineChartPoints.reduce((path, p, i) => {
      return path + (i === 0 ? `M ${p.x} ${p.y}` : ` L ${p.x} ${p.y}`);
    }, '');

    // Area path goes to the base of Y=220
    if (this.lineChartPoints.length > 0) {
      const first = this.lineChartPoints[0];
      const last = this.lineChartPoints[this.lineChartPoints.length - 1];
      this.svgAreaPath = `${this.svgLinePath} L ${last.x} 220 L ${first.x} 220 Z`;
    }
  }

  // Calculation for Bar Chart (Revenue)
  calcularGraficoBarras(puntos: { name: string; value: number }[]): void {
    if (!puntos || puntos.length === 0) return;
    const maxVal = Math.max(...puntos.map(p => p.value), 1000);
    // Round up maxVal to a pretty number
    this.barMaxVal = Math.ceil(maxVal / 1000) * 1000;

    const startX = 100;
    const endX = 400;
    const step = (endX - startX) / (puntos.length - 1);

    const colors = ['#2D5A27', '#D4A843', '#8B5A2B']; // Verde Selva, Dorado Amazónico, Marrón Madera

    this.barChartPoints = puntos.map((p, i) => {
      const x = startX + i * step;
      // height from bottom Y=220 up to Y=20 (height is relative)
      const height = (p.value * 200) / this.barMaxVal;
      const y = 220 - height;
      return {
        x,
        y,
        height,
        label: p.name,
        val: Math.round(p.value),
        color: colors[i % colors.length]
      };
    });
  }

  // Calculation for Donut Chart (States)
  calcularGraficoDonut(puntos: { name: string; value: number }[]): void {
    if (!puntos || puntos.length === 0) return;
    const total = puntos.reduce((sum, p) => sum + p.value, 0);
    this.totalHabitaciones = total || 56;

    const colorsMap: { [key: string]: string } = {
      'Disponible': '#4E8D46', // Verde Tropical
      'Ocupada': '#8B5A2B', // Marrón Madera
      'Por limpiar': '#D4A843', // Dorado Amazónico
      'En limpieza': '#2D5A27', // Verde Selva
      'Mantenimiento': '#64748b', // Gris Slate
      'Remodelación': '#d97706', // Naranja
      'Inhabitable': '#dc2626' // Rojo
    };

    let accumulatedPct = 0;
    this.donutSlices = puntos
      .filter(p => p.value > 0)
      .map(p => {
        const val = p.value;
        const color = colorsMap[p.name] || '#cbd5e1';
        const fraction = val / this.totalHabitaciones;

        // Donut circle math: stroke-dashoffset = circumference - (fraction * circumference)
        const offset = this.donutCircumference - (fraction * this.donutCircumference);
        const rotationAngle = accumulatedPct * 360;
        accumulatedPct += fraction;

        return {
          label: p.name,
          val,
          color,
          offset,
          transform: `rotate(${rotationAngle} 100 100)`
        };
      });
  }

  // Calculation for horizontal progress ranking
  calcularRanking(puntos: { name: string; value: number }[]): void {
    if (!puntos || puntos.length === 0) return;
    const maxVal = Math.max(...puntos.map(p => p.value), 1);
    this.ranking = puntos.map(p => ({
      name: p.name,
      value: p.value,
      percentage: (p.value * 100) / maxVal
    }));
  }

  // Tooltip controllers
  showTooltip(event: MouseEvent, text: string, chart: string): void {
    this.tooltipText = text;
    this.activeChart = chart;
    this.updateTooltipPosition(event);
    this.tooltipVisible = true;
  }

  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: MouseEvent): void {
    if (this.tooltipVisible) {
      this.updateTooltipPosition(event);
    }
  }

  private updateTooltipPosition(event: MouseEvent): void {
    if (!this.activeChart) return;
    const chartBody = document.querySelector('.' + this.activeChart + '-chart-body') as HTMLElement;
    if (chartBody) {
      const rect = chartBody.getBoundingClientRect();
      this.tooltipX = event.clientX - rect.left + 15;
      this.tooltipY = event.clientY - rect.top - 40;
    } else {
      this.tooltipX = event.clientX + 15;
      this.tooltipY = event.clientY - 40;
    }
  }

  clearTooltip(): void {
    this.tooltipVisible = false;
    this.activeChart = '';
  }
}
