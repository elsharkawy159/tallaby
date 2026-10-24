# طلبي (Tallaby) — Brand Awareness Campaign Plan · 20 Oct 2026 → 3 Jan 2027

> **Purpose:** The campaign map for the next ~2.5 months. **Main goal: brand awareness among Egyptian business owners.** Every business owner in Egypt should know that **طلبي = إنشاء متاجر إلكترونية**, which problems we solve, which services we provide and which tech features we offer. Plan only, no designs.
> Designs follow `claude/SOCIAL_DESIGN_CONTEXT.md`, facts and voice follow `MARKETING_PROJECT.md`, scheduling follows `claude/SOCIAL_SCHEDULING_GUIDE.md`.
> ⚠️ **UPDATE 20 Oct 2026 (user decision): fulfillment marketing is PAUSED.** Tallaby does not store, package, deliver, collect cash, answer the seller's customers or handle returns in any marketing. Market only: **e-commerce website creation** (AI store in a minute, templates, no code, own link/domain), **app integrations** (shipping companies the seller ships with, payment methods, social, Google Analytics, Meta Pixel + catalog), **seller dashboard**, **Tallaby services** (marketplace exposure "عملاء طلبي", boost package 700 ج.م / 7 days, custom domain, WhatsApp support) and **pricing** (بدون رسوم + 5 ج.م per successful order). Sections below are updated; anything left mentioning fulfillment is void.
> **v2, 19 Oct 2026:** refocused from sign-up conversion to brand awareness + problems + services + tech features (user request).
> **v2.1, 19 Oct 2026:** cadence = **1–2 posts per day**; caption rule = **simple, Egyptian Arabic, max one emoji**; ready posts in `claude/POST_BANK_NOV_DEC_2026.md` (~120 posts with captions + a date map). Real dashboard screenshots (builder, templates, apps, wallet…) are being added to the project files for designs and videos.

### Cadence & caption rules (user, 19 Oct 2026)

