import { requireAdmin } from "@/lib/admin-session";
import { getAdminProductCategories } from "@/services/products";
import ProductCategoriesEditor from "@/components/admin/product-categories-editor";

export default async function ProductCategoriesAdminPage() {
  await requireAdmin();
  const categories = await getAdminProductCategories();
  return <ProductCategoriesEditor initialCategories={categories} />;
}
