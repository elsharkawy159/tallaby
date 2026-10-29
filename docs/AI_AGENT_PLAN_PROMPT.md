# Claude Code prompt: write the Tallaby AI Agent plan (planning only, no code)

Paste everything below the line into Claude Code at the root of the Tallaby repo.

---

You are planning a large new feature for Tallaby (طلبي): an **AI Agent Assistant for sellers**. Your only deliverable in this session is **one planning document**: `AI_AGENT_PLAN.md` at the repo root. **Do not write or change any code, migrations, configs, package.json files, or other docs** (not even `PLAN.md` or `CLAUDE.md`). The plan will be implemented later, task by task, in other sessions.

## 0. Read first (mandatory, in this order)

1. `CLAUDE.md` (durable rules; they bind the plan too: tenant isolation, migrations numbering, money, caching, no seller code, secrets, i18n with Arabic default, code organisation `*.server.ts / *.data.tsx / *.client.tsx / *.dto.ts / *.types.ts / *.lib.ts`, verification).
2. `PROJECT.md`, `PROJECT_DESCRIPTION.md`, and the parts of `PLAN.md` that matter: decision table (D13 "AI builder features at launch: Exclude"), §11 plans, §13 business model, §21–23 checklist/log format, and the 2026-10-19 log entry about the editor AI dock.
3. Each app's `AGENTS.md` (Next.js **16.3.3**, `proxy.ts` replaces `middleware.ts`; read `node_modules/next/dist/docs/` for anything about route handlers, `after()`, `maxDuration`, server actions, streaming).
4. `PRODUCT_DATA_FORMAT.md`, `PRODUCT_DATA_PROMPT.md`, `PRODUCT_DATA_PROMPT.simplified.md`.
5. **Reference AI builder (read-only, never modify):** the owner's Valorcy project (GitHub `elsharkawy159/saas`, on disk at `D:\programming projects\saas`; if neither is reachable, say so in the plan and design without it). Study: `apps/dashboard/lib/ai/*` (`providers.ts`, `model-routing.ts`, `router.ts`, `section-manifest.ts`), `lib/server/ai-credits.ts` (`preflightAiRequest`, `recordAiUsageAndDeductCredits`), `app/api/ai/route.ts`, `app/api/ai/generate-site/`, `app/api/ai/refactor-section/`, `lib/inngest/functions/generate-site.ts`, `components/website-builder/{ai-builder,planner,generation-progress}/*`, tables `aiGenerations / aiConversations / aiMessages / aiSiteGenerations / generationJobs / generationPageTasks / aiUsageLogs`. Record what to reuse, what to adapt, and what to avoid, with paths.
6. `docs/ai.md` (CLAUDE.md rule 20): the AI cost rules and checklist. The agent plan must follow them: `generateStructured` from `packages/ai`, no catalog lists in prompts, capped inputs, thinking `minimal` where no reasoning is needed, result caching, the `fast` tier first, daily caps, and a measured cost per call.

Verify every file path and function name below against the code before you rely on it (rule: check the code before trusting a doc). Where the code differs, follow the code and note the difference in the plan.

## 1. The feature (owner's request)

An advanced, professional AI agent for sellers that:

- Accepts **CSV, Excel, PDF, photos and docs** as input.
- **Asks the seller questions when needed** as multiple-choice chips, with the **AI's recommended answer** marked, plus free-text "Other".
- **Builds a full store from scratch**: picks and applies the most relevant template from our library, creates categories and products, sets the subdomain, sets up a brand identity (palette, fonts, radius, text logo), connects integrations the seller mentions, social links, payment methods, shipping, blog posts, pages, SEO, forms.
- Has **every skill the seller dashboard has** (as tools).
- Works inside the **website builder `/editor`** with skills for sections, elements, content, styles, design system and pages.

**Entry flow:**
1. A visitor types a prompt in a new AI input in the **hero of the tallaby.com home page** (apps/ecommerce).
2. They must sign in (or sign up).
3. After sign-in they land on **`/onboarding`**: choose a subdomain and enter a phone number.
4. They are redirected to **`/stores/[id]/ai`**, where they watch the store being built live.

**Models:** Gemini **3.1 Flash-Lite** by default for low cost. Keep cost as low as possible while getting the best results.

## 2. Decisions already made by the owner (locked; do not reopen them, design around them)

