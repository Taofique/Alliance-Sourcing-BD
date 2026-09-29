import type { Metadata } from "next";
import GlobalPartnersHero from "@/components/sections/global-partners-hero";
import PartnerCatalog from "@/components/sections/partner-catalog-section";
import PartnershipStrengths from "@/components/sections/partnership-strengths-section";
import PartnerFaqSection from "@/components/sections/partner-faq-section";
import GlobalPartnersCtaSection from "@/components/sections/global-partners-cta-section";
import { globalPartnersMetadata } from "@/lib/global-partners-sections";

export const metadata: Metadata = {
  title: globalPartnersMetadata.title,
  description: globalPartnersMetadata.description,
  openGraph: globalPartnersMetadata.openGraph,
};

/**
 * /global-partners
 *
 * The hero, the client logo wall, the partnership strengths and the closing call
 * to action are static and read from `lib/global-partners-sections`. Only the FAQ
 * band is database-driven, rendered by `PartnerFaqSection` from `getPublicFaqs` —
 * a Server Component never calls our own API — and it disappears entirely when no
 * question is active.
 *
 * The site layout is already `force-dynamic`, so an admin FAQ save is visible on
 * the next request rather than being baked into a build.
 */
export default function GlobalPartnersPage() {
  return (
    <>
      <GlobalPartnersHero />

      <PartnerCatalog />

      <PartnershipStrengths />

      <PartnerFaqSection />

      <GlobalPartnersCtaSection />
    </>
  );
}