- **1–2 posts per day** on Facebook + Instagram (≈ 110–120 posts over the campaign). Post A 13:00–14:00, post B 20:00–21:00 Cairo. Reels go to TikTok/YouTube Shorts too; B2B posts go to LinkedIn (2/week).
- Never two posts from the same pillar on the same day; alternate formats (image / carousel / reel).
- **Captions:** simple, 3–6 short lines, **Egyptian accent**, **at most one emoji** (many with none), no emoji or ✦ lists, varied openings, CTA + tallaby.com, 3–5 hashtags.
- The calendar in §6 is the weekly theme guide; the post bank fills each day.
> **Sources:** project docs, `Tallaby-Seller-Partnership-AR.pdf`, seller dashboard screenshots, the feature list the user gave on 19 Oct 2026, and public competitor pages (EasyOrders, Shopify, WordPress/WooCommerce). tallaby.com was **not** used as a source (the live site has old content).
> **Labels:** **Confirmed** = in the codebase/docs · **User-confirmed** = stated by the user on 19 Oct 2026 (check it's live before paid ads) · **Proposed** = campaign direction that needs team approval.

---

## 0. Before launch: things to fix (20–25 Oct)

| # | Item | Why |
|---|---|---|
| 1 | **Pricing = 5 ج.م per successful order everywhere.** The seller PDF and `/sell` page still say **5%** (500 → 25 → 475 example). Update them and `MARKETING_PROJECT.md` §4 | Awareness posts say "5 جنيه بس". A 5% PDF looks like bait-and-switch |
| 2 | **Confirm the AI store builder** is live and how long it really takes (claim: **"في دقيقة واحدة"**). Record a real, uncut screen capture | It's the hero tech feature |
| 3 | **Confirm live integrations:** which shipping companies, which payment methods (card is **off**: `ONLINE_CARD_PAYMENT_ENABLED = false`), social media, Google Analytics, Meta Pixel + catalog | Feature posts may only name what a seller can switch on today |
| 4 | **Tracking on tallaby.com:** Meta Pixel + CAPI, GA4, TikTok Pixel. Track branded search for "طلبي" / "Tallaby" in Google Search Console | Awareness needs measuring too (§10) |
| 5 | **Brand consistency on every channel:** same logo avatar, cover with "إنشاء متاجر إلكترونية", bio: "طلبي · إنشاء متاجر إلكترونية ✦ متجرك بالـAI في دقيقة ✦ بدون اشتراك ✦ 5 ج.م بس على الطلب 👇 tallaby.com" | Awareness = recognition, which needs one consistent look |
| 6 | **Story highlights** (IG/FB): مين إحنا · المشاكل اللي بنحلها · خدماتنا · المميزات · الأسعار · إزاي تبدأ · أسئلة | Every new visitor can understand the brand in 30 seconds |
| 7 | **WhatsApp Business (@tallaby, http://wa.me/@tallaby):** greeting + quick replies (الأسعار، الخدمات، المميزات، إزاي أبدأ) | Awareness creates questions |
| 8 | Retire the old `tallaby-social-media-30-posts.html` library | It uses **FREEDEL**, "تالابي", an old WhatsApp number and the retired slogan |

---

## 1. Campaign idea

### Brand position (Confirmed tagline)

**طلبي = إنشاء متاجر إلكترونية**

### Brand promise (Proposed wording)

> **طلبي بتعملك متجرك الإلكتروني وبتشيل عنك كل التعب:** الـAI يصمملك المتجر في دقيقة، متوصل بالشحن والدفع والسوشيال والتحليلات، ومنتجاتك بتظهر لعملاء طلبي كمان. **بدون رسوم، بدون اشتراك، و5 جنيه بس على الطلب الناجح.**

### Campaign name / hashtag (Proposed)

- Campaign: **"طلبي… متجرك وكل اللي محتاجه"** (short version: **"متجرك في دقيقة"** for AI posts)
- Hashtags: `#طلبي` `#Tallaby` `#إنشاء_متجر_إلكتروني` `#متجرك_في_دقيقة` `#بيع_اونلاين` `#ابدأ_مشروعك`

### Objectives

| Priority | Objective | Measured by (§10) |
|---|---|---|
| **1** | **Brand awareness:** business owners recognise طلبي and know what it does | Reach in seller audiences, video views, follower growth, branded search, ad recall (if running a Meta brand-lift study) |
| **2** | **Understanding:** they can name at least 3 things طلبي does (AI builder, integrations, no fees + 5 ج.م) | Saves, shares, comments, profile visits, story highlight views |
| **3** | **Consideration:** they visit tallaby.com or ask on WhatsApp | Website visits, WhatsApp chats |
| 4 | Sign-ups (secondary in this campaign) | `CompleteRegistration` |

### Who we're talking to

| Segment | Today they… | Main problem | Lead message |
|---|---|---|---|
| **A. Instagram/Facebook/WhatsApp sellers** | Sell in DMs, "السعر في الخاص" | Order chaos, no trust | "حوّل صفحتك لمتجر حقيقي" |
| **B. Physical shop owners** | Sell in-store only | "Online = expensive + needs a programmer" | "متجرك أونلاين من غير مبرمج ومن غير اشتراك" |
| **C. Brand starters / home businesses** | An idea and little budget | Fear of upfront cost | "ابدأ بـ0 جنيه، وادفع 5 جنيه بس لما تبيع" |
| **D. Merchants on other platforms** | Pay subscriptions / fight plugins | Dollar fees, tech headaches | "بالجنيه المصري، ومفيش اشتراك شهري" |
| **E. Wholesalers / importers** | Sell in bulk offline | Want a retail channel | "اعرض بضاعتك قدام عملاء طلبي في كل مصر" |

---

## 2. The 5 content pillars (the core of this plan)

Every post belongs to exactly one pillar. The pillar name becomes the gold label on the design (e.g. "مشكلة وحلها", "خدماتنا").

| # | Pillar | Share of content | Recurring series (Proposed names) | Role |
|---|---|---|---|---|
| **P1** | **The brand: who is طلبي** | 15% | **"مين إحنا؟"** | Recognition: name, tagline, look, what we stand for |
| **P2** | **Business owner problems we solve** | 25% | **"مشكلة وحلها"** | Relevance: "they understand me" |
| **P3** | **Tallaby services** (marketplace exposure, boost package, custom domain, WhatsApp support, help building the store) | 20% | **"خدمات طلبي"** | Trust: we're a partner, not just software |
| **P4** | **Tech features** (website builder, AI, templates, app integrations, dashboard) | 25% | **"ميزة في دقيقة"** | Capability: modern, easy, complete |
| **P5** | **Pricing + how to start** | 10% | **"اسأل طلبي"** (FAQ) | Removes the last doubt |

### P1 · The brand: who is طلبي

| Message | Arabic line | Status |
|---|---|---|
| What we are | **طلبي = إنشاء متاجر إلكترونية** | Confirmed |
| Egyptian, Arabic-first | **منصة مصرية، بالعربي، وبالجنيه المصري** | Confirmed |
| Store + marketplace | **متجرك الخاص + عملاء طلبي في كل مصر** | Confirmed |
| Partner, not a listing site | **طلبي شريك لشغلك، مش مجرد مكان تعرض فيه منتجاتك** | Confirmed (seller PDF) |
| We earn when you earn | **مكسبنا من مكسبك: بنكسب بس لما إنت تبيع** | Confirmed (pay per sale) |
| Nationwide | **بيع لكل محافظات مصر** | Confirmed |

Brand content ideas: a 45-sec brand film/manifesto ("لكل صاحب مشروع…"), "طلبي يعني إيه؟" (the name = "my order"), meet the team (real people only), behind the scenes of the team building the platform, the brand colours/logo reveal, "طلبي في 30 ثانية".

### P2 · Business owner problems we solve

| # | Problem (in their words) | How طلبي solves it | Pillar link |
|---|---|---|---|
| 1 | **"المبرمج طلب مني آلاف"** | AI + ready templates, no code | P4 |
| 2 | **"الاشتراك الشهري بالدولار وبيغلى"** | No subscription; 5 ج.م only per successful order | P5 |
| 3 | **"استضافة ودومين وإضافات… مش فاهم حاجة"** | Nothing technical: link ready (`yourstore.tallaby.com`), own domain optional | P4 |
| 4 | **"بقضي اليوم أرد على 'السعر كام؟'"** | One link with all products, prices and ordering | P4 |
| 5 | **"الناس مش واثقة في صفحة إنستجرام"** | Professional store + cash on delivery (via shipping companies) + reviews | P4 |
| 6 | **"مش عارف أشحن لعملائي إزاي"** | Integrations with shipping companies from the dashboard | P4 |
| 7–10 | ~~storage / packaging / customer service / returns~~ | **Paused 20 Oct 2026 — don't use** | — |
| 11 | **"بعلن ومش عارف مين اشترى"** | Meta Pixel + catalog + Google Analytics | P4 |
| 12 | **"محدش يعرف متجري"** | Marketplace exposure + the boost package | P3 |
| 13 | **"مش عارف أدير الأوردرات والفلوس"** | Dashboard: orders, statements, wallet | P4 |

Format: "مشكلة → حل" in one image, or a skit reel (problem acted out → طلبي fixes it).

### P3 · Tallaby services (updated 20 Oct 2026)

Fulfillment (storage, packaging, delivery, COD collection, customer service, returns) is **paused — never market it**. P3 now covers:

| Service | Arabic line | Details |
|---|---|---|
| **Store creation help** | **بنساعدك تعمل متجرك** | AI builds the store; the team helps on WhatsApp if you get stuck |
| **Custom domain** | **اربط دومينك بمتجرك** | `yourstore.tallaby.com` ready, or connect your own domain |
| **Marketplace exposure** | **منتجاتك قدام عملاء طلبي** | Products also appear on the طلبي marketplace (one cart, many sellers) |
| **Boost package** | **باقة ظهور: 700 ج.م / 7 أيام** | Promo video, posting on طلبي channels, featured on the site, Meta ads. Paid, separate, no guaranteed orders |
| **Support** | **دعم على الواتساب** | Whatsapp @tallaby.com |

### P4 · Tech features

| Group | Feature | Arabic line | Status |
|---|---|---|---|
| **Website builder** | **AI store in a minute** | **الـAI يصمملك متجر إلكتروني كامل في دقيقة واحدة** | User-confirmed |
| | No code | **بناء المتاجر الإلكترونية بدون برمجة** | Confirmed |
| | Ready templates | **قوالب جاهزة وسهل التعديل عليها** | User-confirmed |
| | Own link / domain | **رابط باسمك أو دومين خاص بيك** | Confirmed |
| | Mobile-first, Arabic RTL | **متجرك شكله حلو على الموبايل وبالعربي** | Confirmed |
| **App integrations** | Shipping companies | **ربط مع شركات الشحن** (the seller ships through the integrated companies) | User-confirmed |
| | Payment methods | **ربط طرق دفع مختلفة**: عند الاستلام، إنستاباي، فودافون كاش، المحفظة | Confirmed (**no card**) |
| | Social media | **ربط بالسوشيال ميديا** | User-confirmed |
| | Google Analytics | **ربط بتطبيقات التحليلات زي Google Analytics** | User-confirmed |
| | Meta Pixel + catalog | **ربط ميتا بيكسل للكتالوج** | User-confirmed |
| **Seller dashboard** | Products + variants | Sizes, colours, options | Confirmed |
| | Bulk upload | **ارفع كل منتجاتك مرة واحدة** (Import / Export) | Confirmed (screenshot) |
| | Orders | **تابع كل أوردر من مكان واحد** | Confirmed |
| | Coupons & offers | **اعمل كوبونات وعروض بنفسك** (with countdown) | Confirmed |
| | Reviews & Q&A | **شوف آراء عملائك ورد على أسئلتهم** | Confirmed |
| | Wallet + statements + reports | **اعرف أرباحك وكل حركة فلوس** | Confirmed |
| | Shipping & logistics settings | Delivery plans per order | Confirmed |
| | Advertise your products | Request the boost package from the dashboard | Confirmed |

### P5 · Pricing + how to start

- **بدون رسوم** · التسجيل مجاني · مفيش اشتراك شهري · مفيش رسوم مخفية
- **عمولة 5 جنيه بس على الطلب الناجح**: no sale, no charge
- The boost package is optional: 700 ج.م / 7 days
- How to start: 1) sign up at tallaby.com 2) the AI builds your store 3) add products 4) connect shipping & payments 5) share your link

