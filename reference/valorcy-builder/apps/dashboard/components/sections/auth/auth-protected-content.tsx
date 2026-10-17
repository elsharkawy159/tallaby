'use client'

import Link from 'next/link'
import { Lock } from 'lucide-react'

import { defineSection } from '@/components/sections/define-section'
import type { SectionComponentProps } from '@/components/sections/registry.types'
import { SectionContainer } from '@/components/sections/section-container'
import { useSectionSurface } from '@/components/sections/shared'
import { AuthEditable, propBool, propText } from '@/components/auth-blocks/auth-editable'
import { AuthPreviewNotice } from '@/components/auth-blocks/auth-primitives'
import { useReturnPath, useSiteAuth } from '@/components/auth-blocks/use-site-auth'
import { StaticComponentTreeRenderer } from '@/components/website-builder/component-tree-renderer'
import { usePublicSiteContext } from '@/components/website-builder/public-site-context'
import type { ComponentNode } from '@/lib/builder/component-node'

/* ─── Protected content block ──────────────────────────────────────────────
   A members-only region inside an otherwise public page. Anything the owner
   drops inside it renders only for signed-in visitors; everyone else sees the
   configurable gate with a return-to sign-in link.

   For a whole page, use Pages → Protected instead — that redirects before any
   content is sent, which is stronger than hiding it client-side.
   ────────────────────────────────────────────────────────────────────────── */

function AuthProtectedContent ({ instance, isPreview }: SectionComponentProps) {
  const { rootStyle } = useSectionSurface({ instanceId: instance.id })
  const auth = useSiteAuth()
  const returnPath = useReturnPath()

  const heading = propText(instance, 'heading', 'Members only')
  const body = propText(
    instance,
    'body',
    'Sign in to unlock this content.',
  )
  const signInLabel = propText(instance, 'signInLabel', 'Sign in')
  const registerLabel = propText(instance, 'registerLabel', 'Create an account')
  const showRegisterLink = propBool(instance, 'showRegisterLink', true)
  const showLockIcon = propBool(instance, 'showLockIcon', true)

  const children = (instance.componentTree ?? []) as ComponentNode[]
  // In the builder the canvas renders the editable tree below this section, so
  // drawing a static copy here as well would show the content twice.
  const inBuilder = usePublicSiteContext() === null
  const signedIn = Boolean(auth.config.user)

  // The gate is enforced only when it can actually be satisfied:
  //  - in the builder the owner must always see and edit what is protected;
  //  - on a live site with authentication switched off there is no way to sign
  //    in, so gating would make the content permanently unreachable. Falling
  //    open matches `requireAuthForPage`, which treats a protected PAGE as
  //    public while the master switch is off.
  const unlocked = signedIn || !auth.isLive || !auth.config.enabled

  // The canvas already shows the editable tree; nothing to add here.
  if (unlocked && inBuilder && children.length > 0) return null

  if (unlocked) {
    return (
      <section className="bg-background" style={rootStyle}>
        <SectionContainer>
          {children.length > 0 ? (
            <StaticComponentTreeRenderer
              sectionId={instance.id}
              tree={children}
              isPreview={isPreview}
            />
          ) : (
            <div className="rounded-[calc(var(--radius,0.5rem)*1.5)] border border-dashed border-border px-6 py-12 text-center">
              <p className="text-sm text-muted-foreground">
                Drop the content you want to protect into this block.
              </p>
              {!auth.isLive ? (
                <AuthPreviewNotice>
                  Visitors who are not signed in will see the gate instead.
                </AuthPreviewNotice>
              ) : null}
            </div>
          )}
        </SectionContainer>
      </section>
    )
  }

  return (
    <section className="bg-background" style={rootStyle}>
      <SectionContainer>
        <div className="mx-auto max-w-lg rounded-[calc(var(--radius,0.5rem)*2)] border border-border bg-card p-9 text-center">
          {showLockIcon ? (
            <span className="mx-auto mb-5 flex text-foreground">
              <Lock className="h-5 w-5 text-primary" aria-hidden />
            </span>
          ) : null}

          <h2 className="text-xl font-semibold tracking-[-0.02em] text-foreground">
            <AuthEditable
              instance={instance}
              propKey="heading"
              value={heading}
              isPreview={isPreview}
            />
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            <AuthEditable
              instance={instance}
              propKey="body"
              value={body}
              isPreview={isPreview}
            />
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              href={auth.loginHref(returnPath)}
              className="inline-flex items-center justify-center rounded-[var(--radius,0.5rem)] bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
            >
              {signInLabel}
            </Link>
            {showRegisterLink && auth.config.allowRegistration ? (
              <Link
                href={auth.href(auth.config.paths.registerPath)}
                className="inline-flex items-center justify-center rounded-[var(--radius,0.5rem)] border border-border px-5 py-2.5 text-sm font-medium text-foreground hover:bg-muted/60"
              >
                {registerLabel}
              </Link>
            ) : null}
          </div>
        </div>
      </SectionContainer>
    </section>
  )
}

export const authProtectedContentSection = defineSection({
  id: 'auth-protected-content',
  ownsComponentTree: true,
  displayName: 'Protected content',
  description:
    'Wraps a members-only region of a public page. Signed-in visitors see the content; everyone else gets a sign-in gate that returns them here afterwards.',
  category: 'auth',
  layoutArchetype: 'full-bleed',
  industries: ['generic', 'saas', 'education', 'fitness', 'medical', 'ecommerce'],
  styles: ['modern', 'minimal'],
  goals: ['conversion', 'engagement'],
  complexity: 'medium',
  density: 'low',
  imageRequired: false,
  mobileScore: 98,
  editable: true,
  editableElements: ['heading', 'body'],
  aiKeywords: ['members only', 'gated content', 'paywall', 'protected', 'restricted'],
  version: 1,
  defaultProps: {
    heading: 'Members only',
    body: 'Sign in to unlock this content.',
    signInLabel: 'Sign in',
    registerLabel: 'Create an account',
    showRegisterLink: true,
    showLockIcon: true,
  },
  propDefinitions: [
    { key: 'heading', label: 'Gate heading', type: 'text', canonical: 'headline' },
    { key: 'body', label: 'Gate message', type: 'textarea', canonical: 'body' },
    { key: 'signInLabel', label: 'Sign-in button', type: 'text', canonical: 'ctaPrimary' },
    { key: 'registerLabel', label: 'Register button', type: 'text', canonical: 'ctaSecondary' },
    { key: 'showRegisterLink', label: 'Show register button', type: 'switch' },
    { key: 'showLockIcon', label: 'Show lock icon', type: 'switch' },
  ],
  Component: AuthProtectedContent,
})
