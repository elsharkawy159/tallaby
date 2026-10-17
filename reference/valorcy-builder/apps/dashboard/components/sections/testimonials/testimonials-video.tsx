"use client"

import { useState } from "react"
import { X } from "lucide-react"
import { SectionContainer } from "@/components/sections/section-container"
import { SectionSlot } from "@/components/sections/_primitives/section-slot"
import { defineSection } from "@/components/sections/define-section"
import { TYPE_H2, TYPE_LEAD } from "@/components/sections/_primitives/type-scale"
import { SECTION_PADDING_STANDARD, SECTION_ROOT_MUTED } from "@/components/sections/section-style-presets"
import { SECTION_THUMB_PLACEHOLDER, useSectionSurface } from "@/components/sections/shared"
import {
  extractYouTubeId,
  buildYouTubeEmbedUrl,
  youTubeThumbnail,
} from "@/components/sections/_primitives/video-utils"
import {
  Attribution,
  ItemQuote,
  headerBlocks,
  itemsOf,
  testimonialItemsBlock,
  type TestimonialItem,
} from "@/components/sections/testimonials/testimonials-parts"
import type { SectionComponentProps } from "@/components/sections/registry.types"

/**
 * Showreel — captioned-grid archetype.
 *
 * A grid of video testimonial tiles with a caption under each. YouTube URLs are
 * auto-detected (thumbnail from the YouTube CDN, click expands to an inline
 * embed); direct .mp4 URLs play in a native `<video>`. The player is functional
 * chrome kept intact inside `renderItems`; the header and the collection are
 * slot entries, and the player behaviour switches are section settings.
 */

type VideoItem = TestimonialItem & { videoUrl?: string; thumbnailUrl?: string }

type PlayerOptions = { autoplay: boolean; loop: boolean; muted: boolean; controls: boolean }

function PlayIcon () {
  return (
    <div
      className="size-14 rounded-full grid place-items-center bg-background text-foreground transition-transform"
    >
      <svg className="size-6 ms-1" viewBox="0 0 24 24" fill="currentColor">
        <path d="M8 5.14v14l11-7-11-7z" />
      </svg>
    </div>
  )
}

function VideoCard ({
  instanceId,
  item,
  index,
  isPreview,
  player,
}: {
  instanceId: string
  item: VideoItem
  index: number
  isPreview: boolean
  player: PlayerOptions
}) {
  const [expanded, setExpanded] = useState(false)

  const videoUrl = item.videoUrl ?? ""
  const youtubeId = extractYouTubeId(videoUrl)
  const thumbnail = item.thumbnailUrl || (youtubeId ? youTubeThumbnail(youtubeId) : "")
  const embedSrc = youtubeId ? buildYouTubeEmbedUrl(youtubeId, player) : null

  function handleCardClick (e: React.MouseEvent) {
    if (!isPreview && !videoUrl) return
    e.preventDefault()
    setExpanded(true)
  }

  return (
    <div className="group flex flex-col gap-3">
      {/* Video area */}
      <div className="relative aspect-video rounded-xl overflow-hidden bg-muted">
        {expanded ? (
          <>
            {embedSrc ? (
              <iframe
                className="absolute inset-0 size-full"
                src={embedSrc}
                allow="autoplay; encrypted-media; picture-in-picture"
                allowFullScreen
                title={`${item.author ?? ""}'s testimonial`}
              />
            ) : videoUrl ? (
              <video
                className="absolute inset-0 size-full object-cover"
                src={videoUrl}
                poster={thumbnail || undefined}
                autoPlay={player.autoplay}
                loop={player.loop}
                muted={player.muted}
                controls={player.controls}
                playsInline
              />
            ) : null}
            <button
              type="button"
              aria-label="Close video"
              className="absolute top-2 end-2 z-10 flex size-7 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
              onClick={(e) => { e.stopPropagation(); setExpanded(false) }}
            >
              <X className="size-4" />
            </button>
          </>
        ) : (
          <button
            type="button"
            aria-label={`Watch ${item.author ?? ""}'s testimonial`}
            className="absolute inset-0 w-full h-full focus:outline-none"
            onClick={handleCardClick}
          >
            {thumbnail ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={thumbnail} alt="" className="absolute inset-0 size-full object-cover" />
            ) : (
              <div className="absolute inset-0 bg-muted" />
            )}
            <div className="absolute inset-0 bg-black/15 group-hover:bg-black/25 transition-colors" />
            <div className="absolute inset-0 grid place-items-center">
              <PlayIcon />
            </div>
          </button>
        )}
      </div>

      {/* Caption */}
      <div className="flex items-start gap-3 px-1">
        <div className="min-w-0">
          <Attribution
            instanceId={instanceId}
            item={item}
            index={index}
            isPreview={isPreview}
            nameClassName="text-sm font-semibold text-foreground"
            metaClassName="text-sm text-muted-foreground"
          />
          <ItemQuote
            instanceId={instanceId}
            item={item}
            index={index}
            isPreview={isPreview}
            className="mt-2 text-[15px] leading-relaxed text-foreground line-clamp-3"
          />
        </div>
      </div>
    </div>
  )
}

