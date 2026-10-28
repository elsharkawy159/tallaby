import { describe, expect, it } from "vitest";

import { phone } from "./library-template";

describe("phone", () => {
  it("isolates the number and pins each group left-to-right", () => {
    expect(phone("٠١٢٢ ٤٨٦ ٣٩٠٥")).toBe("⁦٠١٢٢‎ ٤٨٦‎ ٣٩٠٥⁩");
  });

  it("collapses extra spaces and works for Latin digits", () => {
    expect(phone(" +20  122 486 ")).toBe("⁦+20‎ 122‎ 486⁩");
  });
});
