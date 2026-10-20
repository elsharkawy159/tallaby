/**
 * Compiles a SectionSchema down to the flat contract the rest of the app already
 * speaks. Nothing downstream needs to know schemas exist:
 *
 *   propDefinitions  → panels/content-panel.tsx, lib/ai/build-copy-schema.ts,
 *                      lib/ai/field-rewrite.ts, lib/ai/section-manifest.ts
 *   itemCollections  → the same, plus lib/builder/cms-smart-connect.ts
 *   editableElements → lib/ai/section-manifest.ts (was hand-written and drifted)
 *   defaultProps     → registry defaults for a freshly inserted section
 *   blocks           → NEW: structural manifest for the AI generator
 *
 * The compile is pure and deterministic, so `__tests__/section-schema.test.ts`
 * can assert a migrated section's compiled output equals what it used to declare
 * by hand — that equality is what makes the migration safe to do incrementally.
 */

import {
  CANONICAL_ITEM_SHAPES,
  type CanonicalField,
  type FieldGroup,
} from '@/components/sections/registry.constants'
import type {
  ComponentPropDefinition,
  ItemCollectionDefinition,
  PropFieldType,
} from '@/components/sections/registry.types'
import { placeholderFor, type PlaceholderKind } from '@/components/sections/placeholders'
import {
  BLOCK_KIND_DEFAULTS,
  DEFAULT_SLOT_ID,
  blockId,
  canonicalItemShape,
  defaultAiHint,
  type CtaRowBlock,
  type FieldSpec,
  type HeadingBlock,
  type ItemsBlock,
  type MediaBlock,
  type SectionBlock,
  type SectionBlockKind,
  type SectionSchema,
  type SlotSpec,
} from '@/components/sections/schema/section-schema'

// ─── Compiled output ──────────────────────────────────────────────────────────

/** Structural description of one block, handed to the AI generator. */
export interface CompiledBlock {
  id: string
  kind: SectionBlock['kind']
  label: string
  /** Prop keys this block owns (empty for collection blocks). */
  propKeys: string[]
  /** Collection key, for `items` / `ctaRow`. */
  collectionKey?: string
  canonical?: CanonicalField
  minItems?: number
  maxItems?: number
  editable: boolean
  /** Slot this block renders in. Always resolved — never undefined after compile. */
  slot: string
}

/** A `SlotSpec` after compilation — defaults resolved, member blocks resolved. */
export interface CompiledSlot {
  id: string
  label: string
  accepts?: SectionBlockKind[]
  max?: number
  acceptsElements: boolean
  isDefault: boolean
  eject?: SlotSpec['eject']
  /** Ids of the blocks assigned to this slot, in schema order. */
  blockIds: string[]
}

export interface CompiledSchema {
  propDefinitions: ComponentPropDefinition[]
  itemCollections: ItemCollectionDefinition[]
  editableElements: string[]
  defaultProps: Record<string, unknown>
  blocks: CompiledBlock[]
  slots: CompiledSlot[]
}

// ─── Field compilation ────────────────────────────────────────────────────────

function compileField (
  spec: FieldSpec,
  fallback: {
    label: string
    type: PropFieldType
    canonical?: CanonicalField
    group: FieldGroup
    maxLength?: number
  }
): ComponentPropDefinition {
  const canonical = spec.canonical ?? fallback.canonical
  const def: ComponentPropDefinition = {
    key: spec.key,
    label: spec.label ?? fallback.label,
    type: spec.type ?? fallback.type,
  }

  // Only emit optional keys when they carry a value — keeps the compiled output
  // byte-comparable with the hand-written definitions it replaces.
  if (spec.placeholder !== undefined) def.placeholder = spec.placeholder
  if (spec.options !== undefined) def.options = spec.options
  if (spec.min !== undefined) def.min = spec.min
  if (spec.max !== undefined) def.max = spec.max
  if (spec.designGroup !== undefined) def.designGroup = spec.designGroup

  const aiHint = spec.aiHint ?? defaultAiHint(canonical)
  if (aiHint !== undefined) def.aiHint = aiHint

  const maxLength = spec.maxLength ?? fallback.maxLength
  if (maxLength !== undefined) def.maxLength = maxLength
  if (spec.minLength !== undefined) def.minLength = spec.minLength
  if (spec.required !== undefined) def.required = spec.required
  if (canonical !== undefined) def.canonical = canonical

  const group = spec.group ?? fallback.group
  if (group !== undefined) def.group = group

  return def
}

/** Field type inferred from a CANONICAL_ITEM_SHAPES value. */
function itemFieldType (key: string, declared: string): PropFieldType {
  if (declared === 'number') return 'number'
  if (declared === 'boolean') return 'switch'
  if (/^(image|avatar|logo|imageUrl|photo)$/i.test(key)) return 'image'
  if (/(href|url|link)$/i.test(key)) return 'url'
  if (/^(description|excerpt|answer|bio|quote)$/i.test(key)) return 'textarea'
  return 'text'
}

function titleCase (key: string): string {
  const spaced = key
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .trim()
  return spaced.charAt(0).toUpperCase() + spaced.slice(1)
}

