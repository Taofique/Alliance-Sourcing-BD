import { loadEnvConfig } from "@next/env";
import mongoose from "mongoose";

// Run only when explicitly invoked: npm.cmd run init:products
// react-server condition permits the same server-only model used by Next.js.
async function main() {
  loadEnvConfig(process.cwd());

  const { initialProductCatalogue } = await import(
    "../src/lib/product-defaults"
  );
  const { connectDB } = await import("../src/lib/db");
  const {
    ProductCategoryModel,
    ProductSubcategoryModel,
    ProductModel,
  } = await import("../src/models/products");

  await connectDB();

  try {
    // Build the unique and sort indexes before writing, so a fresh install
    // cannot accept a duplicate slug.
    await ProductCategoryModel.init();
    await ProductSubcategoryModel.init();
    await ProductModel.init();

    let addedCategories = 0;
    let addedSubcategories = 0;
    let addedProducts = 0;

    for (const [sortOrder, category] of initialProductCatalogue.entries()) {
      const result = await ProductCategoryModel.updateOne(
        { slug: category.slug },
        {
          $setOnInsert: {
            name: category.name,
            slug: category.slug,
            sortOrder,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
        { upsert: true, runValidators: true, timestamps: false },
      );

      addedCategories += result.upsertedCount;

      // Only seed the rows for a category this run actually created. An existing
      // category is one an admin has already curated, so re-running the seeder
      // must not resurrect deleted, hidden or renamed subcategories and products.
      if (result.upsertedCount !== 1) continue;

      const createdCategory = await ProductCategoryModel.findOne({
        slug: category.slug,
      })
        .select("_id")
        .lean();

      if (!createdCategory) continue;

      for (const [subOrder, subcategory] of category.subcategories.entries()) {
        const subResult = await ProductSubcategoryModel.updateOne(
          { categoryId: createdCategory._id, slug: subcategory.slug },
          {
            $setOnInsert: {
              categoryId: createdCategory._id,
              name: subcategory.name,
              slug: subcategory.slug,
              sortOrder: subOrder,
              isActive: true,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          },
          { upsert: true, runValidators: true, timestamps: false },
        );

        addedSubcategories += subResult.upsertedCount;
        if (subResult.upsertedCount !== 1) continue;

        const createdSubcategory = await ProductSubcategoryModel.findOne({
          categoryId: createdCategory._id,
          slug: subcategory.slug,
        })
          .select("_id")
          .lean();

        if (!createdSubcategory) continue;

        const now = new Date();
        const products = subcategory.products.map((product, index) => ({
          subcategoryId: createdSubcategory._id,
          name: product.name,
          image: { url: product.imageUrl, publicId: product.publicId },
          sortOrder: index,
          isActive: true,
          createdAt: now,
          updatedAt: now,
        }));

        if (products.length > 0) {
          // insertMany, not a bulk upsert: the catalogue deliberately contains
          // repeated names such as five separate "Five Pocket Twill" garments,
          // so a name-keyed upsert would collapse them into one.
          await ProductModel.insertMany(products);
          addedProducts += products.length;
        }
      }
    }

    // Report the published catalogue, counted from what is stored.
    const categories = await ProductCategoryModel.find({})
      .sort({ sortOrder: 1, createdAt: 1, _id: 1 })
      .select("_id name")
      .lean();

    for (const category of categories) {
      const subcategories = await ProductSubcategoryModel.find({
        categoryId: category._id,
      })
        .sort({ sortOrder: 1, createdAt: 1, _id: 1 })
        .select("_id name")
        .lean();

      const productTotal = await ProductModel.countDocuments({
        subcategoryId: { $in: subcategories.map((entry) => entry._id) },
      });

      console.log("  " + category.name + ":");
      for (const subcategory of subcategories) {
        const count = await ProductModel.countDocuments({
          subcategoryId: subcategory._id,
        });
        console.log("    " + subcategory.name + ": " + count + " products");
      }
      console.log(
        "    " +
          subcategories.length +
          " subcategories, " +
          productTotal +
          " products in total",
      );
    }

    console.log(
      "Added " +
        addedCategories +
        " categories, " +
        addedSubcategories +
        " subcategories and " +
        addedProducts +
        " products. Existing records were preserved.",
    );
  } finally {
    await mongoose.disconnect();
  }
}

main().catch(() => {
  // Do not print database errors or connection details.
  console.error(
    "Product catalogue initialization failed. Check database configuration, then run it again.",
  );
  process.exitCode = 1;
});
