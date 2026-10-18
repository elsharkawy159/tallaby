import { describe, expect, it } from "vitest";
import { MAX_SECTIONS_PER_PAGE, type ComponentNode, type PageContent, type SectionInstance } from "@workspace/store-sections";
import { findNode, findParent } from "@workspace/store-sections/render";
import type { CanvasPayload, CanvasProbe, DropPlan } from "./dnd.types";
import { applyDropPlan, planDrop, sectionMoveTarget } from "./drop-plan.lib";

const node = (id: string, type: string, children: ComponentNode[] = [], props: Record<string, unknown> = {}): ComponentNode =>
  ({ id, type, props, children }) as ComponentNode;
const section = (id: string, sectionId: string, tree?: ComponentNode[]): SectionInstance => ({
  id,
  sectionId,
  version: 1,
  props: {},
  ...(tree && { componentTree: tree }),
});

/** hero (pre-built) · custom [stack [heading, image], paragraph] · faq */
function page(): PageContent {
  return {
    sections: [
      section("hero", "hero-banner"),
      section("custom", "custom-section", [node("stack", "vFlex", [node("h", "heading"), node("img", "image", [], { src: "a.jpg", alt: "kept" })]), node("p", "paragraph")]),
      section("faq", "faq"),
    ],
  };
}
const src = (content: PageContent) => ({ content, header: null, footer: null });
const probe = (over: Partial<CanvasProbe> = {}): CanvasProbe => ({ sectionIndex: 0, overSectionId: null, images: [], slots: [], ...over });

let n = 0;
const deps = {
  makeNodeId: () => `new-${n++}`,
  makeSection: (sectionId: string): SectionInstance => ({ id: `sec-${n++}`, sectionId, version: 1, props: {} }),
};
const apply = (content: PageContent, plan: DropPlan | null, payload: CanvasPayload, extra = {}) => applyDropPlan(content, plan!, payload, { ...deps, ...extra });
const ids = (content: PageContent) => content.sections.map((s) => s.id);

describe("section drops", () => {
  it("inserts a new section at the beginning, middle and end", () => {
    const content = page();
    for (const [index, expected] of [
      [0, 0],
      [2, 2],
      [3, 3],
    ] as const) {
      const plan = planDrop({ kind: "section", sectionId: "features" }, probe({ sectionIndex: index }), src(content));
      expect(plan).toEqual({ kind: "insert-section", index });
      const result = apply(content, plan, { kind: "section", sectionId: "features" });
      expect(result!.content.sections[expected]!.sectionId).toBe("features");
      expect(result!.content.sections).toHaveLength(4);
      expect(result!.select).toEqual({ target: "page", sectionId: result!.content.sections[expected]!.id });
    }
  });

  it("moves a section to the start or end and never moves it onto itself", () => {
    const content = page();
    const toStart = planDrop({ kind: "move-section", instanceId: "faq" }, probe({ sectionIndex: 0 }), src(content));
    expect(ids(apply(content, toStart, { kind: "move-section", instanceId: "faq" })!.content)).toEqual(["faq", "hero", "custom"]);
    const toEnd = planDrop({ kind: "move-section", instanceId: "hero" }, probe({ sectionIndex: 3 }), src(content));
    expect(ids(apply(content, toEnd, { kind: "move-section", instanceId: "hero" })!.content)).toEqual(["custom", "faq", "hero"]);
    // Just above or below itself: same place, nothing is written.
    for (const at of [1, 2]) {
      const same = planDrop({ kind: "move-section", instanceId: "custom" }, probe({ sectionIndex: at }), src(content));
      expect(same).toEqual({ kind: "move-section", instanceId: "custom", to: 1 });
      expect(apply(content, same, { kind: "move-section", instanceId: "custom" })).toBeNull();
    }
    expect(sectionMoveTarget(0, 3)).toBe(2);
    expect(sectionMoveTarget(2, 0)).toBe(0);
  });

  it("refuses header/footer sections, a full page, and a drop off the canvas", () => {
    const content = page();
    expect(planDrop({ kind: "section", sectionId: "store-header" }, probe(), src(content))).toMatchObject({ kind: "invalid", reason: "unsupported" });
    const full: PageContent = { sections: Array.from({ length: MAX_SECTIONS_PER_PAGE }, (_, i) => section(`s${i}`, "faq")) };
    expect(planDrop({ kind: "section", sectionId: "features" }, probe(), src(full))).toMatchObject({ kind: "invalid", reason: "limit" });
    expect(planDrop({ kind: "section", sectionId: "features" }, null, src(content))).toBeNull();
  });
});

