# Niche editions: plan (Phase 0)

**Status: for owner approval (2026-11-11). Nothing in this plan is built.** Branch `feat/section-system` (the owner asked to stay on it). ROADMAP F-90.

A seller in a sub-trade (dresses, phone accessories, watches) should open a template that already looks like their shop: their categories, products, photos, copy and the sections their trade needs. We do this with data packs on top of the templates we have, not with new template designs.

---

## 1. Where the brief and the code differ

| # | The brief says | The code says | What the plan does |
|---|---|---|---|
| 1 | The section system and template system (blueprints, style families, art direction, composer, validators) are merged. | They are not built. Only the look-first pilot is (`docs/systems/plan.md` §10): product stage, one product card, upgraded sections and three rebuilt templates. Phases 1 to 4 of that plan are not started. | Editions are built on what exists: `libraryTemplate`, `fromLibrary` with the strict patch, and `productStage`. "Passes the template validators" means today's template tests. Journey tweaks are limited to slots a look exposes (§4.3). When blueprints arrive, editions plug into them without changing the edition format. |
| 2 | Editions live in a code seed plus `templates.meta` or a new table, with insert-only migrations. | Templates are code-only since 0109 (`CLAUDE.md` rule 17). There is no `templates` table. | Editions are code (§4.1). One small additive migration is proposed only to remember a store's niche and the edition it installed (§4.5, decision 5). |
| 3 | Electronics > Mobile accessories. | `mobile-accessories` is already its own industry in `STORE_INDUSTRIES`. | It stays an industry with three niches. No store moves. |
| 4 | Variants in the demo catalog (sizes, colours, storage). | `TemplateDemo` products have no variants; the product page preview shows one demo product. | The edition adds optional variant groups for the product page preview only (§4.2). |
| 5 | White-background packshots for every product. | Free stock does not have them for many trades. On 2026-11-11 a curated Pexels search found no clean packshots for dresses, coats, speakers or cables. | Packshots are generated with our image tools for niches where stock fails (§3). This is the main cost of the project. |
| 6 | `docs/systems/*` has a rubric and a rollout doc. | It has `plan.md`, `audit/` and `pilot/`. | The pilot uses the look-first checks (screenshots at 390 and 1280 px, both languages, beside the references). |
| 7 | "Use template" installs look + edition, with the catalog. | "Use template" replaces draft sections and the design system only. Demo products are preview-only and never enter a store. | Kept: an edition installs its sections, photos and copy. Its catalog stays a preview (decision 6). |
| 8 | Work on a new branch. | The owner said to continue on `feat/section-system`. | Same branch. |

One more fact that shapes the plan: **many of the 119 templates are already niche templates** (Nour is lighting, Saat is classic watches, Kabl is cables, Sitara is modest wear, Mahr is gold by the gram). An edition does not replace that; it lets the same look serve a second and third trade.

---

## 2. Taxonomy and mapping

### 2.1 Industries

All 17 `STORE_INDUSTRIES` ids stay. One display name changes:

- `jewelry`: "Jewelry & Watches" becomes **"Accessories & Jewelry" / "إكسسوارات ومجوهرات"** and takes glasses, hair accessories, belts and wallets. I do not recommend a new `accessories` industry: it would split ten jewelry templates from the trade that most needs them, and existing stores would need a move.
- `findIndustry` matches a store by the industry's name, so the old names stay as aliases in code. No store row changes and no migration is needed for the rename.

### 2.2 Niches and the looks picked for each

82 niches. Each has two or three looks, chosen by the template's own trade, its style and its home layout. The first look is the closest fit. A look in italics is borrowed from another industry. These picks come from the template descriptions; each pilot pick is confirmed by screenshot before it ships, and the rollout does the same per industry.

