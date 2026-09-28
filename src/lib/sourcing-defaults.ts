import type { SourcingSettings } from "@/types/sourcing";

export const defaultSourcingSettings: SourcingSettings = {
  eyebrow: "PRODUCTS",
  heading: "What we source",
  description: "Core categories with flexible customization, fabrics, trims, packaging, and compliance requirements.",
  ctaText: "Explore our catalog",
  ctaHref: "/buying-house",
};

export const initialSourcingCategories = [
  { slug: "knitwear", title: "Knitwear", description: "T-shirts, polos, hoodies, jersey knitwear, and activewear.", imageUrl: "/sourcing/knitwear.jpg", imageAlt: "Knitwear apparel" },
  { slug: "woven", title: "Woven", description: "Oxford shirts, chinos, blazers, and formal woven garments.", imageUrl: "/sourcing/woven.jpg", imageAlt: "Close-up of woven flannel shirt fabric" },
  { slug: "denim", title: "Denim", description: "Raw indigo denim, trucker jackets, jeans, and denim shorts.", imageUrl: "/sourcing/denim.jpg", imageAlt: "Assorted denim jeans hanging in a store" },
  { slug: "sweaters", title: "Sweaters", description: "Cardigans, pullovers, and seasonal knit sweaters.", imageUrl: "/sourcing/sweaters.jpg", imageAlt: "Selection of knit sweaters" },
] as const;

