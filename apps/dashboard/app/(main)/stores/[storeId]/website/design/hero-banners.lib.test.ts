import { describe, expect, it } from "vitest";
import type { ComponentNode, SectionInstance } from "@workspace/store-sections";
import { applyHeroBanners, findHeroBanners } from "./hero-banners.lib";

const node = (id: string, type: string, props: Record<string, unknown> = {}, children: ComponentNode[] = []) =>
  ({ id, type, props, children }) as ComponentNode;
const section = (id: string, tree: ComponentNode, source?: string): SectionInstance => ({
  id,
  sectionId: "custom-section",
  version: 1,
  props: {},
  ...(source && { source }),
  componentTree: [tree],
});
const slide = (id: string, src: string) => node(id, "slide", {}, [node(`${id}-img`, "image", { src, role: "image" }), node(`${id}-h`, "heading", { text: "Hi" })]);
const carouselHero = section("hero", node("s", "section", {}, [node("c", "carousel", {}, [slide("a", "1.jpg"), slide("b", "2.jpg")])]), "hero-carousel@1");
const notHero = (id: string) => id === "about-split";

describe("findHeroBanners", () => {
  it("reads one banner per carousel slide", () => {
    expect(findHeroBanners([carouselHero], notHero)).toEqual({ sectionId: "hero", kind: "carousel", imageIds: ["a-img", "b-img"], srcs: ["1.jpg", "2.jpg"] });
  });

  it("reads a fixed hero's role:image photos", () => {
    const hero = section("h", node("s", "section", {}, [node("p", "image", { src: "x.jpg", role: "image" }), node("i", "image", { src: "icon.svg" })]));
    expect(findHeroBanners([hero], notHero)).toMatchObject({ kind: "fixed", imageIds: ["p"], srcs: ["x.jpg"] });
  });

  it("is null without a hero photo, and skips non-hero designs", () => {
    const video = section("v", node("s", "section", {}, [node("vid", "video", { src: "x" })]));
    const about = section("a", node("s", "section", {}, [node("p", "image", { src: "x.jpg", role: "image" })]), "about-split@1");
    expect(findHeroBanners([video], notHero)).toBeNull();
    expect(findHeroBanners([about], notHero)).toBeNull();
    expect(findHeroBanners([], notHero)).toBeNull();
  });

  it("only looks at the first two sections", () => {
    const empty = section("e", node("s", "section"));
    expect(findHeroBanners([empty, empty, carouselHero], notHero)).toBeNull();
    expect(findHeroBanners([empty, carouselHero], notHero)?.sectionId).toBe("hero");
  });
});

describe("applyHeroBanners", () => {
  const hero = findHeroBanners([carouselHero], notHero)!;
  const slides = (sections: SectionInstance[]) => sections[0]!.componentTree![0]!.children[0]!.children;

  it("replaces, drops and adds carousel slides", () => {
    expect(slides(applyHeroBanners([carouselHero], hero, ["9.jpg"])).map((s) => s.children[0]!.props.src)).toEqual(["9.jpg"]);
    const grown = slides(applyHeroBanners([carouselHero], hero, ["1.jpg", "2.jpg", "3.jpg", "4.jpg"]));
    expect(grown.map((s) => s.children[0]!.props.src)).toEqual(["1.jpg", "2.jpg", "3.jpg", "4.jpg"]);
    expect(grown.map((s) => s.id)).toEqual(["a", "b", "b-b1", "b-b2"]);
    expect(grown[2]!.children[1]!.props.text).toBe("Hi");
  });

  it("fills a fixed hero in order and leaves other sections alone", () => {
    const fixedHero = section("h", node("s", "section", {}, [node("p", "image", { src: "x.jpg", role: "image" })]));
    const other = section("o", node("s2", "section"));
    const result = applyHeroBanners([fixedHero, other], findHeroBanners([fixedHero], notHero)!, ["y.jpg"]);
    expect(result[0]!.componentTree![0]!.children[0]!.props.src).toBe("y.jpg");
    expect(result[1]).toBe(other);
  });
});
