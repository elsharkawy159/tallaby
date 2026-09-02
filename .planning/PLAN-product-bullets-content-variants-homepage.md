# Product bullet points, content images, merchandising sections & colour variants

## Context

Five related gaps across the storefront (`apps/ecommerce`) and the vendor dashboard (`apps/dashboard`):

1. **Bullet points render flat.** Product attributes are authored as `"الخامة: بوليستر"` (label, colon, value) but `product-details.tsx` prints each one as a single plain string, so the label carries no visual weight.
2. **Images added to Product Content never appear.** The vendor pastes an image into the TipTap editor; the storefront section shows nothing.
3. **`is_trending` / `is_seasonal` have no storefront surface.** The columns, the `getProducts` filters and the cache tags all exist already — the homepage just never uses them.
4. **Colour variants are invisible on product cards.** A shopper can't see which colours a product comes in without opening it.
5. **The dashboard variant editor is all free text.** "Sub-option Type" and "Value or Property" are bare inputs, and the variant image uploader is the full-size product dropzone crammed into a table cell.

Outcome: labelled bullet points, content images that survive save *and* render, Trending/Seasonal carousels on the homepage, colour swatches on cards with a smooth image swap on hover, and a typed variant editor (colour picker, weight units, compact image square).

---

## Decisions already made

- **Colour values keep their readable name** (`Red` / `أحمر`); the picker stores a **hex alongside** it. Hex lives in the variant's existing `localized` JSONB under a new `optionMeta` key — **no DB migration**.
- **Card swatches sit in a `justify-between` row under the image**, swatches at the start, price at the end.
- **Trending / Seasonal render as carousels** (`ProductSection`) above the Featured grid, titled `🔥 Trending` and `🍂 Seasonal`.

---

## 1. Bullet points — bold the label before the colon

**New:** `apps/ecommerce/lib/bullet-points.ts`

```ts
export function splitBulletPoint(point: string): { label: string; value: string } | null
```
Split on the **first** colon only (`/^([^:]{1,60}):\s*(.+)$/`) — mirrors the existing
`parseVariantOption` regex in `apps/dashboard/lib/utils/variant-types.lib.ts:95`.
The `{1,60}` guard stops a long sentence that happens to contain a colon from being
bolded wholesale. Returns `null` when there's no match → render the point unchanged.

**Edit:** `apps/ecommerce/app/(main)/products/[slug]/_components/product-details.tsx:406-412`

```tsx
{product.bulletPoints.map((point: string, index: number) => {
  const parts = splitBulletPoint(point);
  return (
    <li key={index}>
      {parts ? (
        <>
          <span className="font-medium text-gray-900">{parts.label}:</span>{" "}
          {parts.value}
        </>
      ) : (
        point
      )}
    </li>
  );
})}
```

This is the only place bullet points are rendered (verified repo-wide).

---

## 2. Content images not showing

**Root cause** — `isRichTextEmpty` in `packages/tiptap/src/sanitize-html.ts:42-49` strips *every*
tag before measuring length, so an image (which contributes no text node) reads as empty.
That guard fires in three places:

| Where | Effect |
|---|---|
| `apps/dashboard/actions/products.ts:25-29` (`normalizeRichTextContent`) | **Content saved as `NULL`** — data loss at write time |
| `apps/ecommerce/.../product-content.tsx:9` | Section returns `null` |
| `packages/tiptap/src/rich-text-content.tsx:11` | Renders `null` |

`img` *is* on the allow-list (`sanitize-html.ts:24`), the CSS *is* loaded
(`packages/ui/src/styles/globals.css:7`), and the dashboard uploader *does* store an absolute
Supabase public URL (`basic-information-step.tsx:74-84`) — those are all fine.

### Fix A — treat media as content (`packages/tiptap/src/sanitize-html.ts`)

```ts
const MEDIA_TAG_RE = /<(img|hr)\b/i;

export function isRichTextEmpty(html: string | null | undefined): boolean {
  if (!html?.trim()) return true;
  const sanitized = sanitizeRichTextHtml(html);
  if (MEDIA_TAG_RE.test(sanitized)) return false;   // ← image-only content is NOT empty
  const stripped = sanitized.replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").trim();
  return stripped.length === 0;
}
```

One edit fixes the save path and both render guards, since all three call this function.

### Fix B — field-level locale fallback (`apps/ecommerce/lib/product-translations.ts:139-163`)

`getProductTranslationWithFallback` falls back **row-wise**. An `ar` row is created whenever
*any* Arabic field is filled (`apps/dashboard/actions/products.ts:1121-1128`), so an AR row with
`content = NULL` hides content that exists on the EN row. In the `ar` branch, when the AR row is
found but `ar.content` is empty, fetch the EN row and fall back on the `content` field alone.

