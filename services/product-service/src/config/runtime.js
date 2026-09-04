import dotenv from 'dotenv';

dotenv.config();

const allowedEnvironments = ['development', 'staging', 'production', 'test'];
const appEnv = process.env.APP_ENV || process.env.NODE_ENV || 'development';

if (!allowedEnvironments.includes(appEnv)) {
  throw new Error(`APP_ENV invalide: ${appEnv}. Valeurs attendues: ${allowedEnvironments.join(', ')}`);
}

export const runtimeConfig = {
  serviceName: 'product-service',
  appEnv,
  nodeEnv: process.env.NODE_ENV || appEnv,
  isTest: appEnv === 'test' || process.env.NODE_ENV === 'test',
  port: Number(process.env.PORT || 3000),
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:8080',
  mongodbUri: process.env.MONGODB_URI || 'mongodb://mongodb:27017/products',
};
