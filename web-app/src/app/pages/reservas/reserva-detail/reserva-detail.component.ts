import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ReservaService } from '../../../core/services/reserva.service';
import { ClienteService } from '../../../core/services/cliente.service';
import { AuthService } from '../../../core/services/auth.service';
import { ExcelReportService } from '../../../core/services/excel-report.service';
import { PagoService } from '../../../core/services/pago.service';
import { PagoResponse } from '../../../core/models/pago';
import { ReservaResponse, ExtenderReservaRequest, CancelarReservaRequest, EstadiaResponse } from '../../../core/models/reserva';
import { PrecioHistoricoService } from '../../../core/services/precio-historico.service';
import { ClienteResponse } from '../../../core/models/cliente';
import { forkJoin, of, Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatNativeDateModule } from '@angular/material/core';

@Component({
  selector: 'app-reserva-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, MatDatepickerModule, MatInputModule, MatFormFieldModule, MatNativeDateModule],
  template: `
    <div class="page-container" *ngIf="reserva">
      <div class="volver-section">
        <button class="btn-volver" (click)="volver()"><i class="bi bi-arrow-left"></i> Volver a reservas</button>
      </div>

      <div class="header-section">
        <div>
          <h2><i class="bi bi-calendar-check text-dorado-amazonico"></i> Reserva #{{ reserva.codigo }}</h2>
        </div>
        <div class="header-actions" style="display:flex; align-items:center;">
          <button class="btn-excel" *ngIf="mostrarBtnExcel" (click)="descargarReporte()" [disabled]="descargandoReporte">
            <i class="bi bi-file-earmark-excel"></i> {{ descargandoReporte ? 'Generando...' : 'Descargar Excel' }}
          </button>
          <button class="btn-editar" *ngIf="!modoEdicion && (isReservada || isHospedado)" (click)="toggleEdicion()">
            <i class="bi bi-pencil-fill"></i> Editar
          </button>
          <button class="btn-success" *ngIf="modoEdicion" (click)="guardarCambiosEdicion()" [disabled]="guardandoEdicionGlobal" style="padding: 8px 16px; background: #22c55e; color: #fff; border: 1px solid #16a34a; border-radius: 8px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 8px; margin-right: 8px; margin-left: 8px; transition: all 0.2s;">
            <i class="bi bi-save"></i> {{ guardandoEdicionGlobal ? 'Guardando...' : 'Guardar Cambios' }}
          </button>
          <button class="btn-cancelar-edicion" *ngIf="modoEdicion" (click)="toggleEdicion()" [disabled]="guardandoEdicionGlobal" title="Descartar cambios y salir">
            <i class="bi bi-x-circle"></i> Cancelar
          </button>
        </div>
      </div>

      <div class="info-card mb-4">
        <div class="info-header"><i class="bi bi-info-circle-fill text-dorado-amazonico mr-2"></i> INFORMACIÓN GENERAL</div>
        <div class="info-body info-grid">
          <div class="campo">
            <span class="label">Código:</span>
            <span class="valor codigo">{{ reserva.codigo }}</span>
          </div>
          <div class="campo">
            <span class="label">Estado:</span>
            <span class="badge" [ngClass]="badgeClass(reserva.estado)">{{ estadoLabel }}</span>
          </div>
          <div class="campo">
            <span class="label">Fecha de Reserva:</span>
            <span class="valor">{{ reserva.fechaReserva | date:'dd/MM/yyyy HH:mm' }}</span>
          </div>
          <div class="campo">
            <span class="label">Cliente titular:</span>
            <span class="valor">{{ getTitularNombre() }}</span>
          </div>
          <div class="campo">
            <span class="label">Responsable de pago:</span>
            <span class="valor">{{ reserva.clienteNombre }}</span>
          </div>
          <div class="campo">
            <span class="label">Fecha Ingreso:</span>
            <span class="valor">{{ reserva.fechaIngreso | date:'dd/MM/yyyy' }}</span>
          </div>
          <div class="campo">
            <span class="label">Fecha Salida:</span>
            <span class="valor">{{ reserva.fechaSalida | date:'dd/MM/yyyy' }}</span>
          </div>
          <div class="campo">
            <span class="label">Adultos:</span>
            <span class="valor">{{ reserva.adultos }}</span>
          </div>
          <div class="campo">
            <span class="label">Niños:</span>
            <span class="valor">{{ reserva.ninos }}</span>
          </div>
          <div class="campo">
            <span class="label">Canal:</span>
            <span class="valor">{{ reserva.canalVentaNombre }} {{ reserva.canalVentaOtro ? '(' + reserva.canalVentaOtro + ')' : '' }}</span>
          </div>
          <div class="campo">
            <span class="label">Creado por:</span>
            <span class="valor">{{ reserva.creadoPorNombre }}</span>
          </div>
          <div class="campo" *ngIf="reserva.nombreGrupo">
            <span class="label">Grupo:</span>
            <span class="valor grupo-badge"><i class="bi bi-building-fill mr-1"></i> {{ reserva.nombreGrupo }}</span>
          </div>
          <div class="campo total-estimado col-span-full">
            <span class="label"><i class="bi bi-cash-stack mr-2"></i> Costo Total Estimado:</span>
            <span class="valor highlight">S/ {{ reserva.precioTotal | number:'1.2-2' }}</span>
          </div>
        </div>
      </div>

      <div class="info-card mb-4" style="overflow: visible !important;">
        <div class="info-header"><i class="bi bi-door-open-fill text-dorado-amazonico mr-2"></i> HABITACIÓN</div>
        <div class="info-body p-0">
          <ng-container *ngIf="reserva.estado === 'RESERVADA' && reserva.detalles && reserva.detalles.length > 0">
            <div class="p-4 bg-slate-50 border-b border-slate-200" style="display:flex; justify-content:space-between; align-items:center;">
              <div>
                <span class="text-slate-500 mr-2" style="font-weight:500;">Asignada actualmente:</span>
                <span style="font-weight:700; color:#1e293b; font-size:1.1rem; margin-right:8px;">{{ reserva.detalles[0].habitacionNumero }} - {{ reserva.detalles[0].tipoNombre }} <span style="font-size:0.85rem; color:#64748b; font-weight:500;">(Cap. {{ reserva.detalles[0].capacidadMax }})</span></span>
              </div>
              <div style="font-weight:700; color:#D4A843; font-size:1.1rem;">S/ {{ reserva.detalles[0].precioAplicado | number:'1.2-2' }} <span style="font-size:0.85rem; color:#64748b; font-weight:400;">por noche</span></div>
            </div>
            <div class="p-5" style="background:#f8fafc; border-top:1px solid #e2e8f0;" *ngIf="modoEdicion && habitacionesDisponibles.length > 0">
              <h4 style="font-weight:700; color:#334155; margin-bottom:12px; font-size:0.95rem;"><i class="bi bi-arrow-left-right text-dorado-amazonico mr-2"></i> Cambiar Habitación Asignada</h4>
              <div style="display:flex; gap:12px;">
                <div style="position:relative; flex:1;">
                  <div class="custom-select-wrapper" style="position: relative; width: 100%;">
                    <i class="bi bi-door-open" style="position:absolute; left:12px; top:10px; color:#94a3b8; font-size:1.1rem; z-index: 2;"></i>
                    <div class="form-control" (click)="selectorAbierto = !selectorAbierto" style="padding-left:40px; cursor:pointer; background-color:white; border: 1px solid #cbd5e1; height: auto; min-height: 40px; display: flex; align-items: center; justify-content: space-between;">
                      <span [style.color]="nuevaHabitacionId ? '#1e293b' : '#94a3b8'">
                        {{ getHabitacionSeleccionadaTexto() || '✨ Seleccione una nueva habitación disponible...' }}
                      </span>
                      <i class="bi" [class.bi-chevron-down]="!selectorAbierto" [class.bi-chevron-up]="selectorAbierto" style="color: #94a3b8;"></i>
                    </div>

                    <!-- Menú desplegable personalizado con SCROLL -->
                    <div *ngIf="selectorAbierto" style="position: absolute; top: 100%; left: 0; right: 0; max-height: 280px; overflow-y: auto; background: white; border: 1px solid #cbd5e1; border-top: none; border-radius: 0 0 0.375rem 0.375rem; box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1); z-index: 50;">
                      <ng-container *ngFor="let tipo of getTiposHabitacionDisponibles()">
                        <!-- Cabecera del grupo (Pegajosa) -->
                        <div style="padding: 8px 12px; font-weight:700; color:#475569; background:#f1f5f9; font-size: 0.9rem; position: sticky; top: 0; z-index: 2;">
                          📌 Tipo: {{ tipo.nombre | titlecase }} {{ getPrecioPorTipo(tipo.id) ? '(S/ ' + getPrecioPorTipo(tipo.id) + ' / noche)' : '' }}
                        </div>
                        <!-- Opciones -->
                        <div *ngFor="let h of getHabitacionesPorTipo(tipo.id)" 
                             (click)="seleccionarHabitacion(h.id)"
                             style="padding: 8px 12px 8px 24px; cursor: pointer; color: #1e293b; font-weight: 500; font-size: 0.95rem; border-bottom: 1px solid #f8fafc;"
                             onmouseover="this.style.backgroundColor='#f1f5f9'" 
                             onmouseout="this.style.backgroundColor='transparent'">
                          Habitación {{ h.numero }} (Capacidad: {{ h.capacidadMax }} pers.)
                        </div>
                      </ng-container>
                      <div *ngIf="getTiposHabitacionDisponibles().length === 0" style="padding: 12px; text-align: center; color: #94a3b8;">
                        No hay habitaciones disponibles en estas fechas.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </ng-container>
          <ng-container *ngIf="reserva.estado !== 'RESERVADA' || !reserva.detalles || reserva.detalles.length === 0">
            <table class="custom-table w-full">
              <thead>
                <tr><th style="width:60px; text-align:center;">#</th><th>Habitación</th><th style="text-align:right;">Precio por Noche</th></tr>
              </thead>
              <tbody>
                <tr *ngFor="let d of reserva.detalles; let i = index">
                  <td style="text-align:center; color:#94a3b8; font-weight:500;">{{ i + 1 }}</td>
                  <td style="font-weight:600; color:#334155;">
                    <div style="display:inline-flex; align-items:center; background:#f1f5f9; border:1px solid #e2e8f0; border-radius:6px; padding:4px 12px;">
                      <i class="bi bi-door-closed mr-2" style="color:#94a3b8;"></i>{{ d.habitacionNumero }}
                    </div>
                  </td>
                  <td style="text-align:right; font-weight:700; color:#1e293b;">S/ {{ d.precioAplicado | number:'1.2-2' }}</td>
                </tr>
              </tbody>
            </table>
            <div *ngIf="!reserva.detalles || reserva.detalles.length === 0" style="padding:24px; text-align:center; color:#64748b;">
              <i class="bi bi-exclamation-circle mr-2"></i> Sin habitaciones asignadas
            </div>
          </ng-container>
        </div>
      </div>

      <div class="info-card mb-4" style="overflow: visible !important;">
        <div class="info-header" style="display:flex; justify-content:space-between; align-items:center;">
          <div><i class="bi bi-people-fill text-dorado-amazonico mr-2"></i> HUÉSPEDES <span class="capacidad-info" *ngIf="capacidadMax">({{ getHuespedesActivosCount() }}/{{ capacidadMax }})</span></div>
        </div>
        <div class="info-body p-0">
          <ul class="huespedes-lista" *ngIf="(reserva.huespedes && reserva.huespedes.length > 0) || huespedesStaged.length > 0">
            <ng-container *ngFor="let h of reserva.huespedes">
              <li class="huesped-item" *ngIf="!huespedesAEliminar.includes(h.id)">
                <div class="huesped-info">
                  <div style="display:flex; align-items:center; gap:8px;">
                    <i class="bi bi-person-circle" style="color:#cbd5e1; font-size:1.25rem;"></i>
                    <span class="huesped-nombre">{{ h.clienteNombre }}</span>
                    <span class="badge bg-dorado-amazonico text-white ml-2" style="font-size:0.7rem;" *ngIf="h.esTitular">Titular</span>
                  </div>
                  <div class="huesped-documento" style="margin-top:4px;"><i class="bi bi-card-heading mr-1"></i> {{ h.clienteDocumento }}</div>
                </div>
                <button class="btn-remove-huesped" *ngIf="modoEdicion && !h.esTitular && puedeEliminarHuesped" (click)="marcarEliminarHuesped(h.id)" title="Eliminar acompañante">
                  <i class="bi bi-trash3-fill"></i>
                </button>
              </li>
            </ng-container>
            
            <!-- Huéspedes en Borrador -->
            <li class="huesped-item" *ngFor="let c of huespedesStaged" style="background:#fefce8; border-left:3px solid #eab308;">
              <div class="huesped-info">
                <div style="display:flex; align-items:center; gap:8px;">
                  <i class="bi bi-person-plus-fill" style="color:#eab308; font-size:1.25rem;"></i>
                  <span class="huesped-nombre">{{ c.nombres }} {{ c.apellidos }}</span>
                  <span class="badge bg-warning text-dark ml-2" style="font-size:0.7rem;">Sin guardar</span>
                </div>
                <div class="huesped-documento" style="margin-top:4px;"><i class="bi bi-card-heading mr-1"></i> {{ c.tipoDocumento }}: {{ c.numeroDocumento }}</div>
              </div>
              <button class="btn-remove-huesped" (click)="quitarStaged(c.id)" title="Deshacer" style="color:#eab308; background:transparent; border:none; cursor:pointer;">
                <i class="bi bi-x-circle-fill"></i>
              </button>
            </li>
          </ul>
          <div *ngIf="getHuespedesActivosCount() === 0" style="padding:24px; text-align:center; color:#64748b;">
            <i class="bi bi-people mr-2"></i> Sin huéspedes registrados
          </div>

          <div class="agregar-huesped" style="padding:20px; background:#f8fafc; border-top:1px solid #e2e8f0;" *ngIf="modoEdicion && puedeAgregarHuesped && capacidadMax && getHuespedesActivosCount() < capacidadMax">
            <h4 style="font-weight:700; color:#334155; margin-bottom:8px;"><i class="bi bi-person-plus-fill mr-2"></i> Agregar acompañante</h4>
            <p style="font-size:0.85rem; color:#64748b; margin-bottom:12px;">Cupo disponible: {{ capacidadMax - getHuespedesActivosCount() }}</p>
            <div class="buscador-cliente">
              <div style="position:relative;">
                <i class="bi bi-search" style="position:absolute; left:12px; top:10px; color:#94a3b8;"></i>
                <input type="text"
                       [(ngModel)]="busquedaCliente"
                       (input)="buscarClientes()"
                       placeholder="Buscar cliente por nombre o documento..."
                       class="form-control" style="padding-left:36px;">
              </div>
              <div class="resultados-busqueda shadow-lg" *ngIf="clientesResultados.length > 0">
                <div class="resultado-item" *ngFor="let c of clientesResultados" (click)="seleccionarCliente(c)">
                  <div class="resultado-nombre"><i class="bi bi-person mr-2"></i>{{ c.nombres }} {{ c.apellidos }}</div>
                  <div class="resultado-doc" style="color:#64748b; font-size:0.75rem; margin-left:24px;">{{ c.tipoDocumento }}: {{ c.numeroDocumento }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="info-card mb-4 border-red-200" style="border-color:#fecaca;" *ngIf="reserva.motivoCancelacion">
        <div class="info-header bg-red-50 text-red-700 border-b-red-200" style="background:#fef2f2; color:#b91c1c; border-bottom:1px solid #fecaca;"><i class="bi bi-x-circle-fill mr-2"></i> CANCELACIÓN</div>
        <div class="info-body info-grid" style="background:#fef2f2;">
          <div class="campo"><span class="label">Motivo:</span><span class="valor font-semibold text-red-700" style="color:#b91c1c; font-weight:600;">{{ reserva.motivoCancelacion }}</span></div>
          <div class="campo" *ngIf="reserva.observacionesCancelacion"><span class="label">Observaciones:</span><span class="valor">{{ reserva.observacionesCancelacion }}</span></div>
          <div class="campo" *ngIf="reserva.fechaCancelacion"><span class="label">Fecha:</span><span class="valor">{{ reserva.fechaCancelacion | date:'dd/MM/yyyy HH:mm' }}</span></div>
          <div class="campo" *ngIf="reserva.canceladoPorNombre"><span class="label">Cancelado por:</span><span class="valor">{{ reserva.canceladoPorNombre }}</span></div>
        </div>
      </div>

      <div class="acciones" style="display:flex; gap:12px; margin-top:24px;" *ngIf="modoEdicion">
        <button class="btn-primary" (click)="abrirExtender()"
                *ngIf="reserva.estado === 'RESERVADA' || reserva.estado === 'HOSPEDADO'">
          <i class="bi bi-calendar-plus mr-2"></i> Extender reserva
        </button>
        <button class="btn-cancelar" (click)="abrirCancelar()"
                *ngIf="reserva.estado === 'RESERVADA'">
          <i class="bi bi-x-circle mr-2"></i> Cancelar reserva
        </button>
      </div>
    </div>

    <div class="cargando-container" *ngIf="!reserva && !error">
      <div class="spinner"></div>
      <p>Cargando información de la reserva...</p>
    </div>

    <div class="error-container" *ngIf="error">
      <i class="bi bi-exclamation-triangle-fill text-red-500 text-4xl mb-3" style="font-size:2.5rem; color:#ef4444; margin-bottom:12px;"></i>
      <p>{{ error }}</p>
      <button class="btn-volver mt-4" (click)="volver()"><i class="bi bi-arrow-left mr-2"></i> Volver al listado</button>
    </div>

    <div class="modal-overlay" *ngIf="modalActivo" (click)="cerrarModal()">
      <div class="modal-content animate-in" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3><i class="bi" [ngClass]="modalActivo === 'extender' ? 'bi-calendar-plus text-dorado-amazonico' : 'bi-x-circle text-red-500'"></i> {{ modalActivo === 'extender' ? ' Extender Reserva' : ' Cancelar Reserva' }}</h3>
          <button class="modal-close" (click)="cerrarModal()">&times;</button>
        </div>

        <div class="modal-body" *ngIf="modalActivo === 'extender'">
          <div class="form-group mb-4">
            <label class="form-label">Código</label>
            <input type="text" [value]="reserva?.codigo" disabled class="form-control" style="background:#f8fafc;">
          </div>
          <div class="form-group mb-4">
            <label class="form-label">Salida actual</label>
            <input type="text" [value]="reserva?.fechaSalida | date:'dd/MM/yyyy HH:mm'" disabled class="form-control" style="background:#f8fafc;">
          </div>
          <div class="form-group mb-4">
            <label class="form-label text-dorado-amazonico" style="font-weight:700; color:#D4A843;">Nueva fecha de salida</label>
            <mat-form-field appearance="outline" class="full-width" subscriptSizing="dynamic">
              <input matInput [matDatepicker]="extendPicker"
                     [(ngModel)]="extendForm.nuevaFechaSalida"
                     [min]="getMinDateExtender()"
                     placeholder="Seleccione fecha">
              <mat-datepicker-toggle matIconSuffix [for]="extendPicker"></mat-datepicker-toggle>
              <mat-datepicker #extendPicker></mat-datepicker>
            </mat-form-field>
          </div>
        </div>

        <div class="modal-body" *ngIf="modalActivo === 'cancelar'">
          <div class="alert-box alert-warning-custom mb-4" style="margin-bottom:16px;">
            <i class="bi bi-exclamation-triangle-fill mr-2" style="color:#d97706;"></i> <strong>Atención:</strong> Esta acción no se puede deshacer. La reserva será cancelada.
          </div>
          <div class="form-group mb-3">
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
            <input *ngIf="cancelFormMotivoSeleccionado === 'Otro (especificar)'" type="text" [(ngModel)]="cancelFormMotivoOtro" placeholder="Especifique el motivo de la cancelación..." class="form-control mt-2" style="margin-top:8px;">
          </div>
          <div class="form-group mb-3">
            <label class="form-label">Observaciones (opcional)</label>
            <textarea [(ngModel)]="cancelForm.observaciones" placeholder="Detalles adicionales..." class="form-control" rows="3"></textarea>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn-cancelar-edicion" (click)="cerrarModal()">Cancelar</button>
          <button class="btn-primary" (click)="guardarModal()" [disabled]="modalGuardando || (modalActivo === 'cancelar' && (!cancelFormMotivoSeleccionado || (cancelFormMotivoSeleccionado === 'Otro (especificar)' && !cancelFormMotivoOtro.trim()))) || (modalActivo === 'extender' && !extendForm.nuevaFechaSalida)">
            {{ modalGuardando ? 'Procesando...' : 'Confirmar' }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-container { padding: 24px; font-family: 'Outfit', 'Inter', -apple-system, sans-serif; background: #f8fafc; min-height: 85vh; max-width: 1000px; margin: 0 auto; width: 100%; }
    .volver-section { margin-bottom: 20px; }
    .btn-volver { display: inline-flex; align-items: center; gap: 8px; padding: 8px 16px; background: #ffffff; color: #475569; border: 1px solid #cbd5e1; border-radius: 8px; cursor: pointer; font-size: 0.9rem; font-weight: 500; transition: all 0.2s ease; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
    .btn-volver:hover { background: #f1f5f9; color: #0f172a; border-color: #94a3b8; }
    
    .header-section { display: flex; justify-content: space-between; align-items: center; padding: 24px 32px; background: linear-gradient(135deg, #1A211B 0%, #2D5A27 100%); border: 1px solid rgba(212, 168, 67, 0.2); border-radius: 16px; box-shadow: 0 10px 30px rgba(45, 90, 39, 0.15); margin-bottom: 24px; position: relative; overflow: hidden; }
    .header-section::before { content: ''; position: absolute; right: -30px; top: -30px; width: 160px; height: 160px; border-radius: 50%; background: radial-gradient(circle, rgba(212, 168, 67, 0.15) 0%, rgba(212, 168, 67, 0) 70%); pointer-events: none; }
    .header-section h2 { margin: 0; font-size: 1.8rem; font-weight: 800; color: #ffffff; letter-spacing: -0.02em; display: flex; align-items: center; gap: 10px; text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2); }
    .header-section .subtitle { margin: 6px 0 0; font-size: 0.98rem; color: rgba(255, 255, 255, 0.85); font-weight: 500; }
    
    .header-actions { display: flex; gap: 10px; z-index: 1; }
    .btn-excel { display: flex; align-items: center; gap: 8px; padding: 10px 20px; background: #107c41; color: white; border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; cursor: pointer; font-size: 0.9rem; font-weight: 600; transition: all 0.2s; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
    .btn-excel:hover { background: #0c5e31; transform: translateY(-1px); }
    .btn-excel:disabled { opacity: 0.7; cursor: not-allowed; transform: none; }
    .btn-editar { display: flex; align-items: center; gap: 8px; padding: 10px 20px; background: rgba(255,255,255,0.15); color: white; border: 1px solid rgba(255,255,255,0.3); border-radius: 8px; cursor: pointer; font-size: 0.9rem; font-weight: 600; transition: all 0.2s; backdrop-filter: blur(4px); }
    .btn-editar:hover { background: rgba(255,255,255,0.25); }
    .btn-cancelar-edicion { display: flex; align-items: center; gap: 8px; padding: 10px 20px; background: #ffffff; color: #333; border: none; border-radius: 8px; cursor: pointer; font-size: 0.9rem; font-weight: 600; transition: all 0.2s; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
    .btn-cancelar-edicion:hover { background: #f8fafc; transform: translateY(-1px); }

    .text-dorado-amazonico { color: #D4A843 !important; }
    .bg-dorado-amazonico { background-color: #D4A843 !important; }
    
    .info-card { background: white; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
    .info-header { padding: 16px 20px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; font-weight: 700; color: #1e293b; font-size: 1rem; letter-spacing: 0.02em; }
    .info-body { padding: 20px; }
    
    .info-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
    .campo { display: flex; flex-direction: column; gap: 4px; padding: 12px; background: #f8fafc; border: 1px solid #f1f5f9; border-radius: 8px; }
    .campo .label { font-size: 0.8rem; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }
    .campo .valor { font-size: 0.95rem; color: #1e293b; font-weight: 500; }
    .col-span-full { grid-column: 1 / -1; }
    
    .codigo { font-family: monospace; font-size: 1.1rem !important; color: #2D5A27 !important; font-weight: 700 !important; }
    .badge { display: inline-block; padding: 4px 12px; border-radius: 9999px; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; width: max-content; }
    .estado-reservada { background: #fef3c7; color: #d97706; border: 1px solid #fde68a; }
    .estado-hospedado { background: #e0f2fe; color: #0284c7; border: 1px solid #bae6fd; }
    .estado-finalizado { background: #dcfce7; color: #166534; border: 1px solid #bbf7d0; }
    .estado-cancelada, .estado-no_show { background: #fee2e2; color: #b91c1c; border: 1px solid #fecaca; }
    .grupo-badge { display: inline-flex; align-items: center; background: #f1f5f9; color: #475569; padding: 4px 10px; border-radius: 6px; font-size: 0.85rem; font-weight: 600; border: 1px solid #e2e8f0; }
    
    .total-estimado { background: linear-gradient(to right, rgba(212, 168, 67, 0.1), rgba(212, 168, 67, 0.05)); border: 1px solid rgba(212, 168, 67, 0.3); }
    .total-estimado .label { color: #8a6d28 !important; }
    .highlight { font-size: 1.25rem !important; color: #b48512 !important; font-weight: 800 !important; }
    
    .custom-table { width: 100%; border-collapse: collapse; }
    .custom-table th { padding: 12px 16px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; text-align: left; font-size: 0.8rem; font-weight: 600; color: #64748b; text-transform: uppercase; }
    .custom-table td { padding: 16px; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }
    .custom-table tr:last-child td { border-bottom: none; }
    
    .huespedes-lista { list-style: none; padding: 0; margin: 0; }
    .huesped-item { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border-bottom: 1px solid #f1f5f9; }
    .huesped-item:last-child { border-bottom: none; }
    .huesped-nombre { font-size: 0.95rem; font-weight: 600; color: #1e293b; }
    .huesped-documento { font-size: 0.85rem; color: #64748b; margin-left: 32px; }
    .btn-remove-huesped { background: #fee2e2; color: #ef4444; border: none; border-radius: 8px; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; }
    .btn-remove-huesped:hover { background: #fca5a5; color: #b91c1c; }
    
    .form-label { display: block; font-size: 0.85rem; font-weight: 600; color: #475569; margin-bottom: 6px; }
    .form-control { width: 100%; padding: 10px 14px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.95rem; color: #1e293b; background: white; transition: all 0.2s; box-sizing: border-box; }
    .form-control:focus { outline: none; border-color: #D4A843; box-shadow: 0 0 0 3px rgba(212, 168, 67, 0.15); }
    .form-control:disabled { background: #f1f5f9; color: #94a3b8; cursor: not-allowed; border-color: #e2e8f0; }
    
    .buscador-cliente { position: relative; }
    .resultados-busqueda { position: absolute; top: 100%; left: 0; right: 0; background: white; border: 1px solid #e2e8f0; border-radius: 8px; max-height: 250px; overflow-y: auto; z-index: 50; margin-top: 4px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1); }
    .resultado-item { padding: 12px 16px; cursor: pointer; border-bottom: 1px solid #f1f5f9; transition: background 0.2s; }
    .resultado-item:last-child { border-bottom: none; }
    .resultado-item:hover { background: #f8fafc; }
    .resultado-nombre { font-size: 0.9rem; font-weight: 600; color: #1e293b; }
    
    .btn-primary { display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #1A211B 0%, #2D5A27 100%); color: white; padding: 10px 20px; border-radius: 8px; border: 1px solid rgba(212, 168, 67, 0.3); font-weight: 600; font-size: 0.95rem; cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 6px rgba(45, 90, 39, 0.15); }
    .btn-primary:hover { box-shadow: 0 6px 12px rgba(45, 90, 39, 0.25); transform: translateY(-1px); }
    .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; transform: none; box-shadow: none; }
    .btn-cancelar { display: flex; align-items: center; justify-content: center; background: #fee2e2; color: #b91c1c; padding: 10px 20px; border-radius: 8px; border: 1px solid #fecaca; font-weight: 600; font-size: 0.95rem; cursor: pointer; transition: all 0.2s; }
    .btn-cancelar:hover { background: #fca5a5; }
    
    .cargando-container, .error-container { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 60px 20px; text-align: center; background: white; border-radius: 16px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
    .cargando-container p { color: #64748b; font-weight: 500; margin-top: 16px; }
    .error-container p { color: #b91c1c; font-weight: 600; font-size: 1.1rem; }
    .spinner { width: 40px; height: 40px; border: 3px solid #f1f5f9; border-top: 3px solid #D4A843; border-radius: 50%; animation: spin 1s linear infinite; }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    
    .success-msg { color: #166534; font-size: 0.85rem; font-weight: 500; }
    .alert-box { padding: 12px 16px; border-radius: 8px; font-size: 0.9rem; }
    .alert-warning-custom { background: #fffbeb; border: 1px solid #fde68a; color: #92400e; }
    
    .modal-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.6); display: flex; align-items: center; justify-content: center; z-index: 1000; backdrop-filter: blur(4px); }
    .modal-content { background: white; border-radius: 16px; width: 500px; max-width: 95vw; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); overflow: hidden; display: flex; flex-direction: column; }
    .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 20px 24px; border-bottom: 1px solid #e2e8f0; background: #f8fafc; }
    .modal-header h3 { margin: 0; font-size: 1.1rem; font-weight: 700; color: #1e293b; }
    .modal-close { background: transparent; border: none; font-size: 1.5rem; color: #94a3b8; cursor: pointer; line-height: 1; transition: color 0.2s; }
    .modal-close:hover { color: #ef4444; }
    .modal-body { padding: 24px; max-height: 60vh; overflow-y: auto; }
    .modal-footer { padding: 16px 24px; border-top: 1px solid #e2e8f0; display: flex; justify-content: flex-end; gap: 12px; background: #f8fafc; }
    .animate-in { animation: modalFadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
    @keyframes modalFadeIn { from { opacity: 0; transform: translateY(20px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
  `]
})
export class ReservaDetailComponent implements OnInit {
  reserva: ReservaResponse | null = null;
  error: string | null = null;
  modoEdicion = false;

