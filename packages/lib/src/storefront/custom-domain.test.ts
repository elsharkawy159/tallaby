import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  hostnameOf,
  isMarketplaceHost,
  isPlatformHost,
  normalizeCustomDomain,
  storeHostname,
  storeSubdomainFromHost,
  storeUrl,
  subdomainFromName,
  validateCustomDomain,
} from "./index";

const ROOT = process.env.NEXT_PUBLIC_ROOT_DOMAIN;

beforeEach(() => {
  process.env.NEXT_PUBLIC_ROOT_DOMAIN = "tallaby.com";
});
afterEach(() => {
  process.env.NEXT_PUBLIC_ROOT_DOMAIN = ROOT;
});

describe("normalizeCustomDomain", () => {
  it.each([
    ["faster-eg.com", "faster-eg.com"],
    ["  Faster-EG.COM ", "faster-eg.com"],
    ["https://www.faster-eg.com/shop?x=1", "faster-eg.com"],
    ["http://faster-eg.com:8080", "faster-eg.com"],
    ["www.shop.faster-eg.com.", "shop.faster-eg.com"],
  ])("%s → %s", (input, expected) => {
    expect(normalizeCustomDomain(input)).toBe(expected);
  });
});

describe("validateCustomDomain", () => {
  it.each(["faster-eg.com", "shop.faster-eg.com", "faster.com.eg", "xn--mgbh0fb.xn--wgbh1c"])(
    "accepts %s",
    (domain) => expect(validateCustomDomain(domain)).toBeNull(),
  );

  it.each(["", "faster", "-faster.com", "faster-.com", "fas ter.com", "faster..com", "faster.c"])(
    "rejects malformed %j",
    (domain) => expect(validateCustomDomain(domain)).toBe("invalid"),
  );

  it.each(["tallaby.com", "faster.tallaby.com", "my-app.vercel.app"])(
    "rejects platform domain %s",
    (domain) => expect(validateCustomDomain(domain)).toBe("platform"),
  );
});

describe("isPlatformHost", () => {
  it.each([
    "tallaby.com",
    "www.tallaby.com",
    "faster.tallaby.com:443",
    "localhost:3000",
    "faster.localhost:3000",
    "tallaby-git-main.vercel.app",
    "127.0.0.1:3000",
    null,
  ])("%s is Tallaby's", (host) => expect(isPlatformHost(host)).toBe(true));

  it.each(["faster-eg.com", "www.faster-eg.com", "tallaby.com.evil.com", "nottallaby.com"])(
    "%s is a custom domain",
    (host) => expect(isPlatformHost(host)).toBe(false),
  );
});

describe("isMarketplaceHost", () => {
  it.each(["tallaby.com", "www.tallaby.com", "localhost:3000", "tallaby-git-main.vercel.app", null])(
    "%s is the marketplace",
    (host) => expect(isMarketplaceHost(host)).toBe(true),
  );

  it.each(["faster.tallaby.com", "faster.localhost:3000", "faster-eg.com"])("%s is a storefront", (host) =>
    expect(isMarketplaceHost(host)).toBe(false),
  );
});

describe("store URLs", () => {
  it("uses the subdomain without a custom domain", () => {
    expect(storeUrl("faster")).toBe("https://faster.tallaby.com");
    expect(storeHostname("faster", null)).toBe("faster.tallaby.com");
  });

  it("prefers the custom domain once live", () => {
    expect(storeUrl("faster", "faster-eg.com")).toBe("https://faster-eg.com");
    expect(storeHostname("faster", "faster-eg.com")).toBe("faster-eg.com");
  });

  it("custom domains are not mistaken for store subdomains", () => {
    expect(storeSubdomainFromHost("faster-eg.com")).toBeNull();
    expect(hostnameOf("Faster-EG.com:443")).toBe("faster-eg.com");
  });
});

describe("subdomainFromName", () => {
  it("slugifies Latin names", () => {
    expect(subdomainFromName("Faster Store!")).toBe("faster-store");
    expect(subdomainFromName("  Ça va -- Shop  ")).toBe("ca-va-shop");
  });

  it("transliterates Arabic names and digits", () => {
    expect(subdomainFromName("متجر فاستر")).toBe("mtgr-fastr");
    expect(subdomainFromName("مَحَلّ ٢٤")).toBe("mhl-24");
  });

  it("caps the length without a trailing hyphen", () => {
    const out = subdomainFromName("a".repeat(31) + " b");
    expect(out).toBe("a".repeat(31));
    expect(subdomainFromName("!!!")).toBe("");
  });
});
