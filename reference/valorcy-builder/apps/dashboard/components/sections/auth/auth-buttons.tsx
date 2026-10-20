'use client'

import Link from 'next/link'
import { LogIn, LogOut } from 'lucide-react'

import { defineSection } from '@/components/sections/define-section'
import type { SectionComponentProps } from '@/components/sections/registry.types'
import { SectionSlot } from '@/components/sections/_primitives/section-slot'
import { useSectionSurface } from '@/components/sections/shared'
import { AuthEditable, propBool, propText } from '@/components/auth-blocks/auth-editable'
import { useReturnPath, useSiteAuth } from '@/components/auth-blocks/use-site-auth'
import { cn } from '@/lib/utils'
import {
  BUTTON_ALIGN_SETTING,
  BUTTON_VARIANT_SETTING,
  drawnElsewhere,
  noteBlock,
  switchSetting,
} from '@/components/sections/auth/auth-parts'

/* ─── Login / Logout buttons ───────────────────────────────────────────────
   Small, droppable auth controls for headers, hero bands and CTA rows. Both
   are state-aware: the login button hides itself once the visitor is signed in
   (and vice-versa), so a page can carry both and always show the right one.

   Slot-driven: the button row is one slot (`row`) and the session-aware button
   is the `label` block's override, so elements dropped beside it sit in the
   same row. Style, alignment and visibility rules are section settings.
   ────────────────────────────────────────────────────────────────────────── */

const ALIGNMENTS: Record<string, string> = {
  start: 'justify-start',
  center: 'justify-center',
  end: 'justify-end',
}

const VARIANTS: Record<string, string> = {
  primary:
    'bg-primary text-primary-foreground hover:opacity-90 border border-transparent',
  outline: 'border border-border bg-background text-foreground hover:bg-muted/60',
  ghost: 'border border-transparent text-foreground hover:bg-muted/60',
}

function useButtonChrome (instance: SectionComponentProps['instance']) {
  const align = ALIGNMENTS[propText(instance, 'align', 'center')] ?? ALIGNMENTS.center
  const variant = VARIANTS[propText(instance, 'variant', 'primary')] ?? VARIANTS.primary
  const showIcon = propBool(instance, 'showIcon', true)
  return { align, variant, showIcon }
}

const BUTTON_BASE =
  'inline-flex items-center gap-2 rounded-[var(--radius,0.5rem)] px-5 py-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60'

// ── Login button ────────────────────────────────────────────────────────────

function AuthLoginButton ({ instance, isPreview, definition }: SectionComponentProps) {
  const { rootStyle } = useSectionSurface({ instanceId: instance.id })
  const auth = useSiteAuth()
  const { align, variant, showIcon } = useButtonChrome(instance)
  const returnPath = useReturnPath()

  const label = propText(instance, 'label', 'Sign in')
  const signedInLabel = propText(instance, 'signedInLabel', 'My account')
  const hideWhenSignedIn = propBool(instance, 'hideWhenSignedIn', false)
  const signedIn = Boolean(auth.config.user)

  // Auth off on a live site ⇒ the link would lead to a dead sign-in page.
  if (auth.isLive && !auth.config.enabled) return null
  if (signedIn && hideWhenSignedIn) return null

  const href = signedIn
    ? auth.href(auth.config.paths.accountPath)
    : auth.loginHref(returnPath)

  return (
    <section className="bg-background" style={rootStyle}>
      <SectionSlot
        instance={instance}
        definition={definition}
        isPreview={isPreview}
        slotId="row"
        className={cn('flex w-full px-5 py-6', align)}
        overrides={{
          label: () => (
            <Link href={href} className={cn(BUTTON_BASE, variant)}>
              {showIcon ? <LogIn className="h-4 w-4" aria-hidden /> : null}
              {signedIn ? (
                signedInLabel
              ) : (
                <AuthEditable
                  instance={instance}
                  propKey="label"
                  value={label}
                  isPreview={isPreview}
                />
              )}
            </Link>
          ),
          signedInLabel: drawnElsewhere,
        }}
      />
    </section>
  )
}