| # | Decision |
|---|---|
| AI-D1 | **Access:** free for every seller with **monthly AI credits**. Turn on `ai` and set `aiCreditsMonthly` for the Free plan in `packages/lib/src/plans/index.ts`, plus a new idempotent **AI credit ledger**. Suggested allowance: about 1 full store build plus N editor or dashboard requests a month. Propose exact numbers and the credit price of each action. This **supersedes D13**; the plan must say how to record that in `PLAN.md` later. |
| AI-D2 | **Publishing:** the agent **only writes drafts**. At the end the seller reviews and taps **Publish**. The agent never auto-publishes. |
| AI-D3 | **Hero:** **prompt only before sign-in**; file attachments only after login, on `/stores/[id]/ai`. The prompt must survive email signup, email confirmation and **Google OAuth**. Use a signed intent and/or a DB draft row, not a plain query string. |
| AI-D4 | **Models:** Gemini 3.1 Flash-Lite for about 90% of calls, escalating to a stronger Flash model (Gemini 3 Flash, or 3.6/3.8 Flash; compare price and quality) for planning, messy PDFs and complex editor requests. Model ids live in one providers module and are never hard-coded in callers (as in Valorcy). Use structured output with zod. |
| AI-D5 | **Existing seller types a hero prompt:** the agent **asks** "new store or rebuild this one?". A new store respects the plan limit (`canCreateStore`, Free = 3). A rebuild touches drafts only and can be undone (`template_installs.previousDraft` / `undoStoreTemplate`). |
| AI-D6 | **/onboarding:** the AI **suggests a subdomain** from the prompt, prefilled, plus **3 available alternatives** (reuse `subdomainFromName`, `checkStoreSubdomain`, `RESERVED_SUBDOMAINS`). The seller can edit it. **The phone stays required** (Egyptian mobile, `EGYPT_MOBILE`). |
| AI-D7 | **Logo:** a **text/monogram logo** rendered from the brand fonts. No AI image logos for now. The seller can upload their own any time. |
| AI-D8 | **Images:** stock photos for hero, banners and sections (reuse `searchStockPhotos` / `importStockPhoto`). **Never invent product images.** Products without real photos stay draft. |
| AI-D9 | **Autonomy:** **reads freely, writes drafts freely, and shows a confirm card before risky actions**: publish, any delete, order status changes, payment numbers/InstaPay, custom domain, subdomain change after onboarding, coupons, connecting or disconnecting apps, Meta CAPI tokens. **No wallet, ledger, top-up or payout actions, ever.** |
| AI-D10 | **Chat language:** reply in the language the seller writes in, **Egyptian Arabic by default**. Store content is always bilingual ar/en, written in the store's default locale plus a `translations` overlay. |
| AI-D11 | **Build order:** Phase 1 = foundation + store-build flow. Phase 2 = editor agent. Phase 3 = the full set of dashboard skills. |

## 3. Facts from a prior review of the code (verify each before relying on it)

