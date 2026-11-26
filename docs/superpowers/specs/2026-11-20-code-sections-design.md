# Code sections (custom CSS + Liquid) — design

- **Feature:** ROADMAP.md F-101 (owner request and approval 2026-11-20; every seller, Free and Pro).
- **Rule:** CLAUDE.md rule 9 (HTML + Liquid + CSS only, server-rendered, cleaned, scoped, no JavaScript, never on checkout).
- **Status:** design approved by the owner 2026-11-20 (§10). Shopify-alignment revision §11 added 2026-11-26, waiting for the owner (§11.7). No code. Nothing in this note is built.

## 1. Goal

Sellers, their developers and the AI builder can make a section the visual elements can't make, without losing the drag-and-drop builder:

- The page stays an element tree (rule 17). Reorder, delete, templates, publish and every existing store are unchanged.
- A new **`code`** element holds Liquid HTML, CSS, a settings schema and the settings values. Its schema fields show in the inspector, so the seller edits a developer's section with no code.
- Every element and section can take **custom CSS**, scoped to itself.

Not in scope: JavaScript (never), full Liquid themes, a developer CLI, a theme marketplace, converting existing templates, Liquid on cart or checkout.

## 2. What the code has today (checked 2026-11-20)

| Area | Today | File |
|---|---|---|
| Node shape | `ComponentNode { id, type, props, children, style?, breakpointStyles?, layout? }`; `props` is a loose record | `packages/store-sections/src/config/schema.ts:112-132` |
| Node types | `ALLOWED_NODE_TYPES`; `customCode` left out on purpose (comment :21-25); "no seller CSS" comment :286 | `schema.ts:26-69` |
| Element registry | `DEFINITIONS` (fields, container, defaults); limits 400 nodes, depth 12 | `src/elements/registry.ts:347-1327, :1405` |
| Renderer | server-only `renderNode` switch, no hooks | `src/elements/render.tsx:683-1252` |
| Data binding | `productList`/`categoryList`/`postList` repeat children; `product` scope on the product page; queries collected up front by `nodeCatalogQuery` | `src/elements/data.ts:32-137`; `apps/ecommerce/.../_components/store-site.tsx:112-207` |
| Styles | fixed key/value list → one `<style>` per page, selectors `.site-root [data-section-id] [data-node-id]`, `escapeStyleBlock` | `src/elements/style.ts:88-142, :359-417, :645-678` |
| Sanitizer | `sanitize-html` (`RICH_TEXT_OPTIONS`, `ARTICLE_OPTIONS`), `sanitizeStyle` | `src/config/sanitize.ts` |
| Storage | `store_pages.draft_content` jsonb, `store_site_revisions.snapshot` jsonb, 2 MB cap, `validatePageContent` on save, `validateSiteConfig` on publish | `packages/db/src/drizzle/schema.ts:2803-2843`; `config/validate.ts:46-113`; `packages/lib/src/store-sites/server.ts:159, :317` |
| Inspector | field switch on `PropDefinition` types (text, textarea, number, switch, select, color, image, category, product, products, …) | `packages/store-editor/src/inspector/editor-inspector.client.tsx:98-262`; `src/core/types.ts:23-80` |
| Canvas | `<iframe>` with no `src` (same origin as the dashboard); real `SectionRenderer` portalled in | `store-editor/src/canvas/editor-canvas.client.tsx:603-612` |
| AI | builder picks a template and fills text slots; never builds a tree or writes HTML | `apps/dashboard/.../ai-builder/builder-copy.lib.ts`; `packages/agent/src/skills/design.ts` |
| Cart, checkout | fixed app pages, not trees | `apps/ecommerce/lib/storefront-routing.ts:75-85` |
| Dependencies | no template engine; `sanitize-html` ^2.17.0 only | `packages/store-sections/package.json:101` |

**Security facts that shape this design:**

1. The Supabase session cookie is shared by every `*.tallaby.com` host, including the dashboard (`packages/lib/src/storefront/cookie-domain.lib.ts:11-16`; `apps/dashboard/supabase/server.ts:11`). Custom domains get a host-only cookie.
2. Checkout, orders and profile are served on the store's own host, so they share an origin with builder pages.
3. Storefronts and the dashboard send **no Content-Security-Policy** (`apps/ecommerce/next.config.mjs:40-71`).
4. The builder canvas iframe has the dashboard's origin.

