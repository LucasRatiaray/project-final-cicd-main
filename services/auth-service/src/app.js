import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import crypto from 'crypto';
import { connectDB } from './config/database.js';
import authRoutes from './routes/authRoutes.js';
import { runtimeConfig } from './config/runtime.js';

const app = express();

// Ne pas connecter MongoDB si en mode test
if (!runtimeConfig.isTest) {
  connectDB();
}

app.use(cors({
  origin: runtimeConfig.corsOrigin === '*' ? true : runtimeConfig.corsOrigin.split(',').map(origin => origin.trim()),
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
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

app.use('/api/auth', authRoutes);

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

app.get('/api/health', (_req, res) => {
  res.json(getHealthPayload());
});

app.get('/api/ready', (_req, res) => {
  const payload = getHealthPayload();

  res.status(payload.ready ? 200 : 503).json({
    ...payload,
    status: payload.ready ? 'OK' : 'DEGRADED',
  });
});
app.get('/api/auth/ping', (req, res) => {
  res.json({ message: 'Auth service is reachable' });
});

if (!runtimeConfig.isTest) {
  const server = app.listen(runtimeConfig.port, () => {
    console.log(`Auth service running on port ${runtimeConfig.port} (${runtimeConfig.appEnv})`);
  });

  const shutdown = async (signal) => {
    console.log(`${signal} received, shutting down auth-service`);
    await mongoose.disconnect();
    server.close(() => process.exit(0));
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

export default app;
