import { describe, expect, it } from "vitest";
import { sizeChartFromTemplate } from "@workspace/lib/size-charts";
import { freeInputKey, nextSizeLabel, pickText, toNumber } from "./size-chart-form.lib";

describe("size chart form helpers", () => {
  it("suggests the next size label in the chart's own steps", () => {
    expect(nextSizeLabel(sizeChartFromTemplate("tops").definition)).toBe("4XL");
    expect(nextSizeLabel(sizeChartFromTemplate("pants").definition)).toBe("42");
    expect(nextSizeLabel(sizeChartFromTemplate("shoes").definition)).toBe("47");
  });

  it("gives a new measurement a key the chart doesn't use", () => {
    const chart = sizeChartFromTemplate("tops").definition;
    expect(freeInputKey(chart, "chest")).toBe("chest");
    expect(freeInputKey(chart, "height")).toBe("m1");
  });

  it("reads numbers, with a comma as the decimal point", () => {
    expect(toNumber("25,5")).toBe(25.5);
    expect(toNumber("")).toBeUndefined();
    expect(toNumber("x")).toBeUndefined();
  });

  it("falls back to the other language", () => {
    expect(pickText({ ar: "", en: "Shoes" }, "ar")).toBe("Shoes");
    expect(pickText({ ar: "أحذية", en: "Shoes" }, "ar")).toBe("أحذية");
  });
});
