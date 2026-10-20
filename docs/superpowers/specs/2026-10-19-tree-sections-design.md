# Tree sections: every section built from elements — design

Date: 2026-10-19. Status: final draft for owner approval. Related: [`docs/website-builder.md`](../../website-builder.md)
(Phase 4B), `PLAN.md` P4B-05 / P4B-13 / P4B-16.

## 1. Intent

The owner tried to select a wrapper `div` in a pre-built section and could not, and tried to drag a component from
one section into another and could not. Pre-built sections are hand-coded React with props; only their "parts"
(title, text, button, image) are selectable, and parts can only move between slots of the same section.

The owner's decision: **every section and template on a seller's website is built the same way as custom sections —
an element tree** — so every element, parent and child, is selectable, styleable, movable and draggable, including
into other sections. The Valorcy `defineSection` example (component + slots + blocks + item schemas) was given as a
reference to improve on, not to copy: in it the cards and decorations are still fixed chrome.

## 2. Goals, non-goals, anti-goals

**Goals**

- A pre-built section is a **starting design**: a tree of element nodes. After insertion there is no difference
  between a "pre-built" and a "custom" section.
- Every rendered element is a node: selectable on the canvas and in Layers, styleable per device, duplicable,
  deletable, wrappable, and draggable into any container in any section on the page.
- Store data (products, categories, brands, reviews, forms, menu, coupons, contact, social, payments, blog posts)
  comes from **data nodes** that are themselves nodes, with an editable item template.
- All sections — the 14 library sections, the older coded sections and Tallaby Classic — are rebuilt this way
  (owner decision, 2026-10-19).
- One set of written rules for authoring sections (§6), so every future design is fully customizable by construction.

**Non-goals**

- Seller HTML, CSS text, JS or iframes (rule 9 — unchanged).
- Free absolute positioning by mouse (Figma-style canvas). Layering is allowed through whitelisted style values only.
- AI generation, AI hints, industry/goal metadata (the Valorcy `aiHint`, `industries`, `trustWeight` fields).
- Pushing design updates into sections a seller already inserted (see §5.8).

**Anti-goals (a failure even if it works)**

- Sellers easily breaking mobile layouts: every design must ship correct tablet/mobile styles.
- A data node resolving another store's products, forms or media.
- Editor code in the storefront bundle; losing server rendering.

## 3. Constraints

- `@workspace/store-sections` stays server-renderable, no hooks, no editor imports (boundary test).
- Validation + sanitize on save **and** publish (`validateSiteConfig`, `sanitize`); every new node prop is validated
  there (ids belong to the store, links through `safeHref`, media paths to the seller).
- Schema changes are additive (`SITE_CONFIG_VERSION` stays 1 unless unavoidable); old revisions and templates keep
  rendering.
- i18n: Arabic is the default; node text lives in `props`, other locales in `props.translations[locale]`
  (`core/locale.ts`, already used by custom sections).
- Caching rules unchanged (rule 8). No DB migration is needed for the tree format itself.
- **Rule 12 changes:** CLAUDE.md says to keep Tallaby Classic as it is. The owner has now approved rebuilding
  Classic as trees. Its look must stay the same, and CLAUDE.md rule 12 and `docs/website-builder.md` §3 get updated
  to say so.

## 4. What exists (verified 2026-10-19)

- Element tree: `ComponentNode` (`config/schema.ts`), registry of 19 types (`elements/registry.ts`), pure tree ops
  (`elements/tree.ts`), server renderer (`elements/render.tsx`), whitelisted per-breakpoint styles scoped by
  `data-node-id` (`elements/style.ts`), layout presets (`elements/presets.ts`), limits 300 nodes / depth 8.
- `custom-section` renders `instance.componentTree`.
- Editor: selection + overlays, Layers, Style panel, inline text edit, image replace, clipboard, `@dnd-kit` drag of
  nodes within/between custom sections (`editor/dnd/drop-plan.lib.ts`); elements dropped on a coded section go into a
  new custom section next to it.
