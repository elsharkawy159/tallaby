"use client"

import {
  memo,
  useCallback,
  useMemo,
  useState,
  type ReactElement,
  type ReactNode,
} from "react"
import { useStore } from "zustand"
import { Link, useRouter } from "@/i18n/navigation"
import {
  AlertCircle,
  Check,
  ChevronLeft,
  Grid3x3,
  Laptop,
  Loader2,
  Redo2,
  RotateCcw,
  Smartphone,
  Tablet,
  Undo2,
  Eye,
  EyeOff,
  ExternalLink,
  ChevronsUpDown,
  Wand2,
  PenLine,
  Sparkles,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@workspace/ui/components/button"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@workspace/ui/components/toggle-group"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import { useBuilderStore, type DeviceMode } from "@/lib/builder/store"
import { normalizePageContent } from "@/lib/builder/normalize-page-content"
import { publishWebsite, unpublishWebsite } from "@/actions/website-actions"
import { isWebsiteLive, isWebsiteSuspended, type WebsiteStatus } from "@/lib/builder/website-status"
import { AddPageDialog } from "@/components/website/add-page-dialog"
import { ThemeToggle } from "@/components/navigation/theme-toggle"
import { cn } from "@workspace/ui/lib/utils"
import { flushBuilderAutosave } from "@/components/website-builder/use-builder-autosave"
import { SaveTemplateDialog } from "@/components/website-builder/save-template-dialog"
import { PublishTemplateVersionButton } from "@/components/website-builder/publish-template-version-button"
import { GenerateThumbnailButton } from "@/components/website-builder/generate-thumbnail-button"
import { TranslateToArabicButton } from "@/components/website-builder/translate-to-arabic-button"
import { BuilderHelpButton } from "@/components/website-builder/builder-help-button"
import { hasUnpublishedSiteChanges } from "@/lib/builder/has-unpublished-changes"
import { getLiveSiteHost, getLiveSiteUrl } from "@/lib/builder/live-site-url"
import type { PageContent } from "@/components/sections/registry.types"
import { Badge } from "@workspace/ui/components/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@workspace/ui/components/alert-dialog"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip"

const iconButtonClass = "size-9 shrink-0"

function NavbarDivider () {
  return (
    <div
      className="mx-0.5 hidden h-5 w-px shrink-0 bg-border sm:mx-1 md:block"
      aria-hidden
    />
  )
}

function NavbarToolGroup ({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn("flex items-center gap-0.5", className)}>
      {children}
    </div>
  )
}

function NavbarIconTip ({
  label,
  children,
  side = "bottom",
}: {
  label: string
  children: ReactElement
  side?: "top" | "bottom" | "left" | "right"
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side={side}>
        {label}
      </TooltipContent>
    </Tooltip>
  )
}

function clonePageContent (content: PageContent): PageContent {
  return JSON.parse(JSON.stringify(content)) as PageContent
}

function syncAllPagesPublishedFromStore () {
  const store = useBuilderStore.getState()
  for (const p of store.pages) {
    const draft =
      p.id === store.pageId ? store.getPageContent() : p.draftContent
    store.patchWebsitePageRow(p.id, {
      status: "published",
      publishedContent: clonePageContent(draft),
    })
  }
  store.syncPublishedFromCanvas()
  store.markClean()
}

type SitePublishLoading = "publish" | "unpublish" | "update" | null

type Props = {
  locale: string
  websiteId: string
  projectId: string
  initialWebsiteStatus: WebsiteStatus
  subdomain: string | null
  /** Edit builder vs AI builder — affects nav links and optional controls */
  mode?: "edit" | "ai"
  defaultIndustry?: string | null
  /** Set when this website is a Template Studio source, not a real user's site. */
  templateMode?: { templateId: string | null } | null
}

