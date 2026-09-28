"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  isLoadingOverlayActive,
  setLoadingOverlayActive,
  subscribeLoadingOverlay,
} from "@/lib/loader-overlay";

export type LoaderLogo = {
  src: string;
  alt: string;
};

type BrandedLoaderScreenProps = {
  logos: LoaderLogo[];
  /**
   * "intro" and "transition" are decoration played over content that is
   * already rendered. "loading" is the real route wait mounted by
   * `loading.tsx`, which React unmounts on its own as soon as the segment
   * resolves.
   */
  variant: "intro" | "transition" | "loading";
  /** True while the overlay owns the viewport, so the page cannot scroll under it. */
  lockScroll?: boolean;
  /** Called once the overlay has finished fading, so the parent can drop it. */
  onDone?: () => void;
};

const FADE_OUT_MS = 700;

/**
 * Ceilings, not delays. The intro also ends as soon as the window `load` event
 * fires, and a transition is always short — there is no fixed multi-second wait
 * anywhere in this component.
 */
const INTRO_MAX_MS = 1300;
const TRANSITION_MS = 400;

/** Used by `loading.tsx`, which cannot await settings. */
export const LOADER_FALLBACK_LOGOS: LoaderLogo[] = [
  { src: "/logo2.png", alt: "Alliance Apparels Ltd." },
  { src: "/logo.jpg", alt: "Alliance Sourcing BD" },
];

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export default function BrandedLoaderScreen({
  logos,
  variant,
  lockScroll = false,
  onDone,
}: BrandedLoaderScreenProps) {
  const marks = logos.length > 0 ? logos : LOADER_FALLBACK_LOGOS;
  const decorative = variant !== "loading";

  const [leaving, setLeaving] = useState(false);
  const [gone, setGone] = useState(false);

  const timers = useRef<Array<ReturnType<typeof setTimeout>>>([]);

  // Held in a ref so an inline callback from the parent can never restart the
  // fade timers mid-fade. Synced in an effect, never during render.
  const onDoneRef = useRef(onDone);

  useEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);

  function later(fn: () => void, ms: number) {
    const id = setTimeout(fn, ms);
    timers.current.push(id);
    return id;
  }

  useEffect(() => {
    return () => {
      for (const id of timers.current) clearTimeout(id);
      timers.current = [];
    };
  }, []);

  // A real route wait is announced once and is never animated out: React
  // unmounts the fallback the moment the segment is ready.
  useEffect(() => {
    if (variant !== "loading") return;
    setLoadingOverlayActive(true);
    return () => setLoadingOverlayActive(false);
  }, [variant]);

  // The intro and the transition stand down the moment a genuine loading
  // fallback takes over, so the two overlays never stack.
  useEffect(() => {
    if (!decorative) return;

    return subscribeLoadingOverlay(() => {
      if (isLoadingOverlayActive()) {
        setLeaving(true);
        setGone(true);
        onDoneRef.current?.();
      }
    });
  }, [decorative]);

  useEffect(() => {
    if (!decorative || gone) return;

    const dismiss = () => setLeaving(true);
    const onLoad = () => dismiss();

    // The intro covers the first paint, so it waits for the window `load` event
    // but never past its ceiling.
    const waitsForLoad =
      variant === "intro" && document.readyState !== "complete";

    if (waitsForLoad) window.addEventListener("load", onLoad, { once: true });
    const hold = later(
      dismiss,
      variant === "intro" ? INTRO_MAX_MS : TRANSITION_MS,
    );

    return () => {
      window.removeEventListener("load", onLoad);
      clearTimeout(hold);
    };
  }, [decorative, gone, variant]);

  // Leaving and being removed are separate steps, so the fade is never cut
  // short by a remount, and a stuck fade can never leave an invisible element
  // sitting over the page swallowing clicks.
  useEffect(() => {
    if (!leaving || gone) return;
    later(() => {
      setGone(true);
      onDoneRef.current?.();
    }, FADE_OUT_MS);
  }, [leaving, gone]);

  useEffect(() => {
    // Reduced motion: the overlay is already hidden by CSS, so there is nothing
    // to gain from freezing the page behind it either.
    if (!lockScroll || prefersReducedMotion()) return;

    const root = document.documentElement;
    const previous = root.style.overflow;
    root.style.overflow = "hidden";

    return () => {
      // Put back exactly what was there, not a guess.
      root.style.overflow = previous;
    };
  }, [lockScroll]);

  if (gone) return null;

  return (
    <div
      {...(decorative
        ? { "aria-hidden": true as const }
        : { role: "status" as const, "aria-live": "polite" as const })}
      data-decorative={decorative ? "true" : "false"}
      className={`loader-screen fixed inset-0 z-[999] flex flex-col items-center justify-center bg-white transition-opacity duration-700 ease-in-out ${
        leaving ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
    >      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.05)_0%,transparent_70%)]"
      />

      <div className="relative flex flex-col items-center gap-4">
        <div className="loader-float flex animate-bounce-soft items-center gap-6 md:gap-10">
          {marks.map((logo) => (
            <div key={logo.src} className="relative size-10 md:size-14">
              <Image
                src={logo.src}
                alt={decorative ? "" : logo.alt}
                fill
                className="rounded-xl object-contain shadow-xl"
                priority
              />
            </div>
          ))}
        </div>

        <div className="flex flex-col items-center px-4 text-center">
          {/*
            A styled paragraph, never a heading: the loader is decoration, and
            the page underneath keeps the document's single h1.
          */}
          <p
            className={`mb-2 font-heading text-2xl font-black tracking-tighter text-slate-900 md:text-4xl ${
              decorative ? "" : "sr-only"
            }`}
          >
            ALLIANCE
          </p>

          <div className="flex items-center gap-3">
            <div className="h-px w-4 bg-cyan-500" />
            <p className="text-[6px] font-bold tracking-[0.4em] text-cyan-600 uppercase md:text-[10px]">
              Group of Companies
            </p>
            <div className="h-px w-4 bg-cyan-500" />
          </div>
        </div>
      </div>

      {!decorative && <p className="sr-only">Loading the next page.</p>}

      {decorative && (
        <div
          aria-hidden="true"
          className="loader-bar absolute bottom-0 left-0 h-1.5 bg-cyan-500"
        />
      )}
    </div>
  );
}
