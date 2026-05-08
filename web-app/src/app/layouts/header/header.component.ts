import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <header class="header">
      <div class="header-left">
        <span class="page-title">{{ pageTitle }}</span>
      </div>
      <div class="header-right">
        <span class="user-info" *ngIf="usuario">
          {{ usuario.nombres }} {{ usuario.apellidos }}
          <span class="badge">{{ usuario.rol }}</span>
        </span>
        <button class="btn-logout" (click)="logout()">Cerrar Sesión</button>
      </div>
    </header>
  `,
  styles: [`
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 24px;
      background: white;
      border-bottom: 1px solid #e0e0e0;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }
    .page-title {
      font-size: 1.1rem;
      font-weight: 600;
      color: #333;
    }
    .header-right {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .user-info {
      font-size: 0.85rem;
      color: #555;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .badge {
      background: #e8eaf6;
      color: #1a237e;
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 0.7rem;
      font-weight: 600;
      text-transform: uppercase;
    }
    .btn-logout {
      padding: 6px 16px;
      background: #f44336;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.8rem;
    }
    .btn-logout:hover {
      background: #d32f2f;
    }
  `]
})
export class HeaderComponent {
  get usuario() { return this.auth.getUsuario(); }

  constructor(private auth: AuthService, private router: Router) {}

  get pageTitle(): string {
    const url = this.router.url;
    const titles: Record<string, string> = {
      '/dashboard': 'Dashboard',
      '/habitaciones': 'Gestión de Habitaciones',
      '/reservas': 'Gestión de Reservas',
      '/check-in': 'Registro de Check-In',
      '/check-out': 'Registro de Check-Out',
      '/limpieza': 'Gestión de Limpieza',
      '/clientes': 'Gestión de Clientes',
      '/pagos': 'Historial de Pagos',
      '/gastos': 'Gestión de Gastos',
      '/usuarios': 'Gestión de Usuarios',
      '/reportes': 'Reportes'
    };
    return titles[url] || 'Hotel Cervera Rio Santiago';
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
