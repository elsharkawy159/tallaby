"use client"

import { useState, useRef, useEffect, useCallback, useMemo } from "react"
import { useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import {
  Send,
  Sparkles,
  Loader2,
  Wand2,
  User,
  Copy,
  Check,
  Layers,
  Plus,
  ArrowUpDown,
  Pencil,
  Trash2,
  RotateCcw,
  Image as ImageIcon,
  PenLine,
  Palette,
  LayoutGrid,
  Layout,
  Square,
  Paperclip,
  FileText,
  Clock,
  X,
  Database,
  Unplug,
  ShieldCheck,
  Globe,
  MessageSquare,
  PanelLeftClose,
  PanelLeftOpen,
  AtSign,
} from "lucide-react"
import { toast } from "sonner"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@workspace/ui/components/button"
import { Textarea } from "@workspace/ui/components/textarea"
import { ScrollArea } from "@workspace/ui/components/scroll-area"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import { cn } from "@/lib/utils"
import { ValorcyLogo } from "@workspace/ui/components/valorcy-logo"
import { PreviewFrame } from "@/components/website-builder/preview/preview-frame"
import { BuilderNavbar } from "@/components/website-builder/builder-navbar"
import type { WebsiteStatus } from "@/lib/builder/website-status"
import { useChat } from "@ai-sdk/react"
import {
  DefaultChatTransport,
  lastAssistantMessageIsCompleteWithToolCalls,
} from "ai"
import type { UIMessage } from "ai"
import {
  useBuilderStore,
  type DesignSystem,
  type WebsitePageRow,
} from "@/lib/builder/store"
import { normalizePageContent } from "@/lib/builder/normalize-page-content"
import { mapDbDesignSystemToBuilder } from "@/lib/builder/design-system-map"
import {
  useBuilderAutosave,
  flushBuilderAutosave,
} from "@/components/website-builder/use-builder-autosave"
import {
  applyAiToolCall,
  resolveSectionInstanceId,
} from "@/lib/ai/apply-ai-tool-call"
import {
  buildMentionOptions,
  checkToolScope,
  resolveMentionsFromText,
  removeMention,
  scopeFromMentions,
  singleTargetPageId,
  splitMentionSegments,
  type EditScope,
  type MentionRef,
  type ScopeCheckContext,
} from "@/lib/ai/mentions"
import { sectionRegistry } from "@/components/sections"
import { MentionTextarea } from "./mention-textarea"
import { SiteQaCard } from "./site-qa-card"
import type { SiteQaCheckId } from "@/lib/ai/site-qa"
import type { SectionAction } from "@/components/website-builder/preview/use-preview-bridge"
import { prepareSectionInstance } from "@/lib/builder/section-preparation"
import { collectPageImageUrls } from "@/lib/builder/page-image-urls"
import {
  applyAiToolCallAsync,
  ASYNC_CLIENT_TOOLS,
} from "@/lib/ai/apply-ai-tool-call-async"
import {
  formatSectionListing,
  formatLayoutContext,
} from "@/lib/ai/page-context"

// Tools whose `execute` runs on the server (results stream back automatically).
// Client onToolCall must NOT attempt to handle them — doing so would overwrite
// the server-produced output with a bogus "Unknown tool" error.
const SERVER_SIDE_TOOLS = new Set(["searchImages", "generateCopy"])

// Client tools that only read state — skip the autosave flush after them.
const READ_ONLY_TOOLS = new Set(["listPages", "readSharedLayout", "validatePage"])

/** Live-store resolvers for the @mention scope guard (lib/ai/mentions.ts). */
function buildScopeCheckContext(): ScopeCheckContext {
  const s = useBuilderStore.getState()
  const editable = [
    ...(s.sharedHeader ? [s.sharedHeader] : []),
    ...s.sections,
    ...(s.sharedFooter ? [s.sharedFooter] : []),
  ]
  return {
    activePageId: s.pageId ?? s.activePageId,
    resolveInstanceId: (attempted) =>
      resolveSectionInstanceId(editable, attempted)?.id ?? null,
    sharedSlotOf: (id) =>
      s.sharedHeader?.id === id
        ? "header"
        : s.sharedFooter?.id === id
          ? "footer"
          : null,
    resolvePageId: (value) =>
      s.pages.find((p) => p.id === value || p.slug === value)?.id ?? null,
  }
}

/** Current section listing of every page a turn mentions, for the prompt. */
function buildMentionContext(mentions: MentionRef[]): string {
  if (!mentions.length) return ""
  const s = useBuilderStore.getState()
  const activeId = s.pageId ?? s.activePageId
  const pageIds = [
    ...new Set(mentions.filter((m) => m.pageId).map((m) => m.pageId!)),
  ]
  return pageIds
    .map((id) => {
      const page = s.pages.find((p) => p.id === id)
      if (!page) return ""
      const sections =
        id === activeId ? s.sections : page.draftContent?.sections ?? []
      return `Page slug=${page.slug} (pageId=${page.id}${
        id === activeId ? ", open in the builder" : ""
      }):\n${formatSectionListing(sections)}`
    })
    .filter(Boolean)
    .join("\n\n")
}

function pageDisplayName(
  name: Record<string, string> | null | undefined,
  locale: string,
  fallback: string
): string {
  return name?.[locale] ?? name?.en ?? Object.values(name ?? {})[0] ?? fallback
}

/** User message text with @mentions rendered as inline chips. */
function MentionText({ text, mentions }: { text: string; mentions: MentionRef[] }) {
  return (
    <>
      {splitMentionSegments(text, mentions).map((segment, i) =>
        segment.mention ? (
          <span
            key={i}
            className="rounded bg-primary-foreground/15 px-1 font-medium"
          >
            {segment.text}
          </span>
        ) : (
          <span key={i}>{segment.text}</span>
        )
      )}
    </>
  )
}
import { buildElementContext } from "@/lib/ai/element-context"
import { PROMPT_TEMPLATES, getQuickReplies } from "@/lib/ai/prompt-templates"
import {
  getOrCreateAiConversation,
  createAiConversation,
  listAiMessages,
  getAiChatCreditInfo,
  type AiChatCreditInfo,
} from "@/actions/ai-conversation-actions"
import { AiChatHistory } from "./ai-chat-history"
import { WebsiteOverview } from "./website-overview"
import { AiMessageMarkdown } from "./ai-message-markdown"
import { ToolPartsScroll } from "./tool-parts-scroll"
import { AiCreditBadge } from "./ai-credit-badge"
import {
  AiChatNotice,
  classifyChatError,
  type ChatNotice,
} from "./ai-chat-notice"
import {
  restoreChatMessagesFromDb,
  dedupeMessages,
  normalizeMessagesForDisplay,
} from "@/lib/ai/restore-chat-messages"
import {
  getAssistantText,
  hasVisibleAssistantContent,
  synthesizeToolSummary,
} from "@/lib/ai/ai-chat-summary"
import { uploadMediaAsset } from "@/actions/media-actions"
import {
  queueEnrichment,
  hasQueuedEnrichment,
  isEnrichmentRunning,
  runQueuedEnrichment,
  type EnrichmentTask,
  type EnrichmentPhase,
} from "@/lib/ai/section-enrichment-queue"
import { EnrichmentProgress } from "./enrichment-progress"
import { scrollPreviewToSection } from "@/lib/builder/scroll-preview-to-section"

export type AiProjectContext = {
  name?: string | null
  slug?: string | null
  description?: string | null
  onboardingBrief?: string | null
  industry?: string | null
  locale?: string | null
  supportedLocales?: string[] | null
  logoUrl?: string | null
  faviconUrl?: string | null
}

type PageProp = {
  id: string
  websiteId: string
  projectId: string
  name: Record<string, string>
  slug: string
  isHome: boolean
  locale: string
  orderIndex: number
  status: string
  version: number
  draftContent: unknown
  publishedContent: unknown | null
  useSharedHeader?: boolean
  useSharedFooter?: boolean
}

export type AiBuilderProps = {
  locale: string
  websiteId: string
  projectId: string
  projectName: string
  projectSlug: string
  projectContext?: AiProjectContext
  /** Resolved Business Kit id for industry-specific section defaults. */
  kitId?: string | null
  initialPageSlug?: string
  initialWebsiteStatus?: WebsiteStatus
  subdomain?: string | null
  sharedHeader?: unknown
  sharedFooter?: unknown
  designSystemRow: {
    colors: unknown
    typography: unknown
    spacing: unknown
    customCss: string | null
    version: number | null
  } | null
  pages: PageProp[]
  userAvatarUrl?: string | null
  userName?: string | null
  /** Open on the single-page preview or the all-pages overview (`?view=overview`). */
  initialView?: AiBuilderView
  /** Generation whose final QA report the overview shows (`?run=`). */
  qaRunId?: string
}

export type AiBuilderView = "page" | "overview"

type ToolLabelFn = (input: Record<string, unknown>, output?: unknown) => string
type ToolLabelDef = {
  icon: React.ElementType
  /** Past-tense label for completed calls */
  done: ToolLabelFn
  /** Present-progressive label while running */
  running: ToolLabelFn
  /** Optional one-line detail line shown under the title */
  detail?: ToolLabelFn
}

/** Translator scoped to `aiBuilder.toolLabels`, built once per render inside
 * `ToolCallBadge` — this is a plain object (not a component), so it can't
 * call `useTranslations` itself. */
function buildToolLabels(
  t: ReturnType<typeof useTranslations<"aiBuilder.toolLabels">>
): Record<string, ToolLabelDef> {
  return {
    addSection: {
      icon: Plus,
      running: (i) =>
        t("addSectionRunning", { sectionId: String(i.sectionId) }),
      done: (i) => t("addSectionDone", { sectionId: String(i.sectionId) }),
    },
    replacePage: {
      icon: Layers,
      running: (i) =>
        t("replacePageRunning", {
          count: Array.isArray(i.sectionIds)
            ? (i.sectionIds as unknown[]).length
            : 0,
        }),
      done: () => t("replacePageDone"),
    },
    applyRecipe: {
      icon: Sparkles,
      running: (i) =>
        t("applyRecipeRunning", { recipeKey: String(i.recipeKey) }),
      done: (i) => t("applyRecipeDone", { recipeKey: String(i.recipeKey) }),
    },
    createPage: {
      icon: Plus,
      running: (i) => t("createPageRunning", { name: String(i.name ?? "") }),
      done: (i) => t("createPageDone", { name: String(i.name ?? "") }),
    },
    renamePage: {
      icon: Pencil,
      running: () => t("renamePageRunning"),
      done: (i) => t("renamePageDone", { name: String(i.name ?? "") }),
    },
    deletePage: {
      icon: Trash2,
      running: () => t("deletePageRunning"),
      done: () => t("deletePageDone"),
    },
    reorderPages: {
      icon: ArrowUpDown,
      running: () => t("reorderPagesRunning"),
      done: () => t("reorderPagesDone"),
    },
    reorderSections: {
      icon: ArrowUpDown,
      running: (i) =>
        t("reorderSectionsRunning", {
          from: String(i.fromIndex),
          to: String(i.toIndex),
        }),
      done: (i) =>
        t("reorderSectionsDone", {
          from: String(i.fromIndex),
          to: String(i.toIndex),
        }),
    },
    updateSectionProps: {
      icon: Pencil,
      running: () => t("updateSectionPropsRunning"),
      done: () => t("updateSectionPropsDone"),
    },
    regenerateSection: {
      icon: RotateCcw,
      running: () => t("regenerateSectionRunning"),
      done: () => t("regenerateSectionDone"),
    },
    deleteSection: {
      icon: Trash2,
      running: () => t("deleteSectionRunning"),
      done: () => t("deleteSectionDone"),
    },
    updateDesignTokens: {
      icon: Palette,
      running: () => t("updateDesignTokensRunning"),
      done: () => t("updateDesignTokensDone"),
    },
    generateCustomSection: {
      icon: Wand2,
      running: () => t("generateCustomSectionRunning"),
      done: () => t("generateCustomSectionDone"),
    },
    setElementStyle: {
      icon: Pencil,
      running: () => t("setElementStyleRunning"),
      done: (i) => {
        const styles = (i.styles ?? {}) as Record<string, string>
        const keys = Object.keys(styles)
        return keys.length
          ? t("setElementStyleDoneWithKeys", {
              keys: `${keys.slice(0, 3).join(", ")}${keys.length > 3 ? "…" : ""}`,
            })
          : t("setElementStyleDone")
      },
    },
    setSectionLayout: {
      icon: LayoutGrid,
      running: () => t("setSectionLayoutRunning"),
      done: () => t("setSectionLayoutDone"),
    },
    batchSetElementStyles: {
      icon: Layout,
      running: (i) =>
        t("batchSetElementStylesRunning", {
          count: Array.isArray(i.patches) ? (i.patches as unknown[]).length : 0,
        }),
      done: (i) =>
        t("batchSetElementStylesDone", {
          count: Array.isArray(i.patches) ? (i.patches as unknown[]).length : 0,
        }),
    },
    hideElement: {
      icon: Trash2,
      running: () => t("hideElementRunning"),
      done: () => t("hideElementDone"),
    },
    listPages: {
      icon: Layers,
      running: () => t("listPagesRunning"),
      done: () => t("listPagesDone"),
    },
    switchToPage: {
      icon: Layout,
      running: (i) =>
        t("switchToPageRunning", { slug: String(i.pageId ?? "") }),
      done: (i) => t("switchToPageDone", { slug: String(i.pageId ?? "") }),
    },
    readSharedLayout: {
      icon: Layout,
      running: () => t("readSharedLayoutRunning"),
      done: () => t("readSharedLayoutDone"),
    },
    updateSharedSection: {
      icon: Layout,
      running: (i) =>
        i.slot === "footer"
          ? t("updateSharedFooterRunning")
          : t("updateSharedHeaderRunning"),
      done: (i) =>
        i.slot === "footer"
          ? t("updateSharedFooterDone")
          : t("updateSharedHeaderDone"),
    },
    replaceSharedSection: {
      icon: Layout,
      running: (i) =>
        i.slot === "footer"
          ? t("replaceSharedFooterRunning")
          : t("replaceSharedHeaderRunning"),
      done: (i) =>
        i.slot === "footer"
          ? t("replaceSharedFooterDone")
          : t("replaceSharedHeaderDone"),
    },
    duplicateSection: {
      icon: Copy,
      running: () => t("duplicateSectionRunning"),
      done: () => t("duplicateSectionDone"),
    },
    connectSectionToCollection: {
      icon: Database,
      running: () => t("connectSectionToCollectionRunning"),
      done: (_i, output) => {
        const name = (output as { data?: { collectionName?: string } } | undefined)
          ?.data?.collectionName
        return name
          ? t("connectSectionToCollectionDoneNamed", { name })
          : t("connectSectionToCollectionDone")
      },
    },
    disconnectSectionFromCollection: {
      icon: Unplug,
      running: () => t("disconnectSectionFromCollectionRunning"),
      done: () => t("disconnectSectionFromCollectionDone"),
    },
    rewriteSection: {
      icon: PenLine,
      running: () => t("rewriteSectionRunning"),
      done: () => t("rewriteSectionDone"),
    },
    findImages: {
      icon: ImageIcon,
      running: () => t("findImagesRunning"),
      done: () => t("findImagesDone"),
    },
    updateSeo: {
      icon: Globe,
      running: () => t("updateSeoRunning"),
      done: () => t("updateSeoDone"),
    },
    validatePage: {
      icon: ShieldCheck,
      running: () => t("validatePageRunning"),
      done: (_i, output) => {
        const issues = (output as { data?: { issues?: unknown[] } } | undefined)
          ?.data?.issues
        const count = Array.isArray(issues) ? issues.length : 0
        return count > 0
          ? t("validatePageDoneIssues", { count })
          : t("validatePageDoneClean")
      },
    },
    searchImages: {
      icon: ImageIcon,
      running: (i) =>
        t("searchImagesRunning", {
          query: String(i.industry ?? i.query ?? ""),
        }),
      done: (_i, output) => {
        const o = output as { images?: unknown[] } | undefined
        const n = Array.isArray(o?.images) ? o!.images.length : 0
        return n > 0
          ? t("searchImagesDoneFound", { count: n })
          : t("searchImagesDoneNone")
      },
      detail: (i) => {
        const ind = i.industry
          ? t("detailIndustry", { value: String(i.industry) })
          : ""
        const q = i.query ? t("detailQuery", { value: String(i.query) }) : ""
        return [ind, q].filter(Boolean).join(" · ")
      },
    },
    generateCopy: {
      icon: PenLine,
      running: (i) =>
        t("generateCopyRunning", {
          kind: String(i.kind ?? t("defaultKind")),
          industry: String(i.industry ?? t("defaultIndustry")),
        }),
      done: (i) =>
        t("generateCopyDone", { kind: String(i.kind ?? t("defaultKind")) }),
      detail: (i) => {
        const parts: string[] = []
        if (i.industry) parts.push(String(i.industry))
        if (i.tone) parts.push(t("detailTone", { value: String(i.tone) }))
        return parts.join(" · ")
      },
    },
  }
}

type ToolPartState =
  | "input-streaming"
  | "input-available"
  | "output-available"
  | "output-error"

const STALE_TOOL_ERROR = "interrupted"
const STREAM_WATCHDOG_MS = 90_000
const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024
const ACCEPTED_ATTACHMENT_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
])

