import Image from "next/image";
import Container from "@/components/layout/container";
import { factoryMachineryContent } from "@/lib/factory-machinery-sections";

type OwnFactorySectionProps = {
  /**
   * The admin-managed factory profile, or null when none is stored. Carries the
   * two links rather than the stored reference: the view url is signed per
   * request, and the download url is our own route, because a browser will not
   * save a cross-origin file however the markup is written.
   */
  pdf: { fileName: string; viewUrl: string; downloadUrl: string } | null;
};

/**
 * "Own Factory": the section that points readers at the factory profile PDF.
 *
 * The document is managed from the admin, so both buttons are rendered only
 * when one is actually stored — an empty link would advertise a brochure that
 * is not there.
 *
 * The copy sits left and the photograph right on wide screens, and stacks with
 * the copy first on narrow ones.
 */
export default function OwnFactorySection({ pdf }: OwnFactorySectionProps) {
  const content = factoryMachineryContent.ownFactory;

  return (
    <section aria-labelledby="own-factory-heading" className="bg-white py-14 md:py-20">
      <Container>
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
          <div>
            <h2
              id="own-factory-heading"
              className="font-heading text-3xl font-bold text-slate-900 sm:text-4xl md:text-5xl"
            >
              {content.heading}
            </h2>

            <p className="mt-4 font-heading text-xl font-semibold text-slate-700 sm:text-2xl">
              {content.subheading}
            </p>

            <p className="mt-4 text-base leading-relaxed text-slate-600 sm:text-lg">
              {content.description}
            </p>

            {pdf && (
              <div className="mt-8 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
                {content.actions.map((action) => (
                  <a
                    key={action.label}
                    href={action.download ? pdf.downloadUrl : pdf.viewUrl}
                    {...(action.download
                      ? { download: pdf.fileName }
                      : { target: "_blank", rel: "noopener noreferrer" })}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition-colors duration-200 hover:bg-blue-700 motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 sm:w-auto"
                  >
                    {action.label}
                  </a>
                ))}
              </div>
            )}
          </div>

          <div className="relative aspect-4/3 w-full overflow-hidden rounded-2xl bg-slate-100 shadow-sm lg:order-last">
            <Image
              src={content.image}
              alt={content.imageAlt}
              fill
              sizes="(min-width: 1024px) 45vw, 100vw"
              className="object-cover"
            />
          </div>
        </div>
      </Container>
    </section>
  );
}
