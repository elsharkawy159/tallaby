"use client"

import { useState } from "react"
import { Mail, MessageCircle, Calendar, Send, Check, ArrowUpRight, type LucideIcon } from "lucide-react"
import { SectionContainer } from "@/components/sections/section-container"
import { SectionSlot } from "@/components/sections/_primitives/section-slot"
import { defineSection } from "@/components/sections/define-section"
import { SECTION_PADDING_MEDIUM, SECTION_ROOT_MUTED } from "@/components/sections/section-style-presets"
import { SECTION_THUMB_PLACEHOLDER, useSectionSurface } from "@/components/sections/shared"
import {
  HINTS,
  ItemText,
  PropText,
  badgeTextBlock,
  descriptionBlock,
  dotBadge,
  headingOverride,
  headlineBlock,
  noteBlock,
  textOverride,
} from "@/components/sections/contact/contact-parts"
import {
  ContactFormFeedback,
  ContactFormHoneypot,
  useContactSubmit,
} from "@/components/forms/use-contact-submit"
import type { SlotEntry } from "@/components/sections/schema/slot-entries"
import type { SectionComponentProps, SectionInstance } from "@/components/sections/registry.types"

const CHANNEL_ICONS: Record<string, LucideIcon> = { Mail, MessageCircle, Calendar }
const CHANNEL_ICON_OPTIONS = Object.keys(CHANNEL_ICONS).map((k) => ({ label: k, value: k }))

type Channel = { icon?: string; tag?: string; title?: string; body?: string; meta?: string; ctaText?: string; href?: string; featured?: boolean }
type ReasonChip = { label?: string }
type FormBullet = { text?: string }

/** What pages saved before the slot migration rendered while a prop was unset. */
const FALLBACK = {
  badgeText: "Lorem Ipsum",
  headline: "Lorem Ipsum Dolor",
  accentWord: "Dolor.",
  description:
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
  panelKicker: "Send a message",
  panelTitle: "Lorem Ipsum Dolor Sit",
  panelBody:
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
  reasonsLabel: "Lorem ipsum dolor sit amet?",
  submitText: "Lorem Ipsum",
} as const

const FIELD =
  "w-full rounded-lg border border-border bg-background py-3 px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-ring transition-colors"

/** Collection grids span the slot even though the slot centres its entries. */
const stretchItems = (entry: SlotEntry) =>
  entry.kind === "block" && entry.block.kind === "items" ? "w-full self-stretch" : undefined

function ChannelCards ({ instance, isPreview }: { instance: SectionInstance; isPreview?: boolean }) {
  const channels = (instance.props.channels as Channel[] | undefined) ?? []
  if (channels.length === 0) return null
  return (
    <div className="mt-12 grid gap-5 text-start md:grid-cols-3">
      {channels.map((c, i) => {
        const Icon = CHANNEL_ICONS[c.icon ?? ""] ?? Mail
        const text = (field: keyof Channel, as: "div" | "h3" | "p", className: string) => (
          <ItemText
            instance={instance}
            collection="channels"
            index={i}
            field={field}
            value={c[field]}
            as={as}
            className={className}
            isPreview={isPreview}
          />
        )
        return (
          <a
            key={i}
            href={isPreview ? c.href : undefined}
            data-element-id={`${instance.id}::channel${i}`}
            data-element-type="textLink"
            data-element-collection="channels"
            data-element-index={String(i)}
            data-element-item-href-prop="href"
            className={`group relative flex flex-col overflow-hidden rounded-2xl border bg-card p-6 transition-all hover:-translate-y-0.5 hover:shadow-lg ${
              c.featured ? "border-primary/30 shadow-md" : "border-border/60"
            }`}
          >
            {c.featured && (
              <span className="absolute end-4 top-4 inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                <span className="size-1.5 rounded-full bg-[var(--success)]" />
                Online
              </span>
            )}
            <span className="inline-flex text-foreground">
              <Icon className="size-5" aria-hidden />
            </span>
            {text("tag", "div", "mt-5 text-xs text-muted-foreground")}
            {text("title", "h3", "mt-1 text-[17px] font-semibold tracking-tight text-foreground")}
            {text("body", "p", "mt-2 text-[13.5px] leading-relaxed text-muted-foreground flex-1")}
            <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
              <span className="text-xs text-muted-foreground">{c.meta}</span>
              <span className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-foreground transition-colors group-hover:text-primary">
                {c.ctaText} <ArrowUpRight className="size-3.5" aria-hidden />
              </span>
            </div>
          </a>
        )
      })}
    </div>
  )
}

