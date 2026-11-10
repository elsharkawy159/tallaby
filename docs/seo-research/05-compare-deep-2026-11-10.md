# Compare pages, deep rows: EasyOrders, Shopify, WooCommerce, ExpandCart, Salla, Zid (2026-11-10)

These are the raw notes behind the 16 newer rows of `/compare/tallaby-vs-<id>`: `yearly`, `trial`, `gatewayFees`, `multiStore`, `staff`, `export`, `wallets`, `fawry`, `bosta`, `aiTranslate`, `aiImages`, `aiAssistant`, `mcp`, `aiLimits`, `pos` and `mobileApp`. They also hold the inputs of the "what 500 orders a month cost" block. They follow `04-compare-2026-11-10.md` (SEO_PLAN.md §4.2, §9.2–9.3). Every page was read on **2026-11-10** from the competitor's own site (pricing, product, help, docs, blog, roadmap or its own app-store listing). Most pages were fetched with curl from an Egyptian IP.

**Marks.**
- **V:** the competitor's own product, pricing, help or docs page, or its own app-store listing.
- **V-blog:** its own blog.
- **V-roadmap:** its own public roadmap.
- **T:** a third party, such as a gateway's or carrier's own plugin or app, or an app built by someone else that is listed in its marketplace.
- **U:** not verifiable on an official page (the reason is given).

**Status** is the competitor's own side: y = has it, n = doesn't (only when an official page shows that), p = partly, some plans only, through apps or with conditions. For `gatewayFees`, y means the platform takes **no** fee of its own on top of the gateway's fees. That matches the row label "No platform fee on top of gateway fees".

**How this maps to code.** In `apps/ecommerce/lib/marketing/compare.lib.ts`:
- V, V-blog and V-roadmap become `official(...)`.
- T becomes `thirdParty(...)`, which is shown on the page but not counted.
- U gets **no fact**, so the row isn't shown for that competitor.

Cell text is in `competitors.<id>.cells.<row>` in `apps/ecommerce/messages/marketing/compare.{ar,en}.json`. Cost lines are in `competitors.<id>.cost`. Copy uses only price tokens, never numbers.

Tallaby's own statuses for these rows were checked against the code and kept as they were:
- `wallets`: `payments/store-methods.ts` has Vodafone Cash, e& Cash, WE Pay and Orange Cash live.
- `fawry`: `fawry` is "soon".
- `multiStore`: `PLANS.*.maxStores = 3`.
- `staff`: there is no staff table.
- `export`: products, orders and customers export.
- `mobileApp`: the dashboard has `app/manifest.ts` (PWA) and push.

---

## EasyOrders (easyorders.eg)

Prices are in USD. The `.md` copies say "Last updated: 2026-11-09". The roadmap had 207 ideas, read in full with `?BACKLOG=200`. All 195 blog posts were searched through its WordPress API.

