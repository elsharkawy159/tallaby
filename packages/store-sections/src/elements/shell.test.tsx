import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { sanitizeSiteConfig } from "../config/sanitize";
import type { SectionInstance, SiteConfig } from "../config/schema";
import type { RenderContext } from "../core/types";
import { SectionRenderer } from "../render/render";
import { DataEmpty } from "../sections/_data";
import { storeSectionRegistry } from "../sections";
import { normalizeShell, shellLayout } from "./shell";
import { collectPageCss } from "./style";

const ctx: RenderContext = {
  mode: "public",
  locale: "en",
  dir: "ltr",
  store: { name: "Shop", url: "https://x.tallaby.com" },
  pages: [],
  catalog: { products: {}, categories: [] },
  Link: ({ href, children }) => <a href={href}>{children}</a>,
  imageUrl: (src) => (src ? (src.startsWith("http") ? src : `https://cdn.test/${src}`) : null),
  formatPrice: (n) => `${n}`,
};

const rich: SectionInstance = {
  id: "s1",
  sectionId: "custom-section",
  version: 1,
  props: {},
  componentTree: [{ id: "r", type: "section", props: {}, children: [{ id: "t", type: "text", props: { text: "x" }, children: [] }] }],
};

describe("normalizeShell", () => {
  it("keeps valid values and drops defaults and junk", () => {
    expect(normalizeShell(undefined)).toBeUndefined();
    expect(normalizeShell({ scheme: "default", width: "contained", animation: "none" })).toBeUndefined();
    expect(
      normalizeShell({ scheme: "dark", paddingY: "lg", width: "full", anchor: "about-us", animation: "rise", bgImage: "media/a.jpg", overlay: 55.4 }),
    ).toEqual({ scheme: "dark", paddingY: "lg", width: "full", anchor: "about-us", animation: "rise", bgImage: "media/a.jpg", overlay: 55 });
  });

  it("rejects unsafe images, anchors and values", () => {
    expect(normalizeShell({ bgImage: "javascript:alert(1)" })).toBeUndefined();
    expect(normalizeShell({ bgImage: "data:image/png;base64,AAAA" })).toBeUndefined();
    expect(normalizeShell({ bgImage: "//evil.test/a.png" })).toBeUndefined();
    expect(normalizeShell({ bgImage: "a b.png" })).toBeUndefined();
    expect(normalizeShell({ anchor: "1bad" })).toBeUndefined();
    expect(normalizeShell({ anchor: 'x"><script>' })).toBeUndefined();
    expect(normalizeShell({ scheme: "neon", paddingY: "huge" })).toBeUndefined();
    expect(normalizeShell({ bgImage: "a.jpg", overlay: 400 })).toEqual({ bgImage: "a.jpg", overlay: 80 });
    // An overlay without an image means nothing.
    expect(normalizeShell({ overlay: 30 })).toBeUndefined();
  });

  it("survives the sanitizer on the base style and is dropped from device overrides", () => {
    const config = {
      schemaVersion: 1,
      designSystem: { colors: {}, typography: {}, spacing: {} },
      header: null,
      footer: null,
      settings: { defaultLocale: "ar", locales: ["ar"] },
      pages: [
        {
          slug: "home",
          isHome: true,
          name: "Home",
          seo: {},
          content: { sections: [{ ...rich, style: { shell: { scheme: "muted", evil: 1 } }, breakpointStyles: { mobile: { shell: { scheme: "dark" }, paddingTop: 4 } } }] },
        },
      ],
    } as unknown as SiteConfig;
    const section = sanitizeSiteConfig(config).pages[0]!.content.sections[0]!;
    expect(section.style).toEqual({ shell: { scheme: "muted" } });
    expect(section.breakpointStyles).toEqual({ mobile: { paddingTop: 4 } });
  });
});

