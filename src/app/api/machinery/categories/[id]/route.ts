import { revalidatePath } from "next/cache";
import { rejectUnauthorizedAdminWrite, readJsonBody } from "@/lib/admin-api";
import {
  MACHINERY_ID_PATTERN,
  machineryCategoryUpdateSchema,
} from "@/lib/validations/machinery";
import { describeMachineryDuplicate } from "@/lib/machinery-duplicate";
import {
  deleteMachineryCategory,
  updateMachineryCategory,
} from "@/services/machinery";
export const runtime = "nodejs";
type Context = { params: Promise<{ id: string }> };
export async function PATCH(request: Request, { params }: Context) {
  try {
    const denied = await rejectUnauthorizedAdminWrite(request);
    if (denied) return denied;
    const { id } = await params;
    if (!MACHINERY_ID_PATTERN.test(id)) return Response.json({ message: "Invalid category ID." }, { status: 400 });
    const { body, error } = await readJsonBody(request);
    if (error) return error;
    const parsed = machineryCategoryUpdateSchema.safeParse(body);
    if (!parsed.success) return Response.json({ message: parsed.error.issues[0]?.message ?? "Invalid category." }, { status: 400 });
    const category = await updateMachineryCategory(id, parsed.data);
    if (!category) return Response.json({ message: "Category no longer exists. Reload the page." }, { status: 404 });
    revalidatePath("/factory-machinery");
    return Response.json({ message: "Category saved.", category });
  } catch (error) {
    const duplicate = describeMachineryDuplicate(error);
    if (duplicate) return Response.json({ message: duplicate }, { status: 409 });
    return Response.json({ message: "Unable to save the category. Please try again." }, { status: 500 });
  }
}
export async function DELETE(request: Request, { params }: Context) {
  try {
    // A browser DELETE carries no body, so it cannot be asked for a JSON type.
    const denied = await rejectUnauthorizedAdminWrite(request, { requireJson: false });
    if (denied) return denied;
    const { id } = await params;
    if (!MACHINERY_ID_PATTERN.test(id)) return Response.json({ message: "Invalid category ID." }, { status: 400 });
    // The service deletes the category first, then its machines, so a failed
    // category delete can never leave rows behind with no category to reach
    // them from.
    if (!(await deleteMachineryCategory(id))) return Response.json({ message: "Category no longer exists. Reload the page." }, { status: 404 });
    revalidatePath("/factory-machinery");
    return Response.json({ message: "Category and its machines deleted." });
  } catch {
    return Response.json({ message: "Unable to delete the category. Please try again." }, { status: 500 });
  }
}
