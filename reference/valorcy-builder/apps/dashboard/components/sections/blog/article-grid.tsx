"use client"

import { Clock } from "lucide-react"
import { SectionContainer } from "@/components/sections/section-container"
import { SectionSlot } from "@/components/sections/_primitives/section-slot"
import { defineSection } from "@/components/sections/define-section"
import { TYPE_BODY, TYPE_H2 } from "@/components/sections/_primitives/type-scale"
import { SECTION_PADDING_STANDARD } from "@/components/sections/section-style-presets"
import { SECTION_THUMB_PLACEHOLDER, SectionEditableImage, useSectionSurface } from "@/components/sections/shared"
import {
  AVATAR,
  COVER,
  ItemText,
  PostImage,
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
 * Journal — grid archetype.
 *
 * Centered header over three columns of rounded cards: a 4:3 cover with the
 * category badge laid over it, title and excerpt, then an author footer with
 * avatar, date, read time and an arrow link. Card chrome is identity; the header
 * lines and the CMS-bound posts collection are slot entries.
 */
function ArticleGrid ({ instance, isPreview, definition }: SectionComponentProps) {
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
                    className="group flex flex-col overflow-hidden rounded-3xl border border-border bg-card transition-all hover:border-primary/30"
                  >
                    <div className="relative aspect-[4/3] flex-shrink-0 overflow-hidden bg-muted">
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
                      <span className="absolute start-3 top-3 inline-flex items-center rounded-full border border-primary/60 bg-[color-mix(in_oklch,var(--primary)_80%,black)] px-2.5 py-1 text-xs font-semibold text-primary-foreground">
                        {p.category}
                      </span>
                    </div>

                    <div className="flex flex-1 flex-col gap-2.5 p-6">
                      <ItemText
                        as="h3"
                        instance={inst}
                        index={i}
                        field="title"
                        value={p.title}
                        isPreview={isPreview}
                        className="text-[17px] font-semibold leading-[1.3] tracking-[-0.014em] text-foreground"
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

                      <div className="mt-2 flex items-center gap-3 border-t border-border pt-4">
                        {p.authorAvatarUrl && (
                          <SectionEditableImage
                            instanceId={inst.id}
                            elementKey={`post${i}AuthorAvatar`}
                            src={p.authorAvatarUrl}
                            alt={p.authorName ?? ""}
                            collectionKey="posts"
                            collectionIndex={i}
                            itemSrcProp="authorAvatarUrl"
                            isPreview={isPreview}
                            className="size-[34px] flex-shrink-0 rounded-full border-2 border-border object-cover"
                          />
                        )}
                        <div className="min-w-0 flex-1">
                          <ItemText
                            as="div"
                            instance={inst}
                            index={i}
                            field="authorName"
                            value={p.authorName}
                            isPreview={isPreview}
                            className="text-[13px] font-semibold leading-tight text-foreground"
                          />
                          <div className="mt-0.5 flex items-center gap-1.5">
                            <ItemText
                              instance={inst}
                              index={i}
                              field="date"
                              value={p.date}
                              isPreview={isPreview}
                              className="text-[12px] text-muted-foreground"
                            />
                            <span className="text-[12px] text-border">·</span>
                            <span className="flex items-center gap-1 text-[12px] text-muted-foreground">
                              <Clock className="size-3" aria-hidden />
                              <ItemText instance={inst} index={i} field="readTime" value={p.readTime} isPreview={isPreview} />
                            </span>
                          </div>
                        </div>
                        <a
                          href={isPreview ? p.href : undefined}
                          data-element-collection="posts"
                          data-element-index={String(i)}
                          data-element-item-href-prop="href"
                          className="flex size-9 flex-shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/10 hover:text-primary"
                          aria-label={`Read ${p.title ?? ""}`}
                        >
                         
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

export const articleGridSection = defineSection({
  id: "article-grid",
  displayName: "Journal",
  description: "Three-column rounded cards with a category badge over the cover and an author footer.",
  category: "blog",
  layoutArchetype: "grid",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 2,
  industries: ["saas", "agency", "portfolio", "creative", "education", "generic"],
  styles: ["modern", "minimal", "editorial"],
  goals: ["awareness", "engagement", "brand"],
  complexity: "medium",
  density: "high",
  imageRequired: true,
  mobileScore: 88,
  editable: true,
  tags: ["blog", "articles", "content-marketing"],
  funnelStage: "awareness",
  migrateProps (oldProps, fromVersion) {
    if (fromVersion < 2) return articleGridSection.defaultProps
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
          postField.title("Section title (4–8 words)", 60),
          postField.excerpt("Short excerpt (1–2 sentences)", 180),
          postField.authorName(),
          postField.authorAvatar(),
          postField.date(),
          postField.readTime(),
          postField.href(),
        ],
        newItem: () => ({ imageUrl: "", imageAlt: "", category: "Category", title: "Post title", excerpt: "Post excerpt.", authorName: "Author", authorAvatarUrl: "", date: "Jan 1, 2025", readTime: "5 min", href: "#" }),
      }),
    ],
  },
  defaultProps: {
    eyebrow: "Insights",
    headline: "Notes from the",
    accentWord: "team",
    description: "Field-tested advice on design, growth and running a modern website.",
    posts: SAMPLE_POSTS.slice(0, 3).map((p) => ({
      imageUrl: COVER,
      imageAlt: "",
      category: p.category,
      title: p.title,
      excerpt: p.excerpt,
      authorName: p.authorName,
      authorAvatarUrl: AVATAR,
      date: p.date,
      readTime: p.readTime,
      href: "#",
    })),
  },
  Component: ArticleGrid,
})
