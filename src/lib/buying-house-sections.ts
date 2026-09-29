import { sourcingSolutions } from "@/lib/homepage-sections";

export const buyingHouseMetadata = {
  title: "Buying House Services | Alliance Sourcing BD",
  description:
    "Professional buying house services including product sampling, supplier selection, price negotiation, and quality inspection.",
  openGraph: {
    title: "Professional Buying & Sourcing Services",
    description:
      "We manage every step of your sourcing journey with precision and excellence.",
  },
};

export const buyingHouseContent = {
  hero: {
    title: "Professional Sourcing Services",
    subtitle:
      "State-of-the-art facilities meeting the highest global ethical and quality standards through innovation and precision. Your premier partner in seamless garments manufacturing and apparels sourcing.",
    image:
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/3105a5e1e47bd6c51724d9ef89fd867243462197-jU21omSUdf2kP7KEQVK23sTylm4Hqd.jpg",
    breadcrumbLabel: "Buying House Services",
  },

  /**
   * The live page's services band repeats "Buying house services" as both the
   * eyebrow and the heading. The six entries themselves are the same buying
   * house services the homepage already documents, so they are read from
   * `homepage-sections` rather than restated here and left to drift.
   */
  services: {
    eyebrow: "Buying house services",
    heading: "Buying house services",
    description: "We manage every step of your sourcing journey with precision",
    items: sourcingSolutions.items,
  },

  products: {
    heading: "Products",
    description:
      "Explore our wide range of high-quality products across different categories and subcategories.",
  },

  cta: {
    heading: "Ready to start sourcing?",
    description:
      "Let us help you find the perfect manufacturing partners for your apparel needs",
    image:
      "https://i.postimg.cc/3NcsYzxX/multi-colored-garments-hanging-coathangers-boutique-store-generated-by-ai.jpg",
  },
};

export type BuyingHouseService = (typeof buyingHouseContent.services.items)[number];
