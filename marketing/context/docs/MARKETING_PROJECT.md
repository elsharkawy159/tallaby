# طلبي (Tallaby) — Marketing & Brand Context Document

> **Purpose:** Persistent context for AI assistants creating marketing strategies, social media content, ad copy, campaigns, and image-generation prompts for **طلبي / Tallaby**.
>
> **Last sourced from codebase:** October 2026 · **Positioning updated:** 18 Oct 2026 (official tagline is now **"إنشاء متاجر إلكترونية"**) · **Pricing, features & campaign updated:** 19 Oct 2026  
> ⚠️ **FULFILLMENT PAUSED (user decision, 20 Oct 2026):** طلبي is **not** marketing storage, packaging, delivery/riders, COD collection, customer service or returns for sellers. Never mention them in any marketing, caption, design or ad. Treat shopper-side delivery promises as on hold too unless the team confirms them. **Market only:** e-commerce website creation (AI store in a minute, templates, no code, own link/domain), app integrations (shipping companies the seller ships with, payment methods, social media, Google Analytics, Meta Pixel + catalog), the seller dashboard, Tallaby services (marketplace exposure "عملاء طلبي", boost package 700 ج.م / 7 days, custom domain, WhatsApp support) and pricing (**بدون رسوم + 5 ج.م per successful order**). Fulfillment facts below are kept for reference only.
> **Current campaign (20 Oct 2026 → 3 Jan 2027):** brand awareness among business owners — see `claude/MARKETING_CAMPAIGN_PLAN_NOV_DEC_2026.md` and the ready post bank `claude/POST_BANK_NOV_DEC_2026.md`.  
> **Primary references:** `PROJECT_DESCRIPTION.md`, `apps/ecommerce`, `apps/dashboard`, `apps/shipping`, `packages/ui`, `packages/db`, `packages/lib`, `apps/ecommerce/messages/ar.json`

---

> 📵 **WHATSAPP CONTACT RULE (user decision, 20 Oct 2026):** WhatsApp link is **http://wa.me/@tallaby** (captions, bios, ads, links). On designs write **Whatsapp @tallaby.com**. **Never** show the mobile phone number in any design, caption, ad or doc again.


## Voiceover Generation Rules

Whenever creating, rewriting, translating, or generating a voiceover, read and follow
`claude/VOICEOVER_RULES.md` before proceeding.

These rules apply to all voiceover tools and MCP integrations, including Higgsfield
and any other connected voice generation provider.

Always prepare natural Egyptian Arabic scripts and provide tool-appropriate voice
instructions. Prioritize authentic Egyptian phrasing, smooth delivery, confident
energy, clear pronunciation, and human-like speech.

Never assume a tool supports a specific voice, setting, or parameter without checking
its available capabilities.

Current approved setup (20 Oct 2026): Higgsfield `text2speech_v2`, variant `elevenlabs`, preset voice **Bram** `549ff70a-3ee7-4f04-a4d9-89a24fab7709`. Don't use seed_audio preset voices for Arabic (wrong language/accent); the Gulf dialect was tested and rejected. Details and the download/sync workflow are in `claude/SOCIAL_DESIGN_CONTEXT.md`.

## How to Read This Document

Throughout this file, claims are labeled as:

| Label         | Meaning                                                                                                                             |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| **Confirmed** | Explicitly supported by project files, UI copy, schema, or configuration                                                            |
| **Proposed**  | Reasonable marketing direction not officially locked in the codebase — use for creative work but do not present as established fact |
| **Avoid**     | Placeholder, disabled, or contradictory content found in the project that marketing should not repeat                               |

When Confirmed and Proposed conflict, **Confirmed wins** for factual statements. Proposed items guide tone, campaigns, and creative emphasis.

---

## 0. Brand Name — Read First

| Script          | Official name   | Notes                                                       |
| --------------- | --------------- | ----------------------------------------------------------- |
| **Arabic**      | **طلبي**        | The only correct Arabic brand name                          |
| **Latin**       | **Tallaby**     | Used in English copy, URLs, handles, logo alt text          |
| **Domain**      | **tallaby.com** | Always lowercase in links; `www.tallaby.com` for storefront |

**Rules:**

- In **Arabic** copy, always write the brand as **طلبي**.
- **Never** write **تالابي** or any other Arabic transliteration of "Tallaby" — it is wrong.
- Keep URLs, handles, and promo codes in Latin (`tallaby.com`, `@usetallaby`, `WELCOME10`).
- Note: many Arabic UI strings in `messages/ar.json` still say "Tallaby" in Latin letters (e.g. "ليه تتسوق من Tallaby؟"), while newer copy (the `/sell` seller page, affiliate program, seller dashboard) already uses **طلبي**. For **marketing**, use **طلبي** in Arabic text.

---

## 1. Brand Overview

### What طلبي Is (Confirmed)

**طلبي / Tallaby** (`tallaby.com`) is an **Egyptian platform for creating online stores and selling through a multi-vendor marketplace** — independent, reviewed sellers open their own store, list products and sell nationwide; customers browse, add items from several sellers to **one cart**, and check out once. The platform also has fulfillment and last-mile delivery capabilities, but **these are paused for marketing (20 Oct 2026)** — don't mention them.

The platform consists of:

| Application                                         | Role                                                                                      |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| **E-commerce storefront** (`apps/ecommerce`)        | Customer shopping at `www.tallaby.com`                                                    |
| **Seller storefronts** (same app)                   | Each seller gets their own store site at `{store}.tallaby.com`, or a custom domain        |
| **Seller sign-up page**                             | A `/sell` page exists, but **marketing always links sellers to `tallaby.com`** (team decision, 18 Oct 2026) |
| **Vendor dashboard** (`dashboard.tallaby.com`)      | Seller products, orders, coupons, marketing, financials, reports, reviews, shipping       |
| **Admin panel** (`apps/admin`)                      | Platform operations, seller approval, moderation                                          |
| **Shipping app** (`apps/shipping`)                  | Last-mile delivery: admin dispatch + rider app (deliveries, COD collection)               |

### Positioning (Confirmed — updated 18 Oct 2026)

**Core positioning: طلبي = إنشاء متاجر إلكترونية** — the place where anyone can create their own online store and sell all over Egypt.

| Context              | Arabic                                                                       | English                          |
| -------------------- | ---------------------------------------------------------------------------- | -------------------------------- |
| **Official tagline** | **"إنشاء متاجر إلكترونية"**                                                   | "Create your online store" (**Proposed** translation) |
| Hero description     | "تسوق منتجات متنوعة من بائعين معتمدين في كل مصر، مع إمكانية الدفع عند الاستلام." | —                                |
| Hero trust stamp     | "الدفع عند الاستلام ✦ بائعون معتمدون ✦ تسوق بأمان ✦"                          | —                                |
| Default SEO title    | "التسوق أونلاين في مصر \| Tallaby.com"                                        | "Online Shopping in Egypt"       |
| Features subheading  | "سوق إلكتروني متعمل مخصوص للتسوق في مصر."                                    | —                                |

> ⚠️ **Retired slogan:** the previous tagline (and the homepage headline built on it) is **retired** and must **never** be used in any marketing, design, caption or AI output. Use **"إنشاء متاجر إلكترونية"** wherever a tagline/positioning line is needed (e.g. top-right of social posts). If the live homepage still shows the old line, flag it for the product team — don't quote it.
>
> The old "Amazon-like / بديل أمازون" and "global / millions of products" SEO copy has also been **removed** from the site — don't revive it.

