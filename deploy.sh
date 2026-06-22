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
HTTP_PORT="${SGA_HTTP_PORT:-13080}"

if [[ -z "${JWT_SECRET:-}" || "${JWT_SECRET}" == "altere-este-segredo-em-producao" ]]; then
  log "AVISO: defina JWT_SECRET forte no .env"
fi
if [[ -z "${MYSQL_PASSWORD:-}" ]]; then
  log "AVISO: MYSQL_PASSWORD vazio no .env"
fi

port_in_use() {
  if command -v ss >/dev/null 2>&1; then
    ss -tln | grep -q ":${HTTP_PORT} "
    return $?
  fi
  if command -v netstat >/dev/null 2>&1; then
    netstat -tln 2>/dev/null | grep -q ":${HTTP_PORT} "
    return $?
  fi
  return 1
}

port_owner() {
  docker ps --format '{{.Names}}\t{{.Ports}}' 2>/dev/null | grep -E ":${HTTP_PORT}->" || true
}

if port_in_use; then
  if docker ps -a --format '{{.Names}}' | grep -qx 'sga-alimentacao-escolar'; then
    log "Porta ${HTTP_PORT} em uso — recriando container SGA..."
    $COMPOSE down || true
  else
    log "ERRO: porta ${HTTP_PORT} já está em uso por outro processo:"
    port_owner
    log "Altere SGA_HTTP_PORT no .env (ex.: 13081) e atualize o upstream em docker/nginx-host-https.conf"
    exit 1
  fi
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
  log "Container com problema. Veja os logs:"
  log "  $COMPOSE logs --tail=80 sga"
  log "Causas comuns: MYSQL_HOST/PORT incorretos, senha vazia, migrations falhando."
fi

HTTP_PORT="${SGA_HTTP_PORT:-13080}"
log "Container HTTP: http://127.0.0.1:${HTTP_PORT}"
log "Produção HTTPS: configure docker/nginx-host-https.conf no Nginx do host (proxy → :${HTTP_PORT})"
log "Deploy concluído."
