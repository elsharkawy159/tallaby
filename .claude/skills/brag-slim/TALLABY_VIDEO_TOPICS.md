# Tallaby video topics (sellers only)

The topic bank for every Tallaby (طلبي) marketing video. **Audience for now: sellers only** (Egyptian small and medium businesses and individuals who sell on Facebook, Instagram and WhatsApp). No shopper-facing topics until the owner says so.

Use it together with [`TALLABY_VIDEO_RULES.md`](TALLABY_VIDEO_RULES.md) (format, voiceover, brand, QA). The rules win on how the video looks and sounds; this file decides **what the video is about**.

---

## 0. Quick start: `/brag-slim` with only a count (owner, 2026-10-27)

The owner runs **`/brag-slim`** and says only how many videos they want (`/brag-slim 3`, "اعمل 4 فيديوهات", "make 2 videos"), plus any options they care about. Everything else has a default, so never ask for the defaults below.

**Defaults (apply without being told):**

| Setting | Default |
|---|---|
| Count | **1** video |
| Format | **Reel: 9:16 vertical, 1080×1920, 30 fps**, 25–30 s (tutorials up to 35 s) |
| Screens | **Mobile screens**: the real dashboard and store in their mobile layout, inside the spec phone mockup (rules §5). No laptop unless asked. |
| Voiceover | **Egyptian Arabic, smooth and calm**, exactly per rules §6 and §6.1 (Tamer, eleven_v4, default settings, no tags, chunked). Captions burned in. |
| Music and sound | Original music and quiet SFX per rules §7 |
| Topics | Picked by §1 below: **every new feature not yet covered gets a video**, the other slots come from the pillars |
| Formats | A mix across the batch (§12): for example one "Feature in 20 seconds", one tutorial, one before/after. No two videos in a batch share a format when N ≥ 3. |
| Workflow | The full `/brag` workflow for every video (rules §5.1): `brag-plan.md`, `composition-brief.md`, `hyperframes check`, `qa.md` |
| Output | `Marketing Videos/brag-output-<timestamp>/01-<slug>/`, `02-<slug>/`, … each with `brag.mp4`, `brag.jpg`, `share-copy.txt`, `content.md` |
| Posting | Files only; the daily Buffer job posts from `Marketing Videos/`. Schedule on Buffer only when asked. |

**Options the owner may add (flags or plain words, Arabic or English):**

| Option | Example | Effect |
|---|---|---|
| Count | `3`, "تلات فيديوهات" | number of videos |
| Topic(s) | `F-01`, "about coupons", "عن الشحن" | use these topics (closest IDs below) instead of auto-picking; new features are still added unless the owner says "only" |
| Type | "tutorials", "ads", "before/after", "شرح" | the format for all videos, or per video |
| Duration | `--duration 20`, "قصير" | target length (still 20–35 s for Reels) |
| Format | "landscape", "square" | overrides 9:16 for this run only |
| Voice | "female voice", "no voice" | Fatima for female (rules §6); no voice only when the owner asks |
| Season | "Ramadan", "White Friday" | seasonal angle from §13 |
| Post | "post them", "schedule on Buffer" | schedule on Buffer after QA |

**Run order for a batch of N:**

1. Refresh §3 from the code and plan (§2). This is required on every run, not weekly.
2. Pick the N topics (§1), then tell the owner the list in one short table (ID, title, format, hook) and start straight away; don't wait for approval unless something is unclear.
3. Build each video with the full `/brag` workflow and the rules. Videos may be built in parallel subagents, each briefed with both files, but **generate the voiceovers one at a time** (ElevenLabs rate limits break parallel takes).
4. Run the rules §10 QA on every video; fix or re-render failures before delivering.
5. Add one row per video to §15 (and update §3 coverage), then give the owner the folder paths and one line per video.

## 1. How to pick today's topic

1. **The user named a topic?** Use it. Find the closest topic below for its pains, hooks and screens.
2. **New features always get a video.** Every §3 topic that is **not yet covered** goes into the batch first, newest first, one video each. "Covered" means it has a §15 row for a delivered video that was not pulled or rejected. When N ≥ 2, keep at least one slot for a non-new topic so the batch stays varied; new features that don't fit go first in the next run. When N = 1 and an uncovered new feature exists, the video is about it.
3. **Fill the other slots in this order:**
   1. Any remaining uncovered topic in **§3 New features** (newest first).
   2. Otherwise, a ✅ topic from §4–§12 whose pillar was **not used in the last 3 videos** and whose ID was **not used in the last 30 days**.
   3. If a season in §13 starts within the next 14 days, prefer its seasonal angle.
   4. Within one batch, never repeat a topic ID or a pillar unless N is larger than the number of pillars with usable topics.
4. **Check what was used:** read §15 (Used topics log). On the daily automated run, also read the last 30 days of Buffer posts.
5. **Check the status:**
   - ✅ **Live:** usable as is (still check the screen in the code before you show it).
   - 🟡 **Check first:** built, but launch or a part is not confirmed. Before using it, check `PLAN.md` §22/§23 and the code. If it's not confirmed live, skip it, or show only the confirmed part.
   - ⛔ **Planned:** never make a video about it.
6. **Re-check facts every time.** Features change. If a topic's facts no longer match the code or `MARKETING_PROJECT.md`, fix the topic here before making the video.
7. **After the video,** add a row to §15, update the topic's **Covered** line in §3, and commit the change.

**Each topic gives you:** the seller's pain, 2–3 hooks (Egyptian Arabic, ready to use or adapt), what to show (real screens), and the status. The closing line follows the rules ("Closing lines"): it changes every video and ends on **tallaby.com** ("طلبي دوت كوم").

## 2. Keeping this file up to date (new features)

**At the start of every run** (every `/brag-slim` or `/brag` call and every daily run), before picking topics:

1. Read `PLAN.md` §22 (checklist) and the newest entries in §23 (log), plus `git log origin/main --since="14 days ago" --oneline`.
2. For each new **seller-facing** feature that is live on production and has no topic yet, add a topic to **§3 New features** with today's date, in the same format, with `**Covered:** not yet`. Tell the owner which new features you added.
3. When a §3 topic has been covered and is older than 30 days, move it to its pillar section below.
4. When a 🟡 topic is confirmed live, change it to ✅. When a feature is removed, delete its topic.
5. Never add a topic for something that is only Planned.

