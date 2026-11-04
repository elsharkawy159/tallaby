import { describe, expect, it } from "vitest";
import { blockPhoneSchema, normalizeBlockedPhone } from "./blocked-phones.lib";

describe("normalizeBlockedPhone", () => {
  it("maps every Egyptian mobile spelling to 01XXXXXXXXX", () => {
    for (const input of [
      "01012345678",
      "010 1234 5678",
      "+201012345678",
      "+20 101 234 5678",
      "201012345678",
      "00201012345678",
      "1012345678",
      "٠١٠١٢٣٤٥٦٧٨",
    ]) {
      expect(normalizeBlockedPhone(input)).toBe("01012345678");
    }
  });

  it("returns null for anything that can't be read as a mobile", () => {
    for (const input of ["", "0101234567", "0221234567", "abc", "013123456789"]) {
      expect(normalizeBlockedPhone(input)).toBeNull();
    }
  });

  it("stores a foreign number in international form", () => {
    expect(normalizeBlockedPhone("+447700900123")).toBe("+447700900123");
    for (const input of ["0512345678", "+966 51 234 5678", "966512345678", "00966512345678"]) {
      expect(normalizeBlockedPhone(input)).toBe("+966512345678");
    }
  });
});

describe("blockPhoneSchema", () => {
  it("normalises the phone and trims the reason", () => {
    expect(blockPhoneSchema.parse({ phone: "+20 115 000 1111", reason: "  refused twice " })).toEqual({
      phone: "01150001111",
      reason: "refused twice",
    });
  });

  it("drops an empty reason and rejects a bad phone", () => {
    expect(blockPhoneSchema.parse({ phone: "01150001111", reason: "  " })).toEqual({ phone: "01150001111" });
    expect(blockPhoneSchema.safeParse({ phone: "123" }).success).toBe(false);
  });
});
