import Container from "@/components/layout/container";
import SectionHeading from "@/components/common/section-heading";
import MachineryFeatureCard from "@/components/machinery/machinery-feature-card";
import { factoryMachineryContent } from "@/lib/factory-machinery-sections";

/** The two industry 4.0 machine highlights, from the static content module. */
export default function AdvancedMachinerySection() {
  const content = factoryMachineryContent.advancedMachinery;

  return (
    <section
      aria-labelledby="advanced-machinery-heading"
      className="bg-blue-50 py-14 md:py-20"
    >
      <Container>
        <SectionHeading
          id="advanced-machinery-heading"
          eyebrow="Industry 4.0"
          heading={content.heading}
          lede={content.subtitle}
        />

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          {content.features.map((feature) => (
            <MachineryFeatureCard
              key={feature.title}
              image={feature.image}
              title={feature.title}
              imageAlt={feature.imageAlt}
            />
          ))}
        </div>
      </Container>
    </section>
  );
}
