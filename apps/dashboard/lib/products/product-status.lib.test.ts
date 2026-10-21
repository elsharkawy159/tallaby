import { describe, expect, it } from "vitest";
import { hasProductImage, nextProductStatus } from "./product-status.lib";

describe("nextProductStatus", () => {
  it.each([
    ["new product with image goes live", { previous: null, hasImage: true, canPublish: true }, "active"],
    ["new product without image is a draft", { previous: null, hasImage: false, canPublish: true }, "draft"],
    ["active product stays live on edit", { previous: "active", hasImage: true, canPublish: true }, "active"],
    ["active product with no image becomes draft", { previous: "active", hasImage: false, canPublish: true }, "draft"],
    ["draft stays draft on edit", { previous: "draft", hasImage: true, canPublish: true }, "draft"],
    ["rejected stays rejected", { previous: "rejected", hasImage: true, canPublish: true }, "rejected"],
    ["pending product can be published", { previous: "pending", hasImage: true, canPublish: true }, "active"],
    ["restricted seller cannot go live", { previous: null, hasImage: true, canPublish: false }, "draft"],
  ] as const)("%s", (_name, input, expected) => {
    expect(nextProductStatus(input)).toBe(expected);
  });
});

describe("hasProductImage", () => {
  it("needs at least one image", () => {
    expect(hasProductImage([])).toBe(false);
    expect(hasProductImage(["a"])).toBe(true);
    expect(hasProductImage(null)).toBe(false);
  });
});
