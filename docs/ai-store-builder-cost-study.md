# AI Store Builder: cost study (ROADMAP.md F-54a)

Written 2026-11-03. No code was built or run for this study. Nothing here is approved yet; F-54b waits for the owner.

**Headline (estimate):** a typical completed store (20 products, 60 photos) costs about **$0.12 (EGP 6)** in model calls, with no generated images. Proposed free limit: **one free build per account, 25 products, 100 photos, 40 chat turns, 2 site copy regenerations, and a $0.40 hard stop**.

## 1. Goal

A new seller gets a complete, professional store from one conversation: products in Arabic and English, categories, theme, brand, shipping and policies, validated and shown for review. Only the seller publishes. The first store uses no credits, with a hard limit per account (owner). This study estimates what that costs Tallaby and where the money goes. The owner's rule is the best storefront at the lowest practical cost, so a saving that hurts quality is not taken.

## 2. What is measured and what is estimated

| Number | Status | Source |
|---|---|---|
| Autofill after the cost cut: ~1.1k input, ~1.3k output, no thinking, $0.0015–0.0022 per text call | **Measured** (live, 2026-10-29) | `docs/ai.md` §4 |
| Old autofill: 12 calls, avg 25,235 input, 1,842 output, avg $0.0061 (p50 $0.0047, p90 $0.0095), 6.3 s | **Measured** | staging `ai_usage_logs`, all 2026-10-27, before the cut |
| Implicit cache: 6 of those 12 calls had ~22.4k of ~25k input cached, costing about half | **Measured** | same rows |
| Template copy: 140 templates, avg 5 pages and 17 sections, 62 Arabic strings (1,231 characters) and 1,327 English characters; largest 101 strings (1,850 + 1,918) | **Measured** | counted from `CODE_TEMPLATES` |
| An image at `medium` is 560 tokens, at `low` 280 | Published | Google media resolution docs |
| Every other token count (chat, brief, site copy, grouping, shipping, policies, review), retry rate, seller behaviour, quality | **Estimate** | §6 |

Staging has no logs after the cost cut and none for shipping zones, so the post-cut base comes from `docs/ai.md`. The builder itself has never been run.

## 3. One completed store, step by step

| # | Step | Who does it | Cost |
|---|---|---|---|
| 1 | Sign-up and guest prompt | Code. No model call before an account exists | Free |
| 2 | Business questions | Fixed question script with chips in code. Model only reads free-text answers into a small state | Small |
| 3 | Store brief: tone, audience, style words, stock photo search words | Model, 1 call, shown to the seller to confirm | Small |
| 4 | Logo | Seller's upload, or a text monogram (decision AI-D7). Colours read from the logo in code | Free |
| 5 | Sorting photos to products, when a seller sends them unsorted | Model at `low` resolution, 1 call. Skipped if already sorted | Small |
| 6 | Product copy, always Arabic and English | Model, 1 call per product (existing autofill) | **Largest** |
| 7 | Prices and stock | Seller's words or a CSV/Excel parsed in code. Never invented | Free |
| 8 | Categories, SEO title and description, slugs | Code (`suggestCategories`, `categoryHint`, `seoTitle`) | Free |
| 9 | Theme | Code shortlists 3 templates by industry and style words; the seller picks from previews | Free |
| 10 | Brand: palette, fonts, radius | Code from the template, presets and logo colours | Free |
| 11 | Site copy: hero, about, FAQ and so on | Model fills the template's named fields, 1 call. Never writes element trees (rule 17) | Second largest |
| 12 | Section photos | Template's photos or Pexels (`searchStockPhotos`) | Free |
| 13 | Shipping | Chips use code templates (`applyShippingTemplate`); free text uses the F-45b call | Small |
| 14 | Policies | Model, 1 call, from the seller's answers. No starter policy text exists in the code today | Small |
| 15 | Validation | Code (`validateSiteConfig`, missing data checks), then 1 model read for mixed languages and contradictions | Small |
| 16 | Review and publish | Seller. Only the seller publishes | Free |

