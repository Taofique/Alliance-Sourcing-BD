import { rejectUnauthorizedAdminWrite } from "@/lib/admin-api";
import { uploadSourcingImage } from "@/lib/cloudinary";
import { normalizeBannerImage } from "@/lib/banner-image";
import { BANNER_SIZE_MESSAGE, MAX_BANNER_BYTES } from "@/lib/banner-upload-limits";
import { readBoundedImageFormData } from "@/lib/image-form-data";
import { ImageInputError } from "@/lib/image-safety";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    const denied = await rejectUnauthorizedAdminWrite(request, { requireJson: false });
    if (denied) return denied;
    const { file } = await readBoundedImageFormData(request, {
      maxBytes: MAX_BANNER_BYTES, extraFields: [], sizeMessage: BANNER_SIZE_MESSAGE,
    });
    const { buffer, format } = await normalizeBannerImage(Buffer.from(await file.arrayBuffer()));
    const image = await uploadSourcingImage(buffer, format);
    return Response.json({ message: "Image uploaded. Save the category to use it.", image });
  } catch (error) {
    if (error instanceof ImageInputError) return Response.json({ message: error.message }, { status: error.status });
    return Response.json({ message: "Unable to upload the image. Your saved image is unchanged." }, { status: 502 });
  }
}

