import type {
  BuyingHouse,
  HowWeWork,
  SetsUsApartFeature,
  SetsUsApartPanel,
  SourcingSolutions,
  SplitFeatureSection,
} from "@/types/homepage-sections";

/**
 * Static content for the six lower homepage sections.
 *
 * The reference site served all of this from its admin API. These sections are
 * deliberately static here, so the copy below is the single source of truth and
 * nothing in it needs a model, a route or an editor.
 *
 * Section images are the bundled files in `public/`. Feature-card icons are the
 * four supplied SVGs in `public/icons`; anything that needs a glyph the bundle
 * does not ship uses a lucide icon resolved by `components/common/section-icon`.
 */

/* ── What sets us apart ──────────────────────────────────── */

export const setsUsApart: {
  eyebrow: string;
  heading: string;
  features: SetsUsApartFeature[];
  panels: SetsUsApartPanel[];
} = {
  eyebrow: "Why",
  heading: "What sets us apart",
  features: [
    {
      id: "quality-assurance",
      title: "Quality assurance",
      description: "Rigorous testing at every production stage",
      icon: "/icons/high_quality.svg",
      iconAlt: "",
    },
    {
      id: "ethical-sourcing",
      title: "Ethical sourcing",
      description: "Fair wages and safe working conditions",
      icon: "/icons/payments.svg",
      iconAlt: "",
    },
    {
      id: "on-time-delivery",
      title: "On-time delivery",
      description: "Your deadlines are our commitments",
      icon: "/icons/airware.svg",
      iconAlt: "",
    },
    {
      id: "global-network",
      title: "Global network",
      description: "Connected across Bangladesh and beyond",
      icon: "/icons/globe.svg",
      iconAlt: "",
    },
  ],
  panels: [
    {
      eyebrow: "What makes us different",
      heading: "",
      description: "",
      points: [
        {
          id: "local-presence",
          title: "Local presence in Bangladesh",
          description:
            "We communicate directly with factories and monitor details that matter.",
        },
        {
          id: "verified-network",
          title: "Verified supplier network",
          description:
            "We shortlist manufacturers based on capability, quality, and reliability.",
        },
        {
          id: "quality-first",
          title: "Quality-first process",
          description:
            "Sampling + inspections reduce defects and protect your brand reputation.",
        },
      ],
      checklistEyebrow: "",
      checklist: [],
    },
    {
      eyebrow: "Best for",
      heading: "Brands that want smooth sourcing, without surprises",
      description:
        "If you need a dependable partner to manage product development, factory coordination, QC, and shipment support, this is built for you.",
      points: [],
      checklistEyebrow: "Bangladesh advantages",
      checklist: [
        {
          id: "ecosystem",
          label: "Strong garment & textile manufacturing ecosystem",
        },
        {
          id: "pricing",
          label: "Competitive pricing with scalable production capacity",
        },
        {
          id: "compliance",
          label: "Improving compliance focus and modern facilities",
        },
        {
          id: "range",
          label: "Flexible product range across apparel and home textiles",
        },
      ],
    },
  ],
};

/* ── How we work ─────────────────────────────────────────── */

export const howWeWork: HowWeWork = {
  eyebrow: "Process",
  heading: "How we work",
  cta: { label: "Discuss", href: "/contact" },
  steps: [
    {
      id: "consultation",
      title: "Consultation",
      description: "We listen to your needs and understand your specifications",
    },
    {
      id: "supplier-match",
      title: "Supplier match",
      description: "We match you with manufacturers who meet your standards",
    },
    {
      id: "order-management",
      title: "Order management",
      description: "We negotiate terms and oversee production from start to finish",
    },
    {
      id: "quality-check",
      title: "Quality check",
      description:
        "Every batch is tested against your specifications and standards",
    },
  ],
};

/* ── Professional buying house services ──────────────────── */

export const buyingHouse: BuyingHouse = {
  eyebrow: "Buying house",
  heading: "Professional buying house services",
  description:
    "Founded with a vision to revolutionize the apparel industry, Alliance Sourcing BD has grown into a leading partner in garment sourcing. With decades of collective expertise, we bridge the gap between world-class brands and high-quality manufacturing units in Bangladesh and beyond. Our journey is defined by a relentless pursuit of excellence, ethical practices, and a deep understanding of the fast-evolving fashion landscape.",
  image: "/professional-buying-house-static-image.jpg",
  imageAlt:
    "Sourcing specialists reviewing garment samples at a buying house table",
  imagePosition: "left",
  features: [
    {
      id: "product-development",
      title: "Product development and sampling",
      description:
        "We create and refine product designs, developing samples to ensure quality, functionality, and alignment with client requirements.",
    },
    {
      id: "supplier-selection",
      title: "Supplier selection and evaluation",
      description:
        "We identify reliable suppliers and assess them based on quality, cost, and performance to ensure consistent and trustworthy sourcing.",
    },
    {
      id: "price-negotiation",
      title: "Price negotiation and order placement",
      description:
        "We negotiate competitive pricing with suppliers and manage order placement efficiently to ensure cost-effectiveness and timely delivery.",
    },
  ],
};

