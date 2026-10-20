'use client'

import Link from 'next/link'
import type { FormEvent } from 'react'

import { defineSection } from '@/components/sections/define-section'
import type { SectionComponentProps } from '@/components/sections/registry.types'
import { SectionSlot } from '@/components/sections/_primitives/section-slot'
import { useSectionSurface } from '@/components/sections/shared'
import { AuthEditable, propBool, propText } from '@/components/auth-blocks/auth-editable'
import {
  AuthDisabledState,
  AuthDivider,
  AuthFeedback,
  AuthField,
  AuthPreviewNotice,
  AuthProviderButtons,
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
  switchSetting,
} from '@/components/sections/auth/auth-parts'

/* ─── Register block ───────────────────────────────────────────────────────
   Account creation with optional social providers and a terms/privacy consent
   line. Honours the site's "Enable registration" switch: when the owner closes
   sign-ups the block explains that instead of collecting details it cannot use.

   Slot-driven: the card body is one slot (`card`). The heading, subheading and
   footer prompt are blocks; the registration widget (closed notice, providers,
   fields, submit, consent line) is the `submitLabel` block's override.
   ────────────────────────────────────────────────────────────────────────── */

function AuthRegister ({ instance, isPreview, definition }: SectionComponentProps) {
  const { rootStyle } = useSectionSurface({ instanceId: instance.id })
  const auth = useSiteAuth()
  const { config } = auth

  // Live site with the master switch off: render an honest placeholder rather
  // than a form whose submit can only ever be rejected server-side.
  const authOff = auth.isLive && !config.enabled

  const headingFallback = config.branding.registerHeading ?? 'Create your account'
  const subheadingFallback = config.branding.registerSubheading ?? 'It only takes a minute.'
  const nameLabel = propText(instance, 'nameLabel', 'Full name')
  const emailLabel = propText(instance, 'emailLabel', 'Email')
  const passwordLabel = propText(instance, 'passwordLabel', 'Password')
  const passwordHint = propText(instance, 'passwordHint', 'At least 8 characters.')
  const submitLabel = propText(instance, 'submitLabel', 'Create account')
  const loginPrompt = propText(instance, 'loginPrompt', 'Already have an account?')
  const loginLabel = propText(instance, 'loginLabel', 'Sign in')
  const dividerLabel = propText(instance, 'dividerLabel', 'or')
  const consentText = propText(
    instance,
    'consentText',
    'By creating an account you agree to our terms and privacy policy.',
  )
  const closedMessage = propText(
    instance,
    'closedMessage',
    'New registrations are currently closed.',
  )
  const showSocial = propBool(instance, 'showSocial', true)
  const showName = propBool(instance, 'showName', true)
  const showLoginLink = propBool(instance, 'showLoginLink', true)

  const providers = showSocial ? config.providers : []
  const busy = auth.status === 'submitting'
  const registrationOpen = config.allowRegistration

  async function onSubmit (event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!auth.isLive) return
    const form = new FormData(event.currentTarget)
    await auth.register({
      email: String(form.get('email') ?? ''),
      password: String(form.get('password') ?? ''),
      fullName: String(form.get('fullName') ?? '') || undefined,
    })
  }

  if (authOff) {
    return (
      <section className="bg-background" style={rootStyle}>
        <AuthDisabledState title="Create an account" />
      </section>
    )
  }

  return (
    <section className="bg-background" style={rootStyle}>
      <AuthSectionShell>
        <AuthCardFrame
          logoUrl={config.branding.logoUrl}
          imageUrl={config.branding.imageUrl}
          layout={config.branding.layout ?? 'split'}
        >
          <SectionSlot
            instance={instance}
            definition={definition}
            isPreview={isPreview}
            slotId="card"
            overrides={{
              heading: authText('heading', headingFallback, {
                as: 'h1',
                className: CARD_HEADING_CLASS,
                isPreview,
              }),
              subheading: authText('subheading', subheadingFallback, {
                className: CARD_SUBHEADING_CLASS,
                isPreview,
              }),
              submitLabel: () => (
                <div className={CARD_BODY_CLASS}>
                  <AuthFeedback status={auth.status} error={auth.error} message={auth.message} />

                  {!registrationOpen ? (
                    <p className="rounded-[var(--radius,0.5rem)] border border-border bg-muted/50 px-3 py-3 text-sm text-muted-foreground">
                      <AuthEditable
                        instance={instance}
                        propKey="closedMessage"
                        value={closedMessage}
                        isPreview={isPreview}
                      />
                    </p>
                  ) : (
                    <>
                      {providers.length > 0 ? (
                        <>
                          <AuthProviderButtons
                            providers={providers}
                            disabled={busy || !auth.isLive}
                            onSelect={(provider) => void auth.oauth(provider)}
                            labelPrefix="Sign up with"
                          />
                          {config.emailPasswordEnabled ? <AuthDivider label={dividerLabel} /> : null}
                        </>
                      ) : null}

                      {config.emailPasswordEnabled ? (
                        <form onSubmit={onSubmit} className="grid gap-4">
                          {showName ? (
                            <AuthField
                              label={nameLabel}
                              name="fullName"
                              autoComplete="name"
                              placeholder="Maya Okonkwo"
                            />
                          ) : null}
                          <AuthField
                            label={emailLabel}
                            name="email"
                            type="email"
                            autoComplete="email"
                            placeholder="you@example.com"
                            required
                          />
                          <div>
                            <AuthField
                              label={passwordLabel}
                              name="password"
                              type="password"
                              autoComplete="new-password"
                              placeholder="••••••••"
                              required
                            />
                            <p className="mt-1.5 text-xs text-muted-foreground">{passwordHint}</p>
                          </div>

                          <AuthSubmit
                            label={submitLabel}
                            status={auth.status}
                            disabled={!auth.isLive}
                          />

                          <p className="text-center text-xs leading-relaxed text-muted-foreground">
                            <AuthEditable
                              instance={instance}
                              propKey="consentText"
                              value={consentText}
                              isPreview={isPreview}
                            />
                            {config.branding.termsUrl ? (
                              <>
                                {' '}
                                <a
                                  href={config.branding.termsUrl}
                                  className="underline hover:text-foreground"
                                >
                                  Terms
                                </a>
                              </>
                            ) : null}
                            {config.branding.privacyUrl ? (
                              <>
                                {' · '}
                                <a
                                  href={config.branding.privacyUrl}
                                  className="underline hover:text-foreground"
                                >
                                  Privacy
                                </a>
                              </>
                            ) : null}
                          </p>
                        </form>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          Email sign-up is disabled for this site.
                        </p>
                      )}
                    </>
                  )}

                  {!auth.isLive ? (
                    <AuthPreviewNotice>
                      Registration runs on the published site.
                    </AuthPreviewNotice>
                  ) : null}
                </div>
              ),
              nameLabel: drawnElsewhere,
              emailLabel: drawnElsewhere,
              passwordLabel: drawnElsewhere,
              passwordHint: drawnElsewhere,
              dividerLabel: drawnElsewhere,
              consentText: drawnElsewhere,
              closedMessage: drawnElsewhere,
              // Prompt + link are the card footer.
              loginPrompt: () =>
                showLoginLink ? (
                  <div className={CARD_FOOTER_CLASS}>
                    <AuthEditable
                      instance={instance}
                      propKey="loginPrompt"
                      value={loginPrompt}
                      isPreview={isPreview}
                    />{' '}
                    <Link
                      href={auth.href(config.paths.loginPath)}
                      className="font-semibold text-primary hover:underline"
                    >
                      {loginLabel}
                    </Link>
                  </div>
                ) : null,
              loginLabel: drawnElsewhere,
            }}
          />
        </AuthCardFrame>
      </AuthSectionShell>
    </section>
  )
}

