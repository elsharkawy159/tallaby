"use client"

import { SectionContainer } from "@/components/sections/section-container"
import { SectionSlot } from "@/components/sections/_primitives/section-slot"
import { defineSection } from "@/components/sections/define-section"
import { SECTION_PADDING_STANDARD } from "@/components/sections/section-style-presets"
import { SECTION_THUMB_PLACEHOLDER, useSectionSurface } from "@/components/sections/shared"
import {
  COVER,
  ItemText,
  PostImage,
  SAMPLE_POSTS,
  eyebrowBlock,
  postField,
  postsBlock,
  postsOf,
  stretchItems,
  textBlock,
  type Post,
} from "@/components/sections/blog/blog-parts"
import type { SectionComponentProps, SectionInstance } from "@/components/sections/registry.types"

/**
 * Pinboard — masonry archetype.
 *
 * Two offset columns of post cards — the second column starts lower and the
 * first card is taller — so the grid reads as a pinboard rather than rows. The
 * eyebrow and the CMS-bound posts collection are slot entries.
 */
function MasonryCard ({
  instance,
  post,
  colIdx,
  rowIdx,
  isPreview,
}: {
  instance: SectionInstance
  post: Post
  colIdx: number
  rowIdx: number
  isPreview?: boolean
}) {
  const i = rowIdx * 2 + colIdx
  return (
    <article className="group overflow-hidden rounded-2xl border border-border bg-card transition hover:border-primary/30">
      <div
        className="relative overflow-hidden bg-muted"
        style={{ aspectRatio: rowIdx === 0 && colIdx === 0 ? "4/3" : "16/9" }}
      >
        {post.imageUrl ? (
          <PostImage
            instance={instance}
            post={post}
            index={i}
            elementKey={`img-${i}`}
            isPreview={isPreview}
            className="transition-transform duration-500"
          />
        ) : (
          <div className="absolute inset-0 bg-muted" />
        )}
      </div>
      <div className="flex flex-col gap-2 p-5">
        <span className="text-xs font-semibold text-primary">
          {post.category} · {post.date}
        </span>
        <ItemText
          as="h3"
          instance={instance}
          index={i}
          field="title"
          value={post.title}
          isPreview={isPreview}
          className="text-base font-semibold leading-snug text-foreground"
        />
        <ItemText
          as="p"
          instance={instance}
          index={i}
          field="excerpt"
          value={post.excerpt}
          isPreview={isPreview}
          className="text-sm leading-relaxed text-muted-foreground"
        />
      </div>
    </article>
  )
}

function BlogMasonry ({ instance, isPreview, definition }: SectionComponentProps) {
  const { rootStyle } = useSectionSurface({ instanceId: instance.id })

  return (
    <section style={rootStyle}>
      <SectionContainer>
        <SectionSlot
          instance={instance}
          definition={definition}
          isPreview={isPreview}
          slotId="copy"
          className="flex flex-col"
          entryClassName={stretchItems}
          align="left"
          overrides={{
            eyebrow: textBlock("eyebrow", "mb-8 text-xs font-semibold text-muted-foreground", isPreview),
          }}
          renderItems={({ instance: inst }) => {
            const posts = postsOf(inst)
            if (posts.length === 0) return null
            const col1 = posts.filter((_, i) => i % 2 === 0)
            const col2 = posts.filter((_, i) => i % 2 !== 0)
            return (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div className="flex flex-col gap-5">
                  {col1.map((p, r) => (
                    <MasonryCard key={r * 2} instance={inst} post={p} colIdx={0} rowIdx={r} isPreview={isPreview} />
                  ))}
                </div>
                <div className="flex flex-col gap-5 sm:pt-10">
                  {col2.map((p, r) => (
                    <MasonryCard key={r * 2 + 1} instance={inst} post={p} colIdx={1} rowIdx={r} isPreview={isPreview} />
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

export const blogMasonrySection = defineSection({
  id: "blog-masonry",
  displayName: "Pinboard",
  description: "Two offset columns of post cards with alternating heights, read like a pinboard.",
  category: "blog",
  layoutArchetype: "masonry",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 1,
  industries: ["creative", "agency", "portfolio", "saas", "photography", "generic"],
  styles: ["editorial", "modern", "playful"],
  goals: ["awareness", "engagement", "brand"],
  complexity: "medium",
  density: "high",
  imageRequired: true,
  mobileScore: 87,
  editable: true,
  tags: ["blog", "masonry", "pinterest", "grid"],
  funnelStage: "awareness",
  defaultStyle: SECTION_PADDING_STANDARD,
  defaultOptions: { align: "start", paddingY: "lg" },
  schema: {
    slots: [{ id: "copy", label: "Copy", isDefault: true }],
    blocks: [
      eyebrowBlock(),
      postsBlock({
        label: "Posts",
        minItems: 1,
        maxItems: 8,
        fields: [
          postField.image(),
          postField.imageAlt(),
          postField.category(),
          postField.title("Article headline (5–10 words)", 80),
          postField.excerpt("Short teaser (1–2 sentences)", 200),
          postField.date(),
          postField.href(),
        ],
        newItem: () => ({ title: "Post title", excerpt: "Post excerpt.", imageUrl: "", imageAlt: "", category: "Category", date: "Jan 1, 2025", href: "#" }),
      }),
    ],
  },
  defaultProps: {
    eyebrow: "Inspiration",
    posts: SAMPLE_POSTS.map((p) => ({
      title: p.title,
      excerpt: p.excerpt,
      imageUrl: COVER,
      imageAlt: "",
      category: p.category,
      date: p.date,
      href: "#",
    })),
  },
  Component: BlogMasonry,
})