| Industry | Niche id | Arabic / English | Looks |
|---|---|---|---|
| fashion | `dresses` | فساتين / Dresses | `fashion-luxe`, `vella`, `kasr` |
| | `tshirts` | تيشيرتات / T-shirts | `streetwear`, `fashion-bold`, `nasig` |
| | `pants-jeans` | بناطيل وجينز / Pants & jeans | `fashion-bold`, `zay`, `mawsem` |
| | `modest-wear` | عبايات وملابس محتشمة / Abayas & modest wear | `sitara`, `fashion-warm`, `kasr` |
| | `menswear` | ملابس رجالي / Men's wear | `zay`, `ghorza`, `fashion-luxe` |
| | `kidswear` | ملابس أطفال / Kids' wear | *`kids-warm`*, *`kids-luxe`* |
| | `lingerie-sleepwear` | لانجيري وبيجامات / Lingerie & sleepwear | `fashion-warm`, `vella` |
| | `sportswear` | ملابس رياضية / Sportswear | *`sports-luxe`*, *`stride`*, `streetwear` |
| shoes-bags | `sneakers` | كوتشيات / Sneakers | *`streetwear`*, *`sports-bold`*, *`stride`* |
| | `womens-shoes` | أحذية حريمي / Women's shoes | *`fashion-luxe`*, *`vella`* |
| | `mens-shoes` | أحذية رجالي / Men's shoes | *`zay`*, *`ghorza`* |
| | `handbags` | شنط يد / Handbags | `shanta`, *`fashion-luxe`*, *`kasr`* |
| | `backpacks-travel` | شنط ظهر وسفر / Backpacks & travel | `shanta`, *`safar`*, *`basecamp`* |
| jewelry | `glasses` | نظارات / Glasses & sunglasses | `jewelry-luxe`, `karat`, *`fashion-bold`* |
| | `watches` | ساعات يد / Hand watches | `saat`, `jewelry-luxe`, *`saa`* |
| | `gold-jewelry` | ذهب / Gold jewelry | `mahr`, `jewelry-luxe`, `kholkhal` |
| | `silver-jewelry` | فضة / Silver jewelry | `fadda`, `jewelry-warm` |
| | `fashion-jewelry` | إكسسوارات حريمي / Fashion jewelry | `karat`, `zahra`, `jewelry-bold` |
| | `hair-accessories` | إكسسوارات شعر / Hair accessories | `karat`, `zahra` |
| | `belts-wallets` | أحزمة ومحافظ / Belts & wallets | *`shanta`*, *`zay`* |
| electronics | `mobiles` | موبايلات / Mobiles | `shasha`, `techhub`, `tany` |
| | `pc-gaming` | كمبيوتر وجيمنج / PC & gaming accessories | `arena`, `arcade`, `electronics-bold` |
| | `lighting-smart-home` | إضاءة وبيت ذكي / Lighting & smart home | *`nour`*, `zaki`, `electronics-warm` |
| | `audio` | سماعات وصوتيات / Audio | `arcade`, `electronics-luxe`, `techhub` |
| | `small-appliances` | أجهزة صغيرة / Small appliances | `shasha`, `electronics-warm`, *`beity`* |
| | `wearables` | ساعات ذكية / Smart watches | `saa`, `electronics-luxe` |
| mobile-accessories | `phone-cases` | جرابات وحماية / Cases & protection | `volt`, *`wasla`* |
| | `chargers-cables` | شواحن وكابلات / Chargers & cables | `kabl`, `volt` |
| | `earbuds` | سماعات موبايل / Earbuds & headsets | *`wasla`*, *`electronics-luxe`* |
| beauty | `skincare` | عناية بالبشرة / Skincare | `pure`, `nada`, `bashra` |
| | `makeup` | مكياج / Makeup | `kohl`, `beauty-bold`, `ward` |
| | `perfumes` | عطور / Perfumes | `perfumes-luxe`, `perfumes-bold`, `perfumes-warm` |
| | `haircare` | عناية بالشعر / Hair care | `botanica`, `beauty-luxe` |
| | `mens-grooming` | عناية رجالي / Men's grooming | `barber`, `beauty-luxe` |
| home | `furniture` | أثاث / Furniture | `furniture-luxe`, `mobilia`, `dar` |
| | `bedding-textiles` | مفروشات / Bedding & textiles | `mafrash`, `tawla`, `furniture-warm` |
| | `decor` | ديكور / Decor | `rokn`, `furniture-warm`, `sakan` |
| | `plants-garden` | نباتات وحدائق / Plants & garden | `zarea`, `furniture-warm` |
| | `home-organisation` | تنظيم البيت / Home organisation | *`tanzim`*, *`daily`* |
| kitchen | `cookware` | أواني طهي / Cookware | `matbakh`, `daily`, `beity` |
| | `tableware` | أطقم سفرة / Tableware | `sufra`, *`tawla`* |
| | `coffee-gear` | أدوات القهوة / Coffee gear | `qahwa`, *`roast`* |
| | `kitchen-appliances` | أجهزة مطبخ / Kitchen appliances | `beity`, *`shasha`* |
| food | `grocery` | بقالة / Grocery | `souq`, `harvest`, `grocery-bold` |
| | `fresh-produce` | خضار وفاكهة / Fresh produce | `khodar`, `grocery-warm` |
| | `meat-poultry` | لحوم ودواجن / Meat & poultry | `lahma`, `grocery-bold` |
| | `bakery` | مخبوزات / Bakery | `loaf`, `sabaho` |
| | `spices-herbs` | عطارة / Spices & herbs | `atara`, `grocery-luxe` |
| | `fast-food` | وجبات سريعة / Fast food | `sizzle`, `grocery-bold` |
| sweets | `oriental-sweets` | حلويات شرقية / Oriental sweets | `halawa`, *`gifts-warm`* |
| | `chocolate-cakes` | شوكولاتة وتورت / Chocolate & cakes | `halawa`, *`gifts-luxe`* |
| | `coffee-beans` | بن وقهوة / Coffee | `bunn`, *`roast`* |
| | `dates-nuts` | تمور ومكسرات / Dates & nuts | *`atara`*, *`grocery-luxe`* |
| kids | `toys` | ألعاب / Toys | `farha`, `doodle`, `kids-bold` |
| | `baby-essentials` | مستلزمات البيبي / Baby essentials | `bambino`, `mama`, `kids-luxe` |
| | `kids-gifts` | هدايا أطفال / Kids' gifts | `hadaya`, `kids-bold` |
| | `school-supplies` | أدوات مدرسية / School supplies | *`hekaya`*, `kids-warm` |
| sports | `gym-fitness` | جيم ولياقة / Gym & fitness | `pace`, `core`, `rep` |
| | `football` | كرة قدم / Football | `koora`, `sports-bold` |
| | `running` | جري / Running | `stride`, `sports-luxe` |
| | `cycling` | عجل / Cycling | `darraga`, `sports-bold` |
| | `outdoor-camping` | رحلات وتخييم / Outdoor & camping | `basecamp`, `sports-warm`, *`safar`* |
| | `yoga` | يوجا / Yoga | `yoga`, `sports-luxe` |
| health | `vitamins-supplements` | فيتامينات ومكملات / Vitamins & supplements | *`pure`*, *`nada`*, *`core`* |
| | `pharmacy-care` | صيدلية وعناية / Pharmacy & personal care | *`ward`*, *`nada`* |
| | `medical-devices` | أجهزة طبية / Medical devices | *`techhub`*, *`pure`* |
| pets | `pet-food` | أكل حيوانات / Pet food | *`grocery-warm`*, *`harvest`* |
| | `pet-accessories` | مستلزمات حيوانات / Pet accessories | *`kids-warm`*, *`gifts-warm`* |
| | `fish-birds` | أسماك وطيور / Fish & birds | *`zarea`*, *`grocery-warm`* |
| auto | `car-accessories` | إكسسوارات سيارات / Car accessories | `garage`, `tarik`, `drive` |
| | `car-care` | عناية بالسيارة / Car care | `garagy`, `pitstop` |
| | `tyres-batteries` | كاوتش وبطاريات / Tyres & batteries | `tyre`, `pitstop` |
| | `motorcycle` | موتوسيكلات / Motorcycle gear | `moto`, `garage` |
| | `car-interior` | فرش وزينة / Interior styling | `zeina`, `garage` |
| | `ev-charging` | شحن كهربائي / EV charging | `kahraba`, `drive` |
| handmade | `handmade-gifts` | هدايا هاند ميد / Handmade gifts | `gifts-warm`, `gifts-luxe`, `gifts-bold` |
| | `ceramics` | فخار وخزف / Ceramics | `fokhar`, *`rokn`* |
| | `candles-soap` | شموع وصابون / Candles & soap | `gifts-warm`, *`botanica`* |
| | `crochet-embroidery` | كروشيه وتطريز / Crochet & embroidery | `gifts-warm`, *`tawla`* |
| books | `books` | كتب / Books | `hekaya`, *`gifts-luxe`* |
| | `stationery` | أدوات مكتبية / Stationery | `hekaya`, *`tanzim`* |
| | `kids-books` | كتب أطفال / Children's books | `hekaya`, *`kids-warm`* |