type ChatAttachment = {
  id: string
  name: string
  mimeType: string
  previewUrl: string
  status: "uploading" | "ready" | "error"
  url?: string
}

function ToolCallBadge({
  toolName,
  input,
  output,
  state,
  errorText,
  staleLabel,
}: {
  toolName: string
  input: Record<string, unknown>
  output?: unknown
  state?: ToolPartState
  errorText?: string
  staleLabel: string
}) {
  const t = useTranslations("aiBuilder.toolLabels")
  const toolLabels = useMemo(() => buildToolLabels(t), [t])
  const def = toolLabels[toolName]
  if (!def) return null
  const Icon = def.icon
  const isStale = state === "output-error" && errorText === STALE_TOOL_ERROR
  const isRunning = state === "input-streaming" || state === "input-available"
  const isError = state === "output-error" && !isStale
  const label = isStale
    ? staleLabel
    : isError
      ? t("failed", { reason: errorText ?? toolName })
      : isRunning
        ? def.running(input, output)
        : def.done(input, output)
  const detail =
    !isRunning && !isError && !isStale ? def.detail?.(input, output) : undefined

  return (
    <div
      className={cn(
        "flex w-full flex-col leading-tight",
        isError
          ? "text-rose-500/80"
          : isStale
            ? "text-muted-foreground/60"
            : isRunning
              ? "text-violet-600/80 dark:text-violet-300/80"
              : "text-muted-foreground/70"
      )}
    >
      <div className="flex items-start gap-1.5 text-[10px]">
        {isRunning ? (
          <Loader2 className="mt-0.5 size-2.5 shrink-0 animate-spin" />
        ) : isStale ? (
          <Clock className="mt-0.5 size-2.5 shrink-0 opacity-60" />
        ) : (
          <Icon className="mt-0.5 size-2.5 shrink-0 opacity-70" />
        )}
        {isError ? (
          <div className="min-w-0 flex-1">
            <span className="font-medium">Failed</span>
            <p className="mt-0.5 whitespace-pre-wrap break-words leading-snug">
              {errorText ?? toolName}
            </p>
          </div>
        ) : (
          <span className="truncate">{label}</span>
        )}
        {!isRunning && !isError && !isStale && (
          <Check className="size-2.5 shrink-0 text-emerald-500/70" />
        )}
      </div>
      {detail && (
        <div className="ms-[14px] truncate text-[9px] opacity-70">{detail}</div>
      )}
    </div>
  )
}

