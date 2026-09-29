import "server-only";
import sharp from "sharp";
import {
  ImageInputError,
  SUPPORTED_IMAGE_MESSAGE,
  verifyStillImage,
} from "@/lib/image-safety";
import {
  MAX_PRODUCT_BYTES,
  PRODUCT_SIZE_MESSAGE,
  PRODUCT_MAX_WIDTH,
} from "@/lib/product-upload-limits";

export { PRODUCT_SIZE_MESSAGE };

/**
 * Product photograph profile.
 *
 * The catalogue grid draws a 4:5 portrait card, so the longest edge is bounded
 * to 1400px: wide enough to stay sharp on a 5-across desktop grid, small enough
 * that 24 cards do not outweigh the rest of the page.
 *
 * Reusing the banner pipeline's decisions keeps this consistent with every other
 * upload in the project: content sniffing before decode, EXIF auto-orientation,
 * scale-down only so the admin's framing survives, and WebP unless the source
 * carries alpha, which is preserved by encoding those as PNG.
 */
export async function normalizeProductImage(
  input: Buffer,
): Promise<{ buffer: Buffer; format: "webp" | "png" }> {
  if (!input.length) throw new ImageInputError("Choose a nonempty image.");
  if (input.length > MAX_PRODUCT_BYTES) {
    throw new ImageInputError(PRODUCT_SIZE_MESSAGE, 413);
  }

  return encodeProductImage(input);
}

/**
 * The same normalization without the admin's 2 MiB input cap.
 *
 * That cap exists to keep a single stray upload from filling memory, so it
 * belongs to the untrusted admin path only. Copying an already-published
 * catalogue photograph is a trusted, one-off operation, and the original file
 * can legitimately be larger than any browser would be allowed to send. The
 * decode, the pixel budget and the output profile are identical either way, so
 * a migrated photograph is the same asset an admin upload would have produced.
 */
export async function normalizeTrustedProductImage(
  input: Buffer,
  { maxBytes = 20 * 1024 * 1024 }: { maxBytes?: number } = {},
): Promise<{ buffer: Buffer; format: "webp" | "png" }> {
  if (!input.length) throw new ImageInputError("Choose a nonempty image.");
  // Bounded so a hostile or broken origin cannot stream an unbounded body into
  // memory, without imposing the browser's much smaller upload ceiling.
  if (input.length > maxBytes) {
    throw new ImageInputError("The source image is too large to copy.", 413);
  }

  return encodeProductImage(input);
}

/**
 * The shared decode and encode step, so the admin path and the one-off
 * migration cannot drift apart.
 */
async function encodeProductImage(
  input: Buffer,
): Promise<{ buffer: Buffer; format: "webp" | "png" }> {
  let needsAlpha = false;

  try {
    const { metadata } = await verifyStillImage(input);
    needsAlpha = metadata.format === "svg" || metadata.hasAlpha === true;

    const image = sharp(input, { limitInputPixels: 16_000_000, failOn: "warning" })
      .timeout({ seconds: 10 })
      .autoOrient()
      .resize({
        width: PRODUCT_MAX_WIDTH,
        fit: "inside",
        withoutEnlargement: true,
      });

    if (needsAlpha) {
      return { buffer: await image.png().toBuffer(), format: "png" };
    }

    return {
      buffer: await image.webp({ quality: 84, effort: 5 }).toBuffer(),
      format: "webp",
    };
  } catch (error) {
    if (error instanceof ImageInputError) throw error;
    throw new ImageInputError(SUPPORTED_IMAGE_MESSAGE, 415);
  }
}
