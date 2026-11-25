# WhatsApp order notifications (ROADMAP.md F-109)

Design and architecture of Tallaby's WhatsApp Business Cloud API integration. Owner request 2026-11-26. Setup steps in Meta: [`whatsapp-meta-setup.md`](whatsapp-meta-setup.md).

Meta's official Cloud API only (Graph API, `graph.facebook.com`). No BSP, no unofficial API, no browser automation.

## 1. Decisions

| # | Decision | Why |
| - | -------- | --- |
| D1 | **One Tallaby number** sends for every store. The display name is **Tallaby / طلبي**. Every message names the store as the seller and Tallaby as the platform: "your order … from {store} on Tallaby". Sellers never get access to the number. | Meta's Messaging Policy forbids impersonating another business and speaking in its voice without permission. Its Terms (§4.1c, §4.4) forbid reselling or sublicensing the platform. Tallaby messaging about orders placed through Tallaby, under its own brand, fits both. Per-store numbers would need Tech Provider status, Embedded Signup and App Review; that is a later option (§9). |
| D2 | **Templates are Tallaby's, in code** (`packages/lib/src/whatsapp/templates.lib.ts`), utility category, Arabic + English, named parameters. Sellers choose events; they do not write template text. | Template quality and category are judged on the whole WABA. One seller's promotional wording could get our utility templates reclassified as marketing (about 18× the price) or paused. |
| D3 | **Free for sellers for now** (owner, 2026-11-26). Admin stores a seller price per message, default `0`. While it is 0, nothing posts to the store wallet. Charging later goes through the apps engine (`chargeAppUsage`, one claim per message id) and **needs owner approval** first (CLAUDE.md rule 4). Tallaby pays Meta. | Owner instruction. |
| D4 | **Opt-in at checkout**: an unticked checkbox, «ابعتلي تحديثات الطلب على واتساب من طلبي» / "Send me order updates on WhatsApp from Tallaby (طلبي)". It shows only while WhatsApp is live for that store. Consent is saved on the order and on a contact row with the text version, time, store and source. | Meta requires opt-in that names the business. Egypt's data protection law 151/2020 asks for explicit consent. |
| D5 | **Opt-out is global per phone.** STOP, إيقاف, الغاء الاشتراك or "unsubscribe" in a reply stops every Tallaby message to that phone, for every store. A later ticked checkbox opts the phone back in. | Meta requires honouring every opt-out request. |
| D6 | **Off until configured.** Nothing sends unless all of these hold: the admin global switch is on, the env is set, the store has WhatsApp on, and the order has consent. Each store's WhatsApp default when the admin turns WhatsApp on is an admin setting (default **off**). | Deploying is safe, and admin controls Tallaby's Meta spend. |
| D7 | **Secrets live only in the backend** (`apps/backend`, `api.tallaby.com`). The Next apps queue events through the internal API (Bearer `INTERNAL_API_SECRET`), like order emails do. | CLAUDE.md rule 10. One place holds the Meta token. |

## 2. Events and templates

| Event key | When it is queued | Template (`name`, v1) | Buttons |
| --------- | ----------------- | --------------------- | ------- |
| `order_placed` | Order placed and not `payment_processing` (or online payment confirmed) | `tallaby_order_placed` when the order is `pending` (awaits confirmation); `tallaby_order_received` otherwise | Quick reply **Confirm order / تأكيد الطلب** and **Cancel order / إلغاء الطلب** (pending only) |
| `order_confirmed` | Seller or admin confirms. **Not sent** when the shopper confirmed by button (they get a free in-session reply instead). | `tallaby_order_confirmed` | — |
| `order_shipped` | Order goes `shipped` (shipment picked up / Bosta) | `tallaby_order_shipped` | URL button **Track order** → `https://tallaby.com/wa/t/{{1}}` (signed token, redirects to the carrier or store order page) |
| `order_out_for_delivery` | Order or shipment goes `out_for_delivery` | `tallaby_order_out_for_delivery` | URL button (same as shipped) |
| `order_delivered` | Order goes `delivered` | `tallaby_order_delivered` | — |
| `order_cancelled` | Order goes `cancelled` (seller, admin, system). **Not sent** when the shopper cancelled by button. | `tallaby_order_cancelled` | — |

Body parameters (named): `customer_name`, `store_name`, `order_number`, `total` (formatted in the order currency), and, for shipped, `carrier` and `tracking_number`. Footer: `Tallaby · طلبي`. No promotional text, coupons or "shop again" lines, so the templates stay utility. Template names are suffixed with a version when their text changes (`_v2`), because an approved template's category can't change and edits are limited.

