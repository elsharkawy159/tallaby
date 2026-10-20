# Tree Sections — Plan 1: Foundation + static content designs

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Pre-built sections become element trees: a `defineDesign` builder, a `section` root node, the extra
elements and styles real designs need, and the first five static library designs (stats, hero, features, about,
FAQ) inserted from the Add panel as fully selectable, movable `custom-section` trees.

**Architecture:** A design is data (`NodeTemplate[]` built by a typed helper `t`) in
`packages/store-sections/src/designs/<category>/<id>.ts`. A library preset points at a design (`designId`) with
`sectionId: "custom-section"`; inserting it builds a `custom-section` instance whose `componentTree` has one
`section` root, with fresh ids and text in the site's default locale. The existing element renderer, Layers,
Style panel and node drag-and-drop (which already move nodes between custom sections) then apply unchanged.
Each coded library section is deleted once its design replaces its preset.

**Tech Stack:** TypeScript, React (server-renderable), zod, vitest, pnpm workspaces, Next.js 16 dashboard editor.

**Spec:** [`docs/superpowers/specs/2026-10-19-tree-sections-design.md`](../specs/2026-10-19-tree-sections-design.md)

**Later plans (written after this one lands):** Plan 2 data nodes + bindings + commerce/promo/testimonial/brand/
category/form/contact designs; Plan 3 chrome nodes + header/footer designs; Plan 4 editor auto-convert on open,
content-role migrations (`applyPresetDesign`, templates), older coded sections, Tallaby Classic, templates.

## Global Constraints

- `@workspace/store-sections` stays server-renderable: no hooks, no editor imports (`render/boundaries.test.ts` passes).
- No seller HTML/CSS text/JS/iframes (CLAUDE.md rule 9); every style value goes through the `elements/style.ts` whitelist.
- Arabic is the default; node text in `props`, other locale in `props.translations[locale]` (`core/locale.ts`).
  Insertion puts the site's `defaultLocale` text in `props` (swapped when it is `"en"`).
- Logical properties only (start/end, `padding-inline-*`, `inset-inline-*`), never left/right.
- Limits: `MAX_NODES_PER_SECTION = 400`, `MAX_ELEMENT_DEPTH = 12`.
- Theme tokens (`primary`, `muted`, `border`, `secondary` … from `COLOR_TOKEN_VARS`) are the colours designs use.
- Schema changes additive; `SITE_CONFIG_VERSION` stays 1.
- Feature file split for dashboard code (`*.lib.ts`, `*.client.tsx`); don't add to `apps/dashboard/actions/products.ts`.
- After each task: `pnpm --filter ./packages/store-sections typecheck` and `test`; dashboard tasks also
  `pnpm --filter ./apps/dashboard typecheck` and `test`. Check `git status` first; don't touch others' changes.
- Commit only if the owner asked for commits in this session; otherwise leave changes staged-free and report.

## Review Focus

1. **A design opened in English on an Arabic-default store** — Layers labels and text show the store default with
   the English overlay; switching the editor to EN shows English text. Test in Task 4 (`instantiateDesign` swap).
2. **Dragging a node out of a tree section into another tree section** — keeps its styles and translations, gets
   no duplicate id. Test in Task 6 (two instances of the same design have disjoint node ids).
3. **Seller deletes every child of a grid/accordion** — the section still renders and stays selectable in edit
   mode (empty containers show a drop hint in edit, nothing public). Test in Task 2.
4. **Hover and absolute styles on mobile** — `hover` and `position` respect breakpoints and never leak to other
   sections' nodes (selector is scoped by section id). Test in Task 3.
5. **Old custom sections without a `section` root** — render exactly as before (padding wrapper kept). Test in Task 2.

---

### Task 1: Schema and limits

**Files:**
- Modify: `packages/store-sections/src/config/schema.ts` (`sectionInstanceSchema`, `ALLOWED_NODE_TYPES`)
- Modify: `packages/store-sections/src/elements/registry.ts:301-302`
- Test: `packages/store-sections/src/config/schema.test.ts`, `packages/store-sections/src/config/validate.test.ts`

**Interfaces:**
- Produces: `SectionInstance.source?: string` (regex `^[a-z0-9-]+@\d{1,4}$`, max 100);
  `ALLOWED_NODE_TYPES` also includes `"pattern"`, `"accordion"`, `"accordionItem"` (`"section"`, `"card"` exist);
  `MAX_NODES_PER_SECTION = 400`, `MAX_ELEMENT_DEPTH = 12`.

