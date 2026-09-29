import PageBreadcrumb from "@/components/common/page-breadcrumb";
import { PAGE_BANNER_FALLBACK_IMAGES } from "@/lib/page-banner-defaults";

type AboutHeroSectionProps = {
  /**
   * The photograph stored for this page, uploaded through its admin banner
   * editor. Falls back to the bundled cover image, so the section still renders
   * when the page has no `page_banners` document yet.
   */
  imageUrl: string | null;
};

/**
 * "About Alliance Sourcing BD": the page intro, and the page's only `h1`.
 *
 * A dark cover photograph with the breadcrumb, heading and tagline centred over
 * it. The overlay is what keeps the white type readable, so it sits above the
 * background and below the content rather than being baked into the image.
 */
export default function AboutHeroSection({ imageUrl }: AboutHeroSectionProps) {
  const backgroundUrl = imageUrl || PAGE_BANNER_FALLBACK_IMAGES.about;

  return (
    <section
      aria-labelledby="about-hero-heading"
      className="relative bg-cover bg-center px-4 py-12 sm:px-6 sm:py-16 lg:px-8 md:py-20"
      style={{
        backgroundImage: `url("${backgroundUrl}")`,
        // Visible before the photograph resolves, and the only thing left if
        // the image fails to load.
        backgroundColor: "#0c2a3d",
      }}
    >
      <div aria-hidden="true" className="absolute inset-0 bg-black/60" />

      <div className="relative flex flex-col items-center justify-center text-center">
        <div className="mb-4">
          <PageBreadcrumb
            items={[
              { label: "Home", href: "/" },
              { label: "About Us" },
            ]}
          />
        </div>

        <h1
          id="about-hero-heading"
          className="font-heading text-3xl leading-tight font-bold text-white sm:text-4xl lg:text-5xl"
        >
          About Alliance Sourcing BD
        </h1>

        <p className="mt-2 max-w-3xl text-lg text-slate-200 sm:text-xl">
          Your premier partner in seamless garment sourcing and social
          manufacturing excellence
        </p>
      </div>
    </section>
  );
}
