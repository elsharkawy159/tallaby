"use client"

import { Award, BookOpen, Globe, type LucideIcon } from "lucide-react"
import { SectionContainer } from "@/components/sections/section-container"
import { SectionSlot } from "@/components/sections/_primitives/section-slot"
import { SectionMedia } from "@/components/sections/_primitives/section-media"
import { defineSection } from "@/components/sections/define-section"
import { TYPE_BODY, TYPE_H2_SM } from "@/components/sections/_primitives/type-scale"
import { SECTION_PADDING_STANDARD } from "@/components/sections/section-style-presets"
import { SECTION_THUMB_PLACEHOLDER, useSectionSurface } from "@/components/sections/shared"
import {
  actionBlocks,
  actionOverrides,
  labelSetting,
  propText,
  stringListBlock,
  textOf,
  toStringList,
} from "@/components/sections/content/content-parts"
import type { BlockOverride } from "@/components/sections/_primitives/block-renderer"
import type { SlotEntry } from "@/components/sections/schema/slot-entries"
import type { SectionComponentProps } from "@/components/sections/registry.types"

const CREDENTIAL_LISTS = ["admissions", "education", "recognition"] as const

/** One credential group — icon, label (a setting with the old literal as fallback) and list. */
function credentialGroup (key: string, labelKey: string, fallback: string, Icon: LucideIcon): BlockOverride {
  return function CredentialGroup ({ instance }) {
    const entries = toStringList(instance.props[key])
    if (entries.length === 0) return null
    return (
      <div className="mt-8">
        <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-primary">
          <Icon className="size-3.5" aria-hidden /> {textOf(instance.props, labelKey, fallback)}
        </div>
        <ul className="space-y-1">
          {entries.map((entry, i) => (
            <li key={i} className="text-sm text-muted-foreground">
              {entry}
            </li>
          ))}
        </ul>
      </div>
    )
  }
}

/**
 * The copy slot is a three-column grid so the credential lists sit side by side;
 * every other entry (and any dropped element) spans the full row.
 */
function spanEntry (entry: SlotEntry): string | undefined {
  const isList =
    entry.kind === "block" && (CREDENTIAL_LISTS as readonly string[]).includes(entry.block.id)
  return isList ? undefined : "sm:col-span-3"
}

/**
 * Credentials — asymmetric archetype.
 *
 * A portrait in the narrow third, the profile in the wide two-thirds: name,
 * title, biography, three credential lists side by side, and a consultation
 * action. Two slots — the portrait and the profile.
 */
function ContentAttorneyProfile ({ instance, isPreview, definition }: SectionComponentProps) {
  const { rootStyle } = useSectionSurface({ instanceId: instance.id })

  return (
    <section className="relative isolate overflow-x-clip bg-background" style={rootStyle}>
      <SectionContainer>
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-3 lg:items-start">
          <SectionSlot
            instance={instance}
            definition={definition}
            isPreview={isPreview}
            slotId="media"
            className="flex flex-col lg:col-span-1"
            overrides={{
              imageUrl: ({ instance: inst, isPreview: preview }) => (
                <SectionMedia
                  instanceId={inst.id}
                  elementKey="imageUrl"
                  src={textOf(inst.props, "imageUrl")}
                  alt={textOf(inst.props, "imageAlt") || textOf(inst.props, "name") || ""}
                  ratio="portrait"
                  placeholder="portrait"
                  rounded="lg"
                  sizes="(max-width: 1024px) 100vw, 33vw"
                  isPreview={preview}
                />
              ),
            }}
          />

          <SectionSlot
            instance={instance}
            definition={definition}
            isPreview={isPreview}
            slotId="profile"
            className="grid grid-cols-1 gap-x-5 sm:grid-cols-3 lg:col-span-2"
            entryClassName={spanEntry}
            align="left"
            headingClassName={`${TYPE_H2_SM} text-foreground`}
            bodyClassName={`${TYPE_BODY} mt-5`}
            overrides={{
              eyebrow: propText("eyebrow", {
                className: "mb-2 text-xs font-semibold text-primary",
              }),
              title: propText("title", { className: "mt-1 text-sm font-medium text-muted-foreground" }),
              admissions: credentialGroup("admissions", "admissionsLabel", "Bar Admissions", Globe),
              education: credentialGroup("education", "educationLabel", "Education", BookOpen),
              recognition: credentialGroup("recognition", "recognitionLabel", "Recognition", Award),
              ...actionOverrides("mt-8 px-7 py-3.5"),
            }}
          />
        </div>
      </SectionContainer>
    </section>
  )
}

