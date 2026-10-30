import { describe, expect, it } from "vitest";
import { CODE128_PATTERNS, CODE128_QUIET_ZONE, code128Bars, code128Values } from "./code128.lib";

/** Reads bars back into text the way a scanner would (code set B only). */
function decode(bars: { x: number; w: number }[], width: number): string {
  const modules = new Array<number>(width).fill(0);
  for (const b of bars) for (let i = 0; i < b.w; i++) modules[b.x + i] = 1;
  // Run lengths from the first bar to the last.
  const first = modules.indexOf(1);
  const last = modules.lastIndexOf(1);
  const runs: number[] = [];
  let i = first;
  while (i <= last) {
    let j = i;
    while (j <= last && modules[j] === modules[i]) j++;
    runs.push(j - i);
    i = j;
  }
  const values: number[] = [];
  let k = 0;
  while (k < runs.length) {
    const size = runs.length - k === 7 ? 7 : 6;
    const pattern = runs.slice(k, k + size).join("");
    const value = CODE128_PATTERNS.indexOf(pattern);
    if (value < 0) throw new Error(`unknown pattern ${pattern}`);
    values.push(value);
    k += size;
  }
  expect(values[0]).toBe(104);
  expect(values.at(-1)).toBe(106);
  const data = values.slice(1, -2);
  const checksum = data.reduce((s, v, idx) => s + v * (idx + 1), 104) % 103;
  expect(values.at(-2)).toBe(checksum);
  return data.map((v) => String.fromCharCode(v + 32)).join("");
}

describe("Code 128 patterns", () => {
  it("has 107 unique symbols of 11 modules (stop 13) with even bar width", () => {
    expect(CODE128_PATTERNS).toHaveLength(107);
    expect(new Set(CODE128_PATTERNS).size).toBe(107);
    CODE128_PATTERNS.forEach((p, value) => {
      const widths = [...p].map(Number);
      const total = widths.reduce((a, b) => a + b, 0);
      expect(total, `symbol ${value}`).toBe(value === 106 ? 13 : 11);
      const barModules = widths.filter((_, i) => i % 2 === 0).reduce((a, b) => a + b, 0);
      expect(barModules % 2, `symbol ${value} parity`).toBe(0);
    });
  });
});

describe("code128Values", () => {
  it("adds start B, the mod-103 checksum and stop", () => {
    // "A" = 33: (104 + 33) % 103 = 34.
    expect(code128Values("A")).toEqual([104, 33, 34, 106]);
  });
  it("refuses text outside ASCII 32–126 and empty text", () => {
    expect(code128Values("طلب")).toBeNull();
    expect(code128Values("")).toBeNull();
    expect(code128Values("a\nb")).toBeNull();
  });
});

describe("code128Bars", () => {
  it("round-trips an order number", () => {
    const bars = code128Bars("ORDX7K2M9QA")!;
    expect(decode(bars.bars, bars.width)).toBe("ORDX7K2M9QA");
  });
  it("has quiet zones and the expected width", () => {
    const bars = code128Bars("ORD12345678")!;
    // (start + 11 data + checksum) × 11 + stop 13 + quiet zones.
    expect(bars.width).toBe(13 * 11 + 13 + 2 * CODE128_QUIET_ZONE);
    expect(bars.bars[0]!.x).toBe(CODE128_QUIET_ZONE);
    const last = bars.bars.at(-1)!;
    expect(last.x + last.w).toBe(bars.width - CODE128_QUIET_ZONE);
  });
});
