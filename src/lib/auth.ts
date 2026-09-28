import "server-only";

import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB_NAME;
const secret = process.env.BETTER_AUTH_SECRET;
const baseURL = process.env.BETTER_AUTH_URL;

if (!uri || !dbName || !secret || !baseURL) {
  throw new Error("Required authentication environment variables are missing.");
}

const globalForAuth = globalThis as typeof globalThis & {
  authMongoClient?: MongoClient;
};

const client = globalForAuth.authMongoClient ?? new MongoClient(uri);

globalForAuth.authMongoClient = client;

export const auth = betterAuth({
  appName: "Alliance Sourcing BD",
  baseURL,
  secret,

  database: mongodbAdapter(client.db(dbName)),

  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
    minPasswordLength: 12,
  },

  session: {
    expiresIn: 60 * 60 * 24,
    updateAge: 60 * 60,
  },
});
