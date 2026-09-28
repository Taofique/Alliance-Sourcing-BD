import Image from "next/image";
import Link from "next/link";
import Container from "@/components/layout/container";
import type { SourcingCategory, SourcingSettings } from "@/types/sourcing";

export default function SourcingSection({ categories, settings }: { categories: SourcingCategory[]; settings: SourcingSettings }) {
  return (
    <section aria-labelledby="sourcing-heading" className="py-14 md:py-20">
      <Container>
        <div className="mx-auto mb-10 max-w-2xl text-center md:mb-14">
          <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-cyan-600">{settings.eyebrow}</p>
          <h2 id="sourcing-heading" className="mb-4 font-heading text-3xl font-bold text-gray-900 sm:text-4xl md:text-5xl">{settings.heading}</h2>
          <p className="text-base leading-relaxed text-gray-600 md:text-lg">{settings.description}</p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((category) => (
            <article key={category.id} className="rounded-xl border border-gray-100 bg-white p-4 shadow-[0_0_10px_rgba(0,0,0,0.08)] transition duration-300 hover:-translate-y-1 hover:shadow-lg motion-reduce:transform-none motion-reduce:transition-none">
              {category.imageUrl && (
                <div className="relative aspect-square overflow-hidden rounded-lg bg-gray-100">
                  <Image src={category.imageUrl} alt={category.imageAlt} fill sizes="(min-width: 1280px) 264px, (min-width: 1024px) 23vw, (min-width: 640px) 46vw, 90vw" className="object-cover" />
                </div>
              )}
              <div className="px-2 pb-2 pt-5">
                <h3 className="mb-2 font-heading text-xl font-bold text-gray-900">{category.title}</h3>
                <p className="text-sm leading-relaxed text-gray-600">{category.description}</p>
              </div>
            </article>
          ))}
        </div>
        <div className="mt-10 flex justify-center md:mt-14">
          <Link href={settings.ctaHref} className="speak-link">{settings.ctaText}</Link>
        </div>
      </Container>
    </section>
  );
}