  readonly estadosLabel: Record<string, string> = {
    RESERVADA: 'Reservada',
    HOSPEDADO: 'Hospedado',
    FINALIZADO: 'Finalizado',
    CANCELADA: 'Cancelada'
  };

  habitacionesDisponibles: any[] = [];
  nuevaHabitacionId = '';
  
  busquedaCliente = '';
  clientesResultados: ClienteResponse[] = [];

  modalActivo: 'extender' | 'cancelar' | null = null;
  modalGuardando = false;
  extendForm: ExtenderReservaRequest = { nuevaFechaSalida: '' };
  cancelForm: CancelarReservaRequest = { motivoCancelacion: '', observaciones: '' };
  cancelFormMotivoSeleccionado = '';
  cancelFormMotivoOtro = '';
  descargandoReporte = false;
  mostrarBtnExcel = false;

  private timeoutBusqueda: any;

  constructor(
    private route: ActivatedRoute,
    private service: ReservaService,
    private clienteService: ClienteService,
    private pagoService: PagoService,
    private excelService: ExcelReportService,
    private precioService: PrecioHistoricoService,
    private cdr: ChangeDetectorRef,
    public auth: AuthService
  ) { }

  preciosPorTipo: Record<string, number> = {};

  get estadoLabel(): string {
    if (!this.reserva) return '';
    return this.estadosLabel[this.reserva.estado] ?? this.reserva.estado;
  }

