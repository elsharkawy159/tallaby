# AI in Tallaby: how it works and the cost rules

Every AI feature (the product autofill today; field helpers, bulk products, credits and the store agent later: `PLAN.md` §22 AI-2 … AI-5) goes through `packages/ai` and follows the cost rules below. Read this before adding or changing an AI call.

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
