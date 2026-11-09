# MENA store-builder competitors: verified facts (for Tallaby / طلبي)

**Checked:** 2026-11-09, unless a row says otherwise. **Method:** official pages fetched with curl and WebFetch (raw HTML saved in `scratchpad/seo/raw/`); help centers, sitemaps, `llms.txt` / `.md` page copies, WordPress REST and plan APIs where a site exposes them; third parties only where official info was missing, and labelled as such. **Rules followed:** nothing invented; anything not seen on a source is marked **Unverified** with the reason; free, paid and enterprise tiers are kept apart; the currency and locale actually served are recorded. Prices seen from an Egyptian/US connection; some sites geo-price.

**Re-verification of `apps/ecommerce/lib/marketing/compare.lib.ts` (EasyOrders entry, facts dated 2026-10-28):**
- `freePlan: "y"`: **partly true**. There is no subscription, but activation needs a **$5 wallet top-up**, then **$0.04 per order**. Better shown as "p" or "pay per order".
- `monthly: "y"`: true. Professional is **$100/month**. (MARKETING_PROJECT.md §18 says $0.04 and $100; both match today's page. EasyOrders' own blog still quotes the older $0.02 and $50.)
- `noCode: "y"`: true ("Drag & Drop", "لا تحتاج كود").
- `cards: "y"`: true ("+15 بوابات دفع"; cards and e-wallets in the FAQ).
- `carriers: "y"`: true ("أكثر من 100 شركة شحن"), but the carrier list isn't published on product pages.
- `feeds: "y"`: true (Google Shopping, Meta catalog for FB/IG/TikTok).
- `currencies: "y"`: plausible ("يمكنك البيع في أي دولة", 10 countries), but there's no explicit "multi-currency storefront" quote on the pages read. Keep it, with a source note.
- The note "Salla, Zid, YouCan and ExpandCart are left out until someone supplies theirs" can now be filled from this file.
- **New, important:** **Zid now sells in Egypt** (zid.eg, EGP prices, free-forever plan, Bosta/Paymob/valU logos). **Salla effectively does not**: verification needs a Saudi commercial registration for foreigners.

**Contents:** EasyOrders · ExpandCart · Wuilt · Salla · Zid · YouCan · Lightfunnels · Qumra · Shanta · HalaOrders · Summary matrix · SEO intel (keywords, comparison pages, autocomplete).

---

## EasyOrders (ايزي اوردرز)

Locale/currency seen: Arabic (ar-EG) homepage and pricing at easyorders.eg, prices in **USD**. The site also serves `/en/` and `/fr/`, and separate country sites `ma.easyorders.ai` (Morocco), `dz.easyorders.ai` (Algeria) and `easyorders.ai` (global). `easy-orders.net` (the name given in the brief) 301-redirects to `https://www.easyorders.eg/`. The site publishes an `llms.txt` and Markdown copies of each page (`/index.md`, `/pricing.md`, `/themes.md`, `/create-ecommerce-store-with-ai.md`), which is where most quotes below come from.

| Field | Value | Source | Checked |
|---|---|---|---|
| Official site | https://www.easyorders.eg/ (easy-orders.net 301 → easyorders.eg). Other sites: easyorders.ai, ma.easyorders.ai, dz.easyorders.ai. Help/API docs: public-api-docs.easy-orders.net, themes-docs.easy-orders.net. Public roadmap: roadmap.easyorders.ai/ar | curl of easy-orders.net (301 Location header); homepage links | 2026-11-09 |
| Plans and prices | **Regular (الباقة العادية): $0.04 per order** ("ادفع مبلغ رمزي فقط 4 سنتات لكل طلب"), no monthly fee, labelled "أقل سعر (مجاني)". **Professional (الباقة الاحترافية): $100 / month**, "بدون اي عمولة علي الطلبات". No annual price shown. USD. | https://www.easyorders.eg/pricing.md, https://www.easyorders.eg/llms.txt | 2026-11-09 |
| Price history (context) | Their own 2023 blog post says 2 cents per order and a $50/month VIP plan; several 2025–2026 comparison posts on their blog still quote $0.02 / $50. The live pricing page now says $0.04 / $100, so the per-order fee has doubled and the flat plan has doubled. The blog is out of date. | https://www.easyorders.eg/blog/ما-هي-تكلفة-انشاء-متجر-علي-ايزي-اوردرز/ (published 2023-02-14), the "سلة أم ايزي اوردرز" post (modified 2026-02-25) | 2026-11-09 |
| Per-order / transaction fees | $0.04 per order on Regular; none on Professional. The FAQ says "لا … مصاريف خفية" (no hidden fees). Whether cancelled or fake orders are charged: **Unverified** (not stated on any page I read). The fee is taken from a prepaid wallet: "رصيد التفعيل … اشحن المحفظة بقيمة 5 دولار … لتفعيل الحساب، وسيبقى المبلغ المضاف متاحًا داخل رصيدك". The 2023 post says the balance never expires, and that when it runs out the store keeps taking orders but you can't **see** them until you top up. | /create-ecommerce-store-with-ai.md; 2023 cost blog post | 2026-11-09 |
| Free plan / trial | No subscription on Regular. You pay per order and must top up **$5** to activate (the $5 stays as balance). There is no zero-cost plan once you sell. | /create-ecommerce-store-with-ai.md | 2026-11-09 |
| Product/order limits | Both plans: "عدد غير محدود من المنتجات", "عدد غير محدود من الطلبات", "زيارات غير محدودة". | /index.md pricing block | 2026-11-09 |
| Lapsed payment | The FAQ says "عند تأخير الدفع، سيتم إيقاف الخدمات مؤقتاً حتى يتم تجديد الاشتراك", while the plan bullets say "متجرك يظل مفتوحًا حتى لو لم تجدّد الاشتراك". The page contradicts itself. | /index.md | 2026-11-09 |
| Builder / templates | Drag & drop, no code ("Drag & Drop", "لا تحتاج كود"). "+100 ثيم عصري" (themes page title: "أكثر من 100 تصميم جاهز لمتجرك"). Ready landing pages and funnels (themes-docs has a Funnels section). Theme developer docs are public. | /index.md, /themes.md, themes-docs.easy-orders.net | 2026-11-09 |
| AI features ("Easy AI") | AI product creation (title and description), AI landing page from a one-line idea, landing-page quality review from a URL, customer-behaviour analysis, AI image design, an auto-reply chatbot named "شاطر" (Shater). Claims "23% مبيعات عن طريق الـAI". Whether AI is extra-paid or credit-limited: **Unverified**. | /index.md, /create-ecommerce-store-with-ai.md | 2026-11-09 |
| Payment integrations | "+15 بوابات دفع", "ربط مباشر مع +15 بوابات". FAQ: cards, e-wallets, COD. Named gateways appear only in their **blog**, not on the product pages: "بوابات دفع واسعة تشمل Paymob و Fawry و Paytabs" (the YouCan-vs-EasyOrders post). Kashier, InstaPay, valU, Tabby/Tamara: **Unverified** (no official mention found). | /index.md; https://www.easyorders.eg/blog/يوكان-أم-ايزي-اوردرز-أفضل-لإنشاء-متجر/ | 2026-11-09 |
| Shipping integrations | "اربط متجرك بأكثر من 100 شركة شحن وتوصيل محليَّة ودوليَّة". Named in their blog: "شركات الشحن مثل بوسطة" (the Wuilt-vs-EasyOrders post). A third party (eGrow, an integration vendor) writes about connecting EasyOrders to Aramex, Bosta and R2S, which suggests these are not all native. The full carrier list is **Unverified**. | /index.md; https://www.easyorders.eg/blog/ويلت-أم-ايزي-اوردرز-أفضل-لإنشاء-متجرك-ا/; https://www.egrow.com/en/blog/easyorders-carrier-integration-egypt-2026 (third party) | 2026-11-09 |
| Cash on delivery | Yes: "نحن ندعم جميع وسائل الدفع الرئيسية بما في ذلك … الدفع عند الاستلام". COD tools: "حاجب الطلبات الوهمية" (fake-order blocker), "يكتشف الطلبات الوهمية قبل تأكيدها". | /index.md | 2026-11-09 |
| SEO capabilities | Not described on the product pages. **Unverified**. Feeds: Google Shopping, plus Meta catalog for Facebook, Instagram and TikTok. | /index.md | 2026-11-09 |
| Analytics | AI "تحليل جودة سلوك العميل", "تحليلات لتحسين المبيعات". Their public roadmap (read 2026-10-28) shows per-product visit stats still being built (Tallaby ROADMAP.md §2.4). | /create-ecommerce-store-with-ai.md; ROADMAP.md §2.4 | 2026-11-09 |
| Marketing tools | Downsell ("خاصية الداون سيل"), cross-selling, Conversion API, "خاصية التمويه" (cloaking: "يحمي صفحات المنتجات من المنافسين"), Google Shopping and Meta catalog feeds, free marketing and campaign-management support ("اول منصة تقدم دعم للتسويق وادارة الحملات مجاناً"), a seller app with instant order alerts, a merchant services marketplace and an academy (YouTube). Abandoned carts, coupons, WhatsApp automation: not on the pages I read (**Unverified**). Their roadmap lists deposits, cart reminders and bundles as requested or planned (ROADMAP.md §2.4). | /index.md; ROADMAP.md §2.4 | 2026-11-09 |
| Support | "دعم عربي 24 ساعة" by phone, live chat and video. FAQ: Arabic and English, 24/7. WhatsApp +20 128 562 1555, Messenger, Telegram. | /index.md, /llms.txt | 2026-11-09 |
| Target markets / Egyptian sellers | Egyptian-first (.eg domain, ar-EG hreflang, Egyptian WhatsApp number), plus Morocco and Algeria sites and a global site. Claims "10 دول", "200,000+ متجر مسجل", "+300,000 طلب يوميا". FAQ: "نعم، يمكنك البيع في أي دولة". **Egyptian sellers: yes.** | homepage hreflang; /index.md | 2026-11-09 |
| Admin language | Arabic ("توفر لوحة تحكم عربية سهلة الاستخدام"); the site is also in English and French. | /create-ecommerce-store-with-ai.md | 2026-11-09 |
| Domain | "نحن لا نوفر دومين لك" (bring your own; connecting one is supported). | /index.md FAQ | 2026-11-09 |
| Mobile app | iOS (id6744579490) and Android (com.myeasyorders.seller) seller apps. | /llms.txt | 2026-11-09 |

**SEO intel (seen)**
- Homepage `<title>`: "منصة ايزي اوردرز : لحلول التجارة الالكترونية". H1: "أنشئ متجرك الإلكتروني بنفسك في أقل من 10 دقايق، بدون خبرة برمجية." Meta description targets "إنشاء المتاجر الإلكترونية", "إدارة الطلبات", "صفحات هبوط جاهزة", "بوابات الدفع".
- Landing pages: "اداة انشاء المتاجر الإلكترونية بالذكاء الاصطناعي | EasyOrders AI" (an article page targeting "انشاء متجر الكتروني بالذكاء الاصطناعي … في 2026"), "ثيمات ايزي اوردرز | أكثر من 100 تصميم جاهز لمتجرك", "الأسعار | EasyOrders".
- hreflang: ar, ar-EG, ar-MA, ar-DZ, en-*, fr-*, x-default.
- **Comparison ("أم"/"vs") posts on their blog** (blog/post-sitemap.xml, 195 posts):
  - "الفرق بين ايزي اوردرز وشوبيفاي: أيهما الأفضل لمتجرك الإلكتروني في 2026؟" (2025-08-24, modified 2026-02-25)
  - "سلة أم ايزي اوردرز: أيهما أرخص وأفضل للبدء في التجارة الإلكترونية؟" (2025-10-19)
  - "لايت فانلز أم ايزي اوردرز أفضل لإنشاء متجرك الإلكتروني في 2026؟" (2025-10-19)
  - "سهل كارت أم ايزي اوردرز افضل لانشاء متجر الكتروني مجاني؟" (2025-10-11)
  - "يوكان أم ايزي اوردرز أفضل لإنشاء متجرك الإلكتروني" (2025-11-16)
  - "ويلت أم ايزي اوردرز أفضل لإنشاء متجرك الالكتروني مجانًا في دقائق ؟" (2025-11-19)
  - Also: "إنشاء متجر إلكتروني للملابس", "انشاء متجر الكتروني بالذكاء الاصطناعي", "أفضل شركات الشحن الداخلي في مصر", "شركات شحن دولي في مصر", "انشاء متجر دروب شيبنج بخطوات بسيطة", "ما هي تكلفة انشاء متجر علي ايزي اوردرز…".
  - There's no ExpandCart, Zid, Qumra, Shanta or HalaOrders comparison post in the sitemap.
  - Several comparison posts still quote their old $0.02 / $50 prices. That gap matters if Tallaby publishes accurate comparisons.

**Advantages for an Egyptian small seller**
- Very low entry cost: $5 activation top-up, then $0.04 per order, with unlimited products and orders.
- Built for COD sellers: fake-order blocker, downsell and cross-sell, landing pages and funnels, Conversion API.
- 100+ themes, built-in AI, Arabic admin, 24/7 Arabic support (phone, chat, video), free help with ad campaigns, a seller mobile app.
- Big ecosystem: academy, merchant services, public API, public roadmap.

**Disadvantages for an Egyptian small seller**
- Priced in USD, so the cost moves with the EGP rate. The fee has doubled (2023: $0.02 / $50; now $0.04 / $100) and the blog still shows the old prices.
- No domain included. The FAQ contradicts itself on what happens when payment lapses. Per the 2023 post, orders are hidden until you top up.
- Gateway and carrier names aren't listed on official product pages. A third-party integrator implies some carriers need middleware.
- The $100 jump from per-order to flat pricing is steep for a growing seller (break-even 2,500 orders a month).

---

## ExpandCart (اكسباند كارت)

Locale/currency seen: Arabic `expandcart.com/ar/` and English `expandcart.com/en/pricing-2/` (the URL `/en/pricing` redirects to `/en/pricing-2/`), both priced in **EGP** from my connection (a geo or default price list; other regions may see USD, as the 2021 Egypt campaign page quoted "$629 instead of $899" for Ultimate yearly). The site runs on WordPress. The bare `https://expandcart.com/` timed out with curl but `/ar/` loaded.

| Field | Value | Source | Checked |
|---|---|---|---|
| Official site | https://expandcart.com/ar/ (Arabic), https://expandcart.com/en/ | homepage | 2026-11-09 |
| Plans and prices (EGP) | **Standard 599 EGP/month or 5,999 EGP/year**; **Professional 1,199 EGP/month or 11,999 EGP/year** (labelled "الأكثر مبيعًا" / "Most Popular" in places); **Ultimate 4,599 EGP/month or 45,999 EGP/year**; **Business (باقة الأعمال)**: price on request. "وفر حتى 15٪ على الخطة السنوية". | https://expandcart.com/ar/الاسعار/ and https://expandcart.com/en/pricing-2/ | 2026-11-09 |
| Transaction fees | "عمولة المبيعات 0% 0% 0% 0%" (all plans); "بدون عمولة على مبيعاتك". Payment-gateway fees are the gateway's own (not stated). | pricing page | 2026-11-09 |
| Free plan / trial | The homepage says "احصل على 15 يوم مجانا … بدون بیانات بنكیة" but the pricing FAQ says "تجربه مجانيه بالكامل لمدة ١٤ يوماً", so the pages disagree on the length. The pricing FAQ also mentions "الباقة المجانية" (you must buy a domain if you use it), but no free plan appears in the pricing table, so a current free plan is **Unverified**. No refunds ("لا يوجد استرداد"). | https://expandcart.com/ar/ ; pricing FAQ | 2026-11-09 |
| Product/order limits | Products: Standard 100, Professional 1,000, Ultimate and Business unlimited. Users: 1 / 3 / 10 / unlimited. Coupons: Standard 5, others unlimited. Order limits: none stated. | pricing comparison table | 2026-11-09 |
| Builder / templates | Standard: 1 free responsive template plus an "advanced template editor"; Professional: 4 templates; Ultimate: all templates. The homepage says "أكثر من 50 قالب احترافي" but the online-store page says "أكثر من 100 قالب احترافي … يمكن تخصيصه بالكامل", so the pages disagree. Paid custom design and "أطلق متجري" (done-for-you setup) service. Claims "أكثر من 6,000 ميزة". | pricing; https://expandcart.com/ar/متجر-إلكتروني/ | 2026-11-09 |
| AI features | None found on the pricing, home or store pages (only blog articles about AI). There is an older "ExpandBot" chatbot page from 2021. **Unverified / not advertised.** | pages above; https://expandcart.com/ar/expandbot/ | 2026-11-09 |
| Payment integrations | "تكامل مع +100 شركة شحن ودفع". The FAQ names "2checkout، باي بال، PayTabs، كاش يو، فاتورة". The homepage names "باي بال - باي تابس". The Egypt Ultimate campaign page (2021) shows logos for **Paymob, Fawry**, PayTabs, Tap, MyFatoorah and Amazon Payment Services. Tabby partnership page (2022), JumiaPay partnership page (2022), Fawaterak page (2022). Kashier, InstaPay, valU, Tamara: **Unverified**. | pricing FAQ; homepage; https://expandcart.com/ar/ultimate-plan-eg/ (image alts); https://expandcart.com/ar/tabby-x-expandcart-2/ | 2026-11-09 |
| Shipping integrations | "+50 شركة شحن" (store page) / "+100 شحن ودفع" (pricing). The Egypt campaign page shows logos for **Bosta, Aramex, Mylerz, R2S, SMSA**. A Bosta shipping-rate offer page exists (2020). J&T: **Unverified**. | https://expandcart.com/ar/ultimate-plan-eg/; https://expandcart.com/ar/expandcart_bosta/ | 2026-11-09 |
| Cash on delivery | Not stated in plain text on the pages I read. **Unverified** (very likely as a standard method, but no quote found). | — | 2026-11-09 |
| SEO | "تهيئة المتجر لمحركات البحث وعناوين URL صديقة" (in the table), and on Professional and up "محرر نصوص يدعم ظهور متجرك بمحركات البحث". The English page says "Free Marketing & SEO Apps" from Professional. | pricing | 2026-11-09 |
| Analytics | Standard: basic reports; Professional: analytics tab with export and Google Analytics; Ultimate: export all reports. Facebook Pixel on all plans. | pricing | 2026-11-09 |
| Marketing tools | Coupons, gift vouchers, newsletters and email campaigns, SMS app, deal-of-the-day, reviews, loyalty (Ultimate), affiliate app, **abandoned-cart recovery (Ultimate: "تطبيق استهداف سلال التسوق المتروكة")**, WhatsApp Business integration (Business plan), pop-ups (Business), Google Shopping, Facebook/Instagram shops, Amazon channel, POS, dropshipping (Knawat, AliExpress, Taagerly, Printful). | pricing; homepage | 2026-11-09 |
| Support | Live chat in the dashboard, tickets, contact form, phone ("كما يمكنك الاتصال بنا عبر الهاتف"), support@expandcart.com. "دعم فني احترافي على مدار الساعة". Account manager as a paid extra. Languages: Arabic and English site; support language not stated (**Unverified**). | pricing FAQ; homepage | 2026-11-09 |
| Target markets / Egyptian sellers | Arab region ("أول وأكبر منصة تجارة إلكترونية في العالم العربي", "25,000+ متجر"; a 2022 page says "أكثر من ٤٠ دولة"). Prices in EGP and an Egypt-specific campaign page (`ultimate-plan-eg`) show **Egyptian sellers are served**. | homepage; pricing; https://expandcart.com/ar/go_online_now-2/ | 2026-11-09 |
| Admin language | Arabic and English (site in both; Arabic admin implied by the Arabic onboarding). Admin UI language: **Unverified** directly. | — | 2026-11-09 |
| Signs of activity | The newest blog post found via the WordPress API is dated 2024-03-31, and the footer says "©2024". The marketing site looks less active than EasyOrders'. | https://expandcart.com/wp-json/wp/v2/posts?search=… | 2026-11-09 |

