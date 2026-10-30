# Tallaby MCP: AI assistants manage the store (F-29) — design note

**Status:** Plan, 2026-10-30. Nothing built. Owner answered §12 on 2026-10-30; F-29b can start.
**Roadmap:** `ROADMAP.md` §4 F-29 (tasks F-29a … F-29k). Related: F-09 staff (`2026-10-30-staff-accounts-design.md`), F-17 public API and webhooks.
**Goal (owner, 2026-10-30):** "sellers can connect their accounts Claude, ChatGPT, etc with Tallaby to fully manage their store … advanced, manage items, orders, website builder, theme, etc".

---

## 1. What the seller gets

A seller opens **Store › Apps › AI assistants**, copies one URL (`https://mcp.tallaby.com/mcp`), and pastes it into Claude (Settings › Connectors › Add custom connector), ChatGPT (Settings › Apps › Developer mode › Create), Claude Code, Cursor, or any other MCP client. The client opens a Tallaby sign-in page. The seller signs in, chooses **which stores** and **what the assistant may do**, and clicks Allow. After that they can ask, in Arabic or English:

- "What came in today? Confirm the orders from Cairo and ship them with Bosta."
- "Add these 12 products from the photos/links, write the copy in Arabic and English, put them in Kitchen and price them 20 % over cost."
- "Raise every price in Shoes by 10 %, but show me first."
- "Change my store to a dark green theme, put a summer sale banner on the home page, and show me a preview before publishing."
- "Which products are about to sell out? Who are my best customers this month?"
- "Make a coupon SUMMER15 for 15 % off, minimum 500 EGP, ending Friday."

The seller can see every connected assistant, what it did (an activity log), and revoke it at any time.

## 2. What exists today (checked in code, 2026-10-30)

| Piece | State | Where |
| --- | --- | --- |
| Session and tenancy | Cookie-only. `requireSeller` / `requireStore` return a seller and a store checked in SQL; the policy (`checkSellerAccess`, `checkStoreAccess`, `isUuid`) is pure and reusable. | `apps/dashboard/lib/auth/require-seller.server.ts`, `access.lib.ts` |
| API keys / OAuth server | **None.** Only `CRON_SECRET`, backend `INTERNAL_API_SECRET`, and the Google Sheets OAuth *client*. | — |
| Staff permissions | Designed, not built: `resolveActor()` → `ActorContext` with permission keys (`orders.manage`, `website.publish`, …) and owner-only areas. | `docs/superpowers/specs/2026-10-30-staff-accounts-design.md` §3–§4 |
| Public host | `apps/backend` is Hono 4 on Vercel (`/api`), already uses `@workspace/db` and `@workspace/lib`, no Next/cookie runtime. | `apps/backend/src/api/hono-app.ts` |
| **Reusable logic (callable with a sellerId/storeId)** | Builder (drafts, design system, chrome, pages, publish, revisions, templates), media library, shipping zones, payments read, customers CRM, notifications, product trash, Bosta ship. | `packages/lib/src/store-sites/server.ts`, `media/server.ts`, `stores/server.ts`, `customers/`, `notifications/`, `products/trash.server.ts`, `shipping/bosta-ship.server.ts` |
| **Entangled logic (inside `"use server"` + cookies + `revalidatePath`)** | Order confirm/cancel/ship (`orders.server.ts`), product create/update/variants (`actions/products.ts`, ~2,100 lines, **no server-side zod**), coupons (`actions/coupons.ts`), restock, bulk edit, categories/brands. | `apps/dashboard/…` |
| Builder schema | Zod node tree (`componentNodeSchema`, `ALLOWED_NODE_TYPES`), `validatePageContent`, limits (50 pages, 80 sections, 200 nodes per list), stable `props.field` names. | `packages/store-sections/src/config/schema.ts`, `validate.ts` |
| Rate limiting | In-memory per instance only — not usable for a public endpoint. | `apps/dashboard/lib/rate-limit.lib.ts` |
| Audit | `store_settings_audit` (seller side, few writers), `stock_movements.actor_user_id`, `admin_audit_log`. | schema |
| Usage counters | `ai_usage_logs` + `checkDailyCap` pattern. | `packages/ai/src/usage.server.ts` |

