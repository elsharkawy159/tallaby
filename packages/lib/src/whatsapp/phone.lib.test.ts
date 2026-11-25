import { describe, expect, it } from "vitest";
import { isWhatsAppPhone, maskPhone, toWhatsAppPhone } from "./phone.lib";

describe("toWhatsAppPhone", () => {
  it("reads every spelling of an Egyptian mobile", () => {
    for (const raw of ["01012345678", "+201012345678", "00201012345678", "201012345678", "+20 101 234 5678", "010-1234-5678", "٠١٠١٢٣٤٥٦٧٨", "1012345678"]) {
      expect(toWhatsAppPhone(raw)).toBe("201012345678");
    }
    expect(toWhatsAppPhone("01512345678")).toBe("201512345678");
  });

  it("accepts a foreign number in international form", () => {
    expect(toWhatsAppPhone("+966512345678")).toBe("966512345678");
    expect(toWhatsAppPhone("00971501234567")).toBe("971501234567");
    expect(toWhatsAppPhone("+44 7700 900123")).toBe("447700900123");
  });

  it("rejects junk, landlines and local foreign numbers", () => {
    for (const raw of [null, undefined, "", "abc", "0101234567", "01312345678", "0223456789", "0512345678", "966512345678", "+123", "+0123456789", "call 01012345678", "1".repeat(50)]) {
      expect(toWhatsAppPhone(raw)).toBeNull();
    }
  });

  it("validates the stored form", () => {
    expect(isWhatsAppPhone("201012345678")).toBe(true);
    expect(isWhatsAppPhone("+201012345678")).toBe(false);
    expect(isWhatsAppPhone("0101")).toBe(false);
  });
});

describe("maskPhone", () => {
  it("masks an Egyptian number like the seller UI shows it", () => {
    expect(maskPhone("201012345678")).toBe("+20 10•••••678");
    expect(maskPhone("+201012345678")).toBe("+20 10•••••678");
  });

  it("masks a foreign number and returns empty for junk", () => {
    expect(maskPhone("966512345678")).toBe("+966 ••••••678");
    expect(maskPhone("nope")).toBe("");
    expect(maskPhone(null)).toBe("");
  });
});
