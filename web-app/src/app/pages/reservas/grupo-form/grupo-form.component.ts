import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { FormControl } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Observable, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, catchError } from 'rxjs/operators';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { ReservaService } from '../../../core/services/reserva.service';
import { ClienteService } from '../../../core/services/cliente.service';
import { HabitacionService } from '../../../core/services/habitacion.service';
import { AuthService } from '../../../core/services/auth.service';
import { ClienteResponse } from '../../../core/models/cliente';
import { HabitacionResponse } from '../../../core/models/habitacion';
import { HuespedRequest, ReservaEnGrupoRequest, GrupoRequest, CanalVenta } from '../../../core/models/reserva';
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
  selector: 'app-grupo-form',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink,
    MatInputModule, MatAutocompleteModule, MatDatepickerModule, MatNativeDateModule, MatFormFieldModule],
  providers: [
    { provide: MAT_DATE_LOCALE, useValue: 'en-GB' }
  ],
  template: `
    <div class="page-container fade-in">
      <!-- CABECERA DE LA PÁGINA (ESTILO BANNER PREMIUM) -->
      <div class="header-section">
        <div class="title-area">
          <h2><i class="header-icon-premium bi bi-people-fill"></i> Nueva Reserva Grupal</h2>
          <p class="subtitle">Agrupe múltiples habitaciones, asigne huéspedes titulares y acompañantes bajo una sola cuenta de cargo</p>
        </div>
        <a routerLink="/reservas" class="btn-secondary-header"><i class="bi bi-arrow-left-short mr-1"></i> Volver</a>
      </div>

      <!-- FORMULARIO DE GRUPO -->
      <div class="card glass-panel">
        <div class="card-body">
          <form [formGroup]="grupoForm" (ngSubmit)="onCreate()" class="form">
            
            <!-- SECCIÓN: DATOS GENERALES DEL GRUPO -->
            <div class="form-section-group">
              <h3 class="section-title"><i class="bi bi-people-fill text-dorado-amazonico mr-2"></i> Información General del Grupo</h3>
              
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Nombre del Grupo <span class="required">*</span></label>
                  <div class="input-premium-wrapper">
                    <input type="text" formControlName="nombreGrupo" placeholder="Ej: Familia Pérez, Delegación Deportiva, Tour Selva..." class="form-control-premium" />
                  </div>
                </div>
                
                <div class="form-group">
                  <label class="form-label required">Responsable de Pago <span class="required">*</span></label>
                  
                  <!-- Si no hay responsable seleccionado -->
                  <div *ngIf="!responsableSeleccionado" class="no-responsable-wrapper">
                    <button type="button" class="btn-assign-responsible" (click)="abrirModalResponsable()">
                      <i class="bi bi-person-plus-fill" style="font-size: 1.3rem;"></i>
                      <span>Asignar Responsable de Pago</span>
                    </button>
                    <div *ngIf="grupoForm.get('responsablePagoId')?.touched && !responsableSeleccionado" class="error-message">
                      <i class="bi bi-exclamation-triangle-fill text-amber-500 mr-1"></i> Debe asignar un responsable de pago para el grupo.
                    </div>
                  </div>

                  <!-- Si hay responsable seleccionado (Tarjeta premium impecable) -->
                  <div *ngIf="responsableSeleccionado" class="responsible-active-card glass-panel animate-in">
                    <div class="responsible-info">
                      <h4>{{ responsableSeleccionado.nombres }} {{ responsableSeleccionado.apellidos }}</h4>
                      <div class="responsible-meta">
                        <span><i class="bi bi-card-heading text-dorado-amazonico mr-1"></i> {{ responsableSeleccionado.tipoDocumento || 'Doc' }}: {{ responsableSeleccionado.numeroDocumento }}</span>
                        <span><i class="bi bi-telephone text-dorado-amazonico mr-1"></i> Tel: {{ responsableSeleccionado.telefono || '---' }}</span>
                        <span><i class="bi bi-globe text-dorado-amazonico mr-1"></i> {{ responsableSeleccionado.nacionalidad }}</span>
                      </div>
                    </div>
                    <button type="button" class="btn-change-responsible" (click)="abrirModalResponsable()">
                      <i class="bi bi-pencil-square mr-1"></i> Cambiar
                    </button>
                  </div>
                  
                  <input type="hidden" formControlName="responsablePagoId" />
                </div>
              </div>
            </div>

            <!-- SECCIÓN: CANAL DE VENTA -->
            <div class="form-section-group">
              <h3 class="section-title"><i class="bi bi-lightning-charge-fill text-dorado-amazonico mr-2"></i> Canal de Venta</h3>
              <div class="form-group">
                <label class="form-label">¿Cómo se contactó este grupo con el hotel? <span class="required">*</span></label>
                <div class="canales-grid">
                  <button
                    type="button"
                    *ngFor="let c of canalesVenta"
                    class="canal-card"
                    [class.selected]="grupoForm.get('canalVentaId')?.value === c.id"
                    (click)="seleccionarCanal(c)"
                  >
                    <span class="canal-icono"><i [class]="getCanalIconClass(c.nombre)"></i></span>
                    <span class="canal-nombre">{{ c.nombre }}</span>
                    <span *ngIf="grupoForm.get('canalVentaId')?.value === c.id" class="check-mark"><i class="bi bi-check-lg" style="font-size: 0.72rem;"></i></span>
                  </button>
                </div>
                <div *ngIf="grupoForm.get('canalVentaId')?.value && canalSeleccionadoEsOtro()" class="form-group" style="margin-top: 14px;">
                  <label class="form-label">Especifique el canal <span class="required">*</span></label>
                  <input type="text" formControlName="canalVentaOtro" placeholder="¿A través de qué medio?" class="form-control" />
                </div>
              </div>
            </div>

            <!-- SECCIÓN: FECHAS DE ESTADÍA -->
            <div class="form-section-group">
              <h3 class="section-title"><i class="bi bi-calendar-range-fill text-dorado-amazonico mr-2"></i> Período de Estadía Grupal</h3>
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Fecha de Ingreso <span class="required">*</span></label>
                  <mat-form-field appearance="outline" class="full-width" subscriptSizing="dynamic">
                    <input matInput [matDatepicker]="ingresoPicker"
                           formControlName="fechaIngreso"
                           [min]="minDate" [max]="maxDate"
                           (dateChange)="onFechasChange()"
                           placeholder="Seleccione fecha">
                    <mat-datepicker-toggle matSuffix [for]="ingresoPicker"></mat-datepicker-toggle>
                    <mat-datepicker #ingresoPicker startView="month"></mat-datepicker>
                    <mat-error *ngIf="fechaIngreso?.hasError('required')">
                      La fecha de ingreso es obligatoria
                    </mat-error>
                  </mat-form-field>
                </div>
                <div class="form-group">
                  <label class="form-label">Fecha de Salida <span class="required">*</span></label>
                  <mat-form-field appearance="outline" class="full-width" subscriptSizing="dynamic">
                    <input matInput [matDatepicker]="salidaPicker"
                           formControlName="fechaSalida"
                           [min]="minFechaSalida"
                           (dateChange)="onFechasChange()"
                           placeholder="Seleccione fecha">
                    <mat-datepicker-toggle matSuffix [for]="salidaPicker"></mat-datepicker-toggle>
                    <mat-datepicker #salidaPicker startView="month"></mat-datepicker>
                    <mat-error *ngIf="fechaSalida?.hasError('required')">
                      La fecha de salida es obligatoria
                    </mat-error>
                  </mat-form-field>
                </div>
              </div>
              
              <div *ngIf="grupoForm.hasError('fechaInvalida') && grupoForm.touched" class="global-field-error">
                <i class="bi bi-exclamation-triangle-fill text-amber-500 mr-2"></i> {{ grupoForm.getError('fechaInvalida') }}
              </div>
            </div>

            <!-- SECCIÓN: HABITACIONES -->
            <div class="form-section-group" *ngIf="fechaIngreso?.value && fechaSalida?.value && !grupoForm.hasError('fechaInvalida')">
              <h3 class="section-title"><i class="bi bi-key-fill text-dorado-amazonico mr-2"></i> Asignación de Habitaciones</h3>
              
              <!-- FILTROS -->
              <div style="margin-bottom: 20px; background: rgba(255, 255, 255, 0.5); padding: 16px; border-radius: 12px; border: 1px solid rgba(45, 90, 39, 0.1); display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                <div class="form-group" style="margin-bottom: 0;">
                  <label class="form-label"><i class="bi bi-search mr-1"></i> Buscar Habitación</label>
                  <input type="text" [(ngModel)]="filtroNumero" [ngModelOptions]="{standalone: true}" placeholder="Buscar por número de habitación" class="form-control" />
                </div>
                <div class="form-group" style="margin-bottom: 0;">
                  <label class="form-label"><i class="bi bi-building mr-1"></i> Filtrar por Piso</label>
                  <select [(ngModel)]="filtroPiso" [ngModelOptions]="{standalone: true}" class="form-control" style="cursor: pointer;">
                    <option [ngValue]="null">Todos los pisos</option>
                    <option *ngFor="let p of pisosUnicos" [ngValue]="p">Piso {{ p }}</option>
                  </select>
                </div>
                <div class="form-group" style="margin-bottom: 0;">
                  <label class="form-label"><i class="bi bi-door-open mr-1"></i> Filtrar por Tipo</label>
                  <select [(ngModel)]="filtroTipo" [ngModelOptions]="{standalone: true}" class="form-control" style="cursor: pointer;">
                    <option value="">Todos los tipos</option>
                    <option *ngFor="let t of tiposUnicos" [value]="t">{{ t }}</option>
                  </select>
                </div>
              </div>

              <!-- HABITACIONES DISPONIBLES -->
              <div class="form-group">
                <label class="form-label text-available">Seleccione las Habitaciones del Grupo</label>
                <div *ngIf="habitacionesDisponiblesFiltradas.length === 0" class="empty-rooms-alert" style="margin-bottom: 16px;">
                  <i class="bi bi-exclamation-triangle-fill text-amber-500 mr-2"></i> No hay habitaciones libres que coincidan con los filtros y rango de fechas.
                </div>
                <div class="checkbox-grid" *ngIf="habitacionesDisponiblesFiltradas.length > 0">
                  <label class="checkbox-label" *ngFor="let h of habitacionesDisponiblesFiltradas">
                    <input type="checkbox" [value]="h.id" [checked]="isRoomChecked(h.id)" (change)="toggleHabitacion(h, $any($event.target).checked)" />
                    <span class="room-card-check">
                      <span class="room-number">Hab. {{ h.numero }}</span>
                      <span class="room-type">{{ h.tipoNombre }}</span>
                      <span class="room-cap">Capacidad: {{ h.capacidadMax }} pers.</span>
                    </span>
                  </label>
                </div>
              </div>

              <!-- HABITACIONES NO DISPONIBLES -->
              <div *ngIf="habitacionesNoDisponiblesFiltradas.length > 0 && allHabitaciones.length > 0" class="form-group" style="margin-top: 24px;">
                <label class="form-label text-available">Habitaciones No Disponibles en estas fechas</label>
                <div class="checkbox-grid">
                  <div class="checkbox-label no-disponible" *ngFor="let h of habitacionesNoDisponiblesFiltradas">
                    <span class="room-card-check">
                      <span class="room-number">Hab. {{ h.numero }}</span>
                      <span class="room-type">{{ h.tipoNombre }}</span>
                    </span>
                    <span class="motivo-badge">{{ h.motivo }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- DISTRIBUCIÓN DE HUÉSPEDES POR HABITACIÓN SELECCIONADA -->
            <div class="form-section-group" *ngIf="habitacionesSeleccionadas.length > 0">
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
                        <span class="guest-detail">DNI: {{ h.titular.numeroDocumento }}</span>
                      </div>
                      <button type="button" class="btn-sm-action btn-change" (click)="cambiarTitularConConfirm(h)">Cambiar</button>
                    </div>
                    
                    <button *ngIf="!h.titular" type="button" class="btn-add-guest" (click)="abrirModal(h, 'titular')">
                      <i class="bi bi-plus-lg"></i> Asignar Titular
                    </button>
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
                        <span class="guest-detail">DNI: {{ a.numeroDocumento }}</span>
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

            <div *ngIf="error" class="alert alert-error">{{ error }}</div>

            <!-- BOTONES DE ACCIÓN -->
            <div class="form-actions">
              <a routerLink="/reservas" class="btn-cancel">Cancelar</a>
              <button type="submit" class="btn-primary" [disabled]="!puedeEnviar()">
                Registrar Grupo Completo
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- MODAL BOUTIQUE BÚSQUEDA DE CLIENTE -->
    <div *ngIf="modalAbierto" class="modal-overlay" (click)="cerrarModal($event)">
      <div class="modal-content animate-in" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>{{ accionModal === 'titular' ? 'Asignar Titular' : 'Agregar Acompañante' }}</h3>
          <button type="button" class="modal-close" (click)="cerrarModal()">&times;</button>
        </div>
        
        <div class="modal-body">
          <div class="search-box-modal">
            <span class="search-icon-modal"><i class="bi bi-search text-slate-400"></i></span>
            <input
              type="text"
              [(ngModel)]="busquedaTermino"
              (input)="filtrarClientes()"
              placeholder="Buscar por nombre, apellidos o DNI..."
              class="search-input"
              autofocus
            />
          </div>
          
          <div *ngIf="busquedaTermino.trim() && clientesFiltradosModal.length === 0" class="text-muted search-empty">
            No se encontraron clientes registrados con "<strong>{{ busquedaTermino }}</strong>"
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
                <button type="button" class="btn-action-modal btn-select-titular" (click)="elegirTitular(habitacionModal!, c)">
                  <i class="bi bi-crown-fill mr-1"></i> Titular
                </button>
                <button type="button" class="btn-action-modal btn-select-acomp" (click)="agregarAcompanante(habitacionModal!, c)">
                  <i class="bi bi-person-fill mr-1"></i> Acompañante
                </button>
              </div>
            </div>
          </div>
          
          <div class="modal-footer-link">
            <a routerLink="/clientes" target="_blank" class="crear-cliente-link" title="Se abrirá en una pestaña nueva para no perder los datos del grupo">
              <i class="bi bi-person-plus-fill mr-1"></i> ¿El cliente no está registrado? Crear nuevo cliente
            </a>
          </div>
        </div>
      </div>
    </div>

    <!-- MODAL BOUTIQUE BÚSQUEDA DE RESPONSABLE DE PAGO -->
    <div *ngIf="modalResponsableAbierto" class="modal-overlay" (click)="cerrarModalResponsable($event)">
      <div class="modal-content animate-in" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>Asignar Responsable de Pago</h3>
          <button type="button" class="modal-close" (click)="cerrarModalResponsable()">&times;</button>
        </div>
        
        <div class="modal-body">
          <div class="search-box-modal">
            <span class="search-icon-modal"><i class="bi bi-search text-slate-400"></i></span>
            <input
              type="text"
              [(ngModel)]="busquedaResponsableTermino"
              (input)="filtrarClientesResponsable()"
              placeholder="Buscar por nombre, apellidos o DNI..."
              class="search-input"
              autofocus
            />
          </div>
          
          <div *ngIf="busquedaResponsableTermino.trim() && clientesFiltradosResponsableModal.length === 0" class="text-muted search-empty">
            No se encontraron clientes registrados con "<strong>{{ busquedaResponsableTermino }}</strong>"
          </div>
          
          <!-- RESULTADOS -->
          <div class="results-list">
            <div *ngFor="let c of clientesFiltradosResponsableModal" class="result-row">
              <div class="result-info">
                <strong>{{ c.nombres }} {{ c.apellidos }}</strong>
                <span class="result-detail">
                  <i class="bi bi-card-heading text-slate-400 mr-1"></i> {{ c.tipoDocumento || 'Doc' }}: {{ c.numeroDocumento }} | 
                  <i class="bi bi-telephone text-slate-400 mr-1"></i> Tel: {{ c.telefono || '---' }}
                </span>
              </div>
              <div class="result-actions">
                <button type="button" class="btn-action-modal btn-select-titular" (click)="elegirResponsable(c)">
                  <i class="bi bi-check-lg mr-1"></i> Seleccionar
                </button>
              </div>
            </div>
          </div>
          
          <div class="modal-footer-link">
            <a routerLink="/clientes" target="_blank" class="crear-cliente-link" title="Se abrirá en una pestaña nueva para no perder los datos del grupo">
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
      max-width: 1000px;
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
      margin-bottom: 32px;
      padding-bottom: 24px;
      border-bottom: 1px solid rgba(45, 90, 39, 0.06);
    }

    .form-section-group:last-of-type {
      border-bottom: none;
      margin-bottom: 0;
      padding-bottom: 0;
    }

    .section-title {
      font-size: 1.1rem;
      font-weight: 800;
      color: #2D5A27; /* Verde Selva */
      margin: 0 0 20px 0;
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

    /* MATERIAL STYLE OVERRIDES TO FOREST GREEN */
    ::ng-deep .mat-mdc-form-field {
      width: 100% !important;
    }
    ::ng-deep .mdc-text-field--outlined:not(.mdc-text-field--disabled) .mdc-notched-outline__leading,
    ::ng-deep .mdc-text-field--outlined:not(.mdc-text-field--disabled) .mdc-notched-outline__notch,
    ::ng-deep .mdc-text-field--outlined:not(.mdc-text-field--disabled) .mdc-notched-outline__trailing {
      border-color: #cbd5e1 !important;
      border-width: 1px !important;
    }
    ::ng-deep .mdc-text-field--outlined:not(.mdc-text-field--disabled):not(.mdc-text-field--focused):hover .mdc-notched-outline__leading,
    ::ng-deep .mdc-text-field--outlined:not(.mdc-text-field--disabled):not(.mdc-text-field--focused):hover .mdc-notched-outline__notch,
    ::ng-deep .mdc-text-field--outlined:not(.mdc-text-field--disabled):not(.mdc-text-field--focused):hover .mdc-notched-outline__trailing {
      border-color: #4E8D46 !important;
    }
    ::ng-deep .mdc-text-field--outlined:not(.mdc-text-field--disabled).mdc-text-field--focused .mdc-notched-outline__leading,
    ::ng-deep .mdc-text-field--outlined:not(.mdc-text-field--disabled).mdc-text-field--focused .mdc-notched-outline__notch,
    ::ng-deep .mdc-text-field--outlined:not(.mdc-text-field--disabled).mdc-text-field--focused .mdc-notched-outline__trailing {
      border-color: #2D5A27 !important;
      border-width: 2px !important;
    }
    ::ng-deep .mat-mdc-form-field-focus-indicator {
      color: #2D5A27 !important;
    }
    ::ng-deep .mat-datepicker-toggle {
      color: #2D5A27 !important;
    }
    ::ng-deep .mat-calendar-body-selected {
      background-color: #2D5A27 !important;
    }
    ::ng-deep .mat-calendar-body-today:not(.mat-calendar-body-selected):not(.mat-calendar-body-comparison-identical) {
      border-color: #4E8D46 !important;
    }

    /* RESPONSABLE DE PAGO CARD */
    .cliente-seleccionado-card {
      margin-top: 8px;
    }

    .selected-badge {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      background: rgba(78, 141, 70, 0.08); /* Verde Tropical */
      border: 1px solid rgba(78, 141, 70, 0.25);
      border-radius: 10px;
    }

    .badge-icon {
      font-size: 1.5rem;
    }

    .badge-text {
      display: flex;
      flex-direction: column;
    }

    .badge-text strong {
      font-size: 0.9rem;
      color: #2D5A27;
    }

    .badge-text small {
      font-size: 0.76rem;
      color: #475569;
    }

    /* AUTOCOMPLETE OPTIONS */
    .cliente-option {
      padding: 6px 0;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .cliente-nombre {
      font-size: 0.88rem;
      color: #1A211B;
    }

    .cliente-detalles {
      display: flex;
      gap: 12px;
      font-size: 0.72rem;
      color: #64748b;
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
      border-color: #2D5A27;
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

    /* ROOM SELECTION */
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

    .room-card-check {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .room-number {
      font-size: 0.95rem;
      font-weight: 800;
      color: #2D5A27;
    }

    .room-type {
      font-size: 0.8rem;
      font-weight: 600;
      color: #475569;
    }

    .room-cap {
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
      color: #8B5A2B;
      background: rgba(139, 90, 43, 0.1);
      padding: 3px 8px;
      border-radius: 8px;
      white-space: nowrap;
    }

    /* SUITE CARD (SUITE SELECCIONADA Y DISTRIBUIDA) */
    .suite-card {
      background: rgba(248, 250, 252, 0.6);
      border: 1px solid rgba(45, 90, 39, 0.12);
      border-left: 5px solid #2D5A27; /* Detalle de marca */
      border-radius: 16px;
      padding: 24px;
      margin-bottom: 20px;
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

    /* MODAL DE BÚSQUEDA DE CLIENTE BOUTIQUE */
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
      width: 100%;
      max-width: 580px;
      max-height: 85vh;
      overflow-y: auto;
      box-shadow: 0 25px 50px -12px rgba(0,0,0,0.15);
      border: 1px solid rgba(45, 90, 39, 0.12);
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
    }

    .modal-close:hover {
      color: #ffffff;
    }

    .modal-body {
      padding: 24px 28px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .search-box-modal {
      position: relative;
      display: flex;
      align-items: center;
    }

    .search-icon-modal {
      position: absolute;
      left: 14px;
      color: #64748b;
      font-size: 1rem;
    }

    .search-input {
      width: 100%;
      padding: 12px 14px 12px 42px;
      border: 1px solid #cbd5e1;
      border-radius: 10px;
      font-size: 0.92rem;
      font-family: inherit;
      outline: none;
      transition: all 0.25s ease;
      background: #f8fafc;
      box-sizing: border-box;
    }

    .search-input:focus {
      border-color: #2D5A27;
      box-shadow: 0 0 0 3px rgba(45, 90, 39, 0.12);
      background: white;
    }

    .search-empty {
      text-align: center;
      padding: 24px 0;
      color: #64748b;
      font-size: 0.9rem;
    }

    .results-list {
      display: flex;
      flex-direction: column;
      max-height: 250px;
      overflow-y: auto;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
    }

    .result-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 16px;
      border-bottom: 1px solid #e2e8f0;
      background: white;
      transition: background 0.15s ease;
    }

    .result-row:hover {
      background: rgba(78, 141, 70, 0.03);
    }

    .result-row:last-child {
      border-bottom: none;
    }

    .result-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
      flex: 1;
      min-width: 0;
    }

    .result-info strong {
      font-size: 0.88rem;
      color: #1A211B;
    }

    .result-detail {
      font-size: 0.76rem;
      color: #64748b;
    }

    .result-actions {
      display: flex;
      gap: 6px;
    }

    .btn-action-modal {
      padding: 6px 12px;
      border: 1px solid transparent;
      border-radius: 8px;
      cursor: pointer;
      font-size: 0.72rem;
      font-weight: 700;
      transition: all 0.2s ease;
    }

    .btn-select-titular {
      background: rgba(212, 168, 67, 0.1);
      color: #D4A843;
      border-color: rgba(212, 168, 67, 0.25);
    }

    .btn-select-titular:hover {
      background: #D4A843;
      color: white;
    }

    .btn-select-acomp {
      background: rgba(78, 141, 70, 0.1);
      color: #4E8D46;
      border-color: rgba(78, 141, 70, 0.25);
    }

    .btn-select-acomp:hover {
      background: #4E8D46;
      color: white;
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

    /* REDISEÑO RESPONSABLE DE PAGO */
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
    }

    .responsible-badge {
      font-size: 0.72rem;
      font-weight: 800;
      color: #2D5A27;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      display: inline-flex;
      align-items: center;
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

    /* PREMIUM WRAPPER PARA EL INPUT NOMBRE DEL GRUPO */
    .input-premium-wrapper {
      display: flex;
      align-items: center;
      padding: 0 20px;
      border-radius: 14px;
      background: rgba(255, 255, 255, 0.8);
      border: 1px solid rgba(45, 90, 39, 0.1);
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.02);
      min-height: 86px;
      transition: all 0.25s ease;
      box-sizing: border-box;
    }

    .input-premium-wrapper:focus-within {
      border-color: #2D5A27;
      background: white;
      box-shadow: 0 4px 20px rgba(45, 90, 39, 0.08);
    }

    .form-control-premium {
      width: 100%;
      border: none;
      background: transparent;
      outline: none;
      font-size: 1.05rem;
      font-weight: 600;
      color: #1a211b;
    }

    .form-control-premium::placeholder {
      color: #94a3b8;
      font-weight: 500;
    }
  `]
})
export class GrupoFormComponent implements OnInit {
  grupoForm: FormGroup;
  responsableControl = new FormControl();

