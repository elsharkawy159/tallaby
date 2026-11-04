import { describe, expect, it } from "vitest";
import { fallbackProductSlug, pickFreeSlug } from "./product-slug.lib";

describe("pickFreeSlug", () => {
  it("keeps a free slug", () => {
    expect(pickFreeSlug("red-shirt", [])).toBe("red-shirt");
    expect(pickFreeSlug("red-shirt", ["blue-shirt", "red-shirt-2", null, undefined])).toBe("red-shirt");
  });

  it("adds the first free number", () => {
    expect(pickFreeSlug("red-shirt", ["red-shirt"])).toBe("red-shirt-2");
    expect(pickFreeSlug("red-shirt", ["red-shirt", "red-shirt-2"])).toBe("red-shirt-3");
    expect(pickFreeSlug("red-shirt", ["red-shirt", "red-shirt-3"])).toBe("red-shirt-2");
  });

  it("treats a number in the name as part of the name", () => {
    expect(pickFreeSlug("iphone-15", ["iphone-15"])).toBe("iphone-15-2");
  });
});

describe("fallbackProductSlug", () => {
  it("is short and comes from the product id", () => {
    expect(fallbackProductSlug("0a1b2c3d-4e5f-6071-8293-a4b5c6d7e8f9")).toBe("product-0a1b2c3d");
  });
});
