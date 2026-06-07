import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { ReservaService } from '../../../core/services/reserva.service';
import { ClienteService } from '../../../core/services/cliente.service';
import { HabitacionService } from '../../../core/services/habitacion.service';
import { AuthService } from '../../../core/services/auth.service';
import { ClienteResponse } from '../../../core/models/cliente';
import { HabitacionResponse } from '../../../core/models/habitacion';
import { CanalVenta } from '../../../core/models/reserva';
import { clasificarEdad } from '../../../core/utils/edad';

interface HabitacionEnFormulario {
  habitacionId: string;
  numero: string;
  tipoNombre: string;
  capacidadMax: number;
  titular: ClienteResponse | null;
  acompanantes: ClienteResponse[];
}

@Component({
  selector: 'app-reserva-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MatInputModule, MatDatepickerModule,
    MatNativeDateModule,
    MatFormFieldModule
  ],
  providers: [
    { provide: MAT_DATE_LOCALE, useValue: 'en-GB' }
  ],
  template: `
    <div class="page-container fade-in">
      <!-- CABECERA DEL FORMULARIO CON DEGRADADO Y SOL DORADO -->
      <div class="header-section">
        <div class="title-area">
          <h2><i class="header-icon-premium bi bi-person-plus-fill"></i> Nueva Reserva Individual</h2>
          <p class="subtitle">Complete los datos del huésped titular, fechas y habitaciones para formalizar la reserva</p>
        </div>
        <a routerLink="/reservas" class="btn-secondary-header"><i class="bi bi-arrow-left-short mr-1"></i> Volver</a>
      </div>

      <!-- FORMULARIO PREMIUM -->
      <div class="card glass-panel">
        <div class="card-body">
          <form (ngSubmit)="onCreate()" class="form">
            <!-- SECCIÓN: CLIENTE -->
            <div class="form-section-group">
              <h3 class="section-title"><i class="bi bi-person-circle text-dorado-amazonico mr-2"></i> Datos del Huésped Titular</h3>
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Cliente Titular <span class="required">*</span></label>
                  
                  <!-- Si no hay titular seleccionado -->
                  <div *ngIf="!clienteSeleccionado" class="no-responsable-wrapper">
                    <button type="button" class="btn-assign-responsible" (click)="abrirModalCliente()">
                      <i class="bi bi-person-plus-fill" style="font-size: 1.3rem;"></i>
                      <span>Asignar Cliente Titular</span>
                    </button>
                  </div>

                  <!-- Si hay titular seleccionado (Tarjeta premium impecable) -->
                  <div *ngIf="clienteSeleccionado" class="responsible-active-card glass-panel animate-in">
                    <div class="responsible-info">
                      <h4>{{ clienteSeleccionado.nombres }} {{ clienteSeleccionado.apellidos }}</h4>
                      <div class="responsible-meta">
                        <span><i class="bi bi-card-heading text-dorado-amazonico mr-1"></i> {{ clienteSeleccionado.tipoDocumento || 'Doc' }}: {{ clienteSeleccionado.numeroDocumento }}</span>
                        <span><i class="bi bi-telephone text-dorado-amazonico mr-1"></i> Tel: {{ clienteSeleccionado.telefono || '---' }}</span>
                        <span><i class="bi bi-globe text-dorado-amazonico mr-1"></i> {{ clienteSeleccionado.nacionalidad }}</span>
                      </div>
                    </div>
                    <button type="button" class="btn-change-responsible" (click)="abrirModalCliente()">
                      <i class="bi bi-pencil-square mr-1"></i> Cambiar
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- SECCIÓN: CANAL DE VENTA -->
            <div class="form-section-group">
              <h3 class="section-title"><i class="bi bi-lightning-charge-fill text-dorado-amazonico mr-2"></i> Canal de Reserva</h3>
              <div class="form-group">
                <label class="form-label">¿A través de qué medio realiza la reserva? <span class="required">*</span></label>
                <div *ngIf="canalesVenta.length === 0" class="loading-canales">Cargando canales oficiales...</div>
                
                <div class="canales-grid" *ngIf="canalesVenta.length > 0">
                  <button
                    type="button"
                    *ngFor="let c of canalesVenta"
                    class="canal-card"
                    [class.selected]="form.canalVentaId === c.id"
                    (click)="seleccionarCanal(c)"
                  >
                    <span class="canal-icono"><i [class]="getCanalIconClass(c.nombre)"></i></span>
                    <span class="canal-nombre">{{ c.nombre }}</span>
                    <span *ngIf="form.canalVentaId === c.id" class="check-mark"><i class="bi bi-check-lg" style="font-size: 0.72rem;"></i></span>
                  </button>
                </div>

                <div *ngIf="form.canalVentaId && canalSeleccionadoEsOtro()" class="form-group" style="margin-top: 14px;">
                  <label class="form-label">Especifique el canal <span class="required">*</span></label>
                  <input type="text" [(ngModel)]="form.canalVentaOtro" name="canalVentaOtro" placeholder="Ej: WhatsApp personal, recomendación..." required class="form-control" />
                </div>
              </div>
            </div>

            <!-- SECCIÓN: FECHAS -->
            <div class="form-section-group">
              <h3 class="section-title"><i class="bi bi-calendar-range text-dorado-amazonico mr-2"></i> Período de Estadía</h3>
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Fecha de Ingreso <span class="required">*</span></label>
                  <mat-form-field appearance="outline" class="full-width" subscriptSizing="dynamic">
                    <input matInput [matDatepicker]="ingresoPicker"
                           [(ngModel)]="form.fechaIngreso"
                           name="fechaIngreso"
                           required
                           [min]="minDate" [max]="maxDate"
                           (dateChange)="onFechasChange()"
                           placeholder="Seleccione fecha">
                    <mat-datepicker-toggle matSuffix [for]="ingresoPicker"></mat-datepicker-toggle>
                    <mat-datepicker #ingresoPicker startView="month"></mat-datepicker>
                  </mat-form-field>
                </div>
                <div class="form-group">
                  <label class="form-label">Fecha de Salida <span class="required">*</span></label>
                  <mat-form-field appearance="outline" class="full-width" subscriptSizing="dynamic">
                    <input matInput [matDatepicker]="salidaPicker"
                           [(ngModel)]="form.fechaSalida"
                           name="fechaSalida"
                           required
                           [min]="minFechaSalida" [max]="maxDate"
                           (dateChange)="onFechasChange()"
                           placeholder="Seleccione fecha">
                    <mat-datepicker-toggle matSuffix [for]="salidaPicker"></mat-datepicker-toggle>
                    <mat-datepicker #salidaPicker startView="month"></mat-datepicker>
                  </mat-form-field>
                </div>
              </div>
            </div>

            <!-- SECCIÓN: SELECCIÓN DE HABITACIÓN -->
            <div class="form-section-group" *ngIf="form.fechaIngreso && form.fechaSalida && !fechasInvalidas">
              <h3 class="section-title"><i class="bi bi-key-fill text-dorado-amazonico mr-2"></i> Distribución de Habitaciones</h3>
              
              <!-- FILTROS -->
              <div style="margin-bottom: 20px; background: rgba(255, 255, 255, 0.5); padding: 16px; border-radius: 12px; border: 1px solid rgba(45, 90, 39, 0.1); display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                <div class="form-group" style="margin-bottom: 0;">
                  <label class="form-label"><i class="bi bi-search mr-1"></i> Buscar Habitación</label>
                  <input type="text" [(ngModel)]="filtroNumero" name="filtroNumero" placeholder="Buscar por número de habitación" class="form-control" />
                </div>
                <div class="form-group" style="margin-bottom: 0;">
                  <label class="form-label"><i class="bi bi-building mr-1"></i> Filtrar por Piso</label>
                  <select [(ngModel)]="filtroPiso" name="filtroPiso" class="form-control" style="cursor: pointer;">
                    <option [ngValue]="null">Todos los pisos</option>
                    <option *ngFor="let p of pisosUnicos" [ngValue]="p">Piso {{ p }}</option>
                  </select>
                </div>
                <div class="form-group" style="margin-bottom: 0;">
                  <label class="form-label"><i class="bi bi-door-open mr-1"></i> Filtrar por Tipo</label>
                  <select [(ngModel)]="filtroTipo" name="filtroTipo" class="form-control" style="cursor: pointer;">
                    <option value="">Todos los tipos</option>
                    <option *ngFor="let t of tiposUnicos" [value]="t">{{ t }}</option>
                  </select>
                </div>
              </div>

              <!-- DISPONIBLES -->
              <div class="form-group">
                <label class="form-label text-available">Habitaciones Disponibles <span class="required">*</span></label>
                <div *ngIf="habitacionesDisponiblesFiltradas.length === 0" class="empty-rooms-alert">
                  <i class="bi bi-exclamation-triangle-fill text-amber-500 mr-2"></i> No hay habitaciones libres que coincidan con los filtros y rango de fechas.
                </div>
                
                <div class="checkbox-grid" *ngIf="habitacionesDisponiblesFiltradas.length > 0">
                  <label class="checkbox-label" *ngFor="let h of habitacionesDisponiblesFiltradas">
                    <input type="checkbox" [value]="h.id" [checked]="form.habitacionesIds.includes(h.id)" (change)="toggleHabitacion(h.id, $any($event.target).checked)" />
                    <span class="room-card">
                      <span class="room-number">Hab. {{ h.numero }}</span>
                      <span class="room-type">{{ h.tipoNombre }}</span>
                      <span class="room-capacity">Capacidad Máx: {{ h.capacidadMax }} pers.</span>
                    </span>
                  </label>
                </div>
              </div>

              <!-- NO DISPONIBLES -->
              <div *ngIf="habitacionesNoDisponiblesFiltradas.length > 0 && allHabitaciones.length > 0" class="form-group" style="margin-top: 24px;">
                <label class="form-label text-available">Habitaciones No Disponibles (Ocupadas o Bloqueadas)</label>
                <div class="checkbox-grid">
                  <div class="checkbox-label no-disponible" *ngFor="let h of habitacionesNoDisponiblesFiltradas">
                    <span class="room-card">
                      <span class="room-number">Hab. {{ h.numero }}</span>
                      <span class="room-type">{{ h.tipoNombre }}</span>
                    </span>
                    <span class="motivo-badge">{{ h.motivo }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- DISTRIBUCIÓN DE HUÉSPEDES POR HABITACIÓN SELECCIONADA -->
            <div class="form-section-group animate-in" *ngIf="habitacionesSeleccionadas.length > 0">
              <h3 class="section-title"><i class="bi bi-person-badge-fill text-dorado-amazonico mr-2"></i> Distribución de Huéspedes</h3>
              
              <div *ngFor="let h of habitacionesSeleccionadas; let i = index" class="suite-card animate-in">
                <!-- CABECERA SUITE -->
                <div class="suite-header">
                  <div class="suite-title-area">
                    <span class="suite-icon"><i class="bi bi-door-open-fill text-dorado-amazonico mr-1"></i></span>
                    <div class="suite-details">
                      <h4>Habitación {{ h.numero }}</h4>
                      <small>{{ h.tipoNombre }} — Capacidad Máx: {{ h.capacidadMax }} personas</small>
                    </div>
                  </div>
                  <button type="button" class="btn-remove-suite" (click)="quitarHabitacion(i)" title="Quitar habitación">&times;</button>
                </div>

                <!-- CONTADORES DE EDAD -->
                <div class="suite-summary-badges">
                  <span class="age-badge badge-adulto-mayor"><i class="bi bi-person-heart mr-1"></i> {{ countCategoria(h, 'adulto_mayor') }} Adulto Mayor</span>
                  <span class="age-badge badge-adulto"><i class="bi bi-person-fill text-slate-500 mr-1"></i> {{ countCategoria(h, 'adulto') }} Adulto</span>
                  <span class="age-badge badge-adolescente"><i class="bi bi-person mr-1"></i> {{ countCategoria(h, 'adolescente') }} Adolescente</span>
                  <span class="age-badge badge-nino"><i class="bi bi-person-circle mr-1"></i> {{ countCategoria(h, 'nino') }} Niño</span>
                </div>

                <div class="suite-sections-grid">
                  <!-- COLUMNA: TITULAR -->
                  <div class="suite-column">
                    <div class="column-label">Titular de la Habitación <span class="required">*</span></div>
                    
                    <div *ngIf="h.titular" class="guest-card titular-active-card">
                      <div class="guest-info">
                        <strong><i class="bi bi-award-fill text-dorado-amazonico mr-1"></i> {{ h.titular.nombres }} {{ h.titular.apellidos }}</strong>
                        <span class="guest-detail">{{ h.titular.tipoDocumento || 'DNI' }}: {{ h.titular.numeroDocumento }}</span>
                      </div>
                    </div>
                    
                    <div *ngIf="!h.titular" class="text-muted-suite" style="font-size: 0.8rem; padding: 12px;">
                      Por favor, asigne el Cliente Titular en el cuadro superior de la reserva.
                    </div>
                  </div>

                  <!-- COLUMNA: ACOMPAÑANTES -->
                  <div class="suite-column">
                    <div class="column-label">
                      Acompañantes
                      <span class="plazas-libres" [class.plazas-llenas]="getPlazasLibres(h) <= 0">
                        ({{ getPlazasLibres(h) }} plaza{{ getPlazasLibres(h) !== 1 ? 's' : '' }} libre{{ getPlazasLibres(h) !== 1 ? 's' : '' }})
                      </span>
                    </div>
                    
                    <div *ngIf="h.acompanantes.length === 0" class="text-muted-suite">
                      Sin acompañantes registrados aún
                    </div>
                    
                    <div *ngFor="let a of h.acompanantes; let j = index" class="guest-card">
                      <div class="guest-info">
                        <strong>{{ a.nombres }} {{ a.apellidos }}</strong>
                        <span class="guest-detail">{{ a.tipoDocumento || 'DNI' }}: {{ a.numeroDocumento }}</span>
                      </div>
                      <button type="button" class="btn-remove-guest" (click)="quitarAcompanante(h, j)" title="Quitar acompañante">&times;</button>
                    </div>
                    
                    <button
                      type="button"
                      class="btn-add-guest"
                      [class.btn-disabled]="getPlazasLibres(h) <= 0"
                      [disabled]="getPlazasLibres(h) <= 0"
                      (click)="abrirModal(h, 'acompanante')">
                      <i class="bi bi-plus-lg"></i> Agregar Acompañante
                    </button>
                  </div>
                </div>

                <!-- BARRA DE OCUPACIÓN -->
                <div class="ocupacion-bar-container">
                  <span class="ocupacion-label">Ocupación total:</span>
                  <div class="ocupacion-bar">
                    <div
                      class="ocupacion-fill"
                      [style.width.%]="getOcupacionPorcentaje(h)"
                      [style.background]="getOcupacionColor(h)">
                    </div>
                  </div>
                  <span class="ocupacion-text">{{ getCapacidadAsignada(h) }} / {{ h.capacidadMax }} personas</span>
                  <span *ngIf="getPlazasLibres(h) <= 0" class="badge-completa">Capacidad Completa</span>
                </div>
              </div>
            </div>

            <div *ngIf="fechasInvalidas" class="global-field-error">
              <i class="bi bi-exclamation-triangle-fill text-amber-500 mr-2"></i> La fecha de salida debe ser posterior a la fecha de ingreso.
            </div>

            <div *ngIf="error" class="alert alert-error">{{ error }}</div>

            <!-- BOTONES DE ACCIÓN -->
            <div class="form-actions">
              <a routerLink="/reservas" class="btn-cancel">Cancelar</a>
              <button type="submit" class="btn-primary" [disabled]="!puedeEnviar()">
                Registrar Reserva
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- MODAL BOUTIQUE BÚSQUEDA DE CLIENTE TITULAR -->
    <div *ngIf="modalClienteAbierto" class="modal-overlay" (click)="cerrarModalCliente($event)">
      <div class="modal-content animate-in" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>Asignar Cliente Titular</h3>
          <button type="button" class="modal-close" (click)="cerrarModalCliente()">&times;</button>
        </div>
        
        <div class="modal-body">
          <div class="search-box-modal">
            <span class="search-icon-modal"><i class="bi bi-search text-slate-400"></i></span>
            <input
              type="text"
              [(ngModel)]="busquedaClienteTermino"
              [ngModelOptions]="{standalone: true}"
              (input)="filtrarClientes()"
              placeholder="Buscar por nombre, apellidos o DNI..."
              class="search-input"
              autofocus
            />
          </div>
          
          <div *ngIf="busquedaClienteTermino.trim() && clientesFiltradosModal.length === 0" class="text-muted search-empty">
            No se encontraron clientes registrados con "<strong>{{ busquedaClienteTermino }}</strong>"
          </div>
          
          <!-- RESULTADOS -->
          <div class="results-list">
            <div *ngFor="let c of clientesFiltradosModal" class="result-row">
              <div class="result-info">
                <strong>{{ c.nombres }} {{ c.apellidos }}</strong>
                <span class="result-detail">
                  <i class="bi bi-card-heading text-slate-400 mr-1"></i> {{ c.tipoDocumento || 'Doc' }}: {{ c.numeroDocumento }} | 
                  <i class="bi bi-telephone text-slate-400 mr-1"></i> Tel: {{ c.telefono || '---' }}
                </span>
              </div>
              <div class="result-actions">
                <button type="button" class="btn-action-modal btn-select-titular" (click)="elegirCliente(c)">
                  <i class="bi bi-check-lg mr-1"></i> Seleccionar
                </button>
              </div>
            </div>
          </div>
          
          <div class="modal-footer-link">
            <a routerLink="/clientes" target="_blank" class="crear-cliente-link" title="Se abrirá en una pestaña nueva para no perder los datos de la reserva">
              <i class="bi bi-person-plus-fill mr-1"></i> ¿El cliente no está registrado? Crear nuevo cliente
            </a>
          </div>
        </div>
      </div>
    </div>

    <!-- MODAL BOUTIQUE BÚSQUEDA DE HUÉSPED POR HABITACIÓN -->
    <div *ngIf="modalAbierto" class="modal-overlay" (click)="cerrarModal($event)">
      <div class="modal-content animate-in" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>Agregar Acompañante</h3>
          <button type="button" class="modal-close" (click)="cerrarModal()">&times;</button>
        </div>
        
        <div class="modal-body">
          <div class="search-box-modal">
            <span class="search-icon-modal"><i class="bi bi-search text-slate-400"></i></span>
            <input
              type="text"
              [(ngModel)]="busquedaTermino"
              [ngModelOptions]="{standalone: true}"
              (input)="filtrarHuespedes()"
              placeholder="Buscar por nombre, apellidos o DNI..."
              class="search-input"
              autofocus
            />
          </div>
          
          <div *ngIf="busquedaTermino.trim() && clientesFiltradosHuespedModal.length === 0" class="text-muted search-empty">
            No se encontraron clientes registrados con "<strong>{{ busquedaTermino }}</strong>"
          </div>
          
          <!-- RESULTADOS -->
          <div class="results-list">
            <div *ngFor="let c of clientesFiltradosHuespedModal" class="result-row">
              <div class="result-info">
                <strong>{{ c.nombres }} {{ c.apellidos }}</strong>
                <span class="result-detail">
                  <i class="bi bi-card-heading text-slate-400 mr-1"></i> {{ c.tipoDocumento || 'Doc' }}: {{ c.numeroDocumento }} | 
                  <i class="bi bi-telephone text-slate-400 mr-1"></i> Tel: {{ c.telefono || '---' }}
                </span>
              </div>
              <div class="result-actions">
                <span *ngIf="c.id === habitacionModal?.titular?.id" class="badge-completa" style="background: #64748b; padding: 6px 12px; font-size: 0.75rem; text-transform: none; border-radius: 8px;">
                  Titular de la Habitación
                </span>
                
                <button *ngIf="c.id !== habitacionModal?.titular?.id" type="button" class="btn-action-modal btn-select-acomp" (click)="agregarAcompanante(habitacionModal!, c)">
                  <i class="bi bi-person-fill mr-1"></i> Acompañante
                </button>
              </div>
            </div>
          </div>
          
          <div class="modal-footer-link">
            <a routerLink="/clientes" target="_blank" class="crear-cliente-link" title="Se abrirá en una pestaña nueva para no perder los datos de la reserva">
              <i class="bi bi-person-plus-fill mr-1"></i> ¿El cliente no está registrado? Crear nuevo cliente
            </a>
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
      max-width: 900px;
      margin: 0 auto;
      width: 100%;
    }

    /* HEADER */
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

    .btn-secondary-header {
      padding: 8px 16px;
      background: rgba(255, 255, 255, 0.1);
      color: #ffffff;
      border: 1px solid rgba(255, 255, 255, 0.25);
      border-radius: 10px;
      font-weight: 700;
      font-size: 0.82rem;
      text-decoration: none;
      transition: all 0.25s ease;
      cursor: pointer;
    }

    .btn-secondary-header:hover {
      background: rgba(255, 255, 255, 0.2);
      border-color: #ffffff;
    }

    /* CARD GLASS PANEL */
    .glass-panel {
      background: rgba(255, 255, 255, 0.9);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border: 1px solid rgba(45, 90, 39, 0.08);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.03);
    }

    .card {
      border-radius: 16px;
      overflow: hidden;
    }

    .card-body {
      padding: 32px;
    }

    /* FORM GROUPS & SECTIONS */
    .form-section-group {
      margin-bottom: 28px;
      padding-bottom: 20px;
      border-bottom: 1px solid rgba(45, 90, 39, 0.06);
    }

    .form-section-group:last-of-type {
      border-bottom: none;
      margin-bottom: 0;
      padding-bottom: 0;
    }

    .section-title {
      font-size: 1.05rem;
      font-weight: 800;
      color: #2D5A27; /* Verde Selva */
      margin: 0 0 16px 0;
      letter-spacing: -0.01em;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
    }

    @media (max-width: 768px) {
      .form-row {
        grid-template-columns: 1fr;
        gap: 14px;
      }
    }

    .form-group {
      margin-bottom: 16px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .form-label {
      font-size: 0.82rem;
      font-weight: 700;
      color: #2D5A27; /* Verde Selva */
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }

    .text-available {
      color: #4E8D46; /* Verde Tropical */
    }

    .text-unavailable {
      color: #8B5A2B; /* Marrón Madera */
    }

    .required {
      color: #dc2626;
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
      background: rgba(248, 250, 252, 0.7);
      box-sizing: border-box;
    }

    .form-control:focus {
      border-color: #2D5A27; /* Verde Selva */
      box-shadow: 0 0 0 3px rgba(45, 90, 39, 0.12);
      background: white;
    }

    /* CANALES GRID */
    .canales-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
      gap: 12px;
      margin-top: 6px;
    }

    .canal-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      padding: 18px 12px;
      border: 2px solid #e2e8f0;
      border-radius: 12px;
      background: white;
      cursor: pointer;
      transition: all 0.25s ease;
      font-family: inherit;
      position: relative;
    }

    .canal-card:hover {
      border-color: #4E8D46;
      background: rgba(78, 141, 70, 0.03);
      transform: translateY(-2px);
    }

    .canal-card.selected {
      border-color: #2D5A27; /* Verde Selva */
      background: rgba(45, 90, 39, 0.06);
      box-shadow: 0 4px 10px rgba(45, 90, 39, 0.08);
    }

    .canal-icono {
      font-size: 1.9rem;
      line-height: 1;
    }

    .canal-nombre {
      font-size: 0.8rem;
      font-weight: 700;
      color: #1A211B;
    }

    .check-mark {
      position: absolute;
      top: 6px;
      right: 8px;
      font-size: 0.65rem;
      color: white;
      font-weight: 800;
      background: #2D5A27;
      border-radius: 50%;
      width: 18px;
      height: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    /* CHECKBOX GRID FOR ROOMS */
    .checkbox-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 10px;
    }

    .checkbox-label {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      cursor: pointer;
      padding: 14px 16px;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      background: white;
      transition: all 0.25s ease;
    }

    .checkbox-label:hover {
      border-color: #4E8D46;
      background: rgba(78, 141, 70, 0.03);
    }

    .checkbox-label input {
      margin-top: 4px;
      accent-color: #2D5A27;
    }

    .checkbox-label:has(input:checked) {
      border-color: #2D5A27;
      background: rgba(45, 90, 39, 0.06);
      box-shadow: 0 0 0 1px #2D5A27;
    }

    .room-card {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .room-number {
      font-size: 0.95rem;
      font-weight: 800;
      color: #2D5A27; /* Verde Selva */
    }

    .room-type {
      font-size: 0.8rem;
      font-weight: 600;
      color: #475569;
    }

    .room-capacity {
      font-size: 0.72rem;
      color: #64748b;
      margin-top: 2px;
    }

    .checkbox-label.no-disponible {
      background: #f1f5f9;
      border-color: #e2e8f0;
      cursor: not-allowed;
      opacity: 0.75;
      pointer-events: none;
      justify-content: space-between;
      align-items: center;
    }

    .checkbox-label.no-disponible .room-number {
      color: #64748b;
    }

    .motivo-badge {
      font-size: 0.65rem;
      font-weight: 700;
      color: #8B5A2B; /* Marrón Madera */
      background: rgba(139, 90, 43, 0.1);
      padding: 3px 8px;
      border-radius: 8px;
      white-space: nowrap;
    }

    .empty-rooms-alert {
      padding: 16px;
      background: rgba(139, 90, 43, 0.08);
      color: #8B5A2B;
      border-radius: 10px;
      border-left: 4px solid #8B5A2B;
      font-size: 0.88rem;
      font-weight: 600;
    }

    /* ERROR ALERTS */
    .field-error {
      font-size: 0.75rem;
      color: #dc2626;
      font-weight: 600;
      margin-top: 2px;
    }

    .global-field-error {
      padding: 12px 16px;
      background: rgba(220, 38, 38, 0.08);
      color: #dc2626;
      border-radius: 10px;
      border-left: 4px solid #dc2626;
      font-size: 0.85rem;
      font-weight: 700;
      margin-top: 14px;
    }

    .alert {
      padding: 14px;
      border-radius: 10px;
      font-size: 0.85rem;
      margin: 16px 0 0 0;
      font-weight: 600;
    }

    .alert-error {
      background: rgba(220, 38, 38, 0.08);
      color: #dc2626;
      border: 1px solid rgba(220, 38, 38, 0.15);
    }

    /* FORM ACTIONS */
    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-top: 32px;
      padding-top: 20px;
      border-top: 1px solid rgba(45, 90, 39, 0.08);
    }

    .btn-cancel {
      padding: 11px 24px;
      background: white;
      border: 1px solid rgba(139, 90, 43, 0.35); /* Marrón Madera */
      border-radius: 10px;
      color: #8B5A2B;
      font-weight: 700;
      font-size: 0.9rem;
      cursor: pointer;
      text-decoration: none;
      transition: all 0.25s ease;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }

    .btn-cancel:hover {
      background: rgba(139, 90, 43, 0.06);
      border-color: #8B5A2B;
    }

    .btn-primary {
      padding: 11px 26px;
      background: linear-gradient(135deg, #2D5A27 0%, #1A211B 100%);
      color: white;
      border: 1px solid rgba(212, 168, 67, 0.2);
      border-radius: 10px;
      font-weight: 700;
      font-size: 0.9rem;
      cursor: pointer;
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 4px 10px rgba(45, 90, 39, 0.15);
    }

    .btn-primary:hover:not(:disabled) {
      background: linear-gradient(135deg, #4E8D46 0%, #2D5A27 100%);
      transform: translateY(-1px);
      box-shadow: 0 6px 14px rgba(78, 141, 70, 0.25);
    }

    .btn-primary:disabled {
      background: #cbd5e1;
      color: #94a3b8;
      cursor: not-allowed;
      border-color: #cbd5e1;
      box-shadow: none;
    }

    .loading-canales {
      font-size: 0.85rem;
      color: #64748b;
      font-style: italic;
    }

    /* REDISEÑO RESPONSABLE DE PAGO / CLIENTE TITULAR */
    .btn-assign-responsible {
      width: 100%;
      min-height: 86px;
      padding: 16px 20px;
      background: white;
      color: #2D5A27;
      border: 2px dashed rgba(45, 90, 39, 0.25);
      border-radius: 12px;
      cursor: pointer;
      font-size: 0.95rem;
      font-weight: 700;
      text-align: center;
      transition: all 0.25s ease;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 6px;
    }

    .btn-assign-responsible:hover {
      background: rgba(45, 90, 39, 0.04);
      border-color: #2D5A27;
      transform: translateY(-1px);
    }

    .responsible-active-card {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 20px;
      border-radius: 14px;
      background: rgba(255, 255, 255, 0.8);
      border: 1px solid rgba(45, 90, 39, 0.1);
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.02);
      min-height: 86px;
      box-sizing: border-box;
    }

    .responsible-info {
      display: flex;
      flex-direction: column;
      gap: 4px;
      text-align: left;
    }

    .responsible-info h4 {
      margin: 0;
      font-size: 1.15rem;
      font-weight: 800;
      color: #1a211b;
    }

    .responsible-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      font-size: 0.8rem;
      color: #64748b;
      margin-top: 2px;
    }

    .btn-change-responsible {
      padding: 8px 16px;
      background: white;
      color: #D4A843;
      border: 1px solid rgba(212, 168, 67, 0.35);
      border-radius: 10px;
      font-weight: 700;
      font-size: 0.82rem;
      cursor: pointer;
      transition: all 0.25s ease;
      display: inline-flex;
      align-items: center;
    }

    .btn-change-responsible:hover {
      background: #D4A843;
      color: white;
      border-color: #D4A843;
      box-shadow: 0 4px 10px rgba(212, 168, 67, 0.15);
    }

    /* MODALES Y BÚSQUEDA BOUTIQUE */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(26, 33, 27, 0.45); /* Tint oscuro y verde */
      backdrop-filter: blur(8px);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1100;
      animation: fadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .modal-content {
      background: rgba(255, 255, 255, 0.95);
      border: 1px solid rgba(255, 255, 255, 0.7);
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.15);
      border-radius: 20px;
      width: 550px;
      max-width: 90%;
      max-height: 85vh;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      position: relative;
    }

    .modal-header {
      padding: 20px 24px;
      border-bottom: 1px solid rgba(45, 90, 39, 0.08);
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: linear-gradient(135deg, rgba(45, 90, 39, 0.03) 0%, rgba(26, 33, 27, 0.01) 100%);
    }

    .modal-header h3 {
      margin: 0;
      color: #2D5A27;
      font-size: 1.2rem;
      font-weight: 800;
      letter-spacing: -0.01em;
    }

    .modal-close {
      background: none;
      border: none;
      font-size: 1.5rem;
      cursor: pointer;
      color: #94a3b8;
      transition: color 0.2s ease;
      line-height: 1;
    }

    .modal-close:hover {
      color: #dc2626;
    }

    .modal-body {
      padding: 24px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .search-box-modal {
      position: relative;
      width: 100%;
    }

    .search-icon-modal {
      position: absolute;
      left: 16px;
      top: 50%;
      transform: translateY(-50%);
      font-size: 0.95rem;
    }

    .search-input {
      width: 100%;
      padding: 12px 16px 12px 42px;
      border-radius: 12px;
      border: 1px solid rgba(45, 90, 39, 0.15);
      background: white;
      color: #1a211b;
      font-size: 0.92rem;
      font-weight: 600;
      outline: none;
      transition: all 0.2s ease;
      box-sizing: border-box;
    }

    .search-input:focus {
      border-color: #2D5A27;
      box-shadow: 0 0 0 3px rgba(45, 90, 39, 0.1);
    }

    .search-empty {
      text-align: center;
      padding: 20px 0;
      font-size: 0.88rem;
    }

    .results-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
      max-height: 280px;
      overflow-y: auto;
      padding-right: 4px;
    }

    .result-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 16px;
      border-radius: 12px;
      background: rgba(248, 250, 252, 0.8);
      border: 1px solid rgba(226, 232, 240, 0.8);
      transition: all 0.2s ease;
    }

    .result-row:hover {
      border-color: rgba(45, 90, 39, 0.2);
      background: white;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.02);
    }

    .result-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
      text-align: left;
    }

    .result-info strong {
      font-size: 0.95rem;
      color: #1a211b;
      font-weight: 700;
    }

    .result-detail {
      font-size: 0.78rem;
      color: #64748b;
    }

    .btn-action-modal {
      padding: 8px 16px;
      border-radius: 8px;
      font-size: 0.8rem;
      font-weight: 700;
      cursor: pointer;
      border: none;
      transition: all 0.2s ease;
    }

    .btn-select-titular {
      background: #2D5A27;
      color: white;
      box-shadow: 0 3px 8px rgba(45, 90, 39, 0.15);
    }

    .btn-select-titular:hover {
      background: #4E8D46;
    }

    .modal-footer-link {
      padding-top: 14px;
      border-top: 1px solid #e2e8f0;
      text-align: center;
    }

    .crear-cliente-link {
      color: #2D5A27;
      font-size: 0.85rem;
      font-weight: 700;
      text-decoration: none;
      transition: color 0.2s ease;
    }

    .crear-cliente-link:hover {
      color: #4E8D46;
      text-decoration: underline;
    }

    /* SUITE CARD (SUITE SELECCIONADA Y DISTRIBUIDA) */
    .suite-card {
      background: rgba(248, 250, 252, 0.6);
      border: 1px solid rgba(45, 90, 39, 0.12);
      border-left: 5px solid #2D5A27; /* Detalle de marca */
      border-radius: 16px;
      padding: 24px;
      margin-bottom: 20px;
      text-align: left;
    }

    .suite-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 14px;
      border-bottom: 1px solid rgba(45, 90, 39, 0.08);
      padding-bottom: 12px;
    }

    .suite-title-area {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .suite-icon {
      font-size: 1.8rem;
    }

    .suite-details h4 {
      margin: 0;
      font-size: 1.1rem;
      font-weight: 800;
      color: #2D5A27;
    }

    .suite-details small {
      font-size: 0.8rem;
      color: #475569;
      font-weight: 500;
    }

    .btn-remove-suite {
      background: rgba(220, 38, 38, 0.08);
      color: #dc2626;
      border: none;
      font-size: 1.5rem;
      font-weight: 300;
      cursor: pointer;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      line-height: 1;
      transition: all 0.2s ease;
    }

    .btn-remove-suite:hover {
      background: #dc2626;
      color: white;
    }

    .suite-summary-badges {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-bottom: 20px;
    }

    .age-badge {
      font-size: 0.74rem;
      font-weight: 700;
      padding: 4px 12px;
      border-radius: 20px;
      border: 1px solid transparent;
    }

    .badge-adulto-mayor {
      background: rgba(45, 90, 39, 0.08);
      color: #2D5A27;
      border-color: rgba(45, 90, 39, 0.15);
    }

    .badge-adulto {
      background: rgba(78, 141, 70, 0.08);
      color: #4E8D46;
      border-color: rgba(78, 141, 70, 0.15);
    }

    .badge-adolescente {
      background: rgba(212, 168, 67, 0.08);
      color: #D4A843;
      border-color: rgba(212, 168, 67, 0.15);
    }

    .badge-nino {
      background: rgba(139, 90, 43, 0.08);
      color: #8B5A2B;
      border-color: rgba(139, 90, 43, 0.15);
    }

    .suite-sections-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
    }

    @media (max-width: 768px) {
      .suite-sections-grid {
        grid-template-columns: 1fr;
        gap: 16px;
      }
    }

    .suite-column {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .column-label {
      font-size: 0.8rem;
      font-weight: 700;
      color: #2D5A27;
      text-transform: uppercase;
      letter-spacing: 0.02em;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .plazas-libres {
      font-weight: 700;
      color: #4E8D46;
      text-transform: none;
    }

    .plazas-llenas {
      color: #dc2626;
    }

    .text-muted-suite {
      color: #94a3b8;
      font-size: 0.82rem;
      font-style: italic;
      padding: 12px;
      border: 1px dashed #cbd5e1;
      border-radius: 10px;
      background: white;
      text-align: center;
    }

    .guest-card {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 10px 14px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.02);
    }

    .titular-active-card {
      border-color: #D4A843; /* Dorado Amazónico */
      background: rgba(212, 168, 67, 0.03);
    }

    .guest-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
      text-align: left;
    }

    .guest-info strong {
      font-size: 0.88rem;
      color: #1A211B;
    }

    .guest-detail {
      font-size: 0.78rem;
      color: #64748b;
    }

    .btn-sm-action {
      padding: 5px 12px;
      border: 1px solid transparent;
      border-radius: 6px;
      cursor: pointer;
      font-size: 0.72rem;
      font-weight: 700;
      transition: all 0.2s ease;
    }

    .btn-change {
      background: rgba(212, 168, 67, 0.1);
      color: #D4A843;
      border-color: rgba(212, 168, 67, 0.25);
    }

    .btn-change:hover {
      background: #D4A843;
      color: white;
    }

    .btn-add-guest {
      width: 100%;
      padding: 10px;
      background: white;
      color: #2D5A27;
      border: 1px dashed rgba(45, 90, 39, 0.35);
      border-radius: 10px;
      cursor: pointer;
      font-size: 0.82rem;
      font-weight: 700;
      text-align: center;
      transition: all 0.2s ease;
    }

    .btn-add-guest:hover:not(.btn-disabled) {
      background: rgba(45, 90, 39, 0.05);
      border-color: #2D5A27;
    }

    .btn-disabled {
      opacity: 0.5;
      cursor: not-allowed;
      border-style: solid;
      background: #f1f5f9;
      color: #94a3b8;
    }

    .btn-remove-guest {
      background: none;
      border: none;
      color: #cbd5e1;
      font-size: 1.2rem;
      cursor: pointer;
      line-height: 1;
      padding: 4px;
      border-radius: 4px;
      transition: all 0.2s ease;
    }

    .btn-remove-guest:hover {
      color: #dc2626;
      background: rgba(220, 38, 38, 0.08);
    }

    /* SUITE OCUPACIÓN BAR */
    .ocupacion-bar-container {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-top: 20px;
      padding-top: 14px;
      border-top: 1px solid rgba(45, 90, 39, 0.08);
    }

    .ocupacion-label {
      font-size: 0.78rem;
      color: #64748b;
      font-weight: 600;
      white-space: nowrap;
    }

    .ocupacion-bar {
      flex: 1;
      height: 8px;
      background: #e2e8f0;
      border-radius: 4px;
      overflow: hidden;
    }

    .ocupacion-fill {
      height: 100%;
      border-radius: 4px;
      transition: width 0.3s ease;
    }

    .ocupacion-text {
      font-size: 0.78rem;
      color: #475569;
      font-weight: 700;
      white-space: nowrap;
    }

    .badge-completa {
      font-size: 0.65rem;
      font-weight: 800;
      color: white;
      background: #dc2626;
      padding: 3px 8px;
      border-radius: 8px;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }

    .btn-select-acomp {
      background: #D4A843;
      color: white;
      box-shadow: 0 3px 8px rgba(212, 168, 67, 0.15);
    }

    .btn-select-acomp:hover {
      background: #e5b954;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
  `]
})
export class ReservaFormComponent implements OnInit {
  clientes: ClienteResponse[] = [];
  clientesMap = new Map<string, ClienteResponse>();