## 4. Model prices and routing

Prices per 1M tokens, checked **2026-11-03** at [Gemini pricing](https://aistudio.google.com/docs/pricing) (`ai.google.dev/gemini-api/docs/pricing` now redirects there). The page shows no last-updated date, and the final 1,809 characters were not read.

| Model | Input | Output | One product (2.8k in, 1.3k out) | Site copy (3.3k in, 2.5k out) | Use |
|---|---|---|---|---|---|
| `gemini-2.5-flash-lite` | $0.10 | $0.40 | $0.0008 | $0.0013 | Test only: older, Arabic quality not measured |
| `gemini-3.1-flash-lite` (`fast`) | $0.25 | $1.50 | **$0.0026** | $0.0046 | Default for all steps |
| `gemini-3.5-flash-lite` | $0.30 | $2.50 | $0.0041 | $0.0072 | First fallback, as today |
| `gemini-3.6` or `3.8-flash`, to 2026-12-31 | $0.75 | $3.75 | $0.0070 | $0.0119 | Brief and site copy, if the test justifies it |
| Same, from 2027-01-01 | $1.50 | $7.50 | $0.0139 | **$0.0237** | Used in this budget, since the builder ships after that |
| `gemini-3.1-pro-preview` | $2.00 | $12.00 | $0.0212 | $0.0366 | No: cost without a known gain |

Routing: `fast` everywhere, which `docs/ai.md` rule 10 requires by default. The brief and site copy are **budgeted** at the 2027 `smart` price because the seller reads them first. They move to `smart` only if the live test (§10) shows a real quality gain, so the estimate holds either way.

**`pricing.ts` check:** today's values match. Four gaps:

- The 2027-01-01 doubling of `gemini-3.6-flash` is missing, so its costs will be undercounted by half from then, and the `FALLBACK_PRICE` used for unknown models has the same problem.
- `gemini-3.8-flash` has no row (priced by that fallback, correct today).
- Image output ($30–60 per 1M) has no field, so an image model would be badly undercounted. Add it before any image feature.
- `docs/ai.md` calls `smart` "about 3× the price"; it becomes about 5× on 2027-01-01.

## 5. Images

**Reading photos is cheap.** At `medium`, 560 tokens is $0.00014 a photo, so 3 photos add $0.0004 to a product. Keep `medium`, because it reads small text on packaging and spec sheets.

**Generating is the expensive part:**

| Option (1024 px) | Per image | Source |
|---|---|---|
| `gemini-3.1-flash-lite-image`, `gemini-nano-banana-2.1` | $0.0336 (batch $0.0168) | Gemini pricing, 2026-11-03 |
| `gemini-3.1-flash-image` | $0.067 | same |
| `gemini-3-pro-image` | $0.134 | same |
| OpenAI GPT Image 2, low / medium | $0.006 / $0.053 | [OpenAI guide](https://developers.openai.com/api/docs/guides/image-generation), seen in search results only, not re-read |

One $0.0336 image costs as much as about 13 products' copy. Cleaning 60 photos would cost about $2, 17 times the whole typical store.

**Default: no generation in the free build.** Product photos stay real (AI-D8: never invent them, and a product without a photo stays draft), the logo is a monogram (AI-D7), and section photos come from the template or Pexels. Quality does not fall, because customers buy from real photos. A generated banner can be offered afterwards as a credit action (§9). Imagen did not appear in the part of the pricing page read, so it was not compared.

## 6. Tokens per step (assumptions)

| Step | Calls | Input each | Output each | Model | Basis |
|---|---|---|---|---|---|
| Chat turn | 8 / 15 / 30 | 1.4k (rules 800, state 500, message 100) | 200 | fast | Estimate. Sends a state summary, not the history |
| Brief | 1 | 1.2k | 500 | smart 2027 | Estimate |
| Photo sorting | 1 | 500 + 280 per photo | 300 / 800 / 1,500 | fast | Published image tokens; output estimated |
| Product copy | 5 / 20 / 50 | 1.1k + 560 per photo | 1.3k (heavy 1.8k) | fast | **Measured base**; heavy allows longer articles, staging's old range went to 2.7k |
| Site copy | 1 | 3.3k | 2k / 2.5k / 3k | smart 2027 | Measured string counts; tokens estimated |
| Shipping | 1 | 1k | 500 | fast | Estimate |
| Policies | 1 | 1k | 1.2k | fast | Estimate |
| Final review | 1 | 3k | 300 | fast | Estimate |
| Retries, repairs | +15% on all | | | | Estimate; not measured |

Thinking is `minimal` throughout (measured: `low` added ~1,500 billed tokens per call on the autofill). If the brief needs `low`, that adds about $0.011 at the 2027 `smart` price.

## 7. Result: cost per completed store

| | Low | Typical | Heavy | At the free limit |
|---|---|---|---|---|
| Products / photos / chat turns | 5 / 10 / 8 | 20 / 60 / 15 | 50 / 200 / 30 | 25 / 100 / 40 |
| Chat | $0.005 | $0.010 | $0.020 | $0.026 |
| Brief | $0.006 | $0.006 | $0.006 | $0.006 |
| Photo sorting | $0.001 | $0.006 | $0.016 | $0.009 |
| Product copy | $0.013 | $0.053 | $0.177 | $0.088 |
| Site copy | $0.020 | $0.024 | $0.027 | $0.082 (3 runs) |
| Shipping, policies, review | $0.004 | $0.004 | $0.004 | $0.004 |
| Subtotal | $0.049 | $0.102 | $0.250 | $0.215 |
| **With 15% retries** | **$0.06** | **$0.12** | **$0.29** | **$0.25** |
| **EGP at 50** | **3** | **6** | **14** | **12** |

- All three seller types meet the `≤ $0.30` target in `docs/AI_AGENT_PLAN_PROMPT.md`, heavy only just.
- **Bad case:** if every call of a typical store fell back to `smart` at the 2027 price, it would cost about **$0.48**. That is why §9 has a dollar hard stop.
- **Payback:** $0.12 equals 4 orders' fees on Free at $0.03 an order.
- **Abandoned builds:** costly steps start only after the seller confirms the brief, so a seller who leaves earlier costs about $0.02. At 50% abandonment that adds about $0.02 per completed store.
- **At scale:** 1,000 typical builds cost about $120 (EGP 6,000).
- **Not counted:** hosting, function time, photo storage, email. Pexels' limits were not checked.

## 8. Saving levers

| Lever | Estimated effect | Risk to store quality | Decision |
|---|---|---|---|
| Code first (categories, SEO, theme, brand) | Autofill measured $0.0073 → $0.0022. A category list alone would add about $0.12 per 20 products | None | **Already in the estimate** |
| Fixed steps instead of a free agent loop | Agent loop, 60 steps at 25k context: about $0.12 with 90% cached, $0.42 with none, against $0.10 here | Less free-form chat. Free text is still read at each step | **Take** |
| One giant call | About the same price, but one failure repeats everything and the output limit is at risk | Weaker, harder to validate | Reject |
| Trim context (state summary) | Keeps chat at about $0.01 | Could lose a detail; the state is shown to the seller | **Take** |
| Result cache (`cacheMs`) | Double clicks and retries are free | None | **Take** |
| Implicit cache | Measured at a 25k prefix. Prefixes here are about 1k, so little or nothing | None | Keep fixed rules first; don't pad prompts for it |
| Explicit cache | Storage $1 per 1M per hour, no gain at this size | None | Reject |
| Several products in one call | Saves about $0.004 per 20 | Photos and details get mixed | Reject |
| Batch API (half price) | Saves about $0.026 per 20 | Delayed results break the live build | Reject for the first build |
| `fast` for site copy | Saves about $0.019 per store | Weaker hero and about copy, the first thing customers read | **Live test decides** |
| `low` resolution on product photos | Saves about $0.004 per 20 | Misreads labels | Reject |
| Skip long descriptions | Unmeasured; output is the main cost | Weaker product pages | Reject |
| `gemini-2.5-flash-lite` for product copy | Saves about $0.035 per 20 | Arabic quality unknown | Test only |
| No image generation | Avoids $2 or more | None for real products | **Take** |

## 9. Recommendation

**Architecture.** A resumable pipeline with a saved state and one `generateStructured` call per step, each with its own `feature` name (rule 20). The chat collects, the seller confirms a brief card, then the build runs. Store changes are drafts through existing product and store code. The AI fills named template fields only.

**Free first store, per account** (first store uses no credits; usage is still logged):

| Limit | Number | Why |
|---|---|---|
| Free builds | **1 per seller account, ever**, a unique claim row | Owner's decision |
| Products with AI copy | **25** | Covers low and typical. More: 1 credit each, or import without AI copy |
| Photos read | **100**, at most 4 per product | Same cap as the autofill |
| Chat turns using the model | **40** | Typical use is about 15 |
| Full site copy regenerations | **2** after the first | Room to try again |
| Hard stop | **$0.40 per build**, summed from `ai_usage_logs` | Worst case at the limits is $0.25 at normal routing. The build pauses and keeps its draft; it does not fail |

**Abuse controls, before any costly step:**

1. No model call before sign-in: the guest prompt is only saved (AI-D3).
2. Confirmed email, and the seller confirms the brief, before uploads and product or site copy steps.
3. A phone number can claim one free build. **The phone is not verified today** (`signup.lib.ts`: "No OTP") and isn't unique, so this only stops casual repeats. Add an OTP only if abuse shows up, after pricing it.
4. At most 3 free builds per IP per day, and the existing burst limit on each route.
5. **A platform daily budget of $25** (about 200 typical builds), set by env. Above it, new free builds wait. Fails closed like the current cap. This is the real backstop.
6. Uploaded files are capped before reading (type, size, PDF pages), and their contents are data, never instructions.
7. Admin alert when a seller or IP hits a limit, using the F-58 cost display once built.

**Credit cost of later edits** (a pack credit is $0.01):

| Action | Credits | Our cost |
|---|---|---|
| Question with no change | 0, capped at 30 a day | $0.0007 |
| Change theme | 0 (code); new copy counts as regenerate | Free |
| Product copy, one section or page rewrite, policy rewrite, shipping | 1 | $0.001–0.004 |
| Regenerate all site copy | 3 | $0.005–0.024 |
| Generate one image, later and optional | 5 | $0.034 |
| Another full store | 10, plus 1 per product with AI copy (20 products = 30) | About $0.12 |

**Owner decision needed:** F-57 says 1 credit = 1 action. The last three rows need more than 1, or those actions lose money or eat a month's value at a 1-credit price. A store at 30 credits fits Free's 100.

**Also worth correcting:** `ROADMAP.md` §4 prices Free's 100 credits at about $0.15 using $0.0015 per autofill. With 3 photos and full output it is about $0.26. `docs/AI_AGENT_PLAN_PROMPT.md` says 111 templates and DB template tables; the code has 140, code-only.

## 10. The live test that would confirm this

Run before F-54d, on the staging key, with prototype calls through `generateStructured`:

1. **Three stores end to end:** fashion in Arabic with 20 products and photos, electronics from a spec PDF and Excel, food from unsorted photos. Log every step. Pass: each store within ±30% of §7.
2. **Site copy:** same five businesses on `fast` and `smart`. The owner compares them blind. This decides routing and is logged in `PLAN.md` §23.
3. **Photo sorting:** 60 unsorted photos at `low`; check the error rate. Use `medium` if it's poor (adds about $0.004).
4. **Retries and repairs:** the real failure rate against the 15% margin, and how often the chain falls back.
5. **Arabic tokens:** real input and output on the largest template (101 strings) against the 3k output assumed.
6. **Real sellers:** after launch, median and p90 cost from `ai_usage_logs`, then revisit the 25-product limit and the $0.40 stop.