**Totals:** 82 niches and **197 editions** (22 fashion, 13 shoes and bags, 18 accessories, 17 electronics, 6 mobile accessories, 13 beauty, 13 home, 9 kitchen, 13 food, 8 sweets, 10 kids, 14 sports, 7 health, 6 pets, 13 auto, 9 handmade, 6 books). 110 of the 119 templates carry at least one edition; the other nine keep their default content only.

The full niche × template matrix (every template scored against every niche, not only the picks) is generated in Phase 1 by a script into `docs/systems/audit/niche-matrix.md`, from each template's category, style, tone and home needs (`templateTraits`). Writing 82 × 119 cells by hand here would only repeat the table above.

**Thin spots:** `books` has one template, and `health` and `pets` have none, so their looks are all borrowed. That works for the pilot rule ("reuse existing templates") but those three industries will show the least variety.

---

## 3. Photos

### 3.1 How many

One niche pack holds:

- **Packshots:** one per demo product, 12 to 24, about 16 on average. Shared by every look of the niche.
- **Art-directed set:** hero (one wide, one tall for phones), four to eight category tiles, one editorial banner, one story photo: about 10. A niche whose looks split between light and dark pages needs a second set; about one niche in three does.

| | Packshots | Art-directed | Total |
|---|---|---|---|
| Pilot (9 niches) | about 144 | about 110 | **about 255** |
| All 82 niches | about 1,310 | about 1,070 | **about 2,400** |

