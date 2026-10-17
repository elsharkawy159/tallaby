"use client"

import { Mail, Headphones, MapPin, Calendar, ArrowUpRight, type LucideIcon } from "lucide-react"
import { SectionContainer } from "@/components/sections/section-container"
import { SectionSlot } from "@/components/sections/_primitives/section-slot"
import { defineSection } from "@/components/sections/define-section"
import { TYPE_H2 } from "@/components/sections/_primitives/type-scale"
import { SECTION_PADDING_MEDIUM } from "@/components/sections/section-style-presets"
import { SECTION_THUMB_PLACEHOLDER, useSectionSurface } from "@/components/sections/shared"
import {
  HINTS,
  PropText,
  badgeTextBlock,
  descriptionBlock,
  dotBadge,
  drawnElsewhere,
  hrefBlock,
  noteBlock,
  textOr,
  textOverride,
} from "@/components/sections/contact/contact-parts"
import {
  ContactFormFeedback,
  ContactFormHoneypot,
  useContactSubmit,
} from "@/components/forms/use-contact-submit"
import type { BlockOverride } from "@/components/sections/_primitives/block-renderer"
import type { SectionComponentProps } from "@/components/sections/registry.types"

/** What pages saved before the slot migration rendered while a prop was unset. */
const FALLBACK = {
  badgeText: "Lorem Ipsum",
  headline: "Lorem ipsum.",
  headlineLine2: "Lorem ipsum dolor.",
  description:
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
  emailTag: "Lorem",
  emailTitle: "hello@example.com",
  emailMeta: "Lorem ipsum dolor sit amet.",
  emailCtaText: "Lorem Ipsum",
  emailHref: "mailto:hello@example.com",
  chatTag: "Lorem",
  chatTitle: "Lorem Ipsum",
  chatMeta: "Lorem ipsum dolor sit amet.",
  chatCtaText: "Lorem Ipsum",
  chatHref: "#",
  chatLiveLabel: "Lorem",
  officeTag: "Lorem",
  officeTitle: "Lorem Ipsum",
  officeMeta: "123 Lorem Street, Ipsum City",
  salesTag: "Lorem",
  salesTitle: "Lorem Ipsum",
  salesMeta: "Lorem ipsum dolor sit amet.",
  salesCtaText: "Lorem Ipsum",
  salesHref: "#",
  teamLabel: "Lorem ipsum",
  teamMeta: "Lorem ipsum dolor sit amet.",
  statusLabel: "Lorem ipsum dolor sit amet.",
  statusSecurity: "Lorem ipsum dolor sit amet.",
  namePlaceholder: "Lorem Ipsum",
  emailPlaceholder: "hello@example.com",
  companyPlaceholder: "Ipsum Corp",
  websitePlaceholder: "example.com",
  messagePlaceholder: "Lorem ipsum dolor sit amet, consectetur adipiscing elit...",
  submitText: "Lorem Ipsum",
} as const
type Key = keyof typeof FALLBACK

const FLOAT_CARD =
  "group relative h-full overflow-hidden rounded-2xl border border-border/60 bg-card p-5 shadow-md transition-transform hover:-translate-y-1"
const FIELD =
  "w-full border-0 border-b border-border bg-transparent py-4 pb-2 pt-5 text-[15px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"

/** The four channel cards are the first entries of their slot; every other one sits lower. */
const CARD_IDS = new Set(["emailTitle", "chatTitle", "officeTitle", "salesTitle"])

type Channel = "email" | "chat" | "office" | "sales"

/**
 * One floating channel card. The title block draws it; the card's tag, meta,
 * action label and link are blocks of their own rendered here, so each stays
 * editable in the content panel.
 */
