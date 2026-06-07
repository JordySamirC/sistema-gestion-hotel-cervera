# ── Etapa 1: Build Angular ────────────────────────────────────────
FROM node:20.14.0-alpine AS builder
WORKDIR /app

# ARG de build-time (no es un secreto — es la URL pública del backend)
ARG API_URL=http://localhost:8080
ENV API_URL=${API_URL}

# Instalar dependencias usando package-lock.json exacto
COPY package.json package-lock.json ./
RUN npm ci --prefer-offline

# Copiar código fuente y compilar en modo producción
COPY . .
RUN npx ng build --configuration=production
# Angular 17+ con builder 'application' genera en dist/web-app/browser

# ── Etapa 2: Nginx para servir el SPA compilado ───────────────────
FROM nginx:1.27.0-alpine AS production

# Eliminar configuración por defecto
RUN rm -rf /etc/nginx/conf.d/*

# Copiar configuración personalizada de Nginx
# (nginx.conf está en web-app/ — dentro del contexto de build)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiar archivos compilados de Angular
# Angular 17+ con builder 'application' genera en dist/<project>/browser
COPY --from=builder /app/dist/web-app/browser /usr/share/nginx/html

# Permisos para usuario nginx (no-root) en puerto 8080
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    touch /var/run/nginx.pid && \
    chown nginx:nginx /var/run/nginx.pid

USER nginx
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
