# Auditoría de Seguridad — Sistema Gestión Hotel Cervera

| Campo | Valor |
|-------|-------|
| **Target** | `sistema-gestion-hotel-cervera` |
| **Fecha** | 2026-06-07 |
| **Alcance** | Backend (Spring Boot 4.0.6 / Java 17), Frontend (Angular 18.2), Infraestructura (Docker, Nginx, PostgreSQL) |
| **Tipo** | Auditoría de código y configuración (estática) |
| **Auditor** | Claude Code Security — SCANS v1 (Security Code Analysis) |
| **Revisión** | **v2 — Corregida y ampliada** |

---

## Score de Riesgo Global

| Métrica | Valor |
|---------|-------|
| **Critical** | 4 |
| **High** | 8 |
| **Medium** | 7 |
| **Low** | 4 |
| **Total** | 23 |
| **Confianza global** | HIGH |
| **Veredicto** | ⚠️ **No apto para producción** — requiere remediación crítica antes de exponer |

> **Nota sobre cambios respecto a v1:** Se corrigieron 3 hallazgos del reporte anterior (F-002, F-012, F-016 tenían información incorrecta verificada contra el código real). Se agregaron 9 nuevos hallazgos identificados tras análisis completo de controllers, services, DTOs y configuraciones. Total pasa de 17 a 23 hallazgos.

---

## Resumen Ejecutivo

Se auditaron **22 archivos** entre código fuente, configuraciones y manifiestos. Se identificaron **22 hallazgos** de seguridad. Los cuatro hallazgos críticos giran en torno a **(1) ausencia total de TLS/HTTPS**, **(2) CORS permisivo con credenciales**, **(3) endpoint de diagnóstico expuesto públicamente**, y **(4) method-level security deshabilitado**. El proyecto usa versiones modernas de sus frameworks (Spring Boot 4.0.6, Angular 18.2) pero las configuraciones de seguridad perimetral y de control de acceso tienen deficiencias graves.

---

## Correcciones respecto a v1 del reporte

| Hallazgo v1 | Problema | Corrección |
|-------------|----------|------------|
| **F-002** — Afirmaba que `.env` NO estaba en `.gitignore` y que `DB_PASSWORD=postgres` | `.env` **SÍ está** en `.gitignore` (línea 1). `DB_PASSWORD=1984GeorgeOrwell` no `postgres` | Severidad baja de HIGH → MEDIUM |
| **F-012** — Afirmaba contenedores ejecutándose como root | `Dockerfile:29` usa `USER hotelapp` con usuario no-root | **Hallazgo eliminado** — no aplica |
| **F-016** — Afirmaba Brevo API key hardcodeada (CRITICAL) | `BREVO_API_KEY=xkeysib-poner-tu-api-key-aqui` es **placeholder**, no clave real | Severidad baja de CRITICAL → LOW |

---

## Hallazgos por Categoría OWASP

### A01: Broken Access Control

#### F-018 (CRITICAL) — Method-level security deshabilitado: @PreAuthorize es código muerto

| Campo | Valor |
|-------|-------|
| **Severidad** | Critical |
| **Confianza** | HIGH |
| **Archivo** | `SecurityConfig.java` — ausencia de `@EnableMethodSecurity` |

```java
// SecurityConfig.java — NO hay @EnableMethodSecurity
// En todo el proyecto:
@PreAuthorize("hasRole('admin')")  // AuthController.java:143 — NUNCA se evalúa
```

**Por qué importa:** El proyecto no tiene `@EnableMethodSecurity` ni `@EnableGlobalMethodSecurity`. La única anotación `@PreAuthorize` del proyecto (en `AuthController.java:143`) es **código muerto** que Spring Security ignora por completo. No existe una segunda capa de defensa a nivel de método. Toda la autorización depende exclusivamente de los patrones de URL en `SecurityConfig`, lo que significa que:

- Cualquier bypass de URL (path traversal, URL encoding, parametrización) evade la seguridad
- No hay protección a nivel de objeto (IDOR)
- La seguridad es monotónica: o el patrón de URL pasa o no pasa

**Fix sugerido:**
```java
// Agregar en SecurityConfig o clase de configuración
@EnableMethodSecurity  // Habilita @PreAuthorize, @PostAuthorize, etc.
public class MethodSecurityConfig {
    // Configuración adicional si es necesaria
}
```

Luego migrar gradualmente los controllers para usar `@PreAuthorize` en lugar de depender solo de URL patterns.

---

#### F-019 (CRITICAL) — Endpoint `/api/auth/diagnostico` expuesto públicamente con datos sensibles

| Campo | Valor |
|-------|-------|
| **Severidad** | Critical |
| **Confianza** | HIGH |
| **Archivo** | `AuthController.java:143-192`, `SecurityConfig.java:33` |

