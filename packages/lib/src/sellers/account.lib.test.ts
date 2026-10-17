import { describe, expect, it } from "vitest";
import {
  BUSINESS_TYPES,
  businessAccountSchema,
  maskPayoutDetails,
  payoutDetailsSchema,
  sellerLegalAddressSchema,
} from "./account.lib";

describe("sellerLegalAddressSchema", () => {
  it("accepts a full Egyptian address", () => {
    expect(
      sellerLegalAddressSchema.parse({ street: "12 Tahrir St", city: "Dokki", state: "GIZA", postalCode: "12611", country: "EG" }),
    ).toMatchObject({ state: "GIZA", country: "EG" });
  });

  it("rejects an unknown governorate and a non-EG country", () => {
    expect(sellerLegalAddressSchema.safeParse({ street: "12 Tahrir St", city: "Dokki", state: "ATLANTIS", country: "EG" }).success).toBe(false);
    expect(sellerLegalAddressSchema.safeParse({ street: "12 Tahrir St", city: "Dokki", state: "GIZA", country: "US" }).success).toBe(false);
  });
});

describe("payoutDetailsSchema", () => {
  it("accepts an Egyptian IBAN for bank transfers (spaces removed, upper-cased)", () => {
    const parsed = payoutDetailsSchema.parse({
      method: "bank_transfer",
      accountHolder: "Omar Ali",
      bankName: "CIB",
      iban: "eg38 0019 0005 0000 0000 2631 8000 2",
    });
    expect(parsed).toMatchObject({ method: "bank_transfer", iban: "EG380019000500000000263180002" });
  });

  it("rejects a malformed IBAN", () => {
    expect(
      payoutDetailsSchema.safeParse({ method: "bank_transfer", accountHolder: "Omar", bankName: "CIB", iban: "EG12" }).success,
    ).toBe(false);
  });

  it("accepts a mobile wallet with an Egyptian number", () => {
    expect(
      payoutDetailsSchema.parse({ method: "mobile_wallet", accountHolder: "Omar", provider: "vodafone_cash", phone: "01012345678" }),
    ).toMatchObject({ provider: "vodafone_cash" });
    expect(
      payoutDetailsSchema.safeParse({ method: "mobile_wallet", accountHolder: "Omar", provider: "vodafone_cash", phone: "123" }).success,
    ).toBe(false);
  });

  it("accepts InstaPay by address or mobile", () => {
    expect(payoutDetailsSchema.safeParse({ method: "instapay", accountHolder: "Omar", address: "omar@instapay" }).success).toBe(true);
    expect(payoutDetailsSchema.safeParse({ method: "instapay", accountHolder: "Omar", address: "01012345678" }).success).toBe(true);
    expect(payoutDetailsSchema.safeParse({ method: "instapay", accountHolder: "Omar", address: "not valid" }).success).toBe(false);
  });

  it("rejects extra keys", () => {
    expect(
      payoutDetailsSchema.safeParse({ method: "instapay", accountHolder: "Omar", address: "omar@instapay", admin: true }).success,
    ).toBe(false);
  });
});

describe("maskPayoutDetails", () => {
  it("shows only the last 4 characters of account identifiers", () => {
    expect(
      maskPayoutDetails({ method: "bank_transfer", accountHolder: "Omar", bankName: "CIB", iban: "EG380019000500000000263180002" }),
    ).toEqual({ method: "bank_transfer", accountHolder: "Omar", bankName: "CIB", last4: "0002" });
    expect(maskPayoutDetails({ method: "mobile_wallet", accountHolder: "Omar", provider: "vodafone_cash", phone: "01012345678" })).toEqual({
      method: "mobile_wallet",
      accountHolder: "Omar",
      provider: "vodafone_cash",
      last4: "5678",
    });
  });

  it("returns null for missing or invalid stored details", () => {
    expect(maskPayoutDetails(null)).toBeNull();
    expect(maskPayoutDetails({ anything: 1 })).toBeNull();
  });
});

describe("businessAccountSchema", () => {
  it("accepts the business name and a known business type", () => {
    expect(businessAccountSchema.parse({ businessName: " Faster ", businessType: "company" })).toEqual({
      businessName: "Faster",
      businessType: "company",
    });
    expect(BUSINESS_TYPES).toContain("individual");
  });

  it("rejects unknown business types and keys", () => {
    expect(businessAccountSchema.safeParse({ businessName: "Faster", businessType: "llc" }).success).toBe(false);
    expect(businessAccountSchema.safeParse({ businessName: "Faster", status: "approved" }).success).toBe(false);
  });
});