So **one gap in cleaning code output is an account takeover** of shoppers on the store and of the seller in the dashboard. Cleaning is not optional polish: it is the feature. §7 adds defence in depth so a sanitizer bug is not enough on its own.

## 3. Data model (no migration)

### 3.1 The `code` element

A new leaf element type `code` (in `ALLOWED_NODE_TYPES`, `ElementType`, `DEFINITIONS`, `renderNode`). It is a leaf: `children` is always empty.

```ts
type CodeNodeProps = {
  apiVersion: 1;                  // data API version (§4.4), set by the code, never by the client
  source: string;                 // Liquid HTML, ≤ 64 KB
  css?: string;                   // ≤ 32 KB, scoped at render (§6)
  schema: CodeSettingDef[];       // ≤ 40 settings
  settings: Record<string, unknown>; // values, validated against `schema`
  name?: string;                  // shown in the layers panel
};

type CodeSettingDef = {
  id: string;                     // /^[a-z][a-z0-9_]{0,39}$/, unique
  type: 'text' | 'textarea' | 'richtext' | 'number' | 'switch' | 'select'
      | 'color' | 'image' | 'link' | 'product' | 'products' | 'category';
  label: { ar: string; en: string };
  default?: unknown;
  options?: { value: string; label: { ar: string; en: string } }[]; // select
  min?: number; max?: number;     // number; products ≤ 24
};
```

- `text`, `textarea` and `richtext` values are stored per language, the same way other localized props are, so a section shows Arabic and English (rule 13).
- Each setting maps to an existing inspector field type (`PropFieldType`), so the inspector needs no new field type. It builds the fields from `schema` instead of from `DEFINITIONS`.
- A `code` node can sit anywhere a leaf can: inside a section, a box, or **inside a `productList`**. There it gets that product as `product`, so a developer can design a custom product card and still use the built-in list, filters and paging.

### 3.2 "Code section" preset

The Add panel gets a **Code section** entry: `section → code`. It's a normal preset, not a new section kind, so drag, reorder, hide per device and section styles all still work.

### 3.3 Custom CSS on any element or section (F-101b)

- A new optional `customCss` string (≤ 8 KB) on `ComponentNode` and on the section instance (`sectionInstanceSchema`). Both comments that say "no custom CSS" change.
- It is scoped to that node (§6). In the inspector it sits in an **Advanced** group, closed by default.
- Answers the open owner question with the default **per element + per section; no store-wide CSS in v1**. A store-wide stylesheet can come later, scoped to `.site-root`, using the same scoper.

### 3.4 Storage

Everything lives in the existing jsonb (`draft_content`, `shared_header`/`shared_footer`, revision `snapshot`), so **no migration**. Size budget: a page with 10 code sections at the caps is ~1 MB, under the 2 MB page cap. `validate.ts` also gets a per-page total of ≤ 400 KB of `source` + `css`.

## 4. Rendering

### 4.1 Engine

`liquidjs` (MIT, no dependencies, sync and async APIs) in `packages/store-sections`, server-only module `src/code/liquid.server.ts`. One shared `Liquid` instance:

| Option | Value | Why |
|---|---|---|
| `fs` / `root` | none; `include`, `render`, `layout` tags **unregistered** | no file access, no template loading |
| `ownPropertyOnly` | `true` | no `constructor`/`__proto__` walking |
| `strictFilters` | `true` | unknown filter = parse error the author sees |
| `strictVariables` | `false` | a missing field renders empty |
| `outputEscape` | `'escape'` | every `{{ }}` is HTML-escaped; `\| raw` only for already-cleaned HTML fields |
| `parseLimit` | 64 KB | matches the source cap |
| `renderLimit` | 50 ms per node | a slow loop can't stall the page |
| `memoryLimit` | 1e6 | caps string building and huge loops |
| `cache` | parsed templates kept in an LRU (500), keyed by sha256 of `source` | parse once per process |

Tags kept: `if/elsif/else/unless`, `case/when`, `for` (with `limit`, `offset`, `reversed`), `assign`, `capture`, `comment`, `raw`, `cycle`, `increment`. Dropped: `include`, `render`, `layout`, `block`, `tablerow`, `liquid`, `echo`.

The renderer switch is synchronous, so the node uses `parseAndRenderSync` on data that was fetched beforehand (§4.3). Liquid can't start a query.

### 4.2 Output cleaning (authoritative)

