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

# Configurar zona horaria (opcional pero recomendado)
ENV TZ=America/Lima

EXPOSE 8080

# Iniciar la aplicación usando variables de entorno inyectadas por Render
ENTRYPOINT ["sh", "-c", "java -Xms256m -Xmx512m -jar app.jar"]
