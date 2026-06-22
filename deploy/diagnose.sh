#!/usr/bin/env bash
# Diagnóstico rápido no servidor (/var/alimentacao-escolar/deploy)
set -euo pipefail

DEPLOY="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DEPLOY"

echo "=== Container ==="
docker ps -a --filter name=sga-alimentacao-escolar --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'

echo ""
echo "=== Logs (últimas 80 linhas) ==="
docker logs sga-alimentacao-escolar --tail 80 2>&1 || echo "(container não encontrado)"

echo ""
echo "=== deploy/.env (sem senha) ==="
if [[ -f .env ]]; then
  grep -E '^(SGA_|MYSQL_HOST|MYSQL_PORT|MYSQL_USER|MYSQL_DATABASE|MYSQL_GAM)' .env || true
  grep -q '^MYSQL_PASSWORD=.\+' .env && echo "MYSQL_PASSWORD=***" || echo "MYSQL_PASSWORD=(vazio)"
else
  echo "deploy/.env não existe"
fi

echo ""
echo "=== mysql-aliesc ==="
docker ps --filter name=mysql-aliesc --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}' 2>/dev/null || true
