import { requireAdmin } from "@/lib/admin-session";
import { getAdminSourcingCategories, getSourcingSettings } from "@/services/sourcing";
import SourcingEditor from "@/components/admin/sourcing-editor";

export default async function SourcingAdminPage() {
  await requireAdmin();
  const [categories, settings] = await Promise.all([getAdminSourcingCategories(), getSourcingSettings()]);
  return <SourcingEditor initialCategories={categories} initialSettings={settings} />;
}

