# Storefront motion benchmark (motion v2 research)

Date: 2026-11-11. Sources: Shopify Dawn and Horizon on GitHub (read, not copied), plus 6 live stores measured with
Playwright (Chromium) at 390x844 (iPhone UA, DPR 2) and 1280x800. Each run scrolled 200 px every 250 ms to the bottom,
logged IntersectionObserver options, `Element.animate` calls, class changes (with computed transition/animation at that
moment), inline-style churn, and computed transform/opacity/clip-path per element at every step. Hover was measured on
a product card and a button at 1280. Patterns only; no code or assets copied.

Units: Dawn sets `html { font-size: 62.5% }`, so Dawn `1rem = 10px`. "top" = element top as a fraction of viewport
height at the moment the effect fired (1.0 = bottom edge).

---

## 1. Shopify Dawn (source study)

| Section / element | What moves | Trigger | Duration + easing + distance | Mobile | Notes |
|---|---|---|---|---|---|
| Headings, text, buttons, cards, "view all" (`scroll-trigger animate--slide-in`) | opacity 0.01 to 1 + translateY 20px to 0 | Enter view, one-shot (IO `rootMargin: 0 0 -50px 0`, default threshold 0, `unobserve` after first hit) | 600ms, `cubic-bezier(0, 0, 0.3, 1)` (Dawn's `--ease-out-slow`), fill forwards | Same | Calm and premium: short distance, strong ease-out, no overshoot. Hidden state is opacity 0.01, not 0. |
| Banners, image media (`animate--fade-in`) | opacity 0.01 to 1 | Enter view | 600ms, same ease-out-slow | Same | Images fade only, never slide. |
| Grid items with `data-cascade` | Same slide-in | Enter view | Delay = `--animation-order` x 75ms. Liquid sets order = loop index (1-based); when a batch enters together JS overwrites it with the index inside the IO callback batch, so items that appear together stagger 0, 75, 150 ms. No explicit cap; in practice capped by how many items enter in one batch (one row). | Sliders on mobile/tablet: items do not animate individually, the whole slider animates once | Batch-relative stagger avoids long delays for item 12 of a grid. |
| Image banner "zoom in" (`animate--zoom-in`) | `scale` of the image: 1 + 0.002 x percentSeen, so 1.00 to 1.20 | Scroll-linked. percentSeen = 0 when element top hits viewport bottom, 100 when its bottom passes viewport top (distance travelled / (viewport + element height)). Updates only while IO says visible. | CSS `transition: scale 100ms linear` smooths the steps | Same | Passive scroll listener wrapped in a `throttle()` called without a delay, so it effectively runs on every scroll event. Skipped entirely under `prefers-reduced-motion: reduce`. |
| Image banner "fixed" (`animate--fixed`) | Image `position: fixed; height: 100vh` inside a `clip-path: inset(0)` container | Scroll (pure CSS, no JS) | n/a | Same | Cheap parallax with zero JS. |
| Image banner "ambient" | Image orbits: rotate 0 to 360 deg with translateX 1em, scale 1.2 | Load, infinite | 30s linear loop | Same | Only under `no-preference`. Subtle drift. |
| Card hover, "vertical lift" | Card translateY -7.5px; `:active` -5px. Buttons -2.5px, `:active` 0 | Hover | Card 300ms, button 200ms, ease-out-slow | Only `(hover: hover)` | Small, tactile. |
| Card hover, "3D lift" | Card rotate 1 deg (0.5 deg in collage), big soft shadow, diagonal white sheen sweeps across (overlay blend, opacity 0.2) | Hover | Leave 500ms ease; while hovering the transform eases over 3s (slow drift); sheen background-position over 6s | Only `(hover: hover)` | Playful; heavier than lift. |
| Product card media | Second image: first image opacity 0, second image opacity 1 + scale 1.03. Single image: scale 1.03 | Hover | 500ms ease on transform; opacity swap has no transition (instant) | Only at >= 990px | Instant swap + slow zoom. |
| Header menus / drawers | `animateMenuOpen`: opacity + translateY -15px to 0 | Open | 200ms ease | Same | |
| Theme editor | On `shopify:section:load` / `section:reorder` adds `scroll-trigger--design-mode`: opacity 1, no animation, no transform | `Shopify.designMode` | n/a | n/a | Editor never shows half-hidden sections. |
| Reduced motion | All reveal keyframes live inside `@media (prefers-reduced-motion: no-preference)`; hover effects require `no-preference` and `hover: hover`; zoom-on-scroll JS returns early | | | | |
| No-JS / above-fold | Hidden state only applies via the "offscreen" class, which JS adds to elements that are NOT intersecting. Elements already on screen at load just play the 600ms animation on first paint. Without JS, nothing is hidden. | | | | Progressive enhancement worth copying. |

Duration tokens: 100 (short), 200 (default), 300 (medium), 500 (long), 600 (extra-long, used for reveals), 750, 3000 ms.
Reveal can be turned off globally (`animations_reveal_on_scroll`, default on); hover style is a global select (none / vertical-lift / 3d-lift).

## 2. Shopify Horizon (source study + demo)

| Section / element | What moves | Trigger | Duration + easing + distance | Mobile | Notes |
|---|---|---|---|---|---|
| Global scroll reveal | None. Horizon has no site-wide reveal-on-scroll class. Demo confirmed: only a 150ms opacity fade on resource cards. | | | | Deliberate restraint; motion is moved to navigation and specific blocks. |
| Page navigation | Cross-document View Transitions (`@view-transition { navigation: auto }`). Old main content fades out; new main fades in and slides up from 100px | Link click (MPA) | ~125ms (`--animation-speed`), ease-in-out | Same | Disabled for reduced motion, low-power devices, first visit and reloads (render blocker removed). |
| Card to product page | Product image morphs from the card into the PDP gallery (named view transition), product details as a second group | Click on card | Group 125ms ease-in-out; image old/new crossfade 250ms, `object-fit: cover` | Same | Feels app-like. Setting `transition_to_main_product`. |
| Slideshow slides | translate 6rem (96px) to 0 to -6rem + opacity 0 to 1 to 0 | Scroll-linked to the slider's own horizontal scroll: CSS scroll-driven animation (`view-timeline` on each slide, inline axis, `animation-timeline`) | linear, tied to scroll position | Same (touch swipe drives it) | Inside `@supports (animation-timeline: auto)`; off under reduced motion. Dots also use per-slide timelines. |
| Jumbo text, effect "blur" | filter blur 20px to 0, opacity 0.5 to 1, scale 1.05 to 1 | Enter view, IO thresholds [0, 0.3], fires at 30% visible; optional repeat (resets when it leaves) | blur/scale 1.6s, opacity 1.3s, `cubic-bezier(0.16, 1, 0.3, 1)` (expo-out) | Same | Text auto-fits width; waits a frame after resize before revealing. |
| Jumbo text, effect "reveal" | Each line slides up from translateY 100% inside an overflow-hidden mask | Same | 500ms expo-out, +50ms per line | Same | Classic masked line reveal. |
| Card hover (setting) | lift: translateY -4px; scale: 1.03; subtle zoom: image scale 1.015 | Hover | 250ms ease-out | Only `(any-pointer: fine)` + no-preference | Very small values. |
| Card second image | Optional setting `show_second_image_on_hover` (off on demo) | Hover | | | Demo: quick-add button fades in 125ms `cubic-bezier(0.33, 1, 0.68, 1)`; gallery arrows fade + slide ~3px in 125ms. |
| Add to cart | "Fly to cart": product thumb travels to cart icon with separate x / y / scale curves (x has anticipation) | Click | 600ms | Same | |
| Easing tokens | ease-out-cubic, ease-out-quad, hover `cubic-bezier(0.25, 0.46, 0.45, 0.94)`, fade-in expo-out, a bounce `cubic-bezier(0.34, 1.56, 0.64, 1)`, and spring curves written with CSS `linear()` (perceptual 180 to 300ms, real 0.30 to 0.50s, no bounce) | | Speeds: 62.5 / 125 / 150 / 200ms | | Springs via `linear()` = no JS spring lib. |
| Theme editor | `Shopify.designMode` checks (e.g. no infinite scroll in editor) | | | | |

Demo note: theme-horizon-demo.myshopify.com is a short page (2 screens on mobile; desktop locks `html, body` overflow),
so most Horizon findings come from source.

## 3. EasyOrders stores (the competitors)

All three use the same EasyOrders theme engine (`ps-*` / `ab-*` classes), plain CSS keyframes + one IntersectionObserver,
no GSAP / AOS / Lenis / Swiper (Saad uses Swiper for one carousel).

### 3a. nature-fashion.myeasyorders.com ("BELLA FASHION")

| Section | What moves | Trigger | Duration + easing + distance | Mobile | Feel |
|---|---|---|---|---|---|
| Header (logo, nav, tools) | Logo zoomIn scale 0.5 to 1; nav fadeInDown -40px; tools fadeInLeft -50px | Load (every page) | 500 to 600ms, `cubic-bezier(0.25, 0.46, 0.45, 0.94)` (ease-out-quad) | Same, menu zone fadeInRight +50px | Cheap: animating the header on every navigation delays the most used UI. |
| Hero slider | Slides peek left/right; progress bar under dots grows scaleX 0 to 1 | Timer (autoplay) | JS rewrites the bar's inline transform every frame (~930 style writes during one scroll) | Same | Progress bar is nice; JS per-frame is wasteful (CSS animation would do). |
| Every section block (titles, kickers, cards, FAQ items, editorial cards, footer columns) | opacity 0 to 1 + one of: fadeInUp (+40px Y), fadeInDown (-40px Y), fadeInLeft (-50px X), fadeInRight (+50px X), zoomIn (scale 0.5), scaleIn (scale 0.8) | Enter view, one-shot. IO desktop `rootMargin 0 0 -50px 0`, threshold 0.1; mobile -20px, 0.05. Fired when element top was at 0.66 to 0.93 of the viewport (median ~0.8). | 600ms (500ms for zoom/scale), ease-out-quad | Same set on mobile | Directions are mixed within one section (one card drops from above, its neighbour comes from the left). Reads busy and template-like. Pre-hidden state is translateY 20px but keyframes start at 40/50px, so the start jumps (hidden by opacity 0). No stagger. |
| Product card | Primary image fades out (420ms ease) and scales 1.01; hover image fades in (520ms) and settles from scale 1.08 to 1 (720ms) with `cubic-bezier(0.22, 0.61, 0.36, 1)`; quick view / choose buttons fade in (250 to 380ms) | Hover | as stated | No hover on touch | This one is good: slow crossfade + settle-in zoom feels premium. |
| Buttons (newsletter submit) | translateY -1px + bigger shadow | Hover | 200ms ease | n/a | Fine. |

### 3b. pure-fashion.myeasyorders.com ("ZARO")

| Section | What moves | Trigger | Duration + easing + distance | Mobile | Feel |
|---|---|---|---|---|---|
| Announcement bar | Slides out left (translateX -100%) + fade, next one in | Timer | 500ms ease | Same | OK. |
| Hero, shop-the-look, sale timer, newsletter (section-level) | Children: opacity 0 to 1 + translateY 28px to 0 | Enter view: section gets one "in" class, children carry `--delay` = index x 55ms (0, 55, 110, 165) | 680ms, `cubic-bezier(0.22, 1, 0.36, 1)` (quint/expo-out) | Same | The best motion on the EasyOrders sites: one trigger per section, short stagger, strong ease-out. |
| Category cards, product cards, section titles (`ab-reveal`) | opacity 0 to 1 + translateY 30px to 0 | Enter view, IO `rootMargin 0 0 -16% 0`, threshold 0.12; fired at top 0.76 to 0.97 | 600ms ease-out-quad; card delay = index x 40ms (no cap) | Same | Clean. Uncapped index stagger would get long in big grids. |
| Shop-the-look skeleton | shimmer | Loading | 1.2s linear loop | | |
| Product card | No image swap, no lift (measured: nothing changed on hover) | Hover | | | Flat. Slider arrows fade 200ms. |
| Newsletter button | Only opacity transition defined; nothing visible on hover | Hover | | | |

### 3c. saadperfume.myeasyorders.com

Same `ps-*` engine as nature-fashion (header zoom/fade on load, random-direction section reveals, same IO options and
card crossfade CSS), plus:

| Section | What moves | Trigger | Duration + easing + distance | Mobile | Feel |
|---|---|---|---|---|---|
| Product grid cards | Random per card: fadeInUp/Down/Left/Right, scaleIn 0.8, and **rotateIn** (rotate -10 deg + scale 0.9) | Enter view | 500 to 600ms ease-out-quad | Same | Cheapest pattern seen: rotating product cards. |
| Swiper carousel images | "zoom-fade": scale 1.1 to 1 + opacity 0 to 1 when the image loads | Image load | 600ms ease (class swap also has 500ms opacity transition) | Same | Fine as an image-load reveal. |
| Feature/icon row (`animate-slideIn`) | translateY 36px + opacity 0.01 to 1 | Enter view (top ~0.97) | 600ms `cubic-bezier(0, 0, 0.3, 1)`, delay steps of 75ms (225ms seen) | Same | A Dawn-style block inside the EasyOrders page: two motion languages on one page. |
| Desktop nav | 72 class toggles for "overflowed" nav items during scroll | Scroll/resize | | | Layout work while scrolling. |
| Load | Body scroll is locked for the first ~1 s on mobile (wheel did nothing until a popup/lock cleared) | | | | |

## 4. Shopify premium theme demos (live)

### 4a. Prestige (prestige-theme-allure.myshopify.com), Motion One (WAAPI)

| Section | What moves | Trigger | Duration + easing + distance | Mobile | Feel |
|---|---|---|---|---|---|
| Hero slideshow / video hero | Media opacity 0 to 1 + scale 1.20 to 1; then text block opacity + translateY 30px; then buttons +20px | Load, and on each slide change | One 1.2s timeline: media settles over the first 800ms (`cubic-bezier(0.25, 0.46, 0.45, 0.94)`); text starts at 400ms and runs 600ms (`cubic-bezier(0.21, 0.61, 0.35, 1)`); buttons start at 600ms | Same | Sequenced entrance written as one keyframe timeline with offset holds instead of delays. Very premium. |
| Slide leave | Outgoing text opacity 1 to 0 + translateY 0 to -8px; incoming +8px to 0 | Slide change | 300ms; leave `cubic-bezier(0.64, 0, 0.78, 0)` (ease-in), enter `cubic-bezier(0.22, 1, 0.36, 1)` (ease-out) | Same | Correct pairing: ease-in out, ease-out in. |
| Image sections / image-with-text | Image opacity 0 to 1 + scale 1.10 to 1 (via a CSS variable); text opacity after | Enter view, top ~0.8 | 900ms timeline: 300ms hold, then 300ms reveal, ease | Same | |
| Product grids | Cards opacity 0 to 1 + translateY 20px to 0 | Enter view (top ~0.87) | 200ms ease-in-out each; first card waits 400ms; stagger shrinks: +77, +66, +53, +38ms (eased stagger, ~230ms total spread) | Mobile grids are horizontal scrollers; cards don't animate | Short per-item duration + eased stagger = row "ripples" without lag. |
| Blog cards | opacity + translateY 30px | Enter view (top ~0.84) | 250ms ease, delays 0 / 147 / 253ms | Same | |
| "Images with text scroll" | Sticky image column; images crossfade as each text block becomes active; text blocks fade between 0.25 and 1 | Scroll position (step changes, not continuous) | 250 to 300ms | Same | Pinned storytelling section. |
| Before/after slider | Divider sweeps from 0 to its start position | Enter view | ~0.5s (34 frames of a CSS variable) | Same | Teaches the interaction. |
| Header | Transparent over hero, becomes solid; logo swaps (two logos crossfade) | Scroll past hero | 200ms ease (bg, color, border, shadow), 150ms transform | Same | |
| Product card hover | Second image crossfade; quick-add button fades in and rises 5px to 0 | Hover | Images 100ms ease-in-out (fast); button 200ms ease-in-out | n/a | Crisp. |
| Collection/zoom images | Slow zoom on hover | Hover | 8s `cubic-bezier(0.25, 0.46, 0.45, 0.94)` on scale | n/a | "Ken Burns" hover. |
| Button hover | Background fill wipes across (background-size/position), text color flips | Hover | 450ms `cubic-bezier(0.785, 0.135, 0.15, 0.86)` (easeInOutCirc) | n/a | Premium signature. |

### 4b. Impact (impact-theme-sound.myshopify.com), Motion One (WAAPI)

| Section | What moves | Trigger | Duration + easing + distance | Mobile | Feel |
|---|---|---|---|---|---|
| Hero slideshow | Slide fade out 300ms ease-in, next slide in; image opacity + scale 1.05 to 1; heading split into words: each word translateY 0.5em + rotate 5 deg to 0; subheading and button fade after | Load + every 6s (autoplay) | Image 600ms ease-out over first 300ms; words 600ms, start at 300ms; circular progress ring on the dots fills over 6s linear | Same | Bold but controlled; word-rotate gives energy. |
| Section headings ("impact-text", split text) | Words: translateY 0.5em + rotateZ 5 deg + opacity to rest | Enter view (top 0.66 to 0.9) | 400ms ease, +100ms per word/line | Same | |
| Big text blocks | translateY 10px + opacity | Enter view | 300ms ease | Same | |
| Product grids | Cards opacity + translateY 15px | Enter view (top ~0.8 desktop, ~0.93 mobile) | 350ms ease each; eased stagger 0, 78, 147, 205, 253, 287ms (6 cards, ~290ms spread) | Same | |
| Media grid / collection cards | Item opacity + translateY 10px; image fades in with scale 1.03 to 1; caption after | Enter view | 400 to 600ms with 50% holds | Same | |
| **Revealed image** (pinned) | Section pins; image window opens from a centred small box (clip-path inset ~37%) to full bleed while the image zooms out from scale 1.4 (plus a small translate) to 1; overlay text fades in | **Scroll-linked**: whole open happens over ~800px (~1 viewport) of scroll, then the section stays pinned ~1600px | Driven by a paused WAAPI animation whose progress follows scroll; ease-in on clip/scale | Same | The "wow" section. Pinned scrollytelling, one per page. |
| Image reveal (wipe) | clip-path inset from the right (0 0 0 100%) to 0, rounded corners kept | Enter view | 700ms | Same | |
| Header | Transparent to filled, backdrop blur | Scroll | 250ms ease | Same | |
| Product card hover | Second image crossfade (no zoom, no lift) | Hover | 200ms ease-in-out | n/a | |
| Product image hover | Slow zoom | Hover | 1.5s `cubic-bezier(0.22, 1, 0.36, 1)` | n/a | |
| Button hover | Background darkens to 85% alpha | Hover | 150ms ease-in-out | n/a | Plain. |
| Newsletter popup | Opens after load, locks scroll (`html.lock`) | Timer | | | Blocks hover/scroll until closed. |

---

## 5. Common patterns (what the good ones agree on)

**Reveal on enter**
- Distance: 10 to 30px translateY (Dawn 20, Prestige 20 to 30, Impact 10 to 15, Pure 28 to 30). Never sideways in good themes; horizontal entries (+-50px) only on EasyOrders.
- Opacity always paired with the move; Dawn starts at 0.01 (keeps the element paintable for LCP).
- Duration per element: 200 to 350ms (Prestige, Impact cards) or 600 to 680ms with a strong ease-out (Dawn, Pure). Long durations only with expo/quint-out curves.
- Easing: ease-out family. Seen: `cubic-bezier(0, 0, 0.3, 1)` (Dawn), `cubic-bezier(0.22, 1, 0.36, 1)` (Pure, Prestige in), `cubic-bezier(0.16, 1, 0.3, 1)` (Horizon), `cubic-bezier(0.21, 0.61, 0.35, 1)` / `(0.25, 0.46, 0.45, 0.94)` (Prestige), plain `ease` (Impact). No bounce/overshoot on any reveal.
- Images: fade + scale-down settle (1.03 to 1.20 to 1), not slide. Hero media 1.05 (Impact) to 1.20 (Prestige).
- Exit / leave: ease-in, 300ms, small (-8px), paired with ease-out enter (Prestige).
- Sequencing: hero = one timeline with holds (media first, text +400ms, buttons +600ms) rather than independent triggers.

**Stagger**
- Fixed step: 40ms (Pure), 55ms (Pure sections), 75ms (Dawn), 100ms (Impact words).
- Eased stagger (Prestige/Impact): steps shrink (78, 69, 59, 48, 34ms), total spread ~230 to 290ms for a row of 5 to 6.
- Caps: Dawn resets the index per IO batch (so a stagger never exceeds one row); others rely on rows. Recommend cap ~6 items / ~300 to 400ms total.
- Trigger once per section/row, not per element (Pure's section class, Dawn's batch index, Motion's inView on the grid).

**Triggering**
- IO with a negative bottom margin: Dawn -50px; EasyOrders -50px (desktop) / -20px (mobile) at threshold 0.05 to 0.1; Pure -16% at 0.12; Impact/Prestige -50 to -100px, threshold 0.
- Measured fire point: element top at 0.66 to 0.97 of viewport, median ~0.8. Nothing fired later than 0.97 (no "late" reveals).
- One-shot (unobserve) everywhere except Horizon jumbo text (optional repeat).
- Elements already in view at load animate on load, never stay hidden.

**Scroll-linked**
- Rare and limited to one hero-style section: Dawn zoom-on-scroll (scale 1.00 to 1.20 across the full pass through the viewport), Impact pinned reveal (clip-path ~37% inset to full + image scale 1.4 to 1 over ~1 viewport, then pinned ~2 viewports), Horizon slideshow (CSS view-timeline, translate 96px + opacity, horizontal), Prestige sticky image-with-text (stepped crossfades).
- No site measured uses classic per-element parallax on scroll; Dawn's "fixed" background is the only parallax (CSS only).
- Implementation: CSS scroll-driven animations where supported (Horizon), or one paused animation whose progress is set from scroll (Impact, Dawn with a 100ms linear smoothing transition).

**Hover (desktop / fine pointer only)**
- Second-image swap: crossfade 100ms (Prestige), 200ms (Impact), 420 to 520ms with 1.08 to 1 settle (EasyOrders ps-theme), instant + 1.03 zoom over 500ms (Dawn).
- Lift: 4px (Horizon), 7.5px card / 2.5px button (Dawn), 1px button (EasyOrders). Scale: 1.015 to 1.03.
- Slow image zoom on hover: 1.5s (Impact) to 8s (Prestige).
- Quick-add reveal: fade + rise 5px in 125 to 200ms.
- Buttons: fill wipe 450ms easeInOutCirc (Prestige) is the premium signature; color/alpha change 150ms (Impact) is the minimum.
- All gated on `(hover: hover)` / `(any-pointer: fine)` plus `prefers-reduced-motion: no-preference`.

**Text reveal**
- Masked line slide-up (translateY 100% in overflow-hidden lines, 500ms expo-out, +50ms per line) — Horizon.
- Word split with small rotation (0.5em + 5deg, 400 to 600ms, +100ms per word) — Impact.
- Blur-in (20px blur, 1.05 scale, 1.3 to 1.6s expo-out) — Horizon jumbo text.

**Timers / ambient**
- Autoplay hero 6s with a progress ring/bar (Impact, nature-fashion). Dawn ambient orbit 30s linear.

**Reduced motion and editor**
- Reduced motion: Dawn/Horizon put every reveal and hover inside `no-preference`; JS effects (zoom-on-scroll, view transitions, jumbo text) check the media query and skip. Horizon also skips view transitions on low-power devices.
- Theme editor: Dawn shows everything instantly in design mode (no reveal, no transform) after section load/reorder.
- No EasyOrders store measured honours reduced motion in a visible way (not tested with the flag; nothing in their classes suggests it).

## 6. What janks or feels cheap

- **Mixed directions in one section** (EasyOrders nature/saad): up, down, left, right, zoom 0.5 and rotate -10 deg side by side. Reads random.
- **Big distances / scale**: 40 to 50px slides and scale 0.5 zoom on logos and forms; rotateIn on product cards.
- **Animating the header on every page load** (logo zoomIn, nav/tools sliding in): delays navigation and repeats on each page.
- **Per-frame JS for a progress bar** (~930 inline style writes in one scroll session) instead of a CSS animation.
- **Layout work during scroll**: 72 nav "overflowed" class toggles while scrolling (saad).
- **Two motion languages on one page** (saad: EasyOrders random keyframes plus a Dawn-style ease-out block).
- **Uncapped index stagger** (pure: index x 40ms) gets long in big grids.
- **Scroll lock at load / popups** (saad mobile ~1 s lock; Impact newsletter popup with `html.lock`) block the first scroll and hover.
- **Flat hover** (pure: no image swap, no lift, button with no visible change) feels unfinished next to the others.
- Not seen anywhere: bouncy easing on reveals, layout shift from reveals (all use transform/opacity), late triggers (all fire by 0.97 of viewport).

## 7. Videos (Playwright recordings, .webm)

Folder: `C:\Users\elsha\AppData\Local\Temp\claude\55b71fcc0546c797\05566254-1629-41ac-87f3-acf9f5deaec2\scratchpad\bench-out\videos\`

- nature-desktop\page@0b69b016bceca24cb99f95595017cd76.webm
- nature-mobile\page@2261a6d910b54bb7ac9da58ef9d710c8.webm
- pure-desktop\page@1b575d388047b88fe94acab8731c5416.webm
- pure-mobile\page@603e27835141b5db9a6f82e17a63420c.webm
- saad-desktop\page@6b8f76f48e969af905af0540f4018803.webm
- saad-mobile\page@f17ed28bf995ea945b00bbce34e73378.webm
- prestige-desktop\page@6fe5e91dd83b09de8065781e402a5583.webm
- prestige-mobile\page@4efd4c3cd976c44a35abc025e7d36b10.webm
- impact-desktop\page@7c58e0f77393ddee25c3a8d838d35965.webm
- impact-mobile\page@76637ef7bfbef9872a2eb90cae697351.webm
- horizon-desktop\page@fce4cf246853a0b64fe4435c03eeee8e.webm (page does not scroll on desktop; hero only)
- horizon-mobile\page@1f818e299064750aacd3f50bb6c69e4c.webm

Raw measurements: `...\scratchpad\bench-out\<store>-<desktop|mobile>.json`. Scripts: `...\scratchpad\bench-scripts\`
(`run.js` scroll + record, `instrument.js` page hooks, `analyze.js` / `waapi.js` summaries, `hover.js` / `hover2.js` hover probes).
Source copies read for this study: `...\scratchpad\src-dawn\`, `...\scratchpad\src-horizon\`.

Caveats: 200px / 250ms steps can miss sub-250ms states; hover was measured with a synthetic mouse (Saad's card hover was
intercepted by an overlay, so its card values come from the identical nature-fashion component); Impact's first desktop
load timed out once and was re-run; Horizon demo locks page scroll on desktop.
