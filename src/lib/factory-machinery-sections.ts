/**
 * Static copy and bundled assets for /factory-machinery.
 *
 * Everything here is fixed content with no CMS surface, exactly as specified:
 * the banner, the headings, the "Own Factory" text, the machinery highlights and
 * the closing call to action are all in code. The only editable part of the page
 * is the machinery inventory and the factory profile PDF, and both come from
 * their own editors.
 *
 * The one exception to "static" is the pair of PDF buttons in "Own Factory":
 * their target is the admin-managed document, so the labels live here while the
 * href is supplied at render time.
 */
export const factoryMachineryContent = {
  hero: {
    image: "/factory-machinery-banner.JPG",
    title: "Our Manufacturing Excellence",
    subtitle:
      "State-of-the-art facilities meeting the highest global ethical and quality standards through innovation and precision",
    breadcrumbLabel: "Factory & Machinery",
  },

  ownFactory: {
    heading: "Own Factory",
    subheading: "The Ways to Keep Business Growing Since 2007",
    description:
      "Are you interested to know details about our factory, production system and company policy at a glance? Please have a look at the provided pdf file.",
    actions: [
      { label: "Download PDF", download: true },
      { label: "View PDF", download: false },
    ],
  },

  advancedMachinery: {
    heading: "Advanced Machinery",
    subtitle:
      "We invest in the latest industry 4.0 technology to reduce waste and maximize efficiency",
    features: [
      {
        title: "Thread Sucking Machine",
        image: "/thread-sucking-machine.png",
        imageAlt: "Thread sucking machine",
      },
      {
        title: "Needle Detector Machine",
        image: "/needle-detector-machine.JPG",
        imageAlt: "Needle detector machine",
      },
    ],
  },

  inventory: {
    heading: "Our Machinery Inventory",
    /** Shown only when the database has no categories to publish yet. */
    emptyMessage:
      "Our machinery inventory is being updated. Please check back shortly.",
  },

  cta: {
    heading: "Interested in our capabilities?",
    text: "Let's discuss your manufacturing needs and how we can help",
    actionLabel: "Contact Us",
    actionHref: "/contact",
  },
} as const;

export const factoryMachineryMetadata = {
  title: "Factory & Machinery | Alliance Sourcing BD",
  description:
    "Our own garment factory, advanced industry 4.0 machinery, and a full inventory of cutting, sewing, finishing and embroidery machines with quantities.",
} as const;
