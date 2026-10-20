'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Check, Pipette } from 'lucide-react'
import { cn } from '@workspace/ui/lib/utils'
import { derivePaletteFromPrimary } from '@/components/projects/project-identity-form/derive-palette'

export interface PaletteValue {
  presetId: string | null
  primary: string
  secondary: string
  accent: string
}

export const PALETTE_PRESETS = [
  { id: 'ocean',    primary: '#0066cc', secondary: '#004a99', accent: '#00b4d8' },
  { id: 'forest',   primary: '#2d6a4f', secondary: '#1b4332', accent: '#52b788' },
  { id: 'sunset',   primary: '#e05c2a', secondary: '#b54a21', accent: '#f4a261' },
  { id: 'berry',    primary: '#7b2d8b', secondary: '#5c2166', accent: '#c77dff' },
  { id: 'mono',     primary: '#1a1a2e', secondary: '#16213e', accent: '#e94560' },
  { id: 'midnight', primary: '#2c3e50', secondary: '#1a252f', accent: '#3498db' },
  { id: 'coral',    primary: '#ff6b6b', secondary: '#ee5a24', accent: '#ffeaa7' },
  { id: 'sage',     primary: '#6b9e78', secondary: '#4d7a5a', accent: '#c8e6c9' },
]

interface PalettePresetsProps {
  value: PaletteValue
  onChange: (next: PaletteValue) => void
  disabled?: boolean
}

export function PalettePresets({ value, onChange, disabled }: PalettePresetsProps) {
  const t = useTranslations('design.palettePresets')
  const [customPrimary, setCustomPrimary] = useState(value.primary)
  const [customSecondary, setCustomSecondary] = useState(value.secondary)
  const [customAccent, setCustomAccent] = useState(value.accent)
  const isCustom = value.presetId === null

  function selectPreset(preset: (typeof PALETTE_PRESETS)[number]) {
    onChange({ presetId: preset.id, primary: preset.primary, secondary: preset.secondary, accent: preset.accent })
  }

  function selectCustom() {
    const derived = derivePaletteFromPrimary(customPrimary)
    setCustomSecondary(derived.secondary)
    setCustomAccent(derived.accent)
    onChange({ presetId: null, ...derived })
  }

  function handleCustomPrimaryChange(hex: string) {
    setCustomPrimary(hex)
    // Auto-derive secondary + accent from new primary
    const derived = derivePaletteFromPrimary(hex)
    setCustomSecondary(derived.secondary)
    setCustomAccent(derived.accent)
    onChange({ presetId: null, primary: hex, secondary: derived.secondary, accent: derived.accent })
  }

  function handleCustomSecondaryChange(hex: string) {
    setCustomSecondary(hex)
    onChange({ presetId: null, primary: customPrimary, secondary: hex, accent: customAccent })
  }

  function handleCustomAccentChange(hex: string) {
    setCustomAccent(hex)
    onChange({ presetId: null, primary: customPrimary, secondary: customSecondary, accent: hex })
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
        {PALETTE_PRESETS.map((preset) => {
          const selected = value.presetId === preset.id
          return (
            <button
              key={preset.id}
              type="button"
              disabled={disabled}
              onClick={() => selectPreset(preset)}
              className={cn(
                'group relative flex flex-col items-center gap-1.5 rounded-xl border p-2 pb-2.5 transition-all duration-150',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                selected
                  ? 'border-primary shadow-sm ring-1 ring-primary/30'
                  : 'border-border hover:border-primary/40 hover:shadow-sm',
                disabled && 'pointer-events-none opacity-50'
              )}
              aria-label={t(`presets.${preset.id}`)}
            >
              <div className="flex gap-0.5">
                <span className="size-4 rounded-full" style={{ backgroundColor: preset.primary }} />
                <span className="size-4 rounded-full" style={{ backgroundColor: preset.secondary }} />
                <span className="size-4 rounded-full" style={{ backgroundColor: preset.accent }} />
              </div>
              <span className="text-[10px] font-medium text-muted-foreground group-hover:text-foreground">
                {t(`presets.${preset.id}`)}
              </span>
              {selected && (
                <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Check className="size-2.5" strokeWidth={3} />
                </span>
              )}
            </button>
          )
        })}

        {/* Custom card */}
        <button
          type="button"
          disabled={disabled}
          onClick={selectCustom}
          className={cn(
            'group relative flex flex-col items-center gap-1.5 rounded-xl border p-2 pb-2.5 transition-all duration-150',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            isCustom
              ? 'border-primary shadow-sm ring-1 ring-primary/30'
              : 'border-dashed border-border hover:border-primary/40',
            disabled && 'pointer-events-none opacity-50'
          )}
          aria-label={t('customAriaLabel')}
        >
          <Pipette className="size-4 text-muted-foreground group-hover:text-foreground" />
          <span className="text-[10px] font-medium text-muted-foreground group-hover:text-foreground">
            {t('customLabel')}
          </span>
          {isCustom && (
            <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Check className="size-2.5" strokeWidth={3} />
            </span>
          )}
        </button>
      </div>

      {isCustom && (
        <div className="animate-in fade-in slide-in-from-top-2 flex flex-col gap-3 rounded-xl border border-border bg-muted/30 p-4">
          <p className="text-xs text-muted-foreground">
            {t('customHint')}
          </p>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: t('primaryLabel'), value: customPrimary, onChange: handleCustomPrimaryChange },
              { label: t('secondaryLabel'), value: customSecondary, onChange: handleCustomSecondaryChange },
              { label: t('accentLabel'), value: customAccent, onChange: handleCustomAccentChange },
            ].map(({ label, value: cv, onChange: onCv }) => (
              <label key={label} className="flex flex-col items-center gap-1.5 cursor-pointer">
                <input
                  type="color"
                  value={cv}
                  onChange={(e) => onCv(e.target.value)}
                  className="size-10 w-full cursor-pointer rounded-lg border border-border bg-transparent p-0.5"
                  disabled={disabled}
                />
                <span className="text-xs text-muted-foreground">{label}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
