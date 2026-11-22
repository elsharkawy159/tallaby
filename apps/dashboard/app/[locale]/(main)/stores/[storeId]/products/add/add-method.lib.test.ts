import { describe, expect, it } from "vitest";
import { resolveAddView } from "./add-method.lib";

describe("resolveAddView", () => {
  it("shows the choice when no method is asked for, even with a stored draft", () => {
    expect(resolveAddView(null, true)).toBe("choose");
    expect(resolveAddView("choose", true)).toBe("choose");
  });
  it("follows the param", () => {
    expect(resolveAddView("manual", true)).toBe("manual");
    expect(resolveAddView("ai", true)).toBe("ai");
    expect(resolveAddView("url", false)).toBe("url");
  });
  it("never opens AI when AI is off", () => {
    expect(resolveAddView("ai", false)).toBe("choose");
  });
  it("treats an unknown param as none", () => {
    expect(resolveAddView("<x>", true)).toBe("choose");
    expect(resolveAddView("file", true)).toBe("choose");
  });
});