function channelCard (channel: Channel, Icon: LucideIcon, isPreview?: boolean): BlockOverride {
  const k = (suffix: string) => `${channel}${suffix}` as Key
  return function ContactChannelCard ({ instance }) {
    const text = (key: Key, className: string) => (
      <PropText instance={instance} propKey={key} fallback={FALLBACK[key]} as="div" className={className} isPreview={isPreview} />
    )
    const hasCta = channel !== "office"
    return (
      <div className={FLOAT_CARD}>
        {channel === "chat" ? (
          <span className="absolute end-4 top-4 inline-flex items-center gap-1 rounded-full bg-[color-mix(in_oklch,var(--success)_14%,transparent)] px-2 py-0.5 text-xs font-medium text-[var(--success)]">
            <span className="inline-flex size-1.5 rounded-full bg-[var(--success)]" />
            <PropText instance={instance} propKey="chatLiveLabel" fallback={FALLBACK.chatLiveLabel} isPreview={isPreview} bare />
          </span>
        ) : null}
        <span className="inline-flex text-foreground">
          <Icon className="size-[18px]" aria-hidden />
        </span>
        {text(k("Tag"), "mt-4 text-xs text-muted-foreground")}
        {text(k("Title"), "mt-1 text-[14px] font-semibold text-foreground")}
        {text(k("Meta"), "mt-1 text-[12px] text-muted-foreground")}
        {hasCta ? (
          <a
            href={isPreview ? textOr(instance, k("Href"), FALLBACK[k("Href")]) : undefined}
            {...(channel === "email"
              ? { "data-element-id": `${instance.id}::emailCta`, "data-element-type": "textLink", "data-element-href-prop": "emailHref" }
              : {})}
            className="mt-4 inline-flex items-center gap-1 text-[12.5px] font-semibold text-primary transition-colors"
          >
            <PropText instance={instance} propKey={k("CtaText")} fallback={FALLBACK[k("CtaText")]} isPreview={isPreview} bare />
            <ArrowUpRight className="size-3" aria-hidden />
          </a>
        ) : null}
      </div>
    )
  }
}

/**
 * Switchboard — split archetype.
 *
 * Every way in, side by side. The start column states the promise (badge,
 * two-line headline, description) over a staggered 2×2 of channel cards — email,
 * chat, office, sales — with a tilted team badge pinned to its corner; the end
 * column is a glass enquiry form behind a live status bar. The form posts
 * through `useContactSubmit` to the site's leads inbox exactly as before; its
 * fields and submit button are one entry (`submitText`).
 */
