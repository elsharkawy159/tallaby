/**
 * SectionSchema — the single declarative model behind every section.
 *
 * A section author describes its *structure* as an ordered list of blocks.
 * `compileSchema()` (./compile-schema.ts) derives from that, deterministically:
 *
 *   • `propDefinitions`   — consumed by panels/content-panel.tsx, build-copy-schema.ts,
 *                            field-rewrite.ts and section-manifest.ts (unchanged)
 *   • `itemCollections`   — same
 *   • `editableElements`  — previously hand-maintained per section, and drift-prone
 *   • a structural manifest for the AI (block kinds + arities, so the generator knows
 *     it may add a card / drop a stat / swap the media without per-section logic)
 *   • the default `componentTree` used by the eject bridge
 *     (lib/builder/eject-section-to-tree.ts)
 *
 * The compiled output is exactly the shape sections hand-write today, so the schema
 * is additive: `defineSection()` accepts either, and a section migrates on its own
 * schedule. See docs/SECTION_ENGINE.md.
 */

import {
  CANONICAL_FIELD_PURPOSE,
  CANONICAL_ITEM_SHAPES,
  type CanonicalField,
  type FieldGroup,
} from '@/components/sections/registry.constants'
import type { PropFieldType } from '@/components/sections/registry.types'
import type { PlaceholderKind } from '@/components/sections/placeholders'

// ─── Fields ───────────────────────────────────────────────────────────────────

/**
 * One editable value. A superset of ComponentPropDefinition minus the fields the
 * compiler fills in itself (`label` defaults from the block, `canonical` defaults
 * from the block kind, `aiHint` defaults from CANONICAL_FIELD_PURPOSE).
 */
export interface FieldSpec {
  key: string
  label?: string
  type?: PropFieldType
  canonical?: CanonicalField
  aiHint?: string
  minLength?: number
  maxLength?: number
  required?: boolean
  group?: FieldGroup
  placeholder?: string
  options?: { value: string; label: string }[]
  min?: number
  max?: number
  designGroup?: 'layout' | 'typography' | 'appearance'
  /** Default value written into the section's `defaultProps`. */
  default?: unknown
}

/** A FieldSpec after compilation — every optional has been resolved. */
export type ResolvedFieldSpec = FieldSpec &
  Required<Pick<FieldSpec, 'key' | 'label' | 'type'>>

// ─── Blocks ───────────────────────────────────────────────────────────────────

export const SECTION_BLOCK_KINDS = [
  'eyebrow',
  'badge',
  'heading',
  'body',
  'note',
  'media',
  'ctaRow',
  'items',
] as const

export type SectionBlockKind = (typeof SECTION_BLOCK_KINDS)[number]

interface BlockBase {
  /**
   * Stable identity for this block within the section. Used as the element-key
   * prefix (`${instanceId}::${id}`), the navigator label source, and the AI's
   * structural address. Defaults to the block's primary field key.
   */
  id?: string
  /** Shown in the inspector outline. Defaults to a per-kind label. */
  label?: string
  /** When false the block is structural only — no inspector row, no AI copy. */
  editable?: boolean
  /**
   * Which slot renders this block. Defaults to the schema's `isDefault` slot.
   *
   * Load-bearing, not cosmetic: schema order is not render order for several
   * sections (Marquee renders its CTA row inside the detail band, Atlas renders
   * its media as a full-bleed background), so those blocks must name their slot
   * explicitly or they land in the wrong region.
   */
  slot?: string
}

/** Short kicker above the headline. */
export interface EyebrowBlock extends BlockBase {
  kind: 'eyebrow'
  field?: FieldSpec
}

/** Pill label. */
export interface BadgeBlock extends BlockBase {
  kind: 'badge'
  field?: FieldSpec
}

/**
 * Headline, optionally split into three composable parts. Multiple fields sharing
 * `canonical: 'headline'` is what tells build-copy-schema.ts to treat them as one
 * composed sentence (see its `compositionGroups`).
 */
export interface HeadingBlock extends BlockBase {
  kind: 'heading'
  /** Renders an `h1`..`h6`. Defaults to `h2` (`h1` for hero sections). */
  level?: 1 | 2 | 3 | 4 | 5 | 6
  /** Adds a gradient-accented span inside the headline. Default true. */
  accent?: boolean
  /** Adds trailing text after the accent span. Default false. */
  suffix?: boolean
  fields?: {
    headline?: FieldSpec
    accentWord?: FieldSpec
    headlineSuffix?: FieldSpec
  }
}

/** Descriptive paragraph. */
export interface BodyBlock extends BlockBase {
  kind: 'body'
  field?: FieldSpec
}

/** Small print, typically under a CTA row. */
export interface NoteBlock extends BlockBase {
  kind: 'note'
  field?: FieldSpec
}

export type MediaRatio = 'square' | 'video' | 'portrait' | 'wide' | 'auto'

/** Image / video slot. Always renders a local placeholder when unset. */
export interface MediaBlock extends BlockBase {
  kind: 'media'
  ratio?: MediaRatio
  /** Chooses the placeholder art shown before the user (or AI) picks an image. */
  placeholder?: PlaceholderKind
  fields?: { src?: FieldSpec; alt?: FieldSpec }
}

/** Primary/secondary button pair. */
export interface CtaRowBlock extends BlockBase {
  kind: 'ctaRow'
  key?: string
  minItems?: number
  maxItems?: number
}

/**
 * Repeating collection — cards, stats, logos, FAQs, plans, members, posts, …
 * `canonical` selects the standard item shape from CANONICAL_ITEM_SHAPES so the
 * populator's key mapping works without aliases.
 */
