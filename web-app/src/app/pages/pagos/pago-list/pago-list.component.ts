import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PagoService } from '../../../core/services/pago.service';
import { PagoResponse } from '../../../core/models/pago';

@Component({
  selector: 'app-pago-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page">
      <h2>Historial de Pagos</h2>
      <p class="subtitle">Registro de todos los pagos realizados</p>

      <div class="table-container">
        <table class="table">
          <thead>
            <tr>
              <th>Comprobante</th>
              <th>Fecha</th>
              <th>Total</th>
              <th>Método</th>
              <th>Tipo</th>
              <th>Neto</th>
              <th>IGV</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let p of pagos">
              <td class="codigo">{{ p.comprobanteNumero }}</td>
              <td>{{ p.fechaPago | date:'dd/MM/yyyy HH:mm' }}</td>
              <td class="monto">S/ {{ p.montoTotal }}</td>
              <td>{{ p.metodoPago }}</td>
              <td>{{ p.tipoComprobante }}</td>
              <td>S/ {{ p.montoNeto }}</td>
              <td>S/ {{ p.igv }}</td>
            </tr>
            <tr *ngIf="pagos.length === 0">
              <td colspan="7" class="empty">No hay pagos registrados</td>
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
    .table-container { background: white; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); overflow-x: auto; }
    .table { width: 100%; border-collapse: collapse; }
    .table th, .table td { padding: 12px 16px; text-align: left; font-size: 0.85rem; border-bottom: 1px solid #f0f0f0; }
    .table th { background: #fafafa; color: #666; font-weight: 600; }
    .codigo { font-family: monospace; font-weight: 600; color: #1a237e; }
    .monto { font-weight: 600; color: #2e7d32; }
    .empty { text-align: center; color: #999; padding: 20px; }
  `]
})
export class PagoListComponent implements OnInit {
  pagos: PagoResponse[] = [];

  constructor(private service: PagoService) {}

  ngOnInit(): void {
    this.service.getAll().subscribe({ next: (data) => this.pagos = data });
  }
}
