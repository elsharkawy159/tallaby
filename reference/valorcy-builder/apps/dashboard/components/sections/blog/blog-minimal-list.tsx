"use client"

import { ArrowRight } from "lucide-react"
import { SectionContainer } from "@/components/sections/section-container"
import { SectionSlot } from "@/components/sections/_primitives/section-slot"
import { defineSection } from "@/components/sections/define-section"
import { TYPE_H2_SM } from "@/components/sections/_primitives/type-scale"
import { SECTION_PADDING_STANDARD } from "@/components/sections/section-style-presets"
import { SECTION_THUMB_PLACEHOLDER, useSectionSurface } from "@/components/sections/shared"
import {
  ItemText,
  SAMPLE_POSTS,
  eyebrowBlock,
  headingBlock,
  postField,
  postsBlock,
  postsOf,
  stretchItems,
  textBlock,
} from "@/components/sections/blog/blog-parts"
import type { SectionComponentProps } from "@/components/sections/registry.types"

/**
 * Margin — minimal archetype.
 *
 * A Medium-style reading index: no images, just a meta line, title and teaser
 * per article with a trailing arrow, in one narrow column. The eyebrow,
 * headline and CMS-bound posts collection are slot entries.
 */
function BlogMinimalList ({ instance, isPreview, definition }: SectionComponentProps) {
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
          overrides={{
            eyebrow: textBlock("eyebrow", "mb-2 text-xs font-semibold text-muted-foreground", isPreview),
          }}
          renderItems={({ instance: inst }) => {
            const posts = postsOf(inst)
            if (posts.length === 0) return null
            return (
              <div className="divide-y divide-border">
                {posts.map((p, i) => (
                  <article key={i} className="group py-6 first:pt-0 last:pb-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="font-semibold text-primary">{p.category}</span>
                          <span>·</span><span>{p.date}</span><span>·</span><span>{p.readTime}</span>
                        </div>
                        <ItemText
                          as="h3"
                          instance={inst}
                          index={i}
                          field="title"
                          value={p.title}
                          isPreview={isPreview}
                          className="text-lg font-semibold leading-snug tracking-tight text-foreground"
                        />
                        <ItemText
                          as="p"
                          instance={inst}
                          index={i}
                          field="excerpt"
                          value={p.excerpt}
                          isPreview={isPreview}
                          className="mt-1.5 text-sm leading-relaxed text-muted-foreground"
                        />
                      </div>
                      <ArrowRight
                        className="mt-1 size-5 shrink-0 text-muted-foreground/40 transition group-hover:translate-x-0.5 group-hover:text-primary rtl:rotate-180 rtl:group-hover:-translate-x-0.5"
                        aria-hidden
                      />
                    </div>
                  </article>
                ))}
              </div>
            )
          }}
        />
      </SectionContainer>
    </section>
  )
}

export const blogMinimalListSection = defineSection({
  id: "blog-minimal-list",
  displayName: "Margin",
  description: "Image-free reading index — meta line, title, teaser and arrow per article in one narrow column.",
  category: "blog",
  layoutArchetype: "minimal",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 1,
  industries: ["saas", "agency", "portfolio", "creative", "education", "law", "generic"],
  styles: ["minimal", "editorial", "modern"],
  goals: ["awareness", "engagement", "brand"],
  complexity: "low",
  density: "medium",
  imageRequired: false,
  mobileScore: 95,
  editable: true,
  tags: ["blog", "list", "minimal", "text"],
  funnelStage: "awareness",
  defaultStyle: SECTION_PADDING_STANDARD,
  defaultOptions: { align: "start", paddingY: "lg" },
  schema: {
    slots: [{ id: "copy", label: "Copy", isDefault: true }],
    blocks: [
      eyebrowBlock({ aiHint: "Short label above the headline (1–3 words)" }),
      headingBlock({ aiHint: "Section headline (3–6 words)", maxLength: 60 }),
      postsBlock({
        label: "Blogs",
        minItems: 1,
        maxItems: 10,
        fields: [
          postField.category(),
          postField.title("Article headline (6–10 words)", 90),
          postField.excerpt("One-line teaser (15–30 words)", 200),
          postField.date(),
          postField.readTime(),
          postField.href(),
        ],
        newItem: () => ({ title: "Article title", excerpt: "Short description.", category: "Category", date: "Jan 1, 2025", readTime: "5 min read", href: "#" }),
      }),
    ],
  },
  defaultProps: {
    eyebrow: "Writing",
    headline: "Essays and field notes",
    posts: SAMPLE_POSTS.slice(0, 4).map((p) => ({
      title: p.title,
      excerpt: p.excerpt,
      category: p.category,
      date: p.date,
      readTime: `${p.readTime} read`,
      href: "#",
    })),
  },
  Component: BlogMinimalList,
})

