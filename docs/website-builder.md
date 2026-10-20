# Website editor upgrade — plan (Phase 4B)

> **Status (2026-10-18):** P4B-01…04, 06…11 and 14 are built, plus Templates, Explore (Pexels) and Forms tabs
> (P4B-15, owner request); see `PLAN.md` §23. P4B-05 and 13 (variants, convert to custom) are **deferred** to the
> owner's separate sections/templates plan. P4B-12 is built on `@dnd-kit/core` + `sortable` (`editor/dnd/`, see
> `PLAN.md` §23): Add › Elements/Sections, Explore and Images drag onto the canvas, sections and elements move by the
> toolbar grip, Layers sort. Templates now live in Add (page designs per page, plus the whole-site gallery). The
> checklist is in `PLAN.md` §22.
>
> **Built differently from §4.3/§4.6:** part styles are stored on the instance (`style.parts[partKey]` and
> `breakpointStyles.{tablet,mobile}.parts[partKey]`), not in page-level `elementStyles`, so duplicate, copy/paste and the
> shared header/footer keep them. `hidden` applies to one device only. Store elements and video wait for the sections plan.

## 1. Why

The editor shipped in P4-01/P4-06 (`apps/dashboard/app/(builder)/stores/[storeId]/editor/`) is a working MVP:
one sections list, a form-style inspector, theme colours, pages, undo/redo, autosave and publish.
The owner wants it to **work like the Valorcy editor** (reference, read-only:
`D:\programming projects\saas\apps\dashboard\components\website-builder`, `lib/builder`), with:

1. **One strong, pre-built section per category**, each easy to customise.
2. **Elements** (heading, image, button, row, grid, …) to build **custom sections**.
3. Overall editor improvements: click-to-edit on the canvas, layers, a better add panel, style controls.

## 2. What exists today (verified 2026-10-18)

| Area | Today | Gap vs. Valorcy |
|---|---|---|
| Editor shell | Top bar + one left panel (`sections` / `pages` / `theme`) + inspector (`editor.client.tsx`, 595 lines) | No tab rail, no Add panel with categories/previews, no Layers, no Content/Style tabs |
| Canvas | Iframe + portal, real renderer, device widths, click selects a **section** (`editor-canvas.client.tsx`) | No hover chip, no selection toolbar, no "+" insert between sections, no inline text editing, no element selection |
| Inspector | One field per `PropDefinition` + item collections + catalog pickers (`editor-inspector.client.tsx`) | No Style tab (spacing, background, typography, border), no per-breakpoint overrides |
| Sections | 16 + 5 Classic in `@workspace/store-sections` (9 categories) | Several categories hold 3–6 sections; no layout variants; no shared section style (colour scheme, padding) |
| Elements | `SiteConfig` **already stores** `componentTree`, node `style` and `breakpointStyles` (`config/schema.ts`, `ALLOWED_NODE_TYPES`), and `sanitize.ts` cleans them | **Nothing renders or edits them.** No element registry, no style→CSS, no node translations |
| Keyboard | Ctrl+Z / Ctrl+Shift+Z | No copy/paste/duplicate/delete keys, no Ctrl+K quick insert, no shortcuts dialog |
| DnD | `@hello-pangea/dnd`, flat section list only | Cannot drag into nested element containers |

Valorcy pieces worth copying the **behaviour** of (not the code: its sections import editor modules in 290 of 307 files, see P4-02 note):
`builder-tab-rail.tsx`, `panels/{elements-palette,layouts-palette,navigator-panel,element-style-panel,spacing-box-model,element-content-panel}.tsx`,
`insert/{quick-add-button,quick-insert-palette}.tsx`, `canvas/{selected-element-badge,alignment-guides}.tsx`, `canvas-context-menu.tsx`,
`inline-editable.tsx`, `keyboard-shortcuts-dialog.tsx`, `lib/builder/{element-definitions,component-node,component-style,eject-section-to-tree,layout-presets,section-style-presets}.ts`.

## 3. Goals, non-goals, anti-goals

**Goals**

- An editor a non-technical seller can use without help: select anything on the page and change it where it is.
- Each section category has exactly one section in the Add panel, with layout variants and simple style presets.
- A **Custom section** built from a safe, fixed set of elements, with per-device styles.
- Everything stays server-renderable on the storefront (`@workspace/store-sections` keeps its no-hooks / no-editor-imports boundary test).

**Non-goals (this phase)**

