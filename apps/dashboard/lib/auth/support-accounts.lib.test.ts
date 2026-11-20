import { describe, expect, it } from "vitest";
import { isSupportAccount, SUPPORT_ACCOUNT_EMAILS } from "./support-accounts.lib";

describe("isSupportAccount", () => {
  it("lists only lowercase, trimmed emails", () => {
    for (const email of SUPPORT_ACCOUNT_EMAILS) expect(email).toBe(email.trim().toLowerCase());
  });

  it.each(["seller@tallaby.com", "Seller@Tallaby.COM", "  seller@tallaby.com \n"])("accepts %j", (email) => {
    expect(isSupportAccount(email)).toBe(true);
  });

  it.each([null, undefined, "", " ", "seller@tallaby.co", "xseller@tallaby.com", "seller@tallaby.com.evil.com"])(
    "refuses %j",
    (email) => {
      expect(isSupportAccount(email)).toBe(false);
    },
  );
});
