import { describe, expect, it, vi } from "vitest";
import type { SectionInstance } from "../config/schema";
import { joinSectionFile } from "../code/section-file";
import type { EditorAgentModelOp, EditorAgentModelOutput } from "./model-output";
import { cleanAgentReply, cleanAgentSuggestions, editorAgentModelOutputSchema, editorAgentModelOutputWithSuggestionsSchema, toSectionOpCandidate } from "./model-output";
import { applySectionOps, MAX_OPS_PER_TURN, MAX_PAGE_OPS_PER_TURN, maxOpsFor } from "./section-ops";
import { MAX_PAGE_PROMPT_BYTES } from "./serialize";
import { buildAgentContent, runEditorAgentTurn, type EditorAgentTurnRequest } from "./turn.server";

const hero: SectionInstance = {
  id: "s-hero",
  sectionId: "custom-section",
  version: 1,
  props: {},
  componentTree: [
    {
      id: "n-root",
      type: "section",
      props: {},
      children: [{ id: "n-title", type: "heading", props: { text: "أهلا", level: "h2", translations: { en: { text: "Hello" } } }, children: [] }],
    },
  ],
};

const row = (fields: Partial<EditorAgentModelOp> & { op: EditorAgentModelOp["op"] }): EditorAgentModelOp => ({
  sectionId: null,
  nodeId: null,
  after: null,
  to: null,
  file: null,
  name: null,
  prop: null,
  src: null,
  ar: null,
  en: null,
  breakpoint: null,
  device: null,
  styleJson: null,
  css: null,
  href: null,
  settingsJson: null,
  blocksJson: null,
  ...fields,
});

const schema = {
  name: { ar: "جدول المقاسات", en: "Size guide" },
  settings: [{ type: "text", id: "title", label: { ar: "العنوان", en: "Title" }, default: { ar: "جدول المقاسات", en: "Size guide" } }],
};
const GOOD_FILE = joinSectionFile({ source: '<div class="sg"><h2>{{ section.settings.title }}</h2></div>', css: ".sg { padding-inline: 16px; }", schema });
const SCRIPT_FILE = joinSectionFile({ source: '<div><script>alert(1)</script>{{ section.settings.title }}</div>', css: "", schema });

let seq = 0;
const request = (extra: Partial<EditorAgentTurnRequest> = {}): EditorAgentTurnRequest => ({
  message: "add a size guide",
  uiLocale: "en",
  contentLocale: "ar",
  target: { kind: "page", sectionId: "s-hero" },
  section: hero,
  outline: [{ id: "s-hero", name: "Hero", kind: "tree" }, { id: "s-2", name: "Products", kind: "tree" }],
  history: [],
  store: { name: "Store", defaultLocale: "ar", locales: ["ar", "en"] },
  allowCode: true,
  content: buildAgentContent({ target: { kind: "page", sectionId: "s-hero" }, section: hero, outlineIds: ["s-hero", "s-2"] })!,
  maxModelCalls: 10,
  makeId: (kind) => `${kind === "section" ? "s" : "n"}-x${++seq}`,
  ...extra,
});

const answer = (ops: EditorAgentModelOp[], reply = "Done"): EditorAgentModelOutput => ({ reply, ops });

