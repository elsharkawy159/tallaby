import { describe, expect, it } from "vitest";
import { GOOGLE_CATEGORY_BY_SLUG, googleCategoryFor, type FeedCategoryNode } from "./google-category.lib";
import {
  buildFeedItems,
  buildProductItems,
  cleanText,
  escapeFeedCsv,
  escapeFeedXml,
  FEED_XML_FOOTER,
  feedCsvHeader,
  feedCsvRow,
  feedLocale,
  feedPricing,
  feedXmlHeader,
  feedXmlItem,
  isVideoPath,
  mapFeedCondition,
  parseFeedFile,
  variantAttributes,
  type FeedProductRow,
  type FeedStoreInfo,
  type FeedVariantRow,
} from "./product-feed.lib";

const STORE: FeedStoreInfo = { baseUrl: "https://faster.tallaby.com", name: "متجر فاستر", description: "كل شيء & أكثر", currency: "EGP" };

function product(overrides: Partial<FeedProductRow> = {}): FeedProductRow {
  return {
    id: "p1",
    price: { base: 200, final: 200 },
    quantity: 3,
    condition: "new",
    images: ["https://cdn.example/a.jpg", "https://cdn.example/b.jpg"],
    videos: [],
    brand: null,
    productType: { ar: "ملابس", en: "Clothing" },
    googleCategory: "Apparel & Accessories > Clothing",
    translations: {
      ar: { title: "قميص قطن", description: "قميص <مريح> & خفيف", slug: "قميص-قطن" },
      en: { title: "Cotton shirt", description: "Soft & light", slug: "cotton-shirt" },
    },
    variants: [],
    ...overrides,
  };
}

function variant(overrides: Partial<FeedVariantRow> = {}): FeedVariantRow {
  return {
    id: "v1",
    price: { base: 250, final: 250 },
    stock: 2,
    images: [],
    title: null,
    option1: "Color: Red",
    option2: "Size: XL",
    option3: null,
    localized: null,
    ...overrides,
  };
}

describe("escaping", () => {
  it("escapes XML specials and keeps Arabic", () => {
    expect(escapeFeedXml(`قميص <"A"> & 'B'`)).toBe("قميص &lt;&quot;A&quot;&gt; &amp; &apos;B&apos;");
  });

  it("drops characters XML 1.0 forbids", () => {
    expect(escapeFeedXml("a\u0001b\u000bc\tok")).toBe("abc\tok");
  });

  it("quotes CSV cells with commas, quotes or newlines only", () => {
    expect(escapeFeedCsv("plain عربي")).toBe("plain عربي");
    expect(escapeFeedCsv('a,"b"')).toBe('"a,""b"""');
    expect(escapeFeedCsv("a\nb")).toBe('"a\nb"');
  });

  it("cleans text to one line and cuts on a character boundary", () => {
    expect(cleanText("  a\n\n b\u0002c ", 100)).toBe("a b c");
    expect(cleanText("😀😀😀", 2)).toBe("😀😀");
  });
});

describe("prices", () => {
  it("formats with two decimals and the currency", () => {
    const [item] = buildProductItems(product({ price: { base: 199.5, final: 199.5 } }), "ar", STORE);
    expect(item?.price).toBe("199.50 EGP");
    expect(item?.salePrice).toBeNull();
  });

  it("uses the list price as price and the final as sale price", () => {
    expect(feedPricing({ base: 300, list: 300, final: 240 })).toEqual({ regular: 300, sale: 240 });
    const [item] = buildProductItems(product({ price: { base: 300, list: 300, final: 240 } }), "ar", STORE);
    expect(item?.price).toBe("300.00 EGP");
    expect(item?.salePrice).toBe("240.00 EGP");
  });

  it("ignores a list price that is not above the final price", () => {
    expect(feedPricing({ list: 100, final: 120 })).toEqual({ regular: 120, sale: null });
  });

  it("skips a product without a price", () => {
    expect(feedPricing({ final: 0 })).toBeNull();
    expect(buildProductItems(product({ price: null }), "ar", STORE)).toEqual([]);
  });

  it("gives a variant the product's list price when it has no discount of its own (as the storefront)", () => {
    expect(feedPricing({ list: 400, final: 300 }, { final: 350 })).toEqual({ regular: 400, sale: 350 });
    expect(feedPricing({ list: 400, final: 300 }, { list: 500, final: 450 })).toEqual({ regular: 500, sale: 450 });
  });
});

