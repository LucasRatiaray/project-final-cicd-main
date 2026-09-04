# Audit et corrections

## P0 corriges

- Dockerfiles backend mono-stage remplaces par des Dockerfiles multi-target.
- Compose dev Swarm, staging et production alignes sur les images construites par la CI.
- `auth_service`, `product_service`, `order_service` remplaces par `auth-service`, `product-service`, `order-service`.
- MongoDB local Debian/libssl supprime des scripts et de la documentation.
- Product service deplace de la base `ecommerce` vers `products`.
- Secrets `.env` retires du depot.

## P1 corriges

- Proxy frontend runtime base sur `AUTH_SERVICE_URL`, `PRODUCT_SERVICE_URL`, `ORDER_SERVICE_URL`.
- URLs frontend relatives `/api/...`.
- `PRODUCT_SERVICE_URL` utilise par `order-service` au lieu d'une variable `VITE_*`.
- Healthchecks enrichis pour les backends.
- `APP_ENV` explicite pour `development`, `staging`, `production`, `test`.
- `JWT_SECRET` obligatoire en staging et production. La stack dev Swarm peut utiliser `DEV_JWT_SECRET` avec fallback non sensible.
- Request ID HTTP ajoute via `X-Request-Id`.

## P2 corriges

- README reecrit.
- Documentation detaillee ajoutee dans `docs/`.
- Scripts simplifies et rendus Docker-first.
- `.dockerignore` ajoutes.
- Anciens fichiers CI vides supprimes.

## Risques restants

- `npm audit` signale encore des vulnerabilites dans des dependances existantes. Les corriger proprement demande une passe dediee de mise a jour de dependances et de tests de regression.
- Le test `docker-compose up` complet necessite que le port local `3000` soit libre.
- Le deploy Swarm doit etre valide sur un vrai manager Swarm avec le GitLab Container Registry accessible.
- Les volumes MongoDB Swarm restent locaux au node qui heberge la tache `mongodb`. Une vraie production demanderait un stockage partage, une contrainte de placement ou un MongoDB externe.

## Verification recommandee

```bash
npm ci --prefix frontend
npm test --prefix frontend
npm ci --prefix services/auth-service
npm test --prefix services/auth-service
npm ci --prefix services/product-service
npm test --prefix services/product-service
npm ci --prefix services/order-service
npm test --prefix services/order-service

docker-compose config
CI_REGISTRY_IMAGE=registry.example.com/group/project IMAGE_TAG=test DEV_JWT_SECRET=dummy docker-compose -f docker-compose.dev.yml config
CI_REGISTRY_IMAGE=registry.example.com/group/project IMAGE_TAG=test JWT_SECRET=dummy docker-compose -f docker-compose.prod.yml config
CI_REGISTRY_IMAGE=registry.example.com/group/project IMAGE_TAG=test JWT_SECRET=dummy docker-compose -f docker-compose.staging.yml config
```