describe("element drops", () => {
  it("inserts an element at the slot's position inside a custom section", () => {
    const content = page();
    // Pointer between the heading and the image, inside the stack.
    const plan = planDrop(
      { kind: "element", elementType: "button" },
      probe({ sectionIndex: 2, overSectionId: "custom", slots: [{ parentId: "stack", beforeId: "img" }, { parentId: null, beforeId: "p" }] }),
      src(content),
    );
    expect(plan).toMatchObject({ kind: "insert-nodes", sectionInstanceId: "custom", parentId: "stack", index: 1, slot: 0 });
    const result = apply(content, plan, { kind: "element", elementType: "button" })!;
    const stack = findNode(result.content.sections[1]!.componentTree!, "stack")!;
    expect(stack.children.map((c) => c.type)).toEqual(["heading", "button", "image"]);
    expect(result.select.nodeId).toBe(stack.children[1]!.id);
    // The new id is not one of the existing ones.
    expect(["stack", "h", "img", "p"]).not.toContain(stack.children[1]!.id);
  });

  it("skips slots that refuse the element and uses the next one", () => {
    const content: PageContent = {
      sections: [section("c", "custom-section", [node("list", "list", [node("li", "listItem")])])],
    };
    // A list holds list items only: a heading goes after the list instead.
    const plan = planDrop(
      { kind: "element", elementType: "heading" },
      probe({ overSectionId: "c", slots: [{ parentId: "list", beforeId: null }, { parentId: null, beforeId: null }] }),
      src(content),
    );
    expect(plan).toMatchObject({ kind: "insert-nodes", parentId: null, index: 1, slot: 1 });
  });

  it("puts elements dropped on a pre-built section in a new custom section beside it", () => {
    const content = page();
    const plan = planDrop({ kind: "preset", presetId: "two-column" }, probe({ sectionIndex: 1, overSectionId: "hero" }), src(content));
    expect(plan).toEqual({ kind: "new-section", index: 1 });
    const result = apply(content, plan, { kind: "preset", presetId: "two-column" })!;
    expect(result.content.sections[1]!.sectionId).toBe("custom-section");
    expect(result.content.sections[0]!.id).toBe("hero");
    const element = apply(content, planDrop({ kind: "element", elementType: "heading" }, probe({ sectionIndex: 1, overSectionId: "hero" }), src(content)), {
      kind: "element",
      elementType: "heading",
    })!;
    expect(element.content.sections.map((s) => s.sectionId)).toEqual(["hero-banner", "custom-section", "custom-section", "faq"]);
    expect(element.content.sections[1]!.componentTree![0]!.type).toBe("heading");
    // The pre-built section is untouched (no element data stored on it).
    expect(element.content.sections[0]).toBe(content.sections[0]);
  });

  it("moves an element between containers, never into itself, and stops on its own place", () => {
    const content = page();
    const payload: CanvasPayload = { kind: "move-node", sectionInstanceId: "custom", nodeId: "p" };
    const into = planDrop(payload, probe({ overSectionId: "custom", slots: [{ parentId: "stack", beforeId: "h" }] }), src(content));
    expect(into).toMatchObject({ kind: "move-node", parentId: "stack", index: 0 });
    const moved = apply(content, into, payload)!;
    expect(findParent(moved.content.sections[1]!.componentTree!, "p")).toEqual({ parentId: "stack", index: 0 });

    const stackPayload: CanvasPayload = { kind: "move-node", sectionInstanceId: "custom", nodeId: "stack" };
    const self = planDrop(stackPayload, probe({ overSectionId: "custom", slots: [{ parentId: "stack", beforeId: null }, { parentId: null, beforeId: "p" }] }), src(content));
    // Not into itself; "before p" is right after itself, which is its own place.
    expect(self).toMatchObject({ kind: "invalid", reason: "noop" });

    const down = planDrop(stackPayload, probe({ overSectionId: "custom", slots: [{ parentId: null, beforeId: null }] }), src(content));
    expect(down).toMatchObject({ kind: "move-node", parentId: null, index: 1 });
  });

  it("moves an element out to a new section next to a pre-built one", () => {
    const content = page();
    const payload: CanvasPayload = { kind: "move-node", sectionInstanceId: "custom", nodeId: "h" };
    const plan = planDrop(payload, probe({ sectionIndex: 3, overSectionId: "faq" }), src(content));
    expect(plan).toEqual({ kind: "move-node-new-section", fromSectionId: "custom", nodeId: "h", index: 3 });
    const result = apply(content, plan, payload)!;
    expect(findNode(result.content.sections[1]!.componentTree!, "h")).toBeNull();
    expect(result.content.sections[3]!.componentTree![0]!.id).toBe("h");
  });
});

