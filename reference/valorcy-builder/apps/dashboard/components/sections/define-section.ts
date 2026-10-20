import { createElement, type ComponentType } from 'react'
import type {
  SectionComponentProps,
  SectionDefinition,
  SectionDefinitionInput,
} from '@/components/sections/registry.types'
import { compileSchema } from '@/components/sections/schema/compile-schema'

/**
 * Authoring helper for AI-first sections. TypeScript fails the build if any
 * required metadata (industries, styles, goals, complexity, density,
 * imageRequired, mobileScore, editable, editableElements) is missing.
 *
 * Two authoring modes, both valid:
 *
 * 1. **Schema-driven (preferred).** Declare `schema` and the engine derives
 *    `propDefinitions`, `itemCollections`, `editableElements`, `slots` and the
 *    image placeholders in `defaultProps` for you:
 *
 *      export const momentumSection = defineSection({
 *        id: 'hero-momentum',
 *        displayName: 'Momentum',
 *        layoutArchetype: 'split',
 *        schema: {
 *          slots: [
 *            { id: 'copy', label: 'Copy', isDefault: true },
 *            { id: 'media', label: 'Media', acceptsElements: false, max: 1 },
 *          ],
 *          blocks: [
 *            { kind: 'badge' },
 *            { kind: 'heading', level: 1, accent: true },
 *            { kind: 'body' },
 *            { kind: 'ctaRow' },
 *            { kind: 'media', slot: 'media', ratio: 'square', placeholder: 'screenshot' },
 *          ],
 *        },
 *        ...
 *      })
 *
 * 2. **Legacy flat.** Hand-written `propDefinitions` / `itemCollections`, as the
 *    un-migrated sections still do. Unchanged behaviour.
 *
 * Anything declared explicitly always wins over the compiled value, so a section
 * can adopt the schema and still override one field by hand during migration.
 */
export function defineSection (def: SectionDefinitionInput): SectionDefinition {
  if (!def.schema) return def as SectionDefinition

  const compiled = compileSchema(def.schema)

  const resolved: SectionDefinition = {
    ...def,
    // Explicit author values win; the schema fills in everything else.
    propDefinitions: def.propDefinitions?.length
      ? def.propDefinitions
      : compiled.propDefinitions,
    itemCollections: def.itemCollections?.length
      ? def.itemCollections
      : compiled.itemCollections,
    editableElements: def.editableElements?.length
      ? def.editableElements
      : compiled.editableElements,
    // Author defaults overlay the compiled ones (which supply placeholders and
    // empty collection scaffolds), so a section only spells out real copy.
    defaultProps: { ...compiled.defaultProps, ...(def.defaultProps ?? {}) },
    blocks: compiled.blocks,
    slots: compiled.slots,
    Component: withDefinition(def.Component, () => resolved),
  }

  return resolved
}

/**
 * Hands the finished definition to the section component as a prop.
 *
 * `<SectionSlot>` needs its section's compiled `blocks` / `slots`, but a section
 * component must never reach for `sectionRegistry`: the barrel sits on a genuine
 * import cycle (section file → section-surface → builder store → barrel →
 * section-definitions), which is why `components/sections/index.ts` builds its
 * map lazily. Injecting the definition here keeps the dependency pointing one
 * way and costs each section one closure.
 *
 * The getter is lazy because `resolved` is still being constructed when this
 * runs; by first render it is fully initialized.
 */
function withDefinition (
  Component: ComponentType<SectionComponentProps>,
  get: () => SectionDefinition
): ComponentType<SectionComponentProps> {
  const Wrapped = (props: SectionComponentProps) =>
    createElement(Component, { ...props, definition: props.definition ?? get() })
  Wrapped.displayName = `WithDefinition(${Component.displayName ?? Component.name ?? 'Section'})`
  return Wrapped
}
