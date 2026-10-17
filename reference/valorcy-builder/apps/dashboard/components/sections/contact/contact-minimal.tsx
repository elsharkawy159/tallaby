"use client"

import { Mail, MessageCircle, Phone, Building, Twitter, Linkedin, Github, type LucideIcon } from "lucide-react"
import { SectionContainer } from "@/components/sections/section-container"
import { SectionSlot } from "@/components/sections/_primitives/section-slot"
import { defineSection } from "@/components/sections/define-section"
import { SECTION_PADDING_MEDIUM } from "@/components/sections/section-style-presets"
import { SECTION_THUMB_PLACEHOLDER, useSectionSurface } from "@/components/sections/shared"
import {
  PropText,
  badgeTextBlock,
  descriptionBlock,
  dotBadge,
  drawnElsewhere,
  headingOverride,
  headlineBlock,
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
import type { SlotEntry } from "@/components/sections/schema/slot-entries"
import type { SectionComponentProps, SectionInstance } from "@/components/sections/registry.types"

type SocialLink = { icon?: string; label?: string; href?: string }
const SOCIAL_ICONS: Record<string, LucideIcon> = { Twitter, Linkedin, Github }

/** What pages saved before the slot migration rendered while a prop was unset. */
const FALLBACK = {
  badgeText: "Lorem Ipsum",
  headline: "Lorem Ipsum Dolor",
  accentWord: "Dolor.",
  description:
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
  firstNameLabel: "Lorem",
  lastNameLabel: "Lorem",
  emailLabel: "Lorem",
  companyLabel: "Lorem",
  teamSizeLabel: "Lorem",
  messageLabel: "Lorem ipsum dolor sit amet?",
  consentText: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
  submitText: "Lorem Ipsum",
  directEmailText: "Lorem ipsum dolor sit amet",
  directEmail: "hello@example.com",
  directEmailHref: "mailto:hello@example.com",
  infoTitle: "Lorem Ipsum",
  emailValue: "hello@example.com",
  emailSub: "Lorem ipsum dolor sit amet.",
  emailHref: "mailto:hello@example.com",
  chatValue: "Lorem ipsum dolor sit amet.",
  chatSub: "Lorem ipsum dolor sit amet.",
  phoneValue: "(555) 000-0000",
  phoneSub: "Lorem ipsum dolor sit amet.",
  phoneHref: "tel:+15550000000",
  officeValue: "123 Lorem Street, Ipsum City",
  officeSub: "Lorem ipsum dolor sit amet.",
  statusText: "Lorem ipsum",
  statusMeta: "Lorem",
  statusBody: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
} as const
type Key = keyof typeof FALLBACK

const FIELD =
  "w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-ring transition-colors"
const MONO = "text-xs text-muted-foreground"

/** Info rows share hairlines between them, like the `divide-y` list they replace. */
const INFO_ROWS = new Set(["emailValue", "chatValue", "phoneValue", "officeValue"])
const infoEntry = (entry: SlotEntry) =>
  entry.kind === "block" && INFO_ROWS.has(entry.block.id) ? "crow" : undefined

/** A field label — plain text, as the pre-slot form drew it; edited in the content panel. */
function Label ({ instance, k, htmlFor }: { instance: SectionInstance; k: Key; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-[13px] font-medium text-foreground">
      {textOr(instance, k, FALLBACK[k])}
    </label>
  )
}

/** One contact row in the info card; the value block draws its sub-line and link. */
function infoRow (opts: {
  icon: LucideIcon
  label: string
  value: Key
  sub: Key
  href?: Key | "#"
  isPreview?: boolean
}): BlockOverride {
  return function ContactInfoRow ({ instance }) {
    const { isPreview } = opts
    const Icon = opts.icon
    const inner = (
      <div className="group flex items-start gap-4 py-4 transition-colors hover:text-primary">
        <span className="mt-0.5 inline-flex shrink-0 text-foreground">
          <Icon className="size-4" aria-hidden />
        </span>
        <div className="min-w-0">
          <div className={MONO}>{opts.label}</div>
          <PropText
            instance={instance}
            propKey={opts.value}
            fallback={FALLBACK[opts.value]}
            as="div"
            className="mt-0.5 truncate text-[14.5px] font-semibold text-foreground"
            isPreview={isPreview}
            bare
          />
          <PropText
            instance={instance}
            propKey={opts.sub}
            fallback={FALLBACK[opts.sub]}
            as="div"
            className="text-[12.5px] text-muted-foreground"
            isPreview={isPreview}
            bare
          />
        </div>
      </div>
    )
    if (!opts.href) return inner
    const href = opts.href === "#" ? "#" : textOr(instance, opts.href, FALLBACK[opts.href])
    return href ? <a href={isPreview ? href : undefined}>{inner}</a> : inner
  }
}

/**
 * Correspondence — info-form archetype.
 *
 * A header over a seven-column enquiry form beside a five-column info card
 * (email, chat, sales line, HQ, an availability note, socials). The form posts
 * through `useContactSubmit` to the site's leads inbox exactly as before; its
 * fields, consent and submit row are one entry (`submitText`), and the labels
 * it prints are blocks drawn by it.
 */
function ContactMinimal ({ instance, isPreview, definition }: SectionComponentProps) {
  const { rootStyle } = useSectionSurface({ instanceId: instance.id })
  const { onSubmit, status, error, successMessage, isLive } = useContactSubmit()

  const formOverride: BlockOverride = ({ instance: inst }) => (
    <>
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <Label instance={inst} k="firstNameLabel" />
          <input type="text" name="firstName" className={FIELD} placeholder="Maya" />
        </div>
        <div>
          <Label instance={inst} k="lastNameLabel" />
          <input type="text" name="lastName" className={FIELD} placeholder="Okonkwo" />
        </div>
      </div>
      <div className="mt-5">
        <Label instance={inst} k="emailLabel" />
        <input type="email" name="email" className={FIELD} placeholder="you@company.com" />
      </div>
      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        <div>
          <Label instance={inst} k="companyLabel" />
          <input type="text" name="company" className={FIELD} placeholder="Acme Inc." />
        </div>
        <div>
          <Label instance={inst} k="teamSizeLabel" />
          <select name="teamSize" className={`${FIELD} appearance-none`}>
            <option value="">Select…</option>
            <option>Just me</option><option>2–10</option><option>11–50</option><option>51–200</option><option>200+</option>
          </select>
        </div>
      </div>
      <div className="mt-5">
        <Label instance={inst} k="messageLabel" />
        <textarea name="message" rows={4} className={`${FIELD} resize-y`} placeholder="Tell us a little about what you're building..." />
      </div>
      <div className="mt-5 flex items-start gap-2.5">
        <input id={`${inst.id}-consent`} name="consent" type="checkbox" value="yes" className="mt-1 size-4 rounded border-border" defaultChecked />
        <label htmlFor={`${inst.id}-consent`} className="text-[13px] leading-snug text-muted-foreground">
          <PropText instance={inst} propKey="consentText" fallback={FALLBACK.consentText} isPreview={isPreview} />
        </label>
      </div>
      <div className="mt-7 flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={status === "submitting"}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-primary transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          <PropText instance={inst} propKey="submitText" fallback={FALLBACK.submitText} isPreview={isPreview} bare />
         
        </button>
        <span className="text-[12.5px] text-muted-foreground">
          <PropText instance={inst} propKey="directEmailText" fallback={FALLBACK.directEmailText} isPreview={isPreview} bare />{" "}
          <a
            href={isPreview ? textOr(inst, "directEmailHref", FALLBACK.directEmailHref) : undefined}
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            <PropText instance={inst} propKey="directEmail" fallback={FALLBACK.directEmail} isPreview={isPreview} bare />
          </a>
        </span>
      </div>
    </>
  )

  return (
    <section className="relative overflow-x-clip bg-background" style={rootStyle}>
      <SectionContainer>
        <SectionSlot
          instance={instance}
          definition={definition}
          isPreview={isPreview}
          slotId="copy"
          className="flex flex-col items-start"
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
        />

        <div className="mt-12 grid gap-12 lg:grid-cols-12 lg:gap-16">
          {/* Form — submits to the site's leads inbox when live. */}
          <form className="lg:col-span-7" onSubmit={isLive ? onSubmit : (e) => e.preventDefault()}>
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
                  submitText: formOverride,
                  firstNameLabel: drawnElsewhere,
                  lastNameLabel: drawnElsewhere,
                  emailLabel: drawnElsewhere,
                  companyLabel: drawnElsewhere,
                  teamSizeLabel: drawnElsewhere,
                  messageLabel: drawnElsewhere,
                  consentText: drawnElsewhere,
                  privacyHref: drawnElsewhere,
                  directEmailText: drawnElsewhere,
                  directEmail: drawnElsewhere,
                  directEmailHref: drawnElsewhere,
                }}
              />
            ) : null}
          </form>

          {/* Info card */}
          <aside className="lg:col-span-5">
            <SectionSlot
              instance={instance}
              definition={definition}
              isPreview={isPreview}
              slotId="info"
              className="flex flex-col rounded-2xl border border-border bg-card p-7 [&>.crow+.crow]:border-t [&>.crow+.crow]:border-border"
              entryClassName={infoEntry}
              overrides={{
                infoTitle: textOverride("infoTitle", FALLBACK.infoTitle, "mb-1 text-xs text-muted-foreground", isPreview, "div"),
                emailValue: infoRow({ icon: Mail, label: "Email", value: "emailValue", sub: "emailSub", href: "emailHref", isPreview }),
                emailSub: drawnElsewhere,
                emailHref: drawnElsewhere,
                chatValue: infoRow({ icon: MessageCircle, label: "Live chat", value: "chatValue", sub: "chatSub", href: "#", isPreview }),
                chatSub: drawnElsewhere,
                phoneValue: infoRow({ icon: Phone, label: "Sales", value: "phoneValue", sub: "phoneSub", href: "phoneHref", isPreview }),
                phoneSub: drawnElsewhere,
                phoneHref: drawnElsewhere,
                officeValue: infoRow({ icon: Building, label: "HQ", value: "officeValue", sub: "officeSub", isPreview }),
                officeSub: drawnElsewhere,
                statusText: ({ instance: inst }) => (
                  <div className="mt-2 rounded-xl border border-border bg-background p-4">
                    <div className="flex items-center gap-2">
                      <span className="relative inline-flex size-2 rounded-full bg-[var(--success)]" />
                      <PropText instance={inst} propKey="statusText" fallback={FALLBACK.statusText} className="text-[12.5px] font-medium text-foreground" isPreview={isPreview} />
                      <span className={`ms-auto ${MONO}`}>{textOr(inst, "statusMeta", FALLBACK.statusMeta)}</span>
                    </div>
                    <PropText instance={inst} propKey="statusBody" fallback={FALLBACK.statusBody} as="p" className="mt-2 text-[12.5px] leading-relaxed text-muted-foreground" isPreview={isPreview} />
                  </div>
                ),
                statusMeta: drawnElsewhere,
                statusBody: drawnElsewhere,
              }}
              renderItems={({ instance: inst }) => {
                const socials = (inst.props.socials as SocialLink[] | undefined) ?? []
                return (
                  <div className="mt-6 flex items-center gap-2">
                    <span className={MONO}>Follow</span>
                    <span className="h-px flex-1 bg-border" aria-hidden />
                    {socials.map((s, i) => {
                      const Icon = SOCIAL_ICONS[s.icon ?? ""] ?? Twitter
                      return (
                        <a
                          key={i}
                          href={isPreview ? s.href : undefined}
                          aria-label={s.label}
                          className="inline-flex size-9 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition-colors hover:border-primary/30 hover:bg-primary/10 hover:text-primary"
                        >
                          <Icon className="size-4" aria-hidden />
                        </a>
                      )
                    })}
                  </div>
                )
              }}
            />
          </aside>
        </div>
      </SectionContainer>
    </section>
  )
}