function FormBullets ({ instance, isPreview }: { instance: SectionInstance; isPreview?: boolean }) {
  const bullets = (instance.props.formBullets as FormBullet[] | undefined) ?? []
  if (bullets.length === 0) return null
  return (
    <ul className="mt-6 space-y-2.5">
      {bullets.map((b, i) => (
        <li key={i} className="flex items-start gap-2 text-[13px] text-foreground">
          <span className="mt-0.5 inline-flex shrink-0 text-foreground">
            <Check className="size-2.5" strokeWidth={2.5} aria-hidden />
          </span>
          <ItemText instance={instance} collection="formBullets" index={i} field="text" value={b.text} isPreview={isPreview} />
        </li>
      ))}
    </ul>
  )
}

function ReasonChips ({
  instance,
  active,
  onSelect,
}: {
  instance: SectionInstance
  active: number
  onSelect: (i: number) => void
}) {
  const chips = (instance.props.reasonChips as ReasonChip[] | undefined) ?? []
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {chips.map((r, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onSelect(i)}
          className={`rounded-full border px-3 py-1.5 text-[12.5px] font-medium transition-colors ${
            active === i
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-background text-foreground hover:border-primary/40 hover:text-primary"
          }`}
        >
          {r.label}
        </button>
      ))}
    </div>
  )
}

/**
 * Concierge — tiered archetype.
 *
 * Two tiers: a centred header over one link card per channel (email, chat,
 * sales), then a form card — a tinted side panel making the case beside a real
 * enquiry form with reason chips. The form posts through `useContactSubmit` to
 * the site's leads inbox exactly as before; its fields and submit button are one
 * entry (`submitText`) so they can never be pulled apart.
 */
