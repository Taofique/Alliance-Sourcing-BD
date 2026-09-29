import { requireAdmin } from "@/lib/admin-session";
import {
  getAdminProductCategories,
  getAdminProductSubcategories,
  getAdminProducts,
} from "@/services/products";
import ProductItemsEditor from "@/components/admin/product-items-editor";

export default async function ProductItemsAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ subcategoryId?: string }>;
}) {
  await requireAdmin();
  const { subcategoryId } = await searchParams;

  // Every subcategory is needed for the picker even when the list is filtered to
  // one of them, so the admin can always move a product somewhere else.
  const [categories, subcategories, products] = await Promise.all([
    getAdminProductCategories(),
    getAdminProductSubcategories(),
    getAdminProducts(subcategoryId || undefined),
  ]);

  return (
    <ProductItemsEditor
      initialProducts={products}
      initialSubcategories={subcategories}
      initialCategories={categories}
      initialSubcategoryId={subcategoryId ?? ""}
    />
  );
}