**Builder and templates**
- Editor route: `apps/dashboard/app/(builder)/stores/[storeId]/editor/`, server actions in `server/editor.server.ts` (`saveDraft`, `saveDesignSystem`, `saveChrome`, `createPage`, `updatePage`, `deletePage`, `reorderPages`, `publish`, `discardDraft`, `restoreRevision`, `previewLink`, …). UI package `packages/store-editor` (`EditorAdapter`, zustand `editor.store.ts`, `createEditorCommands` in `lib/editor-commands.lib.ts`: undo/redo 50 steps, autosave debounced 1.5 s, optimistic `draft_version`).
- Schemas: `packages/store-sections/src/config/schema.ts` (`SiteConfig`, `SitePage`, `PageContent`, `SectionInstance`, `ComponentNode`, `designSystemSchema`). Validation: `validatePageContent` / `validateSiteConfig` (`config/validate.ts`) + `sanitizeSiteConfig`. Limits: 80 sections a page, 400 nodes a section, depth 12, config 2 MB.
- Element types: `elements/registry.ts` `ELEMENT_DEFINITIONS` (layout / text / basic / data / product), responsive styles (`style` + `breakpointStyles.tablet|mobile`), mostly token/enum style values, section shell (`scheme`, `paddingY`, `width`, `bgImage`, `overlay`, `animation`). Data binding: `productList` / `categoryList` / `postList` + `props.bind`. Pure tree ops: `elements/tree.ts`.
- **Library sections:** ~290 code designs in 29 categories (`designs/<category>/<id>.ts`, `defineDesign`), DB table `library_sections`, `listLibraryPresets()`. **Every node has a stable `props.field`**, and `libraryFieldsOf(tree)` (`templates/library-fields.ts`) returns a content form per section (text/image/link/list/form/video). **This is the key cost lever: the AI fills named fields as small `{ar,en}` JSON and never generates element trees.**
- **Templates:** 111 (`templates/catalog.ts`), DB `templates` / `template_versions` is the master copy, `templates.category` is one industry id (`STORE_INDUSTRIES` / `findIndustry` in `store-editor/src/lib/industries.lib.ts`; health and pets have no templates), `templates.meta` has `pageNames`, `palette` and a `demo` catalog. There are **no tags**. Apply with `applyStoreTemplate()` (`packages/lib/src/store-sites/templates.server.ts`: expand → validate → `templateEssentials` → forms → `prepareTemplateForStore` → `mergeTemplateIntoDraft` → undo row). New stores: `ensureStoreSiteScaffold` → `seedStarterSite`. Always expand configs with `expandTemplateConfig(s)`.
- **Page size:** about 30–55 KB of JSON per home page (10–20k tokens). The agent must work from **outlines + single-section reads**, never whole pages.
- **Languages:** node text is default-locale `props` + `props.translations[locale]` overlays (`resolveSectionForLocale`).
- **Existing AI dock (UI only):** `packages/store-editor/src/inspector/agent-dock.client.tsx`, `lib/editor-agent.lib.ts` (`AgentMention` holds ids only; the agent must re-read the element and re-check ownership).

**Dashboard capabilities (tool sources)**
- Auth: `apps/dashboard/lib/auth/require-seller.server.ts` (`requireSeller`, `requireStore(storeId,{forWrite|forPublish})`). **Every action gets identity from the session cookie.** Agent tools must call `@workspace/lib` functions with `(sellerId, storeId)` from the **server session, never from model output**.
- Store: `createStoreAction`, `saveStoreGeneral` (name, description, category, logo/favicon/banner, contact, locales, currency), `saveStoreCatalog` (`all|selected`), `updateStoreSubdomain`, custom domain actions, `saveStoreSeo`, `saveStoreSocial`.
- Design: `saveDesignSystem`, presets in `store-editor/src/lib/design.lib.ts` (`PALETTE_PRESETS`, `THEME_PRESETS`, `FONT_PAIRINGS`, `STORE_FONTS`).
- Templates: `applyTemplate`, `templatePreview`, `undoTemplate`.
- **Products: legacy `apps/dashboard/actions/products.ts`, with no server zod, seller-scoped only, and rule 14 forbids adding to it.** The plan must include a **new validated product service** (create/update/bulk) the agent can call, reusing `syncProductVariants`, `nextProductStatus`, and the import parsers. Products belong to the **seller account**; stores show them through `catalog_mode` + `store_products`.
- Import paths that exist: Excel/CSV (`bulkUploadProductsAction` → `bulkInsertProductsAction`, `lib/product-import-headers.ts`, `lib/product-excel.ts`, `findBestCategoryMatch`), JSON (`parse-product-import.lib.ts`), URL scrape (`/api/fetch-product`, `/api/import-product-images`), Shopify import.
- Categories/brands: `categories-brands.server.ts` (`addTaxonomyItem`, `ensureTaxonomyItem`, …).
- Shipping: `saveShippingSettings`, `saveShippingZone`, `applyShippingTemplate` (`packages/lib/src/shipping/store-zones.ts`).
- Payments: `saveStorePaymentMethod` (cod, vodafone_cash, e_cash, we_pay, orange_cash, instapay; `packages/lib/src/payments/store-methods.ts`).
- Integrations: `connectStoreApp` (meta_pixel, google_analytics, google_tag_manager; regex-validated ids), `saveMetaCapi`, Google Sheets (OAuth), Shopify import.
- Blog: `savePost` (`cmsItemInputSchema`). Forms: `createForm`, `createFormFromTemplate`. Media: `createUploadPaths` → signed upload → `recordUpload` (bucket `store-media`, 5 MB, no SVG). Product images bucket `products`.
- Orders (`updateSellerOrder`), coupons (`saveSellerCoupon`), reviews, Q&A, riders, notifications. **There is no customers module, and social media is footer links only (no posting).**

