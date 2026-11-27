import { describe, expect, it } from "vitest";
import { editAiFilePath, fileBytesMatch, isOwnEditAiFilePath, pickTargetByCode, routeByCode, wantsPublish } from "./edit-with-ai.lib";

const SELLER = "11111111-1111-4111-8111-111111111111";
const STORE = "22222222-2222-4222-8222-222222222222";
const OTHER = "33333333-3333-4333-8333-333333333333";

const outline = [
  { id: "s-hero", name: "Hero", kind: "tree" as const, summary: "Winter is here", hasImage: true },
  { id: "s-faq", name: "Questions", kind: "code" as const, summary: "FAQ", hasImage: false },
];

describe("routeByCode", () => {
  it("routes the five sample requests without a model", () => {
    expect(routeByCode({ message: "change the hero image to this photo", hasFile: false, imageCount: 1 })).toEqual({ route: "site" });
    expect(routeByCode({ message: "add an FAQ section about returns", hasFile: false, imageCount: 0 })).toEqual({ route: "site" });
    expect(routeByCode({ message: "add this product, price 450", hasFile: false, imageCount: 1 })).toEqual({ route: "products" });
    expect(routeByCode({ message: "make the announcement text: free shipping over 1000", hasFile: false, imageCount: 0 })).toEqual({ route: "site" });
    expect(routeByCode({ message: "import these products", hasFile: true, imageCount: 0 })).toEqual({ route: "import" });
  });

  it("sends store data to its skill and leaves unclear requests to the router", () => {
    expect(routeByCode({ message: "ضيف منتج جديد بسعر ٤٥٠", hasFile: false, imageCount: 0 })).toEqual({ route: "products" });
    expect(routeByCode({ message: "make delivery to Giza 60 pounds", hasFile: false, imageCount: 0 })).toEqual({ route: "shipping" });
    expect(routeByCode({ message: "change my whatsapp number", hasFile: false, imageCount: 0 })).toEqual({ route: "settings" });
    expect(routeByCode({ message: "change the store theme to green", hasFile: false, imageCount: 0 })).toEqual({ route: "design" });
    expect(routeByCode({ message: "make it look more premium", hasFile: false, imageCount: 0 })).toBeNull();
    expect(routeByCode({ message: "شكرا", hasFile: false, imageCount: 1 })).toEqual({ route: "site" });
  });
});

describe("pickTargetByCode", () => {
  const pick = (message: string, extra: Partial<Parameters<typeof pickTargetByCode>[0]> = {}) => pickTargetByCode({ message, outline, hasHeader: true, hasFooter: true, ...extra });

  it("picks the header, the footer, a named section, the hero, or a new section", () => {
    expect(pick("make the announcement text: free shipping over 1000")).toEqual({ kind: "header" });
    expect(pick("غيّر رقم التليفون في الفوتر")).toEqual({ kind: "footer" });
    expect(pick("shorten the questions section")).toEqual({ kind: "page", sectionId: "s-faq" });
    expect(pick("change the hero image to this photo")).toEqual({ kind: "page", sectionId: "s-hero" });
    expect(pick("غيّر صورة البانر")).toEqual({ kind: "page", sectionId: "s-hero" });
    expect(pick("add an FAQ section about returns")).toEqual({ kind: "page", add: true });
  });

  it("returns null when it can't tell, or the part doesn't exist", () => {
    expect(pick("make the second one red")).toBeNull();
    expect(pick("change the header logo", { hasHeader: false })).toBeNull();
  });
});

describe("wantsPublish", () => {
  it("publishes only when asked, and never against a no", () => {
    expect(wantsPublish("add this product, price 450")).toBe(false);
    expect(wantsPublish("add this product and publish it")).toBe(true);
    expect(wantsPublish("ضيف المنتج ده وانشره")).toBe(true);
    expect(wantsPublish("add it but don't publish")).toBe(false);
    expect(wantsPublish("add it as a draft")).toBe(false);
  });
});

describe("files", () => {
  const bytes = (...b: number[]) => new Uint8Array(b);

  it("checks the first bytes against the extension", () => {
    expect(fileBytesMatch("pdf", bytes(0x25, 0x50, 0x44, 0x46, 0x2d))).toBe(true);
    expect(fileBytesMatch("xlsx", bytes(0x50, 0x4b, 0x03, 0x04))).toBe(true);
    expect(fileBytesMatch("xls", bytes(0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1))).toBe(true);
    expect(fileBytesMatch("csv", new TextEncoder().encode("name,price\nتيشيرت,450\n"))).toBe(true);
    expect(fileBytesMatch("csv", bytes(0x50, 0x4b, 0x03, 0x04))).toBe(false);
    expect(fileBytesMatch("csv", bytes(0x61, 0x00, 0x62))).toBe(false);
    expect(fileBytesMatch("pdf", new TextEncoder().encode("<html>"))).toBe(false);
  });

  it("accepts only this seller's and store's file paths", () => {
    const path = editAiFilePath(SELLER, STORE, "csv", "44444444-4444-4444-8444-444444444444");
    expect(isOwnEditAiFilePath(path, SELLER, STORE)).toBe(true);
    expect(isOwnEditAiFilePath(path, OTHER, STORE)).toBe(false);
    expect(isOwnEditAiFilePath(path, SELLER, OTHER)).toBe(false);
    expect(isOwnEditAiFilePath(`${path}/../x.csv`, SELLER, STORE)).toBe(false);
    expect(isOwnEditAiFilePath(path.replace(".csv", ".exe"), SELLER, STORE)).toBe(false);
  });
});
