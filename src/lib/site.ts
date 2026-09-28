export type SiteContact = {
  phones: {
    label: string;
    href: string;
  }[];
  topBarEmails: string[];
};

// Temporary data until we connect MongoDB.
export const siteContact: SiteContact = {
  phones: [
    {
      label: "+880 1972-438732",
      href: "tel:+8801972438732",
    },
    {
      label: "+880 171423-8182",
      href: "tel:+8801714238182",
    },
  ],
  topBarEmails: ["mansur@alliancebdltd.com", "khan@alliancebdltd.com"],
};

export const navigation = [
  { label: "Home", href: "/" },
  { label: "About Us", href: "/about" },
  { label: "Factory & Machinery", href: "/factory-machinery" },
  { label: "Sister Concern", href: "/buying-house" },
  { label: "Global Partners", href: "/global-partners" },
  { label: "Contact Us", href: "/contact" },
];
