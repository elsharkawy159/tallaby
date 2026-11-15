import { describe, expect, it } from "vitest";
import { resolveAddView } from "./add-method.lib";

describe("resolveAddView", () => {
  it("shows the choice to a seller with no draft", () => {
    expect(resolveAddView(null, "fresh", true)).toBe("choose");
  });
  it("opens the form when a draft is stored", () => {
    expect(resolveAddView(null, "draft", true)).toBe("manual");
  });
  it("waits for the browser before deciding", () => {
    expect(resolveAddView(null, "pending", true)).toBe("pending");
  });
  it("follows the param, also over a stored draft", () => {
    expect(resolveAddView("manual", "pending", true)).toBe("manual");
    expect(resolveAddView("ai", "fresh", true)).toBe("ai");
    expect(resolveAddView("choose", "draft", true)).toBe("choose");
    expect(resolveAddView("url", "draft", false)).toBe("url");
  });
  it("never opens AI when AI is off", () => {
    expect(resolveAddView("ai", "fresh", false)).toBe("choose");
    expect(resolveAddView("ai", "draft", false)).toBe("choose");
  });
  it("treats an unknown param as none", () => {
    expect(resolveAddView("<x>", "fresh", true)).toBe("choose");
    expect(resolveAddView("file", "draft", true)).toBe("manual");
  });
});
