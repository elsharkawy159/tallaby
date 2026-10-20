'use client'

import { useEffect, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { Check } from 'lucide-react'
import { isRtlLocale } from '@workspace/i18n'
import { cn } from '@workspace/ui/lib/utils'
import { buildGoogleFontsHref } from '@/lib/builder/design-system-fonts'

export interface FontPairing {
  id: string
  headingFont: string
  bodyFont: string
  headingFamily: string
  bodyFamily: string
}

export const FONT_PAIRINGS: FontPairing[] = [
  {
    id: 'editorial',
    headingFont: 'Fraunces',
    bodyFont: 'Inter',
    headingFamily: "'Fraunces', serif",
    bodyFamily: "'Inter', sans-serif",
  },
  {
    id: 'elegant',
    headingFont: 'DM Serif Display',
    bodyFont: 'DM Sans',
    headingFamily: "'DM Serif Display', serif",
    bodyFamily: "'DM Sans', sans-serif",
  },
  {
    id: 'minimal',
    headingFont: 'Space Grotesk',
    bodyFont: 'Space Grotesk',
    headingFamily: "'Space Grotesk', sans-serif",
    bodyFamily: "'Space Grotesk', sans-serif",
  },
  {
    id: 'bold',
    headingFont: 'Archivo Black',
    bodyFont: 'Archivo',
    headingFamily: "'Archivo Black', sans-serif",
    bodyFamily: "'Archivo', sans-serif",
  },
  {
    id: 'refined',
    headingFont: 'Cormorant Garamond',
    bodyFont: 'Lato',
    headingFamily: "'Cormorant Garamond', serif",
    bodyFamily: "'Lato', sans-serif",
  },
  {
    id: 'soft',
    headingFont: 'Quicksand',
    bodyFont: 'Nunito',
    headingFamily: "'Quicksand', sans-serif",
    bodyFamily: "'Nunito', sans-serif",
  },
]

/**
 * Arabic-capable pairings, offered instead of the Latin set when the project's
 * language is RTL. Every family here has full Arabic glyph coverage and is
 * present in `GOOGLE_FONTS`, so the same family also loads on the published
 * site via `designSystemFontsHref`.
 */
export const ARABIC_FONT_PAIRINGS: FontPairing[] = [
  {
    id: 'arTajawal',
    headingFont: 'Tajawal',
    bodyFont: 'Tajawal',
    headingFamily: "'Tajawal', sans-serif",
    bodyFamily: "'Tajawal', sans-serif",
  },
  {
    id: 'arCairo',
    headingFont: 'Cairo',
    bodyFont: 'Almarai',
    headingFamily: "'Cairo', sans-serif",
    bodyFamily: "'Almarai', sans-serif",
  },
  {
    id: 'arNaskh',
    headingFont: 'El Messiri',
    bodyFont: 'Noto Naskh Arabic',
    headingFamily: "'El Messiri', serif",
    bodyFamily: "'Noto Naskh Arabic', serif",
  },
  {
    id: 'arKufi',
    headingFont: 'Noto Kufi Arabic',
    bodyFont: 'IBM Plex Sans Arabic',
    headingFamily: "'Noto Kufi Arabic', sans-serif",
    bodyFamily: "'IBM Plex Sans Arabic', sans-serif",
  },
  {
    id: 'arChanga',
    headingFont: 'Changa',
    bodyFont: 'Tajawal',
    headingFamily: "'Changa', sans-serif",
    bodyFamily: "'Tajawal', sans-serif",
  },
  {
    id: 'arAlmarai',
    headingFont: 'Almarai',
    bodyFont: 'Cairo',
    headingFamily: "'Almarai', sans-serif",
    bodyFamily: "'Cairo', sans-serif",
  },
]

/** The pairing set to offer for a project locale — Arabic families for RTL. */
export function fontPairingsForLocale (locale: string | null | undefined): FontPairing[] {
  return isRtlLocale(locale) ? ARABIC_FONT_PAIRINGS : FONT_PAIRINGS
}

/** Look a pairing up across both sets, falling back to the set's first entry. */
export function findFontPairing (
  id: string,
  locale?: string | null
): FontPairing {
  const set = fontPairingsForLocale(locale)
  return (
    set.find((p) => p.id === id) ??
    [...FONT_PAIRINGS, ...ARABIC_FONT_PAIRINGS].find((p) => p.id === id) ??
    set[0]!
  )
}

interface FontPairingsProps {
  value: string
  onChange: (pairingId: string, headingFont: string, bodyFont: string) => void
  disabled?: boolean
  /** Project language — selects the Arabic pairing set when RTL. */
  locale?: string
}

export function FontPairings({ value, onChange, disabled, locale }: FontPairingsProps) {
  const t = useTranslations('design.fontPairings')
  const pairings = useMemo(() => fontPairingsForLocale(locale), [locale])
  const isRtl = isRtlLocale(locale)

  // Load only the families for the active set. Keyed per set so switching the
  // project language pulls in the other set's stylesheet instead of reusing a
  // stale one.
  useEffect(() => {
    const id = `onboarding-google-fonts-${isRtl ? 'ar' : 'latin'}`
    if (document.getElementById(id)) return
    const href = buildGoogleFontsHref(
      pairings.flatMap((p) => [p.headingFont, p.bodyFont])
    )
    if (!href) return
    const link = document.createElement('link')
    link.id = id
    link.rel = 'stylesheet'
    link.href = href
    document.head.appendChild(link)
  }, [pairings, isRtl])

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3" role="radiogroup" aria-label={t('ariaLabel')}>
      {pairings.map((pairing) => {
        const selected = value === pairing.id
        const name = t(`pairings.${pairing.id}.name`)
        const style = t(`pairings.${pairing.id}.style`)
        return (
          <button
            key={pairing.id}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={disabled}
            onClick={() => onChange(pairing.id, pairing.headingFont, pairing.bodyFont)}
            className={cn(
              'relative flex flex-col gap-1 rounded-xl border p-3 text-start transition-all duration-150',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              selected
                ? 'border-primary bg-primary/5 shadow-sm ring-1 ring-primary/30'
                : 'border-border hover:border-primary/40 hover:shadow-sm',
              disabled && 'pointer-events-none opacity-50'
            )}
          >
            <span
              className="block truncate text-base font-semibold leading-tight text-foreground"
              style={{ fontFamily: pairing.headingFamily }}
            >
              {isRtl ? name : `Aa ${name}`}
            </span>
            <span
              className="block truncate text-xs text-muted-foreground"
              style={{ fontFamily: pairing.bodyFamily }}
            >
              {t('previewText')}
            </span>
            <span className="mt-1 text-[10px] text-muted-foreground/70">
              {style}
            </span>
            {selected && (
              <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Check className="size-2.5" strokeWidth={3} />
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
