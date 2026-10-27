# Storefront section rules

**Status: v0.3 (2026-10-27).** v0.3 builds the renderer side (owner, 2026-10-27, for every store, published ones included): reveal on scroll with the motion runtime (G7, G8), hover easing and photo zoom (G17), the layout tokens (G13), tablet columns (G14), mobile swipe rows (G15) and no letter-spacing on Arabic (G19), plus five new full-width designs and the §9 heading, shadow and width fixes; see §11 and §12. v0.2 replaced the v0.1 direction (2026-10-25) with a simpler Shopify-style rulebook (Dawn, Sense, Prestige): simple structure, large photos, generous white space, one heading, one call to action, and motion on by default. §9 audits the 272 code designs against it, and §11 lists what has to be built.

These rules apply to every section design (`packages/store-sections/src/designs/<category>/<id>.ts`) and to every section a template uses. They add to, and never replace, `CLAUDE.md` rule 17 and the authoring rules in `docs/superpowers/specs/2026-10-19-tree-sections-design.md` §6. `docs/template-rules.md` says how sections are put together into a template; this file says how each section is made.

**How to read the numbers.** Designs never write CSS. Every value below is a style-whitelist value (`elements/style.ts`), a shell value (`elements/shell.ts`) or a theme token (`--sf-*`, `core/theme.ts`). Where a rule gives a CSS target such as `clamp(…)` that the whitelist cannot express yet, the rule says which value to use today and §11 names the gap.

---

## 1. What we learned from Shopify

Seven paid-theme demos (Adam, Attitude, Azimuth, Blum, Metropolitan, Veloza, Voltix) and the free reference themes (Dawn, Sense) were studied on 2026-10-25. We learn their structure, rhythm and motion. We never copy their layouts, copy or photos.

- **One job per section**: a slideshow, a product grid, a banner, image with text, testimonials, a blog row. Home pages use 10 to 16 of them.
- **Rhythm**: a visual section (full-width photo, banner) alternates with a shopping section (product grid, collection tiles).
- **The premium feel comes from spacing, type scale and photo quality**, not from effects, gradients or decoration.
- **Motion is simple and always on**: sections fade up once as they enter the screen, cards one after another, and images zoom in slightly on hover. Dawn exposes only two site settings: *Reveal sections on scroll* and *Hover effect*.

## 2. Shopify ideas mapped to Tallaby

| Shopify | Tallaby |
|---|---|
| Section file + `{% schema %}` | A design (`defineDesign`), inserted as a `custom-section` with one `section` root |
| Blocks inside a section | Child nodes (cards, slides, buttons) |
| Presets ("Add section") | The library entry (`library_sections`) |
| Color schemes | Section shell `scheme` (`default`, `muted`, `primary`, `dark`) |
| Section groups (header, footer) | Chrome (header, footer, bottom navigation) |
| `max_blocks` | Node limits (≤ 400 nodes, depth ≤ 12) and the limits in §4 |
| Theme settings: animations, hover effect | Theme › Animations (§6.6) |

## 3. Anatomy of every section

Every section is built from the same parts, in this order. Parts in brackets are optional.

1. **Root** `section`: shell scheme, vertical padding, width, animation.
2. **Container**: the content width. Full-width sections (§5.1) skip it or set the shell width to `full`.
3. **(Head)**: a `stack` labelled "Heading" holding an optional eyebrow (≤ 3 words), the `heading` (h2, ≤ 8 words) and an optional one-line `paragraph`. On product, category and blog sections, a "View all" link sits at the end of the row on desktop and under the heading on mobile.
4. **Body**: the grid, list, slides, cards or media.
5. **(Foot)**: one button, centred, only when the head has no "View all".

Rules:

- **One heading, one subtext line, one or two buttons per section.** If a section needs two headings, make it two sections. At most one button is solid (`solid`); the second is `outline` or a text link.
- **Heading levels**: the hero heading is the page's only `h1`; section headings are `h2`; card titles are `h3`. A product page's title is that page's `h1` (`product-main`).
- **No clutter**: no nested cards, no gradient backgrounds, no left-border accent boxes, no decorative circles, stickers or shapes. The only gradient allowed is `ink-fade` over a photo, to make text on it readable.
- Every container node has an Arabic and English label that says what it is ("Heading", "Slides", "Card", "Photo").
- The same section kind looks the same across a template: one head layout, one card style, one button style.

## 4. Section kinds and their limits

