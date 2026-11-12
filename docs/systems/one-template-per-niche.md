# One template per niche

ROADMAP F-90. Owner, 2026-11-11: "Work on niches per industry, remove the not niche templates, make each niche template unique, no duplicated templates … less templates but unique, per niche, high quality and good UI/UX, good photos selected to look premium and professional."

Owner decisions (2026-11-11):

1. **Per industry.** An industry switches to niche-only templates when every one of its niches has its template. Until then its current templates stay. Templates the switch leaves out are deleted from code (stores keep their own copies, as on 2026-11-04).
2. **One template per niche.** About 83 templates in the end, instead of 119.
3. **Layout must differ.** No base template (look) is used by two niches. Each niche template has its own home order, section designs, colours and type, not only its own photos and copy.

Tallaby Classic stays: it is the default starting site, not a niche template.

Owner, 2026-11-12: "Adjust our templates: remove unneeded templates/themes, keep only the templates that will be niches." Decision: **map all niches now and delete the rest**, without waiting per industry (this replaces decision 1's "until then its current templates stay"). Every industry is switched; a niche whose pack is not built yet shows its template's own content (`own`). **Templates: 116 → 84** (83 niche templates + Tallaby Classic); 32 deleted, no migration.

---

## 1. How it works in code

- **`NICHE_TEMPLATES`** (`packages/store-sections/src/templates/editions/niche-templates.ts`): one row per niche (83), `{ niche, template, edition?, status }`. `edition` is the niche pack drawn on that template; a template whose own content is already the niche (Sitara, Fadda, Saa) has no pack (`native`). `status`: `ready` (pack drawn, or native), `own` (shown with the template's own content until the pack is built; the agent that builds the pack adds `edition` and flips the row to `ready`), `pending` (not shown; unused since 2026-11-12).
- **Rule, tested:** a template appears in at most one row, a pack is drawn on exactly one template (its `looks` is that template only, no `perLook` for another), every template but Tallaby Classic appears in a row, and a template's `category` is its niche's industry (borrowed templates were moved; `kasr` keeps `fashion` because its edition-ready output is guarded byte for byte, and its row lists it under shoes & bags).
- **`SWITCHED_INDUSTRIES`**: industries whose galleries are niche-only (all 17 since 2026-11-12). In a switched industry the gallery shows one card per niche (the niche's name on the card, its edition applied in the tile, preview and "Use template"); the niche tabs stay as filters, each tab now holding one card. Unswitched industries show their templates as today.
- **Per-look content of a pack** (`perLook`) for templates it no longer draws on is deleted with the switch, so the pack holds one shop.
- **AI builder and onboarding:** the shortlist ranks the niche template first when `matchNiche` finds the store's niche.

## 2. The map: all 83 niches (2026-11-12)

Wave 1 (fashion, shoes & bags, accessories, mobile accessories, electronics) is unchanged below; waves 2–13 follow in §2.1. In code every row is `ready` (✓ or native) or `own` (the *convert* and *new pack* rows still waiting, and every later-wave row: the template's own content shows until the pack is built).

✓ = the pack already draws on this template. *convert* = the template must be made edition-ready (`editions/README.md` §1) and the pack's copy and photos fitted to it. *native* = the template is already this niche; no pack. *new pack* = needs a pack and the photos in `editions-photos.md`.

| Industry | Niche | Template | State |
|---|---|---|---|
| fashion | dresses | `fashion-luxe` Hareer | ✓ |
| | lingerie-sleepwear | `vella` | ✓ |
| | tshirts | `streetwear` | ✓ |
| | menswear | `zay` | ✓ |
| | pants-jeans | `fashion-bold` Alwan | convert |
| | sportswear | `sports-luxe` Madar | convert |
| | modest-wear | `sitara` | native, then new pack |
| | kidswear | `fashion-warm` Nawl | convert, new pack |
| shoes-bags | handbags | `shanta` | convert |
| | womens-shoes | `kasr` | convert |
| | mens-shoes | `ghorza` | convert |
| | slippers-clogs | `tasfya` | convert |
| | sneakers | `sports-bold` Nabd | convert |
| | backpacks-travel | `safar` | convert, new pack |
| accessories | gold-jewelry | `jewelry-luxe` Masa | ✓ |
| | glasses | `karat` | ✓ |
| | watches | `saat` | convert (pack needs 6 more packshots for 6 categories) |
| | fashion-jewelry | `zahra` | convert |
| | hair-accessories | `kholkhal` | convert |
| | belts-wallets | `jewelry-warm` Tibr | convert |
| | silver-jewelry | `fadda` | native, then new pack |
| mobile-accessories | phone-cases | `volt` | ✓ |
| | chargers-cables | `kabl` | ✓ |
| | earbuds | `wasla` | convert, new pack |
| electronics | pc-gaming | `arena` | ✓ |
| | lighting-smart-home | `zaki` | ✓ |
| | mobiles | `techhub` | convert, new pack |
| | audio | `electronics-luxe` Atheer | convert, new pack |
| | wearables | `saa` | native, then new pack |
| | small-appliances | `shasha` | convert, new pack |

`sports-luxe`, `sports-bold` and `safar` are borrowed from sports and auto, so those waves pick other templates. `nour` (lighting) left `lighting-smart-home` and was deleted on 2026-11-12 (no home niche needed it).

**Deleted:** `lulu`, `mahr`, `jewelry-bold` with the accessories switch (2026-11-12, first); `kettan`, `nasig`, `mawsem` (fashion) and `arcade`, `tany`, `electronics-bold`, `electronics-warm` (electronics) with the switch of everything else (2026-11-12). Wave 1 went from 37 templates to 30.

**Packs, one template each (2026-11-12):** every pack's `looks` is its niche's template only, and the `perLook` content for other looks was removed (dresses on vella; tshirts, menswear, pants-jeans, handbags on fashion-luxe; sportswear, sneakers, slippers-clogs on streetwear; slippers-clogs on zay; pc-gaming and chargers-cables on volt). `lighting-smart-home` was written for nour with Zaki's shop as `perLook.zaki`; the registered pack is now `editionForLook(base, "zaki")`, so Zaki shows exactly what it showed.

### 2.1 Waves 2–13 (every row `own`: the template's own content until the niche's pack and photos arrive)

Picked from the niche's industry first, the most polished and most recently revised first (template version, a home of six or more sections, a section the trade needs), each layout used once. Health and pets had no template, and sweets and books too few: they borrow templates other niches did not need, and each borrowed template's `category` moved to its niche's industry so that tab lists it. Judged from each template's home sections, description and version, not from screenshots (no dev server was run).

| Industry | Niche | Template | Why |
|---|---|---|---|
| beauty | skincare | `pure` Pure (v4) | Calm skincare: photo tiles, a four-step routine, ratings and FAQ; the niche's first pick |
| | makeup | `beauty-bold` Bombi | Colour-pop carousel, big-type categories, tabbed rows; fuller than `kohl` (four sections, deleted) |
| | perfumes | `perfumes-bold` Shaza (v2) | The look-first pilot redesign: video hero, one bottle explained dot by dot |
| | haircare | `botanica` Sage (v5) | Hair and body care: farm to bottle, refills, the founder's letter |
| | mens-grooming | `barber` | The chair price menu and booking, the trade's own section |
| home | furniture | `furniture-luxe` Marmar | The approved furniture niche template: a marble living-room video, large room photos |
| | bedding-textiles | `mafrash` | A 30-night trial, the bed set, Egyptian cotton |
| | decor | `rokn` | Decor by person and budget (price-band finder) |
| | plants-garden | `zarea` | Choose by light, care in steps, customers' green corners |
| | home-organisation | `tanzim` (from kitchen) | Built for home organisation: most reordered, delivery days |
| kitchen | cookware | `matbakh` | Search hero, departments, a budget shelf, open before you pay |
| | tableware | `sufra` | A full-bleed table, the Friday set, shop by budget |
| | coffee-gear | `qahwa` | Coffee gear at home, the big word, gifts for coffee people |
| | kitchen-appliances | `beity` | Banner carousel, departments, this week's shelf |
| food | grocery | `souq` | Supermarket carousel, aisles, 45-minute zones |
| | fresh-produce | `khodar` | Free-delivery goal, the weekly box, a 3 pm cut-off |
| | meat-poultry | `lahma` | Eid box poster, this week's cuts, cold-chain zones |
| | bakery | `loaf` (v4) | A big word, today's shelf, the weekly loaf |
| | spices-herbs | `atara` | Ruled categories, a product list, ground fresh |
| | fast-food | `sizzle` | Food in the headline, how we cook, regulars |
| sweets | oriental-sweets | `halawa` | Seasonal campaigns, gifts for every visit, fifty years of trays |
| | chocolate-cakes | `roast` (v4, from food) | A rich, dark full-bleed hero, panel rail and gallery that suit chocolate |
| | coffee-beans | `bunn` | Subscription, start here, a brewing guide |
| | dates-nuts | `grocery-luxe` Mazaq (from food) | A quiet fine-food store with tall aisle photos |
| kids | toys | `farha` | Carousel, shop by age, top kits, safe to play |
| | baby-essentials | `bambino` (v4) | A registry in four steps, safety promises (`mama` deleted) |
| | kids-gifts | `hadaya` | The right gift in two minutes, by age and budget |
| | school-supplies | `kids-bold` Farfoosh | Loud colourful carousel, round categories, a best-seller bento |
| sports | gym-fitness | `core` (v4) | A featured product, the numbers, strength equipment |
| | football | `koora` | Team orders, quantity pricing |
| | running | `stride` | Ticket slides, bento aisles, runners' messages |
| | cycling | `darraga` | First-ride essentials, workshop prices, branches |
| | outdoor-camping | `basecamp` (v4) | Desert season poster, brands, how renting works |
| | yoga | `yoga` Sukoon | Studio favourites, the teachers, book a class |
| health | vitamins-supplements | `nada` (from beauty) | Clean and minimal: a routine, ruled promises, steps |
| | pharmacy-care | `ward` (from beauty) | Everyday care: banner carousel, refills, questions |
| | medical-devices | `beauty-luxe` Safa (from beauty) | Quiet and clinical: a white-product video, a ruled category index, tall cards |
| pets | pet-food | `grocery-warm` Gheit (from food) | Warm feature-list aisles and four category rows, food by the bag |
| | pet-accessories | `kids-warm` Hodn (from kids) | A warm family shop with a gifts panel |
| | fish-birds | `sabaha` (from sports) | A full-width water hero, for aquariums |
| auto | car-accessories | `garage` (v4) | Season poster, drivers' picks, a comparison |
| | car-care | `garagy` | Monthly wash plans, how a wash works |
| | tyres-batteries | `tyre` Kawetch | Search by size, home fitting booking, instalments |
| | motorcycle | `moto` (v4) | Certified helmets, riders' picks, brands |
| | car-interior | `zeina` | A bento hero, shop by area |
| | ev-charging | `kahraba` | Home chargers, installation steps, survey booking |
| handmade | handmade-gifts | `gifts-warm` Sabat | Workshop feel, the makers' story |
| | ceramics | `fokhar` | This week's firing, the potters, double-boxed delivery |
| | candles-soap | `gifts-luxe` Wahag | A candlelit video, ruled categories |
| | crochet-embroidery | `tawla` (from home) | Textiles fresh from the loom, care |
| books | books | `hekaya` | The shelf, pick your reader's age, publishers |
| | stationery | `doodle` (from kids) | A playful bento opening and favourites |
| | kids-books | `kids-luxe` Toot (from kids) | A calm boutique with hairline category cells |

**No niche needs a new template.** Weak fits to redesign first (their own content is another trade until the pack arrives): the three health rows (beauty templates), the three pets rows, `roast` for chocolate, `doodle` for stationery, `kids-luxe` for children's books, and wave 1's `fashion-warm` (kids' wear), whose own content is adult fashion.

**Deleted with this map (2026-11-12), 25 more:** `bashra`, `kohl`, `perfumes-luxe`, `perfumes-warm` (beauty); `sakan`, `dar`, `mobilia`, `nour`, `salon`, `furniture-bold`, `furniture-warm` (home); `daily` (kitchen); `harvest`, `sabaho`, `grocery-bold` (food); `mama` (kids); `pace`, `rep`, `boxing`, `nashat`, `sports-warm` (sports); `drive`, `pitstop`, `tarik` (auto); `gifts-bold` (handmade). With wave 1's seven: 32. Their tallaby.com pages redirect to their old category's gallery (`apps/ecommerce/redirects.mjs`).

**Category moved with the map:** `tanzim` → home; `roast`, `grocery-luxe` → sweets; `nada`, `ward`, `beauty-luxe` → health; `grocery-warm`, `kids-warm`, `sabaha` → pets; `tawla` → handmade; `doodle`, `kids-luxe` → books; `safar` → shoes-bags; `wasla` → mobile-accessories. On tallaby.com, health and pets fall under the general (`ge`) filter, as handmade and books already did.

**Stores on a deleted template** keep their own drafts and live site. A lookup by key returns nothing, and every caller already skips or refuses it (gallery, preview, Admin theme dialog, apply); an AI build that chose a deleted template installs Tallaby Classic instead (`installTarget` in the dashboard AI builder).

**Counts:** 84 templates (83 + Classic), 83 rows (30 wave 1 + 53 later), 21 packs (one template each), 17 industries switched.

## 3. The quality bar for every niche template

Each conversion is also a redesign to the look-first standard of the pilot (`docs/systems/plan.md` §10, `docs/template-rules.md`), with the `frontend-design` skill loaded:

- A hero that opens with the trade's most characteristic thing (the product on a stage, the material, the place), photo cropped tall on phones with the copy on it.
- Photo category tiles, a main product grid on the product stage (white packshots), a story or editorial break, product rows with one photo-led break, promises, a one-row newsletter.
- Its own palette and type pair, chosen for the trade, not shared with another niche template in the same industry. No warm-cream-and-terracotta default, no acid-lime-on-black default, no all-caps eyebrows over every heading.
- One section the trade needs that the others don't (a size guide or fitting note, the day's gold price, shop by phone model, a care block, a before/after, product dots on a photo), from the library only.
- Motion: one orchestrated hero moment and the library's scroll reveals; nothing else moves.
- Photos: white-background packshots for products; art-directed photos with no people, logos or lettering, none used by another template or pack, checked by eye. **Source: `docs/systems/editions-photos.md` only (owner, 2026-11-12):** every photo is generated from its prompts; no new Pexels or other stock photos. A slot with no prompt yet gets one added there, and waits for its image (a Pexels photo already in a template stays until its replacement arrives).
- Checked at 390 and 1280 px in Arabic and English through `/template-preview/<key>?edition=<niche>`; no sideways overflow.

## 4. Waves after this

Beauty, home, kitchen, food, sweets, kids, sports, health, pets, auto, handmade and books follow one industry per session, with the same map, the same quality bar and their photo lists added to `editions-photos.md` before the work starts.
