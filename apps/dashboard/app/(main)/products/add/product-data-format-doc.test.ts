import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { parseProductImportJson } from "./parse-product-import.lib";

describe("PRODUCT_DATA_FORMAT.md example", () => {
  it("parses through the real importer", () => {
    const md = readFileSync(
      new URL("../../../../../../PRODUCT_DATA_FORMAT.md", import.meta.url),
      "utf8"
    );
    const match = md.match(/```json\n([\s\S]*?)```/);
    expect(match).toBeTruthy();

    const result = parseProductImportJson(match![1]!);
    if (!result.success) {
      throw new Error(JSON.stringify(result, null, 2));
    }

    expect(result.data.variants).toHaveLength(4);
    expect(result.data.variants?.[0]?.stock).toBe(18);
    expect(result.data.variantTypes).toHaveLength(2);
    expect(result.data.dimensions?.weight).toBe(0.19);
    expect(result.data.fulfillmentType).toBe("platform_fulfilled");
    expect(result.data.taxClass).toBe("standard");
    expect(result.data.maxOrderQuantity).toBe(5);
    expect(result.data.localized?.ar?.content).toContain("<h3>");
  });
});