### Note for the user

Products whose content was already flattened to `NULL` by the old guard cannot be recovered —
the image has to be re-added in the dashboard once the fix ships.

---

## 3. Trending / Seasonal homepage sections

Everything downstream already exists: `getProducts` accepts `isTrending` / `isSeasonal`
(`apps/ecommerce/actions/products.ts:46-47, 125-131`) and tags them with
`productTags.trending()` / `.seasonal()` (`:69-70`), which `packages/cache/src/invalidate.ts:146-147`
already purges on a flag change. Use `getProducts` — **not** the existing
`getTrendingMerchandisedProducts` / `getSeasonalProducts`, which are dead code and skip
translations entirely.

**Edit:** `apps/ecommerce/components/home/ProductSection.tsx`
- Add `isTrending?: boolean` / `isSeasonal?: boolean` to its local `ProductFilters` (`:16-29`) — it currently can't forward filters `getProducts` already supports.
- Return `null` when `products.data.length === 0` (`:44-46`) so an empty section doesn't render a bare heading.

**Edit:** `apps/ecommerce/app/(main)/page.tsx` — insert above the Featured grid (`:72`):

```tsx
<Suspense fallback={<SectionSkeleton />}>
  <ProductSection title={t("trending")} description={t("trendingDescription")}
    filters={{ isTrending: true, sortBy: "popular", limit: 12 }} />
</Suspense>
<Suspense fallback={<SectionSkeleton />}>
  <ProductSection title={t("seasonal")} description={t("seasonalDescription")}
    filters={{ isSeasonal: true, sortBy: "newest", limit: 12 }} />
</Suspense>
```
`SectionSkeleton` already exists unused in that file at `:26-42`. Import `ProductSection`
from `@/components/home`.

**Edit:** `apps/ecommerce/messages/en.json` + `ar.json`, under `pages.home` — emoji in the
message value so translators control it:

| key | en | ar |
|---|---|---|
| `trending` | `🔥 Trending` | `🔥 الأكثر رواجًا` |
| `trendingDescription` | `What everyone is buying right now` | `الأكثر طلبًا لدى المتسوقين الآن` |
| `seasonal` | `🍂 Seasonal` | `🍂 منتجات الموسم` |
| `seasonalDescription` | `Picks for the season` | `اختيارات مناسبة للموسم الحالي` |

---

## 4. Colour swatches on the product card

### 4a. Ship variants with the listing query

`getProducts` joins only `brand, category, productTranslations`
(`apps/ecommerce/actions/products.ts:167-180`). Add a **column-scoped** variant join so the
cached payload stays lean:

```ts
with: {
  brand: true,
  category: true,
  productTranslations: true,
  productVariants: {
    columns: { id: true, localized: true, option1: true, option2: true,
               option3: true, images: true, imageUrl: true, position: true },
    orderBy: [asc(productVariants.position)],
  },
},
```

### 4b. Colour extraction helper

**New:** `apps/ecommerce/lib/variant-colors.ts`

```ts
export interface ProductColorSwatch { value: string; label: string; hex: string; image?: string }
export function getProductColorSwatches(variants, locale): ProductColorSwatch[]
```

For each variant:
1. `getVariantDisplayFields(variant, locale)` (`apps/ecommerce/lib/variant-localized.ts:10`) → `option1..3`, each stored as `"Color: Red"`.
2. Find the colour slot: `localized.optionMeta[i].kind === "color"` (written by §5), falling back to matching the parsed type name against `["color", "colour", "اللون", "لون"]` for pre-existing rows.
3. `hex` = `optionMeta[i].swatch`, else a lookup in a small EN+AR colour-name → hex map (red/blue/black/white/green/yellow/grey/pink/purple/orange/brown/beige/gold/silver/navy and their Arabic equivalents) so today's catalogue still shows swatches. No hex and no match → skip that value.
4. `image` = `getVariantImageUrls(variant)[0]` (`apps/ecommerce/lib/variant-images.ts:1`) run through `getPublicUrl(..., "products")`.
5. Dedupe by value, first variant wins, cap at 5 with a `+N` chip.

### 4c. Card wiring

**Edit:** `apps/ecommerce/components/product/product-card.types.ts` — add an optional
`productVariants?: Array<{ id: string; localized?: unknown; option1?: string | null; option2?: string | null; option3?: string | null; images?: unknown; imageUrl?: string | null }>`.
Optional, so cards fed by queries without variants (`similar-products.tsx`, wishlist,
`ProductsList.tsx`) keep working unchanged — they simply show no swatches.

