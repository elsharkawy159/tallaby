"use client"

import { Check, MapPin, Quote } from "lucide-react"
import { SectionContainer } from "@/components/sections/section-container"
import { SectionSlot } from "@/components/sections/_primitives/section-slot"
import { SectionMedia } from "@/components/sections/_primitives/section-media"
import { defineSection } from "@/components/sections/define-section"
import { TYPE_BODY, TYPE_H2 } from "@/components/sections/_primitives/type-scale"
import { SECTION_PADDING_MEDIUM } from "@/components/sections/section-style-presets"
import { SECTION_THUMB_PLACEHOLDER, useSectionSurface } from "@/components/sections/shared"
import {
  DotBadge,
  ItemText,
  PropText,
  propTextOverride,
  textItemsBlock,
} from "@/components/sections/about/about-parts"
import type { SlotEntry } from "@/components/sections/schema/slot-entries"
import type { SectionComponentProps } from "@/components/sections/registry.types"

type Bullet = { text?: string }

/** The founded card's label was hardcoded before the slot migration. */
const FOUNDED_LABEL_FALLBACK = "Founded"

/**
 * The caption runs location and title down the start side and the meta chip on
 * the end side. Keyed by block id so the chip keeps its column wherever the user
 * moves it; anything dropped in takes the full width.
 */
function captionEntryClass (entry: SlotEntry): string | undefined {
  if (entry.kind !== "block") return "col-span-2"
  return entry.block.id === "captionMeta"
    ? "col-start-2 row-span-2 row-start-1 self-end"
    : "col-start-1"
}

/**
 * Heritage — split archetype.
 *
 * The company story on the start side (badge, headline, lead, body, a short
 * checklist); on the end side a portrait photo with a caption band, a tilted
 * "founded" card and a client quote card pinned to its edges. Each card is its
 * own slot: the card surfaces are chrome, everything printed on them is an
 * entry. The scrim inverts the theme tokens so the caption always contrasts
 * with it.
 */
