import { describe, expect, it } from "vitest";
import { normalizeCountryPhone, normalizeForeignPhone, whatsAppDigits } from "./phone.lib";

describe("normalizeCountryPhone", () => {
  it("takes every Saudi mobile spelling", () => {
    for (const input of ["0512345678", "+966512345678", "966512345678", "00966512345678", "٠٥١٢٣٤٥٦٧٨", "051 234 5678"]) {
      expect(normalizeCountryPhone("SA", input)).toBe("+966512345678");
    }
  });

  it("refuses what isn't a Saudi mobile", () => {
    for (const input of ["01012345678", "0412345678", "051234567", "+20 101 234 5678", "abc", "", null]) {
      expect(normalizeCountryPhone("SA", input)).toBeNull();
    }
  });

  it("uses the country's code for a listed country", () => {
    expect(normalizeCountryPhone("AE", "050 123 4567")).toBe("+971501234567");
    expect(normalizeCountryPhone("AE", "+971501234567")).toBe("+971501234567");
    expect(normalizeCountryPhone("KW", "51234567")).toBe("+96551234567");
    expect(normalizeCountryPhone("KW", "12")).toBeNull();
  });

  it("needs the full number for a country not on the list", () => {
    expect(normalizeCountryPhone("BR", "+55 11 91234 5678")).toBe("+5511912345678");
    expect(normalizeCountryPhone("BR", "11912345678")).toBeNull();
  });
});

describe("normalizeForeignPhone", () => {
  it("reads numbers that say their country", () => {
    expect(normalizeForeignPhone("+966 51 234 5678")).toBe("+966512345678");
    expect(normalizeForeignPhone("00971501234567")).toBe("+971501234567");
    expect(normalizeForeignPhone("0512345678")).toBe("+966512345678");
    expect(normalizeForeignPhone("966512345678")).toBe("+966512345678");
  });

  it("leaves Egyptian numbers and short input alone", () => {
    for (const input of ["01012345678", "+201012345678", "+20 12", "12345", "123", "", null, "abc"]) {
      expect(normalizeForeignPhone(input)).toBeNull();
    }
  });
});

describe("whatsAppDigits", () => {
  it("gives the international digits", () => {
    expect(whatsAppDigits("+966512345678")).toBe("966512345678");
    expect(whatsAppDigits("01012345678")).toBe("201012345678");
  });
});