- [ ] **Step 1: Write failing tests**
  - `schema.test.ts` › `keeps a valid source and drops nothing else`: parsing a section with
    `source: "stats-cards@1"` returns it; `source: "x y"` fails.
  - `schema.test.ts` › `accepts pattern, accordion and accordionItem nodes`.
  - `validate.test.ts` › `allows 400 elements and refuses 401` (`tree_too_large` only at 401).
- [ ] **Step 2: Run** `pnpm --filter ./packages/store-sections test -- schema validate` — expect the three new tests to FAIL.
- [ ] **Step 3: Implement** the schema field, the three node types, and the two constants.
- [ ] **Step 4: Run** the same command — PASS; then the full package test + typecheck.
- [ ] **Step 5: Commit** `feat(store-sections): tree section schema (source, new node types, limits)`.

### Task 2: `section`, `card`, `pattern`, `accordion` elements

**Files:**
- Modify: `packages/store-sections/src/elements/registry.ts` (`ElementType`, `ELEMENT_DEFINITIONS`, new `structure` group)
- Modify: `packages/store-sections/src/elements/render.tsx`
- Modify: `packages/store-sections/src/sections/custom.tsx`
- Modify: `packages/store-sections/src/elements/tree.ts` (`canContain`)
- Modify: `packages/store-sections/src/core/copy.ts` (+ empty-container hint key `emptyContainer`, AR/EN)
- Test: `packages/store-sections/src/elements/elements.test.tsx`

**Interfaces:**
- Produces element types:
  - `section` — container, `group: "structure"`, renders `<section data-node-id …class="relative isolate overflow-x-clip">`;
    default style `{ paddingTop: 64, paddingBottom: 64 }`, breakpoint mobile `{ paddingTop: 40, paddingBottom: 40 }`.
    Only allowed as the single root of a tree (`canContain(nodes, null, section)` true only when `nodes` is empty;
    `canContain(_, someParent, section)` false). Not shown in the palette.
  - `card` — container, renders `<div class="min-w-0">`, default style `{ paddingTop: 24, paddingBottom: 24,
    paddingStart: 24, paddingEnd: 24, radius: 16, borderWidth: 1, borderColor: "border", background: "background" }`.
  - `pattern` — leaf, prop `variant: "grid" | "dots" | "glow"`, renders an `aria-hidden` absolutely positioned
    `div` (`pointer-events-none absolute inset-0 -z-10`) with a fixed background per variant using `--sf-line` /
    `--sf-brand`; field: variant select.
  - `accordion` — container, `childTypes: ["accordionItem"]`, renders `<div>`; default children: two items.
  - `accordionItem` — container, `textProp: "title"`, renders `<details open={props.open===true}><summary>{title}
    + chevron</summary><div>{children}</div></details>`; fields: title (200), open (switch).
- `custom-section`: when `componentTree[0]?.type === "section"` render the tree with no wrapper; otherwise keep the
  current `<section className="py-(--sf-section-y,48px)">` wrapper.
- Empty container in edit mode: any container node with no children renders, inside it,
  `<p data-editor-only class="… border-dashed …">{sectionText("emptyContainer")}</p>`; nothing in public mode.

- [ ] **Step 1: Write failing tests** in `elements.test.tsx`:
  - `section root renders a <section> with no extra wrapper`
  - `old custom section without a section root keeps the padded wrapper` (Review Focus 5)
  - `section can only be the single root` (`canContain`)
  - `pattern is aria-hidden`
  - `accordionItem renders details/summary and respects open`
  - `empty container shows a hint only in edit mode` (Review Focus 3)
- [ ] **Step 2: Run** `pnpm --filter ./packages/store-sections test -- elements` — FAIL.
- [ ] **Step 3: Implement** registry entries, renderer cases, `canContain` rule, custom-section branch, copy key.
- [ ] **Step 4: Run** — PASS; full package test + typecheck (update `PALETTE_TYPES` to exclude `section` and `accordionItem`).
- [ ] **Step 5: Commit** `feat(elements): section root, card, pattern and accordion elements`.

### Task 3: Style additions

**Files:**
- Modify: `packages/store-sections/src/elements/style.ts`
- Test: `packages/store-sections/src/elements/style.test.ts`

