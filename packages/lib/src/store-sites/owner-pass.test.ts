import { describe, expect, it } from "vitest";
import { signStorePreviewToken } from "./preview-token";
import {
  STORE_OWNER_PASS_TTL_SECONDS,
  signStoreOwnerPass,
  verifyStoreOwnerPass,
} from "./owner-pass";

const SECRET = "x".repeat(40);
const STORE = "11111111-1111-4111-8111-111111111111";
const OTHER_STORE = "22222222-2222-4222-8222-222222222222";
const SELLER = "33333333-3333-4333-8333-333333333333";
const OTHER_SELLER = "44444444-4444-4444-8444-444444444444";
const NOW = 1_800_000_000_000;

const sign = (overrides: Partial<Parameters<typeof signStoreOwnerPass>[0]> = {}) =>
  signStoreOwnerPass({ storeId: STORE, sellerId: SELLER, secret: SECRET, now: NOW, ...overrides }).token;

describe("store owner pass (F-76)", () => {
  it("opens its own store for its seller", () => {
    const result = verifyStoreOwnerPass(sign(), { secret: SECRET, storeId: STORE, sellerId: SELLER, now: NOW });
    expect(result).toMatchObject({ ok: true, storeId: STORE, sellerId: SELLER });
  });

  it("lasts 30 days, then expires", () => {
    const token = sign();
    const day29 = NOW + 29 * 86_400_000;
    const day31 = NOW + 31 * 86_400_000;
    expect(verifyStoreOwnerPass(token, { secret: SECRET, storeId: STORE, sellerId: SELLER, now: day29 }).ok).toBe(true);
    expect(verifyStoreOwnerPass(token, { secret: SECRET, storeId: STORE, sellerId: SELLER, now: day31 })).toEqual({
      ok: false,
      reason: "expired",
    });
  });

  it("clamps a longer life to the maximum", () => {
    const { expiresAt } = signStoreOwnerPass({ storeId: STORE, sellerId: SELLER, secret: SECRET, now: NOW, ttlSeconds: 10 ** 9 });
    expect(expiresAt - NOW / 1000).toBe(STORE_OWNER_PASS_TTL_SECONDS);
  });

  it("never opens another store, or the same store for another owner", () => {
    expect(verifyStoreOwnerPass(sign(), { secret: SECRET, storeId: OTHER_STORE, sellerId: SELLER, now: NOW })).toEqual({
      ok: false,
      reason: "wrong_store",
    });
    expect(verifyStoreOwnerPass(sign(), { secret: SECRET, storeId: STORE, sellerId: OTHER_SELLER, now: NOW })).toEqual({
      ok: false,
      reason: "wrong_store",
    });
  });

  it("refuses a tampered pass", () => {
    const [body, signature] = sign().split(".") as [string, string];
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    const forged = Buffer.from(JSON.stringify({ ...payload, s: OTHER_STORE })).toString("base64url");
    expect(verifyStoreOwnerPass(`${forged}.${signature}`, { secret: SECRET, storeId: OTHER_STORE, sellerId: SELLER, now: NOW })).toEqual({
      ok: false,
      reason: "signature",
    });
    expect(verifyStoreOwnerPass(sign(), { secret: "y".repeat(40), storeId: STORE, sellerId: SELLER, now: NOW }).ok).toBe(false);
  });

  it("refuses garbage and a builder preview token", () => {
    for (const token of [undefined, null, 42, "", "abc", "a.b.c", "x".repeat(600)]) {
      expect(verifyStoreOwnerPass(token, { secret: SECRET, storeId: STORE, sellerId: SELLER, now: NOW }).ok).toBe(false);
    }
    const preview = signStorePreviewToken({ storeId: STORE, draftKey: "a".repeat(32), secret: SECRET, now: NOW }).token;
    expect(verifyStoreOwnerPass(preview, { secret: SECRET, storeId: STORE, sellerId: SELLER, now: NOW })).toEqual({
      ok: false,
      reason: "signature",
    });
  });

  it("refuses to sign bad ids", () => {
    expect(() => signStoreOwnerPass({ storeId: "nope", sellerId: SELLER, secret: SECRET })).toThrow();
    expect(() => signStoreOwnerPass({ storeId: STORE, sellerId: "nope", secret: SECRET })).toThrow();
    expect(() => signStoreOwnerPass({ storeId: STORE, sellerId: SELLER, secret: "" })).toThrow();
  });
});
