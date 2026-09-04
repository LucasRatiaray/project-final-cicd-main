const express = require('express');
const path = require('path');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const distDir = path.join(__dirname, 'dist');

const targets = {
  auth: process.env.AUTH_SERVICE_URL || 'http://auth-service:3001',
  product: process.env.PRODUCT_SERVICE_URL || 'http://product-service:3000',
  order: process.env.ORDER_SERVICE_URL || 'http://order-service:3002',
};

function proxy(route, target, label) {
  app.use(route, createProxyMiddleware({
    target,
    changeOrigin: true,
    logLevel: 'warn',
    pathRewrite: (_path, req) => req.originalUrl,
    on: {
      proxyReq: (_proxyReq, req) => {
        console.log(`[proxy:${label}] ${req.method} ${req.originalUrl} -> ${target}`);
      },
      proxyRes: (proxyRes, req) => {
        console.log(`[proxy:${label}] ${req.method} ${req.originalUrl} ${proxyRes.statusCode}`);
      },
      error: (err, req, res) => {
        console.error(`[proxy:${label}] ${req.method} ${req.originalUrl}: ${err.message}`);
        if (!res.headersSent) {
          res.writeHead(502, { 'Content-Type': 'application/json' });
        }
        res.end(JSON.stringify({ message: `${label} service unavailable` }));
      },
    },
  }));
}

proxy('/api/auth', targets.auth, 'auth');
proxy('/api/products', targets.product, 'products');
proxy('/api/cart', targets.product, 'cart');
proxy('/api/orders', targets.order, 'orders');

app.get('/health', (_req, res) => {
  res.json({ status: 'OK', service: 'frontend' });
});

app.use(express.static(distDir));

app.get('*', (req, res) => {
  if (req.originalUrl.startsWith('/api/') || path.extname(req.path)) {
    return res.status(404).send('Not Found');
  }
  return res.sendFile(path.join(distDir, 'index.html'));
});

const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`Frontend server listening on port ${port}`);
  console.log(`Proxy targets: auth=${targets.auth}, products=${targets.product}, orders=${targets.order}`);
});
