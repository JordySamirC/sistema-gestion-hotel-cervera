import { Routes } from '@angular/router';
import { authGuard, gerenteGuard } from './core/guards/auth.guard';
import { MainLayoutComponent } from './layouts/main-layout/main-layout.component';
import { LoginComponent } from './pages/login/login.component';
import { ResetPasswordComponent } from './pages/reset-password/reset-password.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { HabitacionListComponent } from './pages/habitaciones/habitacion-list/habitacion-list.component';
import { ClienteListComponent } from './pages/clientes/cliente-list/cliente-list.component';
import { PanelReservasComponent } from './pages/reservas/panel-reservas/panel-reservas.component';
import { ReservaFormComponent } from './pages/reservas/reserva-form/reserva-form.component';
import { ReservaDetailComponent } from './pages/reservas/reserva-detail/reserva-detail.component';
import { GrupoFormComponent } from './pages/reservas/grupo-form/grupo-form.component';
import { CheckInComponent } from './pages/reservas/check-in/check-in.component';
import { CheckOutComponent } from './pages/pagos/check-out/check-out.component';
import { PagoListComponent } from './pages/pagos/pago-list/pago-list.component';
import { LimpiezaListComponent } from './pages/limpieza/limpieza-list/limpieza-list.component';
import { ReportesComponent } from './pages/reportes/reportes.component';
import { UsuarioListComponent } from './pages/usuarios/usuario-list/usuario-list.component';
import { GastoListComponent } from './pages/gastos/gasto-list/gasto-list.component';
import { PrecioListComponent } from './pages/precios/precio-list.component';
import { RestriccionesFechaListComponent } from './pages/restricciones-fecha/restricciones-fecha-list.component';
import { ConfiguracionComponent } from './pages/configuracion/configuracion.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'reset-password', component: ResetPasswordComponent },
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: 'panel', component: DashboardComponent },
      { path: 'habitaciones', component: HabitacionListComponent },
      { path: 'reservas', component: PanelReservasComponent },
      { path: 'reservas/individual/nueva', component: ReservaFormComponent },
      { path: 'reservas/grupo/nuevo', component: GrupoFormComponent },
      { path: 'reservas/:id', component: ReservaDetailComponent },
      { path: 'registrar-ingreso', component: CheckInComponent },
      { path: 'registrar-salida', component: CheckOutComponent },
      { path: 'limpieza', component: LimpiezaListComponent },
      { path: 'clientes', component: ClienteListComponent, canActivate: [gerenteGuard] },
      { path: 'pagos', component: PagoListComponent, canActivate: [gerenteGuard] },
      { path: 'gastos', component: GastoListComponent, canActivate: [gerenteGuard] },
      { path: 'precios', component: PrecioListComponent, canActivate: [gerenteGuard] },
      { path: 'restricciones-fecha', component: RestriccionesFechaListComponent, canActivate: [gerenteGuard] },
      { path: 'usuarios', component: UsuarioListComponent, canActivate: [gerenteGuard] },
      { path: 'reportes', component: ReportesComponent, canActivate: [gerenteGuard] },
      { path: 'configuracion', component: ConfiguracionComponent },
      { path: '', redirectTo: '/panel', pathMatch: 'full' }
    ]
  },
  { path: '**', redirectTo: '/panel' }
];
