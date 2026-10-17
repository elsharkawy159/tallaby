import type { SectionDefinition } from '@/components/sections/registry.types'
import { footerBrandSection } from '@/components/sections/footer/footer-brand'
import { footerColumnsSection } from '@/components/sections/footer/footer-columns'
import { footerDarkSection } from '@/components/sections/footer/footer-dark'
import { footerMegaSection } from '@/components/sections/footer/footer-mega'
import { footerMinimalSection } from '@/components/sections/footer/footer-minimal'
import { footerSimpleSection } from '@/components/sections/footer/footer-simple'
import { footerLegalSection } from '@/components/sections/footer/footer-legal'
import { footerSplitSection } from '@/components/sections/footer/footer-split'

export const FOOTER_SECTION_DEFINITIONS: SectionDefinition[] = [
  footerSimpleSection,
  footerColumnsSection,
  footerMinimalSection,
  footerMegaSection,
  footerBrandSection,
  footerDarkSection,
  footerLegalSection,
  footerSplitSection,
]
