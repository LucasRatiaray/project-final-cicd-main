# CI/CD GitLab

## Objectif

La pipeline GitLab doit rester lisible pour un projet etudiant :

1. installer les dependances avec `npm ci`;
2. lancer les tests;
3. construire les images Docker;
4. pousser les images dans le GitLab Container Registry;
5. scanner avec Trivy sans bloquer le projet sur des faux positifs non critiques;
6. deployer manuellement en dev, staging ou production.

## Tags images

Toutes les images sont poussees avec :

```text
$CI_REGISTRY_IMAGE/<service>:$CI_COMMIT_SHA
```

Sur `main`, la pipeline pousse aussi :

```text
$CI_REGISTRY_IMAGE/<service>:latest
```

Services :

- `frontend`
- `auth-service`
- `product-service`
- `order-service`

## Variables GitLab

Variables fournies par GitLab :

- `CI_REGISTRY`
- `CI_REGISTRY_IMAGE`
- `CI_REGISTRY_USER`
- `CI_REGISTRY_PASSWORD`
- `CI_COMMIT_SHA`

Variables a creer :

- `JWT_SECRET` : secret production, et fallback possible pour staging.
- `DEPLOY_HOST` : optionnel, hostname/IP public du Swarm manager. Si absent, le job utilise l'adresse du node Docker courant.
- `CORS_ORIGIN` : origine publique production, par exemple `https://shop.example.com`.
- `DEV_FRONTEND_PORT` : optionnel, defaut `8082`.
- `DEV_CORS_ORIGIN` : optionnel, origine publique dev.
- `DEV_JWT_SECRET` : optionnel, secret JWT dev.
- `STAGING_JWT_SECRET` : optionnel, secret JWT staging. Fallback sur `JWT_SECRET`.
- `STAGING_FRONTEND_PORT` : optionnel, defaut `8081`.
- `STAGING_CORS_ORIGIN` : optionnel, defaut calcule depuis `DEPLOY_HOST` et `STAGING_FRONTEND_PORT`.

## Branches

- Toutes les branches et merge requests lancent les tests.
- `dev`, `staging` et `main` construisent et poussent les images Docker.
- `dev` propose un deploy dev manuel.
- `staging` propose un deploy staging/preprod manuel.
- `main` propose un deploy production manuel et pousse le tag `latest`.

Le push ne deploie donc pas automatiquement. Il produit les images et prepare le job manuel correspondant :

- push sur `feature/*`, `bugfix/*`, `hotfix/*` -> tests uniquement ;
- push sur `dev` -> tests, build/push images, scan Trivy, job manuel `deploy_dev` ;
- push sur `staging` -> tests, build/push images, scan Trivy, job manuel `deploy_staging` ;
- push sur `main` -> build/push images, tag `latest`, job manuel `deploy_production`.

Avant de pousser, verifier que les fichiers non suivis ont bien ete ajoutes au commit, notamment les `package-lock.json`, les `.dockerignore`, `.env.example`, `docker-compose.dev.yml`, `docker-compose.staging.yml`, `docs/` et les fichiers `src/config/runtime.js`.

Les jobs de deploiement passent par un template commun `.swarm_deploy`. Ils ne se contentent pas d'executer `docker stack deploy` : ils verifient d'abord que les images existent dans le registry, attendent que les replicas Swarm atteignent l'etat attendu, puis verifient le frontend et `/api/products` via l'URL publique. Si MongoDB ou un backend reste a `0/1` ou `1/2`, le job echoue avec les `docker service ps --no-trunc` et logs utiles.

## Runner

Tous les jobs utilisent le runner avec acces au Docker Swarm manager et le tag :

```text
swarm-manager
```

Il ne faut pas ajouter de cle SSH dans la pipeline si le runner est deja execute sur le manager Swarm.

## Environnements GitLab

| Job | Branche | Environment GitLab | Compose | Stack | Port |
| --- | --- | --- | --- | --- | ---: |
| `deploy_dev` | `dev` | `development` | `docker-compose.dev.yml` | `e-commerce-dev` | `8082` |
| `deploy_staging` | `staging` | `staging` | `docker-compose.staging.yml` | `e-commerce-staging` | `8081` |
| `deploy_production` | `main` | `production` | `docker-compose.prod.yml` | `e-commerce` | `8080` |

## Trivy

Le scan Trivy est `allow_failure: true`.

Raison : pour un projet etudiant, les rapports sont utiles pour apprendre et prioriser, mais ne doivent pas bloquer automatiquement le rendu a cause de dependances transitoires.
