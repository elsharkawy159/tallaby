"use client";

import * as React from "react";

const MotionRuntime = React.lazy(() => import("./runtime.client"));
const SmoothScroll = React.lazy(() => import("./smooth-scroll.client"));

/** True once the browser is idle after hydration (or soon after, where idle callbacks are missing). */
function useWhenIdle(enabled = true): boolean {
  const [ready, setReady] = React.useState(false);
  React.useEffect(() => {
    if (!enabled) return;
    if (typeof window.requestIdleCallback === "function") {
      const id = window.requestIdleCallback(() => setReady(true), {
        timeout: 1200,
      });
      return () => window.cancelIdleCallback(id);
    }
    const id = window.setTimeout(() => setReady(true), 200);
    return () => window.clearTimeout(id);
  }, [enabled]);
  return ready;
}

/**
 * Turns on the scroll presets for everything inside it. Children stay server
 * components; the GSAP runtime is fetched after hydration, when the browser
 * is idle, and removed (with every trigger it made) on unmount.
 */
export function MotionScope({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = React.useRef<HTMLDivElement>(null);
  const ready = useWhenIdle();
  return (
    <div ref={ref} data-motion-scope="" className={className}>
      {children}
      {ready ? (
        <React.Suspense fallback={null}>
          <MotionRuntime scope={ref} />
        </React.Suspense>
      ) : null}
    </div>
  );
}

/**
 * Lenis smooth scrolling, driven by GSAP's ticker so ScrollTrigger stays in
 * sync. Off with reduced motion and on touch (native scrolling there), paused
 * while a dialog locks the page. `offset` keeps in-page anchor links clear of
 * a sticky header (px).
 */
export function SmoothScrollProvider({ children, offset = 0 }: { children?: React.ReactNode; offset?: number }) {
  const ready = useWhenIdle();
  return (
    <>
      {children}
      {ready ? (
        <React.Suspense fallback={null}>
          <SmoothScroll offset={offset} />
        </React.Suspense>
      ) : null}
    </>
  );
}
