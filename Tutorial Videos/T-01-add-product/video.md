---
id: T-01
slug: add-product
feature: Add a product
roadmap: "§2.1 Products"
dashboard_path: /stores/[storeId]/products/add
status: draft
duration_seconds: 31.8
made_on: 2026-11-17
youtube_url:
youtube_title_ar: "طريقة إضافة منتج جديد لمتجرك على طلبي #Shorts"
youtube_title_en: "How to add a product to your Tallaby store #Shorts"
---

## Steps shown

| Time | Step | What happens on screen |
|---|---|---|
| 0–2.0 s | Title card | "إضافة منتج جديد", label "شرح سريع" |
| 2.0–6.0 s | 1. اختر «إضافة يدويًا» | The page "كيف تريد إضافة منتجك؟" scrolls to the fourth card; tap "إضافة يدويًا"; the form "منتج جديد" opens |
| 6.0–11.8 s | 2. اكتب اسم المنتج ووصفه المختصر | Tap "اسم المنتج" and type "كوب سيراميك يدوي" (the product link appears under it); tap "الوصف المختصر" and type one line |
| 11.8–16.0 s | 3. أضف صور المنتج | Tap "اسحب الصور هنا أو انقر للرفع"; three photos upload; the first is "الغلاف" |
| 16.0–21.0 s | 4. اختر الفئة | Tap "الفئة"; the sheet "اختر الفئة" opens; tap "أكواب ومجّات" under "فئات متجرك" |
| 21.0–26.2 s | 5. اكتب السعر ثم اضغط «نشر» | Tap "سعر المنتج" and type 299; the bar says "جاهز للنشر" at 100%; tap "نشر"; the button shows "جارٍ النشر…" |
| 26.2–29.0 s | Result | The products list with the new product first, the message "تم إنشاء المنتج بنجاح!" and the gold check |
| 29.0–31.8 s | End card | "جرّبها الآن من لوحة التحكم", "المنتجات ‹ إضافة منتج" |

The bar at the bottom counts down as on the real page: 29% "5 حقول مطلوبة متبقية" → 43% → 57% → 71% "حقلان مطلوبان متبقيان" → 86% "حقل مطلوب متبقٍ" → 100% "جاهز للنشر".

## YouTube description (Arabic)

طريقة إضافة منتج جديد لمتجرك من لوحة التحكم في طلبي، خطوة بخطوة.

1. اختر «إضافة يدويًا».
2. اكتب اسم المنتج ووصفه المختصر.
3. أضف صور المنتج.
4. اختر الفئة.
5. اكتب السعر ثم اضغط «نشر».

https://tallaby.com

## Caption / post text

إضافة منتج جديد لمتجرك في 5 خطوات: اختر «إضافة يدويًا»، اكتب الاسم والوصف المختصر، أضف الصور، اختر الفئة، اكتب السعر ثم اضغط «نشر».

## Tags

طلبي, Tallaby, إضافة منتج, لوحة التحكم, متجر إلكتروني, شرح, البيع أونلاين, مصر

## Notes

**Source files checked (2026-11-17, `main` at `1b7c5010`):** `apps/dashboard/app/[locale]/(main)/stores/[storeId]/products/add/` (`page.tsx`, `add-product.tsx`, `add-method-chooser.client.tsx`, `use-add-method.ts`, `add-product.lib.ts`, `form-kit.tsx`, `publish-progress.tsx`, `category-field.tsx`, `sections/basic-section.tsx`, `sections/pricing-section.tsx`, `sections/fields.tsx`, `sections/collapsible-section.tsx`), `components/inputs/image-upload.tsx`, `components/seller-ui/{buttons,fields,layout}.tsx`, `components/layout/dashboard-header.client.tsx`, `products/_components/{vendor-products.section,product-card.client,product-saved-toast.client}.tsx`, `app/globals.css` and `messages/ar.json`. Every label in the video is the string from `ar.json`.

**Where the real page differs from the outline in TUTORIALS.md §11** ("Photos → name and price → category → publish"):

- The page opens on a choice of four methods, so step 1 is choosing "إضافة يدويًا".
- The real order of fields is name → short description → photos → category, then the price in the next card. The short description is required, so it is shown.
- "نشر" is in a bar fixed to the bottom of the screen. That is under the YouTube Shorts buttons, so the video lifts the screen until the bar sits at y ≈ 1090. The white band under the bar at that moment is not part of the dashboard.
- After publishing, the real page loads the products list and shows the message "تم إنشاء المنتج بنجاح!" with "عرض". The message is at the bottom of the screen, where the real one is, so the Shorts buttons cover part of it; the new product and the check are in the safe area.

**Simplified or not shown:**

- The phone's own file picker (after tapping the photo box) is not shown; the three photos appear uploading straight away.
- The top bar's search field, the editor's toolbar (first 10 buttons) and the folded sections under the price are drawn from the code but are not used.
- The category sheet lists only the store's own categories ("فئات متجرك"). The real sheet also lists Tallaby's categories under them.
- The photo counter reads "8 / 3" in Arabic. That is how the real page's markup renders in a right-to-left line (`{files.length} / {maxImages}` with spaces), so it was kept.

**Fictional data:** store "متجر نور"; products "كوب سيراميك يدوي" 299 جنيه, "طبق تقديم سيراميك" 450 جنيه, "مزهرية سيراميك" 320 جنيه, "شمعة عطرية" 180 جنيه; categories "أكواب ومجّات", "أطباق وصحون", "ديكور المنزل", "شموع ومعطرات", "هدايا"; wallet "≈ 270 جنيه". Product pictures are drawn shapes, not photos.

**Not checked:** the page was read in the code, not opened on production. Do that before changing `status` to `ready`. The sounds were made simpler and quieter on 2026-11-17 (owner); the new mix was measured (-36.3 LUFS, -18 dBTP), not listened to.

**Rebuild:** `node "Tutorial Videos/_kit/build.mjs" "Tutorial Videos/T-01-add-product"`, render in `work/`, then `node "Tutorial Videos/_kit/finish.mjs" "Tutorial Videos/T-01-add-product"` (see `_kit/README.md`).
