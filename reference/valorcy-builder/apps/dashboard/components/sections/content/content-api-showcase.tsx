"use client"

import { useState } from "react"
import { cn } from "@workspace/ui/lib/utils"
import { SectionContainer } from "@/components/sections/section-container"
import { SectionSlot } from "@/components/sections/_primitives/section-slot"
import { defineSection } from "@/components/sections/define-section"
import { SECTION_PADDING_STANDARD } from "@/components/sections/section-style-presets"
import { SECTION_THUMB_PLACEHOLDER, useSectionSurface } from "@/components/sections/shared"
import type { SectionComponentProps, SectionInstance } from "@/components/sections/registry.types"

type CodeTab = { label?: string; language?: string; code?: string }

/**
 * The tab strip and code window. Its own component because the active tab is
 * local state, and `renderItems` is a render callback, not a component.
 */
function CodeTabs ({ instance }: { instance: SectionInstance }) {
  const tabs = (instance.props.tabs as CodeTab[] | undefined) ?? []
  const [active, setActive] = useState(0)
  if (tabs.length === 0) return null
  const current = tabs[Math.min(active, tabs.length - 1)]

  return (
    <div>
      <div className="flex gap-1 rounded-xl border border-border bg-muted/40 p-1" role="tablist">
        {tabs.map((tab, i) => (
          <button
            key={i}
            type="button"
            role="tab"
            aria-selected={active === i}
            onClick={() => setActive(i)}
            className={cn(
              "flex-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
              active === i ? "bg-background text-foreground" : "text-muted-foreground"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {current ? (
        <div className="mt-3 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950">
          <div className="flex items-center gap-1.5 border-b border-zinc-800 px-4 py-2.5">
            {[0, 1, 2].map((dot) => (
              <span key={dot} aria-hidden className="size-3 rounded-full bg-zinc-700" />
            ))}
            <span className="ms-2 text-xs text-zinc-400">{current.language}</span>
          </div>
          <pre className="overflow-x-auto p-5 text-[0.8125rem] leading-relaxed text-zinc-100" dir="ltr">
            <code>{current.code}</code>
          </pre>
        </div>
      ) : null}
    </div>
  )
}

/**
 * Console — code-sample archetype.
 *
 * The pitch on the start side, a tabbed code window on the end side — one tab
 * per language or SDK. Two slots: the copy column and the code column. The
 * window takes the site's own surface colours so it reads in light and dark.
 */
function ContentApiShowcase ({ instance, isPreview, definition }: SectionComponentProps) {
  const { rootStyle } = useSectionSurface({ instanceId: instance.id })

  return (
    <section className="relative isolate overflow-x-clip bg-background" style={rootStyle}>
      <SectionContainer>
        <div className="grid grid-cols-1 gap-16 lg:grid-cols-2 lg:items-center">
          <SectionSlot
            instance={instance}
            definition={definition}
            isPreview={isPreview}
            slotId="copy"
            className="flex w-full flex-col items-start gap-5 text-start"
            align="left"
          />
          <SectionSlot
            instance={instance}
            definition={definition}
            isPreview={isPreview}
            slotId="code"
            className="flex flex-col"
            renderItems={({ instance: inst }) => <CodeTabs instance={inst} />}
          />
        </div>
      </SectionContainer>
    </section>
  )
}

export const contentApiShowcaseSection = defineSection({
  id: "content-api-showcase",
  displayName: "Console",
  description: "The pitch beside a tabbed code window showing API or SDK usage per language.",
  category: "content",
  layoutArchetype: "code-sample",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 1,
  industries: ["saas", "software", "tech", "ai_startup", "web_dev_service"],
  styles: ["modern", "dark", "minimal"],
  goals: ["education", "trust", "conversion"],
  complexity: "medium",
  density: "medium",
  imageRequired: false,
  mobileScore: 85,
  editable: true,
  funnelStage: "consideration",
  conversionWeight: 65,
  trustWeight: 70,
  tags: ["api", "code", "developer", "sdk", "saas", "technical"],
  defaultStyle: SECTION_PADDING_STANDARD,
  rootStyleOptions: { applySectionPadding: false },
  defaultOptions: { align: "start", paddingY: "lg" },
  schema: {
    slots: [
      { id: "copy", label: "Copy", isDefault: true },
      { id: "code", label: "Code", eject: { direction: "column" } },
    ],
    blocks: [
      { kind: "eyebrow", field: { key: "eyebrow", canonical: "eyebrow", maxLength: 30 } },
      { kind: "heading", level: 2, accent: false, fields: { headline: { key: "headline", maxLength: 70 } } },
      { kind: "body", field: { key: "description", maxLength: 200 } },
      {
        kind: "items",
        key: "tabs",
        canonical: "items",
        label: "Code tabs",
        slot: "code",
        pick: [],
        itemFields: [
          { key: "label", label: "Tab label", type: "text", aiHint: "Language or framework name", maxLength: 20 },
          { key: "language", label: "Language hint", type: "text", aiHint: "Language identifier for display (e.g. javascript, python)", maxLength: 20 },
          { key: "code", label: "Code snippet", type: "textarea", aiHint: "Code example for this language", maxLength: 1000 },
        ],
        minItems: 1,
        maxItems: 5,
        newItem: () => ({ label: "Language", language: "javascript", code: "// your code here" }),
      },
    ],
  },
  defaultProps: {
    eyebrow: "Developers",
    headline: "Integrate in an afternoon",
    description: "Typed SDKs for every major language and a REST API that behaves exactly the way the docs say it does.",
    tabs: [
      { label: "Node.js", language: "javascript", code: `import { Acme } from '@acme/sdk'\n\nconst client = new Acme({ apiKey: process.env.ACME_KEY })\n\nconst result = await client.analyze({\n  text: 'Your content here',\n  model: 'acme-v2',\n})\n\nconsole.log(result.output)` },
      { label: "Python", language: "python", code: `from acme import Acme\n\nclient = Acme(api_key=os.environ["ACME_KEY"])\n\nresult = client.analyze(\n    text="Your content here",\n    model="acme-v2",\n)\n\nprint(result.output)` },
      { label: "cURL", language: "bash", code: `curl https://api.acme.io/v1/analyze \\\n  -H "Authorization: Bearer $ACME_KEY" \\\n  -H "Content-Type: application/json" \\\n  -d '{"text":"Your content","model":"acme-v2"}'` },
    ],
  },
  Component: ContentApiShowcase,
})
