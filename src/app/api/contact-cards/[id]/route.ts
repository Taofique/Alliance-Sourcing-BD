import { rejectUnauthorizedAdminWrite, readJsonBody } from "@/lib/admin-api";
import { CONTACT_CARD_ID_PATTERN, contactCardUpdateSchema } from "@/lib/validations/contact-card";
import { updateContactCard, deleteContactCard } from "@/services/contact-card";
export const runtime = "nodejs";
type Context = { params: Promise<{ id: string }> };

/**
 * A partial save. The merged record is re-checked, so a card can be updated one
 * field at a time but never end up with nothing in it.
 */
export async function PATCH(request: Request, { params }: Context) {
  try {
    const denied = await rejectUnauthorizedAdminWrite(request);
    if (denied) return denied;
    const { id } = await params;
    if (!CONTACT_CARD_ID_PATTERN.test(id)) return Response.json({ message: "Invalid card ID." }, { status: 400 });
    const { body, error } = await readJsonBody(request);
    if (error) return error;
    const parsed = contactCardUpdateSchema.safeParse(body);
    if (!parsed.success) return Response.json({ message: parsed.error.issues[0]?.message ?? "Invalid card." }, { status: 400 });
    const card = await updateContactCard(id, parsed.data);
    if (!card) return Response.json({ message: "The card no longer exists, or would be left empty. Reload the page." }, { status: 404 });
    return Response.json({ message: "Card saved.", card });
  } catch {
    return Response.json({ message: "Unable to save the card. Please try again." }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: Context) {
  try {
    const denied = await rejectUnauthorizedAdminWrite(request, { requireJson: false });
    if (denied) return denied;
    const { id } = await params;
    if (!CONTACT_CARD_ID_PATTERN.test(id)) return Response.json({ message: "Invalid card ID." }, { status: 400 });
    if (!(await deleteContactCard(id))) return Response.json({ message: "Card no longer exists. Reload the page." }, { status: 404 });
    return Response.json({ message: "Card deleted." });
  } catch {
    return Response.json({ message: "Unable to delete the card. Please try again." }, { status: 500 });
  }
}