- AI generation, planners, translation buttons (D13).
- CMS bindings inside elements (blog/CMS stay as sections).
- Absolute positioning (`layout: "absolute"` is ignored by the renderer), animations, scheduled publish.
- A new default template. **Tallaby Classic stays as it is** (CLAUDE.md rule 12).

**Anti-goals (a failure even if it "works")**

- Any path to seller HTML, JS, CSS text or arbitrary iframes (rule 9). No `customCode`, no raw `<style>`, no `map` iframe.
- A published store changing appearance because of this work. Old section ids, props and revisions must render exactly as before.
- Editor code leaking into the storefront bundle.
- Product, form or media ids from another seller/store resolving on a storefront.

## 4. Design

### 4.1 Editor layout (like Valorcy)

```
┌──────────────────────────── top bar (unchanged: page · AR/EN · device · undo/redo · save · view · publish) ───────────────────────────┐
│ rail │ left panel (300px)          │                      canvas (iframe)                     │ inspector (320px)               │
│ Add  │ Add: [Sections | Elements]   │  hover: outline + name chip                              │ [Content | Style]               │
│Layers│ Layers: page tree            │  selected: outline + toolbar (↑ ↓ ⧉ 🗑 ⋯)                 │  Content = props / element text │
│Pages │ Pages: list + SEO dialog     │  "+" between sections → quick insert                     │  Style = spacing, bg, type,     │
│Media │ Media: store media library   │  double-click text → edit in place                       │          border, layout, device │
│Brand │ Brand: colours, fonts, radius│  right-click → context menu                              │                                 │
└──────┴──────────────────────────────┴──────────────────────────────────────────────────────────┴─────────────────────────────────┘
```

- RTL: in Arabic the rail and panels mirror (logical CSS only).
- The inspector is empty-state "Select something on the page" when nothing is selected.
- Header/footer stay selectable from Layers and from the canvas (as today).

### 4.2 Selection model

Extend `Selection` in `editor.store.ts`:

```ts
type Selection =
  | { target: "page"; sectionId: string; nodeId?: string }   // nodeId = element inside a custom section
  | { target: "header" | "footer"; nodeId?: string }
  | null;
```

Pre-built sections expose **editable parts** (title, subtitle, button, image) through `data-edit="<propKey>"`
attributes rendered only in `edit` mode. Clicking a part selects the section and focuses that field in the
inspector; double-clicking a text part edits it in place (§4.7). This gives "click anything" without turning
every section into an element tree.

### 4.3 Pre-built sections: one per category

Rename the category list to match Valorcy's naming (the stored `sectionId` never changes; only the Add panel grouping):

| Category (Add panel) | Section (`sectionId`) | Status | Layout variants (`layout` prop) |
|---|---|---|---|
| Header | `store-header` | upgrade | logo start + menu · centred logo · minimal; optional announcement bar |
| Hero | `hero-banner` | upgrade | centred · split image · full image overlay · with product spotlight |
| Products | `product-grid` | upgrade | grid · carousel (CSS scroll-snap) · single spotlight (absorbs `featured-product`) |
| Categories | `category-grid` | upgrade | circles · cards · carousel |
| Features | `features` | upgrade | icon grid · list · cards |
| About | `image-with-text` | upgrade | image start · image end · stacked |
| Stats | `stats` | **new** | row · cards |
| Testimonials | `testimonials` | upgrade | cards · single large quote · carousel |
| Logos / trust | `logo-cloud` | upgrade | row · grid; mono toggle |
| Gallery | `image-gallery` | upgrade | grid · masonry (CSS columns) · carousel |
| Content | `rich-text` | upgrade | narrow · wide; alignment |
| Blog | `blog-latest-posts` | upgrade | grid · list · featured first (absorbs `blog-featured-post`) |
| FAQ | `faq` | upgrade | single column · two columns (uses `<details>`) |
| Call to action | `cta-banner` | upgrade | banner · card · split with image |
| Contact | `contact-form` | upgrade | form · form + store info (absorbs `contact-info`) |
| Footer | `store-footer` | upgrade | columns · centred · minimal |
| Custom | `custom-section` | **new** | blank, or start from a layout preset (§4.5) |

**Hidden from the Add panel but still rendered** (existing pages and revisions keep working):
`featured-product`, `contact-info`, `blog-featured-post`, `spacer`, `cms-list`, `cms-item`, the 5 `classic-*` sections.
Add `insertable?: false` to `SectionDefinition` for this. CMS sections stay insertable only when the store has a collection (P4-11).

