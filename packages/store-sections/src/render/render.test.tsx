import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { ComponentNode, PageContent, SectionInstance } from "../config/schema";
import { validateSiteConfig } from "../config/validate";
import { FONT_PAIRINGS, findFontPairing, storeFontFamily } from "../core/fonts";
import { designSystemToCss, designSystemToTokens } from "../core/theme";
import type { PublicStoreForm, RenderContext } from "../core/types";
import { STORE_SECTIONS, storeSectionRegistry } from "../sections";
import { FormFieldsView } from "../sections/forms";
import { PageRenderer, SectionRenderer, SiteTheme } from "./render";

function makeCtx(overrides: Partial<RenderContext> = {}): RenderContext {
  return {
    mode: "public",
    locale: "ar",
    dir: "rtl",
    store: { name: "متجر سارة", url: "https://sara.tallaby.com" },
    pages: [{ name: "الرئيسية", href: "/", isHome: true }],
    catalog: { products: {}, categories: [] },
    Link: ({ href, className, children }) => (
      <a href={href} className={className} data-host-link>
        {children}
      </a>
    ),
    imageUrl: (src) => (src ? (src.startsWith("http") ? src : `https://cdn.test/${src}`) : null),
    formatPrice: (n) => `${n.toFixed(2)} EGP`,
    ...overrides,
  };
}

const node = (id: string, type: string, props: Record<string, unknown> = {}, children: ComponentNode[] = []): ComponentNode =>
  ({ id, type, props, children }) as ComponentNode;

/** A tree section: a section root holding `children`. */
const tree = (id: string, children: ComponentNode[], extra: Partial<SectionInstance> = {}): SectionInstance => ({
  id,
  sectionId: "custom-section",
  version: 1,
  props: {},
  componentTree: [node(`${id}-root`, "section", {}, children)],
  ...extra,
});

const html = (element: React.ReactElement) => renderToStaticMarkup(element);
const render = (instance: SectionInstance, ctx = makeCtx()) => html(<SectionRenderer instance={instance} registry={storeSectionRegistry} ctx={ctx} />);

describe("section registry", () => {
  it("holds only tree sections", () => {
    expect(STORE_SECTIONS.map((d) => d.id)).toEqual(["custom-section"]);
  });

  it("rejects any other section at publish", () => {
    const config = {
      schemaVersion: 1,
      pages: [{ slug: "home", isHome: true, name: "Home", content: { sections: [{ id: "s1", sectionId: "hero-banner", version: 1, props: {} }] } }],
    };
    const result = validateSiteConfig(config, { allowedSections: storeSectionRegistry.allowedSections() });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.issues.map((i) => i.code)).toContain("unknown_section");
  });
});

describe("SectionRenderer", () => {
  it("skips unknown and removed sections", () => {
    expect(render({ id: "s1", sectionId: "custom-html", version: 1, props: { html: "<script>" } })).toBe("");
    expect(render({ id: "s2", sectionId: "classic-hero", version: 1, props: {} })).toBe("");
  });

  it("never renders dangerous links", () => {
    const markup = render(tree("s1", [node("b", "button", { label: "Go", href: "javascript:alert(1)" }), node("l", "textLink", { text: "x", href: "javascript:x" })]));
    expect(markup).not.toContain("javascript:");
  });

  it("escapes seller text instead of rendering HTML", () => {
    const markup = render(tree("s1", [node("h", "heading", { text: "<img src=x onerror=alert(1)>" })]));
    expect(markup).not.toContain("<img src=x");
    expect(markup).toContain("&lt;img");
  });

  it("applies the English overlay on the English site only", () => {
    const section = tree("s1", [node("h", "heading", { text: "عنوان", translations: { en: { text: "Title" } } })]);
    expect(render(section)).toContain("عنوان");
    expect(render(section, makeCtx({ locale: "en", dir: "ltr" }))).toContain("Title");
  });

  it("uses the host Link for internal links and a plain anchor for external ones", () => {
    const markup = render(tree("s1", [node("a", "textLink", { text: "in", href: "/about" }), node("b", "textLink", { text: "out", href: "https://instagram.com/sara" })]));
    expect(markup).toMatch(/href="\/about"[^>]*data-host-link/);
    expect(markup).toContain('href="https://instagram.com/sara"');
    expect(markup).toContain('rel="noopener noreferrer"');
  });
});

