# 02: Global e-commerce competitors, researched for Tallaby (طلبي)

Researched 2026-11-09. Every fact below was **checked 2026-11-09** unless a row says otherwise. Sources are official pages first. A third-party source is used only when the official page was blocked or silent, and that row is labelled.

## How to read this

- **Verified**: an official vendor page (or the official developer of a plugin) says it, and we read it on 2026-11-09.
- **Third-party**: a reputable outside source says it, but no official page confirmed it.
- **Unverified**: we could not confirm it. The row says why (page blocked, region-specific, image-only, and so on).
- **Prices depend on where you are.** We checked from two places: (a) the user's machine, whose IP geolocates to **Egypt** (`ipinfo.io/country` = `EG`), using `curl`; and (b) the WebFetch tool, whose location is unknown. Several vendors (Shopify, Squarespace, Wix) show **regional prices**. A price "seen from Egypt" is what an Egyptian seller sees. It is not the US list price.
- Prices are USD per month unless stated. "Annual" means the per-month price when billed yearly.

### Facts that apply to many competitors (useful for Tallaby positioning)

| Fact | Value | Source | Date |
|---|---|---|---|
| Stripe available to Egyptian businesses? | **No.** Egypt is not on Stripe's supported-country list. UAE is. | https://stripe.com/global | checked 2026-11-09 |
| Shopify Payments in Egypt? | **No.** Egypt is not on the supported list (UAE is). Merchants outside the list must use a third-party provider. | https://help.shopify.com/en/manual/payments/shopify-payments/supported-countries | checked 2026-11-09 |
| WooPayments in Egypt? | **No.** It covers 38 countries; Egypt is not one (UAE is). | https://woocommerce.com/document/woopayments/compatibility/countries/ | checked 2026-11-09 |
| Squarespace Payments in Egypt? | **No.** It covers 15 countries (US, UK, CA, FR, IE, DE, BE, FI, NL, AT, IT, PT, ES, AU, NZ). | https://www.squarespace.com/payments | checked 2026-11-09 |
| Square payment processing in Egypt? | **No.** It covers AU, CA, FR, IE, JP, ES, UK and US only. "Sellers outside these countries can only accept external and cash payments." | https://developer.squareup.com/docs/international-development/payments | checked 2026-11-09 |
| Wix Payments in Egypt? | **No.** Wix's per-country list gives Egypt: PayPal, Kashier Payment Solutions, Paymentwall and Skrill Wallet. | https://support.wix.com/en/article/available-payment-providers-in-your-country | checked 2026-11-09 |
| Shopware Payments in Egypt? | **No.** Germany and Austria only, more EU countries and the US later. | https://docs.shopware.com/en/shopware-6-en/shopware-services/shopware-payments (search snippet; page not opened) | checked 2026-11-09 |
| PayPal for Egyptian sellers | Egyptian accounts can receive money, but withdrawals go only to a linked **Visa card issued in Egypt or a US bank account**. A third party says settlement is in USD. | https://www.paypal.com/eg/webapps/mpp/setup-to-receive-withdraw (official, via search snippet); settlement currency: https://payrequest.io/guides/accept-paypal-in-egypt (third-party) | checked 2026-11-09 |
| Paymob plugins (official docs) | Shopify, WooCommerce, OpenCart, Magento 2, Odoo, WHMCS, CS-Cart, ZenCart, osCommerce, Bagisto, Drupal, PrestaShop, Joomla, Staah, Xero (Xero is UAE only) | https://developers.paymob.com/paymob-docs/llms.txt | checked 2026-11-09 |
| Paymob for WooCommerce (Egypt) | Official plugin by Paymob, 5,000+ active installs, updated 2026-11-02 (v4.1.16). In Egypt: cards, wallets, bank instalments, Kiosk, and BNPL (ValU, Souhoola, Halan, Premium6, SYMPL, Aman, Forsa, MidTakseet). InstaPay "launching soon". | https://wordpress.org/plugins/paymob-for-woocommerce/ | checked 2026-11-09 |
| Kashier ecommerce plugins | Shopify, WooCommerce, Magento, OpenCart, Laravel (PrestaShop and Wix are in its developer docs) | https://kashier.io/en/payment-acceptance/ecommerce ; https://developers.kashier.io/docs/plugins | checked 2026-11-09 |
| Geidea ecommerce plugins | WooCommerce, PrestaShop, Magento 2, OpenCart. A Shopify docs page also exists. | https://docs.geidea.net/docs/e-commerce-plugins ; https://docs.geidea.net/docs/shopify | checked 2026-11-09 |
| Fawry official plugins | **Unverified.** We found no official FawryPay plugin for WooCommerce, Shopify or Magento, only third-party build-to-order ones (ECOSIRE; its Magento 2 module is "from $199"). Paymob's Egypt methods include "Kiosk", which is the Fawry/Aman-style cash network. | https://ecosire.com/apps/magento-2/magento2-fawry-gateway (third-party) | checked 2026-11-09 |
| Bosta official integrations | Shopify and WooCommerce plugins, plus an API | https://bosta.freshdesk.com/en/support/solutions/articles/36000414774-bosta-integrations | checked 2026-11-09 |

---

## 1. Shopify

