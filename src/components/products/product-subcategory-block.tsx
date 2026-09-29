import ProductCard from "@/components/products/product-card";
import type { PublicProductSubcategory } from "@/types/products";

type ProductSubcategoryBlockProps = {
  subcategory: PublicProductSubcategory;
};

/**
 * One subcategory heading, its hairline rule, and the grid of garments under it.
 *
 * Ported from the reference markup: the `h3` in the heading face, the flex-1
 * rule that fills the remaining width, and the 2/3/4/5-across grid that collapses
 * to two columns on the smallest screens.
 */
export default function ProductSubcategoryBlock({
  subcategory,
}: ProductSubcategoryBlockProps) {
  return (
    <div className="mb-12">
      <div className="flex items-center gap-4 mb-6">
        <h3
          className="font-heading text-xl font-bold text-slate-800"
          id={`subcategory-${subcategory.id}`}
        >
          {subcategory.name}
        </h3>
        <div aria-hidden="true" className="h-px flex-1 bg-slate-200" />
        <p className="shrink-0 text-sm text-slate-500">
          {subcategory.productCount}{" "}
          {subcategory.productCount === 1 ? "product" : "products"}
        </p>
      </div>

      {/*
        The rule is decorative, but the count beside it is the number a reader
        can check, so the grid is labelled by the subcategory heading above it.
      */}
      <ul
        aria-labelledby={`subcategory-${subcategory.id}`}
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6"
      >
        {subcategory.products.map((product) => (
          <li key={product.id}>
            <ProductCard product={product} />
          </li>
        ))}
      </ul>
    </div>
  );
}
