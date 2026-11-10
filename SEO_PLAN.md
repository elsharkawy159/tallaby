# SEO_PLAN.md: tallaby.com (طلبي) SEO and page plan

**Written:** 2026-11-09 on `main` @ `8ca4dab0`. **Status:** mostly a plan. **Built 2026-11-10 (gated, not public):** Phase 3's compare data model v2 and pages for EasyOrders, Shopify, WooCommerce, ExpandCart, Salla and Zid, plus `/alternatives/easyorders` and `/alternatives/shopify` (§15 Phase 3). Everything else below is not built. Every "Build" below is a proposal for the owner to approve, and it follows `CLAUDE.md`, `docs/marketing-site-rules.md` and `ROADMAP.md` (seller features; tallaby.com SEO is F-53 and F-70e).

**Inputs:** the codebase audit (`docs/seo-research/01-audit.md`, re-checked in code for this plan), the global competitor file (12 platforms, `02-global-competitors.md`) and the MENA competitor file (10 platforms, `03-mena-competitors.md`), all researched 2026-11-09. Keyword research was run for this plan on 2026-11-09 (method and limits in §6.1).

**How to read the evidence marks:** **V** = verified on an official page on the date given · **T** = third-party source only · **U** = unverified (reason given) · **n/a (no tool data)** = we had no keyword tool, so there is no volume or difficulty number. Demand is always a qualitative estimate, labelled as one.

**Price rule for every page in this plan:** tallaby.com copy never contains a Tallaby or competitor price as a literal. It uses the tokens `{orderFee}`, `{pro}`, `{topUpMin}`, `{topUpMax}`, `{days}` and the competitor tokens in `COMPETITOR_PRICES` (rendered by `withPrices()` / `PRICE_TOKENS`: ≈ EGP in the server HTML, the visitor's currency on the client). Meta descriptions, FAQ data and JSON-LD use `getMarketingPriceVars(locale, { isolate: false })`, so they always show EGP. Literal numbers appear in this plan only as research facts.

---

## 1. Executive summary

### 1.1 The decisions

| # | Decision | Why (evidence) |
|---|---|---|
| D1 | **Fix the canonical host (S-01) before adding a single page.** Recommended: keep **`https://www.tallaby.com`** as primary. Set `NEXT_PUBLIC_SITE_URL` to it on the ecommerce Vercel project, and make apex → www a **308** instead of today's 307. | Today every canonical, hreflang, `og:url`, sitemap `<loc>` and the robots `Sitemap:` line point at the apex, which 307-redirects to www (audit §5). Vercel already serves www, and the search index already lists `www.tallaby.com` (DuckDuckGo, 2026-11-09). Choosing www means one env change and one redirect type, with no DNS move. |
| D2 | **One URL per page, two locales.** Arabic stays the unprefixed default (`/solutions/x`), English is `/en/solutions/x`, and slugs stay English in both. **The proposed `/ar/…` tree is rejected.** | `i18n/routing.ts`: `defaultLocale: "ar"`, `localePrefix: "as-needed"`. `/ar/*` already 307s to the unprefixed URL, and `hreflangMap()` pairs the same path in both locales. Arabic slugs would break that pairing and need rewrites (§8). |
| D3 | **Add hub pages** `/solutions`, `/industries`, `/features`, `/tools`, and later a gated `/alternatives`. | No `page.tsx` exists in those folders (checked). Breadcrumbs show a hub label with no link, and the BreadcrumbList skips it. There are 8 chip links to `?category=` filters that canonicalise to `/templates`. |
| D4 | **Generalise the three page templates before scaling them.** Solution pages pick their mock store by slug. Industry "needs" visuals grow from 4 to 9. Detail pages get an `image` shot and 5 new coded shots. | `SolutionPageView` always renders the clothing mock. `DetailShot` is only `"domain" \| "pixel"`. `IndustryNeedVisual` is only 4 values (`detail-pages.lib.ts`, `industries.lib.ts`). |
| D5 | **Compare and alternatives pages are fully planned and kept gated.** They publish only when the owner turns on `COMPARE_PUBLIC` (S-06) and each competitor has at least `MIN_VERIFIED_FACTS` official, sourced and dated facts. **Recommendation: approve S-06 for EasyOrders and Shopify first.** | The biggest open gap is "بديل ايزي اوردرز". Its SERP is weak (matgarko, sell1x, zabayny, landingpagee), and EasyOrders' own blog still quotes its old $0.02 / $50 prices. "بديل شوبيفاي في مصر" has 3 autocomplete variants, and Shopify Basic adds **2%** to every card order in Egypt because Shopify Payments isn't available there (V, shopify.com/pricing + help.shopify.com). |
| D6 | **Claim only what's live.** The "AI" pages claim AI product writing in Arabic and English (live). They don't claim that AI builds the store (F-82 is off in production behind `STORE_BUILDER_AI_ENABLED`). Digital products, TikTok and Snapchat pixels, landing-page funnels, deposits and international selling get no page. | ROADMAP F-82 status and §7 2026-11-09 ("stays off in production"), `registry.ts` (`tiktok_pixel`/`snapchat_pixel` are `"soon"`), `docs/marketing-site-rules.md`. |
| D7 | **Treat FAQPage JSON-LD as optional.** Google no longer shows FAQ rich results at all. The docs were deprecated on 2026-05-08 and removed on 2026-06-15 ([Search Central updates](https://developers.google.com/search/updates), [FAQPage doc](https://developers.google.com/search/docs/appearance/structured-data/faqpage)). Keep it only where the FAQ is visible on the page, and spend no effort chasing it. | Google Search Central, read 2026-11-09. BreadcrumbList rich results now show on desktop only (same updates page, 2025-01-22). |
| D8 | **Give each page its own OG image** (Arabic and English) instead of one `og-image.jpg` for all. | Audit §3. No `opengraph-image` route exists (checked). WhatsApp and Facebook shares are the main way Egyptian sellers pass links around. |
| D9 | **Build the money pages before the long tail.** The order is free store, Egypt, AI, COD and fake orders, Bosta and Paymob, then cost calculator, and only then industries. | Autocomplete: the "مجاني" and "في مصر" variants of "انشاء متجر الكتروني" lead, and "بالذكاء الاصطناعي" appears under every store query. Seller-intent industry queries ("انشاء متجر الكتروني للعطور" and similar) returned **no** suggestions, and the industry SERPs belong to shopper stores. |

### 1.2 The first 10 pages to build (after D1)

| Rank | Page | Primary keyword | Why first |
|---|---|---|---|
| 1 | `/solutions/free-online-store` | انشاء متجر الكتروني مجاني | The top autocomplete suggestion for both spellings, with 5 more variants. The pricing model fits exactly ($0 a month, per-order fee, orders from day one). No page owns it today, because home, pricing and templates all touch "free". |
| 2 | `/solutions/online-store-egypt` | انشاء متجر الكتروني في مصر | Suggestions 2–4. The SERP is Wuilt, EasyOrders, Shanta, Zid and Qumra plus agencies. Tallaby's real differentiators (Bosta, the seller's own Paymob/Kashier, governorate zones, COD) are all Egypt-specific. |
| 3 | `/features/ai-online-store` | انشاء متجر الكتروني بالذكاء الاصطناعي | Shows under every store query. The home title already says AI. The page must hold AI claims to what's live (product autofill, MCP products). |
| 4 | `/solutions/create-online-store` (retarget) | انشاء متجر الكتروني + خطوات / كيفية | It exists. Retarget it to the how-to and steps intent so it stops overlapping the home page (§7). |
| 5 | `/tools/store-cost-calculator` + blog `online-store-cost-egypt` | تكلفة انشاء متجر الكتروني في مصر | The first suggestion for "تكلفة…". Only agencies rank (geexar, egessia, elmatajer). Tallaby can answer with live price tokens. |
| 6 | `/features/fake-order-protection` | الطلبات الوهمية | A live feature (F-02) against a weak SERP (egyhosting, Facebook, Storeino). EasyOrders and Lightfunnels sell the same thing as core. |
| 7 | `/integrations/bosta` | ربط بوسطة / Bosta integration | Bosta officially integrates only with Shopify and WooCommerce (V). The "bosta shopify app/integration" suggestions show sellers search for exactly this pairing. |
| 8 | `/integrations/paymob` and `/integrations/kashier` | بوابة دفع كاشير / paymob integration | "بوابة دفع كاشير" is suggestion #2 for "بوابة دفع". The seller's own account with no share of sales contrasts with Shopify's 2%. |
| 9 | Hubs `/solutions`, `/features`, `/industries` | (structural) | Every new page needs a linked parent for crawl depth and a full BreadcrumbList. |
| 10 | `/alternatives/easyorders` and `/alternatives/shopify` (gated) | بديل ايزي اوردرز / بديل شوبيفاي في مصر | The biggest single opportunity, kept behind S-06. Build them with sourced data so publishing is a one-line flag change after approval. |

### 1.3 Effort at a glance

Five phases, about **39–47 dev-days** in total (§15). Phase 0 (host, templates, hubs, OG, data model) is the prerequisite: about 6–8 days. Phase 3 (compare and alternatives) waits on S-06.

---

## 2. Existing project and SEO audit (condensed, re-verified)

### 2.1 What exists (checked in code on 2026-11-09)

- **Routes** under `apps/ecommerce/app/[locale]/(marketing)/(site)/`: home, pricing, templates (+`[id]`), blog (+`[slug]`), faq, about, affiliates, careers, contact, terms, privacy, integrations (+`[slug]`), compare (+`[slug]`), and `features/[slug]`, `industries/[slug]`, `solutions/[slug]`, `tools/[slug]` **with no hub `page.tsx`**. `follow-us/` sits outside `(site)`, so it has no header, footer or Organization schema.
- **One page per content type:** `SOLUTIONS = [create-online-store]`, `INDUSTRIES = [clothing-store]`, `FEATURE_PAGES = [custom-domain]`, `INTEGRATION_PAGES = [meta-pixel]`, `TOOL_SLUGS = [profit-margin-calculator]`. Compare has 4 competitors, all hidden (`COMPARE_PUBLIC = false`, so `compareRobots()` returns noindex,nofollow).
- **Adding a page** means one entry in a `*.lib.ts` array plus a message block in each locale. The sitemap (`contentPagePaths()`), the footer "Solutions" column (`footerSolutionLinks()`, first 3 of each list), static params and the guard tests pick it up automatically (`content-messages.test.ts`, `content-pages.test.tsx`, `content-routes.lib.test.ts`, `seo.lib.test.ts`, `locale-landing.lib.test.ts`, `sitemap.lib.test.ts`).
- **Metadata** comes from `pageMetadata()` (canonical, hreflang ar/en/x-default→ar, OG, Twitter `@usetallaby`). The title template is `"%s | طلبي"` / `"%s | Tallaby"`. The guard test allows **62 characters including the suffix**, so the bare title can be at most **55 characters in Arabic and 52 in English**. Descriptions must be 50–165 characters. Compare keys are exempt.
- **Structured data:** Organization + WebSite on every `(site)` page; SoftwareApplication (EGP offers at the live rate) on `/` and `/pricing`; BreadcrumbList through `PageTrail`; FAQPage through `FaqBlock`; BlogPosting; ItemList on `/integrations`; WebApplication on the margin tool.
- **English landing redirect** (`681dca34`): non-Arabic browsers landing on an Arabic page get a 307 to `/en…`. Bots never do. **Every new top-level segment must be added to `MARKETING_SEGMENTS`** (a test checks it against the folders).
- **Prices:** tokens only (above). The blog calculator uses the live fee (`28e4dd08`). The FAQ, about, blog and pricing pages use the F-84 grace rule (`8ca4dab0`).

### 2.2 Issues, ranked

| Rank | Issue | Impact | Fix (where) |
|---|---|---|---|
| 1 | **S-01:** canonicals, hreflang, sitemap and robots point at the apex, which 307s to www. | Every signal points at a redirect, which splits and delays indexing of new pages. | D1: env plus a 308. Then confirm `SITE_URL` and `SITEMAP_BASE_URL` both resolve to the same host (`lib/marketing/site.lib.ts`, `lib/constants.ts`). |
| 2 | **No hubs** for solutions, industries, features or tools. | Shallow link graph, broken breadcrumb level, orphan risk as pages grow. | §8, §9 (hub template = `HubPageFrame` + `HubListing`, already used by `/integrations`). |
| 3 | **Single-purpose templates** (clothing mock, 2 detail shots, 4 industry visuals). | New pages would be visually wrong, for example a perfume page showing the clothing store. | §9.0 generalisation spec. |
| 4 | **Marketing copy describes F-84 before F-84 is deployed.** ROADMAP F-84: "Built, not deployed", and `0159` is not applied anywhere. Commit `8ca4dab0` already says "orders from day one". | If the copy ships before the F-84 code, the site would contradict the product (orders hidden after a missed top-up). | Ship together: deploy F-84 and apply `0159`, then deploy marketing. Note that `docs/marketing-site-rules.md` line 42 still states the old rule ("a first $5 top-up before seeing orders") and needs an owner-approved update. |
| 5 | **One OG image** for every page and both locales. | Weak shares on WhatsApp and Facebook, no Arabic preview. | §11.3. |
| 6 | **Stale or odd URLs in the index:** a DuckDuckGo search for "tallaby.com متجر" (2026-11-09) returned old marketplace titles ("Sell on Tallaby \| Open your store across Egypt", "عن Tallaby \| متجرك الشامل في مصر", "جميع المنتجات \| تسوق أونلاين في مصر") and store subdomains that look like tests (`testy.tallaby.com`, `tallabya.tallaby.com`). | Brand SERP noise, and possibly thin test stores indexed. | Check that those paths return the new pages or noindex (the old marketplace pages already send `X-Robots-Tag: noindex, follow`). Check that test stores are offline or noindex (`isStorefrontOffline`). Request removals in Search Console after S-01. |
| 7 | **Sitemap date trap:** `STATIC_PATHS = Object.keys(STATIC_PAGE_LASTMOD)`. Adding a content path there to give it its own date would list it **twice** (once there, once from `contentPagePaths()`). | Duplicate sitemap rows. | §12: a separate `CONTENT_PAGE_LASTMOD` map. |
| 8 | **Thin pages in the sitemap:** `/follow-us` (no header or footer) and about 238 near-identical template URLs with no lastmod. | Crawl budget spent on low-value URLs, and a thin-content signal. | §12.4. |
| 9 | **Brand ambiguity:** "طلبي" autocompletes to طلبية, طلبات and طلبيه جمله (03 research). | Arabic brand searches are unreliable. | Pair the names everywhere ("طلبي Tallaby"). Organization `alternateName` is already set. |
| 10 | **Raw hex values** in many components instead of tokens. | Visual drift as pages multiply. | §10: new code uses tokens only. |

---

## 3. Competitor research with sources

All 22 competitors, each condensed from `02-global-competitors.md` (G) and `03-mena-competitors.md` (M). Every fact was checked 2026-11-09 unless marked otherwise. **Every source URL from both research files is kept in Appendix A**, grouped by competitor. The tables cite the main source for each row.

**Shared facts that shape the Egyptian market** (V, 2026-11-09): Stripe doesn't support Egypt ([stripe.com/global](https://stripe.com/global)). Neither does Shopify Payments ([help.shopify.com](https://help.shopify.com/en/manual/payments/shopify-payments/supported-countries)), WooPayments ([woocommerce.com](https://woocommerce.com/document/woopayments/compatibility/countries/)), Squarespace Payments ([squarespace.com/payments](https://www.squarespace.com/payments)), Square ([developer.squareup.com](https://developer.squareup.com/docs/international-development/payments)) or Wix Payments (Egypt gets PayPal, Kashier, Paymentwall and Skrill: [support.wix.com](https://support.wix.com/en/article/available-payment-providers-in-your-country)). Bosta officially integrates only with Shopify, WooCommerce and its API ([bosta.freshdesk.com](https://bosta.freshdesk.com/en/support/solutions/articles/36000414774-bosta-integrations)).

### 3.1 MENA platforms (10)

#### EasyOrders (ايزي اوردرز): easyorders.eg (Egypt-first; also .ai, ma., dz.)
| Field | Fact | Mark · source (2026-11-09) |
|---|---|---|
| Pricing | Regular **$0.04 per order**, no monthly fee. Professional **$100 a month**. USD. | V · [pricing.md](https://www.easyorders.eg/pricing.md), [llms.txt](https://www.easyorders.eg/llms.txt) |
| Fees | $0.04 per order on Regular; none on Pro. Whether fake or cancelled orders are charged: U. Their blog still quotes $0.02 / $50 (2023 prices). | V / U · [create-ecommerce-store-with-ai.md](https://www.easyorders.eg/create-ecommerce-store-with-ai.md) |
| Free plan | No subscription, but a **$5 wallet top-up** is needed to activate. Per the 2023 post, orders arrive but stay hidden until a top-up. | V |
| Limits | Unlimited products, orders and visits | V · [index.md](https://www.easyorders.eg/index.md) |
| Builder | Drag and drop, "+100 ثيم", ready landing pages and funnels | V · [themes.md](https://www.easyorders.eg/themes.md) |
| AI | Easy AI: product copy, landing page from one line, page review, behaviour analysis, image design, "شاطر" chatbot. Credit limits: U. | V |
| Payments | "+15 بوابات دفع". Paymob, Fawry and PayTabs are named only in their blog. Kashier, InstaPay and valU: U. | V / V-blog / U |
| Shipping | "+100 شركة شحن". Bosta is named in their blog. A third party (eGrow) implies middleware for some carriers. | V / T |
| COD | Yes, with a fake-order blocker | V |
| SEO | Not described. Google Shopping and Meta catalog feeds. | U / V |
| Analytics | AI customer-behaviour analysis. Per-product stats were still on their roadmap (ROADMAP §2.4). | V |
| Marketing | Downsell, cross-sell, Conversion API, cloaking, free campaign support, seller app, academy | V |
| Support / languages | Arabic 24h by phone, chat and video. Site in ar, en and fr. | V |
| Markets | Egypt, Morocco, Algeria, global. Claims 200,000+ stores. | V (claim) |
| Pros for an Egyptian seller | Low entry cost, built for COD, 100+ themes, AI, Arabic support | |
| Cons | USD pricing that doubled since 2023, no domain included, FAQ contradicts itself on lapsed payments, carrier and gateway names not on product pages | |

#### ExpandCart (اكسباند كارت): expandcart.com
| Field | Fact | Mark · source |
|---|---|---|
| Pricing | Standard **599 جنيه/mo** (5,999/yr); Professional 1,199/mo; Ultimate 4,599/mo; Business on request. EGP. | V · [الاسعار](https://expandcart.com/ar/الاسعار/), [pricing-2](https://expandcart.com/en/pricing-2/) |
| Fees | 0% sales commission on all plans | V |
| Free plan | Trial of 14 or 15 days (the pages disagree). A "free plan" is mentioned in the FAQ but not offered. No refunds. | V / U |
| Limits | Products 100 / 1,000 / unlimited. Users 1 / 3 / 10. Coupons 5 on Standard. | V |
| Builder | 1 template on Standard, all on Ultimate. "50+" or "100+" templates (pages disagree). | V |
| AI | None advertised (an old 2021 ExpandBot page) | U |
| Payments | FAQ: 2checkout, PayPal, PayTabs, CashU, Fawaterak. Paymob and Fawry logos on a 2021 Egypt page. | V (dated) · [ultimate-plan-eg](https://expandcart.com/ar/ultimate-plan-eg/) |
| Shipping | Bosta, Aramex, Mylerz, R2S and SMSA logos (2021) | V (dated) |
| COD | Not stated in text | U |
| SEO | SEO settings and friendly URLs; SEO apps from Professional | V |
| Analytics | Basic reports on Standard; GA and export from Professional | V |
| Marketing | Coupons, loyalty (Ultimate), **abandoned carts on Ultimate only**, WhatsApp on Business, POS, dropshipping apps | V |
| Support / languages | Chat, tickets, phone; ar and en | V |
| Markets | Arab region; EGP pricing and an Egypt page | V |
| Pros | EGP prices, 0% commission, mature feature set | |
| Cons | 599 جنيه for 100 products and 1 template; inconsistent pages; latest blog post 2024 | |

#### Wuilt (ويلت): wuilt.com
| Field | Fact | Mark · source |
|---|---|---|
| Pricing | **Online store free in Egypt** ("مجاناً ١٠٠٪ مدى الحياه"). Website plans from EGP 1,250 / $50 a year. | V · [pricing](https://wuilt.com/pricing), [faqs](https://wuilt.com/faqs) |
| Fees | No sales commission. Wuilt Pay rates: U. COD 1% above EGP 3,000: U (the source page is a 404). | V / U |
| Free plan | Yes (store, Egypt) | V |
| Limits | No published caps | V |
| Builder | Section-based, **not drag and drop** (their own words) | V · [en/home](https://wuilt.com/en/home) |
| AI | None advertised | V (absent) |
| Payments | Wuilt Pay (press); named gateways U | T / U |
| Shipping | Wuilt Shipments: Aramex, Mylerz, Bosta; COD into a Wuilt Wallet | V · [shipments](https://wuilt.com/shipments) |
| COD | Yes, through Wuilt Shipments | V |
| SEO | Meta fields, XML sitemap | V |
| Analytics | GA, GTM, Pixel | V |
| Marketing | Chat widgets, reviews, bundles, App Center; abandoned cart U | V / U |
| Support / languages | Phone, chat, video; ar default, en, fr, tr | V |
| Markets | Egypt; UAE and GCC planned (press) | V / T |
| Pros | Free store, built-in Egyptian carriers, Arabic-first | |
| Cons | Earns on unpublished shipping and wallet fees, no AI, fewer COD tools, inconsistent pricing pages | |

#### Salla (سلة): salla.com
| Field | Fact | Mark · source |
|---|---|---|
| Pricing | Basic free; Plus SAR 990/yr; Pro SAR 2,990/yr; Special custom. Monthly price derived (≈ SAR 99/299). | V / U · [plans](https://salla.com/en-sa/plans) |
| Fees | No platform fee shown; Salla Payments rates not public | U |
| Free plan | Yes, Basic, with COD and bank transfer. Online payments on paid plans only. | V |
| Limits | Unlimited products and orders | V |
| Builder | Theme library, CSS/JS on Pro, Twilight themes, App Maker | V |
| AI | Fraud engine, prompt library, ChatGPT/Claude connection help, SEO-GEO checker; no AI builder | V · [tools](https://salla.com/tools) |
| Payments | mada, cards, Apple Pay, Tabby, Tamara, STC Pay, PayPal; **no Egyptian gateway found** | V / U |
| Shipping | 307+ partners (Gulf); **no Egyptian carrier found** | V / U |
| COD | Yes, including Basic | V |
| SEO | Built-in SEO, GMC, GTM | V |
| Analytics | Dashboards, GA, Hotjar | V |
| Marketing | Very broad (abandoned carts, loyalty, affiliates, WhatsApp inbox, CAPI) | V · [marketing](https://salla.com/marketing) |
| Support / languages | 24/7 ar and en chat and email | V |
| Markets | KSA, UAE, Kuwait, Qatar, Bahrain, Oman. **Egyptian sellers effectively blocked:** verification needs a Saudi CR. | V · [help.salla.sa](https://help.salla.sa/article/أسئلة-شائعة-حول-توثيق-المتجر-1/zbcnt9hu9kf8lfh2gmf1vccr) |
| Pros | Real free plan, mature ecosystem | |
| Cons | Not usable for selling from Egypt; Gulf gateways and carriers only | |

#### Zid (زد): zid.sa / **zid.eg**
| Field | Fact | Mark · source |
|---|---|---|
| Pricing | Starter free forever. **Egypt: Rise 1,128.60 جنيه/mo, Growth 3,408.60 جنيه/mo** (SAR × 11.4). KSA: SAR 99 / 299. | V · [zid.eg pricing](https://zid.eg/ar/pricing/), [zid.sa pricing](https://zid.sa/ar/pricing/) |
| Fees | No commission on paid plans; free plan U. Zid Pay (KSA and Kuwait only) mada 1% + 1 SAR, cards 2.2–2.4%. | V / U |
| Free plan | Yes | V |
| Limits | Unlimited; team 1 / 5 / 20 | V |
| Builder | Themes, Theme SDK, "+50 ثيم" (zid.eg), 400+ apps | V |
| AI | Zid Voice (AI calls for abandoned carts, limited beta); Zid Insights (AI U) | V · [zid-voice](https://zid.sa/ar/solutions/zid-voice/) |
| Payments | Paymob, valU, Sympl logos on zid.eg (terms U) | V (logos) |
| Shipping | Bosta, Aramex, FedEx, Sprint, Mylerz, Khazenly, Sideup logos (the Egypt shipping page is the Saudi copy) | V (logos) / U |
| COD | Yes, on the free plan | V |
| SEO | Product and category SEO fields | V |
| Analytics | Reports, COD report; GA U | V / U |
| Marketing | Loyalty, BOGO, affiliates, SMS, Amazon/Trendyol, POS | V |
| Support / languages | 24/7 (zid.eg); ar, en | V |
| Markets | KSA plus 6 countries, **Egypt via zid.eg** (entered through Zammit, T) | V / T |
| Pros | Free plan, Egyptian partner logos, big feature set | |
| Cons | Expensive paid plans in Egypt, copied Saudi pages, Saudi dialect, Egyptian KYC not published | |

#### YouCan: youcan.shop (Morocco)
| Field | Fact | Mark · source |
|---|---|---|
| Pricing | Subscriptions $29–$229/mo, or Pay as you go | V · [pricing](https://youcan.shop/en/pricing) |
| Fees | PAYG: COD 0.5% then 0.25%, online 1% then 0.5%, **billed once sales pass $5,000, including the first $5,000**. Subscriptions 0%. | V |
| Free plan | PAYG $0/mo, $2 activation credit | V |
| Limits | Unlimited products; order and sales caps by plan; 1 store (5 on Unlimited) | V |
| Builder | 9 free themes, visual editor, full code access (Liquid), landing pages | V · [themes](https://youcan.shop/en/themes) |
| AI | Mochi assistant (Arabic, Darija, voice), AI images, MCP, all plans; quotas U | V · [mcp](https://youcan.shop/en/mcp) |
| Payments | YouCan Pay (Moroccan), Stripe, PayPal, custom; **no Egyptian gateway** | V (absent) |
| Shipping | Zones; YouCan Ship is Morocco-only; **no Egyptian carrier** | V (absent) |
| COD | Built in, plus a confirmation app | V |
| SEO | "SEO tools" (details U) | U |
| Analytics | Sales, traffic, checkout drop-off | V · [analytics](https://youcan.shop/en/analytics) |
| Marketing | Pixels plus server events, upsells, bundles, abandoned-checkout emails | V |
| Support / languages | Tickets 24/7, VIP on Premium; ar, en, fr | V |
| Markets | Morocco, Gulf, France, US; about 54 Egyptian stores (T, StoreLeads) | V / T |
| Pros | $0 start, strong COD and AI | |
| Cons | USD, no Egyptian payments or carriers, Morocco-focused content | |

#### Lightfunnels: lightfunnels.com (UK company, funnel-first)
| Field | Fact | Mark · source |
|---|---|---|
| Pricing | Newbie $9.99, Standard $49.99, COD $99.99/mo. **Egypt page: 519.99 / 2,599.99 / 5,199.99 جنيه.** | V · [pricing](https://www.lightfunnels.com/pricing), [egpricing](https://www.lightfunnels.com/egpricing) |
| Fees | Newbie 1.5% online + 0.20% COD; Standard 0.5% / 0.10%; COD plan 0.5% / 0% | V |
| Free plan | None; 30-day trial with no card | V |
| Limits | Unlimited products; leads 1k or 5k a month | V |
| Builder | Funnel, store and page builders; 97 template URLs | V |
| AI | AI funnel builder, AI product copy, "AI-Generated Reviews" | V |
| Payments | **Kashier, Fawaterk, Taager** (Egypt); no Paymob, Fawry or InstaPay | V · [docs sitemap](https://docs.lightfunnels.com/sitemap-0.xml) |
| Shipping | Zones; **no carrier integration** (manual or CSV) | V (absent) |
| COD | Built in, with anti-fake layers | V · [cod](https://www.lightfunnels.com/cod) |
| SEO | Not documented | U |
| Analytics | Real-time reports, attribution | V |
| Marketing | CAPIs, upsells, bumps, A/B tests | V |
| Support / languages | Chat and email; help centre in English; Arabic admin U | V / U |
| Markets | Global COD and dropshipping | V |
| Pros | Egyptian gateways, EGP list, strong funnels | |
| Cons | No free plan, % fees, no Egyptian carriers, English help, fake-review AI risk | |

#### Qumra (قُمرة): qumra.cloud (Egypt)
| Field | Fact | Mark · source |
|---|---|---|
| Pricing | Starter **199 جنيه/mo**, Growth 699, Business 1,499 (quarterly and yearly discounts) | V (plan API) · [qumra.cloud](https://qumra.cloud) |
| Fees | "بدون عمولة" (vendor claim) | V-claim |
| Free plan | None; trial claimed, length U | V / U |
| Limits | Promo says unlimited, **API says Starter productCount 10** | U (conflict) |
| Builder | Theme store, landing pages; no theme count | V |
| AI | "شهاب" assistant from Growth | V |
| Payments | Paymob, PayTabs (+Stripe, PayPal); wallets and InstaPay through Paymob | V |
| Shipping | Bosta, Mylerz, Aramex | V |
| COD | Yes (vendor blog) | V-blog |
| SEO | Not listed | U |
| Analytics | Smart reports | V |
| Marketing | Coupons, abandoned carts on Starter; WhatsApp from Growth | V |
| Support / languages | 24/7 WhatsApp; ar, en | V |
| Markets | Egypt; no CR needed for individuals | V |
| Pros | Lowest EGP subscription seen | |
| Cons | Custom domain, AI and POS need 699 جنيه; branding removal at 1,499; unclear product limit | |

#### Shanta (شنطة): shantaweb.com (Egypt)
| Field | Fact | Mark · source |
|---|---|---|
| Pricing | Launch **550 جنيه/mo** (5,500/yr), Pro 1,500/mo (15,000/yr) | V · [pricing](https://shantaweb.com/ar/pricing) |
| Fees | No commission | V |
| Free plan | None (14-day trial); their blog claims "100% free" | V (conflict noted) |
| Limits | Unlimited products and orders; team size conflicts | V / U |
| Builder | Block editor, landing pages, custom CSS/JS | V |
| AI | None seen | V (absent) |
| Payments | Kashier, Paymob, Vodafone Cash, Orange, WE Pay, e&, valU, Al Ahly instalments | V |
| Shipping | Bosta and Mylerz (no contract needed); Aramex and Egypt Post "soon" | V |
| COD | Yes, with confirmation through Vrobo | V |
| SEO | **Pro only** | V |
| Analytics | Basic and advanced reports, GA, GTM | V |
| Marketing | Abandoned carts, upsell, email and SMS on Pro only | V |
| Support / languages | Phone, WhatsApp; Arabic help centre | V |
| Markets | Egypt | V |
| Pros | Widest list of Egyptian wallets | |
| Cons | 550 جنيه entry, key tools locked to Pro, no AI | |

#### HalaOrders (هلا أوردرز): halaorders.com (Egypt)
| Field | Fact | Mark · source |
|---|---|---|
| Pricing | Pay per order **0.5% + 1.5 جنيه**, or 750 جنيه/mo, or 6,000 جنيه/yr | V · [pricing](https://halaorders.com/pricing) |
| Fees | As above; 0 on subscriptions | V |
| Free plan | None; PAYG has no upfront cost | V |
| Limits | Unlimited, every feature on every plan | V |
| Builder | 6 themes with dark mode; landing pages with A/B tests | V |
| AI | Prompt templates for external ChatGPT/Gemini/Claude, llms.txt, WebMCP | V |
| Payments | Paymob, InstaPay, Vodafone Cash, bank transfer, deposits | V |
| Shipping | **Sky Express only** | V |
| COD | Yes | V |
| SEO | Sitemap, product structured data, GMC feed | V |
| Analytics | Revenue, AOV, cities; GA4, GTM, Clarity | V |
| Marketing | Coupons, quantity offers, Meta/TikTok/Snap pixels, Telegram alerts; no abandoned carts seen | V / U |
| Support / languages | WhatsApp, phone; ar, en | V |
| Markets | Egypt | V |
| Pros | No subscription needed, flat features | |
| Cons | The fee grows with order value; 1 carrier; 6 themes | |
| **SEO note** | The most SEO-mature competitor: 15 `/integrations/<name>` pages, 11 `/solutions/<niche>` pages, a "best platforms in Egypt" list of 11 platforms **without Tallaby**, and free tools. | V |

### 3.2 Global platforms (12)

#### Shopify
| Field | Fact | Mark · source |
|---|---|---|
| Pricing (seen from Egypt) | Basic **$19 annual / $27 monthly**, Grow $54 / $72, Advanced $299 / $399, Plus from $2,300. USD, no EGP. | V · [shopify.com/eg/pricing](https://www.shopify.com/eg/pricing) |
| Fees | **Third-party gateway fee: 2% Basic, 1% Grow, 0.6% Advanced.** This always applies in Egypt (no Shopify Payments). 0% on COD. | V · [pricing](https://www.shopify.com/pricing), [manual payments](https://help.shopify.com/en/manual/payments/manual-payments) |
| Free plan | No; 3 days free, then $1/mo for 3 months | V |
| Limits | Unlimited products; staff by plan | V |
| Builder | Section-based theme editor; 24 free and 1,342 paid themes | V / T · [themes](https://themes.shopify.com/themes?price%5B%5D=free) |
| AI | Sidekick (design, photos, copy, support, marketing) | V · [magic](https://www.shopify.com/magic) |
| Payments (Egypt) | Paymob, Kashier (app rated 3.0★ from 2 reviews), Geidea | V |
| Shipping (Egypt) | Bosta app 3.9★ from 24 reviews; Aramex app 1.4★ | V · [bosta app](https://apps.shopify.com/bosta-shipping-app) |
| COD | Yes, as a manual method | V |
| SEO / analytics / marketing | Not re-checked | U |
| Support / languages | Arabic admin (V); RTL on Horizon themes (V); support U | V / U |
| Markets | Global; Egyptian Arabic site | V |
| Pros | Ecosystem, Arabic admin, Paymob and Bosta exist | |
| Cons | **2% on every card order in Egypt**, USD billing on a foreign card, thin local apps, COD confirmation and zones need apps | |

#### WooCommerce
| Field | Fact | Mark · source |
|---|---|---|
| Pricing | Software free; hosting $25–$350/mo (Woo's estimate); extensions $29–$299/yr | V · [pricing](https://woocommerce.com/pricing/) |
| Fees | 0% platform fee; WooPayments not in Egypt | V |
| Free plan | Software free | V |
| Limits | Hosting-bound | V |
| Builder | Block editor and themes | V / U |
| AI | No first-party AI | V (none found) |
| Payments | Paymob official plugin (5,000+ installs), Geidea, Kashier | V · [wordpress.org](https://wordpress.org/plugins/paymob-for-woocommerce/) |
| Shipping | Bosta WooCommerce plugin (reviews report Arabic address-mapping issues) | V |
| COD | In core | V |
| SEO / analytics / marketing | Through plugins | U |
| Support / languages | Docs and forums; Arabic through WordPress | V / U |
| Markets | Global; T: 47.2% share of detected Egyptian store sites ([wmtips](https://www.wmtips.com/technologies/e-commerce/country/eg/)) | T |
| Pros | $0 licence, best Egyptian plugin coverage | |
| Cons | Hosting, security and upkeep are the seller's job; paid plugins | |

#### Wix
| Field | Fact | Mark · source |
|---|---|---|
| Pricing | Core about $29 is the first plan that sells; Egyptian price U | V / U · [plans](https://www.wix.com/plans) |
| Fees | Provider fee only (Kashier 2.85% + EGP 3) | V |
| Free plan | Yes, but it can't take payments | V |
| Limits | 50,000 products | V |
| Builder | Free-form drag and drop; Harmony / Aria AI | V / T |
| AI | Harmony, Astro, store AI tools | V / T |
| Payments | Kashier, PayPal, Paymentwall, Skrill | V |
| Shipping | No Bosta or Aramex | V |
| COD | Manual, marked paid by hand | V |
| SEO / analytics / marketing | Broad | V |
| Support / languages | **No Arabic dashboard** (V); RTL partial and manual (V) | V · [languages](https://support.wix.com/en/article/languages-available-in-wix) |
| Markets | Global | |
| Pros / cons | Flexible editor, AI / no Arabic admin, no Paymob or Bosta | |

#### BigCommerce, Squarespace, Adobe Commerce / Magento, PrestaShop, OpenCart, Ecwid, Webflow, Shopware, Square Online

These matter for the "best platforms" article (B1) and the Shopify alternatives page (A2), not as their own pages. No Egyptian demand was seen for them.

| Platform | Pricing | Fees | Free / trial | COD | Arabic admin / RTL | Egypt payments | Egypt shipping | AI | Verdict for an Egyptian seller | Main source (V unless noted) |
|---|---|---|---|---|---|---|---|---|---|---|
| BigCommerce | Core $29 / $39 | 2% open provider on Core | 15-day trial | Yes (snippet) | U | Fawry via Checkout.com only | None | BigAI Copywriter, English only | Weak fit | [pricing](https://www.bigcommerce.com/essentials/pricing/) |
| Squarespace | Basic $12 / $19 from Egypt | 2% on Basic | 14-day trial | **No** (T) | **No** Arabic, **no** RTL | PayPal only | None | Blueprint AI | Doesn't work for Egypt | [pricing](https://www.squarespace.com/pricing) |
| Adobe Commerce / Magento OS | Quote (T: $22K+/yr); OS free (T) | 0% | OS free | Yes, core | Community pack (T) | Paymob, Geidea, Kashier modules | None | Brand Concierge (T/V blog) | Enterprise only | [payment methods](https://experienceleague.adobe.com/en/docs/commerce-admin/config/sales/payment-methods/payment-methods) |
| PrestaShop | Hosted €24 / €29 | 0% | Classic free; 14-day trial | Official module | Native RTL | Paymob, Kashier, Geidea | None | None (U) | Needs a developer | [offers](https://prestashop.com/prestashop-offers/) |
| OpenCart | Free; hosting from ~$3 (T) | 0% | Free | Core | Community packs (T) | Paymob, Geidea, Kashier | None | None | Needs a developer | [GitHub](https://github.com/opencart/opencart/releases) |
| Ecwid | Starter $5 (10 products) | 0% | None listed | U | U | Paymob claims support (T/U) | None | AI copy, section builder | Cheap but unconfirmed for Egypt | [pricing](https://www.ecwid.com/pricing) |
| Webflow | Standard $29 | 2% + Stripe/PayPal | No ecommerce on Starter | **No** | English UI (U) | None | None | Webflow AI, MCP | Not suitable | [pricing](https://webflow.com/pricing) |
| Shopware | Rise from €600; CE free | GMV-based | CE free | Yes | **No** Arabic pack, no RTL | None | None | Copilot add-on | Not suitable | [pricing](https://www.shopware.com/en/pricing/) |
| Square Online | Plus $49 | 3.3% + 30¢ (Free) | US only | No (T) | No (U) | **Not available in Egypt** | None | U | Not available | [plans](https://squareup.com/us/en/online-store/plans) |

### 3.2b Refresh for the compare pages (2026-11-10)

All six compare competitors were re-read on official pages on 2026-11-10; raw notes with quotes and every URL are in `docs/seo-research/04-compare-2026-11-10.md`, and each shown fact is in `compare.lib.ts` with its URL and date. What changed or got settled since the 2026-11-09 tables above:

| Competitor | Refreshed facts (V unless noted) |
|---|---|
| EasyOrders | Still **$0.04 per order** (Regular) and **$100 a month** (Professional), plus a **$5 top-up to activate** ([pricing.md](https://www.easyorders.eg/pricing.md), [AI page](https://www.easyorders.eg/create-ecommerce-store-with-ai.md)). Charging for cancelled, fake or returned orders: **still U** (no terms, FAQ or help page; all 404). Its public roadmap ([roadmap.easyorders.ai](https://roadmap.easyorders.ai/ar)) lists a two-language storefront, abandoned-cart reminders, Fawry and Excel export as **merchant requests, not built**, so Fawry is not credited despite its blog. Kashier and Paymob guides and "Bosta connects" are blog-only (V-blog). |
| Shopify | Monthly billing from Egypt: Basic **$27**, Grow **$72**, Advanced **$399** ([eg/pricing](https://www.shopify.com/eg/pricing)); the yearly prices differed by location (**$24/$65/$359** from an Egyptian IP vs $19/$54/$299), so pages quote monthly only. Third-party fee **2% on Basic** still applies to every card order in Egypt. New: an AI store generator ([website/builder](https://www.shopify.com/website/builder)), 10,000 free emails a month, Kashier app 3.0★ (2 reviews), Bosta app 3.9★ (24 reviews). Paymob's Shopify apps appear only in Paymob's docs (V-dev). |
| WooCommerce | Sources filled: free plugin, Woo's own estimates **hosting $25–$350/month, extensions $29–$299/year** ([pricing](https://woocommerce.com/pricing/)); WooPayments not in Egypt; official Paymob plugin with installments; Bosta plugin 2.4★ from 8 ratings; Egypt's governorates built into shipping zones; AI product tool in public beta (Woo developer blog). |
| ExpandCart | Unchanged prices: Standard **599 جنيه/mo**, Professional 1,199, Ultimate **4,599** ([الاسعار](https://expandcart.com/ar/الاسعار/)); pricing pages last modified 2023-12-11; help centre fails TLS. Trial 14 vs 15 days (pages disagree). COD, AI and fake-order tools: U. |
| Salla | Monthly prices now confirmed: Plus **SAR 99**, Pro **SAR 299** ([help.salla.sa](https://help.salla.sa/article/أسعار-باقات-سلة-على-أجهزة-الهاتف/c4t9zj8cnotfaa1a2opd8n0f)). Its plans FAQ says it serves **KSA and the UAE**; a store needs a Saudi CR or freelance document, a Saudi mobile and a Saudi bank account ([plans](https://salla.com/plans)). |
| Zid | Egypt: Rise **1,128.60 جنيه/mo**, Growth **3,408.60 جنيه/mo** ([zid.eg pricing](https://zid.eg/ar/pricing/)); online card payments start on Rise. Drag and drop confirmed; new "ذكاء زد" AI assistant (beta) and an AI section generator ([help.zid.sa](https://help.zid.sa/ar/getting-started/ai-assistant)). Egyptian partners are logos only. |

### 3.3 What the research means for Tallaby's pages

1. **The Egyptian set (EasyOrders, Wuilt, Qumra, Shanta, HalaOrders, ExpandCart, Zid via zid.eg) is the real competition.** Global platforms appear only on Shopify and WooCommerce pages.
2. **Tallaby's provable edges** (to verify in code before each claim): no monthly fee on Free; orders from day one with a {days}-day grace (F-84, deploy first); the seller's own Paymob and Kashier with no share of sales; Bosta waybills from the dashboard; governorate zones with free-over; fake-order protection; AI product copy in two languages on every plan (100 credits on Free); 119 templates; email campaigns included (500 a month on Free); up to 3 stores on Free.
3. **Tallaby's weak spots, said plainly on compare pages:** no landing-page funnels (F-08 delayed), no installments, no deposits, TikTok and Snapchat pixels "soon", the AI store builder not live, prices set in USD (shown ≈ EGP), an activation top-up needed after the grace window, and Mylerz, Aramex and J&T not live.
4. **Who already publishes comparisons:** EasyOrders ("X أم ايزي اوردرز", 6 posts), Zid (switcher pages in the main nav), HalaOrders (11-platform list), Qumra ("قمرة ولا شوبيفاي") and ExpandCart (vs Shopify, 2019/2022). **Nobody has an honest "بديل ايزي اوردرز" page**, and the EasyOrders posts quote out-of-date prices.

---

## 4. Competitor comparison matrix and data model (for `compare.lib.ts` v2)

### 4.1 Matrix (summary values; full detail and sources in §3)

`y` = yes · `n` = no · `p` = partly · `?` = unverified (the row is **not shown** for that competitor). "Tallaby" values come from code. Each one carries its code reference, so a reviewer can re-check it.

| Row id (new ones marked ★) | Tallaby (code ref) | EasyOrders | Shopify | WooCommerce | Wuilt | Zid (eg) | ExpandCart | YouCan | Lightfunnels | Qumra | Shanta | HalaOrders | Salla | Wix |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| freePlan | y (plans/index.ts) | p ($5 top-up) | n | p | y | y | n | p (PAYG) | n | n | n | p (PAYG) | y | p (can't sell) |
| monthly | y (`PRO_MONTHLY_USD_CENTS`) | y | y | n | n (store) | y | y | y | y | y | y | y | y | y |
| ★orderFee | y `{orderFee}` | y | n (but % fee) | n | n | n | n | p (%) | p (%) | n | n | y | n | n |
| salesShare (no % of sales) | y | y | p (2% third-party) | y | y | y (paid) | y | p (PAYG %) | n (%) | y | y | p (0.5%) | ? | y |
| ★activation | p (first top-up within {days} days or at the first order; F-84) | p ($5 to activate) | n/a | n/a | n | n | n | p ($2) | n | n | n | n | n | n |
| limits | y (3 stores) | y | y | y | y | y | p (100 products) | p (order caps) | p (lead caps) | ? (conflict) | y | y | y | y |
| noCode | y | y | y | p | y | y | y | y | y | y | y | y | y | y |
| ★dragDrop | y (element trees) | y | n (sections) | p | n (sections) | ? | ? | p | y | ? | p (blocks) | p (landing only) | ? | y |
| templates | y (119) | y (100+) | y | y | ? | y (50+) | p | p (9) | y | ? | ? | p (6) | y | y |
| bilingual | y | y | y | p | y | y | y | y | ? | y | ? | y | y | p |
| ★arabicAdmin | y | y | y | p | y | y | p | ? | ? | y | y | y | y | **n** |
| cod | y | y | y | y | y | y | ? | y | y | y | y | y | y | p (manual) |
| ★fakeOrders | y (F-02) | y | n (apps) | n | ? | ? | ? | y | y | ? | p (Vrobo) | p (deposits) | y (AI fraud) | ? |
| ★egyptGateways | y (own Paymob, Kashier) | y (+15, names in blog) | y (apps) | y (plugins) | ? | p (logos) | p (dated) | **n** | y (Kashier, Fawaterk) | y | y | y | **n** | p (Kashier) |
| transfer (wallets) | p (verify F-21p) | ? | n | n | ? | ? | ? | p (custom) | ? | p (via Paymob) | y | y | ? | n |
| installments | n | ? | ? | p | ? | p (valU logo) | p | n | y (Kashier) | ? | y | n | y (Gulf BNPL) | ? |
| ★egyptCarriers | y (Bosta; Wassalha sheet) | y (+100) | p (apps) | p (plugins) | y | p (logos) | p (dated) | **n** | **n** | y | y | p (Sky Express) | **n** | **n** |
| riders | y | ? | n | n | ? | ? | ? | ? | n | ? | y (custom couriers) | ? | ? | n |
| zones | y (governorate + free-over) | ? | p | p | y | y | ? | y | y | ? | y | y | y | ? |
| ★abandoned | y (missed orders, F-03) | ? | y | p | ? | y | p (Ultimate) | y | p (LightRecover) | y | p (Pro) | n | y | ? |
| email | y (500 / 10,000) | n | y | p | ? | ? | y | y | p | ? | p (Pro) | p | y | y |
| feeds | y (Meta, GMC, TikTok catalog) | y | y | p | ? | ? | y | ? | y (Google) | ? | y | y (GMC) | y | y |
| ★aiProductCopy | y (both languages) | y | y (Sidekick) | n | n | ? | n | y | y | p (Growth) | n | p (external prompts) | p (app) | y |
| ★aiStoreBuilder | **n** (F-82 off) | y (landing page) | p (Sidekick designer) | n | n | n | n | p (Mochi) | y (funnels) | n | n | n | n | y |
| ★landingPages | n (F-08) | y | p | p | ? | ? | ? | y | y | y | y | y | y | y |
| domain | y (free on main store) | p (bring your own) | y | p | y | ? | p (buy) | y (6) | y | p (Growth) | ? | ? | ? | p (paid plan) |
| support | y (WhatsApp, email) | y (24h ar) | ? | p | y | y | y | y | y | y | y | y | y | ? |
| ★egpPricing | p (USD, shown ≈ EGP) | n (USD) | n (USD) | n/a | y | y | y | n | y (/egpricing) | y | y | y | n (SAR) | ? |
| ★availableInEgypt | y | y | y | y | y | y | y | p (no local payouts) | y | y | y | y | **n** (Saudi CR) | y |

### 4.2 Data model (`compare.lib.ts` v2, built 2026-11-10)

> **Built (2026-11-10):** as sketched below, with these differences. `FactMark` adds `descriptive` (what a thing plainly is, e.g. a Facebook page has no domain; shown, not counted). `cards`/`carriers` became `egyptGateways`/`egyptCarriers`, and an `ai` group holds `aiProductCopy`/`aiStoreBuilder`. Each competitor has `publish` (per-competitor release under `COMPARE_PUBLIC`; EasyOrders and Shopify are `true`), `prices` (the token keys it uses) and `alternative`. `COMPETITOR_PRICES` entries are `{ minor, currency: "USD" | "EGP" | "SAR" | "percent", per, source, checkedOn }`: USD and SAR (peg 3.75) go through the ≈ EGP / visitor-currency formatter, EGP and percentages show as published. The page date is the **oldest** `checkedOn` among shown facts and prices. Tests: `compare.lib.test.ts` (sources, dates, gating, literal-price guard), `compare-facts-age.test.ts` (90 days), and the render tests in `content-pages.test.tsx`.

#### The original sketch (2026-11-09)

Today `Competitor.cells` is a bare status map, and sources are free text. v2 ties **each fact** to an official URL and a date, so `MIN_VERIFIED_FACTS` counts only facts a reviewer can re-open.

```ts
// lib/marketing/compare.lib.ts (v2 sketch; Tallaby's side stays code-owned)
export type FactMark = "official" | "official-blog" | "third-party"; // only "official*" counts toward MIN_VERIFIED_FACTS
export type CompetitorFact = {
  status: CellStatus;                 // "y" | "n" | "p"
  source: string;                     // URL, required
  checkedOn: string;                  // ISO date, required; page shows the oldest date on the page
  mark: FactMark;
  priceRef?: CompetitorPriceKey;      // when the cell text needs a price token
};
export type Competitor = {
  id: string;                         // "easyorders"
  category: "eg" | "global" | "other";
  featured?: boolean;
  latin: string;                      // "EasyOrders"
  arabicNames: readonly string[];     // ["ايزي اوردرز","ايزي اوردر","إيزي أوردرز"]: §14 spelling variants, for copy and alt text
  facts: Partial<Record<CompareRowId, CompetitorFact>>;
  prices?: Partial<Record<CompetitorPriceKey, { amount: number; currency: "USD" | "EGP" | "SAR" | "EUR"; per: "order" | "month" | "year" | "percent"; source: string; checkedOn: string }>>;
  alternative?: { enabled: boolean };   // also builds /alternatives/<id>
  moveSteps?: "shopify-import" | "excel-import" | "manual"; // drives the "How to move" block (Shopify import is live; Excel/URL import is live)
};
export const MIN_VERIFIED_FACTS = 4;  // unchanged; counted over facts whose mark starts with "official"
export const publishableCompetitors = () =>
  COMPETITORS.filter((c) => Object.values(c.facts).filter((f) => f?.mark !== "third-party").length >= MIN_VERIFIED_FACTS);
```

- **Rows:** add the ★ rows above to `CompareRowId` and `COMPARE_GROUPS` (`orderFee`, `activation`, `dragDrop`, `arabicAdmin`, `fakeOrders`, `egyptGateways`, `egyptCarriers`, `abandoned`, `aiProductCopy`, `aiStoreBuilder`, `landingPages`, `egpPricing`, `availableInEgypt`). Every new row's Tallaby value must come from code. Rows where Tallaby is `n` (`aiStoreBuilder`, `landingPages`, `installments`) stay visible, because honest tables convert better and the page's checked-on date protects it.
- **Prices:** competitor prices in **native currency** (Zid, ExpandCart, Qumra, Shanta, HalaOrders and Lightfunnels are EGP; EasyOrders, Shopify and YouCan are USD; Salla is SAR) go in `COMPETITOR_PRICES` v2 with `currency`. USD and SAR amounts render through the live rate as "≈ … جنيه". EGP amounts render as-is. No literal ever goes into copy.
- **Cell text** stays in `competitors.<id>.cells.<row>` in `compare.<loc>.json`, both locales with the same keys (the guard test already checks this).
- **Gating:** `COMPARE_PUBLIC` governs `/compare/*`, `/alternatives/*`, the ranking article (B1), the competitor presets in the fee calculator (T4) and blog posts B8/B9. One switch, one owner decision. Optionally a per-competitor `publish` flag, so EasyOrders and Shopify can go first.
- **Re-check cadence:** `factsCheckedOn` older than **90 days** fails a new test (`compare-facts-age.test.ts`), which forces a re-read before stale prices ship. EasyOrders doubled its prices between 2023 and 2026, and its own blog didn't keep up.

_The nine smaller global platforms are condensed into one row each because none showed Egyptian demand. SEO, analytics, support and market fields not shown for them are either U in the research file or out of scope. All their sources are in Appendix A._

---

## 5. Complete SEO page inventory

Two tables. **§5.1** maps the owner's numbered list of 95 topics, one row per number, to a decision, a final URL, a priority and the §6 block that owns it. **§5.2** is the full page inventory: the 119 topics rebuilt from the audit's target inventory (audit §10.2), the competitor files and the keyword research, plus 9 pages added to cover owner topics (A6, A7, F15, B16–B20, and B10/B15 promoted from stubs to full rows), so 128 rows. Its last column cross-references the owner numbers. Decisions: **Build**, **Build, publish only after S-06**, **Keep/extend (exists)**, **Merge into X**, **Arabic locale of Y**, **Blog post**, or **Skip** (with the reason).


### 5.1 Owner topic list → decision (the owner's 95 topics)

Every number from the owner's list has a row. **Final URL** is the Arabic (unprefixed) path; English is the same path under `/en`. **§6 row** links to the keyword mapping block that owns the topic (for merges and Arabic locales, the owner page's block). Every topic decided **Build** or **Blog post** has its own §6 block with title, description and H1 checked against the repo's length rule. Pages that already exist (S3, F3, N1, B15) count as Build or Blog post, with a refresh.

| # | Topic | Decision | Final URL | Priority | §6 row |
|---|---|---|---|---|---|
| 1 | Create an Online Store in Egypt | Build | `/solutions/online-store-egypt` | P0 | [S2](#kw-s2) |
| 2 | E-commerce Platform in Egypt | Merge into S2 | `/solutions/online-store-egypt` | P0 | [S2](#kw-s2) |
| 3 | Free Online Store Builder | Merge into S1 | `/solutions/free-online-store` | P0 | [S1](#kw-s1) |
| 4 | Create an Online Store for Free | Build | `/solutions/free-online-store` | P0 | [S1](#kw-s1) |
| 5 | Online Store Builder <br><small>Home owns 'منشئ متاجر إلكترونية / online store builder' (§7.2); no new URL</small> | Merge into home | `/` | P0 (exists) | home (exists; §7.2) |
| 6 | E-commerce Website Builder <br><small>Same intent as #5</small> | Merge into home | `/` | P0 (exists) | home (exists; §7.2) |
| 7 | Sell Online in Egypt | Blog post | `/blog/how-to-sell-online-egypt` | P2 | [B6](#kw-b6) |
| 8 | Start an Online Business in Egypt | Merge into B6 | `/blog/how-to-sell-online-egypt` | P2 | [B6](#kw-b6) |
| 9 | Free E-commerce Platform | Merge into S1 | `/solutions/free-online-store` | P0 | [S1](#kw-s1) |
| 10 | Arabic Online Store Builder <br><small>Arabic + English storefront and Arabic dashboard become a section and secondary keyword ('منصة عربية لانشاء متجر الكتروني') on F2; the Arabic dashboard row also goes in every compare table</small> | Merge into F2 | `/features/store-design` | P1 | [F2](#kw-f2) |
| 11 | Online Store Without Coding <br><small>Exists; retarget (H1 'دون مبرمج' / 'no developer')</small> | Build | `/solutions/create-online-store` | P0 | [S3](#kw-s3) |
| 12 | Website Builder for Small Businesses <br><small>No Egyptian demand seen; a home secondary keyword</small> | Merge into home | `/` | P0 (exists) | home (exists; §7.2) |
| 13 | Tallaby vs EasyOrders | Build (gated S-06) | `/compare/tallaby-vs-easyorders` | P1 | [C1](#kw-c1) |
| 14 | Tallaby vs Shopify | Build (gated S-06) | `/compare/tallaby-vs-shopify` | P1 | [C2](#kw-c2) |
| 15 | Tallaby vs WooCommerce | Build (gated S-06) | `/compare/tallaby-vs-woocommerce` | P2 | [C3](#kw-c3) |
| 16 | Tallaby vs ExpandCart | Build (gated S-06) | `/compare/tallaby-vs-expandcart` | P3 | [C7](#kw-c7) |
| 17 | Tallaby vs Wuilt | Build (gated S-06) | `/compare/tallaby-vs-wuilt` | P2 | [C5](#kw-c5) |
| 18 | Tallaby vs Salla | Build (gated S-06) | `/compare/tallaby-vs-salla` | P3 | [C13](#kw-c13) |
| 19 | Tallaby vs Zid | Build (gated S-06) | `/compare/tallaby-vs-zid` | P2 | [C6](#kw-c6) |
| 20 | Tallaby vs Wix | Build (gated S-06) | `/compare/tallaby-vs-wix` | P3 | [C14](#kw-c14) |
| 21 | Tallaby vs YouCan | Build (gated S-06) | `/compare/tallaby-vs-youcan` | P3 | [C8](#kw-c8) |
| 22 | Tallaby vs Lightfunnels | Build (gated S-06) | `/compare/tallaby-vs-lightfunnels` | P3 | [C9](#kw-c9) |
| 23 | Tallaby vs PrestaShop <br><small>No Egyptian demand seen; developer-run platform. Cited in B1 and A3 only</small> | Skip | `—` | n/a | — |
| 24 | Tallaby vs OpenCart <br><small>Same as #23; opencart.com returned 403, so facts are thin</small> | Skip | `—` | n/a | — |
| 25 | Tallaby vs BigCommerce <br><small>No Egyptian demand; no local gateway except Fawry via Checkout.com. Cited in B1</small> | Skip | `—` | n/a | — |
| 26 | Tallaby vs Squarespace <br><small>Can't take payments in Egypt (no Arabic, no RTL, no COD; verified). Cited in A2 and B1</small> | Skip | `—` | n/a | — |
| 27 | Best EasyOrders Alternatives | Build (gated S-06) | `/alternatives/easyorders` | P1 | [A1](#kw-a1) |
| 28 | Best Shopify Alternatives in Egypt | Build (gated S-06) | `/alternatives/shopify` | P1 | [A2](#kw-a2) |
| 29 | Best WooCommerce Alternatives | Build (gated S-06) | `/alternatives/woocommerce` | P2 | [A3](#kw-a3) |
| 30 | Best ExpandCart Alternatives | Build (gated S-06) | `/alternatives/expandcart` | P3 | [A6](#kw-a6) |
| 31 | Best Wix Alternatives for E-commerce | Build (gated S-06) | `/alternatives/wix` | P3 | [A7](#kw-a7) |
| 32 | Best Free Shopify Alternatives <br><small>'بديل شوبيفاي مجاني' is an A2 secondary keyword</small> | Merge into A2 | `/alternatives/shopify` | P1 | [A2](#kw-a2) |
| 33 | Best E-commerce Platforms in Egypt <br><small>Code ranking article (RankingArticleView) under /blog</small> | Blog post (gated S-06) | `/blog/best-ecommerce-platforms-egypt` | P1 | [B1](#kw-b1) |
| 34 | Best E-commerce Platforms in the Middle East <br><small>Tallaby serves Egypt (F-61 allows one store currency abroad, but rules forbid international-selling claims); a Gulf list would rank Salla and Zid for markets Tallaby can't serve. Revisit with F-61</small> | Skip | `—` | n/a | — |
| 35 | Best Free E-commerce Platforms | Blog post (gated S-06) | `/blog/best-free-ecommerce-platforms` | P2 | [B16](#kw-b16) |
| 36 | AI Website Builder <br><small>Claims live AI only (product writing, MCP products); the F-82 builder section is added when it's switched on</small> | Build | `/features/ai-online-store` | P0 | [F1](#kw-f1) |
| 37 | Drag and Drop Website Builder | Build | `/features/store-design` | P1 | [F2](#kw-f2) |
| 38 | E-commerce Website Templates <br><small>The gallery already owns 'قوالب متاجر'; a feature page would cannibalise it</small> | Merge into /templates | `/templates` | P0 (exists) | /templates (exists; §7.2) |
| 39 | Free Online Store Templates <br><small>Same as #38 ('قوالب متاجر الكترونية مجانية')</small> | Merge into /templates | `/templates` | P0 (exists) | /templates (exists; §7.2) |
| 40 | Online Store Management Software <br><small>Umbrella term; the hub lists every management feature</small> | Merge into /features hub | `/features` | P0 | [H3](#kw-h3) |
| 41 | Product Management Software | Build | `/features/product-management` | P3 | [F15](#kw-f15) |
| 42 | Order Management System | Build | `/features/order-management` | P2 | [F7](#kw-f7) |
| 43 | E-commerce Analytics Dashboard | Build | `/features/reports` | P2 | [F10](#kw-f10) |
| 44 | E-commerce SEO Tools | Build | `/features/store-seo` | P3 | [F14](#kw-f14) |
| 45 | Online Store with Cash on Delivery | Build | `/solutions/cash-on-delivery-store` | P1 | [S4](#kw-s4) |
| 46 | E-commerce Chatbot <br><small>No storefront chatbot exists; never claim</small> | Skip | `—` | n/a | — |
| 47 | AI E-commerce Assistant <br><small>Only 'manage products from ChatGPT or Claude' (MCP, live); deeper agent tools (F-83) are not live</small> | Build | `/features/ai-assistants-mcp` | P3 | [F12](#kw-f12) |
| 48 | Online Store with Custom Domain <br><small>Exists; refresh</small> | Build | `/features/custom-domain` | P1 | [F3](#kw-f3) |
| 49 | Mobile-Friendly Online Store Builder <br><small>Responsive templates are a section of F2; the installable store app is F11</small> | Merge into F2 | `/features/store-design` | P1 | [F2](#kw-f2) |
| 50 | Digital Products Selling Platform <br><small>Until the owner confirms digital products may be claimed (Q4)</small> | Skip | `—` | n/a | — |
| 51 | E-commerce Website Hosting <br><small>Hosting is included; answered in S1's FAQ and S3's cost block. No separate page</small> | Merge into S1 | `/solutions/free-online-store` | P0 | [S1](#kw-s1) |
| 52 | Clothing store <br><small>Exists</small> | Build | `/industries/clothing-store` | P1 | [N1](#kw-n1) |
| 53 | Cosmetics store | Build | `/industries/beauty-store` | P2 | [N2](#kw-n2) |
| 54 | Electronics store | Build | `/industries/electronics-store` | P2 | [N4](#kw-n4) |
| 55 | Jewelry store <br><small>Jewelry and accessories share one page</small> | Build | `/industries/jewelry-accessories-store` | P2 | [N6](#kw-n6) |
| 56 | Furniture store <br><small>Furniture and home share one page (the furniture niche is filed under home)</small> | Build | `/industries/home-furniture-store` | P2 | [N5](#kw-n5) |
| 57 | Shoes store <br><small>1 shoes-bags template</small> | Merge into N1 | `/industries/clothing-store` | P1 | [N1](#kw-n1) |
| 58 | Perfume store | Build | `/industries/perfume-store` | P2 | [N3](#kw-n3) |
| 59 | Grocery store <br><small>The grocery niche is filed under food</small> | Merge into N7 | `/industries/food-store` | P2 | [N7](#kw-n7) |
| 60 | Food store | Build | `/industries/food-store` | P2 | [N7](#kw-n7) |
| 61 | Accessories store <br><small>Mobile accessories go to N4</small> | Merge into N6 | `/industries/jewelry-accessories-store` | P2 | [N6](#kw-n6) |
| 62 | Digital Products Store <br><small>Same as #50 (Q4)</small> | Skip | `—` | n/a | — |
| 63 | Handmade Products Store | Build | `/industries/handmade-store` | P3 | [N10](#kw-n10) |
| 64 | How to Start an Online Store in Egypt <br><small>Same query as #1 ('انشاء متجر الكتروني في مصر'); S2 gets a steps section so one URL owns it</small> | Merge into S2 | `/solutions/online-store-egypt` | P0 | [S2](#kw-s2) |
| 65 | How to Sell Products Online in Egypt | Blog post | `/blog/how-to-sell-online-egypt` | P2 | [B6](#kw-b6) |
| 66 | How to Start an E-commerce Business <br><small>Same guide; B6 covers starting from zero</small> | Merge into B6 | `/blog/how-to-sell-online-egypt` | P2 | [B6](#kw-b6) |
| 67 | How Much Does It Cost to Start an Online Store? <br><small>Plus the T2 calculator</small> | Blog post | `/blog/online-store-cost-egypt` | P1 | [B2](#kw-b2) |
| 68 | How to Create an Online Store Without Coding <br><small>S3's steps block is the how-to</small> | Merge into S3 | `/solutions/create-online-store` | P0 | [S3](#kw-s3) |
| 69 | How to Get Your First 100 Online Orders | Blog post | `/blog/first-100-orders` | P3 | [B10](#kw-b10) |
| 70 | Best Products to Sell Online in Egypt | Blog post | `/blog/best-products-to-sell-egypt` | P2 | [B17](#kw-b17) |
| 71 | How to Choose Products to Sell Online | Merge into B17 | `/blog/best-products-to-sell-egypt` | P2 | [B17](#kw-b17) |
| 72 | How to Market Your Online Store | Blog post | `/blog/market-online-store` | P3 | [B18](#kw-b18) |
| 73 | How to Increase Online Store Sales | Merge into B18 | `/blog/market-online-store` | P3 | [B18](#kw-b18) |
| 74 | How to Accept Online Payments in Egypt | Blog post | `/blog/payment-gateways-egypt` | P2 | [B4](#kw-b4) |
| 75 | Cash on Delivery vs Online Payments | Blog post | `/blog/cod-vs-online` | P2 | [B5](#kw-b5) |
| 76 | How to Choose a Shipping Company for Your Online Store | Blog post | `/blog/shipping-companies-egypt` | P2 | [B3](#kw-b3) |
| 77 | How to Build an E-commerce Brand | Blog post | `/blog/build-ecommerce-brand` | P3 | [B19](#kw-b19) |
| 78 | Shopify vs WooCommerce: Complete Comparison | Blog post (gated S-06) | `/blog/shopify-vs-woocommerce` | P3 | [B20](#kw-b20) |
| 79 | E-commerce Business Ideas in Egypt <br><small>Ideas by category are a section of B17</small> | Merge into B17 | `/blog/best-products-to-sell-egypt` | P2 | [B17](#kw-b17) |
| 80 | How to Price Products for Online Selling <br><small>Exists (has a body); retitle</small> | Blog post | `/blog/pricing-products` | P2 | [B15](#kw-b15) |
| 81 | إنشاء متجر إلكتروني في مصر | Arabic locale of S2 | `/solutions/online-store-egypt` | P0 | [S2](#kw-s2) |
| 82 | إنشاء متجر إلكتروني مجاني | Arabic locale of S1 | `/solutions/free-online-store` | P0 | [S1](#kw-s1) |
| 83 | أفضل منصة لإنشاء متجر إلكتروني | Arabic locale of B1 | `/blog/best-ecommerce-platforms-egypt` | P1 | [B1](#kw-b1) |
| 84 | أفضل منصات التجارة الإلكترونية في مصر | Arabic locale of B1 | `/blog/best-ecommerce-platforms-egypt` | P1 | [B1](#kw-b1) |
| 85 | إنشاء متجر إلكتروني بدون برمجة | Arabic locale of S3 | `/solutions/create-online-store` | P0 | [S3](#kw-s3) |
| 86 | كيفية البيع أونلاين في مصر | Arabic locale of B6 | `/blog/how-to-sell-online-egypt` | P2 | [B6](#kw-b6) |
| 87 | كيفية بدء مشروع تجارة إلكترونية <br><small>#66 merged into B6</small> | Arabic locale of B6 | `/blog/how-to-sell-online-egypt` | P2 | [B6](#kw-b6) |
| 88 | بدائل إيزي أوردرز | Arabic locale of A1 | `/alternatives/easyorders` | P1 | [A1](#kw-a1) |
| 89 | شوبيفاي vs ووكومرس | Arabic locale of B20 | `/blog/shopify-vs-woocommerce` | P3 | [B20](#kw-b20) |
| 90 | إنشاء متجر ملابس إلكتروني | Arabic locale of N1 | `/industries/clothing-store` | P1 | [N1](#kw-n1) |
| 91 | إنشاء متجر مستحضرات تجميل | Arabic locale of N2 | `/industries/beauty-store` | P2 | [N2](#kw-n2) |
| 92 | أفضل المنتجات للبيع أونلاين | Arabic locale of B17 | `/blog/best-products-to-sell-egypt` | P2 | [B17](#kw-b17) |
| 93 | كيفية الحصول على أول 100 طلب | Arabic locale of B10 | `/blog/first-100-orders` | P3 | [B10](#kw-b10) |
| 94 | طرق الدفع الإلكتروني في مصر | Arabic locale of B4 | `/blog/payment-gateways-egypt` | P2 | [B4](#kw-b4) |
| 95 | شركات الشحن للمتاجر الإلكترونية في مصر | Arabic locale of B3 | `/blog/shipping-companies-egypt` | P2 | [B3](#kw-b3) |


### 5.2 Full page inventory (cross-referenced to §5.1)

| # | Topic (ar / en) | URL | Decision | Reason / where mapped | Owner list # (§5.1) |
|---|---|---|---|---|---|
| 1 | منصة إنشاء متجر إلكتروني / online store solutions | `/solutions` | Build | Hub, P0. Keyword map: §6 H1 | — |
| 2 | متجر إلكتروني حسب النشاط / online store by industry | `/industries` | Build | Hub, P0. Keyword map: §6 H2 | — |
| 3 | مميزات منصة المتجر الإلكتروني / online store features | `/features` | Build | Hub, P0. Keyword map: §6 H3 | 40 |
| 4 | أدوات مجانية للتجار / free tools for online sellers | `/tools` | Build | Hub, P1. Keyword map: §6 H4 | — |
| 5 | بدائل منصات المتاجر الإلكترونية / ecommerce platform alternatives | `/alternatives` | Build, publish only after S-06 | Hub (gated S-06), P2. Keyword map: §6 H5 | — |
| 6 | انشاء متجر الكتروني مجاني / create a free online store | `/solutions/free-online-store` | Build | Core landing, P0. Keyword map: §6 S1 | 3, 4, 9, 51, 82 |
| 7 | انشاء متجر الكتروني في مصر / ecommerce platform Egypt | `/solutions/online-store-egypt` | Build | Core landing, P0. Keyword map: §6 S2 | 1, 2, 64, 81 |
| 8 | انشاء متجر الكتروني / create an online store | `/solutions/create-online-store` | Keep + extend (exists) | Core landing, P0. Keyword map: §6 S3 | 11, 68, 85 |
| 9 | متجر الكتروني الدفع عند الاستلام / cash on delivery online store | `/solutions/cash-on-delivery-store` | Build | Core landing, P1. Keyword map: §6 S4 | 45 |
| 10 | متجر الكتروني على الفيس بوك / Facebook page to online store | `/solutions/facebook-page-to-store` | Build | Core landing, P2. Keyword map: §6 S5 | — |
| 11 | انشاء متجر الكتروني بالذكاء الاصطناعي / AI online store builder | `/features/ai-online-store` | Build | Feature, P0. Keyword map: §6 F1 | 36 |
| 12 | تصميم متجر الكتروني / online store design | `/features/store-design` | Build | Feature, P1. Keyword map: §6 F2 | 10, 37, 49 |
| 13 | ربط دومين بالمتجر / connect domain to online store | `/features/custom-domain` | Keep + extend (exists) | Feature, P1. Keyword map: §6 F3 | 48 |
| 14 | الطلبات الوهمية / fake COD orders | `/features/fake-order-protection` | Build | Feature, P1. Keyword map: §6 F4 | — |
| 15 | السلات المتروكة / abandoned checkout recovery | `/features/abandoned-checkouts` | Build | Feature, P1. Keyword map: §6 F5 | — |
| 16 | شحن الطلبات في مصر / shipping for online stores in Egypt | `/features/shipping` | Build | Feature, P1. Keyword map: §6 F6 | — |
| 17 | إدارة طلبات المتجر الإلكتروني / order management for online stores | `/features/order-management` | Build | Feature, P2. Keyword map: §6 F7 | 42 |
| 18 | حملات البريد الإلكتروني للمتجر / email marketing for online stores | `/features/email-marketing` | Build | Feature, P2. Keyword map: §6 F8 | — |
| 19 | كوبون خصم للمتجر / coupons and quantity offers | `/features/offers-and-coupons` | Build | Feature, P2. Keyword map: §6 F9 | — |
| 20 | تقارير مبيعات المتجر الإلكتروني / online store analytics | `/features/reports` | Build | Feature, P2. Keyword map: §6 F10 | 43 |
| 21 | تطبيق متجر الكتروني / store app for customers | `/features/store-app` | Build | Feature, P2. Keyword map: §6 F11 | — |
| 22 | ربط المتجر مع ChatGPT / manage store products from ChatGPT or Claude | `/features/ai-assistants-mcp` | Build | Feature, P3. Keyword map: §6 F12 | 47 |
| 23 | قائمة عملاء المتجر / customer list for online stores | `/features/customers` | Build | Feature, P3. Keyword map: §6 F13 | — |
| 24 | تحسين ظهور المتجر في محركات البحث / online store SEO | `/features/store-seo` | Build | Feature, P3. Keyword map: §6 F14 | 44 |
| 25 | إدارة منتجات المتجر الإلكتروني / product management for online stores | `/features/product-management` | Build | Feature, P3. Keyword map: §6 F15 | 41 |
| 26 | ربط بوسطة بالمتجر / Bosta integration | `/integrations/bosta` | Build | Integration (feature template), P1. Keyword map: §6 I1 | — |
| 27 | ربط باي موب بالمتجر / Paymob integration | `/integrations/paymob` | Build | Integration, P1. Keyword map: §6 I2 | — |
| 28 | بوابة دفع كاشير / Kashier integration | `/integrations/kashier` | Build | Integration, P1. Keyword map: §6 I3 | — |
| 29 | بوابة دفع فودافون كاش / InstaPay and Vodafone Cash for online stores | `/integrations/instapay-wallets` | Build | Integration, P2. Keyword map: §6 I4 | — |
| 30 | الشحن مع البريد المصري للمتجر / Wassalha Egypt Post shipping sheet | `/integrations/wassalha` | Build | Integration, P2. Keyword map: §6 I5 | — |
| 31 | كتالوج فيسبوك للمتجر / product feed for Meta and Google | `/integrations/product-catalogs` | Build | Integration, P2. Keyword map: §6 I6 | — |
| 32 | نقل متجر شوبيفاي / import products from Shopify | `/integrations/shopify-import` | Build | Integration, P2. Keyword map: §6 I7 | — |
| 33 | ربط المتجر بجوجل أناليتكس / connect store to Google Analytics 4 | `/integrations/google-analytics` | Build | Integration, P3. Keyword map: §6 I8 | — |
| 34 | تصدير الطلبات إلى جوجل شيت / export orders to Google Sheets | `/integrations/google-sheets` | Build | Integration, P3. Keyword map: §6 I9 | — |
| 35 | حاسبة هامش الربح / profit margin calculator | `/tools/profit-margin-calculator` | Keep + extend (exists) | Tool, P1. Keyword map: §6 T1 | — |
| 36 | تكلفة انشاء متجر الكتروني في مصر / online store cost calculator Egypt | `/tools/store-cost-calculator` | Build | Tool, P1. Keyword map: §6 T2 | — |
| 37 | اسماء متاجر الكترونية / online store name generator | `/tools/store-name-generator` | Build | Tool, P2. Keyword map: §6 T3 | — |
| 38 | حاسبة رسوم منصة المتجر / ecommerce platform fee calculator | `/tools/platform-fee-calculator` | Build, publish only after S-06 | Tool, P2. Keyword map: §6 T4 | — |
| 39 | نموذج سياسة الاسترجاع للمتجر / return policy template for online store | `/tools/return-policy-generator` | Build | Tool, P3. Keyword map: §6 T5 | — |
| 40 | نموذج سياسة الخصوصية للمتجر / privacy policy template for online store | `/tools/privacy-policy-generator` | Build | Tool, P3. Keyword map: §6 T6 | — |
| 41 | انشاء متجر ملابس / online clothing store | `/industries/clothing-store` | Keep + extend (exists) | Industry, P1. Keyword map: §6 N1 | 52, 57, 90 |
| 42 | متجر مستحضرات تجميل / online beauty store | `/industries/beauty-store` | Build | Industry, P2. Keyword map: §6 N2 | 53, 91 |
| 43 | متجر عطور اونلاين / online perfume store | `/industries/perfume-store` | Build | Industry, P2. Keyword map: §6 N3 | 58 |
| 44 | متجر الكترونيات / online electronics store | `/industries/electronics-store` | Build | Industry, P2. Keyword map: §6 N4 | 54 |
| 45 | متجر اثاث / online furniture store | `/industries/home-furniture-store` | Build | Industry, P2. Keyword map: §6 N5 | 56 |
| 46 | متجر اكسسوارات / online jewelry and accessories store | `/industries/jewelry-accessories-store` | Build | Industry, P2. Keyword map: §6 N6 | 55, 61 |
| 47 | متجر اكل اونلاين / online food store | `/industries/food-store` | Build | Industry, P2. Keyword map: §6 N7 | 59, 60 |
| 48 | متجر ملابس اطفال / online kids store | `/industries/kids-store` | Build | Industry, P3. Keyword map: §6 N8 | — |
| 49 | متجر اكسسوارات سيارات / online car accessories store | `/industries/car-accessories-store` | Build | Industry, P3. Keyword map: §6 N9 | — |
| 50 | متجر هاند ميد / online handmade store | `/industries/handmade-store` | Build | Industry, P3. Keyword map: §6 N10 | 63 |
| 51 | متجر ملابس رياضية / online sportswear store | `/industries/sports-store` | Build | Industry, P3. Keyword map: §6 N11 | — |
| 52 | طلبي ولا ايزي اوردرز / Tallaby vs EasyOrders | `/compare/tallaby-vs-easyorders` | Keep (exists), gated | Comparison (gated S-06), P1. Keyword map: §6 C1 | 13 |
| 53 | طلبي ولا شوبيفاي / Tallaby vs Shopify | `/compare/tallaby-vs-shopify` | Keep (exists), gated | Comparison (gated S-06), P1. Keyword map: §6 C2 | 14 |
| 54 | طلبي ولا ووكومرس / Tallaby vs WooCommerce | `/compare/tallaby-vs-woocommerce` | Keep (exists), gated | Comparison (gated S-06), P2. Keyword map: §6 C3 | 15 |
| 55 | طلبي ولا صفحة فيسبوك / Tallaby vs a Facebook page | `/compare/tallaby-vs-facebook-only` | Keep (exists), gated | Comparison (gated S-06), P2. Keyword map: §6 C4 | — |
| 56 | طلبي ولا ويلت / Tallaby vs Wuilt | `/compare/tallaby-vs-wuilt` | Build, publish only after S-06 | Comparison (gated S-06), P2. Keyword map: §6 C5 | 17 |
| 57 | طلبي ولا زد / Tallaby vs Zid | `/compare/tallaby-vs-zid` | Build, publish only after S-06 | Comparison (gated S-06), P2. Keyword map: §6 C6 | 19 |
| 58 | طلبي ولا اكسباند كارت / Tallaby vs ExpandCart | `/compare/tallaby-vs-expandcart` | Build, publish only after S-06 | Comparison (gated S-06), P3. Keyword map: §6 C7 | 16 |
| 59 | طلبي ولا يوكان / Tallaby vs YouCan | `/compare/tallaby-vs-youcan` | Build, publish only after S-06 | Comparison (gated S-06), P3. Keyword map: §6 C8 | 21 |
| 60 | طلبي ولا لايت فانلز / Tallaby vs Lightfunnels | `/compare/tallaby-vs-lightfunnels` | Build, publish only after S-06 | Comparison (gated S-06), P3. Keyword map: §6 C9 | 22 |
| 61 | طلبي ولا قمرة / Tallaby vs Qumra | `/compare/tallaby-vs-qumra` | Build, publish only after S-06 | Comparison (gated S-06), P3. Keyword map: §6 C10 | — |
| 62 | طلبي ولا شنطة / Tallaby vs Shanta | `/compare/tallaby-vs-shanta` | Build, publish only after S-06 | Comparison (gated S-06), P3. Keyword map: §6 C11 | — |
| 63 | طلبي ولا هلا أوردرز / Tallaby vs HalaOrders | `/compare/tallaby-vs-halaorders` | Build, publish only after S-06 | Comparison (gated S-06), P3. Keyword map: §6 C12 | — |
| 64 | طلبي ولا سلة / Tallaby vs Salla | `/compare/tallaby-vs-salla` | Build, publish only after S-06 | Comparison (gated S-06), P3. Keyword map: §6 C13 | 18 |
| 65 | طلبي ولا ويكس / Tallaby vs Wix | `/compare/tallaby-vs-wix` | Build, publish only after S-06 | Comparison (gated S-06), P3. Keyword map: §6 C14 | 20 |
| 66 | بديل ايزي اوردرز / EasyOrders alternative | `/alternatives/easyorders` | Build, publish only after S-06 | Alternatives (gated S-06), P1. Keyword map: §6 A1 | 27, 88 |
| 67 | بديل شوبيفاي في مصر / Shopify alternative | `/alternatives/shopify` | Build, publish only after S-06 | Alternatives (gated S-06), P1. Keyword map: §6 A2 | 28, 32 |
| 68 | بديل ووكومرس / WooCommerce alternative | `/alternatives/woocommerce` | Build, publish only after S-06 | Alternatives (gated S-06), P2. Keyword map: §6 A3 | 29 |
| 69 | بديل ويلت / Wuilt alternative | `/alternatives/wuilt` | Build, publish only after S-06 | Alternatives (gated S-06), P3. Keyword map: §6 A4 | — |
| 70 | بديل سلة في مصر / Salla alternative | `/alternatives/salla` | Build, publish only after S-06 | Alternatives (gated S-06), P3. Keyword map: §6 A5 | — |
| 71 | بديل اكسباند كارت / ExpandCart alternative | `/alternatives/expandcart` | Build, publish only after S-06 | Alternatives (gated S-06), P3. Keyword map: §6 A6 | 30 |
| 72 | بديل ويكس للمتاجر / Wix alternative | `/alternatives/wix` | Build, publish only after S-06 | Alternatives (gated S-06), P3. Keyword map: §6 A7 | 31 |
| 73 | افضل منصة لانشاء متجر الكتروني / best ecommerce platform in Egypt | `/blog/best-ecommerce-platforms-egypt` | Build, publish only after S-06 | Blog article, P1. Keyword map: §6 B1 | 33, 83, 84 |
| 74 | تكلفة انشاء متجر الكتروني في مصر / online store cost in Egypt | `/blog/online-store-cost-egypt` | Blog post | Blog article, P1. Keyword map: §6 B2 | 67 |
| 75 | شركات الشحن في مصر / shipping companies in Egypt for online stores | `/blog/shipping-companies-egypt` | Blog post | Blog article, P2. Keyword map: §6 B3 | 76, 95 |
| 76 | بوابة دفع مصرية / payment gateways in Egypt | `/blog/payment-gateways-egypt` | Blog post | Blog article, P2. Keyword map: §6 B4 | 74, 94 |
| 77 | الدفع عند الاستلام ام الدفع الالكتروني / cash on delivery vs online payment | `/blog/cod-vs-online` | Blog post | Blog article, P2. Keyword map: §6 B5 | 75 |
| 78 | البيع اونلاين في مصر / how to sell online in Egypt | `/blog/how-to-sell-online-egypt` | Blog post | Blog article, P2. Keyword map: §6 B6 | 7, 8, 65, 66, 86, 87 |
| 79 | تقليل الطلبات الوهمية / how to reduce fake COD orders | `/blog/reduce-fake-orders` | Blog post | Blog article, P2. Keyword map: §6 B7 | — |
| 80 | هل شوبيفاي يعمل في مصر / does Shopify work in Egypt | `/blog/shopify-in-egypt` | Build, publish only after S-06 | Blog article, P2. Keyword map: §6 B8 | — |
| 81 | شوبيفاي ولا ايزي اوردر / Shopify vs EasyOrders | `/blog/shopify-vs-easyorders` | Build, publish only after S-06 | Blog article, P3. Keyword map: §6 B9 | — |
| 82 | كيفية الحصول على أول 100 طلب / how to get your first 100 online orders | `/blog/first-100-orders` | Keep + extend (exists) | Blog article, P3. Keyword map: §6 B10 | 69, 93 |
| 83 | تسعير المنتجات / how to price products for online selling | `/blog/pricing-products` | Keep + extend (exists) | Blog article, P2. Keyword map: §6 B15 | 80 |
| 84 | افضل منصة لانشاء متجر الكتروني مجاني / best free ecommerce platforms | `/blog/best-free-ecommerce-platforms` | Build, publish only after S-06 | Blog article, P2. Keyword map: §6 B16 | 35 |
| 85 | افضل المنتجات للبيع اونلاين / best products to sell online in Egypt | `/blog/best-products-to-sell-egypt` | Blog post | Blog article, P2. Keyword map: §6 B17 | 70, 71, 79, 92 |
| 86 | تسويق المتجر الالكتروني / how to market your online store | `/blog/market-online-store` | Blog post | Blog article, P3. Keyword map: §6 B18 | 72, 73 |
| 87 | بناء علامة تجارية للمتجر / how to build an ecommerce brand | `/blog/build-ecommerce-brand` | Blog post | Blog article, P3. Keyword map: §6 B19 | 77 |
| 88 | شوبيفاي ولا ووكومرس / Shopify vs WooCommerce | `/blog/shopify-vs-woocommerce` | Build, publish only after S-06 | Blog article, P3. Keyword map: §6 B20 | 78, 89 |
| 89 | Blog stub: phone-photos | `/blog/phone-photos` | Keep + extend (exists) | Blog article, P3. Exists in code fallback (fallback stub); mapped by its owner page, no §6 block (not an owner topic) | — |
| 90 | Blog stub: dms-to-store | `/blog/dms-to-store` | Keep + extend (exists) | Blog article, P3. Exists in code fallback (fallback stub; feeds S5); mapped by its owner page, no §6 block (not an owner topic) | — |
| 91 | Blog stub: seo-basics | `/blog/seo-basics` | Keep + extend (exists) | Blog article, P3. Exists in code fallback (fallback stub; feeds F14); mapped by its owner page, no §6 block (not an owner topic) | — |
| 92 | Blog stub: discount-codes | `/blog/discount-codes` | Keep + extend (exists) | Blog article, P3. Exists in code fallback (fallback stub; feeds F9); mapped by its owner page, no §6 block (not an owner topic) | — |
| 93 | Home page: منشئ متاجر إلكترونية / online store builder | `/` | Keep (exists) | Owns the brand + 'منشئ متاجر' (builder) intent. Must not retarget 'انشاء متجر الكتروني' (that is S3) or 'مجاني' (S1); see §7 | 5, 6, 12 |
| 94 | Pricing: اسعار / خطة مجانية | `/pricing` | Keep (exists) | Owns 'اسعار طلبي', plan names; fix the double separator in its title | — |
| 95 | Templates gallery: قوالب متاجر الكترونية مجانية | `/templates` | Keep (exists) | Owns 'قوالب متاجر الكترونية مجانية' and 'ثيمات متجر'. No separate templates feature page | 38, 39 |
| 96 | Templates feature page (/features/templates) | `—` | Merge into /templates | Would cannibalise the gallery (audit §10.1) | 38 |
| 97 | Template detail pages (119 × 2 locales) | `/templates/[id]` | Keep, improve | Add industry link + unique intro per category; consider noindex for near-duplicates later (§12) | — |
| 98 | Integrations hub | `/integrations` | Keep (exists) | Becomes the parent of I1–I9 | — |
| 99 | Meta Pixel + Conversions API | `/integrations/meta-pixel` | Keep (exists) | Meta CAPI (F-30) merges into this page, not a new one | — |
| 100 | Google Tag Manager | `—` | Merge into /integrations/google-analytics | Same audience, thin on its own | — |
| 101 | TikTok / Snapchat pixel | `—` | Skip | availability: 'soon' in registry.ts; never present as live | — |
| 102 | Steps to create a store (خطوات انشاء متجر الكتروني) | `—` | Merge into /solutions/create-online-store | Same intent as S3; HowTo-style steps block on S3 | 68 |
| 103 | Selling price calculator (حساب سعر البيع) | `—` | Merge into /tools/profit-margin-calculator | The calculator already returns suggestedPrice and breakEvenPrice | — |
| 104 | Free online store 'for life' (مجاني مدى الحياة) | `—` | Merge into /solutions/free-online-store | Secondary keyword only. Never promise 'forever': the per-order fee and top-up rule apply | — |
| 105 | Free store in Egypt (انشاء متجر الكتروني مجاني في مصر) | `—` | Merge into /solutions/free-online-store | Secondary on S1; S2 links to it with that anchor | — |
| 106 | AI Store Builder (one prompt builds the store, F-82) | `—` | Merge into /features/ai-online-store later | Off in production (STORE_BUILDER_AI_ENABLED). Add a section to F1 only on switch-on; no new URL | 36 |
| 107 | Storefront chatbot / AI assistant for shoppers | `—` | Skip | Not built; never claim | 46 |
| 108 | Landing pages / funnels (صفحة هبوط) | `—` | Skip until F-08 | F-08 is Delayed; demand is real (10 suggestions), revisit when built | — |
| 109 | Dropshipping store (دروب شيبنج مصر) | `—` | Skip | No supplier integration; would mislead | — |
| 110 | Digital products store (متجر منتجات رقمية) | `—` | Skip until owner confirms | Code supports digital products (migrations 0004/0005, place-order) and ROADMAP §2.1 lists them, but marketing-site-rules.md forbids claiming them. Demand: 10 suggestions | 50, 62 |
| 111 | Store without commercial register (متجر الكتروني بدون سجل تجاري) | `—` | Blog post, only after owner/legal answer | Strong demand (6 suggestions); Qumra and HalaOrders answer it. Needs Tallaby's own signup facts and a legal check | — |
| 112 | Selling abroad / multi-currency | `—` | Skip | Only F-61 single store currency is live; rules forbid 'international selling' claims | — |
| 113 | Multi-store (up to 3 stores) | `—` | Merge into /pricing | No search demand; a plan fact | — |
| 114 | Bilingual store (عربي وانجليزي) | `—` | Merge into /features/store-design | No suggestions; strong differentiator line, not a page | 10 |
| 115 | Shoes store | `—` | Merge into /industries/clothing-store | 1 shoes-bags template; chip should point to N1 | 57 |
| 116 | Grocery store | `—` | Merge into /industries/food-store | Grocery niche is filed under food | 59 |
| 117 | Sweets / bakery store | `—` | Merge into /industries/food-store | 2 sweets templates | — |
| 118 | Gifts store | `—` | Merge into /industries/handmade-store | Gifts niche is filed under handmade | — |
| 119 | Accessories store (mobile) | `—` | Merge into /industries/electronics-store | ac has 2 mobile-accessory templates; women's accessories go to N6 | 61 |
| 120 | Books store | `—` | Skip | 1 template | — |
| 121 | Restaurant menu / ordering | `—` | Skip | Not Tallaby's product (HalaOrders' sister product halaorder.com does this) | — |
| 122 | Global competitors: BigCommerce, Squarespace, Magento/Adobe, PrestaShop, OpenCart, Ecwid, Webflow, Shopware, Square | `—` | Skip as pages; cite in B1 and A2 | No Egyptian demand seen; Squarespace, Webflow and Square can't take payments in Egypt (verified) | 23, 24, 25, 26 |
| 123 | Shipping cost calculator | `—` | Skip | Tallaby has no carrier rate data; would need sourced, dated carrier prices | — |
| 124 | WhatsApp order link generator | `—` | Skip for now | HalaOrders has one; no Tallaby feature behind it. Revisit after F-14 | — |
| 125 | UTM link builder | `—` | Skip | F-26 page was removed (F-65b); Salla /tools has one | — |
| 126 | Arabic pages under /ar/… (the brief's proposed tree) | `/… (unprefixed)` | Arabic locale of each page | next-intl as-needed: Arabic is the unprefixed default; /ar/* 307s to it. Same path, two locales (§8) | 81–95 |
| 127 | Arabic-script slugs (/انشاء-متجر-الكتروني) | `—` | Skip | Routes use English slugs in both locales; Arabic slugs would split hreflang pairs and need rewrites (§8) | — |
| 128 | Best e-commerce platforms in the Middle East | `—` | Skip | Gulf list would rank Salla and Zid for markets Tallaby can't serve; revisit with F-61 | 34 |

---

## 6. Keyword research and mapping

### 6.1 Method, date and what was not available

| Step | What was done (2026-11-09) | Raw data |
|---|---|---|
| Autocomplete (Arabic) | 124 seed queries on `suggestqueries.google.com/complete/search?client=firefox&hl=ar&gl=eg`, sent from the owner's machine (Egyptian IP, `ipinfo.io` = EG), 12:19–12:20 UTC | `docs/seo-research/keywords/suggest-ar.txt`, `suggest-ar2.txt`, `mena-suggest*.txt` |
| Autocomplete (English) | 22 seeds, `hl=en&gl=eg` | `kw/suggest-en.txt` |
| SERP inspection (Google, Egypt) | 30 Arabic queries fetched in a real Chrome session (`hl=ar&gl=eg`): top results, People Also Ask. After 30, Google answered with its "unusual traffic" page, so no further Google queries were run and the CAPTCHA was not touched. | §6.2 |
| SERP fallback | DuckDuckGo HTML for brand queries (2 results before it rate-limited), and WebSearch (US index) for 3 English queries | `kw/serp-ddg.txt` |
| Competitor titles and H1s | From the MENA research file (fetched HTML in `seo/raw/`) | §3, §14 |

**Not available:** search volume, keyword difficulty, CPC and click-through data. No keyword tool (Ahrefs, Semrush, GKP or Search Console) was available, so every volume and difficulty cell is **n/a (no tool data)**. "Est. relative demand" is a **qualitative estimate** from autocomplete breadth (how many suggestions and variants Google offers), whether Google offered a suggestion at all, and SERP competition. English queries for Egypt returned few or no suggestions ("create online store egypt", "online store builder egypt", "free online store egypt" and "how to sell online in egypt": none). **English demand from Egypt is thin**, so English pages are the same URLs in a second locale, not separate keyword targets. Search Console for tallaby.com should be connected right after S-01 to replace these estimates with real impressions (open question Q9).

### 6.2 What the Egyptian SERPs showed (Google, hl=ar, gl=eg, 2026-11-09)

| Query | Who ranks (top results, in order) | Read |
|---|---|---|
| انشاء متجر الكتروني | wuilt.com, salla.com, easyorders.eg, khamsat.com, odoo.com, shantaweb.com, b3na.com, wuilt.com (blog) | Platforms plus a freelancer marketplace. Tallaby is absent. |
| انشاء متجر الكتروني في مصر | wuilt, easyorders (blog), shantaweb (blog "best free platform"), fatora.io, sell.amazon.eg, method.com.eg, qumra.cloud (blog "best platforms in Egypt"), bysmart-soft | Egyptian platforms and "best of" lists. |
| انشاء متجر الكتروني مجاني | wuilt, fatora.io, easyorders (blog), shantaweb (blog), odoo, wuilt (blog), b3na, canva | Blog posts rank for "free". A strong landing page can compete. |
| منصة انشاء متجر الكتروني في مصر | wuilt, shantaweb, easyorders, **zid.eg**, method, qumra, shopx.store, amazon | Zid ranks with its Egypt site. |
| افضل منصة لانشاء متجر الكتروني | shantaweb, phenixsoft, method, wuilt, easyorders, mosawi9, wahaa.online, fatora | Listicles. PAA: "ما هي أفضل منصة تجارة إلكترونية؟", "ما هو أفضل متجر إلكتروني في مصر؟" |
| تكلفة انشاء متجر الكتروني في مصر | geexar, egessia, elmatajer, tiqnia, hexapert, method, kemetova, softcreation | **Agencies only. No platform has a cost page.** |
| انشاء متجر الكتروني بالذكاء الاصطناعي | jotform, play.google.com, easyorders, manus.im, renderforest, appypie, odoo, storeino | Global AI builders. EasyOrders is the only Egyptian one. |
| بديل شوبيفاي / بديل شوبيفاي في مصر | translate.google, vondera.app, nutajr, baseet.cc / baseet, vondera, nutajr, sell1x, nexamasr, storix-ai, cloudmarkit | Small players only. PAA: "ما هي بدائل شوبيفاي؟", "ما هو سعر اشتراك شوبيفاي في مصر؟", "ازاي ادفع شوبيفاي من مصر؟" |
| شوبيفاي ولا ايزي اوردر | facebook, easyorders (blog), ahmed-abdelhamed, seifgomaa | Personal blogs and posts. |
| بديل ايزي اوردرز | matgarko, sell1x, zabayny, landingpagee, easyorders, facebook, youtube | **Weak SERP and no autocomplete.** The cheapest strong win once S-06 is approved. |
| ايزي اوردرز | app.easy-orders.net, easyorders.eg ×5, facebook, play.google | A navigational brand query. Don't target it. |
| سعر اشتراك شوبيفاي في مصر / هل شوبيفاي يعمل في مصر | shopify.com, wuilt, iconve, youtube… / shopify.com, ahmed-abdelhamed, nilexdigital… | Shopify ranks itself, then small blogs. B8 can rank second. |
| متجر الكتروني الدفع عند الاستلام | jumia, amazon.eg, stunning.so, ramyezat, codwoo, symplysis, kafiil | Mostly shopper intent. Seller pages are thin. |
| افضل منصات التجارة الالكترونية في مصر | phenixsoft, ensignagency, method, easyorders, shantaweb, qumra, takwen, tiyesolutions | Listicles (B1). |
| قوالب متاجر الكترونية مجانية | canva, nutajr, kleap, arawp, site123, elleen, picalica, youtube | `/templates` can compete. Template pages need unique intros. |
| حاسبة هامش الربح | translate.google ×4, laimuna, waj.ai, expandcart, play.google | **Very weak.** The existing tool should rank once the host is fixed. |
| انشاء متجر ملابس اونلاين / متجر مستحضرات تجميل في مصر | matrixclouds, appypie, obayh, stunning, canva / faces.eg, medimix, zynah, noon, mazaya, oriflame | Industry queries are mostly shopper intent, hence P2 for industries. |
| متجر الكتروني على الفيس بوك | facebook ×2, easyorders, mrketly, quora | S5. |
| بوابة دفع مصرية | kashier.io, tap.company, noonpayments, wordpresslicenses, egyhosting | Gateways rank themselves. B4 targets the guide angle. |
| شركات الشحن في مصر واسعارها | **easyorders (blog) #1**, bosta ×2, turbo, migshipment, egyptexpress, aramex | EasyOrders wins carrier queries with a blog post, which B3 can copy. |
| انشاء متجر منتجات رقمية | rmz.gg, zaher.io, salla, fatora, geexar, khamsat, stunning, easyorders | Demand exists, but there's no page until the owner confirms digital products. |
| دروب شيبنج مصر | codeiks, wuilt, dhl, safka-eg, reddit | Skip (no feature). |
| السلات المتروكة | help.salla.sa, noursky, egyhosting, businesschat, javna, codeiks, qawafil | Salla help docs and blogs. F5. |
| الطلبات الوهمية | egyhosting, facebook, storeino, ahmed-abdelhamed, ar-wp, ahram, islamweb | **Weak.** F4 + B7. |
| متجر الكتروني بدون سجل تجاري | x-kaizen, tqniait, ebdea, reyahdigit, matjrah, marketerlek, tiktok | Mostly Saudi context. Owner and legal question (Q7). |

### 6.3 Autocomplete clusters that drive the map (Google, hl=ar, gl=eg)

- **Head:** انشاء متجر الكتروني → مجاني · مجاني في مصر · في مصر · بالذكاء الاصطناعي · مجانا · مجاني بالكامل (plus Saudi, Algeria and Syria variants, which are out of scope).
- **Hamza spelling:** إنشاء متجر إلكتروني → مجاني · مجاني بالذكاء الاصطناعي · **مجاني مدى الحياة** · **مجاني عربي** · مجاني في مصر.
- **Verbs:** عمل متجر الكتروني (مجاني، في مصر، ووردبريس، على شوبيفاي) · فتح متجر الكتروني (mostly KSA, Algeria, Tunisia) · تصميم متجر الكتروني (احترافي، جاهز، بالذكاء الاصطناعي) · كيفية / كيف انشئ (خطوة بخطوة، من الصفر).
- **Platform:** منصة متجر الكتروني → منصة انشاء متجر الكتروني في مصر · افضل منصة لانشاء متجر الكتروني (مجاني، عربية).
- **Cost:** تكلفة انشاء متجر الكتروني → **في مصر (1st)** · كم تكلفة · تكلفة انشاء تطبيق متجر الكتروني.
- **Competitors:** بديل شوبيفاي → مجاني · **المصري** · شوبيفاي في مصر → بديل شوبيفاي في مصر · سعر اشتراك شوبيفاي في مصر · بوابات الدفع في شوبيفاي مصر · ازاي ادفع اشتراك شوبيفاي في مصر · هل شوبيفاي يعمل في مصر · شوبيفاي ولا → **ايزي اوردر** · ووردبريس · ايزي اوردر(ز) → مصر · تسجيل الدخول · اكاديمي · السعودية · سلة ولا زد → وش افضل (Saudi dialect).
- **No suggestions** (low or no demand recorded): بديل ايزي اوردرز · ايزي اوردرز اسعار · ووكومرس ولا شوبيفاي · ويلت ولا · منشئ متاجر · every "انشاء متجر الكتروني لـ<industry>" except digital products · ربط بوسطة / باي موب / فيسبوك بيكسل بالمتجر · تأكيد الطلبات واتساب · كوبون خصم للمتجر · مولد اسماء متاجر.
- **Tools:** اسم متجر / اسماء متاجر (10 + 10 suggestions) · حساب سعر البيع · كيفية حساب سعر البيع للمنتج · حساب نسبة الربح من سعر البيع · حساب تكلفة المنتج (اكسل، شيت) · نموذج سياسة الخصوصية للمتجر · سياسة المرتجعات.
- **English (gl=eg):** shopify egypt (price, fees, payment providers, "does shopify work in egypt", "shopify alternative egypt", "alternative to shopify free") · bosta shopify (integration, app) · paymob shopify (integration, app, plugin) · best ecommerce platform in egypt · easyorders (api, login, app, academy) · "zid egypt".

### 6.4 Summary map and per-page detail

The table lists every page this plan builds or keeps, with its primary keyword. The block for each page gives the full mapping: Arabic and English title, meta description, H1, secondary keywords, intent, market, entities, internal links, and the length check against the repo rule (≤ 62 characters with the brand suffix; descriptions 50–165, with price tokens counted at their rendered EGP length). Compare titles name the brand on purpose; the guard test exempts `compare*` keys, so alternatives titles don't name it. **Search volume and difficulty: n/a (no tool data) for every row.**

| ID | URL | Type | Priority | Primary keyword (ar / en) | Intent | Est. relative demand (qualitative; no tool data) |
|---|---|---|---|---|---|---|
| [H1](#kw-h1) | `/solutions` | Hub | P0 | منصة إنشاء متجر إلكتروني / online store solutions | Navigational / commercial | Low as a query; needed for crawl depth and breadcrumbs |
| [H2](#kw-h2) | `/industries` | Hub | P0 | متجر إلكتروني حسب النشاط / online store by industry | Navigational | Low as a query; replaces the 8 chip links that point at client-only ?category= filters |
| [H3](#kw-h3) | `/features` | Hub | P0 | مميزات منصة المتجر الإلكتروني / online store features | Commercial investigation | Low; needed for crawl depth |
| [H4](#kw-h4) | `/tools` | Hub | P1 | أدوات مجانية للتجار / free tools for online sellers | Informational | Low as a query; Salla /tools and HalaOrders /tools use the same lead-magnet hub |
| [H5](#kw-h5) | `/alternatives` | Hub (gated S-06) | P2 | بدائل منصات المتاجر الإلكترونية / ecommerce platform alternatives | Commercial investigation | See H-children |
| [S1](#kw-s1) | `/solutions/free-online-store` | Core landing | P0 | انشاء متجر الكتروني مجاني / create a free online store | Transactional | Highest seen: top autocomplete suggestion for both spellings, plus 5 variants (مدى الحياة، بالكامل، عربي، بالذكاء الاصطناعي) |
| [S2](#kw-s2) | `/solutions/online-store-egypt` | Core landing | P0 | انشاء متجر الكتروني في مصر / ecommerce platform Egypt | Commercial / transactional | High: 2nd–4th autocomplete slot; SERP is Wuilt, EasyOrders, Shanta, Zid, Qumra + agencies |
| [S3](#kw-s3) | `/solutions/create-online-store` | Core landing | P0 | انشاء متجر الكتروني / create an online store | Transactional + how-to | High: head term; Wuilt, Salla, EasyOrders, Khamsat, Odoo rank |
| [S4](#kw-s4) | `/solutions/cash-on-delivery-store` | Core landing | P1 | متجر الكتروني الدفع عند الاستلام / cash on delivery online store | Commercial (mixed: shoppers dominate the SERP) | Medium for sellers: the SERP is Jumia/Amazon shopper pages, so few seller pages compete |
| [S5](#kw-s5) | `/solutions/facebook-page-to-store` | Core landing | P2 | متجر الكتروني على الفيس بوك / Facebook page to online store | Informational → transactional | Medium: 4 suggestions; SERP is Facebook help + EasyOrders |
| [F1](#kw-f1) | `/features/ai-online-store` | Feature | P0 | انشاء متجر الكتروني بالذكاء الاصطناعي / AI online store builder | Commercial | High and rising: 'بالذكاء الاصطناعي' appears under every store query; SERP is Jotform, Manus, Renderforest, EasyOrders, Storeino. Claims limited to live AI (F-82 builder is off) |
| [F2](#kw-f2) | `/features/store-design` | Feature | P1 | تصميم متجر الكتروني / online store design | Commercial | High: 10 suggestions incl. احترافي/جاهز/مجاني; Khamsat freelancers dominate (agency intent) |
| [F3](#kw-f3) | `/features/custom-domain` | Feature | P1 | ربط دومين بالمتجر / connect domain to online store | Informational / how-to | Medium: 'ربط دومين' suggestions are all platform-named (سلة، زد، شوبيفاي) |
| [F4](#kw-f4) | `/features/fake-order-protection` | Feature | P1 | الطلبات الوهمية / fake COD orders | Problem-aware commercial | Medium; weak SERP (egyhosting, Facebook, Storeino). EasyOrders and Lightfunnels sell this as core |
| [F5](#kw-f5) | `/features/abandoned-checkouts` | Feature | P1 | السلات المتروكة / abandoned checkout recovery | Commercial | Medium: 8 suggestions, Salla help pages rank; ExpandCart sells it only on its 4,599 جنيه plan |
| [F6](#kw-f6) | `/features/shipping` | Feature | P1 | شحن الطلبات في مصر / shipping for online stores in Egypt | Commercial | Medium; carrier SERPs belong to carriers, so target the 'for my store' angle |
| [F7](#kw-f7) | `/features/order-management` | Feature | P2 | إدارة طلبات المتجر الإلكتروني / order management for online stores | Commercial | Low-medium; 'ادارة الطلبات' SERP is government noise, so the long tail matters |
| [F8](#kw-f8) | `/features/email-marketing` | Feature | P2 | حملات البريد الإلكتروني للمتجر / email marketing for online stores | Commercial | Low as an Arabic query; supports the Free vs Pro story (500 vs 10,000 emails) |
| [F9](#kw-f9) | `/features/offers-and-coupons` | Feature | P2 | كوبون خصم للمتجر / coupons and quantity offers | Commercial | Low as a query (no suggestions); conversion page for ads and EasyOrders switchers |
| [F10](#kw-f10) | `/features/reports` | Feature | P2 | تقارير مبيعات المتجر الإلكتروني / online store analytics | Commercial | Low; 'نسبة المرتجعات' suggestions show the refusal-rate angle |
| [F11](#kw-f11) | `/features/store-app` | Feature | P2 | تطبيق متجر الكتروني / store app for customers | Commercial | Medium: 4 suggestions incl. cost; honest framing: an installable web app (PWA), not App Store |
| [F12](#kw-f12) | `/features/ai-assistants-mcp` | Feature | P3 | ربط المتجر مع ChatGPT / manage store products from ChatGPT or Claude | Commercial (early adopters) | Low; Salla has help articles for the same; YouCan has /mcp. Claim products only (F-29c/f) |
| [F13](#kw-f13) | `/features/customers` | Feature | P3 | قائمة عملاء المتجر / customer list for online stores | Commercial | Low |
| [F14](#kw-f14) | `/features/store-seo` | Feature | P3 | تحسين ظهور المتجر في محركات البحث / online store SEO | Commercial | Low; Shanta locks SEO to its 1,500 جنيه Pro plan (a clear contrast) |
| [F15](#kw-f15) | `/features/product-management` | Feature | P3 | إدارة منتجات المتجر الإلكتروني / product management for online stores | Commercial | Low as a query; supports switchers (bulk edit and Excel export are top EasyOrders roadmap requests) |
| [I1](#kw-i1) | `/integrations/bosta` | Integration (feature template) | P1 | ربط بوسطة بالمتجر / Bosta integration | Commercial / how-to | Medium: 'bosta shopify integration/app' suggestions show sellers look for this pairing; Bosta officially lists only Shopify and WooCommerce |
| [I2](#kw-i2) | `/integrations/paymob` | Integration | P1 | ربط باي موب بالمتجر / Paymob integration | Commercial / how-to | Medium: 'paymob shopify integration/app/plugin' cluster; contrast: Shopify Basic adds 2% on third-party gateways |
| [I3](#kw-i3) | `/integrations/kashier` | Integration | P1 | بوابة دفع كاشير / Kashier integration | Commercial / how-to | Medium: 'بوابة دفع كاشير' is the 2nd suggestion for 'بوابة دفع'; kashier.io ranks #1 for 'بوابة دفع مصرية' |
| [I4](#kw-i4) | `/integrations/instapay-wallets` | Integration | P2 | بوابة دفع فودافون كاش / InstaPay and Vodafone Cash for online stores | Commercial | Medium: 'بوابة دفع فودافون كاش' suggestion; HalaOrders and Shanta list these. ROADMAP §2.1 still says transfers go to Tallaby's accounts: confirm the F-21p code path before claiming |
| [I5](#kw-i5) | `/integrations/wassalha` | Integration | P2 | الشحن مع البريد المصري للمتجر / Wassalha Egypt Post shipping sheet | Commercial | Low-medium; must say 'export sheet', never 'sends directly' |
| [I6](#kw-i6) | `/integrations/product-catalogs` | Integration | P2 | كتالوج فيسبوك للمتجر / product feed for Meta and Google | How-to / commercial | Medium: 'كتالوج فيسبوك' + 'google merchant center feed' suggestions. TikTok catalog is the feed only; the TikTok pixel is 'soon' |
| [I7](#kw-i7) | `/integrations/shopify-import` | Integration | P2 | نقل متجر شوبيفاي / import products from Shopify | Transactional (switchers) | Low as a query; the migration step every alternatives page needs. Naming Shopify here is a feature fact, not a comparison; still ask S-06 |
| [I8](#kw-i8) | `/integrations/google-analytics` | Integration | P3 | ربط المتجر بجوجل أناليتكس / connect store to Google Analytics 4 | How-to | Low; merge GTM into this page |
| [I9](#kw-i9) | `/integrations/google-sheets` | Integration | P3 | تصدير الطلبات إلى جوجل شيت / export orders to Google Sheets | How-to | Low; YouCan and Lightfunnels market 'COD sheets' to the same sellers |
| [T1](#kw-t1) | `/tools/profit-margin-calculator` | Tool | P1 | حاسبة هامش الربح / profit margin calculator | Informational / tool | Medium: weak SERP (laimuna, waj.ai, ExpandCart); calculator already returns suggestedPrice and breakEvenPrice |
| [T2](#kw-t2) | `/tools/store-cost-calculator` | Tool | P1 | تكلفة انشاء متجر الكتروني في مصر / online store cost calculator Egypt | Commercial investigation | High-medium: 'تكلفة انشاء متجر الكتروني في مصر' is the 1st suggestion; SERP is only agencies (geexar, egessia, elmatajer) |
| [T3](#kw-t3) | `/tools/store-name-generator` | Tool | P2 | اسماء متاجر الكترونية / online store name generator | Informational / tool | High breadth: 10 suggestions under 'اسم متجر' and 'اسماء متاجر'. Build without AI calls (word lists + rules) to stay inside docs/ai.md |
| [T4](#kw-t4) | `/tools/platform-fee-calculator` | Tool | P2 | حاسبة رسوم منصة المتجر / ecommerce platform fee calculator | Commercial investigation | Medium: 'shopify egypt fees' / 'what percentage does shopify take' suggestions. Competitor presets show only while COMPARE_PUBLIC |
| [T5](#kw-t5) | `/tools/return-policy-generator` | Tool | P3 | نموذج سياسة الاسترجاع للمتجر / return policy template for online store | Informational / tool | Low-medium ('سياسة المرتجعات'); ExpandCart runs the same lead-magnet set. Needs legal review of the template text |
| [T6](#kw-t6) | `/tools/privacy-policy-generator` | Tool | P3 | نموذج سياسة الخصوصية للمتجر / privacy policy template for online store | Informational / tool | Low ('نموذج سياسة الخصوصية للمتجر' suggestion). Legal review required |
| [N1](#kw-n1) | `/industries/clothing-store` | Industry | P1 | انشاء متجر ملابس / online clothing store | Transactional (seller) / mixed | Medium: 'متجر ملابس اونلاين مصر'; shoes merged here (1 shoes-bags template) |
| [N2](#kw-n2) | `/industries/beauty-store` | Industry | P2 | متجر مستحضرات تجميل / online beauty store | Transactional (seller) / mixed | Medium (seller angle); SERP is shopper stores (faces.eg, noon) |
| [N3](#kw-n3) | `/industries/perfume-store` | Industry | P2 | متجر عطور اونلاين / online perfume store | Transactional (seller) / mixed | Low-medium; Shanta targets perfume on its home page |
| [N4](#kw-n4) | `/industries/electronics-store` | Industry | P2 | متجر الكترونيات / online electronics store | Transactional (seller) / mixed | Medium: 'متجر الكترونيات مصر' + mobile accessories suggestions |
| [N5](#kw-n5) | `/industries/home-furniture-store` | Industry | P2 | متجر اثاث / online furniture store | Transactional (seller) / mixed | Medium but KSA-heavy SERP; Shanta targets furniture |
| [N6](#kw-n6) | `/industries/jewelry-accessories-store` | Industry | P2 | متجر اكسسوارات / online jewelry and accessories store | Transactional (seller) / mixed | Medium: 'متجر اكسسوارات' has 10 suggestions; 'متجر مجوهرات' is brand noise |
| [N7](#kw-n7) | `/industries/food-store` | Industry | P2 | متجر اكل اونلاين / online food store | Transactional (seller) / mixed | Low as a seller query; grocery and sweets merged here |
| [N8](#kw-n8) | `/industries/kids-store` | Industry | P3 | متجر ملابس اطفال / online kids store | Transactional (seller) / mixed | Low (not researched in depth) |
| [N9](#kw-n9) | `/industries/car-accessories-store` | Industry | P3 | متجر اكسسوارات سيارات / online car accessories store | Transactional (seller) / mixed | Low-medium: 'متجر اكسسوارات سيارات' suggestion |
| [N10](#kw-n10) | `/industries/handmade-store` | Industry | P3 | متجر هاند ميد / online handmade store | Transactional (seller) / mixed | Low |
| [N11](#kw-n11) | `/industries/sports-store` | Industry | P3 | متجر ملابس رياضية / online sportswear store | Transactional (seller) / mixed | Low (not researched in depth) |
| [C1](#kw-c1) | `/compare/tallaby-vs-easyorders` | Comparison (gated S-06) | P1 | طلبي ولا ايزي اوردرز / Tallaby vs EasyOrders | Commercial investigation | Brand demand high ('ايزي اوردرز' 10 suggestions incl. مصر/اسعار-intent 'easy orders pricing'); 'شوبيفاي ولا ايزي اوردر' suggestion |
| [C2](#kw-c2) | `/compare/tallaby-vs-shopify` | Comparison (gated S-06) | P1 | طلبي ولا شوبيفاي / Tallaby vs Shopify | Commercial investigation | High: 'شوبيفاي في مصر' cluster (سعر اشتراك، بوابات الدفع، هل يعمل في مصر) |
| [C3](#kw-c3) | `/compare/tallaby-vs-woocommerce` | Comparison (gated S-06) | P2 | طلبي ولا ووكومرس / Tallaby vs WooCommerce | Commercial investigation | Medium: 'ووكومرس باللغة العربية', 'متجر ووردبريس' |
| [C4](#kw-c4) | `/compare/tallaby-vs-facebook-only` | Comparison (gated S-06) | P2 | طلبي ولا صفحة فيسبوك / Tallaby vs a Facebook page | Commercial investigation | Medium via 'البيع على الفيس بوك' |
| [C5](#kw-c5) | `/compare/tallaby-vs-wuilt` | Comparison (gated S-06) | P2 | طلبي ولا ويلت / Tallaby vs Wuilt | Commercial investigation | Medium: 'wuilt egypt', 'ويلت دوت كوم'; Wuilt ranks #1 for 3 head terms |
| [C6](#kw-c6) | `/compare/tallaby-vs-zid` | Comparison (gated S-06) | P2 | طلبي ولا زد / Tallaby vs Zid | Commercial investigation | Low in Egypt ('zid egypt' only); Zid publishes switcher pages itself |
| [C7](#kw-c7) | `/compare/tallaby-vs-expandcart` | Comparison (gated S-06) | P3 | طلبي ولا اكسباند كارت / Tallaby vs ExpandCart | Commercial investigation | Low-medium: 'باقات اكسباند كارت', 'expandcart egypt' |
| [C8](#kw-c8) | `/compare/tallaby-vs-youcan` | Comparison (gated S-06) | P3 | طلبي ولا يوكان / Tallaby vs YouCan | Commercial investigation | Low in Egypt (brand noise: skincare, gyms) |
| [C9](#kw-c9) | `/compare/tallaby-vs-lightfunnels` | Comparison (gated S-06) | P3 | طلبي ولا لايت فانلز / Tallaby vs Lightfunnels | Commercial investigation | Low: 'lightfunnels pricing', 'lightfunnels vs shopify' |
| [C10](#kw-c10) | `/compare/tallaby-vs-qumra` | Comparison (gated S-06) | P3 | طلبي ولا قمرة / Tallaby vs Qumra | Commercial investigation | Very low ('qumra store') |
| [C11](#kw-c11) | `/compare/tallaby-vs-shanta` | Comparison (gated S-06) | P3 | طلبي ولا شنطة / Tallaby vs Shanta | Commercial investigation | Very low ('شنطة ويب') |
| [C12](#kw-c12) | `/compare/tallaby-vs-halaorders` | Comparison (gated S-06) | P3 | طلبي ولا هلا أوردرز / Tallaby vs HalaOrders | Commercial investigation | None seen (no suggestions) |
| [C13](#kw-c13) | `/compare/tallaby-vs-salla` | Comparison (gated S-06) | P3 | طلبي ولا سلة / Tallaby vs Salla | Commercial investigation | Medium brand demand but Saudi; 'سلة مصر' is noise; Salla needs a Saudi CR to verify |
| [C14](#kw-c14) | `/compare/tallaby-vs-wix` | Comparison (gated S-06) | P3 | طلبي ولا ويكس / Tallaby vs Wix | Commercial investigation | Low in Arabic Egypt; Wix has no Arabic dashboard (verified) |
| [A1](#kw-a1) | `/alternatives/easyorders` | Alternatives (gated S-06) | P1 | بديل ايزي اوردرز / EasyOrders alternative | Commercial investigation | No autocomplete (low or new demand), but the SERP is weak: matgarko, sell1x, zabayny, landingpagee, plus EasyOrders itself. EasyOrders' own blog still quotes its old $0.02/$50 prices |
| [A2](#kw-a2) | `/alternatives/shopify` | Alternatives (gated S-06) | P1 | بديل شوبيفاي في مصر / Shopify alternative | Commercial investigation | High: 3 suggestions incl. 'المصري' and 'مجاني'; SERP is small players (baseet, vondera, nutajr, sell1x). Shopify Basic adds 2% on every card order in Egypt (no Shopify Payments) |
| [A3](#kw-a3) | `/alternatives/woocommerce` | Alternatives (gated S-06) | P2 | بديل ووكومرس / WooCommerce alternative | Commercial investigation | Low-medium (not autocomplete-tested for 'بديل') |
| [A4](#kw-a4) | `/alternatives/wuilt` | Alternatives (gated S-06) | P3 | بديل ويلت / Wuilt alternative | Commercial investigation | Low; Wuilt is free in Egypt, so the page must argue tools, not price |
| [A5](#kw-a5) | `/alternatives/salla` | Alternatives (gated S-06) | P3 | بديل سلة في مصر / Salla alternative | Commercial investigation | Low-medium; real gap: Salla needs a Saudi commercial registration, so Egyptian sellers search for an equivalent |
| [A6](#kw-a6) | `/alternatives/expandcart` | Alternatives (gated S-06) | P3 | بديل اكسباند كارت / ExpandCart alternative | Commercial investigation | Low ('باقات اكسباند كارت' shows price-checking); ExpandCart's 599 جنيه plan allows 100 products and 1 template, and abandoned carts sit on its 4,599 جنيه plan |
| [A7](#kw-a7) | `/alternatives/wix` | Alternatives (gated S-06) | P3 | بديل ويكس للمتاجر / Wix alternative | Commercial investigation | Low in Arabic Egypt; clear angle: Wix has no Arabic dashboard and no Paymob or Bosta (verified), and its free plan can't take payments |
| [B1](#kw-b1) | `/blog/best-ecommerce-platforms-egypt` | Blog article | P1 | افضل منصة لانشاء متجر الكتروني / best ecommerce platform in Egypt | Informational | High: 3 suggestion families; SERP: Shanta, phenixsoft, method.com.eg, Wuilt, EasyOrders, Qumra; HalaOrders' 11-platform list omits Tallaby. Code layout RankingArticleView already built; gated by S-06 |
| [B2](#kw-b2) | `/blog/online-store-cost-egypt` | Blog article | P1 | تكلفة انشاء متجر الكتروني في مصر / online store cost in Egypt | Informational | High-medium; agency-only SERP; pairs with T2 |
| [B3](#kw-b3) | `/blog/shipping-companies-egypt` | Blog article | P2 | شركات الشحن في مصر / shipping companies in Egypt for online stores | Informational | High breadth (10 suggestions) but carriers own the head term; EasyOrders ranks #1 with a blog post. No carrier prices unless sourced and dated |
| [B4](#kw-b4) | `/blog/payment-gateways-egypt` | Blog article | P2 | بوابة دفع مصرية / payment gateways in Egypt | Informational | High breadth (10 suggestions); gateway brands rank (Kashier, Tap). Gateway KYC facts need sources |
| [B5](#kw-b5) | `/blog/cod-vs-online` | Blog article | P2 | الدفع عند الاستلام ام الدفع الالكتروني / cash on delivery vs online payment | Informational | Medium |
| [B6](#kw-b6) | `/blog/how-to-sell-online-egypt` | Blog article | P2 | البيع اونلاين في مصر / how to sell online in Egypt | Informational | Medium-high (Egyptian dialect queries 'ازاي'); Wuilt, GoDaddy, Amazon rank |
| [B7](#kw-b7) | `/blog/reduce-fake-orders` | Blog article | P2 | تقليل الطلبات الوهمية / how to reduce fake COD orders | Informational | Medium; HalaOrders has a post on it. Do not present deposits (F-21) as live |
| [B8](#kw-b8) | `/blog/shopify-in-egypt` | Blog article | P2 | هل شوبيفاي يعمل في مصر / does Shopify work in Egypt | Informational | High: 6 suggestions under 'شوبيفاي في مصر'; Shopify itself ranks #1. Gated with S-06 because it names a competitor |
| [B9](#kw-b9) | `/blog/shopify-vs-easyorders` | Blog article | P3 | شوبيفاي ولا ايزي اوردر / Shopify vs EasyOrders | Informational | Medium: the exact suggestion exists; SERP is Facebook posts + EasyOrders blog. Gated |
| [B10](#kw-b10) | `/blog/first-100-orders` | Blog article | P3 | كيفية الحصول على أول 100 طلب / how to get your first 100 online orders | Informational | Low as a query (no suggestions); strong for social and the newsletter |
| [B15](#kw-b15) | `/blog/pricing-products` | Blog article | P2 | تسعير المنتجات / how to price products for online selling | Informational | Medium: 10 suggestions under 'تسعير المنتجات' (mostly other sectors) plus 'كيفية حساب سعر البيع للمنتج' |
| [B16](#kw-b16) | `/blog/best-free-ecommerce-platforms` | Blog article | P2 | افضل منصة لانشاء متجر الكتروني مجاني / best free ecommerce platforms | Informational | Medium-high: Shanta's 'best free platform in Egypt' post ranks top 3 for the head terms and names only Shanta. Gated (names competitors); must not take S1's 'انشاء متجر مجاني' head term |
| [B17](#kw-b17) | `/blog/best-products-to-sell-egypt` | Blog article | P2 | افضل المنتجات للبيع اونلاين / best products to sell online in Egypt | Informational | Medium (not autocomplete-tested); HalaOrders has 'best products to sell online Egypt'. No invented sales statistics |
| [B18](#kw-b18) | `/blog/market-online-store` | Blog article | P3 | تسويق المتجر الالكتروني / how to market your online store | Informational | Medium (not autocomplete-tested); merges 'increase sales' |
| [B19](#kw-b19) | `/blog/build-ecommerce-brand` | Blog article | P3 | بناء علامة تجارية للمتجر / how to build an ecommerce brand | Informational | Low-medium; HalaOrders' home title targets 'ابنِ علامتك التجارية في مصر' |
| [B20](#kw-b20) | `/blog/shopify-vs-woocommerce` | Blog article | P3 | شوبيفاي ولا ووكومرس / Shopify vs WooCommerce | Informational | Medium: 'شوبيفاي ولا ووردبريس' suggestion; Shopify and Woo publish their own vs pages (English). Gated |

<a id="kw-h1"></a>

#### H1 `/solutions` (P0, New)

| Field | Arabic (default, unprefixed URL) | English (`/en/solutions`) |
|---|---|---|
| Primary keyword | منصة إنشاء متجر إلكتروني | online store solutions |
| SEO title (`meta.<key>.title`; the layout adds the brand) | حلول طلبي لإنشاء متجرك الإلكتروني وإدارته | Online store solutions for every seller |
| Meta description | كل صفحات حلول طلبي في مكان واحد: متجر مجاني، متجر في مصر، الدفع عند الاستلام، ومن صفحة فيسبوك إلى متجر. اختر ما يناسب تجارتك. | Every Tallaby solution in one place: a free store, a store for Egypt, cash on delivery, and moving from a Facebook page to a store. |
| H1 | حلول لكل تاجر يريد البيع أونلاين | Solutions for every seller who wants to sell online |
| Secondary keywords | حلول المتاجر الإلكترونية، منصات المتاجر الالكترونية | sentence-case English equivalents |
| Intent · market | Navigational / commercial · EG, ar first | same page, English locale |
| Related entities | Tallaby, online store, Egypt | |
| Internal links out | all /solutions/*, /pricing, /templates, /industries | same paths under `/en` |
| Lengths (checked by script, same rule as `seo.lib.test.ts`) | ar 48/62 · en 49/62 · desc ar 125, en 131 | |

<a id="kw-h2"></a>

#### H2 `/industries` (P0, New)

| Field | Arabic (default, unprefixed URL) | English (`/en/industries`) |
|---|---|---|
| Primary keyword | متجر إلكتروني حسب النشاط | online store by industry |
| SEO title (`meta.<key>.title`; the layout adds the brand) | متاجر إلكترونية جاهزة حسب نوع نشاطك | Online stores for every kind of business |
| Meta description | اختر نوع نشاطك، ملابس أو عطور أو إلكترونيات أو أثاث، وابدأ بقالب جاهز ومميزات تناسب ما تبيعه. | Pick what you sell, from clothing and perfume to electronics and furniture, and start with a ready template and the tools that fit it. |
| H1 | متجر يناسب ما تبيعه | A store that fits what you sell |
| Secondary keywords | انشاء متجر ملابس، متجر عطور، متجر مستحضرات تجميل | sentence-case English equivalents |
| Intent · market | Navigational · EG | same page, English locale |
| Related entities | store templates, categories | |
| Internal links out | all /industries/*, /templates (with category chips) | same paths under `/en` |
| Lengths (checked by script, same rule as `seo.lib.test.ts`) | ar 42/62 · en 50/62 · desc ar 93, en 134 | |

<a id="kw-h3"></a>

#### H3 `/features` (P0, New)

| Field | Arabic (default, unprefixed URL) | English (`/en/features`) |
|---|---|---|
| Primary keyword | مميزات منصة المتجر الإلكتروني | online store features |
| SEO title (`meta.<key>.title`; the layout adds the brand) | مميزات طلبي: كل ما يحتاجه متجرك للبيع | Tallaby features: everything your store needs |
| Meta description | تصميم بالسحب والإفلات، ذكاء اصطناعي يكتب منتجاتك، الدفع عند الاستلام، الشحن مع بوسطة، والحماية من الطلبات الوهمية. | Drag-and-drop design, AI that writes your products, cash on delivery, Bosta shipping and fake-order protection, all in one dashboard. |
| H1 | كل ما يحتاجه متجرك، في لوحة تحكم واحدة | Everything your store needs, in one dashboard |
| Secondary keywords | مميزات طلبي | sentence-case English equivalents |
| Intent · market | Commercial investigation · EG | same page, English locale |
| Related entities | features | |
| Internal links out | all /features/*, /integrations, /pricing | same paths under `/en` |
| Lengths (checked by script, same rule as `seo.lib.test.ts`) | ar 44/62 · en 55/62 · desc ar 114, en 133 | |

<a id="kw-h4"></a>

#### H4 `/tools` (P1, New)

| Field | Arabic (default, unprefixed URL) | English (`/en/tools`) |
|---|---|---|
| Primary keyword | أدوات مجانية للتجار | free tools for online sellers |
| SEO title (`meta.<key>.title`; the layout adds the brand) | أدوات مجانية لأصحاب المتاجر الإلكترونية | Free tools for online store owners |
| Meta description | حاسبات وأدوات مجانية دون تسجيل: هامش الربح وسعر البيع، تكلفة المتجر، وأسماء المتاجر. صُممت للتاجر في مصر. | Free tools with no signup: profit margin and selling price, store cost and store names. Made for sellers in Egypt. |
| H1 | أدوات مجانية تساعدك على البيع | Free tools that help you sell |
| Secondary keywords | حاسبة هامش الربح، مولد أسماء المتاجر | sentence-case English equivalents |
| Intent · market | Informational · EG | same page, English locale |
| Related entities | calculators | |
| Internal links out | all /tools/*, /blog | same paths under `/en` |
| Lengths (checked by script, same rule as `seo.lib.test.ts`) | ar 46/62 · en 44/62 · desc ar 105, en 114 | |

<a id="kw-h5"></a>

#### H5 `/alternatives` (P2, New, gated)

| Field | Arabic (default, unprefixed URL) | English (`/en/alternatives`) |
|---|---|---|
| Primary keyword | بدائل منصات المتاجر الإلكترونية | ecommerce platform alternatives |
| SEO title (`meta.<key>.title`; the layout adds the brand) | بدائل منصات المتاجر الإلكترونية للتاجر في مصر | Ecommerce platform alternatives for Egypt |
| Meta description | تبحث عن بديل لمنصتك الحالية؟ قارن الأسعار والرسوم والشحن والدفع في مصر بمصادر وتواريخ واضحة، ثم انقل متجرك. | Looking for an alternative to your platform? Compare prices, fees, shipping and payments in Egypt, with sources and dates, then move. |
| H1 | بدائل لمنصتك الحالية، بمصادر واضحة | Alternatives to your current platform, with sources |
| Secondary keywords | بديل شوبيفاي، بديل ايزي اوردرز | sentence-case English equivalents |
| Intent · market | Commercial investigation · EG | same page, English locale |
| Related entities | Shopify, EasyOrders, WooCommerce | |
| Internal links out | /alternatives/*, /compare | same paths under `/en` |
| Lengths (checked by script, same rule as `seo.lib.test.ts`) | ar 52/62 · en 51/62 · desc ar 107, en 133 | |

<a id="kw-s1"></a>

#### S1 `/solutions/free-online-store` (P0, New)

| Field | Arabic (default, unprefixed URL) | English (`/en/solutions/free-online-store`) |
|---|---|---|
| Primary keyword | انشاء متجر الكتروني مجاني | create a free online store |
| SEO title (`meta.<key>.title`; the layout adds the brand) | إنشاء متجر إلكتروني مجاني دون اشتراك شهري | Create a free online store, no monthly fee |
| Meta description | أنشئ متجرك الإلكتروني دون اشتراك شهري: {orderFee} عن كل طلب فقط، وطلباتك تظهر من اليوم الأول. ابدأ في دقائق. | Open your online store with no monthly fee: {orderFee} per order, and orders show from day one. Set it up in minutes. |
| H1 | متجر إلكتروني مجاني، دون اشتراك شهري | A free online store, with no monthly fee |
| Secondary keywords | إنشاء متجر إلكتروني مجاني، انشاء متجر الكتروني مجانا، متجر الكتروني مجاني، انشاء متجر الكتروني مجاني بالكامل، موقع لانشاء متجر الكتروني مجاني | sentence-case English equivalents |
| Intent · market | Transactional · EG + Arab region, ar | same page, English locale |
| Related entities | Free plan, per-order fee, grace period, COD, templates | |
| Internal links out | /pricing, /templates, /solutions/online-store-egypt, /tools/profit-margin-calculator, /faq#payments | same paths under `/en` |
| Lengths (checked by script, same rule as `seo.lib.test.ts`) | ar 48/62 · en 52/62 · desc ar 110, en 119 | |

<a id="kw-s2"></a>

#### S2 `/solutions/online-store-egypt` (P0, New)

| Field | Arabic (default, unprefixed URL) | English (`/en/solutions/online-store-egypt`) |
|---|---|---|
| Primary keyword | انشاء متجر الكتروني في مصر | ecommerce platform Egypt |
| SEO title (`meta.<key>.title`; the layout adds the brand) | منصة إنشاء متجر إلكتروني في مصر بالجنيه | An ecommerce platform built for Egypt |
| Meta description | متجر إلكتروني مصمم للتاجر في مصر: الدفع عند الاستلام، بوسطة، Paymob وكاشير، ومناطق شحن لكل محافظة. ابدأ دون اشتراك شهري. | An online store made for sellers in Egypt: cash on delivery, Bosta, your own Paymob or Kashier, and shipping zones by governorate. |
| H1 | متجرك الإلكتروني في مصر، بأدوات مصرية | Your online store in Egypt, with local tools |
| Secondary keywords | منصة انشاء متجر الكتروني في مصر، إنشاء متجر إلكتروني مجاني في مصر، منصات التجارة الالكترونية في مصر، best ecommerce platform in egypt | sentence-case English equivalents |
| Intent · market | Commercial / transactional · EG only | same page, English locale |
| Related entities | Egypt, governorates, Bosta, Paymob, Kashier, InstaPay, Vodafone Cash, EGP | |
| Internal links out | /integrations/bosta, /integrations/paymob, /solutions/cash-on-delivery-store, /pricing, /blog/online-store-cost-egypt | same paths under `/en` |
| Lengths (checked by script, same rule as `seo.lib.test.ts`) | ar 46/62 · en 47/62 · desc ar 120, en 130 | |

<a id="kw-s3"></a>

#### S3 `/solutions/create-online-store` (P0, Exists (retarget))

| Field | Arabic (default, unprefixed URL) | English (`/en/solutions/create-online-store`) |
|---|---|---|
| Primary keyword | انشاء متجر الكتروني | create an online store |
| SEO title (`meta.<key>.title`; the layout adds the brand) | إنشاء متجر إلكتروني خطوة بخطوة دون مبرمج | Create an online store step by step |
| Meta description | أنشئ متجرك الإلكتروني بنفسك في خطوات واضحة: اختر قالبًا، أضف منتجاتك بالذكاء الاصطناعي، فعّل الدفع والشحن، ثم انشر متجرك. | Build your own online store in clear steps: pick a template, add products with AI, turn on payments and shipping, then publish. |
| H1 | أنشئ متجرك الإلكتروني خطوة بخطوة | Create your online store, step by step |
| Secondary keywords | خطوات انشاء متجر الكتروني، كيفية انشاء متجر الكتروني خطوة بخطوة، كيف انشئ متجر الكتروني، عمل متجر الكتروني، فتح متجر الكتروني | sentence-case English equivalents |
| Intent · market | Transactional + how-to · EG + Arab region | same page, English locale |
| Related entities | steps, templates, AI product writer, COD, publish | |
| Internal links out | /templates, /features/ai-online-store, /features/store-design, /pricing, /solutions/free-online-store | same paths under `/en` |
| Lengths (checked by script, same rule as `seo.lib.test.ts`) | ar 47/62 · en 45/62 · desc ar 121, en 127 | |

<a id="kw-s4"></a>

#### S4 `/solutions/cash-on-delivery-store` (P1, New)

| Field | Arabic (default, unprefixed URL) | English (`/en/solutions/cash-on-delivery-store`) |
|---|---|---|
| Primary keyword | متجر الكتروني الدفع عند الاستلام | cash on delivery online store |
| SEO title (`meta.<key>.title`; the layout adds the brand) | متجر إلكتروني بالدفع عند الاستلام من أول يوم | An online store with cash on delivery built in |
| Meta description | الدفع عند الاستلام مفعل في كل متجر من البداية، مع حماية من الطلبات الوهمية وتأكيد عبر واتساب ومناطق شحن لكل محافظة. | Cash on delivery is on for every store from the start, with fake-order protection, WhatsApp confirmation and shipping zones. |
| H1 | الدفع عند الاستلام، جاهز في متجرك | Cash on delivery, ready in your store |
| Secondary keywords | الدفع عند الاستلام، تأكيد الطلبات، الطلبات الوهمية، cash on delivery ecommerce platform | sentence-case English equivalents |
| Intent · market | Commercial (mixed: shoppers dominate the SERP) · EG | same page, English locale |
| Related entities | COD, fake orders, WhatsApp confirm, Bosta, riders | |
| Internal links out | /features/fake-order-protection, /features/shipping, /integrations/bosta, /blog/cod-vs-online | same paths under `/en` |
| Lengths (checked by script, same rule as `seo.lib.test.ts`) | ar 51/62 · en 56/62 · desc ar 115, en 124 | |

<a id="kw-s5"></a>

#### S5 `/solutions/facebook-page-to-store` (P2, New)

| Field | Arabic (default, unprefixed URL) | English (`/en/solutions/facebook-page-to-store`) |
|---|---|---|
| Primary keyword | متجر الكتروني على الفيس بوك | Facebook page to online store |
| SEO title (`meta.<key>.title`; the layout adds the brand) | حوّل صفحتك على فيسبوك إلى متجر إلكتروني | Turn your Facebook page into an online store |
| Meta description | توقف عن استقبال الطلبات في الرسائل. متجر برابط خاص، سلة وطلبات منظمة، وكتالوج منتجات يرتبط بفيسبوك وإنستجرام. | Stop taking orders in messages. Get a store link, a real cart, organised orders and a product catalog for Facebook and Instagram. |
| H1 | من الرسائل إلى متجر يستقبل الطلبات | From messages to a store that takes orders |
| Secondary keywords | انشاء متجر الكتروني على الفيس بوك، البيع على الفيس بوك، كيفية البيع على الفيس بوك | sentence-case English equivalents |
| Intent · market | Informational → transactional · EG | same page, English locale |
| Related entities | Facebook, Instagram, Meta catalog, Meta Pixel | |
| Internal links out | /integrations/product-catalogs, /integrations/meta-pixel, /compare/tallaby-vs-facebook-only (when public), /blog/dms-to-store | same paths under `/en` |
| Lengths (checked by script, same rule as `seo.lib.test.ts`) | ar 46/62 · en 54/62 · desc ar 109, en 129 | |

<a id="kw-f1"></a>

#### F1 `/features/ai-online-store` (P0, New)

| Field | Arabic (default, unprefixed URL) | English (`/en/features/ai-online-store`) |
|---|---|---|
| Primary keyword | انشاء متجر الكتروني بالذكاء الاصطناعي | AI online store builder |
| SEO title (`meta.<key>.title`; the layout adds the brand) | متجر إلكتروني بالذكاء الاصطناعي يكتب منتجاتك | AI for your online store: products written for you |
| Meta description | صوّر منتجك أو ارفع ملفًا، والذكاء الاصطناعي يكتب الاسم والوصف وبيانات الظهور في البحث بالعربية والإنجليزية. راجع ثم انشر. | Take a photo or upload a file, and AI writes the name, description and search fields in Arabic and English. Review it, then publish. |
| H1 | ذكاء اصطناعي يكتب منتجاتك بلغتين | AI that writes your products in two languages |
| Secondary keywords | متجر الكتروني بالذكاء الاصطناعي، إنشاء متجر إلكتروني مجاني بالذكاء الاصطناعي، تصميم متجر الكتروني بالذكاء الاصطناعي | sentence-case English equivalents |
| Intent · market | Commercial · EG + Arab region | same page, English locale |
| Related entities | AI product autofill, Arabic, English, SEO fields, AI credits, MCP | |
| Internal links out | /features/ai-assistants-mcp, /solutions/create-online-store, /pricing (credits), /templates | same paths under `/en` |
| Lengths (checked by script, same rule as `seo.lib.test.ts`) | ar 51/62 · en 60/62 · desc ar 121, en 132 | |

<a id="kw-f2"></a>

#### F2 `/features/store-design` (P1, New)

| Field | Arabic (default, unprefixed URL) | English (`/en/features/store-design`) |
|---|---|---|
| Primary keyword | تصميم متجر الكتروني | online store design |
| SEO title (`meta.<key>.title`; the layout adds the brand) | تصميم متجر إلكتروني احترافي بالسحب والإفلات | Design a professional store with drag and drop |
| Meta description | صمّم متجرك بنفسك: قوالب جاهزة لكل نشاط، وكل عنصر قابل للتعديل والسحب، بالعربية والإنجليزية، وتغيير القالب دون فقد منتجاتك. | Design your store yourself: ready templates for each kind of business, every element editable, in Arabic and English. |
| H1 | صمّم متجرك كما تريد، دون كود | Design your store your way, with no code |
| Secondary keywords | تصميم متجر الكتروني احترافي، تصميم متجر الكتروني مجاني، تصميم متجر الكتروني جاهز، منشئ مواقع | sentence-case English equivalents |
| Intent · market | Commercial · EG + Arab region | same page, English locale |
| Related entities | builder, templates, sections, RTL | |
| Internal links out | /templates, /industries, /features/ai-online-store | same paths under `/en` |
| Lengths (checked by script, same rule as `seo.lib.test.ts`) | ar 50/62 · en 56/62 · desc ar 122, en 117 | |

<a id="kw-f3"></a>

#### F3 `/features/custom-domain` (P1, Exists)

| Field | Arabic (default, unprefixed URL) | English (`/en/features/custom-domain`) |
|---|---|---|
| Primary keyword | ربط دومين بالمتجر | connect domain to online store |
| SEO title (`meta.<key>.title`; the layout adds the brand) | ربط نطاق خاص بمتجرك الإلكتروني | Connect your own domain to your store |
| Meta description | اربط نطاقك الخاص بمتجرك الرئيسي مجانًا خطوة بخطوة، أو ابدأ بعنوان مجاني على طلبي. اعرف أين تشتري نطاقًا وكيف تضبط الإعدادات. | Connect your own domain to your main store for free, step by step, or start on a free address. Learn where to buy one. |
| H1 | اربط نطاقك الخاص بمتجرك | Connect your own domain to your store |
| Secondary keywords | ربط نطاق، شراء دومين في مصر، دومين للمتجر | sentence-case English equivalents |
| Intent · market | Informational / how-to · EG | same page, English locale |
| Related entities | domain, DNS, subdomain, registrar | |
| Internal links out | /blog/where-to-buy-domain (F-78 guide), /pricing, /integrations | same paths under `/en` |
| Lengths (checked by script, same rule as `seo.lib.test.ts`) | ar 37/62 · en 47/62 · desc ar 124, en 118 | |

<a id="kw-f4"></a>

#### F4 `/features/fake-order-protection` (P1, New)

| Field | Arabic (default, unprefixed URL) | English (`/en/features/fake-order-protection`) |
|---|---|---|
| Primary keyword | الطلبات الوهمية | fake COD orders |
| SEO title (`meta.<key>.title`; the layout adds the brand) | الحماية من الطلبات الوهمية في متجرك الإلكتروني | Stop fake cash on delivery orders |
| Meta description | قلّل الطلبات الوهمية في الدفع عند الاستلام: حظر الأرقام، علامة خطورة على الطلب، تأكيد عبر واتساب، وحد لتكرار الطلبات. | Cut fake cash on delivery orders: block numbers, see a risk badge on each order, confirm on WhatsApp and limit repeat orders. |
| H1 | طلبات حقيقية أكثر، ومرتجعات أقل | More real orders, fewer returns |
| Secondary keywords | حماية المتجر من الطلبات الوهمية، تأكيد الطلبات واتساب، حظر رقم | sentence-case English equivalents |
| Intent · market | Problem-aware commercial · EG | same page, English locale |
| Related entities | COD fraud, blocklist, risk badge, WhatsApp confirm, rate limit | |
| Internal links out | /solutions/cash-on-delivery-store, /features/order-management, /blog/reduce-fake-orders | same paths under `/en` |
| Lengths (checked by script, same rule as `seo.lib.test.ts`) | ar 53/62 · en 43/62 · desc ar 117, en 125 | |

<a id="kw-f5"></a>

#### F5 `/features/abandoned-checkouts` (P1, New)

| Field | Arabic (default, unprefixed URL) | English (`/en/features/abandoned-checkouts`) |
|---|---|---|
| Primary keyword | السلات المتروكة | abandoned checkout recovery |
| SEO title (`meta.<key>.title`; the layout adds the brand) | الطلبات غير المكتملة: تابع السلات المتروكة | Recover abandoned checkouts and missed orders |
| Meta description | اعرف من بدأ الطلب ولم يكمله، وتواصل معه بالواتساب أو الهاتف من صفحة واحدة، وتابع من تم التواصل معه. | See who started an order and didn't finish, contact them on WhatsApp or by phone from one page, and track who you reached. |
| H1 | لا تخسر عميلًا بدأ الطلب | Don't lose a customer who started an order |
| Secondary keywords | رسائل السلات المتروكة، الطلبات غير المكتملة | sentence-case English equivalents |
| Intent · market | Commercial · EG + KSA spill | same page, English locale |
| Related entities | missed orders, abandoned checkout, WhatsApp | |
| Internal links out | /features/order-management, /features/email-marketing | same paths under `/en` |
| Lengths (checked by script, same rule as `seo.lib.test.ts`) | ar 49/62 · en 55/62 · desc ar 99, en 122 | |

<a id="kw-f6"></a>

#### F6 `/features/shipping` (P1, New)

| Field | Arabic (default, unprefixed URL) | English (`/en/features/shipping`) |
|---|---|---|
| Primary keyword | شحن الطلبات في مصر | shipping for online stores in Egypt |
| SEO title (`meta.<key>.title`; the layout adds the brand) | شحن طلبات متجرك في مصر: بوسطة ومندوبوك | Ship orders across Egypt: Bosta and your riders |
| Meta description | اشحن مع بوسطة من لوحة التحكم، أو بمندوبيك، وحدد سعر الشحن لكل منطقة مع شحن مجاني فوق مبلغ تختاره. طلبي لا يوصل الطلبات بنفسه. | Ship with Bosta from your dashboard or with your own riders, and set prices per area with free shipping over an amount you choose. |
| H1 | اشحن لكل محافظة بطريقتك | Ship to every governorate, your way |
| Secondary keywords | شركات الشحن في مصر، مناطق الشحن، مندوب توصيل | sentence-case English equivalents |
| Intent · market | Commercial · EG | same page, English locale |
| Related entities | Bosta, Wassalha, riders, zones, governorates | |
| Internal links out | /integrations/bosta, /integrations/wassalha, /blog/shipping-companies-egypt | same paths under `/en` |
| Lengths (checked by script, same rule as `seo.lib.test.ts`) | ar 45/62 · en 57/62 · desc ar 125, en 130 | |

<a id="kw-f7"></a>

#### F7 `/features/order-management` (P2, New)

| Field | Arabic (default, unprefixed URL) | English (`/en/features/order-management`) |
|---|---|---|
| Primary keyword | إدارة طلبات المتجر الإلكتروني | order management for online stores |
| SEO title (`meta.<key>.title`; the layout adds the brand) | إدارة طلبات متجرك الإلكتروني من مكان واحد | Manage your store orders in one place |
| Meta description | كل طلباتك في قائمة واحدة: مراحل واضحة، فواتير وقوائم تجهيز للطباعة، طلبات يدوية من الهاتف، وتنبيه فوري بكل طلب جديد. | All your orders in one list: clear stages, printable invoices and packing slips, manual phone orders and an alert for each new order. |
| H1 | كل طلباتك في لوحة واحدة | All your orders on one screen |
| Secondary keywords | فاتورة الشحن، طباعة الفواتير، طلب يدوي | sentence-case English equivalents |
| Intent · market | Commercial · EG | same page, English locale |
| Related entities | orders, invoices, packing slips, manual orders, push alerts | |
| Internal links out | /features/shipping, /features/fake-order-protection, /features/customers | same paths under `/en` |
| Lengths (checked by script, same rule as `seo.lib.test.ts`) | ar 48/62 · en 47/62 · desc ar 116, en 133 | |

<a id="kw-f8"></a>

#### F8 `/features/email-marketing` (P2, New)

| Field | Arabic (default, unprefixed URL) | English (`/en/features/email-marketing`) |
|---|---|---|
| Primary keyword | حملات البريد الإلكتروني للمتجر | email marketing for online stores |
| SEO title (`meta.<key>.title`; the layout adds the brand) | حملات البريد الإلكتروني لمتجرك واستعادة العملاء | Email campaigns and win-back for your store |
| Meta description | أرسل حملات بريد إلكتروني لعملائك، ورسائل لاستعادة من لم يشترِ منذ مدة، وتنبيهًا عند عودة المنتج. تعمل بعد أول شحن للمحفظة. | Send email campaigns, win back customers who stopped buying and alert shoppers when a product is back. Works after a first top-up. |
| H1 | عملاؤك يعودون للشراء | Bring your customers back |
| Secondary keywords | استرجاع العملاء، تنبيه عودة المنتج | sentence-case English equivalents |
| Intent · market | Commercial · EG | same page, English locale |
| Related entities | email campaigns, win-back, back-in-stock, monthly allowance | |
| Internal links out | /pricing, /features/customers | same paths under `/en` |
| Lengths (checked by script, same rule as `seo.lib.test.ts`) | ar 54/62 · en 53/62 · desc ar 122, en 130 | |

<a id="kw-f9"></a>

#### F9 `/features/offers-and-coupons` (P2, New)

| Field | Arabic (default, unprefixed URL) | English (`/en/features/offers-and-coupons`) |
|---|---|---|
| Primary keyword | كوبون خصم للمتجر | coupons and quantity offers |
| SEO title (`meta.<key>.title`; the layout adds the brand) | كوبونات الخصم وعروض الكمية لزيادة قيمة الطلب | Coupons and quantity offers for bigger orders |
| Meta description | زد قيمة كل طلب: كوبونات بنافذة منبثقة وعد تنازلي، عروض الكمية، خصومات تلقائية، ومنتجات مقترحة أسفل المنتج. | Raise every order's value with coupon pop-ups and countdowns, quantity offers, automatic discounts and products suggested under each item. |
| H1 | عروض تزيد قيمة كل طلب | Offers that raise every order's value |
| Secondary keywords | عروض الكمية، خصم تلقائي، منتجات مقترحة | sentence-case English equivalents |
| Intent · market | Commercial · EG | same page, English locale |
| Related entities | coupons, quantity offers, cross-sell, automatic discounts | |
| Internal links out | /features/order-management, /tools/profit-margin-calculator | same paths under `/en` |
| Lengths (checked by script, same rule as `seo.lib.test.ts`) | ar 51/62 · en 55/62 · desc ar 106, en 138 | |

<a id="kw-f10"></a>

#### F10 `/features/reports` (P2, New)

| Field | Arabic (default, unprefixed URL) | English (`/en/features/reports`) |
|---|---|---|
| Primary keyword | تقارير مبيعات المتجر الإلكتروني | online store analytics |
| SEO title (`meta.<key>.title`; the layout adds the brand) | تقارير المبيعات ومصادر الزيارات لمتجرك | Sales reports and traffic sources for your store |
| Meta description | اعرف من أين يأتي عملاؤك، وأين يتوقفون قبل الشراء، وأي المحافظات ترفض الطلبات أكثر، وأي المنتجات تبيع أكثر. | See where customers come from, where they stop before buying, which governorates refuse most orders and which products sell. |
| H1 | اعرف ما يبيع، ومن أين | Know what sells, and where from |
| Secondary keywords | مصادر الزيارات، نسبة المرتجع | sentence-case English equivalents |
| Intent · market | Commercial · EG | same page, English locale |
| Related entities | funnel, sources, refusal by governorate, GA4 | |
| Internal links out | /integrations/google-analytics, /features/order-management | same paths under `/en` |
| Lengths (checked by script, same rule as `seo.lib.test.ts`) | ar 45/62 · en 58/62 · desc ar 106, en 124 | |

<a id="kw-f11"></a>

#### F11 `/features/store-app` (P2, New)

| Field | Arabic (default, unprefixed URL) | English (`/en/features/store-app`) |
|---|---|---|
| Primary keyword | تطبيق متجر الكتروني | store app for customers |
| SEO title (`meta.<key>.title`; the layout adds the brand) | تطبيق لمتجرك يثبته العميل على هاتفه مباشرة | A store app your customers install from the browser |
| Meta description | عملاؤك يثبتون متجرك على الهاتف باسمك وشعارك من زر في المتجر، دون متجر تطبيقات ودون تكلفة برمجة تطبيق. | Customers add your store to their phone with your name and logo from a button in your store, with no app store and no app build. |
| H1 | متجرك على هاتف عميلك | Your store on your customer's phone |
| Secondary keywords | إنشاء تطبيق متجر الكتروني مجاني، تكلفة انشاء تطبيق متجر الكتروني | sentence-case English equivalents |
| Intent · market | Commercial · EG | same page, English locale |
| Related entities | PWA, install button, store icon | |
| Internal links out | /features/store-design, /solutions/create-online-store | same paths under `/en` |
| Lengths (checked by script, same rule as `seo.lib.test.ts`) | ar 49/62 · en 61/62 · desc ar 101, en 128 | |

<a id="kw-f12"></a>

#### F12 `/features/ai-assistants-mcp` (P3, New)

| Field | Arabic (default, unprefixed URL) | English (`/en/features/ai-assistants-mcp`) |
|---|---|---|
| Primary keyword | ربط المتجر مع ChatGPT | manage store products from ChatGPT or Claude |
| SEO title (`meta.<key>.title`; the layout adds the brand) | أدر منتجات متجرك من ChatGPT وClaude | Manage store products from ChatGPT or Claude |
| Meta description | اربط حسابك على طلبي بمساعدك الذكي، وأضف المنتجات وعدّلها وابحث فيها بالمحادثة. كل تغيير كبير يطلب موافقتك أولًا. | Connect your Tallaby account to your AI assistant and add, edit and search products by chat. Big changes ask for your approval first. |
| H1 | منتجاتك، من محادثة واحدة | Your products, from one chat |
| Secondary keywords | ربط متجرك مع Claude، MCP | sentence-case English equivalents |
| Intent · market | Commercial (early adopters) · EG + global | same page, English locale |
| Related entities | MCP, ChatGPT, Claude, OAuth | |
| Internal links out | /features/ai-online-store | same paths under `/en` |
| Lengths (checked by script, same rule as `seo.lib.test.ts`) | ar 42/62 · en 54/62 · desc ar 112, en 133 | |

<a id="kw-f13"></a>

#### F13 `/features/customers` (P3, New)

| Field | Arabic (default, unprefixed URL) | English (`/en/features/customers`) |
|---|---|---|
| Primary keyword | قائمة عملاء المتجر | customer list for online stores |
| SEO title (`meta.<key>.title`; the layout adds the brand) | قائمة عملاء متجرك وملاحظاتهم ووسومهم | Your store's customer list, notes and tags |
| Meta description | كل عميل في مكان واحد: طلباته وإجمالي مشترياته وملاحظاتك عنه ووسوم تساعدك على تقسيم العملاء والتواصل معهم. | Every customer in one place: their orders, total spend, your notes and tags that help you group and reach them. |
| H1 | اعرف عملاءك واحدًا واحدًا | Know your customers one by one |
| Secondary keywords | ملاحظات العملاء، وسوم العملاء | sentence-case English equivalents |
| Intent · market | Commercial · EG | same page, English locale |
| Related entities | CRM, notes, tags | |
| Internal links out | /features/email-marketing, /features/order-management | same paths under `/en` |
| Lengths (checked by script, same rule as `seo.lib.test.ts`) | ar 43/62 · en 52/62 · desc ar 105, en 111 | |

<a id="kw-f14"></a>

#### F14 `/features/store-seo` (P3, New)

| Field | Arabic (default, unprefixed URL) | English (`/en/features/store-seo`) |
|---|---|---|
| Primary keyword | تحسين ظهور المتجر في محركات البحث | online store SEO |
| SEO title (`meta.<key>.title`; the layout adds the brand) | ظهور متجرك في محركات البحث من أول يوم | Search-ready online store from day one |
| Meta description | عنوان ووصف لكل منتج وصفحة، خريطة موقع تلقائية، وإعدادات جاهزة في القالب، ونصوص المنتجات بالذكاء الاصطناعي بلغتين. | A title and description for every product and page, an automatic sitemap, theme SEO defaults and AI-written product copy. |
| H1 | متجر جاهز لمحركات البحث | A store that's ready for search |
| Secondary keywords | سيو المتجر الإلكتروني | sentence-case English equivalents |
| Intent · market | Commercial · EG | same page, English locale |
| Related entities | SEO fields, sitemap, theme SEO defaults (F-48) | |
| Internal links out | /features/ai-online-store, /blog/seo-basics | same paths under `/en` |
| Lengths (checked by script, same rule as `seo.lib.test.ts`) | ar 44/62 · en 48/62 · desc ar 113, en 121 | |

<a id="kw-f15"></a>

#### F15 `/features/product-management` (P3, New)

| Field | Arabic (default, unprefixed URL) | English (`/en/features/product-management`) |
|---|---|---|
| Primary keyword | إدارة منتجات المتجر الإلكتروني | product management for online stores |
| SEO title (`meta.<key>.title`; the layout adds the brand) | إدارة منتجات متجرك: استيراد وتعديل جماعي ومخزون | Manage products: import, bulk edit and stock |
| Meta description | أضف منتجاتك من ملف Excel أو رابط أو بالذكاء الاصطناعي، وعدّلها دفعة واحدة، وتابع المخزون وتنبيهات نفاده من لوحة واحدة. | Add products from Excel, a link or with AI, edit many at once, and follow stock and low-stock alerts from one dashboard. |
| H1 | كل منتجاتك تحت السيطرة | All your products under control |
| Secondary keywords | استيراد المنتجات من اكسل، تعديل جماعي، المخزون، متغيرات المنتج | sentence-case English equivalents |
| Intent · market | Commercial · EG | same page, English locale |
| Related entities | Excel import, URL import, bulk edit, variants, stock history, low-stock alerts, trash | |
| Internal links out | /features/ai-online-store, /integrations/shopify-import, /features/order-management | same paths under `/en` |
| Lengths (checked by script, same rule as `seo.lib.test.ts`) | ar 54/62 · en 54/62 · desc ar 118, en 120 | |

<a id="kw-i1"></a>

#### I1 `/integrations/bosta` (P1, New)

| Field | Arabic (default, unprefixed URL) | English (`/en/integrations/bosta`) |
|---|---|---|
| Primary keyword | ربط بوسطة بالمتجر | Bosta integration |
| SEO title (`meta.<key>.title`; the layout adds the brand) | اشحن مع بوسطة من لوحة تحكم متجرك | Ship with Bosta from your store dashboard |
| Meta description | اربط حسابك على بوسطة بمتجرك، وأرسل الطلبات بضغطة، واطبع البوالص، وتابع حالة كل شحنة دون نسخ ولصق. | Connect your Bosta account to your store, send orders in one click, print waybills and follow each shipment without copy-paste. |
| H1 | بوسطة داخل متجرك | Bosta, inside your store |
| Secondary keywords | بوسطة شحن، شركة شحن بوسطة، bosta shopify integration | sentence-case English equivalents |
| Intent · market | Commercial / how-to · EG | same page, English locale |
| Related entities | Bosta, waybill (بوليصة), status sync, COD collection | |
| Internal links out | /features/shipping, /integrations, /solutions/online-store-egypt | same paths under `/en` |
| Lengths (checked by script, same rule as `seo.lib.test.ts`) | ar 39/62 · en 51/62 · desc ar 97, en 127 | |

<a id="kw-i2"></a>

#### I2 `/integrations/paymob` (P1, New)

| Field | Arabic (default, unprefixed URL) | English (`/en/integrations/paymob`) |
|---|---|---|
| Primary keyword | ربط باي موب بالمتجر | Paymob integration |
| SEO title (`meta.<key>.title`; the layout adds the brand) | استقبل الدفع بالبطاقات عبر حسابك على Paymob | Accept cards with your own Paymob account |
| Meta description | اربط حسابك على Paymob بمتجرك، واستقبل الدفع بالبطاقات مباشرة في حسابك. رسوم الدفع يحددها Paymob، وطلبي لا يأخذ نسبة. | Connect your Paymob account and take card payments straight into it. Paymob sets the payment fees; Tallaby takes no share. |
| H1 | Paymob في متجرك، والمال في حسابك | Paymob in your store, money in your account |
| Secondary keywords | باي موب، بوابة دفع مصرية، paymob shopify | sentence-case English equivalents |
| Intent · market | Commercial / how-to · EG | same page, English locale |
| Related entities | Paymob, cards, own account, no sales share | |
| Internal links out | /integrations/kashier, /solutions/cash-on-delivery-store, /pricing | same paths under `/en` |
| Lengths (checked by script, same rule as `seo.lib.test.ts`) | ar 50/62 · en 51/62 · desc ar 116, en 122 | |

<a id="kw-i3"></a>

#### I3 `/integrations/kashier` (P1, New)

| Field | Arabic (default, unprefixed URL) | English (`/en/integrations/kashier`) |
|---|---|---|
| Primary keyword | بوابة دفع كاشير | Kashier integration |
| SEO title (`meta.<key>.title`; the layout adds the brand) | استقبل الدفع بالبطاقات عبر حسابك على كاشير | Accept cards with your own Kashier account |
| Meta description | اربط حسابك على كاشير بمتجرك واستقبل الدفع بالبطاقات مباشرة في حسابك. الرسوم يحددها كاشير، وطلبي لا يأخذ نسبة من المبيعات. | Connect your Kashier account and take card payments straight into it. Kashier sets its fees; Tallaby takes no share of sales. |
| H1 | كاشير في متجرك، والمال في حسابك | Kashier in your store, money in your account |
| Secondary keywords | كاشير للمدفوعات، بوابة دفع مصرية | sentence-case English equivalents |
| Intent · market | Commercial / how-to · EG | same page, English locale |
| Related entities | Kashier, cards, own account | |
| Internal links out | /integrations/paymob, /integrations | same paths under `/en` |
| Lengths (checked by script, same rule as `seo.lib.test.ts`) | ar 49/62 · en 52/62 · desc ar 121, en 125 | |

<a id="kw-i4"></a>

#### I4 `/integrations/instapay-wallets` (P2, New, verify F-21p first)

| Field | Arabic (default, unprefixed URL) | English (`/en/integrations/instapay-wallets`) |
|---|---|---|
| Primary keyword | بوابة دفع فودافون كاش | InstaPay and Vodafone Cash for online stores |
| SEO title (`meta.<key>.title`; the layout adds the brand) | الدفع بإنستاباي وفودافون كاش في متجرك | InstaPay and Vodafone Cash in your store |
| Meta description | دع عميلك يحوّل إلى حسابك بإنستاباي أو فودافون كاش أو اتصالات كاش ويرفع صورة التحويل، وأنت تؤكد الطلب من لوحة التحكم. | Let customers transfer to you with InstaPay, Vodafone Cash or e& Cash and upload the receipt, then confirm the order in your dashboard. |
| H1 | تحويلات المحافظ، منظمة في طلباتك | Wallet transfers, organised in your orders |
| Secondary keywords | انستاباي، فودافون كاش، اتصالات كاش، تحويل بنكي | sentence-case English equivalents |
| Intent · market | Commercial · EG | same page, English locale |
| Related entities | InstaPay, Vodafone Cash, e& Cash, transfer proof | |
| Internal links out | /integrations/paymob, /solutions/cash-on-delivery-store | same paths under `/en` |
| Lengths (checked by script, same rule as `seo.lib.test.ts`) | ar 44/62 · en 50/62 · desc ar 116, en 135 | |

<a id="kw-i5"></a>

#### I5 `/integrations/wassalha` (P2, New)

| Field | Arabic (default, unprefixed URL) | English (`/en/integrations/wassalha`) |
|---|---|---|
| Primary keyword | الشحن مع البريد المصري للمتجر | Wassalha Egypt Post shipping sheet |
| SEO title (`meta.<key>.title`; the layout adds the brand) | شحن طلباتك مع وصلها والبريد المصري | Wassalha and Egypt Post shipping sheet |
| Meta description | صدّر طلباتك في ملف جاهز للرفع على وصلها والبريد المصري بدل إدخالها يدويًا. الشحن يتم من حسابك على وصلها. | Export your orders as a sheet that's ready to upload to Wassalha and Egypt Post, instead of typing them in one by one. |
| H1 | طلباتك جاهزة للبريد المصري | Your orders, ready for Egypt Post |
| Secondary keywords | تتبع الطلبات البريد المصري، وصلها | sentence-case English equivalents |
| Intent · market | Commercial · EG | same page, English locale |
| Related entities | Wassalha, Egypt Post, Excel export | |
| Internal links out | /features/shipping, /integrations/bosta | same paths under `/en` |
| Lengths (checked by script, same rule as `seo.lib.test.ts`) | ar 41/62 · en 48/62 · desc ar 104, en 118 | |

<a id="kw-i6"></a>

#### I6 `/integrations/product-catalogs` (P2, New)

| Field | Arabic (default, unprefixed URL) | English (`/en/integrations/product-catalogs`) |
|---|---|---|
| Primary keyword | كتالوج فيسبوك للمتجر | product feed for Meta and Google |
| SEO title (`meta.<key>.title`; the layout adds the brand) | كتالوج منتجاتك على فيسبوك وGoogle وتيك توك | Product feeds for Meta, Google and TikTok |
| Meta description | رابط واحد يحدّث منتجاتك تلقائيًا في كتالوج فيسبوك وإنستجرام وGoogle Merchant Center وتيك توك، لإعلانات المنتجات والتسوق. | One link keeps your products up to date in Meta, Google Merchant Center and TikTok catalogs, for product ads and shopping. |
| H1 | منتجاتك في كل كتالوج برابط واحد | Your products in every catalog, from one link |
| Secondary keywords | جوجل ميرشانت سنتر، كتالوج تيك توك، google merchant center feed | sentence-case English equivalents |
| Intent · market | How-to / commercial · EG | same page, English locale |
| Related entities | Meta catalog, Google Merchant Center, TikTok catalog, XML/CSV feed | |
| Internal links out | /integrations/meta-pixel, /solutions/facebook-page-to-store | same paths under `/en` |
| Lengths (checked by script, same rule as `seo.lib.test.ts`) | ar 49/62 · en 51/62 · desc ar 120, en 122 | |

<a id="kw-i7"></a>

#### I7 `/integrations/shopify-import` (P2, New)

| Field | Arabic (default, unprefixed URL) | English (`/en/integrations/shopify-import`) |
|---|---|---|
| Primary keyword | نقل متجر شوبيفاي | import products from Shopify |
| SEO title (`meta.<key>.title`; the layout adds the brand) | انقل منتجاتك من شوبيفاي في دقائق | Import your products from Shopify |
| Meta description | تنقل من شوبيفاي؟ استورد منتجاتك وصورها وأسعارها إلى متجرك الجديد، ثم اختر قالبًا وفعّل الدفع عند الاستلام والشحن. | Moving from Shopify? Import your products, photos and prices into your new store, then pick a template and turn on payments. |
| H1 | من شوبيفاي إلى متجرك الجديد | From Shopify to your new store |
| Secondary keywords | الانتقال من شوبيفاي، بديل شوبيفاي | sentence-case English equivalents |
| Intent · market | Transactional (switchers) · EG | same page, English locale |
| Related entities | Shopify import, migration | |
| Internal links out | /alternatives/shopify (when public), /templates, /pricing | same paths under `/en` |
| Lengths (checked by script, same rule as `seo.lib.test.ts`) | ar 39/62 · en 43/62 · desc ar 113, en 124 | |

<a id="kw-i8"></a>

#### I8 `/integrations/google-analytics` (P3, New)

| Field | Arabic (default, unprefixed URL) | English (`/en/integrations/google-analytics`) |
|---|---|---|
| Primary keyword | ربط المتجر بجوجل أناليتكس | connect store to Google Analytics 4 |
| SEO title (`meta.<key>.title`; the layout adds the brand) | ربط متجرك بـ Google Analytics 4 | Connect your store to Google Analytics 4 |
| Meta description | أضف معرّف Google Analytics 4 أو Google Tag Manager إلى متجرك، وتابع الزيارات والمبيعات في حسابك دون كود. | Add your Google Analytics 4 or Google Tag Manager ID to your store and follow visits and sales in your own account, with no code. |
| H1 | بيانات متجرك في حسابك على Google | Your store data in your Google account |
| Secondary keywords | GA4، Google Tag Manager | sentence-case English equivalents |
| Intent · market | How-to · EG | same page, English locale |
| Related entities | GA4, GTM | |
| Internal links out | /features/reports, /integrations/meta-pixel | same paths under `/en` |
| Lengths (checked by script, same rule as `seo.lib.test.ts`) | ar 38/62 · en 50/62 · desc ar 104, en 129 | |

<a id="kw-i9"></a>

#### I9 `/integrations/google-sheets` (P3, New)

| Field | Arabic (default, unprefixed URL) | English (`/en/integrations/google-sheets`) |
|---|---|---|
| Primary keyword | تصدير الطلبات إلى جوجل شيت | export orders to Google Sheets |
| SEO title (`meta.<key>.title`; the layout adds the brand) | تصدير طلبات متجرك إلى Google Sheets تلقائيًا | Send your store orders to Google Sheets |
| Meta description | كل طلب جديد يصل إلى جدول Google Sheets الخاص بك تلقائيًا، لفريق التأكيد أو المحاسبة، دون تصدير يدوي. | Every new order lands in your own Google Sheets file automatically, for your confirmation team or bookkeeping. |
| H1 | طلباتك في جدولك تلقائيًا | Your orders in your sheet, automatically |
| Secondary keywords | COD sheets، شيت الطلبات | sentence-case English equivalents |
| Intent · market | How-to · EG | same page, English locale |
| Related entities | Google Sheets, order export | |
| Internal links out | /features/order-management | same paths under `/en` |
| Lengths (checked by script, same rule as `seo.lib.test.ts`) | ar 51/62 · en 49/62 · desc ar 100, en 110 | |

<a id="kw-t1"></a>

#### T1 `/tools/profit-margin-calculator` (P1, Exists (add selling-price intent))

| Field | Arabic (default, unprefixed URL) | English (`/en/tools/profit-margin-calculator`) |
|---|---|---|
| Primary keyword | حاسبة هامش الربح | profit margin calculator |
| SEO title (`meta.<key>.title`; the layout adds the brand) | حاسبة هامش الربح وسعر البيع للمتجر الإلكتروني | Profit margin and selling price calculator |
| Meta description | احسب ربحك الحقيقي من كل طلب بعد التكلفة والشحن والإعلانات ورسوم المنصة، واعرف السعر الذي يحقق الهامش الذي تريده. | Work out your real profit per order after cost, shipping, ads and platform fees, and find the price that hits the margin you want. |
| H1 | احسب هامش ربحك وسعر البيع | Work out your margin and selling price |
| Secondary keywords | حساب سعر البيع، كيفية حساب سعر البيع للمنتج، حساب نسبة الربح من سعر البيع، تسعير المنتجات | sentence-case English equivalents |
| Intent · market | Informational / tool · EG | same page, English locale |
| Related entities | margin, markup, break-even price, suggestedPrice | |
| Internal links out | /tools/store-cost-calculator, /pricing, /blog/pricing-products | same paths under `/en` |
| Lengths (checked by script, same rule as `seo.lib.test.ts`) | ar 52/62 · en 52/62 · desc ar 112, en 130 | |

<a id="kw-t2"></a>

#### T2 `/tools/store-cost-calculator` (P1, New)

| Field | Arabic (default, unprefixed URL) | English (`/en/tools/store-cost-calculator`) |
|---|---|---|
| Primary keyword | تكلفة انشاء متجر الكتروني في مصر | online store cost calculator Egypt |
| SEO title (`meta.<key>.title`; the layout adds the brand) | حاسبة تكلفة إنشاء متجر إلكتروني في مصر | Online store cost calculator for Egypt |
| Meta description | احسب تكلفة متجرك الشهرية حسب عدد طلباتك: رسوم المنصة والنطاق والشحن والدفع، وقارن بين الخطة المجانية والاحترافية. | Work out your store's monthly cost from your order count: platform fees, domain, shipping and payments, Free plan vs Pro. |
| H1 | كم يكلفك متجرك الإلكتروني شهريًا؟ | What will your online store cost each month? |
| Secondary keywords | تكلفة إنشاء متجر إلكتروني، كم تكلفة انشاء متجر الكتروني، اسعار انشاء متجر الكتروني | sentence-case English equivalents |
| Intent · market | Commercial investigation · EG | same page, English locale |
| Related entities | Free vs Pro break-even, per-order fee, domain cost, gateway fees | |
| Internal links out | /pricing, /tools/profit-margin-calculator, /blog/online-store-cost-egypt | same paths under `/en` |
| Lengths (checked by script, same rule as `seo.lib.test.ts`) | ar 45/62 · en 48/62 · desc ar 113, en 121 | |

<a id="kw-t3"></a>

#### T3 `/tools/store-name-generator` (P2, New)

| Field | Arabic (default, unprefixed URL) | English (`/en/tools/store-name-generator`) |
|---|---|---|
| Primary keyword | اسماء متاجر الكترونية | online store name generator |
| SEO title (`meta.<key>.title`; the layout adds the brand) | مولد أسماء المتاجر الإلكترونية بالعربية والإنجليزية | Online store name generator, Arabic and English |
| Meta description | اكتب نوع نشاطك واحصل على أفكار أسماء لمتجرك بالعربية والإنجليزية، ثم تحقق فورًا من توفر رابط المتجر على طلبي. | Type what you sell and get store name ideas in Arabic and English, then check right away whether the store link is free. |
| H1 | أفكار أسماء لمتجرك الإلكتروني | Name ideas for your online store |
| Secondary keywords | اسم متجر جذاب، اسماء متاجر الكترونية غير مستخدمة، اسماء متاجر ملابس، اسم متجر بالانجليزي | sentence-case English equivalents |
| Intent · market | Informational / tool · EG + Arab region | same page, English locale |
| Related entities | store name, subdomain availability (SlugClaimForm) | |
| Internal links out | /solutions/free-online-store, /industries | same paths under `/en` |
| Lengths (checked by script, same rule as `seo.lib.test.ts`) | ar 58/62 · en 57/62 · desc ar 109, en 120 | |

<a id="kw-t4"></a>

#### T4 `/tools/platform-fee-calculator` (P2, New (competitor presets gated))

| Field | Arabic (default, unprefixed URL) | English (`/en/tools/platform-fee-calculator`) |
|---|---|---|
| Primary keyword | حاسبة رسوم منصة المتجر | ecommerce platform fee calculator |
| SEO title (`meta.<key>.title`; the layout adds the brand) | حاسبة رسوم منصات المتاجر حسب عدد طلباتك | Store platform fee calculator by order count |
| Meta description | أدخل عدد طلباتك ومتوسط قيمة الطلب، واعرف ما تدفعه للمنصة شهريًا: رسوم لكل طلب، أو نسبة من المبيعات، أو اشتراك ثابت. | Enter your monthly orders and average order value and see what a platform costs: a fee per order, a share of sales or a flat plan. |
| H1 | كم تأخذ منصتك من كل طلب؟ | How much does your platform take per order? |
| Secondary keywords | عمولة المنصة، رسوم كل طلب، shopify egypt fees | sentence-case English equivalents |
| Intent · market | Commercial investigation · EG | same page, English locale |
| Related entities | per-order fee, % fee, Shopify 2% third-party fee, EasyOrders $0.04, Pro break-even | |
| Internal links out | /pricing, /compare (when public), /tools/store-cost-calculator | same paths under `/en` |
| Lengths (checked by script, same rule as `seo.lib.test.ts`) | ar 46/62 · en 54/62 · desc ar 115, en 130 | |

<a id="kw-t5"></a>

#### T5 `/tools/return-policy-generator` (P3, New)

| Field | Arabic (default, unprefixed URL) | English (`/en/tools/return-policy-generator`) |
|---|---|---|
| Primary keyword | نموذج سياسة الاسترجاع للمتجر | return policy template for online store |
| SEO title (`meta.<key>.title`; the layout adds the brand) | نموذج سياسة الاستبدال والاسترجاع لمتجرك | Return and refund policy template for your store |
| Meta description | أنشئ سياسة استبدال واسترجاع واضحة لمتجرك في مصر خلال دقيقة: المدة، الحالات، ومن يدفع الشحن. انسخها أو استخدمها في متجرك. | Create a clear return and exchange policy for your store in Egypt in a minute: time limits, cases and who pays shipping. |
| H1 | سياسة استرجاع واضحة لمتجرك | A clear return policy for your store |
| Secondary keywords | سياسة الاستبدال والاسترجاع، سياسة المرتجعات | sentence-case English equivalents |
| Intent · market | Informational / tool · EG | same page, English locale |
| Related entities | returns, store policies (F-46) | |
| Internal links out | /tools/privacy-policy-generator, /features/order-management | same paths under `/en` |
| Lengths (checked by script, same rule as `seo.lib.test.ts`) | ar 46/62 · en 58/62 · desc ar 120, en 120 | |

<a id="kw-t6"></a>

#### T6 `/tools/privacy-policy-generator` (P3, New)

| Field | Arabic (default, unprefixed URL) | English (`/en/tools/privacy-policy-generator`) |
|---|---|---|
| Primary keyword | نموذج سياسة الخصوصية للمتجر | privacy policy template for online store |
| SEO title (`meta.<key>.title`; the layout adds the brand) | نموذج سياسة الخصوصية للمتجر الإلكتروني | Privacy policy template for an online store |
| Meta description | أنشئ سياسة خصوصية لمتجرك الإلكتروني بالعربية والإنجليزية: ما تجمعه من بيانات العملاء ولماذا، وكيف يتواصلون معك. | Create a privacy policy for your online store in Arabic and English: what customer data you collect, why, and how to reach you. |
| H1 | سياسة خصوصية لمتجرك بلغتين | A privacy policy for your store, in two languages |
| Secondary keywords | سياسة الخصوصية للمتجر الإلكتروني | sentence-case English equivalents |
| Intent · market | Informational / tool · EG | same page, English locale |
| Related entities | privacy policy, store policies | |
| Internal links out | /tools/return-policy-generator | same paths under `/en` |
| Lengths (checked by script, same rule as `seo.lib.test.ts`) | ar 45/62 · en 53/62 · desc ar 111, en 127 | |

<a id="kw-n1"></a>

#### N1 `/industries/clothing-store` (P1, Exists)

| Field | Arabic (default, unprefixed URL) | English (`/en/industries/clothing-store`) |
|---|---|---|
| Primary keyword | انشاء متجر ملابس | online clothing store |
| SEO title (`meta.<key>.title`; the layout adds the brand) | إنشاء متجر ملابس إلكتروني باحترافية | Create a professional online clothing store |
| Meta description | أنشئ متجر ملابس إلكتروني بمقاسات وألوان لكل منتج، صور متعددة، عد تنازلي للعروض، وكتالوج لفيسبوك وإنستجرام. | Open an online clothing store with sizes and colours per item, photo galleries, sale countdowns and a Facebook and Instagram catalog. |
| H1 | متجر ملابس جاهز للبيع | A clothing store that's ready to sell |
| Secondary keywords | متجر ملابس اونلاين، متجر ملابس اونلاين مصر، ازاي ابيع هدوم اونلاين، اسماء متاجر ملابس، متجر احذية | sentence-case English equivalents |
| Intent · market | Transactional (seller) / mixed · EG | same page, English locale |
| Related entities | variants, sizes, colours, shoes | |
| Internal links out | /templates (category fa), /industries, /solutions/free-online-store, 2 sibling industries | same paths under `/en` |
| Lengths (checked by script, same rule as `seo.lib.test.ts`) | ar 42/62 · en 53/62 · desc ar 106, en 133 | |

<a id="kw-n2"></a>

#### N2 `/industries/beauty-store` (P2, New)

| Field | Arabic (default, unprefixed URL) | English (`/en/industries/beauty-store`) |
|---|---|---|
| Primary keyword | متجر مستحضرات تجميل | online beauty store |
| SEO title (`meta.<key>.title`; the layout adds the brand) | إنشاء متجر مستحضرات تجميل إلكتروني | Create an online beauty and cosmetics store |
| Meta description | متجر مستحضرات تجميل وعناية بقوالب أنيقة: صور متعددة لكل منتج، عروض الكمية، تنبيه عودة المنتج، وتقييمات حقيقية من عملائك. | A beauty and skincare store with elegant templates: photo galleries, quantity offers, back-in-stock alerts and real customer reviews. |
| H1 | متجر تجميل يليق بمنتجاتك | A beauty store that suits your products |
| Secondary keywords | متجر مستحضرات تجميل في مصر، متجر الكتروني مستحضرات تجميل، اسم متجر مستحضرات تجميل | sentence-case English equivalents |
| Intent · market | Transactional (seller) / mixed · EG | same page, English locale |
| Related entities | skincare, cosmetics | |
| Internal links out | /templates (category be (12)), /industries, /solutions/free-online-store, 2 sibling industries | same paths under `/en` |
| Lengths (checked by script, same rule as `seo.lib.test.ts`) | ar 41/62 · en 53/62 · desc ar 120, en 133 | |

<a id="kw-n3"></a>

#### N3 `/industries/perfume-store` (P2, New)

| Field | Arabic (default, unprefixed URL) | English (`/en/industries/perfume-store`) |
|---|---|---|
| Primary keyword | متجر عطور اونلاين | online perfume store |
| SEO title (`meta.<key>.title`; the layout adds the brand) | إنشاء متجر عطور إلكتروني | Create an online perfume store |
| Meta description | متجر عطور بأحجام وأسعار لكل عطر، عروض الكمية والعينات، وقوالب فاخرة بالعربية والإنجليزية. ابدأ دون اشتراك شهري. | A perfume store with sizes and prices per scent, quantity and sample offers, and premium templates in Arabic and English. |
| H1 | متجر عطور بلمسة فاخرة | A perfume store with a premium feel |
| Secondary keywords | اسماء متاجر العطور، افضل متجر عطور اونلاين، انشاء متجر الكتروني للعطور | sentence-case English equivalents |
| Intent · market | Transactional (seller) / mixed · EG | same page, English locale |
| Related entities | perfume, sizes, samples | |
| Internal links out | /templates (category be (perfume niche ×3)), /industries, /solutions/free-online-store, 2 sibling industries | same paths under `/en` |
| Lengths (checked by script, same rule as `seo.lib.test.ts`) | ar 31/62 · en 40/62 · desc ar 111, en 121 | |

<a id="kw-n4"></a>

#### N4 `/industries/electronics-store` (P2, New)

| Field | Arabic (default, unprefixed URL) | English (`/en/industries/electronics-store`) |
|---|---|---|
| Primary keyword | متجر الكترونيات | online electronics store |
| SEO title (`meta.<key>.title`; the layout adds the brand) | إنشاء متجر إلكترونيات وإكسسوارات موبايل | Create an online electronics store |
| Meta description | متجر إلكترونيات بمواصفات واضحة لكل منتج، متغيرات للسعة واللون، دفع بالبطاقات عبر حسابك، والدفع عند الاستلام. | An electronics store with clear specs per product, storage and colour variants, card payments into your account and cash on delivery. |
| H1 | متجر إلكترونيات منظم وواضح | A clear, well-organised electronics store |
| Secondary keywords | متجر الكترونيات مصر، متجر اكسسوارات موبايل، متجر اكسسوارات كمبيوتر | sentence-case English equivalents |
| Intent · market | Transactional (seller) / mixed · EG | same page, English locale |
| Related entities | electronics, mobile accessories | |
| Internal links out | /templates (category el (11) + ac (2)), /industries, /solutions/free-online-store, 2 sibling industries | same paths under `/en` |
| Lengths (checked by script, same rule as `seo.lib.test.ts`) | ar 46/62 · en 44/62 · desc ar 108, en 133 | |

<a id="kw-n5"></a>

#### N5 `/industries/home-furniture-store` (P2, New)

| Field | Arabic (default, unprefixed URL) | English (`/en/industries/home-furniture-store`) |
|---|---|---|
| Primary keyword | متجر اثاث | online furniture store |
| SEO title (`meta.<key>.title`; the layout adds the brand) | إنشاء متجر أثاث ومستلزمات منزل إلكتروني | Create an online furniture and home store |
| Meta description | متجر أثاث ومستلزمات منزل بصور كبيرة، أبعاد وخامات لكل قطعة، مناطق شحن لكل محافظة، والدفع عند الاستلام. | A furniture and homeware store with large photos, sizes and materials per piece, delivery zones by governorate and cash on delivery. |
| H1 | متجر أثاث يعرض كل قطعة كما تستحق | A furniture store that shows each piece well |
| Secondary keywords | متجر اثاث منزلي، متجر مستلزمات منزل، أدوات مطبخ | sentence-case English equivalents |
| Intent · market | Transactional (seller) / mixed · EG | same page, English locale |
| Related entities | furniture, home, kitchen | |
| Internal links out | /templates (category ho (18)), /industries, /solutions/free-online-store, 2 sibling industries | same paths under `/en` |
| Lengths (checked by script, same rule as `seo.lib.test.ts`) | ar 46/62 · en 51/62 · desc ar 102, en 132 | |

<a id="kw-n6"></a>

#### N6 `/industries/jewelry-accessories-store` (P2, New)

| Field | Arabic (default, unprefixed URL) | English (`/en/industries/jewelry-accessories-store`) |
|---|---|---|
| Primary keyword | متجر اكسسوارات | online jewelry and accessories store |
| SEO title (`meta.<key>.title`; the layout adds the brand) | إنشاء متجر مجوهرات وإكسسوارات إلكتروني | Create an online jewelry and accessories store |
| Meta description | متجر مجوهرات وإكسسوارات بصور مقربة، متغيرات للمقاس واللون، كوبونات بنافذة منبثقة، وقوالب أنيقة بلغتين. | A jewelry and accessories store with close-up photos, size and colour options, coupon pop-ups and elegant templates in two languages. |
| H1 | متجر مجوهرات وإكسسوارات أنيق | An elegant jewelry and accessories store |
| Secondary keywords | متجر مجوهرات، متجر اكسسوارات نسائية، اسماء متاجر اكسسوارات | sentence-case English equivalents |
| Intent · market | Transactional (seller) / mixed · EG | same page, English locale |
| Related entities | jewelry, women's accessories | |
| Internal links out | /templates (category jw (10)), /industries, /solutions/free-online-store, 2 sibling industries | same paths under `/en` |
| Lengths (checked by script, same rule as `seo.lib.test.ts`) | ar 45/62 · en 56/62 · desc ar 102, en 133 | |

<a id="kw-n7"></a>

#### N7 `/industries/food-store` (P2, New)

| Field | Arabic (default, unprefixed URL) | English (`/en/industries/food-store`) |
|---|---|---|
| Primary keyword | متجر اكل اونلاين | online food store |
| SEO title (`meta.<key>.title`; the layout adds the brand) | إنشاء متجر أطعمة وحلويات إلكتروني | Create an online food and sweets store |
| Meta description | بع الأطعمة والحلويات والبقالة أونلاين: مناطق توصيل بسعر لكل منطقة، مندوبوك الخاصون، وطلبات تصلك فورًا على هاتفك. | Sell food, sweets and groceries online: delivery prices by area, your own riders and every new order alerted on your phone. |
| H1 | متجر طعام يوصل لعملائك القريبين | A food store that delivers nearby |
| Secondary keywords | بيع الاكل اونلاين، متجر حلويات، متجر بقالة، منتجات غذائية | sentence-case English equivalents |
| Intent · market | Transactional (seller) / mixed · EG | same page, English locale |
| Related entities | food, sweets, grocery, riders | |
| Internal links out | /templates (category fo (14)), /industries, /solutions/free-online-store, 2 sibling industries | same paths under `/en` |
| Lengths (checked by script, same rule as `seo.lib.test.ts`) | ar 40/62 · en 48/62 · desc ar 112, en 123 | |

<a id="kw-n8"></a>

#### N8 `/industries/kids-store` (P3, New)

| Field | Arabic (default, unprefixed URL) | English (`/en/industries/kids-store`) |
|---|---|---|
| Primary keyword | متجر ملابس اطفال | online kids store |
| SEO title (`meta.<key>.title`; the layout adds the brand) | إنشاء متجر ملابس وألعاب أطفال إلكتروني | Create an online kids' clothing and toys store |
| Meta description | متجر لملابس الأطفال وألعابهم بقوالب مرحة، مقاسات حسب العمر، عروض الكمية، ودفع عند الاستلام في كل محافظة. | A kids' clothing and toys store with playful templates, sizes by age, quantity offers and cash on delivery across Egypt. |
| H1 | متجر أطفال مرح ومنظم | A cheerful, tidy kids' store |
| Secondary keywords | متجر العاب اطفال | sentence-case English equivalents |
| Intent · market | Transactional (seller) / mixed · EG | same page, English locale |
| Related entities | kids | |
| Internal links out | /templates (category ki (8)), /industries, /solutions/free-online-store, 2 sibling industries | same paths under `/en` |
| Lengths (checked by script, same rule as `seo.lib.test.ts`) | ar 45/62 · en 56/62 · desc ar 104, en 120 | |

<a id="kw-n9"></a>

#### N9 `/industries/car-accessories-store` (P3, New)

| Field | Arabic (default, unprefixed URL) | English (`/en/industries/car-accessories-store`) |
|---|---|---|
| Primary keyword | متجر اكسسوارات سيارات | online car accessories store |
| SEO title (`meta.<key>.title`; the layout adds the brand) | إنشاء متجر إكسسوارات وقطع سيارات إلكتروني | Create an online car accessories store |
| Meta description | متجر إكسسوارات وقطع سيارات بمواصفات لكل منتج، بحث سريع، دفع بالبطاقات عبر حسابك، وشحن مع بوسطة. | A car accessories and parts store with specs per product, quick search, card payments into your account and Bosta shipping. |
| H1 | متجر سيارات يجد فيه العميل ما يريد | A car store where buyers find the right part |
| Secondary keywords | قطع غيار سيارات اونلاين | sentence-case English equivalents |
| Intent · market | Transactional (seller) / mixed · EG | same page, English locale |
| Related entities | auto | |
| Internal links out | /templates (category au (10)), /industries, /solutions/free-online-store, 2 sibling industries | same paths under `/en` |
| Lengths (checked by script, same rule as `seo.lib.test.ts`) | ar 48/62 · en 48/62 · desc ar 95, en 123 | |

<a id="kw-n10"></a>

#### N10 `/industries/handmade-store` (P3, New)

| Field | Arabic (default, unprefixed URL) | English (`/en/industries/handmade-store`) |
|---|---|---|
| Primary keyword | متجر هاند ميد | online handmade store |
| SEO title (`meta.<key>.title`; the layout adds the brand) | إنشاء متجر منتجات يدوية وهدايا إلكتروني | Create an online handmade and gifts store |
| Meta description | اعرض منتجاتك اليدوية وهداياك بقوالب تحكي قصتك، طلبات مخصصة في ملاحظات الطلب، ودفع عند الاستلام أو تحويل. | Show your handmade products and gifts with templates that tell your story, custom requests in the order notes and COD or transfer. |
| H1 | متجر يحكي قصة منتجاتك اليدوية | A store that tells your handmade story |
| Secondary keywords | متجر هدايا، منتجات يدوية | sentence-case English equivalents |
| Intent · market | Transactional (seller) / mixed · EG | same page, English locale |
| Related entities | handmade, gifts | |
| Internal links out | /templates (category ge (handmade 4)), /industries, /solutions/free-online-store, 2 sibling industries | same paths under `/en` |
| Lengths (checked by script, same rule as `seo.lib.test.ts`) | ar 46/62 · en 51/62 · desc ar 104, en 130 | |

<a id="kw-n11"></a>

#### N11 `/industries/sports-store` (P3, New)

| Field | Arabic (default, unprefixed URL) | English (`/en/industries/sports-store`) |
|---|---|---|
| Primary keyword | متجر ملابس رياضية | online sportswear store |
| SEO title (`meta.<key>.title`; the layout adds the brand) | إنشاء متجر ملابس ومستلزمات رياضية إلكتروني | Create an online sportswear store |
| Meta description | متجر ملابس ومستلزمات رياضية بمقاسات وألوان، عروض الكمية، وكتالوج منتجات لإعلانات فيسبوك وتيك توك. | A sportswear and gear store with sizes and colours, quantity offers and a product catalog for Facebook and TikTok ads. |
| H1 | متجر رياضي جاهز للموسم | A sports store ready for the season |
| Secondary keywords | متجر احذية رياضية، مكملات | sentence-case English equivalents |
| Intent · market | Transactional (seller) / mixed · EG | same page, English locale |
| Related entities | sports | |
| Internal links out | /templates (category sp (14)), /industries, /solutions/free-online-store, 2 sibling industries | same paths under `/en` |
| Lengths (checked by script, same rule as `seo.lib.test.ts`) | ar 49/62 · en 43/62 · desc ar 97, en 118 | |

<a id="kw-c1"></a>

#### C1 `/compare/tallaby-vs-easyorders` (P1, Exists, gated)

| Field | Arabic (default, unprefixed URL) | English (`/en/compare/tallaby-vs-easyorders`) |
|---|---|---|
| Primary keyword | طلبي ولا ايزي اوردرز | Tallaby vs EasyOrders |
| SEO title (`meta.<key>.title`; the layout adds the brand) | طلبي أم ايزي اوردرز؟ مقارنة للتاجر في مصر | Tallaby vs EasyOrders: a comparison for Egypt |
| Meta description | مقارنة بين طلبي وايزي اوردرز بمصادر وتواريخ: السعر والرسوم، الدفع عند الاستلام، الشحن، بوابات الدفع في مصر، واللغة. | Tallaby and EasyOrders side by side, with sources and dates: price and fees, cash on delivery, shipping, payments in Egypt, language. |
| H1 | طلبي أم ايزي اوردرز؟ | Tallaby or EasyOrders? |
| Secondary keywords | ايزي اوردرز مصر، اسعار ايزي اوردرز، EasyOrders pricing | sentence-case English equivalents |
| Intent · market | Commercial investigation · EG | same page, English locale |
| Related entities | EasyOrders | |
| Internal links out | /alternatives/easyorders (if built), /compare, 3 sibling comparisons, /integrations/shopify-import when relevant | same paths under `/en` |
| Lengths (checked by script, same rule as `seo.lib.test.ts`) | ar 48/62 · en 55/62 · desc ar 115, en 133 | |

<a id="kw-c2"></a>

#### C2 `/compare/tallaby-vs-shopify` (P1, Exists, gated)

| Field | Arabic (default, unprefixed URL) | English (`/en/compare/tallaby-vs-shopify`) |
|---|---|---|
| Primary keyword | طلبي ولا شوبيفاي | Tallaby vs Shopify |
| SEO title (`meta.<key>.title`; the layout adds the brand) | طلبي أم شوبيفاي؟ مقارنة للتاجر في مصر | Tallaby vs Shopify: a comparison for Egypt |
| Meta description | مقارنة بين طلبي وشوبيفاي بمصادر وتواريخ: السعر والرسوم، الدفع عند الاستلام، الشحن، بوابات الدفع في مصر، واللغة. | Tallaby and Shopify side by side, with sources and dates: price and fees, cash on delivery, shipping, payments in Egypt, language. |
| H1 | طلبي أم شوبيفاي؟ | Tallaby or Shopify? |
| Secondary keywords | شوبيفاي مصر، اسعار شوبيفاي، Shopify pricing | sentence-case English equivalents |
| Intent · market | Commercial investigation · EG | same page, English locale |
| Related entities | Shopify | |
| Internal links out | /alternatives/shopify (if built), /compare, 3 sibling comparisons, /integrations/shopify-import when relevant | same paths under `/en` |
| Lengths (checked by script, same rule as `seo.lib.test.ts`) | ar 44/62 · en 52/62 · desc ar 111, en 130 | |

<a id="kw-c3"></a>

#### C3 `/compare/tallaby-vs-woocommerce` (P2, Exists, gated (facts need URLs))

| Field | Arabic (default, unprefixed URL) | English (`/en/compare/tallaby-vs-woocommerce`) |
|---|---|---|
| Primary keyword | طلبي ولا ووكومرس | Tallaby vs WooCommerce |
| SEO title (`meta.<key>.title`; the layout adds the brand) | طلبي أم ووكومرس؟ مقارنة للتاجر في مصر | Tallaby vs WooCommerce: a comparison for Egypt |
| Meta description | مقارنة بين طلبي وووكومرس بمصادر وتواريخ: السعر والرسوم، الدفع عند الاستلام، الشحن، بوابات الدفع في مصر، واللغة. | Tallaby and WooCommerce side by side, with sources and dates: price and fees, cash on delivery, shipping, payments in Egypt, language. |
| H1 | طلبي أم ووكومرس؟ | Tallaby or WooCommerce? |
| Secondary keywords | ووكومرس مصر، اسعار ووكومرس، WooCommerce pricing | sentence-case English equivalents |
| Intent · market | Commercial investigation · EG | same page, English locale |
| Related entities | WooCommerce | |
| Internal links out | /alternatives/woocommerce (if built), /compare, 3 sibling comparisons, /integrations/shopify-import when relevant | same paths under `/en` |
| Lengths (checked by script, same rule as `seo.lib.test.ts`) | ar 44/62 · en 56/62 · desc ar 111, en 134 | |

<a id="kw-c4"></a>

#### C4 `/compare/tallaby-vs-facebook-only` (P2, Exists, gated)

| Field | Arabic (default, unprefixed URL) | English (`/en/compare/tallaby-vs-facebook-only`) |
|---|---|---|
| Primary keyword | طلبي ولا صفحة فيسبوك | Tallaby vs a Facebook page |
| SEO title (`meta.<key>.title`; the layout adds the brand) | طلبي أم صفحة فيسبوك؟ مقارنة للتاجر في مصر | Tallaby vs a Facebook page: a comparison for Egypt |
| Meta description | مقارنة بين طلبي وصفحة فيسبوك بمصادر وتواريخ: السعر والرسوم، الدفع عند الاستلام، الشحن، بوابات الدفع في مصر، واللغة. | Tallaby and a Facebook page side by side, with sources and dates: price and fees, cash on delivery, shipping, payments in Egypt, language. |
| H1 | طلبي أم صفحة فيسبوك؟ | Tallaby or a Facebook page? |
| Secondary keywords | صفحة فيسبوك مصر، اسعار صفحة فيسبوك، a Facebook page pricing | sentence-case English equivalents |
| Intent · market | Commercial investigation · EG | same page, English locale |
| Related entities | a Facebook page | |
| Internal links out | /alternatives/facebook-only (if built), /compare, 3 sibling comparisons, /integrations/shopify-import when relevant | same paths under `/en` |
| Lengths (checked by script, same rule as `seo.lib.test.ts`) | ar 48/62 · en 60/62 · desc ar 115, en 138 | |

<a id="kw-c5"></a>

#### C5 `/compare/tallaby-vs-wuilt` (P2, New, gated)

| Field | Arabic (default, unprefixed URL) | English (`/en/compare/tallaby-vs-wuilt`) |
|---|---|---|
| Primary keyword | طلبي ولا ويلت | Tallaby vs Wuilt |
| SEO title (`meta.<key>.title`; the layout adds the brand) | طلبي أم ويلت؟ مقارنة للتاجر في مصر | Tallaby vs Wuilt: a comparison for Egypt |
| Meta description | مقارنة بين طلبي وويلت بمصادر وتواريخ: السعر والرسوم، الدفع عند الاستلام، الشحن، بوابات الدفع في مصر، واللغة. | Tallaby and Wuilt side by side, with sources and dates: price and fees, cash on delivery, shipping, payments in Egypt, language. |
| H1 | طلبي أم ويلت؟ | Tallaby or Wuilt? |
| Secondary keywords | ويلت مصر، اسعار ويلت، Wuilt pricing | sentence-case English equivalents |
| Intent · market | Commercial investigation · EG | same page, English locale |
| Related entities | Wuilt | |
| Internal links out | /alternatives/wuilt (if built), /compare, 3 sibling comparisons, /integrations/shopify-import when relevant | same paths under `/en` |
| Lengths (checked by script, same rule as `seo.lib.test.ts`) | ar 41/62 · en 50/62 · desc ar 108, en 128 | |

<a id="kw-c6"></a>

#### C6 `/compare/tallaby-vs-zid` (P2, New, gated)

| Field | Arabic (default, unprefixed URL) | English (`/en/compare/tallaby-vs-zid`) |
|---|---|---|
| Primary keyword | طلبي ولا زد | Tallaby vs Zid |
| SEO title (`meta.<key>.title`; the layout adds the brand) | طلبي أم زد؟ مقارنة للتاجر في مصر | Tallaby vs Zid: a comparison for Egypt |
| Meta description | مقارنة بين طلبي وزد بمصادر وتواريخ: السعر والرسوم، الدفع عند الاستلام، الشحن، بوابات الدفع في مصر، واللغة. | Tallaby and Zid side by side, with sources and dates: price and fees, cash on delivery, shipping, payments in Egypt, language. |
| H1 | طلبي أم زد؟ | Tallaby or Zid? |
| Secondary keywords | زد مصر، اسعار زد، Zid pricing | sentence-case English equivalents |
| Intent · market | Commercial investigation · EG | same page, English locale |
| Related entities | Zid | |
| Internal links out | /alternatives/zid (if built), /compare, 3 sibling comparisons, /integrations/shopify-import when relevant | same paths under `/en` |
| Lengths (checked by script, same rule as `seo.lib.test.ts`) | ar 39/62 · en 48/62 · desc ar 106, en 126 | |

<a id="kw-c7"></a>

#### C7 `/compare/tallaby-vs-expandcart` (P3, New, gated)

| Field | Arabic (default, unprefixed URL) | English (`/en/compare/tallaby-vs-expandcart`) |
|---|---|---|
| Primary keyword | طلبي ولا اكسباند كارت | Tallaby vs ExpandCart |
| SEO title (`meta.<key>.title`; the layout adds the brand) | طلبي أم اكسباند كارت؟ مقارنة للتاجر في مصر | Tallaby vs ExpandCart: a comparison for Egypt |
| Meta description | مقارنة بين طلبي واكسباند كارت بمصادر وتواريخ: السعر والرسوم، الدفع عند الاستلام، الشحن، بوابات الدفع في مصر، واللغة. | Tallaby and ExpandCart side by side, with sources and dates: price and fees, cash on delivery, shipping, payments in Egypt, language. |
| H1 | طلبي أم اكسباند كارت؟ | Tallaby or ExpandCart? |
| Secondary keywords | اكسباند كارت مصر، اسعار اكسباند كارت، ExpandCart pricing | sentence-case English equivalents |
| Intent · market | Commercial investigation · EG | same page, English locale |
| Related entities | ExpandCart | |
| Internal links out | /alternatives/expandcart (if built), /compare, 3 sibling comparisons, /integrations/shopify-import when relevant | same paths under `/en` |
| Lengths (checked by script, same rule as `seo.lib.test.ts`) | ar 49/62 · en 55/62 · desc ar 116, en 133 | |

<a id="kw-c8"></a>

#### C8 `/compare/tallaby-vs-youcan` (P3, New, gated)

| Field | Arabic (default, unprefixed URL) | English (`/en/compare/tallaby-vs-youcan`) |
|---|---|---|
| Primary keyword | طلبي ولا يوكان | Tallaby vs YouCan |
| SEO title (`meta.<key>.title`; the layout adds the brand) | طلبي أم يوكان؟ مقارنة للتاجر في مصر | Tallaby vs YouCan: a comparison for Egypt |
| Meta description | مقارنة بين طلبي ويوكان بمصادر وتواريخ: السعر والرسوم، الدفع عند الاستلام، الشحن، بوابات الدفع في مصر، واللغة. | Tallaby and YouCan side by side, with sources and dates: price and fees, cash on delivery, shipping, payments in Egypt, language. |
| H1 | طلبي أم يوكان؟ | Tallaby or YouCan? |
| Secondary keywords | يوكان مصر، اسعار يوكان، YouCan pricing | sentence-case English equivalents |
| Intent · market | Commercial investigation · EG | same page, English locale |
| Related entities | YouCan | |
| Internal links out | /alternatives/youcan (if built), /compare, 3 sibling comparisons, /integrations/shopify-import when relevant | same paths under `/en` |
| Lengths (checked by script, same rule as `seo.lib.test.ts`) | ar 42/62 · en 51/62 · desc ar 109, en 129 | |

<a id="kw-c9"></a>

#### C9 `/compare/tallaby-vs-lightfunnels` (P3, New, gated)

| Field | Arabic (default, unprefixed URL) | English (`/en/compare/tallaby-vs-lightfunnels`) |
|---|---|---|
| Primary keyword | طلبي ولا لايت فانلز | Tallaby vs Lightfunnels |
| SEO title (`meta.<key>.title`; the layout adds the brand) | طلبي أم لايت فانلز؟ مقارنة للتاجر في مصر | Tallaby vs Lightfunnels: a comparison for Egypt |
| Meta description | مقارنة بين طلبي ولايت فانلز بمصادر وتواريخ: السعر والرسوم، الدفع عند الاستلام، الشحن، بوابات الدفع في مصر، واللغة. | Tallaby and Lightfunnels side by side, with sources and dates: price and fees, cash on delivery, shipping, payments in Egypt, language. |
| H1 | طلبي أم لايت فانلز؟ | Tallaby or Lightfunnels? |
| Secondary keywords | لايت فانلز مصر، اسعار لايت فانلز، Lightfunnels pricing | sentence-case English equivalents |
| Intent · market | Commercial investigation · EG | same page, English locale |
| Related entities | Lightfunnels | |
| Internal links out | /alternatives/lightfunnels (if built), /compare, 3 sibling comparisons, /integrations/shopify-import when relevant | same paths under `/en` |
| Lengths (checked by script, same rule as `seo.lib.test.ts`) | ar 47/62 · en 57/62 · desc ar 114, en 135 | |

<a id="kw-c10"></a>

#### C10 `/compare/tallaby-vs-qumra` (P3, New, gated)

| Field | Arabic (default, unprefixed URL) | English (`/en/compare/tallaby-vs-qumra`) |
|---|---|---|
| Primary keyword | طلبي ولا قمرة | Tallaby vs Qumra |
| SEO title (`meta.<key>.title`; the layout adds the brand) | طلبي أم قمرة؟ مقارنة للتاجر في مصر | Tallaby vs Qumra: a comparison for Egypt |
| Meta description | مقارنة بين طلبي وقمرة بمصادر وتواريخ: السعر والرسوم، الدفع عند الاستلام، الشحن، بوابات الدفع في مصر، واللغة. | Tallaby and Qumra side by side, with sources and dates: price and fees, cash on delivery, shipping, payments in Egypt, language. |
| H1 | طلبي أم قمرة؟ | Tallaby or Qumra? |
| Secondary keywords | قمرة مصر، اسعار قمرة، Qumra pricing | sentence-case English equivalents |
| Intent · market | Commercial investigation · EG | same page, English locale |
| Related entities | Qumra | |
| Internal links out | /alternatives/qumra (if built), /compare, 3 sibling comparisons, /integrations/shopify-import when relevant | same paths under `/en` |
| Lengths (checked by script, same rule as `seo.lib.test.ts`) | ar 41/62 · en 50/62 · desc ar 108, en 128 | |

<a id="kw-c11"></a>

#### C11 `/compare/tallaby-vs-shanta` (P3, New, gated)

| Field | Arabic (default, unprefixed URL) | English (`/en/compare/tallaby-vs-shanta`) |
|---|---|---|
| Primary keyword | طلبي ولا شنطة | Tallaby vs Shanta |
| SEO title (`meta.<key>.title`; the layout adds the brand) | طلبي أم شنطة؟ مقارنة للتاجر في مصر | Tallaby vs Shanta: a comparison for Egypt |
| Meta description | مقارنة بين طلبي وشنطة بمصادر وتواريخ: السعر والرسوم، الدفع عند الاستلام، الشحن، بوابات الدفع في مصر، واللغة. | Tallaby and Shanta side by side, with sources and dates: price and fees, cash on delivery, shipping, payments in Egypt, language. |
| H1 | طلبي أم شنطة؟ | Tallaby or Shanta? |
| Secondary keywords | شنطة مصر، اسعار شنطة، Shanta pricing | sentence-case English equivalents |
| Intent · market | Commercial investigation · EG | same page, English locale |
| Related entities | Shanta | |
| Internal links out | /alternatives/shanta (if built), /compare, 3 sibling comparisons, /integrations/shopify-import when relevant | same paths under `/en` |
| Lengths (checked by script, same rule as `seo.lib.test.ts`) | ar 41/62 · en 51/62 · desc ar 108, en 129 | |

<a id="kw-c12"></a>

#### C12 `/compare/tallaby-vs-halaorders` (P3, New, gated)

| Field | Arabic (default, unprefixed URL) | English (`/en/compare/tallaby-vs-halaorders`) |
|---|---|---|
| Primary keyword | طلبي ولا هلا أوردرز | Tallaby vs HalaOrders |
| SEO title (`meta.<key>.title`; the layout adds the brand) | طلبي أم هلا أوردرز؟ مقارنة للتاجر في مصر | Tallaby vs HalaOrders: a comparison for Egypt |
| Meta description | مقارنة بين طلبي وهلا أوردرز بمصادر وتواريخ: السعر والرسوم، الدفع عند الاستلام، الشحن، بوابات الدفع في مصر، واللغة. | Tallaby and HalaOrders side by side, with sources and dates: price and fees, cash on delivery, shipping, payments in Egypt, language. |
| H1 | طلبي أم هلا أوردرز؟ | Tallaby or HalaOrders? |
| Secondary keywords | هلا أوردرز مصر، اسعار هلا أوردرز، HalaOrders pricing | sentence-case English equivalents |
| Intent · market | Commercial investigation · EG | same page, English locale |
| Related entities | HalaOrders | |
| Internal links out | /alternatives/halaorders (if built), /compare, 3 sibling comparisons, /integrations/shopify-import when relevant | same paths under `/en` |
| Lengths (checked by script, same rule as `seo.lib.test.ts`) | ar 47/62 · en 55/62 · desc ar 114, en 133 | |

<a id="kw-c13"></a>

#### C13 `/compare/tallaby-vs-salla` (P3, New, gated)

| Field | Arabic (default, unprefixed URL) | English (`/en/compare/tallaby-vs-salla`) |
|---|---|---|
| Primary keyword | طلبي ولا سلة | Tallaby vs Salla |
| SEO title (`meta.<key>.title`; the layout adds the brand) | طلبي أم سلة؟ مقارنة للتاجر في مصر | Tallaby vs Salla: a comparison for Egypt |
| Meta description | مقارنة بين طلبي وسلة بمصادر وتواريخ: السعر والرسوم، الدفع عند الاستلام، الشحن، بوابات الدفع في مصر، واللغة. | Tallaby and Salla side by side, with sources and dates: price and fees, cash on delivery, shipping, payments in Egypt, language. |
| H1 | طلبي أم سلة؟ | Tallaby or Salla? |
| Secondary keywords | سلة مصر، اسعار سلة، Salla pricing | sentence-case English equivalents |
| Intent · market | Commercial investigation · EG | same page, English locale |
| Related entities | Salla | |
| Internal links out | /alternatives/salla (if built), /compare, 3 sibling comparisons, /integrations/shopify-import when relevant | same paths under `/en` |
| Lengths (checked by script, same rule as `seo.lib.test.ts`) | ar 40/62 · en 50/62 · desc ar 107, en 128 | |

<a id="kw-c14"></a>

#### C14 `/compare/tallaby-vs-wix` (P3, New, gated)

| Field | Arabic (default, unprefixed URL) | English (`/en/compare/tallaby-vs-wix`) |
|---|---|---|
| Primary keyword | طلبي ولا ويكس | Tallaby vs Wix |
| SEO title (`meta.<key>.title`; the layout adds the brand) | طلبي أم ويكس؟ مقارنة للتاجر في مصر | Tallaby vs Wix: a comparison for Egypt |
| Meta description | مقارنة بين طلبي وويكس بمصادر وتواريخ: السعر والرسوم، الدفع عند الاستلام، الشحن، بوابات الدفع في مصر، واللغة. | Tallaby and Wix side by side, with sources and dates: price and fees, cash on delivery, shipping, payments in Egypt, language. |
| H1 | طلبي أم ويكس؟ | Tallaby or Wix? |
| Secondary keywords | ويكس مصر، اسعار ويكس، Wix pricing | sentence-case English equivalents |
| Intent · market | Commercial investigation · EG | same page, English locale |
| Related entities | Wix | |
| Internal links out | /alternatives/wix (if built), /compare, 3 sibling comparisons, /integrations/shopify-import when relevant | same paths under `/en` |
| Lengths (checked by script, same rule as `seo.lib.test.ts`) | ar 41/62 · en 48/62 · desc ar 108, en 126 | |

<a id="kw-a1"></a>

#### A1 `/alternatives/easyorders` (P1, New, gated)

| Field | Arabic (default, unprefixed URL) | English (`/en/alternatives/easyorders`) |
|---|---|---|
| Primary keyword | بديل ايزي اوردرز | EasyOrders alternative |
| SEO title (`meta.<key>.title`; the layout adds the brand) | بديل ايزي اوردرز في مصر: خيارات ومقارنة بالأسعار | EasyOrders alternatives for sellers in Egypt |
| Meta description | تبحث عن بديل ايزي اوردرز؟ قارن البدائل المتاحة في مصر بالرسوم والشحن والدفع عند الاستلام، بمصادر وتواريخ، وتعرف كيف تنتقل. | Looking for a EasyOrders alternative? Compare the options in Egypt on fees, shipping and cash on delivery, with sources, and see how to move. |
| H1 | بدائل ايزي اوردرز للتاجر في مصر | EasyOrders alternatives for sellers in Egypt |
| Secondary keywords | بديل ايزي اوردر، منصة زي ايزي اوردرز، easy orders alternative | sentence-case English equivalents |
| Intent · market | Commercial investigation · EG | same page, English locale |
| Related entities | EasyOrders | |
| Internal links out | /compare/tallaby-vs-easyorders, /alternatives, /integrations/shopify-import, /pricing | same paths under `/en` |
| Lengths (checked by script, same rule as `seo.lib.test.ts`) | ar 55/62 · en 54/62 · desc ar 122, en 141 | |

<a id="kw-a2"></a>

#### A2 `/alternatives/shopify` (P1, New, gated)

| Field | Arabic (default, unprefixed URL) | English (`/en/alternatives/shopify`) |
|---|---|---|
| Primary keyword | بديل شوبيفاي في مصر | Shopify alternative |
| SEO title (`meta.<key>.title`; the layout adds the brand) | بديل شوبيفاي في مصر: خيارات ومقارنة بالأسعار | Shopify alternatives for sellers in Egypt |
| Meta description | تبحث عن بديل شوبيفاي؟ قارن البدائل المتاحة في مصر بالرسوم والشحن والدفع عند الاستلام، بمصادر وتواريخ، وتعرف كيف تنتقل. | Looking for a Shopify alternative? Compare the options in Egypt on fees, shipping and cash on delivery, with sources, and see how to move. |
| H1 | بدائل شوبيفاي للتاجر في مصر | Shopify alternatives for sellers in Egypt |
| Secondary keywords | بديل شوبيفاي، بديل شوبيفاي مجاني، بديل شوبيفاي المصري، shopify alternative egypt, does shopify work in egypt | sentence-case English equivalents |
| Intent · market | Commercial investigation · EG | same page, English locale |
| Related entities | Shopify | |
| Internal links out | /compare/tallaby-vs-shopify, /alternatives, /integrations/shopify-import, /pricing | same paths under `/en` |
| Lengths (checked by script, same rule as `seo.lib.test.ts`) | ar 51/62 · en 51/62 · desc ar 118, en 138 | |

<a id="kw-a3"></a>

#### A3 `/alternatives/woocommerce` (P2, New, gated)

| Field | Arabic (default, unprefixed URL) | English (`/en/alternatives/woocommerce`) |
|---|---|---|
| Primary keyword | بديل ووكومرس | WooCommerce alternative |
| SEO title (`meta.<key>.title`; the layout adds the brand) | بديل ووكومرس في مصر: خيارات ومقارنة بالأسعار | WooCommerce alternatives for sellers in Egypt |
| Meta description | تبحث عن بديل ووكومرس؟ قارن البدائل المتاحة في مصر بالرسوم والشحن والدفع عند الاستلام، بمصادر وتواريخ، وتعرف كيف تنتقل. | Looking for a WooCommerce alternative? Compare the options in Egypt on fees, shipping and cash on delivery, with sources, and see how to move. |
| H1 | بدائل ووكومرس للتاجر في مصر | WooCommerce alternatives for sellers in Egypt |
| Secondary keywords | متجر ووردبريس، استضافة متجر | sentence-case English equivalents |
| Intent · market | Commercial investigation · EG | same page, English locale |
| Related entities | WooCommerce | |
| Internal links out | /compare/tallaby-vs-woocommerce, /alternatives, /integrations/shopify-import, /pricing | same paths under `/en` |
| Lengths (checked by script, same rule as `seo.lib.test.ts`) | ar 51/62 · en 55/62 · desc ar 118, en 142 | |

<a id="kw-a4"></a>

#### A4 `/alternatives/wuilt` (P3, New, gated)

| Field | Arabic (default, unprefixed URL) | English (`/en/alternatives/wuilt`) |
|---|---|---|
| Primary keyword | بديل ويلت | Wuilt alternative |
| SEO title (`meta.<key>.title`; the layout adds the brand) | بديل ويلت في مصر: خيارات ومقارنة بالأسعار | Wuilt alternatives for sellers in Egypt |
| Meta description | تبحث عن بديل ويلت؟ قارن البدائل المتاحة في مصر بالرسوم والشحن والدفع عند الاستلام، بمصادر وتواريخ، وتعرف كيف تنتقل. | Looking for a Wuilt alternative? Compare the options in Egypt on fees, shipping and cash on delivery, with sources, and see how to move. |
| H1 | بدائل ويلت للتاجر في مصر | Wuilt alternatives for sellers in Egypt |
| Secondary keywords | ويلت مجاني | sentence-case English equivalents |
| Intent · market | Commercial investigation · EG | same page, English locale |
| Related entities | Wuilt | |
| Internal links out | /compare/tallaby-vs-wuilt, /alternatives, /integrations/shopify-import, /pricing | same paths under `/en` |
| Lengths (checked by script, same rule as `seo.lib.test.ts`) | ar 48/62 · en 49/62 · desc ar 115, en 136 | |

<a id="kw-a5"></a>

#### A5 `/alternatives/salla` (P3, New, gated)

| Field | Arabic (default, unprefixed URL) | English (`/en/alternatives/salla`) |
|---|---|---|
| Primary keyword | بديل سلة في مصر | Salla alternative |
| SEO title (`meta.<key>.title`; the layout adds the brand) | بديل سلة في مصر: خيارات ومقارنة بالأسعار | Salla alternatives for sellers in Egypt |
| Meta description | تبحث عن بديل سلة؟ قارن البدائل المتاحة في مصر بالرسوم والشحن والدفع عند الاستلام، بمصادر وتواريخ، وتعرف كيف تنتقل. | Looking for a Salla alternative? Compare the options in Egypt on fees, shipping and cash on delivery, with sources, and see how to move. |
| H1 | بدائل سلة للتاجر في مصر | Salla alternatives for sellers in Egypt |
| Secondary keywords | سلة مصر، منصة سلة مصر | sentence-case English equivalents |
| Intent · market | Commercial investigation · EG | same page, English locale |
| Related entities | Salla | |
| Internal links out | /compare/tallaby-vs-salla, /alternatives, /integrations/shopify-import, /pricing | same paths under `/en` |
| Lengths (checked by script, same rule as `seo.lib.test.ts`) | ar 47/62 · en 49/62 · desc ar 114, en 136 | |

<a id="kw-a6"></a>

#### A6 `/alternatives/expandcart` (P3, New, gated)

| Field | Arabic (default, unprefixed URL) | English (`/en/alternatives/expandcart`) |
|---|---|---|
| Primary keyword | بديل اكسباند كارت | ExpandCart alternative |
| SEO title (`meta.<key>.title`; the layout adds the brand) | بديل اكسباند كارت في مصر: خيارات ومقارنة بالأسعار | ExpandCart alternatives for sellers in Egypt |
| Meta description | تبحث عن بديل اكسباند كارت؟ قارن البدائل المتاحة في مصر بالرسوم والشحن والدفع عند الاستلام، بمصادر وتواريخ، وتعرف كيف تنتقل. | Looking for a ExpandCart alternative? Compare the options in Egypt on fees, shipping and cash on delivery, with sources, and see how to move. |
| H1 | بدائل اكسباند كارت للتاجر في مصر | ExpandCart alternatives for sellers in Egypt |
| Secondary keywords | باقات اكسباند كارت، expandcart egypt | sentence-case English equivalents |
| Intent · market | Commercial investigation · EG | same page, English locale |
| Related entities | ExpandCart | |
| Internal links out | /compare/tallaby-vs-expandcart, /alternatives, /integrations/shopify-import, /pricing | same paths under `/en` |
| Lengths (checked by script, same rule as `seo.lib.test.ts`) | ar 56/62 · en 54/62 · desc ar 123, en 141 | |

<a id="kw-a7"></a>

#### A7 `/alternatives/wix` (P3, New, gated)

| Field | Arabic (default, unprefixed URL) | English (`/en/alternatives/wix`) |
|---|---|---|
| Primary keyword | بديل ويكس للمتاجر | Wix alternative |
| SEO title (`meta.<key>.title`; the layout adds the brand) | بديل ويكس في مصر: خيارات ومقارنة بالأسعار | Wix alternatives for sellers in Egypt |
| Meta description | تبحث عن بديل ويكس؟ قارن البدائل المتاحة في مصر بالرسوم والشحن والدفع عند الاستلام، بمصادر وتواريخ، وتعرف كيف تنتقل. | Looking for a Wix alternative? Compare the options in Egypt on fees, shipping and cash on delivery, with sources, and see how to move. |
| H1 | بدائل ويكس للتاجر في مصر | Wix alternatives for sellers in Egypt |
| Secondary keywords | ويكس عربي، wix arabic store | sentence-case English equivalents |
| Intent · market | Commercial investigation · EG | same page, English locale |
| Related entities | Wix | |
| Internal links out | /compare/tallaby-vs-wix, /alternatives, /integrations/shopify-import, /pricing | same paths under `/en` |
| Lengths (checked by script, same rule as `seo.lib.test.ts`) | ar 48/62 · en 47/62 · desc ar 115, en 134 | |

<a id="kw-b1"></a>

#### B1 `/blog/best-ecommerce-platforms-egypt` (P1, New (code ranking page, gated))

| Field | Arabic (default, unprefixed URL) | English (`/en/blog/best-ecommerce-platforms-egypt`) |
|---|---|---|
| Primary keyword | افضل منصة لانشاء متجر الكتروني | best ecommerce platform in Egypt |
| SEO title (`meta.<key>.title`; the layout adds the brand) | أفضل منصات إنشاء متجر إلكتروني في مصر: مقارنة بمصادر | Best ecommerce platforms in Egypt, with sources |
| Meta description | مقارنة منصات إنشاء المتاجر في مصر بالأسعار والرسوم والشحن والدفع عند الاستلام، مع مصدر وتاريخ لكل معلومة، ومتى تناسبك كل منصة. | Ecommerce platforms in Egypt compared on price, fees, shipping and cash on delivery, with a source and date for every fact. |
| H1 | أفضل منصات إنشاء متجر إلكتروني في مصر | The best ecommerce platforms in Egypt |
| Secondary keywords | افضل منصات التجارة الالكترونية في مصر، افضل منصة عربية لانشاء متجر الكتروني، منصات المتاجر الالكترونية، اشهر منصات المتاجر الالكترونية | sentence-case English equivalents |
| Intent · market | Informational · EG | same page, English locale |
| Internal links out | /compare/*, /alternatives/*, /solutions/online-store-egypt, /tools/platform-fee-calculator | same paths under `/en` |
| Lengths (checked by script, same rule as `seo.lib.test.ts`) | ar 59/62 · en 57/62 · desc ar 126, en 123 | |

<a id="kw-b2"></a>

#### B2 `/blog/online-store-cost-egypt` (P1, New post)

| Field | Arabic (default, unprefixed URL) | English (`/en/blog/online-store-cost-egypt`) |
|---|---|---|
| Primary keyword | تكلفة انشاء متجر الكتروني في مصر | online store cost in Egypt |
| SEO title (`meta.<key>.title`; the layout adds the brand) | تكلفة إنشاء متجر إلكتروني في مصر: دليل شهري واضح | How much an online store costs in Egypt |
| Meta description | كم يكلف متجرك الإلكتروني في مصر؟ رسوم المنصة، النطاق، الشحن، بوابات الدفع، والإعلانات، مع حاسبة تحسب تكلفتك حسب عدد طلباتك. | What an online store really costs in Egypt: platform fees, domain, shipping, payment gateways and ads, with a calculator for your order count. |
| H1 | كم يكلف متجر إلكتروني في مصر؟ | What does an online store cost in Egypt? |
| Secondary keywords | كم تكلفة انشاء متجر الكتروني، اسعار انشاء متجر الكتروني، تكلفة انشاء متجر الكتروني 2026 | sentence-case English equivalents |
| Intent · market | Informational · EG | same page, English locale |
| Internal links out | /tools/store-cost-calculator, /pricing, /solutions/free-online-store | same paths under `/en` |
| Lengths (checked by script, same rule as `seo.lib.test.ts`) | ar 55/62 · en 49/62 · desc ar 123, en 142 | |

<a id="kw-b3"></a>

#### B3 `/blog/shipping-companies-egypt` (P2, New post)

| Field | Arabic (default, unprefixed URL) | English (`/en/blog/shipping-companies-egypt`) |
|---|---|---|
| Primary keyword | شركات الشحن في مصر | shipping companies in Egypt for online stores |
| SEO title (`meta.<key>.title`; the layout adds the brand) | شركات الشحن في مصر للمتاجر الإلكترونية: كيف تختار | Shipping companies in Egypt for online stores |
| Meta description | دليل اختيار شركة شحن لمتجرك في مصر: التحصيل عند الاستلام، التغطية، المرتجعات، والربط بالمتجر، مع خطوات الربط ببوسطة. | How to choose a shipping company for your store in Egypt: COD collection, coverage, returns and store integration, with Bosta steps. |
| H1 | كيف تختار شركة شحن لمتجرك في مصر | How to choose a shipping company in Egypt |
| Secondary keywords | شركات الشحن في مصر واسعارها، افضل شركات الشحن في مصر، شركات الشحن الأعلى تقييمًا | sentence-case English equivalents |
| Intent · market | Informational · EG | same page, English locale |
| Internal links out | /integrations/bosta, /integrations/wassalha, /features/shipping | same paths under `/en` |
| Lengths (checked by script, same rule as `seo.lib.test.ts`) | ar 56/62 · en 55/62 · desc ar 116, en 132 | |

<a id="kw-b4"></a>

#### B4 `/blog/payment-gateways-egypt` (P2, New post)

| Field | Arabic (default, unprefixed URL) | English (`/en/blog/payment-gateways-egypt`) |
|---|---|---|
| Primary keyword | بوابة دفع مصرية | payment gateways in Egypt |
| SEO title (`meta.<key>.title`; the layout adds the brand) | بوابات الدفع في مصر للمتاجر الإلكترونية: دليل للتاجر | Payment gateways in Egypt for online stores |
| Meta description | كيف تستقبل الدفع أونلاين في مصر: الدفع عند الاستلام، Paymob وكاشير، إنستاباي والمحافظ، وما تحتاجه لفتح حساب لدى بوابة الدفع. | How to take online payments in Egypt: cash on delivery, Paymob and Kashier, InstaPay and wallets, and what a gateway account needs. |
| H1 | كيف تستقبل الدفع أونلاين في مصر | How to take payments online in Egypt |
| Secondary keywords | بوابة دفع الكتروني، بوابة دفع بدون سجل تجاري، بوابة دفع فوري، بوابة دفع فودافون كاش | sentence-case English equivalents |
| Intent · market | Informational · EG | same page, English locale |
| Internal links out | /integrations/paymob, /integrations/kashier, /integrations/instapay-wallets | same paths under `/en` |
| Lengths (checked by script, same rule as `seo.lib.test.ts`) | ar 59/62 · en 53/62 · desc ar 124, en 131 | |

<a id="kw-b5"></a>

#### B5 `/blog/cod-vs-online` (P2, Fallback stub exists; write the body)

| Field | Arabic (default, unprefixed URL) | English (`/en/blog/cod-vs-online`) |
|---|---|---|
| Primary keyword | الدفع عند الاستلام ام الدفع الالكتروني | cash on delivery vs online payment |
| SEO title (`meta.<key>.title`; the layout adds the brand) | الدفع عند الاستلام أم الدفع الإلكتروني: أيهما لمتجرك؟ | Cash on delivery or online payment for your store? |
| Meta description | متى يناسبك الدفع عند الاستلام ومتى تحتاج الدفع الإلكتروني، وكيف تقلل المرتجعات والطلبات الوهمية في كل حالة. | When cash on delivery fits and when you need online payment, and how to cut returns and fake orders either way. |
| H1 | الدفع عند الاستلام أم الدفع الإلكتروني؟ | Cash on delivery or online payment? |
| Secondary keywords | n/a | sentence-case English equivalents |
| Intent · market | Informational · EG | same page, English locale |
| Internal links out | /solutions/cash-on-delivery-store, /features/fake-order-protection | same paths under `/en` |
| Lengths (checked by script, same rule as `seo.lib.test.ts`) | ar 60/62 · en 60/62 · desc ar 107, en 111 | |

<a id="kw-b6"></a>

#### B6 `/blog/how-to-sell-online-egypt` (P2, New post)

| Field | Arabic (default, unprefixed URL) | English (`/en/blog/how-to-sell-online-egypt`) |
|---|---|---|
| Primary keyword | البيع اونلاين في مصر | how to sell online in Egypt |
| SEO title (`meta.<key>.title`; the layout adds the brand) | كيف تبدأ البيع أونلاين في مصر: دليل للمبتدئين | How to start selling online in Egypt |
| Meta description | خطوات البدء في البيع أونلاين في مصر: اختيار المنتج، التسعير، المتجر، الدفع والشحن، وأول إعلان، دون رأس مال كبير. | How to start selling online in Egypt: choosing a product, pricing, your store, payments and shipping, and your first ad. |
| H1 | كيف تبدأ البيع أونلاين في مصر | How to start selling online in Egypt |
| Secondary keywords | ازاي ابيع اونلاين، ازاي ابيع منتجات اونلاين، مواقع البيع اونلاين في مصر، متجر الكتروني بدون راس مال | sentence-case English equivalents |
| Intent · market | Informational · EG | same page, English locale |
| Internal links out | /solutions/create-online-store, /tools/profit-margin-calculator, /blog/first-100-orders | same paths under `/en` |
| Lengths (checked by script, same rule as `seo.lib.test.ts`) | ar 52/62 · en 46/62 · desc ar 112, en 120 | |

<a id="kw-b7"></a>

#### B7 `/blog/reduce-fake-orders` (P2, New post)

| Field | Arabic (default, unprefixed URL) | English (`/en/blog/reduce-fake-orders`) |
|---|---|---|
| Primary keyword | تقليل الطلبات الوهمية | how to reduce fake COD orders |
| SEO title (`meta.<key>.title`; the layout adds the brand) | كيف تقلل الطلبات الوهمية في الدفع عند الاستلام | How to reduce fake cash on delivery orders |
| Meta description | أسباب الطلبات الوهمية في مصر وطرق تقليلها: تأكيد الطلب، حظر الأرقام، العربون، ومتابعة نسبة الرفض لكل محافظة. | Why fake cash on delivery orders happen in Egypt and how to cut them: order confirmation, blocking numbers and refusal rates. |
| H1 | كيف تقلل الطلبات الوهمية | How to reduce fake orders |
| Secondary keywords | الطلبات الوهمية، نسبة المرتجعات، كيفية حساب نسبة المرتجعات | sentence-case English equivalents |
| Intent · market | Informational · EG | same page, English locale |
| Internal links out | /features/fake-order-protection, /features/reports | same paths under `/en` |
| Lengths (checked by script, same rule as `seo.lib.test.ts`) | ar 53/62 · en 52/62 · desc ar 108, en 125 | |

<a id="kw-b8"></a>

#### B8 `/blog/shopify-in-egypt` (P2, New post (gated))

| Field | Arabic (default, unprefixed URL) | English (`/en/blog/shopify-in-egypt`) |
|---|---|---|
| Primary keyword | هل شوبيفاي يعمل في مصر | does Shopify work in Egypt |
| SEO title (`meta.<key>.title`; the layout adds the brand) | شوبيفاي في مصر: السعر والدفع والشحن | Shopify in Egypt: price, payments and shipping |
| Meta description | هل يعمل شوبيفاي في مصر؟ سعر الاشتراك كما يظهر من مصر، رسوم بوابات الدفع الخارجية، وبوابات الدفع والشحن المتاحة، بمصادر وتواريخ. | Does Shopify work in Egypt? Plan prices as seen from Egypt, third-party gateway fees, and the payment and shipping apps, with sources. |
| H1 | شوبيفاي في مصر: ما تحتاج معرفته | Shopify in Egypt: what you need to know |
| Secondary keywords | سعر اشتراك شوبيفاي في مصر، بوابات الدفع في شوبيفاي مصر، ازاي ادفع اشتراك شوبيفاي في مصر | sentence-case English equivalents |
| Intent · market | Informational · EG | same page, English locale |
| Internal links out | /alternatives/shopify, /compare/tallaby-vs-shopify, /tools/platform-fee-calculator | same paths under `/en` |
| Lengths (checked by script, same rule as `seo.lib.test.ts`) | ar 42/62 · en 56/62 · desc ar 127, en 134 | |

<a id="kw-b9"></a>

#### B9 `/blog/shopify-vs-easyorders` (P3, New post (gated))

| Field | Arabic (default, unprefixed URL) | English (`/en/blog/shopify-vs-easyorders`) |
|---|---|---|
| Primary keyword | شوبيفاي ولا ايزي اوردر | Shopify vs EasyOrders |
| SEO title (`meta.<key>.title`; the layout adds the brand) | شوبيفاي أم ايزي اوردرز؟ وأين يقف طلبي | Shopify or EasyOrders? And where Tallaby fits |
| Meta description | مقارنة شوبيفاي وايزي اوردرز للتاجر في مصر بالأسعار والرسوم والدفع عند الاستلام، بمصادر وتواريخ، ومتى يكون طلبي خيارًا ثالثًا. | Shopify and EasyOrders compared for sellers in Egypt on price, fees and cash on delivery, with sources, and when Tallaby is a third option. |
| H1 | شوبيفاي أم ايزي اوردرز؟ | Shopify or EasyOrders? |
| Secondary keywords | n/a | sentence-case English equivalents |
| Intent · market | Informational · EG | same page, English locale |
| Internal links out | /compare/tallaby-vs-shopify, /compare/tallaby-vs-easyorders | same paths under `/en` |
| Lengths (checked by script, same rule as `seo.lib.test.ts`) | ar 44/62 · en 55/62 · desc ar 125, en 139 | |

<a id="kw-b10"></a>

#### B10 `/blog/first-100-orders` (P3, Exists in code fallback (stub); write the body)

| Field | Arabic (default, unprefixed URL) | English (`/en/blog/first-100-orders`) |
|---|---|---|
| Primary keyword | كيفية الحصول على أول 100 طلب | how to get your first 100 online orders |
| SEO title (`meta.<key>.title`; the layout adds the brand) | كيف تحصل على أول 100 طلب لمتجرك الإلكتروني | How to get your first 100 online orders |
| Meta description | خطة عملية لأول 100 طلب في متجرك: من تبيع لهم أولًا، أول إعلان، العروض، وتأكيد الطلبات حتى لا تضيع في المرتجعات. | A practical plan for your store's first 100 orders: who to sell to first, your first ad, offers and confirming orders to avoid returns. |
| H1 | أول 100 طلب لمتجرك الإلكتروني | Your store's first 100 orders |
| Secondary keywords | أول طلب في المتجر الإلكتروني، زيادة الطلبات | sentence-case English equivalents |
| Intent · market | Informational · EG | same page, English locale |
| Internal links out | /features/offers-and-coupons, /features/fake-order-protection, /blog/market-online-store | same paths under `/en` |
| Lengths (checked by script, same rule as `seo.lib.test.ts`) | ar 49/62 · en 49/62 · desc ar 111, en 135 | |

<a id="kw-b15"></a>

#### B15 `/blog/pricing-products` (P2, Exists (has a body); retitle)

| Field | Arabic (default, unprefixed URL) | English (`/en/blog/pricing-products`) |
|---|---|---|
| Primary keyword | تسعير المنتجات | how to price products for online selling |
| SEO title (`meta.<key>.title`; the layout adds the brand) | كيف تسعّر منتجاتك للبيع أونلاين بربح حقيقي | How to price products for online selling |
| Meta description | طريقة تسعير منتجاتك للبيع أونلاين في مصر: التكلفة والشحن والإعلانات ورسوم المنصة والمرتجعات، مع حاسبة هامش الربح. | How to price products for online selling in Egypt: cost, shipping, ads, platform fees and returns, with a profit margin calculator. |
| H1 | كيف تسعّر منتجاتك للبيع أونلاين | How to price your products for online selling |
| Secondary keywords | كيفية حساب سعر البيع للمنتج، حساب نسبة الربح من سعر البيع، تسعير المنتجات اليدوية | sentence-case English equivalents |
| Intent · market | Informational · EG | same page, English locale |
| Internal links out | /tools/profit-margin-calculator, /tools/store-cost-calculator | same paths under `/en` |
| Lengths (checked by script, same rule as `seo.lib.test.ts`) | ar 49/62 · en 50/62 · desc ar 113, en 131 | |

<a id="kw-b16"></a>

#### B16 `/blog/best-free-ecommerce-platforms` (P2, New post (gated))

| Field | Arabic (default, unprefixed URL) | English (`/en/blog/best-free-ecommerce-platforms`) |
|---|---|---|
| Primary keyword | افضل منصة لانشاء متجر الكتروني مجاني | best free ecommerce platforms |
| SEO title (`meta.<key>.title`; the layout adds the brand) | أفضل منصات المتاجر المجانية في مصر: ما المجاني فعلًا؟ | Best free ecommerce platforms in Egypt, compared |
| Meta description | أي منصات المتاجر مجانية فعلًا في مصر؟ نقارن الخطط المجانية ورسوم كل طلب وشروط التفعيل بمصادر وتواريخ، دون وعود غير حقيقية. | Which store platforms are really free in Egypt? Free plans, per-order fees and activation rules compared, with sources and dates. |
| H1 | ما المجاني فعلًا بين منصات المتاجر؟ | What's really free among store platforms? |
| Secondary keywords | ما هي أفضل منصة لإنشاء متجر إلكتروني مجاني في مصر، موقع لانشاء متجر الكتروني مجاني، alternative to shopify free | sentence-case English equivalents |
| Intent · market | Informational · EG | same page, English locale |
| Internal links out | /solutions/free-online-store, /blog/best-ecommerce-platforms-egypt, /alternatives/shopify | same paths under `/en` |
| Lengths (checked by script, same rule as `seo.lib.test.ts`) | ar 60/62 · en 58/62 · desc ar 122, en 129 | |

<a id="kw-b17"></a>

#### B17 `/blog/best-products-to-sell-egypt` (P2, New post)

| Field | Arabic (default, unprefixed URL) | English (`/en/blog/best-products-to-sell-egypt`) |
|---|---|---|
| Primary keyword | افضل المنتجات للبيع اونلاين | best products to sell online in Egypt |
| SEO title (`meta.<key>.title`; the layout adds the brand) | أفضل المنتجات للبيع أونلاين في مصر وكيف تختار منتجك | Best products to sell online in Egypt |
| Meta description | كيف تختار منتجًا يبيع أونلاين في مصر: الطلب، هامش الربح، سهولة الشحن، والمرتجعات، مع أفكار مشاريع لكل فئة وأمثلة للتسعير. | How to choose a product that sells online in Egypt: demand, margin, ease of shipping and returns, with business ideas by category. |
| H1 | ماذا تبيع أونلاين في مصر؟ | What should you sell online in Egypt? |
| Secondary keywords | كيف تختار منتج للبيع اونلاين، افكار مشاريع تجارة الكترونية في مصر، منتجات مطلوبة | sentence-case English equivalents |
| Intent · market | Informational · EG | same page, English locale |
| Internal links out | /industries, /tools/profit-margin-calculator, /blog/how-to-sell-online-egypt | same paths under `/en` |
| Lengths (checked by script, same rule as `seo.lib.test.ts`) | ar 58/62 · en 47/62 · desc ar 121, en 130 | |

<a id="kw-b18"></a>

#### B18 `/blog/market-online-store` (P3, New post)

| Field | Arabic (default, unprefixed URL) | English (`/en/blog/market-online-store`) |
|---|---|---|
| Primary keyword | تسويق المتجر الالكتروني | how to market your online store |
| SEO title (`meta.<key>.title`; the layout adds the brand) | كيف تسوّق متجرك الإلكتروني وتزيد مبيعاتك | How to market your store and grow sales |
| Meta description | طرق عملية لتسويق متجرك الإلكتروني وزيادة مبيعاته: إعلانات فيسبوك وإنستجرام، كتالوج المنتجات، العروض، والبريد الإلكتروني. | Practical ways to market your online store and grow sales: Facebook and Instagram ads, product catalogs, offers and email. |
| H1 | كيف تسوّق متجرك وتزيد مبيعاته | How to market your store and grow sales |
| Secondary keywords | زيادة مبيعات المتجر الإلكتروني، اعلانات فيسبوك للمتجر، كتالوج فيسبوك | sentence-case English equivalents |
| Intent · market | Informational · EG | same page, English locale |
| Internal links out | /integrations/meta-pixel, /integrations/product-catalogs, /features/offers-and-coupons, /features/email-marketing | same paths under `/en` |
| Lengths (checked by script, same rule as `seo.lib.test.ts`) | ar 47/62 · en 49/62 · desc ar 120, en 122 | |

<a id="kw-b19"></a>

#### B19 `/blog/build-ecommerce-brand` (P3, New post)

| Field | Arabic (default, unprefixed URL) | English (`/en/blog/build-ecommerce-brand`) |
|---|---|---|
| Primary keyword | بناء علامة تجارية للمتجر | how to build an ecommerce brand |
| SEO title (`meta.<key>.title`; the layout adds the brand) | كيف تبني علامة تجارية لمتجرك الإلكتروني | How to build an ecommerce brand |
| Meta description | خطوات بناء علامة تجارية لمتجرك الإلكتروني: الاسم، الشعار والألوان، صور المنتجات، والنطاق الخاص، وتجربة شراء تجعل العميل يعود. | Steps to build a brand for your online store: name, logo and colours, product photos, your own domain and a buying experience people return to. |
| H1 | ابنِ علامة تجارية لمتجرك | Build a brand for your store |
| Secondary keywords | اسم المتجر، شعار المتجر، هوية المتجر | sentence-case English equivalents |
| Intent · market | Informational · EG | same page, English locale |
| Internal links out | /tools/store-name-generator, /features/custom-domain, /blog/phone-photos | same paths under `/en` |
| Lengths (checked by script, same rule as `seo.lib.test.ts`) | ar 46/62 · en 41/62 · desc ar 125, en 143 | |

<a id="kw-b20"></a>

#### B20 `/blog/shopify-vs-woocommerce` (P3, New post (gated))

| Field | Arabic (default, unprefixed URL) | English (`/en/blog/shopify-vs-woocommerce`) |
|---|---|---|
| Primary keyword | شوبيفاي ولا ووكومرس | Shopify vs WooCommerce |
| SEO title (`meta.<key>.title`; the layout adds the brand) | شوبيفاي أم ووكومرس؟ مقارنة للتاجر في مصر | Shopify vs WooCommerce for sellers in Egypt |
| Meta description | مقارنة شوبيفاي وووكومرس للتاجر في مصر: التكلفة الحقيقية، رسوم بوابات الدفع، الاستضافة، الشحن مع بوسطة، ومتى تحتاج بديلًا أبسط. | Shopify and WooCommerce compared for Egypt: real cost, gateway fees, hosting, Bosta shipping and when a simpler option fits. |
| H1 | شوبيفاي أم ووكومرس؟ | Shopify or WooCommerce? |
| Secondary keywords | شوبيفاي ولا ووردبريس، ووكومرس باللغة العربية، متجر ووردبريس | sentence-case English equivalents |
| Intent · market | Informational · EG | same page, English locale |
| Internal links out | /compare/tallaby-vs-shopify, /compare/tallaby-vs-woocommerce, /alternatives/woocommerce | same paths under `/en` |
| Lengths (checked by script, same rule as `seo.lib.test.ts`) | ar 47/62 · en 53/62 · desc ar 126, en 124 | |


---

## 7. Keyword cannibalization analysis

### 7.1 Conflicts and how each one is split

| Cluster | Pages at risk | Decision |
|---|---|---|
| **"free" store:** انشاء متجر الكتروني مجاني / متجر مجاني / مجاني مدى الحياة / free online store builder | `/` (title "منشئ متاجر إلكترونية بالذكاء الاصطناعي، مجانًا"), `/pricing`, `/templates` ("قوالب … مجانية"), new S1 | **S1 owns "مجاني + متجر".** Home keeps "منشئ متاجر" (builder) as its head term. Its title may keep "مجانًا" as a modifier, but its H1 and body must not target "انشاء متجر الكتروني مجاني". Pricing owns "اسعار / باقات طلبي". Templates owns "قوالب … مجانية" (the template noun, not the store noun). All three link to S1 with the anchor "متجر إلكتروني مجاني". |
| **head "create online store":** انشاء متجر الكتروني / عمل / فتح / كيفية / خطوات | `/`, S3, `/faq` ("…عن إنشاء متجرك الإلكتروني") | **S3 owns the verb and how-to** (steps block). **Home owns the brand and "منشئ متاجر".** Change the FAQ title to "الأسئلة الشائعة عن طلبي: المتجر والأسعار والشحن" so it doesn't target the head term. |
| **Egypt:** انشاء متجر الكتروني في مصر / منصة … في مصر / ecommerce platform egypt | S2, S1 ("مجاني في مصر"), B1 ("افضل منصات … في مصر"), B2 ("تكلفة … في مصر") | **S2 owns "منصة / متجر + في مصر".** S1 takes "مجاني في مصر" as a secondary keyword (the free intent wins). B1 owns the "افضل / مقارنة" modifiers. B2 and T2 own "تكلفة". |
| **"best platforms in Egypt" vs alternatives vs compare** | B1, `/alternatives/*`, `/compare/*`, `/compare` hub | B1 = a list of all platforms ("افضل"). `/alternatives/<x>` = "بديل <x>" (several options, Tallaby first, an honest table). `/compare/tallaby-vs-<x>` = "طلبي ولا <x>" (head-to-head). Each links to the other two. Never give two pages the same competitor's "بديل" phrase. |
| **"شوبيفاي في مصر" questions** | B8, A2, C2 | B8 = informational ("هل يعمل / سعر الاشتراك / بوابات الدفع"). A2 = "بديل شوبيفاي (في مصر/المصري/مجاني)". C2 = "طلبي ولا شوبيفاي". |
| **AI:** انشاء متجر بالذكاء الاصطناعي / تصميم متجر بالذكاء الاصطناعي | `/` (title says AI), F1, F2 | **F1 owns every "بالذكاء الاصطناعي" query.** F2 owns "تصميم متجر" without AI. Home keeps AI as a modifier only. When F-82 ships, F1 gains a section, not a new URL. |
| **COD:** الدفع عند الاستلام / تأكيد / الطلبات الوهمية | S4, F4, B5, B7, S2 | S4 = store-level ("متجر بالدفع عند الاستلام"). F4 = the "الطلبات الوهمية" feature. B7 = how-to guide ("كيف تقلل…"). B5 = "عند الاستلام أم الإلكتروني". Don't put "الطلبات الوهمية" in S4's title. |
| **Cost:** تكلفة / اسعار انشاء متجر | T2, B2, `/pricing` | T2 = the calculator ("حاسبة تكلفة"). B2 = the explanatory guide that embeds a link to T2. Pricing = Tallaby's own plans. ExpandCart targets "اسعار انشاء متجر الكتروني" on its pricing title, but Tallaby's pricing title must stay about its own plans. |
| **Shipping:** شركات الشحن في مصر / بوسطة / شحن الطلبات | F6, I1, I5, B3 | B3 = the carrier-choice guide. F6 = Tallaby's shipping feature (zones, riders). I1 = Bosta. I5 = Wassalha. |
| **Payments:** بوابة دفع مصرية / كاشير / باي موب / فودافون كاش | I2, I3, I4, B4 | B4 = the guide. Each integration page owns its brand + "ربط" or "بوابة دفع <brand>". |
| **Templates vs industries** | `/templates`, `/templates/[id]`, `/industries/*` | Industry pages own "انشاء متجر <niche>". `/templates` owns "قوالب". Template detail pages own "قالب متجر <name>". Each template page links to its industry page; each industry page shows filtered template cards. |
| **Margin vs selling price vs cost** | T1, T2, T4 | T1 = per-product margin and price. T2 = monthly store cost. T4 = platform fees by order count. Their H1s use different nouns (هامش / تكلفة المتجر / رسوم المنصة). |

### 7.2 Keyword → URL map (the one owner per phrase)

| Phrase (and its spelling variants) | Owner URL |
|---|---|
| طلبي، Tallaby، منشئ متاجر إلكترونية، online store builder | `/` |
| انشاء متجر الكتروني، كيفية/خطوات انشاء متجر، عمل/فتح متجر الكتروني | `/solutions/create-online-store` |
| انشاء متجر الكتروني مجاني (بالكامل، مدى الحياة، عربي، مجانا، في مصر) | `/solutions/free-online-store` |
| انشاء متجر الكتروني في مصر، منصة انشاء متجر الكتروني في مصر، ecommerce platform egypt | `/solutions/online-store-egypt` |
| متجر الكتروني الدفع عند الاستلام | `/solutions/cash-on-delivery-store` |
| متجر الكتروني على الفيس بوك | `/solutions/facebook-page-to-store` |
| انشاء/تصميم متجر الكتروني بالذكاء الاصطناعي | `/features/ai-online-store` |
| تصميم متجر الكتروني (احترافي، جاهز) | `/features/store-design` |
| ربط نطاق / دومين بالمتجر | `/features/custom-domain` |
| الطلبات الوهمية (feature) / تقليل الطلبات الوهمية (guide) | `/features/fake-order-protection` / `/blog/reduce-fake-orders` |
| السلات المتروكة، الطلبات غير المكتملة | `/features/abandoned-checkouts` |
| اسعار طلبي، باقات، خطة مجانية | `/pricing` |
| قوالب متاجر الكترونية مجانية، ثيمات متجر | `/templates` |
| تكلفة انشاء متجر الكتروني (في مصر) | `/tools/store-cost-calculator` (tool) + `/blog/online-store-cost-egypt` (guide) |
| حاسبة هامش الربح، حساب سعر البيع | `/tools/profit-margin-calculator` |
| اسماء متاجر الكترونية، اسم متجر | `/tools/store-name-generator` |
| افضل منصة لانشاء متجر الكتروني، افضل منصات التجارة الالكترونية في مصر | `/blog/best-ecommerce-platforms-egypt` (gated) |
| بديل ايزي اوردرز | `/alternatives/easyorders` (gated) |
| بديل شوبيفاي (في مصر، المصري، مجاني) | `/alternatives/shopify` (gated) |
| طلبي ولا ايزي اوردرز / Tallaby vs EasyOrders | `/compare/tallaby-vs-easyorders` (gated) |
| هل شوبيفاي يعمل في مصر، سعر اشتراك شوبيفاي في مصر | `/blog/shopify-in-egypt` (gated) |
| شوبيفاي ولا ايزي اوردر | `/blog/shopify-vs-easyorders` (gated) |
| بوسطة + متجر، bosta integration | `/integrations/bosta` |
| باي موب / paymob integration · بوابة دفع كاشير | `/integrations/paymob` · `/integrations/kashier` |
| بوابة دفع مصرية، بوابات الدفع في مصر | `/blog/payment-gateways-egypt` |
| شركات الشحن في مصر (واسعارها) | `/blog/shipping-companies-egypt` |
| انشاء متجر <niche> (ملابس، عطور، تجميل، …) | `/industries/<niche>-store` |

---

## 8. Recommended URL architecture

### 8.1 Final route tree (under `app/[locale]/(marketing)/(site)/`)

```
/                                   home (exists)
/pricing  /templates  /templates/[id]  /faq  /about  /blog  /blog/[slug]  … (exist)
/solutions                          NEW hub   (HubPageFrame + HubListing)
/solutions/[slug]                   exists    create-online-store, + free-online-store, online-store-egypt,
                                              cash-on-delivery-store, facebook-page-to-store
/features                           NEW hub
/features/[slug]                    exists    custom-domain, + ai-online-store, store-design, fake-order-protection,
                                              abandoned-checkouts, shipping, order-management, email-marketing,
                                              offers-and-coupons, reports, store-app, ai-assistants-mcp, customers, store-seo
/industries                         NEW hub
/industries/[slug]                  exists    clothing-store, + beauty-store, perfume-store, electronics-store,
                                              home-furniture-store, jewelry-accessories-store, food-store, kids-store,
                                              car-accessories-store, handmade-store, sports-store
/integrations  /integrations/[slug] exist     meta-pixel, + bosta, paymob, kashier, instapay-wallets, wassalha,
                                              product-catalogs, shopify-import, google-analytics, google-sheets
/tools                              NEW hub
/tools/[slug]                       exists    profit-margin-calculator, + store-cost-calculator, store-name-generator,
                                              platform-fee-calculator, return-policy-generator, privacy-policy-generator
/compare  /compare/[slug]           exist     gated by COMPARE_PUBLIC (slug tallaby-vs-<id>)
/alternatives                       NEW hub   gated by COMPARE_PUBLIC
/alternatives/[slug]                NEW       gated; slug = competitor id (easyorders, shopify, …)
```

English: the same tree under `/en`. **No `/ar` prefix and no Arabic slugs.**

### 8.2 Why not the proposed `/ar/` tree

1. `routing.ts` uses `localePrefix: "as-needed"` with `defaultLocale: "ar"`. Arabic **is** the unprefixed URL, and `/ar/*` already 307s there. A `/ar/` tree would either duplicate every page or redirect on every hit.
2. `hreflangMap(path)` pairs `ar ↔ en ↔ x-default` on the **same path**. Arabic-script slugs would need a slug map per locale, rewrites in `proxy.ts`, translated `generateStaticParams`, and new guard tests. That is a large change with little gain: Google reads the slug lightly, and competitors rank with Latin slugs too (HalaOrders' `/solutions/fashion`, Zid's `/ar/switchers/zid-x-salla`).
3. Arabic slugs percent-encode into long links when pasted into WhatsApp, which is where Egyptian sellers share them.
4. `PLATFORM_BLOG_SLUG_RE` already restricts blog slugs. Keep it Latin.

### 8.3 Slug conventions

- Lowercase English, hyphens, **noun phrases that match the English keyword** (`free-online-store`, not `free`). Industry slugs end in `-store`. Compare slugs are `tallaby-vs-<id>`, and alternatives slugs are the bare `<id>`.
- Never put a year, a price or "best" in a slug (titles can change; slugs shouldn't).
- One slug per intent. Merged topics never get a URL of their own (see §5).

### 8.4 What must change in code for each new segment

| Change | File |
|---|---|
| New folder `alternatives/` (+ `[slug]`) and hub `page.tsx` files for solutions, features, industries and tools | `app/[locale]/(marketing)/(site)/…` |
| Add `"alternatives"` to `MARKETING_SEGMENTS` (hubs reuse existing segments) | `lib/marketing/locale-landing.lib.ts` (the test compares it with the folders) |
| Add hubs, and the gated alternatives, to `contentPagePaths()` | `lib/marketing/content-routes.lib.ts` |
| New message groups (`solutions`, `alternatives`, optionally split from `keywords`) in `MARKETING_GROUPS`; any strings read by client components in `MARKETING_CLIENT_NAMESPACES` | `i18n/messages.ts`, `i18n/client-messages.lib.ts` |
| `alternativesRobots()` = `compareRobots()` (shared gate) | `lib/marketing/compare.lib.ts` |
| Hub breadcrumb levels get an `href` (today `crumbHub` has none) | `PageTrail` callers |

### 8.5 Redirects needed

| From | To | Type | Why |
|---|---|---|---|
| `https://tallaby.com/*` | `https://www.tallaby.com/*` | **308** (today 307) | D1 |
| `/templates?category=<code>` chips on industry kinds | `/industries/<slug>` links (change the links, don't redirect the query) | n/a | Chips point at real pages once they exist (`STORE_KIND_LINKS`) |
| Any merged topic that ever went live under its own URL | its owner page | 308 | Keep this list in `redirects.mjs` |
| `/compare/<slug>` for a competitor dropped below `MIN_VERIFIED_FACTS` | `/compare` | 307 while gated, 308 after | Today such slugs simply 404 (`dynamicParams = false`) |

### 8.6 What NOT to change

- Existing URLs: `/solutions/create-online-store`, `/industries/clothing-store`, `/features/custom-domain`, `/integrations/meta-pixel`, `/tools/profit-margin-calculator`, `/compare/tallaby-vs-*`, `/templates/[id]`, `/blog/[slug]`. Retarget their copy; keep the slugs.
- The English-landing redirect, `localeDetection: false`, the price-token pipeline, `dynamicParams = false` on content routes, and the old marketplace noindex headers.
- `packages/ui`, the storefront, checkout and any template (`docs/marketing-site-rules.md`).

---

## 9. Page templates and UI/UX specs (7 page types)

### 9.0 Design direction (from the `frontend-design` skill, applied to tallaby.com's existing system)

- **Subject:** an Egyptian seller who sells through Facebook and Instagram, worries about COD returns and pays in pounds. The most characteristic thing in their world is **an order arriving**: a phone notification, a COD order card with a governorate and a Bosta waybill. That object, not a stock "dashboard + gradient" hero, is each page's one memorable element, drawn with the existing `DashFrame` / `MockCard` / `store-mock.client.tsx` mocks.
- **One bold thing per page, everything else quiet.** Teal-900 ink on paper, amber-600 only for the primary CTA and `<em>` emphasis inside `SectionHeading` titles, and the existing fog. Nothing new is added to the palette.
- **Avoid template tells:** no kicker or eyebrow above every heading (use `Kicker` only where it adds information, such as "خطوة ١ من ٤"), numbered markers **only for real sequences** (setup steps, "move in 3 steps"), no "→" appended to every link, no uppercase or letter-spacing on Arabic, and no middle-dot meta strings. `Reveal` is used **once per page** at most (the hero stage), and is off under reduced motion.
- **Type:** keep Noto Kufi Arabic + Montserrat (`app/[locale]/layout.tsx`). Set Arabic body at 1.75 line height and headings with `display-tight`. Keep lines under about 70 Arabic characters (`max-w-[62ch]` on prose).

#### Generalisation spec (prerequisite, Phase 0)

| Template | Today | Change |
|---|---|---|
| `SolutionPageView` (`components/marketing/solutions/solution-page.tsx`) | Always renders the clothing `DeviceStage` store mock and hard-coded step visuals | Add `Solution.stage: { store: IndustrySlug; dashboard: DashboardScene }` and `Solution.stepVisuals: readonly StepVisualId[]`. `DashboardScene` = `"orders" \| "cod-order" \| "products-ai" \| "wallet-fee" \| "shipping"`, each a server-rendered `DashFrame` scene. The store mock reads its words and products from `industryPages.<slug>` (already in messages for clothing). For example, S4 uses `cod-order` + `food-store`. |
| `IndustryPageView` | `needs` visuals limited to `variants \| gallery \| countdown \| catalog` | Extend `IndustryNeedVisual` with `sizes` (size chart), `specs` (spec table), `zones` (governorate price list), `offers` (quantity-offer card) and `reviews` (seller-added review card; a product UI mock, never fake testimonials on tallaby.com). Each new industry needs **a product-only photo** in `public/industries/<slug>.webp` (no people or body parts, per the rule). |
| `DetailPageView` + `detail-shots.tsx` | `shot: "domain" \| "pixel"`, 8 step visuals | Add `shot: { kind: "image"; src; alt; width; height }` for real dashboard screenshots (both locales: `/<slug>-ar.webp`, `/<slug>-en.webp`), plus coded shots `waybill` (Bosta), `gateway` (Paymob/Kashier connect card), `feed` (catalog link card), `risk` (fake-order badge on an order row) and `missed` (Not completed list). New step visuals `connectAccount`, `pickOrders`, `printWaybill`, `copyFeed`, `blockNumber`. |
| `HubPageFrame` + `HubListing` | Used by integrations and compare | Reuse as-is for solutions, features, industries, tools and alternatives. Each hub needs a `hub.lib.ts` item list (`HubFilterable`) and a `<namespace>Hub` message block. |
| `RankingArticleView` | Built, unrouted | Route it inside `blog/[slug]/page.tsx`: a code-registered `RANKING_ARTICLES` map is checked before the DB lookup, gated by `COMPARE_PUBLIC`. |
| `ComparePageView` | Exists | Add an "alternatives" variant (§9.3) that shares the table and facts components. |

### 9.1 Core landing (solutions: S1–S5)

| Order | Section | Components | Notes |
|---|---|---|---|
| 1 | Trail | `PageTrail` (Home › الحلول › page) | The hub level gets an `href` |
| 2 | Hero: H1 + one-sentence lead + **SlugClaimForm** (type your store name, see the link) + secondary "الأسعار" outline button | `PageHero`, `SlugClaimForm`, `CtaButton tone="outline"` | **The claim form is the memorable element**: the visitor sees `اسمك.tallaby.com` before signing up. `FreeTermsNote` sits under the form whenever "مجاني" is in the H1. |
| 3 | Stage: dashboard scene + store mock per `Solution.stage` | `DeviceStage` (generalised) | Fixed aspect ratio (no CLS), `priority` image only here |
| 4 | Proof strip, 4 items, **facts only** (for example "لا اشتراك شهري" or "الدفع عند الاستلام مفعل") | `IconTile` ×4 | No seller counts, no ratings |
| 5 | Intro: sticky H2 + 2–3 short paragraphs answering the query directly in the first 2 sentences | `SectionHeading` | The answer-first paragraph is also what AI answers quote |
| 6 | Steps (a real sequence, so numbered) | 4 steps with `StepVisual` | S3 makes this its main block (how-to intent) |
| 7 | Features grid (6–8) | `SiteCard` | Each card links to its `/features/*` page |
| 8 | Template rail filtered for the page | `TemplateRail` | Real gallery data |
| 9 | Cost block: Tallaby vs "developer + hosting + subscription" | existing cost table + `FreeTermsNote` | Tokens only |
| 10 | Store-kind chips → `/industries/*` | `ChipRow` | |
| 11 | FAQ (5–7, from the page's PAA questions in §6.2) | `FaqBlock` | Visible FAQ; JSON-LD optional (D7) |
| 12 | Related (4) + closing CTA | `SiteCard`, `ClosingCta secondary="pricing"` | |

**Mobile (390 px):** hero form full-width (input above the button), stage scaled into a single phone mock, proof strip as a 2×2 grid, features as a one-column list with icons inline, template rail horizontal scroll with 44 px dots. The sticky "ابدأ متجرك" bar appears only after the hero leaves the viewport (one per page, never covering the FAQ).

### 9.2 Comparison page (`/compare/tallaby-vs-<id>`, gated)

| Order | Section | Notes |
|---|---|---|
| 1 | Trail | |
| 2 | Hero: "طلبي أم <X>؟" + **"المعلومات محدثة في <date>"** chip with a link to the sources list | Dates are the trust device. Use `Badge` (shadcn) for the date chip. |
| 3 | Verdict: two columns, "اختر طلبي إذا…" and "اختر <X> إذا…" (2–4 honest bullets each) | <X>'s column must contain at least one real strength from §3 |
| 4 | Price note (tokens, native currency → ≈ جنيه) | |
| 5 | **Table**, the memorable element: grouped rows, `y/n/p` icons **plus text**, sticky first column on mobile, one footnote link per competitor cell to its source | shadcn `Table` inside `overflow-x-auto`, with `<caption>`, `th scope="row"` and `scope="col"`. Hide unverified rows (existing rule). |
| 6 | Strengths of both | |
| 7 | "How to move" (a real 3-step sequence: Shopify import or Excel/URL import → template → payments and shipping) | links `/integrations/shopify-import` |
| 8 | FAQ (price, move, domain, try, methods) | |
| 9 | Sources list (visible): every source URL with its checked date | The research rule "keep sources" made public |
| 10 | Other comparisons + closing CTA | |

### 9.3 Alternatives page (`/alternatives/<id>`, gated)

Order: trail → H1 "بدائل <X> للتاجر في مصر" + checked date → **"لماذا يبحث التجار عن بديل"** (2–3 sourced pain points, such as EasyOrders' USD fee that doubled since 2023 or Shopify's 2% on card orders in Egypt, neutral in tone) → **ranked shortlist of 3–5 options** available in Egypt (Tallaby first, labelled "منصتنا"; each option has best-for, price note via tokens, pros and cons, and a link to its compare page where one exists) → the shared comparison table (Tallaby vs <X> vs the 2 strongest others) → "how to move from <X>" (numbered) → FAQ → sources → closing CTA. **Rule:** list only alternatives that work for Egyptian sellers (for example, no Salla on an "بديل شوبيفاي في مصر" page, because of the Saudi CR requirement), and never rate competitors with invented scores (`RankingItem.rating` stays empty unless there is a stated method).

### 9.4 Feature / integration page (`/features/*`, `/integrations/*`)

Order (existing `DetailPageView`): trail → hero (H1, lead, `DetailShotView`: **a real screenshot or coded shot of the exact screen**, the memorable element) → "ما هي" → benefits / uses / events → requirements (for example "حساب على بوسطة" or "حساب تاجر على Paymob"; "يتطلب أول شحن للمحفظة" for campaign features) → steps (numbered, `StepVisual`) → related (4) → FAQ → closing. Integration pages show the partner's name beside Tallaby's (`partner` field) and must say who charges what ("رسوم الدفع يحددها Paymob").

**Mobile:** the shot sits above the H1 on phones only if it's under 240 px tall; otherwise it goes after the lead. Steps become a vertical timeline.

### 9.5 Industry page (`/industries/*`)

Order (existing `IndustryPageView`): trail → hero with the industry photo (product-only) → needs ×4 (generalised visuals) → **template cards filtered by `templateCategory`** (the memorable element: real templates of that niche) → `IndustryShowcase` (mock store with callouts, per-industry words) → steps → FAQ → other industries → closing. **Each page needs at least 3 templates in its category** before it ships (beauty 12, electronics 11, home 18, food 14, jewelry 10, kids 8, sports 14, auto 10, handmade 4: all OK).

### 9.6 Blog article (`/blog/[slug]`, DB) and ranking article (code)

- **Article:** existing `ArticleHtml`, `ArticleToc`, `ReadingProgress`, `ShareBar`, `PostMeta`. Add to the Admin editor: a "related pages" field (2–4 internal URLs rendered as cards after the intro and at the end), and an "author" with a real name (BlogPosting `author`). Answer the query in the first 80 words. One inline CTA after the first third, and `ClosingCta` at the end.
- **Ranking (B1):** `RankingArticleView`: TOC, criteria with a written method, items (Tallaby marked as ours), CTA after N items, checklist, FAQ, sources. ItemList JSON-LD (exists).

### 9.7 Arabic / RTL rules (all types)

- `<html dir="rtl">` from the locale. Use logical utilities only (`ms-`, `ps-`, `start-`, `border-s`) and `ForwardArrow` / `BackArrow` from `direction-icons.tsx`.
- Latin runs (Paymob, Bosta, `tallaby.com`, URLs) inside `Ltr` / `BidiText`. Digits inside `Num` (Western digits, as in today's copy). Prices through `withPrices` (already isolated).
- Tables: the first column is on the right in RTL, and the sticky column uses `start-0`. The `y/n/p` icons carry text labels for screen readers ("نعم / لا / جزئيًا").
- No uppercase or letter-spacing on Arabic. English-only tracking via the `en:` variant.
- **Accessibility (all types):** one H1; heading order without skips; visible amber focus ring (exists); 44 px tap targets; `prefers-reduced-motion` respected; images have Arabic and English alt from messages; contrast ≥ 4.5:1 (ink-500 `#5a6d72` on paper passes for body; ink-400 `#7b8f94` only for ≥ 18 px text); forms with labels (`Field`); accordions keyboard-operable (Radix).

---

## 10. Design system and shadcn component reuse

**Rule:** no new design system. Marketing primitives come first; shadcn components from `packages/ui/src/components/` are used only underneath them or where no primitive exists. `packages/ui` itself is never edited.

| Need | Use | Source file | Decision |
|---|---|---|---|
| Layout, headings | `Container`, `Section`, `SectionHeading`, `Kicker`, `Num`, `Ltr` | `components/marketing/site/layout-primitives.tsx` | Reuse |
| Hero | `PageHero` | `site/page-hero.tsx` | Reuse |
| CTA | `CtaButton` (wraps shadcn `button`), `SignupTrigger`, `SlugClaimForm` | `site/cta-button.tsx`, `signup/` | Reuse; no raw `<Button>` on marketing pages |
| Cards | `SiteCard`, `IconTile` | `site/site-card.tsx` | Reuse; **don't** adopt shadcn `card` on marketing pages (it would duplicate `SiteCard`) |
| FAQ | `FaqAccordion` / `FaqBlock` (wrap shadcn `accordion`) | `site/faq-accordion.tsx`, `pages/content-blocks.tsx` | Reuse |
| Breadcrumb | `PageTrail` / `Breadcrumb` | `pages/content-blocks.tsx`, `site/breadcrumb.tsx` | Reuse; **not** shadcn `breadcrumb` |
| Comparison and ranking tables | **shadcn `table`** (`Table`, `TableHeader`, `TableRow`, `TableHead`, `TableCell`, `TableCaption`) styled with marketing tokens via `className` | `packages/ui/src/components/table.tsx` | **Adopt** (semantic table; compare today has its own markup, so move it to `Table` when C1/C2 are reworked) |
| Fact date chips, "قريبًا" / "Soon" labels, "منصتنا" | **shadcn `badge`** with `variant="outline"` + token classes | `badge.tsx` | **Adopt** |
| Calculator inputs | `slider` (already used), `select`, `segmented-control` (Free / Pro), `Field` / `TextInput` | `slider.tsx`, `select.tsx`, `segmented-control.tsx`, `site/field.tsx` | Adopt `select` + `segmented-control` for T2/T4 |
| Tool results | `progress` for a margin bar | `progress.tsx` | Optional |
| Hub filters | `HubListing` chips | `hub/hub-listing.client.tsx` | Reuse |
| Tabs | shadcn `tabs` | `tabs.tsx` | **Avoid for primary content** (hidden panels hide the answer). Allowed only inside tools (for example "شهري / سنوي") |
| Tooltips | shadcn `tooltip` | | **Avoid** for essential facts (no hover on phones). Use footnotes |
| Wide tables on phones | `overflow-x-auto` wrapper + sticky first column | (CSS) | Not `scroll-area` (it hides native scroll cues) |
| Carousels | shadcn `carousel` (used on home) | | Only the template rail; never for comparison data |
| Tokens | `text-ink-*`, `border-line*`, `bg-surface*`, `rounded-card*`, `shadow-soft/raise/stage/cta`, `teal-*`, `amber-*`, `var(--bg-fog)`, `cta-glow` | `app/[locale]/(marketing)/marketing.css` | **No raw hex** in new code (the audit found many, such as `#e3ebed`). Replace them as files are touched |
| Icons | `lucide-react` | | Reuse; brand marks via `brand-icon.tsx` |

New shared components to add (marketing-only, in `components/marketing/pages/`): `FactSource` (a footnote link with its date), `CompareTable` (shadcn `Table` + `y/n/p` cells), `ShortlistItem` (alternatives), `DashboardScene` (the dashboard scenes from §9.0), `RelatedPages` (cards from a URL list, used by the blog too).

---

## 11. Technical SEO checklist

### 11.1 Metadata (every page)

- [ ] `generateMetadata` → `pageMetadata({ locale, page: "<type>-<slug>", path })`. Title ≤ 55 (ar) / 52 (en) before the suffix; description 50–165; enforced by `seo.lib.test.ts` (§6 rows are pre-checked).
- [ ] The title doesn't repeat the brand (the test does this; compare is exempt on purpose).
- [ ] Canonical = self, on the S-01 host; `alternates.languages` = ar, en, x-default→ar. Blog: only the post's `langs`.
- [ ] Robots: indexable by default; `compareRobots()` for compare **and alternatives** while gated; noindex for empty blog posts (exists).
- [ ] Fix the pricing title's double separator ("الأسعار | … | طلبي"): drop "الأسعار |" from `meta.pricing.title`.

### 11.2 Headings and content

- [ ] One H1 that matches the §6 H1. H2s for each section. FAQ questions as H3 inside the accordion trigger.
- [ ] The primary keyword appears in the title, H1, first paragraph and one H2. Secondary keywords appear in H2s and FAQ questions (PAA wording from §6.2).
- [ ] Copy follows the marketing rules (MSA; التاجر، جنيه، الهاتف، النطاق; English sentence case, no em dashes). No `يُراجع` placeholders (test).

### 11.3 Open Graph and Twitter (per page)

- [ ] **Per-page OG images, in both languages.** Recommended: **static PNGs generated at design time** (1200×630, under 300 KB, Arabic and English versions) in `public/og/<type>-<slug>-<locale>.png`, passed to `pageMetadata` through a new `image` argument, with `DEFAULT_OG_IMAGE` as fallback. Reason: Next 16's `opengraph-image.tsx` (`ImageResponse` from `next/og`, statically optimised at build: `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/01-metadata/opengraph-image.md`) renders through Satori, whose Arabic shaping and RTL support must be **proven in a spike first** (open question Q10). If the spike passes, switch to a segment-level `opengraph-image.tsx` per content type that reads the page's title from messages and loads the Noto Kufi Arabic font file. Note that a file-based OG image overrides `metadata.openGraph.images`, so check `pageMetadata` doesn't also set one for those segments.
- [ ] Each OG image shows the page's own object (order card, waybill, template) plus the H1, in the brand palette, with the Latin logo in English and the طلبي logotype in Arabic.
- [ ] Twitter: `summary_large_image`, `site: @usetallaby` (exists), same image.
- [ ] OG `locale` `ar_EG` / `en_US` (exists); `type: article` for blog (exists).

### 11.4 Structured data (eligibility per Google's current docs, read 2026-11-09)

| Schema | Where | Rule |
|---|---|---|
| Organization + WebSite | every `(site)` page (exists) | Also add `follow-us` to `(site)` or noindex it. No SearchAction (no site search). |
| SoftwareApplication | `/` and `/pricing` only (exists) | Don't repeat it on every landing page. EGP offers at the live rate (exists). **No `aggregateRating`** (the code comment and the tests forbid invented ratings). |
| BreadcrumbList | every page with a trail, including hubs | Google now shows breadcrumbs **on desktop results only** ([Search Central updates, 2025-01-22](https://developers.google.com/search/updates)). Still worth emitting. |
| BlogPosting | blog posts (exists) | `author` as a real Person when there is one; `dateModified` = `updatedAt`. |
| Article | ranking article (B1) | Plus ItemList (exists in `rankingItemList`). |
| ItemList | hubs, `/integrations` (exists), ranking | Items = the hub's links. |
| WebApplication | each `/tools/*` page | As on the margin tool (exists); free `Offer` in EGP. |
| FAQPage | wherever `FaqBlock` renders | **Google no longer shows FAQ rich results** (deprecated 2026-05-08, removed 2026-06-15: [FAQPage doc](https://developers.google.com/search/docs/appearance/structured-data/faqpage), [updates](https://developers.google.com/search/updates)). Keep the markup only because it's free (exists) and other engines and AI answers may read it. Never add it where the FAQ isn't visible. |
| HowTo | none | Not used (Google stopped showing HowTo rich results in 2023; from memory, not re-read today). Steps stay as visible content. |
| Product / Review / AggregateRating | none | Never on tallaby.com. |

Also: Google says it **doesn't need or use `llms.txt`** ([updates, 2026-06-15](https://developers.google.com/search/updates)). If it is added for other AI agents (S-07), treat it as optional, like Salla's `/ai-info/` page.

### 11.5 Performance targets and Next.js 16 specifics

- [ ] Core Web Vitals at p75 on mobile: **LCP < 2.5 s, INP < 200 ms, CLS < 0.1** (Google's "good" thresholds). Measure with PageSpeed / CrUX after S-01.
- [ ] JS budget for content pages: **≤ 200 KB compressed** on first load (home measured 557 KB on 2026-11-03). Pages stay Server Components. Client islands only for `SlugClaimForm`, calculators, `HubListing`, `IndustryShowcase` and the template rail.
- [ ] Static: `generateStaticParams` + `dynamicParams = false` for every new `[slug]` route (existing pattern). Hubs are static. Blog stays on-demand with its cache tag.
- [ ] Images: `next/image` with `sizes`, fixed aspect boxes, `priority` only on the hero stage, WebP/AVIF from `public/`, no people.
- [ ] Fonts: keep `next/font` (exists). Don't load Noto Kufi on English pages (exists).
- [ ] Keep `experimental.inlineCss` off (it doubled the HTML on 2026-11-06).
- [ ] `proxy.ts` (not `middleware.ts`): the English redirect must keep excluding bots. Add the new segment to `MARKETING_SEGMENTS`.
- [ ] Read `node_modules/next/dist/docs/` (`generate-metadata.md`, `sitemap.md`, `opengraph-image.md`) before writing route code (CLAUDE.md).
- [ ] Verification: Search Console by DNS for the S-01 host (there's no meta tag in code), and Bing Webmaster Tools (it imports from GSC).

---

## 12. Sitemap and indexing strategy

### 12.1 How pages enter the sitemap (exact mechanics)

1. **Content pages** enter **only** through `contentPagePaths()` (`lib/marketing/content-routes.lib.ts`). Extend it in this order: hubs (`/solutions`, `/features`, `/industries`, `/tools`, `/integrations`), then features, integrations, tools, industries and solutions, then `...(comparePublic ? ["/compare", ...compare entries, "/alternatives", ...alternatives entries] : [])`.
2. **Static pages** come from `STATIC_PAGE_LASTMOD` keys (`STATIC_PATHS` in `lib/marketing/sitemap.server.ts`; `/sitemap.xml` is the route handler `app/sitemap.xml/route.ts` so it can carry the `/sitemap.xsl` stylesheet).
3. **Templates** come from `getTemplateGallery()`, with no lastmod.
4. **Blog posts** are included only if `hasArticle && !seo.noindex`, with `lastmod = updatedAt ?? date`, per locale.
5. **Ranking article(s)** (code) are added only when `COMPARE_PUBLIC`.

### 12.2 lastmod

- **Don't put content paths into `STATIC_PAGE_LASTMOD`.** Its keys are also the static path list, so the path would be listed twice (§2.2 #7). Add `CONTENT_PAGE_LASTMOD: Record<string, string>` in `sitemap.lib.ts`, and make `pageLastModified(path)` read `STATIC_PAGE_LASTMOD[path] ?? CONTENT_PAGE_LASTMOD[path] ?? CONTENT_PAGES_LASTMOD`. Extend `sitemap.lib.test.ts`: no path in both maps, and every `CONTENT_PAGE_LASTMOD` key is in `contentPagePaths(true)`.
- Bump a page's date **only when its copy or facts change** (the existing rule). Compare and alternatives pages use the competitor's `factsCheckedOn` when that is later than the copy date.

### 12.3 Never list

- Pages that are noindex (gated compare and alternatives, empty or noindex blog posts, `/dev-library`, `/template-preview/*`, old marketplace pages).
- Redirecting URLs (apex, `/ar/*`, `/help`, `/sell`, `/become-seller`, `/affiliate`), and anything with a query string (`?category=`).
- **Test:** a new `sitemap.integrity.test.ts` maps every sitemap path through the robots helpers (`compareRobots`, blog noindex) and the redirect list, and fails if any listed URL is noindex or redirects. Locally, a script that curls each `<loc>` and expects `200` and a self-canonical (run before each SEO deploy; record it in `PLAN.md` §23).

### 12.4 Thin and duplicate URLs

- `/follow-us`: move it under `(site)` (header, footer, Organization), or noindex it and drop it from `STATIC_PAGE_LASTMOD`. Recommendation: noindex, because it's a link-in-bio page.
- **Templates (about 238 URLs):** keep them indexable, but give each `/templates/[id]` a unique 2-sentence intro from template metadata, a link to its industry page and a real thumbnail. After 8 weeks of Search Console data, noindex templates with zero impressions that are near-duplicates.
- **Locale entries:** every path is listed in both locales with full alternates and x-default (existing `sitemapEntries`). Blog posts only in their `langs`. The sitemap host and `Sitemap:` line follow S-01.

### 12.5 Compare and alternatives gating

While `COMPARE_PUBLIC = false`: noindex,nofollow, not in the sitemap, not in the header or footer, and not linked from public pages. Every `href` to `/compare/*` or `/alternatives/*` in public copy must be wrapped in a `comparePublic ? link : null` guard, with a test that renders public pages and fails if they link a gated URL. When the flag flips: they're added to the sitemap, the footer "مقارنات" link appears, and the date chips show.

---

## 13. Internal linking strategy

### 13.1 Link graph per page type

| From | Must link to | Max contextual links |
|---|---|---|
| Home | S1, S2, S3, F1, `/templates`, `/pricing`, `/industries`, `/features`; `/solutions/*` in the body where the copy fits (already links S3 and N1) | ~12 in the body |
| Hubs | every child (cards), the parent breadcrumb, 2 sibling hubs | All children |
| Core landing (S) | 4 related (`Solution.related`), every feature card → its `/features/*`, industry chips, `/pricing`, `/templates` | ~15 |
| Feature (F) | 4 related (`DetailPage.related`): 1 solution, 1–2 sibling features, 1 integration or tool | ~8 |
| Integration (I) | its feature page (for example I1 → F6), the integrations hub, 1 solution, 1 sibling integration | ~6 |
| Industry (N) | its filtered templates, 2 sibling industries, S1, F2 | ~10 |
| Tool (T) | 1 solution, 1 sibling tool, its guide post | ~5 |
| Compare / alternatives (gated) | each other (same competitor), `/integrations/shopify-import` or Excel import, `/pricing`, 3 sibling comparisons | ~10 |
| Blog | 2–4 product pages in "related pages" (new Admin field) + 3 related posts (exists) | ~8 |
| Template detail | its industry page (new), `/templates`, S1 | 3 |

### 13.2 Navigation

- **Header** (`nav.lib.ts`): add one "الحلول" entry pointing at `/solutions`, which acts as the hub. It replaces nothing; the anchors to home sections stay. No mega-menu (it adds client JS and isn't needed at about 50 pages).
- **Footer** (`footerSolutionLinks()`, 3 per source): reorder arrays so the first three are the money pages: SOLUTIONS = [free-online-store, online-store-egypt, create-online-store, …], FEATURE_PAGES = [ai-online-store, fake-order-protection, store-design, …], INDUSTRIES = [clothing, beauty, electronics, …], TOOL_SLUGS = [store-cost-calculator, profit-margin-calculator, store-name-generator, …]. Add "كل الحلول" / "كل المميزات" links to the hubs at the end of the column.

### 13.3 Anchor text rules

- Use the **target page's primary keyword or a close variant**, in Arabic on Arabic pages ("متجر إلكتروني مجاني", "ربط بوسطة"). Never "اضغط هنا" or "اعرف المزيد" alone.
- Vary anchors across pages (at most 3 identical exact-match anchors to one URL per locale on the whole site, footer excluded).
- Don't link the same URL twice in one section. The first contextual link wins.
- Never link from public pages to gated URLs (§12.5).
- Links stay crawlable `<a href>` in the server HTML (as the templates fix on 2026-11-09 did). No JS-only navigation.

### 13.4 Orphan check

A test over `contentPagePaths(true)` that each path is linked from its hub and from at least one non-hub page (static list in a `links.lib.ts`, or a render test like `content-pages.test.tsx`).

---

## 14. Arabic SEO strategy

### 14.1 Egyptian search terms seen (autocomplete and SERPs, 2026-11-09)

| Theme | Terms Egyptians typed (as suggested) | Copy rule |
|---|---|---|
| Create | انشاء / إنشاء / عمل / فتح / تصميم + متجر الكتروني / إلكتروني | Visible copy uses correct MSA (إنشاء متجر إلكتروني). Google merged both spellings in one suggestion list, which suggests it normalises hamza variants. |
| Free | مجاني، مجانا، مجاني بالكامل، مجاني مدى الحياة، مجاني عربي | Never promise "مدى الحياة". Say "دون اشتراك شهري" + `FreeTermsNote`. |
| Egypt | في مصر، المصري (بديل شوبيفاي المصري) | Use "في مصر" in the S2 title and "للتاجر في مصر" elsewhere. |
| AI | بالذكاء الاصطناعي (under store, design, name, logo and landing page queries) | Claim only live AI. |
| Comparison | X ولا Y (شوبيفاي ولا ايزي اوردر) is Egyptian; وش افضل / ايش افضل is Saudi; أم in MSA | Titles use MSA "أم". Body FAQ can quote the user's question naturally ("شوبيفاي أم ايزي اوردرز؟"). Rules forbid dialect words like إزاي, so don't write "ولا" in our own sentences; put it in a quoted search phrase at most once (open question Q11). |
| How-to | ازاي ابيع اونلاين، ازاي ابيع هدوم اونلاين | Target with MSA "كيف تبيع أونلاين" (B6). Google matches the intent across dialects. |
| Cost | تكلفة، كم تكلفة، اسعار | All three in T2/B2. |
| Payments | بوابة دفع (كاشير، فوري، فودافون كاش، مصرية، بدون سجل تجاري) | Brand names as Egyptians write them: كاشير، باي موب / Paymob، فودافون كاش، إنستاباي. |
| Shipping | بوسطة / بوسطه، شركات الشحن في مصر واسعارها، البريد المصري | Use "بوسطة" (with ة) in copy. The variant without it can appear in alt text. |

### 14.2 Spelling variants to cover (in copy where natural, in `arabicNames`, alt text and FAQ questions)

| Canonical (visible copy) | Variants users type |
|---|---|
| إنشاء | انشاء، انشئ، انشيء (ExpandCart's typo) |
| إلكتروني | الكتروني، الاكتروني (Wuilt's typo) |
| ايزي اوردرز | ايزي اوردر، إيزي أوردرز، ايزى اوردرز، easy orders، easyorders |
| شوبيفاي | شوبيفاى، shopify |
| ووكومرس | ووكوميرس، woocommerce |
| ويلت | wuilt |
| زد | zid (Arabic "زد" is ambiguous: جيل زد, زد كاس) |
| سلة | salla (Arabic "سلة" is ambiguous: كرة سلة, سلة غذاء) |
| بوسطة | بوسطه، bosta |
| فيسبوك | فيس بوك، الفيس بوك |
| إنستجرام | انستجرام، انستا |
| طلبي | Tallaby (always paired; "طلبي" alone collides with طلبية / طلبات) |

**How:** one canonical spelling in titles and H1s (correct MSA). Common variants in at most one natural place per page (an FAQ question quoting the search, image alt, or the compare `arabicNames`). **No keyword-stuffed variant lists** in visible copy.

### 14.3 RTL and Arabic metadata

- Arabic `meta.title` and `meta.description` are written natively (not translated from English) and checked for length by the test. Put the keyword in the first 30 characters of the title (Arabic titles get cut on phones).
- `og:locale = ar_EG`, `inLanguage: "ar"` in JSON-LD, `hreflang="ar"` (not ar-EG, which matches today's code; Egypt targeting comes from content and a `.com` with Egyptian signals: EGP prices, governorates, the Egyptian phone number in Organization `contactPoint`).
- Latin brand names inside Arabic titles are isolated by the renderer (`BidiText`); keep them **after** the Arabic keyword ("ربط بوابة الدفع Paymob" rather than "Paymob: ربط …") so truncation keeps the Arabic part.
- Digits: Western digits in titles (as today). Use `Num` in the body.

### 14.4 Brand

"طلبي" competes with the common nouns طلبية and طلبات (and with the app Talabat). Always write **"طلبي (Tallaby)"** on first mention per page, keep Organization `alternateName: "طلبي"` (exists), and make sure Facebook and Instagram profile names match ("Tallaby - طلبي", as seen in the index).

---

## 15. Phased roadmap

Effort is in **dev-days for one developer** who knows the codebase, including messages in both locales, tests and checks (`pnpm lint`, `typecheck`, `test` per CLAUDE.md rule 15). Copywriting and owner review are extra. Each phase updates `ROADMAP.md` (F-53 follow-ups: add them as F-53b…F-53f in §6 and §7 with the owner's approval, per rule 19).

### Phase 0: foundations (blocker) · 6–8 dev-days
| Item | Depends on | Acceptance |
|---|---|---|
| S-01 host: env to www, apex→www 308, re-check `SITE_URL` / `SITEMAP_BASE_URL` | **Owner decision S-01** | `curl -I https://tallaby.com/x` → 308 to www; canonical, hreflang, sitemap `<loc>` and robots `Sitemap:` all on www |
| Search Console + Bing verification (DNS), submit sitemap | S-01 | Both properties verified; sitemap read without errors |
| Template generalisation (§9.0): `Solution.stage`, industry visuals ×5, detail `image` shot + 5 coded shots, `DashboardScene` | — | `content-pages.test.tsx` renders each new variant; no clothing mock on non-clothing pages |
| Hubs ×4 (`HubPageFrame`) + breadcrumb `href` | — | Hubs listed in the sitemap; BreadcrumbList has 3 levels on child pages |
| `CONTENT_PAGE_LASTMOD` + sitemap integrity test | — | §12 tests pass |
| OG spike (Satori Arabic) → static OG pipeline decision | — | 2 sample images (ar, en) reviewed by the owner |
| Deploy F-84 code + `0159` before (or with) the marketing deploy | F-84 | No page says "orders from day one" while production still hides them |
| Index hygiene: check old marketplace URLs and test stores (§2.2 #6) | S-01 | Removals requested where needed |

**Progress (2026-11-10, F-53c):** the `/industries` hub is built on `HubPageFrame`, whose namespace is now any `<name>Hub` message block, so the /solutions, /features and /tools hubs need only an item list and messages. Industry pages link the hub in the trail and BreadcrumbList. `CONTENT_PAGE_LASTMOD` added (industry pages so far) with tests in `industries.lib.test.ts`. Industry visuals: 8 new `IndustryNeedVisual` mocks (sizes, specs, zones, offers, reviews, notes, alert, restock).

### Phase 1: P0 core pages · 6–7 dev-days
S1 free-online-store, S2 online-store-egypt, S3 retarget (title, H1, steps block), F1 ai-online-store, home and FAQ title de-conflict (§7), header "الحلول" link, footer order. **Components:** generalised `SolutionPageView`, `DetailPageView` image shot (AI autofill screenshots in both locales). **Research needed:** none beyond §6. **Acceptance:** §16.1 and §16.4 checklists; each page in the sitemap with its own lastmod; Search Console shows the pages as "Indexed" within 4 weeks.

### Phase 2: P1 money pages · 8–9 dev-days
S4 cash-on-delivery-store, F4 fake-order-protection, F5 abandoned-checkouts, F6 shipping, I1 bosta, I2 paymob, I3 kashier, T2 store-cost-calculator (new client calculator reusing `margin-calculator.lib.ts` patterns: integer piastres, live rate), T1 copy extension (selling-price intent), N1 copy refresh, H4 tools hub, blog B2 cost guide (Admin), B5 body. **Verify in code first:** F-03 reminder email ("reminder email shown"), F-02 parts (blocklist, risk badge, WhatsApp confirm, rate limit), the Bosta flow. **Acceptance:** §16 checklists; T2 maths unit-tested; real screenshots without customer data.

### Phase 3: compare and alternatives (gated) · 9–11 dev-days + research
`compare.lib.ts` v2 (§4.2) with a migration of the 4 existing entries; facts for Wuilt, Zid, ExpandCart, YouCan, Lightfunnels, Qumra, Shanta, HalaOrders, Salla and Wix from §3 (each with official URLs); `/alternatives` segment + hub + A1 EasyOrders + A2 Shopify (then A3–A5); `CompareTable` on shadcn `Table`; B1 ranking route; T4 platform-fee calculator (competitor presets gated); blog B8, B9; facts-age test. **Depends on:** owner S-06 (recommendation: approve EasyOrders and Shopify first). **Research needed:** re-read every competitor price within 7 days before publishing (EasyOrders' blog proves prices move), fill the WooCommerce sources (today it cites only MARKETING_PROJECT.md), confirm EasyOrders' fee on cancelled orders. **Acceptance:** §16.2 and §16.3; flipping `COMPARE_PUBLIC` adds them to the sitemap and footer with no other change.

**Progress (2026-11-10, gated, `COMPARE_PUBLIC = false`):** done: `compare.lib.ts` v2 with the 4 old entries migrated; research for EasyOrders, Shopify, WooCommerce, ExpandCart, Salla and Zid (`docs/seo-research/04-compare-2026-11-10.md`, WooCommerce sources filled, EasyOrders' cancelled-order fee still U); `/compare/tallaby-vs-<id>` for all six with the Compare.html design ported (verdict, price note, shadcn `Table` with caption, row headers, sticky label column and a footnote per competitor cell, strengths, how to move, FAQ, visible sources list, per-competitor meta from §6 C1–C13); `/alternatives/easyorders` and `/alternatives/shopify` (A1, A2: why sellers look, a shortlist of options that work in Egypt with Tallaby first labelled "منصتنا", no scores, Salla excluded); per-competitor `publish` flags (EasyOrders and Shopify on); the facts-age test. Official facts per competitor: EasyOrders 27, Shopify 28 (+1 third-party), WooCommerce 29, ExpandCart 20, Salla 25, Zid 27, all ≥ `MIN_VERIFIED_FACTS` (4); "Facebook page only" has 1 (no page). **Left:** owner S-06, the 7-day price re-read before publishing, `/alternatives` hub, A3–A5, B1 route, T4 presets, B8/B9, per-page OG images (no pipeline yet), the remaining §3 competitors, a browser check at 360/1440 px.

### Phase 4: industries and long tail · 10–12 dev-days
Industries N2–N11 (product-only photos needed for each), features F2, F3 copy, F7–F14, integrations I4 (after verifying F-21p), I5–I9, tools T3 (no AI calls), T5, T6 (legal review of template text), S5, blog B3, B4, B6, B7 and the bodies for the B10–B14 stubs (Admin), template detail intros + industry links. **Acceptance:** §16.5–16.6; each industry page has ≥ 3 templates in its category.

**Progress (2026-11-10, ROADMAP.md F-53c):** industries N2–N11 built and N1 refreshed (meta, linked crumb, 3-level BreadcrumbList, chips). Templates per page come from `CODE_TEMPLATES` via `industryTemplates()` (each niche's own template keys, 3 shown; clothing by category `fa`), test-checked ≥3. Product-only photos are the templates' own Pexels photos (not `public/industries/<slug>.webp`), checked by eye. Sitemap dates via the new `CONTENT_PAGE_LASTMOD`. Open: per-page OG images (D8), sportswear apparel photos without people, a footer "All industries" link, and template detail pages linking back to their industry.

### Phase 5: measure and iterate · ongoing, ~1 dev-day a month
Search Console review at 4, 8 and 12 weeks: retitle pages with high impressions and low CTR, merge pages that compete for the same query (per §7), noindex zero-impression template pages, refresh compare facts every 90 days (test-enforced), and add the F-82 AI builder section to F1 when the owner switches it on.

**Total:** about 39–47 dev-days for Phases 0–4.

---

## 16. Acceptance criteria per page type

### 16.1 Every page
- [ ] Entry in its `*.lib.ts` list; messages in **both** `ar` and `en` with identical keys; `meta.<key>` title and description pass `seo.lib.test.ts`.
- [ ] One H1 = §6 H1; primary keyword in the title, H1, first paragraph and one H2.
- [ ] Only live claims (checked in code and in `docs/marketing-site-rules.md`); no invented proof (counts, ratings, logos, testimonials); no `يُراجع`.
- [ ] All prices through tokens; meta, FAQ data and JSON-LD in EGP; `FreeTermsNote` wherever "free" appears.
- [ ] Canonical self on the S-01 host; hreflang ar/en/x-default; per-page OG image (ar, en).
- [ ] BreadcrumbList with a linked hub level; valid JSON-LD (Rich Results Test / Schema validator, recorded in `PLAN.md` §23).
- [ ] In the sitemap with a correct lastmod; linked from its hub and ≥ 1 other page; no links to gated URLs.
- [ ] Renders at 390 px and 1440 px in RTL and LTR; keyboard focus visible; reduced motion respected; tap targets ≥ 44 px; contrast passes.
- [ ] Mobile LCP < 2.5 s and CLS < 0.1 in a Lighthouse mobile run; first-load JS ≤ 200 KB compressed.
- [ ] New top-level segment, if any, is in `MARKETING_SEGMENTS` (test).

### 16.2 Comparison page (in addition)
- [ ] ≥ `MIN_VERIFIED_FACTS` official facts, each with a URL and a date ≤ 90 days old; unverified rows hidden.
- [ ] A visible "checked on" date and a visible sources list.
- [ ] The competitor's column states at least one real strength; Tallaby's `n` rows (installments, landing pages, AI builder) stay visible.
- [ ] Competitor prices in their native currency through tokens; nothing literal.
- [ ] noindex until `COMPARE_PUBLIC`; then in the sitemap and footer automatically.

### 16.3 Alternatives page (in addition)
- [ ] Lists only options usable by Egyptian sellers (Salla excluded on Egypt pages, with the reason).
- [ ] No invented scores; Tallaby is labelled as ours.
- [ ] "How to move" uses live import paths (Shopify import, Excel/URL import).
- [ ] Links to the matching `/compare/tallaby-vs-<id>`; shares the S-06 gate.

### 16.4 Feature / integration page (in addition)
- [ ] The shot is a real screen (or a faithful coded mock) of the live feature; no customer personal data.
- [ ] Requirements are stated (partner account, first top-up for campaigns, app costs shown in the dashboard and never called free).
- [ ] Integration pages say who sets the fees (gateway or carrier) and that Tallaby doesn't deliver.

### 16.5 Industry page (in addition)
- [ ] ≥ 3 templates in `templateCategory`; template cards link to `/templates/[id]`; the industry photo is product-only.
- [ ] Generalised need visuals that fit the niche (no clothing mock on a perfume page).
- [ ] The `STORE_KIND_LINKS` chip points at the page.

### 16.6 Blog article (in addition)
- [ ] Body present (otherwise noindex, existing rule); answer in the first 80 words; 2–4 "related pages" links; real author; `updatedAt` set on every edit.
- [ ] Competitor facts only with sources and dates; gated topics (B1, B8, B9) only after S-06.

### 16.7 Tool page (in addition)
- [ ] Maths in a pure `*.lib.ts` with unit tests (integer piastres, live rate with a fallback); works without JS for the explanation, with JS for the calculator.
- [ ] WebApplication JSON-LD; no signup needed to use it; one soft CTA after the result.
- [ ] No AI calls (T3), or the full `docs/ai.md` checklist if one is ever added.

---

## 17. Open questions and missing information (with recommendations)

| # | Question | Recommendation |
|---|---|---|
| Q1 | **S-01:** primary host www or apex? | **www.** Vercel already serves it and the index already lists it. Set `NEXT_PUBLIC_SITE_URL=https://www.tallaby.com` and make apex→www a 308. Blocker for every phase. |
| Q2 | **S-06:** publish compare and alternatives pages naming competitors? | **Yes, starting with EasyOrders and Shopify**, under the §16.2 rules (sources, dates, honest strengths). These are the biggest gaps in the SERP. Keep the rest gated until each has fresh official facts. |
| Q3 | **S-07:** allow AI training crawlers (GPTBot, ClaudeBot, CCBot, anthropic-ai) on tallaby.com? | **Allow them on the marketing host only** and keep them blocked on store hosts (split `crawlRules` by host in `lib/sitemap/robots.lib.ts`). Marketing pages are meant to be quoted. AI search bots are already allowed. |
| Q4 | **Digital products:** ROADMAP §2.1 lists them and the code supports them (migrations 0004/0005, `place-order.ts` and shipping skip digital), but the marketing rules forbid claiming them. | Owner to confirm whether the storefront delivers files end to end. If yes, update the rules and plan a `/industries/digital-products-store` page (10 autocomplete suggestions). Until then, no page. |
| Q5 | **AI Store Builder:** when will `STORE_BUILDER_AI_ENABLED` be on in production (F-82l/m)? | Until then F1 claims only AI product writing and MCP products. On switch-on, add one section to F1 and update the home hero; no new URL. |
| Q6 | **F-84 deploy order:** the F-84 code **is on `main`** (commit `68106fab`, "public stores from day one with a grace period before top-up"), and the marketing copy on `main` describes the grace rule (`8ca4dab0`). Only migration **`0159`** (the `first_order_top_up` bell type and triggers) is not applied anywhere. **The risk is deploying `main` to production before `0159` is applied there**, which would ship the grace-period code and copy without the first-order top-up bell. | Apply `0159` on staging, then on production with owner approval, **before** deploying `main` (as the migration note in CLAUDE.md says). Then update line 42 of `docs/marketing-site-rules.md` (it still says a top-up is needed before seeing orders). |
| Q7 | Do Egyptian sellers need a commercial register or tax card to sign up, or to connect Paymob or Kashier? | Owner/legal to answer. Strong demand ("متجر الكتروني بدون سجل تجاري", 6 suggestions), and Qumra answers it. If the answer is "not to sign up", write a blog post that sends gateway KYC questions to the gateways. |
| Q8 | **InstaPay / Vodafone Cash:** ROADMAP §2.1 says transfers go to Tallaby's accounts; the audit says F-21p pays the seller with a screenshot. | Verify the F-21p code path in `actions/checkout.ts` / store payment settings before writing I4. |
| Q9 | No keyword tool data. | Connect Search Console right after S-01, and optionally a one-month Semrush or Ahrefs trial to replace the qualitative demand estimates before Phase 4. |
| Q10 | Can Satori (`next/og`) render Arabic correctly (shaping, RTL)? | Half-day spike. If it fails, use static per-page PNGs (§11.3). |
| Q11 | May copy use the search words "دومين" and "ولا" once per page (they're how Egyptians search), given the rules forbid دومين and dialect? | Allow "(الدومين)" once in parentheses on the custom-domain page and in its meta description, and quoted search phrases in FAQ questions only. Owner to approve the exception, or keep strict MSA (Google matches النطاق weakly to دومين). |
| Q12 | Real dashboard screenshots for feature pages: who produces them, and from which store? | Use a demo store with fake data, no real customer names or phones, Arabic and English captures, exported as WebP. |
| Q13 | Product-only photos for 10 new industry pages. | Pexels via the existing `pexels-photo-curator` agent workflow (no people, no logos), stored in `public/industries/`. |
| Q14 | Are the indexed test stores (`testy.tallaby.com`, `tallabya.tallaby.com`) real published stores? | Check `site_status`. If they're tests, unpublish them (offline stores show the noindex offline page). |
| Q15 | Original list of 95 topics. | Received from the owner and mapped one row per number in §5.1. 9 pages were added to §6 to cover them; the §5.2 inventory now has 128 rows. |
| Q16 | WooCommerce compare entry sources: today only `MARKETING_PROJECT.md`, no URLs. | Replace with the official URLs from §3 (woocommerce.com/pricing, wordpress.org plugin pages) before S-06. |
| Q17 | Should `/pricing` show a Free vs Pro break-even ("Pro pays off above N orders a month")? | Yes, computed in code from `{orderFee}` and `{pro}` (never a literal). It's a strong answer to "تكلفة" queries, and T2 can deep-link to it. |

---

## Appendix A. Every source link from the research files, by competitor

Copied from `02-global-competitors.md` and `03-mena-competitors.md` (all checked 2026-11-09, marks per row there). Raw HTML for MENA pages was not kept (55 MB); the facts and URLs are in `docs/seo-research/03-mena-competitors.md`.

**How to read this** (02-global-competitors.md): <https://stripe.com/global> · <https://help.shopify.com/en/manual/payments/shopify-payments/supported-countries> · <https://woocommerce.com/document/woopayments/compatibility/countries/> · <https://www.squarespace.com/payments> · <https://developer.squareup.com/docs/international-development/payments> · <https://support.wix.com/en/article/available-payment-providers-in-your-country> · <https://docs.shopware.com/en/shopware-6-en/shopware-services/shopware-payments> · <https://www.paypal.com/eg/webapps/mpp/setup-to-receive-withdraw> · <https://payrequest.io/guides/accept-paypal-in-egypt> · <https://developers.paymob.com/paymob-docs/llms.txt> · <https://wordpress.org/plugins/paymob-for-woocommerce/> · <https://kashier.io/en/payment-acceptance/ecommerce> · <https://developers.kashier.io/docs/plugins> · <https://docs.geidea.net/docs/e-commerce-plugins> · <https://docs.geidea.net/docs/shopify> · <https://ecosire.com/apps/magento-2/magento2-fawry-gateway> · <https://bosta.freshdesk.com/en/support/solutions/articles/36000414774-bosta-integrations>

**1. Shopify** (02-global-competitors.md): <https://www.shopify.com> · <https://www.shopify.com/eg/pricing> · <https://www.shopify.com/pricing> · <https://www.shopify.com/ae/pricing> · <https://www.bigcommerce.com/compare/bigcommerce-vs-shopify/> · <https://help.shopify.com/en/manual/payments/manual-payments> · <https://help.shopify.com/en/manual/payments/shopify-payments/supported-countries> · <https://themes.shopify.com/themes?price%5B%5D=free> · <https://www.wix.com/blog/wix-vs-shopify> · <https://www.shopify.com/magic> · <https://developers.paymob.com/paymob-docs/llms.txt> · <https://thepaypers.com/payments-general/paymob-and-shopify-launch-embedded-payments-in-mena--1269400> · <https://apps.shopify.com/kashier-online-payments> · <https://docs.geidea.net/docs/shopify> · <https://apps.shopify.com/paymob-tax-receipts-generator> · <https://community.shopify.com/t/using-paymob-for-egypt-and-stripe-for-saudi-on-the-same-shopify-store/652384> · <https://apps.shopify.com/bosta-shipping-app> · <https://apps.shopify.com/aramex> · <https://help.shopify.com/en/manual/your-account/languages> · <https://help.shopify.com/en/manual/international/languages/requirements> · <https://www.shopify.com/compare/wordpress-vs-wix-vs-shopify> · <https://www.shopify.com/compare>

**2. WooCommerce (open source, WordPress)** (02-global-competitors.md): <https://woocommerce.com> · <https://woocommerce.com/pricing/> · <https://woocommerce.com/products/woocommerce-subscriptions/> · <https://woocommerce.com/products/woocommerce-shipping-aramex/> · <https://woocommerce.com/products/storefront/> · <https://wordpress.com/pricing/> · <https://prestashop.com/blog/resources/how-much-does-an-online-store-cost/> · <https://woocommerce.com/document/woopayments/compatibility/countries/> · <https://woocommerce.com/woocommerce-vs-shopify/> · <https://woocommerce.com/product-category/themes/> · <https://wordpress.org/plugins/paymob-for-woocommerce/> · <https://wordpress.org/plugins/geidea-online-payments/> · <https://kashier.io/en/payment-acceptance/ecommerce> · <https://wordpress.org/plugins/bosta-woocommerce> · <https://wordpress.org/plugins/bosta-fulfillment/> · <https://woocommerce.com/document/woocommerce-features/cash-on-delivery/> · <https://woocommerce.com/posts/woocommerce-vs-shopify/>

**3. Wix** (02-global-competitors.md): <https://www.wix.com> · <https://www.wix.com/plans> · <https://www.wix.com/upgrade/website> · <https://www.stylefactoryproductions.com/blog/wix-pricing> · <https://www.wix.com/ecommerce/website> · <https://support.wix.com/en/article/connecting-kashier-payment-solutions-as-a-payment-provider> · <https://support.wix.com/nl/article/wix-stores-limieten-en-aanbevolen-richtlijnen> · <https://eseospace.com/blog/wix-product-variant-limits/> · <https://www.shopifreaks.com/wix-launches-harmony-ai-website-builder-with-natural-language-tools/> · <https://www.techradar.com/pro/the-worlds-leading-website-builder-just-launched-an-ai-powered-agent-and-its-designed-to-help-grow-your-business> · <https://support.wix.com/en/article/available-payment-providers-in-your-country> · <https://bosta.freshdesk.com/en/support/solutions/articles/36000414774-bosta-integrations> · <https://support.wix.com/en/article/setting-up-manual-offline-payments> · <https://support.wix.com/en/article/languages-available-in-wix> · <https://support.wix.com/en/article/creating-a-site-with-rtl-text-per-language> · <https://support.wix.com/en/article/wix-multilingual-creating-a-multilingual-site-with-right-to-left-content> · <https://www.wix.com/blog/wix-vs-shopify>

**4. BigCommerce** (02-global-competitors.md): <https://www.bigcommerce.com> · <https://www.bigcommerce.com/essentials/pricing/> · <https://www.bigcommerce.com/compare/bigcommerce-vs-shopify/> · <https://www.bigcommerce.com/apps/bigai-copywriter/> · <https://www.bigcommerce.com/blog/agentic-ai-product-pages/> · <https://support.bigcommerce.com/articles/en_US/Knowledge/Fawry> · <https://bosta.freshdesk.com/en/support/solutions/articles/36000414774-bosta-integrations> · <https://support.bigcommerce.com/articles/en_US/Knowledge/Offline-Payment-Methods> · <https://support.bigcommerce.com/s/article/Localization-Settings?language=en_US>

**5. Squarespace** (02-global-competitors.md): <https://www.squarespace.com> · <https://www.squarespace.com/pricing> · <https://costbench.com/software/cms/squarespace/> · <https://beancount.io/blog/2026/09/17/squarespace-new-pricing-basic-core-plus-advanced-small-business-guide> · <https://www.squarespace.com/blog/weebly-alternatives> · <https://www.squarespace.com/blog/blueprint-ai-website-builder> · <https://www.squarespace.com/blog/guide-to-squarespace-ai-tools> · <https://www.squarespace.com/payments> · <https://stripe.com/global> · <https://www.sqspthemes.com/blog/the-invoicecod-workaround> · <https://support.squarespace.com/hc/en-us/articles/360000177507-Changing-your-account-and-site-language> · <https://support.squarespace.com/hc/en-us/articles/360000308127-Writing-in-your-language> · <https://www.squarespace.com/blog/square-websites-alternatives>

**6. Adobe Commerce (Magento) and Magento Open Source** (02-global-competitors.md): <https://business.adobe.com/products/magento/magento-commerce.html> · <https://www.mgt-commerce.com/blog/magento-license-cost/> · <https://ecommerce.folio3.com/blog/?p=8953> · <https://ecosire.com/apps/magento-2/magento2-fawry-gateway> · <https://commercemarketplace.adobe.com/> · <https://experienceleague.adobe.com/en/docs/commerce-admin/config/sales/payment-methods/payment-methods> · <https://business.adobe.com/blog/adobe-commerce-summit-announcements> · <https://business.adobe.com/au/blog/adobe-commerce-commits-to-agentic-commerce-standards> · <https://stellagent.ai/insights/adobe-commerce-summit-agentic-upgrades> · <https://developers.paymob.com/paymob-docs/llms.txt> · <https://docs.geidea.net/docs/e-commerce-plugins> · <https://kashier.io/en/payment-acceptance/ecommerce> · <https://bosta.freshdesk.com/en/support/solutions/articles/36000414774-bosta-integrations> · <https://packagist.org/packages/mageplaza/magento-2-arabic-language-pack> · <https://www.mgt-commerce.com/tutorial/magento-rtl-language-support/> · <https://www.shopify.com/compare>

**7. PrestaShop** (02-global-competitors.md): <https://prestashop.com> · <https://prestashop.com/prestashop-offers/> · <https://prestashop.com/prestashop-offers/hosted/> · <https://forum.prestashop.com/topic/1100911-prestashop-hosted-is-%E2%82%AC24-monthly-plan-really-capped-at-%E2%82%AC1000-turnover/> · <https://prestashop.com/blog/resources/what-is-the-price-of-a-prestashop-store-in-2025/> · <https://addons.prestashop.com/en/electronics-computers-themes/24770-sketchy-modern-super-store.html> · <https://github.com/PrestaShop/ps_cashondelivery> · <https://devdocs.prestashop-project.org/9/development/internationalization/rtl/> · <https://github.com/PrestaShop/PrestaShop/issues/23156> · <https://developers.paymob.com/paymob-docs/integration-paths/plugins/prestashop> · <https://developers.kashier.io/docs/plugins/prestashop> · <https://docs.geidea.net/docs/e-commerce-plugins> · <https://prestashop.com/prestashop-vs-woocommerce/> · <https://prestashop.com/prestashop-vs-shopify/>

**8. OpenCart** (02-global-competitors.md): <https://www.opencart.com> · <https://github.com/opencart/opencart/releases> · <https://geekchamp.com/products/cloud-clusters-opencart/> · <https://themeforest.net/category/ecommerce/opencart> · <https://github.com/opencart/opencart/tree/master/upload/extension/opencart/catalog/controller/payment> · <https://discover.commoninja.com/opencart/extension/43876> · <https://discover.commoninja.com/opencart/extension/20317> · <https://developers.paymob.com/paymob-docs/integration-paths/plugins/opencart> · <https://docs.geidea.net/docs/opencart> · <https://kashier.io/en/payment-acceptance/ecommerce>

**9. Ecwid (by Lightspeed)** (02-global-competitors.md): <https://www.ecwid.com> · <https://www.ecwid.com/pricing> · <https://support.ecwid.com/hc/en-us/articles/25228352598812-Ecwid-updates-2026> · <https://www.ecwid.com/ai-ecommerce> · <https://www.paymobsolutions.com/en/online-payment> · <https://support.ecwid.com/hc/en-us/articles/207101579-Choosing-language-of-your-Ecwid-admin> · <https://www.ecwid.com/blog/sell-around-the-globe-with-a-fully-multilingual-storefront.amp> · <https://istizada.com/?p=17083>

**10. Webflow Ecommerce** (02-global-competitors.md): <https://webflow.com> · <https://webflow.com/pricing> · <https://webflow.com/blog/paypal-for-ecommerce> · <https://discourse.webflow.com/t/cash-on-delivery-ecommerce/144827> · <https://wishlist.webflow.com/ideas/WEBFLOW-I-1742> · <https://discourse.webflow.com/t/support-for-rtl-languages-such-as-arabic/180416> · <https://wishlist.webflow.com/ideas/WEBFLOW-I-139>

**11. Shopware** (02-global-competitors.md): <https://www.shopware.com> · <https://www.shopware.com/en/pricing/> · <https://docs.shopware.com/en/shopware-6-en/settings/paymentmethods> · <https://docs.shopware.com/en/shopware-6-en/shopware-services/shopware-payments> · <https://store.shopware.com/en/swag338126230916/shopware-language-pack.html> · <https://feedback.shopware.com/forums/942607-shopware-6-product-feedback-ideas/suggestions/45644878-support-rtl-languages>

**12. Square Online** (02-global-competitors.md): <https://squareup.com/us/en/online-store> · <https://squareup.com/us/en/online-store/plans> · <https://developer.squareup.com/docs/international-development/payments> · <https://community.squareup.com/t5/Feature-Requests/Cash-on-Delivery-for-Online-Orders/idi-p/724946>

**EasyOrders (ايزي اوردرز)** (03-mena-competitors.md): <https://www.easyorders.eg/> · <https://www.easyorders.eg/pricing.md> · <https://www.easyorders.eg/llms.txt> · <https://www.easyorders.eg/blog/ما-هي-تكلفة-انشاء-متجر-علي-ايزي-اوردرز/> · <https://www.easyorders.eg/blog/يوكان-أم-ايزي-اوردرز-أفضل-لإنشاء-متجر/> · <https://www.easyorders.eg/blog/ويلت-أم-ايزي-اوردرز-أفضل-لإنشاء-متجرك-ا/> · <https://www.egrow.com/en/blog/easyorders-carrier-integration-egypt-2026>

**ExpandCart (اكسباند كارت)** (03-mena-competitors.md): <https://expandcart.com/> · <https://expandcart.com/ar/> · <https://expandcart.com/en/> · <https://expandcart.com/ar/الاسعار/> · <https://expandcart.com/en/pricing-2/> · <https://expandcart.com/ar/متجر-إلكتروني/> · <https://expandcart.com/ar/expandbot/> · <https://expandcart.com/ar/ultimate-plan-eg/> · <https://expandcart.com/ar/tabby-x-expandcart-2/> · <https://expandcart.com/ar/expandcart_bosta/> · <https://expandcart.com/ar/go_online_now-2/> · <https://expandcart.com/wp-json/wp/v2/posts?search=…>

**Wuilt (ويلت)** (03-mena-competitors.md): <https://wuilt.com/> · <https://wuilt.com/pricing> · <https://wuilt.com/en/pricing> · <https://wuilt.com/e-commerce> · <https://wuilt.com/faqs> · <https://launchbaseafrica.com/2025/08/04/after-ditching-subscriptions-egypts-wuilt-raises-2m-to-build-free-e-commerce-infrastructure/> · <https://wuilt.com/en/home> · <https://wuilt.com/shipments> · <https://help.wuilt.com/en/updates/get-paid-safely-with-the-all-new-wuilt-wallet> · <https://wuilt.com/tools/free-chat-widgets>

**Salla (سلة)** (03-mena-competitors.md): <https://salla.com/> · <https://salla.com/ai-info/> · <https://salla.com/en-sa/plans> · <https://salla.com/plans> · <https://www.wmtips.com/technologies/compare/makane-vs-salla/> · <https://salla.com/ar-ae/plans> · <https://help.salla.sa/article/تفعيل-طرق-الدفع-في-المتجر/dcrwxldslve7spa8eqdgii8g> · <https://salla.com/payments> · <https://help.salla.sa> · <https://salla.com/tools> · <https://salla.com/marketing> · <https://help.salla.sa/article/أسئلة-شائعة-حول-توثيق-المتجر-1/zbcnt9hu9kf8lfh2gmf1vccr> · <https://help.salla.sa/article/توثيق-متجرك-الجديد-في-السعودية/ig4b4l5hc542j4bcd2tp82bz> · <https://help.salla.sa/subcategory/إنشاء-متجر-خارج-السعودية/wslivbqheb6g91a5ymto6tgr> · <https://help.salla.sa/article/إنشاء-متجر-جديد-خارج-السعودية-الإمارات/huvvumstnafaadcw6abpol14>

**Zid (زد)** (03-mena-competitors.md): <https://zid.sa/ar/> · <https://zid.eg/ar/> · <https://zid.sa/ar/pricing/> · <https://zid.sa/en/pricing/> · <https://zid.eg/ar/pricing/> · <https://zid.eg/en/pricing/> · <https://zid.sa/ar/solutions/payments/> · <https://intercom.help/zid/ar/articles/7864238-عن-زد-باي> · <https://zid.eg/ar/solutions/payments/> · <https://zid.sa/ar/solutions/shipping/> · <https://zid.eg/ar/solutions/shipping/> · <https://zid.sa/ar/solutions/themes/> · <https://zid.sa/ar/solutions/zid-voice/> · <https://zid.sa/ar/blog/zid-insights-store-analytics/> · <https://zid.sa/ar/solutions/marketing-tools/> · <https://zid.sa/ar/switchers/zid-x-salla/> · <https://itweb.africa/article/zid-enters-egypt-through-zammit-acquisition/dgp45vaBzQR7X9l8>

**YouCan (youcan.shop)** (03-mena-competitors.md): <https://youcan.shop/sitemap.xml> · <https://youcan.shop/en/faq> · <https://youcan.shop/en> · <https://youcan.shop/en/pricing> · <https://youcan.shop/en/help/store-activation> · <https://youcan.shop/en/features> · <https://youcan.shop/en/themes> · <https://youcan.shop/en/pages> · <https://youcan.shop/en/checkout> · <https://youcan.shop/en/international> · <https://youcan.shop/en/help/ai-mouchi> · <https://youcan.shop/en/mcp> · <https://youcan.shop/en/help/youcanpay> · <https://youcan.shop/en/help/stripe> · <https://youcan.shop/en/help/custom-payment> · <https://stripe.com/global> · <https://youcan.shop/en/help/shipping-zones> · <https://youcan.shop/en/help/cod-network> · <https://youcan.shop/en/analytics> · <https://youcan.shop/en/help/abandoned-carts> · <https://youcan.shop/en/help/contact-support> · <https://apps.apple.com/us/app/id1485859147> · <https://storeleads.app/reports/youcan/EG/top-stores>

**Lightfunnels (lightfunnels.com)** (03-mena-competitors.md): <https://www.lightfunnels.com/sitemap.xml> · <https://www.lightfunnels.com> · <https://www.lightfunnels.com/pricing> · <https://www.lightfunnels.com/egpricing> · <https://www.lightfunnels.com/cod> · <https://docs.lightfunnels.com/funnels/funnel-pages/> · <https://docs.lightfunnels.com/funnels/ai-funnel-builder/> · <https://docs.lightfunnels.com/products/ai-implementaiton/> · <https://www.lightfunnels.co/ai-generation/> · <https://docs.lightfunnels.com/sitemap-0.xml> · <https://docs.lightfunnels.com/payment-gateways/kashier/> · <https://docs.lightfunnels.com/payment-gateways/fawaterk/> · <https://docs.lightfunnels.com/payment-gateways/taager/> · <https://kashier.io> · <https://fawaterk.com> · <https://docs.lightfunnels.com/settings/shipping/> · <https://docs.lightfunnels.com/orders/order-fulfillment/> · <https://www.lightfunnels.com/apps> · <https://docs.lightfunnels.com/payment-gateways/cash-on-delivery/> · <https://docs.lightfunnels.com/settings/security-documentation/> · <https://docs.lightfunnels.com/apps-and-integrations/google-shopping-product-feeds/> · <https://docs.lightfunnels.com/analytics/sales-attribution/> · <https://docs.lightfunnels.com/orders/abandoned-checkouts/> · <https://docs.lightfunnels.com/contact/> · <https://www.lightfunnels.com/ar> · <https://qumra.cloud**> · <https://shantaweb.com**> · <https://shantaweb.com/ar> · <https://halaorders.com**>

**Qumra** (03-mena-competitors.md): <https://qumra.cloud> · <https://qumra.cloud/en> · <https://qumra.cloud/blog/قمرة-ولا-شوبيفاي>

**Shanta** (03-mena-competitors.md): <https://shantaweb.com> · <https://shantaweb.com/ar> · <https://shantaweb.com/ar/pricing>

**HalaOrders** (03-mena-competitors.md): <https://halaorders.com> · <https://halaorders.com/pricing>

## Appendix B. Keyword research raw files

Full research reports: `docs/seo-research/01-audit.md` (codebase audit), `02-global-competitors.md`, `03-mena-competitors.md` (per-fact sources and dates).

- `docs/seo-research/keywords/suggest-ar.txt`, `suggest-ar2.txt`, `suggest-en.txt` (Google autocomplete, gl=eg, 2026-11-09 12:19–12:20 UTC)
- `docs/seo-research/keywords/serp-ddg.txt` (DuckDuckGo brand checks)
- `docs/seo-research/keywords/mena-suggest.txt`, `mena-suggest2.txt` (autocomplete from the MENA research)
- Google SERP extracts (30 queries) are summarised in §6.2; the session was stopped at Google's rate-limit page.

Supporting web sources used in §6.2 and §11 (English, US index): [eGrow: EasyOrders vs Shopify Egypt COD](https://www.egrow.com/en/blog/easyorders-vs-shopify-egypt-cod-2026), [Eyzle: Shopify alternative for COD](https://eyzle.net/blog/best-shopify-alternative-for-cod-mena), [wmtips: e-commerce platforms in Egypt](https://www.wmtips.com/technologies/e-commerce/country/eg/), [Google Search Central updates](https://developers.google.com/search/updates), [FAQPage doc](https://developers.google.com/search/docs/appearance/structured-data/faqpage).
