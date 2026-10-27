# Storefront template rules

**Status: DRAFT v0.2 (2026-10-25), for owner review. Nothing here is built yet.**
Once approved, `CLAUDE.md` will point here and every template change (new template, new template version, template review) must follow it. It adds to, and never replaces, `CLAUDE.md` rule 17 and the section authoring rules in `docs/superpowers/specs/2026-10-19-tree-sections-design.md` §6. **How each section is made (anatomy, design language, motion) is in [`docs/section-rules.md`](section-rules.md)**; this file says how sections are put together into a template.

v0.2: adds what we learned from Shopify's paid themes (section rhythm, optional visual sections, a richer but still simple scroll motion system). Changed: §2 (up to 10 sections, visual breaks, rhythm), §6 (design language points to the section rules), §6a (motion), §7, §9, §10.

Reference studied: EasyOrders themes (`easyorders.eg/themes`, 8 live demos checked 2026-10-25). Their "+100 themes" are about 4 base layouts reused with different photos per trade. Each demo is simple: a hero, category tiles, 2 to 4 product rails, 1 or 2 offer banners, reviews and a newsletter, plus a strong product page (big Buy now, free-shipping progress bar, a buy bar that stays on screen, reviews, related products). We copy that simplicity, not their designs.

Second reference: Shopify paid themes (`themes.shopify.com`, 7 live demos checked 2026-10-25; details in `docs/section-rules.md` §1). They use more sections (11 to 16), alternate photo-led "visual" sections with product sections, and animate everything gently on scroll. We take their rhythm and motion, and keep EasyOrders' short, sales-first page.

---

## 1. The goal

A new seller picks a template, adds products, and publishes **without editing anything**. Every template must:

- show the seller's own catalog straight away (categories, products, offers, brands) through data nodes;
- have no dead button and no fake link;
- look finished on a 375 px phone first, then tablet and desktop;
- stay simple: few sections, clear hierarchy, modern and professional.

## 2. The standard home page

Every template's home page uses this order. "Required" sections must be present; a data section with nothing to show hides itself publicly (tree-sections rule 7), so a store without brands or offers still looks complete.

| # | Section | Required | Content | Data and links |
|---|---|---|---|---|
| 0 | **Header** (chrome) | Yes | See §4.1 | |
| 1 | **Hero carousel** | Yes | 2 or 3 slides, directly under the header. Each slide: one photo, one short headline (≤ 6 words), one optional subline, **one** button. | `hero-carousel` or `hero-carousel-images`. Buttons go to real catalog URLs (§5). Autoplay on, 5 s, dots visible, swipe on mobile. |
| 2 | **Categories** | Yes | Section title + category tiles or circles with name (and image when there is one). | `categoryList` data node. Each tile links to `/products?category=<key>`. "View all" goes to `/products`. |
| 3 | **Products: best sellers** | Yes | Title + 4 to 8 products + "View all". | `productList` source `best-sellers`. "View all" goes to `/products?sort=popularity`. |
| 4 | ~~**Offers**~~ | **No (owner, 2026-10-27)** | Templates carry no promotions or discounts: a seller may publish a template unedited, and the store must never promise a sale, coupon or amount off it doesn't give. No promotion or bundle section, no discount-only design (`newsletter-coupon`, `newsletter-sticker`, `popup-reward`), no coupon code or "% off" in template copy (`packages/store-sections/src/templates/no-discounts.ts`, checked by `no-discounts.test.ts`). The designs stay in the library for a seller to add on purpose. Product cards keep their discount badge, bound to the product's own compare-at price. | |
| 5 | **Products: new arrivals** | Yes | Title + 4 to 8 products + "View all". | `productList` source `newest`. "View all" goes to `/products?sort=newest`. |
| 6 | **Brands** | Yes (hides when the store has no brands) | Title + brand logos or names in one row or rail. | Brand data node (gap G3). Each brand links to its catalog filter. |
| 7 | **Trust strip** | Optional | 3 or 4 icons with a short line: delivery, cash on delivery, returns, support. | Static text; the seller edits it. |
| 8 | **Reviews or newsletter** | Optional, at most one | | Newsletter uses the existing store form. |
| 9 | **Footer** (chrome) | Yes | See §4.3 | |

**Visual breaks (optional, Shopify-style).** A template may add up to **two** of these between the standard sections, so the page alternates photos and products: a **banner grid** (2 to 4 photo cards linking to catalog URLs), **image with text** (the brand story), a **marquee band** (3 to 6 short phrases), **shop the look** (one photo + 2 to 4 products), **numbers** (3 or 4 counters). Each is defined in `docs/section-rules.md` §4.

Limits:

