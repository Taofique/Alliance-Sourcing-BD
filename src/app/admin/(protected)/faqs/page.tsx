import { requireAdmin } from "@/lib/admin-session";
import { getAdminFaqs } from "@/services/faq";
import FaqEditor from "@/components/admin/faq-editor";

export default async function FaqAdminPage() {
  await requireAdmin();
  const faqs = await getAdminFaqs();
  return <FaqEditor initialFaqs={faqs} />;
}
