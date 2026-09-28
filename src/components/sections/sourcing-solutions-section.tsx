import Image from "next/image";
import Container from "@/components/layout/container";
import SectionHeading from "@/components/common/section-heading";
import { sourcingSolutions } from "@/lib/homepage-sections";
import type { SourcingSolution } from "@/types/homepage-sections";

function SolutionCard({ solution }: { solution: SourcingSolution }) {
  return (
    <li className="flex">
      <article className="group flex w-full flex-col rounded-xl bg-white p-5 shadow-[0_0_10px_rgba(0,0,0,0.08)] transition-[transform,box-shadow,background-color] duration-300 hover:-translate-y-1 hover:bg-[#0C97D5] hover:shadow-[0_0_20px_rgba(6,182,212,0.45)] motion-reduce:transform-none motion-reduce:transition-none">
        {/* The reference cards draw a 48px 512x512 transparent PNG, not a
            line glyph, so there is no tinted icon tile behind it. */}
        <Image
          src={solution.icon}
          alt=""
          width={48}
          height={48}
          className="mb-6 size-12 shrink-0"
        />

        <h3 className="font-heading mb-2 text-base font-semibold text-slate-900 group-hover:text-white sm:text-lg">
          {solution.title}
        </h3>

        <p className="text-sm leading-relaxed text-slate-600 group-hover:text-white/90">
          {solution.description}
        </p>
      </article>
    </li>
  );
}

/**
 * "End-to-end sourcing solutions": the six buying-house service cards.
 *
 * The hover inverts the card onto the brand cyan, matching the reference.
 */
export default function SourcingSolutionsSection() {
  return (
    <section
      aria-labelledby="sourcing-solutions-heading"
      className="bg-white py-14 md:py-20"
    >
      <Container>
        <SectionHeading
          id="sourcing-solutions-heading"
          eyebrow={sourcingSolutions.eyebrow}
          heading={sourcingSolutions.heading}
          lede={sourcingSolutions.description}
        />

        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
          {sourcingSolutions.items.map((solution) => (
            <SolutionCard key={solution.id} solution={solution} />
          ))}
        </ul>
      </Container>
    </section>
  );
}
