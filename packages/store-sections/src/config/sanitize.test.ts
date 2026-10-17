import { describe, expect, it } from "vitest";
import { sanitizeRichText, sanitizeSiteConfig, sanitizeStyle } from "./sanitize";
import { classicTemplateFixture, withHomeSections } from "./fixtures.test-utils";
import { siteConfigSchema } from "./schema";

function sanitizedHomeProps(props: Record<string, unknown>) {
  const config = siteConfigSchema.parse(
    withHomeSections([{ id: "s1", sectionId: "classic-hero", version: 1, props }]),
  );
  return sanitizeSiteConfig(config).pages[0]!.content.sections[0]!.props;
}

describe("sanitizeRichText", () => {
  it("strips script tags and their content", () => {
    expect(sanitizeRichText("<p>hi</p><script>alert(1)</script>")).toBe("<p>hi</p>");
  });

  it("strips iframes", () => {
    expect(sanitizeRichText('<p>a</p><iframe src="https://x.example"></iframe>')).toBe("<p>a</p>");
  });

  it("removes event handler attributes", () => {
    expect(sanitizeRichText('<img src="x" onerror="alert(1)">')).not.toContain("onerror");
  });

  it("keeps basic formatting and safe links", () => {
    const html = '<p><strong>b</strong> <em>i</em> <a href="https://tallaby.com">l</a></p>';
    expect(sanitizeRichText(html)).toBe(html);
  });

  it("removes javascript: links", () => {
    expect(sanitizeRichText('<a href="javascript:alert(1)">x</a>')).not.toContain("javascript");
  });

  it("leaves plain text alone", () => {
    expect(sanitizeRichText("مرحبا & أهلا")).toBe("مرحبا & أهلا");
  });
});

describe("sanitizeStyle", () => {
  it("drops style values that run script or import CSS", () => {
    const style = sanitizeStyle({
      color: "red",
      background: "url(javascript:alert(1))",
      width: "expression(alert(1))",
      content: "</style><script>",
      font: "@import url(https://x)",
    });
    expect(style).toEqual({ color: "red" });
  });

  it("keeps https and relative background images", () => {
    const style = { backgroundImage: "url(https://cdn.example/a.png)", mask: "url(/m.svg)" };
    expect(sanitizeStyle(style)).toEqual(style);
  });

  it("drops non-http url() values", () => {
    expect(sanitizeStyle({ backgroundImage: "url(data:text/html,<b>)" })).toEqual({});
  });

  it("sanitizes nested style objects", () => {
    expect(sanitizeStyle({ hover: { color: "blue", background: "url(vbscript:x)" } })).toEqual({
      hover: { color: "blue" },
    });
  });
});

describe("sanitizeSiteConfig", () => {
  it("sanitizes HTML in section props", () => {
    const props = sanitizedHomeProps({ body: "<p>x</p><script>alert(1)</script>" });
    expect(props.body).toBe("<p>x</p>");
  });

  it("sanitizes HTML inside item collections", () => {
    const props = sanitizedHomeProps({ items: [{ text: "<b>ok</b><iframe></iframe>" }] });
    expect(props.items).toEqual([{ text: "<b>ok</b>" }]);
  });

  it("blanks unsafe URLs in props", () => {
    const props = sanitizedHomeProps({ ctaHref: " JavaScript:alert(1)", other: "data:text/html;base64,xx" });
    expect(props.ctaHref).toBe("");
    expect(props.other).toBe("");
  });

  it("keeps safe URLs and plain values", () => {
    const props = sanitizedHomeProps({ href: "/products/x", tel: "tel:+201000000000", count: 3, on: true });
    expect(props).toEqual({ href: "/products/x", tel: "tel:+201000000000", count: 3, on: true });
  });

  it("sanitizes translations", () => {
    const config = siteConfigSchema.parse(
      withHomeSections([
        {
          id: "s1",
          sectionId: "classic-hero",
          version: 1,
          props: {},
          translations: { en: { body: "<script>x</script>hello" } },
        },
      ]),
    );
    const section = sanitizeSiteConfig(config).pages[0]!.content.sections[0]!;
    expect(section.translations?.en?.body).toBe("hello");
  });

  it("sanitizes header chrome and component tree props", () => {
    const raw = classicTemplateFixture();
    raw.header.props = { note: "<script>x</script>ok" } as never;
    (raw.pages[0]!.content.sections[0] as Record<string, unknown>).componentTree = [
      { id: "n1", type: "link", props: { href: "javascript:x" }, children: [] },
    ];
    const result = sanitizeSiteConfig(siteConfigSchema.parse(raw));
    expect(result.header?.props.note).toBe("ok");
    expect(result.pages[0]!.content.sections[0]!.componentTree?.[0]?.props.href).toBe("");
  });

  it("does not mutate its input", () => {
    const config = siteConfigSchema.parse(
      withHomeSections([{ id: "s1", sectionId: "x", version: 1, props: { body: "<script>a</script>" } }]),
    );
    sanitizeSiteConfig(config);
    expect(config.pages[0]!.content.sections[0]!.props.body).toBe("<script>a</script>");
  });
});