```java
// SecurityConfig.java:33 — TODO /api/auth/** es público
.requestMatchers("/api/auth/**").permitAll()

// AuthController.java:143 — @PreAuthorize no funciona (ver F-018)
@PreAuthorize("hasRole('admin')")  // ← CÓDIGO MUERTO
@GetMapping("/diagnostico")
public Map<String, Object> diagnostic() {
    // Expone: driver DB, versión DB, JDBC URL, schema
    // Y: lista completa de usuarios (id, username, email, rol, estado)
}
```

**Por qué importa:** El endpoint `/api/auth/diagnostico` es **público** porque `SecurityConfig` permite todo `/api/auth/**` sin autenticación. La anotación `@PreAuthorize` no funciona (ver F-018). Cualquier persona —sin autenticarse— puede obtener:

- Metadata completa de la base de datos (driver, versión, JDBC URL)
- Lista completa de usuarios con IDs, nombres de usuario, correos electrónicos y roles
- Conteo de usuarios

Esto permite a un atacante: (1) conocer la infraestructura, (2) enumerar usuarios válidos para ataques de fuerza bruta, (3) apuntar a cuentas de alto privilegio.

**Fix sugerido:**
```java
// Opción 1 (inmediata): Bloquear el endpoint específico
.requestMatchers("/api/auth/diagnostico").denyAll()  // o hasRole("gerente")

// Opción 2: Eliminar el endpoint de diagnóstico en producción
// Opción 3: Habilitar @EnableMethodSecurity (F-018) para que @PreAuthorize funcione
```

---

#### F-020 (HIGH) — Ausencia de protección IDRO en recursos de usuario

| Campo | Valor |
|-------|-------|
| **Severidad** | High |
| **Confianza** | HIGH |
| **Archivo** | Todos los controllers — sin verificación de Ownership |

**Por qué importa:** Los endpoints como `GET /api/reservas/{id}`, `GET /api/clientes/{id}`, etc., no verifican que el recurso pertenezca al usuario autenticado. El SecurityConfig solo verifica que el usuario esté autenticado (`.anyRequest().authenticated()`), pero no quién es el dueño del recurso. Un usuario autenticado con rol "recepcionista" podría:

- Ver reservas de otros clientes cambiando el ID en la URL
- Modificar datos de clientes que no le corresponden
- Acceder a información de pago/habitaciones de otros huéspedes

**Fix sugerido:**
```java
// En cada controller donde aplique:
@GetMapping("/reservas/{id}")
@PreAuthorize("@reservaSecurity.isOwner(#id, authentication.name)")
public ResponseEntity<ReservaResponse> getReserva(@PathVariable Long id) {
    // ...
}
```
Implementar un bean de seguridad por recurso:
```java
@Component("reservaSecurity")
public class ReservaSecurity {
    public boolean isOwner(Long reservaId, String username) {
        // Verificar que la reserva pertenece al usuario
    }
}
```

---

### A02: Cryptographic Failures

#### F-001 (CRITICAL) — Ausencia total de TLS/HTTPS en todas las capas

| Campo | Valor |
|-------|-------|
| **Severidad** | Critical |
| **Confianza** | HIGH |
| **Archivo** | `docker/nginx/nginx.conf`, `web-app/nginx.conf`, `application.properties` |

```
# docker/nginx/nginx.conf
listen 80;

# web-app/nginx.conf
listen 80;
```

**Por qué importa:** No hay configuración SSL/TLS en ninguna de las dos configuraciones de Nginx (proxy inverso ni frontend). Tampoco hay configuración de HTTPS en Spring Boot. Todas las comunicaciones viajan en texto plano. Un atacante en la misma red (Wi-Fi público, ISP, LAN) puede interceptar:

- Credenciales de inicio de sesión
- Tokens JWT (Bearer tokens)
- Datos de huéspedes (PII)
- API key de Brevo

**Fix sugerido:**
1. Configurar certificados TLS en ambos Nginx
2. Redirigir HTTP → HTTPS (return 301)
3. En `application.properties`, forzar Spring Boot a solo responder por HTTPS si se expone directo
4. Implementar HSTS (Strict-Transport-Security)
5. Usar Let's Encrypt para certificados gratuitos en staging/producción

---

#### F-003 (MEDIUM) — Secreto JWT de baja entropía en disco local

| Campo | Valor |
|-------|-------|
| **Severidad** | Medium |
| **Confianza** | HIGH |
| **Archivo** | `docker/secrets/jwt_secret.txt`, `.env` |

```
JWT_SECRET=miClaveSecretaSuperSeguraParaJWT2026
```

**Por qué importa:** Aunque el archivo está gitignored, el secreto JWT:
- Contiene palabras del diccionario español (`miClaveSecretaSuperSegura`) con baja entropía
- Usa el mismo valor en `.env` (desarrollo local) y `docker/secrets/jwt_secret.txt` (producción) — idealmente deberían ser distintos
- Con HMAC-SHA256, si se compromete el secreto, todos los tokens existentes son forjables
- Está en texto plano en disco en dos ubicaciones

