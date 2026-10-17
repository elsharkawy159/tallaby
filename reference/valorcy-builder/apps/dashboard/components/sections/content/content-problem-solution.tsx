"use client"

import { X, Check } from "lucide-react"
import { SectionContainer } from "@/components/sections/section-container"
import { SectionSlot } from "@/components/sections/_primitives/section-slot"
import { defineSection } from "@/components/sections/define-section"
import { TYPE_H2, TYPE_LEAD } from "@/components/sections/_primitives/type-scale"
import { SECTION_PADDING_STANDARD } from "@/components/sections/section-style-presets"
import { SECTION_THUMB_PLACEHOLDER, useSectionSurface } from "@/components/sections/shared"
import { PropText, propText, stringListBlock, toStringList } from "@/components/sections/content/content-parts"
import type { BlockOverride } from "@/components/sections/_primitives/block-renderer"
import type { SectionComponentProps } from "@/components/sections/registry.types"

/** A column title with its leading icon. */
function columnTitle (key: string, tone: "problem" | "solution"): BlockOverride {
  return function ColumnTitle ({ instance, isPreview }) {
    const Icon = tone === "problem" ? X : Check
    return (
      <p
        className={
          tone === "problem"
            ? "mb-5 flex items-center gap-2 text-sm font-semibold text-destructive"
            : "mb-5 flex items-center gap-2 text-sm font-semibold text-primary"
        }
      >
        <Icon className="size-4" aria-hidden />
        <PropText as="span" instance={instance} propKey={key} isPreview={isPreview} />
      </p>
    )
  }
}

/** A string-list prop drawn as an X or check list. */
function columnList (key: string, tone: "problem" | "solution"): BlockOverride {
  return function ColumnList ({ instance }) {
    const entries = toStringList(instance.props[key])
    if (entries.length === 0) return null
    return (
      <ul className="space-y-3">
        {entries.map((entry, i) => (
          <li
            key={i}
            className={
              tone === "problem"
                ? "flex items-start gap-3 text-sm text-muted-foreground"
                : "flex items-start gap-3 text-sm text-foreground"
            }
          >
            {tone === "problem" ? (
              <X className="mt-0.5 size-4 shrink-0 text-destructive/70" aria-hidden />
            ) : (
              <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
            )}
            {entry}
          </li>
        ))}
      </ul>
    )
  }
}

/**
 * Contrast — comparison archetype.
 *
 * A centred header over two cards: the pain points with crosses on a
 * destructive-tinted card, the solution with checks on a brand-tinted card.
 * Three slots — the header and one per card — because each card is its own
 * surface.
 */
function ContentProblemSolution ({ instance, isPreview, definition }: SectionComponentProps) {
  const { rootStyle } = useSectionSurface({ instanceId: instance.id })

  return (
    <section className="relative isolate overflow-x-clip bg-background" style={rootStyle}>
      <SectionContainer>
        <SectionSlot
          instance={instance}
          definition={definition}
          isPreview={isPreview}
          slotId="copy"
          className="mx-auto flex max-w-2xl flex-col items-center text-center"
          align="center"
          headingClassName={`${TYPE_H2} text-foreground`}
          bodyClassName={`${TYPE_LEAD} mt-4`}
          overrides={{
            eyebrow: propText("eyebrow", {
              className: "mb-3 text-xs font-semibold text-primary",
            }),
          }}
        />

        <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-2">
          <SectionSlot
            instance={instance}
            definition={definition}
            isPreview={isPreview}
            slotId="problems"
            className="flex flex-col rounded-2xl border border-destructive/20 bg-destructive/5 p-8"
            overrides={{
              problemTitle: columnTitle("problemTitle", "problem"),
              problems: columnList("problems", "problem"),
            }}
          />
          <SectionSlot
            instance={instance}
            definition={definition}
            isPreview={isPreview}
            slotId="solutions"
            className="flex flex-col rounded-2xl border border-primary/30 bg-primary/5 p-8"
            overrides={{
              solutionTitle: columnTitle("solutionTitle", "solution"),
              solutions: columnList("solutions", "solution"),
            }}
          />
        </div>
      </SectionContainer>
    </section>
  )
}

export const contentProblemSolutionSection = defineSection({
  id: "content-problem-solution",
  displayName: "Contrast",
  description: "Before and after — pain points with crosses beside your solution with checks.",
  category: "content",
  layoutArchetype: "comparison",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 1,
  industries: ["saas", "startup", "software", "ai_startup", "app_landing"],
  styles: ["modern", "bold", "minimal"],
  goals: ["conversion", "education", "engagement"],
  complexity: "low",
  density: "medium",
  imageRequired: false,
  mobileScore: 95,
  editable: true,
  funnelStage: "awareness",
  conversionWeight: 75,
  trustWeight: 60,
  tags: ["problem", "solution", "before-after", "pain-point", "landing-page"],
  defaultStyle: SECTION_PADDING_STANDARD,
  rootStyleOptions: { applySectionPadding: false },
  defaultOptions: { align: "center", paddingY: "lg" },
  schema: {
    slots: [
      { id: "copy", label: "Copy", isDefault: true },
      { id: "problems", label: "Problem card", eject: { direction: "column" } },
      { id: "solutions", label: "Solution card", eject: { direction: "column" } },
    ],
    blocks: [
      { kind: "eyebrow", field: { key: "eyebrow", canonical: "eyebrow", maxLength: 30 } },
      { kind: "heading", level: 2, accent: false, fields: { headline: { key: "headline", maxLength: 70 } } },
      { kind: "body", field: { key: "description", maxLength: 200 } },
      {
        kind: "note",
        id: "problemTitle",
        label: "Problem column title",
        slot: "problems",
        field: { key: "problemTitle", label: "Problem column title", type: "text", aiHint: "Label for the 'before' column", maxLength: 30, group: "content" },
      },
      stringListBlock(
        { key: "problems", label: "Pain points (JSON array)", aiHint: "Array of pain point strings", maxLength: 1000 },
        "problems"
      ),
      {
        kind: "note",
        id: "solutionTitle",
        label: "Solution column title",
        slot: "solutions",
        field: { key: "solutionTitle", label: "Solution column title", type: "text", aiHint: "Label for the 'after' column", maxLength: 30, group: "content" },
      },
      stringListBlock(
        { key: "solutions", label: "Solutions (JSON array)", aiHint: "Array of solution strings matching each pain point", maxLength: 1000 },
        "solutions"
      ),
    ],
  },
  defaultProps: {
    eyebrow: "Why switch",
    headline: "Stop fighting your tools",
    description: "Most teams lose hours every week to work about work. Here is what changes.",
    problemTitle: "Without us",
    solutionTitle: "With us",
    problems: [
      "Status updates scattered across email and chat",
      "Reports rebuilt by hand every Friday",
      "No single view of who is working on what",
      "Handoffs that quietly drop details",
      "New hires take weeks to find their way around",
    ],
    solutions: [
      "One shared timeline everyone can see",
      "Reports that update themselves in real time",
      "Clear ownership on every task",
      "Handoffs with context attached automatically",
      "Onboarding paths that get people productive in days",
    ],
  },
  Component: ContentProblemSolution,
})
