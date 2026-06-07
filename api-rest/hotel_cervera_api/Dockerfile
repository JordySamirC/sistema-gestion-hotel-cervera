# ── Etapa 1: Build ────────────────────────────────────────────────
FROM eclipse-temurin:17.0.11_9-jdk-alpine AS builder
WORKDIR /build

# Copiar descriptores de dependencias primero esto aprovecha la caché de capas
COPY mvnw pom.xml ./
COPY .mvn .mvn
RUN chmod +x mvnw && ./mvnw dependency:go-offline -q

# Copiar código fuente y compilar sin tests
COPY src ./src
RUN ./mvnw package -DskipTests -q

# ── Etapa 2: Runtime ──────────────────────────────────────────────
FROM eclipse-temurin:17.0.11_9-jre-alpine AS runtime

# Crear grupo y usuario no-root para ejecutar la aplicación
RUN addgroup -S hotelapp && adduser -S -G hotelapp -u 1001 hotelapp

WORKDIR /app

# Copiar JAR compilado desde la etapa de build
COPY --from=builder /build/target/*.jar app.jar

# Crear directorio de logs y asignar propietario
RUN mkdir -p /app/logs && chown -R hotelapp:hotelapp /app

# Cambiar al usuario no-root
USER hotelapp

EXPOSE 8080

# Leer Docker Secrets desde archivos /run/secrets/ antes de lanzar el JAR
ENTRYPOINT ["sh", "-c", "\
  export DB_PASSWORD=$(cat /run/secrets/db_password) && \
  export JWT_SECRET=$(cat /run/secrets/jwt_secret) && \
  export BREVO_API_KEY=$(cat /run/secrets/brevo_api_key) && \
  java -Xms256m -Xmx512m \
  -Dspring.config.import= \
  -Dspring.datasource.password=${DB_PASSWORD} \
  -Djwt.secret=${JWT_SECRET} \
  -Dbrevo.api-key=${BREVO_API_KEY} \
  -jar app.jar"]