  clienteSeleccionado: ClienteResponse | null = null;
  modalClienteAbierto = false;
  busquedaClienteTermino = '';
  clientesFiltradosModal: ClienteResponse[] = [];

  habitacionesSeleccionadas: HabitacionEnFormulario[] = [];
  modalAbierto = false;
  habitacionModal: HabitacionEnFormulario | null = null;
  accionModal: 'titular' | 'acompanante' | null = null;
  busquedaTermino = '';
  clientesFiltradosHuespedModal: ClienteResponse[] = [];

  habitacionesDisponibles: HabitacionResponse[] = [];
  allHabitaciones: HabitacionResponse[] = [];
  habitacionesNoDisponibles: (HabitacionResponse & { motivo: string })[] = [];
  canalesVenta: CanalVenta[] = [];
  error = '';

  filtroPiso: number | null = null;
  filtroTipo: string = '';
  filtroNumero: string = '';

  get pisosUnicos(): number[] {
    return [...new Set(this.allHabitaciones.map(h => h.piso))].sort((a, b) => a - b);
  }

  get tiposUnicos(): string[] {
    return [...new Set(this.allHabitaciones.map(h => h.tipoNombre))].sort();
  }

  get habitacionesDisponiblesFiltradas(): HabitacionResponse[] {
    return this.habitacionesDisponibles.filter(h => {
      const matchPiso = this.filtroPiso === null || h.piso === this.filtroPiso;
      const matchTipo = this.filtroTipo === '' || h.tipoNombre === this.filtroTipo;
      const matchNumero = this.filtroNumero === '' || h.numero.toLowerCase().includes(this.filtroNumero.toLowerCase());
      return matchPiso && matchTipo && matchNumero;
    });
  }

