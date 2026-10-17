import { sectionRegistry } from '@/components/sections'
import { SECTION_CATEGORIES } from '@/components/sections/registry.constants'
import type { SectionCategory } from '@/components/sections/registry.types'
import { planSectionCategory } from '@/lib/ai/plan-functionality'
import type { PlanSection } from '@/lib/ai/site-plan-schema'

/** Navbar/footer are shared site chrome — shown once on the canvas, not per page. */
export function isChromePlanSection (section: Pick<PlanSection, 'type' | 'variant'>): boolean {
  const category = planSectionCategory(section)
  return category === 'navbar' || category === 'footer'
}

/** Name shown for a planned section: the user's/planner's label, else the section's name. */
export function planSectionLabel (
  section: Pick<PlanSection, 'type' | 'variant' | 'label'>,
  categoryLabel: (category: string) => string
): string {
  const label = section.label?.trim()
  if (label) return label
  const displayName = section.variant ? sectionRegistry.get(section.variant)?.displayName : undefined
  return displayName || categoryLabel(planSectionCategory(section))
}

/** Section types a page body can use, in registry order. */
export const BODY_SECTION_CATEGORIES = (SECTION_CATEGORIES as readonly string[]).filter(
  (c) => c !== 'navbar' && c !== 'footer' && c !== 'custom' && sectionRegistry.getByCategory(c as SectionCategory).length > 0
)

/** Visible templates for a section type. */
export function templatesFor (category: string) {
  return sectionRegistry
    .getByCategory(category as SectionCategory)
    .filter((def) => !(def as { hidden?: boolean }).hidden)
}