export const authLoginButtonSection = defineSection({
  id: 'auth-login-button',
  displayName: 'Access Button',
  description:
    'A single sign-in call to action that becomes an account link once the visitor is signed in, returning them to the page they started on.',
  category: 'auth',
  detachable: false,
  layoutArchetype: 'banner',
  industries: ['generic', 'saas', 'ecommerce', 'education', 'fitness', 'medical'],
  styles: ['modern', 'minimal'],
  goals: ['conversion', 'engagement'],
  complexity: 'low',
  density: 'low',
  imageRequired: false,
  mobileScore: 100,
  editable: true,
  aiKeywords: ['sign in button', 'login button', 'account link'],
  version: 1,
  defaultOptions: { align: 'center', paddingY: 'sm' },
  schema: {
    slots: [{ id: 'row', label: 'Button row', isDefault: true }],
    blocks: [
      noteBlock('label', 'Label', { canonical: 'ctaPrimary', maxLength: 30 }, 'Sign-in button'),
      noteBlock('signedInLabel', 'Signed-in label', { maxLength: 30 }),
    ],
    settings: [
      BUTTON_ALIGN_SETTING,
      BUTTON_VARIANT_SETTING,
      switchSetting('showIcon', 'Show icon'),
      switchSetting('hideWhenSignedIn', 'Hide when signed in'),
    ],
  },
  defaultProps: {
    label: 'Sign in',
    signedInLabel: 'My account',
    align: 'center',
    variant: 'primary',
    showIcon: true,
    hideWhenSignedIn: false,
  },
  Component: AuthLoginButton,
})

// ── Logout button ───────────────────────────────────────────────────────────

function AuthLogoutButton ({ instance, isPreview, definition }: SectionComponentProps) {
  const { rootStyle } = useSectionSurface({ instanceId: instance.id })
  const auth = useSiteAuth()
  const { align, variant, showIcon } = useButtonChrome(instance)

  const label = propText(instance, 'label', 'Sign out')
  const hideWhenSignedOut = propBool(instance, 'hideWhenSignedOut', true)
  const signedIn = Boolean(auth.config.user)

  // In the builder there is no visitor, so keep the block visible to be edited.
  if (auth.isLive && !auth.config.enabled) return null
  if (!signedIn && hideWhenSignedOut && auth.isLive) return null

  return (
    <section className="bg-background" style={rootStyle}>
      <SectionSlot
        instance={instance}
        definition={definition}
        isPreview={isPreview}
        slotId="row"
        className={cn('flex w-full px-5 py-6', align)}
        overrides={{
          label: () => (
            <button
              type="button"
              onClick={() => void auth.logout()}
              disabled={!auth.isLive || auth.status === 'submitting'}
              className={cn(BUTTON_BASE, variant)}
            >
              {showIcon ? <LogOut className="h-4 w-4" aria-hidden /> : null}
              <AuthEditable
                instance={instance}
                propKey="label"
                value={label}
                isPreview={isPreview}
              />
            </button>
          ),
        }}
      />
    </section>
  )
}

export const authLogoutButtonSection = defineSection({
  id: 'auth-logout-button',
  displayName: 'Sign-out Button',
  description:
    'Ends the visitor session and returns them to the page configured in Settings → Authentication; hidden from guests by default.',
  category: 'auth',
  detachable: false,
  layoutArchetype: 'strip',
  industries: ['generic', 'saas', 'ecommerce', 'education', 'fitness', 'medical'],
  styles: ['modern', 'minimal'],
  goals: ['support'],
  complexity: 'low',
  density: 'low',
  imageRequired: false,
  mobileScore: 100,
  editable: true,
  aiKeywords: ['sign out', 'log out', 'logout button'],
  version: 1,
  defaultOptions: { align: 'center', paddingY: 'sm' },
  schema: {
    slots: [{ id: 'row', label: 'Button row', isDefault: true }],
    blocks: [
      noteBlock('label', 'Label', { canonical: 'ctaPrimary', maxLength: 30 }, 'Sign-out button'),
    ],
    settings: [
      BUTTON_ALIGN_SETTING,
      BUTTON_VARIANT_SETTING,
      switchSetting('showIcon', 'Show icon'),
      switchSetting('hideWhenSignedOut', 'Hide from signed-out visitors'),
    ],
  },
  defaultProps: {
    label: 'Sign out',
    align: 'center',
    variant: 'outline',
    showIcon: true,
    hideWhenSignedOut: true,
  },
  Component: AuthLogoutButton,
})
