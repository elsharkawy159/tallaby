import { describe, expect, it } from "vitest";
import { aiEditorHref, manualEditorHref, resolveEditorEntry } from "./editor-entry.lib";

const on = { aiEnabled: true };
const off = { aiEnabled: false };

describe("resolveEditorEntry", () => {
  it("shows the choice with no param while AI is on", () => {
    expect(resolveEditorEntry({}, on)).toBe("choose");
  });
  it("opens the editor for ?mode=manual", () => {
    expect(resolveEditorEntry({ mode: "manual" }, on)).toBe("editor");
    expect(resolveEditorEntry({ mode: "manual" }, off)).toBe("editor");
  });
  it("goes to the AI editor for ?mode=ai only while AI is on", () => {
    expect(resolveEditorEntry({ mode: "ai" }, on)).toBe("ai");
    expect(resolveEditorEntry({ mode: "ai" }, off)).toBe("editor");
  });
  it("never shows the choice while AI is off", () => {
    expect(resolveEditorEntry({}, off)).toBe("editor");
    expect(resolveEditorEntry({ mode: "choose" }, off)).toBe("editor");
    expect(resolveEditorEntry({ page: "about" }, off)).toBe("editor");
  });
  it("opens the editor directly for any deep-link param", () => {
    for (const key of ["page", "section", "part", "node", "tab", "panel", "anything"]) {
      expect(resolveEditorEntry({ [key]: "x" }, on)).toBe("editor");
    }
    expect(resolveEditorEntry({ page: ["a", "b"] }, on)).toBe("editor");
    expect(resolveEditorEntry({ page: "" }, on)).toBe("editor");
  });
  it("lets an explicit mode win over a deep link", () => {
    expect(resolveEditorEntry({ mode: "ai", page: "about" }, on)).toBe("ai");
    expect(resolveEditorEntry({ mode: "manual", page: "about" }, on)).toBe("editor");
  });
  it("treats an unknown or empty mode as none", () => {
    expect(resolveEditorEntry({ mode: "<x>" }, on)).toBe("choose");
    expect(resolveEditorEntry({ mode: "" }, on)).toBe("choose");
    expect(resolveEditorEntry({ mode: "<x>", section: "s1" }, on)).toBe("editor");
  });
  it("reads the first value of a repeated mode", () => {
    expect(resolveEditorEntry({ mode: ["ai", "manual"] }, on)).toBe("ai");
    expect(resolveEditorEntry({ mode: ["manual", "ai"] }, on)).toBe("editor");
  });
  it("ignores keys with no value", () => {
    expect(resolveEditorEntry({ page: undefined }, on)).toBe("choose");
  });
});

describe("editor hrefs", () => {
  it("builds the manual and AI paths from the store id", () => {
    expect(manualEditorHref("s1")).toBe("/stores/s1/editor?mode=manual");
    expect(aiEditorHref("s1")).toBe("/stores/s1/editor/ai");
    expect(aiEditorHref("a/b")).toBe("/stores/a%2Fb/editor/ai");
  });
});