| Kind | Library category | Width | Content limits |
|---|---|---|---|
| **Hero / slideshow** | `hero` | Full | 1 to 3 slides. Headline ≤ 6 words, subline ≤ 15 words, 1 or 2 buttons. First section only. |
| **Banner** | `promotions` | Full | 1 photo, heading ≤ 6 words, 1 button |
| **Image with text** | `image-text` | Full | 1 photo, eyebrow, heading, ≤ 40 words, 1 button. Photo side alternates when a page has two. |
| **Video** | `video` | Full | 1 video with a poster photo, plays only when tapped |
| **Product grid** | `products` | Contained | 4 to 8 products, always a `productList` node, head with "View all" |
| **Tabbed products** | `products` (`products-tabbed`) | Contained | 2 to 4 tabs, 4 to 8 products each |
| **Collection tiles** | `categories` | Contained | 3 to 8 tiles, a `categoryList` node |
| **Banner grid** | `promotions`, `gallery` | Contained | 2 to 4 photo cards, ≤ 4 words and one link each |
| **Shop the look** | `gallery` (`gallery-shoppable`) | Contained | 1 photo + 2 to 4 linked products |
| **Featured product** | `products` (`products-feature`) | Contained | 1 product from product data, never a typed product |
| **Trust strip** | `features` | Contained | 3 or 4 icons, ≤ 6 words each |
| **Testimonials** | `testimonials` | Contained | 3 to 6 quotes, ≤ 30 words each |
| **Numbers** | `statistics` | Contained | 3 or 4 numbers with a short label |
| **Brands** | `brands` | Contained | 4 to 12 logos; hides when empty |
| **Blog** | `blog` | Contained | 3 posts, a `postList` node; hides when empty |
| **Rich text** | `rich-text` | Contained | Heading + ≤ 120 words, text ≤ 720 px wide |
| **Newsletter** | `newsletter` | Contained | Heading, 1 line, the bound store form |
| **FAQ** | `faq` | Contained | 4 to 8 questions (native `<details>`) |

The other categories (bundles, finder, payment, services, about, contact, tracking, loyalty, page header) follow the same anatomy and the **contained** width.

## 5. Design language

### 5.1 Direction

- Simple beats complex. Large photos, generous white space, one clear heading, one call to action.
- **Full width (edge to edge)**: hero, banner, image with text, slideshow, video. The photo or video reaches the screen edges, and the text sits inside the container width.
- **Contained**: product grids, collections, text, testimonials and everything else. Today's container is `max-width: var(--sf-max-width, 1200px)` with 16 px / 32 px side padding. **Target: `1280px` and `clamp(16px, 4vw, 48px)` (gap G13).**
- Theme tokens only: colours as token names (`primary`, `foreground`, `muted`, `background`, `secondary`, `border`), fonts as `heading` / `body`. Never a fixed hex colour, except `white` text on a photo.
- Logical properties only (start/end). Touch targets ≥ 44 px.
- Alternate shell schemes (`default`, then `muted`, then `default`) so the page reads as clear bands. Never two `dark` sections in a row.

### 5.2 Spacing and type

| What | Target | Use today |
|---|---|---|
| Section vertical padding | One fluid token, `--sf-section-y` = `clamp(56px, 4.5vw, 64px)` (`SECTION_FLUID_PADDING`, owner 2026-10-27: less gap between sections) | Root `paddingTop`/`paddingBottom` **64**, mobile **40** (no tablet value); the renderer scales them by the token (64 → about 58 px at 1280 px, 40 → 35 px on a phone) and counts at most **80** (1.25 ×). Trust strips and marquees may use 48 / 32. Never `margin` on the root or its first and last child. |
| Section heading (h2) | `clamp(28px, 4vw, 56px)`, line-height 1.15 | `fontSize: "display-md"` with `3xl` on phones, `lineHeight: "tight"` (the closest today; the About designs use it). G13 then gives it one token |
| Hero heading (h1) | `clamp(40px, 6vw, 60px)`, line-height 1.15 | `display-lg`, `lineHeight: "tight"` |
| Body text | 16 to 18 px, line-height 1.7 | `fontSize` `md` or `lg`, `lineHeight: "relaxed"` (1.75), `maxWidth` 640 px |
| Space between items | Parent `gap` | `gap` on the parent `stack` / `row` / `grid` (8 / 16 / 24 / 32 / 48). **Never `marginTop`/`marginBottom` on children.** |

- **Arabic**: no uppercase, no letter-spacing on Arabic text (letter-spacing breaks the joined letters). Eyebrows that are uppercase and letter-spaced in English stay plain in Arabic.
- One heading font and one body font, both theme tokens.

### 5.3 Layout (flex and grid)

- **Rows of items** use a `grid` (or a data list) with explicit columns **for all three devices**: `columns: { desktop, tablet, mobile }`. A grid with no `tablet` value keeps its desktop columns on an 820 px tablet.
- **Two-column split**: `columns: { desktop: 2, tablet: 2, mobile: 1 }`; it stacks to one column under 768 px.
- **Rows** (`row`, `hFlex`) wrap by default. `wrap: false` only for an icon and its label, a price row, a star row or a row of buttons. Every flex and grid child already gets `min-width: 0` from the renderer.
- **No fixed sizes on boxes that hold text.** Use `maxWidth` (a cap, never `width` in px) and `minHeight`. A px `width` is allowed only on icons, avatars, logos and similar small media.
- **Media**: every image and video has an `aspectRatio` from the fixed list (`square`, `portrait`, `landscape`, `wide`, `banner`, `story`) with `objectFit: "cover"` and `width: "100%"` (the `cover()` helper in `_kit.ts`).
- `position: "absolute"` only for a badge on a card or text over a photo.

