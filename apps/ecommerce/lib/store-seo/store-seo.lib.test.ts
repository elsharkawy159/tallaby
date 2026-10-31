import { describe, expect, it } from "vitest";
import { DEFAULT_STORE_SEO } from "@workspace/lib/stores";
import { buildStoreMetadata, type StoreMetadataInput } from "./store-seo.lib";

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
