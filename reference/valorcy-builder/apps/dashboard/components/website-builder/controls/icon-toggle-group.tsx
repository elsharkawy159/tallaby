'use client'

import type { LucideIcon } from 'lucide-react'
import { Label } from '@workspace/ui/components/label'
import {
  ToggleGroup,
  ToggleGroupItem
} from '@workspace/ui/components/toggle-group'
import { cn } from '@workspace/ui/lib/utils'

export type IconToggleOption<T extends string> = {
  value: T
  label: string
  icon: LucideIcon
}

export type IconToggleGroupFieldProps<T extends string> = {
  id?: string
  label: string
  value: T | '' | undefined
  onValueChange: (next: T) => void
  options: Array<IconToggleOption<T>>
  className?: string
  disabled?: boolean
}

export function IconToggleGroupField <T extends string> ({
  id,
  label,
  value,
  onValueChange,
  options,
  className,
  disabled
}: IconToggleGroupFieldProps<T>) {
  const matched = options.find((o) => o.value === value)
  const v = matched ? matched.value : options[0]?.value
  return (
    <div className={cn('flex flex-col gap-1', className)}>
      {label ? (
        <Label className="text-[10px]" htmlFor={id}>
          {label}
        </Label>
      ) : null}
      <ToggleGroup
        type="single"
        value={v}
        onValueChange={(next) => {
          if (next) onValueChange(next as T)
        }}
        disabled={disabled}
        className="flex flex-wrap justify-start gap-0.5"
        variant="outline"
        size="sm"
        id={id}
      >
        {options.map(({ value: opt, label: optLabel, icon: Icon }) => (
          <ToggleGroupItem
            key={opt}
            value={opt}
            aria-label={optLabel}
            className="size-6 p-0"
          >
            <Icon className="size-3.5" />
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  )
}
