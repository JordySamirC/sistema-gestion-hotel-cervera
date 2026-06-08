# Hallazgos de Seguridad — Sistema Gestión Hotel Cervera

> **Auditoría completa backend + frontend + infraestructura**
> Fecha: 2026-06-07 | Metodología: OWASP Top 10 (2021) + análisis estático de código
> Archivos revisados: ~80 | Líneas de código: ~56,000

---

## Score de Riesgo Global

| Métrica | Backend | Frontend | Total |
|---------|---------|----------|-------|
| **CRITICAL** | 4 | 1 | **5** |
| **HIGH** | 8 | 4 | **12** |
| **MEDIUM** | 7 | 2 | **9** |
| **LOW** | 4 | 0 | **4** |
| **TOTAL** | **23** | **7** | **30** |

**Veredicto: ⚠️ NO APTO PARA PRODUCCIÓN**

El proyecto requiere remediación crítica antes de cualquier exposición a internet.

---

## Resumen Ejecutivo

Se auditaron ~80 archivos (~56,000 líneas) entre backend Spring Boot 4.0.6, frontend Angular 18.2 e infraestructura (Docker, Nginx, PostgreSQL). Se identificaron **30 hallazgos** de seguridad: **5 críticos**, **12 altos**, **9 medios**, **4 bajos**.

Los **5 críticos** son:
1. **Endpoint público `/api/auth/diagnostico`** — expone DB + usuarios sin autenticación
2. **Method-level security deshabilitado** — `@PreAuthorize` es código muerto
3. **Sin TLS/HTTPS** — todas las comunicaciones en texto plano
4. **CORS wildcard + credentials** — cualquier sitio web puede hacer peticiones autenticadas
5. **JWT en localStorage** — cualquier XSS permite robo de sesión

---

## 🔴 CRITICAL (5)

### F-019 — Endpoint `/api/auth/diagnostico` expuesto públicamente

| | |
|---|---|
| **Archivo** | `AuthController.java:143-192`, `SecurityConfig.java:33` |
| **Tipo** | Broken Access Control (A01) |
| **Esfuerzo fix** | 15 minutos |

```java
// SecurityConfig.java — TODO /api/auth/** es público
.requestMatchers("/api/auth/**").permitAll()
```

**Problema:** El endpoint `GET /api/auth/diagnostico` es público porque `SecurityConfig` permite todo `/api/auth/**` sin autenticación. `@PreAuthorize` no funciona (F-018). Cualquier persona puede obtener metadata de la DB y lista completa de usuarios (IDs, usernames, emails, roles).

**Fix:** Agregar `.requestMatchers("/api/auth/diagnostico").denyAll()` en SecurityConfig o eliminar el endpoint en producción.

---

### F-018 — Method-level security deshabilitado (`@PreAuthorize` es código muerto)

| | |
|---|---|
| **Archivo** | `SecurityConfig.java` — ausencia de `@EnableMethodSecurity` |
| **Tipo** | Broken Access Control (A01) |
| **Esfuerzo fix** | 1 hora |

**Problema:** No hay `@EnableMethodSecurity` ni `@EnableGlobalMethodSecurity`. La única anotación `@PreAuthorize` del proyecto es código muerto. Toda la autorización depende exclusivamente de patrones URL en SecurityConfig.

**Fix:** Agregar `@EnableMethodSecurity` en una clase de configuración y migrar controllers gradualmente.

---

### F-001 — Ausencia total de TLS/HTTPS en todas las capas

| | |
|---|---|
| **Archivo** | `docker/nginx/nginx.conf`, `web-app/nginx.conf`, `application.properties` |
| **Tipo** | Cryptographic Failures (A02) |
| **Esfuerzo fix** | 1-2 días |

**Problema:** No hay SSL/TLS en Nginx (proxy inverso ni frontend) ni en Spring Boot. Todas las comunicaciones viajan en texto plano: credenciales, JWT, PII de huéspedes, API keys.

**Fix:** Configurar certificados TLS en ambos Nginx, redirigir HTTP→HTTPS, implementar HSTS.

---

### F-004 — CORS permite cualquier origen con credenciales

