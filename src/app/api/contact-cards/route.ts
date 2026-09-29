import { rejectUnauthorizedAdminWrite, readJsonBody } from "@/lib/admin-api";
import { contactCardCreateSchema } from "@/lib/validations/contact-card";
import {
  createContactCard,
  getPublicContactCards,
} from "@/services/contact-card";
export const runtime = "nodejs";

/**
 * The published contact cards, active ones only, in display order.
 *
 * Public on purpose: it exposes nothing the /contact page does not already show,
 * and it lets the grid be rendered without a Server Component. The list is
 * whatever length the collection holds — there is no fixed card count.
 */
export async function GET() {
  try {
    return Response.json({ cards: await getPublicContactCards() });
  } catch {
    return Response.json(
      { message: "Unable to load the contact cards." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const denied = await rejectUnauthorizedAdminWrite(request);
    if (denied) return denied;
    const { body, error } = await readJsonBody(request);
    if (error) return error;
    const parsed = contactCardCreateSchema.safeParse(body);
    if (!parsed.success) return Response.json({ message: parsed.error.issues[0]?.message ?? "Invalid card." }, { status: 400 });
    const card = await createContactCard(parsed.data);
    return Response.json({ message: "Card created.", card }, { status: 201 });
  } catch {
    return Response.json({ message: "Unable to create the card. Please try again." }, { status: 500 });
  }
}
