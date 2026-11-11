/**
 * Site motion (docs/section-rules.md §6): reveal on scroll and hover zoom.
 * The renderer marks elements with `data-reveal` (`render.tsx`); the motion
 * runtime (`render/motion-runtime.client.tsx`) adds `sf-motion` to the site
 * root and `is-inview` to each element as it enters. Content is hidden only
 * under `sf-motion`, so a page without the script shows everything. Only
 * `opacity` and `transform` move, and nothing moves with reduced motion.
 */
import { ANIMATION_SPEEDS, animationDefaultSchema } from "@workspace/motion/presets";
import { INTENSITY_FACTOR, MOTION_V2, MOTION_V2_EASE, MOTION_V2_SCROLL, wordStep } from "@workspace/motion/tokens";
import { SITE_ROOT_CLASS } from "../core/theme";
import { MOTION_V2_ATTR, MOTION_V2_MARK, REVEAL_SPEED_FACTOR } from "./motion-flags";
import { HORIZONTAL, SCRUB, STEPS_MAX } from "./scroll-progress.lib";

/** The reveals every store has had since before motion v2 (their v1 look is frozen). */
export const REVEAL_VARIANTS = ["fade-up", "fade", "zoom-in", "slide-start", "slide-end"] as const;
/**
 * Motion v2 reveals, opt-in only (an element's Reveal or a section's
 * Animation): photos unmask from the start edge, the end edge or the bottom
 * (`wipe-*`), and short text rises word by word (`words`). They use the v2
 * tokens in every section.
 */
export const REVEAL_V2_VARIANTS = ["words", "wipe-start", "wipe-end", "wipe-up"] as const;
export type RevealVariant = (typeof REVEAL_VARIANTS)[number] | (typeof REVEAL_V2_VARIANTS)[number];
/** An element's Reveal override (advanced): `auto` lets the renderer pick. */
export const REVEAL_CHOICES = ["auto", ...REVEAL_VARIANTS, ...REVEAL_V2_VARIANTS, "none"] as const;
export type RevealChoice = (typeof REVEAL_CHOICES)[number];

export { MOTION_V2_ATTR, MOTION_V2_MARK, MOTION_V2_PROP, REVEAL_SPEED_FACTOR, isMotionV2 } from "./motion-flags";

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


/**
 * Root attributes for Theme › Animations (`data-sf-motion="off"`), its speed
 * (`data-sf-speed`), Hover effect (`data-sf-hover="none"`) and motion v2's
 * Intensity (`data-sf-intensity`, only when it isn't normal; it scales v2
 * distances and zoom amounts, never v1 sections).
 */
