# Tallaby tutorial videos (طلبي) — rules and topics

Short "how to do it" videos for sellers, one video per dashboard feature. Each video is uploaded as a YouTube Short, and its link is opened from a **"شاهد الشرح"** button on that feature's page in the seller dashboard (`ROADMAP.md` F-97).

Owner request, 2026-11-17. This file is the single source for **what** tutorials exist and **how** every one of them looks and sounds.

**How this differs from the marketing videos.** Marketing videos follow [`TALLABY_VIDEO_RULES.md`](../.claude/skills/brag-slim/TALLABY_VIDEO_RULES.md) (voiceover, music, phone mockup, hook, CTA). Tutorials follow **this file**. Where the two conflict, this file wins for tutorials. Still shared, unchanged, from the marketing rules:

- §1 facts and brand: colours, fonts, logo, Latin digits, no real data on screen, the banned words list, only finished features.
- §5 "Arabic must be perfect" and "Show the real product".

---

## 1. What a tutorial is

- **One feature, one task, one video.** "How to add a product", not "everything about products".
- **Audience:** a seller who is already inside the dashboard and pressed "شاهد الشرح". They want to copy the steps. No selling, no pain story, no hook line, no `tallaby.com` call to action.
- **Only finished features** that are on production (`ROADMAP.md` §2.1 Live, or an F-xx with every task `[x]`). Check the page in the code and on production before filming (CLAUDE.md rule 1).
- **The video must match the real page.** Same labels (exact strings from `apps/dashboard/messages/ar.json`), same order of fields, same buttons. When the page changes, the video is re-made (§9).

## 2. Format