**Excluded categories** (not store-relevant at launch): pricing, booking, menu, listings, auth, team, timeline.

**Shared "section style" for every pre-built section** (one contract, one inspector group, not per-section code):

```ts
// instance.style (already in the schema), read by a shared <SectionShell>
{ scheme: "default" | "muted" | "primary" | "dark",   // maps to theme tokens, never raw colours
  paddingY: "none" | "sm" | "md" | "lg" | "xl",
  width: "contained" | "wide" | "full",
  align: "start" | "center",
  background?: { image: string /* store media path */, overlay: 0–80 },
  hideOn?: ("mobile" | "tablet" | "desktop")[] }
```

**Easy customisation rules for every section:**

- `layout` is a visual picker (small diagrams), not a dropdown.
- Every optional part has a show/hide switch (eyebrow, subtitle, second button, image).
- Item collections (features, FAQ, stats, logos) keep add / remove / reorder.
- **No visual change for existing content:** every new prop defaults to today's look; bump `version` and add
  `migrateProps` only where a prop is renamed (e.g. `featured-product` → `product-grid` is *not* migrated; the old id keeps rendering).

### 4.4 Elements (custom sections)

A `custom-section` instance renders its `componentTree` (already in `SiteConfig`). New in `@workspace/store-sections`:
`src/elements/{registry,render,style}.ts(x)`: a fixed element registry, a server-renderable tree renderer, and style→CSS.

