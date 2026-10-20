"use client"

import { ArrowRight, Clock } from "lucide-react"
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
} from "@/components/sections/blog/blog-parts"
import type { SectionComponentProps } from "@/components/sections/registry.types"

/**
 * Spotlight — split archetype.
 *
 * The first post is the lead: a large card with its cover and category badge on
 * the start side. The next three stack as compact thumbnail rows on the end
 * side. Which post leads is the collection's order, so the CMS binding's "featured
 * first" sort drives the layout. The eyebrow and the posts collection are slot
 * entries.
 */
function BlogFeaturedSplit ({ instance, isPreview, definition }: SectionComponentProps) {
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
            return (
              <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
                {featured && (
                  <article className="group relative flex flex-col overflow-hidden rounded-3xl border border-border bg-card">
                    <div className="relative aspect-[16/10] overflow-hidden bg-muted">
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
                      <span className="absolute start-4 top-4 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                        {featured.category}
                      </span>
                    </div>
                    <div className="flex flex-1 flex-col gap-3 p-6">
                      <ItemText
                        as="h2"
                        instance={inst}
                        index={0}
                        field="title"
                        value={featured.title}
                        isPreview={isPreview}
                        className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
                      />
                      <ItemText
                        as="p"
                        instance={inst}
                        index={0}
                        field="excerpt"
                        value={featured.excerpt}
                        isPreview={isPreview}
                        className="flex-1 text-sm leading-relaxed text-muted-foreground"
                      />
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>{featured.date}</span><span>·</span>
                        <span className="flex items-center gap-1"><Clock className="size-3" />{featured.readTime}</span>
                      </div>
                    </div>
                  </article>
                )}
                <div className="flex flex-col gap-4">
                  {rest.slice(0, 3).map((p, j) => {
                    const i = j + 1
                    return (
                      <article
                        key={i}
                        className="group flex gap-4 rounded-2xl border border-border bg-card p-4 transition hover:border-primary/30"
                      >
                        <div className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-muted">
                          {p.imageUrl ? (
                            <PostImage
                              instance={inst}
                              post={p}
                              index={i}
                              elementKey={`sm-img-${j}`}
                              isPreview={isPreview}
                              className="transition-transform duration-500"
                            />
                          ) : (
                            <div className="absolute inset-0 bg-muted" />
                          )}
                        </div>
                        <div className="flex flex-1 flex-col gap-1.5">
                          <span className="text-xs font-semibold text-primary">{p.category}</span>
                          <ItemText
                            as="h3"
                            instance={inst}
                            index={i}
                            field="title"
                            value={p.title}
                            isPreview={isPreview}
                            className="text-sm font-semibold leading-snug text-foreground"
                          />
                          <span className="text-xs text-muted-foreground">{p.date} · {p.readTime}</span>
                        </div>
                        <ArrowRight className="size-4 shrink-0 self-center text-muted-foreground/50 transition group-hover:text-primary rtl:rotate-180" />
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

export const blogFeaturedSplitSection = defineSection({
  id: "blog-featured-split",
  displayName: "Spotlight",
  description: "A large lead post on one side, three compact thumbnail rows stacked on the other.",
  category: "blog",
  layoutArchetype: "split",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 1,
  industries: ["saas", "agency", "creative", "portfolio", "education", "generic"],
  styles: ["editorial", "modern", "minimal"],
  goals: ["awareness", "engagement", "brand"],
  complexity: "medium",
  density: "high",
  imageRequired: true,
  mobileScore: 88,
  editable: true,
  tags: ["blog", "featured", "split", "editorial"],
  funnelStage: "awareness",
  defaultStyle: SECTION_PADDING_STANDARD,
  defaultOptions: { align: "start", paddingY: "lg" },
  schema: {
    slots: [{ id: "copy", label: "Copy", isDefault: true }],
    blocks: [
      eyebrowBlock({ aiHint: "Short label above posts (1–3 words)" }),
      postsBlock({
        label: "Posts (first is featured)",
        minItems: 1,
        maxItems: 7,
        fields: [
          postField.image(),
          postField.imageAlt(),
          postField.category(),
          postField.title("Article title (5–10 words)", 80),
          postField.excerpt("Short excerpt (1–2 sentences)", 200),
          postField.date(),
          postField.readTime(),
          postField.href(),
        ],
        newItem: () => ({ title: "Post title", excerpt: "Post excerpt.", imageUrl: "", imageAlt: "", category: "Category", date: "Jan 1, 2025", readTime: "5 min", href: "#" }),
      }),
    ],
  },
  defaultProps: {
    eyebrow: "Featured reading",
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
  Component: BlogFeaturedSplit,
})
