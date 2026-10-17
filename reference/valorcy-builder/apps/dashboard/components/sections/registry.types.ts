import type { ComponentType, CSSProperties } from 'react'
import type { ComponentNode } from '@/lib/builder/component-node'
import type { AnimationConfig, ComponentStyle, DeepPartial } from '@/lib/builder/component-style'
import type {
  CanonicalField,
  FieldGroup,
  SECTION_CATEGORIES,
  SECTION_COMPLEXITY,
  SECTION_DENSITY,
  SECTION_FUNNEL_STAGES,
  SECTION_GOALS,
  SECTION_INDUSTRIES,
  SECTION_POSITIONS,
  SECTION_STYLES,
} from '@/components/sections/registry.constants'
// Type-only imports — erased at build time, so the schema ↔ types cycle is safe.
import type { SectionSchema } from '@/components/sections/schema/section-schema'
import type { CompiledBlock, CompiledSlot } from '@/components/sections/schema/compile-schema'
import type { SectionOptions } from '@/components/sections/schema/section-options'

export type PropFieldType =
  | 'text'
  | 'textarea'
  | 'url'
  | 'image'
  | 'number'
  | 'select'
  | 'switch'
  | 'color'

export interface ComponentPropDefinition {
  key: string
  label: string
  type: PropFieldType
  placeholder?: string
  options?: { value: string; label: string }[]
  min?: number
  max?: number
  /** When true, design panel can tune this as typography */
  designGroup?: 'layout' | 'typography' | 'appearance'

  // ===== AI-first metadata =====
  /** Short hint the AI uses when generating content for this field. */
  aiHint?: string
  /** Soft upper bound on generated text length (chars). */
  maxLength?: number
  /** Soft lower bound on generated text length (chars). */
  minLength?: number
  /** Marked required for AI population and visual editor validation. */
  required?: boolean
  /** Links this prop to a canonical field so the populator can address it by intent. */
  canonical?: CanonicalField
  /** Controls accordion grouping in the content panel. */
  group?: FieldGroup
}

export interface ItemCollectionDefinition {
  key: string
  label: string
  minItems?: number
  maxItems?: number
  newItemTemplate: () => Record<string, unknown>
  itemPropDefinitions?: ComponentPropDefinition[]
}

export type SectionCategory = (typeof SECTION_CATEGORIES)[number]

/** Describes a CMS collection bound as the live data source for a dynamic section. */
export interface SectionDataSource {
  type: 'cms_collection'
  collectionId: string
  collectionSlug: string
  /** Max items to render per page. Defaults to 9. */
  itemLimit?: number
  /** CMS field key or built-in sort key (orderIndex, publishedAt, slug). */
  sortBy?: string
  sortDir?: 'asc' | 'desc'
  /** When true, paginate on the public site using itemLimit as page size. */
  paginate?: boolean
  /** Shared presentation fields applied to every CMS item at render time. */
  itemTemplate?: Record<string, unknown>
  /** Section category stored at connect-time so server-side enrichment never needs the client registry. */
  category?: string
  /** Item-collection prop key stored at connect-time (e.g. "posts", "members", "listings"). */
  itemsPropKey?: string
}

/** Injected at public render time when pagination is enabled (not persisted). */
export interface SectionPaginationMeta {
  instanceId: string
  page: number
  totalPages: number
  param: string
}

export interface SectionInstance {
  id: string
  sectionId: string
  version: number
  props: Record<string, unknown>
  /**
   * Per-locale partial overrides for text-bearing props. `props` always holds
   * the default-locale content; `translations[locale]` overlays only the fields
   * that differ. Resolved at render time via `resolveSectionForLocale` so section
   * components keep reading flat `props`. Absent for monolingual (English) sites.
   */
  translations?: Record<string, LocalizedPropsOverlay>
  style?: ComponentStyle
  breakpointStyles?: Record<string, DeepPartial<ComponentStyle>>
  animation?: AnimationConfig
  componentTree?: ComponentNode[]
  /**
   * Per-instance structural overrides for a schema-driven section's slots.
   *
   * Absent means "render the schema's default block order, nothing hidden" — so
   * every page saved before slots existed renders byte-identically and nothing
   * rewrites stored JSONB.
   *
   * Deliberately a top-level field rather than a `props` key: `updateSectionProps`
   * redirects writes into `translations[locale]` whenever the builder is on a
   * non-default locale, which would fork a section's *structure* per language.
   */
  slots?: Record<string, SlotLayout>
  savedBlockRef?: string
}

