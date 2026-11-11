# Storefront motion: performance baseline ("before" motion v2)

Date: 2026-11-11. Repo `main` at `01533452`, with a clean working tree.

## Method

- **Server:** production build. `pnpm --filter ecommerce build` took 9.0 min with Turbopack. The pages were served with `next start -p 3000` from `apps/ecommerce`. These are production-like numbers, not dev mode. `.env` points at the production Supabase, but the runs only read pages. No navigation, form submit, sign-in or write route was hit: the probe blocks anchor clicks and form submits in the capture phase.
- **URLs:** Arabic is the default locale with no prefix, and `/ar/...` returns a 307 to the bare path. The runs used:
  - `/template-preview/tallaby-classic`
  - `/template-preview/fashion-luxe`
  - `/template-preview/perfumes-luxe`
  - `/en/template-preview/fashion-luxe`
- **Browser:** Playwright 1.x bundled Chromium **158.0.8127.18**, headless, launched with `--disable-features=PaintHolding`.
- **Profiles:**
  - **390:** 390×844, `isMobile`, `hasTouch`, DPR 2, CPU throttled 4× (CDP `Emulation.setCPUThrottlingRate`).
  - **1280:** 1280×800, DPR 1, no throttle.
- **Each page × profile gets two fresh contexts:**
  1. **Slow run.** Video is recorded. The page loads, waits 2 s, then scrolls to the bottom with real `mouse.wheel` input (12 px per step, a step every ~16 ms, about 600–750 px/s actual). A Chrome trace and CDP `Performance.getMetrics` cover the scroll only. After 4 s of settling, the probe checks for elements left hidden.
  2. **Fast run.** No video. The page loads, waits 2 s, then wheels 80 px per step to the bottom. Then it does the interactions: a carousel arrow or dot, a product card link (click prevented), and the header burger at 390 (closed with Esc).
- **Why wheel input and not `scrollBy` in rAF:** a first try with `scrollBy` showed that my own rAF scroll loop caused all the "forced" layouts. Wheel input lets the browser drive the scroll, so forced layouts in the trace come from page code.
- **Probes installed before navigation (`addInitScript`):**
  - PerformanceObservers for `layout-shift` (with source node selectors and a "has `[data-reveal]`" flag), `longtask`, `event` (durationThreshold 16) and LCP.
  - A rAF frame-delta logger tagged by phase (load, scroll, after, interact).
- **Metric definitions:**
  - **>20 ms** = a frame longer than one 60 Hz vsync plus slop.
  - **>33 ms** = two or more vsyncs missed (dropped).
  - **Forced layout** = a trace `Layout` event nested inside a JS task (FunctionCall, rAF, timer, event) on CrRendererMain.
  - **INP approx** = the maximum, over interactions, of the event-timing duration grouped by `interactionId`. Chrome rounds this to 8 ms.
- **Caveats:**
  - Headless rAF is vsync-capped at 16.7 ms, so p50 and p95 sit at about 16.7 almost everywhere. Use the >20 ms and >33 ms counts, the long tasks and the trace numbers to compare runs.
  - Video recording costs CPU in the slow run. It is the same in before and after runs, so the comparison holds.
  - The tracking-consent banner shows at the bottom of every run because consent is never clicked (clicking it would write state).

## Results

The slow and fast columns cover the scroll phase only.

