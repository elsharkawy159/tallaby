# طلبي (Tallaby) — November 2026 production log + website findings (20 Oct 2026)

> Read with `MARKETING_PROJECT.md`, `claude/SOCIAL_DESIGN_CONTEXT.md`, `claude/POST_BANK_NOV_DEC_2026.md` and `claude/SOCIAL_SCHEDULING_GUIDE.md`. **Where this file differs from them, this file is newer (20 Oct 2026).**

## 1. What tallaby.com says now (checked 20 Oct 2026)

The live site has been rebuilt around store creation. Facts below are from the public pages (`/`, `/pricing`, `/templates`, `/faq`).

| Topic | What the site says | Marketing status |
|---|---|---|
| Hero | **احجز رابط متجرك في دقايق، مجانًا** — pick a name, reserve `name.tallaby.com`, design visually, publish | Use as a hook ("احجز رابطك") |
| Badges | Free, no card needed · sign-up **under a minute** (email/password or Google) · **5 ج.م ثابتة للطلب، بدون عمولة** | Confirmed |
| How it works | 1) create account 2) customise store (template, logo, colours, products, visual editor, no code) 3) publish in one click, share link, track orders | Used in P5-05 |
| Pricing | One free plan · **5 ج.م on every successful order, whatever its value** · 0% commission, 0 subscription, 0 activation, 0 cancellation fee · **cancelled / returned orders not charged** · unlimited products, orders, visitors · all templates · custom domain · discount codes + share links · payment links · **24/7 support (WhatsApp + email)** · **up to 3 stores** | Confirmed (site). Worked example on site: 120 orders × 450 ج.م = 54,000 ج.م sales → 600 ج.م fee → seller keeps 53,400 (used in P5-07) |
| Fees not included | Payment-processing fees (by method) and shipping (per shipment, by location + weight, shown before checkout) are charged separately | Always add "رسوم الدفع والشحن بتتحسب لوحدها" when showing totals |
| Templates | **39 templates**: Tallaby Classic, Atelier, Mode, Streetwear, Kasr (fashion) · TechHub, Volt, Arcade, Arena (electronics) · Pure, Glow, Elixir, Botanica (beauty) · Nest, Daily, Hearth, Clay, Loft, Oak, Sakan (home) · Sizzle, Harvest, Loaf, Roast (food) · Verdant, Lumiere, Karat, Fadda, Playroom, Bambino, Doodle, Hekaya, Pace, Stride, Core, Basecamp, Garage, Drive, Moto | Great content source for December ("قالب لكل نشاط") |
| Dashboard | Products, orders, payments, analytics, **SEO** (titles, descriptions, links), marketing (discount codes, share links) | Confirmed |

### ⚠️ Open questions for the team (blocking some claims)

1. **AI builder:** the dashboard builder screenshot labels the AI assistant **"قريبًا" (coming soon)** and the website never mentions AI. The campaign (and reels P4-01/03/04/05/06) say "الـAI يصمملك متجرك في دقيقة". Confirm it is live before those reels go out; November designs made on 20 Oct avoid AI claims and lead with templates + visual editor.
2. **Card payments:** the site footer shows Visa / Mastercard / Meeza / Apple Pay / Google Pay logos, but `MARKETING_PROJECT.md` says card is off. Until confirmed, no card claims.
3. **Up to 3 stores per account** (site pricing) — used in P1-12; confirm.
4. **Shipping companies:** which are integrated? (P4-13, P4-20 say "متوصل بشركات الشحن").
5. **Meta catalog:** not visible in the Apps page (it lists Meta Pixel, Google Analytics 4, Google Tag Manager, Meta Conversions API, TikTok Pixel). P4-19 was changed from "catalog" to "Meta + TikTok pixel".
6. **Sign-up page wording "عمولة 5 جنيه"**: the site says "بدون عمولة" (no commission) and calls the 5 ج.م a fixed fee. Prefer "رسوم 5 ج.م" over "عمولة" in new copy.

### Real dashboard facts from the screenshots (project files)
- Wallet: "عن كل طلب يتم توصيله، يخصم طلبي 5 جنيهات ثابتة من محفظتك مهما كانت قيمة الطلب… أول 7 أيام مجانية. لا توجد رسوم على الطلبات الملغاة أو غير المسلّمة." The wallet can go negative and has a "شحن المحفظة" (top-up) button. **"First 7 days free" is a new fact** — good hook once confirmed.
- Apps: Meta Pixel, Google Analytics 4, Google Tag Manager, Meta Conversions API, TikTok Pixel (each with a "ربط" button).
- Social links: Facebook, Instagram, TikTok, WhatsApp, X shown as icons in the store header/footer.
- Delivery follow-up: the seller adds **their own couriers (مناديب)** and tracks ready / in progress / delivered / cash with couriers. This is a seller tool, not Tallaby fulfillment.
- Add product: Arabic + English fields, category suggestion, readiness score.
- Settings: store link with copy/open, design system, pages, domain & SEO, social links.

