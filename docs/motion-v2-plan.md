# Motion v2: audit and plan

**Status: approved 2026-11-11, Phase 2 in progress.** ROADMAP.md F-88.

**Owner decisions (2026-11-11):**
1. **Running stores are not changed.** Only the templates and the sections library get motion v2. So the retune (§5.3) is **gated**: v2 tokens, the earlier trigger and the eased stagger apply only under a site root with `data-sf-motion-v="2"`, which comes from `designSystem.motion.version: 2`. Every code template writes that flag (centrally, so every new store and every store that applies a template gets it); existing stores have no flag and keep today's values exactly. The new primitives (scroll effects, words, wipe, count-up, steps) are opt-in markup, so they appear only where a new library section or a seller turns them on. Fixes that change no look (the carousel's never-stopping loop) apply everywhere. The rail-card fix also applies everywhere, because a card that never appears is a bug, not a look.
2. Tallaby Classic gets a new version with the pilot sections, without steps.
3. No migration (code-only).
4. (Not answered: build the recommendation.) Build the `image-text-steps` design.
5. (Not answered: build the recommendation.) Branch `feat/motion-v2`, local commits, no push until the owner says so.

Sources: the code on `main` at `01533452`; a baseline run on a production build (`next build` + `next start`, Chromium 158, Playwright); the public source of Shopify Dawn and Horizon (read, not copied); and recordings of 6 live stores. Before-videos are in `docs/motion-v2/before/`.

---

## 1. The current system (audit)

### 1.1 Two motion systems

| System | Used by | Hook | Files |
|---|---|---|---|
| **Store sites** | every storefront, the template preview, `SitePreview`, editor replay | `data-reveal` + `.sf-motion` + `is-inview` | `packages/store-sections/src/elements/motion.ts` (`MOTION_CSS`, tokens), `elements/render.tsx` (`revealOf`), `render/motion-runtime.client.tsx`, `render/motion-replay.client.ts`, `render/carousel-runtime.client.tsx` |
| **tallaby.com / app pages** | marketing site | `data-animate` + `html.js-animations` + `anim-pending`/`is-visible` | `packages/motion/src/{animations.client.tsx,animations.css,init-script.ts,components.tsx,intro.tsx}` |

They share only the settings schema and parsers (`packages/motion/src/presets.ts`: `ANIMATION_PRESETS`, `parseAnimationSetting`, `resolveAnimation`, `SPEED_FACTOR`). Their **tokens differ**. `presets.ts` `MOTION` = 500 ms, 16 px, ease `(.25,.46,.45,.94)`, stagger 80 ms × 8. `motion.ts` = 1.1 s, 28 px, ease `(.16,1,.3,1)`, step 90 ms × 5. There is no single source of truth.

### 1.2 Store-site motion, feature by feature

