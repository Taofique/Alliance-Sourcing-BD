import Image from "next/image";
import { CheckCircle2 } from "lucide-react";
import Container from "@/components/layout/container";
import { buyingHouse } from "@/lib/homepage-sections";
import type { FeatureItem } from "@/types/homepage-sections";

function Feature({ feature }: { feature: FeatureItem }) {
  return (
    <li className="flex gap-4">
      <CheckCircle2
        className="mt-0.5 size-5 shrink-0 text-cyan-600 sm:size-6"
        aria-hidden="true"
      />
      <div className="min-w-0">
        <h3 className="font-heading mb-1 text-base font-semibold text-slate-900">
          {feature.title}
        </h3>
        <p className="text-sm leading-relaxed text-slate-600">
          {feature.description}
        </p>
      </div>
    </li>
  );
}

/**
 * "Professional buying house services": the supplied photograph beside the
 * company statement and its three value propositions.
 */
export default function BuyingHouseSection() {
  const imageFirst = buyingHouse.imagePosition === "left";

  return (
    <section
      aria-labelledby="buying-house-heading"
      className="bg-blue-50 py-14 md:py-20"
    >
      <Container>
        <div className="grid grid-cols-1 items-center gap-8 md:grid-cols-2 lg:gap-12">
          <div
            className={`relative aspect-4/3 overflow-hidden rounded-2xl sm:aspect-16/10 md:aspect-auto md:h-[28rem] ${
              imageFirst ? "" : "md:order-2"
            }`}
          >
            <Image
              src={buyingHouse.image}
              alt={buyingHouse.imageAlt}
              fill
              sizes="(min-width: 768px) 50vw, 100vw"
              className="object-cover"
            />
          </div>

          <div className={imageFirst ? "" : "md:order-1"}>
            <p className="mb-2 text-xs font-semibold tracking-widest text-cyan-600 uppercase sm:text-sm">
              {buyingHouse.eyebrow}
            </p>

            <h2
              id="buying-house-heading"
              className="font-heading text-3xl leading-tight font-bold text-slate-900 sm:text-4xl md:text-5xl"
            >
              {buyingHouse.heading}
            </h2>

            <p className="mt-4 mb-8 text-base leading-relaxed text-slate-600 md:text-lg">
              {buyingHouse.description}
            </p>

            <ul className="space-y-5">
              {buyingHouse.features.map((feature) => (
                <Feature key={feature.id} feature={feature} />
              ))}
            </ul>
          </div>
        </div>
      </Container>
    </section>
  );
}
