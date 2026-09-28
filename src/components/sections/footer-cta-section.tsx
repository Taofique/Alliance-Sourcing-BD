import Link from "next/link";
import { ArrowRight } from "lucide-react";
import Container from "@/components/layout/container";
import { FOOTER_CTA_FALLBACK_IMAGE } from "@/lib/footer-defaults";

export type FooterCtaContent = {
  heading: string;
  description: string;
  buttonText: string;
  buttonHref: string;
  /** An uploaded Cloudinary reference, or null for the bundled default photo. */
  imageUrl: string | null;
};

type FooterCtaSectionProps = {
  content: FooterCtaContent;
  className?: string;
};

const BUTTON_BASE =
  "group inline-flex items-center gap-3 rounded-full bg-white px-8 py-2 text-base font-bold text-slate-900 shadow-xl transition-all duration-500 hover:bg-cyan-500 hover:text-white hover:shadow-cyan-500/25 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white";

/**
 * The full-width cover photograph that sits immediately above the footer.
 *
 * `bg-attachment: fixed` is applied by CSS, not JavaScript, and only where it
 * is actually supported: a fine pointer, a wide viewport and no reduced-motion
 * preference. Touch devices, phones and reduced-motion users get the ordinary
 * scrolling background instead, so nothing janks and nothing is frozen.
 */
export default function FooterCtaSection({
  content,
  className = "",
}: FooterCtaSectionProps) {
  const backgroundUrl = content.imageUrl || FOOTER_CTA_FALLBACK_IMAGE;

  const button = (
    <Link
      href={content.buttonHref}
      {...(content.buttonHref.startsWith("/")
        ? {}
        : { target: "_blank", rel: "noopener noreferrer" })}
      className={BUTTON_BASE}
    >
      {content.buttonText}
      <ArrowRight
        className="size-5 transition-transform duration-300 group-hover:translate-x-1"
        aria-hidden="true"
      />
    </Link>
  );

  return (
    <section
      aria-labelledby="footer-cta-heading"
      className={`cta-fixed-bg relative overflow-hidden bg-cover bg-center px-4 py-20 sm:px-6 lg:px-8 ${className}`}
      style={{
        backgroundImage: `url("${backgroundUrl}")`,
        // Visible even before the photograph resolves, and the only thing left
        // if the image fails to load.
        backgroundColor: "#0c2a3d",
      }}
    >
      {/* Dark overlays: a directional wash for contrast, plus a cool tint. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-linear-to-r from-slate-900/85 via-slate-900/45 to-transparent"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-blue-950/25 backdrop-blur-[1px]"
      />

      <Container className="relative">
        <div className="relative overflow-hidden rounded-r-2xl border-l-4 border-cyan-500 bg-white/5 px-6 py-8 text-center shadow-2xl backdrop-blur-md md:px-12 md:text-left">
          {/* Subtle cyan bloom behind the panel content. */}
          <div
            aria-hidden="true"
            className="absolute -top-20 -right-20 size-64 rounded-full bg-cyan-500/10 blur-3xl"
          />

          <div className="relative z-10">
            <h2
              id="footer-cta-heading"
              className="mb-2 font-heading text-xl leading-[1.1] font-bold text-white sm:text-2xl lg:text-3xl"
            >
              {content.heading}
            </h2>

            {content.description.trim() && (
              <p className="mb-6 max-w-2xl text-sm leading-relaxed font-light text-white/80 md:text-base">
                {content.description}
              </p>
            )}

            <div className="flex flex-wrap justify-center gap-5 md:justify-start">
              {button}
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
