# tallaby.com SEO audit (ROADMAP.md F-53a)

Audited 2026-11-03 against the live site (read-only) and the code in `apps/ecommerce`. Scope is the public marketing site only. Store SEO and storefront policy pages are out of scope.

Issues are ranked by likely effect on seller signups. Status: **Fixed** means committed under F-53b and live after the next deploy. **Owner** means a decision, a setting or content is needed.

No build, dev server or browser was used. The fixes pass `tsc` and unit tests, but their rendered output has not been seen yet, so run the checks in "After the next deploy".

## Summary

| # | Issue | Effect | Status |
|---|---|---|---|
| 1 | Every canonical, hreflang, OG URL and sitemap URL points at a host that redirects | High | **Owner** (one setting) |
| 2 | Titles and descriptions did not target what sellers search for | High | Fixed |
| 3 | Almost no content for seller searches: one indexable blog post, no niche landing pages | High | **Owner** |
| 4 | Only 12 of about 140 template pages are linked from the gallery | Medium | **Owner** (design) |
| 5 | HTML is 1.3 to 1.8 MB on every page | Medium | **Owner** (reverses an earlier approval) |
| 6 | Old marketplace pages were indexable, with claims that are no longer true | Medium | Fixed for search; **Owner** to retire |
| 7 | Sitemap listed only Arabic URLs as entries, with no x-default | Medium | Fixed |
| 8 | No Organization, WebSite, product or breadcrumb structured data | Medium | Fixed |
| 9 | Language switch was a button, so no crawlable link between languages | Medium | Fixed |
| 10 | Template descriptions had ".." and ran up to 213 characters; template titles were thin | Low to medium | Fixed |
| 11 | Old addresses returned 404 | Low | Fixed |
| 12 | Open Graph gaps; one generic share image everywhere | Low | Tags fixed; image **Owner** |
| 13 | Client JS and message payload | Low to medium | **Owner** (needs a browser pass) |
| 14 | robots.txt: AI crawler policy and `Host:` line | Low | **Owner** |

## 1. The declared host redirects (Owner, do this first)

Measured:

- `https://www.tallaby.com/` returns 200. `https://tallaby.com/` returns **307** to www, and so does every other path.
- `http://tallaby.com/` takes two hops: 308 to https apex, then 307 to www.
- Every canonical, hreflang, `og:url`, `og:image`, sitemap `<loc>` and the robots `Sitemap:` line says `https://tallaby.com`. Production `NEXT_PUBLIC_SITE_URL` is therefore the apex, while the site is served from www.

So each page says its real address is one that sends crawlers back through a temporary redirect. Canonical and redirect then disagree, which splits signals and leaves Google to choose. Hreflang is affected too, because alternates must resolve to the canonical URL directly. A 307 also tells Google the move is temporary.

No code change fixes this properly, because the redirect happens in Vercel's domain settings before the app runs.

**Recommended: make the apex primary in Vercel (Project, Settings, Domains).** Set `tallaby.com` to serve the app and `www.tallaby.com` to redirect to it with 308. All the declared URLs become correct at once, with no redeploy. Auth is also unaffected, because `NEXT_PUBLIC_SITE_URL` feeds `actions/auth.ts` and the password reset link in `components/auth/forgot-form.tsx`.

The alternative is to keep www: set `NEXT_PUBLIC_SITE_URL=https://www.tallaby.com`, redeploy, change the apex redirect to 308, and add the www URLs to the Supabase auth redirect allow-list. It's more steps, and the variable also feeds some storefront links, so check those.

Either way, check in Search Console which host Google has picked first, submit the sitemap on the chosen host, and make the fallback in `lib/marketing/site.lib.ts` and `lib/constants.ts` (currently www) match if you choose the apex. No Search Console verification tag exists in the code, so the property must be verified by DNS if it isn't already.

## 2. Titles and descriptions (Fixed)

Before, titles were generic or missed the words sellers use: "الأسعار | طلبي", "Pricing | Tallaby", "Store templates | Tallaby". Some repeated the brand ("Follow Tallaby | Tallaby"), and some descriptions were one short line. Only `meta.*` in `messages/ar.json` and `en.json` changed; visible page copy did not. Prices and fee wording were not changed.

| Page | Arabic title | English title |
|---|---|---|
| Home | طلبي \| أنشئ متجرك الإلكتروني في مصر مجانًا | Tallaby \| Create your online store in Egypt for free |
| Templates | قوالب متاجر إلكترونية جاهزة ومجانية \| طلبي | Free online store templates \| Tallaby |
| Template | قالب متجر {name}: {category} \| طلبي | {name} store template: {category} \| Tallaby |
| Pricing | أسعار المتجر الإلكتروني: خطة مجانية بدون عمولة \| طلبي | Online store pricing: free plan, no commission \| Tallaby |
| Blog | مدونة البيع أونلاين في مصر \| طلبي | Blog: selling online in Egypt \| Tallaby |
| FAQ | الأسئلة الشائعة عن إنشاء متجرك الإلكتروني \| طلبي | Online store FAQ and help center \| Tallaby |

