import { rejectUnauthorizedAdminWrite } from "@/lib/admin-api";
import { uploadPageBannerImage } from "@/lib/cloudinary";
import { readBoundedImageFormData } from "@/lib/image-form-data";
import { normalizeBannerImage } from "@/lib/banner-image";
import { ImageInputError } from "@/lib/image-safety";
import {
  PAGE_BANNER_MAX_BYTES,
  PAGE_BANNER_SIZE_MESSAGE,
} from "@/lib/validations/page-banner";
import { isPageBannerSlug } from "@/lib/page-banner-routes";

export const runtime = "nodejs";

/**
 * Uploads a page cover photograph and hands the reference back to the editor.
 * The record itself is saved separately, so a failed upload can never replace
 * the photograph that is already stored.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ page: string }> },
) {
  let stage = "authentication";

  try {
    // Independent authorization and origin check, before the body is read.
    const denied = await rejectUnauthorizedAdminWrite(request, {
      requireJson: false,
    });
    if (denied) return denied;

    const { page } = await params;

    if (!isPageBannerSlug(page)) {
      return Response.json(
        { message: "That page has no banner editor." },
        { status: 404 },
      );
    }

    stage = "validation";
    const { file } = await readBoundedImageFormData(request, {
      maxBytes: PAGE_BANNER_MAX_BYTES,
      extraFields: [],
      sizeMessage: PAGE_BANNER_SIZE_MESSAGE,
    });

    const { buffer, format } = await normalizeBannerImage(
      Buffer.from(await file.arrayBuffer()),
    );

    stage = "upload";
    const image = await uploadPageBannerImage(buffer, format);

    return Response.json({
      message: "Image uploaded. Save the banner to keep it.",
      image,
    });
  } catch (error) {
    if (error instanceof ImageInputError) {
      return Response.json({ message: error.message }, { status: error.status });
    }

    // Never log raw SDK/database errors that may contain credentials.
    console.error("Page banner image upload failed", {
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
