import { describe, expect, it } from "vitest";
import { requestOrigin } from "./request-origin.lib";

const req = (url: string, headers: Record<string, string> = {}) => ({ url, headers: new Headers(headers) });

describe("requestOrigin", () => {
  it("uses the proxy's host, not the server's bind address (self-hosted)", () => {
    const r = req("https://0.0.0.0:3000/api/auth/callback?code=x", {
      host: "dashboard-hz.tallaby.com",
      "x-forwarded-host": "dashboard-hz.tallaby.com",
      "x-forwarded-proto": "https",
    });
    expect(requestOrigin(r)).toBe("https://dashboard-hz.tallaby.com");
  });

  it("is unchanged on Vercel, where request.url already carries the real host", () => {
    const r = req("https://dashboard.tallaby.com/api/auth/callback", {
      host: "dashboard.tallaby.com",
      "x-forwarded-host": "dashboard.tallaby.com",
      "x-forwarded-proto": "https",
    });
    expect(requestOrigin(r)).toBe(new URL(r.url).origin);
  });

  it("takes the first comma entry of the forwarded headers, trimmed", () => {
    const r = req("http://0.0.0.0:3000/", {
      "x-forwarded-host": " shop.example.com , internal:3000",
      "x-forwarded-proto": "https, http",
      host: "internal:3000",
    });
    expect(requestOrigin(r)).toBe("https://shop.example.com");
  });

  it("falls back to the host header, defaulting to https for a public host", () => {
    expect(requestOrigin(req("http://0.0.0.0:3000/", { host: "Faster-EG.com" }))).toBe("https://faster-eg.com");
    expect(requestOrigin(req("http://0.0.0.0:3000/", { host: "shop.example.com:443" }))).toBe("https://shop.example.com");
    expect(requestOrigin(req("http://0.0.0.0:3000/", { host: "shop.example.com:8443" }))).toBe("https://shop.example.com:8443");
  });

  it("keeps the URL's protocol on localhost and IP literals (local dev over http)", () => {
    expect(requestOrigin(req("http://localhost:3000/x", { host: "localhost:3000" }))).toBe("http://localhost:3000");
    expect(requestOrigin(req("http://faster.localhost:3002/x", { host: "faster.localhost:3002" }))).toBe("http://faster.localhost:3002");
    expect(requestOrigin(req("http://192.168.1.5:3000/x", { host: "192.168.1.5:3000" }))).toBe("http://192.168.1.5:3000");
    expect(requestOrigin(req("http://[::1]:3000/x", { host: "[::1]:3000" }))).toBe("http://[::1]:3000");
  });

  it("uses an explicit x-forwarded-proto of http", () => {
    expect(requestOrigin(req("https://0.0.0.0:3000/", { host: "a.example.com", "x-forwarded-proto": "http" }))).toBe(
      "http://a.example.com",
    );
  });

  it("ignores an unknown x-forwarded-proto", () => {
    expect(requestOrigin(req("http://0.0.0.0:3000/", { host: "a.example.com", "x-forwarded-proto": "javascript" }))).toBe(
      "https://a.example.com",
    );
  });

  it("falls back to request.url's origin for a spoofed or malformed host", () => {
    const url = "https://dashboard.tallaby.com/api/auth/callback";
    for (const bad of [
      "evil.com/path",
      "user@evil.com",
      "evil.com evil.org",
      "evil.com\\x",
      "evil.com:99999",
      "evil.com:",
      "-evil.com",
      "evil..com",
      "https://evil.com",
    ]) {
      expect(requestOrigin(req(url, { "x-forwarded-host": bad, host: "dashboard.tallaby.com" })), bad).toBe(
        "https://dashboard.tallaby.com",
      );
    }
    expect(requestOrigin(req(url, { host: "evil.com/x" }))).toBe("https://dashboard.tallaby.com");
  });

  it("uses request.url's origin when no host header is sent", () => {
    expect(requestOrigin(req("https://dashboard.tallaby.com/x"))).toBe("https://dashboard.tallaby.com");
  });
});
