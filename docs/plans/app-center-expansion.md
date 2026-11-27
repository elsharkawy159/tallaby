# App Center expansion: EasyOrders' apps, mapped and planned (ROADMAP.md F-115)

Owner request 2026-11-27: "these are the apps that on Easy orders, can you check
and analyze and make a plan for the important apps that we can add on Tallaby,
and make them like scalable and centralized."

Status: **plan only, nothing built.** Checked against the code on 2026-11-27
(`packages/apps`, `docs/apps-platform.md`, Store settings pages, ROADMAP.md §4/§6).

---

## 1. The finding in one line

Tallaby already has about two thirds of EasyOrders' 32 apps, but many of them
are hidden in **Store settings** or **Marketing** pages, not in the App Center.
A seller who compares the two App Centers sees 31 cards in ours and thinks
we have less. The first job is to **centralize** (make every seller feature an
app card with one on/off and one settings screen), and only then to **add**
the missing apps on a shared engine.

## 2. EasyOrders app by app

Legend: ✅ have it as an App Center app · 🟡 have it, but not in the App Center
(or only partly) · ❌ missing · ⛔ will not build.

| EasyOrders app | Tallaby today | Where in our code | Plan |
| --- | --- | --- | --- |
| Pixel settings (Meta, TikTok, Snap) | ✅ | `meta_pixel`, `tiktok_pixel`, `snapchat_pixel` manifests | — |
| Conversion API (Meta + TikTok) | 🟡 Meta only | `meta_capi` | **A6** TikTok Events API |
| Google Tag Manager | ✅ | `google_tag_manager` | — |
| Google Sheets | ✅ | `google_sheets` | — |
| Remove "Powered by" ($2/mo) | ✅ $1/mo, free with Pro | `remove_branding` (F-110) | — |
| Official WhatsApp (Meta) | ✅ built, off until the Meta account exists | `whatsapp` (F-109, 0180 not applied) | go-live is F-109e |
| Coupons | 🟡 | Marketing › Coupons, coupon pop-up (0114) | **C1** card |
| Cross selling | 🟡 | F-32 (`product_cross_sells`) | **C1** card |
| Product bundles | 🟡 quantity tiers only | F-07b/c (`product_quantity_offers`); real bundles F-07f delayed | **A4** bundles |
| Social proof (sales pop-up) | 🟡 | Store settings › Sales pop-up (F-22, `stores.settings.salesPopup`) | **C1** card |
| Downsell | 🟡 the coupon pop-up on exit covers it | 0114 `popup_trigger = 'exit'`; F-33 removed by owner 2026-10-29 | card only, no new engine |
| Fake-order blocker ($2/mo, AI) | 🟡 rules only | Store settings › Order protection (F-02a–e: blocklist, rate limits, duplicate and "refused N" chips, WhatsApp confirm) | **A1** scoring v2 |
| WhatsApp OTP | ❌ | F-02f was planned on SMS (MersalSMS, delayed) | **A2** on the F-109 WhatsApp number |
| Block orders from outside my country | ❌ (the visitor-country helper exists) | `apps/ecommerce/lib/marketing/visitor-country.lib.ts` | **A5** |
| Free-shipping threshold and minimum order | 🟡 free shipping over X exists, no minimum order total | `stores.settings.shipping.freeShippingOver`; product `min_order_quantity` (0151) | **A3** "Order rules" app |
| Staff with permissions | ❌ (delayed by owner 2026-11-04) | F-09a design done, F-09b/c delayed | **A7**, needs owner to lift the delay |
| Multi-language | 🟡 Arabic and English | `stores.supported_locales` | card only; more languages later |
| Sitemap | 🟡 automatic for every store | storefront `sitemaps`, `robots.txt` | card (`builtin`) |
| Google Merchant | 🟡 | `product_feeds` (feed URLs) | rename/split the card so "Google Merchant" is searchable |
| UTM builder | 🟡 orders keep UTM, page removed | F-26a, page hidden by owner in F-65b | ask owner: bring back as an app? |
| Easy AI | ✅ different shape | `ai_assistants`, AI Store Builder (F-54/F-82), MCP (F-29) | — |
| Easy Catalog (tagged photos) | 🟡 | builder section `gallery-shoppable` | card that opens the builder |
| Shopify | ✅ import | `shopify_import` | — |
| WooCommerce / WordPress | ❌ | — | **B1** import on the Shopify import pipeline |
| Taager, Anjezny, Rimonda (dropshipping) | ❌ | F-99 (waiting for owner answers) | **B2** after F-99 design |
| WeSell, Top Media Buyer, SplendApp | ❌ | — | only with a partnership; F-36 PWA covers "store app" |
| WhatsApp v2 (unofficial) | ⛔ | — | breaks WhatsApp's terms; numbers get banned. We use the official Cloud API (F-109). |
| Cloaking (خاصية التمويه, $10/mo) | ⛔ | — | shows ad reviewers a different page than buyers. That is "cloaking" in Meta, TikTok and Google ad rules: it gets the seller's ad accounts banned and can get Tallaby's domains flagged for every seller. Bot protection itself is covered by A1 and rate limits. |

