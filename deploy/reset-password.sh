#!/usr/bin/env bash
# Redefine senha de login (tabela sga_usuario_senha) — funciona mesmo se o GAM estiver com problema.
#
# Uso no servidor:
#   cd /var/alimentacao-escolar/deploy
#   chmod +x reset-password.sh
#   ./reset-password.sh admin MinhaSenhaSegura
set -euo pipefail

LOGIN="${1:-}"
SENHA="${2:-}"

if [[ -z "$LOGIN" || -z "$SENHA" ]]; then
  echo "Uso: $0 <usuario> <senha>"
  echo "Ex.: $0 admin MinhaSenhaSegura"
  exit 1
fi

if ! docker ps --format '{{.Names}}' | grep -qx 'sga-alimentacao-escolar'; then
  echo "ERRO: container sga-alimentacao-escolar não está rodando."
  exit 1
fi

docker exec sga-alimentacao-escolar node scripts/set-user-password.mjs "$LOGIN" "$SENHA"
echo ""
echo "Pronto. Entre com usuário: $LOGIN e a senha definida."
echo "Use https://sga.sgebr.net.br (não http://IP:13080)."
