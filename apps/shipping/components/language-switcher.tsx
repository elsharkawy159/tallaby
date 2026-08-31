"use client"

import { useRouter } from "next/navigation"
import { useLocale, useTranslations } from "next-intl"
import { Globe } from "lucide-react"

import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

interface LanguageSwitcherProps {
  variant?: "header" | "default"
}

export function LanguageSwitcher ({
  variant = "default",
}: LanguageSwitcherProps) {
  const router = useRouter()
  const locale = useLocale()
  const t = useTranslations("common")

  function switchLocale (newLocale: string) {
    const oneYear = 60 * 60 * 24 * 365
    document.cookie = `locale=${newLocale}; path=/; max-age=${oneYear};`
    router.refresh()
  }

  const locales = [
    { code: "ar", label: "عربي" },
    { code: "en", label: "English" },
  ]

  const isHeader = variant === "header"

  return (
    <div className="flex items-center gap-1" role="group" aria-label={t("language")}>
      {locales.map((l) => (
        <Button
          key={l.code}
          size="sm"
          variant={l.code === locale ? "default" : "ghost"}
          onClick={() => switchLocale(l.code)}
          className={cn(
            "h-8 gap-1.5 px-2.5 text-xs font-medium",
            l.code === locale
              ? "cursor-default"
              : isHeader
                ? "text-muted-foreground hover:text-foreground"
                : "text-gray-700 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-700"
          )}
          aria-label={l.label}
          aria-pressed={l.code === locale}
        >
          <Globe className="size-3.5" />
          {l.label}
        </Button>
      ))}
    </div>
  )
}
