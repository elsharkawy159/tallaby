import { describe, expect, it } from "vitest";
import { topUpCopyVariant } from "./top-up-copy.lib";

describe("topUpCopyVariant", () => {
  it("keeps the EGP text in Egypt", () => {
    expect(topUpCopyVariant("EG", true)).toBe("egp");
    expect(topUpCopyVariant("eg", true)).toBe("egp");
  });

  it("shows USD by card for any other known country", () => {
    expect(topUpCopyVariant("SE", true)).toBe("usdCard");
    expect(topUpCopyVariant("US", true)).toBe("usdCard");
    expect(topUpCopyVariant("SA", true)).toBe("usdCard");
  });

  it("keeps the default EGP text while the country is unknown or malformed", () => {
    expect(topUpCopyVariant(null, true)).toBe("egp");
    expect(topUpCopyVariant(undefined, true)).toBe("egp");
    expect(topUpCopyVariant("", true)).toBe("egp");
    expect(topUpCopyVariant("XYZ", true)).toBe("egp");
  });

  it("shows the EGP text everywhere while USD card top-ups are not live", () => {
    expect(topUpCopyVariant("SE")).toBe("egp");
    expect(topUpCopyVariant("US", false)).toBe("egp");
  });
});
