# WhatsApp setup in Meta (owner checklist)

Everything you set up by hand in Meta, once, so Tallaby can send WhatsApp order messages from one official Tallaby number (ROADMAP.md F-109, design in [`whatsapp.md`](whatsapp.md)). It takes about an hour of clicks. Business verification and display-name review can take 1–5 working days, so start with steps 1 and 3.

You need: admin access to Tallaby's Meta Business portfolio (business.facebook.com), a phone number that is **not** used in the WhatsApp or WhatsApp Business app (a new SIM or a landline that can receive an SMS or a call), and a card for Meta's billing.

Checked against Meta's "WhatsApp Cloud API Get Started" page on 2026-11-26 (developers.facebook.com/documentation/business-messaging/whatsapp/get-started). Its curl samples use `v23.0`; Tallaby uses `v27.0` (set by `WHATSAPP_GRAPH_VERSION`). Its temporary token and test webhook app are for trying things out only. Meta renamed several menus in 2025–2026. If a name below differs, search for it in the portfolio's settings.

---

## 1. Verify the business (start now: it takes days)

1. business.facebook.com → **Settings** → **Business info** (or **Security Center**) → **Start verification**.
2. Use the legal name exactly as on the commercial register (السجل التجاري) or tax card, plus the address, phone and website `tallaby.com`.
3. Upload one document showing the legal name and address (commercial register extract, tax card or a utility bill in the company's name), then confirm by email, phone or a DNS record on `tallaby.com`.

Why: without verification Tallaby can message only **250 different customers a day**, and the templates are limited. After verification it is 2,000 a day, rising automatically to 10k, 100k and unlimited as quality stays high.

## 2. Create the Meta app

1. developers.facebook.com → **My Apps** → **Create app**.
2. Use case: **Connect with customers through WhatsApp**. App name: `Tallaby WhatsApp`. Contact email: the ops address. Link it to the Tallaby business portfolio.
3. In the app: **App settings → Basic**: copy the **App secret** (Show). This is `WHATSAPP_APP_SECRET`. Add the privacy policy URL `https://tallaby.com/privacy` and the terms URL, then switch the app to **Live** (the top toggle).

## 3. WhatsApp Business Account and the phone number

1. In the app → **Customize use case → Connect on WhatsApp → Quickstart → Start using the API** → **API Setup**. Connect a **Messaging account** (Meta's new name for the WhatsApp Business Account, WABA): pick Tallaby's if one exists, otherwise **Create a WhatsApp Business account**. Meta also gives a **test number**. The test number can message only up to 5 numbers you add by hand; use it for a first test, never in production.
2. **Add phone number**:
   - Display name: **Tallaby** (or **طلبي | Tallaby**). It must match the brand on `tallaby.com`. Never use a store's name.
   - Category: Shopping and retail. Description: "Order updates for stores on Tallaby".
   - Verify the number by SMS or voice call.
3. Wait for the **display name** to be approved (WhatsApp Manager → Phone numbers → Name status).
4. Copy the **Phone number ID** (`WHATSAPP_PHONE_NUMBER_ID`) and the **Messaging account ID** (WhatsApp Business Account ID, `WHATSAPP_WABA_ID`) from API Setup.
5. Set a **two-step verification PIN** (WhatsApp Manager → Phone numbers → the number → Two-step verification): 6 digits. Keep it in the password manager. Then register the number for the Cloud API once. Ask me to run this, or run it with the token from step 4:
   ```
   curl -X POST "https://graph.facebook.com/v27.0/<PHONE_NUMBER_ID>/register" \
     -H "Authorization: Bearer <TOKEN>" -H "Content-Type: application/json" \
     -d '{"messaging_product":"whatsapp","pin":"<6-digit PIN>"}'
   ```
   Only 10 tries per 72 hours, so check the PIN first.
6. Fill in the profile (WhatsApp Manager → the number → Profile): logo, `tallaby.com`, support email, and a "About" line such as «تحديثات طلباتك من متاجر طلبي». Meta requires support contact information.

## 4. A permanent access token (system user)

1. business.facebook.com → **Settings → Users → System users** → **Add**: name `tallaby-whatsapp`, role **Admin**.
2. Select the system user → **Assign assets**: the app `Tallaby WhatsApp` with **Manage app** under **Full control**, and the WhatsApp account with **Manage WhatsApp Business accounts** under **Full control** → **Assign assets**.
3. **Generate token**:
   - App: `Tallaby WhatsApp`
   - Expiry: **Never**
   - Permissions: `whatsapp_business_messaging`, `whatsapp_business_management` and `business_management`

   Copy it once. This is `WHATSAPP_ACCESS_TOKEN`. Treat it like a bank password: put it only in the server env (step 7), never in chat, email, Git or a screenshot.

Tallaby messages only its own WhatsApp account, so **no App Review or Advanced Access is needed**. Those are only for messaging other companies' accounts (Tech Provider), which we are not doing now.

## 5. Payment method

WhatsApp Manager → **Settings → Payment methods** (or Business settings → Billing & payments → WhatsApp) → add a card, currency USD. Without it, only free replies are delivered and order templates fail.

Cost: Meta charges each delivered order message by country. Egypt utility is about **$0.0036** (check the current card at business.whatsapp.com/products/platform-pricing; Meta changes prices only on the first day of a quarter). Replies to a customer who just tapped Confirm or Cancel are free for the first 1,000 a month. Sellers pay nothing for now; Tallaby pays Meta. Put the real Egypt rates into Admin › WhatsApp › Settings so the profit report is right.

## 6. Webhook (delivery statuses and button taps)

1. Choose a long random **verify token**, for example from a password generator, 32+ characters. This is `WHATSAPP_VERIFY_TOKEN`.
2. In the app → **WhatsApp → Configuration → Webhook → Edit**:
   - Callback URL: `https://api.tallaby.com/api/webhooks/whatsapp`
   - Verify token: the value from step 1

   Click **Verify and save**. This works only after the backend with the WhatsApp code is deployed and its env is set (step 7).
3. **Webhook fields → Manage**: subscribe to `messages`, `message_template_status_update`, `template_category_update`, `phone_number_quality_update` and `account_alerts`.
4. Make sure the app is subscribed to the WABA: in API Setup the WABA shows the app. Otherwise ask me to run `POST /<WABA_ID>/subscribed_apps` with the token.

## 7. Server env (backend `tallaby-backend` in Coolify only)

Add these in Coolify → Tallaby → production → `tallaby-backend` → Environment variables, then redeploy:

| Name | Value |
| ---- | ----- |
| `WHATSAPP_ACCESS_TOKEN` | step 4 |
| `WHATSAPP_PHONE_NUMBER_ID` | step 3.4 |
| `WHATSAPP_WABA_ID` | step 3.4 |
| `WHATSAPP_APP_SECRET` | step 2.3 |
| `WHATSAPP_VERIFY_TOKEN` | step 6.1 |
| `WHATSAPP_PAYLOAD_SECRET` | a new random string, 32+ characters (signs the Confirm/Cancel buttons) |
| `WHATSAPP_GRAPH_VERSION` | `v27.0` |
| `WHATSAPP_WORKER` | `1` |

None of them go into the dashboard, ecommerce or admin apps, and none start with `NEXT_PUBLIC_`.

## 8. Templates (approval by Meta)

The message texts are in Tallaby's code (Arabic and English, utility category). You don't write them in Meta.

1. Admin → **WhatsApp → Templates** → **Submit to Meta** sends all of them.
2. Meta usually reviews within minutes, at most 24 hours. Press **Sync statuses**; every row should say **Approved**.
3. If one is **Rejected**, send me the reason shown. Don't edit templates in WhatsApp Manager, or the code and Meta will differ.

## 9. Turn it on

1. Admin → WhatsApp → **Connection** should show the number, its display name and quality **Green**.
2. Admin → WhatsApp → Settings: check the Meta rates. Leave the seller price at **0 (free)**. Choose whether stores start with WhatsApp on (**Stores' default**). Turn **WhatsApp** on.
3. Test with your own store and phone:
   - place an order at checkout with the WhatsApp box ticked
   - get the message, tap **تأكيد الطلب**, and see the order turn Confirmed in the dashboard
   - place another and tap **إلغاء الطلب**
   - ship one with a tracking number
   - reply «إيقاف» and check that no more messages come

## 10. Keep it healthy

- **Quality rating** (Admin › WhatsApp › Connection, or WhatsApp Manager). If it turns yellow or red, many customers are blocking or reporting messages. Tell me, and we'll check which store or message causes it.
- **Templates paused** by Meta show in Admin › Templates; messages for that event fail with code 132015 until Meta unpauses them.
- **Token**: the system-user token doesn't expire. If it is ever revoked or leaked, generate a new one (step 4), replace it in Coolify and redeploy. Old messages fail with code 190 meanwhile and can be retried from Admin › WhatsApp › Failed.
- **Optional:** an Official Business Account (the badge next to the name) can be requested in WhatsApp Manager → the number → Settings once the business is verified and known.