function getUserInitials(name: string | null | undefined): string {
  if (!name) return ""
  return name
    .split(/\s+/)
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase()
}

function ValorcyMarkAvatar() {
  return (
    <div className="flex size-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-violet-500/10">
      <ValorcyLogo variant="mark" alt="Valorcy" />
    </div>
  )
}

function UserAvatar({
  avatarUrl,
  name,
}: {
  avatarUrl?: string | null
  name?: string | null
}) {
  const initials = getUserInitials(name)

  if (avatarUrl) {
    return (
      <div className="flex size-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={avatarUrl}
          alt={name ?? "You"}
          className="size-full object-cover"
        />
      </div>
    )
  }

  if (initials) {
    return (
      <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
        {initials}
      </div>
    )
  }

  return (
    <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
      <User className="size-3.5" />
    </div>
  )
}

function MessageBubble({
  message,
  userAvatarUrl,
  userName,
  thoughtSeconds,
  isComplete,
}: {
  message: UIMessage
  userAvatarUrl?: string | null
  userName?: string | null
  thoughtSeconds?: number | null
  isComplete?: boolean
}) {
  const t = useTranslations("aiBuilder.toolLabels")
  const tStatus = useTranslations("aiBuilder.statusLabels")
  const [copied, setCopied] = useState(false)
  const isUser = message.role === "user"
  const toolLabels = useMemo(() => buildToolLabels(t), [t])

  function handleCopy() {
    const text = message.parts
      .filter((p) => p.type === "text")
      .map((p) => p.text)
      .join("")
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const toolParts = message.parts.filter(
    (p) => p.type.startsWith("tool-") && p.type !== "tool-call"
  )
  const fileParts = message.parts.filter((p) => p.type === "file")
  const textParts = message.parts.filter((p) => p.type === "text")
  const assistantText = getAssistantText(message)
  const summary =
    !isUser && isComplete && !assistantText
      ? synthesizeToolSummary(message, toolLabels)
      : null
  const hasContent =
    textParts.some((p) => p.text.trim()) ||
    toolParts.length > 0 ||
    fileParts.length > 0 ||
    Boolean(summary)
  if (!hasContent) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={cn("group flex items-end gap-2", isUser && "flex-row-reverse")}
    >
      {isUser ? (
        <UserAvatar avatarUrl={userAvatarUrl} name={userName} />
      ) : (
        <ValorcyMarkAvatar />
      )}
      <div
        className={cn(
          "relative flex w-full max-w-[85%] min-w-0 flex-col gap-1.5",
          isUser && "items-end"
        )}
      >
        {!isUser && thoughtSeconds != null && thoughtSeconds > 0 && (
          <p className="text-[10px] text-muted-foreground/70">
            {tStatus("thoughtFor", { seconds: thoughtSeconds })}
          </p>
        )}
        {fileParts.length > 0 && (
          <div
            className={cn("flex flex-wrap gap-1.5", isUser && "justify-end")}
          >
            {fileParts.map((part, i) => {
              const fp = part as {
                url?: string
                filename?: string
                mediaType?: string
              }
              const isImage = fp.mediaType?.startsWith("image/")
              const label = fp.filename ?? "Attachment"
              if (isImage && fp.url) {
                return (
                  <div
                    key={`file-${i}`}
                    className="overflow-hidden rounded-lg border border-border/40"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={fp.url}
                      alt={label}
                      className="size-16 object-cover"
                    />
                  </div>
                )
              }
              return (
                <div
                  key={`file-${i}`}
                  className="flex max-w-[180px] items-center gap-1.5 rounded-lg border border-border/40 bg-muted/50 px-2 py-1.5"
                >
                  <FileText className="size-3.5 shrink-0 text-muted-foreground" />
                  <span className="truncate text-[11px] text-muted-foreground">
                    {label}
                  </span>
                </div>
              )
            })}
          </div>
        )}
        {textParts.some((p) => p.text.trim()) && (
          <div
            className={cn(
              "min-w-0 rounded-2xl px-4 py-2.5 text-sm leading-relaxed [overflow-wrap:anywhere] break-words",
              isUser
                ? "rounded-ee-sm bg-primary text-primary-foreground"
                : "rounded-es-sm bg-muted text-foreground"
            )}
          >
            {isUser
              ? textParts.map((part, i) => (
                  <div key={i} className="whitespace-pre-wrap">
                    <MentionText
                      text={part.text}
                      mentions={
                        (message.metadata as { mentions?: MentionRef[] } | undefined)
                          ?.mentions ?? []
                      }
                    />
                  </div>
                ))
              : textParts.map((part, i) => (
                  <AiMessageMarkdown key={i} text={part.text} />
                ))}
          </div>
        )}
        {toolParts.length > 0 && (
          <ToolPartsScroll
            scrollKey={toolParts
              .map((part) => {
                const p = part as unknown as {
                  state?: ToolPartState
                  errorText?: string
                }
                return `${part.type}:${p.state ?? ""}:${p.errorText ?? ""}`
              })
              .join("|")}
          >
            {toolParts.map((part, i) => {
              const toolName = part.type.replace(/^tool-/, "")
              const p = part as unknown as {
                input?: Record<string, unknown>
                output?: unknown
                state?: ToolPartState
                errorText?: string
                toolCallId?: string
              }
              return (
                <ToolCallBadge
                  key={p.toolCallId ?? `${toolName}-${i}`}
                  toolName={toolName}
                  input={p.input ?? {}}
                  output={p.output}
                  state={p.state}
                  errorText={p.errorText}
                  staleLabel={tStatus("interrupted")}
                />
              )
            })}
          </ToolPartsScroll>
        )}
        {summary && (
          <p className="text-xs leading-relaxed text-muted-foreground">
            {summary}
          </p>
        )}
        {!isUser && textParts.some((p) => p.text.trim()) && (
          <button
            type="button"
            onClick={handleCopy}
            className="absolute end-2 -top-2 hidden cursor-pointer rounded-md border bg-background p-1 shadow-sm group-hover:flex"
          >
            {copied ? (
              <Check className="size-3 text-emerald-500" />
            ) : (
              <Copy className="size-3 text-muted-foreground" />
            )}
          </button>
        )}
      </div>
    </motion.div>
  )
}

function TypingIndicator({ label }: { label?: string }) {
  const t = useTranslations("aiBuilder.statusLabels")
  const resolvedLabel = label ?? t("thinking")
  return (
    <div className="flex items-end gap-2">
      <ValorcyMarkAvatar />
      <div className="relative overflow-hidden rounded-2xl rounded-es-sm bg-muted px-4 py-3">
        <motion.div
          className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-violet-400/10 to-transparent"
          animate={{ x: ["-100%", "100%"] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "linear" }}
        />
        <div className="relative flex items-center gap-2.5">
          <div className="flex items-end gap-0.5">
            {[0, 1, 2, 3, 4].map((i) => (
              <motion.span
                key={i}
                className="w-0.5 rounded-full bg-violet-500/50"
                style={{ height: 6 + (i % 3) * 3 }}
                animate={{ scaleY: [0.45, 1, 0.45], opacity: [0.35, 1, 0.35] }}
                transition={{
                  duration: 1.1,
                  repeat: Infinity,
                  delay: i * 0.08,
                  ease: "easeInOut",
                }}
              />
            ))}
          </div>
          <span className="text-xs text-muted-foreground">{resolvedLabel}</span>
        </div>
      </div>
    </div>
  )
}

