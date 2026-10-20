import type { SectionDefinition } from '@/components/sections/registry.types'
import { testimonialsCardsSection } from '@/components/sections/testimonials/testimonials-cards'
import { testimonialsGridSection } from '@/components/sections/testimonials/testimonials-grid'
import { testimonialsMarqueeSection } from '@/components/sections/testimonials/testimonials-marquee'
import { testimonialsSingleSection } from '@/components/sections/testimonials/testimonials-single'
import { testimonialsVideoSection } from '@/components/sections/testimonials/testimonials-video'
import { testimonialsWallSection } from '@/components/sections/testimonials/testimonials-wall'
// Deprecated from palette: testimonials-logos, testimonials-strip

export const TESTIMONIALS_SECTION_DEFINITIONS: SectionDefinition[] = [
  testimonialsGridSection,
  testimonialsCardsSection,
  testimonialsSingleSection,
  testimonialsMarqueeSection,
  testimonialsVideoSection,
  testimonialsWallSection,
]
