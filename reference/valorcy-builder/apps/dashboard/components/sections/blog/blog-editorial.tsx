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
  PropText,
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

/** Literals pre-migration pages rendered; kept as fallbacks for unset props. */
const READ_FALLBACK = "Read article"
const LIST_LABEL_FALLBACK = "More to read"

/**
 * Column — editorial archetype.
 *
 * A two-thirds lead story with its full excerpt and a read link, beside a ruled
 * column of numbered follow-on reads. The eyebrow and the CMS-bound posts
 * collection are slot entries; the column label and the read link label are
 * section settings, edited inline or in the inspector.
 */
function BlogEditorial ({ instance, isPreview, definition }: SectionComponentProps) {
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
            const [main, ...list] = posts
            const readLabel = textOr(inst, "readLabel", READ_FALLBACK)
            return (
              <div className="grid gap-10 lg:grid-cols-[2fr_1fr]">
                {main && (
                  <article className="group">
                    {main.imageUrl && (
                      <div className="relative mb-6 aspect-[16/9] overflow-hidden rounded-2xl bg-muted">
                        <PostImage
                          instance={inst}
                          post={main}
                          index={0}
                          elementKey="main-img"
                          isPreview={isPreview}
                          className="transition-transform duration-500"
                        />
                      </div>
                    )}
                    <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="font-semibold text-primary">{main.category}</span>
                      <span>·</span><span>{main.date}</span><span>·</span><span>{main.readTime} read</span>
                    </div>
                    <ItemText
                      as="h2"
                      instance={inst}
                      index={0}
                      field="title"
                      value={main.title}
                      isPreview={isPreview}
                      className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl"
                    />
                    <ItemText
                      as="p"
                      instance={inst}
                      index={0}
                      field="excerpt"
                      value={main.excerpt}
                      isPreview={isPreview}
                      className="mt-3 leading-relaxed text-muted-foreground"
                    />
                    {readLabel !== "" && (
                      <a href={main.href} className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-primary transition hover:gap-2.5">
                        {readLabel}
                      </a>
                    )}
                  </article>
                )}
                <aside className="border-t border-border pt-8 lg:border-s lg:border-t-0 lg:ps-10 lg:pt-0">
                  <PropText
                    as="p"
                    instance={inst}
                    propKey="listLabel"
                    fallback={LIST_LABEL_FALLBACK}
                    isPreview={isPreview}
                    className="mb-5 text-xs font-semibold text-muted-foreground"
                  />
                  <ol className="space-y-6">
                    {list.slice(0, 4).map((p, j) => {
                      const i = j + 1
                      return (
                        <li key={i} className="group flex gap-4">
                          <span className="mt-0.5 text-2xl font-semibold leading-none tabular-nums text-border" aria-hidden>
                            {String(j + 1).padStart(2, "0")}
                          </span>
                          <div>
                            <span className="text-xs font-semibold text-primary">{p.category}</span>
                            <ItemText
                              as="p"
                              instance={inst}
                              index={i}
                              field="title"
                              value={p.title}
                              isPreview={isPreview}
                              className="mt-0.5 text-sm font-semibold leading-snug text-foreground transition group-hover:text-primary"
                            />
                            <span className="text-xs text-muted-foreground">{p.date} · {p.readTime}</span>
                          </div>
                        </li>
                      )
                    })}
                  </ol>
                </aside>
              </div>
            )
          }}
        />
      </SectionContainer>
    </section>
  )
}

export const blogEditorialSection = defineSection({
  id: "blog-editorial",
  displayName: "Column",
  description: "A two-thirds lead story with full excerpt beside a numbered column of follow-on reads.",
  category: "blog",
  layoutArchetype: "editorial",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 1,
  industries: ["saas", "agency", "law", "education", "portfolio", "generic"],
  styles: ["editorial", "minimal", "modern"],
  goals: ["awareness", "engagement", "brand"],
  complexity: "medium",
  density: "high",
  imageRequired: false,
  mobileScore: 90,
  editable: true,
  tags: ["blog", "editorial", "numbered", "list"],
  funnelStage: "awareness",
  defaultStyle: SECTION_PADDING_STANDARD,
  defaultOptions: { align: "start", paddingY: "lg" },
  schema: {
    slots: [{ id: "copy", label: "Copy", isDefault: true }],
    blocks: [
      eyebrowBlock(),
      postsBlock({
        label: "Posts (first is main)",
        minItems: 1,
        maxItems: 8,
        fields: [
          postField.image(),
          postField.imageAlt(),
          postField.category(),
          postField.title("Article headline (5–10 words)", 90),
          postField.excerpt("Short excerpt (1–3 sentences)", 300),
          postField.date(),
          postField.readTime(),
          postField.href(),
        ],
        newItem: () => ({ title: "Post title", excerpt: "Post excerpt.", imageUrl: "", imageAlt: "", category: "Category", date: "Jan 1, 2025", readTime: "5 min", href: "#" }),
      }),
    ],
    settings: [
      { key: "listLabel", label: "Reading list label", type: "text", canonical: "eyebrow", aiHint: "Label above the numbered list (2–4 words)", maxLength: 30, group: "content" },
      { key: "readLabel", label: "Read link label", type: "text", canonical: "ctaPrimary", aiHint: "Link label under the lead story (1–3 words)", maxLength: 24, group: "cta" },
    ],
  },
  defaultProps: {
    eyebrow: "The briefing",
    listLabel: LIST_LABEL_FALLBACK,
    readLabel: READ_FALLBACK,
    posts: SAMPLE_POSTS.map((p, i) => ({
      title: p.title,
      excerpt: p.excerpt,
      imageUrl: i === 0 ? COVER : "",
      imageAlt: "",
      category: p.category,
      date: p.date,
      readTime: p.readTime,
      href: "#",
    })),
  },
  Component: BlogEditorial,
})
