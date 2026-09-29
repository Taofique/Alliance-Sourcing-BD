/**
 * The single source of truth for which pages have a cover-photograph editor.
 *
 * Kept in a plain module with no `server-only` import so the admin client
 * component, the API routes, the Mongoose model and the public pages all read
 * the same list — a page cannot be editable in one layer and unknown in
 * another.
 *
 * An entry is added only once the page and its admin route both exist, so no
 * dead link is ever exposed.
 */
export const PAGE_BANNER_SLUGS = ["about"] as const;

export type PageBannerSlug = (typeof PAGE_BANNER_SLUGS)[number];

/** The public path each banner is rendered on, used to revalidate after a save. */
export const PAGE_BANNER_ROUTES: Record<PageBannerSlug, string> = {
  about: "/about",
};

/** Human-readable names for the admin editor. */
export const PAGE_BANNER_LABELS: Record<PageBannerSlug, string> = {
  about: "About Us",
};

export function isPageBannerSlug(value: unknown): value is PageBannerSlug {
  return (
    typeof value === "string" &&
    (PAGE_BANNER_SLUGS as readonly string[]).includes(value)
  );
}
