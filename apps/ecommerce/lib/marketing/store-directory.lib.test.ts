import { describe, expect, it } from "vitest";
import { localizedUrl } from "./seo.lib";
import { SITE_URL } from "./site.lib";
import {
  DIRECTORY_PAGE_SIZE,
  type DirectoryStore,
  type DirectoryStoreRow,
  directoryPage,
  directoryPageCount,
  directoryPagePath,
  directorySitemapEntries,
  directoryStores,
  isUploadedLogo,
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
    expect(LOGO_STRIP_MIN_PRODUCTS).toBe(5);
    const picked = selectLogoStrip([store("A", 5), store("B", 4), store("C", 40, false), store("D", 25), store("E", 6), store("F", 7)]);
    expect(picked.map((s) => s.name)).toEqual(["D", "F", "E", "A"]);
  });

  it("leaves out a store whose logo is not a real upload", () => {
    const bad = (name: string, logoUrl: string): DirectoryStore => ({ ...store(name, 50), logoUrl });
    const picked = selectLogoStrip([
      store("A", 20),
      store("B", 20),
      store("C", 20),
      store("D", 20),
      bad("Empty", ""),
      bad("Folder", "https://x.supabase.co/storage/v1/object/public/sellers/"),
      bad("Doubled", "https://x.supabase.co/storage/v1/object/public/sellers//logo.png"),
      bad("Placeholder", "https://cdn.example/placeholder.png"),
      bad("Default", "https://cdn.example/img/default-logo.webp"),
    ]);
    expect(picked.map((s) => s.name)).toEqual(["A", "B", "C", "D"]);
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

describe("isUploadedLogo", () => {
  it("accepts an https image file and nothing else", () => {
    expect(isUploadedLogo("https://x.supabase.co/storage/v1/object/public/sellers/logos/u1/a.png")).toBe(true);
    expect(isUploadedLogo("https://shop.example/wp-content/uploads/2026/09/logo-removed-bg.png")).toBe(true);
    expect(isUploadedLogo(null)).toBe(false);
    expect(isUploadedLogo("")).toBe(false);
    expect(isUploadedLogo("logos/a.png")).toBe(false);
    expect(isUploadedLogo("http://cdn.example/a.png")).toBe(false);
    expect(isUploadedLogo("https://cdn.example/")).toBe(false);
    expect(isUploadedLogo("https://cdn.example/no-image.jpg")).toBe(false);
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

  it("lists every directory page in both languages in the sitemap, and no store address", () => {
    const entries = directorySitemapEntries([...many, { ...many[0]!, name: "Own", url: "https://faster-eg.com" }]);
    const urls = entries.map((e) => e.url);
    expect(urls).toContain(localizedUrl("ar", "/stores"));
    expect(urls).toContain(localizedUrl("en", "/stores"));
    expect(urls).toContain(localizedUrl("ar", "/stores/page/2"));
    expect(urls).toContain(localizedUrl("en", "/stores/page/3"));
    expect(entries.find((e) => e.url === localizedUrl("ar", "/stores"))?.alternates.languages.en).toBe(localizedUrl("en", "/stores"));
    expect(urls).toHaveLength(3 * 2);
    for (const url of urls) expect(new URL(url).host, url).toBe(new URL(SITE_URL).host);
  });

  it("lists page 1 for an empty directory", () => {
    expect(directorySitemapEntries([]).map((e) => e.url).sort()).toEqual([localizedUrl("en", "/stores"), localizedUrl("ar", "/stores")].sort());
  });
});
