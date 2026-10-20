import type { SectionDefinition } from '@/components/sections/registry.types'
import { aboutHeroSection } from '@/components/sections/about/about-hero'
import { aboutManifestoSection } from '@/components/sections/about/about-manifesto'
import { aboutNarrativeSection } from '@/components/sections/about/about-narrative'
import { aboutSplitSection } from '@/components/sections/about/about-split'
import { aboutStatsSection } from '@/components/sections/about/about-stats'
import { aboutValuesSection } from '@/components/sections/about/about-values'
import { aboutBadgedSection } from '@/components/sections/about/about-badged'
import { aboutTimelineSection } from '@/components/sections/about/about-timeline'

export const ABOUT_SECTION_DEFINITIONS: SectionDefinition[] = [
  aboutHeroSection,
  aboutSplitSection,
  aboutStatsSection,
  aboutNarrativeSection,
  aboutManifestoSection,
  aboutValuesSection,
  aboutBadgedSection,
  aboutTimelineSection,
]
