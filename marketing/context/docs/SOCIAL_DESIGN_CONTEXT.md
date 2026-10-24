# طلبي (Tallaby) — Social Media Post Design Context

> **Status:** ✅ **v2 FINAL — approved by the user, 18 Oct 2026.** The "Simple style" (§3) is the default for every new post.
> **Purpose:** The single rulebook for every social post design (Instagram, Facebook, LinkedIn).
> Read with `MARKETING_PROJECT.md` (facts, voice, compliance), `claude/IMAGE_GENERATOR_INSTRUCTIONS.md` (hero objects, AI imagery, content ideas) and `claude/SOCIAL_SCHEDULING_GUIDE.md` (Buffer + hosting). **If anything conflicts, this file wins for design.**
> Reference design (approved): Canva `DAHYYoIkOw8` — "Seller - 5 EGP flat fee (simple style)".
> **Campaign reference (approved 19 Oct 2026, "amazing and perfect"):** Canva `DAHYeNB439g` — P2-01 "المبرمج طلب **آلاف؟** ابدأ ببلاش!". Copy this one (or any approved background variant) for new campaign posts.

---

> ⚠️ **Update 20 Oct 2026:** fulfillment marketing is paused. No parcels-as-Tallaby-delivery, riders, packing, warehouses or "we deliver/collect" on any design. P3 "خدمات طلبي" now means marketplace exposure, boost package, custom domain, WhatsApp support and store-creation help.

## 0. The 7 non-negotiables (read first)

1. **Canvas 1080 × 1350 (4:5)** — one master for IG, FB and LinkedIn.
2. **Simple style** (§3): light off-white canvas, centered teal headline, one 3D object on one teal circle.
3. **Highlight the key word** — exactly one word/number per post on a **teal `#145163` rounded box with white text** (§4).
4. **Background decoration changes every post** — pick from the Background Library (§5), never the same as the previous post.
5. **Tagline = "إنشاء متاجر إلكترونية"** (top-right). The old slogan is retired — never use it.
6. **Link = `tallaby.com` only** — never `/sell` or any sub-page, on the image, in captions or in Buffer rows.
7. **Real object first** — show the actual thing (a real 5 ج.م banknote, real parcel, real phone/product); a symbolic object only when no real one fits (§6).

Plus: every design ships with caption + hashtags + alt text + Buffer row (§7). Captions: simple, Egyptian, max one emoji (§7).

**Tools (user rule, 19 Oct 2026):** images and carousels → **Canva**. Videos → **built by Claude**, voice-over → **Higgsfield**. Complex live-action video → **Higgsfield**. See "Production tools" below.

**Current campaign (20 Oct 2026 → 3 Jan 2027):** brand awareness, 1–2 posts per day. Plan: `claude/MARKETING_CAMPAIGN_PLAN_NOV_DEC_2026.md` · ready posts: `claude/POST_BANK_NOV_DEC_2026.md`.

---

## ★ Production tools — user rule (19 Oct 2026, mandatory)

| Asset | Tool | How |
|---|---|---|
| **Single-image posts** (P) | **Canva (connected)** | Always build in Canva with the "Tallaby" brand kit: `copy-design` the reference (`DAHYYoIkOw8`) → edit → commit → export PNG 1080×1350. No HTML/three.js or other tools for image posts. |
| **Carousels** (C) | **Canva (connected)** | One multi-page Canva design per carousel (1080×1350 pages). **The whole pack uses one design system** (§3b): same background decoration, same colours, fonts, header, footer and slide-number style on every slide. Only the content changes between slides. |
| **Videos / reels** (R) | **Claude builds the video** | Claude makes it in the sandbox (HTML/CSS/JS motion graphics or screen-recording edits rendered to MP4 with Playwright + ffmpeg, 1080×1920, 9:16), using real dashboard screenshots and recordings, brand colours and Noto Kufi Arabic. Arabic on-screen text is added by Claude, never generated inside AI images or video. |
| **Voice-over** | **Higgsfield** (`generate_audio`) | Egyptian Arabic voice, warm and natural. Claude writes the script in Egyptian Arabic, generates the VO in Higgsfield, then syncs it to the video with ffmpeg. Use the same voice for the whole campaign once chosen. |
| **Complex videos** | **Higgsfield** (`generate_video`, workflows) | Use when the shot needs things Claude can't build as motion graphics: real people, acted skits, lifestyle/live-action scenes (brand film, "مشكلة وحلها" skits, rider/packing scenes when no real footage exists). Claude still adds the Arabic text, logo, end card and VO in the final edit. Higgsfield costs credits, so confirm with the user before big batches. |

