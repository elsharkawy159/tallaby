/**
 * Section library in the editor (P4B-05): turning presets into instances and
 * switching an existing section to another preset of the same section. Pure.
 *
 * Switching keeps content and data: only design props (a `layout` picker, or
 * props in the `layout`/`appearance` groups) and the section shell change, so
 * texts, images, items, product sources and picks survive a layout change.
 */
import type { SectionInstance } from "@workspace/store-sections";
import {
  getPreset,
  instantiatePreset,
  normalizeShell,
  storeSectionRegistry,
  type SectionShellStyle,
  type AnySectionDefinition,
  type DataNeed,
  type PropDefinition,
  type SectionPreset,
} from "@workspace/store-sections/render";

/** Props a design change may overwrite. Data (`group: "data"`) and content props never are. */
export function isDesignProp(definition: PropDefinition): boolean {
  return definition.type === "layout" || definition.group === "layout" || definition.group === "appearance";
}

function designKeys(definition: AnySectionDefinition): Set<string> {
  return new Set(definition.propDefinitions.filter(isDesignProp).map((p) => p.key));
}

export type FieldGroups = { design: PropDefinition[]; data: PropDefinition[]; content: PropDefinition[]; options: PropDefinition[] };

/**
 * The inspector's field groups for a section, in display order, without the
 * fields whose `showWhen` does not hold for the current props:
 * design (layout pickers), data (source, filters, picks), content (texts and
 * images), options (other layout/appearance settings).
 */
export function fieldGroups(definition: AnySectionDefinition, props: Record<string, unknown>): FieldGroups {
  const values = { ...definition.defaultProps, ...props } as Record<string, unknown>;
  const visible = definition.propDefinitions.filter((p) => !p.showWhen || p.showWhen.equals.includes(values[p.showWhen.key] as string | boolean));
  return {
    design: visible.filter((p) => p.type === "layout"),
    data: visible.filter((p) => p.type !== "layout" && p.group === "data"),
    content: visible.filter((p) => p.type !== "layout" && (p.group === undefined || p.group === "content")),
    options: visible.filter((p) => p.type !== "layout" && (p.group === "layout" || p.group === "appearance")),
  };
}

/** The library preset whose design the instance currently has (all its design props match), if any. */
export function currentPreset(instance: SectionInstance, presets: readonly SectionPreset[]): SectionPreset | undefined {
  const definition = storeSectionRegistry.get(instance.sectionId);
  if (!definition) return undefined;
  const keys = designKeys(definition);
  const values = { ...definition.defaultProps, ...instance.props } as Record<string, unknown>;
  return presets.find((preset) => {
    const design = Object.entries(preset.props ?? {}).filter(([key]) => keys.has(key));
    const defaults = [...keys].filter((key) => !(preset.props && key in preset.props));
    return (
      design.every(([key, value]) => JSON.stringify(values[key]) === JSON.stringify(value)) &&
      defaults.every((key) => JSON.stringify(values[key]) === JSON.stringify((definition.defaultProps as Record<string, unknown>)[key]))
    );
  });
}

/**
 * The instance with its section shell patched (`undefined` clears a key).
 * The result is normalized like the sanitizer does, and an empty shell is
 * removed, so the section renders exactly as without one.
 */
export function setShell(instance: SectionInstance, patch: Partial<SectionShellStyle>): SectionInstance {
  const style = { ...((instance.style ?? {}) as Record<string, unknown>) };
  const merged: Record<string, unknown> = { ...((style.shell as Record<string, unknown> | undefined) ?? {}), ...patch };
  for (const key of Object.keys(merged)) if (merged[key] === undefined) delete merged[key];
  const shell = normalizeShell(merged);
  if (shell) style.shell = shell;
  else delete style.shell;
  return { ...instance, style: Object.keys(style).length ? style : undefined };
}

/** The normalized shell of an instance. */
export function readShell(instance: SectionInstance): SectionShellStyle {
  return normalizeShell((instance.style as { shell?: unknown } | undefined)?.shell) ?? {};
}

