import { describe, expect, it } from "vitest";
import { isOptimizableStoreImage, optimizeStoreImage } from "./optimize-image.lib";

const SUPABASE = "https://sakwqwocbccpyrmwjowq.supabase.co/storage/v1/object/public/sellers/a.jpg";

describe("isOptimizableStoreImage", () => {
  it("allows our storage, the stock photo hosts and local files", () => {
    expect(isOptimizableStoreImage(SUPABASE)).toBe(true);
    expect(isOptimizableStoreImage("https://cxqjrwjianxskhzmrkla.supabase.co/storage/v1/object/public/x.png?v=1")).toBe(true);
    expect(isOptimizableStoreImage("https://images.pexels.com/photos/1/p.jpeg?auto=compress")).toBe(true);
    expect(isOptimizableStoreImage("/banner.jpg")).toBe(true);
  });

  it("serves any other host, SVG, GIF and protocol-relative URLs as is", () => {
    expect(isOptimizableStoreImage("https://cdn.shop.example/p.jpg")).toBe(false);
    expect(isOptimizableStoreImage("http://images.pexels.com/p.jpg")).toBe(false);
    expect(isOptimizableStoreImage("https://images.pexels.com/logo.svg")).toBe(false);
    expect(isOptimizableStoreImage(`${SUPABASE.replace(".jpg", ".gif")}?v=2`)).toBe(false);
    expect(isOptimizableStoreImage("//evil.example/p.jpg")).toBe(false);
  });
});

describe("optimizeStoreImage", () => {
  it("returns next/image src, srcSet and sizes for an allowed host", () => {
    const out = optimizeStoreImage(SUPABASE, "50vw");
    expect(out.src).toContain("/_next/image?url=");
    expect(out.srcSet).toMatch(/\d+w/);
    expect(out.sizes).toBe("50vw");
  });

  it("returns the URL unchanged for any other host", () => {
    expect(optimizeStoreImage("https://cdn.shop.example/p.jpg", "50vw")).toEqual({ src: "https://cdn.shop.example/p.jpg" });
  });
});