describe("shell rendering", () => {
  it("leaves the wrapper untouched without a shell", () => {
    const out = renderToStaticMarkup(<SectionRenderer instance={rich} registry={storeSectionRegistry} ctx={ctx} />);
    expect(out.startsWith('<div data-section-id="s1" data-section-type="custom-section"><section')).toBe(true);
  });

  it("sets spacing and width tokens, the anchor and the scheme", () => {
    const instance = { ...rich, style: { shell: { paddingY: "xl", width: "wide", anchor: "story", scheme: "dark" } } };
    const out = renderToStaticMarkup(<SectionRenderer instance={instance} registry={storeSectionRegistry} ctx={ctx} />);
    expect(out).toContain('id="story"');
    expect(out).toContain("--sf-section-y:112px");
    expect(out).toContain("--sf-max-width:1440px");
    expect(out).toContain("--sf-shell-bg:var(--sf-ink)");
    // Tokens are re-mapped on an inner element, never on the element that captures them.
    expect(out).toMatch(/<div style="--sf-ink:var\(--sf-shell-fg\)/);
  });

  it("draws the background image as an image layer with an overlay", () => {
    const instance = { ...rich, style: { shell: { bgImage: "media/bg.jpg", overlay: 30 } } };
    const out = renderToStaticMarkup(<SectionRenderer instance={instance} registry={storeSectionRegistry} ctx={ctx} />);
    expect(out).toContain('src="https://cdn.test/media/bg.jpg"');
    expect(out).toContain("rgb(0 0 0 / 30%)");
    expect(out).toContain("relative isolate");
    expect(out).not.toContain("url(");
  });

  it("emits a reduced-motion-safe entrance on the storefront only", () => {
    const instance = { ...rich, style: { shell: { animation: "rise" } } };
    const css = collectPageCss([instance], "public");
    expect(css).toContain("prefers-reduced-motion:no-preference");
    expect(css).toContain("animation-timeline:view()");
    expect(css).toContain('[data-section-id="s1"]');
    expect(collectPageCss([instance], "edit")).toBe("");
  });

  it("maps the primary scheme so solid buttons invert", () => {
    const layout = shellLayout({ scheme: "primary" }, () => null)!;
    expect(layout.inner?.["--sf-brand"]).toBe("var(--sf-shell-fg)");
    expect(layout.outer.style?.background).toBe("var(--sf-shell-bg)");
  });
});

describe("DataEmpty", () => {
  const edit = (state: "ready" | "refreshing" | "error" | null): RenderContext => ({
    ...ctx,
    mode: "edit",
    editorData: state
      ? {
          state,
          renderAction: (need, label) => <a href={`/manage/${need}`} target="_blank" rel="noopener noreferrer">{label}</a>,
          renderRetry: (label) => <button type="button">{label}</button>,
        }
      : undefined,
  });

  it("never renders on the storefront", () => {
    expect(renderToStaticMarkup(<DataEmpty need="products" ctx={ctx} />)).toBe("");
  });

  it("shows the empty state with the host's action", () => {
    const out = renderToStaticMarkup(<DataEmpty need="products" ctx={edit("ready")} />);
    expect(out).toContain("Add products to show here");
    expect(out).toContain('href="/manage/products"');
    expect(out).toContain('target="_blank"');
  });

  it("shows an error with retry, not the empty state, after a failed request", () => {
    const out = renderToStaticMarkup(<DataEmpty need="products" ctx={edit("error")} />);
    expect(out).toContain("Couldn&#x27;t load your store data");
    expect(out).toContain("Try again");
    expect(out).not.toContain("Add products");
  });

  it("shows the error only for the source that failed", () => {
    const ctxWithFailure: RenderContext = { ...edit("ready"), editorData: { ...edit("ready").editorData!, failed: ["brands"] } };
    expect(renderToStaticMarkup(<DataEmpty need="brands" ctx={ctxWithFailure} />)).toContain("Try again");
    expect(renderToStaticMarkup(<DataEmpty need="products" ctx={ctxWithFailure} />)).toContain("Add products to show here");
  });

  it("shows a loading state while refreshing", () => {
    const out = renderToStaticMarkup(<DataEmpty need="products" ctx={edit("refreshing")} />);
    expect(out).toContain('role="status"');
    expect(out).not.toContain("Add products");
  });

  it("explains filters instead of asking for new records", () => {
    const out = renderToStaticMarkup(<DataEmpty need="products" ctx={edit("ready")} filtered />);
    expect(out).toContain("No products match this choice");
  });

  it("still explains without host actions (thumbnails)", () => {
    const out = renderToStaticMarkup(<DataEmpty need="brands" ctx={edit(null)} />);
    expect(out).toContain("Add brands to show here");
    expect(out).not.toContain("<a");
  });
});
