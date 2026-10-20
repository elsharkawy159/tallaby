"use client"

import { SectionContainer } from "@/components/sections/section-container"
import { SectionSlot } from "@/components/sections/_primitives/section-slot"
import { SectionLink } from "@/components/website-builder/section-link"
import { InlineEditableText } from "@/components/website-builder/inline-editable"
import { defineSection } from "@/components/sections/define-section"
import { TYPE_H2_SM } from "@/components/sections/_primitives/type-scale"
import { SECTION_PADDING_STANDARD } from "@/components/sections/section-style-presets"
import { SECTION_THUMB_PLACEHOLDER, useSectionSurface } from "@/components/sections/shared"
import { linkValueFromProp } from "@/lib/builder/links"
import { useBuilderStore } from "@/lib/builder/store"
import {
  COVER,
  ItemText,
  PostImage,
  SAMPLE_POSTS,
  headingBlock,
  noteBlock,
  postField,
  postsBlock,
  postsOf,
  stretchItems,
} from "@/components/sections/blog/blog-parts"
import type { SectionComponentProps } from "@/components/sections/registry.types"

/**
 * Duet — captioned-grid archetype.
 *
 * A header row (headline on the start side, a "view all" link on the end side)
 * over a two-column grid of wide covers, each captioned with its meta line,
 * title and teaser. The header row and the post grid are separate regions, so
 * they are separate slots; the link keeps the flat `viewAllText` /
 * `viewAllHref` props it has always stored.
 */
function BlogTwoCol ({ instance, isPreview, definition }: SectionComponentProps) {
  const { rootStyle } = useSectionSurface({ instanceId: instance.id })

  return (
    <section style={rootStyle}>
      <SectionContainer>
        <SectionSlot
          instance={instance}
          definition={definition}
          isPreview={isPreview}
          slotId="header"
          className="mb-10 flex items-end justify-between gap-4"
          align="left"
          headingClassName={`${TYPE_H2_SM} text-foreground`}
          overrides={{
            viewAllText: ({ instance: inst }) => {
              const label = inst.props.viewAllText
              if (typeof label !== "string" || label === "") return null
              const href = inst.props.viewAllHref
              const write = (t: string) =>
                useBuilderStore.getState().updateSectionProps(inst.id, { viewAllText: t })
              return (
                <SectionLink
                  link={linkValueFromProp(typeof href === "string" ? href : "#")}
                  isPreview={isPreview}
                  data-element-id={`${inst.id}::viewAllText`}
                  data-element-type="textLink"
                  data-element-href-prop="viewAllHref"
                  className="shrink-0 text-sm font-medium text-primary transition hover:opacity-80"
                >
                  <InlineEditableText as="span" value={label} isPreview={isPreview} onChange={write} onCommit={write} />
                  {" →"}
                </SectionLink>
              )
            },
            // Carried by the link above; edited in the inspector.
            viewAllHref: () => null,
          }}
        />
        <SectionSlot
          instance={instance}
          definition={definition}
          isPreview={isPreview}
          slotId="posts"
          className="flex flex-col"
          entryClassName={stretchItems}
          renderItems={({ instance: inst }) => {
            const posts = postsOf(inst)
            if (posts.length === 0) return null
            return (
              <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
                {posts.map((p, i) => (
                  <article key={i} className="group">
                    <div className="relative mb-4 aspect-[3/2] overflow-hidden rounded-2xl bg-muted">
                      {p.imageUrl ? (
                        <PostImage
                          instance={inst}
                          post={p}
                          index={i}
                          elementKey={`img-${i}`}
                          isPreview={isPreview}
                          className="transition-transform duration-500"
                        />
                      ) : (
                        <div className="absolute inset-0 bg-muted" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                      <span className="text-primary">{p.category}</span>
                      <span>·</span><span>{p.date}</span>
                    </div>
                    <ItemText
                      as="h3"
                      instance={inst}
                      index={i}
                      field="title"
                      value={p.title}
                      isPreview={isPreview}
                      className="mt-2 text-lg font-semibold leading-snug tracking-tight text-foreground"
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

export const blogTwoColSection = defineSection({
  id: "blog-two-col",
  displayName: "Duet",
  description: "Headline with a view-all link over a two-column grid of wide, captioned post covers.",
  category: "blog",
  layoutArchetype: "captioned-grid",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 1,
  industries: ["saas", "agency", "portfolio", "creative", "education", "real_estate", "generic"],
  styles: ["modern", "editorial", "minimal"],
  goals: ["awareness", "engagement", "brand"],
  complexity: "medium",
  density: "medium",
  imageRequired: true,
  mobileScore: 90,
  editable: true,
  tags: ["blog", "two-col", "grid"],
  funnelStage: "awareness",
  defaultStyle: SECTION_PADDING_STANDARD,
  defaultOptions: { align: "start", paddingY: "lg" },
  schema: {
    slots: [
      { id: "header", label: "Header", isDefault: true, eject: { direction: "row" } },
      { id: "posts", label: "Posts" },
    ],
    blocks: [
      headingBlock({ aiHint: "Section headline (2–5 words)", maxLength: 50 }),
      postsBlock({
        label: "Posts",
        minItems: 1,
        maxItems: 8,
        slot: "posts",
        fields: [
          postField.image(),
          postField.imageAlt(),
          postField.category(),
          postField.title("Article title (5–10 words)", 80),
          postField.excerpt("Short teaser (1–2 sentences)", 180),
          postField.date(),
          postField.href(),
        ],
        newItem: () => ({ title: "Post title", excerpt: "Post excerpt.", imageUrl: "", imageAlt: "", category: "Category", date: "Jan 1, 2025", href: "#" }),
      }),
      noteBlock({
        key: "viewAllText",
        label: "View all label",
        blockLabel: "View all link",
        type: "text",
        canonical: "ctaSecondary",
        aiHint: "View all link label (2–4 words)",
        maxLength: 24,
        group: "cta",
      }),
      noteBlock({ key: "viewAllHref", label: "View all link", type: "url", canonical: "ctaLink", group: "cta" }),
    ],
  },
  defaultProps: {
    headline: "Latest from the journal",
    viewAllText: "View all posts",
    viewAllHref: "#",
    posts: SAMPLE_POSTS.slice(0, 4).map((p) => ({
      title: p.title,
      excerpt: p.excerpt,
      imageUrl: COVER,
      imageAlt: "",
      category: p.category,
      date: p.date,
      href: "#",
    })),
  },
  Component: BlogTwoCol,
})
