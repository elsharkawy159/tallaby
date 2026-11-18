# Tutorial kit

Everything every Tallaby tutorial video shares. The rules are in [`../TUTORIALS.md`](../TUTORIALS.md); this folder is how they are built. A video never restyles an overlay: change the kit and render the videos again.

## What is here

| File | What it is |
|---|---|
| `kit.css` | The overlays, in video pixels (1080×1920): colour and font tokens, title card, step caption card and progress dots, tap marker, highlight outline, typing caret, result check, end card |
| `kit.js` | The runtime. Reads the video's script and builds one timeline: step changes (350 ms slide plus blur), taps, typing, highlights, scrolls, zooms, the result check, the end card |
| `build.mjs` | Builds a video's HyperFrames project from its script and page, places the sounds, and cuts and places the voiceover |
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
3. **Build:** `node "Tutorial Videos/_kit/build.mjs" "Tutorial Videos/T-xx-slug"`. It stops with a message if the script breaks a rule (3 to 5 steps, 4–6 s a step or up to 7 s with a voice, caption length, Latin digits, end card length, every tap followed by a reaction 0.3 s later, every spoken sentence fitting its beat).
4. **Check and look**, inside `work/`: `npx hyperframes check` (0 errors), then `npx hyperframes snapshot --at 0,5,10` and read the pictures.
5. **Render:** `npx hyperframes render --quality delivery --crf 18 --fps 30 --output renders/raw.mp4`.
6. **Finish:** `node "Tutorial Videos/_kit/finish.mjs" "Tutorial Videos/T-xx-slug"`. It writes `video.mp4`, `poster.jpg` and `work/stills/`, and prints the numbers of TUTORIALS.md §10. Look at every still.
7. Write `video.md` from the template in TUTORIALS.md §6.
8. Refresh the upload list: `node "Tutorial Videos/_kit/youtube-list.mjs"` rewrites `Tutorial Videos/YOUTUBE.md` (every video's YouTube title and description, ready to copy).

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
  stageBg: "#faf8f5", // optional: the colour around the screen when the camera lifts it (default: read from the page)
  voice: { /* the voiceover, see "Voiceover" below */ },
  events: [ /* what happens on the page, see below */ ],
};
```

The title card lasts until the first step's `at`. Give it more than 2 s when the opening line needs it.

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

## Voiceover

Put the approved take in `work/` (for example `work/vo/take.mp3`) and say where each sentence is in it, in seconds. Find the pauses with `ffmpeg -i take.mp3 -af silencedetect=noise=-35dB:d=0.12 -f null -` and cut inside them.

```js
voice: {
  src: "vo/take.mp3",
  opening: { from: 0, to: 3.52 },      // spoken over the title card
  steps: [{ from: 3.52, to: 6.17 }, /* one per step, in order */],
  closing: { from: 17.06, to: 19.76 }, // spoken over the result
},
```

`build.mjs` places the opening at 0.3 s, each step's sentence 0.3 s after that step's `at`, and the closing 0.3 s after `resultAt`. It never speeds up, stretches or trims the voice. It stops with a message when:

- a sentence ends less than 0.4 s before the next one starts (start the next beat later, or shorten the sentence);
- the closing ends after `endAt` (nothing is spoken over the end card);
- a cut is inside speech instead of a pause;
- the take's peaks are so tall that reaching the loudness would need more than 6 dB of limiting.

One gain is applied to the whole take, so every sentence has the same level. The gain is chosen so the video measures about -16 LUFS. A limiter with a -2.5 dBFS ceiling catches only the tallest peaks; the build prints how many samples it touched. To set the gain by hand, add `gainDb` to the `voice` block.

With a voice, the build also writes `assets/voice-mix.wav` (voice alone), `assets/audio-mix.wav` (voice + sounds, the video's sound) and `voice-cues.json` (where each sentence landed, the gap after it, the gain and the measured loudness). A video without a `voice` block builds exactly as before, with `assets/sfx-mix.wav` as its sound. A voice needs `ffmpeg` on PATH at build time.

## Sounds

`python sfx/make_sfx.py` makes the five files again (no packages needed). Each sound's peak is set in `PEAK_DB` at the top of that file. The sounds are quiet on purpose and are never raised to compete with the voice.

## What `finish.mjs` checks

| | With a voice | Sounds only |
|---|---|---|
| Loudness of the video | -18 to -14 LUFS | at most -28 LUFS |
| True peak | at most -1.5 dBTP | at most -16 dBTP |
| Sounds alone | peak at most -16 dBFS, and at least 15 dB under the voice | — |

Both also check the size, frame rate, codecs, duration (20–40 s, target 28–35 s), file size and faststart. T-01 with its voice measures -16.1 LUFS and -2.2 dBTP; its sounds alone -36.3 LUFS and -18 dBFS.

## Good to know

- The composition is one generated `index.html`. `hyperframes lint` warns that it is large and not split into sub-compositions; that is expected, because the kit writes it and nobody edits it by hand.
- The dashboard screen is marked `data-layout-ignore`: it is a page scrolling under fixed bars, so HyperFrames' text-overlap audit does not apply to it. The overlays are still audited.
- HyperFrames' own safe area for vertical video ends at y 1330. TUTORIALS.md puts the caption's bottom edge at y 1460, so the caption carries `data-layout-allow-safe-zone`.
- **Around the screen.** When the camera lifts the screen (`zoom` with `below`) or a video moves `#tk-cam` itself, part of the frame shows the stage behind the screen. For each such move the kit seeks to where the move ends, reads the page's colour just inside the edge that left the frame (every background under that point, scrims included), and sets it on the stage as the move starts, so the area reads as the page going on. A hairline and a soft shadow mark the screen's edge; both sit outside the frame until the camera moves. If the colour can't be read, the stage uses `--tk-stage-bg` (default `#fafaf8`, the dashboard page), which a video's `screen.css` can set on `:root`. `stageBg` in `video.mjs` fixes one colour for every move instead.
- If the dashboard's design changes, update `dashboard/dashboard.css` and `dashboard/topbar.html` from `apps/dashboard`.
