#!/usr/bin/env bash
# Deploy / atualização do SGA Alimentação Escolar (Docker)
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

BRANCH="${1:-main}"
COMPOSE="docker compose"
if ! docker compose version >/dev/null 2>&1; then
  COMPOSE="docker-compose"
fi

log() { printf '\n[deploy] %s\n' "$*"; }

if [[ ! -f .env ]]; then
  if [[ -f .env.example ]]; then
    log "Arquivo .env não encontrado — copiando de .env.example"
    cp .env.example .env
    log "Edite .env (MYSQL_PASSWORD, JWT_SECRET) antes de continuar."
    exit 1
  fi
  log "ERRO: crie o arquivo .env (veja .env.example)"
  exit 1
fi

# shellcheck disable=SC1091
source .env 2>/dev/null || true
if [[ -z "${JWT_SECRET:-}" || "${JWT_SECRET}" == "altere-este-segredo-em-producao" ]]; then
  log "AVISO: defina JWT_SECRET forte no .env"
fi
if [[ -z "${MYSQL_PASSWORD:-}" ]]; then
  log "AVISO: MYSQL_PASSWORD vazio no .env"
fi

if command -v git >/dev/null 2>&1 && [[ -d .git ]]; then
  log "Atualizando código (git pull origin ${BRANCH})..."
  git fetch origin "$BRANCH"
  git checkout "$BRANCH"
  git pull origin "$BRANCH"
else
  log "Git não disponível ou não é repositório — usando código local."
fi

log "Construindo imagem Docker..."
$COMPOSE build --pull

log "Subindo container..."
$COMPOSE up -d --remove-orphans

log "Aguardando healthcheck..."
sleep 5
$COMPOSE ps

if $COMPOSE exec -T sga wget -qO- http://127.0.0.1/health >/dev/null 2>&1; then
  log "Sistema OK — healthcheck respondeu."
else
  log "Container iniciado; verifique logs se o health ainda não respondeu:"
  log "  $COMPOSE logs -f sga"
fi

HTTP_PORT="${SGA_HTTP_PORT:-8080}"
log "Acesso: http://localhost:${HTTP_PORT}"
log "Deploy concluído."
