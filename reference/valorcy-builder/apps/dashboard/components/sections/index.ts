import type { SectionCategory, SectionDefinition } from '@/components/sections/registry.types'
import { SECTION_DEFINITIONS } from '@/components/sections/section-definitions'
import { resolveSectionId } from '@/lib/builder/section-id-aliases'

// Built lazily on first access. Some modules form an import cycle
// (section file → section-surface → builder store → this barrel →
// section-definitions), so computing the map at module-eval time can run
// before SECTION_DEFINITIONS is initialized. Deferring it to first use
// guarantees the definitions are fully evaluated.
let _map: Map<string, SectionDefinition> | null = null
function registryMap (): Map<string, SectionDefinition> {
  if (_map === null) {
    _map = new Map<string, SectionDefinition>(
      SECTION_DEFINITIONS.map((d) => [d.id, d])
    )
  }
  return _map
}

export const sectionRegistry = {
  get (id: string): SectionDefinition | undefined {
    const map = registryMap()
    return map.get(id) ?? map.get(resolveSectionId(id))
  },
  /** Visible sections only. Hidden / aliased definitions are filtered out. */
  getAll (): SectionDefinition[] {
    return [...registryMap().values()].filter((d) => !d.hidden)
  },
  /** Includes hidden sections — use for resolving persisted instance ids. */
  getAllIncludingHidden (): SectionDefinition[] {
    return [...registryMap().values()]
  },
  getByCategory (category: SectionCategory): SectionDefinition[] {
    return SECTION_DEFINITIONS.filter((d) => d.category === category && !d.hidden)
  },
}

export { SECTION_DEFINITIONS } from '@/components/sections/section-definitions'
export type { SectionCategory, SectionDefinition, SectionInstance, PageContent } from '@/components/sections/registry.types'
