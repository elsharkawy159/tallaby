import type { SectionDefinition } from '@/components/sections/registry.types'
import { contactCardSection } from '@/components/sections/contact/contact-card'
import { contactMapSection } from '@/components/sections/contact/contact-map'
import { contactMinimalSection } from '@/components/sections/contact/contact-minimal'
import { contactSplitSection } from '@/components/sections/contact/contact-split'
import { contactSupportSection } from '@/components/sections/contact/contact-support'
import { contactTwoColSection } from '@/components/sections/contact/contact-two-col'
import { contactBandSection } from '@/components/sections/contact/contact-band'
import { contactFormalSection } from '@/components/sections/contact/contact-formal'
import { formEmbedSection } from '@/components/sections/contact/form-embed'

export const CONTACT_SECTION_DEFINITIONS: SectionDefinition[] = [
  contactSplitSection,
  contactCardSection,
  contactMinimalSection,
  contactMapSection,
  contactTwoColSection,
  contactSupportSection,
  contactBandSection,
  contactFormalSection,
  formEmbedSection,
]
