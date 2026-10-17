"use client"

import { ShieldCheck } from "lucide-react"
import { SectionContainer } from "@/components/sections/section-container"
import { SectionSlot } from "@/components/sections/_primitives/section-slot"
import { defineSection } from "@/components/sections/define-section"
import { TYPE_BODY, TYPE_H2 } from "@/components/sections/_primitives/type-scale"
import { SECTION_PADDING_STANDARD } from "@/components/sections/section-style-presets"
import { SECTION_THUMB_PLACEHOLDER, useSectionSurface } from "@/components/sections/shared"
import { ItemImage, ItemText, PropText } from "@/components/sections/social-proof/social-proof-parts"
import type { SectionComponentProps } from "@/components/sections/registry.types"

type Certification = { logoUrl?: string; name?: string; issuer?: string; description?: string }

/** The header copy keeps its narrow measure; the tile row spans the container. */
const HEADER = "mx-auto w-full max-w-2xl"

/** Spacing each entry has always carried, attached to the entry so it travels with it. */
const ENTRY_CLASS: Record<string, string> = {
  eyebrow: `${HEADER} mb-3`,
  headline: HEADER,
  description: `${HEADER} mt-4`,
  items: "mt-12",
}

/**
 * Credentials — captioned-grid archetype.
 *
 * Compliance seals as fixed-width tiles that wrap and centre row by row: badge
 * art (a shield until one is uploaded), certification name and issuer. The
 * header and the tile row share one slot.
 */
function SocialProofCertifications ({ instance, isPreview, definition }: SectionComponentProps) {
  const { rootStyle, ds } = useSectionSurface({ instanceId: instance.id })

  return (
    <section className="relative isolate overflow-x-clip bg-muted/30" style={rootStyle}>
      <SectionContainer>
        <SectionSlot
          instance={instance}
          definition={definition}
          isPreview={isPreview}
          slotId="copy"
          className="flex flex-col text-center"
          align="center"
          entryClassName={(entry) => (entry.kind === "block" ? ENTRY_CLASS[entry.block.id] : `${HEADER} mt-4`)}
          headingClassName={`${TYPE_H2} text-foreground`}
          bodyClassName={`${TYPE_BODY}`}
          overrides={{
            // Rendered only when set, as it always was.
            eyebrow: ({ instance: inst }) =>
              inst.props.eyebrow ? (
                <PropText
                  instance={inst}
                  propKey="eyebrow"
                  className="text-xs font-semibold"
                  style={{ color: ds?.colors?.primary }}
                  isPreview={isPreview}
                />
              ) : null,
          }}
          renderItems={({ instance: inst }) => {
            const items = (inst.props.items as Certification[] | undefined) ?? []
            if (items.length === 0) return null
            return (
              <div className="flex flex-wrap justify-center gap-5">
                {items.map((cert, i) => (
                  <div
                    key={i}
                    className="flex w-44 flex-col items-center gap-3 rounded-2xl border border-border bg-background p-6 text-center"
                  >
                    <ItemImage
                      instance={inst}
                      collection="items"
                      index={i}
                      srcField="logoUrl"
                      alt={String(cert.name ?? "")}
                      className="h-12 w-auto object-contain"
                      isPreview={isPreview}
                      fallback={<ShieldCheck className="size-10" style={{ color: ds?.colors?.primary }} aria-hidden />}
                    />
                    <div>
                      <ItemText
                        instance={inst}
                        collection="items"
                        index={i}
                        field="name"
                        elementKey={`cname${i}`}
                        labelProp
                        className="text-sm font-semibold text-foreground"
                        isPreview={isPreview}
                      />
                      <ItemText
                        instance={inst}
                        collection="items"
                        index={i}
                        field="issuer"
                        elementKey={`cissuer${i}`}
                        labelProp
                        className="text-xs text-muted-foreground"
                        isPreview={isPreview}
                      />
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

export const socialProofCertificationsSection = defineSection({
  id: "social-proof-certifications",
  displayName: "Credentials",
  description: "Compliance seals as centred tiles — badge, certification name and issuer.",
  category: "social-proof",
  layoutArchetype: "captioned-grid",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 1,
  industries: ["saas", "enterprise", "finance", "law", "medical", "dentist", "it_support", "agency"],
  styles: ["modern", "corporate", "minimal"],
  goals: ["trust", "conversion"],
  complexity: "low",
  density: "low",
  imageRequired: false,
  mobileScore: 95,
  editable: true,
  funnelStage: "decision",
  conversionWeight: 60,
  trustWeight: 95,
  tags: ["certifications", "trust", "compliance", "badges", "accreditation"],
  defaultStyle: SECTION_PADDING_STANDARD,
  rootStyleOptions: { applySectionPadding: false },
  defaultOptions: { align: "center", paddingY: "lg" },
  schema: {
    slots: [{ id: "copy", label: "Copy", isDefault: true }],
    blocks: [
      { kind: "eyebrow", field: { key: "eyebrow", label: "Eyebrow", canonical: "eyebrow", maxLength: 30, group: "content" } },
      {
        kind: "heading",
        level: 2,
        accent: false,
        fields: { headline: { key: "headline", label: "Headline", canonical: "headline", maxLength: 60, group: "content" } },
      },
      { kind: "body", field: { key: "description", label: "Description", type: "textarea", canonical: "body", maxLength: 200, group: "content" } },
      {
        kind: "items",
        key: "items",
        canonical: "items",
        label: "Certifications",
        pick: [],
        itemFields: [
          { key: "logoUrl", label: "Badge logo", type: "image", canonical: "image" },
          { key: "name", label: "Certification name", type: "text", canonical: "headline", maxLength: 40 },
          { key: "issuer", label: "Issuer", type: "text", aiHint: "Organization that issued this certification", maxLength: 40 },
        ],
        itemPlaceholder: "logo",
        minItems: 1,
        maxItems: 10,
        newItem: () => ({ logoUrl: "", name: "Certification", issuer: "Issuer", description: "" }),
      },
    ],
  },
  defaultProps: {
    eyebrow: "Security & compliance",
    headline: "Audited, certified and built for trust",
    description: "Independent auditors verify our controls every year, so your security review takes days instead of months.",
    items: [
      { logoUrl: "", name: "SOC 2 Type II", issuer: "AICPA", description: "" },
      { logoUrl: "", name: "ISO 27001", issuer: "ISO", description: "" },
      { logoUrl: "", name: "GDPR Ready", issuer: "EU", description: "" },
      { logoUrl: "", name: "HIPAA", issuer: "HHS", description: "" },
      { logoUrl: "", name: "PCI DSS", issuer: "PCI SSC", description: "" },
    ],
  },
  Component: SocialProofCertifications,
})
