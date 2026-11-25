---
name: content-writer
description: Write, rewrite or simplify Tallaby (طلبي) marketing and product copy in Arabic and English. Use it whenever the task touches words a seller or visitor reads - tallaby.com page copy, homepage or landing sections, hero headlines and sublines, CTAs, feature blurbs, pricing and FAQ answers, comparison and industry pages, dashboard UI microcopy, labels, tooltips, errors and empty states, seller emails and bell or push notifications - and whenever someone says the copy is too long, wordy, unclear or "make this simpler", even if they never say "copy". Do not use it for marketing videos or voiceovers (brag-slim and TALLABY_VIDEO_RULES.md cover those), for the product descriptions the in-app AI generates (docs/ai.md covers those), or for the demo copy inside storefront templates and section designs (template-copywriter covers that).
---

# Tallaby content writer

Tallaby (Arabic **طلبي**, never تالابي) helps small sellers, mostly in Egypt and the Arab world, open their own online store and sell anywhere. Don't frame Tallaby as Egypt-only (owner, 2026-11-15). The reader is a busy seller, often on a phone, who is not technical. Good copy tells them in one glance what they get and what to do next.

Storefront template and section demo copy (what a seller's customers read) has its own rules in the [`template-copywriter`](../template-copywriter/SKILL.md) skill; the word choices in §1 apply there too.

Before writing, read [`FACTS.md`](FACTS.md) in this folder. It holds the live product facts, the prices and the claims you must never make, each with its source file. Facts change often, so re-check any fact you put on a page against its source; when the code and a doc disagree, the code wins (`CLAUDE.md` rule 1).

## 1. Voice

- **Arabic first.** Write the Arabic, then the English. Arabic is the default locale (`CLAUDE.md` rule 13).
- **Register: simple Modern Standard Arabic** on tallaby.com and in the dashboard. This is the owner's rule in `docs/marketing-site-rules.md` (Copy), and every `apps/ecommerce/messages/marketing/*.ar.json` and `apps/dashboard/messages/ar.json` string follows it. Simple means short words a seller uses every day, not newspaper Arabic. Egyptian dialect belongs to videos and social posts, which other skills cover.
- **Owner word choices (2026-11-06):** use الهاتف، التاجر، جنيه، البريد الإلكتروني، النطاق، العلامة التجارية، يمكنك، هل يمكنني. Never use الجوال، موبايل، البائع، إيميل، دومين، براند، إزاي، عشان، مفيش، بتاع, even if a design file does. Currency is "350 جنيه", never ج.م. The editor is "Drag & Drop" in Arabic too, never السحب والإفلات (owner, 2026-11-25).
- **English mirrors the meaning, not the words.** Natural English, sentence case, plain verbs, no em dashes in body copy, no emoji. If the Arabic needs two clauses and the English needs one, that is fine.
- **Short sentences, one idea each.** Lead with the benefit to the seller, then the how. "Take orders from day one" beats "A powerful order management system".
- **Concrete over clever.** A number, a named tool (Bosta, InstaPay, Paymob) or a short example beats an adjective. No hype words: no "revolutionary", "powerful", "seamless", "best", "ultimate", "ثوري"، "الأقوى"، "الأفضل". Don't invent slogans.
- **No jargon a small seller wouldn't know.** Say "your store's link" before "subdomain", "people who saw your store" before "sessions". Keep brand and tool names in Latin script (Bosta, Kashier, Excel); in JSX they go inside `Ltr`, digits inside `Num`.
- **Professional, never cute.** No puns, no double meanings, no jokes at the seller's expense.

## 2. Clarity rules (use these when simplifying)

1. **One message per section.** If you can't say the section's point in one short sentence, it is two sections or none.
2. **Headline ≤ about 8 words.** Subline ≤ about 20 words. Body paragraphs ≤ about 2 sentences. Arabic runs a little longer than English; that's fine.
3. **Cut adjectives and repeats.** Delete any word that changes nothing. If two sentences say the same thing, keep the clearer one.
4. **Prefer a number or an example to a claim.** "Free plan: about جنيه ونصف per order" beats "affordable pricing".
5. **Every section earns its place.** If it repeats another section, merge them or delete it. Fewer, sharper sections beat a long page.
6. **One primary CTA per page** (usually "create your store"). Other links are secondary and look it. Keep the CTA verb the same wherever it repeats.
7. **Scannable lists of at most about 5 items.** Six or more: group them or cut the weakest.
8. **Keep the facts that matter.** Simplifying never drops a condition the seller needs (the first top-up, "whichever comes first", an app's cost shown in the dashboard). Cut words, not truth.
9. **Placeholders stay.** Keep ICU placeholders and plurals (`{days}`, `{orderFee}`, `{count, plural, ...}`) exactly as they are, and write the full Arabic plural forms (one, two, few, many, other).

### Before / after (real string: `home.what.points.free.body`)

Before (AR, 41 words):
> أنشئ متجرك دون اشتراك ودون بطاقة ائتمان، واستقبل الطلبات من اليوم الأول. ثم اشحن محفظتك أول مرة خلال {days} يومًا أو عند وصول أول طلب، أيهما أسبق، لتواصل رؤية الطلبات الجديدة. ويمكنك الانتقال إلى خطة Pro بسعر شهري ثابت متى شئت.

After (AR):
> افتح متجرك دون اشتراك أو بطاقة، واستقبل الطلبات من اليوم الأول. اشحن محفظتك أول مرة خلال {days} يومًا أو مع أول طلب، أيهما أسبق، لتواصل رؤية الطلبات.

Before (EN):
> Open your store with no subscription and no card, and take orders from day one. Then make a first top-up within {days} days or when your first order arrives, whichever comes first, to keep seeing new orders. Move to Pro's fixed monthly price whenever you like.

After (EN):
> Open your store with no subscription and no card, and take orders from day one. Top up once within {days} days or by your first order, whichever comes first, to keep seeing orders.

Why: the Pro sentence is a second message that the pricing section already makes, so it goes. The top-up condition and "whichever comes first" stay because they are facts the seller needs. `{days}` stays a placeholder because the number comes from code.

## 3. Where strings go

- **tallaby.com:** `apps/ecommerce/messages/marketing/<group>.ar.json` and `<group>.en.json`, in the page's own group (`site`, `home`, `pricing`, `features`, `faq`, `compare`, `industries`, …; full list in `docs/marketing-site-rules.md`, Messages). Edit only your page's group. Both files always get the same keys. A component also used by the storefront `(shop)` keeps its strings in the base `apps/ecommerce/messages/ar.json`/`en.json`.
- **Dashboard:** `apps/dashboard/messages/ar.json` and `en.json`, both, same keys (`CLAUDE.md` rule 13).
- **Never hard-code copy in a component**, not even "temporarily". Numbers that come from code (fees, top-up minimum, grace days, template count) are passed in as placeholders, never typed into the string, so the copy can't drift from the product.
- **Seller emails and notifications:** find the existing template or message keys first (grep the key or the current text) and edit them in place, in both locales.

## 4. Using a competitor as a reference

When the owner points at a competitor (Shopify, EasyOrders, Zid, YouCan, …), study only its **structure, section count, density and tone**: how many sections, how long the headlines are, where the CTA sits, how it handles pricing questions. Then write Tallaby's page from Tallaby's facts. Never copy their wording, claims, numbers, layout or design, and never imply a feature Tallaby has just because they have it. Comparison pages follow `apps/ecommerce/lib/marketing/compare.lib.ts`, whose competitor facts expire after 90 days.

## 5. Workflow

1. Read the current strings (both locales) and the component that renders them, so you know every key in play and how long each slot can be.
2. Check each fact you will keep or add against `FACTS.md` and its source. If a claim can't be confirmed, remove it and say so in your report.
3. Write the Arabic, then the English, applying sections 1 and 2.
4. Run the checklist below, then report what changed and any claim you removed or couldn't verify.

## 6. Checklist before finishing

- [ ] Both locales changed, with identical key sets (no key in one file only).
- [ ] Every claim is live today (see `FACTS.md`), with no invented numbers, sellers, testimonials, ratings or logos.
- [ ] Owner word choices used; currency written as "جنيه"; no banned words.
- [ ] Headlines ≤ ~8 words, sublines ≤ ~20, lists ≤ ~5 items; one primary CTA on the page.
- [ ] Placeholders and plural forms intact; code-owned numbers come in as placeholders.
- [ ] Removed a section? Delete its keys from both JSON files and check nothing else uses them (`grep -rn "<key>" apps/`).
- [ ] Tests that read copy still pass: run `pnpm --filter ecommerce test` (or `dashboard`); marketing parity and copy tests live in `apps/ecommerce/lib/marketing/*.test.ts` and `apps/ecommerce/components/marketing/**/*.test.ts(x)`. Update a snapshot only when the copy change is intended.
- [ ] Only your own files changed (`git status`); never touch others' uncommitted work (`CLAUDE.md` rule 16).