Every render result goes through `sanitizeCodeHtml` (new `CODE_HTML_OPTIONS` for `sanitize-html`) **after** Liquid runs, because a template can assemble tags across conditions (`<scr{% if x %}ipt>`). Save-time checks (§5) are for the author's errors only; render-time cleaning is the security boundary.

- **Allowed tags:** layout and text (`div section article header footer aside nav main span p a h1–h6 ul ol li dl dt dd strong em b i u s small mark br hr blockquote figure figcaption picture source img table thead tbody tfoot tr th td caption details summary time`). Also an SVG subset: `svg g path circle ellipse rect line polyline polygon defs linearGradient radialGradient stop title`, with no `href`/`xlink:href`, `use`, `foreignObject`, `animate` or `set`.
- **Removed with their content:** `script style iframe frame object embed base meta link form input button select textarea noscript template math`. There are no forms: newsletter and contact stay the built-in `form` node. That removes credential phishing on a cookie-sharing origin.
- **Attributes:** `class`, `id` (prefixed `c-<nodeId>-`), `title`, `alt`, `width`, `height`, `loading`, `dir`, `lang`, `role`, `aria-*`, `data-*`, `colspan/rowspan`, `datetime`, `open`, SVG presentation attributes. `style` goes through `sanitizeStyle`. No `on*` attributes at all.
- **URLs:** `href` must be `https:`, `http:`, `mailto:`, `tel:`, `#…` or relative. `img src` and `source srcset` must be `https:` or relative. `target="_blank"` gets `rel="noopener noreferrer"`.
- The cleaned HTML goes into one wrapper: `<div data-node-id="…" class="code-node">` with `dangerouslySetInnerHTML`, the same pattern as `product-elements.tsx:606`.

### 4.3 Data for a code node

Liquid only reads data the page already fetched in `buildContext`. Each code node adds its needs to the existing collectors, with no per-node queries and no N+1:

| Liquid object | Source | Notes |
|---|---|---|
| `section.settings.<id>` | node `settings`, localized to the request locale | `product`/`products`/`category` settings resolve to the objects below |
| `product` | list scope or product-page scope (`scopedProps`) | null elsewhere |
| settings of type `product`, `products` (≤ 24), `category` (with ≤ 24 products) | added to `nodeCatalogQuery` → `resolveStoreCatalog` | same store only (rule 5): ids not in the store resolve to nothing |
| `store` | store row already in the context | `name`, `url`, `logo`, `currency`, `locale`, `dir` |
| `request` | locale and page kind | `locale`, `dir`, `page_type` |

The product object is a fixed DTO (`src/code/liquid-objects.ts`) built from the catalog row: `id, title, url, price, compare_at_price, on_sale, in_stock, images[] {url, alt}, featured_image, vendor (brand), category {name, url}, rating, review_count, variants[] {title, price, in_stock}` (≤ 50). It has **no** cost price, stock numbers, seller ids or internal fields. Prices are store-currency numbers; the `money` filter formats them.

### 4.4 Data API versioning

`apiVersion: 1` is frozen once shipped. Fields are only ever added; a rename or removal needs `apiVersion: 2` while version 1 keeps rendering. The objects and filters are documented in `docs/code-sections.md` (F-101h), and the version-1 DTO has a snapshot test.

### 4.5 Filters

- liquidjs standard string, array, math and date filters (safe; no I/O).
- New: `money` (store currency, store locale), `image_url: width` (our image resize URL), `t` (picks `ar`/`en` from a localized value), `product_url`, `category_url`.

### 4.6 Errors

- **Live store:** a parse, limit or render error renders nothing for that node, logs one line (store id, node id, error kind; never the template) and never breaks the page.
- **Builder:** the canvas shows a small red box with the error and line number.

### 4.7 Caching and performance

- The published site config is already cached (`published-site.server.ts`, tag `storeTags.site`). Rendering happens per request, inside that path.
- Parsed templates are cached by source hash (§4.1). The cleaned output of a node is cached in-process for 60 s, keyed by `(storeId, revisionId, nodeId, locale, hash of the data passed in)`. Every key includes the store (rule 8). It's never cached across stores and never cached for previews.
- Budget: ≤ 5 ms median per code node (Liquid + cleaning), measured on a page with 10 code sections. Pages over the limit still render; nodes that hit `renderLimit` are dropped (§4.6).

### 4.8 Where code never runs