**Conclusion:** about half the surface is ready to wrap; products, orders and coupons must first move into shared `packages/lib` "commands" (§6). That extraction is the biggest piece of work, and it also pays off for F-05 manual orders, F-09 staff, F-17 API and F-31 POS.

## 3. Client requirements (checked 2026-10-30)

| Client | Transport | Auth | Notes |
| --- | --- | --- | --- |
| Claude (claude.ai, Desktop, mobile) custom connector | Streamable HTTP | OAuth 2.1 + PKCE; client registration by **CIMD** (if the AS metadata has `client_id_metadata_document_supported: true` **and** `none` in `token_endpoint_auth_methods_supported`) else **DCR** (RFC 7591) | Protected-resource metadata `resource` must equal the URL the user typed, path included. Public client → rotate refresh tokens. Directory listing later needs Anthropic review. |
| Claude Code / Cursor / VS Code | Streamable HTTP | Same OAuth (loopback redirects on `localhost`/`127.0.0.1`, any port) **or** a personal access token in `Authorization: Bearer` | |
| ChatGPT (Developer mode / Apps) | Streamable HTTP | OAuth 2.1 + PKCE; prefers CIMD, supports DCR; redirect `https://chatgpt.com/connector/oauth/{callback_id}` (+ legacy `…/connector_platform_oauth_redirect`) | Write tools available in developer mode; plan gating of write actions is reported by third parties — verify before promising sellers. App Directory listing is a later, separate review. Optional Apps SDK UI widgets. |

Sources: Claude connector auth docs (claude.com/docs/connectors/building/authentication), OpenAI Apps SDK auth docs (developers.openai.com/apps-sdk/build/auth).

## 4. Architecture

```
 Claude / ChatGPT / Cursor
        │  Streamable HTTP, Bearer <access token>
        ▼
 mcp.tallaby.com  ── apps/backend (Hono)  /mcp  +  /.well-known/oauth-protected-resource
        │   tokenAuth → AgentActor (seller, stores, scopes)    rate limit · audit · idempotency
        │   tool registry (zod in/out) ──► packages/lib/src/commands/*  (shared with dashboard actions)
        │                                   └► @workspace/db (Drizzle, every query seller+store scoped)
        │                                   └► @workspace/cache applyInvalidation (cross-app broadcast)
        ▼
 dashboard.tallaby.com  ── OAuth authorization server (needs the seller's cookie session for consent)
     /.well-known/oauth-authorization-server   /oauth/register (DCR)   /oauth/authorize (consent page)
     /oauth/token (code+PKCE, refresh rotation)  /oauth/revoke     Store › Apps › AI assistants UI
```

Decisions:

