import PageBreadcrumb from "@/components/common/page-breadcrumb";

type PageHeroProps = {
  /** Unique id, used as the `aria-labelledby` target for the `h1`. */
  id: string;
  /** Bundled or uploaded cover photograph. */
  image: string;
  title: string;
  subtitle?: string;
  /** Trailing crumb, e.g. "Factory & Machinery". */
  breadcrumbLabel: string;
  /**
   * Shown before the photograph resolves, and left behind if it fails, so the
   * white type always has contrast.
   */
  backgroundColor?: string;
};

/**
 * The dark cover band at the top of a page: breadcrumb, `h1` and tagline over a
 * photograph.
 *
 * The scrim is what makes white type readable over an arbitrary image, so it
 * sits above the background and below the content rather than being baked into
 * the image.
 */
export default function PageHero({
  id,
  image,
  title,
  subtitle,
  breadcrumbLabel,
  backgroundColor = "#0c2a3d",
}: PageHeroProps) {
  return (
    <section
      aria-labelledby={id}
      className="relative bg-cover bg-center px-4 py-12 sm:px-6 sm:py-16 lg:px-8 md:py-20"
      style={{
        backgroundImage: `url("${image}")`,
        backgroundColor,
      }}
    >
      <div aria-hidden="true" className="absolute inset-0 bg-black/60" />

      <div className="relative flex flex-col items-center justify-center text-center">
        <div className="mb-4">
          <PageBreadcrumb
            items={[{ label: "Home", href: "/" }, { label: breadcrumbLabel }]}
          />
        </div>

        <h1
          id={id}
          className="font-heading text-3xl leading-tight font-bold text-white sm:text-4xl lg:text-5xl"
        >
          {title}
        </h1>

        {subtitle && (
          <p className="mt-3 max-w-3xl text-base leading-relaxed text-slate-200 sm:text-lg">
            {subtitle}
          </p>
        )}
      </div>
    </section>
  );
}