- Cart, checkout, orders, profile, payment and auth are app pages, not trees, so code nodes can't appear there. The renderer also refuses `code` when `page_type` is not `page`/`product`.
- Shared header and footer **may** hold a code node (it shows on checkout pages through the shell). **Decision:** in v1 the shell skips code nodes and custom CSS on PASS_THROUGH routes (`storefront-routing.ts:75-85`), so checkout always shows the plain header.

## 5. Save, publish and the builder

### 5.1 Validation

`componentNodeSchema` gets a `code` branch (zod) with the caps in §3.1:
- `schema` ids are unique and valid; `settings` are checked against `schema` (unknown keys dropped, wrong types reset to the default).
- `source` must parse with the restricted engine. Parse errors come back to the editor with line and column.
- Source that contains blocked constructs (`<script`, `on…=`, `javascript:`, `<form`, `<iframe`, `<style`) is **rejected with a clear message**, so the author knows it won't render.
- `customCss` / `css` must parse (§6).

This runs in `validatePageContent` (save), `validateSiteConfig` (publish) and `saveStoreChrome`, so the agent, MCP and AI builder can't skip it.

### 5.2 Editor

- **Inspector**, when a `code` node is selected:
  - **Content** tab: the schema fields, which the seller edits.
  - **Code** tab: a CodeMirror 6 editor (Liquid/HTML mode, CSS mode) for `source`, `css` and the `schema` (a JSON editor with a form view later).
- **Preview:** the canvas never runs Liquid in the browser. A debounced (400 ms) server action `renderCodeNodePreview(storeId, nodeId, draft props)` checks that the store belongs to the session's seller (rule 5), runs the same render and cleaning path with the draft data, and returns the cleaned HTML. The canvas iframe is dashboard-origin, so it only ever receives server-cleaned HTML, the same bytes the live store would get.
- **Strings:** all new UI strings go in `ar.json` and `en.json`.
- **Copy to another store** (owner question 3, default **yes**): copying a section between the seller's own stores uses the existing clipboard path. A copied code node keeps `source`, `css` and `schema`; `product`/`category` settings are cleared, because ids are per store (catalog split, 0163).

### 5.3 Who can edit

Every seller (owner, 2026-11-20). When staff permissions (F-09) land, the Code tab needs the builder-edit permission; a staff member without it sees only the Content tab.

## 6. CSS scoping

New `src/code/scope-css.ts` uses `postcss` (already used by the apps and `packages/emails`; added to `packages/store-sections` as a dependency) and `postcss-selector-parser` (new):

1. Parse. On a syntax error, reject at save and drop at render.
2. Remove `@import`, `@charset`, `@namespace`, `@font-face`, `@document`, `@page`. Keep `@media` (nested rules scoped), `@supports` and `@keyframes`. Keyframe names get the prefix `c<nodeId>-` and `animation(-name)` references are rewritten to match.
3. Every selector gets the scope prefix `.site-root [data-node-id="<id>"]`. `:root`, `html`, `body` and `:host` become the scope itself. `*` becomes `scope *`. A selector that can't be scoped (for example `:has()` reaching upward from the scope) is dropped.
4. Every declaration value goes through the existing `sanitizeStyle` rules: no `expression(`, `javascript:`, `behavior`, `-moz-binding`, `url()` other than `https:` or relative images, no `</`.
5. Output goes into the page's single `<style>` block after `collectPageCss`, through `escapeStyleBlock`.

`position: fixed` is allowed: sticky bars and floating buttons are common. Without forms or scripts, an overlay can't collect anything.

## 7. Defence in depth (ships with F-101c, before code goes live)

Because the cookie is shared (§2), the sanitizer must not be the only wall:

1. **CSP on storefront pages** (`apps/ecommerce/next.config.mjs` headers for storefront routes): `object-src 'none'; base-uri 'self'; form-action 'self' <payment gateway origins>; frame-src https://www.youtube-nocookie.com https://player.vimeo.com <gateway iframes>`. These don't touch scripts, so existing pixels and Next inline scripts keep working. A nonce-based `script-src` is a follow-up (F-101i), because the fixed integration scripts need nonces first.
2. **Same CSP on the dashboard builder route.**
3. **Corpus tests:** an XSS test file (OWASP cheat-sheet vectors, mutation XSS, SVG and `srcset` tricks, Liquid-assembled tags, CSS escapes) runs against `sanitizeCodeHtml` and `scopeCss` in `pnpm test`. A new vector found later is added there first.
4. **Kill switch:** if `platform_switches.code_sections` is off, the renderer skips every code node and all custom CSS on every store, at once, with no deploy. One insert-only migration (`0178_code_sections_switch.sql`, guarded) adds the row, default off. It's turned on after the staging E2E.
5. **Abuse:** Admin's seller page can turn code sections off for one store (`stores.settings.codeSectionsDisabled`, no column). The storefront report link covers phishing reports.

