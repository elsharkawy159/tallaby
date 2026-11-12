import { describe, expect, it } from "vitest";
import {
  REFERRAL_CODE_RE,
  REFERRAL_PROGRAM,
  REFERRAL_SIGNUP_BONUS_PIASTRES,
  availablePiastres,
  commissionPiastres,
  fromPiastres,
  generateReferralCode,
  maskDestination,
  normalizeEgyptianPhone,
  normalizeReferralCode,
  payoutRequestSchema,
  referralCookieToSet,
  referralShareUrl,
  signupBonusCrossed,
  toPiastres,
  topUpsUsdCents,
  withdrawBlockReason,
} from "./referrals.lib";

describe("money", () => {
  it("converts between EGP and piastres", () => {
    expect(toPiastres("123.45")).toBe(12345);
    expect(toPiastres(0.1)).toBe(10);
    expect(fromPiastres(12345)).toBe("123.45");
    expect(fromPiastres(-40000)).toBe("-400.00");
    expect(fromPiastres(5)).toBe("0.05");
  });

  it("takes 25 % of a top-up, rounded down to the piastre", () => {
    expect(commissionPiastres("100.00")).toBe(2500);
    expect(commissionPiastres("0.03")).toBe(0);
    expect(commissionPiastres("99.99")).toBe(2499);
    expect(commissionPiastres("1234.56")).toBe(30864);
  });

  it("subtracts requested and paid payouts from earned", () => {
    expect(availablePiastres({ earned: 60000, requestedOrPaid: 0 })).toBe(60000);
    expect(availablePiastres({ earned: 10000, requestedOrPaid: 50000 })).toBe(-40000);
  });
});

describe("sign-up bonus program (owner, 2026-11-12)", () => {
  it("is the live program; the percent path stays in code, switched off", () => {
    expect(REFERRAL_PROGRAM).toBe("signup_bonus");
    expect(REFERRAL_SIGNUP_BONUS_PIASTRES).toBe(10_000);
  });

  it("totals wallet-credited USD, converting old EGP-credited top-ups at the switch rate", () => {
    expect(topUpsUsdCents({ usdCredited: "3.00", egpCredited: "0", rate: 53.9007 })).toBe(300);
    // EGP 107.80 at 53.9007 = $2.00.
    expect(topUpsUsdCents({ usdCredited: "3.00", egpCredited: "107.80", rate: 53.9007 })).toBe(500);
    expect(topUpsUsdCents({ usdCredited: "0", egpCredited: "0", rate: null })).toBe(0);
    // EGP credits cannot be measured without a rate.
    expect(topUpsUsdCents({ usdCredited: "5.00", egpCredited: "100.00", rate: null })).toBeNull();
  });

  it("is earned only by the top-up that crosses from below $5 to $5 or more", () => {
    expect(signupBonusCrossed({ beforeUsdCents: 0, thisUsdCents: 499 })).toBe(false);
    expect(signupBonusCrossed({ beforeUsdCents: 0, thisUsdCents: 500 })).toBe(true);
    // Cumulative: $2 then $3.
    expect(signupBonusCrossed({ beforeUsdCents: 200, thisUsdCents: 300 })).toBe(true);
    // Already at $5 before (paid by percentage, or a later top-up): never again.
    expect(signupBonusCrossed({ beforeUsdCents: 500, thisUsdCents: 1000 })).toBe(false);
    expect(signupBonusCrossed({ beforeUsdCents: 900, thisUsdCents: 500 })).toBe(false);
  });
});

describe("withdraw rules", () => {
  it("needs no referral or store count, only the minimum, no open request and an active account", () => {
    const ok = { available: 50000, hasOpenRequest: false, sellerStatus: "approved" };
    expect(withdrawBlockReason(ok)).toBeNull();
    expect(withdrawBlockReason({ ...ok, available: 49999 })).toBe("below_minimum");
    expect(withdrawBlockReason({ ...ok, hasOpenRequest: true, available: 0 })).toBe("open_request");
    expect(withdrawBlockReason({ ...ok, sellerStatus: "suspended", hasOpenRequest: true })).toBe("suspended");
  });
});

describe("codes and links", () => {
  it("normalizes a code or rejects it", () => {
    expect(normalizeReferralCode(" ab3cdef ")).toBe("AB3CDEF");
    expect(normalizeReferralCode("ABC0DEF")).toBeNull();
    expect(normalizeReferralCode("ABCDEF")).toBeNull();
    expect(normalizeReferralCode("ABCDEFGH")).toBeNull();
    expect(normalizeReferralCode(42)).toBeNull();
    expect(normalizeReferralCode(undefined)).toBeNull();
  });

  it("generates valid codes", () => {
    for (let i = 0; i < 100; i++) expect(generateReferralCode()).toMatch(REFERRAL_CODE_RE);
    expect(generateReferralCode(() => 0)).toBe("AAAAAAA");
  });

  it("keeps the first link's code", () => {
    expect(referralCookieToSet("ab3cdef", undefined)).toBe("AB3CDEF");
    expect(referralCookieToSet("ab3cdef", "ZZZZZZZ")).toBeNull();
    expect(referralCookieToSet("bad", undefined)).toBeNull();
    expect(referralCookieToSet(null, undefined)).toBeNull();
    // A broken cookie does not block a valid link.
    expect(referralCookieToSet("AB3CDEF", "bad!")).toBe("AB3CDEF");
  });

  it("builds the share link", () => {
    expect(referralShareUrl("AB3CDEF")).toBe("https://tallaby.com/?ref=AB3CDEF");
    expect(referralShareUrl("AB3CDEF", "http://localhost:3000/")).toBe("http://localhost:3000/?ref=AB3CDEF");
  });
});

describe("phones", () => {
  it("normalizes Egyptian mobiles so a referrer's own phone is recognized", () => {
    expect(normalizeEgyptianPhone("+20 109 999 0000")).toBe("01099990000");
    expect(normalizeEgyptianPhone("0020-109-999-0000")).toBe("01099990000");
    expect(normalizeEgyptianPhone("0109 999 0000")).toBe("01099990000");
  });
});

describe("payout request", () => {
  it("accepts a bank or Vodafone Cash destination", () => {
    expect(
      payoutRequestSchema.safeParse({ method: "bank", holderName: "Omar Ali", bankName: "CIB", accountNumber: "EG380019000500000000263180002" }).success,
    ).toBe(true);
    expect(payoutRequestSchema.safeParse({ method: "vodafone_cash", holderName: "Omar Ali", phone: "01012345678" }).success).toBe(true);
  });

  it("rejects bad input", () => {
    expect(payoutRequestSchema.safeParse({ method: "vodafone_cash", holderName: "Omar", phone: "0123" }).success).toBe(false);
    expect(payoutRequestSchema.safeParse({ method: "bank", holderName: "Omar", bankName: "CIB", accountNumber: "12" }).success).toBe(false);
    expect(payoutRequestSchema.safeParse({ method: "paypal", holderName: "Omar" }).success).toBe(false);
  });

  it("masks the destination", () => {
    expect(maskDestination({ method: "vodafone_cash", holderName: "Omar", phone: "01012345678" })).toBe("•••••••5678");
    expect(maskDestination({ method: "bank", holderName: "Omar", bankName: "CIB", accountNumber: "EG3800190005" })).toBe("CIB •••• 0005");
  });
});
