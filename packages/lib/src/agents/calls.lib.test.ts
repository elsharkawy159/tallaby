import { describe, expect, it } from "vitest";
import { isIdempotencyKey, rateRetryAfter, rateWindowStart, summarizeArgs } from "./calls.lib";
import { sniffImage } from "./safe-fetch.server";

describe("rate windows", () => {
  it("snaps to fixed windows and counts the seconds left", () => {
    const now = new Date("2026-11-01T10:15:42.500Z");
    expect(rateWindowStart(now, 60).toISOString()).toBe("2026-11-01T10:15:00.000Z");
    expect(rateWindowStart(now, 86400).toISOString()).toBe("2026-11-01T00:00:00.000Z");
    expect(rateRetryAfter(now, 60)).toBe(18);
  });
});

describe("summarizeArgs", () => {
  it("cuts long values and drops secrets and the idempotency key", () => {
    const summary = summarizeArgs({
      storeId: "s",
      title: { en: "x".repeat(200), ar: "كوب" },
      images: ["a", "b", "c", "d", "e", "f", "g"],
      accessToken: "tby_at_secret",
      apiKey: "k",
      idempotencyKey: "abc",
    });
    expect(summary).not.toHaveProperty("accessToken");
    expect(summary).not.toHaveProperty("apiKey");
    expect(summary).not.toHaveProperty("idempotencyKey");
    expect((summary.title as { en: string }).en).toHaveLength(81);
    expect(summary.images).toEqual(["a", "b", "c", "d", "e", "+2 more"]);
  });
});

describe("isIdempotencyKey", () => {
  it("accepts short visible ASCII only", () => {
    expect(isIdempotencyKey("create-mug-1")).toBe(true);
    expect(isIdempotencyKey("")).toBe(false);
    expect(isIdempotencyKey("has space")).toBe(false);
    expect(isIdempotencyKey("x".repeat(201))).toBe(false);
  });
});

describe("sniffImage", () => {
  it("recognizes JPEG, PNG and WebP and nothing else", () => {
    expect(sniffImage(new Uint8Array([0xff, 0xd8, 0xff, 0xe0]))?.mime).toBe("image/jpeg");
    expect(sniffImage(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))?.ext).toBe("png");
    const webp = new TextEncoder().encode("RIFF\0\0\0\0WEBPVP8 ");
    expect(sniffImage(webp)?.mime).toBe("image/webp");
    expect(sniffImage(new TextEncoder().encode("<svg xmlns="))).toBeNull();
    expect(sniffImage(new TextEncoder().encode("<html>"))).toBeNull();
  });
});
