"use client"

import { ArrowRight } from "lucide-react"
import { SectionContainer } from "@/components/sections/section-container"
import { SectionSlot } from "@/components/sections/_primitives/section-slot"
import { defineSection } from "@/components/sections/define-section"
import { SECTION_PADDING_COMPACT } from "@/components/sections/section-style-presets"
import { SECTION_THUMB_PLACEHOLDER, useSectionSurface } from "@/components/sections/shared"
import {
  PropText,
  SAMPLE_POSTS,
  eyebrowBlock,
  postField,
  postsBlock,
  postsOf,
} from "@/components/sections/blog/blog-parts"
import type { SectionComponentProps } from "@/components/sections/registry.types"

/**
 * Wire — marquee archetype.
 *
 * A thin strip between hairlines: a label on the start side, then post titles
 * scrolling endlessly past it. One slot holds the row, so the label and the
 * ticker can swap sides; the ticker is the CMS-bound posts collection.
 */
function BlogTicker ({ instance, isPreview, definition }: SectionComponentProps) {
  const { rootStyle } = useSectionSurface({ instanceId: instance.id, rootOptions: { defaultBackground: false } })

  return (
    <section className="overflow-hidden border-y border-border bg-muted/20" style={rootStyle}>
      <style>{`@keyframes ticker { from { transform: translateX(0) } to { transform: translateX(-50%) } }`}</style>
      <SectionSlot
        instance={instance}
        definition={definition}
        isPreview={isPreview}
        slotId="row"
        className="flex items-center"
        entryClassName={(entry) =>
          entry.kind === "block" && entry.block.kind === "items" ? "min-w-0 flex-1 self-stretch" : "shrink-0"
        }
        overrides={{
          label: ({ instance: inst }) => {
            const v = inst.props.label
            if (typeof v !== "string" || v === "") return null
            return (
              <SectionContainer className="shrink-0 pe-6">
                <PropText
                  instance={inst}
                  propKey="label"
                  isPreview={isPreview}
                  className="whitespace-nowrap text-xs font-semibold text-muted-foreground"
                />
              </SectionContainer>
            )
          },
        }}
        renderItems={({ instance: inst }) => {
          const posts = postsOf(inst)
          if (posts.length === 0) return null
          const doubled = [...posts, ...posts]
          return (
            <div className="h-full flex-1 overflow-hidden border-s border-border">
              <div className="flex items-center gap-0" style={{ animation: "ticker 30s linear infinite", width: "max-content" }}>
                {doubled.map((p, i) => (
                  <a
                    key={i}
                    href={p.href}
                    className="group flex shrink-0 items-center gap-3 border-e border-border px-6 py-3.5 transition hover:bg-muted/40"
                  >
                    <span className="text-xs font-semibold text-primary">{p.category}</span>
                    <span className="whitespace-nowrap text-sm font-medium text-foreground group-hover:text-primary">{p.title}</span>
                    <ArrowRight className="size-3.5 text-muted-foreground/60 transition group-hover:text-primary rtl:rotate-180" aria-hidden />
                  </a>
                ))}
              </div>
            </div>
          )
        }}
      />
    </section>
  )
}

export const blogTickerSection = defineSection({
  id: "blog-ticker",
  displayName: "Wire",
  description: "A thin strip with a label and post titles scrolling endlessly beside it.",
  category: "blog",
  layoutArchetype: "marquee",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 1,
  industries: ["saas", "agency", "creative", "tech", "generic"],
  styles: ["minimal", "editorial", "modern"],
  goals: ["awareness", "engagement"],
  complexity: "low",
  density: "low",
  imageRequired: false,
  mobileScore: 90,
  editable: true,
  tags: ["blog", "ticker", "marquee", "strip"],
  funnelStage: "awareness",
  defaultStyle: SECTION_PADDING_COMPACT,
  defaultOptions: { align: "start", paddingY: "sm" },
  schema: {
    slots: [{ id: "row", label: "Ticker row", isDefault: true, eject: { direction: "row" } }],
    blocks: [
      eyebrowBlock({ key: "label", label: "Label", aiHint: "Ticker label (2–4 words)" }),
      postsBlock({
        label: "Posts",
        minItems: 2,
        maxItems: 10,
        fields: [
          postField.category(),
          postField.title("Article headline (5–10 words)", 80),
          postField.href(),
        ],
        newItem: () => ({ title: "Post title", category: "Category", href: "#" }),
      }),
    ],
  },
  defaultProps: {
    label: "Just published",
    posts: SAMPLE_POSTS.map((p) => ({ title: p.title, category: p.category, href: "#" })),
  },
  Component: BlogTicker,
})
