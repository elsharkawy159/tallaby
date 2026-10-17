'use client'

import { Palette, X } from 'lucide-react'
import { Button } from '@workspace/ui/components/button'
import { Label } from '@workspace/ui/components/label'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput
} from '@workspace/ui/components/input-group'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@workspace/ui/components/popover'
import { cn } from '@workspace/ui/lib/utils'

const DESIGN_TOKENS = [
  'primary',
  'secondary',
  'accent',
  'background',
  'foreground',
  'muted',
  'border',
  'destructive',
] as const

function isHex6Or3 (s: string) {
  return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(s.trim())
}

function toPickerHex (s: string): string {
  const t = s.trim()
  if (!isHex6Or3(t)) return '#000000'
  if (t.length === 4) {
    const r = t[1]
    const g = t[2]
    const b = t[3]
    return `#${r}${r}${g}${g}${b}${b}`
  }
  return t
}

function capitalize (s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export type ColorInputProps = {
  id?: string
  label: string
  value: string | undefined
  onValueChange: (next: string) => void
  className?: string
  disabled?: boolean
}

export function ColorInput ({
  id,
  label,
  value,
  onValueChange,
  className,
  disabled
}: ColorInputProps) {
  const str = value === undefined || value === null ? '' : String(value)
  const pickerValue = isHex6Or3(str) ? toPickerHex(str) : '#000000'

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <Label htmlFor={id} className="text-[10px]">
        {label}
      </Label>
      <div className="flex min-w-0 items-center gap-2">
        <InputGroup className="h-6 min-h-6 min-w-0 flex-1 py-0">
          <InputGroupInput
            id={id}
            className="h-6 min-h-0 min-w-0 py-0 pe-1 font-mono text-[10px]"
            value={str}
            onChange={(e) => onValueChange(e.target.value)}
            disabled={disabled}
            placeholder="#000000 or var(--primary)"
          />
          <InputGroupAddon
            align="inline-end"
            className="border-s border-border py-0 pe-1 gap-1"
          >
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="flex size-5 shrink-0 cursor-pointer items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
                  disabled={disabled}
                  aria-label={`${label} design tokens`}
                  title="Pick design token"
                >
                  <Palette className="size-3.5" />
                </button>
              </PopoverTrigger>
              <PopoverContent
                align="end"
                className="w-44 p-1"
                data-builder-popover="true"
              >
                <div className="flex flex-col">
                  <p className="px-2 pb-1 pt-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Design tokens
                  </p>
                  {DESIGN_TOKENS.map((token) => (
                    <button
                      key={token}
                      type="button"
                      className="flex items-center gap-2 rounded px-2 py-1.5 text-start text-xs hover:bg-muted"
                      onClick={() => onValueChange(`var(--${token})`)}
                    >
                      <span
                        className="inline-block size-4 shrink-0 rounded-full border border-border"
                        style={{ backgroundColor: `var(--${token})` }}
                      />
                      <span>{capitalize(token)}</span>
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
            <input
              type="color"
              className="size-5 shrink-0 cursor-pointer rounded border-0 bg-transparent p-0"
              value={pickerValue}
              onChange={(e) => onValueChange(e.target.value)}
              disabled={disabled}
              aria-label={`${label} color picker`}
              title="Choose color"
            />
          </InputGroupAddon>
        </InputGroup>
        {str !== '' && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-6 shrink-0"
            onClick={() => onValueChange('')}
            disabled={disabled}
            aria-label="Clear color"
          >
            <X className="size-4" />
          </Button>
        )}
      </div>
    </div>
  )
}
