import type { ContactCardInput } from "@/types/contact-card";

/**
 * The three boxes the live /contact page ships today, copied from it so the
 * rebuild shows the same contact details before anyone opens the admin.
 *
 * `init:contact-cards` only ever inserts, so an editor's change to any of these
 * survives a re-run.
 *
 * The `tel:` links drop the spaces the display text keeps. The live page builds
 * `tel:+880 1972-438732`, which is not a valid URI — spaces are not allowed in
 * one — and only works because clients are lenient about it.
 */
export const CONTACT_CARD_DEFAULTS: ContactCardInput[] = [
  {
    type: "email",
    label: "Email",
    description: "Our friendly team is here to help.",
    values: [
      { text: "info@alliancebdltd.com", href: "mailto:info@alliancebdltd.com" },
      {
        text: "mansur@alliancebdltd.com",
        href: "mailto:mansur@alliancebdltd.com",
      },
      { text: "khan@alliancebdltd.com", href: "mailto:khan@alliancebdltd.com" },
      {
        text: "faroque@alliancebdltd.com",
        href: "mailto:faroque@alliancebdltd.com",
      },
    ],
    action: null,
    iconKey: "mail",
    mapEmbedUrl: "",
    sortOrder: 0,
    isActive: true,
  },
  {
    type: "phone",
    label: "Phone",
    description: "Mon-Fri from 9am to 6pm.",
    values: [
      { text: "+880 1972-438732", href: "tel:+8801972438732" },
      { text: "+880 171423-8182", href: "tel:+8801714238182" },
    ],
    action: null,
    iconKey: "phone",
    mapEmbedUrl: "",
    sortOrder: 1,
    isActive: true,
  },
  {
    type: "office",
    label: "Office",
    // The live card shows the address as its grey supporting line, with no
    // separate value list — only the "Get directions" action below it.
    description: "Asha Plaza (2nd floor), Hemayetpur, Savar, Dhaka, Bangladesh",
    values: [],
    action: { label: "Get directions", href: "https://www.google.com/maps" },
    iconKey: "mapPin",
    mapEmbedUrl:
      "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d867.5229777438065!2d90.27239703321536!3d23.792739900987847!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3755ebe995d3ca25%3A0x77194001cf393656!2sAlliance%20Apparels%20pvt.%20Ltd.!5e1!3m2!1sen!2sbd!4v1775045848537!5m2!1sen!2sbd",
    sortOrder: 2,
    isActive: true,
  },
];
