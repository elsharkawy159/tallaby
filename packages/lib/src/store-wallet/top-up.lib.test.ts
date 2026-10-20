import { describe, expect, it } from "vitest";
import { parseKashierOrderReference } from "../kashier";
import {
  STORE_TOP_UP_MAX_PIASTRES,
  STORE_TOP_UP_MIN_PIASTRES,
  buildStoreTopUpReference,
  buildTopUpProofPath,
  isOwnTopUpProofPath,
  manualTopUpInputSchema,
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
  it("accepts EGP 100 to 20,000 with up to 2 decimals", () => {
    expect(parseStoreTopUpAmount("100")).toEqual({ success: true, piastres: 10_000, amount: "100.00" });
    expect(parseStoreTopUpAmount(" 1250,5 ")).toEqual({ success: true, piastres: 125_050, amount: "1250.50" });
    expect(parseStoreTopUpAmount(20_000)).toEqual({ success: true, piastres: 2_000_000, amount: "20000.00" });
    expect(STORE_TOP_UP_MIN_PIASTRES).toBe(10_000);
    expect(STORE_TOP_UP_MAX_PIASTRES).toBe(2_000_000);
  });

  it("refuses amounts outside the limits or badly formed", () => {
    expect(parseStoreTopUpAmount("99.99")).toEqual({ success: false, error: "too_small" });
    expect(parseStoreTopUpAmount("20000.01")).toEqual({ success: false, error: "too_large" });
    for (const bad of ["", "-100", "1e3", "12.345", "abc", null, undefined, {}]) {
      expect(parseStoreTopUpAmount(bad)).toEqual({ success: false, error: "invalid" });
    }
  });
});

describe("manual top-up receipts", () => {
  const seller = "11111111-1111-4111-8111-111111111111";
  const file = "22222222-2222-4222-8222-222222222222";

  it("builds receipt paths in the seller's folder for images only", () => {
    expect(buildTopUpProofPath(seller, file, "image/png")).toBe(`${seller}/${file}.png`);
    expect(buildTopUpProofPath(seller, file, "application/pdf")).toBeNull();
  });

  it("accepts only the seller's own receipt paths", () => {
    expect(isOwnTopUpProofPath(seller, `${seller}/${file}.jpg`)).toBe(true);
    expect(isOwnTopUpProofPath(seller, `33333333-3333-4333-8333-333333333333/${file}.jpg`)).toBe(false);
    expect(isOwnTopUpProofPath(seller, `${seller}/../${file}.jpg`)).toBe(false);
    expect(isOwnTopUpProofPath(seller, `${seller}/${file}.svg`)).toBe(false);
    expect(isOwnTopUpProofPath("not-a-uuid", `not-a-uuid/${file}.jpg`)).toBe(false);
  });

  it("validates the submitted method and sender number", () => {
    const base = { method: "instapay", amount: "100", proofPath: "x" };
    expect(manualTopUpInputSchema.safeParse(base).success).toBe(true);
    expect(manualTopUpInputSchema.safeParse({ ...base, method: "card" }).success).toBe(false);
    expect(manualTopUpInputSchema.safeParse({ ...base, senderPhone: "010 1234 5678" }).success).toBe(true);
    expect(manualTopUpInputSchema.safeParse({ ...base, senderPhone: "123" }).success).toBe(false);
  });
});