function ContactSplit ({ instance, isPreview, definition }: SectionComponentProps) {
  const { rootStyle } = useSectionSurface({ instanceId: instance.id })
  const { onSubmit, status, error, successMessage, isLive } = useContactSubmit()

  return (
    <section className="relative overflow-x-clip bg-background" style={rootStyle}>

      <SectionContainer>
        <div className="grid items-center gap-14 lg:grid-cols-12 lg:gap-16">
          {/* Start column */}
          <div className="relative lg:col-span-6">
            <SectionSlot
              instance={instance}
              definition={definition}
              isPreview={isPreview}
              slotId="copy"
              className="flex flex-col items-start"
              overrides={{
                badgeText: dotBadge(FALLBACK.badgeText, isPreview, true),
                headline: ({ instance: inst }) => (
                  <h2 className={`${TYPE_H2} mt-5 text-foreground`}>
                    <PropText instance={inst} propKey="headline" fallback={FALLBACK.headline} isPreview={isPreview} />
                    <br />
                    <PropText instance={inst} propKey="headlineLine2" fallback={FALLBACK.headlineLine2} isPreview={isPreview} />
                  </h2>
                ),
                description: textOverride("description", FALLBACK.description, "mt-5 max-w-md text-muted-foreground leading-relaxed", isPreview),
              }}
            />

            <SectionSlot
              instance={instance}
              definition={definition}
              isPreview={isPreview}
              slotId="cards"
              className="relative mt-12 grid grid-cols-2 gap-4 sm:gap-5"
              entryClassName={(entry, index) =>
                entry.kind === "block" && CARD_IDS.has(entry.block.id) && index % 2 === 1 ? "sm:mt-8" : undefined
              }
              overrides={{
                emailTitle: channelCard("email", Mail, isPreview),
                chatTitle: channelCard("chat", Headphones, isPreview),
                officeTitle: channelCard("office", MapPin, isPreview),
                salesTitle: channelCard("sales", Calendar, isPreview),
                emailTag: drawnElsewhere,
                emailMeta: drawnElsewhere,
                emailCtaText: drawnElsewhere,
                emailHref: drawnElsewhere,
                chatTag: drawnElsewhere,
                chatMeta: drawnElsewhere,
                chatCtaText: drawnElsewhere,
                chatHref: drawnElsewhere,
                chatLiveLabel: drawnElsewhere,
                officeTag: drawnElsewhere,
                officeMeta: drawnElsewhere,
                salesTag: drawnElsewhere,
                salesMeta: drawnElsewhere,
                salesCtaText: drawnElsewhere,
                salesHref: drawnElsewhere,
              }}
            />

            {/* Team badge */}
            <div className="absolute -right-2 top-4 hidden rounded-2xl border border-border bg-card p-4 md:flex md:items-center md:gap-3">
              <div className="flex -space-x-2">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="size-8 rounded-full border-2 border-card"
                    style={{ background: `linear-gradient(135deg, color-mix(in oklch, var(--primary) ${60 - i * 15}%, var(--background)), var(--primary))` }}
                  />
                ))}
              </div>
              <SectionSlot
                instance={instance}
                definition={definition}
                isPreview={isPreview}
                slotId="team"
                className="flex flex-col"
                overrides={{
                  teamLabel: textOverride("teamLabel", FALLBACK.teamLabel, "text-[12px] font-semibold text-foreground", isPreview, "div"),
                  teamMeta: textOverride("teamMeta", FALLBACK.teamMeta, "text-xs text-muted-foreground", isPreview, "div"),
                }}
              />
            </div>
          </div>

          {/* End column — form; submits to the site's leads inbox when live. */}
          <div className="relative lg:col-span-6">

            <form
              onSubmit={isLive ? onSubmit : (e) => e.preventDefault()}
              className="relative overflow-hidden rounded-3xl border border-border bg-card/90 p-7 transition-transform md:p-9"
            >
              {isLive ? <ContactFormHoneypot /> : null}
              <ContactFormFeedback status={status} error={error} successMessage={successMessage} />
              {status !== "success" ? (
                <SectionSlot
                  instance={instance}
                  definition={definition}
                  isPreview={isPreview}
                  slotId="form"
                  className="flex flex-col"
                  overrides={{
                    statusLabel: ({ instance: inst }) => (
                      <div className="mb-6 flex items-center justify-between gap-3 rounded-xl border border-border bg-background/60 px-3 py-2">
                        <div className="flex items-center gap-2">
                          <span className="relative inline-flex size-2 rounded-full bg-[var(--success)]" />
                          <PropText instance={inst} propKey="statusLabel" fallback={FALLBACK.statusLabel} className="text-[12px] font-medium text-foreground" isPreview={isPreview} />
                        </div>
                        <PropText
                          instance={inst}
                          propKey="statusSecurity"
                          fallback={FALLBACK.statusSecurity}
                          className="text-xs text-muted-foreground"
                          isPreview={isPreview}
                        />
                      </div>
                    ),
                    statusSecurity: drawnElsewhere,
                    submitText: ({ instance: inst }) => {
                      const ph = (key: Key) => textOr(inst, key, FALLBACK[key])
                      return (
                        <>
                          <div className="grid gap-6 sm:grid-cols-2">
                            <input type="text" name="name" className={FIELD} placeholder={ph("namePlaceholder")} />
                            <input type="email" name="email" className={FIELD} placeholder={ph("emailPlaceholder")} />
                          </div>
                          <div className="mt-6 grid gap-6 sm:grid-cols-2">
                            <input type="text" name="company" className={FIELD} placeholder={ph("companyPlaceholder")} />
                            <input type="text" name="website" className={FIELD} placeholder={ph("websitePlaceholder")} />
                          </div>
                          <textarea name="message" rows={4} className={`mt-6 resize-none ${FIELD}`} placeholder={ph("messagePlaceholder")} />
                          <div className="mt-8 flex items-center justify-end">
                            <button
                              type="submit"
                              disabled={status === "submitting"}
                              className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-primary transition-opacity hover:opacity-90 disabled:opacity-60"
                            >
                              <PropText instance={inst} propKey="submitText" fallback={FALLBACK.submitText} isPreview={isPreview} bare />
                             
                            </button>
                          </div>
                        </>
                      )
                    },
                    namePlaceholder: drawnElsewhere,
                    emailPlaceholder: drawnElsewhere,
                    companyPlaceholder: drawnElsewhere,
                    websitePlaceholder: drawnElsewhere,
                    messagePlaceholder: drawnElsewhere,
                  }}
                />
              ) : null}
            </form>
          </div>
        </div>
      </SectionContainer>
    </section>
  )
}

const card = (key: Key, label: string, extra: Parameters<typeof noteBlock>[2] = {}) => noteBlock(key, label, extra, "cards")
const form = (key: Key, label: string, extra: Parameters<typeof noteBlock>[2] = {}) => noteBlock(key, label, extra, "form")

