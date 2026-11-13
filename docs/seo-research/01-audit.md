> **Note (2026-11-09, later the same day):** two findings here are already fixed on main: the grace-period copy (commit 8ca4dab0) and the blog price calculator's old EGP 5 fee (commit 28e4dd08). See SEO_PLAN.md §2 for the current state.

# tallaby.com SEO audit: what exists today (input for SEO_PLAN.md)

Read-only audit of `F:\Programming Projects\tallaby` on `main` (HEAD `8ca4dab0`, 2026-11-09, clean tree). Nothing was edited, built or run. All paths are relative to `apps/ecommerce/` unless they start with `packages/`, `docs/` or a root file name.

Sources read: `CLAUDE.md`, `docs/marketing-site-rules.md`, `docs/seo-audit-tallaby-com.md` (F-53a, 2026-11-03), `ROADMAP.md` (F-53, F-70e, §2.x, §7 log 2026-11-04 to 11-09), `MARKETING_PROJECT.md` §18, `docs/research/salla-seller-experience.md`, `docs/marketing/features-ar.md`, plus all of `lib/marketing/*`, `components/marketing/**`, `app/[locale]/(marketing)/**`, `app/sitemap.ts`, `app/robots.ts`, `lib/sitemap/robots.lib.ts`, `i18n/*`, `next.config.mjs`, `redirects.mjs`, `proxy.ts` (excerpt).

---

## 0. Key takeaways

1. **The SEO page system is already in place, but each content type has only 1 page.** There is one solution, one industry, one feature, one integration detail page and one tool. Compare has 4 competitors, but they are hidden (`COMPARE_PUBLIC = false`). In each case, adding a page means adding **one entry to a `*.lib.ts` array plus one message block in each of `ar`/`en`**. The sitemap, footer, static params and guard tests then pick it up automatically.
2. **There are no hub/index pages** for `/solutions`, `/industries`, `/features` or `/tools`. Breadcrumbs show a hub label with no link (`crumbHub`), and the BreadcrumbList leaves that level out. Only `/integrations` and `/compare` have hubs (`HubPageFrame` + `HubListing`).
3. **Page templates are tied closely to their first page.** For example, `SolutionPageView` always renders the clothing industry mock store. `DetailPageView` supports only `shot: "domain" | "pixel"` and 8 step visuals. `MarginToolPage` is hard-wired to one tool through a map. The `/tools/[slug]` route needs a component per tool. New feature or industry pages will need new visuals, or a more generic variant.
4. **Blog content comes from the DB** (`platform_blog_posts`, written in Admin › Blog). A code fallback in `lib/marketing/blog.data.ts` holds 7 posts, and only `pricing-products` has a body. The 2026-11-03 audit counted one indexable post. The DB count was not checked here, because the audit is read-only and has no DB access.
5. **Two host and indexing problems are open** and wait on the owner. **S-01**: the canonical host is apex or www, and today they disagree (307 apex→www while the env is apex). **S-06**: whether compare pages are public. **S-07**: whether training crawlers are blocked.
6. **Prices must never be hard-coded.** Copy uses `{orderFee}`, `{pro}`, `{topUpMin}`, `{topUpMax}`, `{days}` and the competitor tokens `{eoOrderFee}`, `{eoPro}`, `{shopifyMin}`, `{shopifyMax}`. They render through `withPrices()` / `PRICE_TOKENS`: ≈ EGP in the server HTML, the visitor's currency on the client. JSON-LD and meta use the EGP values with `isolate: false`.

---

## 1. Route inventory

All routes live under `app/[locale]/(marketing)/`. Locales are `["en","ar"]`, with `defaultLocale: "ar"`, `localePrefix: "as-needed"` and `localeDetection: false` (`i18n/routing.ts`). Arabic URLs have no prefix and English URLs start with `/en`. Slugs are English in both languages, and there are no Arabic-script slugs.

### 1.1 Static pages (`(site)/…`, header, footer and fog from `(site)/layout.tsx`)

| Route | File | Meta key | In sitemap (lastmod) | JSON-LD on page |
|---|---|---|---|---|
| `/` | `(site)/page.tsx` (`revalidate = 60`) | `home` (absoluteTitle) | yes, 2026-11-09 | `ProductJsonLd page="home"` (SoftwareApplication) |
| `/pricing` | `pricing/page.tsx` | `pricing` | 2026-11-08 | SoftwareApplication + BreadcrumbList |
| `/templates` | `templates/page.tsx` | `templates` | 2026-11-06 | none |
| `/templates/[id]` | `templates/[id]/page.tsx` (`generateStaticParams` from the gallery) | `template` (`{name}`, `{category}`) | yes, no lastmod | BreadcrumbList |
| `/blog` | `blog/page.tsx` | `blog` | 2026-11-06 | none |
| `/blog/[slug]` | `blog/[slug]/page.tsx` (no static params; resolved on demand, cached) | post's own SEO title/desc | yes if `hasArticle` and not `noindex`; lastmod = `updatedAt ?? date` | BlogPosting + BreadcrumbList |
| `/faq` | `faq/page.tsx` | `faq` | 2026-11-04 | FAQPage |
| `/about` | `about/page.tsx` | `about` | 2026-11-04 | none |
| `/affiliates` | `affiliates/page.tsx` | `affiliates` | 2026-11-04 | FAQPage |
| `/careers` | `careers/page.tsx` | `careers` | 2026-11-04 | none |
| `/contact` | `contact/page.tsx` | `contact` | 2026-11-06 | none |
| `/terms`, `/privacy` | `terms/page.tsx`, `privacy/page.tsx` (`LegalPage`) | `terms`, `privacy` | 2026-11-09 | none |
| `/follow-us` | `(marketing)/follow-us/page.tsx`: **outside `(site)`**, so it has no header or footer | `followUs` | 2026-11-04 | none |
| `/integrations` | `integrations/page.tsx` (`HubPageFrame` + `HubListing`) | `integrations` | `CONTENT_PAGES_LASTMOD` 2026-11-06 | ItemList + BreadcrumbList |

Every page also gets Organization and WebSite (`siteGraph()` in `(site)/layout.tsx`). `/follow-us` does not, because it sits outside `(site)`.

### 1.2 Dynamic content routes (all `dynamicParams = false`, `generateStaticParams` from the code list)

| Route | File | Data list (file) | Slugs today | Component | Message block | Meta key |
|---|---|---|---|---|---|---|
| `/solutions/[slug]` | `solutions/[slug]/page.tsx` | `SOLUTIONS` (`lib/marketing/solutions.lib.ts`) | `create-online-store` | `SolutionPageView` (`components/marketing/solutions/solution-page.tsx`) | `solutionPages.<slug>` + `solutionPages.shared` in **`keywords.<loc>.json`** | `solution-<slug>` |
| `/industries/[slug]` | `industries/[slug]/page.tsx` | `INDUSTRIES` (`lib/marketing/industries.lib.ts`) | `clothing-store` | `IndustryPageView` (`components/marketing/industries/industry-page.tsx`) | `industryPages.<slug>` + `industryPages.shared` + `storeKinds` in `industries.<loc>.json` | `industry-<slug>` |
| `/features/[slug]` | `features/[slug]/page.tsx` | `FEATURE_PAGES` (`lib/marketing/detail-pages.lib.ts`) | `custom-domain` | `DetailPageView` (`components/marketing/features/detail-page.tsx`) | `detailPages.<slug>` + `contentPages` in `features.<loc>.json` | `feature-<slug>` |
| `/integrations/[slug]` | `integrations/[slug]/page.tsx` | `INTEGRATION_PAGES` (same file) | `meta-pixel` | `DetailPageView` | `detailPages.meta-pixel` in `integrations.<loc>.json` | `integration-<slug>` |
| `/tools/[slug]` | `tools/[slug]/page.tsx` (local `TOOL_PAGES` map slug → component) | `TOOL_SLUGS` (`lib/marketing/tools.lib.ts`) | `profit-margin-calculator` | `MarginToolPage` (`components/marketing/tools/margin-tool-page.tsx`) | `toolPages.<slug>` in `tools.<loc>.json` | `tool-<slug>` |
| `/compare` | `compare/page.tsx` | `publishableCompetitors()` | hub | `HubPageFrame` + `HubListing` | `compareHub` in `compare.<loc>.json` | `compare` |
| `/compare/[slug]` | `compare/[slug]/page.tsx` | `COMPETITORS` (`lib/marketing/compare.lib.ts`), slug = `tallaby-vs-<id>` | `tallaby-vs-easyorders`, `tallaby-vs-shopify`, `tallaby-vs-woocommerce`, `tallaby-vs-facebook-only` | `ComparePageView` (`components/marketing/compare/compare-page.tsx`) | `comparePage` + `competitors.<id>` | `compare-entry` (`{name}`) |