**SEO intel (seen)**
- Homepage (ar) `<title>`: "انشيء متجرك الإلكتروني وابدأ نجاحك اليوم - اكسباند كارت". Meta: "انضم إلى أكثر من 25,000 تاجر ناجح و انشيء متجرك الإلكتروني الاحترافي…". H1 is the same as the title (note the misspelling "انشيء").
- Pricing (ar) `<title>`: "اسعار انشاء متجر الكتروني | اختر الباقة الأمثل لدعم نمو أعمالك مع اكسباند كارت" (targets "اسعار انشاء متجر الكتروني" and "تكلفة انشاء متجر الكتروني"). English: "Choose the plan that works best for your store -Expandcart".
- Comparison pages: "لماذا shopify ليست الحل الأفضل. تعرف على مقارنه مع منصة اكسباند كارت" (`/ar/expandcart-shopify-alternative/`, 2019) and "الفرق بين اكسباند كارت وشوبيفاي وأيهما أفضل لتجارتك في 2022" (2022). No EasyOrders, Salla or Zid comparison found.
- Large old Arabic blog (dropshipping, "أفضل مواقع الربح من الانترنت", "أنجح 10 أفكار مشاريع صغيرة في مصر") plus free tools (business-name, QR, barcode, privacy-policy, return-policy, terms generators).

**Advantages for an Egyptian small seller**
- Priced in EGP (no dollar exposure), 0% sales commission, 14 or 15-day trial without a card.
- A mature feature set: POS, multichannel (Amazon, Google Shopping, Meta), dropshipping apps, loyalty, affiliates, SMS.
- Egyptian carriers and gateways shown (Bosta, Aramex, Mylerz, R2S; Paymob, Fawry).

**Disadvantages for an Egyptian small seller**
- The cheapest plan is 599 EGP a month for only 100 products, 1 template, 1 user and 5 coupons. Abandoned-cart recovery is only on Ultimate (4,599 EGP a month), and WhatsApp Business only on Business.
- No AI features advertised. The pages disagree with each other (trial 14 vs 15 days, templates 50+ vs 100+, a "free plan" mentioned but not offered).
- No refunds. The marketing site and blog seem stale (latest post 2024).

---

## Wuilt (ويلت)

Locale/currency seen: Arabic default site (wuilt.com) and English `/en/home` and `/en/pricing`. The pricing page toggles EGP, USD and SAR (also shows AED and KWD). Website plans are billed **annually**. The online store is **free in Egypt**.

| Field | Value | Source | Checked |
|---|---|---|---|
| Official site | https://wuilt.com/ (app: app.wuilt.com, store signup: store.wuilt.com, help: help.wuilt.com) | homepage | 2026-11-09 |
| Plans and prices | **Online store: "Start Selling Online 100% Free. Forever"** ("ابدأ البيع أونلاين مجانًا … مجانًا بالكامل"). FAQ: "لعملاء ويلت في مصر، متاجر ويلت مجاناً ١٠٠٪ مدى الحياه!" **Website plans (annual)**: Personal EGP 1,250 / US$50; Premium (الأساسية) EGP 7,500 / US$150; Business (المميزة) EGP 10,500 / US$210; Ultimate (الاحترافية) EGP 17,500 / US$350; Enterprise custom. "All Fees are in USD"; "14% VAT" on cash payments inside Egypt (Vodafone Cash, bank deposit and transfer). The comparison table contradicts the cards ($50 / $99 / $150), and an older FAQ line says store plans "تبدأ من 200 دولار في السنة". | https://wuilt.com/pricing, https://wuilt.com/en/pricing, https://wuilt.com/e-commerce, https://wuilt.com/faqs | 2026-11-09 |
| Business model change | In April 2025 Wuilt dropped subscriptions for its core store builder in Egypt. It now earns from Wuilt Shipments, Wuilt Pay and Wuilt Wallet. It reported 20,000+ new merchants after the change and a $2M raise (Flat6Labs, MTF VC, Hub71…), with UAE planned for Q4 2025 and GCC and Turkey for early 2026. | https://launchbaseafrica.com/2025/08/04/after-ditching-subscriptions-egypts-wuilt-raises-2m-to-build-free-e-commerce-infrastructure/ (third party, press) | 2026-11-09 |
| Transaction fees | Store: "دون عمولة على البيع" (no sales commission). Wuilt Pay fee rates: **Unverified** (not published anywhere I found). COD collection through Wuilt Shipments/Wallet: a search-engine snippet of a help.wuilt.com article said "COD is subject to a 1% collection fee above EGP 3000" (example: EGP 1 + 14% VAT on a 3,100 EGP shipment). The article URL now returns 404, so this is **Unverified**. | https://wuilt.com/e-commerce; search snippet of help.wuilt.com/help-center/how-to-use-wuilt-wallet (404 on 2026-11-09) | 2026-11-09 |
| Free plan / trial | Store: free (Egypt). Websites: 7-day free trial ("You can try Wuilt completely for 7 days free and publish on a Wuilt subdomain"); one English homepage block says 14 days. No card needed. | https://wuilt.com/en/pricing, https://wuilt.com/en/home | 2026-11-09 |
| Product/order limits | "أضف منتجاتك بلا قيود", "بيع بلا حدود". No published caps for the free store. | https://wuilt.com/e-commerce | 2026-11-09 |
| Builder / templates | Section-based, no drag & drop ("Build without drag & drops — choose between different pre-designed sections"). Colours, fonts (40+ Arabic fonts), logo, custom pages, video backgrounds, product bundles, reviews, customizable checkout, XML sitemap, an App Center (April 2025). Template count: **Unverified**. Store languages: Arabic, English, French, Turkish. | https://wuilt.com/en/home; help.wuilt.com/en/updates/* (sitemap) | 2026-11-09 |
| AI features | None advertised on the pricing, home or e-commerce pages. **None found.** | pages above | 2026-11-09 |
| Payment integrations | "Integrate your store with the best secured online payment gateways"; the pricing page shows a logo strip "Accepted payment providers" (names not in text). Wuilt Pay (own processing) is reported by press. Named gateways (Paymob, Kashier, Fawry, InstaPay, valU): **Unverified**. | https://wuilt.com/en/home; LaunchBase Africa article | 2026-11-09 |
| Shipping integrations | **Wuilt Shipments**: "أرامكس، مايلرز، وبوسطة وغيرهم", no order minimum, all governorates, label printing and tracking from one dashboard. COD money lands in the **Wuilt Wallet** (Egypt only) and can be withdrawn to a bank account manually or automatically. Wallet top-up is by bank card. | https://wuilt.com/shipments; https://help.wuilt.com/en/updates/get-paid-safely-with-the-all-new-wuilt-wallet | 2026-11-09 |
| Cash on delivery | Yes, through Wuilt Shipments: "فلوس الدفع عند الاستلام بتنزل تلقائيًا في محفظتك". | https://wuilt.com/shipments | 2026-11-09 |
| SEO | Meta description per page, keywords, XML sitemap; Ultimate website plan includes Google Search Console setup help. | https://wuilt.com/faqs; help.wuilt.com/en/updates/add-an-xml-sitemap-for-your-website-or-store; pricing | 2026-11-09 |
| Analytics | Google Tag Manager, Google Analytics and Facebook Pixel can be added (the pricing ties GA and Pixel to the Business tier for websites). There's a help update called "a better way to improve your ad performance" (not read). | https://wuilt.com/e-commerce; pricing | 2026-11-09 |
| Marketing tools | Free chat-widget buttons (WhatsApp and others), pixels, reviews, bundles, an App Center. Abandoned cart, coupons, upsell: **Unverified**. | https://wuilt.com/tools/free-chat-widgets link; help updates list | 2026-11-09 |
| Support | Phone, live chat and video ("عبر الهاتف والدردشة الحية والفيديو"); WhatsApp +20 112 984 0906; email sales@wuilt.com; Zoom and an account manager on the top website plan. Arabic-first. | https://wuilt.com/e-commerce; homepage | 2026-11-09 |
| Target markets / Egyptian sellers | Egyptian company (Cairo, per press); free store for Egypt; wallet Egypt-only; expanding to UAE, GCC and Turkey. **Egyptian sellers: yes.** Claims "350,000+ business owners". | wuilt.com; LaunchBase Africa | 2026-11-09 |
| Admin language | Arabic (default) plus English, French and Turkish UI links (`app.wuilt.com/?lang=ar-EG`). | homepage links | 2026-11-09 |

**SEO intel (seen)**
- Homepage `<title>`: "صمم موقعك الاكتروني بنفسك - ويلت" (note the typo "الاكتروني"). H1: "أنشئ موقع أو متجر احترافي في 5 دقائق ✔️ لا حاجة لأي خبرة في البرمجة والتصميم ✔️ دعم فني مميز ✔️ ميزانية بسيطة".
- E-commerce page `<title>`: "أنشئ متجرك الإلكتروني في دقائق وبسهولة، وابدأ في بيع منتجاتك اليوم". H1: "أنشئ متجرك في خطوة وبيع من مكانك!" (the meta description is a generic English string).
- Pricing `<title>`: "باقات وأسعار تصميم المواقع والمتاجر الإلكترونية على ويلت". Shipments `<title>`: "شحنات ويلت".
- English homepage: "The best Arabic alternative for creating your own website or store in 5 minutes!" They position against website builders (Wix-style), not EasyOrders.
- No comparison or alternative pages found. Their blog is at wuilt.com/blog/ (not crawled in depth).

**Advantages for an Egyptian small seller**
- The store is free with no sales commission. EGP pricing is available, and Egyptian carriers (Aramex, Mylerz, Bosta) are built in through Wuilt Shipments with COD collected into a wallet.
- Arabic-first, simple section builder, phone, chat and video support.

**Disadvantages for an Egyptian small seller**
- The money is made on shipping, payment and wallet services whose fees aren't published (COD fee unverified, Wuilt Pay fee unknown).
- No AI tools advertised. Fewer COD-conversion tools than EasyOrders (no advertised upsell or downsell, fake-order blocker or landing pages).
- The pricing pages are inconsistent (7 vs 14-day trial, two price tables, an "from $200/yr" store line from the paid era).

---


All facts were checked on 2026-11-09. Pages were fetched with `curl` (raw HTML saved in `scratchpad/seo/raw/`) or WebFetch. Unless noted, Salla prices are what salla.com and salla.com/en-sa served to a non-logged-in visitor (SAR). salla.com/ar-ae served AED prices. Zid prices come from the JSON in zid.sa/ar/pricing (SAR) and zid.eg/ar/pricing (EGP). Anything marked **Unverified** was not visible on an official page.

---

## Salla (سلة)