Delivery: export finals to `Desktop\tallaby\Social Media Designs\<Sellers|Customers>\` named `YYYY-MM-DD_pillar_slug.png/mp4`, and log every asset in §9.

## 1. Brand kit & tokens

- **Canva brand kit:** "Tallaby" (`brand_kit_id: kAHYBiCtWnw`). Never the "Valorcy" kit.
- **Logos (Canva assets):** primary teal logo `MAHYYp-2rLs` (default — simple style is always light) · white logo `MAHYYXX4xXk` (only on teal backgrounds). Ratio 3.93 : 1 (236 × 60). After swapping a logo fill, reset the crop (`crop_media` 0,0,236,60).
- **Fonts:** Arabic **Noto Kufi Arabic** Bold · Latin/numbers/URL **Montserrat** Bold.

| Token | Hex | Use in the simple style |
| --- | --- | --- |
| Primary teal | `#145163` | Headline, highlight box, object circle, corner values, decorations (low opacity) |
| Gold accent | `#fdad28` | Label box + wave swash + tiny accent dots only |
| Ink | `#171717` | Text on the gold label |
| Off-white | `#fafaf8` | Canvas background |
| White | `#ffffff` | Text inside the highlight box |
| Secondary teal | `#3b9bb0` | Small corner labels, soft decorations |

---

## 2. Canvas & safe zones

| Use | Size |
| --- | --- |
| **All feed posts (master)** | **1080 × 1350 (4:5)** |
| Square fallback (ads/link cards) | 1080 × 1080 via Canva "Resize" |
| Stories / Reels covers | 1080 × 1920 |

- 72 px side margins; Instagram grid crops to 3:4 — margins cover it.
- Bottom 56 px: background only.

---

## 3. ★ Simple style — DEFAULT TEMPLATE

Light, airy, centered, one object on one brand circle (from a reference the user liked).

```
┌───────────────────────────────────┐
│ [teal logo] إنشاء متاجر إلكترونية │  y≈66–126  logo left (236×60) · tagline right, teal 34px bold, box w 600 (1 line)
│                                   │
│            ┌─────────┐            │  y≈196     gold label box 240×84, rotated −3°, ink text 46px
│            │ للتجـــار │            │            (kashida ـــ for a stretched look)
│            └─────────┘            │
│        HEADLINE LINE 1            │  y≈310     teal, 92px bold, centered, line height 1.22, max 3 lines
│      ▐█ KEY WORD (white) █▌       │            ← highlight (§4)
│        HEADLINE LINE 3!           │            end with "!" when it's a hook
│            ~~~~~~~~               │  y≈664     gold wave swash 300×28
│              ╭───╮                │
│           ( 3D OBJECT )           │  cutout 544px overlapping the TOP of a solid teal circle
│            ╰ teal ● ╯             │  (d=480, top≈770, centered)
│ label:                    label:  │  y≈1196    #3b9bb0 26px bold
│ value                     value   │  y≈1236    teal 36–40px bold (2 info corners)
└───────────────────────────────────┘
```

Rules:
- Exactly **one** gold label, **one** highlight box, **one** teal circle, **one** 3D object. Gold only on the label, swash and tiny dots.
- Label = audience/series: "للتجـــار", "للعملاء", "عرض اليوم", "مين إحنا؟"…
- **Campaign pillar labels (Oct–Dec 2026):** P1 **"مين إحنا؟"** (brand) · P2 **"مشكلة وحلها"** (business owner problems) · P3 **"خدمات طلبي"** (services) · P4 **"ميزة في دقيقة"** (tech features) · P5 **"اسأل طلبي"** (pricing / how to start).
- Keep each headline line ≤ ~14 characters at 92px so it stays inside the margins and clear of decorations; widen corner text boxes (e.g. 320) if a value wraps.
- Bottom corners = 2 short facts (label + value). Sellers: "التسجيل: مجاني" · "سجّل من: tallaby.com". Customers: "الدفع: عند الاستلام" · "التوصيل: لكل المحافظات".
- **No CTA button** on the image — the CTA lives in the caption.
- **Object = the real thing whenever possible** (real 5 ج.م banknote, real parcel, real phone, real product) — see §6. Symbolic objects only as a fallback.
- Object must not be teal (it disappears on the circle): banknotes, kraft boxes, phones, products in real colors.
- **Build:** `copy-design DAHYYoIkOw8` (use `page_numbers:[1]` if a blank page appears) → swap label, headline, highlight word (resize box to fit), object (`update_fill` with a new cutout), corner facts → swap background decoration (§5) → `layer_element → front` on content → check thumbnail → commit.
- Canva's API can't set font family: if a Latin URL falls back to another kit font, fix it manually in Canva.

---

## 3b. ★ Carousel design system (Canva, one system per pack)

