import { describe, expect, it } from "vitest";
import { localizedUrl } from "./seo.lib";
import {
  DIRECTORY_PAGE_SIZE,
  type DirectoryStore,
  type DirectoryStoreRow,
  directoryPage,
  directoryPageCount,
  directoryPagePath,
  directorySitemapEntries,
  directoryStores,
  LOGO_STRIP_MAX,
  LOGO_STRIP_MIN_PRODUCTS,
  parseDirectoryPage,
  selectLogoStrip,
  shapeDirectoryStore,
} from "./store-directory.lib";

const toUrl = (sub: string, domain: string | null) => (domain ? `https://${domain}` : `https://${sub}.tallaby.com`);
const toLogo = (logo: string) => (logo.startsWith("http") ? logo : `https://x.supabase.co/storage/v1/object/public/sellers/${logo}`);

const row = (over: Partial<DirectoryStoreRow> = {}): DirectoryStoreRow => ({
  name: "Faster",
  subdomain: "faster",
  custom_domain: null,
  logo_url: "logos/a.png",
  store_category: "Fashion",
  store_category_ar: "أزياء وملابس",
  product_count: 12,
  ...over,
});

const store = (name: string, productCount: number, logo = true): DirectoryStore => ({
  name,
  url: `https://${name.toLowerCase()}.tallaby.com`,
  logoUrl: logo ? `https://cdn.example/${name}.png` : null,
  industry: null,
  productCount,
});

describe("shapeDirectoryStore", () => {
  it("keeps only public fields, with the store's address and public logo", () => {
    expect(shapeDirectoryStore(row(), toUrl, toLogo)).toEqual({
      name: "Faster",
      url: "https://faster.tallaby.com",
      logoUrl: "https://x.supabase.co/storage/v1/object/public/sellers/logos/a.png",
      industry: "fashion",
      productCount: 12,
    });
  });

  it("links to the live custom domain when there is one", () => {
    expect(shapeDirectoryStore(row({ custom_domain: "faster-eg.com" }), toUrl, toLogo)?.url).toBe("https://faster-eg.com");
  });

  it("drops a logo that is not https and never shows free-text industries", () => {
    const shaped = shapeDirectoryStore(row({ logo_url: "http://plain.example/a.png", store_category: "My own words", store_category_ar: null }), toUrl, toLogo);
    expect(shaped?.logoUrl).toBeNull();
    expect(shaped?.industry).toBeNull();
    expect(shapeDirectoryStore(row({ logo_url: null }), toUrl, toLogo)?.logoUrl).toBeNull();
  });

  it("skips rows without a name, a subdomain or a product", () => {
    expect(shapeDirectoryStore(row({ name: "  " }), toUrl, toLogo)).toBeNull();
    expect(shapeDirectoryStore(row({ subdomain: "" }), toUrl, toLogo)).toBeNull();
    expect(shapeDirectoryStore(row({ product_count: 0 }), toUrl, toLogo)).toBeNull();
    expect(shapeDirectoryStore(row({ product_count: "x" }), toUrl, toLogo)).toBeNull();
  });
});

describe("selectLogoStrip", () => {
  it(`needs a logo and at least ${LOGO_STRIP_MIN_PRODUCTS} products, most products first`, () => {
    const picked = selectLogoStrip([store("A", 10), store("B", 9), store("C", 40, false), store("D", 25), store("E", 11), store("F", 12)]);
    expect(picked.map((s) => s.name)).toEqual(["D", "F", "E", "A"]);
  });

  it("hides the strip when fewer than 4 stores qualify", () => {
    expect(selectLogoStrip([store("A", 50), store("B", 50), store("C", 50)])).toEqual([]);
  });

  it(`shows at most ${LOGO_STRIP_MAX} logos`, () => {
    const many = Array.from({ length: 50 }, (_, i) => store(`S${i}`, 10 + i));
    const picked = selectLogoStrip(many);
    expect(picked).toHaveLength(LOGO_STRIP_MAX);
    expect(picked[0]?.name).toBe("S49");
  });
});

describe("directory pages", () => {
  const many = Array.from({ length: DIRECTORY_PAGE_SIZE * 2 + 5 }, (_, i) => store(`Store${String(i).padStart(3, "0")}`, 1, false));

  it("sorts by name and drops duplicate addresses", () => {
    const listed = directoryStores([store("Zed", 3), store("alpha", 1), store("Zed", 9)]);
    expect(listed.map((s) => s.name)).toEqual(["alpha", "Zed"]);
  });

  it("pages 60 at a time, with /stores as page 1", () => {
    expect(directoryPageCount(0)).toBe(1);
    expect(directoryPageCount(many.length)).toBe(3);
    expect(directoryPage(many, 1)).toHaveLength(DIRECTORY_PAGE_SIZE);
    expect(directoryPage(many, 3)).toHaveLength(5);
    expect(directoryPage(many, 4)).toBeNull();
    expect(directoryPage(many, 0)).toBeNull();
    expect(directoryPage([], 1)).toEqual([]);
    expect(directoryPagePath(1)).toBe("/stores");
    expect(directoryPagePath(2)).toBe("/stores/page/2");
  });

  it("reads only plain page numbers", () => {
    expect(parseDirectoryPage("2")).toBe(2);
    for (const bad of ["0", "02", "-1", "1.5", "abc", "", "999999"]) expect(parseDirectoryPage(bad), bad).toBeNull();
  });

  it("lists the later pages in both languages and every store's home address in the sitemap", () => {
    const entries = directorySitemapEntries(many);
    const urls = entries.map((e) => e.url);
    expect(urls).toContain(localizedUrl("ar", "/stores/page/2"));
    expect(urls).toContain(localizedUrl("en", "/stores/page/3"));
    expect(urls.some((u) => u.endsWith("/stores"))).toBe(false);
    expect(urls).toContain("https://store000.tallaby.com");
    expect(entries.filter((e) => e.url.endsWith(".tallaby.com"))).toHaveLength(many.length);
    expect(entries.find((e) => e.url === "https://store000.tallaby.com")?.alternates.languages).toEqual({});
  });
});
