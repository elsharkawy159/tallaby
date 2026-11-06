# Launch test checklist

**126 checks. About 2 hours. The 10 most important have a ⭐.** If you only have 30 minutes, do the ⭐ checks.

Covers the 76 commits not pushed yet. Almost none of these screens has been opened in a browser, so expect some bugs. Write down what breaks and send it to Claude.

Do the parts in order. **Part A must come first**, because Part B changes staging for good.

## Setup

**Never test payments or run the USD switch on production.** Each app's `.env` points at production, so starting an app the normal way uses real sellers and real money. Always use the steps below.

**1. Get these first:**
- The staging service role key: Supabase › staging project › Project Settings › API. It isn't saved in the repo. Without it, the customer's transfer screenshot and the receipt picture in Admin won't work.
- A staging Admin login. I don't know which account is an admin on staging.

**2. Open 4 PowerShell terminals at the repo root.** Paste this into each one. Put your staging key on the marked line.

```powershell
Get-Content packages/db/.env | ForEach-Object {
  if ($_ -match '^\s*([A-Z_0-9]+)\s*=\s*[''"]?(.*?)[''"]?\s*$') { Set-Item "env:$($Matches[1])" $Matches[2] }
}
"PROD_SUPABASE_SERVICE_ROLE_KEY","STOREFRONT_VERCEL_TOKEN","STOREFRONT_VERCEL_PROJECT_ID",
"STRIPE_SECRET_KEY","STRIPE_WEBHOOK_SECRET","KASHIER_SECRET_KEY","KASHIER_PAYMENT_API_KEY",
"PAYMOB_SECRET_KEY","PAYMOB_API_KEY","PAYMOB_HMAC_SECRET","META_CAPI_TOKEN",
"META_CONVERSIONS_API_ACCESS_TOKEN","META_PIXEL_ID","NEXT_PUBLIC_META_PIXEL_ID",
"NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN","POSTHOG_PERSONAL_API_KEY","STORE_VIEWS_GTM_ID" |
  ForEach-Object { Set-Item "env:$_" "disabled" }
$env:SUPABASE_SERVICE_ROLE_KEY = "PASTE_STAGING_KEY_HERE"
$env:KASHIER_MODE = "test"
$env:INTERNAL_API_SECRET = "local-test"; $env:ORDER_ACCESS_SECRET = "local-test"
$env:CRON_SECRET = "local-test"; $env:REVALIDATE_SECRET = "local-test"
$env:BACKEND_API_URL = "http://localhost:4000"; $env:NEXT_PUBLIC_ROOT_DOMAIN = "localhost:3000"
$env:ECOMMERCE_URL = "http://localhost:3000"; $env:ADMIN_URL = "http://localhost:3001"
$env:DASHBOARD_URL = "http://localhost:3002"
$env:NEXT_PUBLIC_SUPABASE_PROJECT_ID
```

- The last line must print `cxqjrwjianxskhzmrkla` (staging). **If it prints `sakwqwocbccpyrmwjowq`, that is production. Stop.**
- Use `"disabled"` as shown. In PowerShell an empty value deletes the setting, and the app then reads the production secret from `.env` again.

**3. Start one app in each terminal:**

| Terminal | Run this first | Then run | Opens at |
| --- | --- | --- | --- |
| Store | `$env:NEXT_PUBLIC_SITE_URL = "http://localhost:3000"` | `pnpm --filter ecommerce dev` | `http://YOURSTORE.localhost:3000` |
| Admin | `$env:NEXT_PUBLIC_SITE_URL = "http://localhost:3001"` | `pnpm --filter admin dev` | `http://localhost:3001` |
| Dashboard | `$env:NEXT_PUBLIC_SITE_URL = "http://localhost:3002"` | `pnpm --filter dashboard dev` | `http://localhost:3002` |
| Backend (emails) | nothing | `pnpm --filter backend dev` | no page |

Use these commands, not `pnpm dev`. Use Chrome. The first open of each page is slow.

**Real things that still happen:**
- **Real emails go out.** The backend uses the real email key. Use only your own email addresses as customers on the test stores.
- **AI checks cost a little real money,** because they use the real AI key.
- **No daily jobs run locally.** Queued campaigns wait until you run the command in A10.

**Test data on staging:**
- **Seller A:** one published store, at least 3 products (one with variants), delivery zones for Cairo and Giza only, cash on delivery on, InstaPay on under Payment methods (طرق الدفع), and one coupon. Use a seller with no running free trial.
- **Seller B:** a second published store, with one product that has the same title as one of Seller A's.
- **Customer:** one normal window signed in with an email that isn't a seller's, and one incognito window as a guest.

