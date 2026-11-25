import { createHmac } from "crypto";
import { describe, expect, it } from "vitest";
import { verifyMetaSignature } from "./signature.lib";

const SECRET = "app-secret";
const BODY = '{"object":"whatsapp_business_account","entry":[]}';
const header = (body: string | Buffer, secret = SECRET) => `sha256=${createHmac("sha256", secret).update(body).digest("hex")}`;

describe("verifyMetaSignature", () => {
  it("accepts the right signature on a string or bytes", () => {
    expect(verifyMetaSignature(BODY, header(BODY), SECRET)).toBe(true);
    expect(verifyMetaSignature(new TextEncoder().encode(BODY), header(BODY), SECRET)).toBe(true);
    expect(verifyMetaSignature(BODY, header(BODY).toUpperCase().replace("SHA256=", "sha256="), SECRET)).toBe(true);
  });

  it("checks the raw bytes, including non-ASCII", () => {
    const body = '{"text":"إيقاف"}';
    expect(verifyMetaSignature(Buffer.from(body, "utf8"), header(Buffer.from(body, "utf8")), SECRET)).toBe(true);
    expect(verifyMetaSignature(body + " ", header(body), SECRET)).toBe(false);
  });

  it("rejects a wrong secret or a changed body", () => {
    expect(verifyMetaSignature(BODY, header(BODY, "other"), SECRET)).toBe(false);
    expect(verifyMetaSignature(BODY.replace("[]", "[1]"), header(BODY), SECRET)).toBe(false);
  });

  it("rejects missing and malformed headers or secrets", () => {
    const good = header(BODY);
    for (const bad of [null, undefined, "", "sha256=", good.slice(7), `sha1=${good.slice(7)}`, `${good}00`, good.slice(0, -2), `sha256=${"z".repeat(64)}`]) {
      expect(verifyMetaSignature(BODY, bad, SECRET)).toBe(false);
    }
    expect(verifyMetaSignature(BODY, good, "")).toBe(false);
    expect(verifyMetaSignature(BODY, good, null)).toBe(false);
  });
});
