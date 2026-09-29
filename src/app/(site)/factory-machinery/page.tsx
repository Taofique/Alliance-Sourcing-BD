import type { Metadata } from "next";
import PageHero from "@/components/common/page-hero";
import CTASection from "@/components/common/cta-section";
import OwnFactorySection from "@/components/machinery/own-factory-section";
import AdvancedMachinerySection from "@/components/machinery/advanced-machinery-section";
import MachineryInventorySection from "@/components/machinery/machinery-inventory-section";
import { getFactoryPdf, getMachineryInventory } from "@/services/machinery";
import { factoryPdfDeliveryUrl } from "@/lib/cloudinary";
import {
  factoryMachineryContent,
  factoryMachineryMetadata,
} from "@/lib/factory-machinery-sections";

export const metadata: Metadata = {
  title: factoryMachineryMetadata.title,
  description: factoryMachineryMetadata.description,
  openGraph: {
    title: factoryMachineryMetadata.title,
    description: factoryMachineryMetadata.description,
  },
};

/**
 * /factory-machinery
 *
 * The four static sections are rendered from `lib/factory-machinery-sections`
 * and the bundled photographs, so they need no database at all. Only the
 * inventory table and the factory profile document are read from the database,
 * and both are read directly from the service — a Server Component never calls
 * our own API.
 *
 * The site layout is already `force-dynamic`, so the inventory and the totals
 * are never baked into a build.
 */
export default async function FactoryMachineryPage() {
  const [inventory, pdf] = await Promise.all([
    getMachineryInventory(),
    getFactoryPdf(),
  ]);

  /*
   * Two links, two reasons. "View" goes straight to Cloudinary because a
   * signed url is enough to display the file. "Download" goes through our own
   * route because the browser ignores `download` on a cross-origin link, and
   * because the stored file name can only be set in a header we control. The
   * url is signed per request rather than read from the database, so the page
   * keeps working if anonymous delivery of raw assets is ever switched off.
   */
  const ownFactory = pdf
    ? {
        fileName: pdf.fileName,
        viewUrl: factoryPdfDeliveryUrl(pdf.publicId),
        downloadUrl: "/api/machinery/factory-pdf/download",
      }
    : null;

  return (
    <>
      <PageHero
        id="factory-machinery-hero-heading"
        image={factoryMachineryContent.hero.image}
        title={factoryMachineryContent.hero.title}
        subtitle={factoryMachineryContent.hero.subtitle}
        breadcrumbLabel={factoryMachineryContent.hero.breadcrumbLabel}
      />

      <OwnFactorySection pdf={ownFactory} />

      <AdvancedMachinerySection />

      <MachineryInventorySection inventory={inventory} />

      <CTASection
        id="factory-machinery-cta-heading"
        heading={factoryMachineryContent.cta.heading}
        text={factoryMachineryContent.cta.text}
        actionLabel={factoryMachineryContent.cta.actionLabel}
        actionHref={factoryMachineryContent.cta.actionHref}
      />
    </>
  );
}
