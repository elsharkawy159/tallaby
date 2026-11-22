import { describe, expect, it } from "vitest";
import {
  TALLABY_PAY_TERMS_VERSION,
  readOrderTallabyPay,
  readTallabyPayFeePayer,
  storeGatewayOrderMetadata,
} from "./store-gateways.lib";
import { storefrontCheckoutMethods } from "./store-methods";
import { customerTallabyPayFee, splitTallabyPay, tallabyPaySaleSplit } from "../tallaby-pay/fee.lib";

/** Who pays the Tallaby Pay fee (ROADMAP.md F-100j, owner 2026-11-22). */

const INTEGRATION = "9a8b7c6d-5e4f-4a3b-8c2d-1e0f9a8b7c6d";
const TALLABY_PAY = { provider: "tallaby_pay" as const, integrationId: INTEGRATION };

describe("customerTallabyPayFee", () => {
  it("adds round_half_up(base × bps) on top: 100 EGP at 3% → shopper pays 103", () => {
    expect(customerTallabyPayFee(10_000, 300)).toEqual({ feePiastres: 300, chargedPiastres: 10_300 });
  });

  it("rounds half up in piastres, like the seller-pays split", () => {
    // 123.45 × 3% = 3.7035 → 3.70
    expect(customerTallabyPayFee(12_345, 300)).toEqual({ feePiastres: 370, chargedPiastres: 12_715 });
    // 0.50 × 1% = 0.005 → 0.01 (exact half rounds up)
    expect(customerTallabyPayFee(50, 100)).toEqual({ feePiastres: 1, chargedPiastres: 51 });
    // 1 piastre at 3% → 0
    expect(customerTallabyPayFee(1, 300)).toEqual({ feePiastres: 0, chargedPiastres: 1 });
  });

  it("is nothing at 0 bps", () => {
    expect(customerTallabyPayFee(12_345, 0)).toEqual({ feePiastres: 0, chargedPiastres: 12_345 });
  });

  it("uses the same fee as splitTallabyPay on the same base", () => {
    for (const base of [1, 99, 10_000, 12_345, 99_999_99]) {
      expect(customerTallabyPayFee(base, 300).feePiastres).toBe(splitTallabyPay(base, 300).feePiastres);
    }
  });

  it("refuses bad input", () => {
    expect(() => customerTallabyPayFee(-1, 300)).toThrow(RangeError);
    expect(() => customerTallabyPayFee(100, 2_001)).toThrow(RangeError);
    expect(() => customerTallabyPayFee(1.5, 300)).toThrow(RangeError);
  });
});

describe("tallabyPaySaleSplit", () => {
  const SELLER = { feeBps: 300 };
  it("seller pays: exactly splitTallabyPay (unchanged behaviour)", () => {
    for (const paid of [0, 1, 50, 10_000, 12_345]) {
      expect(tallabyPaySaleSplit(paid, SELLER)).toEqual(splitTallabyPay(paid, 300));
    }
    expect(tallabyPaySaleSplit(10_000, SELLER)).toEqual({ feePiastres: 300, netPiastres: 9_700 });
  });

  it("customer pays: fee is the recorded surcharge, net is the base (seller gets 100%)", () => {
    const snapshot = { feeBps: 300, feePayer: "customer" as const, customerFeePiastres: 300 };
    expect(tallabyPaySaleSplit(10_300, snapshot)).toEqual({ feePiastres: 300, netPiastres: 10_000 });
    // Never recomputed from the bps: a 0 surcharge keeps the whole amount for the seller.
    expect(tallabyPaySaleSplit(10_000, { ...snapshot, customerFeePiastres: 0 })).toEqual({ feePiastres: 0, netPiastres: 10_000 });
  });

  it("customer pays: refuses a missing or impossible surcharge", () => {
    expect(() => tallabyPaySaleSplit(10_300, { feeBps: 300, feePayer: "customer" })).toThrow(RangeError);
    expect(() => tallabyPaySaleSplit(100, { feeBps: 300, feePayer: "customer", customerFeePiastres: 101 })).toThrow(RangeError);
    expect(() => tallabyPaySaleSplit(100, { feeBps: 300, feePayer: "customer", customerFeePiastres: -1 })).toThrow(RangeError);
  });

  it("fee + net always equal what was paid", () => {
    for (const base of [1, 50, 9_999, 12_345, 1_000_000]) {
      const { feePiastres, chargedPiastres } = customerTallabyPayFee(base, 300);
      const split = tallabyPaySaleSplit(chargedPiastres, { feeBps: 300, feePayer: "customer", customerFeePiastres: feePiastres });
      expect(split.netPiastres).toBe(base);
      expect(split.feePiastres + split.netPiastres).toBe(chargedPiastres);
    }
  });
});

