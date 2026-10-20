# Website builder: store-data integrations

Date: 2026-10-19. Status: audit and proposal for owner review. Related: tree-sections spec
(`docs/superpowers/specs/2026-10-19-tree-sections-design.md` §5.3), `PLAN.md` §23.

Every section design is an element tree (CLAUDE.md rule 17). This document lists every part of the 20 library
categories that should show the store's real data instead of text the design typed, says what exists today, and
proposes one UX pattern per kind of integration.

## 1. What is built (2026-10-19)

- **Data nodes** (`packages/store-sections/src/elements/data.ts`):
  - `productList`: source, category, picks, sort and limit.
  - `categoryList`: chosen categories or all of them, with a limit.
  - `postList`: the blog's newest published posts, with a limit and an offset.
  - `storeForm`: one of the store's forms.
  - `addToCart`: the add-to-cart button of the product a card shows.
- **Repeated card template.** A list repeats its children once per record. Inside, nodes carry `props.bind`:
  - product: `title`, `image`, `href`, `price`, `compareAtPrice`, `discount`, `rating`
  - category: `name`, `image`, `href`, `productCount`
  - post: `title`, `excerpt`, `image`, `href`, `date`

  The seller styles one card and every card follows. The authored text is only the placeholder the editor shows
  when a bound node is moved out of its list.
- **Queries.** They are collected per node id through the existing `collectCatalogQueries`,
  `collectContentQueries` and `collectFormIds`. The storefront and the editor resolve them with no new plumbing.
- **Empty states.**
  - On the storefront: a section whose required list or form is empty is not drawn. A list marked `optional`
    may be empty on its own.
  - In the editor: the empty list shows the existing empty state with its action button, which opens the
    dashboard page in a **new tab**: Add products, Write an article, Create a form, Add categories. When the seller
    comes back to the editor tab, it reloads the store data (focus, visibility and a BroadcastChannel), so the
    new records appear without a page reload.
  - Records exist but none match the list's choice: it says "No products match this choice" instead.
- **Designs on data nodes:**
  - Products: 6, P-a…P-e and Classic.
  - Blog: 5, B-a…B-e.
  - Newsletter: 4, N-a, N-b, N-c and N-e.
  - Footer with sign-up: Z-d.

## 2. Integration map

Legend:
- **Exists**: the data and resolver are there.
- **Gap**: something is missing in the backend or host.
- **Bound**: done.

### 2.1 Site chrome (header and footer, on every page)

| Part | Today in the designs | Should come from | Status | Proposed UX |
|---|---|---|---|---|
| Logo and store name (all headers, footers) | Typed "اسم متجرك" with a letter mark | `stores` logo and display name (`ctx.store.logoUrl`, `name`) | Exists in `RenderContext`; no node yet | **Live by default**: a `storeLogo` node shows the logo, or the name when there is no logo. The Content tab has "Use store logo" (on) and a link "Change in store settings ↗" (new tab) |
| Main menu links (header nav, mobile menu) | Typed list: Home, Shop, Offers… | The site's pages (`ctx.pages`, "show in menu") plus optional categories | Exists (`pages`); no node yet | **`navMenu` node, source = Pages (default) / Categories / Custom links**. Pages come from the Pages panel ("Manage pages" opens the panel, not a new tab). Custom links keep today's typed items |
| Category links in the menu (mega menu, "Shop" dropdown) | Typed | Store categories | Exists (`catalog.categories`) | A `categoryList` inside the menu, template = one link. The seller can pick and order categories; empty shows "Add categories ↗" |
| Search box (header-search) | A link to `/products` drawn as a field | Storefront search | Gap: no `renderSearch` hook | `searchBox` node: the host draws its real search; the editor draws a still preview |
| Cart button and count | An icon link to `/cart` | Live cart | Exists (`ctx.renderCartButton`) | `cartButton` node using the host hook |
| Language switcher | Not shown | Site locales | Exists (site settings) | `languageSwitcher` node, hidden when the site has one locale |
| Account link | Removed (no store account page) | — | Gap | Leave out until store accounts exist |
| Announcement bar text (header-announcement) | Typed "Free delivery over…" | Seller text, or the store's free-shipping threshold | Partly: the threshold lives in shipping settings | **Typed** by default; optional "Use my free-shipping rule" switch later |
| Social links (footers, contact) | Typed facebook/instagram URLs | `stores.social` (`ctx.store.social`) | Exists | `socialLinks` node, **live by default**; empty state "Add your social links ↗" (store settings). Icons follow the platform |
| Contact list in footer (phone, email, address, hours) | Typed numbers | Store support phone, email, WhatsApp | Gap: address and hours are not in `StoreProfile` (only phone, email, WhatsApp) | `contactInfo` node, live; rows hide when empty. Add address and hours to store settings first |
| Payment chips | Typed VISA, Mastercard, Meeza… | Payment methods the store accepts | Gap: `StoreProfile.paymentMethods` exists but the storefront sets nothing | `paymentMethods` node, live; host must fill the list |
| Policy links (Terms, Privacy, Shipping, Returns) | Typed `/shipping`, `/returns`… | The store's policy pages | Gap: `stores.policies` was dropped (0065); the storefront passes `policies: []` | Decide where policies live (pages built with the Rich-text "policy" design?), then `policyLinks` node lists them |
| Copyright line | Typed "© 2026 Your store" | Year and store name | Exists | `copyright` node: `© {year} {store}` filled at render |

### 2.2 Commerce sections

