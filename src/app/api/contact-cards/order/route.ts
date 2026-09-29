import { rejectUnauthorizedAdminWrite, readJsonBody } from "@/lib/admin-api";
import { contactCardOrderSchema } from "@/lib/validations/contact-card";
import { reorderContactCards } from "@/services/contact-card";
export const runtime = "nodejs";
export async function PUT(request: Request) {
  try {
    const denied = await rejectUnauthorizedAdminWrite(request);
    if (denied) return denied;
    const { body, error } = await readJsonBody(request);
    if (error) return error;
    const parsed = contactCardOrderSchema.safeParse(body);
    if (!parsed.success) return Response.json({ message: parsed.error.issues[0]?.message ?? "Invalid order." }, { status: 400 });
    const cards = await reorderContactCards(parsed.data.ids);
    if (!cards) return Response.json({ message: "The card list changed. Reload before reordering." }, { status: 409 });
    return Response.json({ message: "Display order saved.", cards });
  } catch {
    return Response.json({ message: "Unable to reorder the cards. Please try again." }, { status: 500 });
  }
}
