#!/bin/sh
set -e

cd /app/api

echo "[sga] Host MySQL: ${MYSQL_HOST:-?}:${MYSQL_PORT:-3306} / DB: ${MYSQL_DATABASE:-?}"

echo "[sga] Aguardando MySQL..."
node scripts/wait-mysql.mjs

echo "[sga] Aplicando migrations..."
node scripts/migrate.mjs up

echo "[sga] Validando Nginx..."
nginx -t

echo "[sga] Iniciando API na porta ${PORT:-3001}..."
node src/index.js &
API_PID=$!

trap 'kill -TERM "$API_PID" 2>/dev/null; exit 0' TERM INT

# Se a API cair, encerra o container (evita nginx sem backend)
(
  while kill -0 "$API_PID" 2>/dev/null; do sleep 2; done
  echo "[sga] ERRO: processo da API encerrou inesperadamente."
  kill -TERM $$
) &

echo "[sga] Iniciando Nginx na porta 80..."
exec nginx -g 'daemon off;'
