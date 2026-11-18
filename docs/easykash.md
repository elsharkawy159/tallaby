# EasyKash: seller payment gateway (ROADMAP.md F-98)

Status: **building** (owner request 2026-11-18; decisions in §10). Source: the official docs at
<https://easykash.gitbook.io/easykash-apis-documentation>, read in full on 2026-11-18 (9 pages, listed in §11).

## 0. In short

- EasyKash is an Egyptian payment provider. One hosted page takes cards, mobile wallets, Meeza, Apple Pay,
  cash at Fawry and Aman, and many instalment providers (ValU, Souhoula, Contact, bank instalments and others).
- A seller connects **their own** EasyKash account to one store, the same way Paymob and Kashier work today
  (ROADMAP.md F-39). The money goes straight to the seller's EasyKash account. Tallaby never holds it, and the
  store wallet only pays the usual Tallaby order fee.
- The seller gives us two values from EasyKash › Settings › Integration Settings: the **API Key** and the
  **HMAC Secret Key**. We give the seller one **Callback URL** to paste there.
- Checkout: our server asks EasyKash for a payment link (Pay API) → the shopper pays on EasyKash's page →
  EasyKash sends them back to the store → EasyKash calls our Callback URL **only when the payment is PAID** →
  we check the signature, confirm with the Payment Inquiry API, and mark the order paid.
- It differs from Kashier in five ways that drive the design:
  1. The Callback URL is **set once in the seller's EasyKash account**, not sent with each payment.
  2. The callback comes **only for paid payments**, never for failed or expired ones.
  3. Cash payments (Fawry, Aman) stay open for hours; the shopper pays later with a voucher number.
  4. The docs describe **no test mode**: the seller tests with a small real payment.
  5. The callback signature does not cover the currency, and the seller can choose to add EasyKash's fees on the
     buyer, so the paid amount can be higher than the order total.

---

## 1. EasyKash API reference

### 1.1 Before any integration

1. The seller asks EasyKash support to **turn on Direct Payment** for their business account. Without it, the
   Integration Settings page has nothing to use.
2. Then **Settings › Integration Settings** (`https://www.easykash.net/seller/cash-api`) shows:
   - **API Key**: sent in the `authorization` header of every API call.
   - **Callback URL**: where EasyKash sends the result of each paid transaction. It must be a working URL.
   - **HMAC Secret Key**: used to check that a callback really comes from EasyKash. It appears **after** the
     seller saves the callback URL and the payment options.
3. Every Pay request must also carry a **redirectUrl**: the page the shopper returns to after paying.

### 1.2 Pay API: create a payment link

`POST https://back.easykash.net/api/directpayv1/pay`

Header: `authorization: <API Key>` (required).

| Field | Type | Required | Meaning |
| --- | --- | --- | --- |
| `amount` | number | yes | Base amount **in the currency sent**, not converted to EGP. The buyer is always charged in EGP: total × EasyKash's exchange rate at payment time. (Old, deprecated behaviour: amount in EGP, converted by EasyKash.) |
| `currency` | string | yes | `EGP`, `USD`, `SAR`, `EUR`, `GBP`, `QAR`, `AED`, `KWD` |
| `paymentOptions` | number[] | no | Payment option IDs to show (§1.7). Only options enabled on the account appear. Left out → every option the account has. |
| `paymentOptionsExcluded` | number[] | no | Option IDs to hide, e.g. `[1, 5]`. |
| `cashExpiry` | number | no | Hours a cash voucher (Fawry, Aman) stays payable. Default `3`. |
| `name` | string | yes | Buyer's name |
| `email` | string | yes | Buyer's email |
| `mobile` | string | yes | Buyer's mobile, as a string, e.g. `"01010101010"` |
| `redirectUrl` | string | yes | Where the buyer returns after the hosted page |
| `customerReference` | string | yes | **Our** reference for this payment. It comes back in the redirect and the callback, and the Inquiry API looks payments up by it. |

Example request:

```json
{
  "amount": 10,
  "currency": "EGP",
  "paymentOptions": [2, 3, 4, 5, 6],
  "cashExpiry": 3,
  "name": "John Doe",
  "email": "JohnDoe@example.com",
  "mobile": "01010101010",
  "redirectUrl": "https://www.yourshop.com/",
  "customerReference": "111"
}
```

