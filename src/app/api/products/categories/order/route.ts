import { revalidatePath } from "next/cache";
import { rejectUnauthorizedAdminWrite, readJsonBody } from "@/lib/admin-api";
import { productOrderSchema } from "@/lib/validations/products";
import { reorderProductCategories } from "@/services/products";

export const runtime = "nodejs";

export async function PUT(request: Request) {
  try {
    const denied = await rejectUnauthorizedAdminWrite(request);
    if (denied) return denied;

    const { body, error } = await readJsonBody(request);
    if (error) return error;

    const parsed = productOrderSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { message: parsed.error.issues[0]?.message ?? "Invalid order." },
        { status: 400 },
      );
    }

    const categories = await reorderProductCategories(parsed.data.ids);
    if (!categories) {
      return Response.json(
        { message: "The category list changed. Reload before reordering." },
        { status: 409 },
      );
    }

    revalidatePath("/buying-house");
    return Response.json({ message: "Display order saved.", categories });
  } catch {
    return Response.json(
      { message: "Unable to reorder categories. Please try again." },
      { status: 500 },
    );
  }
}
