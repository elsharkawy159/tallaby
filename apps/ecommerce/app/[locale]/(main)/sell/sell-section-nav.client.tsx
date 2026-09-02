'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'

import { cn } from '@/lib/utils'
import { SELL_SECTIONS } from './sell.lib'

export function SellSectionNav() {
  const t = useTranslations('pages.sell.nav')

  return (
    <nav
      aria-label={t('label')}
      className="hidden lg:block sticky top-20 z-30 py-4"
    >
      <div className="rounded-lg border bg-background/95 backdrop-blur p-3 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 px-2">
          {t('label')}
        </p>
        <ul className="space-y-1">
          {SELL_SECTIONS.map((section) => (
            <li key={section.id}>
              <Link
                href={`#${section.id}`}
                className={cn(
                  'block rounded-md px-2 py-1.5 text-sm text-muted-foreground transition-colors',
                  'hover:bg-muted hover:text-foreground',
                )}
              >
                {t(section.navKey)}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  )
}