Success (200):

```json
{ "redirectUrl": "https://www.easykash.net/DirectPayV1/{productCode}" }
```

The buyer must be sent to that `redirectUrl` to pay. (The docs write the example as `"redirectUrl"="…"`, which
is not valid JSON; treat it as the object above.) The docs give **no error responses** (wrong key, bad field,
Direct Payment off); we learn them in the E2E test (§9).

### 1.3 Redirect back to the store

After the hosted page, EasyKash sends the buyer to our `redirectUrl` with extra query parameters, e.g.

`https://www.yourshop.com/?status=NEW&providerRefNum=2206290593680&customerReference=721227`

| Param | Meaning |
| --- | --- |
| `status` | `success`, `pending` or `failed` (the example shows `NEW`) |
| `providerRefNum` | Reference number at the payment method's provider |
| `customerReference` | The reference we sent |
| `voucher` | For Fawry or Aman: the number the buyer pays with |

EasyKash says these are for showing a message only. For the real result, use the callback (§1.4) or the
Inquiry API (§1.6). **Anyone can type these parameters, so we never change an order because of them.**

The example base URL is `https://www.yourshop.com/` with no query of its own. The docs don't say how EasyKash
adds parameters to a URL that already has `?…`, so our return URL carries the order in the **path** (§4.4).

### 1.4 Callback service

After every **successful** payment, EasyKash sends the details to the account's Callback URL.

```json
{
  "ProductCode": "CHQ4668",
  "PaymentMethod": "Credit & Debit Card",
  "ProductType": "Direct Pay",
  "Amount": "50.5",
  "BuyerEmail": "johndoe@domain.com",
  "BuyerMobile": "01010101010",
  "BuyerName": "John Doe",
  "Timestamp": "1626166791",
  "status": "PAID",
  "voucher": "32423432",
  "easykashRef": "3242143421",
  "VoucherData": "Direct Pay",
  "customerReference": "1232",
  "signatureHash": "0bd9ce50…29d1d0"
}
```

| Field | Meaning |
| --- | --- |
| `ProductCode` | Code of the EasyKash payment link (last part of its URL) |
| `PaymentMethod` | `Cash Through Fawry`, `Cash Through Aman`, `Credit & Debit Card`, `Mobile Wallet`, `Meeza`, `Qassatly`, `Cash Api` (newer methods may send other names) |
| `ProductType` | `Direct Pay` for our links (others: Physical Product, Invoice, Event, Quick Payment, Quick Cash, Subscription, Custom Payment, Quick Qassatly, Fawry Payout, Booking) |
| `Amount` | Amount paid, **as a string**, e.g. `"11.00"`. No currency field. |
| `BuyerEmail`, `BuyerMobile`, `BuyerName` | Buyer details |
| `Timestamp` | When the callback was sent (Unix seconds, string) |
| `status` | Always `PAID` |
| `voucher` | Cash voucher number (cash methods only) |
| `easykashRef` | EasyKash's reference for the payment |
| `VoucherData` | Title of the payment |
| `customerReference` | Our reference |
| `signatureHash` | HMAC of the fields in §1.5 |

The docs show a JSON body (so a `POST`), but don't state the method, the content type, the retry rules or the
answer EasyKash expects. The owner's setup notes say the Callback URL must answer **GET** (checked with Postman).
So our URL answers both: GET with a plain 200, and POST (or GET with the same fields in the query) as a callback
(§4.3).

### 1.5 Callback verification (HMAC)

1. Take these fields **in this order**: `ProductCode`, `Amount`, `ProductType`, `PaymentMethod`, `status`,
   `easykashRef`, `customerReference`.
2. Join their **values** with nothing between them.
3. HMAC-SHA512 the string with the HMAC Secret Key, **hex** digest.
4. Compare with `signatureHash`. Equal → the callback is real.

Docs example: secret `da9fe30575517d987762a859842b5631`, payload
`{"ProductCode":"EDV4471","Amount":"11.00","ProductType":"Direct Pay","PaymentMethod":"Cash Through Fawry",…,"status":"PAID","easykashRef":"2911105009","customerReference":"TEST11111"}`
→ string `EDV447111.00Direct PayCash Through FawryPAID2911105009TEST11111`.

