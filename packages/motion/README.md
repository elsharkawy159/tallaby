# @workspace/motion

Calm scroll and intro motion for Tallaby pages: GSAP + ScrollTrigger, with
Lenis smooth scrolling. Piloted on the tallaby.com home page
(`apps/ecommerce/app/[locale]/(marketing)/(site)/page.tsx`); written so store
templates can use the same presets later without code per section.

## How it works

- **Markup first.** Every preset is a `data-*` attribute. The React helpers
  (`Reveal`, `StaggerChildren`, …) only render those attributes, hold no state
  and are safe in server components. Without JavaScript the page is complete
  and visible: nothing is hidden in server-rendered CSS.
- **One lazy runtime.** `<MotionScope>` (client) fetches the GSAP runtime when
  the browser is idle after hydration, reads the attributes inside it and sets
  each element's start state inline. Elements already on screen (or scrolled
  past) when it starts are left alone, so nothing flashes.
- **Once.** Reveals, staggers and count-ups play the first time they come into
  view and then clear their inline styles. Only parallax and pinned steps scrub.
- **Only `opacity` and `transform`.** Distances 12–40px, 0.6–1s,
  `power3.out` / `expo.out`, staggers 0.06–0.12s (`MOTION` in `presets.ts`).
- **RTL.** Horizontal motion reads `direction` from the element: `slide-start`
  comes from the right in Arabic, fill bars grow from the right.
- **Reduced motion** (`prefers-reduced-motion: reduce`): the runtime sets up
  nothing, Lenis stays off and the CSS intro does not play. Content just shows.
- **Breakpoints** (`gsap.matchMedia`, `MOTION_QUERIES` in `gsap.client.ts`):
  parallax from 768px; pinning from 1024px wide **and** 700px tall.
- **Cleanup.** Unmounting the scope (route change) reverts every tween,
  ScrollTrigger and inline style (`useGSAP` context). Trigger positions are
  refreshed after fonts load, on `load`, and whenever the scope resizes.

## Setup (once per app)

```css
/* the app stylesheet */
@import "@workspace/motion/motion.css";
```

```tsx
import { MotionScope, SmoothScrollProvider } from "@workspace/motion";

export default function Page() {
  return (
    <SmoothScrollProvider offset={90 /* sticky header, px */}>
      <MotionScope>{/* sections */}</MotionScope>
    </SmoothScrollProvider>
  );
}
```

`SmoothScrollProvider` is optional. It drives Lenis from `gsap.ticker`, keeps
ScrollTrigger in sync, handles in-page `#anchor` links with `offset`, leaves
dialogs and `[data-lenis-prevent]` areas to native scrolling, and pauses while
a Radix dialog locks the page (`body[data-scroll-locked]`). Touch devices keep
native scrolling.

## Presets

| Component                                             | Data attributes                                                                                                                                                 | What it does                                                                                                                                                                        |
| ----------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `<Reveal variant delay as>`                           | `data-reveal="fade-up\|fade\|fade-in\|zoom-in\|slide-start\|scale-in"`, `data-reveal-delay="0.1"` (s), `data-reveal-step="1–5"` (store stagger step, 90ms each) | Plays once on enter. `none` or an unknown value does nothing.                                                                                                                       |
| `<StaggerChildren variant stagger as>`                | `data-stagger="0.08"` (gap in s, empty = 0.08), `data-stagger-variant`, items: direct children or `[data-stagger-item]`                                         | Items play in sequence, a batch at a time as they enter.                                                                                                                            |
| `<ParallaxImage speed as>`                            | `data-parallax="0.15"` (−1…1)                                                                                                                                   | Drifts up to `speed × 120px` while crossing the viewport. Put it on a wrapper, not on an element with its own transform.                                                            |
| `<CountUp from as>`                                   | `data-count-up` (start value, empty = 0)                                                                                                                        | Counts the number in its text up once. Keeps Arabic-Indic digits and thousands separators. Render the final number: that is what shows without JS.                                  |
| `<PinnedSteps>` + `<PinnedStep>` + `<PinnedProgress>` | `data-pin`, `data-pin-step`, `data-pin-progress`                                                                                                                | Desktop: pinned while steps light up in turn and the bar fills along the reading direction. Elsewhere the steps stagger in. The bar renders invisible and only shows while pinning. |
| `<Intro variant delay as>`                            | `data-intro="fade-up\|fade\|float"`, `style="--intro-delay:.3s"`                                                                                                | **First screen only.** Plain CSS from the first paint, no JS, always ends visible.                                                                                                  |
| `<IntroWords delay step>`                             | `data-intro="word"` per word                                                                                                                                    | Splits a heading into words (keeps `<em>` and other markup) that rise in sequence.                                                                                                  |

Rules the runtime applies:

- A reveal inside another reveal or a stagger group is skipped (the outer one
  animates it). A stagger group inside a revealed card still staggers.
- Text is split by **words, never letters**: a span per letter breaks Arabic
  letter joining. Words are `inline-block`; the spaces stay text, so lines wrap
  exactly as before.
- Use `Intro` / `IntroWords` above the fold (hero) and the scroll presets below
  it. Scroll presets on the first screen do nothing, by design.

## Store templates (later)

Store sections are element trees (`packages/store-sections`). Its renderer
already writes `data-reveal="fade-up|fade|zoom-in|slide-start"` and
`data-reveal-step` (`elements/render.tsx`), animated today by the CSS-only
runtime in `elements/motion.ts`. This package reads the **same attributes with
the same meaning**, so moving a template to it is a runtime swap, not a tree
change:

1. Render the storefront page inside `<MotionScope>` instead of mounting the
   CSS motion runtime (and drop `MOTION_CSS`'s hidden states for that page).
2. Keep Theme › Animations: don't mount `MotionScope` when the site root has
   `data-sf-motion="off"`.
3. New effects (parallax, count-up, pinned steps) are new node props that the
   renderer writes as `data-parallax`, `data-count-up`, `data-pin*`, under the
   same "content, not chrome" rules as `reveal`.

Cost to weigh first: about 44KB gzipped of GSAP + Lenis per storefront, loaded
after hydration (the CSS runtime is a few hundred bytes).