function TestimonialsVideo ({ instance, isPreview, definition }: SectionComponentProps) {
  const { rootStyle } = useSectionSurface({ instanceId: instance.id, rootOptions: { defaultBackground: false } })

  const player: PlayerOptions = {
    autoplay: instance.props.autoplay !== false,
    loop: Boolean(instance.props.loop),
    muted: Boolean(instance.props.muted),
    controls: instance.props.controls !== false,
  }

  return (
    <section className="bg-muted/40" style={rootStyle}>
      <SectionContainer>
        <SectionSlot
          instance={instance}
          definition={definition}
          isPreview={isPreview}
          slotId="content"
          className="flex flex-col gap-4"
          align="left"
          headingClassName={`${TYPE_H2} max-w-2xl text-foreground`}
          bodyClassName={`${TYPE_LEAD} max-w-2xl`}
          renderItems={({ instance: inst }) => (
            <div className="mt-12 grid gap-x-6 gap-y-10 text-start sm:grid-cols-2 lg:grid-cols-3">
              {itemsOf<VideoItem>(inst).map((it, i) => (
                <VideoCard
                  key={i}
                  instanceId={inst.id}
                  item={it}
                  index={i}
                  isPreview={!!isPreview}
                  player={player}
                />
              ))}
            </div>
          )}
        />
      </SectionContainer>
    </section>
  )
}

export const testimonialsVideoSection = defineSection({
  id: "testimonials-video",
  displayName: "Showreel",
  description: "Grid of video testimonials — YouTube or .mp4, with a caption under each.",
  category: "testimonials",
  layoutArchetype: "captioned-grid",
  thumbnailUrl: SECTION_THUMB_PLACEHOLDER,
  version: 2,
  migrateProps (old, from) {
    if (from < 2) return { ...old, autoplay: true, loop: false, muted: false, controls: true }
    return old
  },
  industries: ["saas", "agency", "education", "fitness", "ecommerce"],
  trustWeight: 95,
  conversionWeight: 45,
  funnelStage: "consideration",
  styles: ["modern", "bold", "playful"],
  goals: ["trust", "engagement", "conversion"],
  complexity: "medium",
  density: "medium",
  imageRequired: false,
  mobileScore: 85,
  editable: true,
  defaultStyle: SECTION_PADDING_STANDARD,
  rootStyleOptions: { ...SECTION_ROOT_MUTED },
  defaultOptions: { align: "center", paddingY: "lg" },
  schema: {
    slots: [{ id: "content", label: "Content", isDefault: true }],
    blocks: [
      ...headerBlocks(),
      testimonialItemsBlock({
        label: "Video testimonials",
        minItems: 1,
        maxItems: 9,
        fields: ["author", "role", "company", "quote"],
        extraFields: [
          { key: "videoUrl", label: "Video URL (YouTube or .mp4)", type: "url", group: "cta" },
          { key: "thumbnailUrl", label: "Custom thumbnail (optional)", type: "image" },
        ],
        newItem: () => ({ quote: "Short summary of the testimonial.", author: "Name", role: "Role", company: "Company", videoUrl: "", thumbnailUrl: "" }),
      }),
    ],
    settings: [
      { key: "autoplay", label: "Autoplay when opened", type: "switch", group: "content" },
      { key: "loop", label: "Loop / repeat", type: "switch", group: "content" },
      { key: "muted", label: "Muted", type: "switch", group: "content" },
      { key: "controls", label: "Show player controls", type: "switch", group: "content" },
    ],
  },
  defaultProps: {
    headline: "Hear it from our customers",
    subheadline: "Short stories from the teams who grew their business with us.",
    autoplay: true,
    loop: false,
    muted: false,
    controls: true,
    items: [
      { quote: "How a four-person team launched in two weeks and doubled sign-ups.", author: "Maya Chen", role: "Head of Product", company: "Northwind", videoUrl: "", thumbnailUrl: "" },
      { quote: "Why we consolidated five tools into one platform.", author: "Daniel Okafor", role: "CTO", company: "Brightline", videoUrl: "", thumbnailUrl: "" },
      { quote: "The onboarding change that cut our churn by a third.", author: "Sofia Ramirez", role: "Customer Success Lead", company: "Lumen", videoUrl: "", thumbnailUrl: "" },
      { quote: "Scaling to new markets without growing the ops team.", author: "James Whitfield", role: "VP Operations", company: "Harbor & Co", videoUrl: "", thumbnailUrl: "" },
      { quote: "From weekly spreadsheets to real-time reporting.", author: "Aisha Rahman", role: "Founder", company: "Atelier Studio", videoUrl: "", thumbnailUrl: "" },
      { quote: "What changed for our clients after the redesign.", author: "Lukas Berger", role: "Managing Director", company: "Fieldnote", videoUrl: "", thumbnailUrl: "" },
    ],
  },
  Component: TestimonialsVideo,
})
