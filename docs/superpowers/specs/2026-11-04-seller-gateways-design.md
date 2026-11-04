# Seller gateways: PayPal, Tabby, Moyasar, PayTabs, Paylink (ROADMAP.md F-39g)

Design note, 2026-11-04. Research and design only: nothing here is built, no migration has run, and no account was created. Status: **waiting for owner approval** (`CLAUDE.md` rule 4, because this touches checkout and payment confirmation).

## 1. In plain language

The owner wants sellers to connect their own account at five more payment companies. The seller signs up, pastes their keys into Tallaby, and the shopper pays on that company's page. The money goes straight to the seller. Tallaby's fee does not change.

What the docs showed:

1. **Who can use which gateway matters more than the code.** A seller in Egypt selling to KSA can't open Moyasar or Tabby: Moyasar needs a Saudi commercial registration and Saudi bank account, and Tabby needs a business registered in KSA or UAE. Paylink's terms ask for a commercial register or freelance document plus an IBAN, and everything about it is Saudi. **PayTabs is the only one of the five where the docs confirm an Egyptian merchant account and SAR together.** PayPal has an Egypt business sign-up page, but the docs don't settle whether an Egyptian account can really receive and withdraw.
2. **PayPal can't take EGP, SAR, AED, KWD, QAR, BHD or OMR.** Of our ten store currencies it takes only USD, EUR and GBP. On any other store PayPal is hidden at checkout and refused on the server. Amounts are never converted.
3. **Tabby is the hard one.** It's a buy-now-pay-later method with an eligibility check during checkout, a capture call after payment, required on-site snippets, and a QA review by Tabby before live keys are issued. That review may have to happen once per seller, unless Tabby treats Tallaby as a platform. Only Tabby can answer that, so it's built last.
4. **Paylink converts foreign currency to SAR, and Moyasar settles in SAR.** Because of the "never convert" rule, Paylink and Moyasar start as SAR-only.
5. **The current code is written for exactly two gateways.** Several branches treat "not Paymob" as "Kashier", so a new provider would silently run Kashier code. A small per-gateway adapter fixes this without changing what Paymob and Kashier do.

The recommended build order is PayTabs, Moyasar, Paylink, PayPal, then Tabby (§9).

**How far to trust this note:** the doc pages were read through a summarising fetch tool, and a few facts came only from search excerpts (marked "excerpt"). Field names and error shapes must be confirmed against a sandbox while building. §10 lists what the docs could not settle.

## 2. Comparison

| | PayPal | Tabby | Moyasar | PayTabs | Paylink |
|---|---|---|---|---|---|
| **Kind** | Wallet / guest card | Buy now, pay later | Card, mada, Apple Pay, STC Pay | Card (regional gateway) | Saudi gateway (mada, card, Tabby, Tamara, STC Pay …) |
| **Who can sign up** | PayPal business account. Egypt sign-up page exists; receiving and withdrawing there unconfirmed | Registered in **KSA or UAE** | **Saudi** CR or freelance licence + Saudi bank | UAE, KSA, Egypt, Oman, Jordan, Iraq, Kuwait (other pages add Morocco, Qatar) | Commercial register or freelance document + IBAN (excerpt); Saudi by every sign, not stated outright |
| **Our currencies** | USD, EUR, GBP | SAR (KSA account), AED (UAE account) | SAR. AED, BHD, KWD, QAR, USD only on request and for "aggregation merchants" | Depends on market and profile (§3) | SAR. Others converted to SAR, so not offered |
| **Takes EGP?** | **No** | **No** | **No** | **Yes**, Egypt market only | **No** |
| **Seller gives us** | Client ID, secret, test/live | Region, merchant code, public key, secret key | Secret key | Region, profile ID, server key, test/live | API ID, secret key, test/live |
| **Test vs live** | Separate keys and hosts | Separate keys (`sk_test_` / `sk_`), same regional host | Separate keys (`sk_test_` / `sk_live_`), same host | Separate profile with its own ID, same regional host | Separate keys and hosts |
| **Key check, no charge** | OAuth token call | `GET /api/v1/webhooks` | List invoices | Unpaid payment request in the store's currency | `POST /api/auth` |
| **Amount format** | String, major | String, major | **Integer, minor** | Number or string, major | Float, major |
| **Capture step** | **Yes**, after buyer approves | **Yes**, after `AUTHORIZED` | No | No (with `tran_type: sale`) | No |
| **Webhook set up by** | API, per connect | API, per connect | API, per connect | Per payment (`callback`) | **Seller by hand** in the portal |
| **Webhook proof** | Signature, verified by PayPal call | Shared header we choose | `secret_token` in the body, not a signature | **HMAC-SHA256** of raw body | **None documented** |
| **Source of truth** | Fetch order or capture response | Retrieve payment | Fetch invoice | Signed callback, query as backup | Get invoice |
| **Provider review before live** | None for own credentials beyond a business account | **QA review, live keys from account manager** | Activation, 2–5 business days | KYC review; UAE has setup fees | Active subscription with API access |
| **Effort** | Medium | **High** | Low | Low | Low |

### Currency matrix

"Yes" means usable under the rule in §6. "On request" means the docs say it exists but it must be enabled by the provider.

| | EGP | SAR | AED | KWD | QAR | BHD | OMR | USD | EUR | GBP |
|---|---|---|---|---|---|---|---|---|---|---|
| Paymob, Kashier (unchanged) | Yes | | | | | | | | | |
| PayPal | | | | | | | | Yes | Yes | Yes |
| Tabby KSA | | Yes | | | | | | | | |
| Tabby UAE | | | Yes | | | | | | | |
| Moyasar | | Yes | on request | on request | on request | on request | | on request | | |
| Paylink | | Yes | | | | | | | | |
| PayTabs | see §3 | | | | | | | | | |

## 3. Each gateway

Labels are proposals for `storePayments.gateways.fields` in `ar.json` and `en.json` (rule 13). Every field is `dir="ltr"` as today. "Secret" means encrypted in `credentials_encrypted` and never sent to a browser.

### 3.1 PayTabs

