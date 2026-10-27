# Tallaby video rules (طلبي)

These rules apply to every `/brag-slim` video made for Tallaby. Where they conflict with `SKILL.md`, **these rules win**. Everything in `SKILL.md` that these rules don't change still applies (inspect → plan → build → check → deliver, "show the thing", readability, poster frame).

Goal: every video should look like it came from a serious, well-funded Egyptian tech company, and make a small Egyptian seller think "I want my store on طلبي today."

---

## 1. Facts and brand (non-negotiable)

- **Source of truth:** `MARKETING_PROJECT.md` (Confirmed beats Proposed; never use anything marked Avoid), then `PROJECT_DESCRIPTION.md`. Before claiming a feature, check the code: only show **Live** features, never "Planned" ones.
- **Brand name:** Arabic **طلبي** (pronounced *ṭalabi*), never **تالابي**. Latin **Tallaby** / **tallaby.com**.
- **No slogan in videos:** never say or show **"متجرك الشامل"** in a video (voiceover, captions, end card) (owner, 2026-10-24). Don't invent other slogans either.
- **Never** invent numbers, stats, testimonials, awards, customer names or quotes. Never promise card payment or "free shipping over 500 EGP" (both are switched off). Delivery times are estimates, never guarantees.
- **No real data on screen:** no real seller, customer, phone number (except the official support number), email or order. Use fictional Egyptian stand-ins (store names like "متجر نور", "بيت الكروشيه", "Koko Kids"; prices like `299 ج.م`).
- **Link shown everywhere:** **`tallaby.com`** (never `tallaby.com/sell`) on the end card and in post text (owner, 2026-10-25).
- **Colors:** primary teal `#145163`, accent gold `#fdad28` (CTA buttons, badges, price tags, with dark text), off-white `#fafaf8`, white. Nothing off-palette that clashes.
- **Fonts:** Arabic **Noto Kufi Arabic** (400–700), Latin **Montserrat** (400–700). No decorative script fonts.
- **Logo:** the real files from the repo (`apps/*/public/logo*`, see `MARKETING_PROJECT.md` §8). White logo on teal or dark, primary logo on light. Never redraw or stretch it.
- **Numbers:** Latin digits (0–9), never Arabic-Indic (٠١٢). Prices as `299 ج.م`.

- **Professional ideas only** (owner, 2026-10-25): every idea is framed as a business outcome for a serious seller (more orders, less time in DMs, a store that looks like a big brand, delivery handled). No slapstick, no puns, no double meanings, no playful commands aimed at the viewer.
- **Banned words and phrases (owner, 2026-10-25):** in Egypt these read as sexual innuendo, so they are **never** said, shown, captioned or written in the post, in any form (any pronoun, tense or spelling):
  - "خليها تتحرك", "خلّيه يتحرك", "حرّكها", "حرّكه"
  - "كبّرها", "كبّره", "طوّلها", "تخنها"
  - "تحطها فين؟", "هتحطه فين؟", "حطه", "حطها", "حطّه في البايو"
  - "تاخد فين؟", "خدها", "خده", "اديك فين؟", "اديها"
  - "دخّله", "دخّلها", "طلّعه", "نزّله", "ركّبه", "ركّبها"
  - any question built on "فين؟" about putting, taking or giving, and any imperative verb with a "-ها/-ه" object aimed at the viewer.
  - Use neutral business verbs instead: "اعرض", "ضيف", "غيّر", "اختار", "رتّب", "شوف", "انشر", "ابدأ", "جرّب". Example: not "حطه في البايو" but "شاركه مع زباينك"; not "خلّيه يتحرك" but "بانر بيتقلب لوحده".
  - Before generating the voiceover and before posting, read the script, captions, on-screen text and caption once more only for this list, and rewrite any line that comes close.

## 2. Who the video is for

Small and medium Egyptian sellers who sell today through Facebook, Instagram and WhatsApp. They take orders in DMs and want a real store link without any technical work. Talk to their real pains:

