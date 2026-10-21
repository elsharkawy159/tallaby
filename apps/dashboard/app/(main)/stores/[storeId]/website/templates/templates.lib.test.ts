import { describe, expect, it } from "vitest";
import { sortByIndustry } from "./templates.lib";

const rows = [
  { key: "classic", category: "general" },
  { key: "mode", category: "fashion" },
  { key: "techhub", category: "electronics" },
  { key: "kasr", category: "fashion" },
  { key: "volt", category: "electronics" },
];

describe("sortByIndustry", () => {
  it("puts the industry's templates first and keeps each group's order", () => {
    expect(sortByIndustry(rows, "electronics").map((r) => r.key)).toEqual(["techhub", "volt", "classic", "mode", "kasr"]);
  });

  it("keeps the order when the store has no industry or none of its templates", () => {
    expect(sortByIndustry(rows, null).map((r) => r.key)).toEqual(rows.map((r) => r.key));
    expect(sortByIndustry(rows, "pets").map((r) => r.key)).toEqual(rows.map((r) => r.key));
  });
});
