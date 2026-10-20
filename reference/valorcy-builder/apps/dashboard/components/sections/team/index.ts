import type { SectionDefinition } from '@/components/sections/registry.types'
import { teamCardsSection } from '@/components/sections/team/team-cards'
import { teamMinimalSection } from '@/components/sections/team/team-minimal'
import { teamHorizontalSection } from '@/components/sections/team/team-horizontal'
import { teamGridSection } from '@/components/sections/team/team-grid'
import { teamLeadershipSection } from '@/components/sections/team/team-leadership'
import { teamPhotoWallSection } from '@/components/sections/team/team-photo-wall'
import { teamCultureWallSection } from '@/components/sections/team/team-culture-wall'

export const TEAM_SECTION_DEFINITIONS: SectionDefinition[] = [
  teamCardsSection,
  teamMinimalSection,
  teamHorizontalSection,
  teamGridSection,
  teamLeadershipSection,
  teamPhotoWallSection,
  teamCultureWallSection,
]