describe("PageRenderer and theme", () => {
  it("renders header, sections in order, and footer", () => {
    const text = (id: string) => node(`${id}-t`, "text", { text: id });
    const content: PageContent = { sections: [tree("a", [text("A")]), tree("b", [text("B")])] };
    const markup = html(
      <PageRenderer content={content} header={tree("hdr", [text("HDR")])} footer={tree("ftr", [text("FTR")])} registry={storeSectionRegistry} ctx={makeCtx()} />,
    );
    const order = ["HDR", ">A<", ">B<", "FTR"].map((needle) => markup.indexOf(needle));
    expect(order.every((i) => i >= 0)).toBe(true);
    expect([...order].sort((x, y) => x - y)).toEqual(order);
  });

  it("maps the design system onto the store tokens", () => {
    const css = designSystemToCss({ colors: { primary: "#ff0000", background: "#ffffff" }, spacing: { borderRadius: 4 } });
    expect(css).toBe(
      ".sf-site { --sf-brand: #ff0000; --primary: #ff0000; --sf-paper: #ffffff; --background: #ffffff; --sf-brand-ink: #ffffff; --primary-foreground: #ffffff; --sf-radius: 4px; }",
    );
    expect(designSystemToCss(null)).toBe("");
    expect(designSystemToCss({ colors: { primary: "red;}</style><script>" }, spacing: {} })).toBe("");
    expect(html(<SiteTheme designSystem={{ colors: {}, spacing: {} }} />)).toBe("");
  });

  it("uses dark text on a light brand color (P4-13)", () => {
    const tokens = designSystemToTokens({ colors: { primary: "#ffe066" }, spacing: {} });
    expect(tokens["--sf-brand-ink"]).toBe("#10242b");
    expect(designSystemToTokens({ colors: { primary: "oklch(0.7 0.1 200)" }, spacing: {} })["--sf-brand-ink"]).toBeUndefined();
  });

  it("maps only fonts the storefront loads (P4-13)", () => {
    const tokens = designSystemToTokens({ colors: {}, spacing: {}, typography: { headingFont: "El Messiri", bodyFont: "Cairo" } });
    expect(tokens["--sf-font-heading"]).toBe("var(--font-sf-el-messiri), system-ui, sans-serif");
    expect(tokens["--sf-font-body"]).toBe("var(--font-sf-cairo), system-ui, sans-serif");
    const unknown = designSystemToTokens({ colors: {}, spacing: {}, typography: { headingFont: "Comic Sans", bodyFont: "Papyrus" } });
    expect(unknown).toEqual({});
    expect(findFontPairing({ headingFont: "Noto Kufi Arabic", bodyFont: "IBM Plex Sans Arabic" }).id).toBe("kufi");
    expect(findFontPairing({}).id).toBe("classic");
    expect(FONT_PAIRINGS.every((p) => storeFontFamily(p.heading) && storeFontFamily(p.body))).toBe(true);
  });
});

describe("form fields (storefront forms and editor preview)", () => {
  const form: PublicStoreForm = {
    id: "33333333-3333-4333-8333-333333333333",
    fields: [
      { key: "name", type: "text", label: "الاسم", required: true, width: "half" },
      { key: "email", type: "email", label: "البريد <b>", required: false, width: "half" },
      { key: "topic", type: "select", label: "الموضوع", required: false, width: "full", options: ["طلب", "أخرى"] },
    ],
    submitLabel: "",
    successMessage: "",
  };

  it("draws escaped, disabled fields for a preview", () => {
    const markup = html(<FormFieldsView form={form} idPrefix="f" locale="ar" disabled />);
    expect(markup).toContain('name="name"');
    expect(markup).toContain("disabled");
    expect(markup).toContain("البريد &lt;b&gt;");
    expect(markup).toContain("<option");
  });
});
