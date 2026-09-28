import "server-only";
import sharp from "sharp";
import {
  ImageInputError,
  SUPPORTED_IMAGE_MESSAGE,
  verifyStillImage,
} from "@/lib/image-safety";
import { MAX_LOGO_BYTES } from "@/lib/logo-upload-limits";

/**
 * Logo pipeline: square-fitting 1024px PNG output, unchanged from the
 * previously verified behaviour. Banner backgrounds use their own bounded
 * profile in banner-image.ts rather than this one.
 */
export async function normalizeLogo(input: Buffer): Promise<Buffer> {
  if (!input.length) throw new ImageInputError("Choose a nonempty image.");
  if (input.length > MAX_LOGO_BYTES) {
    throw new ImageInputError("The image must be 2 MiB or smaller.", 413);
  }

  try {
    await verifyStillImage(input);
    const image = sharp(input, { limitInputPixels: 16_000_000, failOn: "warning" });

    return await image
      .timeout({ seconds: 10 })
      .autoOrient()
      .resize({ width: 1024, height: 1024, fit: "inside", withoutEnlargement: true })
      .png()
      .toBuffer();
  } catch {
    throw new ImageInputError(SUPPORTED_IMAGE_MESSAGE, 415);
  }
}