| | |
|---|---|
| **Archivo** | `CorsConfig.java` |
| **Tipo** | Security Misconfiguration (A05) |
| **Esfuerzo fix** | 30 minutos |

```java
cors.setAllowedOrigins(Arrays.asList("http://localhost:4200", "http://localhost"));
cors.setAllowedOriginPatterns(Arrays.asList("*"));
cors.setAllowCredentials(true);
```

**Problema:** `setAllowedOriginPatterns("*")` sobrescribe los orígenes restringidos. Con `allowCredentials(true)`, cualquier sitio web puede hacer peticiones autenticadas contra la API.

**Fix:** Eliminar `allowedOriginPatterns("*")` y definir orígenes explícitos.

---

### F-030 (Frontend) — JWT almacenado en localStorage

| | |
|---|---|
| **Archivo** | `web-app/src/app/core/services/auth.service.ts:33,43,53` |
| **Tipo** | Cryptographic Failures (A02) |
| **Esfuerzo fix** | Alto |

```typescript
localStorage.setItem('token', response.token);
localStorage.setItem('userId', response.usuarioId);
localStorage.setItem('userName', response.usuarioNombre);
localStorage.setItem('userRole', response.rol);
```

**Problema:** `localStorage` es accesible desde cualquier JS en el mismo origen. Un XSS permite robar el JWT y suplantar la sesión. Sin HttpOnly, Secure, SameSite ni refresh tokens.

**Fix:** Migrar a cookies HttpOnly + Secure + SameSite=Strict. Implementar refresh tokens con rotación.

---

## 🟠 HIGH (12)

### F-020 — Ausencia de protección IDOR en recursos de usuario

| | |
|---|---|
| **Archivo** | Todos los controllers — sin verificación de ownership |
| **Tipo** | Broken Access Control (A01) |
| **Esfuerzo fix** | 2-3 días |

**Problema:** Los endpoints no verifican que el recurso pertenezca al usuario autenticado. Un recepcionista podría ver/modificar datos de otros clientes cambiando el ID en la URL.

**Fix:** Implementar beans de seguridad por recurso con `@PreAuthorize` y verificación de ownership.

---

### F-021 — Sin rate limiting en endpoints de autenticación

| | |
|---|---|
| **Archivo** | `SecurityConfig.java` |
| **Tipo** | Insecure Design (A04) |
| **Esfuerzo fix** | 1 día |

**Problema:** Los endpoints `/api/auth/**` son públicos y no tienen rate limiting. Permite fuerza bruta ilimitada, enumeración de cuentas, DoS en auth, abuso del reset de password.

**Fix:** Configurar rate limiting con bucket4j o Nginx `limit_req_zone`.

---

### F-005 — Spring Boot Actuator expuesto con protección insuficiente

| | |
|---|---|
| **Archivo** | `SecurityConfig.java:35` |
| **Tipo** | Security Misconfiguration (A05) |
| **Esfuerzo fix** | 30 minutos |

```java
.requestMatchers("/actuator/**").hasRole("gerente")
```

**Problema:** Actuator expone health con detalles de DB, env con variables, heapdump. Un atacante con cuenta "gerente" accede a toda la información sensible.

**Fix:** Exponer solo `health,info,prometheus`. Deshabilitar `env`, `heapdump`, `threaddump`. `health.show-details=never`.

---

### F-006 — Swagger/OpenAPI expuesto sin autenticación

| | |
|---|---|
| **Archivo** | `SecurityConfig.java:34` |
| **Tipo** | Security Misconfiguration (A05) |
| **Esfuerzo fix** | 15 minutos |

```java
.requestMatchers("/swagger-ui/**", "/v3/api-docs/**", "/swagger-ui.html").permitAll()
```

**Problema:** Swagger expone toda la superficie de ataque: endpoints, esquemas, parámetros. Un atacante conoce la API completa.

**Fix:** Proteger con autenticación o deshabilitar en producción con `springdoc.api-docs.enabled=false`.

---

### F-028 — SQL logging habilitado en producción (`show-sql=true`)

| | |
|---|---|
| **Archivo** | `application.properties:14` |
| **Tipo** | Logging & Monitoring (A09) |
| **Esfuerzo fix** | 5 minutos |

