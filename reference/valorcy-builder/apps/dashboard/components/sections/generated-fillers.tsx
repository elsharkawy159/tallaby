"use client"

import { useRef } from "react"
import { InlineEditableText } from "@/components/website-builder/inline-editable"
import { SectionContainer } from "@/components/sections/section-container"
import { SectionEditableImage } from "@/components/sections/section-editable-image"
import { defineSection } from "@/components/sections/define-section"
import type {
  SectionCategory,
  SectionComponentProps,
  SectionDefinition,
} from "@/components/sections/registry.types"
import { SECTION_THUMB_PLACEHOLDER, useSectionSurface } from "@/components/sections/shared"
import { useInstrumentSection } from "@/lib/builder/use-instrument-section"
import { useBuilderStore } from "@/lib/builder/store"
import { cn } from "@workspace/ui/lib/utils"

type FillItem = {
  title: string
  description: string
  value?: string
  label?: string
  badge?: string
  meta?: string
  imageUrl?: string
  imageAlt?: string
  href?: string
}

type FillerLayout =
  | "split-left"
  | "split-right"
  | "center-grid"
  | "bento"
  | "timeline"
  | "masonry"
  | "comparison"
  | "visual-first"
  | "stats-band"
  | "sticky-aside"
  | "tabs"
  | "pricing-rail"
  | "faq-ladder"
  | "logo-orbit"
  | "logo-scoreboard"
  | "navbar-command"
  | "navbar-sidebar"
  | "navbar-utility"
  | "navbar-minimal-stack"
  | "footer-directory"
  | "footer-newsroom"
  | "menu-board"
  | "menu-editorial"
  | "listings-map"
  | "listings-compact"
  | "blog-editorial"
  | "team-roster"
  | "booking-calendar"
  | "booking-split-form"

type FillerSpec = {
  id: string
  displayName: string
  description: string
  category: Exclude<SectionCategory, "custom">
  layout: FillerLayout
  defaultProps: {
    eyebrow: string
    badge: string
    headline: string
    description: string
    imageUrl?: string
    imageAlt?: string
    primaryCta: string
    secondaryCta: string
    align: "left" | "center"
    columns: "2" | "3" | "4"
    gap: "compact" | "normal" | "loose"
    cardRadius: string
    cardShadow: string
    overlayOpacity: string
    items: FillItem[]
  }
}

const GAP_CLASS = {
  compact: "gap-4",
  normal: "gap-6",
  loose: "gap-8",
} as const

const COL_CLASS = {
  "2": "lg:grid-cols-2",
  "3": "lg:grid-cols-3",
  "4": "lg:grid-cols-4",
} as const

const DEFAULT_ITEMS: FillItem[] = [
  {
    title: "Lorem Ipsum Dolor Sit",
    description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
    value: "100+",
    label: "Lorem",
    badge: "Lorem Ipsum",
    meta: "Lorem",
    imageUrl: "",
    imageAlt: "",
    href: "#",
  },
  {
    title: "Lorem Ipsum Dolor Sit",
    description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
    value: "100+",
    label: "Lorem",
    badge: "Lorem Ipsum",
    meta: "Lorem",
    imageUrl: "",
    imageAlt: "",
    href: "#",
  },
  {
    title: "Lorem Ipsum Dolor Sit",
    description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
    value: "100+",
    label: "Lorem",
    badge: "Lorem Ipsum",
    meta: "Lorem",
    imageUrl: "",
    imageAlt: "",
    href: "#",
  },
]

function withItems (items: Partial<FillItem>[]): FillItem[] {
  return items.map((item, index) => {
    const fallback = (DEFAULT_ITEMS[index % DEFAULT_ITEMS.length] ?? DEFAULT_ITEMS[0]) as FillItem
    return {
      title: fallback.title,
      description: fallback.description,
      value: fallback.value,
      label: fallback.label,
      badge: fallback.badge,
      meta: fallback.meta,
      imageUrl: fallback.imageUrl,
      imageAlt: fallback.imageAlt,
      href: fallback.href,
      ...item,
    }
  })
}

function editableProp (
  instanceId: string,
  prop: string,
  value: string,
  className: string,
  as: "div" | "p" | "h2" | "span" = "span",
  isPreview?: boolean
) {
  const store = useBuilderStore.getState
  return (
    <InlineEditableText
      as={as}
      data-element-id={`${instanceId}::${prop}`}
      data-element-type="text"
      className={className}
      value={value}
      isPreview={isPreview}
      onChange={(text) => store().updateSectionProps(instanceId, { [prop]: text })}
      onCommit={(text) => store().updateSectionProps(instanceId, { [prop]: text })}
    />
  )
}

function editableItem (
  instanceId: string,
  index: number,
  prop: keyof FillItem,
  value: string,
  className: string,
  as: "div" | "p" | "h3" | "span" = "span",
  isPreview?: boolean
) {
  const store = useBuilderStore.getState
  return (
    <InlineEditableText
      as={as}
      data-element-collection="items"
      data-element-index={String(index)}
      data-element-item-label-prop={prop}
      className={className}
      value={value}
      isPreview={isPreview}
      onChange={(text) => store().updateItem(instanceId, "items", index, { [prop]: text })}
      onCommit={(text) => store().updateItem(instanceId, "items", index, { [prop]: text })}
    />
  )
}

