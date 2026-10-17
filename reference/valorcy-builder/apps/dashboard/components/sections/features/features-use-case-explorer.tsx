"use client"

import { useState } from "react"
import { Zap, Users, Building2, BarChart2, type LucideIcon } from "lucide-react"
import { cn } from "@workspace/ui/lib/utils"
import { SectionContainer } from "@/components/sections/section-container"
import { SectionSlot } from "@/components/sections/_primitives/section-slot"
import { defineSection } from "@/components/sections/define-section"
import { SECTION_PADDING_STANDARD } from "@/components/sections/section-style-presets"
import { SECTION_THUMB_PLACEHOLDER, useSectionSurface } from "@/components/sections/shared"
import {
  ItemText,
  eyebrowBlock,
  headingBlock,
  iconField,
  iconFor,
  stretchItems,
} from "@/components/sections/features/features-parts"
import type { SectionComponentProps, SectionInstance } from "@/components/sections/registry.types"

const ICONS: Record<string, LucideIcon> = { Zap, Users, Building2, BarChart2 }

type UseCase = { tab?: string; icon?: string; headline?: string; description?: string; points?: string }

/** The tab strip and active panel. Its own component so the active-tab state lives in a real hook owner. */
function UseCaseTabs ({ instance, isPreview }: { instance: SectionInstance; isPreview?: boolean }) {
  const [active, setActive] = useState(0)
  const useCases = (instance.props.useCases as UseCase[] | undefined) ?? []
  if (useCases.length === 0) return null
  const index = Math.min(active, useCases.length - 1)
  const current = useCases[index]!

  return (
    <div>
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        {useCases.map((uc, i) => {
          const Icon = iconFor(ICONS, uc.icon, Zap)
          return (
            <button
              key={i}
              type="button"
              onClick={() => setActive(i)}
              className={cn(
                "flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-all",
                index === i ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"
              )}
            >
              <Icon className="size-4" aria-hidden />
              {uc.tab}
            </button>
          )
        })}
      </div>

      <div className="mt-10 rounded-2xl border border-border bg-card p-8 text-start lg:p-12">
        <ItemText
          as="h3"
          instance={instance}
          collection="useCases"
          index={index}
          field="headline"
          value={current.headline}
          elementId={`headline${index}`}
          isPreview={isPreview}
          className="text-2xl font-semibold tracking-tight text-foreground"
        />
        <ItemText
          as="p"
          instance={instance}
          collection="useCases"
          index={index}
          field="description"
          value={current.description}
          elementId={`desc${index}`}
          isPreview={isPreview}
          className="mt-3 text-base leading-relaxed text-muted-foreground"
        />
        {current.points && (
          <ul className="mt-6 grid gap-2 sm:grid-cols-2">
            {current.points.split("\n").filter(Boolean).map((point, pi) => (
              <li key={pi} className="flex items-start gap-2 text-sm text-foreground">
                <span className="mt-0.5 shrink-0 text-muted-foreground" aria-hidden>✓</span>
                {point.replace(/^[-•]\s*/, "")}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

/**
 * Explorer — tabs archetype.
 *
 * Centered header over a strip of persona tabs; the active tab opens a panel
 * with its headline, description and benefit list. The tab strip and panel are
 * chrome around the `useCases` collection; the header lines are slot entries.
 */
function FeaturesUseCaseExplorer ({ instance, isPreview, definition }: SectionComponentProps) {
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
          renderItems={({ instance: inst }) => <UseCaseTabs instance={inst} isPreview={isPreview} />}
        />
      </SectionContainer>
    </section>
  )
}

export const featuresUseCaseExplorerSection = defineSection({
  id: "features-use-case-explorer",
  displayName: "Explorer",
  description: "Persona tabs — each opens a panel with its own headline, description and benefit list.",
  category: "features",
  layoutArchetype: "tabs",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 1,
  industries: ["saas", "software", "ai_startup", "enterprise", "tech"],
  styles: ["modern", "minimal"],
  goals: ["education", "conversion", "engagement"],
  complexity: "medium",
  density: "medium",
  imageRequired: false,
  mobileScore: 90,
  editable: true,
  funnelStage: "consideration",
  conversionWeight: 70,
  trustWeight: 55,
  tags: ["use-cases", "tabs", "personas", "saas", "explorer"],
  defaultStyle: SECTION_PADDING_STANDARD,
  rootStyleOptions: { applySectionPadding: false },
  defaultOptions: { align: "center", paddingY: "lg" },
  schema: {
    slots: [{ id: "copy", label: "Copy", isDefault: true }],
    blocks: [
      eyebrowBlock(),
      headingBlock({ headline: { maxLength: 70 } }),
      {
        kind: "items",
        key: "useCases",
        canonical: "cards",
        label: "Use cases",
        pick: [],
        itemFields: [
          { key: "tab", label: "Tab label", type: "text", aiHint: "Short tab label (1-2 words)", maxLength: 20 },
          iconField(ICONS),
          { key: "headline", label: "Headline", type: "text", canonical: "headline", maxLength: 60 },
          { key: "description", label: "Description", type: "textarea", canonical: "body", maxLength: 200 },
          { key: "points", label: "Bullet points (one per line)", type: "textarea", aiHint: "Key benefits for this persona, one per line", maxLength: 400 },
        ],
        minItems: 2,
        maxItems: 6,
        newItem: () => ({ tab: "New tab", icon: "Zap", headline: "Headline for this use case", description: "Describe the use case here.", points: "Benefit one\nBenefit two\nBenefit three" }),
      },
    ],
  },
  defaultProps: {
    eyebrow: "Use cases",
    headline: "Built for every team",
    useCases: [
      { tab: "Startups", icon: "Zap", headline: "Launch faster than your runway burns", description: "Validate ideas with real pages in hours and iterate on what visitors actually do.", points: "Ready-made launch layouts\nWaitlists and sign-up forms\nA/B-ready landing pages\nAnalytics from day one" },
      { tab: "Agencies", icon: "Users", headline: "Deliver more client sites with the same team", description: "Reuse your best work across projects and hand clients a site they can edit themselves.", points: "Reusable section library\nClient-friendly editing\nMulti-site management\nWhite-label publishing" },
      { tab: "Enterprise", icon: "Building2", headline: "Brand control at scale", description: "Give every team the freedom to publish while design tokens keep the brand consistent.", points: "Shared design systems\nRole-based permissions\nAudit-ready publishing\nSingle sign-on" },
    ],
  },
  Component: FeaturesUseCaseExplorer,
})
