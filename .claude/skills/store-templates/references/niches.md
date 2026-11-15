# Niches: industries → niches → templates

Read from the code on 2026-11-15 (working tree, food wave in progress). Re-read `NICHE_TEMPLATES` before quoting a status.

## The pieces

| Piece | File | What it is |
|---|---|---|
| Industries | `packages/store-editor/src/lib/industries.lib.ts` (`STORE_INDUSTRIES`) | The 17 store industries a seller picks |
| Niches | `packages/store-sections/src/templates/editions/niches.ts` (`NICHES`) | 83 sub-trades, each in one industry, with Arabic and English names and the keywords a seller would type (Egyptian spellings included). A niche id is permanent once shipped. No brand names. |
| Matching | `editions/match.ts` (`matchNiche`) | Code-only keyword matching (normalised Arabic, small edit distance). The AI model never receives the niche list (`docs/ai.md`); it may return a short hint that the code matches. |
| The map | `editions/niche-templates.ts` (`NICHE_TEMPLATES`) | One row per niche: `{ niche, template, edition?, status }`, one row per line (the screenshot script parses it). |
| Switched industries | `SWITCHED_INDUSTRIES` in the same file | All 17 since 2026-11-12: each gallery shows one card per niche. |
| Packs | `editions/packs/<industry>/<niche>.ts`, `EDITIONS` in `editions/index.ts` | One niche's catalog, photos and copy. |

## Statuses

- **`ready`**: the pack draws on the template (the template is in the pack's `looks`), or the row is **native** (no `edition`: the template's own content already is that niche: `sitara`, `fadda`, `saa`).
- **`own`**: shown in the gallery with the template's own content until the niche's pack is built. The agent that builds the pack adds `edition` and flips the row to `ready`.
- **`pending`**: not shown. No row uses it since 2026-11-12.

