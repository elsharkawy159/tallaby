import type { GalleryEntry } from "@/lib/marketing/templates.lib";

/** How many templates the home page shows before its "See more templates" button (owner, 2026-11-16: 10 industries). */
export const HOME_TEMPLATE_COUNT = 10;

/** A Fisher–Yates shuffle with an injectable random source (tests pass a fixed one). */
function shuffled<T>(items: readonly T[], random: () => number): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

/**
 * The home page's templates (owner, 2026-11-16): `count` different industries
 * picked at random, and one random niche design from each. A design with a card
 * screenshot wins over one drawn live (lighter and always ready). When the
 * catalog has fewer industries than `count`, the rest is filled with other
 * random designs, so the grid stays full. The page is rebuilt every minute
 * (`revalidate`), so visitors see a fresh mix without a per-request cost.
 */
export function pickHomeTemplates(
  entries: readonly GalleryEntry[],
  count: number = HOME_TEMPLATE_COUNT,
  random: () => number = Math.random,
): GalleryEntry[] {
  const byIndustry = new Map<string, GalleryEntry[]>();
  for (const entry of entries) byIndustry.set(entry.category, [...(byIndustry.get(entry.category) ?? []), entry]);

  const picked: GalleryEntry[] = [];
  for (const industry of shuffled([...byIndustry.keys()], random).slice(0, count)) {
    const designs = byIndustry.get(industry)!;
    const withShot = designs.filter((entry) => entry.shot);
    const pool = withShot.length ? withShot : designs;
    picked.push(pool[Math.floor(random() * pool.length)]!);
  }
  if (picked.length < count) {
    const ids = new Set(picked.map((entry) => entry.id));
    picked.push(...shuffled(entries.filter((entry) => !ids.has(entry.id)), random).slice(0, count - picked.length));
  }
  return picked;
}
