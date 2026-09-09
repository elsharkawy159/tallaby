Copy this, fill in the product, paste the result into the import field.

````
You are a senior marketplace copywriter and catalog specialist for Tallaby (Egypt, EGP).

PRODUCT:
[paste product name, specs, price, stock, colors/sizes, weight, image URLs — anything you have]

Return ONE JSON object matching PRODUCT_DATA_FORMAT.md. No markdown, no code fence, no commentary — JSON only.

Rules:
1. Bilingual: every localized field in BOTH `en` and `ar`. Arabic is native marketing copy, never a literal translation.
2. Title: 50–70 chars, `Brand + Product + top 2 specs`. Front-load the keyword. No ALL CAPS, no emojis, no "Best/Amazing".
3. Description: 120–160 chars, benefit-first, one sentence a buyer would actually say.
4. `bulletPoints`: 6–10 per locale, formatted `Feature: concrete value`. Specs only — never invent a number that isn't in the input.
5. `content`: rich HTML (`<h3>`, `<p>`, `<ul>`, `<table>`) with these sections — Overview, Key Features, Specifications table, What's in the Box, Care/Usage. No inline styles, no scripts, no images.
6. `variantTypes` + `variants`: if the product has options, list EVERY combination with its own `sku`, `stock` and `price`. Colors get hex `swatches`. Exactly one variant has `"isDefault": true`.
7. `shipping`: always fill `weight` + `weightUnit` and package `length`/`width`/`height` — estimate realistically if unknown; the product cannot be saved without a weight.
8. Metric units only (g, kg, ml, l, cm, m). Never oz/lb/inch.
9. SEO: `metaTitle` ≤ 60 chars, `metaDescription` ≤ 160 chars, both containing the main keyword.
10. Omit any field you have no real basis for. Never output placeholders, lorem ipsum, or "N/A".
````

---

## 2. Full JSON example

Every supported field, in the shape the importer expects.