### Copy bank: extra attention-grabbing words (Proposed)

بدون مبرمج · بدون استضافة · بدون اشتراك شهري · بدون دولار · **ادفع بس لما تبيع** · **متجرك جاهز قبل ما الشاي يبرد ☕** · من "السعر في الخاص" لـ"اطلب من المتجر" · بالجنيه المصري مش بالدولار · رابط واحد فيه كل منتجاتك · **منتجاتك قدام عملاء طلبي** · مفيش رسوم مخفية · متجرك شغال 24 ساعة حتى وإنت نايم · صفر جنيه عشان تبدأ · **مكسبنا من مكسبك** · كل حاجة متوصلة من أول يوم · من الموبايل في أي وقت

### Messages to avoid

- ❌ "أرخص منصة" / any per-order price comparison (see §3)
- ❌ Card payment, free shipping over 500, FREEDEL
- ❌ Invented numbers ("آلاف التجار", "+200%"), fake testimonials
- ❌ "5%" and "5 ج.م" in the same piece (campaign = **5 ج.م**)
- ❌ The retired slogan; "تالابي"; links other than **tallaby.com**
- ❌ "Guaranteed sales", including for the boost package

---

## 3. What we learned from the references

| Reference | What they do | What we take from it |
|---|---|---|
| **EasyOrders** (closest competitor in Egypt) | "Store in less than 10 minutes, no coding"; free plan at **$0.04/order**, Pro **$100/month**; 15+ payment gateways, 100+ shipping companies, Meta catalog + Google Shopping, "Easy AI"; big social-proof numbers; free marketing support | Their awareness is built on **"easy + no code"** and social proof. We own **"AI in a minute"** + **marketplace customers (عملاء طلبي)** + **EGP not USD** |
| **Shopify** | Brand awareness through education (blogs, YouTube tutorials, "start a business" content); plans from $5 to $399/month + fees + paid apps | Copy the **education-led awareness**: "how to start a business online" content. Our counter-message: **no subscription, no dollars, in Arabic** |
| **WordPress / WooCommerce** | "Free", but you pay for hosting, domain, theme, plugins, a developer and maintenance | Counter-message: **no programmer, no hosting, no plugins** |

