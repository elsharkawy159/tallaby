'use client'

import { sectionRegistry } from '@/components/sections'
import type { ElementChromeAttributes, SectionInstance, SectionPaginationMeta } from '@/components/sections/registry.types'
import type { ComponentNode } from '@/lib/builder/component-node'
import { Fragment, Suspense, type CSSProperties } from 'react'
import { StaticComponentTreeRenderer } from '@/components/website-builder/component-tree-renderer'
import { InjectedChildrenPublicLayer } from '@/components/website-builder/injected-children-public-layer'
import { CustomSectionSurface } from '@/components/sections/custom/custom-blank-section'
import { AnimationWrapper } from '@/components/website-builder/animation-wrapper'
import type { BuilderDesignSystemState } from '@/lib/builder/design-system-map'
import { buildPublicElementStyleRules } from '@/lib/builder/public-element-style-rules'
import { PublicSiteProvider } from '@/components/website-builder/public-site-context'
import type { PublicAuthConfig } from '@/lib/website-auth/public-types'
import {
  designSystemToThemeCss,
  SITE_THEME_ROOT_CLASS,
} from '@/lib/builder/design-system-css-vars'
import { designSystemFontsHref } from '@/lib/builder/design-system-fonts'
import { normalizeSectionsForPublic } from '@/lib/builder/normalize-page-content'
import { DEFAULT_DESIGN_SYSTEM, type DesignSystem } from '@/lib/builder/store'
import { localeDirection, DEFAULT_LOCALE } from '@workspace/i18n'
import { CmsPagination } from '@/components/website-builder/cms-pagination'
import {
  MadeInValorcyBadge,
  type MadeInValorcyBadgeContext,
} from '@/components/system/made-in-valorcy-badge'

type MadeInValorcyBadgeConfig = {
  websiteId: string
  projectId: string
  plan: string
  context?: MadeInValorcyBadgeContext
  pagePath?: string
}

type Props = {
  sections: SectionInstance[]
  designSystem?: BuilderDesignSystemState
  elementStyles?: Record<string, CSSProperties>
  elementAttributes?: Record<string, ElementChromeAttributes>
  injectedChildren?: Record<string, ComponentNode[]>
  projectLogoUrl?: string | null
  projectName?: string | null
  /** Active locale for content resolution + `dir` attribute. Defaults to `'en'`. */
  locale?: string
  /** Base/default locale that `props` is written in. Defaults to `'en'`. */
  defaultLocale?: string
  /** All locales the project supports. Used by the navbar language switcher. */
  supportedLocales?: string[]
  /** System UI — not part of page JSON. Used for preview/builder surfaces. */
  madeInValorcyBadge?: MadeInValorcyBadgeConfig | null
  /** Published/preview site id — enables live contact-form submissions. */
  websiteId?: string | null
  /** Storefront slug — lets shared chrome bind cart/account to the store. */
  siteSlug?: string | null
  /** Whether the visitor has a shopper session. */
  isSignedIn?: boolean
  /** Resolved website-auth config + signed-in visitor; null when auth is off. */
  auth?: PublicAuthConfig | null
  /**
   * Makes the site root the target of the root layout's "Skip to content" link
   * (`#main-content`). Only for standalone public pages — inside the dashboard
   * shell that id already belongs to the shell's <main>.
   */
  isSkipTarget?: boolean
}

