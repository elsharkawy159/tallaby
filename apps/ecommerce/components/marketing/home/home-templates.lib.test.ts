import { describe, expect, it } from "vitest";
import type { GalleryEntry } from "@/lib/marketing/templates.lib";
import { HOME_TEMPLATE_COUNT, pickHomeTemplates } from "./home-templates.lib";

const entry = (id: string, category: string, shot = true) => ({ id, category, shot: shot ? {} : null }) as unknown as GalleryEntry;

/** A repeatable random source (mulberry32). */
function seeded(seed: number): () => number {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

describe("pickHomeTemplates", () => {
  it("shows 9 templates", () => {
    expect(HOME_TEMPLATE_COUNT).toBe(9);
  });

  it("takes one design from each of 9 different industries by default", () => {
    const entries = Array.from({ length: 17 }, (_, i) => [entry(`c${i}a`, `c${i}`), entry(`c${i}b`, `c${i}`)]).flat();
    for (const seed of [1, 2, 3, 42]) {
      const picked = pickHomeTemplates(entries, undefined, seeded(seed));
      expect(picked).toHaveLength(9);
      expect(new Set(picked.map((e) => e.category)).size).toBe(9);
    }
  });

  it("is random: different seeds give different mixes", () => {
    const entries = Array.from({ length: 17 }, (_, i) => [entry(`c${i}a`, `c${i}`), entry(`c${i}b`, `c${i}`)]).flat();
    const a = pickHomeTemplates(entries, 10, seeded(1)).map((e) => e.id).join();
    const b = pickHomeTemplates(entries, 10, seeded(2)).map((e) => e.id).join();
    expect(a).not.toBe(b);
  });

  it("prefers a design with a card screenshot", () => {
    const entries = [entry("live", "a", false), entry("shot", "a", true)];
    for (const seed of [1, 2, 3]) expect(pickHomeTemplates(entries, 1, seeded(seed))[0]!.id).toBe("shot");
  });

  it("fills up from other designs when there are fewer industries, never twice the same", () => {
    const entries = [entry("a1", "a"), entry("a2", "a"), entry("b1", "b"), entry("b2", "b"), entry("c1", "c")];
    const picked = pickHomeTemplates(entries, 4, seeded(7));
    expect(picked).toHaveLength(4);
    expect(new Set(picked.map((e) => e.id)).size).toBe(4);
    expect(new Set(picked.slice(0, 3).map((e) => e.category)).size).toBe(3);
  });

  it("returns what there is when the catalog is small", () => {
    expect(pickHomeTemplates([entry("a1", "a")])).toHaveLength(1);
    expect(pickHomeTemplates([])).toEqual([]);
  });
});
