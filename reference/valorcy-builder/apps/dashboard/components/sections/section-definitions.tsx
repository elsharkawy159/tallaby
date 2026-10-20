import type { SectionDefinition } from '@/components/sections/registry.types'
import { CustomBlankSection } from '@/components/sections/custom/custom-blank-section'
import { ABOUT_SECTION_DEFINITIONS } from '@/components/sections/about'
import { AUTH_SECTION_DEFINITIONS } from '@/components/sections/auth'
import { BLOG_SECTION_DEFINITIONS } from '@/components/sections/blog'
import { BOOKING_SECTION_DEFINITIONS } from '@/components/sections/booking'
import { MENU_SECTION_DEFINITIONS } from '@/components/sections/menu'
import { LISTINGS_SECTION_DEFINITIONS } from '@/components/sections/listings'
import { CONTACT_SECTION_DEFINITIONS } from '@/components/sections/contact'
import { CONTENT_SECTION_DEFINITIONS } from '@/components/sections/content'
import { CTA_SECTION_DEFINITIONS } from '@/components/sections/cta'
import { FAQ_SECTION_DEFINITIONS } from '@/components/sections/faq'
import { FEATURES_SECTION_DEFINITIONS } from '@/components/sections/features'
import { FOOTER_SECTION_DEFINITIONS } from '@/components/sections/footer'
import { GALLERY_SECTION_DEFINITIONS } from '@/components/sections/gallery'
import { HERO_SECTION_DEFINITIONS } from '@/components/sections/hero'
import { LOGO_CLOUD_SECTION_DEFINITIONS } from '@/components/sections/logo-cloud'
import { NAVBAR_SECTION_DEFINITIONS } from '@/components/sections/navbar'
import { PRICING_SECTION_DEFINITIONS } from '@/components/sections/pricing'
import { SOCIAL_PROOF_SECTION_DEFINITIONS } from '@/components/sections/social-proof'
import { STATS_SECTION_DEFINITIONS } from '@/components/sections/stats'
import { TEAM_SECTION_DEFINITIONS } from '@/components/sections/team'
import { TESTIMONIALS_SECTION_DEFINITIONS } from '@/components/sections/testimonials'
import { TIMELINE_SECTION_DEFINITIONS } from '@/components/sections/timeline'
// import { GENERATED_FILLER_SECTION_DEFINITIONS } from '@/components/sections/generated-fillers'

export const SECTION_DEFINITIONS: SectionDefinition[] = [
  {
    id: 'custom',
    displayName: 'Custom section',
    description: 'Start from scratch with the element palette.',
    category: 'custom',
    defaultProps: {},
    propDefinitions: [],
    version: 1,
    // Hidden: out of the insert grid and AI manifest, but get() still
    // resolves it so the canvas and published site can render instances.
    hidden: true,
    Component: CustomBlankSection,
  },
  ...NAVBAR_SECTION_DEFINITIONS,
  ...HERO_SECTION_DEFINITIONS,
  ...LOGO_CLOUD_SECTION_DEFINITIONS,
  ...SOCIAL_PROOF_SECTION_DEFINITIONS,
  ...ABOUT_SECTION_DEFINITIONS,
  ...FEATURES_SECTION_DEFINITIONS,
  ...STATS_SECTION_DEFINITIONS,
  ...CONTENT_SECTION_DEFINITIONS,
  ...GALLERY_SECTION_DEFINITIONS,
  ...LISTINGS_SECTION_DEFINITIONS,
  ...MENU_SECTION_DEFINITIONS,
  ...BLOG_SECTION_DEFINITIONS,
  ...TEAM_SECTION_DEFINITIONS,
  ...TIMELINE_SECTION_DEFINITIONS,
  ...TESTIMONIALS_SECTION_DEFINITIONS,
  ...PRICING_SECTION_DEFINITIONS,
  ...FAQ_SECTION_DEFINITIONS,
  ...BOOKING_SECTION_DEFINITIONS,
  ...CONTACT_SECTION_DEFINITIONS,
  ...CTA_SECTION_DEFINITIONS,
  ...AUTH_SECTION_DEFINITIONS,
  ...FOOTER_SECTION_DEFINITIONS,
  // ...(Array.isArray(GENERATED_FILLER_SECTION_DEFINITIONS) ? GENERATED_FILLER_SECTION_DEFINITIONS : []),
]
