"use client"

import type { ReactNode } from "react"
import { InlineEditableText } from "@/components/website-builder/inline-editable"
import { SectionLink } from "@/components/website-builder/section-link"
import { useBuilderStore } from "@/lib/builder/store"
import { usePublicSiteContext } from "@/components/website-builder/public-site-context"

/** Wraps brand logo with a home link on published/preview site surfaces. */
export function BrandLogoHomeLink ({
  children,
  isPreview,
  className,
  ariaLabel,
}: {
  children: ReactNode
  isPreview?: boolean
  className?: string
  ariaLabel?: string
}) {
  const publicSite = usePublicSiteContext()
  if (!publicSite) return <>{children}</>

  return (
    <SectionLink
      link="/"
      isPreview={isPreview}
      className={className ?? "inline-flex shrink-0 text-inherit no-underline"}
      aria-label={ariaLabel ?? `${publicSite.projectName ?? "Home"} home`}
    >
      {children}
    </SectionLink>
  )
}

interface BrandLogoProps {
  instanceId: string
  logoText: string
  isPreview?: boolean
  size?: number
  /** Show wordmark (text) next to mark */
  withWordmark?: boolean
  /** Apply gradient to wordmark text */
  gradientWordmark?: boolean
}

/**
 * Renders the project logo image when set on the project, otherwise falls
 * back to the editable wordmark + decorative initial mark. Reads the project
 * logo from the public-site context (published view) or the builder store
 * (canvas/preview) so the same component drives both.
 */
export function BrandLogo({
  instanceId,
  logoText,
  isPreview,
  size = 28,
  withWordmark = true,
  gradientWordmark = false,
}: BrandLogoProps) {
  const publicSite = usePublicSiteContext()
  const storeLogoUrl = useBuilderStore((s) => s.projectLogoUrl)
  const storeProjectName = useBuilderStore((s) => s.projectName)
  const logoUrl = publicSite?.projectLogoUrl ?? storeLogoUrl ?? null
  const projectName = publicSite?.projectName ?? storeProjectName ?? logoText

  const initial = (projectName || logoText || "V").trim().charAt(0).toUpperCase() || "V"

  const logoContent = logoUrl ? (
    <span className="inline-flex items-center text-foreground">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={logoUrl}
        alt={projectName}
        style={{ height: size, width: "auto", maxWidth: size * 6 }}
        className="object-contain"
      />
    </span>
  ) : (
    <span className="inline-flex items-center gap-2.5 text-foreground">
      <span
        className="shrink-0 inline-flex items-center justify-center text-white font-extrabold"
        style={{
          width: size,
          height: size,
          borderRadius: 'var(--radius)',
          background:
            "linear-gradient(135deg, var(--primary) 0%, color-mix(in oklch, var(--primary) 65%, black) 100%)",
          fontSize: size * 0.55,
          letterSpacing: "-0.04em",
          boxShadow:
            "0 6px 16px -4px color-mix(in oklch, var(--primary) 45%, transparent), inset 0 1px 0 rgb(255 255 255 / 0.25)",
        }}
        aria-hidden
      >
        {initial}
      </span>
      {withWordmark && (
        <InlineEditableText
          as="span"
          data-element-id={`${instanceId}::logoText`}
          data-element-type="text"
          className="font-bold tracking-tight"
          style={{
            fontSize: size * 0.61,
            ...(gradientWordmark
              ? {
                  background: "linear-gradient(to right, #4C2CA0, #C76DF6)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }
              : {}),
          }}
          value={logoText}
          isPreview={isPreview}
          onChange={(t) =>
            useBuilderStore.getState().updateSectionProps(instanceId, { logoText: t })
          }
          onCommit={(t) =>
            useBuilderStore.getState().updateSectionProps(instanceId, { logoText: t })
          }
        />
      )}
    </span>
  )

  return (
    <BrandLogoHomeLink isPreview={isPreview}>
      {logoContent}
    </BrandLogoHomeLink>
  )
}