  get habitacionesNoDisponiblesFiltradas(): any[] {
    return this.habitacionesNoDisponibles.filter(h => {
      const matchPiso = this.filtroPiso === null || h.piso === this.filtroPiso;
      const matchTipo = this.filtroTipo === '' || h.tipoNombre === this.filtroTipo;
      const matchNumero = this.filtroNumero === '' || h.numero.toLowerCase().includes(this.filtroNumero.toLowerCase());
      return matchPiso && matchTipo && matchNumero;
    });
  }

  hoy = new Date();
  minDate: Date;
  maxDate: Date;

  get minFechaSalida(): Date {
    if (!this.form.fechaIngreso) return this.minDate;
    const d = new Date(this.form.fechaIngreso);
    d.setDate(d.getDate() + 1);
    return d;
  }

  get fechaInvalida(): boolean {
    if (!this.form.fechaIngreso) return false;
    const ingreso = new Date(this.form.fechaIngreso);
    ingreso.setHours(0, 0, 0, 0);
    return ingreso < this.minDate;
  }

  get fechasInvalidas(): boolean {
    if (!this.form.fechaIngreso || !this.form.fechaSalida) return false;
    const ingreso = new Date(this.form.fechaIngreso);
    ingreso.setHours(0, 0, 0, 0);
    const salida = new Date(this.form.fechaSalida);
    salida.setHours(0, 0, 0, 0);
    return salida <= ingreso;
  }

