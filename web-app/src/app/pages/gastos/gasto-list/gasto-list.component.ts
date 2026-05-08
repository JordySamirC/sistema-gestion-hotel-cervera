import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GastoService } from '../../../core/services/gasto.service';
import { AuthService } from '../../../core/services/auth.service';
import { GastoResponse, GastoRequest } from '../../../core/models/gasto';

@Component({
  selector: 'app-gasto-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <div class="page-header">
        <h2>Gastos Operativos</h2>
        <button class="btn-primary" (click)="showForm = !showForm">
          {{ showForm ? 'Cancelar' : 'Nuevo Gasto' }}
        </button>
      </div>

      <div class="card" *ngIf="showForm">
        <div class="card-body">
          <h3>Registrar Gasto</h3>
          <form (ngSubmit)="onCreate()" class="form">
            <div class="form-row">
              <div class="form-group">
                <label>Fecha</label>
                <input type="date" [(ngModel)]="newGasto.fechaGasto" name="fecha" required />
              </div>
              <div class="form-group">
                <label>Monto</label>
                <input type="number" [(ngModel)]="newGasto.monto" name="monto" required step="0.01" />
              </div>
            </div>
            <div class="form-group">
              <label>Descripción</label>
              <input type="text" [(ngModel)]="newGasto.descripcion" name="desc" required maxlength="200" />
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Categoría</label>
                <select [(ngModel)]="newGasto.categoria" name="cat" required>
                  <option value="Servicios">Servicios</option>
                  <option value="Limpieza">Limpieza</option>
                  <option value="Mantenimiento">Mantenimiento</option>
                  <option value="Personal">Personal</option>
                  <option value="Suministros">Suministros</option>
                  <option value="Otros">Otros</option>
                </select>
              </div>
              <div class="form-group">
                <label>Tipo</label>
                <select [(ngModel)]="newGasto.tipoGasto" name="tipo">
                  <option [value]="true">Fijo</option>
                  <option [value]="false">Variable</option>
                </select>
              </div>
            </div>
            <button type="submit" class="btn-primary">Guardar</button>
          </form>
        </div>
      </div>

      <div class="table-container">
        <table class="table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Descripción</th>
              <th>Categoría</th>
              <th>Tipo</th>
              <th>Monto</th>
              <th>Registrado por</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let g of gastos">
              <td>{{ g.fechaGasto }}</td>
              <td>{{ g.descripcion }}</td>
              <td><span class="badge">{{ g.categoria }}</span></td>
              <td>{{ g.esFijo ? 'Fijo' : 'Variable' }}</td>
              <td class="monto">S/ {{ g.monto }}</td>
              <td>{{ g.creadoPorNombre }}</td>
            </tr>
            <tr *ngIf="gastos.length === 0">
              <td colspan="6" class="empty">No hay gastos registrados</td>
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
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .form-group { margin-bottom: 12px; }
    label { display: block; margin-bottom: 4px; font-size: 0.8rem; color: #555; }
    input, select { width: 100%; padding: 8px 10px; border: 1px solid #ddd; border-radius: 4px; font-size: 0.85rem; box-sizing: border-box; }
    .btn-primary { padding: 8px 20px; background: #1a237e; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.85rem; }
    .table-container { background: white; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); overflow-x: auto; }
    .table { width: 100%; border-collapse: collapse; }
    .table th, .table td { padding: 12px 16px; text-align: left; font-size: 0.85rem; border-bottom: 1px solid #f0f0f0; }
    .table th { background: #fafafa; color: #666; font-weight: 600; }
    .badge { padding: 3px 10px; border-radius: 12px; font-size: 0.75rem; background: #f3e5f5; color: #6a1b9a; }
    .monto { font-weight: 600; color: #c62828; }
    .empty { text-align: center; color: #999; padding: 20px; }
  `]
})
export class GastoListComponent implements OnInit {
  gastos: GastoResponse[] = [];
  showForm = false;

  newGasto: any = {
    fechaGasto: new Date().toISOString().split('T')[0],
    descripcion: '', categoria: 'Otros', monto: 0, esFijo: false, creadoPor: ''
  };

  constructor(
    private service: GastoService,
    private auth: AuthService
  ) {}

  ngOnInit(): void {
    this.service.getAll().subscribe({ next: (data) => this.gastos = data });
  }

  onCreate(): void {
    this.newGasto.creadoPor = this.auth.getUsuario()?.id;
    this.service.create(this.newGasto).subscribe({
      next: () => {
        this.showForm = false;
        this.service.getAll().subscribe({ next: (data) => this.gastos = data });
      },
      error: () => alert('Error al registrar gasto')
    });
  }
}
