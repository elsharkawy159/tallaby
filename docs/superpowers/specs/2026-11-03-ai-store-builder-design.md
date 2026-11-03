# AI Store Builder: design note (ROADMAP.md F-54b)

Written 2026-11-03, after the cost study (`docs/ai-store-builder-cost-study.md`, accepted by the owner). Code: `apps/dashboard/app/(main)/ai-builder/`, routes `apps/dashboard/app/api/ai/store-builder/*`, tables in migration `0141`.

**Goal.** A signed-in seller gets a complete store from one conversation and reviews it. Only the seller publishes. The first build uses no credits, up to a hard per-account limit.

## 1. Owner decisions

| Decision | Value |
|---|---|
| Free build | 1 per seller account, ever, by a unique claim row |
| Free limits (also the limits of any build) | 25 products, 100 photos (4 a product), 40 chat turns that use the model, 2 site copy regenerations after the first, $0.40 hard stop |
| Later builds and edits | AI credits (F-57) |
| Account | Required before any model call, upload or costly step. There is no guest chat |
| Publishing | Never automatic. The flow ends at a review screen |

## 2. Entry

- **Signed in:** `/ai-builder` in the dashboard, linked from My stores.
- **tallaby.com:** one small footer link to `dashboard.tallaby.com/signup?next=/ai-builder`. The owner designs the marketing look later. `/signup` passes `next` (only this path is allowed) through email, confirmation and Google. An existing seller lands straight in the chat.
- **Switch:** everything above is hidden, and the routes answer 404, unless `STORE_BUILDER_AI_ENABLED=1` on the app. It stays off in production until 0141 is on production and the live measurement in §9 has run.

## 3. Conversation

Fixed steps in code (`builder.lib.ts`), not a free agent loop (study §8). Every question and chip is an i18n string, so the model never writes text the seller reads as a question. The model only reads free text into a small typed state, and only where code can't.

| Step | Collects | Model? |
|---|---|---|
| `name` | Store name | No |
| `about` | What they sell, in their words | `store_builder_chat`: fills industry hint, contact, social links, products if mentioned |
| `industry` | Chip from `STORE_INDUSTRIES`, the code's match marked recommended | No |
| `contact` | Phone (required), WhatsApp, email | No, regex and `formatPhone` |
| `social` | Links, checked by `normalizeSocialLink` | No |
| `brief` | Tone, audience, style words, English name and tagline, shown as a card | `store_builder_brief` |
| *confirm* | Seller confirms the card: **the free claim is taken here**; uploads and costly steps open only after this | No |
| `logo` | Upload, or skip for the text logo (AI-D7) | No |
| `template` | One of 3 templates shortlisted in code from `CODE_TEMPLATES` | No |
| `products` | Name, price, stock, photos: typed in a form (free) or in a sentence | `store_builder_chat` for sentences |
| `shipping` | Chip (`SHIPPING_TEMPLATES`), free text, or skip | Later, in the build |
| `returns` | Chip or free text, the seller's own terms | Later, in the build |
| `summary` | Shown back; the seller starts the build | No |

Progress is saved per seller in `store_builds.state`, so a closed tab resumes. At most one open build per seller (partial unique index).

**Prices and stock are never invented.** A price or stock count from the model is kept only when that number is in the seller's text. Otherwise the product asks for it, and the build can't start until each product has a price and a stock answer.

**Seller text is data.** Rules are fixed strings, seller text goes inside `<seller_input>`, with `</seller_input>` removed from it first. Output is a typed schema, cleaned again in code. Nothing the model returns can pick a seller, store, template or path, or run anything.

## 4. Build

The browser calls `POST /api/ai/store-builder/run` until it says done. Each call does one step, because there is no job queue and a route has 60 s (`docs/AI_AGENT_PLAN_PROMPT.md`). A closed tab loses nothing: reopening continues.

