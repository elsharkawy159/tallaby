'use client'

import { Button } from '@workspace/ui/components/button'
import { cn } from '@workspace/ui/lib/utils'
import { InlineEditableText } from '@/components/website-builder/inline-editable'
import { SectionLink } from '@/components/website-builder/section-link'
import { linkValueFromItem } from '@/lib/builder/links'
import { useBuilderStore } from '@/lib/builder/store'
import type { LegacyLinkItem } from '@/lib/builder/links'

/** Matches element-popover ButtonControls (Solid/Soft/Outline/Ghost). */
export type CtaButtonVariant = 'default' | 'secondary' | 'outline' | 'ghost'

export type CtaButtonShape = LegacyLinkItem & {
  label: string
  href?: string
  /** Legacy `primary` still accepted and mapped to Solid (`default`). */
  variant?: CtaButtonVariant | 'primary'
}

type SectionCtaRowProps = {
  instanceId: string
  isPreview?: boolean
  buttons: CtaButtonShape[]
  /** Prop key holding the buttons array on the section instance. */
  propKey?: string
  align?: 'left' | 'center'
  className?: string
}

/**
 * Map stored section button variants → shadcn Button variants.
 * Accepts both legacy (`primary`) and popover values (`default` = Solid).
 */
export function resolveCtaButtonVariant (
  value: unknown,
  fallback: CtaButtonVariant = 'default',
): CtaButtonVariant {
  const raw = typeof value === 'string' ? value : fallback
  if (raw === 'primary' || raw === 'default') return 'default'
  if (raw === 'secondary' || raw === 'outline' || raw === 'ghost') return raw
  return fallback
}

/**
 * Inline-editable button row used in heroes, CTAs, and pricing cards.
 * Editing label updates section props at the `propKey[index].label` path.
 * Href / variant edits from the element popover use data-element-item-*-prop maps.
 */
export function SectionCtaRow ({
  instanceId,
  isPreview,
  buttons,
  propKey = 'buttons',
  align = 'center',
  className,
}: SectionCtaRowProps) {
  const store = useBuilderStore.getState
  return (
    <div
      className={cn(
        'flex flex-wrap gap-3',
        align === 'center' ? 'justify-center' : 'justify-start',
        className,
      )}
    >
      {buttons.map((b, i) => {
        const variant = resolveCtaButtonVariant(
          b.variant,
          i === 0 ? 'default' : 'secondary',
        )
        return (
          <Button
            key={i}
            variant={variant}
            asChild
            className='h-auto rounded-lg px-6 py-3 text-[15px] font-semibold'
          >
            <SectionLink
              link={linkValueFromItem(b)}
              isPreview={isPreview}
              data-element-id={`${instanceId}::${propKey}-${i}`}
              data-element-type='button'
              data-element-collection={propKey}
              data-element-index={String(i)}
              data-element-item-label-prop='label'
              data-element-item-href-prop='href'
              data-element-item-variant-prop='variant'
            >
              <InlineEditableText
                as='span'
                value={b.label}
                isPreview={isPreview}
                onChange={(t) => store().updateItem(instanceId, propKey, i, { label: t })}
                onCommit={(t) => store().updateItem(instanceId, propKey, i, { label: t })}
              />
            </SectionLink>
          </Button>
        )
      })}
    </div>
  )
}