export function siteMotionAttrs(
  motion: { reveal?: boolean; hoverZoom?: boolean; speed?: string; intensity?: string } | null | undefined,
): Record<string, string> {
  const out: Record<string, string> = {};
  if (motion?.reveal === false) out["data-sf-motion"] = "off";
  if (motion?.hoverZoom === false) out["data-sf-hover"] = "none";
  if (motion?.speed === "slow" || motion?.speed === "fast") out["data-sf-speed"] = motion.speed;
  if (motion?.intensity === "subtle" || motion?.intensity === "expressive") out["data-sf-intensity"] = motion.intensity;
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

/** Where a motion v2 reveal starts (an element in a `data-sf-mv="2"` section, or a v2-only variant anywhere), for the editor replay. */
export function revealFromV2(variant: string | undefined, rtl: boolean, intensity = 1): { transform: string; clipPath?: string; opacity: number } {
  const dist = MOTION_V2.fadeUp.distance * intensity;
  const zoom = 1 + (MOTION_V2.zoomIn.scale - 1) * intensity;
  const side = (px: number) => `translate3d(${rtl ? -px : px}px,0,0)`;
  if (variant === "zoom-in") return { opacity: 0, transform: `scale(${zoom})`, clipPath: `inset(${MOTION_V2.zoomIn.clipInset}%)` };
  if (variant === "slide-start") return { opacity: 0, transform: side(-MOTION_V2.slide.distance * intensity) };
  if (variant === "slide-end") return { opacity: 0, transform: side(MOTION_V2.slide.distance * intensity) };
  if (variant === "fade") return { opacity: 0, transform: "none" };
  if (variant === "wipe-start" || variant === "wipe-end" || variant === "wipe-up") {
    const wipeZoom = 1 + (MOTION_V2.wipe.scale - 1) * intensity;
    return { opacity: 1, transform: `scale(${wipeZoom})`, clipPath: wipeInset(variant, rtl, `${Math.round((50 - 50 / wipeZoom) * 1000) / 1000}%`) };
  }
  return { opacity: 0, transform: `translate3d(0,${dist}px,0)` };
}

/**
 * A wipe's hidden clip: 100% on the edge it grows away from, and `side` on
 * the other three, so the photo, zoomed in while it settles, never spills out
 * of its own box. `wipe-start` grows from the reading start (the right in
 * Arabic), `wipe-end` from the reading end, `wipe-up` from the bottom.
 */
export function wipeInset(variant: "wipe-start" | "wipe-end" | "wipe-up", rtl: boolean, side: string): string {
  if (variant === "wipe-up") return `inset(100% ${side} ${side} ${side})`;
  // Growing from the left edge hides the right one fully, and the other way round.
  const fromLeft = (variant === "wipe-start") !== rtl;
  return fromLeft ? `inset(${side} 100% ${side} ${side})` : `inset(${side} ${side} ${side} 100%)`;
}

/** Motion v2 replay timings in ms at normal speed (`@workspace/motion/tokens`). */
export const REVEAL_TIMING_V2 = {
  duration: (variant: string | undefined): number =>
    variant === "zoom-in"
      ? MOTION_V2.zoomIn.duration
      : variant === "fade"
        ? MOTION_V2.fade.duration
        : variant?.startsWith("wipe-")
          ? MOTION_V2.wipe.duration
          : variant === "words"
            ? MOTION_V2.words.duration
            : MOTION_V2.fadeUp.duration,
  perWord: MOTION_V2.words.perWord,
  ease: MOTION_V2_EASE,
} as const;

/** `--sf-intensity` for a site root's `data-sf-intensity` (normal when missing or unknown). */
export function intensityFactor(value: string | null | undefined): number {
  return value === "subtle" || value === "expressive" ? INTENSITY_FACTOR[value] : 1;
}

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
/** Motion v1: every store's CSS before motion v2. Frozen byte for byte (`motion-v1-freeze.test.tsx`). */
export const MOTION_CSS_V1 = [
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

// ---------------------------------------------------------------------------
// Motion v2 (docs/motion-v2-plan.md §5.3), generated from `@workspace/motion/tokens`
// ---------------------------------------------------------------------------

/** A v2 time in seconds, scaled by the site speed. */
const ms = (value: number) => `calc(${value / 1000}s * var(--sf-speed,1))`;
/** One v2 reveal part: its time, the v2 ease, then its batch delay (`--sf-delay`, set by the runtime). */
const partV2 = (property: string, duration: number) => `${property} ${ms(duration)} ${MOTION_V2_EASE} var(--sf-delay,0s)`;
/** An element of a v2 section, under the motion runtime. */
const v2 = `.sf-motion [${MOTION_V2_ATTR}="${MOTION_V2_MARK}"]`;
const v2Hidden = `${v2} [data-reveal]:not(.is-inview)`;
/** The v2-only variants, in any section (v1 sections included): their attribute is repeated so they outrank the v2 section rules. */
const wipe = `[data-reveal^="wipe-"][data-reveal]`;
const words = `[data-reveal="words"][data-reveal]`;
/** The part of a wipe's clip that keeps a zoomed photo inside its own box: (1 - 1/zoom) / 2. */
const WIPE_SIDE = "calc(50% - 50% / var(--sf-zoom))";
const { fadeUp, fade, zoomIn, slide } = MOTION_V2;

// ---------------------------------------------------------------------------
// Motion v2 scroll effects and steps (docs/motion-v2-plan.md §5.4-§5.5). Opt-in
// markup only (`elements/scroll-plan.ts`): nothing here matches a node without
// `data-sf-scroll`, `data-sf-steps` or `data-sf-frame`, which the editor canvas
// never draws.
// ---------------------------------------------------------------------------

/** A site root with Theme › Animations on. */
const on = `${root}:not([data-sf-motion="off"])`;
const { parallaxRange, zoomScale, fadeExitOpacity, fadeExitRise, stepFade, stepDim } = MOTION_V2_SCROLL;
const stepIndexes = Array.from({ length: STEPS_MAX }, (_, k) => k);
/** A step's text block that is not waiting for its own reveal (a reveal owns its opacity until it ends). */
const stepItem = (k?: number) => `[data-sf-step-item${k === undefined ? "" : `="${k}"`}]:not([data-reveal])`;

/** `reveal-scrub`: both parts follow the section root through `SCRUB.span` of its entry. */
const scrubRange = `animation-timeline:--sf-track;animation-range:entry 0% entry ${Math.round(SCRUB.span * 100)}%`;
/**
 * Switches the play-once reveals inside `scope` off: a waiting reveal looks
 * exactly like a played one, so nothing is hidden and nothing transitions
 * when the runtime marks it in view. The attribute is repeated so the rule
 * outranks every reveal's own hidden state (v1, v2 and their RTL forms).
 */
const noReveal = (scope: string) => {
  const waiting = `${scope} [data-reveal][data-reveal][data-reveal]:not(.is-inview)`;
  return `${waiting},${waiting} :is([data-w],[data-countdown-unit]){opacity:1;transform:none;clip-path:none}`;
};
/** A `horizontal` section and its row. */
const horizontalSection = `${on} [data-sf-h]`;
const horizontalRow = `${horizontalSection} [data-sf-scroll="horizontal"]`;
/** How far a `horizontal` row slides in all: one card and its gap per card past the visible ones (`--sf-hn`), toward the reading start. */
const horizontalTravel = `calc(var(--sf-h-dir) * var(--sf-hn,1) * (100% + var(--sf-h-gap)) / ${HORIZONTAL.visible})`;

export const MOTION_CSS_SCROLL = [
  // A photo's frame clips it, so a moving photo never shows an edge.
  "[data-sf-frame]{overflow:clip}",
  // Steps: the media column shows only where it can follow the text (wide screens, motion on);
  // elsewhere each step shows its own photo, stacked as on phones.
  "@media (max-width:767.98px),print,(prefers-reduced-motion:reduce){[data-sf-steps-media]{display:none}}",
  `${root}[data-sf-motion="off"] [data-sf-steps-media]{display:none}`,
  "@media screen and (min-width:768px) and (prefers-reduced-motion:no-preference){",
  `${on} [data-sf-steps-media]{position:sticky;top:var(--sf-steps-top,12vh);align-self:start;display:grid}`,
  `${on} [data-sf-step-media]{grid-area:1/1}`,
  `${on} [data-sf-step-own]{display:none}`,
  // Without the engine: every text in full and the first photo.
  `${on} [data-sf-steps]:not([data-sf-step]) [data-sf-step-media]:not([data-sf-step-media="0"]){opacity:0}`,
  `${on} [data-sf-step] [data-sf-step-media]{opacity:0;transition:opacity ${ms(stepFade)} ${MOTION_V2_EASE}}`,
  ...stepIndexes.map((k) => `${on} [data-sf-step="${k}"] [data-sf-step-media="${k}"]{opacity:1}`),
  `${on} [data-sf-step] ${stepItem()}{opacity:${stepDim};transition:opacity ${ms(stepFade)} ${MOTION_V2_EASE}}`,
  ...stepIndexes.map((k) => `${on} [data-sf-step="${k}"] ${stepItem(k)}{opacity:1}`),
  "}",
  "@media screen and (prefers-reduced-motion:no-preference){",
  // How far a parallax photo drifts each way, as a fraction of its height.
  `${on} [data-sf-scroll]{--sf-r:calc(${parallaxRange / 100} * var(--sf-intensity,1))}`,
  // Progress bars grow from the reading start (the right in Arabic), a vertical one from the top.
  `${on} [data-sf-scroll="progress"]{transform-origin:left center}`,
  `:is([dir="rtl"] ${on},${on}[dir="rtl"]) [data-sf-scroll="progress"]{transform-origin:right center}`,
  `${on} [data-sf-scroll="progress"][data-sf-axis="y"]{transform-origin:center top}`,
  // CSS scroll timelines: no script runs for these (the engine skips them).
  "@supports (animation-timeline:view()){",
  `${on} [data-sf-frame]{view-timeline:--sf-frame block}`,
  `${on} [data-sf-track]{view-timeline:--sf-track block}`,
  `${on} [data-sf-steps]{view-timeline:--sf-steps block}`,
  `${on} [data-sf-scroll="parallax"]{animation:sf-parallax linear both;animation-timeline:--sf-frame;animation-range:cover 0% cover 100%}`,
  `${on} [data-sf-scroll="zoom"]{animation:sf-scroll-zoom linear both;animation-timeline:--sf-frame;animation-range:cover 0% cover 100%}`,
  // The hero copy fades as its section leaves the top of the screen (exit-crossing: the engine's exit).
  `${on} [data-sf-scroll="fade-exit"]{animation:sf-fade-exit linear both;animation-timeline:--sf-track;animation-range:exit-crossing 0% exit-crossing 100%}`,
  `${on} [data-sf-scroll="progress"]{animation:sf-progress linear both;animation-timeline:--sf-track;animation-range:cover 0% cover 100%}`,
  // In a steps block a bar follows the middle of the screen through the steps (the engine's centre progress).
  `${on} [data-sf-steps] [data-sf-scroll="progress"]{animation-timeline:--sf-steps;animation-range:cover 50vh cover calc(100% - 50vh)}`,
  `${on} [data-sf-scroll="progress"][data-sf-axis="y"]{animation-name:sf-progress-y}`,
  // reveal-scrub (docs/systems/plan.md §10, L6; CSS scroll timelines only, the engine never drives it): the copy
  // and the photo move into place as their section enters, and back out on the way up. It replaces the section's
  // play-once reveals, which are switched off here and nowhere else: a browser without scroll timelines keeps them.
  `${on} [data-sf-scroll="scrub-copy"]{animation:sf-scrub-copy linear both;${scrubRange}}`,
  `${on} [data-sf-scroll="scrub-photo"]{animation:sf-scrub-photo linear both;${scrubRange}}`,
  noReveal(`${on} [data-sf-scrub]`),
  "}",
  // The engine (Firefox, older Safari): `--sf-progress` / `--sf-exit`, once it drives an element (`data-sf-live`).
  "@supports not (animation-timeline:view()){",
  `${on} [data-sf-scroll="parallax"][data-sf-live]{translate:0 calc((1 - 2 * var(--sf-progress,.5)) * var(--sf-r) * 100%);scale:calc(1 + 2 * var(--sf-r));transition:translate .1s linear,scale .6s ${MOTION_V2_EASE}}`,
  `${on} [data-sf-scroll="zoom"][data-sf-live]{scale:calc(1 + ${zoomScale} * var(--sf-intensity,1) * var(--sf-progress,0));transition:scale .1s linear}`,
  `${on} [data-sf-scroll="fade-exit"][data-sf-live]{opacity:calc(1 - ${Math.round((1 - fadeExitOpacity) * 100) / 100} * var(--sf-exit,0));translate:0 calc(-${fadeExitRise}px * var(--sf-intensity,1) * var(--sf-exit,0))}`,
  `${on} [data-sf-scroll="progress"][data-sf-live]{scale:var(--sf-progress,0) 1;transition:scale .1s linear}`,
  `${on} [data-sf-scroll="progress"][data-sf-axis="y"][data-sf-live]{scale:1 var(--sf-progress,0)}`,
  "}",
  // A parallax photo is scaled so its drift never shows an edge (1 + 2 × range).
  "@keyframes sf-parallax{from{translate:0 calc(var(--sf-r) * 100%);scale:calc(1 + 2 * var(--sf-r))}to{translate:0 calc(var(--sf-r) * -100%);scale:calc(1 + 2 * var(--sf-r))}}",
  `@keyframes sf-scroll-zoom{from{scale:1}to{scale:calc(1 + ${zoomScale} * var(--sf-intensity,1))}}`,
  `@keyframes sf-fade-exit{from{opacity:1;translate:none}to{opacity:${fadeExitOpacity};translate:0 calc(-${fadeExitRise}px * var(--sf-intensity,1))}}`,
  "@keyframes sf-progress{from{scale:0 1}to{scale:1 1}}",
  "@keyframes sf-progress-y{from{scale:1 0}to{scale:1 1}}",
  `@keyframes sf-scrub-copy{from{opacity:0;translate:0 calc(${SCRUB.rise}px * var(--sf-intensity,1))}${Math.round(SCRUB.fade * 100)}%{opacity:1}to{opacity:1;translate:none}}`,
  `@keyframes sf-scrub-photo{from{opacity:${SCRUB.photoOpacity};scale:calc(1 + ${SCRUB.zoom} * var(--sf-intensity,1))}to{opacity:1;scale:1}}`,
  "}",
  // horizontal (docs/systems/plan.md §10, L6): from tablets up, on screens tall enough to hold the pinned part.
  // Smaller screens, reduced motion, Animations off, print and browsers without CSS scroll timelines (nothing
  // would slide the row there; the engine never drives it): the row keeps its ordinary layout, a grid or a swipe row.
  `@media screen and (min-width:${HORIZONTAL.minWidth}px) and (min-height:${HORIZONTAL.minHeight}px) and (prefers-reduced-motion:no-preference){`,
  "@supports (animation-timeline:view()){",
  `${horizontalSection}{--sf-h-gap:${HORIZONTAL.gap}px;--sf-h-dir:-1}`,
  `:is([dir="rtl"] ${on},${on}[dir="rtl"]) [data-sf-h]{--sf-h-dir:1}`,
  ...Array.from({ length: HORIZONTAL.max - HORIZONTAL.min + 1 }, (_, i) => `${on} [data-sf-h="${HORIZONTAL.min + i}"]{--sf-hn:${HORIZONTAL.min + i - HORIZONTAL.visible}}`),
  // The section grows by the pinned length (`stepVw` per card past the visible ones), and its part holding the row stays on screen meanwhile.
  `${horizontalSection}::after{content:"";display:block;height:min(calc(var(--sf-hn,1) * ${HORIZONTAL.stepVw}vw),${HORIZONTAL.maxVh}vh)}`,
  `${horizontalSection} [data-sf-h-pin]{position:sticky;top:0}`,
  // One row, `visible` cards in view; the section root clips it sideways (`overflow-x-clip`), so the page never scrolls sideways.
  `${horizontalRow}{display:flex!important;flex-wrap:nowrap!important;gap:var(--sf-h-gap)!important;overflow:visible!important}`,
  `${horizontalRow}>*{flex:0 0 calc((100% - ${HORIZONTAL.visible - 1} * var(--sf-h-gap)) / ${HORIZONTAL.visible})!important;min-width:0;max-width:none}`,
  // Its cards never wait for a play-once reveal: one off to the side would stay hidden until it slid in.
  noReveal(horizontalRow),
  // The row slides while its section covers the screen (`contain`), toward the reading start.
  `${horizontalRow}{animation:sf-horizontal linear both;animation-timeline:--sf-track;animation-range:contain 0% contain 100%}`,
  "}",
  `@keyframes sf-horizontal{from{translate:0 0}to{translate:${horizontalTravel} 0}}`,
  "}",
].join("");

/** A motion v2 section, at zero specificity (a seller's own Hover style still wins). */
const v2Hover = `:where(${root}:not([data-sf-hover="none"]) [${MOTION_V2_ATTR}="${MOTION_V2_MARK}"])`;
const linkText = `:is([data-node-type="text"],[data-node-type="paragraph"],[data-node-type="heading"])`;
/** A live carousel's track inside a motion v2 section. */
const liveTrackV2 = `${root}:not([data-sf-motion="off"]) [${MOTION_V2_ATTR}="${MOTION_V2_MARK}"] [data-carousel]>[data-carousel-track]`;

/**
 * Motion v2 interaction polish (§5.6), only inside marked sections; unmarked
 * sections keep today's hover exactly. With a fine pointer: the second photo
 * crossfades in 300 ms and settles from 1.04, a text link's underline draws
 * from the reading start and its icon nudges 3 px toward the reading end,
 * buttons lift and press a little quicker. A carousel slide's copy eases out
 * as it leaves (`data-sf-leaving`, set by the carousel runtime).
 */
export const MOTION_CSS_POLISH = [
  "@media (hover:hover) and (prefers-reduced-motion:no-preference){",
  `${v2Hover} [data-sf-swap]>img:first-child{transition:opacity .3s ${MOTION_V2_EASE}}`,
  `${v2Hover} [data-sf-swap]>img+img{scale:1.04;transition:scale .7s ${MOTION_V2_EASE}}`,
  `${v2Hover} [data-sf-swap]:hover>img+img{scale:1}`,
  `${v2Hover} [data-sf-link] ${linkText}{background-image:linear-gradient(currentColor,currentColor);background-repeat:no-repeat;background-position:left bottom;background-size:0% 1px;transition:background-size .25s ${MOTION_V2_EASE}}`,
  `[dir="rtl"] ${v2Hover} [data-sf-link] ${linkText}{background-position:right bottom}`,
  `${v2Hover} [data-sf-link]:is(:hover,:focus-visible) ${linkText}{background-size:100% 1px}`,
  `${v2Hover} [data-sf-link] [data-node-type="icon"]{transition:translate .2s ${MOTION_V2_EASE}}`,
  `${v2Hover} [data-sf-link]:is(:hover,:focus-visible) [data-node-type="icon"]{translate:3px 0}`,
  `[dir="rtl"] ${v2Hover} [data-sf-link]:is(:hover,:focus-visible) [data-node-type="icon"]{translate:-3px 0}`,
  `${v2Hover} :where([data-node-type="button"],[data-node-type="addToCart"] button){transition:translate .2s ${MOTION_V2_EASE},scale .15s ${MOTION_V2_EASE},box-shadow .25s ${MOTION_V2_EASE},background-color .2s ease,color .2s ease,border-color .2s ease}`,
  `${v2Hover} :where([data-node-type="button"],[data-node-type="addToCart"] button):active{transition-duration:.15s}`,
  "}",
  "@media (prefers-reduced-motion:no-preference){",
  `${liveTrackV2}>[data-sf-leaving] :is([data-node-type="heading"],[data-node-type="paragraph"],[data-node-type="text"],[data-node-type="button"]){animation:sf-leave .25s ${EXIT_EASE} both}`,
  "@keyframes sf-leave{to{opacity:0;transform:translate3d(0,-8px,0)}}",
  "}",
].join("");

/** Motion v2 CSS: sections marked `data-sf-mv="2"` and the v2-only variants. Nothing here matches a v1 section's v1 reveals. */
export const MOTION_CSS_V2 = [
  // Words stay inline boxes in every state (no-JS and reduced motion too), so the line never reflows when the reveal ends.
  "[data-w]{display:inline-block}",
  "@media (prefers-reduced-motion:no-preference){",
  `${root}[data-sf-intensity="subtle"]{--sf-intensity:${INTENSITY_FACTOR.subtle}}${root}[data-sf-intensity="expressive"]{--sf-intensity:${INTENSITY_FACTOR.expressive}}`,
  // Tokens as variables, scaled by Theme › Motion › Intensity and Speed.
  `:where([${MOTION_V2_ATTR}="${MOTION_V2_MARK}"],[data-reveal^="wipe-"],[data-reveal="words"]){--sf-dist:calc(${fadeUp.distance}px * var(--sf-intensity,1));--sf-zoom:calc(1 + ${Math.round((zoomIn.scale - 1) * 1000) / 1000} * var(--sf-intensity,1));--sf-dur:${ms(fadeUp.duration)}}`,
  // The runtime gives each item of a batch its own `--sf-delay` (eased stagger); the server's step is ignored here.
  `${v2} [data-reveal-step]{--sf-delay:0s}`,
  `${v2Hidden}[data-reveal="fade-up"]{transform:translate3d(0,var(--sf-dist),0)}`,
  `${v2Hidden}[data-reveal="zoom-in"]{transform:scale(var(--sf-zoom));clip-path:inset(${zoomIn.clipInset}%)}`,
  `${v2Hidden}[data-reveal="slide-start"]{transform:translate3d(calc(-1 * var(--sf-dist)),0,0)}`,
  `[dir="rtl"] ${v2Hidden}[data-reveal="slide-start"]{transform:translate3d(var(--sf-dist),0,0)}`,
  `${v2Hidden}[data-reveal="slide-end"]{transform:translate3d(var(--sf-dist),0,0)}`,
  `[dir="rtl"] ${v2Hidden}[data-reveal="slide-end"]{transform:translate3d(calc(-1 * var(--sf-dist)),0,0)}`,
  `${v2} [data-reveal].is-inview{transition:${partV2("opacity", fade.duration)},transform var(--sf-dur) ${MOTION_V2_EASE} var(--sf-delay,0s),${HOVER_TRANSITION}}`,
  `${v2} [data-reveal="fade"].is-inview{transition:${partV2("opacity", fade.duration)},${HOVER_TRANSITION}}`,
  `${v2} :is([data-reveal="slide-start"],[data-reveal="slide-end"]).is-inview{transition:${partV2("opacity", fade.duration)},${partV2("transform", slide.duration)},${HOVER_TRANSITION}}`,
  `${v2} [data-reveal="zoom-in"].is-inview{clip-path:inset(0);transition:${partV2("opacity", fade.duration)},${partV2("transform", zoomIn.duration)},${partV2("clip-path", zoomIn.duration)},${HOVER_TRANSITION}}`,
  // Wipe: the photo stays opaque and unmasks from one edge while it settles from the zoom.
  `.sf-motion ${wipe}:not(.is-inview){opacity:1;transform:scale(var(--sf-zoom))}`,
  `.sf-motion [data-reveal="wipe-start"][data-reveal]:not(.is-inview){clip-path:${wipeInset("wipe-start", false, WIPE_SIDE)}}`,
  `[dir="rtl"] .sf-motion [data-reveal="wipe-start"][data-reveal]:not(.is-inview){clip-path:${wipeInset("wipe-start", true, WIPE_SIDE)}}`,
  `.sf-motion [data-reveal="wipe-end"][data-reveal]:not(.is-inview){clip-path:${wipeInset("wipe-end", false, WIPE_SIDE)}}`,
  `[dir="rtl"] .sf-motion [data-reveal="wipe-end"][data-reveal]:not(.is-inview){clip-path:${wipeInset("wipe-end", true, WIPE_SIDE)}}`,
  `.sf-motion [data-reveal="wipe-up"][data-reveal]:not(.is-inview){clip-path:${wipeInset("wipe-up", false, WIPE_SIDE)}}`,
  `.sf-motion ${wipe}.is-inview{clip-path:inset(0);transition:${partV2("clip-path", MOTION_V2.wipe.duration)},${partV2("transform", MOTION_V2.wipe.duration)},${HOVER_TRANSITION}}`,
  // Words: the element itself stays visible; each word (`--i`, capped by the server) rises in turn.
  `.sf-motion ${words}:not(.is-inview){opacity:1;transform:none}`,
  `.sf-motion ${words}:not(.is-inview) [data-w]{opacity:0;transform:translate3d(0,calc(${MOTION_V2.words.rise}em * var(--sf-intensity,1)),0)}`,
  `.sf-motion ${words}.is-inview [data-w]{transition:opacity ${ms(MOTION_V2.words.duration)} ${MOTION_V2_EASE} calc(var(--sf-delay,0s) + var(--i,0) * ${ms(MOTION_V2.words.perWord)}),transform ${ms(MOTION_V2.words.duration)} ${MOTION_V2_EASE} calc(var(--sf-delay,0s) + var(--i,0) * ${ms(MOTION_V2.words.perWord)})}`,
  "}",
].join("");

/** Fixed platform CSS, the same on every site (no seller input): v1 exactly as it was, then motion v2 (reveals, scroll effects and steps, interaction polish). */
export const MOTION_CSS = MOTION_CSS_V1 + MOTION_CSS_V2 + MOTION_CSS_SCROLL + MOTION_CSS_POLISH;

/** A `words` reveal's pieces: each word with its step (`--i`), and the real whitespace between them. */
export type WordPiece = string | { word: string; step: number };

/**
 * Splits text for a `words` reveal on whitespace only, never into letters
 * (Arabic letters must stay joined). `null` when it has no words or more than
 * `MOTION_V2.words.maxWords` (it then fades up whole).
 */
export function splitWords(text: string): WordPiece[] | null {
  const pieces: WordPiece[] = [];
  let count = 0;
  for (const token of text.split(/(\s+)/)) {
    if (!token) continue;
    if (/^\s+$/.test(token)) pieces.push(token);
    else pieces.push({ word: token, step: wordStep(count++) });
  }
  return count > 0 && count <= MOTION_V2.words.maxWords ? pieces : null;
}
