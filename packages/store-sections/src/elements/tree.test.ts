import { describe, expect, it } from "vitest";
import { DESIGNS } from "../designs";
import { designSlotTree } from "../designs/photo-slots";
import { fromTemplate, toTemplate, type NodeTemplate } from "./tree";

let n = 0;
const makeId = () => `n${++n}`;

describe("toTemplate", () => {
  it("is the inverse of fromTemplate for every library design (slot form)", () => {
    for (const design of DESIGNS) {
      const template = designSlotTree(design);
      expect(toTemplate(fromTemplate(template, makeId)), design.id).toEqual(template);
    }
  });

  it("strips ids all the way down and keeps every other field", () => {
    const template: NodeTemplate = {
      type: "section",
      props: { tag: "section" },
      style: { paddingTop: 24 },
      breakpointStyles: { mobile: { paddingTop: 8 } },
      children: [
        { type: "image", props: { src: "stock:photo:2", alt: "" }, children: [] },
        { type: "container", props: {}, layout: "grid", children: [{ type: "text", props: { text: "x" }, children: [] }] },
      ],
    };
    const node = fromTemplate(template, makeId);
    const back = toTemplate(node);
    expect(back).toEqual(template);
    expect(JSON.stringify(back)).not.toContain('"id"');
    // The input node is left untouched.
    expect(node.id).toMatch(/^n\d+$/);
    expect(node.children[1]!.children[0]!.id).toMatch(/^n\d+$/);
  });
});
