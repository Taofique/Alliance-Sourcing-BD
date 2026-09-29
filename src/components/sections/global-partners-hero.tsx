import PageBreadcrumb from "@/components/common/page-breadcrumb";
import { globalPartnersContent } from "@/lib/global-partners-sections";

/**
 * The cover band on /global-partners: breadcrumb, heading, tagline and the three
 * partnership statistics.
 *
 * Ported from the reference `GlobalPartnersHero`. The photograph is tinted with
 * a multiplied navy wash and a vertical gradient rather than the flat scrim the
 * shared `PageHero` uses, because this page's hero is a full 500px collage
 * instead of a short cropped cover.
 *
 * The statistics are `h2` elements, as on the live page. They are figures rather
 * than section headings, so each one points at the band it belongs to.
 */
export default function GlobalPartnersHero() {
  const { title, subtitle, image, breadcrumbLabel, stats } =
    globalPartnersContent.hero;

  return (
    <section
      aria-labelledby="global-partners-hero-heading"
      className="relative flex h-125 w-full items-center justify-center overflow-hidden"
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `url("${image}")`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-blue-900/80 mix-blend-multiply" />
        <div className="absolute inset-0 bg-linear-to-b from-blue-400/40 to-blue-950/50" />
      </div>

      <div className="relative z-10 mx-auto max-w-4xl px-4 text-center text-white">
        <div className="mb-4 flex justify-center">
          <PageBreadcrumb
            items={[
              { label: "Home", href: "/" },
              { label: breadcrumbLabel },
            ]}
          />
        </div>

        <h1
          id="global-partners-hero-heading"
          className="mb-6 text-4xl font-bold tracking-tight md:text-6xl"
        >
          {title}
        </h1>

        <p className="mx-auto mb-12 max-w-3xl text-lg leading-relaxed text-slate-200 md:text-xl">
          {subtitle}
        </p>

        <dl className="grid grid-cols-3 gap-8 md:gap-16">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <dd className="mb-2 text-4xl font-bold md:text-5xl">{stat.value}</dd>
              <dt className="text-sm font-medium uppercase tracking-wider text-slate-300 md:text-base">
                {stat.label}
              </dt>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
