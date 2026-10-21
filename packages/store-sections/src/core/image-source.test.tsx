import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { SectionImage } from "../sections/_primitives";
import { IMAGE_SIZES, imageSource, type RenderContext } from "./types";

const optimizeImage = (url: string, sizes: string) => ({ src: `/_next/image?url=${encodeURIComponent(url)}&w=3840&q=75`, srcSet: `/_next/image?url=x&w=640&q=75 640w`, sizes });

describe("imageSource", () => {
  it("keeps the URL when the host has no optimizer (editor, previews)", () => {
    expect(imageSource({}, "https://x.test/a.jpg", IMAGE_SIZES.card)).toEqual({ src: "https://x.test/a.jpg" });
  });

  it("uses the host optimizer with the given sizes", () => {
    const out = imageSource({ optimizeImage }, "https://x.test/a.jpg", IMAGE_SIZES.content);
    expect(out.src).toContain("/_next/image?url=");
    expect(out.sizes).toBe(IMAGE_SIZES.content);
    expect(out.srcSet).toContain("640w");
  });
});

describe("SectionImage", () => {
  const ctx = { imageUrl: (src: string | null | undefined) => src ?? null } as unknown as RenderContext;

  it("renders the plain URL without an optimizer", () => {
    const html = renderToStaticMarkup(<SectionImage ctx={ctx} src="https://x.test/p.jpg" alt="P" />);
    expect(html).toContain('src="https://x.test/p.jpg"');
    expect(html).not.toContain("srcSet");
    expect(html).not.toContain("srcset");
  });

  it("renders srcset and the card sizes with an optimizer", () => {
    const html = renderToStaticMarkup(<SectionImage ctx={{ ...ctx, optimizeImage }} src="https://x.test/p.jpg" alt="P" />);
    expect(html).toContain("/_next/image?url=");
    expect(html).toContain("srcSet=");
    expect(html).toContain(`sizes="${IMAGE_SIZES.card}"`);
  });
});