| Field | Value | Source | Date |
|---|---|---|---|
| Official site | https://www.shopify.com | https://www.shopify.com | checked 2026-11-09 |
| Plans and prices, **as seen from Egypt** | Basic **$19 annual / $27 monthly**; Grow **$54 / $72**; Advanced **$299 / $399**; Plus from **$2,300/mo**. These came from `shopify.com/pricing` fetched from an Egyptian IP and by WebFetch, and `shopify.com/eg/pricing` shows the same (in Arabic, region "مصر \| العربية"). Prices are in **USD; no EGP pricing**. | https://www.shopify.com/eg/pricing ; https://www.shopify.com/pricing | checked 2026-11-09 |
| Regional pricing exists | Yes. The same day, `/ae/pricing` showed Basic $24 and Grow $69, and `/uk/pricing` showed £19 / £49 / £259. Third parties give the US list price as Basic **$29 annual / $39 monthly**, Grow $79 / $105. | curl of https://www.shopify.com/ae/pricing and /uk/pricing; US list price: https://www.bigcommerce.com/compare/bigcommerce-vs-shopify/ (BigCommerce quoting Shopify: Basic $39, Grow $105, Advanced $399 monthly) (third-party) | checked 2026-11-09 |
| Third-party payment provider fee (charged when not using Shopify Payments, which is **always the case in Egypt**) | Basic **2%**, Grow 1%, Advanced 0.6%, Plus 0.2% | https://www.shopify.com/pricing | checked 2026-11-09 |
| Manual payments / COD fee | COD is a manual payment method. "You aren't charged third-party transaction fees for manual payments." | https://help.shopify.com/en/manual/payments/manual-payments | checked 2026-11-09 |
| Shopify Payments in Egypt | Not available (see the shared facts above) | https://help.shopify.com/en/manual/payments/shopify-payments/supported-countries | checked 2026-11-09 |
| Free trial | "Try 3 days free, then $1/month for 3 months." No credit card needed for the trial. No free plan. | https://www.shopify.com/pricing | checked 2026-11-09 |
| Limits | Unlimited products on every plan. Staff accounts: Basic none extra, Grow 5, Advanced 15, Plus unlimited. 10 inventory locations (Plus 200). Marketplace orders: 50 synced orders a month free, then 1% (capped at $99/mo). | https://www.shopify.com/pricing | checked 2026-11-09 |
| Themes | 24 free themes; 1,342 paid (filter counts on the Theme Store) | https://themes.shopify.com/themes?price%5B%5D=free | checked 2026-11-09 |
| Builder | Section-based theme editor (not free-form drag and drop). Third-party (Wix's own comparison) describes Shopify themes as "section-based". | https://www.wix.com/blog/wix-vs-shopify (third-party / competitor) | checked 2026-11-09 |
| AI | **Sidekick**, "included with your Shopify plan; features and usage limits vary by plan". Roles: Designer (store design from an idea), Photo editor, Writer (product copy), Tech support, Marketer. Changelog Oct 2026: SimGym (tests storefront drafts with AI-simulated shoppers), transparent-background image generation, checkout configuration help. The `/magic` page no longer uses the "Shopify Magic" name. | https://www.shopify.com/magic | checked 2026-11-09 |
| Egypt payment gateways | **Paymob**: Shopify plugin in Paymob docs; embedded MENA card/wallet payments launched with Shopify in July 2024 (press). **Kashier**: "Kashier Online Payments" app, free, 3.0★ from 2 reviews (one 1★ reports "Error 400"). **Geidea**: Shopify docs page. **Paymob Agent**: e-receipts to the Egyptian Tax Authority (free for 100 receipts/mo, $20/mo Pro). | https://developers.paymob.com/paymob-docs/llms.txt ; https://thepaypers.com/payments-general/paymob-and-shopify-launch-embedded-payments-in-mena--1269400 (press) ; https://apps.shopify.com/kashier-online-payments ; https://docs.geidea.net/docs/shopify ; https://apps.shopify.com/paymob-tax-receipts-generator | checked 2026-11-09 |
| Gateway limit (community) | A Shopify Community thread says one store can't route Egyptian buyers to Paymob and Saudi buyers to another gateway; third-party gateways can't be set per market. | https://community.shopify.com/t/using-paymob-for-egypt-and-stripe-for-saudi-on-the-same-shopify-store/652384 (community; Unverified officially) | checked 2026-11-09 |
| Egypt shipping | **Bosta Shipping** app: by Bosta (Maadi, Cairo), free to install, **3.9★ from 24 reviews**, English only; syncs orders, schedules pickups, next-day COD transfers. Reviews are mixed ("failed to correctly sync orders"). **Aramex** app: free, **1.4★ from 13 reviews**; one reviewer from Egypt says it lacks HS-code invoices. | https://apps.shopify.com/bosta-shipping-app ; https://apps.shopify.com/aramex (via search) | checked 2026-11-09 |
| COD | Yes, as a manual payment method, with no Shopify transaction fee | https://help.shopify.com/en/manual/payments/manual-payments | checked 2026-11-09 |
| Arabic admin | **Yes.** Arabic is among about 49 admin languages, with regional variants (Egypt, KSA, UAE). | https://help.shopify.com/en/manual/your-account/languages | checked 2026-11-09 |
| RTL storefront | "The latest versions of themes in the Horizon family support right-to-left languages, such as Arabic." Other themes must be checked one by one. | https://help.shopify.com/en/manual/international/languages/requirements | checked 2026-11-09 |
| SEO / analytics / marketing | Not checked feature by feature on 2026-11-09 (Sidekick lists SEO product descriptions). Built-in analytics and Shopify Email are known features but were **Unverified** today. | https://www.shopify.com/magic | checked 2026-11-09 |
| Support | **Unverified** in detail. Shopify's compare pages advertise "24/7 support" as a differentiator. | https://www.shopify.com/compare/wordpress-vs-wix-vs-shopify | checked 2026-11-09 |
| Target market | Global SMB to enterprise (Plus). Egypt gets an Arabic, Egypt-region site with lower USD prices. | https://www.shopify.com/eg/pricing | checked 2026-11-09 |
| "vs" pages | 21 at shopify.com/compare: vs Etsy, Square, WooCommerce, Wix, WordPress, GoDaddy, Squarespace, Lightspeed, Clover, Salesforce, PrestaShop, BigCommerce, Webflow, Bluehost, HostGator, Poshmark, Adobe (Magento), Elementor; three-way: Squarespace vs Etsy vs Shopify, Squarespace vs Wix vs Shopify, WordPress vs Wix vs Shopify | https://www.shopify.com/compare | checked 2026-11-09 |

**For an Egyptian small seller:**
- *Pros:* the largest app and theme ecosystem; Arabic admin and RTL Horizon themes; regional USD pricing ($19/mo annual from Egypt); Paymob, Kashier and Geidea all integrate; Bosta and Aramex apps exist; COD carries no Shopify fee; Sidekick AI is included.
- *Cons:* no Shopify Payments in Egypt, so **every card or wallet order on Basic pays an extra 2%** on top of the gateway fee; billing is in USD on a foreign card; local apps are thinly reviewed (Kashier 2 reviews, Aramex 1.4★, Bosta 3.9★); COD confirmation, Egyptian governorate shipping zones and WhatsApp need apps; the trial is only 3 days, then $1/mo for 3 months.

---

## 2. WooCommerce (open source, WordPress)

| Field | Value | Source | Date |
|---|---|---|---|
| Official site | https://woocommerce.com | https://woocommerce.com | checked 2026-11-09 |
| Licence cost | **Free**, open source, no monthly subscription | https://woocommerce.com/pricing/ | checked 2026-11-09 |
| Typical real costs (official estimate) | Hosting **$25–$350/mo** for most stores; extensions **$29–$299/yr each**; sample stores: premium plugins ~$300 in year one, then $300–$500/yr; hosting ~$300–$10,000/yr | https://woocommerce.com/pricing/ | checked 2026-11-09 |
| Example paid extensions | WooCommerce Subscriptions **$279/yr** (30-day money-back); Aramex shipping extension **$79/yr** (listed in the search snippet) | https://woocommerce.com/products/woocommerce-subscriptions/ ; https://woocommerce.com/products/woocommerce-shipping-aramex/ (search snippet) | checked 2026-11-09 |
| Example themes | Storefront: **free**. Listed on the same page: Purple free, Nexora Shop **$59/yr**, NexByte **$49/yr** | https://woocommerce.com/products/storefront/ | checked 2026-11-09 |
| Managed hosting example (WordPress.com) | Business **$25/mo annual ($40 monthly)**, Commerce **$45/mo annual ($70 monthly)**; 0% standard WooCommerce payment fee on both. Plugins are allowed on every paid plan. (USD, seen by WebFetch.) | https://wordpress.com/pricing/ | checked 2026-11-09 |
| Domain cost | Not on the official Woo page. PrestaShop's guide puts a domain from about €10/yr, for reference. | https://prestashop.com/blog/resources/how-much-does-an-online-store-cost/ (search snippet) | checked 2026-11-09 |
| Transaction fees | **None from WooCommerce.** You pay only your processor (WooPayments ~2.5–2.9% + 30¢, which isn't available in Egypt). | https://woocommerce.com/pricing/ | checked 2026-11-09 |
| WooPayments in Egypt | No | https://woocommerce.com/document/woopayments/compatibility/countries/ | checked 2026-11-09 |
| Free plan / trial | The software is free forever. Hosting is the cost. | https://woocommerce.com/pricing/ | checked 2026-11-09 |
| Limits | No platform limit on products or orders; it depends on hosting. Woo's own comparison table lists "unlimited variants". | https://woocommerce.com/woocommerce-vs-shopify/ | checked 2026-11-09 |
| Builder | WordPress block editor and themes. Drag and drop depends on the theme or page builder. **Unverified** for a specific count of themes (the theme category page showed no listing to WebFetch). | https://woocommerce.com/product-category/themes/ | checked 2026-11-09 |
| AI | **No first-party AI** found. Many third-party AI description plugins exist (IntelliDesc, Digital Ebene AI, WebGears and others). | search results on wordpress.org (third-party) | checked 2026-11-09 |
| Egypt payment gateways | **Paymob** official plugin (details in the shared facts). **Geidea** official plugin on wordpress.org; it warns it hasn't been tested with the last 3 major WordPress releases. **Kashier** plugin. **Fawry**: third-party only. | https://wordpress.org/plugins/paymob-for-woocommerce/ ; https://wordpress.org/plugins/geidea-online-payments/ ; https://kashier.io/en/payment-acceptance/ecommerce | checked 2026-11-09 |
| Egypt shipping | **Bosta WooCommerce** (by bostateam: bulk send, bulk AWB print, status sync) and **Bosta Fulfillment** (stock sync). User reviews of Bosta WooCommerce report Arabic city/area mapping problems and PHP 8 issues. Aramex extension on woocommerce.com. | https://wordpress.org/plugins/bosta-woocommerce ; https://wordpress.org/plugins/bosta-fulfillment/ (search snippet) | checked 2026-11-09 |
| COD | **Yes, in core.** "Cash on Delivery (COD) is a payment gateway" in the free core plugin. Adding COD fees needs a paid extension. | https://woocommerce.com/document/woocommerce-features/cash-on-delivery/ | checked 2026-11-09 |
| Arabic admin / RTL | WordPress ships Arabic and RTL support. **Not re-verified today** on an official page; it is well-established WordPress behaviour. Mark it Unverified for the citation. | n/a | checked 2026-11-09 |
| SEO / analytics / marketing | Through plugins (Yoast, RankMath, etc.); not verified individually | n/a | checked 2026-11-09 |
| Support | The core relies on documentation and forums. Paid extensions include vendor support (as the Subscriptions page says). | https://woocommerce.com/products/woocommerce-subscriptions/ | checked 2026-11-09 |
| Target | WordPress users, developers and agencies worldwide | https://woocommerce.com/pricing/ | checked 2026-11-09 |
| "vs" pages | https://woocommerce.com/woocommerce-vs-shopify/ (claims $0 platform fee vs Shopify's tiers); https://woocommerce.com/posts/woocommerce-vs-shopify/ ; migration guides from Shopify | https://woocommerce.com/woocommerce-vs-shopify/ | checked 2026-11-09 |

**For an Egyptian small seller:**
- *Pros:* $0 licence and $0 platform commission; COD is built in; the best Egyptian plugin coverage (Paymob, Geidea, Kashier, Bosta); full ownership of data; Arabic WordPress.
- *Cons:* hosting, security, updates and backups are the seller's job; plugins cost money and can conflict with each other (the Bosta plugin's reviews show Arabic address-mapping problems); no first-party AI; there's no one to call when something breaks.

---

## 3. Wix

| Field | Value | Source | Date |
|---|---|---|---|
| Official site | https://www.wix.com | https://www.wix.com | checked 2026-11-09 |
| Plans (as seen by WebFetch; labelled "Price includes GST", so the locale is unknown but **not US**) | Free $0; Light **$17.77/mo**; Core **$29.77/mo**; Business **$39.77/mo**; Business Elite **$159.77/mo**, all yearly. Wix says prices "vary by location". | https://www.wix.com/plans ; https://www.wix.com/upgrade/website | checked 2026-11-09 |
| US list prices (third-party) | Light $17, Core $29, Business $39, Business Elite $159 (annual); monthly billing $24 / $36 / $46 / $172 | https://www.stylefactoryproductions.com/blog/wix-pricing (third-party) | checked 2026-11-09 |
| Price as seen from Egypt | **Unverified.** Prices load by script; the curl from Egypt got no plan prices (the page JSON said `"currency":"EUR"`). | curl of https://www.wix.com/plans | checked 2026-11-09 |
| Which plans can sell | Core, Business and Business Elite accept payments. Free and Light can't. Wix's ecommerce page: "plans range from $29 to $159 per month for eCommerce." | https://www.wix.com/plans ; https://www.wix.com/ecommerce/website | checked 2026-11-09 |
| Wix transaction fee | None stated on the pricing pages. You pay the payment provider's fee (for example Kashier in Egypt: **2.85% + EGP 3**, per Wix's Kashier help page). | https://support.wix.com/en/article/connecting-kashier-payment-solutions-as-a-payment-provider (search snippet) | checked 2026-11-09 |
| Free plan / trial | Free plan exists (no custom domain, can't take payments). **14-day money-back guarantee** on the first Premium upgrade. | https://www.wix.com/plans | checked 2026-11-09 |
| Limits | 50,000 products in the store catalog. Variant limits are 6 options, 100 choices and 1,000 variants (third-party). Collaborators: Light 2, Core 5, Business 10, Elite 100. Storage: 2 GB / 50 GB / 100 GB / unlimited. | https://support.wix.com/nl/article/wix-stores-limieten-en-aanbevolen-richtlijnen (Dutch official, via search) ; https://eseospace.com/blog/wix-product-variant-limits/ (third-party) ; https://www.wix.com/plans | checked 2026-11-09 |
| Builder / themes | Drag-and-drop free-form editor; "2000+ website templates"; "100s" of free store templates | https://www.wix.com/ecommerce/website | checked 2026-11-09 |
| AI | **Wix Harmony** (launched 21 Jan 2026): an AI plus drag-and-drop builder with the **Aria** agent, which builds and edits pages and can add commerce. **Astro**: AI business assistant in the dashboard. Store AI: AI image editor (background/object removal), AI product descriptions, AI product recommendations, AI image creator, Twik personalisation, "AI Visibility Overview" (tracks mentions in ChatGPT, Gemini and Perplexity), AI emails and captions. | https://www.wix.com/ecommerce/website ; Harmony: https://www.shopifreaks.com/wix-launches-harmony-ai-website-builder-with-natural-language-tools/ and https://www.techradar.com/pro/the-worlds-leading-website-builder-just-launched-an-ai-powered-agent-and-its-designed-to-help-grow-your-business (third-party) | checked 2026-11-09 |
| Egypt payment gateways | PayPal, **Kashier**, Paymentwall and Skrill. No Wix Payments, Paymob or Fawry (none found). | https://support.wix.com/en/article/available-payment-providers-in-your-country | checked 2026-11-09 |
| Egypt shipping | No Bosta or Aramex integration found. Bosta lists only Shopify, WooCommerce and its API. Wix advertises discounted shipping labels; country coverage was not checked. | https://bosta.freshdesk.com/en/support/solutions/articles/36000414774-bosta-integrations ; https://www.wix.com/ecommerce/website | checked 2026-11-09 |
| COD | **Yes.** Manual Payments with the title "Cash on delivery", on a plan that accepts payments. The seller must mark orders Paid by hand for stock to update. | https://support.wix.com/en/article/setting-up-manual-offline-payments (via search) | checked 2026-11-09 |
| Arabic admin | **No.** Wix's "Languages available" article lists the account and editor languages, and Arabic isn't among them. | https://support.wix.com/en/article/languages-available-in-wix | checked 2026-11-09 |
| RTL storefront | Partial. Wix Multilingual lets you make the menu, text and images RTL per language, but there is "no automatic mirroring" (layouts are fixed by hand, with multi-state boxes as a workaround). For Stores, "a change in writing direction will apply to all languages". | https://support.wix.com/en/article/creating-a-site-with-rtl-text-per-language ; https://support.wix.com/en/article/wix-multilingual-creating-a-multilingual-site-with-right-to-left-content | checked 2026-11-09 |
| SEO / analytics / marketing | SEO tools; real-time analytics and "AI-powered benchmarks"; email marketing, gift cards, paid ads, social, blog; multichannel (Google, eBay, Etsy, Amazon, Facebook, Instagram, TikTok, Wish); POS | https://www.wix.com/ecommerce/website | checked 2026-11-09 |
| Support | **Unverified** (channels not checked today) | n/a | checked 2026-11-09 |
| Target | Global SMB, creators and service businesses | n/a | checked 2026-11-09 |
| "vs" pages | wix.com/blog/wix-vs-shopify, /wix-vs-squarespace, /wix-studio-vs-shopify, /webflow-alternatives, /best-ecommerce-website-builders | https://www.wix.com/blog/wix-vs-shopify (via search) | checked 2026-11-09 |

**For an Egyptian small seller:**
- *Pros:* the most flexible drag-and-drop editor; a strong AI builder (Harmony/Aria); Kashier is supported in Egypt; COD through manual payments; a free plan for trying it out.
- *Cons:* **no Arabic dashboard**; RTL needs manual layout work; the cheapest plan that can sell is Core (~$29/mo); no Paymob, Fawry or Bosta; COD orders must be marked paid by hand.

---

## 4. BigCommerce

| Field | Value | Source | Date |
|---|---|---|---|
| Official site | https://www.bigcommerce.com | https://www.bigcommerce.com | checked 2026-11-09 |
| Plans (USD, excluding tax) | Core **$29 annual / $39 monthly** (sales up to $30K TTM); Growth **$79 / $105** (up to $100K); Scale **$299 / $399** (up to $33,333/mo, then 0.9% overage); Performance custom, from **$1,499/mo** billed yearly | https://www.bigcommerce.com/essentials/pricing/ | checked 2026-11-09 |
| Fees | "Open Payment Provider" fee: Core **2.0%**, Growth 1.0%, Scale 0.6%; **none for Embedded Payment Providers**. Card processing from 2.89% + $0.29 (Amex 3.50%). | https://www.bigcommerce.com/essentials/pricing/ | checked 2026-11-09 |
| Free trial | **15 days, no credit card** | https://www.bigcommerce.com/essentials/pricing/ | checked 2026-11-09 |
| Limits | Staff accounts on all plans (no number given). Inventory locations: Core 4, Growth 5, Scale 8. Up to 600 variant SKUs per product (BigCommerce's own vs page). Product limit and theme count not on the pricing page: **Unverified**. | https://www.bigcommerce.com/essentials/pricing/ ; https://www.bigcommerce.com/compare/bigcommerce-vs-shopify/ | checked 2026-11-09 |
| AI | **BigAI Copywriter** (product descriptions inside the v3 product editor; "Only English product descriptions are supported at this time"). Agentic-commerce positioning; GenAI feed tools through Feedonomics. | https://www.bigcommerce.com/apps/bigai-copywriter/ (via search) ; https://www.bigcommerce.com/blog/agentic-ai-product-pages/ | checked 2026-11-09 |
| Egypt payment gateways | **Fawry through Checkout.com** (needs Optimized One-Page Checkout, an Egyptian shopper address and EGP currency). The merchant would need a Checkout.com account; whether an Egyptian entity qualifies is **Unverified**. No Paymob, Kashier or Geidea app found. | https://support.bigcommerce.com/articles/en_US/Knowledge/Fawry (via search) | checked 2026-11-09 |
| Egypt shipping | No Bosta integration (Bosta lists only Shopify and Woo) | https://bosta.freshdesk.com/en/support/solutions/articles/36000414774-bosta-integrations | checked 2026-11-09 |
| COD | Yes. The offline methods include Cash on Delivery (with Bank Deposit, Check, Money Order and Pay in Store). The official article didn't render ("CSS Error"); confirmed from the search snippet of the official article. | https://support.bigcommerce.com/articles/en_US/Knowledge/Offline-Payment-Methods (via search) | checked 2026-11-09 |
| Arabic admin | **Unverified.** The control-panel locale list is on a Help Center page we couldn't retrieve. Auto-translated storefront languages are listed as French, German, Italian and Spanish variants. | https://support.bigcommerce.com/s/article/Localization-Settings?language=en_US (via search) | checked 2026-11-09 |
| RTL storefront | No official statement found. Theme vendors sell RTL themes (so it's theme-dependent). **Unverified.** | n/a | checked 2026-11-09 |
| Storefront languages | Up to 5 languages per channel | https://support.bigcommerce.com/s/article/Localization-Settings?language=en_US (via search) | checked 2026-11-09 |
| Target | Mid-market and B2B brands (its own vs page positions it for "complex B2B and multi-brand") | https://www.bigcommerce.com/compare/bigcommerce-vs-shopify/ | checked 2026-11-09 |
| "vs" pages | /compare/bigcommerce-vs-shopify/ ; /blog/shopify-alternatives/ ; /blog/woocommerce-alternatives/ ; /articles/ecommerce/ecommerce-platforms/ | https://www.bigcommerce.com/compare/bigcommerce-vs-shopify/ | checked 2026-11-09 |

**For an Egyptian small seller:**
- *Pros:* strong catalog and B2B features; a 15-day trial; COD offline method.
- *Cons:* no local gateway except Fawry through Checkout.com; Arabic admin and RTL unconfirmed; AI copy is English only; sales caps per plan; no Bosta; priced like Shopify's US list.

---

## 5. Squarespace

| Field | Value | Source | Date |
|---|---|---|---|
| Official site | https://www.squarespace.com | https://www.squarespace.com | checked 2026-11-09 |
| Plans **as seen from Egypt** (curl from an EG IP; WebFetch saw the same) | **Three plans only**: Basic **$12 annual ($144/yr) / $19 monthly**; Core **$17 / $27** ($204/yr); Advanced **$25 / $36** ($300/yr). USD. | https://www.squarespace.com/pricing | checked 2026-11-09 |
| US list prices (third-party) | Four plans (Basic, Core, Plus, Advanced). Sources disagree; one verified 2026-11-05 gives monthly $25 / $39 / $65 / $139. "Plus is available only where Squarespace Payments is supported", which explains why Egypt sees no Plus. | https://costbench.com/software/cms/squarespace/ ; https://beancount.io/blog/2026/09/17/squarespace-new-pricing-basic-core-plus-advanced-small-business-guide (third-party) | checked 2026-11-09 |
| Transaction fees | Online store: Basic **2%**, Core 0%, Advanced 0%. Digital content: 7% / 5% / 0%. | https://www.squarespace.com/pricing | checked 2026-11-09 |
| Free trial | **14 days, no credit card**. No free plan. | https://www.squarespace.com/pricing | checked 2026-11-09 |
| Limits | "No limit to the number of products". Basic lacks discounts, carrier-calculated shipping and labels. | https://www.squarespace.com/pricing | checked 2026-11-09 |
| Builder / themes | Structured grid editor. Templates: "just over 190" (third-party); Wix says 180+. | https://www.squarespace.com/blog/weebly-alternatives (via search, third-party claim) | checked 2026-11-09 |
| AI | **Blueprint AI** (guided site generator), AI copywriter for pages, products and email, SEO scanner, "Design Intelligence" | https://www.squarespace.com/blog/blueprint-ai-website-builder ; https://www.squarespace.com/blog/guide-to-squarespace-ai-tools | checked 2026-11-09 |
| Payments in Egypt | Squarespace Payments: no. Stripe: no (Egypt unsupported). **PayPal only** remains, with the Egypt withdrawal limits above. No Paymob, Kashier or Fawry. | https://www.squarespace.com/payments ; https://stripe.com/global | checked 2026-11-09 |
| Egypt shipping | None found | n/a | checked 2026-11-09 |
| COD | **No native COD** found. Only workarounds (a 100% discount code), from a third party. | https://www.sqspthemes.com/blog/the-invoicecod-workaround (third-party) | checked 2026-11-09 |
| Arabic admin | **No.** Arabic isn't among the supported interface or site languages. | https://support.squarespace.com/hc/en-us/articles/360000177507-Changing-your-account-and-site-language (via search) | checked 2026-11-09 |
| RTL | **No built-in RTL.** "Text blocks don't support scripts or text written Right-to-Left (RTL)." | https://support.squarespace.com/hc/en-us/articles/360000308127-Writing-in-your-language (via search) | checked 2026-11-09 |
| Target | Creatives, service businesses, small design-led stores (US/EU) | n/a | checked 2026-11-09 |
| "vs" pages | Blog "alternatives" pages: /blog/weebly-alternatives, /blog/square-websites-alternatives, /blog/framer-alternatives, /blog/best-ai-website-builder, /blog/best-small-business-website-builder | https://www.squarespace.com/blog/square-websites-alternatives | checked 2026-11-09 |

**For an Egyptian small seller:** it's polished and cheap from Egypt ($12/mo annual), but in practice it doesn't work for selling in Egypt: no Arabic, no RTL, no COD, and PayPal is the only way to get paid.

---

## 6. Adobe Commerce (Magento) and Magento Open Source

| Field | Value | Source | Date |
|---|---|---|---|
| Official site | https://business.adobe.com/products/magento/magento-commerce.html (Adobe Commerce); Magento Open Source on GitHub | Adobe product pages **timed out** for WebFetch on 2026-11-09 | checked 2026-11-09 |
| Adobe Commerce price | **Not published** (quote-based, tied to GMV). Third-party estimates range from ~$22,000/yr (under $1M revenue) to $40,000–$190,000/yr for Cloud. **Unverified officially.** | https://www.mgt-commerce.com/blog/magento-license-cost/ ; https://ecommerce.folio3.com/blog/?p=8953 (third-party) | checked 2026-11-09 |
| Magento Open Source | Free, no licence fee (third-party consensus; the Adobe page timed out) | https://www.mgt-commerce.com/blog/magento-license-cost/ (third-party) | checked 2026-11-09 |
| Real costs (Open Source) | Hosting, development and security patching. Example paid Egyptian extension: ECOSIRE Fawry module for Magento 2 "from $199" one-time (third-party, build-to-order). Marketplace prices weren't shown to WebFetch. | https://ecosire.com/apps/magento-2/magento2-fawry-gateway ; https://commercemarketplace.adobe.com/ | checked 2026-11-09 |
| COD | **Yes, built in**: "Cash On Delivery Payment" is a basic method, with Check/Money Order and Bank Transfer | https://experienceleague.adobe.com/en/docs/commerce-admin/config/sales/payment-methods/payment-methods | checked 2026-11-09 |
| AI (Adobe Commerce) | Summit 2026 (third-party summary): Commerce Developer Agent, Commerce MCP Server, native **Brand Concierge** (conversational shopping); AI catalog enrichment; support for agentic standards UCP and ACP (Adobe blog) | https://business.adobe.com/blog/adobe-commerce-summit-announcements ; https://business.adobe.com/au/blog/adobe-commerce-commits-to-agentic-commerce-standards ; https://stellagent.ai/insights/adobe-commerce-summit-agentic-upgrades (third-party) | checked 2026-11-09 |
| Egypt gateways | Paymob Magento 2 module (Paymob docs: `composer require paymob/magento-payment`); Geidea Magento 2; Kashier Magento | https://developers.paymob.com/paymob-docs/llms.txt ; https://docs.geidea.net/docs/e-commerce-plugins ; https://kashier.io/en/payment-acceptance/ecommerce | checked 2026-11-09 |
| Egypt shipping | No official Bosta module found | https://bosta.freshdesk.com/en/support/solutions/articles/36000414774-bosta-integrations | checked 2026-11-09 |
| Arabic / RTL | Community Arabic language pack (Mageplaza, may be partial). Storefront RTL through themes and CSS. No official Arabic RTL admin found. **Unverified.** | https://packagist.org/packages/mageplaza/magento-2-arabic-language-pack ; https://www.mgt-commerce.com/tutorial/magento-rtl-language-support/ (third-party) | checked 2026-11-09 |
| Target | Enterprise and large catalogs; developer-led | n/a | checked 2026-11-09 |
| "vs" pages | Not found on Adobe's site (pages timed out). Shopify targets it with /compare/shopify-vs-adobe. | https://www.shopify.com/compare | checked 2026-11-09 |

**For an Egyptian small seller:** not realistic. It needs developers and serious hosting. Payment modules exist (Paymob, Geidea, Kashier) and COD is built in, but the total cost of ownership is far above a small seller's budget.

---

## 7. PrestaShop

| Field | Value | Source | Date |
|---|---|---|---|
| Official site | https://prestashop.com | https://prestashop.com | checked 2026-11-09 |
| Offers | **Classic**: free download (hosting, domain etc. not included). **Hosted**: **€24/mo** billed yearly (€290/yr) or **€29/mo** with no commitment, excl. VAT, **14-day free trial** | https://prestashop.com/prestashop-offers/ ; https://prestashop.com/prestashop-offers/hosted/ | checked 2026-11-09 |
| Hosted revenue cap | A forum user says the €24 plan is capped at €1,000/mo turnover, with €65 and €150 tiers above it. **Unverified** (no official page says so). | https://forum.prestashop.com/topic/1100911-prestashop-hosted-is-%E2%82%AC24-monthly-plan-really-capped-at-%E2%82%AC1000-turnover/ | checked 2026-11-09 |
| Commission | None on sales (open source) | https://prestashop.com/blog/resources/what-is-the-price-of-a-prestashop-store-in-2025/ (via search) | checked 2026-11-09 |
| Real costs | Domain from about €10/yr (PrestaShop's guide). Themes on PrestaShop Addons are roughly **$69.99–$114.99** (e.g. "Sketchy" $99.99 excl. VAT); modules e.g. €49.99–€69.99. The Addons site returned 403 to WebFetch, so these figures come from search snippets. | https://addons.prestashop.com/en/electronics-computers-themes/24770-sketchy-modern-super-store.html (search snippet) | checked 2026-11-09 |
| COD | Official open-source module `ps_cashondelivery` ("Accept cash payments on delivery"), PrestaShop 8.2+ | https://github.com/PrestaShop/ps_cashondelivery | checked 2026-11-09 |
| Arabic / RTL | "Support for RTL languages is native in both the Back Office and the Front Office"; Arabic packs come from PrestaShop's translation server. An old GitHub issue (#23156, 1.7.8 develop) reported the back office staying in English when set to Arabic. | https://devdocs.prestashop-project.org/9/development/internationalization/rtl/ ; https://github.com/PrestaShop/PrestaShop/issues/23156 | checked 2026-11-09 |
| Egypt gateways | Paymob PrestaShop plugin; Kashier PrestaShop plugin; Geidea PrestaShop | https://developers.paymob.com/paymob-docs/integration-paths/plugins/prestashop ; https://developers.kashier.io/docs/plugins/prestashop ; https://docs.geidea.net/docs/e-commerce-plugins | checked 2026-11-09 |
| Egypt shipping | No Bosta module found | n/a | checked 2026-11-09 |
| AI | None found in official sources. **Unverified.** | n/a | checked 2026-11-09 |
| Target | European SMBs (strong in France and Spain); developers | n/a | checked 2026-11-09 |
| "vs" pages | https://prestashop.com/prestashop-vs-woocommerce/ ; https://prestashop.com/prestashop-vs-shopify/ ; the Magento comparison is linked from the nav | https://prestashop.com/prestashop-vs-woocommerce/ | checked 2026-11-09 |

**For an Egyptian small seller:**
- *Pros:* free; native Arabic RTL in both admin and store; COD module; Paymob, Kashier and Geidea plugins.
- *Cons:* self-hosting and technical upkeep; paid themes and modules in USD/EUR; no Bosta; small Egyptian community.

---

## 8. OpenCart

| Field | Value | Source | Date |
|---|---|---|---|
| Official site | https://www.opencart.com (returned **403** to both WebFetch and curl on 2026-11-09) | https://www.opencart.com | checked 2026-11-09 |
| Cost | Free, open source. Latest GitHub release **4.1.0.4** (marked Latest). The licence wasn't visible on the releases page (it is GPLv3 per the repo; not re-verified). | https://github.com/opencart/opencart/releases | checked 2026-11-09 |
| Real costs | Hosting: third-party OpenCart hosting from ~$2.99–$4/mo (shared) up to ~$9–$44/mo (cloud plans at Cloud Clusters). Themes on ThemeForest/TemplateMonster ~**$34–$59**. All third-party. | https://geekchamp.com/products/cloud-clusters-opencart/ ; https://themeforest.net/category/ecommerce/opencart (third-party) | checked 2026-11-09 |
| COD | **Yes, core**: `cod.php` ships in the core payment extensions (with bank_transfer, cheque and free_checkout) | https://github.com/opencart/opencart/tree/master/upload/extension/opencart/catalog/controller/payment | checked 2026-11-09 |
| Arabic / RTL | Community Arabic packs (including 4.x) and an "RTL Admin" extension (for 2.x, needs vQmod). Not core. **Third-party.** | https://discover.commoninja.com/opencart/extension/43876 ; https://discover.commoninja.com/opencart/extension/20317 | checked 2026-11-09 |
| Egypt gateways | Paymob OpenCart plugin; Geidea OpenCart (4.0.2.0+); Kashier OpenCart | https://developers.paymob.com/paymob-docs/integration-paths/plugins/opencart ; https://docs.geidea.net/docs/opencart ; https://kashier.io/en/payment-acceptance/ecommerce | checked 2026-11-09 |
| Egypt shipping | No Bosta extension found | n/a | checked 2026-11-09 |
| AI | None official found | n/a | checked 2026-11-09 |
| "vs" pages | None found (site blocked) | n/a | checked 2026-11-09 |

**For an Egyptian small seller:** cheap and light, with COD in core and three Egyptian gateways. But Arabic and RTL depend on community packs, the official site is hard to reach, there's no AI and no Bosta, and it needs a developer.

---

## 9. Ecwid (by Lightspeed)

| Field | Value | Source | Date |
|---|---|---|---|
| Official site | https://www.ecwid.com | https://www.ecwid.com | checked 2026-11-09 |
| Plans (USD) | Starter **$5/mo** (10 products, website only); Venture **$29 annual / $35 monthly** (100 products + e-goods, Instagram and Facebook); Business **$49 / $65** (2,500 products, marketplaces, 2 staff); Unlimited **$119 / $149** (unlimited products, POS, unlimited staff) | https://www.ecwid.com/pricing | checked 2026-11-09 |
| Free plan | **None listed** (all four plans are paid). Ecwid's 2026 changelog says plan pricing changed after 2 March 2026. The old free plan's status is therefore **Unverified** beyond what the pricing page shows. | https://www.ecwid.com/pricing ; https://support.ecwid.com/hc/en-us/articles/25228352598812-Ecwid-updates-2026 (via search) | checked 2026-11-09 |
| Free trial | None mentioned (nonprofits: 6 months of Venture free) | https://www.ecwid.com/pricing | checked 2026-11-09 |
| Transaction fees | **0 on every plan** | https://www.ecwid.com/pricing | checked 2026-11-09 |
| AI | AI product descriptions (since Feb 2025), AI translation of products, AI SEO meta, AI section builder from a screenshot or text, Instant Site AI text assistant (beta, May 2026), AI background removal | https://www.ecwid.com/ai-ecommerce ; https://support.ecwid.com/hc/en-us/articles/25228352598812-Ecwid-updates-2026 (via search) | checked 2026-11-09 |
| Egypt gateways | Paymob lists Ecwid among its plugin platforms (Paymob marketing). Not found in Paymob's developer docs list. **Unverified.** | https://www.paymobsolutions.com/en/online-payment (via search) | checked 2026-11-09 |
| COD | Not checked today. **Unverified.** | n/a | checked 2026-11-09 |
| Arabic admin | **Unverified.** The admin language list on Ecwid's help article is an image; the help centre returned 403 to WebFetch. Admin and store languages are separate. | https://support.ecwid.com/hc/en-us/articles/207101579-Choosing-language-of-your-Ecwid-admin | checked 2026-11-09 |
| Storefront languages | "Over 50 languages" (Ecwid blog); Arabic availability is third-party only | https://www.ecwid.com/blog/sell-around-the-globe-with-a-fully-multilingual-storefront.amp ; https://istizada.com/?p=17083 (third-party) | checked 2026-11-09 |
| Target | Small sellers adding a store to an existing site or social channels | https://www.ecwid.com/pricing | checked 2026-11-09 |

**For an Egyptian small seller:**
- *Pros:* the cheapest entry ($5) and 0% transaction fees.
- *Cons:* Starter allows only 10 products; Egyptian gateways, COD and Arabic admin are unconfirmed; no Bosta.

---

## 10. Webflow Ecommerce

| Field | Value | Source | Date |
|---|---|---|---|
| Official site | https://webflow.com | https://webflow.com | checked 2026-11-09 |
| Ecommerce plans (USD, billed yearly, per site) | Standard **$29/mo** (500 items, **2%** transaction fee); Plus **$74/mo** (5,000 items, 0%); Advanced **$212/mo** (15,000 items, 0%). Staff accounts 3 / 10 / 15. Monthly-billing prices weren't extracted: **Unverified**. | https://webflow.com/pricing (curl from Egypt) | checked 2026-11-09 |
| Free | The free Starter site plan has no ecommerce checkout (ecommerce needs an ecommerce plan) | https://webflow.com/pricing | checked 2026-11-09 |
| Payments | Stripe or PayPal only. The fee is "in addition to Stripe or PayPal processing fees". Stripe isn't available in Egypt. An old Webflow post lists Egypt among the PayPal-enabled store countries (about 7 years old). | https://webflow.com/pricing ; https://webflow.com/blog/paypal-for-ecommerce (old) | checked 2026-11-09 |
| COD | **No native COD.** A Webflow staff forum reply says they "don't have features supporting cash on delivery"; the wishlist request is open. | https://discourse.webflow.com/t/cash-on-delivery-ecommerce/144827 ; https://wishlist.webflow.com/ideas/WEBFLOW-I-1742 | checked 2026-11-09 |
| AI | "Webflow AI" and an MCP server listed on site plans; AI SEO/AEO audits; AI generation of CMS items; Webflow Optimize (AI A/B testing, $299+/mo add-on) | https://webflow.com/pricing | checked 2026-11-09 |
| Arabic | Localization (from $9/mo add-on) sets the site's text direction for Arabic (community answer). The Designer interface is English; localising it is a long-open wishlist request. **Unverified** officially. | https://discourse.webflow.com/t/support-for-rtl-languages-such-as-arabic/180416 ; https://wishlist.webflow.com/ideas/WEBFLOW-I-139 | checked 2026-11-09 |
| Egypt gateways / shipping | None | n/a | checked 2026-11-09 |
| Target | Designers, agencies, marketing sites | n/a | checked 2026-11-09 |

**For an Egyptian small seller:** not suitable. No COD, no local gateway, Stripe isn't available in Egypt, and the interface is English only.

---

## 11. Shopware

| Field | Value | Source | Date |
|---|---|---|---|
| Official site | https://www.shopware.com | https://www.shopware.com | checked 2026-11-09 |
| Editions | **Community Edition** free (€0; you need a paid plan after €1M GMV over 365 days); **Rise** from **€600/mo** excl. VAT (first 30 days free); **Evolve** from €2,400/mo; **Beyond** custom. Paid pricing is GMV-based. | https://www.shopware.com/en/pricing/ | checked 2026-11-09 |
| AI | AI-assisted content creation from Rise up. **Intelligence+** add-on (+$19 or +$29/mo depending on tier) adds unlimited Copilot agentic tasks and data insights. | https://www.shopware.com/en/pricing/ | checked 2026-11-09 |
| COD | **Yes.** Cash on delivery, invoice, prepayment and direct debit are active by default. | https://docs.shopware.com/en/shopware-6-en/settings/paymentmethods | checked 2026-11-09 |
| Payments in Egypt | Shopware Payments covers Germany and Austria only. No Paymob, Kashier or Geidea plugin found. | https://docs.shopware.com/en/shopware-6-en/shopware-services/shopware-payments (search snippet) | checked 2026-11-09 |
| Arabic / RTL | The official free Language Pack has 30 languages and **no Arabic**. RTL is not native (an open feedback request; the only RTL pack found is a third-party Hebrew one for 6.2–6.4). | https://store.shopware.com/en/swag338126230916/shopware-language-pack.html ; https://feedback.shopware.com/forums/942607-shopware-6-product-feedback-ideas/suggestions/45644878-support-rtl-languages | checked 2026-11-09 |
| Target | DACH/EU mid-market and enterprise, B2B | https://www.shopware.com/en/pricing/ | checked 2026-11-09 |

**For an Egyptian small seller:** not suitable. No Arabic, no RTL, no Egyptian gateway, and paid plans start at €600/mo. The free Community Edition still needs developers.

---

## 12. Square Online

| Field | Value | Source | Date |
|---|---|---|---|
| Official site | https://squareup.com/us/en/online-store | https://squareup.com/us/en/online-store/plans | checked 2026-11-09 |
| Plans (US) | Square **Free $0**; **Plus $49/mo** per location; **Premium $149/mo** per location; Square Pro custom (over $250K/yr) | https://squareup.com/us/en/online-store/plans (curl) | checked 2026-11-09 |
| Online card fee | Free plan **3.3% + 30¢**; Plus and Premium **2.9% + 30¢** | https://squareup.com/us/en/online-store/plans (curl) | checked 2026-11-09 |
| Availability | Payment processing in AU, CA, FR, IE, JP, ES, UK and US only. **Not Egypt.** | https://developer.squareup.com/docs/international-development/payments | checked 2026-11-09 |
| COD | No native COD for online orders (community; a feature request is open) | https://community.squareup.com/t5/Feature-Requests/Cash-on-Delivery-for-Online-Orders/idi-p/724946 | checked 2026-11-09 |
| AI | "Square AI" appears on the plans page (details not extracted). **Unverified.** | https://squareup.com/us/en/online-store/plans | checked 2026-11-09 |
| Arabic | None found | n/a | checked 2026-11-09 |
| Target | US/UK/AU restaurants and retail with POS | n/a | checked 2026-11-09 |

**For an Egyptian small seller:** not available. Egyptian sellers can't process payments with Square.

---

## Summary comparison matrix

V = Verified (official page, checked 2026-11-09). T = third-party only. U = Unverified. Prices in USD/mo, annual billing, unless stated.

| Competitor | Cheapest paid plan | Free plan | Platform transaction fee on cheapest plan (Egypt reality) | COD | Arabic admin | Egypt payment gateways | AI builder | Themes |
|---|---|---|---|---|---|---|---|---|
| Shopify | $19 annual / $27 monthly as seen from Egypt (US list $29/$39 T) (V) | No; 3-day trial, then $1/mo for 3 months (V) | **2%** on Basic, because Shopify Payments isn't in Egypt; 0% on COD/manual (V) | Yes, manual (V) | **Yes** (V) | Paymob, Kashier, Geidea (V) | Sidekick "Designer" plus AI copy and photos; no one-prompt full store builder claimed (V) | 24 free, 1,342 paid (V) |
| WooCommerce | $0 software; hosting $25–$350/mo (Woo estimate) or WordPress.com Business $25 (V) | Software free (V) | 0% platform fee (V) | Yes, core (V) | Yes, via WordPress (U; not re-cited) | Paymob, Geidea, Kashier official plugins (V) | No first-party AI (V: none found) | Storefront free; paid ~$49–$59/yr (V) |
| Wix | Core ~$29 (first plan that sells; WebFetch saw $29.77 incl. GST) (V; local price U) | Yes, but it can't take payments (V) | None stated; provider fee only (Kashier 2.85% + EGP 3) (V) | Yes, manual "Cash on delivery" (V) | **No** (V) | Kashier, PayPal, Paymentwall, Skrill (V) | **Yes**: Harmony + Aria (T), Astro (T) | 2,000+ templates, 100s of store templates (V) |
| BigCommerce | Core $29 / $39 (V) | No; 15-day trial (V) | 2% via an open provider; 0% via embedded (V) | Yes (V via snippet) | U | Fawry via Checkout.com only (V; eligibility U) | No builder; BigAI Copywriter (English only) (V) | U |
| Squarespace | Basic $12 annual / $19 monthly as seen from Egypt (V) | No; 14-day trial (V) | 2% on Basic (V); only PayPal works from Egypt | **No** (T) | **No** (V) | None (V) | Blueprint AI (V) | ~190 (T) |
| Adobe Commerce / Magento OS | Commerce: quote-based (U, est. $22K+/yr T); Open Source free (T) | Open Source free (T) | 0% platform fee (T) | Yes, core (V) | Community pack only (T) | Paymob, Geidea, Kashier modules (V) | Brand Concierge, Developer Agent (T/V blog); not an SMB builder | Marketplace (U) |
| PrestaShop | Hosted €24 annual / €29 monthly excl. VAT (V) | Classic free (V) | 0% commission (V) | Yes, official module (V) | **Yes**, native RTL in back office (V) | Paymob, Kashier, Geidea (V) | None found (U) | Paid ~$70–$115 (T) |
| OpenCart | $0 software; hosting from ~$3/mo (T) | Software free (V) | 0% (V) | Yes, core (V) | Community packs (T) | Paymob, Geidea, Kashier (V) | None (U) | ~$34–$59 third-party (T) |
| Ecwid | Starter $5 (10 products) (V) | None listed in 2026 (V) | 0% (V) | U | U | Paymob claims Ecwid support (T/U) | AI section builder, AI copy (V via changelog) | U |
| Webflow Ecommerce | Standard $29 annual (V) | No ecommerce on Starter (V) | 2% on Standard, plus Stripe/PayPal (V) | **No** (V forum staff) | **No** (U; English UI) | None (V) | Webflow AI, MCP, AEO (V) | U |
| Shopware | Rise from €600 (V); Community Edition free (V) | Community Edition free (up to €1M GMV) (V) | GMV-based (V) | Yes, default (V) | **No** Arabic pack (V) | None (V/U) | AI content (Rise+); Copilot add-on (V) | U |
| Square Online | Plus $49 per location (V) | Yes, US only (V) | 3.3% + 30¢ on Free (V) | No (T) | No (U) | Not available in Egypt (V) | "Square AI" (U) | U |

### What this means for Tallaby's SEO and positioning (inferences from the data above, not vendor claims)

1. **"Arabic dashboard" is a real differentiator.** Wix, Squarespace and Shopware have none. BigCommerce, Ecwid and Webflow are unconfirmed. Only Shopify and PrestaShop (and WordPress) offer it.
2. **"COD built in, no fee"** beats Squarespace, Webflow and Square (none), and Wix and Shopify (manual, with no confirmation flow).
3. **"No 2% surcharge because the gateway isn't Shopify Payments"** applies to Shopify Basic, BigCommerce Core, Squarespace Basic and Webflow Standard, all of which add a platform fee on Egyptian card/wallet orders.
4. **Local logistics:** Bosta officially integrates only with Shopify and WooCommerce, and both plugins have mixed reviews.
5. **Comparison keywords competitors already target:** "shopify vs wix", "shopify vs woocommerce", "woocommerce vs shopify", "wix vs squarespace", "bigcommerce vs shopify", "prestashop vs woocommerce", "prestashop vs shopify", "shopify alternatives", "woocommerce alternatives", "square online alternatives", "webflow alternatives". Tallaby could target the Arabic and Egypt versions: "بديل شوبيفاي", "شوبيفاي ولا ووكومرس", "متجر الكتروني في مصر الدفع عند الاستلام".

### Gaps left Unverified (and why)

- Wix local price from Egypt: prices load by script. Wix support channels.
- BigCommerce Arabic admin: the locale list page wasn't retrievable. RTL statement and theme count.
- Ecwid Arabic admin (the language list is an image; the help centre returned 403 to WebFetch), Ecwid COD, Ecwid Paymob plugin.
- Adobe Commerce official pricing and pages (timed out). Magento Marketplace prices.
- PrestaShop Addons and opencart.com (403). The PrestaShop Hosted turnover cap.
- Webflow monthly ecommerce prices and Designer UI languages. Square AI details.
- Shopify support channels and the analytics/marketing feature list were not rechecked today.
