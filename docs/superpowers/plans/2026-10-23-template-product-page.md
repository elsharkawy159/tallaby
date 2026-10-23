# Template Product Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Every store website gets one builder-editable Product page used by every product. Every template (Classic, Atelier, and the 109 `libraryTemplate` ones) ships its own version. Existing stores are backfilled.

**Architecture:**
- **Config:** a `kind: "product"` system page (reserved slug `product`) in `SiteConfig`, stored as a `store_pages` row with a new `kind` column.
- **Rendering:** the renderer gets `ctx.product: ProductDetail` and a `"product"` data scope, so bound nodes and new product elements fill themselves. Each element has a hook-free still rendering in `store-sections`. The storefront swaps in today's interactive components through host hooks, sharing one `ProductPageProvider` for variant state.
- **Templates:** they build their page with one shared `productPage(lib, spec)` helper.
- **Rollout:** one generated migration appends the page to each DB template, and a one-off script backfills existing stores.

**Tech Stack:** TypeScript, Zod 4, React 19 / Next.js 16.3.3 (read `node_modules/next/dist/docs/` before touching routes), Drizzle, Postgres (Supabase), Vitest, pnpm workspaces.

**Spec:** `docs/superpowers/specs/2026-10-23-template-product-page-design.md`. Read it first; this plan argues from it.

## Global Constraints

- CLAUDE.md is binding. In particular:
  - rule 3: cart, checkout and variants unchanged
  - rule 5: every store-scoped server function checks that the store belongs to the session's seller; never trust client ids
  - rule 8: never cache builder drafts; store cache keys and tags include the seller id
  - rule 13: every new string goes in both `ar.json` and `en.json`, Arabic first, brand طلبي
  - rule 14: the feature file split
  - rule 16: never touch others' uncommitted work; check `git status` before each task and stage only your own files
  - rule 17: element trees only
- Migrations are hand-written, idempotent, and numbered from `0100`. Mirror each in `packages/db/src/drizzle/schema.ts`. Never run `drizzle-kit generate`. Staging first; production only with the owner's go-ahead at run time.
- `SITE_CONFIG_VERSION` stays `1`. Every schema addition is optional and additive.
- The product page's slug is exactly `product`. It has `kind: "product"`, `showInNav: false` and `isHome: false`, and a config holds at most one.
- Marketplace (tallaby.com) product page look and behaviour: unchanged.
- After each task run `pnpm --filter <pkg> lint typecheck test` for every touched package. Before the last task run the full `pnpm lint && pnpm typecheck && pnpm test`.

## Review Focus

1. **Product with no images, or one image.** The gallery draws a neutral placeholder, or a single image with no thumbs strip. It never shows a broken `<img>`. (Task 4 test `productGallery without images draws placeholder`.)
2. **Variants:**
   - A product with variants that are all out of stock shows "out of stock" and disables the buy box.
   - Choosing a variant updates price, stock and gallery wherever the seller placed them.
   - `?variant=` deep links still work.

   (Task 4 still-render test; Task 10 provider test `selecting variant updates every subscriber`.)
3. **The product page never leaks as a normal page:**
   - it is not in nav (`ctx.pages`), not in the sitemap, and not reachable at `/product` or `/pages/product`
   - a seller can't create, rename the slug of, or delete it

   (Task 1 schema tests; Task 2 page-write tests; Task 10 `buildContext excludes product page from nav`.)
4. **A store whose `templateKey` is unknown or deleted:** the backfill and seed fall back to Classic's product page, never crash or skip silently. (Task 14 test `unknown templateKey falls back to classic`.)
5. **Related products with no category or too few matches:** fall back to newest, never include the current product, never other sellers' products. (Task 5 tests.)

---

### Task 1: Product page in the SiteConfig schema

**Files:**
- Modify: `packages/store-sections/src/config/schema.ts` (`sitePageSchema` ≈L152, `siteConfigSchema` refine ≈L219, `slugSchema` ≈L81)
- Create: `packages/store-sections/src/config/product-page.lib.ts`
- Test: `packages/store-sections/src/config/schema.test.ts`, `packages/store-sections/src/config/product-page.lib.test.ts`

