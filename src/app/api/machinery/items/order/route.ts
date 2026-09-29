import { revalidatePath } from "next/cache";
import { rejectUnauthorizedAdminWrite, readJsonBody } from "@/lib/admin-api";
import { machineryItemOrderSchema } from "@/lib/validations/machinery";
import { reorderMachineryItems } from "@/services/machinery";
export const runtime = "nodejs";
export async function PUT(request: Request) {
  try {
    const denied = await rejectUnauthorizedAdminWrite(request);
    if (denied) return denied;
    const { body, error } = await readJsonBody(request);
    if (error) return error;
    const parsed = machineryItemOrderSchema.safeParse(body);
    if (!parsed.success) return Response.json({ message: parsed.error.issues[0]?.message ?? "Invalid order." }, { status: 400 });
    const items = await reorderMachineryItems(parsed.data.categoryId, parsed.data.ids);
    if (!items) return Response.json({ message: "This category's machines changed. Reload before reordering." }, { status: 409 });
    revalidatePath("/factory-machinery");
    return Response.json({ message: "Display order saved.", items });
  } catch {
    return Response.json({ message: "Unable to reorder the machines. Please try again." }, { status: 500 });
  }
}

