# WebApp — Sistema de Gestión Hotelera

Frontend del **Sistema de Gestión Hotelera** para el **Hotel Cervera Rio Santiago** (Servicios Generales Cervera E.I.R.L.).

Desarrollado como proyecto del Curso Integrador II (46368).

## Stack

| Capa | Tecnología |
|------|-----------|
| Framework | Angular 18 |
| UI | Angular Material |
| Autenticación | JWT |
| Hosting | Render (Free Tier) |

## Requisitos

- Node.js 20+
- Angular CLI 18: `npm install -g @angular/cli`
- Backend corriendo en `http://localhost:8080`

## Instalación

```bash
npm install
```

## Desarrollo

```bash
ng serve
```

Navegar a `http://localhost:4200/`. La aplicación se recarga automáticamente al cambiar archivos.

## Build

```bash
ng build
```

Los artefactos se generan en `dist/`.

## Módulos

| Módulo | Descripción |
|--------|-------------|
| Login | Autenticación JWT con roles (gerente / limpieza) |
| Dashboard | Panel con ocupación, ingresos y alertas |
| Habitaciones | CRUD + cambio de estado (disponible, ocupada, por limpiar, etc.) |
| Reservas | Crear reservas con múltiples habitaciones y validación de disponibilidad |
| Check-in / Check-out | Flujo completo con cálculo automático de noches y monto total |
| Pagos | Registro de pago al check-out (100%) |
| Limpieza | Lista de habitaciones por limpiar, iniciar/terminar limpieza |
| Clientes | Registro de huéspedes (nombre, DNI/pasaporte, nacionalidad, teléfono) |
| Usuarios | Gestión de usuarios del sistema (gerente y limpieza) |
| Gastos | Registro de gastos operativos |
| Reportes | Ocupación, ingresos, habitaciones más rentables, clientes frecuentes |
| Exportar CSV | Archivo formato SUNAT PLE para el contador |

## Roles

| Rol | Acceso |
|-----|--------|
| **Gerente** | Total: reservas, check-in/out, pagos, reportes, usuarios, configuración |
| **Limpieza** | Solo ver habitaciones por limpiar, iniciar/terminar limpieza. No ve datos de huéspedes ni precios |

## 📄 Licencia

Copyright (c) 2026 Hotel Cervera Rio Santiago S.A.
