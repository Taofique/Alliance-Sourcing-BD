import { loadEnvConfig } from "@next/env";
import { MongoClient } from "mongodb";

loadEnvConfig(process.cwd());

/**
 * Optional, idempotent initialisation for the footer and footer-CTA settings.
 *
 * It is NOT required: `services/site-settings.ts` fills every missing field
 * from `src/lib/footer-defaults.ts` on read, so an untouched document renders
 * correctly from the moment the code is deployed. Run this only if you want the
 * defaults written into the database so the admin editors open with them
 * already in place.
 *
 * It fills in what is missing and never overwrites an existing edit. It is not
 * run automatically — invoke it yourself against the database you want.
 *
 *   npx tsx scripts/init-footer-settings.ts
 */
async function main() {
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB_NAME;

  if (!uri || !dbName) {
    throw new Error("MONGODB_URI and MONGODB_DB_NAME are required.");
  }

  const { defaultSiteFooter, defaultSiteFooterCta } = await import(
    "../src/lib/footer-defaults"
  );

  const client = new MongoClient(uri);

  try {
    await client.connect();

    const collection = client.db(dbName).collection("site_settings");
    const settings = await collection.findOne({ key: "main" });

    if (!settings) {
      throw new Error(
        'No site settings document with key "main" was found. Nothing was changed.',
      );
    }

    // Dotted paths: each field is only written when it is absent or null, so an
    // existing edit is never replaced.
    const set: Record<string, unknown> = {};

    const footer = (settings.footer ?? {}) as Record<string, unknown>;
    for (const [field, value] of Object.entries(defaultSiteFooter)) {
      if (footer[field] === undefined || footer[field] === null) {
        set[`footer.${field}`] = value;
      }
    }

    const cta = (settings.footerCta ?? {}) as Record<string, unknown>;
    for (const [field, value] of Object.entries(defaultSiteFooterCta)) {
      if (cta[field] === undefined || cta[field] === null) {
        set[`footerCta.${field}`] = value;
      }
    }

    const fields = Object.keys(set);

    if (fields.length === 0) {
      console.log("Every footer field is already set. Nothing was changed.");
      return;
    }

    await collection.updateOne({ key: "main" }, { $set: set });

    console.log(`Filled ${fields.length} missing field(s): ${fields.join(", ")}`);
  } finally {
    await client.close();
  }
}

main().catch((error: unknown) => {
  console.error(
    error instanceof Error ? error.message : "Footer initialisation failed.",
  );
  process.exitCode = 1;
});
