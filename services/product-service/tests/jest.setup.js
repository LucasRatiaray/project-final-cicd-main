process.env.NODE_ENV = 'test';

import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

let mongod;
const useExternalMongo = process.env.USE_EXTERNAL_MONGODB === 'true';

beforeAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }

  if (useExternalMongo) {
    await mongoose.connect(process.env.MONGODB_URI);
    return;
  }

  mongod = await MongoMemoryServer.create({
    binary: {
      version: '7.0.4',
      skipMD5: true,
    },
  });

  const uri = mongod.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  if (mongod) {
    await mongod.stop();
  }
});

beforeEach(async () => {
  if (mongoose.connection.readyState === 0) return;
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany();
  }
});
