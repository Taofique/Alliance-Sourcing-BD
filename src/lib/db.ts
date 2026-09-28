import "server-only";

import mongoose from "mongoose";

type MongooseCache = {
  connection: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

const globalForMongoose = globalThis as typeof globalThis & {
  mongooseCache?: MongooseCache;
};

const cache = (globalForMongoose.mongooseCache ??= {
  connection: null,
  promise: null,
});

export async function connectDB() {
  if (cache.connection) {
    return cache.connection;
  }

  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB_NAME;

  if (!uri || !dbName) {
    throw new Error("MongoDB environment variables are missing.");
  }

  if (!cache.promise) {
    cache.promise = mongoose.connect(uri, {
      dbName,
      bufferCommands: false,
      serverSelectionTimeoutMS: 10000,
    });
  }

  try {
    cache.connection = await cache.promise;
    return cache.connection;
  } catch (error) {
    cache.promise = null;
    throw error;
  }
}
