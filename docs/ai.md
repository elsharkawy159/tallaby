# AI in Tallaby: how it works and the cost rules

Every AI feature (the product autofill today; field helpers, bulk products, credits and the store agent later: `PLAN.md` §22 AI-2 … AI-5) goes through `packages/ai` and follows the cost rules below. Read this before adding or changing an AI call.

**Planned (owner, 2026-11-03; not live):** monthly AI credits replace today's free daily cap: 100 on Free, 2,000 on Pro, 1 credit = 1 action, shared by the seller account, with extra packs from the wallet (`ROADMAP.md` F-57). Before giving a new action a 1-credit price, measure its cost. The AI Store Builder needs a cost study first (F-54a).

## 1. The building blocks (`packages/ai`)

| File | What it does |
|---|---|
| `models.ts` | The only place with model ids. `fast` = `gemini-3.1-flash-lite`, then cheap fallbacks, then `AI_MODEL_SMART` (`gemini-3.6-flash`, about 3× the price). |
| `pricing.ts` | Prices per 1M tokens and `costMicroUsd` (integer micro-USD). |
| `generate.server.ts` | `generateStructured`: one zod-typed call, an `ai_usage_logs` row per attempt (success or failure), the model chain inside one time budget. |
| `result-cache.server.ts` | The short-lived result cache behind the `cacheMs` option. |
| `usage.server.ts` | `logAiUsage`, `checkDailyCap` (per Cairo day). |

`generateStructured` options that control cost:

- `thinkingLevel`: `"minimal"` | `"low"` (default) | `"medium"` | `"high"`. Thinking tokens bill as output.
- `mediaResolution`: `"low"` | `"medium"` (default) | `"high"`. Tokens per image and per PDF page.
- `cacheMs`: keep the answer this long and return it free for the same seller, feature and input. `0` (default) = off.
- `maxOutputTokens`, `budgetMs`.

When the first (cheapest) model is overloaded (`busy`), it is retried once after 2 s before the chain moves to the next model.

## 2. Cost rules for every AI feature

Measured on the autofill (production `ai_usage_logs` and live calls, 2026-10-29): output costs 6× input ($1.50 vs $0.25 per 1M tokens), so **what the model writes** is the first thing to cut, then what it reads.

1. **The code does what it can.** Never ask the model for something code can compute or match: category ids (match in code from a short hint plus the titles, `suggestCategories`), SEO title and description (cut from the title and short description, `seoTitle` / `seoDescription`), prices, totals, slugs, formatting. One less output field is a saving on every call.
2. **No catalogs in the prompt.** Never send a full list (categories, brands, products, templates) for the model to choose from. The autofill's 541-category list was ~24k input tokens, about 90% of each call. Ask for a short free-text hint and match it in code. A short list the seller owns (their store categories) is fine.
3. **Cap every input.** Text has a character limit shown in the UI with a counter (autofill: 1,500). Images are few and shrunk in the browser first (autofill: 4, 1536 px). PDFs are billed per page, so cap the pages (autofill: 5, `countPdfPages`). Context the model needs (such as the current listing in edit mode) is trimmed too (autofill: 6,000 characters).
4. **Write long text only when it is needed.** The long description is written for a new product and, on edit, only when the seller asks for it. Any optional, long output should be off unless the request needs it.
5. **Thinking `minimal` for copy work.** Writing and translating listings needs no reasoning. Live 2026-10-29: `low` spent ~1,500 reasoning tokens a call for the same listing `minimal` wrote with none ($0.0037 → $0.0015). Use `low` or higher only for real reasoning, and measure it.
6. **Media resolution as low as the task allows.** `low` when the model only has to recognise the product; `medium` when it must read small text (review screenshots, spec sheets), which is why the autofill uses `medium`.
7. **Never pay twice.** Set `cacheMs` (autofill: 10 minutes) so a double click or a retry with the same input costs nothing and does not count toward the daily cap.
8. **Fixed rules first, per-call data after.** The system rules are a constant string (`AUTOFILL_SYSTEM_RULES`), and the date, lists and seller input follow in the request text, so Gemini's implicit cache can reuse the prefix. Keep the rules short; every line is billed on every call.
9. **Short output schemas.** Only the fields the feature uses, with tight `.describe()` limits ("8 to 10 keywords", "at most 120 characters"). Clamp again in code after the call (`clean…Output`).
10. **Cheapest model first.** New features use the `fast` tier. Move a feature to `smart` only with a measured quality reason, written in `PLAN.md`.
11. **Every call is logged and capped.** Use `generateStructured` (never call the SDK directly), give the feature its own `feature` name, check `checkDailyCap` in the route before the call, and fail closed when the cap check fails.
12. **Measure before and after.** A new feature or prompt change gets a live run on the staging key with tokens in/out and cost per call, recorded in `PLAN.md` §23.

