# Tallaby — Marketing & Brand Context Document

> **Purpose:** Persistent context for AI assistants creating marketing strategies, social media content, ad copy, campaigns, and image-generation prompts for Tallaby.
>
> **Last sourced from codebase:** August 2026  
> **Primary references:** `PROJECT_DESCRIPTION.md`, `apps/ecommerce`, `packages/ui`, `packages/db`, `messages/ar.json`, `messages/en.json`

---

## How to Read This Document

Throughout this file, claims are labeled as:

| Label         | Meaning                                                                                                                             |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| **Confirmed** | Explicitly supported by project files, UI copy, schema, or configuration                                                            |
| **Proposed**  | Reasonable marketing direction not officially locked in the codebase — use for creative work but do not present as established fact |
| **Avoid**     | Placeholder or contradictory content found in the project that marketing should not repeat                                          |

When Confirmed and Proposed conflict, **Confirmed wins** for factual statements. Proposed items guide tone, campaigns, and creative emphasis.

---

## 1. Brand Overview

### What Tallaby Is (Confirmed)

**Tallaby** (`Tallaby.com`) is a **multi-vendor e-commerce marketplace** — a platform where multiple sellers list products and customers browse, cart, checkout, and receive orders. The technical architecture mirrors large marketplaces (Amazon-style catalog, vendor dashboard, admin moderation).

The platform consists of:

| Application                                    | Role                                              |
| ---------------------------------------------- | ------------------------------------------------- |
| **E-commerce storefront** (`apps/ecommerce`)   | Customer shopping experience at `www.tallaby.com` |
| **Vendor dashboard** (`dashboard.tallaby.com`) | Seller product, order, and store management       |
| **Admin panel**                                | Platform operations, vendor approval, moderation  |

### Positioning Statements Found in the Project (Confirmed)

| Context                 | English                                                | Arabic                                                       |
| ----------------------- | ------------------------------------------------------ | ------------------------------------------------------------ |
| Site tagline            | "Your Everything Store"                                | "متجرك الشامل"                                               |
| Default SEO title       | "Online Shopping Egypt - Your Everything Store"        | —                                                            |
| Arabic meta description | —                                                      | Shopping across fashion, electronics, home, beauty, and more |
| Marketplace comparison  | Described as "Amazon-like" / "بديل أمازون" in keywords | Same                                                         |

### Egypt Market Focus (Confirmed)

Despite some English copy describing "global" or "worldwide" delivery, the **operational defaults point to Egypt**:

- Default locale: **Arabic** (`ar`) — `apps/ecommerce/i18n/request.ts`
- Default currency: **EGP** (Egyptian Pound / ج.م)
- Default country on addresses: **Egypt**
- Footer address: **القاهرة، مصر** (Cairo, Egypt)
- Egyptian mobile number validation on addresses
- Product copy references **nationwide governorate delivery** (التوصيل على مستوى المحافظات)
- Payment methods surfaced in footer: **محفظة** (mobile wallet), **إنستا باي** (InstaPay)
- Checkout supports **cash on delivery** (الدفع عند الاستلام); online payment marked **"قريباً"** (coming soon)

**Proposed positioning for marketing:** Lead with **Egypt-first online shopping** — a modern, trustworthy marketplace for Egyptian consumers — rather than "global millions of products" messaging found in legacy English SEO copy.

### What Makes Tallaby Different (Mixed)

**Confirmed differentiators:**

- Multi-vendor marketplace (many sellers, one storefront)
- Arabic-first experience with full RTL support
- Local payment familiarity (COD, wallet, InstaPay)
- WhatsApp-based customer contact channel
- PWA install option for mobile shoppers
- Deal mechanics on homepage: Deal of the Day, New Arrivals, Featured Products
- Active promo: first-order free delivery with code **FREEDEL**
- Welcome email offer: **WELCOME10** (10% off first purchase)

**Proposed differentiator (not in codebase — strategic direction):**

