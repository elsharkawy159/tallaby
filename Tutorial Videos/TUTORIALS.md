# Tallaby tutorial videos (طلبي) — rules and topics

Short "how to do it" videos for sellers, one video per dashboard feature. Each video is uploaded as a YouTube Short, and its link is opened from a **"شاهد الشرح"** button on that feature's page in the seller dashboard (`ROADMAP.md` F-97).

Owner request, 2026-11-17. This file is the single source for **what** tutorials exist and **how** every one of them looks and sounds.

**How this differs from the marketing videos.** Marketing videos follow [`TALLABY_VIDEO_RULES.md`](../.claude/skills/brag-slim/TALLABY_VIDEO_RULES.md) (music, phone mockup, hook, CTA, the Tamer voice). Tutorials follow **this file**. Where the two conflict, this file wins for tutorials. Still shared, unchanged, from the marketing rules:

- §1 facts and brand: colours, fonts, logo, Latin digits, no real data on screen, the banned words list, only finished features.
- §5 "Arabic must be perfect" and "Show the real product".

---

## 1. What a tutorial is

- **One feature, one task, one video.** "How to add a product", not "everything about products".
- **Audience:** a seller who is already inside the dashboard and pressed "شاهد الشرح". They want to copy the steps. No selling, no pain story, no hook line, no `tallaby.com` call to action.
- **Only finished features** that are on production (`ROADMAP.md` §2.1 Live, or an F-xx with every task `[x]`). Check the page in the code and on production before filming (CLAUDE.md rule 1).
- **The video must match the real page.** Same labels (exact strings from `apps/dashboard/messages/ar.json`), same order of fields, same buttons. When the page changes, the video is re-made (§9).

## 2. Format

