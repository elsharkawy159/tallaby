import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { ComponentNode, SectionInstance } from "../config/schema";
import type { RenderContext } from "../core/types";
import { IMAGE_SIZES } from "../core/types";
import { recommendedImageSize } from "./image-size";
import { renderElementTree } from "./render";
import { collectPageCss, isBannerPhoto } from "./style";

const image = (over: Partial<ComponentNode> = {}): ComponentNode =>
  ({ id: "img", type: "image", props: { src: "https://x.test/a.jpg", alt: "" }, children: [], ...over }) as ComponentNode;

const cssFor = (node: ComponentNode) =>
  collectPageCss([{ id: "s1", componentTree: [{ id: "root", type: "section", props: {}, children: [node] }] } as unknown as SectionInstance]);

const rule = '[data-node-id="img"]';

describe("banner photos across screens", () => {
  it("adds a 16:9 tablet ratio to a banner with none, without touching the saved node", () => {
    const node = image({ style: { aspectRatio: "banner", objectFit: "cover" }, breakpointStyles: { mobile: { aspectRatio: "portrait" } } });
    const css = cssFor(node);
    expect(css).toContain(`@media (max-width:1023px){.`);
    expect(css).toMatch(/max-width:1023px\)\{[^}]*\[data-node-id="img"\]\{aspect-ratio:16 \/ 9/);
    expect(css).toMatch(/max-width:767px\)\{[^}]*\[data-node-id="img"\]\{aspect-ratio:3 \/ 4/);
    expect(node.breakpointStyles).toEqual({ mobile: { aspectRatio: "portrait" } });
  });

  it("keeps the design's own tablet ratio", () => {
    const css = cssFor(image({ style: { aspectRatio: "banner" }, breakpointStyles: { tablet: { aspectRatio: "landscape" } } }));
    expect(css).toContain("aspect-ratio:4 / 3");
    expect(css).not.toContain("aspect-ratio:16 / 9");
  });

  it("never makes a banner taller than the screen", () => {
    expect(cssFor(image({ style: { aspectRatio: "banner" } }))).toContain(`${rule}{max-height:100vh;max-height:100svh}`);
  });

  it("leaves other images alone", () => {
    const css = cssFor(image({ style: { aspectRatio: "portrait", objectFit: "cover" } }));
    expect(css).not.toContain("max-height");
    expect(css).not.toContain("16 / 9");
    expect(isBannerPhoto({ type: "video", style: { aspectRatio: "banner" } })).toBe(false);
  });

  it("crops an image with a frame but no fit, and keeps a fit it set", () => {
    expect(cssFor(image({ style: { aspectRatio: "square" } }))).toContain("object-fit:cover");
    expect(cssFor(image({ breakpointStyles: { mobile: { aspectRatio: "square" } } }))).toContain("object-fit:cover");
    expect(cssFor(image({ style: { minHeight: 300 } }))).toContain("object-fit:cover");
    const contain = cssFor(image({ style: { aspectRatio: "square", objectFit: "contain" } }));
    expect(contain).toContain("object-fit:contain");
    expect(contain).not.toContain("object-fit:cover");
    expect(cssFor(image({ style: { radius: 8 } }))).not.toContain("object-fit");
    expect(cssFor({ ...image({ style: { aspectRatio: "square" } }), type: "div" })).not.toContain("object-fit");
  });
});

describe("image element", () => {
  const ctx = {
    mode: "public",
    locale: "en",
    imageUrl: (url: string) => url,
    optimizeImage: (url: string, sizes: string) => ({ src: url, sizes }),
  } as unknown as RenderContext;
  const html = (node: ComponentNode) => renderToStaticMarkup(<>{renderElementTree([node], ctx)}</>);

  it("asks for a full-screen file for a banner, not one capped at the page width", () => {
    expect(html(image({ style: { aspectRatio: "banner" } }))).toContain(`sizes="${IMAGE_SIZES.full}"`);
    expect(html(image({ style: { aspectRatio: "wide" } }))).toContain(`sizes="${IMAGE_SIZES.content}"`);
  });

});

describe("recommendedImageSize", () => {
  it("follows the image's ratio", () => {
    expect(recommendedImageSize({ style: { aspectRatio: "banner" }, breakpointStyles: { mobile: { aspectRatio: "portrait" } } })).toEqual({
      width: 2100,
      height: 900,
      cropsOnPhones: true,
    });
    expect(recommendedImageSize({ style: { aspectRatio: "square" } })).toEqual({ width: 1200, height: 1200, cropsOnPhones: false });
    expect(recommendedImageSize({ style: { aspectRatio: "wide" }, breakpointStyles: { mobile: { aspectRatio: "landscape" } } })?.cropsOnPhones).toBe(true);
  });

  it("has nothing to say about an image with no fixed ratio", () => {
    expect(recommendedImageSize({})).toBeNull();
    expect(recommendedImageSize({ style: { aspectRatio: "auto" } })).toBeNull();
  });
});
