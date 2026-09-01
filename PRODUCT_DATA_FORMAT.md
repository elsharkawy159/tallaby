# Tallaby Product Data Format

Use this format when pasting product data into **Dashboard → Products → Add Product**. The import field accepts:

1. **Product URL** — scrapes the page (Amazon, JSON-LD sites, etc.)
2. **JSON** — strict, preferred for AI-generated data
3. **Tallaby Text Format** — human-readable bilingual blocks

---

## Quick rules

- **English title is required** for a successful import.
- **Arabic** fields are optional but recommended for bilingual listings.
- **Images** must be public `http(s)` URLs (max 8). They are downloaded into your media library.
- **Bullet points**: max 10 per language.
- **Variants**: max 3 option dimensions (e.g. Color, Size).
- **Category** and **brand** are name hints — the form auto-suggests a category; brand is matched by name when possible.

---

## JSON format (canonical — use this for AI)

```json
{
  "version": "1",
  "localized": {
    "en": {
      "title": "Jsdoin Portable Handheld Fan, 5 Speeds, LED Display",
      "description": "Portable Jsdoin fan with 5 speeds, a rechargeable 5000mAh battery and foldable design for handheld, desk and travel use.",
      "content": "<p>Optional HTML for rich product content.</p>",
      "bulletPoints": [
        "5 Wind Speeds: Adjust the airflow to suit your needs.",
        "5000mAh Battery: Built-in rechargeable battery.",
        "8–15 Hour Runtime: Usage time varies depending on airflow speed.",
        "Foldable Design: Fan can fold up to 90°.",
        "Multiple Uses: Use it handheld, with the lanyard or as a desk fan.",
        "LED Display: Shows the battery level.",
        "Portable Design: Weighs approximately 190 grams.",
        "Detachable Grille: Makes the fan easier to clean.",
        "Aromatherapy Compartment: Holds aromatherapy tablets, with tablets included.",
        "Recommended Uses: Suitable for cooling and air circulation at home, in the office and while traveling."
      ],
      "metaTitle": "Jsdoin Portable Fan | 5 Speeds",
      "metaDescription": "Rechargeable 5000mAh portable fan with LED display and foldable design."
    },
    "ar": {
      "title": "مروحة Jsdoin محمولة قابلة للطي بـ5 سرعات وشاشة LED",
      "description": "مروحة Jsdoin محمولة وقابلة للطي بـ5 سرعات، وبطارية 5000mAh قابلة لإعادة الشحن، للاستخدام باليد أو على المكتب أو أثناء السفر.",
      "bulletPoints": [
        "5 سرعات للهواء: تحكم في قوة الهواء حسب احتياجك.",
        "بطارية 5000mAh: بطارية مدمجة قابلة لإعادة الشحن.",
        "وقت تشغيل 8–15 ساعة: يختلف وقت الاستخدام حسب سرعة الهواء.",
        "تصميم قابل للطي: يمكن طي المروحة حتى 90°.",
        "استخدام متعدد: تُستخدم باليد، معلّقة بالحبل أو كمروحة مكتب.",
        "شاشة LED: تعرض مستوى البطارية.",
        "تصميم محمول: وزن المروحة حوالي 190 جرام.",
        "شبكة قابلة للإزالة: تسهّل تنظيف المروحة.",
        "مكان لأقراص العطر: يمكن وضع أقراص العطر داخل الشبكة، مع أقراص عطرية مرفقة.",
        "الاستخدامات: مناسبة للتبريد وتحريك الهواء في المنزل، المكتب والسفر."
      ],
      "metaTitle": "مروحة Jsdoin محمولة",
      "metaDescription": "مروحة محمولة قابلة للشحن بـ5 سرعات وشاشة LED."
    }
  },
  "price": {
    "list": 300,
    "final": 150,
    "discountType": "amount",
    "discountValue": 150
  },
  "sku": "PROD_132",
  "quantity": 17,
  "images": [
    "https://example.com/images/fan-main.jpg"
  ],
  "variantTypes": [
    {
      "localized": {
        "en": { "name": "Color", "values": ["Red", "Blue", "Black"] },
        "ar": { "name": "اللون", "values": ["أحمر", "أزرق", "أسود"] }
      }
    }
  ],
  "dimensions": {
    "weight": 0.19,
    "weightUnit": "kg",
    "length": 10,
    "width": 5,
    "height": 20,
    "unit": "cm"
  },
  "fulfillmentType": "platform_fulfilled",
  "freeDelivery": false,
  "handlingTime": 1,
  "condition": "new",
  "isTrending": false,
  "isSeasonal": false,
  "brand": "Jsdoin",
  "category": "Fans"
}
```

### JSON field reference

