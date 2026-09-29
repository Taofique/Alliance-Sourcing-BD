import { rejectUnauthorizedAdminWrite } from "@/lib/admin-api";
import { uploadProductImage } from "@/lib/cloudinary";
import { normalizeProductImage } from "@/lib/product-image";
import { readBoundedImageFormData } from "@/lib/image-form-data";
import { ImageInputError } from "@/lib/image-safety";
import { MAX_PRODUCT_BYTES, PRODUCT_SIZE_MESSAGE } from "@/lib/product-upload-limits";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const denied = await rejectUnauthorizedAdminWrite(request, { requireJson: false });
    if (denied) return denied;

    const { file } = await readBoundedImageFormData(request, {
      maxBytes: MAX_PRODUCT_BYTES,
      extraFields: [],
      sizeMessage: PRODUCT_SIZE_MESSAGE,
    });

    const { buffer, format } = await normalizeProductImage(
      Buffer.from(await file.arrayBuffer()),
    );
    const image = await uploadProductImage(buffer, format);

    return Response.json({
      message: "Image uploaded. Save the product to use it.",
      image,
    });
  } catch (error) {
    if (error instanceof ImageInputError) {
      return Response.json({ message: error.message }, { status: error.status });
    }
    return Response.json(
      { message: "Unable to upload the image. The saved product is unchanged." },
      { status: 502 },
    );
  }
}
