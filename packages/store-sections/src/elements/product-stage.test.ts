import { describe, expect, it } from "vitest";
import { designSystemSchema, type ComponentNode, type SectionInstance } from "../config/schema";
import { designSystemToTokens } from "../core/theme";
import { collectPageCss } from "./style";

const node = (id: string, type: string, over: Partial<ComponentNode> = {}): ComponentNode => ({ id, type, props: {}, children: [], ...over }) as ComponentNode;

const page = (children: ComponentNode[]): SectionInstance[] => [
  { id: "s1", sectionId: "custom-section", version: 1, props: {}, componentTree: [node("s1-n1", "section", { children })] },
];

const photo = (id: string, style?: ComponentNode["style"], mobile?: ComponentNode["style"]) =>
  node(id, "image", { props: { bind: "image", src: "", alt: "" }, ...(style && { style }), ...(mobile && { breakpointStyles: { mobile } }) });

describe("product stage", () => {
  it("a product photo in a product list reads the stage tokens and falls back to its own frame", () => {
    const css = collectPageCss(page([node("s1-n2", "productList", { children: [photo("s1-n3", { aspectRatio: "portrait", objectFit: "cover" }, { aspectRatio: "square" })] })]));
    expect(css).toContain('[data-node-id="s1-n3"]{aspect-ratio:var(--sf-stage-ratio,3 / 4);object-fit:var(--sf-stage-fit,cover);background-color:var(--sf-stage-bg,transparent);padding:var(--sf-stage-pad,0);box-sizing:border-box}');
    expect(css).toContain('@media (max-width:767px){.sf-site [data-section-id="s1"] [data-node-id="s1-n3"]{aspect-ratio:var(--sf-stage-ratio,1 / 1)}}');
  });

  it("a product photo with no style of its own still gets the stage", () => {
    const css = collectPageCss(page([node("s1-n2", "productList", { children: [photo("s1-n3")] })]));
    expect(css).toContain("aspect-ratio:var(--sf-stage-ratio,auto);object-fit:var(--sf-stage-fit,fill)");
  });

  it("keeps the photo's own background and padding", () => {
    const css = collectPageCss(page([node("s1-n2", "productList", { children: [photo("s1-n3", { background: "secondary", paddingTop: 8 })] })]));
    expect(css).not.toContain("--sf-stage-bg");
    expect(css).not.toContain("--sf-stage-pad");
  });

  it("leaves category photos and photos outside a product list alone", () => {
    const css = collectPageCss(
      page([node("s1-n2", "categoryList", { children: [photo("s1-n3", { aspectRatio: "square" })] }), node("s1-n4", "image", { props: { src: "a.jpg", alt: "" }, style: { aspectRatio: "wide" } })]),
    );
    expect(css).not.toContain("--sf-stage");
    expect(css).toContain("aspect-ratio:1 / 1");
  });

  it("a site with no stage sets no stage token", () => {
    const tokens = designSystemToTokens({ colors: {}, spacing: {} });
    expect(Object.keys(tokens).some((key) => key.startsWith("--sf-stage"))).toBe(false);
  });

  it("the stage defaults to a white 1:1 frame that contains the photo", () => {
    expect(designSystemToTokens({ colors: {}, spacing: { productStage: {} } })).toMatchObject({
      "--sf-stage-ratio": "1 / 1",
      "--sf-stage-fit": "contain",
      "--sf-stage-bg": "#ffffff",
      "--sf-stage-pad": "12px",
    });
    expect(designSystemToTokens({ colors: {}, spacing: { productStage: { ratio: "4:5", fit: "cover", background: "#f4f1ec" } } })).toMatchObject({
      "--sf-stage-ratio": "4 / 5",
      "--sf-stage-fit": "cover",
      "--sf-stage-bg": "#f4f1ec",
      "--sf-stage-pad": "0px",
    });
  });

  it("the schema drops an unknown stage value and never fails", () => {
    const parsed = designSystemSchema.parse({ spacing: { productStage: { ratio: "7:3", fit: "stretch", background: "url(x)", padding: 900 } } });
    expect(parsed.spacing.productStage).toEqual({});
    expect(designSystemSchema.parse({}).spacing.productStage).toBeUndefined();
    // Stored with the spacing column, so it survives a save (`designSystemColumns` writes spacing whole).
    expect(designSystemSchema.parse({ spacing: { borderRadius: 8, productStage: { ratio: "4:5" } } }).spacing).toEqual({ borderRadius: 8, productStage: { ratio: "4:5" } });
  });
});