export const authRegisterSection = defineSection({
  id: 'auth-register',
  displayName: 'Enrollment',
  description:
    'Account-creation card with optional social providers, a name field and a consent line linking your terms and privacy policy.',
  category: 'auth',
  detachable: false,
  layoutArchetype: 'split',
  industries: ['generic', 'saas', 'ecommerce', 'education', 'fitness', 'medical'],
  styles: ['modern', 'minimal', 'corporate'],
  goals: ['conversion', 'engagement'],
  complexity: 'medium',
  density: 'low',
  imageRequired: false,
  mobileScore: 97,
  editable: true,
  aiKeywords: ['register', 'sign up', 'create account', 'join', 'membership'],
  version: 1,
  defaultOptions: { align: 'center', paddingY: 'lg' },
  schema: {
    slots: [{ id: 'card', label: 'Registration card', isDefault: true }],
    blocks: [
      headingBlock(1),
      subheadingBlock(),
      noteBlock('submitLabel', 'Submit button', { canonical: 'ctaPrimary', maxLength: 30 }, 'Registration form'),
      noteBlock('nameLabel', 'Name label'),
      noteBlock('emailLabel', 'Email label'),
      noteBlock('passwordLabel', 'Password label'),
      noteBlock('passwordHint', 'Password hint'),
      noteBlock('dividerLabel', 'Divider label'),
      noteBlock('consentText', 'Consent text', { type: 'textarea', maxLength: 200 }),
      noteBlock('closedMessage', 'Registration-closed message', { type: 'textarea', maxLength: 200 }),
      noteBlock('loginPrompt', 'Sign-in prompt'),
      noteBlock('loginLabel', 'Sign-in link'),
    ],
    settings: [
      switchSetting('showSocial', 'Show social sign-up'),
      switchSetting('showName', 'Ask for full name'),
      switchSetting('showLoginLink', 'Show sign-in link'),
    ],
  },
  defaultProps: {
    heading: 'Create your account',
    subheading: 'It only takes a minute.',
    nameLabel: 'Full name',
    emailLabel: 'Email',
    passwordLabel: 'Password',
    passwordHint: 'At least 8 characters.',
    submitLabel: 'Create account',
    loginPrompt: 'Already have an account?',
    loginLabel: 'Sign in',
    dividerLabel: 'or',
    consentText: 'By creating an account you agree to our terms and privacy policy.',
    closedMessage: 'New registrations are currently closed.',
    showSocial: true,
    showName: true,
    showLoginLink: true,
  },
  Component: AuthRegister,
})