Rules enforced by `editions/niche-templates.test.ts`: a template is in at most one row; a niche in one row; every `edition` is in `EDITIONS` and, when `ready`, drawn on that template only (its `looks` is that one template); every niche of a switched industry has a shown row; every template except Tallaby Classic is in a row; a template's `category` is its niche's industry (`kasr` keeps `fashion` because its guarded output can't change; its row sits under shoes & bags).

## The map (✓ pack = ready with a pack, native = ready without one, own = waiting for its pack)

| Industry | Niches | Niche (English name) → template |
|---|---|---|
| fashion | 8 | dresses → `fashion-luxe` ✓; lingerie-sleepwear → `vella` ✓; tshirts → `streetwear` ✓; menswear → `zay` ✓; pants-jeans → `fashion-bold` ✓; sportswear → `sports-luxe` ✓; modest-wear → `sitara` native; kidswear → `fashion-warm` own |
| shoes-bags | 6 | handbags → `shanta` ✓; womens-shoes → `kasr` ✓; mens-shoes → `ghorza` ✓; slippers-clogs → `tasfya` ✓; sneakers → `sports-bold` ✓; backpacks-travel → `safar` own |
| jewelry (Accessories & jewelry) | 7 | gold-jewelry → `jewelry-luxe` ✓; glasses → `karat` ✓; watches → `saat` ✓; fashion-jewelry → `zahra` ✓; hair-accessories → `kholkhal` ✓; belts-wallets → `jewelry-warm` ✓; silver-jewelry → `fadda` native |
| mobile-accessories | 3 | phone-cases → `volt` ✓; chargers-cables → `kabl` ✓; earbuds → `wasla` own |
| electronics | 6 | pc-gaming → `arena` ✓; lighting-smart-home → `zaki` ✓; mobiles → `techhub` own; audio → `electronics-luxe` own; wearables → `saa` native; small-appliances → `shasha` own |
| beauty | 5 | skincare → `pure` ✓; mens-grooming → `barber` ✓; makeup → `beauty-bold` own; perfumes → `perfumes-bold` own; haircare → `botanica` own |
| home | 5 | furniture → `furniture-luxe` ✓; bedding-textiles → `mafrash` ✓; decor → `rokn` ✓; home-organisation → `tanzim` ✓; plants-garden → `zarea` own |
| kitchen | 4 | cookware → `matbakh` ✓; tableware → `sufra` ✓; coffee-gear → `qahwa` ✓; kitchen-appliances → `beity` own |
| food | 6 | fresh-produce → `khodar` ✓; meat-poultry → `lahma` ✓; bakery → `loaf` ✓; spices-herbs → `atara` ✓ (these four are uncommitted, in progress); grocery → `souq` own; fast-food → `sizzle` own |
| sweets | 4 | oriental-sweets → `halawa`; chocolate-cakes → `roast`; coffee-beans → `bunn`; dates-nuts → `grocery-luxe` (all own) |
| kids | 4 | toys → `farha`; baby-essentials → `bambino`; kids-gifts → `hadaya`; school-supplies → `kids-bold` (all own) |
| sports | 6 | gym-fitness → `core`; football → `koora`; running → `stride`; cycling → `darraga`; outdoor-camping → `basecamp`; yoga → `yoga` (all own) |
| health | 3 | vitamins-supplements → `nada`; pharmacy-care → `ward`; medical-devices → `beauty-luxe` (all own) |
| pets | 3 | pet-food → `grocery-warm`; pet-accessories → `kids-warm`; fish-birds → `sabaha` (all own) |
| auto | 6 | car-accessories → `garage`; car-care → `garagy`; tyres-batteries → `tyre`; motorcycle → `moto`; car-interior → `zeina`; ev-charging → `kahraba` (all own) |
| handmade | 4 | handmade-gifts → `gifts-warm`; ceramics → `fokhar`; candles-soap → `gifts-luxe`; crochet-embroidery → `tawla` (all own) |
| books | 3 | books → `hekaya`; stationery → `doodle`; kids-books → `kids-luxe` (all own) |

Totals: 83 niches, 37 ready (34 packs + 3 native), 46 own. Several templates are borrowed from another industry's design family (`tanzim` is a kitchen template serving home; `roast` and `grocery-luxe` are food templates serving sweets; `doodle` and `kids-luxe` kids templates serving books), but each template's `category` is now its niche's industry.

The photo status of every niche (what is generated, what is still missing) is in `docs/systems/editions-photos.md` → "Status". A niche moves to `ready` only when its essential photos exist.

## Adding a niche

1. **Owner first.** A new niche needs its own template (one template per niche), so it is an owner decision. Proposed new niches wait in `docs/systems/editions-photos.md` "Wave 14" (flowers-bouquets, homemade-food, home-cleaning, prayer-essentials, tools-hardware) until each has a template. Log the request in `ROADMAP.md` §5 (`CLAUDE.md` rule 19).
2. **Niche row** in `NICHES` (`niches.ts`): a new permanent id, its industry, Arabic and English names, keywords a seller would type (no brands). A word that belongs to two niches must be listed in `SHARED_KEYWORDS` in `niches.test.ts`. Run `npx vitest run src/templates/editions/niches.test.ts src/templates/editions/match.test.ts`.
3. **A template no other row uses**: a new template in its own folder, registered in `LIBRARY_TEMPLATES` (`catalog.ts`), with `category` = the niche's industry. It must differ in layout, palette and type from the other templates of its industry.
4. **Map row** in `NICHE_TEMPLATES`, one line, `status: "own"` until the pack and photos exist.
5. **Photos:** add the niche's section (prompts, palette, "Save to") to `docs/systems/editions-photos.md` before any photo work (references/photos.md).
6. **Pack**, then flip the row to `ready` (references/workflow.md).
7. Shoot its card screenshots, update `docs/systems/one-template-per-niche.md` counts and the ROADMAP F-90 log.
