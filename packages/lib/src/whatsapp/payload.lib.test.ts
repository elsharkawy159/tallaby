import { createHmac } from "crypto";
import { describe, expect, it } from "vitest";
import { signQuickReplyPayload, verifyQuickReplyPayload } from "./payload.lib";

const SECRET = "s".repeat(32);
const ID = "0b9c6f1e-2d3a-4b5c-8d7e-9f0a1b2c3d4e";

describe("quick-reply payloads", () => {
  it("signs in the TB1 format with a 16-hex signature", () => {
    const payload = signQuickReplyPayload("confirm", ID, SECRET);
    const sig = createHmac("sha256", SECRET).update(`c:${ID}`).digest("hex").slice(0, 16);
    expect(payload).toBe(`TB1.c.${ID}.${sig}`);
    expect(signQuickReplyPayload("cancel", ID, SECRET)).toMatch(new RegExp(`^TB1\\.x\\.${ID}\\.[0-9a-f]{16}$`));
  });

  it("round-trips both actions", () => {
    expect(verifyQuickReplyPayload(signQuickReplyPayload("confirm", ID, SECRET), SECRET)).toEqual({ action: "confirm", messageId: ID });
    expect(verifyQuickReplyPayload(signQuickReplyPayload("cancel", ID, SECRET), SECRET)).toEqual({ action: "cancel", messageId: ID });
  });

  it("rejects a wrong secret, a swapped action and tampering", () => {
    const payload = signQuickReplyPayload("confirm", ID, SECRET);
    expect(verifyQuickReplyPayload(payload, "t".repeat(32))).toBeNull();
    expect(verifyQuickReplyPayload(payload.replace("TB1.c.", "TB1.x."), SECRET)).toBeNull();
    const otherId = ID.replace(/e$/, "f");
    expect(verifyQuickReplyPayload(payload.replace(ID, otherId), SECRET)).toBeNull();
    expect(verifyQuickReplyPayload(payload.slice(0, -1) + (payload.endsWith("0") ? "1" : "0"), SECRET)).toBeNull();
  });

  it("rejects malformed payloads and missing secrets", () => {
    for (const bad of [null, undefined, "", "TB1", "TB2.c.x.y", `TB1.c.${ID}`, `TB1.z.${ID}.0123456789abcdef`, `TB1.c.${ID}.0123456789ABCDEF`, `TB1.c.not-a-uuid-aaaaaaaaaaaaaaaaaaaaaaaaa.0123456789abcdef`]) {
      expect(verifyQuickReplyPayload(bad, SECRET)).toBeNull();
    }
    expect(verifyQuickReplyPayload(signQuickReplyPayload("confirm", ID, SECRET), "")).toBeNull();
    expect(() => signQuickReplyPayload("confirm", ID, "short")).toThrow();
    expect(() => signQuickReplyPayload("confirm", "not-a-uuid", SECRET)).toThrow();
  });
});
