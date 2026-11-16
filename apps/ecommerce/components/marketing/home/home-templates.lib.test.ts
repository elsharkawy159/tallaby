import { describe, expect, it } from "vitest";
import type { GalleryEntry } from "@/lib/marketing/templates.lib";
import { HOME_TEMPLATE_COUNT, pickHomeTemplates } from "./home-templates.lib";

const entry = (id: string, category: string) => ({ id, category }) as unknown as GalleryEntry;

describe("pickHomeTemplates", () => {
  it("shows 6 templates", () => {
    expect(HOME_TEMPLATE_COUNT).toBe(6);
  });

  it("takes one per category in catalog order and stops at the count", () => {
    const entries = Array.from({ length: 12 }, (_, i) => entry(`t${i}`, `c${i}`));
    expect(pickHomeTemplates(entries).map((e) => e.id)).toEqual(["t0", "t1", "t2", "t3", "t4", "t5"]);
  });

  it("fills up from the rest of the catalog when there are fewer categories", () => {
    const entries = [entry("a1", "a"), entry("a2", "a"), entry("b1", "b"), entry("b2", "b"), entry("c1", "c")];
    expect(pickHomeTemplates(entries, 4).map((e) => e.id)).toEqual(["a1", "b1", "c1", "a2"]);
  });

  it("returns what there is when the catalog is small", () => {
    expect(pickHomeTemplates([entry("a1", "a")])).toHaveLength(1);
    expect(pickHomeTemplates([])).toEqual([]);
  });
});
