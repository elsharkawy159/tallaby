"use client"

import { MapPin, DollarSign, Clock, ArrowRight } from "lucide-react"
import { SectionContainer } from "@/components/sections/section-container"
import { SectionSlot } from "@/components/sections/_primitives/section-slot"
import { defineSection } from "@/components/sections/define-section"
import { TYPE_BODY, TYPE_H2_SM } from "@/components/sections/_primitives/type-scale"
import { SECTION_PADDING_STANDARD } from "@/components/sections/section-style-presets"
import { SECTION_THUMB_PLACEHOLDER, useSectionSurface } from "@/components/sections/shared"
import {
  ItemText,
  collectionBlock,
  descriptionBlock,
  eyebrowBlock,
  headingBlock,
  itemsOf,
  kickerEyebrow,
  stretchItems,
  txt,
} from "@/components/sections/listings/listings-parts"
import type { SectionComponentProps } from "@/components/sections/registry.types"

type Job = { title?: string; company?: string; location?: string; salary?: string; type?: string; department?: string; href?: string }

/** Department pill tones — semantic tokens, keyed by the department names the defaults ship. */
const DEPT_TONES: Record<string, string> = {
  Design: "bg-primary/10 text-primary",
  Engineering: "bg-info/10 text-info",
  Marketing: "bg-accent text-accent-foreground",
  Success: "bg-success/10 text-success",
  Analytics: "bg-warning/10 text-warning",
}

/**
 * Openings — board archetype.
 *
 * Compact job rows: role and company, then location, salary and type, with a
 * department pill and an arrow linking out to the application.
 */
function ListingsJobs ({ instance, isPreview, definition }: SectionComponentProps) {
  const { rootStyle } = useSectionSurface({ instanceId: instance.id })

  return (
    <section style={rootStyle}>
      <SectionContainer>
        <SectionSlot
          instance={instance}
          definition={definition}
          isPreview={isPreview}
          slotId="copy"
          className="flex w-full flex-col items-start"
          entryClassName={stretchItems}
          align="left"
          headingClassName={`${TYPE_H2_SM} text-foreground`}
          bodyClassName={`${TYPE_BODY} mt-2`}
          overrides={{ eyebrow: kickerEyebrow(isPreview) }}
          renderItems={({ instance: inst }) => {
            const jobs = itemsOf<Job>(inst, "jobs")
            if (jobs.length === 0) return null
            return (
              <div className="mt-10 space-y-3">
                {jobs.map((job, i) => (
                  <a
                    key={i}
                    href={job.href || "#"}
                    className="group flex items-center gap-5 rounded-2xl border border-border bg-card px-5 py-4 transition hover:border-primary/40"
                  >
                    <div className="flex flex-1 flex-wrap items-center gap-x-5 gap-y-2">
                      <div className="min-w-0">
                        <ItemText
                          as="h3"
                          instance={inst}
                          collection="jobs"
                          index={i}
                          field="title"
                          value={job.title}
                          isPreview={isPreview}
                          className="font-semibold text-foreground"
                        />
                        <p className="text-sm text-muted-foreground">{txt(job.company)}</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><MapPin className="size-3" />{txt(job.location)}</span>
                        <span className="flex items-center gap-1"><DollarSign className="size-3" />{txt(job.salary)}</span>
                        <span className="flex items-center gap-1"><Clock className="size-3" />{txt(job.type)}</span>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <span
                        className={`hidden rounded-full px-2.5 py-0.5 text-[11px] font-semibold sm:inline-block ${DEPT_TONES[txt(job.department)] ?? "bg-muted text-muted-foreground"}`}
                      >
                        {txt(job.department)}
                      </span>
                      <ArrowRight className="size-4 text-muted-foreground/40 transition group-hover:text-primary rtl:rotate-180" />
                    </div>
                  </a>
                ))}
              </div>
            )
          }}
        />
      </SectionContainer>
    </section>
  )
}

export const listingsJobsSection = defineSection({
  id: "listings-jobs",
  displayName: "Openings",
  description: "Job rows with role, company, location, salary, employment type and a department pill.",
  category: "listings",
  layoutArchetype: "board",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 1,
  industries: ["saas", "agency", "startup", "enterprise", "tech", "generic"],
  styles: ["minimal", "modern", "corporate"],
  goals: ["leads", "brand", "engagement"],
  complexity: "low",
  density: "high",
  imageRequired: false,
  mobileScore: 90,
  editable: true,
  tags: ["listings", "jobs", "careers", "hiring", "board"],
  funnelStage: "consideration",
  conversionWeight: 55,
  defaultStyle: SECTION_PADDING_STANDARD,
  defaultOptions: { align: "start", paddingY: "lg" },
  schema: {
    slots: [{ id: "copy", label: "Copy", isDefault: true }],
    blocks: [
      eyebrowBlock({ aiHint: "Short label (1–3 words)" }),
      headingBlock({ aiHint: "Careers headline (2–5 words)", maxLength: 50 }),
      descriptionBlock({ aiHint: "Short hiring pitch (1–2 sentences)", maxLength: 160 }),
      collectionBlock({
        key: "jobs",
        label: "Job listings",
        minItems: 1,
        maxItems: 20,
        newItem: () => ({ title: "Job title", company: "Company", location: "Remote", salary: "$100k–$130k", type: "Full-time", department: "Engineering", href: "#" }),
        fields: [
          { key: "title", label: "Job title", type: "text", canonical: "headline", aiHint: "Role name", maxLength: 70, group: "content" },
          { key: "company", label: "Company", type: "text", canonical: "body", aiHint: "Company name", maxLength: 50, group: "content" },
          { key: "location", label: "Location", type: "text", aiHint: "e.g. Remote or New York, NY · Hybrid", maxLength: 60, group: "content" },
          { key: "salary", label: "Salary / rate", type: "text", aiHint: "e.g. $140k–$180k", maxLength: 30, group: "content" },
          { key: "type", label: "Employment type", type: "text", aiHint: "e.g. Full-time, Contract, Part-time", maxLength: 20, group: "content" },
          { key: "department", label: "Department", type: "text", aiHint: "e.g. Engineering, Design, Marketing", maxLength: 30, group: "content" },
          { key: "href", label: "Apply link", type: "url", group: "cta" },
        ],
      }),
    ],
  },
  defaultProps: {
    eyebrow: "Careers",
    headline: "Join the team",
    description: "We're a small, remote-first team building tools people love. Find a role where your work ships every week.",
    jobs: [
      { title: "Senior Product Designer", company: "Northwind Labs", location: "Remote · Europe", salary: "$110k–$140k", type: "Full-time", department: "Design", href: "#" },
      { title: "Staff Backend Engineer", company: "Northwind Labs", location: "Remote · Americas", salary: "$160k–$195k", type: "Full-time", department: "Engineering", href: "#" },
      { title: "Lifecycle Marketing Manager", company: "Northwind Labs", location: "London · Hybrid", salary: "$90k–$115k", type: "Full-time", department: "Marketing", href: "#" },
      { title: "Customer Success Lead", company: "Northwind Labs", location: "New York · Hybrid", salary: "$95k–$120k", type: "Full-time", department: "Success", href: "#" },
      { title: "Data Analyst", company: "Northwind Labs", location: "Remote", salary: "$70/hr", type: "Contract", department: "Analytics", href: "#" },
    ],
  },
  Component: ListingsJobs,
})