### ⚠️ Honest pricing note (internal)

5 ج.م per order is **more** than EasyOrders' $0.04 (≈ 2 ج.م). Never claim "أرخص". Compare against **monthly dollar subscriptions, developer and hosting costs, ** Our edge: AI store in a minute + marketplace customers + all integrations + EGP, with no subscription.

Don't name competitors in public content (`MARKETING_PROJECT.md` §18).

---

## 4. Timeline map (20 Oct 2026 → 3 Jan 2027)

Each week has **one theme**. Within the week, posts rotate across pillars so the feed never feels one-note.

```
Wk0  20–25 Oct      ░ PREP: fixes, brand consistency, highlights, brand film shoot
Wk1  26 Oct–1 Nov   █ P1 BRAND INTRO      "مين هي طلبي؟ — إنشاء متاجر إلكترونية"
Wk2  2–8 Nov        █ P4 AI WEBSITE BUILDER  "الـAI يصمملك متجرك في دقيقة"
Wk3  9–15 Nov       █ P2 PROBLEMS: COST & TECH  programmer, dollar subscriptions, hosting (11.11 hook)
Wk4  16–22 Nov      █ P4 INTEGRATIONS I   shipping companies + payment methods
Wk5  23–29 Nov      █ P4 INTEGRATIONS II  social media + Google Analytics + Meta Pixel & catalog (Black Friday 27 Nov hook)
Wk6  30 Nov–6 Dec   █ P3 SERVICES I       marketplace exposure (عملاء طلبي), one cart, custom domain
Wk7  7–13 Dec       █ P3 SERVICES II      boost package, WhatsApp support, selling-online tips
Wk8  14–20 Dec      █ P4 DASHBOARD        products, bulk upload, orders, coupons, reviews, wallet, domain
Wk9  21–27 Dec      █ P2 PROBLEMS: DAILY SELLING  DMs, trust, time, ads with no data
Wk10 28 Dec–3 Jan   █ P1 BRAND RECAP + P5 "ابدأ 2027 بمتجرك" + Ramadan prep tease
```

### Phase goals

| Phase | Weeks | Focus | Main KPI |
|---|---|---|---|
| **Introduce** | Wk1–2 | Who we are + the hero feature | Reach, video views, follower growth |
| **Relate** | Wk3–5 | Problems + integrations | Engagement rate, saves, shares, comments |
| **Trust** | Wk6–8 | Services + dashboard depth | Profile visits, website visits, WhatsApp chats |
| **Remember** | Wk9–10 | Problems recap + brand recap | Branded search, ad recall, returning viewers |

---

## 5. Channel plan

| Channel | Role in awareness | Cadence (Proposed) | Formats |
|---|---|---|---|
| **Facebook** | Widest reach among business owners | 1–2 posts/day (incl. ~3 reels/week) + daily stories | Simple-style images, carousels, reels, Live |
| **Instagram** | Visual brand + seller audience | 1–2 posts/day (incl. 3–4 reels/week) + daily stories | Reels, carousels, story polls ("بتبيع أونلاين ولا في محل؟") |
| **TikTok** | Reach young founders | 4–5 videos/week | Native skits ("مشكلة وحلها"), screen demos, behind the scenes |
| **YouTube** | Education-led awareness + search | 1 video/week + Shorts | "إزاي تعمل متجر إلكتروني في مصر" tutorials, feature walkthroughs |
| **LinkedIn** | B2B brand: brands, wholesalers, partners | 2/week, weekdays 10:00–12:00 | Brand story, services, tech features, cost education |
| **Facebook groups** | Free reach in business communities | 3–4 helpful posts/week | Tips, problem-solution, no hard selling |
| **Google** | Branded + category search | YouTube in-stream/Shorts ads + small search campaign | Brand video, search ads on "انشاء متجر الكتروني" |
| **WhatsApp** | Answer questions created by awareness | Replies within 15 min, 10:00–22:00 | Quick replies |

