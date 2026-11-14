import { describe, expect, it } from "vitest";
import type { ComponentNode, PageContent, SectionInstance } from "../config/schema";
import {
  AI_TRANSLATE_LIMITS,
  acceptAiTranslation,
  applyPageAiTranslations,
  applyPageNameAiTranslation,
  applySectionAiTranslations,
  collectPageNameUntranslated,
  collectPageUntranslated,
  collectSectionUntranslated,
  isAiTranslatable,
  planAiTranslationRun,
  type UntranslatedCollection,
  type UntranslatedText,
} from "./ai-translate";

const section = (nodes: ComponentNode[]): SectionInstance => ({ id: "s1", sectionId: "custom-section", version: 1, props: {}, componentTree: nodes });
const node = (id: string, type: ComponentNode["type"], props: Record<string, unknown>, children: ComponentNode[] = []): ComponentNode => ({ id, type, props, children });
const collect = (instance: SectionInstance, defaultLocale: "ar" | "en" = "ar", storeNames?: string[]) =>
  collectSectionUntranslated(instance, { defaultLocale, storeNames }, new Map());

describe("isAiTranslatable", () => {
  const ar = { defaultLocale: "ar" as const, storeNames: ["متجر سارة", "Sara Store"] };
  const en = { defaultLocale: "en" as const, storeNames: ["Sara Store"] };

  it("takes the default language's own text", () => {
    expect(isAiTranslatable("عرضنا الخاص لهذا الأسبوع", ar)).toBe(true);
    expect(isAiTranslatable("خصم ٢٠٪ على Nike", ar)).toBe(true);
    expect(isAiTranslatable("Our summer collection", en)).toBe(true);
  });

  it("skips Latin text in an Arabic store and Arabic text in an English store", () => {
    expect(isAiTranslatable("Nike Air", ar)).toBe(false);
    expect(isAiTranslatable("عرض", en)).toBe(false);
  });

  it("skips store names, links, emails, phones, numbers and short tokens", () => {
    expect(isAiTranslatable("متجر سارة", ar)).toBe(false);
    expect(isAiTranslatable(" sara store ", en)).toBe(false);
    expect(isAiTranslatable("https://example.com/shop", en)).toBe(false);
    expect(isAiTranslatable("www.example.com", en)).toBe(false);
    expect(isAiTranslatable("hello@shop.com", en)).toBe(false);
    expect(isAiTranslatable("+20 100 123 4567", en)).toBe(false);
    expect(isAiTranslatable("٠١٠٠١٢٣٤٥٦٧", ar)).toBe(false);
    expect(isAiTranslatable("٥٠٪", ar)).toBe(false);
    expect(isAiTranslatable("ج", ar)).toBe(false);
    expect(isAiTranslatable("XL", en)).toBe(false);
    expect(isAiTranslatable("SKU", en)).toBe(false);
    expect(isAiTranslatable("   ", ar)).toBe(false);
  });
});

