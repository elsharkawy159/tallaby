# One template per niche

ROADMAP F-90. Owner, 2026-11-11: "Work on niches per industry, remove the not niche templates, make each niche template unique, no duplicated templates … less templates but unique, per niche, high quality and good UI/UX, good photos selected to look premium and professional."

Owner decisions (2026-11-11):

1. **Per industry.** An industry switches to niche-only templates when every one of its niches has its template. Until then its current templates stay. Templates the switch leaves out are deleted from code (stores keep their own copies, as on 2026-11-04).
2. **One template per niche.** About 83 templates in the end, instead of 119.
3. **Layout must differ.** No base template (look) is used by two niches. Each niche template has its own home order, section designs, colours and type, not only its own photos and copy.

Tallaby Classic stays: it is the default starting site, not a niche template.

---

## 1. How it works in code

- **`NICHE_TEMPLATES`** (`packages/store-sections/src/templates/editions/niche-templates.ts`): one row per niche, `{ niche, template, edition? }`. `edition` is the niche pack drawn on that template; a template whose own content is already the niche (Sitara, Fadda, Saa) has no pack (`native`).
- **Rule, tested:** a template appears in at most one row, a pack is drawn on exactly one template, and every template of a switched industry appears in a row.
- **`SWITCHED_INDUSTRIES`**: industries whose galleries are niche-only. In a switched industry the gallery shows one card per niche (the niche's name on the card, its edition applied in the tile, preview and "Use template"); the niche tabs stay as filters, each tab now holding one card. Unswitched industries show their templates as today.
- **Per-look content of a pack** (`perLook`) for templates it no longer draws on is deleted with the switch, so the pack holds one shop.
- **AI builder and onboarding:** the shortlist ranks the niche template first when `matchNiche` finds the store's niche.

## 2. The map, wave 1 (fashion, shoes & bags, accessories, mobile accessories, electronics)

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

`sports-luxe`, `sports-bold` and `safar` are borrowed from sports and auto, so those waves pick other templates. `nour` (lighting) leaves `lighting-smart-home` and waits for the home wave.

**Deleted when their industry switches:** `kettan`, `nasig`, `mawsem` (fashion); `lulu`, `mahr`, `jewelry-bold` (accessories); `arcade`, `tany`, `electronics-bold`, `electronics-warm` (electronics). Wave 1 goes from 37 templates to 30.

**Switch order:** accessories first (no new photos needed: Fadda native), then fashion, shoes & bags, mobile accessories and electronics as their new packs' photos arrive.

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