**Flow and infrastructure**
- Hero: `apps/ecommerce/app/[locale]/(marketing)/(site)/page.tsx` → `HomeHero` in `components/marketing/home/home-sections.tsx` (current CTA: `HeroStory` subdomain claim), signup dialog `components/marketing/signup/signup-dialog.client.tsx`.
- Auth: Supabase email/password + Google. Dashboard `/login` **ignores `next`**, and `apps/dashboard/supabase/middleware.ts` drops the path. The callback already honours `next` (`safeNextPath`). Signup intent cookie `tallaby_signup_intent` (HMAC, 15 min, only `{subdomain, phone}`). `ensureSellerAccount` creates the seller + primary store. **No `/onboarding` route exists**, and there is a stale `/onboarding` redirect in `apps/ecommerce/supabase/middleware.ts`. The cookie domain is shared across `*.tallaby.com` in production.
- Store routes: no `[storeId]/layout.tsx`; pages call `loadStorePage(storeId)`. The `(builder)` layout is full screen and is the natural home for `/stores/[storeId]/ai`. Builder access is gated by `storeBuilderEnabled` (`STORE_BUILDER_SELLER_IDS`); the plan must decide how AI access relates to it.
- Realtime: private topic `user:<id>` (`seller_notification` event, migration 0098), `useRealtimeRefresh` hook in `packages/ui`. Use it for build progress (new event such as `store_build`).
- **There is no job queue** (no Inngest/QStash). Only `after()`, Vercel crons and `maxDuration = 300`. `apps/backend` is a Hono API (emails, webhooks), with no worker.
- Plans: `packages/lib/src/plans/index.ts` (`ai: false`, `aiCreditsMonthly: 0`, `hasFeature` unused outside tests).
- Next migration number: check `CLAUDE.md` (it was `0106` at the time of writing).

## 4. Research to do before writing

1. Confirm current **Gemini API pricing and model ids** (official page `https://ai.google.dev/gemini-api/docs/pricing`): Flash-Lite, Flash tiers, context caching, batch, and the Files API / PDF and image input limits. Last check: 3.1 Flash-Lite $0.25 / $1.50 per million tokens (cached input $0.025); 3 Flash preview $0.50 / $3.00; 3.8 Flash $0.75 / $3.75 until 2026-12-31. Also confirm function-calling and structured-output support on Flash-Lite.
2. Choose the SDK layer: **Vercel AI SDK + `@ai-sdk/google`** (what Valorcy used, provider-agnostic) vs `@google/genai` directly. Check the versions compatible with Next 16 / React 19. New dependencies need owner approval, so list them explicitly.
3. Job runner: compare (a) chained route-handler steps with `maxDuration` + `after()` + a DB step table, (b) Inngest, (c) Upstash QStash / Workflow. Recommend one, with cost and operational trade-offs. The default preference is **no new infrastructure** if (a) is reliable.
4. File parsing: `xlsx` (already used), PDF text vs vision (Gemini native PDF input), docx (e.g. `mammoth`), image OCR by the model. Limits per file and per run.

## 5. Required structure of `AI_AGENT_PLAN.md`

