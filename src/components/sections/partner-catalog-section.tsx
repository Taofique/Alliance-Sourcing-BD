"use client";

import Image from "next/image";
import { useState } from "react";
import {
  globalPartnersContent,
  type PartnerClient,
  type PartnerRegion,
} from "@/lib/global-partners-sections";

/**
 * The client logo wall, filterable by region.
 *
 * Ported from the reference `PartnerCatalog`. The logos are bundled files rather
 * than uploads, so they are known at build time and rendered through
 * `next/image` instead of a bare `<img>`.
 *
 * The filter needs client state, but the copy and the logo list are read from
 * `lib/global-partners-sections` so the ten partners stay in one place.
 */
export default function PartnerCatalog() {
  const { heading, description, regions, clients } = globalPartnersContent.partners;
  const [activeRegion, setActiveRegion] = useState<PartnerRegion>("All Clients");

  const visibleClients =
    activeRegion === "All Clients"
      ? clients
      : clients.filter((client) => client.region === activeRegion);

  return (
    <section aria-labelledby="global-partners-catalog-heading" className="bg-[#F3F4F6] py-20">
      <div className="mx-auto max-w-7xl px-4 text-center">
        <h2
          id="global-partners-catalog-heading"
          className="mb-6 text-4xl font-bold text-slate-900 md:text-5xl"
        >
          {heading}
        </h2>
        <p className="mx-auto mb-12 max-w-3xl text-lg leading-relaxed text-slate-600">
          {description}
        </p>

        <div
          role="group"
          aria-label="Filter partners by region"
          className="mb-12 flex flex-wrap justify-center gap-2"
        >
          {regions.map((region) => {
            const isActive = region === activeRegion;

            return (
              <button
                key={region}
                type="button"
                aria-pressed={isActive}
                onClick={() => setActiveRegion(region)}
                className={`px-8 py-3 text-sm font-semibold transition-all duration-300 ${
                  isActive
                    ? "bg-[#0B69BF] text-white shadow-lg"
                    : "bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                {region}
              </button>
            );
          })}
        </div>

        <ul className="grid grid-cols-2 gap-6 px-4 md:grid-cols-4 md:px-16">
          {visibleClients.map((client: PartnerClient) => (
            <li
              key={client.name}
              className="group relative flex h-40 items-center justify-center transition-all duration-300"
            >
              {/* Border plate: fills with a blue gradient on hover, behind the logo. */}
              <div
                aria-hidden="true"
                className="absolute inset-0 z-0 border border-[#E2E8F0] bg-white transition-all duration-500 group-hover:border-transparent group-hover:bg-[linear-gradient(180deg,#47B8FF_0%,#3A7DE9_100%)] group-hover:shadow-xl"
              />

              <div className="relative z-10 flex h-full w-full items-center justify-center p-8">
                <Image
                  src={client.logo}
                  alt={client.name}
                  width={120}
                  height={60}
                  className="max-h-15 max-w-full object-contain transition-transform duration-300 group-hover:scale-110"
                />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
