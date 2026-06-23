#!/usr/bin/env bash
# Diagnóstico rápido no servidor (/var/sga/deploy)
set -euo pipefail

DEPLOY="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DEPLOY"
CONTAINER="${SGA_CONTAINER_NAME:-sga}"

echo "=== Container ==="
docker ps -a --filter name="$CONTAINER" --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'

echo ""
echo "=== Logs (últimas 80 linhas) ==="
docker logs "$CONTAINER" --tail 80 2>&1 || echo "(container não encontrado)"

echo ""
echo "=== deploy/.env (sem senha) ==="
if [[ -f .env ]]; then
  grep -E '^(SGA_|MYSQL_HOST|MYSQL_PORT|MYSQL_USER|MYSQL_DATABASE|MYSQL_GAM)' .env || true
  grep -q '^MYSQL_PASSWORD=.\+' .env && echo "MYSQL_PASSWORD=***" || echo "MYSQL_PASSWORD=(vazio)"
else
  echo "deploy/.env não existe"
fi

echo ""
echo "=== GAM (dentro do container) ==="
docker exec "$CONTAINER" node -e "
import { config } from './src/config.js';
import mysql from 'mysql2/promise';
try {
  const c = await mysql.createConnection({
    host: config.mysql.host,
    port: config.mysql.port,
    user: config.mysql.user,
    password: config.mysql.password,
    database: config.mysql.gamDatabase,
  });
  await c.ping();
  console.log('GAM OK:', config.mysql.gamDatabase);
  await c.end();
} catch (e) {
  console.log('GAM ERRO:', config.mysql.gamDatabase, '-', e.message);
}
" 2>/dev/null || echo "(container parado — não foi possível testar GAM)"

echo ""
echo "=== Login admin (trnsusuarios) ==="
docker exec "$CONTAINER" node -e "
import { pool } from './src/db.js';
const [users] = await pool.query(
  \`SELECT u.usuUsuario, u.usuNome, u.usuStatus,
          (SELECT COUNT(*) FROM sga_usuario_senha s
           WHERE s.prefCodigo=u.prefCodigo AND s.usuCodigo=u.usuCodigo) AS tem_sga_senha
   FROM trnsusuarios u
   WHERE LOWER(TRIM(u.usuUsuario))='admin'
   ORDER BY u.usuCodigo\`
);
if (!users.length) console.log('Nenhum usuário admin encontrado.');
else users.forEach(u => console.log(
  '- login:', (u.usuUsuario||'').trim(),
  '| status:', u.usuStatus,
  '| sga_usuario_senha:', Number(u.tem_sga_senha) ? 'SIM' : 'NÃO'
));
process.exit(0);
" 2>/dev/null || echo "(container parado)"
