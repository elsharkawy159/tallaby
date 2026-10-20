/**
 * Section library queries (P4B-05): search, filters, and turning a preset
 * into an ordinary section instance. Pure; used by the editor Add panel,
 * drag and drop and page templates alike.
 */
import type { SectionInstance, SiteLocale } from "../config/schema";
import type { SectionRegistry } from "../core/registry";
import { getDesign, instantiateDesign, instantiateTemplate } from "../designs";
import type { MakeId } from "../elements/tree";
import { LIBRARY_CATEGORIES } from "./categories";
import { SECTION_PRESETS } from "./presets";
import type { LibraryCategoryId, PresetCapability, SectionPreset } from "./types";

const ALL_PRESETS: readonly SectionPreset[] = SECTION_PRESETS;
const PRESETS_BY_ID = new Map(ALL_PRESETS.map((p) => [p.id, p]));

/** A preset by id, from `presets` (the editor's list) or the built-in library. */
export function getPreset(id: string, presets: readonly SectionPreset[] = SECTION_PRESETS): SectionPreset | undefined {
  return presets === SECTION_PRESETS ? PRESETS_BY_ID.get(id) : presets.find((p) => p.id === id);
}

/**
 * Lower-cases and folds the Arabic spellings people mix up when typing
 * (alef forms, ta marbuta, final ya, tatweel and diacritics).
 */
export function normalizeSearch(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[ً-ٰٟـ]/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function haystack(preset: SectionPreset): string {
  const category = LIBRARY_CATEGORIES.find((c) => c.id === preset.category);
  const subcategory = category?.subcategories.find((s) => s.id === preset.subcategory);
  return normalizeSearch(
    [
      preset.name.ar,
      preset.name.en,
      preset.description.ar,
      preset.description.en,
      category?.name.ar,
      category?.name.en,
      subcategory?.name.ar,
      subcategory?.name.en,
      ...(preset.keywords ?? []),
    ]
      .filter(Boolean)
      .join(" "),
  );
}

/** Search text per preset object (a database preset may share an id with a code one but not its words). */
const HAYSTACKS = new WeakMap<SectionPreset, string>();
function searchText(preset: SectionPreset): string {
  let text = HAYSTACKS.get(preset);
  if (text === undefined) HAYSTACKS.set(preset, (text = haystack(preset)));
  return text;
}

export type PresetFilter = {
  query?: string;
  category?: LibraryCategoryId | null;
  subcategory?: string | null;
  /** Keep presets with any of these capabilities. */
  capabilities?: readonly PresetCapability[];
};

/** Presets matching every word of `query` and the filters, in library order. */
export function filterPresets(filter: PresetFilter, presets: readonly SectionPreset[] = SECTION_PRESETS): SectionPreset[] {
  const words = normalizeSearch(filter.query ?? "")
    .split(" ")
    .filter(Boolean);
  return presets.filter((preset) => {
    if (filter.category && preset.category !== filter.category) return false;
    if (filter.subcategory && preset.subcategory !== filter.subcategory) return false;
    if (filter.capabilities?.length && !preset.capabilities.some((c) => filter.capabilities!.includes(c))) return false;
    if (!words.length) return true;
    const text = searchText(preset);
    return words.every((word) => text.includes(word));
  });
}

/** How many presets each category holds (for the category list). */
export function presetCountByCategory(presets: readonly SectionPreset[] = SECTION_PRESETS): Record<LibraryCategoryId, number> {
  const out = Object.fromEntries(LIBRARY_CATEGORIES.map((c) => [c.id, 0])) as Record<LibraryCategoryId, number>;
  for (const preset of presets) out[preset.category] += 1;
  return out;
}

/**
 * A new instance of the preset's section: the section's defaults overlaid
 * with the preset's props, plus its starting style. Everything is cloned, so
 * instances never share objects with the catalog. `null` for an unknown section.
 */
export function instantiatePreset(
  preset: SectionPreset,
  registry: SectionRegistry,
  id: string,
  opts: { defaultLocale?: SiteLocale; makeId?: MakeId; industry?: string } = {},
): SectionInstance | null {
  if (preset.tree) {
    return instantiateTemplate(preset.tree, { id, source: `${preset.designKey ?? preset.id}@${preset.version ?? 1}`, ...opts });
  }
  if (preset.designId) {
    const design = getDesign(preset.designId);
    return design ? instantiateDesign(design, { id, ...opts }) : null;
  }
  const definition = registry.get(preset.sectionId);
  if (!definition) return null;
  return {
    id,
    sectionId: definition.id,
    version: definition.version,
    props: structuredClone({ ...definition.defaultProps, ...preset.props }) as Record<string, unknown>,
    ...(preset.style && { style: structuredClone(preset.style) }),
  };
}

/** The presets a section can switch between in the inspector (same section, so content and data stay). */
export function presetsForSection(sectionId: string): SectionPreset[] {
  // Design presets start their own tree; switching a tree section to another design comes later (content roles).
  return ALL_PRESETS.filter((p) => p.sectionId === sectionId && p.kind !== "card" && !p.designId);
}