| Feature | Where | Value today | Verdict |
|---|---|---|---|
| Reveal variants | `REVEAL_VARIANTS` in `motion.ts` | `fade-up`, `fade`, `zoom-in`, `slide-start`, `slide-end` | Good set; slides are logical and RTL-correct |
| Reveal timing | `MOTION_CSS` `.is-inview` | opacity 0.9 s, transform **1.1 s**, ease `(.16,1,.3,1)` | **Too long.** Combined with the late trigger (below), sections arrive about 1 s behind the scroll |
| Rise / slide distance | `MOTION_CSS` | 28 px | A little big; good themes use 15–20 px |
| Zoom-in (photos) | `MOTION_CSS` | scale 1.1 → 1 over **1.6 s** + `clip-path: inset(6%)` → 0 over 1.1 s | Nice idea. Too slow and too much: a card grid of photos all "breathing" for 1.6 s reads as lag |
| Trigger | `motion-runtime.client.tsx` | one `IntersectionObserver`, `threshold: 0.15`, no rootMargin | **Late.** It fires once 15% of the element is visible. For a tall image that is well past the bottom edge, so the visitor sees an empty band first (clearly visible in the before-videos). Good themes fire when the top is about 80% down the screen |
| Stagger | `data-reveal-step` 1–5, `STEP_MS` 90 | linear, max 450 ms; set from the item's index in the list | The index is the list index, not the row: on a 4-column grid, row 2 waits 360–450 ms after it is already on screen. No row/column awareness |
| Already on screen at start | runtime | `data-reveal` is removed, never hidden | Good (no hero flash) |
| Once only | runtime | `unobserve` after the first entry | Good |
| Hover clean-up | runtime | removes `data-reveal` on `transitionend` (fallback 3.6 s) so hover transitions come back | Good, but needed only because the reveal's transition list replaces the hover one |
| Hero / LCP | `render.tsx` `aboveFold`, `revealOf` (never `h1`) | first section never reveals | Good |
| Reduced motion | CSS `@media (prefers-reduced-motion:no-preference)`, runtime early return | nothing hides, nothing moves | Good |
| Master switch, speed, hover | `siteMotionAttrs` → `data-sf-motion="off"`, `data-sf-speed` (×1.6 / ×0.6 via `--sf-speed`), `data-sf-hover="none"` | | Good |
| Section Animation | `elements/shell.ts` `SHELL_ANIMATIONS`, `parseAnimationSetting` (aliases `rise`, `scale-in`, `fade-in`) | | Good; aliases tested |
| Element Reveal (advanced) | `elements/registry.ts` `revealField`, `REVEAL_CHOICES` | | Good |
| Carousel slide motion | `MOTION_CSS` (`sf-drift` 1.08 → 1 over the slide time, `sf-rise` copy on slides 2+) | | Good; premium-feeling |
| Marquee | `MOTION_CSS` `sf-marquee`, RTL keyframes | pauses on hover, static with reduced motion | Good |
| Countdown units pop | `MOTION_CSS` | `scale(.9)` + 14 px | Fine |
| Burger sheet | `MOTION_CSS` | slide in 0.3 s, out 0.2 s (`allow-discrete`) | Good |
| Hover: buttons | `hoverRules` | `translate: 0 -2px` + shadow, press `scale .97` | Good; no underline or icon nudge |
| Hover: cards | `hoverRules` | lift 3 px + shadow | Good |
| Hover: photo zoom | `.sf-zoom>img` | 1.05 over 0.8 s | Good |
| Second photo on hover | `render.tsx` `secondSrc` (bind `image`, `scope.hoverImage`, list prop `hoverSecondImage`) | crossfade 500 ms `ease-in-out`, no settle | **Already built** (gap G11 in `docs/section-rules.md` §11 is out of date). Flat: no settle zoom, and `ease-in-out` at 500 ms feels slow |
| Count-up | not on store sites (`parseCount`/`formatCount`/`easeOutQuad` exist in `presets.ts` for tallaby.com) | | Missing |
| Text / word reveal, wipe, parallax, scroll zoom, sticky steps | none | | Missing (§6.3 "No counting numbers, no parallax, no sticky reveal") |
| Smooth anchor scroll | `html:has(.sf-site){scroll-behavior:smooth}` | | Fine (native, not hijacking) |
| Sticky header | `sticky-store-header.client.tsx` | one passive listener + rAF + `data-header-hidden`, CSS `translate` | The pattern to reuse. It reads `offsetHeight` and `scrollY` (reads only) in the rAF; React `setState` is the write |
| Editor replay | `motion-replay.client.ts` | Web Animations, `fill: backwards`, same values via `revealFrom`, `REVEAL_TIMING` | Good; must learn the new variants |

### 1.3 Docs are out of date

`docs/section-rules.md` §6.1 and `docs/template-rules.md` §6a say 700 ms / 24 px / 80 ms stagger / zoom 1.06. The code is 1.1 s / 28 px / 90 ms / zoom 1.1 + 1.6 s. Motion v2 rewrites both from the code.

### 1.4 Bugs and costs found

1. **The carousel loop never stops** (`carousel-runtime.client.tsx`). Its `requestAnimationFrame` loop runs every frame on every page, even pages with no carousel. Each frame it runs `querySelectorAll("[data-carousel]")` and calls `getBoundingClientRect()` on each carousel, interleaved with `style.setProperty("--p")` writes. Measured: **all 20 (390 px) / 32 (1280 px) forced layouts** on Classic, and about **1.07 s of script per scroll** at 390 px with 4× CPU throttle. On the luxe templates, which have no carousel, it still costs 0.4–0.5 s per scroll.
2. **Cards in horizontal rails can stay hidden.** Rail items off to the side reveal only when they cross the viewport sideways. On fashion-luxe at 390 px, swiping all 4 rails revealed 22 of 24 cards and **2 stayed at opacity 0**.
3. **Style recalculation every frame** while scrolling (800–1,250 recalcs per scroll on every page). Likely sources: the carousel dot write (1), the always-running marquee, and running reveal transitions. Re-measured after (1) is fixed.
4. **Late trigger + long duration** (§1.2) is the main thing that "feels cheap": the first frames of each section are an empty band at the bottom of the screen.

---

## 2. Baseline numbers (before)

