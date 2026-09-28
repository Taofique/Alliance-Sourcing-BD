import { loadEnvConfig } from "@next/env";
import { access } from "node:fs/promises";
import path from "node:path";
import mongoose from "mongoose";

// Run only when explicitly invoked: npm.cmd run init:sourcing
// react-server condition permits the same server-only model used by Next.js.
async function main() {
  loadEnvConfig(process.cwd());
  const { initialSourcingCategories, defaultSourcingSettings } = await import("../src/lib/sourcing-defaults");
  // Verify every required asset before making any database writes.
  for (const category of initialSourcingCategories) {
    try { await access(path.join(process.cwd(), "public", category.imageUrl)); }
    catch { throw new Error("Missing initial photograph: public" + category.imageUrl); }
  }
  const { connectDB } = await import("../src/lib/db");
  const { SourcingCategoryModel, SourcingSettingsModel } = await import("../src/models/sourcing");
  await connectDB();
  try {
    // Unique keys make repeated/concurrent invocations safe.
    await SourcingCategoryModel.init();
    await SourcingSettingsModel.init();
    let inserted = 0;
    for (const [sortOrder, category] of initialSourcingCategories.entries()) {
      const result = await SourcingCategoryModel.updateOne({ slug: category.slug }, {
        $setOnInsert: { ...category, publicId: null, sortOrder, isPublished: true, createdAt: new Date(), updatedAt: new Date() },
      }, { upsert: true, runValidators: true, timestamps: false });
      inserted += result.upsertedCount;
    }
    await SourcingSettingsModel.updateOne({ key: "main" }, {
      $setOnInsert: defaultSourcingSettings,
    }, { upsert: true, runValidators: true, timestamps: false });
    console.log("Added " + inserted + " missing sourcing categories. Existing records and settings were preserved.");
  } finally { await mongoose.disconnect(); }
}
main().catch((error: unknown) => {
  if (error instanceof Error && error.message.startsWith("Missing initial photograph:")) {
    console.error(error.message);
    process.exitCode = 1;
    return;
  }
  // Do not print database errors or connection details.
  console.error("Sourcing initialization failed. Check database configuration and public/sourcing/{knitwear,woven,denim,sweaters}.jpg.");
  process.exitCode = 1;
});

