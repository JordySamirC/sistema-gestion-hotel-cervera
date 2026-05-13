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
        <img src="assets/images/Logo.png" alt="Hotel Cervera" class="sidebar-logo" />
        <div class="sidebar-brand">
          <h2>Hotel Cervera</h2>
          <span class="subtitle">Rio Santiago</span>
        </div>
      </div>
      <nav class="sidebar-nav">
        <a routerLink="/dashboard" routerLinkActive="active" class="nav-item">
          <span class="icon">📊</span>
          <span>Dashboard</span>
        </a>
        <a routerLink="/habitaciones" routerLinkActive="active" class="nav-item">
          <span class="icon">🏨</span>
          <span>Habitaciones</span>
        </a>
        <a routerLink="/reservas" routerLinkActive="active" class="nav-item">
          <span class="icon">📋</span>
          <span>Reservas</span>
        </a>
        <a routerLink="/reservas/nueva" routerLinkActive="active" class="nav-item sub-item">
          <span class="icon">➕</span>
          <span>Nueva Reserva</span>
        </a>
        <a routerLink="/reservas/grupo/nuevo" routerLinkActive="active" class="nav-item sub-item">
          <span class="icon">👥</span>
          <span>Reserva Grupal</span>
        </a>
        <a routerLink="/check-in" routerLinkActive="active" class="nav-item">
          <span class="icon">✅</span>
          <span>Check-In</span>
        </a>
        <a routerLink="/check-out" routerLinkActive="active" class="nav-item">
          <span class="icon">🚪</span>
          <span>Check-Out</span>
        </a>
        <a routerLink="/limpieza" routerLinkActive="active" class="nav-item" *ngIf="!auth.esGerente() || auth.esLimpieza()">
          <span class="icon">🧹</span>
          <span>Limpieza</span>
        </a>
        <a routerLink="/clientes" routerLinkActive="active" class="nav-item" *ngIf="auth.esGerente()">
          <span class="icon">👤</span>
          <span>Clientes</span>
        </a>
        <a routerLink="/pagos" routerLinkActive="active" class="nav-item" *ngIf="auth.esGerente()">
          <span class="icon">💰</span>
          <span>Pagos</span>
        </a>
        <a routerLink="/gastos" routerLinkActive="active" class="nav-item" *ngIf="auth.esGerente()">
          <span class="icon">📉</span>
          <span>Gastos</span>
        </a>
        <a routerLink="/usuarios" routerLinkActive="active" class="nav-item" *ngIf="auth.esGerente()">
          <span class="icon">🔧</span>
          <span>Usuarios</span>
        </a>
        <a routerLink="/precios" routerLinkActive="active" class="nav-item" *ngIf="auth.esGerente()">
          <span class="icon">🏷️</span>
          <span>Precios</span>
        </a>
        <a routerLink="/reportes" routerLinkActive="active" class="nav-item" *ngIf="auth.esGerente()">
          <span class="icon">📈</span>
          <span>Reportes</span>
        </a>
      </nav>
    </aside>
  `,
  styles: [`
    .sidebar {
      width: 240px;
      min-height: 100vh;
      background: #1a237e;
      color: white;
      display: flex;
      flex-direction: column;
    }
    .sidebar-header {
      padding: 20px;
      border-bottom: 1px solid rgba(255,255,255,0.1);
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .sidebar-logo {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      flex-shrink: 0;
      object-fit: cover;
    }
    .sidebar-brand h2 {
      margin: 0;
      font-size: 1rem;
      font-weight: 600;
    }
    .sidebar-brand .subtitle {
      font-size: 0.7rem;
      opacity: 0.7;
    }
    .sidebar-nav {
      padding: 10px 0;
      flex: 1;
    }
    .nav-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 20px;
      color: rgba(255,255,255,0.8);
      text-decoration: none;
      transition: all 0.2s;
      font-size: 0.9rem;
    }
    .nav-item:hover {
      background: rgba(255,255,255,0.1);
      color: white;
    }
    .nav-item.active {
      background: rgba(255,255,255,0.15);
      color: white;
      border-right: 3px solid #ffd54f;
    }
    .icon {
      font-size: 1.1rem;
      width: 24px;
      text-align: center;
    }
    .sub-item {
      padding-left: 44px;
      font-size: 0.8rem;
    }
  `]
})
export class SidebarComponent {
  constructor(public auth: AuthService) {}
}