describe("runEditorAgentTurn", () => {
  it("set_image: refuses a photo the host didn't vouch for, takes one it did, and lists it for the model", async () => {
    const MEDIA = "https://x.supabase.co/storage/v1/object/public/store-media/a/b/c.jpg";
    const withImage = { ...hero, componentTree: [{ ...hero.componentTree![0]!, children: [...hero.componentTree![0]!.children, { id: "n-img", type: "image" as const, props: { src: "", alt: "" }, children: [] }] }] };
    const content = buildAgentContent({ target: { kind: "page", sectionId: "s-hero" }, section: withImage, outlineIds: ["s-hero"] })!;
    const op = row({ op: "set_image", sectionId: "s-hero", nodeId: "n-img", src: MEDIA, ar: "صورة", en: "Photo" });
    const refused = await runEditorAgentTurn(request({ section: withImage, content }), { callModel: async () => answer([op]) });
    expect(refused.rejected).toMatchObject([{ code: "image_not_allowed" }]);
    const callModel = vi.fn(async () => answer([op]));
    const taken = await runEditorAgentTurn(
      request({ section: withImage, content, images: [{ src: MEDIA, label: "hero.jpg" }], allowImage: (src) => (src === MEDIA ? src : null) }),
      { callModel },
    );
    expect(taken.ops).toEqual([{ op: "set_image", sectionId: "s-hero", nodeId: "n-img", src: MEDIA, alt: { ar: "صورة", en: "Photo" } }]);
    expect((callModel.mock.calls[0] as unknown as [{ text: string }])[0].text).toContain(`- ${MEDIA} | "hero.jpg"`);
  });

  it("applies tree ops and describes them", async () => {
    const callModel = vi.fn(async () =>
      answer([
        row({ op: "set_text", sectionId: "s-hero", nodeId: "n-title", prop: "text", ar: "اطلب الآن", en: "Order now" }),
        row({ op: "set_style", sectionId: "s-hero", nodeId: "n-title", breakpoint: "mobile", styleJson: '{"fontSize":"4xl","color":"#d92d20"}' }),
      ]),
    );
    const result = await runEditorAgentTurn(request(), { callModel });
    expect(callModel).toHaveBeenCalledTimes(1);
    expect(result.applied).toHaveLength(2);
    expect(result.summary).toEqual(["Changed a text", "Changed the style (mobile)"]);
    expect(result.rejected).toEqual([]);
    expect(result.codeNodes).toEqual([]);
    const title = result.content.sections[0]!.componentTree![0]!.children[0]!;
    expect(title.props.text).toBe("اطلب الآن");
    expect(title.breakpointStyles?.mobile).toEqual({ fontSize: "4xl", color: "#d92d20" });
  });

  it("adds a code section with full checks and returns it for the preview", async () => {
    const callModel = vi.fn(async () => answer([row({ op: "add_code_section", file: GOOD_FILE, name: "Size guide" })]));
    const result = await runEditorAgentTurn(request(), { callModel });
    expect(result.applied).toHaveLength(1);
    expect(result.codeNodes).toHaveLength(1);
    expect(result.codeNodes[0]!.file).toContain("{% schema %}");
    expect(result.content.sections.map((s) => s.id)).toEqual(["s-hero", result.applied[0]!.sectionId, "s-2"]);
  });

  it("retries once with the problems when a code file has <script>, then rejects it", async () => {
    const callModel = vi.fn(async () => answer([row({ op: "add_code_section", file: SCRIPT_FILE })]));
    const result = await runEditorAgentTurn(request(), { callModel });
    expect(callModel).toHaveBeenCalledTimes(2);
    const second = callModel.mock.calls[1] as unknown as [{ text: string; attempt: number }];
    expect(second[0].attempt).toBe(2);
    expect(second[0].text).toContain("previous answer had problems");
    expect(second[0].text).toMatch(/Script tags are not allowed/);
    expect(result.retried).toBe(true);
    expect(result.modelCalls).toBe(2);
    expect(result.ops).toEqual([]);
    expect(result.rejected).toMatchObject([{ index: 0, code: "invalid_code" }]);
  });

  it("keeps the fixed answer of the retry", async () => {
    const callModel = vi
      .fn<() => Promise<EditorAgentModelOutput>>()
      .mockResolvedValueOnce(answer([row({ op: "add_code_section", file: SCRIPT_FILE })]))
      .mockResolvedValueOnce(answer([row({ op: "add_code_section", file: GOOD_FILE })], "Fixed"));
    const result = await runEditorAgentTurn(request(), { callModel });
    expect(result.reply).toBe("Fixed");
    expect(result.applied).toHaveLength(1);
  });

  it("doesn't retry when the daily cap leaves one call, and a failed retry keeps the first answer", async () => {
    const once = vi.fn(async () => answer([row({ op: "add_code_section", file: SCRIPT_FILE })]));
    expect((await runEditorAgentTurn(request({ maxModelCalls: 1 }), { callModel: once })).modelCalls).toBe(1);
    const failing = vi
      .fn<() => Promise<EditorAgentModelOutput>>()
      .mockResolvedValueOnce(answer([row({ op: "set_text", sectionId: "s-hero", nodeId: "n-title", prop: "text", ar: "x" }), row({ op: "add_code_section", file: SCRIPT_FILE })]))
      .mockRejectedValueOnce(new Error("busy"));
    const result = await runEditorAgentTurn(request(), { callModel: failing });
    expect(result.applied).toHaveLength(1);
  });

  it("refuses code ops and leaves them out of the prompt when code sections are off", async () => {
    const callModel = vi.fn(async (_args: { system: string }) => answer([row({ op: "convert_to_code_section", sectionId: "s-hero", file: GOOD_FILE })]));
    const result = await runEditorAgentTurn(request({ allowCode: false }), { callModel });
    expect(callModel.mock.calls[0]![0].system).not.toContain("add_code_section");
    expect(result.rejected).toEqual([{ index: 0, code: "code_disabled" }]);
  });

  it("refuses ops on another section than the targeted one", async () => {
    const callModel = vi.fn(async () => answer([row({ op: "remove_section", sectionId: "s-2" })]));
    const result = await runEditorAgentTurn(request(), { callModel });
    expect(result.rejected).toEqual([{ index: 0, code: "outside_target" }]);
  });

  it("refuses malformed rows", async () => {
    const callModel = vi.fn(async () => answer([row({ op: "set_style", sectionId: "s-hero", styleJson: "{nope" })]));
    expect((await runEditorAgentTurn(request(), { callModel })).rejected).toEqual([{ index: 0, code: "invalid_op" }]);
  });

  it("throws when the first call fails (the host reports it)", async () => {
    await expect(runEditorAgentTurn(request(), { callModel: async () => Promise.reject(new Error("down")) })).rejects.toThrow("down");
  });
});

