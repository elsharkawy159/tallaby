import { describe, expect, it } from "vitest";
import { creditsTone, editWithAiGate, turnContextOf } from "./edit-with-ai-page.lib";

describe("editWithAiGate", () => {
  it("sends the seller to the editor while AI is off", () => {
    expect(editWithAiGate({ builderEnabled: true, aiEnabled: false })).toBe("editor");
  });
  it("shows the chat while AI is on", () => {
    expect(editWithAiGate({ builderEnabled: true, aiEnabled: true })).toBe("show");
  });
  it("is a 404 without the website builder, AI or not", () => {
    expect(editWithAiGate({ builderEnabled: false, aiEnabled: true })).toBe("notFound");
    expect(editWithAiGate({ builderEnabled: false, aiEnabled: false })).toBe("notFound");
  });
});

describe("creditsTone", () => {
  it("warns at 3 or fewer and offers credits at none", () => {
    expect(creditsTone(40)).toBe("ok");
    expect(creditsTone(4)).toBe("ok");
    expect(creditsTone(3)).toBe("low");
    expect(creditsTone(1)).toBe("low");
    expect(creditsTone(0)).toBe("empty");
  });
});

describe("turnContextOf", () => {
  const editor = { pageId: "22222222-2222-4222-8222-222222222222", contentLocale: "en" as const };

  it("sends the active page and the canvas language, and no target with nothing selected", () => {
    expect(turnContextOf({ ...editor, mention: null, target: { kind: "page" } })).toEqual({ pageId: editor.pageId, contentLocale: "en" });
  });

  it("sends the selected section, header or footer as the target", () => {
    const mention = { label: "Hero" };
    expect(turnContextOf({ ...editor, mention, target: { kind: "page", sectionId: "s-hero" } }).target).toEqual({ kind: "page", sectionId: "s-hero" });
    expect(turnContextOf({ ...editor, mention, target: { kind: "footer" } }).target).toEqual({ kind: "footer" });
  });
});
