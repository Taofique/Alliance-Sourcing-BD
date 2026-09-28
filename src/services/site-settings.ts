import "server-only";

import { connectDB } from "@/lib/db";
import { SiteSettings } from "@/models/site-settings";
import {
  defaultSiteFooter,
  defaultSiteFooterCta,
} from "@/lib/footer-defaults";
import type {
  FooterLink,
  FooterSocial,
  PublicSiteSettings,
  SiteContact,
  SiteFooter,
  SiteFooterCta,
  SiteFooterCtaImage,
} from "@/types/site-settings";

/**
 * Older documents simply have no `footer` / `footerCta` sub-document, and a
 * partially saved one can hold a `null` field. Everything below fills those
 * gaps from `lib/footer-defaults.ts`, so a record written before the footer
 * editors existed renders exactly like a fully configured one.
 */

type StoredLink = { id?: string; label?: string; href?: string };
type StoredSocial = { platform?: string; href?: string };
type StoredImage = { imageUrl?: string; publicId?: string } | null;

/** Keeps a stored id when it is usable, otherwise derives a stable one. */
function normalizeLink(
  link: StoredLink,
  prefix: string,
  index: number,
): FooterLink | null {
  const label = link?.label?.trim() ?? "";
  const href = link?.href?.trim() ?? "";
  if (!label || !href) return null;

  const id = link.id?.trim();
  const safeId = id && /^[a-z0-9-]{1,64}$/.test(id) ? id : `${prefix}-${index + 1}`;

  return { id: safeId, label, href };
}

function normalizeLinks(
  links: StoredLink[] | null | undefined,
  prefix: string,
): FooterLink[] {
  if (!Array.isArray(links)) return [];
  return links
    .map((link, index) => normalizeLink(link, prefix, index))
    .filter((link): link is FooterLink => link !== null);
}

function normalizeSocials(
  socials: StoredSocial[] | null | undefined,
): FooterSocial[] {
  if (!Array.isArray(socials)) return [];

  const seen = new Set<string>();
  const result: FooterSocial[] = [];

  for (const social of socials) {
    const platform = social?.platform;
    const href = social?.href?.trim() ?? "";
    if (
      !platform ||
      !["facebook", "instagram", "linkedin", "youtube", "x"].includes(platform) ||
      !href ||
      seen.has(platform)
    ) {
      continue;
    }
    seen.add(platform);
    result.push({ platform: platform as FooterSocial["platform"], href });
  }

  return result;
}

function normalizeImage(image: StoredImage): SiteFooterCtaImage | null {
  const imageUrl = image?.imageUrl?.trim();
  const publicId = image?.publicId?.trim();
  return imageUrl && publicId ? { imageUrl, publicId } : null;
}

function normalizeFooter(footer: unknown): SiteFooter {
  const stored = (footer ?? {}) as Record<string, unknown>;

  return {
    brandDescription:
      typeof stored.brandDescription === "string"
        ? stored.brandDescription
        : defaultSiteFooter.brandDescription,
    address:
      typeof stored.address === "string" ? stored.address : defaultSiteFooter.address,
    emails: Array.isArray(stored.emails)
      ? stored.emails.filter((email): email is string => typeof email === "string")
      : [],
    quickLinks: Array.isArray(stored.quickLinks)
      ? normalizeLinks(stored.quickLinks as StoredLink[], "link")
      : [...defaultSiteFooter.quickLinks],
    socials: normalizeSocials(stored.socials as StoredSocial[] | undefined),
    whatsappNumber:
      typeof stored.whatsappNumber === "string"
        ? stored.whatsappNumber
        : defaultSiteFooter.whatsappNumber,
    whatsappMessage:
      typeof stored.whatsappMessage === "string"
        ? stored.whatsappMessage
        : defaultSiteFooter.whatsappMessage,
    copyrightOwner:
      typeof stored.copyrightOwner === "string" && stored.copyrightOwner
        ? stored.copyrightOwner
        : defaultSiteFooter.copyrightOwner,
    legalLinks: Array.isArray(stored.legalLinks)
      ? normalizeLinks(stored.legalLinks as StoredLink[], "legal")
      : [],
    attribution: stored.attribution
      ? normalizeLink(stored.attribution as StoredLink, "credit", 0)
      : null,
  };
}