describe("page scope", () => {
  const text = (id: string, nodeId: string, words: string): SectionInstance => ({
    id,
    sectionId: "custom-section",
    version: 1,
    props: {},
    componentTree: [{ id: `${nodeId}-root`, type: "section", props: {}, children: [{ id: nodeId, type: "text", props: { text: words }, children: [] }] }],
  });
  const about = text("s-about", "n-about", "من نحن");
  // A long section is cut at its own cap (about 12 KB), so three of them don't fit the page budget together.
  const bigSection = (n: number): SectionInstance => {
    const made = text(`s-big${n}`, `n-big${n}`, "x");
    made.componentTree![0]!.children = Array.from({ length: 150 }, (_, i) => ({ id: `n-big${n}-${i}`, type: "text" as const, props: { text: "كلمة ".repeat(40) }, children: [] }));
    return made;
  };
  const code: SectionInstance = {
    id: "s-code",
    sectionId: "custom-section",
    version: 1,
    props: {},
    componentTree: [{ id: "n-croot", type: "section", props: {}, children: [{ id: "n-code", type: "code", props: { source: "<p>Hi</p>", css: "", schema: { name: "X", settings: [] }, settings: {}, blocks: [] }, children: [] }] }],
  };
  const page = [hero, about];
  const pageRequest = (sections: SectionInstance[], extra: Partial<EditorAgentTurnRequest> = {}) =>
    request({
      message: "make the whole page clearer",
      target: { kind: "page" },
      section: null,
      outline: sections.map((s) => ({ id: s.id, name: s.id, kind: "tree" })),
      content: { sections },
      pageSections: sections,
      ...extra,
    });

  it("shows the page's sections, edits several in one call and marks the target", async () => {
    const callModel = vi.fn(async (_args: { text: string }) =>
      answer([
        row({ op: "set_text", sectionId: "s-hero", nodeId: "n-title", prop: "text", ar: "اطلب الآن", en: "Order now" }),
        row({ op: "set_text", sectionId: "s-about", nodeId: "n-about", prop: "text", ar: "قصتنا", en: "Our story" }),
      ]),
    );
    const result = await runEditorAgentTurn(pageRequest(page, { page: { name: "Home", kind: "home" } }), { callModel });
    expect(callModel).toHaveBeenCalledTimes(1);
    const sent = callModel.mock.calls[0]![0].text;
    expect(sent).toContain('Page: "Home", the store\'s home page.');
    expect(sent).toContain("TREE SECTION s-hero");
    expect(sent).toContain("TREE SECTION s-about");
    expect(sent).toContain(`at most ${MAX_PAGE_OPS_PER_TURN} ops`);
    expect(sent).not.toContain("Not shown this turn");
    expect(result.applied.map((a) => a.sectionId)).toEqual(["s-hero", "s-about"]);
    expect(result.target).toEqual({ kind: "page", scope: "page" });
  });

  it("refuses element and code ops on sections the model wasn't shown, but lets it move or remove them", async () => {
    const sections = [hero, bigSection(1), bigSection(2), bigSection(3), code, about];
    const callModel = vi.fn(async (_args: { text: string }) =>
      answer([
        row({ op: "set_text", sectionId: "s-big3", nodeId: "n-big3-0", prop: "text", ar: "x", en: "x" }),
        row({ op: "set_style", sectionId: "s-code", nodeId: null, breakpoint: "desktop", styleJson: '{"paddingTop":8}' }),
        row({ op: "update_code_section", sectionId: "s-code", file: GOOD_FILE }),
        row({ op: "convert_to_code_section", sectionId: "s-big3", file: GOOD_FILE }),
        row({ op: "set_text", sectionId: "s-about", nodeId: "n-about", prop: "text", ar: "قصتنا", en: "Our story" }),
        row({ op: "move_section", sectionId: "s-big3", to: 5 }),
        row({ op: "remove_section", sectionId: "s-code" }),
      ]),
    );
    const result = await runEditorAgentTurn(pageRequest(sections), { callModel });
    const sent = callModel.mock.calls[0]![0].text;
    expect(sent).toContain("Not shown this turn: s-big3, s-code.");
    expect(sent).toContain("TREE SECTION s-big2");
    expect(sent).not.toContain("TREE SECTION s-big3");
    expect(new TextEncoder().encode(sent).length).toBeLessThan(MAX_PAGE_PROMPT_BYTES + 2048);
    expect(sent).not.toContain("CODE SECTION");
    // A later, smaller section still fits after the one that was left out.
    expect(sent).toContain("TREE SECTION s-about");
    expect(result.rejected).toEqual([0, 1, 2, 3].map((index) => ({ index, code: "outside_target" })));
    expect(result.applied.map((a) => a.op.op)).toEqual(["set_text", "move_section", "remove_section"]);
    expect(result.content.sections.map((s) => s.id)).toEqual(["s-hero", "s-big1", "s-big2", "s-about", "s-big3"]);
  });

  it("allows more ops than a section turn, up to the page cap", async () => {
    const many = (count: number) => Array.from({ length: count }, (_, i) => row({ op: "set_text", sectionId: "s-hero", nodeId: "n-title", prop: "text", ar: `ع ${i}`, en: `T ${i}` }));
    const pageTurn = await runEditorAgentTurn(pageRequest(page), { callModel: async () => answer(many(MAX_PAGE_OPS_PER_TURN + 2)) });
    expect(pageTurn.applied).toHaveLength(MAX_PAGE_OPS_PER_TURN);
    expect(pageTurn.rejected.map((r) => r.code)).toEqual(["too_many_ops", "too_many_ops"]);
    // The editor re-applies them with the returned target: the same cap.
    expect(applySectionOps({ sections: page }, pageTurn.ops, { target: pageTurn.target, defaultLocale: "ar", allowCode: true }).applied).toHaveLength(MAX_PAGE_OPS_PER_TURN);
    const sectionTurn = await runEditorAgentTurn(request(), { callModel: async () => answer(many(MAX_OPS_PER_TURN + 2)) });
    expect(sectionTurn.applied).toHaveLength(MAX_OPS_PER_TURN);
  });

  it("is opt-in: a host that sends no page sections, or targets a section, gets the turn it always got", async () => {
    // The dock's page turn: stand-ins of the outline, no sections shown, no scope on the target.
    const outlineOnly = await runEditorAgentTurn(
      request({ target: { kind: "page" }, section: null, content: buildAgentContent({ target: { kind: "page" }, section: null, outlineIds: ["s-hero", "s-2"] })! }),
      { callModel: async ({ text: sent }) => (expect(sent).toContain("No section is selected"), answer([])) },
    );
    expect(outlineOnly.target).toEqual({ kind: "page" });
    // A targeted section wins over page sections, and a scope the host made up is dropped.
    const targeted = await runEditorAgentTurn(request({ target: { kind: "page", sectionId: "s-hero", scope: "page" }, pageSections: page }), {
      callModel: async ({ text: sent }) => (expect(sent).not.toContain("whole page"), answer([row({ op: "remove_section", sectionId: "s-2" })])),
    });
    expect(targeted.target).toEqual({ kind: "page", sectionId: "s-hero" });
    expect(targeted.rejected).toEqual([{ index: 0, code: "outside_target" }]);
    expect(maxOpsFor({ kind: "header", scope: "page" })).toBe(MAX_OPS_PER_TURN);
    expect(maxOpsFor({ kind: "page", sectionId: "s", scope: "page" })).toBe(MAX_OPS_PER_TURN);
  });
});

