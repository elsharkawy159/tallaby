"use client"

import { useState } from "react"
import { cn } from "@workspace/ui/lib/utils"
import { SectionContainer } from "@/components/sections/section-container"
import { SectionSlot } from "@/components/sections/_primitives/section-slot"
import { defineSection } from "@/components/sections/define-section"
import { SECTION_PADDING_STANDARD } from "@/components/sections/section-style-presets"
import { SECTION_THUMB_PLACEHOLDER, SectionEditableImage, useSectionSurface } from "@/components/sections/shared"
import {
  COVER,
  SAMPLE_POSTS,
  eyebrowBlock,
  postsBlock,
  stretchItems,
  textBlock,
  type Post,
} from "@/components/sections/blog/blog-parts"
import type { SectionComponentProps, SectionInstance } from "@/components/sections/registry.types"

type Tab = { label?: string; posts?: Post[] }

/**
 * The tab bar and the active tab's posts. A component of its own because it
 * holds the active-tab state — `renderItems` is a render callback, not a
 * component, and must not call hooks.
 */
function TabbedPosts ({ instance, isPreview }: { instance: SectionInstance; isPreview?: boolean }) {
  const [activeTab, setActiveTab] = useState(0)
  const tabs = Array.isArray(instance.props.tabs) ? (instance.props.tabs as Tab[]) : []
  if (tabs.length === 0) return null
  const activePosts = tabs[activeTab]?.posts ?? []

  return (
    <div>
      <div className="mb-8 flex flex-wrap gap-2 border-b border-border pb-0">
        {tabs.map((tab, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setActiveTab(i)}
            className={cn(
              "relative mb-[-1px] rounded-t-lg px-4 py-2.5 text-sm font-semibold transition",
              i === activeTab ? "border-b-2 border-primary text-primary" : "text-muted-foreground"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {activePosts.map((p, i) => (
          <article
            key={i}
            className="group overflow-hidden rounded-2xl border border-border bg-card transition hover:border-primary/30"
          >
            <div className="relative aspect-[16/9] overflow-hidden bg-muted">
              {p.imageUrl ? (
                <SectionEditableImage
                  instanceId={instance.id}
                  elementKey={`tab-img-${activeTab}-${i}`}
                  src={p.imageUrl}
                  alt={p.imageAlt || p.title || ""}
                  collectionKey={`tabs.${activeTab}.posts`}
                  collectionIndex={i}
                  itemSrcProp="imageUrl"
                  itemAltProp="imageAlt"
                  isPreview={isPreview}
                  className="absolute inset-0 size-full object-cover transition-transform duration-500"
                />
              ) : (
                <div className="absolute inset-0 bg-muted" />
              )}
            </div>
            <div className="p-5">
              <p className="mb-1.5 text-xs text-muted-foreground">{p.date}</p>
              <h3 className="text-base font-semibold leading-snug text-foreground">{p.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{p.excerpt}</p>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}

/**
 * Topics — tabs archetype.
 *
 * An underlined tab per topic over a three-column grid of that topic's posts.
 * The eyebrow and the tabs collection are slot entries; each tab carries its own
 * nested post list, which renders unchanged.
 */
function BlogCategoryTabs ({ instance, isPreview, definition }: SectionComponentProps) {
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
            eyebrow: textBlock("eyebrow", "mb-6 text-xs font-semibold text-muted-foreground", isPreview),
          }}
          renderItems={({ instance: inst }) => <TabbedPosts instance={inst} isPreview={isPreview} />}
        />
      </SectionContainer>
    </section>
  )
}

const tabPost = (i: number) => {
  const p = SAMPLE_POSTS[i]!
  return { title: p.title, excerpt: p.excerpt, imageUrl: COVER, imageAlt: "", date: p.date, href: "#" }
}

export const blogCategoryTabsSection = defineSection({
  id: "blog-category-tabs",
  displayName: "Topics",
  description: "An underlined tab per topic over a three-column grid of that topic's posts.",
  category: "blog",
  layoutArchetype: "tabs",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 1,
  industries: ["saas", "agency", "education", "creative", "generic"],
  styles: ["modern", "minimal", "corporate"],
  goals: ["awareness", "engagement", "brand"],
  complexity: "medium",
  density: "medium",
  imageRequired: true,
  mobileScore: 87,
  editable: true,
  tags: ["blog", "tabs", "categories", "filter"],
  funnelStage: "awareness",
  defaultStyle: SECTION_PADDING_STANDARD,
  defaultOptions: { align: "start", paddingY: "lg" },
  schema: {
    slots: [{ id: "copy", label: "Copy", isDefault: true }],
    blocks: [
      eyebrowBlock(),
      postsBlock({
        key: "tabs",
        canonical: "items",
        label: "Categories",
        minItems: 1,
        maxItems: 6,
        fields: [{ key: "label", label: "Tab label", type: "text", aiHint: "Category name (1–2 words)", maxLength: 24, group: "content" }],
        newItem: () => ({ label: "Category", posts: [] }),
      }),
    ],
  },
  defaultProps: {
    eyebrow: "Browse by topic",
    tabs: [
      { label: "Strategy", posts: [tabPost(0), tabPost(2)] },
      { label: "Product", posts: [tabPost(1)] },
      { label: "Engineering", posts: [tabPost(3), tabPost(4)] },
    ],
  },
  Component: BlogCategoryTabs,
})
