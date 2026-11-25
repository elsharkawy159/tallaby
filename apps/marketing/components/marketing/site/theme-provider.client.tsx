"use client";

import { ThemeProvider } from "next-themes";

/**
 * tallaby.com light/dark mode (owner, 2026-11-25). Follows the device by
 * default; the footer switch stores the visitor's choice in localStorage.
 * next-themes renders a small inline script that sets the `dark` class on
 * <html> before the page paints, so there is no flash of the wrong theme.
 * Mounted only in (marketing)/layout.tsx: other routes never get the class.
 */
export function MarketingThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange storageKey="tallaby-theme">
      {children}
    </ThemeProvider>
  );
}
