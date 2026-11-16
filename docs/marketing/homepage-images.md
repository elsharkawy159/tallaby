# tallaby.com homepage images (ChatGPT brief)

Images for the tallaby.com home page (`apps/ecommerce/app/[locale]/(marketing)/(site)/page.tsx`). The owner generates them in ChatGPT; Claude wires them in afterwards. This brief changes no code.

Save every file in **`apps/ecommerce/public/marketing/home/`** (the folder doesn't exist yet; create it).

## 0. What the page shows today

The homepage is, in order (all sections in `apps/ecommerce/components/marketing/home/home-sections.tsx`):

| # | Section (id) | What it shows today | Layout and free space |
|---|---|---|---|
| 1 | Hero (`#top`) | Text, one CTA, three checks, a feature marquee of pills with lucide icons, then `HeroDemo` (a coded dashboard frame with a phone on top, `hero-demo.tsx`) | Centred. Background is only the CSS fog (`--bg-fog`). Empty space on both sides of the demo at ≥1081 px. |
| 2 | Stores on Tallaby | Real seller logos in a loop (`store-logo-strip.tsx`); hidden when too few | Full width strip. Real data, no image needed. |
| 3 | What is Tallaby (`#what-is-tallaby`) | Heading, lead and a "who it's for" line on the start side; 4 cards (store, money, shipping, world) with lucide `IconTile`s on the end side | Two columns at ≥1081 px. The heading column is short, so there is empty height under it. |
| 4 | Features (`#features`, `#ai`, `#marketing`) | One big card: Claude/ChatGPT (MCP) with a coded chat demo (`mcp-chat-demo.tsx`); 4 small cards (AI, marketing, import, ads) with lucide icons | Bento grid: big card 2×2, small cards 272 px tall at ≥1081 px. |
| 5 | Templates (`#templates`, `#builder`) | 8 real template screenshots (`public/template-previews/*.webp`) or a live iframe while there is no screenshot | 4-column grid of 3:4 thumbs. Don't replace the screenshots. |
| 6 | Pricing (`#pricing`) | `PlanCards` (Free / Pro), no image | Centred cards. Leave as is: numbers do the work. |
| 7 | FAQ (`#faq`) | Heading on the start side, accordion on the end side | Two columns at ≥1081 px; empty height under the heading. |
| 8 | Final CTA (`#final`) | `CtaBand`: dark teal band (#0d3743) with an amber glow, title, slug form | Text start side, form end side; no art. |

There is no separate shipping, payments, store app (PWA) or analytics section on the homepage (shipping and payments were folded into "What is Tallaby" on 2026-11-15), so those get small spot illustrations inside "What is Tallaby", not sections of their own. Every feature drawn below is one the page already claims and that is live: own store and domain, COD / InstaPay / wallets / own Paymob or Kashier, Bosta or own riders, selling abroad, AI product writing, the Claude/ChatGPT connection (product tools only), email campaigns / discount codes / WhatsApp follow-up, Excel / link / Shopify import, Meta Pixel, GA4 and product feeds. Pictures stay generic (no carrier, bank or wallet logos), so they can't over-claim.

Existing assets to keep and not duplicate: `public/og-image.jpg` (flat teal with the wordmark, used for every page), `public/logo*.png`, `public/icons/payments/*` (real payment logos), `public/template-previews/*` (template screenshots).

The marketing site has **no dark mode** today (`marketing.css` has no dark tokens). Every image sits on the light fog, except the final CTA art and the share image, which sit on dark teal.

## 1. Style guide (applies to every image)

**One look: soft matte 3D.** Rounded, friendly objects like smooth clay or soft plastic, little detail, generous empty space. It matches the site's rounded cards (18 to 36 px radius), the rounded logo and the soft teal-and-amber fog. Never mix in flat vector, photos or line art.

| Token | Hex | Use in images |
|---|---|---|
| Deep teal (ink-900 / teal-900) | `#0d3743` | Darkest shapes, dark backgrounds |
| Teal (teal-700, brand) | `#145163` | Main object colour |
| Mid teal (teal-500) | `#2c6e80` | Secondary shapes |
| Pale teal (teal-100) | `#cfdde1` | Light surfaces |
| Mist (teal-50) | `#eef3f4` | Lightest surfaces, backgrounds |
| Amber (amber-600, brand accent) | `#fdad28` | One accent per image (sparkle, coin, tag) |
| Light amber (amber-300) | `#ffd166` | Highlights |
| Cream amber (amber-100) | `#ffeec8` | Soft warm fills |
| White | `#ffffff` | Cards, screens, paper |
| Green (checks only) | `#16a34a` | Only for a small "done" tick |

Rules:

- **Lighting:** soft diffused studio light from the top, soft contact shadows, no hard reflections, no glow effects, no neon.
- **Background:** objects and illustrations are **transparent PNG** with clean edges (no white halo), centred, with about 12% empty margin on every side. Backgrounds and patterns are full-bleed and very low contrast.
- **No text at all:** no letters, numbers, words, prices, currency signs or fake UI writing. Screens show only blocks and bars. We add all copy in code (generated Arabic breaks).
- **No logos** except Tallaby's, and even Tallaby's logo is added later in code, not generated. No carrier, bank, wallet, Meta, Google, Claude or ChatGPT marks.
- **No people:** no faces, bodies or hands. Not needed: objects tell the story (same rule as template photos).
- **RTL-friendly:** compositions are centred or symmetrical. Nothing points to a "next" side. Because there is no text, Claude can mirror any image for Arabic (`rtl:-scale-x-100`) where a direction matters.
- **One accent:** amber appears once or twice per image, never as the main colour.

## 2. ChatGPT sizes

ChatGPT makes three sizes: **1024×1024** (square), **1536×1024** (landscape 3:2) and **1024×1536** (portrait 2:3). Ask for the size in the "Request" column, then resize or crop to the "Export" size. For transparent images say "transparent background" (the prompts already do) and download as PNG.

Deliver **PNG** files with the exact names below. Claude converts them to WebP (keeping transparency) when wiring, so the served name ends in `.webp`.

## 3. Image list

| # | File (deliver as) | Section | Request | Export | Transparent | Priority |
|---|---|---|---|---|---|---|
| 1 | `home-hero-pattern.png` | Hero background | 1536×1024 | 1536×1024 | No | Nice to have |
| 2 | `home-hero-bag.png` | Hero, floating by the demo | 1024×1024 | 512×512 | Yes | Must have |
| 3 | `home-hero-parcel.png` | Hero, floating by the demo | 1024×1024 | 512×512 | Yes | Must have |
| 4 | `home-what.png` | What is Tallaby, under the heading | 1536×1024 | 1200×800 | Yes | Must have |
| 5 | `home-point-store.png` | What is Tallaby, store card | 1024×1024 | 384×384 | Yes | Must have |
| 6 | `home-point-money.png` | What is Tallaby, payments card | 1024×1024 | 384×384 | Yes | Must have |
| 7 | `home-point-shipping.png` | What is Tallaby, shipping card | 1024×1024 | 384×384 | Yes | Must have |
| 8 | `home-point-world.png` | What is Tallaby, abroad card | 1024×1024 | 384×384 | Yes | Must have |
| 9 | `home-mcp.png` | Features, Claude/ChatGPT card | 1024×1024 | 640×640 | Yes | Must have |
| 10 | `home-ai.png` | Features, AI card | 1024×1024 | 384×384 | Yes | Must have |
| 11 | `home-marketing.png` | Features, marketing card | 1024×1024 | 384×384 | Yes | Nice to have |
| 12 | `home-import.png` | Features, import card | 1024×1024 | 384×384 | Yes | Nice to have |
| 13 | `home-ads.png` | Features, ads card | 1024×1024 | 384×384 | Yes | Nice to have |
| 14 | `home-template-poster.png` | Templates, placeholder while a live thumb loads | 1024×1536 | 600×800 (crop to 3:4) | No | Must have |
| 15 | `home-faq.png` | FAQ, under the heading | 1024×1024 | 640×640 | Yes | Nice to have |
| 16 | `home-cta.png` | Final CTA band (dark) | 1024×1024 | 640×640 | Yes | Must have |
| 17 | `og-home-art.png` | Social share image (art only) | 1536×1024 | 1200×630 (crop centre) | No | Must have |

Spot sizes are about 2× their largest on-screen size (cards show them at 96 to 192 px), so they stay sharp on retina screens.

### 1. `home-hero-pattern.png`, hero background (Nice to have)

Communicates nothing on its own; adds depth behind the hero text and demo without competing with it. Very low contrast; Claude blends it at about 40% opacity over the existing fog.

> Very subtle full-bleed background texture for the top of a website, landscape 1536×1024. Soft matte 3D style: a calm field of a few large, smooth, rounded abstract shapes (soft pebbles, pill shapes and gentle arcs) floating at different depths, slightly out of focus at the edges, arranged symmetrically around an empty centre. Colours only from this palette: mist #eef3f4, pale teal #cfdde1, white #ffffff, with one or two tiny touches of cream amber #ffeec8. Extremely low contrast, mostly near-white, so dark text stays readable on top. Soft diffused light from the top, no hard shadows. The centre third must be almost empty. Absolutely no text, letters, numbers, logos, people, faces or hands.

### 2. `home-hero-bag.png`, hero floater (Must have)

A shopping bag that "came from" the store on the phone; floats off the demo's top corner (opposite side to the phone) to make the hero feel less flat.

> Single object on a transparent background (PNG with alpha), 1024×1024, centred with wide empty margin. Soft matte 3D illustration, rounded friendly shapes like smooth clay: a small paper shopping bag with rounded handles, tilted slightly, in teal #145163 with a white #ffffff top fold and one small warm amber #fdad28 tag hanging from the handle. Soft diffused studio light from the top, a faint soft shadow only under the bag, no ground plane. Clean edges with no white halo. Absolutely no text, letters, numbers, logos, people, faces or hands.

### 3. `home-hero-parcel.png`, hero floater (Must have)

A parcel, the "order goes out" moment; floats under the demo on the side away from the phone.

> Single object on a transparent background (PNG with alpha), 1024×1024, centred with wide empty margin. Soft matte 3D illustration, rounded friendly shapes like smooth clay: a closed delivery box with soft rounded edges, in cream amber #ffeec8 with pale teal #cfdde1 tape and a small rounded teal #145163 label with no writing on it, viewed from a three-quarter angle, slightly tilted as if floating. Soft diffused light from the top, faint soft shadow under it, no ground plane, clean edges. Absolutely no text, letters, numbers, barcodes, logos, people, faces or hands.

### 4. `home-what.png`, "What is Tallaby" illustration (Must have)

"Your own store, with your name, that you run yourself." Fills the empty height under the heading at ≥1081 px (hidden on phones, where the cards follow directly).

> Illustration on a transparent background (PNG with alpha), landscape 1536×1024, centred and symmetrical with wide empty margin. Soft matte 3D style, rounded friendly shapes like smooth clay: a small, cheerful shop front that grows out of a large rounded smartphone lying slightly tilted; the shop has a rounded awning striped in teal #145163 and white #ffffff, a blank rounded sign board with no writing, and a few product boxes and a shopping bag on its counter. A couple of soft rounded cards float around it showing only blank bars and blocks, like a simple dashboard. Colours only from: deep teal #0d3743, teal #145163, mid teal #2c6e80, pale teal #cfdde1, mist #eef3f4, white #ffffff, with one accent of amber #fdad28. Soft diffused light from the top, soft contact shadows, no ground plane. Absolutely no text, letters, numbers, logos, people, faces or hands.

### 5 to 8. "What is Tallaby" card spots (Must have)

Four matching spot illustrations that replace the lucide `IconTile` in each card (card titles: "A store with your name on it", "Your sales come to you", "You choose how to ship", "Sell in Egypt and abroad"). Generate them one after another in the same ChatGPT chat so they look like one set.

**`home-point-store.png`**

> Spot illustration on a transparent background (PNG with alpha), 1024×1024, centred, wide empty margin. Soft matte 3D style, rounded friendly shapes like smooth clay, minimal detail: a small rounded storefront with a teal #145163 and white striped awning and a blank rounded sign with a small amber #fdad28 star shape on it, no writing. Palette only: teal #145163, mid teal #2c6e80, pale teal #cfdde1, white #ffffff, amber #fdad28. Soft light from the top, faint shadow under the object, no ground plane, clean edges. This is one of a set of four matching spot icons. Absolutely no text, letters, numbers, logos, people, faces or hands.

**`home-point-money.png`**

> Spot illustration on a transparent background (PNG with alpha), 1024×1024, centred, wide empty margin. Soft matte 3D style, rounded friendly shapes like smooth clay, minimal detail: a small stack of plain banknotes with no printing, a rounded payment card with no numbers or logos, and a smartphone with a blank screen showing one soft amber #fdad28 tick circle, grouped together; they stand for cash on delivery, cards and phone wallets. Palette only: teal #145163, mid teal #2c6e80, pale teal #cfdde1, cream amber #ffeec8, white #ffffff, amber #fdad28. Soft light from the top, faint shadow, no ground plane, clean edges. One of a set of four matching spot icons. Absolutely no text, letters, numbers, currency signs, logos, people, faces or hands.

**`home-point-shipping.png`**

> Spot illustration on a transparent background (PNG with alpha), 1024×1024, centred, wide empty margin. Soft matte 3D style, rounded friendly shapes like smooth clay, minimal detail: a small rounded delivery van in plain teal #145163 with no markings, seen from the front three-quarter, next to a cream amber #ffeec8 parcel and a small round map pin in amber #fdad28. Palette only: teal #145163, mid teal #2c6e80, pale teal #cfdde1, cream amber #ffeec8, white #ffffff, amber #fdad28. Soft light from the top, faint shadow, no ground plane, clean edges. One of a set of four matching spot icons. Absolutely no text, letters, numbers, logos, company markings, people, faces or hands.

**`home-point-world.png`**

> Spot illustration on a transparent background (PNG with alpha), 1024×1024, centred, wide empty margin. Soft matte 3D style, rounded friendly shapes like smooth clay, minimal detail: a smooth globe in pale teal #cfdde1 with simple teal #145163 continents (no borders, no flags), with two small parcels and a soft dotted arc orbiting it and ending in a small amber #fdad28 pin. Palette only: teal #145163, mid teal #2c6e80, pale teal #cfdde1, cream amber #ffeec8, white #ffffff, amber #fdad28. Soft light from the top, faint shadow, no ground plane, clean edges. One of a set of four matching spot icons. Absolutely no text, letters, numbers, flags, logos, people, faces or hands.

### 9. `home-mcp.png`, Claude/ChatGPT connection (Must have)

"Connect your account once, then ask the assistant to add products or change prices." Sits at the end-side top corner of the big MCP card, next to the heading, about 160 to 200 px wide (the coded chat demo stays below it). The real Claude and ChatGPT marks are already drawn in code beside the title, so the image must not imitate them.

> Spot illustration on a transparent background (PNG with alpha), 1024×1024, centred, wide empty margin. Soft matte 3D style, rounded friendly shapes like smooth clay, minimal detail: a rounded chat speech bubble in white #ffffff with three soft teal dots, connected by a smooth curved cable with a rounded plug to a small rounded shop box in teal #145163; above the connection, a small amber #fdad28 four-point sparkle. Two tiny product cards float out of the shop box. It means "an AI assistant connected to an online store". Palette only: deep teal #0d3743, teal #145163, pale teal #cfdde1, mist #eef3f4, white #ffffff, amber #fdad28. Soft light from the top, faint shadow, no ground plane, clean edges. Do not draw any robot, any real AI company logo or any brand mark. Absolutely no text, letters, numbers, logos, people, faces or hands.

### 10. `home-ai.png`, Tallaby AI writes your products (Must have)

"From a photo or a few lines: title and description in both languages." Replaces the `IconTile` in the AI card (`#ai`).

> Spot illustration on a transparent background (PNG with alpha), 1024×1024, centred, wide empty margin. Soft matte 3D style, rounded friendly shapes like smooth clay, minimal detail: a small rounded photo frame showing a simple plain mug, an amber #fdad28 four-point sparkle above it, and a white #ffffff product card beside it filled only with soft teal bars where the text would be. It means "a photo becomes a finished product listing". Palette only: teal #145163, mid teal #2c6e80, pale teal #cfdde1, mist #eef3f4, white #ffffff, amber #fdad28. Soft light from the top, faint shadow, no ground plane, clean edges. One of a set of matching spot icons. Absolutely no text, letters, numbers, logos, people, faces or hands.

### 11. `home-marketing.png`, bring customers back (Nice to have)

"Email campaigns, discount codes and WhatsApp follow-up." Replaces the `IconTile` in the marketing card (`#marketing`).

> Spot illustration on a transparent background (PNG with alpha), 1024×1024, centred, wide empty margin. Soft matte 3D style, rounded friendly shapes like smooth clay, minimal detail: a rounded envelope in white #ffffff with a teal #145163 flap, a small amber #fdad28 discount ticket with a round punched hole and no writing, and a small rounded chat bubble in mid teal #2c6e80 with three white dots. Palette only: teal #145163, mid teal #2c6e80, pale teal #cfdde1, white #ffffff, amber #fdad28. Soft light from the top, faint shadow, no ground plane, clean edges. One of a set of matching spot icons. Absolutely no text, letters, numbers, percent signs, logos (no WhatsApp logo), people, faces or hands.

### 12. `home-import.png`, bring your products in minutes (Nice to have)

"From Excel, from a product link, or from Shopify." Replaces the `IconTile` in the import card.

> Spot illustration on a transparent background (PNG with alpha), 1024×1024, centred, wide empty margin. Soft matte 3D style, rounded friendly shapes like smooth clay, minimal detail: a rounded spreadsheet sheet with an empty grid of pale teal cells and no writing, and three small product boxes sliding off it along a soft curved path into an open teal #145163 box. One small amber #fdad28 arrow-free spark on the path. Palette only: teal #145163, mid teal #2c6e80, pale teal #cfdde1, cream amber #ffeec8, white #ffffff, amber #fdad28. Soft light from the top, faint shadow, no ground plane, clean edges. One of a set of matching spot icons. Absolutely no text, letters, numbers, logos (no Excel or Shopify marks), people, faces or hands.

### 13. `home-ads.png`, ads that measure right (Nice to have)

"Meta Pixel and Conversions API, GA4, GTM and product feeds." Replaces the `IconTile` in the ads card.

> Spot illustration on a transparent background (PNG with alpha), 1024×1024, centred, wide empty margin. Soft matte 3D style, rounded friendly shapes like smooth clay, minimal detail: three rounded bar-chart columns rising in pale teal #cfdde1, mid teal #2c6e80 and teal #145163, with a small round target in white and amber #fdad28 resting on the tallest bar. Palette only: teal #145163, mid teal #2c6e80, pale teal #cfdde1, white #ffffff, amber #fdad28. Soft light from the top, faint shadow, no ground plane, clean edges. One of a set of matching spot icons. Absolutely no text, letters, numbers, axis labels, logos, people, faces or hands.

### 14. `home-template-poster.png`, template placeholder (Must have)

Shown inside a template card while its live preview (iframe) loads, instead of a blank box. Must read as "a store page is loading", never as a real template. Crop the 1024×1536 result to 3:4 from the top (1024×1365), then resize to 600×800.

> Portrait placeholder image, 1024×1536, not transparent. A very simple, soft, abstract wireframe of an online store home page seen straight on: a mist #eef3f4 background, a thin white header bar, a large rounded pale teal #cfdde1 hero block, then a grid of four rounded white product cards with pale teal image squares and soft grey-teal bars instead of text, all with generous spacing and large rounded corners. Flat front view with very gentle soft 3D depth and soft shadows. Colours only: mist #eef3f4, pale teal #cfdde1, white #ffffff, a hint of mid teal #2c6e80. Calm and low contrast. Absolutely no text, letters, numbers, logos, product photos, people, faces or hands.

### 15. `home-faq.png`, FAQ (Nice to have)

"Still have a question? Message us." Fills the empty height under the FAQ heading at ≥1081 px; hidden on phones.

> Spot illustration on a transparent background (PNG with alpha), 1024×1024, centred, wide empty margin. Soft matte 3D style, rounded friendly shapes like smooth clay, minimal detail: two overlapping rounded speech bubbles, one white #ffffff with a soft teal #145163 question-mark shape made of a simple curve and dot (no font), one teal #145163 with three white dots, plus a small amber #fdad28 sparkle. Palette only: teal #145163, mid teal #2c6e80, pale teal #cfdde1, white #ffffff, amber #fdad28. Soft light from the top, faint shadow, no ground plane, clean edges. Absolutely no text, letters, numbers, logos, people, faces or hands.

If ChatGPT draws the question mark as a letter-like glyph, drop it and keep only the bubbles.

### 16. `home-cta.png`, final CTA (Must have)

"Your store link is waiting. Claim it now." Sits on the **dark teal** band (#0d3743) with its amber glow, between the title and the slug form at ≥861 px; hidden on phones.

> Illustration on a transparent background (PNG with alpha), 1024×1024, centred, wide empty margin, designed to sit on a dark teal #0d3743 background. Soft matte 3D style, rounded friendly shapes like smooth clay: a rounded browser address bar floating in space, white #ffffff with a blank pale teal field and no writing, with a small golden key in amber #fdad28 resting in it, and a tiny rounded shop with a teal-and-white striped awning appearing behind it. Colours only: white #ffffff, mist #eef3f4, pale teal #cfdde1, mid teal #2c6e80, amber #fdad28, light amber #ffd166. Lit softly from the top with a warm amber rim light so it reads well on a dark background. No dark outer glow, no white halo around the edges, no ground plane. Absolutely no text, letters, numbers, URLs, logos, people, faces or hands.

### 17. `og-home-art.png`, social share image (Must have)

The picture shown when tallaby.com is shared on WhatsApp, Facebook or X. ChatGPT makes **art only**; Claude adds the Tallaby wordmark (`public/logo-white.png`) and the Arabic line in code or with a script, because generated lettering breaks. Keep the left 55% calm: in Arabic the logo and line sit on the right, in English on the left, so Claude will mirror the art per locale if needed. Crop the 1536×1024 result to 1536×806 around the centre, then resize to 1200×630.

> Wide social share background, 1536×1024, not transparent. Solid deep teal #0d3743 background with a soft radial amber #fdad28 glow coming from the top centre at low strength. On the right third only, a small cluster of soft matte 3D objects in rounded clay style: a smartphone with a blank screen showing rounded white product cards, a teal-and-white striped shop awning, a cream amber #ffeec8 parcel and a small amber #fdad28 sparkle. The left two thirds stay nearly empty and calm for a logo and a headline that will be added later. Colours only: deep teal #0d3743, teal #145163, mid teal #2c6e80, pale teal #cfdde1, white #ffffff, amber #fdad28, cream amber #ffeec8. Soft light from the top, soft shadows. Keep every object at least 80 px from the top and bottom edges so a crop to 1200×630 keeps them whole. Absolutely no text, letters, numbers, logos, people, faces or hands.

## 4. Where each image goes (for the wiring task)

All files are served from `/marketing/home/<name>.webp`. Use `next/image` with explicit `width`/`height`, `alt=""` and `aria-hidden` (they are decorative; the copy already says everything), and `sizes` matching the slot.

| File | Component | Use |
|---|---|---|
| `home-hero-pattern` | `HomeHero` in `components/marketing/home/home-sections.tsx` | Absolute background layer under the `<section id="top">`, `object-cover`, about 40% opacity, `priority` off (below the text) |
| `home-hero-bag`, `home-hero-parcel` | `HeroDemo` in `components/marketing/home/hero-demo.tsx` | Two absolute floaters on the demo's free side (opposite the phone), ~96 to 140 px, shown at ≥641 px only; a gentle one-time `animate-pop` at load, off under reduced motion |
| `home-what` | `WhatIsTallabySection` (same file) | Under the heading column's "who" line, at ≥1081 px only (`hidden min-[1081px]:block`), ~420 px wide |
| `home-point-*` | `WhatIsTallabySection`, the `points` array | Replace `IconTile` with the spot at 64 px on phones and 96 px from 641 px; add an `image` field next to `icon` (keep the icon as fallback) |
| `home-mcp` | `FeaturesSection`, the big MCP card | End-side top corner beside the heading, ~160 to 200 px, from 641 px |
| `home-ai`, `home-marketing`, `home-import`, `home-ads` | `FeaturesSection`, the `cards` array | Same swap as the point cards: spot instead of `IconTile`, 64 / 96 px |
| `home-template-poster` | `TemplateLiveThumb` in `components/marketing/templates/template-live-thumb.client.tsx` (used by `template-thumb.tsx`) | Background or poster of the 3:4 box until the iframe loads. This thumb is also used on `/templates`, so it improves that page too |
| `home-faq` | `HomeFaq` (same file) | Under the heading at ≥1081 px only, ~240 px |
| `home-cta` | `FinalCta` (same file) via `CtaBand` in `components/marketing/site/cta-band.tsx` | Add an optional `art` prop to `CtaBand` (other pages keep it empty), shown at ≥861 px, ~200 px |
| `og-home-art` | Composite into `public/marketing/home/og-home.ar.jpg` and `og-home.en.jpg` (1200×630) with the logo and line; point the home page at them through `pageMetadata` in `lib/marketing/metadata.lib.ts` (other pages keep `DEFAULT_OG_IMAGE`) | Share image |

Wiring checks: 390 px and 1440 px in Arabic and English, no layout shift (fixed sizes), page weight kept low (each spot WebP under ~40 KB, backgrounds under ~150 KB), Lighthouse LCP unchanged (the H1 stays the LCP element).

## 5. Owner checklist

1. Open one ChatGPT chat for the whole set (spots look more alike that way). Paste prompt 5 first, then 6, 7, 8, 10 to 13 in the same chat.
2. For each image: paste the prompt, choose the "Request" size, regenerate until there is **no text, no logo and no person** in it, and transparent images have clean edges.
3. Resize (and crop where noted) to the "Export" size. Keep it PNG.
4. Name each file exactly as in the list (lowercase, hyphens).
5. Drop them into `apps/ecommerce/public/marketing/home/` (create the folder).
6. Tell Claude which files are in. Missing Nice-to-have files are fine; the page works without them.

## 6. Product pages (tallaby.com/features/…)

The nine product pages (`lib/marketing/product-pages.lib.ts`) already show real template screenshots and coded dashboard screens, so they work without these. Each page has one optional **spot illustration** slot, the `art` field of its entry, drawn at the hero picture's top corner at ≥1081 px only (about 140 px, `alt=""`, `aria-hidden`). Same style guide as §1, same chat as the home spots so they match. All are Nice to have.

| # | File (deliver as) | Page | Request | Export | Transparent | Priority |
|---|---|---|---|---|---|---|
| 18 | `feature-store-design.png` | /features/store-design | 1024×1024 | 384×384 | Yes | Nice to have |
| 19 | `feature-store-app.png` | /features/store-app | 1024×1024 | 384×384 | Yes | Nice to have |
| 20 | `feature-product-management.png` | /features/product-management | 1024×1024 | 384×384 | Yes | Nice to have |
| 21 | `feature-order-management.png` | /features/order-management | 1024×1024 | 384×384 | Yes | Nice to have |
| 22 | `feature-offers-and-coupons.png` | /features/offers-and-coupons | 1024×1024 | 384×384 | Yes | Nice to have |
| 23 | `feature-email-marketing.png` | /features/email-marketing | 1024×1024 | 384×384 | Yes | Nice to have |
| 24 | `feature-reports.png` | /features/reports | 1024×1024 | 384×384 | Yes | Nice to have |
| 25 | `feature-store-seo.png` | /features/store-seo | 1024×1024 | 384×384 | Yes | Nice to have |
| 26 | `feature-online-payments.png` | /features/online-payments | 1024×1024 | 384×384 | Yes | Nice to have |

Every prompt below ends with `[closing line]`: replace it with this text before pasting:

> Colours only: deep teal #0d3743, teal #145163, mid teal #2c6e80, pale teal #cfdde1, mist #eef3f4, white #ffffff, amber #fdad28 as the single accent. Soft diffused light from the top, soft contact shadows, about 12% empty margin on every side, clean edges with no white halo. Absolutely no text, letters, numbers, currency signs, logos, people, faces or hands.

### 18. `feature-store-design.png`

> Illustration on a transparent background (PNG with alpha), 1024×1024, centred. Soft matte 3D style, rounded friendly shapes like smooth clay: a rounded white browser window showing blank teal and pale teal layout blocks, with one block lifted slightly out of the page as if being dragged into place, and a small amber paint swatch resting on its corner. [closing line]

### 19. `feature-store-app.png`

> Illustration on a transparent background (PNG with alpha), 1024×1024, centred. Soft matte 3D style, rounded friendly shapes like smooth clay: a rounded smartphone in deep teal with a blank white screen, and a single rounded app icon tile in teal with a tiny shop awning on it floating just above the screen, with a small amber download arrow badge on the tile. [closing line]

### 20. `feature-product-management.png`

> Illustration on a transparent background (PNG with alpha), 1024×1024, centred. Soft matte 3D style, rounded friendly shapes like smooth clay: three neat stacked product boxes in white, pale teal and teal, with a small rounded price tag in amber hanging from the top box by a string. [closing line]

### 21. `feature-order-management.png`

> Illustration on a transparent background (PNG with alpha), 1024×1024, centred. Soft matte 3D style, rounded friendly shapes like smooth clay: a rounded white clipboard with blank teal bars for lines, a small closed parcel in pale teal beside it, and one small amber check badge on the clipboard. [closing line]

### 22. `feature-offers-and-coupons.png`

> Illustration on a transparent background (PNG with alpha), 1024×1024, centred. Soft matte 3D style, rounded friendly shapes like smooth clay: a rounded coupon ticket in white with a perforated edge and a blank teal stripe, slightly tilted, and a small wrapped gift box in teal with an amber ribbon behind it. [closing line]

### 23. `feature-email-marketing.png`

> Illustration on a transparent background (PNG with alpha), 1024×1024, centred. Soft matte 3D style, rounded friendly shapes like smooth clay: a rounded white envelope, half open, with a blank pale teal card rising out of it, and a small amber sparkle above the card. [closing line]

### 24. `feature-reports.png`

> Illustration on a transparent background (PNG with alpha), 1024×1024, centred. Soft matte 3D style, rounded friendly shapes like smooth clay: a rounded white card standing upright with four rounded bars rising from left to right in pale teal, mid teal, teal and amber for the tallest, with no axes and no numbers. [closing line]

### 25. `feature-store-seo.png`

> Illustration on a transparent background (PNG with alpha), 1024×1024, centred. Soft matte 3D style, rounded friendly shapes like smooth clay: a rounded teal magnifying glass resting over a small white card with blank teal lines, and a tiny amber star at the top of the card. [closing line]

### 26. `feature-online-payments.png`

> Illustration on a transparent background (PNG with alpha), 1024×1024, centred. Soft matte 3D style, rounded friendly shapes like smooth clay: a rounded teal wallet, slightly open, with a blank white payment card peeking out and one amber coin leaning against it. [closing line]

**Wiring:** convert to WebP under ~40 KB, save as `apps/ecommerce/public/marketing/features/<slug>.webp`, and set `art: "/marketing/features/<slug>.webp"` on that page's entry in `product-pages.lib.ts`. Check 1440 px in Arabic and English (the spot must not cover the screenshot's content).
