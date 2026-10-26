import { describe, expect, it } from "vitest";
import { fabClearanceFor, fabOffsetFor } from "./support-fab.lib";

describe("fabOffsetFor", () => {
  it("lifts the button above the wallet's top-up bar below lg only", () => {
    expect(fabOffsetFor("/wallet")).toBe("bottom-24 lg:bottom-5");
    expect(fabOffsetFor("/wallet/top-up")).toBe("bottom-5");
    expect(fabClearanceFor("/wallet")).toBe("pb-24");
  });
});

describe("fabClearanceFor", () => {
  it("pads ordinary pages for the WhatsApp button", () => {
    expect(fabClearanceFor("/")).toBe("pb-24");
    expect(fabClearanceFor("/products")).toBe("pb-24");
    expect(fabClearanceFor("/stores/abc/website/pages")).toBe("pb-24");
  });

  it("leaves pages with their own bottom bar alone", () => {
    expect(fabClearanceFor("/products/add")).toBe("");
    expect(fabClearanceFor("/products/123/edit")).toBe("");
    expect(fabClearanceFor("/marketing")).toBe("lg:pb-24");
  });
});
