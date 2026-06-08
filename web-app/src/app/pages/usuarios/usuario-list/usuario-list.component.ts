import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UsuarioService } from '../../../core/services/usuario.service';
import { RolService } from '../../../core/services/rol.service';
import { AuthService } from '../../../core/services/auth.service';
import { UsuarioResponse, UsuarioRequest, UsuarioUpdateRequest } from '../../../core/models/usuario';
import { RolResponse } from '../../../core/models/rol';

@Component({
  selector: 'app-usuario-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-container fade-in">
      <!-- CABECERA BANNER -->
      <div class="header-section">
        <div class="title-area">
          <h2><i class="header-icon-premium bi bi-shield-lock-fill"></i> Control de Usuarios</h2>
          <p class="subtitle">Gestione el personal administrativo, recepcionistas y gerentes con acceso al PMS</p>
        </div>
        <button *ngIf="auth.esGerente()" class="btn-new" (click)="showForm = !showForm">
          <i class="bi" [class.bi-x-lg]="showForm" [class.bi-plus-lg]="!showForm"></i>
          {{ showForm ? ' Cancelar Registro' : ' Nuevo Usuario' }}
        </button>
      </div>

      <!-- FORMULARIO GLASS CARD -->
      <div class="card glass-panel animate-in" *ngIf="showForm && auth.esGerente()">
        <div class="card-body">
          <h3 class="form-title"><i class="bi bi-person-lines-fill mr-2 text-dorado-amazonico"></i> Registrar Nuevo Usuario</h3>
          <p class="required-note">Complete la información de credenciales y datos personales del empleado.</p>
          
          <form (ngSubmit)="onCreate()" class="form">
            <div class="form-grid">
              <div class="form-group">
                <label>Nombre de Usuario <span class="required">*</span></label>
                <input type="text" [(ngModel)]="newUser.nombreUsuario" name="uname" class="form-control" placeholder="Ej: jcervera" required />
              </div>
              <div class="form-group">
                <label>Email Corporativo <span class="required">*</span></label>
                <input type="email" [(ngModel)]="newUser.correoElectronico" name="email" class="form-control" placeholder="empleado@hotelcervera.com" required />
              </div>
              <div class="form-group">
                <label>Contraseña Acceso <span class="required">*</span></label>
                <input type="password" [(ngModel)]="newUser.contrasena" name="pass" class="form-control" placeholder="Mínimo 6 caracteres..." required minlength="6" />
              </div>
              <div class="form-group">
                <label>Rol Asignado <span class="required">*</span></label>
                <select [(ngModel)]="newUser.rolId" name="rol" class="form-control" required>
                  <option value="">Seleccione rol...</option>
                  <option *ngFor="let r of roles" [value]="r.id">{{ r.nombre }}</option>
                </select>
              </div>
              <div class="form-group">
                <label>Nombres <span class="required">*</span></label>
                <input type="text" [(ngModel)]="newUser.nombres" name="nombres" class="form-control" placeholder="Ej: Jordy Samir" required />
              </div>
              <div class="form-group">
                <label>Apellidos <span class="required">*</span></label>
                <input type="text" [(ngModel)]="newUser.apellidos" name="apellidos" class="form-control" placeholder="Ej: Cervera" required />
              </div>
            </div>
            
            <div class="form-actions">
              <button type="submit" class="btn-save">
                <i class="bi bi-save2-fill mr-1"></i> Guardar Ficha de Acceso
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- TABLA DE CONTROL -->
      <div class="table-card glass-panel">
        <div class="table-header-title">
          <h3><i class="bi bi-people-fill text-verde-selva mr-1"></i> Personal Registrado</h3>
          <span class="results-badge">{{ usuarios.length }} usuarios en el sistema</span>
        </div>
        <div class="table-responsive">
          <table class="table">
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Nombres y Apellidos</th>
                <th>Email Corporativo</th>
                <th>Rol</th>
                <th>Estado</th>
                <th>Último Acceso</th>
                <th *ngIf="auth.esGerente()">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let u of usuariosPaginados" class="table-row-hover">
                <td class="codigo"><i class="bi bi-key-fill text-dorado-amazonico mr-1"></i> {{ u.nombreUsuario }}</td>
                <td class="bold-text">{{ u.nombres }} {{ u.apellidos }}</td>
                <td>{{ u.correoElectronico }}</td>
                <td>
                  <span class="role-badge" [ngClass]="getRoleClass(u.rolNombre)">
                    {{ u.rolNombre }}
                  </span>
                </td>
                <td>
                  <span class="status-badge" [class.activo]="u.estado.toLowerCase() === 'activo' || !u.estado">
                    {{ u.estado || 'ACTIVO' }}
                  </span>
                </td>
                <td class="access-date">{{ (u.ultimoAcceso | date:'dd/MM/yyyy HH:mm') || 'Sin accesos registrados' }}</td>
                <td *ngIf="auth.esGerente()">
                  <button class="btn-edit" (click)="abrirEditar(u)">
                    <i class="bi bi-pencil-square mr-1"></i> Editar
                  </button>
                </td>
              </tr>
              <tr *ngIf="usuarios.length === 0">
                <td colspan="7" class="empty"><i class="bi bi-info-circle-fill text-slate-400 mr-2"></i> No hay usuarios registrados en el sistema</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- PAGINACIÓN PREMIUM CON CONTROLES DE MARCA -->
        <div class="paginator-container" *ngIf="usuarios.length > 0">
          <div class="paginator-info">
            Mostrando <b>{{ getRangoInicio() }} - {{ getRangoFin() }}</b> de <b>{{ usuarios.length }}</b> registros
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

      <!-- MODAL DE EDICIÓN - SOLO GERENTE (ALINEACIÓN CROMÁTICA LUXURY Y SEGURIDAD) -->
      <div class="modal-backdrop" *ngIf="mostrarModal && auth.esGerente()">
        <div class="modal-content animate-in">
          <div class="modal-header">
            <h3><i class="bi bi-pencil-square mr-1 text-dorado-amazonico"></i> Editar Usuario - {{ usuarioSeleccionado?.nombreUsuario }}</h3>
            <button class="close-btn" (click)="cerrarModal()"><i class="bi bi-x-lg"></i></button>
          </div>
          
          <form (ngSubmit)="guardarCambios()" class="modal-form">
            <div class="modal-body">
              
              <!-- NOMBRES -->
              <div class="form-group">
                <label><i class="bi bi-person mr-1"></i> Nombres *</label>
                <input 
                  type="text" 
                  [(ngModel)]="updateForm.nombres" 
                  name="editNombres" 
                  required 
                  class="form-control"
                  placeholder="Ej: Jordy Samir"
                />
              </div>

              <!-- APELLIDOS -->
              <div class="form-group">
                <label><i class="bi bi-person mr-1"></i> Apellidos *</label>
                <input 
                  type="text" 
                  [(ngModel)]="updateForm.apellidos" 
                  name="editApellidos" 
                  required 
                  class="form-control"
                  placeholder="Ej: Cervera"
                />
              </div>

              <!-- CORREO ELECTRÓNICO -->
              <div class="form-group">
                <label><i class="bi bi-envelope mr-1"></i> Correo Electrónico *</label>
                <input 
                  type="email" 
                  [(ngModel)]="updateForm.correoElectronico" 
                  name="editEmail" 
                  required 
                  class="form-control"
                  placeholder="empleado@hotelcervera.com"
                />
              </div>

              <!-- ESTADO -->
              <div class="form-group">
                <label><i class="bi bi-info-circle mr-1"></i> Estado del Acceso *</label>
                <select 
                  [(ngModel)]="updateForm.estado" 
                  name="editEstado" 
                  required 
                  class="form-control"
                  [disabled]="usuarioSeleccionado?.id === auth.getUsuario()?.id"
                >
                  <option value="activo">Activo</option>
                  <option value="suspendido">Suspendido</option>
                </select>
                <p class="form-help" style="color: #b45309;" *ngIf="usuarioSeleccionado?.id === auth.getUsuario()?.id">
                  <i class="bi bi-exclamation-triangle-fill"></i> Por razones de seguridad, no puedes suspender tu propio usuario administrador.
                </p>
              </div>

            </div>

            <div class="modal-footer">
              <button type="button" class="btn-cancel" (click)="cerrarModal()">Cancelar</button>
              <button type="submit" class="btn-save" [disabled]="guardando">
                <i class="bi" [class.bi-hourglass-split]="guardando" [class.bi-check-lg]="!guardando"></i>
                {{ guardando ? ' Guardando...' : ' Guardar Cambios' }}
              </button>
            </div>
          </form>
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

    .btn-new {
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

    .btn-new:hover {
      background: linear-gradient(135deg, #2D5A27 0%, #1A211B 100%);
      transform: translateY(-1px);
    }

    /* CARD GLASSMORPHIC */
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

    label {
      font-size: 0.82rem;
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

    /* FORM ACTIONS */
    .form-actions {
      display: flex;
      justify-content: flex-end;
      margin-top: 24px;
      padding-top: 16px;
      border-top: 1px solid rgba(45, 90, 39, 0.08);
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
    }

    .btn-save:hover {
      background: linear-gradient(135deg, #4E8D46 0%, #2D5A27 100%);
      transform: translateY(-1px);
    }

    /* BOUTIQUE TABLE */
    .table-card {
      border-radius: 16px;
      overflow: hidden;
      margin-bottom: 24px;
    }

    .table-header-title {
      padding: 20px 24px;
      border-bottom: 1px solid rgba(45, 90, 39, 0.08);
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #ffffff;
    }

    .table-header-title h3 {
      margin: 0;
      font-size: 1.1rem;
      font-weight: 800;
      color: #1A211B;
    }

    .results-badge {
      font-size: 0.75rem;
      background: rgba(78, 141, 70, 0.08);
      color: #2D5A27;
      padding: 4px 10px;
      border-radius: 20px;
      font-weight: 700;
    }
    
    .table-responsive {
      width: 100%;
      overflow-x: auto;
    }
    
    .table {
      width: 100%;
      border-collapse: collapse;
      background: white;
    }
    
    .table th, .table td {
      padding: 16px 20px;
      text-align: left;
      font-size: 0.88rem;
      border-bottom: 1px solid rgba(45, 90, 39, 0.05);
      vertical-align: middle;
    }
    
    .table th {
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
    
    .bold-text {
      font-weight: 700;
      color: #1A211B;
    }
    
    .codigo {
      font-family: 'Outfit', monospace;
      font-weight: 800;
      color: #2D5A27;
      font-size: 0.88rem;
    }
    
    .text-dorado-amazonico {
      color: #d4a843;
    }
    
    .text-verde-selva {
      color: #2D5A27;
    }

    .access-date {
      color: #64748b;
      font-size: 0.8rem;
      font-weight: 500;
    }

    /* BADGES OF ROLE */
    .role-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 0.74rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.02em;
    }

    .role-badge.role-gerente {
      background: rgba(212, 168, 67, 0.08);
      color: #8B5A2B;
      border: 1px solid rgba(212, 168, 67, 0.2);
    }

    .role-badge.role-admin {
      background: rgba(45, 90, 39, 0.08);
      color: #2D5A27;
      border: 1px solid rgba(45, 90, 39, 0.15);
    }

    .role-badge.role-recepcionista {
      background: rgba(139, 90, 43, 0.08);
      color: #8B5A2B;
      border: 1px solid rgba(139, 90, 43, 0.15);
    }

    .role-badge.role-asistente {
      background: rgba(217, 119, 6, 0.08);
      color: #b45309;
      border: 1px solid rgba(217, 119, 6, 0.15);
    }

    .role-badge.role-default {
      background: rgba(100, 116, 139, 0.08);
      color: #475569;
      border: 1px solid rgba(100, 116, 139, 0.15);
    }

    /* STATUS BADGE */
    .status-badge {
      display: inline-block;
      padding: 2px 10px;
      border-radius: 8px;
      font-size: 0.72rem;
      font-weight: 700;
      background: #f1f5f9;
      color: #64748b;
      border: 1px solid #e2e8f0;
    }

    .status-badge.activo {
      background: rgba(78, 141, 70, 0.08);
      color: #4E8D46;
      border-color: rgba(78, 141, 70, 0.15);
    }

    .empty {
      text-align: center;
      color: #64748b;
      padding: 40px;
      font-size: 0.9rem;
      font-weight: 600;
    }

    /* ACCIONES DE TABLA */
    .btn-edit {
      padding: 6px 14px;
      background: white;
      border: 1px solid rgba(45, 90, 39, 0.25);
      border-radius: 6px;
      color: #2D5A27;
      font-weight: 700;
      font-size: 0.8rem;
      cursor: pointer;
      transition: all 0.2s ease;
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }

    .btn-edit:hover {
      background: rgba(45, 90, 39, 0.05);
      border-color: #2D5A27;
    }

    /* MODAL DE EDICIÓN - GLASSMORPHISM RESPONSIVE SIN SCROLLBARS MOLESTOS */
    .modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(15, 23, 42, 0.4);
      backdrop-filter: blur(8px);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
      padding: 16px;
      box-sizing: border-box;
    }

    .modal-content {
      background: white;
      border-radius: 18px;
      width: 100%;
      max-width: 500px;
      max-height: 90vh;
      box-shadow: 0 20px 50px rgba(15, 23, 42, 0.15);
      border: 1px solid rgba(45, 90, 39, 0.08);
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .modal-header {
      padding: 20px 28px;
      background: linear-gradient(135deg, #1A211B 0%, #2D5A27 100%);
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid rgba(212, 168, 67, 0.15);
      flex-shrink: 0;
    }

    .modal-header h3 {
      margin: 0;
      font-size: 1.15rem;
      color: #ffffff;
      font-weight: 800;
      text-shadow: 0 1px 2px rgba(0,0,0,0.15);
    }

    .close-btn {
      background: none;
      border: none;
      color: rgba(255, 255, 255, 0.8);
      font-size: 1.25rem;
      cursor: pointer;
      padding: 4px;
      transition: color 0.2s ease;
    }

    .close-btn:hover {
      color: #ffffff;
    }

    .modal-body {
      padding: 24px 28px;
      display: flex;
      flex-direction: column;
      gap: 16px;
      overflow-y: auto;
      flex: 1;
      box-sizing: border-box;
    }

    .modal-footer {
      padding: 16px 28px;
      border-top: 1px solid rgba(45, 90, 39, 0.08);
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      background: #f8fafc;
      flex-shrink: 0;
    }

    .btn-cancel {
      padding: 10px 22px;
      background: white;
      border: 1px solid rgba(139, 90, 43, 0.35);
      border-radius: 10px;
      color: #8B5A2B;
      font-weight: 700;
      font-size: 0.85rem;
      cursor: pointer;
      transition: all 0.25s ease;
    }

    .btn-cancel:hover {
      background: rgba(139, 90, 43, 0.06);
      border-color: #8B5A2B;
    }

    .text-dorado-amazonico {
      color: #d4a843;
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
export class UsuarioListComponent implements OnInit {
  usuarios: UsuarioResponse[] = [];
  usuariosPaginados: UsuarioResponse[] = [];
  roles: RolResponse[] = [];
  showForm = false;

  newUser: UsuarioRequest = {
    nombreUsuario: '', correoElectronico: '', contrasena: '', nombres: '', apellidos: '', rolId: ''
  };

  mostrarModal = false;
  guardando = false;
  usuarioSeleccionado: UsuarioResponse | null = null;
  updateForm: UsuarioUpdateRequest = {
    nombres: '', apellidos: '', correoElectronico: '', estado: 'activo'
  };

  // Paginación
  elementosPorPagina: number = 10;
  paginaActual: number = 1;
  totalPaginas: number = 1;

  constructor(
    private service: UsuarioService,
    private rolService: RolService,
    public auth: AuthService
  ) {}

  ngOnInit(): void {
    this.cargarUsuarios();
    this.rolService.getAll().subscribe({ next: (data) => this.roles = data });
  }

  cargarUsuarios(): void {
    this.service.getAll().subscribe({ next: (data) => {
      this.usuarios = data;
      this.paginaActual = 1;
      this.actualizarPaginacion();
    }});
  }

  getRoleClass(rolNombre: string): string {
    if (!rolNombre) return 'role-default';
    const nombre = rolNombre.toLowerCase();
    if (nombre.includes('gerente')) return 'role-gerente';
    if (nombre.includes('admin')) return 'role-admin';
    if (nombre.includes('recepcion')) return 'role-recepcionista';
    if (nombre.includes('asistente') || nombre.includes('limpieza')) return 'role-asistente';
    return 'role-default';
  }

  onCreate(): void {
    this.service.create(this.newUser).subscribe({
      next: () => {
        this.showForm = false;
        this.newUser = {
          nombreUsuario: '', correoElectronico: '', contrasena: '', nombres: '', apellidos: '', rolId: ''
        };
        this.cargarUsuarios();
      },
      error: () => alert('Error al crear usuario')
    });
  }

  abrirEditar(u: UsuarioResponse): void {
    this.usuarioSeleccionado = u;
    this.updateForm = {
      nombres: u.nombres,
      apellidos: u.apellidos,
      correoElectronico: u.correoElectronico,
      estado: u.estado?.toLowerCase() || 'activo'
    };
    this.guardando = false;
    this.mostrarModal = true;
  }

  cerrarModal(): void {
    this.mostrarModal = false;
    this.usuarioSeleccionado = null;
    this.updateForm = { nombres: '', apellidos: '', correoElectronico: '', estado: 'activo' };
  }

  guardarCambios(): void {
    if (!this.usuarioSeleccionado) return;
    this.guardando = true;

    this.service.update(this.usuarioSeleccionado.id, this.updateForm).subscribe({
      next: () => {
        alert('Usuario actualizado con éxito.');
        this.guardando = false;
        this.cerrarModal();
        this.cargarUsuarios();
      },
      error: (err) => {
        alert(err.error?.message || 'Ocurrió un error al actualizar el usuario.');
        this.guardando = false;
      }
    });
  }

  // MÉTODOS DE PAGINACIÓN
  actualizarPaginacion(): void {
    this.totalPaginas = Math.ceil(this.usuarios.length / this.elementosPorPagina) || 1;
    if (this.paginaActual > this.totalPaginas) {
      this.paginaActual = this.totalPaginas;
    }
    
    const inicio = (this.paginaActual - 1) * this.elementosPorPagina;
    const fin = inicio + parseInt(this.elementosPorPagina.toString());
    
    this.usuariosPaginados = this.usuarios.slice(inicio, fin);
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
    if (this.usuarios.length === 0) return 0;
    return (this.paginaActual - 1) * this.elementosPorPagina + 1;
  }

  getRangoFin(): number {
    return Math.min(this.paginaActual * this.elementosPorPagina, this.usuarios.length);
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
}
