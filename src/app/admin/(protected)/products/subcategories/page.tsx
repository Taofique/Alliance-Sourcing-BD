import { requireAdmin } from "@/lib/admin-session";
import {
  getAdminProductCategories,
  getAdminProductSubcategories,
} from "@/services/products";
import ProductSubcategoriesEditor from "@/components/admin/product-subcategories-editor";

export default async function ProductSubcategoriesAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ categoryId?: string }>;
}) {
  await requireAdmin();
  const { categoryId } = await searchParams;

  const [categories, subcategories] = await Promise.all([
    getAdminProductCategories(),
    // An unrecognised or absent id falls back to the whole list rather than
    // erroring, so the picker is never pointed at nothing.
    getAdminProductSubcategories(categoryId || undefined),
  ]);

  return (
    <ProductSubcategoriesEditor
      initialSubcategories={subcategories}
      initialCategories={categories}
      initialCategoryId={categoryId ?? ""}
    />
  );
}