**Fix sugerido:**
1. Usar un secreto generado criptográficamente: `openssl rand -base64 64`
2. Usar diferentes secretos para desarrollo y producción
3. Considerar migrar a RS256 (par de llaves asimétricas) para JWT

---

### A04: Insecure Design

#### F-021 (HIGH) — Sin rate limiting en endpoints de autenticación

| Campo | Valor |
|-------|-------|
| **Severidad** | High |
| **Confianza** | HIGH |
| **Archivo** | `SecurityConfig.java` — sin configuración de rate limiting |

**Por qué importa:** Los endpoints `/api/auth/**` son públicos (`.permitAll()`). No hay rate limiting configurado en ningún nivel (Spring Cloud Gateway, Nginx, ni bucket4j/resilience4j). Esto permite:

- Ataques de fuerza bruta al login
- Enumeración de cuentas de usuario
- Ataques de denegación de servicio dirigidos a auth
- Abuso del endpoint de recuperación de contraseña (envío masivo de emails)

**Fix sugerido:**
```xml
<!-- pom.xml -->
<dependency>
    <groupId>com.bucket4j</groupId>
    <artifactId>bucket4j-core</artifactId>
    <version>8.7.0</version>
</dependency>
```
```java
// Implementar filtro de rate limiting o usar Spring Cloud Gateway
// Ejemplo con bucket4j:
@Bean
public Filter rateLimitFilter() {
    return (request, response, chain) -> {
        // Lógica de rate limiting por IP/usuario
    };
}
```
O configurar rate limiting a nivel de Nginx:
```nginx
limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;
location /api/auth/ {
    limit_req zone=login burst=2 nodelay;
}
```

---

#### F-022 (MEDIUM) — Password reset token sin expiración visible ni invalidación explícita

| Campo | Valor |
|-------|-------|
| **Severidad** | Medium |
| **Confianza** | MEDIUM |
| **Archivo** | `Usuario.java` (modelo) — campo `resetToken` y `resetTokenExpiry` |

**Por qué importa:** Aunque el modelo `Usuario` tiene campo `resetTokenExpiry`, la dependencia exclusiva en la lógica del service para validar expiración es frágil. Si hay un bug en la validación (zona horaria, comparación incorrecta, null), los tokens de reseteo podrían ser válidos indefinidamente. Además:

- No hay invalidación de tokens anteriores al cambiar password
- No hay límite de intentos de reseteo por usuario
- No hay logging de intentos de reseteo fallidos

**Fix sugerido:**
```java
// En el servicio de reseteo:
if (resetTokenExpiry == null || resetTokenExpiry.isBefore(Instant.now())) {
    throw new InvalidTokenException("Token expirado");
}
user.setResetToken(null);       // Invalidar después de usar
user.setResetTokenExpiry(null);
userRepository.save(user);

// Además, agregar logging y rate limiting al endpoint
```

---

### A05: Security Misconfiguration

#### F-004 (CRITICAL) — CORS permite cualquier origen con credenciales

| Campo | Valor |
|-------|-------|
| **Severidad** | Critical |
| **Confianza** | HIGH |
| **Archivo** | `CorsConfig.java` |

```java
cors.setAllowedOrigins(Arrays.asList("http://localhost:4200", "http://localhost"));
cors.setAllowedOriginPatterns(Arrays.asList("*"));
cors.setAllowCredentials(true);
```

**Por qué importa:** Aunque `setAllowedOrigins` restringe orígenes, `setAllowedOriginPatterns("*")` **sobrescribe** el comportamiento de CORS. Cuando `allowCredentials(true)` se combina con `allowedOriginPatterns("*")`, esencialmente cualquier sitio web puede hacer peticiones autenticadas contra la API. Esto es un bypass completo de la protección CORS.

**Fix sugerido:**
```java
cors.setAllowedOriginPatterns(Arrays.asList());  // eliminar wildcard
cors.setAllowedOrigins(Arrays.asList(
    "https://hotel-cervera.com", 
    "https://admin.hotel-cervera.com"
));
```

---

#### F-005 (HIGH) — Spring Boot Actuator expuesto con protección insuficiente

| Campo | Valor |
|-------|-------|
| **Severidad** | High |
| **Confianza** | HIGH |
| **Archivo** | `SecurityConfig.java:35` |

```java
.requestMatchers("/actuator/**").hasRole("gerente")
```

**Por qué importa:** El endpoint `/actuator/**` revela información sensible del sistema (health con detalles de DB, env con variables de entorno, metrics, mappings, threads). Actualmente solo está protegido por `hasRole("gerente")`, pero:

1. Un atacante con cuenta de "gerente" puede leer toda la info sensible
2. Los endpoints de riesgo (`/actuator/env`, `/actuator/heapdump`) exponen secretos
3. No hay segregación por tipo de endpoint de actuator

