import { afterEach, describe, expect, it, vi } from "vitest";
import { cookieDomainForHost } from "./cookie-domain.lib";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("cookieDomainForHost", () => {
  it("returns undefined in development", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("NEXT_PUBLIC_ROOT_DOMAIN", "tallaby.com");
    expect(cookieDomainForHost("tallaby.com")).toBeUndefined();
  });

  it("shares the root domain on platform hosts", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_ROOT_DOMAIN", "tallaby.com");
    expect(cookieDomainForHost("tallaby.com")).toBe(".tallaby.com");
    expect(cookieDomainForHost("glow.tallaby.com")).toBe(".tallaby.com");
  });

  it("uses host-only cookies on a custom domain", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_ROOT_DOMAIN", "tallaby.com");
    expect(cookieDomainForHost("faster-eg.com")).toBeUndefined();
  });

  it("returns undefined when the root domain is not set", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_ROOT_DOMAIN", "");
    expect(cookieDomainForHost("tallaby.com")).toBeUndefined();
  });
});
