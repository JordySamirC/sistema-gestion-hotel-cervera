import { Component, OnInit } from '@angular/core';
import { NgFor, NgIf, NgClass, DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReservaService } from '../../../core/services/reserva.service';
import { AuthService } from '../../../core/services/auth.service';
import { ReservaResponse } from '../../../core/models/reserva';

interface VisualGroup {
  id: string;
  nombreGrupo: string;
  fechaIngreso: string;
  fechaSalida: string;
  reservas: ReservaResponse[];
  expanded?: boolean;
}

@Component({
  selector: 'app-check-in',
  standalone: true,
  imports: [NgFor, NgIf, NgClass, FormsModule, DatePipe, DecimalPipe],
  template: `
    <div class="page-container fade-in">
      <!-- CABECERA PREMIUM DE LA PÁGINA -->
      <div class="header-section">
        <div class="title-area">
          <h2><i class="header-icon-premium bi bi-key-fill"></i> Registro de Ingreso</h2>
          <p class="subtitle">Gestione la entrada física y verificación de identidad de los huéspedes a sus habitaciones</p>
        </div>
      </div>

      <!-- CONTROLADORES: BUSCADOR Y TABS GLASSMORPHIC -->
      <div class="controls-card glass-panel">
        <div class="search-box">
          <span class="search-icon"><i class="bi bi-search"></i></span>
          <input 
            type="text" 
            [(ngModel)]="queryBusqueda" 
            (ngModelChange)="procesarReservas()" 
            placeholder="Buscar por código de reserva, habitación, titular o nombre de grupo..." 
            class="search-input"
          />
          <button *ngIf="queryBusqueda" class="clear-btn" (click)="clearSearch()">✕</button>
        </div>

        <div class="tabs-container">
          <button 
            [class.active]="tabActivo === 'todas'" 
            (click)="setTab('todas')"
            class="tab-btn">
            <i class="bi bi-journal-text mr-1"></i> Todas ({{ countTotal() }})
          </button>
          <button 
            [class.active]="tabActivo === 'individuales'" 
            (click)="setTab('individuales')"
            class="tab-btn">
            <i class="bi bi-person mr-1"></i> Individuales ({{ countIndividuales() }})
          </button>
          <button 
            [class.active]="tabActivo === 'grupales'" 
            (click)="setTab('grupales')"
            class="tab-btn">
            <i class="bi bi-building mr-1"></i> Grupales ({{ countGrupales() }})
          </button>
        </div>
      </div>

      <!-- LISTADO DE RESERVAS -->
      <div class="list-container">
        
        <!-- Estado Vacío -->
        <div class="empty-state glass-panel" *ngIf="gruposVisuales.length === 0 && individualesVisuales.length === 0">
          <div class="empty-icon"><i class="bi bi-bell-fill text-slate-400"></i></div>
          <h3>No hay ingresos pendientes</h3>
          <p>No se encontraron reservas con estado 'RESERVADA' que coincidan con los filtros actuales.</p>
        </div>

        <!-- GRUPOS DE RESERVAS -->
        <div class="group-section" *ngIf="gruposVisuales.length > 0">
          <h3 class="section-title"><i class="bi bi-building-fill text-dorado-amazonico mr-2"></i> Reservas de Grupos</h3>
          
          <div class="group-card" *ngFor="let g of gruposVisuales">
            <div class="group-header" (click)="toggleGroup(g.id)">
              <div class="group-info">
                <span class="group-badge">GRUPO</span>
                <span class="group-name">{{ g.nombreGrupo }}</span>
                <span class="group-dates"><i class="bi bi-calendar3 mr-1 text-slate-500"></i> {{ g.fechaIngreso | date:'dd/MM/yyyy' }} al {{ g.fechaSalida | date:'dd/MM/yyyy' }}</span>
                <span class="room-count"><i class="bi bi-door-closed-fill mr-1 text-slate-500"></i> {{ g.reservas.length }} habitaciones</span>
              </div>
              <div class="group-actions" (click)="$event.stopPropagation()">
                <button class="btn-group-checkin" (click)="abrirCheckInGrupo(g)">
                  <i class="bi bi-check-circle-fill mr-1"></i> Ingreso Completo
                </button>
                <span class="expand-arrow" [class.expanded]="g.expanded">▼</span>
              </div>
            </div>

            <!-- Habitaciones del Grupo (Anidadas) -->
            <div class="group-details" *ngIf="g.expanded">
              <div class="table-responsive">
                <table class="table child-table">
                  <thead>
                    <tr>
                      <th>Código</th>
                      <th>Titular</th>
                      <th>Acompañantes</th>
                      <th>Habitación</th>
                      <th>Tipo</th>
                      <th>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let r of g.reservas" class="table-row-hover">
                      <td class="codigo">{{ r.codigo }}</td>
                      <td class="bold-text">{{ r.clienteNombre }}</td>
                      <td>
                        <span class="badge-huespedes" [title]="getCompanionsTooltip(r)">
                          <i class="bi bi-people-fill mr-1"></i> {{ r.huespedes.length }}
                        </span>
                      </td>
                      <td>
                        <span class="room-tag">{{ getHabitacionNumero(r) }}</span>
                      </td>
                      <td>{{ getHabitacionTipo(r) }}</td>
                      <td>
                        <button class="btn-action-checkin" (click)="abrirCheckInIndividual(r)">
                          <i class="bi bi-key-fill mr-1"></i> Ingreso
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <!-- RESERVAS INDIVIDUALES -->
        <div class="individual-section" *ngIf="individualesVisuales.length > 0">
          <h3 class="section-title"><i class="bi bi-person-fill text-dorado-amazonico mr-2"></i> Reservas Individuales</h3>
          <div class="table-card glass-panel">
            <div class="table-responsive">
              <table class="table">
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Titular</th>
                    <th>Acompañantes</th>
                    <th>Habitación</th>
                    <th>Tipo</th>
                    <th>Fechas</th>
                    <th>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let r of individualesVisuales" class="table-row-hover">
                    <td class="codigo">{{ r.codigo }}</td>
                    <td class="bold-text">{{ r.clienteNombre }}</td>
                    <td>
                      <span class="badge-huespedes" [title]="getCompanionsTooltip(r)">
                        <i class="bi bi-people-fill mr-1"></i> {{ r.huespedes.length }}
                      </span>
                    </td>
                    <td>
                      <span class="room-tag">{{ getHabitacionNumero(r) }}</span>
                    </td>
                    <td>{{ getHabitacionTipo(r) }}</td>
                    <td class="date-col">
                      <div class="check-date-row"><strong>Entra:</strong> {{ r.fechaIngreso | date:'dd/MM/yyyy' }}</div>
                      <div class="sub-date"><strong>Sale:</strong> {{ r.fechaSalida | date:'dd/MM/yyyy' }}</div>
                    </td>
                    <td>
                      <button class="btn-action-checkin" (click)="abrirCheckInIndividual(r)">
                        <i class="bi bi-key-fill mr-1"></i> Registrar Ingreso
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>

      <!-- MODAL DE CONFIRMACIÓN DE INGRESO BOUTIQUE -->
      <div class="modal-backdrop" *ngIf="mostrarModal">
        <div class="modal-content animate-in">
          <div class="modal-header">
            <h3><i class="bi" [ngClass]="modoModal === 'individual' ? 'bi-check-circle-fill text-verde-selva' : 'bi-building-fill text-dorado-amazonico'"></i> {{ modoModal === 'individual' ? ' Registrar Ingreso Individual' : ' Registrar Ingreso Grupal' }}</h3>
            <button class="close-btn" (click)="cerrarModal()">✕</button>
          </div>
          
          <div class="modal-body">
            
            <!-- INFORMACIÓN DE LA RESERVA -->
            <div class="info-section">
              <h4 class="section-subtitle"><i class="bi bi-journal-text text-verde-selva mr-2"></i> Datos de la Reserva</h4>
              <div class="info-grid">
                <div class="info-item">
                  <span class="info-label">Código:</span>
                  <span class="info-value bold-text highlight">{{ modoModal === 'individual' ? reservaSeleccionada?.codigo : 'Ingreso Grupal' }}</span>
                </div>
                <div class="info-item" *ngIf="modoModal === 'individual'">
                  <span class="info-label">Habitación:</span>
                  <span class="info-value room-tag-large">{{ getHabitacionNumero(reservaSeleccionada!) }}</span>
                </div>
                <div class="info-item" *ngIf="modoModal === 'individual'">
                  <span class="info-label">Tipo:</span>
                  <span class="info-value">{{ getHabitacionTipo(reservaSeleccionada!) }}</span>
                </div>
                <div class="info-item" *ngIf="modoModal === 'grupo'">
                  <span class="info-label">Grupo:</span>
                  <span class="info-value bold-text">{{ grupoSeleccionado?.nombreGrupo }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Fecha Ingreso:</span>
                  <span class="info-value">{{ (modoModal === 'individual' ? reservaSeleccionada?.fechaIngreso : grupoSeleccionado?.fechaIngreso) | date:'dd/MM/yyyy' }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Fecha Salida:</span>
                  <span class="info-value">{{ (modoModal === 'individual' ? reservaSeleccionada?.fechaSalida : grupoSeleccionado?.fechaSalida) | date:'dd/MM/yyyy' }}</span>
                </div>
              </div>
            </div>

            <!-- DETALLE DE HUÉSPEDES -->
            <div class="huespedes-section">
              <h4 class="section-subtitle"><i class="bi bi-people-fill text-verde-selva mr-2"></i> Huéspedes a Ingresar</h4>
              
              <!-- Caso Individual -->
              <div class="huespedes-container" *ngIf="modoModal === 'individual'">
                <div class="huesped-card titular">
                  <div class="huesped-badge"><i class="bi bi-award-fill"></i> TITULAR</div>
                  <div class="huesped-name">{{ getTitularNombre(reservaSeleccionada!) }}</div>
                  <div class="huesped-doc"><i class="bi bi-file-earmark-person mr-1"></i> Documento: {{ getTitularDocumento(reservaSeleccionada!) }}</div>
                </div>
                
                <div class="acompanantes-list" *ngIf="getAcompanantes(reservaSeleccionada!).length > 0">
                  <div class="acompanantes-title">Acompañantes registrados:</div>
                  <div class="huesped-card acompanante" *ngFor="let ac of getAcompanantes(reservaSeleccionada!)">
                    <div class="huesped-name">• {{ ac.clienteNombre }}</div>
                    <div class="huesped-doc"><i class="bi bi-file-earmark-person mr-1"></i> Documento: {{ ac.clienteDocumento }}</div>
                  </div>
                </div>
              </div>

              <!-- Caso Grupal -->
              <div class="huespedes-container scrollable" *ngIf="modoModal === 'grupo'">
                <div class="room-group-huesped" *ngFor="let r of grupoSeleccionado?.reservas">
                  <div class="room-header-small">
                    <span>Habitación {{ getHabitacionNumero(r) }} ({{ r.codigo }})</span>
                  </div>
                  <div class="huesped-card titular mini">
                    <div class="huesped-name"><i class="bi bi-award-fill text-dorado-amazonico mr-1"></i> {{ getTitularNombre(r) }}</div>
                    <div class="huesped-doc"><i class="bi bi-file-earmark-person mr-1 text-slate-400"></i> {{ getTitularDocumento(r) }}</div>
                  </div>
                  <div class="huesped-card acompanante mini" *ngFor="let ac of getAcompanantes(r)">
                    <div class="huesped-name"><i class="bi bi-person-fill text-slate-500 mr-1"></i> {{ ac.clienteNombre }}</div>
                    <div class="huesped-doc"><i class="bi bi-file-earmark-person mr-1 text-slate-400"></i> {{ ac.clienteDocumento }}</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- VERIFICACIÓN PRESENCIAL OBLIGATORIA (TEMATIZADO MADERA/DORADO) -->
            <div class="verification-section">
              <h4 class="section-subtitle warning-text"><i class="bi bi-shield-check text-amber-500 mr-2"></i> Verificación de Identidad Física</h4>
              <p class="warning-desc">Por motivos de seguridad y normativas del hotel, debe verificar los documentos físicos de identidad antes de permitir el ingreso.</p>
              
              <div class="checkbox-group">
                <label class="checkbox-label">
                  <input type="checkbox" [(ngModel)]="verificadoTitular" />
                  <span class="custom-checkbox"></span>
                  <span class="label-text">He verificado físicamente el documento de identidad de los Titulares.</span>
                </label>
                
                <label class="checkbox-label">
                  <input type="checkbox" [(ngModel)]="verificadoAcompanantes" />
                  <span class="custom-checkbox"></span>
                  <span class="label-text">He verificado los documentos de los Acompañantes (si aplica).</span>
                </label>
              </div>
            </div>

            <!-- AUDITORIA INGRESO -->
            <div class="audit-notice">
              <i class="bi bi-exclamation-triangle-fill text-amber-500 mr-2"></i> Al confirmar: La habitación pasará a estado <strong>OCUPADA</strong> y se registrará la hora de ingreso del servidor.
            </div>

          </div>
          
          <div class="modal-footer">
            <button class="btn-cancel" (click)="cerrarModal()">Cancelar</button>
            <button 
              class="btn-confirm" 
              [disabled]="!verificadoTitular || !verificadoAcompanantes || guardando"
              (click)="confirmarIngreso()">
              <i class="bi bi-check-circle-fill mr-1" *ngIf="!guardando"></i> {{ guardando ? 'Registrando...' : 'Confirmar Ingreso' }}
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
    
    /* CONTROLS CARD & GLASSMORPHISM */
    .glass-panel {
      background: rgba(255, 255, 255, 0.9);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border: 1px solid rgba(45, 90, 39, 0.08);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.03);
    }

    .controls-card {
      border-radius: 16px;
      padding: 20px 24px;
      margin-bottom: 24px;
      display: flex;
      flex-direction: column;
      gap: 20px;
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
    
    .clear-btn:hover {
      color: #64748b;
    }
    
    /* TABS */
    .tabs-container {
      display: flex;
      gap: 12px;
      border-bottom: 1px solid rgba(45, 90, 39, 0.08);
      padding-bottom: 6px;
      flex-wrap: wrap;
    }
    
    .tab-btn {
      padding: 8px 18px;
      background: none;
      border: none;
      border-bottom: 3px solid transparent;
      color: #64748b;
      font-weight: 700;
      font-size: 0.85rem;
      font-family: inherit;
      cursor: pointer;
      transition: all 0.25s ease;
    }
    
    .tab-btn:hover {
      color: #2D5A27;
    }
    
    .tab-btn.active {
      color: #2D5A27;
      border-bottom-color: #2D5A27;
    }
    
    .section-title {
      font-size: 1.15rem;
      color: #2D5A27;
      margin: 32px 0 16px;
      font-weight: 800;
      letter-spacing: -0.01em;
    }
    
    /* GROUPS IN CHECK-IN */
    .group-card {
      background: white;
      border-radius: 16px;
      margin-bottom: 16px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.01);
      border: 1px solid rgba(45, 90, 39, 0.08);
      border-left: 5px solid #8B5A2B; /* Marrón Madera para grupos */
      overflow: hidden;
    }
    
    .group-header {
      padding: 18px 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: rgba(139, 90, 43, 0.03);
      cursor: pointer;
      user-select: none;
      transition: background 0.25s ease;
    }
    
    .group-header:hover {
      background: rgba(139, 90, 43, 0.06);
    }
    
    .group-info {
      display: flex;
      align-items: center;
      gap: 14px;
      flex-wrap: wrap;
    }
    
    .group-badge {
      background: rgba(139, 90, 43, 0.1);
      color: #8B5A2B;
      font-size: 0.68rem;
      font-weight: 800;
      padding: 3px 8px;
      border-radius: 6px;
      letter-spacing: 0.05em;
    }
    
    .group-name {
      font-weight: 800;
      color: #1A211B;
      font-size: 1rem;
    }
    
    .group-dates {
      color: #64748b;
      font-size: 0.82rem;
      font-weight: 500;
    }
    
    .room-count {
      background: rgba(45, 90, 39, 0.08);
      color: #2D5A27;
      font-size: 0.74rem;
      font-weight: 700;
      padding: 3px 10px;
      border-radius: 20px;
    }
    
    .group-actions {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    
    .btn-group-checkin {
      padding: 8px 18px;
      background: linear-gradient(135deg, #4E8D46 0%, #2D5A27 100%);
      color: white;
      border: 1px solid rgba(212, 168, 67, 0.15);
      border-radius: 10px;
      font-weight: 700;
      font-size: 0.8rem;
      cursor: pointer;
      transition: all 0.25s ease;
      box-shadow: 0 4px 10px rgba(45, 90, 39, 0.12);
    }
    
    .btn-group-checkin:hover {
      background: linear-gradient(135deg, #2D5A27 0%, #1A211B 100%);
      transform: translateY(-1px);
    }
    
    .expand-arrow {
      color: #64748b;
      font-size: 0.8rem;
      transition: transform 0.25s ease;
    }
    
    .expand-arrow.expanded {
      transform: rotate(180deg);
    }
    
    .group-details {
      border-top: 1px solid rgba(45, 90, 39, 0.06);
      padding: 8px 24px 24px;
      background: white;
    }

    /* TABLES BOUTIQUE */
    .table-card {
      border-radius: 16px;
      overflow: hidden;
      margin-bottom: 24px;
    }

    .table-responsive {
      width: 100%;
      overflow-x: auto;
    }
    
    .table {
      width: 100%;
      border-collapse: collapse;
    }
    
    .table th, .table td {
      padding: 16px 20px;
      text-align: left;
      font-size: 0.88rem;
      border-bottom: 1px solid rgba(45, 90, 39, 0.05);
    }
    
    .table th {
      background: rgba(248, 250, 252, 0.8);
      color: #2D5A27;
      font-weight: 800;
      font-size: 0.76rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    
    .child-table th {
      background: rgba(248, 250, 252, 0.6);
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
    
    .badge-huespedes {
      background: rgba(139, 90, 43, 0.08);
      color: #8B5A2B;
      padding: 4px 12px;
      border-radius: 20px;
      font-weight: 700;
      font-size: 0.8rem;
      cursor: help;
      border: 1px solid rgba(139, 90, 43, 0.15);
      display: inline-block;
    }
    
    .date-col {
      color: #334155;
      line-height: 1.4;
    }

    .check-date-row {
      font-size: 0.84rem;
    }
    
    .sub-date {
      color: #64748b;
      font-size: 0.8rem;
    }
    
    .btn-action-checkin {
      padding: 8px 16px;
      background: linear-gradient(135deg, #2D5A27 0%, #1A211B 100%);
      color: white;
      border: 1px solid rgba(212, 168, 67, 0.15);
      border-radius: 10px;
      font-weight: 700;
      font-size: 0.8rem;
      cursor: pointer;
      transition: all 0.25s ease;
    }
    
    .btn-action-checkin:hover {
      background: linear-gradient(135deg, #4E8D46 0%, #2D5A27 100%);
      transform: translateY(-1px);
      box-shadow: 0 4px 10px rgba(45, 90, 39, 0.15);
    }
    
    .empty-state {
      background: white;
      border-radius: 16px;
      padding: 60px 40px;
      text-align: center;
    }
    
    .empty-icon {
      font-size: 3.5rem;
      margin-bottom: 16px;
    }
    
    .empty-state h3 {
      margin: 0;
      font-size: 1.25rem;
      color: #2D5A27;
      font-weight: 800;
    }
    
    .empty-state p {
      margin: 8px 0 0;
      color: #64748b;
      font-size: 0.88rem;
      max-width: 420px;
      margin-inline: auto;
      font-weight: 500;
    }
    
    /* MODAL BOUTIQUE STYLES */
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(26, 33, 27, 0.45);
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
      max-width: 600px;
      box-shadow: 0 25px 50px -12px rgba(0,0,0,0.15);
      border: 1px solid rgba(45, 90, 39, 0.12);
      overflow: hidden;
      display: flex;
      flex-direction: column;
      max-height: 90vh;
    }
    
    .animate-in {
      animation: modalSlideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
    
    @keyframes modalSlideUp {
      from { transform: translateY(20px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
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
      font-size: 1.2rem;
      color: #ffffff;
      font-weight: 800;
      text-shadow: 0 1px 2px rgba(0,0,0,0.15);
    }
    
    .close-btn {
      background: none;
      border: none;
      color: rgba(255, 255, 255, 0.8);
      font-size: 1.3rem;
      cursor: pointer;
      padding: 4px;
      line-height: 1;
    }
    
    .close-btn:hover {
      color: #ffffff;
    }
    
    .modal-body {
      padding: 24px 28px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    
    .section-subtitle {
      margin: 0 0 12px;
      font-size: 0.82rem;
      font-weight: 800;
      color: #2D5A27;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      border-left: 4px solid #D4A843; /* Detalle Dorado */
      padding-left: 10px;
    }
    
    .info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px 24px;
      background: rgba(248, 250, 252, 0.7);
      padding: 16px;
      border-radius: 12px;
      border: 1px solid rgba(45, 90, 39, 0.06);
    }
    
    .info-item {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    
    .info-label {
      color: #64748b;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.02em;
    }
    
    .info-value {
      font-size: 0.9rem;
      color: #1e293b;
      font-weight: 700;
    }
    
    .highlight {
      color: #2D5A27;
    }
    
    .room-tag-large {
      background: rgba(45, 90, 39, 0.08);
      color: #2D5A27;
      padding: 2px 10px;
      border-radius: 6px;
      font-weight: 800;
      font-family: 'Outfit', sans-serif;
      font-size: 0.85rem;
      border: 1px solid rgba(45, 90, 39, 0.15);
      align-self: flex-start;
    }
    
    .huespedes-container {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    
    .huespedes-container.scrollable {
      max-height: 200px;
      overflow-y: auto;
      padding-right: 4px;
    }
    
    .huesped-card {
      padding: 14px;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      position: relative;
    }
    
    .huesped-card.titular {
      background: rgba(212, 168, 67, 0.04);
      border-color: rgba(212, 168, 67, 0.25);
    }
    
    .huesped-card.acompanante {
      background: white;
      border-color: #cbd5e1;
    }
    
    .huesped-card.mini {
      padding: 10px 14px;
      margin-bottom: 6px;
    }
    
    .huesped-badge {
      position: absolute;
      right: 14px;
      top: 14px;
      background: rgba(212, 168, 67, 0.1);
      color: #8B5A2B;
      font-size: 0.65rem;
      font-weight: 800;
      padding: 2px 8px;
      border-radius: 6px;
      letter-spacing: 0.02em;
    }
    
    .huesped-name {
      font-size: 0.9rem;
      font-weight: 700;
      color: #1e293b;
    }
    
    .huesped-doc {
      font-size: 0.8rem;
      color: #64748b;
      margin-top: 2px;
    }
    
    .acompanantes-list {
      margin-top: 12px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    
    .acompanantes-title {
      font-size: 0.78rem;
      font-weight: 700;
      color: #2D5A27;
      margin-bottom: 2px;
      text-transform: uppercase;
      letter-spacing: 0.02em;
    }
    
    .room-group-huesped {
      margin-bottom: 14px;
      border-bottom: 1px solid rgba(45, 90, 39, 0.08);
      padding-bottom: 10px;
    }
    
    .room-header-small {
      font-size: 0.82rem;
      font-weight: 800;
      color: #8B5A2B;
      margin-bottom: 8px;
    }
    
    /* VERIFICACIÓN FISICA (TEMATIZADO MARRÓN/DORADO) */
    .verification-section {
      background: rgba(139, 90, 43, 0.04);
      border: 1px solid rgba(139, 90, 43, 0.2);
      border-radius: 12px;
      padding: 18px;
    }
    
    .warning-text {
      color: #8B5A2B;
      border-left-color: #8B5A2B;
    }
    
    .warning-desc {
      font-size: 0.82rem;
      color: #1A211B;
      margin: 4px 0 14px;
      line-height: 1.4;
      font-weight: 500;
    }
    
    .checkbox-group {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    
    .checkbox-label {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      cursor: pointer;
      position: relative;
      user-select: none;
    }
    
    .checkbox-label input {
      position: absolute;
      opacity: 0;
      cursor: pointer;
      height: 0;
      width: 0;
    }
    
    .custom-checkbox {
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
    
    .checkbox-label:hover input ~ .custom-checkbox {
      border-color: #2D5A27;
    }
    
    .checkbox-label input:checked ~ .custom-checkbox {
      background: #2D5A27;
      border-color: #2D5A27;
    }
    
    .custom-checkbox::after {
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
    
    .checkbox-label input:checked ~ .custom-checkbox::after {
      display: block;
    }
    
    .label-text {
      font-size: 0.85rem;
      color: #1e293b;
      font-weight: 600;
      line-height: 1.4;
    }
    
    .audit-notice {
      background: rgba(248, 250, 252, 0.8);
      border: 1px solid #cbd5e1;
      padding: 12px;
      border-radius: 10px;
      font-size: 0.78rem;
      color: #475569;
      text-align: center;
      line-height: 1.4;
      font-weight: 500;
    }
    
    .modal-footer {
      padding: 16px 28px;
      border-top: 1px solid rgba(45, 90, 39, 0.08);
      display: flex;
      justify-content: flex-end;
      gap: 12px;
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
    
    .btn-confirm {
      padding: 11px 26px;
      background: linear-gradient(135deg, #2D5A27 0%, #1A211B 100%);
      color: white;
      border: 1px solid rgba(212, 168, 67, 0.2);
      border-radius: 10px;
      font-weight: 700;
      font-size: 0.85rem;
      cursor: pointer;
      transition: all 0.25s ease;
      box-shadow: 0 4px 10px rgba(45, 90, 39, 0.15);
    }
    
    .btn-confirm:hover:not(:disabled) {
      background: linear-gradient(135deg, #4E8D46 0%, #2D5A27 100%);
      transform: translateY(-1px);
    }
    
    .btn-confirm:disabled {
      background: #cbd5e1;
      color: #94a3b8;
      cursor: not-allowed;
      border-color: #cbd5e1;
      box-shadow: none;
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
export class CheckInComponent implements OnInit {
  allReservas: ReservaResponse[] = [];
  reservasDelDia: ReservaResponse[] = [];
  gruposVisuales: VisualGroup[] = [];
  individualesVisuales: ReservaResponse[] = [];
  expandedGroups = new Map<string, boolean>();

  queryBusqueda = '';
  tabActivo = 'todas';

  // Modal State
  mostrarModal = false;
  modoModal: 'individual' | 'grupo' = 'individual';
  reservaSeleccionada: ReservaResponse | null = null;
  grupoSeleccionado: VisualGroup | null = null;
  
  verificadoTitular = false;
  verificadoAcompanantes = false;
  guardando = false;

  constructor(
    private service: ReservaService,
    private auth: AuthService
  ) {}

  ngOnInit(): void {
    this.cargarReservas();
  }

  cargarReservas(): void {
    this.service.getAll('RESERVADA').subscribe({
      next: (data) => {
        this.allReservas = data;
        const hoy = new Date();
        const year = hoy.getFullYear();
        const month = String(hoy.getMonth() + 1).padStart(2, '0');
        const day = String(hoy.getDate()).padStart(2, '0');
        const hoyStr = `${year}-${month}-${day}`;
        this.reservasDelDia = data.filter(r => r.fechaIngreso === hoyStr);
        this.procesarReservas();
      },
      error: () => alert('Error al cargar la lista de reservas')
    });
  }

  setTab(tab: string): void {
    this.tabActivo = tab;
    this.procesarReservas();
  }

  clearSearch(): void {
    this.queryBusqueda = '';
    this.procesarReservas();
  }

  toggleGroup(grupoId: string): void {
    const visual = this.gruposVisuales.find(g => g.id === grupoId);
    if (visual) {
      visual.expanded = !visual.expanded;
      this.expandedGroups.set(grupoId, visual.expanded);
    }
  }

  procesarReservas(): void {
    let filtradas = [...this.reservasDelDia];

    // 1. Filtrado por Pestaña/Tab
    if (this.tabActivo === 'individuales') {
      filtradas = filtradas.filter(r => !r.grupoId);
    } else if (this.tabActivo === 'grupales') {
      filtradas = filtradas.filter(r => !!r.grupoId);
    }

    // 2. Filtrado por barra de búsqueda
    if (this.queryBusqueda.trim()) {
      const q = this.queryBusqueda.toLowerCase().trim();
      filtradas = filtradas.filter(r => 
        r.codigo.toLowerCase().includes(q) ||
        r.clienteNombre.toLowerCase().includes(q) ||
        (r.nombreGrupo && r.nombreGrupo.toLowerCase().includes(q)) ||
        r.detalles.some(d => d.habitacionNumero.toLowerCase().includes(q))
      );
    }

    // 3. Agrupamiento
    const gruposMap = new Map<string, VisualGroup>();
    const individuales: ReservaResponse[] = [];

    filtradas.forEach(res => {
      if (res.grupoId) {
        if (!gruposMap.has(res.grupoId)) {
          gruposMap.set(res.grupoId, {
            id: res.grupoId,
            nombreGrupo: res.nombreGrupo || 'Grupo sin nombre',
            fechaIngreso: res.fechaIngreso,
            fechaSalida: res.fechaSalida,
            reservas: [],
            expanded: this.expandedGroups.get(res.grupoId) ?? true
          });
        }
        gruposMap.get(res.grupoId)!.reservas.push(res);
      } else {
        individuales.push(res);
      }
    });

    this.gruposVisuales = Array.from(gruposMap.values());
    this.individualesVisuales = individuales;
  }

  // Contadores
  countTotal(): number {
    return this.reservasDelDia.length;
  }

  countIndividuales(): number {
    return this.reservasDelDia.filter(r => !r.grupoId).length;
  }

  countGrupales(): number {
    return this.reservasDelDia.filter(r => !!r.grupoId).length;
  }

  // Helpers
  getHabitacionNumero(reserva: ReservaResponse): string {
    return reserva.detalles?.[0]?.habitacionNumero || 'N/A';
  }

  getHabitacionTipo(reserva: ReservaResponse): string {
    return reserva.detalles?.[0]?.tipoNombre || 'N/A';
  }

  getTitularNombre(reserva: ReservaResponse): string {
    return reserva.huespedes?.find(h => h.esTitular)?.clienteNombre || reserva.clienteNombre;
  }

  getTitularDocumento(reserva: ReservaResponse): string {
    return reserva.huespedes?.find(h => h.esTitular)?.clienteDocumento || 'N/A';
  }

  getAcompanantes(reserva: ReservaResponse): any[] {
    return reserva.huespedes?.filter(h => !h.esTitular) || [];
  }

  getCompanionsTooltip(reserva: ReservaResponse): string {
    const list = this.getAcompanantes(reserva);
    if (list.length === 0) return 'Sin acompañantes';
    return list.map(ac => ac.clienteNombre).join(', ');
  }

  // MODAL OPERATORS
  abrirCheckInIndividual(reserva: ReservaResponse): void {
    this.modoModal = 'individual';
    this.reservaSeleccionada = reserva;
    this.grupoSeleccionado = null;
    this.verificadoTitular = false;
    this.verificadoAcompanantes = false;
    this.mostrarModal = true;
  }

  abrirCheckInGrupo(grupo: VisualGroup): void {
    this.modoModal = 'grupo';
    this.grupoSeleccionado = grupo;
    this.reservaSeleccionada = null;
    this.verificadoTitular = false;
    this.verificadoAcompanantes = false;
    this.mostrarModal = true;
  }

  cerrarModal(): void {
    this.mostrarModal = false;
    this.reservaSeleccionada = null;
    this.grupoSeleccionado = null;
    this.verificadoTitular = false;
    this.verificadoAcompanantes = false;
  }

  confirmarIngreso(): void {
    if (!this.verificadoTitular || !this.verificadoAcompanantes) return;
    this.guardando = true;

    if (this.modoModal === 'individual' && this.reservaSeleccionada) {
      this.ejecutarCheckInReserva(this.reservaSeleccionada.id, this.reservaSeleccionada.codigo);
    } else if (this.modoModal === 'grupo' && this.grupoSeleccionado) {
      this.ejecutarCheckInMasivo(this.grupoSeleccionado);
    }
  }

  private ejecutarCheckInReserva(reservaId: string, codigo: string): void {
    this.service.checkIn({
      reservaId,
      fechaIngreso: new Date().toISOString()
    }).subscribe({
      next: () => {
        alert(`¡Ingreso registrado con éxito para la reserva ${codigo}!`);
        this.guardando = false;
        this.cerrarModal();
        this.cargarReservas();
      },
      error: (err) => {
        alert(err.error?.message || 'Ocurrió un error al registrar el ingreso.');
        this.guardando = false;
      }
    });
  }

  private ejecutarCheckInMasivo(grupo: VisualGroup): void {
    const promesas = grupo.reservas.map(r => {
      return new Promise<void>((resolve, reject) => {
        this.service.checkIn({
          reservaId: r.id,
          fechaIngreso: new Date().toISOString()
        }).subscribe({
          next: () => resolve(),
          error: (err) => reject(err)
        });
      });
    });

    Promise.all(promesas)
      .then(() => {
        alert(`¡Ingreso grupal completo registrado con éxito para: ${grupo.nombreGrupo}!`);
        this.guardando = false;
        this.cerrarModal();
        this.cargarReservas();
      })
      .catch((err) => {
        alert('Ocurrió un error parcial o total al procesar el ingreso grupal. Por favor verifique el estado en el listado.');
        this.guardando = false;
        this.cerrarModal();
        this.cargarReservas();
      });
  }
}
