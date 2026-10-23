import { describe, expect, it } from "vitest";
import { updateTouchesLockedProductFields } from "./product-page-guard.lib";

describe("updateTouchesLockedProductFields", () => {
  it("allows renames and SEO", () => {
    expect(updateTouchesLockedProductFields({})).toBe(false);
  });
  it("allows resending the locked values unchanged", () => {
    expect(updateTouchesLockedProductFields({ slug: "product", showInNav: false })).toBe(false);
  });
  it("rejects a new slug", () => {
    expect(updateTouchesLockedProductFields({ slug: "shop" })).toBe(true);
  });
  it("rejects showing it in the menu", () => {
    expect(updateTouchesLockedProductFields({ showInNav: true })).toBe(true);
  });
});