Production build, real wheel scrolling, slow scroll top to bottom. 390 = 390×844, DPR 2, **4× CPU throttle**; 1280 = 1280×800, no throttle. Script: `scripts/motion-perf/scroll-perf.mjs` (moved into the repo in Phase 2; today in the session scratchpad).

| Page | Profile | Frames / >20 ms / >33 ms | Long tasks while scrolling | Forced layouts | Script ms while scrolling | CLS | INP ≈ | Left hidden |
|---|---|---|---|---|---|---|---|---|
| tallaby-classic | 390 ×4 | 754 / 6 / 1 | 0 | **20** | 825 | 0 | 136 ms | 0 / 26 |
| tallaby-classic | 1280 | 574 / 2 / 0 | 0 | **32** | 134 | 0 | 16 ms | 0 / 30 |
| fashion-luxe | 390 ×4 | 1156 / 17 / 6 | 0 | 0 | 938 | 0.002 | 192 ms | 24* / 59 |
| fashion-luxe | 1280 | 1096 / 5 / 0 | 0 | 0 | 192 | 0.004 | 24 ms | 16* / 59 |
| perfumes-luxe | 390 ×4 | 1010 / 5 / 0 | 0 | 0 | 691 | 0 | 128 ms | 27* / 52 |
| perfumes-luxe | 1280 | 1124 / 2 / 0 | 0 | 0 | 166 | 0 | 16 ms | 16* / 52 |
| fashion-luxe (en) | 390 ×4 | 1144 / 8 / 0 | 0 | 0 | 865 | 0 | 144 ms | 24* / 59 |
| fashion-luxe (en) | 1280 | 1098 / 5 / 3 | 0 | 0 | 186 | 0.003 | 16 ms | 16* / 59 |

\* Off-screen cards inside horizontal rails (bug 2). Median and p95 frame times are about 16.7 ms everywhere. CLS comes only from load (font swap on the hero title, the marquee), never from a reveal. JS: the runtime chunk is 3.7 KB gzip, of which about **1.0 KB is the reveal runtime and 1.7 KB the carousel runtime**.

**Reading:** frame rate is already fine. The problems are the wasted carousel work, the stuck rail cards, and how motion *feels* (late, slow), not raw jank.

---

## 3. Benchmark (summary)

Full notes: the session's `benchmark.md` (to be copied to `docs/motion-v2/benchmark.md` in Phase 2). Patterns only; no code or assets copied.

| Source | Reveal | Trigger | Stagger | Scroll-linked | Hover | Feel |
|---|---|---|---|---|---|---|
| **Dawn** | fade + rise 20 px, 600 ms, `(0,0,.3,1)`; images fade only | IO rootMargin `-50px` bottom, threshold 0; only below-fold elements are pre-hidden | 75 ms × index **within the IO batch** (so it resets per row) | Zoom on scroll: banner scale 1.00 → 1.20 across its whole pass, passive listener, 100 ms linear smoothing | lift 7.5 px card / 2.5 px button; 2nd image instant + 1.03 zoom; ≥ 990 px only | Calm, premium |
| **Horizon** | no site-wide reveal; motion moved to page View Transitions (125 ms) | — | jumbo text: lines slide up 100% in a mask, 500 ms expo-out, +50 ms/line | slideshow uses CSS `view-timeline` on the inline axis | lift 4 px / scale 1.015–1.03, 250 ms | Restrained |
| **Prestige** | cards 20–30 px, 200 ms; images 1.1 → 1 | top ≈ 0.8 of viewport | **eased** stagger (steps shrink 77 → 38 ms; ≈ 230 ms spread) | sticky image-with-text, stepped crossfades 250–300 ms | 2nd image 100 ms; button fill wipe 450 ms | The most premium |
| **Impact** | cards 15 px, 350 ms; heading words rise 0.5 em + 5° | top 0.66–0.9 | eased, ≈ 290 ms for 6 cards | one pinned "revealed image": clip 37% → 0 + scale 1.4 → 1 over ≈ 1 viewport | 2nd image 200 ms; slow hover zoom 1.5 s | Bold, controlled |
| pure-fashion (EO) | children rise 28 px, 680 ms, `(.22,1,.36,1)`, 55 ms apart | rootMargin −16%, threshold 0.12 | uncapped index × 40 ms | none | none | Clean but flat |
| nature / saad (EO) | mixed directions in one section (±40–50 px), zoom from 0.5, **rotate −10°** on cards | top ≈ 0.8 | none | none | 2nd image 420–520 ms with 1.08 → 1 settle (good) | **Cheap**: random directions, big distances, the header animates on every load, a per-frame JS progress bar |

