import "server-only";

import { connectDB } from "@/lib/db";
import {
  isPageBannerSlug,
  PageBanner,
  type PageBannerSlug,
} from "@/models/page-banner";

export type PageBannerImage = {
  imageUrl: string;
  publicId: string;
};

export type PageBannerRecord = {
  page: string;
  image: PageBannerImage | null;
};

/**
 * Page banners live in their own `page_banners` collection, one document per
 * page, rather than as another field on the site-wide `site_settings` document.
 * `site_settings` holds what the whole site shares — contact details, logos and
 * the footer — whereas a cover photograph belongs to one page and is edited on
 * its own.
 */
function normalizeImage(
  image: { imageUrl?: string; publicId?: string } | null | undefined,
): PageBannerImage | null {
  const imageUrl = image?.imageUrl?.trim();
  const publicId = image?.publicId?.trim();
  return imageUrl && publicId ? { imageUrl, publicId } : null;
}

/**
 * A page that has never been edited has no document at all. Callers get a
 * usable record back and fall back to the bundled photograph from
 * `lib/page-banner-defaults.ts`.
 */
export async function getPageBanner(page: PageBannerSlug) {
  await connectDB();

  const stored = await PageBanner.findOne({ page }).lean().exec();

  return {
    page,
    image: normalizeImage(stored?.image),
  } satisfies PageBannerRecord;
}

/**
 * `image` is only written when supplied, so a save can never clear a photograph
 * by accident. `null` is the explicit reset to the bundled default.
 */
export async function updatePageBanner(
  page: PageBannerSlug,
  image: PageBannerImage | null | undefined,
) {
  if (!isPageBannerSlug(page)) return false;
  if (image === undefined) return false;

  await connectDB();

  const result = await PageBanner.updateOne(
    { page },
    { $set: { image } },
    { runValidators: true, upsert: true },
  );

  return result.matchedCount === 1 || result.upsertedCount === 1;
}
