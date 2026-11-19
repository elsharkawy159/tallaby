import { afterEach, describe, expect, it, vi } from "vitest";
import { accountOrigin, templatePreviewOrigin } from "@workspace/lib/storefront/platform-hosts";
import { platformOrigin, platformRedirects } from "../platform-redirects.mjs";
import { redirects } from "../redirects.mjs";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("platformOrigin (next.config.mjs copy of platform-hosts.lib)", () => {
  it.each(["tallaby.com", "https://www.tallaby.com/", "localhost:3000", ""])("matches the shared helper for root %j", (root) => {
    vi.stubEnv("NEXT_PUBLIC_ROOT_DOMAIN", root);
    expect(platformOrigin("account")).toBe(accountOrigin());
    expect(platformOrigin("preview")).toBe(templatePreviewOrigin());
  });
});

describe("platformRedirects", () => {
  const rows = platformRedirects("tallaby.com");
  const target = (source: string) => rows.find((row) => row.source === source)?.destination;

  it("sends every account page, with /en and sub-paths, to account.<root>", () => {
    for (const page of ["auth", "cart", "orders", "profile", "returns", "shipping", "payment", "cookies"]) {
      expect(target(`/${page}`)).toBe(`https://account.tallaby.com/${page}`);
      expect(target(`/${page}/:path*`)).toBe(`https://account.tallaby.com/${page}/:path*`);
      expect(target(`/en/${page}`)).toBe(`https://account.tallaby.com/en/${page}`);
      expect(target(`/en/${page}/:path*`)).toBe(`https://account.tallaby.com/en/${page}/:path*`);
    }
  });

  it("sends the template preview and the dev library to preview.<root>", () => {
    expect(target("/template-preview/:path*")).toBe("https://preview.tallaby.com/template-preview/:path*");
    expect(target("/en/template-preview/:path*")).toBe("https://preview.tallaby.com/en/template-preview/:path*");
    expect(target("/dev-library")).toBe("https://preview.tallaby.com/dev-library");
    expect(target("/en/dev-library/:path*")).toBe("https://preview.tallaby.com/en/dev-library/:path*");
  });

  it("is permanent, never touches this app's own routes and never overlaps redirects.mjs", () => {
    expect(rows).toHaveLength(40);
    expect(rows.every((row) => row.permanent === true)).toBe(true);
    const sources = rows.map((row) => row.source);
    for (const own of ["/api/auth/signup-callback", "/templates", "/template-previews/:path*", "/pricing", "/"]) {
      expect(sources).not.toContain(own);
    }
    expect(sources.some((source) => source.startsWith("/api") || source.startsWith("/template-previews"))).toBe(false);
    const existing = new Set(redirects.map((row: { source: string }) => row.source));
    expect(sources.filter((source) => existing.has(source))).toEqual([]);
  });

  it("uses http *.localhost in development", () => {
    expect(platformRedirects("localhost:3000")[0]).toEqual({ source: "/auth", destination: "http://account.localhost:3000/auth", permanent: true });
  });
});
