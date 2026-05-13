import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PrecioHistoricoService } from '../../core/services/precio-historico.service';
import { HabitacionService } from '../../core/services/habitacion.service';
import { TipoHabitacionResponse, PrecioHistoricoResponse, PrecioHistoricoRequest } from '../../core/models/habitacion';

interface TipoConPrecio {
  tipo: TipoHabitacionResponse;
  precioActual: number | null;
  precioId: string | null;
  editando: boolean;
  nuevoPrecio: number;
}

@Component({
  selector: 'app-precio-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <div class="page-header">
        <h2>Precios por tipo de habitación</h2>
        <span class="subtitle">Establece el precio por noche para cada tipo</span>
      </div>

      <div class="info-card">
        <span class="info-icon">💡</span>
        <span>Los precios se actualizan al instante. Las reservas existentes mantienen el precio vigente al momento de su creación.</span>
      </div>

      <div class="precios-grid">
        <div class="tipo-card" *ngFor="let item of tiposConPrecio">
          <div class="tipo-header">
            <span class="tipo-nombre">{{ item.tipo.nombre }}</span>
            <span class="tipo-capacidad">{{ item.tipo.capacidadMax }} cama{{ item.tipo.capacidadMax > 1 ? 's' : '' }}</span>
          </div>

          <div class="tipo-precio" *ngIf="!item.editando">
            <span class="precio-actual-label">Precio por noche</span>
            <span class="precio-actual-valor" [class.sin-precio]="!item.precioActual">
              {{ item.precioActual ? ('S/ ' + item.precioActual) : 'Sin precio' }}
            </span>
          </div>

          <div class="tipo-editar" *ngIf="item.editando">
            <label class="edit-label">Nuevo precio (S/)</label>
            <div class="edit-row">
              <input type="number" [(ngModel)]="item.nuevoPrecio" class="edit-input" min="1" step="0.5" placeholder="0.00">
              <button class="btn-guardar" (click)="guardarPrecio(item)" [disabled]="!item.nuevoPrecio || item.nuevoPrecio <= 0">Guardar</button>
              <button class="btn-cancelar" (click)="cancelarEdicion(item)">Cancelar</button>
            </div>
          </div>

          <div class="tipo-actions" *ngIf="!item.editando">
            <button class="btn-editar" (click)="iniciarEdicion(item)">Cambiar precio</button>
          </div>
        </div>
      </div>

      <div class="empty-state" *ngIf="tiposConPrecio.length === 0">
        Cargando tipos de habitación...
      </div>
    </div>
  `,
  styles: [`
    .page { }
    .page-header { margin-bottom: 20px; }
    .page-header h2 { margin: 0 0 4px; font-size: 1.3rem; color: #333; }
    .subtitle { font-size: 0.85rem; color: #888; }
    .info-card { display: flex; align-items: center; gap: 12px; background: #e3f2fd; border: 1px solid #bbdefb; border-radius: 8px; padding: 12px 16px; margin-bottom: 24px; font-size: 0.85rem; color: #1565c0; }
    .info-icon { font-size: 1.3rem; }
    .precios-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; }
    .tipo-card { background: white; border-radius: 10px; padding: 20px; box-shadow: 0 1px 4px rgba(0,0,0,0.08); border: 1px solid #eee; }
    .tipo-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid #f0f0f0; }
    .tipo-nombre { font-size: 1.1rem; font-weight: 600; color: #1a237e; text-transform: capitalize; }
    .tipo-capacidad { font-size: 0.75rem; color: #888; background: #f5f5f5; padding: 3px 10px; border-radius: 12px; }
    .tipo-precio { margin-bottom: 16px; }
    .precio-actual-label { display: block; font-size: 0.75rem; color: #999; margin-bottom: 4px; }
    .precio-actual-valor { font-size: 1.8rem; font-weight: 700; color: #2e7d32; }
    .precio-actual-valor.sin-precio { color: #bdbdbd; font-weight: 400; font-size: 1rem; }
    .tipo-editar { margin-bottom: 16px; }
    .edit-label { display: block; font-size: 0.75rem; color: #999; margin-bottom: 6px; }
    .edit-row { display: flex; gap: 8px; align-items: center; }
    .edit-input { flex: 1; padding: 8px 12px; border: 2px solid #1a237e; border-radius: 6px; font-size: 1rem; font-weight: 600; outline: none; }
    .edit-input:focus { border-color: #3949ab; }
    .btn-guardar { padding: 8px 16px; background: #1a237e; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 500; font-size: 0.85rem; }
    .btn-guardar:disabled { background: #9fa8da; cursor: not-allowed; }
    .btn-guardar:hover:not(:disabled) { background: #283593; }
    .btn-cancelar { padding: 8px 12px; background: transparent; color: #666; border: 1px solid #ddd; border-radius: 6px; cursor: pointer; font-size: 0.85rem; }
    .btn-cancelar:hover { background: #f5f5f5; }
    .tipo-actions { }
    .btn-editar { padding: 8px 16px; background: #e8eaf6; color: #1a237e; border: none; border-radius: 6px; cursor: pointer; font-size: 0.85rem; font-weight: 500; }
    .btn-editar:hover { background: #c5cae9; }
    .empty-state { text-align: center; color: #999; padding: 40px; }
  `]
})
export class PrecioListComponent implements OnInit {
  tiposConPrecio: TipoConPrecio[] = [];

  constructor(
    private precioService: PrecioHistoricoService,
    private habitacionService: HabitacionService
  ) {}

  ngOnInit(): void {
    this.cargarDatos();
  }

  private cargarDatos(): void {
    this.habitacionService.getTiposHabitacion().subscribe({
      next: (tipos) => {
        this.tiposConPrecio = tipos.map(t => ({
          tipo: t,
          precioActual: null,
          precioId: null,
          editando: false,
          nuevoPrecio: 0
        }));
        this.cargarPreciosVigentes();
      }
    });
  }

  private cargarPreciosVigentes(): void {
    const today = new Date().toISOString().split('T')[0];
    this.tiposConPrecio.forEach(item => {
      this.precioService.getVigente(item.tipo.id, today).subscribe({
        next: (res) => {
          item.precioActual = res['precioNoche'];
        },
        error: () => {
          item.precioActual = null;
        }
      });
    });
  }

  iniciarEdicion(item: TipoConPrecio): void {
    item.editando = true;
    item.nuevoPrecio = item.precioActual || 0;
  }

  cancelarEdicion(item: TipoConPrecio): void {
    item.editando = false;
    item.nuevoPrecio = 0;
  }

  guardarPrecio(item: TipoConPrecio): void {
    if (!item.nuevoPrecio || item.nuevoPrecio <= 0) return;

    const request: PrecioHistoricoRequest = {
      tipoHabitacionId: item.tipo.id,
      precioNoche: item.nuevoPrecio,
      fechaInicio: new Date().toISOString().split('T')[0],
      createdBy: 'gerente'
    };

    this.precioService.create(request).subscribe({
      next: () => {
        item.precioActual = item.nuevoPrecio;
        item.editando = false;
        item.nuevoPrecio = 0;
      }
    });
  }
}