| Field | Value | Source | Checked |
|---|---|---|---|
| Official site | salla.com (Arabic default; `/en-sa/`, `/ar-ae/`, `/en-ae/` locales). salla.sa is named as the Arabic site on the AI-info page. Help center: help.salla.sa | https://salla.com/ , https://salla.com/ai-info/ | 2026-11-09 |
| Company facts (self-reported) | Founded 2016 in Makkah; "68,000+ active stores", "65 billion SAR platform sales", "18M+ shoppers", "832+ apps", "307+ shipping partners", "40+ languages" | https://salla.com/ai-info/ | 2026-11-09 |
| Plans and prices (KSA, SAR) | **Basic: Free** · **Salla Plus: SAR 990/year** (crossed-out yearly value 1,188, "Saved SAR 198") · **Salla Pro: SAR 2,990/year** (crossed-out 3,588, "Saved SAR 598") · **Salla Special**: custom pricing ("Contact us"). There is a Monthly / "Annual (16% off)" toggle. The static HTML shows only annual prices, so the monthly prices are **derived**: 1,188/12 = SAR 99/month and 3,588/12 = SAR 299/month (a third party, wmtips.com, also lists 99 and 299 SAR/month) | https://salla.com/en-sa/plans , https://salla.com/plans ; third-party: https://www.wmtips.com/technologies/compare/makane-vs-salla/ | 2026-11-09 |
| Plans and prices (UAE, AED) | Basic free; Salla Plus AED 990/year; Salla Pro AED 2,990/year (meta description: "ابدأ مجانًا مع سلة بيسك، أو انطلق بسلة بلس بـ990 درهم سنويًا، وسلة برو بـ2,990 درهم سنويًا") | https://salla.com/ar-ae/plans | 2026-11-09 |
| VAT on plan prices | **Unverified.** The plans page does not say whether prices include VAT | https://salla.com/en-sa/plans | 2026-11-09 |
| Free plan / trial | Basic plan is free ("Free", "Get started"). "Salla Plus free for 14 days", "Salla Pro free for 14 days" | https://salla.com/en-sa/plans | 2026-11-09 |
| Product / order limits | "Add unlimited products", "Accept orders with no limits", unlimited customers, including on Basic | https://salla.com/en-sa/plans | 2026-11-09 |
| Platform commission on sales | None shown on the plans page. **Unverified** whether Salla takes any sales commission | https://salla.com/en-sa/plans | 2026-11-09 |
| Salla Payments fees | **Unverified (rates not public).** The help center says the dashboard has a fee calculator ("حاسبة الرسوم … أدخل قيمة الطلب … وتحديد طريقة الدفع"), but it publishes no percentages. The payments page says activation needs no third-party contract or specific bank, only store verification. Special plan advertises "رسوم دفع مرنة" | https://help.salla.sa/article/تفعيل-طرق-الدفع-في-المتجر/dcrwxldslve7spa8eqdgii8g , https://salla.com/payments | 2026-11-09 |
| Payment methods | mada, Visa, Mastercard, American Express ("قريبًا" on the payments page), Apple Pay, Google Pay ("قريبًا"), Tabby, Tamara, Spotii, Cashew, STC Pay, PayPal. The help center also lists BNPL MisPay, Madfu and Emkan; Qitaf; Knet (tap) for Kuwait; Deema for Kuwaiti stores; Al Rajhi Mokafaa. "+15 عملة" | https://salla.com/payments , https://help.salla.sa (payment-method nav and article above) | 2026-11-09 |
| Payment methods on the free plan | "في باقة بيسك يمكنك تفعيل خيار التحويل البنكي … كما يمكنك تفعيل الدفع عند الاستلام … أما طرق الدفع الإلكترونية فهي متاحة ضمن الباقات المدفوعة فقط" | help.salla.sa payment-methods article (above) | 2026-11-09 |
| Egyptian payment gateways (Paymob, Fawry, etc.) | **None found** on salla.com/payments or in the help-center payment nav. **Unverified** in the app store (search on apps.salla.sa returned 404) | https://salla.com/payments | 2026-11-09 |
| Cash on delivery | Yes. COD is collected by the shipping company or your own courier, and is available on Basic. Help article: "تفعيل وإدارة الدفع عند الاستلام مع بوليصات سلة" | help.salla.sa payment-methods article | 2026-11-09 |
| Shipping integrations | "Salla Shipping Labels" (discounted labels, on Basic too); "307+" partners. Named: Aramex, Emirates Post, SMSA, DHL, iMile (AI-info page). Help center lists DHL, "أي مكان", SMSA (economy, R2R, GCC), Dorb (refrigerated), Aramex, EMX (UAE). Coverage: KSA, UAE, Kuwait, Qatar, Bahrain, Oman plus international. **J&T, Redbox, Torod: Unverified** (not seen) | https://salla.com/ai-info/ , help.salla.sa shipping nav | 2026-11-09 |
| Egyptian shipping (Bosta, etc.) | **None found.** Not seen on official Salla pages | — | 2026-11-09 |
| Builder / themes | No-code builder, theme library ("مكتبة متنوعة من الثيمات الجاهزة"), free and paid themes ("يبلغ متوسط القوالب المدفوعة نحو 200 ريال"), CSS/JS customisation (Pro), own themes with "Salla Twilight", App Maker (mobile app "خلال 72 ساعة"), Arabic/English RTL dashboard. **Theme count: Unverified** | https://salla.com/ , https://salla.com/ai-info/ , https://salla.com/en-sa/plans | 2026-11-09 |
| AI features | "Salla AI fraud engine" (free, all stores); free tools: "Prompt Library" (prompts to open in ChatGPT or Claude), "SEO-GEO checker", "Store Analyst"; help articles "ربط متجرك مع ChatGPT" and "طريقة ربط متجرك مع Claude"; help category "مساعد النمو" (contents **Unverified**). AI product-description app "AI Float Product Description" is listed in the app store (third-party app). **No built-in AI store builder or AI product writer found** | https://salla.com/payments , https://salla.com/tools , help.salla.sa nav | 2026-11-09 |
| SEO | "Built-in SEO" (plans key features); SEO settings from the dashboard; store blog; landing pages; Google site verification, Google Merchant Center, GTM | https://salla.com/en-sa/plans , https://salla.com/marketing , help.salla.sa nav | 2026-11-09 |
| Analytics | Built-in dashboards for orders, visits and marketing; Google Analytics and Hotjar integrations; "Reports" in the plan comparison | https://salla.com/ai-info/ , https://salla.com/marketing | 2026-11-09 |
| Marketing tools | Unlimited coupons, BOGO, tiered quantity discounts, affiliate marketing with per-affiliate coupons and links, company-domain coupons, gift cards, loyalty points, abandoned-cart reminders (with discount or free shipping), SMS campaigns, customer segments, Pixels (X, Instagram, Snapchat, TikTok) plus Conversion API, product catalogs (Instagram, Google, Snapchat, Pinterest), Mailchimp, Klaviyo, Zapier, Wisepops, "Salla WhatsApp" (inbox plus automated order-status and marketing messages, via "سلة شات"), "Salla Ads", Mahally marketplace, 3D product images | https://salla.com/marketing , https://salla.com/en-sa/plans | 2026-11-09 |
| Support | "دعمًا ثنائي اللغة بالعربية والإنجليزية على مدار الساعة عبر المحادثة المباشرة والبريد الإلكتروني". Phone 920031659 and info@salla.sa in the footer. Dedicated success manager on Salla Special | https://salla.com/ai-info/ , https://salla.com/ | 2026-11-09 |
| Target markets | Footer "Available in / مدعوم في": **Saudi Arabia, UAE, Kuwait, Qatar, Bahrain, Oman**. Egypt is not listed. Home: "مُصمّمة للتجّار في السعودية والإمارات" | https://salla.com/ , https://salla.com/en-sa/plans | 2026-11-09 |
| Can an Egyptian merchant sign up and sell? | **Effectively no for selling in Egypt (verified requirements; signup country list Unverified).** Help-center FAQ: "يمكن للتاجر الأجنبي إنشاء متجره على سلة سواء بصفته شركة أو مؤسسة، ولكن لإتمام عملية التوثيق يجب إصدار سجل تجاري. … يشترط أن يكون السجل التجاري المستخدم للتوثيق سجلاً تجارياً سعودياً حتى يتم اعتماد المتجر وتفعيل كامل الخدمات." Individual entity: "كيان فرد (للمواطنين السعوديين فقط)", with a freelance document (وثيقة العمل الحر) and Absher verification. If a store is not verified: "سوف يتم تعليق عمليات الدفع والسداد بعد انتهاء المهلة". "Outside Saudi" guides exist only for UAE, Qatar, Bahrain, Oman (and Kuwait). Signup asks "حدد من أي دولة تسجل متجرك"; whether Egypt is in that list is **Unverified** | https://help.salla.sa/article/أسئلة-شائعة-حول-توثيق-المتجر-1/zbcnt9hu9kf8lfh2gmf1vccr , https://help.salla.sa/article/توثيق-متجرك-الجديد-في-السعودية/ig4b4l5hc542j4bcd2tp82bz , https://help.salla.sa/subcategory/إنشاء-متجر-خارج-السعودية/wslivbqheb6g91a5ymto6tgr , https://help.salla.sa/article/إنشاء-متجر-جديد-خارج-السعودية-الإمارات/huvvumstnafaadcw6abpol14 | 2026-11-09 |

### SEO intel (Salla)
- Home `https://salla.com/`: title "سلة | منصة التجارة الإلكترونية الشاملة في السعودية". Meta description: "سلة هي منصة التجارة الإلكترونية الرائدة في السعودية لإنشاء وإدارة المتاجر الإلكترونية، وتوفر حلولًا متكاملة للمدفوعات والشحن والتسويق ونمو تجارتك أونلاين." H1: "سلة.. تجارة ذكيَّة وسهلة" (appears 3 times in the HTML, as responsive variants of a Framer site).
- Pricing `https://salla.com/plans` (salla.com/pricing returns 404): title "باقات سلة: خيارات متنوعة تخدم طموحك التجاري". Meta: "انضم لأكثر من 60,000 تاجر ناجح في سلة…" (the meta says 60,000 while the page says 68,000). H1: "باقات متكاملة لانطلاقة كل تاجر". EN title: "Salla Packages: Diverse options serving your business ambition".
- UAE pricing `/ar-ae/plans`: title "باقات سلة في الإمارات: أسعار بالدرهم لكل مرحلة من تجارتك". H1: "باقات متكاملة لانطلاقة متجرك في الإمارات".
- Payments `/payments`: title "حلول الدفع الإلكتروني الآمنة لمتجرك | سلة". H1: "إدارة مالية متكاملة لتجارتك".
- Marketing `/marketing`: title "أدوات تسويقية متكاملة تزيد من مبيعاتك". H1: "منتجك يوصل لعميلك بضغطة زر".
- `/ai-info/`: a page written for AI and search engines (an "Official Information About Salla" page with an "AI assistant guidelines" block and a citation format). It is worth copying as a GEO tactic.
- `/tools`: free no-signup merchant tools (UTM builder, QR maker, SEO-GEO checker, Store Analyst, seasons calendar, Prompt Library). Title "أدوات مجانية لتجار المتاجر الإلكترونية · أدوات التجار". These work as lead magnets.
- Sector landing pages: /fashion-sector, /beauty-sector, /electronics-sector, /food-sector, /jewelry-sector, /digital-sector, /home-sector, /health-and-fitness-sector, /design-services-sector.
- "بدائل / مقارنة / vs" pages on salla.com: **none found** (the `site:salla.com` searches returned only third-party pages such as powercommerce.com and wmtips.com).
- Blog posts targeting "انشاء متجر الكتروني": **none found on salla.com/blog** through search. Ranking results were help.salla.sa articles ("إنشاء متجر جديد على سلة", "مرحباً بك في سلة") and Khamsat freelancer listings.

### Advantages / disadvantages for an Egyptian small seller (Salla)
- **+** A real free plan with unlimited products and orders, plus COD and bank transfer on the free plan.
- **+** A mature feature set: 832+ apps, abandoned carts, affiliates, a WhatsApp inbox, pixels and CAPI, an App Maker, and a full Arabic RTL dashboard.
- **−** Not available for Egypt. Verification needs a **Saudi** commercial registration for foreigners, and the individual entity is "for Saudi citizens only". Payments and payouts are suspended for unverified stores.
- **−** No Egyptian gateways (Paymob, Fawry, InstaPay, wallets) and no Egyptian carriers (Bosta etc.) were found. Prices are in SAR or AED (Plus SAR 990 a year).
- **−** Online card payments are paid-plan only. Gateway rates are not published.
- **−** AI features are mostly prompts, external chatbot links and fraud detection. No built-in AI store builder was found.

---

## Zid (زد)

| Field | Value | Source | Checked |
|---|---|---|---|
| Official site | zid.sa (redirects to /ar/; /en/ available). Country sites: /ar/uae/, /ar/kuwait/, /ar/oman/, /ar/syria/, and **zid.eg (Egypt)**. Help center: intercom.help/zid. Operator in footer: "Al-Qudrah Al-Taqniyah for Technology and Communication Company", CR 1010365366 | https://zid.sa/ar/ , https://zid.eg/ar/ | 2026-11-09 |
| Company facts (self-reported) | "+13,500 تاجر اختاروا زد", "+10 مليار ريال مبيعات", "+15 مليون عميل" | https://zid.sa/ar/ | 2026-11-09 |
| Plans and prices (KSA, SAR) | **Starter / البداية: Free forever** · **Rise / الانطلاقة: SAR 99/month** monthly, or SAR 83/month billed annually ("990 تدفع سنوياً") · **Growth / النمو: SAR 299/month**, or SAR 249/month billed annually ("2,990 تدفع سنوياً"; the EN JSON says "2,988 Paid annualy") · **Professional / الإحترافية: custom quote** ("قيمة مخصصة", paid annually). The FAQ calls the paid plans "لايت والنمو والاحترافية" (EN: "Essential, Growth, Professional"), so plan names are inconsistent | https://zid.sa/ar/pricing/ , https://zid.sa/en/pricing/ | 2026-11-09 |
| Plans and prices (Egypt, EGP) | **Starter: Free forever** · **Rise: EGP 1,128.60/month** monthly, or EGP 940.50/month billed annually ("11,286 ج.م تدفع سنوياً") · **Growth: EGP 3,408.60/month**, or EGP 2,840.50/month annually ("34,086 ج.م") · **Professional: custom**. "السنوي – وفر ١٦٪". Note: these equal the SAR prices × 11.4. Meta: "باقات وأسعار بالجنيه المصري" | https://zid.eg/ar/pricing/ , https://zid.eg/en/pricing/ | 2026-11-09 |
| VAT on plan prices | **Unverified** for plan prices. On the Zid Pay fee table: "كل الباقات لا تشمل الضريبة المضافة" | https://zid.sa/ar/solutions/payments/ | 2026-11-09 |
| Free plan / trial | Free-forever Starter plan. No paid-plan trial seen (**Unverified**). Gift: "اختر باقة الاشتراك … واحصل على نظام نقاط البيع مجانًا" (Egypt: "…نقاط البيع والواتساب مجانًا") | https://zid.sa/ar/pricing/ , https://zid.eg/ar/pricing/ | 2026-11-09 |
| Product / order limits | "عدد غير محدود من المنتجات والطلبات والعملاء" (Starter). Team members by plan: 1 / 5 / 20 (comparison table) | https://zid.sa/ar/pricing/ | 2026-11-09 |
| Sales commission | FAQ: "لا يوجد اي عمولة على المبيعات لباقة لايت والنمو والاحترافية". Whether the **free Starter** plan pays a commission is **Unverified** (the FAQ does not mention it) | https://zid.sa/ar/pricing/ (FAQ JSON) | 2026-11-09 |
| Zid Pay fees (KSA) | Per transaction, by plan. **Lite**: mada 1% + 1 SAR; Visa/Mastercard 2.4% + 1 SAR; Amex 3.4% + 1 SAR; Apple Pay "حسب البطاقة". **Growth**: mada 1% + 1; Visa/MC 2.3% + 1; Amex 3.3% + 1. **Professional**: mada 1% + 0.75; Visa/MC 2.2% + 0.75; Amex 3.2% + 0.75. mada fee cap 200 SAR. Fees exclude VAT ("غير شاملة لضريبة القيمة المضافة"). An older help article (21 Feb 2024) says fees include VAT, so the sources conflict. No setup, monthly or refund fees. Deposit fee 3 SAR (free with Riyad Bank). Minimum deposit 100 SAR; payouts every 2–3 days. **Zid Pay is available only in KSA and Kuwait** ("تتوفر حاليًا في المملكة العربية السعودية ودولة الكويت فقط"). Only Tamara and Tabby can be combined with Zid Pay | https://zid.sa/ar/solutions/payments/ , https://intercom.help/zid/ar/articles/7864238-عن-زد-باي | 2026-11-09 |
| Payment methods | mada, Visa/Mastercard, Apple Pay, Amex (Zid Pay); BNPL Tamara, Tabby, MisPay, Emkan; "طرق دفع أساسية (تحويل بنكي، دفع عند الاستلام)" on the free plan; "طرق الدفع المتقدمة" on paid plans. Stripe and PayPal: **Unverified** (not seen) | https://zid.sa/ar/solutions/payments/ , https://zid.sa/ar/pricing/ | 2026-11-09 |
| Egyptian payment gateways | zid.eg shows these logos in its "شركاؤنا في مصر" section: **Paymob, Valu, Sympl** (plus Gameball). zid.eg also says "من الدفع الإلكتروني والتقسيط وكمان الدفع عند الاستلام". How deep these integrations go and what they cost is **Unverified**. The zid.eg/ar/solutions/payments page is the Saudi copy (Zid Pay, نفاذ, SAR) | https://zid.eg/ar/ , https://zid.eg/ar/solutions/payments/ | 2026-11-09 |
| Cash on delivery | Yes. COD is on the free plan. ZidShip offers "تحصيل سهل ومرن للكاش في حالة الدفع عند الاستلام لكل شركات الشحن" and a COD payments report | https://zid.sa/ar/pricing/ , https://zid.sa/ar/solutions/shipping/ | 2026-11-09 |
| Shipping integrations (KSA) | ZidShip: "35 شركة شحن جاهزة تخدمك في عقد واحد" (the pricing FAQ says "+30"). Named: SMSA, Aramex, DHL, Barq. Sample levels: "الآن" 25 SAR for the first 10 kg, "سريع" 21 SAR, "عادي" 25 SAR, heavy 35 SAR for 20 kg, Aramex GCC 34 SAR for the first 0.5 kg. Claims 95.1% delivery success. **J&T, Redbox, Torod: Unverified** | https://zid.sa/ar/solutions/shipping/ , https://zid.sa/ar/pricing/ | 2026-11-09 |
| Egyptian shipping | Logos in zid.eg "شركاؤنا في مصر": **Bosta, Aramex, FedEx, Sprint, Khazenly, Myler, Sideup, Loadbugs**. The zid.eg/ar/solutions/shipping page is byte-for-byte the Saudi copy ("تغطية كاملة لكل مناطق المملكة العربية السعودية"), so Egypt-specific shipping terms are **Unverified** | https://zid.eg/ar/ , https://zid.eg/ar/solutions/shipping/ | 2026-11-09 |
| Builder / themes | Theme store plus custom design requests, "Theme SDK", CSS customisation (paid plans), Arabic and English storefront, preview on a demo store before paying. zid.eg: "+50 ثيم احترافي قابل للتخصيص". Apps: "أكثر من 400 تطبيق" | https://zid.sa/ar/solutions/themes/ , https://zid.eg/ar/ , https://zid.sa/ar/pricing/ | 2026-11-09 |
| AI features | **Zid Voice (زد فويس)**: "وكيل صوتي ذكي" that phones abandoned-cart customers and can offer a discount. Status: "متاح الآن لاستعادة السلات المتروكة · إطلاق تجريبي محدود"; voice customer service "قادمة قريباً". **نبض زد (Zid Insights)**: blog of 28 Oct 2026, "اسأل متجرك واكتشف فرص النمو في بياناته". Whether it is AI or natural-language, and which plan includes it, is **Unverified** (the article body did not load). No AI store builder or AI product writer found | https://zid.sa/ar/solutions/zid-voice/ , https://zid.sa/ar/blog/zid-insights-store-analytics/ | 2026-11-09 |
| SEO | "أدوات تحسين محركات البحث": homepage SEO, product and category SEO fields, "تحسينات إضافية" | https://zid.sa/ar/solutions/marketing-tools/ | 2026-11-09 |
| Analytics | Reports (orders, shipping performance, COD), "مؤشر أداء الطلبات (Order Streaks)", Zid Insights (above). GA and pixel details **Unverified** | https://zid.sa/ar/solutions/shipping/ , https://zid.sa/ar/pricing/ | 2026-11-09 |
| Marketing tools | Loyalty program, coupons, free-shipping threshold, BOGO, bundles, affiliate program, SMS campaigns, SEO, paid "نمو التاجر" growth services (managed ads and retargeting), WhatsApp integration and "تسجيل الدخول عبر واتساب", ads linked with Snap and TikTok (zid.eg), sales channels Amazon, Trendyol and Jahez, the Mazeed marketplace ("5 مليون عميل"), Zid Voice for abandoned carts, financing (تمويل زد), POS (زد كاشير) | https://zid.sa/ar/solutions/marketing-tools/ , https://zid.sa/ar/pricing/ , https://zid.eg/ar/ | 2026-11-09 |
| Support | zid.eg: "فريق جاهز لمساعدتك على مدار الساعة وطوال أيام الأسبوع". "الدعم الفني عبر المحادثات" is a row in the plan comparison (which plans get it is **Unverified**). Account manager ("مدير علاقة لمتجرك", from the Zid-vs-Salla page). Site and dashboard in Arabic and English | https://zid.eg/ar/ , https://zid.sa/ar/pricing/ , https://zid.sa/ar/switchers/zid-x-salla/ | 2026-11-09 |
| Target markets | Footer "زد متاحة في": KSA, UAE, Kuwait, Oman, Bahrain, Syria, **Egypt (links to zid.eg)** | https://zid.sa/ar/pricing/ | 2026-11-09 |
| Can an Egyptian merchant sign up and sell? | **Yes, Zid targets Egypt (verified that it is marketed there); Egyptian signup requirements Unverified.** zid.eg: "انضم لآلاف التجار في مصر وأطلق متجرك الإلكتروني بسهولة" with EGP pricing. Its "Start" buttons go to `dashboard.zid.sa/ar-sa/register`. Saudi FAQ: "لا يشترط وجود سجل تجاري للمتجر إلا إن كنت ترغب بربط المتجر ببوابات الدفع". No Egyptian KYC or document list was found. Third-party (not official): Zid entered Egypt by acquiring and partnering with the Egyptian firm Zammit, which runs Zid Egypt operations (reported Nov 2025) | https://zid.eg/ar/ , https://zid.eg/ar/pricing/ , https://zid.sa/ar/pricing/ ; third-party: https://itweb.africa/article/zid-enters-egypt-through-zammit-acquisition/dgp45vaBzQR7X9l8 | 2026-11-09 |

