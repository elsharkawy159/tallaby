/**
 * Site motion (docs/section-rules.md §6): reveal on scroll and hover zoom.
 * The renderer marks elements with `data-reveal` (`render.tsx`); the motion
 * runtime (`render/motion-runtime.client.tsx`) adds `sf-motion` to the site
 * root and `is-inview` to each element as it enters. Content is hidden only
 * under `sf-motion`, so a page without the script shows everything. Only
 * `opacity` and `transform` move, and nothing moves with reduced motion.
 */
import { ANIMATION_SPEEDS, animationDefaultSchema } from "@workspace/motion/presets";
import { SITE_ROOT_CLASS } from "../core/theme";

export const REVEAL_VARIANTS = ["fade-up", "fade", "zoom-in", "slide-start", "slide-end"] as const;
export type RevealVariant = (typeof REVEAL_VARIANTS)[number];
/** An element's Reveal override (advanced): `auto` lets the renderer pick. */
export const REVEAL_CHOICES = ["auto", ...REVEAL_VARIANTS, "none"] as const;
export type RevealChoice = (typeof REVEAL_CHOICES)[number];

/** Stagger steps: item 7 onwards appears with item 6. */
export const REVEAL_MAX_STEP = 5;
/** A soft "ease out expo": fast start, long gentle settle (owner asked for smoother motion, 2026-10-27). */
export const MOTION_EASE = "cubic-bezier(.16,1,.3,1)";
const STEP_MS = 90;
/** An even ease-out for the slow carousel photo zoom (an expo curve's fast start reads as a pulse). */
const DRIFT_EASE = "cubic-bezier(.33,.2,.35,1)";
/** Leaving speeds up as it goes and is quicker than arriving, so a closing panel gets out of the way. */
const EXIT_EASE = "cubic-bezier(.4,0,1,1)";

/** Seconds per loop of a marquee (`props.speed`); bigger is slower. */
export const MARQUEE_SPEED = { min: 8, max: 120, fallback: 30 } as const;

/** A marquee's loop time from untrusted props, clamped. */
export function marqueeSeconds(value: unknown): number {
  const n = typeof value === "number" && Number.isFinite(value) ? Math.round(value) : MARQUEE_SPEED.fallback;
  return Math.min(MARQUEE_SPEED.max, Math.max(MARQUEE_SPEED.min, n));
}

/** Theme › Animations choices for the editor: the default animation (`auto` first) and the speed. */
export const ANIMATION_DEFAULTS = animationDefaultSchema.options;
export { ANIMATION_SPEEDS };

/** How much longer (or shorter) every reveal runs at each Theme › Animations speed (`--sf-speed`). */
export const REVEAL_SPEED_FACTOR = { slow: 1.6, normal: 1, fast: 0.6 } as const;

/**
 * Root attributes for Theme › Animations (`data-sf-motion="off"`), its speed
 * (`data-sf-speed`) and Hover effect (`data-sf-hover="none"`).
 */
export function siteMotionAttrs(motion: { reveal?: boolean; hoverZoom?: boolean; speed?: string } | null | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  if (motion?.reveal === false) out["data-sf-motion"] = "off";
  if (motion?.hoverZoom === false) out["data-sf-hover"] = "none";
  if (motion?.speed === "slow" || motion?.speed === "fast") out["data-sf-speed"] = motion.speed;
  return out;
}

/**
 * Where a reveal starts, as Web Animations keyframe values (the editor's
 * replay, `render/motion-replay.client.ts`); the same values as the CSS below.
 */
export function revealFrom(variant: string | undefined, rtl: boolean): { transform: string; clipPath?: string } {
  const side = (px: number) => `translate3d(${rtl ? -px : px}px,0,0)`;
  if (variant === "zoom-in") return { transform: "scale(1.1)", clipPath: "inset(6% 6% 6% 6%)" };
  if (variant === "slide-start") return { transform: side(-28) };
  if (variant === "slide-end") return { transform: side(28) };
  if (variant === "fade") return { transform: "none" };
  return { transform: "translate3d(0,28px,0)" };
}

