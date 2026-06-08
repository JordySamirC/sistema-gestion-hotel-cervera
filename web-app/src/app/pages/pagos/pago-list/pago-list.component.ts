import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PagoService } from '../../../core/services/pago.service';
import { ExcelReportService, ItemExcelReport } from '../../../core/services/excel-report.service';
import { PagoResponse } from '../../../core/models/pago';

@Component({
  selector: 'app-pago-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-container fade-in">
      <!-- CABECERA PREMIUM DE LA PÁGINA -->
      <div class="header-section">
        <div class="title-area">
          <h2><i class="header-icon-premium bi bi-cash-stack"></i> Historial de Transacciones y Pagos</h2>
          <p class="subtitle">Consolide cobros de huéspedes, audite facturación de boletas o facturas y exporte reportes contables oficiales</p>
        </div>
      </div>

      <!-- TARJETAS DE MÉTRICAS BOUTIQUE -->
      <div class="summary-cards">
        <div class="card card-total">
          <div class="card-icon-wrapper"><i class="bi bi-cash-stack"></i></div>
          <div class="card-info">
            <span class="card-label">Total Recaudado</span>
            <span class="card-value">S/ {{ totalGeneral | number:'1.2-2' }}</span>
          </div>
        </div>
        <div class="card glass-panel">
          <div class="card-icon-wrapper tropical"><i class="bi bi-receipt"></i></div>
          <div class="card-info">
            <span class="card-label">Boletas Emitidas</span>
            <span class="card-value">{{ countBoletas }}</span>
          </div>
        </div>
        <div class="card glass-panel">
          <div class="card-icon-wrapper madera"><i class="bi bi-file-earmark-text"></i></div>
          <div class="card-info">
            <span class="card-label">Facturas Emitidas</span>
            <span class="card-value">{{ countFacturas }}</span>
          </div>
        </div>
        <div class="card glass-panel">
          <div class="card-icon-wrapper dorado"><i class="bi bi-check2-circle"></i></div>
          <div class="card-info">
            <span class="card-label">Total Transacciones</span>
            <span class="card-value">{{ pagos.length }}</span>
          </div>
        </div>
      </div>

      <!-- PANEL DE FILTROS GLASSMORPHIC -->
      <div class="filtros-panel glass-panel">
        <div class="filtros-inputs">
          <div class="filtro-group">
            <label><i class="bi bi-calendar-event text-verde-selva mr-1"></i> Desde:</label>
            <input type="date" [(ngModel)]="fechaDesde" class="form-control">
          </div>
          <div class="filtro-group">
            <label><i class="bi bi-calendar-event text-verde-selva mr-1"></i> Hasta:</label>
            <input type="date" [(ngModel)]="fechaHasta" class="form-control">
          </div>
          <div class="filtro-group flex-1">
            <label><i class="bi bi-search text-verde-selva mr-1"></i> Buscar Transacción:</label>
            <input 
              type="text" 
              [(ngModel)]="searchTerm" 
              (input)="onFilter()"
              placeholder="Buscar por cliente, RUC, número comprobante o habitación..."
              class="form-control"
            />
          </div>
        </div>
        
        <div class="filtros-acciones">
          <button (click)="onFilter()" class="btn-primary">
            <i class="bi bi-funnel-fill mr-1"></i> Filtrar Registros
          </button>
          <button (click)="resetFilters()" class="btn-secondary">
            <i class="bi bi-trash mr-1"></i> Limpiar Filtros
          </button>
          <div class="spacer"></div>
          <button (click)="exportarExcel()" class="btn-success">
            <i class="bi bi-file-earmark-excel-fill mr-1"></i> Exportar Excel para Contador
          </button>
        </div>
      </div>

      <!-- TABLA DE CONTROL DE PAGOS -->
      <div class="table-card glass-panel">
        <div class="table-responsive">
          <table class="pms-table">
            <thead>
              <tr>
                <th class="col-comprobante">Comprobante</th>
                <th class="col-fecha">Fecha y Hora</th>
                <th class="col-cliente">Titular / Empresa</th>
                <th class="col-doc">Documento / RUC</th>
                <th class="col-hab">Habitación(es)</th>
                <th class="col-tipo">Tipo</th>
                <th class="col-metodo">Método Pago</th>
                <th class="col-total">Monto Total</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let p of pagosPaginados" class="table-row-hover">
                <td class="col-comprobante codigo-cell">{{ p.comprobanteNumero }}</td>
                <td class="col-fecha fecha-cell">{{ p.fechaPago | date:'dd/MM/yyyy HH:mm' }}</td>
                <td class="col-cliente"><span class="fw-600">{{ p.clienteNombre || p.clienteRazonSocial }}</span></td>
                <td class="col-doc">
                  <span class="doc-tag">
                    {{ p.clienteTipoDocumento || 'DNI' }} - {{ p.clienteDocumento || p.clienteRuc }}
                  </span>
                </td>
                <td class="col-hab">
                  <span class="hab-badge" [class.multiple]="p.cantidadHabitaciones && p.cantidadHabitaciones > 1">
                    {{ p.descripcionHabitaciones || '---' }}
                  </span>
                </td>
                <td class="col-tipo">
                  <span class="badge" [ngClass]="p.tipoComprobante === 'FACTURA' ? 'factura' : 'boleta'">
                    {{ p.tipoComprobante }}
                  </span>
                </td>
                <td class="col-metodo">
                  <div class="metodo-info">
                    <span class="metodo-icon"><i [class]="getMetodoIcon(p.metodoPago)"></i></span>
                    <span class="metodo-text">{{ p.metodoPago }}</span>
                  </div>
                </td>
                <td class="col-total total-cell">S/ {{ p.montoTotal | number:'1.2-2' }}</td>
              </tr>
              <tr *ngIf="filteredPagos.length === 0">
                <td colspan="8" class="empty-state">
                  <div class="empty-icon"><i class="bi bi-bell-fill text-slate-400"></i></div>
                  <p>No se encontraron registros de cobros o transacciones en este período.</p>
                </td>
              </tr>
            </tbody>
            <tfoot *ngIf="filteredPagos.length > 0">
              <tr>
                <td colspan="7" class="text-end fw-bold tfoot-label">TOTAL RECAUDADO FILTRADO</td>
                <td class="col-total text-end fw-bold total-recaudado">S/ {{ totalFiltered | number:'1.2-2' }}</td>
              </tr>
            </tfoot>
          </table>
        </div>
        
        <!-- PAGINACIÓN PREMIUM CON CONTROLES DE MARCA -->
        <div class="paginator-container" *ngIf="filteredPagos.length > 0">
          <div class="paginator-info">
            Mostrando <b>{{ getRangoInicio() }} - {{ getRangoFin() }}</b> de <b>{{ filteredPagos.length }}</b> registros
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

    /* SUMMARY CARDS BOUTIQUE */
    .summary-cards {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 20px;
      margin-bottom: 24px;
    }

    @media (max-width: 992px) {
      .summary-cards {
        grid-template-columns: repeat(2, 1fr);
      }
    }
    @media (max-width: 576px) {
      .summary-cards {
        grid-template-columns: 1fr;
      }
    }

    .card {
      padding: 20px 24px;
      border-radius: 16px;
      display: flex;
      align-items: center;
      box-shadow: 0 4px 12px rgba(0,0,0,0.01);
      border: 1px solid rgba(45, 90, 39, 0.08);
      background: white;
    }

    .card-icon-wrapper {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      background: rgba(78, 141, 70, 0.08);
      color: #4E8D46;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.4rem;
      margin-right: 16px;
      flex-shrink: 0;
      border: 1px solid rgba(78, 141, 70, 0.15);
    }

    .card-icon-wrapper.tropical {
      background: rgba(78, 141, 70, 0.08);
      color: #4E8D46;
      border-color: rgba(78, 141, 70, 0.15);
    }

    .card-icon-wrapper.madera {
      background: rgba(139, 90, 43, 0.08);
      color: #8B5A2B;
      border-color: rgba(139, 90, 43, 0.15);
    }

    .card-icon-wrapper.dorado {
      background: rgba(212, 168, 67, 0.08);
      color: #8B5A2B;
      border-color: rgba(212, 168, 67, 0.15);
    }

    .card-total {
      background: linear-gradient(135deg, #1A211B 0%, #2D5A27 100%);
      color: white;
      border: 1px solid rgba(212, 168, 67, 0.2);
    }

    .card-total .card-icon-wrapper {
      background: rgba(255,255,255,0.12);
      color: #D4A843;
      border-color: rgba(255,255,255,0.2);
    }

    .card-total .card-label {
      color: rgba(255,255,255,0.8);
    }

    .card-label {
      display: block;
      font-size: 0.76rem;
      color: #64748b;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 2px;
    }

    .card-value {
      display: block;
      font-size: 1.3rem;
      font-weight: 800;
      font-family: 'Outfit', sans-serif;
    }

    /* FILTROS GLASSMORPHIC PANEL */
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
      min-width: 250px;
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

    /* BOTONES */
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
    }

    .btn-success:hover {
      background: linear-gradient(135deg, #2D5A27 0%, #1A211B 100%);
      transform: translateY(-1px);
    }

    /* BOUTIQUE TABLE */
    .table-card {
      border-radius: 16px;
      overflow: hidden;
      margin-bottom: 24px;
    }

    .table-responsive {
      width: 100%;
      overflow-x: auto;
    }
    
    .pms-table {
      width: 100%;
      border-collapse: collapse;
    }
    
    .pms-table th, .pms-table td {
      padding: 16px 20px;
      text-align: left;
      font-size: 0.88rem;
      border-bottom: 1px solid rgba(45, 90, 39, 0.05);
    }
    
    .pms-table th {
      background: rgba(248, 250, 252, 0.8);
      color: #2D5A27;
      font-weight: 800;
      font-size: 0.76rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .table-row-hover {
      transition: background 0.2s ease;
    }

    .table-row-hover:hover {
      background: rgba(78, 141, 70, 0.02);
    }

    .codigo-cell {
      font-family: 'Outfit', monospace;
      font-weight: 800;
      color: #2D5A27;
      font-size: 0.88rem;
    }

    .fecha-cell {
      color: #64748b;
      font-size: 0.8rem;
      font-weight: 500;
    }

    .fw-600 {
      font-weight: 700;
      color: #1A211B;
    }

    .doc-tag {
      font-size: 0.75rem;
      color: #8B5A2B;
      background: rgba(139, 90, 43, 0.08);
      padding: 4px 8px;
      border-radius: 6px;
      font-family: 'Outfit', monospace;
      font-weight: 700;
      border: 1px solid rgba(139, 90, 43, 0.15);
      display: inline-block;
    }

    .hab-badge {
      padding: 4px 10px;
      background: rgba(45, 90, 39, 0.08);
      color: #2D5A27;
      border-radius: 6px;
      font-size: 0.8rem;
      font-weight: 700;
      display: inline-block;
      border: 1px solid rgba(45, 90, 39, 0.15);
    }

    .hab-badge.multiple {
      background: rgba(212, 168, 67, 0.08);
      color: #8B5A2B;
      border-color: rgba(212, 168, 67, 0.18);
    }

    .badge {
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 0.72rem;
      font-weight: 800;
      text-transform: uppercase;
      display: inline-block;
      width: 80px;
      text-align: center;
      letter-spacing: 0.02em;
    }

    .badge.boleta {
      background: rgba(78, 141, 70, 0.08);
      color: #4E8D46;
      border: 1px solid rgba(78, 141, 70, 0.15);
    }

    .badge.factura {
      background: rgba(139, 90, 43, 0.08);
      color: #8B5A2B;
      border: 1px solid rgba(139, 90, 43, 0.15);
    }

    .metodo-info {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.82rem;
      font-weight: 600;
      color: #475569;
    }

    .metodo-icon {
      font-size: 1rem;
    }

    .total-cell {
      font-weight: 800;
      color: #2D5A27;
      font-size: 0.95rem;
      font-family: 'Outfit', monospace;
      text-align: right !important;
    }

    .tfoot-label {
      background: rgba(248, 250, 252, 0.8) !important;
      color: #2D5A27 !important;
      font-weight: 800 !important;
      letter-spacing: 0.05em;
    }

    .total-recaudado {
      color: #2D5A27 !important;
      font-size: 1.1rem !important;
      background: rgba(248, 250, 252, 0.8) !important;
      font-family: 'Outfit', monospace;
      font-weight: 800 !important;
      text-align: right !important;
    }

    .empty-state {
      text-align: center;
      padding: 60px !important;
      color: #64748b;
    }

    .empty-icon {
      font-size: 3rem;
      margin-bottom: 16px;
    }

    .empty-state p {
      margin: 0;
      font-size: 0.92rem;
      font-weight: 600;
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

    .fade-in {
      animation: fadeIn 0.4s ease-out forwards;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(8px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class PagoListComponent implements OnInit {
  pagos: PagoResponse[] = [];
  filteredPagos: PagoResponse[] = [];
  pagosPaginados: PagoResponse[] = [];
  searchTerm: string = '';
  fechaDesde: string = '';
  fechaHasta: string = '';

  totalGeneral: number = 0;
  totalFiltered: number = 0;
  totalNetoFiltered: number = 0;
  countBoletas: number = 0;
  countFacturas: number = 0;

  // Paginación
  elementosPorPagina: number = 10;
  paginaActual: number = 1;
  totalPaginas: number = 1;

  constructor(
    private service: PagoService,
    private excelService: ExcelReportService
  ) { }

  ngOnInit(): void {
    const hoy = new Date();
    this.fechaHasta = hoy.toISOString().split('T')[0];
    const haceUnMes = new Date();
    haceUnMes.setMonth(hoy.getMonth() - 1);
    this.fechaDesde = haceUnMes.toISOString().split('T')[0];

    this.cargarPagos();
  }

  cargarPagos(): void {
    this.service.getAll().subscribe({
      next: (data) => {
        this.pagos = data.sort((a, b) => new Date(b.fechaPago).getTime() - new Date(a.fechaPago).getTime());
        this.onFilter();
        this.calcularTotales();
      },
      error: (err) => console.error('Error cargando pagos:', err)
    });
  }

  calcularTotales(): void {
    this.totalGeneral = this.pagos.reduce((acc, p) => acc + (p.montoTotal || 0), 0);
    this.countBoletas = this.pagos.filter(p => p.tipoComprobante === 'BOLETA').length;
    this.countFacturas = this.pagos.filter(p => p.tipoComprobante === 'FACTURA').length;
  }

  updateFilteredTotals(): void {
    this.totalFiltered = this.filteredPagos.reduce((acc, p) => acc + (p.montoTotal || 0), 0);
    this.totalNetoFiltered = this.filteredPagos.reduce((acc, p) => acc + (p.montoNeto || 0), 0);
  }

  onFilter(): void {
    if (!this.pagos) return;

    const search = this.searchTerm.toLowerCase();

    this.filteredPagos = this.pagos.filter(p => {
      const matchesSearch =
        p.comprobanteNumero.toLowerCase().includes(search) ||
        (p.clienteNombre && p.clienteNombre.toLowerCase().includes(search)) ||
        (p.clienteRazonSocial && p.clienteRazonSocial.toLowerCase().includes(search)) ||
        (p.clienteDocumento && p.clienteDocumento.includes(search)) ||
        (p.descripcionHabitaciones && p.descripcionHabitaciones.toLowerCase().includes(search));

      const fechaPago = p.fechaPago ? p.fechaPago.substring(0, 10) : '';
      const matchesFecha =
        (!this.fechaDesde || fechaPago >= this.fechaDesde) &&
        (!this.fechaHasta || fechaPago <= this.fechaHasta);

      return matchesSearch && matchesFecha;
    });

    this.updateFilteredTotals();
    this.paginaActual = 1;
    this.actualizarPaginacion();
  }

  resetFilters(): void {
    this.searchTerm = '';
    const hoy = new Date();
    this.fechaHasta = hoy.toISOString().split('T')[0];
    const haceUnMes = new Date();
    haceUnMes.setMonth(hoy.getMonth() - 1);
    this.fechaDesde = haceUnMes.toISOString().split('T')[0];
    this.onFilter();
  }

  getMetodoIcon(metodo: string): string {
    const m = metodo.toUpperCase();
    if (m === 'EFECTIVO') return 'bi bi-cash text-emerald-600';
    if (m === 'TARJETA') return 'bi bi-credit-card text-sky-600';
    if (m === 'TRANSFERENCIA') return 'bi bi-bank text-amber-600';
    return 'bi bi-wallet2 text-slate-500';
  }

  // MÉTODOS DE PAGINACIÓN
  actualizarPaginacion(): void {
    this.totalPaginas = Math.ceil(this.filteredPagos.length / this.elementosPorPagina) || 1;
    if (this.paginaActual > this.totalPaginas) {
      this.paginaActual = this.totalPaginas;
    }
    
    const inicio = (this.paginaActual - 1) * this.elementosPorPagina;
    const fin = inicio + parseInt(this.elementosPorPagina.toString());
    
    this.pagosPaginados = this.filteredPagos.slice(inicio, fin);
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
    if (this.filteredPagos.length === 0) return 0;
    return (this.paginaActual - 1) * this.elementosPorPagina + 1;
  }

  getRangoFin(): number {
    return Math.min(this.paginaActual * this.elementosPorPagina, this.filteredPagos.length);
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

  exportarExcel(): void {
    if (this.filteredPagos.length === 0) {
      alert('No hay datos filtrados para exportar.');
      return;
    }

    this.excelService.generarExcelConsolidado(this.filteredPagos)
      .then(() => {
        console.log('Reporte exportado con éxito');
      })
      .catch(err => {
        console.error('Error al exportar:', err);
        alert('Hubo un error al generar el archivo Excel.');
      });
  }
}
