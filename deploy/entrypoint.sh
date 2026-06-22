#!/bin/sh
set -e

cd /app/api

fail() {
  echo "[sga] ERRO: $*"
  exit 1
}

echo "[sga] Host MySQL: ${MYSQL_HOST:-?}:${MYSQL_PORT:-3306} / DB: ${MYSQL_DATABASE:-?}"

echo "[sga] Aguardando MySQL..."
node scripts/wait-mysql.mjs || fail "MySQL inacessível (confira MYSQL_HOST, MYSQL_PORT, MYSQL_PASSWORD no deploy/.env)"

echo "[sga] Aplicando migrations..."
node scripts/migrate.mjs up || fail "Migration falhou (veja mensagem acima)"

echo "[sga] Validando Nginx..."
nginx -t || fail "Configuração Nginx inválida"

stop_api() {
  if [ -n "${API_PID:-}" ] && kill -0 "$API_PID" 2>/dev/null; then
    echo "[sga] Encerrando API (PID $API_PID)..."
    kill -TERM "$API_PID" 2>/dev/null || true
    wait "$API_PID" 2>/dev/null || true
  fi
}

trap 'stop_api; exit 0' TERM INT

echo "[sga] Iniciando Node em segundo plano (porta ${PORT:-3001})..."
nohup node src/index.js >>/proc/1/fd/1 2>>/proc/1/fd/2 &
API_PID=$!
echo "[sga] API em execução — PID $API_PID"

echo "[sga] Aguardando API responder..."
tries=0
max="${API_READY_TIMEOUT:-90}"
while [ $tries -lt $max ]; do
  if wget -qO- "http://127.0.0.1:${PORT:-3001}/health" >/dev/null 2>&1; then
    echo "[sga] API pronta."
    break
  fi
  if ! kill -0 "$API_PID" 2>/dev/null; then
    fail "processo Node encerrou antes de ficar pronto (veja logs acima)"
  fi
  tries=$((tries + 1))
  sleep 1
done

if [ $tries -eq $max ]; then
  stop_api
  fail "API não respondeu em ${max}s"
fi

(
  while kill -0 "$API_PID" 2>/dev/null; do sleep 5; done
  echo "[sga] ERRO: processo Node encerrou inesperadamente."
  nginx -s quit 2>/dev/null || true
) &

echo "[sga] Iniciando Nginx em primeiro plano (porta 80)..."
exec nginx -g 'daemon off;'