describe("suggestions", () => {
  it("returns the model's follow-ups cleaned, and none when the schema has none (the dock)", async () => {
    const withIdeas = await runEditorAgentTurn(request(), { callModel: async () => ({ ...answer([]), suggestions: ["  Make the\nbutton bigger ", "Make the button bigger", "<b>Add</b> a photo", "y".repeat(61), 7 as unknown as string, "Third", "Fourth"] }) });
    expect(withIdeas.suggestions).toEqual(["Make the button bigger", "Add a photo", "Third"]);
    expect((await runEditorAgentTurn(request(), { callModel: async () => answer([]) })).suggestions).toEqual([]);
    expect(cleanAgentSuggestions(null)).toEqual([]);
    expect(cleanAgentSuggestions("x")).toEqual([]);
  });

  it("the dock's schema has no suggestions; the Edit with AI one adds a flat nullable list", () => {
    expect(Object.keys(editorAgentModelOutputSchema.shape)).toEqual(["reply", "ops"]);
    expect(Object.keys(editorAgentModelOutputWithSuggestionsSchema.shape)).toEqual(["reply", "ops", "suggestions"]);
    expect(editorAgentModelOutputWithSuggestionsSchema.safeParse({ reply: "x", ops: [], suggestions: null }).success).toBe(true);
    expect(editorAgentModelOutputWithSuggestionsSchema.safeParse({ reply: "x", ops: [], suggestions: ["a"] }).success).toBe(true);
  });
});