**Fake money and fake receipts are fine on staging.** Don't send a real transfer.

**Use realistic test orders.** Tallaby treats some orders as fake and takes no fee until delivery. This is on purpose, but it looks like a bug. To see the fee taken straight away:
- Don't use "test", "asd" or similar in the name or address.
- Don't use the seller's own phone or email.
- Don't use a phone like 01000000000.
- Don't repeat the same phone and same items within 2 hours.

---

# Part A: Before the switch

Staging stays in EGP. Screens show today's fee and plan.

## A1. Checkout: things that lose orders

Add a product to the cart on Seller A's store as a guest, then open checkout.

- [ ] The page shows one form: name, mobile, country (Egypt only), address, note. No step for picking a city.
- [ ] ⭐ Type `مدينة نصر، القاهرة`: no governorate picker appears, and the Cairo delivery price shows.
- [ ] Type only `شارع الجيزة`: the governorate picker (المحافظة) appears, because this isn't really Giza. Pick one and the price updates.
- [ ] Choose a governorate with no zone, such as Aswan: you see a clear message or Tallaby's rate, never a free delivery by mistake.
- [ ] Tap the location icon in the address field and press Allow: a loading icon shows, then the address fills in.
- [ ] Block location for the site, reset the page, tap the icon: you see "الوصول للموقع مقفول، اكتب عنوانك." and can still type.
- [ ] Mobile `123` shows the phone error. Empty name or address blocks the order and shows an error.
- [ ] Press + and − on an item: the count, totals and delivery all update.
- [ ] Press + past the stock: you see "الكمية دي مش متوفرة." Try the same on a variant with low stock.
- [ ] As a guest, the coupon box says to log in (سجل الدخول لاستخدام كود الكوبون).
- [ ] Signed in, apply the coupon: the discount shows, and the total is right.
- [ ] Lower the count until a minimum-order coupon no longer fits: you see "الكوبون مابقاش ينفع مع الطلب ده، فاتشال." and it's removed.
- [ ] ⭐ Place a cash on delivery order as a guest: the thank-you page opens, with no error.

## A2. Saved details

- [ ] Signed in, place an order, then start a new one: name, mobile and address are already filled in.
- [ ] Press Edit Address (تعديل العنوان): your saved addresses open. Pick another and the price follows it.
- [ ] Place two orders with the same address: Edit Address lists it once, not twice.
- [ ] Change an address an old order used, then open the old order: it still shows the old address.

## A3. Transfer with a screenshot

- [ ] Choose InstaPay at checkout: the page shows the exact amount, order number and the store's details.
- [ ] Attach a screenshot (أرفق صورة الإيصال), then press تم التحويل: you see the screenshot was sent.
- [ ] Open that order on the dashboard: the seller can see the screenshot.

## A4. The order reaches the seller, and the fee

- [ ] ⭐ On the dashboard, Orders (الطلبات) shows the order with the right customer, address, products, delivery and total. The bell shows it too.
- [ ] Product stock went down by the right amount.
- [ ] ⭐ Wallet (المحفظة) shows one EGP 5 fee for that order, not two. Refresh, and it stays one.
- [ ] Mark an order returned: the dialog has "Put the items back in stock", on by default. Stock goes back up once.

## A5. Wallet and top-ups

- [ ] Wallet › Balance & top-ups (الرصيد وشحن المحفظة): amounts are in EGP, limits 100 to 20,000.
- [ ] Press اشحن الآن: only InstaPay and Vodafone Cash can be chosen. Card (بطاقة خصم أو ائتمان) shows Soon (قريبًا) and can't be selected.
- [ ] The next step shows InstaPay 01152372358 or Vodafone Cash 01003272830, with Copy buttons that work.
- [ ] You can't send without a receipt picture. Send one: "تم إرسال طلب الشحن" shows, and the balance doesn't change yet.
- [ ] ⭐ In Admin › Store top-ups, the receipt picture opens. Press Approve and credit: the seller's balance goes up once, and the bell says so. Reject another one: the balance doesn't change.

## A6. Manual orders and order link

