import { randomBytes, randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  CATALOG_SHARE_MAX_PRODUCTS,
  catalogShareUrls,
  catalogWhatsAppHref,
  deriveCatalogShareKey,
  normalizeCatalogProductIds,
  normalizeCatalogTitle,
  orderCatalogRows,
  signCatalogShare,
  verifyCatalogShare,
} from "./catalog-share.lib";

const key = deriveCatalogShareKey(randomBytes(32));
const seller = randomUUID();
const store = randomUUID();
const ids = [randomUUID(), randomUUID(), randomUUID()];

describe("catalog share token", () => {
  it("round-trips picked products, in order, with the title", () => {
    const token = signCatalogShare({ storeId: store, title: "عروض العيد", source: { kind: "products", productIds: ids } }, seller, key);
    expect(token).toMatch(/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/);
    expect(verifyCatalogShare(token, seller, key)).toEqual({ storeId: store, title: "عروض العيد", source: { kind: "products", productIds: ids } });
  });

  it("round-trips a category and the newest products", () => {
    const category = signCatalogShare({ storeId: store, title: null, source: { kind: "category", categoryKey: "women-fashion" } }, seller, key);
    expect(verifyCatalogShare(category, seller, key)?.source).toEqual({ kind: "category", categoryKey: "women-fashion" });
    const newest = signCatalogShare({ storeId: store, title: "", source: { kind: "newest" } }, seller, key);
    expect(verifyCatalogShare(newest, seller, key)).toEqual({ storeId: store, title: null, source: { kind: "newest" } });
  });

  it("refuses another seller, another key and any edit", () => {
    const token = signCatalogShare({ storeId: store, title: "x", source: { kind: "products", productIds: ids } }, seller, key);
    expect(verifyCatalogShare(token, randomUUID(), key)).toBeNull();
    expect(verifyCatalogShare(token, seller, deriveCatalogShareKey(randomBytes(32)))).toBeNull();
    const [body, mac] = token.split(".") as [string, string];
    const bytes = Buffer.from(body, "base64url");
    bytes[bytes.length - 1] ^= 1;
    expect(verifyCatalogShare(`${bytes.toString("base64url")}.${mac}`, seller, key)).toBeNull();
    expect(verifyCatalogShare(`${body}.${mac.slice(0, -2)}AA`, seller, key)).toBeNull();
    expect(verifyCatalogShare("junk", seller, key)).toBeNull();
    expect(verifyCatalogShare(undefined, seller, key)).toBeNull();
    expect(verifyCatalogShare(`${"a".repeat(3000)}.b`, seller, key)).toBeNull();
  });

  it("keeps a 48-product link short enough for WhatsApp", () => {
    const many = Array.from({ length: 60 }, () => randomUUID());
    const token = signCatalogShare({ storeId: store, title: "Catalog", source: { kind: "products", productIds: many } }, seller, key);
    expect(token.length).toBeLessThan(1200);
    const payload = verifyCatalogShare(token, seller, key);
    expect(payload?.source.kind === "products" && payload.source.productIds.length).toBe(CATALOG_SHARE_MAX_PRODUCTS);
  });

  it("refuses empty or invalid input when signing", () => {
    expect(() => signCatalogShare({ storeId: store, title: null, source: { kind: "products", productIds: ["nope"] } }, seller, key)).toThrow();
    expect(() => signCatalogShare({ storeId: "x", title: null, source: { kind: "newest" } }, seller, key)).toThrow();
    expect(() => signCatalogShare({ storeId: store, title: null, source: { kind: "category", categoryKey: " " } }, seller, key)).toThrow();
  });
});

describe("catalog share helpers", () => {
  it("normalizes product ids: valid, distinct, lower-case, capped", () => {
    const upper = ids[0]!.toUpperCase();
    expect(normalizeCatalogProductIds([upper, ids[0], "bad", 3, ids[1]])).toEqual([ids[0], ids[1]]);
  });

  it("normalizes titles to one short line", () => {
    expect(normalizeCatalogTitle("  New\n arrivals \t ")).toBe("New arrivals");
    expect(normalizeCatalogTitle("   ")).toBeNull();
    expect(normalizeCatalogTitle(5)).toBeNull();
    expect(Array.from(normalizeCatalogTitle("ع".repeat(200)) ?? "").length).toBe(80);
  });

  it("orders rows like the token and drops missing products", () => {
    const rows = [{ id: ids[2]! }, { id: ids[0]! }];
    expect(orderCatalogRows(rows, ids).map((r) => r.id)).toEqual([ids[0], ids[2]]);
  });

  it("builds the store-host URLs for both languages", () => {
    expect(catalogShareUrls("https://shop.tallaby.com/", "t.k", ["ar", "en"])).toEqual({
      url: "https://shop.tallaby.com/catalog/t.k",
      altUrl: "https://shop.tallaby.com/en/catalog/t.k",
      altLocale: "en",
      printUrl: "https://shop.tallaby.com/catalog/t.k?print=1",
    });
    expect(catalogShareUrls("https://x.com", "t.k", ["en"])).toMatchObject({ url: "https://x.com/en/catalog/t.k", altUrl: null });
    expect(catalogShareUrls("https://x.com", "t.k", null).url).toBe("https://x.com/catalog/t.k");
  });

  it("builds a WhatsApp share link", () => {
    expect(catalogWhatsAppHref("شوف المنتجات", "https://x.com/catalog/a.b")).toBe(
      `https://wa.me/?text=${encodeURIComponent("شوف المنتجات\nhttps://x.com/catalog/a.b")}`,
    );
  });
});