export interface ItemsBlock extends BlockBase {
  kind: 'items'
  key?: string
  canonical: CanonicalField
  minItems?: number
  maxItems?: number
  /** Overrides / extends the canonical item shape. */
  itemFields?: FieldSpec[]
  /** Subset of the canonical shape to keep. Omit to keep all of it. */
  pick?: string[]
  /** Placeholder art for the item's image field, when it has one. */
  itemPlaceholder?: PlaceholderKind
  newItem?: () => Record<string, unknown>
  defaults?: Record<string, unknown>[]
}

export type SectionBlock =
  | EyebrowBlock
  | BadgeBlock
  | HeadingBlock
  | BodyBlock
  | NoteBlock
  | MediaBlock
  | CtaRowBlock
  | ItemsBlock

// ─── Slots ────────────────────────────────────────────────────────────────────

/**
 * A named region of a section's layout that holds an ordered, user-editable list
 * of entries — schema blocks and free-form elements interleaved.
 *
 * Slots are what make a built-in section structurally editable without giving up
 * its JSX. The section keeps its own layout chrome (grids, gradients, scrims,
 * bento spans); the slot only owns the *child list* inside that chrome. A user
 * reorders, hides and adds entries within a slot, and drags elements between
 * slots, all through the standard builder drag-and-drop pipeline.
 */
export interface SlotSpec {
  id: string
  /** Shown in the content panel outline and the Layers tree. */
  label: string
  /** Block kinds the "+ Add block" menu offers here. Omit to allow all kinds. */
  accepts?: SectionBlockKind[]
  /** Hard cap on entries. Omit for unlimited. */
  max?: number
  /**
   * Whether free `ComponentNode` elements may be dropped here. Default true.
   * Set false for slots that are a single structural element (a full-bleed
   * background image), where an arbitrary child would break the layout.
   */
  acceptsElements?: boolean
  /**
   * The slot an element dropped on the section body lands in. Exactly one slot
   * per section must set this.
   */
  isDefault?: boolean
  /** Layout hints consumed only by the eject bridge (`eject-section-to-tree.ts`). */
  eject?: {
    direction?: 'row' | 'column'
    gridColumn?: string
    /** Renders as an absolutely-positioned layer rather than a grid child. */
    overlay?: boolean
  }
}

/** Slot id used when a schema declares blocks but no slots. */
export const DEFAULT_SLOT_ID = 'main'

// ─── Schema ───────────────────────────────────────────────────────────────────

export interface SectionSchema {
  blocks: SectionBlock[]
  /**
   * Layout regions. Omit for a single implicit `main` slot holding every block,
   * which is what every un-migrated section compiles to.
   */
  slots?: SlotSpec[]
  /**
   * Inspector fields that configure the section rather than being content in it —
   * a column count, a "show ratings" switch, a style select. They compile into
   * `propDefinitions` like block fields but are not slot entries, so they never
   * appear in Layers, never reorder, and never render on their own.
   */
  settings?: FieldSpec[]
}

// ─── Kind metadata ────────────────────────────────────────────────────────────

/** Per-kind compile defaults. Keeps compile-schema.ts free of magic strings. */
export const BLOCK_KIND_DEFAULTS: Record<
  SectionBlockKind,
  {
    label: string
    primaryKey: string
    type: PropFieldType
    canonical?: CanonicalField
    group: FieldGroup
    maxLength?: number
  }
> = {
  eyebrow: { label: 'Eyebrow', primaryKey: 'eyebrow', type: 'text', canonical: 'eyebrow', group: 'content', maxLength: 40 },
  badge: { label: 'Badge', primaryKey: 'badge', type: 'text', canonical: 'badge', group: 'content', maxLength: 30 },
  heading: { label: 'Headline', primaryKey: 'headline', type: 'text', canonical: 'headline', group: 'content', maxLength: 80 },
  body: { label: 'Description', primaryKey: 'description', type: 'textarea', canonical: 'body', group: 'content', maxLength: 280 },
  note: { label: 'Note', primaryKey: 'note', type: 'text', group: 'content', maxLength: 120 },
  media: { label: 'Image', primaryKey: 'imageUrl', type: 'image', canonical: 'image', group: 'media' },
  ctaRow: { label: 'Buttons', primaryKey: 'buttons', type: 'text', canonical: 'ctaPrimary', group: 'cta' },
  items: { label: 'Items', primaryKey: 'items', type: 'text', canonical: 'items', group: 'content' },
}

/** Human-readable AI hint for a canonical field, when the author gives none. */
export function defaultAiHint (canonical: CanonicalField | undefined): string | undefined {
  return canonical ? CANONICAL_FIELD_PURPOSE[canonical] : undefined
}

/** The standard item field set for a collection canonical key. */
export function canonicalItemShape (
  canonical: CanonicalField
): Record<string, string> | undefined {
  return (CANONICAL_ITEM_SHAPES as Record<string, Record<string, string>>)[canonical]
}

/** Narrowing helper — a block that produces an item collection rather than props. */
export function isCollectionBlock (
  block: SectionBlock
): block is ItemsBlock | CtaRowBlock {
  return block.kind === 'items' || block.kind === 'ctaRow'
}

/** The block's stable identity (element-key prefix, AI address, navigator label). */
export function blockId (block: SectionBlock): string {
  if (block.id) return block.id
  if (block.kind === 'items' || block.kind === 'ctaRow') {
    return block.key ?? BLOCK_KIND_DEFAULTS[block.kind].primaryKey
  }
  return BLOCK_KIND_DEFAULTS[block.kind].primaryKey
}
