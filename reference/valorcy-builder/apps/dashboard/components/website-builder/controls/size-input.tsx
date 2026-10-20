'use client'

import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput
} from '@workspace/ui/components/input-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@workspace/ui/components/select'
import { Label } from '@workspace/ui/components/label'
import { Input } from '@workspace/ui/components/input'
import { cn } from '@workspace/ui/lib/utils'

const UNITS = ['px', '%', 'rem', 'em', 'vh', 'vw'] as const
export type SizeUnit = (typeof UNITS)[number]

type Parsed =
  | { kind: 'empty' }
  | { kind: 'split'; num: string; unit: SizeUnit }
  | { kind: 'raw'; text: string }

function parseSizeValue (v: string | undefined | null): Parsed {
  if (v === undefined || v === null || !String(v).trim()) {
    return { kind: 'empty' }
  }
  const t = String(v).trim()
  const m = /^(-?[\d.]+)\s*(px|%|rem|em|vh|vw)$/i.exec(t)
  if (m && m[1] !== undefined && m[2] !== undefined) {
    const u = m[2].toLowerCase() as SizeUnit
    if (UNITS.includes(u)) {
      return { kind: 'split', num: String(m[1]), unit: u }
    }
  }
  return { kind: 'raw', text: t }
}

function buildSizeString (p: Parsed): string {
  if (p.kind === 'empty') return ''
  if (p.kind === 'raw') return p.text
  if (p.num === '') return ''
  return `${p.num}${p.unit}`
}

export type SizeInputProps = {
  id?: string
  label: string
  value: string | undefined
  onValueChange: (next: string) => void
  className?: string
  disabled?: boolean
  placeholder?: string
}

export function SizeInput ({
  id,
  label,
  value,
  onValueChange,
  className,
  disabled,
  placeholder = '0'
}: SizeInputProps) {
  const parsed = parseSizeValue(value)

  if (parsed.kind === 'raw') {
    return (
      <div className={cn('flex flex-col gap-1', className)}>
        <Label htmlFor={id} className="text-[10px]">
          {label}
        </Label>
        <Input
          id={id}
          className="h-6 min-w-0 px-2 py-0 font-mono text-[10px] md:text-[10px]"
          value={parsed.text}
          onChange={(e) => onValueChange(e.target.value)}
          disabled={disabled}
          placeholder={placeholder}
        />
      </div>
    )
  }

  const num = parsed.kind === 'split' ? parsed.num : ''
  const unit: SizeUnit = parsed.kind === 'split' ? parsed.unit : 'px'

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <Label htmlFor={id} className="text-[10px]">
        {label}
      </Label>
      <InputGroup className="h-6 min-h-6 overflow-hidden rounded-md py-0 has-[>[data-align=inline-end]]:[&>input]:pe-1">
        <InputGroupInput
          id={id}
          data-slot="input-group-control"
          type="number"
          inputMode="decimal"
          className="h-6 min-h-0 py-0 pe-1 text-[10px]"
          value={num === '' ? '' : num}
          onChange={(e) => {
            const n = e.target.value
            if (n === '' || n === '-') {
              onValueChange('')
              return
            }
            onValueChange(buildSizeString({ kind: 'split', num: n, unit }))
          }}
          disabled={disabled}
          placeholder={placeholder}
        />
        <InputGroupAddon
          align="inline-end"
          className="shrink-0 border-s border-border py-0 pe-1 ps-0"
        >
          <Select
            value={unit}
            onValueChange={(u) => {
              const nextU = u as SizeUnit
              const n = num || '0'
              onValueChange(buildSizeString({ kind: 'split', num: n, unit: nextU }))
            }}
            disabled={disabled}
          >
            <SelectTrigger
              size="sm"
              className="h-5 w-12 rounded-md border-0 bg-transparent px-1 text-[10px] shadow-none ring-0 focus:ring-0"
              aria-label="Unit"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {UNITS.map((u) => (
                <SelectItem key={u} value={u}>
                  {u}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </InputGroupAddon>
      </InputGroup>
    </div>
  )
}