| Row | St | Fact | Source | Verbatim quote (≤25 words) | Mark |
|---|---|---|---|---|---|
| yearly | — | Only a per-order plan and a monthly plan are shown. Yearly billing is neither offered nor ruled out. | https://www.easyorders.eg/pricing.md | "الباقة الاحترافية — $100 / شهرياً" | U (not mentioned) |
| trial | p | No timed trial. You can "start free", but a $5 wallet top-up activates the account. | https://www.easyorders.eg/create-ecommerce-store-with-ai.md | "يمكنك البدء مجاناً على Easy Orders. أنشئ متجرك وجرّب أدوات الذكاء الاصطناعي دون تكلفة مقدمة" | V |
| gatewayFees | y | Its blog says it takes no commission on online or card payments, so only the gateway's fee applies. The pricing page says "no hidden fees". | https://www.easyorders.eg/blog/لايت-فانلز-أم-ايزي-اوردرز-افضل-لإنشاء-م/ (modified 2026-02-25) | "ايزي اوردرز لا تفرض أي عمولة على الدفع الإلكتروني أو عبر البطاقات البنكية." | V-blog |
| multiStore | — | No official page, post or roadmap item mentions several stores on one account. | — | — | U (not found) |
| staff | y | The blog says managers are unlimited, with custom permissions. A roadmap request says permissions are set per section only. | https://www.easyorders.eg/blog/الفرق-بين-ايزي-اوردرز-وشوبيفاي/ (modified 2026-02-25); https://roadmap.easyorders.ai/ar/features/cmvw99ju000ydm0jkor8u9i1p | "تتيح إيزي اوردرز إضافة عدد لا نهائي من المديرين بصلاحيات مخصصة لكل منهم" | V-blog / V-roadmap |
| export | p | Product export to Excel is a waiting-list merchant request. A merchant comment there suggests an orders sheet exists. That evidence is indirect. | https://roadmap.easyorders.ai/ar/features/cmw8n0sgi02jsm0jk8uoz95f8 | "اقتراح عميل بتصدير المنتجات كشيت اكسيل"; "هقدر اسحب شيت اكسيل بالمتاكد فقط" | V-roadmap (weak) |
| wallets | p | It says "e-wallets" in general and names none for buyer checkout. Vodafone Cash appears on the blog only for topping up the seller's own wallet. | https://www.easyorders.eg/pricing.md | "نحن ندعم جميع وسائل الدفع الرئيسية بما في ذلك بطاقات الائتمان والمحافظ الإلكترونية والدفع عند الاستلام." | V (generic) |
| fawry | n | "Connect Fawry gateway" is a waiting-list request with 12 votes. An older YouCan comparison post lists Fawry; we follow the roadmap. | https://roadmap.easyorders.ai/ar/features/cmvs2dkgu00ijm0jknxgonecf | "ربط بوابة دفع فوري" | V-roadmap |
| bosta | p | Only its 2026 blog says Bosta connects. Product pages say "100+ carriers" and name none. | https://www.easyorders.eg/blog/أفضل-شركات-الشحن-الداخلي-في-مصر/ (2026-05-26) | "تدعم الربط مع إيزي اوردرز و شوبيفاي ومنصات التجارة الإلكترونية المختلفة." | V-blog (weak) |
| aiTranslate | n | A two-language store and "translate the whole store" are both waiting-list requests. | https://roadmap.easyorders.ai/ar/features/cmw3k010501wfm0jk16rqnewz | "عند اختيار العميل للغة يترجم المحتوى بالكامل للمتجر" | V-roadmap |
| aiImages | y | The AI page lists "AI image design" as one bullet, with no detail. | https://www.easyorders.eg/create-ecommerce-store-with-ai.md | "تصميم الصور بالذكاء الاصطناعي" | V (one bullet) |
| aiAssistant | — | No merchant chat in the dashboard is described. "Shater" answers shoppers, and a ChatGPT/Gemini integration is only "planned". | https://www.easyorders.eg/create-ecommerce-store-with-ai.md; https://roadmap.easyorders.ai/ar/features/cmvmq4ez4001qm0jk8mi4ceiw | "يرد على العملاء تلقائيًا عبر خدمة شاطر." | U (not stated) |
| mcp | n | An official MCP is "ضمن الخطة" (planned, not built), with 41 votes. | https://roadmap.easyorders.ai/ar/features/cmvl4ugpm005im0lkokkcvzld | "إضافة MCP رسمي لربط Easy Orders بوكلاء الذكاء الاصطناعي وأتمتة إدارة المتجر" | V-roadmap |
| aiLimits | p | Limits are published only for Shater, a paid chatbot add-on. None are published for the built-in AI tools. | https://www.easyorders.eg/blog/افضل-شات-بوت-للمتاجر-الإلكترونية-شاطر/ (modified 2026-02-25) | "إضافة 20 منتج للبوت الذي تصل ردوده إلى 1000 رد ذكي شهريًا" | V-blog |
| pos | n | A cloud POS and cashier is a waiting-list request. | https://roadmap.easyorders.ai/ar/features/cmvr731f700fim0jkfhdk5er2 | "إضافة نظام نقطة بيع وكاشير سحابي متكامل (Easy Orders POS & Cashier)" | V-roadmap |
| mobileApp | y | There is a merchant app on Google Play (EASYORDERS SHOP LTD, 10K+, updated 2026-11-08) and on the App Store. A 2023 "PWA only" blog post is out of date. | https://play.google.com/store/apps/details?id=com.myeasyorders.seller; https://apps.apple.com/us/app/easyorders-create-your-store/id6744579490 | "Easy Orders is a powerful app designed for store owners and managers to receive real-time order notifications and track sales statistics effortlessly." | V (own listing) |

## Shopify (as a seller in Egypt sees it)

Shopify Payments isn't offered in Egypt, so every card or wallet payment goes through a third-party provider.