| Category / part | Today | Should come from | Status | Proposed UX |
|---|---|---|---|---|
| **Products** (all 6) | Bound | Products | **Bound** | Source picker in the list's Content tab; "Add products ↗" when the store has none; "No products match" with a source hint when filtered |
| **Categories** (all 6) | Typed names with stock photos | Store categories (name, image, count, link) | Exists (`categoryList` is built) | Convert the designs to `categoryList` with a bound card. Gap: a category without an image needs a fallback (proposal: tinted circle with the first letter, not a stock photo). "Add categories ↗" when empty |
| **Brands** row, wall, tiles, featured | Typed wordmarks | Seller brands (`seller_product_brands`, 0068): name, logo | Exists (resolver: `brands` query) | `brandList` node with a bound logo, or the name when there is no logo. "Add brands ↗". Brands-press (L-d) stays typed (press logos are not store brands) |
| Brands featured (L-e) products beside the brand | Typed | Products of that brand | Gap: no "by brand" product source | Add `source: brand` to `productList` |
| **Testimonials** (all 5) | Typed reviews | Approved store reviews and rating stats | Exists (`reviews` query, `reviewStats`) | `reviewList` node with bound name, city, rating stars, text and product. Rating summary (T-c) binds average, count and bar widths to `reviewStats`. Empty: "Reviews appear after buyers rate your products" with "Manage reviews ↗". **Choice for the owner:** keep a typed "testimonial quote" design for stores with no reviews yet? The Claude Design library says reviews are never typed |
| **Promotions** coupon (M-d), ticker code (M-b) | Typed `WELCOME20` and `SAVE10` | One of the seller's live coupons | Exists (`coupon` query, `CouponSummary`) | `couponCode` node with a coupon picker. Value, code and end date are bound; hidden when the coupon is inactive or expired. "Create promotion ↗" |
| Promotions countdown (M-c) | Typed end date | Coupon end date or a seller date, plus one product | Exists (`renderCountdown` hook, product source) | `countdown` node: picks a coupon's end or a typed date; the deal product is a `productList` with limit 1 |
| Promo pair and bento (M-a, M-e) | Typed offers with photos | Seller marketing text | — | **Stays typed** (campaign copy); links can point to a category through a link picker |
| Hero product (R-d) | Typed price tag | One product | Exists | `productList` limit 1 (source = picked) inside the hero, bound price and photo |
| Other heroes | Typed | Seller campaign | — | Stays typed |
| **Newsletter** (4) and footer sign-up | Bound to `storeForm` | A store form with an email field | **Bound** | "Create a form ↗" until one is picked. Gap: a one-click "Create a newsletter form" that makes an email-only form and picks it. WhatsApp channel picker (N-d) needs a phone-field form type |
| **Blog** (5) | Bound | Published blog posts | **Bound** (editor loads posts too) | "Write an article ↗". Gap: category and reading-time bindings (data exists in `ContentItemSummary.tags` and `readingMinutes`) |

### 2.3 Page-context sections (need page templates)

| Category | Should come from | Status | Proposed UX |
|---|---|---|---|
| **Product page** (Pd-a…e) | The product being viewed: gallery, name, price, variants, stock, specs, related products | Gap: the builder has no product-page template; the storefront product page is fixed code | Add page templates ("Product page", "Category page") that the storefront renders with a **current-product context**; bindings like `product.*` read it. Until then the category stays hidden |
| **Page header and banner**: category banner (Cb-b), sub-categories (Cb-d) | The category being viewed: name, description, image, children, product count | Gap: same (no category-page template) | Same template work. On plain pages the title stays typed |
| Page header title (Cb-a) on normal pages | The page name | Exists (`pages`) | Optional "Use page name" binding |

### 2.4 Content the seller types (no integration needed)

These stay typed on purpose. They are marketing words and the seller owns them.

- Features
- Stats: numbers the seller states. Optional later: live "orders delivered".
- Image with text
- Video: a video link.
- Gallery: uploaded photos. An Instagram feed would need the Instagram API.
- FAQ
- Rich text and policies
- Hero copy

Contact sections are the exception: their channel values should use the `contactInfo` binding from §2.1.

## 3. One UX for all integrations

1. **Live by default, override on purpose.** Store facts (logo, name, contact, social, payments, menu,
   copyright) are bound when a section is inserted. The Content tab shows where the value comes from and a
   "Change in store settings ↗" link (new tab). A "Use custom text" switch is shown only where a custom
   value makes sense (menu, announcement).
2. **Lists are a card template.** Products, categories, brands, reviews and posts each use one list node and one
   card. Selecting any card part selects the template; the inspector says "Edit the first card and every card
   follows". Source, sort and limit sit in the list's Content tab.
3. **Empty is a call to action, never a blank.** In the editor, an empty list or picker shows what is missing and
   one button that opens the right dashboard page in a new tab. On return the canvas refreshes by itself.
   Shoppers never see an empty section.
4. **Pickers for single records.** Coupon, form, a featured product and a category use the existing inspector
   pickers (`coupon`, `form`, `product`, `category` fields). A missing or expired record hides the part publicly
   and shows the picker hint in the editor.
5. **Page context is a template, not a section setting.** Product and category pages get their own templates;
   their sections bind to "the product or category of this page". They never ask the seller to pick one.

## 4. Suggested order

1. Chrome nodes: `storeLogo`/`storeName`, `navMenu`, `socialLinks`, `contactInfo`, `copyright`, `cartButton`.
   Then convert the headers, footers and contact designs. Fill `StoreProfile.paymentMethods`, address and hours.
2. `categoryList` designs (Categories category), with the letter fallback for missing images.
3. `reviewList` and the review stats bindings (Testimonials), after the owner decides about typed quotes.
4. `brandList` (Brands) and `couponCode`/`countdown` (Promotions).
5. A one-click newsletter form.
6. Product-page and category-page templates (a larger task, with its own spec).