/**
 * One slot's user-authored layout. `order` holds entry ids only — never node
 * bodies, which live in `injectedChildren['<instanceId>::slot:<slotId>']` so the
 * existing component-node store actions keep working on them unchanged.
 */
export interface SlotLayout {
  /** Ordered entry ids: `block:<blockId>` | `node:<componentNodeId>`. */
  order?: string[]
  /** Block ids the user removed. Free elements are deleted outright, not hidden. */
  hidden?: string[]
}

/**
 * A partial, locale-specific overlay of a section's props. Mirrors the shape of
 * `props` but every field is optional; arrays (item collections) overlay by index.
 * Only text-bearing fields are localized — never images, colors, or numbers.
 */
export type LocalizedPropsOverlay = Record<string, unknown>

/** Per-element HTML / visibility metadata (builder chrome), keyed like elementStyles */
export interface ElementChromeAttributes {
  htmlId?: string
  tag?: string
  visibility?: 'visible' | 'hidden'
}

export interface PageContent {
  sections: SectionInstance[]
  elementStyles?: Record<string, CSSProperties>
  elementAttributes?: Record<string, ElementChromeAttributes>
  /**
   * User-inserted element subtrees nested inside pre-built (instrumented) section
   * containers, keyed by the parent container's element id (`sectionId::nodeKey`,
   * either an `__i:` instrumented path or a tree-node nanoid).
   */
  injectedChildren?: Record<string, ComponentNode[]>
}

export type SectionRootStyleOptions = {
  defaultBackground?: string | false
  defaultColor?: string
  applySectionPadding?: boolean
}

export type SectionComponentProps = {
  instance: SectionInstance
  isPreview?: boolean
  /**
   * The section's own compiled definition, injected by `defineSection()` so a
   * section component can read its `blocks` / `slots` without importing
   * `sectionRegistry` (which would close an import cycle). Only present for
   * schema-driven sections.
   */
  definition?: SectionDefinition
}

export type SectionIndustry = (typeof SECTION_INDUSTRIES)[number]
export type SectionStyle = (typeof SECTION_STYLES)[number]
export type SectionGoal = (typeof SECTION_GOALS)[number]
export type SectionComplexity = (typeof SECTION_COMPLEXITY)[number]
export type SectionDensity = (typeof SECTION_DENSITY)[number]
export type SectionPosition = (typeof SECTION_POSITIONS)[number]
export type SectionFunnelStage = (typeof SECTION_FUNNEL_STAGES)[number]

export interface SectionNeighbors {
  /** Section ids that pair well placed before this section */
  before?: string[]
  /** Section ids that pair well placed after this section */
  after?: string[]
}

/**
 * Layout archetype — the section's structural identity. Enforced unique within a
 * category by `__tests__/section-archetypes.test.ts`, so no two sections in the
 * same category can ship the same layout.
 */
