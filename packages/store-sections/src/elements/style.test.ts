import { describe, expect, it } from "vitest";
import type { SectionInstance } from "../config/schema";
import { SECTION_FLUID_PADDING, collectPageCss, escapeStyleBlock, normalizeSectionStyle, normalizeStyle, styleDeclarations } from "./style";

const section = (over: Partial<SectionInstance> = {}): SectionInstance => ({
  id: "s1",
  sectionId: "hero-banner",
  version: 1,
  props: {},
  ...over,
});

describe("normalizeStyle", () => {
  it("drops unknown keys and invalid values", () => {
    expect(
      normalizeStyle({
        fontSize: "lg",
        fontWeight: "heavy",
        color: "red; background:url(x)",
        behavior: "x",
        content: "</style><script>",
        paddingTop: "10px",
        gap: 12,
      }),
    ).toEqual({ fontSize: "lg", gap: 12 });
  });

  it("accepts theme tokens and plain colors only", () => {
    expect(normalizeStyle({ color: "primary", background: "#fff", borderColor: "rgb(1, 2, 3)" })).toEqual({
      color: "primary",
      background: "#fff",
      borderColor: "rgb(1, 2, 3)",
    });
    expect(normalizeStyle({ color: "var(--x)" })).toEqual({});
  });

  it("clamps numbers and bounds lengths", () => {
    expect(normalizeStyle({ paddingTop: 9999, columns: 0, opacity: 50.6 })).toEqual({ paddingTop: 400, columns: 1, opacity: 51 });
    expect(normalizeStyle({ width: "50%", maxWidth: "640px" })).toEqual({ width: "50%", maxWidth: "640px" });
    expect(normalizeStyle({ width: "500%", maxWidth: "calc(100% - 1px)" })).toEqual({});
  });

  it("is safe on non-objects", () => {
    expect(normalizeStyle(null)).toEqual({});
    expect(normalizeStyle(["x"])).toEqual({});
    expect(normalizeStyle("color:red")).toEqual({});
  });
});

describe("normalizeSectionStyle", () => {
  it("keeps valid part keys only", () => {
    expect(
      normalizeSectionStyle({
        marginTop: 8,
        parts: { title: { fontSize: "xl" }, "items.2.title": { italic: true }, 'x"]{}': { fontSize: "xl" }, empty: { nope: 1 } },
      }),
    ).toEqual({ marginTop: 8, parts: { title: { fontSize: "xl" }, "items.2.title": { italic: true } } });
  });
});

describe("styleDeclarations", () => {
  it("uses logical sides and token variables", () => {
    expect(styleDeclarations({ paddingStart: 4, marginEnd: 2, color: "primary", textAlign: "start" })).toEqual([
      "text-align:start",
      "color:var(--sf-brand)",
      "padding-inline-start:4px",
      "margin-inline-end:2px",
    ]);
  });
});

describe("collectPageCss", () => {
  it("is empty for unstyled pages", () => {
    expect(collectPageCss([section(), null])).toBe("");
  });

  it("emits part, section and breakpoint rules", () => {
    const css = collectPageCss([
      section({
        style: { marginTop: 10, parts: { title: { fontSize: "lg", fontWeight: "bold" } } },
        breakpointStyles: { mobile: { parts: { title: { fontSize: "sm" } } }, desktop: { marginTop: 1 } },
      }),
    ]);
    expect(css).toBe(
      '.sf-site [data-section-id="s1"]{margin-block-start:10px}' +
        '.sf-site [data-part="s1::title"]{font-size:1.125rem;font-weight:700}' +
        '@media (max-width:767px){.sf-site [data-part="s1::title"]{font-size:0.875rem}}',
    );
  });

  it("hides per device without inheriting", () => {
    const css = collectPageCss([section({ breakpointStyles: { tablet: { parts: { title: { hidden: true } } } } })]);
    expect(css).toContain('@media (min-width:768px) and (max-width:1023px){.sf-site [data-part="s1::title"]{display:none!important}}');
    const edit = collectPageCss([section({ style: { hidden: true } })], "edit");
    expect(edit).toContain("opacity:0.35");
    expect(edit).not.toContain("display:none");
  });

  it("walks element trees", () => {
    const css = collectPageCss([
      section({
        sectionId: "custom-section",
        componentTree: [{ id: "n1", type: "vFlex", props: {}, children: [{ id: "n2", type: "text", props: {}, children: [], style: { color: "muted" } }] }],
      }),
    ]);
    expect(css).toBe('.sf-site [data-section-id="s1"] [data-node-id="n2"]{color:var(--sf-muted)}');
  });

  it("scales a section root's vertical padding by the Brand section spacing", () => {
    const css = collectPageCss([
      section({
        sectionId: "custom-section",
        componentTree: [
          {
            id: "n1",
            type: "section",
            props: {},
            style: { paddingTop: 64, paddingBottom: 0, paddingStart: 8 },
            breakpointStyles: { mobile: { paddingTop: 40 } },
            children: [{ id: "n2", type: "card", props: {}, children: [], style: { paddingTop: 24 } }],
          },
        ],
      }),
    ]);
    expect(css).toContain(
      `[data-node-id="n1"]{padding-block-start:calc(var(--sf-section-y,${SECTION_FLUID_PADDING})*1);padding-block-end:0px;padding-inline-start:8px}`,
    );
    expect(css).toContain(`[data-node-id="n1"]{padding-block-start:calc(var(--sf-section-y,${SECTION_FLUID_PADDING})*0.625)}`);
    // A roomy root (96) counts as 80 at most (1.25 × the token).
    const roomy = collectPageCss([
      section({ sectionId: "custom-section", componentTree: [{ id: "n3", type: "section", props: {}, style: { paddingTop: 96 }, children: [] }] }),
    ]);
    expect(roomy).toContain(`padding-block-start:calc(var(--sf-section-y,${SECTION_FLUID_PADDING})*1.25)`);
    // Only the section root follows the token; inner elements keep plain pixels.
    expect(css).toContain('[data-node-id="n2"]{padding-block-start:24px');
  });

  it("skips ids that could break the selector", () => {
    expect(collectPageCss([section({ id: 'a"]{}', style: { marginTop: 1 } })])).toBe("");
  });

  it("escapes the block for a style element", () => {
    expect(escapeStyleBlock("a</style>")).toBe("a\\3c /style>");
  });
});

