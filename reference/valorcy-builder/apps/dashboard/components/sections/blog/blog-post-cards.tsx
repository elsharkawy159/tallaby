"use client"

import { SectionContainer } from "@/components/sections/section-container"
import { SectionSlot } from "@/components/sections/_primitives/section-slot"
import { defineSection } from "@/components/sections/define-section"
import { TYPE_BODY, TYPE_H2 } from "@/components/sections/_primitives/type-scale"
import { SECTION_PADDING_STANDARD } from "@/components/sections/section-style-presets"
import { SECTION_THUMB_PLACEHOLDER, useSectionSurface } from "@/components/sections/shared"
import {
  COVER,
  ItemText,
  PostImage,
  textOr,
  SAMPLE_POSTS,
  postField,
  postsBlock,
  postsOf,
  standardHeader,
  stretchItems,
  textBlock,
} from "@/components/sections/blog/blog-parts"
import type { SectionComponentProps } from "@/components/sections/registry.types"

/**
 * Dispatch — linked-cards archetype.
 *
 * Centered header over a three-column grid of post cards, each leading with a
 * 16:9 cover and closing with its own "read" link. The card chrome is identity;
 * the header lines and the posts collection are slot entries. The posts list is
 * the CMS-bound collection and renders whatever the binding injects.
 */
function BlogPostCards ({ instance, isPreview, definition }: SectionComponentProps) {
  const { rootStyle } = useSectionSurface({ instanceId: instance.id })

  return (
    <section className="bg-background" style={rootStyle}>
      <SectionContainer>
        <SectionSlot
          instance={instance}
          definition={definition}
          isPreview={isPreview}
          slotId="copy"
          className="flex flex-col items-center text-center"
          entryClassName={stretchItems}
          align="center"
          headingClassName={`${TYPE_H2} text-foreground`}
          bodyClassName={`${TYPE_BODY} mt-4`}
          overrides={{
            eyebrow: textBlock(
              "eyebrow",
              "inline-flex items-center rounded-full border border-border bg-card/60 px-3 py-1 text-xs font-semibold text-muted-foreground mb-5",
              isPreview,
              "div"
            ),
          }}
          renderItems={({ instance: inst }) => {
            const posts = postsOf(inst)
            if (posts.length === 0) return null
            return (
              <div className="mt-14 grid grid-cols-1 gap-5 text-start sm:grid-cols-2 md:gap-6 lg:grid-cols-3">
                {posts.map((p, i) => (
                  <article
                    key={i}
                    className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all hover:border-primary/30"
                  >
                    <div className="relative aspect-[16/9] flex-shrink-0 overflow-hidden bg-muted">
                      {p.imageUrl ? (
                        <PostImage
                          instance={inst}
                          post={p}
                          index={i}
                          elementKey={`post${i}Image`}
                          loading="lazy"
                          isPreview={isPreview}
                          className="transition-transform duration-500"
                        />
                      ) : (
                        <div aria-hidden className="absolute inset-0 bg-grid opacity-60" />
                      )}
                    </div>
                    <div className="flex flex-1 flex-col gap-3 p-6">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-muted-foreground">
                          <ItemText instance={inst} index={i} field="category" value={p.category} isPreview={isPreview} />
                        </span>
                        <span className="text-[12px] text-muted-foreground">·</span>
                        <ItemText
                          instance={inst}
                          index={i}
                          field="date"
                          value={p.date}
                          isPreview={isPreview}
                          className="text-[12px] text-muted-foreground"
                        />
                      </div>
                      <ItemText
                        as="h3"
                        instance={inst}
                        index={i}
                        field="title"
                        value={p.title}
                        isPreview={isPreview}
                        className="text-[17px] font-semibold leading-[1.3] tracking-[-0.013em] text-foreground"
                      />
                      <ItemText
                        as="p"
                        instance={inst}
                        index={i}
                        field="excerpt"
                        value={p.excerpt}
                        isPreview={isPreview}
                        className="flex-1 text-[14px] leading-relaxed text-muted-foreground"
                      />
                      <div className="mt-1">
                        <a
                          href={isPreview ? p.href : undefined}
                          data-element-collection="posts"
                          data-element-index={String(i)}
                          data-element-item-href-prop="href"
                          className="inline-flex items-center gap-1.5 text-[13.5px] font-medium text-primary transition-colors"
                        >
                          {/* One label shared by every card, so it is edited once in the inspector. */}
                          {textOr(inst, "readMoreText", "")}
                         
                        </a>
                      </div>
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

export const blogPostCardsSection = defineSection({
  id: "blog-post-cards",
  displayName: "Dispatch",
  description: "Centered header over three-column post cards, each with a cover, category chip and its own read link.",
  category: "blog",
  layoutArchetype: "linked-cards",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 2,
  industries: ["photography", "podcast", "saas", "agency", "creative", "portfolio", "education", "generic", "law", "real_estate", "dentist", "fitness"],
  styles: ["modern", "minimal", "editorial"],
  goals: ["awareness", "engagement", "brand"],
  complexity: "medium",
  density: "medium",
  imageRequired: true,
  mobileScore: 88,
  editable: true,
  tags: ["blog", "cards"],
  funnelStage: "awareness",
  migrateProps (oldProps, fromVersion) {
    if (fromVersion < 2) return blogPostCardsSection.defaultProps
    return oldProps
  },
  defaultStyle: SECTION_PADDING_STANDARD,
  rootStyleOptions: { applySectionPadding: false },
  defaultOptions: { align: "center", paddingY: "lg" },
  schema: {
    slots: [{ id: "copy", label: "Copy", isDefault: true }],
    blocks: [
      ...standardHeader(),
      postsBlock({
        label: "Posts",
        minItems: 1,
        maxItems: 9,
        fields: [
          postField.image(),
          postField.imageAlt("Accessible alt text for the image (describe what is shown)"),
          postField.category(),
          postField.date(),
          postField.title("Section title (4–8 words)", 60),
          postField.excerpt("Short excerpt (1–2 sentences)", 180),
          postField.href(),
        ],
        newItem: () => ({ imageUrl: "", imageAlt: "", category: "Category", date: "Jan 1, 2025", title: "Post title", excerpt: "Post excerpt.", href: "#" }),
      }),
    ],
    settings: [{ key: "readMoreText", label: "Read more label", type: "text", maxLength: 30, group: "cta" }],
  },
  defaultProps: {
    eyebrow: "From the blog",
    headline: "Ideas worth",
    accentWord: "reading",
    description: "Practical guides, product notes and lessons learned from building in public.",
    readMoreText: "Read article",
    posts: SAMPLE_POSTS.slice(0, 3).map((p) => ({
      imageUrl: COVER,
      imageAlt: "",
      category: p.category,
      date: p.date,
      title: p.title,
      excerpt: p.excerpt,
      href: "#",
    })),
  },
  Component: BlogPostCards,
})
