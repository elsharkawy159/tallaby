'use client'

import { useMemo } from 'react'
import { useTranslations } from 'next-intl'

interface BrandPreviewProps {
  name: string
  primary: string
  secondary: string
  accent: string
  headingFamily: string
  bodyFamily: string
  logoFile: File | null
  logoUrl: string | null
}

function logoSrc(file: File | null, url: string | null): string | null {
  if (file) return URL.createObjectURL(file)
  if (url) return url
  return null
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')
}

function isLight(hex: string) {
  const h = hex.replace('#', '')
  if (h.length !== 6) return false
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  return (r * 299 + g * 587 + b * 114) / 1000 > 155
}

export function BrandPreview({
  name,
  primary,
  secondary,
  accent,
  headingFamily,
  bodyFamily,
  logoFile,
  logoUrl,
}: BrandPreviewProps) {
  const t = useTranslations('design.brandPreview')
  const src = useMemo(() => logoSrc(logoFile, logoUrl), [logoFile, logoUrl])
  const label = name.trim() || t('fallbackName')
  const abbr = initials(label)
  const heroDark = !isLight(primary)

  return (
    <div className="overflow-hidden rounded-xl border border-border shadow-sm select-none">
      {/* Navbar */}
      <div
        className="flex items-center gap-2 px-3 py-2"
        style={{ backgroundColor: secondary || '#1a1a2e' }}
      >
        {src ? (
          <img src={src} alt="logo" className="h-5 w-auto max-w-[60px] object-contain" />
        ) : (
          <span
            className="flex size-5 shrink-0 items-center justify-center rounded text-[9px] font-bold"
            style={{ backgroundColor: primary, color: heroDark ? '#fff' : '#000' }}
          >
            {abbr || 'B'}
          </span>
        )}
        <span
          className="text-xs font-semibold truncate"
          style={{ fontFamily: headingFamily, color: isLight(secondary || '#1a1a2e') ? '#000' : '#fff' }}
        >
          {label}
        </span>
        <span
          className="ms-auto shrink-0 rounded px-1.5 py-0.5 text-[9px] font-semibold"
          style={{ backgroundColor: accent, color: isLight(accent) ? '#000' : '#fff' }}
        >
          {t('getStarted')}
        </span>
      </div>

      {/* Hero */}
      <div
        className="flex flex-col gap-1.5 px-4 py-5"
        style={{ backgroundColor: primary }}
      >
        <p
          className="text-sm font-bold leading-snug"
          style={{
            fontFamily: headingFamily,
            color: heroDark ? '#fff' : '#000',
          }}
        >
          {t('heroTitle')}
        </p>
        <p
          className="text-[11px] leading-relaxed opacity-80"
          style={{
            fontFamily: bodyFamily,
            color: heroDark ? '#fff' : '#000',
          }}
        >
          {t('heroDescription')}
        </p>
        <button
          type="button"
          className="mt-1 w-fit rounded px-2.5 py-1 text-[10px] font-semibold transition-opacity hover:opacity-90"
          style={{ backgroundColor: accent, color: isLight(accent) ? '#000' : '#fff' }}
          tabIndex={-1}
        >
          {t('learnMore')}
        </button>
      </div>

      {/* Footer hint */}
      <div className="flex items-center gap-1 bg-muted/50 px-3 py-1.5">
        <span className="size-2 rounded-full" style={{ backgroundColor: primary }} />
        <span className="size-2 rounded-full" style={{ backgroundColor: secondary }} />
        <span className="size-2 rounded-full" style={{ backgroundColor: accent }} />
        <span className="ms-auto text-[9px] text-muted-foreground">{t('preview')}</span>
      </div>
    </div>
  )
}
