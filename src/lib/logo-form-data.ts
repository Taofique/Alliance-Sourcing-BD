import "server-only";
import { MAX_LOGO_BYTES } from "@/lib/logo-upload-limits";
import { ImageInputError } from "@/lib/image-safety";
import {
  MAX_IMAGE_REQUEST_OVERHEAD,
  readBoundedImageFormData,
} from "@/lib/image-form-data";

export const MAX_LOGO_REQUEST_BYTES =
  MAX_LOGO_BYTES + MAX_IMAGE_REQUEST_OVERHEAD;

export async function readLogoFormData(request: Request) {
  const { file, fields } = await readBoundedImageFormData(request, {
    maxBytes: MAX_LOGO_BYTES,
    extraFields: ["logoKey"],
    sizeMessage: "The image must be 2 MiB or smaller.",
  });

  const logoKey = fields.logoKey;

  if (!logoKey.trim() || logoKey.length > 100) {
    throw new ImageInputError("Choose an image and a valid logo key.");
  }

  return { file, logoKey };
}