describe("tree section styles", () => {
  const tree = (style: Record<string, unknown>, breakpointStyles?: Record<string, Record<string, unknown>>) =>
    section({ sectionId: "custom-section", componentTree: [{ id: "n1", type: "div", props: {}, children: [], style, ...(breakpointStyles && { breakpointStyles }) }] });

  it("normalizes layering, type, gradient and grid keys and drops bad values", () => {
    expect(
      normalizeStyle({
        position: "absolute",
        zIndex: 99,
        insetTop: "10px",
        insetStart: "-16px",
        insetEnd: "calc(1px)",
        overflow: "hidden",
        letterSpacing: "wide",
        textTransform: "uppercase",
        gradient: "brand-soft",
        colSpan: 20,
        order: -3,
        fontSize: "display-lg",
      }),
    ).toEqual({
      position: "absolute",
      zIndex: 10,
      insetTop: "10px",
      insetStart: "-16px",
      overflow: "hidden",
      letterSpacing: "wide",
      textTransform: "uppercase",
      gradient: "brand-soft",
      colSpan: 12,
      order: -3,
      fontSize: "display-lg",
    });
    expect(normalizeStyle({ position: "fixed", gradient: "url(x)" })).toEqual({});
  });

  it("emits logical inset properties", () => {
    const css = styleDeclarations(normalizeStyle({ position: "absolute", insetTop: "0px", insetEnd: "16px", insetBottom: "-8px", insetStart: "5%" }));
    expect(css).toEqual(
      expect.arrayContaining(["position:absolute", "inset-block-start:0px", "inset-inline-end:16px", "inset-block-end:-8px", "inset-inline-start:5%"]),
    );
  });

  it("uses clamp for display font sizes", () => {
    expect(styleDeclarations({ fontSize: "display-md" })).toContain("font-size:clamp(2.25rem,5vw,4rem)");
    // Section headings (docs/section-rules.md §5.2, G13).
    expect(styleDeclarations({ fontSize: "display-sm" })).toContain("font-size:clamp(1.75rem,4vw,3.5rem)");
  });

  it("emits a scoped hover rule, never nested", () => {
    expect(normalizeStyle({ hover: { shadow: "md", scale: 105, content: "x", hover: { color: "primary" } } })).toEqual({ hover: { shadow: "md", scale: 105 } });
    const css = collectPageCss([tree({ hover: { shadow: "md", scale: 105 } })]);
    expect(css).toContain('[data-section-id="s1"] [data-node-id="n1"]:hover{box-shadow:');
    expect(css).toContain("transform:scale(1.05)");
    expect(css).toContain("@media (prefers-reduced-motion:reduce)");
  });

  it("puts hover and position overrides inside the device media query", () => {
    const css = collectPageCss([tree({ position: "sticky" }, { mobile: { position: "relative", hover: { opacity: 80 } } })]);
    const mobile = css.slice(css.indexOf("@media (max-width:767px){"));
    expect(mobile).toContain("position:relative");
    expect(mobile).toContain(':hover{opacity:0.8}');
  });
});
