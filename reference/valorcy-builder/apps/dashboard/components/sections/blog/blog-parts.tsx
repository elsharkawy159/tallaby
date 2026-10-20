"use client"

import { cn } from "@workspace/ui/lib/utils"
import { InlineEditableText } from "@/components/website-builder/inline-editable"
import { SectionEditableImage } from "@/components/sections/shared"
import { placeholderFor } from "@/components/sections/placeholders"
import { useBuilderStore } from "@/lib/builder/store"
import type { BlockOverride } from "@/components/sections/_primitives/block-renderer"
import type {
  BodyBlock,
  EyebrowBlock,
  FieldSpec,
  HeadingBlock,
  ItemsBlock,
  NoteBlock,
} from "@/components/sections/schema/section-schema"
import type { SlotEntry } from "@/components/sections/schema/slot-entries"
import type { SectionInstance } from "@/components/sections/registry.types"

/**
 * Chrome shared by the blog catalog, rendered through `<SectionSlot>` overrides
 * and `renderItems`.
 *
 * Every blog section keeps the prop keys and post item keys it has always
 * stored. That matters more here than anywhere else: CMS binding
 * (`lib/server/enrich-cms-sections.ts`) injects published posts into the
 * section's FIRST item collection, so the posts collection must stay the first
 * `items` block in every schema and keep its item shape (`title`, `excerpt`,
 * `imageUrl`, `category`, `date`, `readTime`, `href`, …).
 */

type EditableTag = "span" | "p" | "div" | "h2" | "h3"

/** A post as stored. Every key is optional — instance props are untyped JSONB. */
export type Post = {
  title?: string
  excerpt?: string
  imageUrl?: string
  imageAlt?: string
  category?: string
  date?: string
  readTime?: string
  href?: string
  authorName?: string
  authorAvatarUrl?: string
}

// ─── Inline editing ───────────────────────────────────────────────────────────

/** One inline-editable field of a collection item, with the pre-slot element attributes. */
export function ItemText ({
  instance,
  collection = "posts",
  index,
  field,
  value,
  className,
  as = "span",
  isPreview,
}: {
  instance: SectionInstance
  collection?: string
  index: number
  field: string
  value: unknown
  className?: string
  as?: EditableTag
  isPreview?: boolean
}) {
  const write = (t: string) =>
    useBuilderStore.getState().updateItem(instance.id, collection, index, { [field]: t })
  return (
    <InlineEditableText
      as={as}
      data-element-collection={collection}
      data-element-index={String(index)}
      data-element-item-label-prop={field}
      className={className}
      value={String(value ?? "")}
      isPreview={isPreview}
      onChange={write}
      onCommit={write}
    />
  )
}

/**
 * One inline-editable flat prop. `fallback` is what renders while the prop has
 * never been set — the literal a pre-migration page always showed there.
 * Without a fallback an unset prop renders nothing.
 */
export function PropText ({
  instance,
  propKey,
  className,
  as = "span",
  isPreview,
  fallback,
  elementType = "text",
}: {
  instance: SectionInstance
  propKey: string
  className?: string
  as?: EditableTag
  isPreview?: boolean
  fallback?: string
  elementType?: "text" | "button"
}) {
  const raw = instance.props[propKey]
  const value = typeof raw === "string" ? raw : fallback
  if (value === undefined) return null
  const write = (t: string) =>
    useBuilderStore.getState().updateSectionProps(instance.id, { [propKey]: t })
  return (
    <InlineEditableText
      as={as}
      data-element-id={`${instance.id}::${propKey}`}
      data-element-type={elementType}
      className={className}
      value={value}
      isPreview={isPreview}
      onChange={write}
      onCommit={write}
    />
  )
}

/** A setting's string value, or the literal pre-migration pages rendered. */
export function textOr (instance: SectionInstance, key: string, fallback: string): string {
  const v = instance.props[key]
  return typeof v === "string" ? v : fallback
}

/**
 * Override for a scalar text block with a section-specific type scale. Renders
 * nothing for an absent or empty value, like the shared renderer.
 */
export function textBlock (
  propKey: string,
  className: string,
  isPreview?: boolean,
  as: EditableTag = "p"
): BlockOverride {
  return function TextBlock ({ instance }) {
    const v = instance.props[propKey]
    if (typeof v !== "string" || v === "") return null
    return <PropText instance={instance} propKey={propKey} as={as} className={className} isPreview={isPreview} />
  }
}

