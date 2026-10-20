/**
 * Canonical enums and field taxonomy for the section registry.
 *
 * These `as const` arrays are the single source of truth — the union types
 * in `registry.types.ts` are derived from them so the same list is both
 * type-checked and iterable at runtime (manifest, scoring, validation).
 */

export const SECTION_INDUSTRIES = [
  'generic',
  'saas',
  'agency',
  'startup',
  'enterprise',
  'tech',
  'software',
  'app_landing',
  'ai_startup',
  'web_dev_service',
  'it_support',
  'ecommerce',
  'fashion',
  'beauty',
  'electronics',
  'handmade',
  'portfolio',
  'creative',
  'photography',
  'podcast',
  'restaurant',
  'cafe',
  'bakery',
  'catering',
  'food_delivery',
  'fitness',
  'medical',
  'dentist',
  'physiotherapy',
  'nutritionist',
  'therapy',
  'education',
  'online_course',
  'school',
  'tutor',
  'language_learning',
  'real_estate',
  'property_broker',
  'interior_design',
  'architecture',
  'home_services',
  'travel',
  'travel_agency',
  'tour_package',
  'hotel',
  'car_rental',
  'finance',
  'law',
  'nonprofit',
  'event',
  'wedding_planner',
  'other',
] as const

/**
 * Legacy industry keys → canonical key. Consulted by the scorer so that
 * persisted intents using deprecated keys still match.
 */
export const LEGACY_INDUSTRY_ALIASES: Record<string, (typeof SECTION_INDUSTRIES)[number]> = {
  realestate: 'real_estate',
}

export const SECTION_STYLES = [
  'modern',
  'minimal',
  'glass',
  'bold',
  'editorial',
  'playful',
  'corporate',
  'gradient',
  'dark',
] as const

export const SECTION_GOALS = [
  'sales',
  'leads',
  'bookings',
  'trust',
  'brand',
  'engagement',
  'conversion',
  'awareness',
  'education',
  'support',
] as const

export const SECTION_CATEGORIES = [
  'navbar',
  'hero',
  'about',
  'contact',
  'features',
  'pricing',
  'testimonials',
  'cta',
  'faq',
  'blog',
  'gallery',
  'team',
  'stats',
  'logos',
  'logo-cloud',
  'content',
  'timeline',
  'social-proof',
  'footer',
  'custom',
  'booking',
  'menu',
  'listings',
  'auth',
] as const

export const SECTION_COMPLEXITY = ['low', 'medium', 'high'] as const
export const SECTION_DENSITY = ['low', 'medium', 'high'] as const

export const SECTION_POSITIONS = ['top', 'middle', 'bottom', 'any'] as const

/**
 * Default `bestPosition` per category when a section doesn't override it.
 * Lets the planner and scorer reason about page placement without every
 * definition having to opt in.
 */
export const DEFAULT_POSITION_BY_CATEGORY: Record<
  (typeof SECTION_CATEGORIES)[number],
  (typeof SECTION_POSITIONS)[number]
> = {
  navbar: 'top',
  hero: 'top',
  'logo-cloud': 'top',
  logos: 'top',
  'social-proof': 'top',
  features: 'middle',
  about: 'middle',
  content: 'middle',
  gallery: 'middle',
  stats: 'middle',
  team: 'middle',
  testimonials: 'middle',
  timeline: 'middle',
  blog: 'middle',
  pricing: 'middle',
  faq: 'bottom',
  cta: 'bottom',
  contact: 'bottom',
  footer: 'bottom',
  custom: 'any',
  booking: 'bottom',
  menu: 'middle',
  listings: 'middle',
  auth: 'middle',
}

/**
 * Canonical field keys. New and migrated sections SHOULD use these
 * exact keys so the AI populator can address fields by intent instead
 * of brittle regex matching on legacy names.
 */
export const CANONICAL_FIELDS = [
  'eyebrow',
  'badge',
  'headline',
  'subheadline',
  'body',
  'ctaPrimary',
  'ctaSecondary',
  'ctaLink',
  'image',
  'imageAlt',
  'logo',
  'brandName',
  'items',
  'cards',
  'logos',
  'stats',
  'testimonials',
  'faqs',
  'plans',
  'members',
  'posts',
  'socials',
  'menuItems',
  'listings',
  'events',
  'steps',
  'beforeAfter',
  'packages',
] as const

export type CanonicalField = (typeof CANONICAL_FIELDS)[number]

/**
 * Short, AI-facing descriptions of each canonical field. The manifest
 * embeds these so the LLM understands what to generate per slot.
 */
