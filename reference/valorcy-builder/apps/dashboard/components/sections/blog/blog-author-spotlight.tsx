"use client"

import { ArrowRight } from "lucide-react"
import { SectionContainer } from "@/components/sections/section-container"
import { SectionSlot } from "@/components/sections/_primitives/section-slot"
import { defineSection } from "@/components/sections/define-section"
import { TYPE_H2_SM } from "@/components/sections/_primitives/type-scale"
import { SECTION_PADDING_STANDARD } from "@/components/sections/section-style-presets"
import { SECTION_THUMB_PLACEHOLDER, SectionEditableImage, useSectionSurface } from "@/components/sections/shared"
import {
  AVATAR,
  ItemText,
  SAMPLE_POSTS,
  headingBlock,
  postsBlock,
  stretchItems,
} from "@/components/sections/blog/blog-parts"
import type { SectionComponentProps } from "@/components/sections/registry.types"

type AuthorPost = { title?: string; date?: string; readTime?: string; href?: string }
type Author = { name?: string; role?: string; bio?: string; avatarUrl?: string; posts?: AuthorPost[] }

/**
 * Bylines — spec-cards archetype.
 *
 * One card per author — avatar, name, role and bio — closed by a ruled-off list
 * of that author's posts. The headline and the authors collection are slot
 * entries; each author's nested post list renders unchanged.
 */
function BlogAuthorSpotlight ({ instance, isPreview, definition }: SectionComponentProps) {
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
          headingClassName={`${TYPE_H2_SM} mb-10 text-foreground`}
          renderItems={({ instance: inst }) => {
            const authors = Array.isArray(inst.props.authors) ? (inst.props.authors as Author[]) : []
            if (authors.length === 0) return null
            return (
              <div className="grid gap-8 sm:grid-cols-2">
                {authors.map((a, ai) => (
                  <div key={ai} className="rounded-2xl border border-border bg-card p-6">
                    <div className="mb-4 flex items-start gap-4">
                      {a.avatarUrl ? (
                        <SectionEditableImage
                          instanceId={inst.id}
                          elementKey={`avatar-${ai}`}
                          src={a.avatarUrl}
                          alt={a.name ?? ""}
                          collectionKey="authors"
                          collectionIndex={ai}
                          itemSrcProp="avatarUrl"
                          isPreview={isPreview}
                          className="size-14 shrink-0 rounded-full border-2 border-border object-cover"
                        />
                      ) : (
                        <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-muted text-xl font-semibold text-foreground">
                          {(a.name ?? "")[0]}
                        </div>
                      )}
                      <div>
                        <ItemText
                          as="h3"
                          instance={inst}
                          collection="authors"
                          index={ai}
                          field="name"
                          value={a.name}
                          isPreview={isPreview}
                          className="font-semibold text-foreground"
                        />
                        <ItemText
                          as="p"
                          instance={inst}
                          collection="authors"
                          index={ai}
                          field="role"
                          value={a.role}
                          isPreview={isPreview}
                          className="text-xs font-medium text-muted-foreground"
                        />
                      </div>
                    </div>
                    <ItemText
                      as="p"
                      instance={inst}
                      collection="authors"
                      index={ai}
                      field="bio"
                      value={a.bio}
                      isPreview={isPreview}
                      className="mb-4 text-sm leading-relaxed text-muted-foreground"
                    />
                    <ul className="divide-y divide-border">
                      {(a.posts ?? []).map((p, pi) => (
                        <li key={pi} className="group flex items-center justify-between gap-3 py-2.5">
                          <div>
                            <p className="text-sm font-medium text-foreground group-hover:text-primary">{p.title}</p>
                            <p className="text-xs text-muted-foreground">{p.date} · {p.readTime}</p>
                          </div>
                          <ArrowRight className="size-4 shrink-0 text-muted-foreground/40 transition group-hover:text-primary rtl:rotate-180" />
                        </li>
                      ))}
                    </ul>
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

const authorPost = (i: number) => {
  const p = SAMPLE_POSTS[i]!
  return { title: p.title, date: p.date, readTime: p.readTime, href: "#" }
}

export const blogAuthorSpotlightSection = defineSection({
  id: "blog-author-spotlight",
  displayName: "Bylines",
  description: "A card per author — avatar, role and bio — closed by a ruled-off list of their posts.",
  category: "blog",
  layoutArchetype: "spec-cards",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 1,
  industries: ["saas", "agency", "education", "creative", "portfolio", "generic"],
  styles: ["modern", "editorial", "minimal"],
  goals: ["awareness", "brand", "trust"],
  complexity: "medium",
  density: "high",
  imageRequired: false,
  mobileScore: 88,
  editable: true,
  tags: ["blog", "author", "byline", "team"],
  funnelStage: "awareness",
  defaultStyle: SECTION_PADDING_STANDARD,
  defaultOptions: { align: "start", paddingY: "lg" },
  schema: {
    slots: [{ id: "copy", label: "Copy", isDefault: true }],
    blocks: [
      headingBlock({ aiHint: "Section headline (3–5 words)", maxLength: 50 }),
      postsBlock({
        key: "authors",
        canonical: "members",
        label: "Authors",
        minItems: 1,
        maxItems: 6,
        fields: [
          { key: "avatarUrl", label: "Avatar", type: "image" },
          { key: "name", label: "Name", type: "text", canonical: "headline", aiHint: "Author full name", maxLength: 50, group: "content" },
          { key: "role", label: "Role", type: "text", aiHint: "Author job title (2–5 words)", maxLength: 60, group: "content" },
          { key: "bio", label: "Bio", type: "textarea", canonical: "body", aiHint: "2-sentence author bio", maxLength: 200, group: "content" },
        ],
        newItem: () => ({ name: "Author Name", role: "Role", bio: "Author bio.", avatarUrl: "", posts: [] }),
      }),
    ],
  },
  defaultProps: {
    headline: "Meet our writers",
    authors: [
      {
        name: "Maya Chen",
        role: "Head of Content",
        bio: "Maya writes about positioning and conversion. She has spent a decade helping teams explain what they do in plain words.",
        avatarUrl: AVATAR,
        posts: [authorPost(0), authorPost(4)],
      },
      {
        name: "Daniel Okafor",
        role: "Product Designer",
        bio: "Daniel designs the editor and writes about the decisions behind it. He believes good constraints make better websites.",
        avatarUrl: AVATAR,
        posts: [authorPost(1), authorPost(3)],
      },
    ],
  },
  Component: BlogAuthorSpotlight,
})
