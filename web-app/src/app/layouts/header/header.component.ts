import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { UiService } from '../../core/services/ui.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <header class="header">
      <div class="header-left">
        <button class="btn-toggle-sidebar" (click)="toggleSidebar()" title="Menú">
          <i class="bi bi-list"></i>
        </button>
        <div class="page-title-container">
          <span class="title-accent"></span>
          <span class="page-title">{{ pageTitle }}</span>
        </div>
      </div>
      <div class="header-right">
        <!-- Contenedor Premium de Perfil del Usuario -->
        <div class="user-profile-wrapper" *ngIf="usuario" title="Perfil de Usuario">
          <div class="avatar-circle">
            {{ getInitials(usuario.nombres, usuario.apellidos) }}
          </div>
          <div class="user-meta">
            <span class="user-name">{{ usuario.nombres }} {{ usuario.apellidos }}</span>
            <span class="user-role">{{ usuario.rol }}</span>
          </div>
        </div>

        <a routerLink="/configuracion" class="btn-config" title="Configuración">
          <i class="bi bi-gear-fill"></i>
        </a>

        <!-- Botón Premium de Cerrar Sesión con Contraste y Fusión de Marca -->
        <button class="btn-logout" (click)="logout()" title="Cerrar Sesión">
          <i class="bi bi-box-arrow-right"></i>
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </header>
  `,
  styles: [`
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 24px;
      background: rgba(255, 255, 255, 0.88);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border-bottom: 1px solid rgba(45, 90, 39, 0.08); /* Borde sutil Verde Selva */
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.015);
      font-family: 'Outfit', 'Inter', sans-serif;
      position: sticky;
      top: 0;
      z-index: 100;
    }
    .header-left {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .btn-toggle-sidebar {
      display: none;
      background: transparent;
      border: none;
      font-size: 1.6rem;
      cursor: pointer;
      color: #1A211B;
      padding: 6px;
      margin-right: 4px;
      border-radius: 8px;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease-in-out;
      line-height: 1;
    }
    .btn-toggle-sidebar:hover {
      background: rgba(78, 141, 70, 0.08);
      color: #2D5A27;
    }
    .page-title-container {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .title-accent {
      width: 4px;
      height: 18px;
      background: #D4A843; /* Dorado Amazónico */
      border-radius: 99px;
      display: inline-block;
    }
    .page-title {
      font-size: 1.25rem;
      font-weight: 800;
      color: #1A211B; /* Fondo Oscuro Premium */
      letter-spacing: -0.02em;
    }
    .header-right {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .user-profile-wrapper {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 5px 14px 5px 6px;
      background: rgba(78, 141, 70, 0.05);
      border-radius: 30px;
      border: 1px solid rgba(78, 141, 70, 0.1);
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      cursor: pointer;
      user-select: none;
    }
    .user-profile-wrapper:hover {
      background: rgba(78, 141, 70, 0.09);
      border-color: rgba(78, 141, 70, 0.2);
      transform: translateY(-1px);
    }
    .avatar-circle {
      width: 34px;
      height: 34px;
      border-radius: 50%;
      background: linear-gradient(135deg, #2D5A27, #1A211B);
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 750;
      font-size: 0.85rem;
      border: 2px solid #D4A843; /* Contorno Dorado Amazónico */
      box-shadow: 0 2px 6px rgba(45, 90, 39, 0.15);
    }
    .user-meta {
      display: flex;
      flex-direction: column;
      text-align: left;
    }
    .user-name {
      font-size: 0.88rem;
      font-weight: 700;
      color: #1A211B;
      line-height: 1.15;
    }
    .user-role {
      font-size: 0.7rem;
      font-weight: 700;
      color: #8B5A2B; /* Marrón Madera */
      text-transform: uppercase;
      letter-spacing: 0.06em;
      margin-top: 1px;
    }
    .btn-config {
      text-decoration: none;
      font-size: 1.2rem;
      cursor: pointer;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: rgba(78, 141, 70, 0.05);
      border: 1px solid rgba(78, 141, 70, 0.1);
      color: #2D5A27;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .btn-config:hover {
      background: #2D5A27;
      color: #ffffff;
      border-color: #2D5A27;
      transform: rotate(45deg);
      box-shadow: 0 4px 10px rgba(45, 90, 39, 0.15);
    }
    .btn-logout {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      background: linear-gradient(135deg, #8B5A2B, #6E441F); /* Marrón Madera */
      color: #ffffff;
      border: 1px solid rgba(212, 168, 67, 0.25); /* Dorado Amazónico */
      border-radius: 20px;
      cursor: pointer;
      font-size: 0.8rem;
      font-weight: 700;
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 4px 12px rgba(139, 90, 43, 0.2);
    }
    .btn-logout i {
      font-size: 0.95rem;
    }
    .btn-logout:hover {
      background: linear-gradient(135deg, #D4A843, #B88E2F); /* Dorado Amazónico */
      border-color: rgba(45, 90, 39, 0.25);
      box-shadow: 0 6px 16px rgba(212, 168, 67, 0.35);
      transform: translateY(-2px);
    }

    @media (max-width: 768px) {
      .btn-toggle-sidebar {
        display: inline-flex;
      }
      .user-meta {
        display: none; /* Oculta nombres largos en móviles */
      }
      .user-profile-wrapper {
        padding: 2px;
        background: transparent;
        border: none;
      }
      .avatar-circle {
        width: 32px;
        height: 32px;
      }
      .header {
        padding: 8px 16px;
      }
      .btn-logout span {
        display: none; /* En celular oculta la palabra "Cerrar Sesión" y muestra solo el icono */
      }
      .btn-logout {
        padding: 8px;
        border-radius: 50%;
        width: 34px;
        height: 34px;
        justify-content: center;
      }
    }
  `]
})
export class HeaderComponent {
  get usuario() { return this.auth.getUsuario(); }

  constructor(
    private auth: AuthService, 
    private router: Router,
    private ui: UiService
  ) {}

  get pageTitle(): string {
    const url = this.router.url;
    if (url === '/reservas/individual/nueva') {
      return 'Reserva Individual';
    }
    if (url === '/reservas/grupo/nuevo') {
      return 'Reserva Grupal';
    }
    if (url.startsWith('/reservas/') && url !== '/reservas') {
      return 'Detalle de Reserva';
    }

    const titles: Record<string, string> = {
      '/panel': 'Panel',
      '/habitaciones': 'Habitaciones',
      '/reservas': 'Reservas',
      '/registrar-ingreso': 'Registrar Ingreso',
      '/registrar-salida': 'Registrar Salida',
      '/limpieza': 'Limpieza',
      '/clientes': 'Clientes',
      '/pagos': 'Pagos',
      '/gastos': 'Gastos',
      '/usuarios': 'Usuarios',
      '/precios': 'Precios',
      '/restricciones-fecha': 'Restricciones',
      '/reportes': 'Reportes',
      '/configuracion': 'Configuración'
    };
    return titles[url] || 'Hotel Cervera';
  }

  getInitials(nombres?: string, apellidos?: string): string {
    const n = nombres ? nombres.charAt(0) : '';
    const a = apellidos ? apellidos.charAt(0) : '';
    return (n + a).toUpperCase() || 'U';
  }

  toggleSidebar(): void {
    this.ui.toggleSidebar();
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
