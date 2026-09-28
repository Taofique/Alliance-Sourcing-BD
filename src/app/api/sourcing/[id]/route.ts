import { rejectUnauthorizedAdminWrite, readJsonBody } from "@/lib/admin-api";
import { SOURCING_ID_PATTERN, sourcingUpdateSchema } from "@/lib/validations/sourcing";
import { updateSourcingCategory, deleteSourcingCategory } from "@/services/sourcing";
export const runtime = "nodejs";
type Context = { params: Promise<{ id: string }> };
export async function PATCH(request: Request, { params }: Context) {
  try {
    const denied = await rejectUnauthorizedAdminWrite(request);
    if (denied) return denied;
    const { id } = await params;
    if (!SOURCING_ID_PATTERN.test(id)) return Response.json({ message: "Invalid category ID." }, { status: 400 });
    const { body, error } = await readJsonBody(request);
    if (error) return error;
    const parsed = sourcingUpdateSchema.safeParse(body);
    if (!parsed.success) return Response.json({ message: parsed.error.issues[0]?.message ?? "Invalid category." }, { status: 400 });
    const category = await updateSourcingCategory(id, parsed.data);
    if (!category) return Response.json({ message: "Category no longer exists. Reload the page." }, { status: 404 });
    return Response.json({ message: "Category saved.", category });
  } catch {
    return Response.json({ message: "Unable to save the category. Please try again." }, { status: 500 });
  }
}
export async function DELETE(request: Request, { params }: Context) {
  try {
    const denied = await rejectUnauthorizedAdminWrite(request, { requireJson: false });
    if (denied) return denied;
    const { id } = await params;
    if (!SOURCING_ID_PATTERN.test(id)) return Response.json({ message: "Invalid category ID." }, { status: 400 });
    if (!(await deleteSourcingCategory(id))) return Response.json({ message: "Category no longer exists. Reload the page." }, { status: 404 });
    return Response.json({ message: "Category deleted." });
  } catch {
    return Response.json({ message: "Unable to delete the category. Please try again." }, { status: 500 });
  }
}