## 3. Make it centralized: the App platform v2 (P0 for this feature)

What exists (F-93, `docs/apps-platform.md`): one manifest per app in
`packages/apps`, install rows in `store_app_installs` / `store_integrations`,
settings at `/stores/:storeId/apps/:slug/settings`, billing by manifest
pricing. What is missing is that **every feature reads its own on/off and
settings its own way**, and the storefront and order pipeline call each one
by hand. Four small pieces fix that, without moving any existing page
(CLAUDE.md rule 3).

### P1 · Built-in features as app cards (no migration)

**Started 2026-11-27:** built as a manifest `opens` key with `settingsRoute: "feature_page"`
(not `settingsLink`) and a new `orders` category. Live cards: Round prices (moved
out of Store settings), Coupons, Automatic discounts, Quantity offers, Email
campaigns, Shareable catalog, Order protection, Missed orders; Cross-selling,
Sales pop-up and Downsell were made apps the same day in another session. The
notes below are the original plan.

- New manifest field `settingsLink` (a fixed, typed key mapped to an existing
  dashboard path, e.g. `sales_popup → /stores/:id/settings/sales-popup`), used
  instead of `settingsRoute` for features that already have a page. The old
  pages stay where they are; the App Center links to them.
- New `APP_IDS`: `coupons`, `cross_sell`, `quantity_offers`, `sales_popup`,
  `order_protection`, `exit_offer` (the exit coupon pop-up), `sitemap`,
  `languages`, `shoppable_gallery`, `checkout_form`. New category `sales`
  (offers that raise order value) and `protection`.
- `installMode: "builtin"` for always-on ones (sitemap, languages, coupons),
  `toggle` for those with an on/off.
- Add the EasyOrders names to `keywords` (Downsell, Social proof, Upsell,
  Bundles, Merchant, OTP …) so a seller coming from EasyOrders finds them.

### P2 · One on/off and one config contract (no migration)

- `packages/lib/src/apps/app-state.server.ts`: `getStoreAppStates(sellerId, storeId)`
  returns `{ [appId]: { enabled, config } }` for one store in **one** query set,
  cached with `createCachedQuery` and a tag that includes the seller id
  (rule 8), purged on every install, uninstall or settings save.
- Each app with settings gets an adapter in `packages/lib/src/apps/adapters/<id>.server.ts`:
  `configSchema` (zod), `read(store)`, `write(storeId, input)` and
  `isEnabled(store)`. For existing features the adapter **reads the place the
  setting already lives** (`stores.settings.salesPopup`, coupons table, …), so
  no data moves. New apps keep their config in `store_app_installs.config`.
- Every write takes an explicit `storeId` and checks store ownership (rule 5).

### P3 · Storefront slots (no migration)

- A fixed list of slots in the ecommerce app: `product.buyBox.after`,
  `product.below`, `cart.summary`, `checkout.beforeSubmit`, `page.overlay`,
  `thankYou`.
- Each storefront app registers a **server component** per slot in
  `apps/ecommerce/lib/apps/slots.ts`; `<AppSlot name="…">` renders the enabled
  ones from `getStoreAppStates`. Pop-ups (sales, exit offer) move behind
  `page.overlay` one at a time, each behind a test that its output is unchanged.
- No seller or developer JavaScript (rule 9): slots render Tallaby's own
  components only. Never on checkout for anything except Tallaby's own
  checkout apps (OTP, order rules).

### P4 · Order and checkout hooks (migration, **owner approval: checkout**)

- Checkout **guards** (run in `placeOrderFromCart`, before the order is
  written): `orderRules` (A3), `countryGate` (A5), `otp` (A2), `fraudScore` (A1).
  One interface `CheckoutGuard.check(ctx) → ok | block(reason) | hold(reason)`,
  run in a fixed order, each a no-op unless its app is on. `place-order.ts`
  gets one call site, not four.
- Order **events** (after commit): an outbox table `app_events`
  (store_id, seller_id, type `order.created | order.status_changed | order.paid`,
  payload, `dedupe_key` unique, status, attempts; RLS on, no policies) written
  in the same transaction as the order, and one cron dispatcher that delivers
  to the installed apps (Sheets, Meta/TikTok CAPI, WhatsApp, notifications).
  Today each of these is called separately; they move to the outbox one at a
  time. The same outbox later feeds public webhooks (F-17) and third-party
  apps (`docs/apps-platform.md` §6).
- Money: guards only block or hold an order; none of them changes the fee,
  the total or the ledger (rule 7).