- [ ] Orders › Create order (إنشاء طلب) opens. It isn't in the sidebar; the button is on the Orders page.
- [ ] Create it: the order appears as Confirmed, stock goes down, and the fee is taken once.
- [ ] Add a discount: it lowers the goods only, not shipping.
- [ ] Choose "اتدفع لي بالفعل": nothing is due on delivery.
- [ ] Use a blocked phone: it's refused with "انت حاظر الرقم ده". An address outside your zones shows "مناطق الشحن بتاعتك مش بتغطي العنوان ده."
- [ ] Press إنشاء وإرسال رابط: Copy link and Send on WhatsApp appear. No fee is taken yet.
- [ ] Open the link in incognito and confirm: the order is confirmed, the fee is taken once. Open the link again: no second fee.

## A7. Cross-sell

- [ ] Edit a product › "بيتشتري مع المنتج ده": add another product at 10% off.
- [ ] The offer shows under the buy box on the store (بيتشتري مع بعض) and in the cart sheet.
- [ ] Add it, then go to checkout: the summary shows the discount.
- [ ] ⭐ Place the order: the seller's order total equals what the customer saw. Only one unit per main unit gets the discount.
- [ ] Add a coupon too: it applies on the discounted price, and checkout and the order agree.
- [ ] Turn the offer off with the item already in the cart: full price shows before ordering.
- [ ] Store settings › صفحة الطلب والشكر: turn off "عروض المنتجات المكملة". Offers disappear from the store.

## A8. Stock and same titles

- [ ] Product form: turn off Track stock (متابعة المخزون). The list shows Unlimited (غير محدود).
- [ ] Order more than the old quantity of that product: it goes through, and the quantity doesn't change.
- [ ] Seller A: make two products with the same title. The second link gets `-2`. Each link opens its own product.
- [ ] Seller A's and Seller B's same-title products each open on their own store, not on the store's home page.

## A9. Store pages: policies, redirects, SEO

- [ ] With no policy text, `/privacy` on the store shows a general policy with the store's name.
- [ ] Settings › Policies (سياسة الخصوصية): type text and save. `/privacy` now shows it. Do the same for returns and shipping.
- [ ] Visit `/terms`, `/returns`, `/shipping`, `/contact`, `/about`, `/faq`, and a made-up path. You stay on the store every time, never tallaby.com. "Powered by" may still link to Tallaby.
- [ ] Right-click a product page › View page source, search `canonical`: it shows the store's own address, not tallaby.com.
- [ ] Open `/sitemap.xml`: it lists products, `/products`, and categories, all on the store's address. Both same-title products are in it.

## A10. Pending carts and campaign emails

- [ ] As a guest, add items and leave. On the dashboard, Pending carts (سلات معلّقة) shows the cart, item count, value and زائر for the name.
- [ ] Reach checkout and type a phone: WhatsApp and Call appear on that row.
- [ ] Place the order: the cart leaves the list. Another store's carts don't show here.
- [ ] Marketing › Email campaigns (حملات الإيميل): a first-time seller sees three steps and one button.
- [ ] Write a subject and message: about a second later, the preview shows your email. Sender and subject show above it.
- [ ] Stop the backend terminal and keep typing: the last preview stays, with Try again (جرّب تاني). Save still works. Start it again.
- [ ] Send a test to yourself: it arrives, with the store's name.
- [ ] Send the campaign, then run this in any terminal: `Invoke-WebRequest -UseBasicParsing http://localhost:3000/api/cron/email-campaigns -Headers @{ Authorization = "Bearer local-test" }`. Your email arrives.

## A11. Dashboard

- [ ] Sidebar: no الحملات التسويقية, no زيارات المتجر, no Create order, no مسح المرتجعات. Reports has no Campaigns tab.
- [ ] `/marketing` still opens by its address. `/reports/campaigns` shows not found.
- [ ] A seller with no orders: the home button "Promote your products" opens the shareable catalog.
- [ ] Apps (التطبيقات والتكاملات): Installed and Explore tabs work, categories filter, and prices show on the cards.
- [ ] Try to install Order notifications (إشعارات الطلبات): it doesn't install before the switch. You may see "ستتوفر بعد تحويل المحفظة إلى الدولار".
- [ ] On the SMS card, which shows Soon, press اطلبها: it changes to تم الطلب, and pressing again doesn't send a second request.
- [ ] Admin › App requests shows it under Waiting, and the Admin bell shows it. Press Enable: the seller's card says مفعّلة. No SMS is sent.
- [ ] Shipping settings: the board shows every governorate and "توصّل إلى X من Y محافظة". Gaps are dashed.
- [ ] Press صف مناطق التوصيل, type `القاهرة 60 جنيه، الإسكندرية 80`: zones are suggested. Nothing saves until you press save.
- [ ] Open home, Products and Orders twice each: the second open is quick. Local mode is slower than live, so judge speed again after deploy.
- [ ] AI Store Builder is off by default: `/ai-builder` shows not found.
- [ ] Optional: stop the dashboard, run `$env:STORE_BUILDER_AI_ENABLED = "1"`, start it again. `/ai-builder` opens "ابني متجرك بالذكاء الاصطناعي", and a run shows a review screen. Close and reopen: your chat is still there.

