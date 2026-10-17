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
} from "@/components/sections/blog/blog-parts"
import type { SectionComponentProps } from "@/components/sections/registry.types"

/**
 * Broadsheet — bento archetype.
 *
 * A multi-zone front page: a tall lead story with its copy laid over a darkened
 * cover, two thumbnail cards stacked beside it, and a two-card row underneath.
 * The lead's scrim stays dark in both themes (it sits over a photograph), so its
 * copy is white rather than a theme token. The eyebrow and the CMS-bound posts
 * collection are slot entries; zones are filled in collection order.
 */
function BlogMagazine ({ instance, isPreview, definition }: SectionComponentProps) {
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
            const [hero, ...rest] = posts
            return (
              <div>
                <div className="mb-5 grid gap-5 lg:grid-cols-[2fr_1fr]">
                  {hero && (
                    <article className="group relative min-h-[340px] overflow-hidden rounded-3xl bg-foreground text-white">
                      {hero.imageUrl && (
                        <PostImage
                          instance={inst}
                          post={hero}
                          index={0}
                          elementKey="hero-img"
                          isPreview={isPreview}
                          className="opacity-60 transition-transform duration-700"
                        />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                      <div className="relative flex h-full flex-col justify-end gap-2 p-7">
                        <span className="self-start text-xs font-semibold text-accent">{hero.category}</span>
                        <ItemText
                          as="h2"
                          instance={inst}
                          index={0}
                          field="title"
                          value={hero.title}
                          isPreview={isPreview}
                          className="text-xl font-semibold leading-snug tracking-tight sm:text-2xl"
                        />
                        <ItemText
                          as="p"
                          instance={inst}
                          index={0}
                          field="excerpt"
                          value={hero.excerpt}
                          isPreview={isPreview}
                          className="text-sm opacity-75"
                        />
                        <span className="text-xs opacity-50">{hero.date}</span>
                      </div>
                    </article>
                  )}
                  <div className="flex flex-col gap-5">
                    {rest.slice(0, 2).map((p, j) => {
                      const i = j + 1
                      return (
                        <article
                          key={i}
                          className="group flex gap-4 overflow-hidden rounded-2xl border border-border bg-card p-4 transition hover:border-primary/30"
                        >
                          <div className="relative size-24 shrink-0 overflow-hidden rounded-xl bg-muted">
                            {p.imageUrl ? (
                              <PostImage
                                instance={inst}
                                post={p}
                                index={i}
                                elementKey={`side-${j}`}
                                isPreview={isPreview}
                                className="transition-transform duration-500"
                              />
                            ) : (
                              <div className="absolute inset-0 bg-muted" />
                            )}
                          </div>
                          <div className="flex flex-col gap-1.5">
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
                            <span className="text-xs text-muted-foreground">{p.date}</span>
                          </div>
                        </article>
                      )
                    })}
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  {rest.slice(2, 4).map((p, j) => {
                    const i = j + 3
                    return (
                      <article
                        key={i}
                        className="group overflow-hidden rounded-2xl border border-border bg-card transition hover:border-primary/30"
                      >
                        <div className="relative aspect-[16/9] overflow-hidden bg-muted">
                          {p.imageUrl ? (
                            <PostImage
                              instance={inst}
                              post={p}
                              index={i}
                              elementKey={`bot-${j}`}
                              isPreview={isPreview}
                              className="transition-transform duration-500"
                            />
                          ) : (
                            <div className="absolute inset-0 bg-muted" />
                          )}
                        </div>
                        <div className="p-5">
                          <span className="text-xs font-semibold text-primary">
                            {p.category} · {p.date}
                          </span>
                          <ItemText
                            as="h3"
                            instance={inst}
                            index={i}
                            field="title"
                            value={p.title}
                            isPreview={isPreview}
                            className="mt-1.5 text-base font-semibold leading-snug text-foreground"
                          />
                        </div>
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

export const blogMagazineSection = defineSection({
  id: "blog-magazine",
  displayName: "Broadsheet",
  description: "Front-page bento — a tall lead story over its cover, two side cards and a two-card row beneath.",
  category: "blog",
  layoutArchetype: "bento",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 1,
  industries: ["creative", "agency", "portfolio", "saas", "education", "generic"],
  styles: ["editorial", "bold", "modern"],
  goals: ["awareness", "engagement", "brand"],
  complexity: "high",
  density: "high",
  imageRequired: true,
  mobileScore: 85,
  editable: true,
  tags: ["blog", "magazine", "editorial", "hero"],
  funnelStage: "awareness",
  defaultStyle: SECTION_PADDING_STANDARD,
  defaultOptions: { align: "start", paddingY: "lg" },
  schema: {
    slots: [{ id: "copy", label: "Copy", isDefault: true }],
    blocks: [
      eyebrowBlock(),
      postsBlock({
        label: "Posts (first is hero)",
        minItems: 1,
        maxItems: 7,
        fields: [
          postField.image(),
          postField.imageAlt(),
          postField.category(),
          postField.title("Article headline (5–10 words)", 90),
          postField.excerpt("Short teaser (1–2 sentences)", 200),
          postField.date(),
          postField.href(),
        ],
        newItem: () => ({ title: "Post title", excerpt: "Post excerpt.", imageUrl: "", imageAlt: "", category: "Category", date: "Jan 1, 2025", href: "#" }),
      }),
    ],
  },
  defaultProps: {
    eyebrow: "This week",
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
  Component: BlogMagazine,
})
