import type { FaqInput } from "@/types/faq";

/**
 * The eight questions /global-partners ships with, in published order.
 *
 * These are the entries the live page already shows, so a fresh database reads
 * exactly like production. `init-faqs` inserts only what is missing, so re-running
 * it never overwrites edited copy.
 */
export const initialFaqs: FaqInput[] = [
  {
    question: "What types of garments do you manufacture?",
    answer:
      "We specialize in a wide range of garments including knitwear, woven items, denim, and specialized sportswear, collaborating with top-tier manufacturers in Bangladesh.",
    sortOrder: 0,
    isActive: true,
  },
  {
    question: "What is your minimum order quantity (MOQ)?",
    answer:
      "Our MOQs vary depending on the product type and complexity. Typically, it ranges from 500 to 1000 pieces per style.",
    sortOrder: 1,
    isActive: true,
  },
  {
    question: "How long does production typically take?",
    answer:
      "Standard production lead time is 60-90 days after PP sample approval, depending on fabric sourcing and order volume.",
    sortOrder: 2,
    isActive: true,
  },
  {
    question: "Do you offer sample production before bulk orders?",
    answer:
      "Yes, we provide proto samples and size sets to ensure the design and fit meet your requirements before proceeding to bulk production.",
    sortOrder: 3,
    isActive: true,
  },
  {
    question: "What quality control measures do you have in place?",
    answer:
      "We have an independent QC team that conducts inline, mid-line, and final inspections following AQL 2.5 standards.",
    sortOrder: 4,
    isActive: true,
  },
  {
    question: "Are your facilities certified for ethical and sustainable production?",
    answer:
      "Absolutely. All our partner factories are BSCI, SEDEX, or WRAP certified, ensuring high ethical and environmental standards.",
    sortOrder: 5,
    isActive: true,
  },
  {
    question: "How do you handle shipping and logistics?",
    answer:
      "We offer various shipping terms including FOB, CIF, and DDP, and we coordinate closely with freight forwarders for timely delivery.",
    sortOrder: 6,
    isActive: true,
  },
  {
    question: "What payment terms do you offer?",
    answer:
      "Commonly we work with 100% L/C at sight or T/T payments, depending on the partnership length and volume.",
    sortOrder: 7,
    isActive: true,
  },
];