export const contactSplitSection = defineSection({
  id: "contact-split",
  displayName: "Switchboard",
  description: "Promise and a staggered 2×2 of channel cards beside a glass enquiry form with a live status bar.",
  category: "contact",
  detachable: false,
  layoutArchetype: "split",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 2,
  industries: ["saas", "agency", "startup", "enterprise", "generic"],
  styles: ["modern", "minimal", "corporate"],
  goals: ["leads", "bookings", "conversion"],
  complexity: "medium",
  density: "medium",
  imageRequired: false,
  mobileScore: 88,
  editable: true,
  tags: ["contact", "split", "two-col"],
  conversionWeight: 75,
  funnelStage: "decision",
  migrateProps (oldProps, fromVersion) {
    if (fromVersion < 2) return contactSplitSection.defaultProps
    return oldProps
  },
  defaultStyle: SECTION_PADDING_MEDIUM,
  rootStyleOptions: { applySectionPadding: false },
  defaultOptions: { align: "start", paddingY: "md" },
  schema: {
    slots: [
      { id: "copy", label: "Copy", isDefault: true },
      { id: "cards", label: "Channel cards", eject: { direction: "row" } },
      { id: "team", label: "Team badge", eject: { direction: "column" } },
      { id: "form", label: "Enquiry form", eject: { direction: "column" } },
    ],
    blocks: [
      badgeTextBlock(),
      {
        kind: "heading",
        level: 2,
        accent: false,
        suffix: true,
        fields: {
          headline: { key: "headline", label: "Headline line 1 (accent)", type: "text", canonical: "headline", aiHint: HINTS.headline, maxLength: 80, group: "content" },
          headlineSuffix: { key: "headlineLine2", label: "Headline line 2", type: "text", canonical: "headline", maxLength: 60, group: "content" },
        },
      },
      descriptionBlock(),
      card("emailTitle", "Email — address"),
      card("chatTitle", "Chat — title"),
      card("officeTitle", "Office — city"),
      card("salesTitle", "Sales — title"),
      card("emailTag", "Email — tag"),
      card("emailMeta", "Email — meta"),
      card("emailCtaText", "Email — CTA"),
      hrefBlock("emailHref", "Email — href", "cards"),
      card("chatTag", "Chat — tag"),
      card("chatMeta", "Chat — hours"),
      card("chatCtaText", "Chat — CTA"),
      hrefBlock("chatHref", "Chat — href", "cards"),
      card("chatLiveLabel", "Chat — live badge"),
      card("officeTag", "Office — tag"),
      card("officeMeta", "Office — address"),
      card("salesTag", "Sales — tag"),
      card("salesMeta", "Sales — meta"),
      card("salesCtaText", "Sales — CTA"),
      hrefBlock("salesHref", "Sales — href", "cards"),
      noteBlock("teamLabel", "Team badge — label", {}, "team"),
      noteBlock("teamMeta", "Team badge — meta", {}, "team"),
      form("statusLabel", "Form status label"),
      form("statusSecurity", "Form security note"),
      form("submitText", "Submit button", { aiHint: "Submit button label (1–3 words)", maxLength: 30 }),
      form("namePlaceholder", "Name placeholder"),
      form("emailPlaceholder", "Email placeholder"),
      form("companyPlaceholder", "Company placeholder"),
      form("websitePlaceholder", "Website placeholder"),
      form("messagePlaceholder", "Message placeholder", { type: "textarea" }),
    ],
  },
  defaultProps: {
    badgeText: "Talk to a human",
    headline: "Say hello.",
    headlineLine2: "We'd love to hear from you.",
    description: "Questions, ideas or a project in mind? Reach the right team directly, or send a message and we'll route it for you.",
    emailTag: "Email",
    emailTitle: "hello@yourcompany.com",
    emailMeta: "Replies within a day",
    emailCtaText: "Send email",
    emailHref: "mailto:hello@yourcompany.com",
    chatTag: "Live chat",
    chatTitle: "Chat with support",
    chatMeta: "Mon–Fri, 9am–6pm",
    chatCtaText: "Open chat",
    chatHref: "#",
    chatLiveLabel: "Online",
    officeTag: "Office",
    officeTitle: "San Francisco",
    officeMeta: "221 Market Street, Suite 400",
    salesTag: "Sales",
    salesTitle: "Book a demo",
    salesMeta: "30-minute walkthrough",
    salesCtaText: "Pick a time",
    salesHref: "#",
    teamLabel: "Our team is online",
    teamMeta: "Typical reply in 2 hours",
    statusLabel: "Usually replies within 2 hours",
    statusSecurity: "Encrypted & private",
    namePlaceholder: "Full name",
    emailPlaceholder: "you@company.com",
    companyPlaceholder: "Company",
    websitePlaceholder: "yourcompany.com",
    messagePlaceholder: "Tell us a little about what you need…",
    submitText: "Send message",
  },
  Component: ContactSplit,
})