| template | profile | page h | slow frames / >20 / >33 / max | slow long tasks | fast frames / >20 / >33 / max | load long tasks (n / ms) | LCP | CLS total / during scroll | Layout / RecalcStyle (count, slow scroll) | LayoutDur / RecalcDur / ScriptDur ms | forced layouts (n / ms) | INP≈ ms | reveal els / left hidden at end |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| tallaby-classic | 390 (4× CPU) | 4469 | 754 / 6 / 1 / 50.1 | 0 | 187 / 3 / 2 / 50 | 5 / 696 | 504 | 0 / 0 | 185 / 801 | 141 / 768 / 825 | **20 / 22** | 136 | 26 / 0 |
| tallaby-classic | 1280 | 3444 | 574 / 2 / 0 / 33.4 | 0 | 143 / 0 / 0 / 16.8 | 1 / 79 | 224 | 0 / 0 | 216 / 772 | 37 / 164 / 134 | **32 / 7.6** | 16 | 30 / 0 |
| fashion-luxe | 390 (4× CPU) | 6549 | 1156 / 17 / 6 / 50 | 0 | 243 / 6 / 2 / 33.4 | 10 / 1346 | 740 | 0.002 / 0 | 33 / 1251 | 42 / 1005 / 938 | 0 | 192 | 59 / 24* |
| fashion-luxe | 1280 | 6194 | 1096 / 5 / 0 / 33.4 | 0 | 247 / 3 / 0 / 33.4 | 0 / 0 | 212 | 0.0041 / 0 | 50 / 1184 | 15 / 270 / 192 | 0 | 24 | 59 / 16* |
| perfumes-luxe | 390 (4× CPU) | 5709 | 1010 / 5 / 0 / 33.4 | 0 | 231 / 2 / 0 / 33.4 | 8 / 1047 | 1092 | 0 / 0 | 28 / 826 | 35 / 458 / 691 | 0 | 128 | 52 / 27* |
| perfumes-luxe | 1280 | 6342 | 1124 / 2 / 0 / 33.3 | 0 | 244 / 0 / 0 / 16.8 | 1 / 57 | 212 | 0 / 0 | 46 / 891 | 13 / 147 / 166 | 0 | 16 | 52 / 16* |
| fashion-luxe (en) | 390 (4× CPU) | 6526 | 1144 / 8 / 0 / 33.4 | 0 | 238 / 3 / 2 / 33.4 | 8 / 1003 | 464 | 0 / 0 | 31 / 1227 | 44 / 1003 / 865 | 0 | 144 | 59 / 24* |
| fashion-luxe (en) | 1280 | 6194 | 1098 / 5 / 3 / 33.4 | 0 | 248 / 3 / 1 / 33.4 | 0 / 0 | 192 | 0.003 / 0 | 45 / 1178 | 12 / 263 / 186 | 0 | 16 | 59 / 16* |

p50 and p95 frame time were 16.7 / 16.7–16.8 ms in every scroll run. There were no long tasks during any scroll, slow or fast.

\* "Left hidden" means product cards in **horizontal rails (`[data-rail]`)** that sit off-screen sideways. They have `data-reveal="fade-up"`, never intersect the viewport during a vertical scroll, and so stay at opacity 0 until the rail is swiped. A follow-up check (fashion-luxe, 390) swiped all 4 rails: 24 hidden became 2. They are not stuck for good, but each card fades up only while the customer is swiping, and a couple at the far end were still 0 after the swipe test. Classic has no rails, so it had 0.

**Interactions:**
- The carousel arrow or dot was clicked only on tallaby-classic. The luxe templates have no `[data-carousel]` (carousels = 0).
- The product link and the burger were clicked on every page.
- INP≈ is 16–24 ms on desktop and 128–192 ms at 390 with 4× CPU. The worst was fashion-luxe at 192 ms, the burger opening the menu sheet.

## Where the scroll cost goes (trace, slow scroll, script time by function)

| run | carousel rAF loop `b` (`2afh3fq01yj1o.js:1:4839`) | React continuous event dispatch `fD` (framework) | probe's own rAF logger | IO callback (motion runtime) |
|---|---|---|---|---|
| classic 390 | **1074 ms** (and all 20 forced layouts) | 182 | 80 | 5.8 |
| classic 1280 | **207 ms** (and all 32 forced layouts) | 23 | 14 | 1.0 |
| fashion 390 | **518 ms** (0 carousels on the page!) | 252 | 123 | 11 |
| fashion 1280 | 112 | 43 | 25 | 1.5 |
| perfumes 390 | **376 ms** (0 carousels) | 206 | 88 | 7.3 |
| perfumes 1280 | 96 | 39 | 24 | 1.3 |

### Key findings

