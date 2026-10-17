import type { SectionDefinition } from '@/components/sections/registry.types'
import { socialProofLogosSection } from '@/components/sections/social-proof/social-proof-logos'
import { socialProofRatingsSection } from '@/components/sections/social-proof/social-proof-ratings'
import { socialProofAwardsSection } from '@/components/sections/social-proof/social-proof-awards'
import { socialProofPressSection } from '@/components/sections/social-proof/social-proof-press'
import { socialProofNumbersSection } from '@/components/sections/social-proof/social-proof-numbers'
import { socialProofMixedSection } from '@/components/sections/social-proof/social-proof-mixed'
import { socialProofStackSection } from '@/components/sections/social-proof/social-proof-stack'
import { socialProofCertificationsSection } from '@/components/sections/social-proof/social-proof-certifications'
import { socialProofReviewsSection } from '@/components/sections/social-proof/social-proof-reviews'

export const SOCIAL_PROOF_SECTION_DEFINITIONS: SectionDefinition[] = [
  socialProofLogosSection,
  socialProofRatingsSection,
  socialProofAwardsSection,
  socialProofPressSection,
  socialProofNumbersSection,
  socialProofMixedSection,
  socialProofStackSection,
  socialProofCertificationsSection,
  socialProofReviewsSection,
]