function HeaderBlock ({
  instance,
  isPreview,
  compact = false,
}: SectionComponentProps & { compact?: boolean }) {
  const align = String(instance.props.align ?? "center")
  return (
    <div
      className={cn(
        "flex max-w-3xl flex-col gap-4",
        align === "center" ? "items-center text-center" : "items-start text-start",
        compact && "gap-3"
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        {editableProp(
          instance.id,
          "eyebrow",
          String(instance.props.eyebrow ?? ""),
          "text-[12px] font-semibold uppercase tracking-[0.14em] text-primary",
          "span",
          isPreview
        )}
        {editableProp(
          instance.id,
          "badge",
          String(instance.props.badge ?? ""),
          "inline-flex min-h-6 items-center rounded-full border border-border/70 bg-card px-3 text-[12px] font-semibold text-muted-foreground",
          "span",
          isPreview
        )}
      </div>
      {editableProp(
        instance.id,
        "headline",
        String(instance.props.headline ?? ""),
        cn(
          "font-bold leading-[1.04] tracking-[-0.035em] text-foreground",
          compact ? "text-[clamp(1.8rem,2vw+1rem,2.75rem)]" : "text-[clamp(2rem,3vw+1rem,3.75rem)]"
        ),
        "h2",
        isPreview
      )}
      {editableProp(
        instance.id,
        "description",
        String(instance.props.description ?? ""),
        "text-[16px] leading-[1.65] text-muted-foreground",
        "p",
        isPreview
      )}
    </div>
  )
}

function CtaRow ({ instance, isPreview, center = false }: SectionComponentProps & { center?: boolean }) {
  return (
    <div className={cn("flex flex-wrap gap-3", center && "justify-center")}>
      {["primaryCta", "secondaryCta"].map((key, index) => (
        <a
          key={key}
          href={isPreview ? "#" : undefined}
          data-element-id={`${instance.id}::${key}`}
          data-element-type="button"
          className={cn(
            "inline-flex min-h-11 items-center justify-center rounded-full px-5 text-sm font-semibold transition-colors",
            index === 0
              ? "bg-primary text-primary-foreground hover:bg-primary/90"
              : "border border-border/70 bg-card text-foreground hover:bg-muted/50"
          )}
        >
          {editableProp(
            instance.id,
            key,
            String(instance.props[key] ?? ""),
            "leading-none",
            "span",
            isPreview
          )}
        </a>
      ))}
    </div>
  )
}

function ItemImage ({
  instanceId,
  item,
  index,
  className,
}: {
  instanceId: string
  item: FillItem
  index: number
  className?: string
}) {
  return (
    <div className={cn("overflow-hidden rounded-[inherit] bg-muted", className)}>
      <SectionEditableImage
        instanceId={instanceId}
        elementKey={`items-${index}-image`}
        collectionKey="items"
        collectionIndex={index}
        itemSrcProp="imageUrl"
        itemAltProp="imageAlt"
        src={item.imageUrl}
        alt={item.imageAlt ?? ""}
        className="h-full min-h-40 w-full object-cover"
      />
    </div>
  )
}

function ItemCard ({
  instance,
  item,
  index,
  isPreview,
  dense = false,
  image = false,
}: SectionComponentProps & { item: FillItem; index: number; dense?: boolean; image?: boolean }) {
  const radius = String(instance.props.cardRadius ?? "24px")
  const shadow = String(instance.props.cardShadow ?? "0 24px 80px rgb(15 23 42 / 0.08)")
  return (
    <article
      className={cn(
        "flex min-h-full flex-col gap-4 border border-border/60 bg-card p-6",
        dense && "p-4"
      )}
      style={{ borderRadius: radius, boxShadow: shadow }}
    >
      {image && <ItemImage instanceId={instance.id} item={item} index={index} className="aspect-video" />}
      <div className="flex items-center justify-between gap-3">
        {editableItem(instance.id, index, "badge", item.badge ?? "", "text-xs font-semibold text-primary", "span", isPreview)}
        {editableItem(instance.id, index, "value", item.value ?? "", "text-xl font-bold tabular-nums text-foreground", "span", isPreview)}
      </div>
      {editableItem(instance.id, index, "title", item.title, "text-lg font-semibold tracking-[-0.01em] text-foreground", "h3", isPreview)}
      {editableItem(instance.id, index, "description", item.description, "text-sm leading-6 text-muted-foreground", "p", isPreview)}
      {editableItem(instance.id, index, "meta", item.meta ?? "", "mt-auto text-xs font-medium text-muted-foreground", "div", isPreview)}
    </article>
  )
}

function GenericFillerSection ({ instance, isPreview }: SectionComponentProps) {
  const ref = useRef<HTMLElement>(null)
  useInstrumentSection(ref, instance.id, Boolean(isPreview))
  const { rootStyle } = useSectionSurface({ instanceId: instance.id })
  const items = ((instance.props.items as FillItem[]) ?? DEFAULT_ITEMS).filter(Boolean)
  const layout = String(instance.props.layoutVariant ?? "center-grid") as FillerLayout
  const gap = GAP_CLASS[String(instance.props.gap ?? "normal") as keyof typeof GAP_CLASS] ?? GAP_CLASS.normal
  const cols = COL_CLASS[String(instance.props.columns ?? "3") as keyof typeof COL_CLASS] ?? COL_CLASS["3"]
  const center = String(instance.props.align ?? "center") === "center"
  const overlayOpacity = Number(instance.props.overlayOpacity ?? 0.35)

  const grid = (opts?: { image?: boolean; dense?: boolean }) => (
    <div className={cn("grid grid-cols-1 md:grid-cols-2", cols, gap)}>
      {items.map((item, index) => (
        <ItemCard
          key={index}
          instance={instance}
          item={item}
          index={index}
          isPreview={isPreview}
          image={opts?.image}
          dense={opts?.dense}
        />
      ))}
    </div>
  )

  const visual = (
    <div className="relative min-h-[360px] overflow-hidden rounded-2xl border border-border/60 bg-muted">
      <SectionEditableImage
        instanceId={instance.id}
        elementKey="image"
        srcProp="imageUrl"
        altProp="imageAlt"
        src={String(instance.props.imageUrl ?? "")}
        alt={String(instance.props.imageAlt ?? "")}
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div
        className="absolute inset-0 bg-foreground"
        style={{ opacity: Number.isFinite(overlayOpacity) ? overlayOpacity : 0.35 }}
      />
      <div className="relative z-10 flex min-h-[360px] flex-col justify-end p-8 text-background">
        {editableProp(instance.id, "badge", String(instance.props.badge ?? ""), "mb-3 text-sm font-semibold", "div", isPreview)}
        {editableProp(instance.id, "headline", String(instance.props.headline ?? ""), "max-w-2xl text-4xl font-bold tracking-[-0.03em]", "h2", isPreview)}
      </div>
    </div>
  )

  let body: React.ReactNode
  switch (layout) {
    case "split-left":
    case "split-right":
      body = (
        <div className={cn("grid items-center gap-10 lg:grid-cols-[0.92fr_1.08fr]", layout === "split-right" && "lg:grid-cols-[1.08fr_0.92fr]")}>
          <div className={cn("flex flex-col gap-7", layout === "split-right" && "lg:order-2")}>
            <HeaderBlock instance={instance} isPreview={isPreview} compact />
            <CtaRow instance={instance} isPreview={isPreview} />
          </div>
          <div className={cn("grid gap-4 sm:grid-cols-2", layout === "split-right" && "lg:order-1")}>
            {items.slice(0, 4).map((item, index) => (
              <ItemCard key={index} instance={instance} item={item} index={index} isPreview={isPreview} dense />
            ))}
          </div>
        </div>
      )
      break
    case "bento":
      body = (
        <div className="flex flex-col gap-10">
          <HeaderBlock instance={instance} isPreview={isPreview} />
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-6">
            {items.map((item, index) => (
              <div key={index} className={cn(index === 0 ? "lg:col-span-3 lg:row-span-2" : "lg:col-span-3", index > 2 && "lg:col-span-2")}>
                <ItemCard instance={instance} item={item} index={index} isPreview={isPreview} image={index === 0} />
              </div>
            ))}
          </div>
        </div>
      )
      break
    case "timeline":
      body = (
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          <HeaderBlock instance={instance} isPreview={isPreview} compact />
          <ol className="relative flex flex-col gap-5 border-s border-border/70 ps-7">
            {items.map((item, index) => (
              <li key={index} className="relative rounded-2xl border border-border/60 bg-card p-5">
                <span className="absolute -start-[2.15rem] top-6 flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">{index + 1}</span>
                {editableItem(instance.id, index, "title", item.title, "font-semibold text-foreground", "h3", isPreview)}
                {editableItem(instance.id, index, "description", item.description, "mt-2 text-sm leading-6 text-muted-foreground", "p", isPreview)}
              </li>
            ))}
          </ol>
        </div>
      )
      break
    case "masonry":
      body = (
        <div className="flex flex-col gap-10">
          <HeaderBlock instance={instance} isPreview={isPreview} />
          <div className="columns-1 gap-5 md:columns-2 lg:columns-3">
            {items.map((item, index) => (
              <div key={index} className="mb-5 break-inside-avoid">
                <ItemCard instance={instance} item={item} index={index} isPreview={isPreview} image={index % 2 === 0} />
              </div>
            ))}
          </div>
        </div>
      )
      break
    case "comparison":
      body = (
        <div className="flex flex-col gap-10">
          <HeaderBlock instance={instance} isPreview={isPreview} />
          <div className="overflow-hidden rounded-3xl border border-border/60 bg-card">
            {items.map((item, index) => (
              <div key={index} className="grid gap-4 border-b border-border/60 p-5 last:border-b-0 md:grid-cols-[0.8fr_1fr_0.45fr]">
                {editableItem(instance.id, index, "title", item.title, "font-semibold text-foreground", "h3", isPreview)}
                {editableItem(instance.id, index, "description", item.description, "text-sm leading-6 text-muted-foreground", "p", isPreview)}
                {editableItem(instance.id, index, "value", item.value ?? "", "font-bold text-primary", "div", isPreview)}
              </div>
            ))}
          </div>
        </div>
      )
      break
    case "visual-first":
      body = <div className="flex flex-col gap-8">{visual}{grid({ dense: true })}</div>
      break
    case "stats-band":
      body = (
        <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr]">
          <HeaderBlock instance={instance} isPreview={isPreview} compact />
          <div className="grid grid-cols-1 overflow-hidden rounded-3xl border border-border/60 bg-card sm:grid-cols-3">
            {items.slice(0, 6).map((item, index) => (
              <div key={index} className="border-b border-border/60 p-6 sm:border-e sm:last:border-e-0">
                {editableItem(instance.id, index, "value", item.value ?? "", "text-4xl font-bold tracking-[-0.03em] text-foreground", "div", isPreview)}
                {editableItem(instance.id, index, "label", item.label ?? "", "mt-2 text-sm text-muted-foreground", "div", isPreview)}
              </div>
            ))}
          </div>
        </div>
      )
      break
    case "sticky-aside":
      body = (
        <div className="grid gap-10 lg:grid-cols-[0.72fr_1.28fr]">
          <div className="lg:sticky lg:top-24 lg:self-start">
            <HeaderBlock instance={instance} isPreview={isPreview} compact />
          </div>
          {grid({ image: true })}
        </div>
      )
      break
    case "tabs":
      body = (
        <div className="grid gap-8 lg:grid-cols-[0.6fr_1.4fr]">
          <div className="flex flex-col gap-3">
            <HeaderBlock instance={instance} isPreview={isPreview} compact />
            {items.map((item, index) => (
              <div key={index} className="flex min-h-11 items-center rounded-full border border-border/60 bg-card px-4 text-sm font-semibold">
                {editableItem(instance.id, index, "title", item.title, "text-foreground", "span", isPreview)}
              </div>
            ))}
          </div>
          {visual}
        </div>
      )
      break
    case "pricing-rail":
      body = <div className="flex flex-col gap-10"><HeaderBlock instance={instance} isPreview={isPreview} />{grid({ dense: false })}<CtaRow instance={instance} isPreview={isPreview} center={center} /></div>
      break
    case "faq-ladder":
      body = (
        <div className="grid gap-10 lg:grid-cols-[0.75fr_1.25fr]">
          <HeaderBlock instance={instance} isPreview={isPreview} compact />
          <div className="flex flex-col gap-3">
            {items.map((item, index) => (
              <details key={index} className="group rounded-2xl border border-border/60 bg-card p-5" open={index === 0}>
                <summary className="cursor-pointer list-none font-semibold text-foreground">
                  {editableItem(instance.id, index, "title", item.title, "", "span", isPreview)}
                </summary>
                {editableItem(instance.id, index, "description", item.description, "mt-3 text-sm leading-6 text-muted-foreground", "p", isPreview)}
              </details>
            ))}
          </div>
        </div>
      )
      break
    case "logo-orbit":
    case "logo-scoreboard":
      body = (
        <div className={cn("flex flex-col gap-10", center && "items-center text-center")}>
          <HeaderBlock instance={instance} isPreview={isPreview} />
          <div className={cn("grid w-full grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5", layout === "logo-orbit" && "rounded-full border border-border/60 bg-card p-6")}>
            {items.map((item, index) => (
              <div key={index} className="flex min-h-24 flex-col items-center justify-center gap-2 rounded-2xl border border-border/50 bg-background/70 p-4">
                {editableItem(instance.id, index, "title", item.title, "text-sm font-bold text-foreground", "div", isPreview)}
                {editableItem(instance.id, index, "meta", item.meta ?? "", "text-xs text-muted-foreground", "div", isPreview)}
              </div>
            ))}
          </div>
        </div>
      )
      break
    case "navbar-command":
    case "navbar-sidebar":
    case "navbar-utility":
    case "navbar-minimal-stack":
      body = (
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-4 rounded-3xl border border-border/60 bg-card p-4 shadow-sm md:flex-row md:items-center md:justify-between">
            {editableProp(instance.id, "headline", String(instance.props.headline ?? ""), "text-lg font-bold text-foreground", "div", isPreview)}
            <nav className="flex flex-wrap gap-2">
              {items.slice(0, 6).map((item, index) => (
                <a key={index} href={isPreview ? item.href : undefined} className="inline-flex min-h-9 items-center rounded-full px-3 text-sm font-medium text-muted-foreground hover:bg-muted">
                  {editableItem(instance.id, index, "title", item.title, "", "span", isPreview)}
                </a>
              ))}
            </nav>
            <CtaRow instance={instance} isPreview={isPreview} />
          </div>
          <HeaderBlock instance={instance} isPreview={isPreview} compact />
        </div>
      )
      break
    case "footer-directory":
    case "footer-newsroom":
      body = (
        <div className="flex flex-col gap-10">
          <div className="grid gap-8 md:grid-cols-[1fr_1.5fr]">
            <HeaderBlock instance={instance} isPreview={isPreview} compact />
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
              {items.map((item, index) => (
                <div key={index} className="flex flex-col gap-2">
                  {editableItem(instance.id, index, "title", item.title, "font-semibold text-foreground", "h3", isPreview)}
                  {editableItem(instance.id, index, "description", item.description, "text-sm leading-6 text-muted-foreground", "p", isPreview)}
                </div>
              ))}
            </div>
          </div>
          <div className="border-t border-border/60 pt-5 text-sm text-muted-foreground">{editableProp(instance.id, "badge", String(instance.props.badge ?? ""), "", "span", isPreview)}</div>
        </div>
      )
      break
    case "menu-board":
    case "menu-editorial":
      body = (
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          <HeaderBlock instance={instance} isPreview={isPreview} compact />
          <div className="grid gap-3">
            {items.map((item, index) => (
              <div key={index} className="grid gap-3 rounded-2xl border border-border/60 bg-card p-4 sm:grid-cols-[1fr_auto]">
                <div>
                  {editableItem(instance.id, index, "title", item.title, "font-semibold text-foreground", "h3", isPreview)}
                  {editableItem(instance.id, index, "description", item.description, "mt-1 text-sm text-muted-foreground", "p", isPreview)}
                </div>
                {editableItem(instance.id, index, "value", item.value ?? "", "font-bold text-primary", "div", isPreview)}
              </div>
            ))}
          </div>
        </div>
      )
      break
    case "listings-map":
    case "listings-compact":
      body = (
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="grid gap-4">{grid({ image: layout === "listings-map", dense: true })}</div>
          <div className="min-h-[420px] rounded-3xl border border-border/60 bg-[radial-gradient(circle_at_30%_20%,color-mix(in_oklch,var(--primary)_22%,transparent),transparent_30%),linear-gradient(135deg,var(--muted),var(--card))] p-6">
            <HeaderBlock instance={instance} isPreview={isPreview} compact />
          </div>
        </div>
      )
      break
    case "blog-editorial":
      body = <div className="flex flex-col gap-10"><HeaderBlock instance={instance} isPreview={isPreview} />{grid({ image: true })}</div>
      break
    case "team-roster":
      body = <div className="flex flex-col gap-10"><HeaderBlock instance={instance} isPreview={isPreview} />{grid({ image: true, dense: true })}</div>
      break
    case "booking-calendar":
    case "booking-split-form":
      body = (
        <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr]">
          <HeaderBlock instance={instance} isPreview={isPreview} compact />
          <div className="rounded-3xl border border-border/60 bg-card p-5">
            <div className="grid grid-cols-7 gap-2">
              {items.slice(0, 7).map((item, index) => (
                <div key={index} className="min-h-20 rounded-2xl border border-border/60 bg-background p-3 text-center">
                  {editableItem(instance.id, index, "value", item.value ?? String(index + 1), "font-bold text-foreground", "div", isPreview)}
                  {editableItem(instance.id, index, "label", item.label ?? "", "text-xs text-muted-foreground", "div", isPreview)}
                </div>
              ))}
            </div>
            <div className="mt-5"><CtaRow instance={instance} isPreview={isPreview} /></div>
          </div>
        </div>
      )
      break
    case "center-grid":
    default:
      body = <div className="flex flex-col gap-10"><HeaderBlock instance={instance} isPreview={isPreview} />{grid({ image: false })}</div>
      break
  }

  return (
    <section ref={ref} className="text-foreground" style={rootStyle}>
      <SectionContainer>{body}</SectionContainer>
    </section>
  )
}

