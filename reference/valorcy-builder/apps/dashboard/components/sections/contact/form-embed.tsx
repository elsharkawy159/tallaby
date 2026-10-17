"use client"

import { useCallback, useEffect, useState } from "react"
import { ClipboardList, Loader2 } from "lucide-react"
import { InlineEditableText } from "@/components/website-builder/inline-editable"
import { SectionContainer } from "@/components/sections/section-container"
import type { SectionComponentProps } from "@/components/sections/registry.types"
import { SECTION_PADDING_MEDIUM } from "@/components/sections/section-style-presets"
import { SECTION_THUMB_PLACEHOLDER, useSectionSurface } from "@/components/sections/shared"
import { defineSection } from "@/components/sections/define-section"
import { usePublicSiteContext } from "@/components/website-builder/public-site-context"
import { CustomFormRenderer } from "@/components/forms/custom-form-renderer"
import { useBuilderStore } from "@/lib/builder/store"
import type { PublicFormDefinition } from "@/lib/forms/types"
import { cn } from "@workspace/ui/lib/utils"

/* ─── Custom form embed ────────────────────────────────────────────────────
   Renders a form built in the dashboard (/forms). Only the form id is stored
   on the section; the definition is fetched live so edits to the form show up
   on every page without republishing. Inserted from the builder's Forms tab.
   ────────────────────────────────────────────────────────────────────────── */

type LoadState =
  | { status: "idle" | "loading" }
  | { status: "ready"; form: PublicFormDefinition }
  | { status: "missing" }

function usePublicForm (formId: string, refetchOnFocus: boolean): LoadState {
  const [state, setState] = useState<LoadState>({ status: "idle" })

  const load = useCallback(
    async (signal?: AbortSignal) => {
      if (!formId) {
        setState({ status: "idle" })
        return
      }
      setState((prev) => (prev.status === "ready" && prev.form.id === formId ? prev : { status: "loading" }))
      try {
        const res = await fetch(`/api/forms/${encodeURIComponent(formId)}`, {
          signal,
          cache: "no-store",
        })
        const json = await res.json().catch(() => null)
        if (!res.ok || !json?.ok) {
          setState({ status: "missing" })
          return
        }
        setState({ status: "ready", form: json.form as PublicFormDefinition })
      } catch (err) {
        if ((err as Error)?.name !== "AbortError") setState({ status: "missing" })
      }
    },
    [formId]
  )

  useEffect(() => {
    const controller = new AbortController()
    void load(controller.signal)
    return () => controller.abort()
  }, [load])

  // In the editor, pick up changes made to the form in another tab.
  useEffect(() => {
    if (!refetchOnFocus) return
    const onVisible = () => {
      if (document.visibilityState === "visible") void load()
    }
    document.addEventListener("visibilitychange", onVisible)
    return () => document.removeEventListener("visibilitychange", onVisible)
  }, [load, refetchOnFocus])

  return state
}

