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
  noteBlock,
  postField,
  postsBlock,
  postsOf,
  stretchItems,
  textBlock,
} from "@/components/sections/blog/blog-parts"
import type { SectionComponentProps } from "@/components/sections/registry.types"

/**
 * Readership — link-grid archetype.
 *
 * A three-column grid of post cards closed by one action: an inline newsletter
 * sign-up card. The card is two regions — its copy on the start side, the
 * capture field and button on the end side — so each is a slot; the eyebrow and
 * the CMS-bound posts collection sit in the default slot above it.
 *
 * The sign-up is presentational, as it always was: the field shows the
 * placeholder text (inline-editable), the button carries the label.
 */
function BlogCtaInline ({ instance, isPreview, definition }: SectionComponentProps) {
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
            return (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {posts.map((p, i) => (
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
                        {p.category} · {p.date}
                      </span>
                      <ItemText
                        as="h3"
                        instance={inst}
                        index={i}
                        field="title"
                        value={p.title}
                        isPreview={isPreview}
                        className="text-base font-semibold leading-snug text-foreground"
                      />
                      <ItemText
                        as="p"
                        instance={inst}
                        index={i}
                        field="excerpt"
                        value={p.excerpt}
                        isPreview={isPreview}
                        className="text-sm text-muted-foreground"
                      />
                    </div>
                  </article>
                ))}
              </div>
            )
          }}
        />

        <div className="mt-10 flex flex-col items-center gap-4 rounded-2xl border border-border bg-card p-8 text-center sm:flex-row sm:justify-between sm:text-start">
          <SectionSlot
            instance={instance}
            definition={definition}
            isPreview={isPreview}
            slotId="ctaCopy"
            className="flex flex-col"
            overrides={{
              ctaHeadline: textBlock("ctaHeadline", "font-semibold text-foreground", isPreview),
              ctaBody: textBlock("ctaBody", "mt-0.5 text-sm text-muted-foreground", isPreview),
            }}
          />
          <SectionSlot
            instance={instance}
            definition={definition}
            isPreview={isPreview}
            slotId="ctaAction"
            className="flex shrink-0 gap-2"
            overrides={{
              emailPlaceholder: ({ instance: inst }) => {
                const v = inst.props.emailPlaceholder
                if (typeof v !== "string") return null
                return (
                  <span className="block w-44 truncate rounded-lg border border-input bg-background px-4 py-2 text-sm text-muted-foreground">
                    <PropText instance={inst} propKey="emailPlaceholder" isPreview={isPreview} />
                  </span>
                )
              },
              ctaLabel: ({ instance: inst }) => {
                const v = inst.props.ctaLabel
                if (typeof v !== "string" || v === "") return null
                return (
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
                  >
                    <PropText instance={inst} propKey="ctaLabel" isPreview={isPreview} />
                   
                  </button>
                )
              },
            }}
          />
        </div>
      </SectionContainer>
    </section>
  )
}

export const blogCtaInlineSection = defineSection({
  id: "blog-cta-inline",
  displayName: "Readership",
  description: "A three-column post grid closed by an inline newsletter sign-up card.",
  category: "blog",
  layoutArchetype: "link-grid",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 1,
  industries: ["saas", "agency", "creative", "education", "generic"],
  styles: ["modern", "minimal", "corporate"],
  goals: ["awareness", "leads", "engagement"],
  complexity: "medium",
  density: "high",
  imageRequired: true,
  mobileScore: 88,
  editable: true,
  tags: ["blog", "cta", "newsletter", "combined"],
  conversionWeight: 50,
  funnelStage: "consideration",
  defaultStyle: SECTION_PADDING_STANDARD,
  defaultOptions: { align: "start", paddingY: "lg" },
  schema: {
    slots: [
      { id: "copy", label: "Copy", isDefault: true },
      { id: "ctaCopy", label: "Newsletter copy" },
      { id: "ctaAction", label: "Newsletter form", eject: { direction: "row" } },
    ],
    blocks: [
      eyebrowBlock(),
      postsBlock({
        label: "Posts",
        minItems: 1,
        maxItems: 9,
        fields: [
          postField.image(),
          postField.imageAlt(),
          postField.category(),
          postField.title("Article headline (5–10 words)", 80),
          postField.excerpt("Short teaser (1 sentence)", 160),
          postField.date(),
          postField.href(),
        ],
        newItem: () => ({ title: "Post title", excerpt: "Post excerpt.", imageUrl: "", imageAlt: "", category: "Category", date: "Jan 1, 2025", href: "#" }),
      }),
      noteBlock({
        key: "ctaHeadline",
        label: "CTA headline",
        slot: "ctaCopy",
        type: "text",
        canonical: "subheadline",
        aiHint: "Newsletter CTA headline (4–8 words)",
        maxLength: 60,
        group: "cta",
      }),
      noteBlock({
        key: "ctaBody",
        label: "CTA supporting text",
        slot: "ctaCopy",
        type: "text",
        canonical: "body",
        aiHint: "Short reassurance (e.g. No spam. Unsubscribe anytime.)",
        maxLength: 80,
        group: "cta",
      }),
      noteBlock({ key: "emailPlaceholder", label: "Email placeholder", slot: "ctaAction", type: "text", group: "cta" }),
      noteBlock({
        key: "ctaLabel",
        label: "Subscribe label",
        slot: "ctaAction",
        type: "text",
        canonical: "ctaPrimary",
        aiHint: "Button label (1–2 words)",
        maxLength: 20,
        group: "cta",
      }),
    ],
  },
  defaultProps: {
    eyebrow: "Recent posts",
    ctaHeadline: "Get new articles in your inbox",
    ctaBody: "One email a fortnight. No spam, unsubscribe anytime.",
    emailPlaceholder: "you@company.com",
    ctaLabel: "Subscribe",
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
  Component: BlogCtaInline,
})
