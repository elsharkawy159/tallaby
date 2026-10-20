'use client'

import { useTranslations } from 'next-intl'
import {
  Zap,
  Palette,
  Building2,
  Briefcase,
  ShoppingBag,
  UtensilsCrossed,
  Home,
  HeartPulse,
  Dumbbell,
  GraduationCap,
  Sparkles,
} from 'lucide-react'
import { cn } from '@workspace/ui/lib/utils'

// Note: `startup` is intentionally NOT offered here — it's not really an industry.
// New projects pick SaaS instead. The `startup` enum value is retained in the DB
// for backwards-compatibility and maps to the `saas` Business Kit.
export const INDUSTRY_OPTIONS = [
  { value: 'saas', Icon: Zap },
  { value: 'portfolio', Icon: Palette },
  { value: 'agency', Icon: Building2 },
  { value: 'consulting', Icon: Briefcase },
  { value: 'ecommerce', Icon: ShoppingBag },
  { value: 'restaurant', Icon: UtensilsCrossed },
  { value: 'real_estate', Icon: Home },
  { value: 'medical', Icon: HeartPulse },
  { value: 'gym', Icon: Dumbbell },
  { value: 'school', Icon: GraduationCap },
  { value: 'other', Icon: Sparkles },
] as const

interface IndustryGridProps {
  value: string
  onChange: (v: string) => void
  /** Shown as a text input when value === 'other' */
  customValue?: string
  onCustomChange?: (v: string) => void
  disabled?: boolean
}

export function IndustryGrid({
  value,
  onChange,
  customValue,
  onCustomChange,
  disabled,
}: IndustryGridProps) {
  const t = useTranslations('design.industryGrid')

  return (
    <div className="flex flex-col gap-3">
      <div
        className="grid grid-cols-3 gap-2 sm:grid-cols-4"
        role="radiogroup"
        aria-label={t('ariaLabel')}
      >
        {INDUSTRY_OPTIONS.map(({ value: v, Icon }) => {
          const label = t(`options.${v}`)
          const selected = value === v
          return (
            <button
              key={v}
              type="button"
              role="radio"
              aria-checked={selected}
              disabled={disabled}
              onClick={() => onChange(v)}
              className={cn(
                'flex flex-col items-center gap-2 rounded-xl border p-3 text-center transition-all duration-150',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
                selected
                  ? 'border-primary bg-primary/5 text-primary shadow-sm'
                  : 'border-border bg-background text-muted-foreground hover:border-primary/40 hover:bg-muted/50 hover:text-foreground',
                disabled && 'pointer-events-none opacity-50'
              )}
            >
              <Icon className="size-5 shrink-0" strokeWidth={selected ? 2.5 : 1.75} />
              <span className="text-xs font-medium leading-tight">{label}</span>
            </button>
          )
        })}
      </div>

      {value === 'other' && onCustomChange !== undefined && (
        <div className="animate-in fade-in slide-in-from-top-1 flex flex-col gap-1.5 duration-150">
          <label className="text-xs font-medium text-muted-foreground">
            {t('customQuestion')}
          </label>
          <input
            type="text"
            value={customValue ?? ''}
            onChange={(e) => onCustomChange(e.target.value)}
            placeholder={t('customPlaceholder')}
            disabled={disabled}
            autoFocus
            className={cn(
              'flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm shadow-sm',
              'placeholder:text-muted-foreground transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
              'disabled:cursor-not-allowed disabled:opacity-50'
            )}
          />
        </div>
      )}
    </div>
  )
}