export const SECTION_LAYOUT_ARCHETYPES = [
  'centered',
  'split',
  'asymmetric',
  'overlap',
  'editorial',
  'storytelling',
  'product-first',
  'floating',
  'bento',
  'marquee',
  'grid',
  'list',
  'carousel',
  'timeline',
  'masonry',
  'accordion',
  'tabs',
  'banner',
  'minimal',
  'full-bleed',
  // Oversized type over layered light — the loudest centered variant.
  'statement',
  // Content held inside a card that sits within the page container.
  'contained',
  // A single compact row between hairlines, meant to sit between sections.
  'strip',
  // Two marquee rows scrolling in opposite directions.
  'dual-marquee',
  // Cells separated by shared hairline rules rather than separate cards.
  'divided-grid',
  // Every item sits in its own rounded chip, flowing and wrapping.
  'chips',
  // A grid whose cells each carry a caption under the item.
  'captioned-grid',
  // A rotated label and divider on a side rail, content flowing beside it.
  'side-label',
  // A dark, inverted surface regardless of the site theme.
  'inverted',
  // Two stacked tiers separated by a rule (e.g. logos over a ratings bar).
  'tiered',
  // KPI tiles each carrying a trend indicator, like an analytics dashboard.
  'dashboard',
  // A searchable help-centre index: a filter field over entries grouped by topic.
  'directory',
  // Plan cards over a striped feature list with a check or cross per plan.
  'comparison',
  // A full table: options across the top, attributes down the side.
  'matrix',
  // Four or more equal tiers stepping up in one row.
  'ladder',
  // Several different kinds of content stacked in one narrow centred column.
  'stacked',
  // A dense wall of quote cards under a summary score.
  'wall',
  // Numbered nodes joined by one connector, stepping across a single row.
  'stepper',
  // Entries alternate sides of a centre spine.
  'zigzag',
  // A progress rail whose nodes carry a done / active / upcoming state.
  'tracker',
  // Many small equal tiles packed with tight gutters, like a contact sheet.
  'dense-grid',
  // Copy beside a tabbed code window.
  'code-sample',
  // Two columns of prose: an introduction beside the detail.
  'prose-columns',
  // A centred statement over equal value pillars, each under a pill label.
  'pillars',
  // Contact details beside a request form held in a card.
  'info-form',
  // Cards that each lead with an image above their copy.
  'media-cards',
  // Cards that each close with their own call-to-action link.
  'linked-cards',
  // Cards that each carry a ruled-off spec / deliverables list under their copy.
  'spec-cards',
  // A grid in which every card is itself a link, closed by one action.
  'link-grid',
  // A wide location map over a row of contact-detail tiles.
  'map',
  // Compact text rows, each tagged and linking out, like a job board.
  'board',
  // Cards recording completed outcomes — the final figure set against the original ask.
  'track-record',
  // A map panel beside a scrolling column of the places on it.
  'map-list',
  // A grid of results beside a rail of filter options.
  'filter-rail',
  // Entries led by oversized ordinal numbers in a gutter, read as a sequence.
  'numbered-list',
  // Rows priced across several fixed columns (sizes, glass / bottle).
  'price-columns',
  // A list of entries beside a contact card holding the details and one action.
  'list-card',
  // Copy beside a card of selectable time slots over a short request form.
  'slot-picker',
  // Rows that each pair copy with a price and their own action, under an event header.
  'priced-rows',
  // Copy and a media preview beside a narrow action card.
  'media-sidebar',
  // A search bar over a grid of result cards.
  'search-results',
] as const

export type SectionLayoutArchetype = (typeof SECTION_LAYOUT_ARCHETYPES)[number]

export interface SectionDefinition {
  id: string
  displayName: string
  description: string
  category: SectionCategory
  tags?: string[]
  thumbnailUrl?: string
  isPremium?: boolean   // true = Pro plan required to insert; absent or false = free
  defaultProps: Record<string, unknown>
  defaultStyle?: Partial<ComponentStyle>
  /** Passed to section root style builder (muted backgrounds, padding behavior). */
  rootStyleOptions?: SectionRootStyleOptions
  propDefinitions: ComponentPropDefinition[]
  usageCount?: number
  itemCollections?: ItemCollectionDefinition[]
  version?: number
  migrateProps?: (
    oldProps: Record<string, unknown>,
    fromVersion: number
  ) => Record<string, unknown>
  Component: ComponentType<SectionComponentProps>

  // ===== AI-first metadata (v2 registry) =====
  /** Industries this section fits well. Used by the planner to score selection. */
  industries?: SectionIndustry[]
  /** Visual / mood styles this section embodies. */
  styles?: SectionStyle[]
  /** Conversion / page goals this section helps achieve. */
  goals?: SectionGoal[]
  /** Implementation / cognitive complexity for editors. */
  complexity?: SectionComplexity
  /** How information-dense the section feels visually. */
  density?: SectionDensity
  /** True when at least one image slot must be filled for the section to look right. */
  imageRequired?: boolean
  /** 0–100 hand-tuned score for mobile presentation quality. */
  mobileScore?: number
  /** Whether the section exposes user-editable content (false only for decorative / structural). */
  editable?: boolean
  /** Section ids that pair well as neighbors. Used by the page assembler. */
  recommendedNeighbors?: SectionNeighbors
  /** Top-level editable element keys ("title","subtitle","buttons","images","items.title", ...). */
  editableElements?: string[]
  /**
   * Preferred placement in the page flow. Falls back to a category default
   * (DEFAULT_POSITION_BY_CATEGORY) when unset.
   */
  bestPosition?: SectionPosition
  /** Categories that should not appear immediately after this section. */
  avoidAfter?: SectionCategory[]
  /** When true, the section is hidden from the insert palette and AI manifest. */
  hidden?: boolean

