import { normalizePlaceText, searchPlaces, EGYPT } from "@workspace/lib/places";

/**
 * Place names from the model → place keys, matched in code (docs/ai.md rules
 * 1–2: no place list in the prompt). Only an exact name or alias match counts;
 * anything else is returned as unmatched for the confirm card. Groupings
 * sellers write ("كل مصر", "باقي المحافظات") map to `EG`.
 */

const ALL_EGYPT = new Set(
  [
    "egypt", "all egypt", "all of egypt", "everywhere", "nationwide", "all governorates", "rest of egypt", "other governorates",
    "مصر", "كل مصر", "مصر كلها", "كل المحافظات", "جميع المحافظات", "باقي المحافظات", "بقية المحافظات", "باقي مصر", "الجمهورية",
  ].map(normalizePlaceText),
);

export type PlaceMatch = { keys: string[]; matched: { name: string; key: string }[]; unmatched: string[] };

export function matchPlaceNames(names: readonly string[]): PlaceMatch {
  const keys: string[] = [];
  const matched: PlaceMatch["matched"] = [];
  const unmatched: string[] = [];
  for (const raw of names) {
    const name = raw.trim().slice(0, 80);
    const n = normalizePlaceText(name);
    if (!n) continue;
    let key: string | null = null;
    if (ALL_EGYPT.has(n)) key = EGYPT;
    else {
      const [best] = searchPlaces(name, { limit: 1, within: EGYPT });
      const exact =
        best &&
        [best.nameAr, best.nameEn, ...(best.aliases ?? [])].some((term) => {
          const t = normalizePlaceText(term);
          return t === n || t === n.replace(/^(ال|el |al )/, "") || n === t.replace(/^(ال|el |al )/, "");
        });
      if (exact) key = best.key;
    }
    if (!key) unmatched.push(name);
    else if (!keys.includes(key)) {
      keys.push(key);
      matched.push({ name, key });
    }
  }
  return { keys, matched, unmatched };
}