### 5.4 Responsive

Our devices are the style breakpoints in `elements/style.ts`: **desktop ≥ 1024 px, tablet 768 to 1023 px, mobile ≤ 767 px.** Design mobile first, and check at **390, 768, 1024, 1280 and 1440 px**.

| Device | Rules |
|---|---|
| Mobile ≤ 767 px | One column (product and category cards: 2). Product and category rows **swipe sideways with scroll snap** and show part of the next card (gap G15). Text is centred or start-aligned. Buttons are full width. |
| Tablet 768 to 1023 px | 2 columns (product cards: 2 or 3). |
| Desktop ≥ 1024 px | 3 or 4 columns (logos: up to 6). |

- No horizontal page scroll at any width.
- Hero text sits over the darker part of the photo or under it on phones, never across a busy area.

### 5.5 Surfaces, product cards and images

- **One corner radius per template**, taken from the theme radius (`--sf-radius`), on cards, images and buttons alike. Today a node's `radius` is a fixed px number, so designs use 15 different values (gap G16).
- Light shadows only (`sm`, `md`) or a thin `border` line. No `lg` shadow on content.
- **Product cards are the same across a template**: a fixed image ratio (`square` or `portrait`), title ≤ 2 lines, price and compare-at price, a discount or "New" badge, Add to cart.
- Photos: real, sharp, the same light and crop across a template, no watermarks, no people or body parts in template photos.

### 5.6 Header (navbar)

The header is on every page and is most of what a phone visitor sees first, so it gets the most care. Library category `headers`; drawn by the chrome (`docs/template-rules.md` §4.1). It has no reveal animation; its only motion is the hide/show on scroll and the sheet below.

**Layout by device**

| Device | Layout |
|---|---|
| Mobile ≤ 767 px | **One row, 56 to 64 px high**: **burger icon** (start), logo (start or centre), search and cart (end). The burger opens a **sheet** that slides in from the start side (RTL-aware). The sheet is the default (owner, 2026-10-27); a full-width **dropdown** under the header is the only alternative a design may choose. The menu links are never shown inline. Nothing wraps to a second line. |
| Tablet 768 to 1023 px | Same as mobile (burger), or logo + menu + tools when the menu fits on one line. |
| Desktop ≥ 1024 px | One row, 64 to 80 px high: logo, menu (≤ 7 links, one line, never wraps), tools (search, account, language, cart). An announcement bar above it is optional. |

**Rules**

- **Every header always has a burger icon on mobile (≤ 767 px)** that opens a sheet or a dropdown with every menu link, in every design, with no exceptions. Hiding the menu with no burger, or wrapping the links into a second row, is not allowed. The bottom navigation (`docs/template-rules.md` G1) adds to the burger and never replaces it. A header with no menu of its own (category chips only) still gets the burger, holding the store's pages.
- **Burger button**: 44 × 44 px at the start of the row, with an accessible name ("القائمة" / "Menu"), `aria-expanded` and `aria-controls`. It turns into a close icon while open.
- **Sheet or dropdown** (the design picks one): all menu links (44 px rows), account, language switch and contact. It closes with Esc, the close button, a tap outside or a link tap. Focus stays inside while it is open, page scroll is locked for a sheet, and focus returns to the burger on close. The sheet slides in and the dropdown fades down over 200 ms, with no motion under reduced motion.
- **Tools**: search, account and cart are 44 × 44 px icon buttons with an accessible name. The cart shows the live count (the renderer adds it to a cart link with an icon). Search opens a full-width field on mobile.
- **Logo**: the seller's logo image is at most 40 px high on mobile and 48 px on desktop, keeps its proportions, and falls back to the store name. It links home.
- **Sticky, hides on scroll down, shows on scroll up** (owner, 2026-10-27; on for every store):
  - The header is `position: sticky; top: 0` with a solid background, and gets a thin `border` line once the page has scrolled.
  - Scrolling **down** past the header's height slides it **up out of view** (`transform: translateY(-100%)`, 250 ms, the motion easing). Scrolling **up** by at least 8 px slides it **back in** the same way. Small jitters under 8 px change nothing.
  - It is always shown at the top of the page, while the burger sheet, search or a dropdown is open, and while keyboard focus is inside the header.
  - Only `transform` moves, so the page never jumps. With reduced motion the header stays visible and doesn't slide.
  - The announcement bar is not sticky and scrolls away with the page. The mobile bottom navigation and the product buy bar are not affected.
