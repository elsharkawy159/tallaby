# طلبي (Tallaby) — Image Generator Instructions

> **Purpose:** Rules and lessons for AI assistants producing social media images (designs, 3D objects, AI photos) for **طلبي / Tallaby**.
> **Updated 18 Oct 2026** with the final approved design direction. **`claude/SOCIAL_DESIGN_CONTEXT.md` is the design rulebook and wins on any conflict** (canvas, layout, colors, highlight rule). Read also `MARKETING_PROJECT.md` (facts, voice) and `claude/SOCIAL_SCHEDULING_GUIDE.md` (Buffer + hosting).

---

## 0. Production tools (user rule, 19 Oct 2026)

- **Image posts and carousels → Canva only** (connected, brand kit "Tallaby"). For carousels, one multi-page design per pack with one shared design system (`SOCIAL_DESIGN_CONTEXT.md` §3b).
- **Videos → Claude builds them** (motion graphics or screen-recording edits rendered to MP4, 1080×1920), with the **voice-over generated in Higgsfield** (`generate_audio`, Egyptian Arabic, one consistent voice).
- **Complex videos** (people, acted skits, live-action scenes) → **Higgsfield** `generate_video`. Claude adds the Arabic text, logo, end card and VO afterwards. Confirm credits with the user before batches.
- The HTML + three.js pipeline is no longer used for image posts; it may only be used inside Claude-built videos.

## 1. Final direction (Oct 2026)

After several rounds (gradient skeleton → dark 3D HTML → asymmetric Canva v3) the user approved the **Simple style**: light off-white canvas, centered teal headline with **one highlighted key word (teal box, white text)**, a gold label, a gold swash and **one 3D object on a teal circle**, two small facts in the bottom corners. Reference: Canva `DAHYYoIkOw8`.

Variety now comes from:
- **Background decoration** — rotate the 10-item Background Library in `SOCIAL_DESIGN_CONTEXT.md` §5 (never repeat the previous post).
- **The 3D object** — a different object per topic (coin, parcel, phone, storefront, scooter…).
- **The label and highlight word** — audience/series and the key benefit.

Fixed on every post: canvas 1080×1350, primary teal logo top-left, tagline **"إنشاء متاجر إلكترونية"** top-right, link **tallaby.com** only.

## 2. Lessons from the first batch (still valid)

| Problem | Fix |
| --- | --- |
| Too much text (headline + subtitle + cards + CTA + footer) | One message per post; headline max ~8 words; details in the caption |
| Flat line icons only | One real 3D hero object |
| Repeated CTA bar on every image | No CTA button on the image — CTA in the caption |
| Identical-looking posts in the grid | Rotate background decoration + object + label |

## 3. Core principles

1. **One post = one message**, one highlighted key word.
2. **Hook first:** a number, a question or a contrast ("5 جنيه بس", "لسه بتدفع إيجار مخزن؟").
3. **One 3D object** that isn't teal (gold, kraft, real product colors) so it reads on the teal circle.
4. **Consistency from the system**, variety from background/object/label.

## 4. 3D objects & AI imagery

**Canva (default — editable):** `generate-image` 1:1 → `remove-background` → place the cutout with `update_fill` / `insert_fill`.

Prompt pattern:
```
Premium 3D render, Blender/Octane style: [object], deep-teal #145163 and gold #fdad28 accents,
soft studio lighting top-left, warm gold reflections, soft contact shadow,
plain seamless light off-white background #fafaf8, lots of empty space, minimal.
No text, no letters, no logos, no Arabic script, no dollar signs or foreign currency.
```

**★ Real object first (user rule, 19 Oct 2026):** show the actual thing whenever it exists; a symbolic object is only the fallback. Details in `SOCIAL_DESIGN_CONTEXT.md` §6.

| Topic | ✅ Real object (preferred) | Fallback |
| --- | --- | --- |
| Fees / 5 ج.م | Real Egyptian 5-pound banknote | Gold "5" coin (asset `MAHYYmLQ9u4`) |
| COD / cash | Real EGP notes in a hand or wallet | Coin stack |
| ~~Storage / fulfillment / delivery~~ | Paused 20 Oct 2026 — don't use | — |
| Own online store / website builder | Real phone/laptop with a real store screenshot | Abstract phone with blocks (`MAHYY9EgvVA`) |
| Brand / who we are | Real packed طلبي order or real shop-front | 3D storefront (`MAHYY7KOReU`) |
| Product posts | The real product, ideally the seller's own photo | Similar generic product |
| Returns | Real parcel being handed back | Parcel with return arrow |

