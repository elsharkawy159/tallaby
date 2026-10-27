# QA: F-01 Coupons tutorial (rules §10)

- [x] **ffprobe** (`brag.mp4`): `h264 High 1080x1920 yuv420p 30/1` + `aac LC 48000 Hz 2 ch 192 kb/s`, duration 36.01 s, size 6.3 MB (6,335,538 B), faststart on (`moov` at byte 36, `mdat` at 39,876). Duration 36 s: over the 20–35 s default but inside the tutorial allowance (brief: up to 45 s; topic asked 28–40 s).
- [x] **Loudness** (ffmpeg ebur128 on the final file): integrated −14.3 LUFS, true peak −1.1 dBFS. Music ducked −11 dB under the voice (sidechain, `work/mix.py`).
- [x] **Stills** checked (`work/snap2`, `work/snap3`, `work/snap4`, `work/final/sheet.png`): Arabic shaping correct (Noto Kufi Arabic woff2, real browser), Latin digits only, everything centred on x = 540 (phone x 280–800, text boxes x 130–950).
  - Note: during the push-ins (phone scaled up to 1.2 from its top edge, dash 4.2–13.6 s local and checkout) the lower part of the phone UI (sheet footer buttons, empty page area) goes below y 1500. Captions, headlines, logo and CTA never leave the safe box; the phone's key field is always above y 1500.
- [x] No "متجرك الشامل", no "اللينك في البايو"; link shown is `tallaby.com`; closing line "جهّز أول عرض ليك على طَلَبي دوت كوم." (button "جهّز أول عرض") is new vs the last 5 videos (وفّر وقتك / متجرك مستنيك / ابدأ النهارده / صمّم متجرك / إفتح متجرك دلوقتي); one steady tone, no emotion tags.
- [x] Hook spoken from 0.10 s ("عرض نهاية الأسبوع؟") and on screen at frame 0; CTA on screen 31.8–36.0 s (4.2 s, fully settled from ~32.5 s → 3.5 s hold).
- [x] Captions match the voiceover word for word, with two renderings: the spoken step numbers (واحد/اتنين/تلاتة/أربعة) are shown as the gold badges 1–4, and "خمستاشر" is captioned "15". The hook, season line and closing line are the on-screen headlines themselves. طلبي pronounced correctly (transcript: "طلبي.com").
- [x] No invented stats, no Planned features (coupons page, editor fields, storefront-only scope, checkout coupon field are all in the code), no real data (store "قهوة نور", codes WEEKEND15 / SUMMER10 / WINTER10 / NEWYEAR, prices fictional). Discount maths follow `place-order.ts`: 15% of the 600 ج.م product subtotal = 90; shipping 60 untouched; total 660 → 570 ج.م. No card payment (only "الدفع عند الاستلام" shown), no free shipping. No sale date named; "مواسم آخر السنة جاية" only. "10 ثواني" not used (the real form needs code, name, value and dates).
- [x] Brand: teal #145163, gold #fdad28 (badges, caption highlight, CTA with dark text), off-white; Noto Kufi Arabic + Montserrat; real logo files (`apps/ecommerce/public/logo-primary.png`, `logo-white.png`). Frame 0 = baked poster (`brag.jpg`, taken at 2.5 s: headline, coupon ticket, 4 step badges).
- [x] Banned innuendo list re-read against VO, captions, on-screen text and post: none present (verbs used: افتح، اضغط، اكتب، اختار، حدد، جهّز). Pain bubbles: "فيه خصم على الطقم؟" / "بكام بعد الخصم؟" / "ثواني، بحسب…".
- [x] Phone mockup: 520 × 1095 px body (ratio 0.475), 14 px bezel, screen 492 × 1067 rendering a 390 × 846 UI (ratio 0.461, uniform scale 1.2615, never stretched), dynamic island, soft shadow.
- [x] Made with the full `/brag` workflow: `brag-plan.md`, `composition-brief.md`, Hyperframes composition in `composition/`, `npx hyperframes check` → ok (0 errors; remaining warnings: small in-phone UI text under the 28 px craft floor, placeholder-grey contrast copied from the real UI).

## Voiceover
- Voice **Tamer** (`mX8opBj7bbi4G2cE9j2w`), model **eleven_v4**, connector ElevenLabs_2, flow `QNVmeEiPYzB3yk3oOqEp`, generation `tUsUPK688LazOwLF3xnS` (24.56 s). **One take only**: the second take of that call hit a 429.
- History: first connector call (long 414-char script) → one take failed on quota (346 credits left), the other 429; second connector → 429 twice; script trimmed to 308 characters; the next call produced the take above.
- Transcript: ElevenLabs Scribe returned 429 (twice), `hyperframes transcribe` has no whisper-cpp here, so a local faster-whisper **medium** model was used (`work/transcript.json`): "عرض نهاية الأسبوع؟ يلنا نجهز الكبون في أربع حطوات. 1. افتح الكبونات واضغط إنشاء كبون. 2. اكتب الكود واسم العرض. 3. اختار الخصم 15% وحدد المدة. 4. اضغط إنشاء الكبون. الزبون يكتب الكود وهو بيدفع والخصم يتحسب لوحده. مواسم آخر السنة جاية. جهز أول عرض ليك على طلبي.com" — matches the script (whisper spells colloquial "كوبون" as "كبون" and "يلا" as "يلنا"; numbers as digits). Word timings from this transcript drive the captions.

## Not done / skipped
- Canva: not used.
- Only one VO take, so no A/B take choice.