export const CANONICAL_FIELD_PURPOSE: Record<CanonicalField, string> = {
  eyebrow: 'Short kicker label above the headline (1–3 words)',
  badge: 'Pill-style label (1–3 words)',
  headline: 'Primary section headline (6–10 words, no period)',
  subheadline: 'Secondary headline supporting the primary (8–14 words)',
  body: 'Descriptive paragraph (1–3 sentences)',
  ctaPrimary: 'Primary call-to-action button label (1–4 words)',
  ctaSecondary: 'Secondary CTA button label (1–4 words)',
  ctaLink: 'Destination URL for the primary CTA',
  image: 'Hero/illustrative image URL',
  imageAlt: 'Accessible alt text for the image',
  logo: 'Logo image URL',
  brandName: 'Business or product name',
  items: 'Generic list of feature/benefit items',
  cards: 'Card list with title + description (+ optional icon/image)',
  logos: 'Logo cloud entries',
  stats: 'Numeric stat highlights',
  testimonials: 'Customer quotes with name/role',
  faqs: 'Question/answer pairs',
  plans: 'Pricing plans with name, price, features',
  members: 'Team member entries',
  posts: 'Blog or article preview entries',
  socials: 'Social media links',
  menuItems: 'Restaurant/food menu items with name, description, price',
  listings: 'Property or product listing cards',
  events: 'Event entries with date, time, venue and ticket link',
  steps: 'Numbered process or how-it-works steps',
  beforeAfter: 'Before/after image pairs with optional label',
  packages: 'Service or membership packages with features and price',
}

/**
 * Legacy prop key → canonical key. Used by the populator and the panel
 * renderer so existing sections keep working before per-category migration.
 */
export const FIELD_KEY_ALIASES: Record<string, CanonicalField> = {
  title: 'headline',
  heading: 'headline',
  hero: 'headline',
  subtitle: 'subheadline',
  description: 'body',
  lead: 'body',
  excerpt: 'body',
  cta: 'ctaPrimary',
  primary: 'ctaPrimary',
  primaryLabel: 'ctaPrimary',
  ctaLabel: 'ctaPrimary',
  secondary: 'ctaSecondary',
  secondaryLabel: 'ctaSecondary',
  href: 'ctaLink',
  imageUrl: 'image',
  alt: 'imageAlt',
  logoUrl: 'logo',
  brand: 'brandName',
  siteName: 'brandName',
  company: 'brandName',
  name: 'brandName',
  benefits: 'items',
  features: 'items',
  services: 'items',
  tiers: 'plans',
  pricing: 'plans',
  questions: 'faqs',
  quotes: 'testimonials',
  reviews: 'testimonials',
  metrics: 'stats',
  numbers: 'stats',
  people: 'members',
  team: 'members',
  articles: 'posts',
  blog: 'posts',
}

export type FieldGroup = 'content' | 'media' | 'cta' | 'layout' | 'appearance'

export const FIELD_GROUP_LABELS: Record<FieldGroup, string> = {
  content: 'Content',
  media: 'Media',
  cta: 'Call to action',
  layout: 'Layout',
  appearance: 'Appearance',
}

// ─── Funnel stages ────────────────────────────────────────────────────────────

export const SECTION_FUNNEL_STAGES = [
  'awareness',
  'consideration',
  'decision',
  'retention',
] as const

export type SectionFunnelStage = (typeof SECTION_FUNNEL_STAGES)[number]

// ─── Canonical item shapes ────────────────────────────────────────────────────
//
// Defines the standard field set for each item collection canonical key.
// Sections SHOULD use these field names inside itemPropDefinitions so the
// populator's mapItemKeys() can address them without aliases.

export const CANONICAL_ITEM_SHAPES = {
  items: { title: 'string', description: 'string', icon: 'string', image: 'string' },
  cards: { title: 'string', description: 'string', icon: 'string', image: 'string', href: 'string' },
  logos: { name: 'string', imageUrl: 'string', href: 'string' },
  stats: { value: 'string', label: 'string', description: 'string' },
  testimonials: { quote: 'string', author: 'string', role: 'string', company: 'string', avatar: 'string', rating: 'number' },
  faqs: { question: 'string', answer: 'string' },
  plans: { name: 'string', price: 'string', description: 'string', features: 'string[]', ctaLabel: 'string', ctaHref: 'string', isPopular: 'boolean' },
  members: { name: 'string', role: 'string', bio: 'string', avatar: 'string', href: 'string' },
  posts: { title: 'string', excerpt: 'string', image: 'string', href: 'string', date: 'string', author: 'string' },
  socials: { icon: 'string', label: 'string', href: 'string' },
  menuItems: { name: 'string', description: 'string', price: 'string', image: 'string', dietary: 'string' },
  listings: { title: 'string', price: 'string', address: 'string', beds: 'string', baths: 'string', sqft: 'string', image: 'string', href: 'string' },
  events: { title: 'string', date: 'string', time: 'string', venue: 'string', description: 'string', image: 'string', href: 'string', ticketHref: 'string' },
  steps: { number: 'string', title: 'string', description: 'string', icon: 'string' },
  beforeAfter: { before: 'string', after: 'string', label: 'string' },
  packages: { name: 'string', price: 'string', duration: 'string', description: 'string', features: 'string', ctaLabel: 'string', ctaHref: 'string' },
} as const satisfies Record<string, Record<string, string>>

// ─── Theme fields convention ──────────────────────────────────────────────────
//
// All editable sections SHOULD expose these props so the AI and builder can
// switch between light/dark and adjust spacing without per-section logic.

export const THEME_FIELD_KEYS = ['theme', 'density'] as const
export type ThemeFieldKey = (typeof THEME_FIELD_KEYS)[number]
