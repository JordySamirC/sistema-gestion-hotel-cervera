import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CommonModule],
  template: `
    <aside class="sidebar">
      <div class="sidebar-header">
        <img src="assets/images/Logo.webp" alt="Hotel Cervera" class="sidebar-logo" />
        <div class="sidebar-brand">
          <h2>Hotel Cervera</h2>
          <span class="subtitle">Río Santiago</span>
        </div>
      </div>
      <nav class="sidebar-nav">
        <a routerLink="/panel" routerLinkActive="active" class="nav-item" *ngIf="!auth.esLimpieza()">
          <span class="icon"><i class="bi bi-grid-1x2-fill"></i></span>
          <span>Panel</span>
        </a>
        <a routerLink="/habitaciones" routerLinkActive="active" class="nav-item" *ngIf="!auth.esLimpieza()">
          <span class="icon"><i class="bi bi-door-closed-fill"></i></span>
          <span>Habitaciones</span>
        </a>
        <a routerLink="/reservas" routerLinkActive="active" class="nav-item" *ngIf="!auth.esLimpieza()">
          <span class="icon"><i class="bi bi-journal-text"></i></span>
          <span>Reservas</span>
        </a>
        <a routerLink="/reservas/individual/nueva" routerLinkActive="active" class="nav-item sub-item" *ngIf="!auth.esLimpieza()">
          <span class="icon"><i class="bi bi-plus-circle-fill"></i></span>
          <span>Reserva Individual</span>
        </a>
        <a routerLink="/reservas/grupo/nuevo" routerLinkActive="active" class="nav-item sub-item" *ngIf="!auth.esLimpieza()">
          <span class="icon"><i class="bi bi-people-fill"></i></span>
          <span>Reserva Grupal</span>
        </a>
        <a routerLink="/registrar-ingreso" routerLinkActive="active" class="nav-item" *ngIf="!auth.esLimpieza()">
          <span class="icon"><i class="bi bi-box-arrow-in-right"></i></span>
          <span>Registrar Ingreso</span>
        </a>
        <a routerLink="/registrar-salida" routerLinkActive="active" class="nav-item" *ngIf="!auth.esLimpieza()">
          <span class="icon"><i class="bi bi-box-arrow-right"></i></span>
          <span>Registrar Salida</span>
        </a>
        <a routerLink="/limpieza" routerLinkActive="active" class="nav-item" *ngIf="!auth.esGerente() || auth.esLimpieza()">
          <span class="icon"><i class="bi bi-brush-fill"></i></span>
          <span>Limpieza</span>
        </a>
        <a routerLink="/clientes" routerLinkActive="active" class="nav-item" *ngIf="auth.esGerente()">
          <span class="icon"><i class="bi bi-person-bounding-box"></i></span>
          <span>Clientes</span>
        </a>
        <a routerLink="/pagos" routerLinkActive="active" class="nav-item" *ngIf="auth.esGerente()">
          <span class="icon"><i class="bi bi-cash-stack"></i></span>
          <span>Pagos</span>
        </a>
        <a routerLink="/gastos" routerLinkActive="active" class="nav-item" *ngIf="auth.esGerente()">
          <span class="icon"><i class="bi bi-wallet2"></i></span>
          <span>Gastos</span>
        </a>
        <a routerLink="/usuarios" routerLinkActive="active" class="nav-item" *ngIf="auth.esGerente()">
          <span class="icon"><i class="bi bi-person-gear"></i></span>
          <span>Usuarios</span>
        </a>
        <a routerLink="/precios" routerLinkActive="active" class="nav-item" *ngIf="auth.esGerente()">
          <span class="icon"><i class="bi bi-tags-fill"></i></span>
          <span>Precios</span>
        </a>
        <a routerLink="/restricciones-fecha" routerLinkActive="active" class="nav-item" *ngIf="auth.esGerente()">
          <span class="icon"><i class="bi bi-calendar-x-fill"></i></span>
          <span>Restricciones</span>
        </a>
        <a routerLink="/reportes" routerLinkActive="active" class="nav-item" *ngIf="auth.esGerente()">
          <span class="icon"><i class="bi bi-bar-chart-line-fill"></i></span>
          <span>Reportes</span>
        </a>
      </nav>
    </aside>
  `,
  styles: [`
    .sidebar {
      width: 240px;
      height: 100vh;
      position: sticky;
      top: 0;
      background: #1A211B; /* Fondo Oscuro Premium */
      color: #ffffff;
      display: flex;
      flex-direction: column;
      font-family: 'Outfit', 'Inter', sans-serif;
      box-shadow: 3px 0 15px rgba(0, 0, 0, 0.25);
    }
    .sidebar-header {
      padding: 24px 20px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .sidebar-logo {
      width: 38px;
      height: 38px;
      border-radius: 50%;
      border: 2px solid #D4A843; /* Anillo Dorado Amazónico */
      flex-shrink: 0;
      object-fit: cover;
      box-shadow: 0 0 8px rgba(212, 168, 67, 0.4);
    }
    .sidebar-brand h2 {
      margin: 0;
      font-size: 1.05rem;
      font-weight: 700;
      color: #ffffff;
      letter-spacing: 0.02em;
    }
    .sidebar-brand .subtitle {
      font-size: 0.68rem;
      font-weight: 700;
      color: #D4A843; /* Dorado Amazónico */
      letter-spacing: 0.08em;
      text-transform: uppercase;
      display: block;
      margin-top: 2px;
    }
    .sidebar-nav {
      padding: 16px 0;
      flex: 1;
      overflow-y: auto;
    }
    /* Estilos de barra de scroll elegantes para el menú lateral */
    .sidebar-nav::-webkit-scrollbar {
      width: 5px;
    }
    .sidebar-nav::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.12);
      border-radius: 3px;
    }
    .sidebar-nav::-webkit-scrollbar-track {
      background: transparent;
    }
    
    .nav-item {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 10px 16px;
      margin: 4px 12px;
      color: #F8FAFC; /* Slate 50: Blanco puro de alto contraste para máxima lectura */
      text-decoration: none;
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      font-size: 0.92rem;
      font-weight: 600; /* Negrita de lectura */
      border-radius: 8px; /* Formato de píldora moderna */
      position: relative;
      overflow: hidden;
    }
    
    .nav-item::before {
      content: '';
      position: absolute;
      left: 0;
      top: 20%;
      height: 60%;
      width: 4px;
      background: #D4A843; /* Dorado Amazónico */
      border-radius: 0 4px 4px 0;
      transform: scaleX(0);
      transform-origin: left;
      transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    .nav-item:hover::before, .nav-item.active::before {
      transform: scaleX(1);
    }
    
    .nav-item:hover {
      background: rgba(78, 141, 70, 0.22); /* Verde Tropical Secundario translúcido */
      color: #ffffff;
      padding-left: 20px; /* Desplazamiento sutil hacia la derecha al posar el cursor */
    }
    
    .nav-item:hover .icon {
      background: rgba(212, 168, 67, 0.25); /* Glow del icono en dorado */
      transform: scale(1.08);
    }
    
    .nav-item.active {
      background: #2D5A27; /* Verde Selva Principal */
      color: #ffffff;
      font-weight: 700;
      box-shadow: 0 4px 12px rgba(45, 90, 39, 0.35);
    }
    
    .nav-item.active .icon {
      background: #D4A843; /* Fondo Dorado Amazónico Sólido para el Icono Activo */
      box-shadow: 0 2px 6px rgba(212, 168, 67, 0.4);
      transform: scale(1.05);
    }
    
    .nav-item.active i {
      color: #1A211B; /* Icono en Fondo Oscuro Premium para un contraste insuperable */
    }
    
    .icon {
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 8px;
      background: rgba(255, 255, 255, 0.08); /* Caja contenedora */
      transition: all 0.25s ease-in-out;
      flex-shrink: 0;
    }
    
    .icon i {
      color: #D4A843; /* Iconos en Dorado Amazónico por defecto para un alto contraste vibrante */
      font-size: 1.05rem;
      transition: all 0.25s ease-in-out;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      line-height: 1;
    }
    
    .nav-item:hover i {
      color: #ffffff; /* El icono se aclara a blanco al posar el cursor */
    }
    
    .sub-item {
      margin-left: 28px;
      font-size: 0.85rem;
    }
  `]
})
export class SidebarComponent {
  constructor(public auth: AuthService) { }
}