```json
{
  "version": "1",
  "localized": {
    "en": {
      "title": "Jsdoin Portable Handheld Fan — 5 Speeds, 5000mAh, LED Display",
      "description": "Foldable handheld fan with 5 wind speeds and a 5000mAh battery that runs up to 15 hours — for desk, commute and travel.",
      "content": "<h3>Overview</h3><p>The Jsdoin portable fan folds from a handheld cooler into a desk stand in one motion, so you keep steady airflow at your desk, in the car or on the move. A 5000mAh rechargeable battery delivers up to 15 hours on the lowest speed.</p><h3>Key Features</h3><ul><li><strong>5 wind speeds</strong> — from a quiet breeze to strong airflow.</li><li><strong>Folds to 90°</strong> — handheld, lanyard or desk fan.</li><li><strong>LED battery display</strong> — always know the remaining charge.</li><li><strong>Aromatherapy compartment</strong> — scent tablets included.</li></ul><h3>Specifications</h3><table><tr><td>Battery</td><td>5000mAh rechargeable</td></tr><tr><td>Runtime</td><td>8–15 hours</td></tr><tr><td>Speeds</td><td>5</td></tr><tr><td>Weight</td><td>190 g</td></tr><tr><td>Charging</td><td>USB-C</td></tr></table><h3>What's in the Box</h3><ul><li>1 × Jsdoin portable fan</li><li>1 × USB-C charging cable</li><li>1 × Lanyard</li><li>3 × Aromatherapy tablets</li></ul><h3>Care &amp; Usage</h3><p>Detach the grille and wipe it with a dry cloth. Charge fully before first use and avoid direct water contact.</p>",
      "bulletPoints": [
        "5 Wind Speeds: Adjust airflow from a quiet breeze to strong cooling.",
        "5000mAh Battery: Built-in rechargeable battery, USB-C charging.",
        "8–15 Hour Runtime: Runtime varies with the selected speed.",
        "Foldable Design: Folds up to 90° to stand on a desk.",
        "3-in-1 Use: Handheld, lanyard-worn or desk fan.",
        "LED Display: Shows the exact remaining battery level.",
        "Lightweight: Weighs only 190 g — fits in a bag or pocket.",
        "Detachable Grille: Removes for quick cleaning.",
        "Aromatherapy Compartment: Holds scent tablets, 3 included.",
        "Everyday Use: Home, office, commuting and travel."
      ],
      "metaTitle": "Jsdoin Portable Handheld Fan | 5 Speeds, 5000mAh",
      "metaDescription": "Foldable Jsdoin handheld fan with 5 speeds, 5000mAh battery, LED display and up to 15 hours of runtime. Shop now on Tallaby."
    },
    "ar": {
      "title": "مروحة Jsdoin محمولة قابلة للطي — 5 سرعات وبطارية 5000mAh",
      "description": "مروحة يد قابلة للطي بـ5 سرعات وبطارية 5000mAh تدوم حتى 15 ساعة — للمكتب والمواصلات والسفر.",
      "content": "<h3>نظرة عامة</h3><p>مروحة Jsdoin تتحول من مروحة يد إلى مروحة مكتب بحركة واحدة، فتحصل على هواء ثابت على مكتبك أو في السيارة أو أثناء التنقل. بطارية 5000mAh قابلة لإعادة الشحن تدوم حتى 15 ساعة على أقل سرعة.</p><h3>أهم المميزات</h3><ul><li><strong>5 سرعات هواء</strong> — من نسمة هادئة إلى هواء قوي.</li><li><strong>طي حتى 90°</strong> — باليد أو بالحبل أو على المكتب.</li><li><strong>شاشة LED</strong> — تعرض نسبة البطارية بدقة.</li><li><strong>مكان لأقراص العطر</strong> — مع 3 أقراص مرفقة.</li></ul><h3>المواصفات</h3><table><tr><td>البطارية</td><td>5000mAh قابلة للشحن</td></tr><tr><td>مدة التشغيل</td><td>8–15 ساعة</td></tr><tr><td>السرعات</td><td>5</td></tr><tr><td>الوزن</td><td>190 جرام</td></tr><tr><td>الشحن</td><td>USB-C</td></tr></table><h3>محتويات العلبة</h3><ul><li>1 × مروحة Jsdoin</li><li>1 × كابل شحن USB-C</li><li>1 × حبل تعليق</li><li>3 × أقراص عطرية</li></ul><h3>الاستخدام والعناية</h3><p>افصل الشبكة ونظفها بقطعة قماش جافة. اشحن المروحة بالكامل قبل أول استخدام وتجنب ملامسة الماء.</p>",
      "bulletPoints": [
        "5 سرعات هواء: تحكم في قوة الهواء من نسمة هادئة إلى تبريد قوي.",
        "بطارية 5000mAh: بطارية مدمجة قابلة للشحن عبر USB-C.",
        "تشغيل 8–15 ساعة: المدة تختلف حسب السرعة المختارة.",
        "تصميم قابل للطي: تُطوى حتى 90° لتقف على المكتب.",
        "3 استخدامات: باليد أو معلقة بالحبل أو كمروحة مكتب.",
        "شاشة LED: تعرض نسبة البطارية المتبقية بدقة.",
        "خفيفة الوزن: 190 جرام فقط وتناسب الشنطة أو الجيب.",
        "شبكة قابلة للفك: تُفك بسهولة للتنظيف السريع.",
        "مكان لأقراص العطر: مع 3 أقراص عطرية مرفقة.",
        "استخدام يومي: للمنزل والمكتب والمواصلات والسفر."
      ],
      "metaTitle": "مروحة Jsdoin محمولة | 5 سرعات و5000mAh",
      "metaDescription": "مروحة Jsdoin محمولة قابلة للطي بـ5 سرعات وبطارية 5000mAh وشاشة LED وتشغيل حتى 15 ساعة. اطلبها الآن من Tallaby."
    }
  },
  "price": {
    "list": 300,
    "final": 199,
    "discountType": "amount",
    "discountValue": 101
  },
  "sku": "JSD-FAN-5S",
  "quantity": 40,
  "maxOrderQuantity": 5,
  "images": [
    "https://example.com/images/fan-main.jpg",
    "https://example.com/images/fan-folded.jpg",
    "https://example.com/images/fan-led.jpg"
  ],
  "variantTypes": [
    {
      "kind": "color",
      "swatches": ["#1e40af", "#111827"],
      "localized": {
        "en": { "name": "Color", "values": ["Blue", "Black"] },
        "ar": { "name": "اللون", "values": ["أزرق", "أسود"] }
      }
    },
    {
      "kind": "size",
      "localized": {
        "en": { "name": "Size", "values": ["Standard", "Mini"] },
        "ar": { "name": "المقاس", "values": ["عادي", "ميني"] }
      }
    }
  ],
  "variants": [
    {
      "options": { "en": ["Blue", "Standard"], "ar": ["أزرق", "عادي"] },
      "sku": "JSD-FAN-5S-BLUE-STD",
      "barCode": "6291041500213",
      "stock": 18,
      "price": { "list": 300, "final": 199 },
      "image": "https://example.com/images/fan-blue.jpg",
      "isDefault": true
    },
    {
      "options": { "en": ["Blue", "Mini"], "ar": ["أزرق", "ميني"] },
      "sku": "JSD-FAN-5S-BLUE-MINI",
      "stock": 9,
      "price": { "list": 250, "final": 179 },
      "image": "https://example.com/images/fan-blue-mini.jpg"
    },
    {
      "options": { "en": ["Black", "Standard"], "ar": ["أسود", "عادي"] },
      "sku": "JSD-FAN-5S-BLACK-STD",
      "stock": 10,
      "price": { "list": 300, "final": 199 },
      "image": "https://example.com/images/fan-black.jpg"
    },
    {
      "options": { "en": ["Black", "Mini"], "ar": ["أسود", "ميني"] },
      "sku": "JSD-FAN-5S-BLACK-MINI",
      "stock": 3,
      "price": { "list": 250, "final": 179 },
      "image": "https://example.com/images/fan-black-mini.jpg"
    }
  ],
  "shipping": {
    "fulfillmentType": "platform_fulfilled",
    "freeDelivery": false,
    "handlingTime": 1,
    "weight": 0.19,
    "weightUnit": "kg",
    "length": 20,
    "width": 10,
    "height": 5,
    "unit": "cm"
  },
  "condition": "new",
  "conditionDescription": "Brand new, sealed retail box.",
  "taxClass": "standard",
  "isTrending": true,
  "isSeasonal": true,
  "isFeatured": false,
  "brand": "Jsdoin",
  "category": "Fans",
  "notes": "Summer season stock."
}
```

