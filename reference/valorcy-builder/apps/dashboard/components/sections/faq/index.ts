import type { SectionDefinition } from '@/components/sections/registry.types'
import { faqAccordionSection } from '@/components/sections/faq/faq-accordion'
import { faqTwoColSection } from '@/components/sections/faq/faq-two-col'
import { faqGridSection } from '@/components/sections/faq/faq-grid'
import { faqSearchSection } from '@/components/sections/faq/faq-search'
import { faqTabsSection } from '@/components/sections/faq/faq-tabs'
import { faqListSection } from '@/components/sections/faq/faq-list'
import { faqBorderedSection } from '@/components/sections/faq/faq-bordered'
import { faqMinimalSection } from '@/components/sections/faq/faq-minimal'

export const FAQ_SECTION_DEFINITIONS: SectionDefinition[] = [
  faqAccordionSection,
  faqTwoColSection,
  faqGridSection,
  faqSearchSection,
  faqTabsSection,
  faqListSection,
  faqBorderedSection,
  faqMinimalSection,
]
