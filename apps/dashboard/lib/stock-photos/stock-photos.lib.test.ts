import { describe, expect, it } from "vitest";
import { cleanQuery, importSource, isPexelsImageUrl, toStockPhoto, type PexelsPhoto } from "./stock-photos.lib";

const photo = (src: PexelsPhoto["src"], extra: Partial<PexelsPhoto> = {}): PexelsPhoto => ({ id: 42, width: 4000, height: 3000, src, ...extra });
const IMG = "https://images.pexels.com/photos/42/x.jpeg";

describe("stock photos", () => {
  it("only trusts https images.pexels.com", () => {
    expect(isPexelsImageUrl(IMG)).toBe(true);
    expect(isPexelsImageUrl("http://images.pexels.com/a.jpg")).toBe(false);
    expect(isPexelsImageUrl("https://images.pexels.com.evil.test/a.jpg")).toBe(false);
    expect(isPexelsImageUrl("https://169.254.169.254/latest")).toBe(false);
    expect(isPexelsImageUrl(undefined)).toBe(false);
  });

  it("cleans queries", () => {
    expect(cleanQuery("  summer   dress ")).toBe("summer dress");
    expect(cleanQuery("x".repeat(200))).toHaveLength(80);
    expect(cleanQuery(3)).toBe("");
  });

  it("maps search results and drops unsafe ones", () => {
    const mapped = toStockPhoto(photo({ medium: IMG }, { avg_color: "#AABBCC", url: "https://www.pexels.com/photo/42/", alt: " Dress " }));
    expect(mapped).toMatchObject({ id: "42", thumbUrl: IMG, avgColor: "#AABBCC", alt: "Dress", pageUrl: "https://www.pexels.com/photo/42/" });
    expect(toStockPhoto(photo({ medium: "https://evil.test/a.jpg" }))).toBeNull();
    expect(toStockPhoto(photo({ medium: IMG }, { avg_color: "red;}", url: "javascript:alert(1)" }))).toMatchObject({ avgColor: null, pageUrl: "https://www.pexels.com/" });
  });

  it("imports the 2x rendition with its fitted size, else the 1x one", () => {
    expect(importSource(photo({ large2x: IMG, large: IMG }))).toEqual({ url: IMG, width: 1733, height: 1300 });
    expect(importSource(photo({ large: IMG }))).toEqual({ url: IMG, width: 867, height: 650 });
    expect(importSource(photo({ large2x: "https://evil.test/x.jpg" }))).toBeNull();
  });
});