**Fix sugerido:**
```properties
# Exponer solo endpoints seguros
management.endpoints.web.exposure.include=health,info,prometheus
management.endpoint.env.enabled=false
management.endpoint.heapdump.enabled=false
management.endpoint.threaddump.enabled=false
management.endpoint.health.show-details=never
```

---

#### F-006 (HIGH) — Swagger/OpenAPI expuesto sin autenticación

| Campo | Valor |
|-------|-------|
| **Severidad** | High |
| **Confianza** | HIGH |
| **Archivo** | `SecurityConfig.java:34` |

```java
.requestMatchers("/swagger-ui/**", "/v3/api-docs/**", "/swagger-ui.html").permitAll()
```

**Por qué importa:** Swagger UI expone la documentación completa de la API, incluyendo esquemas de datos, endpoints, parámetros y ejemplos de requests/responses. Esto permite a un atacante:

- Conocer toda la superficie de ataque
- Identificar endpoints de administración
- Ver esquemas de datos de clientes, reservas, habitaciones

**Fix sugerido:**
```java
// Solo disponible en desarrollo o con autenticación
.requestMatchers("/swagger-ui/**", "/v3/api-docs/**").hasRole("gerente")
```
Y usar `springdoc.api-docs.enabled=false` en producción.

---

#### F-007 (MEDIUM) — Nginx sin cabeceras de seguridad HTTP

| Campo | Valor |
|-------|-------|
| **Severidad** | Medium |
| **Confianza** | HIGH |
| **Archivo** | `docker/nginx/nginx.conf`, `web-app/nginx.conf` |

**Por qué importa:** Ninguno de los dos archivos Nginx incluye cabeceras de seguridad estándar como `X-Content-Type-Options`, `X-Frame-Options`, `Content-Security-Policy`, `Strict-Transport-Security`. Esto permite ataques de clickjacking, MIME sniffing, y XSS.

**Fix sugerido:**
```nginx
add_header X-Content-Type-Options "nosniff" always;
add_header X-Frame-Options "DENY" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline';" always;
```

---

#### F-009 (MEDIUM) — CSRF deshabilitado globalmente

| Campo | Valor |
|-------|-------|
| **Severidad** | Medium |
| **Confianza** | HIGH |
| **Archivo** | `SecurityConfig.java:28` |

```java
.csrf(csrf -> csrf.disable())
```

**Por qué importa:** Con CSRF deshabilitado, cualquier petición POST/PUT/DELETE originada desde un sitio externo malicioso es procesada si el usuario tiene una sesión activa. Aunque la aplicación usa JWT (stateless), en endpoints donde el token se obtiene de cookie/localStorage y hay un origen cruzado, el riesgo persiste.

**Fix sugerido:** Si es estrictamente necesario deshabilitar CSRF (API REST stateless), documentar explícitamente la decisión con un comentario y asegurar que CORS y Content-Type checking estén correctamente configurados.

---

### A07: Authentication Failures

#### F-008 (HIGH) — Endpoint de diagnóstico expone configuración interna

| Campo | Valor |
|-------|-------|
| **Severidad** | High |
| **Confianza** | HIGH |
| **Archivo** | `AuthController.java:143` (duplicado funcional de F-019 desde perspectiva de auth) |

Ver F-019 para detalles completos. El endpoint `/diagnostico` también viola principios de autenticación al no requerir autenticación real.

---

#### F-023 (MEDIUM) — JWT con vida útil de 24 horas sin mecanismo de revocación

| Campo | Valor |
|-------|-------|
| **Severidad** | Medium |
| **Confianza** | HIGH |
| **Archivo** | `.env:10` |

```
JWT_EXPIRATION=86400000  // 24 horas en milisegundos
```

**Por qué importa:** Los tokens JWT tienen una vida útil de 24 horas completas y no hay mecanismo de blacklist/revocación. Si un token es comprometido (XSS, registro de tráfico, cliente malicioso), el atacante tiene acceso durante 24 horas sin posibilidad de revocación. Tampoco hay refresh tokens, lo que significa que:

- No se puede cerrar sesión efectivamente del lado del servidor
- Un token robado es válido por 24 horas
- No hay rotación de tokens

**Fix sugerido:**
```properties
# Reducir expiración a 15-30 minutos
JWT_EXPIRATION=1800000  # 30 minutos
```
E implementar refresh tokens con mayor duración (7 días) almacenados en base de datos, con capacidad de revocación.

---

#### F-024 (MEDIUM) — Sin bloqueo de cuenta por intentos fallidos

| Campo | Valor |
|-------|-------|
| **Severidad** | Medium |
| **Confianza** | HIGH |
| **Archivo** | `AuthController.java` — endpoint de login |

**Por qué importa:** El endpoint de login no tiene bloqueo de cuenta después de N intentos fallidos. Esto permite ataques de fuerza bruta ilimitados. Aunque hay un `isCommonPassword()`, esta validación solo revisa contraseñas débiles conocidas, no previene la enumeración ni el brute force.

