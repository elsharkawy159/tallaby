import { describe, expect, it } from "vitest";
import { storeFeedUrls } from "./product-feeds.lib";

describe("storeFeedUrls", () => {
  it("builds the feed addresses on the store origin", () => {
    expect(storeFeedUrls("https://faster.tallaby.com/", ["ar"])).toEqual({
      xml: "https://faster.tallaby.com/api/feeds/products.xml",
      csv: "https://faster.tallaby.com/api/feeds/products.csv",
      xmlEnglish: null,
    });
  });

  it("adds the English feed when the store offers English after Arabic", () => {
    expect(storeFeedUrls("https://faster-eg.com", ["ar", "en"]).xmlEnglish).toBe("https://faster-eg.com/api/feeds/products.xml?lang=en");
    expect(storeFeedUrls("https://faster-eg.com", ["en", "ar"]).xmlEnglish).toBeNull();
    expect(storeFeedUrls("https://faster-eg.com", null).xmlEnglish).toBeNull();
  });
});
