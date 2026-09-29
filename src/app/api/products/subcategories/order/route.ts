import { revalidatePath } from "next/cache";
import { rejectUnauthorizedAdminWrite, readJsonBody } from "@/lib/admin-api";
import { productScopedOrderSchema } from "@/lib/validations/products";
import { reorderProductSubcategories } from "@/services/products";

export const runtime = "nodejs";

export async function PUT(request: Request) {
  try {
    const denied = await rejectUnauthorizedAdminWrite(request);
    if (denied) return denied;

    const { body, error } = await readJsonBody(request);
    if (error) return error;

    const parsed = productScopedOrderSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { message: parsed.error.issues[0]?.message ?? "Invalid order." },
        { status: 400 },
      );
    }

    const { parentId, ids } = parsed.data;
    const subcategories = await reorderProductSubcategories(parentId, ids);
    if (!subcategories) {
      return Response.json(
        { message: "The subcategory list changed. Reload before reordering." },
        { status: 409 },
      );
    }

    revalidatePath("/buying-house");
    return Response.json({ message: "Display order saved.", subcategories });
  } catch {
    return Response.json(
      { message: "Unable to reorder subcategories. Please try again." },
      { status: 500 },
    );
  }
}
