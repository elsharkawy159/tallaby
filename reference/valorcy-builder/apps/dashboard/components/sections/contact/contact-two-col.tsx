"use client"

import { MapPin, Mail, Phone, Clock, Twitter, Linkedin, Github, type LucideIcon } from "lucide-react"
import { SectionContainer } from "@/components/sections/section-container"
import { SectionSlot } from "@/components/sections/_primitives/section-slot"
import { defineSection } from "@/components/sections/define-section"
import { SECTION_PADDING_MEDIUM } from "@/components/sections/section-style-presets"
import { SECTION_THUMB_PLACEHOLDER, useSectionSurface } from "@/components/sections/shared"
import {
  PropText,
  descriptionBlock,
  drawnElsewhere,
  headingOverride,
  headlineBlock,
  hrefBlock,
  noteBlock,
  textOr,
  textOverride,
} from "@/components/sections/contact/contact-parts"
import type { BlockOverride } from "@/components/sections/_primitives/block-renderer"
import type { SectionComponentProps, SectionInstance } from "@/components/sections/registry.types"

type SocialLink = { icon?: string; label?: string; href?: string }
const SOCIAL_ICONS: Record<string, LucideIcon> = { Twitter, Linkedin, Github }

/** What pages saved before the slot migration rendered while a prop was unset. */
const FALLBACK = {
  headline: "Lorem Ipsum Dolor Sit",
  description:
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
  addressLabel: "Lorem Ipsum",
  address: "123 Lorem Street\nIpsum City",
  hoursLabel: "Lorem Ipsum",
  hours: "Lorem ipsum dolor sit amet.",
  hoursNote: "Lorem ipsum dolor sit amet.",
  emailLabel: "Lorem Ipsum",
  email: "hello@example.com",
  emailHref: "mailto:hello@example.com",
  emailNote: "Lorem ipsum dolor sit amet.",
  phoneLabel: "Lorem Ipsum",
  phone: "(555) 000-0000",
  phoneHref: "tel:+15550000000",
  phoneNote: "Lorem ipsum dolor sit amet.",
  socialLabel: "Lorem Ipsum",
} as const
type Key = keyof typeof FALLBACK

const LABEL = "text-xs text-muted-foreground"
const NOTE = "mt-0.5 text-[13px] text-muted-foreground"

/** Rows are separated by hairlines; the first rendered row carries none. */
const ROW_ENTRY = "border-t border-border/60 pt-8 first:border-t-0 first:pt-0"

function IconBox ({ icon: Icon }: { icon: LucideIcon }) {
  return (
    <span className="mt-0.5 inline-flex shrink-0 text-foreground">
      <Icon className="size-4" />
    </span>
  )
}

/**
 * One detail row — icon, small label, value, optional note. The value block
 * draws the row; its label, link and note are blocks of their own that render
 * here, so each stays editable in the content panel.
 */
function detailRow (opts: {
  icon: LucideIcon
  label: Key
  value: Key
  note?: Key
  href?: Key
  valueClassName?: string
  isPreview?: boolean
}): BlockOverride {
  return function ContactDetailRow ({ instance }) {
    const { isPreview } = opts
    const value = opts.href ? (
      <a
        href={isPreview ? textOr(instance, opts.href, FALLBACK[opts.href]) : undefined}
        className="mt-1 block text-[15px] font-semibold text-foreground transition-colors hover:text-primary"
      >
        <PropText instance={instance} propKey={opts.value} fallback={FALLBACK[opts.value]} isPreview={isPreview} bare />
      </a>
    ) : (
      <PropText
        instance={instance}
        propKey={opts.value}
        fallback={FALLBACK[opts.value]}
        as="div"
        className={opts.valueClassName ?? "mt-1 text-[15px] font-semibold text-foreground"}
        isPreview={isPreview}
      />
    )
    return (
      <div className="flex gap-4">
        <IconBox icon={opts.icon} />
        <div>
          <div className={LABEL}>
            <PropText instance={instance} propKey={opts.label} fallback={FALLBACK[opts.label]} isPreview={isPreview} />
          </div>
          {value}
          {opts.note ? (
            <PropText
              instance={instance}
              propKey={opts.note}
              fallback={FALLBACK[opts.note]}
              as="div"
              className={NOTE}
              isPreview={isPreview}
            />
          ) : null}
        </div>
      </div>
    )
  }
}

function SocialRow ({ instance, isPreview }: { instance: SectionInstance; isPreview?: boolean }) {
  const socials = (instance.props.socials as SocialLink[] | undefined) ?? []
  return (
    <div>
      <div className={LABEL}>
        <PropText instance={instance} propKey="socialLabel" fallback={FALLBACK.socialLabel} isPreview={isPreview} />
      </div>
      <div className="mt-3 flex items-center gap-2">
        {socials.map((s, i) => {
          const Icon = SOCIAL_ICONS[s.icon ?? ""] ?? Twitter
          return (
            <a
              key={i}
              href={isPreview ? s.href : undefined}
              aria-label={s.label}
              data-element-id={`${instance.id}::social${i}`}
              data-element-type="textLink"
              data-element-collection="socials"
              data-element-index={String(i)}
              data-element-item-href-prop="href"
              className="inline-flex size-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-primary/30 hover:bg-primary/10 hover:text-primary"
            >
              <Icon className="size-4" />
            </a>
          )
        })}
      </div>
    </div>
  )
}

/**
 * Almanac — divided-grid archetype.
 *
 * A header over two columns of contact details separated by hairlines: where
 * and when on one side (address, hours), how to reach you on the other (email,
 * phone, socials). Each column is a slot, so rows reorder within it and a new
 * line can be dropped between them.
 */
