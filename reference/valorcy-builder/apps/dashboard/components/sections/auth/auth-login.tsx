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

/* ─── Login block ──────────────────────────────────────────────────────────
   Email + password sign-in with optional social providers, "remember me" and
   links out to registration / password recovery. Every option follows the
   website's Authentication settings: providers the owner disabled never render,
   and the whole form is inert inside the builder canvas.

   Slot-driven: the card body is one slot (`card`). The heading, subheading and
   footer prompt are blocks; the sign-in widget itself (feedback, providers,
   fields, remember-me, submit) is the `submitLabel` block's override so it can
   never be pulled apart.
   ────────────────────────────────────────────────────────────────────────── */

function AuthLogin ({ instance, isPreview, definition }: SectionComponentProps) {
  const { rootStyle } = useSectionSurface({ instanceId: instance.id })
  const auth = useSiteAuth()
  const { config } = auth

  // Live site with the master switch off: render an honest placeholder rather
  // than a form whose submit can only ever be rejected server-side.
  const authOff = auth.isLive && !config.enabled

  const headingFallback = config.branding.loginHeading ?? 'Welcome back'
  const subheadingFallback =
    config.branding.loginSubheading ?? 'Sign in to continue to your account.'
  const emailLabel = propText(instance, 'emailLabel', 'Email')
  const passwordLabel = propText(instance, 'passwordLabel', 'Password')
  const submitLabel = propText(instance, 'submitLabel', 'Sign in')
  const rememberLabel = propText(instance, 'rememberLabel', 'Remember me')
  const forgotLabel = propText(instance, 'forgotLabel', 'Forgot password?')
  const registerPrompt = propText(instance, 'registerPrompt', "Don't have an account?")
  const registerLabel = propText(instance, 'registerLabel', 'Create one')
  const dividerLabel = propText(instance, 'dividerLabel', 'or')
  const showSocial = propBool(instance, 'showSocial', true)
  const showRemember = propBool(instance, 'showRemember', true)
  const showRegisterLink = propBool(instance, 'showRegisterLink', true)

  const providers = showSocial ? config.providers : []
  const busy = auth.status === 'submitting'

  async function onSubmit (event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!auth.isLive) return
    const form = new FormData(event.currentTarget)
    const next =
      typeof window !== 'undefined'
        ? new URLSearchParams(window.location.search).get('next') ?? undefined
        : undefined
    await auth.login({
      email: String(form.get('email') ?? ''),
      password: String(form.get('password') ?? ''),
      rememberMe: form.get('rememberMe') === 'on',
      next,
    })
  }

  if (authOff) {
    return (
      <section className="bg-background" style={rootStyle}>
        <AuthDisabledState title="Sign in" />
      </section>
    )
  }

  return (
    <section className="bg-background" style={rootStyle}>
      <AuthSectionShell>
        <AuthCardFrame
          logoUrl={config.branding.logoUrl}
          imageUrl={config.branding.imageUrl}
          layout={config.branding.layout}
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

                  {providers.length > 0 ? (
                    <>
                      <AuthProviderButtons
                        providers={providers}
                        disabled={busy || !auth.isLive}
                        onSelect={(provider) => void auth.oauth(provider)}
                      />
                      {config.emailPasswordEnabled ? <AuthDivider label={dividerLabel} /> : null}
                    </>
                  ) : null}

                  {config.emailPasswordEnabled ? (
                    <form onSubmit={onSubmit} className="grid gap-4">
                      <AuthField
                        label={emailLabel}
                        name="email"
                        type="email"
                        autoComplete="email"
                        placeholder="you@example.com"
                        required
                      />
                      <AuthField
                        label={passwordLabel}
                        name="password"
                        type="password"
                        autoComplete="current-password"
                        placeholder="••••••••"
                        required
                      >
                        <Link
                          href={auth.href(config.paths.forgotPasswordPath)}
                          className="text-xs font-medium text-primary hover:underline"
                        >
                          {forgotLabel}
                        </Link>
                      </AuthField>

                      {showRemember && config.allowRememberMe ? (
                        <label className="flex items-center gap-2 text-sm text-muted-foreground">
                          <input
                            type="checkbox"
                            name="rememberMe"
                            defaultChecked
                            className="h-4 w-4 rounded border-border accent-[hsl(var(--primary))]"
                          />
                          <AuthEditable
                            instance={instance}
                            propKey="rememberLabel"
                            value={rememberLabel}
                            isPreview={isPreview}
                          />
                        </label>
                      ) : null}

                      <AuthSubmit label={submitLabel} status={auth.status} disabled={!auth.isLive} />
                    </form>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Email sign-in is disabled for this site.
                    </p>
                  )}

                  {config.branding.footerNote ? (
                    <p className="mt-5 text-center text-xs text-muted-foreground">
                      {config.branding.footerNote}
                    </p>
                  ) : null}

                  {!auth.isLive ? (
                    <AuthPreviewNotice>
                      Sign-in runs on the published site. Configure providers in Settings →
                      Authentication.
                    </AuthPreviewNotice>
                  ) : null}
                </div>
              ),
              emailLabel: drawnElsewhere,
              passwordLabel: drawnElsewhere,
              forgotLabel: drawnElsewhere,
              rememberLabel: drawnElsewhere,
              dividerLabel: drawnElsewhere,
              // Prompt + link are the card footer, shown only while sign-ups are open.
              registerPrompt: () =>
                showRegisterLink && config.allowRegistration ? (
                  <div className={CARD_FOOTER_CLASS}>
                    <AuthEditable
                      instance={instance}
                      propKey="registerPrompt"
                      value={registerPrompt}
                      isPreview={isPreview}
                    />{' '}
                    <Link
                      href={auth.href(config.paths.registerPath)}
                      className="font-semibold text-primary hover:underline"
                    >
                      {registerLabel}
                    </Link>
                  </div>
                ) : null,
              registerLabel: drawnElsewhere,
            }}
          />
        </AuthCardFrame>
      </AuthSectionShell>
    </section>
  )
}

