import { describe, expect, it } from "vitest";
import { GENERAL_QUERIES, findIndustry, industryQueries } from "./industries.lib";

describe("store industries", () => {
  it("matches by English or Arabic name, ignoring case and spaces", () => {
    expect(findIndustry({ en: " fashion " })?.id).toBe("fashion");
    expect(findIndustry({ ar: "إكسسوارات موبايل" })?.id).toBe("mobile-accessories");
    expect(findIndustry({ en: "Garden tools" })).toBeNull();
  });

  it("searches the industry, then the English category, then general terms", () => {
    expect(industryQueries({ en: "Electronics" })[0]).toBe("electronics gadgets");
    expect(industryQueries({ en: "Garden tools" })).toEqual(["Garden tools", ...GENERAL_QUERIES]);
    expect(industryQueries({ ar: "أدوات حدائق" })).toEqual([...GENERAL_QUERIES]);
  });
});
