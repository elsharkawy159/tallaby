import { describe, expect, it } from "vitest";
import {
  DEFAULT_LEAD_TEMPLATES,
  LEAD_TEMPLATE_MAX,
  leadProductsText,
  leadWhatsAppUrl,
  normalizeLeadPhone,
  parseLeadRange,
  parseLeadStatus,
  parseLeadTemplate,
  renderLeadMessage,
} from "./checkout-leads.lib";

describe("missed orders helpers", () => {
  it("normalises Egyptian mobiles and rejects the rest", () => {
    expect(normalizeLeadPhone("01012345678")).toBe("01012345678");
    expect(normalizeLeadPhone("+20 101 234 5678")).toBe("01012345678");
    expect(normalizeLeadPhone("0020-111-234-5678")).toBe("01112345678");
    expect(normalizeLeadPhone("0131234567")).toBeNull();
    expect(normalizeLeadPhone("0223456789")).toBeNull();
    expect(normalizeLeadPhone("")).toBeNull();
    expect(normalizeLeadPhone(null)).toBeNull();
  });

  it("reads the store's template and falls back to the default", () => {
    expect(parseLeadTemplate(null)).toBeNull();
    expect(parseLeadTemplate({ missedOrders: { whatsappTemplate: "  " } })).toBeNull();
    expect(parseLeadTemplate({ missedOrders: { whatsappTemplate: "Hi {name}" } })).toBe("Hi {name}");
    expect(parseLeadTemplate({ missedOrders: { whatsappTemplate: "x".repeat(2000) } })).toHaveLength(LEAD_TEMPLATE_MAX);
  });

  it("lists up to three products, then a count", () => {
    const items = ["Lamp", "Mug", "Chair", "Rug", "Vase"].map((title) => ({ title }));
    expect(leadProductsText(items.slice(0, 2), "en")).toBe("Lamp, Mug");
    expect(leadProductsText(items, "en")).toBe("Lamp, Mug, Chair and 2 more");
    expect(leadProductsText(items, "ar")).toBe("Lamp، Mug، Chair و2 منتجات أخرى");
  });

  it("fills placeholders literally, even with $ in the values", () => {
    const text = renderLeadMessage("{name} · {products} · {total} · {store} · {link} · {unknown}", {
      name: "Mona $&",
      products: "Lamp",
      total: "EGP 250",
      store: "Nour",
      link: "https://nour.tallaby.com",
    });
    expect(text).toBe("Mona $& · Lamp · EGP 250 · Nour · https://nour.tallaby.com · {unknown}");
    expect(renderLeadMessage(DEFAULT_LEAD_TEMPLATES.ar, { name: "منى", products: "x", total: "", store: "s", link: "l" })).toContain("منى");
  });

  it("builds an international wa.me link", () => {
    expect(leadWhatsAppUrl("01012345678", "Hi there")).toBe("https://wa.me/201012345678?text=Hi%20there");
  });

  it("parses filters with safe defaults", () => {
    expect(parseLeadRange("7d")).toBe("7d");
    expect(parseLeadRange("year")).toBe("30d");
    expect(parseLeadStatus("contacted")).toBe("contacted");
    expect(parseLeadStatus(undefined)).toBe("all");
  });
});