---

## 3. Field reference

### Product

| Field | Required | Notes |
|-------|----------|-------|
| `localized.en.title` | **Yes** | ≤ 255 chars. Nothing imports without it. |
| `localized.<loc>.description` | No | Plain text, 120–160 chars. |
| `localized.<loc>.content` | No | Rich HTML for the product page editor. |
| `localized.<loc>.bulletPoints` | No | Max 10 strings per locale. |
| `localized.<loc>.metaTitle` / `metaDescription` | No | ≤ 60 / ≤ 160 chars. |
| `localized.ar.*` | No | Same shape as `en`; AR title becomes required once any AR field is filled. |
| `price.list` | Before save | Pre-discount price in EGP. |
| `price.final` | Before save | Sale price; the discount is derived from `list` + `final`. |
| `price.discountType` / `discountValue` | No | `amount` \| `percent` (alias: `percentage`); overrides the derived discount. |
| `sku` | No | Auto-generated on save when empty. |
| `quantity` | No | Stock of the simple product / default variant. |
| `maxOrderQuantity` | No | Per-order cap. |
| `images` | Before save | Max 8 public `http(s)` URLs (first 5 are pulled into the media library). |
| `condition` | No | `new`, `renewed`, `refurbished`, `used_like_new`, `used_very_good`, `used_good`, `used_acceptable`. |
| `conditionDescription` | No | Free text, used for non-new items. |
| `taxClass` | No | `standard` \| `reduced` \| `zero` \| `exempt`. |
| `isTrending`, `isSeasonal`, `isFeatured` | No | Booleans. |
| `brand` / `category` | No | Matched by name; the category is auto-suggested from the title when omitted. |
| `notes` | No | Internal note, not shown to buyers. |

### `variantTypes[]` — option dimensions (max 3)

| Field | Required | Notes |
|-------|----------|-------|
| `kind` | No | `color`, `size`, `weight`, `material`, `style`, `custom`. Drives the editor UI. |
| `unit` | No | Appended to values when `kind` is `weight` (e.g. `ml`). |
| `swatches` | No | Hex colors, index-aligned with `localized.en.values`. Use with `kind: "color"`. |
| `localized.en.name` / `.values` | **Yes** | e.g. `"Color"` + `["Blue", "Black"]`. |
| `localized.ar.name` / `.values` | No | Same order and count as the EN values. |

### `variants[]` — one row per combination (max 60)

| Field | Required | Notes |
|-------|----------|-------|
| `options.en` | **Yes** | One value per entry in `variantTypes`, in the same order, matching a value listed there. |
| `options.ar` | No | Arabic counterpart, same order. |
| `sku` | No | Generated from the product SKU + options when empty. |
| `barCode` | No | EAN/UPC. |
| `stock` | No | Per-variant quantity. The default variant's stock stays in sync with `quantity`. |
| `price` | No | Same shape as the product `price`; falls back to it when omitted. |
| `image` | No | One public URL, imported into the media library (max 10 variant images per import). |
| `isDefault` | No | Exactly one variant should set it; otherwise the first row is used. |

`variants` requires `variantTypes`, and every row must cover all of them — otherwise the import is rejected with an explicit error.

### `shipping`

| Field | Required | Notes |
|-------|----------|-------|
| `weight` + `weightUnit` | **Yes before save** | `kg` \| `g` \| `lb`. |
| `length`, `width`, `height`, `unit` | No | Package size; `unit` is `cm` \| `in`. |
| `fulfillmentType` | No | `platform_fulfilled` \| `seller_fulfilled` \| `fba` \| `digital`. |
| `freeDelivery` | No | Boolean. |
| `handlingTime` | No | Days before dispatch, integer ≥ 1. |

The same keys are still accepted at the top level (`dimensions`, `fulfillmentType`, `freeDelivery`, `handlingTime`) for backwards compatibility.

---

## 4. Limits

| Field | Limit |
|-------|-------|
| Title | 255 characters |
| Meta title / description | 60 / 160 characters |
| Bullet points | 10 per locale |
| Images | 8 product URLs (first 5 imported), 10 variant images |
| Variant dimensions | 3 |
| Variant rows | 60 |
| Bulk URL paste | 25 URLs |