**New:** `apps/ecommerce/components/product/product-card-swatches.tsx` — a client component
rendering `size-4 rounded-full ring-1 ring-black/10` circles with
`style={{ backgroundColor: hex }}`, `title`/`aria-label` = the localized colour name, calling
`onHover(image | null)` on `mouseenter` / `mouseleave` (and `focus`/`blur` for keyboard).

**Edit:** `apps/ecommerce/app/(main)/products/[slug]/_components/ProductCard.tsx` (already
`"use client"`) — owns the hover state:

```tsx
const swatches = useMemo(() => getProductColorSwatches(product.productVariants, locale), [...]);
const [hoverImage, setHoverImage] = useState<string | null>(null);
...
<ProductCardImage product={product} hoverImage={hoverImage} />
<ProductCardInfo product={product} swatches={swatches} onSwatchHover={setHoverImage} />
```

**Edit:** `apps/ecommerce/components/product/product-card-image.tsx` — accept `hoverImage`.
Keep the last hovered src in a ref/state so the overlay can fade *out* before it disappears:
render the base image as today, plus an absolutely-positioned second `ImageWithFallback` with
`transition-opacity duration-300` and `opacity-100`/`opacity-0` driven by whether a swatch is
currently hovered. Same `object-contain aspect-[2.6/3]` classes so the two register exactly.

**Edit:** `apps/ecommerce/components/product/product-card-info.tsx` — restructure to
title on its own line, then a `flex items-center justify-between gap-2` row holding
`<ProductCardSwatches />` (start) and the existing price `<span>` (end). This makes the mobile
layout match desktop (title above, price below) instead of title-beside-price.

---

## 5. Dashboard variant editor

All in `apps/dashboard`. The variant model is denormalised: option text is stored flattened as
`"Color: Red"` in `option1..3` + the `localized` JSONB; `variantTypes` is **never persisted** and
is reverse-engineered on edit by `reconstructVariantTypesFromVariants`
(`lib/utils/variant-types.lib.ts:107`). The new metadata therefore has to round-trip through the
variant rows.

### 5a. `optionMeta` — the storage shape (no migration)

`product_variants.localized` (JSONB) currently holds `{ en: {...}, ar: {...} }`. Add a sibling key:

```jsonc
{
  "en": { "title": "Red / L", "option1": "Color: Red", "option2": "Size: L" },
  "ar": { "title": "أحمر / L", "option1": "اللون: أحمر", "option2": "المقاس: L" },
  "optionMeta": [ { "kind": "color", "swatch": "#e11d48" }, { "kind": "size" } ]
}
```

Safe by construction: every reader of `localized` indexes it by locale
(`getVariantDisplayFields` in both `apps/dashboard/lib/utils/variant-types.lib.ts:295` and
`apps/ecommerce/lib/variant-localized.ts:10`), so an extra non-locale key is inert.
`mapVariantFormToDb` (`actions/products.ts:236-259`) already persists `localized` wholesale —
no server-action change needed beyond the schema letting the key through.

### 5b. Types & schema

**Edit:** `apps/dashboard/lib/utils/variant-types.lib.ts`
- `export type VariantOptionKind = "color" | "size" | "weight" | "material" | "style" | "custom"`
- `VARIANT_TYPE_PRESETS: Array<{ kind; en: string; ar: string }>` — Color/اللون, Size/المقاس, Weight/الوزن, Material/الخامة, Style/التصميم, plus Custom.
- `WEIGHT_UNITS = ["g", "kg", "mg", "ml", "l", "oz", "lb"]`
- `VariantTypeFormValue` gains `kind: VariantOptionKind`, `unit?: string`, `swatches?: string[]` (index-aligned with `localized[locale].values`, locale-independent).
- `buildVariantLocalizedFromCombo` — append `type.unit` to the value text for `kind === "weight"` (`"500" → "500 g"`), and emit `optionMeta` alongside `en`/`ar`.
- `reconstructVariantTypesFromVariants` — read `optionMeta` back to restore `kind`/`unit`/`swatches`; when absent, infer `kind` by matching the parsed type name against the preset EN/AR labels.
- `createEmptyVariantType` — default `kind: "custom"`.

**Edit:** `apps/dashboard/app/(main)/products/add/add-product.schema.ts:19-37` — add
`variantOptionMetaSchema` (`kind` enum, `swatch?`, `unit?`), allow `optionMeta` on the variant
`localized` object (zod strips unknown keys, so this is required for it to persist), and add
`kind` / `unit` / `swatches` to `variantTypeSchema`.

