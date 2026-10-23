import { describe, expect, it } from "vitest";
import type { ComponentNode } from "@workspace/store-sections";
import { getDesign, instantiateDesign } from "@workspace/store-sections/render";
import { addSlide, removeSlide, settingsNodes, slideImages } from "./section-settings.lib";

const n = (id: string, type: string, children: ComponentNode[] = [], props: Record<string, unknown> = {}): ComponentNode => ({ id, type: type as ComponentNode["type"], props, children });

describe("section settings", () => {
  it("lists the elements with settings in reading order, not inside a data list's card", () => {
    const tree = [
      n("s", "section", [
        n("v", "video"),
        n("g", "grid", [n("c", "carousel", [n("sl", "slide", [n("vi", "video")])])]),
        n("p", "productList", [n("card", "vFlex", [n("inner", "video")])]),
      ]),
    ];
    expect(settingsNodes(tree).map((node) => node.id)).toEqual(["v", "c", "vi", "p"]);
    expect(settingsNodes([n("s", "section", [n("h", "heading")])])).toEqual([]);
  });

  it("finds the banner carousel's three slide photos", () => {
    const tree = instantiateDesign(getDesign("hero-carousel")!, { id: "d1" }).componentTree!;
    const [carousel] = settingsNodes(tree);
    expect(carousel?.type).toBe("carousel");
    expect(carousel!.children.map((slide) => slideImages(slide).length)).toEqual([1, 1, 1]);
  });

  it("adds a slide as a copy of the last one with new ids", () => {
    let i = 0;
    const carousel = n("c", "carousel", [n("a", "slide", [n("ai", "image", [], { src: "x.jpg" })])]);
    const next = addSlide(carousel, () => `new${i++}`);
    expect(next.children.map((c) => c.id)).toEqual(["a", "new0"]);
    expect(next.children[1]!.children[0]).toMatchObject({ id: "new1", type: "image", props: { src: "x.jpg" } });
    expect(addSlide(n("c", "carousel"), () => "e").children).toMatchObject([{ id: "e", type: "slide" }]);
  });

  it("removes a slide but never the last one", () => {
    const carousel = n("c", "carousel", [n("a", "slide"), n("b", "slide")]);
    expect(removeSlide(carousel, "a").children.map((c) => c.id)).toEqual(["b"]);
    const one = removeSlide(carousel, "a");
    expect(removeSlide(one, "b")).toBe(one);
    expect(removeSlide(carousel, "zz")).toBe(carousel);
  });
});