```properties
spring.jpa.show-sql=true
```

**Problema:** Hibernate imprime TODAS las sentencias SQL con valores en logs: PII de huéspedes, hashes BCrypt, tokens de reseteo, montos de pagos.

**Fix:** `spring.jpa.show-sql=false`. Usar `logging.level.org.hibernate.SQL=DEBUG` solo cuando sea necesario.

---

### F-011 — No existe `docker-compose.yml` a pesar de la dependencia

| | |
|---|---|
| **Archivo** | `pom.xml` (dependencia `spring-boot-docker-compose`) |
| **Tipo** | Infraestructura |
| **Esfuerzo fix** | 2 horas |

**Problema:** El proyecto declara dependencia de `spring-boot-docker-compose` pero no existe `docker-compose.yml`. Causará errores de inicio o el proyecto se iniciará sin BD ni servicios.

**Fix:** Crear `docker-compose.yml` con postgres, api-rest, web-app y secretos.

---

### F-031 (Frontend) — UUID de rol hardcodeado en guard

| | |
|---|---|
| **Archivo** | `web-app/src/app/core/guards/auth.guard.ts:92` |
| **Tipo** | Broken Access Control (A01) |
| **Esfuerzo fix** | Bajo |

```typescript
return currentUser.rolId !== '2263a702-ea8a-4178-9140-6ce561660759';
```

**Problema:** UUID hardcodeado que puede cambiar al regenerar la BD. El guard podría romperse o autorizar incorrectamente en otro entorno.

**Fix:** Reemplazar por verificación basada en nombre del rol (`rolNombre !== 'Limpieza'`).

---

### F-032 (Frontend) — Sin headers de seguridad HTTP en index.html

| | |
|---|---|
| **Archivo** | `web-app/src/index.html` |
| **Tipo** | Security Misconfiguration (A05) |
| **Esfuerzo fix** | Bajo |

**Problema:** No hay CSP, X-Content-Type-Options, X-Frame-Options, HSTS, Referrer-Policy, Permissions-Policy. Permite XSS, clickjacking, MIME sniffing.

**Fix:** Agregar meta tags CSP en index.html y security headers en Nginx.

---

### F-033 (Frontend) — `angular.json` sin Subresource Integrity (SRI)

| | |
|---|---|
| **Archivo** | `web-app/angular.json` |
| **Tipo** | Security Misconfiguration (A05) |
| **Esfuerzo fix** | Medio |

**Problema:** Sin SRI, si el servidor de assets es comprometido, los archivos JS/CSS pueden modificarse sin detección del navegador.

**Fix:** Habilitar SRI en la configuración de build de Angular.

---

### F-034 (Frontend) — `localStorage.getItem('userId')` directo en componente

| | |
|---|---|
| **Archivo** | `web-app/src/app/pages/reservas/panel-reservas/panel-reservas.component.ts:1492` |
| **Tipo** | Authentication Failures (A07) |
| **Esfuerzo fix** | Bajo |

```typescript
const usuarioId = localStorage.getItem('userId');
```

**Problema:** Acceso directo a localStorage duplicando lógica de sesión. Dificulta migración a cookies. Sin null-check consistente.

**Fix:** Centralizar en AuthService: `getCurrentUserId()`.

---

## 🟡 MEDIUM (9)

### F-003 — Secreto JWT de baja entropía en disco local

| | |
|---|---|
| **Archivo** | `docker/secrets/jwt_secret.txt`, `.env` |
| **Tipo** | Cryptographic Failures (A02) |
| **Esfuerzo fix** | 30 minutos |

```
JWT_SECRET=miClaveSecretaSuperSeguraParaJWT2026
```

**Problema:** Secreto con palabras del diccionario español, baja entropía. Mismo valor en dev y producción. Con HMAC-SHA256, si se compromete, todos los tokens son forjables.

**Fix:** `openssl rand -base64 64`. Diferentes secretos para dev/prod. Considerar RS256.

---

### F-022 — Password reset token sin expiración robusta

| | |
|---|---|
| **Archivo** | `Usuario.java` — campos `resetToken`, `resetTokenExpiry` |
| **Tipo** | Insecure Design (A04) |
| **Esfuerzo fix** | 30 minutos |

