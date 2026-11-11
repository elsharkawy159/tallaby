# Section system and template system: audit and plan (Phase 0)

**Status: for owner approval (2026-11-11). Nothing in this plan is built.** Branch `feat/section-system`, cut from `feat/motion-v2` (`62bb38b4`).

The goal is a section library with no duplicates, templates composed from sections by rules, an AI store builder that picks from metadata, and section improvements that reach every template that uses the section.

The full inventories are in two generated files:

- [`audit/designs.md`](audit/designs.md): every design, with its numbers and the near-duplicate pairs.
- [`audit/templates.md`](audit/templates.md): every template, with its home sequence, photo frames and the near-identical template pairs.

---

## 1. Where the brief and the code differ

These six facts change parts of the brief. Each one has a proposal, and the ones that need your answer are repeated in §9.

| # | The brief says | The code says | Proposal |
|---|---|---|---|
| 1 | Motion v2 is merged. | It is on `feat/motion-v2`, 10 commits ahead of `main`, not merged or pushed. | This branch is cut from `feat/motion-v2`. Merge motion v2 to `main` before the Phase 1 PR, or the PR will carry both. |
| 2 | Compare each design with its `library_sections` row. Every design change ships with an insert-only `section:sql` migration. Templates stored in the database need a migration path. | Migration 0109 dropped `library_sections`, `templates` and `template_versions`. Sections and templates are code-only (`CLAUDE.md` rule 17). | No database comparison is possible or needed. A design change is a new `version` in code plus a deploy. The "new version + stable field names + aliases" rule stays; the migration step is dropped. |
| 3 | Templates must reference library designs so improvements flow through. | 118 of 119 templates already do, through `fromLibrary` with a strict patch. Only Tallaby Classic owns its designs (26). | Keep `fromLibrary` as the mechanism. Phase 2 adds presets and blueprints on top of it. Classic moves to library designs in the pilot. |
| 4 | Runs in CI. | There is no CI (`CLAUDE.md` rule 15). | Structural checks run in `pnpm test`. The screenshot check is a separate script that writes a committed hash file, and `pnpm test` compares the hashes without a browser. |
| 5 | Playwright screenshots. | Playwright is not a dependency of any package. | Add `@playwright/test` and `pngjs` as dev dependencies of `packages/store-sections` only. Nothing reaches a store site. |
| 6 | Home page: hero carousel first (`template-rules.md` §2). | 25 of 119 templates start with a carousel. The other 94 use one of 14 other hero designs. §2a only asks for one hero first. | The blueprint follows §2a: one hero, any hero archetype. `template-rules.md` §2 row 1 is corrected. |

**Screenshots were not taken in Phase 0.** You asked for a plan with no code, so the duplicate groups below come from a structural fingerprint and from reading the designs. Each group is confirmed by screenshots in its category session before any merge, starting with hero.

---

## 2. Audit of the designs

### 2.1 Numbers

| | |
|---|---|
| Library designs | **325** in 29 categories (`section-rules.md` §9 still says 272) |
| Used by no template | **148** (46%) |
| Categories no template uses | 5: bundles, promotions, blog, popups, cart (promotions and bundles by the no-discounts rule) |
| Designs that use a motion v2 effect | **7** (`hero-fullbleed`, `products-grid`, `promo-banner-fullbleed`, `stats-band`, `about-split-story`, `image-text-steps`, `testimonials-classic`) |
| Same-category pairs scoring 0.75 or more | 54 |
| Same-category pairs scoring 0.85 or more | 20 |
| Designs at version 1 | 291 |

The fingerprint used here compares the tree shape by depth, grid columns per breakpoint, photo count and ratios, data lists, interactive elements and a layout guess. It has two known blind spots, both fixed in Phase 1B: it does not compare the card inside a data list, and it does not see tabs or swipe rails.

### 2.2 Three problems that are bigger than duplicates