**What the good ones agree on:** 10–30 px, upward only, ease-out with no bounce, fire at ≈ 80% of the viewport, a row's total delay ≤ ≈ 300 ms, images fade and settle from a slight zoom (never slide), and at most one scroll-linked "wow" section per page. Hover only with a fine pointer; everything is off with reduced motion and in the theme editor.

---

## 4. Gap table

| Effect | Tallaby today | Proposed primitive |
|---|---|---|
| Fade-up reveal | **weaker** (late, 1.1 s, 28 px) | Retuned tokens (§5.4) + early trigger (rootMargin) |
| Image settle reveal | **weaker** (1.6 s, 1.1 scale) | `zoom-in` retuned: 1.06 → 1, 1.0 s, clip 4% |
| Row-aware stagger | **weaker** (list index, linear) | Batch-relative **eased** stagger (§5.3) |
| Rails reveal | **broken** (2 cards stuck) | A rail reveals as one group when it enters vertically |
| Image wipe (clip-path, directional) | missing | `wipe-start` / `wipe-end` / `wipe-up` |
| Text reveal by word | missing | `words` (server-split, Arabic word-safe, one accessible string) |
| Text reveal by line | missing | **Not built** (needs layout reads on every resize); `words` with a mask covers the look |
| Zoom on scroll | missing | Scroll effect `zoom` (CSS `view()` first, JS fallback) |
| Parallax | missing | Scroll effect `parallax` (±8% × intensity, inside a clipped frame) |
| Hero fade on exit | missing | Scroll effect `fade-exit` |
| Sticky steps (image changes with text) | missing | `steps` primitive + one new design |
| Progress line / bar | missing (carousel dot only) | Scroll effect `progress` (scaleX/scaleY of a bar) |
| Count-up numbers | missing on stores | `data-sf-count` on stat values |
| Second photo on hover | **weaker** (500 ms ease-in-out, no settle) | Crossfade 300 ms + 1.04 → 1 settle (700 ms) |
| Button / link hover | **weaker** (lift only) | Underline draw, icon nudge, press; 150–250 ms |
| Rail arrows | have (native smooth scroll) | Keep native smooth (see §5.6); add an active-card state |
| Carousel slide transitions | have (drift + copy rise) | Keep; move its frame loop onto the shared engine |
| Intensity setting | missing | Theme › Motion › Intensity |
| Page View Transitions (Horizon) | missing | **Not built** in v2 (Next.js client navigation; separate project) |
| Hover 3D tilt / sheen (Dawn) | missing | **Not built** (feels gimmicky; off-brand) |
| Pinned "revealed image" (Impact) | missing | Built as the `steps` sticky pattern without pinning the page; a full clip-open pin is **not built** (it hijacks the feel of scrolling) |

---

## 5. Motion v2 design

### 5.1 Principles (unchanged rules, restated)

No animation or smooth-scroll library; no scroll hijacking. Animate only `transform`, `opacity` and `clip-path` (also `translate`/`scale`). Content is visible without JS; things hide only under `.sf-motion`. Reduced motion, or Theme › Motion off: no transforms, no parallax, no pinned effects, everything shown at once. The hero `h1` and first photo are never hidden (the photo may use transform only). No reveal on chrome, buy box, cart, checkout or forms. Logical directions only. The editor canvas never hides anything. Server rendering stays clean.

### 5.2 One source of truth for tokens

New `packages/motion/src/tokens.ts` (pure, no DOM) holds every number. `presets.ts` re-exports it; `MOTION_CSS` and `revealFrom`/`REVEAL_TIMING` (replay) are generated from it. A test checks that `animations.css` (tallaby.com) uses the same ease and distance values (it stays a static CSS file). Tokens are CSS variables on the site root, so Intensity and Speed scale them without new CSS:

```
--sf-dur      reveal duration        (× --sf-speed)
--sf-dist     rise/slide distance    (× --sf-intensity)
--sf-ease     cubic-bezier(.22,1,.36,1)
--sf-zoom     photo settle scale     (1 + 0.06 × intensity)
--sf-range    parallax range         (8% × intensity)
```

### 5.3 Reveals (enter view, once)

**Trigger:** one `IntersectionObserver` with `rootMargin: "0px 0px -12% 0px"` and threshold 0, so an element starts when its top crosses about 88% of the viewport height. This is earlier than today for tall elements and matches the benchmark (median 0.8–0.9). It is still one shared observer and still once only.

