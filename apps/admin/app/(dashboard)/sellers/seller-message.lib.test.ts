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

  // Owner, 2026-11-13: never feel like asking for money, short, human, one emoji at most.
  for (const dialect of dialects) {
    for (const step of steps) {
      for (const activation of activations) {
        for (const ownerName of ["Painto Ali", null]) {
          it(`${dialect} ${step}/${activation}${ownerName ? "" : " (no name)"} never asks for money`, () => {
            const text = message({ dialect, step, activation, ownerName });
            // Only the pending acknowledgement may say "شحن" (a top-up the seller already sent).
            const withoutPending = activation === "pending" ? text.replace(/\n\n[^\n]*شحن[^\n]*/, "") : text;
            expect(withoutPending).not.toMatch(/محفظ|شحن|رصيد|wallet|دولار|جنيه|ريال|رسوم|يتخصم|ينخصم|يُخصم/i);
            expect(text).not.toMatch(/^مرحب/);
            expect(text).not.toMatch(/Tallaby\.com|فريق طلبي|شكراً لفتح/);
            expect(text.match(EMOJI)?.length ?? 0).toBeLessThanOrEqual(1);
            expect(text).toContain("«Painteg»");
            expect(text).toContain("عمر");
            expect(text.includes("Painto")).toBe(ownerName !== null);
            expect(text.includes("«القوالب»")).toBe(step === "template");
            expect(text.includes("«نشر المنتج»")).toBe(step === "product");
            // Shared once the store is published; the template step can't have a link yet.
            expect(text.includes("https://painteg.tallaby.com")).toBe(step !== "template");
            // Short: at most 8 lines of text (blank separators not counted).
            expect(text.split("\n").filter(Boolean).length).toBeLessThanOrEqual(8);
          });
        }
      }
    }
  }

  it("keeps Gulf words out of the Egyptian copy", () => {
    for (const step of steps) {
      expect(message({ step, activation: "pending" })).not.toMatch(/الحين|قاعدين|هلأ|فيك|شي /);
    }
  });

  it("Egypt, template step, with a name", () => {
    expect(message({ step: "template" })).toMatchInlineSnapshot(`
      "أهلاً يا Painto 👋 أنا عمر من طلبي.
      شفت إنك فتحت متجرك «Painteg»، مبروك!

      اختار قالب لمتجرك من «المتجر الإلكتروني» ← «القوالب»، وتقدر تعاين أي قالب قبل ما تختاره. أول ما تختاره متجرك هيبقى أونلاين.
      وبعدها ضيف منتجاتك من «المنتجات» ← «إضافة منتج».

      لو محتاج أي حاجة كلمني هنا."
    `);
  });

  it("Egypt, product step", () => {
    expect(message({ step: "product" })).toMatchInlineSnapshot(`
      "أهلاً يا Painto 👋 أنا عمر من طلبي.
      شفت إنك فتحت متجرك «Painteg»، مبروك!

      فاضل تضيف أول منتج: ادخل «المنتجات» ← «إضافة منتج» واختار «إضافة يدويًا» أو «إضافة بالذكاء الاصطناعي».
      اكتب الاسم والسعر وارفع الصور، وبعدها اضغط «نشر المنتج».

      متجرك أونلاين، شارك لينكه مع عملائك وعلى صفحاتك على السوشيال ميديا:
      https://painteg.tallaby.com

      لو محتاج أي حاجة كلمني هنا."
    `);
  });

  it("Egypt, ready step", () => {
    expect(message({ step: "ready" })).toMatchInlineSnapshot(`
      "أهلاً يا Painto 👋 أنا عمر من طلبي.
      حبيت أطمّن عليك وعلى متجرك «Painteg».

      متجرك أونلاين، شارك لينكه مع عملائك وعلى صفحاتك على السوشيال ميديا:
      https://painteg.tallaby.com

      لو محتاج أي حاجة كلمني هنا."
    `);
  });

  it("Egypt, pending top-up acknowledged", () => {
    expect(message({ step: "ready", activation: "pending" })).toMatchInlineSnapshot(`
      "أهلاً يا Painto 👋 أنا عمر من طلبي.
      حبيت أطمّن عليك وعلى متجرك «Painteg».

      متجرك أونلاين، شارك لينكه مع عملائك وعلى صفحاتك على السوشيال ميديا:
      https://painteg.tallaby.com

      وطلب الشحن اللي بعته وصلنا، وبنراجعه دلوقتي.

      لو محتاج أي حاجة كلمني هنا."
    `);
  });

  it("Saudi, template step", () => {
    expect(message({ step: "template", dialect: "sa" })).toMatchInlineSnapshot(`
      "هلا Painto 👋 معك عمر من طلبي.
      ألف مبروك على متجرك «Painteg»!

      اختر قالب لمتجرك من «المتجر الإلكتروني» ← «القوالب»، وتقدر تعاين أي قالب قبل ما تختاره. وأول ما تختاره يصير متجرك أونلاين.
      وبعدها ضيف منتجاتك من «المنتجات» ← «إضافة منتج».

      إذا احتجت أي شي كلمني هنا."
    `);
  });

  it("Levant, product step, without a name", () => {
    expect(message({ step: "product", dialect: "levant", ownerName: null })).toMatchInlineSnapshot(`
      "أهلين 👋 معك عمر من طلبي.
      شفت إنك فتحت متجرك «Painteg»، مبروك!

      ضايل تضيف أول منتج: فوت على «المنتجات» ← «إضافة منتج» واختار «إضافة يدويًا» أو «إضافة بالذكاء الاصطناعي».
      اكتب الاسم والسعر وارفع الصور، وبعدين اكبس «نشر المنتج».

      متجرك هلأ أونلاين، شارك رابطه مع زباينك وعلى صفحاتك بالسوشيال ميديا:
      https://painteg.tallaby.com

      إذا بدك أي شي احكيني هون."
    `);
  });

  it("greets without a name when the owner has none", () => {
    expect(message({ ownerName: "  " }).startsWith("أهلاً 👋 أنا عمر من طلبي.")).toBe(true);
    expect(message({ ownerName: "Painto Ali" }).startsWith("أهلاً يا Painto 👋 أنا عمر من طلبي.")).toBe(true);
    expect(message({ dialect: "sa" }).startsWith("هلا Painto 👋 معك عمر من طلبي.")).toBe(true);
    expect(message({ dialect: "levant" }).startsWith("أهلين Painto 👋 معك عمر من طلبي.")).toBe(true);
  });

  it("leaves the link out when the website isn't published", () => {
    const text = message({ storeLink: null });
    expect(text).not.toContain("https://");
    expect(text).not.toContain("أونلاين");
  });
});