function ContactCard ({ instance, isPreview, definition }: SectionComponentProps) {
  const [activeReason, setActiveReason] = useState(0)
  const { rootStyle } = useSectionSurface({
    instanceId: instance.id,
    rootOptions: { defaultBackground: false },
  })
  const { onSubmit, status, error, successMessage, isLive } = useContactSubmit()
  const reasonChips = (instance.props.reasonChips as ReasonChip[] | undefined) ?? []

  return (
    <section className="relative overflow-x-clip bg-muted/40" style={rootStyle}>
      <div aria-hidden className="absolute inset-0 -z-10 bg-grid opacity-60 [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_80%)]" />

      <SectionContainer>
        <SectionSlot
          instance={instance}
          definition={definition}
          isPreview={isPreview}
          slotId="copy"
          className="flex flex-col items-center text-center"
          entryClassName={stretchItems}
          align="center"
          overrides={{
            badgeText: dotBadge(FALLBACK.badgeText, isPreview),
            headline: headingOverride({
              className: "mt-5 text-[clamp(1.85rem,2.2vw+1rem,2.85rem)] font-semibold tracking-[-0.022em] leading-[1.08] text-foreground",
              isPreview,
              headline: FALLBACK.headline,
              accentWord: FALLBACK.accentWord,
            }),
            description: textOverride("description", FALLBACK.description, "mt-4 text-muted-foreground leading-relaxed", isPreview),
          }}
          renderItems={({ instance: inst }) => <ChannelCards instance={inst} isPreview={isPreview} />}
        />

        <div className="mt-10 overflow-hidden rounded-3xl border border-border bg-card">
          <div className="grid md:grid-cols-12">
            {/* Side panel */}
            <div className="relative overflow-hidden bg-[linear-gradient(160deg,color-mix(in_oklch,var(--primary)_8%,var(--background)),var(--card)_70%)] p-8 md:col-span-4 md:p-10">
              <SectionSlot
                instance={instance}
                definition={definition}
                isPreview={isPreview}
                slotId="panel"
                className="relative flex flex-col"
                overrides={{
                  panelKicker: ({ instance: inst }) => (
                    <div className="inline-flex items-center gap-2">
                      <span className="inline-flex text-foreground">
                        <Send className="size-4" aria-hidden />
                      </span>
                      <PropText
                        instance={inst}
                        propKey="panelKicker"
                        fallback={FALLBACK.panelKicker}
                        className="text-xs text-muted-foreground"
                        isPreview={isPreview}
                      />
                    </div>
                  ),
                  panelTitle: textOverride("panelTitle", FALLBACK.panelTitle, "mt-5 text-2xl font-semibold tracking-tight text-foreground", isPreview, "h3"),
                  panelBody: textOverride("panelBody", FALLBACK.panelBody, "mt-3 text-[14px] leading-relaxed text-muted-foreground", isPreview),
                }}
                renderItems={({ instance: inst }) => <FormBullets instance={inst} isPreview={isPreview} />}
              />
            </div>

            {/* Form — submits to the site's leads inbox when live. */}
            <form className="p-7 md:col-span-8 md:p-10" onSubmit={isLive ? onSubmit : (e) => e.preventDefault()}>
              {isLive ? <ContactFormHoneypot /> : null}
              <ContactFormFeedback status={status} error={error} successMessage={successMessage} />
              {status !== "success" ? (
                <>
                  <input type="hidden" name="subject" value={reasonChips[activeReason]?.label ?? ""} />
                  <SectionSlot
                    instance={instance}
                    definition={definition}
                    isPreview={isPreview}
                    slotId="form"
                    className="flex flex-col"
                    overrides={{
                      reasonsLabel: textOverride(
                        "reasonsLabel",
                        FALLBACK.reasonsLabel,
                        "text-xs text-muted-foreground",
                        isPreview,
                        "div"
                      ),
                      submitText: ({ instance: inst }) => (
                        <>
                          <div className="mt-7 grid gap-5 sm:grid-cols-2">
                            <input type="text" name="name" className={FIELD} placeholder="Full name" />
                            <input type="email" name="email" className={FIELD} placeholder="Work email" />
                          </div>
                          <div className="mt-5 grid gap-5 sm:grid-cols-2">
                            <input type="text" name="company" className={FIELD} placeholder="Company" />
                            <input type="text" name="website" className={FIELD} placeholder="buildflow.com" />
                          </div>
                          <textarea
                            name="message"
                            rows={4}
                            className={`mt-5 resize-y ${FIELD}`}
                            placeholder="Give us a bit of context — what are you building, and what's the goal?"
                          />
                          <div className="mt-5 flex items-center justify-end">
                            <button
                              type="submit"
                              disabled={status === "submitting"}
                              className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-primary transition-opacity hover:opacity-90 disabled:opacity-60"
                            >
                              <PropText
                                instance={inst}
                                propKey="submitText"
                                fallback={FALLBACK.submitText}
                                isPreview={isPreview}
                                bare
                              />
                              <Send className="size-3.5" aria-hidden />
                            </button>
                          </div>
                        </>
                      ),
                    }}
                    renderItems={({ instance: inst }) => (
                      <ReasonChips instance={inst} active={activeReason} onSelect={setActiveReason} />
                    )}
                  />
                </>
              ) : null}
            </form>
          </div>
        </div>
      </SectionContainer>
    </section>
  )
}

