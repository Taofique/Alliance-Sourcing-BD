import ProductCategoryGroup from "@/components/products/product-category-group";
import type { ProductCatalog } from "@/types/products";

type ProductsSectionProps = {
  catalog: ProductCatalog;
  /** Unique per page instance, so repeated ids never collide. */
  idPrefix?: string;
};

/**
 * The "Products" band on /buying-house.
 *
 * The heading, the intro line and the vertical category stack are ported from the
 * reference `ProductShowcase` so the published page matches the live site; the
 * one thing that is different is where the garments come from. The reference
 * fetches a flat array and groups it in the browser-facing component. This reads
 * the published catalogue from the database through `getProductCatalog`, which
 * has already dropped every inactive or empty branch, so nothing here has to
 * decide what a reader is allowed to see.
 *
 * The empty state matters: a catalogue with nothing published yet renders the
 * heading and the intro with no grid, rather than a broken layout.
 */
export default function ProductsSection({
  catalog,
  idPrefix = "buying-house-products",
}: ProductsSectionProps) {
  const totalProducts = catalog.categories.reduce(
    (sum, category) =>
      sum +
      category.subcategories.reduce(
        (subtotal, subcategory) => subtotal + subcategory.productCount,
        0,
      ),
    0,
  );

  return (
    <section aria-labelledby={`${idPrefix}-heading`} className="bg-white">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 md:py-24 lg:px-8">
        <div className="text-center mb-16">
          <h2
            id={`${idPrefix}-heading`}
            className="font-heading text-4xl sm:text-5xl font-bold text-slate-900 mb-4"
          >
            Products
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Explore our wide range of high-quality products across different
            categories and subcategories.
          </p>
        </div>

        {catalog.categories.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-300 p-10 text-center text-slate-600">
            No products are published yet. Add categories, subcategories and
            products in the admin to fill this section.
          </p>
        ) : (
          <div className="space-y-12">
            {catalog.categories.map((category) => (
              <ProductCategoryGroup
                key={category.id}
                category={category}
                idPrefix={idPrefix}
              />
            ))}
          </div>
        )}

        {/*
          A quiet summary for assistive technology and for anyone who wants the
          shape of the catalogue without counting the cards.
        */}
        <p className="sr-only">
          {catalog.categories.length}{" "}
          {catalog.categories.length === 1 ? "category" : "categories"} and{" "}
          {totalProducts} {totalProducts === 1 ? "product" : "products"}.
        </p>
      </div>
    </section>
  );
}
