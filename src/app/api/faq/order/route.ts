import { rejectUnauthorizedAdminWrite, readJsonBody } from "@/lib/admin-api";
import { faqOrderSchema } from "@/lib/validations/faq";
import { reorderFaqs } from "@/services/faq";
export const runtime = "nodejs";
export async function PUT(request: Request) {
  try {
    const denied = await rejectUnauthorizedAdminWrite(request);
    if (denied) return denied;
    const { body, error } = await readJsonBody(request);
    if (error) return error;
    const parsed = faqOrderSchema.safeParse(body);
    if (!parsed.success) return Response.json({ message: parsed.error.issues[0]?.message ?? "Invalid order." }, { status: 400 });
    const faqs = await reorderFaqs(parsed.data.ids);
    if (!faqs) return Response.json({ message: "The question list changed. Reload before reordering." }, { status: 409 });
    return Response.json({ message: "Display order saved.", faqs });
  } catch {
    return Response.json({ message: "Unable to reorder questions. Please try again." }, { status: 500 });
  }
}
