import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { PageContent, SectionInstance } from "../config/schema";
import { validateSiteConfig } from "../config/validate";
import { collectCatalogQueries, collectFormIds } from "../core/registry";
import { FONT_PAIRINGS, findFontPairing, storeFontFamily } from "../core/fonts";
import { designSystemToCss, designSystemToTokens } from "../core/theme";
import type { PublicStoreForm, RenderContext } from "../core/types";
import { STORE_SECTIONS, storeSectionRegistry } from "../sections";
import { PageRenderer, SectionRenderer, SiteTheme } from "./render";

const P1 = "11111111-1111-4111-8111-111111111111";
const C1 = "22222222-2222-4222-8222-222222222222";

function makeCtx(overrides: Partial<RenderContext> = {}): RenderContext {
  return {
    mode: "public",
    locale: "ar",
    dir: "rtl",
    store: {
      name: "متجر سارة",
      url: "https://sara.tallaby.com",
      contact: { phone: "01012345678", email: "hi@sara.test" },
      social: [{ platform: "instagram", url: "https://instagram.com/sara" }],
      policies: [{ key: "return", href: "/returns" }],
    },
    pages: [
      { name: "الرئيسية", href: "/", isHome: true },
      { name: "من نحن", href: "/about", isHome: false },
    ],
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

const instance = (sectionId: string, props: Record<string, unknown> = {}, extra: Partial<SectionInstance> = {}): SectionInstance => ({
  id: `s-${sectionId}`,
  sectionId,
  version: 1,
  props,
  ...extra,
});

const html = (node: React.ReactElement) => renderToStaticMarkup(node);

describe("section library", () => {
  it("has unique ids and every default passes its own schema", () => {
    expect(new Set(STORE_SECTIONS.map((d) => d.id)).size).toBe(STORE_SECTIONS.length);
    for (const definition of STORE_SECTIONS) {
      const parsed = definition.propsSchema.safeParse(definition.defaultProps);
      expect(parsed.success, definition.id).toBe(true);
      for (const prop of definition.propDefinitions) expect(definition.defaultProps, `${definition.id}.${prop.key}`).toHaveProperty(prop.key);
      for (const collection of definition.itemCollections ?? []) {
        const withNew = { ...definition.defaultProps, [collection.key]: [collection.newItemTemplate()] };
        expect(definition.propsSchema.safeParse(withNew).success, `${definition.id}.${collection.key}`).toBe(true);
      }
      expect(definition.displayName.ar && definition.displayName.en).toBeTruthy();
    }
  });

  it("lists every section for publish validation", () => {
    const allowed = storeSectionRegistry.allowedSections();
    expect(Object.keys(allowed).sort()).toEqual(STORE_SECTIONS.map((d) => d.id).sort());
    const config = {
      schemaVersion: 1,
      pages: [{ slug: "home", isHome: true, name: "Home", content: { sections: [instance("hero-banner"), instance("custom-html")] } }],
    };
    const result = validateSiteConfig(config, { allowedSections: allowed });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.issues.map((i) => i.code)).toContain("unknown_section");
  });

  it.each(STORE_SECTIONS.map((d) => d.id))("%s renders its defaults in Arabic and English", (id) => {
    for (const locale of ["ar", "en"] as const) {
      const markup = html(<SectionRenderer instance={instance(id)} registry={storeSectionRegistry} ctx={makeCtx({ locale, dir: locale === "ar" ? "rtl" : "ltr" })} />);
      expect(markup).toContain(`data-section-type="${id}"`);
    }
  });
});

describe("SectionRenderer", () => {
  it("skips unknown sections", () => {
    expect(html(<SectionRenderer instance={instance("custom-html", { html: "<script>" })} registry={storeSectionRegistry} ctx={makeCtx()} />)).toBe("");
  });

  it("drops invalid props and never renders dangerous links", () => {
    const markup = html(
      <SectionRenderer
        instance={instance("hero-banner", { title: 42, ctaLabel: "Go", ctaHref: "javascript:alert(1)" })}
        registry={storeSectionRegistry}
        ctx={makeCtx()}
      />,
    );
    expect(markup).not.toContain("javascript:");
    expect(markup).not.toContain("Go</a>");
    // A field of the wrong type is dropped; the rest of the section still renders.
    expect(markup).not.toContain(">42<");
    expect(markup).toContain("منتجات مختارة بعناية");
  });

  it("escapes seller text instead of rendering HTML", () => {
    const markup = html(<SectionRenderer instance={instance("rich-text", { title: "<img src=x onerror=alert(1)>" })} registry={storeSectionRegistry} ctx={makeCtx()} />);
    expect(markup).not.toContain("<img src=x");
    expect(markup).toContain("&lt;img");
  });

  it("applies the English overlay on the English site only", () => {
    const hero = instance("hero-banner", { title: "عنوان" }, { translations: { en: { title: "Title" } } });
    expect(html(<SectionRenderer instance={hero} registry={storeSectionRegistry} ctx={makeCtx()} />)).toContain("عنوان");
    expect(html(<SectionRenderer instance={hero} registry={storeSectionRegistry} ctx={makeCtx({ locale: "en", dir: "ltr" })} />)).toContain("Title");
  });

  it("uses the host Link for internal links and a plain anchor for external ones", () => {
    const markup = html(<SectionRenderer instance={instance("store-footer")} registry={storeSectionRegistry} ctx={makeCtx()} />);
    expect(markup).toContain('href="/returns" class="text-(--sf-muted) hover:text-(--sf-ink)" data-host-link');
    expect(markup).toContain('href="https://instagram.com/sara"');
    expect(markup).toContain('rel="noopener noreferrer"');
  });
});

describe("commerce sections", () => {
  const grid = instance("product-grid", { source: "selected", productIds: [P1] });

  it("asks the host for exactly the catalog it needs", () => {
    const sections = [grid, instance("category-grid", { limit: 4 }), instance("featured-product"), instance("rich-text")];
    expect(collectCatalogQueries(sections, storeSectionRegistry)).toEqual({
      "s-product-grid": { kind: "products", source: "selected", categoryId: null, productIds: [P1], limit: 1 },
      "s-category-grid": { kind: "categories", limit: 4 },
    });
    expect(collectCatalogQueries([instance("product-grid", { source: "category", categoryId: C1, limit: 6 })], storeSectionRegistry)).toEqual({
      "s-product-grid": { kind: "products", source: "category", categoryId: C1, limit: 6 },
    });
  });

  it("renders the products the host resolved, with the host's cart button", () => {
    const ctx = makeCtx({
      catalog: {
        products: { "s-product-grid": [{ id: P1, title: "شنطة جلد", href: "/products/bag", image: "p/bag.jpg", price: 450, compareAtPrice: 500 }] },
        categories: [],
      },
      renderAddToCart: (product) => <button data-add={product.id}>+</button>,
    });
    const markup = html(<SectionRenderer instance={grid} registry={storeSectionRegistry} ctx={ctx} />);
    expect(markup).toContain("شنطة جلد");
    expect(markup).toContain("450.00 EGP");
    expect(markup).toContain("<s");
    expect(markup).toContain(`data-add="${P1}"`);
    expect(markup).toContain("https://cdn.test/p/bag.jpg");
  });

  it("shows an empty state without products", () => {
    expect(html(<SectionRenderer instance={grid} registry={storeSectionRegistry} ctx={makeCtx()} />)).toContain("لا توجد منتجات هنا بعد.");
  });

  it("hides an unset featured product on the store but explains it in the editor", () => {
    expect(html(<SectionRenderer instance={instance("featured-product")} registry={storeSectionRegistry} ctx={makeCtx()} />)).not.toContain("<section");
    expect(html(<SectionRenderer instance={instance("featured-product")} registry={storeSectionRegistry} ctx={makeCtx({ mode: "edit" })} />)).toContain(
      "اختر منتجًا",
    );
  });
});

describe("PageRenderer and theme", () => {
  it("renders header, sections in order, and footer", () => {
    const content: PageContent = { sections: [instance("hero-banner"), instance("faq")] };
    const markup = html(
      <PageRenderer content={content} header={instance("store-header")} footer={instance("store-footer")} registry={storeSectionRegistry} ctx={makeCtx()} />,
    );
    const order = ["store-header", "hero-banner", "faq", "store-footer"].map((id) => markup.indexOf(`data-section-type="${id}"`));
    expect(order.every((i) => i >= 0)).toBe(true);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
    expect(markup).toContain("من نحن");
  });

  it("maps the design system onto the Classic tokens", () => {
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
    // Non-hex colors keep the Classic ink.
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

  it("renders footer social links as labelled icons (P4-15)", () => {
    const markup = html(<SectionRenderer instance={instance("store-footer")} registry={storeSectionRegistry} ctx={makeCtx()} />);
    expect(markup).toContain('href="https://instagram.com/sara"');
    expect(markup).toContain('aria-label="إنستجرام"');
    expect(markup).toContain("<svg");
  });
});

describe("contact-form (P4-10)", () => {
  const F1 = "33333333-3333-4333-8333-333333333333";
  const F2 = "44444444-4444-4444-8444-444444444444";
  const form: PublicStoreForm = {
    id: F1,
    fields: [
      { key: "name", type: "text", label: "الاسم", required: true, width: "half" },
      { key: "email", type: "email", label: "البريد <b>", required: false, width: "half" },
      { key: "topic", type: "select", label: "الموضوع", required: false, width: "full", options: ["طلب", "أخرى"] },
      { key: "agree", type: "checkbox", label: "أوافق", required: true, width: "full" },
    ],
    submitLabel: "",
    successMessage: "",
  };

  it("collects the form ids a page shows (and ignores bad ids)", () => {
    const sections = [instance("contact-form", { formId: F1 }), { ...instance("contact-form", { formId: "x" }), id: "s2" }, instance("faq")];
    expect(collectFormIds(sections, storeSectionRegistry)).toEqual([F1]);
  });

  it("renders the host's interactive form for a resolved form", () => {
    const markup = html(
      <SectionRenderer
        instance={instance("contact-form", { formId: F1 })}
        registry={storeSectionRegistry}
        ctx={makeCtx({ forms: { [F1]: form }, renderForm: (f, id) => <form data-host-form={`${f.id}:${id}`} /> })}
      />,
    );
    expect(markup).toContain(`data-host-form="${F1}:s-contact-form"`);
  });

  it("shows nothing on the store for a form the host did not resolve (foreign, disabled or deleted)", () => {
    const ctx = makeCtx({ forms: { [F1]: form }, renderForm: () => <form /> });
    expect(html(<SectionRenderer instance={instance("contact-form", { formId: F2 })} registry={storeSectionRegistry} ctx={ctx} />)).not.toContain("<section");
    expect(html(<SectionRenderer instance={instance("contact-form")} registry={storeSectionRegistry} ctx={ctx} />)).not.toContain("<form");
  });

  it("draws a static, escaped preview in the editor", () => {
    const markup = html(
      <SectionRenderer instance={instance("contact-form", { formId: F1 })} registry={storeSectionRegistry} ctx={makeCtx({ mode: "edit", forms: { [F1]: form } })} />,
    );
    expect(markup).toContain('name="name"');
    expect(markup).toContain("disabled");
    expect(markup).toContain("البريد &lt;b&gt;");
    expect(markup).toContain("<option");
    expect(markup).toContain("إرسال");
    expect(html(<SectionRenderer instance={instance("contact-form")} registry={storeSectionRegistry} ctx={makeCtx({ mode: "edit" })} />)).toContain("اختر نموذجًا");
  });
});