**Problema:** Validación de expiración frágil (depende solo de lógica en service). No hay invalidación de tokens anteriores al cambiar password. No hay límite de intentos de reseteo.

**Fix:** Invalidar token post-uso (set null). Agregar logging y rate limiting al endpoint de reset.

---

### F-007 — Nginx sin cabeceras de seguridad HTTP

| | |
|---|---|
| **Archivo** | `docker/nginx/nginx.conf`, `web-app/nginx.conf` |
| **Tipo** | Security Misconfiguration (A05) |
| **Esfuerzo fix** | 30 minutos |

**Problema:** Ningún archivo Nginx incluye `X-Content-Type-Options`, `X-Frame-Options`, `CSP`, `HSTS`. Permite clickjacking, MIME sniffing, XSS.

**Fix:** Agregar security headers en ambos archivos Nginx.

---

### F-009 — CSRF deshabilitado globalmente

| | |
|---|---|
| **Archivo** | `SecurityConfig.java:28` |
| **Tipo** | Security Misconfiguration (A05) |
| **Esfuerzo fix** | 30 minutos |

```java
.csrf(csrf -> csrf.disable())
```

**Problema:** Sin CSRF, peticiones POST/PUT/DELETE desde sitios externos son procesadas si el usuario tiene sesión activa.

**Fix:** Documentar decisión si es estrictamente necesario. Asegurar CORS y Content-Type checking.

---

### F-023 — JWT con vida útil de 24h sin mecanismo de revocación

| | |
|---|---|
| **Archivo** | `.env:10` |
| **Tipo** | Authentication Failures (A07) |
| **Esfuerzo fix** | 1 día |

```
JWT_EXPIRATION=86400000  // 24 horas
```

**Problema:** Sin blacklist/revocación. Token robado es válido 24h. No se puede cerrar sesión del lado del servidor.

**Fix:** Reducir a 15-30 min. Implementar refresh tokens con 7 días y revocación en BD.

---

### F-024 — Sin bloqueo de cuenta por intentos fallidos

| | |
|---|---|
| **Archivo** | `AuthController.java` — endpoint login |
| **Tipo** | Authentication Failures (A07) |
| **Esfuerzo fix** | 1 día |

**Problema:** El login no bloquea después de N intentos fallidos. Ataques de fuerza bruta ilimitados.

**Fix:** Implementar contador de intentos fallidos + lockout de 15 minutos después de 5 intentos.

---

### F-025 — Sin validación robusta en DTOs

| | |
|---|---|
| **Archivo** | Múltiples DTOs en `dto/request/` |
| **Tipo** | Data Integrity (A08) |
| **Esfuerzo fix** | 1-2 días |

**Problema:** Varios DTOs carecen de `@Size`, `@Pattern`, sanitización. Campos de texto libre permiten datos malformados, potencial XSS almacenado.

**Fix:** Agregar `@NotBlank`, `@Size`, `@Pattern`, `@Email` con mensajes de error específicos.

---

### F-010 — Sin logging de eventos de seguridad

| | |
|---|---|
| **Archivo** | `logback-spring.xml`, services |
| **Tipo** | Logging & Monitoring (A09) |
| **Esfuerzo fix** | 1 día |

**Problema:** No se registran: login fallidos, cambios de password, creación de usuarios privilegiados, accesos denegados (403), cambios de roles.

**Fix:** Crear `SecurityAuditService` con logger dedicado y appender separado en logback.

---

### F-014 — libphonenumber 9.0.30 desactualizado

| | |
|---|---|
| **Archivo** | `pom.xml` |
| **Tipo** | Dependency Vulnerabilities |
| **Esfuerzo fix** | 15 minutos |

**Problema:** Versión 9.0.30 tiene bug heap-buffer-overflow (OSV-2025-298). Versiones 18.x+ incluyen parches adicionales.

**Fix:** Evaluar actualización a la versión más reciente.

---

### F-035 (Frontend) — `console.log` con datos sensibles del login

| | |
|---|---|
| **Archivo** | `web-app/src/app/core/services/auth.service.ts:17` |
| **Tipo** | Logging & Monitoring (A09) |
| **Esfuerzo fix** | 5 minutos |