**Edit:** `apps/dashboard/app/(main)/products/add/apply-product-import.lib.ts:207-229` and
`parse-product-import.types.ts:56` — default `kind: "custom"` on imported types so they typecheck.

### 5c. The UI — `apps/dashboard/app/(main)/products/add/steps/price-stock-step.tsx`

**"Sub-option Type" (`:807-821`)** → a `Select` from `@workspace/ui/components/select`
(raw primitives, `h-9`, to match the surrounding inputs — `SelectInput` hardcodes `h-11!` and
reads `errors[name]` flat, so it's the wrong fit here). Options are the presets plus "Other".
Picking a preset sets `kind` **and both** `localized.en.name` / `localized.ar.name` in one go,
so the type name no longer depends on which locale tab is active. Picking "Other" reveals the
existing free-text `Input` and sets `kind: "custom"`.

**"Value or Property" rows (`:838-878`)** — branch on `type.kind`:

| kind | row |
|---|---|
| `color` | `<input type="color">` styled as a `size-9 rounded-md` swatch → writes `type.swatches[i]`, **plus** the existing name `Input` (Red / أحمر), plus Remove |
| `weight` | value `Input` + a unit `Select` (`WEIGHT_UNITS`) bound to `type.unit` (shared by all values of that type), plus Remove |
| everything else | unchanged `Input` |

`handleUpdateValue` / `handleAddValue` / `handleRemoveValue` (`:689-766`) must keep `swatches`
index-aligned with the values arrays, exactly as they already do for `en.values` / `ar.values`.
The combination-regeneration effect (`:554-660`) needs `type.kind`/`unit`/`swatches` in its
dependency list so a hex or unit change re-flows into `optionMeta`.

### 5d. Smaller variant image square

**Edit:** `apps/dashboard/components/inputs/image-upload.tsx` — add an opt-in
`compact?: boolean` prop (default `false`, so the main product Media field is untouched):
- root `:276` → `flex flex-col gap-2` instead of `lg:flex-row justify-between`
- skip the 400×400 preview panel `:342-383` entirely
- thumbnails: wrapper `:318` `min-w-28` → `size-30`, `Droppable direction="horizontal"`, wrapped in `flex flex-wrap gap-2`; pass `compact` to `FilePreview` so its `AspectRatio` (`:495`) becomes `ratio={1}`
- dropzone label `:388-454`: a `size-30` square tile with just the `Upload` icon (`size-6`) and an `n/max` counter — drop the `text-lg` headline and the hint rows

**Edit:** `price-stock-step.tsx:960-979` — pass `compact` to `<ImageUpload>` and drop the cell /
header `min-w-[220px]` (`:898`, `:960`) to `min-w-[140px]`.

Tailwind v4 is in use (`packages/ui/src/styles/globals.css:1` → `@import "tailwindcss"`,
`tailwindcss ^4.1.18`), so `size-30` resolves on the dynamic spacing scale.

---

## Verification

1. **Typecheck + lint the touched workspaces**
   `pnpm --filter ecommerce typecheck && pnpm --filter dashboard typecheck && pnpm lint`
   `pnpm --filter dashboard test` (vitest covers `parse-product-import.lib.test.ts`, which uses a `{ name: "Color", values: [...] }` fixture and will catch the `variantTypes` shape change).
2. **Dashboard** (`pnpm --filter dashboard dev`, :3002) — edit a product:
   - Variants → Sub-option Type dropdown shows Color/Size/Weight/…; pick **Color** → swatch picker appears next to the value name; pick **Weight** → unit dropdown appears; pick **Other** → free-text input returns.
   - Variant Images cell is a small square (~120px), still uploads and reorders.
   - In Basic Information → Product Content, insert **only an image** and save. Reopen the product: the image is still there (this is the §2 regression test).
3. **Storefront** (`pnpm --filter ecommerce dev`, :3000):
   - Product page → Attributes accordion: each bullet's label before the colon is `font-medium`; a bullet with no colon renders unchanged.
   - Product page: the content image now renders under the hero, in both `/products/<en-slug>` and `/products/<ar-slug>`.
   - Homepage: 🔥 Trending and 🍂 Seasonal carousels appear above Featured Products for products flagged in the admin app; flip both flags off on every product and confirm the sections vanish rather than rendering empty headings.
   - Product card: colour circles sit at the start of the row with the price at the end; hovering a circle cross-fades the card image to that variant's image and fades back on mouse-out. Check RTL (`ar`) — circles should sit on the right, price on the left.
4. **Cache sanity** — after toggling `is_trending` in the admin app, the homepage section updates within the 60s `revalidate` (`page.tsx:23`); `invalidateProduct` already purges `product:trending` / `product:seasonal`.
