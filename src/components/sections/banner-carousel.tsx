"use client";

import Image from "next/image";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import {
  AUTOPLAY_INTERVAL_MS,
  isExternalCtaHref,
  isRotationPaused,
  resolveIndex,
  wrapIndex,
} from "@/lib/banner-carousel-state";
import type { BannerCta, BannerSlide } from "@/types/banner";

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  return reduced;
}

function CtaLink({ cta, className }: { cta: BannerCta; className?: string }) {
  if (isExternalCtaHref(cta.href)) {
    return (
      <a
        href={cta.href}
        className={className}
        target="_blank"
        rel="noopener noreferrer"
      >
        {cta.text}
      </a>
    );
  }

  return (
    <Link href={cta.href} className={className}>
      {cta.text}
    </Link>
  );
}

export default function BannerCarousel({
  slides,
}: {
  slides: BannerSlide[];
}) {
  const baseId = useId();
  const reducedMotion = usePrefersReducedMotion();

  const [rawIndex, setIndex] = useState(0);
  // Explicit user choice. Hover/focus pauses are separate and reversible.
  const [userPaused, setUserPaused] = useState(false);
  const [pointerInside, setPointerInside] = useState(false);
  const [focusInside, setFocusInside] = useState(false);
  const regionRef = useRef<HTMLDivElement>(null);

  const count = slides.length;
  const hasCarousel = count > 1;

  // A shorter or reordered slide list can never leave the index dangling: the
  // rendered index is always derived, and every mutation starts from it.
  const index = resolveIndex(rawIndex, count);

  const paused = isRotationPaused({
    count,
    userPaused,
    reducedMotion,
    pointerInside,
    focusInside,
  });

  const goTo = useCallback(
    (target: number) => setIndex(wrapIndex(target, count)),
    [count],
  );

  const previous = useCallback(() => goTo(index - 1), [goTo, index]);
  const next = useCallback(() => goTo(index + 1), [goTo, index]);

  useEffect(() => {
    if (paused) return;
    const timer = window.setTimeout(
      () => goTo(index + 1),
      AUTOPLAY_INTERVAL_MS,
    );
    return () => window.clearTimeout(timer);
  }, [goTo, index, paused]);

  const onKeyDown = (event: ReactKeyboardEvent<HTMLElement>) => {
    if (!hasCarousel) return;

    if (event.key === "ArrowLeft") {
      event.preventDefault();
      previous();
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      next();
    } else if (event.key === "Home") {
      event.preventDefault();
      goTo(0);
    } else if (event.key === "End") {
      event.preventDefault();
      goTo(count - 1);
    }
  };

  const current = slides[index];

  if (count === 0 || !current) {
    return (
      <section className="bg-slate-900 text-white">
        <div className="mx-auto w-full max-w-7xl px-4 py-24 text-center sm:px-6 lg:px-8">
          <h1 className="font-heading text-2xl font-bold md:text-5xl">
            Alliance Sourcing BD
          </h1>
          <p className="mt-4 text-sm text-white/70 md:text-base">
            Professional buying and sourcing services for apparel and garment
            manufacturing.
          </p>
        </div>
      </section>
    );
  }

  const renderContent = (slide: BannerSlide, isCurrent: boolean): ReactNode => (
    <div className="relative flex flex-col items-center px-12 pb-48 pt-12 md:pb-52 md:pt-26">
      <div className="mx-auto w-full max-w-7xl px-4 md:px-8">
        <div className="text-center">
          {isCurrent ? (
            <h1
              className="animate-[banner-rise_0.7s_ease-out_both] font-heading text-2xl font-bold text-white md:text-5xl 2xl:text-6xl motion-reduce:animate-none"
            >
              {slide.title}
            </h1>
          ) : (
            // Kept out of the accessibility tree so autoplay stays quiet.
            <p
              aria-hidden="true"
              className="font-heading text-2xl font-bold text-white md:text-5xl 2xl:text-6xl"
            >
              {slide.title}
            </p>
          )}

          <p
            className="mx-auto mt-4 max-w-5xl animate-[banner-rise_0.7s_ease-out_0.1s_both] text-sm text-white/90 2xl:text-xl motion-reduce:animate-none"
          >
            {slide.description}
          </p>

          {slide.cta && (
            <div className="mt-8 flex justify-center">
              {isCurrent ? (
                <CtaLink cta={slide.cta} className="speak-link mb-2" />
              ) : (
                // Inactive slides must stay out of the tab order.
                <span aria-hidden="true" className="speak-link mb-2 opacity-0">
                  {slide.cta.text}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <section
      ref={regionRef}
      aria-roledescription="carousel"
      aria-label="Homepage banners"
      onKeyDown={onKeyDown}
      onPointerEnter={(event: ReactPointerEvent<HTMLElement>) => {
        // Touch pointers would otherwise leave a sticky "hover" pause.
        if (event.pointerType === "mouse") setPointerInside(true);
      }}
      onPointerLeave={(event: ReactPointerEvent<HTMLElement>) => {
        if (event.pointerType === "mouse") setPointerInside(false);
      }}
      onFocusCapture={() => setFocusInside(true)}
      onBlurCapture={(event) => {
        if (!regionRef.current?.contains(event.relatedTarget as Node | null)) {
          setFocusInside(false);
        }
      }}
      className="group relative grid min-h-125 w-full overflow-hidden bg-slate-900 md:min-h-150 xl:min-h-[max(600px,calc(100svh-60px))]"
    >
      {slides.map((slide, slideIndex) => {
        const isCurrent = slideIndex === index;

        return (
          <div
            key={slide.id}
            id={`${baseId}-slide-${slideIndex}`}
            role="group"
            aria-roledescription="slide"
            aria-label={`${slideIndex + 1} of ${count}`}
            aria-hidden={!isCurrent}
            inert={!isCurrent}
            className={`relative col-start-1 row-start-1 min-w-0 transition-opacity duration-1000 motion-reduce:transition-none ${
              isCurrent
                ? "z-10 opacity-100"
                : "pointer-events-none z-0 opacity-0"
            }`}
          >
            <Image
              src={slide.imageUrl}
              alt={slide.imageAlt}
              fill
              sizes="100vw"
              loading={slideIndex === 0 ? "eager" : "lazy"}
              fetchPriority={slideIndex === 0 ? "high" : "auto"}
              className="object-cover"
            />

            <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />

            {renderContent(slide, isCurrent)}
          </div>
        );
      })}

      {hasCarousel && (
        <>
          <button
            type="button"
            onClick={previous}
            aria-label="Previous banner"
            aria-controls={`${baseId}-slide-${index}`}
            className="absolute left-4 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white/25 p-2 text-white backdrop-blur-sm transition-colors hover:bg-white/45 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            <ChevronLeft className="size-6" aria-hidden="true" />
          </button>

          <button
            type="button"
            onClick={next}
            aria-label="Next banner"
            aria-controls={`${baseId}-slide-${index}`}
            className="absolute right-4 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white/25 p-2 text-white backdrop-blur-sm transition-colors hover:bg-white/45 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            <ChevronRight className="size-6" aria-hidden="true" />
          </button>

          <div className="absolute bottom-32 left-4 right-28 z-20 flex flex-wrap justify-center gap-2 md:bottom-36 md:left-28">
            {slides.map((slide, slideIndex) => {
              const isCurrent = slideIndex === index;

              return (
                <button
                  key={slide.id}
                  type="button"
                  onClick={() => goTo(slideIndex)}
                  aria-label={`Show banner ${slideIndex + 1}: ${slide.title}`}
                  aria-current={isCurrent ? "true" : undefined}
                  className={`h-2 rounded-full transition-all duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${
                    isCurrent
                      ? "w-8 bg-white"
                      : "w-2 bg-white/50 hover:bg-white/75"
                  }`}
                />
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => setUserPaused((value) => !value)}
            aria-pressed={userPaused}
            aria-label={userPaused ? "Play banner rotation" : "Pause banner rotation"}
            className="absolute bottom-30 right-4 z-20 md:bottom-34 md:right-6 inline-flex min-h-9 items-center gap-1.5 rounded-full bg-white/25 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm transition-colors hover:bg-white/45 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            {userPaused || reducedMotion ? (
              <Play className="size-3.5" aria-hidden="true" />
            ) : (
              <Pause className="size-3.5" aria-hidden="true" />
            )}
            {userPaused || reducedMotion ? "Play" : "Pause"}
          </button>
        </>
      )}
    </section>
  );
}