### 3.2 Source for each set

| Set | Source | Why |
|---|---|---|
| Packshots, niches where stock is good (watches, bags, shoes, perfume bottles, cosmetics, earbuds, chargers) | Pexels (free licence: commercial use, no attribution, https://www.pexels.com/license/), curated and checked by eye as on 2026-11-11 | Free. The curator already found usable sets for these. |
| Packshots, niches where stock fails (dresses, pants, t-shirts on a hanger or ghost mannequin, glasses, lamps, PC accessories, most clothing) | **AI-generated with our image tools** | The only way to get one angle, one light and one background across 16 products. |
| Art-directed sets | Pexels first; generated when the mood or the ratio cannot be found | Lifestyle photos are what stock is good at. |

Never competitor or store photos. No people, hands or faces, no readable logos or text (today's rule).

**Cost check before generating in bulk:** the owner's tools bill per image. The pilot needs about 100 generated packshots (dresses, t-shirts, pants, glasses, lighting, PC accessories) and perhaps 20 art photos. I will generate four test images for one niche first and show them before spending on the rest.

**Where generated files live** (decision 3): they need a public URL. Options are the existing public media bucket under a `template-media/` folder (recommended: no deploy needed to add photos, same CDN as store photos) or `apps/ecommerce/public/`.

### 3.3 Prompts

One base prompt, then one line per product, so a set shares angle and light.

**Packshot base:** "Studio product photograph of {item}, centred, whole item visible with even margin, straight-on eye-level view, pure white seamless background (#FFFFFF), soft diffused light from the upper left, one soft contact shadow under the item, true colours, sharp focus, no people, no hands, no mannequin head, no text, no logo, no label, no props, square 1:1, 2000 px."

Per pilot niche, `{item}` and the fixed presentation:

| Niche | Presentation (same for the whole set) | Example items |
|---|---|---|
| `dresses` | on an invisible ghost mannequin, front view, full length, 4:5 instead of 1:1 | "a midi wrap dress in sage green crepe", "a black satin slip dress", "a floral printed maxi dress with long sleeves" |
| `tshirts` | flat lay, front view, sleeves spread | "a plain white heavyweight cotton t-shirt", "a washed black oversized t-shirt", "a navy and white striped t-shirt" |
| `pants-jeans` | flat lay, front view, legs straight, 4:5 | "straight-leg mid-blue jeans", "beige wide-leg linen trousers", "black tapered joggers" |
| `glasses` | three-quarter view, temples open, resting on the surface | "round tortoiseshell acetate sunglasses with brown lenses", "thin gold metal aviator glasses with clear lenses" |
| `watches` | front view, dial at 10:10, strap laid in a soft curve, blank dial with plain markers | "a steel dress watch with a white dial and brown leather strap", "a black chronograph on a steel bracelet" |
| `fashion-jewelry` / `gold-jewelry` | top-down, on the white surface | "a thin gold chain necklace with a small round pendant", "a pair of gold hoop earrings" |
| mobile accessories | front three-quarter view, upright | "a clear phone case with a matte black bumper", "a white 20W wall charger", "a braided grey USB-C cable, coiled" |
| `lighting-smart-home` | switched on, warm glow, on a pale grey (#F2F2F0) background so the light reads | "a brass table lamp with a cream linen shade", "a matte black arc floor lamp", "a white smart LED bulb" |
| `pc-gaming` | front three-quarter view, RGB lights off | "a black mechanical keyboard with white keycaps", "a white wireless gaming mouse", "a black over-ear gaming headset with a boom microphone" |

**Art-directed base:** "{scene}, no people, no text, no logos, soft natural light, {palette} palette, calm composition with empty space on the {side} third for a headline, {ratio}." Ratios follow the slot: hero 16:9 and 4:5, category tile 3:4, banner 21:9, story 4:5.

---

## 4. Data format and files

### 4.1 Where editions live

```
packages/store-sections/src/templates/editions/
  types.ts            Edition, EditionSlots, LookSlots
  index.ts            EDITIONS, getEdition, editionsForLook, editionsForNiche
  niches.ts           NICHES (id, industry, names, keywords)  ← also read by the dashboard
  match.ts            matchNiche
  apply.ts            applyEdition
  validate.ts         validateEdition
  packs/<industry>/<niche>.ts     one file per niche (catalog, photos, copy)
```

Code only, shipped with a deploy, like templates and sections. Stores keep their own copies, so an edition change never alters an existing site.

### 4.2 The edition

```ts
type Niche = {
  id: string;                       // "dresses": stable, never reused
  industry: string;                 // a STORE_INDUSTRIES id
  name: Localized;
  keywords: { ar: readonly string[]; en: readonly string[] };   // incl. Egyptian words: "فستان", "فساتين سواريه", "دريس"
};

type Edition = {
  niche: string;
  looks: readonly string[];         // template keys this pack is approved on, best first
  demo: TemplateDemo;               // 4–8 categories, 12–24 products, EGP prices, ar/en
  variants?: Record<string, readonly { name: Localized; values: readonly Localized[] }[]>;   // product id → groups, product page preview only
  productStage: ProductStage;       // ratio and fit for this niche's packshots
  photos: {
    hero: { wide: string; tall: string };
    tiles: readonly string[];       // one per category, 3:4
    banner: string;                 // 21:9
    story: string;                  // 4:5
    dark?: Partial<Edition["photos"]>;   // for looks whose page is dark
  };
  copy: EditionCopy;                // by slot name, §4.3
  journey?: { primary: "best-sellers" | "newest" | "featured"; rows?: readonly number[] };   // which categories the product rows show
  extras?: readonly { slot: "after-products" | "before-newsletter"; design: string; patch: LibraryPatch }[];   // optional niche sections from the library
  productPage?: Partial<ProductPageSpec>;
};
```

### 4.3 How a look takes an edition

Today each template writes its copy and photos inline in its `lib(id, { text, photo })` calls. To take editions, a look is changed once so those values come from a **content object**, and its current content becomes its **default edition**:

```ts
// templates/fashion-luxe/index.ts
export const FASHION_LUXE = editionTemplate({ key, look: (c: LookContent) => ({ header, footer, pages }), defaultContent, ... });
```

`LookContent` uses the same slot names in every look: `hero.eyebrow`, `hero.title`, `hero.line`, `hero.cta`, `categories.title`, `products.primary.title`, `story.title`, `story.text`, `rows[n].title`, `trust[0..3]`, `newsletter.title`, plus the photos. `applyEdition(template, edition)` builds the look with the edition's content through the same strict `fromLibrary` patch, so a missing slot or an unknown field throws in tests. No section design is copied or forked.

- The template key keeps working and means "look + default edition".
- An edition reaches a look only if the look is converted. Converting one look is a careful refactor with its tests (its default content must render exactly as before); the pilot converts twelve.
- **Journey tweaks are narrow for now.** An edition can choose what the main grid shows, which categories the rows show, and add up to two library sections in fixed slots. It cannot reorder a look's home page. Full trade journeys wait for blueprints (`plan.md` Phase 2).

### 4.4 Validators (tests)

`validateEdition` runs for every edition × look pair: the look builds every page with the edition; 4–8 categories and 12–24 products; every product in a real category and every category with at least 3 products; EGP prices inside a plausible band per niche; Arabic and English present for every string; hero title at most 6 words; no discount words (today's `no-discounts.ts`); every link resolves to a page or a catalog route; every photo URL from an allowed host; one ratio per slot; no photo used twice in a pack or by another pack.

"Only white-background packshots" cannot be proven by a unit test. A script (`scripts/packshot-audit.ts`) downloads each product photo and fails when its border pixels are not near-white; its result is committed as a small JSON file that the test reads, so `pnpm test` stays offline.

### 4.5 Gallery, install and matching

- **Gallery** (dashboard Templates page and the tallaby.com gallery): an industry filter, then a niche filter. A template card lists its editions as chips; choosing one renders the preview with that edition (`/template-preview/<key>?edition=<niche>`). "Use template" installs the look with the chosen edition's sections, photos and copy.
- **`matchNiche({ category, name, productTitles? })`** in code: normalises Arabic (alef, yaa, taa marbuta, diacritics), lowercases English, scores keyword and synonym hits with a small edit-distance allowance, and returns a niche id or null. Used by onboarding, the template shortlist (a niche match adds to the industry score) and the AI builder.
- **AI builder** (`docs/ai.md`): the model receives no niche or template list. It may return one short hint ("women's dresses"), which the code passes to `matchNiche`. No extra tokens beyond that hint.
- **Fallback:** no match means the look's default edition, which is today's behaviour.
- **Remembering the choice** (decision 5): two nullable text columns, `stores.store_niche` and `template_installs.edition_id`, in migration `0166` (`0161`–`0165` are reserved or used). Additive; old code ignores them. Without them the niche is recomputed from the store's category each time and an install does not record its edition.

---

## 5. Order of work

**Phase 1: the edition system (one PR)**

| Step | Work |
|---|---|
| 1.1 | `Niche` list for all 82 niches with keywords; `matchNiche` with tests (Arabic and English examples, Egyptian spellings) |
| 1.2 | `Edition` type, loader, `validateEdition` with tests |
| 1.3 | `editionTemplate` and `applyEdition`; convert the twelve pilot looks, their default content unchanged (render snapshots prove it) |
| 1.4 | Niche matrix script and `docs/systems/audit/niche-matrix.md` |
| 1.5 | Preview route `?edition=`; gallery filter and edition chips in the dashboard and on tallaby.com; "Use template" with an edition; tests for the filter |
| 1.6 | Shortlist and AI builder use `matchNiche`; migration `0166` if approved |

**Phase 2: pilot, then stop (one PR)**

18 editions: 9 niches × 2 looks.

| Industry | Niche | Looks |
|---|---|---|
| Fashion | `dresses` | `fashion-luxe`, `vella` |
| | `tshirts` | `streetwear`, `fashion-luxe` |
| | `pants-jeans` | `zay`, `fashion-luxe` |
| Accessories | `glasses` | `jewelry-luxe`, `karat` |
| | `watches` | `saat`, `jewelry-luxe` |
| | `fashion-jewelry` | `karat`, `jewelry-luxe` |
| Electronics | mobile accessories (`chargers-cables`) | `kabl`, `volt` |
| | `lighting-smart-home` | `nour`, `zaki` |
| | `pc-gaming` | `arena`, `volt` |

That is twelve looks to convert: `fashion-luxe`, `vella`, `streetwear`, `zay`, `jewelry-luxe`, `karat`, `saat`, `kabl`, `volt`, `nour`, `zaki` and `arena`. `fashion-luxe`, `jewelry-luxe`, `karat` and `volt` each carry two or three pilot niches, which is the test that one look can serve several trades. Only `fashion-luxe` has been rebuilt in the look-first pilot. The other eleven still have the older home layout: each gets the product stage as part of its conversion (the upgraded product sections reach them already), but not a full redesign.

Proof: screenshots at 390 and 1280 px, Arabic and English, for every pilot edition in `docs/systems/editions-pilot/`, one comparison page per niche, and `docs/systems/editions-rollout.md` with the remaining 73 niches in batches of one industry per session and the photo work each needs.

---

## 6. Section gaps (not built here)

Sections a niche asks for that the library does not have. They go to the section work, not into one-off code.

| Trade need | Library today | Gap |
|---|---|---|
| Size guide (clothes, shoes, rings) | none | A size table section and a product page size-guide block |
| Compatibility ("fits these phones") | finder designs exist (`finder-pick`, `finder-matrix`, `finder-quiz`), not bound to products | A "shop by phone model" list bound to categories or tags |
| Specs table (electronics) | `product-content` text only | A two-column specs block on the product page |
| Material and care (jewelry, clothes) | `product-perks`, free text | A care block with icons |
| Shop by room (lighting, furniture) | category tiles | Covered by tiles with room categories: no gap |
| Occasions (dresses) | category tiles | Covered by tiles with occasion categories: no gap |

---

## 7. What existing stores see

Nothing. Editions affect only the gallery preview and what a new "Use template" installs. Existing template keys keep working. The industry rename is display only.

---

## 8. Decisions for you

1. **Accessories.** Rename `jewelry` to "Accessories & Jewelry" with the old names kept as aliases (recommended), or add a new `accessories` industry?
2. **Taxonomy.** Approve the 82 niches in §2.2, or name the ones to add, drop or move. Niche ids are permanent once shipped.
3. **Photo source and hosting.** Generated packshots for niches where stock fails, with four test images shown first (recommended)? And generated files in the public media bucket under `template-media/` (recommended) or in the app's `public/` folder?
4. **Photo budget.** The pilot needs about 100 generated images, the full rollout about 1,000. Give a ceiling for the pilot.
5. **Migration `0166`.** Add `stores.store_niche` and `template_installs.edition_id` (recommended), or keep editions out of the database for now?
6. **Sample products.** Keep the edition's catalog as a preview only (recommended: no fake products in a real store), or offer "add sample products as drafts" on install?
7. **Pilot looks.** Approve the pairs in §5. Eleven of the twelve pilot looks have not had the look-first rebuild; say if you would rather the pilot rebuild fewer looks properly than convert more as they are.
8. **Order against the system plan.** Editions before blueprints (this plan) means narrow journey tweaks now and a second pass later. Confirm, or do blueprints first.
