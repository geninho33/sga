#!/usr/bin/env bash
# Cria o perfil super_usuario (acesso total) e vincula ao usuário admin (ou outro login).
#
# Uso no servidor:
#   cd /var/sga/deploy
#   chmod +x seed-super-usuario.sh
#   ./seed-super-usuario.sh
#   ./seed-super-usuario.sh admin
set -euo pipefail

CONTAINER="${SGA_CONTAINER_NAME:-sga}"
LOGIN="${1:-admin}"

if ! docker ps --format '{{.Names}}' | grep -qx "$CONTAINER"; then
  echo "ERRO: container $CONTAINER não está rodando."
  exit 1
fi

docker exec "$CONTAINER" node scripts/seed-super-usuario.mjs "$LOGIN"
echo ""
echo "Pronto. Faça logout e login novamente com: $LOGIN"
