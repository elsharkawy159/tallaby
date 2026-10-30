import { randomBytes } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  INTEGRATIONS,
  INTEGRATION_PROVIDERS,
  getIntegration,
  isIntegrationProvider,
  isValidIntegrationId,
  normalizeIntegrationId,
  readIntegrationId,
  validateIdentifierConfig,
} from "./index";
import { IntegrationCryptoError, decryptCredentials, encryptCredentials, parseIntegrationKey } from "./server";

const STORE_A = "11111111-1111-4111-8111-111111111111";
const STORE_B = "22222222-2222-4222-8222-222222222222";

describe("registry", () => {
  it("matches the provider CHECK list (0056, plus bosta from 0106, paymob and kashier from 0122)", () => {
    expect([...INTEGRATION_PROVIDERS].sort()).toEqual(
      [
        "meta_pixel",
        "meta_capi",
        "google_analytics",
        "google_tag_manager",
        "tiktok_pixel",
        "snapchat_pixel",
        "google_sheets",
        "shopify_import",
        "bosta",
        "paymob",
        "kashier",
      ].sort(),
    );
    for (const provider of INTEGRATION_PROVIDERS) expect(INTEGRATIONS[provider].provider).toBe(provider);
  });

  it("launches Pixel, GA4, GTM, Meta CAPI, Sheets, Shopify, Bosta and the payment gateways; GTM carries the D18 warning", () => {
    const available = INTEGRATION_PROVIDERS.filter((p) => INTEGRATIONS[p].availability === "available");
    expect(available).toEqual([
      "meta_pixel",
      "google_analytics",
      "google_tag_manager",
      "meta_capi",
      "google_sheets",
      "shopify_import",
      "bosta",
      "paymob",
      "kashier",
    ]);
    expect(INTEGRATIONS.google_tag_manager.warnsAboutSellerScripts).toBe(true);
  });

  it("recognises providers", () => {
    expect(isIntegrationProvider("meta_pixel")).toBe(true);
    expect(isIntegrationProvider("custom_code")).toBe(false);
    expect(isIntegrationProvider(42)).toBe(false);
    expect(getIntegration("google_analytics")?.idField).toBe("measurementId");
    expect(getIntegration("nope")).toBeNull();
  });
});

describe("identifier validation", () => {
  it.each([
    ["meta_pixel", "123456789012345", true],
    ["meta_pixel", "1234567890123456", true],
    ["meta_pixel", "12345", false],
    ["meta_pixel", "12345678901234a", false],
    ["google_analytics", "G-ET1FTMXB9X", true],
    ["google_analytics", "UA-12345-1", false],
    ["google_tag_manager", "GTM-ABC1234", true],
    ["google_tag_manager", "GTM-AB", false],
    ["tiktok_pixel", "C4A1B2C3D4E5F6G7H8I9", true],
    ["snapchat_pixel", "0f6c4c5a-1b2c-4d3e-8f90-123456789abc", true],
  ] as const)("%s %s → %s", (provider, id, ok) => {
    expect(isValidIntegrationId(provider, id)).toBe(ok);
  });

  it("rejects markup and script injection", () => {
    const attempts = [
      'G-ABC123"><script>alert(1)</script>',
      "GTM-ABC123');alert(1);//",
      "1234567890123456\n<x>",
    ];
    for (const id of attempts) {
      expect(validateIdentifierConfig("google_analytics", id).success).toBe(false);
      expect(validateIdentifierConfig("google_tag_manager", id).success).toBe(false);
      expect(validateIdentifierConfig("meta_pixel", id).success).toBe(false);
    }
  });

  it("normalises pasted ids into the stored config", () => {
    expect(validateIdentifierConfig("google_analytics", "  g-et1ftmxb9x ")).toEqual({
      success: true,
      config: { measurementId: "G-ET1FTMXB9X" },
    });
    expect(validateIdentifierConfig("meta_pixel", "1234 5678 9012 345")).toEqual({
      success: true,
      config: { pixelId: "123456789012345" },
    });
    expect(normalizeIntegrationId("snapchat_pixel", " ABC ")).toBe("abc");
  });

  it("refuses non-identifier providers and non-strings", () => {
    expect(validateIdentifierConfig("meta_capi", "x")).toEqual({ success: false, error: "unsupported" });
    expect(validateIdentifierConfig("google_sheets", "x")).toEqual({ success: false, error: "unsupported" });
    expect(validateIdentifierConfig("meta_pixel", 123)).toEqual({ success: false, error: "invalid_id" });
    expect(validateIdentifierConfig("meta_pixel", "9".repeat(80))).toEqual({ success: false, error: "invalid_id" });
  });

  it("reads back only valid stored ids", () => {
    expect(readIntegrationId("google_analytics", { measurementId: "G-ET1FTMXB9X" })).toBe("G-ET1FTMXB9X");
    expect(readIntegrationId("google_analytics", { measurementId: "G-x'><script>" })).toBeNull();
    expect(readIntegrationId("google_analytics", null)).toBeNull();
    expect(readIntegrationId("meta_capi", { pixelId: "123456789012345" })).toBeNull();
  });
});

