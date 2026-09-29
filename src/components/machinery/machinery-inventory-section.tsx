import Container from "@/components/layout/container";
import SectionHeading from "@/components/common/section-heading";
import MachineryInventoryTable from "@/components/machinery/machinery-inventory-table";
import { factoryMachineryContent } from "@/lib/factory-machinery-sections";
import type { MachineryInventory } from "@/types/machinery";

type MachineryInventorySectionProps = {
  inventory: MachineryInventory;
};

/**
 * "Our Machinery Inventory": the only database-driven part of the page.
 *
 * One table per category, each rendered by the same reusable component, and a
 * grand total summed from the rows shown — so a quantity changed in the admin
 * is correct here on the next render.
 */
export default function MachineryInventorySection({
  inventory,
}: MachineryInventorySectionProps) {
  const content = factoryMachineryContent.inventory;
  const { categories, grandTotal } = inventory;

  return (
    <section
      aria-labelledby="machinery-inventory-heading"
      className="bg-white py-14 md:py-20"
    >
      <Container>
        <SectionHeading
          id="machinery-inventory-heading"
          eyebrow="Inventory"
          heading={content.heading}
        />

        {categories.length === 0 ? (
          <p className="mx-auto max-w-2xl text-center text-base text-slate-600">
            {content.emptyMessage}
          </p>
        ) : (
          <div className="space-y-8">
            {categories.map((category) => (
              <MachineryInventoryTable
                key={category.id}
                id={`machinery-category-${category.slug}`}
                name={category.name}
                total={category.total}
                rows={category.items}
              />
            ))}

            {/* The grand total is the sum of the category totals above it. */}
            <div className="flex items-baseline justify-between gap-4 rounded-2xl bg-slate-900 px-5 py-5 sm:px-6">
              <h3 className="font-heading text-lg font-bold text-white sm:text-xl">
                Grand Total Machines
              </h3>
              <p className="font-heading text-2xl font-bold text-white sm:text-3xl">
                {grandTotal}
              </p>
            </div>
          </div>
        )}
      </Container>
    </section>
  );
}
