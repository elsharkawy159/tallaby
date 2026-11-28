# Seller welcome page (`/welcome`): store setup in minutes

Status: **removed 2026-11-28 (owner)**: the home setup steps replace it; `/welcome` and `/stores/<id>/welcome` now redirect to the home, and the Meta signup event fires on the home (docs/meta-pixel.md). Everything below is history. Was: built 2026-11-15/16; **simplified 2026-11-17 (owner): one flat list of at most three steps, see "Current shape"**. The request and decisions of 2026-11-15 below are history where the current shape differs. Built in reviewed commits on `main` (CLAUDE.md rule 21). No migration, no new AI call. Rules: CLAUDE.md 3, 5, 7, 8, 13, 14, 15, 16, 19, 20; dashboard pages live under `apps/dashboard/app/[locale]/(main)/`, navigation via `@/i18n/navigation`, revalidation via `revalidateDashboardPath` (`docs/plans/dashboard-static-shell.md`).

## Current shape (owner, 2026-11-17)
The page is as simple as possible: **one** progress line "x of N" over exactly the steps shown (N = 3, or 2 outside the store-builder rollout) and one card with a flat numbered list, one step open at a time (the first unfinished one on arrival, or the one a `#hash` names). A done step closes to a one-line summary; its header reopens it. Finishing the theme or delivery step opens the next unfinished one; the product step stays open to show the created product.
1. **Choose a theme** (only when `themesAvailable`): six suggested cards with Preview and Use, and "See all". The industry/niche is one line with a "change" link that opens the picker modal and re-sorts the themes. The confirmation dialog is skipped only for a never-published store with no template yet (`welcomeThemeNeedsConfirm`).
2. **Add your first product:** the inline AI uploader, the full-form link, the created card, the AI-off fallback and the `#product` return, unchanged.
3. **Delivery price:** one field and one button from `welcomeShippingDefault` (All Egypt at 60; a one-country currency asks for the price; no country opens the zone sheet). A store with zones shows the summary and the link to the Shipping page. No free-delivery toggle here.

