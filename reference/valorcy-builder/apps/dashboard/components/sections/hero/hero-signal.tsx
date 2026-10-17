"use client"

import { SectionContainer } from "@/components/sections/section-container"
import { SectionSlot } from "@/components/sections/_primitives/section-slot"
import { SECTION_PADDING_XL } from "@/components/sections/section-style-presets"
import { SECTION_THUMB_PLACEHOLDER, useSectionSurface } from "@/components/sections/shared"
import { defineSection } from "@/components/sections/define-section"
import { TYPE_H2, TYPE_BODY } from "@/components/sections/_primitives/type-scale"
import { InlineEditableText } from "@/components/website-builder/inline-editable"
import { useBuilderStore } from "@/lib/builder/store"
import type { SectionComponentProps } from "@/components/sections/registry.types"

type ProofItem = { value?: string; label?: string }

/**
 * Signal — floating archetype.
 *
 * Signature move: one solid panel holding one job, capturing the email. No glow,
 * no shadow, no blur behind it. Nothing else competes (no product shot, no
 * secondary CTA), because a waitlist converts better with fewer options.
 * Replaces `hero-waitlist`.
 *
 * `submitLabel` and `placeholder` are two schema blocks that render as one
 * `<form>`, so the first one draws the whole capture row and the second renders
 * nothing. Both stay individually editable in the content panel.
 */
function HeroSignal ({ instance, isPreview, definition }: SectionComponentProps) {
  const { rootStyle } = useSectionSurface({ instanceId: instance.id })
  const store = useBuilderStore.getState

  return (
    <section className="relative overflow-hidden" style={rootStyle}>
      <SectionContainer className="relative flex justify-center">
        <SectionSlot
          instance={instance}
          definition={definition}
          isPreview={isPreview}
          slotId="card"
          className="flex w-full max-w-2xl flex-col items-center gap-6 rounded-2xl bg-muted/60 p-8 text-center sm:p-14"
          headingLevel={1}
          align="center"
          headingClassName={`${TYPE_H2} text-foreground`}
          bodyClassName={`${TYPE_BODY} max-w-md`}
          overrides={{
            // Capture row. Presentational in the builder; the published site
            // wires it through the standard form handler like every other
            // section form.
            submitLabel: ({ instance: inst }) => (
              <form
                className="flex w-full max-w-md flex-col gap-2.5 sm:flex-row"
                onSubmit={(e) => e.preventDefault()}
              >
                <input
                  type="email"
                  required
                  placeholder={String(inst.props.placeholder ?? "you@company.com")}
                  className="h-12 w-full flex-1 rounded-lg border border-border bg-background px-4 text-[15px] text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-primary"
                />
                <button
                  type="submit"
                  className="inline-flex h-12 shrink-0 items-center justify-center rounded-lg bg-primary px-6 text-[15px] font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  <InlineEditableText
                    as="span"
                    data-element-id={`${inst.id}::submitLabel`}
                    data-element-type="text"
                    value={String(inst.props.submitLabel ?? "Join the waitlist")}
                    isPreview={isPreview}
                    onChange={(t) => store().updateSectionProps(inst.id, { submitLabel: t })}
                    onCommit={(t) => store().updateSectionProps(inst.id, { submitLabel: t })}
                  />
                </button>
              </form>
            ),
            // Drawn by the form above; editable in the content panel only.
            placeholder: () => null,
          }}
          renderItems={({ instance: inst }) => {
            const proof = (inst.props.proof as ProofItem[]) ?? []
            if (proof.length === 0) return null
            return (
              <div className="mt-2 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 border-t border-border pt-6">
                {proof.map((item, i) => (
                  <div key={i} className="flex items-baseline gap-1.5">
                    <InlineEditableText
                      as="span"
                      data-element-id={`${inst.id}::proof.${i}.value`}
                      data-element-type="text"
                      className="font-heading text-lg font-semibold text-foreground"
                      value={String(item.value ?? "")}
                      isPreview={isPreview}
                      onChange={(t) => store().updateItem(inst.id, "proof", i, { value: t })}
                      onCommit={(t) => store().updateItem(inst.id, "proof", i, { value: t })}
                    />
                    <InlineEditableText
                      as="span"
                      data-element-id={`${inst.id}::proof.${i}.label`}
                      data-element-type="text"
                      className="text-sm text-muted-foreground"
                      value={String(item.label ?? "")}
                      isPreview={isPreview}
                      onChange={(t) => store().updateItem(inst.id, "proof", i, { label: t })}
                      onCommit={(t) => store().updateItem(inst.id, "proof", i, { label: t })}
                    />
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

export const heroSignalSection = defineSection({
  id: "hero-signal",
  displayName: "Signal",
  description: "Floating capture card — one headline, one field, one action.",
  category: "hero",
  detachable: false,
  layoutArchetype: "floating",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 4,
  defaultStyle: SECTION_PADDING_XL,
  industries: ["saas", "startup", "app_landing", "ai_startup", "software", "generic"],
  styles: ["modern", "minimal"],
  goals: ["leads", "conversion"],
  complexity: "low",
  density: "low",
  imageRequired: false,
  mobileScore: 98,
  editable: true,
  trustWeight: 20,
  conversionWeight: 60,
  funnelStage: "consideration",
  tags: ["waitlist", "capture", "card"],
  defaultOptions: { align: "center", paddingY: "xl" },
  schema: {
    slots: [{ id: "card", label: "Capture card", isDefault: true }],
    blocks: [
      { kind: "badge" },
      { kind: "heading", level: 1, accent: false },
      { kind: "body" },
      {
        kind: "note",
        id: "submitLabel",
        label: "Button label",
        field: { key: "submitLabel", canonical: "ctaPrimary", maxLength: 30 },
      },
      {
        kind: "note",
        id: "placeholder",
        label: "Input placeholder",
        field: { key: "placeholder", maxLength: 40 },
      },
      { kind: "note", label: "Small note" },
      {
        kind: "items",
        key: "proof",
        canonical: "stats",
        label: "Proof points",
        pick: ["value", "label"],
        minItems: 0,
        maxItems: 3,
      },
    ],
  },
  defaultProps: {
    badge: "Launching soon",
    headline: "Be first through the door",
    description:
      "Join the waitlist and we will send you an invite the moment a seat opens up.",
    submitLabel: "Join the waitlist",
    placeholder: "you@company.com",
    note: "No spam. Unsubscribe any time.",
    proof: [
      { value: "4,800+", label: "on the list" },
      { value: "Q3", label: "public launch" },
    ],
  },
  Component: HeroSignal,
})