About, contact, FAQ and affiliates descriptions were also extended or trimmed. A test now holds every page to 62 characters for the title, 50 to 165 for the description, no repeated brand, and the same pages in both languages.

**For you to review:** these are my wording choices. I had no keyword data, so check them against Search Console queries once it has some. Your Claude Design redesign can replace them freely, as long as they stay in `meta.*`.

## 3. Content for seller searches (Owner)

This is probably the largest gain available, and it isn't a code fix. The blog has **one** indexable post (`pricing-products`), and 280 of the 306 URLs in the sitemap are template pages. Nothing on the site targets searches like "إزاي أعمل متجر إلكتروني", "متجر ملابس أونلاين" or comparisons with other platforms.

Suggested order:

1. Guides in Arabic first: how to start selling online in Egypt, cash on delivery and fake orders, shipping options, how to price products.
2. One landing page per niche you already have templates for (fashion, beauty, electronics, food, home), linking to those templates.
3. A comparison page against the platforms sellers already consider, only with facts you can stand behind.

The home page FAQ could also carry FAQ data, but that is best added after the redesign. Google now shows FAQ results mainly for health and government sites, so don't expect a visual result from it.

## 4. Template pages and crawl paths (Owner, design)

- `/templates` puts only **12** template links in the HTML. The rest appear after "show more" (`PAGE_SIZE` in `template-gallery.client.tsx`). A crawler reaches the others only through the sitemap or the 7 links on each template page.
- `/templates?category=fa` is client-side and canonicalizes to `/templates`, so niches have no address of their own to rank.
- Template pages are thin: a name, one sentence and an iframe of a `noindex` preview. 140 near-identical pages in two languages can dilute the site's perceived quality.

Decision needed: real paged or category URLs (`/templates/fashion`) with crawlable links, which is a visual change. Also consider indexing only the best templates per niche and a paragraph of unique text on each. Hidden links weren't added, since they would be a poor substitute.

Two templates share the Arabic name حكاية (`/templates/hekaya` and one more). The category in the new title may separate them; rename one if not.

## 5. Page weight (Owner, reverses an approved setting)

Measured: HTML is **1.33 to 1.78 MB raw**, and **220 to 275 KB gzipped**. The 404 page is 607 KB. Google documents a limit on how much HTML it processes per file, so check the current figure; the home page is close to 2 MB.

Where it goes, on a page as small as `/en/follow-us`:

- About 690 KB is two inlined stylesheets. They appear **twice**, once in `<style>` and again in the React payload.
- About 147 KB is the whole messages file.
- About 28 KB is font-face CSS.

The cause is `experimental.inlineCss: true` in `next.config.mjs`, approved 2026-10-30 (`PLAN.md`) on an estimate of "HTML ~60 KB larger". The real cost is far above that estimate: about 690 KB raw, and most of the 220 KB gzipped. It also defeats stylesheet caching for repeat visits.

Decision: compare both settings with PageSpeed on a preview deployment and keep the better one. It's a global setting that also affects storefronts, so I did not change it. The two stylesheets are nearly full Tailwind builds (`@workspace/ui/globals.css` plus `marketing.css`), and shrinking those would help under either setting.

Good news from the same pages: pages are prerendered, TTFB was about 220 ms, and images are lazy except the logo. The home hero's intro animation is CSS only and starts with the first paint, so it shouldn't wait for JS, but its effect on LCP needs a PageSpeed run to confirm.

## 6. Old marketplace pages (Fixed for search; Owner to retire)

`/shipping`, `/returns`, `/payment` and `/cookies` (and `/en/…`) return 200 with `index, follow` on the main site. They use the old shop layout, aren't in the sitemap and aren't linked from marketing pages. Their text is written for the marketplace, such as "How Tallaby delivers across Egypt", while Tallaby doesn't deliver.

Fixed: `X-Robots-Tag: noindex, follow` on these paths for `tallaby.com` and `www.tallaby.com` only (`next.config.mjs`). Store hosts aren't matched, because storefront footers link to their own `/returns` and `/shipping`.

Decision: redirect them to `/faq#shipping`, `/faq#payments` and `/privacy#cookies`, or rewrite them. Until then, anyone with a direct link still sees the old text. The legacy `generateWebsiteStructuredData` in `lib/structured-data.ts` also still describes a "multi-vendor marketplace".

## 7. Sitemap (Fixed)

Before: 153 entries, all Arabic, with English only as alternates and no x-default, unlike the pages. Now every language version is its own entry with the same alternates as its page, from one shared function (`lib/marketing/seo.lib.ts`), so about 306 entries. All 306 URLs returned 200 with no `noindex` when crawled on www, so there are no stale entries. There is no `lastmod` on static pages, which is deliberately left out rather than invented.

`/follow-us` is a thin social links page, and could be dropped from the sitemap if you prefer.

## 8. Structured data (Fixed)

Added, with no ratings, reviews or customer counts:

- **Organization and WebSite** on every marketing page: both brand names, logo, social profiles, public support email and phone. There's no `SearchAction`, because tallaby.com has no site search.
- **SoftwareApplication** on home and pricing, through one `<ProductJsonLd>` line in each `page.tsx`. **Keep that line in the redesign.** The offer is the free plan at EGP 0, with the fee taken from the page's own meta description.
- **BreadcrumbList** on template pages and blog posts.

Already there and correct: FAQPage on `/faq` and `/affiliates` (from visible answers), and BlogPosting on posts.

Google generally requires ratings for a SoftwareApplication rich result, so this helps it understand the product but won't show stars. Don't add ratings until you have real, visible ones.

## 9. Language links (Fixed)

The switch was a `<button>`, so crawlers had no link from an Arabic page to its English version. It's now a real link with the same click behaviour, keeping the query and hash. It uses the same classes, plus `hover:no-underline` so it doesn't pick up link styling. **Please check it once in the header after deploy,** since this is the one fix that touches a visible element.

## 10. Template metadata (Fixed)

Blurbs end in a period, so descriptions rendered as "…ready pages.. Free, …" on the template pages, and reached 213 characters. `templateMetaDesc` removes the closing punctuation and cuts on a word so the total stays near 160. Titles now include the category.

## 11. Redirects (Fixed)

Added on the platform host only: `/en/sell` and `/en/become-seller` to `/en` (permanent, matching their Arabic rows), `/help` to `/faq` and `/affiliate` to `/affiliates` (temporary), with `/en` variants.

Other old marketplace addresses (`/products`, `/stores`, `/categories`) correctly return 404 with `noindex`. Check Search Console for any with backlinks. `/ar/*` returns 307 to the unprefixed URL; that's next-intl's behaviour and nothing links there.

## 12. Open Graph (Tags fixed; image Owner)

Fixed: image size and alt text, `og:locale:alternate`, `twitter:site` (`@usetallaby`) and explicit Twitter images.

For you: every page shares one image, the Latin "tallaby" logo on teal, even on Arabic pages and with no message. WhatsApp and Facebook previews would benefit from an Arabic image with the value proposition, and blog posts from their own images. The one blog post uses a generic `accessories.jpg`. Template pages fall back to the logo because `thumbnailUrl` is empty.

## 13. Client JS and messages (Owner, needs a browser pass)

- The home page loads 29 scripts, about **557 KB compressed**. This is the main INP and TBT risk on mid-range phones.
- `SignupProvider` wraps every marketing page, and pulls in the dialog, Supabase client and server action references. Loading the dialog on first click is the obvious saving.
- The root layout sends all 54 message namespaces to the browser (135 to 147 KB raw). Marketing needs about a dozen.
- GA and Meta Pixel load `afterInteractive`. `lazyOnload` is lighter but loses some short visits and can undercount ad conversions, so that's your call.

Not changed: the root layout also wraps storefronts, and a missing namespace or a broken dialog can only be caught at runtime, which this task couldn't do. Do these after the homepage redesign lands, with a browser check. Fonts look fine: `next/font`, swap, two preloads.

## 14. robots.txt (Owner)

Correct: private paths blocked, the sitemap listed, AI search bots allowed.

- `GPTBot`, `ClaudeBot`, `anthropic-ai` and `CCBot` are blocked on the whole host. That protects seller content, but for the marketing pages it also reduces what AI assistants know about Tallaby when someone asks where to build a store. Consider allowing them on the marketing host; the rule is shared with store hosts (`crawlRules`), so that takes a small split.
- `Host:` is ignored by Google and harmless, but will show the chosen host only after fixing #1.
- `/dev-library` (3.8 MB) and `/template-preview/*` are public with `noindex`, which is correct for search. Nothing links to `/dev-library`, but it's open to anyone.

## Other things to decide

- **Fee wording.** The public pricing and meta descriptions say the fee is per *delivered* order, charged on delivery. `CLAUDE.md` rule 7 (owner, 2026-10-31) says the fee is taken when the order is created, and only suspicious parts wait for delivery. I left the text as it is, since you said pricing is correct until launch. Make sure the launch copy (F-55) matches what's charged, including the SoftwareApplication offer if the free plan changes.
- **Careers `h1`.** The rotating words render together in the HTML ("Come help us builddesigngrowsupportEgyptian commerce."). It's a small markup fix on a low-value page.

## After the next deploy

1. Do #1, then confirm `curl -I` on the other host returns 308 to the chosen one.
2. View source on `/`, `/en/pricing` and one template page: title, canonical, three hreflang tags, `og:image:width`, and JSON-LD.
3. Run those pages through Google's Rich Results Test.
4. Open `/sitemap.xml`: about 306 entries, with `/en/…` URLs as their own `<loc>`.
5. `curl -I https://www.tallaby.com/shipping` shows `X-Robots-Tag`; the same path on a store host doesn't.
6. Click the language switch on a page with a hash, such as `/#how`.
7. Submit the sitemap in Search Console.
