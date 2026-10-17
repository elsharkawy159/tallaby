import type { SectionDefinition } from '@/components/sections/registry.types'
import { pricingSimpleSection } from '@/components/sections/pricing/pricing-simple'
import { pricingCompareSection } from '@/components/sections/pricing/pricing-compare'
import { pricingTableSection } from '@/components/sections/pricing/pricing-table'
import { pricingToggleSection } from '@/components/sections/pricing/pricing-toggle'
import { pricingSingleSection } from '@/components/sections/pricing/pricing-single'
import { pricingTierCardsSection } from '@/components/sections/pricing/pricing-tier-cards'
import { pricingHighlightSection } from '@/components/sections/pricing/pricing-highlight'

export const PRICING_SECTION_DEFINITIONS: SectionDefinition[] = [
  pricingSimpleSection,
  pricingCompareSection,
  pricingTableSection,
  pricingToggleSection,
  pricingSingleSection,
  pricingTierCardsSection,
  pricingHighlightSection,
]