function ContactTwoCol ({ instance, isPreview, definition }: SectionComponentProps) {
  const { rootStyle } = useSectionSurface({ instanceId: instance.id })

  return (
    <section className="relative bg-background" style={rootStyle}>
      <SectionContainer>
        <SectionSlot
          instance={instance}
          definition={definition}
          isPreview={isPreview}
          slotId="copy"
          className="flex flex-col"
          overrides={{
            headline: headingOverride({
              className: "text-[clamp(1.75rem,2vw+1rem,2.75rem)] font-semibold tracking-tight text-foreground",
              isPreview,
              headline: FALLBACK.headline,
            }),
            description: textOverride("description", FALLBACK.description, "mt-3 text-muted-foreground leading-relaxed", isPreview),
          }}
        />

        <div className="mt-12 grid gap-10 md:grid-cols-2 md:gap-16">
          <SectionSlot
            instance={instance}
            definition={definition}
            isPreview={isPreview}
            slotId="location"
            className="space-y-8"
            entryClassName={ROW_ENTRY}
            overrides={{
              address: detailRow({
                icon: MapPin,
                label: "addressLabel",
                value: "address",
                valueClassName: "mt-1 text-[15px] font-semibold text-foreground whitespace-pre-line leading-snug",
                isPreview,
              }),
              addressLabel: drawnElsewhere,
              hours: detailRow({ icon: Clock, label: "hoursLabel", value: "hours", note: "hoursNote", isPreview }),
              hoursLabel: drawnElsewhere,
              hoursNote: drawnElsewhere,
            }}
          />

          <SectionSlot
            instance={instance}
            definition={definition}
            isPreview={isPreview}
            slotId="reach"
            className="space-y-8"
            entryClassName={ROW_ENTRY}
            overrides={{
              email: detailRow({ icon: Mail, label: "emailLabel", value: "email", note: "emailNote", href: "emailHref", isPreview }),
              emailLabel: drawnElsewhere,
              emailHref: drawnElsewhere,
              emailNote: drawnElsewhere,
              phone: detailRow({ icon: Phone, label: "phoneLabel", value: "phone", note: "phoneNote", href: "phoneHref", isPreview }),
              phoneLabel: drawnElsewhere,
              phoneHref: drawnElsewhere,
              phoneNote: drawnElsewhere,
              socialLabel: drawnElsewhere,
            }}
            renderItems={({ instance: inst }) => <SocialRow instance={inst} isPreview={isPreview} />}
          />
        </div>
      </SectionContainer>
    </section>
  )
}

export const contactTwoColSection = defineSection({
  id: "contact-two-col",
  displayName: "Almanac",
  description: "Two hairline-divided columns of details — address and hours beside email, phone and socials.",
  category: "contact",
  layoutArchetype: "divided-grid",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 1,
  industries: ["saas", "agency", "enterprise", "finance", "real_estate", "nonprofit", "generic"],
  trustWeight: 20,
  conversionWeight: 80,
  funnelStage: "decision",
  styles: ["modern", "minimal", "corporate"],
  goals: ["leads", "trust"],
  complexity: "low",
  density: "medium",
  imageRequired: false,
  mobileScore: 90,
  editable: true,
  defaultStyle: SECTION_PADDING_MEDIUM,
  rootStyleOptions: { applySectionPadding: false },
  defaultOptions: { align: "start", paddingY: "md" },
  schema: {
    slots: [
      { id: "copy", label: "Header", isDefault: true },
      { id: "location", label: "Location column", eject: { direction: "column" } },
      { id: "reach", label: "Reach-us column", eject: { direction: "column" } },
    ],
    blocks: [
      headlineBlock(),
      descriptionBlock(),
      noteBlock("address", "Address", { type: "textarea" }, "location"),
      noteBlock("addressLabel", "Address label", {}, "location"),
      noteBlock("hours", "Hours", {}, "location"),
      noteBlock("hoursLabel", "Hours label", {}, "location"),
      noteBlock("hoursNote", "Hours note", {}, "location"),
      noteBlock("email", "Email address", {}, "reach"),
      noteBlock("emailLabel", "Email label", {}, "reach"),
      hrefBlock("emailHref", "Email href", "reach"),
      noteBlock("emailNote", "Email note", {}, "reach"),
      noteBlock("phone", "Phone number", {}, "reach"),
      noteBlock("phoneLabel", "Phone label", {}, "reach"),
      hrefBlock("phoneHref", "Phone href", "reach"),
      noteBlock("phoneNote", "Phone note", {}, "reach"),
      noteBlock("socialLabel", "Social label", {}, "reach"),
      {
        kind: "items",
        key: "socials",
        canonical: "socials",
        label: "Social links",
        slot: "reach",
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
        newItem: () => ({ icon: "Twitter", label: "Social", href: "#" }),
      },
    ],
  },
  defaultProps: {
    headline: "Visit, call or write to us",
    description: "However you'd like to reach us, a real person will pick it up. Here is everywhere you can find the team.",
    addressLabel: "Office",
    address: "221 Market Street, Suite 400\nSan Francisco, CA 94105",
    hoursLabel: "Opening hours",
    hours: "Monday – Friday, 9am – 6pm",
    hoursNote: "Closed on public holidays",
    emailLabel: "Email",
    email: "hello@yourcompany.com",
    emailHref: "mailto:hello@yourcompany.com",
    emailNote: "We reply within one business day",
    phoneLabel: "Phone",
    phone: "(555) 014-2290",
    phoneHref: "tel:+15550142290",
    phoneNote: "Weekdays during opening hours",
    socialLabel: "Follow us",
    socials: [
      { icon: "Twitter", label: "Twitter", href: "#" },
      { icon: "Linkedin", label: "LinkedIn", href: "#" },
      { icon: "Github", label: "GitHub", href: "#" },
    ],
  },
  Component: ContactTwoCol,
})
