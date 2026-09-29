import ImageCtaSection from "@/components/sections/image-cta-section";
import { contactCta } from "@/lib/contact-sections";

type ContactCtaSectionProps = {
  /**
   * A single recipient address for the button, taken from the contact cards.
   * `ImageCtaSection` builds a `mailto:`, so a list would have to be a
   * comma-separated string, which is why this is one address and not all of them.
   */
  mailto: string;
};

/**
 * The closing band of /contact, the same `ImageCtaSection` the other two pages
 * use. This page only supplies its own copy and the address to write to.
 */
export default function ContactCtaSection({ mailto }: ContactCtaSectionProps) {
  return (
    <ImageCtaSection
      id="contact-cta"
      heading={contactCta.heading}
      description={contactCta.description}
      image={contactCta.image}
      mailto={mailto}
      label={contactCta.label}
    />
  );
}
