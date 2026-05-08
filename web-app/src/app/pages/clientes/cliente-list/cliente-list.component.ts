import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ClienteService } from '../../../core/services/cliente.service';
import { ClienteResponse, ClienteRequest } from '../../../core/models/cliente';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-cliente-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="page">
      <div class="page-header">
        <h2>Clientes</h2>
        <button class="btn-primary" (click)="showForm = !showForm">
          {{ showForm ? 'Cancelar' : 'Nuevo Cliente' }}
        </button>
      </div>

      <div class="card" *ngIf="showForm">
        <div class="card-body">
          <h3>Registrar Cliente</h3>
          <form (ngSubmit)="onCreate()" class="form">
            <div class="form-row">
              <div class="form-group">
                <label>Tipo Doc.</label>
                <select [(ngModel)]="newCliente.tipoDocumento" name="td">
                  <option value="DNI">DNI</option>
                  <option value="PAS">Pasaporte</option>
                </select>
              </div>
              <div class="form-group">
                <label>N° Documento</label>
                <input type="text" [(ngModel)]="newCliente.numeroDocumento" name="nd" required maxlength="20" />
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Nombres</label>
                <input type="text" [(ngModel)]="newCliente.nombres" name="nom" required />
              </div>
              <div class="form-group">
                <label>Apellidos</label>
                <input type="text" [(ngModel)]="newCliente.apellidos" name="ape" required />
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Nacionalidad</label>
                <input type="text" [(ngModel)]="newCliente.nacionalidad" name="nac" />
              </div>
              <div class="form-group">
                <label>Teléfono</label>
                <input type="text" [(ngModel)]="newCliente.telefono" name="tel" />
              </div>
            </div>
            <div class="form-group">
              <label>Email</label>
              <input type="email" [(ngModel)]="newCliente.email" name="email" />
            </div>
            <button type="submit" class="btn-primary">Guardar</button>
          </form>
        </div>
      </div>

      <div class="table-container">
        <table class="table">
          <thead>
            <tr>
              <th>Documento</th>
              <th>Nombre</th>
              <th>Nacionalidad</th>
              <th>Teléfono</th>
              <th>Email</th>
              <th>Veces</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let c of clientes">
              <td>{{ c.tipoDocumento }} {{ c.numeroDocumento }}</td>
              <td>{{ c.nombres }} {{ c.apellidos }}</td>
              <td>{{ c.nacionalidad }}</td>
              <td>{{ c.telefono || '-' }}</td>
              <td>{{ c.email || '-' }}</td>
              <td>{{ c.vecesHospedado }}</td>
              <td>
                <button class="btn-sm" (click)="buscarDni(c.numeroDocumento)">Buscar DNI</button>
              </td>
            </tr>
            <tr *ngIf="clientes.length === 0">
              <td colspan="7" class="empty">No hay clientes registrados</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .page { }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
    .page-header h2 { margin: 0; font-size: 1.3rem; color: #333; }
    .card { background: white; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); margin-bottom: 20px; }
    .card-body { padding: 20px; }
    .card-body h3 { margin: 0 0 16px; font-size: 1rem; color: #333; }
    .form { }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .form-group { margin-bottom: 12px; }
    label { display: block; margin-bottom: 4px; font-size: 0.8rem; color: #555; }
    input, select { width: 100%; padding: 8px 10px; border: 1px solid #ddd; border-radius: 4px; font-size: 0.85rem; box-sizing: border-box; }
    .btn-primary { padding: 8px 20px; background: #1a237e; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.85rem; }
    .btn-sm { padding: 4px 10px; background: #e8eaf6; color: #1a237e; border: none; border-radius: 4px; cursor: pointer; font-size: 0.75rem; }
    .table-container { background: white; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); overflow-x: auto; }
    .table { width: 100%; border-collapse: collapse; }
    .table th, .table td { padding: 12px 16px; text-align: left; font-size: 0.85rem; border-bottom: 1px solid #f0f0f0; }
    .table th { background: #fafafa; color: #666; font-weight: 600; }
    .table td { color: #333; }
    .empty { text-align: center; color: #999; padding: 20px; }
  `]
})
export class ClienteListComponent implements OnInit {
  clientes: ClienteResponse[] = [];
  showForm = false;
  newCliente: ClienteRequest = {
    tipoDocumento: 'DNI', numeroDocumento: '', nombres: '', apellidos: '',
    nacionalidad: 'Peruana', telefono: '', email: ''
  };

  constructor(private service: ClienteService) {}

  ngOnInit(): void {
    this.service.getAll().subscribe({ next: (data) => this.clientes = data });
  }

  onCreate(): void {
    this.service.create(this.newCliente).subscribe({
      next: (cliente) => {
        this.clientes.unshift(cliente);
        this.showForm = false;
        this.newCliente = { tipoDocumento: 'DNI', numeroDocumento: '', nombres: '', apellidos: '', nacionalidad: 'Peruana', telefono: '', email: '' };
      }
    });
  }

  buscarDni(dni: string): void {
  }
}