Under the list (`welcomeLiveState`, `welcomeTopUpLine`):
- **Live card** once `flags.publish` (and billing doesn't hold the store offline): "Your store is live", the link with copy and open, "Send via WhatsApp" with the pre-written message, a link to the dashboard.
- Theme and product done but the store still offline: one line linking to the Website page.
- **Top-up line** from `welcomeWallet`: days left before the store goes offline, offline now (button → `TOP_UP_TO_GO_ONLINE_HREF`), in review (no button), orders hidden; nothing for an activated seller. The per-order fee is one short line under it when `wallet.fee`.

Not on the page any more (they stay in their own pages): brand (logo, favicon, colour, language), payments, sharing tips and the message box, the top-up explanation. **Payments counts as set up for every store** (`setup_payments` in `packages/lib/src/sellers/store-setup.server.ts`), because checkout offers cash on delivery with no saved settings; the home checklist, setup prompts and reminder emails stop asking for it.

Deep links: `#theme`, `#product`, `#shipping` open their step; `#industry`/`#setup` open the theme step; `#delivery` opens the delivery price; `#share` scrolls to the live card and `#topUp` to the top-up line; `#payments` goes on to the store's Settings › Payments (`welcomeHashRedirect`); anything else (`#brand`) opens the first unfinished step.

Files: `welcome.lib.ts` (pure, tested), `welcome.data.ts`, `welcome.client.tsx` (the list and the product step), and `welcome-theme`, `welcome-industry`, `welcome-delivery`, `welcome-live`, `welcome-top-up` (`*.client.tsx`).

## Owner request (2026-11-15)
A `/welcome` page that walks a new seller through setting up their store as a list of accordions, very simple, done in minutes, reusing existing components. A top **Go to Dashboard** button with a chevron to skip.
1. **Main setup:** industry/niche (shown, edit icon opens the industries/niches list) → theme (sorted by relevance to the industry/niche) → brand identity (logo, favicon, primary colour, default website language, Arabic preselected) → add the first product with AI (photos, description, price).
2. **Shipping:** a flat price or free delivery above an amount; "Whole Egypt" preselected at 60; adjust specific zones. Then **payment methods:** Cash on delivery preselected; InstaPay and wallets; gateways.
3. **Share your store:** store link with copy and tips (social bio, friends…); a pre-written customer message ("We've opened our new store {storeName}, order now from {link}") with Copy and Send via WhatsApp (`wa.me`).
4. **Final step: top up your wallet:** how the wallet works, the balance stays in the account, only the per-order fee is taken, the days left to top up.

## Owner decisions (2026-11-15)
1. **Landing:** a new seller lands on `/welcome` once, right after signup. Later the dashboard home links to it ("Open setup guide") until setup is done. No forced reopening.
2. **First product:** reuse today's AI add-product page (`/stores/<id>/products/add?method=ai&from=welcome`); the seller checks the form, publishes, and returns to `/welcome#product`. 1 AI credit as today.
3. **Brand colour:** goes live on Save (like the logo and favicon). If the design system can only go live by publishing other drafts too, stop and ask.
4. **Payments:** Cash on delivery preselected; InstaPay and wallets turned on in place; card gateways (Paymob, Kashier) as a link to Settings › Payments. Outside EGP, filter with `isMethodAllowedForCurrency`.
5. **Lead decisions (no owner question):** a store outside Egypt gets one "Whole <country>" zone from `currencyCountry(currency)` with an empty price the seller must type, and none for USD/EUR; the fee is never hard-coded: show `formatUsdPrice(FREE_ORDER_FEE_USD_CENTS, locale, egpRate)` (≈ 1.6 EGP today) and hide it for active Pro; the days come from `currentOrderLock()` (new sellers from 2026-11-16 get 7 days and go offline after; earlier ones keep 14 and never go offline), never a typed "7".

## Route and entry
- `app/[locale]/(main)/stores/[storeId]/welcome/page.tsx`, checked with `loadStorePage` (404 for another seller's store, rule 5). `/welcome` redirects to the selected store's page (pattern of `products/[[...path]]/page.tsx`; no store → `/stores`).
- After signup: every signup path lands on `/?welcome=1&signup=…` (dashboard `api/auth/callback/route.ts:41`, `signup.client.tsx`, ecommerce `api/auth/signup-callback`, tallaby.com signup dialog). In `(main)/page.tsx`, when `welcome=1` and the store is setup-only, redirect to `/stores/<selected>/welcome?welcome=1&signup=…`. Move `SignupPixelData` (Meta CompleteRegistration, fire exactly once) and the `WelcomeBanner` copy there; update `docs/meta-pixel.md`. `afterSignupPath` targets (`/ai-builder…`, `/settings/plan`) are unchanged.
- Skip: "Go to Dashboard" → `/` (no `welcome` param, no loop); chevron flips in RTL.
- `isPromptBlockedRoute` (`setup-prompts.lib.ts`) blocks `/stores/*/welcome`.
- Setup-only home (`setup-home.data.tsx`) gets an "Open setup guide" link.

## Data
- Read-only loader `welcome/welcome.data.ts` after `loadStorePage`, one `Promise.all`: `getSetupPromptRow(sellerId, storeId).flags` (`_components/home.queries.ts:91`), `getStoreShipping`, `parseStorePayments`, `getStoreGatewayOverview`, `currentOrderLock()`, `findActiveCustomDomainForSubdomain`, the store's `store_design_systems` row. Never `getStoreForEditor` (it writes).
- Done-states come from the same flags as the home page and the F-94 emails (`STORE_SETUP_STEP_DONE`, `packages/lib/src/sellers/store-setup.lib.ts`); progress counts the page's own steps (`welcomeSteps`), not the home's four.
- Every write reuses an existing action that already calls `requireStore(storeId, { forWrite: true })` and invalidates its caches. After a save: `router.refresh()` + `requestSetupPromptCheck()`. No new caches (rule 8).
- Static frame (title, skip, accordion headers) with one `<Suspense>` child for the data, ready for the static-shell plan's Phase 2.

## Steps (as first built, 2026-11-15; replaced by "Current shape")
**1a Industry/niche.** Show `findIndustry(storeCategory)` + `effectiveStoreNiche` (`@workspace/lib/stores/niche`); edit opens a Modal with the chips; save with `saveStoreGeneral(storeId, { storeCategory, storeCategoryAr, niche })`. Extract one `components/stores/industry-niche-picker.client.tsx` from `signup.client.tsx` and `store-general.client.tsx` (no behaviour change there). Done: a category is set.
**1b Theme.** React Query with the gallery's key (`["store-templates", storeId, 1, {category: null, q: "", niche: null}]`) → `listTemplatesPage` (already `sortByRelevance`); top 6 cards, Preview (`TemplatePreview`), Use → `applyTemplate(storeId, key, edition)` (publishes a never-published store), "See all" → Website › Templates. Extract the card from `templates.client.tsx` into `template-card.client.tsx` (no behaviour change). After apply: `invalidateQueries` + `router.refresh()`, stay on the page. Hidden when `listTemplatesPage` is `notFound`. Done: `flags.template`.
**1c Brand.** `LogoField` (`components/stores/brand-image-fields.client.tsx`); move `FaviconField` from `design.client.tsx` next to it; save with `saveStoreGeneral({ logoUrl, faviconUrl })`. Colour: `PALETTE_PRESETS` swatches + one colour input, live on Save (decision 3), disabled until a theme is applied (a template install rewrites the design system). Language: Arabic (preselected) / English → `saveStoreGeneral({ defaultLocale, supportedLocales: union(current, [chosen]) })`; show the existing `savedLocaleChanged` notice. Done: `flags.brand`.
**1d First product.** Link to `/stores/<id>/products/add?method=ai&from=welcome`; in `add-product.tsx` a validated literal `from === "welcome"` returns to `/stores/<id>/welcome#product` (no open redirect). If AI isn't configured, `?method=choose`. Done: `flags.product`.
**2a Shipping (EGP).** No zones: prefill "Whole Egypt" at 60 → `applyShippingTemplate(storeId, { template: "egypt_flat", names, price, replace: false })` (names from `storeShipping.templates.egyptFlat.zoneName`, both languages). Free over: `saveShippingSettings` with the whole parsed object (strict schema). Adjust zones: reuse `ZoneSheet` + `saveShippingZone`. Zones exist: summary + edit link, never the template again. Abroad: decision 5. Done: `flags.shipping`.
**2b Payments.** COD shown on; Confirm → `saveStorePaymentMethod(storeId, "cod", { enabled: true })`; export `MethodSheet` from `payments.client.tsx` for InstaPay/wallets; gateways link (decision 4). Done: `flags.payments`.
**3 Share.** Reuse `StoreLinkSection` (`settings/store-link.client.tsx`); tips list; message card with Copy and `https://wa.me/?text=<encoded>` (text built in `welcome.lib.ts`). Shown "Live" when `flags.publish`; not counted in progress.
**4 Top up.** Copy only, no money logic: the balance stays (spend-only wallet, rule 7); fee line (decision 5); days line from the lock: `offlineAt` → `daysUntilOffline`, else grace → `graceDaysLeft`, `pendingReview` → in review, `activated` → done. Button → `/wallet?topup=1`.

Layout: `Accordion type="single" collapsible` (`@workspace/ui/components/accordion`, as `help.client.tsx`) in `SellerCard`; first unfinished section open; `#hash` deep links; phone-first, one column; read-only stores show a `Note` and disabled controls; all done → "You're ready" card linking to `/`.

## i18n
New `storeWelcome` namespace in `apps/dashboard/messages/{ar,en}.json` (simple MSA + English, content-writer skill); reuse `websiteTemplates.*`, `websiteDesign.brand.*`, `storeShipping.*`, `settings.storeLink.*`, `storeWallet.*` where they fit.

## Tests
`welcome.lib.test.ts` (done-states and next open step; `welcomeShippingDefault(currency)`: EGP → egypt_flat/60, SAR → SA with no price, USD → none; share message + `wa.me` encoding with Arabic and `&`; wallet line per lock state, Pro, `usdLive` off); prompt-block test; home-redirect lib test (`/?welcome=1&signup=google` → welcome, `/` alone → none); `from=welcome` is the only accepted return; loader 404 for another seller's store (integration, `TEST_DATABASE_URL`); messages parity.

## Delivery (one reviewed commit each)
- **P1:** route, `/welcome` redirect, loader, accordion frame, progress, skip, prompt block; steps 1a–1d (picker, template card, `FaviconField` extractions); the signup landing redirect with the pixel and banner moved.
- **P2:** shipping (Egypt and abroad) and payments.
- **P3:** share and top-up, the ready state, the home "Open setup guide" link.

## Risks
Template install overwrites the colour (order enforced); default-language change rebases drafts; `applyTemplate` publishes the store, so wallet copy must follow the lock; the CompleteRegistration pixel must fire exactly once; heard-about-us / negative-wallet dialogs may open over the page; shipping settings are a strict whole object; shared rate limits (templates 20 / 10 min).
