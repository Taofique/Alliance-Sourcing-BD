import { revalidatePath } from "next/cache";
import { rejectUnauthorizedAdminWrite, readJsonBody } from "@/lib/admin-api";
import { PRODUCT_ID_PATTERN, productCategoryUpdateSchema } from "@/lib/validations/products";
import { describeProductDuplicate } from "@/lib/product-duplicate";
import {
  deleteProductCategory,
  updateProductCategory,
} from "@/services/products";

export const runtime = "nodejs";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Context) {
  try {
    const denied = await rejectUnauthorizedAdminWrite(request);
    if (denied) return denied;

    const { id } = await params;
    if (!PRODUCT_ID_PATTERN.test(id)) {
      return Response.json({ message: "Invalid category ID." }, { status: 400 });
    }

    const { body, error } = await readJsonBody(request);
    if (error) return error;

    const parsed = productCategoryUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { message: parsed.error.issues[0]?.message ?? "Invalid category." },
        { status: 400 },
      );
    }

    const category = await updateProductCategory(id, parsed.data);
    if (!category) {
      return Response.json(
        { message: "Category no longer exists. Reload the page." },
        { status: 404 },
      );
    }

    revalidatePath("/buying-house");
    return Response.json({ message: "Category saved.", category });
  } catch (error) {
    const duplicate = describeProductDuplicate(error);
    if (duplicate) return Response.json({ message: duplicate }, { status: 409 });
    return Response.json(
      { message: "Unable to save the category. Please try again." },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request, { params }: Context) {
  try {
    // A browser DELETE carries no body, so it cannot be asked for a JSON type.
    const denied = await rejectUnauthorizedAdminWrite(request, { requireJson: false });
    if (denied) return denied;

    const { id } = await params;
    if (!PRODUCT_ID_PATTERN.test(id)) {
      return Response.json({ message: "Invalid category ID." }, { status: 400 });
    }

    // The service deletes the category first, then its subcategories, then their
    // products, so a failed delete can never leave rows with no parent to reach
    // them from.
    if (!(await deleteProductCategory(id))) {
      return Response.json(
        { message: "Category no longer exists. Reload the page." },
        { status: 404 },
      );
    }

    revalidatePath("/buying-house");
    return Response.json({ message: "Category and everything inside it deleted." });
  } catch {
    return Response.json(
      { message: "Unable to delete the category. Please try again." },
      { status: 500 },
    );
  }
}