| JSON path | Form field | Required | Notes |
|-----------|------------|----------|-------|
| `localized.en.title` | `localized.en.title` | **Yes** | Max 255 chars |
| `localized.en.slug` | `localized.en.slug` | Auto | Generated from title |
| `localized.en.description` | `localized.en.description` | No | Plain text |
| `localized.en.content` | `localized.en.content` | No | HTML for rich editor |
| `localized.en.bulletPoints` | `localized.en.bulletPoints` | No | Max 10 strings |
| `localized.en.metaTitle` | `localized.en.metaTitle` | No | Max 60 chars |
| `localized.en.metaDescription` | `localized.en.metaDescription` | No | Max 160 chars |
| `localized.ar.*` | `localized.ar.*` | No | Same shape as EN |
| `price.list` | `price.list` | No* | *Required before save |
| `price.final` | `price.final` | No* | Discount derived if both list & final set |
| `price.discountType` | `price.discountType` | No | `amount` or `percent` |
| `price.discountValue` | `price.discountValue` | No | |
| `sku` | `sku` | No | Auto-generated on save if empty |
| `quantity` | `quantity` | No | Integer ≥ 0 |
| `images` | `images` | No* | *Required before save; max 8 URLs |
| `variantTypes` | `variantTypes` | No | Max 3 dimensions |
| `dimensions.*` | `dimensions.*` | No | `length`, `width`, `height`, `weight`, `unit`, `weightUnit` |
| `fulfillmentType` | `fulfillmentType` | No | `platform_fulfilled`, `seller_fulfilled`, `fba`, `digital` |
| `freeDelivery` | `freeDelivery` | No | Boolean |
| `handlingTime` | `handlingTime` | No | Days, integer ≥ 1 |
| `condition` | `condition` | No | `new`, `renewed`, `refurbished`, `used_*` |
| `isTrending` / `isSeasonal` | same | No | Boolean |
| `brand` | `brandId` | No | Matched by name |
| `category` | `categoryId` | No | Matched by name (suggestion) |

---

## Tallaby Text Format (human-readable)

Bracket sections are recommended. Emoji locale markers (`🇬🇧 English` / `🇪🇬 Arabic`) are also supported.

```
[Product Name]
EN: Jsdoin Portable Handheld Fan, 5 Speeds, LED Display
AR: مروحة Jsdoin محمولة قابلة للطي بـ5 سرعات وشاشة LED

[Product Description]
EN: Portable Jsdoin fan with 5 speeds, a rechargeable 5000mAh battery and foldable design for handheld, desk and travel use.
AR: مروحة Jsdoin محمولة وقابلة للطي بـ5 سرعات، وبطارية 5000mAh قابلة لإعادة الشحن، للاستخدام باليد أو على المكتب أو أثناء السفر.

[Bullet Points]
EN:
- 5 Wind Speeds: Adjust the airflow to suit your needs.
- 5000mAh Battery: Built-in rechargeable battery.
- 8–15 Hour Runtime: Usage time varies depending on airflow speed.
AR:
- 5 سرعات للهواء: تحكم في قوة الهواء حسب احتياجك.
- بطارية 5000mAh: بطارية مدمجة قابلة لإعادة الشحن.

[Pricing]
List Price: 300
Final Price: 150

[Inventory]
SKU: PROD_132
Quantity: 17

[Variants]
Color EN: Red, Blue, Black
Color AR: أحمر, أزرق, أسود

[Images]
https://example.com/images/fan-main.jpg

[Shipping]
Fulfillment: platform_fulfilled
Free Delivery: false
Handling Time: 1
Weight: 0.19 kg
Length: 10 cm
Width: 5 cm
Height: 20 cm

[SEO]
EN Meta Title: Jsdoin Portable Fan
EN Meta Description: Rechargeable portable fan with LED display.
AR Meta Title: مروحة Jsdoin محمولة
AR Meta Description: مروحة قابلة للشحن بـ5 سرعات.

[Brand]
Jsdoin

[Category]
Fans
```

### Accepted section header aliases

| Canonical | Aliases |
|-----------|---------|
| Product Name | `Product Name`, `[Product Name]` |
| Product Description | `Product Description`, `Description` |
| Bullet Points | `Bullet Points`, `Bullet Points & Attributes`, `Key Features` |
| Pricing | `Pricing`, `Price` |
| Inventory | `Inventory`, `Stock` |
| Variants | `Variants`, `Product Variants` |
| Images | `Images`, `Media` |
| Shipping | `Shipping`, `Shipping Options` |
| SEO | `SEO`, `Search Engine` |

### Pricing line aliases

| Field | Accepted labels |
|-------|-----------------|
| List price | `List Price`, `Product Price`, `Price` |
| Final price | `Final Price` |

### Locale markers

- `EN:` or `🇬🇧 English` → English block
- `AR:` or `🇪🇬 Arabic` → Arabic block

### Variant lines

```
Color EN: Red, Blue, Black
Color AR: أحمر, أزرق, أسود
```

Or EN-only:

```
Color: Red, Blue, Black
```

---

## AI prompt template

Copy and adapt this when asking an AI to write product data:

```
Write product data for Tallaby marketplace in BOTH JSON and Tallaby Text Format.

Product: [describe the product]

Requirements:
- Bilingual EN + AR for title, description, and up to 10 bullet points
- list price and final price in EGP
- SKU, quantity, variant colors/sizes if applicable
- image URLs if known
- weight and dimensions if known
- SEO meta title and description per language

Follow the exact structure in PRODUCT_DATA_FORMAT.md at the repo root.
Output JSON first, then the text format.
English title is required. Use realistic marketplace copy, not placeholder text.
```

---

## Limits

| Field | Limit |
|-------|-------|
| Title | 255 characters |
| Bullet points | 10 per locale |
| Images | 8 URLs |
| Variant dimensions | 3 |
| Meta title | 60 characters |
| Meta description | 160 characters |