/* ── End-to-end sourcing solutions ───────────────────────── */

export const sourcingSolutions: SourcingSolutions = {
  eyebrow: "Buying house services",
  heading: "End-to-end sourcing solutions",
  description: "We manage every step of your sourcing journey with precision",
  items: [
    {
      id: "development-sampling",
      title: "Product development & sampling",
      description:
        "We create samples that perfectly match your vision, ensuring precision, quality, and attention to every detail.",
      icon: "sampling",
    },
    {
      id: "supplier-evaluation",
      title: "Supplier selection & evaluation",
      description:
        "We find reliable manufacturers meeting your standards, ensuring quality, consistency, and excellence.",
      icon: "supplier",
    },
    {
      id: "negotiation-placement",
      title: "Price negotiation & order placement",
      description:
        "We secure the best terms for your orders, ensuring competitive pricing, favorable conditions, and smooth transactions.",
      icon: "negotiation",
    },
    {
      id: "follow-up-inspection",
      title: "Production follow-up & quality inspection",
      description:
        "We monitor every batch from loom to shipment, ensuring consistent quality, accuracy, and timely delivery.",
      icon: "inspection",
    },
    {
      id: "compliance-assistance",
      title: "Compliance assistance",
      description:
        "We work with factories aligned with international buyer standards and ethical practices.",
      icon: "compliance",
    },
    {
      id: "shipping-coordination",
      title: "Shipping coordination",
      description:
        "Documentation support and shipment coordination with partners for smooth delivery.",
      icon: "shipping",
    },
  ],
};

/* ── Products & services ─────────────────────────────────── */

export const productsAndServices: SplitFeatureSection = {
  eyebrow: "Catalog",
  heading: "Products and services",
  description:
    "We source and manage everything you need for apparel production. From raw materials to finished goods, we handle it all.",
  image: "/products-services-static-image.png",
  imageAlt: "Sorted apparel and accessories prepared for sampling",
  imagePosition: "left",
  tinted: true,
  cta: { label: "Browse", href: "/buying-house" },
  categories: [
    {
      id: "knitwear",
      title: "Knitwear",
      description: "Sweaters, t-shirts, and knit garments made to order.",
      icon: "knitwear",
    },
    {
      id: "heavy-fabrics",
      title: "Denim and heavy fabrics",
      description: "Durable denim and canvas for pants and jackets.",
      icon: "denim",
    },
    {
      id: "woven-fabrics",
      title: "Woven fabrics",
      description: "Cotton, blends, and specialty woven materials in stock.",
      icon: "woven",
    },
    {
      id: "accessories-trims",
      title: "Accessories and trims",
      description: "Buttons, zippers, labels, and finishing materials available.",
      icon: "accessories",
    },
  ],
};

/* ── Factory and machinery capabilities ──────────────────── */

export const factoryAndMachinery: SplitFeatureSection = {
  eyebrow: "Catalog",
  heading: "Factory and machinery capabilities",
  description:
    "We work with modern facilities equipped for precision production. Our network includes mills and factories with the latest technology.",
  // The filename really is spelled "machinary" in the bundle; keep it verbatim.
  image: "/factory-machinary-static-image.png",
  imageAlt: "Machinery on a garment factory floor",
  imagePosition: "right",
  tinted: false,
  cta: { label: "Details", href: "/factory-machinery" },
  categories: [
    {
      id: "production-support",
      title: "Garment production support",
      description: "Full-scale manufacturing with quality control at each stage.",
      icon: "production",
    },
    {
      id: "maintenance-support",
      title: "Maintenance and technical support",
      description: "Our team keeps machines running smoothly year-round.",
      icon: "maintenance",
    },
    {
      id: "machinery-supply",
      title: "Machinery supply and installation",
      description: "We source and install equipment tailored to your needs.",
      icon: "machinery",
    },
    {
      id: "production-optimization",
      title: "Production optimization",
      description: "We improve efficiency and reduce waste on every line.",
      icon: "optimization",
    },
  ],
};
