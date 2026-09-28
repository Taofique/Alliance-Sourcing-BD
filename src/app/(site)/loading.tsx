import BrandedLoaderScreen from "@/components/common/branded-loader-screen";

/**
 * The real route-loading wait for public pages.
 *
 * Next.js renders this fallback inside the persistent `(site)` layout for as
 * long as a page segment is actually streaming, then unmounts it — so it shows
 * genuine loading progress and is never held open by a timer. It deliberately
 * uses the bundled logo files: `loading.tsx` is a synchronous Server Component
 * and cannot await the saved settings.
 *
 * Admin and login routes are outside this segment and never show a loader.
 */
export default function SiteLoading() {
  return <BrandedLoaderScreen logos={[]} variant="loading" />;
}