```js
const data = [ProductCode, Amount, ProductType, PaymentMethod, status, easykashRef, customerReference].join("");
const calculated = crypto.createHmac("sha512", secretKey).update(data).digest("hex");
return calculated === signatureHash; // we use a timing-safe compare instead
```

Notes for us:
- The docs reuse the same `signatureHash` in two different examples, so it is probably not the real hash of the
  example. The unit test computes it; the E2E test (§9) proves it with a real callback.
- The signed string covers neither the currency nor the buyer, and has no separators and no timestamp. A replay
  of a real callback still verifies. That is why we also confirm with the Inquiry API and make the claim
  idempotent (§5).
- `customerReference` may arrive empty if none was sent; we always send one.

### 1.6 Payment Inquiry

`POST https://back.easykash.net/api/cash-api/inquire`

Header: `authorization: <API Key>`. Body: `{ "customerReference": "111" }`.

Response:

```json
{
  "PaymentMethod": "Cash Through Fawry",
  "Amount": "10.05",
  "BuyerName": "John Doe",
  "BuyerEmail": "JohnDoe@example.com",
  "BuyerMobile": "01010101010",
  "status": "PAID",
  "voucher": "32423432",
  "easykashRef": "1206102054"
}
```

`status` is one of `NEW`, `PAID`, `DELIVERED`, `EXPIRED`, `FAILED`, `REFUNDED`, `CANCELED`. The response is not
signed, but it comes over https from EasyKash to our server with the seller's key, so we trust it. The docs don't
show the answer for an unknown reference or a wrong key.

### 1.7 Payment option IDs

Used in `paymentOptions` and `paymentOptionsExcluded`. Only options enabled on the seller's account show.

| ID | Option | ID | Option |
| --- | --- | --- | --- |
| 1 | Cash through Aman | 21 | Aman instalments |
| 2 | Credit & debit card | 22 | Souhoula |
| 3 | Qassatly | 23 | Contact |
| 4 | Mobile wallet | 24 | Mogo / MidTakseet |
| 5 | Cash through Fawry | 25 | Blnk |
| 6 | Meeza | 26 | 6 months, multiple banks |
| 8 | 6 months, NBE instalments | 27 | 12 months, multiple banks |
| 9 | 12 months, NBE instalments | 28 | 18 months, multiple banks |
| 10 | 18 months, NBE instalments | 29 | Halan |
| 17 | ValU | 31 | Apple Pay |
| 18 | 6 months, Banque Misr | 32 | TRU |
| 19 | 12 months, Banque Misr | 33 | Klivvr |
| 20 | 18 months, Banque Misr | 34 | Forsa |
| | | 35 | Pay by Card |

### 1.8 Cash API (cash only): not used

`POST https://back.easykash.net/api/cash-api/create` makes a Fawry or Aman voucher with no hosted page
(`payerEmail`, `payerMobile`, `payerName`, `amount`, `expiryDuration` 3/6/12/48 h, `apiKey` **in the body**,
`VoucherData`, `type` `in`, or `out` for Fawry payouts). The Direct Payment page already offers Fawry and Aman, so
we don't need it. It could later show the voucher inside our checkout without leaving the store.

### 1.9 WooCommerce and Shopify plugins: not used

Plugins for those platforms. Not relevant to Tallaby.

### 1.10 What the docs don't say (settled by the E2E test, §9)

| Question | Why it matters | Default until tested |
| --- | --- | --- |
| HTTP method and content type of the callback | Route parsing | Accept POST JSON, POST form and GET query |
| Retries, and what answer stops them | Duplicate and error replies | Always answer 200 once the signature checks out |
| Error bodies of Pay and Inquiry | Connect-time key check, seller messages | Any non-2xx = failure, logged without the body |
| Answer of Inquiry for an unknown reference | Key check at connect | 401/403 = wrong key; anything else = key accepted |
| Is `Amount` the base amount or the total with fees on the buyer? | Amount check | See §4.5 and question Q2 |
| Currency of `Amount` for a non-EGP payment | Amount check | v1 is EGP stores only |
| Is there a sandbox or test key? | Test mode | None: `mode` is always `live` |
| Max length and characters of `customerReference` | Our reference format | Ours is 44 characters `[0-9a-f-_a-z]`; check it's accepted |
| Does Pay need `email` when the buyer has none? | Phone-only checkouts | See question Q3 |

