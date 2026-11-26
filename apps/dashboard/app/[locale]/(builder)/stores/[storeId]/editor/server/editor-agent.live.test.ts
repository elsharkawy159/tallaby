/**
 * Live cost measurement of the editor agent (docs/ai.md rule 12). Skipped by
 * default: it calls the real model only with `EDITOR_AGENT_LIVE=1` and a
 * Gemini key (from the environment, else `apps/dashboard/.env`). The database
 * is mocked, so no usage row is written anywhere. Run:
 *
 *   EDITOR_AGENT_LIVE=1 pnpm --filter dashboard exec vitest run editor-agent.live
 *
 * It prints tokens, cost and the outcome per turn; log the numbers in PLAN.md §23.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";

vi.mock("@workspace/db", () => ({
  db: { insert: () => ({ values: async () => undefined }), select: () => ({ from: () => ({ where: async () => [] }) }) },
  aiUsageLogs: {},
  and: () => null,
  count: () => null,
  eq: () => null,
  gte: () => null,
}));

function liveKey(): string {
  const fromEnv = process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim();
  if (fromEnv) return fromEnv;
  try {
    const file = readFileSync(path.resolve(__dirname, "../../../../../../../.env"), "utf8");
    return /^GOOGLE_GENERATIVE_AI_API_KEY=(.*)$/m.exec(file)?.[1]?.trim().replace(/^["']|["']$/g, "") ?? "";
  } catch {
    return "";
  }
}

const enabled = process.env.EDITOR_AGENT_LIVE === "1" && liveKey() !== "";

const hero = {
  id: "s-hero",
  sectionId: "custom-section",
  version: 1,
  props: {},
  componentTree: [
    {
      id: "n-root",
      type: "section" as const,
      props: {},
      style: { paddingTop: 64, paddingBottom: 64 },
      children: [
        { id: "n-title", type: "heading" as const, props: { text: "تشكيلة الشتاء وصلت", level: "h1", translations: { en: { text: "The winter collection is here" } } }, children: [], style: { fontSize: "display-md" } },
        { id: "n-text", type: "paragraph" as const, props: { text: "خامات دافية وتصميمات مريحة", translations: { en: { text: "Warm fabrics, easy fits" } } }, children: [] },
        { id: "n-cta", type: "button" as const, props: { label: "تسوق الآن", href: "/products", translations: { en: { label: "Shop now" } } }, children: [] },
      ],
    },
  ],
};

const SAMPLES = [
  { name: "faq", message: "add an FAQ section with 5 questions about shipping" },
  { name: "hero title", message: "make this hero title bigger and red on mobile" },
  { name: "comparison", message: "convert this section to a 3-column comparison table" },
  { name: "size guide", message: "ضيف جدول مقاسات للتيشيرتات تحت القسم ده" },
  { name: "button text", message: "change the button text to اطلب الآن" },
];

describe.skipIf(!enabled)("editor agent live cost", () => {
  it("measures 5 sample turns", { timeout: 300_000 }, async () => {
    process.env.GOOGLE_GENERATIVE_AI_API_KEY = liveKey();
    const { generateStructured, costMicroUsd } = await import("@workspace/ai");
    const { buildAgentContent, editorAgentModelOutputSchema, runEditorAgentTurn, EDITOR_AGENT_FEATURE } = await import("@workspace/store-sections/agent-server");
    const rows: string[] = [];
    let total = 0;
    for (const sample of SAMPLES) {
      const calls: { modelId: string; input: number; output: number; cost: number }[] = [];
      const started = Date.now();
      const result = await runEditorAgentTurn(
        {
          message: sample.message,
          uiLocale: "en",
          contentLocale: "ar",
          target: { kind: "page", sectionId: "s-hero" },
          section: hero,
          outline: [{ id: "s-hero", name: "Hero", kind: "tree" }, { id: "s-products", name: "Products", kind: "tree" }],
          history: [],
          store: { name: "Dafa Wear", defaultLocale: "ar", locales: ["ar", "en"], colors: { primary: "#145163", accent: "#f5b700" }, typography: { headingFont: "Cairo", bodyFont: "Cairo" } },
          allowCode: true,
          content: buildAgentContent({ target: { kind: "page", sectionId: "s-hero" }, section: hero, outlineIds: ["s-hero", "s-products"] })!,
          maxModelCalls: 2,
        },
        {
          callModel: async ({ system, text }) => {
            const { object, usage, modelId } = await generateStructured({
              feature: EDITOR_AGENT_FEATURE,
              sellerId: "00000000-0000-4000-8000-000000000000",
              tier: "fast",
              schema: editorAgentModelOutputSchema,
              system,
              content: [{ type: "text", text }],
              thinkingLevel: "minimal",
              maxOutputTokens: 12_000,
            });
            const cost = costMicroUsd(modelId, usage);
            calls.push({ modelId, input: usage.inputTokens ?? 0, output: usage.outputTokens ?? 0, cost });
            return object;
          },
        },
      );
      const cost = calls.reduce((sum, c) => sum + c.cost, 0);
      total += cost;
      rows.push(
        `${sample.name}: ${calls.map((c) => `${c.modelId} ${c.input}/${c.output}`).join(" + ")} = $${(cost / 1e6).toFixed(5)} in ${Date.now() - started} ms; ` +
          `applied ${result.applied.map((a) => a.op.op).join(",") || "none"}; rejected ${result.rejected.map((r) => r.code).join(",") || "none"}; reply ${JSON.stringify(result.reply.slice(0, 80))}`,
      );
    }
    console.log(`\n[editor-agent live]\n${rows.join("\n")}\naverage $${(total / SAMPLES.length / 1e6).toFixed(5)} a turn`);
    expect(rows).toHaveLength(SAMPLES.length);
  });
});