---

## 3. New features (post these first)

Every live seller-facing feature added since the last run gets a topic here, and every batch makes a video for each topic marked `**Covered:** not yet` (§1). Newest at the top.

### N-05 · Mobile menu + sticky header on every store 🆕 (live 2026-10-27) ✅
- **Pain:** on phones the store header squeezed every menu link into two wrapped rows above the products.
- **Hooks:** "منيو متجرك على الموبايل، لسه زحمة كده؟" / "زرار منيو واحد… والأقسام كلها قدام الزبون."
- **Show:** before (two rows of links) → burger first in the bar (right side in Arabic) → sheet from the right with the store name, its menu links (48 px rows) and the account icon → scrolling down hides the header, scrolling up brings it back. Every existing store got both at once (`6e771dbb`, `PLAN.md` §23 2026-10-27). The public template preview (`/template-preview/*`) does not draw the new chrome, so build the after state in the demo page or use a demo store.
- **Status:** ✅ (deployed with `6e771dbb`).
- **Covered:** 2026-10-27 (reel, files only).

### N-04 · Ship your orders with your own Bosta account 🆕 (live 2026-10-26) ✅
- **Pain:** copying every order's name, phone and address into the courier's site by hand, order after order.
- **Hooks:** "لسه بتنقل عنوان كل أوردر لشركة الشحن بإيدك؟" / "أكّد الأوردر… والشحنة تتعمل لوحدها." / "أوردرات متجرك توصل لبوسطة بضغطة واحدة."
- **Show:** Store › Apps › Bosta wizard (الحساب ← مفتاح API ← التحقق ← التفضيلات, key masked ••••1234, "تم الربط. وجدنا مكانَي استلام."); Shipping › "شريك التوصيل" with "تلقائيًا عند تأكيد الطلب"; order dialog "شحن الطلب #… مع بوسطة" (matched area, COD, package size); bulk "اشحن 12 طلبًا مع بوسطة" + "اطبع 12 بوليصة" (one PDF, up to 50); "شحنة بوسطة" card with tracking number and status (تم الاستلام → خرج للتوصيل → تم التوصيل). Needs the seller's own Bosta business account; customers pay the store's own shipping prices, Bosta's charges are between the seller and Bosta, طلبي's fee stays 5 EGP per successful order. Never: Bosta's logo or red, "شريك رسمي", discounts, pickup scheduling, customer tracking page, delivery-time promises.
- **Status:** ✅ (BS-01…BS-13 merged 2026-10-26, `0106` on production).
- **Covered:** 2026-10-27 (Bosta reel with voiceover, scheduled for 2026-10-28).

### N-01 · Build your product page yourself 🆕 (live 2026-10-24) ✅
- **Pain:** every product page looks the same, a boring template the seller can't change.
- **Hooks:** "صفحة المنتج بتاعتك… إنت اللي بتصممها." / "عايز صفحة منتج شكلها زي البراندات الكبيرة؟" / "غيّر شكل صفحة المنتج في دقيقة."
- **Show:** website editor → product page → drag in the gallery, price, variants, buy box, reviews and related products; switch the preview product; publish. Before/after of the same product.
- **Status:** ✅ (`0100`–`0102` applied on production 2026-10-24).
- **Covered:** 2026-10-24 (reel 01).

### N-02 · Seller notifications ✅
- **Pain:** missing a new order, a customer question or a review because you didn't check the dashboard.
- **Hooks:** "أوردر جديد؟ هتعرف في ساعتها." / "متفوّتش سؤال زبون تاني."
- **Show:** the notification bell lighting up with a new order, a product question and a new review (fictional data).
- **Status:** ✅ (`0098` on production).
- **Covered:** 2026-10-27 (batch video 01, files only).

### N-03 · Two new hero carousels (photo-only and with text) ✅
- **Pain:** a static banner nobody looks at.
- **Hooks:** "أول حاجة الزبون بيشوفها في متجرك… خليها تتحرك." / "بانر متحرك لمتجرك من غير مصمم."
- **Show:** Add › Sections › Hero → insert the carousel → swap in your photos → it slides on mobile.
- **Status:** ✅ (`0094`, `0096` on production).
- **Covered:** 2026-10-25 (remake 2, scheduled for 2026-10-26).

---

## 4. Pillar A: your own store, your own link

### A-01 · From "ابعتلي على الخاص" to a real store link ✅
- **Pain:** orders scattered across DMs; customers ask for the price again and again.
- **Hooks:** "لسه بتقول: السعر على الخاص؟" / "اللينك اللي في البايو بتاعك… لازم يبيع لوحده."
- **Show:** a messy DM thread morphs into a clean store at `nour.tallaby.com` on a phone; a customer adds to cart.
- **Status:** ✅

### A-02 · Your store at yourname.tallaby.com ✅
- **Pain:** a long, ugly link, or no link at all.
- **Hooks:** "اسم متجرك + tallaby.com… وخلاص." / "لينك متجرك جاهز تحطه في البايو."
- **Show:** typing the store name and the subdomain checker turning green; the store opening on that address.
- **Status:** ✅