describe("photo drops", () => {
  const photo: CanvasPayload = { kind: "photo", photo: { photoId: "123", thumbUrl: "t.jpg", alt: "A shop" } };

  it("replaces an Image element under the pointer", () => {
    const content = page();
    const plan = planDrop(
      photo,
      probe({ overSectionId: "custom", images: [{ ref: { target: "page", sectionId: "custom" }, nodeId: "img" }], slots: [{ parentId: "stack", beforeId: null }] }),
      src(content),
    );
    expect(plan).toMatchObject({ kind: "replace-image", candidate: 0 });
  });

  it("ignores parts that are not images and inserts an Image element instead", () => {
    const content = page();
    const plan = planDrop(
      photo,
      probe({ sectionIndex: 0, overSectionId: "hero", images: [{ ref: { target: "page", sectionId: "hero" }, part: "title" }] }),
      src(content),
    );
    expect(plan).toEqual({ kind: "new-section", index: 0 });
    const result = apply(content, plan, photo, { src: "seller/store/photo.jpg" })!;
    const image = result.content.sections[0]!.componentTree![0]!;
    expect(image).toMatchObject({ type: "image", props: { src: "seller/store/photo.jpg", alt: "A shop" } });
  });

  it("does not change the page when the drop is cancelled", () => {
    const content = page();
    const before = JSON.stringify(content);
    expect(planDrop(photo, null, src(content))).toBeNull();
    expect(JSON.stringify(content)).toBe(before);
  });
});

describe("image onto image", () => {
  it("a media image dropped on an Image element replaces it", () => {
    const content = page();
    const media: CanvasPayload = { kind: "media", src: "https://cdn/x.jpg", thumbUrl: "https://cdn/x.jpg", alt: "" };
    const plan = planDrop(media, probe({ overSectionId: "custom", images: [{ ref: { target: "page", sectionId: "custom" }, nodeId: "img" }] }), src(content));
    expect(plan).toMatchObject({ kind: "replace-image", candidate: 0 });
    expect(plan).not.toHaveProperty("from");
  });

  it("an Image element moved onto another image takes its place, but not onto itself", () => {
    const content: PageContent = {
      sections: [section("c", "custom-section", [node("a", "image", [], { src: "a.jpg" }), node("b", "image", [], { src: "b.jpg" })])],
    };
    const payload: CanvasPayload = { kind: "move-node", sectionInstanceId: "c", nodeId: "a" };
    const ref = { target: "page" as const, sectionId: "c" };
    const plan = planDrop(payload, probe({ overSectionId: "c", images: [{ ref, nodeId: "a" }, { ref, nodeId: "b" }] }), src(content));
    expect(plan).toEqual({ kind: "replace-image", target: { ref, nodeId: "b" }, candidate: 1, from: { sectionInstanceId: "c", nodeId: "a" } });
    const self = planDrop(payload, probe({ overSectionId: "c", images: [{ ref, nodeId: "a" }], slots: [{ parentId: null, beforeId: "b" }] }), src(content));
    expect(self?.kind).not.toBe("replace-image");
  });
});

describe("part and item drops (P4B-16)", () => {
  const content: PageContent = { sections: [section("about", "image-with-text"), section("hl", "features")] };
  const ref = { target: "page" as const, sectionId: "about" };

  it("moves a part to the other column, or refuses away from its section", () => {
    const payload: CanvasPayload = { kind: "move-part", ref, part: "title" };
    expect(planDrop(payload, probe({ part: { slot: "media", beforePart: null } }), src(content))).toEqual({
      kind: "move-part",
      ref,
      part: "title",
      slot: "media",
      index: 1,
    });
    expect(planDrop(payload, probe({ part: null }), src(content))).toMatchObject({ kind: "invalid", reason: "unsupported" });
    expect(planDrop(payload, probe({ part: { slot: "text", beforePart: "title" } }), src(content))).toMatchObject({ kind: "invalid", reason: "noop" });
    expect(planDrop({ ...payload, ref: { target: "page", sectionId: "gone" } }, probe({ part: { slot: "text", beforePart: null } }), src(content))).toBeNull();
  });

  it("moves an item among its collection", () => {
    const payload: CanvasPayload = { kind: "move-item", ref: { target: "page", sectionId: "hl" }, collection: "items", index: 0 };
    expect(planDrop(payload, probe({ itemInsertAt: 3 }), src(content))).toMatchObject({ kind: "move-item", from: 0, to: 2 });
    expect(planDrop(payload, probe({ itemInsertAt: 1 }), src(content))).toMatchObject({ kind: "invalid", reason: "noop" });
    expect(planDrop(payload, probe({ itemInsertAt: null }), src(content))).toMatchObject({ kind: "invalid", reason: "unsupported" });
  });
});