1. **The carousel runtime's rAF loop is the biggest motion-related cost, and it never stops.** `CarouselRuntime` (`packages/store-sections/src/render/carousel-runtime.client.tsx`, the `requestAnimationFrame` progress loop) runs every frame for the life of the page.
   - **Every frame:** it runs `document.querySelectorAll("[data-carousel]")`.
   - **For each carousel, every frame:**
     - `getBoundingClientRect()` (a visibility check).
     - `style.setProperty("--p", …)` on the active dot.
   - **Effect on pages with a carousel:** this causes **every forced layout seen during scroll** (20 at 390, 32 at 1280 on Classic) and a style invalidation each frame.
   - **Effect on pages without a carousel:** fashion and perfumes have none, yet the loop still costs 0.4–0.5 s of main-thread time per ~17–20 s of scrolling at 4× CPU, about 25 ms per second.
   - **Fix for motion v2:** start the loop only while a carousel is on screen (IntersectionObserver) and stop it otherwise. Drive the progress dot with a CSS animation instead of a per-frame `--p` write.
2. **The reveal runtime itself is cheap.** The IntersectionObserver callback (`threshold: .15`) costs 1–11 ms per run. Load-time `getBoundingClientRect()` over every `[data-reveal]` is part of the load long tasks; there are no scroll long tasks.
3. **RecalcStyle runs about once per frame during scroll on every page** (800–1250 recalcs; 1.0 s of recalc time at 390 on the luxe pages). Layout counts stay low on the luxe pages (28–50). The extra recalc likely comes from the running reveal transitions (opacity, transform, clip-path on zoom-in), the announcement marquee animation and the carousel loop's `--p` writes. This is not confirmed per source; a trace in DevTools would split it. It is the number to watch in "after".
4. **CLS is effectively 0:** at most 0.004, all during load and none during scroll. No layout-shift source is a `[data-reveal]` element, so reveals use transforms only and cause no shifts. The CLS sources are listed below.
5. **Frame drops are rare.** At 390 / 4× CPU, fashion-luxe is the worst: 17 frames over 20 ms and 6 over 33 ms in 1156 frames. That is about 1.5 %, with a max of 50 ms. At 1280 there are almost none.
6. **What the videos show (contact sheets from the webm):**
   - Each section enters as **a blank band at the bottom of the viewport** before it fades and rises in. At 390 the heading shows first and the cards fill in over the next ~1 s; for example fashion-luxe at t≈4 s, where the category grid is empty under "الأقسام".
   - With the 1.1 s duration and the 15 % threshold, content is visibly behind the scroll at a normal reading speed. This reads as "pop-in" lag, not jank.
   - The hero never flashes, because elements already on screen are un-marked at start.
   - The sticky bottom nav (390) and the cookie banner stay fixed with no visible jitter.
   - A hide-on-scroll header handler never appeared among the top script functions in any trace.

## CLS sources (all during load, none `[data-reveal]`)

- **fashion-luxe 390** (0.002 at t=1.4 s): `h1.text-balance.text-4xl` (hero title, a webfont swap: the rect is unchanged and the shift comes from text reflow).
- **fashion-luxe 1280** (0.0009 at 226 ms + 0.0032 at 668 ms):
  - hero `h1.text-balance.text-4xl`
  - the hero's `div.flex.min-w-0` (CTA row)
  - a `#text` node
  - the header nav `a.block.min-w-0`
  - the announcement marquee `div.flex.min-w-[100vw] > p.text-sm`
- **fashion-luxe (en) 1280** (0.003 at 197 ms): the same set (hero h1, hero text, CTA row, marquee `p`, nav link).
- **tallaby-classic:** only zero-value entries, from the carousel dot's `i.relative.block`. The `--p` progress bar is reported as a 0-score shift every time it runs.
- **perfumes-luxe:** none.

## JS size of the runtimes (production build, `.next/static/chunks`)

- **The runtime chunk:** `2afh3fq01yj1o.js`, loaded by the preview page, is **10,186 B raw / 3,741 B gzip (−9)**.
- **Turbopack modules inside it:**

  | module | raw / gzip | contents |
  |---|---|---|
  | MotionRuntime | 2,216 / **1,011** | reveal + countdown ticker (`sf-motion`, `threshold:.15`) |
  | CarouselRuntime | 4,136 / **1,700** | |
  | Menu-sheet runtime | 1,207 / 650 | |
  | Bottom-nav and small helpers | ~2.5 KB / ~1.6 KB | |

