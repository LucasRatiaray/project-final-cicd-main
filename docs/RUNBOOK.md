# Runbook

## Demarrage local

```bash
docker-compose up --build
```

Si le port `3000` est deja pris :

```bash
ss -ltnp | grep ':3000'
```

Arreter le processus concerne ou changer temporairement le mapping local dans `docker-compose.yml`.

## Initialiser les produits

```bash
./scripts/init-products.sh
```

Le script est idempotent : il ignore les produits deja presents avec le meme nom.

En Swarm, les backends ne publient pas leurs ports. Passer par le proxy frontend :

```bash
PRODUCT_API_URL=http://localhost:8080/api ./scripts/init-products.sh
```

Adapter le port selon la stack cible :

- dev Swarm : `8082`
- staging : `8081`
- production : `8080`

## Healthchecks

```bash
curl http://localhost:8080/health
curl http://localhost:3001/api/health
curl http://localhost:3000/api/health
curl http://localhost:3002/api/health
```

## Logs

```bash
docker-compose logs -f frontend
docker-compose logs -f auth-service
docker-compose logs -f product-service
docker-compose logs -f order-service
docker-compose logs -f mongodb
```

Les backends affichent un `X-Request-Id` dans les logs pour faciliter le suivi.

## Verifier une stack Swarm

Un `docker stack deploy` peut reussir alors que les services ne sont pas encore prets. Verifier toujours les replicas :

```bash
docker stack services e-commerce
docker service ps --no-trunc e-commerce_mongodb
docker service logs --tail=100 e-commerce_mongodb
```

Remplacer `e-commerce` par `e-commerce-staging` ou `e-commerce-dev` selon l'environnement.

La stack est prete quand les services affichent les replicas attendus, par exemple `mongodb 1/1`, les backends `2/2` en staging/production, ou `1/1` en dev Swarm.

Si `e-commerce_mongodb` reste a `0/1`, lire d'abord ses tasks et logs. Les causes courantes sont un volume MongoDB incompatible apres changement de version, un probleme disque, ou une image MongoDB trop recente pour le CPU. Le projet utilise `mongo:4.4.18` pour eviter les problemes AVX de MongoDB 5/6.

Verifier aussi l'espace disque Docker sur le manager :

```bash
docker system df
df -h
```

Si les logs MongoDB indiquent `No space left on device`, liberer de l'espace avant de redeployer. Ne supprimer le volume `e-commerce_mongodb_data` que si les donnees peuvent etre perdues.

Verifier ensuite l'entree frontend :

```bash
curl http://<DEPLOY_HOST>:8080/health
curl http://<DEPLOY_HOST>:8080/api/products
```

Utiliser `8082` pour dev Swarm et `8081` pour staging. Si le runner GitLab tourne directement sur le manager Swarm, `DEPLOY_HOST` peut rester vide : la pipeline detecte l'adresse du node Docker courant.

## Nettoyer l'environnement local

```bash
docker-compose down -v --remove-orphans
```

## Deploy dev Swarm

```bash
export CI_REGISTRY_IMAGE=registry.gitlab.com/groupe/projet
export IMAGE_TAG=<commit-sha>
export DEV_FRONTEND_PORT=8082
export DEV_CORS_ORIGIN=http://<DEPLOY_HOST>:8082
docker-compose -f docker-compose.dev.yml build
docker stack deploy -c docker-compose.dev.yml e-commerce-dev --with-registry-auth
```

Cette stack utilise les champs `image` au moment du deploy Swarm. Le `build` ci-dessus est utile en manuel pour produire les images localement ; dans la pipeline, ce sont les jobs `build_*` qui s'en chargent avant `deploy_dev`.

## Deploy staging

```bash
export CI_REGISTRY_IMAGE=registry.gitlab.com/groupe/projet
export IMAGE_TAG=<commit-sha>
export JWT_SECRET=<secret-staging>
export STAGING_FRONTEND_PORT=8081
export STAGING_CORS_ORIGIN=http://<DEPLOY_HOST>:8081
docker stack deploy -c docker-compose.staging.yml e-commerce-staging --with-registry-auth
```

## Deploy production

```bash
export CI_REGISTRY_IMAGE=registry.gitlab.com/groupe/projet
export IMAGE_TAG=<commit-sha>
export JWT_SECRET=<secret-production>
export CORS_ORIGIN=https://shop.example.com
docker stack deploy -c docker-compose.prod.yml e-commerce --with-registry-auth
```

## Nettoyer les stacks Swarm

```bash
docker stack rm e-commerce-dev
docker stack rm e-commerce-staging
docker stack rm e-commerce
docker service ls
docker volume ls
```

Supprimer les volumes Docker associes a MongoDB efface les donnees de l'environnement concerne.
