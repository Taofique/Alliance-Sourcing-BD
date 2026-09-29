import { loadEnvConfig } from "@next/env";
import mongoose from "mongoose";

// Run only when explicitly invoked: npm.cmd run init:faqs
// react-server condition permits the same server-only model used by Next.js.
async function main() {
  loadEnvConfig(process.cwd());
  const { initialFaqs } = await import("../src/lib/faq-defaults");
  const { connectDB } = await import("../src/lib/db");
  const { FaqModel } = await import("../src/models/faq");
  await connectDB();
  try {
    // Unique keys make repeated/concurrent invocations safe.
    await FaqModel.init();
    let inserted = 0;
    for (const faq of initialFaqs) {
      // Questions have no slug, so a missing entry is identified by its text:
      // seeding only ever adds questions, and never edits one already published.
      const result = await FaqModel.updateOne(
        { question: faq.question },
        { $setOnInsert: { ...faq, createdAt: new Date(), updatedAt: new Date() } },
        { upsert: true, runValidators: true, timestamps: false },
      );
      inserted += result.upsertedCount;
    }
    console.log(
      "Added " + inserted + " missing FAQ entries. Existing records were preserved.",
    );
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
