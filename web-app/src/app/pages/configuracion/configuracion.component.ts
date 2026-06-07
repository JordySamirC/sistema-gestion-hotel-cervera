import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule, Location } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { UsuarioService } from '../../core/services/usuario.service';
import { LoginResponse } from '../../core/models/usuario';

@Component({
  selector: 'app-configuracion',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="config-container fade-in">
      <!-- Barra superior con botón regresar -->
      <div class="top-nav-bar">
        <button class="btn-back" (click)="regresar()">
          <i class="bi bi-arrow-left"></i> Regresar
        </button>
      </div>

      <!-- Tarjeta Principal de Perfil Resumen -->
      <div class="profile-header-card">
        <div class="profile-avatar-wrapper">
          <div class="avatar-glow"></div>
          <div class="profile-avatar">
            {{ getInitials(usuario?.nombres, usuario?.apellidos) }}
          </div>
        </div>
        <div class="profile-info-main">
          <h1>{{ usuario?.nombres }} {{ usuario?.apellidos }}</h1>
          <div class="role-tag-container">
            <span class="role-badge">{{ usuario?.rol }}</span>
          </div>
          <p class="email-subtext"><i class="bi bi-envelope-fill"></i> {{ usuario?.correoElectronico }}</p>
        </div>
      </div>

      <div class="config-grid">
        <!-- Tarjeta de Detalles de Cuenta -->
        <div class="config-card">
          <div class="card-header">
            <i class="bi bi-person-lines-fill icon-accent"></i>
            <h2>Detalles de la Cuenta</h2>
          </div>
          <div class="profile-grid">
            <div class="field">
              <label>Nombres</label>
              <span>{{ usuario?.nombres }}</span>
            </div>
            <div class="field">
              <label>Apellidos</label>
              <span>{{ usuario?.apellidos }}</span>
            </div>
            <div class="field">
              <label>Email Corporativo</label>
              <span>{{ usuario?.correoElectronico }}</span>
            </div>
            <div class="field">
              <label>Nombre de Usuario</label>
              <span>{{ usuario?.nombreUsuario }}</span>
            </div>
            <div class="field full-width">
              <label>Rol Asignado</label>
              <div class="role-badge-large">{{ usuario?.rol }}</div>
            </div>
          </div>
        </div>

        <!-- Tarjeta de Seguridad (Cambio de Contraseña) -->
        <div class="config-card">
          <div class="card-header">
            <i class="bi bi-shield-lock-fill icon-accent"></i>
            <h2>Seguridad de la Cuenta</h2>
          </div>
          
          <form #passwordForm="ngForm" (ngSubmit)="cambiarPassword()" class="password-form">
            <p class="security-intro">Actualice su contraseña periódicamente para mantener la integridad de sus accesos.</p>
            
            <div class="form-group">
              <label for="actual"><i class="bi bi-key"></i> Contraseña Actual</label>
              <input 
                id="actual" 
                name="actual" 
                type="password" 
                [(ngModel)]="contrasenaActual" 
                placeholder="Ingrese su contraseña actual"
                required
              >
            </div>
            
            <div class="form-group">
              <label for="nueva"><i class="bi bi-shield-plus"></i> Nueva Contraseña</label>
              <input 
                id="nueva" 
                name="nueva" 
                type="password" 
                [(ngModel)]="nuevaContrasena" 
                placeholder="Mínimo 6 caracteres"
                required 
                minlength="6" 
                #nueva="ngModel"
              >
              <small *ngIf="nueva.invalid && nueva.touched" class="error-text">
                <i class="bi bi-exclamation-triangle-fill"></i> La contraseña debe tener al menos 6 caracteres.
              </small>
            </div>
            
            <div class="form-group">
              <label for="confirmar"><i class="bi bi-shield-check"></i> Confirmar Nueva Contraseña</label>
              <input 
                id="confirmar" 
                name="confirmar" 
                type="password" 
                [(ngModel)]="confirmarContrasena" 
                placeholder="Repita la nueva contraseña"
                required 
                (input)="mensaje = ''"
              >
              <small *ngIf="confirmarContrasena && contrasenasNoCoinciden()" class="error-text">
                <i class="bi bi-exclamation-triangle-fill"></i> Las contraseñas no coinciden.
              </small>
            </div>

            <div class="form-actions">
              <button 
                type="submit" 
                class="btn-submit" 
                [disabled]="passwordForm.invalid || contrasenasNoCoinciden() || loading"
              >
                <span *ngIf="!loading"><i class="bi bi-arrow-repeat"></i> Actualizar</span>
                <span *ngIf="loading" class="loading-spinner">
                  <span class="spinner"></span> Procesando...
                </span>
              </button>

              <button 
                type="button" 
                class="btn-cancel" 
                (click)="cancelarFormulario()"
                [disabled]="loading || (!contrasenaActual && !nuevaContrasena && !confirmarContrasena)"
              >
                <i class="bi bi-x-circle"></i> Cancelar
              </button>
            </div>

            <div 
              *ngIf="mensaje" 
              class="mensaje-alerta" 
              [class.success]="mensajeTipo === 'success'" 
              [class.error]="mensajeTipo === 'error'"
            >
              <i class="bi" [class.bi-check-circle-fill]="mensajeTipo === 'success'" [class.bi-exclamation-circle-fill]="mensajeTipo === 'error'"></i>
              <span>{{ mensaje }}</span>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .config-container {
      max-width: 1200px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: 28px;
      font-family: 'Outfit', 'Inter', sans-serif;
    }

    /* BARRA NAVEGACIÓN SUPERIOR */
    .top-nav-bar {
      display: flex;
      align-items: center;
      margin-bottom: 4px;
    }

    .btn-back {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: transparent;
      border: 1px solid rgba(45, 90, 39, 0.25);
      color: #2D5A27;
      padding: 8px 20px;
      border-radius: 30px;
      font-size: 0.88rem;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.25s ease;
    }

    .btn-back:hover {
      background: rgba(78, 141, 70, 0.08);
      border-color: #2D5A27;
      transform: translateX(-3px);
    }

    /* BANNER PRINCIPAL DE PERFIL */
    .profile-header-card {
      display: flex;
      align-items: center;
      gap: 32px;
      background: linear-gradient(135deg, #1A211B 0%, #2D5A27 100%);
      border: 1px solid rgba(212, 168, 67, 0.25);
      border-radius: 20px;
      padding: 32px;
      box-shadow: 0 10px 30px rgba(45, 90, 39, 0.15);
      position: relative;
      overflow: hidden;
      flex-wrap: wrap;
    }

    .profile-header-card::before {
      content: '';
      position: absolute;
      top: -50%;
      right: -10%;
      width: 400px;
      height: 400px;
      background: radial-gradient(circle, rgba(212, 168, 67, 0.08) 0%, transparent 70%);
      pointer-events: none;
    }

    .profile-avatar-wrapper {
      position: relative;
      flex-shrink: 0;
    }

    .avatar-glow {
      position: absolute;
      inset: -8px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(212, 168, 67, 0.4) 0%, transparent 75%);
      animation: pulseGlow 3s ease-in-out infinite;
    }

    @keyframes pulseGlow {
      0%, 100% { transform: scale(1); opacity: 0.6; }
      50% { transform: scale(1.15); opacity: 0.9; }
    }

    .profile-avatar {
      width: 100px;
      height: 100px;
      border-radius: 50%;
      background: linear-gradient(135deg, #4E8D46, #2D5A27);
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 2.2rem;
      font-weight: 800;
      border: 3.5px solid #D4A843;
      box-shadow: 0 6px 20px rgba(0,0,0,0.25);
      position: relative;
      z-index: 2;
    }

    .profile-info-main {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 6px;
      min-width: 250px;
    }

    .profile-info-main h1 {
      margin: 0;
      font-size: 2rem;
      font-weight: 800;
      color: #ffffff;
      letter-spacing: -0.02em;
    }

    .role-tag-container {
      display: flex;
      margin-bottom: 2px;
    }

    .role-badge {
      display: inline-flex;
      align-items: center;
      padding: 4px 14px;
      border-radius: 30px;
      font-size: 0.72rem;
      font-weight: 800;
      background: rgba(212, 168, 67, 0.15);
      color: #D4A843;
      border: 1px solid rgba(212, 168, 67, 0.35);
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }

    .email-subtext {
      margin: 2px 0 0;
      color: rgba(255, 255, 255, 0.75);
      font-size: 0.92rem;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .email-subtext i {
      color: #D4A843;
    }

    /* GRID CONTENIDO */
    .config-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 28px;
    }

    @media (max-width: 900px) {
      .config-grid {
        grid-template-columns: 1fr;
      }
      .profile-header-card {
        justify-content: center;
        text-align: center;
        padding: 24px;
      }
      .role-tag-container {
        justify-content: center;
      }
    }

    /* TARJETAS PREMIUM */
    .config-card {
      background: #ffffff;
      border-radius: 16px;
      padding: 28px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
      border: 1px solid rgba(45, 90, 39, 0.08);
      display: flex;
      flex-direction: column;
      gap: 24px;
      transition: transform 0.25s ease, box-shadow 0.25s ease;
    }

    .config-card:hover {
      box-shadow: 0 8px 30px rgba(45, 90, 39, 0.08);
    }

    .card-header {
      display: flex;
      align-items: center;
      gap: 12px;
      border-bottom: 1.5px solid rgba(45, 90, 39, 0.08);
      padding-bottom: 16px;
    }

    .icon-accent {
      font-size: 1.35rem;
      color: #2D5A27;
      display: inline-flex;
    }

    .card-header h2 {
      margin: 0;
      font-size: 1.15rem;
      font-weight: 800;
      color: #1A211B;
      letter-spacing: -0.01em;
    }

    /* DETALLES DE CUENTA */
    .profile-grid {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .field {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .field label {
      font-size: 0.72rem;
      color: #8B5A2B;
      text-transform: uppercase;
      font-weight: 700;
      letter-spacing: 0.06em;
    }

    .field span {
      font-size: 0.95rem;
      color: #334155;
      padding: 10px 14px;
      background: #FAF9F6;
      border: 1px solid rgba(139, 90, 43, 0.1);
      border-radius: 10px;
      font-weight: 500;
    }

    .role-badge-large {
      display: inline-flex;
      font-size: 0.82rem;
      font-weight: 800;
      color: #2D5A27;
      background: rgba(78, 141, 70, 0.08);
      border: 1px solid rgba(78, 141, 70, 0.18);
      border-radius: 10px;
      padding: 10px 14px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    /* FORMULARIO DE CAMBIO DE CONTRASEÑA */
    .password-form {
      display: flex;
      flex-direction: column;
      gap: 18px;
    }

    .security-intro {
      margin: 0;
      font-size: 0.85rem;
      color: #64748b;
      line-height: 1.5;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .form-group label {
      font-size: 0.82rem;
      color: #1A211B;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .form-group label i {
      color: #8B5A2B;
    }

    .form-group input {
      padding: 12px 14px;
      border: 1.5px solid rgba(45, 90, 39, 0.15);
      border-radius: 10px;
      font-size: 0.9rem;
      font-family: inherit;
      color: #1A211B;
      outline: none;
      background: #ffffff;
      transition: all 0.2s ease-in-out;
    }

    .form-group input:focus {
      border-color: #D4A843;
      box-shadow: 0 0 0 3px rgba(212, 168, 67, 0.15);
      background: #FAF9F6;
    }

    .error-text {
      color: #dc2626;
      font-size: 0.75rem;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 4px;
      margin-top: 2px;
    }

    /* ACCIONES DE FORMULARIO */
    .form-actions {
      display: flex;
      gap: 12px;
      align-items: center;
      margin-top: 6px;
      flex-wrap: wrap;
    }

    .btn-submit {
      padding: 12px 24px;
      background: linear-gradient(135deg, #D4A843 0%, #8B5A2B 100%);
      color: white;
      border: none;
      border-radius: 10px;
      cursor: pointer;
      font-size: 0.9rem;
      font-weight: 700;
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 4px 12px rgba(139, 90, 43, 0.25);
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }

    .btn-submit:disabled {
      background: #cbd5e1 !important;
      color: #94a3b8;
      cursor: not-allowed;
      box-shadow: none;
      transform: none !important;
    }

    .btn-submit:not(:disabled):hover {
      background: linear-gradient(135deg, #8B5A2B 0%, #1A211B 100%);
      transform: translateY(-2px);
      box-shadow: 0 6px 18px rgba(139, 90, 43, 0.35);
    }

    .btn-submit:not(:disabled):active {
      transform: translateY(0);
    }

    .btn-cancel {
      padding: 12px 24px;
      background: transparent;
      color: #8A817A;
      border: 1.5px solid rgba(138, 129, 122, 0.35);
      border-radius: 10px;
      cursor: pointer;
      font-size: 0.9rem;
      font-weight: 700;
      transition: all 0.25s ease;
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }

    .btn-cancel:hover:not(:disabled) {
      background: rgba(138, 129, 122, 0.08);
      border-color: #8A817A;
      color: #1C1A17;
    }

    .btn-cancel:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    /* MENSAJES Y ALERTAS */
    .mensaje-alerta {
      padding: 12px 16px;
      border-radius: 10px;
      font-size: 0.85rem;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 10px;
      margin-top: 8px;
      animation: slideInUp 0.25s ease-out;
    }

    @keyframes slideInUp {
      from { opacity: 0; transform: translateY(8px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .mensaje-alerta.success {
      background: rgba(78, 141, 70, 0.08);
      color: #2D5A27;
      border: 1px solid rgba(78, 141, 70, 0.22);
    }

    .mensaje-alerta.error {
      background: rgba(220, 38, 38, 0.06);
      color: #dc2626;
      border: 1px solid rgba(220, 38, 38, 0.16);
    }

    .loading-spinner {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .spinner {
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top-color: #ffffff;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      display: inline-block;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    /* Fade-in Animation */
    .fade-in {
      animation: fadeIn 0.4s ease-out forwards;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(8px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class ConfiguracionComponent {
  usuario: LoginResponse | null;
  contrasenaActual = '';
  nuevaContrasena = '';
  confirmarContrasena = '';
  mensaje = '';
  mensajeTipo = 'success';
  loading = false;

  constructor(
    private auth: AuthService,
    private usuarioService: UsuarioService,
    private location: Location
  ) {
    this.usuario = this.auth.getUsuario();
  }

  getInitials(nombres?: string, apellidos?: string): string {
    const n = nombres ? nombres.charAt(0) : '';
    const a = apellidos ? apellidos.charAt(0) : '';
    return (n + a).toUpperCase() || 'U';
  }

  contrasenasNoCoinciden(): boolean {
    return !!this.confirmarContrasena && this.nuevaContrasena !== this.confirmarContrasena;
  }

  cancelarFormulario(): void {
    this.contrasenaActual = '';
    this.nuevaContrasena = '';
    this.confirmarContrasena = '';
    this.mensaje = '';
  }

  regresar(): void {
    this.location.back();
  }

  cambiarPassword(): void {
    if (!this.usuario || this.contrasenasNoCoinciden()) return;
    this.loading = true;
    this.mensaje = '';
    this.usuarioService.cambiarPassword(this.usuario.id, {
      contrasenaActual: this.contrasenaActual,
      nuevaContrasena: this.nuevaContrasena
    }).subscribe({
      next: () => {
        this.mensaje = 'Contraseña actualizada exitosamente.';
        this.mensajeTipo = 'success';
        this.contrasenaActual = '';
        this.nuevaContrasena = '';
        this.confirmarContrasena = '';
        this.loading = false;
      },
      error: (err) => {
        this.mensaje = err.error?.message || 'Error al cambiar la contraseña. Verifica tu contraseña actual.';
        this.mensajeTipo = 'error';
        this.loading = false;
      }
    });
  }
}
