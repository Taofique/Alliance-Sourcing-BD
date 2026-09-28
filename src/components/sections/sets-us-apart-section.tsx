import Image from "next/image";
import Container from "@/components/layout/container";
import SectionHeading from "@/components/common/section-heading";
import { setsUsApart } from "@/lib/homepage-sections";
import type {
  SetsUsApartFeature,
  SetsUsApartPanel,
} from "@/types/homepage-sections";

/** The reference's small bordered tick box, recoloured onto this palette. */
function CheckBox() {
  return (
    <span
      aria-hidden="true"
      className="flex size-5 shrink-0 items-center justify-center rounded border border-slate-300 text-slate-600"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={3}
        className="size-3.5"
      >
        <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

function FeatureCard({ feature }: { feature: SetsUsApartFeature }) {
  return (
    <article className="group flex w-full flex-col rounded-xl border border-gray-100 bg-white p-5 shadow-[0_0_10px_rgba(0,0,0,0.08)] transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-xl motion-reduce:transform-none motion-reduce:transition-none">
      <div className="mb-8 flex size-12 items-center justify-center rounded-lg bg-cyan-50 transition-colors duration-300 group-hover:bg-cyan-100 motion-reduce:transition-none">
        <Image
          src={feature.icon}
          alt={feature.iconAlt}
          width={48}
          height={48}
          className="size-12"
        />
      </div>

      <h3 className="font-heading mb-3 text-lg font-semibold text-slate-900 sm:text-xl">
        {feature.title}
      </h3>

      <p className="text-sm leading-relaxed text-slate-600 sm:text-base">
        {feature.description}
      </p>
    </article>
  );
}

function Panel({ panel }: { panel: SetsUsApartPanel }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-shadow duration-300 hover:shadow-[0_15px_45px_rgba(6,182,212,0.21)] sm:p-8 md:p-10 motion-reduce:transition-none">
      <p className="text-xs font-bold tracking-widest text-slate-400 uppercase">
        {panel.eyebrow}
      </p>

      {panel.heading && (
        <>
          <h3 className="font-heading mt-3 mb-3 text-lg font-bold text-slate-800 sm:text-xl">
            {panel.heading}
          </h3>
          <p className="leading-relaxed text-slate-500">{panel.description}</p>
        </>
      )}

      {panel.points.length > 0 && (
        <ul className="space-y-8">
          {panel.points.map((point) => (
            <li key={point.id} className="flex gap-4 sm:gap-5">
              <span className="mt-1 shrink-0">
                <CheckBox />
              </span>
              <div className="min-w-0">
                <h3 className="font-heading mb-2 text-base font-bold text-slate-900 sm:text-lg">
                  {point.title}
                </h3>
                <p className="text-sm leading-relaxed text-slate-500">
                  {point.description}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}

      {panel.checklist.length > 0 && (
        <div className="mt-8 border-t border-gray-100 pt-8">
          <p className="text-xs font-bold tracking-widest text-slate-400 uppercase">
            {panel.checklistEyebrow}
          </p>

          <ul className="mt-6 space-y-4">
            {panel.checklist.map((item) => (
              <li key={item.id} className="flex items-start gap-4 sm:gap-5">
                <span className="mt-0.5 shrink-0">
                  <CheckBox />
                </span>
                <span className="text-sm leading-relaxed font-medium text-slate-600 sm:text-base">
                  {item.label}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/**
 * "What sets us apart": four feature cards over two supporting panels.
 *
 * The card icons are the four SVGs shipped in `public/icons`, one per card, so
 * the section needs no icon library and no uploads.
 */
export default function SetsUsApartSection() {
  return (
    <section
      aria-labelledby="sets-us-apart-heading"
      className="bg-white py-14 md:py-20"
    >
      <Container>
        <SectionHeading
          id="sets-us-apart-heading"
          eyebrow={setsUsApart.eyebrow}
          heading={setsUsApart.heading}
        />

        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
          {setsUsApart.features.map((feature) => (
            <li key={feature.id} className="flex">
              <FeatureCard feature={feature} />
            </li>
          ))}
        </ul>

        <div className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8">
          {setsUsApart.panels.map((panel) => (
            <Panel key={panel.eyebrow} panel={panel} />
          ))}
        </div>
      </Container>
    </section>
  );
}
