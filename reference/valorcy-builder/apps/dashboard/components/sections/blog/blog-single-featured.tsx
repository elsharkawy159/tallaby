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
  textOr,
} from "@/components/sections/blog/blog-parts"
import type { SectionComponentProps } from "@/components/sections/registry.types"

/** Pre-migration pages rendered this literal under the lead post. */
const READ_FALLBACK = "Read article"

/**
 * Headliner — tiered archetype.
 *
 * Two tiers: the first post as a full-width card (cover beside copy and a read
 * link), then a row of three smaller posts beneath it. The eyebrow and the
 * CMS-bound posts collection are slot entries.
 */
function BlogSingleFeatured ({ instance, isPreview, definition }: SectionComponentProps) {
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
            const [featured, ...rest] = posts
            const readLabel = textOr(inst, "readLabel", READ_FALLBACK)
            return (
              <div>
                {featured && (
                  <article className="group mb-10 grid overflow-hidden rounded-3xl border border-border bg-card lg:grid-cols-2">
                    <div className="relative aspect-[4/3] overflow-hidden bg-muted lg:aspect-auto">
                      {featured.imageUrl ? (
                        <PostImage
                          instance={inst}
                          post={featured}
                          index={0}
                          elementKey="feat-img"
                          isPreview={isPreview}
                          className="transition-transform duration-500"
                        />
                      ) : (
                        <div className="absolute inset-0 bg-muted" />
                      )}
                    </div>
                    <div className="flex flex-col justify-center gap-4 p-8 lg:p-10">
                      <span className="text-xs font-semibold text-primary">{featured.category}</span>
                      <ItemText
                        as="h2"
                        instance={inst}
                        index={0}
                        field="title"
                        value={featured.title}
                        isPreview={isPreview}
                        className="text-2xl font-semibold tracking-tight text-foreground lg:text-3xl"
                      />
                      <ItemText
                        as="p"
                        instance={inst}
                        index={0}
                        field="excerpt"
                        value={featured.excerpt}
                        isPreview={isPreview}
                        className="text-sm leading-relaxed text-muted-foreground"
                      />
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>{featured.date}</span><span>·</span><span>{featured.readTime}</span>
                      </div>
                      {readLabel !== "" && (
                        <a
                          href={featured.href}
                          className="inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-primary transition hover:gap-2.5"
                        >
                          {readLabel}
                        </a>
                      )}
                    </div>
                  </article>
                )}
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                  {rest.slice(0, 3).map((p, j) => {
                    const i = j + 1
                    return (
                      <article key={i} className="group">
                        <div className="relative mb-4 aspect-[3/2] overflow-hidden rounded-2xl bg-muted">
                          {p.imageUrl ? (
                            <PostImage
                              instance={inst}
                              post={p}
                              index={i}
                              elementKey={`sm-${j}`}
                              isPreview={isPreview}
                              className="transition-transform duration-500"
                            />
                          ) : (
                            <div className="absolute inset-0 bg-muted" />
                          )}
                        </div>
                        <span className="text-xs font-semibold text-primary">{p.category}</span>
                        <ItemText
                          as="h3"
                          instance={inst}
                          index={i}
                          field="title"
                          value={p.title}
                          isPreview={isPreview}
                          className="mt-1.5 text-base font-semibold leading-snug text-foreground"
                        />
                        <span className="mt-1 block text-xs text-muted-foreground">{p.date} · {p.readTime}</span>
                      </article>
                    )
                  })}
                </div>
              </div>
            )
          }}
        />
      </SectionContainer>
    </section>
  )
}

export const blogSingleFeaturedSection = defineSection({
  id: "blog-single-featured",
  displayName: "Headliner",
  description: "One full-width lead post card above a row of three smaller posts.",
  category: "blog",
  layoutArchetype: "tiered",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 1,
  industries: ["saas", "agency", "creative", "portfolio", "education", "generic"],
  styles: ["modern", "editorial", "minimal"],
  goals: ["awareness", "engagement", "brand"],
  complexity: "medium",
  density: "high",
  imageRequired: true,
  mobileScore: 88,
  editable: true,
  tags: ["blog", "hero", "featured", "grid"],
  funnelStage: "awareness",
  defaultStyle: SECTION_PADDING_STANDARD,
  defaultOptions: { align: "start", paddingY: "lg" },
  schema: {
    slots: [{ id: "copy", label: "Copy", isDefault: true }],
    blocks: [
      eyebrowBlock({ aiHint: "Short label above posts (1–3 words)" }),
      postsBlock({
        label: "Posts (first is hero)",
        minItems: 1,
        maxItems: 7,
        fields: [
          postField.image(),
          postField.imageAlt(),
          postField.category(),
          postField.title("Article title (5–10 words)", 90),
          postField.excerpt("Short excerpt (1–3 sentences)", 280),
          postField.date(),
          postField.readTime(),
          postField.href(),
        ],
        newItem: () => ({ title: "Post title", excerpt: "Post excerpt.", imageUrl: "", imageAlt: "", category: "Category", date: "Jan 1, 2025", readTime: "5 min", href: "#" }),
      }),
    ],
    settings: [
      { key: "readLabel", label: "Read link label", type: "text", canonical: "ctaPrimary", aiHint: "Link label under the lead post (1–3 words)", maxLength: 24, group: "cta" },
    ],
  },
  defaultProps: {
    eyebrow: "Editor's pick",
    readLabel: READ_FALLBACK,
    posts: SAMPLE_POSTS.slice(0, 4).map((p) => ({
      title: p.title,
      excerpt: p.excerpt,
      imageUrl: COVER,
      imageAlt: "",
      category: p.category,
      date: p.date,
      readTime: p.readTime,
      href: "#",
    })),
  },
  Component: BlogSingleFeatured,
})
