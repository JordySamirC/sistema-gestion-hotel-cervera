import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReservaService } from '../../../core/services/reserva.service';
import { PagoService } from '../../../core/services/pago.service';
import { ExcelReportService, ItemExcelReport } from '../../../core/services/excel-report.service';
import { ClienteService } from '../../../core/services/cliente.service';
import { PanelReservaItem, EstadiaResponse, ReservaResponse } from '../../../core/models/reserva';
import { PagoRequest, PagoGrupoRequest, PagoResponse } from '../../../core/models/pago';

@Component({
  selector: 'app-check-out',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-container fade-in">
      <!-- CABECERA PREMIUM DE LA PÁGINA -->
      <div class="header-section">
        <div class="title-area">
          <h2><i class="header-icon-premium bi bi-box-arrow-left"></i> Registrar Salida</h2>
          <p class="subtitle">Registre la salida de huéspedes, concilie cobros y exporte comprobantes oficiales del hotel</p>
        </div>
      </div>

      <!-- BUSCADOR GLASSMORPHIC -->
      <div class="buscador-card glass-panel">
        <div class="search-box">
          <span class="search-icon"><i class="bi bi-search"></i></span>
          <input 
            type="text" 
            placeholder="Buscar por código de reserva, habitación o cliente..."
            [(ngModel)]="terminoBusqueda" 
            (input)="aplicarFiltros()"
            class="search-input"
          />
          <button *ngIf="terminoBusqueda" class="clear-btn" (click)="terminoBusqueda = ''; aplicarFiltros()">✕</button>
        </div>
      </div>

      <!-- LISTADO DE ESTADÍAS ACTIVAS -->
      <div class="table-card glass-panel" *ngIf="!modalActivo">
        <div class="table-responsive">
          <table class="reservas-table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Cliente</th>
                <th>Ingreso</th>
                <th>Salida</th>
                <th>Habitación</th>
                <th>Grupo</th>
                <th>Total Estimado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              <ng-container *ngFor="let item of reservasFiltradas">
                <tr *ngIf="item.tipo === 'INDIVIDUAL'" class="fila-individual table-row-hover">
                  <td class="codigo">{{ item.codigo }}</td>
                  <td class="bold-text"><span class="icono-titular"><i class="bi bi-person-fill text-dorado-amazonico mr-1"></i></span> {{ item.cliente }}</td>
                  <td>{{ item.fechaIngreso | date:'dd/MM/yyyy' }}</td>
                  <td>{{ item.fechaSalida | date:'dd/MM/yyyy' }}</td>
                  <td><span class="room-tag">{{ item.habitacionNumero || 'N/A' }}</span></td>
                  <td><span class="no-grupo">---</span></td>
                  <td class="precio-total">S/ {{ item.precioTotal | number:'1.2-2' }}</td>
                  <td class="acciones-cell">
                    <button class="btn-primary" (click)="abrirModalIndividual(item)">Registrar Salida</button>
                  </td>
                </tr>

                <ng-container *ngIf="item.tipo === 'GRUPO'">
                  <tr class="fila-grupo">
                    <td class="codigo">{{ item.codigo }}</td>
                    <td class="bold-text"><span class="icono-responsable"><i class="bi bi-person-badge-fill text-verde-selva mr-1"></i></span> {{ item.cliente }} <span class="rol-label">(Responsable)</span></td>
                    <td>{{ item.fechaIngreso | date:'dd/MM/yyyy' }}</td>
                    <td>{{ item.fechaSalida | date:'dd/MM/yyyy' }}</td>
                    <td><span class="no-grupo">---</span></td>
                    <td><span class="grupo-nombre-badge">{{ item.grupoNombre }}</span></td>
                    <td class="precio-total">S/ {{ item.precioTotal | number:'1.2-2' }}</td>
                    <td class="acciones-cell">
                      <div class="btn-grupo-acciones">
                        <button class="btn-expandir" (click)="toggleGrupo(item)">
                          {{ item.expandido ? '▲ Ocultar' : '▼ Ver Habitaciones' }}
                        </button>
                        <button class="btn-primary" (click)="abrirModalGrupal(item)">Registrar Salida Grupo</button>
                      </div>
                    </td>
                  </tr>
                  
                  <ng-container *ngIf="item.expandido">
                    <tr *ngFor="let hija of item.hijas" class="fila-hija">
                      <td class="indentado codigo"><span class="branch-connector">└─</span> {{ hija.codigo }}</td>
                      <td class="indentado bold-text"><span class="icono-titular"><i class="bi bi-person-fill text-dorado-amazonico mr-1"></i></span> {{ hija.cliente }}</td>
                      <td>{{ hija.fechaIngreso | date:'dd/MM/yyyy' }}</td>
                      <td>{{ hija.fechaSalida | date:'dd/MM/yyyy' }}</td>
                      <td><span class="room-tag">{{ hija.habitacionNumero || 'N/A' }}</span></td>
                      <td><span class="no-grupo">---</span></td>
                      <td class="precio-total">S/ {{ hija.precioTotal | number:'1.2-2' }}</td>
                      <td class="acciones-cell">
                        <button class="btn-accion-hija" (click)="abrirModalIndividual(hija, item.grupoNombre)">Salida Individual</button>
                      </td>
                    </tr>
                  </ng-container>
                </ng-container>
              </ng-container>
              
              <tr *ngIf="reservasFiltradas.length === 0">
                <td colspan="7" class="empty"><i class="bi bi-bell-fill text-slate-400 mr-2"></i> No hay estadías activas hospedadas para registrar salida</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- MODAL DE CHECK-OUT Y COBRO BOUTIQUE -->
      <div class="modal-overlay" *ngIf="modalActivo" (click)="cerrarModal()">
        <div class="modal-content animate-in" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3><i class="bi" [ngClass]="tipoModal === 'GRUPO' ? 'bi-building-fill text-dorado-amazonico' : 'bi-key-fill text-dorado-amazonico'"></i> {{ tipoModal === 'GRUPO' ? ' Registro de salida de grupo' : ' REGISTRAR SALIDA - ' + itemSeleccionado?.codigo }}</h3>
            <button class="modal-close" (click)="cerrarModal()">&times;</button>
          </div>
          
          <div class="modal-body custom-scroll">
            
            <div *ngIf="tipoModal === 'INDIVIDUAL' && esHijaDeGrupo" class="alert-box alert-warning-custom mb-3">
              <i class="bi bi-exclamation-triangle-fill text-amber-500 mr-2"></i> Esta reserva pertenece al grupo: <strong>{{ nombreGrupoHija }}</strong>
            </div>

            <!-- SECCIÓN: DATOS DE LA HABITACIÓN / RESERVA -->
            <div class="section-box" *ngIf="tipoModal === 'INDIVIDUAL'">
              <div class="section-title"><i class="bi bi-door-open-fill text-dorado-amazonico mr-2"></i> DATOS DE LA ESTADÍA</div>
              <div class="section-content">
                <div class="grid-2-col">
                  <ng-container *ngIf="responsablePagoNombre">
                    <div class="text-dorado-amazonico"><strong>Responsable de Pago:</strong> {{ responsablePagoNombre }}</div>
                    <div class="text-dorado-amazonico"><strong>Doc. Responsable:</strong> {{ pagoRequest.clienteTipoDocumento || 'DNI' }}: {{ pagoRequest.clienteDocumento || '---' }}</div>
                  </ng-container>
                  <div><strong>Huésped Titular:</strong> {{ itemSeleccionado?.cliente }}</div>
                  <div><strong>Doc. Huésped:</strong> {{ documentoCliente || '---' }}</div>
                  <div><strong>Habitación Asignada:</strong> <span class="room-tag-modal">{{ habitacionInfo || itemSeleccionado?.habitacionNumero }}</span></div>
                  <div><strong>Teléfono Contacto:</strong> {{ telefonoCliente || '---' }}</div>
                  <div><strong>Hora de Ingreso:</strong> {{ estadiaIndividual?.fechaIngreso | date:'dd/MM/yyyy HH:mm' }}</div>
                  
                  <ng-container *ngIf="!esSalidaDiferente()">
                    <div><strong>Fecha Salida Pactada:</strong> {{ itemSeleccionado?.fechaSalida | date:'dd/MM/yyyy' }}</div>
                  </ng-container>
                  <ng-container *ngIf="esSalidaDiferente()">
                    <div><strong>Fecha Salida Pactada:</strong> {{ itemSeleccionado?.fechaSalida | date:'dd/MM/yyyy' }}</div>
                    <div class="text-highlight"><strong>Nueva Fecha de Salida:</strong> {{ hoy | date:'dd/MM/yyyy HH:mm' }} </div>
                  </ng-container>

                  <div><strong>Noches transcurridas:</strong> {{ getNochesEfectivas() }} noche(s)</div>
                  <div><strong>Precio unitario por noche:</strong> S/ {{ getPrecioPorNoche() | number:'1.2-2' }}</div>
                </div>

                <div *ngIf="esSalidaDiferente() && !isMismoDia()" class="alert-box alert-warning-custom mt-3">
                  <i class="bi bi-exclamation-triangle-fill text-amber-500 mr-2"></i> El huésped se retira en una fecha distinta a la pactada. 
                  <br>
                  El total ha sido recalculado en base a las noches efectivas.
                </div>

                <div *ngIf="isMismoDia()" class="alert-box alert-info-custom mt-3">
                  <i class="bi bi-calendar-event-fill text-sky-500 mr-2"></i> <strong>Política del hotel:</strong> Registro de ingreso y Registro de salida el mismo día cuenta como 1 día de hospedaje.
                </div>

                <div class="total-box mt-3">
                  <i class="bi bi-cash-stack text-verde-tropical mr-2"></i> TOTAL A PAGAR {{ esHijaDeGrupo ? '(por esta habitación)' : '' }}: <span>S/ {{ getMontoTotal() | number:'1.2-2' }}</span>
                </div>
              </div>
            </div>

            <!-- SECCIÓN: DATOS GENERALES DEL GRUPO -->
            <div class="section-box" *ngIf="tipoModal === 'GRUPO'">
              <div class="section-title"><i class="bi bi-people-fill text-dorado-amazonico mr-2"></i> INFORMACIÓN DE CONSOLIDACIÓN DE GRUPO</div>
              <div class="section-content">
                <div class="grid-2-col">
                  <div><strong>Código de Grupo:</strong> {{ itemSeleccionado?.codigo }}</div>
                  <div><strong>Responsable de Cargo:</strong> {{ itemSeleccionado?.cliente }}</div>
                  <div><strong>Período de Estadía:</strong> {{ itemSeleccionado?.fechaIngreso | date:'dd/MM/yyyy' }} al {{ itemSeleccionado?.fechaSalida | date:'dd/MM/yyyy' }}</div>
                  <div><strong>Noches de Estadía:</strong> {{ getNochesGrupo() }} noche(s)</div>
                </div>
              </div>
            </div>

            <!-- SECCIÓN: DETALLE DE HABITACIONES DEL GRUPO -->
            <div class="section-box" *ngIf="tipoModal === 'GRUPO'">
              <div class="section-title"><i class="bi bi-door-closed-fill text-dorado-amazonico mr-2"></i> HABITACIONES CON CARGO AL GRUPO</div>
              <div class="section-content p-0">
                <table class="inner-table">
                  <thead>
                    <tr>
                      <th>Código</th>
                      <th>Titular</th>
                      <th>Habitación</th>
                      <th>Ingreso</th>
                      <th>Salida</th>
                      <th>Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let hija of itemSeleccionado?.hijas">
                      <td class="codigo">{{ hija.codigo }}</td>
                      <td><i class="bi bi-award-fill text-dorado-amazonico mr-1"></i> {{ hija.cliente }}</td>
                      <td><span class="room-tag-mini">{{ hija.habitacionNumero || 'N/A' }}</span></td>
                      <td>{{ hija.fechaIngreso | date:'dd/MM/yyyy' }}</td>
                      <td>{{ hija.fechaSalida | date:'dd/MM/yyyy' }}</td>
                      <td><strong>S/ {{ hija.precioTotal | number:'1.2-2' }}</strong></td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colspan="4"></td>
                      <td style="font-weight: 800; text-align: right; color: #2D5A27;">TOTAL CONSOLIDADO</td>
                      <td style="font-weight: 800; color: #2D5A27; font-size: 0.95rem;">S/ {{ getMontoTotal() | number:'1.2-2' }}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            <!-- SECCIÓN: CONCILIACIÓN DE PAGO -->
            <div class="section-box">
              <div class="section-title font-gold-accent"><i class="bi bi-cash-stack text-dorado-amazonico mr-2"></i> CONCILIACIÓN Y LIQUIDACIÓN DE PAGO</div>
              <div class="section-content">
                <label class="checkbox-label">
                  <input type="checkbox" [(ngModel)]="pagoConfirmado" class="custom-checkbox-input"> 
                  <span class="custom-checkbox-box"></span>
                  <span class="label-text-checkout">Confirmo que el cliente ha cancelado la totalidad del monto (S/ {{ getMontoTotal() | number:'1.2-2' }}).</span>
                </label>
                
                <div class="form-row-checkout mt-3">
                  <div class="form-group-checkout">
                    <label class="form-label-checkout">Método de Pago *</label>
                    <select [(ngModel)]="pagoRequest.metodoPago" class="form-control-checkout">
                      <option value="EFECTIVO">Efectivo</option>
                      <option value="TARJETA">Tarjeta Crédito/Débito</option>
                      <option value="TRANSFERENCIA">Transferencia Bancaria</option>
                    </select>
                  </div>
                  
                  <div class="form-group-checkout" *ngIf="pagoRequest.metodoPago !== 'EFECTIVO'">
                    <label class="form-label-checkout">Referencia / Voucher de Operación *</label>
                    <input type="text" [(ngModel)]="pagoRequest.referenciaPago" class="form-control-checkout" placeholder="Ej: OP-12345678">
                  </div>
                </div>
              </div>
            </div>

            <!-- SECCIÓN: DATOS DE FACTURACIÓN -->
            <div class="section-box">
              <div class="section-title"><i class="bi bi-file-earmark-text-fill text-dorado-amazonico mr-2"></i> DATOS PARA COMPROBANTE OFICIAL</div>
              <div class="section-content">
                <div class="form-group-checkout">
                  <label class="form-label-checkout">Tipo de Comprobante *</label>
                  <div class="radio-group-checkout">
                    <label class="radio-label-checkout">
                      <input type="radio" [(ngModel)]="pagoRequest.tipoComprobante" value="BOLETA" (change)="onCambioComprobante()"> 
                      <span class="custom-radio-circle"></span>
                      <span>Boleta de Venta (Persona Natural)</span>
                    </label>
                    <label class="radio-label-checkout">
                      <input type="radio" [(ngModel)]="pagoRequest.tipoComprobante" value="FACTURA" (change)="onCambioComprobante()"> 
                      <span class="custom-radio-circle"></span>
                      <span>Factura Comercial (Empresas - con RUC)</span>
                    </label>
                  </div>
                </div>

                <!-- Campos para Boleta -->
                <div class="grid-2-col mt-2" *ngIf="pagoRequest.tipoComprobante === 'BOLETA'">
                  <div class="form-group-checkout">
                    <label class="form-label-checkout">Documento del Responsable de Pago</label>
                    <input type="text" [(ngModel)]="pagoRequest.clienteDocumento" class="form-control-checkout readonly-input" [readonly]="true">
                  </div>
                  <div class="form-group-checkout">
                    <label class="form-label-checkout">Nombre del Responsable de Pago</label>
                    <input type="text" [(ngModel)]="pagoRequest.clienteNombre" class="form-control-checkout readonly-input" [readonly]="true">
                  </div>
                </div>
                
                <!-- Campos para Factura -->
                <div class="grid-2-col mt-2" *ngIf="pagoRequest.tipoComprobante === 'FACTURA'">
                  <div class="form-group-checkout">
                    <label class="form-label-checkout">RUC de la Empresa *</label>
                    <input type="text" [(ngModel)]="pagoRequest.clienteRuc" class="form-control-checkout" placeholder="11 dígitos obligatorios" maxlength="11">
                  </div>
                  <div class="form-group-checkout">
                    <label class="form-label-checkout">Razón Social *</label>
                    <input type="text" [(ngModel)]="pagoRequest.clienteRazonSocial" class="form-control-checkout" placeholder="Ej: Negocios Turísticos S.A.C.">
                  </div>
                </div>
              </div>
            </div>

            <!-- OBSERVACIONES -->
            <div class="section-box">
              <div class="section-title"><i class="bi bi-pencil-square text-dorado-amazonico mr-2"></i> OBSERVACIONES / INCIDENCIAS</div>
              <div class="section-content">
                <textarea [(ngModel)]="pagoRequest.observaciones" class="form-control-checkout" rows="2" placeholder="Detalle si hubo consumos extra, penalidades o incidencias..."></textarea>
              </div>
            </div>

            <!-- DETALLES DE AUDITORÍA -->
            <div class="alert-box alert-info-custom mt-3">
              <strong><i class="bi bi-exclamation-triangle-fill text-amber-500 mr-2"></i> Al registrar la salida:</strong>
              <ul class="alert-list-checkout">
                <li *ngIf="tipoModal === 'INDIVIDUAL'">La habitación asignada pasará de HOSPEDADO a <strong>POR LIMPIAR</strong>.</li>
                <li *ngIf="tipoModal === 'GRUPO'">Todas las habitaciones asociadas al grupo pasarán a estado <strong>POR LIMPIAR</strong>.</li>
                <li>Se registrará en el sistema la hora exacta del servidor y se generará una orden de limpieza automática.</li>
                <li>Se descargará el reporte Excel oficial de facturación para enviar automáticamente por correo o WhatsApp.</li>
              </ul>
            </div>

          </div>
          
          <div class="modal-footer">
            <button class="btn-cancel" (click)="cerrarModal()">Cancelar</button>
            <button 
              class="btn-success" 
              (click)="onPagar()" 
              [disabled]="procesando || !pagoConfirmado || (pagoRequest.tipoComprobante === 'FACTURA' && (!pagoRequest.clienteRuc || pagoRequest.clienteRuc.trim().length < 11))">
              <i class="bi bi-check-circle-fill mr-1" *ngIf="!procesando"></i> {{ procesando ? 'Procesando...' : 'Confirmar Salida y Cobro' }}
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

    /* BUSCADOR GLASSMORPHIC */
    .glass-panel {
      background: rgba(255, 255, 255, 0.9);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border: 1px solid rgba(45, 90, 39, 0.08);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.03);
    }

    .buscador-card {
      border-radius: 16px;
      padding: 16px 20px;
      margin-bottom: 24px;
    }

    .search-box {
      position: relative;
      display: flex;
      align-items: center;
    }
    
    .search-icon {
      position: absolute;
      left: 16px;
      color: #64748b;
      font-size: 1.1rem;
    }
    
    .search-input {
      width: 100%;
      padding: 12px 14px 12px 46px;
      border: 1px solid #cbd5e1;
      border-radius: 12px;
      font-size: 0.92rem;
      font-family: inherit;
      outline: none;
      transition: all 0.25s ease;
      background: rgba(248, 250, 252, 0.7);
      box-sizing: border-box;
    }
    
    .search-input:focus {
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

    /* TABLE */
    .table-card {
      border-radius: 16px;
      overflow: hidden;
      margin-bottom: 24px;
    }

    .table-responsive {
      width: 100%;
      overflow-x: auto;
    }
    
    .reservas-table {
      width: 100%;
      border-collapse: collapse;
    }
    
    .reservas-table th, .reservas-table td {
      padding: 16px 20px;
      text-align: left;
      font-size: 0.88rem;
      border-bottom: 1px solid rgba(45, 90, 39, 0.05);
    }
    
    .reservas-table th {
      background: rgba(248, 250, 252, 0.8);
      color: #2D5A27;
      font-weight: 800;
      font-size: 0.76rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    
    .codigo {
      font-family: 'Outfit', monospace;
      font-weight: 800;
      color: #2D5A27; /* Verde Selva */
      font-size: 0.88rem;
    }
    
    .room-tag {
      background: rgba(45, 90, 39, 0.08);
      color: #2D5A27;
      padding: 4px 10px;
      border-radius: 8px;
      font-weight: 800;
      font-family: 'Outfit', sans-serif;
      font-size: 0.82rem;
      border: 1px solid rgba(45, 90, 39, 0.15);
      display: inline-block;
    }

    .no-grupo {
      color: #94a3b8;
      font-weight: 500;
    }

    .grupo-nombre-badge {
      display: inline-block;
      background: rgba(139, 90, 43, 0.08);
      color: #8B5A2B;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 0.78rem;
      font-weight: 700;
      border: 1px solid rgba(139, 90, 43, 0.15);
    }

    .icono-titular, .icono-responsable {
      font-size: 1rem;
    }

    .rol-label {
      color: #8B5A2B;
      font-size: 0.74rem;
      font-weight: 700;
      background: rgba(139, 90, 43, 0.08);
      padding: 2px 6px;
      border-radius: 4px;
    }

    .fila-grupo {
      background-color: rgba(139, 90, 43, 0.02);
      border-left: 5px solid #8B5A2B; /* Borde madera para grupos */
    }

    .fila-grupo:hover {
      background-color: rgba(139, 90, 43, 0.05);
    }

    .fila-hija td {
      font-size: 0.82rem;
      background-color: rgba(248, 250, 252, 0.5);
    }

    .fila-hija:hover {
      background-color: rgba(78, 141, 70, 0.02);
    }

    .indentado {
      padding-left: 36px !important;
    }

    .branch-connector {
      color: #94a3b8;
      font-weight: bold;
      margin-right: 4px;
      font-family: monospace;
    }

    .table-row-hover {
      transition: background 0.2s ease;
    }

    .table-row-hover:hover {
      background: rgba(78, 141, 70, 0.02);
    }

    .bold-text {
      font-weight: 700;
      color: #1A211B;
    }

    .precio-total {
      font-weight: 800;
      color: #8B5A2B; /* Marrón Madera */
      font-size: 0.9rem;
    }

    .acciones-cell {
      white-space: nowrap;
    }

    .btn-grupo-acciones {
      display: inline-flex;
      gap: 8px;
    }

    .btn-accion-hija {
      padding: 6px 12px;
      background: rgba(78, 141, 70, 0.08);
      color: #4E8D46;
      border: 1px solid rgba(78, 141, 70, 0.15);
      border-radius: 8px;
      cursor: pointer;
      font-size: 0.76rem;
      font-weight: 700;
      transition: all 0.2s ease;
    }

    .btn-accion-hija:hover {
      background: #4E8D46;
      color: white;
    }

    .btn-expandir {
      padding: 6px 14px;
      background: transparent;
      color: #8B5A2B;
      border: 1px solid rgba(139, 90, 43, 0.3);
      border-radius: 8px;
      cursor: pointer;
      font-size: 0.76rem;
      font-weight: 700;
      transition: all 0.2s ease;
    }

    .btn-expandir:hover {
      background: rgba(139, 90, 43, 0.06);
    }

    .btn-primary {
      padding: 8px 16px;
      background: linear-gradient(135deg, #2D5A27 0%, #1A211B 100%);
      color: white;
      border: 1px solid rgba(212, 168, 67, 0.15);
      border-radius: 8px;
      cursor: pointer;
      font-size: 0.8rem;
      font-weight: 700;
      white-space: nowrap;
      transition: all 0.25s ease;
    }

    .btn-primary:hover {
      background: linear-gradient(135deg, #4E8D46 0%, #2D5A27 100%);
      box-shadow: 0 4px 10px rgba(45, 90, 39, 0.15);
    }

    .empty {
      text-align: center;
      color: #64748b;
      padding: 40px;
      font-size: 0.9rem;
      font-weight: 600;
    }

    /* MODAL DE CHECK-OUT Y COBRO BOUTIQUE */
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(26, 33, 27, 0.45);
      backdrop-filter: blur(5px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .modal-content {
      background: white;
      border-radius: 20px;
      width: 680px;
      max-width: 95vw;
      max-height: 90vh;
      display: flex;
      flex-direction: column;
      box-shadow: 0 25px 50px -12px rgba(0,0,0,0.15);
      border: 1px solid rgba(45, 90, 39, 0.12);
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 28px;
      border-bottom: 1px solid rgba(45, 90, 39, 0.08);
      background: linear-gradient(135deg, #1A211B 0%, #2D5A27 100%);
      color: white;
    }

    .modal-header h3 {
      margin: 0;
      font-size: 1.15rem;
      color: #ffffff;
      font-weight: 800;
      text-shadow: 0 1px 2px rgba(0,0,0,0.15);
    }

    .modal-close {
      background: none;
      border: none;
      font-size: 1.4rem;
      cursor: pointer;
      color: rgba(255, 255, 255, 0.8);
      padding: 0;
      line-height: 1;
    }

    .modal-close:hover {
      color: #ffffff;
    }

    .modal-body {
      padding: 24px 28px;
      overflow-y: auto;
      flex: 1;
    }

    .custom-scroll::-webkit-scrollbar {
      width: 6px;
    }
    .custom-scroll::-webkit-scrollbar-track {
      background: #f1f5f9;
    }
    .custom-scroll::-webkit-scrollbar-thumb {
      background: #cbd5e1;
      border-radius: 3px;
    }
    .custom-scroll::-webkit-scrollbar-thumb:hover {
      background: #94a3b8;
    }

    /* SECTION BOX STYLING */
    .section-box {
      border: 1px solid rgba(45, 90, 39, 0.08);
      border-radius: 12px;
      margin-bottom: 20px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0,0,0,0.01);
    }

    .section-title {
      background: rgba(248, 250, 252, 0.8);
      padding: 12px 18px;
      font-size: 0.82rem;
      font-weight: 800;
      color: #2D5A27;
      border-bottom: 1px solid rgba(45, 90, 39, 0.08);
      letter-spacing: 0.05em;
    }

    .font-gold-accent {
      color: #8B5A2B;
      border-bottom-color: rgba(139, 90, 43, 0.12);
      background: rgba(139, 90, 43, 0.03);
    }

    .section-content {
      padding: 18px;
      background: #fff;
    }

    .grid-2-col {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px 24px;
      font-size: 0.88rem;
      color: #334155;
    }

    @media(max-width: 576px) {
      .grid-2-col {
        grid-template-columns: 1fr;
        gap: 12px;
      }
    }

    .room-tag-modal {
      background: rgba(45, 90, 39, 0.08);
      color: #2D5A27;
      padding: 2px 8px;
      border-radius: 6px;
      font-weight: 700;
      font-family: inherit;
    }

    .total-box {
      padding: 14px;
      background: rgba(45, 90, 39, 0.06);
      border-radius: 10px;
      font-weight: 800;
      font-size: 1.05rem;
      color: #2D5A27;
      border: 1px solid rgba(45, 90, 39, 0.12);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .total-box span {
      font-size: 1.25rem;
      color: #2D5A27;
    }

    .text-highlight {
      color: #c2410c;
      font-weight: 700;
      background: rgba(194, 65, 12, 0.06);
      padding: 2px 6px;
      border-radius: 4px;
    }

    /* INNER TABLES */
    .inner-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.82rem;
    }

    .inner-table th, .inner-table td {
      padding: 10px 14px;
      text-align: left;
      border-bottom: 1px solid #e2e8f0;
    }

    .inner-table th {
      background: rgba(248, 250, 252, 0.8);
      color: #2D5A27;
      font-weight: 800;
    }

    .room-tag-mini {
      background: rgba(45, 90, 39, 0.08);
      color: #2D5A27;
      padding: 2px 6px;
      border-radius: 4px;
      font-weight: 700;
    }

    /* CUSTOM CHECKBOX CHEKOUT */
    .checkbox-label {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      font-size: 0.88rem;
      font-weight: 700;
      color: #1A211B;
      cursor: pointer;
      user-select: none;
    }

    .custom-checkbox-input {
      position: absolute;
      opacity: 0;
      cursor: pointer;
      height: 0;
      width: 0;
    }

    .custom-checkbox-box {
      width: 20px;
      height: 20px;
      background: white;
      border: 2px solid #cbd5e1;
      border-radius: 6px;
      display: inline-block;
      flex-shrink: 0;
      margin-top: 1px;
      position: relative;
      transition: all 0.2s ease;
    }

    .checkbox-label:hover input ~ .custom-checkbox-box {
      border-color: #2D5A27;
    }

    .checkbox-label input:checked ~ .custom-checkbox-box {
      background: #2D5A27;
      border-color: #2D5A27;
    }

    .custom-checkbox-box::after {
      content: "";
      position: absolute;
      display: none;
      left: 6px;
      top: 2px;
      width: 4px;
      height: 8px;
      border: solid white;
      border-width: 0 2px 2px 0;
      transform: rotate(45deg);
    }

    .checkbox-label input:checked ~ .custom-checkbox-box::after {
      display: block;
    }

    .label-text-checkout {
      line-height: 1.4;
      font-size: 0.88rem;
    }

    .form-row-checkout {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }

    @media(max-width: 576px) {
      .form-row-checkout {
        grid-template-columns: 1fr;
        gap: 12px;
      }
    }

    .form-group-checkout {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .form-label-checkout {
      font-size: 0.8rem;
      font-weight: 700;
      color: #2D5A27;
      text-transform: uppercase;
      letter-spacing: 0.02em;
    }

    .form-control-checkout {
      width: 100%;
      padding: 10px 12px;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      font-size: 0.88rem;
      font-family: inherit;
      outline: none;
      transition: all 0.25s ease;
      background: rgba(248, 250, 252, 0.7);
      box-sizing: border-box;
    }

    .form-control-checkout:focus {
      border-color: #2D5A27;
      box-shadow: 0 0 0 3px rgba(45, 90, 39, 0.12);
      background: white;
    }

    .readonly-input {
      background-color: rgba(241, 245, 249, 0.8) !important;
      border-color: #cbd5e1 !important;
      color: #475569 !important;
      cursor: not-allowed !important;
    }

    /* CUSTOM RADIO BUTTONS COMPROBANTE */
    .radio-group-checkout {
      display: flex;
      gap: 20px;
      margin-top: 6px;
      flex-wrap: wrap;
    }

    .radio-label-checkout {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.85rem;
      color: #334155;
      cursor: pointer;
      user-select: none;
      position: relative;
    }

    .radio-label-checkout input {
      position: absolute;
      opacity: 0;
      cursor: pointer;
    }

    .custom-radio-circle {
      width: 18px;
      height: 18px;
      background: white;
      border: 2px solid #cbd5e1;
      border-radius: 50%;
      display: inline-block;
      position: relative;
      transition: all 0.2s ease;
    }

    .radio-label-checkout:hover input ~ .custom-radio-circle {
      border-color: #2D5A27;
    }

    .radio-label-checkout input:checked ~ .custom-radio-circle {
      border-color: #2D5A27;
    }

    .custom-radio-circle::after {
      content: "";
      position: absolute;
      display: none;
      left: 4px;
      top: 4px;
      width: 6px;
      height: 6px;
      background: #2D5A27;
      border-radius: 50%;
    }

    .radio-label-checkout input:checked ~ .custom-radio-circle::after {
      display: block;
    }

    /* ALERTS */
    .alert-box {
      padding: 14px 18px;
      border-radius: 12px;
      font-size: 0.85rem;
      border-left: 4px solid;
      line-height: 1.4;
    }

    .alert-warning-custom {
      background: rgba(212, 168, 67, 0.08);
      border-left-color: #D4A843;
      color: #8B5A2B;
    }

    .alert-info-custom {
      background: rgba(78, 141, 70, 0.06);
      border-left-color: #4E8D46;
      color: #2D5A27;
    }

    .alert-list-checkout {
      margin: 8px 0 0 0;
      padding-left: 20px;
      font-size: 0.82rem;
      color: #475569;
    }

    .alert-list-checkout li {
      margin-bottom: 4px;
    }

    /* FOOTER */
    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      padding: 16px 28px;
      border-top: 1px solid rgba(45, 90, 39, 0.08);
      background: rgba(248, 250, 252, 0.8);
    }
    
    .btn-cancel {
      padding: 11px 24px;
      background: white;
      border: 1px solid rgba(139, 90, 43, 0.35); /* Marrón Madera */
      border-radius: 10px;
      color: #8B5A2B;
      font-weight: 700;
      font-size: 0.85rem;
      cursor: pointer;
      transition: all 0.25s ease;
    }
    
    .btn-cancel:hover {
      background: rgba(139, 90, 43, 0.06);
    }

    .btn-success {
      padding: 11px 26px;
      background: linear-gradient(135deg, #4E8D46 0%, #2D5A27 100%);
      color: white;
      border: 1px solid rgba(212, 168, 67, 0.15);
      border-radius: 10px;
      font-weight: 700;
      font-size: 0.85rem;
      cursor: pointer;
      transition: all 0.25s ease;
      box-shadow: 0 4px 10px rgba(45, 90, 39, 0.12);
    }

    .btn-success:hover:not(:disabled) {
      background: linear-gradient(135deg, #2D5A27 0%, #1A211B 100%);
    }

    .btn-success:disabled {
      background: #cbd5e1;
      color: #94a3b8;
      border-color: #cbd5e1;
      cursor: not-allowed;
      box-shadow: none;
    }

    .animate-in {
      animation: modalSlideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
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
export class CheckOutComponent implements OnInit {
  reservas: PanelReservaItem[] = [];
  reservasFiltradas: PanelReservaItem[] = [];
  terminoBusqueda = '';

  modalActivo = false;
  tipoModal: 'INDIVIDUAL' | 'GRUPO' = 'INDIVIDUAL';
  itemSeleccionado: PanelReservaItem | null = null;
  estadiaIndividual: EstadiaResponse | null = null;

  // Extra data for Individual modal
  documentoCliente = '';
  tipoDocumentoCliente = '';
  responsablePagoNombre = '';
  telefonoCliente = '';
  esHijaDeGrupo = false;
  nombreGrupoHija = '';
  habitacionInfo = '';
  hoy = new Date();

  // Form states
  pagoConfirmado = false;
  procesando = false;
  referenciaPago = '';
  observacionesPago = '';

  pagoRequest: PagoRequest = {
    estadiaId: '',
    montoTotal: 0,
    metodoPago: 'EFECTIVO',
    tipoComprobante: 'BOLETA',
    serie: 'B001',
    montoNeto: 0,
    igv: 0,
    clienteNombre: '',
    clienteTipoDocumento: 'DNI',
    clienteDocumento: '',
    clienteRuc: '',
    clienteRazonSocial: '',
    referenciaPago: '',
    observaciones: ''
  };

  constructor(
    private reservaService: ReservaService,
    private pagoService: PagoService,
    private clienteService: ClienteService,
    private excelService: ExcelReportService
  ) { }

  ngOnInit(): void {
    this.loadPanel();
  }

  loadPanel(): void {
    this.reservaService.getPanel().subscribe({
      next: (data) => {
        const hoy = new Date();
        const year = hoy.getFullYear();
        const month = String(hoy.getMonth() + 1).padStart(2, '0');
        const day = String(hoy.getDate()).padStart(2, '0');
        const hoyStr = `${year}-${month}-${day}`;

        let activas: PanelReservaItem[] = [];
        for (let r of data) {
          if (r.tipo === 'INDIVIDUAL' && r.estado === 'HOSPEDADO') {
            if (r.fechaSalida >= hoyStr) {
              activas.push({ ...r, expandido: false });
            }
          } else if (r.tipo === 'GRUPO') {
            const hijasHospedadas = r.hijas?.filter(h => h.estado === 'HOSPEDADO' && h.fechaSalida >= hoyStr) || [];
            if (hijasHospedadas.length > 0) {
              const grupoActivo = { ...r, hijas: hijasHospedadas, expandido: false };
              grupoActivo.precioTotal = hijasHospedadas.reduce((sum, h) => sum + (h.precioTotal || 0), 0);
              activas.push(grupoActivo);
            }
          }
        }
        this.reservas = activas;
        this.aplicarFiltros();
      }
    });
  }

  aplicarFiltros(): void {
    let resultado = [...this.reservas];
    if (this.terminoBusqueda) {
      const term = this.terminoBusqueda.toLowerCase();
      resultado = resultado.filter(item => {
        if (item.tipo === 'GRUPO') {
          const match = item.codigo?.toLowerCase().includes(term) ||
            item.cliente?.toLowerCase().includes(term) ||
            item.grupoNombre?.toLowerCase().includes(term) ||
            item.hijas?.some(h =>
              h.codigo?.toLowerCase().includes(term) ||
              h.cliente?.toLowerCase().includes(term) ||
              h.habitacionNumero?.toLowerCase().includes(term)
            );
          if (match) item.expandido = true;
          return match;
        }
        return item.codigo?.toLowerCase().includes(term) ||
          item.cliente?.toLowerCase().includes(term) ||
          item.habitacionNumero?.toLowerCase().includes(term);
      });
    }
    this.reservasFiltradas = resultado;
  }

  toggleGrupo(item: PanelReservaItem): void {
    item.expandido = !item.expandido;
  }

  abrirModalIndividual(item: PanelReservaItem, nombreGrupoOpcional?: string | null): void {
    this.reservaService.getEstadiaPorReserva(item.id).subscribe({
      next: (est) => {
        // Tratar de obtener más datos del cliente a través de getById (para doc y teléfono)
        this.reservaService.getById(item.id).subscribe({
          next: (resData: ReservaResponse) => {
            const titular = resData.huespedes?.find(h => h.esTitular);
            if (titular) {
              this.documentoCliente = titular.clienteDocumento || '---';
            }
            if (resData.clienteId) {
              // Obtener datos completos desde ClienteService para el Responsable de Pago
              this.clienteService.getById(resData.clienteId).subscribe({
                next: (cli) => {
                  this.responsablePagoNombre = cli.nombres + ' ' + cli.apellidos;
                  this.telefonoCliente = cli.telefono || '---';
                  this.tipoDocumentoCliente = cli.tipoDocumento || 'DNI';
                  this.pagoRequest.clienteTipoDocumento = cli.tipoDocumento || 'DNI';
                  this.pagoRequest.clienteDocumento = cli.numeroDocumento;
                  this.pagoRequest.clienteNombre = cli.nombres + ' ' + cli.apellidos;
                },
                error: () => {
                  this.telefonoCliente = '---';
                  this.tipoDocumentoCliente = 'DNI';
                }
              });
            }

            // Buscar info de habitación (número + tipo)
            if (resData.detalles && resData.detalles.length > 0) {
              const det = resData.detalles[0];
              this.habitacionInfo = det.habitacionNumero + ' - ' + det.tipoNombre;
            } else {
              this.habitacionInfo = item.habitacionNumero || 'N/A';
            }
          },
          error: () => {
            this.habitacionInfo = item.habitacionNumero || 'N/A';
          }
        });

        this.itemSeleccionado = item;
        this.tipoModal = 'INDIVIDUAL';
        this.estadiaIndividual = est;
        this.esHijaDeGrupo = item.tipo === 'HIJA' || !!nombreGrupoOpcional;
        this.nombreGrupoHija = nombreGrupoOpcional || item.grupoNombre || '---';
        this.hoy = new Date();

        this.prepararPago(this.recalcularTotalIndividual());
        this.pagoRequest.clienteNombre = '';
        this.pagoRequest.clienteDocumento = '';
        this.pagoRequest.clienteRuc = '';
        this.pagoRequest.clienteRazonSocial = '';
        this.pagoRequest.tipoComprobante = 'BOLETA';
        this.pagoRequest.serie = 'B001';
        this.pagoConfirmado = false;
        this.referenciaPago = '';
        this.observacionesPago = '';
        this.modalActivo = true;
      },
      error: () => alert('Error al cargar estadía.')
    });
  }

  abrirModalGrupal(item: PanelReservaItem): void {
    this.itemSeleccionado = item;
    this.tipoModal = 'GRUPO';
    this.estadiaIndividual = null;
    this.esHijaDeGrupo = false;
    this.prepararPago(item.precioTotal || 0);
    this.pagoRequest.clienteNombre = '';
    this.pagoRequest.clienteDocumento = '';
    this.pagoRequest.clienteRuc = '';
    this.pagoRequest.clienteRazonSocial = '';
    this.pagoRequest.tipoComprobante = 'BOLETA';
    this.pagoRequest.serie = 'B001';
    this.pagoConfirmado = false;
    this.referenciaPago = '';
    this.observacionesPago = '';

    // Cargar datos del responsable de pago
    this.reservaService.getGrupo(item.id).subscribe({
      next: (grupo) => {
        if (grupo.responsablePagoId) {
          this.clienteService.getById(grupo.responsablePagoId).subscribe({
            next: (cli) => {
              this.tipoDocumentoCliente = cli.tipoDocumento || 'DNI';
              this.pagoRequest.clienteTipoDocumento = cli.tipoDocumento || 'DNI';
              this.pagoRequest.clienteDocumento = cli.numeroDocumento;
              this.pagoRequest.clienteNombre = cli.nombres + ' ' + cli.apellidos;
            }
          });
        }
      }
    });

    this.modalActivo = true;
  }

  prepararPago(total: number): void {
    const neto = +(total / 1.18).toFixed(2);
    const igv = +(total - neto).toFixed(2);
    this.pagoRequest = {
      ...this.pagoRequest,
      montoTotal: total,
      montoNeto: neto,
      igv: igv
    };
  }

  getMontoTotal(): number {
    return this.pagoRequest.montoTotal;
  }

  getPrecioPorNoche(): number {
    if (this.estadiaIndividual && this.estadiaIndividual.noches && this.estadiaIndividual.noches > 0) {
      return this.estadiaIndividual.montoTotal / this.estadiaIndividual.noches;
    }
    return 0;
  }

  getNochesEfectivas(): number {
    if (!this.estadiaIndividual?.fechaIngreso) return 0;

    const ingreso = new Date(this.estadiaIndividual.fechaIngreso);
    const salida = new Date(this.hoy);

    ingreso.setHours(0, 0, 0, 0);
    salida.setHours(0, 0, 0, 0);

    const ms = salida.getTime() - ingreso.getTime();
    const noches = Math.ceil(ms / (1000 * 60 * 60 * 24));

    return noches > 0 ? noches : 1;
  }

  esSalidaDiferente(): boolean {
    if (!this.itemSeleccionado?.fechaSalida) return false;

    const pactadaStr = String(this.itemSeleccionado.fechaSalida).substring(0, 10);

    const y = this.hoy.getFullYear();
    const m = String(this.hoy.getMonth() + 1).padStart(2, '0');
    const d = String(this.hoy.getDate()).padStart(2, '0');
    const actualStr = `${y}-${m}-${d}`;

    return pactadaStr !== actualStr;
  }

  recalcularTotalIndividual(): number {
    const noches = this.getNochesEfectivas();
    const precio = this.getPrecioPorNoche();
    return +(noches * precio).toFixed(2);
  }

  isMismoDia(): boolean {
    if (!this.estadiaIndividual?.fechaIngreso) return false;

    const ingresoStr = String(this.estadiaIndividual.fechaIngreso).substring(0, 10);

    const y = this.hoy.getFullYear();
    const m = String(this.hoy.getMonth() + 1).padStart(2, '0');
    const d = String(this.hoy.getDate()).padStart(2, '0');
    const actualStr = `${y}-${m}-${d}`;

    return ingresoStr === actualStr;
  }

  getNochesGrupo(): number {
    if (this.itemSeleccionado?.fechaIngreso && this.itemSeleccionado?.fechaSalida) {
      const ms = new Date(this.itemSeleccionado.fechaSalida).getTime() - new Date(this.itemSeleccionado.fechaIngreso).getTime();
      const dias = Math.ceil(ms / (1000 * 60 * 60 * 24));
      return dias > 0 ? dias : 1;
    }
    return 1;
  }

  cerrarModal(): void {
    this.modalActivo = false;
    this.itemSeleccionado = null;
    this.estadiaIndividual = null;
  }

  onCambioComprobante(): void {
    if (this.pagoRequest.tipoComprobante === 'FACTURA') {
      this.pagoRequest.serie = 'F001';
    } else {
      this.pagoRequest.serie = 'B001';
    }
  }

  onPagar(): void {
    if (!this.pagoConfirmado) return;

    if (this.pagoRequest.tipoComprobante === 'BOLETA') {
      this.pagoRequest.clienteTipoDocumento = 'DNI';
      if (!this.pagoRequest.clienteDocumento || !this.pagoRequest.clienteNombre) {
        alert("Para Boleta, es obligatorio ingresar el DNI y nombre del cliente.");
        return;
      }
    }

    if (this.pagoRequest.tipoComprobante === 'FACTURA') {
      if (!this.pagoRequest.clienteRuc || this.pagoRequest.clienteRuc.length !== 11) {
        alert("Para Factura, es obligatorio ingresar un RUC válido de 11 dígitos.");
        return;
      }
      if (!this.pagoRequest.clienteRazonSocial) {
        alert("Para Factura, es obligatorio ingresar la Razón Social.");
        return;
      }
    }

    if (this.pagoRequest.metodoPago !== 'EFECTIVO' && !this.pagoRequest.referenciaPago?.trim()) {
      alert("Por favor ingrese la Referencia o Voucher del pago.");
      return;
    }

    this.procesando = true;

    if (this.tipoModal === 'GRUPO') {
      const hijas = this.itemSeleccionado!.hijas || [];
      const payload: PagoGrupoRequest = {
        grupoId: this.itemSeleccionado!.id,
        ...this.pagoRequest,
        modoPago: 'CONSOLIDADO',
        descripcionHabitaciones: 'Hab. ' + hijas.map(h => h.habitacionNumero).join(', '),
        cantidadHabitaciones: hijas.length,
        estadiaIds: hijas.map(h => h.id)
      };
      this.reservaService.checkOutGrupo(payload.grupoId, payload).subscribe({
        next: () => {
          this.pagoService.getByGrupo(payload.grupoId!).subscribe({
            next: (pagoReal) => this.finalizarPagoExitoso(hijas, pagoReal),
            error: (err) => {
              alert('Check-out exitoso, pero no se pudo obtener el comprobante para el Excel: ' + err.error?.message);
              this.procesando = false;
              this.cerrarModal();
              this.loadPanel();
            }
          });
        },
        error: (err) => { alert('Error: ' + err.error?.message); this.procesando = false; }
      });
    } else {
      this.pagoRequest.estadiaId = this.estadiaIndividual!.id;
      this.pagoRequest.modoPago = 'INDIVIDUAL';
      this.pagoRequest.descripcionHabitaciones = 'Hab. ' + this.itemSeleccionado!.habitacionNumero;
      this.pagoRequest.cantidadHabitaciones = 1;
      this.pagoRequest.estadiaIds = [this.estadiaIndividual!.id];

      this.reservaService.checkOut(this.pagoRequest.estadiaId).subscribe({
        next: () => {
          this.pagoService.create(this.pagoRequest).subscribe({
            next: (res: PagoResponse) => this.finalizarPagoExitoso([this.itemSeleccionado!], res),
            error: (err) => { alert('Estadía finalizada pero error en el pago: ' + err.error?.message); this.procesando = false; }
          });
        },
        error: (err) => { alert('Error al hacer check-out: ' + err.error?.message); this.procesando = false; }
      });
    }
  }

  finalizarPagoExitoso(habitacionesAfectadas: PanelReservaItem[], pagoReal: PagoResponse): void {
    alert('Check-out registrado exitosamente.');

    const noches = this.estadiaIndividual?.noches || 1;
    const itemsExcel: ItemExcelReport[] = habitacionesAfectadas.map(h => {
      return {
        descripcion: `Hospedaje - Hab. ${h.habitacionNumero}`,
        cantidad: noches,
        precioUnitarioSinIgv: (pagoReal.montoNeto / habitacionesAfectadas.length) / noches,
        montoNeto: pagoReal.montoNeto / habitacionesAfectadas.length,
        igv: pagoReal.igv / habitacionesAfectadas.length,
        total: pagoReal.montoTotal / habitacionesAfectadas.length
      };
    });

    this.excelService.generarExcelContador(pagoReal, itemsExcel);

    this.cerrarModal();
    this.procesando = false;
    this.loadPanel();
  }
}