**Facts.**
- Regional hosts: KSA `secure.paytabs.sa`, UAE `secure.paytabs.com`, Egypt `secure-egypt.paytabs.com`, Oman `secure-oman`, Jordan `secure-jordan`, Kuwait `secure-kuwait`, Iraq `secure-iraq`, Morocco `secure-morocco`, Qatar `secure-doha`, Global `secure-global` (all `.paytabs.com`). The wrong host causes authentication errors. [Initiate payment](https://docs.paytabs.com/manuals/PT-API-Endpoints/Integration-Types-Manuals/Hosted-Payment-Page/HPP-Step-3-Initiating-Payment/HPP-Initiating-Payment/)
- Auth: server key in the `authorization` header, no `Bearer`; `profile_id` in the body. [Configure](https://docs.paytabs.com/manuals/PT-API-Endpoints/Integration-Types-Manuals/Hosted-Payment-Page/HPP-Step-2-Configure-Integration-Method/HPP-Step-2-Landing/)
- Keys are in Merchant Dashboard › Developers › API Keys › Key Management. Keys can be limited by IP; SDK keys don't work for API calls. [Keys](https://support.paytabs.com/en/support/solutions/articles/60000709801-how-to-get-my-authentication-integration-api-keys-), [auth error](https://support.paytabs.com/en/support/solutions/articles/60000710918--e-authentication-failed-check-profile-id-and-authentication-header)
- Every new account gets a test profile, which accepts test cards only. A live profile has a new ID and appears after onboarding is approved. The docs give no way to tell test from live by API. [Profiles](https://support.paytabs.com/en/support/solutions/articles/60000710008-what-is-test-profile-vs-live-profile-)
- `cart_currency` accepts SAR, AED, BHD, EGP, EUR, GBP, KWD, OMR, QAR, USD (among others), limited to what's configured on the profile and supported by the acquiring bank. The same currency, amount, `cart_id` and profile within 2 minutes is a duplicate error. [cart_currency](https://docs.paytabs.com/manuals/PT-API-Endpoints/Integration-Types-Manuals/Request-Response-Parameters/Request-Response-cart-currency/)
- A currency is added by emailing customercare@paytabs.com with the profile ID. [Multi-currency](https://support.paytabs.com/en/support/solutions/articles/60000712412-how-to-deal-with-multiple-currencies-within-my-integration-) An unconfigured currency gives error 206. [206](https://support.paytabs.com/en/support/solutions/articles/60000711528--d-206-currency-mismatch)
- Processing currencies per market ([FAQ](https://ai.paytabs.com/en/faq/); a second entry says Kuwait takes only KWD and USD):

| Market | Currencies |
|---|---|
| KSA | SAR, USD, EUR, GBP, BHD, OMR, AED |
| UAE | AED, USD, EUR, GBP, BHD, OMR, SAR |
| Egypt | **EGP**, USD, EUR, GBP, **SAR**, AED |
| Oman | OMR, SAR, USD, EUR |
| Kuwait | KWD, SAR, USD, EUR, GBP, BHD, OMR, AED |
| Qatar | QAR, USD |
| Jordan | USD, JOD, SAR, EUR, AED, ILS |
| Iraq | USD, IQD, EUR |

- Onboarding: countries, documents, review; UAE has setup fees; live profile on approval. [Onboarding](https://support.paytabs.com/en/support/solutions/articles/60000716345-merchant-s-onboarding-journey)

**Connect form.**

| Field | en | ar | Secret | Notes |
|---|---|---|---|---|
| `region` | Your PayTabs region | منطقة حسابك في PayTabs | no | Select from the fixed list |
| `mode` | Test or live profile | ملف تجريبي أو فعلي | no | Existing picker |
| `profileId` | Profile ID | رقم الملف (Profile ID) | no | Digits only |
| `serverKey` | Server key | مفتاح الخادم (Server key) | **yes** | Help text: use an API key, not an SDK key, with no IP limit |

**Key check.** `POST /payment/request` with `tran_type: sale`, `tran_class: ecom`, a `tallaby_check_…` cart ID and a small amount **in the store's currency**. It's never paid, like today's 1 EGP Paymob check. Auth failure → `keys_rejected`, with a hint to check the region. A currency error → new `currency_not_enabled`, telling the seller to ask PayTabs to enable it. Whether the currency error comes at request time or only at payment is unconfirmed (§10). `/payment/query` is a lighter check, but it can't test the currency.

**Checkout.**
1. `POST {host}/payment/request` with `cart_id` = our reference (≤ 64 characters; ours fits), `cart_description`, `cart_currency` and `cart_amount` from the order, `customer_details`, `return`, `callback` = our webhook URL, `tran_type: sale`, `tran_class: ecom`.
2. Save `tran_ref` as the attempt, then redirect to `redirect_url`.
3. The shopper returns by **HTTP POST** to `return`. Our return route accepts only GET today (§5).

**Webhook verification.**
- `callback` is set per payment, so the seller configures nothing. It fires whatever the shopper does. [Step 6](https://docs.paytabs.com/manuals/PT-API-Endpoints/Integration-Types-Manuals/Hosted-Payment-Page/HPP-Step-6-Handle-post-payment-responses/HPP-Step-Six-Landing), [IPN](https://support.paytabs.com/en/support/solutions/articles/60000710069-how-to-configure-instant-payment-notification-ipn-)
- Header `Signature` = HMAC-SHA256 of the **raw body** with the server key. Compare in constant time. [Signature](https://support.paytabs.com/en/support/solutions/articles/60000718961)
- Retries: up to 5, expects 200.
- Paid only on `payment_result.response_status === "A"`. `H` (on hold) and `P` stay pending. `D`, `E`, `X`, `V`, `C` are failures. [Statuses](https://support.paytabs.com/en/support/solutions/articles/60000711358-what-is-response-code-vs-the-response-status-)
- Check `cart_id`, `cart_amount`, `cart_currency`, `tran_total`, `tran_currency` and `profile_id` against the order and integration. The return POST is not used to mark anything. It triggers `POST /payment/query` by `tran_ref` (60 a minute). [Query](https://docs.paytabs.com/manuals/PT-API-Endpoints/Integration-Types-Manuals/Hosted-Payment-Page/HPP-Step-7-Manage-Transactions/HPP-Step-7-Query-Transaction/)

**Currency list.** Region's market row, and only currencies the seller's profile has. Morocco and Global have no documented row, so those regions connect only after the check passes in the store's currency.

**Refunds.** Refund, void and capture through `tran_type`. [Step 7](https://docs.paytabs.com/manuals/PT-API-Endpoints/Integration-Types-Manuals/Hosted-Payment-Page/HPP-Step-7-Manage-Transactions/HPP-Step-7-Landing)

### 3.2 Moyasar

**Facts.**
- Basic auth with the secret key as username and an empty password, HTTPS only. `pk_test_`, `sk_test_`, `pk_live_`, `sk_live_`. Base `https://api.moyasar.com/v1`. [Auth](https://docs.moyasar.com/api/authentication)
- Keys are in the dashboard under API Keys. Live keys appear only after activation. **A secret key can't be viewed again after it's generated**; the seller must regenerate it. [Keys](https://docs.moyasar.com/guides/dashboard/get-your-api-keys)
- Saudi CR or freelance licence, and a Saudi commercial bank account. "Moyasar currently focuses on providing services within Saudi Arabia only." Approval is typically 2–5 business days. [FAQ](https://moyasar.com/en/resources/faqs/)
- Multi-currency: SAR default, plus AED, BHD, KWD, QAR, USD. **Aggregation merchants only**, off by default, ask a Moyasar representative, card only, always settled in SAR at Moyasar's rate with a margin. [Multi-currency](https://docs.moyasar.com/guides/multi-currency/introduction)
- Optional IP whitelist per environment. A seller who turns it on blocks our servers, so the form's help text says to leave it off. [IP whitelist](https://docs.moyasar.com/guides/dashboard/setting-up-your-ip-whitelist)

**Connect form.**

| Field | en | ar | Secret | Notes |
|---|---|---|---|---|
| `secretKey` | Secret key | المفتاح السري (Secret key) | **yes** | `^sk_(test\|live)_`; mode comes from the prefix |

We don't need the publishable key, because the hosted invoice page collects the card.

**Key check.** `GET /v1/invoices` with the key: 200 is fine, 401 means rejected. Nothing is created. [List invoices](https://docs.moyasar.com/api/invoices/03-list-invoice)

**Checkout.**
1. `POST /v1/invoices` with `amount` as an **integer in minor units** (1.00 SAR = 100, minimum 100; 1.00 KWD = 1000), `currency`, `description`, `success_url`, `back_url`, and `expired_at`. `callback_url` isn't needed because the API webhook covers it. [Create invoice](https://docs.moyasar.com/api/invoices/01-create-invoice)
2. Save `id` as the attempt, then redirect to `url`.

The create page doesn't list `metadata` in the request, so the mapping back to the order relies on the stored invoice ID (§5).

**Webhook verification.**
- At connect, `POST /v1/webhooks` with `url`, `http_method: post`, a random `shared_secret` we generate, and no `events` key, which means "all events". [Create webhook](https://docs.moyasar.com/api/other/webhooks/create-webhook) We omit `events` because the docs spell the failure event two ways, `payment_faild` in the [reference](https://docs.moyasar.com/api/other/webhooks/webhook-reference) and `payment_failed` in the [list](https://docs.moyasar.com/api/other/webhooks/available-webhooks).
- The body carries `secret_token`, `type`, `live` and `data`. There's no HMAC and no documented check, so we compare `secret_token` in constant time, reject on `live` not matching our mode, and **then fetch the invoice** with `GET /v1/invoices?id=…` and act on what comes back.
- `data.invoice_id` links the payment to our attempt ([field](https://docs.moyasar.com/api/invoices/03-list-invoice)). Paid is `paid` or `captured`. [Statuses](https://docs.moyasar.com/api/payments/payment-status-reference)
- Retries: 5 more, up to a 2-hour wait, then dropped.

**Currency list.** SAR in the first version. See owner question 3.

**Apple Pay.** Registering a domain is needed for Moyasar's embedded form ([web registration](https://docs.moyasar.com/guides/apple-pay/web-registration)). We use the hosted invoice page, so we expect not to need it, but the docs don't say so directly (§10).

**Refunds.** `POST /v1/payments/{id}/refund`, full or partial; live aggregation accounts need enough balance. [Refund](https://docs.moyasar.com/api/payments/05-refund-payment)

### 3.3 Paylink

**Facts.**
- Hosts: test `restpilot.paylink.sa`, production `restapi.paylink.sa`. Production keys are at my.paylink.sa and need an active subscription with API access. The docs publish shared test keys. [Environment](https://developer.paylink.sa/docs/environment-setup)
- `POST /api/auth` with `apiId`, `secretKey`, `persistToken` returns `id_token`, valid 30 minutes or 30 hours. [Auth](https://developer.paylink.sa/docs/authentication)
- Currency: "If the currency is not SAR … Paylink will convert it to SAR", and the response gives `foreignCurrencyRate`. [Reference](https://developer.paylink.sa/reference/addgatewayinvoiceusingpost) This breaks "never convert", so **SAR only**.
- Terms ask for a valid commercial register or freelance document, national ID and an IBAN (excerpt). [Terms](https://paylink.sa/catalog/terms/)
- Minimum SAR 5.00; unpaid invoices cancel after 24 hours. [Add invoice](https://developer.paylink.sa/docs/add-invoice) A 406 means the merchant's daily or monthly limit was passed.

**Connect form.**

| Field | en | ar | Secret | Notes |
|---|---|---|---|---|
| `mode` | Test or live | تجريبي أو فعلي | no | Picks the host |
| `apiId` | API ID | معرّف الـ API (API ID) | no | |
| `secretKey` | Secret key | المفتاح السري (Secret key) | **yes** | |

After connecting, the sheet shows the webhook URL to paste into my.paylink.sa settings (v2). It's optional but recommended.

**Key check.** `POST /api/auth`. Nothing is created. The exact status for bad keys is not documented.

**Checkout.**
1. `POST /api/auth` for a short token (`persistToken: false`). Tokens are not cached (rule 8).
2. `POST /api/addInvoice` with `orderNumber` = our reference, `amount`, `callBackUrl`, `cancelUrl`, `clientName`, `clientMobile`, `clientEmail` if real, and a single `products` line for the order total. `amount` is what the buyer pays regardless of product prices. Omit `currency`, so it defaults to SAR.
3. Save `transactionNo`, then redirect to `url`.
4. The browser returns to `callBackUrl` with `TransactionNo` and `OrderNumber`. [Processing](https://developer.paylink.sa/docs/payment-processing)

**Webhook verification.**
- No signature exists. Custom headers can be configured in the portal, and the seller sets the URL by hand. [Webhook](https://developer.paylink.sa/docs/payment-webhook) Retries: up to 10 until a 200.
- We treat every POST as **an untrusted hint**. We look up `transactionNo` in this integration's attempts, then call `GET /api/getInvoice/{transactionNo}` with the seller's keys, and act only on that answer. A forged POST can only cost one lookup, so no header token has to be shown to the seller.
- Paid is `orderStatus` Paid (the docs vary in case, so compare case-insensitively), amount equal, and `foreignCurrencyRate` absent. Declined stays Pending; the reason is in `paymentErrors`. [Get invoice](https://developer.paylink.sa/docs/get-invoice)
- Because the webhook is optional and manual, the sweeper (§5) must cover missed ones.

**Refunds.** Cancel invoice is open to merchants ([cancel](https://developer.paylink.sa/docs/cancel-invoice)). The refund API documented is **partner role only** ([refund](https://developer.paylink.sa/docs/refund-an-order)).

**Note.** `supportedCardBrands` includes `tabby` and `tamara`, and the hosted page can offer them. So a Paylink seller may get Tabby without our Tabby work. We don't name the method "card only" on the Paylink row.

### 3.4 PayPal

**Facts.**
- Credentials are at Developer Dashboard › Apps & Credentials › REST API apps: client ID and secret, separate for sandbox and live. A business account is needed to go live. [REST](https://developer.paypal.com/api/rest/)
- Hosts: `api-m.sandbox.paypal.com`, `api-m.paypal.com`. [Requests](https://developer.paypal.com/api/rest/requests/)
- **Currencies:** 24 listed. EGP, SAR, AED, KWD, QAR, BHD, OMR are not on the list; USD, EUR, GBP are. [Currency codes](https://developer.paypal.com/reference/currency-codes/)
- **Egypt:** there's an [Egypt business sign-up page](https://www.paypal.com/eg/business/open-business-account?locale.x=en_EG), and withdrawal help says a local bank transfer may take up to [7 business days](https://www.paypal.com/eg/cshelp/article/how-do-i-withdraw-money-to-my-bank-account-help394?locale.x=en_EG). But the [Egypt "receive money" help page](https://www.paypal.com/eg/cshelp/article/how-do-i-receive-money-through-paypal-help667?locale.x=en_EG) talks about a Visa card or US bank account, and ROADMAP.md F-39 records that Egyptian accounts "often can't receive". **Unconfirmed. Needs a real account test (§9).**

**Model.** The seller's own credentials. The partner route needs PayPal's approval and doesn't fit "the seller pastes keys", so it's not proposed.

**Connect form.**

| Field | en | ar | Secret | Notes |
|---|---|---|---|---|
| `mode` | Sandbox or live | تجريبي أو فعلي | no | Picks the host |
| `clientId` | Client ID | معرّف العميل (Client ID) | no | |
| `clientSecret` | Secret | المفتاح السري (Secret) | **yes** | |

**Key check.** `POST /v1/oauth2/token` with basic auth and `grant_type=client_credentials`. No charge, nothing created.

**Checkout.** [Standard use case](https://developer.paypal.com/api/rest/integration/orders-api/api-use-cases/standard), [create order](https://developer.paypal.com/api/orders/v2/orders-create), [payment_source](https://developer.paypal.com/api/orders/v2/definitions/payment_source)
1. Token call (not cached).
2. `POST /v2/checkout/orders` with header `PayPal-Request-Id` = our reference, `intent: CAPTURE`, `purchase_units[0].amount` `{ currency_code, value: "12.34" }`, `custom_id` and `invoice_id` = our reference (`invoice_id` must be unique per account, and ours is), and `payment_source.paypal.experience_context` with `return_url`, `cancel_url`, `user_action: PAY_NOW`, `shipping_preference`, `locale`.
3. Save the order ID, then redirect to the link with `rel: payer-action`; fall back to `approve`, because samples show both.
4. **Capture is required.** On return, or on `CHECKOUT.ORDER.APPROVED`: `GET` the order, check amount and currency, then `POST /v2/checkout/orders/{id}/capture` with `PayPal-Request-Id: capture-{orderId}` and `Prefer: return=representation`. [Capture](https://developer.paypal.com/api/orders/v2/orders-capture) A shopper who closes the tab after approving is still captured, through the webhook.
5. Paid only when the capture's status is `COMPLETED`. A `PENDING` capture stays pending until `PAYMENT.CAPTURE.COMPLETED`.

**Webhook verification.**
- At connect, `POST /v1/notifications/webhooks` with our URL and `event_types`, and store the returned webhook ID. [Create webhook](https://developer.paypal.com/api/webhooks/v1/webhooks-post) Events: `CHECKOUT.ORDER.APPROVED`, `PAYMENT.CAPTURE.COMPLETED`, `.DECLINED`, `.PENDING`, `.REVERSED`, `.REFUNDED`. [Events](https://developer.paypal.com/api/rest/webhooks/event-names/)
- Verify with `POST /v1/notifications/verify-webhook-signature`; success is `verification_status: SUCCESS`. [Verify](https://developer.paypal.com/api/webhooks/v1/verify-webhook-signature-post) The event must be posted back exactly as received, so we **splice the raw body** into the request instead of re-serialising it. [Webhooks](https://developer.paypal.com/api/rest/webhooks/rest/)
- We don't use self-verification, because it means downloading a certificate from the URL in a header, which is an SSRF risk unless carefully pinned.
- Retries: up to 25 over 3 days; expects 2xx.

**Currency list.** USD, EUR, GBP. On an EGP or Gulf store the row is disabled with "PayPal doesn't accept {currency}. It works on stores in USD, EUR or GBP." Hidden at checkout and refused on the server.

**Refunds.** `POST /v2/payments/captures/{id}/refund`. [Refund](https://developer.paypal.com/api/payments/v2/captures-refund)

### 3.5 Tabby

**Facts.**
- UAE `api.tabby.ai` / `checkout.tabby.ai` / `merchant.tabby.ai`; KSA `api.tabby.sa` / `checkout.tabby.sa` / `merchant.tabby.sa`. Every call must use the merchant's region; cross-region calls can return 404 or 403. [Overview](https://docs.tabby.ai/api-reference/overview)
- Keys: `sk_test_…`, `sk_…`, `pk_test_…`, `pk_…`, plus a `merchant_code` that depends on the store's currency. [Quick start](https://docs.tabby.ai/pay-in-4-custom-integration/quick-start), [snippets](https://docs.tabby.ai/pay-in-4-custom-integration/on-site-messaging)
- Currencies: enum `AED`, `SAR`. The same page mentions KWD decimals, so KWD is not treated as supported. [Create session](https://docs.tabby.ai/api-reference/checkout/create-a-session)
- Merchants: "based in the UAE and Saudi Arabia", legally registered in the operating country. [Who can apply](https://tabby.ai/en-AE/help-business/applying-to-tabby/who-can-apply)
- **Live keys for custom API integrations come from an account manager after Tabby's QA.** Plugin merchants get them from the dashboard. [FAQ](https://docs.tabby.ai/introduction/faq), [checklist](https://docs.tabby.ai/pay-in-4-custom-integration/full-testing-checklist)
- Limits: set by Tabby per customer and industry. Don't hardcode any. Rejection reasons are `order_amount_too_high`, `order_amount_too_low`, `not_available`. [Checkout flow](https://docs.tabby.ai/pay-in-4-custom-integration/checkout-flow)

**Connect form.**

| Field | en | ar | Secret | Notes |
|---|---|---|---|---|
| `region` | Your Tabby country | بلد حسابك في تابي | no | KSA or UAE; decides host and currency |
| `merchantCode` | Merchant code | كود التاجر (Merchant code) | no | |
| `publicKey` | Public key | المفتاح العام (Public key) | no | Public, for the snippets; regex-checked (rule 9) |
| `secretKey` | Secret key | المفتاح السري (Secret key) | **yes** | Mode comes from the prefix; public key must match |

**Key check.** `GET /api/v1/webhooks` on the regional host, with bearer key and `X-Merchant-Code`. 401 means rejected, `null` or an object means fine, nothing is created. [Retrieve webhooks](https://docs.tabby.ai/api-reference/webhooks/retrieve-all-webhooks) It doesn't prove the merchant code works, which only pre-scoring will show.

**Webhook verification.**
- At connect, `POST /api/v1/webhooks` with `url` and `header: { title, value }`, using a random value we generate. Maximum 4 per merchant code and key pair, so reuse a matching one on reconnect. [Register](https://docs.tabby.ai/api-reference/webhooks/register-a-webhook)
- Check the header in constant time, then **always** `GET /api/v2/payments/{id}`, as the checklist requires, and check `is_test` matches our mode. [Webhooks](https://docs.tabby.ai/pay-in-4-custom-integration/webhooks), [retrieve](https://docs.tabby.ai/api-reference/payments/retrieve-a-payment)
- Delivery order isn't guaranteed and duplicates happen. Statuses only move forward. A non-200 retries up to 4 more times.
- Tabby recommends allowing its IPs. We don't enforce an allowlist because "new IPs may be added"; the header plus the fetch is the proof.

Checkout needs and naming are in §7.

**Refunds and cancel.** Refund only on `CLOSED`, within 180 days. Close cancels an uncaptured payment. [Processing](https://docs.tabby.ai/pay-in-4-custom-integration/payment-processing), [statuses](https://docs.tabby.ai/pay-in-4-custom-integration/payment-statuses)

## 4. How it fits the existing model

**Stays the same:**
- `store_integrations` row per provider, keys encrypted with AES-256-GCM bound to store ID and provider (`encryptCredentials`).
- `config` holds public details only.
- `metadata.paymentCollector = 'seller'` and the `metadata.paymentGateway` snapshot on the order.
- One webhook URL per integration, `POST /api/webhooks/store-payments/:integrationId`.
- `store_settings_audit` on every change, with keys never logged.
- `applyGatewayEvent`: order must belong to that store and name that integration, advisory lock, namespaced transaction ID, amount and currency check, state-guarded claim, fee on paid.

**Must change** (found in the code on 2026-11-04):

| Where | Today | Problem |
|---|---|---|
| `store-gateways.lib.ts:138`, `:161` | After the Paymob branch, everything is Kashier | A new provider would be validated as Kashier |
| `store-gateways.server.ts:144` | `find((p) => p !== provider)` | Only finds one "other" gateway |
| `store-gateways.server.ts:288`, `:460`, `:544` | Paymob-or-Kashier branches for key check, checkout, webhook | Same |
| `store-gateways.lib.ts:199`, `GatewayEvent.amountPiastres` | Assumes 2 decimals | KWD, BHD and OMR use 3; Moyasar sends minor units |
| `store-methods.ts:259`, `:328–345` | `online_payment` only on EGP | The blanket rule to replace (§6) |
| `apps/backend/src/routes/store-payments.ts:16–21` | `c.req.json()`, passes only `hmac` and `x-kashier-signature` | PayTabs and PayPal need the raw body and their own headers |
| Same route | Duplicate returns 409 | Every new provider retries on non-2xx |
| `apps/ecommerce/app/api/store-payments/return/route.ts` | GET only, writes nothing | PayTabs returns by POST; PayPal and Tabby need capture |
| `place-order.ts`, `createStoreGatewayCheckout` | No provider payment ID kept | Moyasar, PayPal and Paylink look-ups need it |
| `applyGatewayEvent` | SUCCESS means the money is taken | PayPal and Tabby must capture first |
| `gateways.client.tsx:253`, `:233` | `provider === "kashier"` shows the mode picker | Needs mode and region per gateway |
| `gateways.dto.ts`, `integrations/validate.ts` `DETAIL_KEYS`, `registry.ts`, `catalog.ts`, `readGatewayConfig` | Two providers; `readGatewayConfig` drops unknown keys | Add five; keep `region` |
| `checkout.ts:351`, `checkout.data.tsx:416` | Client gets `gateway: null`, one "Pay by card" row | Needs a named row per available gateway, with no integration ID sent |

**Not a problem:** `orders.payment_method` has no CHECK, and `store_integrations_provider_check` was last rebuilt in 0130.

## 5. Adapter design

A thin interface. No framework, no rewrite.

```ts
// packages/lib/src/payments/gateways/caps.lib.ts — pure, safe for store-methods.ts
export type GatewaySlot = "card" | "wallet" | "bnpl";
export const GATEWAY_CAPS = {
  paymob:  { slot: "card",   currencies: () => ["EGP"] },
  kashier: { slot: "card",   currencies: () => ["EGP"] },
  paytabs: { slot: "card",   currencies: (c) => PAYTABS_MARKETS[c.region] ?? [] },
  moyasar: { slot: "card",   currencies: () => ["SAR"], minMinor: { SAR: 100 } },
  paylink: { slot: "card",   currencies: () => ["SAR"], minMinor: { SAR: 500 } },
  paypal:  { slot: "wallet", currencies: () => ["USD", "EUR", "GBP"] },
  tabby:   { slot: "bnpl",   currencies: (c) => (c.region === "ksa" ? ["SAR"] : ["AED"]) },
} as const;

// packages/lib/src/payments/gateways/types.ts
export type GatewayAdapter<S> = {
  provider: StoreGatewayProvider;
  validate(raw: unknown, saved: Partial<S> | null): ValidatedGateway;
  isComplete(secret: unknown): secret is S;
  verifyKeys(secret: S, ctx: KeyCheckCtx): Promise<KeyCheckResult>;
  /** Register a webhook at the provider; returns extra secret fields. */
  onConnect?(secret: S, ctx: ConnectCtx): Promise<Partial<S>>;
  onDisconnect?(secret: S, ctx: ConnectCtx): Promise<void>; // best effort
  createCheckout(secret: S, ctx: CheckoutCtx): Promise<{ checkoutUrl: string; providerRef: string }>;
  /** Ask the provider; capture if needed. Absent for Paymob and Kashier. */
  settle?(secret: S, ctx: SettleCtx): Promise<GatewayEvent | null>;
  parseWebhook(req: GatewayWebhookRequest, secret: S): ParsedGatewayWebhook;
};
```

- `parseWebhook` gains one new result: `{ kind: "lookup", providerRef, authentic }`. The handler then calls `settle`, which fetches, captures if needed, and returns the event for `applyGatewayEvent`. A provider without a real signature can't move an order by itself.
- **Paymob and Kashier** become adapters that wrap today's functions with no change: same bodies, same parsers, same 409 on duplicate through a per-adapter `duplicateStatus`. Their existing tests stay as the proof.
- **Files** (rule 14): `gateways/{caps,types,registry}.ts`, `gateways/<provider>.lib.ts` (validation, parsing, pure and tested) and `gateways/<provider>.server.ts` (fetch). `store-gateways.server.ts` keeps connect, disconnect, checkout and the handler, and calls the registry.
- **Amounts:** add `amountDecimal` on the event and compare with `sameAmount(order.totalAmount, value)`, parsing both to integer thousandths, never floats. A `MINOR_EXPONENT` table covers EGP, SAR, AED, QAR, USD, EUR, GBP at 2 and KWD, BHD, OMR at 3. `orders.total_amount` is `numeric(10,2)`, so a 3-decimal order is really at 2 decimals; a gateway reporting a different third digit is a mismatch and never paid.

**Migration `0151_more_store_gateways.sql`** (hand-written, idempotent, staging first; mirror in `schema.ts` and `relations.ts`; rule 6):
- Rebuild `store_integrations_provider_check` as a superset of 0130's list, adding `paypal`, `tabby`, `moyasar`, `paytabs`, `paylink`.
- New server-only `store_gateway_attempts`, RLS on, no policies: `id`, `order_id` (CASCADE), `store_id`, `seller_id` (CASCADE, per 0134's owner-rows rule), `integration_id` (SET NULL), `provider`, `provider_ref`, `reference`, `amount`, `currency`, `status`, timestamps; `UNIQUE (integration_id, provider_ref)`, partial index on open attempts.

Why a table and not `orders.metadata`: webhooks and the sweeper look up by provider ID, and it's the capture claim Tabby's docs ask for (an atomic update that only one path wins). It also keeps every attempt when a shopper retries.

**Return route.** Accepts GET and POST, never trusts the query or body, and always redirects to the order page. For a provider with `settle`, it calls `settleStoreGatewayOrder(orderId)` first, within a short timeout. If that times out, the order page shows "Confirming payment" and the webhook or sweeper finishes. Paid side effects (digital fulfilment, seller emails) live in the backend route today, so settling from the storefront must hand off to the backend rather than duplicate them. This is a behaviour change from "this route writes nothing", and §8 covers why it's safe.

**Sweeper.** A cron looks at open attempts younger than about 60 minutes and calls `settle`. Tabby's docs recommend this as a fallback, and Paylink needs it because its webhook is optional. Cadence depends on what the deployment allows.

**Webhook URL before the row exists.** PayPal, Moyasar and Tabby need the URL at connect. Generate the integration UUID in code, register the webhook, then insert with that ID. Keep the rule that network calls stay outside the transaction. If the insert fails, remove the webhook, best effort. On update, reuse the row's ID and the provider's existing webhook.

**Disconnect.** Delete the provider's webhook, best effort, then the row as today. New for capture gateways: warn when a store has authorised, uncaptured attempts, because Tabby may capture them itself after 21 days.

## 6. The currency rule

**Replace** "no online payment on non-EGP stores" with: **a gateway is available only if it supports the store's currency.** Enforced at four points, all on the server except the last:

1. **Checkout list.** `storefrontCheckoutMethods(payments, gateways, currency)` keeps only gateways whose `GATEWAY_CAPS[…].currencies(config)` include the currency, replacing `gateway && egp`. Manual transfers stay EGP-only, and the customer wallet stays off, as today.
2. **Placement.** `isMethodAllowedForCurrency` stays first in `place-order.ts`, but `online_payment` on a non-EGP order now requires a storefront gateway that supports that currency. Marketplace orders have no storefront gateway, so they stay refused and can never reach Tallaby's own EGP Kashier. Then `isStorefrontCheckoutMethodAllowed` checks the chosen gateway and any minimum.
3. **Payment start.** `createStoreGatewayCheckout` re-checks the order's currency against the gateway's list, in case the store's settings changed since placement.
4. **Dashboard.** The row of a gateway that can't take the store's currency is disabled and says why. `connectStoreGateway` refuses it (`currency_not_supported`). Store settings › General warns when a currency change would hide a connected gateway.

**The amount and currency sent are always `order.totalAmount` and `order.currency`.** No exchange rate, no conversion. Paymob and Kashier stay EGP-only. A payment that comes back in another currency or amount goes down the existing "mismatch" path: recorded, never confirmed.

`store-methods.currency.test.ts` must change: `online_payment` on SAR is false with no gateway or with Paymob, and true with PayTabs (KSA).

**Rollout guard.** F-61's note says card stays off abroad until tested on a real account. So each new provider stays `availability: "soon"` in `registry.ts` until its sandbox E2E passes. Merging the rule alone changes nothing for sellers.

**One gateway per store becomes one per slot** (owner question 1): one of `card`, plus PayPal, plus Tabby. A shopper picks a named row. `orders.payment_method` stays `online_payment` for all of them, and `metadata.paymentGateway.provider` says which. That avoids changing about 15 places that read `online_payment`, including order pages and emails. A small `orderPaymentLabel(order)` gives the right name where one is shown.

The checkout sends a chosen `gatewayProvider`, and the server resolves it against the store's own connected gateways. No integration ID ever reaches the client.

## 7. Tabby's extra checkout needs

**Name.** Not "card". Tabby's docs fix the wording: **"Pay later with Tabby" / "ادفع لاحقًا مع تابي"**, with its logo. [Checkout flow](https://docs.tabby.ai/pay-in-4-custom-integration/checkout-flow)
- Under it, the `TabbyCard` snippet (recommended), or the approved fallback "4 payments of XX.XX/mo or up to 12 months. Learn more", where XX.XX = total × 1.015 ÷ 4.
- Dashboard catalog: a buy-now-pay-later method, in its own group. "Online card payments" becomes "Online payments / الدفع الإلكتروني".
- Order pages and emails say Tabby, via `orderPaymentLabel`.

**Flow.**

1. **Pre-scoring.** When checkout knows total, email and phone, and again when the total changes, a server action computes the total itself and calls `POST /api/v2/checkout` with the minimal payload (`amount`, `currency`, `buyer.email`, `buyer.phone`, `merchant_code`). `created` shows it; `rejected` hides it. On an API error or timeout, **show it**, as the docs say. Rejection is logged as a normal outcome, not an error.
2. **Session.** After Place order, with the full payload. Required: `payment.amount`, `currency`, `buyer {name, email, phone}`, `shipping_address {city, address, zip}`, `order {reference_id, items[title, quantity, unit_price, category]}`, `buyer_history {registered_since}`, plus `lang`, `merchant_code`, `merchant_urls {success, cancel, failure}`.
3. **Validate before redirect.** Status is not `rejected` and `configuration.available_products.installments[0].web_url` exists. Otherwise show the rejection message and offer other methods. Save `payment.id`.
4. **Same window, no surcharge.** The total must match other methods, with no fee added.
5. **Verify and capture.** On return or `authorized` webhook: retrieve, require `AUTHORIZED`, check amount, currency and `is_test`, claim the attempt atomically, then `POST /api/v2/payments/{id}/captures` with the **full** amount and `reference_id: capture-{orderId}`, derived from the order, never a timestamp. A 200 means `CLOSED`, and only then `applyGatewayEvent` SUCCESS and the fee. `CLOSED` at retrieve means it's already captured. If capture fails, release the claim. Check `captures` is empty before capturing from a webhook.
6. **Order cancelled before capture.** Don't capture; call Close, or Tabby may capture it itself after 21 days.

**Where each value comes from.**

| Tabby field | Source | Gap |
|---|---|---|
| `buyer.email` | Order or account email | **Guests have a placeholder email** (`actions/checkout.ts:249`), and the store's email field is optional (F-64). Tabby needs a real one, so the field becomes required when Tabby is available. `customer@tallaby.com` must never be sent |
| `buyer.phone` | Address phone | Must be in Tabby's format, as in its +966 and +971 test numbers; F-61e already validates abroad |
| `shipping_address.zip` | `postalCode` | **Optional in our form** (`address-form.schema.ts:41`). Ask Tabby what to send when empty |
| `items[].category` | Order item's product category | Exists on the product; confirm at build |
| `buyer_history.registered_since` | `users.created_at` | |
| `buyer_history.loyalty_level` | Count of paid orders by this user **in this store** | Recommended |
| `order_history[]` | Last 5–10 orders by this user **in this store**, not the current one | Recommended. Filter by `store_id`; another seller's orders must never be sent (rule 5) |

**Snippets.** `TabbyPromo` on product and cart pages, `TabbyCard` at checkout, from `checkout.tabby.ai/tabby-promo.js` and `tabby-card.js`. Quick start calls them "required for optimal conversion", and the checklist lists them. They go through a fixed template with `publicKey` and `merchantCode` checked by regex, only on that seller's host (rule 9). The secret key never leaves the server. The element ID must not be `TabbyCard`. Check the storefront's CSP allows the Tabby hosts.

**Points that don't fit Tabby's checklist, to tell Tabby up front.** The checklist says to raise these by email.
- We place the order, in `payment_processing`, before payment; Tabby says create it once `AUTHORIZED`. Ours is hidden from the seller until paid, which should be equivalent.
- We clear the cart at placement (`place-order.ts:1050`); Tabby wants it kept after a cancel. The shopper retries from the order's payment page instead.
- The payment page creates the checkout URL on page render, so a reload creates a new session, against "exactly one session per click". For Tabby, start the session from a button action.

**Test scenarios** (from [credentials](https://docs.tabby.ai/testing-guidelines/testing-credentials)): success, pre-scoring reject, cancel, failure, closed tab before redirect, refund. Credentials are on that page. The webhook sequence on success should be `authorized`, then `authorized` with the capture, then `closed`.

## 8. Security

- **Secrets.** Encrypted per store and provider; never selected into a summary, sent to a browser, logged or put in `NEXT_PUBLIC_*`. Blank fields keep saved values. Error bodies are never logged. Tokens aren't cached (rule 8). Webhook secrets we generate live in the same encrypted blob.
- **Per-integration check.** The secret comes from the integration in the URL path. A bad signature returns 401 and records nothing. `webhookVerifiedAt` is set only after a verified signature or a matching provider fetch.
- **No webhook is enough for weak schemes.** Moyasar, Tabby and Paylink have no real signature, so the fetch with the seller's key decides. PayPal's signature is verified by PayPal, and PayTabs' HMAC is checked locally.
- **Replay.** A repeat finds the attempt and payment already final. `store:{integrationId}:{provider}:{id}` stays namespaced, with the advisory lock and the state-guarded claim. Captures use order-derived idempotency keys. Test events can't touch live orders (`is_test`, `live`, profile ID, mode).
- **Amount and currency.** Checked against the order **before capture**, and again in `applyGatewayEvent`. Mismatches never confirm.
- **Tenant isolation.** `applyGatewayEvent` already refuses another store's order. The attempts lookup is scoped by integration, so a seller's key can't reach another store's attempt, even with a reused provider ID.
- **Return route.** It can trigger a provider fetch by order ID, so it's rate limited, and it never takes a provider ID, amount or status from the request. The worst a forged call can do is settle the order sooner to its true state.
- **SSRF.** Hosts come only from a fixed `{provider, region, mode} → host` table in code. `region` is an enum. Never fetch a URL from a payload or header: not `paypal-cert-url`, not Paylink's `checkUrl`, not any seller-typed URL.
- **Open redirect.** A checkout URL from a provider must be `https` and on that provider's known hosts before we redirect to it.
- **Audit.** Every connect, update and disconnect keeps writing `store_settings_audit`, with mode, region and key hint only.

**Money model, unchanged** (`PLAN.md` §13.4). Money goes straight to the seller's account, and Tallaby never holds it. Orders carry `paymentCollector = 'seller'`. Tallaby's fee is charged by `chargeOrderPlacementFee` when an order is paid, exactly as for Paymob and Kashier; it's EGP 5 today, and the approved USD fee follows `PLAN.md` when that goes live. The gateway's own fees are between the seller and the gateway. For capture gateways, "paid" means captured.

## 9. Build order

Each task is small and ends with lint, typecheck and tests (rule 15), plus a `ROADMAP.md` update (rule 19).

| # | Task | Notes |
|---|---|---|
| G-1 | Currency caps and the new rule (`caps.lib.ts`, `store-methods.ts`, `place-order.ts`, tests) | Only Paymob and Kashier exist, so nothing changes for sellers |
| G-2 | Adapter seam: Paymob and Kashier behind the interface; route passes raw body and all headers | No behaviour change; existing tests stay green |
| G-3 | Migration 0151 on staging, schema mirror, attempts written at checkout | Additive. Production before deploy, with owner approval |
| G-4 | `settle` path: return route GET and POST, hand-off of paid side effects, sweeper, `sameAmount` | Nothing uses it yet except tests |
| G-5 | Dashboard: mode and region per gateway, disabled-by-currency rows, renamed card, both languages | Providers stay "soon" |
| G-6 | **PayTabs** adapter + E2E | Highest value: the Egypt and SAR path |
| G-7 | **Moyasar** adapter + E2E | One key, API webhook |
| G-8 | **Paylink** adapter + E2E | Manual webhook, sweeper |
| G-9 | Slots: several gateways per store, named checkout rows, `orderPaymentLabel` | Needs owner question 1 |
| G-10 | **PayPal** adapter, capture, webhook registration, verify call + E2E | After the Egypt-account test |
| G-11 | **Tabby** connect, webhook, capture, close | Needs Tabby's answer |
| G-12 | **Tabby** pre-scoring, required email, data mapping, snippets, wording | Risky and uncertain, so last |
| G-13 | Tabby QA with Tabby, then go-live | Depends on Tabby |

**Sandbox accounts the owner must create** (we can't create accounts):

| Provider | What to create | Needs a business? | Then send us |
|---|---|---|---|
| PayTabs | Register a merchant; the test profile is automatic. One on the **Egypt** domain. Ask customercare@paytabs.com to enable **SAR** on the test profile | No for test | Profile ID and test API key, through a safe channel |
| Moyasar | Register at [dashboard.moyasar.com](https://dashboard.moyasar.com/register/new). Test keys are available before activation | No for test; Saudi CR for live | `sk_test_…` |
| Paylink | **None for API tests**: the docs publish shared test keys. A my.paylink.sa account only to test the webhook setting and live | Yes for live | Nothing yet |
| PayPal | Developer account + sandbox REST app; business and personal sandbox accounts come with it | No | Sandbox client ID and secret |
| PayPal, real | **One real Egyptian PayPal Business account**, to take a small USD payment and try a withdrawal | Yes | The result: it decides whether to tell Egyptian sellers PayPal works |
| Tabby | Email partner@tabby.ai or partner@tabby.sa first (owner question 2). Test keys come from the dashboard or an account manager, after an application by a KSA or UAE business | **Yes, KSA or UAE** | Test keys, merchant code, and their answer |

Staging also needs a public `STORE_PAYMENTS_WEBHOOK_BASE_URL` for webhooks to arrive.

## 10. What the docs could not settle

| # | Gateway | Question | Handling |
|---|---|---|---|
| 1 | PayPal | Can an Egyptian business account really receive and withdraw? Pages disagree | Real account test |
| 2 | PayPal | Webhook limit per app, HTTPS rule for the URL | Sandbox; the reference page states neither |
| 3 | PayPal | `shipping_preference` is `SET_FROM_PROVIDER` on one page and `SET_PROVIDED_ADDRESS` on another | Sandbox; choose the accepted value |
| 4 | PayPal | `payer-action` or `approve` link; which fields the capture webhook carries, such as `custom_id`; capture error names (the page was cut off) | Sandbox; look up by stored order ID |
| 5 | Tabby | **Is QA per seller, or can Tallaby be certified once as a platform?** | Ask Tabby |
| 6 | Tabby | What to send as `zip` when empty | Ask Tabby |
| 7 | Tabby | KWD decimals are mentioned, but the enum is AED and SAR only | Treated as unsupported |
| 8 | Tabby | Do plain merchant accounts get self-serve test keys, or only via a manager? | Ask Tabby |
| 9 | Moyasar | Does a normal seller count as an "aggregation merchant" for multi-currency? | SAR only for now |
| 10 | Moyasar | `metadata` on invoice create; a single-invoice fetch path (the guessed URL returned 404, so we use `GET /invoices?id=`); does the webhook fire for invoice payments? | Sandbox |
| 11 | Moyasar | Exact failure event name; how `secret_token` should be checked | Handled by subscribing to all and fetching |
| 12 | Moyasar | Apple Pay domain step on the hosted invoice page | Sandbox |
| 13 | PayTabs | Does an unconfigured currency fail at request time? If only at payment, the key check can't catch it | Sandbox; if so, seller confirms the currency in the form |
| 14 | PayTabs | Service countries differ between pages (Morocco, Qatar); Kuwait's currency list conflicts; decimal rule for `cart_amount`; `tran_total` vs `cart_amount` meaning; does the hosted page need domain or Apple Pay registration? | Sandbox and PayTabs support |
| 15 | PayTabs | How to tell a test profile by API | Seller picks mode |
| 16 | Paylink | Saudi-only is implied, never stated; merchant refund API; bad-key status; callback method; phone format for non-Saudi numbers; invoice `orderStatus` case | Sandbox and Paylink support |
| 17 | All | Do their terms allow a platform to hold a seller's secret key and call the API for them? Not addressed in the pages read | Owner or legal, if it matters |

## 11. Questions only the owner can answer

1. **One gateway per store, or one per kind?** The 2026-10-30 decision was one gateway per store. Tabby is pay-later and PayPal is a wallet, so we propose one card gateway + PayPal + Tabby. Without it, a seller can't offer Tabby next to card.
2. **Contact Tabby as a platform?** Should the owner email partner@tabby.ai to ask whether Tallaby can be certified once? If each seller needs their own QA, Tabby may not be worth building now. A Paylink or PayTabs seller may get Tabby through their gateway instead: Paylink lists `tabby` as a method, and [PayTabs documents Tabby for KSA and UAE](https://support.paytabs.com/en/support/solutions/articles/60001016783-tabby-work-flow-and-user-experience).
3. **Moyasar beyond SAR?** It would need each seller to get multi-currency enabled, and Moyasar settles in SAR with a margin. We propose SAR only for now.
4. **Egyptian sellers.** Moyasar, Tabby and Paylink are out of reach for a seller without a Saudi or UAE business. Should the dashboard say so up front on each row? We propose yes, so nobody signs up for nothing.
5. **Which first?** We propose PayTabs first. If real demand is Saudi-registered sellers, Moyasar could go first; it's equally small.
6. **Priority against F-61's "delayed" note.** F-61 is in the owner's delayed group, and this makes abroad card payment real. Confirm F-39g should go ahead now.
7. **Email at checkout.** Tabby needs a real email. Requiring it only when a store has Tabby is our proposal, but it changes the short checkout for those stores. OK?
