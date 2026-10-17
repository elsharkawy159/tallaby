"use client"

import { Twitter, Linkedin } from "lucide-react"
import { SectionContainer } from "@/components/sections/section-container"
import { SectionSlot } from "@/components/sections/_primitives/section-slot"
import { defineSection } from "@/components/sections/define-section"
import { SECTION_PADDING_STANDARD } from "@/components/sections/section-style-presets"
import { SECTION_THUMB_PLACEHOLDER, SectionEditableImage, useSectionSurface } from "@/components/sections/shared"
import { CENTERED_HEADER, ItemText, stretchItems } from "@/components/sections/content/content-parts"
import type { SectionComponentProps } from "@/components/sections/registry.types"

type Speaker = {
  name?: string
  role?: string
  company?: string
  topic?: string
  avatar?: string
  twitterHref?: string
  linkedinHref?: string
}

const initials = (name: string) =>
  name
    .split(" ")
    .map((n) => n[0] ?? "")
    .join("")
    .slice(0, 2)

/**
 * Lineup — captioned-grid archetype.
 *
 * A centered header over a grid of speaker cards: a round portrait (or
 * initials on the brand colour), then name, role and company, the talk topic
 * as a chip, and social links.
 */
function ContentSpeakers ({ instance, isPreview, definition }: SectionComponentProps) {
  const { rootStyle } = useSectionSurface({ instanceId: instance.id })

  return (
    <section className="relative isolate overflow-x-clip bg-background" style={rootStyle}>
      <SectionContainer>
        <SectionSlot
          instance={instance}
          definition={definition}
          isPreview={isPreview}
          slotId="copy"
          className={CENTERED_HEADER}
          align="center"
          entryClassName={stretchItems}
          renderItems={({ instance: inst }) => {
            const speakers = (inst.props.speakers as Speaker[] | undefined) ?? []
            if (speakers.length === 0) return null
            return (
              <div className="mt-9 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {speakers.map((speaker, i) => (
                  <div
                    key={i}
                    className="group flex flex-col items-center rounded-2xl border border-border bg-card p-6 text-center transition-all"
                  >
                    {speaker.avatar ? (
                      <SectionEditableImage
                        instanceId={inst.id}
                        elementKey={`speakers.${i}.avatar`}
                        src={speaker.avatar}
                        alt={speaker.name ?? ""}
                        collectionKey="speakers"
                        collectionIndex={i}
                        itemSrcProp="avatar"
                        isPreview={isPreview}
                        className="size-20 rounded-full object-cover ring-2 ring-border/40"
                      />
                    ) : (
                      <div
                        aria-hidden
                        className="flex size-20 items-center justify-center rounded-full bg-muted font-heading text-xl font-semibold text-foreground"
                      >
                        {initials(speaker.name ?? "")}
                      </div>
                    )}
                    <ItemText
                      as="h3"
                      instance={inst}
                      collection="speakers"
                      index={i}
                      field="name"
                      value={speaker.name}
                      elementId={`name${i}`}
                      isPreview={isPreview}
                      className="mt-4 font-semibold text-foreground"
                    />
                    <p className="text-xs text-muted-foreground">
                      <ItemText
                        instance={inst}
                        collection="speakers"
                        index={i}
                        field="role"
                        value={speaker.role}
                        elementId={`role${i}`}
                        isPreview={isPreview}
                      />
                      {speaker.company ? (
                        <>
                          {", "}
                          <ItemText
                            instance={inst}
                            collection="speakers"
                            index={i}
                            field="company"
                            value={speaker.company}
                            isPreview={isPreview}
                          />
                        </>
                      ) : null}
                    </p>
                    {speaker.topic ? (
                      <ItemText
                        as="p"
                        instance={inst}
                        collection="speakers"
                        index={i}
                        field="topic"
                        value={speaker.topic}
                        isPreview={isPreview}
                        className="mt-3 text-sm font-medium text-muted-foreground"
                      />
                    ) : null}
                    <div className="mt-4 flex gap-3">
                      {speaker.twitterHref ? (
                        <a href={speaker.twitterHref} aria-label="X / Twitter" className="text-muted-foreground transition-colors hover:text-foreground">
                          <Twitter className="size-4" aria-hidden />
                        </a>
                      ) : null}
                      {speaker.linkedinHref ? (
                        <a href={speaker.linkedinHref} aria-label="LinkedIn" className="text-muted-foreground transition-colors hover:text-foreground">
                          <Linkedin className="size-4" aria-hidden />
                        </a>
                      ) : null}
                    </div>
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

export const contentSpeakersSection = defineSection({
  id: "content-speakers",
  displayName: "Lineup",
  description: "Speaker cards — portrait, name, role, talk topic and social links — for conferences and events.",
  category: "content",
  layoutArchetype: "captioned-grid",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 1,
  industries: ["event", "education", "nonprofit", "saas", "startup"],
  styles: ["modern", "minimal", "corporate"],
  goals: ["trust", "engagement", "conversion"],
  complexity: "medium",
  density: "high",
  imageRequired: false,
  mobileScore: 90,
  editable: true,
  funnelStage: "consideration",
  conversionWeight: 65,
  trustWeight: 80,
  tags: ["speakers", "event", "conference", "team", "grid"],
  defaultStyle: SECTION_PADDING_STANDARD,
  rootStyleOptions: { applySectionPadding: false },
  defaultOptions: { align: "center", paddingY: "lg" },
  schema: {
    slots: [{ id: "copy", label: "Copy", isDefault: true }],
    blocks: [
      { kind: "eyebrow", field: { key: "eyebrow", canonical: "eyebrow", maxLength: 30 } },
      { kind: "heading", level: 2, accent: false, fields: { headline: { key: "headline", maxLength: 70 } } },
      { kind: "body", field: { key: "description", maxLength: 200 } },
      {
        kind: "items",
        key: "speakers",
        canonical: "members",
        label: "Speakers",
        pick: [],
        itemPlaceholder: "avatar",
        itemFields: [
          { key: "avatar", label: "Photo", type: "image", canonical: "image" },
          { key: "name", label: "Full name", type: "text", canonical: "headline", maxLength: 60 },
          { key: "role", label: "Role", type: "text", aiHint: "Job title", maxLength: 60 },
          { key: "company", label: "Company", type: "text", canonical: "brandName", maxLength: 60 },
          { key: "topic", label: "Talk topic", type: "text", aiHint: "Short talk or session title", maxLength: 60 },
          { key: "twitterHref", label: "Twitter/X link", type: "url" },
          { key: "linkedinHref", label: "LinkedIn link", type: "url" },
        ],
        minItems: 1,
        maxItems: 16,
        newItem: () => ({ name: "Speaker Name", role: "Title", company: "Company", topic: "Talk topic", avatar: "", twitterHref: "", linkedinHref: "" }),
      },
    ],
  },
  defaultProps: {
    eyebrow: "Speakers",
    headline: "Learn from the people building what's next",
    description: "Practitioners from product, design and engineering teams sharing what actually worked.",
    speakers: [
      { name: "Priya Nair", role: "VP of Product", company: "Lumen", topic: "Roadmaps that survive contact with customers", avatar: "", twitterHref: "#", linkedinHref: "#" },
      { name: "Tom Becker", role: "Design Director", company: "Northwind", topic: "Design systems at scale", avatar: "", twitterHref: "#", linkedinHref: "#" },
      { name: "Aisha Kamara", role: "Staff Engineer", company: "Fieldstone", topic: "Shipping weekly without breaking things", avatar: "", twitterHref: "#", linkedinHref: "#" },
      { name: "Lucas Moreau", role: "Head of Growth", company: "Harbor", topic: "Activation is the new acquisition", avatar: "", twitterHref: "#", linkedinHref: "#" },
    ],
  },
  Component: ContentSpeakers,
})
