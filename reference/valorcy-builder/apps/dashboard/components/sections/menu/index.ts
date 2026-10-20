import type { SectionDefinition } from '@/components/sections/registry.types'
import { menuSimpleSection } from '@/components/sections/menu/menu-simple'
import { menuGridSection } from '@/components/sections/menu/menu-grid'
import { menuFeaturedSection } from '@/components/sections/menu/menu-featured'
import { menuPrixFixeSection } from '@/components/sections/menu/menu-prix-fixe'
import { menuChalkboardSection } from '@/components/sections/menu/menu-chalkboard'
import { menuDrinksSection } from '@/components/sections/menu/menu-drinks'
import { menuTwoColSection } from '@/components/sections/menu/menu-two-col'
import { menuCardsSection } from '@/components/sections/menu/menu-cards'
import { menuTastingSection } from '@/components/sections/menu/menu-tasting'
import { menuDailySpecialsSection } from '@/components/sections/menu/menu-daily-specials'
import { menuCoffeeSection } from '@/components/sections/menu/menu-coffee'
import { menuBannerSection } from '@/components/sections/menu/menu-banner'
import { menuWineSection } from '@/components/sections/menu/menu-wine'
import { menuSeasonalSection } from '@/components/sections/menu/menu-seasonal'
import { menuSplitImageSection } from '@/components/sections/menu/menu-split-image'
import { menuAccordionSection } from '@/components/sections/menu/menu-accordion'
import { menuDeliverySection } from '@/components/sections/menu/menu-delivery'
import { menuBentoSection } from '@/components/sections/menu/menu-bento'
import { menuTakeawaySection } from '@/components/sections/menu/menu-takeaway'
import { menuMinimalDarkSection } from '@/components/sections/menu/menu-minimal-dark'

export const MENU_SECTION_DEFINITIONS: SectionDefinition[] = [
  menuSimpleSection,
  menuGridSection,
  menuFeaturedSection,
  menuPrixFixeSection,
  menuTwoColSection,
  menuChalkboardSection,
  menuMinimalDarkSection,
  menuCardsSection,
  menuBentoSection,
  menuDailySpecialsSection,
  menuSplitImageSection,
  menuBannerSection,
  menuTastingSection,
  menuDrinksSection,
  menuWineSection,
  menuCoffeeSection,
  menuSeasonalSection,
  menuAccordionSection,
  menuDeliverySection,
  menuTakeawaySection,
]
