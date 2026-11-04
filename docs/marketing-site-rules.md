# tallaby.com page rules

For anyone building a page in `apps/ecommerce/app/[locale]/(marketing)`. The design source is the Claude Design project `019e0e12-5b0e-7eca-96d6-6f08dddbbe03`, folder `Marketing Website`. Its files are layout and copy samples; the code decides what is true.

## Tokens and components

- **Tailwind utilities (`marketing.css`):** `text-ink-900/700/600/500/400`, `text-ink-on-dark`, `border-line`, `border-line-strong`, `border-line-soft`, `border-line-kick`, `bg-surface-glass`, `bg-footer-top`, `bg-footer-bar`, `rounded-card-sm` (18), `rounded-card` (24), `rounded-card-lg` (28), `rounded-band` (36), `shadow-soft`, `shadow-raise`, `shadow-stage`, `shadow-cta`, `font-latin`, plus the `teal-*` and `amber-*` scales. In plain CSS: `var(--bg-fog)`, `var(--bg-cta-glow)`, `var(--ring-focus)`, `var(--btn-h)`.
- **Classes:** `cta-glow` adds the amber glow to a dark box (needs `relative overflow-hidden`). The fog is already on every page under `(site)`.
- **From `components/marketing/site/`:**
  - `layout-primitives`: `Container`, `Section`, `SectionHeading` (`kicker`, `title`, `description`, `centered`; `<em>` in a title turns amber), `Kicker`, `Eyebrow`, `Num`, `Ltr`, `PhotoPlaceholder`
  - `page-hero`: `PageHero` (`eyebrow`, `title`, `lead`, `centered`, `aside`, `children`)
  - `cta-button`: `CtaButton` (`tone`: amber, dark, outline, ghost on dark; `size`: md, sm). For "create your store", use `SignupTrigger` or `SlugClaimForm` from `marketing/signup/signup-trigger.client`.
  - `cta-band`: `CtaBand` (`title`, `body`, `action`), the page's closing band
  - `site-card`: `SiteCard` (`size`, `interactive`, `glass`), `IconTile`
  - `chips`: `Chip` (`selected`), `ChipRow`, `chipClassName` for links
  - `faq-accordion`: `FaqAccordion` (`items`)
  - `breadcrumb`: `Breadcrumb` (`items`; adds Home itself). Pair with `breadcrumbSchema` from `lib/marketing/structured-data.lib` in `JsonLd`.
  - `field`: `Field`, `TextInput`, `TextArea`, `fieldInputClassName`
  - `reveal.client`: `Reveal`, the only scroll entrance. Use it sparingly; it's off under reduced motion.
- Icons come from `lucide-react`. Use logical properties (`ms-`, `ps-`, `start-`) so both directions work. Never add letter-spacing or uppercase to Arabic; use `en:` for English-only type tweaks.
- Don't copy the design's minified CSS. Don't change `packages/ui`, the storefront, checkout, dashboards or any template.
- Keep Server Components by default, and use a `.client.tsx` only for real interaction.

## Messages

- Strings go in `messages/marketing/<group>.ar.json` and `.en.json`, in your page's group: `site`, `home`, `pricing`, `templates`, `blog`, `about`, `careers`, `contact`, `faq`, `legal`, `features`, `integrations`, `compare`, `tools`, `industries`, `keywords`, `followUs`. Edit only your own group. Both files always get the same keys.
- They merge key by key over `messages/ar.json` and `en.json`, and a marketing key wins. Use them with `useTranslations` and `getTranslations` as usual, on server and client, under `(marketing)`.
- Only `(marketing)` sends these to the browser, so a component also used in `(shop)` must keep its strings in the base files. Leave base strings in place: other pages may use them.

## Copy

- Arabic is the default: simple, formal Modern Standard Arabic, short sentences, benefit first. Use هل يمكنني، يمكنك، لا، نعم، البريد الإلكتروني، الجوال، النطاق، العلامة التجارية، التاجر. Never إزاي، عشان، مفيش، بتاع، إيميل، موبايل، دومين، براند, even where a design file uses them.
- Currency is "350 ج.م". Digits go in `Num`, and Latin runs (domains, brands, emails) in `Ltr`.
- English is natural English, not a word-for-word translation. Use sentence case and plain verbs; no em dashes in body copy, no emoji.

## Facts: check the code before keeping a claim

- Tallaby doesn't deliver. Sellers use their own riders or a shipping company.
- **Live:** Bosta; Wassalha as an upload sheet export (never "send directly"); cash on delivery; the seller's own Paymob and Kashier gateways; Meta Pixel and Conversions API; GA4; GTM; Google Sheets; Shopify import; product feeds.
- **Never present as live:** TikTok and Snapchat pixels (`availability: "soon"` in `packages/lib/src/integrations/registry.ts`), SMS, automated WhatsApp messages unless the code proves them, Aramex, J&T, Mylerz, PayPal, Tallaby Pay, digital products, AI assistants' deeper tools, international selling. The AI Store Builder is off behind a flag. Paid ads are being removed.
- **Prices:** Free is $0.03 per order, 100 AI credits and 500 campaign emails a month. Pro is $29 a month, no order fee, 2,000 credits and 10,000 emails. Extra emails are $1.50 per 1,000, and 100 AI credits cost $1. Top-ups are $5 to $1,000, paid in EGP.
- **Say plainly wherever pricing or "free" comes up:** a seller needs a first $5 top-up before seeing orders and sending campaigns, and customer order emails need the Order Notifications app at 1 cent per order.
- Don't sell on store counts or other limits without checking `packages/lib/src/plans`. Check `ROADMAP.md` for anything else.
- **No invented proof:** no made-up seller counts, testimonials, ratings, logos, revenue figures or press. Use real data or remove the block, and list it in your report.
- `[يُراجع قبل النشر]` placeholders must be answered from the code or removed, never published.
- Real data stays real: blog posts come from `platform_blog_posts`, templates from the code catalog, and contact and newsletter forms keep their actions. `blog-data.js` and similar files are layout samples.

## Every page

- Metadata and hreflang through `pageMetadata`, an entry in the sitemap, and valid JSON-LD.
- Works at 390px and 1440px, in Arabic RTL and English LTR, with visible keyboard focus and reduced motion respected.
- Images: no people or body-part photos on templates. Copy needed assets from the design project's `assets/`, or use `public/`; report what you can't get.
- Stage your own paths only, never `git add -A`. Commit to `main`; never push.
