import { describe, expect, it } from "vitest";
import type { ComponentNode } from "@workspace/store-sections";
import { nodeLabel, renameNode } from "./editor-selection.lib";

const node = (props: Record<string, unknown>): ComponentNode => ({ id: "n1", type: "grid", props, children: [] });

describe("layer labels", () => {
  it("shows a design label in the editor's UI language", () => {
    const grid = node({ label: "الأرقام", translations: { en: { label: "Stats" } } });
    expect(nodeLabel(grid, "en")).toBe("Stats");
    expect(nodeLabel(grid, "ar")).toBe("الأرقام");
    expect(nodeLabel(node({}), "en")).toBe("");
  });

  it("renames in every language, keeping other translated props", () => {
    const grid = node({ label: "الأرقام", text: "x", translations: { en: { label: "Stats", text: "y" } } });
    const renamed = renameNode(grid, "  Numbers  ");
    expect(nodeLabel(renamed, "en")).toBe("Numbers");
    expect(nodeLabel(renamed, "ar")).toBe("Numbers");
    expect(renamed.props.translations).toEqual({ en: { text: "y" } });
    expect(renameNode(grid, " ").props.label).toBeUndefined();
  });
});
