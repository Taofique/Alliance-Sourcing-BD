"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import BrandedLoaderScreen, {
  type LoaderLogo,
} from "@/components/common/branded-loader-screen";
import {
  isLoadingOverlayActive,
  subscribeLoadingOverlay,
} from "@/lib/loader-overlay";

type PublicBrandingLoaderProps = {
  logos: LoaderLogo[];
};

type Phase = {
  kind: "intro" | "transition";
  /** Bumped per appearance so each one mounts a fresh screen. */
  id: number;
};

const INTRO_CEILING_MS = 1300;
const TRANSITION_CEILING_MS = 400;
const FADE_MS = 700;

/**
 * Drives the two decorative appearances of the branded loader on public pages:
 * a bounded introduction on first entry, and a brief transition after a
 * completed pathname change. Real route waits are handled separately by
 * `app/(site)/loading.tsx`, which also tells this component to stand down so
 * the two never overlap.
 *
 * This lives inside the persistent `(site)` layout, which does NOT remount on
 * navigation — the change is detected from `usePathname()` rather than from a
 * remount. `usePathname()` excludes the search string and hash, so a hash or
 * query-only change replays nothing.
 */
export default function PublicBrandingLoader({
  logos,
}: PublicBrandingLoaderProps) {
  const pathname = usePathname();
  // Starts visible on purpose: the introduction has to be in the server HTML so
  // it covers the very first paint instead of popping in after hydration. It is
  // still a short, bounded overlay, never a fixed wait.
  const [phase, setPhase] = useState<Phase | null>({ kind: "intro", id: 0 });

  const previousPathname = useRef<string | null>(null);
  const nextId = useRef(0);

  // A real route wait is already covering the screen, so the decorative overlay
  // stands aside instead of stacking on top of it. Subscribed rather than read
  // during render, so a `loading.tsx` overlay appearing or clearing re-renders
  // this component and the intro/transition is skipped either way.
  const routeWaitActive = useSyncExternalStore(
    subscribeLoadingOverlay,
    isLoadingOverlayActive,
    () => false,
  );

  useEffect(() => {
    if (previousPathname.current === null) {
      previousPathname.current = pathname;
      return;
    }

    if (previousPathname.current === pathname) return;
    previousPathname.current = pathname;

    nextId.current += 1;
    setPhase({ kind: "transition", id: nextId.current });
  }, [pathname]);

  // Backstop: whatever the screen decides, the overlay is removed from the
  // tree on time, so nothing invisible can ever be left over the page.
  useEffect(() => {
    if (!phase) return;

    const ceiling =
      (phase.kind === "intro" ? INTRO_CEILING_MS : TRANSITION_CEILING_MS) +
      FADE_MS +
      400;

    const timer = setTimeout(() => setPhase(null), ceiling);
    return () => clearTimeout(timer);
  }, [phase]);

  if (!phase || routeWaitActive) return null;

  return (
    <BrandedLoaderScreen
      key={phase.id}
      logos={logos}
      variant={phase.kind}
      lockScroll={phase.kind === "intro"}
      onDone={() => setPhase(null)}
    />
  );
}
