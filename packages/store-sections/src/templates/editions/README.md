# Niche editions

ROADMAP F-90, plan: `docs/systems/niche-editions-plan.md` §4.

An **edition** is a data pack (catalog, photos, copy) for one niche. A **look** is an existing template whose sections read their copy and photos from a content object. `applyEdition(look, edition)` builds the look with the pack. No section design is copied.

| File | What it holds |
|---|---|
| `types.ts` | `Edition`, `EditionCopy`, `EditionPhotos`, `LookContent`, `LookSlot`, `LookDefaults`, `LookJourney` |
| `apply.ts` | `editionTemplate`, `applyEdition`, `isEditionReady`, `lookSlots`, helpers `initialOf`, `copyrightLine`, `primaryHref` |
| `index.ts` | `EDITIONS`, `getEdition`, `editionsForLook`, `editionsForNiche`, `editionReadyLooks` |
| `validate.ts` | `validateEdition`, `sharedPhotos`, `EDITION_MEDIA_HOST` (tests only, not exported from the package) |
| `look-guard.test.ts` | Every converted look still builds its captured output, byte for byte |
| `editions.test.ts` | Every registered pack × look is valid; unit tests with a fixture pack |
| `packs/<industry>/<niche>.ts` | One pack per niche |

`fashion-luxe` is the reference conversion: `templates/fashion-luxe/index.ts`.

## 1. Convert a look

The rule: **with its default content the look must build exactly what it built before.** Do not bump its version.

1. **Capture first, before you touch the look's file.** From `packages/store-sections`:

   ```
   LOOK_FIXTURE=<key> npx vitest run src/templates/editions/look-guard.test.ts
   ```

   This writes `__fixtures__/<key>.v<version>.json` (the definition and the whole built site). It never overwrites. Check the file is new in `git status`. If you already edited the look, stash your edit, capture, then restore it.

2. **Sort every string and photo of the look into three groups.**
   - *Names the trade or the demo store* (a headline, a finder question, a service list, promises, FAQ, addresses, "Atelier", alt texts): a **slot**. Use the named group if one fits (table below); otherwise a custom slot, `custom.<kebab-name>` for copy and `photos.custom.<kebab-name>` for a photo. It moves into `DEFAULT_CONTENT`.
   - *Derived from the store name* (logo initial, copyright line, "About <store>"): compute it in the look from `c.store.name` with `initialOf` and `copyrightLine`.
   - *Generic shop labels* (New in, Best sellers, View all, Track order, Shipping, FAQ) and all layout patches (`nodes`, `links`, `retouch`): stay in the look.

3. **Write `const DEFAULT_CONTENT: LookDefaults = { ... }`** with the look's current values, copied character for character. Leave out `store` and `photos.tiles`: they come from the look's `demoStore`.

4. **Wrap the sections in `function look(c: LookContent, journey: LookJourney): LookParts`** that returns `{ header, footer, pages }`. Replace each moved value with its slot (`c.hero.title`). Keep the key order inside every `text`, `links` and `nodes` object: key order is part of the bytes. Keep `lib`, `PHOTOS`, the link constants and `DEMO` at module level.

5. **Journey.** The main product section reads `lists: [{ source: journey.primary }]` and links to `primaryHref(journey.primary)`. Each category row reads its place from `journey.rows[n]`. The look's defaults go in `journey: { primary, rows }`; `rows` has one place per category row (an empty list if the look has none). With `categoryRows(lib, …)` (places 1 to N in order), keep the call for the default and declare `rows: [1, 2, 3, 4]`; an edition can then only reorder if you build the rows from `journey.rows` yourself.

6. **Replace `libraryTemplate({...})` with `editionTemplate({...})`**: the same fields, minus `header`, `footer`, `pages`, plus `lib`, `look`, `slots`, `optional`, `journey`, `defaultContent` (and `dark: true` if the page is dark). `productPage` and `productStage` stay as fields.