export function AiBuilderShell({
  locale,
  websiteId,
  projectId,
  projectName,
  projectSlug,
  projectContext,
  kitId = null,
  initialPageSlug,
  initialWebsiteStatus = "draft",
  subdomain = null,
  sharedHeader = null,
  sharedFooter = null,
  designSystemRow,
  pages,
  userAvatarUrl = null,
  userName = null,
  initialView = "page",
  qaRunId,
}: AiBuilderProps) {
  const router = useRouter()
  const tSectionActions = useTranslations("aiBuilder.sectionActions")
  const tQa = useTranslations("aiBuilder.qa")
  const [qaDismissed, setQaDismissed] = useState(false)
  const t = useTranslations("aiBuilder.shell")
  const tStatus = useTranslations("aiBuilder.statusLabels")
  const tView = useTranslations("aiBuilder.overview")
  const tMentions = useTranslations("aiBuilder.mentions")
  const tCategories = useTranslations("aiCreate.categories")
  const [view, setView] = useState<AiBuilderView>(initialView)
  /** Desktop: chat column shown/collapsed. Mobile: chat drawer open. */
  const [chatOpen, setChatOpen] = useState(true)
  const [mobileChatOpen, setMobileChatOpen] = useState(false)
  const [input, setInput] = useState("")
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [isCreatingChat, setIsCreatingChat] = useState(false)
  const [creditInfo, setCreditInfo] = useState<AiChatCreditInfo | null>(null)
  const [notice, setNotice] = useState<ChatNotice | null>(null)
  const [attachments, setAttachments] = useState<ChatAttachment[]>([])
  const [thoughtDurations, setThoughtDurations] = useState<
    Record<string, number>
  >({})
  const lastSentTextRef = useRef<string>("")
  const thinkingStartedAtRef = useRef<number | null>(null)
  const streamWatchdogRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  // Bounds the agentic auto-continuation loop (sendAutomaticallyWhen). Reset to
  // 0 whenever the user starts a new turn; incremented on each automatic resend.
  // Without this cap a tool-happy model resubmits the same conversation forever,
  // which is the "AI repeats the same process many times" bug.
  const autoContinuationsRef = useRef(0)
  // 6 leaves headroom for the multi-page chain:
  // listPages → switchToPage → searchImages/generateCopy → insert → summary.
  const MAX_AUTO_CONTINUATIONS = 6
  const MESSAGE_CHAR_LIMIT = 1000
  const sections = useBuilderStore((s) => s.sections)
  const designSystem = useBuilderStore((s) => s.designSystem)
  const pageId = useBuilderStore((s) => s.pageId)
  const storePages = useBuilderStore((s) => s.pages)
  const liveActivePageId = useBuilderStore((s) => s.activePageId)
  const liveSharedHeader = useBuilderStore((s) => s.sharedHeader)
  const liveSharedFooter = useBuilderStore((s) => s.sharedFooter)

  // @mention targets: every page, each page's sections, and the shared chrome.
  const mentionOptions = useMemo(
    () =>
      buildMentionOptions({
        pages: [...storePages]
          .sort((a, b) => a.orderIndex - b.orderIndex)
          .map((p) => ({
            id: p.id,
            slug: p.slug,
            name: pageDisplayName(p.name, locale, p.slug),
            sections:
              p.id === liveActivePageId ? sections : p.draftContent?.sections ?? [],
          })),
        sharedHeader: liveSharedHeader,
        sharedFooter: liveSharedFooter,
        labelForSection: (section) => {
          const category = sectionRegistry.get(section.sectionId)?.category
          if (category && tCategories.has(category)) return tCategories(category)
          return sectionRegistry.get(section.sectionId)?.displayName ?? section.sectionId
        },
        sharedLabels: {
          header: tMentions("sharedHeader"),
          footer: tMentions("sharedFooter"),
        },
      }),
    [
      storePages,
      liveActivePageId,
      sections,
      liveSharedHeader,
      liveSharedFooter,
      locale,
      tCategories,
      tMentions,
    ]
  )
  /** Mentions of the current user turn — sent with every auto-continuation too. */
  const mentionsRef = useRef<MentionRef[]>([])
  /** Tool calls outside this scope are refused (see checkToolScope). */
  const scopeRef = useRef<EditScope | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const initialized = useRef(false)
  const designContextRef = useRef("")
  const elementContextRef = useRef("")
  const creditInfoRef = useRef<AiChatCreditInfo | null>(null)
  creditInfoRef.current = creditInfo

  const refreshCredits = useCallback(() => {
    void getAiChatCreditInfo()
      .then(setCreditInfo)
      .catch(() => {})
  }, [])

  useEffect(() => {
    refreshCredits()
  }, [refreshCredits])

  useBuilderAutosave({ projectId, websiteId })

  const temporal = useBuilderStore.temporal

  const welcomeMessage = useMemo<UIMessage>(
    () => ({
      id: "welcome",
      role: "assistant",
      parts: [
        {
          type: "text",
          text: `Hi! I'm your AI website builder for ${projectName}. Describe a full page, a section, or ask me to refine what's here.`,
        },
      ],
    }),
    [projectName]
  )

  const chatInitialMessages = useMemo(() => [welcomeMessage], [welcomeMessage])

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    const ds = mapDbDesignSystemToBuilder(designSystemRow) as DesignSystem
    const pageRows: WebsitePageRow[] = pages.map((p) => ({
      id: p.id,
      websiteId: p.websiteId,
      projectId: p.projectId,
      name: p.name,
      slug: p.slug,
      isHome: p.isHome,
      locale: p.locale,
      orderIndex: p.orderIndex,
      status: p.status,
      version: p.version,
      draftContent: normalizePageContent(p.draftContent),
      publishedContent: p.publishedContent
        ? normalizePageContent(p.publishedContent)
        : null,
      useSharedHeader: p.useSharedHeader ?? true,
      useSharedFooter: p.useSharedFooter ?? true,
    }))

    useBuilderStore.getState().initPages(pageRows)
    useBuilderStore
      .getState()
      .initWebsite(
        websiteId,
        (sharedHeader as
          | import("@/components/sections/registry.types").SectionInstance
          | null) ?? null,
        (sharedFooter as
          | import("@/components/sections/registry.types").SectionInstance
          | null) ?? null,
        projectContext?.logoUrl ?? null,
        undefined,
        kitId,
      )

    const initial =
      (initialPageSlug
        ? pageRows.find((r) => r.slug === initialPageSlug)
        : undefined) ??
      pageRows.find((r) => r.isHome) ??
      pageRows[0]
    if (!initial) return

    useBuilderStore
      .getState()
      .initBuilder(
        projectId,
        initial.id,
        projectName,
        projectSlug,
        initial.draftContent,
        initial.publishedContent,
        initial.version,
        ds,
        designSystemRow?.version ?? 0
      )
    // Conversation creation + history restore is handled by the pageId-driven
    // effect below. Creating it here too raced that effect (and double-fired
    // under StrictMode), occasionally producing duplicate conversations.
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const activePageSlug = useBuilderStore((s) => {
    const active = s.pages.find((p) => p.id === s.activePageId)
    return active?.slug ?? initialPageSlug ?? "home"
  })

  useEffect(() => {
    designContextRef.current = JSON.stringify(designSystem, null, 0).slice(
      0,
      1200
    )
  }, [designSystem])

  // Lock the chat id to the page the builder opened on. The AI's switchToPage
  // tool changes store.pageId mid-turn; letting that re-key useChat would
  // destroy the in-flight conversation and drop pending tool results.
  const chatIdRef = useRef<string | null>(null)
  if (pageId && !chatIdRef.current) {
    chatIdRef.current = `ai-builder-${websiteId}-${pageId}`
  }
  const chatId = chatIdRef.current ?? `ai-builder-${websiteId}`
  // Set when a page change was AI-initiated (switchToPage) so the pageId-driven
  // history effects don't clobber the live chat with the other page's history.
  const aiSwitchedPageRef = useRef(false)

  const { messages, sendMessage, addToolOutput, status, setMessages, stop } =
    useChat({
      id: chatId,
      messages: chatInitialMessages,
      transport: new DefaultChatTransport({
        api: "/api/ai",
        prepareSendMessagesRequest: ({
          messages: msgs,
          body,
          credentials,
          headers,
          api,
        }) => {
          // Compute page/element context at send time from the live store —
          // refs/subscriptions can be stale when an auto-continuation fires
          // right after an AI-initiated switchToPage.
          const s = useBuilderStore.getState()
          let elementContext = ""
          try {
            elementContext = buildElementContext(s.sections, s.elementStyles)
          } catch (err) {
            console.warn("[ai-builder] buildElementContext failed", err)
          }
          elementContextRef.current = elementContext
          const activePage = s.pages.find(
            (p) => p.id === (s.pageId ?? s.activePageId)
          )
          return {
            api,
            credentials,
            headers,
            body: {
              ...(body ?? {}),
              messages: msgs,
              pageContext: formatLayoutContext({
                sections: s.sections,
                sharedHeader: s.sharedHeader,
                sharedFooter: s.sharedFooter,
                useSharedHeader: activePage?.useSharedHeader,
                useSharedFooter: activePage?.useSharedFooter,
              }),
              designContext: designContextRef.current,
              elementContext,
              projectId,
              websiteId,
              pageId: s.pageId ?? pageId ?? undefined,
              conversationId: conversationId ?? undefined,
              projectContext: projectContext ?? undefined,
              mentions: mentionsRef.current,
              mentionContext: buildMentionContext(mentionsRef.current),
            },
          }
        },
      }),
      sendAutomaticallyWhen: (opts) => {
        // Only auto-continue completed tool turns, and cap the number of
        // automatic resends per user turn so the loop can't run forever.
        if (!lastAssistantMessageIsCompleteWithToolCalls(opts)) return false
        if (autoContinuationsRef.current >= MAX_AUTO_CONTINUATIONS) return false
        autoContinuationsRef.current += 1
        return true
      },
      onError(error) {
        console.error("[ai-builder] chat error", error)
        const windowSeconds =
          creditInfoRef.current?.rateLimitWindowSeconds ?? 60
        setNotice(classifyChatError(error, windowSeconds))
        // Credit balance may have changed (e.g. ran out mid-request).
        refreshCredits()
      },
      async onToolCall({ toolCall }) {
        const reportToolOutput = (
          payload:
            | { output: unknown }
            | { state: "output-error"; errorText: string }
        ) => {
          addToolOutput({
            tool: toolCall.toolName,
            toolCallId: toolCall.toolCallId,
            ...payload,
          })
        }

        if (toolCall.dynamic) {
          reportToolOutput({
            state: "output-error",
            errorText: "Unsupported dynamic tool",
          })
          return
        }

        // Server-side tools execute on the API route and stream their own
        // output back. Returning here lets the server result land as-is
        // instead of being overwritten by the client.
        if (SERVER_SIDE_TOOLS.has(toolCall.toolName)) return

        // @mention scope: "Make @Home Hero more premium" must not touch
        // anything but that section — refuse out-of-scope calls with a reason
        // the model can act on.
        const scopeViolation = checkToolScope(
          scopeRef.current,
          toolCall.toolName,
          toolCall.input as Record<string, unknown>,
          buildScopeCheckContext()
        )
        if (scopeViolation) {
          reportToolOutput({ state: "output-error", errorText: scopeViolation })
          return
        }

        try {
          if (
            toolCall.toolName === "switchToPage" ||
            toolCall.toolName === "createPage" ||
            toolCall.toolName === "deletePage"
          ) {
            // Persist the outgoing page before the canvas is re-hydrated, and
            // keep the history effects from clobbering the live chat when
            // store.pageId changes.
            aiSwitchedPageRef.current = true
            await flushBuilderAutosave()
          }
          // Read the store AFTER any await — flushing may settle state.
          const store = useBuilderStore.getState()
          const input = toolCall.input as Record<string, unknown>

          // Tools backed by server actions (CMS connect, rewrite, images, SEO).
          if (ASYNC_CLIENT_TOOLS.has(toolCall.toolName)) {
            const asyncResult = await applyAiToolCallAsync(
              toolCall.toolName,
              input,
              {
                projectId,
                websiteId,
                locale: projectContext?.locale ?? locale,
                industry: projectContext?.industry,
              }
            )
            if (asyncResult.ok) {
              reportToolOutput({
                output: {
                  success: true,
                  ...(asyncResult.data !== undefined
                    ? { data: asyncResult.data }
                    : {}),
                  ...(asyncResult.message
                    ? { message: asyncResult.message }
                    : {}),
                },
              })
              void flushBuilderAutosave()
            } else {
              reportToolOutput({
                state: "output-error",
                errorText: asyncResult.message ?? "Tool failed",
              })
            }
            return
          }

          const result = applyAiToolCall(store, toolCall.toolName, input)
          if (result.ok) {
            let outputData = result.data

            // Queue new registry sections for post-turn enrichment (CMS
            // smart-connect → copy rewrite → images). Runs once the whole
            // turn settles so the model's own same-turn patches land first.
            const data = result.data as
              | {
                  instanceId?: string
                  instanceIds?: string[]
                  usedCustomFallback?: boolean
                }
              | undefined
            if (
              toolCall.toolName === "addSection" ||
              toolCall.toolName === "replacePage" ||
              toolCall.toolName === "applyRecipe" ||
              toolCall.toolName === "replaceSharedSection"
            ) {
              if (!data?.usedCustomFallback) {
                queueEnrichment([data?.instanceId, ...(data?.instanceIds ?? [])])
                if (data?.instanceId || data?.instanceIds?.length) {
                  outputData = {
                    ...(outputData as Record<string, unknown> | undefined),
                    autoEnrichment:
                      "queued — content and images are filled in automatically after your reply; do not call generateCopy or searchImages for these sections",
                  }
                }
              }
            }

            const addedInstanceId = (
              outputData as { instanceId?: string } | undefined
            )?.instanceId
            if (
              addedInstanceId &&
              (toolCall.toolName === "addSection" ||
                toolCall.toolName === "generateCustomSection")
            ) {
              scrollPreviewToSection(addedInstanceId, { delayMs: 200 })
            }

            reportToolOutput({
              output: {
                success: true,
                ...(outputData !== undefined ? { data: outputData } : {}),
                ...(result.message ? { message: result.message } : {}),
              },
            })
            // Read-only tools have nothing new to persist.
            if (!READ_ONLY_TOOLS.has(toolCall.toolName)) {
              void flushBuilderAutosave()
            }
            return
          }
          reportToolOutput({
            state: "output-error",
            errorText: result.message ?? "Tool failed",
          })
        } catch (err) {
          reportToolOutput({
            state: "output-error",
            errorText:
              err instanceof Error ? err.message : "Tool execution failed",
          })
        }
      },
    })

  // Post-turn section enrichment: once the chat settles, drain the queue of
  // AI-added sections (CMS smart-connect → rewrite → images → validate → save).
  // The 600ms debounce covers the ready→submitted gap between agentic
  // auto-continuations so enrichment starts only after the final round; the
  // cleanup cancels the timer when a continuation fires.
  const [enrichTasks, setEnrichTasks] = useState<EnrichmentTask[]>([])
  const [enrichPhase, setEnrichPhase] = useState<EnrichmentPhase | null>(null)
  useEffect(() => {
    if (status !== "ready") return
    if (!hasQueuedEnrichment() || isEnrichmentRunning()) return
    const drainQueue = async () => {
      let sawTasks = false
      // Ids can be queued mid-run (a follow-up turn settling while enrichment
      // is busy skips its own trigger) — keep draining until empty.
      while (hasQueuedEnrichment() && !isEnrichmentRunning()) {
        const { tasks } = await runQueuedEnrichment({
          industry: projectContext?.industry,
          onUpdate: (tasks, phase) => {
            setEnrichTasks(tasks)
            setEnrichPhase(phase)
          },
        })
        if (tasks.length) sawTasks = true
        else break
      }
      if (!sawTasks) {
        setEnrichTasks([])
        setEnrichPhase(null)
        return
      }
      // Leave the settled chips visible briefly, then clear.
      setTimeout(() => {
        setEnrichTasks([])
        setEnrichPhase(null)
      }, 2500)
    }
    const timer = setTimeout(() => void drainQueue(), 600)
    return () => clearTimeout(timer)
  }, [status, messages.length, projectContext?.industry])

  // Refresh the credit badge once an AI turn settles.
  const prevStatusRef = useRef(status)
  useEffect(() => {
    if (
      (prevStatusRef.current === "streaming" ||
        prevStatusRef.current === "submitted") &&
      status === "ready"
    ) {
      refreshCredits()
      if (streamWatchdogRef.current) {
        clearTimeout(streamWatchdogRef.current)
        streamWatchdogRef.current = null
      }
      const startedAt = thinkingStartedAtRef.current
      if (startedAt != null) {
        const seconds = Math.max(1, Math.round((Date.now() - startedAt) / 1000))
        const lastAssistant = [...messages]
          .reverse()
          .find((m) => m.role === "assistant" && m.id !== "welcome")
        if (lastAssistant) {
          setThoughtDurations((prev) => ({
            ...prev,
            [lastAssistant.id]: seconds,
          }))
        }
        thinkingStartedAtRef.current = null
      }
    }
    if (status === "error" && streamWatchdogRef.current) {
      clearTimeout(streamWatchdogRef.current)
      streamWatchdogRef.current = null
      thinkingStartedAtRef.current = null
    }
    prevStatusRef.current = status
  }, [status, refreshCredits, messages])

  const clearStreamWatchdog = useCallback(() => {
    if (streamWatchdogRef.current) {
      clearTimeout(streamWatchdogRef.current)
      streamWatchdogRef.current = null
    }
  }, [])

  const startStreamWatchdog = useCallback(() => {
    clearStreamWatchdog()
    streamWatchdogRef.current = setTimeout(() => {
      autoContinuationsRef.current = 0
      void stop()
      const windowSeconds = creditInfoRef.current?.rateLimitWindowSeconds ?? 60
      setNotice(
        classifyChatError(
          new Error("Request timed out. Please try again."),
          windowSeconds
        )
      )
    }, STREAM_WATCHDOG_MS)
  }, [clearStreamWatchdog, stop])

  const lastToolName = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i]
      if (!m || m.role !== "assistant") continue
      for (let j = m.parts.length - 1; j >= 0; j--) {
        const part = m.parts[j]
        if (part?.type?.startsWith("tool-")) {
          return part.type.replace(/^tool-/, "")
        }
      }
    }
    return null
  }, [messages])

  const quickReplies = useMemo(
    () => getQuickReplies({ sectionCount: sections.length, lastToolName }),
    [sections.length, lastToolName]
  )

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const isMod = e.metaKey || e.ctrlKey
      if (!isMod) return
      const target = e.target as HTMLElement | null
      if (target && /^(INPUT|TEXTAREA)$/i.test(target.tagName)) return
      if (target?.isContentEditable) return
      if (e.key.toLowerCase() === "z" && !e.shiftKey) {
        e.preventDefault()
        temporal.getState().undo()
      } else if (
        (e.key.toLowerCase() === "z" && e.shiftKey) ||
        e.key.toLowerCase() === "y"
      ) {
        e.preventDefault()
        temporal.getState().redo()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [temporal])

  const historyLoadedRef = useRef<string | null>(null)
  const historyRestoreInFlightRef = useRef<string | null>(null)
  const welcomeMessageRef = useRef(welcomeMessage)
  welcomeMessageRef.current = welcomeMessage

  const applyRestoredMessages = useCallback(
    (restored: UIMessage[]) => {
      const deduped = dedupeMessages(restored)
      setMessages(
        deduped.length > 0
          ? [welcomeMessageRef.current, ...deduped]
          : [welcomeMessageRef.current]
      )
    },
    [setMessages]
  )

  useEffect(() => {
    // AI-initiated page switches keep the current conversation — don't reset
    // the history marker (a reset would trigger a reload that overwrites the
    // live chat via setMessages below).
    if (aiSwitchedPageRef.current) {
      historyLoadedRef.current = pageId
      return
    }
    historyLoadedRef.current = null
    historyRestoreInFlightRef.current = null
  }, [pageId])

  useEffect(() => {
    if (aiSwitchedPageRef.current) return
    if (!pageId) return

    const restoreKey = pageId
    if (
      historyLoadedRef.current === restoreKey ||
      historyRestoreInFlightRef.current === restoreKey
    ) {
      return
    }
    historyRestoreInFlightRef.current = restoreKey

    void getOrCreateAiConversation({ projectId, websiteId, pageId })
      .then(async (c) => {
        if (!c?.id) return
        setConversationId(c.id)
        const msgs = await listAiMessages(c.id)
        if (msgs.length === 0) {
          historyLoadedRef.current = pageId
          return
        }
        const restored = restoreChatMessagesFromDb(msgs)
        applyRestoredMessages(restored)
        historyLoadedRef.current = pageId
      })
      .catch(() => {})
      .finally(() => {
        if (historyRestoreInFlightRef.current === restoreKey) {
          historyRestoreInFlightRef.current = null
        }
      })
  }, [pageId, projectId, websiteId, setMessages, applyRestoredMessages])

  const canUseChatInput = status === "ready" || status === "error"
  const isStreaming = status === "streaming" || status === "submitted"
  const hasUploadingAttachments = attachments.some(
    (a) => a.status === "uploading"
  )

  const displayMessages = useMemo(
    () => normalizeMessagesForDisplay(messages, isStreaming, STALE_TOOL_ERROR),
    [messages, isStreaming]
  )

  const lastAssistantMessage = useMemo(() => {
    for (let i = displayMessages.length - 1; i >= 0; i--) {
      const m = displayMessages[i]
      if (m?.role === "assistant" && m.id !== "welcome") return m
    }
    return null
  }, [displayMessages])

  const showThinkingIndicator =
    isStreaming &&
    (!lastAssistantMessage || !hasVisibleAssistantContent(lastAssistantMessage))

  const showPreviewGenerating =
    isStreaming &&
    lastAssistantMessage != null &&
    hasVisibleAssistantContent(lastAssistantMessage)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [displayMessages, status, enrichPhase])

  const tAttachments = useTranslations("aiBuilder.attachments")

  const revokeAttachmentPreview = useCallback((attachment: ChatAttachment) => {
    if (attachment.previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(attachment.previewUrl)
    }
  }, [])

  const removeAttachment = useCallback(
    (id: string) => {
      setAttachments((prev) => {
        const target = prev.find((a) => a.id === id)
        if (target) revokeAttachmentPreview(target)
        return prev.filter((a) => a.id !== id)
      })
    },
    [revokeAttachmentPreview]
  )

  const handleAttachmentSelect = useCallback(
    async (files: FileList | null) => {
      if (!files?.length) return
      for (const file of Array.from(files)) {
        if (!ACCEPTED_ATTACHMENT_TYPES.has(file.type)) {
          toast.error(tAttachments("attachmentInvalidType"))
          continue
        }
        if (file.size > MAX_ATTACHMENT_BYTES) {
          toast.error(tAttachments("attachmentTooLarge"))
          continue
        }
        const id = crypto.randomUUID()
        const previewUrl = URL.createObjectURL(file)
        setAttachments((prev) => [
          ...prev,
          {
            id,
            name: file.name,
            mimeType: file.type,
            previewUrl,
            status: "uploading",
          },
        ])
        try {
          const formData = new FormData()
          formData.append("file", file)
          formData.append("projectId", projectId)
          const result = await uploadMediaAsset(formData)
          setAttachments((prev) =>
            prev.map((a) =>
              a.id === id ? { ...a, status: "ready", url: result.publicUrl } : a
            )
          )
        } catch (err) {
          setAttachments((prev) =>
            prev.map((a) => (a.id === id ? { ...a, status: "error" } : a))
          )
          toast.error(
            err instanceof Error ? err.message : tAttachments("uploadFailed")
          )
        }
      }
      if (fileInputRef.current) fileInputRef.current.value = ""
    },
    [projectId, tAttachments]
  )

  useEffect(() => {
    return () => {
      clearStreamWatchdog()
    }
  }, [clearStreamWatchdog])

  const submitChatMessage = useCallback(
    (text: string, mentions: MentionRef[] = []) => {
      const readyAttachments = attachments.filter(
        (a) => a.status === "ready" && a.url
      )
      thinkingStartedAtRef.current = Date.now()
      startStreamWatchdog()
      autoContinuationsRef.current = 0
      lastSentTextRef.current = text.slice(0, MESSAGE_CHAR_LIMIT)
      // A new user turn always resets the scope — unscoped unless it mentions.
      mentionsRef.current = mentions
      scopeRef.current = scopeFromMentions(mentions)
      const metadata = mentions.length ? { mentions } : undefined

      const fileParts = readyAttachments.map((a) => ({
        type: "file" as const,
        url: a.url!,
        mediaType: a.mimeType,
        filename: a.name,
      }))

      if (fileParts.length > 0) {
        sendMessage({
          parts: [
            { type: "text", text: lastSentTextRef.current },
            ...fileParts,
          ],
          metadata,
        })
      } else {
        sendMessage({ text: lastSentTextRef.current, metadata })
      }

      readyAttachments.forEach(revokeAttachmentPreview)
      setAttachments((prev) =>
        prev.filter((a) => !readyAttachments.some((r) => r.id === a.id))
      )
    },
    [attachments, sendMessage, startStreamWatchdog, revokeAttachmentPreview]
  )

  async function loadConversation(convId: string) {
    try {
      const msgs = await listAiMessages(convId)
      setConversationId(convId)
      historyLoadedRef.current = pageId
      if (msgs.length === 0) {
        setMessages([welcomeMessageRef.current])
        return
      }
      applyRestoredMessages(restoreChatMessagesFromDb(msgs))
    } catch {
      toast.error("Failed to load conversation")
    }
  }

  async function handleNewChat() {
    if (!pageId) return
    setIsCreatingChat(true)
    try {
      const conv = await createAiConversation({ projectId, websiteId, pageId })
      if (conv?.id) {
        setConversationId(conv.id)
        setMessages([welcomeMessageRef.current])
      }
    } catch {
      toast.error("Failed to create new chat")
    } finally {
      setIsCreatingChat(false)
    }
  }

  const handleSend = useCallback(() => {
    const text = input.trim()
    const readyAttachments = attachments.filter(
      (a) => a.status === "ready" && a.url
    )
    if ((!text && readyAttachments.length === 0) || !canUseChatInput) return
    if (hasUploadingAttachments) return
    if (creditInfoRef.current?.isOutOfCredits) {
      setNotice({ kind: "out_of_credits" })
      return
    }
    setNotice(null)
    const mentions = resolveMentionsFromText(text, mentionOptions)
    setInput("")

    void (async () => {
      // One target page → open it first so every tool acts on that page.
      const target = singleTargetPageId(mentions)
      const store = useBuilderStore.getState()
      const targetPage = target ? store.pages.find((p) => p.id === target) : undefined
      if (targetPage && targetPage.id !== (store.pageId ?? store.activePageId)) {
        aiSwitchedPageRef.current = true
        await flushBuilderAutosave()
        useBuilderStore.getState().switchPage(targetPage.id)
        setView("page")
        try {
          const url = new URL(window.location.href)
          url.searchParams.delete("view")
          url.searchParams.set("page", targetPage.slug)
          window.history.replaceState(window.history.state, "", url)
        } catch {
          // cosmetic
        }
      }
      submitChatMessage(text || tAttachments("attachmentOnlyPrompt"), mentions)
    })()
  }, [
    input,
    attachments,
    canUseChatInput,
    hasUploadingAttachments,
    submitChatMessage,
    tAttachments,
    mentionOptions,
  ])

  const handleRetryLast = useCallback(() => {
    const text = lastSentTextRef.current.trim()
    if (!text || !canUseChatInput) return
    setNotice(null)
    submitChatMessage(text, mentionsRef.current)
  }, [canUseChatInput, submitChatMessage])

  const handleStop = useCallback(() => {
    autoContinuationsRef.current = 0
    clearStreamWatchdog()
    thinkingStartedAtRef.current = null
    void stop()
  }, [stop, clearStreamWatchdog])

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  /** Keep `?view=` / `?page=` in the URL without a navigation (and drop `?run=`). */
  const syncViewUrl = useCallback((next: AiBuilderView, pageSlug?: string) => {
    try {
      const url = new URL(window.location.href)
      if (next === "overview") url.searchParams.set("view", "overview")
      else url.searchParams.delete("view")
      url.searchParams.delete("run")
      if (pageSlug) url.searchParams.set("page", pageSlug)
      window.history.replaceState(window.history.state, "", url)
    } catch {
      // URL sync is cosmetic — never block the view change.
    }
  }, [])

  const changeView = useCallback(
    (next: AiBuilderView) => {
      setView(next)
      syncViewUrl(next)
    },
    [syncViewUrl]
  )

  const openPageFromOverview = useCallback(
    async (id: string) => {
      await flushBuilderAutosave()
      const store = useBuilderStore.getState()
      if (store.activePageId !== id) store.switchPage(id)
      setView("page")
      syncViewUrl("page", store.pages.find((p) => p.id === id)?.slug)
    },
    [syncViewUrl]
  )

  const openChatWith = useCallback((text: string) => {
    setInput(text)
    setChatOpen(true)
    setMobileChatOpen(true)
    requestAnimationFrame(() => {
      const el = textareaRef.current
      if (!el) return
      el.focus()
      el.setSelectionRange(el.value.length, el.value.length)
    })
  }, [])

  const sectionActionLabels = useMemo(
    () => ({
      ask: tSectionActions("ask"),
      regenerate: tSectionActions("regenerate"),
      images: tSectionActions("images"),
      edit: tSectionActions("edit"),
    }),
    [tSectionActions]
  )

  /** Quick AI actions from the preview's section toolbar. */
  const handleSectionAction = useCallback(
    async (action: SectionAction, instanceId: string) => {
      const store = useBuilderStore.getState()

      if (action === "ask") {
        const option = mentionOptions.find((o) => o.instanceId === instanceId)
        const current = textareaRef.current?.value ?? ""
        openChatWith(
          option
            ? `${current.trim() ? `${current.trimEnd()} ` : ""}@${option.label} `
            : current
        )
        return
      }

      if (action === "edit") {
        await flushBuilderAutosave()
        const slug = store.pages.find(
          (p) => p.id === (store.pageId ?? store.activePageId)
        )?.slug
        const params = new URLSearchParams({
          ...(slug ? { page: slug } : {}),
          section: instanceId,
        })
        router.push(`/website-builder/edit/${websiteId}?${params.toString()}`)
        return
      }

      // Same engine (and credit cost) as the section panel's AI buttons.
      const toastId = toast.loading(
        action === "regenerate"
          ? tSectionActions("regenerating")
          : tSectionActions("findingImages")
      )
      try {
        if (action === "regenerate") {
          await prepareSectionInstance(instanceId, {
            force: true,
            quiet: true,
            skipImages: true,
          })
        } else {
          await prepareSectionInstance(instanceId, {
            force: true,
            quiet: true,
            skipCopy: true,
            excludeImageUrls: collectPageImageUrls([
              store.sharedHeader,
              ...store.sections.filter((s) => s.id !== instanceId),
              store.sharedFooter,
            ]),
          })
        }
        if (useBuilderStore.getState().aiLoadingSections[instanceId] === "error") {
          toast.error(tSectionActions("failed"), { id: toastId })
        } else {
          toast.success(
            action === "regenerate"
              ? tSectionActions("regenerated")
              : tSectionActions("imagesUpdated"),
            { id: toastId }
          )
          void flushBuilderAutosave()
        }
      } catch {
        toast.error(tSectionActions("failed"), { id: toastId })
      } finally {
        refreshCredits()
      }
    },
    [mentionOptions, openChatWith, refreshCredits, router, tSectionActions, websiteId]
  )

  /** "Fix with AI" from the final QA card: a scoped request, ready to send. */
  const handleFixWithAi = useCallback(
    (checkId: SiteQaCheckId, pageSlugs: string[]) => {
      const mentions = pageSlugs
        .map((slug) =>
          mentionOptions.find((o) => o.kind === "page" && o.pageSlug === slug)
        )
        .filter((o): o is NonNullable<typeof o> => Boolean(o))
        .map((o) => `@${o.label}`)
      openChatWith(
        `${tQa(`fixPrompt.${checkId}`)}${mentions.length ? ` ${mentions.join(" ")}` : ""}`
      )
    },
    [mentionOptions, openChatWith, tQa]
  )

  function handleRegenerateLastSection() {
    const last = sections[sections.length - 1]
    if (!last) {
      toast.error("No section to regenerate")
      return
    }
    submitChatMessage(
      `Regenerate section instanceId=${last.id} with fresh compelling copy while keeping sectionId=${last.sectionId}`
    )
  }

  const hasUserMessage = displayMessages.some((m) => m.role === "user")
  const draftMentions = useMemo(
    () => resolveMentionsFromText(input, mentionOptions),
    [input, mentionOptions]
  )

  return (
    <div className="fixed inset-0 flex flex-col bg-background">
      <BuilderNavbar
        locale={locale}
        websiteId={websiteId}
        projectId={projectId}
        initialWebsiteStatus={initialWebsiteStatus}
        subdomain={subdomain}
        mode="ai"
        defaultIndustry={projectContext?.industry ?? null}
      />

      <div className="relative flex flex-1 overflow-hidden">
        {mobileChatOpen && (
          <button
            type="button"
            aria-label={tView("closeChat")}
            className="fixed inset-x-0 bottom-0 top-12 z-30 bg-background/60 backdrop-blur-sm lg:hidden"
            onClick={() => setMobileChatOpen(false)}
          />
        )}
        {/* Compact chat column: fixed width on desktop so the canvas gets the
            room; a slide-over drawer below lg. */}
        <aside
          id="ai-builder-chat"
          aria-label={t("chat")}
          className={cn(
            "fixed bottom-0 start-0 top-12 z-40 flex w-[min(88vw,360px)] shrink-0 flex-col border-e bg-background transition-transform duration-200",
            "lg:static lg:z-auto lg:w-[320px] lg:translate-x-0 lg:rtl:translate-x-0",
            mobileChatOpen ? "translate-x-0" : "-translate-x-full rtl:translate-x-full",
            !chatOpen && "lg:hidden"
          )}
        >
            <div className="flex h-full flex-col">
              <div className="flex shrink-0 items-center justify-between gap-2 border-b px-3 py-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-muted-foreground">
                    {t("chat")}
                  </span>
                  <AiCreditBadge info={creditInfo} />
                </div>
                <div className="flex items-center gap-0.5">
                <AiChatHistory
                  websiteId={websiteId}
                  currentConversationId={conversationId}
                  pages={pages}
                  locale={locale}
                  onSelect={(conv) => void loadConversation(conv.id)}
                  onNewChat={() => void handleNewChat()}
                  isCreating={isCreatingChat}
                  onDeleted={(deletedId) => {
                    if (deletedId === conversationId) void handleNewChat()
                  }}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-7 text-muted-foreground"
                  onClick={() => {
                    setChatOpen(false)
                    setMobileChatOpen(false)
                  }}
                  aria-label={tView("hideChat")}
                  title={tView("hideChat")}
                >
                  <PanelLeftClose className="size-4 rtl:rotate-180" />
                </Button>
                </div>
              </div>
              {/* {sections.length > 0 && (
                <div className="flex shrink-0 flex-col gap-2 border-b px-4 py-2">
                  <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    <Layers className="size-3.5" />
                    Page structure
                  </div>
                  <ScrollArea className="max-h-20">
                    <div className="flex flex-wrap gap-1">
                      {sections.map((s, i) => (
                        <span
                          key={s.id}
                          className="inline-flex cursor-default items-center rounded-md bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground"
                          title={s.id}
                        >
                          {i + 1}. {s.sectionId}
                        </span>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )} */}

              <ScrollArea className="flex-1 px-4 py-4">
                <div className="flex flex-col gap-4">
                  <AnimatePresence initial={false}>
                    {displayMessages.map((msg) => (
                      <MessageBubble
                        key={msg.id}
                        message={msg}
                        userAvatarUrl={userAvatarUrl}
                        userName={userName}
                        thoughtSeconds={
                          msg.role === "assistant" && msg.id !== "welcome"
                            ? thoughtDurations[msg.id]
                            : undefined
                        }
                        isComplete={
                          msg.role === "assistant" &&
                          msg.id !== "welcome" &&
                          !isStreaming
                        }
                      />
                    ))}
                    {showThinkingIndicator && (
                      <motion.div
                        key="typing"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                      >
                        <TypingIndicator />
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <EnrichmentProgress tasks={enrichTasks} phase={enrichPhase} />
                  {notice && (
                    <AiChatNotice
                      notice={notice}
                      creditInfo={creditInfo}
                      onRetry={
                        notice.kind === "rate_limit" || notice.kind === "error"
                          ? handleRetryLast
                          : undefined
                      }
                      onDismiss={() => setNotice(null)}
                    />
                  )}
                  <div ref={bottomRef} />
                </div>
              </ScrollArea>

              {/* {!hasUserMessage && (
                <div className="shrink-0 border-t px-4 py-3">
                  <p className="mb-2 text-xs font-medium text-muted-foreground">
                    {t("templates")}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {PROMPT_TEMPLATES.filter((t) => t.category === "page").map(
                      (t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => {
                            setInput(t.prompt)
                            textareaRef.current?.focus()
                          }}
                          className="cursor-pointer rounded-full border bg-muted/50 px-3 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        >
                          {t.label}
                        </button>
                      )
                    )}
                  </div>
                </div>
              )} */}

              {/* {hasUserMessage && (
                <div className="shrink-0 px-4 pb-2">
                  <div className="flex flex-wrap gap-1.5">
                    {quickReplies.map((s) => (
                      <button
                        key={s}
                        type="button"
                        disabled={!canUseChatInput}
                        onClick={() => {
                          autoContinuationsRef.current = 0
                          sendMessage({ text: s })
                        }}
                        className="cursor-pointer rounded-full border px-2.5 py-0.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )} */}

              <div className="shrink-0 border-t bg-background/80 p-3 backdrop-blur-sm">
                <div className="flex flex-col gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,application/pdf"
                    multiple
                    className="hidden"
                    onChange={(e) =>
                      void handleAttachmentSelect(e.target.files)
                    }
                  />
                  {attachments.length > 0 && (
                    <div className="flex flex-wrap gap-2 px-1">
                      {attachments.map((attachment) => {
                        const isImage = attachment.mimeType.startsWith("image/")
                        return (
                          <div
                            key={attachment.id}
                            className="group relative flex items-center gap-2 rounded-lg border border-border/40 bg-muted/40 p-1.5 pe-7"
                          >
                            {isImage ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={attachment.previewUrl}
                                alt={attachment.name}
                                className="size-10 rounded-md object-cover"
                              />
                            ) : (
                              <div className="flex size-10 items-center justify-center rounded-md bg-muted">
                                <FileText className="size-4 text-muted-foreground" />
                              </div>
                            )}
                            <div className="max-w-[120px] min-w-0">
                              <p className="truncate text-[11px] font-medium">
                                {attachment.name}
                              </p>
                              <p className="text-[10px] text-muted-foreground">
                                {attachment.status === "uploading"
                                  ? tAttachments("attaching")
                                  : attachment.status === "error"
                                    ? tAttachments("uploadFailed")
                                    : attachment.mimeType
                                        .split("/")[1]
                                        ?.toUpperCase()}
                              </p>
                            </div>
                            {attachment.status === "uploading" && (
                              <Loader2 className="absolute end-2 top-2 size-3 animate-spin text-muted-foreground" />
                            )}
                            <button
                              type="button"
                              onClick={() => removeAttachment(attachment.id)}
                              className="absolute end-1 top-1 rounded p-0.5 text-muted-foreground opacity-70 hover:bg-background hover:opacity-100"
                              title={tAttachments("removeAttachment")}
                            >
                              <X className="size-3" />
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  )}
                  {draftMentions.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1 px-1">
                      <span className="text-[11px] text-muted-foreground">
                        {tMentions("scopeLabel")}
                      </span>
                      {draftMentions.map((mention) => (
                        <span
                          key={`${mention.kind}:${mention.pageId ?? ""}:${mention.instanceId ?? mention.slot ?? ""}`}
                          className="inline-flex max-w-full items-center gap-1 rounded-full bg-primary/10 py-0.5 ps-2 pe-1 text-[11px] text-primary"
                        >
                          <AtSign className="size-3 shrink-0" aria-hidden />
                          <span className="truncate">{mention.label}</span>
                          <button
                            type="button"
                            onClick={() =>
                              setInput((prev) => removeMention(prev, mention.label))
                            }
                            className="rounded-full p-0.5 hover:bg-primary/15"
                            aria-label={tMentions("remove", { label: mention.label })}
                          >
                            <X className="size-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="relative flex items-end gap-2 rounded-xl border bg-muted/30 p-2 focus-within:border-violet-400 focus-within:ring-1 focus-within:ring-violet-400/30">
                    <MentionTextarea
                      textareaRef={textareaRef}
                      value={input}
                      onValueChange={(v) => setInput(v.slice(0, MESSAGE_CHAR_LIMIT))}
                      options={mentionOptions}
                      groupLabels={{
                        pages: tMentions("groupPages"),
                        sections: tMentions("groupSections"),
                        shared: tMentions("groupShared"),
                      }}
                      listLabel={tMentions("listLabel")}
                      onKeyDown={handleKeyDown}
                      maxLength={MESSAGE_CHAR_LIMIT}
                      placeholder={tMentions("placeholder")}
                      className="max-h-28 min-h-20 resize-none border-0 bg-transparent p-1 text-sm shadow-none focus-visible:ring-0"
                      rows={1}
                      disabled={!canUseChatInput}
                    />
                    <div className="flex-col gap-2 flex justify-between">
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="size-9 shrink-0 rounded-lg text-muted-foreground"
                        disabled={!canUseChatInput || hasUploadingAttachments}
                        onClick={() => fileInputRef.current?.click()}
                        title={tAttachments("attach")}
                      >
                        <Paperclip className="size-4" />
                      </Button>
                      {isStreaming ? (
                        <Button
                          size="icon"
                          variant="secondary"
                          className="size-9 shrink-0 rounded-lg"
                          onClick={handleStop}
                          title={t("stopGenerating")}
                        >
                          <Square className="size-3.5 fill-current" />
                        </Button>
                      ) : (
                        <Button
                          size="icon"
                          className="size-9 shrink-0 rounded-lg bg-violet-600 text-white hover:bg-violet-700"
                          disabled={
                            (!input.trim() &&
                              !attachments.some(
                                (a) => a.status === "ready" && a.url
                              )) ||
                            !canUseChatInput ||
                            hasUploadingAttachments
                          }
                          onClick={handleSend}
                        >
                          <Send className="size-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-center text-xs text-muted-foreground/60">
                      <kbd className="rounded border px-1 font-mono text-[10px]">
                        ↵
                      </kbd>{" "}
                      {t("sendHint")}
                      {input.length > MESSAGE_CHAR_LIMIT * 0.8 && (
                        <span
                          className={cn(
                            "ms-2",
                            input.length >= MESSAGE_CHAR_LIMIT &&
                              "text-rose-500"
                          )}
                        >
                          {input.length}/{MESSAGE_CHAR_LIMIT}
                        </span>
                      )}
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs"
                      disabled={!sections.length || !canUseChatInput}
                      onClick={handleRegenerateLastSection}
                    >
                      <RotateCcw className="me-1 size-3" />
                      {t("regenerateLast")}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
        </aside>

        <main className="relative flex min-w-0 flex-1 flex-col">
          <div className="flex shrink-0 items-center gap-2 border-b bg-background px-2 py-1.5">
            {!chatOpen && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="hidden h-8 gap-1.5 text-muted-foreground lg:inline-flex"
                onClick={() => setChatOpen(true)}
              >
                <PanelLeftOpen className="size-4 rtl:rotate-180" />
                {tView("showChat")}
              </Button>
            )}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 gap-1.5 text-muted-foreground lg:hidden"
              onClick={() => {
                setChatOpen(true)
                setMobileChatOpen(true)
              }}
            >
              <MessageSquare className="size-4" />
              {t("chat")}
            </Button>
            <div
              role="tablist"
              aria-label={tView("viewLabel")}
              className="inline-flex items-center rounded-lg border p-0.5"
            >
              {(["page", "overview"] as const).map((v) => {
                const Icon = v === "page" ? Layout : LayoutGrid
                return (
                  <button
                    key={v}
                    type="button"
                    role="tab"
                    aria-selected={view === v}
                    onClick={() => changeView(v)}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      view === v
                        ? "bg-muted font-medium text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Icon className="size-3.5" />
                    {tView(v === "page" ? "pageView" : "overviewView")}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="relative min-h-0 flex-1">
            {/* The live preview stays mounted under the overview so switching
                back never reloads the iframe. */}
            <div className={cn("relative flex h-full flex-col", view === "overview" && "hidden")}>
              <PreviewFrame
                websiteId={websiteId}
                pageSlug={activePageSlug}
                className="flex-1"
                onSectionAction={(action, id) => void handleSectionAction(action, id)}
                sectionActionLabels={sectionActionLabels}
              />
              {showPreviewGenerating && (
                <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-center pt-4">
                  <div className="flex items-center gap-2 rounded-full border border-border/40 bg-background/80 px-3 py-1.5 text-xs text-muted-foreground shadow-sm backdrop-blur-sm">
                    <Sparkles className="size-3.5 animate-pulse text-violet-500" />
                    {tStatus("generating")}
                  </div>
                </div>
              )}
            </div>
            {view === "overview" && (
              <div className="absolute inset-0">
                <WebsiteOverview
                  websiteId={websiteId}
                  locale={locale}
                  defaultLocale={projectContext?.locale ?? "en"}
                  onOpenPage={(id) => void openPageFromOverview(id)}
                  header={
                    qaRunId && !qaDismissed ? (
                      <SiteQaCard
                        runId={qaRunId}
                        onFix={handleFixWithAi}
                        onDismiss={() => setQaDismissed(true)}
                      />
                    ) : undefined
                  }
                />
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
