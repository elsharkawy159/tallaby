/**
 * Live cost measurement of "Edit with AI" (docs/ai.md rule 12). Skipped by
 * default: it calls the real model only with `EDITOR_AGENT_LIVE=1` and a
 * Gemini key (from the environment, else `apps/dashboard/.env`). The database
 * is mocked, so no usage row, product or draft is written anywhere. Run:
 *
 *   EDITOR_AGENT_LIVE=1 pnpm --filter dashboard exec vitest run edit-with-ai.live
 *
 * It runs the same steps as `editWithAiTurn` (code routing, section pick and
 * scope, the router call when code can't tell, the edit call on one section
 * or on the whole page, the advice call, or the store agent's tool loop) and
 * prints tokens, cost and the outcome per request; log the numbers in
 * PLAN.md §23.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";

vi.mock("@workspace/db", async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  const rows = Object.assign(Promise.resolve([]), { limit: async () => [], orderBy: async () => [] });
  const chain: Record<string, unknown> = {};
  for (const key of ["from", "innerJoin", "leftJoin"]) chain[key] = () => chain;
  chain.where = () => rows;
  chain.limit = async () => [];
  chain.orderBy = async () => [];
  return { ...actual, db: { insert: () => ({ values: async () => undefined }), select: () => chain, execute: async () => [] } };
});

function liveKey(): string {
  const fromEnv = process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim();
  if (fromEnv) return fromEnv;
  try {
    const file = readFileSync(path.resolve(__dirname, "../../../../../../../../.env"), "utf8");
    return /^GOOGLE_GENERATIVE_AI_API_KEY=(.*)$/m.exec(file)?.[1]?.trim().replace(/^["']|["']$/g, "") ?? "";
  } catch {
    return "";
  }
}

const enabled = process.env.EDITOR_AGENT_LIVE === "1" && liveKey() !== "";

const PHOTO = "https://x.supabase.co/storage/v1/object/public/store-media/11111111-1111-4111-8111-111111111111/22222222-2222-4222-8222-222222222222/33333333-3333-4333-8333-333333333333.jpg";

const L = (ar: string, en: string) => ({ text: ar, translations: { en: { text: en } } });
const hero = {
  id: "s-hero",
  sectionId: "custom-section",
  version: 1,
  props: {},
  componentTree: [
    {
      id: "n-root",
      type: "section" as const,
      props: { label: "الواجهة" },
      style: { paddingTop: 0, paddingBottom: 0 },
      children: [
        { id: "n-photo", type: "image" as const, props: { src: "https://images.pexels.com/photos/1/hero.jpg", alt: "تشكيلة الشتاء", translations: { en: { alt: "Winter collection" } } }, children: [], style: { aspectRatio: "banner" as const, objectFit: "cover" as const } },
        { id: "n-title", type: "heading" as const, props: { ...L("تشكيلة الشتاء وصلت", "The winter collection is here"), level: "h1" }, children: [] },
        { id: "n-cta", type: "button" as const, props: { label: "تسوق الآن", href: "/products", translations: { en: { label: "Shop now" } } }, children: [] },
      ],
    },
  ],
};
const products = {
  id: "s-products",
  sectionId: "custom-section",
  version: 1,
  props: {},
  componentTree: [{ id: "n-proot", type: "section" as const, props: { label: "المنتجات" }, children: [{ id: "n-ph", type: "heading" as const, props: { ...L("الأكثر مبيعًا", "Best sellers"), level: "h2" }, children: [] }] }],
};
const header = {
  id: "s-header",
  sectionId: "custom-section",
  version: 1,
  props: {},
  componentTree: [
    {
      id: "n-hroot",
      type: "section" as const,
      props: { label: "الهيدر" },
      children: [{ id: "n-ann", type: "text" as const, props: { ...L("شحن مجاني فوق ٥٠٠ جنيه", "Free shipping over EGP 500"), label: "شريط الإعلان" }, children: [] }],
    },
  ],
};

const SAMPLES = [
  { name: "hero photo", message: "change the hero image to this photo", images: [PHOTO], file: false },
  { name: "faq", message: "add an FAQ section about returns", images: [], file: false },
  { name: "product", message: "add this product, price 450", images: [PHOTO], file: false },
  { name: "announcement", message: "make the announcement text: free shipping over 1000", images: [], file: false },
  { name: "import", message: "import these products", images: [], file: true },
  // Page scope by code ("homepage"), page scope by the router, an open request on one section, advice by code, and help by code.
  { name: "page: improve", message: "improve my homepage so it sells more", images: [], file: false },
  { name: "page: router", message: "خلّي الشكل أشيك ومناسب للموبايل", images: [], file: false },
  { name: "open hero", message: "make the hero more professional", images: [], file: false },
  { name: "advice", message: "راجع الصفحة وقولّي أعدّل إيه عشان أبيع أكتر", images: [], file: false },
  { name: "help", message: "create a new page for our story", images: [], file: false },
];

describe.skipIf(!enabled)("edit with AI live cost", () => {
  it("measures the sample requests", { timeout: 600_000 }, async () => {
    process.env.GOOGLE_GENERATIVE_AI_API_KEY = liveKey();
    const { generateStructured, costMicroUsd } = await import("@workspace/ai");
    const { cleanAgentReply, cleanAgentSuggestions, editorAgentModelOutputWithSuggestionsSchema, runEditorAgentTurn, serializeSiteOutline, siteOutline, siteOutlineEntry } = await import("@workspace/store-sections/agent-server");
    const { createAgentRegistry, createAgentRuntime, InMemoryPendingStore, InMemoryReadCap, runAgentTurn } = await import("@workspace/agent");
    const lib = await import("./edit-with-ai.lib");

    const sellerId = "00000000-0000-4000-8000-000000000000";
    const storeId = "22222222-2222-4222-8222-222222222222";
    const outline = siteOutline([hero, products], "ar");
    const pageContext = { name: "الرئيسية", kind: "home" as const };
    const outlineText = serializeSiteOutline({ page: outline, header: siteOutlineEntry(header, "ar"), footer: null });
    const rows: string[] = [];
    let total = 0;

    for (const sample of SAMPLES) {
      const calls: { modelId: string; input: number; output: number; cost: number }[] = [];
      const started = Date.now();
      const call = async <T,>(options: Parameters<typeof generateStructured>[0]) => {
        const { object, usage, modelId } = await generateStructured(options);
        const cost = costMicroUsd(modelId, usage);
        calls.push({ modelId, input: usage.inputTokens ?? 0, output: usage.outputTokens ?? 0, cost });
        return object as T;
      };
      let outcome = "";
      const code = lib.routeByCode({ message: sample.message, hasFile: sample.file, imageCount: sample.images.length });
      let route: string | null = code?.route ?? null;
      let target: import("./edit-with-ai.lib").CodeTarget | null = route === "site" ? lib.pickTargetByCode({ message: sample.message, outline, hasHeader: true, hasFooter: false }) : null;
      let pageScope = false;
      if (route === "import") outcome = "import card (no model)";
      const help = route === "advice" ? [] : lib.outOfReach(sample.message, storeId, { strongOnly: true }).filter((link) => route !== "site" || link.key === "pages");
      if (help.length) {
        route = "help";
        outcome = `help links ${help.map((link) => link.href).join(",")} (no model)`;
      }
      if (route === "site" && !target && lib.scopeByCode(sample.message) === "page") {
        target = { kind: "page" };
        pageScope = true;
      }
      if ((route === null || route === "site") && !target) {
        const routed = await call<{ route: string; target: "page" | "header" | "footer" | null; sectionId: string | null; scope: "section" | "page" | null }>({
          feature: lib.EDIT_WITH_AI_FEATURE,
          sellerId,
          tier: "fast",
          schema: lib.editWithAiRouterSchema,
          system: lib.EDIT_WITH_AI_ROUTER_SYSTEM,
          content: [{ type: "text", text: lib.editWithAiRouterText({ outlineText, message: sample.message, imageCount: sample.images.length, page: pageContext, selected: false }) }],
          thinkingLevel: "minimal",
          maxOutputTokens: 300,
        });
        route ??= routed.route;
        target = routed.target === "header" ? { kind: "header" } : routed.sectionId ? { kind: "page", sectionId: routed.sectionId } : { kind: "page", add: true };
        if (route === "site" && routed.target !== "header" && !routed.sectionId && routed.scope === "page") {
          target = { kind: "page" };
          pageScope = true;
        }
        outcome += `router → ${routed.route}/${routed.target}/${routed.sectionId}/${routed.scope}; `;
      }
      if (route === "advice") {
        const advice = await call<{ reply: string; suggestions: string[] | null }>({
          feature: lib.EDIT_WITH_AI_FEATURE,
          sellerId,
          tier: "fast",
          schema: lib.editWithAiAdviceSchema,
          system: lib.EDIT_WITH_AI_ADVICE_SYSTEM,
          content: [{ type: "text", text: lib.editWithAiAdviceText({ outlineText, message: sample.message, facts: lib.pageFacts([hero, products], outline), page: pageContext, selected: false, locales: ["ar", "en"] }) }],
          thinkingLevel: "minimal",
          maxOutputTokens: 1000,
        });
        const reply = cleanAgentReply(advice.reply, lib.MAX_ADVICE_REPLY_LENGTH);
        expect(reply.length).toBeGreaterThan(0);
        outcome += `advice ${reply.length} chars; suggestions ${JSON.stringify(cleanAgentSuggestions(advice.suggestions))}; reply ${JSON.stringify(reply.slice(0, 160))}`;
      }
      if (route === "site" && target) {
        const isHeader = target.kind === "header";
        const sectionId = target.kind === "page" ? target.sectionId : undefined;
        const section = isHeader ? header : sectionId ? [hero, products].find((s) => s.id === sectionId) ?? null : null;
        const result = await runEditorAgentTurn(
          {
            message: sample.message,
            uiLocale: "en",
            contentLocale: "ar",
            target: isHeader ? { kind: "header" } : { kind: "page", ...(sectionId && { sectionId }) },
            section,
            outline: outline.map(({ id, name, kind }) => ({ id, name, kind })),
            history: [],
            store: { name: "Dafa Wear", defaultLocale: "ar", locales: ["ar", "en"], colors: { primary: "#145163" }, typography: { headingFont: "Cairo", bodyFont: "Cairo" } },
            allowCode: true,
            content: { sections: isHeader ? [header] : [hero, products] },
            page: pageContext,
            ...(pageScope && { pageSections: [hero, products] }),
            maxModelCalls: 2,
            images: sample.images.map((src, i) => ({ src, label: `photo ${i + 1} (uploaded now)` })),
            allowImage: (src) => (sample.images.includes(src) ? src : null),
          },
          {
            callModel: ({ system, text }) =>
              call({ feature: lib.EDIT_WITH_AI_FEATURE, sellerId, tier: "fast", schema: editorAgentModelOutputWithSuggestionsSchema, system, content: [{ type: "text", text }], thinkingLevel: "minimal", maxOutputTokens: 12_000 }),
          },
        );
        if (pageScope) expect(result.target).toEqual({ kind: "page", scope: "page" });
        outcome += `${result.target.scope ?? "section"} scope; suggestions ${JSON.stringify(result.suggestions)}; applied ${result.applied.map((a) => a.op.op).join(",") || "none"}; rejected ${result.rejected.map((r) => r.code).join(",") || "none"}; reply ${JSON.stringify(result.reply.slice(0, 80))}`;
      } else if (route === "products" || route === "settings" || route === "shipping" || route === "design") {
        const runtime = createAgentRuntime({
          registry: createAgentRegistry(),
          pending: new InMemoryPendingStore(),
          readCap: new InMemoryReadCap(),
          logger: { record: async () => undefined },
        });
        const ctx = { sellerId, storeId, locale: "en" as const, source: "in_app" as const, publishProducts: false };
        const result = await runAgentTurn(runtime, ctx, { skillId: route, message: sample.message, stateSummary: `Prices are in the store's currency, EGP.\nPhotos the seller attached (use these exact links in "images"): ${sample.images.join(" ")}` }, { skipDailyCap: true });
        calls.push({ modelId: result.modelId, input: 0, output: 0, cost: result.costMicroUsd });
        outcome += `agent ${route}: ${result.steps} steps, reads ${result.reads.join(",") || "none"}, proposals ${result.proposals.length}, rejected ${result.rejected.map((r) => `${r.tool}:${r.code}`).join(",") || "none"}`;
      }
      const cost = calls.reduce((sum, c) => sum + c.cost, 0);
      total += cost;
      rows.push(`${sample.name}: ${calls.map((c) => `${c.modelId} ${c.input}/${c.output}`).join(" + ") || "no model"} = $${(cost / 1e6).toFixed(5)} in ${Date.now() - started} ms; ${outcome}`);
    }
    console.log(`\n[edit-with-ai live]\n${rows.join("\n")}\naverage $${(total / SAMPLES.length / 1e6).toFixed(5)} a request`);
    expect(rows).toHaveLength(SAMPLES.length);
  });
});
