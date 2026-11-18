import { describe, expect, it } from "vitest";
import {
  FREE_ORDER_FEE_USD_CENTS,
  TOP_UP_MIN_USD_CENTS,
} from "@workspace/lib/billing";
import { formatOrderFeeEgp, formatUsdShort } from "./order-lock-copy.lib";

describe("formatUsdShort", () => {
  it("shows whole dollars with the sign after the number in Arabic and before it in English", () => {
    expect(formatUsdShort(TOP_UP_MIN_USD_CENTS, "ar")).toBe("⁦$5⁩");
    expect(formatUsdShort(TOP_UP_MIN_USD_CENTS, "en")).toBe("$5");
  });

  it("keeps cents when the amount isn't whole", () => {
    expect(formatUsdShort(550, "en")).toBe("$5.50");
    expect(formatUsdShort(1_000_00, "en")).toBe("$1,000");
  });
});

describe("formatOrderFeeEgp", () => {
  it("converts the fee at the rate with two decimals", () => {
    expect(formatOrderFeeEgp(FREE_ORDER_FEE_USD_CENTS, 53.9007)).toBe("1.62");
    expect(formatOrderFeeEgp(3, 50)).toBe("1.50");
  });

  it("is null with no rate", () => {
    expect(formatOrderFeeEgp(FREE_ORDER_FEE_USD_CENTS, null)).toBeNull();
    expect(formatOrderFeeEgp(FREE_ORDER_FEE_USD_CENTS, 0)).toBeNull();
  });
});