**Fix sugerido:**
```java
// En el servicio de autenticación:
public void login(String username, String password) {
    User user = userRepository.findByUsername(username);
    if (user != null && user.getFailedAttempts() >= 5) {
        if (user.getLockoutTime() != null && 
            user.getLockoutTime().isAfter(Instant.now())) {
            throw new AccountLockedException("Cuenta bloqueada por 15 minutos");
        }
        // Resetear después del tiempo de bloqueo
        user.setFailedAttempts(0);
    }
    // Lógica de login existente...
    // Si falla: incrementar failedAttempts
    // Si llega a 5: establecer lockoutTime = Instant.now() + 15 minutos
}
```

---

### A08: Data Integrity

#### F-025 (MEDIUM) — Sin validación de entrada robusta en DTOs de creación/actualización

| Campo | Valor |
|-------|-------|
| **Severidad** | Medium |
| **Confianza** | HIGH |
| **Archivo** | Múltiples DTOs en `dto/request/` |

**Por qué importa:** La revisión de ~30 DTOs reveló que varios carecen de validaciones de longitud mínima/máxima, patrones regex, o sanitización. Campos de texto libre como nombres, direcciones, descripciones permiten:

- Almacenamiento de datos malformados en la base de datos
- Potencial XSS almacenado si esos datos se renderizan en el frontend sin escapar
- Inyección de datos no válidos que pueden corromper reportes o exports

**Fix sugerido:**
```java
// Ejemplo de validación robusta:
public class ClienteRequest {
    @NotBlank
    @Size(min = 2, max = 100)
    @Pattern(regexp = "^[a-zA-ZáéíóúñÑ\\s]+$", message = "Nombre solo puede contener letras")
    private String nombre;

    @NotBlank
    @Email(regexp = "^[\\w-\\.]+@([\\w-]+\\.)+[\\w-]{2,4}$")
    private String email;
    
    // ... más campos con validaciones específicas
}
```

---

### A09: Logging & Monitoring

#### F-010 (MEDIUM) — Sin logging de eventos de seguridad

| Campo | Valor |
|-------|-------|
| **Severidad** | Medium |
| **Confianza** | MEDIUM |
| **Archivo** | `logback-spring.xml`, services |

**Por qué importa:** No se encontró configuración de logging específico para eventos de seguridad. No hay registro de:
- Intentos de login fallidos
- Cambios de contraseña
- Creación/modificación de usuarios con roles privilegiados
- Accesos denegados (403)
- Cambios en roles o permisos

Sin estos logs, es imposible detectar un ataque en curso o realizar un análisis forense post-incidente.

**Fix sugerido:**
```java
// Agregar un SecurityAuditService:
@Component
@Slf4j
public class SecurityAuditService {
    public void logLoginAttempt(String username, boolean success, String ip) {
        log.info("SECURITY_LOGIN username={} success={} ip={}", username, success, ip);
    }
    
    public void logRoleChange(Long userId, String oldRole, String newRole, String changedBy) {
        log.warn("SECURITY_ROLE_CHANGE userId={} oldRole={} newRole={} changedBy={}", 
            userId, oldRole, newRole, changedBy);
    }
}
```
Y configurar un appender separado para eventos de seguridad en `logback-spring.xml`.

---

#### F-028 (HIGH) — SQL logging habilitado en producción (show-sql=true)

| Campo | Valor |
|-------|-------|
| **Severidad** | High |
| **Confianza** | HIGH |
| **Archivo** | `application.properties:14` |

```properties
spring.jpa.show-sql=true
```

**Por qué importa:** La propiedad `spring.jpa.show-sql=true` hace que Hibernate imprima TODAS las sentencias SQL con sus valores de parámetros en los logs de la aplicación, incluyendo:

- Datos personales de huéspedes (nombres, DNI, direcciones, emails, teléfonos)
- Credenciales hash de usuarios (aunque BCrypt está hasheado, se expone el hash)
- Tokens de reseteo de contraseña
- Montos de pagos y transacciones
- Fechas de nacimiento y另一 datos sensibles

En un entorno productivo, los logs pueden ser:
- Capturados por sistemas de agregación (ELK, Datadog, Splunk) con accesos más amplios
- Almacenados por meses/años
- Accesibles por personal de operaciones que no debería ver datos de clientes
- Expuestos en breaches si el sistema de logs es comprometido

**Fix sugerido:**
```properties
# Deshabilitar en producción
spring.jpa.show-sql=false

# Opcional: usar log-level para debugging controlado cuando sea necesario
# logging.level.org.hibernate.SQL=DEBUG     # solo SQL sin parámetros
# logging.level.org.hibernate.type.descriptor.sql.BasicBinder=TRACE  # parámetros
```
Para debugging local, es aceptable tenerlo en `true`. En producción debe ser `false`. Si se necesita logging SQL para troubleshooting, usar `logging.level` con un nivel más granular que permita desactivar sin cambiar código.

---

### A10: SSRF / Insecure Design

