import { rejectUnauthorizedAdminWrite } from "@/lib/admin-api";
import { uploadFooterCtaImage } from "@/lib/cloudinary";
import { readBoundedImageFormData } from "@/lib/image-form-data";
import { normalizeBannerImage } from "@/lib/banner-image";
import { ImageInputError } from "@/lib/image-safety";
import {
  FOOTER_CTA_MAX_BYTES,
  FOOTER_CTA_SIZE_MESSAGE,
} from "@/lib/validations/footer";

export const runtime = "nodejs";

/**
 * Uploads the footer CTA background and hands the reference back to the editor.
 * The setting itself is saved separately, so a failed upload can never replace
 * the photograph that is already stored.
 */
export async function POST(request: Request) {
  let stage = "authentication";

  try {
    // Independent authorization and origin check, before the body is read.
    const denied = await rejectUnauthorizedAdminWrite(request, {
      requireJson: false,
    });
    if (denied) return denied;

    stage = "validation";
    const { file } = await readBoundedImageFormData(request, {
      maxBytes: FOOTER_CTA_MAX_BYTES,
      extraFields: [],
      sizeMessage: FOOTER_CTA_SIZE_MESSAGE,
    });

    const { buffer, format } = await normalizeBannerImage(
      Buffer.from(await file.arrayBuffer()),
    );

    stage = "upload";
    const image = await uploadFooterCtaImage(buffer, format);

    return Response.json({
      message: "Background uploaded. Save the section to keep it.",
      image,
    });
  } catch (error) {
    if (error instanceof ImageInputError) {
      return Response.json({ message: error.message }, { status: error.status });
    }

    // Never log raw SDK/database errors that may contain credentials.
    console.error("Footer CTA image upload failed", {
      stage,
      errorType: error instanceof Error ? error.name : "Unknown",
    });

    return Response.json(
      {
        message:
          stage === "upload"
            ? "The image could not be uploaded. Your saved background is unchanged."
            : "Unable to read that image. Your saved background is unchanged.",
      },
      { status: stage === "upload" ? 502 : 500 },
    );
  }
}
