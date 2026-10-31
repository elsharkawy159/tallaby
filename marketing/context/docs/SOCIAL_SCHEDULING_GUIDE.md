# طلبي (Tallaby) — Social Media Bulk Scheduling Guide

> **Purpose:** Persistent context for AI assistants preparing bulk-scheduled social posts (design + caption) for **طلبي / Tallaby**. Read alongside `MARKETING_PROJECT.md` (brand, copy and compliance) and `claude/SOCIAL_DESIGN_CONTEXT.md` (design rules + caption package). Updated 22 Oct 2026.

---

## 1. Bulk scheduling with Buffer (CSV)

- Bulk upload is available on **all Buffer plans, including Free**. It lives in each channel's settings → **Bulk Upload**.
- **Per-upload limit:** Free = **10 posts per channel per upload**; paid plans = up to **100**. 30 posts on Free = 3 CSV files.
- **One upload per channel:** make one CSV per channel (Facebook, Instagram, LinkedIn) — captions differ per channel.
- **Supported:** text and **single-image** posts only (no video, carousels or first comments).
- Download the template from **Bulk Upload → Download CSV Template** (also in the project: `Buffer_Import_Template.csv`), fill it, upload, review the preview, fix any rows from the "CSV with post errors" file.

### Required CSV columns

| Column           | Rules                                                                                                                          |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| **Text**         | Caption + hashtags (Egyptian Arabic, brand as **طلبي**). Save as **CSV UTF-8 (with BOM)** so Arabic isn't garbled.             |
| **Image URL**    | A **direct image URL** (see section 2)                                                                                         |
| **Tags**         | **Leave EMPTY in every new Buffer file** (user rule, 22 Oct 2026). Older sheets already made with pillar tags stay as they are |
| **Posting Time** | `YYYY-MM-DD HH:MM`, Cairo time (e.g. `2026-10-20 19:00`). Excel may reformat dates — check before upload                       |

### Content rules for every post