function FormEmbed ({ instance, isPreview }: SectionComponentProps) {
  const { rootStyle, ds } = useSectionSurface({ instanceId: instance.id })
  const ctx = usePublicSiteContext()
  const store = useBuilderStore.getState

  const formId = String(instance.props.formId ?? "")
  const formName = String(instance.props.formName ?? "")
  const eyebrow = String(instance.props.eyebrow ?? "")
  const headline = String(instance.props.headline ?? "")
  const description = String(instance.props.description ?? "")
  const showHeader = instance.props.showHeader !== false
  const cardStyle = instance.props.cardStyle !== false

  const state = usePublicForm(formId, !isPreview)
  const setProp = (key: string) => (value: string) =>
    store().updateSectionProps(instance.id, { [key]: value })

  // Published site: render nothing rather than a broken shell.
  if (isPreview && (!formId || state.status === "missing")) return null

  let body: React.ReactNode
  if (!formId) {
    body = (
      <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border px-6 py-12 text-center">
        <ClipboardList className="size-8 text-muted-foreground/60" aria-hidden />
        <p className="text-sm font-medium text-foreground">No form selected</p>
        <p className="max-w-sm text-sm text-muted-foreground">
          Pick a form in the Content panel, or add one from the Forms tab.
        </p>
      </div>
    )
  } else if (state.status === "ready") {
    body = (
      <CustomFormRenderer
        formId={state.form.id}
        fields={state.form.fields}
        settings={state.form.settings}
        websiteId={isPreview ? ctx?.websiteId ?? null : null}
        idPrefix={`form-${instance.id}`}
        buttonStyle={{ background: ds.colors.primary, color: "var(--primary-foreground)" }}
      />
    )
  } else if (state.status === "missing") {
    body = (
      <div className="rounded-xl border border-dashed border-destructive/40 px-6 py-10 text-center text-sm text-muted-foreground">
        {formName ? `“${formName}”` : "This form"} is unavailable — it may have been deleted or disabled.
      </div>
    )
  } else {
    body = (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        <Loader2 className="size-5 animate-spin" aria-hidden />
      </div>
    )
  }

  return (
    <section className="relative overflow-x-clip bg-background" style={rootStyle}>
      <SectionContainer>
        <div className="mx-auto max-w-2xl">
          {showHeader ? (
            <div className="mb-8 text-center">
              {eyebrow || !isPreview ? (
                <InlineEditableText
                  as="p"
                  data-element-id={`${instance.id}::eyebrow`}
                  data-element-type="text"
                  className="text-xs font-semibold text-primary"
                  value={eyebrow}
                  isPreview={isPreview}
                  onChange={setProp("eyebrow")}
                  onCommit={setProp("eyebrow")}
                />
              ) : null}
              <InlineEditableText
                as="h2"
                data-element-id={`${instance.id}::headline`}
                data-element-type="text"
                className="mt-2 text-[clamp(1.75rem,2vw+1rem,2.5rem)] font-semibold leading-[1.1] tracking-[-0.02em] text-foreground"
                value={headline}
                isPreview={isPreview}
                onChange={setProp("headline")}
                onCommit={setProp("headline")}
              />
              {description || !isPreview ? (
                <InlineEditableText
                  as="p"
                  data-element-id={`${instance.id}::description`}
                  data-element-type="text"
                  className="mt-3 leading-relaxed text-muted-foreground"
                  value={description}
                  isPreview={isPreview}
                  onChange={setProp("description")}
                  onCommit={setProp("description")}
                />
              ) : null}
            </div>
          ) : null}
          <div
            data-no-instrument=""
            className={cn(cardStyle && "rounded-2xl border border-border/60 bg-card p-6 shadow-xs sm:p-8")}
          >
            {body}
          </div>
        </div>
      </SectionContainer>
    </section>
  )
}

export const formEmbedSection = defineSection({
  id: "form-embed",
  displayName: "Custom form",
  description: "A form built in the dashboard form builder, embedded on the page.",
  category: "contact",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 1,
  // Inserted from the builder's Forms tab (needs a form id), so it stays out of
  // the layouts palette and the AI manifest.
  hidden: true,
  industries: ["generic"],
  styles: ["minimal", "modern"],
  goals: ["leads"],
  complexity: "low",
  density: "low",
  imageRequired: false,
  mobileScore: 95,
  editable: true,
  editableElements: ["headline", "body"],
  tags: ["form", "contact", "leads"],
  conversionWeight: 70,
  funnelStage: "decision",
  defaultProps: {
    formId: "",
    formName: "",
    eyebrow: "",
    headline: "Get in touch",
    description: "Fill out the form and we'll get back to you shortly.",
    showHeader: true,
    cardStyle: true,
  },
  defaultStyle: SECTION_PADDING_MEDIUM,
  rootStyleOptions: { applySectionPadding: false },
  propDefinitions: [
    { key: "eyebrow", label: "Eyebrow", type: "text", maxLength: 40, group: "content" },
    { key: "headline", label: "Headline", type: "text", canonical: "headline", aiHint: "Short form headline (3–8 words)", maxLength: 80, group: "content" },
    { key: "description", label: "Description", type: "textarea", canonical: "body", aiHint: "One sentence inviting visitors to fill the form", maxLength: 200, group: "content" },
    { key: "showHeader", label: "Show heading", type: "switch", group: "layout" },
    { key: "cardStyle", label: "Card background", type: "switch", group: "appearance" },
  ],
  Component: FormEmbed,
})
