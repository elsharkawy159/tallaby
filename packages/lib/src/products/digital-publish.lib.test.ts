import { describe, expect, it } from "vitest";
import { DIGITAL_FILE_REQUIRED, digitalIdsWithoutFiles } from "./digital-publish.lib";

describe("digitalIdsWithoutFiles", () => {
  it("returns the digital products that have no file", () => {
    expect(digitalIdsWithoutFiles(["a", "b", "c"], ["b"])).toEqual(["a", "c"]);
  });
  it("returns nothing when every product has a file", () => {
    expect(digitalIdsWithoutFiles(["a", "b"], new Set(["a", "b", "x"]))).toEqual([]);
  });
  it("keeps input order and drops duplicates", () => {
    expect(digitalIdsWithoutFiles(["c", "a", "c"], [])).toEqual(["c", "a"]);
  });
  it("handles an empty list", () => {
    expect(digitalIdsWithoutFiles([], ["a"])).toEqual([]);
  });
  it("has a stable refusal code", () => {
    expect(DIGITAL_FILE_REQUIRED).toBe("digital_file_required");
  });
});
