#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FAILED=0

run_npm_tests() {
  local name="$1"
  local dir="$2"
  local command="$3"

  printf '\n[TEST] %s\n' "${name}"
  cd "${ROOT_DIR}/${dir}"

  if [ -f package-lock.json ]; then
    npm ci
  else
    npm install
  fi

  if ! eval "${command}"; then
    printf '[FAIL] %s\n' "${name}" >&2
    FAILED=$((FAILED + 1))
  else
    printf '[OK] %s\n' "${name}"
  fi
}

run_npm_tests "frontend" "frontend" "npm test"
run_npm_tests "auth-service" "services/auth-service" "npm test"
run_npm_tests "product-service" "services/product-service" "npm test"
run_npm_tests "order-service" "services/order-service" "npm test"

if [ "${FAILED}" -ne 0 ]; then
  printf '\n[ERROR] %s suite(s) de tests en echec.\n' "${FAILED}" >&2
  exit 1
fi

printf '\n[OK] Toutes les suites de tests sont passees.\n'
