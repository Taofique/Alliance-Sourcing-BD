import SplitFeatureSection from "@/components/sections/split-feature-section";
import { productsAndServices } from "@/lib/homepage-sections";

/** Products & Services — the catalogue photograph beside the category grid. */
export default function ProductsServicesSection() {
  return <SplitFeatureSection id="products-services-heading" section={productsAndServices} />;
}