1. **Static sections that should show store data.** Eight of the 17 category designs hold fixed stock photos and typed names, not the seller's categories. Four of them are used by 18 templates. All 14 testimonial designs hold typed demo reviews, and 56 templates put one on the home page. All 10 brand designs hold typed wordmarks. Statistics designs hold typed numbers. A seller who publishes unedited shows reviews and numbers that are not theirs, which breaks the "no fake data" rule.
2. **One archetype built many times.** The clearest cases: four hero sliders, three split heroes, six category tile grids that differ only in the tile, five plain product grids, six photo-beside-text designs, four statistic rows, five blog card rows.
3. **Almost no shared building blocks.** `_kit.ts` has seven helpers (heading, arrow link, icon tile, stars, person, paper card, cover photo). Product cards, media frames, button rows, badges and price blocks are written by hand in each design, so the same idea looks slightly different each time.

### 2.3 Proposed action per category

"Merge" means the design becomes a preset of the canonical design and its id stays as an alias. "Retire" is only for designs no template uses. The hero row is final for the pilot once approved. Every other row is an estimate that its category session confirms with screenshots.

| Category | Now | Used | Main duplicate groups found | Target | New |
|---|---|---|---|---|---|
| headers | 15 | 13 | `header-inline` ≈ `header-icons` ≈ `header-announcement-strip` (0.86–0.96); `header-classic` ≈ `header-search`; `header-line` ≈ `header-announcement` | 9 | 0 |
| **hero** | 18 | 17 | see §2.4 | 15 | 3 |
| categories | 17 | 13 | six data tile grids that differ only in the tile; eight static designs | 8 | 1 |
| products | 20 | 19 | `products-classic` ≈ `-grid` ≈ `-rail` ≈ `-rows` (0.81–0.93); `-carousel` ≈ `-boxed`; three tabbed designs | 11 | 0 |
| bundles | 11 | 0 | `bundle-plus` ≈ `bundle-tabs` | 6 | 0 |
| finder | 11 | 5 | five guided pickers | 7 | 0 |
| promotions | 14 | 0 | `promo-pair` ≈ `promo-twin`; four one-line bands; three countdown designs | 8 | 0 |
| features | 12 | 11 | `features-classic` ≈ `-trust-band`; `-icon-cards` ≈ `-columns` ≈ `-bento`; `-steps` ≈ `-ruled` | 7 | 0 |
| payment | 11 | 6 | `pay-open-box` ≈ `pay-days` (0.78) | 7 | 0 |
| statistics | 10 | 5 | `stats-classic` = `stats-strip` (1.0) ≈ `-big-numbers` ≈ `-band` | 5 | 0 |
| image-text | 15 | 11 | six photo-beside-text designs (`about-classic`, `-inset`, `-circle`, `-fullbleed`, `-split-story`, `-list`) | 9 | 0 |
| video | 10 | 1 | `video-split` ≈ `-vertical` ≈ `-film` | 6 | 0 |
| gallery | 11 | 5 | `gallery-polaroids` ≈ `-prints` (0.82); three square strips | 6 | 0 |
| brands | 10 | 4 | four wordmark grids | 6 | 1 |
| testimonials | 14 | 10 | `testimonials-ruled` ≈ `-bento` (0.89); four card grids | 8 | 0 |
| faq | 10 | 6 | four accordion layouts | 5 | 0 |
| blog | 10 | 0 | five card rows (0.93) | 5 | 0 |
| newsletter | 13 | 10 | `newsletter-classic` ≈ `-ruled` ≈ `-big` ≈ `-strip` | 7 | 0 |
| popups | 7 | 0 | none | 6 | 0 |
| loyalty | 2 | 0 | none | 2 | 0 |
| services | 11 | 5 | three request forms | 8 | 0 |
| about | 10 | 7 | two centred text blocks | 8 | 0 |
| contact | 11 | 1 | four WhatsApp layouts | 6 | 0 |
| tracking | 6 | 1 | none | 5 | 0 |
| rich-text | 12 | 7 | `text-callout` ≈ `-statement` ≈ `-brand-statement`; `-centered` ≈ `-note` | 6 | 0 |
| page-header | 10 | 2 | two title bars | 6 | 0 |
| product-page | 7 | 6 | none | 7 | 0 |
| cart | 4 | 0 | none | 4 | 0 |
| footers | 13 | 12 | `footer-centered` ≈ `-centered-light` ≈ `-links` ≈ `-line`; `footer-signup` ≈ `-columns-signup` | 8 | 0 |
| **Total** | **325** | **177** | | **about 201** | **5** |