**Built but not routed:** the "Blog Ranking" ("best X platforms") layout, `components/marketing/blog-ranking/ranking-article.tsx` (`RankingArticleView`) with data type `RankingArticle` in `lib/marketing/ranking.lib.ts` and copy `blogRanking` in `keywords.<loc>.json`. It emits ItemList and FAQPage. ROADMAP §7 2026-11-04 says it "needs sourced facts".

**Other non-marketing routes on the tallaby.com host:** `/shipping`, `/returns`, `/payment` and `/cookies` are old marketplace pages, served with `X-Robots-Tag: noindex, follow` on `(www.)tallaby.com` (`next.config.mjs`). `/dev-library` is noindex, nofollow, noarchive, and `/template-preview/*` is noindex. Redirects in `redirects.mjs` send `/become-seller` and `/sell` → `/` (308), `/help` → `/faq` (307), `/affiliate` → `/affiliates` (307) and `/onboarding` → dashboard.

### 1.3 Every slug and item in the data lists

- **SOLUTIONS:** `create-online-store` (trust ×4, features ×8, related → `/integrations`, `/templates`, `/pricing`, `/tools/profit-margin-calculator`).
- **INDUSTRIES:** `clothing-store` (`templateCategory: "fa"`, photo `/fashion.png`, needs `variants | gallery | countdown | catalog`, 4 demo products).
- **STORE_KIND_LINKS** (`industries.lib.ts`, the "متجر …" chips): `clothing` → `/industries/clothing-store`; `beauty` → `/templates?category=be`; `electronics` → `?category=el`; `home` → `?category=ho`; `food` → `?category=fo`; `jewelry` → `?category=jw`; `kids` → `?category=ki`; `shoes` → `?category=fa`; `gifts` → `?category=ge`. Note that `?category=` is client-side only and canonicalizes to `/templates`.
- **FEATURE_PAGES:** `custom-domain` (`shot: "domain"`, steps `registrar, connect, dns, status`).
- **INTEGRATION_PAGES:** `meta-pixel` (`shot: "pixel"`, events `PageView, ViewContent, AddToCart, InitiateCheckout, Purchase, Lead`).
- **TOOL_SLUGS:** `profit-margin-calculator`.
- **INTEGRATION_ITEMS** (`lib/marketing/integrations-hub.lib.ts`, `/integrations` cards; only `meta-pixel` links to a detail page via `integrationHref`):
  - ship: `bosta`★, `wassalha`, `riders`, `aramex` (soon), `jt` (soon), `mylerz` (soon)
  - pay: `paymob`★, `kashier`, `cod`, `transfer` (InstaPay / Vodafone Cash)
  - ads: `meta-pixel`★, `ga4`, `gtm`, `tiktok-pixel` (soon), `snap-pixel` (soon)
  - catalog: `meta-catalog`, `gmc`, `tiktok-catalog`
  - data: `sheets`, `shopify` (import)
  - messaging: `whatsapp` (soon)
  - Categories: `INTEGRATION_CATEGORIES = ship, pay, ads, catalog, data, messaging`. Status follows `packages/lib/src/integrations/registry.ts`, where `tiktok_pixel` and `snapchat_pixel` are `availability: "soon"`, and `meta_pixel`, `meta_capi`, `google_sheets`, `shopify_import`, `bosta`, `paymob`, `kashier` and `wassalha` are `available`.
- **COMPETITORS:** `easyorders`, `shopify`, `woocommerce`, `facebook-only` (§2).
- **Blog:** DB `platform_blog_posts` (migration `0073`), read by `listPublishedPlatformPosts` / `getPublishedPlatformPost` (`@workspace/lib/platform-blog/server`) through `createCachedQuery` (`marketing:platform-blog-posts:v1`, tag `marketingBlogTags.posts()`, purged on every Admin save). When the table has no post for the locale, or can't be read, the code falls back to `BLOG_POSTS` in `lib/marketing/blog.data.ts`: `pricing-products` (has an article), `first-100-orders`, `phone-photos`, `dms-to-store`, `cod-vs-online`, `seo-basics`, `discount-codes`. The last six have no article, so they are filtered out of the index and sitemap. Blog categories: `guides, growth, stories, payments, product`. A DB post holds both languages in one row; a locale with an empty title isn't shown; `langs` limits hreflang; `seo.noindex` keeps a post out of the sitemap and adds robots noindex. `/blog/[slug]` resolves slugs on demand, and `PLATFORM_BLOG_SLUG_RE` guards them.
- **Templates:** `CODE_TEMPLATES` in `packages/store-sections/src/templates/catalog.ts` holds **119 templates** (Classic + 118 `LIBRARY_TEMPLATES`, counted from the array). `offeredTemplates()` in `packages/lib/src/store-sites/template-rows.server.ts` serves them, cached as `marketing:template-catalog:v3` (`perDeploy`). Gallery codes (`TEMPLATE_CATEGORIES` in `lib/marketing/templates.data.ts` + `CATEGORY_CODES` in `templates.lib.ts`), approximate counts from the template folders: `fa` 14 (fashion 13 + shoes-bags 1), `el` 11, `be` 12 (perfume niche templates are filed as beauty), `ho` 18 (home 12 + kitchen 6; furniture niche = home), `fo` 14 (food 12 + sweets 2; grocery niche = food), `jw` 10, `ki` 8, `sp` 14, `au` 10, `ac` 2 (mobile-accessories), `ge` 6 (general 1 + handmade 4, which includes the gifts niche, + books 1). That gives about **238 template URLs** in the sitemap across both locales.

### 1.4 How a new page gets added (per type)

| Type | Steps |
|---|---|
| Solution | 1. Push `{ slug, trustIcons[n], featureIcons[n], related[{href,icon}] }` to `SOLUTIONS`. 2. Add `solutionPages.<slug>` (crumb, title with `<em>`, lead, `dashboard{…}`, trust[], introTitle, intro[], stepsTitle, steps[], features[], costTitle, cost[{label,tallaby,other}], faqTitle, faq[], related[], closingTitle) to **both** `keywords.ar.json` and `keywords.en.json`. 3. Add `meta.solution-<slug>` (title ≤ 62 chars including the "| طلبي/Tallaby" suffix, description 50–165). Array lengths must match the icon arrays (`content-messages.test.ts`). |
| Industry | Push to `INDUSTRIES` (needs `templateCategory`, a photo in `public/` with no people, `needs[]` visuals limited to `variants/gallery/countdown/catalog`, `stepIcons`, `productFocus`, `productColors`). Add `industryPages.<slug>` (store mock words, needs, steps, callouts, floats, checks, faq…) + `meta.industry-<slug>` in `industries.<loc>.json`. Point the matching `STORE_KIND_LINKS` chip at the new page. |
| Feature / integration | Push a `DetailPage` (`kind`, `slug`, `icon`, `shot`, optional `benefits`/`uses`/`events`, `steps`, `related`) to `FEATURE_PAGES` / `INTEGRATION_PAGES`. Add `detailPages.<slug>` to `features` / `integrations` messages + `meta.feature-<slug>` / `meta.integration-<slug>`. A new `shot` or `step` visual needs code in `components/marketing/features/detail-shots.tsx` (today only `domain`, `pixel` and 8 step visuals). |
| Tool | Add the slug to `TOOL_SLUGS`, a component to the `TOOL_PAGES` map in `tools/[slug]/page.tsx`, `toolPages.<slug>` + `meta.tool-<slug>`. |
| Competitor | Add a `Competitor` with at least `MIN_VERIFIED_FACTS` (4) cells and `sources`, plus `competitors.<id>` (name, priceNote, verdict[], strengths[], cells{same keys}) in `compare.<loc>.json`. Competitor prices go into `COMPETITOR_PRICES` + `PRICE_NAMES` / `MarketingPriceVars` in `lib/marketing/pricing.lib.ts`, never into copy. |
| Blog post | Written in the Admin app (Blog) → `platform_blog_posts`. No deploy is needed. |
| **New top-level segment** (e.g. `/alternatives`, `/guides`) | Add the folder **and** its name to `MARKETING_SEGMENTS` in `lib/marketing/locale-landing.lib.ts` (a test checks the folder list), add the paths to `contentPagePaths()` or `STATIC_PAGE_LASTMOD`, and add any new message group to `MARKETING_GROUPS` in `i18n/messages.ts`. Strings read by client components must also be listed in `MARKETING_CLIENT_NAMESPACES` (`i18n/client-messages.lib.ts`). |