**Interfaces:**
- Produces:
  - `PAGE_KINDS = ["page", "product"] as const`, `type PageKind`, `PRODUCT_PAGE_SLUG = "product"`
  - `SitePage.kind?: PageKind`, absent meaning `"page"`
  - `isProductPage(page: Pick<SitePage, "kind">): boolean`
  - `productPageOf(config: Pick<SiteConfig, "pages">): SitePage | undefined`
  - `navPages(config): SitePage[]`: pages that are not product pages

- [ ] **Step 1: Write failing tests:**
  - `accepts one product page with slug "product"`
  - `rejects two product pages` (issue message `one_product_page`)
  - `rejects kind product with another slug` (`product_page_slug`)
  - `rejects slug "product" on a normal page` (`reserved_slug`, unchanged)
  - `rejects a product page that isHome` (`product_page_not_home`)
  - `config without kind parses unchanged`: output deep-equals the old fixture with no `kind` key added

  Also `productPageOf` and `navPages` unit tests.
- [ ] **Step 2:** `pnpm --filter @workspace/store-sections test config`. Expect FAIL.
- [ ] **Step 3: Implement.**
  - `sitePageSchema` gets `kind: z.enum(PAGE_KINDS).optional()`. The page `slug` field becomes `z.string()` with the slug regex only.
  - Move the reserved-slug check into the `siteConfigSchema` superRefine: a reserved slug is allowed only when `kind === "product" && slug === PRODUCT_PAGE_SLUG`.
  - Keep `slugSchema` exported unchanged for page-write callers.
- [ ] **Step 4:** Tests pass. Also run `pnpm --filter @workspace/store-sections typecheck`.
- [ ] **Step 5: Commit** `feat(store-sections): product page kind in site config`.

### Task 2: `store_pages.kind` and page-write guards

**Files:**
- Create: `packages/db/migrations/0099_store_pages_kind.sql`
- Modify:
  - `packages/db/src/drizzle/schema.ts` (`storePages` ≈L2594)
  - `packages/lib/src/store-sites/server.ts` (`buildDraftSiteConfig` ≈L184, `createStorePage` ≈L544, `updateStorePage` ≈L579, `deleteStorePage` ≈L632, `reorderStorePages` ≈L652, `restoreRevisionToDraft` ≈L293, `getStoreForEditor` ≈L91)
- Test: `packages/lib/src/store-sites/builder.integration.test.ts`

**Interfaces:**
- Consumes: `PRODUCT_PAGE_SLUG`, `PageKind` (Task 1).
- Produces:
  - `storePages.kind: text` (`'page' | 'product'`, default `'page'`)
  - `PageWriteError` gains `"product_page_locked"`
  - editor page rows carry `kind`

- [ ] **Step 1: Write the migration** `ALTER TABLE store_pages ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT 'page'`. Add the CHECK `store_pages_kind_check (kind IN ('page','product'))` guarded by a `pg_constraint` lookup. Add the partial unique index `store_pages_one_product ON store_pages(store_id) WHERE kind = 'product'`, using `IF NOT EXISTS`. Mirror in Drizzle.
- [ ] **Step 2: Write failing integration tests** (they run only with `TEST_DATABASE_URL`):
  - `buildDraftSiteConfig maps kind and the product page validates`
  - `deleteStorePage on product page returns product_page_locked`
  - `updateStorePage cannot change product page slug or showInNav`; renaming `name` is allowed
  - `createStorePage with slug product returns reserved_slug`
  - `restoreRevisionToDraft keeps kind`
- [ ] **Step 3: Implement.**
  - `buildDraftSiteConfig` and `getStoreForEditor` emit `kind` only when it is `'product'`.
  - The write guards check `kind = 'product'` on the row loaded with the ownership check.
  - The restore upsert writes `kind`.
- [ ] **Step 4:** Run `pnpm --filter @workspace/lib test` and `pnpm --filter @workspace/db typecheck`.
- [ ] **Step 5:** Apply `0100` on staging only, then log it in PLAN.md §23.
- [ ] **Step 6: Commit** `feat(db,lib): store_pages.kind for the product page`.