### SEO intel (Zid)
- Home `https://zid.sa/ar/`: title "زد | أنشئ متجرك الإلكتروني بسهولة وابدأ البيع في 24 ساعة". No meta description was found in the static HTML. The page has **6 `<h1>` tags**. The first is "من القصص إلى الأرقام", and the hero line "المنصة الموثوقة والمتكاملة للتجارة الإلكترونية" is not an H1.
- Pricing `/ar/pricing/`: title "باقات زد أسعار الاشتراك في منصة زد للتجارة الإلكترونية | زد". Meta: "تعرّف على باقات وأسعار الاشتراك في منصة زد…". H1: "باقات تناسب احتياجكوتضمن نموّ تجارتك" (no space between words in the HTML). EN title "Zid | Pricing", with meta also "Zid | Pricing " (weak).
- Egypt home `https://zid.eg/ar/`: title "أنشئ متجرك الإلكتروني بسهولة مع زد | انضم لتجار مصر". Meta: "انضم مع زد لآلاف التجار في مصر وأطلق متجرك الإلكتروني بسهولة…". The only H1 is the pricing block heading "باقات تناسب احتياجكوتضمن نموّ تجارتك". The hero "زد معك في نمو تجارتك الإلكترونية" is not an H1. Copy mixes Egyptian dialect ("ليه تختار زد في مصر؟", "كل ده") with Saudi dialect.
- Egypt pricing `https://zid.eg/ar/pricing/`: title "باقات وأسعار زد مصر". Meta: "…باقات وأسعار بالجنيه المصري…".
- Solution pages: e-store, "بناء متجر إلكتروني حلول التجارة الإلكترونية المتكاملة | زد" (H1 "متجر إلكتروني ما يكلفك.. متجر إلكتروني يربّحك!"); payments, "حلول الدفع وسائل دفع إلكتروني سهلة وآمنة لمتجرك | زد"; shipping, "حلول الشحن من زد سهّل عمليات توصيل متجرك الإلكتروني | زد"; themes, "ثيمات متجر زد قوالب احترافية لتصميم متجر إلكتروني | زد"; marketing, "أدوات التسويق من زد حملات فعالة لزيادة مبيعاتك | زد"; Zid Voice, "زد فويس | استعادة السلات المتروكة بمكالمات ذكية".
- **Comparison / switcher pages (yes, Zid publishes them):** /ar/switchers/zid-x-salla/ (title "زد أو سلة – قارن واختر المنصة اللي تدعم نموك", H1 "المنصة الأفضل لتوسّع تجارتك", "4 مزايا في زد… ما تلقاها في ســلة" with a ✅/❌ table: marketplaces, account manager, "رسوم معاملات أقل", customisation, stability), plus zid-x-shopify, zid-x-opencart, zid-x-magento, zid-x-wordpress, and /en/shopify-vs-zid. All are in the main nav under "الانتقال إلى زد".
- Blog targeting "إنشاء متجر إلكتروني": "/ar/blog/zid-your-best-choice-for-create-your-e-store/", title "زد خيارك الأنسب لإنشاء متجر إلكتروني | مدونة زد", H1 "زد خيارك الأنسب لإنشاء متجر إلكتروني وبدء تجارتك المتكاملة". The blog is at zid.sa/ar/blog/ (blog.zid.sa redirects there).

### Advantages / disadvantages for an Egyptian small seller (Zid)
- **+** Zid markets to Egypt (zid.eg) with EGP prices. A free-forever plan with unlimited products and orders includes COD and bank transfer.
- **+** Zid shows logos for Egyptian partners: Bosta, Paymob, Valu and Sympl. Paid plans include free POS (and WhatsApp in Egypt). No sales commission on paid plans.
- **+** A strong feature set: 400+ apps, 50+ themes, loyalty, affiliates, SMS, Amazon/Trendyol channels, and an AI voice agent for abandoned carts (limited beta).
- **−** Paid plans are expensive in Egypt: Rise is EGP 1,128.60 a month (EGP 11,286 a year) and Growth EGP 3,408.60 a month. These are SAR prices converted.
- **−** Zid Pay (its own gateway, with published rates) works only in KSA and Kuwait. Egyptian gateway terms and fees are not published.
- **−** zid.eg payments and shipping pages are copies of the Saudi pages (Saudi coverage, SAR, نفاذ). No Egyptian KYC or document requirements are published. Whether the free plan pays a sales commission is not stated.
- **−** Much of the copy is in Saudi dialect. Signup goes through dashboard.zid.sa.

---

### Salla / Zid summary rows (from the part file)

| Competitor | Cheapest paid plan + currency | Free plan | Per-order / transaction fee | COD | Egypt payment gateways | Egypt shipping | AI features | Arabic admin | Egypt sellers allowed |
|---|---|---|---|---|---|---|---|---|---|
| **Salla** | Salla Plus SAR 990/yr (≈ SAR 99/mo derived; AED 990/yr in UAE). **Verified** (annual); monthly **Unverified** (derived) | Yes, Basic (unlimited products/orders). **Verified** | No platform per-order fee shown. Salla Payments rates not published (in-dashboard calculator). **Unverified** | Yes, incl. Basic. **Verified** | None found. **Unverified** (none on official pages) | None found. **Unverified** | Fraud-detection AI, prompt library, ChatGPT/Claude connect, SEO-GEO checker. No AI builder. **Verified** (no AI builder = none found) | Yes, Arabic/English RTL. **Verified** | No: Saudi CR required for foreigners; individual entity for Saudi citizens only; Egypt not in the supported-countries footer. **Verified** (signup country list **Unverified**) |
| **Zid** | Rise SAR 99/mo (SAR 990/yr); Egypt EGP 1,128.60/mo (EGP 11,286/yr). **Verified** | Yes, Starter "free forever" (unlimited products/orders). **Verified** | No commission on paid plans (**Verified**); free plan **Unverified**. Zid Pay (KSA/Kuwait only): mada 1% + 1 SAR, cards 2.2–2.4% + 0.75–1 SAR, excl. VAT. **Verified** | Yes, incl. free plan. **Verified** | Paymob, Valu, Sympl logos on zid.eg. **Verified** (logos only; terms **Unverified**) | Bosta, Aramex, FedEx, Sprint, Khazenly, Myler, Sideup logos on zid.eg. **Verified** (logos only; terms **Unverified**) | Zid Voice AI abandoned-cart calls (limited beta); Zid Insights ("ask your store", AI **Unverified**). **Verified** | Yes, Arabic/English. **Verified** | Yes: zid.eg markets to Egyptian merchants with EGP pricing. **Verified**; Egyptian document requirements **Unverified** |

---


Every fact below was checked on 2026-11-09 against the source URL in its row. Raw HTML is saved in `scratchpad/seo/raw/`. Unless a row says otherwise, prices are what the English page shows: USD with no geo-switch (YouCan from the `/en` locale; Lightfunnels from the default locale, plus its separate `/egpricing` page). "Unverified" means I could not confirm the fact from an official page, and the reason is given. Third-party sources are labelled.

---

## YouCan (youcan.shop)

| Field | Value | Source | Checked |
|---|---|---|---|
| Official site | youcan.shop. The site redirects to `/en`, and also has `/ar` and `/fr`. Hreflang has ar/en/fr, with x-default = en. | https://youcan.shop/sitemap.xml | 2026-11-09 |
| Company / origin | Moroccan. The FAQ cites Moroccan data law "Law N° 09.08". YouCan Pay is called "the Moroccan payment solution built by YouCan". | https://youcan.shop/en/faq | 2026-11-09 |
| Scale claim | "450K+ stores across 166 countries" (their own claim) | https://youcan.shop/en | 2026-11-09 |
| Pricing models | Two models that you can switch between at any time: **Subscription** or **Pay as you go**. | https://youcan.shop/en/pricing | 2026-11-09 |
| Subscription plans (USD) | Solopreneur **$29/mo**: sales up to $50K/mo, up to 3.5K orders/mo, 1 staff. Starter **$49/mo**: $100K, 7K orders, 3 staff. Entrepreneur **$89/mo**: $300K, 21K orders, 6 staff. Premium **$149/mo**: unlimited sales and orders, 19 staff, VIP priority support. **Unlimited $229/mo**: everything in Premium on up to 5 stores. | https://youcan.shop/en/pricing | 2026-11-09 |
| Annual billing | "Pay yearly – 2 months free": $290, $490, $890, $1,490 and $2,290 per year. | https://youcan.shop/en/pricing | 2026-11-09 |
| How plans are paid | Solopreneur to Premium are paid from the **store balance** (prepaid credit). Unlimited is billed to a **credit card**. A subscription is billed at the end of each month, 30 days after activation. | https://youcan.shop/en/pricing ; https://youcan.shop/en/faq | 2026-11-09 |
| Pay as you go (the "$5,000" claim) | No monthly fee. The fee is a **% of sales**. COD sales: **0.5%** on the first $5,000, then **0.25%** above $5,000. Online payments: **1%** on the first $5,000, then **0.5%** above. "Nothing is billed until you reach $5,000 in sales." | https://youcan.shop/en/pricing (FAQ "How are Pay as you go fees calculated?") | 2026-11-09 |
| What "pay nothing until $5,000" really means | Billing is **deferred, not waived**. The page's own estimator shows "On $5,000 at 0.5% → $25.00", so the first $5,000 is still charged (0.5% COD or 1% online) once you cross it. A seller who never reaches $5,000 in sales pays $0. The page also says that above about $15,000/month a subscription usually costs less. | https://youcan.shop/en/pricing | 2026-11-09 |
| Subscription transaction fees | $0 COD fees and $0 transaction fees on all subscription plans. Payment providers such as Stripe charge their own fees. Domains and paid apps cost extra. | https://youcan.shop/en/pricing | 2026-11-09 |
| Activation deposit | You must add **$2** of credit to activate the store ("not a charge", it goes toward future invoices). It can be paid by local card, international card, or CashPlus (Morocco). | https://youcan.shop/en/pricing ; https://youcan.shop/en/help/store-activation | 2026-11-09 |
| Free plan / trial | Signing up is free, and Pay as you go has no monthly fee. There is no separate time-limited trial. "Start for free". | https://youcan.shop/en/pricing | 2026-11-09 |
| Product limits | Unlimited products on every plan. Order and sales caps depend on the plan (see above). | https://youcan.shop/en/pricing ; https://youcan.shop/en/faq | 2026-11-09 |
| Stores | 1 store per plan. Unlimited covers up to 5. Multi-store management from one login. | https://youcan.shop/en/pricing ; https://youcan.shop/en/features | 2026-11-09 |
| Domains | Up to 6 custom domains per store, with free hosting and SSL. You can buy a domain from YouCan. | https://youcan.shop/en/faq | 2026-11-09 |
| Themes | **9 named free themes** on the themes page: Kinder, Bella, Camisa, Mono, Chameleon, Origins, Aura, Harmony, Meraki. There is also "Build your own" (YouCan CLI with Liquid, starting from the open-source Origins theme). All themes are free and come in Arabic, French and English with RTL for Arabic. You can edit the Liquid, HTML and CSS ("Full code access"). | https://youcan.shop/en/themes | 2026-11-09 |
| Builder | Page builder, page templates, prebuilt sections and a visual editor on every plan. Landing pages: "One product. One page. Ready for ads." Express checkout means the order form sits on the product page. | https://youcan.shop/en/pricing ; https://youcan.shop/en/pages ; https://youcan.shop/en/checkout | 2026-11-09 |
| Store languages | 11 store languages, and you can edit any word shoppers see. | https://youcan.shop/en/international | 2026-11-09 |
| AI features | **Mochi**, an AI store assistant, on every plan. It takes text or voice requests (up to 1 minute) in Arabic, Moroccan Darija, French or English. It manages products and inventory, creates product images and landing pages, tracks orders and customers, creates coupons and answers questions about store data. It always shows a plan and waits for "Start" approval (the plan expires after 30 minutes), and changes can be undone for 24 hours. **AI image generation** is on every plan. An **MCP server** connects ChatGPT, Claude or any MCP client to products, orders, customers, upsells, pages, reviews, coupons and languages. | https://youcan.shop/en/help/ai-mouchi ; https://youcan.shop/en/pricing ; https://youcan.shop/en/mcp | 2026-11-09 |
| AI credit limits | Unverified. The pricing page lists Mochi and AI images as "Included" but shows no quota. | https://youcan.shop/en/pricing | 2026-11-09 |
| Payment integrations | COD, **YouCan Pay** (card or CashPlus, Moroccan), **Stripe** (more than one account possible), **PayPal**, and custom payments such as bank transfer with your own instructions. | https://youcan.shop/en/checkout ; https://youcan.shop/en/faq ; https://youcan.shop/en/help/youcanpay ; https://youcan.shop/en/help/stripe | 2026-11-09 |
| Egyptian gateways (Paymob / Fawry / Kashier / InstaPay) | **None found** on the official pages I read. Only the "custom payment" (manual instructions) option could cover InstaPay or a bank transfer. CMI, Tabby and Tamara were not found either. | https://youcan.shop/en/checkout ; https://youcan.shop/en/help/custom-payment | 2026-11-09 |
| Stripe for Egypt | Stripe's global page lists the UAE but not Egypt or Morocco (grep of the page). The YouCan Stripe help page says Stripe needs a company. | https://stripe.com/global ; https://youcan.shop/en/help/stripe | 2026-11-09 |
| Shipping | Shipping zones by country, charged by price or by weight, or free, plus a rest-of-world zone. "Does YouCan take care of storing and shipping? Not directly … In Morocco, YouCan Ship lets you pick from local delivery companies." A COD Network app (fulfilment, confirmation and delivery across MENA for a commission) and a Glovo help page are also listed. | https://youcan.shop/en/faq ; https://youcan.shop/en/help/shipping-zones ; https://youcan.shop/en/help/cod-network ; sitemap (`/help/youcan-glovo`) | 2026-11-09 |
| Egyptian carriers (Bosta / Aramex / J&T / Mylerz) | **None found** on the official pages. The sitemap has no Egypt-related URL. | https://youcan.shop/sitemap.xml | 2026-11-09 |
| Cash on delivery | Built in, with $0 COD fee on subscriptions (0.5% then 0.25% on Pay as you go). COD orders are managed "from leads to order confirmation and shipping" and can sync with Google Sheets. Order confirmation by phone is available through the "COD Manager" app in the app marketplace. Fraud detection flags suspicious orders. Ad pixels are "made for cash on delivery", meaning they learn from orders that were actually delivered. | https://youcan.shop/en/faq ; https://youcan.shop/en/features ; https://youcan.shop/en/analytics | 2026-11-09 |
| SEO | The FAQ says "SEO tools" are on every plan. Detailed SEO features (meta fields, sitemap, schema) are **Unverified**: no SEO help page was read, and the help center later returned Cloudflare / 429. | https://youcan.shop/en/faq | 2026-11-09 |
| Analytics | Sales reports, traffic insights and product insights on all plans. Best sellers, orders by day and hour, sales by country, average order value, visits by device, checkout drop-off, best landing pages, and fake-order detection. | https://youcan.shop/en/analytics ; https://youcan.shop/en/pricing | 2026-11-09 |
| Marketing tools | Pixels for Meta, TikTok, Snapchat and Google (multiple allowed). Meta and TikTok server-side events. One-click upsells. Coupons and quantity offers. Bundles. Abandoned-checkout emails (up to 4 reminders). Product reviews. Pixel help pages for Pinterest and Twitter. | https://youcan.shop/en/checkout ; https://youcan.shop/en/features ; https://youcan.shop/en/help/abandoned-carts ; sitemap | 2026-11-09 |
| WhatsApp | The word "WhatsApp" appears on the home page only as a demo element. No WhatsApp feature is documented on the pages I read, so this is **Unverified**. | https://youcan.shop/en | 2026-11-09 |
| Support | Ticket from the seller area ("Support" section). The help article claims "a support team available 24/7". There are also a help center, YouTube tutorials and an email contact form. Premium and Unlimited get "VIP Priority" support. | https://youcan.shop/en/help/contact-support ; https://youcan.shop/en/pricing | 2026-11-09 |
| Languages (site / app / admin) | The marketing site and help center are in ar, en and fr. The iOS app lists English, Arabic and French (from the App Store listing via search). The web admin's own UI language is **Unverified**. | sitemap ; https://apps.apple.com/us/app/id1485859147 | 2026-11-09 |
| Target markets | Morocco first (YouCan Pay, CashPlus, YouCan Ship, MAD demos), then Saudi Arabia, the UAE, France and the US (home-page copy). An "Order from Cairo 1,450 EGP" demo shows multicurrency. Region and city lists cover 228 countries. | https://youcan.shop/en ; https://youcan.shop/en/international | 2026-11-09 |
| Egyptian sellers: sign up / sell to Egypt / get paid | **Sign up:** likely yes. Activation accepts an "International card". No country restriction was found, but an Egyptian sign-up was not tested. **Sell to Egypt:** yes. Egypt and EGP appear in the international page's demo, and checkout country lists cover 228 countries. **Get paid:** COD cash stays with the seller and courier. YouCan Pay is Moroccan and Stripe does not support Egypt, so online card payouts for an Egyptian seller are **Unverified / likely unavailable**, apart from PayPal and manual transfer. Third party: StoreLeads (an estimate) shows about 54 live YouCan stores in Egypt. | https://youcan.shop/en/help/store-activation ; https://youcan.shop/en/international ; https://storeleads.app/reports/youcan/EG/top-stores (third party) | 2026-11-09 |