| Row | St | Fact | Source | Verbatim quote (≤25 words) | Mark |
|---|---|---|---|---|---|
| yearly | y | Yearly billing costs less per month. Today's Egypt page shows Basic $27 monthly vs $24 yearly (see open points). | https://www.shopify.com/eg/pricing | "Pay monthly $27 USD/mo $72 USD/mo $399 USD/mo … Pay yearly $24 USD/mo $65 USD/mo $359 USD/mo" | V |
| trial | y | A 3-day trial with no card, then $1 a month for 3 months on most plans. The store freezes until a plan is chosen. | https://help.shopify.com/en/manual/intro-to-shopify/pricing-plans/free-trial | "Your store is frozen until you choose a paid plan." | V |
| gatewayFees | n | Shopify adds its own fee to every third-party payment: Basic 2%, Grow 1%, Advanced 0.6%. COD and manual payments pay none. | https://help.shopify.com/en/manual/your-account/manage-billing/billing-charges/types-of-charges/third-party-charges/third-party-transaction-fees | "Transaction fees are in addition to processing fees charged by your third-party payment provider." | V |
| multiStore | p | Each store has its own subscription. Plus covers one main store plus nine expansion stores of the same brand. | https://help.shopify.com/en/manual/organization-settings/expansion-stores | "a maximum of ten stores on their contract with no additional cost" | V |
| staff | p | Basic gets no extra staff accounts. Grow gets 5, Advanced 15, Plus unlimited. | https://help.shopify.com/en/manual/your-account/users/manage-users | "Stores and organizations on all plans other than the Basic or Starter plans can add users to the Shopify admin" | V |
| export | y | Products, orders and customers export to CSV. | https://help.shopify.com/en/manual/fulfillment/managing-orders/exporting-orders | "You can export a comma-separated values (CSV) spreadsheet of your orders from the Orders page of your Shopify admin" | V |
| wallets | p | Not built in, only through gateway apps. Kashier's own app says "wallets" without naming them. | https://apps.shopify.com/kashier-online-payments | "Accept credit cards, debit cards, wallets, Valu and more with ease." | T (built by Kashier) |
| fawry | — | No Fawry provider in the /eg/payment-gateways data. The App Store search didn't load. No page states it's absent. | https://www.shopify.com/eg/payment-gateways | — | U |
| bosta | p | The "Bosta Shipping" app, built by Bosta: free to install, 3.9★ from 24 reviews, English only. | https://apps.shopify.com/bosta-shipping-app | "Auto-sync your Shopify orders seamlessly with Bosta for a quicker delivery." | V (listing; app by Bosta) |
| aiTranslate | p | Translate & Adapt auto-translates. Egypt falls under "All other countries", which get 2 automatic languages and no Auto-sync. | https://help.shopify.com/en/manual/international/languages/translate-adapt-app/automatic-translation | "All other countries You can translate up to 2 languages automatically, in addition to your store's default language." | V |
| aiImages | y | Media generation (backgrounds, scenes) and Sidekick image generation, on Basic and up, with limits by plan. | https://help.shopify.com/en/manual/ai-powered-tools/media-generation | "For a limited time, media generation in the file editor is available on all Shopify plans at no additional cost." | V |
| aiAssistant | y | Sidekick is on every plan, with limits by plan. It works in "multiple languages", but Arabic isn't named. | https://www.shopify.com/eg/sidekick | "No. Sidekick is included with your Shopify plan. Features and usage limits vary by plan." | V |
| mcp | y | An official connector for Claude (and a ChatGPT plugin). It covers products, collections, inventory, orders, customers, discounts and analytics. It can't refund orders or change payments. | https://help.shopify.com/en/manual/ai-powered-tools/connecting-ai-tools/shopify-connector-for-claude | "Connect a store that you already own, and then work with your products, collections, inventory, orders, customers, discounts, and analytics." | V |
| aiLimits | p | Limits exist and vary by plan, but no numbers are published. | https://help.shopify.com/en/manual/ai-powered-tools/sidekick/generate-content | "Image generation limits depend on your Shopify plan and apply to your whole store" | V |
| pos | p | POS is included, and POS Pro costs extra. Shopify's own card readers aren't sold in Egypt, so you'd use an external reader. | https://help.shopify.com/en/manual/sell-in-person/hardware/card-readers/choosing-card-reader | "You're located in a country without Shopify-supported card readers." | V |
| mobileApp | y | The Shopify app for iPhone, iPad, Android and Apple Watch. | https://help.shopify.com/en/manual/shopify-admin/shopify-app | "With the Shopify app , you can manage your store from your iPhone or Android device." | V |

## WooCommerce (as a seller in Egypt sees it)

