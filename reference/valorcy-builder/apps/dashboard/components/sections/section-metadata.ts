/**
 * Server-safe section catalog.
 *
 * Section definitions live inside their components' `"use client"` files, so in
 * any server context (Server Action, route handler, RSC) Next hands back
 * client-reference proxies instead of the real objects: reading `.category` off
 * one returns `undefined` rather than throwing, which silently reduced every
 * server-side section lookup to "no candidates". This module rebuilds the full
 * catalog from the plain data snapshot in `section-metadata.generated.ts`, which
 * carries no client imports and therefore survives the RSC boundary intact.
 *
 * Everything a server path needs is here — id, category, metadata, defaultProps,
 * propDefinitions, itemCollections, blocks. The only omissions are the React
 * `Component` (the server never renders a section; the builder and the public
 * renderer read the live registry on the client) and `migrateProps` (used solely
 * by the client-side builder's `section-migrations.ts`).
 *
 * Regenerate the snapshot after adding or re-tagging a section:
 *   pnpm vitest run scripts/generate-section-metadata --reporter=verbose
 */
import type { SectionDefinition } from '@/components/sections/registry.types'
import { SECTION_METADATA_DATA } from '@/components/sections/section-metadata.generated'

/**
 * Registry definitions as the server sees them.
 *
 * Deliberately typed as the full `SectionDefinition` so every existing
 * server-side signature keeps compiling unchanged. At runtime `Component` and
 * `migrateProps` are absent — safe because no server path renders a section or
 * migrates props: the builder and the public renderer both read the live client
 * registry, which has the real components.
 */
export type ServerSectionDefinition = SectionDefinition

/**
 * Rebuild one definition, restoring `newItemTemplate()` from the captured
 * template. Callers mutate the object they get back (populate-page spreads new
 * items over it), so every call returns a fresh deep copy.
 */
function restore (data: Record<string, unknown>): ServerSectionDefinition {
  const collections = data.itemCollections

  if (!Array.isArray(collections)) {
    return data as unknown as ServerSectionDefinition
  }

  return {
    ...data,
    itemCollections: collections.map((entry) => {
      const { itemTemplate, ...rest } = entry as Record<string, unknown>
      const template = (itemTemplate ?? {}) as Record<string, unknown>
      return {
        ...rest,
        newItemTemplate: () => structuredClone(template),
      }
    }),
  } as unknown as ServerSectionDefinition
}

let catalogCache: ServerSectionDefinition[] | null = null
let byIdCache: Map<string, ServerSectionDefinition> | null = null

/** Every known section, in generated (registry) order. */
export function serverSectionCatalog (): ServerSectionDefinition[] {
  if (catalogCache === null) catalogCache = SECTION_METADATA_DATA.map(restore)
  return catalogCache
}

/** Catalog indexed by section id. */
export function serverSectionCatalogById (): Map<string, ServerSectionDefinition> {
  if (byIdCache === null) {
    byIdCache = new Map(serverSectionCatalog().map((def) => [def.id, def]))
  }
  return byIdCache
}