export const contactCardSection = defineSection({
  id: "contact-card",
  displayName: "Concierge",
  description: "Channel link cards over a form card — a persuasive side panel beside an enquiry form with reason chips.",
  category: "contact",
  detachable: false,
  layoutArchetype: "tiered",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 2,
  industries: ["saas", "agency", "startup", "enterprise", "restaurant", "generic"],
  styles: ["modern", "minimal", "corporate"],
  goals: ["leads", "bookings", "support"],
  complexity: "medium",
  density: "medium",
  imageRequired: false,
  mobileScore: 90,
  editable: true,
  tags: ["contact", "card", "form"],
  conversionWeight: 75,
  funnelStage: "decision",
  migrateProps (oldProps, fromVersion) {
    if (fromVersion < 2) return contactCardSection.defaultProps
    return oldProps
  },
  defaultStyle: SECTION_PADDING_MEDIUM,
  rootStyleOptions: { ...SECTION_ROOT_MUTED },
  defaultOptions: { align: "center", paddingY: "md" },
  schema: {
    slots: [
      { id: "copy", label: "Header & channels", isDefault: true },
      { id: "panel", label: "Form side panel", eject: { direction: "column" } },
      { id: "form", label: "Enquiry form", eject: { direction: "column" } },
    ],
    blocks: [
      badgeTextBlock(),
      headlineBlock({ accent: true }),
      descriptionBlock(),
      {
        kind: "items",
        key: "channels",
        canonical: "cards",
        label: "Channel cards",
        pick: [],
        itemFields: [
          { key: "icon", label: "Icon", type: "select", options: CHANNEL_ICON_OPTIONS },
          { key: "tag", label: "Tag", type: "text", canonical: "badge", aiHint: HINTS.tag, maxLength: 30, group: "content" },
          { key: "title", label: "Title", type: "text", canonical: "headline", aiHint: HINTS.itemTitle, maxLength: 60, group: "content" },
          { key: "body", label: "Body", type: "textarea", canonical: "body", aiHint: HINTS.itemBody, maxLength: 300, group: "content" },
          { key: "meta", label: "Meta", type: "text" },
          { key: "ctaText", label: "CTA label", type: "text", canonical: "ctaPrimary", aiHint: HINTS.cta, maxLength: 30, group: "cta" },
          { key: "href", label: "Link URL", type: "url", group: "cta" },
          { key: "featured", label: "Featured (ring border)", type: "switch" },
        ],
        minItems: 1,
        maxItems: 4,
        newItem: () => ({ icon: "Mail", tag: "Channel", title: "Title", body: "Description.", meta: "Meta", ctaText: "Contact", href: "#", featured: false }),
      },
      noteBlock("panelKicker", "Panel kicker", { maxLength: 30 }, "panel"),
      noteBlock("panelTitle", "Panel title", {}, "panel"),
      noteBlock("panelBody", "Panel body", { type: "textarea", maxLength: 300 }, "panel"),
      {
        kind: "items",
        key: "formBullets",
        canonical: "items",
        label: "Form bullets",
        slot: "panel",
        pick: [],
        itemFields: [
          { key: "text", label: "Text", type: "text", canonical: "body", aiHint: "Text content (1–3 sentences)", maxLength: 300, group: "content" },
        ],
        minItems: 0,
        maxItems: 5,
        newItem: () => ({ text: "Benefit" }),
      },
      noteBlock("reasonsLabel", "Reasons label", {}, "form"),
      {
        kind: "items",
        key: "reasonChips",
        canonical: "items",
        label: "Reason chips",
        slot: "form",
        pick: [],
        itemFields: [{ key: "label", label: "Label", type: "text" }],
        minItems: 1,
        maxItems: 10,
        newItem: () => ({ label: "Reason" }),
      },
      noteBlock("submitText", "Submit button", { aiHint: "Submit button label (1–3 words)", maxLength: 30 }, "form"),
    ],
  },
  defaultProps: {
    badgeText: "We're here to help",
    headline: "Let's start a",
    accentWord: "conversation.",
    description: "Pick the channel that suits you, or send us a note below — a real person reads every message and replies within one business day.",
    channels: [
      { icon: "Mail", tag: "Email", title: "hello@yourcompany.com", body: "For general questions, partnerships and anything that needs a considered answer.", meta: "Reply < 24h", ctaText: "Write to us", href: "mailto:hello@yourcompany.com", featured: false },
      { icon: "MessageCircle", tag: "Live chat", title: "Chat with the team", body: "Quick questions about plans, setup or your account — answered in minutes.", meta: "Avg. 2 min", ctaText: "Open chat", href: "#", featured: true },
      { icon: "Calendar", tag: "Sales", title: "Book a walkthrough", body: "A 30-minute call to see whether we're the right fit for your team.", meta: "30 min", ctaText: "Pick a time", href: "#", featured: false },
    ],
    panelKicker: "Send a message",
    panelTitle: "Tell us what you need",
    panelBody: "Share a few details and the right person on our team will get back to you with a clear next step.",
    formBullets: [
      { text: "A reply within one business day" },
      { text: "No sales pressure, ever" },
      { text: "Your details stay private" },
    ],
    reasonsLabel: "What can we help with?",
    reasonChips: [
      { label: "Sales" }, { label: "Support" }, { label: "Partnerships" },
      { label: "Press" }, { label: "Careers" }, { label: "Other" },
    ],
    submitText: "Send message",
  },
  Component: ContactCard,
})