So the library goes from 325 designs to about 200: about 130 ids become presets or are retired, and 5 are new. The 200 designs carry about 130 named presets and about 195 archetypes: after the merges nearly every design is its own archetype, and the few that share one differ in layout and interaction. No template loses a section, because every used id keeps working through its alias.

### 2.4 Hero (the pilot category)

| Archetype | Canonical | Action | Becomes a preset of it (alias kept) | Templates today |
|---|---|---|---|---|
| `hero/slider` | `hero-carousel` | UPGRADE | `hero-carousel-images` (photo only), `hero-carousel-panel` (light panel), `hero-thumbs` (bold, numbered) | 21 + 0 + 1 + 3 |
| `hero/split-media` | `hero-split` | UPGRADE | `hero-halves` (brand-colour half), `hero-classic` (arch photo) | 10 + 22 + 1 |
| `hero/full-bleed` | `hero-fullbleed` | KEEP (already motion v2) | `hero-banner` (countdown strip under it) | 11 + 2 |
| `hero/video` | `hero-video` | UPGRADE | | 11 |
| `hero/poster` | `hero-poster` | UPGRADE; drop the offer sticker from the default | | 8 |
| `hero/bento` | `hero-bento` | UPGRADE | | 7 |
| `hero/search` | `hero-search` | KEEP | | 7 |
| `hero/product-data` | `hero-big-word` | UPGRADE | | 6 |
| `hero/campaign-stack` | `hero-ticket` | UPGRADE | | 4 |
| `hero/collage` | `hero-collage` | UPGRADE | | 2 |
| `hero/type-led` | `hero-inline` | UPGRADE | | 1 |
| `hero/product-story` | `hero-product` | UPGRADE | | 1 |
| `hero/overlap-card` | new | BUILD: a wide photo with a text card overlapping its lower edge | | |
| `hero/category-doors` | new | BUILD: a short message over two or three category doors from store data | | |
| `hero/pinned-story` | new | BUILD: a pinned photo with two or three lines that change on scroll (motion v2 sticky steps) | | |

Result: 18 designs become 12, plus 3 new, so 15 designs and 14 presets. Six ids become aliases. No hero is retired, because 17 of 18 are in use.

### 2.5 Target matrix (archetypes per category)

The first number is how many archetypes exist today and the second is how many are missing. The category brief for each one (`docs/sections/<category>.md`, Phase 1F) holds the full list.

| Category | Archetypes we need | Have | Missing |
|---|---|---|---|
| hero | slider, split-media, full-bleed, video, poster, bento, search, product-data, product-story, campaign-stack, collage, type-led, overlap-card, category-doors, pinned-story | 12 | 3 |
| categories | tile-grid, circle-row, ruled-list, big-type-list, feature-plus-list, bento (data), photo-index, swipe-rail | 7 | 1 |
| products | grid, rail, tabbed, by-category, feature-plus-grid, bento, list-rows, shelf, spotlight, campaign, deal (library only) | 11 | 0 |
| image-text | split, overlap, wide, rows, values, list, steps (pinned), shop-the-look, before-after | 9 | 0 |
| testimonials | card-grid, wall, single-quote, rating-summary, chat, photo-cards, product-reviews, video | 8 | 0 |
| promotions (library only) | banner, tile-pair, bento, marquee, countdown, coupon, tiers, shipping-bar | 8 | 0 |
| features | icon-row, icon-cards, steps, checklist-photo, side-title, compare-table, ticker | 7 | 0 |
| brands | logo-row, logo-wall, brand-cards, press-quotes, a-z index, brand-rail (data) | 5 | 1 |
| newsletter | panel, centred, photo-split, banner, channels, interests, coupon (library only) | 7 | 0 |
| headers | commerce, minimal, centred-logo, announcement, mega-menu, floating, category-chips, ticker, brand-bar | 9 | 0 |
| footers | multi-column, minimal, wordmark, signup, centred, help, panel, dark-bar | 8 | 0 |
| The other 18 | listed in each category brief | 105 | 0 |

