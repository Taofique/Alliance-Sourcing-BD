import FaqAccordion from "@/components/common/faq-accordion";
import { globalPartnersContent } from "@/lib/global-partners-sections";
import { getPublicFaqs } from "@/services/faq";

/**
 * The FAQ band on /global-partners.
 *
 * Ported from the reference `PartnerFAQ`, but database-driven: the eight entries
 * that repo hardcodes are seeded instead and read through `getPublicFaqs`, so the
 * copy is editable from the admin without a deploy.
 *
 * With no active entries the entire section is omitted — heading included —
 * rather than publishing an empty band. When entries do exist they are also
 * published as `FAQPage` structured data, which the reference does not do.
 */
export default async function PartnerFaqSection() {
  const { heading, description } = globalPartnersContent.faq;
  const faqs = await getPublicFaqs();

  if (faqs.length === 0) {
    return null;
  }

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  };

  return (
    <section aria-labelledby="global-partners-faq-heading" className="bg-[#F3F4F6] py-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <div className="mx-auto max-w-4xl px-4">
        <div className="mb-12 text-center">
          <h2
            id="global-partners-faq-heading"
            className="mb-4 text-3xl font-bold text-slate-900 md:text-5xl"
          >
            {heading}
          </h2>
          <p className="text-lg text-slate-600">{description}</p>
        </div>

        <FaqAccordion faqs={faqs} />
      </div>
    </section>
  );
}