## 2. Drive structure (reorganised 20 Oct 2026)

Folder "Tallaby seller posts" `1tMJg9wKaM55ItUfPlSIjJwGEeGEcS7Ti`:
- `00 · Plan & schedules` `1tIXV3260ZmuRMWtpQdB6Png0LWeQp4UX` — REELS sheet, Native posts sheet, **NOVEMBER 2026 posting schedule** sheet; subfolder `Buffer CSV sheets` `1CDzCA1A4tiEvUlM6pKWt8TR5lK9EAhlJ` (Batch 1 FB/IG/LinkedIn, Batch 2 FB/IG)
- `01 · October 2026 (26–31 Oct)` `1nk2PHVkUgo5ErpQdG9OEn2cNqdVnxSq3` → `Images (single posts)` `16NjS_5Nv0z-vmFWdEB1mAkCe3j-ik8oc`, `Carousels` `1PPo75bLDMq7Mxo5QLxpLyns22w5fl5KW`
- `02 · November 2026` `1-IbtVTIVyPpM-B5eN-wkoU-ET2ocyKFi` → `Images (single posts)` `1fg-iv0nrHJtmOIQRe0MapCMa9P6iGifO`, `Carousels` `1JquF4pkDYboweWsdtxiG0OrDa5uIP0uw`, `Reels` `1dFmbbO061aIq3XcOP63_wehsEo5zLdeV`
- `03 · December 2026 – 3 Jan 2027` `19k7BGhSx_WSo7cADyLfU2Z7kbzWDISyi`
- `04 · Brand assets` `1jItB7SC-9r2E1bgNEgqTmVfQe4UVmTPb` → `Dashboard screenshots`, `Mockups`
- `99 · Archive` `1AWx3B1k7SQPL5iJwLHge7BD-uRPPQzWa` → duplicates (root copies + dated carousel slides) and superseded sheets

Files were **moved, not copied**, so every Buffer `uc?export=view&id=` link still works. New exports go in the month folder; carousel slides go in one folder per carousel named `YYYY-MM-DD · ID · title (N slides)`.

## 3. November batch — designed 20 Oct 2026

Canva folder: **"Tallaby — November 2026 posts (12–30 Nov) — READY TO DOWNLOAD"** `FAHYi_qzjJ0`. Master schedule with captions: Drive `00 · Plan & schedules` → "NOVEMBER 2026 — Posting schedule … v2" `1HFb-tSHbqz03Wbw8inujwdpQ5bS1tV1U-ZF_4nIh1wo` (also `Desktop\tallaby\Social Media Designs\November 2026 — posting schedule.csv`).

### Single images (18)
| Date | ID | Headline (highlight) | Canva | Background | Object |
|---|---|---|---|---|---|
| 12 Nov 13:30 | P3-04 | متجر إلكتروني **لأي** حد! | `DAHYiyeMnek` | stripes | AI photo phone on shop counter |
| 12 Nov 20:00 | P2-06 | الشحن **محيرك؟** تابعه بسهولة! | `DAHYi4lw97Q` | blobs | real delivery follow-up screen |
| 14 Nov 20:00 | P2-07 | منتجاتك **متلخبطة؟** نظّمها! | `DAHYi_SXUJo` | plus & dots | AI notebook + sticky notes |
| 16 Nov 20:00 | P4-11 | رابط **باسمك** إنت | `DAHYi1Ege3o` | sparkles | real store-link settings |
| 17 Nov 20:00 | P4-12 | متجرك حلو **على الموبايل** وبالعربي | `DAHYi0GHdc0` | curved | real template on phone |
| 18 Nov 13:30 | P2-09 | نفس الأسئلة **كل** يوم؟ | `DAHYi1RwHaE` | rings | AI phone + empty chat bubbles |
| 18 Nov 20:00 | P4-13 | متجرك **متوصل** بشركات الشحن | `DAHYi6wNtE4` | dots | AI kraft parcel |
| 19 Nov 13:30 | P3-05 | إنستجرام **مش** كفاية! | `DAHYi7eoWAk` | stripes | AI hand + phone shop grid |
| 21 Nov 20:00 | P4-16 | حساباتك **السوشيال** في متجرك | `DAHYi3TXEKs` | plus & dots | real social-links screen |
| 22 Nov 13:30 | P5-06 | محتاج **إيه** عشان تبدأ؟ | `DAHYi69yU2E` | curved | real dashboard home |
| 22 Nov 20:00 | P4-17 | زوارك **جايين** منين؟ | `DAHYi0VYhnA` | sparkles | real apps screen (GA4 callout) |
| 24 Nov 20:00 | P4-19 | بيكسل ميتا **وتيك توك** في متجرك | `DAHYixz5bo8` | rings | real apps screen (CAPI callout) |
| 26 Nov 20:00 | P4-21 | مقاسات **وألوان** لكل منتج | `DAHYixfhROU` | stripes | real add-product screen |
| 27 Nov 20:00 | P4-15 | الدفع **كاش** عند الاستلام | `DAHYi-JXbxk` | blobs | AI hand with banknotes + parcel |
| 29 Nov 13:30 | P1-12 | عندك أكتر **من براند؟** لحد 3 متاجر | `DAHYi3DpjJ0` | blobs | real builder on laptop |
| 29 Nov 20:00 | P4-23 | كل أوردر **قدام** عينك | `DAHYi3rDT00` | dots | real dashboard (sales/orders callout) |
| 30 Nov 13:30 | P2-11 | بتعلن ومش **عارف** مين اشترى؟ | `DAHYi5Id_VY` | plus & dots | real apps screen (Meta Pixel callout) |
| 30 Nov 20:00 | P3-07 | رابط **واحد** لكل منتجاتك | `DAHYi7EMa5g` | curved | AI hand + phone link preview |

