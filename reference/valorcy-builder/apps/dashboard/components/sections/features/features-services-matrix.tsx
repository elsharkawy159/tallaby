"use client"

import { ArrowRight, Zap, PenTool, BarChart, Globe, Code, Megaphone, type LucideIcon } from "lucide-react"
import { SectionContainer } from "@/components/sections/section-container"
import { SectionSlot } from "@/components/sections/_primitives/section-slot"
import { defineSection } from "@/components/sections/define-section"
import { SECTION_PADDING_STANDARD } from "@/components/sections/section-style-presets"
import { SECTION_THUMB_PLACEHOLDER, useSectionSurface } from "@/components/sections/shared"
import {
  ItemText,
  textOr,
  descriptionBlock,
  eyebrowBlock,
  headingBlock,
  iconField,
  iconFor,
  stretchItems,
} from "@/components/sections/features/features-parts"
import type { SectionComponentProps } from "@/components/sections/registry.types"

const ICONS: Record<string, LucideIcon> = { Zap, PenTool, BarChart, Globe, Code, Megaphone, ArrowRight }

type Service = { icon?: string; title?: string; description?: string; deliverables?: string; ctaLabel?: string; ctaHref?: string }

/** Pre-migration pages rendered this literal above every deliverables list. */
const DELIVERABLES_FALLBACK = "Deliverables"

/**
 * Offerings — spec-cards archetype.
 *
 * Centered header over service cards that each carry a filled icon, title and
 * description, a ruled-off deliverables list, and their own link. The card
 * chrome is identity; the header lines and the services collection are slot
 * entries.
 */