**Interfaces (new `StyleValues` keys and their whitelist rules):**
- `position: "relative" | "absolute" | "sticky"`; `insetTop|insetEnd|insetBottom|insetStart: length` (also negative: `-?` before the number, same bounds)
  (→ `inset-block-start/end`, `inset-inline-start/end`); `zIndex: number 0–10`; `overflow: "visible" | "hidden" | "clip"`.
- `fontSize` also accepts `"display-sm" | "display-md" | "display-lg"` →
  `clamp(1.75rem,3vw,2.35rem)`, `clamp(2.2rem,5vw,3.25rem)`, `clamp(2.5rem,6vw,3.75rem)`.
- `letterSpacing: "tight" | "normal" | "wide" | "wider"` → `-0.02em, 0, 0.06em, 0.14em`;
  `textTransform: "none" | "uppercase"`.
- `gradient: "brand-soft" | "ink-fade" | "shelf"` → fixed `linear-gradient(...)` values on `background-image`
  using `var(--sf-brand)`, `var(--sf-ink)`, `var(--sf-shelf)`.
- `colSpan: number 1–12` → `grid-column: span N / span N`; `order: number -10–10`.
- `hover?: Pick<StyleValues, "color" | "background" | "borderColor" | "opacity" | "shadow">` plus
  `scale?: 100–110` → rule `selector:hover{…}` (scale → `transform:scale(N/100)`, with
  `@media (prefers-reduced-motion:reduce)` dropping transform). Normalized recursively with the same whitelist;
  a nested `hover` inside `hover` is dropped.

- [ ] **Step 1: Write failing tests**:
  - `normalizes new keys and drops bad values` (e.g. `zIndex: 99` → 10, `position: "fixed"` dropped, `insetTop: "10px"` kept, `"calc(1px)"` dropped)
  - `emits logical inset properties`
  - `display font sizes use clamp`
  - `hover layer emits a scoped :hover rule and never nests` (Review Focus 4: selector contains `[data-section-id="s1"]`)
  - `hover and position follow breakpoints` (mobile `position` inside the mobile media query)
- [ ] **Step 2: Run** `pnpm --filter ./packages/store-sections test -- style` — FAIL.
- [ ] **Step 3: Implement** rules, `styleDeclarations` lines, hover collection in `collectNodes`/`collectPageCss`.
- [ ] **Step 4: Run** — PASS; full package + `sanitize.test.ts` still pass.
- [ ] **Step 5: Commit** `feat(elements): layering, display type, gradients, grid span and hover styles`.

### Task 4: `defineDesign` builder and instantiation

**Files:**
- Create: `packages/store-sections/src/designs/builder.ts`
- Create: `packages/store-sections/src/designs/index.ts` (exports `DESIGNS`, `getDesign`, `instantiateDesign`, `defineDesign`, types)
- Modify: `packages/store-sections/src/render/index.ts` (re-export `./designs`)
- Test: `packages/store-sections/src/designs/builder.test.ts`

**Interfaces:**
- `type DesignText = string | Localized` (a plain string is the same in both locales).
- `type Design = { id: string; version: number; category: LibraryCategoryId; subcategory: string; name: Localized;
  description: Localized; keywords: readonly string[]; tree: (t: TreeBuilder) => NodeTemplate }`.
- `defineDesign(design: Design): Design` (identity; validates `id` matches `^[a-z0-9-]+$` at module load).
- `TreeBuilder` helpers, each returning `NodeTemplate` and accepting an optional last `opts: { label?: DesignText;
  role?: string; style?: StyleValues; tablet?: StyleValues; mobile?: StyleValues }`:
  `section(opts, children)`, `container(children, opts?)`, `stack(children, opts?)` (vFlex), `row(children, opts?)`
  (hFlex), `grid(children, opts & { columns: { desktop: number; tablet?: number; mobile?: number } })`,
  `card(children, opts?)`, `box(children, opts?)` (div), `pattern(variant, opts?)`,
  `heading(text, level, opts?)`, `paragraph(text, opts?)`, `text(text, opts?)`, `badge(text, opts?)`,
  `button(label, href, variant?, opts?)`, `image(src, alt, opts?)`, `icon(name, opts?)`,
  `list(items: DesignText[], opts?)`, `accordion(items: { title: DesignText; body: DesignText; open?: boolean }[], opts?)`,
  `divider(opts?)`, `spacer(height, opts?)`.
  Localized text is stored as `{ text: ar, translations: { en: { text: en } } }` (same for `label`, `alt`, `title`
  props); `label`/`role` go to `props.label` / `props.role`.