const SPECS: FillerSpec[] = [
  {
    id: "about-proof-split",
    displayName: "About - proof split",
    description: "About narrative with a left proof panel and right capability cards.",
    category: "about",
    layout: "split-left",
    defaultProps: {
      eyebrow: "Lorem Ipsum",
      badge: "Lorem Ipsum",
      headline: "Lorem Ipsum Dolor Sit",
      description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
      primaryCta: "Lorem Ipsum",
      secondaryCta: "Lorem Ipsum",
      align: "left",
      columns: "2",
      gap: "normal",
      cardRadius: "24px",
      cardShadow: "0 24px 70px rgb(15 23 42 / 0.08)",
      overlayOpacity: "0.35",
      items: withItems([
        { title: "Lorem Ipsum Dolor Sit", value: "100+", description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit." },
        { title: "Lorem Ipsum Dolor Sit", value: "100+", description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit." },
        { title: "Lorem Ipsum Dolor Sit", value: "100+", description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit." },
        { title: "Lorem Ipsum Dolor Sit", value: "100+", description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit." },
      ]),
    },
  },
  {
    id: "about-culture-bento",
    displayName: "About - culture bento",
    description: "A bento-style culture and values layout for modern teams.",
    category: "about",
    layout: "bento",
    defaultProps: {
      eyebrow: "Lorem Ipsum",
      badge: "Lorem Ipsum",
      headline: "Lorem Ipsum Dolor Sit",
      description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
      primaryCta: "Lorem Ipsum",
      secondaryCta: "Lorem Ipsum",
      align: "center",
      columns: "3",
      gap: "normal",
      cardRadius: "28px",
      cardShadow: "0 20px 60px rgb(15 23 42 / 0.07)",
      overlayOpacity: "0.35",
      items: withItems([
        { title: "Lorem Ipsum Dolor Sit", description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.", value: "01" },
        { title: "Lorem Ipsum Dolor Sit", description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.", value: "02" },
        { title: "Lorem Ipsum Dolor Sit", description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.", value: "03" },
      ]),
    },
  },
  {
    id: "blog-magazine-split",
    displayName: "Blog - magazine split",
    description: "Editorial blog section with one lead story and supporting cards.",
    category: "blog",
    layout: "split-right",
    defaultProps: {
      eyebrow: "Lorem Ipsum",
      badge: "Lorem Ipsum",
      headline: "Lorem Ipsum Dolor Sit",
      description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
      imageUrl: "",
      imageAlt: "",
      primaryCta: "Lorem Ipsum",
      secondaryCta: "Lorem Ipsum",
      align: "left",
      columns: "2",
      gap: "normal",
      cardRadius: "24px",
      cardShadow: "0 18px 50px rgb(15 23 42 / 0.08)",
      overlayOpacity: "0.28",
      items: withItems([
        { title: "Lorem Ipsum Dolor Sit", meta: "Lorem", description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit." },
        { title: "Lorem Ipsum Dolor Sit", meta: "Lorem", description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit." },
        { title: "Lorem Ipsum Dolor Sit", meta: "Lorem", description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit." },
      ]),
    },
  },
  {
    id: "blog-newsroom-masonry",
    displayName: "Blog - newsroom masonry",
    description: "Masonry editorial feed with varied story cards.",
    category: "blog",
    layout: "masonry",
    defaultProps: {
      eyebrow: "Lorem Ipsum",
      badge: "Lorem Ipsum",
      headline: "Lorem Ipsum Dolor Sit",
      description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
      primaryCta: "Lorem Ipsum",
      secondaryCta: "Lorem Ipsum",
      align: "center",
      columns: "3",
      gap: "normal",
      cardRadius: "24px",
      cardShadow: "0 18px 55px rgb(15 23 42 / 0.07)",
      overlayOpacity: "0.3",
      items: withItems([
        { title: "Lorem Ipsum Dolor Sit", meta: "Lorem", description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit." },
        { title: "Lorem Ipsum Dolor Sit", meta: "Lorem", description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit." },
        { title: "Lorem Ipsum Dolor Sit", meta: "Lorem", description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit." },
      ]),
    },
  },
  {
    id: "blog-topic-tabs",
    displayName: "Blog - topic tabs",
    description: "Tabbed article categories with a visual feature pane.",
    category: "blog",
    layout: "tabs",
    defaultProps: {
      eyebrow: "Lorem Ipsum",
      badge: "Lorem Ipsum",
      headline: "Lorem Ipsum Dolor Sit",
      description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
      imageUrl: "",
      imageAlt: "",
      primaryCta: "Lorem Ipsum",
      secondaryCta: "Lorem Ipsum",
      align: "left",
      columns: "3",
      gap: "compact",
      cardRadius: "22px",
      cardShadow: "0 16px 45px rgb(15 23 42 / 0.07)",
      overlayOpacity: "0.42",
      items: withItems([
        { title: "Lorem Ipsum", description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit." },
        { title: "Lorem Ipsum", description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit." },
        { title: "Lorem Ipsum", description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit." },
      ]),
    },
  },
  {
    id: "blog-feature-grid",
    displayName: "Blog - feature grid",
    description: "Image-led card grid for articles and resources.",
    category: "blog",
    layout: "blog-editorial",
    defaultProps: {
      eyebrow: "Lorem Ipsum",
      badge: "Lorem Ipsum",
      headline: "Lorem Ipsum Dolor Sit",
      description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
      primaryCta: "Lorem Ipsum",
      secondaryCta: "Lorem Ipsum",
      align: "center",
      columns: "3",
      gap: "normal",
      cardRadius: "26px",
      cardShadow: "0 20px 60px rgb(15 23 42 / 0.08)",
      overlayOpacity: "0.35",
      items: withItems([
        { title: "Lorem Ipsum Dolor Sit", meta: "Lorem", badge: "Lorem Ipsum", description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit." },
        { title: "Lorem Ipsum Dolor Sit", meta: "Lorem", badge: "Lorem Ipsum", description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit." },
        { title: "Lorem Ipsum Dolor Sit", meta: "Lorem", badge: "Lorem Ipsum", description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit." },
      ]),
    },
  },
  {
    id: "blog-briefing-row",
    displayName: "Blog - briefing row",
    description: "Compact briefing cards for short-form updates.",
    category: "blog",
    layout: "center-grid",
    defaultProps: {
      eyebrow: "Lorem Ipsum",
      badge: "Lorem Ipsum",
      headline: "Lorem Ipsum Dolor Sit",
      description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
      primaryCta: "Lorem Ipsum",
      secondaryCta: "Lorem Ipsum",
      align: "center",
      columns: "4",
      gap: "compact",
      cardRadius: "20px",
      cardShadow: "0 14px 42px rgb(15 23 42 / 0.06)",
      overlayOpacity: "0.35",
      items: withItems([
        { title: "Lorem Ipsum Dolor Sit", meta: "Lorem", description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit." },
        { title: "Lorem Ipsum Dolor Sit", meta: "Lorem", description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit." },
        { title: "Lorem Ipsum Dolor Sit", meta: "Lorem", description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit." },
        { title: "Lorem Ipsum Dolor Sit", meta: "Lorem", description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit." },
      ]),
    },
  },
]

const MORE_SPECS: FillerSpec[] = [
  ...makeSpecs("blog", [
    ["blog-research-comparison", "Blog - research comparison", "comparison", "Compare research notes, playbooks, and field insights"],
  ]),
  ...makeSpecs("booking", [
    ["booking-availability-strip", "Booking - availability strip", "booking-calendar", "Book a time that fits your workflow"],
    ["booking-services-split", "Booking - services split", "booking-split-form", "Pick a service and reserve a focused consultation"],
    ["booking-concierge-flow", "Booking - concierge flow", "timeline", "A guided booking flow from request to confirmation"],
    ["booking-package-cards", "Booking - package cards", "pricing-rail", "Choose the appointment package that matches your needs"],
    ["booking-location-board", "Booking - location board", "comparison", "Compare locations, times, and session formats"],
  ]),
  ...makeSpecs("contact", [
    ["contact-routing-bento", "Contact - routing bento", "bento", "Route every inquiry to the right team"],
    ["contact-office-timeline", "Contact - office timeline", "timeline", "What happens after you reach out"],
  ]),
  ...makeSpecs("cta", [
    ["cta-proof-band", "CTA - proof band", "stats-band", "Start with proof, then invite action"],
    ["cta-visual-panel", "CTA - visual panel", "visual-first", "Show the outcome before the call to action"],
    ["cta-sticky-offer", "CTA - sticky offer", "sticky-aside", "Keep the offer visible beside supporting reasons"],
  ]),
  ...makeSpecs("faq", [
    ["faq-ladder-support", "FAQ - support ladder", "faq-ladder", "Answer key questions in a stepped support layout"],
    ["faq-comparison-answers", "FAQ - comparison answers", "comparison", "Compare questions, answers, and buyer impact"],
  ]),
  ...makeSpecs("footer", [
    ["footer-directory-premium", "Footer - directory premium", "footer-directory", "Organize links, brand, and conversion paths"],
    ["footer-newsroom-signoff", "Footer - newsroom signoff", "footer-newsroom", "A footer with editorial links and brand signoff"],
  ]),
  ...makeSpecs("gallery", [
    ["gallery-editorial-masonry", "Gallery - editorial masonry", "masonry", "Show varied visuals in a premium masonry layout"],
    ["gallery-visual-story", "Gallery - visual story", "visual-first", "Lead with a large visual and supporting proof cards"],
  ]),
  ...makeSpecs("listings", [
    ["listings-map-premium", "Listings - map premium", "listings-map", "Browse featured listings beside a visual location panel"],
    ["listings-comparison-grid", "Listings - comparison grid", "comparison", "Compare availability, highlights, and status"],
    ["listings-neighborhood-bento", "Listings - neighborhood bento", "bento", "Present locations and highlights in a bento grid"],
    ["listings-compact-feed", "Listings - compact feed", "listings-compact", "A dense listing feed for quick scanning"],
    ["listings-spotlight-split", "Listings - spotlight split", "split-left", "Feature one destination beside compact listing cards"],
    ["listings-timeline-tour", "Listings - timeline tour", "timeline", "Guide visitors through a sequenced tour path"],
  ]),
  ...makeSpecs("logo-cloud", [
    ["logo-cloud-orbit", "Logo cloud - orbit", "logo-orbit", "Arrange customer proof in a soft orbit-style cloud"],
    ["logo-cloud-scoreboard", "Logo cloud - scoreboard", "logo-scoreboard", "Pair logos with proof metrics and categories"],
    ["logo-cloud-bento-proof", "Logo cloud - bento proof", "bento", "Mix partner logos, endorsements, and statistics"],
    ["logo-cloud-industry-rows", "Logo cloud - industry rows", "comparison", "Group logos by industry and use case"],
  ]),
  ...makeSpecs("logos", [
    ["logos-minimal-grid", "Logos - minimal grid", "logo-scoreboard", "A clean grid for partner or customer names"],
    ["logos-orbit-proof", "Logos - orbit proof", "logo-orbit", "A rounded proof cloud for trusted brands"],
    ["logos-category-board", "Logos - category board", "comparison", "Group logos by segment in a structured board"],
    ["logos-bento-wall", "Logos - bento wall", "bento", "Logo cards with varied emphasis and supporting metadata"],
    ["logos-visual-band", "Logos - visual band", "visual-first", "A visual-first proof section with logo cards below"],
    ["logos-stats-strip", "Logos - stats strip", "stats-band", "Combine brand proof with numeric credibility"],
    ["logos-masonry-wall", "Logos - masonry wall", "masonry", "A varied logo wall with compact proof tiles"],
    ["logos-split-proof", "Logos - split proof", "split-right", "A split layout balancing brand proof and explanation"],
    ["logos-tabs", "Logos - use-case tabs", "tabs", "Use tabbed groups to browse logo categories"],
  ]),
  ...makeSpecs("menu", [
    ["menu-board-premium", "Menu - premium board", "menu-board", "A structured board for products, dishes, or services"],
    ["menu-editorial-feature", "Menu - editorial feature", "menu-editorial", "Editorial menu copy beside scannable items"],
    ["menu-comparison-list", "Menu - comparison list", "comparison", "Compare packages, options, or service tiers"],
    ["menu-bento-catalog", "Menu - bento catalog", "bento", "A bento catalog for featured menu items"],
    ["menu-visual-specials", "Menu - visual specials", "visual-first", "Lead with the featured special and supporting items"],
    ["menu-tasting-timeline", "Menu - tasting timeline", "timeline", "Present a meal, event, or service sequence"],
    ["menu-compact-grid", "Menu - compact grid", "center-grid", "A compact grid for concise item browsing"],
  ]),
  ...makeSpecs("navbar", [
    ["navbar-command-bar", "Navbar - command bar", "navbar-command", "Navigation with command-style action grouping"],
    ["navbar-sidebar-preview", "Navbar - sidebar preview", "navbar-sidebar", "A navigation concept with stacked product links"],
    ["navbar-utility-row", "Navbar - utility row", "navbar-utility", "Primary links with compact utility actions"],
    ["navbar-minimal-stack", "Navbar - minimal stack", "navbar-minimal-stack", "A restrained stacked navigation pattern"],
  ]),
  ...makeSpecs("pricing", [
    ["pricing-proof-rail", "Pricing - proof rail", "pricing-rail", "Plan cards with proof and a focused CTA rail"],
    ["pricing-comparison-cards", "Pricing - comparison cards", "comparison", "Compare plan highlights in a clean table-like layout"],
  ]),
  ...makeSpecs("social-proof", [
    ["social-proof-signal-wall", "Social proof - signal wall", "masonry", "A mixed wall of customer quotes, stats, and signals"],
  ]),
  ...makeSpecs("team", [
    ["team-roster-premium", "Team - premium roster", "team-roster", "Image-led team roster with compact biographies"],
    ["team-operating-bento", "Team - operating bento", "bento", "Team principles and roles in a bento layout"],
    ["team-leadership-timeline", "Team - leadership timeline", "timeline", "Introduce team milestones and leadership moments"],
  ]),
  ...makeSpecs("testimonials", [
    ["testimonials-proof-masonry", "Testimonials - proof masonry", "masonry", "Varied testimonial cards with proof metadata"],
    ["testimonials-comparison-proof", "Testimonials - comparison proof", "comparison", "Compare customer outcomes and quotes"],
  ]),
  ...makeSpecs("timeline", [
    ["timeline-product-flow", "Timeline - product flow", "timeline", "A clean sequence for product, roadmap, or process steps"],
    ["timeline-sticky-story", "Timeline - sticky story", "sticky-aside", "Sticky narrative beside milestone cards"],
    ["timeline-comparison-roadmap", "Timeline - comparison roadmap", "comparison", "Roadmap rows with ownership and outcomes"],
  ]),
]

function makeSpecs (
  category: FillerSpec["category"],
  rows: [string, string, FillerLayout, string][]
): FillerSpec[] {
  return rows.map(([id, displayName, layout, headline], index) => ({
    id,
    displayName,
    description: `${displayName} section with editable content, styling, and repeatable items.`,
    category,
    layout,
    defaultProps: {
      eyebrow: displayName.split(" - ")[0] ?? "Section",
      badge: "Lorem Ipsum",
      headline,
      description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
      imageUrl: "",
      imageAlt: "",
      primaryCta: "Lorem Ipsum",
      secondaryCta: "Lorem Ipsum",
      align: index % 2 === 0 ? "left" : "center",
      columns: index % 3 === 0 ? "2" : index % 3 === 1 ? "3" : "4",
      gap: index % 3 === 0 ? "normal" : index % 3 === 1 ? "compact" : "loose",
      cardRadius: index % 2 === 0 ? "24px" : "18px",
      cardShadow: index % 2 === 0 ? "0 22px 70px rgb(15 23 42 / 0.08)" : "0 12px 40px rgb(15 23 42 / 0.06)",
      overlayOpacity: "0.35",
      items: withItems([
        { title: "Lorem Ipsum Dolor Sit", value: "01", label: "Lorem", description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit." },
        { title: "Lorem Ipsum Dolor Sit", value: "02", label: "Lorem", description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit." },
        { title: "Lorem Ipsum Dolor Sit", value: "03", label: "Lorem", description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit." },
      ]),
    },
  }))
}

function createFillerDefinition (spec: FillerSpec): SectionDefinition {
  return defineSection({
    id: spec.id,
    displayName: spec.displayName,
    description: spec.description,
    category: spec.category,
    thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
    version: 1,
    industries: ["generic", "saas", "startup", "agency", "enterprise", "software"],
    styles: ["modern", "minimal", "corporate"],
    goals: ["conversion", "trust", "brand"],
    complexity: "medium",
    density: "medium",
    imageRequired: ["visual-first", "blog-editorial", "team-roster", "listings-map"].includes(spec.layout),
    mobileScore: 88,
    editable: true,
    editableElements: [
      "eyebrow",
      "badge",
      "headline",
      "description",
      "primaryCta",
      "secondaryCta",
      "imageUrl",
      "imageAlt",
      "items.title",
      "items.description",
      "items.value",
      "items.label",
      "items.badge",
      "items.meta",
      "items.imageUrl",
      "items.href",
    ],
    trustWeight: 55,
    conversionWeight: 55,
    funnelStage: spec.category === "navbar" ? "awareness" : spec.category === "footer" ? "decision" : "consideration",
    defaultProps: {
      ...spec.defaultProps,
      layoutVariant: spec.layout,
    },
    defaultStyle: {
      backgroundColor: "var(--background)",
      color: "var(--foreground)",
    },
    rootStyleOptions: { defaultBackground: "var(--background)" },
    propDefinitions: [
      { key: "eyebrow", label: "Eyebrow", type: "text", canonical: "eyebrow", aiHint: "Short section label", maxLength: 32, group: "content" },
      { key: "badge", label: "Badge", type: "text", canonical: "badge", aiHint: "Short badge label", maxLength: 28, group: "content" },
      { key: "headline", label: "Headline", type: "text", canonical: "headline", aiHint: "Primary headline", maxLength: 90, group: "content" },
      { key: "description", label: "Description", type: "textarea", canonical: "body", aiHint: "Supporting paragraph", maxLength: 220, group: "content" },
      { key: "imageUrl", label: "Image", type: "image", canonical: "image", group: "media" },
      { key: "imageAlt", label: "Image alt", type: "text", canonical: "imageAlt", group: "media" },
      { key: "primaryCta", label: "Primary CTA", type: "text", canonical: "ctaPrimary", maxLength: 32, group: "content" },
      { key: "secondaryCta", label: "Secondary CTA", type: "text", canonical: "ctaSecondary", maxLength: 32, group: "content" },
      { key: "align", label: "Alignment", type: "select", group: "layout", options: [{ value: "left", label: "Left" }, { value: "center", label: "Center" }] },
      { key: "columns", label: "Columns", type: "select", group: "layout", options: [{ value: "2", label: "2" }, { value: "3", label: "3" }, { value: "4", label: "4" }] },
      { key: "gap", label: "Gap", type: "select", group: "layout", options: [{ value: "compact", label: "Compact" }, { value: "normal", label: "Normal" }, { value: "loose", label: "Loose" }] },
      { key: "cardRadius", label: "Card radius", type: "text", group: "appearance", designGroup: "appearance" },
      { key: "cardShadow", label: "Card shadow", type: "text", group: "appearance", designGroup: "appearance" },
      { key: "overlayOpacity", label: "Overlay opacity", type: "number", min: 0, max: 1, group: "appearance", designGroup: "appearance" },
    ],
    itemCollections: [
      {
        key: "items",
        label: "Items",
        minItems: 1,
        maxItems: 12,
        newItemTemplate: () => ({
          title: "New item",
          description: "Describe this item.",
          value: "01",
          label: "Label",
          badge: "Badge",
          meta: "Meta",
          imageUrl: "",
          imageAlt: "",
          href: "#",
        }),
        itemPropDefinitions: [
          { key: "title", label: "Title", type: "text", canonical: "headline", aiHint: "Item title", maxLength: 70, group: "content" },
          { key: "description", label: "Description", type: "textarea", canonical: "body", aiHint: "Item description", maxLength: 180, group: "content" },
          { key: "value", label: "Value", type: "text", canonical: "stats", maxLength: 18, group: "content" },
          { key: "label", label: "Label", type: "text", canonical: "badge", maxLength: 30, group: "content" },
          { key: "badge", label: "Badge", type: "text", canonical: "badge", maxLength: 30, group: "content" },
          { key: "meta", label: "Meta", type: "text", canonical: "body", maxLength: 60, group: "content" },
          { key: "imageUrl", label: "Image", type: "image", canonical: "image", group: "media" },
          { key: "imageAlt", label: "Image alt", type: "text", canonical: "imageAlt", group: "media" },
          { key: "href", label: "Link", type: "url", canonical: "ctaLink", group: "content" },
        ],
      },
    ],
    Component: GenericFillerSection,
  })
}

export const GENERATED_FILLER_SECTION_DEFINITIONS: SectionDefinition[] = [
  ...SPECS,
  ...MORE_SPECS,
].map(createFillerDefinition)