### SEO intel (YouCan)
- **Home (en)** `<title>`: "Create a Store, Scale Your Business - YouCan". Meta description: "Open your store in an afternoon. Sell with cash on delivery or online payments, and pay nothing until you’ve sold $5,000." H1: "Take what you sell to people everywhere" (animated words).
- **Home (ar)** `<title>`: "أنشئ متجرك ووسّع تجارتك - YouCan". Meta description: "افتح متجرك في ظهيرة واحدة. بِع بالدفع عند الاستلام أو بالدفع الإلكتروني، ولا تدفع شيئاً حتى تبيع بقيمة 5,000 دولار." H1: "ما تبيعه اليوم يمكن أن يصل إلى العالم".
- **Home (fr)** `<title>`: "Créez votre boutique, développez votre business - YouCan". Meta description: "Ouvrez votre boutique en un après-midi… ne payez rien avant d’avoir vendu 5 000 $."
- **Pricing (en)**: title "Pricing - YouCan". Meta description: "Two YouCan pricing models: a monthly subscription or a commission on sales…". H1: "Pick your pace."
- **Pricing (ar)**: title "الأسعار - YouCan". Meta description: "نموذجان للتسعير في YouCan: اشتراك شهري أو عمولة على المبيعات…". H1: "اختر الوتيرة التي تناسبك."
- **Features**: title "Features - YouCan". H1: "Everything you need to build, sell and grow." The Arabic version's title is "المميزات - YouCan".
- **Other landing pages** (title / H1):
  - Themes: "Themes - YouCan" / "A theme for every kind of store"
  - Checkout: "Checkout - YouCan" / "Fewer steps. More orders."
  - International: "Sell internationally - YouCan" / "Sell beyond your borders"
  - Analytics: "Analytics - YouCan" / "See what sells, where and when"
  - Landing pages: "Landing pages - YouCan" / "One product. One page. Ready for ads."
  - MCP: "YouCan MCP: run your store from ChatGPT and Claude - YouCan" / "Your YouCan store, one chat away."
- **Alternative / vs / بديل / مقارنة pages**: **none**. I grepped all 608 sitemap URLs for shopify, vs, alternative, compar and egypt and found no match.
- **Blog**: the sitemap has 83 Arabic blog URLs, among them `/ar/blog/posts/start-e-commerce`, `/ecommerce`, `/e-commerce-youcanshop`, `/ecommerce-definition`, `/start-business`, `/getting-started-dropshipping`, `kyf-tngh-fy-altgar-alalktrony-10-khtoat-lzyad-mbyaaat-mtgrk-alalktrony` (= "كيف تنجح في التجارة الإلكترونية: 10 خطوات لزيادة مبيعات متجرك"), plus market posts `ecom-saudi`, `uae-market`, `golf-ecommerce` and `aswaq-almaghrib`. Whether any post targets "انشاء متجر الكتروني" is **Unverified**: blog pages returned a Cloudflare challenge (curl) and HTTP 429 (WebFetch). No blog post covers the Egyptian market.
- They run GA4, Google Ads, Meta and TikTok pixels on the marketing site.

### Advantages / disadvantages for an Egyptian small seller (YouCan)
- **+** $0 monthly cost to start (Pay as you go), and nothing billed until $5,000 in sales. Only a $2 refundable-as-credit activation.
- **+** COD-first design: express checkout on the product page, a phone-confirmation app, Google Sheets sync, fake-order flags, and delivery-aware pixels.
- **+** Arabic everywhere (RTL themes, Arabic site and help, Arabic and Darija AI assistant). Strong AI (Mochi, AI images, MCP) on every plan.
- **+** Unlimited products, 9 free themes plus full code access, landing pages, upsells and abandoned-cart emails on every plan.
- **−** Not a free tier in the long run: once you pass $5,000 in sales the deferred 0.5% (COD) or 1% (online) is billed retroactively.
- **−** Pricing and invoices are in USD, paid from a prepaid balance. That means card or FX friction for Egyptians. Paying by CashPlus is Morocco-only.
- **−** No Egyptian payment gateway (Paymob, Fawry, Kashier, InstaPay) and no Egyptian courier (Bosta, Aramex, J&T, Mylerz) was found. YouCan Pay and YouCan Ship are Moroccan, and Stripe isn't available to Egyptian businesses.
- **−** The marketing and demo content targets Morocco and the Gulf (MAD prices, Casablanca). There is no Egypt-specific page or blog.
- **−** Subscription plans start at $29/mo (about EGP 1,560 at 53.9), which is high for a very small seller.

---

## Lightfunnels (lightfunnels.com)

