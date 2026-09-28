import { loadEnvConfig } from "@next/env";
import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { MongoClient } from "mongodb";

loadEnvConfig(process.cwd());

async function main() {
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB_NAME;
  const secret = process.env.BETTER_AUTH_SECRET;
  const baseURL = process.env.BETTER_AUTH_URL;
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_INITIAL_PASSWORD;

  if (!uri || !dbName || !secret || !baseURL || !email || !password) {
    throw new Error("Required admin setup environment variables are missing.");
  }

  if (password.length < 12) {
    throw new Error("Use an admin password of at least 12 characters.");
  }

  const client = new MongoClient(uri);

  try {
    await client.connect();

    const db = client.db(dbName);

    const existing = await db.collection("user").findOne({ email });

    if (existing) {
      console.log("This account already exists. No changes were made.");
      return;
    }

    const setupAuth = betterAuth({
      appName: "Alliance Sourcing BD",
      secret,
      baseURL,
      database: mongodbAdapter(db),
      emailAndPassword: {
        enabled: true,
        disableSignUp: false,
        autoSignIn: false,
        minPasswordLength: 12,
      },
    });

    await setupAuth.api.signUpEmail({
      body: {
        name: "Alliance Administrator",
        email,
        password,
      },
    });

    console.log("Admin account created successfully.");
  } finally {
    await client.close();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Admin setup failed.");
  process.exitCode = 1;
});
