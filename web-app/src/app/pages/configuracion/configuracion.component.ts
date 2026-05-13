import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { UsuarioService } from '../../core/services/usuario.service';
import { LoginResponse } from '../../core/models/usuario';

@Component({
  selector: 'app-configuracion',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="config-container">
      <div class="card">
        <h2>Mi Perfil</h2>
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
            <label>Email</label>
            <span>{{ usuario?.email }}</span>
          </div>
          <div class="field">
            <label>Usuario</label>
            <span>{{ usuario?.nombreUsuario }}</span>
          </div>
          <div class="field">
            <label>Rol</label>
            <span class="rol-badge">{{ usuario?.rol }}</span>
          </div>
        </div>
      </div>

      <div class="card">
        <h2>Cambiar Contraseña</h2>
        <form #passwordForm="ngForm" (ngSubmit)="cambiarPassword()" class="password-form">
          <div class="form-group">
            <label for="actual">Contraseña Actual</label>
            <input id="actual" name="actual" type="password" [(ngModel)]="contrasenaActual" required>
          </div>
          <div class="form-group">
            <label for="nueva">Nueva Contraseña</label>
            <input id="nueva" name="nueva" type="password" [(ngModel)]="nuevaContrasena" required minlength="6" #nueva="ngModel">
            <small *ngIf="nueva.invalid && nueva.touched" class="error-text">Mínimo 6 caracteres</small>
          </div>
          <div class="form-group">
            <label for="confirmar">Confirmar Nueva Contraseña</label>
            <input id="confirmar" name="confirmar" type="password" [(ngModel)]="confirmarContrasena" required (input)="mensaje = ''">
            <small *ngIf="confirmarContrasena && contrasenasNoCoinciden()" class="error-text">Las contraseñas no coinciden</small>
          </div>
          <button type="submit" class="btn-submit" [disabled]="passwordForm.invalid || contrasenasNoCoinciden() || loading">
            {{ loading ? 'Guardando...' : 'Cambiar Contraseña' }}
          </button>
          <div *ngIf="mensaje" class="mensaje {{ mensajeTipo }}">{{ mensaje }}</div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .config-container {
      max-width: 600px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: 24px;
    }
    .card {
      background: white;
      border-radius: 8px;
      padding: 24px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.08);
    }
    .card h2 {
      margin: 0 0 20px;
      font-size: 1.1rem;
      color: #333;
      border-bottom: 1px solid #eee;
      padding-bottom: 12px;
    }
    .profile-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }
    .field {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .field label {
      font-size: 0.75rem;
      color: #888;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .field span {
      font-size: 0.95rem;
      color: #333;
      padding: 6px 10px;
      background: #f9f9f9;
      border-radius: 4px;
    }
    .rol-badge {
      background: #e8eaf6 !important;
      color: #1a237e !important;
      font-weight: 600;
      text-transform: uppercase;
      font-size: 0.8rem !important;
    }
    .password-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .form-group {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .form-group label {
      font-size: 0.85rem;
      color: #555;
      font-weight: 500;
    }
    .form-group input {
      padding: 10px 12px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 0.9rem;
      outline: none;
      transition: border-color 0.2s;
    }
    .form-group input:focus {
      border-color: #1a237e;
    }
    .error-text {
      color: #f44336;
      font-size: 0.75rem;
    }
    .btn-submit {
      padding: 10px 20px;
      background: #1a237e;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.9rem;
      align-self: flex-start;
    }
    .btn-submit:disabled {
      background: #9fa8da;
      cursor: not-allowed;
    }
    .btn-submit:not(:disabled):hover {
      background: #283593;
    }
    .mensaje {
      padding: 10px 14px;
      border-radius: 4px;
      font-size: 0.85rem;
    }
    .mensaje.success {
      background: #e8f5e9;
      color: #2e7d32;
    }
    .mensaje.error {
      background: #ffebee;
      color: #c62828;
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
    private usuarioService: UsuarioService
  ) {
    this.usuario = this.auth.getUsuario();
  }

  contrasenasNoCoinciden(): boolean {
    return !!this.confirmarContrasena && this.nuevaContrasena !== this.confirmarContrasena;
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
