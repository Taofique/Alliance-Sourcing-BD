import SplitFeatureSection from "@/components/sections/split-feature-section";
import { factoryAndMachinery } from "@/lib/homepage-sections";

/** Factory and machinery capabilities — the same layout, mirrored. */
export default function FactoryMachinerySection() {
  return <SplitFeatureSection id="factory-machinery-heading" section={factoryAndMachinery} />;
}
