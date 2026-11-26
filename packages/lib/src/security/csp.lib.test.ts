import { describe, expect, it } from "vitest";
import {
  applyCsp,
  buildReportOnlyCsp,
  builderCsp,
  cspOriginOf,
  CSP_HEADER,
  CSP_REPORT_ONLY_HEADER,
  ENFORCED_CSP,
  isCspOrigin,
  isStoreEditorPath,
  storefrontCsp,
} from "./csp.lib";

const STOREFRONT_REPORT_ONLY =
  "object-src 'none'; base-uri 'self'; " +
  "form-action 'self' https://accept.paymob.com https://payments.kashier.io https://www.easykash.net; " +
  "frame-src 'self' https://www.youtube-nocookie.com https://player.vimeo.com https://www.tiktok.com https://www.instagram.com https://www.facebook.com " +
  "https://accept.paymob.com https://payments.kashier.io https://www.easykash.net " +
  "https://www.googletagmanager.com https://td.doubleclick.net https://tr.snapchat.com";

describe("storefrontCsp", () => {
  it("enforces only object-src and base-uri", () => {
    expect(storefrontCsp().enforced).toBe("object-src 'none'; base-uri 'self'");
    expect(ENFORCED_CSP).toBe("object-src 'none'; base-uri 'self'");
  });

  it("builds the exact report-only policy", () => {
    expect(storefrontCsp().reportOnly).toBe(STOREFRONT_REPORT_ONLY);
  });

  it("adds valid extra frame origins once, and drops anything that is not an https origin", () => {
    const policy = storefrontCsp([
      "https://abc.supabase.co",
      "https://abc.supabase.co",
      "https://www.youtube-nocookie.com",
      "http://insecure.example",
      "https://x.com; script-src *",
      "'unsafe-inline'",
      "*",
    ]).reportOnly;
    expect(policy).toBe(`${STOREFRONT_REPORT_ONLY} https://abc.supabase.co`);
  });

  it("never sets script-src, default-src or a report endpoint", () => {
    for (const value of [storefrontCsp().enforced, storefrontCsp().reportOnly, builderCsp().enforced, builderCsp().reportOnly]) {
      expect(value).not.toMatch(/script-src|default-src|report-uri|report-to/);
    }
  });
});

describe("builderCsp", () => {
  it("frames self and the video players only, with no form-action", () => {
    expect(builderCsp()).toEqual({
      enforced: "object-src 'none'; base-uri 'self'",
      reportOnly:
        "object-src 'none'; base-uri 'self'; frame-src 'self' https://www.youtube-nocookie.com https://player.vimeo.com https://www.tiktok.com https://www.instagram.com https://www.facebook.com",
    });
  });
});

describe("buildReportOnlyCsp", () => {
  it("leaves out directives that are not given", () => {
    expect(buildReportOnlyCsp({})).toBe("object-src 'none'; base-uri 'self'");
    expect(buildReportOnlyCsp({ formAction: [] })).toBe("object-src 'none'; base-uri 'self'; form-action 'self'");
  });
});

describe("origins", () => {
  it("accepts https origins only", () => {
    expect(isCspOrigin("https://a.b.co")).toBe(true);
    expect(isCspOrigin("https://localhost:3000")).toBe(true);
    expect(isCspOrigin("https://a.b.co/")).toBe(false);
    expect(isCspOrigin("https://A.co")).toBe(false);
    expect(isCspOrigin("https://a.co x")).toBe(false);
  });

  it("reduces a URL to its https origin", () => {
    expect(cspOriginOf("https://abc.supabase.co/storage/v1")).toBe("https://abc.supabase.co");
    expect(cspOriginOf("http://abc.supabase.co")).toBeNull();
    expect(cspOriginOf("not a url")).toBeNull();
    expect(cspOriginOf(undefined)).toBeNull();
  });
});

describe("isStoreEditorPath", () => {
  it("matches the builder page in both locales only", () => {
    expect(isStoreEditorPath("/stores/abc/editor")).toBe(true);
    expect(isStoreEditorPath("/en/stores/abc/editor")).toBe(true);
    expect(isStoreEditorPath("/ar/stores/abc/editor/")).toBe(true);
    expect(isStoreEditorPath("/stores/abc/editor/x")).toBe(false);
    expect(isStoreEditorPath("/stores/abc/website")).toBe(false);
    expect(isStoreEditorPath("/fr/stores/abc/editor")).toBe(false);
  });
});

describe("applyCsp", () => {
  it("sets both headers", () => {
    const headers = new Headers();
    applyCsp(headers, builderCsp());
    expect(headers.get(CSP_HEADER)).toBe(ENFORCED_CSP);
    expect(headers.get(CSP_REPORT_ONLY_HEADER)).toBe(builderCsp().reportOnly);
  });

  it("never overrides a policy already on the response", () => {
    const headers = new Headers({ [CSP_HEADER]: "default-src 'self'", [CSP_REPORT_ONLY_HEADER]: "img-src 'self'" });
    applyCsp(headers, storefrontCsp());
    expect(headers.get(CSP_HEADER)).toBe("default-src 'self'");
    expect(headers.get(CSP_REPORT_ONLY_HEADER)).toBe("img-src 'self'");
  });
});
