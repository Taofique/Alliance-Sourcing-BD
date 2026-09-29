import { revalidatePath } from "next/cache";
import { rejectUnauthorizedAdminWrite, readJsonBody } from "@/lib/admin-api";
import {
  PRODUCT_ID_PATTERN,
  productSubcategoryUpdateSchema,
} from "@/lib/validations/products";
import { describeProductDuplicate } from "@/lib/product-duplicate";
import {
  deleteProductSubcategory,
  updateProductSubcategory,
} from "@/services/products";

export const runtime = "nodejs";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Context) {
  try {
    const denied = await rejectUnauthorizedAdminWrite(request);
    if (denied) return denied;

    const { id } = await params;
    if (!PRODUCT_ID_PATTERN.test(id)) {
      return Response.json({ message: "Invalid subcategory ID." }, { status: 400 });
    }

    const { body, error } = await readJsonBody(request);
    if (error) return error;

    const parsed = productSubcategoryUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { message: parsed.error.issues[0]?.message ?? "Invalid subcategory." },
        { status: 400 },
      );
    }

    const subcategory = await updateProductSubcategory(id, parsed.data);
    if (!subcategory) {
      return Response.json(
        { message: "Subcategory or its category no longer exists. Reload the page." },
        { status: 404 },
      );
    }

    revalidatePath("/buying-house");
    return Response.json({ message: "Subcategory saved.", subcategory });
  } catch (error) {
    const duplicate = describeProductDuplicate(error);
    if (duplicate) return Response.json({ message: duplicate }, { status: 409 });
    return Response.json(
      { message: "Unable to save the subcategory. Please try again." },
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
      return Response.json({ message: "Invalid subcategory ID." }, { status: 400 });
    }

    // The subcategory goes first, then its products, so a failed delete cannot
    // leave products stranded with no subcategory to reach them from.
    if (!(await deleteProductSubcategory(id))) {
      return Response.json(
        { message: "Subcategory no longer exists. Reload the page." },
        { status: 404 },
      );
    }

    revalidatePath("/buying-house");
    return Response.json({ message: "Subcategory and its products deleted." });
  } catch {
    return Response.json(
      { message: "Unable to delete the subcategory. Please try again." },
      { status: 500 },
    );
  }
}
