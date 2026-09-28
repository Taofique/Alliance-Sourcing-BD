import Container from "@/components/layout/container";
import OutlineLink from "@/components/common/outline-link";
import { howWeWork } from "@/lib/homepage-sections";
import type { HowWeWorkStep } from "@/types/homepage-sections";

/**
 * One ordered step: a numbered disc joined to the next by a vertical rule.
 *
 * The number replaces the reference's per-step icon images, which were hosted on
 * the old admin's Cloudinary account and are not part of this bundle.
 */
function Step({
  step,
  index,
  isLast,
}: {
  step: HowWeWorkStep;
  index: number;
  isLast: boolean;
}) {
  return (
    <li className="flex gap-5 sm:gap-6">
      <div className="flex flex-col items-center">
        <span
          aria-hidden="true"
          className="font-heading flex size-12 shrink-0 items-center justify-center rounded-full bg-cyan-50 text-sm font-bold text-cyan-700 sm:size-13 sm:text-base"
        >
          {String(index + 1).padStart(2, "0")}
        </span>

        {!isLast && (
          <span
            aria-hidden="true"
            className="mt-2 w-px flex-1 bg-gray-200"
          />
        )}
      </div>

      <div className={`pt-1 ${isLast ? "pb-0" : "pb-8 sm:pb-10"}`}>
        <h3 className="font-heading mb-2 text-lg leading-tight font-semibold text-slate-900 sm:text-xl">
          {step.title}
        </h3>
        <p className="text-sm leading-relaxed text-slate-500 sm:text-base">
          {step.description}
        </p>
      </div>
    </li>
  );
}

/**
 * "How we work": the sticky intro on the left, the ordered process on the right.
 *
 * No client component and no scroll observer — the reference animated the steps
 * in on scroll, but that is decoration over content that is already in the HTML.
 */
export default function HowWeWorkSection() {
  return (
    <section
      aria-labelledby="how-we-work-heading"
      className="bg-gray-50/70 py-14 md:py-20"
    >
      <Container>
        <div className="grid grid-cols-1 items-start gap-10 md:grid-cols-2 md:gap-14 lg:gap-20">
          <div className="md:sticky md:top-24">
            <p className="mb-3 text-xs font-semibold tracking-widest text-cyan-600 uppercase sm:text-sm">
              {howWeWork.eyebrow}
            </p>

            <h2
              id="how-we-work-heading"
              className="font-heading mb-6 text-3xl leading-tight font-bold text-slate-900 sm:text-4xl md:text-5xl"
            >
              {howWeWork.heading}
            </h2>

            <OutlineLink href={howWeWork.cta.href}>
              {howWeWork.cta.label}
            </OutlineLink>
          </div>

          <ol className="flex flex-col">
            {howWeWork.steps.map((step, index) => (
              <Step
                key={step.id}
                step={step}
                index={index}
                isLast={index === howWeWork.steps.length - 1}
              />
            ))}
          </ol>
        </div>
      </Container>
    </section>
  );
}
