import { describe, expect, it } from "vitest";
import { classicTemplateFixture, withHomeSections } from "./fixtures.test-utils";
import { siteConfigSchema } from "./schema";

const parse = (value: unknown) => siteConfigSchema.safeParse(value);

describe("siteConfigSchema", () => {
  it("accepts the Tallaby Classic template", () => {
    const result = parse(classicTemplateFixture());
    expect(result.success).toBe(true);
  });

  it("fills defaults for header, footer and settings", () => {
    const { header: _h, footer: _f, settings: _s, ...rest } = classicTemplateFixture();
    const result = parse(rest);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.header).toBeNull();
    expect(result.data.footer).toBeNull();
    expect(result.data.settings).toEqual({ defaultLocale: "ar", locales: ["ar", "en"] });
  });

  it("keeps a valid design source and rejects a malformed one", () => {
    const section = (source: string) => ({ id: "s1", sectionId: "custom-section", version: 1, props: {}, source });
    const ok = parse(withHomeSections([section("stats-cards@1")]));
    expect(ok.success).toBe(true);
    if (!ok.success) return;
    expect(ok.data.pages[0]!.content.sections[0]!.source).toBe("stats-cards@1");
    expect(parse(withHomeSections([section("x y")])).success).toBe(false);
  });

  it("accepts pattern, accordion and accordionItem nodes", () => {
    const node = (id: string, type: string, children: unknown[] = []) => ({ id, type, props: {}, children });
    const tree = [node("r", "section", [node("p", "pattern"), node("a", "accordion", [node("i", "accordionItem")])])];
    const result = parse(withHomeSections([{ id: "s1", sectionId: "custom-section", version: 1, props: {}, componentTree: tree }]));
    expect(result.success).toBe(true);
  });

  it("rejects a customCode node in a section's component tree", () => {
    const config = withHomeSections([
      {
        id: "s1",
        sectionId: "classic-hero",
        version: 1,
        props: {},
        componentTree: [{ id: "n1", type: "customCode", props: { html: "<script>x</script>" }, children: [] }],
      },
    ]);
    expect(parse(config).success).toBe(false);
  });

  it("rejects a customCode node nested deep in injected children", () => {
    const config = classicTemplateFixture();
    (config.pages[0]!.content as Record<string, unknown>).injectedChildren = {
      "s1::root": [
        {
          id: "n1",
          type: "div",
          props: {},
          children: [{ id: "n2", type: "customCode", props: {}, children: [] }],
        },
      ],
    };
    expect(parse(config).success).toBe(false);
  });

  it("rejects unknown node types and map iframes", () => {
    for (const type of ["marquee-script", "map"]) {
      const config = withHomeSections([
        {
          id: "s1",
          sectionId: "classic-hero",
          version: 1,
          props: {},
          componentTree: [{ id: "n1", type, props: {}, children: [] }],
        },
      ]);
      expect(parse(config).success, type).toBe(false);
    }
  });

  it("accepts allowed free-form nodes", () => {
    const config = withHomeSections([
      {
        id: "s1",
        sectionId: "classic-hero",
        version: 1,
        props: {},
        componentTree: [
          {
            id: "n1",
            type: "container",
            props: {},
            children: [{ id: "n2", type: "heading", props: { text: "Hi" }, children: [] }],
          },
        ],
      },
    ]);
    expect(parse(config).success).toBe(true);
  });

  it("requires exactly one home page", () => {
    const none = classicTemplateFixture();
    none.pages[0]!.isHome = false;
    expect(parse(none).success).toBe(false);

    const two = classicTemplateFixture();
    two.pages.push({ ...two.pages[0]!, slug: "about" });
    expect(parse(two).success).toBe(false);
  });

  it("rejects duplicate page slugs", () => {
    const config = classicTemplateFixture();
    config.pages.push({ ...config.pages[0]!, isHome: false });
    expect(parse(config).success).toBe(false);
  });

  it("rejects slugs that collide with storefront routes or are malformed", () => {
    for (const slug of ["products", "cart", "checkout", "api", "Bad Slug", "../x"]) {
      const config = classicTemplateFixture();
      config.pages.push({ ...config.pages[0]!, isHome: false, slug });
      expect(parse(config).success, slug).toBe(false);
    }
  });

  it("rejects colors that could inject CSS", () => {
    const config = classicTemplateFixture();
    config.designSystem.colors.primary = "red;} body{display:none";
    expect(parse(config).success).toBe(false);
  });

  it("accepts hex and functional colors", () => {
    for (const color of ["#fff", "#0a5c4fcc", "rgb(10, 20, 30)", "oklch(0.7 0.1 200 / 50%)"]) {
      const config = classicTemplateFixture();
      config.designSystem.colors.primary = color;
      expect(parse(config).success, color).toBe(true);
    }
  });

  it("drops seller-supplied custom CSS", () => {
    const config = classicTemplateFixture();
    (config.designSystem as Record<string, unknown>).customCss = "body{background:url(https://evil.example)}";
    const result = parse(config);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.designSystem).not.toHaveProperty("customCss");
  });

  it("rejects an unsupported locale", () => {
    const config = classicTemplateFixture();
    config.settings.locales = ["ar", "fr"];
    expect(parse(config).success).toBe(false);
  });

  it("rejects a default locale missing from the locale list", () => {
    const config = classicTemplateFixture();
    config.settings = { defaultLocale: "en", locales: ["ar"] };
    expect(parse(config).success).toBe(false);
  });

  it("rejects an unsafe SEO image URL", () => {
    const config = classicTemplateFixture();
    (config.pages[0]!.seo as Record<string, unknown>).ogImage = "javascript:alert(1)";
    expect(parse(config).success).toBe(false);
  });

  describe("product page", () => {
    const withPages = (...extra: Record<string, unknown>[]) => {
      const config = classicTemplateFixture();
      config.pages.push(...(extra.map((e) => ({ ...config.pages[0]!, isHome: false, ...e })) as never[]));
      return config;
    };
    const messages = (config: unknown) => {
      const r = parse(config);
      return r.success ? [] : r.error.issues.map((i) => i.message);
    };

    it("accepts one product page with slug \"product\"", () => {
      const r = parse(withPages({ slug: "product", kind: "product", showInNav: false }));
      expect(r.success).toBe(true);
      if (r.success) expect(r.data.pages[1]!.kind).toBe("product");
    });

    it("rejects two product pages", () => {
      const config = withPages({ slug: "product", kind: "product" }, { slug: "product-2", kind: "product" });
      expect(messages(config)).toContain("one_product_page");
    });

    it("rejects kind product with another slug", () => {
      expect(messages(withPages({ slug: "item", kind: "product" }))).toContain("product_page_slug");
    });

    it("rejects slug \"product\" on a normal page", () => {
      const r = parse(withPages({ slug: "product" }));
      expect(r.success).toBe(false);
      if (!r.success) {
        const issue = r.error.issues.find((i) => i.message === "reserved_slug");
        expect(issue?.path).toEqual(["pages", 1, "slug"]);
      }
    });

    it("rejects a product page that isHome", () => {
      const config = classicTemplateFixture();
      Object.assign(config.pages[0]!, { slug: "product", kind: "product" });
      expect(messages(config)).toContain("product_page_not_home");
    });

    it("config without kind parses unchanged", () => {
      const r = parse(classicTemplateFixture());
      expect(r.success).toBe(true);
      if (r.success) expect("kind" in r.data.pages[0]!).toBe(false);
    });
  });
});