For real objects use a photorealistic prompt ("photorealistic studio product photo of …, plain off-white background, soft shadow") or, better, a real photo from the team. AI often garbles banknote text — if it looks fake, use a real photo instead. Only EGP, never $ or €.

**Higgsfield (connected):** for lifestyle photos when a post needs a real scene. Costs credits — confirm before a batch. Egyptian context and casting, no foreign currency, no competitor logos, no fake mega-warehouse scale.

**HTML + three.js (optional):** for special hero posts; see `SOCIAL_DESIGN_CONTEXT.md` §6.

## 5. Typography

- Arabic **Noto Kufi Arabic** Bold; Latin/numbers/URL **Montserrat** Bold.
- Simple-style sizes: headline 92px, label 46px, tagline 34px, corner value 36–40px, corner label 26px.
- Latin numbers; check "5%" doesn't flip to "%5".
- Never put Arabic text inside AI-generated images — add it in Canva.

## 6. Canvas & export

- **1080 × 1350 (4:5)** for all feed posts (replaces the old 1:1 default). Square only via Canva Resize when needed.
- Export PNG 1080×1350 (JPG q90 if size matters).

## 7. Content & truth rules (seller posts)

Only confirmed facts:
- طلبي = **إنشاء متاجر إلكترونية**: open your own online store, free, no monthly subscription, ready in ~10 minutes, own store link (`yourstore.tallaby.com`) or custom domain
- **5 ج.م per successful order**, deducted from the seller's wallet — confirmed by the user 19 Oct 2026. Never mention 5% (old PDF/sell page wording)
- Tech features (User-confirmed 19 Oct 2026): **الـAI يصمملك متجر إلكتروني كامل في دقيقة واحدة**, ready templates, no code, integrations with shipping companies, payment methods (no card), social media, Google Analytics, Meta Pixel + catalog — see `MARKETING_PROJECT.md` §4b
- For tech-feature posts use the **real dashboard screenshots** in the project files (website builder, templates, apps, wallet…) in a phone/laptop mockup
- ~~Delivery, cash collection, storage, packaging, customer service, returns by طلبي~~ — **paused 20 Oct 2026, never mention**. Market: website creation, integrations, dashboard, marketplace exposure, boost package, WhatsApp support, 5 ج.م per order
- Link: **tallaby.com** only (never `/sell`) · WhatsApp **@tallaby** (http://wa.me/@tallaby; on designs "Whatsapp @tallaby.com", never the phone number)

Never invent stats, testimonials, names, reviews or dates. The retired slogan must never appear.

## 8. Technical notes (what works)

1. **Canva works** for the full workflow: `copy-design` the reference, `edit-design` ops (replace_text, format_text, insert_shape, update_fill, layer_element…), `generate-image` + `remove-background` for objects, `upload-asset-from-url` for public tallaby.com assets. Changes must be committed (`keep_open` edits first, then an empty-ops `commit`).
2. Canva limits: no font-family change via API; `replace_shape` path ≤ 2 KB; `add_text` needs a second `format_text` call; inserted shapes land on top → `layer_element front` on content.
3. Direct upload of local files to canva.com is blocked from the sandbox; HTML renders must be uploaded by the user.
4. **Buffer hosting:** see `claude/SOCIAL_SCHEDULING_GUIDE.md` §2.

## 9. QA checklist

- [ ] Follows `SOCIAL_DESIGN_CONTEXT.md` §8 checklist
- [ ] One key word highlighted (teal box, white text)
- [ ] Background decoration differs from the previous post
- [ ] Hero object is the **real thing** when one exists (real 5 ج.م note, real parcel, real phone/product); symbolic only as fallback
- [ ] Object looks right (no garbled banknote text, no foreign currency, no invented writing), not teal, doesn't touch text
- [ ] tallaby.com only; "إنشاء متاجر إلكترونية" tagline; طلبي spelled right
- [ ] Facts match §7; nothing invented