**Stagger:** the observer callback gets the entries that enter together (one row, in DOM order). Each one gets `--sf-delay` from an **eased** table, `0, 60, 110, 150, 185, 215 ms` (6 steps, ≈ 215 ms spread at normal speed; item 7 onwards plays with item 6), times `--sf-speed`. Row-aware by construction: row 2 starts from 0 when it enters. The server's `data-reveal-step` stays as it is (the editor replay and the old CSS fallback use it), so old markup still works.

**Rails:** an item of a `rail` / `mobileRail` list never observes alone; the rail reveals as one batch when it enters vertically, so no card is ever left hidden (fixes bug 2).

**Variants** (new ones in bold):

| Variant | From | Duration (normal) |
|---|---|---|
| `fade-up` | opacity 0, `translateY(var(--sf-dist))` (20 px) | 700 ms |
| `fade` | opacity 0 | 600 ms |
| `zoom-in` | opacity 0, `scale(var(--sf-zoom))` (1.06), `clip-path: inset(4%)` | 1,000 ms |
| `slide-start` / `slide-end` | opacity 0, ∓20 px inline (RTL-aware) | 700 ms |
| **`wipe-start` / `wipe-end` / `wipe-up`** | `clip-path: inset(0 0 0 100%)` from the start edge (mirrored on `[dir=rtl]`), from the end, or from the bottom; the photo inside settles 1.06 → 1 | 900 ms |
| **`words`** | each word: opacity 0, `translateY(0.4em)`, inside an inline mask; +40 ms per word, capped at 12 steps | 600 ms per word |

**`words` details.** The server splits the text of `heading` (h2–h6) and short `text`/`paragraph` nodes (≤ 24 words; longer ones fall back to `fade-up`) on whitespace only, **never into letters**, so Arabic letters stay joined. Markup: `<span class="sr-only">full text</span><span aria-hidden="true">` + one `<span data-w style="--i:n">word</span>` per word, with the real spaces kept between them. Screen readers read one string. Without JS, or with reduced motion, the words are plain inline text. `h1` never gets `words` (LCP).

**Retune for existing stores.** The new trigger, eased stagger and token values (700 ms / 20 px / zoom 1.06 over 1 s) change how **every published store** feels without a re-save, because the CSS and runtime are platform code. This is the "pure token retune" the brief mentions, and it needs the owner's yes (§7, Q1). Variants, settings and markup stay the same.

### 5.4 Scroll-progress engine (core of the scroll effects)

File: `packages/store-sections/src/render/scroll-engine.client.ts`, with the math in `elements/scroll-progress.lib.ts` (pure, unit tested).

- **Marking.** The renderer writes `data-sf-scroll="parallax|zoom|fade-exit|progress"` on the element and `data-sf-steps="<n>"` on a steps section. Values come from enums only.
- **CSS first.** With `@supports (animation-timeline: view())`, the effect is a CSS keyframe animation on `animation-timeline: view()` (or `scroll()` for `progress`) with a fixed `animation-range`, so no JS runs for it at all. The engine checks `CSS.supports("animation-timeline: view()")` and **skips** those elements (Chrome, Edge, and Safari 26+).
- **JS fallback** (Firefox today, older Safari):
  - One `IntersectionObserver` with `rootMargin: "50% 0px"` adds an element to the active set when it is near the screen and removes it when it leaves.
  - On entry, and on `resize` or `ResizeObserver`, the engine stores the element's page top and height (`rect.top + scrollY`). These are the only geometry reads, and none of them happen in the scroll path.
  - One passive `scroll` listener schedules one rAF. In that frame it reads `scrollY` and `innerHeight` once, computes each active element's progress from the cached geometry (pure math, **no layout reads**), then writes `--sf-progress` with `style.setProperty` only when the value changed by ≥ 0.001.
  - Writes only, after reads, in the same frame. The listener is idle when nothing is active.
- **Progress math.** `p = clamp((scrollY + vh − top) / (vh + height), 0, 1)` (0 when its top meets the viewport bottom, 1 when its bottom leaves the top). `exit = clamp((scrollY − top) / height, 0, 1)` is used for `fade-exit`. Both are pure functions with tests.
- **Shared with the carousel.** The carousel's autoplay timer moves onto the same loop. A carousel ticks only while the observer says it is on screen and autoplay is on; there is no per-frame `querySelectorAll` and no `getBoundingClientRect` (fixes bug 1). The dot's `--p` becomes a CSS `animation` on the dot with `animation-play-state` (no per-frame JS writes), and the JS only counts elapsed time to advance slides.
- **Off switches.** Reduced motion, `data-sf-motion="off"`, the editor canvas (`ctx.mode === "edit"`: the renderer writes no `data-sf-scroll` there), and print. Without JS, or before the engine runs, `--sf-progress` is unset and the CSS uses its rest value (no transform), so the content looks finished.