### Task 3: `ProductDetail`, `ctx.product` and the `product` scope

**Files:**
- Modify:
  - `packages/store-sections/src/core/types.ts` (add `ProductDetail`; `RenderContext.product?`; new host hooks)
  - `packages/store-sections/src/elements/data.ts` (`DataRecord`, `DATA_BINDINGS`, `boundValue`)
  - `packages/store-sections/src/sections/custom.tsx` (seed the scope)
  - `packages/store-sections/src/elements/render.tsx` (`addToCart` and `wishlistButton` accept `scope.kind === "product"`)
- Create: `packages/store-sections/src/core/demo-product.ts`
- Test: `packages/store-sections/src/elements/data.test.tsx`

**Interfaces:**
- Produces:
  ```ts
  export type ProductVariantDetail = { id: string; label: string; color?: string | null; image?: string | null;
    price: number | null; compareAtPrice?: number | null; quantity: number };
  export type ProductDetail = ProductSummary & {
    slug: string; description: string | null; contentHtml: string | null; bulletPoints: string[];
    images: string[]; discountPercent: number | null; discountEndsAt: string | null;
    quantity: number; directCheckout: boolean; variants: ProductVariantDetail[];
    reviewCount: number; brand: string | null; category: { id: string; name: string } | null;
    seller: { name: string; rating: number | null; ratingCount: number; freeDelivery: boolean } };
  ```
  - `RenderContext.product?: ProductDetail`
  - `DataRecord` adds `{ kind: "product"; record: ProductDetail }`
  - `DATA_BINDINGS.product = ["title","image","href","price","compareAtPrice","discount","rating","description","brand","category","reviewCount","seller"]`
  - `DEMO_PRODUCT: ProductDetail`, with Arabic copy, three images from `stock-photos.ts` and two variants

- [ ] **Step 1: Write failing tests:**
  - `bound heading inside a section shows ctx.product title`
  - `bound price null compareAt hides the node`
  - `no ctx.product: bound nodes render nothing in public, placeholder text in edit`
  - `addToCart in product scope calls renderAddToCart with the product`
- [ ] **Step 2:** Run. Expect FAIL.
- [ ] **Step 3: Implement.**
  - The custom section passes `ctx.product ? { kind: "product", record: ctx.product } : undefined` as the root scope.
  - A `productList` inside still re-scopes its children to `productList`.
  - `boundValue` adds the `"product"` case, reusing the productList formatting for price, discount and rating.
- [ ] **Step 4:** Tests pass.
- [ ] **Step 5: Commit** `feat(store-sections): product scope for product pages`.

### Task 4: Product elements with still renderings

**Files:**
- Modify:
  - `packages/store-sections/src/config/schema.ts` (`ALLOWED_NODE_TYPES`)
  - `packages/store-sections/src/elements/registry.ts` (`ElementType`, `ELEMENT_GROUPS` gets `"product"`, `ELEMENT_DEFINITIONS`)
  - `packages/store-sections/src/elements/render.tsx` (one case per type)
  - `packages/store-sections/src/core/types.ts` (hooks)
  - `packages/store-sections/src/designs/builder.ts` (tree builder methods)
- Create: `packages/store-sections/src/elements/product-elements.tsx` (still renderings)
- Test: `packages/store-sections/src/elements/product-elements.test.tsx`

**Interfaces:**
- Consumes: `ProductDetail`, the `product` scope (Task 3).
- Produces:
  - Node types and their props:
    - `productGallery` `{ thumbs: "side"|"bottom"|"none", zoom: boolean }`
    - `productPrice` `{ showDiscount: boolean, showCountdown: boolean }`
    - `productStock` `{}`
    - `productRating` `{ showCount: boolean }`
    - `productVariants` `{}`
    - `productBuyBox` `{ buyNow: boolean, stickyMobile: boolean, addLabel?: Localized, buyLabel?: Localized }`
    - `productDetails` `{ showDescription: boolean, showBullets: boolean }`
    - `productContent` `{}`
    - `productSeller` `{}`
    - `productReviews` `{}`
  - Host hooks on `RenderContext`: `renderProductGallery`, `renderProductPrice`, `renderProductStock`, `renderProductVariants`, `renderProductBuyBox`, `renderProductReviews`. Each has the shape `(product: ProductDetail, props: Record<string, unknown>) => ReactNode`.
  - Tree builder: `t.productGallery(opts?)`, `t.productPrice(opts?)`, and so on, each one `make(type, defaultProps, opts)`.