| Row | St | Fact | Source | Verbatim quote (≤25 words) | Mark |
|---|---|---|---|---|---|
| yearly | p | The core has no subscription. Paid extensions are billed yearly, and some offer a 2-year price. | https://woocommerce.com/pricing/ | "$29 – $299/year per extension to enhance your store." | V |
| trial | p | No trial is needed because the core is free. Marketplace purchases have a 30-day refund. | https://woocommerce.com/refund-policy/ | "we offer a full refund within 30 days of your date of purchase" | V |
| gatewayFees | y | No platform fee and no revenue share; you pay only the gateway. | https://woocommerce.com/pricing/ | "Build a custom online store and only pay for the added features you use — no platform fees, no revenue share." | V |
| multiStore | p | No multi-store account. Each store is its own WordPress install, and each extension subscription covers one site. | https://woocommerce.com/document/managing-woocommerce-com-subscriptions/activate-and-manage-your-subscriptions/ | "Each current single-site subscription can be active on one active site and one staging, test, or development site." | V |
| staff | y | WordPress users, plus a Shop Manager role. No cap is shown. | https://woocommerce.com/document/roles-capabilities/ | "WooCommerce adds two user roles—Customer and Shop Manager—and extends the existing Administrator role with store management capabilities." | V |
| export | p | Product CSV export is built in. A full order and customer export needs a $79/yr extension (by SkyVerge). | https://woocommerce.com/document/product-csv-importer-exporter/ | "WooCommerce includes a built-in CSV tool for importing, exporting, and bulk-updating products." | V |
| wallets | p | Only through plugins. Paymob's own plugin lists wallets for Egypt. | https://wordpress.org/plugins/paymob-for-woocommerce/ | "Egypt: Debit/credit cards, wallets, bank instalments, Kiosk, Instapay (launching soon)" | T (by Paymob) |
| fawry | p | Only through a small third-party plugin ("XPay for WooCommerce", 30+ installs). | https://wordpress.org/plugins/search/fawry/ | "Accept card, Apple Pay, ValU, Fawry, and other XPay-supported payments directly on your WooCommerce checkout." | T |
| bosta | p | Bosta's own plugin (bostateam): 800+ installs, 2.4★. | https://wordpress.org/plugins/bosta-woocommerce/ | "Bulk Sending Orders allows you to send multiple orders to bosta at once." | T (by Bosta) |
| aiTranslate | p | No first-party AI translation. Third-party extensions do it, such as Weglot. | https://woocommerce.com/products/weglot-translate-woocommerce/ | "Get translation suggestions generated by AI to refine and perfect your messages like a local." | T (by Weglot) |
| aiImages | p | No first-party AI image tool. There is a third-party "AI Image Enhancer" extension (PerfectProduct.ai, credit packs). | https://woocommerce.com/products/ai-image-enhancer/ | "AI removes background, crops the image to the product, improves lighting and adds beautiful shadows with one single click" | T |
| aiAssistant | n | WooCommerce AI (v0.9.0) is a private beta **for US stores in English only**, so it isn't available to a seller in Egypt. | https://woocommerce.com/products/woocommerce-ai/ | "This extension is currently only available to stores in the U.S., not hosted on WordPress.com, and has English as the primary store language." | V |
| mcp | p | A core MCP "developer preview" that needs the separate MCP Adapter plugin and a WP-CLI or Application Password setup. | https://developer.woocommerce.com/docs/features/mcp/ | "The MCP implementation in WooCommerce is currently in developer preview." | V |
| aiLimits | n | No limits or pricing published for WooCommerce AI yet. | https://woocommerce.com/products/woocommerce-ai/ | "WooCommerce AI is free during the beta period. Pricing for the general release will be shared before the beta ends." | V |
| pos | n | POS mode in the app works in 10 countries (AU, CA, FI, IE, LU, NL, NZ, SG, UK, US). Egypt isn't one of them. | https://woocommerce.com/document/woo-mobile-app-point-of-sale-mode/ | "Your store address must be in one of the supported countries." | V |
| mobileApp | y | The WooCommerce app for iOS, watchOS, Android and Wear OS. | https://woocommerce.com/mobile/ | "Create products, process orders, and watch your sales climb in real time — all from your iOS, watchOS, Android, and Wear OS mobile devices" | V |

## ExpandCart (expandcart.com)

Prices are in EGP. The WordPress API shows the site's newest page change is from 2024-02-12, and the pricing pages from 2023-12-11. The help center (`support.expandcart.com`) still fails TLS. All 249 WordPress pages were searched. The comparison table's checkmarks were read from the HTML classes (`fa-check` / `md-close`), across Standard, Professional, Ultimate and Business.