- **Spacing**: no vertical padding on the header root on phones (enforced by `flushHeaderOnMobile`, `config/header.ts`). Side padding follows the container gutter.
- **Language switch**: added by the renderer when the store has two languages (`config/header.ts`); designs leave room for it before the cart.
- Theme tokens only. The current page's link is marked (colour or underline) and has `aria-current="page"`.

### 5.7 Footer

Library category `footers`; drawn by the chrome (`docs/template-rules.md` §4.3). It never animates.

**Layout by device**

| Device | Layout |
|---|---|
| Desktop ≥ 1024 px | Brand column (logo, one line, social icons) + 2 to 4 link columns + an optional newsletter or contact column, then a **bottom bar**: copyright (start), payment logos, Powered by Tallaby (end). |
| Tablet 768 to 1023 px | 2 columns; the bottom bar wraps to two lines. |
| Mobile ≤ 767 px | One column, in this order (owner, 2026-10-27): **1.** each link column as a **dropdown, collapsed by default**; **2.** social media icons, **centred**; **3.** "© 2026 [store name]. All rights reserved.", **centred**; **4.** Powered by Tallaby, **centred**; **5.** payment method logos, **centred**. |

**Rules**

- **Mobile link dropdowns**: every link column (Shop, Help, Policies…) is a native `<details>`, **closed by default**. The title row is 44 px high with a chevron at the end that turns when open, and a thin `border` line separates the rows. Opening one doesn't close the others. On tablet and desktop the columns are always open, with no chevron.
- **Mobile bottom block**: social icons, copyright, Powered by and payment logos are each centred on their own line (`justifyContent: center`, `textAlign: center`), 16 px apart. The brand line and logo may sit above the dropdowns, also centred.
- **Copyright**: "© {year} {store name}. All rights reserved." / "© {year} {اسم المتجر}. كل الحقوق محفوظة." The renderer fills in the current year and the store's name; designs never type a fixed year or a demo name.
- Link text ≥ 14 px with 44 px tap rows on mobile; column titles are `h4`-sized but not `h2`.
- Social icons are 40 to 44 px buttons with an accessible name. Phone, email, WhatsApp and address come from the store's contact settings (the renderer swaps the demo values).
- On mobile the footer's bottom padding leaves room for the mobile cart bar or the bottom navigation, plus `env(safe-area-inset-bottom)`.
- Powered by Tallaby is always there and is added by the chrome (`drawChrome`); designs don't author it.
- Theme tokens only; a `dark` or `primary` footer scheme is fine, and the logos below stay readable on it.

**Payment methods are logos, not text.**

- The payments row (`role: "payments"`) shows **one logo image per method**, never a text chip.
- It shows only the methods the store's checkout really offers (Store settings › Payment methods: `cash_on_delivery`, `instapay`, `vodafone_cash`, `e_cash` today; `storefrontCheckoutMethods` in `packages/lib/src/payments/store-methods.ts`). Card brands (Visa, Mastercard, Meeza, Apple Pay) appear only once card payment is live at checkout; it is "soon" today.
- Logos come from one fixed platform set, never uploaded by sellers: InstaPay, Vodafone Cash and e& Cash use the logos in the payment-methods registry (`store-methods.ts`, `apps/ecommerce/public/payment-method/`); cash on delivery gets a platform-made logo (a cash icon with "عند الاستلام" / "COD"); card logos are in `apps/ecommerce/public/icons/payments/`.
- Every logo has the **same height** (24 px desktop, 22 px mobile, width auto), sits on a small white rounded tile with a thin `border` line so it reads on dark footers, and has alt text with the method's name in the page language. Logos are spaced with `gap: 8` and wrap.
- In the editor, before the store has methods, the row shows the demo logos so the seller sees the design. Publicly, a store with no methods shows no row.

## 6. Motion system

Motion is **on by default**, calm, quick and the same everywhere. It is off when the visitor asks for less motion, and content never depends on it.

### 6.1 Motion tokens

| Token | Value |
|---|---|
| Reveal duration | 700 ms |
| Easing | `cubic-bezier(.2,.7,.2,1)` |
| Rise distance | 24 px |
| Image zoom-in | scale 1.06 → 1 |
| Stagger step | 80 ms, at most 6 steps (item 7 onwards appears with item 6) |
| Start point | `IntersectionObserver` threshold 0.15 |
| Hover, images | scale 1.04 over 600 ms |
| Hover, buttons | colour change or 2 px lift over 200 ms |

### 6.2 Reveal variants (play once, the first time the element comes into view)

| Variant | What it does | Used on |
|---|---|---|
| `fade-up` (default) | opacity 0 → 1, `translateY(24px)` → 0 | Section heads, cards, buttons, text |
| `fade` | opacity 0 → 1 | Logos, small text, rows inside a strip |
| `zoom-in` | the image scales 1.1 → 1 and unmasks from a 6% inset (`clip-path`) inside its frame, with a fade (2026-10-27, from the Claude Design premium motion) | Photos in banners, image with text, galleries |
| `slide-start` | opacity 0 → 1, moves in 24 px from the start edge (RTL-aware) | The text column of a split section |
| `none` | no motion | Chrome, buy box, forms, cart |

