import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { ClienteService } from '../../../core/services/cliente.service';
import { ClienteResponse, ClienteRequest } from '../../../core/models/cliente';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { phoneValidator } from '../../../core/utils/phone.validator';
import { infoPorNacionalidad } from '../../../core/utils/phone-utils';
import { of, Subject } from 'rxjs';
import { debounceTime, switchMap, catchError, map, distinctUntilChanged } from 'rxjs/operators';

const PAISES = [
  'Peruana', 'Argentina', 'Boliviana', 'Brasileña', 'Canadiense', 'Chilena',
  'Colombiana', 'Costarricense', 'Cubana', 'Dominicana', 'Ecuatoriana',
  'Estadounidense', 'Francesa', 'Guatemalteca', 'Haitiana', 'Hondureña',
  'Italiana', 'Japonesa', 'Mexicana', 'Nicaragüense', 'Panameña',
  'Paraguaya', 'Portuguesa', 'Puertorriqueña', 'Salvadoreña', 'Española',
  'Uruguaya', 'Venezolana', 'Alemana', 'Británica', 'China', 'Coreana',
  'India', 'Rusa', 'Sudafricana', 'Otra'
];

@Component({
  selector: 'app-cliente-list',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule, FormsModule],
  template: `
    <div class="page-container fade-in">
      <!-- CABECERA PREMIUM DE LA PÁGINA -->
      <div class="header-section">
        <div class="title-area">
          <h2><i class="header-icon-premium bi bi-person-badge-fill"></i> Directorio de Clientes</h2>
          <p class="subtitle">Gestione la base de datos de huéspedes titulares y acompañantes del hotel</p>
        </div>
        <button class="btn-new-cliente" (click)="toggleForm()">
          <i class="bi" [ngClass]="showForm ? 'bi-x-circle-fill' : 'bi-person-plus-fill'"></i> {{ showForm ? (editandoId ? 'Cancelar Edición' : 'Cancelar Registro') : 'Nuevo Cliente' }}
        </button>
      </div>

      <!-- FORMULARIO DE REGISTRO BOUTIQUE -->
      <div class="card glass-panel animate-in" *ngIf="showForm">
        <div class="card-body">
          <h3 class="form-title">
            <i class="bi" [ngClass]="editandoId ? 'bi-pencil-square' : 'bi-person-plus-fill'"></i>
            {{ editandoId ? 'Editar Ficha de Cliente' : 'Registrar Nuevo Cliente' }}
          </h3>
          <p class="required-note">Los campos marcados con <span class="required">*</span> son requeridos de forma obligatoria.</p>
          
          <form [formGroup]="clienteForm" (ngSubmit)="editandoId ? onUpdate() : onCreate()" class="form">
            <div class="form-grid">
              
              <div class="form-group">
                <label>Tipo Documento <span class="required">*</span></label>
                <select formControlName="tipoDocumento" class="form-control">
                  <option value="DNI">DNI (Perú)</option>
                  <option value="Pasaporte">Pasaporte</option>
                  <option value="Carn\u00E9 Extranjer\u00EDa">Carné de Extranjería</option>
                </select>
              </div>

              <div class="form-group">
                <label>Número Documento <span class="required">*</span></label>
                <input type="text" formControlName="numeroDocumento" maxlength="20" class="form-control" placeholder="Ingrese el número..." />
                <span class="field-error" *ngIf="clienteForm.get('numeroDocumento')?.invalid && clienteForm.get('numeroDocumento')?.touched">
                  {{ getDocError() }}
                </span>
              </div>

              <div class="form-group">
                <label>Nombres <span class="required">*</span></label>
                <input type="text" formControlName="nombres" class="form-control" placeholder="Ej: Juan Carlos" />
                <span class="field-error" *ngIf="clienteForm.get('nombres')?.invalid && clienteForm.get('nombres')?.touched">
                  Solo letras, entre 2 y 50 caracteres.
                </span>
              </div>

              <div class="form-group">
                <label>Apellidos <span class="required">*</span></label>
                <input type="text" formControlName="apellidos" class="form-control" placeholder="Ej: Cervera Torres" />
                <span class="field-error" *ngIf="clienteForm.get('apellidos')?.invalid && clienteForm.get('apellidos')?.touched">
                  Solo letras, entre 2 y 50 caracteres.
                </span>
              </div>

              <div class="form-group">
                <label>Nacionalidad <span class="required">*</span></label>
                <select formControlName="nacionalidad" class="form-control">
                  <option value="">Seleccione país...</option>
                  <option *ngFor="let p of paises" [value]="p">{{ p }}</option>
                </select>
                <span class="field-error" *ngIf="clienteForm.get('nacionalidad')?.invalid && clienteForm.get('nacionalidad')?.touched">
                  Seleccione una nacionalidad.
                </span>
              </div>

              <div class="form-group">
                <label>Teléfono Celular <span class="required">*</span></label>
                <div class="phone-input-group">
                  <span class="phone-prefix" [class.disabled]="!codigoPais">{{ codigoPais || '+' }}</span>
                  <input type="tel" formControlName="telefono" placeholder="Número celular..." class="form-control" />
                </div>
                <span class="field-error" *ngIf="clienteForm.get('telefono')?.invalid && clienteForm.get('telefono')?.touched">
                  {{ getTelefonoError() }}
                </span>
              </div>

              <div class="form-group">
                <label>Correo Electrónico</label>
                <input type="email" formControlName="correoElectronico" class="form-control" placeholder="correo@ejemplo.com" />
                <span class="field-error" *ngIf="clienteForm.get('correoElectronico')?.invalid && clienteForm.get('correoElectronico')?.touched">
                  {{ getCorreoElectronicoError() }}
                </span>
              </div>

              <div class="form-group">
                <label>Género <span class="required">*</span></label>
                <select formControlName="genero" class="form-control">
                  <option value="">Seleccionar género...</option>
                  <option value="Masculino">Masculino</option>
                  <option value="Femenino">Femenino</option>
                  <option value="No especificar">No especificar</option>
                </select>
                <span class="field-error" *ngIf="clienteForm.get('genero')?.invalid && clienteForm.get('genero')?.touched">
                  Seleccione un género.
                </span>
              </div>

              <div class="form-group">
                <label>Fecha de Nacimiento</label>
                <input type="date" formControlName="fechaNacimiento" class="form-control" />
                <span class="field-error" *ngIf="clienteForm.get('fechaNacimiento')?.errors?.['futureDate']">
                  La fecha no puede ser futura.
                </span>
              </div>

              <div class="form-group flex-checkbox-align" *ngIf="esMenorEdad">
                <label class="checkbox-inline">
                  <input type="checkbox" formControlName="acompanadoPorAdulto" class="custom-checkbox-input" />
                  <span class="custom-checkbox-box"></span>
                  <span class="label-text-checkbox">¿Viaja acompañado por un adulto responsable?</span>
                </label>
                <span class="field-error" *ngIf="clienteForm.get('fechaNacimiento')?.errors?.['underage'] && !clienteForm.get('acompanadoPorAdulto')?.value">
                  Huéspedes menores de edad requieren acompañante adulto.
                </span>
              </div>

            </div>

            <div class="form-actions">
              <button type="button" class="btn-cancel" (click)="resetForm()">
                <i class="bi bi-arrow-left-circle-fill"></i> Cancelar
              </button>
              <button type="submit" class="btn-save" [disabled]="clienteForm.invalid">
                <i class="bi" [ngClass]="editandoId ? 'bi-check-circle-fill' : 'bi-plus-circle-fill'"></i>
                {{ editandoId ? 'Actualizar Ficha' : 'Guardar Cliente' }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- BUSCADOR GLASSMORPHIC -->
      <div class="search-card glass-panel">
        <div class="search-box">
          <span class="search-icon"><i class="bi bi-search"></i></span>
          <input 
            type="text" 
            [(ngModel)]="searchTerm" 
            (input)="filtrar()" 
            placeholder="Buscar clientes por nombres, apellidos, documento DNI o nacionalidad..." 
            class="search-input" 
          />
          <button *ngIf="searchTerm" class="clear-btn" (click)="searchTerm = ''; filtrar()"><i class="bi bi-x-lg"></i></button>
        </div>
      </div>

      <!-- DIRECTORIÓ DE CLIENTES (TABLA BOUTIQUE) -->
      <div class="table-card glass-panel">
        <div class="table-responsive">
          <table class="table">
            <thead>
              <tr>
                <th>Documento</th>
                <th>Nombre Completo</th>
                <th>Nacionalidad</th>
                <th>Género</th>
                <th>Teléfono</th>
                <th>Email</th>
                <th>Estado</th>
                <th>Estadías</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let c of clientesPaginados" class="table-row-hover">
                <td class="codigo">{{ c.tipoDocumento }} {{ c.numeroDocumento }}</td>
                <td class="bold-text">{{ c.nombres }} {{ c.apellidos }}</td>
                <td>{{ c.nacionalidad }}</td>
                <td>{{ c.genero || '-' }}</td>
                <td>{{ c.telefono || '-' }}</td>
                <td>{{ c.correoElectronico || '-' }}</td>
                <td>
                  <span class="badge badge-{{ c.estado.toLowerCase() }}">{{ c.estado || 'ACTIVO' }}</span>
                </td>
                <td class="stay-count"><i class="bi bi-bell-fill text-dorado-amazonico mr-1"></i> {{ c.vecesHospedado }}</td>
                <td>
                  <div class="action-buttons-group">
                    <button class="btn-sm btn-edit" (click)="editar(c)" *ngIf="auth.esGerente()" title="Editar Ficha"><i class="bi bi-pencil-square"></i></button>
                    <button class="btn-sm btn-suspender" (click)="cambiarEstado(c, 'SUSPENDIDO')" *ngIf="auth.esGerente() && c.estado === 'ACTIVO'" title="Suspender Cliente"><i class="bi bi-slash-circle"></i></button>
                    <button class="btn-sm btn-reactivar" (click)="cambiarEstado(c, 'ACTIVO')" *ngIf="auth.esGerente() && (c.estado === 'SUSPENDIDO' || c.estado === 'VETADO')" title="Reactivar Cliente"><i class="bi bi-arrow-clockwise"></i></button>
                    <button class="btn-sm btn-vetar" (click)="cambiarEstado(c, 'VETADO')" *ngIf="auth.esGerente() && c.estado === 'ACTIVO'" title="Vetar Cliente"><i class="bi bi-x-octagon"></i></button>
                  </div>
                </td>
              </tr>
              <tr *ngIf="clientesFiltrados.length === 0">
                <td colspan="9" class="empty"><i class="bi bi-info-circle-fill text-slate-400 mr-2"></i> No hay clientes registrados que coincidan con la búsqueda</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- PAGINACIÓN PREMIUM CON CONTROLES DE MARCA -->
        <div class="paginator-container" *ngIf="clientesFiltrados.length > 0">
          <div class="paginator-info">
            Mostrando <b>{{ getRangoInicio() }} - {{ getRangoFin() }}</b> de <b>{{ clientesFiltrados.length }}</b> clientes
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

    .btn-new-cliente {
      padding: 10px 24px;
      background: linear-gradient(135deg, #4E8D46 0%, #2D5A27 100%);
      color: white;
      border: 1px solid rgba(212, 168, 67, 0.2);
      border-radius: 10px;
      font-weight: 700;
      font-size: 0.85rem;
      cursor: pointer;
      transition: all 0.25s ease;
      box-shadow: 0 4px 10px rgba(45, 90, 39, 0.15);
    }

    .btn-new-cliente:hover {
      background: linear-gradient(135deg, #2D5A27 0%, #1A211B 100%);
      transform: translateY(-1px);
    }

    /* CARD GLASSMORPHIC FORM */
    .glass-panel {
      background: rgba(255, 255, 255, 0.9);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border: 1px solid rgba(45, 90, 39, 0.08);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.03);
    }

    .card {
      border-radius: 18px;
      margin-bottom: 24px;
      overflow: hidden;
      border: 1px solid rgba(45, 90, 39, 0.1);
    }

    .card-body {
      padding: 24px 28px;
    }

    .form-title {
      margin: 0 0 4px;
      font-size: 1.15rem;
      font-weight: 800;
      color: #2D5A27;
      letter-spacing: -0.01em;
    }

    .required-note {
      font-size: 0.76rem;
      color: #64748b;
      margin-bottom: 20px;
    }

    .required {
      color: #dc2626;
      font-weight: bold;
    }

    /* FORM GRID LAYOUT */
    .form-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px 28px;
    }

    @media (max-width: 768px) {
      .form-grid {
        grid-template-columns: 1fr;
        gap: 16px;
      }
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .flex-checkbox-align {
      justify-content: center;
      margin-top: 14px;
    }

    label {
      font-size: 0.82rem;
      font-weight: 700;
      color: #2D5A27;
      text-transform: uppercase;
      letter-spacing: 0.02em;
    }

    /* CUSTOM INPUTS */
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

    select.form-control {
      cursor: pointer;
    }

    .field-error {
      display: block;
      color: #c2410c; /* Naranja/marrón cálido de marca */
      font-size: 0.75rem;
      font-weight: 600;
      margin-top: 2px;
    }

    /* PHONE INPUT WITH PREFIX */
    .phone-input-group {
      display: flex;
      align-items: stretch;
      border-radius: 8px;
      overflow: hidden;
      border: 1px solid #cbd5e1;
      background: rgba(248, 250, 252, 0.7);
      transition: all 0.25s ease;
    }

    .phone-input-group:focus-within {
      border-color: #2D5A27;
      box-shadow: 0 0 0 3px rgba(45, 90, 39, 0.12);
      background: white;
    }

    .phone-prefix {
      display: flex;
      align-items: center;
      padding: 0 14px;
      background: rgba(45, 90, 39, 0.05);
      border-right: 1px solid #cbd5e1;
      font-size: 0.88rem;
      color: #2D5A27;
      font-weight: 700;
      min-width: 44px;
      justify-content: center;
    }

    .phone-prefix.disabled {
      color: #94a3b8;
      background: #f8fafc;
    }

    .phone-input-group input {
      border: none !important;
      background: transparent !important;
      outline: none !important;
      box-shadow: none !important;
      flex: 1;
    }

    /* CUSTOM CHECKBOX */
    .checkbox-inline {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      font-size: 0.86rem;
      cursor: pointer;
      user-select: none;
      font-weight: 700;
      color: #1A211B;
    }

    .custom-checkbox-input {
      position: absolute;
      opacity: 0;
      cursor: pointer;
      height: 0;
      width: 0;
    }

    .custom-checkbox-box {
      width: 18px;
      height: 18px;
      background: white;
      border: 2px solid #cbd5e1;
      border-radius: 6px;
      display: inline-block;
      flex-shrink: 0;
      margin-top: 1px;
      position: relative;
      transition: all 0.2s ease;
    }

    .checkbox-inline:hover input ~ .custom-checkbox-box {
      border-color: #2D5A27;
    }

    .checkbox-inline input:checked ~ .custom-checkbox-box {
      background: #2D5A27;
      border-color: #2D5A27;
    }

    .custom-checkbox-box::after {
      content: "";
      position: absolute;
      display: none;
      left: 5px;
      top: 1px;
      width: 4px;
      height: 8px;
      border: solid white;
      border-width: 0 2px 2px 0;
      transform: rotate(45deg);
    }

    .checkbox-inline input:checked ~ .custom-checkbox-box::after {
      display: block;
    }

    .label-text-checkbox {
      line-height: 1.3;
    }

    /* FORM ACTIONS */
    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-top: 24px;
      padding-top: 16px;
      border-top: 1px solid rgba(45, 90, 39, 0.08);
    }

    .btn-cancel {
      padding: 10px 24px;
      background: white;
      color: #8B5A2B;
      border: 1px solid #8B5A2B;
      border-radius: 8px;
      font-weight: 700;
      font-size: 0.85rem;
      cursor: pointer;
      transition: all 0.25s ease;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .btn-cancel:hover {
      background: rgba(139, 90, 43, 0.08);
    }

    .btn-save {
      padding: 10px 28px;
      background: linear-gradient(135deg, #2D5A27 0%, #1A211B 100%);
      color: white;
      border: 1px solid rgba(212, 168, 67, 0.15);
      border-radius: 8px;
      font-weight: 700;
      font-size: 0.85rem;
      cursor: pointer;
      transition: all 0.25s ease;
      box-shadow: 0 4px 10px rgba(45, 90, 39, 0.15);
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .btn-save:hover:not(:disabled) {
      background: linear-gradient(135deg, #4E8D46 0%, #2D5A27 100%);
      transform: translateY(-1px);
    }

    .btn-save:disabled {
      background: #cbd5e1;
      color: #94a3b8;
      border-color: #cbd5e1;
      cursor: not-allowed;
      box-shadow: none;
    }

    /* SEARCH BAR CARD */
    .search-card {
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
      border-color: #2D5A27;
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
    
    .table {
      width: 100%;
      border-collapse: collapse;
    }
    
    .table th, .table td {
      padding: 12px 14px;
      text-align: left;
      font-size: 0.86rem;
      border-bottom: 1px solid rgba(45, 90, 39, 0.05);
    }
    
    .table th {
      background: rgba(248, 250, 252, 0.8);
      color: #2D5A27;
      font-weight: 800;
      font-size: 0.76rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      white-space: nowrap;
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
      white-space: nowrap;
    }
    
    .codigo {
      font-family: 'Outfit', monospace;
      font-weight: 800;
      color: #2D5A27;
      font-size: 0.88rem;
      white-space: nowrap;
    }

    .stay-count {
      font-weight: 700;
      color: #8B5A2B; /* Marrón Madera */
      white-space: nowrap;
    }

    /* BADGES OF STATUS */
    .badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }
    
    .badge-activo {
      background: rgba(78, 141, 70, 0.08);
      color: #4E8D46;
      border: 1px solid rgba(78, 141, 70, 0.15);
    }
    
    .badge-suspendido {
      background: rgba(139, 90, 43, 0.08);
      color: #8B5A2B;
      border: 1px solid rgba(139, 90, 43, 0.15);
    }
    
    .badge-vetado {
      background: rgba(220, 38, 38, 0.08);
      color: #dc2626;
      border: 1px solid rgba(220, 38, 38, 0.15);
    }

    .empty {
      text-align: center;
      color: #64748b;
      padding: 40px;
      font-size: 0.9rem;
      font-weight: 600;
    }

    /* ACTION BUTTONS GROUP */
    .action-buttons-group {
      display: flex;
      gap: 8px;
      align-items: center;
      white-space: nowrap;
    }

    .btn-sm {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      padding: 0;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-size: 0.95rem;
      transition: all 0.2s ease;
    }

    .btn-edit {
      background: rgba(45, 90, 39, 0.08);
      color: #2D5A27;
      border: 1px solid rgba(45, 90, 39, 0.15);
    }
    
    .btn-edit:hover {
      background: #2D5A27;
      color: white;
    }

    .btn-suspender {
      background: rgba(139, 90, 43, 0.08);
      color: #8B5A2B;
      border: 1px solid rgba(139, 90, 43, 0.15);
    }
    
    .btn-suspender:hover {
      background: #8B5A2B;
      color: white;
    }

    .btn-reactivar {
      background: rgba(78, 141, 70, 0.08);
      color: #4E8D46;
      border: 1px solid rgba(78, 141, 70, 0.15);
    }
    
    .btn-reactivar:hover {
      background: #4E8D46;
      color: white;
    }

    .btn-vetar {
      background: rgba(220, 38, 38, 0.08);
      color: #dc2626;
      border: 1px solid rgba(220, 38, 38, 0.15);
    }
    
    .btn-vetar:hover {
      background: #dc2626;
      color: white;
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
    }

    .pag-btn.active {
      background: #2D5A27;
      border-color: #2D5A27;
      color: white;
    }

    /* ANIMATIONS */
    .fade-in {
      animation: fadeIn 0.4s ease-out forwards;
    }

    .animate-in {
      animation: slideDown 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(8px); }
      to { opacity: 1; transform: translateY(0); }
    }

    @keyframes slideDown {
      from { opacity: 0; transform: translateY(-10px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class ClienteListComponent implements OnInit {
  clientes: ClienteResponse[] = [];
  clientesFiltrados: ClienteResponse[] = [];
  clientesPaginados: ClienteResponse[] = [];
  showForm = false;
  editandoId: string | null = null;
  searchTerm = '';
  clienteForm: FormGroup;
  paises = PAISES;
  paginaActual = 1;
  elementosPorPagina = 5;
  totalPaginas = 1;
  private documentoCheck$ = new Subject<void>();

  constructor(
    private service: ClienteService,
    public auth: AuthService,
    private fb: FormBuilder
  ) {
    this.clienteForm = this.fb.group({
      tipoDocumento: ['DNI', Validators.required],
      numeroDocumento: ['', [Validators.required, this.documentoValidator()]],
      nombres: ['', [Validators.required, Validators.pattern(/^[a-zA-ZáéíóúñÑü\s]{2,50}$/)]],
      apellidos: ['', [Validators.required, Validators.pattern(/^[a-zA-ZáéíóúñÑü\s]{2,50}$/)]],
      nacionalidad: ['', Validators.required],
      fechaNacimiento: ['', [this.ageValidator()]],
      telefono: ['', [Validators.required, phoneValidator(() => this.clienteForm?.get('nacionalidad')?.value)]],
      correoElectronico: ['', [Validators.email]],
      genero: ['', Validators.required],
      acompanadoPorAdulto: [false]
    });

    this.documentoCheck$.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      switchMap(() => {
        const tipoDoc = this.clienteForm.get('tipoDocumento')?.value;
        const numDoc = this.clienteForm.get('numeroDocumento')?.value;
        if (!tipoDoc || !numDoc || this.clienteForm.get('numeroDocumento')?.invalid) return of(null);
        return this.service.buscar(tipoDoc, numDoc).pipe(
          map(cliente => {
            if (this.editandoId && cliente.id === this.editandoId) return null;
            return { duplicate: true };
          }),
          catchError(() => of(null))
        );
      })
    ).subscribe(dupError => this.setDuplicateError(dupError));

    this.clienteForm.get('numeroDocumento')?.valueChanges.subscribe(() => {
      this.documentoCheck$.next();
    });

    this.clienteForm.get('tipoDocumento')?.valueChanges.subscribe(() => {
      this.clienteForm.get('numeroDocumento')?.updateValueAndValidity();
      this.documentoCheck$.next();
    });

    this.clienteForm.get('acompanadoPorAdulto')?.valueChanges.subscribe(() => {
      this.clienteForm.get('fechaNacimiento')?.updateValueAndValidity({ emitEvent: false });
    });

    this.clienteForm.get('nacionalidad')?.valueChanges.subscribe(() => {
      this.clienteForm.get('telefono')?.updateValueAndValidity();
      this.clienteForm.get('telefono')?.reset();
    });
  }

  ngOnInit(): void {
    this.cargar();
  }

  get esMenorEdad(): boolean {
    const fn = this.clienteForm.get('fechaNacimiento')?.value;
    if (!fn) return false;
    const birth = new Date(fn);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const mDiff = today.getMonth() - birth.getMonth();
    if (mDiff < 0 || (mDiff === 0 && today.getDate() < birth.getDate())) age--;
    return age < 18;
  }

  documentoValidator() {
    return (control: AbstractControl): ValidationErrors | null => {
      const tipoDoc = this.clienteForm?.get('tipoDocumento')?.value;
      const value = control.value;
      if (!value) return { required: true };
      switch (tipoDoc) {
        case 'DNI': return /^[0-9]{8}$/.test(value) ? null : { pattern: true };
        case 'Pasaporte': return /^[A-Za-z0-9]{7,18}$/.test(value) ? null : { pattern: true };
        case 'Carné Extranjería': return /^[A-Za-z0-9]{9,12}$/.test(value) ? null : { pattern: true };
        default: return null;
      }
    };
  }

  ageValidator() {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      const birth = new Date(control.value);
      if (birth > new Date()) return { futureDate: true };
      let age = new Date().getFullYear() - birth.getFullYear();
      const mDiff = new Date().getMonth() - birth.getMonth();
      if (mDiff < 0 || (mDiff === 0 && new Date().getDate() < birth.getDate())) age--;
      if (age < 18) {
        const acompanado = this.clienteForm?.get('acompanadoPorAdulto')?.value;
        return acompanado ? null : { underage: true };
      }
      return null;
    };
  }

  get codigoPais(): string {
    const nac = this.clienteForm?.get('nacionalidad')?.value;
    return infoPorNacionalidad(nac)?.codigo || '';
  }

  private setDuplicateError(err: ValidationErrors | null): void {
    const ctrl = this.clienteForm.get('numeroDocumento');
    if (!ctrl) return;
    const current = ctrl.errors || {};
    if (err) {
      ctrl.setErrors({ ...current, ...err }, { emitEvent: false });
    } else if (current['duplicate']) {
      const { duplicate, ...rest } = current;
      ctrl.setErrors(Object.keys(rest).length ? rest : null, { emitEvent: false });
    }
  }

  getDocError(): string {
    const ctrl = this.clienteForm.get('numeroDocumento');
    if (ctrl?.errors?.['required']) return 'N° documento es obligatorio';
    if (ctrl?.errors?.['duplicate']) return 'Este documento ya está registrado';
    if (ctrl?.errors?.['pattern']) {
      const tipo = this.clienteForm.get('tipoDocumento')?.value;
      if (tipo === 'DNI') return 'DNI debe tener 8 dígitos';
      if (tipo === 'Pasaporte') return 'Pasaporte debe tener 7-18 caracteres alfanuméricos';
      if (tipo === 'Carné Extranjería') return 'Carné de Extranjería debe tener 9-12 caracteres alfanuméricos';
      return 'Formato de documento inválido';
    }
    return '';
  }

  getTelefonoError(): string {
    const ctrl = this.clienteForm.get('telefono');
    if (ctrl?.errors?.['required']) return 'Teléfono es obligatorio';
    if (ctrl?.errors?.['invalidPhone']) return `Número inválido para la nacionalidad seleccionada`;
    return '';
  }

  getCorreoElectronicoError(): string {
    const ctrl = this.clienteForm.get('correoElectronico');
    if (ctrl?.errors?.['email']) return 'Correo electrónico inválido';
    return '';
  }

  private cargar(): void {
    this.service.getAll().subscribe({
      next: (data) => {
        this.clientes = data;
        this.filtrar();
      },
      error: (err) => alert('Error al cargar clientes: ' + err.message)
    });
  }

  filtrar(): void {
    const term = this.searchTerm.toLowerCase().trim();
    this.clientesFiltrados = this.clientes.filter(c =>
      !term ||
      c.nombres.toLowerCase().includes(term) ||
      c.apellidos.toLowerCase().includes(term) ||
      c.numeroDocumento.includes(term) ||
      c.nacionalidad.toLowerCase().includes(term)
    );
    this.paginaActual = 1;
    this.actualizarPaginacion();
  }

  actualizarPaginacion(): void {
    const total = this.clientesFiltrados.length;
    this.totalPaginas = Math.ceil(total / this.elementosPorPagina);
    if (this.paginaActual > this.totalPaginas) {
      this.paginaActual = Math.max(1, this.totalPaginas);
    }
    const inicio = (this.paginaActual - 1) * this.elementosPorPagina;
    const fin = inicio + this.elementosPorPagina;
    this.clientesPaginados = this.clientesFiltrados.slice(inicio, fin);
  }

  cambiarPagina(pagina: number): void {
    if (pagina >= 1 && pagina <= this.totalPaginas) {
      this.paginaActual = pagina;
      this.actualizarPaginacion();
    }
  }

  onPageSizeChange(): void {
    this.paginaActual = 1;
    this.actualizarPaginacion();
  }

  getRangoInicio(): number {
    if (this.clientesFiltrados.length === 0) return 0;
    return (this.paginaActual - 1) * this.elementosPorPagina + 1;
  }

  getRangoFin(): number {
    const fin = this.paginaActual * this.elementosPorPagina;
    return Math.min(fin, this.clientesFiltrados.length);
  }

  getPaginasArray(): number[] {
    const arr = [];
    for (let i = 1; i <= this.totalPaginas; i++) {
      arr.push(i);
    }
    return arr;
  }

  private buildRequest(): ClienteRequest {
    const telefonoRaw = this.clienteForm.get('telefono')?.value || '';
    const nac = this.clienteForm.get('nacionalidad')?.value;
    const info = infoPorNacionalidad(nac);
    const telefono = info ? `${info.codigo}${telefonoRaw}` : telefonoRaw;
    return {
      tipoDocumento: this.clienteForm.get('tipoDocumento')?.value,
      numeroDocumento: this.clienteForm.get('numeroDocumento')?.value,
      nombres: this.clienteForm.get('nombres')?.value,
      apellidos: this.clienteForm.get('apellidos')?.value,
      nacionalidad: this.clienteForm.get('nacionalidad')?.value,
      genero: this.clienteForm.get('genero')?.value,
      telefono,
      correoElectronico: this.clienteForm.get('correoElectronico')?.value || null,
      fechaNacimiento: this.clienteForm.get('fechaNacimiento')?.value || null
    };
  }

  onCreate(): void {
    if (this.clienteForm.invalid) return;
    this.service.create(this.buildRequest()).subscribe({
      next: () => {
        this.cargar();
        this.resetForm();
      },
      error: (err) => alert('Error al crear cliente: ' + err.message)
    });
  }

  editar(c: ClienteResponse): void {
    this.editandoId = c.id;
    const info = infoPorNacionalidad(c.nacionalidad);
    const telefonoLocal = info && c.telefono?.startsWith(info.codigo)
      ? c.telefono.slice(info.codigo.length) : c.telefono;
    this.clienteForm.patchValue({
      tipoDocumento: c.tipoDocumento,
      numeroDocumento: c.numeroDocumento,
      nombres: c.nombres,
      apellidos: c.apellidos,
      nacionalidad: c.nacionalidad,
      genero: c.genero,
      telefono: telefonoLocal,
      correoElectronico: c.correoElectronico || '',
      fechaNacimiento: c.fechaNacimiento ? c.fechaNacimiento.substring(0, 10) : '',
      acompanadoPorAdulto: false
    }, { emitEvent: false });
    this.setDuplicateError(null);
    this.clienteForm.get('numeroDocumento')?.updateValueAndValidity();
    this.clienteForm.get('fechaNacimiento')?.updateValueAndValidity();
    this.showForm = true;
  }

  onUpdate(): void {
    if (!this.editandoId || this.clienteForm.invalid) return;
    this.service.update(this.editandoId, this.buildRequest()).subscribe({
      next: () => {
        this.cargar();
        this.resetForm();
      },
      error: (err) => alert('Error al actualizar cliente: ' + err.message)
    });
  }

  cambiarEstado(c: ClienteResponse, nuevoEstado: string): void {
    const msg = nuevoEstado === 'ACTIVO' ? `¿Reactivar a ${c.nombres} ${c.apellidos}?`
      : nuevoEstado === 'SUSPENDIDO' ? `¿Suspender a ${c.nombres} ${c.apellidos}?`
        : `¿Vetar a ${c.nombres} ${c.apellidos}?`;
    if (!confirm(msg)) return;
    this.service.cambiarEstado(c.id, nuevoEstado).subscribe({
      next: (actualizado) => {
        const idx = this.clientes.findIndex(x => x.id === c.id);
        if (idx !== -1) this.clientes[idx] = actualizado;
        this.filtrar();
      },
      error: (err) => alert('Error al cambiar estado: ' + err.message)
    });
  }

  toggleForm(): void {
    this.showForm = !this.showForm;
    if (this.showForm) {
      this.editandoId = null;
      this.clienteForm.reset({ tipoDocumento: 'DNI', acompanadoPorAdulto: false });
    }
  }

  resetForm(): void {
    this.showForm = false;
    this.editandoId = null;
    this.clienteForm.reset({ tipoDocumento: 'DNI', acompanadoPorAdulto: false });
  }
}