/** Builds the item field definitions for a collection block. */
function compileItemFields (block: ItemsBlock): ComponentPropDefinition[] {
  const shape = canonicalItemShape(block.canonical)
  const overrides = new Map((block.itemFields ?? []).map((f) => [f.key, f]))

  const keys = block.pick ?? (shape ? Object.keys(shape) : [])
  const fromShape = keys.map((key) => {
    const declared = shape?.[key] ?? 'string'
    const override = overrides.get(key)
    overrides.delete(key)
    return compileField(override ?? { key }, {
      label: titleCase(key),
      type: itemFieldType(key, declared),
      group: 'content',
    })
  })

  // Author-declared fields that aren't part of the canonical shape.
  const extra = [...overrides.values()].map((f) =>
    compileField(f, { label: titleCase(f.key), type: 'text', group: 'content' })
  )

  return [...fromShape, ...extra]
}

/** Default value for one item, derived from its compiled field definitions. */
function defaultItem (
  fields: ComponentPropDefinition[],
  placeholder?: PlaceholderKind
): Record<string, unknown> {
  const item: Record<string, unknown> = {}
  for (const f of fields) {
    if (f.type === 'image') item[f.key] = placeholderFor(placeholder)
    else if (f.type === 'number') item[f.key] = 0
    else if (f.type === 'switch') item[f.key] = false
    else if (f.type === 'url') item[f.key] = '#'
    else item[f.key] = ''
  }
  return item
}

// ─── Block compilation ────────────────────────────────────────────────────────

const CTA_ITEM_FIELDS: ComponentPropDefinition[] = [
  { key: 'label', label: 'Label', type: 'text', canonical: 'ctaPrimary', group: 'cta' },
  { key: 'href', label: 'Link', type: 'url', canonical: 'ctaLink', group: 'cta' },
  {
    key: 'variant',
    label: 'Style',
    type: 'select',
    options: [
      { value: 'default', label: 'Solid' },
      { value: 'secondary', label: 'Soft' },
      { value: 'outline', label: 'Outline' },
      { value: 'ghost', label: 'Ghost' },
    ],
    group: 'cta',
  },
]

function compileHeading (block: HeadingBlock): ComponentPropDefinition[] {
  const base = BLOCK_KIND_DEFAULTS.heading
  const f = block.fields ?? {}
  const out: ComponentPropDefinition[] = [
    compileField(f.headline ?? { key: 'headline' }, base),
  ]
  // accent defaults on: the gradient accent span is part of the house style.
  if (block.accent !== false) {
    out.push(
      compileField(f.accentWord ?? { key: 'accentWord' }, {
        label: 'Accent word',
        type: 'text',
        canonical: 'headline',
        group: 'content',
        maxLength: 30,
      })
    )
  }
  if (block.suffix) {
    out.push(
      compileField(f.headlineSuffix ?? { key: 'headlineSuffix' }, {
        label: 'Headline suffix',
        type: 'text',
        canonical: 'headline',
        group: 'content',
        maxLength: 40,
      })
    )
  }
  return out
}

function compileMedia (block: MediaBlock): ComponentPropDefinition[] {
  const f = block.fields ?? {}
  return [
    compileField(f.src ?? { key: 'imageUrl' }, BLOCK_KIND_DEFAULTS.media),
    compileField(f.alt ?? { key: 'imageAlt' }, {
      label: 'Image alt',
      type: 'text',
      canonical: 'imageAlt',
      group: 'media',
      maxLength: 120,
    }),
  ]
}

function compileCtaRow (block: CtaRowBlock): ItemCollectionDefinition {
  const key = block.key ?? 'buttons'
  return {
    key,
    label: block.label ?? 'Buttons',
    minItems: block.minItems ?? 1,
    maxItems: block.maxItems ?? 3,
    newItemTemplate: () => ({ label: 'Learn more', href: '#', variant: 'secondary' }),
    itemPropDefinitions: CTA_ITEM_FIELDS,
  }
}

// ─── Entry point ──────────────────────────────────────────────────────────────

/**
 * Resolves the declared slots, or synthesises the single implicit `main` slot a
 * section without `schema.slots` behaves as. Exactly one slot is `isDefault`:
 * the author's choice, else the first.
 */
function compileSlots (specs: SlotSpec[] | undefined): CompiledSlot[] {
  const declared: SlotSpec[] = specs?.length
    ? specs
    : [{ id: DEFAULT_SLOT_ID, label: 'Content', isDefault: true }]

  const defaultIndex = Math.max(
    0,
    declared.findIndex((s) => s.isDefault)
  )

  return declared.map((spec, i) => ({
    id: spec.id,
    label: spec.label,
    ...(spec.accepts ? { accepts: spec.accepts } : {}),
    ...(spec.max !== undefined ? { max: spec.max } : {}),
    acceptsElements: spec.acceptsElements !== false,
    isDefault: i === defaultIndex,
    ...(spec.eject ? { eject: spec.eject } : {}),
    blockIds: [],
  }))
}