---

# Part B: After the switch on staging

**Not approved yet. The owner must say yes first.** The switch can't be undone, on staging too: every staging wallet moves to USD for good. Part A can't be repeated afterwards.

**To run it,** finish Part A, then tell Claude: "I approve the USD switch on staging." Claude fetches a rate, shows you the dry run in Admin › Billing, and runs it. Don't run it yourself.

## B1. Right after the switch

- [ ] Admin › Billing shows the switch as live. Admin › Store wallets shows no ledger mismatches.
- [ ] Dashboard header, home and Wallet show `$`. Old wallet lines keep their EGP label. Help and the product form show the new fee.
- [ ] Sign up a brand-new seller (Seller C), finish setup: no welcome gift, balance $0. The "your store is ready" email arrives.

## B2. Fee and money

- [ ] ⭐ Seller A, new store order: the wallet takes $0.03, once. The order total is still in EGP.
- [ ] A fee on a $0 wallet takes the balance below zero and the order still goes through.
- [ ] Fall to −$1 or lower: the negative-balance pop-up shows, in `$`.

## B3. Top-ups in USD

- [ ] Limits say 5 to 1,000 dollars. `$4` and `$1,001` show errors.
- [ ] The summary shows the rate, and "ستدفع" in EGP.
- [ ] Admin shows the USD credit and the EGP paid. Approve: the balance rises by the exact USD amount, once.

## B4. $5 lock (Seller C, no top-up)

- [ ] ⭐ Place an order on Seller C's store: it goes through. Home shows "اشحن 5$ عشان تشوف طلباتك". Orders, Customers and Pending carts show blurred rows with the top-up message.
- [ ] Orders in the sidebar show ⚠️. The bell still announces the order.
- [ ] Send a top-up, don't approve yet: the message changes to "طلب الشحن قيد المراجعة". Still locked.
- [ ] Approve in Admin: everything opens, and the earlier order is there, with its fee.
- [ ] Another new seller: Admin › seller page › Give Pro for free. Orders are open with no top-up. Move to Free: locked again.

## B5. Pro

- [ ] Settings › Plan & usage (الباقة والاستخدام), wallet under $29: it says what you have and offers a top-up instead of the upgrade.
- [ ] ⭐ Top up $30. Press الانتقال إلى Pro and confirm "Pay $29": the wallet drops by $29 once, and it says you're on Pro. Next order takes no fee.
- [ ] Press إلغاء Pro: it says you keep Pro until a date. No refund. Press الاحتفاظ بـPro: renewal is back on.

## B6. AI credits

- [ ] The plan page shows 100 monthly credits on Free.
- [ ] Add a product with AI: credits left show beside the button, and one use takes 1 credit.
- [ ] Press the buy button (اشترِ بـ$1) on the plan page: $1 leaves the wallet, 100 credits are added and shown as not expiring.

## B7. Order notifications app

- [ ] Apps › إشعارات الطلبات shows the price per order. Install on Seller A's store: the install itself costs nothing.
- [ ] As a guest on that store: the optional Email field (الإيميل (اختياري)) shows. Empty still lets you order. `abc` shows an error.
- [ ] Signed in with a real email: no Email field. On a store without the app: no Email field.
- [ ] Guest order with your email: the confirmation email arrives under the store's name.
- [ ] ⭐ The wallet shows one "Order notifications" line for $0.01. Mark that order shipped and delivered: two more emails, no more charges.
- [ ] Order with the field empty, as a guest: no email and no $0.01.
- [ ] If a card payment is available: start a card order and close the payment page. No $0.01 charge, and no fee.
- [ ] Remove the app: no more order emails and no more charges.

## B8. Automatic emails paused

- [ ] Order on a store without the app: the customer gets no email, and the seller gets no new-order email. The bell and push still work.
- [ ] Approve a top-up: no email to the seller, but the bell shows it in `$`.
- [ ] Create a new store: "your store is ready" still arrives.
- [ ] Email campaigns: the automatic win-back card says it's paused and points to a campaign.

## B9. Campaign email limits