Language: the shopper's checkout locale (saved with the consent), else the store's `default_locale`, else `ar`. The Meta language codes are `ar` and `en`.

## 3. Data (migration `0180_whatsapp.sql`)

All tables are server-only (RLS on, no policies). Money columns: seller price in integer US cents. Meta cost in integer **micro-USD**, because Meta's rates (about $0.0036) are below one cent.

- **`whatsapp_settings`**: a single row (`id = 1`). It holds:
  - `enabled` (bool, default false)
  - `stores_default_on` (bool, default false)
  - `seller_price_usd_cents` (int ≥ 0, default 0)
  - `meta_rate_micros` jsonb (`{utility, marketing, authentication, service}` in micro-USD, editable by admin; seeded `{utility: 3600, authentication: 3600, marketing: 64400, service: 3600}`, to be checked against Meta's Egypt rate card)
  - `events_enabled` (text[], global per-event switch)
  - `updated_at` and `updated_by`
- **`store_whatsapp_settings`**: `store_id` PK (FK stores, CASCADE), `seller_id` (FK sellers, CASCADE), `enabled`, `events` (text[], the chosen event keys), `updated_at`. No row means the admin default applies.
- **`whatsapp_contacts`**: `phone` PK, in E.164 digits without `+` (`201XXXXXXXXX`). It holds:
  - `wa_user_id` (Meta BSUID, nullable)
  - `opted_in_at`, `opted_out_at`, `opt_in_source` (`checkout`), `consent_version`
  - `last_store_id` (SET NULL)
  - `last_inbound_at` (opens the 24 h service window)
  - `created_at` and `updated_at`
- **`whatsapp_messages`** is both the outbox and the history. Its columns:
  - Identity:
    - `id` (uuid)
    - `seller_id` (CASCADE), `store_id` (CASCADE), `order_id` (CASCADE)
    - `event` (CHECK on the event keys, plus `reply` for in-session replies)
    - `dedupe_key` (UNIQUE; `order:<orderId>:<event>`, or `reply:<inboundWamid>`)
  - What was sent:
    - `to_phone`, `locale`
    - `kind` (`template | text`)
    - `template_name`, `template_language`
    - `payload` jsonb (the rendered parameters, no secrets)
  - Status:
    - `status` (`queued | sending | sent | delivered | read | failed | skipped | unknown`)
    - `attempts`, `next_attempt_at`, `claimed_at`
    - `wamid` (UNIQUE, nullable)
    - `error_code`, `error_title`, `error_detail`
  - Pricing:
    - `pricing_category`, `pricing_type` (from the status webhook)
    - `meta_cost_micros` (int, set when the webhook reports a paid `pricing.type`; computed from `meta_rate_micros` at that time)
    - `price_usd_cents` (what the seller was charged; 0 for now)
  - Timestamps: `created_at`, `sent_at`, `delivered_at`, `read_at`, `failed_at`
  - Indexes:
    - partial index on (`next_attempt_at`) WHERE `status = 'queued'`
    - (`store_id`, `created_at desc`)
    - (`status`, `created_at desc`)
- **`whatsapp_inbound`**: `wamid` PK (Meta's inbound message id, the dedupe), `from_phone`, `wa_user_id`, `type`, `context_wamid`, `body` (capped at 1000 chars), `action` (`confirm | cancel | stop | other`), `order_id` (SET NULL), `result` (`confirmed | cancelled | already | refused | not_found | opted_out | ignored`), `created_at`. Kept 90 days; an F-109 cleanup cron task is left for later.
- **`whatsapp_templates`**: (`name`, `language`) PK, `meta_template_id`, `category`, `status` (`not_submitted | pending | approved | rejected | paused | disabled`), `rejected_reason`, `quality`, `synced_at`. It mirrors Meta's state for admin and is updated by the `message_template_status_update` webhook and the admin "Sync" button.
- The `seller_notifications` type check is widened (guarded, from its live definition) with `whatsapp_order_confirmed` and `whatsapp_order_cancelled`, so the seller's bell shows when a shopper confirms or cancels by WhatsApp.
- `orders.metadata.whatsapp = { optIn: true, locale, consentVersion, at }` is written by checkout. It is not a column.

## 4. Flow

```
order event (place-order, seller/admin/shipping/Bosta status change)
  └─ @workspace/lib/orders/notify.ts  notifyOrderWhatsApp(orderId, event)   best-effort, after commit
       └─ POST backend /api/whatsapp/order-event   (internal auth)
            └─ enqueueOrderWhatsApp: gates (D6) → INSERT whatsapp_messages ON CONFLICT (dedupe_key) DO NOTHING
            └─ dispatchWhatsAppMessages({ ids: [new id] })   immediate send attempt
backend worker (setInterval 15 s in the Node server, WHATSAPP_WORKER=1) + POST /api/whatsapp/dispatch (cron fallback)
  └─ claim: UPDATE … SET status='sending', claimed_at=now() WHERE id IN (SELECT … WHERE status='queued' AND next_attempt_at<=now() ORDER BY next_attempt_at LIMIT 50 FOR UPDATE SKIP LOCKED)
  └─ stale 'sending' rows (claimed > 10 min ago) → 'unknown' (never re-sent automatically: Meta has no idempotency key)
  └─ POST graph.facebook.com/{v}/{PHONE_NUMBER_ID}/messages  (biz_opaque_callback_data = message id)
       ok → 'sent', wamid ; retryable error → 'queued', next_attempt_at = backoff ; permanent → 'failed'
Meta webhook → backend GET/POST /api/webhooks/whatsapp
  └─ GET: hub.verify_token check, echo hub.challenge
  └─ POST: X-Hub-Signature-256 = HMAC-SHA256(raw body, APP_SECRET), constant-time; 401 otherwise; reply 200 fast
       statuses[] → update by wamid, status only moves forward (sent < delivered < read; failed is final unless already delivered/read); pricing → pricing_* + meta_cost_micros
       messages[] → INSERT whatsapp_inbound ON CONFLICT DO NOTHING (dedupe) → button payload / STOP → action
       message_template_status_update → whatsapp_templates
```

- **Gates** (all must hold, checked at enqueue *and* again at send): admin `enabled`; the event in `events_enabled`; WhatsApp on for the store (row, or the admin default); the event in the store's `events`; the order has `metadata.whatsapp.optIn`; the contact is not opted out; the phone normalises to a valid E.164 number; the env is set. A failed gate means no row, except a contact who opted out between enqueue and send, which becomes `skipped`.
- **Phone**: Egyptian `01XXXXXXXXX` / `+201…` / `00201…` → `201XXXXXXXXX`. Other countries are accepted when already E.164 (F-61e stores `+9665…`). Otherwise the message is not sent.
- **Retries**: retryable codes are 130429, 131048, 131056, 131057, 131000, 131016, 5xx and network errors before the request was sent. Backoff is 1 min, 5 min, 30 min, 2 h; 5 sends in total, then `failed`. For 131056 (pair rate limit), the next try is at least 10 s later. Permanent codes are 131026, 131047, 131049, 131050, 131051, 132xxx, 133010 and 190 (190 also logs an ops alert). A timeout after the request body was sent → `unknown`.
- **Throughput**: the dispatcher sends with concurrency 10 per batch, far under Meta's 80 msg/s per number. Per-recipient spacing: a queued message for a phone that got a message in the last 10 s waits.
- **Buttons**: the quick-reply payload is `TB1.<c|x>.<messageId>.<sig>`, where `sig` = first 16 hex chars of HMAC-SHA256(`WHATSAPP_PAYLOAD_SECRET`, `c|x:messageId`). An inbound tap is accepted only when the signature is valid, `context.id` equals that message's `wamid` (when present), and the sender phone or BSUID matches the message's recipient. The order is re-read and changed through the **same lib functions the dashboard and the store use**, with their status guards, restock, emails and Bosta auto-ship:
  - confirm: `pending` → `confirmed`
  - cancel: only from the statuses a shopper may cancel from in the store
  - a repeated tap → `already`
  - an order that has moved on → `refused`, with a reply explaining why

  The reply is a free-form text message (service, inside the 24 h window the tap opened), in the message's language.
- **Tracking link** `https://tallaby.com/wa/t/<token>` (ecommerce route): the token is a signed order id (`signOrderAccess`). It redirects to the carrier tracking URL (Bosta `bostaTrackingUrl`), else to the order's page on the store's own host. It stays valid 60 days.
- **No cache** for any of this (CLAUDE.md rule 8: orders and messaging).

## 5. Seller dashboard

App manifest `whatsapp` in `packages/apps` (free, toggle, settings route `whatsapp`). Page: `stores/[storeId]/apps/whatsapp/settings`.

- WhatsApp on/off for the store. A "Free for now" badge. While the admin has not turned WhatsApp on, a "Coming soon" note and nothing editable.
- Event checkboxes (§2), each with an Arabic and English preview rendered from the code template with the store's name and sample order data.
- Stats for the last 30 days: sent, delivered, read, failed, confirmed and cancelled by button, and cost (shows 0 / free).
- Message history: server-paginated (50 rows), filtered by status and event. It shows the time, order number (links to `/orders?order=`), event, masked phone (`+20 10•••••123`), status and price. Store-scoped through `requireStore(storeId)`; every query filters `seller_id` and `store_id`.

## 6. Admin

Page `apps/admin/app/(dashboard)/whatsapp` (sidebar under Settings), guarded by `validateAdminAccess("canManageSettings")`.

- **Settings**: global switch, stores' default, per-event switches, seller price per message (cents; shows "Free" at 0, and saving a price above 0 is refused until charging is approved), Meta rates per category (micro-USD, shown as $).
- **Connection**: whether the env is set (booleans only, never values), and the phone number's display name, quality rating and messaging limit, read from Graph `GET /{PHONE_NUMBER_ID}`.
- **Templates**: the code templates × languages, their Meta status, "Submit to Meta" (`POST /{WABA_ID}/message_templates`) and "Sync statuses".
- **Usage**: per day and per store for 7, 30 or 90 days. It shows messages, delivered %, Meta cost, revenue (seller charges), profit = revenue − cost, and button confirms and cancels.
- **Failed messages**: a list with error code and title. **Retry** re-queues a `failed` or `unknown` row (attempts reset, gates re-checked); retrying `unknown` asks for a confirmation first, because it may send a duplicate. **Bulk retry** handles retryable codes.

## 7. Env (backend only)

| Variable | What |
| -------- | ---- |
| `WHATSAPP_ACCESS_TOKEN` | System user permanent token (`whatsapp_business_messaging`, `whatsapp_business_management`) |
| `WHATSAPP_PHONE_NUMBER_ID` | The Tallaby number's id |
| `WHATSAPP_WABA_ID` | WhatsApp Business Account id |
| `WHATSAPP_APP_SECRET` | Meta app secret (webhook signature) |
| `WHATSAPP_VERIFY_TOKEN` | Random string, set in the app's webhook config |
| `WHATSAPP_PAYLOAD_SECRET` | Random 32+ bytes, signs button payloads |
| `WHATSAPP_GRAPH_VERSION` | Default `v27.0` |
| `WHATSAPP_WORKER` | `1` on the Node server to run the 15 s dispatch loop |

The ecommerce app needs nothing new (the tracking route uses the existing order-access secret).

## 8. Security checklist

- The webhook signature is checked on the raw bytes, in constant time, before any parse. The webhook path is public only through `/api/webhooks/`. The body is size-capped (1 MB).
- Button payloads are HMAC-signed and bound to the message's wamid and recipient. The client never sends an order or store id.
- Tenant isolation: the seller page uses `requireStore`, and every query has `seller_id` + `store_id`. Admin uses its guard.
- The token and secrets are never logged. Phone numbers are masked in seller UI and logs. Inbound text is capped and never rendered as HTML.
- Inbound message text is data, never instructions (no AI processing of replies).

## 9. Later (not built)

- Per-store numbers (Tech Provider + Embedded Signup + App Review).
- Charging sellers (D3, owner approval). WhatsApp marketing broadcasts (F-16c) and abandoned-cart WhatsApp (F-03e), both marketing category with separate opt-in. OTP (F-02f) on authentication templates.

## 10. Code

- Migration: `packages/db/migrations/0180_whatsapp.sql`; Drizzle: `whatsappSettings`, `storeWhatsappSettings`, `whatsappContacts`, `whatsappMessages`, `whatsappInbound`, `whatsappTemplates` in `packages/db/src/drizzle/schema.ts`.
- Pure rules (`@workspace/lib/whatsapp`; `@workspace/lib/whatsapp/templates` is client-safe), in `packages/lib/src/whatsapp/`:
  - `events.lib.ts`: event keys, statuses, `canAdvanceStatus`.
  - `phone.lib.ts`: `toWhatsAppPhone`, `maskPhone`.
  - `templates.lib.ts`: the code templates, previews, Graph send components, Meta submission bodies.
  - `payload.lib.ts`: signed quick-reply payloads.
  - `errors.lib.ts`: Graph error classes and retry backoff.
  - `signature.lib.ts`: `X-Hub-Signature-256` check.
  - `inbound.lib.ts`: webhook parsing, `detectOptOut`, `metaCostMicros`.