- "Every order is a long DM chat, and customers get lost."
- "I have no proper link to put in my bio."
- "Delivery and cash on delivery are a headache."
- "I want a store that looks like a big brand's."

Every video answers one pain with one طلبي feature, shown working.

## 3. Format and technical specs

**Where videos go:** every run writes to its own `Marketing Videos/brag-output-YYYY-MM-DD-HHmmss/` folder at the repo root (one numbered subfolder per video when a run makes several). The daily Buffer job picks videos up from `Marketing Videos/`, so put finished videos only there, each with `brag.mp4`, `brag.jpg`, `share-copy.txt` and `content.md`.

One master file works for Instagram Reels, Facebook Reels and TikTok:

| Setting | Value |
|---|---|
| Aspect / size | **9:16 vertical, 1080×1920** (always, unless told otherwise) |
| Frame rate | **30 fps** constant |
| Duration | **20–35 s** (sweet spot 25–30 s with voiceover). Hard limits: at least 5 s, at most 60 s |
| Video codec | H.264 High profile, `yuv420p`, CRF 18 or about 10 Mbps, `-movflags +faststart` |
| Audio | AAC, 48 kHz, stereo, 192 kbps |
| File size | **under 45 MB** (storage limit is 50 MB) |
| Container | `.mp4` |

**Safe zones:** the app UI covers parts of a Reel, so keep all text, faces, the logo and the CTA inside the centre safe area:
- top 220 px: no text (account name and audio label)
- bottom 420 px: no text (caption, buttons)
- left **and** right 130 px: no text (like/comment/share icons sit on the right; keep the margins equal)
- That leaves a safe box of about **820×1280 px** (x 130–950, y 220–1500).
- **Everything is centred on the frame's vertical axis (x = 540)** (owner, 2026-10-24): every headline, caption, phone, card, logo and button is horizontally centred, with equal left and right margins. Never shift the layout towards one side to dodge the icons; shrink it instead. Check stills for left/right balance before rendering.

**Cover frame:** frame 0 (the poster, per `SKILL.md`) must be a strong, settled frame with a short Arabic headline (3–5 words) inside the safe box. It is also the grid thumbnail on Instagram, so it must read when cropped to 4:5 and 1:1 around the centre.

## 4. Video flow (structure)

| Time | Beat | What happens |
|---|---|---|
| **0–2 s** | **Hook** | Motion in the very first frame. A bold statement, question or before/after. No logo intro, no "مرحبا", no slow fade-in. |
| 2–6 s | **The pain** | The seller's real problem, shown (a messy WhatsApp chat, a notebook full of orders). Keep it fast. |
| 6–22 s | **The solution, in use** | The real طلبي UI doing the job: entry → key action → result (for example: pick a template → add a product → store live at `nour.tallaby.com`). 2–3 beats, each with one clear benefit. |
| 22–26 s | **The payoff** | The result the seller cares about: an order arriving, a beautiful store on a phone, a delivered order. |
| last 3–4 s | **CTA + brand** | Logo, one gold CTA button and **`tallaby.com`** under it. No slogan. The spoken and written CTA changes every video (see "Closing lines" below). Hold it for at least 2.5 s. |

**Hooks that work** (write new ones in this spirit, in Egyptian Arabic, at most about 7 words):
- "لسه بتاخد الأوردرات على الواتساب؟"
- "متجرك أونلاين في أقل من دقيقة."
- "ده مش موقع براند كبير… ده متجر عادي على طلبي."
- "بطّل تقول: ابعتلي رسالة على الخاص."
- "3 حاجات محدش قالك عليها عن البيع أونلاين."
- Before/after split: a messy DM thread on the left morphs into a clean store on the right.

