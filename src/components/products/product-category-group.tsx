import ProductSubcategoryBlock from "@/components/products/product-subcategory-block";
import type { PublicProductCategory } from "@/types/products";

type ProductCategoryGroupProps = {
  category: PublicProductCategory;
  /** Unique per page instance, so the id is valid even if the block repeats. */
  idPrefix: string;
};

/**
 * One category: its heading, then every populated subcategory beneath it.
 *
 * The reference page stacks categories vertically rather than behind tabs, so
 * this is a Server Component with no state: the whole catalogue is rendered on
 * the server and an admin save is visible on the next request.
 */
export default function ProductCategoryGroup({
  category,
  idPrefix,
}: ProductCategoryGroupProps) {
  return (
    <section aria-labelledby={`${idPrefix}-category-${category.id}`}>
      <h2
        id={`${idPrefix}-category-${category.id}`}
        className="font-heading text-3xl font-bold mb-6"
      >
        {category.name}
      </h2>

      {category.subcategories.map((subcategory) => (
        <ProductSubcategoryBlock
          key={subcategory.id}
          subcategory={subcategory}
        />
      ))}
    </section>
  );
}