### Egypt Market Focus (Confirmed)

- Default locale: **Arabic** (`ar`)
- Default currency: **EGP** (ج.م)
- Egyptian addresses (map-based location picker with auto-detect) and Egyptian mobile numbers
- Delivery to **all Egyptian governorates** — Cairo, Giza, Alexandria, Delta & Canal, Upper Egypt, Sinai, Matrouh, New Valley
- Estimated delivery: **Cairo & Giza 1–3 business days**, **other governorates 2–5 business days** (estimates, never guarantees)
- Delivery fee calculated at checkout by **governorate + order weight**, shown before confirming

### What Makes طلبي Different (Confirmed)

- **Create your own online store** — every seller gets a store website (`{store}.tallaby.com` or their own domain) in ~10 minutes, free
- **Multi-vendor marketplace** — many reviewed sellers, one cart, one checkout
- **Verified / approved sellers** (بائعون معتمدون) — sellers are reviewed before selling
- **Cash on delivery** + local payments (InstaPay, Vodafone Cash, طلبي wallet balance)
- **14-day free cancellation / returns** (delivery fee non-refundable)
- **Affiliate program** — anyone can share a personal code: customer gets **10% off**, affiliate earns **10%**
- ~~Done-for-you fulfillment for sellers~~ — **paused 20 Oct 2026, don't market**
- Arabic-first experience with full RTL; WhatsApp support; on-site chat assistant
- Some sellers offer **free delivery** on their products (seller-level free delivery)

**Proposed differentiator (strategic, not in codebase):**

