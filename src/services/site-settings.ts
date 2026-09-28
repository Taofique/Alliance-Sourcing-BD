import "server-only";

import { connectDB } from "@/lib/db";
import { SiteSettings } from "@/models/site-settings";
import type { PublicSiteSettings } from "@/types/site-settings";

export async function getPublicSiteSettings(): Promise<PublicSiteSettings> {
  await connectDB();

  const settings = await SiteSettings.findOne({
    key: "main",
  })
    .lean()
    .exec();

  if (!settings) {
    throw new Error(
      'Site settings are missing. Insert the document with key "main".',
    );
  }

  return {
    contact: {
      phones: settings.contact.phones.map((phone) => ({
        label: phone.label,
        href: phone.href,
      })),
      topBarEmails: [...settings.contact.topBarEmails],
    },
    logos: settings.logos.map((logo) => ({
      key: logo.key,
      title: logo.title,
      subtitle: logo.subtitle,
      imageUrl: logo.imageUrl,
      publicId: logo.publicId ?? null,
    })),
  };
}
