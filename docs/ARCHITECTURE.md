# Architecture

## Vue d'ensemble

L'application est decoupee en 4 services applicatifs et un service de donnees :

- `frontend` : Vue/Vite. En production, le serveur Express `server.cjs` sert le build statique et proxy les appels API.
- `auth-service` : inscription, connexion, profil utilisateur, JWT.
- `product-service` : catalogue produits et panier.
- `order-service` : creation, lecture et annulation des commandes.
- `mongodb` : un seul serveur MongoDB Docker, avec une base logique par backend.

## Flux HTTP

Le navigateur parle au frontend sur le port `8080`.

Le frontend proxy ensuite :

- `/api/auth` vers `auth-service:3001`
- `/api/products` vers `product-service:3000`
- `/api/cart` vers `product-service:3000`
- `/api/orders` vers `order-service:3002`

En production, les backends ne publient pas de ports publics. Le point d'entree public est le frontend.

## Bases MongoDB

Un seul conteneur MongoDB est utilise. Chaque service garde sa base logique :

- `auth-service` : `mongodb://mongodb:27017/auth`
- `product-service` : `mongodb://mongodb:27017/products`
- `order-service` : `mongodb://mongodb:27017/orders`

Cette separation garde l'exemple simple tout en evitant de melanger les donnees dans une base `ecommerce` generique.

L'image MongoDB Docker retenue est `mongo:4.4.18`. Elle reste suffisante pour Mongoose et evite les echecs de demarrage possibles de MongoDB 5/6 sur des machines sans extensions CPU AVX. MongoDB ne doit pas etre installe sur l'hote Debian.

## Sante et observabilite

Chaque backend expose :

```text
GET /api/health
GET /api/ready
```

`/api/health` est un check de liveness et repond `200` si le process HTTP tourne, meme quand MongoDB est encore en reconnexion. `/api/ready` est un check de readiness et repond `503` tant que MongoDB n'est pas connecte.

Les reponses contiennent :

- `status` : `OK` ou `DEGRADED`
- `service`
- `environment`
- `mongodb`
- `ready`
- `uptime`

Le frontend expose :

```text
GET /health
```

Les backends propagent aussi un header `X-Request-Id`, genere si absent, afin de suivre une requete dans les logs.

## Securite applicative

- Les secrets JWT ne sont pas versionnes.
- `JWT_SECRET` est obligatoire en `staging` et `production`. En dev Swarm, `DEV_JWT_SECRET` peut etre utilise avec un fallback non sensible.
- Les `.env` reels sont ignores.
- Les CORS sont configurables avec `CORS_ORIGIN`.
- Les backends sont internes en Swarm.

## Choix pedagogiques

Le projet reste volontairement simple :

- pas de broker de messages;
- pas de MongoDB local a installer;
- pas de service discovery externe;
- pas de reverse proxy supplementaire;
- un MongoDB Docker par stack Swarm, avec bases logiques separees par service et suffixees en dev/staging.