---

## 2. Seller setup (what the seller does)

This follows the owner's steps of 2026-11-18. The dashboard sheet shows the same steps, in Arabic and English.

1. **Ask EasyKash to turn on Direct Payment** for the business account.
2. In Tallaby: **Apps › EasyKash › Connect** (it opens Store settings › Payment methods › Online card payments,
   like Kashier). The sheet shows **this store's Callback URL** with a Copy button.
3. In EasyKash: **Settings › Integration Settings**:
   - copy the **API Key**;
   - paste our URL in **Callback URL** (it answers GET, so EasyKash's check and a Postman test pass);
   - pick every **payment option** the store should offer;
   - **Save**. The **HMAC Secret Key** now shows; copy it.
4. Answer EasyKash's **fees and VAT** questions: are the fees added on the buyer or paid by the seller?
   (Our sheet says which choice we recommend; see Q2.) **Submit.**
5. In Tallaby: paste the **API Key** and the **HMAC Secret Key** and press **Connect**. We check the key with
   EasyKash and save both, encrypted.
6. Place a small real order on the store and pay it. The card says "Waiting for the first payment" until the first
   signed callback arrives, then "Working".

---

## 3. How it fits what we have

EasyKash joins the F-39 seller gateways (`packages/lib/src/payments/store-gateways.{lib,server}.ts`). Everything
below already exists and stays as it is:

- one `store_integrations` row per store and provider; keys encrypted with `encryptCredentials` (AES-256-GCM,
  bound to store and provider); `config` holds public details only (`mode`, `keyHint`, `webhookVerifiedAt`);
- one gateway per store at a time (`connectStoreGateway` refuses a second one);
- `orders.metadata.paymentCollector = 'seller'` and the `metadata.paymentGateway` snapshot
  (`{ provider, integrationId }`) on each storefront card order, and `metadata.deposit.gateway` for COD deposits
  (F-21), so EasyKash pays deposits with no extra work;
- `buildGatewayReference(orderId)` → `<orderId>_<suffix>`, new for every attempt; `parseGatewayReference` reads it back;
- `applyGatewayEvent`: the order must belong to that store and name that integration; advisory lock; namespaced
  transaction ID; amount and currency check; state-guarded claim; the Tallaby fee when paid (Free $0.03, Pro none);
- the backend route then runs digital fulfilment and the seller's new-order and low-stock emails;
- `store_settings_audit` on connect, update and disconnect, with keys never logged;
- the Apps catalog (`packages/apps` manifests) lists the gateway on the Apps page, Payments tab.

Not in scope: Tallaby's own Kashier/Paymob checkout and wallet top-ups (they stay as they are), refunds from
Tallaby (the seller refunds in EasyKash), the F-39g adapter refactor (§4.7), the Cash API.

---

## 4. Design

### 4.1 Credentials and config

```ts
export type EasykashSecret = {
  apiKey: string;     // EasyKash "API Key"
  hmacSecret: string; // EasyKash "HMAC Secret Key"
};
// config: { mode: "live", keyHint: apiKey.slice(-4), webhookVerifiedAt? }
```

- Validation in `validateGatewayInput("easykash", …)`: both are single tokens with no spaces (`token(6)` for the
  API key, since the docs' example key is 6 characters; `token(16)` for the HMAC secret); a blank field keeps the
  saved value, as for the other gateways. New errors: `invalid_api_key` (exists), `invalid_hmac_secret` (exists).
  No mode picker: `mode` is always `live`.
- `isCompleteSecret("easykash", s)`: both strings present.

### 4.2 Callback URL: one per seller, set once

EasyKash has **one** Callback URL per account. A seller may use one EasyKash account for several stores, and a
disconnect deletes the integration row today (so its ID changes on reconnect). So the URL names the **seller**,
not the integration:

`{STORE_PAYMENTS_WEBHOOK_BASE_URL or BACKEND_API_URL}/api/webhooks/store-payments/easykash/{sellerId}`

- It never changes, so the seller pastes it once, even after disconnecting and reconnecting.
- The handler finds the store from the order in `customerReference`, and accepts the callback only if:
  the order exists, belongs to that seller, its `metadata.paymentGateway` (or deposit gateway) names an
  `easykash` integration that is still connected on the order's store, and the signature checks out with **that
  store's** HMAC secret. A callback can only ever change an order of the store whose secret signed it.
- New helper `easykashCallbackUrl(sellerId)` in `store-gateways.lib.ts`, next to `storeGatewayWebhookUrl`. Without
  a public https backend URL it returns null and the gateway can't be connected (same rule as today).
- The seller ID in the URL is only a routing hint; the HMAC is the proof.

### 4.3 Callback route (backend)

New Hono routes in `apps/backend/src/routes/store-payments.ts`, registered **before** `/:integrationId`:

- `GET /easykash/:sellerId` with no callback fields → `200 { ok: true }` (EasyKash's URL check, Postman).
- `GET` with callback fields in the query, `POST` with JSON or form body → `handleEasykashCallback(sellerId, fields)`.

`handleEasykashCallback` (in `store-gateways.server.ts`):

1. Read the fields as strings. Missing `customerReference` or `signatureHash` → 400.
2. `parseGatewayReference(customerReference)` → order ID; load the order; check seller, gateway and store as in §4.2.
   Unknown order, other seller, or gateway no longer connected → **200 ignored** (EasyKash would retry a dead URL forever).
3. Verify the HMAC (§1.5) with that store's `hmacSecret`, timing-safe. Wrong → **401** and a log line with
   integration ID only (never the body: it has buyer data).
4. `markWebhookVerified` (the "Waiting for first payment" card turns to "Working").
5. **Confirm with the Inquiry API** using the store's API key and the same `customerReference`. Act only if
   Inquiry says `PAID` (or `DELIVERED`). If Inquiry fails, answer 500 so EasyKash retries (if it does), and the
   sweeper (§4.6) is the safety net.
6. Build a `GatewayEvent` (`transactionId: "easykash:" + easykashRef`, `status: "SUCCESS"`, amount from Inquiry,
   currency from the order) and call `applyGatewayEvent`. Then the same paid side effects as today.
7. A duplicate answers **200** (not 409 as for Paymob/Kashier), since we don't know EasyKash's retry rules.

### 4.4 Checkout

In `createStoreGatewayCheckout`, a new `easykash` branch:

```json
{
  "amount": 250.00,
  "currency": "EGP",
  "cashExpiry": 24,
  "name": "<buyer name>",
  "email": "<buyer email or Q3 fallback>",
  "mobile": "01XXXXXXXXX",
  "redirectUrl": "https://<store host>/api/store-payments/return/<orderId>",
  "customerReference": "<orderId>_<suffix>"
}
```

- `amount` is the order total (or the deposit), from integer piastres, sent with 2 decimals.
- `paymentOptions` is left out, so the shopper sees exactly what the seller turned on in EasyKash (setup step 3).
- `cashExpiry`: 24 hours unless the owner picks another value (Q4).
- The new reference is saved as `orders.metadata.paymentGateway.lastReference` (and `deposit.gateway.lastReference`
  for deposits), so the return route and the sweeper can call Inquiry. Earlier references stay valid for
  callbacks, since they carry the order ID.
- Fetch with a timeout, outside any DB transaction; a non-2xx or a missing `redirectUrl` → `gateway_error`, logged
  with status and integration ID only.
- Checks that already exist stay: the order must be payable, the gateway must still be the order's gateway, and the
  store must be EGP (v1).

**Return route.** New path form `apps/ecommerce/app/api/store-payments/return/[orderId]/route.ts` (the order in
the path, so EasyKash can add `?status=…`). It writes nothing to the order, like today's route, and redirects to the
order page. For a cash payment, the order page shows the voucher number and "Pay at any Fawry or Aman outlet before
<time>", read through Inquiry on the server (never from the query string).

### 4.5 Amount check

Today `applyGatewayEvent` needs the paid amount to equal the order total. With EasyKash, a seller who adds the fees
on the buyer gets a higher `Amount`. Options (owner decision, Q2, since it is money logic, rule 4):

- **A (recommended):** tell sellers in the setup sheet to keep the fees on themselves, and keep the **exact** match.
  A different amount is never marked paid; the order shows "Payment amount differs, check EasyKash", and the
  seller is notified.
- **B:** accept `paid ≥ total` (never less) for EasyKash only, and keep the paid amount in `metadata.paymentGateway.paidAmount`.

### 4.6 Payments that never call back

EasyKash calls back only on PAID, so a failed card payment or an expired voucher sends nothing.

- The order stays `payment_processing`, as with an abandoned Kashier payment today; the shopper can pay again from
  the order page (a new reference, a new EasyKash link).
- **Sweeper (P2):** an ecommerce cron (`/api/cron/easykash-sync`, every 15 minutes) takes EasyKash orders still in
  `payment_processing` with a `lastReference` from the last 48 hours, calls Inquiry, and:
  `PAID` → hands it to the backend (same path as a callback, so side effects run once); `FAILED`, `EXPIRED`,
  `CANCELED` → `payment_status = 'failed'` (the shopper can retry). It never cancels orders (unpaid card order
  auto-cancel is F-39f and stays out).
- **Two payments for one order** (an old Fawry voucher paid after a card payment): the second has a new
  `easykashRef`, so `applyGatewayEvent` sees an already-paid order and does nothing. We log it and send the seller
  a bell "Paid twice: refund one in EasyKash" (P2).

### 4.7 Code shape

The F-39g adapter design (§5 of `docs/superpowers/specs/2026-11-04-seller-gateways-design.md`) is **not built**,
and the code still branches "Paymob, else Kashier". Adding EasyKash means:

- turning every `provider === "paymob" ? … : …` into an explicit `switch` with a `never` check, so a new provider is
  never handled as Kashier by mistake (`validateGatewayInput`, `isCompleteSecret`, `verifyGatewayKeys`,
  `createStoreGatewayCheckout`, `handleStoreGatewayWebhook`);
- EasyKash's pure code in `packages/lib/src/easykash/easykash.lib.ts` (signature, field reading, body building)
  and its fetch calls in `packages/lib/src/easykash/easykash.server.ts` (Pay, Inquiry), like `kashier/`;
- no wider refactor. If F-39g is built later, EasyKash becomes one more adapter.

---

## 5. Security

- **Tenant isolation (rule 5):** the callback can change only an order of the store whose secret signed it (§4.2);
  checkout loads the gateway from the order's own snapshot; no seller, store or integration ID from the browser is
  trusted.
- **Signature + Inquiry:** the HMAC proves the callback came from EasyKash, and Inquiry proves the payment is still
  PAID and gives the amount. A replayed callback finds the claim already made (idempotent on
  `easykash:<easykashRef>` and the order state).
- **Secrets (rule 10):** the API key and HMAC secret are encrypted in `credentials_encrypted`, decrypted only in
  server code, never sent to the client (the sheet shows `keyHint` only), never logged. Callback bodies are not
  logged (buyer data).
- **Timing-safe compare** of the hex HMAC (`crypto.timingSafeEqual` on equal-length buffers).
- **Return URL:** writes nothing; the voucher shown comes from Inquiry, not from the query.
- **Rate:** the GET check route does nothing but answer 200; the callback route does one order lookup before any
  outbound call.
- The Tallaby EasyKash test account login shared in chat is **not** written in this repo or any doc. Keep it in the
  team's password manager.

---

## 6. Files to change

| Area | File | Change |
| --- | --- | --- |
| DB | `packages/db/migrations/0174_store_gateway_easykash.sql` | Rebuild `store_integrations_provider_check` with `easykash` (§7) |
| DB | `packages/db/src/drizzle/schema.ts` | Comment on the provider list only (no column change) |
| Lib | `packages/lib/src/easykash/easykash.lib.ts` (+ `.test.ts`) | Signature, callback field reading, Pay body, amount parsing |
| Lib | `packages/lib/src/easykash/easykash.server.ts` | `createEasykashPayLink`, `inquireEasykashPayment` (timeout, no body logging) |
| Lib | `packages/lib/src/payments/store-gateways.lib.ts` (+ test) | `"easykash"` in `STORE_GATEWAY_PROVIDERS`, `EasykashSecret`, validation, `isCompleteSecret`, `easykashCallbackUrl`, `lastReference` in the order meta reader |
| Lib | `packages/lib/src/payments/store-gateways.server.ts` | `switch` per provider; EasyKash key check (Inquiry probe), checkout branch, `handleEasykashCallback`, Inquiry settle |
| Lib | `packages/lib/src/integrations/registry.ts`, `validate.ts` (`DETAIL_KEYS`), `catalog.ts` (+ tests) | Add `easykash` (payments, credentials, available) |
| Apps | `packages/apps/src/manifests/easykash.ts`, `manifests/index.ts` | App card: name «إيزي كاش» / EasyKash, summary, highlights (cards, wallets, Fawry and Aman, instalments; paid straight to your account), `settingsRoute: "gateway"`, `internal: { provider: "easykash" }` |
| Apps | `apps/dashboard/public/app-logos/easykash.png` | Logo (needs the official asset) |
| Backend | `apps/backend/src/routes/store-payments.ts` | `GET`/`POST /easykash/:sellerId` before `/:integrationId` |
| Dashboard | `apps/dashboard/app/[locale]/(main)/stores/[storeId]/settings/payments/gateways.{dto.ts,client.tsx}` | EasyKash fields (API Key, HMAC Secret Key), the Callback URL with Copy, setup steps, no mode picker |
| Dashboard | `apps/dashboard/messages/{ar,en}.json` | Every new string in both (rule 13) |
| Dashboard | `apps/dashboard/components/payments/payment-method-logos.tsx` | EasyKash logo where gateways are listed |
| Storefront | `apps/ecommerce/app/api/store-payments/return/[orderId]/route.ts` | Path form of the return route |
| Storefront | order page + `apps/ecommerce/messages/{ar,en}.json` | Cash voucher block |
| Storefront | `apps/ecommerce/app/api/cron/easykash-sync/route.ts` (P2) | Sweeper (§4.6), with `CRON_SECRET` like the other crons |
| Marketing (P2) | `apps/ecommerce/lib/marketing/integrations-hub.lib.ts`, `messages/marketing/*` | tallaby.com/integrations/easykash page |
| Docs | `ROADMAP.md`, `docs/apps-platform.md`, `docs/launch-test-checklist.md` | F-98 status, the app in the platform list, E2E rows |

---

## 7. Migration `0174_store_gateway_easykash.sql`

- Hand-written and idempotent (rule 6): drop and re-add `store_integrations_provider_check` as a **superset of its
  live definition** (0056 + `bosta` from 0106 + `paymob`, `kashier`, `wassalha` from 0130) plus `easykash`, inside
  a guard that aborts if any existing row would fail the new check.
- No new table, no new column: `lastReference` lives in `orders.metadata`.
- Order: staging first, then production with owner approval, **before** deploying the code (connecting writes
  `provider = 'easykash'`, which the old check refuses). Older code ignores the new provider value.

---

## 8. Tasks (ROADMAP.md F-98)

| Task | Priority | Depends on | What |
| --- | --- | --- | --- |
| F-98a | P1 | — | Migration 0174; `easykash.lib.ts` with signature, callback reading and Pay body, unit-tested with the docs example; gateway lib changes (provider list, secret, validation, URLs) and the `switch` refactor, with every Paymob/Kashier test still green |
| F-98b | P1 | F-98a | Server: `easykash.server.ts` (Pay, Inquiry), key check at connect, checkout branch with `lastReference`, `handleEasykashCallback` with Inquiry confirm |
| F-98c | P1 | F-98b | Backend routes `GET`/`POST /api/webhooks/store-payments/easykash/:sellerId` |
| F-98d | P1 | F-98a | Dashboard: app manifest and logo, the connect sheet (fields, Callback URL, steps), both languages |
| F-98e | P1 | F-98b | Storefront: path return route; cash voucher block on the order page |
| F-98f | P1 | 0174 on staging, F-98a–e | Manual E2E with a real EasyKash account (§9); fill in §1.10 with what we learned |
| F-98g | P2 | F-98f | Sweeper cron; "paid twice" seller bell; tallaby.com integration page |

Each task follows rule 21: a brief to a subagent, a strict review of the diff, the checks (`pnpm lint`,
`pnpm typecheck`, `pnpm test`, filtered to the touched packages), and one commit per task on `main`.

---

## 9. Tests

**Unit (`easykash.lib.test.ts`, `store-gateways.lib.test.ts`):**
- the docs' concatenated string for the example payload; a known HMAC computed with the docs' secret; wrong
  secret, changed amount, changed reference, missing field → invalid;
- field reading from JSON, form and query; `Amount` `"11.00"` → 1100 piastres;
- `validateGatewayInput("easykash")`: blank fields keep saved values, spaces refused, keyHint is the last 4;
- Pay body: amount with 2 decimals, path return URL, reference format;
- callback URL is null without an https base.

**Integration (only with `TEST_DATABASE_URL`):** a signed callback for store A's order with store B's secret → 401
and no change; a callback naming another seller → ignored; duplicate → 200, one fee; Inquiry says `NEW` → no change.

**Manual E2E (F-98f), recorded in ROADMAP.md §7 and `docs/launch-test-checklist.md`:**
1. EasyKash Integration Settings accepts our Callback URL; Postman GET → 200.
2. Wrong API key → the sheet refuses it; right keys → connected, "Waiting for the first payment".
3. Card payment, paid → order paid, fee taken once, seller emails sent, card says "Working".
4. Card payment, declined → no callback; order stays unpaid; paying again works.
5. Fawry voucher: order page shows the number; pay it → paid; let one expire → sweeper marks it failed.
6. Fees on the buyer: note the `Amount` EasyKash sends (answers Q2).
7. Replay a real callback → no second fee; change one field → 401.
8. Disconnect, reconnect → the same Callback URL still works.
9. COD deposit (F-21) paid through EasyKash.
10. Arabic and English, phone and desktop.

---

## 10. Questions for the owner

**Answered 2026-11-18:** exact amount only (option A, §4.5); no-reply@tallaby.com when the buyer gave no email; vouchers stay open 24 h; migration 0174 on staging when the code is ready, production only with a separate owner OK; name «إيزي كاش» and EGP stores only for v1 (recommended defaults).

1. **Name and priority:** «إيزي كاش» in Arabic? P1, after the current work?
2. **Fees on the buyer (money rule):** option A (exact amount; we tell sellers to keep fees on themselves) or B
   (accept a higher paid amount for EasyKash)? Recommended: A.
3. **Buyer email:** EasyKash requires one, and our checkout can be phone-only. Send the buyer's email when we have
   it, and otherwise a fixed no-reply address (e.g. `no-reply@tallaby.com`)? EasyKash may email the receipt there.
4. **Cash voucher time:** how many hours can a Fawry or Aman voucher stay open? Recommended: 24 (EasyKash's default is 3).
5. **Non-EGP stores:** EasyKash takes USD, SAR, AED and others but charges the buyer in EGP. Keep v1 to EGP stores only? Recommended: yes.

---

## 11. Sources (read 2026-11-18)

- Direct Payment (Hosted): <https://easykash.gitbook.io/easykash-apis-documentation/direct-payment-hosted>
- Pay API: <https://easykash.gitbook.io/easykash-apis-documentation/direct-payment-hosted/pay-api>
- Callback Service: <https://easykash.gitbook.io/easykash-apis-documentation/direct-payment-hosted/callback-service>
- Callback response verification: <https://easykash.gitbook.io/easykash-apis-documentation/direct-payment-hosted/callback-service/callback-response-verification>
- Payment Inquiry: <https://easykash.gitbook.io/easykash-apis-documentation/direct-payment-hosted/payment-inquiry>
- Cash API and Create a payment: <https://easykash.gitbook.io/easykash-apis-documentation/cash-api-cash-only>
- WooCommerce and Shopify plugins (not used): same site
- Owner's setup steps, 2026-11-18 (chat)
- Our code: `packages/lib/src/payments/store-gateways.{lib,server}.ts`, `apps/backend/src/routes/store-payments.ts`,
  `apps/ecommerce/app/api/store-payments/return/route.ts`, `packages/apps/src/manifests/kashier.ts`,
  `docs/superpowers/specs/2026-11-04-seller-gateways-design.md`
