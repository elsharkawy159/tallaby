'use client'

import { Input } from '@workspace/ui/components/input'
import { Label } from '@workspace/ui/components/label'
import { cn } from '@workspace/ui/lib/utils'

export type NumberFieldProps = {
  id?: string
  label: string
  value: string
  onValueChange: (next: string) => void
  min?: number
  max?: number
  step?: number
  disabled?: boolean
  placeholder?: string
  className?: string
  /** Optional suffix shown after the field (e.g. unit hint) */
  hint?: string
}

export function NumberField ({
  id,
  label,
  value,
  onValueChange,
  min,
  max,
  step,
  disabled,
  placeholder,
  className,
  hint
}: NumberFieldProps) {
  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <Label htmlFor={id} className="text-[10px]">
        {label}
      </Label>
      <Input
        id={id}
        type="number"
        inputMode="decimal"
        className="h-6 px-2 py-0 text-[10px] md:text-[10px]"
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        placeholder={placeholder}
      />
      {hint ? (
        <p className="text-[10px] text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  )
}