Write in clear English (the code base's docs are English; UI strings must be planned for both `ar.json` and `en.json`). Be concrete: file paths, function names, table and column names, zod schema names, event names. Use tables where they help. Sections:

1. **Summary and goals.** What ships in each phase and what is out of scope.
2. **Decisions.** AI-D1 … AI-D11 above, plus any new decisions you propose (numbered AI-D12+, each marked *proposed, needs owner approval*), and how D13 / `PROJECT_DESCRIPTION.md` §11b/§12 will be updated later.
3. **Valorcy reuse review.** A reuse / adapt / avoid table with paths.
4. **Architecture.**
   - New package (e.g. `packages/agent`, server-only): providers module, model routing per task (task → tier table), prompt library, tool registry, context object `{sellerId, storeId, locale, runId}` built only from the session, a zod schema per tool, tool risk class (`read` | `draft` | `confirm` | `forbidden`).
   - How tools wrap `@workspace/lib` functions without the session-cookie actions, while preserving every ownership check (`ownStore`, `loadOwnStore`) and plan limit.
   - **Prompt-injection defence:** uploaded files, scraped pages and store data are data, not instructions. Tool arguments are validated, and ids from model output are re-checked against the session.
   - Diagram(s) in Mermaid.
5. **Data model.** New tables as hand-written idempotent SQL plans (not the SQL itself; give columns, types, constraints, indexes, RLS on with no policies, migration numbers in order): e.g. `ai_conversations`, `ai_messages`, `ai_build_runs`, `ai_build_steps`, `ai_attachments`, `ai_prompt_drafts` (pre-login prompt), `ai_credit_ledger` (idempotent, unique claim + `ON CONFLICT`), `ai_usage_logs` (tokens, model, cost in micro-USD, latency). Mirror them in `schema.ts` and `relations.ts`. Storage bucket for attachments (private, size and type limits, retention).
6. **Credits and cost.** Credit price of every action, monthly reset (cron), preflight + deduction, refunds on failure, abuse limits (rate limits per seller and IP, max files and pages per run). A **per-store-build cost estimate** by step (input and output tokens × price), with a target of **≤ $0.30 per full build**, and every cost lever: field-filling instead of tree generation, a deterministic template shortlist before the LLM, context caching of the system prompt and catalogs, batching product copy, deterministic Excel/CSV parsing, repairing validator errors instead of regenerating, small outlines instead of full pages, and cheap-tier first with escalation only on failure or complexity.
7. **Entry flow (Phase 1).** Step by step with files to create or change:
   - the hero AI input (component, i18n, analytics events), keeping or replacing `HeroStory` (propose)
   - saving the pre-login prompt securely and carrying it through email signup, confirmation and Google OAuth
   - `/login?next=` support (middleware + page + OAuth `next`)
   - the new `/onboarding` page (AI subdomain suggestions + 3 alternatives, required phone, `ensureSellerAccount` or `createStoreAction` for existing sellers, AI-D5 choice)
   - redirect to `/stores/[id]/ai`
   - fixing the stale `/onboarding` redirect and the routing that assumes "no seller → /signup"
8. **The build agent (Phase 1).** An ordered, resumable, idempotent step pipeline: understand the prompt and files → questions (batched, chips with a recommended answer) → brand identity (palette from `PALETTE_PRESETS` or custom tokens, font pairing, radius, monogram logo spec) → template choice (deterministic scoring by industry + demo-catalog similarity → top-5 → LLM pick with reason) → `applyStoreTemplate` → categories → products (from files: parse → map → enrich copy in batches in `PRODUCT_DATA_FORMAT`, prices only from the seller's data, never invented; draft until a real image exists) → fill section content via `libraryFieldsOf` → pages, blog posts and forms → payments (COD on, others only with the seller's numbers) → shipping (Tallaby vs own zones) → integrations the seller mentioned (ask for real ids) → social links → SEO → final QA (validators, broken bindings via `check-unscoped-bound-nodes` logic, missing images, language coverage) → a review checklist and the Publish CTA. For each step give: inputs, model tier, prompt outline, output zod schema, tools called, failure and retry policy, progress event payload, and estimated tokens.
9. **UI and experience design (a full section, detailed enough to build from).** See §5a below for the requirements. Cover every AI surface: the hero AI input, `/onboarding`, `/stores/[id]/ai`, the editor `AgentDock`, and the dashboard assistant.
10. **Editor agent (Phase 2).** Activate `AgentDock`. Tools return **operations**, not trees: `get_outline`, `read_section` (as named fields), `set_text {ar?,en?}`, `set_style` (tokens/enums only, per device), `set_shell`, `add_section` (search the library by category and keywords → `instantiatePreset`), `move/duplicate/remove`, `set_design_system`, `apply_theme_preset`, `translate_section`, `rewrite_copy`, `create_page`, `replace_image` (stock/media). The client applies operations through `createEditorCommands` so each agent turn is **one undo step**, autosave runs, and server validation applies. @mention context comes from `AgentMention`. Concurrency with `draft_version`.
11. **Dashboard skills (Phase 3).** A full tool catalogue table: tool name, wrapped function, input schema, risk class, confirm-card copy, credit cost. Domains: store settings, catalog, products (CRUD, bulk, variants, SEO, translations), categories/brands, orders (with confirm), shipping, payments, integrations, blog, forms and submissions, media, coupons, reviews/Q&A replies, SEO/domain, analytics reads. Mark gaps (customers module, social posting) as out of scope or future.
12. **Prompting.** The system prompt structure, the brand voice for chat (`MARKETING_PROJECT.md`), Egyptian Arabic style, rules (no invented prices, specs or images; ask when unsure; recommend an answer), the compressed catalogs given to the model (template cards, section manifest built from `library_sections` metadata + field lists), few-shot examples, and output schemas.
13. **Security and privacy.** Tenant isolation per tool, confirm cards, forbidden tools, secrets never in prompts or logs (Meta CAPI tokens, Shopify tokens), PII in uploads, data retention, Gemini data-use settings, audit log of agent actions (link to `admin_audit_log` or a new table), and an admin view of runs and costs.
14. **Quality and evaluation.** A golden set of seller prompts and files (fashion, food, electronics, beauty, Arabic-only, messy Excel, scanned PDF, photos only), automatic checks (validator pass rate, template relevance, bilingual coverage, no invented prices, cost per run, latency), and manual UAT recorded in `PLAN.md` §23. Unit tests (Vitest) for tool schemas, ownership checks, the credit ledger and the step machine.
15. **Observability.** Usage logs, cost dashboard (admin), error tracking, step timings, alerts.
16. **Task list.** Phased, dependency-ordered tasks with IDs (e.g. `AI-P1-01`), each with: goal, files, dependencies, acceptance criteria, verification commands (`pnpm lint`, `pnpm typecheck`, `pnpm test` with `--filter`), whether it needs a migration (staging first, then production with owner approval) or a new dependency (owner approval). Small tasks; keep existing behaviour (marketplace, checkout, wallets, shipping, fulfillment) working.
17. **Risks and open questions.** Anything still undecided, each with your recommended answer.

## 5a. UI requirements (for plan section 9)

**Before writing this section, load the `frontend-design` skill** with the Skill tool (and `ui-ux-pro-max` too if it is installed) and follow its guidance. The UI must feel like a **professional, calm AI product: simple, focused and fast**. The experience should be **similar to Claude.ai's chat**: a clean, centered conversation, a roomy composer, streaming text, visible "thinking", tool steps you can expand, and artifacts beside the chat. **Use Tallaby's own brand** (colors, fonts, logo, voice from `MARKETING_PROJECT.md` and the dashboard design tokens). Never copy Anthropic/Claude branding, logos, names or exact visuals; borrow interaction patterns only.

Specify the following in the plan, concretely (components, files, tokens, states, copy in ar + en):

1. **Design direction.** The aesthetic in one paragraph; color tokens (reuse the dashboard / `@workspace/ui` tokens, light + dark); typography (Arabic-first, e.g. a font pair from `STORE_FONTS` / the dashboard's fonts); spacing scale; radius; elevation; icon set (the one the repo already uses); motion principles (subtle, 150–300 ms, ease-out, purposeful). Simplicity first: plenty of whitespace, one accent color, no clutter, no gradients everywhere.
2. **Hero AI input (tallaby.com).** A large rounded composer with a rotating placeholder of example prompts in Egyptian Arabic and English (typewriter effect), suggestion chips under it ("متجر هدوم"، "متجر حلويات"، "متجر إلكترونيات"…), a send button with an arrow icon, a disabled attach button showing "after sign-in" (AI-D3), a soft focus glow, and what happens on submit (a short "Saving your idea…" state, then sign-in).
3. **`/onboarding`.** A single calm card: the AI-suggested subdomain with a live availability badge, 3 alternative chips, the phone field, and a short summary of the prompt they typed ("We'll build: …"). One primary button.
4. **`/stores/[id]/ai` (main experience).**
   - **Layout:** desktop is a two-pane split: **chat on the start side** (RTL-aware) and a **live store preview** on the other, in a device frame with a desktop/mobile toggle, an "Open editor" button, and a draft badge. There is a collapsible step timeline, and the split pane can be resized. Mobile has tabs (Chat / Preview) and a sticky composer.
   - **Messages:** seller messages in a subtle bubble aligned to the end side; agent messages as plain text without bubbles, with a small Tallaby AI avatar; rendered markdown; text streams token by token with a soft fade-in.
   - **"Thinking…" state:** a status line such as "Thinking…" / "بفكّر…" with an animated shimmer over the text (CSS `background-clip:text` gradient sweep) and a three-dot pulse. While tools run, the line changes to the current action ("Choosing the best template…", "Adding 24 products…", "Writing your About page…"). Collapsed "thought / steps" blocks can be expanded to show the tool steps with ✓ / spinner / ✕ icons and durations, like Claude's tool-use blocks.
   - **Question chips:** question cards with option chips; the **AI-recommended option is marked** ("Recommended" / "مقترح" badge plus a subtle highlight). There is "Other…" free text, multi-select where needed, keyboard support, and "Skip, you decide".
   - **Confirm cards (AI-D9):** for risky actions: a title, a plain-language summary of exactly what will change, and Confirm / Cancel buttons. A destructive action uses a destructive style.
   - **Attachments:** drag-and-drop over the whole chat, a paperclip button, file chips with type icon, size, an upload progress ring and a remove button; image thumbnails. Accepted types and limits are shown. While parsing, the chip shows "Reading file…" with a shimmer.
   - **Build progress:** a step timeline (Understand → Brand → Template → Products → Content → Pages → Payments & shipping → Review) with the active step pulsing, completed steps checked, and a thin overall progress bar. The preview refreshes after each step with a soft crossfade and briefly highlights the section that changed.
   - **Brand reveal moment:** when the brand identity is ready, show a small card with palette swatches animating in one after another, the font pair sample and the monogram logo.
   - **Final review screen:** a checklist (products without images, missing payment numbers, integrations awaiting ids…), a summary of what was built, and the primary **Publish** button plus "Keep editing".
   - **Composer:** an auto-growing textarea, Enter to send and Shift+Enter for a new line, a Stop button while generating, an attach button, a credits indicator ("12 credits left this month") with a tooltip, and the active store name.
   - **States:** empty, loading skeletons, offline/reconnecting (realtime), error with retry, out of credits (with upgrade placeholder), resume after refresh (restore the conversation and running step), and stop or undo the build.
5. **Editor `AgentDock` (Phase 2).** Same visual language, compact: @mention chips for the selected element, quick action chips ("Rewrite", "Translate", "Make it bolder", "Change colors"), a "Thinking…" shimmer, an applied-changes summary with **Undo** in one click, and a highlight pulse on the changed elements in the canvas.
6. **Dashboard assistant (Phase 3).** Where it lives (a side panel or command-palette style launcher, opened from a header button and `Ctrl/⌘+K`); it reuses the same chat components.
7. **Animations (CSS only, no new animation library unless the owner approves).** Give the actual CSS / Tailwind keyframes for:
   - the text shimmer for "Thinking…"
   - the three-dot typing pulse
   - the fade/slide-in of messages and streamed tokens
   - the step pulse and check-mark draw (SVG stroke-dashoffset)
   - swatches popping in one after another
   - the preview crossfade and section highlight
   - the skeleton shimmer
   - the composer focus glow

   Respect `prefers-reduced-motion` (turn the animations off). Make sure nothing causes layout shift.
8. **Accessibility and i18n.** Full RTL (logical properties), keyboard navigation, focus rings, `aria-live="polite"` for streaming and status updates, screen-reader labels for the steps, contrast AA in light and dark, and every string in `ar.json` and `en.json` (Arabic default, Egyptian dialect for chat UI copy).
9. **Component inventory.** A table of the components to build, as a shared chat kit (e.g. in `packages/ui` or a new `packages/agent-ui`) so the hero, `/ai`, the editor dock and the dashboard assistant all reuse it: `ChatThread`, `Message`, `StreamingText`, `ThinkingIndicator`, `ToolStepList`, `QuestionCard`, `ConfirmCard`, `AttachmentChip`, `Composer`, `BuildTimeline`, `PreviewFrame`, `BrandRevealCard`, `ReviewChecklist`, `CreditsBadge`. For each: props, states, and the file split (`*.client.tsx`, `*.types.ts`, `*.lib.ts`).
10. **Mockups.** Include ASCII wireframes (desktop + mobile) for the hero input, `/onboarding`, `/stores/[id]/ai` (in progress, asking a question, final review) and the editor dock.

## 6. Output rules

- Write **only** `AI_AGENT_PLAN.md`. Do not commit unless I ask.
- Every claim about the code must be verified against the code, with the path.
- Do not invent features the code doesn't have; mark planned work as *Planned*.
- At the end of the session, reply with a short summary: the section list, the number of tasks per phase, the new dependencies and migrations proposed, the estimated cost per build, and the top 5 open questions.
