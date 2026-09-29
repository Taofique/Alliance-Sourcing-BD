import { requireAdmin } from "@/lib/admin-session";
import { getAdminContactCards } from "@/services/contact-card";
import ContactCardEditor from "@/components/admin/contact-card-editor";

export default async function ContactCardsAdminPage() {
  await requireAdmin();
  const cards = await getAdminContactCards();
  return <ContactCardEditor initialCards={cards} />;
}