7. **Declare the slots.** `slots` lists every slot the look reads; `optional` lists slots it uses only when present (read those with a check, as `fashion-luxe` does for `photos.hero.video`). A slot is a path: a leaf (`hero.title`, `trust.2`, `photos.look.dots.0`) or a whole group (`hero`, `about`). `store` and `photos.tiles` are always there and are never declared. The look is run behind a guard: reading a slot that is not declared throws when the module loads, so the list cannot go stale.

8. **Run the guard and the template tests.**

   ```
   npx vitest run src/templates
   npx tsc --noEmit
   ```

   When the guard fails it names the first difference as a JSON path. Fix the look, never the fixture.

### Slot names

The same names in every look. A look uses the ones that fit its sections.

| Slot | Meaning |
|---|---|
| `store.name`, `store.description` | The demo store (always present) |
| `announcement.0..2` | Announcement bar or ticker lines |
| `labels.about`, `labels.search` | The header's about link when it names the trade; the search placeholder |
| `nav.N` (`label`, `href`) | Header links a trade names |
| `hero.alt`, `.eyebrow`, `.title`, `.line`, `.cta` | The hero. A search hero's placeholder is `hero.line` |
| `categories.title` | The categories section title |
| `products.primary.title`, `.line` (`.eyebrow`, `.cta`, `.alt` optional) | The main product section (grid, rows or spotlight) |
| `story.alt`, `.eyebrow`, `.title`, `.text`, `.cta` | The story block on the home page |
| `rows.N.title`, `.line` | Titles of product rows that are not category rows |
| `look.alt`, `.eyebrow`, `.title`, `.text` | Shop the look |
| `trust.0..3` (`title`, `line`) | Promises |
| `help.title`, `.line`, `.points.N` | A help or service block |
| `finder.title`, `.line`, `.options.N` (`label`, `href`) | A finder |
| `reviews.title`, `.items.N` (`quote`, `name`) | Buyer quotes |
| `newsletter.title`, `.line` (`.eyebrow`, `.note` optional) | Newsletter |
| `footer.line` | The footer's line about the store |
| `about.line`, `.alt`, `.eyebrow`, `.title`, `.text`, `.more`, `.cta` | The about page |
| `contact.title`, `.line`, `.heading` | The contact page |
| `faq.line`, `.question`, `.answer` | The FAQ page |
| `photos.hero.wide`, `.tall`, `.video` | Hero photo 16:9, 4:5 for phones, optional background video (its poster is `wide`) |
| `photos.tiles.N` | Category tiles 3:4 (they are the categories' images; always present) |
| `photos.banner` | 21:9 |
| `photos.story` | 4:5 |
| `photos.about` | A third photo block, optional in a pack: fall back to `photos.story` |
| `photos.look.src`, `.dots.N` (`x`, `y`) | The shop-the-look flat lay and its dots |
| `custom.<key>`, `photos.custom.<key>` | Copy or a photo of a section no group above fits |

### Custom slots

For a section no named group fits (comparison table, stats band, installments, branches, marquee phrases, price menu, a second banner):

```ts
// defaultContent
custom: { "compare-title": L("…", "…"), "compare-row-1": L("…", "…") },
photos: { custom: { "banner-2": PHOTOS.bento } },
// slots
slots: ["custom.compare-title", "custom.compare-row-1", "photos.custom.banner-2"],
// in look()
c.custom["compare-title"]!
```

- One flat map: every value is one `{ ar, en }` (or one photo URL). A list is numbered keys (`stat-1`, `stat-2`); a label with a link is a key for the label and a fixed catalog link in the look.
- Keys are kebab-case and start with the section's job (`compare-`, `stats-`, `branches-`), so two looks that show the same kind of section can share keys and a pack writes them once. Before inventing a key, search the other converted looks for one that means the same thing.
- Declare each key as its own slot (`custom.<key>`), never the whole `custom` group. The guard and the pack check treat it like any other slot.
- Say in a comment beside the key what the pack writer must supply (length, what it sits next to).

Map each photo block of the look to the slot with the nearest ratio and say which in a comment. `fashion-luxe`: two-tone band = `banner`, about page = `story`.

### Pitfalls

- **Do not edit `types.ts`, `apply.ts` or `validate.ts`.** They are shared by every conversion running in parallel. A section with no named group uses custom slots (above); if you think a named group is missing, say so in your report.
- **Category names typed by hand** (a header link "Chargers" to `/products?search=…`): use `nav`, never a constant.
- **`lib` corners.** `editionTemplate` passes the look's `lib` to the product page. Every pilot look has `corners` equal to `radius`, so nothing changes; the guard will tell you if yours differs.
- **Optional sections.** If the look drops a section when a slot is absent, check the home still has a break between two product sections.
- **`labels.about` and friends are leaves of an optional group in a pack.** Declare the leaf (`labels.about`), not the group.
- **Demo order matters** where a section shows "the three newest" (the look dots): say so in a comment beside the slot, pack writers need it.
- **Do not edit** `niches.ts`, `match.ts`, `index.ts` or their tests here. Your change is your look's file and its fixture.

## 2. Write a pack

One file per niche: `packs/<industry>/<niche>.ts` exporting `const <NICHE>: Edition`. Register it in `EDITIONS` in `index.ts`. `looks` lists only looks the pack ships on: each must be edition-ready, and `editions.test.ts` validates the pack on every one.

```ts
export const DRESSES: Edition = {
  niche: "dresses",                       // an id from niches.ts
  looks: ["fashion-luxe", "vella"],       // best first
  priceBand: { min: 400, max: 9000 },     // EGP
  productStage: { ratio: "4:5", fit: "contain" },
  demo: demoStore({ name, description, categories: [[id, ar, en, TILES[0]], …], products: [...] }),
  photos: { hero: { wide, tall }, tiles: TILES, banner, story },
  copy: { announcement: [3 lines], hero, categories, products, story, trust: [4 promises], newsletter, about, contact, faq },
};
```

Rules the validator enforces (`validateEdition`):

- 4 to 8 categories, 12 to 24 products, every product in one of the categories, at least 3 products per category, prices inside `priceBand`.
- Every string in Arabic and English, neither empty, Arabic on the Arabic side only. Hero title at most 6 words in each language. No offer or discount words.
- Exactly 3 announcement lines and 4 promises (a look shows the first ones it has room for).
- Photos: https, from `images.pexels.com` or `EDITION_MEDIA_HOST`; no photo twice in the pack (the same Pexels id at two widths counts as one) or in another pack. `photos.tiles` has one photo per category, in order; pass the same URL as the category's image in `demoStore`, or leave the image null.
- At most two `extras`, each a library design that is not a promotion; an extra's own links and copy are patched strictly.
- On each look: the pack holds every slot the look declares (the error names them), every page builds, every link goes to a page of the look or a catalog route, and the catalog fills every list the look shows (a row of four needs four products in that category; `journey.primary: "featured"` needs enough featured products).

Also, not checked by code: one ratio per photo slot, white-background packshots, no people or logos, and product order where a look shows the newest products (`fashion-luxe`: the first three products are the look photo's dots).

`productPage.copy` replaces the look's reviews and related titles; set it when the look's own wording does not fit the trade. `journey` changes what the main grid shows and which categories the rows show. `photos.dark` replaces single photos on looks declared `dark` (custom photos key by key). `copy.custom` and `photos.custom` hold the custom keys the pack's looks declare; a missing one is named by the validator. `variants` is for the product page preview and is not drawn yet.

`applyEdition` returns the look's key and version with `edition: "<niche>"`, the pack's `demo` and a new `config()`. A copy, link or list that a section does not hold throws when `config()` runs, as for any library template.