- Curated focus on **trendy, viral, useful, impulse-buy products** — see [Product Strategy](#5-product-strategy). The homepage already has **🔥 الأكثر رواجًا** (trending) and **🍂 منتجات الموسم** (seasonal) sections that support this.

---

## 2. Brand Identity

### Personality (Proposed — derived from UI copy and design)

| Trait             | Expression                                                                 |
| ----------------- | -------------------------------------------------------------------------- |
| **Friendly**      | Conversational Egyptian Arabic ("ليه تتسوق من طلبي؟", "اطلب دلوقتي")        |
| **Modern**        | Clean cards, rounded corners, minimal chrome, mobile-first                 |
| **Exciting**      | Deal badges, "عرض اليوم", "🔥 الأكثر رواجًا", accent gold highlights        |
| **Trustworthy**   | Verified sellers, COD, transparent delivery fees, 14-day returns           |
| **Practical**     | COD, governorate delivery, delivery estimates, WhatsApp support            |
| **Social-native** | Short headlines, shareable codes, product-discovery framing                |

### Values Surfaced in the Product (Confirmed — About page)

| Value                 | Arabic copy                                                                          |
| --------------------- | ------------------------------------------------------------------------------------ |
| **Product discovery** | "مجموعة واسعة من الفئات من بائعين كتير، كلها في بحث واحد."                            |
| **Transparency**      | "أسعار واضحة ومعلومات عن البائعين المعتمدين وتقييمات العملاء"                         |
| **Delivery that understands Egypt** | "توصيل لمحافظات مصر، مع الدفع عند الاستلام عشان تدفع لما يوصلك طلبك."  |

The About page has been rewritten with **real, honest copy** — the old placeholder stats (500K customers, 10K vendors, 50 countries, fake leadership team) are gone. Still **never** invent stats.

### Overall Feeling (Proposed)

A **contemporary Egyptian commerce platform** — where sellers open their own online store in minutes and shoppers get a curated discovery feed rather than a sterile mega-mall — bright, warm accents on a calm teal foundation, product-forward layouts, and promo-driven energy without aggressive luxury signaling.

### Official Slogan

**Confirmed tagline only:** **"إنشاء متاجر إلكترونية"** (English translation "Create your online store" is **Proposed**)

The previous slogan is **retired — never use it**. No other official slogan exists. **Proposed** campaign slogans must be labeled as drafts.

---

## 3. Target Audience

### Primary Audiences (Confirmed from product)

1. **Sellers / brands / anyone who wants an online store** — small businesses and brands wanting their own store and nationwide sales ("عندك براند؟ خلّينا نكبر سوا") → **`tallaby.com`**
2. **Egyptian online shoppers** — Arabic, EGP, Egyptian addresses, COD
3. **Affiliates / content creators** — anyone with an audience who wants to earn 10% by sharing a code → `tallaby.com/affiliate`

### Demographics & Psychographics (Proposed — marketing assumptions)

| Dimension            | Assumption                                                                                                  |
| -------------------- | ----------------------------------------------------------------------------------------------------------- |
| **Age**              | 18–40 core; secondary 41–55                                                                                 |
| **Location**         | Urban and semi-urban Egypt — Cairo, Giza, Alexandria, Delta cities, expanding governorates                  |
| **Gender**           | Mixed; beauty/fashion/accessories skew younger female; gadgets/mobile accessories skew male — test per product |
| **Income**           | Middle and value-conscious; responsive to deals and free delivery                                           |
| **Digital behavior** | Heavy Facebook, Instagram, TikTok, YouTube; discovers products via Reels and influencers                    |
| **Shopping style**   | Mobile-first, comparison-shopping, COD preference, WhatsApp for questions                                   |
| **Language**         | Egyptian Arabic (عامية) for social; MSA acceptable for formal/B2B                                           |

### Pain Points

| Pain point                        | طلبي response                                                         |
| --------------------------------- | --------------------------------------------------------------------- |
| Building an online store is hard/expensive | Free store website in ~10 minutes, no monthly fee (Confirmed) |
| Distrust of unknown online stores | Verified sellers, reviews/ratings, COD (Confirmed)                    |
| Delivery uncertainty              | Nationwide delivery, published estimates, order tracking (Confirmed)  |
| Payment friction                  | COD, InstaPay, Vodafone Cash, wallet (Confirmed)                      |
| Hidden costs                      | Delivery fee shown before confirming the order (Confirmed)            |
| Hard returns                      | Free cancellation/returns within 14 days via the site (Confirmed)     |
| Finding trending products         | Trending & seasonal sections (Confirmed) + curated catalog (Proposed) |

### Shopping Motivations (Proposed)

- **Impulse** — viral gadget or beauty find seen on TikTok
- **Deal hunting** — عروض اليوم, discount badges, countdowns, affiliate 10% codes
- **Gifting** — accessories, mugs, watches, personal care
- **Practical upgrade** — power banks, chargers, car mounts, home items
- **Social proof** — ratings, "الأكثر مبيعاً", "الأعلى تقييماً"

---

## 4. Products & Business Model

### Business Model (Confirmed)

```
Customers ←→ طلبي Marketplace ←→ Multiple Sellers (each with their own online store)
                 ↓                     ↓
        Affiliates (10% / 10%)   Optional طلبي fulfillment services
                 ↓
     Admin moderation · طلبي delivery (riders, COD collection)
```

- **Revenue (Confirmed by the user, 19 Oct 2026):** a **flat 5 ج.م per successful order**, deducted from the seller's wallet — **"عمولة 5 جنيه بس على الطلب"** (fulfillment services are paused). **بدون رسوم:** registration is **free**, no monthly subscription, no hidden fees.
  - ⚠️ The seller PDF (`Tallaby-Seller-Partnership-AR.pdf`) and the `/sell` page still say **5%** (500 → 25 → 475 example). They must be updated. **Marketing uses 5 ج.م only — never mention 5%.**
  - **Honest pricing note:** 5 ج.م/order is higher per order than EasyOrders' $0.04 (≈ 2 ج.م). Never claim "أرخص منصة" or compare per-order fees; compare against dollar subscriptions and developer/hosting costs (see §18).
- ~~Fulfillment / delivery plans~~ — **paused 20 Oct 2026, don't market.** Sellers ship through the integrated shipping companies.
- **Packaging plans:** standard, branded, fragile, gift wrapping.
- **Seller payouts:** earnings from delivered orders go to the seller wallet, then to their bank account on طلبي's payout schedule.
- **Product types:** physical products; digital products foundation exists (downloads).
- **Catalog:** database-driven categories and brands, Arabic + English.

### Product Categories (Confirmed — from homepage collections)

The homepage "اكتشف المزيد" curated collections reveal the current catalog emphasis:

| Collection                      | Sub-items                                                   |
| ------------------------------- | ----------------------------------------------------------- |
| **كل ما يحتاجه موبايلك**         | باور بانك، رؤوس شحن، باور بانك 10000، حوامل للسيارة          |
| **سماعات لكل الأوقات**           | أذن لاسلكية، سماعات رأس، سماعات رقبة، سبيكرات               |
| **مجات وأكواب حرارية**           | ستانلي، هابي تايم، استانلس ستيل                             |
| **ساعات ذكية**                   | شاشة AMOLED                                                 |

Also marketed: accessories, beauty & personal care, fashion, home (manifest + hero imagery). Live categories are database-driven and may change.

### Homepage Merchandising Sections (Confirmed — in order)

| Section                 | Arabic label                        |
| ----------------------- | ----------------------------------- |
| Hero + slides           | وصل حديثاً / الدفع عند الاستلام (main hero line to follow the new positioning — the old one is retired) |
| Sponsored products      | ⭐ منتجات مُموَّلة                   |
| Trending                | 🔥 الأكثر رواجًا                     |
| Seasonal                | 🍂 منتجات الموسم                     |
| Curated collections     | اكتشف المزيد                        |
| Today's deals           | عروض اليوم — "منتجات عليها خصم دلوقتي" |
| Category hub            | اكتشف أقسامنا                       |
| Shop by budget          | تسوق حسب ميزانيتك                   |
| Popular brands          | أشهر الماركات                       |
| Picked for you          | منتجات مختارة لك (الأكثر مبيعاً · وصل حديثاً · الأعلى تقييماً · الأقل سعراً) |
| Seller band             | عندك براند؟ خلّينا نكبر سوا → ابدأ البيع |

### Product Flags in System (Confirmed)

`isFeatured`, `isPlatformChoice`, `isMostSelling`, `isSponsored`, `isTrending`, `isSeasonal`, `isActive` — useful for "staff picks", bestseller, trending and seasonal campaigns. Sellers can set a **discount expiry date**, which drives the storefront **countdown**.

### Pricing Display (Confirmed)

- Currency: **EGP** / **ج.م**
- Locale formatting `ar-EG` with **Latin numerals** (123 not ١٢٣)
- Prices are rounded (to the nearest 5 EGP for shipping)
- List vs. final price with discount percentage on deal cards

---

## 4b. Seller Tech Features & Services (updated 19 Oct 2026)

Status labels: **Confirmed** = codebase/docs/seller PDF/dashboard screenshots · **User-confirmed** = stated by the user on 19 Oct 2026 — verify it is live before paid ads.

### Website builder

| Feature | Arabic marketing line | Status |
|---|---|---|
| **AI store builder** | **الـAI يصمملك متجر إلكتروني كامل في دقيقة واحدة** | User-confirmed (verify real timing; a "3 min" and a "10 min" reel exist) |
| No-code builder | **بناء المتاجر الإلكترونية بدون برمجة** | Confirmed |
| Ready templates | **قوالب جاهزة وسهل التعديل عليها** (colors, logo, images, sections) | User-confirmed |
| Own link / custom domain | **رابط باسمك** `yourstore.tallaby.com` **أو دومين خاص بيك** | Confirmed |
| Mobile-first Arabic RTL store | **متجرك بالعربي وشكله حلو على الموبايل** | Confirmed |

### App integrations

| Integration | Arabic line | Status |
|---|---|---|
| Shipping companies | **ربط مع شركات الشحن** (the seller ships through the integrated companies) | User-confirmed |
| Payment methods | **ربط طرق دفع مختلفة**: الدفع عند الاستلام، إنستاباي، فودافون كاش، رصيد المحفظة | Confirmed — **never claim card** (`ONLINE_CARD_PAYMENT_ENABLED = false`) |
| Social media | **ربط بالسوشيال ميديا** | User-confirmed |
| Analytics | **ربط بتطبيقات التحليلات زي Google Analytics** | User-confirmed |
| Meta Pixel + catalog | **ربط ميتا بيكسل للكتالوج** (FB/IG catalog) | User-confirmed |

### Seller dashboard (Confirmed — screenshots in `Desktop\tallaby\Website Screenshots`; more dashboard screenshots — website builder, templates, apps, wallet — are being added to the project files for use in designs and videos)

Products with variants · **bulk Import / Export** · orders tracking · shipping & logistics settings · account statements · promotions/coupons with countdown · reviews & Q&A · wallet · sales reports · "Advertise your products" · "My store" link with copy/share · WhatsApp "Chat with support".

### Tallaby services (updated 20 Oct 2026)

**Fulfillment (storage, packaging, delivery, COD collection, customer service, returns) is paused — never market it.** Services to market: **store creation help** (AI builder + team on WhatsApp), **custom domain** linking, **marketplace exposure** (products also appear on the طلبي marketplace — one cart, many sellers), the **boost package — 700 ج.م / 7 days** (promo video, posting on طلبي channels, featured on the site, Meta ads; paid separately, **does not guarantee orders**), and **WhatsApp support @tallaby** (http://wa.me/@tallaby).

### Extra marketing words (Proposed copy bank)

بدون مبرمج · بدون استضافة · بدون اشتراك شهري · بالجنيه المصري مش بالدولار · ادفع بس لما تبيع · متجرك جاهز قبل ما الشاي يبرد · من "السعر في الخاص" لـ"اطلب من المتجر" · رابط واحد فيه كل منتجاتك · إحنا نشحن ونحصّل وإنت ركّز في البيع · مفيش رسوم مخفية · متجرك شغال 24 ساعة · صفر جنيه عشان تبدأ · إنت اللي بتختار · مكسبنا من مكسبك · كل حاجة متوصلة من أول يوم

---

## 5. Product Strategy

> **Status: Proposed strategic direction** — align marketing and merchandising to this unless the product team states otherwise.

### Core Assortment Philosophy

1. **Trendy** — currently popular on Egyptian social media
2. **Viral** — shareable, "شفتها فين؟" energy
3. **Interesting** — novel, surprising, or aesthetically distinctive
4. **Useful** — solves a small daily problem (chargers, organizers, thermal mugs)
5. **Impulse-friendly** — accessible price point, low decision friction

### What to De-emphasize (Proposed)

- Commodity bulk goods with no story or visual hook
- High-consideration purchases needing heavy spec comparison (unless trending)
- Products with weak imagery or unclear utility

### Merchandising Tactics (Proposed)

| Tactic               | Execution                                                              |
| -------------------- | ---------------------------------------------------------------------- |
| **Trend reactive**   | Flag trending products (`isTrending`) and push them to social fast     |
| **Bundle hooks**     | "اشتري ٢ ووفر" style promos for impulse categories                     |
| **Scarcity**         | عروض اليوم with real seller-set expiry countdowns                       |
| **Discovery naming** | "وصل حديثاً", "الأكثر رواجًا", "الأكثر مبيعاً"                           |
| **Budget framing**   | "تسوق حسب ميزانيتك" — "منتجات أقل من 200 ج.م"                           |
| **UGC / affiliates** | Creators share their 10% affiliate code instead of generic links       |

### Category Priority for Marketing (Proposed — aligned with current collections)

1. Mobile accessories (power banks, chargers, car mounts)
2. Audio (earbuds, headphones, speakers)
3. Thermal mugs & tumblers (Stanley-style)
4. Smart watches
5. Beauty & personal care, fashion, home, giftable/seasonal items

---

## 6. Brand Voice & Tone

### Voice Attributes (Proposed — aligned with Arabic UI copy)

| Attribute           | Do                                                | Don't                                                |
| ------------------- | ------------------------------------------------- | ---------------------------------------------------- |
| **Egyptian**        | Natural Egyptian Arabic on social                 | Overly formal فصحى unless the campaign needs it      |
| **Friendly**        | "يلا", "متنساش", "هتعجبك" — warm, direct          | Corporate stiffness                                  |
| **Simple**          | Short sentences, one idea per line                | Long paragraphs, jargon                              |
| **Exciting**        | Exclamation where genuine, emoji sparingly ✨🔥   | ALL CAPS spam, false urgency                         |
| **Honest**          | Real prices, real delivery terms                  | "Millions of products", invented stats               |
| **Social-friendly** | Hook in first 3 words                             | Essay-style openings                                 |

### Caption Style — user rule (19 Oct 2026, mandatory)

- **Simple:** 3–6 short lines, one idea per caption.
- **Egyptian accent** (عامية مصرية) — natural, like a person talking, not ad-speak.
- **Few emojis:** at most **one** per caption, many with none. No emoji lists, no rows of ✦/🔥.
- Last line = CTA + `https://tallaby.com` (Instagram: "اللينك في البايو").
- 3–5 hashtags: always `#طلبي #Tallaby` + topic.
- Vary hooks and CTAs — with 1–2 posts per day, no two captions should open the same way.

### Tone by Channel (Proposed)

| Channel            | Tone                                                                     |
| ------------------ | ------------------------------------------------------------------------ |
| Instagram / TikTok | Casual, trendy, visual-first, Egyptian slang OK                          |
| Facebook           | Slightly more explanatory; deals and trust cues                          |
| WhatsApp / DM      | Helpful, fast, human                                                     |
| Email              | Warm but clear; promo codes prominent                                    |
| LinkedIn           | Professional — seller recruitment, online-store creation, business growth |

### Brand Name Usage (Confirmed)

- Arabic: **طلبي** — never **تالابي**
- Latin: **Tallaby**; full digital brand **Tallaby.com**
- In Arabic sentences: "تسوق من طلبي", "بيع على طلبي", "افتح متجرك على طلبي", "محفظتك في طلبي"
- Logo alt text: "Tallaby"

---

## 7. Language

### Primary Rule (Confirmed + Strategic)

**All marketing content and designs should be in Arabic**, primarily **natural Egyptian Arabic**, with the brand written as **طلبي**.

### Locale Configuration (Confirmed)

| Setting               | Value                                  |
| --------------------- | -------------------------------------- |
| Supported locales     | `ar`, `en`                             |
| Default locale        | `ar`                                   |
| Arabic font           | **Noto Kufi Arabic** (weights 400–700) |
| English font          | **Montserrat** (weights 400–700)       |
| Text direction        | RTL for Arabic, LTR for English        |
| Numerals in Arabic UI | Latin digits (0–9)                     |

### Arabic Style Guide (Proposed)

- Prefer **Egyptian colloquial** for social posts: "عايز", "كده", "حلوة", "جامد", "مش هتندم"
- Use **MSA** for terms snippets, formal announcements, B2B seller messaging
- Brand in Arabic = **طلبي**; keep `tallaby.com`, handles and promo codes (**WELCOME10**, affiliate codes) in Latin
- Price format: `299 ج.م`
- Avoid Arabic-Indic numerals in marketing — match the storefront

### Bilingual Handling (Confirmed)

English is available via the language switcher. Marketing **priority is Arabic**.

---

## 8. Visual Identity

### Logo (Confirmed)

| Asset          | Path / usage                                                |
| -------------- | ----------------------------------------------------------- |
| White logo     | `/logo.white.png` — on primary/dark backgrounds             |
| Primary logo   | `/logo-primary.png` — on light backgrounds                  |
| App / PWA icon | `/logo/logo.png`                                            |
| OG image       | `/og-image.jpg`                                             |

Logo alt text: **"Tallaby"**. Seller store sites show a small "by Tallaby" badge.

### Brand Colors (Confirmed — `packages/ui/src/styles/globals.css`)

#### Light mode (primary storefront theme)

| Token                  | Hex               | Role                                     |
| ---------------------- | ----------------- | ---------------------------------------- |
| **Primary**            | `#145163`         | Headers, footer, buttons, brand teal     |
| **Primary foreground** | `#fafafa`         | Text on primary                          |
| **Primary soft**       | `#eef3f4`         | Tinted surfaces, active nav, badges      |
| **Secondary**          | `#89a8b1`         | Supporting blue-gray                     |
| **Accent**             | `#fdad28`         | Highlights, badges, CTAs, promo energy   |
| **Accent foreground**  | `#171717`         | Text on accent                           |
| **Accent soft / ink**  | `#fff4dc` / `#8a5a00` | Soft gold pills with readable text   |
| **Background**         | `#fafaf8`         | Page background (warm off-white)         |
| **Card**               | `#ffffff`         | Product cards, popovers                  |
| **Foreground**         | `#333333`         | Body text                                |
| **Muted / muted text** | `#f7f7f7` / `#808080` | Subtle surfaces / secondary text     |
| **Border**             | `#e2cbcb`         | Warm gray-pink borders                   |
| **Success**            | `#15803d` (soft `#e5f6ea`) | Positive states, "delivered"    |
| **Destructive**        | `#dc2626` (soft `#fdecec`) | Errors, sale urgency (sparingly) |
| **Border radius**      | `0.625rem` (10px) | Standard rounding                        |

#### Dark mode (Confirmed, secondary)

Primary lightens to `#3b9bb0` on `#0f0f0f`; accent stays `#fdad28`. Marketing assets should use the **light** palette by default.

#### Other observed colors

| Hex                    | Usage                                                          |
| ---------------------- | -------------------------------------------------------------- |
| `#0f172a`              | PWA manifest `theme_color` (differs from brand primary)        |
| Amber/orange gradients | Deals sections                                                 |

#### Email template palette (Confirmed — `WelcomeEmail.tsx`)

`#faf9f7` background, `#f3e8e0` hero beige, `#2a2a2a` headings, `#d97757` coral links, `#fff5f0` offer box. Skews warmer than the web app — **prefer web tokens** for new marketing.

### Typography (Confirmed)

| Language | Font family      |
| -------- | ---------------- |
| Arabic   | Noto Kufi Arabic |
| English  | Montserrat       |

Weights: 400, 500, 600, 700.

### UI & Layout Patterns (Confirmed)

- shadcn/ui + Tailwind; Lucide icons
- **Mobile-first** with bottom navigation (active-tab design, RTL-correct)
- Sticky primary header with search, cart, wishlist
- Product cards: white, `rounded-lg`, image-dominant
- Hero category circles (white background when the circle has an image)
- Variant selector as **square swatch tiles**
- Footer: full-width primary teal with accent underline on headings
- Deal cards with discount % badges and expiry countdowns

### Imagery Style (Proposed)

- Bright, clean product photography; lifestyle context for fashion/beauty/accessories
- Uncluttered backgrounds for social crops
- Real product photos over illustration
- Egyptian context when showing people or homes (modest, relatable, urban)

### Brand Patterns (Confirmed)

- Accent underline bars on footer section titles (`from-accent to-accent/50`)
- Promo/code badges: `bg-primary/10 text-primary ring-primary/20`
- Discount % badges on deal cards
- Circular category navigation as signature homepage element
- Trust stamp strip: "الدفع عند الاستلام ✦ بائعون معتمدون ✦ تسوق بأمان ✦"

---

## 9. Design Guidelines

> For social posts, the detailed rulebook is **`claude/SOCIAL_DESIGN_CONTEXT.md`** (simple-style template, background library, key-word highlight rule, Buffer package). It wins over this section when they differ.

### Social Media Posts (Proposed)

| Element           | Guideline                                                    |
| ----------------- | ------------------------------------------------------------ |
| **Size**          | 1080×1350 portrait (default); 1080×1080 feed; 1080×1920 stories/reels |
| **Background**    | `#fafaf8`, `#ffffff`, or `#145163` with white text           |
| **Accent use**    | `#fdad28` for price tags, badges, CTA buttons                |
| **Key word**      | Always highlight the single most important word/number: teal `#145163` rounded box + white text |
| **Tagline**       | "إنشاء متاجر إلكترونية" when a tagline is shown              |
| **Product focus** | Product occupies 50–70% of frame                             |
| **Text**          | Max 8–12 words headline                                      |
| **Logo**          | Small corner watermark; white logo on dark, primary on light |
| **RTL**           | Design right-to-left when Arabic text is primary             |

### Product Creatives (Proposed)

- Product at angle with soft shadow on white or `#fafaf8`
- Price in EGP with `ج.م`
- Discount badge when applicable (accent)
- Trust strip: "توصيل لكل محافظات مصر" · "الدفع عند الاستلام" · "إرجاع مجاني خلال 14 يوم"

### Ads & Banners (Proposed)

- Formula: **hook + product + offer + CTA**
- Primary (`#145163`) for brand bands; accent (`#fdad28`) CTA buttons with dark text
- Use only live offers (see [Appendix B](#appendix-b--promo-codes--offers-confirmed))

### Reels / Thumbnails (Proposed)

- Bold Arabic hook in Noto Kufi Arabic (semibold/bold)
- High-contrast overlay with subtle shadow
- 3-second visual hook — transformation, unboxing, before/after
- طلبي logo in a corner, not center

### Arabic Typography in Design (Proposed)

- Headlines: Noto Kufi Arabic Bold, line height 1.3–1.4
- Body: Noto Kufi Arabic Regular/Medium
- Avoid decorative script fonts
- Arabic often needs 10–15% larger size than English
- Add Arabic text in post-production (Canva/Figma) — AI-generated Arabic is unreliable

### Composition Rules (Proposed)

- Clean margins; one focal product per creative
- Stay on the teal/gold palette
- Keep the ~10px rounded feel for frames and cards

---

## 10. Marketing Pillars

### Pillar 1: Trend Discovery (Confirmed sections + Proposed framing)

_"لقيته على طلبي"_ — 🔥 الأكثر رواجًا, 🍂 منتجات الموسم, وصل حديثاً.

Content: viral product reveals, "ترند الأسبوع", TikTok-style demos.

### Pillar 2: Daily Value (Confirmed)

عروض اليوم with countdowns, تسوق حسب ميزانيتك, seller free-delivery products, WELCOME10 for new subscribers, affiliate 10% codes.

Content: price drops, budget picks ("كل حاجة أقل من 200 ج.م"), countdown urgency.

### Pillar 3: Trust & Convenience (Confirmed)

COD, verified sellers, nationwide delivery with estimates, delivery fee shown upfront, free returns within 14 days, WhatsApp support **@tallaby** (http://wa.me/@tallaby).

Content: "ازاي تطلب من طلبي", delivery explainer, payment options.

### Pillar 4: Lifestyle Upgrade (Proposed)

Small purchases that improve daily life — mobile accessories, audio, mugs, watches, beauty.

Content: tips, hacks, "لازم تجرب دي".

### Pillar 5: Seller Growth & Online-Store Creation (Confirmed — B2B, core positioning)

**Primary link: `tallaby.com`** (don't use the `/sell` URL in marketing) — this pillar carries the brand positioning **"إنشاء متاجر إلكترونية"**.

Key messages (all Confirmed from the sell page unless noted):

- ~~"بِع في كل أنحاء مصر، ونتولى عنك من العمل ما تريد."~~ (implies fulfillment — paused 20 Oct 2026)
- **بدون رسوم** · **التسجيل مجاني** · **لا رسوم عند التسجيل** · no monthly subscription
- **عمولة 5 جنيه بس على الطلب الناجح**, deducted from the seller wallet (Confirmed by the user, 19 Oct 2026 — see §4). Never mention 5%.
- **الـAI يصمملك متجر إلكتروني كامل في دقيقة واحدة** + ready templates, no code, integrations — see §4b
- ~~Choose who handles storage, packaging, delivery, customer service, returns~~ — **paused 20 Oct 2026, don't market**
- Setup takes about **10 minutes**; account is ready immediately to add products
- Every seller gets **their own store website** (`yourstore.tallaby.com`) to share on WhatsApp/Instagram/Facebook — or connect **their own domain**
- Earnings go to the seller wallet, then to their bank account

Content: "أنشئ متجرك الإلكتروني في 10 دقايق", "عندك براند؟ خلّينا نكبر سوا", "افتح متجرك على طلبي مجانًا", seller success stories (only when real).

### Pillar 6: Affiliate / Community (Confirmed)

**Link: `tallaby.com/affiliate`** — "شارك طلبي. امنح خصم 10%. واربح 10%."

- Personal, permanent, unlimited-use code
- Customer gets **10% off**; affiliate earns **10%** of the eligible order value (excluding shipping)
- Commission is credited **automatically to the طلبي wallet** after delivery + the 14-day return window
- Worked example: products 1,000 ج.م → customer pays 900 ج.م + shipping → affiliate earns 100 ج.م

Content: creator recruitment, "اكسب من توصياتك", how-it-works carousels.

---

## 11. Social Media Strategy Context

### Confirmed Channels (`apps/ecommerce/lib/social-links.ts`)

| Platform      | URL / handle                                  |
| ------------- | --------------------------------------------- |
| **Facebook**  | https://www.facebook.com/usetallaby           |
| **Instagram** | https://www.instagram.com/usetallaby          |
| **TikTok**    | https://www.tiktok.com/@tallaby_              |
| **YouTube**   | https://www.youtube.com/@usetallaby           |
| **X**         | https://x.com/usetallaby                      |
| **Threads**   | https://www.threads.com/@usetallaby           |
| **Pinterest** | https://www.pinterest.com/tallabycommerce     |
| **WhatsApp**  | **@tallaby** (`http://wa.me/@tallaby`)        |
| **Email**     | tallabycommerce@gmail.com                     |

All channels are collected on the **follow-us page** (`tallaby.com/follow-us`) — "تابعنا علشان العروض والخصومات". Use it as the link-in-bio hub.

### Platform-Specific Guidance (Proposed)

| Platform      | Content style                                           | Frequency                    | CTA style                        |
| ------------- | ------------------------------------------------------- | ---------------------------- | -------------------------------- |
| **Instagram** | Carousels (product → price → CTA), Reels, Stories polls | Daily stories; 4–5 feed/week | "اطلب من اللينك في البايو" / DM  |
| **TikTok**    | Native vertical video, trend sounds, unboxing           | 3–5/week                     | "اللينك في البايو — tallaby.com" |
| **Facebook**  | Deal posts, album catalogs, live shopping potential     | 1/day                        | "تسوق الآن" + link               |
| **YouTube**   | Shorts for product demos                                | 2–3 Shorts/week              | Link in description              |
| **Threads/X** | Quick deal drops, conversation                          | As available                 | Link                             |
| **Pinterest** | Product pins (mugs, accessories, home)                  | Weekly batches               | Product page link                |
| **LinkedIn**  | Seller recruitment, online-store creation, company updates | 1–2/week                  | "ابدأ البيع: tallaby.com"   |
| **WhatsApp**  | Customer support, order questions                       | On demand                    | Direct human tone                |

### Cross-Platform Consistency (Proposed)

- Same profile photo (logo on `#145163` or white)
- Arabic bio: short value prop with **طلبي** + "إنشاء متاجر إلكترونية" + link to `tallaby.com/follow-us` or `www.tallaby.com`
- Pin current offers and the seller / affiliate links in highlights
- Teal + gold palette, Noto Kufi Arabic

---

## 12. Trendy Product Marketing

> Aligns with [Product Strategy](#5-product-strategy) — **Proposed** framework.

### The Trend Marketing Loop

```
Social trend spotted → Listed & flagged trending on طلبي → Native-style creative →
Affiliate / creator seeding (10% codes) → Retarget engagers (Meta Pixel) → Next trend
```

### Content Formats (Proposed)

| Format               | Example hook (Egyptian Arabic)           |
| -------------------- | ---------------------------------------- |
| **Reveal**           | "الجزء اللي محدش قاله عن [المنتج]..."    |
| **Problem/solution** | "كنت بتعاني من كده؟ الحل على طلبي"       |
| **Social proof**     | "ليه الكل بيطلبها دلوقتي؟"               |
| **Price shock**      | "بـ [السعر] ج.م بس؟!"                    |
| **Comparison**       | "جربناه ٣ أيام — النتيجة..."             |
| **Scarcity**         | "العرض ده مش هيقعد كتير" (only with real expiry) |

### Impulse Purchase Triggers

- Discount % and countdown (Confirmed)
- COD — pay on arrival (Confirmed)
- Seller free-delivery products (Confirmed, product-specific)
- Affiliate 10% code from the creator (Confirmed)
- One-tap path: post → product page → add to cart (`?coupon=` links auto-apply codes — Confirmed)

### What Not to Do (Proposed)

- Don't oversell durability/performance without evidence
- Don't use copyrighted trend audio in paid ads without license
- Don't claim "limited stock" unless inventory-backed

---

## 13. Content Principles

### Do

- Write in **Egyptian Arabic**, brand as **طلبي**
- Use **"إنشاء متاجر إلكترونية"** as the positioning/tagline line
- Show **real EGP prices** matching the storefront
- Highlight **COD, nationwide delivery, 14-day free returns, verified sellers**
- Use **live codes only**: WELCOME10 (welcome email), affiliate codes
- Keep copy short and scannable; one clear CTA
- Use actual catalog images
- Design mobile-first and RTL
- Send sellers to **tallaby.com**, support to **WhatsApp @tallaby (http://wa.me/@tallaby)**

### Don't

- **Don't** write **تالابي** — the Arabic name is **طلبي**
- **Don't** use the **retired slogan** — the only tagline is "إنشاء متاجر إلكترونية"
- **Don't** promise **card / online card payment** — it is switched off (`ONLINE_CARD_PAYMENT_ENABLED = false`), even though some UI copy still mentions "البطاقة" — **Avoid**
- **Don't** promise **free shipping over 500 EGP** — the cart threshold is disabled (`FREE_DELIVERY_THRESHOLD_ENABLED = false`) — **Avoid**
- **Don't** use **FREEDEL** — it's no longer in the site — **Avoid**
- **Don't** claim "millions of products", "Amazon alternative", or global delivery
- **Don't** promise exact delivery dates — only "1–3 days Cairo & Giza, 2–5 days other governorates" as estimates
- **Don't** say returns are fully refunded including delivery — the delivery fee is non-refundable
- **Don't** invent stats, slogans, CEO quotes, or awards
- **Don't** generate Arabic text inside AI images
- **Don't** use off-palette colors that clash with `#145163` / `#fdad28`

---

## 14. CTA Guidelines

### Principles (Proposed)

- One primary CTA per creative, verb-first in Egyptian Arabic
- Match funnel stage: awareness (شوف/اعرف) → consideration (قارن/اسأل) → conversion (اطلب/اشتري)
- Urgency only when truthful

### Confirmed CTAs from Arabic UI

| Arabic                    | Context              |
| ------------------------- | -------------------- |
| تسوق الآن                 | Hero, general        |
| عرض العروض                | Hero (deals)         |
| تصفح الأقسام              | Hero (categories)    |
| اطلب دلوقتي وادفع لما طلبك يوصل | COD slide      |
| ابدأ التسوق               | Slide CTA            |
| أضف إلى السلة             | Product              |
| اشتري الآن                | Product              |
| تأكيد الطلب               | Checkout             |
| ابدأ البيع                | Seller band / follow-us |
| بيع على طلبي              | About page (brand as طلبي) |
| انضم إلى برنامج التسويق بالعمولة | Affiliate     |
| تسوق على tallaby.com      | Follow-us page       |

### Proposed Marketing CTAs

| CTA (Arabic)                              | When to use                   |
| ----------------------------------------- | ----------------------------- |
| **أنشئ متجرك الإلكتروني مجانًا**           | Online-store creation (core positioning) |
| **افتح متجرك مجانًا: tallaby.com**    | Seller recruitment            |
| **اطلب دلوقتي من طلبي**                   | Urgency conversion            |
| **الحق العرض**                            | عروض اليوم                    |
| **ادفع لما يوصلك**                        | COD reassurance               |
| **كلمنا واتساب: wa.me/@tallaby**             | Support / high-consideration  |
| **تسوق من طلبي**                          | Brand awareness               |
| **استخدم كود [CODE] ووفر 10%**            | Affiliate / creator posts     |
| **اكسب 10% من توصياتك**                   | Affiliate recruitment         |
| **لينك المنتج في الكومنت**                | Social engagement             |

### CTA Visual Treatment (Confirmed patterns)

- Buttons: primary teal or accent gold with dark text
- White text on `#145163` in header/footer bands
- `0.625rem` corner radius

---

## 15. Image Generation Guidelines

### Must Include (Proposed)

- Brand colors: `#145163`, `#fdad28`, `#fafaf8`, `#ffffff`
- Clean, modern e-commerce aesthetic
- Egyptian cultural relevance when people appear
- Product-centered composition with space for text overlay
- Warm, inviting lighting

### Must Avoid (Proposed)

- **Arabic text inside generated images** — add in Figma/Canva
- Foreign currency symbols ($, €)
- Competing marketplace logos (Amazon, Noon, Jumia, etc.)
- Fake "mega warehouse" scale visuals
- Off-brand neon palettes
- Western-only casting for Egyptian audiences

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

| Product type            | Visual approach                                     |
| ----------------------- | --------------------------------------------------- |
| Mobile accessories      | Hand interaction, desk/car/on-the-go context        |
| Audio                   | On-ear / in-ear lifestyle, commute, gym             |
| Mugs & tumblers         | Desk, car cup holder, outdoor, steam/ice details    |
| Smart watches           | Wrist close-up, screen glow                         |
| Beauty                  | Clean, skin-tone-aware, vanity context              |
| Fashion                 | On-model or flat lay; modest styling                |
| Home                    | Organized, realistic Egyptian home                  |

### Composition Specs (Proposed)

| Asset             | Dimensions | Notes                          |
| ----------------- | ---------- | ------------------------------ |
| Instagram feed    | 1080×1080 / 1080×1350 | Center product      |
| Story/Reel cover  | 1080×1920  | Top 20% safe for UI            |
| Facebook ad       | 1200×628   | Product + text space           |
| OG / link preview | 1200×630   | Logo + headline + product      |

### Brand Consistency Checklist

- [ ] Approved hex colors
- [ ] No embedded text (especially Arabic)
- [ ] Product is the hero
- [ ] Readable at thumbnail size
- [ ] EGP price added in post
- [ ] Official logo applied
- [ ] Arabic CTA (with **طلبي**, not تالابي) added separately

---

## 16. Do / Don't — Quick Reference

### Do

| #   | Rule                                                                      |
| --- | ------------------------------------------------------------------------- |
| 1   | Write the Arabic brand name as **طلبي**                                   |
| 2   | Default to **Egyptian Arabic** for consumer marketing                     |
| 3   | Use `#145163`, `#fdad28`, `#fafaf8`, `#ffffff`                            |
| 4   | Show prices in **EGP / ج.م** with Latin numerals                          |
| 5   | Mention **COD**, **nationwide delivery**, **14-day free returns**         |
| 6   | Link shoppers to `www.tallaby.com`, sellers to **`tallaby.com`** too (never `/sell`)     |
| 7   | Route support to **WhatsApp @tallaby (http://wa.me/@tallaby)** and tallabycommerce@gmail.com   |
| 8   | Use **Noto Kufi Arabic** for Arabic typography                            |
| 9   | Design **mobile-first, RTL-aware**                                        |
| 10  | Use creators' **affiliate codes** (10% off) in influencer content         |
| 11  | Focus on **trendy, useful, impulse-friendly** products                    |
| 12  | Mark proposed claims clearly in strategy docs                             |
| 13  | Position طلبي as **"إنشاء متاجر إلكترونية"**                               |
| 14  | In designs, **highlight the key word** (teal box, white text)             |

### Don't

| #   | Rule                                                               |
| --- | ------------------------------------------------------------------ |
| 1   | Don't write **تالابي**                                             |
| 2   | Don't claim **card payment** is available                          |
| 3   | Don't promise **free shipping over 500 EGP** or use **FREEDEL**    |
| 4   | Don't say "millions of products" / "Amazon alternative"            |
| 5   | Don't generate **Arabic text inside AI images**                    |
| 6   | Don't invent **slogans** beyond "إنشاء متاجر إلكترونية", and never use the retired one |
| 7   | Don't use **USD** in customer-facing marketing                     |
| 8   | Don't ignore **RTL** reading order                                 |
| 9   | Don't promise **exact delivery times**                             |
| 10  | Don't present **proposed strategy** as fact                        |

---

## 17. Customer Experience Summary

**Confirmed** touchpoints:

| Stage             | Experience                                                                   |
| ----------------- | ---------------------------------------------------------------------------- |
| **Discover**      | Hero, sponsored/trending/seasonal rows, collections, deals, brands, search, social |
| **Browse**        | Categories, brands, stores, filters, shop-by-budget                           |
| **Evaluate**      | Reviews, ratings, variant swatches, seller info, delivery & return info      |
| **Cart**          | Guest or signed-in cart; multiple sellers grouped; coupons (`?coupon=` links) |
| **Checkout**      | Map-based Egyptian address, delivery fee by governorate + weight             |
| **Payment**       | COD, InstaPay, Vodafone Cash, wallet balance (full or partial)               |
| **Post-purchase** | Order tracking, notifications, cancellation/returns with RMA number          |
| **Delivery**      | طلبي riders or seller/courier; possibly separate shipments per seller         |
| **Support**       | WhatsApp @tallaby (http://wa.me/@tallaby), email, contact form, on-site chat assistant            |
| **Loyalty**       | Wallet, referral codes, affiliate program                                     |
| **Seller path**   | `tallaby.com` → registration (~10 min) → dashboard → own online store website |

### Key Promises Marketing Can Make (Confirmed)

- Create your own online store on طلبي — free, ~10 minutes, own store link or domain
- Cash on delivery (for eligible orders)
- InstaPay and Vodafone Cash payments
- Delivery to all Egyptian governorates; fee shown before confirming
- Estimated 1–3 business days Cairo & Giza, 2–5 other governorates (say "عادةً")
- Free cancellation/returns within **14 days** (delivery fee not refunded)
- Refund processed within 7 days, via the original payment method
- Products from **verified sellers**; one cart across many sellers
- Affiliate program: 10% off for customers, 10% for affiliates
- Sellers: بدون رسوم — free registration, no subscription; **5 ج.م per successful order** only (see §4)
- Sellers: AI store builder, ready templates, no code, integrations with shipping companies, payment methods, social media, Google Analytics and Meta Pixel + catalog (User-confirmed — see §4b)

---

## 18. Competitive Context (Proposed)

طلبي competes in Egyptian e-commerce against online-store builders, general marketplaces and social-commerce sellers. Emphasize:

- **Online-store creation** — own store website + marketplace exposure in one place
- **Trend-forward** catalog (strategic)
- **Arabic-first** UX
- **Local payments** (COD, InstaPay, Vodafone Cash)
- **Verified multi-vendor** selection in one cart
- For sellers: **free to join + AI store website + marketplace customers + 5 ج.م per order**

Avoid naming competitors in ads unless a comparative campaign is legally approved.

### Reference platforms (research 19 Oct 2026 — internal only)

| Reference | What they offer / charge | Our angle |
|---|---|---|
| **EasyOrders** (closest Egyptian competitor) | "Store in less than 10 minutes, no coding"; free plan **$0.04/order**, Pro **$100/month**; 15+ payment gateways, 100+ shipping companies, Meta catalog + Google Shopping, "Easy AI"; big social-proof numbers; free marketing support | We own **"AI store in 1 minute"**, charge in **EGP** not USD, and add **marketplace customers (عملاء طلبي)**. Don't compare per-order fees (theirs is lower) |
| **Shopify** | $5–$399/month + transaction fees + paid apps, English-first; awareness through education content | Copy the education-led approach; message: **no subscription, no dollars, in Arabic** |
| **WordPress / WooCommerce** | "Free" but hosting, domain, theme, plugins, developer, maintenance | Message: **no programmer, no hosting, no plugins** |

---

## 19. Future AI Instructions

### Step 1 — Load context

Read this document. **Confirmed** = facts. **Proposed** = creative direction. **Avoid** = never use. For social designs also load `claude/SOCIAL_DESIGN_CONTEXT.md`. For the current campaign load `claude/MARKETING_CAMPAIGN_PLAN_NOV_DEC_2026.md` (pillars, calendar) and `claude/POST_BANK_NOV_DEC_2026.md` (ready posts + captions).

### Step 2 — Clarify the deliverable

Platform, format, funnel stage, audience (shopper / seller / affiliate), product, language (default **Egyptian Arabic**).

### Step 3 — Pull product truth

Verify title, EGP price, images, discount expiry, availability from the catalog — don't invent specs.

### Step 4 — Apply brand system

- Name: **طلبي** (Arabic) / **Tallaby** (Latin)
- Positioning/tagline: **إنشاء متاجر إلكترونية**
- Colors: `#145163`, `#fdad28`, `#fafaf8`
- Font: Noto Kufi Arabic
- Voice: friendly, Egyptian, simple, exciting
- RTL layout

### Step 5 — Write copy

- Hook → benefit → proof → CTA
- Confirmed CTAs where they fit
- Only live offers (WELCOME10, affiliate codes, real seller discounts)

### Step 6 — Design / image prompts

**Tools (user rule, 19 Oct 2026):** image posts and carousels in **Canva** (carousel packs share one design system). Videos **built by Claude** with **Higgsfield voice-over**. Complex live-action videos in **Higgsfield**. Details: `claude/SOCIAL_DESIGN_CONTEXT.md` → Production tools.

- Follow [Image Generation Guidelines](#15-image-generation-guidelines)
- Add text, price, logo, CTA in post-production
- Highlight the key word (teal box, white text)

### Step 7 — Compliance check

Run the [Do / Don't](#16-do--dont--quick-reference) list. Search the copy for "تالابي", the retired slogan, "FREEDEL", "بطاقة", "500" free-shipping claims — remove them.

### Step 8 — Output format

1. **Primary Arabic copy** (ready to publish)
2. **Optional English** (if requested)
3. **Visual direction** (colors, layout, image prompt)
4. **Hashtags** (Proposed — e.g. `#طلبي #إنشاء_متجر_إلكتروني #تسوق_اونلاين #الدفع_عند_الاستلام #Tallaby`)
5. **Notes** flagging anything Proposed or needing approval

### When Uncertain

- Ask whether a claim is operationally true before publishing
- Default to softer language ("عروض يومية", not "أكبر تشكيلة في مصر")
- Prefer Egyptian colloquial unless B2B

### Document Maintenance

Update this file when:

- Colors or logos change (`globals.css`, `/public`)
- Social links change (`apps/ecommerce/lib/social-links.ts`)
- Card payment is enabled (`ONLINE_CARD_PAYMENT_ENABLED`) or the free-shipping threshold is turned on (`FREE_DELIVERY_THRESHOLD_ENABLED`)
- Affiliate rates, return window, or seller commission change (`packages/db/src/affiliates/constants.ts`, sell page FAQ)
- New promo codes launch
- The positioning/tagline changes again

---

## Appendix A — Key URLs & Contacts (Confirmed)

| Resource            | Value                                         |
| ------------------- | --------------------------------------------- |
| Storefront          | https://www.tallaby.com                       |
| **Seller link (marketing)** | **https://tallaby.com** — never the `/sell` URL |
| Affiliate program   | https://tallaby.com/affiliate                 |
| Follow-us hub       | https://tallaby.com/follow-us                 |
| Seller store sites  | `https://{store}.tallaby.com` or custom domain |
| Vendor dashboard    | https://dashboard.tallaby.com                 |
| **WhatsApp**        | **@tallaby** (`http://wa.me/@tallaby`) — on designs write **Whatsapp @tallaby.com**; never show the phone number |
| Support email       | tallabycommerce@gmail.com                     |
| Facebook            | https://www.facebook.com/usetallaby           |
| Instagram           | https://www.instagram.com/usetallaby          |
| TikTok              | https://www.tiktok.com/@tallaby_              |
| YouTube             | https://www.youtube.com/@usetallaby           |
| X                   | https://x.com/usetallaby                      |
| Threads             | https://www.threads.com/@usetallaby           |
| Pinterest           | https://www.pinterest.com/tallabycommerce     |

## Appendix B — Promo Codes & Offers (Confirmed)

| Code / offer             | Details                                                        | Source                              |
| ------------------------ | -------------------------------------------------------------- | ----------------------------------- |
| **WELCOME10**            | 10% off first purchase (welcome email)                         | `packages/emails/src/WelcomeEmail.tsx` |
| **Affiliate codes**      | Personal permanent code: 10% off for customer, 10% for affiliate | `packages/db/src/affiliates/constants.ts` |
| **Seller free delivery** | Some sellers waive delivery fees on their products             | Product page "توصيل مجاني"           |
| **Seller coupons / discounts** | Created by sellers in the dashboard, with expiry dates   | `apps/dashboard` coupons            |
| ~~FREEDEL~~              | **Avoid** — removed from the site                              | —                                   |
| ~~Free shipping over 500 EGP~~ | **Avoid** — threshold disabled                           | `packages/lib/src/shipping/shipping-rates.ts` |

## Appendix C — Source File Index

| Topic                        | File                                                   |
| ---------------------------- | ------------------------------------------------------ |
| Project overview             | `PROJECT_DESCRIPTION.md`                               |
| Brand colors                 | `packages/ui/src/styles/globals.css`                   |
| Arabic copy                  | `apps/ecommerce/messages/ar.json`                      |
| English copy                 | `apps/ecommerce/messages/en.json`                      |
| Fonts                        | `apps/ecommerce/app/[locale]/layout.tsx`               |
| Homepage structure           | `apps/ecommerce/app/[locale]/(main)/page.tsx`          |
| Sell page                    | `apps/ecommerce/app/[locale]/(main)/sell`              |
| Affiliate page               | `apps/ecommerce/app/[locale]/(main)/affiliate`         |
| Social links                 | `apps/ecommerce/lib/social-links.ts`                   |
| Contact email                | `apps/ecommerce/lib/contact.ts`                        |
| Payment methods              | `apps/ecommerce/lib/manual-payment-methods.ts`         |
| Site constants (delivery, returns, card flag) | `apps/ecommerce/lib/constants.ts`     |
| Shipping rates / free threshold | `packages/lib/src/shipping/shipping-rates.ts`       |
| Affiliate rules              | `packages/db/src/affiliates/constants.ts`              |
| Seller store link / domain   | `apps/dashboard/app/(main)/settings/store-link.client.tsx` |
| Seller storefront routing    | `apps/ecommerce/proxy.ts`                              |
| Organization schema          | `apps/ecommerce/lib/structured-data.ts`                |
| Welcome email                | `packages/emails/src/WelcomeEmail.tsx`                 |
| Database schema              | `packages/db/src/drizzle/schema.ts`                    |

---

_This document is for internal marketing and AI context. It is not a public brand guidelines PDF. Verify operational claims with the طلبي team before paid campaigns._
