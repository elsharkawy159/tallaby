import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  EASYKASH_API_BASE,
  EASYKASH_FALLBACK_EMAIL,
  buildEasykashPayBody,
  easykashAmountToPiastres,
  easykashMobile,
  easykashSignatureString,
  hasEasykashCallbackFields,
  isEasykashPaidStatus,
  parseEasykashInquiry,
  readEasykashCallback,
  verifyEasykashSignature,
} from "./easykash.lib";

// The example of docs/easykash.md §1.5 (EasyKash's own documentation).
const DOC_SECRET = "da9fe30575517d987762a859842b5631";
const DOC_PAYLOAD = {
  ProductCode: "EDV4471",
  Amount: "11.00",
  ProductType: "Direct Pay",
  PaymentMethod: "Cash Through Fawry",
  BuyerName: "John Doe",
  BuyerEmail: "johndoe@domain.com",
  BuyerMobile: "01010101010",
  Timestamp: "1626166791",
  status: "PAID",
  voucher: "32423432",
  easykashRef: "2911105009",
  VoucherData: "Direct Pay",
  customerReference: "TEST11111",
};
const DOC_STRING = "EDV447111.00Direct PayCash Through FawryPAID2911105009TEST11111";
const sign = (text: string, secret = DOC_SECRET) => createHmac("sha512", secret).update(text).digest("hex");
const signed = (patch: Record<string, unknown> = {}) => ({ ...DOC_PAYLOAD, signatureHash: sign(DOC_STRING), ...patch });

describe("EasyKash callback signature", () => {
  it("uses EasyKash's API host", () => {
    expect(EASYKASH_API_BASE).toBe("https://back.easykash.net");
  });

  it("joins the signed fields in the documented order", () => {
    expect(easykashSignatureString(readEasykashCallback(DOC_PAYLOAD))).toBe(DOC_STRING);
  });

  it("verifies a hash made with the store's secret", () => {
    expect(verifyEasykashSignature(readEasykashCallback(signed()), DOC_SECRET)).toBe(true);
  });

  it("accepts an upper-case hex hash", () => {
    const fields = readEasykashCallback(signed({ signatureHash: sign(DOC_STRING).toUpperCase() }));
    expect(verifyEasykashSignature(fields, DOC_SECRET)).toBe(true);
  });

  it.each([
    ["a changed amount", { Amount: "12.00" }],
    ["a changed reference", { customerReference: "TEST11112" }],
    ["a missing field", { easykashRef: undefined }],
    ["a missing hash", { signatureHash: undefined }],
    ["a short hash", { signatureHash: "abc" }],
  ])("refuses %s", (_label, patch) => {
    expect(verifyEasykashSignature(readEasykashCallback(signed(patch)), DOC_SECRET)).toBe(false);
  });

  it("refuses another store's secret and an empty secret", () => {
    const fields = readEasykashCallback(signed());
    expect(verifyEasykashSignature(fields, "another-store-hmac-secret-0000")).toBe(false);
    expect(verifyEasykashSignature(fields, "")).toBe(false);
  });

  it("refuses a missing field even when the hash matches the shorter string", () => {
    const short = DOC_STRING.replace("2911105009", "");
    const fields = readEasykashCallback(signed({ easykashRef: "", signatureHash: sign(short) }));
    expect(verifyEasykashSignature(fields, DOC_SECRET)).toBe(false);
  });
});

describe("reading callback fields", () => {
  it("reads strings from JSON, form or query objects and drops other types", () => {
    const fields = readEasykashCallback({ ...DOC_PAYLOAD, Amount: 11.5, status: ["PAID"], easykashRef: { x: 1 } });
    expect(fields.Amount).toBe("11.5");
    expect(fields.status).toBe("");
    expect(fields.easykashRef).toBe("");
    expect(fields.customerReference).toBe("TEST11111");
    expect(fields.voucher).toBe("32423432");
  });

  it("reads nothing from a non-object", () => {
    expect(readEasykashCallback(null).customerReference).toBe("");
    expect(readEasykashCallback("x").signatureHash).toBe("");
  });

  it("caps very long values", () => {
    expect(readEasykashCallback({ ProductCode: "x".repeat(5000) }).ProductCode.length).toBe(512);
  });

  it("tells a callback from a plain URL check", () => {
    expect(hasEasykashCallbackFields({})).toBe(false);
    expect(hasEasykashCallbackFields({ foo: "bar" })).toBe(false);
    expect(hasEasykashCallbackFields({ customerReference: "x" })).toBe(true);
    expect(hasEasykashCallbackFields({ signatureHash: "x" })).toBe(true);
  });
});

