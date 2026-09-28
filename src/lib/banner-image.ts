import "server-only";
import sharp from "sharp";
import {
  ImageInputError,
  SUPPORTED_IMAGE_MESSAGE,
  verifyStillImage,
} from "@/lib/image-safety";
import { BANNER_MAX_WIDTH, BANNER_SIZE_MESSAGE, MAX_BANNER_BYTES } from "@/lib/banner-upload-limits";

export { BANNER_SIZE_MESSAGE };

/**
 * Banner background profile. Photographs are delivered as high quality WebP so
 * a 2560px-wide banner stays small, but transparency is preserved for the
 * rasterised SVG and PNG cases by encoding those as PNG instead.
 *
 * The image is only ever scaled down (withoutEnlargement) and is never cropped,
 * so the admin's chosen framing survives to the carousel.
 */
export async function normalizeBannerImage(
  input: Buffer,
): Promise<{ buffer: Buffer; format: "webp" | "png" }> {
  if (!input.length) throw new ImageInputError("Choose a nonempty image.");
  if (input.length > MAX_BANNER_BYTES) {
    throw new ImageInputError(BANNER_SIZE_MESSAGE, 413);
  }

  let needsAlpha = false;

  try {
    const { metadata } = await verifyStillImage(input);
    needsAlpha = metadata.format === "svg" || metadata.hasAlpha === true;

    const image = sharp(input, { limitInputPixels: 16_000_000, failOn: "warning" })
      .timeout({ seconds: 10 })
      .autoOrient()
      .resize({
        width: BANNER_MAX_WIDTH,
        fit: "inside",
        withoutEnlargement: true,
      });

    if (needsAlpha) {
      return { buffer: await image.png().toBuffer(), format: "png" };
    }

    return {
      buffer: await image.webp({ quality: 82, effort: 5 }).toBuffer(),
      format: "webp",
    };
  } catch (error) {
    if (error instanceof ImageInputError) throw error;
    throw new ImageInputError(SUPPORTED_IMAGE_MESSAGE, 415);
  }
}
