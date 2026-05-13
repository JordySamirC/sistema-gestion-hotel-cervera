import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { ClienteService } from '../../../core/services/cliente.service';
import { ClienteResponse, ClienteRequest } from '../../../core/models/cliente';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { phoneValidator } from '../../../core/utils/phone.validator';
import { infoPorNacionalidad } from '../../../core/utils/phone-utils';
import { of, Subject } from 'rxjs';
import { debounceTime, switchMap, catchError, map, distinctUntilChanged } from 'rxjs/operators';

const PAISES = [
  'Peruana', 'Argentina', 'Boliviana', 'Brasileña', 'Canadiense', 'Chilena',
  'Colombiana', 'Costarricense', 'Cubana', 'Dominicana', 'Ecuatoriana',
  'Estadounidense', 'Francesa', 'Guatemalteca', 'Haitiana', 'Hondureña',
  'Italiana', 'Japonesa', 'Mexicana', 'Nicaragüense', 'Panameña',
  'Paraguaya', 'Portuguesa', 'Puertorriqueña', 'Salvadoreña', 'Española',
  'Uruguaya', 'Venezolana', 'Alemana', 'Británica', 'China', 'Coreana',
  'India', 'Rusa', 'Sudafricana', 'Otra'
];

@Component({
  selector: 'app-cliente-list',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule, FormsModule],
  template: `
    <div class="page">
      <div class="page-header">
        <h2>Clientes</h2>
        <button class="btn-primary" (click)="toggleForm()">
          {{ showForm ? 'Cancelar' : 'Nuevo Cliente' }}
        </button>
      </div>

      <div class="card" *ngIf="showForm">
        <div class="card-body">
          <h3>{{ editandoId ? 'Editar Cliente' : 'Registrar Cliente' }}</h3>
          <p class="required-note">Los campos marcados con <span class="required">*</span> son obligatorios</p>
          <form [formGroup]="clienteForm" (ngSubmit)="editandoId ? onUpdate() : onCreate()" class="form">
            <div class="form-row">
              <div class="form-group">
                <label>Tipo Doc. <span class="required">*</span></label>
                <select formControlName="tipoDocumento">
                  <option value="DNI">DNI</option>
                  <option value="Pasaporte">Pasaporte</option>
                  <option value="Carn\u00E9 Extranjer\u00EDa">Carné Extranjería</option>
                </select>
              </div>
              <div class="form-group">
                <label>N° Documento <span class="required">*</span></label>
                <input type="text" formControlName="numeroDocumento" maxlength="20" />
                <span class="field-error" *ngIf="clienteForm.get('numeroDocumento')?.invalid && clienteForm.get('numeroDocumento')?.touched">
                  {{ getDocError() }}
                </span>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Nombres <span class="required">*</span></label>
                <input type="text" formControlName="nombres" />
                <span class="field-error" *ngIf="clienteForm.get('nombres')?.invalid && clienteForm.get('nombres')?.touched">
                  Solo letras, 2-50 caracteres
                </span>
              </div>
              <div class="form-group">
                <label>Apellidos <span class="required">*</span></label>
                <input type="text" formControlName="apellidos" />
                <span class="field-error" *ngIf="clienteForm.get('apellidos')?.invalid && clienteForm.get('apellidos')?.touched">
                  Solo letras, 2-50 caracteres
                </span>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Nacionalidad <span class="required">*</span></label>
                <select formControlName="nacionalidad">
                  <option value="">Seleccionar</option>
                  <option *ngFor="let p of paises" [value]="p">{{ p }}</option>
                </select>
                <span class="field-error" *ngIf="clienteForm.get('nacionalidad')?.invalid && clienteForm.get('nacionalidad')?.touched">
                  Seleccione una nacionalidad
                </span>
              </div>
              <div class="form-group">
                <label>Teléfono <span class="required">*</span></label>
                <div class="phone-input-group">
                  <span class="phone-prefix" [class.disabled]="!codigoPais">{{ codigoPais || '+' }}</span>
                  <input type="tel" formControlName="telefono" placeholder="Ingrese el número" />
                </div>
                <span class="field-error" *ngIf="clienteForm.get('telefono')?.invalid && clienteForm.get('telefono')?.touched">
                  {{ getTelefonoError() }}
                </span>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Email</label>
                <input type="email" formControlName="email" />
                <span class="field-error" *ngIf="clienteForm.get('email')?.invalid && clienteForm.get('email')?.touched">
                  {{ getEmailError() }}
                </span>
              </div>
              <div class="form-group">
                <label>Género <span class="required">*</span></label>
                <select formControlName="genero">
                  <option value="">Seleccionar</option>
                  <option value="Masculino">Masculino</option>
                  <option value="Femenino">Femenino</option>
                  <option value="No especificar">No especificar</option>
                </select>
                <span class="field-error" *ngIf="clienteForm.get('genero')?.invalid && clienteForm.get('genero')?.touched">
                  Seleccione un género
                </span>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Fecha de Nacimiento</label>
                <input type="date" formControlName="fechaNacimiento" />
                <span class="field-error" *ngIf="clienteForm.get('fechaNacimiento')?.errors?.['futureDate']">
                  La fecha no puede ser futura
                </span>
              </div>
              <div class="form-group" *ngIf="esMenorEdad">
                <label class="checkbox-inline">
                  <input type="checkbox" formControlName="acompanadoPorAdulto" />
                  ¿Viaja acompañado por adulto?
                </label>
                <span class="field-error" *ngIf="clienteForm.get('fechaNacimiento')?.errors?.['underage'] && !clienteForm.get('acompanadoPorAdulto')?.value">
                  Menor de edad requiere adulto responsable
                </span>
              </div>
            </div>
            <button type="submit" class="btn-primary" [disabled]="clienteForm.invalid">{{ editandoId ? 'Actualizar' : 'Guardar' }}</button>
          </form>
        </div>
      </div>

      <div class="search-bar">
        <input type="text" [(ngModel)]="searchTerm" (input)="filtrar()" placeholder="Buscar por nombre, DNI o nacionalidad..." class="search-input" />
      </div>

      <div class="table-container">
        <table class="table">
          <thead>
            <tr>
              <th>Documento</th>
              <th>Nombre</th>
              <th>Nacionalidad</th>
              <th>Género</th>
              <th>Teléfono</th>
              <th>Email</th>
              <th>Fecha Nac.</th>
              <th>Estado</th>
              <th>Estadías</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let c of clientesFiltrados">
              <td>{{ c.tipoDocumento }} {{ c.numeroDocumento }}</td>
              <td>{{ c.nombres }} {{ c.apellidos }}</td>
              <td>{{ c.nacionalidad }}</td>
              <td>{{ c.genero || '-' }}</td>
              <td>{{ c.telefono || '-' }}</td>
              <td>{{ c.email || '-' }}</td>
              <td>{{ c.fechaNacimiento ? (c.fechaNacimiento | date:'dd/MM/yyyy') : '-' }}</td>
              <td><span class="badge badge-{{ c.estado.toLowerCase() }}">{{ c.estado || 'ACTIVO' }}</span></td>
              <td>{{ c.vecesHospedado }}</td>
              <td>
                <button class="btn-sm btn-edit" (click)="editar(c)" *ngIf="auth.esGerente()">Editar</button>
                <button class="btn-sm btn-suspender" (click)="cambiarEstado(c, 'SUSPENDIDO')" *ngIf="auth.esGerente() && c.estado === 'ACTIVO'">Suspender</button>
                <button class="btn-sm btn-reactivar" (click)="cambiarEstado(c, 'ACTIVO')" *ngIf="auth.esGerente() && (c.estado === 'SUSPENDIDO' || c.estado === 'VETADO')">Reactivar</button>
                <button class="btn-sm btn-vetar" (click)="cambiarEstado(c, 'VETADO')" *ngIf="auth.esGerente() && c.estado === 'ACTIVO'">Vetar</button>
              </td>
            </tr>
            <tr *ngIf="clientesFiltrados.length === 0">
              <td colspan="10" class="empty">No hay clientes registrados</td>
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
    .checkbox-inline { display: flex; align-items: center; gap: 8px; font-size: 0.85rem; cursor: pointer; margin-top: 20px; }
    .checkbox-inline input { width: auto; }
    input, select { width: 100%; padding: 8px 10px; border: 1px solid #ddd; border-radius: 4px; font-size: 0.85rem; box-sizing: border-box; }
    .field-error { display: block; color: #c62828; font-size: 0.75rem; margin-top: 3px; }
    .required { color: #c62828; }
    .required-note { font-size: 0.75rem; color: #888; margin: -8px 0 12px; }
    .btn-primary { padding: 8px 20px; background: #1a237e; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.85rem; }
    .btn-primary:hover { background: #283593; }
    .btn-primary:disabled { background: #9fa8da; cursor: not-allowed; }
    .btn-sm { padding: 4px 10px; border: none; border-radius: 4px; cursor: pointer; font-size: 0.75rem; }
    .btn-edit { background: #e8eaf6; color: #1a237e; margin-right: 4px; }
    .btn-edit:hover { background: #c5cae9; }
    .btn-del { background: #fce4ec; color: #c62828; }
    .btn-del:hover { background: #f8bbd0; }
    .btn-suspender { background: #fff3e0; color: #e65100; margin-right: 4px; }
    .btn-suspender:hover { background: #ffe0b2; }
    .btn-reactivar { background: #e8f5e9; color: #2e7d32; margin-right: 4px; }
    .btn-reactivar:hover { background: #c8e6c9; }
    .btn-vetar { background: #fce4ec; color: #b71c1c; margin-right: 4px; }
    .btn-vetar:hover { background: #f8bbd0; }
    .badge { display: inline-block; padding: 3px 10px; border-radius: 12px; font-size: 0.75rem; font-weight: 600; }
    .badge-activo { background: #e8f5e9; color: #2e7d32; }
    .badge-suspendido { background: #fff3e0; color: #e65100; }
    .badge-vetado { background: #fce4ec; color: #b71c1c; }
    .search-bar { margin-bottom: 16px; }
    .search-input { width: 100%; max-width: 400px; padding: 10px 14px; border: 1px solid #ddd; border-radius: 8px; font-size: 0.85rem; box-sizing: border-box; }
    .search-input:focus { outline: none; border-color: #1a237e; }
    .phone-input-group { display: flex; align-items: stretch; }
    .phone-prefix { display: flex; align-items: center; padding: 0 10px; background: #f5f5f5; border: 1px solid #ddd; border-right: none; border-radius: 4px 0 0 4px; font-size: 0.85rem; color: #333; font-weight: 500; min-width: 38px; justify-content: center; }
    .phone-prefix.disabled { color: #bbb; background: #fafafa; }
    .phone-input-group input { border-radius: 0 4px 4px 0; flex: 1; }
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
  clientesFiltrados: ClienteResponse[] = [];
  showForm = false;
  editandoId: string | null = null;
  searchTerm = '';
  clienteForm: FormGroup;
  paises = PAISES;
  private documentoCheck$ = new Subject<void>();

  constructor(
    private service: ClienteService,
    public auth: AuthService,
    private fb: FormBuilder
  ) {
    this.clienteForm = this.fb.group({
      tipoDocumento: ['DNI', Validators.required],
      numeroDocumento: ['', [Validators.required, this.documentoValidator()]],
      nombres: ['', [Validators.required, Validators.pattern(/^[a-zA-ZáéíóúñÑü\s]{2,50}$/)]],
      apellidos: ['', [Validators.required, Validators.pattern(/^[a-zA-ZáéíóúñÑü\s]{2,50}$/)]],
      nacionalidad: ['', Validators.required],
      fechaNacimiento: ['', [this.ageValidator()]],
      telefono: ['', [Validators.required, phoneValidator(() => this.clienteForm?.get('nacionalidad')?.value)]],
      email: ['', [Validators.email]],
      genero: ['', Validators.required],
      acompanadoPorAdulto: [false]
    });

    this.documentoCheck$.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      switchMap(() => {
        const tipoDoc = this.clienteForm.get('tipoDocumento')?.value;
        const numDoc = this.clienteForm.get('numeroDocumento')?.value;
        if (!tipoDoc || !numDoc || this.clienteForm.get('numeroDocumento')?.invalid) return of(null);
        return this.service.buscar(tipoDoc, numDoc).pipe(
          map(cliente => {
            if (this.editandoId && cliente.id === this.editandoId) return null;
            return { duplicate: true };
          }),
          catchError(() => of(null))
        );
      })
    ).subscribe(dupError => this.setDuplicateError(dupError));

    this.clienteForm.get('numeroDocumento')?.valueChanges.subscribe(() => {
      this.documentoCheck$.next();
    });

    this.clienteForm.get('tipoDocumento')?.valueChanges.subscribe(() => {
      this.clienteForm.get('numeroDocumento')?.updateValueAndValidity();
      this.documentoCheck$.next();
    });

    this.clienteForm.get('acompanadoPorAdulto')?.valueChanges.subscribe(() => {
      this.clienteForm.get('fechaNacimiento')?.updateValueAndValidity({ emitEvent: false });
    });

    this.clienteForm.get('nacionalidad')?.valueChanges.subscribe(() => {
      this.clienteForm.get('telefono')?.updateValueAndValidity();
      this.clienteForm.get('telefono')?.reset();
    });
  }

  ngOnInit(): void {
    this.cargar();
  }

  get esMenorEdad(): boolean {
    const fn = this.clienteForm.get('fechaNacimiento')?.value;
    if (!fn) return false;
    const birth = new Date(fn);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const mDiff = today.getMonth() - birth.getMonth();
    if (mDiff < 0 || (mDiff === 0 && today.getDate() < birth.getDate())) age--;
    return age < 18;
  }

  documentoValidator() {
    return (control: AbstractControl): ValidationErrors | null => {
      const tipoDoc = this.clienteForm?.get('tipoDocumento')?.value;
      const value = control.value;
      if (!value) return { required: true };
      switch (tipoDoc) {
        case 'DNI': return /^[0-9]{8}$/.test(value) ? null : { pattern: true };
        case 'Pasaporte': return /^[A-Za-z0-9]{7,18}$/.test(value) ? null : { pattern: true };
        case 'Carné Extranjería': return /^[A-Za-z0-9]{9,12}$/.test(value) ? null : { pattern: true };
        default: return null;
      }
    };
  }

  ageValidator() {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      const birth = new Date(control.value);
      if (birth > new Date()) return { futureDate: true };
      let age = new Date().getFullYear() - birth.getFullYear();
      const mDiff = new Date().getMonth() - birth.getMonth();
      if (mDiff < 0 || (mDiff === 0 && new Date().getDate() < birth.getDate())) age--;
      if (age < 18) {
        const acompanado = this.clienteForm?.get('acompanadoPorAdulto')?.value;
        return acompanado ? null : { underage: true };
      }
      return null;
    };
  }

  get codigoPais(): string {
    const nac = this.clienteForm?.get('nacionalidad')?.value;
    return infoPorNacionalidad(nac)?.codigo || '';
  }

  private setDuplicateError(err: ValidationErrors | null): void {
    const ctrl = this.clienteForm.get('numeroDocumento');
    if (!ctrl) return;
    const current = ctrl.errors || {};
    if (err) {
      ctrl.setErrors({ ...current, ...err }, { emitEvent: false });
    } else if (current['duplicate']) {
      const { duplicate, ...rest } = current;
      ctrl.setErrors(Object.keys(rest).length ? rest : null, { emitEvent: false });
    }
  }

  getDocError(): string {
    const ctrl = this.clienteForm.get('numeroDocumento');
    if (ctrl?.errors?.['required']) return 'N° documento es obligatorio';
    if (ctrl?.errors?.['duplicate']) return 'Este documento ya está registrado';
    if (ctrl?.errors?.['pattern']) {
      const tipo = this.clienteForm.get('tipoDocumento')?.value;
      if (tipo === 'DNI') return 'DNI debe tener 8 dígitos';
      if (tipo === 'Pasaporte') return 'Pasaporte debe tener 7-18 caracteres alfanuméricos';
      if (tipo === 'Carné Extranjería') return 'Carné de Extranjería debe tener 9-12 caracteres alfanuméricos';
      return 'Formato de documento inválido';
    }
    return '';
  }

  getTelefonoError(): string {
    const ctrl = this.clienteForm.get('telefono');
    if (ctrl?.errors?.['required']) return 'Teléfono es obligatorio';
    if (ctrl?.errors?.['invalidPhone']) return `Número inválido para la nacionalidad seleccionada`;
    return '';
  }

  getEmailError(): string {
    const ctrl = this.clienteForm.get('email');
    if (ctrl?.errors?.['email']) return 'Email inválido';
    return '';
  }

  private cargar(): void {
    this.service.getAll().subscribe({
      next: (data) => {
        this.clientes = data;
        this.filtrar();
      },
      error: (err) => alert('Error al cargar clientes: ' + err.message)
    });
  }

  filtrar(): void {
    const term = this.searchTerm.toLowerCase().trim();
    this.clientesFiltrados = this.clientes.filter(c =>
      !term ||
      c.nombres.toLowerCase().includes(term) ||
      c.apellidos.toLowerCase().includes(term) ||
      c.numeroDocumento.includes(term) ||
      c.nacionalidad.toLowerCase().includes(term)
    );
  }

  private buildRequest(): ClienteRequest {
    const telefonoRaw = this.clienteForm.get('telefono')?.value || '';
    const nac = this.clienteForm.get('nacionalidad')?.value;
    const info = infoPorNacionalidad(nac);
    const telefono = info ? `${info.codigo}${telefonoRaw}` : telefonoRaw;
    return {
      tipoDocumento: this.clienteForm.get('tipoDocumento')?.value,
      numeroDocumento: this.clienteForm.get('numeroDocumento')?.value,
      nombres: this.clienteForm.get('nombres')?.value,
      apellidos: this.clienteForm.get('apellidos')?.value,
      nacionalidad: this.clienteForm.get('nacionalidad')?.value,
      genero: this.clienteForm.get('genero')?.value,
      telefono,
      email: this.clienteForm.get('email')?.value || null,
      fechaNacimiento: this.clienteForm.get('fechaNacimiento')?.value || null
    };
  }

  onCreate(): void {
    if (this.clienteForm.invalid) return;
    this.service.create(this.buildRequest()).subscribe({
      next: () => {
        this.cargar();
        this.resetForm();
      },
      error: (err) => alert('Error al crear cliente: ' + err.message)
    });
  }

  editar(c: ClienteResponse): void {
    this.editandoId = c.id;
    const info = infoPorNacionalidad(c.nacionalidad);
    const telefonoLocal = info && c.telefono?.startsWith(info.codigo)
      ? c.telefono.slice(info.codigo.length) : c.telefono;
    this.clienteForm.patchValue({
      tipoDocumento: c.tipoDocumento,
      numeroDocumento: c.numeroDocumento,
      nombres: c.nombres,
      apellidos: c.apellidos,
      nacionalidad: c.nacionalidad,
      genero: c.genero,
      telefono: telefonoLocal,
      email: c.email || '',
      fechaNacimiento: c.fechaNacimiento ? c.fechaNacimiento.substring(0, 10) : '',
      acompanadoPorAdulto: false
    }, { emitEvent: false });
    this.setDuplicateError(null);
    this.clienteForm.get('numeroDocumento')?.updateValueAndValidity();
    this.clienteForm.get('fechaNacimiento')?.updateValueAndValidity();
    this.showForm = true;
  }

  onUpdate(): void {
    if (!this.editandoId || this.clienteForm.invalid) return;
    this.service.update(this.editandoId, this.buildRequest()).subscribe({
      next: () => {
        this.cargar();
        this.resetForm();
      },
      error: (err) => alert('Error al actualizar cliente: ' + err.message)
    });
  }

  cambiarEstado(c: ClienteResponse, nuevoEstado: string): void {
    const msg = nuevoEstado === 'ACTIVO' ? `¿Reactivar a ${c.nombres} ${c.apellidos}?`
      : nuevoEstado === 'SUSPENDIDO' ? `¿Suspender a ${c.nombres} ${c.apellidos}?`
      : `¿Vetar a ${c.nombres} ${c.apellidos}?`;
    if (!confirm(msg)) return;
    this.service.cambiarEstado(c.id, nuevoEstado).subscribe({
      next: (actualizado) => {
        const idx = this.clientes.findIndex(x => x.id === c.id);
        if (idx !== -1) this.clientes[idx] = actualizado;
        this.filtrar();
      },
      error: (err) => alert('Error al cambiar estado: ' + err.message)
    });
  }

  toggleForm(): void {
    this.showForm = !this.showForm;
    if (this.showForm) {
      this.editandoId = null;
      this.clienteForm.reset({ tipoDocumento: 'DNI', acompanadoPorAdulto: false });
    }
  }

  private resetForm(): void {
    this.showForm = false;
    this.editandoId = null;
    this.clienteForm.reset({ tipoDocumento: 'DNI', acompanadoPorAdulto: false });
  }
}
