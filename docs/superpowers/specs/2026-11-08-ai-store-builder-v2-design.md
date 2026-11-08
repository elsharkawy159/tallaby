# AI Store Builder v2: a live store from the tallaby.com hero (ROADMAP.md F-82)

Written 2026-11-08 (planning only, no code). Upgrades F-54 (`2026-11-03-ai-store-builder-design.md`, built and off behind `STORE_BUILDER_AI_ENABLED`). Everything in v1 that is not changed here stays: the fixed step machine, one model call per step, `generateStructured` with its own `feature` names, the spend hard stop, the free claim, abuse limits, idempotent build items, and the rule that the model never writes code, nodes, styles, links, prices or stock.

**Owner request (2026-11-08):** the seller types into the tallaby.com homepage hero: a simple prompt plus a product CSV, or a fuller brief with a logo and a primary colour. The agent reads everything, asks for what is missing with questions and choices in the chat, suggests 3 templates, and builds a complete store: template applied, design system in the brand's colours, products added, **everything published** so the seller previews it right away. Low AI cost, with a professional chat experience like Claude or ChatGPT. A customised website can be offered later.

---

## 1. What the seller gets (the outcome)

At the end of one conversation (target: under 5 minutes and at most 4 questions rounds), the seller has:

| Part | What is done | Who does it |
|---|---|---|
| Store | A store on `<subdomain>.tallaby.com` (the one created at signup), name, short description, category, contact, social links, SEO | Code (+ intake reading) |
| Brand | Logo (theirs, or a text logo in the template's heading font), favicon from the logo, **primary colour applied to the whole design system** (buttons, links, badges, accents, readable ink colour), template fonts and radius | Code only |
| Design | One of 3 suggested templates, applied with all its pages (home, product page, about, contact, FAQ, policies) | Code |
| Copy | Hero, about, FAQ, banners and every template text slot rewritten for their business, in Arabic and English | 1 model call |
| Products | Every product from the CSV (or photos, or typed in chat) with Arabic + English titles and copy, their own prices and stock, photos, categories matched in code; store categories created and wired to the template's category tiles | Code + cheap copy calls |
| Shipping | Zones and prices from a chip or their words | Code (+ 1 call for free text) |
| Policies | Returns and exchange policy from their answer | 1 call |
| Payments | Cash on delivery on by default (existing default); a link to connect more | Code |
| Live | **Site published** and products that are complete set live. The seller opens it immediately (through the F-76 owner pass while the account is not activated yet) | Code |
| To-do list | What is still missing (photos, prices, a logo, zones not recognised) with one-click fixes, plus the activation step if the account isn't activated | Code |

What the seller never gets: invented products, invented prices or stock, generated product photos, generated code or HTML, or someone else's store data.

## 2. The three input shapes

| Shape | Example | Path |
|---|---|---|
| A. Prompt only | "متجر عطور رجالي في القاهرة اسمه عود" | Intake reads the prompt; the chat asks for products (CSV, photos, or a few typed) |
| B. Prompt + CSV/XLSX | "شنط جلد طبيعي" + `products.xlsx` | File parsed in code; column mapping only when headers are unknown; cheap batch copy |
| C. Full brief | Prompt + logo + primary colour (+ CSV) | Everything above, plus brand from the logo and colour; fewest questions |

Any shape can add the rest later in the chat (attach a file, a logo, pick a colour).

## 3. Entry: the hero composer on tallaby.com

**Today:** `HomeHero` (`apps/ecommerce/components/marketing/home/home-sections.tsx:40-100`) has only a signup button. There is no prompt input.

**New hero composer** (a client component beside the H1, replacing the CTA button; copy in `messages/marketing/home.{ar,en}.json`):

- An auto-growing text box ("اكتب عن متجرك… ماذا تبيع، ولمن، واسم البراند"), counter, at most **1,000 characters**.
- Rotating example prompts as chips under it (click fills the box).
- 📎 Attach: product file (`.csv`, `.xlsx`, `.xls`, at most 2 MB and 500 rows, at most 30 columns) and/or logo (PNG, JPG, WebP, at most 1.5 MB; **no SVG**, since it can carry script).
- 🎨 Colour: a swatch button opening a small picker (preset brand swatches + hex input).
- Send button "ابنِ متجري". Enter sends, Shift+Enter is a new line.

**Before any account exists there is no model call** (v1 rule, kept). On submit:

1. The browser parses the file with SheetJS (lazy-loaded) and shows a free, instant reading: "لقينا 42 منتج، 3 منهم بدون سعر". The logo's main colours are read on a canvas in the browser (§6.2). This is code, so it costs nothing and makes the next step feel smart.
2. `POST /api/store-build/intake` (ecommerce) saves an **intake** row (§9) and uploads the files with server-signed URLs into a private bucket. Rate limit: 10 intakes per IP per Cairo day, burst limiter, file type read from bytes.
3. The existing signup dialog opens (subdomain + phone), prefilled with a subdomain suggestion slugified in code from the prompt's Latin words if any.
4. The intake id travels through signup three ways, so no path loses it: the signed `tallaby_signup_intent` cookie (extended with `intakeId`), `user_metadata.store_build_intake` for email confirmation in another browser, and the Google path (today `startGoogleSignup` clears the cookie and drops the intent: fix it to keep both).
5. `signup-callback` → `completeSignup` → **claims the intake** for the new seller and binds it to the store created at signup → redirects to `dashboard.tallaby.com/ai-builder?intake=<id>` (today it goes to `?welcome=1` and passes no `next`).
6. A seller already signed in on tallaby.com goes straight to the dashboard with a single-use, 10-minute token in the URL.

The intake expires after 48 hours (cron deletes rows and files). It holds no secrets, only what the visitor typed.

## 4. The conversation

### 4.1 Principles (cost and safety, unchanged from v1)

- Fixed steps in code, not a free agent loop. The model reads; code decides what to ask.
- Every question, option label and assistant sentence is an i18n string with placeholders. The model can supply **values** shown as choices (store-name ideas, an English name, audience words), cleaned in code, never the question text.
- Seller text is data inside `<seller_input>`; output is a typed schema, clamped again in code.

### 4.2 One intake call replaces four steps

v1 asks `name → about → industry → brief` one by one (4 turns, 2 model calls). v2 makes **one** call, `store_builder_intake` (`fast`, thinking `minimal`, `cacheMs` 10 min), right after the intake is claimed:

- **Input** (capped): the prompt (1,000 chars), the file's headers + 3 samples of 60 chars per column (as `product_bulk_map` does), the first 10 product names, the logo at `mediaResolution: "low"` (280 tokens), the chosen colour as hex.
- **Output** (short schema): `storeNameAr/En` (only if stated), `nameIdeas[3]` (only if no name), `industryHint` (free text, matched in code with `matchIndustry`), `audience`, `tone`, `styleWords[≤5]`, `taglineAr/En`, `photoKeywordsEn[≤5]` (for stock photos later), `contact` and `social` only if present in the text (kept only if found verbatim, as `mergeReading` does), `mapping` of the file's columns when the headers aren't known to `templateMapping`/`guessMapping`.
- Code then computes the **missing slots** and their confidence (industry match strength, name present, colour present, products present, file rows valid).

Estimated: ~1.8k in / ~450 out ≈ **$0.0012** (estimate, measure in F-82l).

### 4.3 Question rounds (questions and choices)

Code builds at most **3 questions per card**, only for missing or low-confidence slots, each a single- or multi-choice with one option marked **(موصى به)**, an "Other…" free text, and Skip where optional. Answering a whole card is one turn.

| Round | Asked only when | Questions (choices) |
|---|---|---|
| 1. About the brand | something is missing | Store name (3 AI ideas + "Other"), category (code's top 3 industries, recommended first), style (chips from `styleWords` + template style tags: فخم، عصري، دافئ، بسيط، مرح), colour (logo colours / "use the template's colours" / picker) |
| 2. Design | always | The 3 templates (§5), shown already wearing the brand |
| 3. Products | no file and no products yet | "Upload a file" (recommended), "Add by photos" (v1's photo form, up to 25), "Type a few now", "Start without products" (allowed, D3: the store is still published). If the file has problems: an inline table card for rows missing a price or stock ("3 products have no price") |
| 4. Selling | always, one card | Shipping (chips `tallaby_rates` recommended, `cairo_giza`, `egypt_flat` + price, or describe it), returns (14 days recommended, 7, 3, none, or describe), WhatsApp number if different from the signup phone |

Then a short summary card with **"ابنِ وانشر متجري"**. Pressing it is the seller's consent to publish (decision D1).

A seller who gave everything in the hero (shape C with a file) sees only rounds 2 and 4: two clicks to a live store.

## 5. Three template suggestions

**Today:** `shortlistTemplates` (`builder.lib.ts:314`) filters `CODE_TEMPLATES` (118) by industry and scores style words against the English name and description. Templates have no style tags.

**v2, all code, no model call:**

1. **Style tags** on `TemplateDefinition`: `style: ("luxe" | "bold" | "warm" | "minimal" | "playful" | "classic")[]`, `tone: "light" | "dark"`, and `needs: { minProducts, categoryTiles }` read from the home tree (how many product cards and category tiles the home shows). Filled once for all 118 templates; a test makes every template declare them.
2. **Score** = industry match (exact > related) + style overlap + **fit** (penalise a template whose home needs 12 products and 6 category tiles when the seller has 5 products in 1 category) + colour harmony (penalise a dark template for a seller whose primary is very light, and the reverse). Pick 3 that are **different from each other** (no two with the same main style), so the choice is real.
3. **Previews wearing the brand:** each card shows a live thumbnail (`template-live-thumb`) of `/template-preview/<key>` with a short-lived signed `brand` token: store name, logo URL, primary colour (palette from §6), and up to 8 of the seller's products (name, price, first photo) in place of the demo catalog. Code only. "Full preview" opens it in the chat's preview pane at phone or desktop width.
4. "Show 3 more" (free, the next 3 by score). Below the cards: "Want a design made just for you? Request a custom theme" → F-77 (later option, as requested).

Site copy is written **only for the chosen template**, after the choice, so the previews cost nothing.

## 6. The design system from a logo and one colour

### 6.1 Primary colour → full palette (new, code only)

`derivePaletteFromPrimary(primary, template)` in `packages/store-sections/src/core/` (written fresh; the Valorcy reference has the idea but rule 11 keeps it read-only):

- Keeps the template's neutrals (`background`, `foreground`, `muted`, `border`) so the layout keeps its character.
- Sets `primary` to the seller's colour; derives `accent`/`secondary` as tints and shades in OKLCH; ink colour via `isLightHex` (as `designSystemToTokens` already does).
- **Contrast guard:** text on primary and primary on background must reach WCAG AA (4.5:1 for text). If the seller's colour fails on the template background, darken or lighten it slightly for text uses and keep the exact colour for fills; tell the seller in one line.
- Saved with `saveStoreDesignSystem` after `applyStoreTemplate`, so it applies to the drafts and then the live site.

### 6.2 Logo colours (browser, free)

Canvas sampling of the uploaded logo, drop transparent, near-white and near-black pixels, quantise, keep the 3 strongest colours. They become the colour choices in round 1 when the seller gave no colour. No model call.

### 6.3 No logo

Text logo (store name in the template's heading font, existing `storeLogo` fallback). The done card offers "Upload a logo" as a to-do.

## 7. The build (after "Build and publish")

Same engine as v1: the browser calls `POST /api/ai/store-builder/run` until done, one item per call (60 s route limit), lease, items saved before applying, 2 attempts, spend hard stop. Item list v2:

| Item | What | Model |
|---|---|---|
| `store` | **The store bound to the intake** (created at signup), or `createStore` for a later build (plan limit). Never `findPristineStore` guessing (v1 bug: it could overwrite another empty store) | — |
| `settings` | name, description, category, logo, favicon, contact, social, SEO (code) | — |
| `template` | `applyStoreTemplate` (drafts) | — |
| `brand` | §6 palette → `saveStoreDesignSystem` | — |
| `categories` | Store categories from the file's category column (or industry), matched to Tallaby categories in code; bound to the template's category tiles, tile photos from each category's first product photo | — |
| `site_copy` | Fill the chosen template's text slots (v1 `collectCopySlots`, ≤ 80 slots) | 1 call |
| `products_file:<batch>` | **Reuse the file importer** (`products/add/from-file`: `buildSheetModel`, `applyMapping`, `validateRow`, `splitImageLinks`, `runBulkBatch` with `product_bulk_copy`), batches of 10. Not the old `bulkUploadProductsAction` (English-only headers, and its image split on `.` breaks URLs) | 1 call per 10 products needing copy |
| `product:<id>` | Photo or typed products: v1 autofill path | 1 call each |
| `catalog` | If the seller has other stores, show only this store's products here | — |
| `shipping`, `policy` | as v1 | 0–2 calls |
| `checks` | Code gates (§8) + v1's `notes` review call | 1 call |
| `publish` | Set complete products live (§8), then `publishStoreSite` with `onlyIfNeverPublished` (the same path as Templates' auto-publish, `publishNewStoreSafely`) | — |

The preview pane refreshes after `template`, `brand`, `site_copy` and every product batch, so the seller watches the store fill in.

## 8. Quality gates and what goes live

Before `publish` (code, no cost):

- `validateSiteConfig` passes on every draft page.
- No leftover template demo text in hero, about and FAQ (compare slots to the template's original strings; leftovers are retried once, then flagged).
- Product sections show real products only; a section bound to a category with no products is hidden, not empty.
- Contrast check from §6.1.
- Every link points inside the store.

**Products are published directly by the agent (D1, owner 2026-11-08).** A product with no price stays draft, since it can't be sold. A product missing a photo or a stock answer also stays draft until the seller fills it in (D4, owner 2026-11-08). A weak category match doesn't block publishing; it goes on the to-do list. Every draft appears in the to-do list with an inline fix (add a price, add a photo). **Zero products is fine (D3):** the site is published, product sections with nothing to show are hidden, and "Add your first product" leads the to-do list. Live products also show on the marketplace, as every live product does (no product approval, owner 2026-10-19).

**Not-yet-activated seller (F-76):** the site is published, but only the seller's browser sees it, through the owner pass. The done card says so and shows the activation step (top up). Everyone else sees the store-offline page until then. Nothing about F-76 changes.

## 9. Data (migration `0157`, staging first)

- `store_build_intakes` (server-only, RLS on, no policies): `id`, `token_hash`, `prompt` (≤1,000), `primary_color` (hex check), `logo_path`, `file_path`, `file_summary` jsonb (rows, valid, missing prices, headers), `locale`, `ip_hash`, `seller_id` (null until claimed, CASCADE), `store_id` (SET NULL), `claimed_at`, `expires_at`, `created_at`. Index on `expires_at` for the cleanup cron.
- Private bucket `store-build-intake` (5 MB, CSV/XLSX/XLS/PNG/JPEG/WebP, no storage policies; server-signed uploads into `guest/<intakeId>/`, moved under `<sellerId>/` when claimed).
- `store_builds`: add `intake_id`, `target_store_id` (the bound store), `source` (`hero` | `dashboard`), `published_at`.
- Tag every builder `ai_usage_logs` row with the build id (v1 bug: spend summed by time could mix two builds).
- Mirror in `schema.ts` and `relations.ts`; no `drizzle-kit generate`.

## 10. The chat UI (Claude / ChatGPT feel)

Route `dashboard /ai-builder` (full-screen, outside the dashboard sidebar), Arabic first, RTL.

**Owner, 2026-11-08: designed like Lovable, chat on the left and the website preview on the right, best UX.** The two panes keep these sides in Arabic too (the owner's layout); the text inside each pane is RTL as usual.

- **Layout, desktop (Lovable-style):** a slim top bar (store name, build status, device toggle, "Open store", "Edit in builder"); **chat on the left** (about 420–480 px, resizable with a drag handle); **live preview on the right** filling the rest (the store's preview iframe in a browser-like frame with the store address; phone / tablet / desktop toggle; refresh; "Open in new tab"). Before the template is chosen, the right pane shows the 3 brand previews side by side; clicking one fills the pane. While building, the preview reloads after each step with a soft shimmer over the parts being written.
- **Layout, phone:** chat full screen; a floating "شاهد متجرك" pill opens the preview as a sheet.
- **Messages:** the seller's in a soft bubble; the assistant's as plain text with the طلبي mark, no bubble. Assistant text appears with a short reveal animation (client-side; off with `prefers-reduced-motion`). True token streaming isn't needed: model output is structured and never shown raw.
- **Activity rows** (like Claude's tool steps): "قرأت ملفك: 42 منتج" ✓, "اخترت 3 تصاميم تناسب عطورك" ✓, "كتبت نصوص الموقع" ✓, "أضفت 30 من 42 منتج…" with a live count. Collapsible details.
- **Question cards:** up to 3 questions, chips with a "موصى به" tag, "Other…" input, Skip, one Send. Keyboard-friendly (arrows, Enter), 44 px touch targets.
- **Composer** always at the bottom: text, 📎 (file, logo, photos), 🎨 colour, send. The seller can type at any point ("غيّر اللون للأخضر", "اسم المتجر عود الملوك"); these are read by the same `store_builder_chat` reader into the state (capped turns), and code applies the change.
- **Build progress card:** a checklist that ticks live; the preview fills behind it.
- **Done card:** confetti once, "متجرك جاهز ومنشور 🎉", the address, Open store (owner pass link), Edit in the builder, Share on WhatsApp, the to-do list, the activation step if locked, and "Request a custom design" (F-77).
- **Resumable:** state saved per build; reopening continues. Errors are friendly with a Retry; a hard stop explains that the rest can be finished by hand, and the draft is kept.
- Empty, loading, error and offline states designed; every string in `ar.json` and `en.json` (rule 13).

## 11. Cost (estimates; the live test in F-82l confirms)

Same prices as the 2026-11-03 study (`fast` = `gemini-3.1-flash-lite`, $0.25 / $1.50 per 1M).

| Step | Calls | Estimate |
|---|---|---|
| Intake (replaces chat + brief) | 1 | $0.0012 |
| Chat edits typed by the seller | 0–10 | ≤ $0.007 |
| Site copy, chosen template only | 1 (+2 regenerations) | $0.005 (`fast`) – $0.024 (`smart` 2027) |
| Products from a file, 50 needing copy | map 0–1 + 5 batches | ~$0.017 (measured rate, `docs/ai.md` §5) |
| Products from photos, 10 | 10 | ~$0.026 (v1 autofill) |
| Shipping text, policy, review notes | 2–3 | ~$0.004 |
| **Typical, shape B (50 products from a file)** | ~10 | **≈ $0.03–0.05** |
| **Typical, shape A (10 products by photos)** | ~15 | **≈ $0.04–0.06** |

v1's typical store was estimated at $0.12. The saving comes from the file importer's batch copy (a fifth of an autofill per product) and from folding four steps into one intake call, not from weaker copy. Previews, palette, logo colours, template choice, categories, SEO and checks are all code.

**Limits (proposed, decision D5):** free build 1 per account (unchanged); products from a file up to **150** with AI copy (≈ $0.05), from photos up to 25; 100 photos read; 40 chat turns; 2 site copy regenerations; **$0.40 hard stop** unchanged; platform budget $25/day unchanged; intake 10 per IP per day. Paid builds use credits as in v1 §7 (1 credit per model call, 1 per product copy as the file importer does).

## 12. Owner decisions

| # | Decision | Recommendation |
|---|---|---|
| D1 | The main agent publishes the site and the products directly at the end. This replaces v1's "only the seller publishes". The "Build and publish" button is the seller's consent | **Approved (owner, 2026-11-08):** "publish products and website directly from the main AI Agent, as the website will be accessible by the owner only" (F-76 keeps it private until activation). Only for the build's own store, only if it was never published (`onlyIfNeverPublished`) |
| D2 | Guest input is stored for 48 h before signup, with no model call | **Approved** (owner agreed to the flow, 2026-11-08) |
| D3 | A store with zero products | **Approved (owner, 2026-11-08): publish it anyway.** Product sections with nothing to show are hidden (never demo products), and "Add your first product" is the top to-do |
| D4 | Products missing required data | **Approved (owner, 2026-11-08): keep them draft until the seller fills the required product data** (price, stock answer, photo: the existing `nextProductStatus` rule). Each one is on the to-do list with an inline fix; it goes live once complete |
| D5 | Free limits v2 (§11) | **Approved (owner, 2026-11-08):** 150 file products, 25 photo products, $0.40 stop |
| D6 | Site copy model | **Approved (owner, 2026-11-08): the cheaper `fast` model.** F-82l still logs its cost and quality |
| D7 | Hero and about photos | **Approved (owner, 2026-11-08): use Pexels photos** from `photoKeywordsEn` (free, `searchStockPhotos`), no people or body-part photos (template rule), the seller can swap; the template's photo stays if no good match |
| D8 | Default returns choice | **Approved (owner, 2026-11-08): 14 days recommended** (check the wording against Egypt's consumer law before launch) |
| D9 | Hero composer replaces the hero signup button | **Approved (owner, 2026-11-08)**; keep "or create your store yourself" as a small link |
| D13 | Builder page design | **Owner, 2026-11-08:** a dashboard page designed like Lovable: chat on the left, live website preview on the right, best UX (§10) |
| D10 | The agent system (§14): one core with skills, each also a page agent | **Approved (owner, 2026-11-08)**: build the core first with the builder's skills, then page agents |
| D11 | Credits for page agents | **Approved (owner, 2026-11-08)**: 0 for questions and reading (capped), 1 per confirmed write action |
| D12 | Actions the agent may never do | **Approved (owner, 2026-11-08)**: wallet, top-ups, payouts, plan changes, deleting a store or account, handling secrets |

**All decisions D1–D13 are made (2026-11-08).** F-82a is done; building can start with F-82b, F-82g and F-83a.

## 13. Tasks (ROADMAP.md F-82)

| Task | Depends on | What |
|---|---|---|
| F-82a | — | Owner approves this design and decisions D1–D9 |
| F-83a | F-82a | Agent core (§14): `packages/agent` runtime, skill contract, confirm cards, credits, run logging (extend `agent_tool_calls`), shared tools used by the builder; F-82e–j are built on it |
| F-82b | — | v1 fixes: bound target store (no `findPristineStore` guess), stale product rows, keep `nameEn`, spend by build id, credit check on `already`, platform budget per call, no regeneration count without a call |
| F-82c | F-82a | Migration `0157` (§9) + schema/relations, staging first |
| F-82d | F-82c | Hero composer, intake route, files, rate limits; signup carry-through (cookie, metadata, Google fix, signed-in path); claim in `completeSignup`; 48 h cleanup cron |
| F-82e | F-82c | Intake call `store_builder_intake`, missing-slot logic, question bank and question cards; new step machine (intake → brand → design → products → selling → summary) |
| F-82f | F-82e | File path in the build: reuse `from-file` lib and `runBulkBatch`; inline fix table for rows missing price or stock |
| F-82g | — | `derivePaletteFromPrimary` + contrast guard + tests; logo colour reading in the browser |
| F-82h | F-82g | Template style tags and `needs` for all 118 templates (test enforced), shortlist v2 scoring, signed brand preview token on `/template-preview` |
| F-82i | F-82e | Chat UI v2 (two panes, composer, activity rows, question cards, preview pane, phone layout, done card) |
| F-82j | F-82f, F-82h | Build v2 items (`brand`, `categories`, `products_file`, `checks`, `publish`) and quality gates |
| F-82k | F-82j | Admin › AI usage labels for the new features; funnel counts (intakes → signups → builds done → published → first order) |
| F-82l | F-82j | Live test on the staging key: 3 stores (perfume by prompt only, bags from a messy Arabic XLSX, full brief with logo and colour), cost per store against §11, `fast` vs `smart` blind copy test, phone E2E in Arabic and English; log in `PLAN.md` §23 |
| F-82m | F-82l | Switch on (`STORE_BUILDER_AI_ENABLED=1`) on staging, then production after `0157` is on production (owner approval) |

## 14. The Tallaby agent system (owner, 2026-11-08: "make it an advanced, ready agent")

The store builder is the first user of a bigger system: **one reusable agent core with skills**. Each skill also works on its own, as a page agent, wherever its work lives (the shipping agent on the Shipping page, the design agent in the website editor, and so on). The store builder is the orchestrator that calls several skills in order. Planned as `ROADMAP.md` F-83; it extends `PLAN.md` AI-5 (editor `AgentDock`, dashboard assistant).

### 14.1 Shape

```
packages/agent                      (new; server-only runtime, no UI)
  runtime/   router, guided-flow engine, tool loop, confirm cards, credits, logging
  skills/<skill>/
    manifest.ts   id, pages where it appears, short rules (≤ 40 lines), credits per action
    tools.ts      typed tools: zod input → an existing packages/lib server function
    flows.ts      guided flows (fixed steps + question cards), like the store build
    questions.ts  question bank (i18n keys, code-built choices)
    evals/        golden tasks with expected tool calls
apps/dashboard  components/agent/*  one chat panel, used full-screen (/ai-builder),
                                    docked (editor), or as a side sheet on any page
apps/backend    src/mcp/tools        exposes the SAME tools to outside agents (F-29)
```

**One tool layer for everyone.** A tool is a small typed wrapper over existing server code (`agentCreateProduct`, `applyStoreShippingTemplate`, `saveStoreDesignSystem`, …). The in-app agent, the store builder and the MCP server (`apps/backend/src/mcp`, today `account` and `products`) all call the same tools, so a rule is written once and checked once.

### 14.2 How a request runs (cheap by design)

1. **Context first, in code.** The page decides the skill (Shipping page → shipping skill). The store id, seller id and locale come from the session, never from the model (rule 5).
2. **Guided flow when one fits** (most work): fixed steps and question cards, the model only reads free text. Cost like the builder: cents per task.
3. **Tool loop for free requests** ("زوّد سعر كل التيشيرتات 10٪", "اعمل كوبون للعيد"): `generateStructured` with tool calling, **only the active skill's tools** (at most about 8) in the prompt, a state summary instead of the full history, `fast` tier, thinking `minimal` (or `low` for multi-step plans, measured), at most 6 steps, a per-request dollar stop.
4. **Router call only when needed.** In the global assistant, when code can't tell the skill from the page or keywords, one tiny call picks it from our own list of about 12 skill ids (a short list we own, allowed by `docs/ai.md` rule 2).
5. **Plan, then confirm.** Every write first shows a **confirm card** with what will change (a diff or a preview: "سأضيف 3 مناطق شحن: القاهرة 50، الجيزة 50، باقي المحافظات 75"). Code runs the change only after the seller presses Confirm. Destructive or money actions always need it. Some are never available to the agent: wallet, top-ups, payouts, plan changes, deleting a store or account, secrets.
6. **Credits (F-57):** reading and questions cost 0 (capped per day); each confirmed write action costs 1 credit; bulk actions follow their own rule (1 per product with AI copy). Charged only on success, refunded on failure or cache.
7. **Logged:** every run and tool call gets a row (extend the MCP `agent_tool_calls` table from 0133 with `source = in_app | builder | mcp`), with cost, so Admin › AI usage shows each skill.

### 14.3 Shared store memory

The builder's brief (brand voice, audience, style words, English name, tagline, photo keywords) is saved as the store's **agent profile** (a jsonb on the store or a small server-only table). Every skill reads it, so a coupon text, a new product or a rewritten section sounds like the same brand months later. The seller can see and edit it in Store settings.

### 14.4 Skills

| Skill | Where it appears | What it can do (tools) | Notes |
|---|---|---|---|
| **Store builder** (orchestrator) | `/ai-builder`, tallaby.com hero | Runs the other skills in order (§7) | This document |
| **Design** | Website editor (`AgentDock`), Templates page | Change colours (palette §6), fonts, radius; rewrite a section's copy; add a section from `DESIGNS` (code shortlists 3 by category, the model never sees the full list); reorder, hide or remove sections; switch template (keeps content); swap photos (stock search) | Only existing designs and text props; never nodes, styles or HTML from the model (rules 9, 17). Changes go to drafts, Publish stays the seller's |
| **Products** | Products list and form | Create from text, photos or a file; rewrite copy and SEO; translate; fix categories; bulk edit prices, stock and status by rule; trash and restore | Prices only from the seller's words; bulk changes always previewed |
| **Shipping** | Shipping page | Zones and prices from a sentence (F-45b), templates, free-shipping rules, connect Bosta (guided, the key typed into a secure field) | Place names matched in code |
| **Orders** | Orders | Find and summarise orders, change status, print, WhatsApp confirmation text, spot fake orders (F-02 signals) | Status changes confirmed; read-only by default |
| **Marketing** | Coupons, discounts, offers, campaigns | Draft coupons, discount rules, quantity offers, cross-sells, email campaigns in the brand voice | Created disabled or as drafts; the seller turns them on |
| **Integrations** | Integrations page | Guide and fill Meta, TikTok, Google pixel ids (regex-checked, rule 9), Paymob or Kashier, Bosta, Wassalha | **Secrets never pass through the model or chat logs**: the agent opens a secure form, the seller pastes the key there |
| **Apps** | Apps page | Explain apps and their prices, install or uninstall (`store_app_installs`) | Paid installs are a money action: always confirmed |
| **Settings & policies** | Store settings | Contact, social links, SEO, returns, privacy and shipping policies, domain help (F-78) | Account-wide fields (return policy) say so |
| **Insights** | Home, Reports | Answer "how did I do this week?", best sellers, missed orders | Numbers computed by code; the model only phrases them |
| **Help** | Everywhere (global assistant) | Answers from the help centre content, "take me to the page", hand-off to WhatsApp support | No writes |

### 14.5 Surfaces

- **Full screen:** `/ai-builder` (this document).
- **Page agent:** an "اسأل طلبي" button on each page opens the same chat panel as a side sheet, bound to that page's skill, with its suggested prompts ("Set up shipping for all Egypt").
- **Global assistant:** ⌘K / a header button; routes to a skill (§14.2.4) and can hand the seller to the right page with the agent still open.
- **Outside agents:** the same tools through MCP (F-29) for Claude or ChatGPT connected to the seller's account.

### 14.6 Quality bar

- Each skill ships with an eval set (10–30 golden tasks in Arabic and English, expected tool calls and outputs), run in CI-less `pnpm test` with recorded model responses, and a live run on the staging key before it turns on (cost logged in `PLAN.md` §23).
- Prompt-injection tests: seller, shopper and file text that says "ignore your rules" never changes a tool, a store or a price.
- Every write is undoable where the data allows (drafts, trash, previous design system kept for one undo).

### 14.7 Order of work

1. **Core + first skills, through the builder:** runtime, skill contract, confirm cards, logging; then the builder's own parts become skills (products, shipping, design, settings & policies). F-82 is built on this core, so nothing is written twice.
2. **Page agents:** Shipping and Products pages first (most-used, tools already exist), then the editor's Design agent.
3. **Global assistant + router + Help and Insights.**
4. **Marketing, Integrations, Apps, Orders.**
5. **MCP:** move `apps/backend/src/mcp/tools` onto the shared tools.

Out of scope now: a customised design per seller (use F-77 Request a theme), generated images, PDF catalogues in the hero (the dashboard file importer already reads PDFs and can be added to the hero later), variants from chat.

## 15. Implementation notes (server)

Written 2026-11-09 with F-82e, F-82f and F-82j (server side). Code in `apps/dashboard/app/(main)/ai-builder/`.

**Flows.** `state.flow`: `v1` (rows saved before v2 keep the old question list, untouched) or `v2` (every new build). New files: `builder-questions.lib.ts` (rounds and question bank, pure), `builder-intake.lib.ts` (file rows, intake cleaning, chat edits, pure), `builder-checks.lib.ts` (palette, stock photos, empty sections, leftover text, pure), `builder-chat-v2.server.ts` (intake, cards, edits, file), `builder-items.server.ts` (v2 build steps and review, loaded by `builder-run.server.ts` for v2 builds only), `builder.actions.ts` (`updateBuildFileRow`), `builder-v2.client.tsx` (a minimal card client until F-82i).

**Start.** `/ai-builder?intake=<id>` calls `startBuildFromIntake(sellerId, intakeId)` (page, server side). The intake must be claimed by this seller and not expired; a build already made from it is returned as it is. An open `collecting` conversation is abandoned (a `building` one is returned instead). `target_store_id` is the intake's store when it is still the seller's and never published. The logo is copied from `store-build-intake` (only from `<sellerId>/<intakeId>/` or `guest/<intakeId>/`) into `products/ai-builder/<sellerId>/<buildId>/logo.*`. The file is read on the server with SheetJS (the importer's browser options; at most 600 rows, 2 MB, bytes checked). Then the one `store_builder_intake` call runs (`fast`, thinking minimal, logo at low resolution, 10-minute cache, ref id = build id; the columns go in only when `templateMapping`/`guessMapping` aren't confident, and then the call returns `mapping`). A dashboard start (`action: "start"` with no open build) is v2 too: its first card is `describe`, read by the same intake call. The intake call takes no credit (like chat). The free claim happens on "Build and publish" (`consent`: email confirmed, same rules as v1).

**Chat API** (`POST /api/ai/store-builder/chat`, body limit 900 KB). v2 actions:

| Body | What |
|---|---|
| `{ action: "start" }` / `{ action: "restart" }` | Open or resume (v1 rows stay v1); restart abandons a `collecting` build |
| `{ action: "answers", answers: Record<questionId, { choice?, choices?, text?, skip? }> }` | A whole card. Only questions on the current card count; nothing is saved if one is wrong (`error` + `view`) |
| `{ action: "edit", text }` (or v1 `answer` with `type: "text"`) | Free text read by `store_builder_chat` (40 turns): name (only if written), colour (a hex, or a colour word looked up in code, only when a colour was asked for), styles, industry, contacts and typed products (as v1: prices only when written) |
| `{ action: "moreTemplates" }` | The next 3 by `nextTemplates`, never one shown (at most 12) |
| `{ action: "logoColors", colors: ["#rrggbb", at most 3] }` | The logo's colours read in the browser (`dominantColorsFromPixels`) |
| `{ action: "attachFile", headers, rows: [{ row, cells }] (at most 500) }` | A file read in the browser with `readSheetFile`; mapped in code, else `mapColumns` (`product_bulk_map`) |
| `saveProduct` / `removeProduct` / `removePhoto` | The v1 product form (photo or typed products, at most 25) |

Server action `updateBuildFileRow(buildId, row, { price?: string in pounds | number, stock?: int, unlimited?: bool })` returns `{ ok, view }`; only while `collecting`.

**View** (`BuilderView`, added fields): `flow`, `round` (`describe | brand | design | products | selling | summary`), `card` (`{ round, key, questions }`, at most 3, built fresh from the state and also saved as `state.pendingQuestions`), `logoUrl`, `fileProblems` (`{ row, name, missing: ("price" | "stock")[] }`, at most 50), `moreTemplates`. A question is `{ id, key (i18n aiBuilder.v2.questions.<key>), kind: single | multi | text | color | templates, options: [{ value, key? (aiBuilder.v2.options.<key> with params), label? (a cleaned name idea), recommended?, color?, needsText? }], allowOther, optional, maxChoices? }`. Industry option values are `STORE_INDUSTRIES` ids; template option values are keys of `view.templates`. Question ids and answers: `describe` (text), `storeName` (an idea or text), `industry`, `color` (a logo hex or "template", or text "#rrggbb"), `style` (up to 2 of TEMPLATE_STYLES, skip), `template`, `products` (file, photos, type, none), `productsDone` (done, back), `fileFix` (continue), `shipping` (tallaby_rates, cairo_giza, egypt_flat with a text price, text, skip), `returns` (days:14, days:7, days:3, none, text, skip), `whatsapp` (same, a typed phone, skip), `build` (build). Assistant messages are keys (`v2.cards.<round>`, `v2.activity.readFile` with `{ count, missingPrice, missingStock }`); a seller's choices are saved as `card:<id>:<value> …` (the client shows "Answered").

**New state fields:** `flow, intakeId, source, intakeDone, nameIdeas, industryOptions, primaryColor, colorDone, logoColors, styles, styleDone, photoKeywordsEn, fileKey, fileRows (at most 150: row, name, nameEn, price and compareAt in piastres, stock, unlimited, images, category, description, sku), fileSummary, fileReviewed, productsChoice, answers, pendingQuestions, templatesShown`. The intake also fills v1's `brief` (tagline, tone, audience, style words), `briefConfirmed`, contact and social links.

**Build items (v2):** `store, settings (+ stores.agent_profile), template, brand, categories, site_copy, hero_photos, products_file:<n>, product:<id>, catalog, shipping, policy, checks, publish`.
- `brand`: `derivePaletteFromPrimary` on the applied draft design system, saved with `saveStoreDesignSystem` at its version; no colour keeps the template's.
- `categories`: seller categories (`ensureTaxonomyItem`) from the file's category column (at most 12), or one for the industry, which file rows without a category then use. Category tiles and "Nth category" rows already read the store's categories in order, so no node is changed.
- `hero_photos`: Pexels (`searchPexels`, cached) with `photoKeywordsEn`; only existing unbound `image` nodes in the home page's first section (at most 3) and the about page's first two sections (at most 2). A photo whose alt text names a person or body part, or has no alt text, is skipped; landscape only.
- `products_file:<n>`: 10 priced rows through `runBulkBatch` with its new options `{ refId: build id, credits: paid, ai: the spend gate (hard stop and platform budget), keepDraft: true, unlimitedRows }`. The build's spend now also counts `product_bulk_copy` rows tagged with its id. Product ids are looked up by the fixed SKUs (only products created since the build started), so a re-run finds them. Rows without a price are never sent (they go on the to-do list).
- `checks`: page validation; leftover template text (the originals are saved by `site_copy`); sections with nothing to show hidden on every device through the section root's existing per-device `hidden` style (no live products, or a row bound to a category index the store hasn't got); then v1's notes call behind the gate.
- `publish`: complete products (photo, price, a stock answer, name not flagged) set live with `agentSetProductStatus`; then `publishStoreSite({ onlyIfNeverPublished, requireTemplateChoice })` only when the bound store was never published, the cache cleared and `store_builds.published_at` set. An error is recorded, never thrown.
- Review (`loadReviewV2`): `published`, `viewUrl` (`/api/stores/<id>/view`), `activationLocked` (`isSellerActivationLocked`) and the to-do list (`reviewIssuesV2`): activation, publish failed, add your first product, file rows without a price, rows not added, drafts by missing photo, stock or name, site copy, invalid pages, leftover text, hidden sections, logo, shipping, return policy.

**Not done here:** the chat UI v2 (F-82i: two panes, previews wearing the brand, activity rows, done card); a second site-copy try for leftover demo text (only flagged); the intake file is parsed on the server with `xlsx` 0.18.5, which has the advisories the browser reader was chosen to avoid (move this parse to the browser or upgrade SheetJS before launch); colours and sizes from the file (the compact row drops them, so no variants); the live cost test (F-82l).
