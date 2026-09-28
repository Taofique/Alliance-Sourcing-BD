/**
 * A tiny module-level signal, not a store or a context.
 *
 * The branded loader has three independent triggers — the first-visit intro,
 * the real route-loading fallback from `loading.tsx`, and the short transition
 * played on a completed pathname change. The intro/transition component lives
 * in the persistent public layout, so React alone cannot tell it that a
 * `loading.tsx` overlay is currently on screen. This one boolean closes that
 * gap: while a real loading fallback is up, the intro does not start, and an
 * intro already on screen stands down instead of stacking a second overlay.
 *
 * `loading.tsx` is rendered by React only while a route is actually waiting, so
 * this can never leave a stuck flag: the effect that sets it always runs its
 * cleanup on unmount.
 */

let loadingOverlayActive = false;

const listeners = new Set<() => void>();

function notify() {
  for (const listener of listeners) listener();
}

export function isLoadingOverlayActive() {
  return loadingOverlayActive;
}

export function setLoadingOverlayActive(active: boolean) {
  if (loadingOverlayActive === active) return;
  loadingOverlayActive = active;
  notify();
}

export function subscribeLoadingOverlay(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