## 8. AI builder (F-101g)

Today no model output becomes markup (§2). Code sections are the first place it does, so:

- **Calls:** one call type, `generateStructured` with a zod schema of `{ source, css, schema, settings }` (rule 20). Input is the seller's request (≤ 600 characters) plus store name, niche and design-system colours. No catalog lists in the prompt. Output is capped at 6 KB of source.
- **Validation:** the output goes through the same validation (§5.1) and render cleaning (§4.2) as a human's. A failed validation is retried once with the error message, then reported to the seller.
- **When the AI uses it:** the AI prefers library designs (trees, every element editable). It writes a code section only when the seller asks for something no design covers, or asks for code. Every text, image and colour must be a schema setting with ar and en values, so the seller can edit it without code.
- **Cost:** tier `fast` first, then measure quality on 20 sample requests. Thinking `minimal`; a daily cap; one AI credit per generation (F-57). The live cost is logged in `PLAN.md` §23.

## 9. Tasks (replace the draft list in ROADMAP F-101)

| Task | What | Deps |
|---|---|---|
| F-101a | This note, owner review | — |
| F-101b | Custom CSS on elements and sections: schema field, `scope-css.ts`, inspector Advanced group, tests | F-101a |
| F-101c | `code` element: schema, registry, liquidjs engine, `sanitizeCodeHtml`, renderer case, data collection, errors, cache, kill switch (0178), CSP (§7.1–7.2), XSS corpus | F-101a |
| F-101d | Liquid objects and filters (§4.3–4.5), version-1 DTO snapshot | F-101c |
| F-101e | Editor: Code tab (CodeMirror), schema → Content tab, server preview action, Code section preset, copy between stores, ar/en | F-101c |
| F-101f | Security review of the whole path (separate reviewer), staging E2E, then switch on | F-101b–e |
| F-101g | AI writes code sections (§8) | F-101e |
| F-101h | `docs/code-sections.md` for developers (objects, filters, limits, examples) and 6 starter code sections | F-101d |
| F-101i | Nonce-based `script-src` CSP on storefronts (follow-up hardening) | F-101f |

Checks for every task: `pnpm lint`, `pnpm typecheck` and `pnpm test` (rule 15).

## 10. Owner decisions (2026-11-20, all defaults accepted)

1. **CSS scope:** per element + per section in v1, no store-wide stylesheet (§3.3).
2. **Copying between stores:** allowed; product and category settings are cleared on copy (§5.2).
3. **Header and footer code:** skipped on cart and checkout pages (§4.8).
4. **Video embeds:** no `<iframe>` in v1; videos use the existing video element. YouTube/Vimeo iframes may be reconsidered later.

## 11. Shopify alignment (revision 2026-11-26, proposed; owner decisions in §11.7)

Owner, 2026-11-26: take Shopify's repos as the main reference, so a section a developer already knows how to write for Shopify mostly works here. Checked on 2026-11-26 against `Shopify/liquid`, `Shopify/theme-tools`, `Shopify/theme-liquid-docs`, `Shopify/dawn` and `Shopify/horizon`.

### 11.1 What we can use, and what we can't

| Repo | License | Use |
|---|---|---|
| `Shopify/liquid` (Ruby) | MIT | The language spec and its safety model. It can't run in Node, so `liquidjs` (MIT, 10.x, built to match Shopify Liquid) stays the engine. |
| `Shopify/theme-liquid-docs` | MIT | JSON Schemas for the section `{% schema %}` (`schemas/theme/section.json`, `setting.json`, `preset.json`) and docs data (`data/objects.json`, `filters.json`, `tags.json`). We copy the *shape* for our own schema and docs. |
| `Shopify/theme-tools` | MIT | `liquid-html-parser` (Liquid + HTML AST), `theme-check-common` / `theme-check-browser` (linter), `codemirror-language-client` + `theme-language-server-browser` (autocomplete, hover and errors in CodeMirror). Candidates for the editor (§11.5). |
| `Shopify/dawn`, `Shopify/horizon` | Shopify-only: "may only be exercised to develop themes that integrate or interoperate with Shopify … All other uses … are strictly prohibited" | **Study only.** Never copy their Liquid, CSS, schema JSON or text into Tallaby. That includes the starter sections in F-101h, which we write from scratch. |