- `instantiateDesign(design: Design, opts: { id: string; defaultLocale?: SiteLocale; makeId?: MakeId }): SectionInstance`
  → `{ id, sectionId: "custom-section", version: 1, props: {}, source: \`${design.id}@${design.version}\`,
  componentTree: [fromTemplate(swapped, makeId)] }`. Default `makeId` is `${id}-n${counter}` (deterministic, used
  by previews and snapshots). When `defaultLocale === "en"`, every localized prop is swapped
  (`props.text = en`, `translations.ar.text = ar`).
- `DESIGNS: readonly Design[]` (filled by Tasks 6–8), `getDesign(id): Design | undefined`.

- [ ] **Step 1: Write failing tests**:
  - `heading with L() stores Arabic in props and English as a translation`
  - `instantiateDesign swaps locales for an English-default store` (Review Focus 1)
  - `instantiateDesign gives fresh, deterministic ids and a source`
  - `grid columns become style + tablet/mobile breakpointStyles`
  - `label and role land in props`
- [ ] **Step 2: Run** `pnpm --filter ./packages/store-sections test -- builder` — FAIL.
- [ ] **Step 3: Implement** `builder.ts` and `index.ts`.
- [ ] **Step 4: Run** — PASS; full package test + typecheck.
- [ ] **Step 5: Commit** `feat(designs): defineDesign tree builder and instantiateDesign`.

### Task 5: Presets point at designs

**Files:**
- Modify: `packages/store-sections/src/library/types.ts` (`SectionPreset.designId?: string`)
- Modify: `packages/store-sections/src/library/library.ts` (`instantiatePreset`)
- Modify: `apps/dashboard/app/(builder)/stores/[storeId]/editor/lib/editor-library.lib.ts` (`presetInstance`, `applyPresetDesign`)
- Modify: `apps/dashboard/app/(builder)/stores/[storeId]/editor/panels/add/section-library.client.tsx` (pass the site default locale)
- Test: `packages/store-sections/src/library/library.test.tsx`, `apps/dashboard/app/(builder)/stores/[storeId]/editor/lib/editor-library.lib.test.ts`

**Interfaces:**
- `instantiatePreset(preset, registry, id, opts?: { defaultLocale?: SiteLocale; makeId?: MakeId }): SectionInstance | null`
  — when `preset.designId` is set, returns `instantiateDesign(getDesign(designId), { id, ...opts })` (null if the
  design is unknown); otherwise unchanged.
- A design preset has `sectionId: "custom-section"` and `designId`; library tests assert every `designId` resolves.
- `presetInstance(preset, id, defaultLocale?)` forwards the locale.
- `applyPresetDesign`: returns the instance unchanged for design presets (content-role switching is Plan 4).
- `presetsForSection("custom-section")` returns `[]` (no "switch design" list for trees yet).

- [ ] **Step 1: Write failing tests**:
  - library: `a design preset instantiates a custom-section tree with its source`
  - library: `every designId resolves to a design`
  - dashboard: `presetInstance passes the default locale to a design preset`
  - dashboard: `applyPresetDesign leaves tree sections unchanged`
- [ ] **Step 2: Run** both package tests — FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** both package tests + typechecks — PASS.
- [ ] **Step 5: Commit** `feat(library): presets can start a design tree`.

### Task 6: First design end to end — `stats-cards`

**Files:**
- Create: `packages/store-sections/src/designs/statistics/stats-cards.ts`
- Modify: `packages/store-sections/src/designs/index.ts` (register)
- Modify: `packages/store-sections/src/library/presets/library.ts` (`statistics.counters` → `sectionId: "custom-section", designId: "stats-cards"`)
- Delete: `packages/store-sections/src/sections/library/statistics/` and its entries in `sections/library/index.ts`
- Create: `packages/store-sections/src/designs/designs.snapshot.test.tsx`
- Modify: `packages/store-sections/src/render/defaults.snapshot.test.tsx` + snapshot (drop `stats-cards`)

