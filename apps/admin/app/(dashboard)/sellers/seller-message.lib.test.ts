import { describe, expect, it } from "vitest";
import {
  buildSellerWhatsAppMessage,
  countryFromPhone,
  dialectFor,
  messageGreeting,
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

  // Cairo is UTC+2 on these dates (no summer time in November).
  const morning = new Date("2026-11-17T07:00:00Z"); // 09:00 Cairo
  const afternoon = new Date("2026-11-17T13:00:00Z"); // 15:00 Cairo

  const FULL: Record<MessageDialect, string> = {
    eg: "مساء الخير يا فندم\nمع حضرتك عمر من منصة طلبي\nحضرتك سجلت معانا، وبتابع معاك لو محتاج أي مساعدة.",
    sa: "مساء الخير\nمعك عمر من منصة طلبي\nسجّلت معنا، وأتابع معك إذا احتجت أي مساعدة.",
    gulf: "مساء الخير\nمعك عمر من منصة طلبي\nسجّلت معنا، وأتابع معك إذا احتجت أي مساعدة.",
    levant: "مساء الخير\nمعك عمر من منصة طلبي\nسجّلت عنا، وعم تابع معك إذا بدك أي مساعدة.",
    msa: "مساء الخير\nمعك عمر من منصة طلبي\nلقد سجّلت معنا، وأتابع معك إن احتجت أي مساعدة.",
  };

  // Owner, 2026-11-17: three short lines, the same at every step; never asks for money.
  for (const dialect of dialects) {
    it(`${dialect}: the same three lines at every step`, () => {
      const first = message({ dialect, now: afternoon });
      expect(first).toBe(FULL[dialect]);
      expect(first.split("\n")).toHaveLength(3);
      expect(first).toContain("عمر");
      expect(first).toContain("طلبي");
      expect(first).toMatch(/مساعدة/);
      expect(first).not.toMatch(/محفظ|شحن|رصيد|wallet|دولار|جنيه|ريال|رسوم/i);
      expect(first.match(EMOJI)).toBeNull();
      for (const step of steps)
        for (const activation of activations)
          expect(message({ dialect, step, activation, ownerName: null, now: afternoon })).toBe(first);
    });

    it(`${dialect}: only the greeting changes in the morning`, () => {
      expect(message({ dialect, now: morning })).toBe(FULL[dialect].replace("مساء الخير", "صباح الخير"));
    });
  }

  it("Egypt uses the owner's words", () => {
    expect(message({ now: afternoon })).toBe(
      "مساء الخير يا فندم\nمع حضرتك عمر من منصة طلبي\nحضرتك سجلت معانا، وبتابع معاك لو محتاج أي مساعدة.",
    );
    expect(message({ now: morning }).startsWith("صباح الخير يا فندم\n")).toBe(true);
  });

  it("defaults to the current time", () => {
    expect(message({})).toMatch(/^(صباح|مساء) الخير يا فندم\n/);
  });
});

describe("messageGreeting", () => {
  it("switches at 12:00 noon in Cairo", () => {
    expect(messageGreeting(new Date("2026-11-17T09:59:00Z"))).toBe("صباح الخير"); // 11:59 Cairo
    expect(messageGreeting(new Date("2026-11-17T10:00:00Z"))).toBe("مساء الخير"); // 12:00 Cairo
    expect(messageGreeting(new Date("2026-11-17T21:59:00Z"))).toBe("مساء الخير"); // 23:59 Cairo
  });

  it("is morning again after midnight in Cairo", () => {
    expect(messageGreeting(new Date("2026-11-16T22:00:00Z"))).toBe("صباح الخير"); // 00:00 Cairo
    expect(messageGreeting(new Date("2026-11-16T22:30:00Z"))).toBe("صباح الخير"); // 00:30 Cairo
  });

  it("reads Cairo's clock, not UTC", () => {
    // 10:30 UTC is still morning in UTC, but 12:30 in Cairo.
    expect(messageGreeting(new Date("2026-11-17T10:30:00Z"))).toBe("مساء الخير");
    // 22:30 UTC is evening in UTC, but 00:30 the next day in Cairo.
    expect(messageGreeting(new Date("2026-11-17T22:30:00Z"))).toBe("صباح الخير");
  });

  it("follows Cairo summer time (UTC+3)", () => {
    expect(messageGreeting(new Date("2026-07-01T08:59:00Z"))).toBe("صباح الخير"); // 11:59 Cairo
    expect(messageGreeting(new Date("2026-07-01T09:00:00Z"))).toBe("مساء الخير"); // 12:00 Cairo
  });
});