**Element palette (Tallaby subset of Valorcy's `element-definitions.ts`):**

| Group | Elements (node `type`) | Notes |
|---|---|---|
| Layout | Container (`container`), Stack (`vFlex`), Row (`hFlex`), Grid (`grid`), Box (`div`) | Grid has columns per device |
| Basic | Button (`button`), Divider (`div` + `hr` tag), Spacer (**new** `spacer`), List / List item, Icon (`icon`), Badge (`shadcn-badge`) | Icons from a fixed built-in set by name, rendered as inline SVG from the package |
| Text | Heading (`heading`, h1–h4), Paragraph (`paragraph`), Text (`text`), Quote (`blockQuote`), Rich text (`richText`, existing allow-list sanitizer) | |
| Media | Image (`image`), Video (`video`) | Video = uploaded store-media file, **or** YouTube/Vimeo by id through a fixed embed template with a regex-checked id (rule 9) |
| Links | Text link (`textLink`), Link block (`linkBlock`) | `safeHref` + page picker |
| Interactive | Accordion (`shadcn-accordion` → `<details>`), Carousel (`shadcn-carousel` → CSS scroll-snap) | No JS, so no hooks in the package |
| Store (**new types**) | Product card (`productCard`), Product grid (`productGrid`), Price (`price`), Add to cart (`addToCart`), Category card (`categoryCard`), Form (`storeForm`) | Store ids only; resolved by the host like section `catalogQuery`/`formRef`; publish validation checks ownership (§12 step 5) |

New node types are **added** to `ALLOWED_NODE_TYPES` (additive, `SITE_CONFIG_VERSION` stays 1). Types in the
enum that are not in the palette (`input`, `select`, `shadcn-dialog`, `shadcn-calendar`, …) render nothing.

**Limits** (in `validate.ts`): ≤ 300 nodes per custom section, depth ≤ 8 (existing `tree_too_deep`), ≤ 40 custom sections per page.

**Element text and translations:** text props live in `node.props`; English overrides in
`node.props.translations.en` (same overlay rule as sections, `core/locale.ts`). Editing in EN writes only the overlay.

### 4.5 Layout presets

Ready-made element groups in the Elements tab (Valorcy `layout-presets.ts`): 2 columns, 3 columns, image + text,
card row, heading + paragraph + button, product row. They are plain `componentTree` fragments with fresh ids.
"Custom section → start from preset" uses the same list.

### 4.6 Style system (elements)

Only whitelisted keys, values from tokens or numbers with units. No free CSS text.

| Group | Keys | Values |
|---|---|---|
| Layout | `display`, `direction`, `gap`, `alignItems`, `justifyContent`, `wrap`, `columns` | enums; gap/columns numbers |
| Size | `width`, `maxWidth`, `minHeight`, `aspectRatio` | `auto`, `%`, `px`, `rem` with bounds; ratio enum |
| Spacing | `padding{Top,End,Bottom,Start}`, `margin{…}` | numbers (px) with bounds; logical sides for RTL |
| Text | `fontSize` (scale step), `fontWeight`, `textAlign`, `lineHeight`, `color` | theme token names only (`primary`, `foreground`, `muted`…) |
| Background | `background` (token), `backgroundImage` (store media path), `overlay` | token / path / 0–80 |
| Border | `borderWidth`, `borderColor` (token), `radius`, `shadow` (none/sm/md/lg) | bounded numbers / enums |
| Visibility | `hidden` per device | boolean |

- `node.style` = desktop; `node.breakpointStyles.tablet|mobile` = overrides (schema fields already exist).
- The renderer turns a tree's styles into one scoped `<style>` block with class `.n-<nodeId>` and media queries
  (inline styles cannot do breakpoints). Output is built from the whitelist only, and `<` is escaped as `SiteTheme` already does.
- `sanitizeStyle` becomes the same whitelist (unknown keys dropped on save and publish).

### 4.7 Canvas interactions

- **Hover:** outline + chip with the section/element name (Valorcy `selected-element-badge.tsx`).
- **Selected:** outline + floating toolbar: move up/down, duplicate, delete, "more" (context menu). For elements: select parent.
- **Insert:** a "+" on the boundary between sections opens quick insert (sections + presets); inside a custom section,
  "+" at the end of a container opens the element palette.
- **Inline text editing:** double-click a `data-edit` text part or a text element → `contenteditable` (plain text, or
  bold/italic/link for rich text); Enter/blur commits one undo step; Escape cancels. Arabic/English follows the editing locale.
- **Images:** double-click → media library picker (P4-09).
- **Context menu:** copy, paste, duplicate, delete, move up/down, hide on device, **convert to custom section** (§4.9).
- Links and forms stay inert in the canvas (as today).

### 4.8 Keyboard and clipboard

Ctrl+Z / Ctrl+Shift+Z (exists), Ctrl+C / X / V, Ctrl+D duplicate, Delete, Ctrl+K quick insert, Ctrl+S save now,
Esc deselect, ↑/↓ siblings, ←/→ parent/child, `?` shortcuts dialog. Clipboard is in memory per tab (sections and
element subtrees), new ids on paste. Pasting into another store of the same seller is allowed; bound ids that the
target store can't show are dropped by publish validation and flagged in the editor.

### 4.9 Convert section to custom (eject)

A pre-built section can be turned into a `custom-section` with the same look, built from elements, for full control.
One-way (undo works; a confirm dialog says it can't be switched back later). Each section opts in with an optional
`toTree(props, ctx) => ComponentNode[]` on its definition. First wave: hero, features, about, CTA, content, stats.
Commerce, blog, contact and chrome sections don't eject (they stay data-bound).

### 4.10 Drag and drop

- Layers panel: drag to reorder sections and move elements between containers.
- Canvas: drag the selection toolbar handle to move; drag palette items into the canvas.
- Library: `@dnd-kit/*` (already approved for P4-01 and not yet added). **Spike first** (P4B-12): dragging from the
  panel into the iframe canvas. If it is unreliable, fall back to click-to-insert + Layers drag + toolbar arrows (the
  editor stays fully usable without canvas drag).

## 5. Security and data rules (unchanged, restated for this phase)

- Saves and publish go through the existing actions (`editor.server.ts`): `storeId` explicit, ownership re-checked,
  `validateSiteConfig` + `sanitize` on save **and** publish.
- New node types join the same validation: product/category/form ids must belong to the store (catalog mode respected),
  media paths to the seller, links pass `safeHref`, video ids pass `^[A-Za-z0-9_-]{6,20}$`.
- The element renderer never uses `dangerouslySetInnerHTML` except for the sanitized `richText` path that exists today
  and the generated, escaped style block.
- No caching changes; the storefront keeps its per-store tags.

## 6. Tasks

Each task: run `pnpm lint`, `pnpm typecheck`, `pnpm test` (filters ok), update `PLAN.md` §22/§23.

| Task | Pri | Deps | What | Done when |
|---|---|---|---|---|
| **P4B-01** Element model + style whitelist | P0 | — | `store-sections/src/elements/{registry,style}.ts`: element definitions (palette metadata, default props, allowed children), style whitelist → scoped CSS with breakpoints, node translation overlay; add new node types to `ALLOWED_NODE_TYPES`; tighten `sanitizeStyle` and `validate` (limits, bound ids) | Unit tests: CSS output, unknown keys dropped, `</style>` can't escape, overlay, limits |
| **P4B-02** Element renderer + `custom-section` | P0 | 01 | Server-renderable tree renderer; `custom-section` definition; store elements resolved via `RenderContext` (extend `collectCatalogQueries`/form refs to walk trees); ecommerce renders it with no app change beyond resolvers | Render tests AR/EN; boundary test still green; a published page with a custom section renders on staging |
| **P4B-03** Editor shell like Valorcy | P0 | — | Tab rail (Add, Layers, Pages, Media, Brand), left panel, inspector with Content/Style tabs; split `editor.client.tsx` into `editor-{rail,add-panel,layers,pages-panel,brand-panel}.client.tsx`; all strings in `ar.json`/`en.json` | Existing features all reachable; no behaviour lost (manual checklist in §23) |
| **P4B-04** Selection + canvas overlays | P0 | 03 | Selection with `nodeId`; `data-edit` parts in edit mode; hover chip, selected toolbar, "+" insert between sections | Click a hero title → title field focused; toolbar actions undoable |
| **P4B-05** Section style + layout variants (one per category) | P0 | 03 | Shared `SectionShell` + section-style group; `layout` picker; upgrade the 15 sections in §4.3; new `stats`; `insertable: false` on superseded sections; Add panel grouped by the new categories | Defaults render byte-identical to today (snapshot test per section); each variant renders AR/EN |
| **P4B-06** Add panel with live previews | P1 | 05 | Category list → the one section, preview = the real renderer scaled down with default props; click inserts after selection, or at the end | Inserting from preview works on every page |
| **P4B-07** Elements palette + layout presets | P0 | 02, 04 | Elements tab (grouped, searchable by keywords), presets (§4.5); insert into the selected container or after the selected element | Build a 2-column image + text section from elements |
| **P4B-08** Layers navigator | P0 | 04 | Tree of header → sections → elements → footer; select, rename (label only), hide, duplicate, delete | Selecting in Layers and in canvas stays in sync |
| **P4B-09** Style panel | P0 | 01, 04 | Spacing box model, layout, size, text, background, border, visibility; device switch edits `breakpointStyles` with "reset to desktop" | Mobile override changes only mobile width in canvas and storefront |
| **P4B-10** Inline editing + image replace | P1 | 04 | `contenteditable` for `data-edit` text and text elements; media picker on image double-click | One undo step per edit; EN writes the overlay only |
| **P4B-11** Clipboard, context menu, shortcuts, quick insert | P1 | 04, 07 | §4.8 + `?` dialog + Ctrl+K palette | Shortcuts don't fire while typing in inputs |
| **P4B-12** Drag and drop (spike → build) | P1 | 08 | Add `@dnd-kit/*` (approved); Layers DnD; canvas DnD if the spike passes | Spike result logged in §23 |
| **P4B-13** Convert to custom section | P2 | 02, 05 | `toTree` for hero, features, about, CTA, content, stats | Ejected section looks the same in canvas and storefront |
| **P4B-14** Brand panel in editor | P1 | 03 | Fonts (AR/EN pairings from P4-13), button style, radius, colours, writing the same `store_design_systems` draft as the Design page | Change in one place shows in the other |

**Order:** 01 → 02 and 03 in parallel → 04 → 05, 07, 08, 09 → 06, 10, 11, 14 → 12 → 13.
No migration is needed (all new data lives in existing jsonb `SiteConfig` fields).

## 7. Verification

- Unit: element registry/style/renderer, section variants, snapshot "defaults unchanged" per section, store-sections boundary test.
- Integration (staging, `TEST_DATABASE_URL`): publish a page with a custom section holding another seller's product id → dropped/refused;
  video id with markup → refused; style key outside the whitelist → dropped.
- Manual (record in `PLAN.md` §23): build a home page with one section from each category in Arabic, translate to English,
  check desktop/tablet/mobile, publish, view on the storefront; open two stores in two tabs; confirm a store published before
  this phase looks unchanged.

## 8. Calls made while planning (owner can override)

1. Pre-built sections stay **prop-based** (not element trees), so translations, product binding and old revisions keep working;
   full control comes from "convert to custom section".
2. Superseded sections are hidden from the Add panel, not deleted.
3. No `map` element and no raw form inputs (forms come from the store's Forms).
4. YouTube/Vimeo video via a fixed embed template with a checked id.
5. Interactive elements are CSS-only (`<details>`, scroll-snap), keeping the storefront renderer hook-free.
6. `@dnd-kit` is used only after a spike, with a click-to-insert fallback.