function normalizeFooterCta(footerCta: unknown): SiteFooterCta {
  const stored = (footerCta ?? {}) as Record<string, unknown>;

  return {
    enabled:
      typeof stored.enabled === "boolean"
        ? stored.enabled
        : defaultSiteFooterCta.enabled,
    heading:
      typeof stored.heading === "string" && stored.heading
        ? stored.heading
        : defaultSiteFooterCta.heading,
    description:
      typeof stored.description === "string"
        ? stored.description
        : defaultSiteFooterCta.description,
    buttonText:
      typeof stored.buttonText === "string" && stored.buttonText
        ? stored.buttonText
        : defaultSiteFooterCta.buttonText,
    buttonHref:
      typeof stored.buttonHref === "string" && stored.buttonHref
        ? stored.buttonHref
        : defaultSiteFooterCta.buttonHref,
    image: normalizeImage(stored.image as StoredImage),
  };
}

/**
 * The footer shows the two header emails plus any extra footer addresses, with
 * duplicates removed case-insensitively. Nothing is copied back into
 * `contact.topBarEmails`, so the header and footer can never disagree.
 */
function mergeEmails(headerEmails: string[], footerEmails: string[]) {
  const seen = new Set<string>();
  const merged: string[] = [];

  for (const email of [...headerEmails, ...footerEmails]) {
    const value = email.trim();
    const key = value.toLowerCase();
    if (!value || seen.has(key)) continue;
    seen.add(key);
    merged.push(value);
  }

  return merged;
}

async function readSettingsDocument() {
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

  return settings;
}

export async function getPublicSiteSettings(): Promise<PublicSiteSettings> {
  const settings = await readSettingsDocument();

  const topBarEmails = [...settings.contact.topBarEmails];
  const footer = normalizeFooter(settings.footer);

  return {
    contact: {
      phones: settings.contact.phones.map((phone) => ({
        label: phone.label,
        href: phone.href,
      })),
      topBarEmails,
    },
    logos: settings.logos.map((logo) => ({
      key: logo.key,
      title: logo.title,
      subtitle: logo.subtitle,
      imageUrl: logo.imageUrl,
      publicId: logo.publicId ?? null,
    })),
    footer: {
      ...footer,
      emails: mergeEmails(topBarEmails, footer.emails),
    },
    footerCta: normalizeFooterCta(settings.footerCta),
  };
}

/**
 * The footer exactly as stored, without the header emails folded in. The admin
 * editor needs this: the merged public list would write the two header emails
 * back as if they were extra footer addresses.
 */
export async function getStoredSiteFooter(): Promise<SiteFooter> {
  const settings = await readSettingsDocument();
  return normalizeFooter(settings.footer);
}

export async function updateSiteContact(contact: SiteContact) {
  await connectDB();

  const result = await SiteSettings.updateOne(
    { key: "main" },
    { $set: { contact } },
    { runValidators: true },
  );

  return result.matchedCount === 1;
}

export async function siteLogoExists(logoKey: string) {
  await connectDB();
  return Boolean(await SiteSettings.exists({ key: "main", "logos.key": logoKey }));
}

export async function updateSiteLogo(logoKey: string, image: { imageUrl: string; publicId: string }) {
  await connectDB();
  const result = await SiteSettings.updateOne(
    { key: "main", "logos.key": logoKey },
    { $set: { "logos.$.imageUrl": image.imageUrl, "logos.$.publicId": image.publicId } },
    { runValidators: true, upsert: false },
  );
  return result.matchedCount === 1;
}

/**
 * Targeted write: only the `footer` sub-document is replaced, so contact
 * details, logos, banners and the footer CTA can never be clobbered by saving
 * the footer form.
 */
export async function updateSiteFooter(footer: SiteFooter) {
  await connectDB();

  const result = await SiteSettings.updateOne(
    { key: "main" },
    { $set: { footer } },
    { runValidators: true },
  );

  return result.matchedCount === 1;
}

/**
 * `image` is only touched when the editor supplies one (or `null` to clear it),
 * so saving the heading or description keeps the stored photograph.
 */
export async function updateSiteFooterCta(
  cta: Omit<SiteFooterCta, "image">,
  image: SiteFooterCtaImage | null | undefined,
) {
  await connectDB();

  const update: Record<string, unknown> = {
    "footerCta.enabled": cta.enabled,
    "footerCta.heading": cta.heading,
    "footerCta.description": cta.description,
    "footerCta.buttonText": cta.buttonText,
    "footerCta.buttonHref": cta.buttonHref,
  };

  if (image !== undefined) {
    update["footerCta.image"] = image;
  }

  const result = await SiteSettings.updateOne(
    { key: "main" },
    { $set: update },
    { runValidators: true },
  );

  return result.matchedCount === 1;
}