- Coded sections: 14 library sections (`sections/library/<category>/`), 22 older ones (`sections/*.tsx`), 5 Classic
  parts that hand rendering to ecommerce via `ctx.renderClassic`.
- Data for coded sections comes from `catalogQuery(props)` per section, results in `ctx.catalog` keyed by instance id.

## 5. Design

### 5.1 Instance model

A tree section is a `custom-section` instance whose `componentTree` has **one root node of type `section`**. The
root node carries what the section shell does today (background colour/image, scheme, padding, width, anchor,
entrance animation), so the section background is selectable and styleable like everything else.

Additive field on `sectionInstanceSchema`: `source?: string` (e.g. `"stats-cards@1"`) recording which design the
section started from (Add-panel analytics, "insert the newer version", tests). It never changes rendering.

Old `custom-section` instances without a `section` root keep rendering as today (the renderer wraps them in the old
`<section>` padding).

### 5.2 Authoring format (replaces `SectionDefinition` + `Component` for designs)

A design is data, written with a small typed builder in `packages/store-sections/src/designs/<category>/<id>.ts`:

```ts
export const statsCards = defineDesign({
  id: "stats-cards", version: 1, category: "statistics", subcategory: "counters",
  name: L("أرقامنا", "By the numbers"),
  description: L("…", "…"),
  keywords: ["stats", "numbers", "أرقام"],
  tree: (t) =>
    t.section({ label: L("أرقامنا", "Stats"), style: { background: "muted", paddingY: "lg" } }, [
      t.pattern("grid", { style: { opacity: 0.6 } }),
      t.container([
        t.stack({ label: L("العنوان", "Heading"), style: { alignItems: "center", textAlign: "center", gap: 12 } }, [
          t.badge(L("بالأرقام", "By the numbers")),
          t.heading(L("ثقة بنيناها طلبًا بعد طلب", "Trust built order by order"), "h2"),
          t.paragraph(L("…", "…")),
        ]),
        t.grid({ label: L("الأرقام", "Stats"), columns: { desktop: 4, mobile: 2 }, style: { gap: 16 } },
          STATS.map((s) => t.card([t.heading(s.value, "h3", { size: "display" }), t.text(s.label), t.text(s.sub)])),
        ),
      ]),
    ]),
});
```

- `L(ar, en)` text becomes `props.text` (Arabic) + `props.translations.en.text`.
- The builder output is the existing `NodeTemplate`; insertion uses `fromTemplate` (fresh ids).
- Repeated content (stats, FAQ items, badges, features) is plain repeated child nodes, not an item collection.
- Library presets (`library/presets/*.ts`) point at a design id instead of a `sectionId`; variants are separate
  designs (or a design factory with options), never runtime props.
- The Add-panel thumbnail renders the design tree live, as today.

### 5.3 Element set

Existing 19 types stay. Additions (all must be added to `ALLOWED_NODE_TYPES` where missing, the registry, renderer,
sanitize and validate):

- **Structure:** `section` (root), `card`, `pattern` (fixed decorative backgrounds: grid, dots, gradient blobs —
  aria-hidden), `accordion` / `accordionItem` (native `<details>`), `carousel` (scroll-snap row, no script).
- **Store chrome:** `storeLogo`, `storeName`, `navMenu` (pages or custom links), `mobileMenu` (`<details>` drawer),
  `cartButton`, `accountButton`, `searchBox`, `languageSwitcher`.
- **Footer data:** `socialLinks`, `policyLinks`, `paymentMethods`, `contactInfo`, `copyright`.
- **Commerce data (lists):** `productList`, `categoryList`, `brandList`, `reviewList`, `postList` (blog/CMS),
  `productCatalog` (the shop page: search, filters, paging driven by the host).
- **Commerce data (single):** `couponCode`, `countdown`, `storeForm` (bound form id), `featuredProduct`,
  `reviewSummary`.
