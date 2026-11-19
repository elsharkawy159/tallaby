import { afterEach, describe, expect, it, vi } from "vitest";
import {
  accountOrigin,
  isAccountHost,
  isTemplatePreviewHost,
  templatePreviewOrigin,
} from "./platform-hosts.lib";
import { isMarketplaceHost, isPlatformHost, storeSubdomainFromHost } from "./index";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("platform host origins", () => {
  it("uses https subdomains of the production root", () => {
    vi.stubEnv("NEXT_PUBLIC_ROOT_DOMAIN", "tallaby.com");
    expect(accountOrigin()).toBe("https://account.tallaby.com");
    expect(templatePreviewOrigin()).toBe("https://preview.tallaby.com");
  });

  it("normalizes a root written as a URL or with www", () => {
    vi.stubEnv("NEXT_PUBLIC_ROOT_DOMAIN", "https://www.tallaby.com/");
    expect(accountOrigin()).toBe("https://account.tallaby.com");
  });

  it("uses http *.localhost with the port in development", () => {
    vi.stubEnv("NEXT_PUBLIC_ROOT_DOMAIN", "localhost:3000");
    expect(accountOrigin()).toBe("http://account.localhost:3000");
    expect(templatePreviewOrigin()).toBe("http://preview.localhost:3000");
  });

  it("falls back to tallaby.com when the root is not set", () => {
    vi.stubEnv("NEXT_PUBLIC_ROOT_DOMAIN", "");
    expect(accountOrigin()).toBe("https://account.tallaby.com");
    expect(templatePreviewOrigin()).toBe("https://preview.tallaby.com");
  });
});

describe("platform host checks", () => {
  it("matches only the exact subdomain of the root", () => {
    vi.stubEnv("NEXT_PUBLIC_ROOT_DOMAIN", "tallaby.com");
    expect(isAccountHost("account.tallaby.com")).toBe(true);
    expect(isAccountHost("Account.Tallaby.com:443")).toBe(true);
    expect(isTemplatePreviewHost("preview.tallaby.com")).toBe(true);
    for (const host of ["tallaby.com", "www.tallaby.com", "glow.tallaby.com", "preview.tallaby.com", "account.faster-eg.com", "x.account.tallaby.com", "", null, undefined]) {
      expect(isAccountHost(host)).toBe(false);
    }
    expect(isTemplatePreviewHost("account.tallaby.com")).toBe(false);
    expect(isTemplatePreviewHost("preview.localhost:3000")).toBe(false);
  });

  it("matches *.localhost in development", () => {
    vi.stubEnv("NEXT_PUBLIC_ROOT_DOMAIN", "localhost:3000");
    expect(isAccountHost("account.localhost:3000")).toBe(true);
    expect(isTemplatePreviewHost("preview.localhost:3000")).toBe(true);
    expect(isAccountHost("localhost:3000")).toBe(false);
  });

  it("are platform hosts and never a store", () => {
    vi.stubEnv("NEXT_PUBLIC_ROOT_DOMAIN", "tallaby.com");
    for (const host of ["account.tallaby.com", "preview.tallaby.com"]) {
      expect(storeSubdomainFromHost(host)).toBeNull();
      expect(isPlatformHost(host)).toBe(true);
      expect(isMarketplaceHost(host)).toBe(true);
    }
  });
});
