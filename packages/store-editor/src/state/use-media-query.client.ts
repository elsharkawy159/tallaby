"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * Whether a CSS media query matches. False on the server and during
 * hydration (the desktop layout), then follows the viewport.
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const list = window.matchMedia(query);
      list.addEventListener("change", onChange);
      return () => list.removeEventListener("change", onChange);
    },
    [query],
  );
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  );
}

/** Below Tailwind `lg` (1024px): panels and the inspector open as bottom sheets. */
export const useIsBelowLg = () => useMediaQuery("(max-width: 1023.98px)");
/** Below Tailwind `xl` (1280px), e.g. a 1024px laptop: the open panel floats over the canvas instead of pushing it narrower (owner, F-74). */
export const useIsBelowXl = () => useMediaQuery("(max-width: 1279.98px)");
