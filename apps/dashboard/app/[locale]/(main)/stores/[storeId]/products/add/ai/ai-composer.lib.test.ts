import { describe, expect, it } from "vitest";
import { checkComposer, describesProduct, mentionsReviews, parsePrices } from "./ai-composer.lib";

describe("parsePrices", () => {
  it("reads the design's example", () => {
    expect(parsePrices("سماعة لاسلكية. السعر 1200 ج.م وبعد الخصم 950 ج.م")).toEqual({ price: 1200, sale: 950, percentOff: null });
  });

  it("reads Arabic digits and thousands separators", () => {
    expect(parsePrices("السعر ١٬٢٠٠ جنيه").price).toBe(1200);
    expect(parsePrices("price 1,200 EGP").price).toBe(1200);
  });

  it("does not take a percentage for a price", () => {
    expect(parsePrices("السعر 1200 ج.م بخصم 20%")).toEqual({ price: 1200, sale: null, percentOff: 20 });
    expect(parsePrices("بخصم 20%").price).toBeNull();
    expect(parsePrices("خصم 20%").price).toBeNull();
  });

  it("ignores numbers that are not prices", () => {
    expect(parsePrices("بطارية 30 ساعة وبلوتوث 5.3").price).toBeNull();
    expect(parsePrices("مقاوم للماء IPX5 وشبكة 5G").price).toBeNull();
    expect(parsePrices("اتصل 01012345678").price).toBeNull();
  });

  it.each([
    ["500 جنية", 500],
    ["٥٠٠ جنية", 500],
    ["500ج", 500],
    ["500 ج", 500],
    ["500 ل.م", 500],
    ["بـ 500", 500],
    ["ب500", 500],
    ["500", 500],
    ["500 L.E", 500],
    ["بكام 500", 500],
  ])("reads %s as a price with no sale", (text, price) => {
    expect(parsePrices(text)).toEqual({ price, sale: null, percentOff: null });
  });

  it("reads was and now", () => {
    expect(parsePrices("كان 800 بقى 500")).toEqual({ price: 800, sale: 500, percentOff: null });
    expect(parsePrices("كان 800 دلوقتي 500 جنيه")).toEqual({ price: 800, sale: 500, percentOff: null });
    expect(parsePrices("بدل 800 ب 500")).toEqual({ price: 800, sale: 500, percentOff: null });
    expect(parsePrices("price 800 now 500")).toEqual({ price: 800, sale: 500, percentOff: null });
    expect(parsePrices("1200 وبعد الخصم 950")).toEqual({ price: 1200, sale: 950, percentOff: null });
  });

  it("does not invent a sale from a time, a size or a count", () => {
    expect(parsePrices("متوفر بعد 3 ايام السعر 500 جنيه")).toEqual({ price: 500, sale: null, percentOff: null });
    expect(parsePrices("available after 3 days price 500")).toEqual({ price: 500, sale: null, percentOff: null });
    expect(parsePrices("مقاس 42 تيشيرت 500 جنية")).toEqual({ price: 500, sale: null, percentOff: null });
    expect(parsePrices("تيشيرت 500 جنية مقاسات 40 41 42")).toEqual({ price: 500, sale: null, percentOff: null });
    expect(parsePrices("علبة 12 قطعة بسعر 500")).toEqual({ price: 500, sale: null, percentOff: null });
  });

  it("does not take two amounts for a sale without a signal", () => {
    expect(parsePrices("السعر 500 جنيه والشحن 50 جنيه")).toEqual({ price: 500, sale: null, percentOff: null });
    expect(parsePrices("السعر 500 والشحن 800 جنيه").sale).toBeNull();
  });

  it("prefers an amount with a currency or a price word over a bare number", () => {
    expect(parsePrices("موديل قوي 2000 بسعر 500").price).toBe(500);
    expect(parsePrices("عبوة 750 حجم كبير 300 جنيه").price).toBe(300);
  });
});

describe("describesProduct", () => {
  it("needs two real words beside the price", () => {
    expect(describesProduct("السعر 1200 ج.م")).toBe(false);
    expect(describesProduct("وبعد الخصم 950 جنية")).toBe(false);
    expect(describesProduct("تيشيرت 300 جنيه")).toBe(false);
    expect(describesProduct("تيشيرت قطن 300 جنيه")).toBe(true);
    expect(describesProduct("عطر مسك فاخر 500 جنيه")).toBe(true);
    expect(describesProduct("سماعة أذن لاسلكية بعزل للضوضاء")).toBe(true);
  });
});

describe("mentionsReviews", () => {
  it("spots reviews in either language", () => {
    expect(mentionsReviews("تقييمات: ممتاز")).toBe(true);
    expect(mentionsReviews("Reviews: great")).toBe(true);
    expect(mentionsReviews("سماعة أذن")).toBe(false);
  });
});

describe("checkComposer", () => {
  const good = "سماعة أذن لاسلكية بعزل للضوضاء، السعر 1200 ج.م";
  const name = "سماعة أذن لاسلكية";

  it("asks for the description, then the photo, then the price", () => {
    expect(checkComposer("", 0, false).missing).toBe("desc");
    expect(checkComposer(good, 0, false).missing).toBe("img");
    expect(checkComposer("سماعة أذن لاسلكية بعزل للضوضاء", 1, false).missing).toBe("price");
    expect(checkComposer(good, 1, false).missing).toBeNull();
  });

  it("lets a PDF alone through", () => {
    expect(checkComposer("", 0, true).missing).toBeNull();
  });

  it("treats reviews as optional", () => {
    expect(checkComposer(good, 1, false).rev).toBe(false);
  });

  it.each(["500 جنية", "٥٠٠ جنية", "500ج", "500 ج", "بـ 500", "ب500", "500", "500 L.E", "بكام 500", "كان 800 بقى 500"])(
    "never blocks a seller who wrote %s",
    (price) => {
      expect(checkComposer(`${name} ${price}`, 1, false).missing).toBeNull();
    },
  );

  it("still asks for a price after a percentage alone", () => {
    expect(checkComposer(`${name} خصم 20%`, 1, false).missing).toBe("price");
  });

  it.each(["تيشيرت قطن 300 جنيه", "عطر مسك فاخر 500 جنيه"])("accepts the short description %s", (text) => {
    expect(checkComposer(text, 1, false).missing).toBeNull();
  });
});