/** Posts as stored, or the section's legacy fallback list when the prop is absent. */
export function postsOf (instance: SectionInstance, fallback: Post[] = [], key = "posts"): Post[] {
  const v = instance.props[key]
  return Array.isArray(v) ? (v as Post[]) : fallback
}

/** A post's cover image, bound to its collection item. */
export function PostImage ({
  instance,
  post,
  index,
  elementKey,
  className,
  collection = "posts",
  isPreview,
  loading,
}: {
  instance: SectionInstance
  post: Post
  index: number
  elementKey: string
  className?: string
  collection?: string
  isPreview?: boolean
  loading?: "lazy" | "eager"
}) {
  return (
    <SectionEditableImage
      instanceId={instance.id}
      elementKey={elementKey}
      src={post.imageUrl}
      alt={post.imageAlt || post.title || ""}
      loading={loading}
      collectionKey={collection}
      collectionIndex={index}
      itemSrcProp="imageUrl"
      itemAltProp="imageAlt"
      isPreview={isPreview}
      className={cn("absolute inset-0 size-full object-cover", className)}
    />
  )
}

// ─── Schema helpers ───────────────────────────────────────────────────────────

/** AI hints the original hand-written definitions carried, kept verbatim. */
export const HINTS = {
  eyebrowLong: "Short label above the headline (1–3 words, sentence case)",
  eyebrowShort: "Short label (1–3 words)",
  headline: "Primary section headline (6–10 words, no period)",
  description: "Short descriptive paragraph (1–3 sentences, 20–60 words)",
  accentWord: "Highlighted word or phrase in the headline (1–3 words)",
} as const

export function eyebrowBlock (opts: { key?: string; label?: string; aiHint?: string; maxLength?: number } = {}): EyebrowBlock {
  const key = opts.key ?? "eyebrow"
  return {
    kind: "eyebrow",
    ...(key !== "eyebrow" ? { id: key } : {}),
    label: opts.label ?? "Eyebrow",
    field: {
      key,
      label: opts.label ?? "Eyebrow",
      type: "text",
      canonical: "eyebrow",
      aiHint: opts.aiHint ?? HINTS.eyebrowShort,
      maxLength: opts.maxLength ?? 30,
      group: "content",
    },
  }
}

export function headingBlock (opts: { aiHint?: string; maxLength?: number; accent?: boolean } = {}): HeadingBlock {
  return {
    kind: "heading",
    level: 2,
    accent: opts.accent ?? false,
    fields: {
      headline: {
        key: "headline",
        label: "Headline",
        type: "text",
        canonical: "headline",
        aiHint: opts.aiHint ?? HINTS.headline,
        maxLength: opts.maxLength ?? 80,
        group: "content",
      },
      ...(opts.accent
        ? {
            accentWord: {
              key: "accentWord",
              label: "Accent word",
              type: "text" as const,
              canonical: "headline" as const,
              aiHint: HINTS.accentWord,
              maxLength: 30,
              group: "content" as const,
            },
          }
        : {}),
    },
  }
}

export function descriptionBlock (): BodyBlock {
  return {
    kind: "body",
    field: {
      key: "description",
      label: "Description",
      type: "textarea",
      canonical: "body",
      aiHint: HINTS.description,
      maxLength: 280,
      group: "content",
    },
  }
}

/** The house header — pill eyebrow, accented headline, description — with the original hints. */
export function standardHeader () {
  return [eyebrowBlock({ aiHint: HINTS.eyebrowLong }), headingBlock({ accent: true }), descriptionBlock()]
}

/** A scalar text prop drawn by an override, as a note block bound to its existing key. */
export function noteBlock (spec: FieldSpec & { slot?: string; blockLabel?: string }): NoteBlock {
  const { slot, blockLabel, ...field } = spec
  return {
    kind: "note",
    id: field.key,
    label: blockLabel ?? field.label ?? field.key,
    ...(slot ? { slot } : {}),
    field,
  }
}