- [ ] **Step 1: Write failing tests** with `renderToStaticMarkup`:
  - `productGallery without images draws placeholder`
  - `productGallery one image has no thumbs strip`
  - `productPrice shows final and struck list price`
  - `productStock all variants out of stock says out of stock`
  - `productBuyBox edit mode buttons are inert (no href, disabled)`
  - `public mode uses host hook when given`
  - `no ctx.product in public renders null`
  - `productContent sanitises html`, using the existing sanitiser in `config/` (no `<script>`)
- [ ] **Step 2:** Run. Expect FAIL.
- [ ] **Step 3: Implement.**
  - The still renderings use `--sf-*` tokens and the node `attrs` and style class.
  - `ELEMENT_DEFINITIONS` entries are in `group: "product"`, with `fields` for the props above and Arabic and English labels.
  - Product types are left out of `PALETTE_TYPES` filtering: the Add panel decides visibility in Task 11.
- [ ] **Step 4:** Tests pass. `designs.test.tsx` still passes.
- [ ] **Step 5: Commit** `feat(store-sections): product page elements`.

### Task 5: Store-scoped related products

**Files:**
- Modify:
  - `packages/store-sections/src/core/types.ts` (`PRODUCT_SOURCES` += `"related"`)
  - `packages/store-sections/src/core/catalog-resolve.ts` (`selectProducts`)
  - `packages/store-sections/src/elements/data.ts` (`nodeCatalogQuery`)
  - `apps/ecommerce/lib/store-site/catalog.server.ts` (`resolveStoreCatalog`)
  - `packages/store-editor/src/lib/editor.lib.ts` (`resolveCanvasCatalog`)
- Test: `packages/store-sections/src/core/catalog-resolve.test.ts`

**Interfaces:**
- Produces:
  - `ProductQuery` / `CatalogQuery` products gain `relatedTo?: { productId: string; categoryId: string | null }`
  - `collectCatalogQueries(sections, opts?: { product?: ProductDetail })` fills `relatedTo` for `source: "related"` nodes. Without a product it falls back to `newest`.

