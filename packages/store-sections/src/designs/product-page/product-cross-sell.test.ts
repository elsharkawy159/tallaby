import { describe, expect, it } from "vitest";
import { getDesign, instantiateDesign } from "..";
import { CROSS_SELL_TYPE, pageHasCrossSell } from "../../core/cross-sell";
import { CODE_TEMPLATES, DEFAULT_TEMPLATE } from "../../templates/catalog";

describe("product-cross-sell design (F-32d)", () => {
  const design = getDesign("product-cross-sell")!;
  const instance = instantiateDesign(design, { id: "d1" });

  it("holds the offers element, on the product page", () => {
    expect(design.category).toBe("product-page");
    expect(pageHasCrossSell([instance])).toBe(true);
  });

  it("leaves no empty band for a product with no offers: the section has no padding, the element has the space and hides", () => {
    const root = instance.componentTree![0]!;
    expect(root.style).toMatchObject({ paddingTop: 0, paddingBottom: 0 });
    const element = root.children![0]!.children![0]!;
    expect(element.type).toBe(CROSS_SELL_TYPE);
    expect(element.style).toMatchObject({ marginTop: 24, marginBottom: 24 });
  });

  it("is in no template, so the default template and new stores keep the placement under the buy box", () => {
    const uses = (config: unknown) => JSON.stringify(config).includes(`"${CROSS_SELL_TYPE}"`);
    expect(uses(DEFAULT_TEMPLATE.config())).toBe(false);
    for (const template of CODE_TEMPLATES) expect(uses(template.config()), template.key).toBe(false);
  });
});
