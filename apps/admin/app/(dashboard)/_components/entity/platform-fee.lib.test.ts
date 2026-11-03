import { describe, expect, it } from "vitest";
import { FLAT_FEE_LABEL, platformFeeState } from "./platform-fee.lib";

const at = new Date("2026-10-21T12:00:00Z");

describe("platform fee display", () => {
  it("shows the flat EGP 5 fee by default", () => {
    expect(FLAT_FEE_LABEL).toBe("EGP 5 per delivered order");
    expect(platformFeeState({}, at)).toEqual({ kind: "standard", label: FLAT_FEE_LABEL });
  });

  it("follows a USD wallet: 3 cents on Free, nothing on an active Pro", () => {
    const usd = { walletCurrency: "USD" };
    expect(platformFeeState(usd, at)).toEqual({ kind: "standard", label: "$0.03 per order" });
    expect(platformFeeState({ ...usd, plan: "pro", planExpiresAt: "2026-11-21T00:00:00Z" }, at).kind).toBe("pro");
    expect(platformFeeState({ ...usd, plan: "pro", planExpiresAt: "2026-10-01T00:00:00Z" }, at)).toEqual({
      kind: "standard",
      label: "$0.03 per order",
    });
    expect(platformFeeState({ ...usd, isCommissionExempt: true }, at).kind).toBe("exempt");
  });

  it("shows an active trial with its end date", () => {
    const state = platformFeeState(
      { feeTrialStartedAt: "2026-10-18T00:00:00Z", feeTrialEndsAt: "2026-10-25T00:00:00Z" },
      at,
    );
    expect(state).toEqual({ kind: "trial", label: "Free trial", endsAt: "2026-10-25T00:00:00.000Z" });
  });

  it("falls back to the flat fee once the trial has ended", () => {
    const state = platformFeeState(
      { feeTrialStartedAt: "2026-10-01T00:00:00Z", feeTrialEndsAt: "2026-10-08T00:00:00Z" },
      at,
    );
    expect(state.kind).toBe("standard");
  });

  it("puts exemption before the trial", () => {
    const state = platformFeeState(
      { isCommissionExempt: true, feeTrialStartedAt: "2026-10-18T00:00:00Z", feeTrialEndsAt: "2026-10-25T00:00:00Z" },
      at,
    );
    expect(state.kind).toBe("exempt");
  });
});