- Curated focus on **trendy, viral, useful, and impulse-buy products** people are currently discovering on social media — see [Product Strategy](#6-product-strategy).

---

## 2. Brand Identity

### Personality (Proposed — derived from UI copy and design)

| Trait             | Expression                                                                 |
| ----------------- | -------------------------------------------------------------------------- |
| **Friendly**      | Conversational Arabic, simple CTAs, approachable promo language            |
| **Modern**        | Clean cards, rounded corners, minimal chrome, mobile-first                 |
| **Exciting**      | Deal badges, urgency ("عرض اليوم", "لفترة محدودة"), accent gold highlights |
| **Trustworthy**   | Seller trust language, secure checkout messaging, verified-seller framing  |
| **Practical**     | COD, easy returns, phone-only support, governorate delivery                |
| **Social-native** | Short headlines, promo codes, product-discovery framing                    |

### Values Surfaced in the Product (Confirmed)

From Arabic UI strings and storefront features:

- **Convenience** — fast delivery, easy checkout, guest cart, wishlist
- **Value** — deals, coupons, free delivery promo, competitive pricing display
- **Trust** — trusted sellers (بائعين موثوقين), secure payment messaging
- **Accessibility** — bilingual (ar/en), RTL, PWA, WhatsApp support

From About page (English — **Avoid using as official claims**):

- Placeholder stats (500K+ customers, 10K+ vendors, 50+ countries) and fictional leadership team are template content, not verified business facts.

### Overall Feeling (Proposed)

A **contemporary Egyptian shopping app** that feels closer to a curated discovery feed than a sterile mega-mall — bright, warm accents on a calm teal foundation, product-forward layouts, and promo-driven energy without aggressive luxury signaling.

### Official Slogan

**Confirmed tagline only:** "متجرك الشامل" / "Your Everything Store"

No other official Arabic slogan is defined in the project. **Proposed** campaign slogans must be labeled as drafts, not brand law.

---

## 3. Target Audience

### Primary Audience (Confirmed from product configuration)

**Egyptian online shoppers** using:

- Arabic as the default language
- EGP pricing
- Egyptian addresses and phone numbers
- Local payment methods (COD, wallet, InstaPay)

### Demographics & Psychographics (Proposed — marketing assumptions)

> These are **not** stored in the codebase. Use for campaign targeting and creative direction.

| Dimension            | Assumption                                                                                                  |
| -------------------- | ----------------------------------------------------------------------------------------------------------- |
| **Age**              | 18–40 core; secondary 41–55                                                                                 |
| **Location**         | Urban and semi-urban Egypt — Cairo, Giza, Alexandria, Delta cities, expanding governorates                  |
| **Gender**           | Mixed; fashion, beauty, accessories skew younger female; gadgets/tools skew male — test per product         |
| **Income**           | Middle and value-conscious segments; responsive to deals and free delivery                                  |
| **Digital behavior** | Heavy Facebook, Instagram, TikTok, YouTube consumption; discovers products via Reels and influencer content |
| **Shopping style**   | Mobile-first, comparison-shopping, COD preference, WhatsApp for questions                                   |
| **Language**         | Egyptian Arabic (عامية) for social; Modern Standard Arabic acceptable for formal ads                        |

### Pain Points (Proposed)

| Pain point                        | Tallaby response (Confirmed where noted)                             |
| --------------------------------- | -------------------------------------------------------------------- |
| Distrust of unknown online stores | Marketplace + trusted sellers messaging; reviews/ratings on products |
| Delivery uncertainty              | Nationwide governorate delivery copy; order tracking                 |
| Payment friction                  | COD confirmed; wallet/InstaPay shown                                 |
| Hidden costs                      | Visible EGP pricing; coupon/discount support                         |
| Hard returns                      | 14-day return policy in Arabic product copy                          |
| Finding trending products         | **Proposed strategy** — curated viral/trendy catalog                 |

### Shopping Motivations (Proposed)

- **Impulse** — viral gadget or beauty find seen on TikTok
- **Deal hunting** — عرض اليوم, discount badges, FREEDEL
- **Gifting** — accessories, personal care, fashion
- **Practical upgrade** — useful home/gadget items
- **Social proof** — ratings, "most selling" product flags in schema

---

## 4. Products & Business Model

### Business Model (Confirmed)

```
Customers ←→ Tallaby Marketplace ←→ Multiple Vendors/Sellers
                    ↓
              Admin moderation
              Orders, payments, payouts (in development: Stripe Connect)
```

- **Revenue model (inferred):** Marketplace commissions / seller fees (vendor onboarding exists; payout infrastructure in roadmap)
- **Fulfillment:** Primarily seller-fulfilled (`seller_fulfilled` in schema)
- **Product types:** Physical products (default); digital products milestone in active development
- **Catalog:** Dynamic categories from database with English + Arabic names (`name`, `nameAr`)
- **Localized product content:** `product_translations` table (title, description, slug per `en` / `ar` locale)

### Product Categories (Confirmed — from metadata, hero, and seller onboarding)

**Marketplace-wide category examples referenced in copy and forms:**

| Category (EN)          | Arabic context         |
| ---------------------- | ---------------------- |
| Electronics & Tech     | إلكترونيات             |
| Fashion & Apparel      | موضة                   |
| Beauty & Personal Care | جمال / العناية الشخصية |
| Home & Garden          | المنزل                 |
| Accessories            | إكسسوارات              |
| Sports & Outdoors      | —                      |
| Toys & Games           | —                      |
| Books & Media          | —                      |
| Automotive             | —                      |

**Hero homepage imagery highlights (Confirmed):** accessories, personal care/cosmetics, fashion.

**Note:** Live category list is database-driven and may change. Top categories display dynamically based on product count.

### Storefront Merchandising Sections (Confirmed)

| Section                  | Arabic label     | Logic                             |
| ------------------------ | ---------------- | --------------------------------- |
| Hero + category carousel | —                | Promo headline + top categories   |
| Deal of the Day          | عرض اليوم        | Popular products, discount badges |
| New Arrivals             | وصل حديثاً       | Sorted by newest                  |
| Featured Products        | المنتجات المميزة | Sorted by popular                 |

### Product Flags in System (Confirmed)

Products can be marked: `isFeatured`, `isPlatformChoice`, `isMostSelling`, `isActive` — useful for marketing "staff picks" and bestseller campaigns.

### Pricing Display (Confirmed)

- Currency: **EGP** / **ج.م**
- Locale formatting: `ar-EG` with Latin numerals (123 not ١٢٣)
- Prices may show list vs. final with discount percentage on deal cards

---

## 5. Product Strategy

> **Status: Proposed strategic direction** — requested brand focus, not explicitly codified in repository files. Align marketing and merchandising to this unless product team states otherwise.

### Core Assortment Philosophy

Tallaby should prioritize products that are:

1. **Trendy** — currently popular on Egyptian social media
2. **Viral** — shareable, conversation-starting, "شفتها فين؟" energy
3. **Interesting** — novel, surprising, or aesthetically distinctive
4. **Useful** — solves a small daily problem (organizers, tools, kitchen hacks)
5. **Impulse-friendly** — accessible price point, low decision friction

### What to De-emphasize (Proposed)

- Commodity bulk goods with no story or visual hook
- High-consideration purchases requiring extensive spec comparison (unless trending)
- Products with weak imagery or unclear utility

### Merchandising Tactics (Proposed)

| Tactic               | Execution                                                     |
| -------------------- | ------------------------------------------------------------- |
| **Trend reactive**   | Fast listing of products trending on TikTok/Reels in Egypt    |
| **Bundle hooks**     | "اشتري ٢ ووفر" style promos for impulse categories            |
| **Scarcity**         | عرض اليوم, limited-time, countdown on deals section           |
| **Discovery naming** | "وصل حديثاً", "ترند الآن", "أكتر حاجة اتباعت"                 |
| **UGC alignment**    | Creative that mimics native social formats, not catalog dumps |

### Category Priority for Marketing (Proposed)

1. Accessories & gadgets
2. Beauty & personal care
3. Fashion & lifestyle
4. Home organization / useful finds
5. Seasonal & giftable items

---

## 6. Brand Voice & Tone

### Voice Attributes (Proposed — aligned with Arabic UI copy)

| Attribute           | Do                                              | Don't                                                |
| ------------------- | ----------------------------------------------- | ---------------------------------------------------- |
| **Egyptian**        | Use natural Egyptian Arabic on social           | Overly formal فصحى unless brand campaign requires it |
| **Friendly**        | "يلا", "متنساش", "هتعجبك" — warm, direct        | Corporate stiffness                                  |
| **Simple**          | Short sentences, one idea per line              | Long paragraphs, jargon                              |
| **Exciting**        | Exclamation where genuine, emoji sparingly ✨🔥 | ALL CAPS spam, false urgency                         |
| **Honest**          | Real prices, real delivery terms                | "Millions of products" unless verified               |
| **Social-friendly** | Hook in first 3 words                           | Essay-style openings                                 |

### Tone by Channel (Proposed)

| Channel            | Tone                                                                    |
| ------------------ | ----------------------------------------------------------------------- |
| Instagram / TikTok | Casual, trendy, visual-first, Egyptian slang OK                         |
| Facebook           | Slightly more explanatory; deals and trust cues                         |
| WhatsApp / DM      | Helpful, fast, human — mirror support style                             |
| Email              | Warm but clearer; promo codes prominent                                 |
| LinkedIn           | Professional — vendor recruitment, business growth (secondary audience) |

### Brand Name Usage (Confirmed)

- **Tallaby** — brand name in Latin script
- **Tallaby.com** — full digital brand in metadata and legal footer
- Arabic copy often keeps "Tallaby.com" in Latin rather than transliterating

---

## 7. Language

### Primary Rule (Confirmed + Strategic)

**All marketing content and designs should be in Arabic**, primarily **natural Egyptian Arabic** suitable for Egyptian social media.

### Locale Configuration (Confirmed)

| Setting               | Value                                  |
| --------------------- | -------------------------------------- |
| Supported locales     | `ar`, `en`                             |
| Default locale        | `ar`                                   |
| Arabic font           | **Noto Kufi Arabic** (weights 400–700) |
| English font          | **Montserrat** (weights 400–700)       |
| Text direction        | RTL for Arabic, LTR for English        |
| Numerals in Arabic UI | Latin digits (0–9) for prices          |

### Arabic Style Guide (Proposed)

- Prefer **Egyptian colloquial** for social posts: "عايز", "كده", "حلوة", "جامد", "مش هتندم"
- Use **Modern Standard Arabic** for: terms & conditions snippets, formal announcements, B2B seller messaging
- Keep **Tallaby.com** and promo codes (**FREEDEL**, **WELCOME10**) in Latin characters
- Price format: `299 ج.م` (number + ج.م)
- Avoid Arabic-Indic numerals in marketing — match the storefront

### Bilingual Handling (Confirmed)

English remains available via language switcher for expats and bilingual users. Marketing **priority is Arabic**; English variants are secondary unless targeting specific segments.

---

## 8. Visual Identity

### Logo (Confirmed)

| Asset          | Path / usage                                     |
| -------------- | ------------------------------------------------ |
| White logo     | `/logo.white.png` — header on primary background |
| Primary logo   | `/logo-primary.png`                              |
| Secondary logo | `/logo.secondary.png`                            |
| Default / OG   | `/logo.png`, `https://www.tallaby.com/logo.png`  |
| Favicon        | `/favicon.png`                                   |

Logo component alt text: **"Tallaby"**

### Brand Colors (Confirmed — from `packages/ui/src/styles/globals.css`)

#### Light mode (primary storefront theme)

| Token                  | Hex               | Role                                                       |
| ---------------------- | ----------------- | ---------------------------------------------------------- |
| **Primary**            | `#145163`         | Headers, footer, buttons, brand teal                       |
| **Primary foreground** | `#fafafa`         | Text on primary                                            |
| **Secondary**          | `#89a8b1`         | Supporting blue-gray                                       |
| **Accent**             | `#fdad28`         | Highlights, badges, CTAs, promo energy                     |
| **Accent foreground**  | `#171717`         | Text on accent                                             |
| **Background**         | `#fafaf8`         | Page background (warm off-white)                           |
| **Foreground**         | `#333333`         | Body text                                                  |
| **Muted**              | `#f7f7f7`         | Subtle surfaces                                            |
| **Muted foreground**   | `#808080`         | Secondary text                                             |
| **Border**             | `#e2cbcb`         | Warm gray-pink borders                                     |
| **Destructive**        | `#dc2626`         | Errors, sale urgency (use sparingly)                       |
| **Card**               | `#d9d9d9`         | Card token (often overridden by white cards in components) |
| **Border radius**      | `0.625rem` (10px) | Standard rounding                                          |

#### Supporting / contextual colors observed in UI

| Hex                    | Usage                                                            |
| ---------------------- | ---------------------------------------------------------------- |
| `#ffffff`              | Product cards, mobile nav                                        |
| `#171717`              | Dark text, dark mode base                                        |
| Amber/orange gradients | Deal of the Day section (`from-amber-50/80`, `via-orange-50/40`) |
| `#0f172a`              | PWA manifest `theme_color` (note: differs from brand primary)    |

#### Email template palette (Confirmed — `WelcomeEmail.tsx`)

| Hex       | Usage                   |
| --------- | ----------------------- |
| `#faf9f7` | Email background        |
| `#f3e8e0` | Hero section warm beige |
| `#2a2a2a` | Headings                |
| `#d97757` | Links / accent coral    |
| `#fff5f0` | Offer box               |

**Note:** Email colors skew warmer/coral compared to the web app's teal/gold system. For consistency, **prefer web UI tokens** for new marketing unless designing email-specific templates.

### Typography (Confirmed)

| Language | Font family      |
| -------- | ---------------- |
| Arabic   | Noto Kufi Arabic |
| English  | Montserrat       |

**Weights used:** 400 (regular), 500 (medium), 600 (semibold), 700 (bold)

### UI & Layout Patterns (Confirmed)

- **shadcn/ui + Tailwind** component system
- **Mobile-first** with bottom navigation on mobile
- **Sticky primary header** with search, cart, wishlist
- **Product cards:** white background, `rounded-lg`, minimal border, shadow-sm, image-dominant
- **Category showcase:** circular thumbnails in horizontal carousel, `rounded-full`
- **Hero:** white background, subtle grid SVG pattern, large headline, 3 staggered product images with `rounded-xl` and ring shadow
- **Footer:** full-width primary (`#145163`) gradient with accent underline on section headings
- **Deal section:** warm amber gradient wash
- **Icons:** Lucide icon set
- **Progress / loading accent:** uses `--accent` (`#fdad28`)

### Imagery Style (Proposed — inferred from hero assets)

- Bright, clean product photography
- Lifestyle context for fashion, beauty, accessories
- Avoid cluttered backgrounds in social crops
- Prefer real product photos over heavy illustration
- Egyptian context when showing people or homes (modest, relatable, urban)

### Brand Patterns (Confirmed)

- Accent underline bars on footer section titles (gradient `from-accent to-accent/50`)
- Promo code badges: `bg-primary/10 text-primary ring-primary/20`
- Discount badges on deal cards (percentage off)
- Circular category navigation as signature homepage element

---

## 9. Design Guidelines

### Social Media Posts (Proposed)

| Element           | Guideline                                                    |
| ----------------- | ------------------------------------------------------------ |
| **Size**          | 1080×1080 feed; 1080×1920 stories/reels                      |
| **Background**    | `#fafaf8`, `#ffffff`, or `#145163` with white text           |
| **Accent use**    | `#fdad28` for price tags, badges, CTA buttons                |
| **Product focus** | Product occupies 50–70% of frame                             |
| **Text**          | Max 8–12 words headline; body optional                       |
| **Logo**          | Small corner watermark; white logo on dark, primary on light |
| **RTL**           | Design for right-to-left reading when Arabic text is primary |

### Product Creatives (Proposed)

- Show product at angle with soft shadow on white or `#fafaf8`
- Include price in EGP with `ج.م`
- Add discount badge when applicable (accent color)
- Optional: "توصيل لكل المحافظات" or "دفع عند الاستلام" trust strip

### Ads & Banners (Proposed)

- Hero formula: **hook + product + offer + CTA**
- Use primary (`#145163`) for brand bands; accent (`#fdad28`) for CTA buttons with dark text
- First-order promo: reference **FREEDEL** where accurate
- Avoid unverified claims from About page template

### Reels / Thumbnails (Proposed)

- Bold Arabic hook text in Noto Kufi Arabic (semibold/bold)
- High contrast text overlay with subtle shadow
- 3-second visual hook — product transformation, unboxing, or "before/after"
- Tallaby logo in corner; not center

### Arabic Typography in Design (Proposed)

- **Headlines:** Noto Kufi Arabic Bold, generous line height (1.3–1.4)
- **Body:** Noto Kufi Arabic Regular/Medium
- **Avoid:** decorative script fonts that reduce readability
- **Sizing:** Arabic often needs 10–15% larger than equivalent English
- **AI image generation:** Prefer overlaying Arabic text in post-production (Canva/Figma) — generated Arabic in images is often incorrect

### Composition Rules (Proposed)

- Clean margins; don't crowd the frame
- One focal product per creative
- Use brand colors — don't introduce off-palette neons unless trend content requires it
- Maintain `rounded-lg` (~10px) feel for frames and cards

---

## 10. Marketing Pillars

### Pillar 1: Trend Discovery (Proposed)

_"لقيته على طلبي"_ — surface what's trending before it's everywhere.

Content: viral product reveals, "ترند الأسبوع", TikTok-style demos.

### Pillar 2: Daily Value (Confirmed mechanics + Proposed framing)

Deals, coupons, عرض اليوم, free delivery on first order (FREEDEL).

Content: price drops, bundle offers, countdown urgency.

### Pillar 3: Trust & Convenience (Confirmed)

COD, governorate delivery, easy returns (14 days), WhatsApp support, secure checkout messaging.

Content: "ازاي تطلب", delivery explainer, payment options.

### Pillar 4: Lifestyle Upgrade (Proposed)

Small purchases that improve daily life — beauty, accessories, organizers, gadgets.

Content: tips, hacks, "لازم تجربي دي".

### Pillar 5: Seller Growth (Confirmed — B2B secondary)

Vendor recruitment via `/become-seller`, dashboard at `dashboard.tallaby.com`.

Content: seller success stories (when real), "ابدأ بيع معانا".

### Pillar 6: New & Now (Confirmed)

وصل حديثاً, المنتجات المميزة sections.

Content: fresh drops, restocks, seasonal collections.

---

## 11. Social Media Strategy Context

### Confirmed Channels

| Platform      | URL / handle                                              |
| ------------- | --------------------------------------------------------- |
| **Facebook**  | `https://www.facebook.com/profile.php?id=100070155523046` |
| **Instagram** | `https://www.instagram.com/tallabycommerce/`              |
| **Twitter/X** | `@tallaby` (in site metadata; not in footer)              |
| **WhatsApp**  | `+20 101 362 6248` (`wa.me/201013626248`)                 |
| **Email**     | `info@tallaby.com`                                        |

No confirmed TikTok or YouTube handles in codebase — **Proposed** to establish consistent handles matching `tallaby` or `tallabycommerce`.

### Platform-Specific Guidance (Proposed)

| Platform      | Content style                                           | Frequency                    | CTA style                        |
| ------------- | ------------------------------------------------------- | ---------------------------- | -------------------------------- |
| **Instagram** | Carousels (product → price → CTA), Reels, Stories polls | Daily stories; 4–5 feed/week | "اطلب من اللينك في البايو" / DM  |
| **TikTok**    | Native vertical video, trend sounds, unboxing           | 3–5/week                     | "لينك في البايو على tallaby.com" |
| **Facebook**  | Deal posts, album catalogs, live shopping potential     | 1/day                        | "تسوق الآن" + link               |
| **YouTube**   | Shorts for product demos; longer reviews optional       | 2–3 Shorts/week              | Link in description              |
| **LinkedIn**  | Seller recruitment, company updates                     | 1–2/week                     | "كن بائعًا"                      |
| **WhatsApp**  | Customer support, order updates (operational)           | On demand                    | Direct human tone                |

### Cross-Platform Consistency (Proposed)

- Same profile photo (logo on `#145163` or white background)
- Bio in Arabic: short value prop + link to `www.tallaby.com`
- Pin first-order **FREEDEL** offer in highlights / pinned post
- Visual consistency: teal + gold palette, Noto Kufi Arabic

---

## 12. Trendy Product Marketing

> Aligns with [Product Strategy](#5-product-strategy) — **Proposed** framework.

### The Trend Marketing Loop

```
Social trend spotted → Fast listing on Tallaby → Native-style creative →
UGC / influencer seeding → Retarget engagers → Next trend
```

### Content Formats for Trend Products (Proposed)

| Format               | Example hook (Egyptian Arabic)           |
| -------------------- | ---------------------------------------- |
| **Reveal**           | "الجزء اللي مفيش حد قاله عن [المنتج]..." |
| **Problem/solution** | "كنت بتعاني من كده؟ الحل على طلبي"       |
| **Social proof**     | "ليه الكل بيطلبها دلوقتي؟"               |
| **Price shock**      | "بـ [السعر] ج.م بس؟!"                    |
| **Comparison**       | "جربناه ٣ أيام — النتيجة..."             |
| **Scarcity**         | "العرض ده مش هيقعد كتير"                 |

### Impulse Purchase Triggers (Proposed)

- Low price anchoring (show discount %)
- Free delivery on first order (FREEDEL — Confirmed)
- COD available (Confirmed)
- Simple one-tap path: post → product page → add to cart

### What Not to Do with Trend Products (Proposed)

- Don't oversell durability/performance without evidence
- Don't use copyrighted trend audio in paid ads without license
- Don't claim "limited stock" unless inventory-backed

---

## 13. Content Principles

### Do (Proposed + Confirmed)

- Write in **Egyptian Arabic** for consumer marketing
- Show **real EGP prices** matching the storefront
- Highlight **COD, governorate delivery, returns** when relevant (Confirmed features)
- Use **verified promo codes** only: FREEDEL, WELCOME10
- Keep copy **short and scannable**
- Feature **actual product images** from catalog
- Include **clear CTA** on every piece
- Design for **mobile** first
- Respect **RTL** layout for Arabic
- Label seller vs. platform promotions accurately

### Don't (Proposed + Confirmed)

- **Don't** repeat About page placeholder stats (500K customers, 50 countries, etc.) — **Avoid**
- **Don't** claim "millions of products" unless merchandising team confirms — legacy SEO copy only
- **Don't** promise online card payment as live — it's "coming soon" in checkout
- **Don't** use formal Arabic that sounds like government notices (unless intentional)
- **Don't** mix unrelated color palettes that clash with `#145163` / `#fdad28`
- **Don't** generate Arabic text inside AI images — overlay in design tools
- **Don't** invent official slogans, CEO quotes, or awards
- **Don't** target minors inappropriately for adult product categories

---

## 14. CTA Guidelines

### Principles (Proposed)

- One primary CTA per creative
- Verb-first in Egyptian Arabic
- Match funnel stage: awareness (شوفي/اعرف) → consideration (قارني/اسأل) → conversion (اطلب/اشتري)
- Pair CTA with urgency only when truthful

### Confirmed CTAs from Arabic UI (use verbatim when applicable)

| English             | Arabic             | Context       |
| ------------------- | ------------------ | ------------- |
| Shop now            | تسوق الآن          | Hero, general |
| Add to cart         | أضف إلى السلة      | Product       |
| Buy now             | اشتري الآن         | Product       |
| Proceed to checkout | المتابعة إلى الدفع | Cart          |
| Place order         | تأكيد الطلب        | Checkout      |
| Continue shopping   | متابعة التسوق      | Cart          |
| View details        | عرض التفاصيل       | Product card  |
| View all products   | عرض جميع المنتجات  | Listing       |
| Become a seller     | كن بائعًا          | Vendor        |
| Sign in             | تسجيل الدخول       | Auth          |
| Create account      | إنشاء حساب         | Auth          |

### Proposed Marketing CTAs (campaign use)

| CTA (Arabic)                 | When to use                      |
| ---------------------------- | -------------------------------- |
| **اطلب دلوقتي**              | Urgency conversion               |
| **جربيها النهارده**          | Beauty / personal care trends    |
| **الحق العرض**               | Deal of the Day                  |
| **استخدم كود FREEDEL**       | First-order free delivery        |
| **واتسابنا على 01013626248** | Support / high-consideration     |
| **تسوق من طلبي**             | Brand awareness                  |
| **لنك المنتج في الكومنت**    | Social engagement (then DM/link) |
| **ابعت "عايز" في الكومنت**   | Engagement bait — use sparingly  |

### CTA Visual Treatment (Confirmed patterns)

- Primary buttons: brand primary background or accent (`#fdad28`) with dark text
- Footer/header: white text on `#145163`
- Rounded corners matching `0.625rem` radius

---

## 15. Image Generation Guidelines

Rules for AI tools (Midjourney, DALL·E, Flux, etc.) creating Tallaby marketing visuals.

### Must Include (Proposed)

- Brand colors: `#145163`, `#fdad28`, `#fafaf8`, `#ffffff`
- Clean, modern e-commerce aesthetic
- Egyptian cultural relevance when people appear (contemporary urban Egyptian look)
- Product-centered composition with space for text overlay
- Warm, inviting lighting — not cold corporate stock

### Must Avoid (Proposed)

- **Arabic text inside generated images** — always add in Figma/Canva (rendering errors common)
- Foreign currency symbols ($, €) — use EGP context visually or add ج.م in post
- Logos of competing marketplaces (Amazon, Noon, etc.)
- Misleading "millions of products" warehouse scale unless brief requires abstract brand visual
- Off-brand neon palettes unrelated to teal/gold system
- Western-only casting when targeting Egyptian audience

### Prompt Structure Template (Proposed)

```
[Product type] product photography, clean white background, soft shadow,
modern e-commerce style, warm studio lighting, minimal composition,
brand colors teal #145163 and gold #fdad28 accents,
space for Arabic text overlay at [top/bottom],
high detail, commercial quality, 4k
--no text, letters, watermark, logo, Arabic script, dollar signs
```

### Product Presentation (Proposed)

| Product type | Visual approach                                             |
| ------------ | ----------------------------------------------------------- |
| Gadgets      | Hand interaction, desk/lifestyle context                    |
| Beauty       | Clean skin-tone-aware presentation, bathroom/vanity context |
| Fashion      | On-model or flat lay; modest styling for Egyptian audience  |
| Home         | Organized, aspirational but realistic Egyptian home         |

### Composition Specs (Proposed)

| Asset             | Dimensions | Notes                          |
| ----------------- | ---------- | ------------------------------ |
| Instagram feed    | 1080×1080  | Center product                 |
| Story/Reel cover  | 1080×1920  | Top 20% safe for UI            |
| Facebook ad       | 1200×628   | Product right, text space left |
| OG / link preview | 1200×630   | Logo + headline + product      |

### Brand Consistency Checklist (Proposed)

- [ ] Uses approved hex colors
- [ ] No embedded text (especially Arabic)
- [ ] Product is hero
- [ ] Mobile-readable at thumbnail size
- [ ] EGP price added in post-production
- [ ] Logo applied from official assets
- [ ] CTA in Egyptian Arabic added separately

---

## 16. Do / Don't — Quick Reference

### Do

| #   | Rule                                                                         |
| --- | ---------------------------------------------------------------------------- |
| 1   | Default to **Egyptian Arabic** for all consumer marketing                    |
| 2   | Use confirmed colors: `#145163`, `#fdad28`, `#fafaf8`                        |
| 3   | Show prices in **EGP / ج.م** with Latin numerals                             |
| 4   | Promote verified codes: **FREEDEL**, **WELCOME10**                           |
| 5   | Mention **COD** and **governorate delivery** as trust builders               |
| 6   | Link to `www.tallaby.com`                                                    |
| 7   | Use **Noto Kufi Arabic** for Arabic typography                               |
| 8   | Design **mobile-first, RTL-aware** layouts                                   |
| 9   | Focus on **trendy, useful, impulse-friendly** products (strategic direction) |
| 10  | Route support CTAs to **WhatsApp** and **info@tallaby.com**                  |
| 11  | Use real product catalog images when possible                                |
| 12  | Mark proposed claims clearly when drafting strategy docs                     |

### Don't

| #   | Rule                                                             |
| --- | ---------------------------------------------------------------- |
| 1   | Don't use About page **placeholder stats or fake team**          |
| 2   | Don't claim **online payment is live** (coming soon)             |
| 3   | Don't say **"millions of products"** without verification        |
| 4   | Don't generate **Arabic text inside AI images**                  |
| 5   | Don't invent **official slogans** beyond "متجرك الشامل"          |
| 6   | Don't use **USD** in customer-facing Egypt marketing             |
| 7   | Don't ignore **RTL** reading order in layouts                    |
| 8   | Don't mix **email coral palette** with web assets inconsistently |
| 9   | Don't promise **delivery times** not backed by operations        |
| 10  | Don't present **proposed strategy** as historical fact           |

---

## 17. Customer Experience Summary

For marketing accuracy — **Confirmed** touchpoints:

| Stage             | Experience                                                    |
| ----------------- | ------------------------------------------------------------- |
| **Discover**      | Homepage hero, categories, deals, search, social links        |
| **Browse**        | Product grid, filters, Arabic/English titles via translations |
| **Evaluate**      | Reviews, ratings, descriptions, similar products              |
| **Cart**          | Guest or authenticated cart, coupons                          |
| **Checkout**      | Address (Egypt), COD, order notes                             |
| **Post-purchase** | Order tracking, notifications, returns flow                   |
| **Support**       | Email, WhatsApp, contact form                                 |
| **Seller path**   | Become seller application → vendor dashboard                  |

### Key Promises Marketing Can Make (Confirmed)

- Free delivery on first order with code **FREEDEL**
- Cash on delivery
- Delivery across Egyptian governorates
- 14-day return window (per Arabic product copy)
- Free shipping on orders over **500 EGP** (per Arabic product copy)
- Secure checkout / SSL messaging

---

## 18. Competitive Context (Proposed)

> Not defined in codebase — framing aid only.

Tallaby competes in the Egyptian e-commerce space against general marketplaces and social-commerce sellers. Differentiation to emphasize:

- Curated **trend-forward** catalog (strategic)
- **Arabic-first** UX
- **Local payments** (COD, wallet, InstaPay)
- **Multi-vendor** selection without leaving one trusted site

Avoid naming competitors in ads unless a legal/comparative campaign is approved.

---

## 19. Future AI Instructions

When you (an AI assistant) create marketing content for Tallaby, follow this workflow:

### Step 1 — Load context

Read this document. Treat **Confirmed** items as facts. Treat **Proposed** items as creative direction.

### Step 2 — Clarify the deliverable

Identify: platform, format, funnel stage, product (if any), and language (default: **Arabic Egyptian**).

### Step 3 — Pull product truth

When promoting a specific product, verify title, price (EGP), images, and availability from the catalog — do not invent specs.

### Step 4 — Apply brand system

- Colors: `#145163`, `#fdad28`, `#fafaf8`
- Font: Noto Kufi Arabic
- Voice: friendly, Egyptian, simple, exciting
- RTL layout for Arabic

### Step 5 — Write copy

- Hook → benefit → proof → CTA
- Use confirmed CTAs where they fit
- Include promo codes only when accurate (FREEDEL, WELCOME10)

### Step 6 — Design / image prompts

- Follow [Image Generation Guidelines](#15-image-generation-guidelines)
- Never embed Arabic in generated images
- Add text, price, logo, and CTA in post-production

### Step 7 — Compliance check

Run the [Do / Don't](#16-do--dont--quick-reference) checklist. Remove unverified claims.

### Step 8 — Output format

Provide:

1. **Primary Arabic copy** (ready to publish)
2. **Optional English secondary** (if requested)
3. **Visual direction** (colors, layout, image prompt if needed)
4. **Hashtags** (Proposed — mix Arabic/English, e.g. `#تسوق_اونلاين #طلبي #Tallaby`)
5. **Notes** flagging anything Proposed or needing human approval

### When Uncertain

- Ask whether a claim is operationally true before publishing
- Default to softer language ("عروض يومية", not "أكبر تشكيلة في مصر")
- Prefer Egyptian Arabic colloquial over formal unless B2B

### Document Maintenance

This file should be updated when:

- Brand colors or logo assets change in `globals.css` or `/public`
- Default locale, currency, or market focus changes
- New official social channels or promo codes launch
- Product strategy is formally documented in the repository
- Payment methods go live (e.g., online card checkout)

---

## Appendix A — Key URLs & Contacts (Confirmed)

| Resource         | Value                                                   |
| ---------------- | ------------------------------------------------------- |
| Storefront       | https://www.tallaby.com                                 |
| Vendor dashboard | https://dashboard.tallaby.com                           |
| Support email    | info@tallaby.com                                        |
| WhatsApp         | +20 101 362 6248                                        |
| Facebook         | https://www.facebook.com/profile.php?id=100070155523046 |
| Instagram        | https://www.instagram.com/tallabycommerce/              |
| Twitter/X        | @tallaby                                                |

## Appendix B — Promo Codes (Confirmed)

| Code          | Offer                        | Source                             |
| ------------- | ---------------------------- | ---------------------------------- |
| **FREEDEL**   | Free delivery on first order | Homepage hero (`messages/ar.json`) |
| **WELCOME10** | 10% off first purchase       | Welcome email template             |

## Appendix C — Source File Index

| Topic                        | File                                                  |
| ---------------------------- | ----------------------------------------------------- |
| Project overview             | `PROJECT_DESCRIPTION.md`                              |
| Brand colors                 | `packages/ui/src/styles/globals.css`                  |
| Arabic copy                  | `apps/ecommerce/messages/ar.json`                     |
| English copy                 | `apps/ecommerce/messages/en.json`                     |
| Default locale               | `apps/ecommerce/i18n/request.ts`                      |
| Fonts                        | `apps/ecommerce/app/layout.tsx`                       |
| Homepage structure           | `apps/ecommerce/app/(main)/page.tsx`                  |
| Hero content                 | `apps/ecommerce/components/home/hero/hero-banner.tsx` |
| Footer / social              | `apps/ecommerce/components/layout/Footer.tsx`         |
| Price formatting             | `packages/lib/src/utils/formatPrice.ts`               |
| Organization schema          | `apps/ecommerce/lib/structured-data.ts`               |
| Welcome email brand          | `packages/emails/src/WelcomeEmail.tsx`                |
| Database products/categories | `packages/db/src/drizzle/schema.ts`                   |

---

_This document is for internal marketing and AI context. It is not a public brand guidelines PDF. Verify operational claims with the Tallaby team before paid campaigns._