1. **MCP server lives in `apps/backend`** (new `src/mcp/`), mounted outside `internalApiAuth`, served on its own host `mcp.tallaby.com` (a Vercel domain alias on the backend project). Stateless Streamable HTTP (no server sessions, no SSE stream needed), using the official `@modelcontextprotocol/sdk` web-standard transport inside a Hono route. No `next/*` imports are allowed in anything it calls.
2. **The authorization server lives in the dashboard**, because consent needs the seller's existing Supabase session and the store picker. It is our own small OAuth 2.1 server (four routes + one page), not Supabase's OAuth server feature: we need store selection and Tallaby scopes on the consent screen, and the token check must be one indexed lookup in our DB. (If Supabase Auth's OAuth 2.1 server is GA and supports custom consent with store choice at build time, re-evaluate in F-29b.)
3. **Tokens are opaque**, 32 random bytes, prefix `tby_at_` / `tby_rt_` / `tby_pat_`, stored only as `sha256`. Access token 1 h, refresh token 30 days, **rotated on every use** with reuse detection (a reused refresh token revokes the whole grant). Personal access tokens (Claude Code, n8n, own scripts) use the same table with no refresh and an optional expiry — this *is* the F-17 API key model, so F-17 builds on F-29, not the other way round.
4. **One actor model with staff.** A token resolves to an `AgentActor` = the F-09 `ActorContext` of the user who approved it, **narrowed** to the granted stores and scopes, with `kind: 'agent'` and `grantId`. Permission checks are the F-09 `hasPermission` / `storeInScope` functions. Until F-09 ships, only owners can connect (the user must be the seller), which is equivalent to the owner context. When staff ships, a staff member's grant can never exceed their role (`scopes ∩ role permissions`, re-checked on every call, so a demoted staff member's agent loses access immediately).
5. **Owner-only areas are never exposed** to agents in v1, whatever the scopes: wallet top-up, payouts and withdrawals, affiliate earnings, plan and billing, legal/account data, store payment-method account numbers and gateway secrets, integration secrets (API keys, tokens), staff management, custom domains and changing an existing subdomain, archiving/deleting stores, account deletion. **Creating a store is allowed** (scope `stores.create`, within the plan's store limit) so a seller can build a store with AI from zero (owner, 2026-10-30).
6. **Same side effects as the dashboard.** Agent writes call the same shared code the dashboard calls, so everything that hangs off a dashboard action still happens — in particular the **welcome gift** (`grantWelcomeGiftSafely` after publish, today called in the dashboard's `editor.server.ts` wrapper), cache invalidation, stock movements, order emails and push. Any such hook found in a dashboard wrapper moves into the shared command or is called by the MCP tool too, with a test.
7. **Free for every plan** (owner, 2026-10-30): the seller's own assistant does the AI work, so Tallaby's AI cost goes down; MCP only costs backend calls. Rate limits (§8) protect the backend.

## 5. Scopes (consent screen) → permission keys

Scopes are coarse and readable on a phone. Each maps to F-09 permission keys.

| Scope | Arabic label (draft) | Grants | Default on consent |
| --- | --- | --- | --- |
| `store.read` | عرض بيانات المتجر | products.view, orders.view, reports.view, read settings/shipping/coupons/site | ✓ (required) |
| `customers.read` | عرض بيانات العملاء (أرقام وعناوين) | customers.view (PII) | ☐ |
| `products.write` | إدارة المنتجات والمخزون | products.manage, media.manage, coupons.manage | ✓ |
| `orders.write` | إدارة الطلبات والشحن | orders.manage, customers.manage | ✓ |
| `orders.refund` | إلغاء الطلبات المدفوعة واسترداد المبلغ | orders.refund | ☐ |
| `website.write` | تعديل تصميم الموقع (مسودة) | website.manage, media.manage | ✓ |
| `website.publish` | نشر الموقع للزوار | website.publish | ☐ |
| `settings.write` | إعدادات المتجر والشحن | store.settings | ☐ |
| `products.purge` | حذف نهائي من سلة المهملات | products.purge | ☐ (never via bulk) |
| `stores.create` | إنشاء متجر جديد | create a store (plan limit; the new store joins the grant) | ☐ (on when the seller starts "build my store with AI") |

`website.publish` stays off by default (owner approved the defaults), but the agent **may publish whenever the seller asks it to** once the scope is on (owner, 2026-10-30): `publish_site` runs only after the seller's request in the chat, a preview link and the confirm step. If the scope is off, the tool answers with a one-tap link to re-consent with publish added.

A grant covers a chosen set of stores (or "all my stores, including new ones"). Tools receive an explicit `storeId` every call (CLAUDE.md rule 5: no "current store" for writes); `list_stores` returns only stores in the grant.

## 6. Shared command layer (the core refactor)

New `packages/lib/src/commands/<domain>/*.server.ts`. Each command:

```ts
export async function confirmOrder(
  ctx: CommandContext,              // { actor: ActorLike; store: StoreContext; q?: Tx; now?: Date }
  input: ConfirmOrderInput,         // zod-parsed by the caller (schemas in *.dto.ts next to it)
): Promise<CommandResult<OrderSummary>>   // { ok: true, data, invalidate: CacheTag[] } | { ok: false, code, message }
```

Rules: seller and store come only from `ctx` (never from input); every row touched is filtered by `seller_id` **and** `store_id` in the same SQL; bulk commands use `= ANY($ids)` and return the changed count; no `next/*` imports; side effects that today use `after()` (emails, push) are returned as `effects` or queued, and each caller runs them (`after()` in the dashboard, `waitUntil` in the backend); actor id goes to every actor/audit column (`stock_movements` via `setStockContext`, `store_settings_audit`, order events).

The dashboard actions become thin: `requireStore` → zod parse → command → `revalidatePath`. This removes duplication instead of adding a second copy of order and product logic (CLAUDE.md rule 3: small steps, behaviour unchanged — each extraction lands alone with its existing tests passing, and new tests for the command).

Extraction order (by value to sellers via MCP): orders (confirm/cancel/status/ship, bulk ≤ 50) → products (create/update/variants/status, **with server-side zod**, which today is missing) → stock restock → coupons → categories/brands → bulk price edit (preview/apply/undo).

## 7. Tool catalogue (v1 ≈ 45 tools)

Naming: `snake_case`, verb first. Every tool has zod input and output schemas, MCP annotations (`readOnlyHint`, `destructiveHint`, `idempotentHint`), and a description that tells the model the rules (bilingual copy, prices in EGP, ask before bulk changes). Lists are paged (`cursor`, `limit` ≤ 50) and return compact rows; detail tools return one full object.

**Account and stores** — `whoami` (seller, plan, granted scopes, stores), `list_stores`, `get_store_overview` (today/7d orders, revenue, pending confirmations, low stock, site status, wallet balance *only as a number if* `wallet.view` is ever granted — v1: omitted).

**Catalog** (`store.read` / `products.write`)
- `search_products` (text, category, status, stock filters), `get_product` (with variants, translations ar/en, images, SEO, stock)
- `create_product`, `update_product` (partial; translations require both `ar` and `en` when copy changes — CLAUDE.md rule 13 / AI bilingual rule), `set_product_status` (draft/active), `trash_products`, `restore_products`, `purge_trashed_products` (`products.purge`, confirm token)
- `upsert_variants`, `adjust_stock` (absolute or delta, reason → `stock_movements`), `list_low_stock`
- `add_product_images` from public URLs (server fetch with SSRF guard: https only, public IPs only, ≤ 10 MB, image MIME sniffed, re-encoded) or from a media-library id
- `bulk_update_prices` / `bulk_update_products` → always returns a **preview + `confirmToken`**; `apply_bulk_change(confirmToken)`; `undo_bulk_change`
- `list_categories`, `manage_categories` (add/rename/reorder/delete), `list_brands`, `manage_brands`, `set_product_taxonomy`
- `list_product_questions`, `answer_product_question`, `list_reviews`, `reply_to_review`

**Orders and customers** (`store.read` / `orders.write` / `customers.read`)
- `list_orders` (status, date range, governorate, payment, risk, text), `get_order` (items, customer, shipment, timeline, risk flags)
- `update_order_status` (confirm, cancel with reason, mark shipped/delivered/returned — exactly the `SELLER_ORDER_ACTIONS` flow), `bulk_update_orders` (≤ 50, preview + confirm)
- `ship_with_bosta` / `export_wassalha` (when connected), `get_shipping_label_url`
- `list_missed_orders`, `list_customers`, `get_customer` (PII only with `customers.read`; otherwise phones masked `010*****89`), `set_customer_note_tags`, `block_phone` / `unblock_phone`
- `get_order_invoice_url` (signed, short-lived link to the existing print page)

**Marketing** — `list_coupons`, `upsert_coupon`, `set_coupon_active`, `delete_coupon`; `get_report` (sales, top products, per-product views, UTM campaigns, period compare).

**Website builder and theme** (`website.write` / `website.publish`) — agents edit **drafts only**; customers see nothing until `publish_site`.
- `get_site_outline` — pages (slug, kind, home), each page's sections as `{sectionId, designId?, title, fields: {name: shortValue}}`, header/footer summary, theme tokens, `draftVersion`, site status. Compact by design (no raw trees unless asked).
- `get_section` — one section's full tree (node ids, types, props, field names).
- `list_designs` (by library category: hero, products, about, popups, …; returns design id, name, field names and kinds) and `list_templates` (niche, key, preview image).
- `add_section` (page, designId, position, field values), `update_section_fields` (by stable `props.field` names — the field-names snapshot already guarantees they stay stable), `update_node` (whitelisted props only: text, image, link, colors from tokens, visibility per device), `move_section`, `remove_section`, `duplicate_section`
- `update_theme` (colors, fonts from `core/fonts.ts`, radius, spacing — validated by `designSystemSchema`), `update_header_footer` (menu links, logo, announcement bar)
- `manage_pages` (create/rename/reorder/delete page, SEO)
- `apply_template` (preview + confirm; replaces drafts; keeps `undoTemplate` working)
- `get_preview_link` — signed builder-preview URL (existing verified preview, short TTL) so the seller can look before publishing
- `publish_site` (`website.publish`, confirm token, writes a `store_site_revisions` row with `published_by` = the approving user and the grant id in metadata), `list_revisions`, `restore_revision_to_draft`, `discard_drafts`
- Every write: `validatePageContent` + sanitize + `draftVersion` check (optimistic concurrency, so an agent never overwrites the seller's open editor silently — conflict returns `version_conflict` and the fresh outline). **No HTML, CSS or JS strings ever** (CLAUDE.md rule 9); only allowed node types and token-based styles.

**Store setup by AI** (owner priority #2, F-29l) — everything a new seller needs to go from nothing to a live store in one chat:
- `create_store` (`stores.create`: name, subdomain, default language, niche; uses `createStore` in `packages/lib/src/stores/server.ts` and the normal starter-site scaffold; plan limit enforced; the store is offline until published, as today)
- `list_templates` (by niche, with preview images) → `apply_template` (preview + confirm) — the **theme selector**
- `update_store_info` (name, description, logo/favicon from URL, contact phone/WhatsApp/email/address, default language, SEO)
- `update_social_links` (Facebook, Instagram, TikTok, WhatsApp, …) and tracking IDs for the fixed pixel templates (Meta Pixel, TikTok Pixel, GA4 — IDs checked by regex, CLAUDE.md rule 9)
- Shipping: `list_shipping_zones`, `upsert_shipping_zone`, `delete_shipping_zone`, `apply_shipping_template`, `set_free_delivery`; carriers: `list_store_apps` (what is connected), `enable_wassalha` (store ID and name, no secret). Carriers that need a **secret key** (Bosta, Meta CAPI token, payment gateways) are never typed into the chat: the tool returns a dashboard deep link where the seller pastes the key, and the agent can check the connection status afterwards.
- `get_setup_checklist` — what is still missing before publish (logo, products, shipping zones, contact info, payment method, template) so the agent can guide the seller step by step.

**Settings** (`settings.write`) — `get_store_settings`, `update_checkout_settings` (form fields, thank-you page, minimum order), plus the store-info, social and shipping tools above.

**Notifications** — `list_notifications`, `mark_notifications_read`.

**Prompts (MCP prompts, optional)** — "Daily store briefing", "Confirm today's orders", "Launch a product", "Refresh my home page". They only chain the tools above.

**Not in v1:** archiving or deleting stores, wallet/payout anything, payment-method account numbers and gateway keys, integration secrets (Bosta key, Meta token), domains, staff, AI image generation inside Tallaby (no Tallaby AI cost — the seller's assistant does the thinking and writing; CLAUDE.md rule 20 is not touched because MCP calls no `generateStructured`).

## 8. Safety

| Risk | Control |
| --- | --- |
| Cross-tenant access with forged ids | Seller/store from the token only; store ∈ grant; every row filtered by seller **and** store in SQL; unknown or foreign ids → `not_found` (same as F-09 T1). Integration test per tool: grant for seller A with seller B's ids changes nothing. |
| Prompt injection from customer text (order notes, names, reviews, questions, form submissions) | Such fields are returned inside an `untrusted` object and the server instructions say they are data. Destructive, bulk, money and publish tools need a **`confirmToken`** from a preview call (HMAC over grant + tool + normalized args, 10 min, single use), so one injected instruction cannot cancel 50 orders in one step. MCP clients also ask the user before write tools (annotations). |
| Runaway agent | Durable rate limits in Postgres (`agent_rate_windows`: per grant 120 calls/min, 2,000/day; writes 30/min; bulk 10/hour) — not the in-memory limiter. Bulk caps: 50 orders, 500 products per change. |
| Money and ledger | No ledger code changes (rule 7). Cancelling a wallet-paid order needs `orders.refund` and goes through the existing idempotent path. Delivered-order fee works as today. |
| Duplicate creates on retries | `idempotencyKey` (optional input) on create tools; stored with the result in `agent_tool_calls` (unique per grant + key, 24 h). |
| PII leakage | `customers.read` off by default; masked phones/addresses otherwise; exports not available to agents in v1. |
| Token theft | Hashed storage, short access TTL, refresh rotation + reuse detection, revoke from the dashboard, `last_used_at`/IP/user-agent shown, all grants revoked on password change and on seller suspension (checked every call via `checkSellerAccess`). |
| SSRF via image URLs | Fetch from the backend with DNS resolution checked against private ranges, redirect limit 2, size/MIME limits, re-encode before storing. |
| Secrets | `MCP_TOKEN_PEPPER` (optional HMAC pepper) and `MCP_CONFIRM_SECRET` server env only (rule 10). No secrets in tool results or logs; args logged as a redacted summary. |
| Caching | Never cache tokens, grants or tool results (rule 8). Writes invalidate the same tags the dashboard does, through `@workspace/cache` broadcast, with seller id in every tag. |

## 9. Data model (migration `0132_mcp_agent_connections.sql`, server-only, RLS on, no policies)

- `oauth_clients` — `id`, `client_id` (DCR random id or CIMD URL), `kind` (`dcr`|`cimd`|`pat`), `name`, `redirect_uris text[]`, `logo_url`, `software_id`, `created_at`, `last_used_at`, `disabled_at`.
- `agent_grants` — `id`, `seller_id` → sellers, `user_id` (who approved; = seller for owners), `client_id` → oauth_clients, `client_label` (e.g. "Claude"), `all_stores bool`, `store_ids uuid[]`, `scopes text[]` (CHECK ⊆ known list), `created_at`, `last_used_at`, `revoked_at`, `revoked_reason`.
- `oauth_auth_codes` — `code_hash`, `grant_id`, `redirect_uri`, `code_challenge`, `expires_at` (60 s), `used_at`.
- `agent_tokens` — `id`, `grant_id`, `kind` (`access`|`refresh`|`pat`), `token_hash` unique, `family_id` (rotation chain), `expires_at`, `used_at`, `revoked_at`, `name` (PAT), `last_used_ip`, `last_used_ua`.
- `agent_tool_calls` — `id`, `grant_id`, `seller_id`, `store_id`, `tool`, `args_summary jsonb` (redacted), `status` (`ok`|`error`|`denied`|`rate_limited`), `error_code`, `idempotency_key`, `result_ref jsonb`, `duration_ms`, `created_at`; unique (`grant_id`, `idempotency_key`) where key not null; index (`seller_id`, `created_at desc`). Retention 90 days (cron).
- `agent_rate_windows` — (`grant_id`, `bucket`, `window_start`) PK, `count`; `INSERT … ON CONFLICT DO UPDATE SET count = count + 1 RETURNING count`.
- Seller bell type `agent_connected` (type check rebuilt, guarded) so a new connection is always visible to the owner, plus push via F-06.

Mirror in `schema.ts` / `relations.ts`; record in CLAUDE.md rule 6. Staging first, production with owner approval.

## 10. Dashboard UI

**Store settings › Apps › AI assistants** (a card in the F-41 apps catalog):
- "Connect" tabs with copy-paste steps and screenshots for Claude, ChatGPT, Claude Code/Cursor (URL + optional personal token).
- Connected assistants: client name/logo, stores, scopes, connected on, last used, **Revoke**; edit stores/scopes (re-consent).
- Activity: the `agent_tool_calls` feed in plain language ("Claude confirmed order #1045", "ChatGPT changed 14 prices in Shoes"), filter by assistant and store; links to the order/product.
- Personal access tokens: create (shown once), name, expiry, revoke.

**Consent page** `dashboard.tallaby.com/oauth/authorize` (ar default, en; RTL): Tallaby logo, "Claude wants to manage your store", client name **and redirect host** shown, store picker, scope switches with the labels in §5, Allow / Cancel. Strings in both `ar.json` and `en.json`.

## 11. Phases and tasks (order set by the owner, 2026-10-30)

Task IDs never change; the **order** below is the build order.

| # | Task | What | Deps | Size |
| --- | --- | --- | --- | --- |
| — | **F-29a** | This design note, owner answers (done 2026-10-30), security review sign-off. | — | S |
| 1 | **F-29b** | Migration 0132; OAuth AS in the dashboard (metadata, DCR, CIMD fetch+cache with validation, authorize/consent, token with PKCE S256 + refresh rotation, revoke); token verification lib in `packages/lib/src/agents/` (`resolveAgentActor(token)`); unit tests for PKCE, rotation reuse, scope narrowing. | F-29a | L |
| 2 | **F-29c** | MCP endpoint in `apps/backend` (`/mcp`, protected-resource metadata, `WWW-Authenticate` on 401), tool registry with zod I/O, audit, Postgres rate limiter, idempotency, confirm tokens; **read-only tools** (stores, overview, products, orders, customers masked, coupons, reports, site outline, notifications). Test with Claude (custom connector), ChatGPT developer mode and MCP Inspector. | F-29b | L |
| 3 | **F-29d** | Dashboard AI assistants page (connections, revoke, activity, personal tokens) + `agent_connected` bell. | F-29b | M |
| 4 | **F-29f** | **Products first** (a customer asked for it): extract product commands (create/update/variants/status/stock/taxonomy, trash) with server-side zod; catalog write tools; image import from URL (SSRF guard). | F-29c | XL |
| 5 | **F-29l** | **Store setup by AI** (§7): `create_store`, theme selector (`list_templates` + `apply_template` with confirm), store info and contact, logo/favicon, social links and pixel IDs, shipping zones and templates, free delivery, Wassalha, carrier status + dashboard links for secret keys, `get_setup_checklist`. | F-29f | L |
| 6 | **F-29h** | Website builder tools: outline, designs catalogue, sections add/update/move/remove, node edits, theme tokens, header/footer, pages, preview link (drafts only). | F-29c | L |
| 7 | **F-29i** | Publish (when the seller asks; confirm + `website.publish`; calls `grantWelcomeGiftSafely` like the dashboard), revisions, discard. After this a seller can build a whole store from one chat. | F-29h | S |
| 8 | **F-29e** | Extract order commands to `packages/lib/src/commands/orders`; dashboard actions call them; order write tools (+ bulk with confirm, Bosta, Wassalha export). | F-29c | L |
| 9 | **F-29g** | Coupons, bulk price change (preview/apply/undo), Q&A and review replies. | F-29f | M |
| 10 | **F-29j** | Remaining settings (checkout form, thank-you page, minimum order) + MCP prompts ("Build my store", "Daily briefing", "Confirm today's orders"). | F-29c | M |
| 11 | **F-29k** | Hardening and launch: per-tool cross-tenant integration tests, rate-limiter load test, `mcp.tallaby.com`, docs page on tallaby.com (ar/en), tutorial video (rule 18) once live; submit to the Claude Connectors Directory and the ChatGPT App Directory (privacy policy, demo store account). | F-29b–l | M |

Later (not v1): F-17 webhooks reuse `agent_grants`/PATs; ChatGPT Apps SDK widgets (order cards, product grid); staff grants after F-09; AI-generated images.

Milestones: after #2 sellers can ask about their store; after #4 they can manage products; after #7 they can **create a whole store with AI from zero**; after #8 they can run daily orders.

## 12. Owner decisions (2026-10-30)

1. **Plans:** free for every plan, Free included — it costs only backend calls and moves AI work off Tallaby's own model. No connection limit beyond the rate limits.
2. **Default scopes:** approved as in §5 (customer PII, refunds, publish, settings, purge and store creation off by default).
3. **Publish:** the agent may publish when the seller asks for it (scope on + preview + confirm).
4. **Host:** `mcp.tallaby.com` approved (DNS record on Vercel DNS, alias on the backend project).
5. **Order of work:** products first (a customer asked for it), then everything needed to create a store by AI (theme selector and apply, builder, social links and pixels, shipping, store settings and contact info, publish), then orders, then the rest — §11.
6. **Staff:** owners only for now.
7. **Directory listings:** yes, list Tallaby in the Claude and ChatGPT directories (F-29k).
8. **Activity retention:** 90 days.
