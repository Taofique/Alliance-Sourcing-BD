import { rejectUnauthorizedAdminWrite, readJsonBody } from "@/lib/admin-api";
import { sourcingOrderSchema } from "@/lib/validations/sourcing";
import { reorderSourcingCategories } from "@/services/sourcing";
export const runtime = "nodejs";
export async function PUT(request: Request) {
  try {
    const denied = await rejectUnauthorizedAdminWrite(request);
    if (denied) return denied;
    const { body, error } = await readJsonBody(request);
    if (error) return error;
    const parsed = sourcingOrderSchema.safeParse(body);
    if (!parsed.success) return Response.json({ message: parsed.error.issues[0]?.message ?? "Invalid order." }, { status: 400 });
    const categories = await reorderSourcingCategories(parsed.data.ids);
    if (!categories) return Response.json({ message: "The category list changed. Reload before reordering." }, { status: 409 });
    return Response.json({ message: "Display order saved.", categories });
  } catch {
    return Response.json({ message: "Unable to reorder categories. Please try again." }, { status: 500 });
  }
}