describe("items", () => {
  it("builds an Arabic item with an unprefixed link", () => {
    const [item] = buildProductItems(product(), "ar", STORE);
    expect(item).toMatchObject({
      id: "p1",
      itemGroupId: null,
      title: "قميص قطن",
      description: "قميص <مريح> & خفيف",
      link: `https://faster.tallaby.com/products/${encodeURIComponent("قميص-قطن")}`,
      imageLink: "https://cdn.example/a.jpg",
      additionalImageLinks: ["https://cdn.example/b.jpg"],
      availability: "in stock",
      condition: "new",
      brand: "متجر فاستر",
      productType: "ملابس",
      googleProductCategory: "Apparel & Accessories > Clothing",
    });
  });

  it("builds an English item under /en", () => {
    const [item] = buildProductItems(product({ brand: { ar: "براند", en: "Brand" } }), "en", STORE);
    expect(item?.link).toBe("https://faster.tallaby.com/en/products/cotton-shirt");
    expect(item?.title).toBe("Cotton shirt");
    expect(item?.brand).toBe("Brand");
    expect(item?.productType).toBe("Clothing");
  });

  it("falls back to the other language when the product has no openable link in this one", () => {
    const row = product({ translations: { ar: { title: "قميص", description: "", slug: "qamis" }, en: { title: "Shirt", description: "", slug: null } } });
    const [item] = buildProductItems(row, "en", STORE);
    expect(item?.link).toBe("https://faster.tallaby.com/products/qamis");
    expect(item?.title).toBe("قميص");
    expect(item?.description).toBe("قميص");
  });

  it("skips products with no link or no image", () => {
    expect(buildProductItems(product({ translations: { ar: { title: "x", description: "", slug: null } } }), "ar", STORE)).toEqual([]);
    expect(buildProductItems(product({ images: [] }), "ar", STORE)).toEqual([]);
  });

  it("marks zero stock out of stock and maps used conditions", () => {
    const [item] = buildProductItems(product({ quantity: 0, condition: "used_good" }), "ar", STORE);
    expect(item?.availability).toBe("out of stock");
    expect(item?.condition).toBe("used");
    expect(mapFeedCondition("renewed")).toBe("refurbished");
    expect(mapFeedCondition(null)).toBe("new");
  });

  it("adds the first gallery video and never uses a video as an image", () => {
    expect(isVideoPath("products/clip.MP4")).toBe(true);
    const [item] = buildProductItems(
      product({ images: ["https://cdn.example/v.mp4", "https://cdn.example/a.jpg"], videos: ["https://cdn.example/v.mp4"] }),
      "ar",
      STORE,
    );
    expect(item?.imageLink).toBe("https://cdn.example/a.jpg");
    expect(item?.videoLink).toBe("https://cdn.example/v.mp4");
  });

  it("writes one row per variant grouped by the product id", () => {
    const row = product({
      variants: [
        variant({ images: ["https://cdn.example/red.jpg"] }),
        variant({ id: "v2", stock: 0, option1: "Color: Blue", option2: "Size: M", price: { final: 0 } }),
        variant({ id: "v3", stock: 0, option1: "Color: Blue", option2: "Size: L" }),
      ],
    });
    const items = buildProductItems(row, "en", STORE);
    expect(items.map((i) => i.id)).toEqual(["v1", "v3"]);
    expect(items[0]).toMatchObject({
      itemGroupId: "p1",
      title: "Cotton shirt - Red / XL",
      link: "https://faster.tallaby.com/en/products/cotton-shirt?variant=v1",
      imageLink: "https://cdn.example/red.jpg",
      additionalImageLinks: ["https://cdn.example/a.jpg", "https://cdn.example/b.jpg"],
      color: "Red",
      size: "XL",
      price: "250.00 EGP",
      availability: "in stock",
    });
    expect(items[1]?.availability).toBe("out of stock");
  });

  it("reads Arabic option names and localized variant labels", () => {
    expect(variantAttributes(variant({ option1: "اللون: أحمر", option2: "المقاس: كبير" }), "ar")).toEqual({ label: "أحمر / كبير", color: "أحمر", size: "كبير" });
    const localized = { ar: { title: "", option1: "اللون: أزرق" }, en: { title: "", option1: "Color: Blue" } };
    expect(variantAttributes(variant({ option1: "Color: Blue", option2: null, localized }), "ar").color).toBe("أزرق");
  });

  it("caps the number of items", () => {
    const rows = Array.from({ length: 5 }, (_, i) => product({ id: `p${i}` }));
    expect(buildFeedItems(rows, "ar", STORE, 3)).toHaveLength(3);
  });
});

