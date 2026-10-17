import type { SectionDefinition } from '@/components/sections/registry.types'
import { navbarSimpleSection } from '@/components/sections/navbar/navbar-simple'
import { navbarPillSection } from '@/components/sections/navbar/navbar-pill'
import { navbarAppSection } from '@/components/sections/navbar/navbar-app'
import { navbarTransparentSection } from '@/components/sections/navbar/navbar-transparent'
import { navbarMegaSection } from '@/components/sections/navbar/navbar-mega'
import { navbarStickySection } from '@/components/sections/navbar/navbar-sticky'

export const NAVBAR_SECTION_DEFINITIONS: SectionDefinition[] = [
  navbarSimpleSection,
  navbarPillSection,
  navbarAppSection,
  navbarTransparentSection,
  navbarMegaSection,
  navbarStickySection,
]