describe("credentials encryption", () => {
  const key = randomBytes(32);
  const binding = { storeId: STORE_A, provider: "meta_capi" as const };

  it("round-trips and never contains the plaintext", () => {
    const payload = encryptCredentials({ accessToken: "EAAB-secret-token" }, binding, key);
    expect(payload).toMatch(/^v1\.[\w-]+\.[\w-]+\.[\w-]+$/);
    expect(payload).not.toContain("secret");
    expect(decryptCredentials(payload, binding, key)).toEqual({ accessToken: "EAAB-secret-token" });
  });

  it("uses a fresh IV each time", () => {
    expect(encryptCredentials({ a: 1 }, binding, key)).not.toBe(encryptCredentials({ a: 1 }, binding, key));
  });

  it("fails with the wrong key", () => {
    const payload = encryptCredentials({ a: 1 }, binding, key);
    expect(() => decryptCredentials(payload, binding, randomBytes(32))).toThrow(IntegrationCryptoError);
  });

  it("is bound to the store and provider", () => {
    const payload = encryptCredentials({ a: 1 }, binding, key);
    expect(() => decryptCredentials(payload, { storeId: STORE_B, provider: "meta_capi" }, key)).toThrow(
      "decrypt_failed",
    );
    expect(() => decryptCredentials(payload, { storeId: STORE_A, provider: "shopify_import" }, key)).toThrow(
      "decrypt_failed",
    );
  });

  it("detects tampering and bad payloads", () => {
    const payload = encryptCredentials({ a: 1 }, binding, key);
    const parts = payload.split(".");
    const flipped = Buffer.from(parts[3]!, "base64url");
    flipped[0] = flipped[0]! ^ 1;
    parts[3] = flipped.toString("base64url");
    expect(() => decryptCredentials(parts.join("."), binding, key)).toThrow("decrypt_failed");
    expect(() => decryptCredentials("v2.a.b.c", binding, key)).toThrow("invalid_payload");
    expect(() => decryptCredentials("v1.AAAA.BBBB.CCCC", binding, key)).toThrow("invalid_payload");
  });

  it("parses hex and base64 keys and refuses bad ones", () => {
    const raw = randomBytes(32);
    expect(parseIntegrationKey(raw.toString("hex")).equals(raw)).toBe(true);
    expect(parseIntegrationKey(raw.toString("base64")).equals(raw)).toBe(true);
    expect(() => parseIntegrationKey("")).toThrow("missing_key");
    expect(() => parseIntegrationKey(undefined)).toThrow("missing_key");
    expect(() => parseIntegrationKey(randomBytes(16).toString("base64"))).toThrow("invalid_key");
  });
});