**Not a saving we take:** product copy is always written in both Arabic and English in the same call (owner, 2026-10-29). Cut cost elsewhere.

## 3. Checklist for a new AI feature

- [ ] Goes through `generateStructured` with its own `feature` name, the `fast` tier and a daily cap.
- [ ] No list the code can match itself in the prompt; the code computes everything it can.
- [ ] Input limits on text, images, PDF pages and context, enforced on the server and shown in the UI.
- [ ] `thinkingLevel: "minimal"` unless reasoning is needed; `mediaResolution` chosen on purpose.
- [ ] `cacheMs` set when the same input can be sent twice.
- [ ] Fixed rules in `system`, per-call data in the content.
- [ ] Output schema has only used fields, with limits, cleaned again in code.
- [ ] Live run with tokens and cost per call logged in `PLAN.md` §23.

## 4. Product autofill numbers (2026-10-29)

| | Before | After |
|---|---|---|
| Input tokens per text-only call | ~25k (category list) | ~1.1k |
| Output | ~2k + ~1.5k thinking | ~1.3k, no thinking |
| Cost per call | ~$0.0073 | ~$0.0015–0.0022 |

What changed: no category list (`categoryHint` matched in code), SEO title and description made in code, 8–10 keywords instead of 10–15, thinking `minimal`, text 4,000 → 1,500 characters with a counter, images 6 → 4, PDFs up to 5 pages, edit-mode listing 12,000 → 6,000 characters, long description on edit only when asked, a 10-minute result cache, one retry of the cheap model when busy.

## 5. Add many products from a file (`PLAN.md` AI-3, numbers 2026-11-04)

Live on staging with `gemini-3.1-flash-lite`, thinking `minimal`, on a messy Arabic sheet (19 rows, 16 written by AI; headers such as "البتاع", "بكام", "فاضل كام"):

| Call (`feature`) | When | Tokens in / out | Cost |
|---|---|---|---|
| Column mapping (`product_bulk_map`) | Once per file, and not at all for our template or headers the code knows | 443 / 125 | $0.0003 a file |
| Copy (`product_bulk_copy`) | Per batch of 10 rows that need copy | ~65 / ~215 a product | **~$0.00031–0.00034 a product** |
| PDF reading (`product_bulk_pdf`) | Per batch of 5 pages, `mediaResolution: "medium"` (it reads small prices) | 1,224 / 710 for 2 pages, 8 products | ~$0.0007 a page |

A file of 500 products that all need copy costs about $0.17 to write. That is a fifth of one autofill call per product ($0.0015–0.0022), because the copy is short (two lines, up to 3 feature lines, 5 keywords a language, no long article) and all the rules are shared by the 10 products in a call.

What keeps it cheap: the code reads the file and every price, stock count and SKU, the model sees only the words it needs and has no field to write a number to, each cell is capped (name 150 characters, description 400, hint 60), the mapping reads headers plus 3 samples of 60 characters and never the sheet, a PDF is split in the browser so a page is billed once, rows with good copy in both languages skip AI, and the category is matched in code from a short hint. A retry within 10 minutes is free (`cacheMs`).

**Checks on what the model can't be trusted with:** the code rates the category match, and only a strong one can go live (`matchCategory`; on a 24-row test 3 went live, all right, and 11 of 14 correct products became drafts). A name that doesn't look like a product never reaches the model (`looksLikeProductName`), a name the seller gave is never replaced, and a translation that looks taken from another row is held back (`findBorrowedTitles`). None of this adds a model call.

**Credits (F-57):** 1 credit per product AI writes copy for (`BULK_CREDITS_PER_AI_PRODUCT`); rows needing no AI, the mapping and PDF reading cost none. This is a default the owner has not decided. **Daily caps** per Cairo day, in model calls, ×10 on Pro: 100 copy calls (`AI_PRODUCT_BULK_DAILY_LIMIT`, about 1,000 products), 20 mappings (`AI_PRODUCT_BULK_MAP_DAILY_LIMIT`), 40 PDF batches (`AI_PRODUCT_BULK_PDF_DAILY_LIMIT`).