- [ ] Free: "باقي 500 إيميل حملات" shows. Pro: 10,000.
- [ ] Press the buy link (اشتري 1,000 زيادة بـ $1.50) and confirm: the wallet drops $1.50 once, and the count goes up by 1,000.
- [ ] Send a campaign: the count goes down by the number of recipients. A test send doesn't change it.
- [ ] Seller with no top-up: sending is blocked with "اشحن محفظتك بـ 5 دولار على الأقل". A test send still works.

---

# Phone and Arabic pass

A real iPhone can't open `*.localhost`, so store pages won't open on it locally. In Chrome, press F12, turn on the phone view, and pick iPhone at 390 wide. Keep the screens in Arabic. Do the "real iPhone" checks once you have a way to open the site on it (see the end).

**Every screen: nothing scrolls sideways, buttons fit, and text reads right to left.**

- [ ] Checkout form and order summary, with + and − easy to tap.
- [ ] Wallet top-up: the bottom bar stays visible, and all three steps fit with Next on screen.
- [ ] Products list: Import and Add side by side, and the filters on one row.
- [ ] Product form: variants show as cards. Open one, and stock stays visible. Tapping a card doesn't change the default.
- [ ] Create order page, all sections.
- [ ] Email campaigns: Edit and Preview buttons switch views. The preview is readable.
- [ ] Pending carts, Shipping board, Apps page, Plan page.
- [ ] $5 lock message over the blurred rows.
- [ ] Phone numbers and `$` amounts read the right way round inside Arabic text, on the plan page and wallet.
- [ ] **Real iPhone:** tapping a field doesn't zoom the page, in the product form and checkout.
- [ ] **Real iPhone:** the + button adds a variant value on the iPhone keyboard.
- [ ] **Real iPhone:** the location button asks for permission and fills in the address. This needs an https address.

---

# Screens nobody has checked yet

The reports say these were never seen in a browser, and the checks above don't cover them. Some need Part B, marked (B).

- [ ] Orders list: filters, paging and the count match.
- [ ] Customers page: paging, and a customer's order count is right.
- [ ] Moving an order back on its way with too little stock: the dialog offers "Add what's needed and continue", and stock is right after.
- [ ] Product pickers in the Shareable catalog and store editor show real titles, not blanks.
- [ ] (B) Admin: sellers list, seller page, store page, person card and home tiles show the right currency.
- [ ] (B) Admin › AI usage shows USD with estimated EGP.

---

# What I couldn't confirm

**About the setup:**
- **The setup was not run end to end.** I tested that the first lines read staging correctly, but I didn't start the apps, to avoid changing files. Tell Claude if a step fails.
- **A real iPhone has no confirmed route.** The store needs a `*.localhost` address, and the location button needs https. A staging preview deploy or a tunnel may solve it, but neither is set up, and you want to test before pushing.
- **Dashboard product photos may not load locally.** An older report says the dashboard's image list doesn't include staging. I didn't confirm it's still true. If so, it's not a bug.
- **Sign-up confirmation links:** I don't know where staging's emails send you. If a link goes to a live address, ask Claude to confirm the account instead.

**Checks that may not be possible:**
- **Abandoned card order (B7).** Setup turns off the Kashier keys, because I can't tell if the ones in `.env` are test keys. It needs a test gateway. Otherwise skip it and write "not tested".
- **Campaign over the limit.** It should cut the list, newest customers first, but this needs over 500 customers. Tests cover it, not a browser.
- **The 48-hour link expiry.** Tests cover it. It can't be seen in a 2-hour test.
- **Pro renewal and the 3 days' grace.** These run from a daily job over a month. Tests cover them.

**For the owner to decide or know:**
- **Removed products go to the store's home.** This is by design (your choice, 2026-11-03), so it isn't a redirect bug.
- **The fee is taken on orders a locked seller can't see,** and a shipped-order email can still reach their customer. Your rule, but check you're happy with it during B4.
- **Location button:** it uses a free public map service (Nominatim). Its limits weren't checked for launch traffic.

**Docs that disagree with the code:**
- **`docs/usd-switch-checklist.md` step 9** says to test a Kashier top-up, but the code keeps card as Soon. I followed the code.
- **The same checklist, step 1,** doesn't list migrations `0144`, `0145` and `0146`. They're on staging only and production needs them. The log says outright that `0145` must land before deploy.
- **The 22 template removal is not committed.** Those deletions are uncommitted work in the repo, so they aren't part of this list, and they won't go out unless someone commits them.
