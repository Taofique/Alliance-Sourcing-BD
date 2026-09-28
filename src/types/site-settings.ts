export type SiteContact = {
  phones: {
    label: string;
    href: string;
  }[];
  topBarEmails: string[];
};

export type SiteLogo = {
  key: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  publicId: string | null;
};

/** The fixed set of social platforms the footer can render. */
export const FOOTER_SOCIAL_PLATFORMS = [
  "facebook",
  "instagram",
  "linkedin",
  "youtube",
  "x",
] as const;

export type FooterSocialPlatform = (typeof FOOTER_SOCIAL_PLATFORMS)[number];

export type FooterLink = {
  id: string;
  label: string;
  href: string;
};

export type FooterSocial = {
  platform: FooterSocialPlatform;
  href: string;
};

/**
 * Everything the public footer needs. `emails` holds only the ADDITIONAL
 * addresses: the two header emails live in `contact.topBarEmails` and are never
 * duplicated here. `getPublicSiteSettings` merges and deduplicates them.
 */
export type SiteFooter = {
  brandDescription: string;
  address: string;
  emails: string[];
  quickLinks: FooterLink[];
  socials: FooterSocial[];
  whatsappNumber: string;
  whatsappMessage: string;
  copyrightOwner: string;
  legalLinks: FooterLink[];
  attribution: FooterLink | null;
};

export type SiteFooterCtaImage = {
  imageUrl: string;
  publicId: string;
};

export type SiteFooterCta = {
  enabled: boolean;
  heading: string;
  description: string;
  buttonText: string;
  buttonHref: string;
  image: SiteFooterCtaImage | null;
};

export type PublicSiteSettings = {
  contact: SiteContact;
  logos: SiteLogo[];
  footer: SiteFooter;
  footerCta: SiteFooterCta;
};
