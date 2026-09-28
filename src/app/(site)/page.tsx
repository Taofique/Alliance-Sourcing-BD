import StatusSection from "@/components/sections/status-section";
import SourcingSection from "@/components/sections/sourcing-section";
import SetsUsApartSection from "@/components/sections/sets-us-apart-section";
import HowWeWorkSection from "@/components/sections/how-we-work-section";
import BuyingHouseSection from "@/components/sections/buying-house-section";
import SourcingSolutionsSection from "@/components/sections/sourcing-solutions-section";
import ProductsServicesSection from "@/components/sections/products-services-section";
import FactoryMachinerySection from "@/components/sections/factory-machinery-section";
import { getSourcingCategories, getSourcingSettings } from "@/services/sourcing";
import BannerCarousel from "@/components/sections/banner-carousel";
import FooterCtaSection from "@/components/sections/footer-cta-section";
import { getPublishedBanners } from "@/services/banners";
import { getPublicSiteSettings } from "@/services/site-settings";

export default async function HomePage() {
  // Read straight from the service: a Server Component never calls our own API.
  // The layout has already read the settings for the header, footer and loader;
  // the homepage reads again only for the CTA section it alone renders.
  const [slides, settings, categories, sourcingSettings] = await Promise.all([
    getPublishedBanners(),
    getPublicSiteSettings(),
    getSourcingCategories(),
    getSourcingSettings(),
  ]);

  return (
    <>
      <section aria-label="Alliance Sourcing BD">
        <BannerCarousel slides={slides} />
      </section>
      <div className="bg-gray-50/50">
        <StatusSection overlap={slides.length > 0} />
        <SourcingSection categories={categories} settings={sourcingSettings} />
      </div>

      {/*
        Everything below is static: the copy lives in `lib/homepage-sections.ts`
        and the images are bundled in `public/`, so none of it touches the CMS.
      */}
      <SetsUsApartSection />
      <HowWeWorkSection />
      <BuyingHouseSection />
      <SourcingSolutionsSection />
      <ProductsServicesSection />
      <FactoryMachinerySection />

      {/*
        Homepage only, for now. FooterCtaSection takes all of its content as
        props, so the same component can be dropped onto other pages later
        without any change to this one.
      */}
      {settings.footerCta.enabled && (
        <FooterCtaSection
          content={{
            heading: settings.footerCta.heading,
            description: settings.footerCta.description,
            buttonText: settings.footerCta.buttonText,
            buttonHref: settings.footerCta.buttonHref,
            imageUrl: settings.footerCta.image?.imageUrl ?? null,
          }}
        />
      )}
    </>
  );
}
