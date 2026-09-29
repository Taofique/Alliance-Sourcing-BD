import Link from "next/link";

type CTASectionProps = {
  id: string;
  heading: string;
  text: string;
  actionLabel: string;
  actionHref: string;
};

/**
 * The closing "talk to us" band.
 *
 * One heading, one line of copy and one action, so a page that ends on a call
 * to action does not have to re-implement the spacing, the button treatment
 * and the focus ring for it.
 */
export default function CTASection({
  id,
  heading,
  text,
  actionLabel,
  actionHref,
}: CTASectionProps) {
  const external = /^https?:\/\//i.test(actionHref);

  return (
    <section
      aria-labelledby={id}
      className="bg-slate-50 px-4 py-14 sm:px-6 md:py-20 lg:px-8"
    >
      <div className="mx-auto max-w-2xl text-center">
        <h2
          id={id}
          className="font-heading text-2xl font-bold text-slate-900 sm:text-3xl md:text-4xl"
        >
          {heading}
        </h2>

        <p className="mt-3 text-base leading-relaxed text-slate-600 sm:text-lg">
          {text}
        </p>

        <div className="mt-7">
          <Link
            href={actionHref}
            {...(external ? { rel: "noopener noreferrer", target: "_blank" } : {})}
            className="inline-flex items-center justify-center rounded-md bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition-colors duration-200 hover:bg-blue-700 motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            {actionLabel}
          </Link>
        </div>
      </div>
    </section>
  );
}