### 5.5 Scroll effects (on the engine)

All of these use transforms only, sit inside an `overflow: clip` frame the renderer already draws for photos, and are scaled by `--sf-intensity`.

| Effect | Applies to | Visual (progress p 0 → 1) | Notes |
|---|---|---|---|
| `parallax` | the main photo of a hero, banner or image-with-text, or a shell background photo | `translateY` from `+range` to `−range` (±8% of the frame at Normal), with the image scaled to `1 + 2×range` so no edge shows | Hero first photo: transform only, so LCP is unaffected |
| `zoom` | same | `scale` 1 → 1.12 × intensity over the pass (Dawn-like, smaller) | |
| `fade-exit` | the hero's content block (never the photo) | uses `exit`: opacity 1 → 0.2, `translateY` 0 → −24 px | Only after the visitor scrolls, so LCP is already recorded |
| `progress` | a `box` with role `progress` inside a section | `scaleX` (or `scaleY` for vertical) 0 → 1, `transform-origin: inline-start` (RTL-aware) | Used by the steps design |
| `steps` | a section whose media column is `position: sticky` | the engine sets `data-sf-step="k"` (k = ⌊p·n⌋) on the section only when k changes; CSS crossfades the k-th image (300 ms) and dims the inactive texts to 0.35 | No pinning or scroll capture: the page scrolls normally; sticky is plain CSS. Without JS: every text fully visible, first image shown. On mobile (< 768 px): no sticky; each step stacks with its own image and plain reveals |

Rule: at most **one** scroll effect per section, and templates use them on at most **two** sections per page (benchmark: one "wow" section per page). `template-rules.test.ts` checks this.

### 5.6 Interaction polish

- **Second photo on hover** (already built): crossfade **300 ms** `var(--sf-ease)`, the second photo settles from `scale(1.04)` to 1 over 700 ms, fine pointer only (`@media (hover:hover)`), and off with reduced motion (instant swap, no zoom). The second photo gets `fetchpriority="low"` and stays lazy; it is decoded when the card enters view (`img.decode()`, in the reveal callback), so the first hover never flashes blank.
- **Count-up**: a `text` node with `role: "value"` inside a statistics design, with the new prop `countUp` (default on in the new designs). The server writes the **final** number (SEO, no-JS) as `<span data-sf-count><span class="sr-only">1,080+</span><span aria-hidden="true" style="display:inline-grid">` holding the final text (`visibility: hidden`, which reserves the width, so CLS is 0) and the live counter in the same grid cell. It counts once on enter, over 1.2 s × speed, with `easeOutQuad`, `parseCount`/`formatCount` (Arabic digits and grouping kept), and `font-variant-numeric: tabular-nums`. With reduced motion or motion off it shows the final number.
- **Rails and carousels**:
  - Arrow clicks keep native `scrollBy({behavior: "smooth"})`. A custom eased scroll means animating `scrollLeft` with JS, which fights snap and touch momentum, so it is not built.
  - Snap gets `scroll-snap-stop: normal` with `scroll-padding`, so momentum flings feel natural.
  - The carousel's active slide keeps `sf-drift` and the copy rise; the outgoing slide's copy eases out (ease-in, 250 ms, −8 px, as Prestige does).
- **Buttons and links** (`hoverRules`, zero specificity, fine pointer):
  - Text links get an underline that draws from the inline start (`background-size` 0 → 100%, 250 ms; it is a background, not layout).
  - An icon inside a button or link nudges 3 px toward the inline end (RTL-aware) on hover.
  - Buttons keep the 2 px lift and press `scale(.97)`; durations move to 150–250 ms.

### 5.7 Settings and API

**Theme › Motion** (`designSystem.motion`), additive and optional:

| Field | Values | Stored | Effect |
|---|---|---|---|
| `reveal` | on / off | as today | master switch |
| `default` | auto, fade, fade-up, slide-start, slide-end, zoom-in, stagger, **words**, **wipe** | as today | site default |
| `speed` | slow / normal / fast | as today | `--sf-speed` |
| **`intensity`** | subtle / **normal** / expressive | absent = normal | `data-sf-intensity` → `--sf-intensity` 0.6 / 1 / 1.4: scales distances, zoom amounts and parallax ranges |
| `hoverZoom` | on / off | as today | |

