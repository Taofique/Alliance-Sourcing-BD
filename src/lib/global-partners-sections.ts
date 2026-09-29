/**
 * The static half of /global-partners.
 *
 * The hero, the partner logo wall, the partnership strengths and the closing call
 * to action are all fixed copy, so they live here rather than in the database.
 * Only the FAQ band is database-driven — see `services/faq`.
 *
 * Every string is taken verbatim from the live page, and the partner logos are
 * the ten already present in `public/icons/logos`.
 */

export const globalPartnersMetadata = {
  /*
   * The root layout already appends "| Alliance Sourcing BD" to every page
   * title, so this carries the page name only. Repeating the brand here would
   * render "Global Partners | Alliance Sourcing BD | Alliance Sourcing BD".
   */
  title: "Global Partners",
  description:
    "Meet the international fashion brands that manufacture with Alliance Sourcing BD, and learn how we build long-term partnerships across the USA, Europe and Japan.",
  openGraph: {
    title: "Our Global Partners",
    description:
      "We connect global fashion brands with top Bangladeshi manufacturers, built on a decade of transparency and quality.",
  },
};

export const globalPartnersContent = {
  hero: {
    title: "Our Global Partners",
    subtitle:
      "We connect global fashion brands with top Bangladeshi manufacturers, built on a decade of transparency and quality.",
    image: "/globalNetwork.png",
    breadcrumbLabel: "Global Partners",
    stats: [
      { value: "03+", label: "Regions" },
      { value: "40+", label: "Global Clients" },
      { value: "09+", label: "Years" },
    ],
  },

  partners: {
    heading: "Explore Our Partners",
    description:
      "Alliance Sourcing BD links international clients with reliable production in Bangladesh, driven by trust, compliance, and efficiency.",
    /**
     * The filter order is fixed and the logos are grouped by region so the tab
     * and the grid can never disagree about a partner's region.
     */
    regions: ["All Clients", "USA", "Europe", "Japan"],
    clients: [
      { name: "Forever 21", logo: "/icons/logos/forever21.png", region: "USA" },
      { name: "Buckle", logo: "/icons/logos/buckle.png", region: "USA" },
      { name: "Country Boy", logo: "/icons/logos/logo-red.png", region: "Europe" },
      { name: "SELECT", logo: "/icons/logos/select.png", region: "Europe" },
      { name: "Whispering Smith", logo: "/icons/logos/whispering.png", region: "Europe" },
      { name: "Moririn", logo: "/icons/logos/moririn.png", region: "Japan" },
      { name: "Teijin Frontier", logo: "/icons/logos/teijin.png", region: "Japan" },
      { name: "H HOPE", logo: "/icons/logos/hope.png", region: "Japan" },
      { name: "YOGI", logo: "/icons/logos/yogi.png", region: "Japan" },
      { name: "Aeon", logo: "/icons/logos/aeon.png", region: "Japan" },
    ],
  },

  strengths: {
    heading: "What Makes Our Partnerships Strong",
    description:
      "Our commitment to excellence goes beyond manufacturing. We build partnerships on trust, transparency, and shared success.",
  },

  faq: {
    heading: "Frequently Asked Questions",
    description: "Everything you need to know about partnering with Alliance Sourcing BD",
  },

  cta: {
    heading: "Become Our Partner",
    description:
      "Scaling your supply chain starts with the right alliance. Let's discuss your next collection.",
    image:
      "https://i.postimg.cc/3NcsYzxX/multi-colored-garments-hanging-coathangers-boutique-store-generated-by-ai.jpg",
  },
};

/** One partner region, used to key the catalogue filter. */
export type PartnerRegion = (typeof globalPartnersContent.partners.regions)[number];

export type PartnerClient = (typeof globalPartnersContent.partners.clients)[number];

/**
 * The five partnership strengths, in the order the live page lists them.
 *
 * The icon is kept as a key rather than an element so this module stays a plain
 * data file that a Server Component can read, and the icons themselves are
 * resolved once by the section that renders the cards.
 */
export const partnershipStrengths = [
  {
    title: "Long-term collaboration approach",
    description: "Building lasting relationships that grow stronger with every collection",
    icon: "trending-up",
  },
  {
    title: "Transparent communication",
    description: "Clear, honest dialogue at every stage of production",
    icon: "message-square",
  },
  {
    title: "Strong quality control system",
    description: "Rigorous standards ensuring excellence in every garment",
    icon: "shield-check",
  },
  {
    title: "On-time delivery commitment",
    description: "Meeting deadlines consistently to keep your business running smoothly",
    icon: "clock",
  },
  {
    title: "Ethical and sustainable sourcing",
    description: "Responsible practices that protect people and planet",
    icon: "leaf",
  },
] as const satisfies readonly {
  title: string;
  description: string;
  icon: string;
}[];
