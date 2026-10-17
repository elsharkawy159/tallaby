"use client"

import { Mail, MessageCircle, Phone, type LucideIcon } from "lucide-react"
import { InlineEditableText } from "@/components/website-builder/inline-editable"
import { SectionContainer } from "@/components/sections/section-container"
import { SectionSlot } from "@/components/sections/_primitives/section-slot"
import { defineSection } from "@/components/sections/define-section"
import { SECTION_PADDING_MEDIUM } from "@/components/sections/section-style-presets"
import { SECTION_THUMB_PLACEHOLDER, useSectionSurface } from "@/components/sections/shared"
import {
  HINTS,
  ItemText,
  descriptionBlock,
  headingOverride,
  headlineBlock,
  textOverride,
} from "@/components/sections/contact/contact-parts"
import { useBuilderStore } from "@/lib/builder/store"
import type { SlotEntry } from "@/components/sections/schema/slot-entries"
import type { SectionComponentProps, SectionInstance } from "@/components/sections/registry.types"

const SUPPORT_ICONS: Record<string, LucideIcon> = { Mail, MessageCircle, Phone }
const ICON_OPTIONS = Object.keys(SUPPORT_ICONS).map((k) => ({ label: k, value: k }))

/** What pages saved before the slot migration rendered while a prop was unset. */
const HEADLINE_FALLBACK = "Lorem Ipsum Dolor Sit"
const DESCRIPTION_FALLBACK =
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua."

type SupportCard = { icon?: string; title?: string; body?: string; meta?: string; ctaText?: string; href?: string }

/** Collection grids span the slot even though the slot centres its entries. */
const stretchItems = (entry: SlotEntry) =>
  entry.kind === "block" && entry.block.kind === "items" ? "w-full self-stretch" : undefined

function SupportCards ({ instance, isPreview }: { instance: SectionInstance; isPreview?: boolean }) {
  const cards = (instance.props.cards as SupportCard[] | undefined) ?? []
  if (cards.length === 0) return null
  const store = useBuilderStore.getState

  return (
    <div className="mt-12 grid gap-6 text-start md:grid-cols-3">
      {cards.map((card, i) => {
        const Icon = SUPPORT_ICONS[card.icon ?? ""] ?? Mail
        const text = (field: keyof SupportCard, as: "h3" | "p" | "span", className?: string) => (
          <ItemText
            instance={instance}
            collection="cards"
            index={i}
            field={field}
            value={card[field]}
            as={as}
            className={className}
            isPreview={isPreview}
          />
        )
        return (
          <div
            key={i}
            className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card p-7 transition-all"
          >

            <span className="inline-flex text-foreground">
              <Icon className="size-6" />
            </span>

            {text("title", "h3", "mt-5 text-lg font-semibold tracking-tight text-foreground")}
            {text("body", "p", "mt-2 flex-1 text-sm leading-relaxed text-muted-foreground")}

            <div className="mt-6 flex items-center justify-between border-t border-border pt-5">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-2.5 py-1 text-xs text-muted-foreground">
                <span className="size-1.5 rounded-full bg-[var(--success)]" />
                {text("meta", "span")}
              </span>
              <a
                href={isPreview ? card.href : undefined}
                data-element-id={`${instance.id}::cardCta${i}`}
                data-element-type="textLink"
                data-element-collection="cards"
                data-element-index={String(i)}
                data-element-item-href-prop="href"
                className="inline-flex items-center gap-1 text-[13px] font-semibold text-primary transition-colors hover:text-primary"
              >
                <InlineEditableText
                  as="span"
                  value={String(card.ctaText ?? "")}
                  isPreview={isPreview}
                  onChange={(t) => store().updateItem(instance.id, "cards", i, { ctaText: t })}
                  onCommit={(t) => store().updateItem(instance.id, "cards", i, { ctaText: t })}
                />
               
              </a>
            </div>
          </div>
        )
      })}
    </div>
  )
}

