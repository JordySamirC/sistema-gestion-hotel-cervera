import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { HeaderComponent } from '../header/header.component';
import { UiService } from '../../core/services/ui.service';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, HeaderComponent, CommonModule],
  template: `
    <div class="layout" [class.sidebar-open]="ui.sidebarOpen$ | async">
      <!-- Overlay para pantallas móviles cuando el menú lateral está abierto -->
      <div class="sidebar-overlay" (click)="closeSidebar()"></div>
      
      <!-- Barra lateral (Sidebar/Drawer) -->
      <app-sidebar class="app-sidebar-container" (click)="closeSidebar()"></app-sidebar>
      
      <!-- Área principal de contenido -->
      <div class="main-area">
        <app-header></app-header>
        <main class="content">
          <router-outlet></router-outlet>
        </main>
      </div>

      <!-- Barra de Navegación Inferior (Bottom Tab Bar) exclusiva para celulares -->
      <nav class="bottom-nav" *ngIf="!authService.esLimpieza()">
        <a routerLink="/panel" routerLinkActive="active" class="bottom-nav-item">
          <i class="bi bi-grid-1x2-fill"></i>
          <span>Panel</span>
        </a>
        <a routerLink="/habitaciones" routerLinkActive="active" class="bottom-nav-item">
          <i class="bi bi-door-closed-fill"></i>
          <span>Habitaciones</span>
        </a>
        <a routerLink="/reservas/individual/nueva" routerLinkActive="active" class="bottom-nav-item">
          <i class="bi bi-plus-circle-fill"></i>
          <span>Nueva</span>
        </a>
        <a routerLink="/registrar-ingreso" routerLinkActive="active" class="bottom-nav-item">
          <i class="bi bi-box-arrow-in-right"></i>
          <span>Ingreso</span>
        </a>
      </nav>
    </div>
  `,
  styles: [`
    .layout {
      display: flex;
      min-height: 100vh;
      position: relative;
    }
    .app-sidebar-container {
      transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .main-area {
      flex: 1;
      display: flex;
      flex-direction: column;
      background: #f5f5f5;
      min-width: 0; /* Previene desbordamiento en flexbox */
    }
    .content {
      flex: 1;
      padding: 24px;
      overflow-y: auto;
    }

    /* Overlay de fondo difuminado en móviles */
    .sidebar-overlay {
      display: none;
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.4);
      backdrop-filter: blur(3px);
      z-index: 999;
      animation: fadeInOverlay 0.25s ease-out;
    }

    /* Barra de Navegación Inferior Móvil */
    .bottom-nav {
      display: none;
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      height: 60px;
      background: rgba(26, 33, 27, 0.96); /* Fondo Premium Dark Green */
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border-top: 1px solid rgba(212, 168, 67, 0.15); /* Borde sutil Dorado Amazónico */
      z-index: 998;
      justify-content: space-around;
      align-items: center;
      box-shadow: 0 -4px 15px rgba(0, 0, 0, 0.15);
      padding: 0 8px;
    }

    .bottom-nav-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: rgba(255, 255, 255, 0.6);
      text-decoration: none;
      font-size: 0.68rem;
      font-weight: 600;
      font-family: 'Outfit', 'Inter', sans-serif;
      gap: 3px;
      flex: 1;
      height: 100%;
      transition: all 0.2s ease-in-out;
    }

    .bottom-nav-item i {
      font-size: 1.25rem;
      transition: transform 0.2s ease-in-out;
    }

    .bottom-nav-item.active {
      color: #ffffff;
      font-weight: 700;
    }

    .bottom-nav-item.active i {
      color: #D4A843; /* Dorado Amazónico para el Icono Activo */
      transform: translateY(-2px);
    }

    @keyframes fadeInOverlay {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    /* Medias Queries de Adaptabilidad */
    @media (max-width: 768px) {
      .app-sidebar-container {
        position: fixed;
        top: 0;
        left: 0;
        bottom: 0;
        z-index: 1000;
        transform: translateX(-100%);
        box-shadow: 5px 0 25px rgba(0, 0, 0, 0.4);
      }
      
      .layout.sidebar-open .app-sidebar-container {
        transform: translateX(0);
      }

      .layout.sidebar-open .sidebar-overlay {
        display: block;
      }
    }

    @media (max-width: 576px) {
      .content {
        padding: 16px;
        padding-bottom: 76px; /* Espacio para que el bottom bar no cubra contenido */
      }
      .bottom-nav {
        display: flex;
      }
    }
  `]
})
export class MainLayoutComponent {
  constructor(public ui: UiService, public authService: AuthService) {}

  closeSidebar(): void {
    if (this.ui.isSidebarOpen()) {
      this.ui.setSidebarOpen(false);
    }
  }
}
