# Storefront section rules

**Status: DRAFT v0.1 (2026-10-25), for owner review. Most of the motion system (§6) is not built yet; §11 lists the gaps.**
These rules apply to every section design (`packages/store-sections/src/designs/<category>/<id>.ts`) and to every section a template uses. They add to, and never replace, `CLAUDE.md` rule 17 and the authoring rules in `docs/superpowers/specs/2026-10-19-tree-sections-design.md` §6. `docs/template-rules.md` says how sections are put together into a template; this file says how each section is made.

Reference studied: Shopify paid themes (`themes.shopify.com`, paid filter, 2026-10-25). Seven live demos checked in a browser: Adam, Attitude, Azimuth, Blum (Fable), Metropolitan, Veloza, Voltix. We learn their structure, rhythm and motion. We do not copy their layouts, copy or photos.

---

## 1. What we learned from Shopify

**Structure.** A Shopify theme page is a JSON list of sections (type + settings + blocks, in order). The section's markup is shared code. Each section is one clear job: a slideshow, a product rail, a banner grid, image with text, a ticker, a lookbook, testimonials, a blog row. The demos used 11 to 16 sections on the home page, for example:

| Theme | Home page, top to bottom |
|---|---|
| Azimuth | slideshow, popular products, media cards, popular products, featured collections, banner grid, highlighted products, featured products, image with text, tabs slider, image tabs, social, blog |
| Metropolitan | slideshow, popular products, banner grid, popular products, media banner, featured collections, featured products, lookbook, image with text, blog |
| Attitude | announcement, slideshow, ticker, popular products, banner grid, collection list, popular products, product hotspots, slideshow, testimonials, rich text, numbers, blog, FAQ |
| Blum (Fable) | announcement, hero, shop by age, new season (tabbed products), marquee, lookbook ("complete the look"), watch and shop, values, story, journal |

**Rhythm.** They alternate a **visual** section (full-width photo, banner grid, lookbook, marquee) with a **shopping** section (product rail, collection tiles). Two product rails never sit next to each other without a visual break.

**Motion.** Every demo animates on scroll, and all of it is simple:

- sections and cards **fade in and move up** as they enter the screen, cards one after another (stagger);
- images **reveal**: a slight zoom-out (about 1.1 → 1) or a wipe, as they enter;
- headings can **reveal by line or word** (Adam, Veloza);
- a **marquee** band of short phrases moves slowly across the screen (Azimuth, Attitude, Blum, Veloza);
- **numbers count up** once (Attitude);
- product images **zoom a little or swap to a second photo** on hover;
- buttons and links have a small hover motion (underline grows, arrow nudges);
- a few use light **parallax** on large images (Voltix, Veloza).

None of them uses bounce, spin or page-long effects. Shopify's free reference theme (Dawn) exposes exactly two site settings: *Reveal sections on scroll* (on/off) and *Hover effect* (none, vertical lift, 3D lift). We follow that idea: few, global, safe controls.

## 2. Shopify ideas mapped to Tallaby

| Shopify | Tallaby |
|---|---|
| Section file (`sections/x.liquid`) + `{% schema %}` | A design (`defineDesign`), inserted as a `custom-section` with one `section` root |
| Blocks inside a section | Child nodes (cards, slides, buttons); "Add item" duplicates the last child |
| Presets (the section in "Add section") | The library entry for the design (`library_sections`) |
| Color schemes | Section shell `scheme` (`default`, `muted`, `primary`, `dark`) on theme tokens |
| Section groups (header, footer) | Chrome (header, footer, bottom navigation) |
| `enabled_on` / `disabled_on` | Library category filters (for example `product-page` only on the product page) |
| `max_blocks` | Node limits (≤ 400 nodes, depth ≤ 12) plus the per-kind limits in §4 |
| Theme settings: animations, hover effect | Theme › Animations (§6.6) |

## 3. Anatomy of every section

Every section is built from the same five parts, in this order. Parts in brackets are optional.

1. **Root** `section`: shell scheme, vertical padding, width (`contained`, `wide`, `full`), animation.
2. **Container**: the content width. A full-bleed section (hero, banner, marquee) skips it or sets `width: full`.
3. **(Head)**: a `stack` labelled "Heading" with, in order: an eyebrow (`badge` or small uppercase `text`, ≤ 3 words), the `heading` (h2, ≤ 8 words), an optional one-line `paragraph`, and on product or category sections a "View all" `textLink` at the end. On desktop the link sits on the same row as the heading (`justify: between`); on mobile it goes under the heading or stays at the end of the row.
4. **Body**: the grid, rail, slides, cards or media.
5. **(Foot)**: one button, centred, only when the head has no "View all".

