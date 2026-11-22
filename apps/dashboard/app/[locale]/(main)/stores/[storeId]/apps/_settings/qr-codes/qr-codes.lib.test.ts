import { describe, expect, it } from "vitest";
import { qrDestinationUrl } from "./qr-codes.lib";

describe("QR destinations", () => {
  it("encodes the public homepage on the selected store's domain", () => {
    expect(qrDestinationUrl("https://store.example/", { kind: "home" })).toBe("https://store.example/");
  });

  it("encodes a published page as a path on the same host", () => {
    const url = qrDestinationUrl("https://store.tallaby.com", { kind: "page", slug: "about-us" });
    expect(url).toBe("https://store.tallaby.com/about-us");
  });

  it("preserves Arabic product slugs as a single URL segment", () => {
    const slug = "قهوة-عربية";
    expect(qrDestinationUrl("https://store.example", { kind: "product", slug }))
      .toBe(`https://store.example/products/${encodeURIComponent(slug)}`);
  });
});