- **Inside list templates:** `addToCart`, `wishlistButton`, `price`, `ratingStars`, `saleBadge`, `stockLabel`.

**Data lists and bindings.** A list node has data props (source, category id, product ids, sort, limit, display
grid/carousel) and exactly one child: the **item template**. Inside the template, `text`, `heading`, `image`,
`linkBlock` and `textLink` nodes may carry `props.bind` naming a field from a fixed per-list field set
(`product.title|image|href|price|compareAtPrice|rating`, `category.name|image|href|productCount`, …). The renderer
repeats the template once per record and fills bound props. The seller edits the template once; every item follows.
Bound nodes may move anywhere inside their template, not outside it (the drop plan refuses, with a message).

**Data queries.** Instead of `catalogQuery(props)` per section, the host walks each tree and collects one query per
data node, keyed by node id (`ctx.catalog.products[nodeId]`, …). Same query kinds and limits as today; validation
checks every id in data props belongs to the store.

### 5.4 Styles

Keep the whitelist approach (`elements/style.ts`). Additions needed for real designs:

- Layering: `position` (relative/absolute/sticky), `inset*` (px, %), `zIndex` (0–10), `overflow`.
- Backgrounds: `backgroundImage` (seller media only), `backgroundSize/Position`, `gradient` from a fixed token list.
- Type: fluid display sizes (`display-sm|md|lg`, clamp-based), `letterSpacing`, `textTransform`, `fontFamily`
  (heading/body token only).
- Box: per-side border widths, `radius` per corner, `colSpan`/`rowSpan`, `order`, `flexGrow`, `transform` scale/rotate
  from fixed steps.
- States: a `hover` style layer for colour, background, border colour, opacity, shadow and scale.
- Theme tokens (`--sf-brand`, `--sf-ink`, `--sf-muted`, `--sf-paper`, `--sf-shelf`, `--sf-line`) stay the defaults
  every design uses, so a Brand change restyles every section.

### 5.5 Editor behaviour

- Every node is selectable, appears in Layers with its `label` (or its type name), and has Content + Style tabs.
- Drag and drop: any node into any container node of any section (same rules as today: no link inside link,
  `childTypes`, depth and node limits, bound nodes stay inside their template). Elements dropped between sections
  create a new tree section.
- "Add item" on any container whose children are alike (grid of cards, accordion, list) duplicates the last child.
- Limits: raise `MAX_NODES_PER_SECTION` to 400 and `MAX_ELEMENT_DEPTH` to 12 (designs reach depth ~10 with a product
  card inside a list). Validation enforces both.
- Section-level quick edit: selecting the root lists its text and image nodes for fast filling (convenience only).

### 5.6 Rendering

One renderer (`renderElementTree`) draws every section. Interactive bits stay script-free (`<details>`, scroll-snap)
or go through existing host hooks (`ctx.renderAddToCart`, `renderWishlistButton`, `renderCartButton`,
`renderAccountButton`, `renderForm`, `renderCountdown`, plus new `renderSearch`, `renderLanguageSwitcher`,
`renderCatalogControls` for `productCatalog`). Empty data nodes show the existing `DataEmpty` hint in the editor and
nothing on the storefront.

### 5.7 Existing pages, templates and Classic

Owner, 2026-10-19: **there are no sellers yet**, so existing websites need no protection. This removes the
backward-compatibility work:

- **No long-lived coded sections.** Once a section type has its design, its coded version is deleted (registry,
  inspector code, snapshot tests). Old ids stay known only to the converter below.
- **Auto-convert on open (owner choice):** when the editor opens a page, every coded instance is replaced in the
  draft by its design tree, carrying the seller's text, images, links and item lists across by content role
  (`props.role`). Best effort, no parity harness: these are test stores. An unknown section id becomes an empty
  tree section with a notice. Published test stores show nothing for removed coded sections until they are
  opened and published again (accepted: no real sellers).