export const authLoginSection = defineSection({
  id: 'auth-login',
  displayName: 'Member Access',
  description:
    'Email + password sign-in card with optional social providers, remember-me and links to registration and password recovery.',
  category: 'auth',
  detachable: false,
  layoutArchetype: 'centered',
  industries: ['generic', 'saas', 'ecommerce', 'education', 'fitness', 'medical'],
  styles: ['modern', 'minimal', 'corporate'],
  goals: ['engagement'],
  complexity: 'medium',
  density: 'low',
  imageRequired: false,
  mobileScore: 98,
  editable: true,
  aiKeywords: ['login', 'sign in', 'log in', 'account access', 'member area'],
  version: 1,
  defaultOptions: { align: 'center', paddingY: 'lg' },
  schema: {
    slots: [{ id: 'card', label: 'Sign-in card', isDefault: true }],
    blocks: [
      headingBlock(1),
      subheadingBlock(),
      noteBlock('submitLabel', 'Submit button', { canonical: 'ctaPrimary', maxLength: 30 }, 'Sign-in form'),
      noteBlock('emailLabel', 'Email label'),
      noteBlock('passwordLabel', 'Password label'),
      noteBlock('forgotLabel', 'Forgot-password link'),
      noteBlock('rememberLabel', 'Remember-me label'),
      noteBlock('dividerLabel', 'Divider label'),
      noteBlock('registerPrompt', 'Register prompt'),
      noteBlock('registerLabel', 'Register link'),
    ],
    settings: [
      switchSetting('showSocial', 'Show social sign-in'),
      switchSetting('showRemember', 'Show remember me'),
      switchSetting('showRegisterLink', 'Show register link'),
    ],
  },
  defaultProps: {
    heading: 'Welcome back',
    subheading: 'Sign in to continue to your account.',
    emailLabel: 'Email',
    passwordLabel: 'Password',
    submitLabel: 'Sign in',
    rememberLabel: 'Remember me',
    forgotLabel: 'Forgot password?',
    registerPrompt: "Don't have an account?",
    registerLabel: 'Create one',
    dividerLabel: 'or',
    showSocial: true,
    showRemember: true,
    showRegisterLink: true,
  },
  Component: AuthLogin,
})
