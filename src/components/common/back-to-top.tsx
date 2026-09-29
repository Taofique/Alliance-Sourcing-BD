"use client";

import { useEffect, useState } from "react";
import { ChevronUp } from "lucide-react";

/** Hidden until the page has been scrolled this far down. */
const SHOW_AFTER_PX = 400;

/**
 * The "Back to Top" pill in the bottom-right corner.
 *
 * Hidden below the scroll threshold, then a 50px black circle that widens to a
 * cyan pill on hover while the chevron slides up and the label appears.
 *
 * The hidden state uses `opacity-0` with `pointer-events-none` rather than being
 * unmounted, so the entrance is a transition. Because it stays in the tree it is
 * also still keyboard reachable, so while it is invisible it is additionally
 * removed from the tab order and hidden from assistive technology.
 */
export default function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const update = () => setVisible(window.scrollY > SHOW_AFTER_PX);

    // Covers a load that restores a scrolled position, which fires no scroll
    // event of its own.
    update();

    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  function scrollToTop() {
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
  }

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label="Back to top"
      aria-hidden={visible ? undefined : true}
      tabIndex={visible ? 0 : -1}
      className={[
        "group fixed right-6 bottom-6 z-50",
        "flex h-[50px] w-[50px] items-center justify-center overflow-hidden rounded-full",
        "border-none bg-black text-white",
        "shadow-[0px_0px_0px_4px_rgba(180,160,255,0.25)]",
        "transition-all duration-300 ease-in-out",
        "hover:w-[140px] hover:rounded-[50px] hover:bg-[#00b8db] motion-reduce:transition-none",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white",
        visible
          ? "translate-y-0 opacity-100"
          : "pointer-events-none translate-y-10 opacity-0",
      ].join(" ")}
    >
      <div className="flex items-center justify-center transition-transform duration-300 group-hover:-translate-y-[200%] motion-reduce:transition-none motion-reduce:group-hover:translate-y-0">
        <ChevronUp className="size-5" strokeWidth={3} aria-hidden="true" />
      </div>

      <span
        aria-hidden="true"
        className="absolute translate-y-10 text-[0px] font-semibold whitespace-nowrap opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:text-[13px] group-hover:opacity-100 motion-reduce:transition-none"
      >
        Back to Top
      </span>
    </button>
  );
}