### A-03 · Use your own domain (yourbrand.com) ✅
- **Pain:** "I want to look like a real brand, not a page."
- **Hooks:** "دومين باسم البراند بتاعك… على متجرك في طلبي." / "شكلك براند كبير من أول لينك."
- **Show:** Website › Domain → add the domain → DNS instructions → store live on the custom domain (fictional brand). Custom domains are for the main store (extra stores' custom domains are not live yet).
- **Status:** ✅

### A-04 · Up to 3 stores on one account ✅
- **Pain:** a seller with two brands (for example clothes and accessories) juggling two accounts.
- **Hooks:** "عندك أكتر من براند؟ اعمل لكل واحد متجر." / "3 متاجر… من حساب واحد."
- **Show:** the Stores page → create a second store → the store switcher in the sidebar.
- **Status:** ✅ (Free plan allows 3 stores).

### A-05 · Website live switch: publish when you're ready ✅
- **Pain:** fear of customers seeing a half-finished store.
- **Hooks:** "جهّز متجرك براحتك… ومحدش يشوفه غير لما تقول." / "زرار واحد… ومتجرك أونلاين."
- **Show:** builder drafts → preview → Publish → the "Website live" switch.
- **Status:** ✅

### A-06 · Sign up and get your store fast 🟡
- **Pain:** "Opening an online store is complicated."
- **Hooks:** "متجرك أونلاين النهارده… مش الشهر الجاي."
- **Show:** the signup flow → dashboard → store ready.
- **Status:** 🟡 the new quick signup's manual check is still open in `PLAN.md` (P2-03). Don't claim "in under a minute" until it's confirmed.

### A-07 · Your store works great on mobile ✅
- **Pain:** most Egyptian customers shop on their phone; a desktop-only site loses them.
- **Hooks:** "زباينك على الموبايل… ومتجرك لازم يبقى كده كمان."
- **Show:** the same store on phone and desktop; the editor's per-device styles.
- **Status:** ✅

### A-08 · Arabic-first, made for Egypt ✅
- **Pain:** foreign platforms that feel English-first and don't fit Egyptian buying habits.
- **Hooks:** "منصة مصرية… بالعربي… لبياعين مصر." / "مش محتاج تترجم حاجة."
- **Show:** RTL store, Arabic dashboard, prices in `ج.م`, cash on delivery at checkout.
- **Status:** ✅

## 5. Pillar B: design: templates and the website builder

### B-01 · 100+ ready-made templates ✅
- **Pain:** "I can't afford a designer."
- **Hooks:** "أكتر من 100 تصميم جاهز… اختار وابدأ." / "متجرك شكله احترافي من غير مصمم."
- **Show:** a fast scroll through the template gallery (fashion, electronics, beauty, food, furniture, kids, jewelry, sports, automotive) → apply one.
- **Status:** ✅ (111 templates in code; say "أكتر من 100" only after counting the DB templates).

### B-02 · A template for your exact category ✅
- **Pain:** generic templates that don't fit the product.
- **Hooks:** "بتبيع هدوم؟ في تصميم معمول ليك." / "مطعم؟ إكسسوارات؟ لعب أطفال؟ لكل واحد شكله."
- **Show:** 3 quick category cuts, each with its matching template and demo products. Make one video per category (fashion, beauty, food, kids, electronics, home…), each a separate topic ID such as B-02-fashion.
- **Status:** ✅

### B-03 · Drag and drop builder: no code ✅
- **Pain:** "I'm not technical."
- **Hooks:** "لو بتعرف تستخدم الموبايل… هتعرف تصمم متجرك." / "اسحب… سيب… خلاص."
- **Show:** dragging a section from the Add panel onto the page; moving elements; the Layers panel.
- **Status:** ✅

### B-04 · Click anything and change it ✅
- **Pain:** templates where you can only change the text.
- **Hooks:** "كل حاجة في متجرك تتغير… حتى الزرار ده." / "اضغط على أي حاجة… وغيّرها."
- **Show:** selecting a title, an image and a button, changing the color, font and spacing in the Style panel; inline text editing; image replace.
- **Status:** ✅

### B-05 · Your brand colors and fonts in one place ✅
- **Pain:** a store that doesn't look like your Instagram.
- **Hooks:** "ألوان البراند بتاعك… على المتجر كله في ثانية."
- **Show:** the Brand panel / Design system → change the primary color → the whole store updates.
- **Status:** ✅

### B-06 · A section library for everything ✅
- **Pain:** "I don't know what a good store page should have."
- **Hooks:** "عايز قسم عروض؟ آراء العملاء؟ أسئلة شائعة؟ موجودين." / "مئات الأقسام الجاهزة."
- **Show:** the Add › Sections accordion with live previews (hero, products, testimonials, FAQ, promotions, gallery, newsletter, about, contact) → insert two.
- **Status:** ✅ (say "مئات" only after counting `library_sections`).

### B-07 · Pop-ups that sell ✅
- **Pain:** visitors leave without buying or leaving a number.
- **Hooks:** "الزبون هيمشي؟ وقّفه بعرض." / "بوب أب واتساب… والزبون يكلمك على طول."
- **Show:** the popup sections (exit, WhatsApp, restock, reward) in the library, then on the store.
- **Status:** ✅

### B-08 · Bundles, loyalty and product finder sections ✅
- **Pain:** a low average order value.
- **Hooks:** "خلّي الزبون يشتري 3 بدل واحدة." / "اعرض باقات… وزوّد الأوردر."
- **Show:** the bundles section, the loyalty section and the product finder on a demo store.
- **Status:** ✅

### B-09 · Pages: About, Contact, policies, anything ✅
- **Pain:** customers don't trust a store with no About or return policy.
- **Hooks:** "الثقة بتبدأ من صفحة 'من إحنا'."
- **Show:** the Pages list → add a page → About section → policies.
- **Status:** ✅

### B-10 · Media library: all your photos in one place ✅
- **Pain:** re-uploading the same photos over and over.
- **Hooks:** "صورك كلها في مكان واحد… استخدمها في أي حتة."
- **Show:** Website › Media → upload → pick it in the editor.
- **Status:** ✅

### B-11 · Preview before you publish ✅
- **Pain:** fear of breaking the live store.
- **Hooks:** "جرّب براحتك… المتجر الحقيقي مش هيتغير غير لما تنشر."
- **Show:** editing a draft → preview → Publish.
- **Status:** ✅

### B-12 · Switch templates any time ✅
- **Pain:** "If I pick a design now, I'm stuck with it."
- **Hooks:** "زهقت من شكل متجرك؟ غيّره في دقيقة."
- **Show:** applying a different template; undo.
- **Status:** ✅

## 6. Pillar C: products

### C-01 · Add a product in seconds ✅
- **Pain:** long, confusing product forms.
- **Hooks:** "صورة… اسم… سعر… والمنتج نزل."
- **Show:** Products › Add → photos, title, price → the product live on the store.
- **Status:** ✅

### C-02 · Sizes, colors and variants ✅
- **Pain:** customers asking "متوفر مقاس L؟" in DMs.
- **Hooks:** "المقاسات والألوان كلها قدام الزبون." / "خلاص… محدش هيسألك عن المقاس تاني."
- **Show:** adding variants (size, color) → the variant picker on the product page.
- **Status:** ✅

### C-03 · Upload all your products from Excel ✅
- **Pain:** a catalog of 200 products to enter by hand.
- **Hooks:** "عندك 200 منتج؟ ارفعهم مرة واحدة." / "شيت إكسل… ومتجرك مليان."
- **Show:** the Excel import → the products grid filling up.
- **Status:** ✅

### C-04 · Import a product from a link ✅
- **Pain:** retyping product details that already exist online.
- **Hooks:** "حط اللينك… والمنتج يتنقل بصوره."
- **Show:** paste a URL → the product filled in automatically (use a fictional/demo source page).
- **Status:** ✅

### C-05 · Moving from Shopify? Bring your products ✅
- **Pain:** "Switching platforms means losing my catalog."
- **Hooks:** "عندك متجر على شوبيفاي؟ انقل منتجاتك لطلبي."
- **Show:** Apps › Shopify import → products imported. Don't name or criticize competitors beyond the import feature itself (`MARKETING_PROJECT.md`).
- **Status:** ✅ (check the import is enabled in the Apps page first).

### C-06 · Digital products too ✅
- **Pain:** selling courses, files or vouchers by hand.
- **Hooks:** "بتبيع كورس أو ملف؟ متجرك يسلّمه لوحده."
- **Show:** creating a digital product.
- **Status:** ✅ (check delivery flow in the code before showing it).

### C-07 · Your own categories and brands ✅
- **Pain:** a messy catalog customers can't browse.
- **Hooks:** "رتّب متجرك… الزبون يلاقي اللي عايزه في ثانية."
- **Show:** Products › Categories & brands → the store's category menu.
- **Status:** ✅

### C-08 · Choose what each store sells (catalog per store) ✅
- **Pain:** two stores, different products.
- **Hooks:** "كل متجر يعرض منتجاته بس."
- **Show:** the store Catalog page → pick products for store 2.
- **Status:** ✅

## 7. Pillar D: orders, delivery and cash on delivery

### D-01 · All your orders in one list ✅
- **Pain:** orders lost between WhatsApp, Messenger and a notebook.
- **Hooks:** "بطّل تكتب الأوردرات في كشكول." / "كل أوردراتك قدامك في مكان واحد."
- **Show:** the Orders page with statuses (fictional orders).
- **Status:** ✅

### D-02 · Cash on delivery, the way Egypt buys ✅
- **Pain:** customers who won't pay online.
- **Hooks:** "الزبون يدفع لما الأوردر يوصله." / "الدفع عند الاستلام… جاهز من أول يوم."
- **Show:** checkout with cash on delivery selected → order placed.
- **Status:** ✅

### D-03 · طلبي delivers for you ✅
- **Pain:** finding and managing couriers.
- **Hooks:** "مش محتاج تدوّر على شركة شحن." / "إنت بيع… والتوصيل علينا."
- **Show:** an order moving through delivery statuses; Tallaby riders. Delivery times are estimates (Cairo & Giza 1–3 business days, other governorates 2–5); never promise a guaranteed time.
- **Status:** ✅

### D-04 · Use your own riders ✅
- **Pain:** "I already have my own delivery guy."
- **Hooks:** "عندك مندوب بتاعك؟ ضيفه وتابعه."
- **Show:** Orders › Riders → add a rider → assign an order.
- **Status:** ✅

### D-05 · Track every delivery ✅
- **Pain:** customers calling "الأوردر فين؟".
- **Hooks:** "الأوردر فين؟ السؤال ده خلص."
- **Show:** Orders › Delivery tracking and the customer timeline; the order-tracking section on the store.
- **Status:** ✅

### D-06 · Your own shipping prices by area 🟡
- **Pain:** one shipping price that loses money on far governorates.
- **Hooks:** "سعر شحن لكل منطقة… إنت اللي تحدده." / "الشحن ببلاش فوق مبلغ معين؟ إنت تقرر."
- **Show:** store Shipping page → zones with places, prices, free-over amount, COD per zone; the price check tool.
- **Status:** 🟡 code is on `main`, but `0093` (zone places) was staging-only at last record. Check it's on production and the manual check in `PLAN.md` §23 passed.

### D-07 · Shipping templates: set up in one click 🟡
- **Pain:** "Setting up shipping zones is confusing."
- **Hooks:** "إعدادات الشحن في ضغطة واحدة."
- **Show:** applying a shipping template on the Shipping page.
- **Status:** 🟡 same as D-06.

## 8. Pillar E: getting paid and money

### E-01 · No monthly subscription: pay only when you sell ✅
- **Pain:** monthly fees that eat the profit of a small seller.
- **Hooks:** "مفيش اشتراك شهري." / "بتدفع بس لما الأوردر يتسلّم."
- **Show:** Plan & usage page; a delivered order with the fee line.
- **Facts (use exactly):** a flat **EGP 5 per delivered order**, taken from the store wallet, with a **7-day free trial** from the first store's creation. The Free plan allows 3 stores. Say "5 جنيه بس على الأوردر اللي يتسلّم". Don't add other promises.
- **Status:** ✅ (agreed business model, `PLAN.md` §13). Re-check §13 before each use.

### E-02 · Try it free for 7 days ✅
- **Pain:** "I don't want to pay before I try."
- **Hooks:** "جرّب 7 أيام ببلاش." / "ابدأ النهارده… وادفع لما تبيع."
- **Show:** the trial banner on the dashboard home.
- **Status:** ✅

### E-03 · Your store wallet: every pound in front of you ✅
- **Pain:** not knowing what you earned and what you owe.
- **Hooks:** "فلوسك كلها قدامك… بالقرش." / "كشف حساب متجرك في ثانية."
- **Show:** the store wallet page with entries (earnings, fee) and the statement. Fictional numbers.
- **Status:** ✅

### E-04 · Top up your wallet with Kashier ✅
- **Pain:** a complicated payment process for fees and ads.
- **Hooks:** "اشحن محفظتك في ثواني."
- **Show:** top-up → Kashier payment → balance updated.
- **Status:** ✅

### E-05 · Get paid on Vodafone Cash, InstaPay and more 🟡
- **Pain:** customers who want to pay with mobile wallets.
- **Hooks:** "فودافون كاش؟ إنستاباي؟ الزبون يدفعلك على رقمك."
- **Show:** store Settings › Payments → turn on Vodafone Cash / InstaPay with your number → checkout shows it.
- **Status:** 🟡 `PLAN.md` P3-07 is partly done (settings page and checkout filter). Check what is live and show only that. Never show card payment as available.

### E-06 · Earnings when the order is delivered ✅
- **Pain:** "When do I actually get my money?"
- **Hooks:** "الأوردر اتسلّم؟ فلوسك في المحفظة."
- **Show:** an order marked delivered → a wallet earning entry; payout records.
- **Status:** ✅ (check the current payout wording in `docs/wallet.md`).

## 9. Pillar F: marketing and growth

### F-01 · Coupons and discounts ✅
- **Pain:** no easy way to run an offer.
- **Hooks:** "اعمل كوبون خصم في 10 ثواني." / "عرض نهاية الأسبوع؟ جاهز."
- **Show:** Coupons → create a code → applied at checkout.
- **Status:** ✅

### F-02 · Sell on the طلبي marketplace too ✅
- **Pain:** only your followers ever see your products.
- **Hooks:** "مش بس متابعينك… زباين جداد كل يوم." / "منتجاتك على متجرك وعلى طلبي."
- **Show:** the same product on the seller's store and on the marketplace.
- **Status:** ✅

### F-03 · Ads paid from your wallet ✅
- **Pain:** "Promoting my products is complicated."
- **Hooks:** "روّج لمنتجاتك… والدفع من محفظتك."
- **Show:** Marketing → ad packages → pay from the wallet.
- **Status:** ✅ (check package names and prices in the code; don't invent results).

### F-04 · Meta Pixel, Google Analytics and Tag Manager in one click ✅
- **Pain:** "My ads agency asked me for a pixel and I don't know what that is."
- **Hooks:** "الـ Pixel في متجرك… من غير مبرمج." / "اعرف إعلانك جاب كام أوردر."
- **Show:** Apps → Meta Pixel → paste the ID → connected.
- **Status:** ✅

### F-05 · Meta Conversions API: better ad tracking ✅
- **Pain:** ads that look like they're not working because of lost tracking.
- **Hooks:** "إعلاناتك على فيسبوك هتفهم زباينك أحسن."
- **Show:** Apps → Meta CAPI connected.
- **Status:** ✅

### F-06 · Your orders in Google Sheets 🟡
- **Pain:** copying orders into a sheet by hand for the team.
- **Hooks:** "الأوردرات بتنزل في الشيت لوحدها."
- **Show:** Apps → Google Sheets → orders appearing in a sheet.
- **Status:** 🟡 needs Google OAuth settings and a daily job in production. Check first.

### F-07 · Blog: get found on Google ✅
- **Pain:** customers can't find you on Google.
- **Hooks:** "اكتب عن منتجاتك… وجوجل يجيبلك زباين."
- **Show:** Website › Blog → new post → it appears on the store's blog section.
- **Status:** ✅

### F-08 · SEO settings and sitemap ✅
- **Pain:** "Why doesn't my store show up on Google?"
- **Hooks:** "متجرك يظهر في جوجل… من غير ما تفهم في الـ SEO."
- **Show:** Website › Domain › SEO → title and description; the sitemap.
- **Status:** ✅ (don't promise rankings).

### F-09 · Social links everywhere automatically ✅
- **Pain:** customers can't find your Instagram or WhatsApp from the store.
- **Hooks:** "حط لينكات السوشيال مرة واحدة… وتظهر في المتجر كله."
- **Show:** Website › Social → links appear in the footer.
- **Status:** ✅

### F-10 · Forms: collect numbers and requests ✅
- **Pain:** custom orders and inquiries lost in DMs.
- **Hooks:** "فورم طلب مخصوص… والطلبات توصلك مترتبة."
- **Show:** Website › Forms → a form on the store → the submissions inbox.
- **Status:** ✅

### F-11 · Newsletter: keep customers coming back ✅
- **Pain:** customers buy once and disappear.
- **Hooks:** "الزبون اللي اشترى مرة… خليه يرجع."
- **Show:** the newsletter section on the store → submissions.
- **Status:** ✅

### F-12 · Reviews build trust ✅
- **Pain:** new customers don't trust a store with no reviews.
- **Hooks:** "تقييم واحد حلو بيبيع أكتر من أي إعلان."
- **Show:** the reviews section on the product page; Reviews in the dashboard.
- **Status:** ✅ (show fictional reviews and label them as demo content in the plan).

### F-13 · Answer customer questions on the product ✅
- **Pain:** the same question in 20 DMs.
- **Hooks:** "السؤال يتجاوب مرة… والكل يشوفه."
- **Show:** a product question → seller answer → shown on the product page.
- **Status:** ✅ (check the questions UI first).

### F-14 · Reports: know what's selling ✅
- **Pain:** guessing which products to restock.
- **Hooks:** "اعرف إيه اللي بيتباع… وإيه اللي نايم."
- **Show:** the Reports and dashboard home KPIs (fictional numbers).
- **Status:** ✅

## 10. Pillar G: Tallaby Fulfillment (we handle operations)

### G-01 · We store, pack and deliver for you ✅
- **Pain:** a house full of stock and late nights packing orders.
- **Hooks:** "بيتك مش مخزن." / "إنت ركّز في البيع… والتغليف والتوصيل علينا."
- **Show:** Settings › Fulfillment → request the service.
- **Facts:** fulfillment is a **request-and-agree process**: nothing is charged at signup and terms are agreed with the team. Don't quote prices.
- **Status:** ✅

### G-02 · Customer service and returns handled ✅
- **Pain:** returns and customer calls take the whole day.
- **Hooks:** "المرتجعات وخدمة العملاء… مش شغلتك تاني."
- **Show:** the fulfillment services list.
- **Status:** ✅ (same facts as G-01).

## 11. Pillar H: seller education (value first, طلبي second)

Tips that help any seller and naturally lead to a طلبي feature. **No invented stats**: say "كتير من البياعين" rather than a percentage.

| ID | Topic | Hook | Links to |
|---|---|---|---|
| H-01 | 3 signs you've outgrown selling in DMs | "3 علامات إنك محتاج متجر بجد" | A-01 |
| H-02 | What makes a product photo sell | "الصورة دي بتبيع… والتانية لأ. ليه؟" | C-01, B-10 |
| H-03 | Writing a product description customers read | "وصف المنتج مش موضوع إنشا." | C-01 |
| H-04 | Why the price should be visible | "السعر على الخاص بيخسّرك زباين." | A-01 |
| H-05 | Your bio link: what to put there | "أهم لينك في حسابك… حاطط فيه إيه؟" | A-02 |
| H-06 | Free shipping over an amount: does it work? | "الشحن المجاني… ميزة ولا خسارة؟" | D-06 🟡 |
| H-07 | How a coupon brings back old customers | "الكوبون ده رجّع زبون من 3 شهور." | F-01 |
| H-08 | Bundles to raise the order value | "اعمل باقة… وخلي الأوردر أكبر." | B-08 |
| H-09 | The return policy that builds trust | "سياسة الاسترجاع بتبيع." | B-09 |
| H-10 | What is a Pixel and why your ads need it | "الـ Pixel ده إيه؟ في 20 ثانية." | F-04 |
| H-11 | Your brand colors: pick 2, not 7 | "متجرك مش قوس قزح." | B-05 |
| H-12 | How to answer "متاح؟" 100 times a day | "متاح؟ متاح؟ متاح؟ الحل هنا." | C-02 |
| H-13 | Keeping the customer updated after the order | "الزبون بعد الأوردر… محتاج يطمن." | D-05 |
| H-14 | Selling more on mobile | "الموبايل هو المحل بتاعك." | A-07 |
| H-15 | When to open a second store | "إمتى تفصل البراند التاني في متجر لوحده؟" | A-04 |
| H-16 | Your first 10 orders: a simple plan | "أول 10 أوردرات… تبدأ منين؟" | A-01, F-01 |
| H-17 | Stop the "الأوردر فين؟" calls | "المكالمة دي ممكن تختفي." | D-05 |
| H-18 | Seasonal offers: plan them early | "العرض الناجح بيتجهز قبلها بأسبوعين." | F-01, §13 |

## 12. Pillar I: formats and series (ways to tell any topic)

Use any of these formats with any ✅ topic to keep the feed fresh:

| Format | How it works |
|---|---|
| **Before / after** | Split screen: the old way (DMs, notebook) vs the طلبي way. |
| **Feature in 20 seconds** | One feature, start to finish, real screens, fast. |
| **A seller's day** | Morning orders → packing → delivered → wallet. Fictional seller persona (for example "سارة، بتبيع شنط هاند ميد"). |
| **Myth vs fact** | "المتجر الأونلاين غالي" → the real fee facts (E-01). Only true facts. |
| **3 reasons / 3 mistakes** | Fast list format, one beat per point. |
| **Customer's eye view** | The store as a shopper sees it, then flip to the seller's dashboard behind it. |
| **Template showcase** | One template per video, full scroll, category-specific (B-02). |
| **"How do I…?"** | Answer a real seller question in under 30 s. |
| **Build-along** | Speed-ramped build of a whole store from zero to Publish. |

## 13. Seasonal calendar (Egypt)

Prefer a seasonal angle when a season starts within 14 days. Dates of Islamic holidays move every year: **check the exact date before using it**.

| Season | Approx. time | Seller angle | Topics |
|---|---|---|---|
| White Friday / end-of-year sales | late November | "جهّز عروض الوايت فرايداي من دلوقتي" | F-01, B-07 |
| New Year | late Dec – early Jan | "ابدأ السنة بمتجر حقيقي" | A-01, E-02 |
| Valentine's Day | 14 February | gift stores, bundles | B-08, F-01 |
| Ramadan | about Feb–Mar 2027 (check) | Ramadan offers, store decoration, late-night shopping | B-07, F-01, B-12 |
| Eid al-Fitr | after Ramadan (check) | gifts, clothes, last-minute delivery estimates | D-03, F-01 |
| Mother's Day | 21 March | gifts, bundles | B-08 |
| Sham El-Nessim | spring (check) | seasonal products | F-01 |
| Eid al-Adha | about May 2027 (check) | offers, delivery before Eid (estimates only) | D-03 |
| Summer | June–August | summer collections, switch template | B-12, C-03 |
| Back to school | September | school supplies, bundles | B-08, C-03 |

## 14. Never make videos about

- Anything ⛔ Planned in `PLAN.md` / `PROJECT_DESCRIPTION.md`: AI features, paid plans, CMS collections in the dashboard (P4-11 not done), custom domains for extra stores (P3-03b), refunds (P6-12), card payments, Fawry, installments, Apple/Google Pay ("Soon" only).
- Shopper-facing topics (not in scope until the owner says so).
- Comparisons that name or attack competitors.
- Invented results ("بيعت 10 أضعاف"), invented seller stories presented as real, or real seller data.

## 15. Used topics log

Add one row after every video (newest at the top). The daily automated run also adds a row.

| Date | Topic ID | Format | Hook used | Channels | Notes |
|---|---|---|---|---|---|
| 2026-10-27 | N-05 (+ A-07) | Reel/ad "Before / after" on the Kholkhal demo store in a spec phone (520×1092, 0.476): two wrapped rows of header links (gold bracket) → rows fold, burger pops (first in the bar) → tap: sheet from the right with the store's links → swipe: header slides away, swipe back: it returns → phone shrinks into Zaki / Kholkhal / Pure, all with the burger → end card (30.7s), full `/brag` + Hyperframes | "منيو متجرك على الموبايل، لسه زحمة كده؟" (cover: "دوسة، والأقسام كلها قدام الزبون.") | Not posted yet (files only) | Closing line: "متجر مريح على الموبايل؟ ابدأ من طلبي دوت كوم" (button "ابدأ متجرك"). Voice Tamer (eleven_v4, take B of two, after the owner upgraded ElevenLabs to Starter; both connectors were rate limited before); local faster-whisper timings, large-v3 recheck. After state built in the demo page's DOM (template preview has no `drawChrome`). Original numpy music 108 BPM. File: `Marketing Videos/brag-output-2026-10-27-154914/01-mobile-menu-sticky-header/brag.mp4`. |
| 2026-10-27 | N-02 | Batch 2026-10-27 video 01 (parallel agents), Reel/ad "Feature in 20 seconds": bell swings with badge 1→2→3 → real popover "الإشعارات" (new order, product question, review; real ar.json strings) → tap opens the order (ORD7K2M9QX4, 450 ج.م) → end card (26.5s), full `/brag` + Hyperframes | "أوردر جديد؟ هتعرف في ساعتها." | Not posted yet (files only) | Closing line: "خطوة واحدة: طلبي دوت كوم" (button "خطوة واحدة"). VO says notifications appear live while the dashboard is open (realtime + 60s polling; no phone push). Voice Tamer (eleven_v4, ElevenLabs_2, one take: second rate limited); word timings from local faster-whisper. Original numpy music 108 BPM. File: `Marketing Videos/brag-output-2026-10-27-143027/01-seller-notifications/brag.mp4`. |
| 2026-10-27 | C-02 | Batch video 02, Reel/ad "Before / after": DM inbox "متاح مقاس L؟ / فيه أسود؟" → product form "المخزون والأنواع" (اللون × المقاس = 6 combinations, own price/stock) → storefront "هودي قطن" 450 ج.م, one-tap "أسود / L", "متوفر (8 قطعة)", add to cart (29.0s) | "متاح مقاس L؟ السؤال ده خلص." | Not posted yet (files only) | Closing line: "جرّبها بنفسك على طلبي دوت كوم" (button "جرّبها بنفسك"). Voice Tamer (eleven_v4, one take: second rate limited); local faster-whisper timings. Fictional store "نور ستريت", Streetwear template photos (no people). File: `Marketing Videos/brag-output-2026-10-27-143027/02-sizes-colors-variants/brag.mp4`. |
| 2026-10-27 | C-03 | Batch video 03, Tutorial (3 numbered steps): "استيراد / تصدير" → "تنزيل النموذج" → filled sheet to row 201 → "استيراد المنتجات" → "معاينة الرفع الجماعي" (صالحة 200) → "تمت إضافة 200 منتج" → grid fills (36.2s) | "عندك 200 منتج؟ شيت إكسل واحد… ومتجرك مليان." | Not posted yet (files only) | Closing line: "رتّب كتالوجك النهارده على طلبي دوت كوم" (button "رتّب كتالوجك"). Voice Tamer (eleven_v4, take A of two; B misheard words); local faster-whisper timings. Demo data from the Clay template catalog. File: `Marketing Videos/brag-output-2026-10-27-143027/03-tutorial-excel-import/brag.mp4`. |
| 2026-10-27 | A-04 | Batch video 04, Ad "A seller's day" (fictional "سارة", no face): Stores page + create-store dialog → Zay at `sara.tallaby.com` and Kholkhal at `sara-accessories.tallaby.com` side by side → sidebar switcher → "الخطة المجانية: لحد 3 متاجر" (`maxStores: 3`) (28.6s) | "عندك أكتر من براند؟ اعمل لكل واحد متجر." | Not posted yet (files only) | Closing line: "ابني براندك التاني على طلبي دوت كوم" (button "ابني براندك التاني"). Voice Tamer (eleven_v4, one take: second rate limited); caption highlight spread evenly per phrase. Original Node synth 108 BPM. File: `Marketing Videos/brag-output-2026-10-27-143027/04-ad-three-stores/brag.mp4`. |
| 2026-10-27 | F-01 | Batch video 05, Tutorial (4 numbered steps): العروض والخصومات › الكوبونات › إنشاء كوبون → `WEEKEND15`, 15%, 30–31/10/2026 → listed as "مجدول" → store "قهوة نور" checkout: products 600, shipping 60, discount 90, total 660 → 570 ج.م (36.0s) | "عرض نهاية الأسبوع؟ يلا نجهّز الكوبون في أربع خطوات." | Not posted yet (files only) | Closing line: "جهّز أول عرض ليك على طلبي دوت كوم" (button "جهّز أول عرض"). Seller coupons discount products only, not shipping (`place-order.ts`). "10 ثواني" hook dropped (form has more fields). Voice Tamer (eleven_v4, one take; script shortened to fit low credits, pain beat on screen only). Phone footer dips below y=1500 during push-ins. File: `Marketing Videos/brag-output-2026-10-27-143027/05-tutorial-coupons/brag.mp4`. |
| 2026-10-27 | N-04 | Owner-requested Bosta video with voiceover: hand-typing an order into a grey "شحنة جديدة" form → order cards pile up → real dashboard screens rebuilt from the repo components in a spec phone (540×1136, ratio 0.475): Apps › Bosta wizard "تم الربط. وجدنا مكانَي استلام." → Shipping partner card "تلقائيًا عند تأكيد الطلب" → ship dialog "تمت المطابقة: مدينة نصر" → bulk "اشحن 12 طلبًا مع بوسطة" + "اطبع 12 بوليصة" with labels fanning out → "شحنة بوسطة" status chips → fee line → end card (30.0s), full `/brag` + Hyperframes; cover frame "أكّد الأوردر… والشحنة تتعمل لوحدها" | "لسه بتنقل عنوان كل أوردر لشركة الشحن بإيدك؟" (cover: "أكّد الأوردر… والشحنة تتعمل لوحدها") | Instagram Reel, Facebook Reel, TikTok (18:00 Cairo, scheduled for 2026-10-28; 2026-10-27 slot held by reel 06; no YouTube channel connected) | Closing line: "وفّر وقتك، من طلبي دوت كوم" (spoken and captioned; button "وفّر وقتك", link tallaby.com). **Voiceover (remake the same day, owner request):** voice Tamer (eleven_v4); one of two takes came through (the other hit "Free Tier access has been disabled"). Word timings came from local whisper (`hyperframes transcribe`) because ElevenLabs transcription was out of credits. Captions are synced word by word with a gold highlight, and the music is ducked about 11 dB under the voice. Original numpy music (maqsum doum-tak, 110 BPM) + synthesised SFX, Canva background plate (design DAHZLb6tB88). Bosta red and logo tile replaced with brand teal and a neutral truck icon. File: `social-videos/2026/10/27-reel-07-bosta-shipping-vo.mp4` (replaces the silent `27-reel-07-bosta-shipping.mp4` in the same Buffer posts). Buffer IDs: IG 6ae03e23e03df6c473fb7624, FB 6ae03e243db43338b8436c63, TikTok 6ae03e258049d85b6be642b3. |
| 2026-10-26 | E-01 | Myth vs fact on the real pricing page: "monthly subscription" bills crossed out → real tallaby.com/pricing in a spec phone (540×1136, measured 0.473) → "اللي مش هتدفعه" zeros → live fee dial dragged 400 → 100 → 10,000 while the fee stays 5 EGP → plan card: cancelled/refused orders not charged, 7 free days → 4 real template stores → end card (28.7s), full `/brag` + Hyperframes | "ليه تدفع اشتراك كل شهر، قبل ما تبيع أصلاً؟" (cover: "مفيش اشتراك شهري.") | Instagram Reel, Facebook Reel, TikTok (18:00 Cairo, scheduled for 2026-10-27; 2026-10-26 slot held by reel 05; no YouTube channel connected) | Closing line: "متجرك مستنيك، على طلبي دوت كوم" (button "متجرك مستنيك", link tallaby.com). Voice Tamer (eleven_v4, one take: ElevenLabs returned 429 rate limits for ~1 h, the second take was rate limited too; word timings from ElevenLabs Scribe), original numpy music (maqsum doum-tak, 108 BPM), Canva background plate (design DAHZFfnghd0). Stores: Pure, Kholkhal, Zaki, Verdant (Mawsem, Atelier, Ward, Glow, Lumière, Karat, Oud, Zahra skipped: Arabic-Indic digits on screen; Loft skipped: "تركيب مجاني"). File: `social-videos/2026/10/26-reel-06-no-monthly-fee.mp4`. Buffer IDs: IG 6adef2ed45efd376cccca4bc, FB 6adef2eecacf63ab0ac25d74, TikTok 6adef2efebc709901afc4e69. |
| 2026-10-25 | N-03 (remake 2) | Storefront "shop window": real carousels in a spec phone (540×1136, ratio 0.475) → hidden collections → banners rotate → anatomy callouts (photo/headline/button + tap) → 4-store montage → end card (27.0s), full `/brag` + Hyperframes | "واجهة متجرك، هي أول حاجة الزبون بيشوفها." | Instagram Reel, Facebook Reel, TikTok (18:00 Cairo, scheduled for 2026-10-26; no YouTube channel connected) | Closing line: "ابدأ النهارده من طلبي دوت كوم" (button "ابدأ النهارده", link tallaby.com). Voice Tamer (eleven_v4, one take: the second hit a rate limit; word timings from local whisper because ElevenLabs transcription was rate-limited), original numpy music (maqsum doum-tak, 110 BPM), Canva background plate (design DAHZAfOKcxY). Real carousels from template previews: Mawsem, Kholkhal, Ward, Tarik (Beity/Shasha skipped: free-shipping and instalment banners). File: `social-videos/2026/10/25-reel-05-storefront-banners.mp4`. Buffer IDs: IG 6addcb230b5343d070c4852c, FB 6addcb243d5b27036bc58a7f, TikTok 6addcb250b5343d070c48576. |
| 2026-10-25 | N-03 (remake) | Real hero carousels on live template previews → category flip → end card (20.4s), full `/brag` + Hyperframes | "أول حاجة الزبون بيشوفها في متجرك… خليها تتحرك." | Instagram Reel, Facebook Reel, TikTok (18:00 Cairo, scheduled for 2026-10-26; 2026-10-25 slot already held by reel 03) | Closing line: "صمّم متجرك على طلبي دوت كوم" (button "صمّم متجرك", link tallaby.com). Voice Tamer (eleven_v4, one take: the second hit a rate limit), original numpy music, no slogan. Real carousels (Mawsem, Kholkhal, Farha, Shasha, Ward) screencast from tallaby.com template previews. File: `social-videos/2026/10/25-reel-04-hero-carousels-remake.mp4`. Buffer IDs: IG 6add9aba6887a2efc1ee6b64, FB 6add9abbbd33ce99c3599293, TikTok 6add9abbbd33ce99c35992c0. **Not posted:** pulled from Buffer on 2026-10-25 (owner: weak quality, wide phone mockup, and the hook "خليها تتحرك" is a banned phrase); N-03 still open. |
| 2026-10-25 | A-01 | DM flood → one link → real store (24.6s), full `/brag` + Hyperframes | "لسه بتاخد الأوردرات على الخاص؟" | Instagram Reel, Facebook Reel, TikTok (18:00 Cairo) | Closing line: "إفتح متجرك دلوقتي على طلبي دوت كوم" (button "إفتح متجرك دلوقتي", link tallaby.com). Steady voice (Tamer, no tags), centred layout, original music, no slogan. Real store: Atelier demo "ميزون نور". File: `social-videos/2026/10/25-reel-03-store-link-v3.mp4` |
| 2026-10-25 | N-03 | Frozen banner → real carousels + swipe (26s), full `/brag` + Hyperframes | "البانر بتاعك واقف؟" | Instagram Reel, Facebook Reel, TikTok (18:00 Cairo, scheduled 2026-10-24) | Voice Tamer (eleven_v4), `/brag` music vol-1 + SFX. Real carousels from template previews (Mawsem, Farha, Kholkhal, Shasha, Ward, Beity, Tarik). N-02 skipped: notifications only exist in the logged-in dashboard, no public demo to film. File: `social-videos/2026/10/25-reel-02-hero-carousels.mp4`. **Not posted:** pulled from Buffer on 2026-10-25 (said the slogan, uneven voice, off-centre); topic N-03 still open for a remake. |
| 2026-10-24 | N-01 | Before/after + feature build-up (28s) | "صفحة المنتج بتاعتك… شكلها زي كل الناس؟" | Instagram Reel, Facebook Reel, TikTok (18:00 Cairo) | First reel. Voice Tamer (eleven_v4). Real UI from tallaby.com template previews (Atelier, Glow, TechHub). File: `social-videos/2026/10/24-reel-01-product-page-builder.mp4` |
