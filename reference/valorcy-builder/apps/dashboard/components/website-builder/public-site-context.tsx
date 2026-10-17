'use client'

import { createContext, useContext, useMemo, type ReactNode } from 'react'
import type { SectionInstance } from '@/components/sections/registry.types'
import type { ViewportBreakpoint } from '@/lib/builder/component-style'
import type { DesignSystem } from '@/lib/builder/store'
import type { PublicAuthConfig } from '@/lib/website-auth/public-types'

export type PublicSiteContextValue = {
  designSystem: DesignSystem
  sections: SectionInstance[]
  deviceMode: ViewportBreakpoint
  projectLogoUrl: string | null
  projectName: string | null
  /** Published/preview site id — enables live contact-form submissions. */
  websiteId: string | null
  /** All locales the project supports. Single-element array for monolingual sites. */
  supportedLocales: string[]
  /** The project's base/default locale. */
  defaultLocale: string
  /**
   * Public storefront slug, when this site is served as a storefront. Shared
   * chrome components (cart, wishlist, account) bind to the store only when it
   * is present; otherwise they fall back to plain configurable links.
   */
  siteSlug: string | null
  /** Whether the current visitor has a shopper session. */
  isSignedIn: boolean
  /**
   * Resolved website-auth configuration + the signed-in visitor, or null when
   * the site has authentication switched off. Consumed by the auth section
   * blocks (login/register/profile/protected content).
   */
  auth: PublicAuthConfig | null
}

const PublicSiteContext = createContext<PublicSiteContextValue | null>(null)

type PublicSiteProviderProps = {
  designSystem: DesignSystem
  sections: SectionInstance[]
  deviceMode?: ViewportBreakpoint
  projectLogoUrl?: string | null
  projectName?: string | null
  websiteId?: string | null
  supportedLocales?: string[]
  defaultLocale?: string
  siteSlug?: string | null
  isSignedIn?: boolean
  auth?: PublicAuthConfig | null
  children: ReactNode
}

export function PublicSiteProvider ({
  designSystem,
  sections,
  deviceMode = 'desktop',
  projectLogoUrl = null,
  projectName = null,
  websiteId = null,
  supportedLocales = ['en'],
  defaultLocale = 'en',
  siteSlug = null,
  isSignedIn = false,
  auth = null,
  children,
}: PublicSiteProviderProps) {
  const value = useMemo(
    () => ({
      designSystem,
      sections,
      deviceMode,
      projectLogoUrl,
      projectName,
      websiteId,
      supportedLocales,
      defaultLocale,
      siteSlug,
      isSignedIn,
      auth,
    }),
    [designSystem, sections, deviceMode, projectLogoUrl, projectName, websiteId, supportedLocales, defaultLocale, siteSlug, isSignedIn, auth]
  )

  return (
    <PublicSiteContext.Provider value={value}>
      {children}
    </PublicSiteContext.Provider>
  )
}

export function usePublicSiteContext () {
  return useContext(PublicSiteContext)
}
