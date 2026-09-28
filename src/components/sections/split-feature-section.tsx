import Image from "next/image";
import Container from "@/components/layout/container";
import SectionHeading from "@/components/common/section-heading";
import SectionIcon from "@/components/common/section-icon";
import OutlineLink from "@/components/common/outline-link";
import type { CatalogCategory, SplitFeatureSection } from "@/types/homepage-sections";

type SplitFeatureSectionProps = {
  /** Also the `aria-labelledby` target for the section's `h2`. */
  id: string;
  section: SplitFeatureSection;
};

function Category({ category }: { category: CatalogCategory }) {
  return (
    <li className="group flex gap-3">
      <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-md bg-blue-50 transition-colors duration-200 group-hover:bg-blue-100 motion-reduce:transition-none">
        <SectionIcon name={category.icon} className="size-5 text-blue-600" />
      </span>

      <div className="min-w-0">
        <h3 className="mb-1 text-sm leading-snug font-semibold text-slate-900">
          {category.title}
        </h3>
        <p className="text-sm leading-relaxed text-slate-500">
          {category.description}
        </p>
      </div>
    </li>
  );
}

/**
 * The image-beside-copy composition shared by Products & Services and Factory &
 * Machinery capabilities.
 *
 * Both are the same layout in the reference with the sides swapped, so this
 * takes the whole section as data instead of the two files duplicating ~60
 * lines of Tailwind each.
 */
export default function SplitFeatureSection({
  id,
  section,
}: SplitFeatureSectionProps) {
  const imageFirst = section.imagePosition === "left";

  return (
    <section
      aria-labelledby={id}
      className={`py-14 md:py-20 ${
        section.tinted
          ? "bg-linear-to-b from-blue-50 to-white"
          : "bg-white"
      }`}
    >
      <Container>
        <div className="grid grid-cols-1 items-center gap-10 md:grid-cols-2 lg:gap-16">
          <div
            className={`relative aspect-4/3 w-full overflow-hidden rounded-2xl sm:aspect-3/2 md:aspect-auto md:h-[32rem] ${
              imageFirst ? "" : "md:order-2"
            }`}
          >
            <Image
              src={section.image}
              alt={section.imageAlt}
              fill
              sizes="(min-width: 768px) 50vw, 100vw"
              className="object-cover"
            />
          </div>

          <div className={`flex flex-col gap-6 ${imageFirst ? "" : "md:order-1"}`}>
            <SectionHeading
              id={id}
              eyebrow={section.eyebrow}
              heading={section.heading}
              lede={section.description}
              align="left"
            />

            <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {section.categories.map((category) => (
                <Category key={category.id} category={category} />
              ))}
            </ul>

            <div>
              <OutlineLink href={section.cta.href}>{section.cta.label}</OutlineLink>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
