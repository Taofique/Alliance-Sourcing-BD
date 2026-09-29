import { revalidatePath } from "next/cache";
import { rejectUnauthorizedAdminWrite, readJsonBody } from "@/lib/admin-api";
import {
  MACHINERY_ID_PATTERN,
  machineryItemUpdateSchema,
} from "@/lib/validations/machinery";
import { deleteMachineryItem, updateMachineryItem } from "@/services/machinery";
export const runtime = "nodejs";
type Context = { params: Promise<{ id: string }> };
export async function PATCH(request: Request, { params }: Context) {
  try {
    const denied = await rejectUnauthorizedAdminWrite(request);
    if (denied) return denied;
    const { id } = await params;
    if (!MACHINERY_ID_PATTERN.test(id)) return Response.json({ message: "Invalid machine ID." }, { status: 400 });
    const { body, error } = await readJsonBody(request);
    if (error) return error;
    const parsed = machineryItemUpdateSchema.safeParse(body);
    if (!parsed.success) return Response.json({ message: parsed.error.issues[0]?.message ?? "Invalid machine." }, { status: 400 });
    const item = await updateMachineryItem(id, parsed.data);
    if (!item) return Response.json({ message: "Machine or its category no longer exists. Reload the page." }, { status: 404 });
    revalidatePath("/factory-machinery");
    return Response.json({ message: "Machine saved.", item });
  } catch {
    return Response.json({ message: "Unable to save the machine. Please try again." }, { status: 500 });
  }
}
export async function DELETE(request: Request, { params }: Context) {
  try {
    const denied = await rejectUnauthorizedAdminWrite(request, { requireJson: false });
    if (denied) return denied;
    const { id } = await params;
    if (!MACHINERY_ID_PATTERN.test(id)) return Response.json({ message: "Invalid machine ID." }, { status: 400 });
    if (!(await deleteMachineryItem(id))) return Response.json({ message: "Machine no longer exists. Reload the page." }, { status: 404 });
    revalidatePath("/factory-machinery");
    return Response.json({ message: "Machine deleted." });
  } catch {
    return Response.json({ message: "Unable to delete the machine. Please try again." }, { status: 500 });
  }
}
