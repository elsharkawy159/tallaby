import { describe, expect, it } from "vitest";
import { pickSkill, skillForMessage, skillForPage } from "./router";

describe("pickSkill", () => {
  it("lets the page decide", () => {
    expect(skillForPage("/stores/8f0c/shipping")).toBe("shipping");
    expect(skillForPage("/ar/stores/8f0c/shipping?tab=zones")).toBe("shipping");
    expect(skillForPage("/stores/8f0c/editor/home")).toBe("design");
    expect(skillForPage("/products/123/edit")).toBe("products");
    expect(skillForPage("/stores/22222222-2222-4222-8222-222222222222/products/123/edit")).toBe("products");
    expect(skillForPage("/settings")).toBe("settings");
    expect(skillForPage("/orders")).toBeNull();
    expect(pickSkill("/stores/1/shipping", "غير لون المتجر")).toBe("shipping");
  });

  it("falls back to Arabic and English keywords", () => {
    expect(pickSkill("/home", "عايز اعمل شحن لكل المحافظات")).toBe("shipping");
    expect(pickSkill(null, "زوّد سعر كل التيشيرتات 10٪")).toBe("products");
    expect(pickSkill(null, "غير الألوان والخط")).toBe("design");
    expect(pickSkill(null, "حط رقم الواتساب")).toBe("settings");
    expect(pickSkill(null, "Change my brand color to navy")).toBe("design");
    expect(pickSkill(null, "add my instagram link")).toBe("settings");
  });

  it("returns null when unsure", () => {
    expect(skillForMessage("")).toBeNull();
    expect(skillForMessage("ازيك")).toBeNull();
    // One product word, one design word: a tie.
    expect(skillForMessage("price and colour")).toBeNull();
    expect(skillForMessage("سعر الشحن")).toBe("shipping");
  });
});
