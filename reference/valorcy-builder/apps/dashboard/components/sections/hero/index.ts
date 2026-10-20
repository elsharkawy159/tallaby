import type { SectionDefinition } from "@/components/sections/registry.types"
import { heroMomentumSection } from "@/components/sections/hero/hero-momentum"
import { heroSpotlightSection } from "@/components/sections/hero/hero-spotlight"
import { heroAtlasSection } from "@/components/sections/hero/hero-atlas"
import { heroMosaicSection } from "@/components/sections/hero/hero-mosaic"
import { heroQuillSection } from "@/components/sections/hero/hero-quill"
import { heroReelSection } from "@/components/sections/hero/hero-reel"
import { heroSignalSection } from "@/components/sections/hero/hero-signal"
import { heroForgeSection } from "@/components/sections/hero/hero-forge"
import { heroCounselSection } from "@/components/sections/hero/hero-counsel"
import { heroMarqueeSection } from "@/components/sections/hero/hero-marquee"

/**
 * Hero catalog — 10 sections, one per layout archetype.
 *
 * Curated down from 15 near-duplicates: the old set had four splits, six centered
 * variants, three full-bleed photo heroes, and two different sections both named
 * "Hero — bento". Every retired id resolves through SECTION_ID_ALIASES, so pages
 * saved against the old catalog keep rendering.
 */
export const HERO_SECTION_DEFINITIONS: SectionDefinition[] = [
  heroMomentumSection,
  heroSpotlightSection,
  heroAtlasSection,
  heroMosaicSection,
  heroQuillSection,
  heroReelSection,
  heroSignalSection,
  heroForgeSection,
  heroCounselSection,
  heroMarqueeSection,
]
