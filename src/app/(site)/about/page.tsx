import type { Metadata } from "next";
import AboutHeroSection from "@/components/sections/about-hero-section";
import AboutLegacySection from "@/components/sections/about-legacy-section";
import SetsUsApartSection from "@/components/sections/sets-us-apart-section";
import HowWeWorkSection from "@/components/sections/how-we-work-section";
import FooterCtaSection from "@/components/sections/footer-cta-section";
import { getPageBanner } from "@/services/page-banners";

export const metadata: Metadata = {
  title: "About Alliance Sourcing BD",
  description:
    "Our story since 2007, the values behind our sourcing, and how we work with brands and manufacturers.",
  openGraph: {
    title: "About Alliance Sourcing BD",
    description:
      "Professional buying and sourcing services with decades of collective expertise.",
  },
};

/**
 * About-specific copy for the closing band. `imageUrl: null` reuses the
 * bundled `/footer-cta.webp`, so the About page gets the same cover
 * photograph treatment the homepage uses without a second upload.
 */
const ABOUT_CTA = {
  heading: "Ready to partner with us?",
  description: "Let's discuss how we can help bring your vision to life",
  buttonText: "Contact Us",
  buttonHref: "/contact",
  imageUrl: null,
};

/**
 * /about
 *
 * Three of the five blocks are the same components the homepage already ships,
 * imported rather than forked:
 *
 *   - SetsUsApartSection  four feature cards plus the "What makes us different"
 *                         and "Best for" panels, including "Bangladesh advantages"
 *   - HowWeWorkSection    the four ordered process steps
 *   - FooterCtaSection    the closing cover-photograph band
 *
 * All three read their copy from `lib/homepage-sections.ts`, so About and the
 * homepage cannot drift apart. Only the intro and the founding story are
 * About-specific. The founding story is fully static; the intro cover
 * photograph is the one editable part of the page, and it is read from the
 * page's own `page_banners` document rather than from the site-wide settings.
 *
 * The header, footer and branded loader come from `(site)/layout.tsx`, which is
 * why the footer is not repeated here.
 */
export default async function AboutPage() {
  const banner = await getPageBanner("about");

  return (
    <>
      <AboutHeroSection imageUrl={banner.image?.imageUrl ?? null} />
      <AboutLegacySection />

      {/* Reused verbatim from the landing page. */}
      <SetsUsApartSection />
      <HowWeWorkSection />

      {/* Reused with About-specific copy. */}
      <FooterCtaSection content={ABOUT_CTA} />
    </>
  );
}