```typescript
console.log('Datos de login (request):', { email: this.loginForm.get('email')?.value, ... });
```

**Problema:** Loguea payload del login en consola del navegador. Credenciales visibles con devtools.

**Fix:** Eliminar o envolver en `if (!environment.production)`.

---

### F-036 (Frontend) — Sin protección CSRF visible en frontend

| | |
|---|---|
| **Archivo** | Toda la app — global |
| **Tipo** | Data Integrity (A08) |
| **Esfuerzo fix** | Medio |

**Problema:** No se implementan tokens CSRF ni patrón de doble cookie sumiso. El riesgo depende de cómo el backend maneja autenticación.

**Fix:** Verificar que backend solo acepte `Authorization: Bearer`. Si usa cookies, implementar doble cookie sumiso.

---

## 🔵 LOW (4)

### F-026 — Brevo API key es placeholder

| | |
|---|---|
| **Archivo** | `.env:16` |
| **Esfuerzo fix** | 15 minutos |

```
BREVO_API_KEY=xkeysib-poner-tu-api-key-aqui
```

**Problema:** Si alguien despliega sin configurar una API key real, el email transaccional falla silenciosamente.

**Fix:** Validar al inicio que la API key no sea el placeholder.

---

### F-013 — No hay `.dockerignore`

| | |
|---|---|
| **Archivo** | `Dockerfile` (backend), `web-app/Dockerfile` |
| **Esfuerzo fix** | 15 minutos |

**Problema:** Sin `.dockerignore`, el contexto de build incluye `.git`, `node_modules/`, `target/`, `.env` — aumenta tamaño de imagen y puede filtrar secretos.

**Fix:** Crear `.dockerignore` excluyendo `.git`, `node_modules`, `target`, `.env`, `*.md`.

---

### F-027 — No existe `.env.example`

| | |
|---|---|
| **Archivo** | Raíz del proyecto |
| **Esfuerzo fix** | 15 minutos |

**Problema:** Un nuevo desarrollador no sabe qué variables configurar. Riesgo de copiar `.env` real como plantilla.

**Fix:** Crear `.env.example` con valores placeholder documentados.

---

### F-017 — `.gitkeep` engañoso en directorio de secretos

| | |
|---|---|
| **Archivo** | `docker/secrets/.gitkeep` |
| **Esfuerzo fix** | 5 minutos |

**Problema:** Da falsa impresión de que el directorio "debe tener secretos". Alguien podría añadir secretos reales pensando que están protegidos.

**Fix:** Agregar `docker/secrets/README.md` explicando que los secretos se montan externamente.

---

### F-002 — Secretos en texto plano en disco local

| | |
|---|---|
| **Archivo** | `.env`, `docker/secrets/db_password.txt`, `docker/secrets/jwt_secret.txt` |
| **Esfuerzo fix** | 30 minutos |

```
DB_PASSWORD=1984GeorgeOrwell
```

**Problema:** Contraseñas en texto plano. `DB_PASSWORD` usa referencia literaria predecible (1984). Mismo JWT secret en dev y prod.

**Fix:** Diferentes secretos para dev/prod. Contraseñas criptográficamente aleatorias. Considerar HashiCorp Vault o sops.

---

## Prioridad de Remediación

| # | Hallazgo | Severidad | Esfuerzo | Dónde |
|---|----------|-----------|----------|-------|
| 1 | **F-019** — `/api/auth/diagnostico` público | 🔴 CRITICAL | 15 min | Backend |
| 2 | **F-018** — `@EnableMethodSecurity` deshabilitado | 🔴 CRITICAL | 1 hora | Backend |
| 3 | **F-004** — CORS wildcard + credentials | 🔴 CRITICAL | 30 min | Backend |
| 4 | **F-030** — JWT en localStorage | 🔴 CRITICAL | Alto | Frontend |
| 5 | **F-001** — Sin TLS/HTTPS | 🔴 CRITICAL | 1-2 días | Infra |
| 6 | **F-020** — Sin IDOR en recursos | 🟠 HIGH | 2-3 días | Backend |
| 7 | **F-021** — Sin rate limiting en auth | 🟠 HIGH | 1 día | Backend |
| 8 | **F-028** — `show-sql=true` en producción | 🟠 HIGH | 5 min | Backend |
| 9 | **F-005** — Actuator expuesto | 🟠 HIGH | 30 min | Backend |
| 10 | **F-006** — Swagger expuesto | 🟠 HIGH | 15 min | Backend |
| 11 | **F-031** — UUID rol hardcodeado | 🟠 HIGH | Bajo | Frontend |
| 12 | **F-032** — Sin headers seguridad HTTP | 🟠 HIGH | Bajo | Frontend |
| 13 | **F-033** — Sin SRI en build | 🟠 HIGH | Medio | Frontend |
| 14 | **F-034** — localStorage directo en componente | 🟠 HIGH | Bajo | Frontend |
| 15 | **F-011** — docker-compose.yml faltante | 🟠 HIGH | 2 horas | Infra |

