"use client";

import { useId, useState } from "react";
import { ChevronDown } from "lucide-react";
import type { Faq } from "@/types/faq";

/**
 * The single-open accordion behind the /global-partners FAQ band.
 *
 * The reference page uses a Radix accordion wrapped in a shadcn component. This
 * project ships no accordion dependency, so the same behaviour is implemented
 * directly: at most one panel is open, and pressing the open trigger closes it
 * again ("collapsible").
 *
 * Two details are deliberate:
 *
 * - The trigger is a real `<button>` inside a heading, so keyboard, screen reader
 *   and browser find-in-page all work the way they do on the live page.
 * - The panel animates with the `grid-template-rows` 0fr→1fr transition rather
 *   than a height keyframe, so it needs no extra CSS and respects
 *   `prefers-reduced-motion` through the shared `motion-reduce:` variant.
 */
export default function FaqAccordion({ faqs }: { faqs: Faq[] }) {
  const baseId = useId();
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      {faqs.map((faq) => {
        const isOpen = openId === faq.id;
        const triggerId = `${baseId}-${faq.id}-trigger`;
        const panelId = `${baseId}-${faq.id}-panel`;

        return (
          <div
            key={faq.id}
            data-state={isOpen ? "open" : "closed"}
            className="overflow-hidden rounded-lg bg-white px-6 shadow-sm"
          >
            <h3 className="flex">
              <button
                type="button"
                id={triggerId}
                aria-expanded={isOpen}
                aria-controls={panelId}
                data-state={isOpen ? "open" : "closed"}
                onClick={() => setOpenId(isOpen ? null : faq.id)}
                className="flex flex-1 items-start justify-between gap-4 py-5 text-left text-lg font-bold text-slate-800 outline-none transition-all hover:no-underline focus-visible:ring-[3px] focus-visible:ring-blue-600/30 [&[data-state=open]>svg]:rotate-180"
              >
                {faq.question}
                <ChevronDown
                  aria-hidden="true"
                  className="pointer-events-none mt-0.5 size-4 shrink-0 translate-y-0.5 text-muted-foreground transition-transform duration-200"
                />
              </button>
            </h3>

            <div
              id={panelId}
              role="region"
              aria-labelledby={triggerId}
              data-state={isOpen ? "open" : "closed"}
              className={`grid transition-[grid-template-rows] duration-200 motion-reduce:transition-none ${
                isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
              }`}
            >
              <div className="overflow-hidden">
                <div className="pb-5 text-base leading-relaxed text-slate-600">
                  {faq.answer}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
