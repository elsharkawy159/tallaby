import { describe, expect, it } from "vitest";
import { DEFAULT_STORE_SEO } from "@workspace/lib/stores";
import { buildStoreMetadata, storeSeoFallback, type StoreMetadataInput } from "./store-seo.lib";

const store = (seo: Partial<StoreMetadataInput["seo"]>): StoreMetadataInput => ({
  displayName: "Shop",
  subdomain: "shop",
  customDomain: "shop.com",
  description: null,
  logoUrl: null,
  bannerUrl: null,
  seo: { ...DEFAULT_STORE_SEO, ...seo },
});

describe("buildStoreMetadata verification", () => {
  it("renders Meta's facebook-domain-verification tag", () => {
    const meta = buildStoreMetadata(store({ facebookDomainVerification: "abc123def456" }), "ar", { indexable: true });
    expect(meta.verification).toEqual({ other: { "facebook-domain-verification": "abc123def456" } });
  });

  it("renders Google and Meta together", () => {
    const meta = buildStoreMetadata(
      store({ googleSiteVerification: "google-token_1", facebookDomainVerification: "abc123def456" }),
      "ar",
      { indexable: true },
    );
    expect(meta.verification).toEqual({
      google: "google-token_1",
      other: { "facebook-domain-verification": "abc123def456" },
    });
  });

  it("renders nothing for a missing or bad token", () => {
    expect(buildStoreMetadata(store({}), "ar", { indexable: true }).verification).toBeUndefined();
    const bad = buildStoreMetadata(store({ facebookDomainVerification: '"><script>' }), "ar", { indexable: true });
    expect(bad.verification).toBeUndefined();
  });
});

describe("storeSeoFallback", () => {
  it("uses the category label in both languages", () => {
    expect(storeSeoFallback("Shop", "Fashion", "en").title).toBe("Buy Fashion from Shop now | Tallaby");
    expect(storeSeoFallback("شوب", "أزياء", "ar").title).toBe("اشتري أزياء من شوب الآن | طلبي");
    expect(storeSeoFallback("Shop", "Fashion", "en").description).toContain("Fashion from Shop");
    expect(storeSeoFallback("شوب", "أزياء", "ar").description).toContain("أزياء من شوب");
  });

  it("has a sensible phrase without a category", () => {
    for (const category of [null, undefined, "  "]) {
      expect(storeSeoFallback("Shop", category, "en").title).toBe("Shop from Shop now | Tallaby");
      expect(storeSeoFallback("شوب", category, "ar").title).toBe("تسوّق من شوب الآن | طلبي");
    }
    expect(storeSeoFallback("Shop", null, "en").description).toContain("Shop's products");
    expect(storeSeoFallback("شوب", null, "ar").description).toContain("منتجات شوب");
  });
});

describe("buildStoreMetadata title and description", () => {
  const title = (meta: ReturnType<typeof buildStoreMetadata>) => meta.title as { default: string; template: string };

  it("falls back when the seller wrote nothing, and the store name appears once", () => {
    const meta = buildStoreMetadata(store({}), "en", { indexable: true, category: "Fashion" });
    expect(title(meta).default).toBe("Buy Fashion from Shop now | Tallaby");
    // Next.js runs the template over child pages' titles only, never over the default.
    expect(title(meta).template).toBe("%s | Shop");
    expect(meta.description).toBe("Browse Fashion from Shop and order online in a few simple steps.");
    expect(meta.openGraph?.title).toBe("Buy Fashion from Shop now | Tallaby");
  });

  it("uses the Arabic wording on the Arabic site", () => {
    const meta = buildStoreMetadata(store({}), "ar", { indexable: true, category: "أزياء" });
    expect(title(meta).default).toBe("اشتري أزياء من Shop الآن | طلبي");
  });

  it("the seller's own text always wins", () => {
    const written = buildStoreMetadata(store({ description: "My words", titleTemplate: "%s - Mine" }), "en", { indexable: true, category: "Fashion" });
    expect(written.description).toBe("My words");
    expect(title(written)).toEqual({ default: "Shop", template: "%s - Mine" });
    const bio = buildStoreMetadata({ ...store({}), description: "About us" }, "en", { indexable: true });
    expect(bio.description).toBe("About us");
    const storeBio = buildStoreMetadata({ ...store({}), storeDescription: "Store text" }, "en", { indexable: true });
    expect(storeBio.description).toBe("Store text");
  });
});