describe("amounts", () => {
  it.each([
    ["11.00", 1100],
    ["50.5", 5050],
    ["250", 25000],
    ["0.01", 1],
  ])("%s → %d piastres", (amount, piastres) => {
    expect(easykashAmountToPiastres(amount)).toBe(piastres);
  });

  it.each(["", "abc", "-1", "1.234", "1e3", " 1"])("refuses %j", (amount) => {
    expect(easykashAmountToPiastres(amount)).toBeNull();
  });
});

describe("buildEasykashPayBody", () => {
  const base = {
    amountPiastres: 25000,
    currency: "EGP",
    name: "Mona Ali",
    email: "mona@example.com",
    mobile: "+20 101 234 5678",
    redirectUrl: "https://shop.example.com/api/store-payments/return/3f2b8c1e-1d2a-4c3b-9e8f-0a1b2c3d4e5f",
    customerReference: "3f2b8c1e-1d2a-4c3b-9e8f-0a1b2c3d4e5f_abc123",
  };

  it("sends the amount as a 2-decimal number and a 24-hour voucher", () => {
    expect(buildEasykashPayBody(base)).toEqual({
      amount: 250,
      currency: "EGP",
      cashExpiry: 24,
      name: "Mona Ali",
      email: "mona@example.com",
      mobile: "01012345678",
      redirectUrl: base.redirectUrl,
      customerReference: base.customerReference,
    });
    expect(buildEasykashPayBody({ ...base, amountPiastres: 1999 }).amount).toBe(19.99);
    expect(buildEasykashPayBody({ ...base, amountPiastres: 1001 }).amount).toBe(10.01);
  });

  it("falls back to the no-reply email and a generic name", () => {
    const body = buildEasykashPayBody({ ...base, email: null, name: "  " });
    expect(body.email).toBe(EASYKASH_FALLBACK_EMAIL);
    expect(EASYKASH_FALLBACK_EMAIL).toBe("no-reply@tallaby.com");
    expect(body.name).toBe("Customer");
    expect(buildEasykashPayBody({ ...base, email: "not-an-email" }).email).toBe(EASYKASH_FALLBACK_EMAIL);
  });

  it("caps the name", () => {
    expect(buildEasykashPayBody({ ...base, name: "x".repeat(300) }).name.length).toBe(100);
  });
});

describe("easykashMobile", () => {
  it.each([
    ["+20 101 234 5678", "01012345678"],
    ["0020-1012345678", "01012345678"],
    ["201012345678", "01012345678"],
    ["01112345678", "01112345678"],
    ["+966512345678", "966512345678"],
    [null, ""],
  ])("%j → %j", (input, out) => {
    expect(easykashMobile(input)).toBe(out);
  });
});

describe("parseEasykashInquiry", () => {
  it("reads the documented response", () => {
    expect(
      parseEasykashInquiry({
        PaymentMethod: "Cash Through Fawry",
        Amount: "10.05",
        BuyerName: "John Doe",
        status: "PAID",
        voucher: "32423432",
        easykashRef: "1206102054",
      }),
    ).toEqual({
      status: "PAID",
      amountPiastres: 1005,
      easykashRef: "1206102054",
      voucher: "32423432",
      paymentMethod: "Cash Through Fawry",
    });
  });

  it("upper-cases the status and tolerates a missing voucher", () => {
    expect(parseEasykashInquiry({ status: "new", Amount: "1", easykashRef: 77 })).toEqual({
      status: "NEW",
      amountPiastres: 100,
      easykashRef: "77",
      voucher: null,
      paymentMethod: null,
    });
  });

  it("returns null without a status", () => {
    expect(parseEasykashInquiry({ Amount: "1" })).toBeNull();
    expect(parseEasykashInquiry(null)).toBeNull();
  });

  it("knows which statuses are paid", () => {
    expect(isEasykashPaidStatus("PAID")).toBe(true);
    expect(isEasykashPaidStatus("DELIVERED")).toBe(true);
    for (const s of ["NEW", "EXPIRED", "FAILED", "REFUNDED", "CANCELED", ""]) expect(isEasykashPaidStatus(s)).toBe(false);
  });
});
