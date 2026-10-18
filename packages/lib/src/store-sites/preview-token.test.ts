import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  STORE_PREVIEW_MAX_TTL_SECONDS,
  signStorePreviewToken,
  storeDraftKey,
  storePreviewSecret,
  verifyStorePreviewToken,
} from "./preview-token";

const SECRET = "s".repeat(40);
const OTHER_SECRET = "o".repeat(40);
const A1 = "11111111-1111-4111-8111-111111111111";
const A2 = "22222222-2222-4222-8222-222222222222";
const KEY = storeDraftKey({ pages: [{ id: "p1", content: { sections: [] } }] });
const NOW = Date.UTC(2026, 9, 18, 12, 0, 0);

const sign = (overrides: Partial<Parameters<typeof signStorePreviewToken>[0]> = {}) =>
  signStorePreviewToken({ storeId: A1, draftKey: KEY, secret: SECRET, now: NOW, ...overrides }).token;

describe("storePreviewSecret", () => {
  it("is null (feature off) when unset, blank or too short", () => {
    expect(storePreviewSecret({})).toBeNull();
    expect(storePreviewSecret({ STORE_PREVIEW_SECRET: "   " })).toBeNull();
    expect(storePreviewSecret({ STORE_PREVIEW_SECRET: "short-secret" })).toBeNull();
    expect(storePreviewSecret({ STORE_PREVIEW_SECRET: SECRET })).toBe(SECRET);
  });
});

describe("storeDraftKey", () => {
  it("ignores key order and undefined fields, changes with content", () => {
    expect(storeDraftKey({ a: 1, b: { c: 2, d: undefined } })).toBe(storeDraftKey({ b: { c: 2 }, a: 1 }));
    expect(storeDraftKey({ a: 1 })).not.toBe(storeDraftKey({ a: 2 }));
    expect(storeDraftKey([1, 2])).not.toBe(storeDraftKey([2, 1]));
    expect(KEY).toMatch(/^[0-9a-f]{32}$/);
  });
});

describe("store preview tokens", () => {
  it("round-trips for the store it was issued for", () => {
    const result = verifyStorePreviewToken(sign(), { secret: SECRET, storeId: A1, now: NOW + 60_000 });
    expect(result).toEqual({
      ok: true,
      storeId: A1,
      draftKey: KEY,
      expiresAt: NOW / 1000 + STORE_PREVIEW_MAX_TTL_SECONDS,
    });
  });

  it("never renders on another store's host (isolation test 8)", () => {
    expect(verifyStorePreviewToken(sign(), { secret: SECRET, storeId: A2, now: NOW })).toEqual({
      ok: false,
      reason: "wrong_store",
    });
  });

  it("expires after at most 15 minutes, even if a longer TTL is asked for", () => {
    const token = sign({ ttlSeconds: 3600 });
    const atMax = NOW + STORE_PREVIEW_MAX_TTL_SECONDS * 1000;
    expect(verifyStorePreviewToken(token, { secret: SECRET, storeId: A1, now: atMax - 1000 }).ok).toBe(true);
    expect(verifyStorePreviewToken(token, { secret: SECRET, storeId: A1, now: atMax })).toEqual({
      ok: false,
      reason: "expired",
    });
    const short = sign({ ttlSeconds: 60 });
    expect(verifyStorePreviewToken(short, { secret: SECRET, storeId: A1, now: NOW + 61_000 }).ok).toBe(false);
  });

  it("rejects tampered payloads and signatures", () => {
    const token = sign();
    const [body, signature] = token.split(".") as [string, string];
    const payload = JSON.parse(Buffer.from(body, "base64url").toString());
    const forged = Buffer.from(JSON.stringify({ ...payload, s: A2 })).toString("base64url");
    expect(verifyStorePreviewToken(`${forged}.${signature}`, { secret: SECRET, storeId: A2, now: NOW })).toEqual({
      ok: false,
      reason: "signature",
    });
    const flipped = `${signature.slice(0, -2)}${signature.endsWith("AA") ? "BB" : "AA"}`;
    expect(verifyStorePreviewToken(`${body}.${flipped}`, { secret: SECRET, storeId: A1, now: NOW }).ok).toBe(false);
    expect(verifyStorePreviewToken(`${body}.`, { secret: SECRET, storeId: A1, now: NOW }).ok).toBe(false);
  });

  it("rejects tokens signed with another secret", () => {
    expect(verifyStorePreviewToken(sign({ secret: OTHER_SECRET }), { secret: SECRET, storeId: A1, now: NOW })).toEqual({
      ok: false,
      reason: "signature",
    });
  });

  it("rejects a token claiming a life over the maximum even with a valid signature", () => {
    const body = Buffer.from(JSON.stringify({ v: 1, s: A1, d: KEY, e: NOW / 1000 + 3600 })).toString("base64url");
    const signature = createHmac("sha256", SECRET).update(body).digest("base64url");
    expect(verifyStorePreviewToken(`${body}.${signature}`, { secret: SECRET, storeId: A1, now: NOW })).toEqual({
      ok: false,
      reason: "expired",
    });
  });

  it("rejects garbage input without throwing", () => {
    for (const value of [undefined, null, 42, "", "abc", "a.b.c", "x".repeat(600), "%%%.%%%"]) {
      expect(verifyStorePreviewToken(value, { secret: SECRET, storeId: A1, now: NOW }).ok).toBe(false);
    }
    expect(verifyStorePreviewToken(sign(), { secret: "", storeId: A1, now: NOW }).ok).toBe(false);
  });

  it("refuses to sign invalid input", () => {
    expect(() => sign({ storeId: "not-a-uuid" })).toThrow();
    expect(() => sign({ draftKey: "zz" })).toThrow();
    expect(() => sign({ secret: "" })).toThrow();
  });
});