- [ ] **Step 1: Write failing tests:**
  - `related picks same category, excludes current`
  - `related with no category falls back to newest`
  - `related with too few fills with newest, no duplicates`
  - `related only selects from candidates given` (the store's own catalog)
- [ ] **Step 2:** Run. Expect FAIL.
- [ ] **Step 3: Implement** in `selectProducts`. In `resolveStoreCatalog`, add the same rule in SQL: seller id filter, D24 selected catalog, `id <> current`, category match first, then newest. Its cache key includes the seller id and product id.
- [ ] **Step 4:** Tests pass.
- [ ] **Step 5: Commit** `feat: related products source for product pages`.

### Task 6: Product page library designs

**Files:**
- Create in `packages/store-sections/src/designs/product-page/`: `product-main.ts`, `product-content.ts`, `product-reviews.ts`, `product-related.ts`
- Modify: `designs/product-page/index.ts` (`PRODUCT_PAGE_DESIGNS`), `designs/designs.test.tsx` (`EXPECTED`)
- Create: `packages/db/migrations/0100_product_page_sections.sql`, generated by `pnpm --filter @workspace/store-sections section:sql --new-only`
- Test: `designs.test.tsx` snapshots

**Interfaces:**
- Consumes: Task 4 tree builder methods.
- Produces: design ids `product-main` (subcategory `buy-box`), `product-content` and `product-reviews` (`details`), `product-related` (`upsell`).

- [ ] **Step 1:** Add the four ids to `EXPECTED`. Run the tests. Expect FAIL.
- [ ] **Step 2: Implement the designs** following tree-sections spec §6.
  - `product-main` mirrors today's `ProductDetails` order:
    - a back `textLink` to `/`
    - a 2-column grid (1 column on mobile): `productGallery`, then a `vFlex` of `productSeller`, `productStock`, a bound `heading` h1 `title`, `productRating`, `productPrice`, `productVariants`, `productBuyBox` and `productDetails`
  - `product-content`: a `productContent` in a container.
  - `product-reviews`: a section heading, then `productReviews`.
  - `product-related`: a section head, then `productList` with `source: "related"`, `limit: 4`, and the `productCard` used by `products-grid`.
- [ ] **Step 3:** Tests pass. Update the snapshots and review their diffs.
- [ ] **Step 4:** Generate `0101`. Apply on staging. Log it.
- [ ] **Step 5: Commit** `feat(store-sections): product page library sections`.

### Task 7: Shared `productPage` builder and `libraryTemplate` support

**Files:**
- Create: `packages/store-sections/src/templates/_product-page.ts`
- Modify:
  - `packages/store-sections/src/templates/library-template.ts` (`LibraryTemplateSpec.productPage?`; append the page)
  - `packages/store-sections/src/templates/types.ts` (no change unless `pageNames` needs the `product` key)
- Test: `packages/store-sections/src/templates/product-page.test.ts`

**Interfaces:**
- Consumes: `Lib` (`_pages.ts`), the Task 6 designs, `PRODUCT_PAGE_SLUG`.
- Produces:
  ```ts
  export type ProductPageSpec = {
    gallery?: "start" | "end";            // gallery side; default "start"
    thumbs?: "side" | "bottom" | "none";  // default "bottom"
    surface?: "flat" | "card" | "shelf";  // buy column treatment; default from radius: 0 → "flat", else "card"
    headingCase?: "none" | "upper";       // default "none"
    tracking?: number;                    // heading letter-spacing em; default 0
    button?: "solid" | "outline";         // buy box primary; default "solid"
    band?: "paper" | "shelf" | "brand";   // reviews section background; default "shelf"
    copy?: { back?: DesignText; reviews?: DesignText; related?: DesignText };
    extras?: readonly ("product-perks" | "product-shipping")[]; // inserted after main; default []
  };
  export function productPage(lib: Lib, spec?: ProductPageSpec): Design[];
  export function productSitePage(designs: readonly Design[]): SitePage; // slug "product", kind "product", showInNav false, name "صفحة المنتج"
  ```
  `pageNames.product = { ar: "صفحة المنتج", en: "Product page" }` is added by `libraryTemplate`.

- [ ] **Step 1: Write failing tests:**
  - `every library template config has exactly one product page and validates` (loops `LIBRARY_TEMPLATES`; Task 8 widens it to `CODE_TEMPLATES`)
  - `productPage default spec matches today's order` (the node type sequence of the main section)
  - `spec gallery end puts gallery second`
  - `extras inserted after main`
  - `template product page design ids are <key>-product-*`
- [ ] **Step 2:** Run. Expect FAIL.
- [ ] **Step 3: Implement.**
  - `productPage` calls `lib("product-main", patch)` and the others.
  - Each spec field maps to style patches on known node labels. If `LibraryPatch` can't express a field, extend `fromLibrary` with a `styles` patch keyed by node label. That is the only allowed `_library.ts` change.
  - `libraryTemplate` always appends `productSitePage(productPage(lib, spec.productPage))`. It needs the template's `lib`, so add `lib: Lib` to `LibraryTemplateSpec`; each template already has a `lib` const.
- [ ] **Step 4:** All Task 7 tests pass.
- [ ] **Step 5: Commit** `feat(templates): shared product page builder`.

### Task 8: Classic and Atelier product pages

**Files:**
- Create: `packages/store-sections/src/templates/classic/product.ts`, `packages/store-sections/src/templates/atelier/product.ts`
- Modify: `classic/index.ts` and `atelier/index.ts` (add the page and designs, bump the version, set the changelog to `"<Name> vN: product page"`)

- [ ] **Step 1: Implement.** Use the hand-written designs in each template's own idiom (`atelier/_shared.ts` hairlines, square corners; Classic's existing tokens), and the same element set and order as `product-main`. Add the designs to `*_DESIGNS`. Add `pageNames.product`.
- [ ] **Step 2:** Widen the Task 7 catalog test to `CODE_TEMPLATES`. Run it and the template seed tests (`pnpm --filter @workspace/store-sections test templates`). All pass.
- [ ] **Step 3: Commit** `feat(templates): Classic and Atelier product pages`.