| Setting | Value |
|---|---|
| Size | **9:16, 1080×1920**, 30 fps |
| Duration | **28–32 s** target. Hard limits 20–40 s |
| Sound | **No voiceover, no music.** Simple sound effects only (§5) |
| Language | Arabic interface and Arabic step captions (the dashboard's default locale) |
| Codec | H.264 High, `yuv420p`, CRF 18, `-movflags +faststart`; AAC 48 kHz stereo 192 kbps |
| File | `.mp4`, under 45 MB |

## 3. Screen: full-screen mobile, no small mockup

The owner's rule: the screen must be **clear**, so the dashboard fills the whole video. No phone frame, no bezel, no background around a small phone.

- **The dashboard's mobile layout fills the full 1080×1920 frame.** Build or capture the page at a **390×693 px** viewport and scale it ×2.77. A 14 px label becomes about 39 px on the video, which reads easily on a phone.
- **Real screens:** rebuild the page from the repo's components with the real Arabic strings, filled with fictional data (store "متجر نور", prices like `299 جنيه`, no real seller, customer, phone or order).
- **Zoom when it helps:** push in up to **1.4×** on the field or button being used, then ease back out. Never zoom so far that the viewer loses where they are on the page.
- **YouTube Shorts covers parts of the frame.** Keep the thing being tapped and the step caption inside the safe area:
  - top 200 px: nothing important
  - bottom 420 px: nothing important (title, channel, subscribe)
  - right 160 px: nothing important (like, comment, share)
  - Scroll or zoom the page so each step's target sits between **y 240 and y 1180**.

## 4. One design system for every video

Every tutorial uses the same kit, kept in `Tutorial Videos/_kit/` and imported by each video. **Never restyle an overlay inside one video**; change the kit and re-render if the design has to change.

| Element | Spec |
|---|---|
| Colours | Teal `#145163`, gold `#fdad28`, off-white `#fafaf8`, white. Nothing else in overlays |
| Fonts | Noto Kufi Arabic (Arabic), Montserrat (Latin and digits) |
| **Title card** (0–2 s) | Teal full frame, white logo at top, the task as the title (72–96 px bold, at most 2 lines), small gold label "شرح سريع". It is also frame 0, so it is the YouTube thumbnail |
| **Step caption** | One card, centred on x = 540, bottom edge at y 1460, 860 px wide, teal `#145163` at 94% opacity, 28 px radius. Gold circle with the step number on the right, white text 50–56 px semi-bold, at most 2 lines and about 7 words |
| **Step progress** | A row of small dots above the caption card: gold for the current step, white 40% for the others |
| **Tap marker** | Gold ring, 96 px, 6 px stroke, with one soft ripple (400 ms). Shown on every tap, 300 ms before the screen reacts |
| **Typing** | Text appears letter group by letter group with a caret; Arabic is rendered by the browser, never drawn letter by letter |
| **Highlight** | A 6 px gold outline with 16 px radius around the field or button the step is about |
| **Step change** | One transition for all videos: a 350 ms slide plus blur. Scrolls inside a page use ease-in-out |
| **Result card** | When the task is done: the real success state of the page, plus a white check in a gold circle for 1.5 s |
| **End card** (last 2.5–3 s) | Teal full frame, white logo, the line "جرّبها الآن من لوحة التحكم" and the page's path as breadcrumbs (for example "المنتجات ‹ إضافة منتج") |

**Timeline (same for every video):**

| Time | Beat |
|---|---|
| 0–2 s | Title card |
| 2–26 s | 3 to 5 numbered steps, 4–6 s each. One action per step |
| 26–29 s | The result on the real page |
| 29–31 s | End card |

**Caption wording:** short, plain Arabic that every seller understands, with neutral verbs: اضغط، اكتب، اختر، أضف، احفظ، انشر. Use the page's own button names in the caption ("اضغط «حفظ»"). Use the owner's word choices: جنيه، الهاتف، التاجر. Read every caption against the banned words list in the marketing rules §1 before rendering.

## 5. Sound: simple effects only

- **No voiceover and no music** (owner, 2026-11-17).
- One fixed set of sounds, generated once into `_kit/sfx/` and reused by every video, so all tutorials sound the same:

| Sound | When |
|---|---|
| `pop` | The title card appears |
| `tap` | Every tap marker |
| `key` | Typing (one soft tick per letter group, not per letter) |
| `whoosh` | Every step change |
| `success` | The result card |

- All effects are soft: 5–10 ms fade-in, no harsh highs. Peak at most **-6 dBTP**; the whole video at about **-20 to -18 LUFS**. The video must work fully with the sound off.

## 6. Where the files go

Everything lives in **`Tutorial Videos/`** at the repo root (separate from `Marketing Videos/`, which the daily Buffer job posts from).

```
Tutorial Videos/
  TUTORIALS.md            this file
  _kit/                   shared design system: styles, overlays, sounds, logo
  T-01-add-product/
    video.mp4             the finished video
    poster.jpg            frame 0 (title card)
    video.md              the video's details (template below)
    work/                 build files (not committed)
  T-02-add-product-ai/
  …
```

**`video.md` template** (one per video):

```markdown
---
id: T-01
slug: add-product
feature: Add a product
roadmap: "§2.1 Products"
dashboard_path: /stores/[storeId]/products/add
status: draft | ready | uploaded | outdated
duration_seconds: 30
made_on: 2026-11-17
youtube_url:
youtube_title_ar:
youtube_title_en:
---

## Steps shown
1. …

## YouTube description (Arabic)
…

## Caption / post text
…

## Tags
…

## Notes
Source files checked, fictional data used, anything that differs from the real page.
```

## 7. YouTube

- Upload as a **Short** (vertical, under 60 s). Title in Arabic, at most 60 characters, ending with `#Shorts`.
- Description: one line that says what the video shows, then the numbered steps, then `https://tallaby.com`.
- After uploading, write the link in the video's `video.md` (`youtube_url`) and in the dashboard's tutorial registry (§8). The owner uploads, or approves the upload.

## 8. The dashboard button (`ROADMAP.md` F-97)

- A small outline button **"شاهد الشرح"** with a play icon in the page header, on the side opposite the page title (left in Arabic, right in English).
- It opens the Short in a dialog (YouTube embed, 9:16); on a phone it may open YouTube directly.
- One registry in the dashboard maps a page path to its video (`dashboard_path` → `youtube_url`). A page with no video shows no button.
- The button is added only after the video is uploaded.

## 9. Keeping videos up to date

- When a page's layout, labels or steps change, set the video's `status` to `outdated` in its `video.md` and in §11, and re-make it. The dashboard button for that page is hidden until the new video is up.
- When a new seller feature goes live, add a topic to §11 in the same change (CLAUDE.md rule 19).

## 10. QA before a video is "ready"

- [ ] `ffprobe`: 1080×1920, 30 fps, H.264 `yuv420p`, AAC 48 kHz, 20–40 s, under 45 MB, `faststart`.
- [ ] The dashboard fills the whole frame; no phone frame; text on the page is readable on a phone.
- [ ] Every label matches `ar.json` and the real page; steps are in the real order.
- [ ] Each step's target and the caption are inside the safe area (§3); nothing important under the Shorts buttons.
- [ ] Overlays come from `_kit/` unchanged: same caption card, tap marker, transition, title and end cards.
- [ ] Arabic shaping is correct in every still; Latin digits only; no banned words.
- [ ] No voiceover, no music; only the five kit sounds; loudness and peak within §5.
- [ ] Only fictional data on screen; the feature is live on production.
- [ ] `video.md` is complete; frame 0 is the title card and reads as a thumbnail.

---

## 11. Topics

One row = one video. **Status:** `todo`, `ready` (rendered and checked), `uploaded`, `outdated`.

The paths come from the dashboard routes in `apps/dashboard/app/[locale]/(main)` (read 2026-11-17). **Before filming any topic, open its page in the code and on production** and correct the path, steps and labels here if they differ. A topic whose feature turns out not to be live is removed, not filmed.

### Wave 1 — the first things every seller does

| ID | Video (the task) | Dashboard path | Steps to show | Status |
|---|---|---|---|---|
| T-01 | Add a product | `/stores/[storeId]/products/add` | Photos → name and price → category → publish → the product in the list | todo |
| T-02 | Add a product with AI | `/stores/[storeId]/products/add` (AI card) | Choose "with AI" → add photos → the fields fill in Arabic and English → review → publish | todo |
| T-03 | Add many products from a file | `/stores/[storeId]/products/add/from-file` | Upload the file → check the rows → import → the products list | todo |
| T-04 | Choose your store's template | `/stores/[storeId]/website/templates` | Open Templates → preview one → choose it | todo |
| T-05 | Edit your website and publish | `/stores/[storeId]/website` | Open the editor → change a title and a photo → Publish | todo |
| T-06 | Set your shipping prices | `/stores/[storeId]/shipping` | Add an area → set the price → save | todo |
| T-07 | Choose your payment methods | `/stores/[storeId]/settings/payments` | Turn a method on → add its details → save | todo |
| T-08 | Top up your wallet | `/wallet/top-up` | Enter the amount → pay → the new balance | todo |
| T-09 | Follow and confirm an order | `/orders` | Open an order → confirm it → change its stage | todo |
| T-10 | Connect an AI assistant to your store (MCP) | `/stores/[storeId]/apps` › AI assistants | Open the app → copy the link → approve the connection → ask the assistant to add a product | todo |

### Wave 2 — products and stock

| ID | Video (the task) | Dashboard path | Steps to show | Status |
|---|---|---|---|---|
| T-11 | Add sizes and colours | product form (options) | Add an option → its values → prices and stock per variant | todo |
| T-12 | Main and sub-categories | `/stores/[storeId]/products/categories` | Add a main category → a sub-category → put a product in it | todo |
| T-13 | Update stock quickly | `/stores/[storeId]/products/inventory` | Change a quantity → save → the stock history | todo |
| T-14 | Restore a deleted product | `/stores/[storeId]/products/trash` | Open Trash → restore | todo |
| T-15 | Ask the customer for details on a product | product form (customer requirements) | Add a field → the customer fills it on the product page | todo |
| T-16 | Add a size chart | `/stores/[storeId]/apps` › Size chart | Install → create a chart → link it to a category → "اعرف مقاسك" on the product | todo |
| T-17 | Quantity offers and cross-sell | `/orders/cross-sell` | Create an offer → it shows under the product | todo |

### Wave 3 — orders and customers

| ID | Video (the task) | Dashboard path | Steps to show | Status |
|---|---|---|---|---|
| T-18 | Add an order by hand | `/orders/new` | Choose products → customer details → create → send the link | todo |
| T-19 | Win back unfinished orders | `/orders/missed` | Open a missed order → contact on WhatsApp → mark contacted | todo |
| T-20 | Your customers list | `/orders/customers` | Open a customer → add a note and a tag | todo |
| T-21 | Block fake orders | `/stores/[storeId]/settings/protection` | Turn protection on → block a phone number | todo |
| T-22 | Ship with your Bosta account | `/stores/[storeId]/apps` › Bosta | Connect the account → ship an order → print the label | todo |
| T-23 | Add your own delivery riders | `/orders/riders` | Add a rider → assign an order | todo |
| T-24 | Ask for a deposit on cash orders | store settings (deposit) | Turn the deposit on → set the percent → what the customer sees | todo |
| T-25 | Change the checkout form | `/stores/[storeId]/settings/checkout` | Choose the fields → the thank-you page | todo |

### Wave 4 — marketing

| ID | Video (the task) | Dashboard path | Steps to show | Status |
|---|---|---|---|---|
| T-26 | Create a discount coupon | `/coupons` | New coupon → code and value → the customer uses it | todo |
| T-27 | Show a coupon pop-up in your store | `/coupons` (pop-up settings) | Choose when it appears → the countdown → the pop-up on the store | todo |
| T-28 | Automatic discounts | `/marketing/discounts` | New rule → condition and discount → it applies in the cart | todo |
| T-29 | Send an email campaign | `/marketing/emails` | New campaign → write → choose customers → send | todo |
| T-30 | Show recent sales in your store | `/stores/[storeId]/settings/sales-popup` | Turn it on → choose the timing → the pop-up on the store | todo |
| T-31 | Connect Meta Pixel | `/stores/[storeId]/apps` › Meta Pixel | Open the app → paste the ID → connected | todo |
| T-32 | Product catalog for ads | `/marketing/catalog` | Copy the feed link → where to paste it | todo |
| T-33 | Reviews and customer questions | `/reviews` | Reply to a question → approve a review | todo |
| T-34 | Earn by inviting sellers | `/earn` | Copy your link → follow your earnings | todo |

### Wave 5 — website

| ID | Video (the task) | Dashboard path | Steps to show | Status |
|---|---|---|---|---|
| T-35 | Your brand colours and fonts | `/stores/[storeId]/website/design` | Change the main colour → the font → the whole store changes | todo |
| T-36 | Add a page | `/stores/[storeId]/website/pages` | New page → add a section → publish | todo |
| T-37 | Connect your own domain | `/stores/[storeId]/website/domain` | Add the domain → the DNS records → connected | todo |
| T-38 | Help Google find your store (SEO) | `/stores/[storeId]/website/seo` | Title and description → keywords → save | todo |
| T-39 | Write a blog post | `/stores/[storeId]/website/blog/new` | Title and text → photo → publish | todo |
| T-40 | Forms and their replies | `/stores/[storeId]/website/forms` | Create a form → add it to a page → read the replies | todo |
| T-41 | Your photo library | `/stores/[storeId]/website/media` | Upload → use a photo in the editor | todo |
| T-42 | Social media links | `/stores/[storeId]/website/social` | Add the links → they show in the footer | todo |
| T-43 | Your store as an app | `/stores/[storeId]/settings/app` | Set the name and icon → the install button on the store | todo |
| T-44 | Request a custom theme | `/stores/[storeId]/website/templates` (request) | Describe the design → add photos → send | todo |

### Wave 6 — account and money

| ID | Video (the task) | Dashboard path | Steps to show | Status |
|---|---|---|---|---|
| T-45 | Open another store | `/stores` | New store → name and link → switch between stores | todo |
| T-46 | Build a store with AI | `/ai-builder` | Describe the store → the builder works → publish | todo |
| T-47 | Your plan and usage | `/settings/plan` | Read the plan → usage → upgrade | todo |
| T-48 | Reports | `/reports` | Choose the period → read sales and best sellers | todo |
| T-49 | Store visits | `/stores/[storeId]/analytics` | Open Analytics → read the visits | todo |
| T-50 | Order alerts on your phone | dashboard header (install and notifications) | Install the dashboard as an app → turn alerts on | todo |

## 12. Log

| Date | ID | What happened |
|---|---|---|
| 2026-11-17 | — | File created; 50 topics listed from the dashboard routes; no video made yet |
