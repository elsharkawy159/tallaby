# طلبي (Tallaby) — Marketing context for video production

Copied from the claude.ai project **"Tallaby Marketing"** on 24 Oct 2026. These files are the source of truth for brand facts, voice, design and the current campaign. Where docs disagree, the **newest** wins (see the date order below).

> The root `MARKETING_PROJECT.md` in this repo is an **older copy** (14 Oct). Use `docs/MARKETING_PROJECT.md` here (updated 20 Oct: fulfillment paused, WhatsApp rule, 5 ج.م pricing).

## Read before making any video

1. **`docs/VOICEOVER_RULES.md`** — natural Egyptian Arabic, write for the ear, numbers as words, final checklist. Mandatory before writing any VO script.
2. **`docs/SOCIAL_DESIGN_CONTEXT.md`** → *Reel pipeline* section — visual system, approved voices (Callum default, Bram alternative), every reel built so far and its motion idea (each new reel must use a different motion idea).
3. **`docs/NOVEMBER_2026_PRODUCTION_LOG.md`** — newest facts (20 Oct): what tallaby.com says now, open questions (AI builder may still be "قريبًا", no card claims), the 10 November reels, and the render workflow.
4. **`docs/POST_BANK_NOV_DEC_2026.md`** — every post incl. reel scripts (Format **R**), captions and the date map.
5. **`docs/MARKETING_PROJECT.md`** — brand facts, colours, fonts, do/don't.

## Video spec in one glance

| Item | Value |
|---|---|
| Size | 1080×1920, 9:16, 30 fps, H.264 |
| Pipeline | HTML + deterministic `render(t)` → Playwright frame capture → ffmpeg; VO delayed 150 ms, loudnorm −15 LUFS; scene cuts from `silencedetect` (n=−25dB, d=0.12) on the VO |
| Colours | teal `#145163` · gold `#fdad28` · off-white `#fafaf8` · secondary teal `#3b9bb0` · ink `#171717` |
| Fonts | Noto Kufi Arabic (Arabic) · Montserrat (Latin/numbers/URL) |
| Fixed elements | teal logo top-left · tagline **إنشاء متاجر إلكترونية** top-right · gold label · one highlighted word (teal box, white text) · teal end card with gold **tallaby.com** pill |
| Voice | ElevenLabs **Callum** (default) / **Bram** (alt), Egyptian Arabic. Never seed_audio voices, never Gulf dialect |
| Link | **tallaby.com** only · WhatsApp on screen: **Whatsapp @tallaby.com** · never a phone number |

## Hard rules (facts guard)

- Brand in Arabic is **طلبي**, never تالابي. The old slogan is retired.
- Pricing: **5 ج.م per successful order**, no subscription, free sign-up. Never "5%", never "cheapest", never "متجرك ببلاش" (say "ابدأ ببلاش").
- **No fulfillment claims** (storage, packing, delivery, COD collection, returns by Tallaby) — paused 20 Oct 2026.
- **No card payments.** Confirm the AI builder is live before any "الـAI في دقيقة" claim goes out.
- Blur customer names/phones in dashboard screenshots. No Arabic text inside AI-generated images or video.

## Contents

| Path | What it is |
|---|---|
| `docs/VOICEOVER_RULES.md` | Egyptian Arabic voice-over rules |
| `docs/SOCIAL_DESIGN_CONTEXT.md` | Design rulebook + reel pipeline + design log |
| `docs/NOVEMBER_2026_PRODUCTION_LOG.md` | Newest findings + November production (20 Oct) |
| `docs/POST_BANK_NOV_DEC_2026.md` | 120 posts with scripts, captions and date map |
| `docs/MARKETING_CAMPAIGN_PLAN_NOV_DEC_2026.md` | Awareness campaign plan (pillars, weekly themes, hero assets, brand film script) |
| `docs/MARKETING_PROJECT.md` | Brand & facts master doc (20 Oct version) |
| `docs/IMAGE_GENERATOR_INSTRUCTIONS.md` | Rules for AI imagery / hero objects |
| `docs/SOCIAL_SCHEDULING_GUIDE.md` | Buffer, Drive structure, posting cadence |
| `docs/SOCIAL_PROFILE_BIOS.md` | Profile bios per platform (22 Oct) |
| `screenshots/*.png` | Real seller-dashboard screenshots for mockups and reels (Add Product, Apps & integrations, Dashboard Home, Delivery follow-up, Settings, Social media integrations, Templates, Wallet, Website Builder) |
| `Buffer_Import_Template.csv` | Buffer bulk-upload template |