**Closing lines (owner, 2026-10-25):** the last spoken line and the button text must **change from video to video**; never reuse the closing line of the previous 5 videos (check the Used topics log). Pick or adapt one of these, or write a new one in the same spirit (always ending on the website, said as "طلبي دوت كوم"):
- "إفتح متجرك دلوقتي على طلبي دوت كوم."
- "متجرك مستنيك على طلبي دوت كوم."
- "جرّبها بنفسك على طلبي دوت كوم."
- "ابدأ النهارده من طلبي دوت كوم."
- "خلّي لينكك يبيع… من طلبي دوت كوم."
- "صمّم متجرك على طلبي دوت كوم."
- "خطوة واحدة: طلبي دوت كوم."
The gold button carries a short version of the same line (for example "إفتح متجرك دلوقتي", "جرّبها بنفسك", "ابدأ النهارده").

**Rules for the flow:**
- **One video = one idea.** One feature, one pain, one CTA.
- **Change something on screen every 1.5–2.5 s** (a cut, zoom, new element or simulated tap) so the viewer never sees a still frame for long.
- **Loop-friendly ending:** the last frame should flow naturally back into the first, so replays feel seamless.
- Stories over slides: a seller's day, a customer ordering, a store going live.

## 5. Look and motion (what makes it professional)

- **Show the real product.** Render the real Tallaby components, templates and pages from the repo, filled with Arabic demo data. Present them inside a clean, modern phone frame, using the mobile layout of the store and of the dashboard (owner, 2026-10-27: mobile screens are the default; a laptop only when the owner asks), never as flat full-screen screenshots.
- **Phone mockups must look like a real modern phone** (owner, 2026-10-25): the screen keeps the exact aspect of the capture (390×844, about 9:19.5; never stretch, squash or crop the screenshot to fit), the phone body is about **520–600 px wide and 1130–1300 px tall** on the 1080×1920 frame, thin even bezels (12–18 px), corner radius about 12–13% of the width, a small dynamic-island notch, and a soft shadow. Never a wide, squat or tablet-like phone. Check one still of the phone at its largest before rendering: width ÷ height must be about 0.46–0.49.
- **Use Canva where it helps** (owner, 2026-10-25): the Canva connector is attached to the daily run. Use it for polished assets the HTML build can't make well: a realistic phone mockup frame, branded backgrounds, product-style images, icons and illustration cards (`generate-design`, `create-design`, `upload-asset-from-url`, `export-design` as PNG with transparency where possible), then place the exported PNGs in the Hyperframes composition. Keep the brand colours and fonts, never use Canva templates with other brands' logos or stock people, and log which Canva designs were used.
- **Arabic must be perfect:** right-to-left layout, connected letters (render the text in a real browser with the real font; never draw Arabic letter by letter), correct punctuation (؟ ،), no cut-off diacritics. Check every still for broken shaping before rendering.
- **Typography:** headlines 72–110 px Bold, captions 48–60 px SemiBold, at most 2 lines and about 7 words per line. Text always has strong contrast (white on teal, dark on gold or off-white). Never put text over a busy image without a solid or blurred band behind it.
- **Motion:** smooth ease-in-out curves (no linear moves), small subtle overshoot on pop-ins, a gentle camera push-in on the UI, simulated taps with a soft ripple, typing animations for inputs. One consistent transition style per video (for example slide plus blur, or a mask wipe in brand teal). No cheap effects: no star wipes, no spinning 3D, no glitch effects, no rainbow gradients.
- **Composition:** generous empty space, one focal point per scene, everything aligned to a grid. Brand teal as the hero background, gold only for accents and the CTA.
- **Depth:** soft shadows under phone frames and cards, a subtle background gradient (teal `#145163` → a slightly darker teal), optional soft grain. Every frame should look like a frame from a premium app-launch film.
- **Burned-in captions:** most people watch muted. Show the voiceover as synced Arabic captions inside the safe box, word or phrase highlighting in gold, matching the voiceover word for word.
- **No stock clichés:** no handshake photos, no generic "business people", no AI-generated faces or fake people.

### 5.1 Quality bar for every upcoming video (owner, 2026-10-27)

