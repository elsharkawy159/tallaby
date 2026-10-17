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
 * Index — list archetype.
 *
 * A narrow column of single-line, text-only rows: category pill, title, then
 * date and read time on the end side. The densest way to show an archive. The
 * headline and the CMS-bound posts collection are slot entries.
 */
function BlogCompactList ({ instance, isPreview, definition }: SectionComponentProps) {
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
          headingClassName={`${TYPE_H2_SM} mb-8 text-foreground`}
          renderItems={({ instance: inst }) => {
            const posts = postsOf(inst)
            if (posts.length === 0) return null
            return (
              <ul className="divide-y divide-border" role="list">
                {posts.map((p, i) => (
                  <li key={i}>
                    <a
                      href={p.href}
                      className="group -mx-3 flex items-center justify-between gap-4 rounded-lg px-3 py-3.5 transition hover:bg-muted/30"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="shrink-0 text-sm font-medium text-muted-foreground">
                          {p.category}
                        </span>
                        <ItemText
                          instance={inst}
                          index={i}
                          field="title"
                          value={p.title}
                          isPreview={isPreview}
                          className="truncate text-sm font-medium text-foreground"
                        />
                      </div>
                      <span className="shrink-0 whitespace-nowrap text-xs text-muted-foreground">
                        {p.date} · {p.readTime}
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            )
          }}
        />
      </SectionContainer>
    </section>
  )
}

export const blogCompactListSection = defineSection({
  id: "blog-compact-list",
  displayName: "Index",
  description: "Text-only archive rows — category pill, title, date and read time on one line each.",
  category: "blog",
  layoutArchetype: "list",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 1,
  industries: ["saas", "law", "finance", "agency", "education", "generic"],
  styles: ["minimal", "corporate", "editorial"],
  goals: ["awareness", "engagement", "brand"],
  complexity: "low",
  density: "high",
  imageRequired: false,
  mobileScore: 96,
  editable: true,
  tags: ["blog", "compact", "list", "minimal"],
  funnelStage: "awareness",
  defaultStyle: SECTION_PADDING_STANDARD,
  defaultOptions: { align: "start", paddingY: "lg" },
  schema: {
    slots: [{ id: "copy", label: "Copy", isDefault: true }],
    blocks: [
      headingBlock({ aiHint: "Section headline (2–4 words)", maxLength: 40 }),
      postsBlock({
        label: "Posts",
        minItems: 1,
        maxItems: 15,
        fields: [
          postField.category(),
          postField.title("Article headline (5–10 words)", 90),
          postField.date(),
          postField.readTime(),
          postField.href(),
        ],
        newItem: () => ({ title: "Post title", category: "Category", date: "Jan 1", readTime: "5 min", href: "#" }),
      }),
    ],
  },
  defaultProps: {
    headline: "Recent articles",
    posts: SAMPLE_POSTS.map((p) => ({
      title: p.title,
      category: p.category,
      date: p.date.replace(/, \d{4}$/, ""),
      readTime: p.readTime,
      href: "#",
    })),
  },
  Component: BlogCompactList,
})