Posting times: FB/IG 19:00–21:00 · TikTok 20:00–23:00 · LinkedIn 10:00–12:00 (Cairo).

---

## 6. Week-by-week content calendar

Format key: **P** = single image (simple style, 1080×1350) · **C** = carousel · **R** = reel/TikTok/Short · **L** = LinkedIn · **YT** = YouTube long video · **LIVE**.
The **gold label** on each design = the pillar series name. One highlighted word (in **bold**). Background rotates every post. Link: **tallaby.com**.

### Wk1 · 26 Oct–1 Nov · BRAND INTRO "مين هي طلبي؟"

| Day | Pillar | Fmt | Headline (highlight in **bold**) | Notes |
|---|---|---|---|---|
| Mon 26 | P1 | R ★ | **Brand film:** "لكل صاحب مشروع نفسه يبيع أونلاين… **طلبي**" | 45s manifesto: shop owner, Instagram seller, home business → "إنشاء متاجر إلكترونية". Pin everywhere. Main awareness ad |
| Tue 27 | P1 | P | طلبي = **إنشاء** متاجر إلكترونية | Label "مين إحنا؟" · object: real packed طلبي order |
| Wed 28 | P1 | C | طلبي في 5 حاجات | 1) AI store in a minute 2) all integrations 3) we deliver and collect 4) no fees 5) customers all over Egypt |
| Thu 29 | P2 | P | عايز تبيع أونلاين ومش عارف **تبدأ** منين؟ | Teaser for the problems series |
| Sat 31 | P1 | R | "طلبي في **30** ثانية" | Fast cut of the AI builder, store, dashboard, an order coming in |
| — | P1 | L | Introducing طلبي: an Egyptian platform to create online stores + done-for-you operations | Company post |

### Wk2 · 2–8 Nov · AI WEBSITE BUILDER

| Day | Pillar | Fmt | Headline | Notes |
|---|---|---|---|---|
| Mon 2 | P4 | R ★ | الـAI يصمملك متجر إلكتروني كامل في **دقيقة** واحدة | Real uncut screen recording with timer. Second main ad |
| Tue 3 | P4 | P | ابني متجرك **بدون** برمجة | Label "ميزة في دقيقة" · object: real phone showing a store |
| Wed 4 | P4 | C | قوالب **جاهزة** وسهل تعدّل عليها | Show 4–5 template looks: fashion, cosmetics, electronics, food, accessories |
| Thu 5 | P4 | R | "جربنا نعمل متجر **عطور** في دقيقة" | Niche series: one reel per niche across the campaign |
| Sat 7 | P4 | R | عدّل لون ولوجو متجرك **بنفسك** | Template editing demo |
| — | P4 | YT | "إزاي تعمل متجر إلكتروني بالذكاء الاصطناعي في دقيقة" | Full walkthrough |
| — | P4 | L | How AI is lowering the cost of starting e-commerce in Egypt | Thought leadership |

### Wk3 · 9–15 Nov · PROBLEMS: COST & TECH

| Day | Pillar | Fmt | Headline | Notes |
|---|---|---|---|---|
| Mon 9 | P2 | P | المبرمج طلب **آلاف**؟ | Label "مشكلة وحلها" · solution line in caption: AI + templates |
| Tue 10 | P2 | R | Skit: "الاشتراك الشهري **بالدولار** زاد تاني 😩" | → "مع طلبي مفيش اشتراك" |
| Wed 11 | P5 | P | 11.11: افتح متجرك بـ**0** جنيه | Topical hook |
| Thu 12 | P2 | C | استضافة؟ دومين؟ إضافات؟ **ولا** حاجة منهم | Tech jargon you don't need anymore |
| Sat 14 | P5 | P | مش هتدفع غير **5 جنيه** على كل طلب ناجح! | Reuse the approved design (`DAHYZTbEfnc`) |
| — | P5 | R | "فين الفخ؟" — team member explains: we earn only when you sell | Builds trust in "بدون رسوم" |
| — | P2 | L | The hidden costs of opening an online store in Egypt | Developer, hosting, subscriptions, delivery |

### Wk4 · 16–22 Nov · INTEGRATIONS I: shipping + payments

| Day | Pillar | Fmt | Headline | Notes |
|---|---|---|---|---|
| Mon 16 | P4 | P | **ربط** مع شركات الشحن | Object: real kraft parcel |
| Tue 17 | P2 | R | "العميل عايز يدفع **فودافون كاش** وأنا معنديش غير كاش 😅" | → payment methods |
| Wed 18 | P4 | C | طرق دفع **مختلفة** في متجرك | عند الاستلام · إنستاباي · فودافون كاش · المحفظة (no card) |
| Thu 19 | P3 | P | بيع لكل **محافظات** مصر | Delivery estimates: Cairo/Giza 1–3 days, others 2–5 (say "عادةً") |
| Sat 21 | P4 | R | "إزاي تفعّل الشحن والدفع في متجرك في **دقيقتين**" | Screen demo (timing must be real) |
| — | P4 | L | Shipping + payments: what an Egyptian store needs | B2B |

### Wk5 · 23–29 Nov · INTEGRATIONS II: social + analytics + Meta Pixel (BF hook)