describe("buildAgentContent", () => {
  it("puts the section among stand-ins of the outline", () => {
    const content = buildAgentContent({ target: { kind: "page", sectionId: "s-hero" }, section: hero, outlineIds: ["s-0", "s-hero"] })!;
    expect(content.sections.map((s) => s.id)).toEqual(["s-0", "s-hero"]);
    expect(content.sections[0]!.componentTree).toEqual([]);
  });

  it("refuses a section that isn't the target or isn't on the page", () => {
    expect(buildAgentContent({ target: { kind: "page", sectionId: "s-other" }, section: hero, outlineIds: ["s-hero", "s-other"] })).toBeNull();
    expect(buildAgentContent({ target: { kind: "page", sectionId: "s-hero" }, section: hero, outlineIds: ["s-2"] })).toBeNull();
    expect(buildAgentContent({ target: { kind: "page", sectionId: "s-hero" }, section: null, outlineIds: ["s-hero"] })).toBeNull();
    expect(buildAgentContent({ target: { kind: "header" }, section: hero, outlineIds: [] })!.sections).toHaveLength(1);
    expect(buildAgentContent({ target: { kind: "page" }, section: null, outlineIds: ["a", "b"] })!.sections).toHaveLength(2);
  });
});

describe("model output", () => {
  it("leaves out null fields and parses the JSON ones", () => {
    expect(toSectionOpCandidate(row({ op: "add_code_section", file: "x", settingsJson: '{"title":"A"}', blocksJson: '[{"type":"item"}]', sectionId: "ignored" }))).toEqual({
      op: "add_code_section",
      file: "x",
      settings: { title: "A" },
      blocks: [{ type: "item" }],
    });
    expect(toSectionOpCandidate(row({ op: "set_text", sectionId: "s", nodeId: "n", prop: "text", ar: "أ" }))).toEqual({ op: "set_text", sectionId: "s", nodeId: "n", prop: "text", ar: "أ" });
  });

  it("caps and cleans the reply", () => {
    expect(cleanAgentReply(`  ${"a".repeat(700)}\u0000`)).toHaveLength(600);
    expect(cleanAgentReply(null)).toBe("");
  });
});