**Interfaces:**
- Consumes: Task 4 builder, Task 2 elements, Task 3 styles.
- Produces: `statsCards: Design` reproducing today's look (the coded `stats-cards` / Valorcy "Footprint"):
  `section(label "أرقامنا/Stats", style { background: "muted" })` → `pattern("grid", { style: { opacity: 60 } })` →
  `container` → `stack(role "intro", alignItems center, textAlign center, gap 12)` with `badge(role "eyebrow")`,
  `heading(role "title", h2, fontSize display-sm)`, `paragraph(role "subtitle")` → `grid(role "items",
  columns { desktop: 4, tablet: 2, mobile: 2 }, gap 16, marginTop 48)` with 4 `card`s (center aligned, paddingY 32)
  each `heading(value, h3, fontSize display-md, fontWeight semibold)`, `text(label, fontWeight semibold)`,
  `text(sublabel, color muted, fontSize sm)`. Default AR/EN text: the coded section's AR defaults with EN from the
  Valorcy example ("By the numbers", "A decade of doing the work well", …).

- [ ] **Step 1: Write failing tests** in `designs.snapshot.test.tsx`:
  - `stats-cards renders (ar, public)` snapshot via `renderToStaticMarkup(<SectionRenderer …/>)` (same setup as `render/defaults.snapshot.test.tsx`)
  - `every design has a section root, labels on every container, and is within 400 nodes / depth 12`
    (iterates `DESIGNS`; future designs are covered automatically)
  - `two instances of a design share no node ids` (Review Focus 2)
- [ ] **Step 2: Run** `pnpm --filter ./packages/store-sections test -- designs` — FAIL.
- [ ] **Step 3: Implement** the design, register it, switch the preset, delete the coded section.
- [ ] **Step 4: Run** full package tests (update snapshots with `-u` only for the removed `stats-cards` entry and the new design) + typecheck — PASS.
- [ ] **Step 5: Manual check** in the editor (`pnpm --filter ./apps/dashboard dev`): insert "By the numbers"; click
  the section background, the grid, a card and a number — each selects, shows in Layers with its label, restyles;
  drag a card into another tree section. Record in `PLAN.md` §23.
- [ ] **Step 6: Commit** `feat(designs): stats-cards as an element tree`.

### Task 7: `hero-split` and `about-story` designs

**Files:**
- Create: `packages/store-sections/src/designs/hero/hero-split.ts`, `packages/store-sections/src/designs/about/about-story.ts`
- Modify: `designs/index.ts`, `library/presets/library.ts` (`hero.split`, `about.story`)
- Delete: `sections/library/hero/`, `sections/library/about/` and their barrel entries; snapshot entries

**Interfaces:**
- `heroSplit`: `section` → `container` → `grid(columns { desktop: 2, mobile: 1 }, alignItems center, gap 40)` with
  a copy `stack` (eyebrow badge, `heading` h1 display-lg extrabold, paragraph, a `row` of two buttons solid/outline,
  a `list`-like `row` of three `row(icon check + text)` badges) and a media `box` (`position: relative`) holding a
  decorative `box` (`position: absolute`, inset -16, `zIndex: 0`, background secondary, radius 32) and the `image`
  (`zIndex: 1`, aspect portrait, radius). Same AR copy as the coded section, EN translations.
- `aboutStory`: `grid` 2 columns → media `box(position relative, paddingBottom 32)` with `image` and a stat `card`
  (`position: absolute`, insetBottom 0, insetEnd 16, background primary, color `primaryInk`) → copy `stack` (eyebrow, h2, two paragraphs, 2-column `grid` of `row(icon + text)` points, button).
- Both carry `role` on eyebrow/title/subtitle/body/cta/image.

- [ ] **Step 1:** Add both ids to the snapshot test's design list — FAIL (missing designs).
- [ ] **Step 2:** Implement both designs, register, switch presets, delete coded sections.
- [ ] **Step 3: Run** package tests (+ `-u` for the replaced entries) + typecheck — PASS; the generic design test from Task 6 passes for both.
- [ ] **Step 4: Manual check** at 375 / 768 / 1280 in AR and EN: layout matches the old coded section; the
  decorative box and stat card are selectable and deletable. Record in `PLAN.md` §23.
- [ ] **Step 5: Commit** `feat(designs): hero-split and about-story trees`.

### Task 8: `feature-grid` and `faq-split` designs

**Files:**
- Create: `packages/store-sections/src/designs/features/feature-grid.ts`, `packages/store-sections/src/designs/content/faq-split.ts`
- Modify: `designs/index.ts`, `library/presets/library.ts` (`features.icon-grid`, `content.faq`)
- Delete: `sections/library/features/`, `sections/library/content/` and barrel entries; snapshot entries
- Modify (if now unused): `sections/content.tsx` `FEATURE_ICONS` stays (older `features` section uses it)

