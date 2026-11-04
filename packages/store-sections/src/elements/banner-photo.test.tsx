import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { ComponentNode, SectionInstance } from "../config/schema";
import type { RenderContext } from "../core/types";
import { IMAGE_SIZES } from "../core/types";
import { recommendedImageSize } from "./image-size";
import { renderElementTree } from "./render";
import { collectPageCss, isBannerPhoto, keepsBannerOnPhones } from "./style";

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
    expect(css).toMatch(/max-width:767px\)\{[^}]*\[data-node-id="img"\]\{aspect-ratio:21 \/ 9/);
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

describe("banner photos on phones", () => {
  const FILL = { position: "absolute", insetTop: "0px", insetBottom: "0px", insetStart: "0px", insetEnd: "0px" };
  const heading: ComponentNode = { id: "head", type: "heading", props: {}, children: [], style: { color: "white" } } as unknown as ComponentNode;
  const frame = (photo: ComponentNode, frameStyle: Record<string, unknown> = { position: "relative", background: "black" }) =>
    [
      {
        id: "frame",
        type: "div",
        props: {},
        style: frameStyle,
        children: [
          photo,
          { id: "shade", type: "div", props: {}, style: { ...FILL, gradient: "ink-fade" }, children: [] },
          { id: "sticker", type: "badge", props: {}, style: { position: "absolute", insetTop: "8px", insetStart: "8px" }, children: [] },
          { id: "copy", type: "container", props: {}, style: { position: "absolute", insetBottom: "64px" }, breakpointStyles: { mobile: { insetBottom: "88px" } }, children: [heading] },
        ],
      },
    ] as unknown as ComponentNode[];
  const pageCss = (nodes: ComponentNode[]) =>
    collectPageCss([{ id: "s1", componentTree: [{ id: "root", type: "section", props: {}, children: nodes }] } as unknown as SectionInstance]);
  const desktop = (css: string) => css.split("@media (max-width:767px)")[0] ?? "";
  const phoneRule = (css: string, id: string) => {
    const key = `[data-node-id="${id}"]{`;
    const phones = css.slice(css.indexOf("@media (max-width:767px)"));
    const at = phones.indexOf(key);
    return at < 0 ? "" : phones.slice(at + key.length, phones.indexOf("}", at));
  };
  const banner = (mobile?: Record<string, unknown>) => image({ style: { aspectRatio: "banner", objectFit: "cover" }, ...(mobile && { breakpointStyles: { mobile } }) });

  it.each(["portrait", "story", "landscape", undefined])("draws a saved %s phone frame as a banner", (aspectRatio) => {
    const node = banner(aspectRatio ? { aspectRatio } : undefined);
    expect(keepsBannerOnPhones(node)).toBe(true);
    expect(phoneRule(cssFor(node), "img")).toContain("aspect-ratio:21 / 9");
  });

  it("keeps a frame the seller picked, and any other ratio or phone height", () => {
    const pinned = banner({ aspectRatio: "portrait", keepRatio: true });
    expect(keepsBannerOnPhones(pinned)).toBe(false);
    expect(phoneRule(cssFor(pinned), "img")).toContain("aspect-ratio:3 / 4");
    expect(phoneRule(cssFor(banner({ aspectRatio: "square" })), "img")).toContain("aspect-ratio:1 / 1");
    expect(keepsBannerOnPhones(banner({ minHeight: 300 }))).toBe(false);
  });

  it("leaves images that are not plain banners alone", () => {
    expect(keepsBannerOnPhones(image({ style: { aspectRatio: "wide" }, breakpointStyles: { mobile: { aspectRatio: "portrait" } } }))).toBe(false);
    expect(keepsBannerOnPhones(image({ style: { aspectRatio: "banner", minHeight: 640 }, breakpointStyles: { mobile: { aspectRatio: "landscape" } } }))).toBe(false);
    expect(keepsBannerOnPhones({ type: "video", style: { aspectRatio: "banner" }, breakpointStyles: { mobile: { aspectRatio: "story" } } })).toBe(false);
  });

  it("flows the copy under the photo and drops the shade, on phones only", () => {
    const css = pageCss(frame(banner({ aspectRatio: "portrait" })));
    const copy = phoneRule(css, "copy");
    expect(copy).toContain("position:relative");
    expect(copy).toContain("inset-block-end:auto");
    expect(copy).toContain("padding-block-end:88px");
    expect(copy).not.toContain("background");
    expect(phoneRule(css, "shade")).toContain("opacity:0");
    expect(phoneRule(css, "sticker")).toBe("");
    expect(desktop(css)).toContain("inset-block-end:64px");
  });

  it("gives the copy a dark ground when the frame has no colour", () => {
    expect(phoneRule(pageCss(frame(banner({ aspectRatio: "portrait" }), { position: "relative" })), "copy")).toContain("background:#000000");
  });

  it("keeps the copy on the photo when the seller keeps a tall frame", () => {
    const css = pageCss(frame(banner({ aspectRatio: "portrait", keepRatio: true })));
    expect(phoneRule(css, "copy")).toContain("inset-block-end:88px");
    expect(phoneRule(css, "copy")).not.toContain("position:relative");
    expect(phoneRule(css, "shade")).toBe("");
  });

  it("changes nothing above phones", () => {
    const above = (css: string) => css.split("@media (max-width:767px)")[0];
    expect(above(pageCss(frame(banner({ aspectRatio: "portrait" }))))).toBe(above(pageCss(frame(banner({ aspectRatio: "portrait", keepRatio: true })))));
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
      cropsOnPhones: false,
    });
    expect(recommendedImageSize({ style: { aspectRatio: "banner" }, breakpointStyles: { mobile: { aspectRatio: "portrait", keepRatio: true } } })?.cropsOnPhones).toBe(true);
    expect(recommendedImageSize({ style: { aspectRatio: "square" } })).toEqual({ width: 1200, height: 1200, cropsOnPhones: false });
    expect(recommendedImageSize({ style: { aspectRatio: "wide" }, breakpointStyles: { mobile: { aspectRatio: "landscape" } } })?.cropsOnPhones).toBe(true);
  });

  it("has nothing to say about an image with no fixed ratio", () => {
    expect(recommendedImageSize({})).toBeNull();
    expect(recommendedImageSize({ style: { aspectRatio: "auto" } })).toBeNull();
  });
});