- **Motion part:** about **1.0 KB gzip**, or about **2.7 KB with the carousel runtime**.
- **Motion CSS strings in the shared render chunk:** `1hdh_qot8s5y-.js` (46 KB raw / 16.7 KB gzip) carries about 1.25 KB raw / 0.45 KB gzip of template literals mentioning `data-reveal`, `is-inview` or `sf-motion`.
- **Whole page for context:** fashion-luxe loads 25 JS chunks, about 452 KB gzip in total.
- **Other builds of the same runtimes:** `0pz9mhyw_j_rx.js` and `3eue5rls947la.js` contain them too (other entry points such as the builder and storefront). The preview page doesn't load them.

## Files

- **Videos (slow scroll, including load):** `F:\Programming Projects\tallaby\docs\motion-v2\before\`
  - `tallaby-classic-390.webm` / `-1280.webm`
  - `fashion-luxe-390.webm` / `-1280.webm`
  - `perfumes-luxe-390.webm` / `-1280.webm`
  - `fashion-luxe-en-390.webm` / `-1280.webm`
- **Raw results (all numbers, every shift and source, interactions, events):** `C:\Users\elsha\AppData\Local\Temp\claude\55b71fcc0546c797\05566254-1629-41ac-87f3-acf9f5deaec2\scratchpad\perf-work\results-before.json`
- **Traces:** `C:\Users\elsha\AppData\Local\Temp\claude\55b71fcc0546c797\05566254-1629-41ac-87f3-acf9f5deaec2\scratchpad\perf-work\trace-<slug>-<size>.json`. Load them in DevTools › Performance.
- **Contact sheets:** `C:\Users\elsha\AppData\Local\Temp\claude\55b71fcc0546c797\05566254-1629-41ac-87f3-acf9f5deaec2\scratchpad\perf-work\sheet-<slug>-<size>.png`

## Re-running after motion v2

Playwright is installed in `C:\Users\elsha\AppData\Local\Temp\claude\55b71fcc0546c797\05566254-1629-41ac-87f3-acf9f5deaec2\scratchpad\perf`. If the scratchpad is gone, recreate it with `npm init -y && npm i playwright && npx playwright install chromium` and pass `--pw=<that folder>`.

Script: `C:\Users\elsha\AppData\Local\Temp\claude\55b71fcc0546c797\05566254-1629-41ac-87f3-acf9f5deaec2\scratchpad\perf-scripts\scroll-perf.mjs`

1. Build and start the server:

   ```
   cd "F:\Programming Projects\tallaby"; pnpm --filter ecommerce build
   cd apps/ecommerce; npx next start -p 3000
   ```

   The build rewrites `apps/ecommerce/next-env.d.ts`. Run `git checkout -- apps/ecommerce/next-env.d.ts` afterwards.
2. Run the script:

   ```
   node "<scratchpad>\perf-scripts\scroll-perf.mjs" http://localhost:3000 "F:/Programming Projects/tallaby/docs/motion-v2/after" --traces
   ```

   Optional flags:

   | flag | default | what it sets |
   |---|---|---|
   | `--pages=` | the 4 above | comma-separated paths without a leading slash |
   | `--profiles=` | `390,1280` | the profiles to run |
   | `--slow=` | `12` | px per wheel step, slow run |
   | `--fast=` | `80` | px per wheel step, fast run |
   | `--json=` | `<scratchpad>\perf-work\results-<outDir name>.json` | where the results go |
   | `--work=` | | folder for traces and the video temp files |
   | `--pw=` | | folder that contains `node_modules/playwright` |

3. Contact sheet of any video:

   ```
   node "<scratchpad>\perf-scripts\video-frames.mjs" <video.webm> <out.png> 18
   ```

4. Rail cards that stay hidden after a vertical scroll:

   ```
   node "<scratchpad>\perf-scripts\stuck-probe.mjs" <url> 390
   ```

Compare these numbers across runs:
- slow-scroll `ScriptDur`
- `RecalcStyle` count and duration
- `forced layouts`
- the `b@…` entry in `slow.trace.scriptBy`, which will move to a new name and chunk after the change
- the >20 ms and >33 ms frame counts at 390
- "left hidden at end"
- INP≈
