'use client'

import Link from 'next/link'
import type { FormEvent } from 'react'

import { defineSection } from '@/components/sections/define-section'
import type { SectionComponentProps } from '@/components/sections/registry.types'
import { SectionContainer } from '@/components/sections/section-container'
import { SectionSlot } from '@/components/sections/_primitives/section-slot'
import { useSectionSurface } from '@/components/sections/shared'
import { AuthEditable, propBool, propText } from '@/components/auth-blocks/auth-editable'
import {
  AuthDisabledState,
  AuthFeedback,
  AuthField,
  AuthPreviewNotice,
  AuthSubmit,
} from '@/components/auth-blocks/auth-primitives'
import { useSiteAuth } from '@/components/auth-blocks/use-site-auth'
import {
  authText,
  drawnElsewhere,
  headingBlock,
  noteBlock,
  subheadingBlock,
  switchSetting,
} from '@/components/sections/auth/auth-parts'

/* ─── Profile block ────────────────────────────────────────────────────────
   Lets a signed-in visitor edit their own details. Guests see a prompt to sign
   in rather than an empty form — the block is safe to drop on any page.

   Slot-driven: heading and subheading are blocks in the `copy` slot; the
   session-aware panel (sign-in prompt for guests, the profile form for members)
   is the `submitLabel` block's override.
   ────────────────────────────────────────────────────────────────────────── */

function AuthProfile ({ instance, isPreview, definition }: SectionComponentProps) {
  const { rootStyle } = useSectionSurface({ instanceId: instance.id })
  const auth = useSiteAuth()
  const { config } = auth

  // Live site with the master switch off: render an honest placeholder rather
  // than a form whose submit can only ever be rejected server-side.
  const authOff = auth.isLive && !config.enabled
  const user = config.user

  const nameLabel = propText(instance, 'nameLabel', 'Full name')
  const emailLabel = propText(instance, 'emailLabel', 'Email')
  const phoneLabel = propText(instance, 'phoneLabel', 'Phone')
  const submitLabel = propText(instance, 'submitLabel', 'Save changes')
  const signedOutText = propText(instance, 'signedOutText', 'Sign in to view your profile.')
  const signInLabel = propText(instance, 'signInLabel', 'Sign in')
  const showPhone = propBool(instance, 'showPhone', true)
  const showAvatar = propBool(instance, 'showAvatar', true)

  async function onSubmit (event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!auth.isLive) return
    const form = new FormData(event.currentTarget)
    await auth.updateProfile({
      fullName: String(form.get('fullName') ?? ''),
      phone: String(form.get('phone') ?? ''),
    })
  }

  if (authOff) {
    return (
      <section className="bg-background" style={rootStyle}>
        <AuthDisabledState title="Your profile" />
      </section>
    )
  }

  return (
    <section className="bg-background" style={rootStyle}>
      <SectionContainer>
        <SectionSlot
          instance={instance}
          definition={definition}
          isPreview={isPreview}
          slotId="copy"
          className="mx-auto w-full max-w-2xl"
          overrides={{
            heading: authText('heading', 'Your profile', {
              as: 'h2',
              className: 'text-3xl font-bold tracking-[-0.02em] text-foreground',
              isPreview,
            }),
            subheading: authText('subheading', 'Update the details we hold for you.', {
              className: 'mt-2 text-muted-foreground',
              isPreview,
            }),
            submitLabel: () =>
              !user ? (
                <div className="mt-8 rounded-[calc(var(--radius,0.5rem)*2)] border border-border bg-card p-8 text-center">
                  <p className="text-sm text-muted-foreground">
                    <AuthEditable
                      instance={instance}
                      propKey="signedOutText"
                      value={signedOutText}
                      isPreview={isPreview}
                    />
                  </p>
                  <Link
                    href={auth.loginHref()}
                    className="mt-4 inline-flex items-center justify-center rounded-[var(--radius,0.5rem)] bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
                  >
                    {signInLabel}
                  </Link>
                  {!auth.isLive ? (
                    <AuthPreviewNotice>
                      On the published site this shows the signed-in visitor&apos;s details.
                    </AuthPreviewNotice>
                  ) : null}
                </div>
              ) : (
                <div className="mt-8 rounded-[calc(var(--radius,0.5rem)*2)] border border-border bg-card p-7 sm:p-9">
                  <AuthFeedback status={auth.status} error={auth.error} message={auth.message} />

                  {showAvatar ? (
                    <div className="mb-7 flex items-center gap-4">
                      {user.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={user.avatarUrl}
                          alt=""
                          className="h-14 w-14 rounded-full object-cover"
                        />
                      ) : (
                        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-muted text-lg font-semibold text-foreground">
                          {(user.fullName ?? user.email).slice(0, 1).toUpperCase()}
                        </span>
                      )}
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-foreground">
                          {user.fullName ?? user.email}
                        </p>
                        <p className="truncate text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                  ) : null}

                  <form onSubmit={onSubmit} className="grid gap-4">
                    <AuthField
                      label={nameLabel}
                      name="fullName"
                      autoComplete="name"
                      defaultValue={user.fullName ?? ''}
                    />
                    <div>
                      <span className="mb-1.5 block text-[13px] font-medium text-foreground">
                        {emailLabel}
                      </span>
                      <input
                        value={user.email}
                        readOnly
                        disabled
                        className="w-full cursor-not-allowed rounded-[var(--radius,0.5rem)] border border-border bg-muted/50 px-3 py-2.5 text-sm text-muted-foreground"
                      />
                    </div>
                    {showPhone ? (
                      <AuthField
                        label={phoneLabel}
                        name="phone"
                        type="tel"
                        autoComplete="tel"
                        defaultValue={user.phone ?? ''}
                      />
                    ) : null}
                    <AuthSubmit label={submitLabel} status={auth.status} disabled={!auth.isLive} />
                  </form>
                </div>
              ),
            nameLabel: drawnElsewhere,
            emailLabel: drawnElsewhere,
            phoneLabel: drawnElsewhere,
            signedOutText: drawnElsewhere,
            signInLabel: drawnElsewhere,
          }}
        />
      </SectionContainer>
    </section>
  )
}