  minDate: Date;
  maxDate: Date;
  minFechaSalida: Date;

  clientesFiltrados: Observable<ClienteResponse[]>;
  responsableSeleccionado: ClienteResponse | null = null;

  allHabitaciones: HabitacionResponse[] = [];
  habitacionesDisponibles: HabitacionResponse[] = [];
  habitacionesNoDisponibles: (HabitacionResponse & { motivo: string })[] = [];
  habitacionesSeleccionadas: HabitacionEnFormulario[] = [];
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

  modalAbierto = false;
  busquedaTermino = '';
  clientesFiltradosModal: ClienteResponse[] = [];
  habitacionModal: HabitacionEnFormulario | null = null;
  accionModal: 'titular' | 'acompanante' | null = null;

  modalResponsableAbierto = false;
  busquedaResponsableTermino = '';
  clientesFiltradosResponsableModal: ClienteResponse[] = [];

  constructor(
    private fb: FormBuilder,
    private service: ReservaService,
    private clienteService: ClienteService,
    private habitacionService: HabitacionService,
    private auth: AuthService,
    private router: Router
  ) {
    this.minDate = new Date();
    this.minDate.setHours(0, 0, 0, 0);

    this.maxDate = new Date();
    this.maxDate.setDate(this.maxDate.getDate() + 30);

    this.minFechaSalida = new Date();
    this.minFechaSalida.setDate(this.minFechaSalida.getDate() + 1);

    this.grupoForm = this.fb.group({
      nombreGrupo: ['', Validators.required],
      responsablePagoId: ['', Validators.required],
      canalVentaId: [null, Validators.required],
      canalVentaOtro: [''],
      fechaIngreso: ['', Validators.required],
      fechaSalida: ['', Validators.required]
    }, { validators: this.fechasValidator });

    this.clientesFiltrados = this.responsableControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(termino => {
        if (!termino || typeof termino !== 'string' || termino.trim().length < 2) {
          return of([]);
        }
        return this.clienteService.buscarResponsables(termino.trim()).pipe(
          catchError(() => of([]))
        );
      })
    );
  }

  ngOnInit(): void {
    this.habitacionService.getAll().subscribe({
      next: (data) => {
        this.allHabitaciones = data;
        this.clasificarHabitaciones();
      }
    });
    this.service.getCanalesVenta().subscribe({ next: (data) => this.canalesVenta = data });

    this.grupoForm.get('fechaIngreso')?.valueChanges.subscribe(ingreso => {
      if (ingreso) {
        const ingresoDate = new Date(ingreso);
        this.minFechaSalida = new Date(ingresoDate);
        this.minFechaSalida.setDate(ingresoDate.getDate() + 1);
        const salidaActual = this.grupoForm.get('fechaSalida')?.value;
        if (salidaActual && salidaActual <= ingreso) {
          this.grupoForm.patchValue({ fechaSalida: null });
        }
      }
    });
  }

  get fechaIngreso() { return this.grupoForm.get('fechaIngreso'); }
  get fechaSalida() { return this.grupoForm.get('fechaSalida'); }

  fechasValidator(group: FormGroup): ValidationErrors | null {
    const ingreso = group.get('fechaIngreso')?.value;
    const salida = group.get('fechaSalida')?.value;
    if (!ingreso || !salida) return null;
    if (salida <= ingreso) {
      return { fechaInvalida: 'La fecha de salida debe ser posterior a la fecha de ingreso' };
    }
    return null;
  }

  displayCliente(cliente: any): string {
    if (!cliente) return '';
    if (typeof cliente === 'string') return cliente;
    return `${cliente.nombres || ''} ${cliente.apellidos || ''} - ${cliente.numeroDocumento || ''}`.trim();
  }

  onResponsableSelected(event: any): void {
    const cliente: ClienteResponse | null = event.option.value;
    if (!cliente) return;
    this.responsableSeleccionado = cliente;
    this.grupoForm.patchValue({ responsablePagoId: cliente.id });
    this.responsableControl.setValue(cliente);
  }

  canalSeleccionadoEsOtro(): boolean {
    const canal = this.canalesVenta.find(c => c.id === this.grupoForm.get('canalVentaId')?.value);
    return canal?.nombre === 'Otro';
  }

  seleccionarCanal(c: CanalVenta): void {
    this.grupoForm.patchValue({ canalVentaId: c.id });
    if (c.nombre !== 'Otro') {
      this.grupoForm.patchValue({ canalVentaOtro: '' });
    }
  }

  onFechasChange(): void {
    const ingreso = this.grupoForm.get('fechaIngreso')?.value;
    const salida = this.grupoForm.get('fechaSalida')?.value;
    if (ingreso && salida) {
      const fmt = (d: Date) => {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
      };
      this.habitacionService.getDisponibles(fmt(ingreso), fmt(salida))
        .subscribe({
          next: (data) => {
            // El backend puede devolver habitaciones 'Por limpiar' que están libres en las fechas,
            // pero el usuario solicita que solo se muestren las 'Disponible'.
            const habitacionesFiltradas = data.filter(h => h.estadoActual === 'Disponible');
            this.habitacionesDisponibles = habitacionesFiltradas;
            this.clasificarNoDisponibles();
            const disponiblesIds = new Set(habitacionesFiltradas.map(h => h.id));
            const removed = this.habitacionesSeleccionadas.filter(h => !disponiblesIds.has(h.habitacionId));
            if (removed.length > 0) {
              this.habitacionesSeleccionadas = this.habitacionesSeleccionadas.filter(h => disponiblesIds.has(h.habitacionId));
              this.error = `Las siguientes habitaciones ya no están disponibles para las fechas seleccionadas y fueron removidas: ${removed.map(h => h.numero).join(', ')}`;
            }
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

  toggleHabitacion(h: HabitacionResponse, checked: boolean): void {
    if (checked) {
      this.habitacionesSeleccionadas.push({
        habitacionId: h.id,
        numero: h.numero,
        tipoNombre: h.tipoNombre,
        capacidadMax: h.capacidadMax,
        titular: null,
        acompanantes: []
      });
    } else {
      this.habitacionesSeleccionadas = this.habitacionesSeleccionadas.filter(x => x.habitacionId !== h.id);
    }
  }

  isRoomChecked(id: string): boolean {
    return this.habitacionesSeleccionadas.some(h => h.habitacionId === id);
  }

  abrirModal(h: HabitacionEnFormulario, accion: 'titular' | 'acompanante'): void {
    this.habitacionModal = h;
    this.accionModal = accion;
    this.busquedaTermino = '';
    this.clientesFiltradosModal = [];
    this.modalAbierto = true;
  }

  cerrarModal(event?: MouseEvent): void {
    this.modalAbierto = false;
    this.busquedaTermino = '';
    this.clientesFiltradosModal = [];
    this.habitacionModal = null;
    this.accionModal = null;
  }

  filtrarClientes(): void {
    const term = this.busquedaTermino.toLowerCase().trim();
    if (!term) {
      this.clientesFiltradosModal = [];
      return;
    }
    this.clienteService.buscarResponsables(term).subscribe({
      next: (data) => this.clientesFiltradosModal = data
    });
  }

  elegirTitular(h: HabitacionEnFormulario, c: ClienteResponse): void {
    const inOtherRoom = this.habitacionesSeleccionadas.some(otherH =>
      otherH.habitacionId !== h.habitacionId &&
      (otherH.titular?.id === c.id || otherH.acompanantes.some(a => a.id === c.id))
    );

    if (inOtherRoom) {
      alert(`${c.nombres} ${c.apellidos} ya está asignado(a) a otra habitación en este grupo.`);
      return;
    }

    h.titular = c;
    h.acompanantes = h.acompanantes.filter(a => a.id !== c.id);
    this.cerrarModal();
  }

  agregarAcompanante(h: HabitacionEnFormulario, c: ClienteResponse): void {
    if (c.id === h.titular?.id) {
      alert(`${c.nombres} ${c.apellidos} ya es el titular de esta habitación.`);
      return;
    }
    if (h.acompanantes.some(a => a.id === c.id)) {
      alert(`${c.nombres} ${c.apellidos} ya está agregado como acompañante.`);
      return;
    }

    const inOtherRoom = this.habitacionesSeleccionadas.some(otherH =>
      otherH.habitacionId !== h.habitacionId &&
      (otherH.titular?.id === c.id || otherH.acompanantes.some(a => a.id === c.id))
    );

    if (inOtherRoom) {
      alert(`${c.nombres} ${c.apellidos} ya está asignado(a) a otra habitación en este grupo.`);
      return;
    }

    if (h.acompanantes.length >= h.capacidadMax - 1) {
      alert(`No se puede agregar más acompañantes. La habitación ${h.numero} (${h.tipoNombre}) ya está completa (${this.getCapacidadAsignada(h)}/${h.capacidadMax} ocupantes).`);
      return;
    }
    h.acompanantes.push(c);
    this.cerrarModal();
  }

  cambiarTitularConConfirm(h: HabitacionEnFormulario): void {
    if (!h.titular) return;
    this.abrirModal(h, 'titular');
  }

  quitarAcompanante(h: HabitacionEnFormulario, idx: number): void {
    h.acompanantes.splice(idx, 1);
  }

  quitarHabitacion(idx: number): void {
    this.habitacionesSeleccionadas.splice(idx, 1);
  }

  abrirModalResponsable(): void {
    this.busquedaResponsableTermino = '';
    this.clientesFiltradosResponsableModal = [];
    this.modalResponsableAbierto = true;
  }

  cerrarModalResponsable(event?: MouseEvent): void {
    this.modalResponsableAbierto = false;
    this.busquedaResponsableTermino = '';
    this.clientesFiltradosResponsableModal = [];
  }

  filtrarClientesResponsable(): void {
    const term = this.busquedaResponsableTermino.toLowerCase().trim();
    if (!term) {
      this.clientesFiltradosResponsableModal = [];
      return;
    }
    this.clienteService.buscarResponsables(term).subscribe({
      next: (data) => this.clientesFiltradosResponsableModal = data
    });
  }

  elegirResponsable(c: ClienteResponse): void {
    this.responsableSeleccionado = c;
    this.grupoForm.patchValue({ responsablePagoId: c.id });
    this.responsableControl.setValue(c);
    this.cerrarModalResponsable();
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

  puedeEnviar(): boolean {
    if (this.grupoForm.invalid || this.habitacionesSeleccionadas.length === 0 || !this.responsableSeleccionado) return false;
    if (this.canalSeleccionadoEsOtro() && !this.grupoForm.get('canalVentaOtro')?.value?.trim()) return false;
    return true;
  }

  onCreate(): void {
    this.error = '';
    const user = this.auth.getUsuario();
    if (!user?.id) { this.error = 'Usuario no autenticado'; return; }

    for (const h of this.habitacionesSeleccionadas) {
      if (!h.titular && h.acompanantes.length === 0) {
        this.error = `La habitación ${h.numero} (${h.tipoNombre}) no tiene huéspedes asignados. Cada habitación debe tener al menos un titular.`;
        return;
      }
      if (!h.titular && h.acompanantes.length > 0) {
        this.error = `La habitación ${h.numero} (${h.tipoNombre}) tiene acompañantes pero no tiene un titular asignado`;
        return;
      }
    }

    const reservas: ReservaEnGrupoRequest[] = this.habitacionesSeleccionadas.map(h => {
      const allGuests = [...(h.titular ? [h.titular] : []), ...h.acompanantes];
      const adultos = allGuests.filter(g =>
        clasificarEdad(g.fechaNacimiento) === 'adulto' ||
        clasificarEdad(g.fechaNacimiento) === 'adolescente' ||
        clasificarEdad(g.fechaNacimiento) === 'adulto_mayor'
      ).length;
      const ninos = allGuests.filter(g => clasificarEdad(g.fechaNacimiento) === 'nino').length;

      const ingreso = this.grupoForm.get('fechaIngreso')?.value;
      const salida = this.grupoForm.get('fechaSalida')?.value;
      const fmtDate = (d: Date) => {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
      };

      return {
        habitacionId: h.habitacionId,
        fechaIngreso: fmtDate(ingreso),
        fechaSalida: fmtDate(salida),
        adultos,
        ...(ninos > 0 ? { ninos } : {}),
        huespedes: [
          ...(h.titular ? [{ clienteId: h.titular.id, esTitular: true }] : []),
          ...h.acompanantes.map(a => ({ clienteId: a.id, esTitular: false }))
        ]
      };
    });

    const ingreso = this.grupoForm.get('fechaIngreso')?.value;
    const salida = this.grupoForm.get('fechaSalida')?.value;
    const fmtDate = (d: Date) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };

    const request: GrupoRequest = {
      nombreGrupo: this.grupoForm.get('nombreGrupo')?.value,
      responsablePagoId: this.grupoForm.get('responsablePagoId')?.value,
      fechaIngreso: fmtDate(ingreso),
      fechaSalida: fmtDate(salida),
      canalVentaId: this.grupoForm.get('canalVentaId')?.value,
      canalVentaOtro: this.grupoForm.get('canalVentaOtro')?.value || undefined,
      reservas,
      creadoPor: user.id
    };

    this.service.crearGrupo(request).subscribe({
      next: () => this.router.navigate(['/reservas']),
      error: (err) => this.error = err.error?.message || 'Error al crear el grupo'
    });
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
}
