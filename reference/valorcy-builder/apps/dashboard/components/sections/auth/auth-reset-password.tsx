'use client'

import type { FormEvent } from 'react'
import { useState } from 'react'

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
  CARD_HEADING_CLASS,
  CARD_SUBHEADING_CLASS,
  authText,
  drawnElsewhere,
  headingBlock,
  noteBlock,
  subheadingBlock,
} from '@/components/sections/auth/auth-parts'

/* ─── Reset password block ─────────────────────────────────────────────────
   Lands from the emailed recovery link. The auth callback has already exchanged
   the code for a recovery session by the time this renders, so all the block
   does is collect and confirm the new password.

   Slot-driven: heading and subheading are blocks in the `card` slot; the
   new-password form (with its mismatch check) is the `submitLabel` override.
   ────────────────────────────────────────────────────────────────────────── */

function AuthResetPassword ({ instance, isPreview, definition }: SectionComponentProps) {
  const { rootStyle } = useSectionSurface({ instanceId: instance.id })
  const auth = useSiteAuth()
  const { config } = auth

  // Live site with the master switch off: render an honest placeholder rather
  // than a form whose submit can only ever be rejected server-side.
  const authOff = auth.isLive && !config.enabled
  const [mismatch, setMismatch] = useState(false)

  const passwordLabel = propText(instance, 'passwordLabel', 'New password')
  const confirmLabel = propText(instance, 'confirmLabel', 'Confirm password')
  const submitLabel = propText(instance, 'submitLabel', 'Update password')
  const mismatchMessage = propText(instance, 'mismatchMessage', 'Those passwords do not match.')

  async function onSubmit (event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!auth.isLive) return
    const form = new FormData(event.currentTarget)
    const password = String(form.get('password') ?? '')
    const confirm = String(form.get('confirmPassword') ?? '')
    if (password !== confirm) {
      setMismatch(true)
      return
    }
    setMismatch(false)
    await auth.setPassword(password)
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
              heading: authText('heading', 'Choose a new password', {
                as: 'h1',
                className: CARD_HEADING_CLASS,
                isPreview,
              }),
              subheading: authText('subheading', 'Pick something you have not used before.', {
                className: CARD_SUBHEADING_CLASS,
                isPreview,
              }),
              submitLabel: () => (
                <div className={CARD_BODY_CLASS}>
                  <AuthFeedback
                    status={mismatch ? 'error' : auth.status}
                    error={mismatch ? mismatchMessage : auth.error}
                    message={auth.message}
                  />

                  <form onSubmit={onSubmit} className="grid gap-4">
                    <AuthField
                      label={passwordLabel}
                      name="password"
                      type="password"
                      autoComplete="new-password"
                      placeholder="••••••••"
                      required
                    />
                    <AuthField
                      label={confirmLabel}
                      name="confirmPassword"
                      type="password"
                      autoComplete="new-password"
                      placeholder="••••••••"
                      required
                    />
                    <AuthSubmit label={submitLabel} status={auth.status} disabled={!auth.isLive} />
                  </form>

                  {!auth.isLive ? (
                    <AuthPreviewNotice>
                      This block activates when a visitor arrives from a reset email.
                    </AuthPreviewNotice>
                  ) : null}
                </div>
              ),
              passwordLabel: drawnElsewhere,
              confirmLabel: drawnElsewhere,
              mismatchMessage: drawnElsewhere,
            }}
          />
        </AuthCardFrame>
      </AuthSectionShell>
    </section>
  )
}

export const authResetPasswordSection = defineSection({
  id: 'auth-reset-password',
  displayName: 'New Password',
  description:
    'Completes a password reset for a visitor arriving from the recovery email, with confirmation matching.',
  category: 'auth',
  detachable: false,
  layoutArchetype: 'floating',
  industries: ['generic', 'saas', 'ecommerce', 'education', 'fitness', 'medical'],
  styles: ['minimal', 'modern'],
  goals: ['support'],
  complexity: 'low',
  density: 'low',
  imageRequired: false,
  mobileScore: 99,
  editable: true,
  aiKeywords: ['reset password', 'new password', 'change password'],
  version: 1,
  defaultOptions: { align: 'center', paddingY: 'lg' },
  schema: {
    slots: [{ id: 'card', label: 'New-password card', isDefault: true }],
    blocks: [
      headingBlock(1),
      subheadingBlock(),
      noteBlock('submitLabel', 'Submit button', { canonical: 'ctaPrimary', maxLength: 30 }, 'New-password form'),
      noteBlock('passwordLabel', 'Password label'),
      noteBlock('confirmLabel', 'Confirm label'),
      noteBlock('mismatchMessage', 'Mismatch message'),
    ],
  },
  defaultProps: {
    heading: 'Choose a new password',
    subheading: 'Pick something you have not used before.',
    passwordLabel: 'New password',
    confirmLabel: 'Confirm password',
    submitLabel: 'Update password',
    mismatchMessage: 'Those passwords do not match.',
  },
  Component: AuthResetPassword,
})