- **Templates:** template versions are regenerated from designs (`templates/*.ts`, `classic-sql.ts`); old rows may be
  replaced on staging. Production still has none to protect, but any DB write still goes through the owner (rule 4).
- **Tallaby Classic:** rebuilt as designs that look the same as today (side-by-side check at 375 / 768 / 1280, AR and
  EN, before the coded Classic parts are removed).

### 5.8 Design updates (owner accepted)

An inserted section is the seller's own copy. Later improvements to a design do not change existing copies; the
seller can insert the newer version (the `source` field lets the editor say "a newer version of this design exists").

## 6. Rules for every section design

1. Built only from registry nodes via `defineDesign`; no React component, no fixed markup.
2. Every container node has a `label` (AR + EN) so Layers reads like the design ("Heading", "Stats", "Card").
3. Colours, fonts and radius use theme tokens; no hard-coded colours except inside a design's own decoration.
4. Responsive by construction: desktop styles plus tablet/mobile overrides in the design; checked at 375, 768, 1280.
5. All text in Arabic and English; RTL-safe (logical properties only: start/end, never left/right).
6. Store data only through data nodes; never baked-in product names or ids.
7. Every data node has an editor empty state and renders nothing publicly when empty.
8. Decoration is a node too (`pattern`, `card`, image frames), so it can be restyled or deleted.
9. Within limits: ≤ 400 nodes, depth ≤ 12; a snapshot test per design; the boundary test passes.
10. No scripts, iframes, HTML strings or CSS text; links via `safeHref`, images via `ctx.imageUrl`.

## 7. Suggested order (for the plan)

1. Schema + validation (`section` root, `source`, limits, `bind`, new node types).
2. Style additions.
3. `defineDesign` builder + rebuild one design end to end (stats-cards) + editor support for root/labels/add item.
4. Data nodes and bindings (product list first), host query collection.
5. Rebuild the other 13 library designs; switch presets.
6. Chrome nodes, header/footer designs.
7. Editor auto-convert on open (content by role) and removal of each coded section once its design exists.
8. Older coded sections, then Classic (parity check), then templates.
9. Docs: CLAUDE.md rule 12, `docs/website-builder.md`, PLAN.md tasks.

## 8. Calls made by Claude (owner can override)

- Tree sections reuse `custom-section` with a `section` root instead of a new section id.
- Item collections become repeated child nodes; data lists use one item template with bindings.
- Absolute/sticky positioning only through style values, no free drag-to-position.
- Hover style layer included; other states (focus, active) not.
- Limits raised to 400 nodes / depth 12.
- Valorcy AI metadata (aiHint, industries, weights) not carried over.
- **Content roles (keeps existing features, rule 3):** nodes may carry `props.role` (`eyebrow`, `title`, `subtitle`,
  `body`, `cta`, `image`, `items`, …). Switching a section to another design, `chromeFromPreset`, card presets and
  template merge (`mergeSectionInstance` / `contentOverrideKeys`) move content by role instead of prop key. Designs
  set roles on their main nodes; the `role` survives seller edits.
- **Locale:** design text is authored as `L(ar, en)`; on insertion and conversion the site's `defaultLocale` text goes
  into `props` and the other into `translations` (swapped when the default is English).
- **Header and footer:** they are trees like any section, but stay site-wide. Nodes are not dragged between chrome
  and page sections (copy/paste works); chrome nodes (`navMenu`, `cartButton`…) are allowed in page sections; data
  nodes in chrome get their own query collection in `StoreSiteChrome`.
- **Classic:** its home catalog's product card becomes an editable item template; variant-aware add to cart,
  wishlist, search, filters and paging stay host-drawn through hooks, as nodes the seller can move and style. The
  reserved `/products` route is not a builder page and is out of scope.
- **Parity bar:** only Classic gets a side-by-side visual check; converted test-store sections are best effort.
