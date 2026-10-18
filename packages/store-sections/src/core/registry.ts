import type { SectionInstance } from "../config/schema";
import type { AnySectionDefinition, CatalogQuery, SectionCategory } from "./types";

export type SectionRegistry = {
  get: (sectionId: string) => AnySectionDefinition | undefined;
  list: () => AnySectionDefinition[];
  byCategory: (category: SectionCategory) => AnySectionDefinition[];
  /** For `validateSiteConfig({ allowedSections })`: id → highest known version. */
  allowedSections: () => Record<string, number>;
};

export function createSectionRegistry(definitions: readonly AnySectionDefinition[]): SectionRegistry {
  const map = new Map<string, AnySectionDefinition>();
  for (const definition of definitions) {
    if (map.has(definition.id)) throw new Error(`Duplicate section id: ${definition.id}`);
    map.set(definition.id, definition);
  }
  const all = [...map.values()];
  return {
    get: (sectionId) => map.get(sectionId),
    list: () => all,
    byCategory: (category) => all.filter((d) => d.category === category),
    allowedSections: () => Object.fromEntries(all.map((d) => [d.id, d.version])),
  };
}

/**
 * Pending migrations for one instance (ported from the reference
 * `lib/builder/section-migrations.ts`). Pure; unchanged without a definition
 * or a migrator.
 */
export function applyMigrations(instance: SectionInstance, definition: AnySectionDefinition | undefined): SectionInstance {
  if (!definition) return instance;
  if (instance.version >= definition.version) return instance;
  if (!definition.migrateProps) return instance;
  return { ...instance, props: definition.migrateProps(instance.props, instance.version), version: definition.version };
}

/**
 * The validated props of an instance: defaults overlaid with the stored
 * props, then parsed. Invalid stored props fall back to the defaults so a bad
 * row can never break the page.
 */
export function resolveSectionProps<P extends Record<string, unknown>>(
  definition: { propsSchema: { safeParse: (v: unknown) => { success: boolean; data?: unknown } }; defaultProps: P },
  props: Record<string, unknown>,
): P {
  const parsed = definition.propsSchema.safeParse({ ...definition.defaultProps, ...props });
  return (parsed.success ? parsed.data : definition.defaultProps) as P;
}

const CONTENT_FIELD_TYPES = new Set(["text", "textarea", "image", "url"]);

/**
 * The seller-content props of every section (text, images, links and item
 * lists), keyed by section id. applyTemplate keeps these when a template
 * section has the same instance id as the store's (PLAN.md §8.1, P4-05).
 */
export function contentOverrideKeys(registry: SectionRegistry): Record<string, string[]> {
  return Object.fromEntries(
    registry
      .list()
      .map((d) => [
        d.id,
        [...d.propDefinitions.filter((p) => CONTENT_FIELD_TYPES.has(p.type)).map((p) => p.key), ...(d.itemCollections ?? []).map((c) => c.key)],
      ]),
  );
}

/** Every form id a page's sections show (for the host, which resolves them for its own store only). */
export function collectFormIds(sections: readonly SectionInstance[], registry: SectionRegistry): string[] {
  const out = new Set<string>();
  for (const instance of sections) {
    const definition = registry.get(instance.sectionId);
    if (!definition?.formRef) continue;
    const formId = definition.formRef(resolveSectionProps(definition, applyMigrations(instance, definition).props));
    if (formId) out.add(formId);
  }
  return [...out];
}

/** Every catalog query of a page, keyed by section instance id (for the host resolver). */
export function collectCatalogQueries(
  sections: readonly SectionInstance[],
  registry: SectionRegistry,
): Record<string, CatalogQuery> {
  const out: Record<string, CatalogQuery> = {};
  for (const instance of sections) {
    const definition = registry.get(instance.sectionId);
    if (!definition?.catalogQuery) continue;
    const props = resolveSectionProps(definition, applyMigrations(instance, definition).props);
    const query = definition.catalogQuery(props);
    if (query) out[instance.id] = query;
  }
  return out;
}
