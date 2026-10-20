'use client'

import { ToggleGroup, ToggleGroupItem } from '@workspace/ui/components/toggle-group'
import { cn } from '@workspace/ui/lib/utils'

export type SegmentedOption<V extends string> = {
  value: V
  label: string
  title?: string
}

type Props<V extends string> = {
  value: V | undefined
  onChange: (next: V) => void
  options: ReadonlyArray<SegmentedOption<V>>
  ariaLabel: string
  className?: string
}

export function Segmented<V extends string> ({
  value,
  onChange,
  options,
  ariaLabel,
  className,
}: Props<V>) {
  return (
    <ToggleGroup
      type="single"
      size="sm"
      variant="outline"
      value={value ?? ''}
      onValueChange={(v) => {
        if (v) onChange(v as V)
      }}
      aria-label={ariaLabel}
      className={cn('h-7 gap-0 border-0 bg-transparent p-0 shadow-none', className)}
    >
      {options.map((opt) => (
        <ToggleGroupItem
          key={opt.value}
          value={opt.value}
          aria-label={opt.title ?? opt.label}
          title={opt.title ?? opt.label}
          className="h-7 min-w-7 px-1.5 text-[11px] font-medium"
        >
          {opt.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}
