import {
  Clock,
  Leaf,
  MessageSquare,
  ShieldCheck,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import {
  globalPartnersContent,
  partnershipStrengths,
} from "@/lib/global-partners-sections";

/**
 * The five partnership strengths on /global-partners.
 *
 * Ported from the reference `PartnershipStrengths`. The card icons are stored in
 * `lib/global-partners-sections` as keys so that file stays free of JSX, and are
 * resolved here in one place — an unknown key would fall back to the clock
 * rather than rendering nothing.
 */
const strengthIcons: Record<string, LucideIcon> = {
  "trending-up": TrendingUp,
  "message-square": MessageSquare,
  "shield-check": ShieldCheck,
  clock: Clock,
  leaf: Leaf,
};

export default function PartnershipStrengths() {
  const { heading, description } = globalPartnersContent.strengths;

  return (
    <section
      aria-labelledby="global-partners-strengths-heading"
      className="bg-white py-20"
    >
      <div className="mx-auto max-w-7xl px-4">
        <div className="mb-16 text-center">
          <h2
            id="global-partners-strengths-heading"
            className="mb-6 text-3xl font-bold text-slate-900 md:text-5xl"
          >
            {heading}
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-slate-600">
            {description}
          </p>
        </div>

        <ul className="flex flex-wrap justify-center gap-6">
          {partnershipStrengths.map((strength) => {
            const Icon = strengthIcons[strength.icon] ?? Clock;

            return (
              <li
                key={strength.title}
                className="group w-full min-w-75 rounded-xl border border-slate-100 bg-white p-8 shadow-sm transition-all duration-300 hover:shadow-md md:w-[calc(33.333%-1.5rem)]"
              >
                <div className="mb-6 flex size-12 items-center justify-center rounded-lg bg-slate-800 transition-colors group-hover:bg-[#0B69BF]">
                  <Icon className="size-6 text-white" aria-hidden="true" />
                </div>

                <h3 className="mb-3 text-xl font-bold text-slate-900">
                  {strength.title}
                </h3>
                <p className="leading-relaxed text-slate-600">
                  {strength.description}
                </p>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
