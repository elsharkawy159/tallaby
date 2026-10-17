import type { VisibilityRules } from '@/lib/builder/shared-chrome/types'

/**
 * Responsive + auth visibility for a chrome component.
 *
 * Breakpoints map to Tailwind classes rather than conditional rendering so the
 * published HTML stays static and the same markup serves every viewport — the
 * canvas device switcher then shows exactly what a visitor would see.
 *
 * Tablet is the `md`–`lg` band, matching the builder's own device modes.
 */
export function visibilityClasses (v: VisibilityRules | undefined): string {
  if (!v) return ''
  const { showDesktop = true, showTablet = true, showMobile = true } = v
  if (showDesktop && showTablet && showMobile) return ''

  const classes: string[] = []
  // Base (mobile-first) state, then override upwards at each breakpoint.
  classes.push(showMobile ? 'flex' : 'hidden')
  classes.push(showTablet ? 'md:flex' : 'md:hidden')
  classes.push(showDesktop ? 'lg:flex' : 'lg:hidden')
  return classes.join(' ')
}

/** Whether a component renders at all for the current visitor's auth state. */
export function passesAuthRule (
  v: VisibilityRules | undefined,
  isSignedIn: boolean
): boolean {
  switch (v?.auth) {
    case 'loggedIn':
      return isSignedIn
    case 'loggedOut':
      return !isSignedIn
    default:
      return true
  }
}

/** Never hide anything while editing — the author has to be able to select it. */
export function isVisibleForRender (
  v: VisibilityRules | undefined,
  { isPreview, isSignedIn }: { isPreview: boolean; isSignedIn: boolean }
): boolean {
  if (!isPreview) return true
  return passesAuthRule(v, isSignedIn)
}