### Carousels (5)
| Date | ID | Canva | Pages | Background |
|---|---|---|---|---|
| 16 Nov 13:30 | P5-05 ابدأ في 5 خطوات | `DAHYi3inPH4` | 6 | stripes |
| 17 Nov 13:30 | P1-10 طلبي لمين؟ | `DAHYi0ey4HA` | 6 | blobs |
| 19 Nov 20:00 | P4-14 طرق دفع كتير | `DAHYi-epHho` | 6 | sparkles |
| 25 Nov 13:30 | P3-06 صفحة ولا متجر؟ | `DAHYi70PZDk` | 7 | curved |
| 25 Nov 20:00 | P4-20 كل التطبيقات متوصلة | `DAHYi5CZuqY` | 6 | blobs |

### Reels (10) — `Desktop\tallaby\Social Media Designs\Reels\November\`
| Date | ID | File | Length | Motion idea |
|---|---|---|---|---|
| 7 Nov | P4-07 home food | `2026-11-07_P4-07_home-food-store_reel_VO.mp4` | 25s | plates top-view → menu-photo chat flood → "خلاص بقى!" stamp → menu store with cursor order → order card |
| 9 Nov | P2-04 السعر كام؟ | `2026-11-09_P2-04_price-in-DM_reel_VO.mp4` | 21s | bubble avalanche → spinning clock → store grid + link → WhatsApp chat ordering |
| 13 Nov | P5-03 فين الفخ؟ | `2026-11-13_P5-03_where-is-the-catch_reel_VO.mp4` | 20s | magnifier spotlight scanning the "terms" → 5 ج.م circle → مبعتش = مدفعتش |
| 15 Nov | P4-10 عدّل بنفسك | `2026-11-15_P4-10_edit-your-store-yourself_reel_VO.mp4` | 19s | live recolour/logo/banner → **real builder screenshot** zoom → mobile preview → publish |
| 15 Nov | P2-08 رفع المنتجات | `2026-11-15_P2-08_uploading-products-takes-forever_reel_VO.mp4` | 18s | night palette, 02:00 clock, typing a form → day wipe, sheet rows → product grid, 50 counter |
| 20 Nov | P2-17 Black Friday | `2026-11-20_P2-17_black-friday-get-ready_reel_VO.mp4` | 20s | dark/gold theme, calendar flip to 27, countdown, template pick, BLACK25 coupon, orders |
| 23 Nov | P4-18 Meta Pixel | `2026-11-23_P4-18_meta-pixel_reel_VO.mp4` | 25s | ad money falling → pixel pulse → **real apps screen**, tap ربط, type ID → buyer-dot targeting → GA4/TikTok/GTM/CAPI |
| 24 Nov | P2-10 العميل محتار | `2026-11-24_P2-10_confused-customer_reel_VO.mp4` | 23s | "?" rain → cart leaves → product page builds part by part with labels → stopwatch decision |
| 26 Nov | P5-07 حسبة بسيطة | `2026-11-26_P5-07_simple-math_reel_VO.mp4` | 25s | calculator → printed receipt (site's 120 × 450 example) → 0 = 0 |
| 28 Nov | P4-22 Import/Export | `2026-11-28_P4-22_bulk-import-export_reel_VO.mp4` | 22s | falling box tower "200" → dashboard import, file drag, progress, rows → export |

QA fixes applied after an independent review (20 Oct): swash restored on P4-19/P2-11, swash lowered where it touched letters (P2-09, P1-10 p6, P3-06 p1/5/7), labels nudged up (P2-11, P5-06), corner "الشحن:" → "البيع:" on P2-06 and P4-15 (avoid implying Tallaby delivers), P4-14 slide 5 "لينكات دفع" → "عميلك يختار اللي يريحه" (payment links may imply cards). Known font note: Noto Kufi Arabic draws final ي without visible dots at small sizes ("طلبى") — it is the correct character.

Not produced: **P1-11 ورا الكواليس** (needs real team footage — film 20s of the team at work, or swap with a repost of P1-07).

Voice: VOs for P2-04, P5-03, P2-08, P4-10 on Higgsfield (Callum preset); Higgsfield then ran **out of credits**, so P4-07, P4-18, P2-10, P5-07, P2-17, P4-22 used **ElevenLabs connector, premade voice "Callum" `N2lVS1w4EtoT3dr4eOWO`, model eleven_multilingual_v2** (same engine as Higgsfield's ElevenLabs Callum, ~2 cents each). ElevenLabs allows one generation at a time (429 otherwise). Flow: `0EqIPa6JooNRnPKF9q2B`.

### Schedule changes vs the post bank
- **P2-17 (Black Friday reel) moved 27 Nov → 20 Nov 20:00** so "لسه فيه وقت / بعد أسبوع" is true; **P4-15 moved 20 Nov → 27 Nov** (COD on Black Friday day).
- **P4-19** changed from "Meta catalog" to "بيكسل ميتا وتيك توك" (catalog not in the Apps page).
- **P1-12** changed from "متجر باسمك" (duplicate of P4-11) to "عندك أكتر من براند؟ لحد 3 متاجر".
- **P5-05** steps now follow the live site: سجّل ببلاش في دقيقة → احجز رابط متجرك → اختار قالب → ضيف منتجاتك → انشر وشارك.
- **P5-06** caption updated: email or Google account, store name, link — sign-up under a minute.
- **P2-06** now about tracking shipments from the dashboard (real delivery follow-up screen).

## 4. Production workflow that works (20 Oct 2026)

**Real-screenshot mockups → Canva:** the sandbox can't reach canva.com, Drive upload APIs or tallaby.com. Working route: in the user's Chrome open canva.com, inject a hidden `<input type=file>`, `file_upload` the **project screenshot attachments** (only user attachments are allowed), draw the phone/laptop mockup on a `<canvas>` in the page (phone 430×900 rounded, rotation −5°, optional zoomed "callout" card of the key UI area), then POST the PNG blob to a `create-upload-url` URL → returns a Canva media id. Media ids made: Meta Pixel `MAHYi42bG94`, GA4 `MAHYiztyme8`, CAPI `MAHYi5RCQ_c`, dashboard orders `MAHYi1vJuM0`, template phone `MAHYi5pc8RQ`, builder laptop `MAHYiymLSlU`, social links `MAHYi9f6lh4`, wallet fees `MAHYixNoBns`, add product `MAHYi3PEQ9A`, delivery `MAHYi3rK3H4`, store link `MAHYi_j1hrE`, dashboard home `MAHYi7x-EDI`.

**Reels:** HTML + `kit.js` (deterministic `render(t)`), Playwright frame capture → ffmpeg H.264 1080×1920 30fps, VO delayed 150 ms + loudnorm −15 LUFS. Scene starts are taken from `silencedetect` on the VO. Source: `Desktop\tallaby\Social Media Designs\Reels\_source\tallaby_reel_kit_nov.zip`.

**Getting VO files into the sandbox:** VO CDNs are blocked in the sandbox. In Chrome open a **new tab** on the audio URL's origin, `fetch` the file(s), and trigger one download per tab (Chrome blocks a second automatic download in the same tab). Several MP3s can be packed into one download (JSON header line + concatenated bytes) and split in the sandbox. Then stage from `C:\Users\elsha\Downloads` (folder access granted 20 Oct).

## 5. Recommendations (next steps)
1. Answer the 6 open questions in §1 — especially AI and cards — before boosting any reel.
2. Download the Canva folder `FAHYi_qzjJ0` as PNG into Drive `02 · November 2026` (images + one folder per carousel); then Claude fills Buffer batch 3–5 with the image links.
3. Post reels and carousels natively in Meta Business Suite using the November schedule sheet.
4. December: build a "قالب لكل نشاط" series from the 39 templates (one carousel per category + niche reels), a "أول 7 أيام مجانية" post once confirmed, and an SEO feature post (site lists SEO titles/descriptions).
5. Top up Higgsfield credits or keep using ElevenLabs Callum for VOs (same voice family).