describe("collect", () => {
  it("collects the translatable fields missing the other language, deduped, with their refs", () => {
    const instance = section([
      node("h1", "heading", { text: "  أهلا بكم في متجرنا ", level: "h2" }),
      node("b1", "button", { label: "اطلب دلوقتي", href: "/" }),
      node("i1", "image", { src: "/a.jpg", alt: "أهلا بكم في متجرنا" }),
      node("box", "container", { label: "قسم الترحيب" }, [node("p1", "paragraph", { text: "كلام البائع" })]),
    ]);
    const texts = collect(instance);
    expect([...texts.keys()]).toEqual(["أهلا بكم في متجرنا", "اطلب دلوقتي", "كلام البائع"]);
    expect(texts.get("أهلا بكم في متجرنا")!.refs).toEqual([
      { kind: "node", nodeId: "h1", key: "text" },
      { kind: "node", nodeId: "i1", key: "alt" },
    ]);
    // The shortest limit of the fields it is used in (image alt: 160).
    expect(texts.get("أهلا بكم في متجرنا")!.maxLength).toBe(160);
  });

  it("skips text that already has the other language, store names and the store-name role", () => {
    const instance = section([
      node("h1", "heading", { text: "عنوان مترجم", translations: { en: { text: "Translated" } } }),
      node("h2", "heading", { text: "عنوان بمسافة", translations: { en: { text: "   " } } }),
      node("n1", "text", { role: "storeName", text: "اسم المتجر" }),
      node("n2", "text", { text: "متجر سارة" }),
    ]);
    expect([...collect(instance, "ar", ["متجر سارة"]).keys()]).toEqual(["عنوان بمسافة"]);
  });

  it("collects English text of an English store, and page names", () => {
    const into: UntranslatedCollection = new Map();
    const content: PageContent = { sections: [section([node("h1", "heading", { text: "Fresh every day" })])] };
    collectPageUntranslated(content, { defaultLocale: "en" }, into);
    collectPageNameUntranslated({ en: "Our story" }, { defaultLocale: "en" }, into);
    collectPageNameUntranslated({ en: "Home", ar: "الرئيسية" }, { defaultLocale: "en" }, into);
    expect([...into.keys()]).toEqual(["Fresh every day", "Our story"]);
    expect(into.get("Our story")!.refs).toEqual([{ kind: "pageName" }]);
  });
});

describe("apply", () => {
  const translations = new Map([
    ["أهلا بكم", "Welcome"],
    ["اطلب دلوقتي", "Order now"],
  ]);

  it("writes only into the empty other-language value, everywhere the text is used", () => {
    const instance = section([
      node("h1", "heading", { text: "أهلا بكم" }),
      node("h2", "heading", { text: "أهلا بكم", translations: { en: { label: "Hero" } } }),
      node("b1", "button", { label: "اطلب دلوقتي", translations: { en: { label: "Buy it" } } }),
    ]);
    const { instance: next, applied } = applySectionAiTranslations(instance, { defaultLocale: "ar", translations });
    expect(applied).toBe(2);
    const [h1, h2, b1] = next.componentTree!;
    expect(h1!.props).toEqual({ text: "أهلا بكم", translations: { en: { text: "Welcome" } } });
    expect(h2!.props).toEqual({ text: "أهلا بكم", translations: { en: { label: "Hero", text: "Welcome" } } });
    // Never over text the seller wrote.
    expect(b1).toBe(instance.componentTree![2]);
  });

  it("never changes the default language, and returns the same object when nothing applies", () => {
    const instance = section([node("h1", "heading", { text: "نص آخر" })]);
    expect(applySectionAiTranslations(instance, { defaultLocale: "ar", translations }).instance).toBe(instance);
    const content: PageContent = { sections: [instance] };
    expect(applyPageAiTranslations(content, { defaultLocale: "ar", translations }).content).toBe(content);
  });

  it("drops a translation longer than the field allows", () => {
    const instance = section([node("b1", "button", { label: "اطلب دلوقتي" })]);
    const long = new Map([["اطلب دلوقتي", "x".repeat(61)]]);
    expect(applySectionAiTranslations(instance, { defaultLocale: "ar", translations: long }).applied).toBe(0);
  });

  it("fills a page name's empty language only", () => {
    const names = new Map([["من نحن", "About us"]]);
    expect(applyPageNameAiTranslation({ ar: "من نحن" }, { defaultLocale: "ar", translations: names })).toEqual({ ar: "من نحن", en: "About us" });
    expect(applyPageNameAiTranslation({ ar: "من نحن", en: "Who" }, { defaultLocale: "ar", translations: names })).toBeNull();
  });
});

