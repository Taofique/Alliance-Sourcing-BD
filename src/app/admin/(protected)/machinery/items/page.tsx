import { requireAdmin } from "@/lib/admin-session";
import {
  getAdminMachineryCategories,
  getAdminMachineryItems,
} from "@/services/machinery";
import { MACHINERY_ID_PATTERN } from "@/lib/validations/machinery";
import MachineryItemsEditor from "@/components/admin/machinery-items-editor";

/**
 * The category filter arrives from the "Machines" link on the categories page.
 * It is validated here before it is handed to the client, so a hand-edited URL
 * cannot seed the list with something that is not an id.
 */
export default async function MachineryItemsAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ categoryId?: string }>;
}) {
  await requireAdmin();
  const { categoryId } = await searchParams;

  const [categories, items] = await Promise.all([
    getAdminMachineryCategories(),
    getAdminMachineryItems(),
  ]);

  const initialCategoryId =
    categoryId && MACHINERY_ID_PATTERN.test(categoryId) ? categoryId : "all";

  return (
    <MachineryItemsEditor
      initialItems={items}
      categories={categories}
      initialCategoryId={initialCategoryId}
    />
  );
}
