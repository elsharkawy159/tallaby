import type { SectionDefinition } from '@/components/sections/registry.types'
import { timelineVerticalSection } from '@/components/sections/timeline/timeline-vertical'
import { timelineHorizontalSection } from '@/components/sections/timeline/timeline-horizontal'
import { timelineAlternatingSection } from '@/components/sections/timeline/timeline-alternating'
import { timelineMilestoneSection } from '@/components/sections/timeline/timeline-milestone'
import { timelineRoadmapSection } from '@/components/sections/timeline/timeline-roadmap'
import { timelineStorySection } from '@/components/sections/timeline/timeline-story'
import { timelineProjectSection } from '@/components/sections/timeline/timeline-project'

export const TIMELINE_SECTION_DEFINITIONS: SectionDefinition[] = [
  timelineVerticalSection,
  timelineHorizontalSection,
  timelineAlternatingSection,
  timelineMilestoneSection,
  timelineRoadmapSection,
  timelineStorySection,
  timelineProjectSection,
]