The coupons tutorial of 2026-10-27 ([`reference-videos/2026-10-27-coupons-tutorial/`](reference-videos/2026-10-27-coupons-tutorial/)) is the minimum standard. Before planning, read its `brag-plan.md`, `composition-brief.md` and `qa.md`, look at `brag.jpg`, and match what made it work:

- **Real screens, real labels:** every dashboard and store screen is rebuilt from the repo's components with the exact Arabic strings from `messages/ar.json`, filled with fictional data. Money on screen is computed the way the code computes it (for example, a coupon discounts products only, shipping stays).
- **Calm, readable pacing:** one step or idea per scene, every label held long enough to read, numbered gold step badges in tutorials, one consistent transition (slide plus blur) and gentle push-ins on the phone.
- **One clear story:** hook (spoken and on screen at frame 0) → short pain → the feature in use → result → end card held 3–4 s.
- **Fix the reference's one flaw:** when pushing in on the phone, scale it so the important UI stays inside the safe box (y ≤ 1500); never let a push-in drop key buttons below it.
- **Full `/brag` workflow every time:** `brag-plan.md`, `composition-brief.md`, `npx hyperframes check` with 0 errors, `qa.md` with evidence. Never improvise a video outside the workflow.

## 6. Voiceover (Egyptian accent)

- **Always** add a voiceover, in **natural Egyptian colloquial Arabic (عامية مصرية)**, never Modern Standard Arabic (فصحى). Friendly, confident, warm, like a smart Egyptian friend explaining something. Not a news anchor, not a shouting ad.
- **One steady tone for the whole video** (owner, 2026-10-24): the same calm, warm energy from the first word to the last. No scene gets louder, faster or more excited than the rest. Write the script **without emotion/audio tags** (`[excited]`, `[curious]`, `[confidently]`…): pauses come from punctuation only. If the model still drifts, regenerate with one neutral tag such as `[warmly]` at the very start and nothing after it.
- **Tool:** the ElevenLabs connector (`creative_generate_speech`). Use **eleven_v4** with the reference recipe in §6.1; check `creative_get_model_guide` only if eleven_v4 is missing.
- **Default voice (the brand voice):** **Tamer**, `voice_id: mX8opBj7bbi4G2cE9j2w` (Egyptian, middle-aged male, energetic yet warm, made for tech and premium brand ads). Use the same voice in every video so the brand sounds consistent.
  - Backup if Tamer is unavailable: **Omar**, `erFJevGCT0rMZPhBbaep` (deep, confident Egyptian).
  - For a female voice (only when the idea calls for it): **Fatima – Loud & Engaging Influencer**, `Vu9gRjkR23ZG8EWrSmnj` (Egyptian).
  - If none of these are available, call `creative_list_voices` with `languages: ["ar"]`, accent `ar-egyptian`, and pick the closest match. Say which one you used.
- **Writing the script:**
  - Egyptian words: "عايز", "دلوقتي", "كده", "بتاعك", "يلا", "مش هتصدق", "خلاص".
  - Short sentences, one idea each. About **2.2–2.5 words per second**, so a 28 s video has about 55–65 words. Leave 0.3–0.5 s breathing gaps between beats.
  - The hook line is spoken in the first second.
  - Write numbers and prices as words the way an Egyptian says them ("تلاتمية جنيه", not "300").
  - Add diacritics (تشكيل) only where a word could be misread, and write the brand as **طَلَبي** in the voiceover text so it is pronounced correctly.
  - **Never say "اللينك في البايو"** (owner, 2026-10-25). To say the website, say **"طلبي دوت كوم"** (write it as "طَلَبي دوت كوم" in the script so the brand is pronounced right); never read the Latin "tallaby" aloud.
- **Quality check:** the connector makes two takes. Transcribe each with `creative_transcribe_audio`, and keep the take whose words match the script exactly, with "طلبي" pronounced correctly and no robotic or MSA-sounding delivery. If both are bad, fix the script (spelling, diacritics, punctuation) rather than shipping a bad take. Use the transcript's timings to sync the captions and the scene cuts.

