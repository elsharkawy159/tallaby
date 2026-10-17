"use client"

import { SectionContainer } from "@/components/sections/section-container"
import { SectionSlot } from "@/components/sections/_primitives/section-slot"
import { defineSection } from "@/components/sections/define-section"
import { TYPE_H2_SM } from "@/components/sections/_primitives/type-scale"
import { SECTION_PADDING_STANDARD } from "@/components/sections/section-style-presets"
import { SECTION_THUMB_PLACEHOLDER, useSectionSurface } from "@/components/sections/shared"
import {
  COVER,
  ItemText,
  PostImage,
  SAMPLE_POSTS,
  eyebrowBlock,
  headingBlock,
  postField,
  postsBlock,
  postsOf,
  stretchItems,
  textBlock,
  textOr,
} from "@/components/sections/blog/blog-parts"
import type { SectionComponentProps } from "@/components/sections/registry.types"

/** Pre-migration pages rendered this literal at the foot of every card. */
const READ_FALLBACK = "Read"

/**
 * Nightfall — inverted archetype.
 *
 * Three columns of post cards on an inverted surface: dimmed covers that lift
 * on hover, accent-coloured category labels, and a read cue. The surface flips
 * with the theme (foreground ↔ background), so the card tints are drawn from
 * the background token rather than a fixed white. The header and the CMS-bound
 * posts collection are slot entries.
 */
function BlogDark ({ instance, isPreview, definition }: SectionComponentProps) {
  const { rootStyle } = useSectionSurface({ instanceId: instance.id, rootOptions: { defaultBackground: false, defaultColor: "var(--background)" } })

  return (
    <section className="bg-foreground text-background" style={rootStyle}>
      <SectionContainer>
        <SectionSlot
          instance={instance}
          definition={definition}
          isPreview={isPreview}
          slotId="copy"
          className="flex flex-col"
          entryClassName={stretchItems}
          align="left"
          headingClassName={`${TYPE_H2_SM} mb-10`}
          overrides={{
            eyebrow: textBlock("eyebrow", "mb-1.5 text-xs font-semibold opacity-50", isPreview),
          }}
          renderItems={({ instance: inst }) => {
            const posts = postsOf(inst)
            if (posts.length === 0) return null
            const readLabel = textOr(inst, "readLabel", READ_FALLBACK)
            return (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {posts.map((p, i) => (
                  <article
                    key={i}
                    className="group overflow-hidden rounded-2xl border border-background/10 bg-background/5 transition hover:border-background/20 hover:bg-background/10"
                  >
                    <div className="relative aspect-[16/9] overflow-hidden bg-background/5">
                      {p.imageUrl ? (
                        <PostImage
                          instance={inst}
                          post={p}
                          index={i}
                          elementKey={`img-${i}`}
                          isPreview={isPreview}
                          className="opacity-80 transition-transform duration-500 group-hover:opacity-100"
                        />
                      ) : (
                        <div className="absolute inset-0 bg-background/5" />
                      )}
                    </div>
                    <div className="flex flex-col gap-2 p-5">
                      <div className="flex items-center gap-2 text-xs font-semibold text-background/60">
                        <span className="text-accent">{p.category}</span>
                        <span>·</span><span>{p.date}</span>
                      </div>
                      <ItemText
                        as="h3"
                        instance={inst}
                        index={i}
                        field="title"
                        value={p.title}
                        isPreview={isPreview}
                        className="font-heading text-base font-semibold leading-snug text-background"
                      />
                      <ItemText
                        as="p"
                        instance={inst}
                        index={i}
                        field="excerpt"
                        value={p.excerpt}
                        isPreview={isPreview}
                        className="text-sm leading-relaxed text-background/70"
                      />
                      {readLabel !== "" && (
                        <div className="mt-1 flex items-center gap-1 text-sm font-medium text-accent opacity-80 transition group-hover:opacity-100">
                          {readLabel}
                        </div>
                      )}
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

export const blogDarkSection = defineSection({
  id: "blog-dark",
  displayName: "Nightfall",
  description: "Inverted surface with three columns of dimmed-cover post cards and accent category labels.",
  category: "blog",
  layoutArchetype: "inverted",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 1,
  industries: ["creative", "agency", "portfolio", "saas", "photography", "generic"],
  styles: ["dark", "editorial", "bold"],
  goals: ["awareness", "engagement", "brand"],
  complexity: "medium",
  density: "medium",
  imageRequired: true,
  mobileScore: 88,
  editable: true,
  tags: ["blog", "dark", "editorial"],
  funnelStage: "awareness",
  defaultStyle: SECTION_PADDING_STANDARD,
  defaultOptions: { align: "start", paddingY: "lg" },
  schema: {
    slots: [{ id: "copy", label: "Copy", isDefault: true }],
    blocks: [
      eyebrowBlock(),
      headingBlock({ aiHint: "Section headline (3–6 words)", maxLength: 60 }),
      postsBlock({
        label: "Posts",
        minItems: 1,
        maxItems: 9,
        fields: [
          postField.image(),
          postField.imageAlt(),
          postField.category(),
          postField.title("Article headline (5–10 words)", 80),
          postField.excerpt("Short excerpt (1–2 sentences)", 180),
          postField.date(),
          postField.href(),
        ],
        newItem: () => ({ title: "Post title", excerpt: "Post excerpt.", imageUrl: "", imageAlt: "", category: "Category", date: "Jan 1, 2025", href: "#" }),
      }),
    ],
    settings: [
      { key: "readLabel", label: "Read cue label", type: "text", aiHint: "Short read prompt on every card (1–2 words)", maxLength: 20, group: "cta" },
    ],
  },
  defaultProps: {
    eyebrow: "After hours",
    headline: "Stories from the studio",
    readLabel: READ_FALLBACK,
    posts: SAMPLE_POSTS.slice(0, 3).map((p) => ({
      title: p.title,
      excerpt: p.excerpt,
      imageUrl: COVER,
      imageAlt: "",
      category: p.category,
      date: p.date,
      href: "#",
    })),
  },
  Component: BlogDark,
})
