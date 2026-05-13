import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ReservaService } from '../../../core/services/reserva.service';
import { PanelReservaItem } from '../../../core/models/reserva';

@Component({
  selector: 'app-panel-reservas',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="panel">
      <div class="panel-header">
        <h2>RESERVAS</h2>
      </div>

      <div class="buscador">
        <input type="text" placeholder="Buscar por c&oacute;digo, cliente, grupo o habitaci&oacute;n..."
               [(ngModel)]="terminoBusqueda" (input)="aplicarFiltros()">
      </div>

      <div class="filtros-rapidos">
        <button [class.active]="filtro === 'todas'" (click)="filtro='todas'; aplicarFiltros()">Todas</button>
        <button [class.active]="filtro === 'individuales'" (click)="filtro='individuales'; aplicarFiltros()">Individuales</button>
        <button [class.active]="filtro === 'grupos'" (click)="filtro='grupos'; aplicarFiltros()">Grupos</button>
        <button [class.active]="filtro === 'pendientes'" (click)="filtro='pendientes'; aplicarFiltros()">Pendientes</button>
        <button [class.active]="filtro === 'checkin'" (click)="filtro='checkin'; aplicarFiltros()">Check-In</button>
        <button [class.active]="filtro === 'checkout'" (click)="filtro='checkout'; aplicarFiltros()">Check-Out</button>
      </div>

      <div class="acciones-barra">
        <a routerLink="/reservas/grupo/nuevo" class="btn-secondary">Reserva Grupal</a>
        <a routerLink="/reservas/nueva" class="btn-primary">Nueva Reserva</a>
      </div>

      <div class="table-container">
        <table class="reservas-table">
          <thead>
            <tr>
              <th>C&oacute;digo</th>
              <th>Cliente</th>
              <th>Ingreso</th>
              <th>Salida</th>
              <th>Grupo</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <ng-container *ngFor="let item of reservasFiltradas">
              <tr *ngIf="item.tipo === 'INDIVIDUAL'" class="fila-individual">
                <td class="codigo">{{ item.codigo }}</td>
                <td><span class="icono-titular">👑</span> {{ item.cliente }} <span class="rol-label">(Titular)</span></td>
                <td>{{ item.fechaIngreso | date:'dd/MM/yyyy' }}</td>
                <td>{{ item.fechaSalida | date:'dd/MM/yyyy' }}</td>
                <td>{{ item.grupoNombre || '---' }}</td>
                <td><span class="badge" [ngClass]="badgeClass(item.estado)">{{ estadoLabel(item.estado) }}</span></td>
                <td><button class="btn-accion" [routerLink]="['/reservas', item.codigo]">Ver</button></td>
              </tr>

              <ng-container *ngIf="item.tipo === 'GRUPO'">
                <tr class="fila-grupo" (click)="toggleGrupo(item)">
                  <td class="codigo">{{ item.codigo }}</td>
                  <td><span class="icono-responsable">👤</span> {{ item.cliente }} <span class="rol-label">(Responsable de pago)</span></td>
                  <td>{{ item.fechaIngreso | date:'dd/MM/yyyy' }}</td>
                  <td>{{ item.fechaSalida | date:'dd/MM/yyyy' }}</td>
                  <td><span class="grupo-nombre">{{ item.grupoNombre }}</span></td>
                  <td><span class="badge badge-grupo">{{ estadoLabel(item.estado) }}</span></td>
                  <td>
                    <button class="btn-expandir" (click)="$event.stopPropagation(); toggleGrupo(item)">
                      {{ item.expandido ? '&#x25B2;' : '&#x25BC;' }} Ver Grupo
                    </button>
                  </td>
                </tr>
                <ng-container *ngIf="item.expandido">
                  <tr *ngFor="let hija of item.hijas" class="fila-hija">
                    <td class="indentado codigo">{{ hija.codigo }}</td>
                    <td class="indentado"><span class="icono-titular">👑</span> {{ hija.cliente }} <span class="rol-label">(Titular)</span></td>
                    <td>{{ hija.fechaIngreso | date:'dd/MM/yyyy' }}</td>
                    <td>{{ hija.fechaSalida | date:'dd/MM/yyyy' }}</td>
                    <td>---</td>
                    <td><span class="badge" [ngClass]="badgeClass(hija.estado)">{{ estadoLabel(hija.estado) }}</span></td>
                    <td><button class="btn-accion" [routerLink]="['/reservas', hija.codigo]">Ver</button></td>
                  </tr>
                </ng-container>
              </ng-container>
            </ng-container>
            <tr *ngIf="reservasFiltradas.length === 0">
              <td colspan="7" class="empty">No se encontraron reservas</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .panel { padding: 0; }
    .panel-header { margin-bottom: 16px; }
    .panel-header h2 { margin: 0; font-size: 1.3rem; color: #333; letter-spacing: 0.5px; }
    .buscador { margin-bottom: 12px; }
    .buscador input { width: 100%; padding: 10px 14px; border: 1px solid #ddd; border-radius: 8px; font-size: 0.85rem; box-sizing: border-box; background: white; }
    .buscador input:focus { outline: none; border-color: #1a237e; box-shadow: 0 0 0 2px rgba(26,35,126,0.1); }
    .filtros-rapidos { display: flex; gap: 6px; margin-bottom: 16px; flex-wrap: wrap; }
    .filtros-rapidos button { padding: 6px 16px; border: 1px solid #dee2e6; border-radius: 20px; background: white; color: #555; cursor: pointer; font-size: 0.8rem; transition: all .15s; }
    .filtros-rapidos button:hover { background: #f5f5f5; }
    .filtros-rapidos button.active { background: #1a237e; color: white; border-color: #1a237e; }
    .acciones-barra { display: flex; gap: 8px; margin-bottom: 16px; justify-content: flex-end; }
    .btn-primary { padding: 8px 20px; background: #1a237e; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 0.85rem; text-decoration: none; }
    .btn-secondary { padding: 8px 20px; background: #f5f5f5; color: #555; border: 1px solid #ddd; border-radius: 6px; cursor: pointer; font-size: 0.85rem; text-decoration: none; }
    .table-container { background: white; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); overflow-x: auto; }
    .reservas-table { width: 100%; border-collapse: collapse; }
    .reservas-table th, .reservas-table td { padding: 12px 16px; text-align: left; font-size: 0.85rem; border-bottom: 1px solid #f0f0f0; }
    .reservas-table th { background: #fafafa; color: #666; font-weight: 600; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.5px; }
    .codigo { font-weight: 600; color: #1a237e; font-family: monospace; }
    .icono-titular, .icono-responsable { font-size: 1rem; }
    .rol-label { color: #999; font-size: 0.75rem; }
    .grupo-nombre { display: inline-block; background: #e8f5e9; color: #2e7d32; padding: 2px 10px; border-radius: 12px; font-size: 0.75rem; font-weight: 500; }
    .fila-grupo { background-color: #F8F9FA; cursor: pointer; }
    .fila-grupo:hover { background-color: #e9ecef; }
    .fila-hija td { font-size: 0.82rem; }
    .fila-hija:hover { background-color: #fafafa; }
    .indentado { padding-left: 30px !important; }
    .badge { padding: 3px 10px; border-radius: 12px; font-size: 0.75rem; font-weight: 500; display: inline-block; }
    .badge-grupo { background: #e8f5e9; color: #2e7d32; }
    .estado-pendiente { background: #fff3e0; color: #e65100; }
    .estado-checked_in { background: #e3f2fd; color: #1565c0; }
    .estado-checked_out { background: #f3e5f5; color: #6a1b9a; }
    .estado-cancelada { background: #ffebee; color: #c62828; }
    .estado-no_show { background: #f3e5f5; color: #6a1b9a; }
    .estado-mixto { background: #fff3e0; color: #e65100; }
    .btn-accion { padding: 4px 12px; background: #e8eaf6; color: #1a237e; border: none; border-radius: 4px; cursor: pointer; font-size: 0.75rem; }
    .btn-accion:hover { background: #c5cae9; }
    .btn-expandir { padding: 4px 12px; background: transparent; color: #1a237e; border: 1px solid #c5cae9; border-radius: 4px; cursor: pointer; font-size: 0.75rem; }
    .btn-expandir:hover { background: #e8eaf6; }
    .empty { text-align: center; color: #999; padding: 30px; font-size: 0.85rem; }
  `]
})
export class PanelReservasComponent implements OnInit {
  reservas: PanelReservaItem[] = [];
  reservasFiltradas: PanelReservaItem[] = [];
  filtro = 'todas';
  terminoBusqueda = '';

  readonly estadosLabel: Record<string, string> = {
    pendiente: 'Pendiente',
    checked_in: 'Check-In',
    checked_out: 'Check-Out',
    cancelada: 'Cancelada',
    no_show: 'No Show',
    mixto: 'Mixto'
  };

  constructor(private service: ReservaService) {}

  ngOnInit(): void {
    this.loadPanel();
  }

  loadPanel(): void {
    this.service.getPanel().subscribe({
      next: (data) => {
        this.reservas = data.map(r => ({ ...r, expandido: false }));
        this.aplicarFiltros();
      }
    });
  }

  toggleGrupo(item: PanelReservaItem): void {
    item.expandido = !item.expandido;
  }

  aplicarFiltros(): void {
    let resultado = [...this.reservas];

    if (this.filtro === 'individuales') {
      resultado = resultado.filter(r => r.tipo === 'INDIVIDUAL');
    } else if (this.filtro === 'grupos') {
      resultado = resultado.filter(r => r.tipo === 'GRUPO');
    } else if (this.filtro === 'pendientes') {
      resultado = resultado.filter(r =>
        (r.tipo === 'INDIVIDUAL' && r.estado === 'pendiente') ||
        (r.tipo === 'GRUPO' && r.hijas?.some(h => h.estado === 'pendiente'))
      );
    } else if (this.filtro === 'checkin') {
      const hoy = new Date().toISOString().split('T')[0];
      resultado = resultado.filter(r => {
        if (r.tipo === 'GRUPO') return false;
        return r.fechaIngreso === hoy && r.estado === 'pendiente';
      });
    } else if (this.filtro === 'checkout') {
      const hoy = new Date().toISOString().split('T')[0];
      resultado = resultado.filter(r => {
        if (r.tipo === 'GRUPO') return false;
        return r.fechaSalida === hoy && r.estado === 'checked_in';
      });
    }

    if (this.terminoBusqueda) {
      const term = this.terminoBusqueda.toLowerCase();
      resultado = resultado.filter(item => {
        if (item.tipo === 'GRUPO') {
          const match = item.codigo?.toLowerCase().includes(term) ||
                        item.cliente?.toLowerCase().includes(term) ||
                        item.grupoNombre?.toLowerCase().includes(term) ||
                        item.hijas?.some(h =>
                          h.codigo?.toLowerCase().includes(term) ||
                          h.cliente?.toLowerCase().includes(term)
                        );
          if (match) item.expandido = true;
          return match;
        }
        return item.codigo?.toLowerCase().includes(term) ||
               item.cliente?.toLowerCase().includes(term) ||
               item.grupoNombre?.toLowerCase().includes(term);
      });
    }

    this.reservasFiltradas = resultado;
  }

  estadoLabel(estado: string): string {
    return this.estadosLabel[estado] ?? estado;
  }

  badgeClass(estado: string): string {
    return 'estado-' + estado.toLowerCase().replace(/ /g, '_');
  }
}
