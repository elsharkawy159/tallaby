---
id: T-13
slug: update-stock
feature: Update stock quickly
roadmap: "F-10 Stock history and quick restock (Products › Inventory, migration 0125)"
dashboard_path: /stores/[storeId]/products/inventory
status: draft
duration_seconds: 31.5
voice: "Hanafi – Educational – Egyptian (DWMVT5WflKt0P8OPpIrY), eleven_v4, generation Y9bKR2YeXCYWiDroDk6p"
made_on: 2026-11-18
youtube_url:
youtube_title_ar: "طريقة تحديث المخزون بسرعة على طلبي #Shorts"
youtube_title_en: "How to update your stock quickly on Tallaby #Shorts"
---

## Steps shown

| Time | Step | What happens on screen | Voice |
|---|---|---|---|
| 0–4.9 s | Title card | "تحديث المخزون بسرعة", label "شرح سريع" | 0.30–4.45 s «هنحدّث كمية المخزون على طلبي، في أربع خطوات بسيطة.» |
| 4.9–9.0 s | 1. اضغط «السجل» تحت اسم المنتج | The page "المخزون" with "قارب على النفاد أو نفد (2)": "كوب سيراميك" (نفد من المخزون) and "شمعة معطّرة" (بقيت 2 قطعة). Tap "السجل" under the mug's name; the card "سجل المخزون · كوب سيراميك" opens on top with the product's line and its history | 5.20–8.37 s «واحد: اضغط السجل تحت اسم المنتج.» |
| 9.0–14.2 s | 2. اكتب عدد القطع المضافة | Push in (1.12×) on the line; tap "+ كمية" and type 20; "إضافة" becomes active | 9.30–13.55 s «اتنين: اكتب عدد القطع اللي وصلت، زي عشرين قطعة.» |
| 14.2–19.4 s | 3. اضغط «إضافة» | Tap "إضافة"; the toast "كوب سيراميك: أصبح المخزون 20", the badge turns to "بقيت 20 قطعة", the field clears, a new row is on top of the history, the mug leaves the low-stock list (count 1) | 14.50–18.57 s «تلاتة: اضغط إضافة، والمخزون هيتحدّث على طول.» |
| 19.4–23.4 s | 4. راجع التغيير في سجل المخزون | Scroll so the line and the history are in view; highlight the new row "تعديل · 18/11/2026، 11:05 ص · بواسطتك", "+20", "المخزون: 20" | 19.70–22.73 s «أربعة: راجع التغيير في سجل المخزون.» |
| 23.4–28.9 s | Result | The line "بقيت 20 قطعة" and the history row; the gold check on the new row | 23.70–28.51 s «وكده المخزون بقى عشرين قطعة، وكل تغيير بيتسجّل في السجل.» |
| 28.9–31.5 s | End card | "جرّبها الآن من لوحة التحكم", "المنتجات ‹ المخزون" | Nothing is spoken |

## Voiceover script (with diacritics, exactly as generated)

هنحدّث كَمّية المخزون على طَلَبي، في أربع خطوات بسيطة. واحد: اضغَط السِّجِلّ تحت اسم المُنتَج. اتنين: اكتِب عدد القِطَع اللي وصلت، زي عشرين قِطعة. تلاتة: اضغَط إضافة، والمخزون هيتحدّث على طول. أربعة: راجع التغيير في سِجِلّ المخزون. وكده المخزون بقى عشرين قِطعة، وكل تغيير بيتسجّل في السِّجِلّ.

47 words. Voice: Hanafi – Educational – Egyptian (`DWMVT5WflKt0P8OPpIrY`), `eleven_v4`, no tags, one generation (`Y9bKR2YeXCYWiDroDk6p`, 293 credits, ElevenLabs flow `c79cyQUdkbj07XyMydUL`). The take is `work/vo/take.mp3` (23.5 s), cut inside its pauses at 4.15, 7.32, 11.57, 15.64 and 18.67 s and placed one sentence per beat; it is not sped up or stretched. The transcript (`eleven_scribe_v1`) matched the script word for word (47 words), with no laugh marker; like the earlier videos it returned the script's diacritics, so it may lean on the text. **Nobody has listened to it yet**: someone who can listen must confirm it sounds calm and natural (and that "السِّجِلّ", "قِطعة" and "على طول" sound right) before `status` becomes `ready`.

## YouTube description (Arabic)

طريقة زيادة مخزون منتج من صفحة المخزون في لوحة تحكم طلبي، ومتابعة كل تغيير في سجل المخزون.