### Tasks 9a–9f: Per-template product page specs

Each batch is one task with the same steps. Batches follow the `LIBRARY_TEMPLATES` order:
- **9a:** mode … clay (15)
- **9b:** sizzle … moto (22)
- **9c:** fixit … ghorza (10)
- **9d:** kettan … qahwa (21)
- **9e:** khodar … garagy (31)
- **9f:** mawsem … tarik (10)

**Files:** each template's `templates/<key>/index.ts`.

- [ ] **Step 1:** For each template, read its home designs and `libraryTemplate` call: radius, fonts, header style and section backgrounds. Set `lib` and `productPage: ProductPageSpec` to match. For example, a template with uppercase tracked headings gets `headingCase: "upper"` and `tracking`. A shelf-band home gets `band: "shelf"`. Square-corner luxe templates get `surface: "flat"` and `button: "outline"`. Set `copy` in the template's voice, the way its about/contact copy reads. Bump `version` by 1 and set `changelog: "<Name> vN: product page"`.
- [ ] **Step 2: Visual check.** Run the ecommerce dev server and open `template-preview/<key>/product` for every template in the batch (Task 12 adds that route). Check desktop and 375px mobile, RTL. Fix anything that clashes.
- [ ] **Step 3:** Run `pnpm --filter @workspace/store-sections test`.
- [ ] **Step 4: Commit** `feat(templates): product pages for <first>…<last>`.

> 9a–9f depend on Task 12, which adds the preview route. Run Task 12 first if executing in order.

### Task 10: Storefront rendering

**Files:**
- Create:
  - `apps/ecommerce/lib/store-site/product-detail.lib.ts` (`toProductDetail(product: Product, locale): ProductDetail`)
  - `apps/ecommerce/components/product-page/product-page-provider.client.tsx`
  - `apps/ecommerce/app/[locale]/(shop)/storefront/[subdomain]/_components/store-product-page.tsx`
  - `apps/ecommerce/app/[locale]/(shop)/storefront/[subdomain]/_components/product-hooks.client.tsx` (the hook components)
- Modify:
  - `components/product-page/product-display.client.tsx`: use the provider; the marketplace look is unchanged
  - `_components/store-site.tsx`: `buildContext` takes an optional `product`, passes `{ product }` to `collectCatalogQueries` and excludes the product page from `ctx.pages`
  - `storefront/[subdomain]/products/[slug]/page.tsx`
  - the store sitemap: exclude `kind: "product"`
  - `pages/[pageSlug]/page.tsx`: 404 for the product page slug
- Test: `apps/ecommerce/lib/store-site/product-detail.lib.test.ts`, `apps/ecommerce/components/product-page/product-page-provider.test.tsx`

**Interfaces:**
- Consumes: Tasks 1, 3, 4, 5.
- Produces:
  - `ProductPageProvider({ product, children })`
  - `useProductPage(): { variant: ProductVariant | null; selectVariant(id): void; inCart: boolean }`
  - `StoreProductPage({ store, site, locale, product }): Promise<ReactNode>`

- [ ] **Step 1: Write failing tests:**
  - `toProductDetail maps price, variants, images, sanitised content`
  - `toProductDetail product without variants has []`
  - `selecting variant updates every subscriber`
  - `?variant= deep link selects on mount`
  - `buildContext excludes product page from nav`
