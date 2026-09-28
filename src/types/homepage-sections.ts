/**
 * Types for the static lower-homepage sections.
 *
 * These sections are plain local content: no models, no API routes, no admin
 * editors. The shapes below only exist so the data in `lib/homepage-sections.ts`
 * stays typed and the components that render it can stay presentational.
 */

/** Which lucide glyph a card or tile draws. Resolved by `components/common/section-icon.tsx`. */
export type HomepageIconKey =
  | "sampling"
  | "supplier"
  | "negotiation"
  | "inspection"
  | "compliance"
  | "shipping"
  | "knitwear"
  | "denim"
  | "woven"
  | "accessories"
  | "production"
  | "maintenance"
  | "machinery"
  | "optimization";

/** A "What sets us apart" feature card. `icon` is a bundled file in `public/icons`. */
export type SetsUsApartFeature = {
  id: string;
  title: string;
  description: string;
  icon: string;
  /** `alt` for the decorative icon. Empty means the image is purely decorative. */
  iconAlt: string;
};

/** A titled paragraph inside one of the two supporting panels. */
export type SetsUsApartPoint = {
  id: string;
  title: string;
  description: string;
};

export type SetsUsApartPanel = {
  eyebrow: string;
  heading: string;
  description: string;
  points: SetsUsApartPoint[];
  /** The eyebrow above the flat checklist, e.g. "Bangladesh advantages". */
  checklistEyebrow: string;
  checklist: { id: string; label: string }[];
};

export type HowWeWorkStep = {
  id: string;
  title: string;
  description: string;
};

export type HowWeWork = {
  eyebrow: string;
  heading: string;
  cta: { label: string; href: string };
  steps: HowWeWorkStep[];
};

export type FeatureItem = {
  id: string;
  title: string;
  description: string;
};

export type BuyingHouse = {
  eyebrow: string;
  heading: string;
  description: string;
  image: string;
  imageAlt: string;
  /** `left` keeps the reference's image-then-text order; `right` mirrors it. */
  imagePosition: "left" | "right";
  features: FeatureItem[];
};

export type SourcingSolution = {
  id: string;
  title: string;
  description: string;
  /**
   * The reference's real service-card artwork, bundled in
   * `public/icons/buying-house-services`. Not a lucide glyph: the original
   * cards use 512x512 transparent PNGs, not line icons.
   */
  icon: string;
};

export type SourcingSolutions = {
  eyebrow: string;
  heading: string;
  description: string;
  items: SourcingSolution[];
};

/** Shared by Products & Services and Factory & Machinery capabilities. */
export type CatalogCategory = {
  id: string;
  title: string;
  description: string;
  icon: HomepageIconKey;
};

export type SplitFeatureSection = {
  eyebrow: string;
  heading: string;
  description: string;
  image: string;
  imageAlt: string;
  imagePosition: "left" | "right";
  /** `true` for a soft tinted band instead of plain white. */
  tinted: boolean;
  cta: { label: string; href: string };
  categories: CatalogCategory[];
};
