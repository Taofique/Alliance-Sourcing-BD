import { getAdminSession } from "@/lib/admin-session";
import { uploadBannerImage } from "@/lib/cloudinary";
import { BANNER_SIZE_MESSAGE, MAX_BANNER_BYTES } from "@/lib/banner-upload-limits";
import { normalizeBannerImage } from "@/lib/banner-image";
import { readBoundedImageFormData } from "@/lib/image-form-data";
import { ImageInputError } from "@/lib/image-safety";

export const runtime = "nodejs";

/**
 * Uploads a banner background and hands the reference back to the editor. The
 * record itself is saved separately, so a failed upload can never replace the
 * image that is already stored on a banner.
 */
export async function POST(request: Request) {
  let stage = "authentication";

  try {
    if (!(await getAdminSession())) {
      return Response.json(
        { message: "Admin authentication required." },
        { status: 401 },
      );
    }

    const baseURL = process.env.BETTER_AUTH_URL;
    if (!baseURL) throw new Error("Application origin is missing.");
    if (request.headers.get("origin") !== new URL(baseURL).origin) {
      return Response.json(
        { message: "Request origin is not allowed." },
        { status: 403 },
      );
    }

    stage = "validation";
    const { file } = await readBoundedImageFormData(request, {
      maxBytes: MAX_BANNER_BYTES,
      extraFields: [],
      sizeMessage: BANNER_SIZE_MESSAGE,
    });

    const { buffer, format } = await normalizeBannerImage(
      Buffer.from(await file.arrayBuffer()),
    );

    stage = "upload";
    const image = await uploadBannerImage(buffer, format);

    return Response.json({
      message: "Image uploaded. Save the slide to keep it.",
      image,
    });
  } catch (error) {
    if (error instanceof ImageInputError) {
      return Response.json({ message: error.message }, { status: error.status });
    }

    console.error("Banner image upload failed", {
      stage,
      errorType: error instanceof Error ? error.name : "Unknown",
    });

    return Response.json(
      {
        message:
          stage === "upload"
            ? "The image could not be uploaded. Your saved image is unchanged."
            : "Unable to read that image. Your saved image is unchanged.",
      },
      { status: stage === "upload" ? 502 : 500 },
    );
  }
}
