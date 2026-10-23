# Template product pages — design

Date: 2026-10-23. Status: draft for owner review.

## 1. Intent

Today every store website shows products with one fixed, coded layout
(`apps/ecommerce/app/[locale]/(shop)/storefront/[subdomain]/products/[slug]/page.tsx`:
`ProductDisplay` + `ProductContent` + `ProductTabsWrapper`). It picks up the
store's colours and fonts through the `--sf-*` tokens, but it is not a builder
page and looks the same in every template.

The owner wants each storefront template to ship **its own product details
page**, designed in that template's style and the store's design system, and
**editable by the seller in the website builder like any other page**. It
works the way Shopify's product template does: **one product page per store,
used by every product**. The product data, variants, stock, cart and checkout
behave exactly as they do on today's `/products/{slug}` page.

Owner's words: "make it like our page but with each template design and
seller's design system." So the default layout and contents follow today's
page; each template's version restyles and rearranges that layout to fit the
template, but drops nothing that matters.

## 2. Goals

1. A **Product page** system page in every store's site config, edited in the
   builder (select, restyle, move, delete every element; add library sections).
2. **Product-bound elements** for the builder, filled from the product being
   viewed: gallery, title, price, rating, stock, variants, quantity + add to
   cart / buy now, description, bullet points, rich content, perks, seller
   info, reviews and questions, related products.
3. **Every template (all 111 `TemplateDefinition`s: 109 built by
   `libraryTemplate`, plus `atelier` and `classic`) gets its own product page**
   in its own style.
4. The storefront `/products/{slug}` route renders the store's **published**
   product page with the real product. Behaviour (redirects, canonical,
   metadata, pixels, structured data, offline handling, catalog selection D24)
   is unchanged.
5. The product page's library sections (gallery + buy box, details, reviews,
   related) exist in the `product-page` library category, so a seller can add
   them back after deleting them.

## 3. Non-goals

- Per-product layouts or per-category product templates.
- Templating the catalog (`/products`), cart, checkout, account or wishlist pages.
- Changing the marketplace (tallaby.com) product page. It keeps today's components.
- Changing cart, checkout, pricing, coupon or stock logic.
- Seller-supplied HTML/JS (CLAUDE.md rule 9).

## 4. Anti-goals (failure even if it "works")

- Add to cart, buy now, variant selection, `?variant=` deep links, stock caps
  or the sticky mobile buy bar behave differently from today's page.
- A store that never designed a product page shows a broken or empty page.
- The marketplace canonical URL, metadata or structured data are lost.
- 111 near-identical copies of a hard-coded layout that a seller can't edit.
- Draft builder changes leak to the live site before Publish.

## 5. How it works (decided)

### 5.1 The product page is a system page

- `sitePageSchema` (`packages/store-sections/src/config/schema.ts`) gains an
  optional `kind: "page" | "product"` (default `"page"`). The change is
  additive, so `SITE_CONFIG_VERSION` stays `1`. A config holds at most one
  `kind: "product"` page. Its slug is the reserved `product`. That slug stays
  forbidden for normal pages, but is required for, and allowed only on, the
  product page. *(My call: reserved-slug identity plus `kind` on the config.)*
- Storage: a `store_pages` row with `slug = 'product'`. **My call:** add a
  `store_pages.kind text NOT NULL DEFAULT 'page'` column (with a CHECK on
  `'page' | 'product'`) in migration `0098`, mirrored in Drizzle. This keeps
  the page kind explicit in SQL rather than implied by the slug.
- The product page is never in nav (`showInNav: false`), is never routed as
  `/product`, can't be deleted or have its slug changed, and can't be the home
  page. The seller can rename its display name.
- SEO fields on this page are ignored. Product metadata comes from the product,
  as today.

### 5.2 Product data in the renderer

- `RenderContext` (`core/types.ts`) gains `product?: ProductDetail`.
  `ProductDetail` is a new hook-free, serialisable type holding what the
  elements need:
  - id, slug, title, description, rich `content` html, bullet points
  - images
  - price final/list, discount %, discount end date
  - quantity / inStock, `directCheckout`
  - variants (id, name/attributes, color, image, price, quantity)
  - averageRating, reviewCount
  - brand, category
  - seller summary, free delivery flag

  It is mapped from today's `Product` type (`components/product-page/product-page.types.ts`).