/**
 * Helpdesk — linked-cards archetype.
 *
 * A centred header over one card per support channel (email, chat, phone). Each
 * card closes on its own response-time chip and action link, so a visitor picks
 * the channel and goes. The header lines and the card collection are entries of
 * one slot.
 */
function ContactSupport ({ instance, isPreview, definition }: SectionComponentProps) {
  const { rootStyle } = useSectionSurface({ instanceId: instance.id })

  return (
    <section className="relative bg-background" style={rootStyle}>

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
            headline: headingOverride({
              className: "text-[clamp(1.85rem,2.2vw+1rem,2.85rem)] font-semibold tracking-tight text-foreground",
              isPreview,
              headline: HEADLINE_FALLBACK,
            }),
            description: textOverride(
              "description",
              DESCRIPTION_FALLBACK,
              "mt-4 text-muted-foreground leading-relaxed",
              isPreview
            ),
          }}
          renderItems={({ instance: inst }) => <SupportCards instance={inst} isPreview={isPreview} />}
        />
      </SectionContainer>
    </section>
  )
}

export const contactSupportSection = defineSection({
  id: "contact-support",
  displayName: "Helpdesk",
  description: "Centred header over one card per support channel, each with a response-time chip and link.",
  category: "contact",
  layoutArchetype: "linked-cards",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 1,
  industries: ["saas", "startup", "enterprise", "education", "finance", "generic"],
  trustWeight: 20,
  conversionWeight: 80,
  funnelStage: "decision",
  styles: ["modern", "minimal", "corporate"],
  goals: ["support", "leads", "trust"],
  complexity: "low",
  density: "medium",
  imageRequired: false,
  mobileScore: 88,
  editable: true,
  defaultStyle: SECTION_PADDING_MEDIUM,
  rootStyleOptions: { applySectionPadding: false },
  defaultOptions: { align: "center", paddingY: "md" },
  schema: {
    slots: [{ id: "copy", label: "Copy", isDefault: true }],
    blocks: [
      headlineBlock(),
      descriptionBlock(),
      {
        kind: "items",
        key: "cards",
        canonical: "cards",
        label: "Support channels",
        pick: [],
        itemFields: [
          { key: "icon", label: "Icon", type: "select", options: ICON_OPTIONS },
          { key: "title", label: "Title", type: "text", canonical: "headline", aiHint: HINTS.itemTitle, maxLength: 60, group: "content" },
          { key: "body", label: "Description", type: "textarea", canonical: "body", aiHint: HINTS.itemBody, maxLength: 300, group: "content" },
          { key: "meta", label: "Response time / meta", type: "text" },
          { key: "ctaText", label: "CTA label", type: "text", canonical: "ctaPrimary", aiHint: HINTS.cta, maxLength: 30, group: "cta" },
          { key: "href", label: "Link URL", type: "url", group: "cta" },
        ],
        minItems: 1,
        maxItems: 4,
        newItem: () => ({ icon: "Mail", title: "Support channel", body: "Description of this support option.", meta: "Response time", ctaText: "Get help", href: "#" }),
      },
    ],
  },
  defaultProps: {
    headline: "Get help the way you prefer",
    description: "Whether it's a quick question or a tricky setup, our support team is a message away — pick the channel that suits you.",
    cards: [
      { icon: "Mail", title: "Email support", body: "Send us the details and a specialist replies with a clear, complete answer — screenshots welcome.", meta: "Replies in < 4h", ctaText: "Send an email", href: "mailto:support@yourcompany.com" },
      { icon: "MessageCircle", title: "Live chat", body: "Talk to a real person in real time for quick questions, account changes and walkthroughs.", meta: "Avg. wait 2 min", ctaText: "Start a chat", href: "#" },
      { icon: "Phone", title: "Phone line", body: "Prefer to talk it through? Call our team directly on weekdays for urgent or detailed issues.", meta: "Mon–Fri, 9–6", ctaText: "Call us", href: "tel:+15550000000" },
    ],
  },
  Component: ContactSupport,
})
