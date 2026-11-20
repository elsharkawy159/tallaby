# Code sections (custom CSS + Liquid) — design

- **Feature:** ROADMAP.md F-101 (owner request and approval 2026-11-20; every seller, Free and Pro).
- **Rule:** CLAUDE.md rule 9 (HTML + Liquid + CSS only, server-rendered, cleaned, scoped, no JavaScript, never on checkout).
- **Status:** design approved by the owner 2026-11-20 (§10). No code. Nothing in this note is built.

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
