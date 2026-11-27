import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  DIGITAL_DOWNLOAD_HEADERS,
  DIGITAL_LINK_MAX_DOWNLOADS,
  DIGITAL_LINK_TTL_DAYS,
  DIGITAL_SIGNED_URL_TTL_SECONDS,
  digitalDeliveryReferenceId,
  digitalDownloadUrl,
  digitalLinkExpiresAt,
  isDigitalLinkUsable,
  isDownloadTokenShape,
} from "./access.lib";
import { generateDownloadToken } from "./token.lib";

beforeEach(() => vi.stubEnv("NEXT_PUBLIC_ROOT_DOMAIN", "tallaby.com"));
afterEach(() => vi.unstubAllEnvs());

describe("digital link rules (F-108c)", () => {
  it("is one download, 7 days, 15-minute storage links", () => {
    expect(DIGITAL_LINK_MAX_DOWNLOADS).toBe(1);
    expect(DIGITAL_LINK_TTL_DAYS).toBe(7);
    expect(DIGITAL_SIGNED_URL_TTL_SECONDS).toBe(900);
    const now = new Date("2026-11-27T10:00:00.000Z");
    expect(digitalLinkExpiresAt(now)).toBe("2026-12-04T10:00:00.000Z");
  });

  it("builds the account-host link, with the language when given", () => {
    const token = "ab".repeat(32);
    expect(digitalDownloadUrl(token)).toBe(`https://account.tallaby.com/d/${token}`);
    expect(digitalDownloadUrl(token, { lang: "en" })).toBe(`https://account.tallaby.com/d/${token}?lang=en`);
  });

  it("accepts only 64 hex tokens", () => {
    expect(isDownloadTokenShape(generateDownloadToken())).toBe(true);
    for (const bad of ["", "abc", "g".repeat(64), "A".repeat(64), `${"a".repeat(64)}/`, null, undefined]) {
      expect(isDownloadTokenShape(bad)).toBe(false);
    }
  });

  it("knows a usable link: delivered or downloaded, under the limit, not expired", () => {
    const now = new Date("2026-11-27T10:00:00Z");
    const base = { fulfillmentStatus: "delivered", downloadCount: 0, maxDownloads: 1, expiresAt: "2026-12-01T00:00:00Z" };
    expect(isDigitalLinkUsable(base, now)).toBe(true);
    expect(isDigitalLinkUsable({ ...base, downloadCount: 1 }, now)).toBe(false);
    expect(isDigitalLinkUsable({ ...base, expiresAt: "2026-11-27T10:00:00Z" }, now)).toBe(false);
    expect(isDigitalLinkUsable({ ...base, expiresAt: null }, now)).toBe(true);
    for (const status of ["pending", "expired", "revoked", "failed"]) {
      expect(isDigitalLinkUsable({ ...base, fulfillmentStatus: status }, now)).toBe(false);
    }
    // Rows made before F-108c: a 0 or missing limit means no limit.
    expect(isDigitalLinkUsable({ ...base, fulfillmentStatus: "downloaded", downloadCount: 9, maxDownloads: 0 }, now)).toBe(true);
    expect(isDigitalLinkUsable({ ...base, downloadCount: null, maxDownloads: null }, now)).toBe(true);
  });

  it("sends noindex, no-store and no-referrer", () => {
    expect(DIGITAL_DOWNLOAD_HEADERS).toEqual({
      "X-Robots-Tag": "noindex, nofollow, noarchive",
      "Cache-Control": "no-store, max-age=0",
      "Referrer-Policy": "no-referrer",
    });
    expect(Object.isFrozen(DIGITAL_DOWNLOAD_HEADERS)).toBe(true);
  });

  it("derives one email reference per set of links, in any order", () => {
    const a = "a".repeat(64);
    const b = "b".repeat(64);
    const ref = digitalDeliveryReferenceId([a, b]);
    expect(ref).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    expect(digitalDeliveryReferenceId([b, a])).toBe(ref);
    expect(digitalDeliveryReferenceId([a])).not.toBe(ref);
    expect(() => digitalDeliveryReferenceId([])).toThrow();
  });
});