describe("planAiTranslationRun", () => {
  const text = (value: string): UntranslatedText => ({ text: value, maxLength: 600, refs: [] });
  const limits = { ...AI_TRANSLATE_LIMITS, maxTexts: 5, maxRunChars: 100, batchTexts: 2, batchChars: 30, maxTextChars: 40 };

  it("batches by count and size, in order", () => {
    const plan = planAiTranslationRun([text("a".repeat(10)), text("b".repeat(10)), text("c".repeat(10)), text("d".repeat(25))], { maxCalls: 10, limits });
    expect(plan.batches.map((batch) => batch.map((t) => t.text[0]))).toEqual([["a", "b"], ["c"], ["d"]]);
    expect(plan.left).toBe(0);
  });

  it("counts what is too long, over the run caps or over the calls allowed as left", () => {
    const many = Array.from({ length: 8 }, (_, i) => text(String.fromCharCode(97 + i).repeat(10)));
    const plan = planAiTranslationRun([text("z".repeat(41)), ...many], { maxCalls: 10, limits });
    expect(plan.batches.flat()).toHaveLength(5);
    expect(plan.left).toBe(4);
    const capped = planAiTranslationRun(many, { maxCalls: 1, limits });
    expect(capped.batches).toHaveLength(1);
    expect(capped.left).toBe(6);
    expect(planAiTranslationRun(many, { maxCalls: 0, limits }).batches).toHaveLength(0);
  });

  it("stays within the default caps", () => {
    const plan = planAiTranslationRun(Array.from({ length: 300 }, (_, i) => text(`نص رقم ${i} `.repeat(4))), { maxCalls: 100 });
    const sent = plan.batches.flat();
    expect(sent.length).toBeLessThanOrEqual(AI_TRANSLATE_LIMITS.maxTexts);
    expect(sent.reduce((sum, t) => sum + t.text.length, 0)).toBeLessThanOrEqual(AI_TRANSLATE_LIMITS.maxRunChars);
    for (const batch of plan.batches) {
      expect(batch.length).toBeLessThanOrEqual(AI_TRANSLATE_LIMITS.batchTexts);
      expect(batch.reduce((sum, t) => sum + t.text.length, 0)).toBeLessThanOrEqual(AI_TRANSLATE_LIMITS.batchChars);
    }
    expect(sent.length + plan.left).toBe(300);
  });
});

describe("acceptAiTranslation", () => {
  it("accepts a clean translation, trimmed", () => {
    expect(acceptAiTranslation("أهلا بكم", "  Welcome ", "en", 100)).toBe("Welcome");
    expect(acceptAiTranslation("Welcome", "أهلا بكم", "ar", 100)).toBe("أهلا بكم");
  });

  it("rejects the wrong script, an empty or too long answer", () => {
    expect(acceptAiTranslation("أهلا", "أهلا", "en", 100)).toBeNull();
    expect(acceptAiTranslation("Hello", "Hello", "ar", 100)).toBeNull();
    expect(acceptAiTranslation("أهلا", "Welcome مرحبا", "en", 100)).toBeNull();
    expect(acceptAiTranslation("أهلا", "", "en", 100)).toBeNull();
    expect(acceptAiTranslation("أهلا", 5, "en", 100)).toBeNull();
    expect(acceptAiTranslation("أهلا", "Welcome", "en", 3)).toBeNull();
  });

  it("keeps placeholders, tags, links and line breaks", () => {
    expect(acceptAiTranslation("باقي {count} قطعة", "{count} left", "en", 100)).toBe("{count} left");
    expect(acceptAiTranslation("باقي {count} قطعة", "Only a few left", "en", 100)).toBeNull();
    expect(acceptAiTranslation("<b>عرض</b> اليوم", "<b>Offer</b> today", "en", 100)).toBe("<b>Offer</b> today");
    expect(acceptAiTranslation("<b>عرض</b> اليوم", "Offer today", "en", 100)).toBeNull();
    expect(acceptAiTranslation("زورونا على www.shop.com", "Visit us at www.shop.com", "en", 100)).toBe("Visit us at www.shop.com");
    expect(acceptAiTranslation("زورونا على www.shop.com", "Visit our shop", "en", 100)).toBeNull();
    expect(acceptAiTranslation("سطر أول\nسطر ثاني", "First line\nSecond line", "en", 100)).toBe("First line\nSecond line");
    expect(acceptAiTranslation("سطر أول\nسطر ثاني", "First line, second line", "en", 100)).toBeNull();
  });
});
