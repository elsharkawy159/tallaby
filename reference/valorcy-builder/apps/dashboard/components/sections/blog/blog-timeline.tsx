"use client"

import { SectionContainer } from "@/components/sections/section-container"
import { SectionSlot } from "@/components/sections/_primitives/section-slot"
import { defineSection } from "@/components/sections/define-section"
import { TYPE_H2_SM } from "@/components/sections/_primitives/type-scale"
import { SECTION_PADDING_STANDARD } from "@/components/sections/section-style-presets"
import { SECTION_THUMB_PLACEHOLDER, useSectionSurface } from "@/components/sections/shared"
import {
  ItemText,
  SAMPLE_POSTS,
  headingBlock,
  postField,
  postsBlock,
  postsOf,
  stretchItems,
} from "@/components/sections/blog/blog-parts"
import type { SectionComponentProps } from "@/components/sections/registry.types"

/**
 * Chronicle — timeline archetype.
 *
 * A chronological feed hung from one vertical rule: a dot per post, then its
 * meta line, title and teaser. No images — the rule carries the rhythm. The
 * headline and the CMS-bound posts collection are slot entries.
 */
function BlogTimeline ({ instance, isPreview, definition }: SectionComponentProps) {
  const { rootStyle } = useSectionSurface({ instanceId: instance.id })

  return (
    <section style={rootStyle}>
      <SectionContainer className="max-w-2xl">
        <SectionSlot
          instance={instance}
          definition={definition}
          isPreview={isPreview}
          slotId="copy"
          className="flex flex-col"
          entryClassName={stretchItems}
          align="left"
          headingClassName={`${TYPE_H2_SM} mb-12 text-foreground`}
          renderItems={({ instance: inst }) => {
            const posts = postsOf(inst)
            if (posts.length === 0) return null
            return (
              <div className="relative ps-6">
                <div className="absolute bottom-2 start-0 top-2 w-px bg-border/70" aria-hidden />
                <div className="flex flex-col gap-8">
                  {posts.map((p, i) => (
                    <article key={i} className="group relative">
                      <div
                        className="absolute -start-[1.625rem] top-1 size-2.5 rounded-full border-2 border-background bg-primary ring-2 ring-primary/40 transition"
                        aria-hidden
                      />
                      <div className="mb-2 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                        <span className="font-semibold text-primary">{p.category}</span>
                        <span>·</span><span>{p.date}</span><span>·</span><span>{p.readTime} read</span>
                      </div>
                      <ItemText
                        as="h3"
                        instance={inst}
                        index={i}
                        field="title"
                        value={p.title}
                        isPreview={isPreview}
                        className="text-base font-semibold leading-snug text-foreground transition group-hover:text-primary"
                      />
                      <ItemText
                        as="p"
                        instance={inst}
                        index={i}
                        field="excerpt"
                        value={p.excerpt}
                        isPreview={isPreview}
                        className="mt-1 text-sm leading-relaxed text-muted-foreground"
                      />
                    </article>
                  ))}
                </div>
              </div>
            )
          }}
        />
      </SectionContainer>
    </section>
  )
}

export const blogTimelineSection = defineSection({
  id: "blog-timeline",
  displayName: "Chronicle",
  description: "Chronological feed on a vertical rule — a dot, meta line, title and teaser per post.",
  category: "blog",
  layoutArchetype: "timeline",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 1,
  industries: ["saas", "agency", "law", "education", "portfolio", "generic"],
  styles: ["minimal", "editorial", "modern"],
  goals: ["awareness", "engagement", "brand"],
  complexity: "low",
  density: "medium",
  imageRequired: false,
  mobileScore: 95,
  editable: true,
  tags: ["blog", "timeline", "feed", "minimal"],
  funnelStage: "awareness",
  defaultStyle: SECTION_PADDING_STANDARD,
  defaultOptions: { align: "start", paddingY: "lg" },
  schema: {
    slots: [{ id: "copy", label: "Copy", isDefault: true }],
    blocks: [
      headingBlock({ aiHint: "Section headline (3–6 words)", maxLength: 60 }),
      postsBlock({
        label: "Posts",
        minItems: 1,
        maxItems: 12,
        fields: [
          postField.category(),
          postField.title("Article headline (5–10 words)", 90),
          postField.excerpt("One-sentence teaser", 160),
          postField.date(),
          postField.readTime(),
          postField.href(),
        ],
        newItem: () => ({ title: "Post title", excerpt: "Short teaser.", category: "Category", date: "Jan 1, 2025", readTime: "5 min", href: "#" }),
      }),
    ],
  },
  defaultProps: {
    headline: "What we have been writing",
    posts: SAMPLE_POSTS.map((p) => ({
      title: p.title,
      excerpt: p.excerpt,
      category: p.category,
      date: p.date,
      readTime: p.readTime,
      href: "#",
    })),
  },
  Component: BlogTimeline,
})
