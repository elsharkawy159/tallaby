'use client'

import { Label } from '@workspace/ui/components/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@workspace/ui/components/select'
import { cn } from '@workspace/ui/lib/utils'

export type StyleSelectOption = { value: string; label: string }

export type StyleSelectProps = {
  id?: string
  label: string
  value: string | undefined
  onValueChange: (next: string) => void
  options: StyleSelectOption[]
  placeholder?: string
  className?: string
  disabled?: boolean
  allowEmpty?: boolean
  emptyLabel?: string
}

export function StyleSelect ({
  id,
  label,
  value,
  onValueChange,
  options,
  placeholder = 'Select',
  className,
  disabled,
  allowEmpty = true,
  emptyLabel = 'Default'
}: StyleSelectProps) {
  const selectValue =
    value && value !== '' ? value : allowEmpty ? '__empty' : (options[0]?.value ?? '')

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <Label htmlFor={id} className="text-[10px]">
        {label}
      </Label>
      <Select
        value={selectValue}
        onValueChange={(next) => {
          onValueChange(allowEmpty && next === '__empty' ? '' : next)
        }}
        disabled={disabled}
      >
        <SelectTrigger id={id} className="h-6 w-full text-[10px]" size="sm">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {allowEmpty && (
            <SelectItem value="__empty">{emptyLabel}</SelectItem>
          )}
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
