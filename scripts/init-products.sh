#!/usr/bin/env bash
set -euo pipefail

API_URL="${PRODUCT_API_URL:-http://localhost:3000/api}"

if ! command -v node >/dev/null 2>&1; then
  echo "[ERROR] Node.js 18+ est requis pour executer ce script." >&2
  exit 1
fi

PRODUCT_API_URL="${API_URL}" node --input-type=module <<'NODE'
const baseUrl = process.env.PRODUCT_API_URL.replace(/\/$/, '');

const products = [
  { name: 'Smartphone Galaxy S21', price: 899, description: 'Dernier smartphone Samsung avec appareil photo 108MP', stock: 15 },
  { name: 'MacBook Pro M1', price: 1299, description: 'Ordinateur portable Apple avec puce M1', stock: 10 },
  { name: 'PS5', price: 499, description: 'Console de jeu derniere generation', stock: 5 },
  { name: 'Ecouteurs AirPods Pro', price: 249, description: 'Ecouteurs sans fil avec reduction de bruit', stock: 20 },
  { name: 'Nintendo Switch', price: 299, description: 'Console de jeu portable', stock: 12 },
  { name: 'iPad Air', price: 599, description: 'Tablette Apple avec ecran Retina', stock: 8 },
  { name: 'Montre connectee', price: 199, description: "Montre intelligente avec suivi d'activite", stock: 25 },
  { name: 'Enceinte Bluetooth', price: 79, description: 'Enceinte portable waterproof', stock: 30 },
];

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function waitForProductService() {
  for (let attempt = 1; attempt <= 30; attempt += 1) {
    try {
      const healthResponse = await fetch(`${baseUrl}/health`);
      if (healthResponse.ok) return;
    } catch (_error) {
      // Some entrypoints, such as the frontend proxy, do not expose /api/health.
    }

    try {
      const productsResponse = await fetch(`${baseUrl}/products`);
      if (productsResponse.ok) return;
    } catch (_error) {
      // Retry until the service is ready.
    }
    await sleep(2000);
  }
  throw new Error(`product-service indisponible sur ${baseUrl}`);
}

async function getProducts() {
  const response = await fetch(`${baseUrl}/products`);
  if (!response.ok) {
    throw new Error(`Impossible de lire les produits: HTTP ${response.status}`);
  }
  return response.json();
}

async function createProduct(product) {
  const response = await fetch(`${baseUrl}/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(product),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Creation echouee pour ${product.name}: HTTP ${response.status} ${body}`);
  }
}

await waitForProductService();
const existing = await getProducts();
const existingNames = new Set(existing.map(product => product.name));

for (const product of products) {
  if (existingNames.has(product.name)) {
    console.log(`[SKIP] ${product.name}`);
    continue;
  }
  await createProduct(product);
  console.log(`[OK] ${product.name}`);
}

console.log('Initialisation des produits terminee.');
NODE
