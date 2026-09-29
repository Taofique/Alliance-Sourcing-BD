import Image from "next/image";
import Container from "@/components/layout/container";
import { buyingHouseContent } from "@/lib/buying-house-sections";

/**
 * The six buying house service cards on /buying-house.
 *
 * Ported from the reference `ServicesGrid`: a 1/2/3-column grid, each card
 * lifted 8px on hover and inverted onto the brand cyan, and the icon drawn at
 * 48px with no tinted tile behind it, because the reference icons are
 * transparent 512x512 PNGs rather than line glyphs.
 */
export default function BuyingHouseServicesSection() {
  const { eyebrow, heading, description, items } = buyingHouseContent.services;

  return (
    <section
      aria-labelledby="buying-house-services-heading"
      className="bg-white py-16 md:py-24"
    >
      <Container>
        <div className="text-center mb-16">
          <p className="text-sm font-semibold text-cyan-600 mb-3 uppercase tracking-wider">
            {eyebrow}
          </p>
          <h2
            id="buying-house-services-heading"
            className="font-heading text-4xl sm:text-5xl font-bold text-slate-900 mb-4"
          >
            {heading}
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            {description}
          </p>
        </div>

        <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => (
            <li
              key={item.id}
              className="hover:-mt-2 transition-all duration-500 motion-reduce:transition-none"
            >
              <article className="group bg-white rounded-lg overflow-hidden shadow-[0px_0px_10px_rgba(0,0,0,0.08)] hover:bg-[#0C97D5] transition-all duration-300 hover:shadow-[0px_0px_15px_rgba(0,162,199,0.5)] motion-reduce:transition-none">
                <div className="p-4">
                  <div className="text-3xl xl:text-4xl mb-6 text-cyan-500">
                    <Image
                      src={item.icon}
                      alt={item.title}
                      width={48}
                      height={48}
                    />
                  </div>
                  <h3 className="font-heading text-base font-semibold text-slate-900 group-hover:text-white mb-1">
                    {item.title}
                  </h3>
                  <p className="text-slate-600 group-hover:text-white leading-relaxed text-xs">
                    {item.description}
                  </p>
                </div>
              </article>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
