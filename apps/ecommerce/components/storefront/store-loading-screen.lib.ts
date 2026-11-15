import { LOADING_SCREEN_MAX_MS, LOADING_SCREEN_MIN_MS, type LoadingScreenView } from "@workspace/lib/stores/loading-screen";

/**
 * Store loading screen (ROADMAP.md F-96) on the store website: the CSS and the
 * fixed first-party script that removes it. No seller text ever reaches the
 * CSS or the script: the CSS takes only validated numbers and an rgba() built
 * from a checked hex colour, and the image URL goes into an <img> attribute.
 */

export const LOADING_SCREEN_ID = "tly-ls";
/** sessionStorage key: shown once per browser session on this store host. */
const SEEN_KEY = "tly-ls-seen";
const FADE_MS = 300;

/** The overlay's CSS. A CSS-only fallback hides it by the max time even if the script never runs. */
export function loadingScreenCss(view: LoadingScreenView): string {
  const id = `#${LOADING_SCREEN_ID}`;
  const blur = Math.max(0, Math.round(view.blur));
  const backdrop = blur ? `-webkit-backdrop-filter:blur(${blur}px);backdrop-filter:blur(${blur}px);` : "";
  const image =
    view.size.mode === "full"
      ? `${id} img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}`
      : `${id} img{display:block;width:${Math.round(view.size.px)}px;max-width:90vw;height:auto;object-fit:contain}`;
  const fallbackDelay = (LOADING_SCREEN_MAX_MS - FADE_MS) / 1000;
  return [
    `${id}{position:fixed;inset:0;z-index:2147483000;display:grid;place-items:center;overflow:hidden;background:${view.background};${backdrop}transition:opacity ${FADE_MS}ms ease;animation:tly-ls-out ${FADE_MS}ms ease ${fallbackDelay}s forwards}`,
    `${id}[data-fade]{opacity:0;pointer-events:none}`,
    `${id}[data-done]{display:none}`,
    image,
    `@keyframes tly-ls-out{to{opacity:0;visibility:hidden;pointer-events:none}}`,
    `@media (prefers-reduced-motion:reduce){${id}{transition:none;animation-duration:1ms;animation-delay:${(LOADING_SCREEN_MAX_MS - 1) / 1000}s}}`,
  ].join("");
}

/** Hides it at once when JavaScript is off. */
export const LOADING_SCREEN_NOSCRIPT = `<style>#${LOADING_SCREEN_ID}{display:none}</style>`;

/**
 * Runs right after the overlay in the HTML. Hides it at once in an iframe
 * (builder and site previews), on cart/checkout/account paths, or when this
 * session already saw it; otherwise fades it out on `load` after at least the
 * min time, and always by the max time even if `load` never fires. Reduced
 * motion: no fade, hidden after the min time.
 */
export const LOADING_SCREEN_SCRIPT = `(function(){var w=window,d=document,el=d.getElementById("${LOADING_SCREEN_ID}");if(!el)return;function hide(){el.setAttribute("data-done","")}try{if(w.top!==w.self){hide();return}}catch(e){hide();return}if(/^\\/(?:(?:ar|en)(?:\\/|$))?(?:cart|checkout|orders?|profile|account|auth|login|sign-?in|sign-?up|register|wishlist|track|payment|thank-you)(?:\\/|$)/i.test(w.location.pathname)){hide();return}try{if(w.sessionStorage.getItem("${SEEN_KEY}")){hide();return}w.sessionStorage.setItem("${SEEN_KEY}","1")}catch(e){}var start=Date.now(),closed=false,reduce=!!(w.matchMedia&&w.matchMedia("(prefers-reduced-motion: reduce)").matches);function close(){if(closed)return;closed=true;if(reduce){hide();return}el.setAttribute("data-fade","");setTimeout(hide,${FADE_MS})}if(reduce){setTimeout(close,${LOADING_SCREEN_MIN_MS});return}function loaded(){setTimeout(close,Math.max(0,${LOADING_SCREEN_MIN_MS}-(Date.now()-start)))}if(d.readyState==="complete")loaded();else w.addEventListener("load",loaded);setTimeout(close,${LOADING_SCREEN_MAX_MS - FADE_MS})})();`;
