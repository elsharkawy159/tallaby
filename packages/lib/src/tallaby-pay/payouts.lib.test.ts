import { describe, expect, it } from "vitest";

import {
  holderMatchesLegalName,
  isEgyptianNationalId,
  maskTallabyPayDestination,
  resolveTallabyPayPayoutAmount,
  tallabyPayDestinationSchema,
  tallabyPayKycSchema,
  tallabyPayPayoutRequestSchema,
  tallabyPayWithdrawBlock,
  tallabyPayWithdrawable,
  type TallabyPayWithdrawState,
} from "./payouts.lib";

const ok: TallabyPayWithdrawState = {
  available: 120_000,
  reserved: 0,
  walletStatus: "active",
  kycStatus: "verified",
  hasOpenRequest: false,
  minPayoutPiastres: 50_000,
};

describe("tallabyPayDestinationSchema", () => {
  it("accepts an InstaPay address or phone, lower-cased and normalized", () => {
    expect(tallabyPayDestinationSchema.parse({ method: "instapay", holderName: " Omar  Ali ", address: "Omar.Ali@InstaPay" })).toEqual({
      method: "instapay",
      holderName: "Omar Ali",
      address: "omar.ali@instapay",
    });
    expect(tallabyPayDestinationSchema.parse({ method: "instapay", holderName: "Omar", address: "+20 101 234 5678" }).address).toBe(
      "01012345678",
    );
    expect(tallabyPayDestinationSchema.safeParse({ method: "instapay", holderName: "Omar", address: "omar@gmail.com" }).success).toBe(false);
    expect(tallabyPayDestinationSchema.safeParse({ method: "instapay", holderName: "Omar", address: "0201234" }).success).toBe(false);
  });

  it("accepts an Egyptian IBAN or an account number, and rejects a short IBAN", () => {
    const iban = "EG38 0019 0005 0000 0000 2631 8000 2";
    expect(tallabyPayDestinationSchema.parse({ method: "bank", holderName: "Omar", bankName: "CIB", accountNumber: iban })).toMatchObject({
      accountNumber: "EG380019000500000000263180002",
    });
    expect(
      tallabyPayDestinationSchema.parse({ method: "bank", holderName: "Omar", bankName: "NBE", accountNumber: "1234-5678-90" }).accountNumber,
    ).toBe("1234567890");
    expect(tallabyPayDestinationSchema.safeParse({ method: "bank", holderName: "Omar", bankName: "CIB", accountNumber: "EG3800" }).success).toBe(
      false,
    );
    expect(tallabyPayDestinationSchema.safeParse({ method: "bank", holderName: "Omar", bankName: "CIB", accountNumber: "12" }).success).toBe(false);
  });

  it("accepts a mobile wallet with a known provider and an Egyptian mobile (Arabic digits too)", () => {
    expect(
      tallabyPayDestinationSchema.parse({ method: "mobile_wallet", holderName: "عمر", provider: "vodafone_cash", phone: "٠١٠١٢٣٤٥٦٧٨" }),
    ).toMatchObject({ phone: "01012345678" });
    expect(
      tallabyPayDestinationSchema.safeParse({ method: "mobile_wallet", holderName: "Omar", provider: "paypal", phone: "01012345678" }).success,
    ).toBe(false);
    expect(
      tallabyPayDestinationSchema.safeParse({ method: "mobile_wallet", holderName: "Omar", provider: "we_pay", phone: "01312345678" }).success,
    ).toBe(false);
  });

  it("rejects an unknown method and a missing holder name", () => {
    expect(tallabyPayDestinationSchema.safeParse({ method: "cash", holderName: "Omar" }).success).toBe(false);
    expect(tallabyPayDestinationSchema.safeParse({ method: "instapay", holderName: " ", address: "a1@instapay" }).success).toBe(false);
  });
});

describe("tallabyPayPayoutRequestSchema amount", () => {
  const destination = { method: "instapay", holderName: "Omar", address: "omar@instapay" };
  it("parses EGP strings into integer piastres without floats", () => {
    expect(tallabyPayPayoutRequestSchema.parse({ amount: "500", destination }).amount).toBe(50_000);
    expect(tallabyPayPayoutRequestSchema.parse({ amount: "1,250.75", destination }).amount).toBe(125_075);
    expect(tallabyPayPayoutRequestSchema.parse({ amount: "0.1", destination }).amount).toBe(10);
    expect(tallabyPayPayoutRequestSchema.parse({ amount: 700, destination }).amount).toBe(70_000);
    expect(tallabyPayPayoutRequestSchema.parse({ destination }).amount).toBeUndefined();
  });
  it("rejects negatives, 3 decimals, floats and text", () => {
    for (const amount of ["-5", "10.005", 10.5, "abc", ""]) {
      expect(tallabyPayPayoutRequestSchema.safeParse({ amount, destination }).success).toBe(false);
    }
  });
});

