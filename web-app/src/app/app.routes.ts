import { Routes } from '@angular/router';
import { authGuard, gerenteGuard } from './core/guards/auth.guard';
import { MainLayoutComponent } from './layouts/main-layout/main-layout.component';
import { LoginComponent } from './pages/login/login.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { HabitacionListComponent } from './pages/habitaciones/habitacion-list/habitacion-list.component';
import { HabitacionFormComponent } from './pages/habitaciones/habitacion-form/habitacion-form.component';
import { ClienteListComponent } from './pages/clientes/cliente-list/cliente-list.component';
import { ReservaListComponent } from './pages/reservas/reserva-list/reserva-list.component';
import { CheckInComponent } from './pages/reservas/check-in/check-in.component';
import { CheckOutComponent } from './pages/pagos/check-out/check-out.component';
import { PagoListComponent } from './pages/pagos/pago-list/pago-list.component';
import { LimpiezaListComponent } from './pages/limpieza/limpieza-list/limpieza-list.component';
import { ReportesComponent } from './pages/reportes/reportes.component';
import { UsuarioListComponent } from './pages/usuarios/usuario-list/usuario-list.component';
import { GastoListComponent } from './pages/gastos/gasto-list/gasto-list.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: 'dashboard', component: DashboardComponent },
      { path: 'habitaciones', component: HabitacionListComponent },
      { path: 'habitaciones/:id', component: HabitacionFormComponent },
      { path: 'reservas', component: ReservaListComponent },
      { path: 'check-in', component: CheckInComponent },
      { path: 'check-out', component: CheckOutComponent },
      { path: 'limpieza', component: LimpiezaListComponent },
      { path: 'clientes', component: ClienteListComponent, canActivate: [gerenteGuard] },
      { path: 'pagos', component: PagoListComponent, canActivate: [gerenteGuard] },
      { path: 'gastos', component: GastoListComponent, canActivate: [gerenteGuard] },
      { path: 'usuarios', component: UsuarioListComponent, canActivate: [gerenteGuard] },
      { path: 'reportes', component: ReportesComponent, canActivate: [gerenteGuard] },
      { path: '', redirectTo: '/dashboard', pathMatch: 'full' }
    ]
  },
  { path: '**', redirectTo: '/dashboard' }
];
