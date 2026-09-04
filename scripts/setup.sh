#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

info() { printf '[INFO] %s\n' "$*"; }
error() { printf '[ERROR] %s\n' "$*" >&2; }

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    error "$1 est requis."
    exit 1
  fi
}

npm_install() {
  local dir="$1"
  info "Installation des dependances dans ${dir}"
  cd "${ROOT_DIR}/${dir}"
  if [ -f package-lock.json ]; then
    npm ci
  else
    npm install
  fi
}

require_command git
require_command node
require_command npm
require_command docker

if command -v docker-compose >/dev/null 2>&1; then
  COMPOSE_CMD="docker-compose"
elif docker compose version >/dev/null 2>&1; then
  COMPOSE_CMD="docker compose"
else
  error "Docker Compose est requis."
  exit 1
fi

info "MongoDB ne doit pas etre installe localement pour ce projet."
info "La base de donnees est lancee par Docker Compose avec un volume nomme."

npm_install frontend
npm_install services/auth-service
npm_install services/product-service
npm_install services/order-service

cd "${ROOT_DIR}"
info "Validation de la configuration Docker Compose"
${COMPOSE_CMD} -f docker-compose.yml config >/dev/null

info "Environnement pret."
info "Demarrage: ${COMPOSE_CMD} up --build"
info "Initialisation produits: ./scripts/init-products.sh"