### 11.2 Section file format: one Shopify-style source

A developer writes or pastes one file, the way Shopify sections are written:

```liquid
<div class="hero">{{ section.settings.title }}</div>
{% for block in section.blocks %}<div {{ block.attributes }}>{{ block.settings.text }}</div>{% endfor %}
{% stylesheet %} .hero { padding: 2rem } {% endstylesheet %}
{% schema %} { "name": "Hero", "settings": [], "blocks": [], "presets": [] } {% endschema %}
```

On save, the server splits it into the stored props of §3.1 (`source`, `css`, `schema`), so storage and rendering don't change, and the Code tab shows it joined again. `{% javascript %}` and `<script>` are refused with a clear message (rule 9). The `schema` JSON is validated with our own zod schema, modelled on Shopify's `section.json`.

### 11.3 Schema: Shopify keys, our limits

Keys we support (Shopify names): `name`, `tag`, `class`, `settings`, `blocks`, `max_blocks`, `presets`, `default`. Not in v1: `limit`, `enabled_on`, `disabled_on`, `locales` (§11.4), app blocks and theme blocks (`blocks/*.liquid`, `{% content_for 'blocks' %}`, nested blocks).

**Section blocks are added to v1** (new compared with §3.1). Blocks are repeatable items such as slides, FAQ rows or logos, each with its own settings, and the inspector can add, reorder and remove them. Shopify sections lean on them, so without blocks most pasted sections can't be edited. They're stored as `blocks: { id, type, settings }[]` on the `code` node, up to 50 (fewer if the schema's `max_blocks` says so).

**Setting types use Shopify names**, and each maps to an inspector field we already have:

| Shopify type | Our field | Notes |
|---|---|---|
| `text`, `textarea`, `inline_richtext`, `richtext` | text, textarea, rich text | stored per language (ar/en) |
| `number`, `range` | number | `range` keeps `min`/`max`/`step`/`unit` |
| `checkbox` | switch | |
| `select`, `radio`, `text_alignment` | select | |
| `color`, `color_background` | color | `color_background` is checked by `sanitizeStyle` |
| `image_picker` | image | our media library |
| `url` | link | same URL rules as §4.2 |
| `video_url` | text | YouTube/Vimeo only; renders through our video element (no iframe, §10.4) |
| `product`, `product_list` | product, products | same store only (rule 5) |
| `collection`, `collection_list` | category | a Tallaby category is a Shopify collection |
| `header`, `paragraph` | sidebar heading / help text | holds no value |
| `font_picker`, `color_scheme`, `blog`, `article`, `page`, `link_list`, `metaobject`, `html`, `liquid` | — | not in v1 (`html` and `liquid` settings would let a seller paste raw code into a field) |

Labels may be plain strings or `{ "ar": …, "en": … }`. Shopify's `t:` label keys aren't supported.

### 11.4 Objects, filters and tags: Shopify names where the meaning matches

**Objects.** Names follow Shopify, so pasted code reads our data:
- `section`: `id`, `settings`, `blocks`.
- `block`: `id`, `type`, `settings`, and `attributes` (our name for `shopify_attributes`).
- `product`.
- `collection`: a Tallaby category.
- `shop`: the store; `store` from §4.3 stays as an alias.
- `request`: `locale`, `page_type`, and `design_mode` (true in the builder preview).
- `routes`: `root_url`, `collections_url`, `cart_url`, `search_url`.
- `settings`: the store design system (colours, fonts, radius).
- `localization`: `language`, `direction`.

**Product DTO fields** take Shopify's names: `id`, `title`, `handle`, `url`, `price`, `compare_at_price`, `price_min`, `price_max`, `available` (was `in_stock`), `featured_image`, `images`, `variants[] { id, title, price, available }`, `vendor`, `type`. The Tallaby extras stay: `on_sale`, `rating`, `review_count`. **Prices are in minor units** (piastres or cents), as in Shopify, and `money` formats them. All of this is frozen in `apiVersion: 1`, so it must be settled before F-101d ships.

**Filters.** These use Shopify names:
- Money: `money`, `money_with_currency`, `money_without_trailing_zeros`.
- Media and links: `image_url: width:`, `image_tag`, `link_to`, `placeholder_svg_tag`.
- `t`: built-in storefront strings such as "Add to cart", in ar and en. There are no theme locale files; a section's own text lives in its settings.
- Text: `handleize`, `default`, `escape`.
- Plus the `liquidjs` standard filters.

Not in v1: `asset_url` (there are no theme assets), `stylesheet_tag`, `script_tag`, `payment_*`, `customer_*`.

**Tags.** Changes from §4.1:
- **`liquid` and `echo` are allowed.** They are syntax only, and Shopify code uses `{% liquid %}` a lot.
- `stylesheet` and `schema` are parsed at save (§11.2).
- Still dropped: `javascript`, `render`/`include` (no snippets in v1), `form`, `paginate`, `section`, `sections`, `content_for`, `layout`, `tablerow`.

**Safety settings, from Ruby Liquid to `liquidjs`:**
- `error_mode: :strict2` → strict parsing at save; a parse error blocks the save.
- `strict_filters` → `strictFilters: true`.
- `render_score_limit` and `render_length_limit` → `renderLimit` and `memoryLimit` (§4.1).

Shopify objects we don't have (`cart`, `customer`, `metafields`) render empty, as in §4.1. They never cause an error on the live store.

### 11.5 Editor tooling to try first (spike in F-101e)

1. **`@shopify/liquid-html-parser`** for the save-time checks (blocked tags, `on*` attributes, `{% javascript %}`), so they run on a real syntax tree instead of regexes. The render-time cleaning in §4.2 stays the security boundary.
2. **`@shopify/codemirror-language-client` with `@shopify/theme-language-server-browser`** for autocomplete and errors in the Code tab. We feed it our own objects, filters and tags in the `theme-liquid-docs` JSON format, so it suggests `product.rating` and not Shopify's `cart`. If the language server can't use our docs without a fork, fall back to plain CodeMirror 6 with a Liquid mode and our own error checks.
3. **Not `theme-check` as a whole.** Most of its checks are about Shopify theme folders. Revisit after the spike.

### 11.6 Corrections to the note above

- §7.4: the kill switch migration can't be `0178`, which is now taken. It gets the next free number when F-101c starts (`0182` today).
- §4.3 and §4.4: product field names and minor-unit prices change as in §11.4.
- §4.1: `liquid` and `echo` move from dropped to kept.
- §3.1: the `code` node gets `blocks`, and setting `type` uses the Shopify names in §11.3.
- §9: F-101c also covers splitting the single file and storing blocks. F-101e also covers the block editor and the tooling spike. F-101h's starter sections are written from scratch (§11.1).

### 11.7 Owner decisions needed

1. **Shopify-compatible names** for setting types, objects and product fields, with prices in minor units. Recommended: yes. This is a one-time choice, frozen in `apiVersion: 1`.
2. **Section blocks in v1.** Recommended: yes, section blocks only; theme blocks and nesting come later.
3. **One-file format with `{% schema %}` and `{% stylesheet %}`.** Recommended: yes.
4. **Allow the `liquid` and `echo` tags.** Recommended: yes.
5. **No promise of compatibility.** Code written for other platforms mostly works, but sections that use `cart`, `customer`, forms, snippets or JavaScript won't. The seller docs (F-101h) describe our own objects and limits and never name another platform (§11.8).

### 11.8 Naming rule: never say "Shopify" to sellers or shoppers (owner, 2026-11-26)

The word "Shopify" appears only on tallaby.com's comparison page. Shopify stays our internal reference, but no seller- or shopper-facing surface names it: dashboard UI, editor, error messages, seller docs (`docs/code-sections.md` and the help pages), AI builder output, storefront HTML, and the Liquid API itself.

- The API uses neutral names: `block.attributes` (not `shopify_attributes`), and no `shopify_*` object, filter, CSS class or `data-` attribute.
- If the `@shopify/*` editor packages (§11.5) show their own text (hover docs, lint messages, links to shopify.dev), every message we surface comes from our own docs data, and any text that names Shopify is replaced or dropped. Check this in the F-101e spike.
- Internal files (this note, code comments, package names in `package.json`) may name Shopify.
