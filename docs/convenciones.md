# Convenciones de Git y GitHub

## Estrategia de Ramas: GitHub Flow

- `main` siempre debe estar desplegable
- Cada funcionalidad/corrección en una rama corta desde `main`
- Todo cambio pasa por Pull Request
- **Nunca** hacer commit directo a `main`

### Nombres de ramas

| Prefijo | Uso | Ejemplo |
|---------|-----|---------|
| `feat/` | Nueva funcionalidad | `feat/autenticacion-jwt` |
| `fix/` | Corrección de bug | `fix/login-error` |
| `docs/` | Documentación | `docs/actualizar-readme` |
| `refactor/` | Refactorización | `refactor/limpiar-servicios` |
| `chore/` | Mantenimiento | `chore/actualizar-dependencias` |
| `hotfix/` | Corrección urgente | `hotfix/seguridad-cors` |

## Formato de Commits: Conventional Commits

```
<tipo>(<ámbito>): <descripción en imperativo presente>

<cuerpo opcional (qué y por qué)>
<pie opcional>
```

### Tipos permitidos

| Tipo | Uso | Ejemplo |
|------|-----|---------|
| `feat` | Nueva funcionalidad | `feat(auth): agregar filtro de autenticación JWT` |
| `fix` | Corrección de error | `fix(login): corregir validación de token expirado` |
| `docs` | Documentación | `docs(readme): actualizar instrucciones de instalación` |
| `style` | Formato | `style: corregir indentación en auth service` |
| `refactor` | Refactorización | `refactor(api): simplificar método de validación` |
| `perf` | Rendimiento | `perf(consulta): optimizar búsqueda de usuarios` |
| `test` | Tests | `test(auth): agregar pruebas unitarias para login` |
| `chore` | Mantenimiento | `chore: actualizar dependencias de Spring Boot` |
| `ci` | CI/CD | `ci: agregar workflow de GitHub Actions` |

### Reglas

- Usar imperativo presente: `agregar`, no `agregué`
- Sin punto final en la descripción
- Máximo 52 caracteres en la descripción
- Describir **qué** y **por qué** en el cuerpo

## Pull Requests

- Usar la plantilla en `.github/pull_request_template.md`
- Squash and merge al fusionar
- Al menos 1 aprobación antes de mergear

## Flujo Diario

```bash
# Antes de empezar
git checkout main && git pull

# Crear rama
git checkout -b feat/mi-funcionalidad

# Commits frecuentes y atómicos
git add .
git commit -m "feat(scope): descripción"

# Subir
git push origin feat/mi-funcionalidad

# Sincronizar (rebase, no merge)
git fetch origin
git rebase origin/main
git push --force-with-lease
```
