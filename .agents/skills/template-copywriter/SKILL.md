---
name: template-copywriter
description: Write, rewrite or review the demo copy inside Tallaby (طلبي) storefront templates and section designs - hero titles and lines, announcement bars, category and product names, story, promises (trust), newsletter, about, contact and FAQ text, store names and descriptions in niche packs (editions), look DEFAULT_CONTENT and the L(ar, en) text of library designs. Use it whenever you touch copy in packages/store-sections/src/templates (packs under editions/packs, a template's index.ts) or src/designs, run a copy audit on templates, or when someone says a template's Arabic sounds wrong, too Egyptian, off-niche, too intimate, promises things, or uses words shoppers won't understand. Not for tallaby.com or dashboard copy (content-writer) or AI product descriptions (docs/ai.md).
---

# Template copywriter

Template copy is the text a seller's **customers** read on a store that may be published unedited. So it must be true for any store in that niche, sound like a professional shop, and never promise what the seller might not do. It is not marketing copy for Tallaby (that is the `content-writer` skill), but the owner's word list from `content-writer` applies here too.

Where the copy lives: a pack's `copy` and `demo` (store name, description, category and product names) in `packages/store-sections/src/templates/editions/packs/<industry>/<niche>.ts`; a look's `DEFAULT_CONTENT` and chrome labels in `templates/<key>/index.ts`; demo text of library designs in `packages/store-sections/src/designs/<category>/*.ts`. Every string is `L(ar, en)`.

## 1. Register: simple, formal e-commerce Arabic

- **Modern Standard Arabic as online shops write it**: short, clear, polite, a little generic. Think of a well-run retailer's product pages, not a chat with a friend and not a newspaper.
- **Never Egyptian street dialect** in page copy: no «إزاي»، «عشان»، «مفيش»، «بتاع»، «اللي»، «بيستحمل»، «هتلاقي»، «تحسّي»، «لـ XXL», no casual «في بيتك» / «لحد باب البيت». Write «كيف»، «لأن»، «لا يوجد»، «الذي/التي»، «يتحمّل»، «ستجد»، «حتى XXL».
- **Owner word list** (from `content-writer`, 2026-11-06): use الهاتف، التاجر، جنيه، البريد الإلكتروني، النطاق، العلامة التجارية; never الجوال، موبايل، البائع، إيميل، دومين، براند، إزاي، عشان، مفيش، بتاع. A product category of phones is «هواتف», not «موبايلات».
- **Standard retail terms in product and category names**: «حذاء رياضي» not «كوتشي», «حقيبة» not «شنطة», «هاتف» not «موبايل». The Egyptian spellings in `niches.ts` keywords are for search matching only; they never appear on the page.
- **Gender-neutral by default.** Prefer noun phrases and the generic imperative («تسوّق الآن»، «تصفّح المجموعة»، «كل المنتجات») over feminine-only forms («تسوّقي»), unless the niche serves women only and the look already speaks that way.
- No puns, slang, emoji, exclamation chains or hype («الأفضل»، «الأقوى»، «لا مثيل له»).

## 2. Stay on the niche's products

- Every line talks about **what the shop sells**: the product types, materials, sizes, uses, care. Generic enough for any store in that niche, specific enough to name the trade.
- **Don't drift into lifestyle scenes** around the products (sleep, mornings, family dinners, "your home", "your style"). The owner's example: Vella (lingerie and sleepwear) said «نومة هادية في قماش مريح», which is about sleeping, not about the pajamas and nightgowns the store sells.
- Don't name another trade's products, and don't invent a speciality only one shop would have (a founder's story, a city, a workshop, "since 1998").

## 3. Modest and professional

- **Never mention body parts or intimate or sensitive sensations**: skin, body, curves, "feel it on you", softness against the body, bedroom scenes. The owner's example: «قماش تحسّي بيه على جلدك» is not acceptable. Describe the fabric itself instead: «خامات قطن وساتان ومودال».
- No innuendo or double meanings, especially for lingerie, sleepwear, swimwear, beauty, perfume and health niches. Keep these niches to garment types, fabrics, sizes and care.
- Health and beauty: no medical or result claims («يعالج»، «يزيل التجاعيد»، «نتائج مضمونة»).

## 4. Never promise services the seller may not offer

A template ships to every seller of the niche, so it must not promise anything a store has to choose to provide:

- packaging or gift wrapping, gift notes;
- free shipping, delivery areas or delivery times («توصيل خلال 24 ساعة»);
- returns or exchange windows, refunds;
- warranties, guarantees, installation, maintenance, fitting or tailoring;
- showrooms, branches, opening hours, a phone line or WhatsApp service;
- ratings, review counts, order counts, customer counts, years in business, awards, certifications, "original"/"authentic" guarantees;
- discounts, coupons, sales or "% off" (also blocked by `OFFER_COPY` in `templates/no-discounts.ts`).

