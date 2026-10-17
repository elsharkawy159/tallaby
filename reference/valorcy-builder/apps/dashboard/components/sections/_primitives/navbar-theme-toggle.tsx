'use client'

import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { cn } from '@workspace/ui/lib/utils'

type NavbarThemeToggleProps = {
  className?: string
}

/**
 * Icon button for navbar sections — toggles site light/dark via next-themes.
 */
export function NavbarThemeToggle ({ className }: NavbarThemeToggleProps) {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const isDark =
    mounted && (resolvedTheme === 'dark' || theme === 'dark')

  return (
    <button
      type="button"
      className={cn(
        'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-transparent text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
        className
      )}
      onClick={(e) => {
        e.stopPropagation()
        if (!mounted) return
        setTheme(isDark ? 'light' : 'dark')
      }}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {!mounted || !isDark ? (
        <Moon className="h-4 w-4" aria-hidden />
      ) : (
        <Sun className="h-4 w-4" aria-hidden />
      )}
    </button>
  )
}