### 6.1 The reference voice: keep this sound in every video (owner, 2026-10-27)

The owner's reference is the **coupons tutorial of 2026-10-27** (F-01; plan, QA, mix and music scripts in [`reference-videos/2026-10-27-coupons-tutorial/`](reference-videos/2026-10-27-coupons-tutorial/)). Every new voiceover must sound like it: **bold, clear, smooth, calm, and unmistakably Egyptian**. Read that folder's `brag-plan.md` (the "Voiceover script" section) before writing a script.

- **Exact recipe:** voice **Tamer** (`mX8opBj7bbi4G2cE9j2w`), model **eleven_v4**, the connector's default voice settings (never raise style/expressiveness or speed), **no tags at all**. If eleven_v4 is not listed, use the closest newer model and say so.
- **One generation for the whole script**, about **300–330 characters** (the reference was 308). Longer scripts drift. If a tutorial truly needs more, split it into at most 2 generations with identical settings, each opening with an Egyptian marker word ("يلا"، "بص"، "كده"…).
- **Place the voice in chunks, not as one block:** cut the take at its natural pauses (sentence ends) and place each chunk on its own scene, as `vo_chunks.json` in the reference does. Leave 0.4–1.0 s of air between beats, so the voice covers roughly 65–80% of the runtime. Never speed up or time-stretch the voice to fit; change the script or the scene length instead.
- **Script style that keeps the accent Egyptian:**
  - Short spoken sentences of 3–8 words, like a friend explaining on the phone: "واحد: افتح الكوبونات، واضغط إنشاء كوبون."
  - Use Egyptian words and spellings in every sentence: ده، دي، دول، كده، إزاي، فين، ليه، إيه، مش، عايز، دلوقتي، النهارده، بتاع، أوي، يلا، بص، خلاص، لوحده.
  - **Never** use Gulf or Levantine words, which pull the voice towards a Gulf accent: أبغى/أبي/تبي/يبغى، الحين، وايد، زين، شلون، وش/إيش، كذا، هالـ، ترى، مرّة (meaning "very")، حق (meaning "of")، عشان كذا، يا هلا، تراه، إمبلا.
  - **Never** use MSA words either: هذا/هذه/ذلك → ده/دي/ده؛ سوف → هـ؛ لكن → بس؛ ماذا/لماذا → إيه/ليه؛ أريد → عايز؛ الآن → دلوقتي؛ جداً → أوي؛ يمكنك → تقدر.
  - Write Egyptian sounds the Egyptian way: "تلاتة" not "ثلاثة"، "اتنين" not "اثنين"، "خمستاشر" not "خمسة عشر"، "دلوقتي" not "الحين".
- **Accent check before choosing a take:** in the transcript, look for any Gulf or MSA word from the lists above that the model swapped in. When the take can be listened to, also check for the Gulf giveaways: "ج" sounded as *j* instead of the Egyptian *g*, "ق" sounded as *g* instead of the Egyptian glottal stop, and a sing-song Gulf melody. A take with any of these is rejected; fix the script and regenerate instead of shipping it. Record the accent check in `qa.md`.
- **If ElevenLabs is not available** in the session: make the video without a voiceover (music plus captions only), and say so in the delivery notes. Never use a generic non-Egyptian text-to-speech voice.

## 7. Music, sound and mix