The renderer picks the variant from the node, so a seller doesn't have to: a section's head and body items get `fade-up`, a grid's or list's items are **staggered**, and an image with `role: "image"` gets `zoom-in`. An element may override it (§6.6).

### 6.3 Continuous motion

- **Marquee** (`marquee` element, built 2026-10-27, G10): its items loop sideways at `speed` seconds per loop (8–120, default 30), two copies of the row with the second `aria-hidden` and `inert`; it pauses on hover, runs the other way on RTL pages, and is a still wrapped row with reduced motion, with Theme › Animations off, and in the editor canvas. Used by `promo-marquee`. The older tickers (`promo-ticker`, `features-ticker`) stay static rows.
- **Countdown** (`countdown` element, built 2026-10-27): days, hours, minutes and seconds left until `endsAt`, a date the seller sets. The server draws the time left and `MotionRuntime` ticks it every second (also with reduced motion). Publicly a countdown with no date or a passed date draws nothing, so a store never shows a fake or expired deadline; designs leave the date empty. Its boxes pop in one after another when revealed. Used by `hero-banner`, `promo-countdown` and `products-deal`.
- No counting numbers, no parallax, no sticky reveal.

### 6.4 Rules that always apply

- **Content is visible by default.** The motion script first adds `sf-motion` to the site root. Only under that class are `[data-reveal]` elements hidden before they enter. No script means nothing is hidden.
- **Reduced motion**: with `prefers-reduced-motion: reduce` there are no transforms, and opacity changes instantly. Hover colour changes stay.
- **The hero is never hidden.** Its `h1` and first photo are the largest content on screen (LCP). The photo may use a transform-only `zoom-in` (no fade), and the heading has no reveal. This is the one exception to "every section animates".
- **No layout shift**: animate `opacity` and `transform` only.
- **Once only**: elements are not hidden again when the visitor scrolls back up.
- **No reveal animation**: header (it only hides and shows on scroll, §5.6), bottom navigation, footer, announcement bar, product buy box and price, cart, checkout, forms and their inputs, popups (they keep their own open fade).
- **Editor**: no reveal motion in the editing canvas (selection outlines must not move). Preview mode and the live site show it.
- No bounce, spin, shake, or effects that run for the whole page.

### 6.5 Hover and press

- Photos inside a card or link: scale 1.04 over 600 ms, clipped by their frame (`overflow: hidden`).
- Buttons: background or border colour change, or a 2 px lift, over 200 ms. No scale.
- Text links: underline or colour change.
- Hover changes **ease** over the times above. Today a style `hover` switches instantly because the renderer writes no `transition` (gap G17).
- Touch screens get no hover-only content.

### 6.6 Controls in the website builder

- **Theme › Animations**: on (default) / off for the whole site, and **Hover effect**: zoom (default) / none.
- **Section**: an **Animation** switch, on (default) / off. It replaces today's None / Fade / Rise select (`SHELL_ANIMATIONS`). Stored values map as `rise` → on, `fade` → on, `none` → off.
- **Element** (advanced): Reveal = Auto (default) / Fade up / Fade / Zoom in / Slide in / None.
- Every control has Arabic and English labels.

### 6.7 How it is built

- The renderer writes `data-reveal="<variant>"` and `data-reveal-delay="<step 0–5>"` on revealable elements of a section whose animation is on, plus fixed keyframes in the page CSS. Values come from enums, never CSS text.
- One small platform script (about 1.5 KB, the same pattern as `CarouselRuntime`) adds `sf-motion` to the root and uses one `IntersectionObserver` (threshold 0.15) to add `is-inview` to each `[data-reveal]` as it enters, then stops watching it. It is platform code, not seller code (`CLAUDE.md` rule 9 is unaffected). It loads after the page is interactive.
- The CSS-only animation in `elements/shell.ts` (`shellAnimationCss`, `animation-timeline: view()`) is removed. It only works in browsers that support view timelines, it is off unless a seller picks it, and only Tallaby Classic turns it on. **Removed 2026-10-27**; Classic no longer sets `rise`.
- **As built (2026-10-27):** `elements/motion.ts` (`MOTION_CSS`, written by `SiteTheme`; `siteMotionAttrs`), `revealOf` in `elements/render.tsx` (a list's or grid's items stagger, a `role: "intro"` head reveals whole, single text and buttons fade up, photos zoom in; never `h1`, carousels, forms, cart buttons or product page parts), `render/motion-runtime.client.tsx` (`MotionRuntime`, mounted beside `CarouselRuntime` on the storefront, the template preview and `SitePreview`; not in the editor canvas). Elements already on screen when it starts lose their `data-reveal` and are never hidden. The header and footer render with `reveal: false`. `ctx.reveal` is set by `StoreSitePage`, `StoreSiteProductGrid`, the template preview and `previewRenderContext`.