  // ===== Extended v2 metadata =====
  /** Section ids that combine well thematically (used for page diversity scoring). */
  compatibleWith?: string[]
  /** Section ids that should not appear on the same page (anti-pairing). */
  avoidWith?: string[]
  /** Intent keywords — the AI planner uses these to match free-form goal descriptions. */
  aiKeywords?: string[]
  /** 0–100 contribution to trust-oriented goals (testimonials, logos, awards). */
  trustWeight?: number
  /** 0–100 contribution to conversion-oriented goals (pricing, cta, contact). */
  conversionWeight?: number
  /** Where this section sits in the user's decision funnel. */
  funnelStage?: SectionFunnelStage

  // ===== Unified section engine =====
  /**
   * Declarative structure. When present, `defineSection()` compiles it into
   * `propDefinitions` / `itemCollections` / `editableElements` / `defaultProps`,
   * so those need not be hand-written. See schema/compile-schema.ts.
   */
  schema?: SectionSchema
  /** Compiled structural manifest — set by `defineSection()`, not by authors. */
  blocks?: CompiledBlock[]
  /** Compiled layout regions — set by `defineSection()`, not by authors. */
  slots?: CompiledSlot[]
  /** Per-section starting point for the shared customization options. */
  defaultOptions?: SectionOptions
  /** Structural identity; must be unique within the section's category. */
  layoutArchetype?: SectionLayoutArchetype
  /**
   * False for sections whose JSX carries live behaviour a plain element tree
   * cannot express — a lead form posting to the API, a booking widget. Detaching
   * one would leave a dead copy of the form, so "Detach" is not offered.
   */
  detachable?: boolean
  /**
   * True when the section renders `instance.componentTree` itself — e.g. behind
   * an auth gate. Renderers must then NOT append their generic tree copy, or the
   * gated content leaks out ungated beneath the section.
   */
  ownsComponentTree?: boolean
}

/**
 * Serializable subset of SectionDefinition — safe to pass through server
 * action boundaries (no React Component, no function fields). Used by
 * server-side AI helpers (rewrite copy, find images) that receive section
 * metadata from the client rather than looking up the client registry.
 */
export type SectionMeta = Omit<SectionDefinition, 'Component' | 'migrateProps'> & {
  itemCollections?: Array<Omit<ItemCollectionDefinition, 'newItemTemplate'> & {
    newItemTemplate?: () => Record<string, unknown>
  }>
}

/**
 * AI-first section definition. New sections SHOULD use this — it makes
 * metadata fields required so the planner can score reliably. Existing
 * sections can stay on the bare {@link SectionDefinition} during migration.
 */
export interface SectionDefinitionV2 extends SectionDefinition {
  industries: SectionIndustry[]
  styles: SectionStyle[]
  goals: SectionGoal[]
  complexity: SectionComplexity
  density: SectionDensity
  imageRequired: boolean
  mobileScore: number
  editable: boolean
  editableElements: string[]
  // Extended fields (recommended, not required for v2 compat)
  tags?: string[]
  trustWeight?: number
  conversionWeight?: number
  funnelStage?: SectionFunnelStage
}

/**
 * Schema-driven section definition — the target shape for migrated sections.
 *
 * `schema` is required and, in exchange, the fields the compiler derives
 * (`propDefinitions`, `itemCollections`, `editableElements`, `defaultProps`)
 * become optional. Declaring one of them by hand still overrides the compiled
 * value, which is what lets a section migrate a piece at a time.
 */
export interface SectionDefinitionSchemaFirst
  extends Omit<
    SectionDefinitionV2,
    'propDefinitions' | 'itemCollections' | 'editableElements' | 'defaultProps'
  > {
  schema: SectionSchema
  layoutArchetype: SectionLayoutArchetype
  propDefinitions?: ComponentPropDefinition[]
  itemCollections?: ItemCollectionDefinition[]
  editableElements?: string[]
  defaultProps?: Record<string, unknown>
}

/** What `defineSection()` accepts — either authoring mode. */
export type SectionDefinitionInput =
  | SectionDefinitionV2
  | SectionDefinitionSchemaFirst