- **Music: original only** (owner, 2026-10-25: captions stay simple, with no credit lines). Build an original track for each video (for example a short Python/numpy synth: warm pad, Egyptian doum-tak percussion, soft bass, whooshes on the cuts, a bell on the logo). Never use tracks that need attribution, including the `/brag` bundled CC BY music, and never other copyrighted music.
- Cuts land on the beat. A soft "whoosh" on transitions and a light "tap" on simulated clicks, mixed quietly under the music.
- **Mix:** voiceover in front and always clear. Music ducks 10–14 dB under the voice and comes back up in gaps and at the end.
- **Sound effects stay low (owner, 2026-10-27):** effects are texture, never events. Set the SFX bus about **-9 dB** (gain about **0.35**) relative to the voice at 1.0, with music at about 0.55 before ducking (the reference `mix.py` used 0.9 for SFX; that is too loud). Each effect's peak sits at least **15 dB below the voice's peak**; repeated small sounds (taps, key ticks, message pops) at least **20 dB below**. Effects that land under a spoken word drop a further 6 dB. Only the logo bell and success chimes may be a little louder, still under the voice. Smooth every effect with a 5–10 ms fade-in and a soft tail: no clicks, no harsh highs.
- **Use the reference pipeline:** start from `reference-videos/2026-10-27-coupons-tutorial/mix.py` (voice chunks, sidechain duck with 60 ms attack / 350 ms release, -11 dB) and `music.py` (maqsum doum-tak, about 108 BPM), changing only the SFX gain as above, the timings and the music's details for the new video.
- **Loudness:** overall about **-14 LUFS integrated**, true peak at most **-1 dBTP**. Check with `ffmpeg -af ebur128` (or `loudnorm`) before delivering.

## 8. Post text (`share-copy.txt`)

- In Egyptian Arabic. First line = the hook (it shows before "more").
- 2–4 short lines: the pain, the solution, and the same closing line as the video, ending with **tallaby.com** (Facebook: `https://tallaby.com`). Never "اللينك في البايو".
- 3–6 relevant hashtags, Arabic and English mixed: `#طلبي #Tallaby #بيع_أونلاين #تجارة_إلكترونية #مصر`.
- Keep the caption simple: no credit lines, no "Music:" lines.
- Emoji sparingly (at most 2–3). No ALL CAPS, no false urgency, no "excited to share".

## 9. Topics

The topic comes from [`TALLABY_VIDEO_TOPICS.md`](TALLABY_VIDEO_TOPICS.md): how to pick today's topic, the full topic bank (sellers only for now), new features first, the seasonal calendar and the used-topics log. Never make a video about a topic that is not live.

## 10. Final QA checklist (before delivering)

- [ ] `ffprobe`: 1080×1920, 30 fps, H.264 `yuv420p`, AAC 48 kHz, duration 20–35 s, size under 45 MB, `faststart` on.
- [ ] Loudness about -14 LUFS, true peak at most -1 dBTP; voice clear over the music on phone speakers.
- [ ] Stills from every scene and mid-transition: no text outside the safe box, no overflow, no broken Arabic shaping, Latin digits only, and the layout centred on x = 540 (equal left/right margins).
- [ ] No "متجرك الشامل" and no "اللينك في البايو" anywhere in the video or post; the link shown is `tallaby.com`; the closing line differs from the last 5 videos; the voiceover keeps one steady tone (no emotion tags in the script).
- [ ] Hook visible and spoken within the first second; CTA held at least 2.5 s at the end.
- [ ] Captions match the voiceover word for word, and طلبي is pronounced correctly.
- [ ] Voice follows §6.1: Tamer, eleven_v4, default settings, no tags, about 300–330 characters per generation, placed in chunks with air between beats; the accent check (no Gulf or MSA words, no Gulf pronunciation) is recorded in `qa.md`.
- [ ] Sound effects follow §7: SFX bus about 0.35 against the voice at 1.0, effect peaks at least 15 dB under the voice (small repeated sounds 20 dB), nothing harsh.
- [ ] No invented stats, no Planned features, no real personal data, no promises the brand guide marks Avoid.
- [ ] Brand colors, fonts and logo correct; frame 0 is a strong cover.
- [ ] None of the banned innuendo words or phrases (§1) appear in the voiceover, captions, on-screen text or post; the idea reads as professional.
- [ ] Every phone mockup has a real phone shape (width ÷ height about 0.46–0.49) and the screenshot is not stretched.
- [ ] The video was made with the full `/brag` skill in `.claude/skills/brag/` (its `brag-plan.md` and `composition-brief.md` exist and the `hyperframes check` gate passed), not improvised.
