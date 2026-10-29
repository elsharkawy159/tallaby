import { describe, expect, it } from "vitest";
import {
  REFERRAL_CODE_RE,
  availablePiastres,
  commissionPiastres,
  fromPiastres,
  generateReferralCode,
  isUnlocked,
  maskDestination,
  normalizeEgyptianPhone,
  normalizeReferralCode,
  payoutRequestSchema,
  referralCookieToSet,
  referralShareUrl,
  toPiastres,
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

  it("takes 20 % of a top-up, rounded down to the piastre", () => {
    expect(commissionPiastres("100.00")).toBe(2000);
    expect(commissionPiastres("0.03")).toBe(0);
    expect(commissionPiastres("99.99")).toBe(1999);
    expect(commissionPiastres("1234.56")).toBe(24691);
  });

  it("subtracts requested and paid payouts from earned", () => {
    expect(availablePiastres({ earned: 60000, requestedOrPaid: 0 })).toBe(60000);
    expect(availablePiastres({ earned: 10000, requestedOrPaid: 50000 })).toBe(-40000);
  });
});

describe("unlock and withdraw rules", () => {
  it("needs 10 referrals and 10 stores, or an earlier unlock", () => {
    expect(isUnlocked({ successfulReferrals: 10, stores: 10, unlockedAt: null })).toBe(true);
    expect(isUnlocked({ successfulReferrals: 10, stores: 9, unlockedAt: null })).toBe(false);
    expect(isUnlocked({ successfulReferrals: 9, stores: 30, unlockedAt: null })).toBe(false);
    expect(isUnlocked({ successfulReferrals: 0, stores: 0, unlockedAt: "2026-10-29T00:00:00Z" })).toBe(true);
  });

  it("reports the first reason a withdrawal is blocked", () => {
    const ok = { unlocked: true, available: 50000, hasOpenRequest: false, sellerStatus: "approved" };
    expect(withdrawBlockReason(ok)).toBeNull();
    expect(withdrawBlockReason({ ...ok, available: 49999 })).toBe("below_minimum");
    expect(withdrawBlockReason({ ...ok, hasOpenRequest: true, available: 0 })).toBe("open_request");
    expect(withdrawBlockReason({ ...ok, unlocked: false, hasOpenRequest: true })).toBe("locked");
    expect(withdrawBlockReason({ ...ok, sellerStatus: "suspended", unlocked: false })).toBe("suspended");
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
