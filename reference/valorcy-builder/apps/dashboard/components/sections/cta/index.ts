import type { SectionDefinition } from '@/components/sections/registry.types'
import { ctaSimpleSection } from './cta-simple'
import { ctaBannerSection } from './cta-banner'
import { ctaSplitSection } from './cta-split'
import { ctaInlineSection } from './cta-inline'
import { ctaGradientSection } from './cta-gradient'
import { ctaCardSection } from './cta-card'
import { ctaMinimalSection } from './cta-minimal'

export const CTA_SECTION_DEFINITIONS: SectionDefinition[] = [
  ctaSimpleSection,
  ctaBannerSection,
  ctaSplitSection,
  ctaInlineSection,
  ctaGradientSection,
  ctaCardSection,
  ctaMinimalSection,
]