**Section** (`style.shell`):
- `animation` gains `words` (Text by word) and `wipe` (Image wipe; in a section, `wipe` is used for photos and `fade-up` for the rest).
- New **`scrollEffect`**: none / parallax / zoom / fade-exit. It is shown only when the section supports it: `scrollEffectTargets(tree)` finds a non-list photo with `role: "image"` or a banner photo, or a shell background photo; `fade-exit` is offered only on the page's first section.

**Element** (advanced):
- Reveal gains `words` (headings and short text only), `wipe-start`, `wipe-end` and `wipe-up` (images only).
- Images get a new **Scroll effect** field: none / parallax / zoom.

**Parsers and aliases:**
- `parseAnimationSetting` and `animationDefaultSchema` extend their enums. Every old value (`rise`, `scale-in`, `fade-in`, unknown) parses exactly as today.
- `scrollEffect` uses `.catch(undefined)`, so junk is dropped.
- The new intensity is stored only when it isn't normal.
- Every label is added in Arabic and English (`packages/store-editor/src/messages/{ar,en}.json`).

**Attributes the renderer writes** (enum values only): `data-reveal`, `data-reveal-step` (as today), `data-sf-scroll`, `data-sf-steps`, `data-sf-count`, `data-w`, and on the root `data-sf-intensity`.

### 5.8 Editor canvas and replay

The canvas writes `data-reveal` only when Preview animations is on (as today) and never writes `data-sf-scroll`. `replayReveal` learns `words` (it animates the `[data-w]` spans), `wipe-*` (clip-path keyframes) and count-up (one WAAPI-free text count, ending on the final number). When a section's Scroll effect changes, it plays a one-shot demo of the effect with Web Animations: parallax drifts `+range → 0`, zoom 1.12 → 1, fade-exit 0.2 → 1, each over 900 ms with `fill: backwards`, so the canvas is static and visible when it ends.

### 5.9 JS size budget

| Part | Estimate (gzip) |
|---|---|
| Reveal runtime (batch stagger, rails, words, decode) | 1.4 KB |
| Scroll engine (IO, geometry cache, rAF, steps, progress) | 1.3 KB |
| Count-up | 0.4 KB |
| Carousel runtime (on the shared loop) | 1.5 KB |
| **Total motion** | **≈ 4.6 KB** (budget 6 KB; today 2.7 KB) |

A test (`motion-size.test.ts`) bundles the motion client entry with esbuild and fails above 6 KB gzip.

### 5.10 Files

| File | Change |
|---|---|
| `packages/motion/src/tokens.ts` (new), `presets.ts` | tokens, new enum values, `intensity` schema, aliases kept |
| `packages/motion/src/animations.css` | ease/distance aligned with the tokens (tallaby.com; values only) |
| `packages/store-sections/src/elements/motion.ts` | CSS generated from the tokens; new variants, scroll-effect CSS (`@supports` + fallback), intensity, hover polish, count-up and steps CSS |
| `packages/store-sections/src/elements/scroll-progress.lib.ts` (new) | progress/exit/step/stagger math |
| `packages/store-sections/src/elements/render.tsx` | `revealOf` (words, wipe), `data-sf-scroll`, words split, count-up markup, rail batch marker |
| `packages/store-sections/src/elements/shell.ts`, `registry.ts`, `config/schema.ts` | `scrollEffect`, element fields, `intensity` |
| `packages/store-sections/src/render/motion-runtime.client.tsx` | trigger, batch stagger, rails, decode, count-up |
| `packages/store-sections/src/render/scroll-engine.client.ts` (new) | engine; mounted by `MotionRuntime` |
| `packages/store-sections/src/render/carousel-runtime.client.tsx` | loop onto the engine, IO visibility, CSS dot progress |
| `packages/store-sections/src/render/motion-replay.client.ts` | new variants and effect demos |
| `packages/store-editor/src/panels/brand-panel.client.tsx`, `inspector/controls/section-shell.client.tsx`, element advanced fields, `messages/{ar,en}.json` | Intensity, Scroll effect, new reveal options |
| `packages/store-sections/src/designs/**` | six pilot design versions + one new steps design (§6) |
| `scripts/motion-perf/` (new) | the Playwright perf + video scripts (dev-only, not in any app bundle) |
| `docs/section-rules.md` §6, `docs/template-rules.md` §6a, new `docs/motion-how-to.md` | rewritten |

### 5.11 Order of work (Phase 2 and 3; one commit or more per step)

