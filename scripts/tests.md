# Tests utiles

Depuis la racine :

```bash
./scripts/run-tests.sh
```

Par service :

```bash
cd frontend && npm ci && npm test
cd services/auth-service && npm ci && npm test
cd services/product-service && npm ci && npm test
cd services/order-service && npm ci && npm test
```

Avec MongoDB Docker externe pour les tests backend :

```bash
docker-compose up -d mongodb
cd services/auth-service
USE_EXTERNAL_MONGODB=true MONGODB_URI=mongodb://localhost:27017/auth_test JWT_SECRET=test_jwt_secret npm test
```

Healthchecks en dev :

```bash
curl http://localhost:8080/health
curl http://localhost:3001/api/health
curl http://localhost:3000/api/health
curl http://localhost:3002/api/health
```
