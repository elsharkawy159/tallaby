# Tallaby video rules (طلبي)

These rules apply to every `/brag-slim` video made for Tallaby. Where they conflict with `SKILL.md`, **these rules win**. Everything in `SKILL.md` that these rules don't change still applies (inspect → plan → build → check → deliver, "show the thing", readability, poster frame).

Goal: every video should look like it came from a serious, well-funded Egyptian tech company, and make a small Egyptian seller think "I want my store on طلبي today."

---

## 1. Facts and brand (non-negotiable)

- **Source of truth:** `MARKETING_PROJECT.md` (Confirmed beats Proposed; never use anything marked Avoid), then `PROJECT_DESCRIPTION.md`. Before claiming a feature, check the code: only show **Live** features, never "Planned" ones.
- **Brand name:** Arabic **طلبي** (pronounced *ṭalabi*), never **تالابي**. Latin **Tallaby** / **tallaby.com**.
- **The only official slogan:** **"متجرك الشامل"**. Don't invent other slogans as if they were official.
- **Never** invent numbers, stats, testimonials, awards, customer names or quotes. Never promise card payment or "free shipping over 500 EGP" (both are switched off). Delivery times are estimates, never guarantees.
- **No real data on screen:** no real seller, customer, phone number (except the official support number), email or order. Use fictional Egyptian stand-ins (store names like "متجر نور", "بيت الكروشيه", "Koko Kids"; prices like `299 ج.م`).
- **Seller CTA link:** `tallaby.com/sell`.
- **Colors:** primary teal `#145163`, accent gold `#fdad28` (CTA buttons, badges, price tags, with dark text), off-white `#fafaf8`, white. Nothing off-palette that clashes.
- **Fonts:** Arabic **Noto Kufi Arabic** (400–700), Latin **Montserrat** (400–700). No decorative script fonts.
- **Logo:** the real files from the repo (`apps/*/public/logo*`, see `MARKETING_PROJECT.md` §8). White logo on teal or dark, primary logo on light. Never redraw or stretch it.
- **Numbers:** Latin digits (0–9), never Arabic-Indic (٠١٢). Prices as `299 ج.م`.

## 2. Who the video is for

Small and medium Egyptian sellers who sell today through Facebook, Instagram and WhatsApp. They take orders in DMs and want a real store link without any technical work. Talk to their real pains:

- "Every order is a long DM chat, and customers get lost."
- "I have no proper link to put in my bio."
- "Delivery and cash on delivery are a headache."
- "I want a store that looks like a big brand's."

Every video answers one pain with one طلبي feature, shown working.

## 3. Format and technical specs

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
- right 140 px **and** left 60 px: no text (like/comment/share icons; Arabic RTL layouts put the eye on the right, so check that edge)
- That leaves a safe box of about **880×1280 px**, centred slightly above the middle. Backgrounds and motion can fill the full frame.

**Cover frame:** frame 0 (the poster, per `SKILL.md`) must be a strong, settled frame with a short Arabic headline (3–5 words) inside the safe box. It is also the grid thumbnail on Instagram, so it must read when cropped to 4:5 and 1:1 around the centre.

## 4. Video flow (structure)

| Time | Beat | What happens |
|---|---|---|
| **0–2 s** | **Hook** | Motion in the very first frame. A bold statement, question or before/after. No logo intro, no "مرحبا", no slow fade-in. |
| 2–6 s | **The pain** | The seller's real problem, shown (a messy WhatsApp chat, a notebook full of orders). Keep it fast. |
| 6–22 s | **The solution, in use** | The real طلبي UI doing the job: entry → key action → result (for example: pick a template → add a product → store live at `nour.tallaby.com`). 2–3 beats, each with one clear benefit. |
| 22–26 s | **The payoff** | The result the seller cares about: an order arriving, a beautiful store on a phone, a delivered order. |
| last 3–4 s | **CTA + brand** | Logo, "متجرك الشامل", and one CTA: **"ابدأ متجرك دلوقتي — tallaby.com/sell"**, with a gold button. Hold it for at least 2.5 s. |

**Hooks that work** (write new ones in this spirit, in Egyptian Arabic, at most about 7 words):
- "لسه بتاخد الأوردرات على الواتساب؟"
- "متجرك أونلاين في أقل من دقيقة."
- "ده مش موقع براند كبير… ده متجر عادي على طلبي."
- "بطّل تقول: ابعتلي رسالة على الخاص."
- "3 حاجات محدش قالك عليها عن البيع أونلاين."
- Before/after split: a messy DM thread on the left morphs into a clean store on the right.

**Rules for the flow:**
- **One video = one idea.** One feature, one pain, one CTA.
- **Change something on screen every 1.5–2.5 s** (a cut, zoom, new element or simulated tap) so the viewer never sees a still frame for long.
- **Loop-friendly ending:** the last frame should flow naturally back into the first, so replays feel seamless.
- Stories over slides: a seller's day, a customer ordering, a store going live.

## 5. Look and motion (what makes it professional)

