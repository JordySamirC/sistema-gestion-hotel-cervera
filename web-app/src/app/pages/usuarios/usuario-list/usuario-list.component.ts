import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UsuarioService } from '../../../core/services/usuario.service';
import { RolService } from '../../../core/services/rol.service';
import { UsuarioResponse, UsuarioRequest } from '../../../core/models/usuario';
import { RolResponse } from '../../../core/models/rol';

@Component({
  selector: 'app-usuario-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <div class="page-header">
        <h2>Usuarios</h2>
        <button class="btn-primary" (click)="showForm = !showForm">
          {{ showForm ? 'Cancelar' : 'Nuevo Usuario' }}
        </button>
      </div>

      <div class="card" *ngIf="showForm">
        <div class="card-body">
          <h3>Registrar Usuario</h3>
          <form (ngSubmit)="onCreate()" class="form">
            <div class="form-row">
              <div class="form-group">
                <label>Nombre de Usuario</label>
                <input type="text" [(ngModel)]="newUser.nombreUsuario" name="uname" required />
              </div>
              <div class="form-group">
                <label>Email</label>
                <input type="email" [(ngModel)]="newUser.email" name="email" required />
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Contraseña</label>
                <input type="password" [(ngModel)]="newUser.contrasena" name="pass" required minlength="6" />
              </div>
              <div class="form-group">
                <label>Rol</label>
                <select [(ngModel)]="newUser.rolId" name="rol" required>
                  <option value="">Seleccione...</option>
                  <option *ngFor="let r of roles" [value]="r.id">{{ r.nombre }}</option>
                </select>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Nombres</label>
                <input type="text" [(ngModel)]="newUser.nombres" name="nombres" required />
              </div>
              <div class="form-group">
                <label>Apellidos</label>
                <input type="text" [(ngModel)]="newUser.apellidos" name="apellidos" required />
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
              <th>Usuario</th>
              <th>Nombre</th>
              <th>Email</th>
              <th>Rol</th>
              <th>Estado</th>
              <th>Último Acceso</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let u of usuarios">
              <td class="codigo">{{ u.nombreUsuario }}</td>
              <td>{{ u.nombres }} {{ u.apellidos }}</td>
              <td>{{ u.email }}</td>
              <td><span class="badge">{{ u.rolNombre }}</span></td>
              <td>{{ u.estado }}</td>
              <td>{{ (u.ultimoAcceso | date:'dd/MM/yyyy HH:mm') || '-' }}</td>
            </tr>
            <tr *ngIf="usuarios.length === 0">
              <td colspan="6" class="empty">No hay usuarios</td>
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
    .codigo { font-family: monospace; font-weight: 600; }
    .badge { padding: 3px 10px; border-radius: 12px; font-size: 0.75rem; background: #e8eaf6; color: #1a237e; }
    .empty { text-align: center; color: #999; padding: 20px; }
  `]
})
export class UsuarioListComponent implements OnInit {
  usuarios: UsuarioResponse[] = [];
  roles: RolResponse[] = [];
  showForm = false;

  newUser: UsuarioRequest = {
    nombreUsuario: '', email: '', contrasena: '', nombres: '', apellidos: '', rolId: ''
  };

  constructor(
    private service: UsuarioService,
    private rolService: RolService
  ) {}

  ngOnInit(): void {
    this.service.getAll().subscribe({ next: (data) => this.usuarios = data });
    this.rolService.getAll().subscribe({ next: (data) => this.roles = data });
  }

  onCreate(): void {
    this.service.create(this.newUser).subscribe({
      next: () => {
        this.showForm = false;
        this.service.getAll().subscribe({ next: (data) => this.usuarios = data });
      },
      error: () => alert('Error al crear usuario')
    });
  }
}
