import type { SectionDefinition } from '@/components/sections/registry.types'
import { statsGridSection } from '@/components/sections/stats/stats-grid'
import { statsBannerSection } from '@/components/sections/stats/stats-banner'
import { statsSplitSection } from '@/components/sections/stats/stats-split'
import { statsTickerSection } from '@/components/sections/stats/stats-ticker'
import { statsBigNumberSection } from '@/components/sections/stats/stats-big-number'
import { statsBadgedSection } from '@/components/sections/stats/stats-badged'
import { statsGrowthSection } from '@/components/sections/stats/stats-growth'
import { statsRestaurantSection } from '@/components/sections/stats/stats-restaurant'
import { statsPortfolioSection } from '@/components/sections/stats/stats-portfolio'
import { statsDentalSection } from '@/components/sections/stats/stats-dental'

export const STATS_SECTION_DEFINITIONS: SectionDefinition[] = [
  statsGridSection,
  statsBannerSection,
  statsSplitSection,
  statsTickerSection,
  statsBigNumberSection,
  statsBadgedSection,
  statsGrowthSection,
  statsRestaurantSection,
  statsPortfolioSection,
  statsDentalSection,
]
