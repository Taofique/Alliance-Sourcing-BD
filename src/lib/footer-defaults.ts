import type { SiteFooter, SiteFooterCta } from "@/types/site-settings";

/**
 * Defaults for documents saved before the footer and footer-CTA editors
 * existed. `getPublicSiteSettings` merges these in, so an old record renders
 * exactly like a new one and no migration is ever required.
 *
 * They are also what the idempotent init script writes, which means the admin
 * forms and the public components always see the same shape.
 */

export const FOOTER_CTA_FOLDER = "alliance-sourcing-bd/footer-cta";

/**
 * The reference homepage CTA photograph, stored locally so the section never
 * depends on a third-party host. Only used when no Cloudinary image has been
 * uploaded; the gradient underneath stays visible if this file is removed.
 */
export const FOOTER_CTA_FALLBACK_IMAGE = "/footer-cta.webp";

export const defaultSiteFooter: SiteFooter = {
  brandDescription:
    "Your premier partner in seamless garment sourcing and social manufacturing excellence.",
  address: "",
  emails: [],
  quickLinks: [
    { id: "link-home", label: "Home", href: "/" },
    { id: "link-about", label: "About Us", href: "/about" },
    {
      id: "link-factory",
      label: "Factory & Machinery",
      href: "/factory-machinery",
    },
    { id: "link-sister", label: "Sister Concern", href: "/buying-house" },
    { id: "link-partners", label: "Global Partners", href: "/global-partners" },
    { id: "link-contact", label: "Contact Us", href: "/contact" },
  ],
  socials: [],
  whatsappNumber: "",
  whatsappMessage: "Hello Alliance Sourcing BD",
  copyrightOwner: "Alliance Sourcing BD",
  legalLinks: [],
  attribution: null,
};

export const defaultSiteFooterCta: SiteFooterCta = {
  enabled: true,
  heading: "Ready to start sourcing?",
  description:
    "Let us help you find the perfect manufacturing partners for your apparel needs.",
  buttonText: "Contact Us",
  buttonHref: "/contact",
  image: null,
};