  getTitularNombre(): string {
    if (!this.reserva || !this.reserva.huespedes) return 'No asignado';
    const titular = this.reserva.huespedes.find(h => h.esTitular);
    return titular ? titular.clienteNombre : 'No asignado';
  }

  get puedeAgregarHuesped(): boolean {
    return this.reserva?.estado === 'RESERVADA' || this.reserva?.estado === 'HOSPEDADO';
  }

  get puedeEliminarHuesped(): boolean {
    return this.reserva?.estado === 'RESERVADA';
  }

  get capacidadMax(): number {
    return this.reserva?.detalles?.[0]?.capacidadMax ?? 0;
  }

  get isFinalizado(): boolean {
    const e = this.reserva?.estado?.toUpperCase() || '';
    return e === 'FINALIZADO' || e === 'FINALIZADA' || e === 'FINISHED';
  }

  get isReservada(): boolean {
    const e = this.reserva?.estado?.toUpperCase() || '';
    return e === 'RESERVADA' || e === 'PENDIENTE';
  }

  get isHospedado(): boolean {
    const e = this.reserva?.estado?.toUpperCase() || '';
    return e === 'HOSPEDADO' || e === 'OCUPADA';
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      const obs = id.startsWith('RES-') || id.startsWith('GRP-')
        ? this.service.getByCodigo(id)
        : this.service.getById(id);
      obs.subscribe({
        next: (data) => {
          this.reserva = data;
          this.cargarHabitacionesDisponibles();
          this.verificarFactura();
        },
        error: () => this.error = 'No se encontró la reserva solicitada'
      });
    }
  }

  private verificarFactura(): void {
    if (!this.isFinalizado) return;

    if (!this.reserva?.nombreGrupo) {
      this.mostrarBtnExcel = true;
      return;
    }

    this.service.getEstadiaPorReserva(this.reserva!.id).subscribe({
      next: (estadia) => {
        this.pagoService.getByEstadia(estadia.id).subscribe({
          next: (pago) => {
            if (pago.modoPago === 'CONSOLIDADO') {
              this.mostrarBtnExcel = false;
            } else {
              this.mostrarBtnExcel = true;
            }
          },
          error: () => this.mostrarBtnExcel = false
        });
      },
      error: () => this.mostrarBtnExcel = false
    });
  }

  private cargarHabitacionesDisponibles(): void {
    if (!this.reserva || this.reserva.estado !== 'RESERVADA') return;
    this.service.getHabitacionesDisponibles(this.reserva.fechaIngreso, this.reserva.fechaSalida).subscribe({
      next: (data) => {
        this.habitacionesDisponibles = data.filter(h => {
          const actualId = this.reserva!.detalles?.[0]?.habitacionId;
          return h.id !== actualId;
        }).map(h => ({
          ...h,
          precioMostrar: ''
        }));

        this.precioService.getAll().subscribe({
          next: (precios) => {
            precios.forEach(p => {
              if (!p.fechaFin || String(p.fechaFin).trim() === '' || String(p.fechaFin) === 'null') {
                this.preciosPorTipo[p.tipoHabitacionId] = p.precioNoche;
              }
            });
            this.cdr.detectChanges();
          }
        });
      }
    });
  }

  badgeClass(estado: string): string {
    return 'estado-' + estado.toLowerCase().replace(/ /g, '_');
  }

  volver(): void {
    window.history.back();
  }

  toggleEdicion(): void {
    if (this.modoEdicion) {
      this.huespedesStaged = [];
      this.huespedesAEliminar = [];
      this.nuevaHabitacionId = '';
    }
    this.modoEdicion = !this.modoEdicion;
  }

  huespedesStaged: ClienteResponse[] = [];
  huespedesAEliminar: string[] = [];
  guardandoEdicionGlobal = false;

  getHuespedesActivosCount(): number {
    if (!this.reserva) return 0;
    return this.reserva.huespedes.filter(h => !this.huespedesAEliminar.includes(h.id)).length + this.huespedesStaged.length;
  }

  marcarEliminarHuesped(id: string): void {
    this.huespedesAEliminar.push(id);
  }

  quitarStaged(id: string): void {
    this.huespedesStaged = this.huespedesStaged.filter(h => h.id !== id);
  }

  guardarCambiosEdicion(): void {
    if (!this.reserva) return;
    this.guardandoEdicionGlobal = true;
    const peticiones: Observable<any>[] = [];

    if (this.nuevaHabitacionId && this.reserva.detalles && this.reserva.detalles.length > 0) {
      peticiones.push(this.service.changeHabitacion(this.reserva.id, { nuevaHabitacionId: this.nuevaHabitacionId }).pipe(catchError(e => of(null))));
    }
    for (const h of this.huespedesStaged) {
      peticiones.push(this.service.addHuesped(this.reserva.id, { clienteId: h.id }).pipe(catchError(e => of(null))));
    }
    for (const id of this.huespedesAEliminar) {
      peticiones.push(this.service.removeHuesped(this.reserva.id, id).pipe(catchError(e => of(null))));
    }

    if (peticiones.length === 0) {
      this.guardandoEdicionGlobal = false;
      this.modoEdicion = false;
      return;
    }

    forkJoin(peticiones).subscribe(() => {
      this.service.getById(this.reserva!.id).subscribe(r => {
        this.reserva = r;
        this.guardandoEdicionGlobal = false;
        this.modoEdicion = false;
        this.huespedesStaged = [];
        this.huespedesAEliminar = [];
        this.nuevaHabitacionId = '';
        this.cargarHabitacionesDisponibles();
      });
    });
  }

  seleccionarCliente(cliente: ClienteResponse): void {
    if (!this.reserva) return;
    if (this.reserva.huespedes.some(h => h.clienteId === cliente.id) || this.huespedesStaged.some(h => h.id === cliente.id)) {
      alert('El cliente ya está en la reserva.');
      return;
    }
    this.huespedesStaged.push(cliente);
    this.busquedaCliente = '';
    this.clientesResultados = [];
  }

  buscarClientes(): void {
    if (this.timeoutBusqueda) clearTimeout(this.timeoutBusqueda);
    const termino = this.busquedaCliente.trim();
    if (termino.length < 2) {
      this.clientesResultados = [];
      return;
    }
    this.timeoutBusqueda = setTimeout(() => {
      this.clienteService.buscarResponsables(termino).subscribe({
        next: (data) => {
          this.clientesResultados = data.filter(c => {
            if (!this.reserva) return true;
            return !this.reserva!.huespedes?.some(h => h.clienteId === c.id) && !this.huespedesStaged.some(h => h.id === c.id);
          });
        }
      });
    }, 300);
  }

  abrirExtender(): void {
    this.modalActivo = 'extender';
    this.extendForm = { nuevaFechaSalida: '' };
  }

  getMinDateExtender(): Date {
    if (!this.reserva || !this.reserva.fechaSalida) {
      return new Date();
    }
    return new Date(this.reserva.fechaSalida);
  }

  formatDateStr(d: any): string {
    if (!d) return '';
    const date = new Date(d);
    const offset = date.getTimezoneOffset() * 60000;
    return (new Date(date.getTime() - offset)).toISOString().split('T')[0];
  }

  abrirCancelar(): void {
    this.modalActivo = 'cancelar';
    this.cancelForm = { motivoCancelacion: '', observaciones: '' };
    this.cancelFormMotivoSeleccionado = '';
    this.cancelFormMotivoOtro = '';
  }

  cerrarModal(): void {
    this.modalActivo = null;
    this.modalGuardando = false;
  }

  guardarModal(): void {
    if (!this.reserva) return;
    this.modalGuardando = true;

    if (this.modalActivo === 'extender') {
      const payload = { ...this.extendForm };
      const dateVal = payload.nuevaFechaSalida as any;
      if (dateVal instanceof Date || typeof dateVal === 'object') {
        payload.nuevaFechaSalida = this.formatDateStr(dateVal);
      }
      
      this.service.extender(this.reserva.id, payload).subscribe({
        next: (data) => {
          this.reserva = data;
          this.cerrarModal();
        },
        error: (err) => {
          this.modalGuardando = false;
          alert(err.error?.message || 'Error al extender la reserva');
        }
      });
    } else if (this.modalActivo === 'cancelar') {
      let motivo = this.cancelFormMotivoSeleccionado;
      if (motivo === 'Otro (especificar)') {
        motivo = this.cancelFormMotivoOtro.trim();
      }
      this.cancelForm.motivoCancelacion = motivo;

      this.service.cancelar(this.reserva.id, this.cancelForm).subscribe({
        next: (data) => {
          this.reserva = data;
          this.cerrarModal();
        },
        error: (err) => {
          this.modalGuardando = false;
          alert(err.error?.message || 'Error al cancelar la reserva');
        }
      });
    }
  }

  descargarReporte(): void {
    if (!this.reserva) return;
    this.descargandoReporte = true;

    // 1. Obtener estadía
    this.service.getEstadiaPorReserva(this.reserva.id).subscribe({
      next: (estadia: EstadiaResponse) => {
        // 2. Obtener pago
        this.pagoService.getByEstadia(estadia.id).subscribe({
          next: (pago: PagoResponse) => {
            // 3. Generar Excel con el formato de 18 columnas
            const itemsExcel = this.reserva!.detalles.map(d => ({
              descripcion: `Hospedaje - Hab. ${d.habitacionNumero}`,
              cantidad: estadia.noches || 1,
              precioUnitarioSinIgv: (pago.montoNeto / this.reserva!.detalles.length) / (estadia.noches || 1),
              montoNeto: pago.montoNeto / this.reserva!.detalles.length,
              igv: pago.igv / this.reserva!.detalles.length,
              total: pago.montoTotal / this.reserva!.detalles.length
            }));

            this.excelService.generarExcelContador(pago, itemsExcel).then(() => {
              this.descargandoReporte = false;
            }).catch(err => {
              console.error(err);
              alert('Error al generar el Excel');
              this.descargandoReporte = false;
            });
          },
          error: () => {
            alert('No se encontró información de pago para esta estadía');
            this.descargandoReporte = false;
          }
        });
      },
      error: () => {
        alert('No se encontró información de estadía para esta reserva');
        this.descargandoReporte = false;
      }
    });
  }

  // --- MÉTODOS PARA AGRUPAR HABITACIONES ---
  getTiposHabitacionDisponibles(): { id: string, nombre: string }[] {
    const map = new Map<string, string>();
    this.habitacionesDisponibles.forEach(h => map.set(h.tipoId, h.tipoNombre));
    return Array.from(map.entries())
      .map(([id, nombre]) => ({ id, nombre }))
      .sort((a, b) => a.nombre.localeCompare(b.nombre));
  }

  getHabitacionesPorTipo(tipoId: string) {
    return this.habitacionesDisponibles
      .filter(h => h.tipoId === tipoId)
      .sort((a, b) => a.numero.localeCompare(b.numero));
  }

  // --- LÓGICA DEL DROPDOWN PERSONALIZADO ---
  selectorAbierto = false;

  getHabitacionSeleccionadaTexto(): string {
    if (!this.nuevaHabitacionId) return '';
    const h = this.habitacionesDisponibles.find(x => x.id === this.nuevaHabitacionId);
    return h ? `Habitación ${h.numero} - ${h.tipoNombre} (Cap. ${h.capacidadMax})` : '';
  }

  seleccionarHabitacion(id: string) {
    this.nuevaHabitacionId = id;
    this.selectorAbierto = false;
  }
  // ------------------------------------------

  getPrecioPorTipo(tipoId: string): string {
    const precio = this.preciosPorTipo[tipoId];
    if (!precio) return '';
    const num = Number(precio);
    return isNaN(num) ? '' : num.toFixed(2);
  }
}
