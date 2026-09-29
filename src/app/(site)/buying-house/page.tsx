import type { Metadata } from "next";
import PageHero from "@/components/common/page-hero";
import BuyingHouseServicesSection from "@/components/sections/buying-house-services-section";
import ProductsSection from "@/components/products/products-section";
import BuyingHouseCtaSection from "@/components/sections/buying-house-cta-section";
import { getProductCatalog } from "@/services/products";
import { buyingHouseContent, buyingHouseMetadata } from "@/lib/buying-house-sections";

export const metadata: Metadata = {
  title: buyingHouseMetadata.title,
  description: buyingHouseMetadata.description,
  openGraph: buyingHouseMetadata.openGraph,
};

/**
 * /buying-house
 *
 * The hero, the services band and the closing call to action are static and read
 * from `lib/buying-house-sections`. Only the Products band is database-driven:
 * it is rendered from `getProductCatalog`, which reads the published catalogue
 * directly from the service — a Server Component never calls our own API — and
 * has already dropped every inactive or empty branch.
 *
 * The site layout is already `force-dynamic`, so the catalogue is never baked
 * into a build and an admin save is visible on the next request.
 */
export default async function BuyingHousePage() {
  const catalog = await getProductCatalog();

  return (
    <>
      <PageHero
        id="buying-house-hero-heading"
        image={buyingHouseContent.hero.image}
        title={buyingHouseContent.hero.title}
        subtitle={buyingHouseContent.hero.subtitle}
        breadcrumbLabel={buyingHouseContent.hero.breadcrumbLabel}
      />

      <BuyingHouseServicesSection />

      <ProductsSection catalog={catalog} />

      <BuyingHouseCtaSection />
    </>
  );
}