## 7. Arabic, English and RTL

- Every text in Arabic and English (`L(ar, en)`). Arabic is the default.
- Long Arabic and English text must wrap without breaking the layout. Test with a heading about twice its normal length.
- Directional motion (`slide-start`, the arrow on a link) follows the page direction.
- Arabic copy is short, warm and Egyptian-friendly; buttons are verbs ("تسوّق الآن", "اكتشف المجموعة").

## 8. Speed and accessibility

- Images below the first screen load lazily; the hero photo loads first and is sized for phones.
- No autoplaying video; video sections play when tapped and show a poster.
- Contrast ≥ 4.5:1 for text (3:1 for large headings), visible focus on every link and button, alt text on every image, decoration `aria-hidden`.
- Target on a mid-range phone: Lighthouse performance ≥ 80 and accessibility ≥ 95 for a template's home page.

## 9. Audit of the current sections (2026-10-27)

All 272 code designs were walked as element trees: 235 content sections plus 37 headers, footers, popups, product-page and cart sections. The DB copies in `library_sections` started from these designs, but admins may have edited them since, so re-check those before changing them.

**Already in line**

| Rule | Result |
|---|---|
| Node and depth limits | Largest design 100 nodes (average 26), deepest 11 levels (limit 12) |
| Media ratios | Every image and video has an `aspectRatio` |
| No nested cards | 0 |
| No gradient backgrounds | Only `hero-carousel` uses one, the allowed `ink-fade` photo overlay |
| Buttons | No section has more than 2 buttons, except `hero-carousel` (one per slide) |
| Container | 232 of 235 have one (the 3 without are photo-only or edge-to-edge) |
| Section head | Most share `sectionHead()` in `_kit.ts`, so one change fixes them together |

**Not in line**

| Rule | What the audit found | How to fix |
|---|---|---|
| Section padding (§5.2) | 199 of 235 use 64 / 40 px, the rest 0 to 96 | Root default 96 / 72 / 48 (registry `section` default plus designs), then G13 |
| Heading size (§5.2) | 143 section `h2` use `display-sm` (28 to 38 px, below the 56 px target); 20 use fixed sizes (`2xl` to `6xl`) | Retune `display-sm` once (G13); move fixed sizes to `display-sm` |
| Tablet columns (§5.3) | **99 sections** have a grid or list of 3 or more columns with no tablet value, so tablets show 3 to 6 columns at 820 px | Add `tablet` columns (G14) |
| Margins instead of gap (§5.2) | 148 sections use `marginTop`/`marginBottom` on 301 child nodes, 56 of them from `sectionHead`'s `marginBottom: 32` | Wrap head and body in a `stack` with `gap`; fix `sectionHead` first (G18) |
| Fixed widths on text boxes (§5.3) | 22 sections (worst: `features-compare` 12, `brands-bubbles` 7, `contact-team` 6, `features-steps` 4, `bundle-list` 4) | Replace px `width` with `maxWidth` or grid columns |
| Mobile swipe rows (§5.4) | Product and category lists are grids on mobile; only the `carousel` element snaps | G15 |
| Full-width visual sections (§5.1) | 30 of 32 hero, image-with-text and video designs sit inside the container as a rounded panel | Redesign each one by hand; not a mechanical fix. New designs follow §5.1 |
| One radius (§5.5) | 15 radius values in use (0 to 32, and 999) | G16 |
| Light shadows (§5.5) | `lg` shadow in 10 sections (`hero-ticket`, `hero-poster`, `hero-product`, `pay-receipt`, `about-overlap`, `about-inset`, `gallery-strip`, `rewards-gift`, `contact-visit`, `text-note`) | Use `md` or a border |
| One `h2` (§3) | 5 sections have two `h2`: `hero-carousel` (one per slide, fine), `promo-coupon`, `faq-classic`, `newsletter-coupon`, `text-policy` | Make the second one `h3` |
| `h1` (§3) | `faq-help` uses an `h1` outside the hero; `hero-big-word` has no `h1` | Swap the levels |
| One solid button (§3) | `promo-pair` has two solid buttons | Make one `outline` |
| Decoration (§3) | Decorative absolute shapes in `hero-classic` (accent circle), `hero-ticket`, `hero-poster`, `promo-sticker`, `newsletter-sticker`, `rewards-gift` | Remove, or keep only if the owner approves (the Classic hero is the default template, `CLAUDE.md` rule 12) |
| Letter-spacing (§5.2) | `wide`/`wider` letter-spacing in 11 sections, which also applies to the Arabic text | Renderer drops letter-spacing on Arabic (G19) |
| Rows that don't wrap (§5.3) | 561 rows set `wrap: false`, most from `arrowLink`, `stars` and `person` in `_kit.ts` (safe) | Review the others at 390 px for long text |
| Header on mobile (§5.6) | 6 of 10 headers (`header-line`, `header-centered`, `header-announcement`, `header-pill`, `header-ruled`, plus the menu-less `header-chips` and `header-brand-bar` that only show categories) **hide the menu on phones with nothing replacing it**: no header has a burger, and there is no sheet or dropdown element yet. `header-classic` and `header-departments` wrap the menu into a second row (6 and 3 links). **No header passes the burger rule today** | G20; then every header gets a new version with the burger |
| Header tools (§5.6) | All 10 have a cart, 9 have search, **none has an account link**; `header-pill` has no search | Add account (and search) to every header |
| Sticky header (§5.6) | No header design is sticky, and the storefront shell doesn't make it sticky | G21 |
| Footer on mobile (§5.7) | Link columns stack open into one long column (`footer-ruled`, `footer-signup`, `footer-help`: 3 → 1); no footer has collapsed dropdowns. The bottom block isn't centred in the required order (social, copyright, Powered by, payment logos), and the copyright is typed text with a fixed year and demo name (`COPYRIGHT` in `designs/footers/_shared.ts`). 4 footer grids have no tablet value | G22, G24, G14 |
| Footer payments (§5.7) | 8 of 10 footers draw payments as **text badges**, and the demo list is VISA, Mastercard, Meeza, InstaPay, Cash on delivery, three of which checkout doesn't offer. Publicly the renderer swaps in the store's real methods (`elements/store-payments.ts`), still as text | G23 |
| Motion (§6) | No library design sets an animation; only Tallaby Classic sets `rise`. Hover styles exist in 93 sections but switch instantly, and no image uses hover zoom | G7, G17 |