## 4. New apps, in order

Priority uses seller impact for COD sellers (fake orders, order value) first.

| # | App | Pri | Needs | Notes |
| --- | --- | --- | --- | --- |
| **A1** | Fake-order blocker v2 (حاجب الطلبات الوهمية) | P1 | P4 guards | Score each order from rules first: phone format and carrier prefix, name looks real (letters, length, repeated chars), address has a district and a street, same phone with refused or returned orders **in this store**, duplicates in 24 h, rate-limit hits. Only ambiguous orders go to AI (`generateStructured`, `fast` tier, thinking `minimal`, capped input, result cache, daily cap; rule 20). Result: allow, "needs confirm" (WhatsApp confirm, F-02g) or block. Price: owner to set (EasyOrders charges $2/mo); suggest free with Pro. A cross-store "refused at other Tallaby stores" signal is a privacy and legal question: owner decision, off by default. |
| **A2** | WhatsApp OTP at checkout | P1 | F-109 live, P4 | Meta authentication template on the Tallaby number; replaces F-02f's SMS plan. Per-store: always, or only when A1 says "needs confirm". Codes hashed, 5 min, 3 tries, rate-limited per phone and IP. Each message costs Meta's fee: owner to decide who pays (per-OTP `usage` pricing already exists in the manifest). |
| **A3** | Order rules (الحد الأدنى للطلب والشحن المجاني) | P1 | P4 guards | One app page for minimum order total, free shipping over X (moves the existing `freeShippingOver` field into the app's screen; same storage) and "add X more for free shipping" bar in the cart (`cart.summary` slot). Money/checkout: needs owner approval. |
| **A4** | Bundles (حزم المنتجات) | P1 | F-07a (owner), P3 | F-07f: a bundle product made of products/variants at one price, stock taken from each item. Delayed by owner 2026-11-04: ask to lift. |
| **A5** | Orders from my country only | P1 | P4 guards | Block or hold when the phone's country or the visitor's IP country is not in the store's selling countries (F-61). Reuses `visitor-country.lib.ts` and `client-ip.lib.ts`. Small. |
| **A6** | TikTok Events API | P1 | P4 events | Server events next to Meta CAPI, same event ids as the TikTok pixel for dedupe. Token encrypted like other credentials. |
| **A7** | Staff with permissions (المشرفين) | P1 | owner lifts the F-09 delay | F-09a design already written. Highest security risk of the list: separate review, per-store roles, every server action checks the member's role, not only the seller. |
| **B1** | WooCommerce import | P2 | — | Same pipeline as `shopify_import` (`catalog.import`): products, variants, photos; orders later. |
| **B2** | Dropshipping suppliers (Taager …) | P2 | F-99 design | One `supplier` integration type, one connector per supplier. |
| **B3** | UTM link builder | P2 | owner | Bring F-26's hidden page back as an app, only if the owner wants it (F-65b hid it). |
| **B4** | More languages | P3 | — | After the international storefront grows (F-61). |

## 5. Order of work

1. **P1 cards** (no migration, low risk): sellers see ~10 more apps at once.
2. **P2 state + adapters** for the P1 apps (no migration).
3. **A5** and **A3** on a first version of **P4 guards** (owner approval for checkout).
4. **A1** fake-order v2 (rules, then AI for the grey zone).
5. **P4 events outbox** (migration, staging first) + **A6** TikTok Events API.
6. **A2** WhatsApp OTP once F-109 is live.
7. **A4** bundles and **A7** staff when the owner lifts their delays.
8. **P3 slots**: move pop-ups one by one, any time after step 2.

## 6. Owner decisions (answered 2026-11-27)

- **Prices:** "Anything doesn't cost us money keep it for free." So the rules-based fake-order blocker, order rules, the country gate and every feature-page card are free. Anything with a running cost (AI scoring, WhatsApp OTP messages) gets its price when it is built.
- **WhatsApp:** keep it "Coming soon" until Meta Business is connected (it already is: the card follows the admin WhatsApp switch, and 0180 is not applied). WhatsApp OTP waits for it.
- **Bundles (F-07f):** start now. **Staff accounts (F-09):** stay delayed.
- **Checkout guards (A3 order rules, A5 country gate) and the app-state base (F-115b):** "okay".
- Still open: the cross-store fake-order signal, the UTM page.

### The original questions

1. Prices: fake-order blocker and OTP (free, free with Pro, or monthly/usage)?
2. Who pays WhatsApp OTP message fees?
3. Cross-store fake-order signal (refused at other Tallaby stores): allowed?
4. Lift the delays on bundles (F-07f) and staff (F-09)?
5. Bring the UTM builder back as an app?
6. Confirm: no cloaking and no unofficial WhatsApp.
7. Checkout guards (A1, A2, A3, A5) touch checkout: approve P4 before it starts.