| Row | St | Fact | Source | Verbatim quote (≤25 words) | Mark |
|---|---|---|---|---|---|
| yearly | y | Yearly billing, "save up to 15%". In fact Standard is 5,999 a year vs 7,188 for 12 months, about 16.5%. | https://expandcart.com/ar/الاسعار/ | "وفر حتى 15٪ على الخطة السنوية!" | V |
| trial | y | Free trial with no card: 15 days on the home pages, 14 days in the pricing FAQ. | https://expandcart.com/ar/ | "احصل على 15 يوم مجانا لإنشاء موقعك الإلكتروني، بدون بیانات بنكیة أو مصاریف خفیة" | V |
| gatewayFees | y | 0% sales commission on every plan. No ExpandCart fee on top of the seller's gateway is stated. | https://expandcart.com/ar/الاسعار/ | "عمولة المبيعات 0% 0% 0% 0%" | V |
| multiStore | — | No several-stores offer. Ultimate's "unlimited branches" means warehouses and branches. | https://expandcart.com/ar/الاسعار/ | "عدد غير محدود من الفروع والمواقع" | U |
| staff | p | Users differ by plan. The cards say 1/3/10/unlimited and the table says 1/10/unlimited/unlimited. Custom roles aren't on Standard. | https://expandcart.com/ar/الاسعار/ | "إضافة مستخدم واحد بحد أقصى"; "إمكانية إضافة 3 مستخدمين بحد أقصى" | V (contradicts itself) |
| export | p | Excel import and export on Professional and up, not on Standard. | https://expandcart.com/ar/الاسعار/ | "تصدير واستيراد بملف إكسيل" (✗ ✓ ✓ ✓) | V |
| wallets | — | No product or pricing page names a mobile wallet. Only a 2021 general blog post mentions them. | https://expandcart.com/ar/56329-طرق-الدفع-الإلكتروني/ | — | U |
| fawry | p | Only through the Fawaterak gateway (2022 page), plus a logo on the 2021/22 Egypt page. | https://expandcart.com/ar/partnership-between-fawaterak-and-al-ahli-bank/ (modified 2022-05-29) | "تنوع طرق الدفع لتناسب احتياجاتك (فيزا، ماستر كارد، ميزة، فوري، الخ)." | V (old) |
| bosta | y | A direct Bosta link from the dashboard, from a 2020 page (modified 2021). No newer page confirms it. | https://expandcart.com/ar/expandcart_bosta/ | "يمكنك الآن ربط متجرك بشركة الشحن bosta بكل سهولة من لوحة تحكمك" | V (old) |
| aiTranslate | — | No AI feature on any product or pricing page. | wp-json search | — | U |
| aiImages | — | Same as aiTranslate. | — | — | U |
| aiAssistant | — | Not advertised. ExpandBot (2021) is a Messenger bot for shoppers. | https://expandcart.com/ar/expandbot/ | — | U |
| mcp | — | A site search for "MCP" returns 0 results. | https://expandcart.com/wp-json/wp/v2/search?search=MCP | — | U |
| aiLimits | — | No AI features are advertised, so there are no limits either. | — | — | U |
| pos | y | A POS product page (multi-location, inventory sync). The plans that include it aren't stated. | https://expandcart.com/ar/نظام-نقاط-البیع/ (modified 2023-12-10) | "تمتع بإدارة ذكیة لكل شيء مع نظام نقاط بیع سهل الاستخدام وقابل للتخصیص بالكامل للتكیف مع جمیع الأعمال" | V |
| mobileApp | — | No merchant app on Google Play or the Egypt or US App Store. The "mobile app" on yearly Business is a branded shopper app. | https://expandcart.com/ar/قنوات-البيع/ | — | U |

## Salla (salla.com)

Salla isn't open to sellers in Egypt. Its FAQ says KSA and UAE only, and a store needs a Saudi CR, a Saudi phone number and a Saudi bank account. Every row describes the Gulf product. Salla gets a comparison but is never on an Egypt shortlist (§9.3).

