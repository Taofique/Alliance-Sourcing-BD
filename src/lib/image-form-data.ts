import "server-only";
import { ImageInputError } from "@/lib/image-safety";

// Multipart overhead is limited as well as the file itself.
export const MAX_IMAGE_REQUEST_OVERHEAD = 64 * 1024;

type BoundedImageFormDataOptions = {
  maxBytes: number;
  /** Every field must be present exactly once; a single "file" is required. */
  extraFields: string[];
  sizeMessage: string;
};

/**
 * Reads a multipart upload with a hard ceiling on the streamed body, so an
 * oversized or dishonest request is rejected before anything is decoded.
 */
export async function readBoundedImageFormData(
  request: Request,
  { maxBytes, extraFields, sizeMessage }: BoundedImageFormDataOptions,
) {
  const maxRequestBytes = maxBytes + MAX_IMAGE_REQUEST_OVERHEAD;
  const contentType = request.headers.get("content-type") ?? "";

  if (!/^multipart\/form-data\s*;/i.test(contentType)) {
    throw new ImageInputError("Send multipart form data.", 415);
  }

  const length = request.headers.get("content-length");
  if (
    length !== null &&
    (!/^\d+$/.test(length) || Number(length) > maxRequestBytes)
  ) {
    throw new ImageInputError(
      "Upload request is too large or has an invalid length.",
      413,
    );
  }

  if (!request.body) throw new ImageInputError("Upload body is missing.");

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxRequestBytes) {
        await reader.cancel();
        throw new ImageInputError("Upload request is too large.", 413);
      }
      chunks.push(value);
    }

    const form = await new Response(Buffer.concat(chunks), {
      headers: { "Content-Type": contentType },
    }).formData();

    const expected = ["file", ...extraFields];
    if (
      [...form.keys()].length !== expected.length ||
      form.getAll("file").length !== 1 ||
      extraFields.some((field) => form.getAll(field).length !== 1)
    ) {
      throw new ImageInputError(
        `Send exactly one file and ${extraFields.join(" and ")}.`,
      );
    }

    const file = form.get("file");
    if (!(file instanceof File) || !file.size) {
      throw new ImageInputError("Choose an image and try again.");
    }
    if (file.size > maxBytes) throw new ImageInputError(sizeMessage, 413);

    const fields: Record<string, string> = {};
    for (const field of extraFields) {
      const value = form.get(field);
      if (typeof value !== "string") {
        throw new ImageInputError("Choose an image and try again.");
      }
      fields[field] = value;
    }

    return { file, fields };
  } catch (error) {
    if (error instanceof ImageInputError) throw error;
    throw new ImageInputError("Invalid multipart upload.");
  } finally {
    reader.releaseLock();
  }
}