---

## 3. Audit of the templates

### 3.1 Numbers

| | |
|---|---|
| Templates | **119** (Classic plus 118 built from library designs) |
| Main style | bold 34, warm 25, minimal 20, classic 18, luxe 15, playful 7 |
| Trades | sports 14, fashion 13, beauty 12, food 12, home 12, electronics 11, jewelry 10, auto 10, kids 8, kitchen 6, handmade 4, six others 7 |
| Home page length | 4 sections: 6 templates; 5: 27; 6: 32; 7: 18; 8: 5; 9: 31 |
| Hero first, categories second | all 119 |
| Product sections on the home page | 0: 3 templates; 1: 69; 2: 17; 4: 1; 5: 29 |
| One product photo ratio on the home page | **64** (44 square, 20 portrait) |
| Mixed product photo ratios on the home page | **55** |
| Mixed category photo ratios on the home page | 8 |
| Product and category photos | `object-fit: cover` everywhere; no shared frame or background |
| Demo photos | 2,144 product photos and 735 category photos, all Pexels |

### 3.2 Findings

1. **The 29 niche templates are three home pages in ten trades.** 57 of the 67 near-identical template pairs are niche pairs. `fashion-luxe` and `kids-luxe` hold the same design in 89% of their home slots; so do `electronics-warm` and `jewelry-warm`, and `furniture-bold` and `gifts-bold`. Only the photos and copy differ.
2. **29 templates stack five product sections** (one grid plus four category rows). `template-rules.md` §2 asks for a visual break between product sections.
3. **55 templates mix product photo ratios** on one page, for example a square grid and then portrait category rows.
4. **Demo product photos are not white-background packshots.** They are Pexels photos chosen as lifestyle and studio shots (rails, shelves, tables), cropped with `cover`. I did not open the 2,144 photos one by one; the templates' own photo notes describe them. Under the white-packshot rule nearly all need replacing (§9, decision 4).
5. **Art direction is not recorded anywhere.** A template has photos but no statement of lighting, palette, studio or lifestyle, or people. Each template's photo notes say "no people, no logos", and that is the only rule applied. Hero and banner photo consistency was therefore not measurable in this audit; each template gets an eye check when it moves to the new system.
6. **56 templates show typed demo reviews on the home page**, and 8 show typed statistics (see §2.2).
7. **Four designs carry 118 templates each** (`about-classic`, `faq-columns`, `contact-form`, `page-header`). They are the first proof that an improvement flows to every template.

---

## 4. Data formats

### 4.1 Section manifest (Phase 1A)

The manifest sits on the design itself (`defineDesign({ …, manifest })`), so it cannot drift from the tree. Only judgement fields are written by hand. Everything that can be counted is read from the tree and exposed beside it.

```ts
// packages/store-sections/src/manifest/types.ts
type SectionManifest = {
  archetype: `${LibraryCategoryId}/${string}`;        // "hero/split-media"
  purpose: Purpose;                                   // the ten fixed values in the brief
  layout: "split" | "overlap" | "bento" | "full-bleed" | "rail" | "grid" | "stack" | "pinned" | "list" | "centered";
  density: "minimal" | "balanced" | "rich";
  visualWeight: "light" | "medium" | "heavy";
  styleFamilies: readonly TemplateStyle[];            // from TEMPLATE_STYLES, no new values
  bestFor: { industries: readonly StockIndustry[] | "all"; goals: readonly Goal[] };
  slotRoles: readonly SlotRole[];                     // §4.4
  tone: "light" | "dark" | "both";
  photoStyle: "lifestyle" | "packshot" | "flat-lay" | "none";
  photoRoles?: readonly PhotoRole[];                  // one per photo slot, in slot order
  presets: readonly SectionPresetDef[];               // §4.2; the first is the default
  aliases?: readonly AliasDef[];                      // §4.2
  quality: { scores: RubricScores; reviewed: string } | null;   // null fails the ship test
};

// Read from the tree by code, never written by hand (manifest/derive.ts):
type DerivedFacts = {
  id: string; version: number; category: LibraryCategoryId;
  photos: { count: number; ratios: Record<string, number> };
  textRoles: readonly string[];                       // the `role` props in the tree
  dataNeeds: readonly DataNeed[];                     // products, categories, brands, reviews, posts
  forms: readonly string[];
  interaction: "static" | "slider" | "tabs" | "accordion" | "hover-reveal" | "scroll-effect" | "form";
  motion: readonly string[];                          // "reveal:words", "scroll:parallax", "section:fade-exit"
  nodes: number;
};
```