/** Reveal timings in ms at normal speed, as in the CSS below. */
export const REVEAL_TIMING = { duration: 1100, zoomDuration: 1600, step: STEP_MS } as const;

/**
 * Hover and press changes that ride along every element's own transition
 * (a reveal's transition replaces the list, so these are repeated there).
 * `translate` and `scale` are their own properties, so a lift never fights a
 * reveal's `transform`.
 */
const HOVER_TRANSITION = `translate .3s ${MOTION_EASE},scale .15s ${MOTION_EASE},box-shadow .35s ${MOTION_EASE},background-color .25s ease,color .25s ease,border-color .25s ease`;

const hoverScope = `:where(.${SITE_ROOT_CLASS}:not([data-sf-hover="none"]))`;
const hoverButtons = `${hoverScope} :where([data-node-type="button"],[data-node-type="addToCart"] button)`;
const hoverCards = `${hoverScope} :where([data-node-type="card"])`;
/** Simple, smooth hover and press feedback (owner, 2026-10-30): buttons lift 2px with a soft shadow and press in, cards lift a little. Zero specificity (`:where`), so a seller's own Hover style on an element still wins. */
const hoverRules = [
  `${hoverButtons}{transition:${HOVER_TRANSITION}}`,
  `${hoverButtons}:is(:hover,:focus-visible){translate:0 -2px;box-shadow:0 10px 22px -10px rgba(0,0,0,.35)}`,
  `${hoverButtons}:active{translate:0 0;scale:.97;transition-duration:.12s}`,
  `${hoverCards}{transition:${HOVER_TRANSITION}}`,
  `${hoverCards}:hover{translate:0 -3px;box-shadow:0 18px 34px -22px rgba(0,0,0,.28)}`,
].join("");

/** A reveal time scaled by the site speed. */
const timed = (seconds: number) => `calc(${seconds}s * var(--sf-speed,1))`;

const root = `.${SITE_ROOT_CLASS}`;
const hidden = `.sf-motion [data-reveal]:not(.is-inview)`;
/**
 * A stagger step delays only the reveal's own parts (`--sf-delay` in their
 * transitions), so a card still lifts at once if it is hovered mid-reveal.
 */
const steps = Array.from({ length: REVEAL_MAX_STEP }, (_, i) => `.sf-motion [data-reveal-step="${i + 1}"]{--sf-delay:${timed(((i + 1) * STEP_MS) / 1000)}}`).join("");
/** One reveal part: its time scaled by the site speed, then its stagger delay. */
const part = (property: string, seconds: number) => `${property} ${timed(seconds)} ${MOTION_EASE} var(--sf-delay,0s)`;

/**
 * A live carousel (`data-carousel` is only drawn outside the editor canvas),
 * with Theme › Animations on.
 */
const liveTrack = `${root}:not([data-sf-motion="off"]) [data-carousel]>[data-carousel-track]`;
/** The active slide of a carousel (the runtime marks the others `inert`, once they are off screen). */
const activeSlide = `${liveTrack}>:not([inert])`;
/** How far a carousel photo is zoomed in before its slide plays (owner, 2026-10-27: 1.08 → 1). */
const DRIFT_SCALE = 1.08;
/** The renderer's burger sheet. */
const sheet = `${root} dialog[data-sf-sheet]`;

