import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule],
  template: `
    <div class="login-container">
      <div class="login-bg-overlay"></div>
      <div class="login-card">
        <div class="login-header">
          <div class="brand-icon">
            <div class="logo-glow"></div>
            <img src="../assets/images/Logo.png" alt="Hotel Cervera" class="logo-img" />
          </div>
          <h1>Hotel Cervera</h1>
          <p class="location">Rio Santiago · Amazonas, Perú</p>
          <p class="description">Sistema de Gestión Hotelera</p>
        </div>

        <form (ngSubmit)="onSubmit()" #loginForm="ngForm" class="login-form">

          <div class="form-group">
            <label for="email">Email corporativo</label>
            <div class="input-wrapper">
              <svg class="input-icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
                <rect x="1.5" y="3" width="13" height="10" rx="2" stroke="#8A817A" stroke-width="1.5" fill="none"/>
                <path d="M1.5 4.5L8 9.5L14.5 4.5" stroke="#8A817A" stroke-width="1.5" fill="none" stroke-linejoin="round"/>
              </svg>
              <input
                id="email"
                type="email"
                [(ngModel)]="email"
                name="email"
                placeholder="correo@hotelcervera.com"
                required
                pattern="[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}"
                autocomplete="email"
                #emailField="ngModel"
              />
            </div>
            <span class="field-error" *ngIf="emailField.invalid && emailField.touched">
              Ingrese un email corporativo válido
            </span>
          </div>

          <div class="form-group">
            <label for="password">Contraseña</label>
            <div class="input-wrapper">
              <svg class="input-icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
                <rect x="3" y="7" width="10" height="7" rx="1.5" stroke="#8A817A" stroke-width="1.5" fill="none"/>
                <circle cx="8" cy="10.5" r="1.5" stroke="#8A817A" stroke-width="1.5" fill="none"/>
                <path d="M5.5 7V5a2.5 2.5 0 015 0v2" stroke="#8A817A" stroke-width="1.5" fill="none"/>
              </svg>
              <input
                id="password"
                [type]="showPassword ? 'text' : 'password'"
                [(ngModel)]="password"
                name="password"
                placeholder="Ingrese su contraseña"
                required
                minlength="6"
                autocomplete="current-password"
                #passwordField="ngModel"
              />
              <button type="button" class="toggle-password" (click)="showPassword = !showPassword" [attr.aria-label]="showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'">
                <svg *ngIf="showPassword" width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M2 10s3.5-6 8-6 8 6 8 6-3.5 6-8 6-8-6-8-6z" stroke="#8A817A" stroke-width="1.5" fill="none"/>
                  <circle cx="10" cy="10" r="3" stroke="#8A817A" stroke-width="1.5" fill="none"/>
                </svg>
                <svg *ngIf="!showPassword" width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M2 10s3.5-6 8-6 8 6 8 6-3.5 6-8 6-8-6-8-6z" stroke="#8A817A" stroke-width="1.5" fill="none"/>
                  <circle cx="10" cy="10" r="3" stroke="#8A817A" stroke-width="1.5" fill="none"/>
                  <line x1="4.5" y1="4.5" x2="15.5" y2="15.5" stroke="#8A817A" stroke-width="1.5" stroke-linecap="round"/>
                </svg>
              </button>
            </div>
            <span class="field-error" *ngIf="passwordField.invalid && passwordField.touched">
              La contraseña debe tener al menos 6 caracteres
            </span>
          </div>

          <div class="form-options">
            <label class="checkbox-label">
              <input type="checkbox" [(ngModel)]="remember" name="remember" />
              <span class="checkbox-custom"></span>
              Recordar sesión
            </label>
            <button type="button" class="link-btn" (click)="showForgot = true">¿Olvidaste tu contraseña?</button>
          </div>

          <div class="error-message" *ngIf="error">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style="vertical-align: middle; margin-right: 6px; flex-shrink: 0;">
              <circle cx="7" cy="7" r="6" stroke="currentColor" stroke-width="1.2" fill="none"/>
              <line x1="7" y1="4" x2="7" y2="8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              <circle cx="7" cy="10.5" r="0.8" fill="currentColor"/>
            </svg>
            <span>{{ error }}</span>
          </div>

          <button type="submit" class="btn-login" [disabled]="loading || loginForm.invalid">
            <span *ngIf="!loading">Iniciar Sesión</span>
            <span *ngIf="loading" class="loading-content">
              <svg class="spinner" width="18" height="18" viewBox="0 0 18 18" fill="none">
                <circle cx="9" cy="9" r="7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-dasharray="30" fill="none"/>
              </svg>
              Ingresando...
            </span>
          </button>
        </form>

      </div>
    </div>

    <div class="modal-overlay" *ngIf="showForgot" (click)="showForgot = false">
      <div class="modal-card" (click)="$event.stopPropagation()">
        <h3>Recuperar contraseña</h3>
        <p *ngIf="!forgotSent && !forgotError && !forgotLoading">Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.</p>

        <div *ngIf="!forgotSent">
          <div class="form-group" style="margin: 12px 0 0;">
            <div class="input-wrapper">
              <input
                type="email"
                [(ngModel)]="forgotEmail"
                name="forgotEmail"
                placeholder="correo@hotelcervera.com"
                required
                style="padding-left: 0;"
              />
            </div>
          </div>

          <div class="error-message" *ngIf="forgotError" style="margin-top: 10px;">
            <span>{{ forgotError }}</span>
          </div>

          <button type="button" class="btn-modal" (click)="onForgotPassword()" [disabled]="forgotLoading || !forgotEmail">
            <span *ngIf="!forgotLoading">Enviar enlace</span>
            <span *ngIf="forgotLoading" class="loading-content">
              <svg class="spinner" width="16" height="16" viewBox="0 0 18 18" fill="none">
                <circle cx="9" cy="9" r="7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-dasharray="30" fill="none"/>
              </svg>
              Enviando...
            </span>
          </button>
        </div>

        <div *ngIf="forgotSent" style="margin-top: 6px;">
          <p style="color: #2D5A27; font-weight: 500;">{{ forgotSentMessage }}</p>
        </div>

        <button type="button" class="btn-modal btn-modal-secondary" (click)="closeForgot()" style="margin-top: 12px;">Cerrar</button>
      </div>
    </div>
  `,
  styles: [`
    .login-container {
      position: relative;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100dvh;
      background:
        linear-gradient(160deg, #1A211B 0%, #2D5A27 40%, #3A6B33 65%, #2D5A27 85%, #1A211B 100%);
      overflow: hidden;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
    }

    .login-bg-overlay {
      position: absolute;
      inset: 0;
      background:
        radial-gradient(ellipse 80% 55% at 20% 85%, rgba(90, 130, 60, 0.25) 0%, transparent 70%),
        radial-gradient(ellipse 60% 50% at 80% 15%, rgba(212, 168, 67, 0.07) 0%, transparent 60%),
        radial-gradient(ellipse 100% 40% at 50% 50%, rgba(26, 33, 27, 0.5) 0%, transparent 70%);
      pointer-events: none;
    }

    @keyframes cardIn {
      from { opacity: 0; transform: translateY(24px) scale(0.97); }
      to   { opacity: 1; transform: translateY(0) scale(1); }
    }

    @keyframes glowPulse {
      0%, 100% { opacity: 0.35; transform: scale(1); }
      50%      { opacity: 0.6;  transform: scale(1.15); }
    }

    .login-card {
      position: relative;
      background: #FAF7F2;
      border-radius: 16px;
      padding: 44px 36px 32px;
      width: 100%;
      max-width: 400px;
      border: 1px solid rgba(47, 91, 79, 0.12);
      box-shadow:
        0 8px 32px rgba(0, 0, 0, 0.18),
        0 2px 8px rgba(0, 0, 0, 0.1);
      animation: cardIn 0.6s cubic-bezier(0.32, 0.72, 0, 1);
    }

    .login-header {
      text-align: center;
      margin-bottom: 32px;
    }

    .brand-icon {
      margin-bottom: 14px;
      display: flex;
      justify-content: center;
      position: relative;
    }

    .logo-glow {
      position: absolute;
      width: 90px;
      height: 90px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(212, 168, 67, 0.3) 0%, transparent 70%);
      animation: glowPulse 2.5s ease-in-out infinite;
    }

    .logo-img {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      object-fit: cover;
      box-shadow: 0 2px 16px rgba(47, 91, 79, 0.25);
      position: relative;
    }

    .login-header h1 {
      margin: 0 0 6px;
      font-family: Georgia, 'Times New Roman', serif;
      font-size: 1.75rem;
      font-weight: 700;
      color: #1C1A17;
      letter-spacing: -0.02em;
    }

    .location {
      color: #8A817A;
      font-size: 0.78rem;
      font-weight: 400;
      margin: 0 0 4px;
      letter-spacing: 0.04em;
    }

    .description {
      color: #2D5A27;
      font-size: 0.78rem;
      font-weight: 500;
      margin: 6px 0 0;
      letter-spacing: 0.03em;
    }

    .login-form {
      display: flex;
      flex-direction: column;
      gap: 18px;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    label {
      color: #1C1A17;
      font-size: 0.78rem;
      font-weight: 600;
      letter-spacing: 0.02em;
    }

    .input-wrapper {
      position: relative;
      display: flex;
      align-items: center;
    }

    .input-icon {
      position: absolute;
      left: 0;
      top: 50%;
      transform: translateY(-50%);
      pointer-events: none;
    }

    input {
      width: 100%;
      padding: 12px 0 12px 22px;
      border: none;
      border-bottom: 1.5px solid #B5ADA6;
      background: transparent;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
      font-size: 0.9rem;
      color: #1C1A17;
      transition: border-color 0.25s ease, padding-left 0.25s ease;
      box-sizing: border-box;
    }

    input:focus {
      outline: none;
      border-bottom-color: #8B5A2B;
      padding-left: 22px;
    }

    input::placeholder {
      color: #B5ADA6;
      font-weight: 400;
      font-size: 0.85rem;
    }

    input.ng-invalid.ng-touched {
      border-bottom-color: #C0512F;
    }

    .field-error {
      font-size: 0.72rem;
      color: #C0512F;
      font-weight: 500;
      padding-left: 2px;
    }

    .toggle-password {
      position: absolute;
      right: 0;
      top: 50%;
      transform: translateY(-50%);
      background: none;
      border: none;
      padding: 4px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0.5;
      transition: opacity 0.2s;
    }

    .toggle-password:hover { opacity: 1; }

    .form-options {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 2px 0;
    }

    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.78rem;
      color: #5A524A;
      cursor: pointer;
      user-select: none;
    }

    .checkbox-label input {
      display: none;
    }

    .checkbox-custom {
      width: 16px;
      height: 16px;
      border: 1.5px solid #B5ADA6;
      border-radius: 4px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
      flex-shrink: 0;
    }

    .checkbox-label input:checked + .checkbox-custom {
      background: #D4A843;
      border-color: #D4A843;
    }

    .checkbox-label input:checked + .checkbox-custom::after {
      content: '';
      width: 4px;
      height: 8px;
      border: solid #FAF7F2;
      border-width: 0 2px 2px 0;
      transform: rotate(45deg);
      margin-top: -2px;
    }

    .link-btn {
      background: none;
      border: none;
      color: #8B5A2B;
      font-size: 0.78rem;
      font-weight: 500;
      cursor: pointer;
      padding: 0;
      transition: color 0.2s;
      font-family: inherit;
    }

    .link-btn:hover { color: #6B4423; }

    .error-message {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #C0512F;
      font-size: 0.8rem;
      font-weight: 500;
      padding: 10px 14px;
      background: rgba(192, 81, 47, 0.07);
      border-radius: 8px;
    }

    .btn-login {
      width: 100%;
      padding: 13px 20px;
      background: #D4A843;
      color: #1C1A17;
      border: none;
      border-radius: 12px;
      font-family: inherit;
      font-size: 0.95rem;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s ease, transform 0.15s ease;
      margin-top: 2px;
    }

    .btn-login:hover:not(:disabled) {
      background: #C49A35;
      transform: scale(1.02);
    }

    .btn-login:active:not(:disabled) {
      transform: scale(0.98);
    }

    .btn-login:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .loading-content {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }

    .spinner {
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin { to { transform: rotate(360deg); } }

    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.4);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      animation: fadeIn 0.2s ease;
    }

    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

    .modal-card {
      background: #FAF7F2;
      border-radius: 14px;
      padding: 32px 28px;
      max-width: 360px;
      width: 90%;
      text-align: center;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
      animation: cardIn 0.3s cubic-bezier(0.32, 0.72, 0, 1);
    }

    .modal-card h3 {
      font-family: Georgia, 'Times New Roman', serif;
      font-size: 1.2rem;
      color: #1C1A17;
      margin: 0 0 10px;
    }

    .modal-card p {
      font-size: 0.85rem;
      color: #5A524A;
      margin: 0 0 6px;
      line-height: 1.5;
    }

    .btn-modal {
      background: #D4A843;
      color: #1C1A17;
      border: none;
      border-radius: 10px;
      padding: 10px 28px;
      font-size: 0.85rem;
      font-weight: 600;
      cursor: pointer;
      margin-top: 14px;
      transition: background 0.2s;
      font-family: inherit;
    }

    .btn-modal:hover { background: #C49A35; }

    .btn-modal-secondary {
      background: transparent;
      color: #8A817A;
      border: 1px solid #B5ADA6;
    }

    .btn-modal-secondary:hover { background: #F0EDE6; }
  `]
})
export class LoginComponent {
  email = '';
  password = '';
  error = '';
  loading = false;
  showPassword = false;
  remember = false;
  showForgot = false;
  forgotEmail = '';
  forgotLoading = false;
  forgotError = '';
  forgotSent = false;
  forgotSentMessage = '';

  constructor(private auth: AuthService, private router: Router) {}

  onSubmit(): void {
    if (!this.email || !this.password) {
      this.error = 'Ingrese email y contraseña';
      return;
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(this.email)) {
      this.error = 'Ingrese un email corporativo válido';
      return;
    }

    this.loading = true;
    this.error = '';

    this.auth.login({ email: this.email, contrasena: this.password }).subscribe({
      next: () => {
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.message || 'Credenciales inválidas';
      }
    });
  }

  onForgotPassword(): void {
    if (!this.forgotEmail) return;
    this.forgotLoading = true;
    this.forgotError = '';

    this.auth.forgotPassword({ email: this.forgotEmail }).subscribe({
      next: (res) => {
        this.forgotLoading = false;
        this.forgotSent = true;
        this.forgotSentMessage = res.message;
      },
      error: (err) => {
        this.forgotLoading = false;
        this.forgotError = err.error?.message || 'Error al enviar el enlace. Intenta de nuevo.';
      }
    });
  }

  closeForgot(): void {
    this.showForgot = false;
    this.forgotEmail = '';
    this.forgotError = '';
    this.forgotSent = false;
    this.forgotSentMessage = '';
    this.forgotLoading = false;
  }
}
