import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [FormsModule, CommonModule],
  template: `
    <div class="reset-container">
      <div class="reset-bg-overlay"></div>
      <div class="reset-card">
        <div class="reset-header">
          <div class="brand-icon">
            <div class="logo-glow"></div>
            <img src="../assets/images/Logo.png" alt="Hotel Cervera" class="logo-img" />
          </div>
          <h1>Hotel Cervera</h1>
          <p class="description">Restablecer contraseña</p>
        </div>

        <div *ngIf="!success; else successBlock">
          <form (ngSubmit)="onSubmit()" #resetForm="ngForm" class="reset-form">

            <div class="form-group">
              <label for="newPassword">Nueva contraseña</label>
              <div class="input-wrapper">
                <input
                  id="newPassword"
                  [type]="showPassword ? 'text' : 'password'"
                  [(ngModel)]="newPassword"
                  name="newPassword"
                  placeholder="Mínimo 15 caracteres"
                  required
                  minlength="15"
                  #passwordField="ngModel"
                />
                <button type="button" class="toggle-password" (click)="showPassword = !showPassword">
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
                La contraseña debe tener al menos 15 caracteres
              </span>
            </div>

            <div class="form-group">
              <label for="confirmPassword">Confirmar contraseña</label>
              <div class="input-wrapper">
                <input
                  id="confirmPassword"
                  [type]="showPassword ? 'text' : 'password'"
                  [(ngModel)]="confirmPassword"
                  name="confirmPassword"
                  placeholder="Repite la contraseña"
                  required
                  #confirmField="ngModel"
                />
              </div>
              <span class="field-error" *ngIf="confirmField.touched && newPassword !== confirmPassword">
                Las contraseñas no coinciden
              </span>
            </div>

            <div class="error-message" *ngIf="error">
              <span>{{ error }}</span>
            </div>

            <button type="submit" class="btn-reset" [disabled]="loading || resetForm.invalid || newPassword !== confirmPassword">
              <span *ngIf="!loading">Restablecer contraseña</span>
              <span *ngIf="loading" class="loading-content">
                <svg class="spinner" width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <circle cx="9" cy="9" r="7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-dasharray="30" fill="none"/>
                </svg>
                Guardando...
              </span>
            </button>
          </form>
        </div>

        <ng-template #successBlock>
          <div class="success-content">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              <circle cx="24" cy="24" r="22" stroke="#2D5A27" stroke-width="2" fill="none"/>
              <path d="M16 24l6 6 10-10" stroke="#2D5A27" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
            </svg>
            <h3>Contraseña actualizada</h3>
            <p>Tu contraseña se ha restablecido correctamente. Ya puedes iniciar sesión.</p>
            <button type="button" class="btn-reset" (click)="goToLogin()">Ir a iniciar sesión</button>
          </div>
        </ng-template>
      </div>
    </div>
  `,
  styles: [`
    .reset-container {
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

    .reset-bg-overlay {
      position: absolute;
      inset: 0;
      background:
        radial-gradient(ellipse 80% 55% at 20% 85%, rgba(90, 130, 60, 0.25) 0%, transparent 70%),
        radial-gradient(ellipse 60% 50% at 80% 15%, rgba(212, 168, 67, 0.07) 0%, transparent 60%);
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

    .reset-card {
      position: relative;
      background: #FAF7F2;
      border-radius: 16px;
      padding: 44px 36px 32px;
      width: 100%;
      max-width: 400px;
      border: 1px solid rgba(47, 91, 79, 0.12);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.18), 0 2px 8px rgba(0, 0, 0, 0.1);
      animation: cardIn 0.6s cubic-bezier(0.32, 0.72, 0, 1);
    }

    .reset-header {
      text-align: center;
      margin-bottom: 28px;
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

    .reset-header h1 {
      margin: 0 0 6px;
      font-family: Georgia, 'Times New Roman', serif;
      font-size: 1.75rem;
      font-weight: 700;
      color: #1C1A17;
    }

    .description {
      color: #2D5A27;
      font-size: 0.85rem;
      font-weight: 500;
      letter-spacing: 0.03em;
      margin: 6px 0 0;
    }

    .reset-form {
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
    }

    .input-wrapper {
      position: relative;
      display: flex;
      align-items: center;
    }

    input {
      width: 100%;
      padding: 12px 0 12px 0;
      border: none;
      border-bottom: 1.5px solid #B5ADA6;
      background: transparent;
      font-family: inherit;
      font-size: 0.9rem;
      color: #1C1A17;
      transition: border-color 0.25s ease;
      box-sizing: border-box;
    }

    input:focus {
      outline: none;
      border-bottom-color: #8B5A2B;
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
      opacity: 0.5;
      transition: opacity 0.2s;
    }

    .toggle-password:hover { opacity: 1; }

    .error-message {
      color: #C0512F;
      font-size: 0.8rem;
      font-weight: 500;
      padding: 10px 14px;
      background: rgba(192, 81, 47, 0.07);
      border-radius: 8px;
    }

    .btn-reset {
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
    }

    .btn-reset:hover:not(:disabled) {
      background: #C49A35;
      transform: scale(1.02);
    }

    .btn-reset:active:not(:disabled) {
      transform: scale(0.98);
    }

    .btn-reset:disabled {
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

    .success-content {
      text-align: center;
      padding: 12px 0;
    }

    .success-content svg {
      margin-bottom: 16px;
    }

    .success-content h3 {
      font-family: Georgia, 'Times New Roman', serif;
      font-size: 1.2rem;
      color: #1C1A17;
      margin: 0 0 8px;
    }

    .success-content p {
      font-size: 0.85rem;
      color: #5A524A;
      margin: 0 0 20px;
      line-height: 1.5;
    }
  `]
})
export class ResetPasswordComponent implements OnInit {
  token = '';
  newPassword = '';
  confirmPassword = '';
  error = '';
  loading = false;
  success = false;
  showPassword = false;

  constructor(
    private auth: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token') || '';
    if (!this.token) {
      this.error = 'Enlace inválido. Solicita un nuevo restablecimiento de contraseña.';
    }
  }

  onSubmit(): void {
    if (!this.token || !this.newPassword || this.newPassword.length < 15) return;
    if (this.newPassword !== this.confirmPassword) return;

    this.loading = true;
    this.error = '';

    this.auth.resetPassword({ token: this.token, newPassword: this.newPassword }).subscribe({
      next: () => {
        this.loading = false;
        this.success = true;
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.message || 'Error al restablecer la contraseña. El enlace puede haber expirado.';
      }
    });
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}