  form: any = {
    fechaIngreso: null, fechaSalida: null, clienteId: '', creadoPor: '',
    adultos: 0, ninos: 0,
    canalVentaId: null, canalVentaOtro: '', habitacionesIds: []
  };

  constructor(
    private service: ReservaService,
    private clienteService: ClienteService,
    private habitacionService: HabitacionService,
    private auth: AuthService,
    private router: Router
  ) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    this.minDate = new Date(d);
    d.setDate(d.getDate() + 30);
    this.maxDate = new Date(d);
    this.form.fechaIngreso = null;
    this.form.fechaSalida = null;
  }

  ngOnInit(): void {
    this.clienteService.getAll().subscribe({
      next: (data) => {
        this.clientes = data;
        this.clientesMap = new Map(data.map(c => [c.id, c]));
      }
    });
    this.habitacionService.getAll().subscribe({
      next: (data) => {
        this.allHabitaciones = data;
        this.clasificarHabitaciones();
      }
    });
    this.service.getCanalesVenta().subscribe({ next: (data) => this.canalesVenta = data });
  }

  canalSeleccionadoEsOtro(): boolean {
    const canal = this.canalesVenta.find(c => c.id === this.form.canalVentaId);
    return canal?.nombre === 'Otro';
  }

  seleccionarCanal(c: CanalVenta): void {
    this.form.canalVentaId = c.id;
    if (c.nombre !== 'Otro') {
      this.form.canalVentaOtro = '';
    }
  }

  onClienteChange(): void {
    const cliente = this.clientesMap.get(this.form.clienteId);
    this.form.adultos = 0;
    this.form.ninos = 0;
    if (cliente) {
      const cat = clasificarEdad(cliente.fechaNacimiento);
      if (cat === 'adulto' || cat === 'adolescente' || cat === 'adulto_mayor') this.form.adultos = 1;
      else if (cat === 'nino') this.form.ninos = 1;
    }
  }

  onFechasChange(): void {
    if (this.form.fechaIngreso && this.form.fechaSalida) {
      const ingresoStr = this.formatDate(this.form.fechaIngreso);
      const salidaStr = this.formatDate(this.form.fechaSalida);
      this.habitacionService.getDisponibles(ingresoStr, salidaStr)
        .subscribe({
          next: (data) => {
            // El backend puede devolver habitaciones 'Por limpiar' que están libres en las fechas,
            // pero el usuario solicita que solo se muestren las 'Disponible'.
            this.habitacionesDisponibles = data.filter(h => h.estadoActual === 'Disponible');
            this.clasificarNoDisponibles();
          }
        });
    } else {
      this.clasificarHabitaciones();
    }
  }

  private clasificarHabitaciones(): void {
    const disponiblesEstados = new Set(['Disponible']);
    this.habitacionesDisponibles = this.allHabitaciones.filter(h => disponiblesEstados.has(h.estadoActual));
    this.clasificarNoDisponibles();
  }

  private clasificarNoDisponibles(): void {
    const disponiblesIds = new Set(this.habitacionesDisponibles.map(h => h.id));
    this.habitacionesNoDisponibles = this.allHabitaciones
      .filter(h => !disponiblesIds.has(h.id))
      .map(h => ({ ...h, motivo: this.obtenerMotivoNoDisponible(h) }));
  }

  private obtenerMotivoNoDisponible(h: HabitacionResponse): string {
    switch (h.estadoActual) {
      case 'Mantenimiento': return 'En mantenimiento';
      case 'Ocupada': return 'Ocupada';
      case 'En limpieza': return 'En limpieza';
      case 'Por limpiar': return 'Por limpiar';
      case 'Remodelación': return 'En remodelación';
      case 'Inhabitable': return 'Inhabitable';
      default: return 'Reservada en esas fechas';
    }
  }

  toggleHabitacion(id: string, checked: boolean): void {
    if (checked) {
      this.form.habitacionesIds = [id];

      const h = this.allHabitaciones.find(x => x.id === id);
      if (h) {
        this.habitacionesSeleccionadas = [{
          habitacionId: h.id,
          numero: h.numero,
          tipoNombre: h.tipoNombre,
          capacidadMax: h.capacidadMax,
          titular: this.clienteSeleccionado,
          acompanantes: []
        }];
      }
    } else {
      this.form.habitacionesIds = [];
      this.habitacionesSeleccionadas = [];
    }

    this.recalcularAdultosYNinos();
  }

  puedeEnviar(): boolean {
    if (!this.form.clienteId || !this.form.fechaIngreso || !this.form.fechaSalida || !this.form.canalVentaId || this.form.habitacionesIds.length === 0) return false;
    if (this.canalSeleccionadoEsOtro() && !this.form.canalVentaOtro?.trim()) return false;
    if (this.fechaInvalida || this.fechasInvalidas) return false;

    // Cada habitación seleccionada debe tener al menos un titular asignado
    for (const h of this.habitacionesSeleccionadas) {
      if (!h.titular) return false;
    }

    return true;
  }

  onCreate(): void {
    const user = this.auth.getUsuario();
    if (!user?.id) { this.error = 'Usuario no autenticado'; return; }
    this.form.creadoPor = user.id;

    // Recopilamos todos los huéspedes únicos (titulares y acompañantes de cada habitación seleccionada)
    const huespedesIdsSet = new Set<string>();
    for (const h of this.habitacionesSeleccionadas) {
      if (h.titular) huespedesIdsSet.add(h.titular.id);
      for (const a of h.acompanantes) {
        huespedesIdsSet.add(a.id);
      }
    }

    const payload = {
      ...this.form,
      fechaIngreso: this.formatDate(this.form.fechaIngreso),
      fechaSalida: this.formatDate(this.form.fechaSalida),
      huespedesIds: Array.from(huespedesIdsSet)
    };

    this.service.create(payload).subscribe({
      next: () => this.router.navigate(['/reservas']),
      error: (err) => this.error = err.error?.message || 'Error al crear reserva'
    });
  }

  private formatDate(d: any): string {
    if (!d) return '';
    if (typeof d === 'string') return d;
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  getCanalIconClass(nombre: string): string {
    if (!nombre) return 'bi bi-globe text-indigo-500';
    const n = nombre.toLowerCase();
    if (n.includes('facebook')) return 'bi bi-facebook text-indigo-600';
    if (n.includes('teléfono') || n.includes('telefono')) return 'bi bi-telephone-fill text-emerald-600';
    if (n.includes('whatsapp')) return 'bi bi-whatsapp text-emerald-500';
    if (n.includes('boca a boca') || n.includes('boca')) return 'bi bi-chat-quote-fill text-slate-500';
    if (n.includes('otro')) return 'bi bi-pin-angle-fill text-rose-500';
    return 'bi bi-globe text-indigo-500';
  }

  abrirModalCliente(): void {
    this.busquedaClienteTermino = '';
    this.clientesFiltradosModal = [];
    this.modalClienteAbierto = true;
  }

  cerrarModalCliente(event?: MouseEvent): void {
    this.modalClienteAbierto = false;
    this.busquedaClienteTermino = '';
    this.clientesFiltradosModal = [];
  }

  filtrarClientes(): void {
    const term = this.busquedaClienteTermino.toLowerCase().trim();
    if (!term) {
      this.clientesFiltradosModal = [];
      return;
    }
    this.clienteService.buscarResponsables(term).subscribe({
      next: (data) => this.clientesFiltradosModal = data
    });
  }

  elegirCliente(c: ClienteResponse): void {
    this.clienteSeleccionado = c;
    this.form.clienteId = c.id;
    this.onClienteChange();

    // Si tenemos habitaciones seleccionadas y la primera no tiene titular, le asignamos este
    if (this.habitacionesSeleccionadas.length > 0 && !this.habitacionesSeleccionadas[0].titular) {
      this.habitacionesSeleccionadas[0].titular = c;
    }

    this.recalcularAdultosYNinos();
    this.cerrarModalCliente();
  }

  abrirModal(h: HabitacionEnFormulario, accion: 'titular' | 'acompanante'): void {
    this.habitacionModal = h;
    this.accionModal = accion;
    this.busquedaTermino = '';
    this.clientesFiltradosHuespedModal = [];
    this.modalAbierto = true;
  }

  cerrarModal(event?: MouseEvent): void {
    this.modalAbierto = false;
    this.busquedaTermino = '';
    this.clientesFiltradosHuespedModal = [];
    this.habitacionModal = null;
    this.accionModal = null;
  }

  filtrarHuespedes(): void {
    const term = this.busquedaTermino.toLowerCase().trim();
    if (!term) {
      this.clientesFiltradosHuespedModal = [];
      return;
    }
    this.clienteService.buscarResponsables(term).subscribe({
      next: (data) => this.clientesFiltradosHuespedModal = data
    });
  }

  elegirTitular(h: HabitacionEnFormulario, c: ClienteResponse): void {
    h.titular = c;
    h.acompanantes = h.acompanantes.filter(a => a.id !== c.id);
    this.recalcularAdultosYNinos();
    this.cerrarModal();
  }

  agregarAcompanante(h: HabitacionEnFormulario, c: ClienteResponse): void {
    if (c.id === h.titular?.id) {
      alert(`El titular de la habitación (${c.nombres} ${c.apellidos}) no puede ser agregado como acompañante.`);
      return;
    }
    if (h.acompanantes.some(a => a.id === c.id)) {
      alert(`${c.nombres} ${c.apellidos} ya está agregado como acompañante`);
      return;
    }
    if (h.acompanantes.length >= h.capacidadMax - 1) {
      alert(`No se puede agregar más acompañantes. La habitación ${h.numero} (${h.tipoNombre}) ya está completa (${this.getCapacidadAsignada(h)}/${h.capacidadMax} ocupantes).`);
      return;
    }
    h.acompanantes.push(c);
    this.recalcularAdultosYNinos();
    this.cerrarModal();
  }

  cambiarTitularConConfirm(h: HabitacionEnFormulario): void {
    if (!h.titular) return;
    this.abrirModal(h, 'titular');
  }

  quitarAcompanante(h: HabitacionEnFormulario, idx: number): void {
    h.acompanantes.splice(idx, 1);
    this.recalcularAdultosYNinos();
  }

  quitarHabitacion(idx: number): void {
    const h = this.habitacionesSeleccionadas[idx];
    this.form.habitacionesIds = this.form.habitacionesIds.filter((id: string) => id !== h.habitacionId);
    this.habitacionesSeleccionadas.splice(idx, 1);
    this.recalcularAdultosYNinos();
  }

  countCategoria(h: HabitacionEnFormulario, categoria: string): number {
    const allGuests = [...(h.titular ? [h.titular] : []), ...h.acompanantes];
    return allGuests.filter(g => clasificarEdad(g.fechaNacimiento) === categoria).length;
  }

  getCapacidadAsignada(h: HabitacionEnFormulario): number {
    return (h.titular ? 1 : 0) + h.acompanantes.length;
  }

  getPlazasLibres(h: HabitacionEnFormulario): number {
    return Math.max(0, h.capacidadMax - this.getCapacidadAsignada(h));
  }

  getOcupacionPorcentaje(h: HabitacionEnFormulario): number {
    if (!h.capacidadMax) return 0;
    return Math.round((this.getCapacidadAsignada(h) / h.capacidadMax) * 100);
  }

  getOcupacionColor(h: HabitacionEnFormulario): string {
    const pct = this.getOcupacionPorcentaje(h);
    if (pct >= 100) return '#dc2626'; // Rojo corporativo/alerta
    if (pct >= 75) return '#8B5A2B'; // Marrón madera
    return '#2D5A27'; // Verde Selva
  }

  recalcularAdultosYNinos(): void {
    let adultosCount = 0;
    let ninosCount = 0;

    for (const h of this.habitacionesSeleccionadas) {
      const allGuests = [...(h.titular ? [h.titular] : []), ...h.acompanantes];
      for (const g of allGuests) {
        const cat = clasificarEdad(g.fechaNacimiento);
        if (cat === 'adulto' || cat === 'adolescente' || cat === 'adulto_mayor') {
          adultosCount++;
        } else if (cat === 'nino') {
          ninosCount++;
        }
      }
    }

    if (adultosCount === 0 && ninosCount === 0 && this.clienteSeleccionado) {
      const cat = clasificarEdad(this.clienteSeleccionado.fechaNacimiento);
      if (cat === 'adulto' || cat === 'adolescente' || cat === 'adulto_mayor') {
        adultosCount = 1;
      } else if (cat === 'nino') {
        ninosCount = 1;
      }
    }

    this.form.adultos = adultosCount;
    this.form.ninos = ninosCount;
  }
}
