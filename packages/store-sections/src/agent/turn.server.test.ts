import { describe, expect, it, vi } from "vitest";
import type { SectionInstance } from "../config/schema";
import { joinSectionFile } from "../code/section-file";
import type { EditorAgentModelOp, EditorAgentModelOutput } from "./model-output";
import { cleanAgentReply, toSectionOpCandidate } from "./model-output";
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