describe("order snapshot with the customer paying", () => {
  it("records feePayer and the surcharge; seller-pays snapshots stay exactly as before", () => {
    expect(storeGatewayOrderMetadata(TALLABY_PAY, { feeBps: 300, holdDays: 0 }, { feePiastres: 300 })).toEqual({
      paymentCollector: "tallaby",
      paymentGateway: TALLABY_PAY,
      tallabyPay: { feeBps: 300, holdDays: 0, termsVersion: TALLABY_PAY_TERMS_VERSION, feePayer: "customer", customerFeePiastres: 300 },
    });
    expect(storeGatewayOrderMetadata(TALLABY_PAY, { feeBps: 300, holdDays: 0 })).toEqual({
      paymentCollector: "tallaby",
      paymentGateway: TALLABY_PAY,
      tallabyPay: { feeBps: 300, holdDays: 0, termsVersion: TALLABY_PAY_TERMS_VERSION },
    });
  });

  it("never copies the checkout's feePayer into the gateway snapshot", () => {
    const meta = storeGatewayOrderMetadata({ ...TALLABY_PAY, feePayer: "customer" } as typeof TALLABY_PAY, { feeBps: 300, holdDays: 0 });
    expect(meta.paymentGateway).toEqual(TALLABY_PAY);
  });

  it("reads it back; an unreadable customer snapshot is null (never a guessed split)", () => {
    const base = { feeBps: 300, holdDays: 0, termsVersion: "2026-11-18" };
    expect(readOrderTallabyPay({ tallabyPay: { ...base, feePayer: "customer", customerFeePiastres: 300 } })).toEqual({
      ...base,
      feePayer: "customer",
      customerFeePiastres: 300,
    });
    expect(readOrderTallabyPay({ tallabyPay: { ...base, feePayer: "seller" } })).toEqual(base);
    expect(readOrderTallabyPay({ tallabyPay: { ...base, feePayer: "customer" } })).toBeNull();
    expect(readOrderTallabyPay({ tallabyPay: { ...base, feePayer: "customer", customerFeePiastres: -1 } })).toBeNull();
    expect(readOrderTallabyPay({ tallabyPay: { ...base, feePayer: "customer", customerFeePiastres: 1.5 } })).toBeNull();
    expect(readOrderTallabyPay({ tallabyPay: { ...base, feePayer: "nobody" } })).toBeNull();
  });
});

describe("the store's setting", () => {
  it("defaults to seller for every row written before F-100j", () => {
    expect(readTallabyPayFeePayer({ mode: "live", termsVersion: "2026-11-18" })).toBe("seller");
    expect(readTallabyPayFeePayer(null)).toBe("seller");
    expect(readTallabyPayFeePayer({ feePayer: "someone" })).toBe("seller");
    expect(readTallabyPayFeePayer({ feePayer: "customer" })).toBe("customer");
  });

  it("checkout shows the live rate only when the store's customers pay it", () => {
    const payments = { cod: { enabled: true, fee: 0 } };
    const customer = storefrontCheckoutMethods(payments, { ...TALLABY_PAY, feePayer: "customer" }, "EGP", null, 300);
    expect(customer.onlinePaymentFee).toEqual({ feeBps: 300 });
    const seller = storefrontCheckoutMethods(payments, { ...TALLABY_PAY, feePayer: "seller" }, "EGP", null, 300);
    expect(seller.onlinePaymentFee).toBeUndefined();
    const noRate = storefrontCheckoutMethods(payments, { ...TALLABY_PAY, feePayer: "customer" }, "EGP", null, null);
    expect(noRate.onlinePaymentFee).toBeUndefined();
    // Another gateway never shows it.
    const kashier = storefrontCheckoutMethods(
      payments,
      { provider: "kashier", integrationId: INTEGRATION, feePayer: "customer" },
      "EGP",
      null,
      300,
    );
    expect(kashier.onlinePaymentFee).toBeUndefined();
  });
});