| Field | Value | Source | Checked |
|---|---|---|---|
| Official site | lightfunnels.com (redirects to www). The sitemap lists 349 URLs with 21 hreflang locales, including ar. App at app.lightfunnels.com, help center at docs.lightfunnels.com, developer site at developer.lightfunnels.com. | https://www.lightfunnels.com/sitemap.xml ; https://www.lightfunnels.com | 2026-11-09 |
| Company | "Lightfunnels is a brand of Lightfunnels Ltd. Registered in England and Wales, No: 12322614". The changelog says it launched in November 2021. | https://www.lightfunnels.com/pricing | 2026-11-09 |
| Plans (USD, monthly) | **Newbie $9.99/mo** (1 store and 1 domain free; extra store $5, extra domain $3). **Standard $49.99/mo** (3 stores and 3 domains). **COD $99.99/mo** (3 stores and 3 domains). All plans: unlimited products, funnels, visitors and customers, up to 14 members, 10 GB per file. Leads: 1k/month on Newbie, 5k/month on Standard and COD. | https://www.lightfunnels.com/pricing | 2026-11-09 |
| Egypt pricing (EGP) | A dedicated page, "Pricing in Egypt": **Newbie EGP 519.99/mo**, **Standard EGP 2,599.99/mo**, **COD EGP 5,199.99/mo**. Extra store EGP 260. Extra domain EGP 156 in the compare table (the plan cards say "EGP260 on extra"). Fee percentages are the same as on the USD page. Meta description: "Special Lightfunnels pricing for merchants in Egypt". | https://www.lightfunnels.com/egpricing | 2026-11-09 |
| Annual billing | **Not shown** on the pricing pages (no "annual" or "yearly" text in the HTML). Annual billing is Unverified. | https://www.lightfunnels.com/pricing | 2026-11-09 |
| Transaction fees | Newbie: **1.5%** transaction fee and **0.20%** COD fee. Standard: **0.50%** and **0.10%**. COD plan: **0.50%** transaction fee and **0% COD fee**. Fees apply during the trial on Newbie and Standard, and are billed at the end of the trial. | https://www.lightfunnels.com/pricing (table + FAQ) | 2026-11-09 |
| "Fee-Free" plan claim | The /cod landing page says "Why Our $99 Zero Sales Fee Plan?" and "Retain 100% of your earnings from Cash on Delivery orders". It is marked "Limited Time Offer". The pricing table shows the COD plan keeps a 0.50% fee on online (non-COD) transactions, so "zero fee" covers COD orders only. | https://www.lightfunnels.com/cod ; https://www.lightfunnels.com/pricing | 2026-11-09 |
| Free plan / trial | **No free plan.** A **30-day free trial** with no credit card required. To share funnels publicly during the trial you must add a payment method. When the trial ends you are switched to the paid plan automatically. | https://www.lightfunnels.com/pricing (FAQ) | 2026-11-09 |
| Product / order limits | Unlimited products, funnels, visitors and customers. Leads are capped at 1k or 5k per month. No order cap is shown. | https://www.lightfunnels.com/pricing | 2026-11-09 |
| Builder / templates | Funnel builder (product, checkout, upsell, downsell and article pages; A/B split tests; funnel sharing; page recording), a store builder (collections, add to cart), and a page builder (pre-made sections, smart sections, data binding, responsiveness, language translation). **97 template URLs** are in the sitemap (`/templates/ts_…`); the templates page itself renders client-side. The home page claims themes come in "over 75 different languages". | https://www.lightfunnels.com/pricing ; https://www.lightfunnels.com ; https://www.lightfunnels.com/sitemap.xml ; https://docs.lightfunnels.com/funnels/funnel-pages/ | 2026-11-09 |
| AI features | "Free AI" on every plan. The **AI Funnel Builder** builds funnel pages from product info, in a chosen language and with a checkout-on-product-page option for COD; it also has niche templates (course, leads, service, membership, ebook). **Product CMS AI** writes descriptions, features, "AI-Generated Reviews" and FAQs, "without restrictions" (fair use). A separate page, "Lightfunnels / AI Funnel Generation", is on lightfunnels.co. | https://www.lightfunnels.com/pricing ; https://docs.lightfunnels.com/funnels/ai-funnel-builder/ ; https://docs.lightfunnels.com/products/ai-implementaiton/ ; https://www.lightfunnels.co/ai-generation/ | 2026-11-09 |
| Payment integrations | The help center lists 2Checkout, Airwallex, ArabiaPay, Authorize.net, Cardcom, COD (built in), Checkout.com, CinetPay, **CMI**, **Fawaterk**, iyzico, **Kashier**, Mercado Pago, Mollie, PayPal, PayTR, Payzone, Razorpay, Sipay, Square, Stripe, Sumit, **Taager**, **Tabby**, **Tamara**, Tap, and **YouCan (Pay)**. | https://docs.lightfunnels.com/sitemap-0.xml | 2026-11-09 |
| Egyptian gateways | **Kashier**: cards, bank installments and wallets; payment page in Arabic or English. **Fawaterk** (its site title: "Digital Payment Gateway … in Egypt"). **Taager** (orders are created on Taager and the customer is redirected to Taager's payment page). **Paymob, Fawry and InstaPay are not listed** in the help center. | https://docs.lightfunnels.com/payment-gateways/kashier/ ; https://docs.lightfunnels.com/payment-gateways/fawaterk/ ; https://docs.lightfunnels.com/payment-gateways/taager/ ; https://kashier.io ; https://fawaterk.com | 2026-11-09 |
| Shipping | Shipping groups and zones by country, rates, free shipping over an amount, a rest-of-world zone, and "advanced shipping regions" by city or area (CSV upload). Fulfilment means marking orders fulfilled by hand with a tracking number and link, or bulk export, edit and sync as CSV. | https://docs.lightfunnels.com/settings/shipping/ ; https://docs.lightfunnels.com/orders/order-fulfillment/ | 2026-11-09 |
| Carrier integrations (Bosta / Aramex / J&T / Mylerz) | **None found** in the 95 help-center URLs. Apps found: AliExpress, ShineOn, Shopify integration, Google Sheets ("COD Sheets"), Mailchimp, Google Shopping feeds and Clarity. The app store page loads its list client-side, so the full app list is Unverified. | https://docs.lightfunnels.com/sitemap-0.xml ; https://www.lightfunnels.com/apps | 2026-11-09 |
| Cash on delivery | Built in, with no account to connect. COD forms "out of the box". COD fee by plan: 0.20%, 0.10% or 0%. Anti-fake-order "COD Security Layers": silent captcha, a minimum delay between orders from the same IP, maximum items per order, IP blocking and country blocking. Google Sheets "COD Sheets". A built-in **call-center / phone-confirmation** feature is **Unverified**: not seen in the docs list. | https://docs.lightfunnels.com/payment-gateways/cash-on-delivery/ ; https://www.lightfunnels.com/cod ; https://docs.lightfunnels.com/settings/security-documentation/ | 2026-11-09 |
| SEO | **Unverified.** No SEO article is in the help-center sitemap, and a web search found no official Lightfunnels SEO docs. Google Shopping product feeds exist. | https://docs.lightfunnels.com/sitemap-0.xml ; https://docs.lightfunnels.com/apps-and-integrations/google-shopping-product-feeds/ | 2026-11-09 |
| Analytics | Advanced reports, real-time reports, a live view, sales attribution and dashboard metrics. | https://www.lightfunnels.com/pricing ; https://docs.lightfunnels.com/analytics/sales-attribution/ | 2026-11-09 |
| Marketing tools | Conversion APIs for Facebook, TikTok, Snapchat and Pinterest, plus Google Ads and "OpenAI conversion API". Multiple Facebook pixels. One-click upsells and downsells, order bumps, price bundles, discounts and A/B tests. Abandoned checkouts: listed after 15 minutes with a copyable recovery link; automatic emails need the LightRecover app. Order email updates. Mailchimp. **WhatsApp**: not found on any page or doc I fetched (Unverified). | https://docs.lightfunnels.com/sitemap-0.xml ; https://docs.lightfunnels.com/orders/abandoned-checkouts/ ; https://www.lightfunnels.com | 2026-11-09 |
| Support | The pricing FAQ says "We offer live chat support" and email at support@lightfunnels.com ("within a few hours"). The /cod page says "Dedicated 24/7 Support". The help-center contact page lists the Facebook group and email. There is also an LF Academy and community. | https://www.lightfunnels.com/pricing ; https://www.lightfunnels.com/cod ; https://docs.lightfunnels.com/contact/ | 2026-11-09 |
| Languages | The marketing site is in 21 locales, including Arabic (`/ar`, with an Arabic H1 and meta). Storefront themes claim "75 languages". The help center appears to be English only. Whether the admin UI is in Arabic is **Unverified** (search found nothing official). | https://www.lightfunnels.com/ar ; https://www.lightfunnels.com | 2026-11-09 |
| Target markets | Global COD and dropshipping sellers. MENA gateways cover Egypt (Kashier, Fawaterk, Taager), Morocco (CMI, YouCan Pay, Payzone), the Gulf (Tabby, Tamara, Tap) and Turkey (iyzico, PayTR), alongside a dedicated Egypt EGP pricing page. | https://www.lightfunnels.com/egpricing ; https://docs.lightfunnels.com/sitemap-0.xml | 2026-11-09 |
| Egyptian sellers: sign up / sell to Egypt / get paid | **Sign up:** yes, implied by the Egypt pricing page for "merchants in Egypt". **Sell to Egypt:** yes, with shipping zones by country and city. **Get paid:** Lightfunnels does not collect money itself. Sellers connect their own gateway (Kashier, Fawaterk, Taager), so payouts go from that gateway to the seller, and COD cash goes to the seller or courier. | https://www.lightfunnels.com/egpricing ; https://docs.lightfunnels.com/payment-gateways/kashier/ | 2026-11-09 |

### SEO intel (Lightfunnels)
- **Home (en)** `<title>`: "Lightfunnels | A better sales funnel platform". Meta description: "Lightfunnels is the e-commerce platform built for conversion. Create high-converting sales funnels and online stores with a drag-and-drop builder, one-click upsells and built-in analytics." H1: "The All-in-One solution for your E-Commerce business".
- **Home (ar)** `<title>`: "Lightfunnels | منصة Funnels مبيعات أفضل". The meta description is an Arabic translation of the English one. H1: "مع Lightfunnels، ستجد كل ما تحتاجه لإدارة متجرك الإلكتروني بنجاح في مكان واحد!"
- **Home (fr)** `<title>`: "Lightfunnels | Une meilleure plateforme de funnels de vente". H1: "La solution tout-en-un pour votre entreprise de commerce électronique".
- **Pricing**: title "Pricing | Lightfunnels". Meta description: "Simple, transparent pricing … start from $9.99/month with no hidden fees." H1: "Simple, fair pricing". The Arabic version is titled "الأسعار | Lightfunnels" with H1 "تسعير بسيط وعادل".
- **Egypt pricing** (`/egpricing`, also `/ar/egpricing`): title "Pricing in Egypt | Lightfunnels". Meta description: "Special Lightfunnels pricing for merchants in Egypt. Build high-converting sales funnels and online stores with plans made for the Egyptian market." The Arabic URL keeps the English title and meta (not localized). It is in the sitemap but not linked from the home-page nav.
- **COD**: title "Cash on Delivery E-commerce Platform | Lightfunnels". H1: "Lightfunnels' Fee-Free E-commerce Revolution!"
- **App store**: title "App Store | Lightfunnels". H1: "Boost your performance with powerful apps".
- The `/features` and `/ai` paths return 404. The home H2s include "Cash on delivery.", "High converting Dropshipping Stores." and "Sell digital goods."
- **Alternative / vs pages**: **none** among the 349 sitemap URLs. "Shopify vs Lightfunnels" pages exist only on third-party sites (Capterra, GetApp, Software Advice). The /cod page carries a testimonial titled "I'm never going back to Shopify".
- **Blog / "انشاء متجر الكتروني"**: no blog in the lightfunnels.com sitemap, so there is **no Arabic content targeting "انشاء متجر الكتروني"**. Their content lives in the help center (English) and LF Academy (lightfunnels.co/academy, not crawled).
- Structured data: Organization plus a SoftwareApplication with an AggregateOffer of USD 9.99–99.99 (3 offers), and a FAQPage on pricing.

### Advantages / disadvantages for an Egyptian small seller (Lightfunnels)
- **+** It is the only one of the two with **Egyptian gateways** (Kashier with wallets and installments, Fawaterk, Taager) and an **EGP price list** for Egypt.
- **+** The cheapest plan is low (EGP 519.99/mo, or $9.99). It has unlimited products and funnels, strong COD funnel tools (one-click upsell and downsell, order bumps, bundles, A/B tests) and anti-fake-order controls.
- **+** Free, uncapped AI copy (descriptions, FAQs, reviews) and an AI funnel builder. A 30-day trial with no card.
- **−** No free plan. Percentage fees on the cheaper plans (1.5% online and 0.20% COD on Newbie). "Zero fee" COD needs the EGP 5,199.99/mo ($99.99) plan.
- **−** No Egyptian courier integration (fulfilment is manual or CSV). No WhatsApp or phone-confirmation tooling was found in the docs.
- **−** The help center is English only, and Arabic admin UI is unverified. Some Arabic marketing pages, such as /ar/egpricing, aren't localized. Support is live chat, email and a Facebook group, with no Arabic support stated.
- **−** It is funnel-first, and SEO tooling is not documented, so it is weaker for organic or marketplace-style stores.
- **−** It markets "AI-Generated Reviews", which creates a trust and compliance risk for sellers.

---

### YouCan / Lightfunnels summary lines

- **YouCan**: cheapest paid plan **$29/mo USD**, or $290/yr (Verified). Free plan: **Pay as you go, $0/mo, nothing billed until $5,000 in sales, then billed for that $5,000 too** (Verified). Fee: **subscriptions 0%; Pay as you go 0.5%→0.25% COD and 1%→0.5% online** (Verified). COD: **yes, built in, plus a phone-confirmation app** (Verified). Egypt gateways: **none** (Verified absent on the official pages read). Egypt shipping: **none; YouCan Ship is Morocco-only** (Verified). AI: **Mochi assistant, AI images and MCP on all plans** (Verified). Arabic admin: **app in AR; web admin UI Unverified**. Egypt sellers allowed: **sign-up and selling to Egypt likely; online payouts Unverified/limited**.
- **Lightfunnels**: cheapest paid plan **$9.99/mo USD, or EGP 519.99/mo on /egpricing** (Verified). Free plan: **none; 30-day trial with no card** (Verified). Fee: **1.5% / 0.20% COD (Newbie), 0.5% / 0.10% (Standard), 0.5% / 0% COD (COD plan)** (Verified). COD: **yes, built in, with anti-fraud layers** (Verified). Egypt gateways: **Kashier, Fawaterk, Taager; no Paymob, Fawry or InstaPay** (Verified). Egypt shipping: **no carrier integration; manual or CSV fulfilment** (Verified absent in the docs list). AI: **free AI copy and an AI funnel builder** (Verified). Arabic admin: **Unverified (marketing site in AR)**. Egypt sellers allowed: **yes, an Egypt pricing page exists** (Verified).

---


Checked 2026-11-09. Raw HTML and JSON saved under `...\scratchpad\seo\raw\`. All prices were seen in EGP unless noted. "Vendor" means the claim comes from the company's own site or blog. "Third party" means a competitor's article; treat those as lower confidence.

### Name resolution (what each name actually is)

- **Qumra (قُمرة)**: official site **https://qumra.cloud** (Arabic default, English at /en). Not to be confused with qumra.io (an unrelated screen recorder: "Qumra — Screen Recorder for Async Collaboration"), qumra.net (redirects to dohafilm.com, the Doha Film Institute "Qumra" event), or qumra.com (empty 114-byte page). qumra.app did not resolve.
- **Shanta (شنطة)**: official site **https://shantaweb.com** (`<title>منصة شنطة للتجارة الإلكترونية`). Social handle `shantaApp` (Facebook, Instagram, X, YouTube, Telegram). It is not shanta.app (HTTP 401), not shantaapp.com (did not resolve), not shanta.store (an unrelated "SHANTA" brand shop running on Shopify), and not shanta.com (parked domain for sale on Sedo). I found the domain through HalaOrders' article linking `https://shantaweb.com/ar`. A web search for "شنطة منصة متاجر" returned nothing useful.
- **HalaOrders (هلا أوردرز)**: official site **https://halaorders.com**. Not to be confused with halaorder.com (singular; "هلا أوردر | خلّ منيو مطعمك يشتغل معك", a restaurant-menu product), "Orders اوردرز" (a Yemeni app on the App Store), or "Halal Orders" and "Hala" POS apps.

---

## Qumra

| Field | Value | Source | Checked |
|---|---|---|---|
| Official site | https://qumra.cloud (AR) / https://qumra.cloud/en. Title: "قُمرة \| منصة التجارة الإلكترونية المتكاملة لإنشاء متجرك الإلكتروني". The WhatsApp number is Egyptian (+20 120 470 1692), and the site states Egyptian legal context (no commercial registration needed). | https://qumra.cloud | 2026-11-09 |
| Plans and prices | The page loads its prices from a public GraphQL query (`findAllPlans` at api.qumra.cloud/graphql) and shows nothing in static HTML. Plan currency: **EGP (ج.م)**, priced monthly, with quarterly and yearly discounts. **Starter (البداية): 199 EGP/month**, 7.5% off quarterly, 12.5% off yearly. **Growth (النمو): 699 EGP/month** (marked "recommended"), 10% off quarterly, 15% off yearly. **Business (الأعمال): 1,499 EGP/month**, 10% off quarterly, 15% off yearly. Qumra's own blog repeats 199 / 699 / 1,499. A HalaOrders article says Qumra's blog once said "from 450 EGP/month", which is now outdated. | API response saved as raw/qumra-plans-ar.json (the query the /pricing page runs); https://qumra.cloud/blog/قمرة-ولا-شوبيفاي | 2026-11-09 |
| Transaction fees | The pricing meta description says "بدون عمولة على المبيعات" (no commission on sales). The plan `feeType` is "fixed". Payment-gateway fees are unverified (not stated). The 14-day refund window applies to unused **balance** ("رصيد"), which suggests a wallet or top-up model for some services; details unverified. | qumra.cloud JS bundle, meta.pricing; help center | 2026-11-09 |
| Free plan / trial | **No free plan** exists in the plan list (all three have `isPaid: true`). The site promises "تجربة مجانية بدون قيود" (a free trial with no limits) but **does not state its length** (unverified). | qumra.cloud home (storeDashboard cards) | 2026-11-09 |
| Limits | Starter's promoted features say "منتجات غير محدودة، طلبات غير محدودة" and "مشرف واحد" (one admin). **However, the API's `limits.productCount` for Starter is 10** (adminCount 0). This contradicts the promoted features, so the real Starter product limit is **unverified**. Growth: 5 admins (promoted); API productCount 9999. Business: unlimited admins. orderCount is null on all plans. | API JSON | 2026-11-09 |
| Builder / templates | Theme store ("متجر الثيمات"). Themes are customizable (colours, fonts, sections). Landing pages ("صفحات الهبوط") use a ready design, CTA buttons and a direct link to checkout. "تخصيص صفحات المتجر" is listed on Starter. The site gives **no theme count**; the home page shows one featured theme (rating 5.0 from 3 reviews, "+85 downloads"). | qumra.cloud home; API promotedFeatures | 2026-11-09 |
| AI | "شهاب · مساعدك الذكي الشخصي" (Shehab assistant) comes **from Growth**. Business has "شهاب AI بلا حدود" (unlimited). The help center says AI can help write descriptions and marketing ideas "if the feature is available on your account". | API promotedFeatures; help center (JS bundle) | 2026-11-09 |
| Payments | Partner logos: **Paymob, PayTabs, Stripe, PayPal**. Qumra's blog says it supports e-wallets and InstaPay *through* Paymob and PayTabs. Fawry, Kashier, valU, Tabby, Tamara and Vodafone Cash were not mentioned (unverified). | qumra.cloud home partner images; Qumra blog (vs Shopify) | 2026-11-09 |
| Shipping | Partner logos: **Bosta, Mylerz, Aramex**. The blog says orders go to the carrier from the dashboard. | qumra.cloud home; Qumra blog | 2026-11-09 |
| COD | Qumra's own blog says COD can be enabled. The landing/home page does not mention it. Verified only from the vendor blog. | Qumra blog (vs Shopify) | 2026-11-09 |
| SEO | Unverified: no SEO feature is listed on the home or pricing pages. They publish an SEO keywords blog post. | qumra.cloud, sitemap | 2026-11-09 |
| Analytics | "تقارير ذكية لمتابعة المبيعات" (smart sales reports). Per the API, basicStats and advancedStats are true on all plans. | home; API | 2026-11-09 |
| Marketing | Starter lists offers and discount coupons ("العروض وكوبونات خصم") and **abandoned carts ("السلات المتروكة")**. The app store includes plugins. WhatsApp marketing ("تسويق عبر واتساب") comes from Growth (`whatsapp: true` only on Growth and Business). Pixels unverified (not listed). | API promotedFeatures/features | 2026-11-09 |
| Other | **POS** ("نقاط البيع") with an Android app comes from Growth. Custom domain also **from Growth** (Starter `createDomain: false`). Removing the "قُمرة" branding is **Business only**. The Play app "Qumra \| أنشئ متجرك وابدأ البيع" has 10K+ downloads. | API; Google Play com.qumra.cloud | 2026-11-09 |
| Support | 24/7 live support is claimed. Channels: WhatsApp chat, info@qumra.cloud, and a help center. Growth adds 24h WhatsApp and phone; Business adds dedicated 24/7 phone and a personal customer-success manager. Arabic first, with an English site. | home; API | 2026-11-09 |
| Markets / Egypt sign-up | Egypt-focused: plans in EGP, Egyptian phone number, blog "للتاجر المصري". Business has "إدارة الأسواق · بِع في أكثر من دولة" (sell in more than one country). Egyptian sellers can sign up: **Verified** (help center: individuals need no commercial registration or tax card). | help center; API | 2026-11-09 |
| Social proof claims | "+5000 متجر", rating 4.9 (vendor claim, not checked). | home | 2026-11-09 |

**SEO intel (Qumra)**
- Home `<title>`: "قُمرة | منصة التجارة الإلكترونية المتكاملة لإنشاء متجرك الإلكتروني". EN: "Qumra | The all-in-one e-commerce platform to build your online store".
- Meta description: "أنشئ متجرك الإلكتروني في دقائق مع قُمرة، وأدر المنتجات والطلبات والشحن والمدفوعات من لوحة تحكم واحدة سهلة وذكية، مع ثيمات احترافية ونظام نقاط بيع متكامل."
- H1: "كل أدوات تجارتك الإلكترونية في منصة واحدة".
- Meta keywords (in the JS bundle): قمرة، متجر إلكتروني، إنشاء متجر إلكتروني، منصة تجارة إلكترونية، التجارة الإلكترونية، نقاط البيع، لوحة تحكم المتجر، صفحات هبوط. On the pricing page: أسعار قمرة، باقات قمرة، اشتراك متجر إلكتروني، مقارنة الباقات، تكلفة متجر إلكتروني.
- Pricing title: "الأسعار والباقات | قُمرة". The pricing meta description pushes "بدون عمولة على المبيعات".
- **"vs" page**: "قمرة ولا شوبيفاي؟ مقارنة كاملة للتاجر المصري" (meta: "بتدوّر على بديل شوبيفاي في مصر؟…"), at /blog/قمرة-ولا-شوبيفاي. It targets "بديل شوبيفاي".
- Other blog topics: a 2026 guide to the cost of building a store in Egypt, 11.11 and White Friday offers, retargeting, influencer marketing in Egypt, mobile product photography.
- The sitemap has few pages (home, about, pricing, blog, contact, partners, help-center, policies) plus about 10 blog posts, in duplicate AR and /en URLs. Note: /en blog URLs reuse the Arabic slugs.

**Advantages / disadvantages for an Egyptian small seller (Qumra)**
- (+) Lowest subscription seen of the three: 199 EGP/month for Starter, priced in EGP, with no sales commission (vendor claim).
- (+) Bosta, Mylerz and Aramex plus Paymob and PayTabs cover the main Egyptian needs. POS and an Android app suit sellers who also have a physical shop.
- (+) Abandoned carts, coupons, landing pages and the app/theme store are all on the cheapest plan.
- (−) No free plan. The trial length is not published.
- (−) A custom domain, the AI assistant, POS and WhatsApp marketing all need Growth (699 EGP/month). Qumra branding can only be removed on Business (1,499 EGP/month).
- (−) The Starter product limit is unclear: the API says productCount 10, while the promo says unlimited. A seller should check before paying.
- (−) Pricing is not visible without JavaScript, and no theme count or pixel support is published.

---

## Shanta

| Field | Value | Source | Checked |
|---|---|---|---|
| Official site | https://shantaweb.com (/ar). Dashboard at dashboard.shantaweb.com, help at help.shantaweb.com, partners/affiliate at partners.shantaweb.com. Contact: info@shantaweb.com, 01033003065 (Egyptian). | https://shantaweb.com/ar | 2026-11-09 |
| Plans and prices | **EGP.** **Launch (باقة إنطلاقة): 550 EGP/month, or 5,500 EGP/year** ("instead of 6,600"). **Pro (باقة برو): 1,500 EGP/month, or 15,000 EGP/year** ("instead of 18,000"). The yearly toggle shows "خصم 17٪". USD data attributes (outside Egypt): Launch $10/month or $102/year; Pro $28/month or $278/year. The page also shows a White Friday promo: "اشترك سنة وخد سنة هدية أو اشترك شهر وخد شهر هدية" (pay for a year, get a year free; pay for a month, get a month free). Add-on: an Android app for 3,000 EGP/year ($100 outside Egypt), on annual plans only. | https://shantaweb.com/ar/pricing (HTML data-monthly/data-yearly); help: باقات شنطة والترقية | 2026-11-09 |
| Transaction fees | "بدون عمولة على المبيعات" (no sales commission) on all plans. Gateway fees are set by the gateway (Kashier or Paymob); Shanta publishes no %. Shipping through Shanta's own Bosta/Mylerz accounts is deducted from a Shanta wallet per airway bill. | pricing; help: تفعيل الدفع الإلكتروني; help: شركات الشحن المدعومة | 2026-11-09 |
| Free plan / trial | **14-day free trial** on Launch and Pro ("جرب … مجاناً 14 يوم"; "بدون بطاقة ائتمان"). The help center says a permanent free plan is "غير متاح حاليًا" (not currently available). **Contradiction:** Shanta's own blog post claims "متجر إلكتروني مجاني 100%… بدون فترة تجريبية", and the pricing page says "ابدأ مجاناً". The comparison table also has a hidden 2nd column (CSS `display:none`), likely a retired free tier. Treat a free plan as **not available**. | pricing; help center; /ar/blog/…best-free-ecommerce-platform-egypt | 2026-11-09 |
| Limits | Unlimited products, orders, customers and categories on both plans. Team: the pricing table says Launch 1 / Pro unlimited, while the help center says Launch 3 / Pro up to 10. These sources conflict, so team size is unverified. | pricing; help | 2026-11-09 |
| Builder / templates | Themes plus a "محرر الثيم: بناء صفحتك بالبلوكات" (block editor), funnels/landing pages, campaign landing pages, a blog, and **custom CSS and JS** (help article "إضافة أكواد CSS و JS مخصصة"). No theme count is published (unverified). | help center index | 2026-11-09 |
| AI | **None seen** on the home page, pricing page or help center index (no "ذكاء"/"AI" matches). Unverified, but absent from all three. | shantaweb.com, help.shantaweb.com | 2026-11-09 |
| Payments | **COD**; e-wallets **Vodafone Cash, Orange Money, WE Pay, e& money**; **Visa and Mastercard**; **instalments with ValU and Al Ahly bank (البنك الأهلي)** (home page). Gateways: **Kashier** (help article) and **Paymob** (help article "ربط حسابك لدى Paymob"). Manual bank transfer or wallet payment, and pay-later links. Online payment needs a paid plan, and the pricing table puts it on Launch and up. InstaPay: unverified (only HalaOrders' article claims it; I didn't see it on Shanta's pages). | home; help index | 2026-11-09 |
| Shipping | **Bosta** and **Mylerz** through Shanta's account (no contract needed; cost taken from wallet), or the seller's own Bosta/Mylerz contract (a monthly subscription that Shanta activates). **Aramex and Egypt Post "coming soon"**. Custom local couriers with per-city prices, an "open shipment before paying" option, and status sync. | home; help: شركات الشحن المدعومة | 2026-11-09 |
| COD | Yes ("هل تدعم شنطة الدفع عند الاستلام؟ نعم"). Order phone confirmation through Vrobo is available (help article). | home FAQ; help | 2026-11-09 |
| SEO | **SEO ("تحسين محركات البحث") is Pro only** per the pricing table. The help center also has a sitemap, custom meta tags and a product SEO article. | pricing; help | 2026-11-09 |
| Analytics | Basic reports on Launch; advanced reports on Launch and Pro. Report types include best-sellers, most viewed, most profitable, city sales, coupon sales, search terms and sales channels. GA and GTM integrations. | pricing; help index | 2026-11-09 |
| Marketing | Launch: coupons, product discounts, Facebook and TikTok pixels, Facebook/TikTok catalogues, WhatsApp notifications, OneSignal, one-step checkout, QR code, blog. **Pro only:** abandoned carts, upsell, cross-sell, bundles, customer groups, email/SMS campaigns, affiliate marketing, multi-currency. Facebook Pixel plus Conversions API is supported. | pricing table; home | 2026-11-09 |
| Support | Phone and WhatsApp (01033003065), email, help center (Arabic), Telegram and social accounts. Pro adds a dedicated support person ("مسئول خاص من الدعم الفني"). | pricing; footer | 2026-11-09 |
| Markets / Egypt sign-up | Egypt-first: "أنشئ متجرك الإلكتروني في مصر", default phone country "eg", and USD prices for outside Egypt. Egyptian sellers can sign up: **Verified**. | home meta; page script | 2026-11-09 |
| Social proof claims | "+10,000 متجر عربي يستخدم شنطة" (vendor claim, not checked). | home | 2026-11-09 |

**SEO intel (Shanta)**
- Home `<title>`: "منصة شنطة للتجارة الإلكترونية" (the same title on /ar and /).
- Meta description (the same on home and pricing): "أنشئ متجرك الإلكتروني في مصر بأقل تكلفة وأفضل مميزات لنجاح تجارتك، وابدأ بيع منتجاتك على الإنترنت". og:description is the same.
- H1: "أنشئ متجرك الإلكتروني وابدأ البيع في دقائق". Pricing H1: "اختر الباقة المناسبة لمتجرك". Pricing title: "الأسعار - منصة شنطة للتجارة الإلكترونية".
- Blog targets "free store" keywords: "ما هي أفضل منصة لإنشاء متجر إلكتروني مجاني في مصر؟" (slug `best-free-ecommerce-platform-egypt`), "هل يمكن فعلاً إنشاء متجر إلكتروني احترافي مجاناً؟ (بدون عمولة أو مصاريف خفية)", "دليلك الكامل لبدء متجر إلكتروني بدون رأس مال". There is no direct "vs/بدائل" page, but the "best free platform" post is a comparison-intent page that names only Shanta.
- Industry sections on the home page target media buyers (ميديا بايرز), digital products, restaurants, perfume and furniture.
- Weak on-page SEO: the title, description and og tags are duplicated across pages.

**Advantages / disadvantages for an Egyptian small seller (Shanta)**
- (+) The widest Egyptian payment list of the three: COD, Vodafone Cash, Orange, WE Pay and e& wallets, ValU and Al Ahly instalments, plus Kashier and Paymob.
- (+) No sales commission. Bosta and Mylerz work with no carrier contract. A 14-day trial with no card. The Pixel plus CAPI setup suits media buyers.
- (+) A deep help center (about 130 articles), and Odoo and Daftra inventory sync.
- (−) Entry price is 550 EGP/month, and there is no free plan despite blog posts claiming "100% free".
- (−) Abandoned carts, upsell, bundles, **SEO** and email campaigns are locked to Pro (1,500 EGP/month).
- (−) No AI features seen. Aramex and Egypt Post are still "coming soon". Plan pages and the help center disagree on team size.

---

## HalaOrders

| Field | Value | Source | Checked |
|---|---|---|---|
| Official site | https://halaorders.com (AR), /en. Title: "هلا أوردرز - أنشئ متجرك الإلكتروني وابنِ علامتك التجارية في مصر". Footer: "صُنعت في مصر للتجار في كل مكان". Phone and WhatsApp +20 155 512 3037. | https://halaorders.com | 2026-11-09 |
| Plans and prices | **EGP.** Three ways to pay, **all features in every plan**: (1) **Pay per order: 0.5% + 1.5 EGP per order**, no subscription (their example: a 1,000 EGP order costs 6.5 EGP); (2) **Monthly: 750 EGP/month**; (3) **Annual: 6,000 EGP/year (= 500 EGP/month)**, "save 33%". No setup or activation fees. The pricing FAQ mentions a "3 months" option that is not shown on the cards, and HalaOrders' own comparison article says "اشتراك 3 شهور أو سنوي، أو رسوم على كل طلب". A quarterly plan is unverified. | https://halaorders.com/pricing | 2026-11-09 |
| Transaction fees | The pay-per-order plan charges 0.5% + 1.5 EGP per order. Subscriptions have **no commission** on orders. Gateway and shipping fees are charged separately by those providers. | pricing | 2026-11-09 |
| Free plan / trial | **No free plan or trial is stated.** "ابدأ مجانًا وادفع فقط عندما تبيع" (start free, pay only when you sell) in the meta description refers to the pay-per-order plan, which has no upfront cost. | home meta; pricing | 2026-11-09 |
| Limits | Unlimited products, orders, discount codes and team members (with permissions). | pricing | 2026-11-09 |
| Builder / templates | **6 themes** on /themes (Bisum, Nile, Bazaar, Sprout, Ember, Bistro), each with a live demo store, in AR/EN with RTL and **dark mode**. "Apply theme with its content" includes undo of the last apply. Brand logo and colours, sliders, banners and sections. Landing pages have a drag-and-drop visual editor with live preview, quantity offers, countdown, sticky order button, and **A/B testing (winner declared at 95% statistical confidence)**. "Coming soon" mode, blog with per-post SEO. | /themes; /features; /landing-pages | 2026-11-09 |
| AI | No built-in model calls are described. Instead: copy-paste prompt templates for **ChatGPT, Gemini or Claude** for store colours, settings suggestions, and AI product entry (AR+EN, from details or photos). The store publishes **llms.txt** and an AI-readable product feed, and **WebMCP** tools let browser AI agents search products and add to cart. | /features (الذكاء الاصطناعي) | 2026-11-09 |
| Payments | **Paymob** (cards and wallets), **COD**, **InstaPay**, **Vodafone Cash** (transfer with receipt per order), **bank transfer**. A deposit ("عربون") before shipping can be the shipping cost, a % or a fixed amount. Fawry, Kashier, valU, Tabby and Tamara were not listed (unverified, presumably absent). | /integrations; /faq | 2026-11-09 |
| Shipping | Only **Sky Express Egypt (سكاي إكسبريس مصر)** is listed as an integration (create, track and cancel shipments). Bosta, Aramex, Mylerz and J&T are **not listed**. Per-governorate and per-city delivery fees, and free or fixed shipping per product. | /integrations; /features | 2026-11-09 |
| COD | Yes, and it is central to the landing-page positioning ("صفحة هبوط لمنتجك… بالدفع عند الاستلام"). COD-only stores are allowed. | /landing-pages; /faq | 2026-11-09 |
| SEO | "جاهز لمحركات البحث": clean URLs, sitemap, product structured data, **Google Merchant Center feed**, SEO title and description per blog post. | /faq; /features | 2026-11-09 |
| Analytics | Live revenue, orders, AOV, top products, top cities, coupon impact. Integrations: **GA4, GTM, Microsoft Clarity**. | /features; /integrations | 2026-11-09 |
| Marketing | Discount codes, quantity offers, A/B landing pages, **Meta, TikTok and Snapchat pixels**, Google Merchant feed, newsletter subscriber export, **Telegram** order alerts and daily report, email notifications. Free tools: profit calculator, WhatsApp order-link generator, store-name generator. **Abandoned-cart recovery, upsell/cross-sell and WhatsApp messaging were not seen** (unverified, likely absent). | /features; /integrations; /tools | 2026-11-09 |
| Support | WhatsApp, phone, email, contact form. "دعم بشري حقيقي" (real human support) is a listed feature. Site and dashboard in Arabic and English (FAQ: "لوحة تحكم بسيطة بالعربية أو الإنجليزية"). | footer; /faq | 2026-11-09 |
| Markets / Egypt sign-up | Built for Egypt: pricing in EGP, Egyptian integrations, blog aimed at "التاجر المصري". Egyptian sellers can sign up: **Verified**. | site-wide | 2026-11-09 |

**SEO intel (HalaOrders)**: the most SEO-mature of the three
- Home `<title>`: "هلا أوردرز - أنشئ متجرك الإلكتروني وابنِ علامتك التجارية في مصر". EN: "HalaOrders - Create Your Online Store & Grow Your Brand in Egypt".
- Meta description: "حوّل منتجاتك إلى علامة تجارية احترافية أونلاين. أنشئ متجرك الإلكتروني، وأدر طلباتك، واستقبل المدفوعات الإلكترونية وتابع مبيعاتك من لوحة تحكم واحدة. ابدأ مجانًا وادفع فقط عندما تبيع."
- Home H1 was not found as a static `<h1>`. The first headings are "علامات تجارية حقيقية ومتاجر تعمل الآن على هلا أوردرز" and "منتجاتك تستحق أكثر من بوست على السوشيال ميديا".
- Landing titles:
  - Pricing: "أسعار هلا أوردرز - باقات المتجر الإلكتروني في مصر بدون عمولة على الطلبات".
  - Features: "مميزات هلا أوردرز - كل ما تحتاجه للبيع أونلاين في مصر".
  - Integrations: "تكاملات هلا أوردرز - الدفع والشحن والتسويق للمتاجر في مصر".
  - Landing pages: "صفحة هبوط للمنتج بالدفع عند الاستلام | هلا أوردرز".
  - Themes: "ثيمات المتاجر الإلكترونية - عاين كل تصميم".
  - Profit calculator: "حاسبة أرباح المتجر الإلكتروني في مصر (مجانية)".
  - Open your store: "افتح متجرك الإلكتروني في دقائق".
- Programmatic pages: 15 `/integrations/<name>` pages (paymob, cash-on-delivery, instapay, vodafone-cash, bank-transfer, sky-express, google-merchant-center, meta/tiktok/snapchat pixel, GA, GTM, Clarity, telegram, email) and 11 `/solutions/<niche>` pages (fashion, home-decor, handmade, beauty, sports, electronics, jewelry, kids, food, restaurants, books). The sitemap has 156 URLs (AR plus /en).
- **Comparison and "alternatives" content:**
  - "أفضل منصات إنشاء متجر إلكتروني في مصر 2026: 11 منصة" (/blog/best-ecommerce-platforms-egypt) names HalaOrders, Shopify, EasyOrders, Wuilt, Zid, ExpandCart, Qumra, Shanta, Wix, WooCommerce and Lightfunnels, with a comparison table. **Tallaby is not mentioned.**
  - "منصة متجر جاهزة أم ووكومرس أم برمجة خاصة؟ مقارنة (2026)" (/blog/choose-ecommerce-platform-egypt).
- Other blog keyword targets: shipping in Egypt, online payment methods in Egypt, reducing fake COD orders, Meta/TikTok pixel setup, FB/TikTok ad landing pages, A/B testing, Egypt e-commerce statistics 2026, ChatGPT/Claude for stores, White Friday checklist, "best products to sell online Egypt", "start online store Egypt", Instagram page to store.
- Tracking on their own site: GA4 (G-78PLFT362K) and Microsoft Clarity.

**Advantages / disadvantages for an Egyptian small seller (HalaOrders)**
- (+) Can start with no subscription: 0.5% + 1.5 EGP per order. Every feature is on every plan, so no feature tiers.
- (+) Strong COD and ads tooling: COD landing pages with A/B testing, deposits against fake orders, Meta, TikTok and Snapchat pixels, Merchant Center feed.
- (+) InstaPay, Vodafone Cash and Paymob cover common Egyptian payments. AR/EN storefronts with dark mode and live theme demos.
- (−) The per-order fee grows with order value, because of the 0.5% part. Subscriptions (500–750 EGP/month) are pricier than Qumra's entry plan.
- (−) Only one shipping integration (Sky Express). No Bosta, Aramex or Mylerz is listed.
- (−) Only 6 themes. AI is "bring your own ChatGPT" prompts, not built-in. No abandoned-cart or upsell features were seen. The quarterly plan in the FAQ is not on the pricing cards.

---

### Qumra / Shanta / HalaOrders summary lines

- **Qumra**: cheapest paid plan **199 EGP/month** (Starter) [Verified, API]. Free plan: **none** [Verified]; trial claimed, length unknown [Unverified]. Per-order/transaction fee: **none claimed** ("بدون عمولة") [Verified as vendor claim]. COD: **yes** [Verified, vendor blog only]. Egypt gateways: **Paymob, PayTabs** (+Stripe, PayPal); wallets and InstaPay via Paymob [Verified logos / vendor blog]. Egypt shipping: **Bosta, Mylerz, Aramex** [Verified]. AI: **Shehab assistant from Growth 699 EGP** [Verified]. Arabic admin: **yes** [Verified, vendor blog]. Egypt sellers allowed: **yes** [Verified].
- **Shanta (shantaweb.com)**: cheapest paid plan **550 EGP/month or 5,500 EGP/year** (Launch) [Verified]. Free plan: **none currently**, 14-day trial [Verified; the blog contradicts this]. Per-order fee: **none** (no commission) [Verified]. COD: **yes** [Verified]. Egypt gateways: **Kashier, Paymob**, Vodafone Cash, Orange, WE Pay, e& wallets, ValU, Al Ahly instalments [Verified]; InstaPay [Unverified]. Egypt shipping: **Bosta, Mylerz** (Aramex and Egypt Post coming soon) [Verified]. AI: **none seen** [Unverified, absent]. Arabic admin: **yes** (Arabic help center and site) [Verified]. Egypt sellers allowed: **yes** [Verified].
- **HalaOrders**: cheapest paid plan **pay-per-order 0.5% + 1.5 EGP**, or **500 EGP/month on annual (6,000 EGP/year)** / 750 EGP monthly [Verified]. Free plan: **none**, but pay-per-order has no upfront cost [Verified]. Per-order fee: **0.5% + 1.5 EGP on the per-order plan; 0 on subscriptions** [Verified]. COD: **yes** [Verified]. Egypt gateways: **Paymob, InstaPay, Vodafone Cash, bank transfer** [Verified]. Egypt shipping: **Sky Express only** [Verified]. AI: **prompt templates for external ChatGPT/Gemini/Claude, llms.txt, WebMCP** [Verified]. Arabic admin: **yes, AR/EN** [Verified]. Egypt sellers allowed: **yes** [Verified].

---

## Summary matrix

V = Verified on an official page (or official API or blog, as noted per competitor) · U = Unverified (reason in that competitor's section). Prices exclude VAT unless stated. Checked 2026-11-09.

| Competitor | Cheapest paid plan + currency | Free plan | Per-order / transaction fee | COD | Egypt payment gateways | Egypt shipping | AI features | Arabic admin | Egypt sellers allowed |
|---|---|---|---|---|---|---|---|---|---|
| **EasyOrders** | $0.04/order (Regular); flat Pro **$100/mo**, USD **(V)** | No subscription; **$5 wallet top-up to activate**, then per order **(V)** | **$0.04/order**; none on Pro **(V)** | Yes, plus fake-order blocker **(V)** | "+15 gateways" **(V)**; Paymob, Fawry, PayTabs named only in their blog **(V, blog)**; Kashier, InstaPay, valU **(U)** | "+100 carriers" **(V)**; Bosta named in their blog **(V, blog)**; full list **(U)** | Easy AI: products, landing pages, page review, behaviour analysis, images, "Shater" chatbot **(V)** | Yes **(V)** | Yes, Egyptian platform **(V)** |
| **ExpandCart** | Standard **599 EGP/mo** (5,999 EGP/yr) **(V)** | No (14 or 15-day trial; pages disagree) **(V)**; a "free plan" is mentioned in the FAQ **(U)** | 0% commission, all plans **(V)** | **(U)**: not stated on the pages read | Paymob, Fawry, PayTabs, Tap, MyFatoorah logos (2021 Egypt page); Tabby, JumiaPay, Fawaterak pages (2022) **(V, dated)** | Bosta, Aramex, Mylerz, R2S, SMSA logos **(V, dated 2021)** | None advertised **(U)** | Arabic and English site; admin **(U)** | Yes, EGP pricing and an Egypt page **(V)** |
| **Wuilt** | Store: free. Websites from EGP 1,250/yr ($50/yr) **(V)** | **Yes: store free "مدى الحياه" for Egypt** **(V)** | No sales commission **(V)**; Wuilt Pay fees **(U)**; COD 1% above EGP 3,000 **(U, 404 source)** | Yes, through Wuilt Shipments and Wallet **(V)** | Wuilt Pay (own) per press **(V, 3rd party)**; named gateways **(U)** | **Aramex, Mylerz, Bosta** (Wuilt Shipments) **(V)** | None advertised **(V, absent)** | Yes, Arabic default **(V)** | Yes, Egyptian company; wallet Egypt-only **(V)** |
| **Salla** | Plus **SAR 990/yr** (≈ SAR 99/mo derived); AED in UAE **(V/U monthly)** | Yes, Basic, unlimited **(V)** | No platform fee shown; Salla Payments rates not public **(U)** | Yes, on Basic too **(V)** | None found **(U)** | None found **(U)** | AI fraud engine, prompt library, ChatGPT/Claude connect; no AI builder **(V)** | Yes **(V)** | **Effectively no**: Saudi CR needed to verify; individual entity for Saudi citizens only; Egypt not in the countries footer **(V)** |
| **Zid** | Rise **SAR 99/mo**; **Egypt: EGP 1,128.60/mo** (EGP 11,286/yr) **(V)** | Yes, Starter "free forever" **(V)** | 0% on paid plans **(V)**; free plan **(U)**; Zid Pay (KSA/Kuwait only) mada 1% + 1 SAR, cards 2.2–2.4% + fee **(V)** | Yes, free plan too **(V)** | **Paymob, valU, Sympl** logos on zid.eg **(V logos; terms U)** | **Bosta, Aramex, FedEx, Sprint, Mylerz ("Myler"), Khazenly, Sideup** logos **(V logos; terms U)** | Zid Voice AI abandoned-cart calls (limited beta) **(V)** | Yes **(V)** | **Yes: zid.eg, EGP pricing** **(V)**; Egyptian KYC **(U)** |
| **YouCan** | Solopreneur **$29/mo** ($290/yr) USD **(V)** | Pay as you go: $0/mo; **$2 activation credit** **(V)** | PAYG 0.5% COD and 1% online on the first $5k (billed once you pass $5k), then 0.25% / 0.5%; subscriptions 0% **(V)** | Yes, plus a confirmation app **(V)** | **None** (YouCan Pay is Moroccan; Stripe doesn't support Egypt) **(V, absent)** | **None** (YouCan Ship is Morocco-only) **(V, absent)** | Mochi assistant (Arabic, Darija, voice), AI images, MCP, all plans **(V)** | Site and app in AR; web admin **(U)** | Sign-up and selling to Egypt likely; online payouts **(U)** |
| **Lightfunnels** | Newbie **$9.99/mo**; **EGP 519.99/mo** on /egpricing **(V)** | No; 30-day trial, no card **(V)** | Newbie 1.5% online + 0.20% COD; Standard 0.5% / 0.10%; COD plan 0.5% / 0% **(V)** | Yes, plus anti-fake layers **(V)** | **Kashier, Fawaterk, Taager**; no Paymob, Fawry or InstaPay **(V)** | None (manual or CSV fulfilment) **(V, absent)** | Free AI copy and AI funnel builder ("AI-Generated Reviews") **(V)** | **(U)** (marketing site in AR) | Yes, Egypt pricing page **(V)** |
| **Qumra** | Starter **199 EGP/mo** **(V, plan API)** | No; trial length not published **(V/U)** | "بدون عمولة" **(V, vendor claim)** | Yes **(V, vendor blog)** | **Paymob, PayTabs** (+Stripe, PayPal); wallets and InstaPay via Paymob **(V)** | **Bosta, Mylerz, Aramex** **(V)** | "Shehab" assistant from Growth (699 EGP) **(V)** | Yes **(V)** | Yes; no CR needed for individuals **(V)** |
| **Shanta** (shantaweb.com) | Launch **550 EGP/mo** (5,500 EGP/yr) **(V)** | No (14-day trial; the blog claims "free") **(V)** | No commission **(V)** | Yes, plus confirmation via Vrobo **(V)** | **Kashier, Paymob**, Vodafone Cash, Orange, WE Pay, e&, valU, Al Ahly instalments **(V)**; InstaPay **(U)** | **Bosta, Mylerz** (Aramex and Egypt Post "soon") **(V)** | None seen **(V, absent)** | Yes **(V)** | Yes **(V)** |
| **HalaOrders** | Pay per order **0.5% + 1.5 EGP**, or **750 EGP/mo** / 6,000 EGP/yr **(V)** | No; but the per-order plan has no upfront cost **(V)** | 0.5% + 1.5 EGP per order (PAYG); 0 on subscriptions **(V)** | Yes, COD landing pages with A/B tests **(V)** | **Paymob, InstaPay, Vodafone Cash**, bank transfer **(V)** | **Sky Express only** **(V)** | Prompt templates for external ChatGPT, Gemini or Claude; llms.txt; WebMCP **(V)** | Yes, AR/EN **(V)** | Yes **(V)** |

**Fast reading for an Egyptian small seller (from the matrix only):**
- **Zero subscription:** Wuilt store (free), EasyOrders ($5 top-up + $0.04/order), YouCan PAYG (% of sales, deferred), HalaOrders PAYG (0.5% + 1.5 EGP), Zid Starter and Salla Basic (Salla blocked for Egypt in practice).
- **Lowest flat EGP plans:** Qumra 199, Lightfunnels EGP 519.99, Shanta 550, ExpandCart 599, HalaOrders 750 (500 on annual), Zid EGP 1,128.60.
- **Native Egyptian carriers:** Wuilt, Zid (logos), Qumra, Shanta, ExpandCart (logos, dated), EasyOrders (claimed), HalaOrders (Sky Express only). **None:** YouCan, Lightfunnels, Salla.
- **Built-in AI in the product:** EasyOrders, YouCan, Lightfunnels, Qumra (paid tier), Zid (voice beta). Little or none: ExpandCart, Wuilt, Shanta, Salla (prompt library), HalaOrders (external prompts).

---

## SEO intel across competitors

### Homepage titles / H1s (what each one targets)

| Competitor | `<title>` (as served) | H1 / hero | Main target phrase |
|---|---|---|---|
| EasyOrders | منصة ايزي اوردرز : لحلول التجارة الالكترونية | أنشئ متجرك الإلكتروني بنفسك في أقل من 10 دقايق، بدون خبرة برمجية. | أنشئ متجرك الإلكتروني، صفحات هبوط، إدارة الطلبات |
| ExpandCart | انشيء متجرك الإلكتروني وابدأ نجاحك اليوم - اكسباند كارت | (same as title) | انشاء متجر الكتروني، اسعار انشاء متجر الكتروني (pricing page) |
| Wuilt | صمم موقعك الاكتروني بنفسك - ويلت | أنشئ موقع أو متجر احترافي في 5 دقائق | تصميم موقع، متجر مجاني |
| Salla | سلة \| منصة التجارة الإلكترونية الشاملة في السعودية | سلة.. تجارة ذكيَّة وسهلة | منصة التجارة الإلكترونية في السعودية |
| Zid (KSA) | زد \| أنشئ متجرك الإلكتروني بسهولة وابدأ البيع في 24 ساعة | (6 H1s) | أنشئ متجرك الإلكتروني |
| Zid (Egypt) | أنشئ متجرك الإلكتروني بسهولة مع زد \| انضم لتجار مصر | — | متجر إلكتروني + مصر |
| Qumra | قُمرة \| منصة التجارة الإلكترونية المتكاملة لإنشاء متجرك الإلكتروني | كل أدوات تجارتك الإلكترونية في منصة واحدة | إنشاء متجر إلكتروني، نقاط البيع، صفحات هبوط |
| Shanta | منصة شنطة للتجارة الإلكترونية | أنشئ متجرك الإلكتروني وابدأ البيع في دقائق | أنشئ متجرك الإلكتروني في مصر بأقل تكلفة |
| HalaOrders | هلا أوردرز - أنشئ متجرك الإلكتروني وابنِ علامتك التجارية في مصر | (no static H1) | متجر إلكتروني في مصر، صفحة هبوط بالدفع عند الاستلام |

Almost every Arabic competitor builds its title or H1 around **"أنشئ/انشاء متجرك الإلكتروني"** + "في دقائق" + "بدون خبرة برمجية", and the Egyptian ones add **"في مصر"**.

### Comparison / "vs" / "بدائل" pages actually found

| Publisher | Pages |
|---|---|
| **EasyOrders** (blog) | الفرق بين ايزي اوردرز وشوبيفاي (2026) · سلة أم ايزي اوردرز · لايت فانلز أم ايزي اوردرز · سهل كارت أم ايزي اوردرز · يوكان أم ايزي اوردرز · ويلت أم ايزي اوردرز. Pattern: **"<X> أم ايزي اوردرز أفضل لإنشاء متجرك الإلكتروني"**. Several still quote EasyOrders' old $0.02 / $50 prices. |
| **Zid** | /ar/switchers/zid-x-salla/ ("زد أو سلة – قارن واختر…"), zid-x-shopify, zid-x-opencart, zid-x-magento, zid-x-wordpress, /en/shopify-vs-zid, all in the main nav ("الانتقال إلى زد"). |
| **HalaOrders** | "أفضل منصات إنشاء متجر إلكتروني في مصر 2026: 11 منصة" (/blog/best-ecommerce-platforms-egypt), which names HalaOrders, Shopify, EasyOrders, Wuilt, Zid, ExpandCart, Qumra, Shanta, Wix, WooCommerce and Lightfunnels, and **not Tallaby**. Also "منصة متجر جاهزة أم ووكومرس أم برمجة خاصة؟". 15 integration pages and 11 niche `/solutions/*` pages. |
| **Qumra** | "قمرة ولا شوبيفاي؟ مقارنة كاملة للتاجر المصري" (targets "بديل شوبيفاي في مصر"). |
| **ExpandCart** | "لماذا shopify ليست الحل الأفضل. تعرف على مقارنه مع منصة اكسباند كارت" (2019), "الفرق بين اكسباند كارت وشوبيفاي…" (2022). |
| **Shanta** | No vs page. The "ما هي أفضل منصة لإنشاء متجر إلكتروني مجاني في مصر؟" post names only Shanta. |
| **Salla, Wuilt** | None found. |

**Gap Tallaby can take:** no one has an honest "بديل ايزي اوردرز" page. EasyOrders' own comparison posts show outdated prices, and HalaOrders' "best platforms in Egypt" list leaves Tallaby out.

### Google autocomplete (observed 2026-11-09)

Queried `suggestqueries.google.com` (client=firefox, hl=ar, gl=eg). These are suggestions only, **not volumes**, and the endpoint may not exactly match what a phone in Egypt sees. An empty result means Google returned no suggestion. Raw output: `scratchpad/seo/raw/suggest.txt`, `suggest2.txt`.

- **انشاء متجر الكتروني** → انشاء متجر الكتروني مجاني · انشاء متجر الكتروني مجاني في مصر · انشاء متجر الكتروني في مصر · انشاء متجر الكتروني في السعودية · انشاء متجر الكتروني مجانا · **انشاء متجر الكتروني بالذكاء الاصطناعي** · انشاء متجر الكتروني سلة · … في الجزائر · … مجاني بالكامل
- **انشاء متجر الكتروني مجاني** → … في مصر · … بالكامل · … في سوريا · إنشاء متجر الكتروني مجاني مدى الحياة · إنشاء متجر إلكتروني مجاني بالذكاء الاصطناعي · … عربي · … على google · … سلة · … في الجزائر
- **انشاء متجر الكتروني في مصر** → إنشاء متجر إلكتروني مجاني في مصر · **تكلفة انشاء متجر الكتروني في مصر** · منصة انشاء متجر الكتروني في مصر
- **عمل متجر الكتروني** → … مجاني · … في مصر · … سلة · عمل متجر الكتروني مجاني بالذكاء الاصطناعي · … ووردبريس · … على شوبيفاي · … بالذكاء الاصطناعي · … في السعودية
- **متجر الكتروني** → متجر الكتروني مجاني · متجر الكتروني في مصر · متجر الكتروني مجاني مدى الحياة · متجر الكتروني في السعودية
- **متجر الكتروني بالذكاء الاصطناعي** → انشاء/إنشاء … بالذكاء الاصطناعي (مجانًا) · صناعة متجر الكتروني بالذكاء الاصطناعي · اختيار اسم متجر الكتروني بالذكاء الاصطناعي · إنشاء متجر إلكتروني مجاني مدى الحياة بالذكاء الاصطناعي
- **افضل منصة متجر الكتروني** → افضل منصة لانشاء متجر الكتروني · … مجاني · … في السعودية · **افضل منصة عربية لانشاء متجر الكتروني** · … في الجزائر
- **منصات التجارة الالكترونية في مصر** → أفضل منصات التجارة الإلكترونية في مصر
- **متجر الكتروني مجاني مصر** → إنشاء متجر إلكتروني مجاني في مصر
- **بديل شوبيفاي** → بديل شوبيفاي مجاني · **بديل شوبيفاي المصري**
- **شوبيفاي ولا** → **شوبيفاي ولا ايزي اوردر** · شوبيفاي ولا ووردبريس
- **ايزي اوردرز** → ايزي اوردرز مصر · ايزى اوردرز تسجيل الدخول · ايزي اوردرز اكاديمي · ايزي اوردرز يوتيوب · ابلكيشن ايزي اوردرز · موقع ايزي اوردرز · منصه ايزي اوردرز · تحميل ايزي اوردرز
- **easy orders** → easy orders login · sign up · academy · dashboard · **pricing** · api · **themes** · app · **egypt**
- **بديل ايزي اوردرز**, **easy orders alternative**, **easyorders vs**, **ايزي اوردرز سعر/عمولة**, **افضل منصة متجر الكتروني في مصر**, **مقارنة منصات المتاجر الالكترونية**: **no suggestions** (too little search demand for autocomplete, or none recorded).
- **اكسباند كارت** → اكسباند كارت تسجيل الدخول · منصة اكسباند كارت · موقع اكسباند كارت · **باقات اكسباند كارت**; **expandcart** → expandcart egypt · dropshipping · affiliate · suppliers · شرح · reviews
- **wuilt** → wuilt تسجيل الدخول · wuiltstore · wuilt متجر · wuilt egypt; **ويلت** → ويلت (wuilt) · ويلت دوت كوم · ويلت ويب سايت
- **youcan** → youcan متجر · youcan shop · youcan store · youcan.shop login (plus unrelated skincare-brand noise); **youcan vs** → youcan vs shopify
- **lightfunnels** → lightfunnels login · شرح · pricing · darija · domain connector · api · ai · templates; **lightfunnels vs** → lightfunnels vs shopify
- **salla** → salla login · salla partners · salla shop · salla.sa متجر · salla docs; **salla vs zid** → salla vs zid. **سلة ولا زد** → وش افضل سله ولا زد; **زد ولا سلة** → ايش افضل زد ولا سلة. Both are Saudi-dialect queries.
- **منصة زد** → منصة زد السعودية · منصة زد تسجيل دخول · منصة زد للتجارة الالكترونية; **zid** → zid dashboard · **zid egypt**
- **qumra** → qumra store · qumra cloud; **شنطة ويب** → شنطة ويب · شنطه ويب سايت. **هلا اوردرز / halaorders**: no suggestions.
- **صفحة هبوط** → صفحة هبوط مجانية · جاهزة · احترافية · بالذكاء الاصطناعي · **صفحة هبوط مجانية youcan** · صفحة هبوط سلة
- **منصة دروب شيبنج** → منصة دروب شيبنج عربي · **منصة دروب شيبنج مصر**; **انشاء متجر دروب شيبنج** → … مجانا
- **طلبي** → طلبية · طلبات · طلبيه جمله … The brand name "طلبي" collides with the common word "طلبية" (order) and with "طلبات" (Talabat), so Tallaby can't count on Arabic brand searches. It should target the generic phrases above.

**Takeaways (observed, not volumes):** the free and "in Egypt" variants of "انشاء متجر الكتروني" dominate. "بالذكاء الاصطناعي" now shows up for store, website and landing-page queries. "شوبيفاي ولا ايزي اوردر" and "بديل شوبيفاي المصري" show that comparison intent exists in Egypt. "easy orders pricing / egypt / themes" show what EasyOrders prospects check.

Raw evidence (HTML, JSON, autocomplete dumps): `scratchpad/seo/raw/`.
