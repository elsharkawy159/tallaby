import type { SectionDefinition } from '@/components/sections/registry.types'
import { articleGridSection } from '@/components/sections/blog/article-grid'
import { blogCardListSection } from '@/components/sections/blog/blog-card-list'
import { blogPostCardsSection } from '@/components/sections/blog/blog-post-cards'
import { featuredPostHeroSection } from '@/components/sections/blog/featured-post-hero'
import { newsletterOptinSection } from '@/components/sections/blog/newsletter-optin'
import { blogFeaturedSplitSection } from '@/components/sections/blog/blog-featured-split'
import { blogMinimalListSection } from '@/components/sections/blog/blog-minimal-list'
import { blogTwoColSection } from '@/components/sections/blog/blog-two-col'
import { blogSingleFeaturedSection } from '@/components/sections/blog/blog-single-featured'
import { blogTimelineSection } from '@/components/sections/blog/blog-timeline'
import { blogDarkSection } from '@/components/sections/blog/blog-dark'
import { blogCompactListSection } from '@/components/sections/blog/blog-compact-list'
import { blogCtaInlineSection } from '@/components/sections/blog/blog-cta-inline'
import { blogLatestSingleSection } from '@/components/sections/blog/blog-latest-single'
import { blogMasonrySection } from '@/components/sections/blog/blog-masonry'
import { blogTickerSection } from '@/components/sections/blog/blog-ticker'
import { blogAuthorSpotlightSection } from '@/components/sections/blog/blog-author-spotlight'
import { blogMagazineSection } from '@/components/sections/blog/blog-magazine'
import { blogEditorialSection } from '@/components/sections/blog/blog-editorial'
import { blogCategoryTabsSection } from '@/components/sections/blog/blog-category-tabs'

export const BLOG_SECTION_DEFINITIONS: SectionDefinition[] = [
  // Original 3
  blogPostCardsSection,
  articleGridSection,
  blogCardListSection,
  // Reinstated
  featuredPostHeroSection,
  newsletterOptinSection,
  // New unique layouts
  blogFeaturedSplitSection,
  blogSingleFeaturedSection,
  blogMagazineSection,
  blogEditorialSection,
  blogTwoColSection,
  blogDarkSection,
  blogMasonrySection,
  blogLatestSingleSection,
  blogMinimalListSection,
  blogTimelineSection,
  blogCompactListSection,
  blogAuthorSpotlightSection,
  blogCtaInlineSection,
  blogTickerSection,
  blogCategoryTabsSection,
]