export function PublicSectionsRenderer ({
  sections,
  designSystem,
  elementStyles,
  elementAttributes,
  injectedChildren,
  projectLogoUrl = null,
  projectName = null,
  locale = DEFAULT_LOCALE,
  defaultLocale = DEFAULT_LOCALE,
  supportedLocales,
  madeInValorcyBadge = null,
  websiteId = null,
  siteSlug = null,
  isSignedIn = false,
  auth = null,
  isSkipTarget = false,
}: Props) {
  const resolvedSupportedLocales = supportedLocales ?? [defaultLocale]
  const ds = (designSystem ?? DEFAULT_DESIGN_SYSTEM) as DesignSystem
  const dir = localeDirection(locale)
  const publicSections = normalizeSectionsForPublic(sections, locale, defaultLocale)
  const themeCss = designSystemToThemeCss(ds)
  const fontsHref = designSystemFontsHref(ds)

  // When a page carries only chrome (navbar/footer) and no body content, push the
  // footer to the bottom of the viewport so it isn't stacked under the navbar.
  const bodyIsEmpty =
    publicSections.length > 0 &&
    publicSections.every(
      (s) => s.sectionId.startsWith('navbar-') || s.sectionId.startsWith('footer-')
    )
  const firstFooterIndex = publicSections.findIndex((s) => s.sectionId.startsWith('footer-'))

  const elementStyleRules = buildPublicElementStyleRules(elementStyles, elementAttributes)

  return (
    <PublicSiteProvider
      designSystem={ds}
      sections={publicSections}
      projectLogoUrl={projectLogoUrl}
      projectName={projectName}
      websiteId={websiteId}
      siteSlug={siteSlug}
      isSignedIn={isSignedIn}
      auth={auth}
      supportedLocales={resolvedSupportedLocales}
      defaultLocale={defaultLocale}
    >
      <div
        dir={dir}
        {...(isSkipTarget ? { id: 'main-content', tabIndex: -1 } : {})}
        className={`flex min-h-dvh w-full flex-col bg-background text-foreground outline-none ${SITE_THEME_ROOT_CLASS}`}
      >
        {fontsHref ? <link rel="stylesheet" href={fontsHref} /> : null}
        {themeCss ? <style>{themeCss}</style> : null}
        {ds.customCss ? <style>{ds.customCss}</style> : null}
        {elementStyleRules ? <style>{elementStyleRules}</style> : null}
        {injectedChildren ? (
          <InjectedChildrenPublicLayer
            injectedChildren={injectedChildren}
            elementAttributes={elementAttributes}
          />
        ) : null}
        {publicSections.map((instance, index) => {
          const def = sectionRegistry.get(instance.sectionId)
          const C = def?.Component
          const hasTree = !!instance.componentTree && instance.componentTree.length > 0
          const pagination = instance.props._pagination as SectionPaginationMeta | undefined
          // A section with a componentTree must still render its content even
          // if the definition is missing from the registry (registry drift).
          if (!C && !hasTree) return null
          return (
            <Fragment key={instance.id}>
              {bodyIsEmpty && index === firstFooterIndex && (
                <div className="flex-1" aria-hidden />
              )}
              {/* data-section-instance-id OUTSIDE AnimationWrapper so the CSS
                  :nth-of-type selectors start from the same DOM depth as the
                  canvas instrumentation (sectionContentRef wraps AnimationWrapper). */}
              {/* The instance id is the section's anchor: navbar/CTA links
                  (`#pricing`) and the builder link picker's section anchors
                  resolve to it. scroll-mt keeps targets clear of sticky navbars. */}
              <div
                id={instance.id}
                className="scroll-mt-20"
                data-section-instance-id={instance.id}
                data-no-instrument
              >
                <AnimationWrapper animation={instance.animation} sectionId={instance.id}>
                  {C ? <C instance={instance} isPreview /> : null}
                  {/* A section that owns its tree (the auth gate) renders it
                      itself; a second copy here would bypass the gate. */}
                  {hasTree && !def?.ownsComponentTree ? (
                    <CustomSectionSurface instanceId={instance.id}>
                      <StaticComponentTreeRenderer
                        sectionId={instance.id}
                        tree={instance.componentTree ?? []}
                        isPreview
                        elementAttributes={elementAttributes}
                      />
                    </CustomSectionSurface>
                  ) : null}
                </AnimationWrapper>
                {pagination ? (
                  <Suspense fallback={null}>
                    <CmsPagination meta={pagination} />
                  </Suspense>
                ) : null}
              </div>
            </Fragment>
          )
        })}
        {madeInValorcyBadge ? (
          <MadeInValorcyBadge
            websiteId={madeInValorcyBadge.websiteId}
            projectId={madeInValorcyBadge.projectId}
            plan={madeInValorcyBadge.plan}
            context={madeInValorcyBadge.context ?? 'preview'}
            pagePath={madeInValorcyBadge.pagePath}
          />
        ) : null}
      </div>
    </PublicSiteProvider>
  )
}
