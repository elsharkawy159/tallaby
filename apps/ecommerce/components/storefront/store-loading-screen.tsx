import type { LoadingScreenView } from "@workspace/lib/stores/loading-screen";
import { LOADING_SCREEN_ID, LOADING_SCREEN_NOSCRIPT, LOADING_SCREEN_SCRIPT, loadingScreenCss } from "./store-loading-screen.lib";

/**
 * The store's loading screen (ROADMAP.md F-96), server-rendered into the first
 * HTML so it covers the page from the first paint. Decorative only: hidden
 * from assistive tech, never focusable, and the page stays in the DOM under
 * it. The fixed script after it (store-loading-screen.lib.ts) removes it; a
 * CSS fallback and <noscript> make sure it can never trap a shopper.
 * Renders nothing when the store has none.
 */
export function StoreLoadingScreen({ view }: { view: LoadingScreenView | null }) {
  if (!view) return null;
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: loadingScreenCss(view) }} />
      <noscript dangerouslySetInnerHTML={{ __html: LOADING_SCREEN_NOSCRIPT }} />
      {/* The script sets data-fade / data-done before React hydrates. */}
      <div id={LOADING_SCREEN_ID} aria-hidden="true" suppressHydrationWarning>
        {/* A plain <img>, eager and high priority: next/image would turn a GIF into a still frame. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {view.mediaUrl && <img src={view.mediaUrl} alt="" loading="eager" fetchPriority="high" decoding="async" draggable={false} />}
      </div>
      <script dangerouslySetInnerHTML={{ __html: LOADING_SCREEN_SCRIPT }} />
    </>
  );
}
