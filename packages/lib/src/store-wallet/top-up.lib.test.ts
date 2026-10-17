import { describe, expect, it } from "vitest";
import { parseKashierOrderReference } from "../kashier";
import {
  STORE_TOP_UP_MAX_PIASTRES,
  STORE_TOP_UP_MIN_PIASTRES,
  buildStoreTopUpReference,
  parseStoreTopUpAmount,
  parseStoreTopUpReference,
} from "./top-up.lib";

const ID = "3f1c2a9e-1b2c-4d3e-8f90-123456789abc";

describe("store top-up reference", () => {
  it("round-trips and never looks like an order payment", () => {
    const reference = buildStoreTopUpReference(ID);
    expect(reference).toBe(`stopup_${ID}`);
    expect(parseStoreTopUpReference(reference)).toBe(ID);
    expect(parseStoreTopUpReference(reference.toUpperCase())).toBe(ID);
    expect(parseKashierOrderReference(reference)).toBeNull();
  });

  it("ignores order references and junk", () => {
    expect(parseStoreTopUpReference(`${ID}_abc123`)).toBeNull();
    expect(parseStoreTopUpReference(`stopup_${ID}_x`)).toBeNull();
    expect(parseStoreTopUpReference("stopup_nope")).toBeNull();
    expect(parseStoreTopUpReference(null)).toBeNull();
  });
});

describe("parseStoreTopUpAmount (D23)", () => {
  it("accepts EGP 50 to 20,000 with up to 2 decimals", () => {
    expect(parseStoreTopUpAmount("50")).toEqual({ success: true, piastres: 5_000, amount: "50.00" });
    expect(parseStoreTopUpAmount(" 1250,5 ")).toEqual({ success: true, piastres: 125_050, amount: "1250.50" });
    expect(parseStoreTopUpAmount(20_000)).toEqual({ success: true, piastres: 2_000_000, amount: "20000.00" });
    expect(STORE_TOP_UP_MIN_PIASTRES).toBe(5_000);
    expect(STORE_TOP_UP_MAX_PIASTRES).toBe(2_000_000);
  });

  it("refuses amounts outside the limits or badly formed", () => {
    expect(parseStoreTopUpAmount("49.99")).toEqual({ success: false, error: "too_small" });
    expect(parseStoreTopUpAmount("20000.01")).toEqual({ success: false, error: "too_large" });
    for (const bad of ["", "-100", "1e3", "12.345", "abc", null, undefined, {}]) {
      expect(parseStoreTopUpAmount(bad)).toEqual({ success: false, error: "invalid" });
    }
  });
});