1. اضغط «السجل» تحت اسم المنتج.
2. اكتب عدد القطع المضافة.
3. اضغط «إضافة».
4. راجع التغيير في سجل المخزون.

https://tallaby.com

## Caption / post text

حدّث مخزونك في 4 خطوات: اضغط «السجل» على المنتج، اكتب عدد القطع المضافة، اضغط «إضافة»، وراجع التغيير في سجل المخزون. كل تغيير يُسجَّل بالكمية والوقت ومن قام به.

## Tags

طلبي, Tallaby, المخزون, سجل المخزون, إدارة المخزون, لوحة التحكم, متجر إلكتروني, شرح, البيع أونلاين, مصر

## Notes

**Source files checked (2026-11-18, `main` at `e83777bf`):** `apps/dashboard/app/[locale]/(main)/stores/[storeId]/products/inventory/` (`page.tsx`, `inventory.client.tsx`, `inventory.server.ts`, `inventory.data.ts`, `inventory.lib.ts`, `inventory.types.ts`, `stock-history-link.client.tsx`), `components/seller-ui/{layout,display,fields,buttons}.tsx`, `lib/i18n/format.ts` (`formatDateTime`), `components/dashboard/sidebar.config.ts` and `messages/ar.json` (`products.inventory`, `nav`). Every label in the video is the string from `ar.json`.

**Where the real page differs from the outline in TUTORIALS.md §11** ("Change a quantity → save → the stock history"):

- The page does not set a quantity: each line has a "+ كمية" field and an "إضافة" button that **add** units (`restockAction`, `quantity + n`, 1 to 100000). There is no reason to pick; the 0125 trigger records the change as "تعديل" with "بواسطتك". So the video adds 20 to an out-of-stock product (0 → 20) and the voice says "عدد القطع اللي وصلت". Setting an exact number is done in the product form or bulk edit, not here.
- There is no separate save: "إضافة" saves at once and shows the toast "{title}: أصبح المخزون {stock}".
- The list on the page only shows lines at or under their alert number ("قارب على النفاد أو نفد"); a line that goes above it leaves the list after the save. The history opens from "السجل" under a product's name (`?product=<id>`, also from the product edit page and the low_stock bell), as a card on top of the page with the product's own line (same "+ كمية" / "إضافة") and its movements, newest first. The video restocks from that card so the new history row is seen right after the save.

**Simplified or not shown:**

- The "عملاء ينتظرون عودته" back-in-stock count is not shown on the out-of-stock line.
- The history has four rows (the new one, two sales with order numbers and an older edit); the real one shows up to 100.
- The real page navigates when "السجل" is pressed; the video fades the history card in on the same page.
- The toast sits at the bottom of the screen, where the real one is, so the Shorts buttons may cover it; the badge, the history row and the check are in the safe area.
- During step 2 the page is pushed in 1.12×, so the top bar and the page edges are briefly out of frame.

**Fictional data:** store "متجر نور" (top bar wallet "$5.00" from the kit); products "كوب سيراميك" (0 → 20, alert at 5) and "شمعة معطّرة" (2, alert at 5), drawn as simple shapes; orders #1042 and #1038; dates 14–18/11/2026.

**Sound:** voice in front, the five kit sounds under it, no music. The finished video measures -16.1 LUFS and -2.4 dBTP; the voice alone -16.1 LUFS (peak -2.4 dBFS), the sounds alone -34 LUFS and -18 dBFS (17.9 dB under the voice). One gain (+10.2 dB) on the whole take; the limiter (-2.5 dBFS ceiling) touches 0.07% of samples (4.0 dB on the tallest peak).

**Checks:** `hyperframes check`: 0 errors; the warnings are the kit's usual ones (one generated composition, nested overlay clips, duplicate logo image), the dead stretch on the title card (1.1–4.75 s, the deliberate hold for the opening line) and a layout warning that the title card's text reaches TikTok's right-edge zone (kit title card; not a YouTube Shorts zone).

**Not checked:** the page was read in the code, not opened on production. Do that before changing `status` to `ready`. The sound was measured, not listened to.

**Rebuild:** `node "Tutorial Videos/_kit/build.mjs" "Tutorial Videos/T-13-update-stock"`, render in `work/` (`npx hyperframes render --quality delivery --crf 18 --fps 30 --workers 1 --output renders/raw.mp4`), then `node "Tutorial Videos/_kit/finish.mjs" "Tutorial Videos/T-13-update-stock"` (see `_kit/README.md`).
