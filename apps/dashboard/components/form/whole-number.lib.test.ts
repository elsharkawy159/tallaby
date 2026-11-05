import { describe, expect, it } from "vitest";
import { inRangeValue, settledValue, wholeNumberText } from "./whole-number.lib";

const days = { min: 7, max: 730, fallback: 90 };
const qty = { min: 1, max: 99, fallback: 1 };

describe("wholeNumberText", () => {
  it("converts Arabic-Indic and Persian digits and drops the rest", () => {
    expect(wholeNumberText("٦٠", 730)).toBe("60");
    expect(wholeNumberText("۱۲", 99)).toBe("12");
    expect(wholeNumberText("1a-2.", 730)).toBe("12");
    expect(wholeNumberText("", 99)).toBe("");
  });

  it("caps the length at the max's digits", () => {
    expect(wholeNumberText("١٢٣٤", 99)).toBe("12");
    expect(wholeNumberText("12345", 730)).toBe("123");
  });
});

describe("inRangeValue", () => {
  it("commits only in-range numbers", () => {
    expect(inRangeValue("60", days)).toBe(60);
    expect(inRangeValue("6", days)).toBeNull();
    expect(inRangeValue("999", days)).toBeNull();
    expect(inRangeValue("", days)).toBeNull();
    expect(inRangeValue("0", qty)).toBeNull();
    expect(inRangeValue("99", qty)).toBe(99);
  });
});

describe("settledValue", () => {
  it("clamps on blur and falls back when empty", () => {
    expect(settledValue("", days)).toBe(90);
    expect(settledValue("3", days)).toBe(7);
    expect(settledValue("999", days)).toBe(730);
    expect(settledValue("0", qty)).toBe(1);
    expect(settledValue("", qty)).toBe(1);
    expect(settledValue("45", qty)).toBe(45);
  });
});
