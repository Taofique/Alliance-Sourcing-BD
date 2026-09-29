import { requireAdmin } from "@/lib/admin-session";
import { getContactMessages } from "@/services/contact-message";
import ContactMessageList from "@/components/admin/contact-message-list";

export default async function ContactMessagesAdminPage() {
  await requireAdmin();
  const messages = await getContactMessages();
  return <ContactMessageList initialMessages={messages} />;
}
