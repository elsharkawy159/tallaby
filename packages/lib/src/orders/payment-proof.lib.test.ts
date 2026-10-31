import { describe, expect, it } from "vitest";
import { buildPaymentProofPath, readPaymentProof, sniffPaymentProofType } from "./payment-proof.lib";

const ORDER = "11111111-1111-4111-8111-111111111111";
const FILE = "22222222-2222-4222-8222-222222222222";

describe("sniffPaymentProofType", () => {
  it("reads JPEG, PNG and WebP from the first bytes and refuses anything else", () => {
    expect(sniffPaymentProofType(new Uint8Array([0xff, 0xd8, 0xff, 0xe0]))).toBe("image/jpeg");
    expect(sniffPaymentProofType(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))).toBe("image/png");
    const webp = new TextEncoder().encode("RIFF\0\0\0\0WEBPVP8 ");
    expect(sniffPaymentProofType(webp)).toBe("image/webp");
    expect(sniffPaymentProofType(new TextEncoder().encode("<svg xmlns="))).toBeNull();
    expect(sniffPaymentProofType(new TextEncoder().encode("%PDF-1.7"))).toBeNull();
    expect(sniffPaymentProofType(new Uint8Array())).toBeNull();
  });
});

describe("readPaymentProof", () => {
  it("accepts only a path inside this order's folder", () => {
    const path = buildPaymentProofPath(ORDER, FILE, "image/png");
    expect(path).toBe(`${ORDER}/${FILE}.png`);
    expect(readPaymentProof(ORDER, { paymentProof: { path, uploadedAt: "2026-10-31T10:00:00Z" } })).toEqual({
      path,
      uploadedAt: "2026-10-31T10:00:00Z",
    });
    const other = "33333333-3333-4333-8333-333333333333";
    expect(readPaymentProof(other, { paymentProof: { path } })).toBeNull();
    expect(readPaymentProof(ORDER, { paymentProof: { path: `${ORDER}/../x.png` } })).toBeNull();
    expect(readPaymentProof(ORDER, {})).toBeNull();
    expect(readPaymentProof("not-a-uuid", { paymentProof: { path } })).toBeNull();
  });
});
