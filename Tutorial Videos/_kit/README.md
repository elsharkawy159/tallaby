# Tutorial kit

Everything every Tallaby tutorial video shares. The rules are in [`../TUTORIALS.md`](../TUTORIALS.md); this folder is how they are built. A video never restyles an overlay: change the kit and render the videos again.

## What is here

| File | What it is |
|---|---|
| `kit.css` | The overlays, in video pixels (1080×1920): colour and font tokens, title card, step caption card and progress dots, tap marker, highlight outline, typing caret, result check, end card |
| `kit.js` | The runtime. Reads the video's script and builds one timeline: step changes (350 ms slide plus blur), taps, typing, highlights, scrolls, zooms, the result check, the end card |
| `build.mjs` | Builds a video's HyperFrames project from its script and page, and places the sounds |
| `finish.mjs` | Turns the render into `video.mp4`, `poster.jpg` and review stills, and checks the format and loudness |
| `dashboard/dashboard.css` | The seller dashboard's look at phone width (tokens, top bar, buttons, fields, section card, switch, toast), copied from `apps/dashboard` |
| `dashboard/topbar.html` | The dashboard's top bar on a phone |
| `sfx/` | The five sounds (`pop`, `tap`, `key`, `whoosh`, `success`) and `make_sfx.py`, which makes them |
| `fonts/` | Noto Kufi Arabic and Montserrat |
| `logo/` | The real logo files: `logo-white.png` (on teal), `logo-word.png`, `logo-mark.png` |

## Make a new video

You need Node 22+, `ffmpeg` and `ffprobe` on PATH, and `pnpm install` done in the repo (icons come from its `lucide-react`).

1. **Start the folder.** `npx hyperframes init "Tutorial Videos/T-xx-slug/work"`.
2. **Write three files in `work/`** (copy T-01's and change them):
   - `screen.html`: the dashboard page, rebuilt from the real components at 390×693 CSS px. Each page is a `<section class="tk-screen db-page">`. `<!-- @kit topbar -->` puts the top bar in. `<i data-lucide="tag"></i>` becomes the real Lucide icon.
   - `screen.css`: only this page's layout. Shared pieces come from `dashboard/dashboard.css`.
   - `video.mjs`: the script (below).
3. **Build:** `node "Tutorial Videos/_kit/build.mjs" "Tutorial Videos/T-xx-slug"`. It stops with a message if the script breaks a rule (3 to 5 steps, 4–6 s a step, caption length, Latin digits, end card length, every tap followed by a reaction 0.3 s later).
4. **Check and look**, inside `work/`: `npx hyperframes check` (0 errors), then `npx hyperframes snapshot --at 0,5,10` and read the pictures.
5. **Render:** `npx hyperframes render --quality delivery --crf 18 --fps 30 --output renders/raw.mp4`.
6. **Finish:** `node "Tutorial Videos/_kit/finish.mjs" "Tutorial Videos/T-xx-slug"`. It writes `video.mp4`, `poster.jpg` and `work/stills/`, and prints the numbers of TUTORIALS.md §10. Look at every still.
7. Write `video.md` from the template in TUTORIALS.md §6.

## The script (`video.mjs`)

```js
export default {
  title: "إضافة منتج جديد",            // title card, at most 2 lines
  breadcrumbs: ["المنتجات", "إضافة منتج"], // end card
  duration: 31.8,
  steps: [{ at: 2.0, text: "اختر «إضافة يدويًا»" }, /* 3 to 5 */],
  resultAt: 26.2,  // the caption leaves; the result shows
  checkAt: 27.25,  // the gold check, for 1.5 s
  checkOn: "#new-product", // optional: put the check on this element's corner
  endAt: 29.0,     // end card
  events: [ /* what happens on the page, see below */ ],
};
```

Times are seconds. Events can be in any order. Positions are never typed: the kit measures the element on the page at that moment.

| Event | What it does |
|---|---|
| `{ t, op: "scroll", sel, to, y, dur }` | Scrolls the page `sel` until `to` sits at video height `y`. Keep targets between y 240 and 1180 |
| `{ t, op: "zoom", to, z, y, below, dur }` | Pushes in on `to` (`z` up to 1.4). `below` lets the screen lift past the bottom of the frame, for a button fixed to the bottom of the page |
| `{ t, op: "zoomOut", dur }` | Back to the whole screen |
| `{ t, op: "tap", sel }` | Gold ring and ripple on `sel`, with the `tap` sound. The page must react at `t + 0.3` |
| `{ t, op: "hl", sel, dur }` | Gold outline around `sel`. Use it while the page is still |
| `{ t, op: "type", sel, text, dur, group }` | Types into `sel`, `group` letters at a time (default 2), with a caret and one `key` sound per group. A `<span class="tk-ph">` inside `sel` is its placeholder |
| `{ t, op: "text", sel, value }` | Changes a text at that moment |
| `{ t, op: "attr", sel, name, value }` | Sets an attribute, so `screen.css` can show another state. Give the attribute a starting value in the HTML |
| `{ t, op: "screen", from, to }` | Goes from one page to another with the step-change transition |
| `{ t, op: "set" \| "to" \| "fromTo", sel, props, … }` | Plain GSAP, for anything else the page does |
| `{ t, op: "spin", sel, dur }` | A loading spinner turning |

The title card, the caption card, the dots, the result check, the end card and all five sounds are added by the kit from `steps`, `checkAt` and `endAt`. A video never adds its own.

## Sounds

`python sfx/make_sfx.py` makes the five files again (no packages needed). Each sound's peak is set in `PEAK_DB` at the top of that file. The sounds are simple and quiet on purpose (owner, 2026-11-17): one plain soft tone each. With these values T-01 measures -36.3 LUFS and -18 dBTP; TUTORIALS.md §5 asks for at most -28 LUFS and at most -16 dBTP, and `finish.mjs` checks both. After changing a sound, run `build.mjs` and `finish.mjs` again for each video; the picture does not need a new render.

## Good to know

- The composition is one generated `index.html`. `hyperframes lint` warns that it is large and not split into sub-compositions; that is expected, because the kit writes it and nobody edits it by hand.
- The dashboard screen is marked `data-layout-ignore`: it is a page scrolling under fixed bars, so HyperFrames' text-overlap audit does not apply to it. The overlays are still audited.
- HyperFrames' own safe area for vertical video ends at y 1330. TUTORIALS.md puts the caption's bottom edge at y 1460, so the caption carries `data-layout-allow-safe-zone`.
- If the dashboard's design changes, update `dashboard/dashboard.css` and `dashboard/topbar.html` from `apps/dashboard`.
