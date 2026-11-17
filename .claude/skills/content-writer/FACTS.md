# Tallaby copy facts (checked 2026-11-15)

Every fact here has a source. Before you publish a claim, open its source again: these change often, and the code beats any doc. If a fact is missing here, check the code and `ROADMAP.md` before writing it; if you still can't confirm it, leave it out.

## Brand

| Fact | Source |
| --- | --- |
| Arabic name **طلبي** (never تالابي); Latin **Tallaby**, site **tallaby.com** | `CLAUDE.md` rule 13; `.claude/skills/brag-slim/TALLABY_VIDEO_RULES.md` §1 |
| Words: الهاتف، التاجر، جنيه، البريد الإلكتروني، النطاق، العلامة التجارية. Never الجوال، موبايل، البائع، إيميل، دومين، براند، ج.م | `docs/marketing-site-rules.md` (Copy), owner 2026-11-06 |
| No invented proof: no made-up seller counts, testimonials, ratings, logos, revenue or press | `docs/marketing-site-rules.md` (Facts); `TALLABY_VIDEO_RULES.md` §1 |

## Pricing (live on production since 2026-11-06)

| Fact | Source |
| --- | --- |
| **Free:** $0.03 per created order, no monthly fee, no percentage of sales; 100 AI credits and 500 campaign emails a month | `CLAUDE.md` rule 7; `packages/lib/src/billing/billing.lib.ts` (`FREE_ORDER_FEE_USD_CENTS = 3`); `packages/lib/src/plans/index.ts` |
| To Egyptians the Free fee is shown as **about جنيه ونصف** per order ("About EGP 1.5 fee per order"); $0.03 at the 53.9007 switch rate ≈ 1.62 EGP | `apps/ecommerce/messages/marketing/home.*.json` (`hero.check3`); `CLAUDE.md` rule 7 |
| **Pro:** $29 a month from the store wallet, no order fee, 2,000 AI credits and 10,000 campaign emails a month | `billing.lib.ts` (`PRO_MONTHLY_USD_CENTS = 2900`); `plans/index.ts`; `docs/marketing-site-rules.md` |
| Free and Pro otherwise have the same features and limits | `plans/index.ts` (comment on `pro`); `PLAN.md` §13.1 note |
| Top-ups are $5 to $1,000, paid in EGP | `billing.lib.ts` (`TOP_UP_MIN/MAX_USD_CENTS`); `docs/marketing-site-rules.md` |
| Say plainly wherever "free" comes up: orders are hidden from the start until the first top-up, which is needed to see orders, send campaigns and keep the store online. tallaby.com shows the new-seller window, 7 days (`ORDER_GRACE_DAYS_SHORT`), through `{days}`; never type the number. Orders no longer end the window (never write "or at your first order, whichever comes first"). When the days run out without a top-up, every store of the seller goes offline until they top up. Sellers from before 2026-11-16 keep 14 days (`ORDER_GRACE_DAYS`), shown only in their dashboard | `packages/lib/src/billing/order-lock.lib.ts` (`ORDER_GRACE_DAYS_SHORT`, `ORDER_GRACE_DAYS`, `SHORT_GRACE_FROM`, `storeOffline`); `docs/seller-top-up-rules.md`; `apps/ecommerce/lib/marketing/pricing.lib.ts` (`COPY_VARS`) |
| Credit and email pack prices and **app prices are never shown on tallaby.com**; say the cost is shown in the dashboard before turning an app on, and never call an app free. Customer order emails need the Order Notifications app | `docs/marketing-site-rules.md` (Facts), owner 2026-11-05 |
| The EGP 5 fee, the 7-day trial and the EGP 100 welcome gift are history; don't use them in new copy | `CLAUDE.md` rule 7 |

## What Tallaby does and doesn't do

| Fact | Source |
| --- | --- |
| **Tallaby does not deliver orders.** Sellers ship with their own riders or a shipping company; Bosta is the live carrier integration. Wassalha is an upload-sheet export, never "sent directly" | `docs/marketing-site-rules.md` (Facts); `apps/ecommerce/messages/marketing/home.*.json` (`what.points.shipping`) |
| **Storefront payments go to the seller.** Cash on delivery; InstaPay and wallets (Vodafone Cash, e& Cash, WE Pay, Orange Cash) pay the seller's own details; cards through the seller's own Paymob or Kashier account. Tallaby takes no cut of sales | `ROADMAP.md` §6 F-21p (2026-10-31), F-39; `packages/lib/src/payments/store-methods.ts` (`paymentCollector`); `home.*.json` (`what.points.money`) |
| **Sell worldwide in the store's own currency.** A store chooses its currency, shipping countries and regions, and foreign checkout (F-61b/d/e, live 2026-11-06). Automatic shopper-currency detection (F-61c) is not built, so don't promise it | `ROADMAP.md` F-61 (Status) |
| Live integrations: Bosta, Paymob, Kashier, Meta Pixel and Conversions API, GA4, GTM, Google Sheets, Shopify import, product feeds | `docs/marketing-site-rules.md` (Facts) |
| Never present as live: TikTok and Snapchat pixels (`availability: "soon"`), SMS, automated WhatsApp messages unless the code proves them, Aramex, J&T, Mylerz, PayPal, Tallaby Pay, the AI Store Builder (behind a flag), paid ads | `docs/marketing-site-rules.md` (Facts); `packages/lib/src/integrations/registry.ts` |
| **Don't mention a store-count limit** ("3 stores"), even though the code caps it | `plans/index.ts` (`maxStores: 3`); owner, 2026-10-31 |

## Which features you may claim

Only features that are **live**: listed in `ROADMAP.md` §2.1 Live, or a feature whose Status says deployed/Live, or whose tasks are all `[x]` in the §6 checklist. §2.1 was written on 2026-10-28 and lags behind, and some §2.1 rows are out of date (it still lists the EGP 5 fee, the welcome gift and TikTok/Snapchat pixels), so check the feature's own Status and the code too. "Built, not deployed", "Planned", "Needs approval" and `[~]` are not live; if in doubt, leave it out.
