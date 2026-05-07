# Sistema de Gestión Hotel Cervera

![Java](https://img.shields.io/badge/Java-17-blue?logo=java)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-4.0-green?logo=springboot)
![Angular](https://img.shields.io/badge/Angular-18-red?logo=angular)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue?logo=postgresql)
![JWT](https://img.shields.io/badge/JWT-black?logo=jsonwebtokens)
![License](https://img.shields.io/badge/License-MIT-blue)

Sistema integral de gestión para el **Hotel Cervera Rio Santiago**. Incluye backend API REST con autenticación JWT y frontend web moderno.

## 📦 Módulos

| Módulo | Tecnología | Descripción |
|:---|---:|:---|
| `api-rest/` | Spring Boot 4.0 + JWT + PostgreSQL | API RESTful con 12 entidades, autenticación JWT, documentación OpenAPI |
| `web-app/` | Angular 18 | Frontend SPA con 22 componentes standalone, lazy loading |

## 🚀 Inicio Rápido

### Backend

```bash
cd api-rest/hotel_cervera_api
cp .env.example .env        # Configurar variables de entorno
./mvnw spring-boot:run      # Inicia en http://localhost:8080
```

### Frontend

```bash
cd web-app
npm install
ng serve                   # Inicia en http://localhost:4200
```

## 📚 Documentación

- [Swagger UI (API)](http://localhost:8080/swagger-ui.html) — Documentación interactiva
- [OpenAPI JSON](http://localhost:8080/v3/api-docs) — Especificación importable a Postman

## 🏗️ Construido Con

| Tecnología | Versión |
|:---|---:|
| Java | 17 |
| Spring Boot | 4.0.6 |
| Angular | 18.2 |
| PostgreSQL | 16 |
| Spring Security + JWT | — |
| Springdoc OpenAPI | 2.5.0 |

## 📄 Licencia

Copyright (c) 2026 Hotel Cervera Rio Santiago S.A.