| Day | Pillar | Fmt | Headline | Notes |
|---|---|---|---|---|
| Mon 23 | P4 | P | اربط متجرك **بالسوشيال** ميديا | Object: phone with store link shared |
| Tue 24 | P4 | R | "متجرك + **ميتا بيكسل** = إعلانات بتعرف عميلك" | Pixel + catalog explainer |
| Wed 25 | P4 | P | اعرف زوارك جايين منين مع **Google** Analytics | |
| Thu 26 | P4 | C | كل **التطبيقات** اللي متجرك متوصل بيها | Shipping · payments · social · GA · Meta Pixel + catalog · domain |
| Fri 27 | P2 | R | Black Friday: "إعلاناتك النهارده… عارف **مين** اشترى؟" | Problem 11 → pixel + GA |
| Sat 28 | P4 | P | منتجاتك في **كتالوج** فيسبوك وإنستجرام | Meta catalog |
| — | P4 | L | Data from day one: pixels and analytics for small sellers | B2B |

### Wk6 · 30 Nov–6 Dec · SERVICES I: marketplace exposure + domain (updated 20 Oct)

| Day | Pillar | Fmt | Headline | Notes |
|---|---|---|---|---|
| Mon 30 | P3 | R ★ | "يوم في حياة **متجر** على طلبي" | Create store → add products → share link → order arrives in the dashboard. Third main ad |
| Tue 1 | P3 | P | منتجاتك قدام **عملاء** طلبي | Marketplace exposure |
| Wed 2 | P2 | P | مش عارف **تشحن** إزاي؟ | → shipping-company integrations |
| Thu 3 | P3 | C | سلة **واحدة** لكل التجار | How the marketplace works for the seller |
| Sat 5 | P3 | P | اربط **دومينك** بمتجرك | Custom domain |
| — | P3 | YT | "إزاي تعمل متجرك وتظهر لعملاء طلبي" | |
| — | P3 | L | Marketplace + own store: two channels in one place | B2B |

### Wk7 · 7–13 Dec · SERVICES II: boost package + support (updated 20 Oct)

| Day | Pillar | Fmt | Headline | Notes |
|---|---|---|---|---|
| Mon 7 | P3 | P | دعم **واتساب** لما تحتاجنا | Whatsapp @tallaby.com |
| Tue 8 | P2 | R | Skit: "عملت المتجر… و**محدش** شافه" | → share link + marketplace + boost |
| Wed 9 | P3 | C | باقة الظهور فيها **إيه**؟ | Video, طلبي channels, featured, Meta ads; no guaranteed orders |
| Thu 10 | P3 | P | 5 نصايح **لأول** أوردر | Selling tips ending with طلبي |
| Sat 12 | P3 | P | باقة ظهور **700** ج.م / 7 أيام | "مش بتضمن عدد أوردرات" in caption |
| — | P1 | L | Why we built طلبي as a partner, not a listing site | Brand story |

### Wk8 · 14–20 Dec · DASHBOARD FEATURES

| Day | Pillar | Fmt | Headline | Notes |
|---|---|---|---|---|
| Mon 14 | P4 | R | جولة في **لوحة التحكم** في 30 ثانية | Real dashboard screen recording |
| Tue 15 | P4 | P | ارفع كل منتجاتك **مرة** واحدة | Import / Export |
| Wed 16 | P4 | P | اعمل **كوبون** خصم بنفسك | Coupons + countdown |
| Thu 17 | P4 | C | تابع أوردراتك وأرباحك من **مكان** واحد | Orders · statements · wallet · reports |
| Sat 19 | P4 | P | رابط **باسمك** أو دومين خاص بيك | `yourstore.tallaby.com` |
| — | P5 | LIVE | "اسأل طلبي": Q&A + live dashboard tour | |
| — | P4 | L | Inside the طلبي seller dashboard | B2B |

### Wk9 · 21–27 Dec · PROBLEMS: DAILY SELLING

| Day | Pillar | Fmt | Headline | Notes |
|---|---|---|---|---|
| Mon 21 | P2 | R | Skit: "**السعر** كام؟" × 100 | → one store link |
| Tue 22 | P2 | P | الناس مش **واثقة** في الصفحة؟ | → store + COD + reviews |
| Wed 23 | P2 | C | 5 مشاكل كل تاجر عارفها… وحلها مع طلبي | Recap of the biggest problems |
| Thu 24 | P3 | P | موسم الهدايا: اعمل **عرض** لعملائك | Coupons for the gifting season |
| Sat 26 | P2 | R | "معنديش **وقت**" → متجر جاهز في دقيقة | AI builder recap |
| — | P2 | L | The 5 operational problems every Egyptian online seller faces | B2B |

### Wk10 · 28 Dec–3 Jan · BRAND RECAP + 2027

| Day | Pillar | Fmt | Headline | Notes |
|---|---|---|---|---|
| Mon 28 | P1 | R | Brand film re-cut (15s version) | Retarget everyone who watched the campaign |
| Tue 29 | P1 | C | طلبي في 2026: اللي بنيناه للتجار | Features and services launched (real only) |
| Wed 30 | P5 | P | ابدأ **2027** بمتجرك الإلكتروني | |
| Fri 1 Jan | P5 | P | **بدون** رسوم. بدون اشتراك. بدون مبرمج. | Summary |
| Sat 2 | P5 | C | جهّز متجرك لـ**رمضان** من دلوقتي | Bridge to the next campaign (Ramadan ≈ early Feb 2027) |