#### F-026 (LOW) — Brevo API key es un placeholder en el código

| Campo | Valor |
|-------|-------|
| **Severidad** | Low |
| **Confianza** | HIGH |
| **Archivo** | `.env:16` |

```
BREVO_API_KEY=xkeysib-poner-tu-api-key-aqui
```

**Por qué importa:** La API key de Brevo es un placeholder. Si alguien despliega el proyecto sin configurar una API key real, el servicio de email transaccional fallará silenciosamente. Esto puede causar que los usuarios no reciban correos de recuperación de contraseña sin ningún aviso de error.

**Fix sugerido:**
```properties
# Agregar validación al inicio:
# En BrevoEmailService, verificar que la API key no sea el placeholder
if (apiKey == null || apiKey.contains("poner-tu-api-key-aqui")) {
    log.error("BREVO_API_KEY no configurada — el servicio de email no funcionará");
}
```

---

### Infraestructura y Contenedores

#### F-011 (HIGH) — No existe `docker-compose.yml` a pesar de la dependencia

| Campo | Valor |
|-------|-------|
| **Severidad** | High |
| **Confianza** | HIGH |
| **Archivo** | `pom.xml` (dependencia `spring-boot-docker-compose`), directorio `docker/` |

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-docker-compose</artifactId>
    <scope>runtime</scope>
    <optional>true</optional>
</dependency>
```

**Por qué importa:** El proyecto declara dependencia de `spring-boot-docker-compose` pero no existe `docker-compose.yml` en la raíz ni en la carpeta `docker/`. Esto causará errores de inicio en entornos que activen el perfil docker-compose, o peor, el proyecto se iniciará sin la base de datos PostgreSQL ni el servicio Brevo.

**Fix sugerido:** Crear `docker-compose.yml` con los servicios: `postgres:16`, `api-rest` (backend), `web-app` (frontend con Nginx), y secretos montados desde `docker/secrets/`.

---

#### F-013 (LOW) — No hay `.dockerignore`

| Campo | Valor |
|-------|-------|
| **Severidad** | Low |
| **Confianza** | HIGH |
| **Archivo** | `Dockerfile` (backend), `web-app/Dockerfile` |

**Por qué importa:** Sin `.dockerignore`, el contexto de build incluye archivos innecesarios (`.git`, `node_modules/`, `target/`, `.env`) que aumentan el tamaño de la imagen y pueden filtrar secretos del directorio de build.

**Fix sugerido:**
```dockerignore
.git
node_modules
target
.env
*.md
.dockerignore
```

---

#### F-027 (LOW) — No existe `.env.example` para onboarding de desarrolladores

| Campo | Valor |
|-------|-------|
| **Severidad** | Low |
| **Confianza** | HIGH |
| **Archivo** | Raíz del proyecto |

**Por qué importa:** No existe un archivo `.env.example` que documente las variables de entorno necesarias para ejecutar el proyecto. Un nuevo desarrollador no sabe qué variables configurar ni qué valores de ejemplo usar. Esto aumenta el riesgo de que alguien copie el `.env` real (con credenciales) como plantilla.

**Fix sugerido:**
```bash
# Crear .env.example con valores placeholder
DB_HOST=localhost
DB_PORT=5432
DB_NAME=hotel_cervera_db
DB_USER=postgres
DB_PASSWORD=change-me
JWT_SECRET=generate-me-with-openssl-rand-base64-64
BREVO_API_KEY=your-brevo-api-key
# ... resto de variables
```

---

#### F-002 (MEDIUM) — Secretos en `.env` y `docker/secrets/` en texto plano en disco

| Campo | Valor |
|-------|-------|
| **Severidad** | Medium |
| **Confianza** | HIGH |
| **Archivo** | `.env` (gitignorado), `docker/secrets/db_password.txt`, `docker/secrets/jwt_secret.txt` |

```
# .env
DB_PASSWORD=1984GeorgeOrwell
JWT_SECRET=miClaveSecretaSuperSeguraParaJWT2026

# docker/secrets/db_password.txt
1984GeorgeOrwell