- [ ] **Step 2:** Run with `pnpm --filter ecommerce test`. Expect FAIL.
- [ ] **Step 3: Implement.**
  - Lift `selectedVariantId`, `VariantDeepLink`, `handleVariantChange` and the in-cart check out of `ProductDisplay` into the provider, with no behaviour change.
  - The hook components wrap today's `ProductImages`, `PriceTicket`, the variant carousel, `ProductActions` (with the sticky mobile bar when `stickyMobile`) and `ProductTabsWrapper`. Each reads `useProductPage()` and takes node props.
  - In the route: if `productPageOf(site)` exists, render `<ProductPageProvider><StoreProductPage/></ProductPageProvider>` plus `ProductStructuredData` and `MetaViewContent` once. Otherwise render today's JSX unchanged. `resolveStoreProduct` and `generateMetadata` stay unchanged.
- [ ] **Step 4:** Tests pass.
- [ ] **Step 5: Manual E2E on a staging store** (record it in PLAN.md §23):
  - variant switch, the `?variant=` link, add to cart, buy now, the sticky mobile bar
  - an out-of-stock variant
  - a store with no product page shows the old layout
  - the offline store page is unchanged
- [ ] **Step 6: Commit** `feat(ecommerce): render store product page from the site`.

### Task 11: Builder support

**Files:**
- Modify:
  - `packages/store-editor/src/panels/pages-panel.client.tsx`: pin the product page after Home with a badge; no delete or slug edit
  - `packages/store-editor/src/panels/add/add-panel.client.tsx`: the `product` group only when the active page `isProductPage`
  - `packages/store-editor/src/editor.client.tsx`: `ctx.product` = the preview product, or `DEMO_PRODUCT`
  - `packages/store-editor/src/lib/editor-data.lib.ts`
  - the dashboard editor server: `apps/dashboard/app/(builder)/stores/[storeId]/editor/server/editor.server.ts`
  - `apps/dashboard/messages/{ar,en}.json` and the store-editor copy
- Create:
  - `packages/lib/src/store-sites/preview-product.server.ts`: `getStorePreviewProduct(sellerId: string, storeId: string, productId?: string): Promise<ProductDetail | null>`. It checks ownership, picks the newest active product in the store's catalog when `productId` is absent, and is uncached.
  - `packages/store-editor/src/canvas/preview-product-picker.client.tsx`
- Test: `packages/lib/src/store-sites/preview-product.integration.test.ts`, plus a store-editor unit test for pages-panel ordering

- [ ] **Step 1: Write failing tests:**
  - `getStorePreviewProduct rejects another seller's store`
  - `foreign productId returns null`
  - `no products returns null`
  - `pages panel orders home, product, rest`
- [ ] **Step 2:** Run. Expect FAIL.
- [ ] **Step 3: Implement.**
  - Share the `ProductDetail` mapping with Task 10 by moving `toProductDetail` to `packages/lib/src/store-sites/product-detail.lib.ts` if the dashboard needs it. Both apps import it from there.
  - The Admin template and library editors pass `DEMO_PRODUCT`.
- [ ] **Step 4:** Tests pass.
- [ ] **Step 5: Manual check:**
  - edit the product page, switch the preview product
  - restyle the buy box, delete and re-add `product-related` from the library
  - publish, and see the change live
- [ ] **Step 6: Commit** `feat(store-editor): edit the product page`.

### Task 12: Seed, apply and template preview

**Files:**
- Modify:
  - `packages/lib/src/stores/starter-site.server.ts` (insert `kind` and `showInNav: false`)
  - `packages/lib/src/store-sites/templates.server.ts` (the page insert in apply ≈L378 writes `kind`)
  - `packages/store-sections/src/templates/apply.ts` (`DraftPage` carries `kind`; match the product page by kind)
  - `apps/ecommerce/app/[locale]/(template-preview)/template-preview/[key]/[[...page]]/page.tsx` (`product` renders the product page with `DEMO_PRODUCT` and the demo catalog)
- Test: `packages/store-sections/src/templates/apply.test.ts`, `packages/lib/src/stores/scaffold.integration.test.ts`

- [ ] **Step 1: Write failing tests:**
  - `apply adds product page when store has none`
  - `apply replaces product page sections by kind, keeps override keys`
  - `seedStarterSite creates the product page with kind product, not in nav`
- [ ] **Step 2:** Run. Expect FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4:** Tests pass. Check that `template-preview/classic/product` renders.
- [ ] **Step 5: Commit** `feat: product page in seed, apply and template preview`.

