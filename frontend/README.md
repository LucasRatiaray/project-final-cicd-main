# Frontend

Frontend Vue/Vite de l'application e-commerce.

- Dev : `npm run dev`
- Build : `npm run build`
- Runtime Docker prod : `node server.cjs`

En production, `server.cjs` sert `dist/` et proxy les appels `/api/*` vers les services internes Docker avec `AUTH_SERVICE_URL`, `PRODUCT_SERVICE_URL` et `ORDER_SERVICE_URL`.