# docker/secrets/jwt_secret.txt  
miClaveSecretaSuperSeguraParaJWT2026
```

> **Corrección respecto a v1:** El `.env` SÍ está en `.gitignore` (línea 1). `docker/secrets/*.txt` también está gitignorado (línea 29). Sin embargo, los secretos existen en texto plano en disco local.

**Por qué importa:** Aunque los archivos están gitignorados:
1. Las contraseñas están en texto plano en disco (no cifradas en reposo)
2. El mismo JWT secret se usa en desarrollo (`.env`) y producción (`docker/secrets/`) — idealmente deberían ser distintos
3. `DB_PASSWORD=1984GeorgeOrwell` usa una referencia literaria predecible (1984 de Orwell)
4. Cualquier malware, backup no cifrado, o acceso no autorizado al sistema de archivos expone estas credenciales

**Fix sugerido:**
1. Usar diferentes secretos JWT para desarrollo y producción
2. Considerar cifrado de secrets en reposo (Bitwarden, HashiCorp Vault, sops)
3. Generar contraseñas criptográficamente aleatorias
4. Usar `openssl rand -base64 32` para la contraseña de base de datos

---

#### F-017 (LOW) — `.gitkeep` engañoso en directorio de secretos

| Campo | Valor |
|-------|-------|
| **Severidad** | Low |
| **Confianza** | HIGH |
| **Archivo** | `docker/secrets/.gitkeep` |

**Por qué importa:** El archivo `.gitkeep` en `docker/secrets/` puede dar una falsa impresión de que el directorio "debe tener secretos" y alguien podría añadir secretos reales pensando que están protegidos por git.

**Fix sugerido:** Añadir una nota en `docker/secrets/README.md` explicando que los secretos se montan externamente y no deben almacenarse en el repositorio.

---

### Dependency Vulnerabilities

#### F-014 (MEDIUM) — libphonenumber 9.0.30 con historial de vulnerabilidades

| Campo | Valor |
|-------|-------|
| **Severidad** | Medium |
| **Confianza** | MEDIUM |
| **Archivo** | `pom.xml` |

```xml
<version>9.0.30</version>
```

**Por qué importa:** libphonenumber 9.0.30 tiene un bug de heap-buffer-overflow reportado (OSV-2025-298) en versiones anteriores. Aunque 9.0.30 lo corrige, versiones posteriores (18.x+) incluyen parches de seguridad adicionales y actualizaciones de datos de operadores.

**Fix sugerido:** Evaluar actualización a la versión más reciente (revisar Maven Central).

---

#### F-015 (LOW) — Testcontainers 1.19.8 desactualizado

| Campo | Valor |
|-------|-------|
| **Severidad** | Low |
| **Confianza** | MEDIUM |
| **Archivo** | `pom.xml` |

```xml
<version>1.19.8</version>
```

**Por qué importa:** Testcontainers 1.19.8 (septiembre 2024). La versión estable más reciente incluye parches de seguridad. Las dependencias de test tienen menor prioridad pero la desactualización puede causar falsos negativos.

**Fix sugerido:** Actualizar a la versión más reciente compatible con Spring Boot 4.0.6.

---

## Riesgos de Dependencias

### Backend (Maven — pom.xml)

| Paquete | Versión | Vulnerabilidad | CVSS | Fix |
|---------|---------|----------------|------|-----|
| `spring-boot-starter-web` | 4.0.6 (BOM) | Sin CVEs conocidos en 4.0.6 (parchado) | — | OK |
| `jjwt (io.jsonwebtoken)` | 0.12.3 | CVE-2023-5072 (org.json) corregido. CVE-2024-31033 (disputado) | — | OK |
| `libphonenumber` | 9.0.30 | OSV-2025-298 (heap-buffer-overflow) corregido en versiones posteriores | N/A | Evaluar upgrade |
| `testcontainers-bom` | 1.19.8 | Sin CVEs conocidos, pero desactualizado | — | Actualizar |
| `springdoc-openapi` | 2.5.0 | Sin CVEs conocidos; bug NPE no-seguridad | — | OK |
| `spring-boot-docker-compose` | (managed) | Dependencia huérfana sin `docker-compose.yml` | — | ⚠️ CREAR |
| `postgresql` JDBC | (BOM) | Versión manejada por Spring Boot 4.0.6 | — | OK |
| `lombok` | (BOM) | Sin CVEs conocidos | — | OK |

### Frontend (npm — package.json / package-lock.json)

| Paquete | Versión | Vulnerabilidad | Fix |
|---------|---------|----------------|-----|
| `@angular/core` | 18.2.14 | Sin CVEs críticos conocidos | OK |
| `@angular/cli` | 18.2.21 | Sin CVEs críticos conocidos | OK |
| `rxjs` | 7.8.1 | Sin CVEs conocidos | OK |
| `zone.js` | 0.14.10 | Sin CVEs conocidos | OK |

### Dependencias no verificadas

| Paquete | Motivo |
|---------|--------|
| `springboot4-dotenv` (me.paulschwarz) | Dependencia de terceros para carga de `.env`. No auditada contra OSV.dev |
| `postgresql` JDBC driver | Versión manejada por Spring Boot BOM — no se verificó CVE específica |
| `springdoc-openapi 2.5.0` | Bug NPE conocido (no-seguridad) al procesar ciertos headers con `@Schema` |

---

## Prioridad de Remediación

| # | Hallazgo | Severidad | Esfuerzo | Acción inmediata |
|---|----------|-----------|----------|------------------|
| 1 | **F-019** — `/api/auth/diagnostico` público (DB + usuarios expuestos) | Critical | 15 min | Agregar `.requestMatchers("/api/auth/diagnostico").denyAll()` en SecurityConfig |
| 2 | **F-018** — Method-level security deshabilitado | Critical | 1 hora | Agregar `@EnableMethodSecurity` y empezar a migrar controllers |
| 3 | **F-001** — Sin TLS/HTTPS | Critical | 1-2 días | Configurar certificados en Nginx y redirigir HTTP → HTTPS |
| 4 | **F-004** — CORS con wildcard + credentials | Critical | 30 min | Reemplazar `allowedOriginPatterns("*")` con orígenes explícitos |
| 5 | **F-020** — IDRO en recursos de usuario | High | 2-3 días | Implementar verificación de ownership en controllers críticos |
| 6 | **F-021** — Sin rate limiting en auth | High | 1 día | Configurar rate limiting en Nginx o bucket4j |
| 7 | **F-005** — Actuator expuesto | High | 30 min | Restringir endpoints de actuator y deshabilitar los peligrosos |
| 8 | **F-006** — Swagger expuesto | High | 15 min | Proteger Swagger con autenticación o deshabilitar en producción |
| 9 | **F-028** — SQL logging en producción (show-sql=true) | High | 5 min | Cambiar `spring.jpa.show-sql=false` en application.properties |
| 10 | **F-011** — docker-compose.yml faltante | High | 2 horas | Crear docker-compose.yml con servicios y secretos |
| 11 | **F-007** — Nginx sin headers de seguridad | Medium | 30 min | Agregar cabeceras de seguridad HTTP |

---

## Veredicto Final

> **NO APTO PARA PRODUCCIÓN.**

El proyecto tiene una base sólida (Spring Boot 4 + Angular 18 modernos, BCrypt para passwords, JWT con librería actualizada, Dockerfile con usuario no-root, secrets gitignorados) pero presenta fallas críticas que lo hacen inseguro para exposición pública:

**Crítico inmediato (arreglar hoy):**
1. **Endpoint `/api/auth/diagnostico` expone DB + usuarios sin autenticación** — F-019 (solución: 15 minutos)
2. **Method-level security deshabilitado** — `@PreAuthorize` no funciona — F-018
3. **Sin HTTPS** — todo viaja en texto plano — F-001
4. **CORS con wildcard** permite a cualquier sitio web secuestrar sesiones autenticadas — F-004

**Alta prioridad (esta semana):**
5. **Sin IDRO** — usuarios pueden acceder a datos de otros — F-020
6. **Sin rate limiting** — ataques de fuerza bruta ilimitados — F-021
7. **Actuator y Swagger expuestos** — F-005, F-006
8. **SQL logging en producción (show-sql=true)** — F-028
9. **docker-compose.yml faltante** — F-011

**Se recomienda una semana de remediación** antes de considerar exposición a internet, priorizando los ítems 1-9 de la tabla de prioridades.

---

## Archivos Auditados

| Archivo | Estado |
|---------|--------|
| `pom.xml` | ✅ Revisado |
| `package.json` | ✅ Revisado |
| `package-lock.json` | ✅ Revisado |
| `application.properties` | ✅ Revisado |
| `SecurityConfig.java` | ✅ Revisado |
| `JwtUtil.java` | ✅ Revisado |
| `JwtAuthenticationFilter.java` | ✅ Revisado |
| `CustomUserDetailsService.java` | ✅ Revisado |
| `CorsConfig.java` | ✅ Revisado |
| `SwaggerConfig.java` | ✅ Revisado |
| `AuthController.java` | ✅ Revisado |
| `BrevoEmailService.java` | ✅ Revisado |
| `GlobalExceptionHandler.java` | ✅ Revisado |
| `logback-spring.xml` | ✅ Revisado |
| `Dockerfile` (backend) | ✅ Revisado |
| `web-app/Dockerfile` | ✅ Revisado |
| `web-app/nginx.conf` | ✅ Revisado |
| `docker/nginx/nginx.conf` | ✅ Revisado |
| `docker/postgres/init/01-restore.sh` | ✅ Revisado |
| `docker/secrets/*.txt` | ✅ Verificados (gitignored) |
| `.env` (raíz) | ✅ Revisado (gitignorado) |
| `.gitignore` (raíz y backend) | ✅ Revisado |
| `angular.json` | ✅ Revisado |
| `proxy.conf.json` | ✅ Revisado |
| `docker-compose.yml` | ❌ **No existe** |
| `.dockerignore` | ❌ **No existe** |
| `.env.example` | ❌ **No existe** |
| 18 controllers | ✅ Revisados (sin @PreAuthorize excepto AuthController) |
| 21 services | ✅ Revisados (sin SQL injection, Runtime.exec, I/O inseguro) |
| ~30 DTOs request | ✅ Revisados (validación insuficiente en varios) |
| 22 repositorios | ✅ Revisados (Spring Data JPA — sin SQL injection) |

---

*Reporte generado/v2 el 2026-06-07 por Claude Code Security. Los hallazgos deben ser revisados por el equipo de desarrollo antes de implementar cambios.*
