#!/usr/bin/env bash
# Cria o perfil super_usuario (acesso total) e vincula ao usuário admin (ou outro login).
#
# Uso no servidor:
#   cd /var/alimentacao-escolar/deploy
#   chmod +x seed-super-usuario.sh
#   ./seed-super-usuario.sh
#   ./seed-super-usuario.sh admin
set -euo pipefail

LOGIN="${1:-admin}"

if ! docker ps --format '{{.Names}}' | grep -qx 'sga-alimentacao-escolar'; then
  echo "ERRO: container sga-alimentacao-escolar não está rodando."
  exit 1
fi

docker exec sga-alimentacao-escolar node scripts/seed-super-usuario.mjs "$LOGIN"
echo ""
echo "Pronto. Faça logout e login novamente com: $LOGIN"
