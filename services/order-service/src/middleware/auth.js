import jwt from 'jsonwebtoken';
import { runtimeConfig } from '../config/runtime.js';

export const auth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ message: 'Token manquant' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Token malformé' });
    }

    const decoded = jwt.verify(token, runtimeConfig.jwtSecret);
    req.user = decoded;
    next();
  } catch (error) {
    if (!runtimeConfig.isTest) {
      console.error('Auth middleware error:', error);
    }
    return res.status(401).json({ message: 'Token invalide' });
  }
};