| Setting | Value |
|---|---|
| Size | **9:16, 1080×1920**, 30 fps |
| Duration | **28–35 s** target. Hard limits 20–40 s |
| Sound | **A calm Egyptian voiceover** (§5.1), quiet simple sound effects (§5.2), **no music** |
| Language | Arabic interface and Arabic step captions (the dashboard's default locale); the voiceover is Egyptian Arabic |
| Codec | H.264 High, `yuv420p`, CRF 18, `-movflags +faststart`; AAC 48 kHz stereo (192k encoder setting) |
| File | `.mp4`, under 45 MB |

## 3. Screen: full-screen mobile, no small mockup

The owner's rule: the screen must be **clear**, so the dashboard fills the whole video. No phone frame, no bezel, no background around a small phone.

- **The dashboard's mobile layout fills the full 1080×1920 frame.** Build or capture the page at a **390×693 px** viewport and scale it ×2.77. A 14 px label becomes about 39 px on the video, which reads easily on a phone.
- **Real screens:** rebuild the page from the repo's components with the real Arabic strings, filled with fictional data (store "متجر نور", prices like `299 جنيه`, no real seller, customer, phone or order).
- **Zoom when it helps:** push in up to **1.4×** on the field or button being used, then ease back out. Never zoom so far that the viewer loses where they are on the page.
- **YouTube Shorts covers parts of the frame.** Keep the thing being tapped and the step caption inside the safe area:
  - top 200 px: nothing important
  - bottom 420 px: nothing important (title, channel, subscribe)
  - right 160 px: nothing important (like, comment, share)
  - Scroll or zoom the page so each step's target sits between **y 240 and y 1180**.
  - **A button fixed to the bottom of the page** (a save or publish bar) sits under the Shorts buttons. For the step that uses it, lift the whole screen so the button sits near y 1090, then bring the screen back. This is the only time the dashboard may not fill the frame; keep it under 3 s.

## 4. One design system for every video

Every tutorial uses the same kit, kept in `Tutorial Videos/_kit/` and imported by each video. **Never restyle an overlay inside one video**; change the kit and re-render if the design has to change.

| Element | Spec |
|---|---|
| Colours | Teal `#145163`, gold `#fdad28`, off-white `#fafaf8`, white. Nothing else in overlays |
| Fonts | Noto Kufi Arabic (Arabic), Montserrat (Latin and digits) |
| **Title card** (from 0 s) | Teal full frame, white logo at top, the task as the title (72–96 px bold, at most 2 lines), small gold label "شرح سريع". It is also frame 0, so it is the YouTube thumbnail |
| **Step caption** | One card, centred on x = 540, bottom edge at y 1460, 860 px wide, teal `#145163` at 94% opacity, 28 px radius. The card's edge may reach into the right 160 px zone, but the number circle and the text end at x 920. Gold circle with the step number on the right, white text 50–56 px semi-bold, at most 2 lines and about 7 words |
| **Step progress** | A row of small dots above the caption card: gold for the current step, white 40% for the others |
| **Tap marker** | Gold ring, 96 px, 6 px stroke, with one soft ripple (400 ms). Shown on every tap, 300 ms before the screen reacts |
| **Typing** | Text appears letter group by letter group with a caret; Arabic is rendered by the browser, never drawn letter by letter |
| **Highlight** | A 6 px gold outline around the field or button the step is about, with 16 px radius or the element's own radius when that is larger |
| **Step change** | One transition for all videos: a 350 ms slide plus blur. Scrolls inside a page use ease-in-out |
| **Result card** | When the task is done: the real success state of the page, plus a white check in a gold circle (168 px) for 1.5 s, on the corner of the element that proves the result |
| **End card** (last 2.5–3 s) | Teal full frame, white logo, the line "جرّبها الآن من لوحة التحكم" and the page's path as breadcrumbs (for example "المنتجات ‹ إضافة منتج") |

**Timeline (same for every video):**

| Time | Beat |
|---|---|
| 0 to about 4 s | Title card, for as long as the opening sentence lasts (at least 2 s) |
| then | 3 to 5 numbered steps, 4–6 s each (up to 7 s when the step's sentence needs it). One action per step |
| about 3 s | The result on the real page, until the closing sentence ends |
| last 2.5–3 s | End card, nothing spoken |

T-01 runs: title 0–4.2 s, steps 4.2–28.4 s, result 28.4–31.7 s, end card 31.7–34.3 s.

**Caption wording:** short, plain Arabic that every seller understands, with neutral verbs: اضغط، اكتب، اختر، أضف، احفظ، انشر. Use the page's own button names in the caption ("اضغط «حفظ»"). Use the owner's word choices: جنيه، الهاتف، التاجر. Read every caption against the banned words list in the marketing rules §1 before rendering.

## 5. Sound: a calm voiceover, quiet effects, no music

Owner, 2026-11-17: every tutorial has a simple, calm, human-sounding voiceover in Egyptian Arabic. The sound effects stay simple and quiet under it. There is never music.

### 5.1 Voiceover plan

**The voice (same in every tutorial)**

| Setting | Value |
|---|---|
| Voice | **Hanafi – Educational – Egyptian** (ElevenLabs), `voice_id: DWMVT5WflKt0P8OPpIrY`. Chosen by the owner on 2026-11-17 from nine test takes (`T-01-add-product/work/vo-tests/`) |
| Model | `eleven_v4`, the connector's default voice settings. Never raise style, expressiveness or speed |
| Tags | None. No `[excited]`, `[calm]`, `[laughs]` or any other tag; pauses come from punctuation only |
| Tone | **Calm, professional and a little friendly, never laughing** (owner, 2026-11-17: "a bit fun but not laugh"). Warm like a good trainer, the same from the first word to the last. **No laughing, chuckling, giggling or smiling-while-talking sounds**, no sighs, no playful or joking delivery |
| Takes | One generation of the whole script. Generate again only when the take fails the checks below, after fixing the script |
| If Hanafi is unavailable | Stop and ask the owner. Do not switch voice on your own, and never use a non-Egyptian voice |

This voice is for tutorials only. Marketing videos keep their own voice (Tamer).

**How the script is built**

Every script has the same three parts, so all tutorials sound like one series:

1. **Opening** (over the title card): **one plain statement** that names the task and how many steps it takes, for example "هنضيف مُنتَج جديد على طَلَبي، في خمس خطوات بسيطة." Say **طَلَبي** here when it fits naturally.
   - **Never open with a question followed by a reassuring remark** ("عايز تضيف منتج؟ الموضوع بسيط."). The voice read exactly that pattern with a laugh on "الموضوع بسيط" in two takes of T-01 (owner, 2026-11-17). Chatty asides invite a laugh: الموضوع بسيط، سهلة خالص، ولا يهمك، بسيطة، متقلقش.
2. **Steps:** one sentence per step, starting with its number as a word: "واحد:", "اتنين:", "تلاتة:", "أربعة:", "خمسة:". The sentence says the same action as the step's caption on screen.
3. **Closing** (over the result): one sentence that says what the seller now has. No call to action, no "tallaby.com".

**Length:** 40–55 words, about 220–300 characters, which Hanafi reads in about 17–22 seconds. Longer scripts drift in tone.

**Writing rules**

- **Keep it formal** (owner, 2026-11-17): respectful and businesslike, like a trainer explaining a tool at work. Nothing in the script invites a laugh: no jokes, no teasing, no slang exclamations (يا عم، يا باشا، هههه), no "!" and no emoji. Every sentence is a statement that ends with a full stop; no questions.
- **Egyptian Arabic, simple and polite**, the way a helpful colleague explains something: عايز، اختار، ضيف، اكتب، دلوقتي، كده، بقى. No Modern Standard words (سوف، الآن، يمكنك، هذا) and no Gulf or Levantine words (أبغى، الحين، كذا، شلون، هالـ).
- **Anybody must understand it.** Sentences of 3–8 words, one action each. No technical terms without a plain word beside them. Call things by the name written on the button or field.
- **Clear, polite verbs with the thing named after them:** ضيف منتجك، اكتب الاسم، اختار الفئة، اضغط نشر، دخّل البيانات، افتح الصفحة، ارفع الصور، فعّل الخيار، احفظ التغييرات، راجع البيانات، شارك الرابط.
- **Numbers are written as Egyptians say them:** واحد، اتنين، تلاتة، تلاتمية جنيه. Never digits in the script.

**Words that are never said (double meanings)**

- Owner's list, 2026-11-17: ادخلو، ادخلهولك، احطهولك، هتحطه، اديك، اديهولك، تديهوله.
- The whole list in the marketing rules §1 also applies (حطه، حطها، دخّله، دخّلها، طلّعه، نزّله، ركّبه، خدها، اديها، كبّرها، حرّكها، and questions built on "فين؟").
- **The rule behind the lists:** never an instruction verb with a pronoun stuck to it (ـه، ـها، ـهولك، ـهوله). Always say the verb and then name the thing: "ضيف المنتج", "دخّل البيانات". Do not use the verbs حطّ and ادّى at all; use ضيف، اكتب، ابعت، شارك.
- Read the finished script once only for this, before generating.

**Diacritics (تشكيل), so no word changes its meaning**

- **Full تشكيل on every word** of the text sent to ElevenLabs (owner, 2026-11-18: "so voiceover be 100% correct"): a vowel on each letter, shadda and sukun included, marked the way an Egyptian speaker says it (هَنْضِيف، اِضْغَط، مُنْتَجَك), never MSA case endings. The table below lists words the voice got wrong before; it is a check list, not the only words to mark. If a marked word still comes out wrong or too formal in the take, change the marking, not the voice settings. (Videos made before 2026-11-18 used marks only on hard words; they stay as approved.)
- **طَلَبي is always written with its diacritics** in every script.
- Always written this way in scripts (add to this list whenever a take misreads a word):

| Write | So it is not read as | Meaning |
|---|---|---|
| طَلَبي | — | the brand name |
| مُنتَج | مُنتِج (producer) | product |
| صُوَر | صَوَّر (he photographed) | photos |
| سِعر | سَعَّر (he priced) | price |
| نَشر | نَشَرَ (he published) | the Publish button |
| اكتِب | أَكتُب (I write) | write |
| اضغَط | ضَغط (pressure) | press |
| ضيف | ضَيف (guest); write "ضِيف" if a take misreads it | add |
| فِئة | — | category |
| طَلَب / طَلَبات | طَلَبَ (he asked) | order / orders |
| مَتجَر | — | store |
| مَحفَظة | — | wallet |
| شَحن | — | shipping, or topping up |
| خَصم | خِصم (opponent) | discount |
| عَرض | عُرض (width) | offer |
| كَمّية | — | quantity |
| حِفظ | — | the Save button |
| رَصيد | — | balance |
| عُملة | عَمَلة | currency |
| يَدَوِيًّا | — | by hand (the "إضافة يدويًا" choice) |

**English words are written in Arabic letters**, so the voice says them clearly. The voice never reads Latin letters.

| English | In the script |
|---|---|
| Domain | دومين |
| Pixel | بيكسِل |
| Coupon | كوبون |
| Link | لينك |
| Email | إيميل |
| SEO | إس إي أو |
| AI | إيه آي |
| MCP | إم سي بي |
| PDF | بي دي إف |
| Excel | إكسِل |
| Pro | برو |
| WhatsApp | واتساب |
| InstaPay | إنستا باي |
| Vodafone Cash | فودافون كاش |
| Kashier | كاشير |
| Bosta | بوسطة |
| Meta | ميتا |
| TikTok | تيك توك |
| Google | جوجل |
| YouTube | يوتيوب |
| Shopify | شوبيفاي |
| tallaby.com | طَلَبي دوت كوم |

This is for the voice only. Text on screen keeps the dashboard's own words (for example "النطاق" on the page while the voice says "دومين").

**Placing the voice on the video**

- Cut the take at its sentence pauses. Each sentence goes on its own beat: the opening on the title card, each step's sentence 0.3 s after its caption appears, the closing on the result.
- **The video follows the voice.** If a sentence is longer than its step, make the step longer (up to 7 s) or shorten the sentence. Never speed up or stretch the voice.
- Leave at least 0.4 s of quiet between sentences. Nothing is spoken over the end card: the closing sentence ends before it starts.
- Every cut sits inside a pause of the take, never inside a word. `build.mjs` stops with a message when a cut is inside speech or a sentence does not fit its beat.
- The step captions stay on screen: the video must still be fully clear with the sound off.

**Checking a take before using it**

- Transcribe it (`creative_transcribe_audio`) and compare it with the script word for word.
- Check that طلبي, every word in the diacritics table and every English word came out right, and that no Gulf or formal word replaced an Egyptian one.
- **A take with any laugh, chuckle or playful tone is rejected**, even if every word is right. The transcript can show a laugh as "(يضحك)", "(laughs)" or "هه"; the listener checks for it too.
- A take that fails is not patched: fix the script's spelling, diacritics or punctuation and generate again.
- The model cannot hear the take. For each new video the owner, or someone who can listen, confirms the voice sounds calm and natural before the video's status becomes `ready`.

**Reference script: T-01 "Add a product"** (the pattern every script follows)

> هنضيف مُنتَج جديد على طَلَبي، في خمس خطوات بسيطة.
> واحد: اختار إضافة يَدَوِيًّا.
> اتنين: اكتِب اسم المُنتَج، ووَصف قُصيَّر عنه.
> تلاتة: ضيف صُوَر المُنتَج.
> أربعة: اختار الفِئة.
> خمسة: اكتِب السِّعر، واضغَط نَشر.
> وكده مُنتَجَك بقى مَعروض في مَتجَرَك.

### 5.2 Sound effects

- One fixed set of sounds, generated once into `_kit/sfx/` and reused by every video, so all tutorials sound the same:

| Sound | When |
|---|---|
| `pop` | The title card appears |
| `tap` | Every tap marker |
| `key` | Typing (one soft tick per letter group, not per letter) |
| `whoosh` | Every step change |
| `success` | The result card |

- **Simple, low volume, not bold** (owner, 2026-11-17): each sound is one plain soft tone (the whoosh is a faint breath of air). No layered notes, no clicks or noise bursts, no chimes that draw attention.
- All effects have a 5–10 ms fade-in and no harsh highs. On their own they peak at most **-16 dBTP** (T-01's effects alone measure -36.3 LUFS, -18 dBTP).

### 5.3 Mix

- The voice is in front and always clear; the effects sit at least 15 dB under it and are never raised to compete with it. No music.
- Whole video: about **-16 LUFS** integrated (between -18 and -14), true peak at most **-1.5 dBTP**. Check with `ffmpeg -af ebur128=peak=true`.
- **Method:** one fixed gain on the whole take (the same for every sentence) plus a light peak limiter. `build.mjs` refuses a take that would need more than 6 dB of limiting; fix the take instead of pushing it.
- The kit does this: a video's `video.mjs` declares a `voice` block (the take and where each sentence starts and ends in it), `build.mjs` places and mixes it, and `finish.mjs` checks the numbers. T-01 measures -16.1 LUFS and -2.2 dBTP, with the effects 20 dB under the voice.

## 6. Where the files go

Everything lives in **`Tutorial Videos/`** at the repo root (separate from `Marketing Videos/`, which the daily Buffer job posts from).

```
Tutorial Videos/
  TUTORIALS.md            this file
  _kit/                   shared design system: styles, overlays, sounds, logo
  T-01-add-product/
    video.mp4             the finished video
    poster.jpg            frame 0 (title card)
    video.md              the video's details (template below)
    work/                 build files (not committed)
  T-02-add-product-ai/
  …
```

**`video.md` template** (one per video):

```markdown
---
id: T-01
slug: add-product
feature: Add a product
roadmap: "§2.1 Products"
dashboard_path: /stores/[storeId]/products/add
status: draft | ready | uploaded | outdated
duration_seconds: 30
voice: Hanafi (DWMVT5WflKt0P8OPpIrY), eleven_v4
made_on: 2026-11-17
youtube_url:
youtube_title_ar:
youtube_title_en:
---

## Steps shown
1. …

## Voiceover script (with diacritics, exactly as generated)
…

## YouTube description (Arabic)
…

## Caption / post text
…

## Tags
…

## Notes
Source files checked, fictional data used, anything that differs from the real page.
```

## 7. YouTube

- Upload as a **Short** (vertical, under 60 s). Title in Arabic, at most 60 characters, ending with `#Shorts`.
- Description: one line that says what the video shows, then the numbered steps, then `https://tallaby.com`.
- After uploading, write the link in the video's `video.md` (`youtube_url`) and in the dashboard's tutorial registry (§8). The owner uploads, or approves the upload.

## 8. The dashboard button (`ROADMAP.md` F-97)

- A small outline button **"شاهد الشرح"** with a play icon in the page header, on the side opposite the page title (left in Arabic, right in English).
- It opens the Short in a dialog (YouTube embed, 9:16); on a phone it may open YouTube directly.
- One registry in the dashboard maps a page path to its video (`dashboard_path` → `youtube_url`). A page with no video shows no button.
- The button is added only after the video is uploaded.

## 9. Keeping videos up to date

- When a page's layout, labels or steps change, set the video's `status` to `outdated` in its `video.md` and in §11, and re-make it. The dashboard button for that page is hidden until the new video is up.
- When a new seller feature goes live, add a topic to §11 in the same change (CLAUDE.md rule 19).

## 10. QA before a video is "ready"

- [ ] `ffprobe`: 1080×1920, 30 fps, H.264 `yuv420p`, AAC 48 kHz, 20–40 s, under 45 MB, `faststart`.
- [ ] The dashboard fills the whole frame; no phone frame; text on the page is readable on a phone.
- [ ] Every label matches `ar.json` and the real page; steps are in the real order.
- [ ] Each step's target and the caption are inside the safe area (§3); nothing important under the Shorts buttons.
- [ ] Overlays come from `_kit/` unchanged: same caption card, tap marker, transition, title and end cards.
- [ ] Arabic shaping is correct in every still; Latin digits only; no banned words.
- [ ] Voiceover follows §5.1: Hanafi, `eleven_v4`, no tags; the transcript matches the script word for word; طلبي and every marked or English word pronounced right; none of the never-said words; each sentence on its own step, never sped up.
- [ ] No music; only the five kit sounds, quiet under the voice; loudness and peak within §5.3.
- [ ] Someone who can listen has confirmed the voice sounds calm and natural.
- [ ] Only fictional data on screen; the feature is live on production.
- [ ] `video.md` is complete; frame 0 is the title card and reads as a thumbnail.

---

## 11. Topics

One row = one video. **Status:** `todo`, `ready` (rendered and checked), `uploaded`, `outdated`.

The paths come from the dashboard routes in `apps/dashboard/app/[locale]/(main)` (read 2026-11-17). **Before filming any topic, open its page in the code and on production** and correct the path, steps and labels here if they differ. A topic whose feature turns out not to be live is removed, not filmed.

### Wave 1 — the first things every seller does

**Four ways to add a product, four videos** (owner, 2026-11-17): the add-product page offers adding by hand, with AI, from a link and from a file. Each way gets its own short video: T-01 (by hand, pilot made), T-02 (AI), T-51 (link) and T-03 (file). Never combine them into one video.

| ID | Video (the task) | Dashboard path | Steps to show | Status |
|---|---|---|---|---|
| T-01 | Add a product | `/stores/[storeId]/products/add` | Choose "إضافة يدويًا" → name and short description → photos → category → price and publish → the product in the list | ready (pilot, 34.3 s; look and voice approved by the owner 2026-11-17; the page still needs a check on production before upload) |
| T-02 | Add a product with AI | `/stores/[storeId]/products/add` (AI card) | Choose "with AI" → add photos → the fields fill in Arabic and English → review → publish | ready (owner listened and approved 2026-11-18; page still needs a check on production before upload) |
| T-03 | Add products from a file | `/stores/[storeId]/products/add/from-file` | Upload the file → check the rows → import → the products list | ready (owner listened and approved 2026-11-18; page still needs a check on production before upload) |
| T-51 | Add a product from a link | `/stores/[storeId]/products/add` (link option) | Choose "from a link" → paste the product's link → the fields and photos fill in → review → publish | ready (owner listened and approved 2026-11-18; page still needs a check on production before upload) |
| T-04 | Choose your store's template | `/stores/[storeId]/website/templates` | Open Templates → preview one → «استخدام القالب» → confirm (goes to the drafts) | ready (owner listened and approved 2026-11-18; page still needs a check on production before upload) |
| T-05 | Edit your website and publish | `/stores/[storeId]/website` | Open the editor → tap the title, «تعديل» → type → pick a photo from the library → «نشر» | ready (owner listened and approved 2026-11-18; page still needs a check on production before upload) |
| T-06 | Set your shipping prices | `/stores/[storeId]/shipping` | Add a delivery area → name it → pick governorates → set the price and save | ready (owner listened and approved 2026-11-18; page still needs a check on production before upload) |
| T-07 | Choose your payment methods | `/stores/[storeId]/settings/payments` | «إعداد» on a method → its receiving details → holder name → «حفظ وتفعيل» | ready (owner listened and approved 2026-11-18; page still needs a check on production before upload) |
| T-08 | Top up your wallet | `/wallet` (Kashier returns to `/wallet/top-up`) | «شحن المحفظة» → pick an amount in $ → pay with Kashier → back to the wallet | ready (owner listened and approved 2026-11-18; page still needs a check on production before upload) |
| T-09 | Follow and confirm an order | `/orders` | Open a new order → review it → «تأكيد الطلب» → «خرج للتوصيل» | ready (owner listened and approved 2026-11-18; page still needs a check on production before upload) |
| T-10 | Connect an AI assistant to your store (MCP) | `/stores/[storeId]/apps` › AI assistants | Open the app → copy the link → approve the connection → ask the assistant to add a product | todo |

### Wave 2 — products and stock

| ID | Video (the task) | Dashboard path | Steps to show | Status |
|---|---|---|---|---|
| T-11 | Add sizes and colours | product form › المخزون والأنواع | «+ المقاس» → pick sizes → add «اللون» and colours → stock + «تطبيق على الكل» → «حفظ» | draft |
| T-12 | Main and sub-categories | `/stores/[storeId]/products/categories` | «إضافة فئة» (main) → again with «الفئة الرئيسية» → the sub-category → pick it in the product form → «حفظ» | draft (take made before the full-تشكيل rule) |
| T-13 | Update stock quickly | `/stores/[storeId]/products/inventory` | «السجل» under a product → type the units that arrived → «إضافة» → the new row in the stock history | draft |
| T-14 | Restore a deleted product | `/stores/[storeId]/products/trash` | Menu › المنتجات › «سلة المحذوفات» → tick the product → «استرجاع» → back to the products list | draft |
| T-15 | Ask the customer for details on a product | product form › مطلوب من العميل | Open the section → add a text field → name it (AR + EN) → extra price → «حفظ» → the field on the product page | draft (take made before the full-تشكيل rule) |
| T-16 | Add a size chart | `/stores/[storeId]/apps` › جدول المقاسات | «ثبّت» → «تثبيت» → new chart from the «تيشيرتات وقمصان» template → «حفظ الجدول» → «طبّقه على» a category → «اعرف مقاسك» on the product | draft (take made before the full-تشكيل rule) |
| T-17 | Quantity offers | product edit page › عروض الكمية | Scroll to the section → «أضف شريحة» → the discount → a second tier → «احفظ العروض» → the offers in the store buy box | draft (full تشكيل) |
| T-52 | Cross-sell offers | product form (cross-sell) + `/orders/cross-sell` report | Search a product to offer → type and value → «إضافة» → the offer on the product page and in the cart | todo (split from T-17, 2026-11-18) |

### Wave 3 — orders and customers

| ID | Video (the task) | Dashboard path | Steps to show | Status |
|---|---|---|---|---|
| T-18 | Add an order by hand | `/orders/new` | Choose products → customer details → create → send the link | todo |
| T-19 | Win back unfinished orders | `/orders/missed` | Open a missed order → contact on WhatsApp → mark contacted | todo |
| T-20 | Your customers list | `/orders/customers` | Open a customer → add a note and a tag | todo |
| T-21 | Block fake orders | `/stores/[storeId]/settings/protection` | Turn protection on → block a phone number | todo |
| T-22 | Ship with your Bosta account | `/stores/[storeId]/apps` › Bosta | Connect the account → ship an order → print the label | todo |
| T-23 | Add your own delivery riders | `/orders/riders` | Add a rider → assign an order | todo |
| T-24 | Ask for a deposit on cash orders | store settings (deposit) | Turn the deposit on → set the percent → what the customer sees | todo |
| T-25 | Change the checkout form | `/stores/[storeId]/settings/checkout` | Choose the fields → the thank-you page | todo |

### Wave 4 — marketing

| ID | Video (the task) | Dashboard path | Steps to show | Status |
|---|---|---|---|---|
| T-26 | Create a discount coupon | `/coupons` | New coupon → code and value → the customer uses it | todo |
| T-27 | Show a coupon pop-up in your store | `/coupons` (pop-up settings) | Choose when it appears → the countdown → the pop-up on the store | todo |
| T-28 | Automatic discounts | `/marketing/discounts` | New rule → condition and discount → it applies in the cart | todo |
| T-29 | Send an email campaign | `/marketing/emails` | New campaign → write → choose customers → send | todo |
| T-30 | Show recent sales in your store | `/stores/[storeId]/settings/sales-popup` | Turn it on → choose the timing → the pop-up on the store | todo |
| T-31 | Connect Meta Pixel | `/stores/[storeId]/apps` › Meta Pixel | Open the app → paste the ID → connected | todo |
| T-32 | Product catalog for ads | `/marketing/catalog` | Copy the feed link → where to paste it | todo |
| T-33 | Reviews and customer questions | `/reviews` | Reply to a question → approve a review | todo |
| T-34 | Earn by inviting sellers | `/earn` | Copy your link → follow your earnings | todo |

### Wave 5 — website

| ID | Video (the task) | Dashboard path | Steps to show | Status |
|---|---|---|---|---|
| T-35 | Your brand colours and fonts | `/stores/[storeId]/website/design` | Change the main colour → the font → the whole store changes | todo |
| T-36 | Add a page | `/stores/[storeId]/website/pages` | New page → add a section → publish | todo |
| T-37 | Connect your own domain | `/stores/[storeId]/website/domain` | Add the domain → the DNS records → connected | todo |
| T-38 | Help Google find your store (SEO) | `/stores/[storeId]/website/seo` | Title and description → keywords → save | todo |
| T-39 | Write a blog post | `/stores/[storeId]/website/blog/new` | Title and text → photo → publish | todo |
| T-40 | Forms and their replies | `/stores/[storeId]/website/forms` | Create a form → add it to a page → read the replies | todo |
| T-41 | Your photo library | `/stores/[storeId]/website/media` | Upload → use a photo in the editor | todo |
| T-42 | Social media links | `/stores/[storeId]/website/social` | Add the links → they show in the footer | todo |
| T-43 | Your store as an app | `/stores/[storeId]/settings/app` | Set the name and icon → the install button on the store | todo |
| T-44 | Request a custom theme | `/stores/[storeId]/website/templates` (request) | Describe the design → add photos → send | todo |

### Wave 6 — account and money

| ID | Video (the task) | Dashboard path | Steps to show | Status |
|---|---|---|---|---|
| T-45 | Open another store | `/stores` | New store → name and link → switch between stores | todo |
| T-46 | Build a store with AI | `/ai-builder` | Describe the store → the builder works → publish | todo |
| T-47 | Your plan and usage | `/settings/plan` | Read the plan → usage → upgrade | todo |
| T-48 | Reports | `/reports` | Choose the period → read sales and best sellers | todo |
| T-49 | Store visits | `/stores/[storeId]/analytics` | Open Analytics → read the visits | todo |
| T-50 | Order alerts on your phone | dashboard header (install and notifications) | Install the dashboard as an app → turn alerts on | todo |

## 12. Log

| Date | ID | What happened |
|---|---|---|
| 2026-11-17 | — | File created; 50 topics listed from the dashboard routes; no video made yet |
| 2026-11-17 | T-01 | Pilot rendered without a voice; sounds made simpler and quieter (owner) |
| 2026-11-17 | — | Voiceover plan added (§5.1): owner chose the Hanafi voice from nine test takes; the pilot does not have the voice yet |
| 2026-11-17 | T-01 | Approved script generated with Hanafi (transcript matched word for word); kit now places and mixes a voice; pilot retimed to the voice and re-rendered: 34.3 s, -16.1 LUFS, -2.2 dBTP. Not yet listened to by a person |
| 2026-11-17 | — | Owner: the voiceover stays formal with no laughing (§5.1); one video for each of the four ways to add a product, so T-51 "Add a product from a link" was added (51 topics) |
| 2026-11-17 | T-01 | Owner heard a laugh on "الموضوع بسيط" in two takes. Opening changed to a plain statement ("هنضيف منتج جديد على طلبي، في خمس خطوات بسيطة."), rule added to §5.1, third take generated and placed. Waiting for the owner to listen |
| 2026-11-17 | T-01 | Owner approved the pilot (look, sounds, voice). Wave 1 started with the other three add-product videos: T-02, T-51, T-03 |
| 2026-11-18 | T-01 … T-09, T-51 | Owner listened to T-02 … T-09 and T-51 and approved them ("everything else is very good"); all ten now `ready`. Top bar balance changed to $5.00 in the kit (the real header shows the wallet in $); T-08 now goes $5.00 → $15.00. All ten re-rendered with `--workers 1`, durations unchanged, no new voice |
| 2026-11-18 | T-04 … T-09 | Built with the kit and the Hanafi voice, one take each (284 + 278 + 299 + 278 + 273 + 312 credits); transcripts match, no laugh marker. Nobody has listened yet. T-10 (MCP) held: ROADMAP F-29 is Delayed, so rule 18 rules it out. Kit gaps found: the kit top bar shows "≈ 270 جنيه" but the real one shows the wallet in $ (`dashboard-header.client.tsx`); render with `--workers 1` (one parallel chunk drifted in T-08) |
| 2026-11-17 | T-02, T-51, T-03 | Built with the kit and the Hanafi voice (one take each, 280 + 261 + 271 credits; transcripts match). All four add-product videos depend on the method chooser (`ROADMAP.md` F-71), whose roadmap status still reads "Built, not deployed": confirm on production before uploading any of them |
