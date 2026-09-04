import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import crypto from 'crypto';
import { connectDB } from './config/database.js';
import orderRoutes from './routes/orderRoutes.js';
import { runtimeConfig } from './config/runtime.js';

const app = express();

// Connexion à la base de données seulement si pas en mode test
if (!runtimeConfig.isTest) {
  connectDB();
}

// Middleware
app.use(cors({
  origin: runtimeConfig.corsOrigin === '*' ? true : runtimeConfig.corsOrigin.split(',').map(origin => origin.trim()),
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
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
app.use('/api/orders', orderRoutes);

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

// Liveness check: keep Swarm from killing the service while MongoDB starts.
app.get('/api/health', (_req, res) => {
  res.json(getHealthPayload());
});

// Readiness check: returns 503 until MongoDB is connected.
app.get('/api/ready', (_req, res) => {
  const payload = getHealthPayload();

  res.status(payload.ready ? 200 : 503).json({
    ...payload,
    status: payload.ready ? 'OK' : 'DEGRADED',
  });
});

if (!runtimeConfig.isTest) {
  const server = app.listen(runtimeConfig.port, () => {
    console.log(`Order service running on port ${runtimeConfig.port} (${runtimeConfig.appEnv})`);
  });

  const shutdown = async (signal) => {
    console.log(`${signal} received, shutting down order-service`);
    await mongoose.disconnect();
    server.close(() => process.exit(0));
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

export default app;
