import { describe, expect, it } from "vitest";
import {
  buildSellerWhatsAppMessage,
  countryFromPhone,
  currencyFor,
  dialectFor,
  messageMoney,
  resolveMessageCountry,
  sellerMessageActivation,
  sellerMessageStep,
  type MessageRates,
  type SellerActivation,
  type SellerMessageInput,
  type SellerMessageStep,
} from "./seller-message.lib";

const RATES: MessageRates = {
  egpPerUsd: 53.9007,
  taxEnabled: false,
  taxRateBps: 1400,
  usd: { SAR: 3.75, AED: 3.6725, KWD: 0.3072, JOD: 0.709 },
};

const message = (over: Partial<SellerMessageInput>) =>
  buildSellerWhatsAppMessage({
    dialect: "eg",
    ownerName: "Painto Ali",
    storeName: "Painteg",
    storeLink: "https://painteg.tallaby.com",
    plan: "free",
    step: "ready",
    activation: "needed",
    money: messageMoney("EGP", RATES),
    ...over,
  });

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

  it("maps countries to dialects and currencies", () => {
    expect([dialectFor("EG"), currencyFor("EG")]).toEqual(["eg", "EGP"]);
    expect([dialectFor("SA"), currencyFor("SA")]).toEqual(["sa", "SAR"]);
    expect([dialectFor("KW"), currencyFor("KW")]).toEqual(["gulf", "KWD"]);
    expect([dialectFor("JO"), currencyFor("JO")]).toEqual(["levant", "JOD"]);
    expect([dialectFor(null), currencyFor(null)]).toEqual(["msa", "USD"]);
  });
});

describe("messageMoney", () => {
  it("rounds the EGP top-up up to a whole pound and keeps piastres on the fee", () => {
    // $5 × 53.9007 = 269.50 → 270; $0.03 → 161.7 piastres → 1.62.
    expect(messageMoney("EGP", RATES)).toEqual({ topUp: "270 جنيه", fee: "1.62 جنيه", currency: "EGP" });
  });

  it("adds the top-up tax when it is on", () => {
    // 26,951 piastres + 14% (3,774) = 30,725 → 308.
    expect(messageMoney("EGP", { ...RATES, taxEnabled: true }).topUp).toBe("308 جنيه");
  });

  it("shows riyals with the dollar amount, and USD without a rate", () => {
    expect(messageMoney("SAR", RATES)).toEqual({ topUp: "19 ريال (5 دولار)", fee: "0.11 ريال", currency: "SAR" });
    expect(messageMoney("KWD", RATES).topUp).toBe("2 دينار كويتي (5 دولار)");
    expect(messageMoney("KWD", RATES).fee).toBe("0.009 دينار كويتي");
    expect(messageMoney("QAR", RATES)).toEqual({ topUp: "5 دولار", fee: "0.03 دولار", currency: "USD" });
    expect(messageMoney("EGP", { ...RATES, egpPerUsd: null }).currency).toBe("USD");
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
  const steps: Array<[SellerMessageStep, SellerActivation]> = [
    ["template", "needed"],
    ["product", "needed"],
    ["ready", "needed"],
    ["ready", "active"],
  ];

  for (const [step, activation] of steps) {
    it(`EG ${step}/${activation}`, () => {
      const text = message({ step, activation });
      expect(text.startsWith("مرحباً Painto، مع حضرتك عمر من منصة طلبي.")).toBe(true);
      expect(text).toContain("«Painteg»");
      expect(text.endsWith("فريق طلبي")).toBe(true);
      expect(text).not.toMatch(/جنية|الحياه|توصيل/);
      expect(text.includes("«القوالب»")).toBe(step === "template");
      expect(text.includes("«نشر المنتج»")).toBe(step === "product");
      expect(text.includes("270 جنيه في أي وقت")).toBe(activation === "needed");
      expect(text.includes("«الرصيد وشحن المحفظة»")).toBe(activation === "needed");
      expect(text.includes("نطمّن")).toBe(activation === "active");
      // Shared once the store is published; the template step can't have a link yet.
      expect(text.includes("https://painteg.tallaby.com")).toBe(step !== "template");
      expect(text.includes("متاح أونلاين لعملائك")).toBe(true);
      // Owner: no grace window, no "at least", no private-store wording.
      expect(text).not.toMatch(/14|يوم|على الأقل|ظاهر لحضرتك بس/);
    });

    it(`SA ${step}/${activation}`, () => {
      const text = message({ step, activation, dialect: "sa", money: messageMoney("SAR", RATES) });
      expect(text.startsWith("هلا Painto، معك عمر من منصة طلبي.")).toBe(true);
      expect(text).not.toContain("جنيه");
      expect(text.includes("19 ريال (5 دولار) في أي وقت")).toBe(activation === "needed");
      expect(text.includes("«استخدام القالب»")).toBe(step === "template");
    });

    it(`unknown country ${step}/${activation}`, () => {
      const text = message({ step, activation, dialect: "msa", money: messageMoney("USD", RATES) });
      expect(text.startsWith("مرحباً Painto، معك عمر من منصة طلبي.")).toBe(true);
      expect(text).not.toContain("جنيه");
      expect(text.includes("5 دولار في أي وقت")).toBe(activation === "needed");
      expect(text.includes("0.03 دولار")).toBe(activation === "needed" || step === "ready");
    });
  }

  it("matches the owner's example for an Egyptian seller with products", () => {
    expect(message({})).toMatchInlineSnapshot(`
      "مرحباً Painto، مع حضرتك عمر من منصة طلبي.
      شكراً لفتح متجرك «Painteg» على طلبي (Tallaby.com).

      متجرك دلوقتي متاح أونلاين لعملائك، شارك لينك متجرك على صفحات البراند بتاعك على السوشيال ميديا:
      https://painteg.tallaby.com

      تقدر تشحن محفظتك بـ 270 جنيه في أي وقت، والرصيد بيفضل في محفظة طلبي على طول، وكل طلب جديد بيتخصم منه 1.62 جنيه تلقائي.
      الشحن من «المحفظة» ثم «الرصيد وشحن المحفظة».

      لو عندك أي استفسار ابعتلنا وإحنا تحت أمرك.
      فريق طلبي"
    `);
  });

  it("leaves the link out when the website isn't published", () => {
    const text = message({ storeLink: null });
    expect(text).not.toContain("https://");
    expect(text).not.toContain("متاح أونلاين");
  });

  it("says a pending top-up is being reviewed instead of asking again", () => {
    const text = message({ activation: "pending" });
    expect(text).toContain("بنراجع الإيصال");
    expect(text).not.toContain("في أي وقت");
  });

  it("tells a Pro seller there is no per-order fee", () => {
    const text = message({ plan: "pro", activation: "active" });
    expect(text).toContain("مفيش أي رسوم على طلباتك");
    expect(text).not.toContain("1.62");
  });

  it("greets without a name when the owner has none", () => {
    expect(message({ ownerName: "  " }).startsWith("مرحباً، مع حضرتك عمر")).toBe(true);
  });
});
