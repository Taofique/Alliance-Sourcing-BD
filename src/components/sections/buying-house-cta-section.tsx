import ImageCtaSection from "@/components/sections/image-cta-section";
import { buyingHouseContent } from "@/lib/buying-house-sections";
import { getPublicSiteSettings } from "@/services/site-settings";

/**
 * The closing "Ready to start sourcing?" band on /buying-house.
 *
 * The band itself is the reference `CTASection`, which /global-partners also
 * uses, so it now lives in `ImageCtaSection`; this wrapper keeps the page's own
 * copy. The action address is read from the admin-managed contact settings rather
 * than hardcoded, so it stays correct when the contact emails change.
 */
export default async function BuyingHouseCtaSection() {
  const { heading, description, image } = buyingHouseContent.cta;
  const settings = await getPublicSiteSettings();
  // `footer.emails` is already the header addresses merged with the footer's own,
  // so it is the one list that holds every address the site publishes.
  const mailto = settings.footer.emails.filter(Boolean).join(",");

  return (
    <ImageCtaSection
      id="buying-house-cta-heading"
      heading={heading}
      description={description}
      image={image}
      mailto={mailto}
    />
  );
}