- Link: **tallaby.com** only — **never `/sell`** or other sub-pages (team decision, 18 Oct 2026). Instagram: "اللينك في البايو"; Facebook/LinkedIn: `https://tallaby.com`.
- Positioning/tagline: **"إنشاء متاجر إلكترونية"** — the old slogan is retired.
- WhatsApp: **@tallaby** (http://wa.me/@tallaby)
- Arabic brand name: **طلبي** — never تالابي
- Suggested times (proposed): FB/IG 19:00–21:00; LinkedIn 10:00–12:00 weekdays; LinkedIn gets seller/B2B posts only.

### Campaign cadence (20 Oct 2026 → 3 Jan 2027)

- **1–2 posts per day** (user target). With two posts a day: post A at **13:00–14:00**, post B at **20:00–21:00** (Cairo).
- On Buffer Free that's ~45–60 posts per channel per month = **5–6 CSV uploads of 10 rows per channel per month** (or a paid plan for 100 rows per upload).
- **★ Tags column = EMPTY (user rule, 22 Oct 2026):** from now on every Buffer CSV/sheet keeps the Tags column header but leaves every row's Tags cell blank. Pillar IDs (`P1-brand` … `P5-pricing`) are still tracked in the schedule sheets and post bank, just not in Buffer. Sheets made before 22 Oct 01:10 (Batch 1, Batch 2, the 22–31 Oct upload) keep their tags — don't redo them.
- Don't post two posts from the same pillar on the same day; alternate image and reel/carousel.
- Posts, captions and the date map come from `claude/POST_BANK_NOV_DEC_2026.md`; the plan is `claude/MARKETING_CAMPAIGN_PLAN_NOV_DEC_2026.md`.
- Caption rule: simple, Egyptian Arabic, max one emoji. Buffer CSV supports single images only — carousels and reels are posted natively.

---

## 1b. ★ Cross-platform rule — same post, adapted per platform (decided 19 Oct 2026)

**Don't randomize.** Every day's post goes out on all relevant platforms on the **same day with the same design**. Only the caption, format and time change per platform. This keeps one consistent message, builds recognition (awareness campaign), halves production work, and makes results comparable across platforms.

| Platform           | What gets posted                                                     | Adaptation                                                                                                                                                  |
| ------------------ | -------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Facebook**       | Every post (A + B)                                                   | Caption with `https://tallaby.com`                                                                                                                          |
| **Instagram**      | Every post (A + B)                                                   | Same caption, URL replaced with "اللينك في البايو". Reels also shared to the feed. **Story** of each feed post (same design, 9:16 crop) with a link sticker |
| **TikTok**         | Reels only                                                           | Same video, 3–5 TikTok hashtags, posted 20:00–23:00                                                                                                         |
| **YouTube Shorts** | Reels only                                                           | Same video, short title + `tallaby.com` in the description                                                                                                  |
| **LinkedIn**       | B2B posts only (marked `LinkedIn: yes` in the post bank, max 2/week) | Professional caption (fuller sentences, less عامية), weekdays 10:00–12:00                                                                                   |
| **Threads / X**    | Optional: the day's headline as a short text post                    | No design needed                                                                                                                                            |
| **Pinterest**      | Skip during this seller campaign                                     | —                                                                                                                                                           |

Small variation is fine: a different caption hook on LinkedIn, or a story-only poll. **Never** a different design for the same day's message.

### Scheduling tools (recommended)

| Platform                 | Tool                                                                 | Why                                                                                                                                   |
| ------------------------ | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| **Facebook + Instagram** | **Meta Business Suite → Planner** (free)                             | Schedules both at once from one post, supports **images, carousels, reels and stories**, and lets you change the caption per platform |
| TikTok                   | TikTok web (tiktok.com/upload) scheduler or Business Suite if linked | Native, keeps reach                                                                                                                   |
| YouTube Shorts           | YouTube Studio → Schedule                                            | Native                                                                                                                                |
| LinkedIn                 | LinkedIn native scheduler (clock icon)                               | Native, free                                                                                                                          |
| **Buffer (CSV)**         | Optional, only for bulk single-image posts                           | The free plan is limited to single images and 10 rows per upload, so Meta Business Suite is the better main tool                      |

**Canva download folder:** final designs ready to post are moved into a Canva folder per batch (first 30 posts: "Tallaby — First 30 posts — READY TO DOWNLOAD", `FAHYgS31N6o`). Since 20 Oct, Claude exports PNGs from Canva itself and uploads them straight into Drive through the user's Chrome (fetch the export URL on a drive.google.com tab, then New → File upload with a patched file input) — the user no longer needs to download anything.

**★ Main Drive = omar@tallaby.com (user rule, 24 Oct 2026).** All Tallaby designs, sheets and docs must live in — and be **owned by** — the `omar@tallaby.com` Drive. Never create new Tallaby files owned by `elsharkawy159.om@gmail.com`. Existing files in "Tallaby seller posts" (still owned by elsharkawy159 on 24 Oct; transfer waits for Chrome) are being moved with Drive's _Transfer ownership_ (keeps file IDs, so Buffer/`uc?export=view&id=` links keep working); do **not** copy them (copies get new IDs and break links). New uploads must be made while connected/signed in as tallabycommerce (Google Drive connector authorised with that account, or Chrome Drive tab on that account). If the only Drive access available is the personal account, stop and tell the user instead of uploading there.

**Drive (seller posts) — structure since 24 Oct 2026:** root "Tallaby seller posts" `1tMJg9wKaM55ItUfPlSIjJwGEeGEcS7Ti` (shared "anyone with the link"; image links `https://drive.google.com/uc?export=view&id=FILE_ID`):

- `00 · ✅ Already scheduled in Buffer (do NOT upload again)` `1qrkGdQYIgWwSs53Lv9Dc-Y8sa-nn5dKV` — designs fully scheduled on all their channels + the `· 01 · IN BUFFER` sheets + `BUFFER LOG` sheet `1HIbsDeWh7V26kHBCTCziL-9MsZBVr588QmmYQ1DBezw` (per channel: date, post, status). **Rule:** whenever posts are added to Buffer, move their designs here and update the log; check Buffer (`list_posts` status scheduled, org `6a96ab93a5eea55a438f3bc7`) before building any new sheet. Channels: Facebook `6ad017f9778b240e2f10f8ad`, Instagram `6ad01836778b240e2f10fd96`, LinkedIn `6ad74e27778b240e2f684d29`.
- `00 · START HERE — how this Drive works` (Doc `14Mh0lU3PbgHxBDxdSW4RMEi2-ZEHSDfcMWdr5bePQxg`)
- `01 · Designs` `1fg-iv0nrHJtmOIQRe0MapCMa9P6iGifO` — **single-image posts only** (+ reels later), one folder, named by posting date/time: `YYYY-MM-DD_HHMM_POSTID.png`, reels `YYYY-MM-DD_HHMM_POSTID_reel.mp4`. No sub-folders. **Carousels never go here** (user rule 24 Oct).
- `02 · Carousels` `10EW7m5jbRESl4n0gzpbDqHS1jfNgURpE` — one sub-folder per carousel named `YYYY-MM-DD_HHMM_POSTID · title (N slides)`, slides inside `YYYY-MM-DD_HHMM_POSTID_slide-N.png`.
- `03 · Facebook` `1xzwrAEtrHbUuWviJJyjIj_skbHb2eXOg` · `04 · Instagram` `1TCXwaY7XxXTlZEQNJUIId4cikKVL56y8` · `05 · LinkedIn` `1agsR67gyoaB_51DnpAOsNdWDQntssDsQ` — Buffer import sheets, **max 10 rows each, Tags empty**, named `Platform · NN · date range (N posts) · upload after <date>` (or `· IN BUFFER` once uploaded).
- `06 · Plan & calendar` `1tIXV3260ZmuRMWtpQdB6Png0LWeQp4UX` — `CALENDAR · all posts 22 Oct – 26 Nov (master)` `1n_Bl-kaOtLWpsrtJjiVtIxRLCJiZAjji_4PGMdBjRC0`.
- `07 · Brand assets` `1jItB7SC-9r2E1bgNEgqTmVfQe4UVmTPb` — FB cover, LinkedIn banner, logos, mockups.
- `99 · Archive` `1AWx3B1k7SQPL5iJwLHge7BD-uRPPQzWa` — superseded sheets (`1WqW8Z1wW3O5z84nERBQ76dpJPnUz8-0b`), duplicate exports, `Old folder structure (before 24 Oct)` `1fBeZeRT2Nt1zLJOlXe7KSRsGHopX5Vsi`.

### Weekly routine (every Sunday)

1. Claude designs the coming week's posts in Canva (from `POST_BANK_NOV_DEC_2026.md` date map) and builds the reels; the user approves.
2. Claude exports the PNGs into Drive; reels (MP4) go to the user's Desktop folder.
3. Schedule the week: Meta Business Suite (FB + IG + stories), TikTok, YouTube, and LinkedIn for B2B posts.
4. Check the pillar tags and that no two same-pillar posts land on the same day.
5. Review last week's numbers (see the campaign plan §10).

## 2. How to get a direct image URL

Each image must use a **direct image URL** — it opens the image by itself (not a web page) and is visible to **anyone with the link**.

**Quick test:** open the link in a new tab. If only the image appears, it's direct.

### Google Drive

1. Upload the image, right-click → **Get link** → General access: **Anyone with the link**.
2. Copy the file ID and use: `https://drive.google.com/uc?export=view&id=FILE_ID`

> This link doesn't end in `.png`/`.jpg` — test one post in Buffer first.

### Dropbox

Share → Copy link (anyone with the link) → change `dl=0` to `raw=1`.

### Own website (most reliable)

Put images in the site's public folder, e.g. `https://tallaby.com/social/post-01.png`.

### Free image hosts

e.g. **ImgBB** → copy the **direct link** (ends in `.png`/`.jpg`).

---

## 3. Workflow for AI assistants

1. Design in Canva following `claude/SOCIAL_DESIGN_CONTEXT.md` (simple style, highlighted key word, rotating background).
2. Export PNG 1080×1350 (Canva → Download, or bulk: select designs → Download → ZIP).
3. Host images and collect direct URLs (section 2).
4. Write captions per channel + hashtags + posting times; produce one Buffer CSV per channel (UTF-8 with BOM) — **Tags column left empty**.
5. Split into files of 10 rows on Buffer Free.
6. Upload per channel and review the preview before confirming.

## Calendar & Buffer sheets (24 Oct 2026)

Ground truth checked in Buffer (org "My organization", omar@tallaby.com, free plan = 10 scheduled posts per channel): only the 22–31 Oct upload is in Buffer. The old Batch 1/2 sheets were never uploaded → archived.

- **22–31 Oct:** 1 post/day 20:00 (FB+IG) + LinkedIn 10:30 — sheets `· 01 · IN BUFFER` (FB `1RG7AVvcRvJDKtGn3Zh9mL5xlrar_7aAUhTevIf59S4A`, IG `179f6PR0zZ92oxP83ml7PbbUawtw6eqmlVYGpwgIY2ok`, LI `1xelFfaCC6RxXMYzx8UUdLlTaxnsPndOep2h1p1GdWNI`). LinkedIn already used P4-17, P4-19, P1-12, P2-11 (28–31 Oct) — don't repeat them on LinkedIn.
- **1–26 Nov (user choice 24 Oct: 2 posts/day 13:30 + 20:00):** all 51 remaining designs in original plan order, no same-pillar pair on one day. P1-11 skipped (needs real footage). Brand film P1-04 on 1 Nov 20:00, Black Friday reel P2-17 19 Nov, COD/BF post P4-15 26 Nov.
  - **24 Oct: added via Buffer API** FB+IG P2-01 (1 Nov 13:30), P3-01 (2 Nov 13:30); LinkedIn P2-01 (1 Nov 10:30), P1-01 (2 Nov 10:30) → each channel now has 10 scheduled (free-plan max). Sheet 02s were rebuilt with 8 rows: FB `1A7brPyND0fIHg7MctIEDc5SD7FHae5NDy30ozZSkTAg`, IG `18WIBjXDoyIldjX7BN8Ssw0beHn7BsAYmEuIpvNn7HMA`, LI `155fohKRAz62MBAhwIivY77GloUUbvWJWHY8ieTZJ0x0`.
  - FB: 02 (old 10-row version archived) · 03 `1tNJWEOLT5yg7BrEUqVBzH5BD781GuwLlsFMWeQcD4IU` (9–23 Nov) · 04 `1a5-Lf09s1jFxztmfKYUiaIYvXi0waX1vQnx_gaa57Ag` (23–26 Nov, 5)
  - IG: 02 (see above) · 03 `1YdFqs2HI-3DDJsetN0uSwNaaxui3Hiu0mt1nh4jqAJ4` · 04 `1-ypYB3bESX6IkO3kS5Vd4tY4z3KvZy30FzN8gJz0tHU`
  - LI (10:30, second same-day post 12:30): 02 (see above, 3–9 Nov) · 03 `1v7JRQusCkoMOjYMnGm3-oyzDYf-Bdq2m-S4N8Ms4mjQ` (11–14 Nov, 2)
  - Carousels (9) and reels (18) are posted natively from Meta Business Suite using the master calendar. Reel MP4s are still only on the user's computer (`Desktop\tallaby\Social Media Designs\Reels` + `\November`) — upload them to `01 · Designs` as `YYYY-MM-DD_HHMM_ID_reel.mp4` when Chrome/computer is reachable.
- Next content after 26 Nov: continue the post bank date map from Wk6 (P3-09 …) at 2 posts/day.
- Working files (local, may be gone): `/home/claude/work/reorg/` (cal.json, caps.py, rename_plan.json).
- P3-01 caption: FB "ابعتلنا وهنرد عليك: http://wa.me/@tallaby" · IG "ابعتلنا على Whatsapp @tallaby وهنرد عليك."

## Reels sheet (20 Oct 2026)

**REELS — schedule, file names & captions** `156f4UauoLj5QQSJ0HVxEMSYAm4fLS6B6NQWWeIWVOk4` (v3, 20 Oct — after P4-06) (Drive folder "Tallaby seller posts"). One row per reel: date, time, post ID, title, **file name** (files live in `Desktop\tallaby\Social Media Designs\Reels`), length, status, FB + IG captions, LinkedIn, notes. This is the source of truth for reels — the Drive connector can't edit sheets, so each update is a new version of this sheet (trash the old one). Reels are posted natively (Meta Business Suite), not through Buffer.

- Timezone note: Egypt switched back to UTC+2 on 30 Oct 2026 — Buffer `dueAt` for November uses `+02:00`.