- **At most 10 sections** between header and footer (the standard ones plus at most two visual breaks). Most templates should use 7 to 9.
- **Rhythm**: two product sections never sit next to each other without a visual break or a change of section scheme between them; the section schemes alternate (`default`, `muted`, `default`…) and never three `dark` sections in a row.
- Product rails show **4 products on desktop, 2 on mobile** (a grid or a swipeable rail), never more than 8.
- Do **not** add these to a template home page: before/after sliders, video playlists, popups, loyalty, product finders, long text blocks. They stay in the section library so a seller can add them. (Tabbed product lists may replace the best-sellers or new-arrivals rail; bento layouts are allowed inside a banner grid or hero.)
- A template can change the **look** of each standard section (layout, cards, colours, corners, fonts), but not the order or the purpose.

## 2a. Section order (every template, owner 2026-10-27)

One rule for all templates; the sequence after the categories is chosen per template, never copied from one universal list. Checked by `templates/section-order.test.ts`.

1. **Hero first**, directly under the header, and only one hero. Nothing sits above it (no delivery bar, trust strip or coupon box; those go lower or into the announcement bar).
2. **Categories second**, so a visitor can jump to what they came for.
3. **Then the trade's own journey**: put what that buyer decides on first. Fashion and beauty lead with new arrivals and looks; electronics and auto with best sellers, specs or a comparison; food with what's fresh and delivery areas; jewelry and furniture with featured pieces, then craft or story; services lead with prices or booking.
4. **Trust at the moment of doubt**: reviews, guarantees, payment and delivery info come after the products they support, not before them.
5. **No repeats**: two sections that do the same job (two trust strips, two FAQs, two story blocks) become one; drop sections that add length without helping someone buy.
6. **Short**: at most 9 sections between header and footer; end with a light closing section (reviews, FAQ or newsletter) and then the footer.
7. Keep each template's identity (look, copy, photos, fonts), its links and its responsive behaviour; only the order and the weak or repeated sections change.

## 3. Other pages

- **Product page**: every template has one (`store_pages.kind = 'product'`). Order: gallery, title, price with compare-at price and discount badge, variants, quantity, **Add to cart** and **Buy now** (Buy now the more prominent), short shipping/returns note, description, reviews, related products. On phones the buy bar stays on screen (see §4.2 for how it works with the bottom navigation).
- **About, Contact, FAQ, Privacy, Terms**: the shared `_pages.ts` builders, styled to the template. Each one short, with real starter text the seller can keep.
- **System pages** (catalog, cart, checkout, sign in, profile, wishlist, orders, shipping, returns, blog) come from the platform. A template only links to them.

## 4. Chrome (header, mobile bottom navigation, footer)

### 4.1 Header

- Desktop: logo or store name (role `storeName` / `logo`), menu of at most 6 links, search, wishlist (optional), account, cart with a live count.
- Mobile: **always a burger icon** that opens a sheet or dropdown with every menu link (owner, 2026-10-27; `docs/section-rules.md` §5.6), then logo and cart with count. Search and account may move to the bottom navigation when it is on, but the burger stays.
- An announcement bar is optional: one line, for example free shipping or delivery time. No more than one message scrolling.
- Sticky header on every store, thin (≤ 64 px on mobile). It slides up out of view on scroll down and back in on scroll up (owner, 2026-10-27; `docs/section-rules.md` §5.6). The burger opens a sheet by default.

### 4.2 Mobile bottom navigation

**Built (owner, 2026-10-27):** on by default for every template and store; the seller turns it off in the builder (Header › options › "Bottom navigation on phones", stored as `bottomNav: false` on the header). `render/bottom-nav.tsx` (`SiteBottomNav`, `bottomNavOn`) and `render/bottom-nav-runtime.client.tsx`; drawn by the storefront shell, the template preview, the builder canvas and its preview, after the footer. Phones only (< 768 px), never tablet or desktop.

- **4 items, in this order** (start to end, so it mirrors in RTL), each an icon with its name under it: Home `/`, Shop `/products`, Cart `/cart` with a live count badge, Profile `/profile`. (Search stays in the header.)
- Icon plus a short label in both languages; the current page is highlighted in the brand colour.
- Uses theme tokens (background, foreground, primary), a top border or soft shadow, height 56 to 64 px plus `env(safe-area-inset-bottom)`. Touch targets ≥ 44 px.
- Hidden on checkout and on every product page (the renderer marks product page parts with `data-sf-product-page`), where the product buy bar (Add to cart / Buy now) takes the bottom edge, so the two never stack.
- When it is on, the floating cart bar (`MobileCartBar`) is not shown: the cart badge in the bottom navigation does that job.
- The page gets bottom padding equal to the bar's height so nothing is covered.

### 4.3 Footer

