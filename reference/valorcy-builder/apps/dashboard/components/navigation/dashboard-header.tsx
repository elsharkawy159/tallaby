'use client'

import { useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { usePathname } from '@/i18n/navigation'
import { getPageHeaderRouteKey } from '@/lib/page-header-routes'
import { LanguageSwitcher } from '@/components/navigation/language-switcher'
import type { LanguageOption } from '@/components/navigation/language-switcher'
import { ThemeToggle } from '@/components/navigation/theme-toggle'
import {
  PAGE_TITLE_CLASS,
  useOptionalPageHeaderContext,
} from '@/components/navigation/page-header'
import { Button } from '@workspace/ui/components/button'
import { Search } from 'lucide-react'

function openCommandPalette () {
  document.dispatchEvent(
    new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true }),
  )
}

export function DashboardHeader ({
  className,
  currentPathname = null,
  languages,
}: {
  className?: string
  currentPathname?: string | null
  languages?: LanguageOption[]
}) {
  const t = useTranslations('pages.dashboard')
  const tHeaders = useTranslations('pages.pageHeaders')
  const pathname = usePathname()
  const pageHeader = useOptionalPageHeaderContext()

  const fallbackTitle = useMemo(() => {
    const routeKey = getPageHeaderRouteKey(pathname ?? currentPathname)
    if (!routeKey) return t('title')
    try {
      return tHeaders(`${routeKey}.title`)
    } catch {
      return t('title')
    }
  }, [pathname, currentPathname, t, tHeaders])

  const title = pageHeader?.title ?? fallbackTitle

  return (
    <header
      className={cn(
        'sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-sm',
        className,
      )}
    >
      <div className="grid container grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 py-3">
        <div className="flex min-w-0 items-center">
          <h1 className={PAGE_TITLE_CLASS}>{title}</h1>
        </div>

        <div className="hidden justify-center sm:flex">
          <Button
            variant="outline"
            size="sm"
            className="flex h-8 w-72 items-center gap-2 justify-start text-sm text-muted-foreground lg:w-80"
            onClick={openCommandPalette}
          >
            <Search className="size-3.5 shrink-0" />
            <span className="truncate">{tHeaders('searchPlaceholder')}</span>
            <kbd className="ms-auto inline-flex h-5 shrink-0 items-center gap-0.5 rounded border border-border bg-muted px-1.5 font-mono text-[10px] text-muted-foreground">
              ⌘K
            </kbd>
          </Button>
        </div>

        <div className="flex items-center justify-end gap-2">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 shrink-0 sm:hidden"
            onClick={openCommandPalette}
            aria-label={tHeaders('searchPlaceholder')}
          >
            <Search className="size-4" />
          </Button>
          <span className="sr-only">{t('navigation')}</span>
          <LanguageSwitcher languages={languages} />
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