| Row | St | Fact | Source | Verbatim quote (≤25 words) | Mark |
|---|---|---|---|---|---|
| yearly | y | Yearly billing saves 16%. | https://salla.com/plans | "سنوي (خصم 16%)" | V |
| trial | n | New stores no longer get a free trial of paid plans (stopped 2026-08-16). The free Basic plan stays. | https://salla.com/terms | "ولا يتأثر ذلك بإيقاف التجربة المجانية للمتاجر الجديدة." | V |
| gatewayFees | p | No commission on Basic. Salla Payments' card rates aren't published (the dashboard has a calculator only). | https://help.salla.sa/article/إدارة-باقة-المتجر/rhzl2dh5f5f9uz0qo813nttb | "بمنتجات ومبيعات غير محدودة وبدون عمولات" | V (rates U) |
| multiStore | y | One owner can link several stores, with no limit. | https://help.salla.sa/article/إدارة-قائمة-المتاجر-المرتبطة/t9z4bp7g0vo1rcdvq4h4k9b3; https://help.salla.sa/article/465244452 | "ولا يوجد حد أعلى لعدد المتاجر التابعة لمالك واحد." | V |
| staff | p | Plus gets 1 user and Pro gets 10. More can be bought. | https://help.salla.sa/article/-موظفو-المتجر/omuml4pu7pz3o82os6cifozx | "عند تفعيل باقة سلة برو، سيكون لديك 10 مستخدمين." | V |
| export | y | Orders and products export to Excel or CSV, with templates. | https://help.salla.sa/article/-تصدير-الطلبات/euirzajvhdhdk6b2e0r4tcj8 | "تصدير هذه البيانات كملفات Excel أو CSV" | V |
| wallets | n | Only Gulf and global wallets (STC Pay, PayPal, Apple Pay). No Egyptian wallet. | https://salla.com/payments | "أو المحافظ الرقمية مثل: stc pay وباي بال." | V |
| fawry | — | No Fawry page on salla.com, help.salla.sa or its app market. | — | — | U |
| bosta | p | A Bosta app, but for Saudi cities. | https://help.salla.sa/article/الربط-مع-بوسطة-للشحن-والتوصيل/bxseyrqxghbqhxex998hoqza | "مع بوسطة وصّل منتجاتك أسرع وأوفر لأي مكان في المملكة" | V |
| aiTranslate | p | Paid "instant translation" charged by the character. The article doesn't call it AI and is marked old (updated 2026-08-18). | https://help.salla.sa/article/1878085895 | "هل الترجمة الفورية مجانية؟ لا، ليست مجانية." | V |
| aiImages | p | No built-in tool. Third-party apps exist, such as "Sowar AI" by HumanEcho. | https://apps.salla.sa/en/app/182060168 | "Sowar AI is an AI-powered product image studio built specifically for Salla merchants." | T |
| aiAssistant | y | "مشمر من سلة" is a chat assistant in the dashboard that answers questions and runs store tasks. | https://help.salla.sa/article/مشمر-من-سلة-داخل-لوحة-التحكم/yk5eshal37rwrkfne80sith7 | "ليكون مساعدك الذكي في الوصول إلى المعلومات وإدارة عمليات المتجر اليومية عبر محادثة واحدة فقط." | V |
| mcp | y | The official Salla AI Connector for ChatGPT and Claude (MCP, OAuth), on paid plans. | https://help.salla.sa/article/ربط-متجرك-مع-chatgpt/ptsfc31snxw704refay9v2ry | "✅ باقة مدفوعة." | V |
| aiLimits | p | A weekly limit on Mushammir, but the number isn't published. | https://help.salla.sa/article/مساعد-من-سلة-لتصميم-المتجر/uth70rasojmmwkvuiz2yocys | "يوجد حد أسبوعي لاستخدام مشمر من سلة لكل تاجر" | V |
| pos | y | "سلة بوينت", a free cashier app (the plans page lists it under Plus). | https://help.salla.sa/article/الإعداد-الذاتي-الجديدة-لسلة-بوينت-كاشير-مجاني-لمتجرك/q53eim0csvel80xzzyfpe9o7 | "بيع في فروعك بسهولة - مع تطبيق سلة بوينت مجانًا" | V |
| mobileApp | y | Merchant app "سلة" on iOS, by SALLA APP COMPANY. | https://apps.apple.com/sa/app/سلة/id1148458340?l=ar | "تحكم بإدارة متجرك وإضافة وتحديث منتجاتك وتتّبع مبيعاتك من أي جهاز تفضّله" | V |

## Zid (zid.eg / zid.sa)

The help center, help.zid.sa, is shared across countries and written mostly for Saudi stores. The zid.eg prices are exactly SAR × 11.4.