export const contentAttorneyProfileSection = defineSection({
  id: "content-attorney-profile",
  displayName: "Credentials",
  description: "Attorney profile — portrait beside bio, bar admissions, education and recognition.",
  category: "content",
  layoutArchetype: "asymmetric",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 1,
  industries: ["law"],
  styles: ["corporate", "modern", "minimal"],
  goals: ["trust", "leads", "conversion"],
  complexity: "medium",
  density: "high",
  imageRequired: true,
  mobileScore: 90,
  editable: true,
  funnelStage: "consideration",
  conversionWeight: 75,
  trustWeight: 90,
  tags: ["attorney", "lawyer", "profile", "bio", "credentials"],
  defaultStyle: SECTION_PADDING_STANDARD,
  rootStyleOptions: { applySectionPadding: false },
  defaultOptions: { align: "start", paddingY: "lg" },
  schema: {
    slots: [
      { id: "media", label: "Portrait", accepts: ["media"], max: 1, acceptsElements: false },
      { id: "profile", label: "Profile", isDefault: true },
    ],
    blocks: [
      {
        kind: "media",
        slot: "media",
        ratio: "portrait",
        placeholder: "portrait",
        fields: {
          src: { key: "imageUrl", label: "Attorney photo", canonical: "image", group: "media" },
          alt: { key: "imageAlt", label: "Attorney photo alt text" },
        },
      },
      { kind: "eyebrow", field: { key: "eyebrow", canonical: "eyebrow", maxLength: 40 } },
      {
        kind: "heading",
        id: "name",
        level: 2,
        accent: false,
        fields: { headline: { key: "name", label: "Attorney name", canonical: "headline", maxLength: 80 } },
      },
      {
        kind: "note",
        id: "title",
        label: "Title / specialty",
        field: { key: "title", label: "Title / specialty", type: "text", canonical: "subheadline", maxLength: 100 },
      },
      {
        kind: "body",
        id: "bio",
        label: "Biography",
        field: { key: "bio", label: "Biography", type: "textarea", canonical: "body", maxLength: 600 },
      },
      stringListBlock({ key: "admissions", label: "Bar admissions (JSON array)", aiHint: "Array of admission strings", maxLength: 400 }),
      stringListBlock({ key: "education", label: "Education (JSON array)", aiHint: "Array of education strings", maxLength: 400 }),
      stringListBlock({ key: "recognition", label: "Recognition (JSON array)", aiHint: "Array of awards/recognition strings", maxLength: 400 }),
      ...actionBlocks({ maxLength: 50 }),
    ],
    settings: [
      labelSetting("admissionsLabel", "Admissions heading"),
      labelSetting("educationLabel", "Education heading"),
      labelSetting("recognitionLabel", "Recognition heading"),
    ],
  },
  defaultProps: {
    eyebrow: "Managing Partner",
    name: "Eleanor Whitfield",
    title: "Commercial litigation & dispute resolution",
    bio: "Eleanor has represented businesses in complex commercial disputes for more than twenty years, with a practice built on careful preparation and plain-spoken advice. She leads the firm's litigation group and has argued before state and federal appellate courts.",
    imageAlt: "Portrait of Eleanor Whitfield",
    admissions: ["New York State Bar", "U.S. District Court, S.D.N.Y.", "U.S. Court of Appeals, 2nd Cir."],
    education: ["J.D., Columbia Law School", "B.A., Political Science, Cornell University"],
    recognition: ["Super Lawyers, 2019–2025", "Best Lawyers in America", "AV Preeminent Rating"],
    admissionsLabel: "Bar Admissions",
    educationLabel: "Education",
    recognitionLabel: "Recognition",
    ctaLabel: "Schedule a consultation",
    ctaHref: "#",
  },
  Component: ContentAttorneyProfile,
})
