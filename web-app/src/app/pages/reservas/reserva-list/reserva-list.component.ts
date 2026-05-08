import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ReservaService } from '../../../core/services/reserva.service';
import { ClienteService } from '../../../core/services/cliente.service';
import { HabitacionService } from '../../../core/services/habitacion.service';
import { AuthService } from '../../../core/services/auth.service';
import { ReservaResponse, ReservaRequest } from '../../../core/models/reserva';
import { ClienteResponse } from '../../../core/models/cliente';
import { HabitacionResponse } from '../../../core/models/habitacion';

@Component({
  selector: 'app-reserva-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="page">
      <div class="page-header">
        <h2>Reservas</h2>
        <div class="actions">
          <select (change)="filtrarEstado($any($event.target).value)" class="filter-select">
            <option value="">Todas</option>
            <option value="Pendiente">Pendiente</option>
            <option value="Confirmada">Confirmada</option>
            <option value="En curso">En curso</option>
            <option value="Finalizada">Finalizada</option>
            <option value="Cancelada">Cancelada</option>
          </select>
          <button class="btn-primary" (click)="showForm = !showForm">
            {{ showForm ? 'Cancelar' : 'Nueva Reserva' }}
          </button>
        </div>
      </div>

      <div class="card" *ngIf="showForm">
        <div class="card-body">
          <h3>Nueva Reserva</h3>
          <form (ngSubmit)="onCreate()" class="form">
            <div class="form-row">
              <div class="form-group">
                <label>Cliente</label>
                <select [(ngModel)]="newReserva.clienteId" name="cliente" required>
                  <option value="">Seleccione...</option>
                  <option *ngFor="let c of clientes" [value]="c.id">{{ c.nombres }} {{ c.apellidos }}</option>
                </select>
              </div>
              <div class="form-group">
                <label>Canal de Venta</label>
                <input type="text" [(ngModel)]="newReserva.canalVenta" name="canal" />
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Fecha Ingreso</label>
                <input type="date" [(ngModel)]="newReserva.fechaIngreso" name="fechaIngreso" required />
              </div>
              <div class="form-group">
                <label>Fecha Salida</label>
                <input type="date" [(ngModel)]="newReserva.fechaSalida" name="fechaSalida" required />
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Adultos</label>
                <input type="number" [(ngModel)]="newReserva.adultos" name="adultos" min="1" />
              </div>
              <div class="form-group">
                <label>Niños</label>
                <input type="number" [(ngModel)]="newReserva.ninos" name="ninos" min="0" />
              </div>
            </div>
            <div class="form-group">
              <label>Habitaciones</label>
              <div class="checkbox-grid">
                <label class="checkbox-label" *ngFor="let h of habitacionesDisponibles">
                  <input type="checkbox" [value]="h.id" (change)="toggleHabitacion(h.id, $any($event.target).checked)" />
                  {{ h.numero }} - {{ h.tipoNombre }}
                </label>
              </div>
            </div>
            <button type="submit" class="btn-primary">Crear Reserva</button>
          </form>
        </div>
      </div>

      <div class="table-container">
        <table class="table">
          <thead>
            <tr>
              <th>Código</th>
              <th>Cliente</th>
              <th>Ingreso</th>
              <th>Salida</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let r of reservasFiltradas">
              <td class="codigo">{{ r.codigo }}</td>
              <td>{{ r.clienteNombre }}</td>
              <td>{{ r.fechaIngreso | date:'dd/MM/yyyy' }}</td>
              <td>{{ r.fechaSalida | date:'dd/MM/yyyy' }}</td>
              <td><span class="badge" [class]="getEstadoClass(r.estado)">{{ r.estado }}</span></td>
              <td>
                <button class="btn-sm" [routerLink]="['/check-in']">Check-In</button>
              </td>
            </tr>
            <tr *ngIf="reservasFiltradas.length === 0">
              <td colspan="6" class="empty">No hay reservas</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .page, .page-header { margin-bottom: 20px; }
    .page-header { display: flex; justify-content: space-between; align-items: center; }
    .page-header h2 { margin: 0; font-size: 1.3rem; color: #333; }
    .actions { display: flex; gap: 8px; }
    .filter-select { padding: 8px 12px; border: 1px solid #ddd; border-radius: 6px; font-size: 0.85rem; background: white; }
    .card { background: white; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); margin-bottom: 20px; }
    .card-body { padding: 20px; }
    .card-body h3 { margin: 0 0 16px; font-size: 1rem; color: #333; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .form-group { margin-bottom: 12px; }
    label { display: block; margin-bottom: 4px; font-size: 0.8rem; color: #555; }
    input, select { width: 100%; padding: 8px 10px; border: 1px solid #ddd; border-radius: 4px; font-size: 0.85rem; box-sizing: border-box; }
    .checkbox-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 8px; }
    .checkbox-label { display: flex; align-items: center; gap: 6px; font-size: 0.85rem; cursor: pointer; }
    .btn-primary { padding: 8px 20px; background: #1a237e; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.85rem; }
    .btn-sm { padding: 4px 10px; background: #e8eaf6; color: #1a237e; border: none; border-radius: 4px; cursor: pointer; font-size: 0.75rem; }
    .table-container { background: white; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); overflow-x: auto; }
    .table { width: 100%; border-collapse: collapse; }
    .table th, .table td { padding: 12px 16px; text-align: left; font-size: 0.85rem; border-bottom: 1px solid #f0f0f0; }
    .table th { background: #fafafa; color: #666; font-weight: 600; }
    .codigo { font-weight: 600; color: #1a237e; font-family: monospace; }
    .badge { padding: 3px 10px; border-radius: 12px; font-size: 0.75rem; font-weight: 500; background: #e0e0e0; }
    .estado-pendiente { background: #fff3e0; color: #e65100; }
    .estado-confirmada { background: #e3f2fd; color: #1565c0; }
    .estado-en-curso { background: #e8f5e9; color: #2e7d32; }
    .estado-finalizada { background: #f3e5f5; color: #6a1b9a; }
    .estado-cancelada { background: #ffebee; color: #c62828; }
    .empty { text-align: center; color: #999; padding: 20px; }
  `]
})
export class ReservaListComponent implements OnInit {
  reservas: ReservaResponse[] = [];
  reservasFiltradas: ReservaResponse[] = [];
  clientes: ClienteResponse[] = [];
  habitacionesDisponibles: HabitacionResponse[] = [];
  showForm = false;
  filtroEstado = '';

  newReserva: any = {
    fechaIngreso: '', fechaSalida: '', clienteId: '', creadoPor: '',
    adultos: 1, adolescentes: 0, ninos: 0, bebes: 0, canalVenta: 'Directo', tipoCliente: 'Regular', habitacionesIds: []
  };

  constructor(
    private service: ReservaService,
    private clienteService: ClienteService,
    private habitacionService: HabitacionService,
    private auth: AuthService
  ) {}

  ngOnInit(): void {
    this.loadReservas();
    this.clienteService.getAll().subscribe({ next: (data) => this.clientes = data });
    this.habitacionService.getDisponibles(
      new Date().toISOString().split('T')[0],
      new Date(Date.now() + 86400000).toISOString().split('T')[0]
    ).subscribe({ next: (data) => this.habitacionesDisponibles = data });
  }

  loadReservas(): void {
    this.service.getAll().subscribe({ next: (data) => { this.reservas = data; this.aplicarFiltro(); } });
  }

  filtrarEstado(estado: string): void { this.filtroEstado = estado; this.aplicarFiltro(); }

  getEstadoClass(estado: string): string {
    return 'estado-' + estado.toLowerCase().replace(/ /g, '-');
  }

  private aplicarFiltro(): void {
    this.reservasFiltradas = this.filtroEstado
      ? this.reservas.filter(r => r.estado === this.filtroEstado)
      : this.reservas;
  }

  toggleHabitacion(id: string, checked: boolean): void {
    if (checked) this.newReserva.habitacionesIds.push(id);
    else this.newReserva.habitacionesIds = this.newReserva.habitacionesIds.filter((h: string) => h !== id);
  }

  onCreate(): void {
    this.newReserva.creadoPor = this.auth.getUsuario()?.id;
    this.service.create(this.newReserva).subscribe({
      next: () => {
        this.showForm = false;
        this.loadReservas();
      },
      error: () => alert('Error al crear reserva')
    });
  }
}
