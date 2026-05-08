import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReservaService } from '../../../core/services/reserva.service';
import { PagoService } from '../../../core/services/pago.service';
import { EstadiaResponse } from '../../../core/models/reserva';
import { PagoRequest } from '../../../core/models/pago';

@Component({
  selector: 'app-check-out',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <h2>Check-Out</h2>
      <p class="subtitle">Registrar salida y cobrar</p>

      <div class="card">
        <div class="card-body">
          <div class="form-row">
            <div class="form-group">
              <label>Buscar por código de reserva o habitación</label>
              <input type="text" [(ngModel)]="codigoBusqueda" placeholder="Código de reserva" />
            </div>
            <button class="btn-primary" (click)="buscar()">Buscar</button>
          </div>
        </div>
      </div>

      <div class="card" *ngIf="estadiaSeleccionada">
        <div class="card-header">
          <h3>Estadía: {{ estadiaSeleccionada.reservaCodigo }}</h3>
        </div>
        <div class="card-body">
          <div class="info-grid">
            <div class="info-item">
              <label>Check-In</label>
              <span>{{ estadiaSeleccionada.fechaCheckIn | date:'dd/MM/yyyy HH:mm' }}</span>
            </div>
            <div class="info-item">
              <label>Noches</label>
              <span class="highlight">{{ estadiaSeleccionada.noches }}</span>
            </div>
            <div class="info-item">
              <label>Total a Pagar</label>
              <span class="price">S/ {{ estadiaSeleccionada.montoTotal }}</span>
            </div>
          </div>

          <h4>Registrar Pago</h4>
          <form (ngSubmit)="onPagar()" class="form">
            <div class="form-row">
              <div class="form-group">
                <label>Monto Total</label>
                <input type="number" [(ngModel)]="pago.montoTotal" name="monto" required step="0.01" />
              </div>
              <div class="form-group">
                <label>Método de Pago</label>
                <select [(ngModel)]="pago.metodoPago" name="metodo">
                  <option value="Efectivo">Efectivo</option>
                  <option value="Transferencia">Transferencia</option>
                  <option value="Tarjeta">Tarjeta</option>
                  <option value="Yape">Yape</option>
                  <option value="Plin">Plin</option>
                </select>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Tipo Comprobante</label>
                <select [(ngModel)]="pago.tipoComprobante" name="tc">
                  <option value="FAC">Factura</option>
                  <option value="BOL">Boleta</option>
                  <option value="TIC">Ticket</option>
                </select>
              </div>
              <div class="form-group">
                <label>N° Comprobante</label>
                <input type="text" [(ngModel)]="pago.comprobanteNumero" name="comp" required maxlength="20" />
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Serie</label>
                <input type="text" [(ngModel)]="pago.serie" name="serie" required />
              </div>
              <div class="form-group">
                <label>Número</label>
                <input type="number" [(ngModel)]="pago.numero" name="num" required />
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Monto Neto</label>
                <input type="number" [(ngModel)]="pago.montoNeto" name="neto" required step="0.01" />
              </div>
              <div class="form-group">
                <label>IGV (18%)</label>
                <input type="number" [(ngModel)]="pago.igv" name="igv" required step="0.01" />
              </div>
            </div>
            <div class="form-group">
              <label>RUC / Razón Social</label>
              <input type="text" [(ngModel)]="pago.rucRazonSocial" name="ruc" />
            </div>
            <button type="submit" class="btn-success">Confirmar Pago y Check-Out</button>
          </form>
        </div>
      </div>

      <div class="table-container" *ngIf="estadiasActivas.length > 0 && !estadiaSeleccionada">
        <h3>Estadías Activas</h3>
        <table class="table">
          <thead>
            <tr>
              <th>Código</th>
              <th>Check-In</th>
              <th>Noches</th>
              <th>Total</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let e of estadiasActivas">
              <td class="codigo">{{ e.reservaCodigo }}</td>
              <td>{{ e.fechaCheckIn | date:'dd/MM/yyyy' }}</td>
              <td>{{ e.noches }}</td>
              <td>S/ {{ e.montoTotal }}</td>
              <td><button class="btn-primary" (click)="seleccionarEstadia(e)">Check-Out</button></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .page { }
    h2 { margin: 0 0 4px; font-size: 1.3rem; color: #333; }
    .subtitle { color: #888; font-size: 0.85rem; margin-bottom: 20px; }
    .card { background: white; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); margin-bottom: 20px; }
    .card-header { padding: 16px 20px; border-bottom: 1px solid #eee; }
    .card-header h3 { margin: 0; font-size: 1rem; color: #333; }
    .card-body { padding: 20px; }
    .card-body h4 { margin: 20px 0 16px; font-size: 0.95rem; color: #333; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .form-group { margin-bottom: 12px; }
    label { display: block; margin-bottom: 4px; font-size: 0.8rem; color: #555; }
    input, select { width: 100%; padding: 8px 10px; border: 1px solid #ddd; border-radius: 4px; font-size: 0.85rem; box-sizing: border-box; }
    .btn-primary { padding: 8px 20px; background: #1a237e; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.85rem; white-space: nowrap; }
    .btn-success { padding: 10px 24px; background: #2e7d32; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.9rem; margin-top: 8px; }
    .info-grid { display: flex; gap: 24px; }
    .info-item { display: flex; flex-direction: column; }
    .info-item label { font-size: 0.75rem; color: #888; text-transform: uppercase; }
    .info-item span { font-size: 1rem; font-weight: 600; color: #333; }
    .highlight { color: #e65100; }
    .price { color: #1a237e; font-size: 1.3rem; }
    .table-container { background: white; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); padding: 20px; }
    .table-container h3 { margin: 0 0 16px; font-size: 1rem; color: #333; }
    .table { width: 100%; border-collapse: collapse; }
    .table th, .table td { padding: 12px 16px; text-align: left; font-size: 0.85rem; border-bottom: 1px solid #f0f0f0; }
    .table th { background: #fafafa; color: #666; font-weight: 600; }
    .codigo { font-weight: 600; color: #1a237e; font-family: monospace; }
  `]
})
export class CheckOutComponent implements OnInit {
  estadiasActivas: EstadiaResponse[] = [];
  estadiaSeleccionada: EstadiaResponse | null = null;
  codigoBusqueda = '';

  pago: PagoRequest = {
    estadiaId: '', comprobanteNumero: '', montoTotal: 0, metodoPago: 'Efectivo',
    tipoComprobante: 'BOL', serie: 'B001', numero: 1,
    montoNeto: 0, igv: 0, rucRazonSocial: ''
  };

  constructor(
    private reservaService: ReservaService,
    private pagoService: PagoService
  ) {}

  ngOnInit(): void {
    this.reservaService.getEstadiasActivas().subscribe({
      next: (data) => this.estadiasActivas = data
    });
  }

  buscar(): void {
    if (!this.codigoBusqueda) return;
    this.reservaService.getEstadiaPorReserva(this.codigoBusqueda).subscribe({
      next: (estadia) => this.seleccionarEstadia(estadia),
      error: () => alert('Estadía no encontrada')
    });
  }

  seleccionarEstadia(e: EstadiaResponse): void {
    this.estadiaSeleccionada = e;
    this.pago.estadiaId = e.id;
    this.pago.montoTotal = e.montoTotal;
    this.pago.montoNeto = +(e.montoTotal / 1.18).toFixed(2);
    this.pago.igv = +(e.montoTotal - this.pago.montoNeto).toFixed(2);
  }

  onPagar(): void {
    this.pagoService.create(this.pago).subscribe({
      next: () => {
        this.reservaService.checkOut(this.estadiaSeleccionada!.id).subscribe({
          next: () => {
            alert('Check-Out y pago registrados exitosamente');
            this.estadiaSeleccionada = null;
            this.ngOnInit();
          }
        });
      },
      error: () => alert('Error al registrar el pago')
    });
  }
}