- Logo or store name and a one-line description.
- 2 or 3 link columns: **Shop** (all products, new arrivals, offers, categories), **Help** (contact, FAQ, shipping, returns, track order), **Policies** (privacy, terms).
- Social icons (from the store's contact data) and payment method **logos** (only the methods the store's checkout offers).
- **On mobile** (owner, 2026-10-27; `docs/section-rules.md` §5.7), top to bottom: the link columns as dropdowns, **collapsed by default**; then, each centred on its own line, social icons, `© <year> <store name>. All rights reserved.`, Powered by Tallaby, and the payment logos.
- Bottom line: `© <year> <store name>` and **"Powered by Tallaby" / «مدعوم من طلبي»** linking to tallaby.com.
- The line is drawn at render time in **every** footer (`drawChrome`, owner 2026-10-26): «مدعوم من **طلبي**» / "Powered by **Tallaby**" beside the copyright line, "Tallaby" underlined and linking to tallaby.com. It is never saved, so a seller cannot remove it in the builder; a Powered by link a footer tree carries itself is dropped so it never shows twice. The floating "By Tallaby" badge is gone.

## 5. Links and functions

Every button, card and link must do something real. Only these targets are allowed in a template:

| Target | URL |
|---|---|
| Home | `/` |
| All products | `/products` |
| Category | `/products?category=<key>` (from the `categoryList` node, never typed by hand) |
| Search | `/products?search=<text>` |
| Sort | `/products?sort=newest`, `popularity`, `rating`, `price-low`, `price-high` |
| Offers | gap G4 (no catalog filter for discounted products yet) |
| Brand | gap G3 (no brand filter yet) |
| Product | from the `productList` node, never typed by hand |
| Cart, account, wishlist, orders | `/cart`, `/profile`, `/profile/wishlist`, `/profile/orders` |
| Pages | `/about`, `/contact`, `/faq`, `/privacy`, `/terms`, `/shipping`, `/returns`, `/blog` |
| Outside | Social and WhatsApp links from the store's contact data only |

Rules:

- No `#`, no empty link, no link to a page the template does not have.
- Hero and banner buttons link to the catalog (filtered or sorted), never to a demo product.
- Product cards always have Add to cart (or "Choose options" when the product has variants) and open the product page.
- Text uses the Arabic default plus English; RTL-safe styles only (start/end).

## 6. Design quality

The full design language (direction, spacing and type, layout, responsive rules, surfaces, product cards, images) is `docs/section-rules.md` §5. In short:

- **Simple, Shopify-style**: large photos, generous white space, one heading, one subtext line and one or two buttons per section; no decorative clutter, nested cards or gradient backgrounds. The premium feel comes from spacing, type and photos, not effects.
- **Width**: hero, banner, image with text, slideshow and video are full width; everything else is contained.
- **Consistent**: one font pair (heading and body), one corner radius, one accent colour, all as design-system tokens so the seller can restyle everything from Theme.
- **Spacing**: section padding about 96 px desktop / 48 px mobile (target `clamp(48px, 8vw, 112px)`), tighter only for trust strips; the same rhythm across the page.
- **Product card (same across the template)**: image at a fixed ratio (1:1 or 3:4), title on at most 2 lines, price + compare-at price, discount badge, Add to cart. No extra clutter.
- **Photos**: real, sharp photos that match the trade, the same style and crop across the template, checked by eye; no watermarks, no logos.
- **Copy**: short, warm Arabic (Egyptian-friendly) with a matching English version; buttons are verbs ("تسوّق الآن", "شوف العروض").
- **Accessibility**: text contrast at least 4.5:1, alt text on every image, visible focus.
- **Speed**: hero images sized for mobile, at most 3 slides, no autoplaying video on the home page.
- Checked at 390, 768, 1024, 1280 and 1440 px, in Arabic and English, before a template ships.

## 6a. Scroll animations

Simple, calm, **on by default** and the same everywhere. The full system (tokens, variants, builder controls, how it is built) is `docs/section-rules.md` §6. For templates:

- Every home section except the hero **fades up once** as it enters the screen (700 ms, 24 px), its cards **one by one** (80 ms stagger, at most 6 steps).
- Photos in banners, image with text and galleries **zoom in** slightly (1.06 → 1) inside their frame.
- The hero shows at once: its heading is never hidden and its photo may only use a transform-only zoom, because it is the largest content on screen.
- Product card photos zoom to 104 % on hover; buttons change colour or lift 2 px.
- No marquee, word reveal, wipe or parallax in v0.2 of the section rules.

**Always**

- Each element animates **once**, the first time it comes into view.
- Content is **visible without the script**, and with *reduce motion* on nothing moves.
- Only `opacity` and `transform` animate, so the layout never jumps.
- No reveal animation: header (it only hides and shows on scroll), bottom navigation, footer, announcement bar, product buy box, cart, checkout, forms.
- No entrance motion in the editor canvas; the builder's preview mode and the live site show it.

