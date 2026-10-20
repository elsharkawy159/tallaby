/*
 * `react-hooks/static-components` cannot distinguish a registry lookup from a
 * component defined inline, and flags both the lookup and every JSX use of it.
 * Every value in `PALETTE_ICONS` is a module-level Lucide component, so the
 * reference is stable across renders and the remounting the rule guards against
 * cannot happen here.
 */
/* eslint-disable react-hooks/static-components */
import { paletteIconFor } from '@/lib/builder/element-icons'
import { cn } from '@workspace/ui/lib/utils'

/**
 * The single way an element icon is rendered anywhere in the builder.
 *
 * Size, stroke width, colour and the surrounding chip live here rather than at
 * each call site, so icons cannot drift apart in visual weight as the palette
 * grows. Colour comes from `currentColor` via a semantic class, which is what
 * makes the set work in both themes without a second icon table.
 */
export function PaletteIcon ({
  paletteId,
  className,
  chip = true,
}: {
  paletteId: string
  className?: string
  /** Draw the bordered square behind the glyph. Off for dense menu rows. */
  chip?: boolean
}) {
  const Icon = paletteIconFor(paletteId)

  if (!chip) {
    return (
      <Icon
        aria-hidden
        strokeWidth={1.75}
        className={cn('size-4 shrink-0 text-muted-foreground', className)}
      />
    )
  }

  return (
    <span
      aria-hidden
      className={cn(
        'flex size-7 shrink-0 items-center justify-center rounded-[5px] border border-border/70 bg-muted/40 text-muted-foreground',
        className
      )}
    >
      <Icon strokeWidth={1.75} className="size-4" />
    </span>
  )
}
