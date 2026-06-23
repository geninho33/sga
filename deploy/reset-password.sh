#!/usr/bin/env bash
# Redefine senha de login (tabela sga_usuario_senha) — funciona mesmo se o GAM estiver com problema.
#
# Uso no servidor:
#   cd /var/sga/deploy
#   chmod +x reset-password.sh
#   ./reset-password.sh admin MinhaSenhaSegura
set -euo pipefail

CONTAINER="${SGA_CONTAINER_NAME:-sga}"
LOGIN="${1:-}"
SENHA="${2:-}"

if [[ -z "$LOGIN" || -z "$SENHA" ]]; then
  echo "Uso: $0 <usuario> <senha>"
  echo "Ex.: $0 admin MinhaSenhaSegura"
  exit 1
fi

if ! docker ps --format '{{.Names}}' | grep -qx "$CONTAINER"; then
  echo "ERRO: container $CONTAINER não está rodando."
  exit 1
fi

docker exec "$CONTAINER" node scripts/set-user-password.mjs "$LOGIN" "$SENHA"
echo ""
echo "Pronto. Entre com usuário: $LOGIN e a senha definida."
echo "Use https://sga.sgebr.net.br (não http://IP:13080)."
