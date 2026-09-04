import mongoose from 'mongoose';
import { runtimeConfig } from './runtime.js';

export const connectDB = async () => {
  try {
    // Ne pas se connecter si déjà connecté ou en mode test
    if (mongoose.connection.readyState !== 0 || runtimeConfig.isTest) {
      console.log('MongoDB already connected');
      return;
    }

    const conn = await mongoose.connect(runtimeConfig.mongodbUri);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    if (!runtimeConfig.isTest) {
      setTimeout(connectDB, 5000);
    }
  }
};