/** Fixed platform CSS, the same on every site (no seller input). */
export const MOTION_CSS = [
  "@media (prefers-reduced-motion:no-preference){",
  // Smooth in-page scrolling (anchor links, "back to top"); the html also carries
  // `data-scroll-behavior="smooth"`, so Next jumps instantly on route changes.
  `html:has(${root}){scroll-behavior:smooth}`,
  `${root}[data-sf-speed="slow"]{--sf-speed:${REVEAL_SPEED_FACTOR.slow}}${root}[data-sf-speed="fast"]{--sf-speed:${REVEAL_SPEED_FACTOR.fast}}`,
  // No `will-change`: a long page would hold a GPU layer for every hidden element until it is seen
  // (heavy on cheap phones); the browser promotes each one by itself while its reveal runs.
  `${hidden}{opacity:0}`,
  `${hidden}[data-reveal="fade-up"]{transform:translate3d(0,28px,0)}`,
  // Photos settle from a slight zoom and unmask from their frame (Claude Design premium motion, 2026-10-27).
  `${hidden}[data-reveal="zoom-in"]{transform:scale(1.1);clip-path:inset(6% 6% 6% 6%)}`,
  `${hidden}[data-reveal="slide-start"]{transform:translate3d(-28px,0,0)}`,
  `[dir="rtl"] ${hidden}[data-reveal="slide-start"]{transform:translate3d(28px,0,0)}`,
  // From the reading end: the left in Arabic, the right in English.
  `${hidden}[data-reveal="slide-end"]{transform:translate3d(28px,0,0)}`,
  `[dir="rtl"] ${hidden}[data-reveal="slide-end"]{transform:translate3d(-28px,0,0)}`,
  `.sf-motion [data-reveal].is-inview{transition:${part("opacity", 0.9)},${part("transform", 1.1)},${HOVER_TRANSITION}}`,
  `.sf-motion [data-reveal="zoom-in"].is-inview{clip-path:inset(0);transition:${part("opacity", 0.9)},${part("transform", 1.6)},${part("clip-path", 1.1)},${HOVER_TRANSITION}}`,
  // A countdown's boxes pop in one after another as it is revealed.
  `.sf-motion [data-reveal]:not(.is-inview) [data-countdown-unit]{opacity:0;transform:translate3d(0,14px,0) scale(.9)}`,
  `.sf-motion [data-reveal].is-inview [data-countdown-unit]{transition:opacity .6s ${MOTION_EASE},transform .6s ${MOTION_EASE};transition-delay:calc(.25s + var(--sf-unit,0) * .1s)}`,
  // Marquee: two copies of the row slide by one copy's width, so the loop is seamless; RTL runs the other way.
  `${root} [data-marquee-track]{animation:sf-marquee var(--sf-marquee,30s) linear infinite}`,
  `:is([dir="rtl"] ${root},${root}[dir="rtl"]) [data-marquee-track]{animation-name:sf-marquee-rtl}`,
  `${root} [data-node-type="marquee"]:is(:hover,:focus-within) [data-marquee-track]{animation-play-state:paused}`,
  `${root}[data-sf-motion="off"] [data-marquee-track]{animation:none}`,
  "@keyframes sf-marquee{from{transform:translate3d(0,0,0)}to{transform:translate3d(calc(-50% - var(--sf-mg,0px) / 2),0,0)}}",
  "@keyframes sf-marquee-rtl{from{transform:translate3d(0,0,0)}to{transform:translate3d(calc(50% + var(--sf-mg,0px) / 2),0,0)}}",
  steps,
  // Carousels: the active slide's photo zooms out once, smoothly, from 1.08 to 1 over the slide's
  // own time (`--sf-slide`, set by the carousel; owner, 2026-10-27: no pulse, no repeat). A waiting
  // slide holds the zoomed size with no transition: the runtime marks it `inert` only after it has
  // glided off screen, so the reset is never seen, and the incoming slide starts zooming once it has
  // landed. The first slide plays it once on load. From the second slide on its copy rises in; the
  // first slide's copy never waits (it is the page's first screen, LCP). Not in the editor canvas
  // (no `data-carousel` there), with reduced motion, or with Theme › Animations off.
  `${liveTrack}>*{overflow:hidden}`,
  `${liveTrack}>* [data-node-type="image"]{transform:scale(${DRIFT_SCALE});transition:none}`,
  `${activeSlide} [data-node-type="image"]{transform:none;transition:transform var(--sf-slide,6s) ${DRIFT_EASE}}`,
  `${liveTrack}>:first-child [data-node-type="image"]{animation:sf-drift var(--sf-slide,6s) ${DRIFT_EASE} backwards}`,
  `${activeSlide}:not(:first-child) :is([data-node-type="heading"],[data-node-type="paragraph"],[data-node-type="text"],[data-node-type="button"]){animation:sf-rise .9s ${MOTION_EASE} both}`,
  `${activeSlide}:not(:first-child) [data-node-type="paragraph"]{animation-delay:.08s}`,
  `${activeSlide}:not(:first-child) [data-node-type="button"]{animation-delay:.16s}`,
  `@keyframes sf-drift{from{transform:scale(${DRIFT_SCALE})}to{transform:none}}`,
  // The renderer's burger sheet (a modal dialog) slides in from the start side, its backdrop fades in.
  // Closing slides it back out, a little faster: `display` and `overlay` transition discretely, so the
  // dialog stays in the top layer until it is off screen. Browsers without discrete transitions close
  // it at once, as before; the opening keyframes work everywhere.
  `${sheet}{transform:translate3d(-100%,0,0);transition:transform .2s ${EXIT_EASE},overlay .2s allow-discrete,display .2s allow-discrete}`,
  `:is([dir="rtl"] ${root},${root}[dir="rtl"]) dialog[data-sf-sheet]{transform:translate3d(100%,0,0)}`,
  `${sheet}[open]{transform:none;animation:sf-sheet-in .3s ${MOTION_EASE}}`,
  `:is([dir="rtl"] ${root},${root}[dir="rtl"]) dialog[data-sf-sheet][open]{transform:none;animation-name:sf-sheet-in-rtl}`,
  `${sheet}::backdrop{opacity:0;transition:opacity .2s ease-in,overlay .2s allow-discrete,display .2s allow-discrete}`,
  `${sheet}[open]::backdrop{opacity:1;animation:sf-fade .3s ease-out}`,
  "@keyframes sf-sheet-in{from{transform:translate3d(-100%,0,0)}to{transform:none}}",
  "@keyframes sf-sheet-in-rtl{from{transform:translate3d(100%,0,0)}to{transform:none}}",
  "@keyframes sf-fade{from{opacity:0}to{opacity:1}}",
  "@keyframes sf-rise{from{opacity:0;transform:translate3d(0,20px,0)}to{opacity:1;transform:none}}",
  "}",
  // Without motion a marquee is one still row that wraps (its copy is hidden).
  `@media (prefers-reduced-motion:reduce){${root} [data-marquee-track]{width:100%}${root} [data-marquee-row]{min-width:0;flex-wrap:wrap;justify-content:center}${root} [data-marquee-copy]{display:none}}`,
  `${root}[data-sf-motion="off"] [data-marquee-track]{width:100%}${root}[data-sf-motion="off"] [data-marquee-row]{min-width:0;flex-wrap:wrap;justify-content:center}${root}[data-sf-motion="off"] [data-marquee-copy]{display:none}`,
  // A countdown that runs out while the page is open disappears (no expired deadline on show).
  `${root} [data-node-type="countdown"]:has([data-countdown-done]){display:none}`,
  // Hover zoom on photos inside a clipped link (product and category cards).
  `@media (hover:hover) and (prefers-reduced-motion:no-preference){${root}:not([data-sf-hover="none"]) .sf-zoom>img{transition:transform .8s ${MOTION_EASE}}${root}:not([data-sf-hover="none"]) .sf-zoom:hover>img{transform:scale(1.05)}}`,
  `@media (hover:hover) and (prefers-reduced-motion:no-preference){${hoverRules}}`,
  // Touch screens have no hover, so a button still answers the tap with the same small press-in.
  `@media (hover:none) and (prefers-reduced-motion:no-preference){${hoverButtons}{transition:${HOVER_TRANSITION}}${hoverButtons}:active{scale:.97;transition-duration:.12s}}`,
  // Large English headings sit a little tighter; Arabic never gets letter-spacing (it breaks the joined letters).
  `:where(${root}:not(:lang(ar))) :where(h1,h2)[data-node-type="heading"]{letter-spacing:-0.015em}`,
  `${root}:lang(ar) [data-section-id] [data-node-id]{letter-spacing:0;text-transform:none}`,
].join("");
