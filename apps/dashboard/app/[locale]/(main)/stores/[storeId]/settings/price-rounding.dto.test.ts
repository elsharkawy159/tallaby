import { describe, expect, it } from "vitest";
import { CUSTOM_STEP, DEFAULT_PRICE_ROUNDING_ROW, ruleToRows, rowsToRule, type PriceRoundingRow } from "./price-rounding.dto";

const row = (upTo: string, step = "5", direction: PriceRoundingRow["direction"] = "up", customStep = ""): PriceRoundingRow => ({ upTo, step, customStep, direction });

describe("price rounding rows", () => {
  it("starts from one open tier: up to the nearest 5", () => {
    expect(ruleToRows(null)).toEqual([DEFAULT_PRICE_ROUNDING_ROW]);
    expect(rowsToRule(true, ruleToRows(null))).toEqual({ ok: true, rule: { enabled: true, tiers: [{ upTo: null, step: 5, direction: "up" }] } });
  });

  it("turns rows into tiers; the last row's amount is ignored", () => {
    const result = rowsToRule(true, [row("١٠٠"), row("1,000.50", CUSTOM_STEP, "nearest", "25"), row("999", "100", "down")]);
    expect(result).toEqual({
      ok: true,
      rule: {
        enabled: true,
        tiers: [
          { upTo: 100, step: 5, direction: "up" },
          { upTo: 1000.5, step: 25, direction: "nearest" },
          { upTo: null, step: 100, direction: "down" },
        ],
      },
    });
  });

  it("round-trips a saved rule", () => {
    const rule = { enabled: false, tiers: [{ upTo: 99.5, step: 7, direction: "down" as const }, { upTo: null, step: 50, direction: "up" as const }] };
    const back = rowsToRule(false, ruleToRows(rule));
    expect(back).toEqual({ ok: true, rule });
  });

  it("reports the row with a problem", () => {
    expect(rowsToRule(true, [row(""), row("")])).toMatchObject({ ok: false, error: "upToInvalid", row: 0 });
    expect(rowsToRule(true, [row("500"), row("400"), row("")])).toMatchObject({ ok: false, error: "upToOrder", row: 1 });
    expect(rowsToRule(true, [row("", CUSTOM_STEP, "up", "1.5")])).toMatchObject({ ok: false, error: "stepInvalid", row: 0 });
    expect(rowsToRule(true, [row("", CUSTOM_STEP, "up", "0")])).toMatchObject({ ok: false, error: "stepInvalid", row: 0 });
    expect(rowsToRule(true, [row("", CUSTOM_STEP, "up", "10001")])).toMatchObject({ ok: false, error: "stepInvalid", row: 0 });
  });
});
