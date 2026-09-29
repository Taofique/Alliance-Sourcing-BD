import ImageCtaSection from "@/components/sections/image-cta-section";
import { globalPartnersContent } from "@/lib/global-partners-sections";
import { getPublicSiteSettings } from "@/services/site-settings";

/**
 * The closing "Become Our Partner" band on /global-partners.
 *
 * Shares the reference `CTASection` markup with /buying-house through
 * `ImageCtaSection`; this wrapper only supplies the page's own copy. The action
 * address is read from the admin-managed contact settings rather than hardcoded,
 * so it stays correct when the contact emails change.
 */
export default async function GlobalPartnersCtaSection() {
  const { heading, description, image } = globalPartnersContent.cta;
  const settings = await getPublicSiteSettings();
  // `footer.emails` is already the header addresses merged with the footer's own,
  // so it is the one list that holds every address the site publishes.
  const mailto = settings.footer.emails.filter(Boolean).join(",");

  return (
    <ImageCtaSection
      id="global-partners-cta-heading"
      heading={heading}
      description={description}
      image={image}
      mailto={mailto}
    />
  );
}