export function compileSchema (schema: SectionSchema): CompiledSchema {
  const propDefinitions: ComponentPropDefinition[] = []
  const itemCollections: ItemCollectionDefinition[] = []
  const editableElements: string[] = []
  const defaultProps: Record<string, unknown> = {}
  const blocks: CompiledBlock[] = []

  const slots = compileSlots(schema.slots)
  const slotById = new Map(slots.map((s) => [s.id, s]))
  const defaultSlotId = (slots.find((s) => s.isDefault) ?? slots[0]!).id

  /** A block's slot, falling back to the default when unset or misspelled. */
  const slotFor = (block: SectionBlock): string =>
    block.slot && slotById.has(block.slot) ? block.slot : defaultSlotId

  for (const block of schema.blocks) {
    const id = blockId(block)
    const editable = block.editable !== false
    const kindDefaults = BLOCK_KIND_DEFAULTS[block.kind]
    const slot = slotFor(block)
    slotById.get(slot)!.blockIds.push(id)

    if (block.kind === 'items') {
      const key = block.key ?? block.canonical
      const itemPropDefinitions = compileItemFields(block)
      const template = block.newItem ?? (() => defaultItem(itemPropDefinitions, block.itemPlaceholder))

      itemCollections.push({
        key,
        label: block.label ?? titleCase(key),
        ...(block.minItems !== undefined ? { minItems: block.minItems } : {}),
        ...(block.maxItems !== undefined ? { maxItems: block.maxItems } : {}),
        newItemTemplate: template,
        itemPropDefinitions,
      })

      defaultProps[key] =
        block.defaults ??
        Array.from({ length: block.minItems ?? 3 }, () => template())

      if (editable) {
        editableElements.push(key)
        for (const f of itemPropDefinitions) editableElements.push(`${key}.${f.key}`)
      }

      blocks.push({
        id,
        kind: block.kind,
        label: block.label ?? titleCase(key),
        propKeys: [],
        collectionKey: key,
        canonical: block.canonical,
        ...(block.minItems !== undefined ? { minItems: block.minItems } : {}),
        ...(block.maxItems !== undefined ? { maxItems: block.maxItems } : {}),
        editable,
        slot,
      })
      continue
    }

    if (block.kind === 'ctaRow') {
      const collection = compileCtaRow(block)
      itemCollections.push(collection)
      defaultProps[collection.key] = [
        { label: 'Get started', href: '#', variant: 'primary' },
        { label: 'Learn more', href: '#', variant: 'secondary' },
      ].slice(0, Math.max(1, collection.minItems ?? 1) === 1 ? 2 : collection.minItems)

      if (editable) {
        editableElements.push(collection.key)
        for (const f of CTA_ITEM_FIELDS) editableElements.push(`${collection.key}.${f.key}`)
      }

      blocks.push({
        id,
        kind: block.kind,
        label: collection.label,
        propKeys: [],
        collectionKey: collection.key,
        canonical: 'ctaPrimary',
        ...(collection.minItems !== undefined ? { minItems: collection.minItems } : {}),
        ...(collection.maxItems !== undefined ? { maxItems: collection.maxItems } : {}),
        editable,
        slot,
      })
      continue
    }

    // ─ Field-producing blocks ─
    let defs: ComponentPropDefinition[]
    if (block.kind === 'heading') {
      defs = compileHeading(block)
    } else if (block.kind === 'media') {
      defs = compileMedia(block)
    } else {
      const spec = block.field ?? { key: kindDefaults.primaryKey }
      defs = [compileField(spec, kindDefaults)]
    }

    propDefinitions.push(...defs)

    // Defaults: explicit `default` wins; media slots fall back to a placeholder.
    const specs: (FieldSpec | undefined)[] =
      block.kind === 'heading'
        ? [block.fields?.headline, block.fields?.accentWord, block.fields?.headlineSuffix]
        : block.kind === 'media'
          ? [block.fields?.src, block.fields?.alt]
          : [block.field]

    defs.forEach((def, i) => {
      const explicit = specs[i]?.default
      if (explicit !== undefined) {
        defaultProps[def.key] = explicit
      } else if (def.type === 'image') {
        defaultProps[def.key] = placeholderFor(
          block.kind === 'media' ? block.placeholder : undefined,
          block.kind === 'media' ? block.ratio : undefined
        )
      }
    })

    if (editable) editableElements.push(...defs.map((d) => d.key))

    blocks.push({
      id,
      kind: block.kind,
      label: block.label ?? kindDefaults.label,
      propKeys: defs.map((d) => d.key),
      ...(defs[0]?.canonical ? { canonical: defs[0].canonical } : {}),
      editable,
      slot,
    })
  }

  // Settings configure the section; they are fields without a block.
  for (const spec of schema.settings ?? []) {
    propDefinitions.push(
      compileField(spec, {
        label: titleCase(spec.key),
        type: spec.options ? 'select' : 'text',
        group: 'layout',
      })
    )
    if (spec.default !== undefined) defaultProps[spec.key] = spec.default
  }

  return { propDefinitions, itemCollections, editableElements, defaultProps, blocks, slots }
}

/** Canonical keys that address an item collection rather than a scalar prop. */
export const COLLECTION_CANONICALS = new Set<string>(Object.keys(CANONICAL_ITEM_SHAPES))
