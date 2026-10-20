'use client'

import Link from 'next/link'
import type { FormEvent } from 'react'

import { defineSection } from '@/components/sections/define-section'
import type { SectionComponentProps } from '@/components/sections/registry.types'
import { SectionSlot } from '@/components/sections/_primitives/section-slot'
import { useSectionSurface } from '@/components/sections/shared'
import { propText } from '@/components/auth-blocks/auth-editable'
import {
  AuthDisabledState,
  AuthFeedback,
  AuthField,
  AuthPreviewNotice,
  AuthSectionShell,
  AuthSubmit,
} from '@/components/auth-blocks/auth-primitives'
import { useSiteAuth } from '@/components/auth-blocks/use-site-auth'
import {
  AuthCardFrame,
  CARD_BODY_CLASS,
  CARD_FOOTER_CLASS,
  CARD_HEADING_CLASS,
  CARD_SUBHEADING_CLASS,
  authText,
  drawnElsewhere,
  headingBlock,
  noteBlock,
  subheadingBlock,
} from '@/components/sections/auth/auth-parts'

/* ─── Forgot password block ────────────────────────────────────────────────
   Requests a reset link. The response is intentionally identical whether or not
   the address exists, so the form cannot be used to enumerate accounts.

   Slot-driven: heading, subheading and the back link are blocks in the `card`
   slot; the request form is the `submitLabel` block's override.
   ────────────────────────────────────────────────────────────────────────── */

function AuthForgotPassword ({ instance, isPreview, definition }: SectionComponentProps) {
  const { rootStyle } = useSectionSurface({ instanceId: instance.id })
  const auth = useSiteAuth()
  const { config } = auth

  // Live site with the master switch off: render an honest placeholder rather
  // than a form whose submit can only ever be rejected server-side.
  const authOff = auth.isLive && !config.enabled

  const emailLabel = propText(instance, 'emailLabel', 'Email')
  const submitLabel = propText(instance, 'submitLabel', 'Send reset link')
  const backLabel = propText(instance, 'backLabel', 'Back to sign in')

  async function onSubmit (event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!auth.isLive) return
    const form = new FormData(event.currentTarget)
    await auth.requestReset(String(form.get('email') ?? ''))
  }

  if (authOff) {
    return (
      <section className="bg-background" style={rootStyle}>
        <AuthDisabledState title="Reset your password" />
      </section>
    )
  }

  return (
    <section className="bg-background" style={rootStyle}>
      <AuthSectionShell>
        <AuthCardFrame logoUrl={config.branding.logoUrl}>
          <SectionSlot
            instance={instance}
            definition={definition}
            isPreview={isPreview}
            slotId="card"
            overrides={{
              heading: authText('heading', 'Reset your password', {
                as: 'h1',
                className: CARD_HEADING_CLASS,
                isPreview,
              }),
              subheading: authText(
                'subheading',
                "Enter your email and we'll send you a link to choose a new password.",
                { className: CARD_SUBHEADING_CLASS, isPreview },
              ),
              submitLabel: () => (
                <div className={CARD_BODY_CLASS}>
                  <AuthFeedback status={auth.status} error={auth.error} message={auth.message} />

                  <form onSubmit={onSubmit} className="grid gap-4">
                    <AuthField
                      label={emailLabel}
                      name="email"
                      type="email"
                      autoComplete="email"
                      placeholder="you@example.com"
                      required
                    />
                    <AuthSubmit label={submitLabel} status={auth.status} disabled={!auth.isLive} />
                  </form>

                  {!auth.isLive ? (
                    <AuthPreviewNotice>
                      Reset emails are sent from the published site.
                    </AuthPreviewNotice>
                  ) : null}
                </div>
              ),
              emailLabel: drawnElsewhere,
              // The card footer: a link back to the sign-in page.
              backLabel: () => (
                <div className={CARD_FOOTER_CLASS}>
                  <Link
                    href={auth.href(config.paths.loginPath)}
                    className="font-semibold text-primary hover:underline"
                  >
                    {backLabel}
                  </Link>
                </div>
              ),
            }}
          />
        </AuthCardFrame>
      </AuthSectionShell>
    </section>
  )
}

export const authForgotPasswordSection = defineSection({
  id: 'auth-forgot-password',
  displayName: 'Password Recovery',
  description:
    'Requests a password-reset email, responding identically for known and unknown addresses so accounts cannot be enumerated.',
  category: 'auth',
  detachable: false,
  layoutArchetype: 'minimal',
  industries: ['generic', 'saas', 'ecommerce', 'education', 'fitness', 'medical'],
  styles: ['minimal', 'modern'],
  goals: ['support'],
  complexity: 'low',
  density: 'low',
  imageRequired: false,
  mobileScore: 99,
  editable: true,
  aiKeywords: ['forgot password', 'reset password', 'recover account'],
  version: 1,
  defaultOptions: { align: 'center', paddingY: 'lg' },
  schema: {
    slots: [{ id: 'card', label: 'Recovery card', isDefault: true }],
    blocks: [
      headingBlock(1),
      subheadingBlock(),
      noteBlock('submitLabel', 'Submit button', { canonical: 'ctaPrimary', maxLength: 30 }, 'Reset request form'),
      noteBlock('emailLabel', 'Email label'),
      noteBlock('backLabel', 'Back link'),
    ],
  },
  defaultProps: {
    heading: 'Reset your password',
    subheading: "Enter your email and we'll send you a link to choose a new password.",
    emailLabel: 'Email',
    submitLabel: 'Send reset link',
    backLabel: 'Back to sign in',
  },
  Component: AuthForgotPassword,
})