**In the website builder**

- **Theme › Animations**: on (default) / off for the whole site, and **Hover effect** (zoom, none).
- **Section**: an Animation switch, on (default) / off, replacing today's None / Fade / Rise.
- **Element** (advanced): Reveal = Auto / Fade up / Fade / Zoom in / Slide in / None.

**How**: today's section animation is CSS-only (`animation-timeline: view()`, `elements/shell.ts`) and off unless chosen. It is replaced by one small platform script using `IntersectionObserver` (`docs/section-rules.md` §6.7).

## 7. Checks (to be automated)

A `template-rules.test.ts` in `packages/store-sections` will check every template that follows these rules:

1. The home page has the required sections, in order (§2), and at most 8 sections.
2. The first section is a hero carousel.
3. The header has a cart (with count), search and account; the footer has the Powered by link.
4. Bottom navigation is set as decided for that template (§8).
5. Every `href` in the tree is in the allowed list (§5).
6. The template has a product page with Add to cart and Buy now.
7. Tier A: every home section except the hero has its animation on; header and footer have none; the hero's heading is never hidden (`docs/section-rules.md` §6.4).
8. At most 10 home sections, at most two visual breaks, and no two product sections next to each other without a break or a scheme change (§2).
9. Every section in the template passes the section checklist (`docs/section-rules.md` §10).
10. The existing rules still pass: node limits, snapshots, sanitize test.

Manual checks (logged in `PLAN.md` §23): the template applied to an empty store and a full store, on a phone and a desktop.

## 8. Which templates

Proposal:

- **Tier A (follow every rule, bottom navigation on)**: Tallaby Classic plus 2 or 3 templates per trade (fashion, beauty, electronics, home, food, kids, jewelry, sports, automotive, pets). About 25 templates. These are the ones the gallery shows first.
- **Tier B (the rest)**: kept as they are for now, and brought up to the rules one trade at a time.

Changing Tallaby Classic's design needs the owner's approval (`CLAUDE.md` rule 12). Treat approving this file as that approval for the changes listed here.

## 9. What needs building first (gaps)

| Gap | What | Notes |
|---|---|---|
| **G1** | Mobile bottom navigation | **Built 2026-10-27** (§4.2). A chrome setting (on/off, per template and per store) plus its renderer in the storefront shell; hides `MobileCartBar` when on; editor switch under the header settings. |
| **G2** | Powered by Tallaby in the footer | Done (2026-10-26): `drawChrome` adds it to every footer; the badge is removed. |
| **G3** | Brands section | A `brandList` data node from the seller's brands (`seller_product_brands`, 0068) and a `?brand=` filter on the store catalog. Brand designs are static wordmarks today. |
| **G4** | Offers link | A `?sale=1` (discounted only) filter on the store catalog so offer buttons and "View all" have a real target. The `discounted` product list source already exists. |
| **G5** | Rules test | §7. |
| **G7** | Animations | **Built 2026-10-27** (`docs/section-rules.md` §6.7, §11). Site on/off switch and Hover effect in Theme; the section Animation switch (on by default) replacing today's None / Fade / Rise (`elements/shell.ts`, `section-shell.client.tsx`); the `data-reveal` output and the small `IntersectionObserver` runtime so it works on every browser (§6a, `docs/section-rules.md` §6.7). |
| **G8–G19** | Section gaps | G8, G13, G14 (render-time fallback), G15, G17 and G19 **built 2026-10-27**; G16 and G18 still open. Zoom-in and slide-in variants, moving marquee (later), second-photo hover (later), hotspot pins (later), layout tokens (padding, heading size, container), tablet columns, mobile swipe rows, theme radius, hover transitions, section head gap, no letter-spacing on Arabic. Defined in `docs/section-rules.md` §11; a template can ship without them and add them in a later version. |
| **G6** | Template updates | New template versions through insert-only migrations (staging first, then production with owner approval). Existing stores keep their site; only new picks and "Use template" get the new version. |

## 10. Open questions for the owner

1. Bottom navigation: on for every Tier A template, or let the seller switch it on and off?
2. ~~Can a seller remove "Powered by Tallaby"?~~ No, it is always there (owner, 2026-10-26).
3. Five bottom navigation items (Home, Shop, Search, Cart, Account), or four (drop Home or Search)?
4. Brands: required in the standard home (hidden when empty), or optional?
5. Tier A list: which templates per trade?
6. Animations: on by default for Tier A templates and for a new store's starting site, or off until the seller turns it on?
7. Should existing published stores get the site-wide animation switch turned on? (Proposal: no; it only changes on their next template change or by their own choice.)
8. Up to 10 home sections with two visual breaks (Shopify-style), or stay at 8 (EasyOrders-style)?
9. The signature effect per template (words, wipe or marquee): our choice per template, or always marquee?
