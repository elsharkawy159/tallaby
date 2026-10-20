'use client'

import { useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { sectionRegistry } from '@/components/sections'
import { PublicSectionsRenderer } from '@/components/website-builder/public-sections-renderer'
import { createPreviewSectionInstance } from '@/lib/builder/create-preview-section-instance'
import { DESIGN_SYSTEM_PRESETS } from '@/lib/builder/design-system-presets'

/**
 * Dev-only section catalog — renders every section of a category with its
 * registry defaults, under any design-system preset, light or dark, LTR or RTL.
 *
 *   /preview/catalog?category=hero&preset=bold&dark=1&locale=ar&id=hero-atlas
 *
 * Used to review sections against the theme matrix in
 * docs/website-builder-sections.md §6.10 and as the source for thumbnails.
 */
export function SectionCatalog () {
  const sp = useSearchParams()
  const category = sp.get('category') ?? 'hero'
  const only = sp.get('id')
  const presetId = sp.get('preset') ?? 'clean'
  const locale = sp.get('locale') ?? 'en'
  const dark = sp.get('dark') === '1'

  const preset = DESIGN_SYSTEM_PRESETS.find((p) => p.id === presetId) ?? DESIGN_SYSTEM_PRESETS[0]!

  const sections = useMemo(() => {
    const defs = only
      ? [sectionRegistry.get(only)].filter(Boolean)
      : sectionRegistry.getByCategory(category as never).filter((d) => !d.hidden)
    return defs
      .map((d) => createPreviewSectionInstance(d!.id, locale, null))
      .filter((s): s is NonNullable<typeof s> => s !== null)
      .map((s) => ({ ...s, id: `catalog-${s.sectionId}` }))
  }, [category, only, locale])

  return (
    <div className={dark ? 'dark' : undefined}>
      {sections.map((s) => (
        <div key={s.id} data-catalog-section={s.sectionId}>
          <div className="bg-black px-3 py-1 font-mono text-[11px] text-white">
            {s.sectionId} · {sectionRegistry.get(s.sectionId)?.displayName}
          </div>
          <PublicSectionsRenderer
            sections={[s]}
            designSystem={preset.design}
            locale={locale}
            defaultLocale={locale}
            supportedLocales={[locale]}
          />
        </div>
      ))}
    </div>
  )
}