## 10. Checklist for every section

A section ships only when all of these pass:

1. Renders correctly at **390 px and 1280 px** (and looks right at 768, 1024 and 1440 px) with no horizontal overflow.
2. Long Arabic and English text wraps without breaking the layout.
3. A missing photo or an empty field still looks intentional. Empty data lists hide publicly and show the editor hint.
4. The reveal fires once on scroll and is off with reduced motion. The hero's heading and photo are never hidden.
5. Uses only theme tokens and logical properties. It restyles correctly when the Brand colour, fonts and radius change.
6. Follows the anatomy (§3), its kind's width and limits (§4) and the layout rules (§5.3): columns set for all three devices, `gap` not margins, no px widths on text boxes.
7. Links only to the allowed targets (`docs/template-rules.md` §5).
   Headers and footers also pass §5.6 and §5.7: the header has a burger icon on mobile that opens a sheet or dropdown with every menu link, the header is one row on mobile, footer link columns are collapsed dropdowns on mobile followed by the centred social icons, copyright, Powered by and payment logos, and payment methods are logos.
8. Within node and depth limits. Snapshot test, id in `EXPECTED` in `designs/designs.test.tsx`, sanitize test and the field-names snapshot (`library-fields.test.ts`) pass.
9. Reaches the DB only through a new insert-only `section:sql` migration. Field names (`props.field`) stay stable so templates don't break.

## 11. Gaps (what needs building)

IDs G7 to G12 are shared with `docs/template-rules.md` §9.

