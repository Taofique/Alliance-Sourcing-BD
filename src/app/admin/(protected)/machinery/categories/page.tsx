import { requireAdmin } from "@/lib/admin-session";
import { getAdminMachineryCategories } from "@/services/machinery";
import MachineryCategoriesEditor from "@/components/admin/machinery-categories-editor";

export default async function MachineryCategoriesAdminPage() {
  await requireAdmin();
  const categories = await getAdminMachineryCategories();
  return <MachineryCategoriesEditor initialCategories={categories} />;
}
