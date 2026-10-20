'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  DEFAULT_LOCALE,
  languageLabel,
  localeDirection,
  type LanguageLabelStyle,
} from '@workspace/i18n'
import { cn } from '@workspace/ui/lib/utils'

/** How the switcher labels locales. Mirrors the catalog label styles. */
export type LanguageSwitcherStyle = LanguageLabelStyle

const LOCALE_STORAGE_KEY = 'site-locale'

type Props = {
  supportedLocales: string[]
  /** Initial active locale (e.g. from project default). */
  defaultLocale?: string
  switcherStyle?: LanguageSwitcherStyle
  className?: string
}

/**
 * Computes the URL for viewing the current page in `locale`, given the current
 * `pathname`/`search`. The default locale uses the clean canonical URL; other
 * locales use `/<locale>` for the home page and `?lang=<locale>` for subpages —
 * matching the localized routing in `/sites/[slug]`.
 */
export function localeHref(
  pathname: string,
  search: string,
  locale: string,
  defaultLocale: string,
  supportedLocales: string[]
): string {
  const segments = pathname.split('/').filter(Boolean)
  const first = segments[0]
  const hasLocalePrefix =
    !!first && supportedLocales.includes(first) && first !== defaultLocale
  const rest = hasLocalePrefix ? segments.slice(1) : segments
  const isHome = rest.length === 0

  const params = new URLSearchParams(search)
  params.delete('lang')

  let path: string
  if (isHome) {
    path = locale === defaultLocale ? '/' : `/${locale}`
  } else {
    path = `/${rest.join('/')}`
    if (locale !== defaultLocale) params.set('lang', locale)
  }
  const qs = params.toString()
  return qs ? `${path}?${qs}` : path
}

/**
 * Published-site language switcher for multilingual websites.
 *
 * Labels come from the `@workspace/i18n` catalog, so every language is rendered
 * with its own name/flag automatically. Selecting a language navigates to that
 * locale's URL (real, shareable, SSR-rendered) and flips the page direction.
 * In the builder canvas the buttons are non-functional (clicks are intercepted
 * for editing) — locale there is driven by the workspace tabs.
 */
export function NavbarLanguageSwitcher({
  supportedLocales,
  defaultLocale = DEFAULT_LOCALE,
  switcherStyle = 'code',
  className,
}: Props) {
  const [activeLocale, setActiveLocale] = useState(defaultLocale)

  useEffect(() => {
    // Derive the active locale from the URL (path prefix or `?lang=`), falling
    // back to a persisted choice, so the control reflects the rendered page.
    try {
      const segments = window.location.pathname.split('/').filter(Boolean)
      const first = segments[0]
      const fromPath =
        first && supportedLocales.includes(first) && first !== defaultLocale
          ? first
          : null
      const fromQuery = new URLSearchParams(window.location.search).get('lang')
      const stored = localStorage.getItem(LOCALE_STORAGE_KEY)
      const next =
        fromPath ??
        (fromQuery && supportedLocales.includes(fromQuery) ? fromQuery : null) ??
        (stored && supportedLocales.includes(stored) ? stored : null)
      if (next) setActiveLocale(next)
    } catch {}
  }, [supportedLocales, defaultLocale])

  const handleSwitch = useCallback(
    (locale: string) => {
      if (locale === activeLocale) return
      try {
        localStorage.setItem(LOCALE_STORAGE_KEY, locale)
      } catch {}
      // Flip direction immediately for perceived responsiveness…
      const root = document.querySelector('[dir]')
      if (root) root.setAttribute('dir', localeDirection(locale))
      document.dispatchEvent(new CustomEvent('site-locale-change', { detail: { locale } }))
      // …then navigate to the locale's URL so the server renders that content.
      const href = localeHref(
        window.location.pathname,
        window.location.search,
        locale,
        defaultLocale,
        supportedLocales
      )
      window.location.assign(href)
    },
    [activeLocale, defaultLocale, supportedLocales]
  )

  if (supportedLocales.length <= 1) return null

  return (
    <div
      className={cn(
        'flex items-center gap-0.5 rounded-md border border-border/60 bg-muted/50 p-0.5',
        className
      )}
    >
      {supportedLocales.map((locale) => (
        <button
          key={locale}
          type="button"
          onClick={() => handleSwitch(locale)}
          className={cn(
            'min-w-[32px] rounded px-2 py-1 text-xs font-semibold transition-colors',
            activeLocale === locale
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
          aria-pressed={activeLocale === locale}
          lang={locale}
        >
          {languageLabel(locale, switcherStyle)}
        </button>
      ))}
    </div>
  )
}