- A new `DataRecord` kind `"product"` with `DATA_BINDINGS.product`. Inside a
  product page, the renderer seeds the root scope with `{ kind: "product",
  record: ctx.product }`. Then existing `heading`/`text`/`photo`/`link` nodes
  can `bind` to `title`, `description`, `price`, `brand`, `category` and so
  on, the same way `productList` cards do today.
- `addToCart` and `wishlistButton` also accept `scope.kind === "product"`.

### 5.3 New product elements

New element types are registered in `elements/registry.ts` and
`ALLOWED_NODE_TYPES`, in a new `product` Add-panel group shown only while
editing the product page:

| Element | Renders | Interactive? |
|---|---|---|
| `productGallery` | images, thumbs (side/bottom/none), hover zoom, mobile carousel, share | host hook |
| `productPrice` | final, list, discount %, countdown, free delivery (today's `PriceTicket`) | host hook (variant-aware) |
| `productStock` | out of stock / only N left / in stock | host hook (variant-aware) |
| `productRating` | stars + count, links to `#reviews` | static |
| `productVariants` | today's swatch carousel | host hook |
| `productBuyBox` | quantity, add to cart, buy now / go to cart, sticky mobile bar | host hook |
| `productDetails` | accordion: description + bullet points | static |
| `productContent` | the product's rich `content` html | static (sanitised as today) |
| `productSeller` | seller name and rating | static |
| `productReviews` | today's reviews + questions tabs (`ProductTabs`) | host hook |

Related products reuse `productList` with a new `source: "related"`.
**My call:** this is store-scoped, never the marketplace list in
`product.relatedProducts` (which mixes in other sellers). It shows this
store's active products in the same category, excluding the current one,
respecting the D24 selected catalog. It resolves through the
`resolveStoreCatalog` path, so cache keys carry the seller ID (rule 8). If
there are too few, it falls back to the store's newest products. Today's
storefront page has no related products; the template pages add them as the
last section, which the seller can delete.

Interactive elements follow the existing host-hook pattern
(`renderAddToCart` in `store-site.tsx`). Sections stay hook-free; the
ecommerce app supplies `renderProductGallery`, `renderProductBuyBox` and the
others. These hooks **reuse today's components** (`ProductImages`,
`PriceTicket`, the variant carousel, `ProductActions`, `AddToCartButton`,
`ProductTabs`), refactored only enough to take styling from the node and the
`--sf-*` tokens. Each hook takes a small set of node props (gallery layout,
button labels, show/hide toggles). Look and spacing come from the node's
normal `style`, so the seller styles them like any element.

**Shared variant state:** a client `ProductPageProvider`, lifted from
`ProductDisplay`, wraps the rendered product page. It holds
`selectedVariantId`, the `?variant=` deep link with `history.replaceState`,
and the in-cart check. Price, stock, gallery, variants and the buy box read it,
so they stay in sync wherever the seller puts them. `MetaViewContent` and
`ProductStructuredData` render once, from the route, not from elements.

### 5.4 Storefront route

`products/[slug]/page.tsx` keeps `resolveStoreProduct` and `generateMetadata`
as they are. The body changes:

- The **published** site has a `kind: "product"` page → render it with
  `StoreSitePage` and a context built by `buildContext` plus `product`, wrapped
  in `ProductPageProvider`. The back-to-store link becomes a normal element in
  the template designs.
- Otherwise → today's layout, unchanged (the fallback).

A builder preview (verified preview mode) renders the draft, as other pages do.

### 5.5 Builder

- The pages panel lists **Product page** pinned after Home, with a product
  badge and no delete or slug edit.
