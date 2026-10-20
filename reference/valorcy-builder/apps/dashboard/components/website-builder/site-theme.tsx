'use client'

import { ThemeProvider } from '@workspace/ui/components/theme-provider'

type Theme = 'light' | 'dark' | 'system'

/**
 * Provides the website's initial theme on the public/published site.
 * Uses a per-site storage key so visitor toggles persist without being
 * overwritten on navigation. `defaultTheme` applies only when no saved
 * preference exists (stored in `websites.default_theme`).
 */
export function SiteThemeProvider ({
  websiteId,
  defaultTheme,
  children,
}: {
  websiteId: string
  defaultTheme: Theme
  children: React.ReactNode
}) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme={defaultTheme}
      enableSystem
      disableTransitionOnChange
      storageKey={`website-theme-${websiteId}`}
    >
      {children}
    </ThemeProvider>
  )
}