Automatic once a page is in a list: sitemap (`contentPagePaths()` in `lib/marketing/content-routes.lib.ts`), static params, and the guard tests. (The footer "Solutions" column was built from the lists too, until it became a short hand-picked list on 2026-11-13.)

---

## 2. Compare pages: `lib/marketing/compare.lib.ts`

- **`COMPARE_PUBLIC = false`.** Owner decision S-06 / F-70e is pending ("Add the owner's competitor research to Compare, then turn on `COMPARE_PUBLIC`"). While it's false, `compareRobots()` returns `{ index: false, follow: false }` for `/compare` and `/compare/*`, `contentPagePaths()` leaves them out of the sitemap, and the footer hides the link (`site-footer.tsx` line 34). The pages still render with status 200, so they work as hidden previews.
- **`publishableCompetitors()`** keeps only competitors with at least `MIN_VERIFIED_FACTS = 4` cells. **`findCompetitorBySlug()`** works over that list, and **`comparisonTable()`** shows only rows that have a verified competitor value and drops empty groups. A competitor whose cell for a row is missing hides that row; there is no "unknown" cell.
- **Data model:** `Competitor { id, category: "eg"|"global"|"other", featured?, latin, factsCheckedOn, cells: Partial<Record<CompareRowId, "y"|"n"|"p">>, sources[] }`. Row text lives in `competitors.<id>.cells.<row>`.
- **`COMPARE_GROUPS`** (Tallaby's own value): pricing (`freePlan` y, `monthly` y, `salesShare` y, `limits` y), setup (`signup` y, `noCode` y, `import` y, `domain` y), design (`templates` y, `changeTemplate` y, `bilingual` y), payments (`cod` y, `cards` y, `transfer` y, `installments` **n**), shipping (`carriers` y, `riders` y, `zones` y), marketing (`email` y, `feeds` y, `apps` **p**), support (`support` y), language (`language` y, `currencies` **n**).
- **Comments in code:** "Salla, Zid, YouCan and ExpandCart are left out until someone supplies theirs [sources]."
- **`ComparePageView` sections:** trail → hero "Tallaby or {name}" with `checkedOn` date → verdict (choose Tallaby if / choose {name} if) → priceNote → table → strengths of both → "How to move" (3 steps) → FAQ (price, move, domain, try, methods, how; FAQPage JSON-LD) → other comparisons → closing CTA.

### 2.1 Stored competitor facts (verbatim, for reuse)

**Competitor prices** (`COMPETITOR_PRICES`, USD cents, shown only through tokens): `easyOrdersOrderFeeCents: 4` ($0.04 per order), `easyOrdersProCents: 10_000` ($100 a month), `shopifyMinCents: 500` ($5), `shopifyMaxCents: 39_900` ($399).

**EasyOrders** (`eg`, featured, checked 2026-10-28). Cells: `freePlan y, monthly y, noCode y, cards y, carriers y, feeds y, currencies y`.
- Sources: "MARKETING_PROJECT.md §18 reference platforms (19 Oct 2026)"; "ROADMAP.md §2.2 (easyorders.eg, read 2026-10-28)" → https://www.easyorders.eg/
- Cell copy (en): freePlan "A free plan at {eoOrderFee} per order"; monthly "A Pro plan at {eoPro} a month"; noCode "Advertises a store in under 10 minutes, with no code"; cards "Advertises more than 15 payment gateways"; carriers "Advertises more than 100 shipping companies"; feeds "Meta catalog and Google Shopping"; currencies "Advertises selling in more than 10 countries".
- Strengths: wide shipping and payment network (100+ carriers, 15+ gateways); upsell and quantity offers are core; selling in 10+ countries.
- MARKETING_PROJECT.md §18 also says: "Store in less than 10 minutes, no coding"; free plan $0.04/order, Pro $100/month; 15+ payment gateways, 100+ shipping companies, Meta catalog + Google Shopping, "Easy AI"; big social-proof numbers; free marketing support. Its advice: "Don't compare per-order fees (theirs is lower)". Note that this was written when Tallaby charged EGP 5. Today Tallaby's $0.03 is below EasyOrders' $0.04, but MARKETING_PROJECT.md hasn't been updated.
- ROADMAP §2.2 (2026-10-28, now partly out of date on the Tallaby side): EasyOrders has a "Yes, core" fake-order blocker, upsell/quantity offers and product landing page + quick COD checkout; leads (abandoned checkout); manual orders; invoices; 100+ carriers; feeds; app with push; AI analysis; 10+ countries; no email campaigns, gift cards or loyalty. EasyOrders public roadmap: https://roadmap.easyorders.ai/ar (read 2026-10-28, re-read 2026-11-06, 129 cards). Top requests by votes: deposit % (64), print invoice (36), abandoned cart reminders (35), order of product options (29), store credit (22), export products to Excel (21), two-language store (16), governorate areas dropdown (16).

**Shopify** (`global`, featured, checked 2026-10-28). Cells: `monthly y, salesShare p, email y, feeds y, apps y, currencies y`.
- Sources: MARKETING_PROJECT.md §18; "ROADMAP.md §2.2 (shopify.com/pricing, read 2026-10-28)" → https://www.shopify.com/pricing
- Copy: monthly "Plans from {shopifyMin} to {shopifyMax} a month"; salesShare "Transaction fees can apply, depending on the plan"; email "Available"; feeds "Available"; apps "A large app store, with some paid apps"; currencies "Available through Markets". priceNote: "plans ran from {shopifyMin} to {shopifyMax} a month (priced in dollars…), and transaction fees and paid apps can come on top."
- §18: "$5–$399/month + transaction fees + paid apps, English-first".

**WooCommerce** (`global`, checked 2026-10-19). Cells: `freePlan p, noCode p, domain p, apps y`. Source: MARKETING_PROJECT.md §18 only, with no URL.
- Copy: freePlan "The plugin is free, and you pay for hosting, a domain, a theme and plugins"; noCode "Needs WordPress setup, hosting and maintenance, and often a developer"; domain "You buy your own domain and hosting"; apps "Many plugins, some of them paid".

**Facebook page only** (`other`, featured, checked 2026-11-04). Cells: `freePlan y, domain n, templates n, carriers n, zones n`. Source: "What a plain Facebook page is: no store of its own. Not a competitor's published claim."
- Copy: freePlan "The page itself is free"; domain "No store link of your own"; templates "One page layout, set by Facebook"; carriers "No shipping company connections"; zones "You agree shipping with each customer in messages".

**Salla** (no compare entry). `docs/research/salla-seller-experience.md` (F-59a, sources read 2026-11-03, help.salla.sa articles S1–S10) covers setup, not pricing. Usable facts: signup asks for legal entity details; eligibility is "Saudi nationality or an investor residency, and age 18 or over" (S1); online payment needs store verification and a Plus or Pro plan (S2, S9); the app store sells apps, some with monthly prices; the launch path leads to "أول 5 مبيعات مدفوعة" (S4).

**Not researched anywhere in the repo:** Zid, YouCan, ExpandCart, Wuilt, Matajer, Shopify Egypt pricing in EGP, Wix, Squarespace, Big Commerce, Taager, Dukan, Zammit, Lightfunnels and similar. The ~14-competitor plan will need fresh sourced research for each of them.

### 2.2 Tallaby's side of the compare rows (en, verbatim; reusable on feature and alternatives pages)
freePlan "No monthly subscription, and {orderFee} per order. Orders from day one; a first top-up from {topUpMin} within {days} days or at your first order, whichever comes first, keeps new orders visible." · monthly "Pro at {pro} a month, with no order fee" · salesShare "We take no share of the order value" · limits "No limit on either plan, and up to 3 stores" · signup "With email or a Google account" · noCode "Every step is visual, from design to publishing" · import "From Excel, a product link or Shopify" · domain "A free address, and free connection of your own domain on your main store" · templates "Templates for each category, each in Arabic and English" · changeTemplate "Any time, without losing products or orders" · cod "On for every store from the start" · cards "Through your own Paymob or Kashier account, with fees charged by the provider" · transfer "The customer transfers to your account and uploads a screenshot" · installments "Not available yet" · carriers "Bosta with waybills from the dashboard, and a ready-made sheet for Wassalha" · riders "Manage riders and assign orders" · zones "You set them for each area" · email "500 emails a month on Free, 10,000 on Pro" · feeds "One link for Meta, Google Merchant Center and TikTok" · apps "No. Integrations are ready to connect from the Apps page" · support "WhatsApp and email" · language "Arabic and English" · currencies "One currency per store, Egyptian pounds by default".

---

## 3. Metadata

- **`pageMetadata({ locale, page, path, values?, absoluteTitle? })`** in `lib/marketing/metadata.lib.ts` reads `meta.<page>.title` and `.description`. It returns `title` (plain, so the layout template applies; `absoluteTitle` for home), `description`, `alternates.canonical = localizedUrl(locale, path)`, `alternates.languages = hreflangMap(path)` (ar, en, x-default→ar), OpenGraph (`type: website`, siteName, `ar_EG` / `en_US` + alternateLocale, url, title, description, image) and Twitter (`summary_large_image`, `site: @usetallaby`).
- **`localizedUrl` and `hreflangMap`** are in `lib/marketing/seo.lib.ts`. Arabic → `${SITE_URL}${path}`, English → `${SITE_URL}/en${path}`, and the home page has no trailing slash.
- **Title template:** `(marketing)/layout.tsx` sets `title: { default: meta.home.title, template: meta.titleTemplate }`, `metadataBase: new URL(SITE_URL)`, the description and the icons. `meta.titleTemplate` is `"%s | طلبي"` / `"%s | Tallaby"` in `messages/{ar,en}.json` (line 2049). Marketing `meta.*` keys merge over the base ones (`loadAllMessages` → `deepMergeMessages`).
- **Title and description rules** are enforced in `lib/marketing/seo.lib.test.ts`: full title ≤ 62 chars, description 50–165, no repeated brand, same pages in both locales.
- **OG image:** one static `public/og-image.jpg` (1200×630, Latin logo on teal) for every page (`DEFAULT_OG_IMAGE`). There are **no `opengraph-image` / `twitter-image` routes** in the app. Exceptions: blog posts use `seo.ogImage` or the cover; template pages use their thumbnail (the earlier audit says `thumbnailUrl` is empty, so they fall back to the logo). The 2026-11-03 audit flagged the lack of an Arabic or per-page share image as owner work.
- **Current titles (meta key → ar | en):** home "طلبي | منشئ متاجر إلكترونية بالذكاء الاصطناعي، مجانًا" | "Tallaby | Free AI online store builder"; templates "قوالب متاجر إلكترونية جاهزة ومجانية" | "Free online store templates"; template "قالب متجر {name}: {category}" | "{name} store template: {category}"; pricing "الأسعار | خطتان واضحتان دون نسبة من المبيعات" | "Pricing | Two simple plans, no percentage of sales"; blog "مدونة البيع أونلاين في مصر" | "Blog: selling online in Egypt"; faq "الأسئلة الشائعة عن إنشاء متجرك الإلكتروني" | "Online store FAQ and help center"; compare "مقارنات طلبي بالمنصات الأخرى" | "Tallaby compared with other platforms"; compare-entry "طلبي مقابل {name}" | "Tallaby vs {name}"; feature-custom-domain "ربط نطاق خاص بمتجرك" | "Connect your own domain to your store"; industry-clothing-store "إنشاء متجر ملابس إلكتروني باحترافية" | "Create a professional online clothing store"; integrations "التكاملات: ربط متجرك بالشحن والدفع والتسويق" | "Integrations: shipping, payments and marketing"; integration-meta-pixel "ربط متجرك بـ Meta Pixel" | "Connect your store to Meta Pixel"; solution-create-online-store "إنشاء متجر إلكتروني دون مبرمج" | "Create an online store without a developer"; tool-profit-margin-calculator "حاسبة هامش الربح للمتجر الإلكتروني" | "Profit margin calculator for online stores". The pricing title produces a double separator ("الأسعار | … | طلبي").
- **Blog post metadata** (`blog/[slug]/page.tsx`) starts from `pageMetadata("blog")`, then overrides the title and description (SEO fields → title/excerpt), the hreflang (only the post's `langs`, x-default → ar if present) and robots (noindex when `seo.noindex` or there's no body), and sets OG `type: article` with published and modified times and tags.
- **Root layout** `app/[locale]/layout.tsx` sets `metadataBase` from `BASE_URL` (`lib/constants.ts`, falling back to localhost). The marketing layout overrides it with `SITE_URL`.
- **No Search Console verification tag** exists in code (`verification` isn't used on marketing). It must be verified by DNS. There is no `llms.txt`.

---

## 4. Structured data

Helpers: `lib/marketing/structured-data.lib.ts` and `components/marketing/site/json-ld.tsx` (`JsonLd`, `ProductJsonLd`). `serializeJsonLd` escapes `<`. Code comment: "never add ratings, reviews or user counts here unless they are real and visible".

| Schema | Where | Source |
|---|---|---|
| Organization (`@id ${SITE_URL}/#organization`, name Tallaby, alternateName طلبي, logo `/logo-mark.png`, sameAs 8 socials, ContactPoint email/phone, areaServed EG, ar/en) + WebSite (`/#website`, inLanguage ar/en, no SearchAction) | every `(site)` page | `siteGraph()` in `(site)/layout.tsx` |
| SoftwareApplication (BusinessApplication, Web; offers Free price 0 + UnitPriceSpecification per order, Pro monthly `P1M`; **priced in EGP at the live rate** from `FREE_ORDER_FEE_USD_CENTS` / `PRO_MONTHLY_USD_CENTS`) | `/` and `/pricing` | `ProductJsonLd` → `softwareApplicationSchema` |
| BreadcrumbList | pricing, templates/[id], blog/[slug], and every page that uses `PageTrail` (solutions, industries, features, integrations detail, tools, compare hub and entry, integrations hub through `HubPageFrame`) | `breadcrumbSchema()`; `PageTrail` in `components/marketing/pages/content-blocks.tsx` (a hub item without `href` is left out of the data) |
| FAQPage | `/faq`, `/affiliates` (inline), and every page that uses `FaqBlock` (solution, industry, feature/integration, compare entry, tool) | `faqSchema()` in `content-blocks.tsx` (price tokens filled in EGP, bidi stripped) |
| BlogPosting (author Person or Organization, publisher Organization `@id`) | `/blog/[slug]` | inline in the route |
| ItemList | `/integrations` (live items), ranking article (unrouted) | inline / `rankingItemList()` |
| WebApplication (free Offer, EGP) | `/tools/profit-margin-calculator` | inline in `margin-tool-page.tsx` |

Not emitted anywhere: HowTo, Article for non-blog content pages, Product/AggregateRating, VideoObject, SearchAction, ItemList on `/templates`, and an industry-specific schema.

---

## 5. Sitemap, robots, canonical host, locale

- **`app/sitemap.ts`** (Next metadata route) contains `STATIC_PATHS` (the keys of `STATIC_PAGE_LASTMOD`), `contentPagePaths()`, every gallery template (`/templates/<id>`, no lastmod) and blog posts that have a body and aren't noindex (each post lists only its locales). Each entry comes from `sitemapEntries(path, locales, lastmod)`: one row per language with full alternates and x-default. `app/sitemap.xsl/route.ts` styles it.
- **`lib/marketing/sitemap.lib.ts`** keeps hand-maintained dates in `STATIC_PAGE_LASTMOD`: `/` 2026-11-09, `/templates` 11-06, `/pricing` 11-08, `/affiliates` 11-04, `/blog` 11-06, `/about` 11-04, `/careers` 11-04, `/contact` 11-06, `/faq` 11-04, `/terms` 11-09, `/privacy` 11-09, `/follow-us` 11-04. `CONTENT_PAGES_LASTMOD = "2026-11-06"` covers all content pages unless they're listed. Rule from the comment: bump a date only when the page's copy really changes.
- **How content pages enter:** only through `contentPagePaths()`, which lists `/integrations`, then features, integration details, tools, industries and solutions, then (`/compare` + publishable competitors) only if `COMPARE_PUBLIC`. A new segment needs a line added there. The test `content-routes.lib.test.ts` checks for no duplicates and that compare is excluded while off.
- **noindex mechanics:** compare uses `compareRobots()` in `generateMetadata`. Blog uses `robots: { index:false, follow:true }` when `seo.noindex` or there's no body, and those posts are also left out of the sitemap. Old marketplace pages and dev-library get `X-Robots-Tag` headers in `next.config.mjs`.
- **robots:** `app/robots.ts` → `marketplaceRobots(SITEMAP_BASE_URL)` (`lib/sitemap/robots.lib.ts`). `*` is allowed except `PRIVATE_PATHS` (`/cart`, `/profile`, `/onboarding`, `/auth`, `/wishlist`, `/orders/`, plus their `/en` copies), `/admin/`, `/dashboard/`, `/api/` and `/private/`. **`TRAINING_CRAWLERS = ["GPTBot","ClaudeBot","anthropic-ai","CCBot"]` are disallowed on `/`** across the whole host. That rule (`crawlRules`) is shared with store hosts, and S-07 is the owner decision to allow them on marketing. AI search bots (OAI-SearchBot, ChatGPT-User, Claude-SearchBot, PerplexityBot) fall through to `*` and are allowed. The file includes `Sitemap:` and `Host:` lines.
- **Host canonical (S-01, open):** `SITE_URL` (`lib/marketing/site.lib.ts`) = `NEXT_PUBLIC_SITE_URL` || (production ? `https://www.tallaby.com` : localhost). `SITEMAP_BASE_URL` (`lib/constants.ts`) = `BASE_URL || "https://www.tallaby.com"`. As measured on 2026-11-03 and 2026-11-05 (`docs/seo-audit-tallaby-com.md` §1; ROADMAP §7 2026-11-05), production `NEXT_PUBLIC_SITE_URL` is the **apex**, while Vercel serves **www** and `https://tallaby.com` returns a **307** to www. So every canonical, hreflang, og:url, sitemap `<loc>` and robots `Sitemap:` points at a redirect. The recommendation is to make the apex primary with a 308 from www and change both code fallbacks to the apex, or to set the env to www. It's still listed as "waiting on the owner" (ROADMAP §7 2026-11-09).
- **Locale switch:** `components/marketing/site/locale-switch.client.tsx` renders a real `<a>`, so the link is crawlable. Arabic links have no `/ar`, and the query and hash are kept. `/ar/*` returns 307 to the unprefixed URL (next-intl).
- **English-by-default redirect (2026-11-09, `681dca34`):** `englishLandingRedirect()` in `lib/marketing/locale-landing.lib.ts` is called from `proxy.ts`. It sends a **307** to `/en…` only when all of these hold: it's a GET for a document; the path is an Arabic marketing path (`MARKETING_SEGMENTS`); the request isn't a prefetch and has no same-site Referer; the UA isn't a bot (`BOT_USER_AGENT` regex: googlebot, bingbot, facebookexternalhit, whatsapp, ahrefs, semrush, lighthouse, `bot\b`, crawler, spider…; an empty UA counts as a bot); `NEXT_LOCALE` isn't `ar`; and either the cookie is `en` or `Accept-Language` doesn't prefer Arabic. The redirect sends `Cache-Control: private, no-store` and `Vary: Accept-Language, Cookie`. Arabic stays the URL default and the x-default. The SEO impact is neutral for crawlers, since they always get Arabic. **Every new top-level route segment must be added to `MARKETING_SEGMENTS`**, or English visitors won't be redirected there (a test checks this against the folders).

---

## 6. Reusable page building blocks

**Shell (`(site)/layout.tsx`):** `VisitorPricesProvider` (price table per currency), `SignupProvider` (signup dialog), skip link, `.site-fog` wrapper, `SiteHeader` (client), `<main id="main">`, `SiteFooter`, `WhatsAppButton`.

**Site primitives (`components/marketing/site/`):**
- `layout-primitives.tsx`: `Container` (max-w 1200, `px-4 sm:px-5`), `Section` (`py-14 min-[861px]:py-[72px]`), `SectionHeading` (`kicker`, `title`, `description`, `centered`; `<em>` turns amber), `Kicker`, `Eyebrow`, `Num` (digits), `Ltr` (Latin runs), `PhotoPlaceholder`.
- `page-hero.tsx`: `PageHero` (`eyebrow`, `title`, `lead`, `centered`, `aside`, `children`).
- `cta-button.tsx`: `CtaButton` (cva; tone amber/dark/outline/ghost; size md/sm/lg; wraps `@workspace/ui/components/button`).
- `cta-band.tsx`: `CtaBand` (title, body, action).
- `site-card.tsx`: `SiteCard` (`size`, `interactive`, `glass`), `IconTile`.
- `chips.tsx`: `Chip`, `ChipRow`, `chipClassName`.
- `faq-accordion.tsx`: `FaqAccordion` (wraps the shadcn `accordion`).
- `breadcrumb.tsx`: `Breadcrumb` (adds Home).
- `field.tsx`, `choice-group.client.tsx`, `browser-frame.tsx` (`BrowserBar`), `direction-icons.tsx` (`ForwardArrow`/`BackArrow`/`ForwardChevron`, RTL-aware), `rich-text.tsx` (`richTags` for `t.rich`), `reveal.client.tsx` (`Reveal`, the only scroll entrance), `brand-icon.tsx`, `json-ld.tsx`.
- Signup CTAs: `SignupTrigger` (`components/marketing/signup/signup-trigger.client.tsx`) and `SlugClaimForm`.

**Content blocks (`components/marketing/pages/content-blocks.tsx`):**
- `BidiText`: isolates Latin runs inside Arabic.
- `PageTrail({ items, path })`: visible breadcrumb plus BreadcrumbList.
- `FaqBlock({ items, title })`: accordion plus FAQPage, with price tokens.
- `faqSchema()`.
- `FreeTermsNote`: the required "first top-up + Order Notifications" line (`contentPages.freeTerms`).
- `ClosingCta({ title, body?, secondary: "whatsapp" | "pricing" })`: closing band with SignupTrigger and the free-terms line.

**Page templates:**
- `SolutionPageView`: trail → h1 + lead + 2 CTAs → `DeviceStage` (laptop dashboard mock `DashboardScreen` per slug + **clothing** store mock) → trust strip ×4 → intro (sticky h2 + paragraphs) → 4 steps with hard-coded visuals → 8 feature cards → template rail (`TemplateRail`, real gallery, `CARD_KINDS` per category) → cost table (Tallaby vs "developer + hosting + subscription") + `FreeTermsNote` → store-kind chips (`STORE_KIND_LINKS`) → FAQ → 4 related cards → closing CTA. The step visuals and the clothing mock are hard-coded, so a new solution reuses them unless the code is changed.
- `IndustryPageView`: trail (hub label without link) → hero → needs ×4 (visuals variants/gallery/countdown/catalog) → template cards from the gallery filtered by `templateCategory` → `IndustryShowcase` (client, mock store with callouts) → steps → FAQ → other industries → closing.
- `DetailPageView` (features + integrations): trail (hub link) → hero + `DetailShotView` → what/benefits/uses/events → requirements → steps (`StepVisual`) → related → FAQ → closing.
- `ComparePageView`: §2.
- `HubPageFrame({ namespace, path })` + `HubListing` (client search + category chips + featured card): used by `/integrations` and `/compare`; reusable for `/solutions`, `/industries`, `/features`, `/tools` and `/alternatives` hubs. `filterHubItems` / `hubCategoryCounts` live in `lib/marketing/hub.lib.ts`.
- `MarginToolPage`: hero, calculator (`margin-calculator.client.tsx`, maths in `lib/marketing/margin-calculator.lib.ts`), example, formula, how-to steps, soft CTA, FAQ, WebApplication JSON-LD.
- `RankingArticleView`: "best X" list article (TOC, criteria, items with pros and cons, CTA after N items, checklist, FAQ, ItemList + FAQPage). Unrouted.
- `LegalPage` (TOC client).
- `TemplatesPageContent`, `TemplateRail` / `TemplateRailCard` (`components/marketing/solutions/template-rail.client.tsx`, `pages/template-rail.tsx`), `DashFrame`/`MockCard` (`pages/dash-mock.tsx`), `store-mock.client.tsx`.
- Blog components: `ArticleHtml`, `ArticleToc`, `ReadingProgress`, `ShareBar`, `PriceCalculator` (uses the old `FLAT_FEE_EGP = 5`!), `PostMeta`, `BlogIndex`, `NewsletterForm`.

**Prices:** `components/marketing/pricing/with-prices.tsx` → `withPrices(raw, wrap)` turns `{orderFee}` and the other tokens into `<Price name>` elements (`visitor-prices.client.tsx`: the server HTML shows EGP and the client swaps to the visitor's currency, using `/api/geo` from `x-vercel-ip-country`; KSA → ريال). Strings are read with `t(key, PRICE_TOKENS)` or `t.raw(...)`. In meta, JSON-LD and FAQ data, `getMarketingPriceVars(locale, { isolate:false })` (`lib/marketing/exchange-rate.server.ts`) gives "≈ x جنيه" at the cached live rate (`marketing:usd-egp-rate:v1`, 3 h, `billingTags.rate()`, fallback 50). `{days}` = `ORDER_GRACE_DAYS` (14) and is filled by `COPY_VARS`. The tests are in `with-prices.test.tsx`.

**Guard tests that new pages must pass:**
- `lib/marketing/content-messages.test.ts`: every list entry has its messages and meta, array lengths match the icons, competitor cells match, no "يُراجع" placeholder, no `5 ج.م|EGP 5|24/7|على مدار الساعة`, and the same keys in ar and en for every group.
- `components/marketing/pages/content-pages.test.tsx`: renders feature/integration pages, the integrations hub, the compare hub and entries, the tool, industries, solutions and the ranking layout.
- `lib/marketing/content-routes.lib.test.ts`: no duplicate paths, compare excluded while off, competitors below the minimum get no page.
- `lib/marketing/seo.lib.test.ts`: URL, hreflang and meta length rules, and a JSON-LD check for no ratings.
- `lib/marketing/locale-landing.lib.test.ts`: `MARKETING_SEGMENTS` equals the route folders.
- `lib/marketing/sitemap.lib.test.ts`.

---

## 7. Design system

- **Tokens** are in `app/[locale]/(marketing)/marketing.css` (it imports `@workspace/ui/globals.css` and `@workspace/motion/animations.css`).
  - Ink: `--ink-900 #0d3743`, `700 #33464b`, `600 #43575c`, `500 #5a6d72`, `400 #7b8f94`, `on-dark #c6d8dc`.
  - Lines: `line #e3ebed`, `line-strong #dfe8ea`, `line-soft #edf1f2`, `line-kick #e1eaec`.
  - Surfaces: `surface #fff`, `surface-glass rgb(255 255 255/.85)`, `surface-nav`, `surface-dark #0d3743`, `footer-top #0f3a46`, `footer-bar #082a33`.
  - Teal: 50 `#eef3f4`, 100 `#cfdde1`, 300 `#89a8b1`, 500 `#2c6e80`, **700 `#145163` (brand)**, 800 `#0f4555`, 900 `#0d3743`, 950 `#061f27`.
  - Amber: 50 `#fff7e6`, 100 `#ffeec8`, 300 `#ffd166`, 500 `#ffb43d`, **600 `#fdad28` (brand)**, 700 `#e89318`, ink `#5b3a05`.
  - Others: `paper #fafaf8`, `body #1d2a2e`, `slate-ink`, `mist`, `haze`.
  - Radii: `card-sm` 18, `card` 24, `card-lg` 28, `band` 36.
  - Shadows: `card`, `soft`, `raise`, `stage`, `cta`, `cta-hover`, `lift`.
  - CSS vars: `--btn-h 52px`, `--btn-h-sm 42px`, `--ring-focus`, `--bg-fog` (radial teal and amber fog on `.site-fog`), `--bg-cta-glow` (`.cta-glow`).
  - Utilities: `.display-tight`, `.no-scrollbar`, `.reveal`, `.hero-glow(-center)`, `.placeholder-stripes`, `.store-marquee`.
  - Animations: `rise`, `pop`, `blink`, `grow`, `pulse-ring`, `bubble`.
  - Reduced motion turns every animation off. Focus ring: 3px amber outline.
  - Many components also use raw hex values (`#e3ebed`, `#edf1f2`, `#4a5558` and others) instead of tokens, which is inconsistent.
- **Fonts:** `next/font/google` in `app/[locale]/layout.tsx`. Montserrat (`--font-montserrat`, 400–800, latin) and Noto Kufi Arabic (`--font-noto-kufi-arabic`, 400–800, arabic, Arabic pages only). Arabic body uses Kufi with Montserrat fallback and `line-height 1.75`; English uses Montserrat with 1.6. `font-latin` sets Montserrat. The `en:` custom variant (`html[lang="en"] *`) holds English-only tracking.
- **Breakpoints:** custom `min-[…]` values, by frequency: `641px` (192 uses), `1081px` (83), `761px` (61), `861px` (39), then `901`, `961`, `1101`, `821`, `561`, `601`, plus `max-[860px]`. A few `sm:` / `md:` too. The phone layout is the base, with a 16px gutter.
- **RTL:** `<html dir>` comes from the locale. Use logical properties (`ms-`, `ps-`, `start-`, `border-s`), `DirectionProvider` (`@workspace/ui/components/direction`), `BidiText` / `<bdi>` / `Ltr` / `Num`, and direction-aware arrows. No uppercase or letter-spacing on Arabic.
- **shadcn/ui:** lives in `packages/ui/src/components/` (imported as `@workspace/ui/components/*`). Available: accordion, alert, alert-dialog, aspect-ratio, avatar, badge, breadcrumb, button, calendar, card, carousel, category-popover, chart, checkbox, choice-card, collapsible, command, contact-buttons, context-menu, dialog, direction, drawer, dropdown-menu, field, form, hover-card, input, input-otp, inputs/, label, maps-link-button, menubar, navigation-menu, pagination, popover, product-card, progress, radio-group, resizable, scroll-area, segmented-control, select, separator, sheet, sidebar, skeleton, slider, sonner, spinner, stepper, switch, table, table-section, tabs, textarea, toggle, toggle-group, tooltip.
  - **The marketing site uses its own primitives and only a few shadcn components underneath:** `accordion` (faq-accordion, careers), `button` (cta-button), `carousel` (home marketing tools), `dialog` + `label` (signup), `input` / `label` / `textarea` / `toggle-group` (contact, choice-group), `popover` (hero composer), `slider` (fee calculators). The rules say don't change `packages/ui`.

---

## 8. Performance setup

- **Rendering:** content routes are statically generated (`generateStaticParams`, `dynamicParams = false`). Home has `revalidate = 60` (live store line). Blog posts are on-demand and cached. Template pages are static from the gallery.
- **Server vs client:** page views are Server Components. There are 38 `.client.tsx` files under `components/marketing` (header, locale switch, reveal, hub listing, signup dialog/trigger, calculators, showcase, template carousels and stages, home demos, blog tools).
- **Payload:** `SignupProvider` and `VisitorPricesProvider` wrap every page. Only `MARKETING_CLIENT_NAMESPACES` messages go to the client (`i18n/client-messages.lib.ts`).
- **Measured on 2026-11-03:** home loaded 29 scripts, about 557 KB compressed. `experimental.inlineCss` was turned **off** on 2026-11-06 (`next.config.mjs` comment: it had put ~445 KB of CSS before `<meta>` and doubled the HTML). `staleTimes { dynamic: 0, static: 30 }`. `htmlLimitedBots` regex extended for link previews.
- **Images:** `next/image` in about 20 marketing files (2 raw `<img>`). `images.minimumCacheTTL` 30 days. `remotePatterns`: both Supabase projects, unsplash, pexels, googleusercontent, fbsbx, graph.facebook, github avatars, simpleicons. Blog images are optimized only for local or Supabase sources (`isOptimizableImage`). `public/` has only a few photos: `fashion.png`, `cosmetics.jpg`, `accessories.jpg`, `banner.png`, `auth-bg.jpg`, `og-image.jpg`, logos. New industry pages will need new product-only photos (no people).
- **Caching (`@workspace/cache` `createCachedQuery`):** `marketing:template-catalog:v3` (taxonomy TTL, perDeploy, `templateTags.catalog()`), `marketing:template-preview:v3`, `marketing:recent-stores:v3` (`marketingStoreTags`), `marketing:platform-blog-posts:v1` / `-post:v1` (`marketingBlogTags.posts()`), `marketing:usd-egp-rate:v1` and `marketing:usd-local-rates:v1` (3 h, `billingTags.rate()`). React `cache()` dedupes per request.
- **Analytics and consent:** GA4 (`components/layout/google-analytics.tsx`) runs on the marketplace host only, `afterInteractive`, and waits for `useTrackingConsent()`. The Meta Pixel (`components/meta/meta-pixel.tsx`) is mounted in `(marketing)/layout.tsx` and uses `fbq('consent', grant|revoke)`. `TrackingConsentBanner` is in the root layout. `AnimationObserver` (`@workspace/motion`) is in the marketing layout, and the head init script adds `js-animations`.

---

## 9. Internal linking today

- **Header** (`components/marketing/site/nav.lib.ts` `NAV_ITEMS`): `/#features`, `/#ai`, `/templates`, `/#marketing`, `/pricing`, `/faq`. **No link to any solution, industry, feature, tool or integrations page.**
- **Footer** (`site-footer.tsx`):
  - Product: `/templates`, `/#builder`, `/pricing`, `/integrations`, `/compare` (only if `COMPARE_PUBLIC`), AI builder (only if `storeBuilderEnabled()`), `/affiliates`, `/faq`.
  - **Solutions**: `footerSolutionLinks()`, up to 3 each from SOLUTIONS, INDUSTRIES, FEATURE_PAGES and TOOL_SLUGS, labelled with each page's meta title. Today that's 4 links. (Since 2026-11-13 a hand-picked list of 5 pages plus the two hubs, with short labels; see SEO_PLAN.md §13.2.)
  - Company: `/about`, `/blog`, `/careers`, `/contact`.
  - Help: `/faq`, `/faq#payments`, `/faq#shipping`, `/faq#domain`, dashboard login.
  - Legal: `/terms`, `/privacy`, `/privacy#cookies`; socials.
  - With 10+ pages per type, the footer shows only the first 3 of each, so the order in the arrays sets footer priority.
- **Home** (`components/marketing/home/home-sections.tsx`): section anchors `#features`, `#ai`, `#builder`, `#templates`, `#marketing`, `#shipping`, `#payments`, `#pricing`, `#how`, `#faq`. In-body links go to `/industries/clothing-store` (line 295, `industryLink`) and `/solutions/create-online-store` (line 394, `solutionLink`). Every `/templates` card is a plain link in the server HTML.
- **Content pages:** the solution has 4 `related` links plus 9 store-kind chips. The industry links to "other industries" and the gallery. Detail pages have 4 `related` links (custom-domain → `/templates`, `/#builder`, `/#ai`, `/integrations/meta-pixel`; meta-pixel → `/integrations`, `/features/custom-domain`, `/tools/profit-margin-calculator`, `/pricing`). Compare entries link to the other comparisons, `/compare` and the move steps. Blog posts show 3 related posts.
- **Missing:** hub pages for solutions, industries, features and tools; template pages linking to their industry page; blog posts linking to solution or feature pages (that would need CMS content); `/integrations/<id>` detail pages for Bosta, Paymob and the rest (the cards have no link because there's no page); an `/industries` index for the chips.

---

## 10. Gaps and problems

### 10.1 Existing intent overlap and cannibalization risks
- **"إنشاء متجر إلكتروني" / "create online store"** is targeted by the **home** ("منشئ متاجر إلكترونية بالذكاء الاصطناعي، مجانًا"; the 2026-11-05 version was "إنشاء متجر إلكتروني مجاني في دقائق"), by **`/solutions/create-online-store`** ("إنشاء متجر إلكتروني دون مبرمج") and by **`/faq`** ("…عن إنشاء متجرك الإلكتروني"). Each page needs its own distinct head term. Suggested split: home = brand + AI builder; solution = how-to / no developer; a new solution = "free"; another = "in Egypt".
- **"Free" / "مجاني"** appears in the pricing title ("خطة مجانية" before; now "خطتان واضحتان"), the templates title ("قوالب … مجانية") and the home title. A future "free online store" landing page would overlap with all three.
- **Templates vs a future `/features/templates`, and industry pages vs `/templates?category=xx`:** category filters have no URL, so industry pages are the only place to rank niche + template queries. A "templates" feature page would duplicate `/templates`.
- **`/features/custom-domain` vs `/faq#domain`**: fine, since the FAQ is an anchor.
- **"shoes" chip → `?category=fa`**: shoes don't have a category of their own (only 1 `shoes-bags` template).

### 10.2 Target inventory vs what exists

| Target | Exists today? |
|---|---|
| Core: create online store (Egypt) | Partly: `/solutions/create-online-store` (not Egypt-specific in the slug; copy is Egypt-centred). |
| Free online store | No. Home and pricing touch it. |
| Ecommerce platform Egypt | No. |
| Online store builder | No. The home title now says "AI online store builder". |
| Compare vs ~14 competitors | 4 hidden entries (EasyOrders, Shopify, WooCommerce, Facebook page). No Salla, Zid, YouCan, ExpandCart, Wuilt or others, and no sourced facts for them. |
| Alternatives pages ("X alternative") | None. There's no `/alternatives` segment. It must be added to `MARKETING_SEGMENTS`, `contentPagePaths`, and probably the compare data model with `COMPARE_PUBLIC`-style gating. |
| Feature: AI builder | No page. **The AI Store Builder is off** (`STORE_BUILDER_AI_ENABLED`, F-54/F-82). The site may claim **AI product autofill** (live), not "AI builds your store". |
| Feature: drag & drop builder | No page (home `#builder` section only). |
| Feature: templates | `/templates` gallery (no feature page). |
| Feature: COD | No page (integration card `cod`, faq#payments). |
| Feature: custom domain | **Yes:** `/features/custom-domain`. |
| Feature: chatbot / AI assistant | No. MCP "manage products from Claude/ChatGPT" is claimed on the home (`home.ai`/`mcp*` copy, "Yes, for products today"). There is no storefront customer chatbot, and none should be claimed. |
| Feature: analytics | No page (reports and GA4 store views exist). |
| Feature: order management | No page. |
| Industries: clothing | **Yes:** `/industries/clothing-store`. |
| Cosmetics | No page; 12 `be` templates. |
| Electronics | No page; 11 `el`. |
| Jewelry | No page; 10 `jw`. |
| Furniture | No page; furniture niche ×3 inside `ho` (18). |
| Shoes | No page; 1 shoes-bags template (weak). |
| Perfume | No page; perfumes niche ×3 (filed as beauty). |
| Grocery | No page; grocery niche ×3 (food). |
| Food | No page; `fo` 14. |
| Accessories | No page; `ac` 2 (mobile accessories) + the WASLA accessories template. |
| Digital products | **Must not be claimed** (`marketing-site-rules.md` lists digital products under "Never present as live"). This conflicts with ROADMAP §2.1 and `docs/marketing/features-ar.md`, which list digital products. Owner to confirm. |
| Handmade | No page; 4 handmade templates (including gifts). |
| Integrations details | Only meta-pixel. Bosta, Paymob, Kashier, Wassalha, GA4, GTM, Sheets, Shopify import and the feeds have no pages. |
| Tools | Only the margin calculator. |
| Blog | One static article; DB posts unknown. Ranking layout unrouted. |
| Arabic pages | Every page is Arabic-first at the unprefixed URL. Slugs are English, and Arabic-script slugs aren't supported by the routing pattern; they would need new routes or rewrites. |

### 10.3 Technical issues to plan around
1. **S-01 host mismatch** (§5). This blocks every SEO gain and is the top priority.
2. **No hub pages** for solutions, industries, features and tools, so trail levels have no link and a crawl depth is missing.
3. **Templates are single-purpose** (§6). Plan generic variants: an industry template with configurable needs visuals, a solution template without the clothing mock, a detail page with more shot types or an image slot.
4. **Message file placement:** solutions live in `keywords.<loc>.json`, which also holds `blogRanking`. With 10+ pages these files grow, and they're server-only, so file size isn't a client issue. New groups must be registered in `MARKETING_GROUPS`.
5. **One OG image** for every page and both languages. There's no `opengraph-image.tsx` generator.
6. **Stale facts in the blog calculator:** `PriceCalculator` / `suggestedPrice` use `FLAT_FEE_EGP = 5` (the old fee). `docs/marketing/features-ar.md` is pre-USD (EGP 5 fee, welcome gift) and written in colloquial Egyptian; don't use it as a source for claims.
7. **Grace-period copy sweep pending** (ROADMAP §7 2026-11-09): faq, about, blog and pricing still say a top-up is needed "before you can see orders"; F-84 changed that.
8. **`/follow-us`** is outside `(site)`, so it has no header, footer, Organization schema or breadcrumbs. It's a thin page in the sitemap.
9. **Template pages are thin** (about 238 near-identical URLs). Templates have no lastmod, and only 12 were in the HTML before the 2026-11-09 fix, which now makes every card a plain link.
10. **The English redirect** depends on `MARKETING_SEGMENTS`. Forgetting a new segment silently breaks English landings for that section.
11. **Compare pages render with status 200 while noindexed.** They're reachable by URL, so any facts on them must already be accurate.

---

## 11. Product facts SEO pages can truthfully claim

Authoritative lists: `docs/marketing-site-rules.md` "Facts", the code (`packages/lib/src/integrations/registry.ts`, `packages/lib/src/plans/index.ts`, `packages/lib/src/billing/*`), and ROADMAP. **ROADMAP Status lines lag:** many features marked "Built, not deployed" or "uncommitted" before 2026-11-06 went live with the production deploy `0ed4a779` (2026-11-06). Check each claim in code before publishing.

### Prices (tokens only, never literal numbers in copy)
- Free plan: $0 a month + **$0.03 per order** (`FREE_ORDER_FEE_USD_CENTS = 3`), 100 AI credits, 500 campaign emails a month.
- Pro: **$29 a month** (`PRO_MONTHLY_USD_CENTS = 2900`), no order fee, 2,000 credits, 10,000 emails.
- Both plans: `maxStores: 3` (`packages/lib/src/plans/index.ts`), with no product or order limits (compare row `limits`).
- Top-ups: **$5 to $1,000** (`TOP_UP_MIN/MAX_USD_CENTS`), paid in EGP.
- Live since the USD switch on 2026-11-06 at 15:07Z, at 53.9007 EGP per $1.
- Shown as ≈ EGP, or in the visitor's currency.
- No share of sales.
- Required statement: a first top-up is needed within the `{days}` (14) day grace period or at the first order (F-84, built 2026-11-09, migration 0159 not yet applied). Campaigns need activation. Customer order emails need the Order Notifications app (F-63). Never show app or pack prices, and never call an app free.

### Live, safe to claim (rules list + code)
- Cash on delivery for every store.
- The seller's own Paymob and Kashier card gateways (F-39; storefront card checkout through `storePayments` in `actions/checkout.ts`).
- InstaPay / Vodafone Cash / e& Cash transfers to the seller with a screenshot upload (F-21p, bucket 0132).
- Bosta (one-click ship, waybills, status sync; 0106).
- Wassalha / Egypt Post as an Excel export sheet, never "sends directly" (F-12c/e).
- Own riders and shipping zones by area with free-over (0093).
- Meta Pixel + Conversions API, including Purchase on delivery (F-30).
- GA4, GTM, Google Sheets order export, Shopify import.
- Product feeds for Meta, Google Merchant Center and TikTok catalogs (F-11).
- Custom domain on the main store, with a free subdomain otherwise.
- **119 code templates** (marketing copy says "100+" / "118"), Arabic and English, with template changes that keep products.
- Drag-and-drop element-tree builder.
- AI product autofill from photos, PDF or text, in both languages with SEO fields.
- Excel and URL import.
- Email campaigns and win-back (F-16a/e).
- Back-in-stock emails (F-23a).
- Missed orders / abandoned checkouts (F-03).
- Fake-order protection (blocklist, risk badge, WhatsApp confirm, rate limit; F-02).
- Customers CRM, notes and tags (F-01).
- Invoices and packing slips (F-04).
- Manual orders and order links (F-05).
- Quantity offers, cross-sell, automatic discounts, coupons in the cart (F-07a–c, F-32, F-13).
- Sales pop-up from real orders (F-22), low-stock badge (F-34), product trash (F-35).
- Reports with funnel, sources and refusal by governorate (F-15a), UTM campaign links (F-26).
- Push alerts for new orders (F-06).
- Store PWA "download app" (F-36).
- Store currency abroad, so a store can sell in KSA in its own currency with COD only abroad (F-61, Live).
- Theme SEO defaults (F-48, Live).
- "Where to buy a domain" guide (F-78, Live).
- Seller roadmap and voting at `dashboard.tallaby.com/roadmap` (0115).
- MCP: manage products from Claude or ChatGPT (F-29b/c/f; the home already claims "Yes, for products today"; the rest is delayed; never claim deeper tools).
- Support by WhatsApp and email.

### Never present as live
TikTok and Snapchat pixels (soon), SMS, automated WhatsApp messages, Aramex, J&T, Mylerz, PayPal, Tallaby Pay, **digital products**, AI assistants' deeper tools, international selling in general beyond F-61's single store currency, the **AI Store Builder** (built, off until `STORE_BUILDER_AI_ENABLED`; F-54/F-82), paid ads (being removed), installments, deposits (F-21), landing-page funnels (F-08), staff accounts (F-09), public API (F-17), gift cards and loyalty (F-19/F-20), A/B tests (F-27), POS (F-31). Also no invented seller counts, testimonials, ratings, logos or press, and no "Tallaby delivers" (Tallaby doesn't deliver).

### Copy rules (`docs/marketing-site-rules.md`)
- Formal MSA. Use الهاتف، النطاق، البريد الإلكتروني، التاجر، جنيه (never ج.م).
- Digits go in `Num` and Latin runs in `Ltr` / `BidiText`.
- English: sentence case, no em dashes, no emoji.
- Both locale files must have identical keys.