Rules:

- **One idea per section.** If a section needs two headings, it is two sections.
- **One primary button per section** at most. Secondary actions are text links.
- Every container node has a label in Arabic and English (spec §6 rule 2), and the labels say what the part is ("Heading", "Slides", "Card", "Photo").
- Heading levels: the hero heading is the page's only `h1`; section headings are `h2`; card titles are `h3`.
- The same section kind looks the same across a template: one head layout, one card style, one button style.

## 4. Section kinds and their limits

Use these kinds. Each already has designs in the library unless marked **gap** (§11).

| Kind | Library category | Content limits | Notes |
|---|---|---|---|
| **Hero / slideshow** | `hero` | 1 to 3 slides. Headline ≤ 6 words, subline ≤ 15 words, 1 button | First section only. Full-bleed photo or a split (photo + text). The hero's text and image are never hidden before animation (§6.4). |
| **Product rail or grid** | `products` | 4 to 8 products; 4 per row desktop, 2 mobile; rail swipes on mobile | Always a `productList` node. Head with "View all". |
| **Tabbed products** | `products` (`products-tabbed`) | 2 to 4 tabs, each 4 to 8 products | Good for "New in / Best sellers / Offers". |
| **Collection tiles** | `categories` | 3 to 8 tiles | `categoryList` node; circles, cards or a list with counts (like Blum's "Shop by age"). |
| **Banner grid** | `promotions`, `gallery` | 2 to 4 photo cards, each with ≤ 4 words and a text link or button | The main visual break between product rails. Links go to catalog URLs. |
| **Image with text** | `image-text` | 1 photo, eyebrow, heading, ≤ 40 words, 1 button | Photo side alternates (start, then end) when a page has two. |
| **Marquee band** | `promotions`, `features` | 3 to 6 short phrases (≤ 4 words each) with a separator icon | Moves slowly (§6.3). At most one per page. |
| **Shop the look / lookbook** | `gallery` (`gallery-shoppable`) | 1 photo + 2 to 4 linked products | Hotspot pins on the photo are a **gap** (G12); until then, photo + product list side by side. |
| **Featured product** | `products` (`products-feature`) | 1 product with gallery, price, Add to cart | Uses product data, never a typed product. |
| **Trust strip** | `features` | 3 or 4 icons, ≤ 6 words each | Delivery, cash on delivery, returns, support. |
| **Testimonials** | `testimonials` | 3 to 6 quotes, ≤ 30 words each | `reviewList` when the store has reviews; seller text otherwise. |
| **Numbers** | `statistics` | 3 or 4 numbers with a short label | Numbers count up once (§6.3). |
| **Brands** | `brands` | 4 to 12 logos | Hides when empty. |
| **Blog** | `blog` | 3 posts | `postList` node; hides when empty. |
| **Newsletter** | `newsletter` | Heading, 1 line, the store form | Bound store form only. |
| **FAQ** | `faq` | 4 to 8 questions | Native `<details>`. |

## 5. Design language: creative and current

The goal is a store that looks like it was designed this year, while every part stays editable and theme-driven.

**Type**

- Big, confident headings: hero uses `display-lg`, section headings `display-sm` or `display-md`. One heading font and one body font (theme tokens).
- An **eyebrow** above most section headings (small, uppercase in English, letter-spaced, in the brand colour or muted).
- At most one **accent word** per heading in the brand colour or the heading font's italic (Blum: "Wear the *Wonder*"). The accent is a separate inline node so it can be edited.
- Arabic: no uppercase, no letter-spacing on Arabic text, line-height ≥ 1.5 for body and ≥ 1.25 for headings.

**Layout**

- Generous white space: section padding `lg` (80 px) desktop, `md` (48 px) mobile by default; tighter (`sm`) only for marquee and trust strips.
- Rhythm: alternate shell schemes (`default`, then `muted` or a soft gradient, then `default`) so the page reads as clear bands. Never three `dark` sections in a row.
- Full-bleed for visual sections (hero, banner, marquee, lookbook); contained for shopping sections.
- Asymmetry is welcome (bento grids, an image overlapping a card, a large tile next to two small ones), but only inside one section and only if it stacks cleanly to one column on a phone.

**Surfaces**

- One corner radius per template (pick 0, 12 or 20 px) applied to cards, images and buttons alike; pill buttons are allowed when the radius is 20.
- Soft surfaces: `shelf` or `brand-soft` gradients, thin `line` borders, light shadows. No heavy drop shadows, no bevels.
- Photo overlays use the `ink-fade` gradient so text on photos always reads (contrast ≥ 4.5:1).
- Decoration (`pattern`, shapes, stickers) is a node and stays behind content, `aria-hidden`.

**Product cards** (identical across the template)

- Fixed image ratio (`square` or `portrait`), title ≤ 2 lines, price and compare-at price, a discount or "New" badge in a corner, Add to cart (or "Choose options").
- Hover (desktop): the image zooms to 105 % **or** swaps to the product's second photo (second-photo swap is a **gap**, G11). Never both.
- Colour swatches under the title are allowed when the product has colour variants.

**Images**

- Same style, light and crop across a template. Real photos that fit the trade; no watermarks.
- Ratios from the fixed list only (`square`, `portrait`, `landscape`, `wide`, `banner`, `story`).

## 6. Motion system

Motion must feel **calm, quick and the same everywhere**. Everything below is optional per element, off when the visitor asks for less motion, and never hides content when scripts fail.

### 6.1 Motion tokens

| Token | Value |
|---|---|
| Duration, small (hover, buttons) | 200 ms |
| Duration, entrance | 600 ms |
| Duration, image reveal | 900 ms |
| Easing | `cubic-bezier(.2,.7,.2,1)` (fast start, soft stop) |
| Rise distance | 24 px (16 px on mobile) |
| Stagger step | 70 ms, at most 6 steps (item 7 onwards appears with item 6) |
| Start point | the element is 15 % inside the screen |

No entrance runs longer than 900 ms, and no page waits more than about 1.3 s for its last item.

### 6.2 Entrance presets (play once, when the element first comes into view)

| Preset | What it does | Use on |
|---|---|---|
| `none` | No motion | Default for elements; always for chrome, buy box, forms, cart |
| `fade` | Opacity 0 → 1 | Text blocks, logos |
| `rise` | Fade + move up 24 px | Section heads, cards, buttons (the default for sections) |
| `reveal-image` | Image zooms out from 110 % to 100 % inside its frame, with a fade | Banner and lookbook photos, image-with-text photos |
| `wipe` | The element is uncovered from the start edge to the end edge (`clip-path`), RTL-aware | One hero-sized photo or a large heading per page at most |
| `words` | A heading's words rise one after another (40 ms each) | Hero or one statement heading per page. The renderer wraps words; the seller edits normal text. **Gap** G9. |

Stagger: a container can say "animate items one by one"; its direct children then use the container's preset with the stagger step. Grids and rails use it by default.

### 6.3 Continuous and scroll-linked motion

| Effect | Rules |
|---|---|
| **Marquee** | Speed about 40 px/s, the direction follows the page direction (RTL moves the other way), pauses on hover and on focus, at most one per page, content duplicated with `aria-hidden` on the copy. Without the script or with reduced motion it is a static row that wraps. **Gap** G10. |
| **Count up** | Numbers in the `statistics` kind count from 0 to their value over 1.2 s, once. The real number is in the HTML first; the script only animates it. |
| **Parallax** | Only on a background image of a full-bleed section, at most 40 px of movement, at most 2 per page, never on mobile. Uses `animation-timeline: view()` where the browser supports it and does nothing elsewhere. |
| **Sticky reveal** | Not in templates. |

### 6.4 Rules that always apply

- **Content is visible by default.** Elements are hidden before their entrance only when the root carries the `sf-anim` class, which the motion script adds. No script → no hiding.
- **Reduced motion:** with `prefers-reduced-motion: reduce`, entrances, marquee, parallax and count-up are off; hover colour changes stay.
- **The hero is never hidden.** Its heading and image are the largest content on screen (LCP); they may only use a transform-only intro (for example the image settles from 104 % to 100 %), never start at opacity 0.
- **No layout shift:** animate `opacity`, `transform` and `clip-path` only. Never width, height, margin or top/left.
- **Once only:** entrances do not replay when scrolling back up.
- **Never animated:** header, bottom navigation, footer, announcement bar, product buy box and price, cart, checkout, forms and their inputs, popups (they have their own simple open fade).
- **Editor:** no entrance motion in the editing canvas (selection outlines must not move). Preview mode and the published site show it.
- **Budget:** at most one `wipe`, one `words` heading, one marquee and two parallax images per page.

### 6.5 Hover and press

- Buttons: background or border colour change in 200 ms; an arrow icon in a button may nudge 4 px towards the end edge.
- Text links: the underline grows from the start edge.
- Cards: `lift` (move up 4 px + slightly stronger shadow) or `zoom` (image to 105 %), per the template's hover setting.
- Touch screens get no hover-only content: anything shown on hover must also be reachable without it.

### 6.6 Controls in the website builder

- **Theme › Animations**: on/off for the whole site (off removes every entrance, marquee and parallax), and **Hover effect**: none, lift, zoom.
- **Section**: Animation (None / Fade / Rise) as today, plus "Animate items one by one".
- **Element**: an Animation group in the style panel: Inherit (default) / None / Fade / Rise / Reveal image / Wipe, and a delay of 0 to 600 ms. `words` appears only on headings.
- Every control has Arabic and English labels.

### 6.7 How it is built (proposal)

- The style whitelist gets an `animation` group (`{ preset, delay }`) for elements and `stagger` for containers. Values are enums and bounded numbers, like every other style; no CSS text.
- The renderer writes `data-sf-anim="<preset>"` (and `data-sf-delay`, `data-sf-stagger`) on the element, plus fixed keyframes in the page CSS.
- One small platform script (about 1.5 KB, the same idea as `CarouselRuntime`) adds `sf-anim` to the root, then uses one `IntersectionObserver` to add `is-in` to each element as it enters. It also runs the marquee and count-up. It is platform code, not seller code (`CLAUDE.md` rule 9 is unaffected).
- Today's CSS-only section animation (`animation-timeline: view()`, `elements/shell.ts`) is replaced by this, so it also works in Firefox and older Safari.

## 7. Mobile first

- Design at 375 px first, then check 768 and 1280.
- Rails swipe with scroll-snap and show part of the next card, so people know they can swipe.
- Grids drop to 2 columns (products) or 1 column (banners, image with text). Bento layouts stack in reading order.
- Touch targets ≥ 44 px. Text ≥ 14 px (body 16 px).
- Hero text sits over the darker part of the photo or below the photo on phones, never across a busy area.

## 8. Arabic, English and RTL

- Every text in Arabic and English (`L(ar, en)`). Arabic is the default.
- Logical properties only (start/end). Motion that has a direction (wipe, marquee, arrow nudge) follows the page direction.
- Arabic copy is short, warm and Egyptian-friendly; buttons are verbs ("تسوّق الآن", "اكتشف المجموعة").

## 9. Speed and accessibility

- Images below the first screen load lazily; the hero image loads first and is sized for phones.
- No autoplaying video on the home page (`docs/template-rules.md` §6); video sections play only when tapped and show a poster image.
- Contrast ≥ 4.5:1 for text (3:1 for large headings), visible focus on every link and button, alt text on every image, decorative nodes `aria-hidden`.
- Target on a mid-range phone: Lighthouse performance ≥ 80 and accessibility ≥ 95 for a template's home page (Shopify asks theme authors for ≥ 60 and ≥ 90).
- The motion script must not delay first paint (load it after the page is interactive).

## 10. Definition of done for a section design

- [ ] Follows the anatomy (§3) and the limits of its kind (§4).
- [ ] Uses theme tokens only; restyles correctly when the Brand colour, fonts and radius change.
- [ ] Data through data nodes; empty data hides publicly and shows the editor hint.
- [ ] Links only to the allowed targets (`docs/template-rules.md` §5).
- [ ] Motion uses the presets and budget of §6; nothing hidden without the script; reduced motion respected.
- [ ] Checked at 375, 768, 1280 px, in Arabic and English, in light and dark section schemes.
- [ ] Within node and depth limits; snapshot test; id added to `EXPECTED` in `designs/designs.test.tsx`; sanitize test passes.
- [ ] Reaches the DB only through a new insert-only `section:sql` migration.

## 11. Gaps (what needs building)

| Gap | What |
|---|---|
| **G7** | Motion runtime and controls (§6.6, §6.7): `animation` style group, `data-sf-anim` output, the `IntersectionObserver` script, Theme › Animations and Hover effect. Shared with `docs/template-rules.md` G7. |
| **G8** | `reveal-image` and `wipe` presets (keyframes + RTL-aware clip). Part of G7, listed so it can ship second. |
| **G9** | `words` heading reveal: the renderer splits a heading's text into word spans (text stays one editable prop). |
| **G10** | Moving marquee: a `marquee` variant of the `carousel` (or a new `marquee` node) run by the motion script; static fallback. Today's tickers (`promo-ticker`, `features-ticker`) are static. |
| **G11** | Second-photo hover swap on product cards (a `product.image2` bind field). |
| **G12** | Hotspot pins for shop-the-look (`hotspot` node positioned in % over an image, linked to a product). |

## 12. Open questions for the owner

1. Is the motion budget (§6.4) right, or should templates be calmer (only `rise` and `fade`)?
2. Hover effect default for new stores: lift, zoom or none?
3. Should sellers see the Element › Animation group, or only the section setting and the site switch (simpler)?
4. Moving marquee and parallax: build now (G10, parallax) or later?
