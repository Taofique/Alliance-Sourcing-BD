import { loadEnvConfig } from "@next/env";
import mongoose from "mongoose";

// Run only when explicitly invoked: npm.cmd run init:contact-cards
// react-server condition permits the same server-only model used by Next.js.
async function main() {
  loadEnvConfig(process.cwd());
  const { CONTACT_CARD_DEFAULTS } = await import(
    "../src/lib/contact-card-defaults"
  );
  const { connectDB } = await import("../src/lib/db");
  const { ContactCardModel } = await import("../src/models/contact-card");
  await connectDB();
  try {
    // Unique keys make repeated/concurrent invocations safe.
    await ContactCardModel.init();
    let inserted = 0;
    for (const card of CONTACT_CARD_DEFAULTS) {
      // Cards have no slug, so a missing entry is identified by its label and the
      // kind of thing it is: seeding only ever adds a card, and never edits one an
      // editor has already changed.
      const result = await ContactCardModel.updateOne(
        { label: card.label, type: card.type },
        { $setOnInsert: { ...card, createdAt: new Date(), updatedAt: new Date() } },
        { upsert: true, runValidators: true, timestamps: false },
      );
      inserted += result.upsertedCount;
    }
    console.log(
      "Added " +
        inserted +
        " missing contact cards. Existing records were preserved.",
    );
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
