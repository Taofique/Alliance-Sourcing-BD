import { rejectUnauthorizedAdminWrite, readJsonBody } from "@/lib/admin-api";
import { faqCreateSchema } from "@/lib/validations/faq";
import { createFaq } from "@/services/faq";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    const denied = await rejectUnauthorizedAdminWrite(request);
    if (denied) return denied;
    const { body, error } = await readJsonBody(request);
    if (error) return error;
    const parsed = faqCreateSchema.safeParse(body);
    if (!parsed.success) return Response.json({ message: parsed.error.issues[0]?.message ?? "Invalid question." }, { status: 400 });
    const faq = await createFaq(parsed.data);
    return Response.json({ message: "Question created.", faq }, { status: 201 });
  } catch {
    return Response.json({ message: "Unable to create the question. Please try again." }, { status: 500 });
  }
}