| Row | St | Fact | Source | Verbatim quote (≤25 words) | Mark |
|---|---|---|---|---|---|
| yearly | y | Yearly billing saves 16%, in Egypt too. | https://zid.eg/ar/pricing/ | "خصم 16% على الباقة السنوية" | V |
| trial | — | No free trial of paid plans found. A free-for-life Starter plan exists instead. | https://zid.eg/ar/pricing/ | — | U |
| gatewayFees | p | KSA FAQ: paid plans pay no sales commission. Zid Payments charges a percentage plus a fixed fee. Egypt's gateway and fees aren't documented. | https://zid.sa/ar/pricing/ | "لا، لا يوجد اي عمولة على المبيعات لباقة لايت والنمو والاحترافية" | V (Egypt U) |
| multiStore | y | Switch stores and add a new store from the account menu. | https://help.zid.sa/ar/getting-started/navigation | "الانتقال إلى متجر آخر" / "إضافة متجر جديد" | V |
| staff | p | Egypt pricing: Rise 1, Growth 5, Professional "20 additional". More seats are sold as add-ons. | https://help.zid.sa/ar/store-settings/team; https://zid.eg/ar/pricing/ | "تشمل باقة زد لايت عضوًا واحدًا هو الحساب الرئيسي، وباقة النمو خمسة أعضاء" | V |
| export | y | Orders, products and customers export. | https://help.zid.sa/ar/products/import-export; https://help.zid.sa/ar/orders | "وتصدّر الطلبات إلى ملف أو تستوردها من جدول بيانات" | V |
| wallets | — | No Egyptian mobile wallet is named. | — | — | U |
| fawry | — | Fawry isn't mentioned. | — | — | U |
| bosta | p | A Bosta logo in "شركاؤنا في مصر" on zid.eg. There is no setup guide, and the help shipping pages list Saudi carriers. | https://zid.eg/ar/ | alt="Bosta" | V (logo only) |
| aiTranslate | p | Turning on English doesn't translate the store. Some fields have an AI translate button. | https://help.zid.sa/ar/settings/languages-currencies | "وفي بعض الحقول، كحقول صفحات المتجر، زرٌّ يترجم النص إلى اللغة الأخرى بالذكاء الاصطناعي." | V |
| aiImages | y | The free "ذكاء زد" app edits and replaces backgrounds and creates product photos. | https://help.zid.sa/ar/apps/zid-ai | "يحسّن تطبيق ذكاء زد صور منتجاتك بالذكاء الاصطناعي، ويغيّر خلفياتها" | V (Egypt not stated) |
| aiAssistant | y | "مساعد زد", a dashboard chat that makes changes after approval. It's in beta, free for a limited time. | https://help.zid.sa/ar/getting-started/ai-assistant | "ومساعد زد في مرحلته التجريبية ومجاني مدةً محدودة" | V |
| mcp | y | A free official MCP app (about 145 tools) for ChatGPT, Claude, Cursor, Codex and n8n. | https://help.zid.sa/ar/apps/mcp | "مثل ChatGPT وClaude وCursor وCodex وn8n" | V |
| aiLimits | p | A daily limit on AI sections, shown in the editor. The number isn't published. | https://help.zid.sa/ar/online-store/theme-editor | "وعدد الأقسام التي تنشئها بالذكاء الاصطناعي محدود كل يوم، وتعرض اللوحة ما بقي لك منها." | V |
| pos | p | "زد كاشير". The free Cashier Go needs Zid Payments, shown only for Saudi and Kuwait stores. Cashier Pro is a yearly licence. | https://help.zid.sa/ar/pos/plans | "وتشترط كاشير جو تفعيل مدفوعات زد في متجرك." | V (Egypt U) |
| mobileApp | y | Merchant app "تطبيق زد", listed in the Egypt App Store (ZID HOLDING LTD). | https://apps.apple.com/eg/app/id6443907047?l=ar | "زد - متجرك الإلكتروني في جوالك تجارتك معك في كل مكان" | V |

---

## Cost example: 500 orders a month (`COST_EXAMPLE_ORDERS`)

The page shows Tallaby's line (`comparePage.costTallaby`: `{freeAtVolume}` on Free or `{pro}` on Pro) and one line per competitor (`competitors.<id>.cost`). All amounts are before payment-gateway fees, shipping and apps. The only computed token is `eoAtVolume`, and it already existed (`VOLUME_PRICE_CENTS`). No other competitor has a single USD amount for 500 orders: Shopify depends on the card share of sales, WooCommerce is a published range, and ExpandCart and Zid are EGP list prices. Their lines use the published tokens, in words. **No new price or volume token was needed**, and every token used was already in `COMPETITOR_PRICES`, read today.

