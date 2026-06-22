#!/bin/sh
set -e

cd /app/api

echo "[sga] Aplicando migrations..."
node scripts/migrate.mjs up

echo "[sga] Iniciando API na porta 3001..."
node src/index.js &
API_PID=$!

trap 'kill -TERM "$API_PID" 2>/dev/null; exit 0' TERM INT

echo "[sga] Iniciando Nginx na porta 80..."
exec nginx -g 'daemon off;'
