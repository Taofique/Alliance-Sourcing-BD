import Link from "next/link";
import { ArrowRight } from "lucide-react";

type ImageCtaSectionProps = {
  /** Unique id, used as the `aria-labelledby` target for the `h2`. */
  id: string;
  heading: string;
  description: string;
  /** Bundled or remote cover photograph behind the scrim. */
  image: string;
  /** Comma-separated `mailto:` recipients, normally from the contact settings. */
  mailto: string;
  label?: string;
};

/**
 * The closing call-to-action band used by /buying-house and /global-partners.
 *
 * Ported from the reference `CTASection`: a fixed cover photograph under a
 * left-to-right scrim, with the copy held in a translucent card behind a cyan
 * left rule. Both pages use the identical band, so it lives here once and each
 * page supplies only its own copy.
 *
 * The reference fades the card in with `animate-in` utilities; those are not part
 * of this project's Tailwind build, and the band reads the same without them.
 */
export default function ImageCtaSection({
  id,
  heading,
  description,
  image,
  mailto,
  label = "Contact Us",
}: ImageCtaSectionProps) {
  return (
    <section
      aria-labelledby={id}
      className="relative overflow-hidden bg-cover bg-center bg-fixed px-4 py-20 sm:px-6 lg:px-8"
      style={{ backgroundImage: `url("${image}")` }}
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

      <div className="relative mx-auto max-w-5xl">
        <div className="relative overflow-hidden rounded-r-2xl border-l-4 border-cyan-500 bg-white/5 px-6 py-8 text-center shadow-2xl backdrop-blur-md md:px-12 md:text-left">
          {/* Subtle background element */}
          <div
            aria-hidden="true"
            className="absolute -right-20 -top-20 size-64 rounded-full bg-cyan-500/10 blur-3xl"
          />

          <div className="relative z-10">
            <h2
              id={id}
              className="font-heading mb-2 text-xl font-bold leading-[1.1] text-white sm:text-2xl lg:text-3xl"
            >
              {heading}
            </h2>

            <p className="mb-6 max-w-2xl text-sm font-light leading-relaxed text-white/80">
              {description}
            </p>

            <div className="flex flex-wrap justify-center gap-5 md:justify-start">
              <Link
                href={`mailto:${mailto}`}
                className="group flex h-auto items-center gap-3 rounded-full bg-white px-8 py-2 text-base font-bold text-slate-900 shadow-xl transition-all duration-500 hover:bg-cyan-500 hover:text-white hover:shadow-cyan-500/25 motion-reduce:transition-none"
              >
                {label}
                <ArrowRight
                  aria-hidden="true"
                  className="size-5 transition-transform duration-300 group-hover:translate-x-1 motion-reduce:transition-none"
                />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