const SaveStatusIndicator = memo(function SaveStatusIndicator() {
  const saveStatus = useBuilderStore((s) => s.saveStatus)
  const isDirty = useBuilderStore((s) => s.isDirty)

  if (saveStatus === "saving") {
    return (
      <div
        className="flex items-center gap-1 text-xs text-muted-foreground"
        role="status"
        aria-live="polite"
      >
        <Loader2 className="size-3.5 shrink-0 animate-spin" aria-hidden />
        <span className="hidden sm:inline">Saving…</span>
      </div>
    )
  }
  if (saveStatus === "error") {
    return (
      <div
        className="flex items-center gap-1 text-xs text-destructive"
        role="status"
        aria-live="assertive"
      >
        <AlertCircle className="size-3.5 shrink-0" aria-hidden />
        <span className="hidden sm:inline">Save failed</span>
      </div>
    )
  }
  if (isDirty) {
    return (
      <span className="text-xs text-amber-600 dark:text-amber-500">
        <span className="hidden sm:inline">Unsaved changes</span>
        <span className="sm:hidden" aria-label="Unsaved changes">•</span>
      </span>
    )
  }
  if (saveStatus === "saved") {
    return (
      <div
        className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-500"
        role="status"
        aria-live="polite"
      >
        <Check className="size-3.5 shrink-0" aria-hidden />
        <span className="hidden sm:inline">Saved</span>
      </div>
    )
  }
  return null
})

