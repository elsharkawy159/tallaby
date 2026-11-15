import { describe, expect, it } from "vitest";
import { isOwnSellerDocumentUrl, sellerDocumentsFolder } from "./seller-documents.lib";

const SUPABASE = "https://abc.supabase.co";
const ME = "11111111-1111-4111-8111-111111111111";
const OTHER = "22222222-2222-4222-8222-222222222222";
const base = `${SUPABASE}/storage/v1/object/public/sellers`;
const own = `${base}/documents/${ME}/1791885270869-shipping-cost.png`;

describe("sellerDocumentsFolder", () => {
  it("puts documents under the seller id", () => {
    expect(sellerDocumentsFolder(ME)).toBe(`documents/${ME}`);
    expect(sellerDocumentsFolder(ME.toUpperCase())).toBe(`documents/${ME}`);
  });
});

describe("isOwnSellerDocumentUrl", () => {
  it("accepts a file in the seller's own folder", () => {
    expect(isOwnSellerDocumentUrl(ME, own, SUPABASE)).toBe(true);
    expect(isOwnSellerDocumentUrl(ME, `${base}/documents/${ME}/1791885270869-.PNG`, SUPABASE)).toBe(true);
  });

  it("rejects another seller's folder", () => {
    expect(isOwnSellerDocumentUrl(ME, `${base}/documents/${OTHER}/1791885270869-a.png`, SUPABASE)).toBe(false);
    expect(isOwnSellerDocumentUrl(OTHER, own, SUPABASE)).toBe(false);
  });

  it("rejects dot segments and encoded tricks", () => {
    expect(isOwnSellerDocumentUrl(ME, `${base}/documents/${ME}/../${OTHER}/1791885270869-a.png`, SUPABASE)).toBe(false);
    expect(isOwnSellerDocumentUrl(ME, `${base}/documents/${ME}/%2e%2e/1791885270869-a.png`, SUPABASE)).toBe(false);
    expect(isOwnSellerDocumentUrl(ME, `${base}/documents/${ME}\\1791885270869-a.png`, SUPABASE)).toBe(false);
    expect(isOwnSellerDocumentUrl(ME, `${base}/documents/${ME}/sub/1791885270869-a.png`, SUPABASE)).toBe(false);
  });

  it("rejects old shared paths, other buckets and other hosts", () => {
    expect(isOwnSellerDocumentUrl(ME, `${base}/documents/1791885270869-a.png`, SUPABASE)).toBe(false);
    expect(isOwnSellerDocumentUrl(ME, `${SUPABASE}/storage/v1/object/public/products/documents/${ME}/1791885270869-a.png`, SUPABASE)).toBe(false);
    expect(isOwnSellerDocumentUrl(ME, own.replace(SUPABASE, "https://evil.example"), SUPABASE)).toBe(false);
    expect(isOwnSellerDocumentUrl(ME, own.replace("https:", "http:"), SUPABASE)).toBe(false);
    expect(isOwnSellerDocumentUrl(ME, `${own}?x=1`, SUPABASE)).toBe(false);
    expect(isOwnSellerDocumentUrl(ME, `${own}#x`, SUPABASE)).toBe(false);
    expect(isOwnSellerDocumentUrl(ME, `documents/${ME}/1791885270869-a.png`, SUPABASE)).toBe(false);
    expect(isOwnSellerDocumentUrl(ME, "javascript:alert(1)", SUPABASE)).toBe(false);
  });

  it("rejects bad input", () => {
    expect(isOwnSellerDocumentUrl("not-a-uuid", own, SUPABASE)).toBe(false);
    expect(isOwnSellerDocumentUrl(ME, own, "")).toBe(false);
    expect(isOwnSellerDocumentUrl(ME, `${base}/documents/${ME}/${"a".repeat(1100)}.png`, SUPABASE)).toBe(false);
  });
});