const formNote = (key: Key, label: string, extra: Parameters<typeof noteBlock>[2] = {}) =>
  noteBlock(key, label, extra, "form")
const infoNote = (key: Key, label: string, extra: Parameters<typeof noteBlock>[2] = {}) =>
  noteBlock(key, label, extra, "info")

export const contactMinimalSection = defineSection({
  id: "contact-minimal",
  displayName: "Correspondence",
  description: "Enquiry form beside an info card — email, chat, sales line, HQ, availability and socials.",
  category: "contact",
  detachable: false,
  layoutArchetype: "info-form",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 2,
  industries: ["photography", "podcast", "app_landing", "saas", "portfolio", "creative", "agency", "startup", "generic"],
  styles: ["minimal", "modern"],
  goals: ["leads", "support"],
  complexity: "low",
  density: "low",
  imageRequired: false,
  mobileScore: 95,
  editable: true,
  tags: ["contact", "minimal"],
  conversionWeight: 65,
  funnelStage: "decision",
  migrateProps (oldProps, fromVersion) {
    if (fromVersion < 2) return contactMinimalSection.defaultProps
    return oldProps
  },
  defaultStyle: SECTION_PADDING_MEDIUM,
  rootStyleOptions: { applySectionPadding: false },
  defaultOptions: { align: "start", paddingY: "md" },
  schema: {
    slots: [
      { id: "copy", label: "Header", isDefault: true },
      { id: "form", label: "Enquiry form", eject: { direction: "column" } },
      { id: "info", label: "Info card", eject: { direction: "column" } },
    ],
    blocks: [
      badgeTextBlock(),
      headlineBlock({ accent: true }),
      descriptionBlock(),
      formNote("submitText", "Submit button label", { aiHint: "Submit button label (1–3 words)", maxLength: 30 }),
      formNote("firstNameLabel", "First name label"),
      formNote("lastNameLabel", "Last name label"),
      formNote("emailLabel", "Email label"),
      formNote("companyLabel", "Company label"),
      formNote("teamSizeLabel", "Team size label"),
      formNote("messageLabel", "Message label"),
      formNote("consentText", "Consent text", { type: "textarea", maxLength: 240 }),
      hrefBlock("privacyHref", "Privacy policy link", "form"),
      formNote("directEmailText", "Direct email prefix"),
      formNote("directEmail", "Direct email address"),
      hrefBlock("directEmailHref", "Direct email href", "form"),
      infoNote("infoTitle", "Info panel title"),
      infoNote("emailValue", "Email address"),
      infoNote("emailSub", "Email subtitle"),
      hrefBlock("emailHref", "Email href", "info"),
      infoNote("chatValue", "Chat hours"),
      infoNote("chatSub", "Chat subtitle"),
      infoNote("phoneValue", "Phone number"),
      infoNote("phoneSub", "Phone subtitle"),
      hrefBlock("phoneHref", "Phone href", "info"),
      infoNote("officeValue", "Office address"),
      infoNote("officeSub", "Office subtitle"),
      infoNote("statusText", "Status label"),
      infoNote("statusMeta", "Status timezone"),
      infoNote("statusBody", "Status body", { type: "textarea", maxLength: 240 }),
      {
        kind: "items",
        key: "socials",
        canonical: "socials",
        label: "Social links",
        slot: "info",
        pick: [],
        itemFields: [
          {
            key: "icon",
            label: "Icon",
            type: "select",
            options: [
              { value: "Twitter", label: "Twitter" },
              { value: "Linkedin", label: "LinkedIn" },
              { value: "Github", label: "GitHub" },
            ],
          },
          { key: "label", label: "Aria label", type: "text" },
          { key: "href", label: "URL", type: "url", group: "cta" },
        ],
        minItems: 0,
        maxItems: 5,
        newItem: () => ({ icon: "Twitter", label: "Twitter", href: "#" }),
      },
    ],
  },
  defaultProps: {
    badgeText: "Contact us",
    headline: "Tell us about your",
    accentWord: "project.",
    description: "Share a few details and we'll come back with ideas, a rough timeline and an honest estimate — usually within one business day.",
    firstNameLabel: "First name",
    lastNameLabel: "Last name",
    emailLabel: "Work email",
    companyLabel: "Company",
    teamSizeLabel: "Team size",
    messageLabel: "How can we help?",
    consentText: "I agree to be contacted about my enquiry. We never share your details.",
    privacyHref: "#",
    submitText: "Send message",
    directEmailText: "Prefer email?",
    directEmail: "hello@yourcompany.com",
    directEmailHref: "mailto:hello@yourcompany.com",
    infoTitle: "Other ways to reach us",
    emailValue: "hello@yourcompany.com",
    emailSub: "Replies within one business day",
    emailHref: "mailto:hello@yourcompany.com",
    chatValue: "Mon–Fri, 9am–6pm",
    chatSub: "Average reply in two minutes",
    phoneValue: "(555) 014-2290",
    phoneSub: "Talk to our sales team",
    phoneHref: "tel:+15550142290",
    officeValue: "221 Market Street, San Francisco",
    officeSub: "Visits by appointment",
    statusText: "Team online now",
    statusMeta: "PST",
    statusBody: "Most messages sent during business hours get a reply the same afternoon.",
    socials: [
      { icon: "Twitter", label: "Twitter", href: "#" },
      { icon: "Linkedin", label: "LinkedIn", href: "#" },
      { icon: "Github", label: "GitHub", href: "#" },
    ],
  },
  Component: ContactMinimal,
})
