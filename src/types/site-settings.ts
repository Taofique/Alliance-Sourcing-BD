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

export type PublicSiteSettings = {
  contact: SiteContact;
  logos: SiteLogo[];
};
