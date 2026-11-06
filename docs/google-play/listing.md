# Google Play listing — Tallaby Seller

ROADMAP.md F-82 · plan: [`docs/google-play-plan.md`](../google-play-plan.md). Everything here is ready to paste into Play Console.
Features named below are live today (ROADMAP.md §2.1, checked 2026-11-06). **No prices** in the listing: pricing changes with the USD switch (PLAN.md §13.1), and Play listings shouldn't quote prices that can go stale.

## Files

| Play field | File | Size |
| --- | --- | --- |
| App icon | `docs/google-play/assets/icon-512.png` | 512×512 PNG |
| Feature graphic | `docs/google-play/assets/feature-graphic-1024x500.png` | 1024×500 PNG (source: `feature-graphic.source.html`; it uses a live screenshot of the Arabic login page and `apps/dashboard/public/logo/logo.png`) |
| Phone screenshots (2–8) | run `apps/android/scripts/screenshots.mjs` with the demo account | 1080×1920 PNG |

## App details

| Field | Value |
| --- | --- |
| Default language | Arabic – ar |
| App name (≤ 30) | `طلبي للبائعين – Tallaby` (decided 2026-11-06) |
| App name, English translation | `Tallaby Seller` |
| App or game | App |
| Free or paid | Free |
| Category | Business |
| Tags | Business, Productivity, Shopping |
| Email | `omar@tallaby.com` |
| Website | `https://tallaby.com` |
| Privacy policy | `https://tallaby.com/privacy` |
| Account deletion URL | `https://dashboard.tallaby.com/account-deletion` |

## Arabic (default)

**Short description (≤ 80):**

```
أدِر متجرك الإلكتروني من موبايلك: الطلبات والمنتجات والمحفظة والتنبيهات.
```

**Full description (≤ 4000):**

```
طلبي للبائعين هو تطبيق لوحة التحكم الخاصة بمتجرك على طلبي. تابع طلباتك وأضف منتجاتك وأدِر متاجرك من أي مكان.

الطلبات
• كل طلباتك في قائمة واحدة مع مراحل واضحة وتفاصيل كل طلب
• تواصل مع العميل بضغطة عبر واتساب أو مكالمة
• تابع الطلبات غير المكتملة وذكّر العملاء بها
• اشحن مع بوسطة أو مع مناديبك، وتابع التوصيل

المنتجات
• أضف منتجات بصور وخيارات (مقاسات وألوان) وأسعار
• أضف المنتج بالذكاء الاصطناعي من صورة أو ملف، بالعربية والإنجليزية
• استورد منتجاتك من ملف إكسل

المتجر والموقع
• حتى 3 متاجر على الحساب المجاني
• موقع لكل متجر بأكثر من 100 قالب ومحرر سهل
• دومين خاص، كوبونات خصم، تقييمات وأسئلة العملاء

المال والتقارير
• محفظة المتجر وشحن الرصيد وكشف الحساب
• تقارير المبيعات وزيارات المتجر

التنبيهات
• تنبيه على موبايلك مع كل طلب جديد وكل تحديث مهم

ابدأ مجانًا: أنشئ حسابك على tallaby.com أو من التطبيق مباشرة.
```

## English (translation)

**Short description (≤ 80):**

```
Run your online store from your phone: orders, products, wallet and alerts.
```

**Full description (≤ 4000):**

```
Tallaby Seller is the dashboard for your Tallaby store. Follow your orders, add products and manage your stores from anywhere.

Orders
• All your orders in one list, with clear stages and full details
• Reach a customer in one tap on WhatsApp or by phone
• See checkouts that weren't completed and remind those customers
• Ship with Bosta or your own riders, and track delivery

Products
• Add products with photos, options (sizes, colours) and prices
• Add a product with AI from a photo or a file, in Arabic and English
• Import products from an Excel file

Stores and websites
• Up to 3 stores on the free account
• A website for every store, with 100+ templates and an easy editor
• Custom domain, discount coupons, customer reviews and questions

Money and reports
• Store wallet, top-ups and account statements
• Sales reports and store visits

Alerts
• A notification on your phone for every new order and every important update

Start free: create your account on tallaby.com or right in the app.
```