1. Tokens module + tests; docs numbers made true (no visual change yet).
2. Carousel loop fix (bug 1) and rail reveal fix (bug 2). These are pure fixes, safe on their own.
3. Reveal retune (trigger, eased batch stagger, values), after the owner's yes to Q1.
4. Scroll engine + progress math + tests; `parallax`, `zoom`, `fade-exit`, `progress`.
5. `steps`.
6. New reveals: `wipe-*`, `words`.
7. Count-up; hover swap polish; button and link polish; rails/carousel polish.
8. Settings: schema, parsers, editor controls, i18n; editor replay.
9. Size test, then the perf re-run.
10. Pilot designs (§6) and the 3 templates; after-videos; docs; PR.

---

## 6. Phase 3 apply-and-prove plan

**Pilot designs** (new `version`, same `props.field` names, so the library-fields snapshot changes only by addition):

| Kind | Design | Uses |
|---|---|---|
| Hero | `hero-fullbleed` | photo `parallax`, content `fade-exit`, `words` on the h2 eyebrow (never the h1) |
| Image with text | an `image-text` split design | photo `wipe-start` + `zoom` on scroll |
| Products list | `products-grid` | eased row stagger, polished second-photo swap |
| Statistics | `stats-band` | `countUp` values |
| Testimonials | one testimonials grid | `words` heading, eased card stagger |
| Promotion | one promo banner | banner photo `parallax` |
| **New** | `image-text-steps` (sticky steps) | `steps` + `progress` |

**No migration.** Sections and templates have been code-only since 2026-10-27 (CLAUDE.md rule 17; tables dropped in `0109`), so the brief's "insert-only `section:sql` migration" no longer applies. The new design versions ship with the deploy, and every new id goes into `EXPECTED` in `designs/designs.test.tsx`.

**Templates:** `tallaby-classic`, `fashion-luxe` and `perfumes-luxe` get new versions built on the pilot designs. Existing stores keep their own copies, so only new stores and stores that pick the template again get the new sections. Existing stores get only the platform retune (Q1). Classic's design changes need the owner's approval (rule 12); that is Q2.

**Proof:**
- After-videos at 390 and 1280 in `docs/motion-v2/after/`.
- The same perf script re-run, with a before/after table in the PR.
- Targets: 0 forced layouts in the scroll path, CLS 0 from motion, frames > 33 ms ≤ baseline, no INP regression, motion JS ≤ 6 KB gzip.

**Tests:**
- progress/exit/step/stagger math, plus parsers and aliases (every old value);
- reduced motion and `data-sf-motion="off"` (no `data-sf-scroll` effect, nothing hidden);
- RTL directions for slide, wipe and progress;
- no-JS visibility: the server HTML has no hidden state outside `.sf-motion`;
- editor mode never writes `data-sf-scroll` and never hides anything;
- `words` keeps Arabic words whole and gives one accessible string;
- count-up final text in the HTML;
- `template-rules` (at most 2 scroll effects per page, the hero h1 never revealed);
- updated snapshots, and all existing tests pass.

---

## 7. Decisions needed from the owner

1. **Retune for every live store?** The new trigger, eased stagger and token values (700 ms / 20 px / zoom 1.06 over 1 s instead of 1.1 s / 28 px / 1.1 over 1.6 s) apply to every published store at once. Nothing is hidden that wasn't before; motion just becomes earlier, shorter and calmer. *Recommendation: yes.*
2. **Tallaby Classic**: OK to give the default template a new version with the pilot sections (parallax hero, count-up stats, steps)? (Rule 12: its design changes need your approval.) *Recommendation: yes, but without the steps section, so Classic stays simple.*
3. **No migration** for the pilot designs (code-only since 0109). Confirm.
4. **The new steps design** as a 7th pilot. Without it the steps primitive has no design to prove it. *Recommendation: yes.*
5. **Branch and PR.** The brief asks for a new branch and a PR; the standing rule is "commit on main, no pushes until merge". *Recommendation: branch `feat/motion-v2`, local commits, push and open the PR only when you say so.*

---

## 8. Not built, and why

| Item | Why |
|---|---|
| Line-by-line text reveal | Needs layout reads (line breaks) on load and every resize; `words` gives the same look without them |
| Page View Transitions (Horizon) | Next.js client navigation; a separate project with its own risks (scroll restoration, LCP) |
| Pinned "clip-open" image section (Impact) | Pins the page for 1–2 screens, which feels like hijacking; `steps` gives scrollytelling with normal scrolling |
| JS-eased rail scrolling | Animating `scrollLeft` fights snap and touch momentum; native smooth scroll stays |
| 3D tilt / sheen hover | Gimmicky, and off-brand for calm stores |
| Header animation on load | Delays the most-used UI on every page (a cheap EasyOrders pattern) |
| Changing tallaby.com's motion beyond token values | Out of scope; its runtime stays as it is |
