# Brag Plan: طلبي (Tallaby) — F-01 Coupons and discounts (tutorial)

## What is this app?
طلبي gives Egyptian sellers their own online store; the seller dashboard has a real Coupons page (`apps/dashboard/app/(main)/coupons`) where a seller creates a code that works on their own store, and the storefront checkout (`apps/ecommerce/components/order-summary`) applies it.

## The angle
A calm "How do I…?" tutorial in 4 numbered steps: from DM discount maths to a real coupon code that the store applies by itself. Light end-of-year angle: "مواسم آخر السنة جاية، جهّز عروضك من دلوقتي" (no dates, no promised results).

## Hook (first 2-3 seconds)
"عرض نهاية الأسبوع؟ جاهز في 4 خطوات" on brand teal, a gold coupon ticket `WEEKEND15 · 15%` pops in. VO in the first second: "عرض نهاية الأسبوع؟ يلا نجهّز الكوبون في أربع خطوات."
"10 ثواني" is NOT used: the real form needs a code, a name, a value and dates (validateCouponForm), so a seconds claim is not safe.

## Key moments (the middle)
- Pain: DM bubbles "عامل خصم؟" / "كام بعد الخصم؟" and a hand calculation "600 − 15% = ؟" crossed out.
- Step 1: sidebar group "العروض والخصومات" › "الكوبونات", page intro "امنح عملاءك كودًا يخصم من سعر منتجاتك على متجرك الخاص." and a tap on "إنشاء كوبون".
- Step 2: editor sheet "إنشاء كوبون": "الكود" typed `WEEKEND15`, "الاسم" typed "عرض نهاية الأسبوع"; the live preview "ما يحصل عليه العميل" updates.
- Step 3: "الخصم" toggle "نسبة مئوية", "نسبة الخصم" 15, "فترة التفعيل" يبدأ / ينتهي.
- Step 4: tap "إنشاء الكوبون" → toast "تم إنشاء الكوبون" → list row: ticket 15% خصم, WEEKEND15, "كل منتجاتك، متجرك فقط", status "ساري".

## Outro / punchline
Customer checkout on the store ("ملخص الطلب"): types WEEKEND15 in "أدخل كود الكوبون", taps "تطبيق", toast "تم تطبيق الكوبون بنجاح!", row "الخصم WEEKEND15 (15%) −90 ج.م", total 660 → 570 ج.م (products 600 → 510, shipping 60 unchanged — seller coupons only discount the seller's products, per `place-order.ts`). Then "جهّز عروضك من دلوقتي" and the end card: logo, gold button "جهّز أول عرض", tallaby.com. VO: "جهّز أول عرض ليك على طَلَبي دوت كوم."

## User flow worth showing
Coupons page → create form (code, name, percentage, dates) → coupon live in the list → customer applies it at checkout and the total drops.

## Tone
- Preset: polished (app-store clean feature-tutorial)
- Creative direction: calm Egyptian tutorial, numbered steps, premium launch-film look
- Interpretation: steady pacing, one step per scene, every label held long enough to read, no hype.

## Format: vertical — 1080x1920, 30 fps
## Duration: 36.0 s (tutorial; the topic allows 28–40 s)

## Visual identity (from the project)
- Background: teal #145163 → #0e3d4b gradient
- Accent: gold #fdad28 (CTA, step badges, caption highlight), dark text on gold
- Text: white on teal, #1f2a2e on off-white #fafaf8
- Display font: Noto Kufi Arabic 700/800; Latin: Montserrat
- Strongest visual element: the real coupon ticket stub (`coupon-ticket.tsx`) with perforated edge and punched notches

## Share copy (draft)
عرض نهاية الأسبوع؟ جاهز في 4 خطوات. اعمل كوبون خصم لمتجرك، والزبون يكتبه وهو بيدفع.

## Audio direction
- Role: warm bed under a clear voiceover
- Music: original numpy synth, Egyptian maqsum doum-tak, ~108 BPM, warm pad + soft bass
- Music treatment: ducked ~11 dB under the voice, up in gaps and the last 2 s; bell on the logo
- Music cue guidance: original track, grid known from the synth (beat = 60/108 s); step cuts land on beats where it doesn't hurt reading
- Audio-reactive treatment: subtle; background glow breathes slowly (time-based, no waveform visuals)
- SFX posture: sparse; soft tap on simulated taps, light key ticks on typing, whoosh on scene cuts, a chime on "تم إنشاء الكوبون" and "تم تطبيق الكوبون"
- Restraint rule: nothing louder than the voice; no stingers

## Voiceover script (as generated: Tamer, eleven_v4, no tags)
The first, longer draft (with a spoken pain line and "والكود يشتغل على متجرك") could not be generated: the first ElevenLabs connector had 346 credits left (414 needed) and both connectors returned 429s. The script was trimmed to 308 characters; the pain beat is now on-screen text only.

عرض نهاية الأسبوع؟ يلا نجهّز الكوبون في أربع خطوات. واحد: افتح الكوبونات، واضغط إنشاء كوبون. اتنين: اكتب الكود، واسم العرض. تلاتة: اختار الخصم، خمستاشر في المية، وحدد المدة. أربعة: اضغط إنشاء الكوبون. الزبون يكتب الكود وهو بيدفع، والخصم يتحسب لوحده. مواسم آخر السنة جاية. جهّز أول عرض ليك على طَلَبي دوت كوم.

The take (24.56 s) is cut at its natural pauses and each sentence is placed on its scene (see work/vo_chunks.json).

## Storyboard (final timings, 36.0 s)
0–4.0 hook · 4.0–6.4 pain · 6.4–23.2 dashboard (step 1 6.4, step 2 10.9, step 3 15.1, step 4 19.5) · 23.2–29.2 checkout · 29.2–31.8 season · 31.8–36.0 CTA
### Scene 1 — Hook — ~3 s
Headline + gold coupon ticket pop. Sequential: ticket slides in, "15%" stamps. Audio: whoosh + tap. Transition: slide+blur.
### Scene 2 — Pain — ~3 s
Two DM bubbles arrive one by one, hand calculation crossed out. Audio: two soft message pops.
### Scene 3 — Step 1 — ~4 s
Phone with the dashboard: menu group opens, "الكوبونات" highlighted, page with "إنشاء كوبون"; tap ripple. Step badge "1".
### Scene 4 — Step 2 — ~4 s
Sheet slides in; code typed with key ticks, name typed; preview ticket updates. Badge "2".
### Scene 5 — Step 3 — ~4.5 s
Discount toggle, 15 typed, dates field highlight. Badge "3".
### Scene 6 — Step 4 — ~4 s
Tap "إنشاء الكوبون", toast, list row lands. Badge "4". Chime.
### Scene 7 — Customer checkout — ~5 s
Store checkout summary, code typed, تطبيق, discount row + total drop 660 → 570. Chime.
### Scene 8 — Season — ~3 s
"جهّز عروضك من دلوقتي" with three ticket stubs.
### Scene 9 — CTA — ~3.5 s (held ≥ 2.5 s)
Logo, gold button "جهّز أول عرض", tallaby.com. Bell. Loops back to the teal hook.

**Music mood:** warm, confident, Egyptian groove.
**Audio summary:** a soft doum-tak bed under one calm voice, small UI sounds on every tap, a bell on the logo.