| Item | What runs | Model |
|---|---|---|
| `store` | The seller's pristine store (draft, no template chosen) or `createStore` (plan limit, subdomain in code) | None |
| `settings` | `updateStoreSettings`, `updateStoreSocialLinks`, `updateStoreSeo` (description from the seller's words) | None |
| `template` | `applyStoreTemplate`: drafts only | None |
| `site_copy` | Fills text slots of the applied drafts, `saveStorePageDraft` | `store_builder_site_copy` |
| `product:<id>` | Autofill per product, `agentCreateProduct` with `publish: false` | `store_builder_product` |
| `catalog` | If the seller has other stores, `setStoreCatalog` to this store's products | None |
| `shipping` | `applyStoreShippingTemplate`, or F-45b's `proposeZones` then `saveStoreShippingZone` | `store_builder_shipping` for free text |
| `policy` | `sellers.return_policy`, only if empty (it is account-wide) | `store_builder_policies` |
| `notes` | Reads titles and taglines for mixed languages and contradictions | `store_builder_review` |

**Never generated code (rules 9, 17).** The model gets numbered text slots and returns `{id, ar, en}`. Code writes those strings into the existing nodes' text props. No model output becomes a node, type, style, link or HTML.

**Idempotent.** `store_build_items` has one row per item. A lease on the build (`lock_until`) stops two tabs running together. Generated copy is saved on the item before it is applied, so a retry doesn't pay twice. Each product has a fixed SKU from the build and item ids, so a crash between create and mark finds the product instead of doubling it. An item fails after 2 attempts and the build moves on; failures appear in the review.

**Products stay drafts.** Products belong to the account, and a live product shows on the marketplace and other stores. So the build creates drafts and the seller makes them live from the review screen, with Publish in the editor as the separate last step.

## 5. Spend

- Spend per build = `sum(cost_micro_usd)` in `ai_usage_logs` for this seller, `feature LIKE 'store_builder_%'`, since the build started. One open build per seller makes that exact. All 7 features have labels in Admin › AI usage.
- **Hard stop:** before each model call, stop if spend + a $0.03 margin for one call reaches $0.40. The margin makes it a real ceiling, since the next call could fall back to `smart`.
- At the stop, model items are skipped and marked, free items still run, and the review lists what's missing. The draft is kept. It doesn't fail.
- Thinking `minimal`, `fast` tier, `cacheMs` 10 minutes, capped input and output (docs/ai.md).

## 6. Abuse limits (study §9)

1. No model call without a session (the routes check it first).
2. A confirmed email, checked on the session user before the claim.
3. One free build per phone number, unique on the claim row. The phone isn't verified (`signup.lib.ts`), so this only stops casual repeats.
4. 3 free builds per IP per Cairo day (stored as a hash).
5. A platform budget of $25 a day (`AI_STORE_BUILDER_DAILY_BUDGET_USD`) over all `store_builder_%` rows. Above it, new free builds wait. It fails closed.
6. Uploads go through our route: type and size checked and counted before anything is stored, in the `products` bucket under `ai-builder/<sellerId>/`, so a path from the client can't point at another seller's photo.
7. Per-seller daily caps per feature, and a burst limiter on each route, and 5 builds a day.

The admin alert in study §9.7 isn't built; it waits for F-58's cost display.

## 7. Later builds use credits

A seller who has claimed gets a paid build. **Each model call of a paid build except chat takes 1 credit** through `claimAiCredit`, refunded when it fails or comes from the cache. A 20-product store costs about 24 credits at $0.01 each. Chat turns cost none (capped). This is the 1 credit = 1 action rule in F-57. The study's other prices (10 credits a store, 3 for regenerate) need the owner's decision.

Credits only run once `billing_settings.usd_live` is true. Until then a paid build is refused, because nothing could pay for it.

## 8. Review

Code lists what's missing: products without photos, products that failed or weren't built, zones not created, places not recognised, no return policy, no logo, drafts failing validation. Each links to where it's fixed. Also a site copy regeneration (2) and a warning if other stores show every product.

## 9. Not done / owed

- **Live measurement (docs/ai.md rule 12, study §10):** no live call has been made. Every number is still the study's estimate. Run the study's §10 tests on the staging key and log them in `PLAN.md` §23 before turning the switch on in production.
- Photo sorting (unsorted batch uploads), CSV/Excel import, PDF input, variants from chat (a product's options are noted for the seller to add by hand).
- Colours from the logo, stock photo search words: the template's palette and photos are used for now.
- Starting in a guest prompt on the homepage (AI-D3): the owner designs that later.
