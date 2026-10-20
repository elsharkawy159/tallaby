import type { SectionDefinition } from '@/components/sections/registry.types'
import { featuresGridSection } from './features-grid'
import { featuresBentoSection } from './features-bento'
import { featuresTimelineSection } from './features-timeline'
import { featuresCardsSection } from './features-cards'
import { featuresIconsSection } from './features-icons'
import { featuresStickySection } from './features-sticky'
import { featuresChecklistSection } from './features-checklist'
import { featuresListSection } from './features-list'
import { featuresPersonasSection } from './features-personas'
import { featuresStepsSection } from './features-steps'
import { featuresWorkflowSection } from './features-workflow'
import { featuresIntegrationsSection } from './features-integrations'
import { featuresComparisonSection } from './features-comparison'
import { featuresUseCaseExplorerSection } from './features-use-case-explorer'
import { featuresServicesMatrixSection } from './features-services-matrix'
import { featuresWhyUsSection } from './features-why-us'
import { featuresIndustryExpertiseSection } from './features-industry-expertise'
import { featuresPracticeAreasSection } from './features-practice-areas'

export const FEATURES_SECTION_DEFINITIONS: SectionDefinition[] = [
  featuresGridSection,
  featuresBentoSection,
  featuresTimelineSection,
  featuresCardsSection,
  featuresIconsSection,
  featuresStickySection,
  featuresChecklistSection,
  featuresListSection,
  featuresPersonasSection,
  featuresStepsSection,
  featuresWorkflowSection,
  featuresIntegrationsSection,
  featuresComparisonSection,
  featuresUseCaseExplorerSection,
  featuresServicesMatrixSection,
  featuresWhyUsSection,
  featuresIndustryExpertiseSection,
  featuresPracticeAreasSection,
]