---

## 7. Hero assets to produce (Proposed)

**Production tools (user rule, 19 Oct 2026):**
- Image posts and carousels: **Canva**. Each carousel pack shares one design system.
- Videos: **built by Claude**, with the voice-over from **Higgsfield**.
- **Higgsfield video** for the complex ones:
  - the brand film's live-action scenes
  - "مشكلة وحلها" skits

Claude-built videos cover the AI demo, dashboard tour, niche demos, feature explainers and "يوم في حياة أوردر" (when real footage or screenshots exist).

| # | Asset | Length | Use |
|---|---|---|---|
| 1 | **Brand film** "لكل صاحب مشروع…" | 45s + 15s + 6s cuts | Awareness ads all campaign, pinned post, YouTube in-stream |
| 2 | **AI demo** (real, uncut, with timer) | 30–40s | Tech hero, ads |
| 3 | **"يوم في حياة متجر"** (create → share → order in dashboard) | 30s | Services/tech hero |
| 4 | **Dashboard tour** | 30s + 3-min YouTube version | Tech depth |
| 5 | **"مشكلة وحلها" skit series** | 15–20s × 8 | TikTok/Reels reach |
| 6 | **Niche demos** (fashion, cosmetics, accessories, food, perfumes) | 20s each | Targeted ads per niche |
| 7 | **Explainer carousel set** (brand, services, integrations, pricing) | 5–7 slides each | Pinned posts + story highlights |

### Real dashboard screenshots → where they go

The user is adding dashboard screenshots to the project files (website builder, templates, apps, wallet, etc.). Following the "real object first" rule, these **replace** symbolic objects. Show them inside a real phone or laptop mockup on the teal circle, and as real screen footage in reels.

| Screenshot | Used in |
|---|---|
| Website builder / AI builder | Wk2 posts + AI demo reel + brand film |
| Templates | Wk2 "قوالب جاهزة" carousel, niche demos |
| Apps / integrations (shipping, payments, social, GA, Meta Pixel) | Wk4–5 integration posts + "كل التطبيقات" carousel |
| Wallet / account statements | Wk8 "أرباحك" |
| Products / Import-Export | Wk8 bulk upload post |
| Orders, coupons, reviews | Wk8 dashboard posts + dashboard tour |
| Shipping & logistics settings | Wk4 + Wk6 |
| Advertise your products | Wk7 boost package |

Before use: blur any real customer names, phone numbers or seller data, and don't show draft or test products as if they were live sellers.

### Brand film script (draft, Proposed)

> [Shop owner closing his shutter at night] "عندك محل…"
> [Girl packing orders on her bed, phone buzzing with DMs] "…ولا بتبيع من الإنستجرام…"
> [Mother cooking, labelling jars] "…ولا لسه بتبدأ من البيت…"
> [Phone screen: the AI builds a store in seconds] "طلبي بيعملك متجرك الإلكتروني في دقيقة، بالـAI."
> [Store link shared, the طلبي marketplace showing the product, shipping & payment integrations ticking on] "متوصل بشركات الشحن وطرق الدفع، ومنتجاتك بتظهر لعملاء طلبي كمان."
> [Store link shared on WhatsApp, orders coming in] "بدون رسوم، بدون اشتراك. 5 جنيه بس لما تبيع."
> [Logo on teal] "**طلبي — إنشاء متاجر إلكترونية.** tallaby.com"

---

## 8. Paid media plan (Proposed — budget to be set by the team)

Awareness-first split:

| Campaign | Platform | Objective | Audience | Creatives | Share |
|---|---|---|---|---|---|
| **Brand reach** | Meta (FB+IG) | Reach / ThruPlay (frequency cap 2–3/week) | Egypt 20–50; small business owners, entrepreneurship, page admins, e-commerce, home business, retail shop interests | Brand film, AI demo, order-journey video | 40% |
| **Pillar engagement** | Meta | Engagement / video views | Same + lookalike of page engagers | Problem skits, services and integrations carousels | 20% |
| **TikTok reach** | TikTok | Reach / video views | 18–35 business and entrepreneurship interests | Skits, niche demos | 15% |
| **YouTube** | Google | Video views (in-stream + Shorts) | Business, entrepreneurship, e-commerce topics; searches for "متجر الكتروني" | Brand film 15s/6s bumper, tutorials | 10% |
| **Search** | Google | Clicks | Branded ("طلبي", "Tallaby") + category keywords | Text ads | 10% |
| **Retargeting** | Meta | Traffic → tallaby.com | 50%+ viewers, engagers, profile visitors (30 days) | FAQ carousel, "فين الفخ؟", how to start | 5% |

**Brand lift (optional):** run a Meta brand-lift study on the brand reach campaign if budget allows (ad recall + awareness question "هل تعرف طلبي؟").

