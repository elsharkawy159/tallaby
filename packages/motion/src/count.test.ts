import { describe, expect, it } from "vitest";
import { formatCount, splitCount } from "./count";
import * as presets from "./presets";

describe("splitCount", () => {
  it("keeps the text around the number", () => {
    expect(splitCount("+1,080")).toEqual({ prefix: "+", suffix: "", value: 1080, arabicDigits: false, grouped: true });
    expect(splitCount("98%")).toMatchObject({ prefix: "", suffix: "%", value: 98 });
    expect(splitCount("٣٩ قالب")).toEqual({ prefix: "", suffix: " قالب", value: 39, arabicDigits: true, grouped: false });
    expect(splitCount("+١٢٬٥٠٠ عميل")).toMatchObject({ prefix: "+", suffix: " عميل", value: 12500, arabicDigits: true, grouped: true });
    expect(splitCount("12k+")).toMatchObject({ prefix: "", suffix: "k+", value: 12 });
  });

  it("refuses text with no whole number to count", () => {
    expect(splitCount("مجاني")).toBeNull();
    expect(splitCount("4.9")).toBeNull();
    expect(splitCount("٤٫٩")).toBeNull();
    expect(splitCount("0")).toBeNull();
    expect(splitCount("")).toBeNull();
  });

  it("formats a step back in the same digits", () => {
    const parts = splitCount("+١٢٬٥٠٠")!;
    expect(parts.prefix + formatCount(6250, parts) + parts.suffix).toBe("+٦٬٢٥٠");
  });

  it("is still exported from presets", () => {
    expect(presets.parseCount).toBeTypeOf("function");
    expect(presets.splitCount).toBe(splitCount);
  });
});
