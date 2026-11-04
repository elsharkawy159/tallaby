import { describe, expect, it } from "vitest";
import { pageHasCrossSell } from "./cross-sell";

describe("pageHasCrossSell", () => {
  const n = (type: string, children?: { type: string }[]) => ({ type, children });

  it("finds the element at any depth, in any section", () => {
    expect(pageHasCrossSell([{ componentTree: [n("section")] }, { componentTree: [n("section", [n("vFlex", [n("productCrossSell")])])] }])).toBe(true);
  });

  it("is false without it", () => {
    expect(pageHasCrossSell([{ componentTree: [n("section", [n("productBuyBox")])] }, { componentTree: null }])).toBe(false);
    expect(pageHasCrossSell([])).toBe(false);
    expect(pageHasCrossSell(undefined)).toBe(false);
  });
});