## Release notes (version 1.0.0)

```
<ar>
أول إصدار من تطبيق طلبي للبائعين.
</ar>
<en-US>
First release of the Tallaby Seller app.
</en-US>
```

## App content (Policy → App content)

### App access

"All or some functionality is restricted" → **Add instructions**:

- Name: `Demo seller account`
- Username: *(the demo account email, created in plan step 6)*
- Password: *(its password)*
- Other information:
  ```
  Tallaby Seller is the dashboard for sellers who run an online store on Tallaby.
  Sign in with the email and password above (use "Sign in", not Google).
  The demo account has one store with sample products and orders.
  The app opens in Arabic; switch to English from the language button on the login page or in the menu.
  Account deletion: Settings > Delete my account, or https://dashboard.tallaby.com/account-deletion
  ```

### Ads

No, the app contains no ads.

### Content rating (IARC questionnaire)

- Category: **All other app types** (utility, productivity, communication…).
- Violence, sexuality, language, controlled substances, gambling: **No** to all.
- Users can interact or exchange content: **No** (sellers talk to their own customers outside the app, by WhatsApp or phone).
- Shares the user's current location: **No**.
- Allows purchases of digital goods: **No** (store wallet top-ups are bank or wallet transfers outside Google Play; see Financial features).
- Expected result: **Everyone / PEGI 3**.

### Target audience

18 and over only. The app is not designed for children.

### News app

No.

### Government app

No.

### Financial features

"My app doesn't provide any financial features" is **not** right: the store wallet holds a balance and takes top-ups.
Choose **Other** and describe:
```
Sellers top up a prepaid store wallet by bank or mobile wallet transfer to pay Tallaby's per-order service fees. The app doesn't lend money, hold customer deposits, trade or offer payments to third parties.
```
(Owner to confirm the wording against the live fee model on the day of submission.)

### Health

No health features.

### Data safety

Data is **encrypted in transit**: yes (HTTPS only).
Users can **request deletion**: yes, `https://dashboard.tallaby.com/account-deletion` and in Settings.
Data is **shared** with third parties: answer for each type below. Processors acting for Tallaby (hosting, email, analytics) don't count as sharing under Play's definition; payment and shipping partners the seller turns on do.

| Data type | Collected | Shared | Optional | Purpose |
| --- | --- | --- | --- | --- |
| Name | Yes | No | No | Account management, App functionality |
| Email address | Yes | No | No | Account management, App functionality, Developer communications |
| Phone number | Yes | Yes (shipping partner, when the seller ships with Bosta) | No | App functionality, Account management |
| Address (business address) | Yes | No | Yes | App functionality |
| Photos (product photos, logos) | Yes | No | Yes | App functionality |
| Files and docs (seller documents) | Yes | No | Yes | App functionality, Fraud prevention, security and compliance |
| Purchase history (store orders, wallet top-ups) | Yes | No | No | App functionality, Analytics |
| Financial info: other (payout account details) | Yes | No | Yes | App functionality |
| App interactions | Yes | No | No | Analytics |
| Crash logs / diagnostics | Yes | No | No | App functionality |
| Device or other IDs (push subscription) | Yes | No | Yes | App functionality (notifications) |

Not collected: precise or approximate location, contacts, messages, audio, video, health, calendar, web history, installed apps.

> **Owner check:** the table follows what the dashboard stores today (sellers, documents, payout details, push subscriptions, GA4). Confirm it with whoever handles privacy before submitting; the answers are a legal statement.

## Store settings

- Countries: Egypt first (add others later).
- Contact details: email `omar@tallaby.com`, website `https://tallaby.com`, phone optional (the support WhatsApp number if you want it public).
