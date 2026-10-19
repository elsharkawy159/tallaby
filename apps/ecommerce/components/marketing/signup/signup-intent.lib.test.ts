import { describe, expect, it } from "vitest";
import { SIGNUP_INTENT_TTL_MS, signSignupIntent, verifySignupIntent } from "./signup-intent.lib";

const SECRET = "test-secret-that-is-long-enough-0123456789";
const NOW = 1_800_000_000_000;
const intent = { subdomain: "faster-eg", phone: "01012345678" };

describe("signup intent token", () => {
  it("round-trips a valid intent", () => {
    const token = signSignupIntent(intent, SECRET, NOW);
    expect(verifySignupIntent(token, SECRET, NOW + 1000)).toEqual(intent);
  });

  it("expires after the TTL (15 minutes)", () => {
    const token = signSignupIntent(intent, SECRET, NOW);
    expect(SIGNUP_INTENT_TTL_MS).toBe(15 * 60 * 1000);
    expect(verifySignupIntent(token, SECRET, NOW + SIGNUP_INTENT_TTL_MS - 1)).toEqual(intent);
    expect(verifySignupIntent(token, SECRET, NOW + SIGNUP_INTENT_TTL_MS + 1)).toBeNull();
  });

  it("rejects a token signed with another secret", () => {
    const token = signSignupIntent(intent, "another-secret-another-secret-0123", NOW);
    expect(verifySignupIntent(token, SECRET, NOW)).toBeNull();
  });

  it("rejects a tampered payload", () => {
    const token = signSignupIntent(intent, SECRET, NOW);
    const [payload, sig] = token.split(".");
    const forged = Buffer.from(
      JSON.stringify({ ...JSON.parse(Buffer.from(payload!, "base64url").toString()), subdomain: "evil" }),
    ).toString("base64url");
    expect(verifySignupIntent(`${forged}.${sig}`, SECRET, NOW)).toBeNull();
  });

  it("rejects garbage", () => {
    for (const bad of ["", "abc", "a.b.c", ".", `${"x".repeat(5000)}.y`]) {
      expect(verifySignupIntent(bad, SECRET, NOW), bad.slice(0, 10)).toBeNull();
    }
  });

  it("refuses to sign or verify with a short secret", () => {
    expect(() => signSignupIntent(intent, "short", NOW)).toThrow();
    expect(verifySignupIntent("a.b", "short", NOW)).toBeNull();
  });
});
