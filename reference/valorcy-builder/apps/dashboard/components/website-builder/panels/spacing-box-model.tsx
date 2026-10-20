'use client'

import { Input } from '@workspace/ui/components/input'
import { cn } from '@workspace/ui/lib/utils'

type Props = {
  str: (k: string) => string
  patch: (key: string, value: string) => void
  className?: string
}

/** Webflow-style nested margin / padding diagram — compact. */
export function SpacingBoxModel ({ str, patch, className }: Props) {
  const cell =
    'h-5 w-full min-w-0 border-0 bg-transparent px-0.5 text-center text-[9px] font-medium tabular-nums outline-none focus:ring-1 focus:ring-primary/40 rounded-sm'

  const edge = (key: string, position: 't' | 'r' | 'b' | 'l', margin: boolean) => (
    <Input
      aria-label={margin ? `margin ${position}` : `padding ${position}`}
      value={str(key)}
      onChange={(e) => patch(key, e.target.value)}
      placeholder="0"
      className={cn(
        cell,
        margin && 'text-orange-600 dark:text-orange-400',
        !margin && 'text-emerald-700 dark:text-emerald-400'
      )}
    />
  )

  return (
    <div className={cn('rounded-md border border-border/80 bg-muted/20 p-1.5', className)}>
      <p className="mb-1 text-[8px] font-bold uppercase tracking-wide text-muted-foreground">
        Spacing
      </p>
      <div className="relative rounded-md bg-orange-500/10 p-1.5 dark:bg-orange-500/15">
        <span className="absolute start-1.5 top-0.5 text-[7px] font-semibold uppercase text-orange-700/80 dark:text-orange-400/90">
          Margin
        </span>
        <div className="mt-2 grid grid-cols-[1fr_auto_1fr] gap-x-0.5 gap-y-px">
          <div />
          <div className="min-w-[2.25rem]">{edge('marginTop', 't', true)}</div>
          <div />
          <div className="flex min-w-[2rem] items-center">{edge('marginLeft', 'l', true)}</div>
          <div className="rounded-md bg-emerald-500/12 p-1.5 dark:bg-emerald-500/18">
            <span className="mb-0.5 block text-center text-[7px] font-semibold uppercase text-emerald-800/90 dark:text-emerald-300/90">
              Padding
            </span>
            <div className="grid grid-cols-[1fr_auto_1fr] gap-x-0.5 gap-y-px">
              <div />
              <div className="min-w-[2.25rem]">{edge('paddingTop', 't', false)}</div>
              <div />
              <div className="flex min-w-[2rem] items-center">{edge('paddingLeft', 'l', false)}</div>
              <div className="flex min-h-[22px] min-w-[28px] items-center justify-center rounded-sm bg-background/80 text-[8px] font-medium text-muted-foreground shadow-inner">
                ·
              </div>
              <div className="flex min-w-[2rem] items-center justify-end">{edge('paddingRight', 'r', false)}</div>
              <div />
              <div className="min-w-[2.25rem]">{edge('paddingBottom', 'b', false)}</div>
              <div />
            </div>
          </div>
          <div className="flex min-w-[2rem] items-center justify-end">{edge('marginRight', 'r', true)}</div>
          <div />
          <div className="min-w-[2.25rem]">{edge('marginBottom', 'b', true)}</div>
          <div />
        </div>
      </div>
    </div>
  )
}
