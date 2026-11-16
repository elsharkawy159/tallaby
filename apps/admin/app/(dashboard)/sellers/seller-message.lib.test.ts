import { describe, expect, it } from "vitest";
import {
  buildSellerWhatsAppMessage,
  countryFromPhone,
  dialectFor,
  resolveMessageCountry,
  sellerMessageActivation,
  sellerMessageStep,
  type MessageDialect,
  type SellerActivation,
  type SellerMessageInput,
  type SellerMessageStep,
} from "./seller-message.lib";

const message = (over: Partial<SellerMessageInput>) =>
  buildSellerWhatsAppMessage({
    dialect: "eg",
    ownerName: "Painto Ali",
    storeName: "Painteg",
    storeLink: "https://painteg.tallaby.com",
    step: "ready",
    activation: "needed",
    ...over,
  });

/** Emoji-like characters (pictographs), to keep the message at one emoji at most. */
const EMOJI = /\p{Extended_Pictographic}/gu;

describe("country and dialect", () => {
  it("reads the dialing code", () => {
    expect(countryFromPhone("01003272830")).toBe("EG");
    expect(countryFromPhone("+966 55 123 4567")).toBe("SA");
    expect(countryFromPhone("00971501234567")).toBe("AE");
    expect(countryFromPhone("+447700900123")).toBeNull();
    expect(countryFromPhone("")).toBeNull();
  });

  it("puts a Gulf store currency first, then the phone", () => {
    expect(resolveMessageCountry({ storeCurrency: "SAR", phones: ["01003272830"] })).toBe("SA");
    expect(resolveMessageCountry({ storeCurrency: "EGP", phones: ["+966551234567"] })).toBe("SA");
    expect(resolveMessageCountry({ storeCurrency: null, phones: [null, "01003272830"] })).toBe("EG");
    expect(resolveMessageCountry({ storeCurrency: "USD", phones: ["+447700900123"] })).toBeNull();
  });

  it("falls back to Egypt only with no phone and an EGP store", () => {
    expect(resolveMessageCountry({ storeCurrency: null, phones: [] })).toBe("EG");
    expect(resolveMessageCountry({ storeCurrency: "EUR", phones: [] })).toBeNull();
  });

  it("maps countries to dialects", () => {
    expect(dialectFor("EG")).toBe("eg");
    expect(dialectFor("SA")).toBe("sa");
    expect(dialectFor("KW")).toBe("gulf");
    expect(dialectFor("JO")).toBe("levant");
    expect(dialectFor(null)).toBe("msa");
  });
});

describe("step and activation", () => {
  it("takes the first open setup step", () => {
    expect(sellerMessageStep({ templateChosen: false, hasActiveProduct: true })).toBe("template");
    expect(sellerMessageStep({ templateChosen: true, hasActiveProduct: false })).toBe("product");
    expect(sellerMessageStep({ templateChosen: true, hasActiveProduct: true })).toBe("ready");
  });

  it("follows the activation rule", () => {
    const base = { usdLive: true, isPro: false, hasTopUp: false, hasHadPositiveBalance: false, hasPendingTopUp: false };
    expect(sellerMessageActivation(base)).toBe("needed");
    expect(sellerMessageActivation({ ...base, hasPendingTopUp: true })).toBe("pending");
    expect(sellerMessageActivation({ ...base, hasTopUp: true })).toBe("active");
    expect(sellerMessageActivation({ ...base, hasHadPositiveBalance: true })).toBe("active");
    expect(sellerMessageActivation({ ...base, isPro: true })).toBe("active");
    expect(sellerMessageActivation({ ...base, usdLive: false })).toBe("active");
  });
});

describe("buildSellerWhatsAppMessage", () => {
  const dialects: MessageDialect[] = ["eg", "sa", "gulf", "levant", "msa"];
  const steps: SellerMessageStep[] = ["template", "product", "ready"];
  const activations: SellerActivation[] = ["needed", "pending", "active"];

  // Owner, 2026-11-16: one short line, the same at every step; never asks for money.
  for (const dialect of dialects) {
    it(`${dialect}: one short line at every step`, () => {
      const first = message({ dialect });
      expect(first.split("\n")).toHaveLength(1);
      expect(first).toContain("طلبي");
      expect(first).toMatch(/مساعدة/);
      expect(first).not.toMatch(/محفظ|شحن|رصيد|wallet|دولار|جنيه|ريال|رسوم/i);
      expect(first.match(EMOJI)).toBeNull();
      for (const step of steps) for (const activation of activations) expect(message({ dialect, step, activation, ownerName: null })).toBe(first);
    });
  }

  it("Egypt uses the owner's words", () => {
    expect(message({})).toBe("صباح الخير يا فندم، حضرتك سجلت في طلبي، بتابع معاك لو محتاج أي مساعدة.");
  });
});
