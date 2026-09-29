import { loadEnvConfig } from "@next/env";
import mongoose from "mongoose";

/**
 * Read-only proof that the product catalogue is fully self-hosted on our own
 * Cloudinary account: every stored URL must live in our cloud and in the product
 * folder, its own path must agree with the stored public id, and the delivered
 * bytes must decode as a real image.
 */
async function main() {
  loadEnvConfig(process.cwd());

  const { PRODUCT_IMAGE_FOLDER, initialProductCatalogue } = await import(
    "../src/lib/product-defaults"
  );
  const { connectDB } = await import("../src/lib/db");
  const { ProductModel } = await import("../src/models/products");
  const sharp = (await import("sharp")).default;

  const cloud = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  if (!cloud) throw new Error("CLOUDINARY_CLOUD_NAME is not set.");

  const deliveryBase = `https://res.cloudinary.com/${cloud}/image/upload/`;
  const folderPrefix = `${PRODUCT_IMAGE_FOLDER}/`;

  /**
   * A Cloudinary delivery URL is /<cloud>/image/upload/[v<n>/]<public id>, so the
   * version segment has to be stripped before the asset's own path can be read.
   * This mirrors what the product image schema does when it validates a record.
   */
  function publicPathOf(url: string) {
    if (!url.startsWith(deliveryBase)) return null;
    return url.slice(deliveryBase.length).replace(/^v\d+\//, "").split("?")[0];
  }

  await connectDB();
  try {
    const products = await ProductModel.find({})
      .sort({ name: 1, sortOrder: 1 })
      .select("name image")
      .lean();

    const problems: string[] = [];
    let delivered = 0;
    const formats = new Map<string, number>();

    // The seed file is what a fresh install writes, so it has to name our own
    // account too — the unit tests can only prove the 24 URLs agree with each
    // other, because they deliberately never load the real environment.
    const seedProducts = initialProductCatalogue.flatMap((category) =>
      category.subcategories.flatMap((subcategory) => subcategory.products),
    );
    const seedProblems = seedProducts
      .filter((product) => {
        const path = publicPathOf(product.imageUrl);
        return (
          !path ||
          !path.startsWith(`${PRODUCT_IMAGE_FOLDER}/`) ||
          path.split(".")[0] !== product.publicId
        );
      })
      .map((product) => `${product.name}: seed URL is not on our account`);

    problems.push(...seedProblems);

    for (const product of products) {
      const { url, publicId } = product.image as { url: string; publicId: string };
      const path = publicPathOf(url);

      if (!path) {
        problems.push(`${product.name}: not a URL on our cloud (${cloud})`);
        continue;
      }
      if (!path.startsWith(folderPrefix)) {
        problems.push(`${product.name}: outside ${folderPrefix} (${path})`);
        continue;
      }
      if (path.split(".")[0] !== publicId) {
        problems.push(`${product.name}: URL and stored public id disagree`);
        continue;
      }

      const response = await fetch(url, { signal: AbortSignal.timeout(30_000) });
      if (!response.ok) {
        problems.push(`${product.name}: URL responded ${response.status}`);
        continue;
      }

      const bytes = Buffer.from(await response.arrayBuffer());
      const metadata = await sharp(bytes, { failOn: "warning" }).metadata();
      if (!metadata.width || !metadata.height) {
        problems.push(`${product.name}: delivered bytes are not a decodable image`);
        continue;
      }

      delivered += 1;
      formats.set(metadata.format ?? "?", (formats.get(metadata.format ?? "?") ?? 0) + 1);
    }

    console.log(`Products in the database:            ${products.length}`);
    console.log(`Served from ${cloud}/${PRODUCT_IMAGE_FOLDER}: ${delivered}`);
    console.log(
      `Seed file entries on our account:     ${seedProducts.length - seedProblems.length}/${seedProducts.length}`,
    );

    const breakdown = [...formats.entries()]
      .map(([format, count]) => `${count} ${format}`)
      .join(", ");
    if (breakdown) console.log(`Delivered formats:                  ${breakdown}`);

    if (problems.length > 0) {
      console.log("\nProblems:");
      for (const line of problems) console.log(`  ${line}`);
      process.exitCode = 1;
    } else {
      console.log(
        `\nEvery photograph is on our own Cloudinary account: ${delivered} stored records and ${seedProducts.length} seed entries verified.`,
      );
    }
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((error) => {
  console.error("Verification failed:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
