import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReporteService } from '../../core/services/reporte.service';
import { ExcelReportService } from '../../core/services/excel-report.service';

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="reportes-container fade-in">
      <!-- CABECERA BANNER -->
      <div class="header-section">
        <div class="title-area">
          <h2><i class="header-icon-premium bi bi-bar-chart-line-fill"></i> Reportes Gerenciales</h2>
          <p class="subtitle">Panel analítico y KPIs de hospitalidad en tiempo real del PMS</p>
        </div>

        <div class="controls-section glass-panel">
          <div class="date-inputs">
            <div class="input-group">
              <label>Desde</label>
              <input type="date" [(ngModel)]="fechaDesde" (change)="onDateChange()" class="form-control" />
            </div>
            <div class="input-group">
              <label>Hasta</label>
              <input type="date" [(ngModel)]="fechaHasta" (change)="onDateChange()" class="form-control" />
            </div>
          </div>

          <div class="action-buttons">
            <button class="btn-primary-custom" (click)="cargarDatos()" [disabled]="loading">
              <span *ngIf="!loading"><i class="bi bi-arrow-clockwise mr-1"></i> Actualizar</span>
              <span *ngIf="loading"><i class="bi bi-hourglass-split mr-1"></i> Cargando...</span>
            </button>
            <button class="btn-success-custom" (click)="exportarExcel()" [disabled]="!reporte || loading">
              <i class="bi bi-file-earmark-excel-fill mr-1"></i> Exportar Excel
            </button>
          </div>
        </div>
      </div>


      <!-- Estado de Carga -->
      <div class="loading-overlay" *ngIf="loading">
        <div class="spinner"></div>
        <p>Procesando estadísticas y comparativas históricas...</p>
      </div>

      <div class="dashboard-content" *ngIf="!loading && reporte">
        <!-- Pestañas Corporativas Centradas -->
        <nav class="centered-tabs glass-card">
          <button [class.active]="activeTab === 'resumen'" (click)="activeTab = 'resumen'">
            <i class="bi bi-bar-chart-fill mr-1"></i> Resumen
          </button>
          <button [class.active]="activeTab === 'ocupacion'" (click)="activeTab = 'ocupacion'">
            <i class="bi bi-graph-up-arrow mr-1"></i> Ocupación
          </button>
          <button [class.active]="activeTab === 'ingresos'" (click)="activeTab = 'ingresos'">
            <i class="bi bi-currency-dollar mr-1"></i> Ingresos & Gastos
          </button>
          <button [class.active]="activeTab === 'habitaciones'" (click)="activeTab = 'habitaciones'">
            <i class="bi bi-door-closed-fill mr-1"></i> Habitaciones
          </button>
          <button [class.active]="activeTab === 'cancelaciones'" (click)="activeTab = 'cancelaciones'">
            <i class="bi bi-x-circle-fill mr-1"></i> Canales & Cancelaciones
          </button>
          <button [class.active]="activeTab === 'proyeccion'" (click)="activeTab = 'proyeccion'">
            <i class="bi bi-magic mr-1"></i> Proyecciones
          </button>
        </nav>

        <!-- ========================================== -->
        <!-- PESTAÑA: RESUMEN EJECUTIVO                 -->
        <!-- ========================================== -->
        <section class="tab-pane animate-fade-in" *ngIf="activeTab === 'resumen'">
          <!-- Fila de Tarjetas KPI -->
          <div class="kpi-grid">
            <!-- KPI: Ocupación -->
            <div class="kpi-card glass-card">
              <div class="kpi-header">
                <span class="kpi-title">Ocupación Promedio</span>
                <span class="kpi-icon blue"><i class="bi bi-building"></i></span>
              </div>
              <div class="kpi-value">{{ reporte.kpis.ocupacion.valorActual | number:'1.2-2' }}%</div>
              <div class="kpi-footer">
                <span class="trend-badge" [class.up]="reporte.kpis.ocupacion.tendencia === 'up'" [class.down]="reporte.kpis.ocupacion.tendencia === 'down'">
                  <i class="bi" [class.bi-caret-up-fill]="reporte.kpis.ocupacion.tendencia === 'up'" [class.bi-caret-down-fill]="reporte.kpis.ocupacion.tendencia === 'down'"></i>
                  {{ getAbsoluteValue(reporte.kpis.ocupacion.porcentajeCambio) | number:'1.2-2' }}%
                </span>
                <span class="prev-label">vs período anterior</span>
              </div>
              <!-- Mini Sparkline SVG -->
              <div class="sparkline-container">
                <svg class="sparkline" viewBox="0 0 80 30">
                  <path fill="none" stroke="#2D5A27" stroke-width="2" [attr.d]="getSparklinePath()"></path>
                </svg>
              </div>
            </div>

            <!-- KPI: Tarifa Diaria Promedio -->
            <div class="kpi-card glass-card">
              <div class="kpi-header">
                <span class="kpi-title">Tarifa Diaria Promedio</span>
                <span class="kpi-icon emerald"><i class="bi bi-cash-stack"></i></span>
              </div>
              <div class="kpi-value">S/ {{ reporte.kpis.adr.valorActual | number:'1.2-2' }}</div>
              <div class="kpi-footer">
                <span class="trend-badge" [class.up]="reporte.kpis.adr.tendencia === 'up'" [class.down]="reporte.kpis.adr.tendencia === 'down'">
                  <i class="bi" [class.bi-caret-up-fill]="reporte.kpis.adr.tendencia === 'up'" [class.bi-caret-down-fill]="reporte.kpis.adr.tendencia === 'down'"></i>
                  {{ getAbsoluteValue(reporte.kpis.adr.porcentajeCambio) | number:'1.2-2' }}%
                </span>
                <span class="prev-label">vs período anterior</span>
              </div>
              <div class="sparkline-container">
                <svg class="sparkline" viewBox="0 0 80 30">
                  <path fill="none" stroke="#4E8D46" stroke-width="2" [attr.d]="getSparklinePath()"></path>
                </svg>
              </div>
            </div>

            <!-- KPI: Ingreso por Habitación Disponible -->
            <div class="kpi-card glass-card">
              <div class="kpi-header">
                <span class="kpi-title">Ingreso por Habitación Disponible</span>
                <span class="kpi-icon indigo"><i class="bi bi-graph-up"></i></span>
              </div>
              <div class="kpi-value">S/ {{ reporte.kpis.revPar.valorActual | number:'1.2-2' }}</div>
              <div class="kpi-footer">
                <span class="trend-badge" [class.up]="reporte.kpis.revPar.tendencia === 'up'" [class.down]="reporte.kpis.revPar.tendencia === 'down'">
                  <i class="bi" [class.bi-caret-up-fill]="reporte.kpis.revPar.tendencia === 'up'" [class.bi-caret-down-fill]="reporte.kpis.revPar.tendencia === 'down'"></i>
                  {{ getAbsoluteValue(reporte.kpis.revPar.porcentajeCambio) | number:'1.2-2' }}%
                </span>
                <span class="prev-label">vs período anterior</span>
              </div>
              <div class="sparkline-container">
                <svg class="sparkline" viewBox="0 0 80 30">
                  <path fill="none" stroke="#8B5A2B" stroke-width="2" [attr.d]="getSparklinePath()"></path>
                </svg>
              </div>
            </div>

            <!-- KPI: Estadía Promedio -->
            <div class="kpi-card glass-card">
              <div class="kpi-header">
                <span class="kpi-title">Estadía Promedio</span>
                <span class="kpi-icon purple"><i class="bi bi-moon-stars"></i></span>
              </div>
              <div class="kpi-value">{{ reporte.kpis.alos.valorActual | number:'1.1-1' }} <span class="val-sub">noches</span></div>
              <div class="kpi-footer">
                <span class="trend-badge" [class.up]="reporte.kpis.alos.tendencia === 'up'" [class.down]="reporte.kpis.alos.tendencia === 'down'">
                  <i class="bi" [class.bi-caret-up-fill]="reporte.kpis.alos.tendencia === 'up'" [class.bi-caret-down-fill]="reporte.kpis.alos.tendencia === 'down'"></i>
                  {{ getAbsoluteValue(reporte.kpis.alos.porcentajeCambio) | number:'1.1-1' }}%
                </span>
                <span class="prev-label">vs período anterior</span>
              </div>
              <div class="sparkline-container">
                <svg class="sparkline" viewBox="0 0 80 30">
                  <path fill="none" stroke="#D4A843" stroke-width="2" [attr.d]="getSparklinePath()"></path>
                </svg>
              </div>
            </div>

            <!-- KPI: Cancelación -->
            <div class="kpi-card glass-card">
              <div class="kpi-header">
                <span class="kpi-title">Tasa de Cancelación</span>
                <span class="kpi-icon red"><i class="bi bi-slash-circle"></i></span>
              </div>
              <div class="kpi-value">{{ reporte.kpis.tasaCancelacion.valorActual | number:'1.2-2' }}%</div>
              <div class="kpi-footer">
                <!-- Para cancelación, bajar es positivo (verde) -->
                <span class="trend-badge" [class.up]="reporte.kpis.tasaCancelacion.tendencia === 'down'" [class.down]="reporte.kpis.tasaCancelacion.tendencia === 'up'" [class.invert-trend]="true">
                  <i class="bi" [class.bi-caret-down-fill]="reporte.kpis.tasaCancelacion.tendencia === 'down'" [class.bi-caret-up-fill]="reporte.kpis.tasaCancelacion.tendencia === 'up'"></i>
                  {{ reporte.kpis.tasaCancelacion.tendencia === 'down' ? 'Mejor' : 'Peor' }} 
                  {{ getAbsoluteValue(reporte.kpis.tasaCancelacion.porcentajeCambio) | number:'1.2-2' }}%
                </span>
                <span class="prev-label">vs período anterior</span>
              </div>
              <div class="sparkline-container">
                <svg class="sparkline" viewBox="0 0 80 30">
                  <path fill="none" stroke="#b91c1c" stroke-width="2" [attr.d]="getSparklinePath()"></path>
                </svg>
              </div>
            </div>
          </div>

          <!-- Gráfico de Resumen Financiero Rápido -->
          <div class="summary-details-grid">
            <div class="summary-chart-card glass-card">
              <h3><i class="bi bi-cash-coin text-verde-selva mr-2"></i> Balance Financiero Consolidado</h3>
              <p class="section-desc">Comparativa de ingresos por reservas, gastos operativos y beneficios reales.</p>

              <div class="financial-bars">
                <!-- Ingresos -->
                <div class="fin-item">
                  <div class="fin-label">
                    <span>Ingresos por Reservas</span>
                    <span class="amount positive">S/ {{ reporte.kpis.totalIngresos | number:'1.2-2' }}</span>
                  </div>
                  <div class="fin-progress-track">
                    <div class="fin-progress-fill positive" [style.width.%]="100"></div>
                  </div>
                  <small class="fin-prev">Período previo: S/ {{ reporte.kpis.totalIngresosAnterior | number:'1.2-2' }}</small>
                </div>

                <!-- Gastos -->
                <div class="fin-item">
                  <div class="fin-label">
                    <span>Gastos Operativos</span>
                    <span class="amount negative">S/ {{ reporte.kpis.totalGastos | number:'1.2-2' }}</span>
                  </div>
                  <div class="fin-progress-track">
                    <div class="fin-progress-fill negative" [style.width.%]="getExpensePercentage()"></div>
                  </div>
                  <small class="fin-prev">Período previo: S/ {{ reporte.kpis.totalGastosAnterior | number:'1.2-2' }}</small>
                </div>

                <!-- Neto -->
                <div class="fin-item">
                  <div class="fin-label">
                    <span>Ganancia Neta</span>
                    <span class="amount neutral">S/ {{ reporte.kpis.gananciaNeta | number:'1.2-2' }}</span>
                  </div>
                  <div class="fin-progress-track">
                    <div class="fin-progress-fill neutral" [style.width.%]="getNetPercentage()"></div>
                  </div>
                  <small class="fin-prev">Período previo: S/ {{ reporte.kpis.gananciaNetaAnterior | number:'1.2-2' }}</small>
                </div>
              </div>
            </div>

            <!-- Resumen de limpieza -->
            <div class="limpieza-summary-card glass-card" *ngIf="limpiezaResumen">
              <h3><i class="bi bi-brush-fill text-dorado-amazonico mr-2"></i> Eficiencia en Limpieza</h3>
              <p class="section-desc">Promedio operacional registrado en mantenimiento de habitaciones.</p>

              <div class="limpieza-circle-container">
                <div class="limpieza-circle">
                  <div class="limpieza-circle-val">{{ limpiezaResumen.promedioDuracionGlobalMinutos }}</div>
                  <div class="limpieza-circle-unit">minutos</div>
                </div>
                <div class="limpieza-info">
                  <div class="info-block">
                    <strong>{{ limpiezaResumen.promedioDuracionGlobalSegundos }} segundos</strong>
                    <span>Duración absoluta promedio</span>
                  </div>
                  <div class="info-block success">
                    <strong>Operación Activa</strong>
                    <span>Estadísticas de limpieza</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- ========================================== -->
        <!-- PESTAÑA: OCUPACIÓN DIARIA                  -->
        <!-- ========================================== -->
        <section class="tab-pane animate-fade-in" *ngIf="activeTab === 'ocupacion'">
          <div class="chart-full-card glass-card">
            <div class="chart-header-custom">
              <div>
                <h3><i class="bi bi-graph-up-arrow text-verde-selva mr-2"></i> Curva de Ocupación Diaria (%)</h3>
                <p class="section-desc">Monitoreo de noches ocupadas contra el inventario disponible (56 habitaciones).</p>
              </div>
              <div class="legend">
                <span class="dot-legend"></span> Ocupación (%)
              </div>
            </div>

            <!-- Gráfico SVG Interactivo con Tooltip -->
            <div class="svg-chart-container" (mouseleave)="leavePoint()">
              <svg viewBox="0 0 1000 300" class="svg-chart">
                <defs>
                  <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="rgba(45, 90, 39, 0.4)" />
                    <stop offset="100%" stop-color="rgba(45, 90, 39, 0.0)" />
                  </linearGradient>
                </defs>

                <!-- Líneas de división horizontal -->
                <line x1="50" y1="50" x2="950" y2="50" stroke="rgba(45,90,39,0.06)" stroke-dasharray="4"/>
                <line x1="50" y1="116" x2="950" y2="116" stroke="rgba(45,90,39,0.06)" stroke-dasharray="4"/>
                <line x1="50" y1="183" x2="950" y2="183" stroke="rgba(45,90,39,0.06)" stroke-dasharray="4"/>
                <line x1="50" y1="250" x2="950" y2="250" stroke="rgba(45,90,39,0.12)" stroke-width="1.5"/>

                <!-- Leyendas Y -->
                <text x="25" y="55" class="chart-text">100%</text>
                <text x="25" y="121" class="chart-text">66%</text>
                <text x="25" y="188" class="chart-text">33%</text>
                <text x="25" y="255" class="chart-text">0%</text>

                <!-- Relleno bajo la curva -->
                <path fill="url(#chartGrad)" [attr.d]="getAreaPath()"></path>

                <!-- Línea de la curva -->
                <polyline fill="none" stroke="#2D5A27" stroke-width="4" [attr.points]="getLinePoints()" stroke-linecap="round"></polyline>

                <!-- Puntos interactivos -->
                <g *ngFor="let od of reporte.ocupacionDiaria; let i = index">
                  <circle [attr.cx]="getXCoordinate(i)" [attr.cy]="getYCoordinate(od.porcentaje)" r="6" 
                          fill="#ffffff" stroke="#2D5A27" stroke-width="3" class="chart-dot"
                          (mouseenter)="hoverPoint(od, i, $event)"></circle>
                </g>
              </svg>

              <!-- Tooltip Interactivo Flotante -->
              <div class="chart-tooltip glass-card" *ngIf="activeTooltip" 
                   [style.left.px]="tooltipX" [style.top.px]="tooltipY">
                <div class="tooltip-date">{{ activeTooltip.fecha }}</div>
                <div class="tooltip-metric">
                  <strong>Ocupación:</strong> {{ activeTooltip.porcentaje | number:'1.2-2' }}%
                </div>
                <div class="tooltip-sub">
                  <i class="bi bi-building mr-1"></i> {{ activeTooltip.habitacionesOcupadas }} de {{ activeTooltip.totalHabitaciones }} habs.
                </div>
              </div>
            </div>

            <!-- Tabla de datos paginada -->
            <div class="table-container-custom">
              <div class="table-header-box">
                <h4>Detalle Operativo Diario</h4>
                <div class="pagination-controls">
                  <button (click)="prevPage()" [disabled]="currentPage === 1"><i class="bi bi-chevron-left mr-1"></i> Anterior</button>
                  <span>Pág. {{ currentPage }} de {{ getTotalPages() }}</span>
                  <button (click)="nextPage()" [disabled]="currentPage === getTotalPages()">Siguiente <i class="bi bi-chevron-right ml-1"></i></button>
                </div>
              </div>

              <table class="table-premium">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Habitaciones Ocupadas</th>
                    <th>Inventario Total</th>
                    <th>Porcentaje de Ocupación</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let od of getPaginatedData()">
                    <td><strong>{{ od.fecha }}</strong></td>
                    <td class="num">{{ od.habitacionesOcupadas }}</td>
                    <td class="num">{{ od.totalHabitaciones }}</td>
                    <td class="pct-cell">
                      <span class="pct-pill" [style.background]="getOcupPillBg(od.porcentaje)">
                        {{ od.porcentaje | number:'1.2-2' }}%
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <!-- ========================================== -->
        <!-- PESTAÑA: INGRESOS & GASTOS                 -->
        <!-- ========================================== -->
        <section class="tab-pane animate-fade-in" *ngIf="activeTab === 'ingresos'">
          <div class="ingresos-grid">
            <!-- Distribución de ingresos por tipo -->
            <div class="glass-card flex-bar-card">
              <h3><i class="bi bi-house-door-fill text-verde-selva mr-2"></i> Ingresos por Tipo de Habitación</h3>
              <p class="section-desc">Desglose acumulado de recaudación según el tipo de alojamiento solicitado.</p>

              <div class="flex-bar-chart">
                <div class="bar-row-item" *ngFor="let item of reporte.ingresosPorTipo">
                  <div class="bar-meta">
                    <span class="type-name">{{ item.tipoHabitacion | uppercase }}</span>
                    <span class="type-amount">S/ {{ item.totalIngresos | number:'1.2-2' }}</span>
                  </div>
                  <div class="bar-bar-track">
                    <div class="bar-bar-fill" [style.width.%]="item.porcentaje" [style.background]="getRoomTypeColor(item.tipoHabitacion)">
                      <span class="fill-lbl">{{ item.porcentaje | number:'1.1-1' }}%</span>
                    </div>
                  </div>
                </div>

                <div class="empty-state" *ngIf="reporte.ingresosPorTipo.length === 0">
                  No se registraron pagos de reservas en este rango de fechas.
                </div>
              </div>
            </div>

            <!-- Balances detallados -->
            <div class="glass-card table-box-card">
              <h3><i class="bi bi-calculator-fill text-verde-selva mr-2"></i> Balance Contable Ejecutivo</h3>
              <p class="section-desc">Detalle financiero formal del período consultado.</p>

              <div class="balance-table-rows">
                <div class="balance-row">
                  <span>Ingresos Brutos</span>
                  <strong>S/ {{ reporte.kpis.totalIngresos | number:'1.2-2' }}</strong>
                </div>
                <div class="balance-row">
                  <span>Gastos Operativos Totales</span>
                  <strong class="minus">- S/ {{ reporte.kpis.totalGastos | number:'1.2-2' }}</strong>
                </div>
                <div class="balance-row total">
                  <span>Utilidad Neta</span>
                  <span class="net-pill" [class.positive]="reporte.kpis.gananciaNeta >= 0" [class.negative]="reporte.kpis.gananciaNeta < 0">
                    S/ {{ reporte.kpis.gananciaNeta | number:'1.2-2' }}
                  </span>
                </div>
              </div>

              <!-- Alerta financiera -->
              <div class="financial-alert" [class.positive]="reporte.kpis.gananciaNeta >= 0" [class.negative]="reporte.kpis.gananciaNeta < 0">
                <span class="alert-icon">
                  <i class="bi" [ngClass]="reporte.kpis.gananciaNeta >= 0 ? 'bi-rocket-takeoff-fill text-emerald-600' : 'bi-exclamation-triangle-fill text-amber-500'"></i>
                </span>
                <div class="alert-text">
                  <h5 *ngIf="reporte.kpis.gananciaNeta >= 0">¡Rendimiento Operativo Favorable!</h5>
                  <h5 *ngIf="reporte.kpis.gananciaNeta < 0">Atención: Déficit registrado en período</h5>
                  <p>{{ reporte.kpis.gananciaNeta >= 0 ? 'El hotel registra un balance contable positivo. Las ganancias netas representan un retorno operativo estable.' : 'Los gastos operativos superan temporalmente a los ingresos de reservas en el rango consultado.' }}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- ========================================== -->
        <!-- PESTAÑA: HABITACIONES                      -->
        <!-- ========================================== -->
        <section class="tab-pane animate-fade-in" *ngIf="activeTab === 'habitaciones'">
          <div class="popular-rooms-card glass-card">
            <h3><i class="bi bi-door-closed-fill text-verde-selva mr-2"></i> Rendimiento - Top 10 Habitaciones Más Reservadas</h3>
            <p class="section-desc">Identifique cuáles son los números de habitación con mayor nivel de ocupación y facturación.</p>

            <div class="rooms-list-container">
              <div class="room-rank-card" *ngFor="let room of reporte.habitacionesMasReservadas; let i = index">
                <div class="rank-badge">{{ i + 1 }}</div>
                <div class="room-details">
                  <h4>Habitación {{ room.numero }}</h4>
                  <span class="room-tag">{{ room.tipo | uppercase }}</span>
                </div>
                <div class="room-metric-col">
                  <span class="metric-label">Noches Ocupadas</span>
                  <strong class="metric-val">{{ room.nochesOcupadas }} noches</strong>
                </div>
                <div class="room-metric-col">
                  <span class="metric-label">Ingresos Generados</span>
                  <strong class="metric-val text-indigo">S/ {{ room.totalIngresos | number:'1.2-2' }}</strong>
                </div>
                <div class="room-pct-bar">
                  <div class="bar-fill-track">
                    <div class="bar-fill-pct" [style.width.%]="getPopularityPercentage(room.nochesOcupadas)"></div>
                  </div>
                </div>
              </div>

              <div class="empty-state" *ngIf="reporte.habitacionesMasReservadas.length === 0">
                No hay datos operacionales de habitaciones para el rango actual.
              </div>
            </div>
          </div>
        </section>

        <!-- ========================================== -->
        <!-- PESTAÑA: CANALES & CANCELACIONES           -->
        <!-- ========================================== -->
        <section class="tab-pane animate-fade-in" *ngIf="activeTab === 'cancelaciones'">
          <div class="cancelaciones-grid">
            <!-- Canales Donut Chart -->
            <div class="glass-card donut-card">
              <h3><i class="bi bi-globe text-verde-selva mr-2"></i> Distribución de Reservas por Canales</h3>
              <p class="section-desc">Desglose de captación por canal de venta registrado.</p>

              <div class="donut-chart-wrapper">
                <div class="donut-svg-box">
                  <svg viewBox="0 0 100 100" class="donut-svg" (mouseleave)="leaveChannel()">
                    <!-- Fondo del círculo -->
                    <circle cx="50" cy="50" r="40" fill="transparent" stroke="#f1f5f9" stroke-width="8" />
                    <!-- Segmentos de canal -->
                    <circle *ngFor="let segment of donutSegments"
                            cx="50" cy="50" r="40" fill="transparent"
                            [attr.stroke]="segment.color"
                            stroke-width="9"
                            [attr.stroke-dasharray]="segment.dashArray"
                            [attr.stroke-dashoffset]="segment.dashOffset"
                            pathLength="100"
                            class="donut-slice"
                            (mouseenter)="hoverChannel(segment, $event)"></circle>
                  </svg>

                  <!-- Tooltip del donut -->
                  <div class="donut-tooltip glass-card" *ngIf="activeChannelTooltip"
                       [style.left.px]="channelTooltipX" [style.top.px]="channelTooltipY">
                    <strong><i [class]="getChannelIcon(activeChannelTooltip.channel)"></i> {{ activeChannelTooltip.channel | uppercase }}</strong>
                    <div>{{ activeChannelTooltip.count }} reservas ({{ activeChannelTooltip.percentage }}%)</div>
                  </div>
                </div>

                <!-- Leyendas laterales -->
                <div class="donut-legends">
                  <div class="legend-row" *ngFor="let segment of donutSegments">
                    <span class="legend-indicator" [style.background]="segment.color"></span>
                    <span class="legend-icon"><i [class]="getChannelIcon(segment.channel)"></i></span>
                    <span class="legend-name">{{ segment.channel }}</span>
                    <strong class="legend-count">{{ segment.count }} ({{ segment.percentage | number:'1.1-1' }}%)</strong>
                  </div>

                  <div class="empty-state" *ngIf="donutSegments.length === 0">
                    Sin información de canales.
                  </div>
                </div>
              </div>
            </div>

            <!-- Desglose de cancelaciones -->
            <div class="glass-card motivos-card">
              <h3><i class="bi bi-slash-circle text-red-600 mr-2"></i> Motivos de Cancelación e Inasistencias</h3>
              <p class="section-desc">Resumen explicativo del abandono de estadías.</p>

              <div class="cancelaciones-summary">
                <div class="summary-pills">
                  <div class="summary-pill red">
                    <span>Cancelaciones Directas</span>
                    <strong>{{ reporte.cancelaciones.canceladas }}</strong>
                  </div>
                  <div class="summary-pill orange">
                    <span>Inasistencia</span>
                    <strong>{{ reporte.cancelaciones.noShow }}</strong>
                  </div>
                </div>

                <h4>Desglose por Motivo de Desistimiento</h4>
                <div class="motivos-list">
                  <div class="motivo-item" *ngFor="let entry of getCancelacionesMotivos()">
                    <div class="motivo-desc">
                      <span>{{ entry.motivo }}</span>
                      <strong>{{ entry.cantidad }}</strong>
                    </div>
                    <div class="motivo-track">
                      <div class="motivo-fill" [style.width.%]="getCancelMotivePct(entry.cantidad)"></div>
                    </div>
                  </div>

                  <div class="empty-state" *ngIf="getCancelacionesMotivos().length === 0">
                    No se registraron cancelaciones en este rango de fechas.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- ========================================== -->
        <!-- PESTAÑA: PROYECCIONES                      -->
        <!-- ========================================== -->
        <section class="tab-pane animate-fade-in" *ngIf="activeTab === 'proyeccion'">
          <div class="chart-full-card glass-card">
            <h3><i class="bi bi-magic text-verde-selva mr-2"></i> Proyección de Ocupación (Próximos 7 Días)</h3>
            <p class="section-desc">Planifique la dotación de personal y logística en base a reservas confirmadas hacia adelante.</p>

            <!-- Gráfico de barras proyectado SVG -->
            <div class="proy-chart-container">
              <svg viewBox="0 0 800 250" class="svg-chart">
                <line x1="50" y1="50" x2="750" y2="50" stroke="rgba(0,0,0,0.06)" stroke-dasharray="4"/>
                <line x1="50" y1="125" x2="750" y2="125" stroke="rgba(0,0,0,0.06)" stroke-dasharray="4"/>
                <line x1="50" y1="200" x2="750" y2="200" stroke="rgba(0,0,0,0.1)" stroke-width="1.5"/>

                <!-- Leyendas Y -->
                <text x="20" y="55" class="chart-text">100%</text>
                <text x="20" y="130" class="chart-text">50%</text>
                <text x="20" y="205" class="chart-text">0%</text>

                <!-- Barras verticales -->
                <g *ngFor="let pr of reporte.proyeccion7Dias; let i = index">
                  <!-- Barra actual -->
                  <rect [attr.x]="getBarX(i)" [attr.y]="getBarY(pr.porcentaje)" 
                        [attr.width]="45" [attr.height]="getBarHeight(pr.porcentaje)"
                        fill="url(#proyGrad)" rx="4" class="proy-bar"></rect>
                  
                  <!-- Leyenda fecha abajo -->
                  <text [attr.x]="getBarX(i) + 22" y="222" class="chart-text-x" text-anchor="middle">
                    {{ pr.fecha | date:'dd/MM' }}
                  </text>

                  <!-- Porcentaje arriba de la barra -->
                  <text [attr.x]="getBarX(i) + 22" [attr.y]="getBarY(pr.porcentaje) - 8" 
                        class="chart-bar-val" text-anchor="middle">
                    {{ pr.porcentaje }}%
                  </text>
                </g>

                <defs>
                  <linearGradient id="proyGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="#4f46e5" />
                    <stop offset="100%" stop-color="#818cf8" />
                  </linearGradient>
                </defs>
              </svg>
            </div>

            <!-- Listado proyectado -->
            <div class="proy-table-container">
              <div class="proy-card-item" *ngFor="let pr of reporte.proyeccion7Dias">
                <div class="proy-date-circle">
                  <span>{{ pr.fecha | date:'dd' }}</span>
                  <small>{{ pr.fecha | date:'MMM' | uppercase }}</small>
                </div>
                <div class="proy-details">
                  <h5>Ocupación Estimada</h5>
                  <div class="pct-bar-container">
                    <div class="pct-bar-fill" [style.width.%]="pr.porcentaje"></div>
                  </div>
                </div>
                <div class="proy-counts">
                  <strong>{{ pr.porcentaje | number:'1.0-0' }}%</strong>
                  <span>{{ pr.habitacionesOcupadas }} de 56 habs.</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  `,
  styles: [`
    /* ==========================================
       1. VARIABLES Y TEMA PREMIUM
       ========================================== */
    :host {
      --primary-color: #2D5A27;
      --primary-gradient: linear-gradient(135deg, #1A211B 0%, #2D5A27 100%);
      --emerald-gradient: linear-gradient(135deg, #2D5A27 0%, #4E8D46 100%);
      --red-gradient: linear-gradient(135deg, #8B5A2B 0%, #b91c1c 100%);
      --indigo-gradient: linear-gradient(135deg, #2D5A27 0%, #8B5A2B 100%);
      --purple-gradient: linear-gradient(135deg, #2D5A27 0%, #D4A843 100%);
      --glass-bg: rgba(255, 255, 255, 0.9);
      --glass-border: 1px solid rgba(45, 90, 39, 0.08);
      --glass-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.03);
      --text-main: #1f2937;
      --text-sub: #6b7280;
    }

    .reportes-container {
      padding: 24px;
      font-family: 'Outfit', 'Inter', sans-serif;
      color: var(--text-main);
      background: #f8fafc;
      min-height: 100vh;
    }

    /* Glassmorphism Common */
    .glass-card, .glass-panel {
      background: var(--glass-bg);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border-radius: 16px;
      border: var(--glass-border);
      box-shadow: var(--glass-shadow);
      padding: 20px;
    }

    /* CABECERA BANNER */
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

    .controls-section {
      display: flex;
      gap: 16px;
      align-items: flex-end;
      padding: 12px 20px;
      flex-wrap: wrap;
      background: rgba(255, 255, 255, 0.12) !important;
      border: 1px solid rgba(255, 255, 255, 0.2) !important;
      color: white;
    }

    .controls-section label {
      color: rgba(255, 255, 255, 0.9) !important;
      font-weight: 700;
    }

    .form-control {
      background: rgba(255, 255, 255, 0.9) !important;
      border: 1px solid rgba(212, 168, 67, 0.2) !important;
      color: #1A211B !important;
      font-family: 'Outfit', sans-serif;
      font-weight: 600;
    }

    .btn-primary-custom {
      padding: 8px 18px;
      background: #ffffff;
      color: #1A211B;
      border: 1px solid #ffffff;
      border-radius: 8px;
      font-size: 0.85rem;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s ease;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
    }

    .btn-primary-custom:hover:not(:disabled) {
      background: #f1f5f9;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
    }

    .btn-primary-custom:disabled {
      background: rgba(255, 255, 255, 0.4);
      color: rgba(26, 33, 27, 0.5);
      border-color: transparent;
      cursor: not-allowed;
    }

    .btn-success-custom {
      padding: 8px 18px;
      background: linear-gradient(135deg, #F3C65F 0%, #D4A843 100%);
      color: #1A211B;
      border: 1px solid #D4A843;
      border-radius: 8px;
      font-size: 0.85rem;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s ease;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
    }

    .btn-success-custom:hover:not(:disabled) {
      background: linear-gradient(135deg, #D4A843 0%, #B28830 100%);
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(212, 168, 67, 0.25);
    }

    .btn-success-custom:disabled {
      background: rgba(255, 255, 255, 0.1);
      color: rgba(255, 255, 255, 0.4);
      border-color: rgba(255, 255, 255, 0.1);
      cursor: not-allowed;
    }

    .controls-section {
      display: flex;
      gap: 16px;
      align-items: flex-end;
      padding: 12px 20px;
      flex-wrap: wrap;
    }

    .date-inputs {
      display: flex;
      gap: 12px;
    }

    .input-group {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .input-group label {
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--text-sub);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .input-group input {
      padding: 8px 12px;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      font-size: 0.85rem;
      font-weight: 500;
      color: #334155;
      background: #ffffff;
      outline: none;
      transition: border-color 0.2s;
    }

    .input-group input:focus {
      border-color: #3b82f6;
    }

    .action-buttons {
      display: flex;
      gap: 8px;
    }

    .btn-primary, .btn-success {
      padding: 8px 18px;
      border: none;
      border-radius: 8px;
      font-size: 0.85rem;
      font-weight: 600;
      cursor: pointer;
      transition: transform 0.15s, opacity 0.15s;
    }

    .btn-primary {
      background: #2563eb;
      color: #ffffff;
    }

    .btn-success {
      background: #10b981;
      color: #ffffff;
    }

    .btn-primary:hover, .btn-success:hover {
      opacity: 0.9;
      transform: translateY(-1px);
    }

    .btn-primary:disabled, .btn-success:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      transform: none;
    }

    /* Loading Overlay */
    .loading-overlay {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px 20px;
      text-align: center;
    }

    .spinner {
      width: 48px;
      height: 48px;
      border: 4px solid #e2e8f0;
      border-top-color: #2563eb;
      border-radius: 50%;
      animation: spin 1s infinite linear;
      margin-bottom: 16px;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    /* Pestañas Centradas */
    .centered-tabs {
      display: flex;
      justify-content: center;
      gap: 8px;
      margin-bottom: 24px;
      padding: 8px;
      overflow-x: auto;
      white-space: nowrap;
    }

    .centered-tabs button {
      padding: 8px 18px;
      border: none;
      background: transparent;
      color: #64748b;
      font-size: 0.9rem;
      font-weight: 600;
      border-radius: 10px;
      cursor: pointer;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .centered-tabs button:hover {
      background: rgba(0, 0, 0, 0.03);
      color: #1e293b;
    }

    .centered-tabs button.active {
      background: var(--primary-color);
      color: #ffffff;
      box-shadow: 0 4px 12px rgba(45, 90, 39, 0.15);
    }

    /* ==========================================
       2. KPI CARDS & SPARKLINE
       ========================================== */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }

    .kpi-card {
      position: relative;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      min-height: 140px;
      transition: transform 0.2s;
    }

    .kpi-card:hover {
      transform: translateY(-2px);
    }

    .kpi-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .kpi-title {
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--text-sub);
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .kpi-icon {
      font-size: 1.1rem;
      width: 28px;
      height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
    }

    .kpi-icon.blue { background: rgba(37, 99, 235, 0.1); }
    .kpi-icon.emerald { background: rgba(16, 115, 81, 0.1); }
    .kpi-icon.indigo { background: rgba(99, 102, 241, 0.1); }
    .kpi-icon.purple { background: rgba(168, 85, 247, 0.1); }
    .kpi-icon.red { background: rgba(239, 68, 68, 0.1); }

    .kpi-value {
      font-size: 1.7rem;
      font-weight: 700;
      color: #0f172a;
      margin: 12px 0 4px;
    }

    .val-sub {
      font-size: 0.85rem;
      color: var(--text-sub);
      font-weight: 500;
    }

    .kpi-footer {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .trend-badge {
      font-size: 0.7rem;
      font-weight: 700;
      padding: 2px 6px;
      border-radius: 6px;
      display: inline-flex;
      align-items: center;
    }

    .trend-badge.up {
      background: #dcfce7;
      color: #15803d;
    }

    .trend-badge.down {
      background: #fee2e2;
      color: #b91c1c;
    }

    .trend-badge.invert-trend.up {
      background: #fee2e2;
      color: #b91c1c;
    }

    .trend-badge.invert-trend.down {
      background: #dcfce7;
      color: #15803d;
    }

    .prev-label {
      font-size: 0.72rem;
      color: var(--text-sub);
    }

    .sparkline-container {
      position: absolute;
      bottom: 0;
      right: 0;
      width: 80px;
      height: 30px;
      opacity: 0.35;
      pointer-events: none;
    }

    .sparkline {
      width: 100%;
      height: 100%;
    }

    /* Grilla Detalles Resumen */
    .summary-details-grid {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 16px;
      margin-bottom: 24px;
    }

    @media (max-width: 900px) {
      .summary-details-grid {
        grid-template-columns: 1fr;
      }
    }

    .summary-chart-card h3, .limpieza-summary-card h3, .chart-full-card h3, 
    .flex-bar-card h3, .table-box-card h3, .donut-card h3, .motivos-card h3 {
      margin: 0 0 4px;
      font-size: 1.1rem;
      font-weight: 700;
      color: #0f172a;
    }

    .section-desc {
      margin: 0 0 20px;
      font-size: 0.82rem;
      color: var(--text-sub);
    }

    /* Balance financiero progresos */
    .financial-bars {
      display: flex;
      flex-direction: column;
      gap: 18px;
    }

    .fin-item {
      display: flex;
      flex-direction: column;
    }

    .fin-label {
      display: flex;
      justify-content: space-between;
      font-size: 0.85rem;
      font-weight: 600;
      color: #334155;
      margin-bottom: 6px;
    }

    .fin-label .amount {
      font-weight: 700;
    }

    .amount.positive { color: #10b981; }
    .amount.negative { color: #ef4444; }
    .amount.neutral { color: #3b82f6; }

    .fin-progress-track {
      height: 8px;
      background: #f1f5f9;
      border-radius: 4px;
      overflow: hidden;
    }

    .fin-progress-fill {
      height: 100%;
      border-radius: 4px;
    }

    .fin-progress-fill.positive { background: var(--emerald-gradient); }
    .fin-progress-fill.negative { background: var(--red-gradient); }
    .fin-progress-fill.neutral { background: var(--primary-gradient); }

    .fin-prev {
      font-size: 0.72rem;
      color: var(--text-sub);
      margin-top: 4px;
    }

    /* Limpieza circulo */
    .limpieza-circle-container {
      display: flex;
      align-items: center;
      gap: 20px;
      padding: 10px 0;
    }

    .limpieza-circle {
      width: 100px;
      height: 100px;
      border-radius: 50%;
      border: 8px solid rgba(16, 185, 129, 0.15);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: rgba(16, 185, 129, 0.03);
    }

    .limpieza-circle-val {
      font-size: 1.8rem;
      font-weight: 700;
      color: #065f46;
      line-height: 1.1;
    }

    .limpieza-circle-unit {
      font-size: 0.7rem;
      color: var(--text-sub);
      font-weight: 600;
      text-transform: uppercase;
    }

    .limpieza-info {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .info-block {
      display: flex;
      flex-direction: column;
    }

    .info-block strong {
      font-size: 0.95rem;
      font-weight: 700;
      color: #1e293b;
    }

    .info-block span {
      font-size: 0.75rem;
      color: var(--text-sub);
    }

    .info-block.success strong {
      color: #10b981;
    }

    /* ==========================================
       3. LINE GRAPH - OCUPACIÓN
       ========================================== */
    .chart-full-card {
      margin-bottom: 24px;
    }

    .chart-header-custom {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 20px;
    }

    .legend {
      font-size: 0.8rem;
      font-weight: 600;
      color: #334155;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .dot-legend {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: var(--primary-color);
      display: inline-block;
    }

    .svg-chart-container {
      position: relative;
      background: linear-gradient(180deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0) 100%);
      border-radius: 12px;
      padding: 10px;
    }

    .svg-chart {
      width: 100%;
      height: auto;
      overflow: visible;
    }

    .chart-text {
      font-size: 10px;
      font-weight: 600;
      fill: #94a3b8;
    }

    .chart-dot {
      cursor: pointer;
      transition: r 0.15s, fill 0.15s;
    }

    .chart-dot:hover {
      r: 9px;
      fill: var(--primary-color);
    }

    .chart-tooltip {
      position: absolute;
      z-index: 10;
      padding: 8px 12px;
      font-size: 0.78rem;
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.08);
      pointer-events: none;
      transform: translate(-50%, -100%);
      margin-top: -15px;
    }

    .tooltip-date {
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 2px;
    }

    .tooltip-metric {
      color: var(--primary-color);
      font-weight: 600;
    }

    .tooltip-sub {
      font-size: 0.7rem;
      color: var(--text-sub);
      margin-top: 1px;
    }

    /* Tabla Premium */
    .table-container-custom {
      margin-top: 24px;
      border-top: 1px solid #f1f5f9;
      padding-top: 20px;
    }

    .table-header-box {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }

    .table-header-box h4 {
      margin: 0;
      font-size: 0.95rem;
      font-weight: 700;
      color: #1e293b;
    }

    .pagination-controls {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .pagination-controls button {
      padding: 4px 10px;
      border: 1px solid #cbd5e1;
      background: #ffffff;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 600;
      cursor: pointer;
      color: #475569;
    }

    .pagination-controls button:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    .pagination-controls span {
      font-size: 0.75rem;
      font-weight: 600;
      color: #64748b;
    }

    .table-premium {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.8rem;
    }

    .table-premium th {
      background: #f8fafc;
      padding: 10px 14px;
      text-align: left;
      font-weight: 700;
      color: #475569;
      border-bottom: 1px solid #e2e8f0;
      text-transform: uppercase;
      font-size: 0.7rem;
      letter-spacing: 0.05em;
    }

    .table-premium td {
      padding: 10px 14px;
      border-bottom: 1px solid #f1f5f9;
      color: #334155;
    }

    .table-premium tr:hover td {
      background: rgba(0,0,0,0.01);
    }

    .table-premium td.num {
      font-weight: 600;
    }

    .pct-cell {
      display: flex;
      align-items: center;
    }

    .pct-pill {
      font-size: 0.75rem;
      font-weight: 700;
      color: #ffffff;
      padding: 2px 8px;
      border-radius: 6px;
    }

    /* ==========================================
       4. INGRESOS POR TIPO & BALANCES
       ========================================== */
    .ingresos-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 24px;
    }

    @media (max-width: 900px) {
      .ingresos-grid {
        grid-template-columns: 1fr;
      }
    }

    .flex-bar-chart {
      display: flex;
      flex-direction: column;
      gap: 18px;
    }

    .bar-row-item {
      display: flex;
      flex-direction: column;
    }

    .bar-meta {
      display: flex;
      justify-content: space-between;
      font-size: 0.8rem;
      font-weight: 600;
      color: #334155;
      margin-bottom: 6px;
    }

    .type-name {
      font-weight: 700;
    }

    .bar-bar-track {
      height: 18px;
      background: #f1f5f9;
      border-radius: 9px;
      overflow: hidden;
      position: relative;
    }

    .bar-bar-fill {
      height: 100%;
      border-radius: 9px;
      display: flex;
      align-items: center;
      justify-content: flex-end;
      padding-right: 10px;
      transition: width 0.3s;
    }

    .fill-lbl {
      font-size: 0.7rem;
      color: #ffffff;
      font-weight: 700;
    }

    .balance-table-rows {
      display: flex;
      flex-direction: column;
      gap: 14px;
      margin-bottom: 20px;
    }

    .balance-row {
      display: flex;
      justify-content: space-between;
      font-size: 0.88rem;
      font-weight: 500;
      color: #475569;
      padding-bottom: 8px;
      border-bottom: 1px solid #f1f5f9;
    }

    .balance-row strong {
      color: #0f172a;
    }

    .balance-row strong.minus {
      color: #ef4444;
    }

    .balance-row.total {
      font-size: 1.05rem;
      font-weight: 700;
      border: none;
      padding-top: 6px;
    }

    .net-pill {
      font-weight: 700;
      padding: 4px 10px;
      border-radius: 8px;
    }

    .net-pill.positive {
      background: #dcfce7;
      color: #15803d;
    }

    .net-pill.negative {
      background: #fee2e2;
      color: #b91c1c;
    }

    /* Alerta Financiera */
    .financial-alert {
      display: flex;
      gap: 12px;
      padding: 12px 16px;
      border-radius: 10px;
      font-size: 0.8rem;
    }

    .financial-alert.positive {
      background: rgba(16, 185, 129, 0.06);
      border: 1px solid rgba(16, 185, 129, 0.15);
    }

    .financial-alert.negative {
      background: rgba(239, 68, 68, 0.06);
      border: 1px solid rgba(239, 68, 68, 0.15);
    }

    .alert-icon {
      font-size: 1.2rem;
    }

    .alert-text h5 {
      margin: 0 0 2px;
      font-weight: 700;
      color: #1e293b;
    }

    .alert-text p {
      margin: 0;
      color: var(--text-sub);
    }

    /* ==========================================
       5. POPULAR ROOMS LIST
       ========================================== */
    .rooms-list-container {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .room-rank-card {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: rgba(255,255,255,0.5);
      border: 1px solid #f1f5f9;
      border-radius: 12px;
      padding: 10px 16px;
      position: relative;
      flex-wrap: wrap;
      gap: 12px;
    }

    .rank-badge {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: var(--primary-color);
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.72rem;
      font-weight: 700;
    }

    .room-details {
      display: flex;
      flex-direction: column;
      flex: 1;
      min-width: 140px;
    }

    .room-details h4 {
      margin: 0;
      font-size: 0.9rem;
      font-weight: 700;
      color: #1e293b;
    }

    .room-tag {
      font-size: 0.65rem;
      font-weight: 700;
      color: var(--text-sub);
      text-transform: uppercase;
    }

    .room-metric-col {
      display: flex;
      flex-direction: column;
      text-align: right;
      min-width: 100px;
    }

    .metric-label {
      font-size: 0.65rem;
      color: var(--text-sub);
      text-transform: uppercase;
      font-weight: 600;
    }

    .metric-val {
      font-size: 0.85rem;
      font-weight: 700;
      color: #334155;
    }

    .metric-val.text-indigo {
      color: #8B5A2B;
    }

    .room-pct-bar {
      width: 100%;
      height: 4px;
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      overflow: hidden;
      border-bottom-left-radius: 12px;
      border-bottom-right-radius: 12px;
    }

    .bar-fill-track {
      width: 100%;
      height: 100%;
      background: transparent;
    }

    .bar-fill-pct {
      height: 100%;
      background: var(--primary-gradient);
    }

    /* ==========================================
       6. DONUT CHART & CANCELACIONES
       ========================================== */
    .cancelaciones-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 24px;
    }

    @media (max-width: 900px) {
      .cancelaciones-grid {
        grid-template-columns: 1fr;
      }
    }

    .donut-chart-wrapper {
      display: flex;
      align-items: center;
      gap: 24px;
      justify-content: center;
      flex-wrap: wrap;
    }

    .donut-svg-box {
      width: 130px;
      height: 130px;
      position: relative;
    }

    .donut-svg {
      width: 100%;
      height: 100%;
      transform: rotate(-90deg);
    }

    .donut-slice {
      cursor: pointer;
      transition: stroke-width 0.2s, filter 0.2s;
    }

    .donut-slice:hover {
      stroke-width: 11;
      filter: drop-shadow(0px 0px 3px rgba(0,0,0,0.15));
    }

    .donut-tooltip {
      position: absolute;
      z-index: 10;
      padding: 6px 10px;
      font-size: 0.72rem;
      white-space: nowrap;
      pointer-events: none;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      box-shadow: 0 4px 10px rgba(0,0,0,0.05);
    }

    .donut-legends {
      display: flex;
      flex-direction: column;
      gap: 10px;
      flex: 1;
      min-width: 180px;
    }

    .legend-row {
      display: flex;
      align-items: center;
      font-size: 0.78rem;
      gap: 8px;
    }

    .legend-indicator {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      display: inline-block;
    }

    .legend-icon {
      font-size: 0.9rem;
    }

    .legend-name {
      color: #475569;
      font-weight: 500;
      flex: 1;
    }

    .legend-count {
      color: #1e293b;
      font-weight: 700;
    }

    /* Cancelaciones */
    .summary-pills {
      display: flex;
      gap: 12px;
      margin-bottom: 20px;
    }

    .summary-pill {
      flex: 1;
      display: flex;
      flex-direction: column;
      padding: 10px;
      border-radius: 10px;
      border: 1px solid;
    }

    .summary-pill span {
      font-size: 0.72rem;
      font-weight: 600;
      text-transform: uppercase;
      color: var(--text-sub);
    }

    .summary-pill strong {
      font-size: 1.4rem;
      font-weight: 700;
      margin-top: 4px;
    }

    .summary-pill.red {
      background: rgba(239, 68, 68, 0.05);
      border-color: rgba(239, 68, 68, 0.15);
      color: #b91c1c;
    }

    .summary-pill.orange {
      background: rgba(249, 115, 22, 0.05);
      border-color: rgba(249, 115, 22, 0.15);
      color: #c2410c;
    }

    .cancelaciones-summary h4 {
      margin: 0 0 10px;
      font-size: 0.85rem;
      font-weight: 700;
      color: #1e293b;
      text-transform: uppercase;
    }

    .motivos-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .motivo-item {
      display: flex;
      flex-direction: column;
    }

    .motivo-desc {
      display: flex;
      justify-content: space-between;
      font-size: 0.78rem;
      font-weight: 600;
      color: #475569;
      margin-bottom: 4px;
    }

    .motivo-track {
      height: 4px;
      background: #f1f5f9;
      border-radius: 2px;
      overflow: hidden;
    }

    .motivo-fill {
      height: 100%;
      background: #cbd5e1;
      border-radius: 2px;
    }

    /* ==========================================
       7. PROYECCIONES DE BARRAS
       ========================================== */
    .proy-chart-container {
      margin-bottom: 24px;
    }

    .proy-bar {
      transition: filter 0.2s, opacity 0.2s;
    }

    .proy-bar:hover {
      filter: drop-shadow(0 2px 6px rgba(0,0,0,0.15));
    }

    .chart-text-x {
      font-size: 9px;
      font-weight: 600;
      fill: #64748b;
    }

    .chart-bar-val {
      font-size: 9px;
      font-weight: 700;
      fill: #8B5A2B;
    }

    .proy-table-container {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
      gap: 10px;
    }

    .proy-card-item {
      display: flex;
      align-items: center;
      background: rgba(255,255,255,0.4);
      border: 1px solid #f1f5f9;
      border-radius: 12px;
      padding: 10px;
      gap: 10px;
    }

    .proy-date-circle {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: #f1f5f9;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      line-height: 1.1;
    }

    .proy-date-circle span {
      font-size: 0.9rem;
      font-weight: 700;
      color: #1e293b;
    }

    .proy-date-circle small {
      font-size: 0.55rem;
      font-weight: 700;
      color: var(--text-sub);
    }

    .proy-details {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .proy-details h5 {
      margin: 0;
      font-size: 0.7rem;
      font-weight: 600;
      color: var(--text-sub);
      text-transform: uppercase;
    }

    .pct-bar-track, .pct-bar-container {
      height: 4px;
      background: #f1f5f9;
      border-radius: 2px;
      overflow: hidden;
    }

    .pct-bar-fill {
      height: 100%;
      background: var(--primary-gradient);
    }

    .proy-counts {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      line-height: 1.2;
    }

    .proy-counts strong {
      font-size: 0.85rem;
      color: #1e293b;
    }

    .proy-counts span {
      font-size: 0.65rem;
      color: var(--text-sub);
    }

    /* Animación de Fade in */
    .animate-fade-in {
      animation: fadeIn 0.3s forwards ease-out;
    }

    @keyframes fadeIn {
      0% { opacity: 0; transform: translateY(5px); }
      100% { opacity: 1; transform: translateY(0); }
    }

    /* Empty state general */
    .empty-state {
      padding: 30px;
      text-align: center;
      color: var(--text-sub);
      font-size: 0.8rem;
      font-style: italic;
    }
  `]
})
export class ReportesComponent implements OnInit {
  fechaDesde = '';
  fechaHasta = '';
  activeTab = 'resumen';
  loading = false;

  reporte: any = null;
  limpiezaResumen: any = null;

  // Estados para gráficos interactivos
  activeTooltip: any = null;
  tooltipX = 0;
  tooltipY = 0;

  activeChannelTooltip: any = null;
  channelTooltipX = 0;
  channelTooltipY = 0;

  // Paginación
  currentPage = 1;
  pageSize = 10;

  // Segmentos del gráfico donut
  donutSegments: any[] = [];

  constructor(
    private service: ReporteService,
    private excelService: ExcelReportService
  ) {}

  ngOnInit(): void {
    const hoy = new Date();
    const hace30dias = new Date();
    hace30dias.setDate(hoy.getDate() - 30);
    this.fechaDesde = hace30dias.toISOString().split('T')[0];
    this.fechaHasta = hoy.toISOString().split('T')[0];

    this.cargarDatos();
  }

  onDateChange(): void {
    // Si el usuario cambia las fechas, forzamos recarga
    this.cargarDatos();
  }

  cargarDatos(): void {
    if (!this.fechaDesde || !this.fechaHasta) return;
    this.loading = true;
    this.service.getReporteCompleto(this.fechaDesde, this.fechaHasta).subscribe({
      next: (data) => {
        this.reporte = data;
        this.currentPage = 1;
        this.procesarCanalesDonut();
        
        // Cargar también promedio de limpieza
        this.service.getLimpieza().subscribe({
          next: (limp) => {
            this.limpiezaResumen = limp;
            this.loading = false;
          },
          error: () => {
            this.loading = false;
          }
        });
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  getAbsoluteValue(val: number): number {
    return Math.abs(val);
  }

  getExpensePercentage(): number {
    if (!this.reporte?.kpis?.totalIngresos || this.reporte.kpis.totalIngresos === 0) return 0;
    const pct = (this.reporte.kpis.totalGastos / this.reporte.kpis.totalIngresos) * 100;
    return Math.min(pct, 100);
  }

  getNetPercentage(): number {
    if (!this.reporte?.kpis?.totalIngresos || this.reporte.kpis.totalIngresos === 0) return 0;
    if (this.reporte.kpis.gananciaNeta < 0) return 0;
    const pct = (this.reporte.kpis.gananciaNeta / this.reporte.kpis.totalIngresos) * 100;
    return Math.min(pct, 100);
  }

  getSparklinePath(): string {
    if (!this.reporte?.ocupacionDiaria || this.reporte.ocupacionDiaria.length === 0) {
      return 'M 0 15 L 80 15';
    }
    const series = this.reporte.ocupacionDiaria.slice(-8); // últimos 8 registros
    const points = series.map((od: any, idx: number) => {
      const x = (idx * 80) / (series.length - 1 || 1);
      const y = 25 - (od.porcentaje * 20 / 100);
      return `${x} ${y}`;
    });
    return `M ${points.join(' L ')}`;
  }

  // ==========================================
  // GRÁFICO LINEAL DE OCUPACIÓN (SVG COORDINATES)
  // ==========================================
  getLinePoints(): string {
    if (!this.reporte?.ocupacionDiaria || this.reporte.ocupacionDiaria.length === 0) return '';
    const points = this.reporte.ocupacionDiaria.map((od: any, idx: number) => {
      const x = this.getXCoordinate(idx);
      const y = this.getYCoordinate(od.porcentaje);
      return `${x},${y}`;
    });
    return points.join(' ');
  }

  getAreaPath(): string {
    if (!this.reporte?.ocupacionDiaria || this.reporte.ocupacionDiaria.length === 0) return '';
    const points = this.reporte.ocupacionDiaria.map((od: any, idx: number) => {
      const x = this.getXCoordinate(idx);
      const y = this.getYCoordinate(od.porcentaje);
      return `${x},${y}`;
    });

    const startX = this.getXCoordinate(0);
    const endX = this.getXCoordinate(this.reporte.ocupacionDiaria.length - 1);
    return `M ${startX},250 L ${points.join(' L ')} L ${endX},250 Z`;
  }

  getXCoordinate(index: number): number {
    if (!this.reporte?.ocupacionDiaria || this.reporte.ocupacionDiaria.length === 0) return 0;
    return 50 + (index * 900 / (this.reporte.ocupacionDiaria.length - 1 || 1));
  }

  getYCoordinate(porcentaje: number): number {
    return 250 - (porcentaje * 200 / 100);
  }

  hoverPoint(od: any, index: number, event: MouseEvent): void {
    this.activeTooltip = od;
    
    // Posicionamiento de tooltip respecto al contenedor del SVG
    const svgRect = (event.target as HTMLElement).parentElement?.getBoundingClientRect();
    if (svgRect) {
      const x = this.getXCoordinate(index);
      const y = this.getYCoordinate(od.porcentaje);
      
      this.tooltipX = (x / 1000) * svgRect.width;
      this.tooltipY = (y / 300) * svgRect.height;
    }
  }

  leavePoint(): void {
    this.activeTooltip = null;
  }

  // ==========================================
  // TABLA DE OCUPACIÓN PAGINADA
  // ==========================================
  getTotalPages(): number {
    if (!this.reporte?.ocupacionDiaria) return 1;
    return Math.ceil(this.reporte.ocupacionDiaria.length / this.pageSize) || 1;
  }

  getPaginatedData(): any[] {
    if (!this.reporte?.ocupacionDiaria) return [];
    const reversed = [...this.reporte.ocupacionDiaria].reverse(); // Recientes arriba
    const start = (this.currentPage - 1) * this.pageSize;
    return reversed.slice(start, start + this.pageSize);
  }

  prevPage(): void {
    if (this.currentPage > 1) this.currentPage--;
  }

  nextPage(): void {
    if (this.currentPage < this.getTotalPages()) this.currentPage++;
  }

  getOcupPillBg(pct: number): string {
    if (pct >= 70) return '#15803d'; // verde
    if (pct >= 35) return '#d97706'; // naranja/ámbar
    return '#475569'; // grisáceo
  }

  // ==========================================
  // COLORES DE HABITACIONES
  // ==========================================
  getRoomTypeColor(type: string): string {
    const t = type.toLowerCase();
    if (t.includes('matrimonial')) return 'linear-gradient(90deg, #2D5A27 0%, #4E8D46 100%)';
    if (t.includes('doble')) return 'linear-gradient(90deg, #2D5A27 0%, #8B5A2B 100%)';
    if (t.includes('triple')) return 'linear-gradient(90deg, #8B5A2B 0%, #D4A843 100%)';
    return 'linear-gradient(90deg, #4E8D46 0%, #D4A843 100%)';
  }

  getPopularityPercentage(noches: number): number {
    if (!this.reporte?.habitacionesMasReservadas || this.reporte.habitacionesMasReservadas.length === 0) return 0;
    const maxNoches = Math.max(...this.reporte.habitacionesMasReservadas.map((r: any) => r.nochesOcupadas), 1);
    return (noches * 100) / maxNoches;
  }

  // ==========================================
  // DONUT DE CANALES (PROCESAMIENTO DE ÁNGULOS)
  // ==========================================
  procesarCanalesDonut(): void {
    if (!this.reporte?.distribucionCanales) {
      this.donutSegments = [];
      return;
    }
    
    let currentAngle = 0;
    this.donutSegments = this.reporte.distribucionCanales.map((dc: any, idx: number) => {
      const pct = dc.porcentaje;
      const strokeDash = `${pct} ${100 - pct}`;
      const strokeOffset = 100 - currentAngle + 25; // Inicia a las 12 en punto
      currentAngle += pct;

      return {
        channel: dc.canal,
        icon: dc.icono,
        count: dc.cantidadReservas,
        percentage: pct,
        dashArray: strokeDash,
        dashOffset: strokeOffset,
        color: this.getChannelColor(idx)
      };
    });
  }

  getChannelColor(index: number): string {
    const colors = [
      '#2D5A27', // Verde Selva Principal
      '#4E8D46', // Verde Tropical Secundario
      '#8B5A2B', // Marrón Madera
      '#D4A843', // Dorado Amazónico
      '#1A211B'  // Fondo Oscuro
    ];
    return colors[index % colors.length];
  }

  getChannelIcon(canal: string): string {
    if (!canal) return 'bi bi-globe';
    const c = canal.toLowerCase();
    if (c.includes('directo')) return 'bi bi-person-fill text-emerald-600';
    if (c.includes('booking')) return 'bi bi-globe2 text-blue-600';
    if (c.includes('whatsapp') || c.includes('teléfono') || c.includes('telefono')) return 'bi bi-whatsapp text-emerald-500';
    if (c.includes('expedia')) return 'bi bi-airplane-engines-fill text-amber-600';
    return 'bi bi-box-arrow-in-right text-slate-500';
  }

  hoverChannel(segment: any, event: MouseEvent): void {
    this.activeChannelTooltip = segment;
    const box = (event.target as HTMLElement).parentElement?.getBoundingClientRect();
    if (box) {
      this.channelTooltipX = box.width / 2;
      this.channelTooltipY = box.height / 2;
    }
  }

  leaveChannel(): void {
    this.activeChannelTooltip = null;
  }

  // ==========================================
  // CANCELACIONES
  // ==========================================
  getCancelacionesMotivos(): any[] {
    if (!this.reporte?.cancelaciones?.cancelacionesPorMotivo) return [];
    const motivos = this.reporte.cancelaciones.cancelacionesPorMotivo;
    return Object.keys(motivos).map(key => ({
      motivo: key,
      cantidad: motivos[key]
    })).sort((a, b) => b.cantidad - a.cantidad);
  }

  getCancelMotivePct(cantidad: number): number {
    const total = this.reporte.cancelaciones.canceladas + this.reporte.cancelaciones.noShow;
    if (total === 0) return 0;
    return (cantidad * 100) / total;
  }

  // ==========================================
  // PROYECCIONES (SVG COORDINATES)
  // ==========================================
  getBarX(idx: number): number {
    return 65 + (idx * 100);
  }

  getBarY(pct: number): number {
    return 200 - (pct * 150 / 100);
  }

  getBarHeight(pct: number): number {
    return (pct * 150 / 100) || 1; // Mínimo 1px de altura
  }

  // ==========================================
  // EXPORTAR A EXCEL COMPLETO
  // ==========================================
  exportarExcel(): void {
    if (!this.reporte) return;
    this.excelService.generarExcelReportesCompleto(this.reporte, this.fechaDesde, this.fechaHasta);
  }
}
