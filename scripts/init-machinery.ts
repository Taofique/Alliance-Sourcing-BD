import { loadEnvConfig } from "@next/env";
import mongoose, { Types } from "mongoose";

// Run only when explicitly invoked: npm.cmd run init:machinery
// react-server condition permits the same server-only model used by Next.js.
async function main() {
  loadEnvConfig(process.cwd());

  const { initialMachineryCategories } = await import(
    "../src/lib/machinery-defaults"
  );
  const { connectDB } = await import("../src/lib/db");
  const {
    MachineryCategoryModel,
    MachineryItemModel,
    MachinerySettingsModel,
  } = await import("../src/models/machinery");

  await connectDB();

  try {
    // Build the unique and sort indexes before writing, so a fresh install
    // cannot accept a duplicate slug.
    await MachineryCategoryModel.init();
    await MachineryItemModel.init();
    await MachinerySettingsModel.init();

    let addedCategories = 0;
    let addedItems = 0;

    for (const [sortOrder, category] of initialMachineryCategories.entries()) {
      const result = await MachineryCategoryModel.updateOne(
        { slug: category.slug },
        {
          $setOnInsert: {
            name: category.name,
            slug: category.slug,
            sortOrder,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
        { upsert: true, runValidators: true, timestamps: false },
      );

      addedCategories += result.upsertedCount;

      // Only seed the rows for a category this run actually created. An
      // existing category is one an admin has already curated, so re-running
      // the seeder must not resurrect deleted or re-quantified machines.
      if (result.upsertedCount !== 1) continue;

      const created = await MachineryCategoryModel.findOne({ slug: category.slug })
        .select("_id")
        .lean();

      if (!created) continue;

      const now = new Date();
      const items = category.items.map((item, index) => ({
        categoryId: created._id,
        slNo: index + 1,
        machineName: item.machineName,
        brand: item.brand,
        quantity: item.quantity,
        sortOrder: index,
        createdAt: now,
        updatedAt: now,
      }));

      if (items.length > 0) {
        await MachineryItemModel.insertMany(items);
        addedItems += items.length;
      }
    }

    // Report the published figures, summed from the stored quantities.
    const totals = await MachineryItemModel.aggregate<{
      _id: Types.ObjectId;
      total: number;
      count: number;
    }>([
      {
        $group: {
          _id: "$categoryId",
          total: { $sum: "$quantity" },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const names = await MachineryCategoryModel.find({})
      .sort({ sortOrder: 1, createdAt: 1, _id: 1 })
      .select("_id name")
      .lean();
    const nameById = new Map(
      names.map((category) => [category._id.toString(), category.name]),
    );

    let grandTotal = 0;
    console.log("Machinery inventory:");
    for (const entry of totals) {
      grandTotal += entry.total;
      console.log(
        "  " +
          (nameById.get(entry._id.toString()) ?? "Unknown category") +
          ": " +
          entry.count +
          " machines, " +
          entry.total +
          " units",
      );
    }
    console.log("  Grand total: " + grandTotal);

    console.log(
      "Added " +
        addedCategories +
        " categories and " +
        addedItems +
        " items. Existing records were preserved.",
    );
  } finally {
    await mongoose.disconnect();
  }
}

main().catch(() => {
  // Do not print database errors or connection details.
  console.error(
    "Machinery initialization failed. Check database configuration, then run it again.",
  );
  process.exitCode = 1;
});
