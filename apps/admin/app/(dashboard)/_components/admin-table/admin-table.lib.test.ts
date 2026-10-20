import { describe, expect, it } from "vitest";
import { compareSortValues, nextSort, parseSortParam, serializeSort, sortRows } from "./admin-table.lib";

describe("parseSortParam", () => {
  it("reads an allowed id and direction", () => {
    expect(parseSortParam("name.desc", ["name"])).toEqual({ id: "name", desc: true });
    expect(parseSortParam(["createdAt.asc"], ["createdAt"])).toEqual({ id: "createdAt", desc: false });
  });

  it("falls back on unknown ids, bad directions and empty values", () => {
    const fallback = { id: "createdAt", desc: true };
    expect(parseSortParam("evil.asc", ["name"], fallback)).toBe(fallback);
    expect(parseSortParam("name.sideways", ["name"], fallback)).toBe(fallback);
    expect(parseSortParam("name", ["name"], fallback)).toBe(fallback);
    expect(parseSortParam(undefined, ["name"])).toBeNull();
  });

  it("round-trips with serializeSort", () => {
    expect(serializeSort({ id: "price", desc: false })).toBe("price.asc");
    expect(serializeSort(null)).toBeNull();
  });
});

describe("nextSort", () => {
  it("flips the active column and starts a new one at its first direction", () => {
    expect(nextSort({ id: "name", desc: false }, "name")).toEqual({ id: "name", desc: true });
    expect(nextSort({ id: "name", desc: true }, "name")).toEqual({ id: "name", desc: false });
    expect(nextSort({ id: "name", desc: true }, "price")).toEqual({ id: "price", desc: false });
    expect(nextSort(null, "createdAt", true)).toEqual({ id: "createdAt", desc: true });
  });
});

describe("sortRows", () => {
  const rows = [
    { name: "beta", n: 10, d: null },
    { name: "Alpha", n: 2, d: "2026-10-01" },
    { name: "item 10", n: 2, d: "2026-09-01" },
    { name: "item 9", n: null, d: "2026-10-05" },
  ];
  const valueOf = (row: (typeof rows)[number], id: string) => row[id as keyof typeof row];

  it("sorts text case-insensitively and numerically", () => {
    expect(sortRows(rows, { id: "name", desc: false }, valueOf).map((r) => r.name)).toEqual(["Alpha", "beta", "item 9", "item 10"]);
  });

  it("keeps empty values last in both directions and is stable", () => {
    expect(sortRows(rows, { id: "n", desc: false }, valueOf).map((r) => r.name)).toEqual(["Alpha", "item 10", "beta", "item 9"]);
    expect(sortRows(rows, { id: "n", desc: true }, valueOf).map((r) => r.name)).toEqual(["beta", "Alpha", "item 10", "item 9"]);
    expect(sortRows(rows, { id: "d", desc: true }, valueOf).map((r) => r.d)).toEqual(["2026-10-05", "2026-10-01", "2026-09-01", null]);
  });

  it("returns a copy in the original order without a sort", () => {
    const out = sortRows(rows, null, valueOf);
    expect(out).toEqual(rows);
    expect(out).not.toBe(rows);
  });

  it("compares booleans", () => {
    expect(compareSortValues(true, false, false)).toBeGreaterThan(0);
  });
});
