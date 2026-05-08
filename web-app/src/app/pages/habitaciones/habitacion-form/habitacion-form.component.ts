import { Component, OnInit } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HabitacionService } from '../../../core/services/habitacion.service';
import { HabitacionResponse, HabitacionRequest, TipoHabitacionResponse } from '../../../core/models/habitacion';

@Component({
  selector: 'app-habitacion-form',
  standalone: true,
  imports: [NgFor, NgIf, RouterLink, FormsModule],
  template: `
    <div class="page">
      <a routerLink="/habitaciones" class="back-link">← Volver</a>
      <h2>{{ isEdit ? 'Editar' : 'Nueva' }} Habitación</h2>
      <form (ngSubmit)="onSubmit()" class="form" *ngIf="tipos.length > 0">
        <div class="form-group">
          <label>Número</label>
          <input type="text" [(ngModel)]="request.numero" name="numero" required maxlength="10" />
        </div>
        <div class="form-group">
          <label>Piso</label>
          <select [(ngModel)]="request.piso" name="piso" required>
            <option [value]="2">Piso 2</option>
            <option [value]="3">Piso 3</option>
          </select>
        </div>
        <div class="form-group">
          <label>Tipo</label>
          <select [(ngModel)]="request.tipoId" name="tipoId" required>
            <option *ngFor="let t of tipos" [value]="t.id">{{ t.nombre }}</option>
          </select>
        </div>
        <div class="form-group">
          <label>Notas</label>
          <textarea [(ngModel)]="request.notas" name="notas" rows="3"></textarea>
        </div>
        <button type="submit" class="btn-primary">{{ isEdit ? 'Actualizar' : 'Crear' }}</button>
      </form>
    </div>
  `,
  styles: [`
    .page { max-width: 500px; }
    .back-link { color: #1a237e; text-decoration: none; font-size: 0.85rem; display: inline-block; margin-bottom: 16px; }
    h2 { margin: 0 0 20px; font-size: 1.3rem; color: #333; }
    .form { background: white; padding: 24px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
    .form-group { margin-bottom: 16px; }
    label { display: block; margin-bottom: 6px; font-size: 0.85rem; color: #555; font-weight: 500; }
    input, select, textarea { width: 100%; padding: 10px 12px; border: 1px solid #ddd; border-radius: 6px; font-size: 0.9rem; box-sizing: border-box; }
    input:focus, select:focus, textarea:focus { outline: none; border-color: #1a237e; }
    .btn-primary { padding: 10px 24px; background: #1a237e; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 0.9rem; }
    .btn-primary:hover { background: #283593; }
  `]
})
export class HabitacionFormComponent implements OnInit {
  isEdit = false;
  habitacionId: string | null = null;
  tipos: TipoHabitacionResponse[] = [];
  tiposSeleccionados: string[] = [];
  request: HabitacionRequest = { numero: '', piso: 2, tipoId: '', notas: '' };

  constructor(
    private service: HabitacionService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.habitacionId = this.route.snapshot.paramMap.get('id');
    this.isEdit = !!this.habitacionId;

    this.service.getTiposHabitacion().subscribe({
      next: (tipos) => {
        this.tipos = tipos;
        if (this.isEdit && this.habitacionId) {
          this.service.getById(this.habitacionId).subscribe({
            next: (h) => {
              this.request = { numero: h.numero, piso: h.piso, tipoId: h.tipoId, notas: h.notas };
            }
          });
        }
      }
    });
  }

  onSubmit(): void {
    const obs = this.isEdit
      ? this.service.update(this.habitacionId!, this.request)
      : this.service.create(this.request);

    obs.subscribe({
      next: () => this.router.navigate(['/habitaciones']),
      error: () => alert('Error al guardar la habitación')
    });
  }
}