export const authProfileSection = defineSection({
  id: 'auth-profile',
  displayName: 'Member Profile',
  description:
    'Lets a signed-in visitor review and update their own name, phone and avatar; guests are prompted to sign in.',
  category: 'auth',
  detachable: false,
  layoutArchetype: 'editorial',
  industries: ['generic', 'saas', 'ecommerce', 'education', 'fitness', 'medical'],
  styles: ['modern', 'minimal'],
  goals: ['engagement', 'support'],
  complexity: 'medium',
  density: 'medium',
  imageRequired: false,
  mobileScore: 96,
  editable: true,
  aiKeywords: ['profile', 'my details', 'edit account', 'personal information'],
  version: 1,
  defaultOptions: { align: 'start', paddingY: 'lg' },
  schema: {
    slots: [{ id: 'copy', label: 'Profile', isDefault: true }],
    blocks: [
      headingBlock(2),
      subheadingBlock(),
      noteBlock('submitLabel', 'Submit button', { canonical: 'ctaPrimary', maxLength: 30 }, 'Profile panel'),
      noteBlock('nameLabel', 'Name label'),
      noteBlock('emailLabel', 'Email label'),
      noteBlock('phoneLabel', 'Phone label'),
      noteBlock('signedOutText', 'Signed-out message'),
      noteBlock('signInLabel', 'Sign-in button'),
    ],
    settings: [
      switchSetting('showPhone', 'Show phone field'),
      switchSetting('showAvatar', 'Show avatar'),
    ],
  },
  defaultProps: {
    heading: 'Your profile',
    subheading: 'Update the details we hold for you.',
    nameLabel: 'Full name',
    emailLabel: 'Email',
    phoneLabel: 'Phone',
    submitLabel: 'Save changes',
    signedOutText: 'Sign in to view your profile.',
    signInLabel: 'Sign in',
    showPhone: true,
    showAvatar: true,
  },
  Component: AuthProfile,
})
