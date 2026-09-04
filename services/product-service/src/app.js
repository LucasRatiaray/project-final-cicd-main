import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import crypto from 'crypto';
import { connectDB } from './config/database.js';
import productRoutes from './routes/productRoutes.js';
import cartRoutes from './routes/cartRoutes.js';
import { runtimeConfig } from './config/runtime.js';

const app = express();

if (!runtimeConfig.isTest) {
  console.log(`App starting with APP_ENV=${runtimeConfig.appEnv}`);
}

// Connexion à la base de données
if (!runtimeConfig.isTest) {
  connectDB();
}

// Middleware
app.use(cors({
  origin: runtimeConfig.corsOrigin === '*' ? true : runtimeConfig.corsOrigin.split(',').map(origin => origin.trim()),
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'userId', 'X-Request-Id'],
}));
app.use(express.json());

app.use((req, res, next) => {
  const requestId = req.get('X-Request-Id') || crypto.randomUUID();
  res.setHeader('X-Request-Id', requestId);
  if (!runtimeConfig.isTest) {
    console.log(`[${runtimeConfig.serviceName}] ${requestId} ${req.method} ${req.originalUrl}`);
  }
  next();
});

// Routes
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);

const getHealthPayload = () => {
  const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  const mongodb = states[mongoose.connection.readyState] || 'unknown';
  const ready = runtimeConfig.isTest || mongoose.connection.readyState === 1;

  return {
    status: 'OK',
    service: runtimeConfig.serviceName,
    environment: runtimeConfig.appEnv,
    mongodb,
    ready,
    uptime: Math.round(process.uptime()),
  };
};

// Liveness check: the process can serve HTTP even if MongoDB is still retrying.
app.get('/api/health', (_req, res) => {
  res.json(getHealthPayload());
});

// Readiness check: dependencies required by the API are available.
app.get('/api/ready', (_req, res) => {
  const payload = getHealthPayload();

  res.status(payload.ready ? 200 : 503).json({
    ...payload,
    status: payload.ready ? 'OK' : 'DEGRADED',
  });
});

if (!runtimeConfig.isTest) {
  const server = app.listen(runtimeConfig.port, () => {
    console.log(`Product service running on port ${runtimeConfig.port} (${runtimeConfig.appEnv})`);
  });

  const shutdown = async (signal) => {
    console.log(`${signal} received, shutting down product-service`);
    await mongoose.disconnect();
    server.close(() => process.exit(0));
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

export default app;