`SectionPreset` (`library/types.ts`) keeps its shape, and `library.ts` fills `category`, `dataNeeds`, `capabilities`, `version` and `scrollEffect` from the manifest and the derived facts, so they are written once.

`manifest/catalog.ts` builds the catalog from `DESIGNS`. Tests fail when a design has no manifest, when a hand-written field contradicts a derived fact (for example `photoStyle: "none"` on a design with photos), or when an archetype's category is not the design's category.

### 4.2 Presets and aliases

A design's tree function takes typed options. A preset is a name plus an options object, so a preset is never a second tree.

```ts
type SectionPresetDef = { id: string; name: Localized; options: Record<string, string | number | boolean> };
type AliasDef = { id: string; preset: string };       // old design id → this design with that preset

// designs/hero/hero-split.ts
tree: (t, o: { panel: "tinted" | "brand" | "arch"; imageSide: "start" | "end" }) => …
```

- `getDesign("hero-halves")` returns `hero-split` with the `brand` preset. Template code, the library panel and AI picks all resolve through it.
- A store's saved section is never touched. It keeps its own tree and its `source: "hero-halves@2"`.
- A preset that replaces an old design keeps that design's `props.field` names. The field-names snapshot test checks each alias against the names recorded today.
- The library panel shows one card per design with its presets as choices, where today it shows one card per near-copy.

### 4.3 Style family tokens and the kit (Phase 1C)

```ts
// families/tokens.ts
type FamilyTokens = {
  type: { headingScale: "calm" | "display" | "editorial"; headingWeight: number; eyebrow: "caps" | "plain" };
  radius: { card: number; media: number; button: number };       // luxe 0 / 0 / 0, playful 24 / 24 / 999
  button: "solid" | "outline" | "pill" | "underline";
  card: "flat" | "bordered" | "shadow" | "tinted";
  sectionSpace: "airy" | "standard" | "compact";
  media: { treatment: "plain" | "framed" | "arched"; hoverZoom: boolean };
  productCard: ProductCardVariant;
};
const FAMILY_TOKENS: Record<TemplateStyle, FamilyTokens>;
```

Designs read tokens through the tree builder (`t.tokens`), so one design draws correctly in every family it lists. This replaces today's per-template `corners` clamp. Colours and fonts stay in the template's design system as today.

Kit primitives (`designs/kit/`, with `_kit.ts` re-exporting so nothing breaks): `sectionHead` (left, centred, split with link, eyebrow and title), `productCard(variant)`, `categoryTile(variant)`, `mediaFrame(ratio)` with the tokens `1:1`, `4:5`, `3:4`, `16:9`, `21:9`, `ctaRow`, `badge`, `priceBlock`, `rating`, `quote`, `stat`, `iconItem`. A test walks every design and fails on a hand-built subtree that matches a kit primitive's shape (a photo with name and price inside a product list, a heading block of eyebrow, title and subtitle) without the kit's marker label.

### 4.4 Blueprint, journey and template definition (Phase 2)

