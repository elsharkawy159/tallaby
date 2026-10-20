'use client'

import Link from 'next/link'
import {
  CalendarClock,
  Heart,
  LogOut,
  MapPin,
  Package,
  ShieldCheck,
  UserRound,
} from 'lucide-react'

import { defineSection } from '@/components/sections/define-section'
import type { SectionComponentProps } from '@/components/sections/registry.types'
import { SectionContainer } from '@/components/sections/section-container'
import { SectionSlot } from '@/components/sections/_primitives/section-slot'
import { useSectionSurface } from '@/components/sections/shared'
import { propBool, propText } from '@/components/auth-blocks/auth-editable'
import {
  AuthDisabledState,
  AuthPreviewNotice,
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

/* ─── Account block ────────────────────────────────────────────────────────
   The visitor's landing page once signed in: a greeting plus a tile grid of the
   destinations their site actually offers. Commerce tiles (orders, wishlist) are
   opt-in switches so a non-commerce site never advertises a page it lacks.

   Slot-driven: heading and subheading are blocks in the `copy` slot; the
   session-aware panel (sign-in prompt for guests, greeting + sign-out + tiles
   for members) is the `signedOutText` block's override.
   ────────────────────────────────────────────────────────────────────────── */

type Tile = {
  key: string
  label: string
  description: string
  href: string
  Icon: typeof UserRound
}

function AuthAccount ({ instance, isPreview, definition }: SectionComponentProps) {
  const { rootStyle } = useSectionSurface({ instanceId: instance.id })
  const auth = useSiteAuth()
  const { config } = auth

  // Live site with the master switch off: render an honest placeholder rather
  // than a form whose submit can only ever be rejected server-side.
  const authOff = auth.isLive && !config.enabled
  const user = config.user

  const greeting = propText(instance, 'greeting', 'Hi')
  const signedOutText = propText(instance, 'signedOutText', 'Sign in to see your account.')
  const signInLabel = propText(instance, 'signInLabel', 'Sign in')
  const signOutLabel = propText(instance, 'signOutLabel', 'Sign out')
  const showOrders = propBool(instance, 'showOrders', false)
  const showBookings = propBool(instance, 'showBookings', false)
  const showWishlist = propBool(instance, 'showWishlist', false)
  const showAddresses = propBool(instance, 'showAddresses', false)
  const showSignOut = propBool(instance, 'showSignOut', true)

  const tiles: Tile[] = [
    {
      key: 'profile',
      label: propText(instance, 'profileLabel', 'Profile'),
      description: 'Your name, email and contact details',
      href: auth.href('/profile'),
      Icon: UserRound,
    },
    ...(showOrders
      ? [
          {
            key: 'orders',
            label: propText(instance, 'ordersLabel', 'Orders'),
            description: 'Track and review past orders',
            href: auth.href('/account/orders'),
            Icon: Package,
          },
        ]
      : []),
    ...(showBookings
      ? [
          {
            key: 'bookings',
            label: propText(instance, 'bookingsLabel', 'Bookings'),
            description: 'Upcoming and past appointments',
            href: auth.href('/account/bookings'),
            Icon: CalendarClock,
          },
        ]
      : []),
    ...(showWishlist
      ? [
          {
            key: 'wishlist',
            label: propText(instance, 'wishlistLabel', 'Wishlist'),
            description: 'Items you saved for later',
            href: auth.href('/account/wishlist'),
            Icon: Heart,
          },
        ]
      : []),
    ...(showAddresses
      ? [
          {
            key: 'addresses',
            label: propText(instance, 'addressesLabel', 'Addresses'),
            description: 'Delivery and billing addresses',
            href: auth.href('/account/addresses'),
            Icon: MapPin,
          },
        ]
      : []),
  ]

  if (authOff) {
    return (
      <section className="bg-background" style={rootStyle}>
        <AuthDisabledState title="Your account" />
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
          className="mx-auto w-full max-w-4xl"
          overrides={{
            heading: authText('heading', 'Your account', {
              as: 'h2',
              className: 'text-3xl font-bold tracking-[-0.02em] text-foreground',
              isPreview,
            }),
            subheading: authText('subheading', 'Manage your details and activity.', {
              className: 'mt-2 text-muted-foreground',
              isPreview,
            }),
            greeting: drawnElsewhere,
            signInLabel: drawnElsewhere,
            signOutLabel: drawnElsewhere,
            profileLabel: drawnElsewhere,
            ordersLabel: drawnElsewhere,
            bookingsLabel: drawnElsewhere,
            wishlistLabel: drawnElsewhere,
            addressesLabel: drawnElsewhere,
            signedOutText: () =>
              !user ? (
                <div className="mt-8 rounded-[calc(var(--radius,0.5rem)*2)] border border-border bg-card p-8 text-center">
                  <p className="text-sm text-muted-foreground">{signedOutText}</p>
                  <Link
                    href={auth.loginHref()}
                    className="mt-4 inline-flex items-center justify-center rounded-[var(--radius,0.5rem)] bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
                  >
                    {signInLabel}
                  </Link>
                  {!auth.isLive ? (
                    <AuthPreviewNotice>
                      On the published site this shows the signed-in visitor&apos;s account.
                    </AuthPreviewNotice>
                  ) : null}
                </div>
              ) : (
                <>
                  <div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-[calc(var(--radius,0.5rem)*2)] border border-border bg-card p-6">
                    <div className="flex items-center gap-4">
                      {user.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={user.avatarUrl}
                          alt=""
                          className="h-12 w-12 rounded-full object-cover"
                        />
                      ) : (
                        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-muted font-semibold text-foreground">
                          {(user.fullName ?? user.email).slice(0, 1).toUpperCase()}
                        </span>
                      )}
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground">
                          {greeting}, {user.fullName ?? user.email.split('@')[0]}
                        </p>
                        <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          {user.emailVerified ? (
                            <>
                              <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
                              Verified account
                            </>
                          ) : (
                            'Email not verified yet'
                          )}
                        </p>
                      </div>
                    </div>

                    {showSignOut ? (
                      <button
                        type="button"
                        onClick={() => void auth.logout()}
                        disabled={!auth.isLive || auth.status === 'submitting'}
                        className="inline-flex items-center gap-2 rounded-[var(--radius,0.5rem)] border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted/60 disabled:opacity-60"
                      >
                        <LogOut className="h-4 w-4" aria-hidden />
                        {signOutLabel}
                      </button>
                    ) : null}
                  </div>

                  <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {tiles.map(({ key, label, description, href, Icon }) => (
                      <Link
                        key={key}
                        href={href}
                        className="group rounded-[calc(var(--radius,0.5rem)*1.5)] border border-border bg-card p-5 transition-colors hover:border-primary/40 hover:bg-muted/40"
                      >
                        <Icon className="h-5 w-5 text-primary" aria-hidden />
                        <p className="mt-3 font-semibold text-foreground">{label}</p>
                        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
                      </Link>
                    ))}
                  </div>
                </>
              ),
          }}
        />
      </SectionContainer>
    </section>
  )
}

export const authAccountSection = defineSection({
  id: 'auth-account',
  displayName: 'Account Overview',
  description:
    'Signed-in landing page: greeting, verification state, sign-out and a tile grid linking to profile, orders, bookings, wishlist and addresses.',
  category: 'auth',
  detachable: false,
  layoutArchetype: 'bento',
  industries: ['generic', 'saas', 'ecommerce', 'education', 'fitness', 'medical'],
  styles: ['modern', 'minimal'],
  goals: ['engagement', 'support'],
  complexity: 'medium',
  density: 'medium',
  imageRequired: false,
  mobileScore: 95,
  editable: true,
  aiKeywords: ['account', 'my account', 'dashboard', 'member area'],
  version: 1,
  defaultOptions: { align: 'start', paddingY: 'lg' },
  schema: {
    slots: [{ id: 'copy', label: 'Account', isDefault: true }],
    blocks: [
      headingBlock(2),
      subheadingBlock(),
      noteBlock('signedOutText', 'Signed-out message', {}, 'Account panel'),
      noteBlock('greeting', 'Greeting word'),
      noteBlock('signInLabel', 'Sign-in button'),
      noteBlock('signOutLabel', 'Sign-out button'),
      noteBlock('profileLabel', 'Profile tile'),
      noteBlock('ordersLabel', 'Orders tile'),
      noteBlock('bookingsLabel', 'Bookings tile'),
      noteBlock('wishlistLabel', 'Wishlist tile'),
      noteBlock('addressesLabel', 'Addresses tile'),
    ],
    settings: [
      switchSetting('showOrders', 'Show orders tile'),
      switchSetting('showBookings', 'Show bookings tile'),
      switchSetting('showWishlist', 'Show wishlist tile'),
      switchSetting('showAddresses', 'Show addresses tile'),
      switchSetting('showSignOut', 'Show sign-out button'),
    ],
  },
  defaultProps: {
    heading: 'Your account',
    subheading: 'Manage your details and activity.',
    greeting: 'Hi',
    signedOutText: 'Sign in to see your account.',
    signInLabel: 'Sign in',
    signOutLabel: 'Sign out',
    profileLabel: 'Profile',
    ordersLabel: 'Orders',
    bookingsLabel: 'Bookings',
    wishlistLabel: 'Wishlist',
    addressesLabel: 'Addresses',
    showOrders: false,
    showBookings: false,
    showWishlist: false,
    showAddresses: false,
    showSignOut: true,
  },
  Component: AuthAccount,
})
