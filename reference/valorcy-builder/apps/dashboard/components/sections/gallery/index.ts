import type { SectionDefinition } from '@/components/sections/registry.types'
import { galleryMasonrySection } from '@/components/sections/gallery/gallery-masonry'
import { galleryGridSection } from '@/components/sections/gallery/gallery-grid'
import { galleryRowSection } from '@/components/sections/gallery/gallery-row'
import { gallerySpotlightSection } from '@/components/sections/gallery/gallery-spotlight'
import { galleryCarouselSection } from '@/components/sections/gallery/gallery-carousel'
import { galleryTilesSection } from '@/components/sections/gallery/gallery-tiles'
import { galleryWorkShowcaseSection } from '@/components/sections/gallery/gallery-work-showcase'
import { galleryDestinationsSection } from '@/components/sections/gallery/gallery-destinations'

export const GALLERY_SECTION_DEFINITIONS: SectionDefinition[] = [
  galleryMasonrySection,
  galleryGridSection,
  galleryRowSection,
  gallerySpotlightSection,
  galleryCarouselSection,
  galleryTilesSection,
  galleryWorkShowcaseSection,
  galleryDestinationsSection,
]