```ts
type SlotRole = "header" | "hero" | "categories" | "products-primary" | "visual-break"
  | "products-secondary" | "story" | "trust" | "social-proof" | "closing" | "footer";

type Slot = {
  role: SlotRole; required: boolean;
  archetypes: readonly string[];                       // allowed archetypes, or a category wildcard "products/*"
  dataSource?: "by-journey";                           // filled from the trade journey
  scheme?: "alternate";
};
type Blueprint = { id: string; page: "home" | "product" | "catalog" | "cart" | "about" | "contact"; slots: readonly Slot[]; rules: readonly RuleId[] };

type Journey = {                                       // templates/blueprint/journeys.ts, one per industry
  industry: StockIndustry;
  middle: readonly SlotRole[];                         // order of the slots between categories and closing
  primarySource: "newest" | "best-sellers" | "featured";
  secondarySource: "newest" | "best-sellers" | "featured" | "category";
};

type TemplateDefinitionV2 = {
  key: string; version: number; name: Localized; category: string;
  family: TemplateStyle; series?: string;              // §9 decision 6
  blueprint: string;
  brand: { palette: DesignSystemColors; fonts: FontPair };
  artDirection: {
    look: "studio" | "lifestyle"; people: false; palette: "warm" | "cool" | "neutral";
    slotRatios: Partial<Record<SlotRole, RatioToken>>;
    overlay: "dark-fade" | "light-fade" | "none";
    productStage: { ratio: "1:1" | "4:5"; background: string; fit: "contain"; padding: number };
  };
  picks: Partial<Record<SlotRole, { design: string; preset?: string; patch?: LibraryPatch }>>;   // pinned picks; the composer fills the rest
};
```

`TemplateDefinitionV2` compiles to today's `TemplateDefinition` through `libraryTemplate` and `fromLibrary`. `applyTemplate`, the gallery, the builder and stored site configs do not change.