/** Item field specs, reproducing the hand-written post definitions exactly. */
export const postField = {
  image: (label = "Image"): FieldSpec => ({ key: "imageUrl", label, type: "image" }),
  imageAlt: (aiHint = "Accessible image description"): FieldSpec => ({
    key: "imageAlt", label: "Image alt", type: "text", canonical: "imageAlt", aiHint, maxLength: 120, group: "media",
  }),
  category: (): FieldSpec => ({ key: "category", label: "Category", type: "text" }),
  title: (aiHint: string, maxLength: number): FieldSpec => ({
    key: "title", label: "Title", type: "text", canonical: "headline", aiHint, maxLength, group: "content",
  }),
  excerpt: (aiHint: string, maxLength: number): FieldSpec => ({
    key: "excerpt", label: "Excerpt", type: "textarea", canonical: "body", aiHint, maxLength, group: "content",
  }),
  authorName: (): FieldSpec => ({
    key: "authorName", label: "Author name", type: "text", canonical: "subheadline", aiHint: "Author full name", maxLength: 60, group: "content",
  }),
  authorAvatar: (label = "Author avatar"): FieldSpec => ({ key: "authorAvatarUrl", label, type: "image" }),
  date: (): FieldSpec => ({ key: "date", label: "Date", type: "text" }),
  readTime: (): FieldSpec => ({ key: "readTime", label: "Read time", type: "text" }),
  href: (): FieldSpec => ({ key: "href", label: "Link", type: "url", group: "cta" }),
}

/**
 * The posts collection. Always `key: 'posts'` and always declared before any
 * other collection, so CMS binding keeps injecting into it.
 */
export function postsBlock (opts: {
  label: string
  minItems: number
  maxItems: number
  fields: FieldSpec[]
  newItem: () => Record<string, unknown>
  key?: string
  canonical?: ItemsBlock["canonical"]
  slot?: string
}): ItemsBlock {
  return {
    kind: "items",
    key: opts.key ?? "posts",
    canonical: opts.canonical ?? "posts",
    label: opts.label,
    pick: [],
    itemFields: opts.fields,
    minItems: opts.minItems,
    maxItems: opts.maxItems,
    itemPlaceholder: "landscape",
    newItem: opts.newItem,
    ...(opts.slot ? { slot: opts.slot } : {}),
  }
}

// ─── Default copy ─────────────────────────────────────────────────────────────

/** Local placeholder art — never an external URL in defaults. */
export const COVER = placeholderFor("landscape")
export const AVATAR = placeholderFor("avatar")

/** Realistic sample posts shared by the catalog's defaults (new inserts only). */
export const SAMPLE_POSTS = [
  {
    category: "Strategy",
    title: "Why your landing page isn't converting — and how to fix it",
    excerpt: "We studied three hundred landing pages. The top performers share four habits the rest keep skipping.",
    date: "Sep 18, 2026",
    readTime: "8 min",
    authorName: "Maya Chen",
  },
  {
    category: "Product",
    title: "Designing with sections instead of a blank canvas",
    excerpt: "Constraints made our editor faster to learn and our customers' sites easier to keep consistent.",
    date: "Sep 9, 2026",
    readTime: "6 min",
    authorName: "Daniel Okafor",
  },
  {
    category: "Growth",
    title: "From zero to ten thousand customers without paid ads",
    excerpt: "The content, partnerships and community plays that compounded month after month.",
    date: "Aug 27, 2026",
    readTime: "11 min",
    authorName: "Sofia Martins",
  },
  {
    category: "Engineering",
    title: "How we cut page load time in half",
    excerpt: "Image budgets, smarter caching and one change to how fonts load made the biggest difference.",
    date: "Aug 14, 2026",
    readTime: "9 min",
    authorName: "Liam Novak",
  },
  {
    category: "Design",
    title: "A practical guide to accessible colour systems",
    excerpt: "Contrast ratios, tokens and testing habits that keep every page readable in light and dark.",
    date: "Jul 30, 2026",
    readTime: "7 min",
    authorName: "Amara Singh",
  },
] as const

// ─── Slot helpers ─────────────────────────────────────────────────────────────

/**
 * Collection layouts must span the slot even when the slot centres its entries;
 * a centred flex column would otherwise shrink the grid to its content.
 */
export function stretchItems (entry: SlotEntry): string | undefined {
  return entry.kind === "block" && entry.block.kind === "items" ? "w-full self-stretch" : undefined
}