---

## Archivos Auditados

| Archivo | Estado |
|---------|--------|
| `pom.xml` | ✅ |
| `application.properties` | ✅ |
| `SecurityConfig.java` | ✅ |
| `JwtUtil.java` | ✅ |
| `JwtAuthenticationFilter.java` | ✅ |
| `CustomUserDetailsService.java` | ✅ |
| `CorsConfig.java` | ✅ |
| `SwaggerConfig.java` | ✅ |
| `AuthController.java` | ✅ |
| `BrevoEmailService.java` | ✅ |
| `GlobalExceptionHandler.java` | ✅ |
| `logback-spring.xml` | ✅ |
| `Dockerfile` (backend) | ✅ |
| `web-app/Dockerfile` | ✅ |
| `web-app/nginx.conf` | ✅ |
| `docker/nginx/nginx.conf` | ✅ |
| `docker/postgres/init/01-restore.sh` | ✅ |
| `docker/secrets/*` | ✅ |
| `.env` | ✅ |
| `.gitignore` | ✅ |
| `angular.json` | ✅ |
| `proxy.conf.json` | ✅ |
| 18 controllers | ✅ |
| 21 services | ✅ |
| ~30 DTOs request | ✅ |
| 22 repositorios | ✅ |
| `web-app/src/index.html` | ✅ |
| `web-app/src/app/core/services/auth.service.ts` | ✅ |
| `web-app/src/app/core/guards/auth.guard.ts` | ✅ |
| `web-app/src/app/pages/reservas/panel-reservas/*.ts` | ✅ |
| ~21 componentes de página | ✅ |
| ~14 servicios frontend | ✅ |
| **`docker-compose.yml`** | ❌ No existe |
| **`.dockerignore`** | ❌ No existe |
| **`.env.example`** | ❌ No existe |

---

## Dependencias con Riesgo

| Paquete | Versión | Riesgo |
|---------|---------|--------|
| `libphonenumber` | 9.0.30 | OSV-2025-298 heap-buffer-overflow |
| `testcontainers-bom` | 1.19.8 | Desactualizado |
| `springboot4-dotenv` | 5.1.0 | No auditado contra OSV.dev |
| `exceljs` | 4.4.0 | Biblioteca archivada/descontinuada |
| `jjwt` | 0.12.3 | CVE-2024-31033 (disputado) |
| `postcss` | ^8.5.14 | No verificado contra OSV.dev |

---

## Resumen por Categoría OWASP

| Categoría | Hallazgos |
|-----------|-----------|
| **A01: Broken Access Control** | F-018, F-019, F-020, F-031 = 4 |
| **A02: Cryptographic Failures** | F-001, F-003, F-030 = 3 |
| **A04: Insecure Design** | F-021, F-022 = 2 |
| **A05: Security Misconfiguration** | F-004, F-005, F-006, F-007, F-009, F-032, F-033 = 7 |
| **A07: Authentication Failures** | F-023, F-024, F-034 = 3 |
| **A08: Data Integrity** | F-025, F-036 = 2 |
| **A09: Logging & Monitoring** | F-010, F-028, F-035 = 3 |
| **Infraestructura** | F-002, F-011, F-013, F-017, F-026, F-027 = 6 |

---

*Reporte consolidado generado el 2026-06-07. Auditoría completa: ~80 archivos, ~56,000 líneas de código.*