| Competitor | Inputs (all read 2026-11-10) | Line (en) |
|---|---|---|
| EasyOrders | Regular $0.04 per order, no cap: pricing.md "الباقة العادية — $0.04 /4 سنت لكل طلب"; Professional $100 a month: "$100 / شهرياً … بدون اي عمولة علي الطلبات". 500 × $0.04 = $20 (`eoAtVolume`). | EasyOrders: {eoAtVolume} in order fees on Regular, or {eoPro} on Professional with no order fee. |
| Shopify | Basic $27 a month billed monthly (/eg/pricing). Third-party fee 2% on Basic: "2% 3rd-party payment providers". COD is exempt: "Transaction fees don't apply for POS orders or for manual payment methods, which include cash on delivery (COD)". | Shopify: {shopifyBasic} on Basic, plus {shopifyGatewayFee} of every card or wallet order paid through Paymob, Kashier or another provider, on top of that provider's own fees. Cash-on-delivery orders pay no extra fee. |
| WooCommerce | woocommerce.com/pricing: "$25 – $350/month for most stores"; "$29 – $299/year per extension"; "0 % revenue share". | WooCommerce: no fee per order, but hosting costs {wooHostingMin} to {wooHostingMax} a month by its own estimate, plus {wooExtMin} to {wooExtMax} a year for each paid extension. |
| ExpandCart | Standard 599 EGP a month: "ستاندرد 7188 جنية 599 جنية / الشهر 5999 جنية / السنة". No order cap or per-order fee stated: "عمولة المبيعات 0% 0% 0% 0%". Standard allows up to 100 products: "إمكانية إضافة ما يصل إلى 100 منتج". | ExpandCart: {ecStandard} a month on Standard, with no fee per order and no sales commission. A bigger catalog needs a higher plan. |
| Salla | Basic is free with unlimited orders: salla.com/plans "عدد لا محدود من الطلبات". Basic takes only transfer and COD: "أما طرق الدفع الإلكترونية فهي متاحة ضمن الباقات المدفوعة فقط." Plus is SAR 99 a month (help article c4t9zj8…). | Salla: nothing on Basic, with no fee per order, but Basic takes only bank transfer and cash on delivery; card payments start on Plus at {sallaPlus} a month, plus the payment fees. A store needs Saudi papers, so it can't open from Egypt. |
| Zid | Starter is free for life with unlimited orders: zid.eg/ar/pricing "عدد غير محدود من المنتجات والطلبات والعملاء", "طرق دفع أساسية (تحويل بنكي، دفع عند الاستلام)". Rise is EGP 1,128.60 a month billed monthly, and online payment starts there: "إتاحة الدفع الإلكتروني". No per-order fee or cap stated. | Zid: nothing on Starter, with no fee per order, but Starter takes only bank transfer and cash on delivery; card payments start on Rise at {zidRise} a month, plus the payment fees. |
| Facebook page | No published price. A Page is free and its real cost is time. The block is skipped (`costExample: false`), and the competitor stays below `MIN_VERIFIED_FACTS` anyway. | — |

---

## Open points for the owner

1. **Shopify yearly price.** Today's fetch shows yearly $24 / $65 / $359; yesterday's WebFetch showed $19 / $54 / $299. The pages quote only the monthly prices, and the yearly cell says only "cheaper when billed yearly", with no number.
2. **EasyOrders evidence is thin on four rows.** `gatewayFees`, `staff` and `bosta` rest on its own blog (V-blog). `export` rests on a merchant comment on its roadmap, which suggests an orders sheet exists, while product export is still a request. The cells say where each fact comes from.
3. **ExpandCart's site is stale.** Nothing has changed since 2024-02, and its help center is unreachable. `fawry` (2022 page) and `bosta` (2020 page) are old, and the cells give the year. Its staff numbers contradict each other (cards vs table), and its trial is 14 or 15 days depending on the page.
4. **Zid's Egypt facts are partly Saudi.** Its fees for Egyptian payments, POS in Egypt and Egyptian wallets are U. Bosta is a logo only. `gatewayFees` cites the Saudi pricing FAQ, and the cell says so.
5. **Salla** is still not open to sellers in Egypt. Its Bosta app is the Saudi Bosta.
6. **U rows (no fact, so the row is hidden for that competitor):**
   - EasyOrders: yearly, multiStore, aiAssistant.
   - Shopify: fawry.
   - ExpandCart: multiStore, wallets, aiTranslate, aiImages, aiAssistant, mcp, aiLimits, mobileApp.
   - Salla: fawry.
   - Zid: trial, wallets, fawry.
7. **T rows (shown, not counted):**
   - Shopify: wallets (Kashier's app).
   - WooCommerce: wallets, fawry, bosta, aiTranslate, aiImages (plugins and extensions built by others).
   - Salla: aiImages.
8. **Re-read within 7 days of publishing** (SEO_PLAN §15 Phase 3). `compare-facts-age.test.ts` fails any fact older than 90 days.
