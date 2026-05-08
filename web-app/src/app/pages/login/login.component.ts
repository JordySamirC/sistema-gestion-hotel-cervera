import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink, CommonModule],
  template: `
    <div class="login-container">
      <div class="login-card">
        <div class="login-header">
          <h1>Hotel Cervera</h1>
          <p class="subtitle">Rio Santiago</p>
          <p class="description">Sistema de Gestión Hotelera</p>
        </div>
        <form (ngSubmit)="onSubmit()" class="login-form">
          <div class="form-group">
            <label for="username">Usuario</label>
            <input
              id="username"
              type="text"
              [(ngModel)]="username"
              name="username"
              placeholder="Ingrese su usuario"
              required
              autocomplete="username"
            />
          </div>
          <div class="form-group">
            <label for="password">Contraseña</label>
            <input
              id="password"
              type="password"
              [(ngModel)]="password"
              name="password"
              placeholder="Ingrese su contraseña"
              required
              autocomplete="current-password"
            />
          </div>
          <div class="error-message" *ngIf="error">
            {{ error }}
          </div>
          <button type="submit" class="btn-login" [disabled]="loading">
            {{ loading ? 'Ingresando...' : 'Iniciar Sesión' }}
          </button>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .login-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: linear-gradient(135deg, #1a237e 0%, #283593 50%, #3949ab 100%);
    }
    .login-card {
      background: white;
      border-radius: 12px;
      padding: 40px;
      width: 100%;
      max-width: 400px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.2);
    }
    .login-header {
      text-align: center;
      margin-bottom: 32px;
    }
    .login-header h1 {
      margin: 0;
      color: #1a237e;
      font-size: 1.8rem;
    }
    .subtitle {
      color: #666;
      font-size: 0.85rem;
      margin: 4px 0;
    }
    .description {
      color: #888;
      font-size: 0.8rem;
      margin: 8px 0 0;
    }
    .form-group {
      margin-bottom: 20px;
    }
    label {
      display: block;
      margin-bottom: 6px;
      color: #333;
      font-size: 0.85rem;
      font-weight: 500;
    }
    input {
      width: 100%;
      padding: 10px 12px;
      border: 1px solid #ddd;
      border-radius: 6px;
      font-size: 0.9rem;
      transition: border-color 0.2s;
      box-sizing: border-box;
    }
    input:focus {
      outline: none;
      border-color: #1a237e;
    }
    .error-message {
      background: #ffebee;
      color: #c62828;
      padding: 10px;
      border-radius: 6px;
      font-size: 0.8rem;
      margin-bottom: 16px;
    }
    .btn-login {
      width: 100%;
      padding: 12px;
      background: #1a237e;
      color: white;
      border: none;
      border-radius: 6px;
      font-size: 1rem;
      font-weight: 500;
      cursor: pointer;
      transition: background 0.2s;
    }
    .btn-login:hover:not(:disabled) {
      background: #283593;
    }
    .btn-login:disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }
  `]
})
export class LoginComponent {
  username = '';
  password = '';
  error = '';
  loading = false;

  constructor(private auth: AuthService, private router: Router) {}

  onSubmit(): void {
    if (!this.username || !this.password) {
      this.error = 'Ingrese usuario y contraseña';
      return;
    }

    this.loading = true;
    this.error = '';

    this.auth.login({
      nombreUsuario: this.username,
      contrasena: this.password
    }).subscribe({
      next: () => {
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.message || 'Credenciales inválidas';
      }
    });
  }
}