- **Preview product:** the canvas renders the page with one of the seller's
  real products. By default this is the newest active product in the store's
  catalog; a picker in the canvas toolbar switches it. If the store has no
  products, a built-in demo product is used (template preview uses the
  template's demo catalog). The editor loads the full product through a new
  store-scoped server action that checks store ownership (rule 5) and is not
  cached (rule 8: builder data).
- The editor lives in `packages/store-editor` (used by the dashboard) and
  can't import the ecommerce components. So every product element has a
  hook-free **still rendering** in `store-sections`, drawn from `ctx.product`
  and the node style: first image plus thumbs, price text, variant chips,
  quantity box, and buttons that do nothing. The canvas and the Admin editors
  draw that. On the storefront, the host hooks replace it with the
  interactive components. No cart writes happen from the canvas. *(Builder
  note, 2026-10-23: this replaces "the real components, buttons inert".)*

### 5.6 Template designs

- **Shared builder:** `templates/_pages.ts` gets `productPage(lib, spec)`. It
  builds today's layout as element trees with `defineDesign`, in three sections:
  1. **Main:** back link; gallery on one side, buy column on the other (seller,
     stock, title, rating, price, variants, buy box, details accordion, perks).
  2. **Content:** the product's rich content.
  3. **Reviews + related:** reviews and questions, then related products.
- `spec` lets each template express its style without new code per template:
  - gallery side and thumbnail position
  - corners, card vs flat and borders
  - heading treatment (case, letter-spacing, serif/sans from the DS)
  - button style
  - section backgrounds (paper / shelf / brand band)
  - template copy (back link text, perks wording, section titles)
  - optional extra library sections, e.g. `product-shipping` or `product-perks`
- Colours and fonts always come from the design system tokens, so a seller's
  design-system change restyles the page.
- `LibraryTemplateSpec` gains `productPage?: ProductPageSpec`, and
  `libraryTemplate` always adds the product page. With no spec it is derived
  from the template's corners, fonts and palette. **Each of the 109 templates
  is given a spec** that fits its look, set by reviewing that template's home
  design. Templates in the same family may share a spec when that is the
  honest fit.
- `atelier` and `classic` get hand-written product pages in their folders, in
  their existing style.
- Library: `designs/product-page/` gets generic designs of the three sections
  (`product-main`, `product-content`, `product-reviews`, `product-related`)
  next to `product-perks` and `product-shipping`. They are added to `EXPECTED`
  in `designs.test.tsx` and seeded through an insert-only `section:sql`
  migration.
- Template product pages use the template-owned design ids
  (`<template>-<library id>`), like other template sections.

### 5.7 Rollout

- Every code template gets a version bump and a changelog entry ("Product
  page"). A new script generates **one migration that appends the template's
  product page** to each DB template. **My call:** it does not replace the
  whole config. For each template key it inserts a new `template_versions` row
  with version `max(version) + 1`, whose config is the *current* DB config
  with the code's product page appended to `pages`. It points
  `current_version_id` at that row. The guard is only "the current config has
  no `kind: "product"` page". This makes it idempotent, keeps any Admin edits
  to other pages, and doesn't depend on the version numbers `0096`/`0097` set.
  A template with an Admin `draft_config` also gets the page appended to its
  draft, so the next Admin publish keeps it. The script is needed because
  hand-writing 111 blocks is not practical.
- Admin editors (**my call, minimal**): the Admin template editor uses the
  same `store-editor` package, so it shows the product page with the built-in
  demo product (no store catalog). The Admin library-section editor previews
  `product-page` designs with the same demo product. Nothing else in Admin
  changes.
- Migrations: `0098` (`store_pages.kind`), `0099` (product-page library
  sections), `0100` (template versions). They go to staging first, then to
  production with owner approval (rule 6). CLAUDE.md's migration notes are
  updated.
- **New stores:** `seedStarterSite` already inserts every template page.
  Classic's product page comes with it.
- **Applying a template:** `mergeTemplateIntoDraft` already creates missing
  template pages, so the product page arrives as a draft.
- **Existing stores:** see §7 (open question).
- Classic is the default template, and rule 12 requires owner approval for
  design changes. This request is that approval *for adding a product page
  only*. Classic's other pages are not changed.

## 6. Constraints

- CLAUDE.md rules 3 (keep checkout/cart behaviour), 5 (store ownership on the
  new preview action), 8 (no caching of builder data; published product page
  render uses the existing published-site cache), 9, 13 (every new string in
  `ar.json` and `en.json`, both apps and the `store-sections` copy), 14 (file
  split), 15 (lint/typecheck/test), 17 (element trees only).
- Next.js 16.3.3: read `node_modules/next/dist/docs/` before route changes.
- `git status` shows uncommitted owner work in `product-display.client.tsx`,
  `store-site.tsx`, the editor package and others. Build on it; never discard it.

## 7. Left to the builder

- Exact `DATA_BINDINGS.product` field list and the `ProductDetail` mapper.
- How far to refactor today's product components to accept node styling,
  as long as the marketplace page keeps its current look.
- Per-template `ProductPageSpec` values.
- Tests: schema (one product page, reserved slug), bindings, renderer with and
  without `ctx.product`, the route fallback, apply/seed creating the page,
  every template config containing exactly one product page, designs EXPECTED.
- Manual E2E checks recorded in `PLAN.md` §23, and a new `PLAN.md` task with
  checklist and log entries (rule 2).

## 8. Existing stores (decided 2026-10-23)

The owner approved the design and said: "apply the changes to our current
stores too as we don't have many real stores".

**Backfill.** A one-off, idempotent script
(`packages/store-sections` or `packages/lib` script, run with
`DATABASE_URL`) runs for every store that has no `kind: "product"` page:

1. Build the product page from the store's template (`stores.templateKey`, or
   Classic if it is unset or the template is gone).
2. Insert it as a `store_pages` draft row (`slug = 'product'`,
   `kind = 'product'`).
3. If the site has a published revision, publish a new revision whose
   snapshot is the live snapshot plus the same page (revisions are
   append-only), and point `stores.published_revision_id` at it. Only the
   product page goes live; the seller's other unpublished drafts stay drafts.
4. Bust the store's published-site cache tags.

Each store is one transaction. It reports which stores were changed and which
skipped. It runs on staging first, then on production with an explicit
go-ahead at run time (rule 4). Its result is logged in `PLAN.md` §23.

**New stores later** get the page through `seedStarterSite`, and template
applies through `mergeTemplateIntoDraft`. The page can't be deleted, so the
builder needs no "add product page" prompt. A store that still somehow lacks
one falls back to today's layout.


## Implementation notes (2026-10-23)

Where the code differs from the spec text above:

- The host sanitises `contentHtml` (`sanitizeRichTextHtml` from `@workspace/tiptap`, when it builds `ProductDetail`) and the product content element prints it as is. This keeps `sanitize-html` out of the editor bundle.
- The `tracking` (letter-spacing) axis was removed from the template spec: it breaks joined Arabic script and the style system has no locale-scoped styles.
- The buy box element has a `variant` prop (`solid` or `outline`) that carries the template's button style; the storefront hook honours it.
- Product sections that draw nothing in public (all their product elements render null) are hidden; sections with seller content stay.
- Template previews use a template-specific demo product (`templateDemoProduct`) instead of one shared product.
- The migrations are numbered `0099` (`store_pages.kind`), `0100` (product-page library sections) and `0101` (template product pages), because `0098` was taken by the notifications migration.
- The product page is never added to the navigation when a template is applied (`showInNav` is forced to false for it).
- The builder's preview product comes from `getStorePreviewProduct` in `packages/lib`; the storefront maps its own row with `toProductDetail` in `apps/ecommerce`, so there are two mappers to keep in sync.
- `ProductDetail.quantity` is the total stock (sum of variant quantities when variants exist).
- Backfill step 3 inserts a new `store_site_revisions` row (number = max + 1 under the store row lock, the live revision's `schema_version` and `template_key`, `published_by` NULL) and repoints `stores.published_revision_id`, because the 0051 trigger makes revisions append-only. The old revision is untouched. It does not change `last_published_at`. The dry run reports the same outcome, revision number included.
- A plain `addToCart` element placed on the product page draws nothing in public (the still preview in the editor) when the product has variants: only the buy box picks a variant.
- A section made only of product parts and frame is hidden in public on a page without a product too (a product section pasted onto a normal page).
- Template undo never deletes the product page: one the install created keeps the template's content; one that existed before gets its previous content back.
- On store hosts the phone buy bar docks at the bottom edge with safe-area padding (`stickyBuyBarClass(…, { bottomNav: false })`); the marketplace bar is unchanged.
- Deploy order: `0096`–`0099` before deploying, then `0100` and `0101`, then the backfill; run the read-only `packages/db/scripts/check-unscoped-bound-nodes.sql` before deploying (a bound node outside a list or the product page renders nothing in public).