function AboutSplit ({ instance, isPreview, definition }: SectionComponentProps) {
  const { rootStyle } = useSectionSurface({ instanceId: instance.id })

  return (
    <section className="relative overflow-x-clip bg-background" style={rootStyle}>
      <SectionContainer>
        <div className="grid items-center gap-14 lg:grid-cols-12 lg:gap-16">
          {/* TEXT */}
          <SectionSlot
            instance={instance}
            definition={definition}
            isPreview={isPreview}
            slotId="copy"
            className="flex flex-col items-start lg:col-span-6"
            align="left"
            headingClassName={`${TYPE_H2} mt-5 text-foreground`}
            bodyClassName={`${TYPE_BODY} mt-5 max-w-xl`}
            overrides={{
              badgeText: ({ instance: inst }) => <DotBadge instance={inst} isPreview={isPreview} />,
              body: propTextOverride("body", "mt-4 max-w-xl text-[15px] leading-relaxed text-muted-foreground", {
                isPreview,
              }),
            }}
            renderItems={({ instance: inst }) => {
              const bullets = (inst.props.bullets as Bullet[] | undefined) ?? []
              if (bullets.length === 0) return null
              return (
                <ul className="mt-7 space-y-3">
                  {bullets.map((b, i) => (
                    <li key={i} className="flex items-start gap-3 text-[15px] text-foreground">
                      <span className="mt-0.5 inline-flex size-5 shrink-0 items-center justify-center text-muted-foreground">
                        <Check className="size-3" strokeWidth={2.5} aria-hidden />
                      </span>
                      <ItemText
                        instance={inst}
                        collection="bullets"
                        index={i}
                        field="text"
                        value={b.text}
                        isPreview={isPreview}
                      />
                    </li>
                  ))}
                </ul>
              )
            }}
          />

          {/* IMAGE */}
          <div className="lg:col-span-6">
            <div className="relative">

              <div className="relative overflow-hidden rounded-2xl bg-muted">
                <SectionSlot
                  instance={instance}
                  definition={definition}
                  isPreview={isPreview}
                  slotId="media"
                  className="w-full bg-muted"
                  overrides={{
                    aboutImage: ({ block, instance: inst }) => (
                      <SectionMedia
                        instanceId={inst.id}
                        elementKey={block.id}
                        src={inst.props.imageUrl as string | undefined}
                        alt={String(inst.props.imageAlt ?? "")}
                        ratio="portrait"
                        placeholder="portrait"
                        rounded="none"
                        isPreview={isPreview}
                        sizes="(max-width: 1024px) 100vw, 50vw"
                        className="aspect-[5/6] w-full"
                      />
                    ),
                  }}
                />

                <SectionSlot
                  instance={instance}
                  definition={definition}
                  isPreview={isPreview}
                  slotId="caption"
                  className="absolute inset-x-0 bottom-0 grid grid-cols-[1fr_auto] items-end gap-x-3 bg-gradient-to-t from-black/60 via-black/15 to-transparent p-5 text-white"
                  entryClassName={captionEntryClass}
                  overrides={{
                    captionLocation: propTextOverride(
                      "captionLocation",
                      "text-sm text-white/80",
                      { as: "div", isPreview }
                    ),
                    captionTitle: propTextOverride("captionTitle", "text-sm font-semibold text-white", {
                      as: "div",
                      isPreview,
                    }),
                    captionMeta: ({ instance: inst }) =>
                      typeof inst.props.captionMeta === "string" ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 text-xs font-medium text-white">
                          <MapPin className="size-3" aria-hidden />
                          <PropText instance={inst} propKey="captionMeta" as="span" isPreview={isPreview} />
                        </span>
                      ) : null,
                  }}
                />
              </div>

              {/* Founded card */}
              <SectionSlot
                instance={instance}
                definition={definition}
                isPreview={isPreview}
                slotId="founded"
                className="absolute top-10 -left-5 hidden w-40 rounded-xl border border-border bg-card p-3 transition-transform sm:block"
                overrides={{
                  foundedLabel: propTextOverride(
                    "foundedLabel",
                    "text-xs text-muted-foreground",
                    { as: "div", isPreview, fallback: FOUNDED_LABEL_FALLBACK }
                  ),
                  foundedYear: propTextOverride("foundedYear", "mt-1 font-heading text-2xl font-semibold tracking-tight text-foreground", {
                    as: "div",
                    isPreview,
                  }),
                  foundedCity: propTextOverride("foundedCity", "mt-0.5 text-xs text-muted-foreground", {
                    as: "div",
                    isPreview,
                  }),
                }}
              />

              {/* Quote card */}
              <div className="absolute -right-4 bottom-6 hidden w-64 rounded-xl border border-border bg-card p-4 transition-transform md:block">
                <Quote className="size-3.5 text-primary" aria-hidden />
                <SectionSlot
                  instance={instance}
                  definition={definition}
                  isPreview={isPreview}
                  slotId="quote"
                  className="flex flex-col"
                  overrides={{
                    quoteText: propTextOverride("quoteText", "mt-1.5 text-[13px] leading-snug text-foreground", {
                      isPreview,
                    }),
                    quoteAuthor: ({ instance: inst }) =>
                      typeof inst.props.quoteAuthor === "string" ? (
                        <div className="mt-3 flex items-center gap-2.5">
                          <div
                            aria-hidden
                            className="size-7 shrink-0 rounded-full"
                            style={{
                              background:
                                "linear-gradient(135deg, color-mix(in oklch, var(--primary) 60%, var(--primary-foreground)), var(--primary))",
                            }}
                          />
                          <PropText
                            instance={inst}
                            propKey="quoteAuthor"
                            as="div"
                            isPreview={isPreview}
                            className="text-[12px] font-semibold text-foreground"
                          />
                        </div>
                      ) : null,
                    quoteRole: propTextOverride("quoteRole", "ps-[2.375rem] text-xs text-muted-foreground", {
                      as: "div",
                      isPreview,
                    }),
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </SectionContainer>
    </section>
  )
}

export const aboutSplitSection = defineSection({
  id: "about-split",
  displayName: "Heritage",
  description: "The company story beside a portrait photo pinned with a founded card and a client quote.",
  category: "about",
  layoutArchetype: "split",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 2,
  industries: ["photography", "podcast", "saas", "agency", "startup", "portfolio", "creative", "nonprofit", "generic"],
  trustWeight: 50,
  conversionWeight: 20,
  funnelStage: "consideration",
  styles: ["modern", "editorial", "minimal"],
  goals: ["brand", "trust"],
  complexity: "medium",
  density: "high",
  imageRequired: false,
  mobileScore: 80,
  editable: true,
  migrateProps (oldProps, fromVersion) {
    if (fromVersion < 2) return aboutSplitSection.defaultProps
    return oldProps
  },
  defaultStyle: SECTION_PADDING_MEDIUM,
  rootStyleOptions: { applySectionPadding: false },
  defaultOptions: { align: "start", paddingY: "md" },
  schema: {
    slots: [
      { id: "copy", label: "Story", isDefault: true },
      { id: "media", label: "Photo", accepts: ["media"], max: 1, acceptsElements: false },
      { id: "caption", label: "Photo caption", eject: { direction: "row" } },
      { id: "founded", label: "Founded card" },
      { id: "quote", label: "Quote card" },
    ],
    blocks: [
      { kind: "badge", id: "badgeText", field: { key: "badgeText", label: "Badge" } },
      {
        kind: "heading",
        level: 2,
        accent: true,
        fields: {
          headline: { key: "headline", aiHint: "Primary section headline (6–10 words, no period)", maxLength: 80 },
          accentWord: { key: "accentWord", aiHint: "Highlighted word or phrase in the headline (1–3 words)", maxLength: 30 },
        },
      },
      {
        kind: "body",
        id: "lead",
        label: "Lead paragraph",
        field: { key: "lead", label: "Lead paragraph", aiHint: "Lead paragraph (1–2 sentences)", maxLength: 200 },
      },
      {
        kind: "body",
        id: "body",
        label: "Body paragraph",
        field: { key: "body", label: "Body paragraph", aiHint: "Body copy (1–3 sentences)", maxLength: 300 },
      },
      textItemsBlock({
        key: "bullets",
        label: "Bullet points",
        itemLabel: "Text",
        type: "text",
        minItems: 0,
        maxItems: 6,
        newText: "Key fact about your company.",
      }),
      {
        kind: "media",
        id: "aboutImage",
        slot: "media",
        ratio: "portrait",
        placeholder: "portrait",
        fields: {
          src: { key: "imageUrl", label: "Image" },
          alt: { key: "imageAlt", aiHint: "Accessible alt text for the image (describe what is shown)", maxLength: 120 },
        },
      },
      { kind: "note", id: "captionLocation", slot: "caption", label: "Caption — location", field: { key: "captionLocation", label: "Caption — location" } },
      { kind: "note", id: "captionTitle", slot: "caption", label: "Caption — title", field: { key: "captionTitle", label: "Caption — title" } },
      { kind: "note", id: "captionMeta", slot: "caption", label: "Caption — meta chip", field: { key: "captionMeta", label: "Caption — meta chip" } },
      { kind: "note", id: "foundedLabel", slot: "founded", label: "Founded label", field: { key: "foundedLabel", label: "Founded label" } },
      { kind: "note", id: "foundedYear", slot: "founded", label: "Founded year", field: { key: "foundedYear", label: "Founded year" } },
      { kind: "note", id: "foundedCity", slot: "founded", label: "Founded city", field: { key: "foundedCity", label: "Founded city" } },
      { kind: "note", id: "quoteText", slot: "quote", label: "Quote text", field: { key: "quoteText", label: "Quote text", type: "textarea", maxLength: 200 } },
      { kind: "note", id: "quoteAuthor", slot: "quote", label: "Quote author", field: { key: "quoteAuthor", label: "Quote author" } },
      { kind: "note", id: "quoteRole", slot: "quote", label: "Quote role", field: { key: "quoteRole", label: "Quote role" } },
    ],
  },
  defaultProps: {
    badgeText: "Our story",
    headline: "A studio built on long relationships and",
    accentWord: "honest work.",
    lead: "We started in 2016 with a simple idea: treat every client like a partner, and every project like it carries our name.",
    body: "Nearly a decade later we are a team of strategists, designers and engineers — still small enough to know every client by name, and experienced enough to handle what comes next.",
    bullets: [
      { text: "Senior people on every project, from kickoff to launch." },
      { text: "Transparent pricing and weekly progress you can see." },
      { text: "Long-term support long after the launch day." },
    ],
    imageAlt: "The team at work in the studio",
    captionLocation: "Lisbon · 2025",
    captionTitle: "Inside our studio",
    captionMeta: "Lisbon, PT",
    foundedLabel: FOUNDED_LABEL_FALLBACK,
    foundedYear: "2016",
    foundedCity: "Lisbon, Portugal",
    quoteText: "“They felt like part of our team from the very first week.”",
    quoteAuthor: "Elena Martins",
    quoteRole: "Head of Product · Northwind",
  },
  Component: AboutSplit,
})