- **Show the real product.** Render the real Tallaby components, templates and pages from the repo, filled with Arabic demo data. Present them inside a clean, modern phone frame (or a laptop for the dashboard), never as flat full-screen screenshots.
- **Arabic must be perfect:** right-to-left layout, connected letters (render the text in a real browser with the real font; never draw Arabic letter by letter), correct punctuation (؟ ،), no cut-off diacritics. Check every still for broken shaping before rendering.
- **Typography:** headlines 72–110 px Bold, captions 48–60 px SemiBold, at most 2 lines and about 7 words per line. Text always has strong contrast (white on teal, dark on gold or off-white). Never put text over a busy image without a solid or blurred band behind it.
- **Motion:** smooth ease-in-out curves (no linear moves), small subtle overshoot on pop-ins, a gentle camera push-in on the UI, simulated taps with a soft ripple, typing animations for inputs. One consistent transition style per video (for example slide plus blur, or a mask wipe in brand teal). No cheap effects: no star wipes, no spinning 3D, no glitch effects, no rainbow gradients.
- **Composition:** generous empty space, one focal point per scene, everything aligned to a grid. Brand teal as the hero background, gold only for accents and the CTA.
- **Depth:** soft shadows under phone frames and cards, a subtle background gradient (teal `#145163` → a slightly darker teal), optional soft grain. Every frame should look like a frame from a premium app-launch film.
- **Burned-in captions:** most people watch muted. Show the voiceover as synced Arabic captions inside the safe box, word or phrase highlighting in gold, matching the voiceover word for word.
- **No stock clichés:** no handshake photos, no generic "business people", no AI-generated faces or fake people.

## 6. Voiceover (Egyptian accent)

- **Always** add a voiceover, in **natural Egyptian colloquial Arabic (عامية مصرية)**, never Modern Standard Arabic (فصحى). Friendly, confident, warm, like a smart Egyptian friend explaining something that excites them. Not a news anchor, not a shouting ad.
- **Tool:** the ElevenLabs connector (`creative_generate_speech`). Before prompting, check `creative_get_model_guide` for the best model for Arabic (prefer the most expressive one available, such as Eleven v3).
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
  - Never read the URL aloud (the Latin "tallaby" would sound like the wrong name, تالابي). Say "اللينك في البايو" or "ادخل على اللينك" instead; `tallaby.com/sell` is on screen anyway.
- **Quality check:** the connector makes two takes. Transcribe each with `creative_transcribe_audio`, and keep the take whose words match the script exactly, with "طلبي" pronounced correctly and no robotic or MSA-sounding delivery. If both are bad, fix the script (spelling, diacritics, punctuation) rather than shipping a bad take. Use the transcript's timings to sync the captions and the scene cuts.
- **If ElevenLabs is not available** in the session: make the video without a voiceover (music plus captions only), and say so in the delivery notes. Never use a generic non-Egyptian text-to-speech voice.

## 7. Music, sound and mix

- Music is original (built per `SKILL.md` "Sound"), modern and upbeat: light Arabic-pop or Mahraganat-inspired percussion, or clean electronic, around 100–120 BPM. Never copyrighted tracks.
- Cuts land on the beat. A soft "whoosh" on transitions and a light "tap" on simulated clicks, mixed quietly under the music.
- **Mix:** voiceover in front and always clear. Music ducks 10–14 dB under the voice and comes back up in gaps and at the end.
- **Loudness:** overall about **-14 LUFS integrated**, true peak at most **-1 dBTP**. Check with `ffmpeg -af ebur128` (or `loudnorm`) before delivering.

## 8. Post text (`share-copy.txt`)

- In Egyptian Arabic. First line = the hook (it shows before "more").
- 2–4 short lines: the pain, the solution, the CTA **"ابدأ متجرك دلوقتي: tallaby.com/sell"** (on Instagram say "اللينك في البايو", since links in captions aren't clickable).
- 3–6 relevant hashtags, Arabic and English mixed: `#طلبي #متجرك_الشامل #Tallaby #بيع_أونلاين #تجارة_إلكترونية #مصر`.
- Emoji sparingly (at most 2–3). No ALL CAPS, no false urgency, no "excited to share".

## 9. Topics

The topic comes from [`TALLABY_VIDEO_TOPICS.md`](TALLABY_VIDEO_TOPICS.md): how to pick today's topic, the full topic bank (sellers only for now), new features first, the seasonal calendar and the used-topics log. Never make a video about a topic that is not live.

## 10. Final QA checklist (before delivering)

- [ ] `ffprobe`: 1080×1920, 30 fps, H.264 `yuv420p`, AAC 48 kHz, duration 20–35 s, size under 45 MB, `faststart` on.
- [ ] Loudness about -14 LUFS, true peak at most -1 dBTP; voice clear over the music on phone speakers.
- [ ] Stills from every scene and mid-transition: no text outside the safe box, no overflow, no broken Arabic shaping, Latin digits only.
- [ ] Hook visible and spoken within the first second; CTA held at least 2.5 s at the end.
- [ ] Captions match the voiceover word for word, and طلبي is pronounced correctly.
- [ ] No invented stats, no Planned features, no real personal data, no promises the brand guide marks Avoid.
- [ ] Brand colors, fonts and logo correct; frame 0 is a strong cover.
