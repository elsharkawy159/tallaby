import { describe, expect, it } from "vitest";
import {
  createStoreInputSchema,
  storeGeneralSettingsSchema,
  subdomainCandidates,
} from "./stores.lib";
import { validateSubdomain } from "../storefront";

describe("subdomainCandidates", () => {
  it("suggests valid alternatives derived from the base", () => {
    const list = subdomainCandidates("my-shop");
    expect(list.length).toBeGreaterThanOrEqual(3);
    expect(list).not.toContain("my-shop");
    for (const s of list) expect(validateSubdomain(s), s).toBeNull();
    expect(list.every((s) => s.startsWith("my-shop"))).toBe(true);
  });

  it("keeps suggestions within the length limit for long bases", () => {
    const base = "a".repeat(32);
    for (const s of subdomainCandidates(base)) {
      expect(s.length).toBeLessThanOrEqual(32);
      expect(validateSubdomain(s), s).toBeNull();
    }
  });

  it("never suggests reserved words", () => {
    for (const s of subdomainCandidates("shop")) expect(validateSubdomain(s), s).toBeNull();
  });

  it("returns an empty list for an unusable base", () => {
    expect(subdomainCandidates("")).toEqual([]);
    expect(subdomainCandidates("--")).toEqual([]);
  });
});

describe("createStoreInputSchema", () => {
  it("normalizes the subdomain and trims the name", () => {
    const parsed = createStoreInputSchema.parse({ name: "  متجري الجديد ", subdomain: " My-Store " });
    expect(parsed).toEqual({ name: "متجري الجديد", subdomain: "my-store" });
  });

  it("rejects too-short names", () => {
    expect(createStoreInputSchema.safeParse({ name: "a", subdomain: "abc" }).success).toBe(false);
  });
});

describe("storeGeneralSettingsSchema", () => {
  it("accepts a partial update", () => {
    expect(storeGeneralSettingsSchema.safeParse({ description: "Hi" }).success).toBe(true);
  });

  it("rejects unknown keys (no mass assignment of seller_id, status, …)", () => {
    expect(storeGeneralSettingsSchema.safeParse({ sellerId: "x" }).success).toBe(false);
    expect(storeGeneralSettingsSchema.safeParse({ status: "active" }).success).toBe(false);
  });

  it("requires the default locale to be supported", () => {
    expect(
      storeGeneralSettingsSchema.safeParse({ defaultLocale: "en", supportedLocales: ["ar"] }).success,
    ).toBe(false);
    expect(
      storeGeneralSettingsSchema.safeParse({ defaultLocale: "en", supportedLocales: ["ar", "en"] }).success,
    ).toBe(true);
  });

  it("validates contact details", () => {
    expect(storeGeneralSettingsSchema.safeParse({ contact: { email: "nope" } }).success).toBe(false);
    expect(
      storeGeneralSettingsSchema.safeParse({ contact: { email: "a@b.co", phone: "01012345678" } }).success,
    ).toBe(true);
  });

  it("only accepts http(s) image URLs", () => {
    expect(storeGeneralSettingsSchema.safeParse({ logoUrl: "javascript:alert(1)" }).success).toBe(false);
    expect(storeGeneralSettingsSchema.safeParse({ logoUrl: "https://cdn.example/logo.png" }).success).toBe(true);
    expect(storeGeneralSettingsSchema.safeParse({ logoUrl: null }).success).toBe(true);
  });
});

describe("storePoliciesSchema", () => {
  it("accepts the four policies as optional text", async () => {
    const { storePoliciesSchema } = await import("./stores.lib");
    expect(storePoliciesSchema.parse({ return: " 14 days ", shipping: "", privacy: undefined })).toEqual({
      return: "14 days",
      shipping: "",
    });
  });

  it("rejects unknown keys and overlong text", async () => {
    const { storePoliciesSchema } = await import("./stores.lib");
    expect(storePoliciesSchema.safeParse({ refunds: "x" }).success).toBe(false);
    expect(storePoliciesSchema.safeParse({ terms: "x".repeat(20_001) }).success).toBe(false);
  });
});

describe("catalog mode", () => {
  it("cannot be set through general settings yet (no picker / storefront filter)", () => {
    expect(storeGeneralSettingsSchema.safeParse({ catalogMode: "selected" }).success).toBe(false);
  });
});