### Task 13: Template product-page migration

**Files:**
- Create:
  - `packages/store-sections/scripts/template-product-page-sql.ts`
  - `packages/store-sections/src/templates/product-page-sql.ts` (`templatesProductPageSql(templates: readonly TemplateDefinition[], migrationName: string): string`)
  - `packages/db/migrations/0101_template_product_pages.sql`
- Modify: `packages/store-sections/package.json` (script `template:product-page-sql`)
- Test: `packages/store-sections/src/templates/product-page-sql.test.ts`

- [ ] **Step 1: Write failing tests:**
  - `sql per template appends page only when no kind product page exists` (the generated SQL contains the guard `NOT EXISTS (SELECT 1 FROM jsonb_array_elements(cur.config->'pages') p WHERE p->>'kind' = 'product')`)
  - `inserts version max+1 and repoints current_version_id`
  - `draft_config gets the page appended under the same guard`
  - `page json validates`
- [ ] **Step 2:** Run. Expect FAIL.
- [ ] **Step 3: Implement.** One statement block per template key, all in one transaction. Each one:
  - takes the current DB config
  - appends the code page with `jsonb_set(config, '{pages}', (config->'pages') || '<page json>'::jsonb)`
  - inserts a `template_versions` row with version `max+1`, `changelog = 'product page'`
  - updates `templates.current_version_id`
  - also sets `meta = jsonb_set(meta, '{pageNames,product}', …)`

  Generate `0102`.
- [ ] **Step 4:** Tests pass. Apply `0102` on staging. Run it a second time and confirm it changes nothing. Log both.
- [ ] **Step 5: Commit** `feat(db): add product pages to DB templates`.

### Task 14: Backfill existing stores

**Files:**
- Create:
  - `packages/lib/src/store-sites/backfill-product-page.server.ts` (`backfillStoreProductPage(q: Queryable, storeId: string): Promise<"added" | "skipped">`)
  - `packages/lib/scripts/backfill-product-pages.ts` (loops all stores; `--dry-run`; prints a summary)
- Test: `packages/lib/src/store-sites/backfill-product-page.integration.test.ts`

**Interfaces:**
- Consumes:
  - the DB template's current config (`templates.key = stores.templateKey`), falling back to the `is_default` template, then the code `DEFAULT_TEMPLATE`
  - `productPageOf`
  - `prepareTemplateForStore`

- [ ] **Step 1: Write failing tests:**
  - `adds draft row and appends to latest published revision`
  - `draft-only store gets draft row only`
  - `second run skipped`
  - `unknown templateKey falls back to classic`
  - `seller's other drafts untouched`
- [ ] **Step 2:** Run. Expect FAIL.
- [ ] **Step 3: Implement.**
  - Process one store per transaction, locking the store row.
  - Insert the `store_pages` row with `ON CONFLICT DO NOTHING`.
  - Update the latest `store_site_revisions.snapshot` in place by appending the page. This is not a new revision, so it doesn't count as a publish by the seller. Re-validate with `validateSiteConfig` before writing.
  - After commit, bust the store's published-site cache tags (`packages/cache/src/tags.ts`).
- [ ] **Step 4:** Tests pass. Run `--dry-run`, then the real run, on staging. Check two stores live. Log the counts.
- [ ] **Step 5:** **Stop and ask the owner** before running `0100`–`0102` and the backfill on production. Then run them and log the result.
- [ ] **Step 6: Commit** `feat: backfill product pages for existing stores`.

### Task 15: Docs and final verification

**Files:** `PLAN.md` (§22 checklist task, §23 log), `CLAUDE.md` (rule 6 migration notes: next number `0103`, plus the `0100`–`0102` status), the spec (any deviations), `docs/superpowers/specs/2026-10-19-tree-sections-design.md` §6 (product elements note).

- [ ] **Step 1:** Update the docs.
- [ ] **Step 2:** Run `pnpm lint && pnpm typecheck && pnpm test`. Everything passes.
- [ ] **Step 3: Commit** `docs: template product pages`.
