'use client'

import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'
import { AuthEditable, propText } from '@/components/auth-blocks/auth-editable'
import type { BlockOverride } from '@/components/sections/_primitives/block-renderer'
import type {
  BodyBlock,
  FieldSpec,
  HeadingBlock,
  NoteBlock,
} from '@/components/sections/schema/section-schema'

/**
 * Chrome shared by the auth catalog, rendered through `<SectionSlot>` overrides.
 *
 * Auth sections read every string through `propText(instance, key, fallback)`,
 * where an unset OR empty prop renders the fallback (for the card headings, the
 * site's Authentication branding first). Every override here keeps exactly that,
 * so pages saved before the slot migration render the same copy.
 *
 * The functional widget of each section (the sign-in / register / reset form,
 * the signed-in panel, the session-aware button) stays ONE override entry inside
 * the section file, where it keeps its `useSiteAuth()` handlers, field names and
 * loading/error states untouched. Only the surrounding copy is made of blocks.
 */

type EditableTag = 'span' | 'p' | 'h1' | 'h2' | 'h3' | 'div'

/**
 * `AuthCard` without its heading / subheading / footer props: the card body is
 * a slot, so those become blocks. Markup and classes are identical to `AuthCard`
 * (`components/auth-blocks/auth-primitives.tsx`).
 */
export function AuthCardFrame ({
  logoUrl,
  imageUrl,
  layout = 'centered',
  children,
}: {
  logoUrl?: string | null
  imageUrl?: string | null
  layout?: 'centered' | 'split'
  children: ReactNode
}) {
  const split = layout === 'split' && Boolean(imageUrl)

  return (
    <div className={cn('mx-auto w-full', split ? 'max-w-4xl' : 'max-w-md')}>
      <div
        className={cn(
          'overflow-hidden rounded-[calc(var(--radius,0.5rem)*2)] border border-border bg-card shadow-sm',
          split && 'grid md:grid-cols-2',
        )}
      >
        {split ? (
          <div
            className="hidden bg-muted bg-cover bg-center md:block"
            style={{ backgroundImage: `url(${imageUrl})` }}
            aria-hidden
          />
        ) : null}

        <div className="p-7 sm:p-9">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt="" className="mb-6 h-8 w-auto object-contain" />
          ) : null}
          {children}
        </div>
      </div>
    </div>
  )
}

// ─── Overrides ────────────────────────────────────────────────────────────────

/** One inline-editable prop inside a wrapper element, with its pre-slot fallback. */
export function authText (
  key: string,
  fallback: string,
  opts: { as?: EditableTag; className?: string; isPreview?: boolean },
): BlockOverride {
  const Tag = opts.as ?? 'p'
  return function AuthText ({ instance }) {
    return (
      <Tag className={opts.className}>
        <AuthEditable
          instance={instance}
          propKey={key}
          value={propText(instance, key, fallback)}
          isPreview={opts.isPreview}
        />
      </Tag>
    )
  }
}

/** A block drawn inside a sibling override (the form, the panel); edited from the content panel. */
export const drawnElsewhere: BlockOverride = () => null

/** The `AuthCard` heading type scale. */
export const CARD_HEADING_CLASS = 'text-2xl font-bold tracking-[-0.02em] text-foreground'
/** The `AuthCard` subheading type scale. */
export const CARD_SUBHEADING_CLASS = 'mt-2 text-sm leading-relaxed text-muted-foreground'
/** The `AuthCard` body spacing, carried by the functional form entry. */
export const CARD_BODY_CLASS = 'mt-7'
/** The `AuthCard` footer line. */
export const CARD_FOOTER_CLASS = 'mt-6 text-center text-sm text-muted-foreground'

// ─── Block specs ──────────────────────────────────────────────────────────────

/** The `heading` prop as a heading block (no accent word — auth headings never had one). */
export function headingBlock (level: 1 | 2, label = 'Heading'): HeadingBlock {
  return {
    kind: 'heading',
    id: 'heading',
    level,
    accent: false,
    fields: {
      headline: { key: 'heading', label, type: 'text', canonical: 'headline' },
    },
  }
}

/** The `subheading` prop as a body block. */
export function subheadingBlock (): BodyBlock {
  return {
    kind: 'body',
    id: 'subheading',
    label: 'Subheading',
    field: { key: 'subheading', label: 'Subheading', type: 'textarea', canonical: 'subheadline' },
  }
}

/**
 * A flat text prop as a note block. The id follows the key so element ids stay
 * stable; `blockLabel` names the block in Layers when it anchors a whole widget.
 */
export function noteBlock (
  key: string,
  label: string,
  field: Omit<FieldSpec, 'key' | 'label'> = {},
  blockLabel?: string,
): NoteBlock {
  return {
    kind: 'note',
    id: key,
    label: blockLabel ?? label,
    field: { key, label, type: 'text', ...field },
  }
}

/** A boolean section setting (inspector switch, not a slot entry). */
export function switchSetting (key: string, label: string): FieldSpec {
  return { key, label, type: 'switch' }
}

export const BUTTON_ALIGN_SETTING: FieldSpec = {
  key: 'align',
  label: 'Alignment',
  type: 'select',
  options: [
    { value: 'start', label: 'Start' },
    { value: 'center', label: 'Center' },
    { value: 'end', label: 'End' },
  ],
}

export const BUTTON_VARIANT_SETTING: FieldSpec = {
  key: 'variant',
  label: 'Style',
  type: 'select',
  options: [
    { value: 'primary', label: 'Primary' },
    { value: 'outline', label: 'Outline' },
    { value: 'ghost', label: 'Ghost' },
  ],
}
