#!/bin/bash
# =============================================================================
# 01-restore.sh — Restauración idempotente de base de datos Hotel Cervera
# =============================================================================
# Este script es ejecutado automáticamente por el contenedor de PostgreSQL
# SOLO cuando el volumen de datos está vacío (primera inicialización).
# En reinicios posteriores NO se ejecuta, garantizando idempotencia.
#
# Archivo de backup:
#   /backups/hotel_cervera_db.dump  → formato custom pg_dump
# =============================================================================

set -e

BACKUP_CUSTOM="/backups/hotel_cervera_db.dump"
BACKUP_SQL="/backups/hotel_cervera_db.sql"
DB_NAME="${POSTGRES_DB}"
DB_USER="${POSTGRES_USER}"

echo ""
echo "=========================================================="
echo "  Hotel Cervera — Inicialización de Base de Datos"
echo "=========================================================="

# ── Verificar si existe algún backup ──────────────────────────────
if [ -f "${BACKUP_CUSTOM}" ]; then
    echo "[INFO] Backup detectado (formato custom): ${BACKUP_CUSTOM}"
    echo "[INFO] Restaurando base de datos '${DB_NAME}'..."

    pg_restore \
        --username="${DB_USER}" \
        --dbname="${DB_NAME}" \
        --no-password \
        --verbose \
        --clean \
        --if-exists \
        "${BACKUP_CUSTOM}" 2>&1 | tail -20

    echo "[OK] Restauración desde formato custom completada."

elif [ -f "${BACKUP_SQL}" ]; then
    echo "[INFO] Backup detectado (formato SQL): ${BACKUP_SQL}"
    echo "[INFO] Restaurando base de datos '${DB_NAME}'..."

    psql \
        --username="${DB_USER}" \
        --dbname="${DB_NAME}" \
        --file="${BACKUP_SQL}"

    echo "[OK] Restauración desde SQL completada."

else
    echo "[AVISO] No se encontró ningún archivo de backup en /backups/"
    echo "[AVISO] Archivos buscados:"
    echo "         - ${BACKUP_CUSTOM}"
    echo "         - ${BACKUP_SQL}"
    echo "[INFO]  Se iniciará con base de datos vacía."
    echo "[INFO]  Hibernate (ddl-auto=update) creará las tablas automáticamente."
fi

echo "=========================================================="
echo "  Inicialización completada."
echo "=========================================================="
echo ""
