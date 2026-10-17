'use client'

import { useCallback, useTransition } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { Button } from '@workspace/ui/components/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@workspace/ui/components/dropdown-menu'
import { Globe } from 'lucide-react'
import { locales } from '@/i18n/config'

export type LanguageOption = {
  code: string
  name: string
  nativeName: string | null
  direction: 'ltr' | 'rtl'
}

type Props = {
  languages?: LanguageOption[]
}

export function LanguageSwitcher ({ languages: languagesProp }: Props) {
  const t = useTranslations('common')
  const locale = useLocale()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const languages: LanguageOption[] = languagesProp?.length
    ? languagesProp
    : locales.map((code) => ({
        code,
        name: code === 'ar' ? 'Arabic' : 'English',
        nativeName: code === 'ar' ? 'العربية' : 'English',
        direction: code === 'ar' ? 'rtl' as const : 'ltr' as const,
      }))

  const setLocale = useCallback(
    (nextLocale: string) => {
      if (nextLocale === locale) return
      document.cookie = `NEXT_LOCALE=${nextLocale};path=/;max-age=31536000;samesite=lax`
      document.cookie = `valorcy_locale=${nextLocale};path=/;max-age=31536000;samesite=lax`
      startTransition(() => {
        router.refresh()
      })
    },
    [locale, router]
  )

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-9 w-9 text-muted-foreground hover:text-foreground"
          aria-label={t('language')}
          disabled={isPending}
        >
          <Globe className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-40">
        <DropdownMenuLabel>{t('language')}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => setLocale(lang.code)}
            aria-checked={locale === lang.code}
          >
            {lang.nativeName ?? lang.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
