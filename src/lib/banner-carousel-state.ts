export const AUTOPLAY_INTERVAL_MS = 4000;

/** Loop-safe index. Never returns a value outside 0..count-1. */
export function wrapIndex(target: number, count: number) {
  if (count <= 0) return 0;
  return ((target % count) + count) % count;
}

/**
 * Index actually rendered. A shortened or reordered slide list can never leave
 * a dangling index behind.
 */
export function resolveIndex(rawIndex: number, count: number) {
  if (count <= 0) return 0;
  return Math.min(Math.max(rawIndex, 0), count - 1);
}

export type RotationPauseReasons = {
  count: number;
  userPaused: boolean;
  reducedMotion: boolean;
  pointerInside: boolean;
  focusInside: boolean;
};

/** One slide never rotates, so autoplay and its controls are redundant. */
export function isRotationPaused({
  count,
  userPaused,
  reducedMotion,
  pointerInside,
  focusInside,
}: RotationPauseReasons) {
  return (
    count <= 1 ||
    userPaused ||
    reducedMotion ||
    pointerInside ||
    focusInside
  );
}

export function isExternalCtaHref(href: string) {
  return !href.startsWith("/");
}
