import { loadEnvConfig } from "@next/env";
import mongoose from "mongoose";

/**
 * Copies the seeded catalogue photography off the original site's Cloudinary
 * account and into our own, then repoints the stored product records.
 *
 * Run once: npm.cmd run migrate:product-images
 *
 * This script is the only thing in the project that knows the source account
 * exists. The application itself references a single Cloudinary cloud, so once
 * this has run the old account can be forgotten.
 *
 * Every asset goes through the same normalize + upload path the admin editor
 * uses, so a migrated photograph is byte-for-byte what an admin upload would
 * have produced. Records already on our own cloud are left untouched, which
 * makes re-running safe and makes an interrupted run resumable.
 */
const REFERENCE_PRODUCT_CLOUD = "dov6k7xdk";

async function main() {
  loadEnvConfig(process.cwd());

  const { PRODUCT_IMAGE_FOLDER } = await import("../src/lib/product-defaults");
  const { connectDB } = await import("../src/lib/db");
  const { ProductModel } = await import("../src/models/products");
  const { normalizeTrustedProductImage } = await import(
    "../src/lib/product-image"
  );
  const { uploadProductImage } = await import("../src/lib/cloudinary");

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  if (!cloudName) {
    throw new Error("CLOUDINARY_CLOUD_NAME is not set.");
  }
  if (cloudName === REFERENCE_PRODUCT_CLOUD) {
    throw new Error("CLOUDINARY_CLOUD_NAME still points at the reference cloud.");
  }

  const referenceHost = `/${REFERENCE_PRODUCT_CLOUD}/image/upload/`;

  await connectDB();

  try {
    const products = await ProductModel.find({
      "image.url": { $regex: `^https://res\\.cloudinary\\.com${referenceHost}` },
    })
      .select("_id name image")
      .lean();

    if (products.length === 0) {
      console.log("No products reference the original Cloudinary account. Nothing to do.");
      return;
    }

    console.log(
      `Copying ${products.length} photograph(s) from ${REFERENCE_PRODUCT_CLOUD} into ` +
        `${cloudName}/${PRODUCT_IMAGE_FOLDER}.`,
    );

    let copied = 0;
    const failures: string[] = [];

    for (const product of products) {
      const label = `${product.name} (${product._id.toString()})`;

      try {
        // The source is already published, so it is fetched as-is and bounded
        // during normalization. Cloudinary will not upscale, so asking for a
        // wider rendition than the original is a no-op and is not worth doing.
        const response = await fetch(product.image.url, {
          signal: AbortSignal.timeout(60_000),
          headers: { accept: "image/*" },
        });
        if (!response.ok) {
          throw new Error(`source responded ${response.status}`);
        }

        const original = Buffer.from(await response.arrayBuffer());
        if (original.length === 0) {
          throw new Error("source returned an empty body");
        }

        const { buffer, format } = await normalizeTrustedProductImage(original);
        const asset = await uploadProductImage(buffer, format);

        await ProductModel.updateOne(
          { _id: product._id },
          {
            $set: {
              "image.url": asset.imageUrl,
              "image.publicId": asset.publicId,
              updatedAt: new Date(),
            },
          },
        );

        copied += 1;
        console.log(`  copied  ${label}`);
      } catch (error) {
        // Report the record, never the credentials or the raw upstream error body.
        const reason = error instanceof Error ? error.message : "unknown error";
        failures.push(`${label}: ${reason}`);
        console.error(`  FAILED  ${label}`);
      }
    }

    console.log(`Copied ${copied} of ${products.length} photograph(s).`);

    if (failures.length > 0) {
      throw new Error(
        `${failures.length} photograph(s) could not be copied; they still point at the original account.`,
      );
    }
  } finally {
    await mongoose.disconnect();
  }
}

main().catch(() => {
  // Do not print database errors, upstream bodies or connection details.
  console.error(
    "Product image migration failed. Check the source images and Cloudinary configuration, then run it again — records already copied are not recopied.",
  );
  process.exitCode = 1;
});
