import type { PageBannerSlug } from "@/models/page-banner";

/**
 * Bundled fallbacks for the per-page cover photographs, in a collection of
 * their own. Without these a page whose banner has never been uploaded would
 * render its heading over nothing.
 */

/** Kept separate from the other Cloudinary folders so the two never cross. */
export const PAGE_BANNER_FOLDER = "alliance-sourcing-bd/page-banners";

/**
 * Served from `public/`, so a page renders before anyone has uploaded
 * anything. These are only placeholders: an upload replaces the entry for that
 * page and leaves the others alone.
 */
export const PAGE_BANNER_FALLBACK_IMAGES: Record<PageBannerSlug, string> = {
  about: "/garment-rack.jpg",
};
