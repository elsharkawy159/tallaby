"use client"

import { Clock } from "lucide-react"
import { SectionContainer } from "@/components/sections/section-container"
import { SectionSlot } from "@/components/sections/_primitives/section-slot"
import { defineSection } from "@/components/sections/define-section"
import { TYPE_BODY, TYPE_H2 } from "@/components/sections/_primitives/type-scale"
import { SECTION_PADDING_STANDARD, SECTION_ROOT_MUTED } from "@/components/sections/section-style-presets"
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
 * Digest — contained archetype.
 *
 * Centered header over one card that holds the whole reading list: each row is
 * a thumbnail beside category, title, excerpt and an author line, rows split by
 * hairlines. The card is chrome; the header lines and the CMS-bound posts
 * collection are slot entries.
 */
function BlogCardList ({ instance, isPreview, definition }: SectionComponentProps) {
  const { rootStyle } = useSectionSurface({
    instanceId: instance.id,
    rootOptions: { defaultBackground: false },
  })

  return (
    <section className="bg-muted/30" style={rootStyle}>
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
              <div className="mt-14 overflow-hidden rounded-2xl border border-border bg-card text-start">
                {posts.map((p, i) => (
                  <div key={i}>
                    {i > 0 && <div className="mx-5 h-px bg-border/60" />}
                    <a
                      href={isPreview ? p.href : undefined}
                      data-element-collection="posts"
                      data-element-index={String(i)}
                      data-element-item-href-prop="href"
                      className="group flex gap-5 p-5 transition-colors hover:bg-muted/30"
                    >
                      <div className="relative aspect-[4/3] w-[120px] flex-shrink-0 overflow-hidden rounded-xl bg-muted sm:w-[140px]">
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

                      <div className="flex min-w-0 flex-1 flex-col gap-2">
                        <span className="self-start text-sm font-medium text-muted-foreground">
                          <ItemText instance={inst} index={i} field="category" value={p.category} isPreview={isPreview} />
                        </span>
                        <ItemText
                          as="h3"
                          instance={inst}
                          index={i}
                          field="title"
                          value={p.title}
                          isPreview={isPreview}
                          className="line-clamp-2 text-[15.5px] font-semibold leading-[1.35] tracking-[-0.012em] text-foreground"
                        />
                        <ItemText
                          as="p"
                          instance={inst}
                          index={i}
                          field="excerpt"
                          value={p.excerpt}
                          isPreview={isPreview}
                          className="line-clamp-2 flex-1 text-[13.5px] leading-relaxed text-muted-foreground"
                        />
                        <div className="mt-auto flex items-center gap-2">
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
                              className="size-[22px] flex-shrink-0 rounded-full object-cover"
                            />
                          )}
                          <ItemText
                            instance={inst}
                            index={i}
                            field="authorName"
                            value={p.authorName}
                            isPreview={isPreview}
                            className="text-[12px] font-medium text-foreground"
                          />
                          <span className="text-[12px] text-border">·</span>
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
                    </a>
                  </div>
                ))}
              </div>
            )
          }}
        />
      </SectionContainer>
    </section>
  )
}

export const blogCardListSection = defineSection({
  id: "blog-card-list",
  displayName: "Digest",
  description: "One card holding a reading list — thumbnail beside category, title, excerpt and author line.",
  category: "blog",
  layoutArchetype: "contained",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 2,
  industries: ["saas", "agency", "creative", "portfolio", "education", "generic"],
  styles: ["modern", "minimal", "editorial"],
  goals: ["awareness", "engagement", "brand"],
  complexity: "medium",
  density: "medium",
  imageRequired: true,
  mobileScore: 90,
  editable: true,
  tags: ["blog", "list"],
  funnelStage: "awareness",
  migrateProps (oldProps, fromVersion) {
    if (fromVersion < 2) return blogCardListSection.defaultProps
    return oldProps
  },
  defaultStyle: SECTION_PADDING_STANDARD,
  rootStyleOptions: { ...SECTION_ROOT_MUTED },
  defaultOptions: { align: "center", paddingY: "lg" },
  schema: {
    slots: [{ id: "copy", label: "Copy", isDefault: true }],
    blocks: [
      ...standardHeader(),
      postsBlock({
        label: "Posts",
        minItems: 1,
        maxItems: 10,
        fields: [
          postField.image("Thumbnail"),
          postField.imageAlt("Accessible alt text for the image (describe what is shown)"),
          postField.category(),
          postField.title("Section title (4–8 words)", 60),
          postField.excerpt("Short excerpt (1–2 sentences)", 180),
          postField.authorName(),
          postField.authorAvatar("Author avatar URL"),
          postField.date(),
          postField.readTime(),
          postField.href(),
        ],
        newItem: () => ({ imageUrl: "", imageAlt: "", category: "Category", title: "Post title", excerpt: "Post excerpt.", authorName: "Author", authorAvatarUrl: "", date: "Jan 1, 2025", readTime: "5 min", href: "#" }),
      }),
    ],
  },
  defaultProps: {
    eyebrow: "Latest reading",
    headline: "Fresh from the",
    accentWord: "blog",
    description: "Short, useful reads for people building and growing on the web.",
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
  Component: BlogCardList,
})