export function BuilderNavbar({
  locale,
  websiteId,
  projectId,
  initialWebsiteStatus,
  subdomain,
  mode = "edit",
  defaultIndustry = null,
  templateMode = null,
}: Props) {
  const projectName = useBuilderStore((s) => s.projectName)
  const isAiMode = mode === "ai"
  const builderBase = isAiMode
    ? `/website-builder/ai/${websiteId}`
    : `/website-builder/edit/${websiteId}`
  const router = useRouter()
  const canvasPreview = useBuilderStore((s) => s.canvasPreview)
  const setCanvasPreview = useBuilderStore((s) => s.setCanvasPreview)
  const showGridOverlay = useBuilderStore((s) => s.showGridOverlay)
  const setShowGridOverlay = useBuilderStore((s) => s.setShowGridOverlay)
  const autoFillNewSectionsWithAi = useBuilderStore((s) => s.autoFillNewSectionsWithAi)
  const setAutoFillNewSectionsWithAi = useBuilderStore((s) => s.setAutoFillNewSectionsWithAi)
  const [siteStatus, setSiteStatus] = useState<WebsiteStatus>(initialWebsiteStatus)
  const siteIsPublished = isWebsiteLive(siteStatus)
  const siteIsSuspended = isWebsiteSuspended(siteStatus)
  const [siteActionLoading, setSiteActionLoading] = useState<SitePublishLoading>(null)
  const [newPageOpen, setNewPageOpen] = useState(false)
  const [restoreLiveOpen, setRestoreLiveOpen] = useState(false)
  const deviceMode = useBuilderStore((s) => s.deviceMode)
  const pages = useBuilderStore((s) => s.pages)
  const activePageId = useBuilderStore((s) => s.activePageId)
  const setDeviceMode = useBuilderStore((s) => s.setDeviceMode)
  const hasUnpublishedChanges = useBuilderStore(
    (s) =>
      hasUnpublishedSiteChanges({
        pageId: s.pageId,
        sections: s.sections,
        elementStyles: s.elementStyles,
        elementAttributes: s.elementAttributes,
        publishedContent: s.publishedContent,
        pages: s.pages,
        sharedHeader: s.sharedHeader,
        sharedFooter: s.sharedFooter,
      })
  )
  const publishedContent = useBuilderStore((s) => s.publishedContent)
  const restoreDraftFromPublished = useBuilderStore((s) => s.restoreDraftFromPublished)
  const canRestoreFromLive = Boolean(publishedContent?.sections?.length)
  const temporal = useBuilderStore.temporal

  const liveSiteHost = getLiveSiteHost(subdomain)
  const liveSiteUrl = getLiveSiteUrl(subdomain)

  const siteLiveToast = (message: string) => {
    if (liveSiteHost && liveSiteUrl) {
      toast.success(message, {
        description: liveSiteHost,
        action: {
          label: "Open site",
          onClick: () =>
            window.open(liveSiteUrl, "_blank", "noopener,noreferrer"),
        },
      })
    } else {
      toast.success(message)
    }
  }

  const publishSuccessToast = () => siteLiveToast("Website published")
  const updateSuccessToast = () => siteLiveToast("Live site updated")

  const undo = useCallback(() => {
    temporal.getState().undo()
  }, [temporal])

  const redo = useCallback(() => {
    temporal.getState().redo()
  }, [temporal])

  const canUndo = useStore(temporal, (s) => s.pastStates.length > 0)
  const canRedo = useStore(temporal, (s) => s.futureStates.length > 0)

  const activePage = useMemo(
    () => pages.find((p) => p.id === activePageId),
    [pages, activePageId]
  )
  const previewUrl = useMemo(() => {
    const slug = activePage?.slug
    if (!slug) return null
    return `/website-builder/preview/${websiteId}/${encodeURIComponent(slug)}`
  }, [websiteId, activePage?.slug])

  const handlePublish = () => {
    setSiteActionLoading("publish")
    void (async () => {
      try {
        const result = await publishWebsite(projectId)
        if (!result.ok) {
          toast.error(result.error)
          return
        }
        setSiteStatus('published')
        syncAllPagesPublishedFromStore()
        publishSuccessToast()
      } catch (err) {
        const msg =
          err instanceof Error
            ? err.message
            : "Publish failed — please try again"
        toast.error(msg)
      } finally {
        setSiteActionLoading(null)
      }
    })()
  }

  const handleUpdateLiveSite = () => {
    setSiteActionLoading("update")
    void (async () => {
      try {
        const flushed = await flushBuilderAutosave()
        if (!flushed) {
          toast.error("Could not save your changes", {
            description:
              "Resolve save errors before pushing updates to the live site.",
          })
          return
        }
        const result = await publishWebsite(projectId)
        if (!result.ok) {
          toast.error(result.error)
          return
        }
        syncAllPagesPublishedFromStore()
        updateSuccessToast()
      } catch (err) {
        const msg =
          err instanceof Error
            ? err.message
            : "Update failed — please try again"
        toast.error(msg)
      } finally {
        setSiteActionLoading(null)
      }
    })()
  }

  const handleUnpublish = () => {
    setSiteActionLoading("unpublish")
    void (async () => {
      try {
        await unpublishWebsite(projectId)
        setSiteStatus('draft')
        toast.success("Website unpublished")
      } catch (err) {
        const msg =
          err instanceof Error
            ? err.message
            : "Unpublish failed — please try again"
        toast.error(msg)
      } finally {
        setSiteActionLoading(null)
      }
    })()
  }

  const handleRestoreFromLive = () => {
    const restored = restoreDraftFromPublished()
    if (!restored) {
      toast.error("Nothing to restore", {
        description: "This page has not been published yet.",
      })
      return
    }
    useBuilderStore.temporal.getState().clear()
    setRestoreLiveOpen(false)
    toast.success("Draft restored from live site", {
      description: "Your unsaved draft changes were replaced with the published version.",
    })
  }

  const handlePageCreated = useCallback((page: {
    id: string; websiteId: string; projectId: string
    name: Record<string, string>; slug: string; isHome: boolean
    locale: string; orderIndex: number; status: string; version: number
    draftContent: unknown; publishedContent: unknown | null
    useSharedHeader: boolean; useSharedFooter: boolean
  }) => {
    useBuilderStore.getState().addPage({
      id: page.id,
      websiteId: page.websiteId,
      projectId: page.projectId,
      name: page.name,
      slug: page.slug,
      isHome: page.isHome,
      locale: page.locale,
      orderIndex: page.orderIndex,
      status: page.status,
      version: page.version,
      useSharedHeader: page.useSharedHeader,
      useSharedFooter: page.useSharedFooter,
      draftContent: normalizePageContent(page.draftContent),
      publishedContent: page.publishedContent
        ? normalizePageContent(page.publishedContent)
        : null,
    })
    useBuilderStore.temporal.getState().clear()
  }, [])

  const switchPage = useBuilderStore((s) => s.switchPage)

  const goToPage = useCallback(
    (id: string) => {
      switchPage(id)
      const slug = pages.find((p) => p.id === id)?.slug
      if (slug) {
        router.replace(
          `${builderBase}?page=${encodeURIComponent(slug)}`
        )
      }
    },
    [pages, router, switchPage, builderBase]
  )

  return (
    <>
      <TooltipProvider delayDuration={300}>
        <header className="relative flex h-12 shrink-0 items-center border-b border-border bg-background px-2 sm:px-3">
          {/* Left zone — navigation & page context */}
          <div className="flex min-w-0 flex-1 items-center justify-start gap-0.5 pe-[7.5rem] sm:gap-1 sm:pe-32">
            <NavbarIconTip label="Back to projects">
              <Button
                variant="ghost"
                size="icon"
                className={iconButtonClass}
                asChild
              >
                <Link href="/projects" aria-label="Back to projects">
                  <ChevronLeft className="size-4 rtl:rotate-180" />
                </Link>
              </Button>
            </NavbarIconTip>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 max-w-[140px] shrink-0 gap-1 truncate px-2 sm:max-w-[180px] sm:px-3"
                >
                  <span className="truncate">
                    {activePage?.name?.[locale as "en" | "ar"] ??
                      activePage?.name?.en ??
                      activePage?.slug ??
                      "Page"}
                  </span>
                  <ChevronsUpDown className="size-3.5 shrink-0 opacity-60" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuLabel>Pages</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {pages.map((p) => (
                  <DropdownMenuItem
                    key={p.id}
                    onClick={() => goToPage(p.id)}
                    className={p.id === activePageId ? "bg-muted" : ""}
                  >
                    {p.name?.[locale as "en" | "ar"] ?? p.name?.en ?? p.slug}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={(e) => {
                    e.preventDefault()
                    setNewPageOpen(true)
                  }}
                >
                  New page…
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {isAiMode ? (
              <Badge
                variant="outline"
                className="ms-0.5 hidden h-7 border-violet-200 bg-violet-50 px-2 text-violet-600 sm:inline-flex dark:bg-violet-950/30"
              >
                AI
              </Badge>
            ) : null}

            {templateMode ? (
              <Badge
                variant="outline"
                className="ms-0.5 hidden h-7 border-amber-200 bg-amber-50 px-2 text-amber-700 sm:inline-flex dark:bg-amber-950/30 dark:text-amber-400"
              >
                Editing Template
              </Badge>
            ) : null}

            {!templateMode && siteIsPublished && liveSiteUrl && liveSiteHost ? (
              <>
                <NavbarDivider />
                <NavbarIconTip label={`Open ${liveSiteHost}`}>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(iconButtonClass, "lg:hidden")}
                    asChild
                  >
                    <a
                      href={liveSiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Open ${liveSiteHost}`}
                    >
                      <ExternalLink className="size-4" />
                    </a>
                  </Button>
                </NavbarIconTip>
                <Button
                  variant="ghost"
                  size="sm"
                  className="hidden h-9 max-w-[160px] shrink-0 gap-1.5 px-2 lg:inline-flex xl:max-w-[200px]"
                  asChild
                >
                  <a
                    href={liveSiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <span className="truncate">{liveSiteHost}</span>
                    <ExternalLink className="size-3.5 shrink-0 opacity-70" />
                  </a>
                </Button>
              </>
            ) : null}
          </div>

          {/* Center — viewport controls (always centered) */}
          <div className="pointer-events-none absolute start-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2">
            <NavbarToolGroup className="pointer-events-auto rounded-md border border-border bg-background p-0.5 shadow-sm">
              <ToggleGroup
                type="single"
                variant="outline"
                value={deviceMode}
                onValueChange={(v) => {
                  if (v) setDeviceMode(v as DeviceMode)
                }}
                className="gap-0 border-0 bg-transparent shadow-none"
              >
                <ToggleGroupItem
                  value="desktop"
                  aria-label="Desktop view"
                  size="sm"
                  className="size-8 border-0 px-0 data-[state=on]:bg-muted"
                >
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="flex size-full items-center justify-center">
                        <Laptop className="size-4" />
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      Desktop view
                    </TooltipContent>
                  </Tooltip>
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="tablet"
                  aria-label="Tablet view"
                  size="sm"
                  className="size-8 border-0 px-0 data-[state=on]:bg-muted"
                >
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="flex size-full items-center justify-center">
                        <Tablet className="size-4" />
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      Tablet view
                    </TooltipContent>
                  </Tooltip>
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="mobile"
                  aria-label="Mobile view"
                  size="sm"
                  className="size-8 border-0 px-0 data-[state=on]:bg-muted"
                >
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="flex size-full items-center justify-center">
                        <Smartphone className="size-4" />
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      Mobile view
                    </TooltipContent>
                  </Tooltip>
                </ToggleGroupItem>
              </ToggleGroup>
            </NavbarToolGroup>
          </div>

          {/* Right zone — editing tools & publish */}
          <div className="flex min-w-0 flex-1 items-center justify-end gap-0.5 ps-[7.5rem] sm:gap-1 sm:ps-32">
            <NavbarToolGroup>
              <NavbarIconTip label="Undo">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className={iconButtonClass}
                  onClick={undo}
                  disabled={!canUndo}
                  aria-label="Undo"
                >
                  <Undo2 className="size-4" />
                </Button>
              </NavbarIconTip>
              <NavbarIconTip label="Redo">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className={iconButtonClass}
                  onClick={redo}
                  disabled={!canRedo}
                  aria-label="Redo"
                >
                  <Redo2 className="size-4" />
                </Button>
              </NavbarIconTip>
              {canRestoreFromLive ? (
                <NavbarIconTip label="Restore live site sections">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className={iconButtonClass}
                    onClick={() => setRestoreLiveOpen(true)}
                    aria-label="Restore live site sections"
                  >
                    <RotateCcw className="size-4" />
                  </Button>
                </NavbarIconTip>
              ) : null}
            </NavbarToolGroup>

            {!isAiMode ? (
              <>
                <NavbarDivider />
                <NavbarToolGroup>
                  <NavbarIconTip
                    label={showGridOverlay ? "Hide grid overlay" : "Show grid overlay"}
                  >
                    <Button
                      type="button"
                      variant={showGridOverlay ? "secondary" : "ghost"}
                      size="icon"
                      className={iconButtonClass}
                      onClick={() => setShowGridOverlay(!showGridOverlay)}
                      aria-label={
                        showGridOverlay ? "Hide grid overlay" : "Show grid overlay"
                      }
                      aria-pressed={showGridOverlay}
                    >
                      <Grid3x3 className="size-4" />
                    </Button>
                  </NavbarIconTip>
                  <NavbarIconTip
                    label={
                      autoFillNewSectionsWithAi
                        ? "Auto-fill new sections with AI"
                        : "Auto-fill new sections with AI is off"
                    }
                  >
                    <Button
                      type="button"
                      variant={autoFillNewSectionsWithAi ? "secondary" : "ghost"}
                      size="icon"
                      className={iconButtonClass}
                      onClick={() => setAutoFillNewSectionsWithAi(!autoFillNewSectionsWithAi)}
                      aria-label="Auto-fill new sections with AI"
                      aria-pressed={autoFillNewSectionsWithAi}
                    >
                      <Sparkles className="size-4" />
                    </Button>
                  </NavbarIconTip>
                  <NavbarIconTip
                    label={canvasPreview ? "Exit canvas preview" : "Canvas preview"}
                  >
                    <Button
                      type="button"
                      variant={canvasPreview ? "secondary" : "ghost"}
                      size="icon"
                      className={iconButtonClass}
                      onClick={() => setCanvasPreview(!canvasPreview)}
                      aria-label={canvasPreview ? "Exit canvas preview" : "Canvas preview"}
                      aria-pressed={canvasPreview}
                    >
                      {canvasPreview ? (
                        <EyeOff className="size-4" />
                      ) : (
                        <Eye className="size-4" />
                      )}
                    </Button>
                  </NavbarIconTip>
                  {previewUrl ? (
                    <NavbarIconTip label="Open preview in new tab">
                      <Button
                        variant="ghost"
                        size="icon"
                        className={iconButtonClass}
                        asChild
                      >
                        <a
                          href={previewUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label="Open preview in new tab"
                        >
                          <ExternalLink className="size-4" />
                        </a>
                      </Button>
                    </NavbarIconTip>
                  ) : null}
                </NavbarToolGroup>
              </>
            ) : null}

            <NavbarDivider />
            <BuilderHelpButton />
            <NavbarIconTip label="Toggle theme">
              <ThemeToggle />
            </NavbarIconTip>

            <NavbarDivider />

            {isAiMode ? (
              <>
                <NavbarIconTip label="Edit builder">
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(iconButtonClass, "sm:hidden")}
                    onClick={() =>
                      router.push(
                        `/website-builder/edit/${websiteId}?page=${encodeURIComponent(activePage?.slug ?? "home")}`
                      )
                    }
                    aria-label="Edit builder"
                  >
                    <PenLine className="size-4" />
                  </Button>
                </NavbarIconTip>
                <Button
                  variant="outline"
                  size="sm"
                  className="hidden h-9 shrink-0 sm:inline-flex"
                  onClick={() =>
                    router.push(
                      `/website-builder/edit/${websiteId}?page=${encodeURIComponent(activePage?.slug ?? "home")}`
                    )
                  }
                >
                  Edit builder
                </Button>
              </>
            ) : (
              <>
                <NavbarIconTip label="Build with AI">
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      iconButtonClass,
                      "text-violet-600 hover:bg-violet-50 hover:text-violet-700 dark:hover:bg-violet-950/30 sm:hidden"
                    )}
                    onClick={() =>
                      router.push(
                        `/website-builder/ai/${websiteId}?page=${encodeURIComponent(activePage?.slug ?? "home")}`
                      )
                    }
                    aria-label="Build with AI"
                  >
                    <Wand2 className="size-4" />
                  </Button>
                </NavbarIconTip>
                <Button
                  variant="outline"
                  size="sm"
                  className="hidden h-9 shrink-0 gap-1.5 text-violet-600 border-violet-200 hover:bg-violet-50 hover:text-violet-700 dark:border-violet-800 dark:hover:bg-violet-950/30 sm:inline-flex"
                  onClick={() =>
                    router.push(
                      `/website-builder/ai/${websiteId}?page=${encodeURIComponent(activePage?.slug ?? "home")}`
                    )
                  }
                >
                  <Wand2 className="size-3.5" />
                  Build with AI
                </Button>
              </>
            )}

            {!templateMode ? (
              <SaveTemplateDialog
                locale={locale}
                projectId={projectId}
                defaultIndustry={defaultIndustry}
                iconOnly
              />
            ) : null}

            <NavbarDivider />

            <div className="hidden min-w-[4.5rem] sm:block">
              <SaveStatusIndicator />
            </div>

            {templateMode ? (
              <div className="flex items-center gap-2">
                <TranslateToArabicButton projectId={projectId} />
                {templateMode.templateId ? (
                  <GenerateThumbnailButton templateId={templateMode.templateId} />
                ) : null}
                <PublishTemplateVersionButton
                  websiteId={websiteId}
                  templateId={templateMode.templateId}
                  projectName={projectName}
                  defaultIndustry={defaultIndustry}
                />
              </div>
            ) : siteIsSuspended ? (
              <Badge variant="destructive" className="hidden h-7 sm:inline-flex">
                Suspended
              </Badge>
            ) : siteIsPublished ? (
              <NavbarToolGroup>
                {hasUnpublishedChanges ? (
                  <Button
                    type="button"
                    variant="default"
                    size="sm"
                    className="h-9 shrink-0 px-3"
                    onClick={handleUpdateLiveSite}
                    disabled={siteActionLoading !== null}
                  >
                    {siteActionLoading === "update" ? (
                      <>
                        <Loader2 className="me-1.5 size-4 animate-spin" />
                        <span className="hidden sm:inline">Updating…</span>
                      </>
                    ) : (
                      "Update"
                    )}
                  </Button>
                ) : null}
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="hidden h-9 shrink-0 sm:inline-flex"
                  onClick={handleUnpublish}
                  disabled={siteActionLoading !== null}
                >
                  {siteActionLoading === "unpublish" ? (
                    <>
                      <Loader2 className="me-1.5 size-4 animate-spin" />
                      Unpublishing…
                    </>
                  ) : (
                    "Unpublish"
                  )}
                </Button>
              </NavbarToolGroup>
            ) : !siteIsSuspended ? (
              <Button
                type="button"
                variant="default"
                size="sm"
                className="h-9 shrink-0 px-3"
                onClick={handlePublish}
                disabled={siteActionLoading !== null}
              >
                {siteActionLoading === "publish" ? (
                  <>
                    <Loader2 className="me-1.5 size-4 animate-spin" />
                    <span className="hidden sm:inline">Publishing…</span>
                  </>
                ) : (
                  "Publish"
                )}
              </Button>
            ) : null}
          </div>
        </header>
      </TooltipProvider>

      <AddPageDialog
        open={newPageOpen}
        onOpenChange={setNewPageOpen}
        projectId={projectId}
        websiteId={websiteId}
        locale={locale}
        onCreated={handlePageCreated}
      />

      <AlertDialog open={restoreLiveOpen} onOpenChange={setRestoreLiveOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restore live site sections?</AlertDialogTitle>
            <AlertDialogDescription>
              This replaces your current draft with the published version on{' '}
              {liveSiteHost ?? 'your live site'}. Unsaved draft changes on this
              page will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRestoreFromLive}>
              Restore from live
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