| Gap | What |
|---|---|
| **G7** | **Built 2026-10-27.** Motion runtime and controls (§6.6, §6.7): `data-reveal` output, the `IntersectionObserver` script, the section on/off switch replacing None / Fade / Rise (`shellAnimates`; off stores `animation: "none"`, which `normalizeShell` now keeps), Theme › Animations and Hover effect (`designSystem.motion.reveal` / `hoverZoom`, only `false` is stored; Brand panel › Motion), removal of `shellAnimationCss`. |
| **G8** | **Built 2026-10-27.** `zoom-in` and `slide-start` variants and the element Reveal override (`props.reveal`, an advanced field on content elements). |
| **G9** | ~~`words` heading reveal~~. Dropped in v0.2 (simple over complex). |
| **G10** | **Built 2026-10-27** (`marquee` element, §6.3). |
| **G11** | Second-photo hover swap on product cards (a `product.image2` bind field). Later; v0.2 uses image zoom. |
| **G12** | Hotspot pins for shop the look. Later. |
| **G13** | **Built 2026-10-27 (owner: every store).** Layout tokens: the Brand section spacing default is `SECTION_FLUID_PADDING` = `clamp(64px, 7.5vw, 104px)`, so a design's 64 is about 96 px at 1280 and its mobile 40 stays 40; `display-sm` `clamp(1.75rem, 4vw, 3.5rem)`, `display-md` `clamp(2.25rem, 5vw, 4rem)`, `display-lg` `clamp(2.5rem, 6vw, 4.5rem)`; container `1280px` with `clamp(16px, 4vw, 48px)` gutters (the seller's Container width still wins). Buttons are 48 px high with a 2 px hover lift. |
| **G14** | **Built 2026-10-27 at render time** (`fallbackTabletColumns` in `elements/style.ts`): a grid or data list with 4+ desktop columns and no tablet value gets 3 (lists, or grids of 6+) or 2 (other grids) on tablets, for every store. 3-column rows keep 3. |
| **G15** | **Built 2026-10-27.** Swipe rows on mobile: a `mobileRail` option on `productList` / `categoryList` (horizontal scroll snap, part of the next card visible; never on a paginated list). On in `products-classic`, `products-grid`, `products-rail` and `products-showcase` (new copies only: stores keep their own). |
| **G16** | Radius from the theme: a `radius: "theme"` style value (or radius tokens such as `card` and `pill`) mapped to `--sf-radius`. |
| **G17** | **Built 2026-10-27.** Hover transitions: the renderer adds `transition` (200 ms for colour, 600 ms for scale) to nodes with a `hover` style, off with reduced motion. A clipped link (`overflow: hidden`) holding a photo gets `sf-zoom`: the photo scales to 1.04 on hover (every product card). |
| **G18** | `sectionHead()` without `marginBottom`; head and body inside a `stack` with `gap`. |
| **G19** | **Built 2026-10-27** (`MOTION_CSS`): no letter-spacing or uppercase on any element of an Arabic page; English `h1`/`h2` get `-0.015em`. |
| **G20** | **Built 2026-10-27** (`mobileMenu` node, `drawChrome`, storefront sheet). Mobile burger menu: a burger button shown under 768 px plus a sheet or dropdown (a header setting, `mobileMenu: "sheet" \| "dropdown"`, default `sheet`), drawn by the renderer from the header's `role: "menu"` links (plus account, language and contact), with focus trap, Esc, scroll lock and an RTL slide. Like the language switch, the renderer adds it to every header where the header is drawn, so existing sites get it at once. Then each header design gets a new version that hides its inline menu on mobile. |
| **G21** | **Built 2026-10-27** (`sticky-store-header.client.tsx`; the whole header, announcement bar included, until the bar is split out). Sticky header that hides on scroll down and shows on scroll up (§5.6), for every store. The chrome wraps the header (not the announcement bar) in a sticky element. A small platform script (one passive scroll listener with `requestAnimationFrame`, part of the motion runtime in §6.7) toggles a `data-header-hidden` attribute, and fixed CSS slides it with `transform`. It stays visible at the top of the page, while the sheet is open, while focus is inside, and with reduced motion. |
| **G22** | Footer link dropdowns on mobile: the renderer draws every footer link column (a `role: "linkColumn"` stack: title + links) as a `<details>`, closed by default, under 768 px, and as an open column above it. Like the burger, it is added where the footer is drawn, so every existing footer gets it. |
| **G24** | Mobile footer bottom block: the chrome reorders and centres it on phones (social, copyright, Powered by, payment logos), and the copyright becomes a `role: "copyright"` text that the renderer fills with the current year and the store name. |
| **G23** | Payment logos: the payments row draws each checkout method as a logo image from a fixed platform set (registry logos, a new cash-on-delivery logo, card logos for later). The logos have to be reachable from both the storefront and the dashboard editor, so they move to a shared location (for example `packages/store-sections` assets or a fixed public URL). `elements/store-payments.ts` returns method keys instead of labels, the footer designs replace their text badges with an image stencil, and the demo list becomes the four real methods. |

**Order**: G13 and G17 (renderer only, biggest effect), then G20 and G23 (header and footer are on every page), then G7 + G8, then G14, G15, G18 and the per-section fixes in §9, done category by category in library order. Each design change gets a new version and an insert-only migration, and templates keep working because field names don't change.

## 12. Open questions for the owner

1. ~~G13 for every live store?~~ Yes, one change for every store (owner, 2026-10-27).
2. ~~Motion for published stores?~~ Yes, on for every store; a seller can turn it off for the site or a section (owner, 2026-10-27).
3. ~~Full width~~: keep the 30 panel designs as alternative styles and add new full-width designs (owner, 2026-10-27): `hero-fullbleed`, `about-fullbleed`, `promo-banner-fullbleed`, plus `products-showcase` and `categories-showcase`. Code-only, so no seed migration (`section-seed.test.ts` `CODE_ONLY`).
4. ~~Element Reveal override~~: yes, as an advanced field, plus the section and site switches (owner, 2026-10-27).

**Still open after v0.3:** G16 (theme radius), G18 (head and body `gap`; it changes node structure and the labels templates patch), the decorative shapes in §9 (removing nodes changes field names), `hero-big-word`'s missing `h1` (its big word is a `text` node), category tiles whose photo isn't inside a clipped link (no hover zoom), and a Lighthouse run on a template home page.
5. ~~Burger menu default~~: a sheet (owner, 2026-10-27).
6. ~~Sticky header~~: sticky for every store, hides on scroll down and shows on scroll up (owner, 2026-10-27).