**Search keywords:** `طلبي` · `Tallaby` · `انشاء متجر الكتروني` · `عمل متجر الكتروني مجاني` · `متجر الكتروني بدون برمجة` · `افضل منصة متاجر الكترونية في مصر` · `متجر الكتروني بالذكاء الاصطناعي` · `create online store egypt`. Negatives: `وظائف`, `كورس`, `تحميل`, `pdf`.

### Ad copy (Proposed — same simple caption style)

**Brand**
> طلبي بتعملك متجرك الإلكتروني في دقيقة بالـAI.
> متوصل بشركات الشحن وطرق الدفع، وبيع لكل محافظات مصر.
> بدون رسوم، و5 جنيه بس على الطلب الناجح.
> اعرف أكتر: https://tallaby.com

**Problems**
> المبرمج غالي والاشتراك بالدولار؟
> مع طلبي متجرك جاهز في دقيقة، من غير مبرمج ومن غير اشتراك.
> ابدأ من هنا: https://tallaby.com

**Services**
> متجرك على طلبي مش لوحده.
> منتجاتك بتظهر لعملاء طلبي، وفريقنا معاك على الواتساب.
> https://tallaby.com

**Tech features**
> متجرك متوصل بكل حاجة من أول يوم.
> شركات الشحن، طرق دفع مختلفة، السوشيال ميديا، Google Analytics وميتا بيكسل.
> جرّب بنفسك: https://tallaby.com

---

## 9. Community, PR and partnerships (Proposed)

- **Founder voice:** weekly LinkedIn + occasional talking-head reels ("ليه عملنا طلبي؟"). The fastest way for a young brand to get a face.
- **Business creators:** micro-influencers on entrepreneurship and side hustles make honest "جربت طلبي" videos. Disclose as ads.
- **Facebook groups:** home businesses, Instagram sellers, wholesale markets (العتبة، الموسكي), handmade. Post value, not ads.
- **PR:** pitch Egyptian startup and business media (e.g. Enterprise, Wamda-type outlets, business podcasts) on "AI store builder + marketplace for Egyptian SMEs, pay only 5 ج.م per order". Real facts only.
- **Free online workshop** (Dec): "إزاي تبدأ تبيع أونلاين في مصر": with incubators, universities, entrepreneurship communities.
- **Seller stories** (from Wk8 onward, when real): permission + real results only.

---

## 10. KPIs and weekly review

### Awareness KPIs (primary)

| Metric | Source |
|---|---|
| Reach and frequency in seller audiences | Meta, TikTok, YouTube |
| Video views: 3s, ThruPlay/15s, completion rate of the brand film | Meta, TikTok, YouTube |
| Follower growth per channel | Native insights |
| **Branded search:** "طلبي" / "Tallaby" impressions and clicks | Google Search Console, Google Ads |
| Ad recall lift (if a brand-lift study runs) | Meta |
| Direct and organic traffic to tallaby.com | GA4 |

### Understanding & consideration KPIs (secondary)

Saves, shares, comments (especially questions), profile visits, story highlight views, website visits, WhatsApp chats, sign-ups.

### Pillar performance

Tag every post with its pillar (P1–P5) in the Buffer **Tags** column (create the tags `P1-brand`, `P2-problems`, `P3-services`, `P4-tech`, `P5-pricing` in Buffer first). Compare engagement and reach per pillar every week and shift the mix toward what works.

Targets: set **after Wk1** from real baseline numbers.

**Weekly review (every Sunday):** top 3 and bottom 3 posts, pillar comparison, reach and frequency, cost per 1,000 reached and cost per ThruPlay, the 5 most common comments and DM questions (each becomes next week's "اسأل طلبي" content), creative refresh decisions.

---

## 11. Production checklist (per asset)

- [ ] Pillar chosen (P1–P5); gold label = series name
- [ ] Fact matches the §2 labels (no card, no 5% next to 5 ج.م, AI timing verified, no fulfillment claims)
- [ ] Design per `SOCIAL_DESIGN_CONTEXT.md` (simple style, one highlighted word, rotated background, real object first)
- [ ] Caption: hook → 2–4 ✦ benefits → CTA + **tallaby.com**
- [ ] Hashtags: `#طلبي #Tallaby` + pillar/topic
- [ ] Buffer row (UTF-8 BOM, Cairo time, pillar tag)
- [ ] Logged in the design log

---

## 12. Open questions for the team

1. Is **5 ج.م** replacing **5%** for every seller from now on? (Campaign assumes yes, per the user, 19 Oct 2026.)
2. How long does the AI builder really take, and what exactly does it generate?
3. Which shipping companies are integrated, and which payment methods can a seller switch on today?
4. Is the Meta catalog sync automatic? Is social media integration just links, or shop syncing?
5. (Fulfillment paused 20 Oct 2026; no packing/rider footage needed.)
6. Monthly paid budget for Nov and Dec? Budget for a brand film shoot?
7. Who is the founder/team face for talking-head content?

---

## Sources (competitor research, Oct 2026)

- EasyOrders official site: https://www.easyorders.eg/en/ and https://www.easyorders.ai/en/
- Shopify pricing summary (NerdWallet, 2026): https://www.nerdwallet.com/article/small-business/shopify-pricing
- Internal: `Tallaby-Seller-Partnership-AR.pdf`, `Website Screenshots/Seller-Dashboard-*.png`, project docs
