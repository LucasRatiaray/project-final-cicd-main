import jwt from 'jsonwebtoken';
import { runtimeConfig } from '../config/runtime.js';

export const auth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      if (!runtimeConfig.isTest) {
        console.log('En-tête Authorization manquant');
      }
      return res.status(401).json({ message: 'Token manquant' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      if (!runtimeConfig.isTest) {
        console.log('Token malformé');
      }
      return res.status(401).json({ message: 'Token malformé' });
    }

    const decoded = jwt.verify(token, runtimeConfig.jwtSecret);
    req.user = decoded;
    next();
  } catch (error) {
    if (!runtimeConfig.isTest) {
      console.error('Erreur dans le middleware auth :', error);
    }
    return res.status(401).json({ message: 'Token invalide' });
  }
};