Keep claims **product-level and true for any store**: what the products are, what they're made of, what they're for. The four promises (`trust.0..3`) are the hardest slot: write them about the products and the catalog («تفاصيل ومقاسات واضحة لكل منتج»، «تشكيلة لكل الاستخدامات»، «تسوّق سهل من هاتفك»، «تواصل معنا لأي سؤال», since every template has a contact page), never about delivery, returns or payment terms. Demo contact details are obviously placeholders and the same on both sides (`L("shop@store.eg", "shop@store.eg")`).

## 5. Translate, don't transliterate

- An English word an Arabic shopper wouldn't understand becomes proper Arabic. The owner's example: Barber's hero «عدة الباربر في بيتك»: «باربر» isn't understood. Write «أدوات الحلاقة والعناية للرجال».
- Same for «لوك»، «ستايل»، «كولكشن»، «سكين كير»، «جيمنج»، «أوفر سايز»: write «إطلالة»، «تصميم»، «مجموعة»، «العناية بالبشرة»، «ألعاب الفيديو»، «مقاس واسع».
- **Brand, tool and size names stay in Latin script** as `content-writer` says (USB-C, Bluetooth, S–XXL, SPF 50); don't write them in Arabic letters. A demo store's own name may be an Arabic word with its Latin transliteration on the English side («حِلّة / Hella»).

## 6. Length and order

- **Hero title ≤ 6 words** in each language (`EDITION_LIMITS.heroTitleWords`, enforced by `validateEdition`). Aim for 3–5.
- Lines (sublines, promise lines, card text) short: about 14 words at most, one idea each. Exactly 3 announcement lines and 4 promises in a pack (a look shows the ones it has room for).
- **Write the Arabic first, then the English.** Arabic text only on the Arabic side, never empty.
- **English is natural, not a literal translation**: sentence case, plain words, no em dashes, no emoji. It may be shorter than the Arabic.
- Buttons are short verbs or noun phrases: «تسوّق الآن» / "Shop now", «كل المنتجات» / "All products".

## Before and after (the owner's examples)

| Where | Before | Problem | After |
|---|---|---|---|
| Vella, lingerie & sleepwear, hero title (`packs/fashion/lingerie-sleepwear.ts`) | «نومة هادية في قماش مريح» / "Calm nights in soft fabrics" | About sleep, not the products; Egyptian «نومة هادية» | «بيجامات وقمصان نوم وأرواب» / "Pajamas, nightgowns and robes" |
| Vella, story title (same file) | «قماش تحسّي بيه على جلدك» / "Fabric that feels kind on skin" | Mentions the skin and a sensation; dialect «تحسّي» | «خامات قطن وساتان ومودال» / "Cotton, satin and modal" |
| Barber, men's grooming, hero title (`packs/beauty/mens-grooming.ts`) | «عدة الباربر في بيتك» / "The barber's kit at home" | «باربر» isn't understood; casual «في بيتك» | «أدوات الحلاقة والعناية للرجال» / "Shaving and grooming tools for men" |
| Cookware, store description (`packs/kitchen/cookware.ts`) | «… بتستحمل الطبخ كل يوم» | Dialect | «… تتحمّل الاستخدام اليومي» / "… made for everyday use" |
| Vella, promises (same file) | «توصيل لكل محافظات مصر»، «استبدال المقاس خلال ١٤ يوم» | Delivery and exchange terms the seller may not offer; Egypt-only | «تفاصيل ومقاسات واضحة لكل قطعة» / "Clear details and sizes for every piece" |
| Barber, announcement (`packs/beauty/mens-grooming.ts`) | «احجز الكرسي على واتساب» / "Book the chair on WhatsApp" | A booking service and a WhatsApp line the shop may not have | «أدوات حلاقة ولحية وعناية بالشعر» / "Shaving, beard and hair care tools" |

## Checklist before finishing

- [ ] Simple formal MSA everywhere; no dialect words (§1 list), no banned words from the owner's list.
- [ ] Every line is about the niche's products; nothing about sleep, home life or other scenes around them.
- [ ] No body parts, skin, intimate sensations or innuendo; health and beauty make no result claims.
- [ ] No promised service: shipping, delivery times, returns, warranties, wrapping, installation, showrooms, ratings, counts, years, certifications, discounts.
- [ ] No transliterated English an Arabic shopper wouldn't know; tool and size names in Latin script.
- [ ] Hero title ≤ 6 words in both languages; other lines short; 3 announcements and 4 promises.
- [ ] Arabic first; English natural and complete; both sides non-empty.
- [ ] Gender-neutral unless the niche is women-only.
- [ ] Copy changed means the template looks different: re-shoot its card screenshots (`store-templates` skill, Screenshots).
- [ ] `npx vitest run src/templates` passes (validator: word limits, offer words, Arabic side) from `packages/store-sections`.
- [ ] A look's `DEFAULT_CONTENT` change alters its byte-for-byte output: that is a redesign, so bump the look's version and recapture its fixture (`store-templates` workflow §1), or put the fix in the pack instead.