- **One Canva design per carousel**, multi-page, each page 1080×1350. Build the cover from the simple-style reference, then **duplicate that page** for the inner slides so every slide shares the exact same system.
- **Fixed on every slide of the pack:** the same background decoration from §5 (the "change every post" rule applies **between** packs, not inside one pack), teal logo top-left, tagline "إنشاء متاجر إلكترونية" top-right, fonts, colours, margins, and the slide number "1/6" in the same corner and style.
- **Cover slide:** gold pillar label, headline with **one highlighted word**, hero object or dashboard screenshot on the teal circle.
- **Inner slides:** one idea per slide, a short headline (teal, ~72px) with one highlighted word on the same teal box style, 1–2 short lines of body text (Noto Kufi Arabic, ~40px, #333333), a real dashboard screenshot or object on the same circle style when useful. Same positions on every inner slide.
- **Last slide:** summary or CTA in the same style: "ابدأ من tallaby.com" plus the two corner facts. No buttons.
- 4–7 slides per pack. Check each page's thumbnail for overlaps, then export all pages as PNG (named `…_01.png`, `…_02.png`).

## 4. ★ Highlight the key word (MANDATORY)

Pick the single most important word/number of the headline (price, benefit, offer — "5 جنيه بـس", "مجاني", "14 يوم", "كاش") and put it on a **solid teal `#145163` rounded box (radius ~18) with white `#ffffff` text**, same size and weight as the headline. One highlight per post.

**Canva build** (per-word backgrounds aren't possible, so it's a shape + a separate text):
1. Put the key word on its own line and replace that line in the main headline with a single space, so spacing is kept:
   `replace_text headline → "عمولة طلبي ثابتة\n \nعلى كل طلب نـاجح!"`
2. `insert_shape` the box behind that line: height ≈ 1.2 × font size (112 for 92px), width = word width + ~60px each side (580 for "5 جنيه بـس"), centered on x = 540.
   Path (580×112): `M18,0H562A18,18 0 0 1 580,18V94A18,18 0 0 1 562,112H18A18,18 0 0 1 0,94V18A18,18 0 0 1 18,0Z` — top 423, left 250.
3. Text element: the key word, 92px bold, white, centered, line height 1.22, width 936, left 72, top = box top − 1 (422).
4. `layer_element → front` on the white text; verify on the thumbnail (centered, no overlap).

HTML pipeline: `<span class="hl">…</span>` with `background:#145163;color:#fff;border-radius:18px;padding:0 .35em`.

Don't: gold box, two highlights, a whole sentence highlighted, a smaller key word.

---

## 5. Background Library (rotate — never repeat the previous post)

Decoration stays subtle and *behind* everything; never touches headline, label, object or corner text. Teal 6–28% opacity; gold small and few. After inserting shapes, `layer_element → front` on all content (inserted shapes land on top). `replace_shape` path limit 2 KB — for bigger patterns delete + insert.

| # | Name | Recipe (1080×1350) | Canva example |
|---|---|---|---|
| 1 | Curved lines | 2 huge circles (d 1300–1500) bleeding off opposite corners, fill bg @15%, teal 3px stroke | `DAHYYoIkOw8` |
| 2 | Dot patches | Two 6×6 dot grids (r 4, gap 30, teal 28%) in empty side areas + 2 gold dots r 9 | `DAHYYvaXIoY` |
| 3 | Soft blobs | Organic blob off top-right (teal 7%), blob off bottom-left (gold 18%), small circle off left edge (#3b9bb0 8%) | `DAHYYsZ3WAc` |
| 4 | Plus & dots confetti | 8 plus signs (30px, teal 22%) + 5 gold dots (r 8, 85%) in the margins | `DAHYYuzbELQ` |
| 5 | Diagonal stripes corner | 6–8 thin diagonal bars in one corner, teal 10% | — |
| 6 | Concentric rings | 3–4 rings from one corner, teal 2px stroke @12% | — |
| 7 | Wave band | One soft wave across the bottom 25%, teal 6% | — |
| 8 | Big watermark | Oversized "طلبي" or outline icon (box/cart) off-canvas, teal 5% | — |
| 9 | Grid paper | 60px square grid, teal 6% | — |
| 10 | Sparkles | 4–6 small 4-point stars (gold 80%, 20–36px) near the object | — |

Log the background of each published post (§9) so consecutive posts never repeat.

---

## 6. Hero object — ★ real object first

**Rule (user, 19 Oct 2026): use the REAL object whenever one exists; a symbolic/related object is the fallback.**

| Message | ✅ Real object (use this) | Fallback only if no real object fits |
| --- | --- | --- |
| 5 ج.م fee | A real **Egyptian 5-pound banknote** (or a small fan of real EGP notes) | Generic gold coin with "5" |
| COD / cash | Real EGP banknotes in a hand / wallet | Coins |
| ~~Delivery~~ | Paused 20 Oct 2026 — don't show Tallaby delivery. A parcel may appear only for "shipping-company integrations" or a seller's own order | — |
| Own store / website builder | Real smartphone or laptop showing the store screen (real UI screenshot when available) | Abstract phone with blocks |
| Tech features (builder, templates, apps/integrations, wallet, products, orders, coupons, reviews, shipping) | **Real dashboard screenshots** from the project files, inside a phone/laptop mockup on the teal circle; real screen recordings in reels. Blur customer names/phones; don't show draft/test products as live sellers | Abstract phone with blocks |
| A product category | The actual product (power bank, earbuds, mug…), ideally the seller's real photo | Similar generic product |
| Brand / who we are | Real shop-front, real packed طلبي order | Stylised 3D storefront |

How:
- **Best:** a real photo — the team's own product/package/screen photos, or a photo the user attaches. Cut out with `remove-background`.
- **Next:** a photorealistic render of the real object (Higgsfield `gpt_image_2_5` or Canva `generate-image`), prompt "photorealistic studio product photo of [real object] …".
- **Currency:** only Egyptian pounds (never $ or €). AI generators often garble banknote text/portraits — if the note doesn't look right, use a real photo of the note instead of shipping a fake-looking one.
- Real objects may carry their own natural markings (a banknote's printed value, a real device screen); still no invented Arabic text, no competitor logos.
- Fallback (symbolic object) is fine when nothing real fits — just note it in the design log.

**Canva workflow (default — keeps everything editable):**
1. `generate-image` (1:1): "Premium 3D render, Blender/Octane style: [object] … deep-teal #145163 and gold accents, soft studio lighting top-left, warm gold reflections, soft contact shadow, plain seamless light off-white background #fafaf8, lots of empty space, minimal. No text, no letters, no logos, no dollar signs."
2. `remove-background` → transparent cutout → `update_fill` / `insert_fill` into the object frame.
3. Assets ready: clean gold "5" coin on a stack `MAHYYmLQ9u4` · coin + stack + parcel `MAHYYbSKn3s` · phone with website blocks (website builder) `MAHYY9EgvVA` · storefront with gold awning + parcels (brand/who we are) `MAHYY7KOReU`.
4. If Canva's `get-generate-image-job` returns "Invalid image job ID", generate with Higgsfield (`gpt_image_2_5`, 1:1), import the result URL with `upload-asset-from-url`, then `remove-background`.

**HTML + three.js pipeline (optional, for special hero posts):** Noto Kufi Arabic / Montserrat via `@fontsource`, three.js in headless Chromium (RoomEnvironment, ACES tone mapping), render 2x and deliver 1080×1350 JPG q92. Can't be pushed into Canva from the sandbox — the user uploads it manually.

---

## 7. Copy, caption package & Buffer

**On the image:** facts only from `MARKETING_PROJECT.md` (Confirmed); never invent dates, stats, reviews (the Canva generator adds fake dates — delete them). Brand = **طلبي** (never تالابي). Latin numbers. No foreign currency in images, no text inside AI images, no competitor branding.

**Every design ships with:**
1. **Caption** — **user rule 19 Oct 2026:** simple, Egyptian Arabic, 3–6 short lines (hook → 1–3 plain benefit lines → CTA + link), **at most one emoji**, no emoji/✦ lists. Vary openings — with 1–2 posts per day no two captions should start the same way.
   - Instagram: "اللينك في البايو" + `tallaby.com`.
   - Facebook: `https://tallaby.com`.
   - LinkedIn: seller/B2B posts only, professional tone, `https://tallaby.com`.
2. **Hashtags** 3–6: always `#طلبي #Tallaby` + topic (`#إنشاء_متجر_إلكتروني #بيع_اونلاين #ابدأ_مشروعك` for sellers; `#الدفع_عند_الاستلام #تسوق_اونلاين #مصر` for customers).
3. **Alt text** — one plain sentence.
4. **Buffer CSV** (UTF-8 with BOM), one file per channel: `Text`, `Image URL` (direct hosted link), `Tags` (**always empty** — user rule 22 Oct 2026), `Posting Time` `YYYY-MM-DD HH:MM` Cairo time. Free plan = max 10 rows per upload. Suggested times: FB/IG 19:00–21:00, LinkedIn 10:00–12:00 weekdays.

**Export:** Canva → PNG 1080×1350; name `YYYY-MM-DD_pillar_slug.png`; host and get a direct URL (`SOCIAL_SCHEDULING_GUIDE.md` §2). Local copies go to the user's `Desktop\tallaby\Social Media Designs\<Sellers|Customers>\`.

---

## 8. QA checklist

- [ ] 1080 × 1350, brand kit "Tallaby", 72 px margins
- [ ] Simple style: teal logo left · "إنشاء متاجر إلكترونية" right · gold label · teal 92px headline · swash · object on teal circle · 2 corner facts
- [ ] **Exactly one key word highlighted** — teal rounded box, white text, centered
- [ ] Background decoration from §5 and **different from the previous post**
- [ ] Link is **tallaby.com** only (image, caption, Buffer)
- [ ] Hero object is the **real object** when one exists (§6); no garbled banknote text, EGP only
- [ ] Retired slogan nowhere; طلبي spelled right; Latin numbers; no invented facts; no foreign currency
- [ ] Nothing overlaps (headline / label / swash / object / corners)
- [ ] Caption + hashtags + alt text + Buffer row(s) delivered
- [ ] Readable at thumbnail size

---

## 8b. ★ Proven build recipe (approved test post, 19 Oct 2026)

This exact workflow produced the approved post `DAHYeNB439g`. Repeat it for every single-image post:

1. `copy-design` an approved design whose background is **different from the previous post** (`DAHYYoIkOw8` curved lines · `DAHYYvaXIoY` dot patches · `DAHYYsZ3WAc` soft blobs · `DAHYYuzbELQ` plus & dots · `DAHYZTbEfnc` diagonal stripes · `DAHYY8lXP6A` rings · `DAHYY3Hh5HY` sparkles) with `page_numbers:[1]`.
2. In parallel, `generate-image` (1:1) a **photorealistic studio photo of the real object** on a plain off-white #fafaf8 background, with no text, letters or numbers on it. Then `remove-background`.
3. `read-design` with `open_transaction` → one `edit-design` batch:
   - `update_title` → `"<ID> · <slug> — simple · bg: <name>"`
   - Gold label text = pillar series name. For labels longer than ~6 characters ("مشكلة وحلها", "ميزة في دقيقة", "خدمات طلبي"), resize the label box **and** its text to **330 wide** at left **375** (kept at −3°). Short labels ("مين إحنا؟", "اسأل طلبي") keep 240 at left 420.
   - Headline: `"line 1\n \nline 3"` (the key word's line replaced with a space).
   - Highlight text element = the key word. Highlight box = rounded path, height 112, **width = word width + ~120** (e.g. 380 for "آلاف؟", 580 for "5 جنيه بـس"), centered: left = 540 − width/2, top 423. Then `layer_element front` on the white word.
   - Corners: sellers default "التسجيل: مجاني" · "سجّل من: tallaby.com".
4. `update_fill` the object frame with the cutout → check the thumbnail (nothing overlapping, highlight centered) → `commit`.
5. `export-design` PNG 1080×1350. The sandbox can't download from `export-download.canva.com` (proxy blocked), so send the user the Canva edit link plus the thumbnail preview, and the user downloads the PNG from Canva.
6. Deliver the caption, hashtags and alt text with the design, then log it in §9.

**Canva text lessons (first-30 batch, 19 Oct 2026):**
- Never put Latin "AI" inside an Arabic **headline**: Canva flips the word order. Write "ذكاء اصطناعي" on the image (the caption can still say الـAI).
- Corner values mixing a Latin number with more than one Arabic word ("5 ج.م بس") render in the wrong order. Keep them to "5 ج.م" or Arabic-only words.
- A Latin number + Arabic in the **right** corner ("700 ج.م") renders in the wrong order; put prices in the **left** corner.
- The bottom-left corner value must be set to `text_align: start` (left) when it is Arabic, or it drifts right of its label.
- The stripes template's object frame is 640; reset it to the standard 544 at (268, 705).

**Wording lesson:** say **"ابدأ ببلاش"** / "التسجيل مجاني", never **"متجرك ببلاش"** (orders cost 5 ج.م, so a "free store" claim misleads).

## 9. Design log

| Date | Design | Canva ID | Background | Status |
| --- | --- | --- | --- | --- |
| 2026-10-18 | Seller: 5 ج.م flat fee — simple style (**reference**) | `DAHYYoIkOw8` | #1 Curved lines | ✅ Approved |
| 2026-10-18 | Same post, background variant | `DAHYYvaXIoY` | #2 Dot patches | ✅ Approved |
| 2026-10-18 | Same post, background variant | `DAHYYsZ3WAc` | #3 Soft blobs | ✅ Approved |
| 2026-10-18 | Same post, background variant | `DAHYYuzbELQ` | #4 Plus & dots | ✅ Approved |
| 2026-10-18 | Seller: website builder — "عدّل محتوى موقعك **بنفسك** من غير مبرمج!" (first test of the final rules) | `DAHYY8lXP6A` | #6 Concentric rings | Awaiting feedback |
| 2026-10-18 | Brand: who we are — "مع طلبي اعمل **متجرك الإلكتروني** وبيع في كل مصر!" (label "مين إحنا؟") | `DAHYY3Hh5HY` | #10 Sparkles | Awaiting feedback |
| 2026-10-19 | Seller: 5 ج.م commission — "مش هتدفع غير **5 جنيه** على كل طلب نـاجح!" — first post with a **real object** (photoreal 5 EGP note, `MAHYZbaRIdg`) | `DAHYZTbEfnc` | #5 Diagonal stripes | Awaiting feedback · note is an AI render — swap for a real photo if available |

All four: tagline "إنشاء متاجر إلكترونية", highlight on "5 جنيه بـس", corners "التسجيل: مجاني" · "سجّل من: tallaby.com".

| 2026-10-19 | **P2-01** Problems: "المبرمج طلب **آلاف؟** ابدأ ببلاش!" (label "مشكلة وحلها") — first campaign post; photoreal invoice + calculator (`MAHYeOjP1yE`) | `DAHYeNB439g` | #2 Dot patches | ✅ **Approved** — "amazing and perfect". Campaign reference |

| 2026-10-19 | **P3-01** first-30 batch — bg concentric rings; kraft parcel | `DAHYeyZEaNA` | #6 Concentric rings | Done (https://www.canva.com/d/H3DVO1CxWWpTqhD) |
| 2026-10-19 | **P1-01** first-30 batch — bg curved lines; kraft gift box | `DAHYe-btcO0` | #1 Curved lines | Done (https://www.canva.com/d/1ZyCmGuVJKJb0D5) |
| 2026-10-19 | **P1-02** first-30 batch — bg soft blobs; laptop with abstract dashboard (swap for real dashboard screenshot later) | `DAHYe1KHfbw` | #3 Soft blobs | Done (https://www.canva.com/d/6dqdwK1VWeEkA0t) |
| 2026-10-19 | **P5-01** first-30 batch — bg plus & dots; reused AI-render 5 EGP note (swap for real photo if available) | `DAHYe5GdScg` | #4 Plus & dots | Done (https://www.canva.com/d/lDGlKU_1rMZlGup) |
| 2026-10-19 | **P1-05** first-30 batch — bg diagonal stripes; piggy bank; highlight لما تبيع (536px) | `DAHYe7OmiGI` | #5 Diagonal stripes | Done (https://www.canva.com/d/YRH9NzV6c4c2GxL) |
| 2026-10-19 | **P1-06** first-30 batch — bg sparkles; handshake (sleeves cut at frame edges, acceptable) | `DAHYewKqNpM` | #10 Sparkles | Done (https://www.canva.com/d/_D3b8eYD4znvjJM) |
| 2026-10-19 | **P2-02** first-30 batch — bg dot patches; brown leather wallet | `DAHYexHaxvQ` | #2 Dot patches | Done (https://www.canva.com/d/KlS77Le6_KTgNVS) |
| 2026-10-19 | **P3-02** first-30 batch — bg concentric rings; hand with folded generic notes over kraft parcel | `DAHYe-YUcQE` | #6 Concentric rings | Done (https://www.canva.com/d/mWwGDhFrFRqXEvM) |
| 2026-10-19 | **P4-02** first-30 batch — Line 1 changed from 'الـAI يصمملك' to 'ذكاء اصطناعي' (Latin AI broke RTL word order in Canva). Headline: ذكاء اصطناعي / متجر كامل / في دقيقة! | `DAHYe2-nl28` | #1 Curved lines | Done (https://www.canva.com/d/Hpkcizs4i5U8HG0) |
| 2026-10-19 | **P1-08** first-30 batch — OK | `DAHYeyu9-3U` | #3 Soft blobs | Done (https://www.canva.com/d/MKu8Bk9AgMVE5Yi) |
| 2026-10-19 | **P3-03** first-30 batch — OK | `DAHYe7DmMEM` | #4 Plus & dots | Done (https://www.canva.com/d/sarAuKCeMOwajX1) |
| 2026-10-19 | **P4-08** first-30 batch — Object frame reset from 640 to standard 544 @268,705 | `DAHYe3SXo6U` | #5 Diagonal stripes | Done (https://www.canva.com/d/TShxmk9P45i0ViM) |
| 2026-10-19 | **P5-04** first-30 batch — bg sparkles; corners الاشتراك: مفيش · العمولة: لما تبيع | `DAHYexcagOA` | #10 Sparkles | Done (https://www.canva.com/d/lJvoJgvBoK_FOLz) |
| 2026-10-19 | **P2-05** first-30 batch — bg dot patches; phone with product page + stars (AI render, swap for real store screenshot when available) | `DAHYezPgt98` | #2 Dot patches | Done (https://www.canva.com/d/2aGCx8aX-e8aVMq) |
| 2026-10-19 | **P1-09** first-30 batch — bg concentric rings; two kraft parcels | `DAHYe7sXbkQ` | #6 Concentric rings | Done (https://www.canva.com/d/hVomLbz_cxfERKj) |
| 2026-10-19 | **P5-11** first-30 batch — bg curved lines; kraft shopping bag | `DAHYe6Bo9xw` | #1 Curved lines | Done (https://www.canva.com/d/-aiCAl_-CeYFY_8) |

| 2026-10-20 | **P3-01** redesigned (fulfillment paused): "دعم **واتساب** لما تحتاجنا" | `DAHYeyZEaNA` | #6 Concentric rings | Done |
| 2026-10-20 | **P3-02** NEW: "اربط **دومينك** بمتجرك!" (replaces void COD post `DAHYe-YUcQE`) | `DAHYgNs5ZWQ` | #3 Soft blobs | Done |
| 2026-10-20 | **P3-03** redesigned: "باقة **ظهور** لمنتجاتك" (700 ج.م / أسبوع) | `DAHYe7DmMEM` | #4 Plus & dots | Done |
| 2026-10-20 | P1-06 corner → التسجيل: مجاني; P2-05 & P1-09 corner التوصيل → الشحن | — | — | Done |

| 2026-10-20 | **P1-03** carousel, 7 pages (one design system per pack) | `DAHYgMlaoa0` | #1 Curved lines | Done (https://www.canva.com/d/2sbkBhu3mGytZX4) |
| 2026-10-20 | **P5-02** carousel, 7 pages (one design system per pack) | `DAHYgK-Xk74` | #10 Sparkles | Done (https://www.canva.com/d/Rj5jYy79cfQ8AZi) |
| 2026-10-20 | **P2-03** carousel, 6 pages (one design system per pack) | `DAHYgO2yzp4` | #3 Soft blobs | Done (https://www.canva.com/d/lX6ksfEK6-_mUQ9) |
| 2026-10-20 | **P4-09** carousel, 6 pages (one design system per pack) | `DAHYgJ0MsPE` | #5 Diagonal stripes | Done (https://www.canva.com/d/xkXTkWgnZuKJusI) |

**Retired directions (don't reuse):** teal → transparent gradient skeleton with gold CTA button (`DAHYYYJu-TA`, `DAHYYXyjq-I`), big asymmetric v3 (`DAHYYdZcRQQ`), dark HTML/three.js v2 file. They were stepping stones; the simple style replaced them.

**Resolved (19 Oct 2026):** pricing = **5 ج.م per successful order** (deducted from the wallet) + **بدون رسوم** (no registration fee, no subscription). Never mention 5% — the seller PDF and `/sell` page still need updating.

## Reel pipeline (20 Oct 2026)
- **Before writing or generating any voice-over, read `claude/VOICEOVER_RULES.md`** (natural Egyptian Arabic, smooth/bold/clear/human delivery, write for the ear, numbers as spoken words, final checklist).
- Template: `demo.html` + `render.js` (Playwright frame-by-frame, 30 fps → ffmpeg H.264, 1080×1920). Same visual system as the 19 Oct reel: off-white bg + decorations, teal logo top-left / tagline top-right, gold label, teal headline with one highlighted word + gold swash, phone on teal circle, white check badges, link card with share buttons, teal end card (white logo, "اعمل متجرك من غير رسوم", "5 ج.م بس على الطلب الناجح", gold tallaby.com pill).
- Niche demos (P4-03/04/05/06/07) reuse it with a JSON config (store name, colours, chips, 4 products with SVG art, timeline).
- **Voice (approved by user 20 Oct, replaces Andre):** Higgsfield `text2speech_v2`, variant **elevenlabs**, preset voice **Bram** `549ff70a-3ee7-4f04-a4d9-89a24fab7709` (young male), **Egyptian wording, smooth delivery** (0.15 credit per VO). ❌ Never use seed_audio preset voices (Andre etc.) for Arabic — wrong language/accent. ❌ Gulf dialect was tested and rejected. Numbers written as words in VO scripts ("خمسة جنيه").
- The sandbox can't download Higgsfield result files (CDN blocked), so the user saves the VO .wav into `Desktop\tallaby\Social Media Designs\Reels\`, then Claude stages it, retimes the video to the VO and muxes.
- Reel log: P4-03 perfume demo — silent v1 done 20 Oct (`2026-10-28_P4-03_perfume-demo_reel_noVO.mp4`), VO pending.

## WhatsApp on designs (user rule, 20 Oct 2026)
On any design write **Whatsapp @tallaby.com** (Latin value → put it in the **left** corner, text_align start). Captions/links use **http://wa.me/@tallaby**. Never put the mobile phone number on any design.
- **PINNED brand intro reel** "مين إحنا" (23.4s, 20 Oct): `brand.html` (8 scenes: logo → منصة مصرية/governorate chips → AI store in a minute → integrations hub → عملاء طلبي → pricing (بدون رسوم, 5 ج.م) → WhatsApp @tallaby.com → end card). VO Higgsfield ElevenLabs/Bram job `4f54f31c…`, 34s. File `2026-10-26_PINNED_tallaby-who-we-are_reel_VO.mp4`. Post on 26 Oct and pin as first post on FB/IG (and LinkedIn as native video).
- P4-03 perfume reel — final with Bram VO done 20 Oct (`2026-10-28_P4-03_perfume-demo_reel_VO.mp4`, 20.6s).
- VO download route that works: open the Higgsfield result URL in the user's Chrome, JS fetch + download to Downloads (access granted), then stage from `C:\Users\elsha\Downloads`. Sync scenes using ffmpeg silencedetect (n=-25dB, d=0.12) on the VO.
- **v3 voice-overs (approved by user 20 Oct, "great result")** — scripts rewritten to VOICEOVER_RULES.md, voice Bram/ElevenLabs:
  - PINNED reel v3 (35.2s, job `cbc7edfa…`): opens on teal with the hook "عايز تبدأ تبيع أونلاين؟" then "إحنا طلبي"; on-screen text now "لمصر كلها" / "في مصر كلها". Scenes SC=[0,3.2,8.3,15.1,19.3,22.5,28.4,32.0], S1D=2.15. File `2026-10-26_PINNED_tallaby-who-we-are_reel_VO-v3.mp4` ← use this one.
  - P4-03 perfume v3 (25s, job `5b034157…`): "عندك براند عطور؟ بُص، هنعمل متجر عطور في دقيقة…". File `2026-10-28_P4-03_perfume-demo_reel_VO-v3.mp4` ← use this one.
- **P1-07 طلبي في 30 ثانية** (1 Nov) — done 20 Oct, 27.4s, Bram VO job `5aabc00b…`. `p107.html`: 30s countdown hook → 1 متجرك في دقيقة (phone build) → 2 كل حاجة متوصّلة (chips on the beat + Google Analytics / Meta Pixel / Instagram) → 3 لوحة تحكم سهلة (REAL dashboard + products screenshots in a browser window with pan/zoom on orders, products, wallet; customer names blurred) → بدون رسوم / 5 ج.م → end card. Running 0:30 timer pill at the bottom. File `2026-11-01_P1-07_tallaby-in-30-seconds_reel_VO.mp4`.
- Rule: always blur customer names/phones in dashboard screenshots before using them.
- **P4-01 AI store in one minute** (2 Nov) — user asked (20 Oct) for a **fashion** version where the seller **sends the products Excel sheet + brand info to "Tallaby AI"** (طلبي إيه آي). Done 20 Oct, 27s, Bram VO job `e1499bca…`. `p401f.json` with `demo.html` upload mode (`C.upload`: products.xlsx card + بيانات البراند card, 01:00 countdown timer stops at store ready ≈00:53, brand "Look" store look.tallaby.com). File `2026-11-02_P4-01_ai-fashion-store-in-one-minute_reel_VO.mp4`. First take (mugs store "كوبايتي") rejected — user disliked audio.
- Product fact from user (20 Oct): Tallaby AI builds the store from an uploaded products Excel sheet + brand info (name, logo, colours). OK to use in copy.
- Note: P4-04 (4 Nov) is also a fashion demo — make it a different angle (e.g. sizes/colours variants, customer ordering) to avoid repeating P4-01.
- **P4-04 Fashion demo — sizes & colours** (4 Nov) — done 20 Oct, 27.6s, Bram VO job `986401a9…`. `p404.html`: hook "بتبيع هدوم؟" with customer-question bubbles (فيه مقاس لارج؟ فيه لون أسود؟ بكام؟ متاح؟) + red +99 counter → product page on phone (hoodie, sizes S/M/L/XL, 4 colour swatches, animated cursor picks L + black, taps اطلب دلوقتي → ✓ تم الطلب) → dashboard order card (product, size L, colour, address, total) → رسايل ✕ / أسئلة ✕ → end card. File `2026-11-04_P4-04_fashion-sizes-colours_reel_VO.mp4`.
- Reels done so far: PINNED, P4-03, P1-07, P4-01, P4-04. Remaining: P4-05 makeup (5 Nov), P4-06 mobile accessories (6 Nov), P4-07 home food (7 Nov), P1-04 brand film + P2-04 skit (Higgsfield video).
- **P4-05 Makeup — brand colours** (5 Nov) — done 20 Oct, 22.6s. **New visual language to avoid repetition** (user asked each reel to look a bit different while keeping the design system): kinetic word-drop hook with floating makeup icons in white orbs → **diagonal teal+gold wipe transitions** between scenes → 3D-tilted phone on a half teal circle with a white checklist (متجر كامل / الأقسام / المنتجات) → **live colour switcher**: palette dock (وردي / نود / لون البراند) recolours the whole store with a circular reveal from the tapped swatch, big headline changes word by word → fan of 3 mini phones in 3 palettes + chips (من الموبايل / في دقيقة) → end card with a gold arc drawing across. `p405.html`.
- **VO for P4-05: Callum** (`858499d9-fef5-40e1-bc29-b4dc661dc283`, ElevenLabs engine), chosen by the user over Bram for a bolder, smoother take, job `6637c563…`. Script made bolder with Egyptian connectors (يبقى… بقى… بس… يلا…) and "!" for energy. Lesson: when the user wants "bolder", offer Bram + Callum (+ an alternative) side by side and let them pick.
- Each new reel must use a different motion idea (layout, transition, hero animation) — keep colours, fonts, logo bar, label/highlight styles and end-card structure.
- **P4-06 Mobile accessories — day → night** (6 Nov) — done 20 Oct, 23.9s, **Callum** VO job `8503513f…`. `p406.html` (new motion idea): illustrated storefront (teal/gold awning, "إكسسوارات" sign, shelf) → rolling shutter closes + red "مقفول" while the whole background fades to night (#0e2a35, stars, moon arc, white logo) and a clock runs 22:00 → 07:00 → glowing phone with the accessories store (جراب آيفون، شاحن سريع، سماعة بلوتوث، باور بانك) + chips → order toasts drop in through the night (23:14, 01:42, 03:05, 05:30) → sunrise, gold badge counts the orders → بدون رسوم / 5 ج.م → end card "متجرك شغّال 24 ساعة". Wrap content in a fixed 1080×1920 overflow-hidden #stage to avoid RTL scroll shifts.
- Voice default from now: **Callum** (user's latest pick for bolder delivery); keep Bram as the alternative.
