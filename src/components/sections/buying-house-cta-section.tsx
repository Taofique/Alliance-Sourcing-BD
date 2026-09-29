import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { buyingHouseContent } from "@/lib/buying-house-sections";
import { getPublicSiteSettings } from "@/services/site-settings";

/**
 * The closing "Ready to start sourcing?" band on /buying-house.
 *
 * Ported from the reference `CTASection`: a fixed cover photograph under a
 * left-to-right scrim, with the copy held in a translucent card behind a cyan
 * left rule. The action address is read from the admin-managed contact settings
 * rather than hardcoded, so it stays correct when the contact emails change.
 */
export default async function BuyingHouseCtaSection() {
  const { heading, description, image } = buyingHouseContent.cta;
  const settings = await getPublicSiteSettings();
  // `footer.emails` is already the header addresses merged with the footer's own,
  // so it is the one list that holds every address the site publishes.
  const mailto = settings.footer.emails.filter(Boolean).join(",");

  return (
    <section
      aria-labelledby="buying-house-cta-heading"
      className="relative py-20 px-4 sm:px-6 lg:px-8 bg-cover bg-center bg-fixed overflow-hidden"
      style={{ backgroundImage: `url(${image})` }}
    >
      {/* Overlay: multi-layer gradient for depth and clarity */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-linear-to-r from-slate-900/80 via-slate-900/40 to-transparent"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-blue-950/20 backdrop-blur-[1px]"
      />

      <div className="max-w-5xl mx-auto relative">
        <div className="py-8 px-6 md:px-12 relative text-center md:text-left md:border-l-4 border-cyan-500 bg-white/5 backdrop-blur-md rounded-r-2xl overflow-hidden shadow-2xl">
          {/* Subtle background element */}
          <div
            aria-hidden="true"
            className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl"
          />

          <div className="relative z-10">
            <h2
              id="buying-house-cta-heading"
              className="font-heading text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-2 leading-[1.1]"
            >
              {heading}
            </h2>

            <p className="text-sm text-white/80 max-w-2xl mb-6 leading-relaxed font-light">
              {description}
            </p>

            <div className="flex flex-wrap gap-5 justify-center md:justify-start">
              <Link
                href={`mailto:${mailto}`}
                className="group bg-white hover:bg-cyan-500 text-slate-900 hover:text-white px-8 py-2 text-base h-auto font-bold rounded-full transition-all duration-500 shadow-xl hover:shadow-cyan-500/25 flex items-center gap-3 motion-reduce:transition-none"
              >
                Contact Us
                <ArrowRight
                  aria-hidden="true"
                  className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1 motion-reduce:transition-none"
                />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
