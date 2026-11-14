import { describe, expect, it, vi } from "vitest";
import { AI_TRANSLATE_LIMITS, type UntranslatedText } from "@workspace/store-sections";
import {
  normalizeTranslationSource,
  runSiteAiTranslation,
  siteTranslateMaxOutputTokens,
  siteTranslateOutputSchema,
  siteTranslateRequest,
  type SiteTranslateOutput,
  type TranslationMemory,
} from "./site-ai-translate.lib";

const text = (value: string, maxLength = 600): UntranslatedText => ({ text: value, maxLength, refs: [] });

function memory(seed: Record<string, string> = {}): TranslationMemory & { store: Map<string, string> } {
  const store = new Map(Object.entries(seed));
  return {
    store,
    get: (from, to, value) => store.get(`${from}>${to}:${value}`),
    set: (from, to, value, translation) => void store.set(`${from}>${to}:${value}`, translation),
  };
}

/** A fake model: "<source> (en)" for every id it is sent. */
const echo = vi.fn(async (request: { text: string }): Promise<SiteTranslateOutput> => {
  const items = JSON.parse(request.text.split("Items: ")[1]!) as { id: string; text: string }[];
  return { items: items.map((item) => ({ id: item.id, text: `EN ${item.id}` })) };
});

describe("siteTranslateRequest", () => {
  it("sends short ids, the direction and the store name as data", () => {
    const { text: request } = siteTranslateRequest([text("أهلا"), text('قول "لا"')], "ar", "en", "متجر سارة");
    expect(request).toContain("Translate from Arabic to English.");
    expect(request).toContain('Store name (keep as is): "متجر سارة"');
    expect(request).toContain(`Items: ${JSON.stringify([{ id: "1", text: "أهلا" }, { id: "2", text: 'قول "لا"' }])}`);
  });

  it("caps the output tokens", () => {
    expect(siteTranslateMaxOutputTokens([text("a".repeat(100))])).toBeLessThan(400);
    expect(siteTranslateMaxOutputTokens(Array.from({ length: 40 }, () => text("a".repeat(1000))))).toBe(4096);
  });

  it("has a short schema", () => {
    expect(siteTranslateOutputSchema.safeParse({ items: [{ id: "1", text: "Hi" }] }).success).toBe(true);
    expect(siteTranslateOutputSchema.safeParse({ items: Array.from({ length: 81 }, () => ({ id: "1", text: "x" })) }).success).toBe(false);
  });
});

describe("runSiteAiTranslation", () => {
  it("answers from memory first, sends the rest once, and remembers checked answers", async () => {
    const mem = memory({ "ar>en:أهلا بكم": "Welcome" });
    const translateBatch = vi.fn(async (): Promise<SiteTranslateOutput> => ({ items: [{ id: "1", text: "Order now" }] }));
    const beforeAi = vi.fn(async () => true);
    const run = await runSiteAiTranslation({
      texts: [text("أهلا   بكم"), text("اطلب دلوقتي")],
      from: "ar",
      to: "en",
      storeName: "x",
      maxCalls: 5,
      memory: mem,
      translateBatch,
      beforeAi,
    });
    expect(run.translations).toEqual(new Map([["أهلا   بكم", "Welcome"], ["اطلب دلوقتي", "Order now"]]));
    expect(run).toMatchObject({ fromMemory: 1, fromAi: 1, left: 0, calls: 1 });
    expect(beforeAi).toHaveBeenCalledWith(1);
    expect(mem.store.get("ar>en:اطلب دلوقتي")).toBe("Order now");
  });

  it("makes no call and asks for no credit when memory knows everything", async () => {
    const beforeAi = vi.fn(async () => true);
    const run = await runSiteAiTranslation({
      texts: [text("أهلا")],
      from: "ar",
      to: "en",
      storeName: "",
      maxCalls: 5,
      memory: memory({ "ar>en:أهلا": "Hello" }),
      translateBatch: echo,
      beforeAi,
    });
    expect(run).toMatchObject({ fromMemory: 1, fromAi: 0, calls: 0 });
    expect(beforeAi).not.toHaveBeenCalled();
  });

  it("sends nothing when refused (no credits), and counts everything as left", async () => {
    const translateBatch = vi.fn(echo);
    const run = await runSiteAiTranslation({
      texts: [text("أهلا"), text("مرحبا")],
      from: "ar",
      to: "en",
      storeName: "",
      maxCalls: 5,
      memory: memory(),
      translateBatch,
      beforeAi: async () => false,
    });
    expect(run).toMatchObject({ refused: true, left: 2, fromAi: 0, calls: 0 });
    expect(translateBatch).not.toHaveBeenCalled();
  });

  it("rejects bad answers and missing ids, keeps the good ones, and counts failed calls as left", async () => {
    const limits = { ...AI_TRANSLATE_LIMITS, batchTexts: 2 };
    let call = 0;
    const translateBatch = vi.fn(async (): Promise<SiteTranslateOutput> => {
      call += 1;
      if (call === 1) return { items: [{ id: "1", text: "{count} left" }, { id: "2", text: "ما زال عربي" }] };
      throw new Error("busy");
    });
    const mem = memory();
    const run = await runSiteAiTranslation({
      texts: [text("باقي {count}"), text("نص"), text("نص ثالث"), text("نص رابع")],
      from: "ar",
      to: "en",
      storeName: "",
      maxCalls: 5,
      memory: mem,
      translateBatch,
      limits,
    });
    expect([...run.translations.entries()]).toEqual([["باقي {count}", "{count} left"]]);
    expect(run).toMatchObject({ fromAi: 1, left: 3, calls: 2 });
    expect((run.error as Error).message).toBe("busy");
    expect(mem.store.size).toBe(1);
  });

  it("stops at the calls allowed and reports the rest as left", async () => {
    const limits = { ...AI_TRANSLATE_LIMITS, batchTexts: 1 };
    const run = await runSiteAiTranslation({
      texts: [text("واحد"), text("اثنين"), text("ثلاثة")],
      from: "ar",
      to: "en",
      storeName: "",
      maxCalls: 2,
      memory: memory(),
      translateBatch: echo,
      limits,
    });
    expect(run).toMatchObject({ fromAi: 2, left: 1, calls: 2 });
  });
});

describe("normalizeTranslationSource", () => {
  it("trims and folds spaces, keeps line breaks", () => {
    expect(normalizeTranslationSource("  أهلا \t  بكم\nهنا ")).toBe("أهلا بكم\nهنا");
  });
});