Rules encoded in the home blueprint, each one a validator: one hero first; categories second; the middle follows the trade journey; trust and social proof come after the products they support; at most 9 sections; no two product sections without a break or a scheme change; schemes alternate and never three dark in a row; no design from a discount category and no discount copy (today's `no-discounts.ts`); no repeated archetype on a page.

### 4.5 Product stage (Phase 1D)

A render-time setting on the site's design system, `productStage: { ratio, background, fit: "contain", padding }`. When it is set, every image bound to a product photo (cards, rails, quick view, product page gallery) draws inside that frame, and the node's own ratio is ignored. When it is missing, rendering is exactly as today, so no existing store changes. New templates set it. A seller changes it under Theme. Category tiles get the same treatment through `artDirection.slotRatios.categories`.

### 4.6 Composer and suggestions (Phases 2D and 3)

```ts
compose(input: {
  industry: StockIndustry; style: TemplateStyle; tone: "light" | "dark"; goals: readonly Goal[];
  catalogShape: { productCount: number; categoryCount: number; hasBrands: boolean; hasReviews: boolean };
  pins?: TemplateDefinitionV2["picks"];
}): TemplateDefinitionV2

suggestSections(input: { slotRole: SlotRole; brief: Brief; page: Blueprint["page"]; used: readonly string[] }): readonly { design: string; preset: string; score: number }[]
```

The score for a design in a slot is a sum of fixed weights: slot role match (required), style family, industry and goals, tone, data needs the catalog can fill (a design that needs brands scores zero when `hasBrands` is false), and visual weight rhythm against the slot before it. Ties break by quality score, then by design id. The result is a pure function of the input: no clock, no randomness.

For the AI builder, the model returns only `{ industry hint, style words, tone, goals, keywords }`. The code maps that to `compose`. No section or template list is sent to the model (`docs/ai.md` rule 2), so the composer adds no tokens to a build.

### 4.7 Uniqueness gate (Phase 1B)

- **Fingerprint v2** adds what v1 missed: the card subtree inside each data list, list settings (tabs, swipe rail, source), the archetype, and motion effects.
- **Structural score** per same-category pair, in `pnpm test`. First thresholds from this audit: fail at 0.85, warn at 0.75. The pilot tunes them.
- **Variant rule**, in `pnpm test`: two designs with the same archetype, layout and interaction fail. They must become one design with two presets.
- **Visual score**: `pnpm sections:shots` renders each design at 390 and 1280 px with demo content and writes a 64-bit difference hash per design and width to `manifest/visual-hashes.json`, keyed by id and version. `pnpm test` compares the hashes and fails under a Hamming distance set in `uniqueness.config.ts`. A design whose version changed without a new hash also fails, so the file cannot go stale.
- All thresholds and the allow-list (pairs accepted on purpose, each with a reason) live in `manifest/uniqueness.config.ts`.

---

## 5. Order of work

Each phase ends with a PR that holds screenshots, the numbers and the decisions it needs. Each step is one or more small commits.

### Phase 1: the section system (PR 1)

| Step | Work | Main files |
|---|---|---|
| 1.1 | Manifest types, derived facts, catalog, tests. Manifests for all 325 designs: derived facts are automatic, and the hand fields get a first value by rule (archetype from subcategory, families "all") marked `quality: null` | `src/manifest/{types,derive,catalog}.ts`, `manifest.test.ts`, every design file |
| 1.2 | Tree options, presets and aliases in `defineDesign` and `getDesign`; alias and field-name tests | `designs/builder.ts`, `designs/index.ts`, `templates/library-fields.test.ts` |
| 1.3 | Fingerprint v2, structural gate, variant rule, config with today's known pairs on a shrinking allow-list | `src/manifest/{fingerprint,similarity,uniqueness.config}.ts`, `uniqueness.test.ts` |
| 1.4 | Screenshot script (Arabic and English, 390 / 768 / 1280, light and dark scheme), hash file, visual gate | `scripts/section-shots.ts`, `manifest/visual-hashes.json` |
| 1.5 | Kit primitives, family tokens, kit-use test | `designs/kit/*`, `src/families/tokens.ts` |
| 1.6 | Product stage in the renderer and Theme setting; demo photo audit script that flags photos whose border is not white | `elements/render.tsx`, `core/theme.ts`, `scripts/photo-audit.ts` |
| 1.7 | Rubric doc, score fields, `/dev-library` compare view with filters | `docs/systems/section-rubric.md`, `apps/ecommerce/app/[locale]/(dev-library)/` |
| 1.8 | `section-studio` skill and the 29 category briefs (generated from the catalog, then edited) | `.claude/skills/section-studio/SKILL.md`, `docs/sections/*.md` |

The existing 54 near-duplicate pairs do not block PR 1. They start on the allow-list, and each category session removes its own entries.

### Phase 2: the template system (PR 2)

| Step | Work | Main files |
|---|---|---|
| 2.1 | Slot roles, home blueprint, journeys for the 16 industries, blueprints for product, catalog, cart, about and contact | `templates/blueprint/{slots,home,pages,journeys}.ts` |
| 2.2 | `TemplateDefinitionV2`, art direction, compile to today's definition | `templates/define.ts`, `templates/art-direction.ts` |
| 2.3 | Validators and the template similarity check, run as report-only on the 119 existing templates | `templates/blueprint/validate.ts`, `template-system.test.ts` |
| 2.4 | Composer with scoring, tie-breaks and variety | `templates/compose/{compose,score}.ts` |
| 2.5 | Propagation doc and "update available" data: a stored section is behind when its `source` version is lower than the current version of the design its id resolves to. No store-side prompt is built | `docs/systems/propagation.md`, `templates/updates.lib.ts` |

Existing templates are not rewritten in Phase 2. Validators report on them; they fail only for templates declared as `TemplateDefinitionV2`.

### Phase 3: AI store builder (PR 3)

| Step | Work | Main files |
|---|---|---|
| 3.1 | Brief schema and the mapping from brief to `compose` input, matched in code | `packages/ai`, `templates/compose/brief.ts` |
| 3.2 | `suggestSections` and its use in the builder's Add panel | `templates/compose/suggest.ts`, `packages/store-editor` |
| 3.3 | Tests: the same brief gives the same result; every result passes the validators, over a grid of every industry × family × tone | `compose.test.ts` |

The template shortlist the builder uses today (`packages/store-editor/src/lib/template-shortlist.lib.ts`) stays. The composer is offered as a fourth suggestion, "made for you", until you decide it replaces the shortlist.

### Phase 4: pilot (PR 4), then stop

| Step | Work |
|---|---|
| 4.1 | Hero as in §2.4: 6 merges, 9 upgrades, 3 new designs, all with full manifests, kit primitives, motion v2, rubric scores of 4 or more, and the gate passing with no hero entry left on the allow-list |
| 4.2 | Rebuild `tallaby-classic`, `fashion-luxe` and `perfumes-bold` as `TemplateDefinitionV2` with art direction and product stage. Before and after screenshots and scroll videos at 390 and 1280 px in `docs/systems/pilot/` |
| 4.3 | Tune thresholds and the rubric; record what changed in `docs/systems/pilot/tuning.md` |
| 4.4 | `docs/systems/rollout.md`: products, categories, image-text, promotions, testimonials, then the rest, one category per session with the `section-studio` skill |

Changing Classic's design needs your approval (`CLAUDE.md` rule 12). Approving step 4.2 is that approval. Stores that already use Classic keep their site.

---

## 6. What existing stores see

Nothing changes for a store unless the seller chooses it.

- A store's sections are its own copies. Merges, upgrades and aliases change only what a new insert or a new "Use template" gets.
- Product stage applies only when the site's design system has the setting.
- Family tokens apply only to designs built after Phase 1C.
- The one shared-code risk is the renderer change for product stage. It is guarded by the missing-setting path and by the existing render snapshots.

---

## 7. Tests added

Manifest completeness and consistency; alias resolution and alias field names; structural gate; variant rule; visual hash gate; kit-use check; product stage render (with and without the setting); blueprint validators; template similarity; composer determinism and validity; `suggestSections` ranking. All existing tests keep passing: `designs.test.tsx` and its `EXPECTED` list keep every current id, because aliased ids stay resolvable.

---

## 8. Not in this plan

- Background removal for seller product photos (noted as a later option, as the brief asks).
- The store-side "update available" prompt. Phase 2 only makes the data available.
- A `brandList` data node and the `?brand=` catalog filter (gap G3), and a review data node. Both are needed to fix the fake-data problem in §2.2 and are decision 3 below.
- Rewriting the 116 templates outside the pilot. The rollout does that one trade at a time.

---

## 9. Decisions for you

1. **Motion v2 merge.** Merge `feat/motion-v2` to `main` before PR 1, or let PR 1 carry it?
2. **No section migrations.** Confirm that a design change is a new version in code plus a deploy, with no `section:sql`, since the tables are gone.
3. **Typed reviews, brands and numbers in templates.** Option A (recommended): add review and brand data nodes, bind those sections to store data, and hide them when the store has none. This is new work of about one session, before the testimonials category. Option B: keep them static and remove testimonials and statistics from every template home page. Option C: leave as today.
4. **White-background demo photos.** Nearly all 2,144 demo product photos need replacing. Option A (recommended): one shared set of about 20 white packshots per trade for 16 trades, about 320 photos, reused by every template of that trade. Option B: unique photos per template, about 2,100. In both cases, tell me who supplies them: you, a Pexels search I curate for your approval, or generated images.
5. **Product stage default.** `1:1` with a white background and `contain` for every new template, with `4:5` for fashion and jewelry? And should the three pilot templates switch to it?
6. **The 29 niche templates.** They would fail the template similarity check. Option A (recommended): mark each trio style as a series, allow the same sequence across trades inside a series, and never show two templates of one series together in the gallery or the AI suggestions. Option B: rework them so no two share a sequence.
7. **Hero rule.** Confirm one hero of any archetype first, in place of "hero carousel first".
8. **Home length.** `template-rules.md` says at most 10 in §2 and at most 9 in §2a. The plan uses 9. The 29 templates with five product sections then need a visual break or fewer rows when they move over.
9. **Dev dependencies.** Approve `@playwright/test` and `pngjs` for `packages/store-sections` (dev only).
10. **Hero merges in §2.4.** Approve the six merges and the three new archetypes, or change the list.
11. **Retiring unused designs.** 148 designs are in no template, but sellers may have inserted them. Retiring a design only hides it from the library; stores that used it keep their copy. Approve hiding, per category, in each session?
12. **Composer in the AI builder.** Offer the composed template as a fourth suggestion first (recommended), or replace the shortlist straight away?