function FeaturesServicesMatrix ({ instance, isPreview, definition }: SectionComponentProps) {
  const { rootStyle } = useSectionSurface({ instanceId: instance.id })

  return (
    <section className="relative isolate overflow-x-clip bg-background" style={rootStyle}>
      <SectionContainer>
        <SectionSlot
          instance={instance}
          definition={definition}
          isPreview={isPreview}
          slotId="copy"
          className="flex flex-col items-center gap-5 text-center"
          entryClassName={stretchItems}
          align="center"
          renderItems={({ instance: inst }) => {
            const services = (inst.props.services as Service[] | undefined) ?? []
            if (services.length === 0) return null
            return (
              <div className="mt-9 grid grid-cols-1 gap-5 text-start md:grid-cols-2 lg:grid-cols-3">
                {services.map((svc, i) => {
                  const Icon = iconFor(ICONS, svc.icon, Zap)
                  return (
                    <div
                      key={i}
                      className="group flex flex-col rounded-2xl border border-border bg-card p-7 transition-all hover:border-primary/30"
                    >
                      <div className="flex text-foreground">
                        <Icon className="size-5" aria-hidden />
                      </div>
                      <ItemText
                        as="h3"
                        instance={inst}
                        collection="services"
                        index={i}
                        field="title"
                        value={svc.title}
                        elementId={`title${i}`}
                        isPreview={isPreview}
                        className="mt-5 text-lg font-semibold text-foreground"
                      />
                      <ItemText
                        as="p"
                        instance={inst}
                        collection="services"
                        index={i}
                        field="description"
                        value={svc.description}
                        elementId={`desc${i}`}
                        isPreview={isPreview}
                        className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground"
                      />
                      {svc.deliverables && (
                        <div className="mt-4 border-t border-border pt-4">
                          {/* One heading per card, so it is edited once in the inspector, not inline. */}
                          <p className="mb-1.5 text-xs font-semibold text-muted-foreground">
                            {textOr(inst, "deliverablesLabel", DELIVERABLES_FALLBACK)}
                          </p>
                          <ul className="space-y-1">
                            {svc.deliverables.split("\n").filter(Boolean).map((d, di) => (
                              <li key={di} className="flex items-center gap-1.5 text-xs text-foreground">
                                <span className="size-1 shrink-0 rounded-full bg-primary" />
                                {d.replace(/^[-•]\s*/, "")}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {svc.ctaLabel && (
                        <a
                          href={svc.ctaHref || "#"}
                          data-element-collection="services"
                          data-element-index={String(i)}
                          data-element-item-href-prop="ctaHref"
                          className="mt-5 flex items-center gap-1 text-xs font-semibold text-primary transition-opacity hover:opacity-70"
                        >
                          <ItemText
                            instance={inst}
                            collection="services"
                            index={i}
                            field="ctaLabel"
                            value={svc.ctaLabel}
                            isPreview={isPreview}
                          />
                        </a>
                      )}
                    </div>
                  )
                })}
              </div>
            )
          }}
        />
      </SectionContainer>
    </section>
  )
}

export const featuresServicesMatrixSection = defineSection({
  id: "features-services-matrix",
  displayName: "Offerings",
  description: "Service cards with a filled icon, description, ruled-off deliverables list and a link each.",
  category: "features",
  layoutArchetype: "spec-cards",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 1,
  industries: ["agency", "web_dev_service", "creative", "it_support", "home_services"],
  styles: ["modern", "corporate", "bold"],
  goals: ["leads", "education", "conversion"],
  complexity: "medium",
  density: "high",
  imageRequired: false,
  mobileScore: 90,
  editable: true,
  funnelStage: "consideration",
  conversionWeight: 75,
  trustWeight: 65,
  tags: ["services", "agency", "matrix", "deliverables", "offerings"],
  defaultStyle: SECTION_PADDING_STANDARD,
  rootStyleOptions: { applySectionPadding: false },
  defaultOptions: { align: "center", paddingY: "lg" },
  schema: {
    slots: [{ id: "copy", label: "Copy", isDefault: true }],
    blocks: [
      eyebrowBlock(),
      headingBlock({ headline: { maxLength: 70 } }),
      descriptionBlock({ maxLength: 200 }),
      {
        kind: "items",
        key: "services",
        canonical: "cards",
        label: "Services",
        pick: [],
        itemFields: [
          iconField(ICONS),
          { key: "title", label: "Service name", type: "text", canonical: "headline", maxLength: 50 },
          { key: "description", label: "Description", type: "textarea", canonical: "body", maxLength: 160 },
          { key: "deliverables", label: "Deliverables (one per line)", type: "textarea", aiHint: "Bullet list of what is delivered, one item per line", maxLength: 400 },
          { key: "ctaLabel", label: "CTA label", type: "text", canonical: "ctaPrimary", maxLength: 30 },
          { key: "ctaHref", label: "CTA link", type: "url", canonical: "ctaLink" },
        ],
        minItems: 1,
        maxItems: 9,
        newItem: () => ({ icon: "Zap", title: "Service", description: "What this service delivers.", deliverables: "Deliverable one\nDeliverable two", ctaLabel: "Learn more", ctaHref: "#" }),
      },
    ],
    settings: [
      { key: "deliverablesLabel", label: "Deliverables heading", type: "text", aiHint: "Small heading above each deliverables list", maxLength: 30, group: "content" },
    ],
  },
  defaultProps: {
    eyebrow: "Services",
    headline: "Everything your business needs to grow online",
    description: "End-to-end services delivered by senior specialists — no hand-offs, no surprises.",
    deliverablesLabel: DELIVERABLES_FALLBACK,
    services: [
      { icon: "PenTool", title: "Brand & design", description: "A visual identity and website design that sets you apart.", deliverables: "Logo and brand guidelines\nWebsite design system\nSocial media templates\nPresentation deck", ctaLabel: "Explore design", ctaHref: "#" },
      { icon: "Code", title: "Web development", description: "Fast, accessible sites built to scale with your business.", deliverables: "Responsive website build\nCMS setup and training\nPerformance optimisation\nOngoing maintenance", ctaLabel: "Explore development", ctaHref: "#" },
      { icon: "Megaphone", title: "Growth marketing", description: "Campaigns that bring the right visitors and turn them into customers.", deliverables: "Search engine optimisation\nPaid ad campaigns\nEmail automation\nMonthly reporting", ctaLabel: "Explore marketing", ctaHref: "#" },
    ],
  },
  Component: FeaturesServicesMatrix,
})
