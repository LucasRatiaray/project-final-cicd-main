import dotenv from 'dotenv';

dotenv.config();

const allowedEnvironments = ['development', 'staging', 'production', 'test'];
const appEnv = process.env.APP_ENV || process.env.NODE_ENV || 'development';

if (!allowedEnvironments.includes(appEnv)) {
  throw new Error(`APP_ENV invalide: ${appEnv}. Valeurs attendues: ${allowedEnvironments.join(', ')}`);
}

const isManagedEnvironment = ['staging', 'production'].includes(appEnv);
const jwtSecret = process.env.JWT_SECRET || (isManagedEnvironment ? undefined : 'dev_jwt_secret_change_me');

if (!jwtSecret) {
  throw new Error('JWT_SECRET est obligatoire en staging et en production.');
}

export const runtimeConfig = {
  serviceName: 'order-service',
  appEnv,
  nodeEnv: process.env.NODE_ENV || appEnv,
  isTest: appEnv === 'test' || process.env.NODE_ENV === 'test',
  port: Number(process.env.PORT || 3002),
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:8080',
  mongodbUri: process.env.MONGODB_URI || 'mongodb://mongodb:27017/orders',
  productServiceUrl: process.env.PRODUCT_SERVICE_URL || 'http://product-service:3000',
  jwtSecret,
};