describe("serialisation", () => {
  it("writes a well-formed RSS item with the g: namespace", () => {
    const [item] = buildProductItems(product({ price: { list: 300, final: 240 }, videos: ["https://cdn.example/v.mp4"] }), "ar", STORE);
    const xml = feedXmlHeader(STORE) + feedXmlItem(item!) + FEED_XML_FOOTER;
    expect(xml).toContain('xmlns:g="http://base.google.com/ns/1.0"');
    expect(xml).toContain("<title>متجر فاستر</title>");
    expect(xml).toContain("<description>كل شيء &amp; أكثر</description>");
    expect(xml).toContain("<g:description>قميص &lt;مريح&gt; &amp; خفيف</g:description>");
    expect(xml).toContain("<g:price>300.00 EGP</g:price>");
    expect(xml).toContain("<g:sale_price>240.00 EGP</g:sale_price>");
    expect(xml).toContain("<g:identifier_exists>no</g:identifier_exists>");
    expect(xml).toContain("<video><url>https://cdn.example/v.mp4</url></video>");
    expect(xml).not.toContain("<g:item_group_id>");
    expect(xml.trimEnd().endsWith("</rss>")).toBe(true);
  });

  it("writes CSV rows matching the header", () => {
    const [item] = buildProductItems(product({ variants: [variant({ images: ["https://cdn.example/red.jpg"] })] }), "en", STORE);
    const header = feedCsvHeader();
    expect(header.startsWith("﻿id,item_group_id,title")).toBe(true);
    const row = feedCsvRow(item!);
    expect(row).toContain("v1,p1,Cotton shirt - Red / XL,");
    expect(row).toContain('"https://cdn.example/a.jpg,https://cdn.example/b.jpg"');
  });
});

describe("request parsing", () => {
  it("accepts only the two feed files", () => {
    expect(parseFeedFile("products.xml")).toBe("xml");
    expect(parseFeedFile("products.csv")).toBe("csv");
    expect(parseFeedFile("orders.xml")).toBeNull();
  });

  it("uses ?lang= only when the store offers it", () => {
    expect(feedLocale(null, ["ar", "en"])).toBe("ar");
    expect(feedLocale("en", ["ar", "en"])).toBe("en");
    expect(feedLocale("en", ["ar"])).toBe("ar");
    expect(feedLocale(null, ["en"])).toBe("en");
    expect(feedLocale("fr", null)).toBe("ar");
  });
});

describe("Google category mapping", () => {
  const tree = new Map<string, FeedCategoryNode>([
    ["root", { slug: "clothing-shoes-and-jewelry", parentId: null }],
    ["men", { slug: "men", parentId: "root" }],
    ["shoes", { slug: "men-shoes", parentId: "men" }],
    ["sneakers", { slug: "shoes-sneakers", parentId: "shoes" }],
    ["odd", { slug: "unmapped-root", parentId: null }],
    ["loop", { slug: "loop", parentId: "loop" }],
  ]);

  it("uses the most specific mapped category", () => {
    expect(googleCategoryFor("sneakers", tree)).toBe("Apparel & Accessories > Shoes");
    expect(googleCategoryFor("men", tree)).toBe("Apparel & Accessories > Clothing");
    expect(googleCategoryFor("root", tree)).toBe("Apparel & Accessories");
  });

  it("returns null for unmapped, unknown or cyclic categories", () => {
    expect(googleCategoryFor("odd", tree)).toBeNull();
    expect(googleCategoryFor("missing", tree)).toBeNull();
    expect(googleCategoryFor(null, tree)).toBeNull();
    expect(googleCategoryFor("loop", tree)).toBeNull();
  });

  it("maps every Tallaby root category", () => {
    const roots = [
      "arts-crafts-and-sewing", "automotive", "baby", "beauty-and-personal-care", "books", "clothing-shoes-and-jewelry",
      "electronics", "garden-and-outdoor", "gifts-and-occasions", "grocery-and-gourmet-food", "health-and-household",
      "home-and-kitchen", "luggage-and-travel-gear", "musical-instruments", "office-products", "pet-supplies",
      "sports-and-outdoors", "tools-and-home-improvement", "toys-and-games",
    ];
    for (const slug of roots) expect(GOOGLE_CATEGORY_BY_SLUG[slug], slug).toBeTruthy();
  });
});
