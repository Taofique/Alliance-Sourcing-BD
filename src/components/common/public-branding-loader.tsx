"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
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
  kind: "intro";
  id: number;
};

const INTRO_CEILING_MS = 1300;
const FADE_MS = 700;

/** Landing page only: the branded introduction, once per browser session. */
const LANDING_PATH = "/";
const SEEN_KEY = "alliance-sourcing-bd:branding-intro-seen";

function readSeen(): boolean {
  try {
    return window.sessionStorage.getItem(SEEN_KEY) === "1";
  } catch {
    // Private browsing or a blocked storage API. The loader still shows, which
    // is the safe failure: a repeated intro beats no intro at all.
    return false;
  }
}

/** Stable no-op subscription: the seen-flag only changes during hydration. */
function subscribeToSeen() {
  return () => {};
}

/**
 * The branded loader introduction for the landing page, and nothing else.
 *
 * It used to play two decorative appearances — a bounded intro on first entry
 * and a short transition on every completed pathname change — which meant the
 * splash replayed on every navbar click. Now it is scoped to `/` and to the
 * first visit in a session, so moving between pages never shows it again.
 *
 * Genuine route waits are still reported by `app/(site)/loading.tsx`, which is
 * rendered by React only while a route is actually streaming. That fallback
 * tells this component to stand down so the two never overlap.
 *
 * This lives inside the persistent `(site)` layout, which does NOT remount on
 * navigation. That is what makes the `sessionStorage` check the deciding factor
 * rather than a remount: returning to `/` later in the session has already
 * consumed the introduction.
 */
export default function PublicBrandingLoader({
  logos,
}: PublicBrandingLoaderProps) {
  const pathname = usePathname();

  // Starts visible on purpose, and only on the landing page: the introduction
  // has to be in the server HTML so it covers the very first paint instead of
  // popping in after hydration. It is a short, bounded overlay, never a wait.
  const [phase, setPhase] = useState<Phase | null>(() =>
    pathname === LANDING_PATH ? { kind: "intro", id: 0 } : null,
  );

  // A real route wait is already covering the screen, so the intro stands
  // aside instead of stacking on top of it. Subscribed rather than read during
  // render, so a `loading.tsx` overlay appearing or clearing re-renders this
  // component and the intro is skipped either way.
  const routeWaitActive = useSyncExternalStore(
    subscribeLoadingOverlay,
    isLoadingOverlayActive,
    () => false,
  );

  /**
   * Read through `useSyncExternalStore` rather than into state from an effect:
   * `sessionStorage` has no server equivalent, so the server snapshot has to
   * report "not seen yet" while the client snapshot reports the truth. React
   * then reconciles it during hydration, and the overlay is gone before the
   * repeat-visit splash could paint.
   */
  const seenIntro = useSyncExternalStore(
    subscribeToSeen,
    readSeen,
    () => false,
  );

  // Records the one-off introduction. Deliberately does not call `setState`.
  useEffect(() => {
    if (pathname !== LANDING_PATH) return;

    try {
      window.sessionStorage.setItem(SEEN_KEY, "1");
    } catch {
      // Non-fatal: the intro is still bounded and removes itself on time.
    }
  }, [pathname]);

  // Backstop: whatever the screen decides, the overlay is removed from the
  // tree on time, so nothing invisible can ever be left over the page.
  useEffect(() => {
    if (!phase) return;

    const timer = setTimeout(
      () => setPhase(null),
      INTRO_CEILING_MS + FADE_MS + 400,
    );

    return () => clearTimeout(timer);
  }, [phase]);

  if (!phase || seenIntro || routeWaitActive) return null;

  return (
    <BrandedLoaderScreen
      key={phase.id}
      logos={logos}
      variant={phase.kind}
      lockScroll
      onDone={() => setPhase(null)}
    />
  );
}
