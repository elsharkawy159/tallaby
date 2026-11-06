import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { ComponentNode, SectionInstance } from "../config/schema";
import type { RenderContext } from "../core/types";
import { PageRenderer, SectionRenderer } from "../render/render";
import { storeSectionRegistry } from "../sections";

/** The page's first section (the hero) paints at once: eager, high-priority photos and no reveal (LCP). */
let n = 0;
const node = (type: string, props: Record<string, unknown> = {}, children: ComponentNode[] = []): ComponentNode => ({
  id: `af${++n}`,
  type: type as ComponentNode["type"],
  props,
  children,
});

const ctx = (over: Partial<RenderContext> = {}): RenderContext => ({
  mode: "public",
  reveal: true,
  locale: "ar",
  dir: "rtl",
  store: { name: "S", url: "https://s.test" },
  pages: [],
  catalog: { products: {}, categories: [] },
  Link: ({ href, className, children }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
  imageUrl: (src) => (src ? `https://cdn/${src}` : null),
  formatPrice: (v) => `${v}`,
  ...over,
});

const custom = (id: string, tree: ComponentNode[], style?: SectionInstance["style"]): SectionInstance => ({
  id,
  sectionId: "custom-section",
  version: 1,
  props: {},
  componentTree: tree,
  ...(style && { style }),
});

const hero = () =>
  custom("hero", [
    node("section", {}, [
      node("image", { src: "hero.jpg", alt: "Hero" }),
      node("heading", { level: "h2", text: "Big sale" }),
      node("paragraph", { text: "Up to 50%" }),
      node("button", { label: "Shop", href: "/products" }),
    ]),
  ]);
const lower = () => custom("lower", [node("section", {}, [node("image", { src: "lower.jpg", alt: "Lower" }), node("paragraph", { text: "More" })])]);

/** The `<img>` tag whose src holds `file`. */
const imgTag = (html: string, file: string) => html.match(new RegExp(`<img[^>]*src="https://cdn/${file.replace(".", "\\.")}"[^>]*>`))?.[0] ?? "";
const sectionHtml = (html: string, id: string) => html.split(`data-section-id="${id}"`)[1]?.split("data-section-id=")[0] ?? "";

describe("above the fold (the page's first section)", () => {
  it("loads the first section's photo eagerly with high priority and keeps later photos lazy", () => {
    const html = renderToStaticMarkup(<PageRenderer content={{ sections: [hero(), lower()] }} registry={storeSectionRegistry} ctx={ctx()} />);
    const first = imgTag(html, "hero.jpg");
    expect(first).toContain('loading="eager"');
    expect(first).toContain('fetchPriority="high"');
    const later = imgTag(html, "lower.jpg");
    expect(later).toContain('loading="lazy"');
    expect(later).not.toContain("fetchPriority");
  });

  it("never hides the first section behind a reveal; later sections still reveal", () => {
    const html = renderToStaticMarkup(<PageRenderer content={{ sections: [hero(), lower()] }} registry={storeSectionRegistry} ctx={ctx()} />);
    expect(sectionHtml(html, "hero")).not.toContain("data-reveal");
    expect(sectionHtml(html, "hero")).not.toMatch(/opacity:\s*0/);
    expect(sectionHtml(html, "lower")).toContain('data-reveal="zoom-in"');
    expect(sectionHtml(html, "lower")).toContain('data-reveal="fade-up"');
  });

  it("is off unless the host marks the section: a lone SectionRenderer stays lazy and revealed", () => {
    const html = renderToStaticMarkup(<SectionRenderer instance={hero()} registry={storeSectionRegistry} ctx={ctx()} />);
    expect(imgTag(html, "hero.jpg")).toContain('loading="lazy"');
    expect(html).toContain("data-reveal");
    const marked = renderToStaticMarkup(<SectionRenderer instance={hero()} registry={storeSectionRegistry} ctx={ctx()} aboveFold />);
    expect(imgTag(marked, "hero.jpg")).toContain('fetchPriority="high"');
  });

  it("does not leak to the next section when a caller passes a context that already has it", () => {
    const html = renderToStaticMarkup(<SectionRenderer instance={lower()} registry={storeSectionRegistry} ctx={ctx({ aboveFold: true })} />);
    expect(imgTag(html, "lower.jpg")).toContain('loading="lazy"');
  });

  it("in a carousel, only the first slide's photo is eager", () => {
    const carousel = custom("c", [
      node("section", {}, [
        node("carousel", {}, [
          node("slide", {}, [node("image", { src: "s1.jpg", alt: "" })]),
          node("slide", {}, [node("image", { src: "s2.jpg", alt: "" })]),
          node("slide", {}, [node("image", { src: "s3.jpg", alt: "" })]),
        ]),
      ]),
    ]);
    const html = renderToStaticMarkup(<PageRenderer content={{ sections: [carousel] }} registry={storeSectionRegistry} ctx={ctx()} />);
    expect(imgTag(html, "s1.jpg")).toContain('fetchPriority="high"');
    for (const file of ["s2.jpg", "s3.jpg"]) {
      expect(imgTag(html, file)).toContain('loading="lazy"');
      expect(imgTag(html, file)).not.toContain("fetchPriority");
    }
  });

  it("loads the first section's background photo eagerly too", () => {
    const withBg = custom("bg", [node("section", {}, [node("paragraph", { text: "Hi" })])], { shell: { bgImage: "bg.jpg" } } as SectionInstance["style"]);
    const html = renderToStaticMarkup(<PageRenderer content={{ sections: [withBg, lower()] }} registry={storeSectionRegistry} ctx={ctx()} />);
    const bg = imgTag(html, "bg.jpg");
    expect(bg).toContain('fetchPriority="high"');
    expect(imgTag(html, "lower.jpg")).toContain('loading="lazy"');
  });
});
