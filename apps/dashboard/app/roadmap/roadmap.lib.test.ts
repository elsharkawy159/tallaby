import { describe, expect, it } from "vitest";
import { applyVote, canVote, filterItems, findSimilar, normalizeText } from "./roadmap.lib";
import type { RoadmapItem } from "./roadmap.types";

const item = (over: Partial<RoadmapItem>): RoadmapItem => ({
  id: "a",
  status: "waiting",
  category: "orders",
  title: "تصدير الطلبات",
  description: "",
  author: null,
  createdAt: "2026-10-01T00:00:00Z",
  launchedAt: null,
  votes: 0,
  voted: false,
  mine: false,
  ...over,
});

const base = { query: "", category: "" as const, tab: "all" as const, sort: "votes" as const };

describe("roadmap lib", () => {
  it("opens votes only before work starts", () => {
    expect(canVote("waiting")).toBe(true);
    expect(canVote("planned")).toBe(true);
    expect(canVote("in_progress")).toBe(false);
    expect(canVote("launched")).toBe(false);
  });

  it("normalizes Arabic letter variants for search", () => {
    expect(normalizeText("إضافة")).toBe(normalizeText("اضافه"));
  });

  it("filters by tab, category and query and sorts by votes", () => {
    const items = [
      item({ id: "1", votes: 3, mine: true }),
      item({ id: "2", votes: 9, voted: true, category: "shipping", title: "بوسطة" }),
      item({ id: "3", votes: 5, title: "Excel export" }),
    ];
    expect(filterItems(items, base).map((i) => i.id)).toEqual(["2", "3", "1"]);
    expect(filterItems(items, { ...base, tab: "mine" }).map((i) => i.id)).toEqual(["1"]);
    expect(filterItems(items, { ...base, tab: "voted" }).map((i) => i.id)).toEqual(["2"]);
    expect(filterItems(items, { ...base, category: "shipping" }).map((i) => i.id)).toEqual(["2"]);
    expect(filterItems(items, { ...base, query: "EXCEL" }).map((i) => i.id)).toEqual(["3"]);
  });

  it("sorts newest first", () => {
    const items = [item({ id: "old" }), item({ id: "new", createdAt: "2026-10-20T00:00:00Z", votes: -1 })];
    expect(filterItems(items, { ...base, sort: "new" })[0]!.id).toBe("new");
  });

  it("suggests similar titles by shared words", () => {
    const items = [item({ id: "1", title: "تصدير الطلبات إلى Excel" }), item({ id: "2", title: "نقاط الولاء" })];
    expect(findSimilar(items, "تصدير المنتجات").map((i) => i.id)).toEqual(["1"]);
    expect(findSimilar(items, "ab")).toEqual([]);
  });

  it("toggles a vote optimistically, never on closed cards", () => {
    const items = [item({ id: "1", votes: 2 }), item({ id: "2", status: "launched", votes: 4 })];
    expect(applyVote(items, "1")[0]).toMatchObject({ voted: true, votes: 3 });
    expect(applyVote(applyVote(items, "1"), "1")[0]).toMatchObject({ voted: false, votes: 2 });
    expect(applyVote(items, "2")[1]).toMatchObject({ voted: false, votes: 4 });
  });
});