describe("withdraw rules", () => {
  it("withdrawable is available − reserved, never negative", () => {
    expect(tallabyPayWithdrawable(100_000, 30_000)).toBe(70_000);
    expect(tallabyPayWithdrawable(-5_000, 0)).toBe(0);
    expect(tallabyPayWithdrawable(10_000, 20_000)).toBe(0);
  });

  it("blocks in order: KYC, frozen, open request, no balance, minimum", () => {
    expect(tallabyPayWithdrawBlock({ ...ok, kycStatus: null })).toBe("kyc_required");
    expect(tallabyPayWithdrawBlock({ ...ok, kycStatus: "submitted" })).toBe("kyc_pending");
    expect(tallabyPayWithdrawBlock({ ...ok, kycStatus: "rejected" })).toBe("kyc_rejected");
    expect(tallabyPayWithdrawBlock({ ...ok, walletStatus: "frozen" })).toBe("frozen");
    expect(tallabyPayWithdrawBlock({ ...ok, hasOpenRequest: true })).toBe("open_request");
    expect(tallabyPayWithdrawBlock({ ...ok, available: -100 })).toBe("no_balance");
    expect(tallabyPayWithdrawBlock({ ...ok, available: 0 })).toBe("no_balance");
    expect(tallabyPayWithdrawBlock({ ...ok, available: 49_999 })).toBe("below_minimum");
    expect(tallabyPayWithdrawBlock({ ...ok, available: 60_000, reserved: 20_000 })).toBe("below_minimum");
    expect(tallabyPayWithdrawBlock(ok)).toBeNull();
  });

  it("defaults to the whole withdrawable amount and checks the requested one", () => {
    expect(resolveTallabyPayPayoutAmount(ok, undefined)).toEqual({ ok: true, amount: 120_000 });
    expect(resolveTallabyPayPayoutAmount(ok, 50_000)).toEqual({ ok: true, amount: 50_000 });
    expect(resolveTallabyPayPayoutAmount(ok, 49_999)).toEqual({ ok: false, error: "below_minimum" });
    expect(resolveTallabyPayPayoutAmount(ok, 120_001)).toEqual({ ok: false, error: "above_withdrawable" });
    expect(resolveTallabyPayPayoutAmount({ ...ok, reserved: 10_000 }, 120_000)).toEqual({ ok: false, error: "above_withdrawable" });
    expect(resolveTallabyPayPayoutAmount({ ...ok, kycStatus: null }, 50_000)).toEqual({ ok: false, error: "kyc_required" });
    expect(resolveTallabyPayPayoutAmount({ ...ok, walletStatus: "frozen" }, 50_000)).toEqual({ ok: false, error: "frozen" });
  });
});

describe("KYC", () => {
  it("validates Egyptian national IDs", () => {
    expect(isEgyptianNationalId("29001011234567")).toBe(true);
    expect(isEgyptianNationalId("30512311234567")).toBe(true);
    expect(isEgyptianNationalId("19001011234567")).toBe(false); // century digit
    expect(isEgyptianNationalId("29013011234567")).toBe(false); // month 13
    expect(isEgyptianNationalId("29001001234567")).toBe(false); // day 0
    expect(isEgyptianNationalId("2900101123456")).toBe(false); // 13 digits
  });

  it("normalizes the form", () => {
    expect(tallabyPayKycSchema.parse({ legalName: " عمر   محمد ", idType: "national_id", idNumber: "٢٩٠٠١٠١ 1234567" })).toEqual({
      legalName: "عمر محمد",
      idType: "national_id",
      idNumber: "29001011234567",
    });
    expect(tallabyPayKycSchema.parse({ legalName: "Acme LLC", idType: "commercial_register", idNumber: " 12345 / Cairo " })).toEqual({
      legalName: "Acme LLC",
      idType: "commercial_register",
      idNumber: "12345 / Cairo",
    });
  });

  it("rejects bad IDs, types and names", () => {
    expect(tallabyPayKycSchema.safeParse({ legalName: "Omar", idType: "national_id", idNumber: "123" }).success).toBe(false);
    expect(tallabyPayKycSchema.safeParse({ legalName: "Omar", idType: "passport", idNumber: "A123" }).success).toBe(false);
    expect(tallabyPayKycSchema.safeParse({ legalName: "O", idType: "national_id", idNumber: "29001011234567" }).success).toBe(false);
    expect(tallabyPayKycSchema.safeParse({ legalName: "Omar", idType: "commercial_register", idNumber: "<script>" }).success).toBe(false);
  });

  it("matches the holder to the legal name, ignoring case, spaces and Arabic letter variants", () => {
    expect(holderMatchesLegalName("omar  ALI", "Omar Ali")).toBe(true);
    expect(holderMatchesLegalName("أحمد فاطمة", "احمد فاطمه")).toBe(true);
    expect(holderMatchesLegalName("مُنى", "منى")).toBe(true);
    expect(holderMatchesLegalName("Omar Ali", "Omar Hassan")).toBe(false);
    expect(holderMatchesLegalName("", "Omar")).toBe(false);
  });
});

describe("maskTallabyPayDestination", () => {
  it("shows only what a list needs", () => {
    expect(maskTallabyPayDestination({ method: "mobile_wallet", holderName: "O", provider: "we_pay", phone: "01012345678" })).toBe(
      "•••••••5678",
    );
    expect(maskTallabyPayDestination({ method: "bank", holderName: "O", bankName: "CIB", accountNumber: "EG380019000500000000263180002" })).toBe(
      "CIB •••• 0002",
    );
    expect(maskTallabyPayDestination({ method: "instapay", holderName: "O", address: "omar.ali@instapay" })).toBe("om•••@instapay");
  });
});