/** A new instance of a preset with a fresh id; null for an unknown section. */
export function presetInstance(preset: SectionPreset, id: string): SectionInstance | null {
  return instantiatePreset(preset, storeSectionRegistry, id);
}

/**
 * The instance with the preset's design applied: its design props and its
 * shell. Everything else stays. Unchanged when the preset is for another section.
 */
export function applyPresetDesign(instance: SectionInstance, preset: SectionPreset): SectionInstance {
  if (preset.sectionId !== instance.sectionId) return instance;
  const definition = storeSectionRegistry.get(instance.sectionId);
  if (!definition) return instance;
  // Every design prop takes the preset's value, or the section default when the preset relies on it.
  const presetProps = (preset.props ?? {}) as Record<string, unknown>;
  const defaults = definition.defaultProps as Record<string, unknown>;
  const design = Object.fromEntries([...designKeys(definition)].map((key) => [key, key in presetProps ? presetProps[key] : defaults[key]]));
  const shell = (preset.style as { shell?: unknown } | undefined)?.shell;
  const { shell: _old, ...style } = (instance.style ?? {}) as Record<string, unknown>;
  const nextStyle = shell ? { ...style, shell: structuredClone(shell) } : style;
  return {
    ...instance,
    props: { ...instance.props, ...structuredClone(design) },
    ...(Object.keys(nextStyle).length ? { style: nextStyle } : { style: undefined }),
  };
}

/**
 * The header or footer after choosing a preset: the same section keeps its
 * content and takes the preset's design; another section starts fresh.
 */
export function chromeFromPreset(current: SectionInstance | null, preset: SectionPreset, id: string): SectionInstance | null {
  if (current && current.sectionId === preset.sectionId) return applyPresetDesign(current, preset);
  return presetInstance(preset, id);
}

/** Whether a card preset can restyle this instance (its section has the card prop). */
export function acceptsCardPreset(instance: SectionInstance | null, preset: SectionPreset): boolean {
  if (!instance || preset.kind !== "card") return false;
  const definition = storeSectionRegistry.get(instance.sectionId);
  const keys = Object.keys(preset.props ?? {});
  return Boolean(definition && keys.length && keys.every((key) => definition.propDefinitions.some((p) => p.key === key && isDesignProp(p))));
}

/** A card preset applied to a product section: only the card props change. */
export function applyCardPreset(instance: SectionInstance, preset: SectionPreset): SectionInstance {
  if (!acceptsCardPreset(instance, preset)) return instance;
  return { ...instance, props: { ...instance.props, ...structuredClone(preset.props ?? {}) } };
}

/** The data a preset depends on and how much of it the store has (for the card chip). */
export function presetDataStatus(
  preset: SectionPreset,
  counts: Partial<Record<DataNeed, number>> | undefined,
): { need: DataNeed; count: number | null } | null {
  const need = preset.dataNeeds?.[0];
  if (!need) return null;
  const count = counts?.[need];
  return { need, count: typeof count === "number" ? count : null };
}

/**
 * How many records the store has per data need, from what the editor loaded
 * (library chips, and "none at all" versus "none match" in empty states).
 */
export function storeDataCounts(input: {
  products: readonly unknown[];
  categories: readonly unknown[];
  forms?: readonly unknown[];
  contact?: { phone?: string | null; email?: string | null; whatsapp?: string | null } | null;
  navPages: number;
}): Partial<Record<DataNeed, number>> {
  const contact = input.contact ?? {};
  return {
    products: input.products.length,
    categories: input.categories.length,
    ...(input.forms && { forms: input.forms.length }),
    storeInfo: [contact.phone, contact.email, contact.whatsapp].filter((v) => typeof v === "string" && v.trim()).length,
    navigation: input.navPages,
  };
}

/** The preset a library drag carries, when it still matches its section. */
export function payloadPreset(sectionId: string, presetId: string | undefined): SectionPreset | undefined {
  const preset = presetId ? getPreset(presetId) : undefined;
  return preset && preset.sectionId === sectionId ? preset : undefined;
}
