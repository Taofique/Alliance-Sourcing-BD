import { rejectUnauthorizedAdminWrite, readJsonBody } from "@/lib/admin-api";
import { FAQ_ID_PATTERN, faqUpdateSchema } from "@/lib/validations/faq";
import { updateFaq, deleteFaq } from "@/services/faq";
export const runtime = "nodejs";
type Context = { params: Promise<{ id: string }> };
export async function PATCH(request: Request, { params }: Context) {
  try {
    const denied = await rejectUnauthorizedAdminWrite(request);
    if (denied) return denied;
    const { id } = await params;
    if (!FAQ_ID_PATTERN.test(id)) return Response.json({ message: "Invalid question ID." }, { status: 400 });
    const { body, error } = await readJsonBody(request);
    if (error) return error;
    const parsed = faqUpdateSchema.safeParse(body);
    if (!parsed.success) return Response.json({ message: parsed.error.issues[0]?.message ?? "Invalid question." }, { status: 400 });
    const faq = await updateFaq(id, parsed.data);
    if (!faq) return Response.json({ message: "Question no longer exists. Reload the page." }, { status: 404 });
    return Response.json({ message: "Question saved.", faq });
  } catch {
    return Response.json({ message: "Unable to save the question. Please try again." }, { status: 500 });
  }
}
export async function DELETE(request: Request, { params }: Context) {
  try {
    const denied = await rejectUnauthorizedAdminWrite(request, { requireJson: false });
    if (denied) return denied;
    const { id } = await params;
    if (!FAQ_ID_PATTERN.test(id)) return Response.json({ message: "Invalid question ID." }, { status: 400 });
    if (!(await deleteFaq(id))) return Response.json({ message: "Question no longer exists. Reload the page." }, { status: 404 });
    return Response.json({ message: "Question deleted." });
  } catch {
    return Response.json({ message: "Unable to delete the question. Please try again." }, { status: 500 });
  }
}