**Interfaces:**
- `featureGrid`: intro `stack` centred → `grid(columns { desktop: 4, tablet: 2, mobile: 1 })` of 4 `card`s, each
  `box(icon, 48×48, radius, background gradient "brand-soft", color primary)`, `heading` h3 base size, `paragraph`.
  Card `hover: { shadow: "md" }`. Icons map to `ELEMENT_ICON_NAMES` (`truck`, `shield`, `check`, `phone`).
- `faqSplit`: `grid(columns { desktop: 2, mobile: 1 }, gap 48)` → intro `stack` (`position: sticky`, insetTop
  "96px" on desktop only, `position: relative` on mobile) with eyebrow, h2, paragraph, outline button →
  `accordion` of 4 `accordionItem`s (first `open`) each holding one `paragraph` answer.

- [ ] **Step 1:** Add both ids to the snapshot list — FAIL.
- [ ] **Step 2:** Implement, register, switch presets, delete coded sections.
- [ ] **Step 3: Run** package tests (+ `-u` for replaced entries) + typecheck — PASS.
- [ ] **Step 4: Manual check** (sticky intro on desktop only, accordion opens without script, hover shadow). Record in §23.
- [ ] **Step 5: Commit** `feat(designs): feature-grid and faq-split trees`.

### Task 9: Editor — add item, labels, root selection

**Files:**
- Modify: `apps/dashboard/app/(builder)/stores/[storeId]/editor/lib/editor-commands.lib.ts` (`addItem`)
- Modify: `apps/dashboard/app/(builder)/stores/[storeId]/editor/inspector/editor-sidebar.client.tsx` ("Add item" button)
- Modify: `apps/dashboard/app/(builder)/stores/[storeId]/editor/panels/layers-panel.client.tsx` (localized labels)
- Modify: `apps/dashboard/messages/{ar,en}.json` (or the editor's message files) — `addItem` string
- Test: `apps/dashboard/app/(builder)/stores/[storeId]/editor/lib/editor-commands.lib.test.ts`

**Interfaces:**
- `isRepeatContainer(node: ComponentNode): boolean` (in `editor-selection.lib.ts`) — true for `accordion`, `list`,
  or a `grid`/`vFlex`/`hFlex` whose children (≥ 1) all share one `type`.
- `commands.addItem()` — when the selection (or its parent) is a repeat container, `duplicateNode` its last child,
  select the copy; refused (returns false) past `withinLimits`.
- Layers label: `props.label` resolved for the editor UI locale through `props.translations[uiLocale].label` when present.
- Selecting the `section` root shows its Style tab (background, padding, gradient) like any node; the section
  shell controls (`instance.style.shell`) stay for the instance row.

- [ ] **Step 1: Write failing tests**: `addItem duplicates the last card of a grid`, `addItem is refused at the node limit`,
  `isRepeatContainer is false for mixed children`.
- [ ] **Step 2: Run** `pnpm --filter ./apps/dashboard test -- editor-commands` — FAIL.
- [ ] **Step 3: Implement**; add the AR/EN strings.
- [ ] **Step 4: Run** dashboard tests + typecheck — PASS. Manual: add a 5th stat card from the inspector.
- [ ] **Step 5: Commit** `feat(editor): add item for repeated containers, localized layer labels`.

### Task 10: Rules and docs

**Files:**
- Modify: `docs/website-builder.md` (new §4.11 "Tree sections" with the 10 rules from the spec §6; update §3 non-goals:
  absolute positioning now via style values; Classic will be rebuilt as trees)
- Modify: `CLAUDE.md` rule 12 → "Tallaby Classic is being rebuilt as tree designs (owner, 2026-10-19); it must keep
  how it looks. Do not design a new default template without the owner's approval."
- Modify: `PLAN.md` §22 (new task group P4C-01…: this plan's tasks + Plans 2–4 as planned items) and §23 log entry
- Modify: `packages/store-sections/src/sections/library/index.ts` doc comment (remaining coded library sections are temporary)

- [ ] **Step 1:** Write the docs changes (use Edit on PLAN.md — never string-replace with `$\``).
- [ ] **Step 2:** Run `pnpm --filter ./packages/store-sections test` and `pnpm --filter ./apps/dashboard test` one final time — PASS.
- [ ] **Step 3: Commit** `docs: tree section rules and plan`.
