'use client'

import { useEffect, useMemo, useState } from 'react'
import { Input } from '@workspace/ui/components/input'
import { Label } from '@workspace/ui/components/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@workspace/ui/components/select'
import { cn } from '@workspace/ui/lib/utils'
import { GOOGLE_FONTS, buildGoogleFontsHref } from '@/lib/builder/design-system-fonts'

/** System stacks always available without a network fetch. */
const SYSTEM_FONTS = [
  { value: 'system-ui, sans-serif', label: 'System UI' },
  { value: 'Georgia, serif', label: 'Georgia' }
] as const

export const FONT_CHOICES = [
  ...GOOGLE_FONTS.map((f) => ({ value: f, label: f })),
  ...SYSTEM_FONTS
] as const

/** Loads a Google Fonts stylesheet once per family set so dropdown previews render. */
function useLoadFontPreviews (enabled: boolean) {
  useEffect(() => {
    if (!enabled || typeof document === 'undefined') return
    const id = 'ds-font-preview-sheet'
    if (document.getElementById(id)) return
    const href = buildGoogleFontsHref(GOOGLE_FONTS)
    if (!href) return
    const link = document.createElement('link')
    link.id = id
    link.rel = 'stylesheet'
    link.href = href
    document.head.appendChild(link)
  }, [enabled])
}

export type FontFamilySelectProps = {
  id?: string
  label: string
  value: string
  onValueChange: (next: string) => void
  disabled?: boolean
  className?: string
  inputId?: string
}

export function FontFamilySelect ({
  id,
  label,
  value,
  onValueChange,
  disabled,
  className,
  inputId
}: FontFamilySelectProps) {
  const [opened, setOpened] = useState(false)
  useLoadFontPreviews(opened)

  const trimmed = value.trim()
  const presetMatch = useMemo(
    () => FONT_CHOICES.find((f) => f.value === trimmed),
    [trimmed]
  )
  const selectVal = presetMatch ? presetMatch.value : '__custom'

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <Label htmlFor={id} className="text-[10px]">
        {label}
      </Label>
      <Select
        value={selectVal}
        onValueChange={(next) => {
          if (next === '__custom') return
          onValueChange(next)
        }}
        onOpenChange={(o) => o && setOpened(true)}
        disabled={disabled}
      >
        <SelectTrigger id={id} className="h-6 w-full text-[10px]" size="sm">
          <SelectValue placeholder="Quick pick" />
        </SelectTrigger>
        <SelectContent className="max-h-72">
          <SelectItem value="__custom" style={{ fontFamily: 'inherit' }}>
            Custom (use field below)
          </SelectItem>
          {FONT_CHOICES.map((f) => (
            <SelectItem
              key={f.value}
              value={f.value}
              style={{ fontFamily: f.value }}
            >
              {f.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input
        id={inputId}
        className="h-6 px-2 py-0 text-[10px] md:text-[10px]"
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        disabled={disabled}
        placeholder="e.g. Fraunces, Georgia, serif"
      />
    </div>
  )
}
