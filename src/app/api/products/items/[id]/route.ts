import { revalidatePath } from "next/cache";
import { rejectUnauthorizedAdminWrite, readJsonBody } from "@/lib/admin-api";
import { PRODUCT_ID_PATTERN, productUpdateSchema } from "@/lib/validations/products";
import { deleteProduct, updateProduct } from "@/services/products";

export const runtime = "nodejs";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Context) {
  try {
    const denied = await rejectUnauthorizedAdminWrite(request);
    if (denied) return denied;

    const { id } = await params;
    if (!PRODUCT_ID_PATTERN.test(id)) {
      return Response.json({ message: "Invalid product ID." }, { status: 400 });
    }

    const { body, error } = await readJsonBody(request);
    if (error) return error;

    // The photograph is optional here on purpose: a name-only or reorder edit
    // keeps whatever image is already stored.
    const parsed = productUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { message: parsed.error.issues[0]?.message ?? "Invalid product." },
        { status: 400 },
      );
    }

    const product = await updateProduct(id, parsed.data);
    if (!product) {
      return Response.json(
        { message: "Product or its subcategory no longer exists. Reload the page." },
        { status: 404 },
      );
    }

    revalidatePath("/buying-house");
    return Response.json({ message: "Product saved.", product });
  } catch {
    return Response.json(
      { message: "Unable to save the product. Please try again." },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request, { params }: Context) {
  try {
    const denied = await rejectUnauthorizedAdminWrite(request, { requireJson: false });
    if (denied) return denied;

    const { id } = await params;
    if (!PRODUCT_ID_PATTERN.test(id)) {
      return Response.json({ message: "Invalid product ID." }, { status: 400 });
    }

    if (!(await deleteProduct(id))) {
      return Response.json(
        { message: "Product no longer exists. Reload the page." },
        { status: 404 },
      );
    }

    revalidatePath("/buying-house");
    return Response.json({ message: "Product deleted." });
  } catch {
    return Response.json(
      { message: "Unable to delete the product. Please try again." },
      { status: 500 },
    );
  }
}
