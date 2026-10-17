"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { notify } from "@/services/toast"
import { Loader2, Save, CheckCircle2, CalendarClock, Check, Sparkles } from "lucide-react"

import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { FIELD_INPUTS } from "@/components/cms/field-inputs"
import { ITEM_STATUS_META } from "@/lib/cms/field-meta"
import { createItemAction, updateItemAction, autosaveItemAction } from "@/actions/cms/item-actions"
import { generateBlogFieldsAction } from "@/actions/ai-field-rewrite-actions"
import type { CmsCollection, CmsItemStatus, CmsItemWithRelations } from "@/types/cms/cms.types"

interface RecordFormProps {
  collection: CmsCollection
  item: CmsItemWithRelations | null
  projectId: string
  onSaved?: (item: CmsItemWithRelations) => void
  /** Render a compact layout suited for a side sheet. */
  compact?: boolean
}

function buildInitialData(collection: CmsCollection, item: CmsItemWithRelations | null): Record<string, unknown> {
  if (item) return { ...item.data }
  const data: Record<string, unknown> = {}
  for (const field of collection.fields) {
    if (field.defaultValue !== undefined) data[field.key] = field.defaultValue
  }
  return data
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

/** Convert an ISO string to the value a datetime-local input expects. */
function toLocalInput(iso: string | null): string {
  if (!iso) return ""
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ""
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

type AutosaveState = "idle" | "saving" | "saved"

export function RecordForm({ collection, item, projectId, onSaved, compact }: RecordFormProps) {
  const t = useTranslations('cms.recordForm')
  const router = useRouter()
  const [data, setData] = useState<Record<string, unknown>>(() => buildInitialData(collection, item))
  const [slug, setSlug] = useState(item?.slug ?? "")
  const [slugTouched, setSlugTouched] = useState(Boolean(item?.slug))
  const [status, setStatus] = useState<CmsItemStatus>(item?.status ?? "draft")
  const [scheduledAt, setScheduledAt] = useState<string>(toLocalInput(item?.scheduledAt ?? null))
  const [isSaving, setIsSaving] = useState(false)
  const [isGeneratingMeta, setIsGeneratingMeta] = useState(false)
  const [autosaveState, setAutosaveState] = useState<AutosaveState>("idle")

  const primaryKey = collection.primaryFieldKey ?? "title"
  const dirtyRef = useRef(false)

  const setFieldValue = (key: string, value: unknown) => {
    dirtyRef.current = true
    setData((prev) => ({ ...prev, [key]: value }))
    // Keep slug in sync with the primary field until the user edits it manually.
    if (key === primaryKey && !slugTouched && typeof value === "string") {
      setSlug(slugify(value))
    }
  }

  // Auto-save draft for existing records after 5s of inactivity.
  useEffect(() => {
    if (!item || !dirtyRef.current) return
    const timer = setTimeout(async () => {
      setAutosaveState("saving")
      try {
        await autosaveItemAction(item.id, projectId, {
          data,
          slug: slug || undefined,
          scheduledAt: status === "scheduled" && scheduledAt ? new Date(scheduledAt).toISOString() : null,
        })
        dirtyRef.current = false
        setAutosaveState("saved")
      } catch {
        setAutosaveState("idle")
      }
    }, 5000)
    return () => clearTimeout(timer)
  }, [data, slug, scheduledAt, status, item, projectId])

  const save = async (nextStatus?: CmsItemStatus) => {
    setIsSaving(true)
    try {
      const finalStatus = nextStatus ?? status
      const scheduledIso =
        finalStatus === "scheduled" && scheduledAt ? new Date(scheduledAt).toISOString() : null

      if (finalStatus === "scheduled" && !scheduledIso) {
        notify.error(t('toastPickScheduleDate'))
        return
      }

      const result = item
        ? await updateItemAction({ id: item.id, projectId, slug: slug || undefined, status: finalStatus, data, scheduledAt: scheduledIso })
        : await createItemAction({ collectionId: collection.id, projectId, slug: slug || undefined, status: finalStatus, data, scheduledAt: scheduledIso })

      if (!result.ok) {
        notify.error(result.error)
        return
      }

      dirtyRef.current = false
      setAutosaveState("idle")
      setStatus(result.data.status)
      setSlug(result.data.slug)
      notify.success(item ? t('toastSaved') : t('toastCreated'))
      onSaved?.(result.data as CmsItemWithRelations)

      if (!item) {
        router.push(`/projects/${projectId}/cms/${collection.slug}/${result.data.id}` as any)
      } else {
        router.refresh()
      }
    } finally {
      setIsSaving(false)
    }
  }

  const visibleFields = collection.fields.filter((f) => f.key !== collection.slugFieldKey)

  const suggestBlogMetadata = async () => {
    const contentText = typeof data.content__text === 'string'
      ? data.content__text
      : typeof data.excerpt === 'string'
        ? data.excerpt
        : ''
    if (!contentText.trim()) {
      notify.error('Add blog content before generating metadata.')
      return
    }
    setIsGeneratingMeta(true)
    try {
      const result = await generateBlogFieldsAction({
        projectId,
        title: typeof data.title === 'string' ? data.title : undefined,
        contentText,
      })
      if ('error' in result) {
        notify.error(result.error)
        return
      }
      dirtyRef.current = true
      setData((prev) => ({
        ...prev,
        ...(result.excerpt ? { excerpt: result.excerpt } : {}),
        ...(result.seoTitle ? { seoTitle: result.seoTitle } : {}),
        ...(result.seoDescription ? { seoDescription: result.seoDescription } : {}),
        ...(result.tags?.length ? { tags: result.tags } : {}),
      }))
      notify.success('Blog metadata suggested.')
    } finally {
      setIsGeneratingMeta(false)
    }
  }

  return (
    <div className={compact ? "space-y-5" : "grid gap-8 lg:grid-cols-[1fr_280px]"}>
      <div className="space-y-5">
        {collection.kind === 'articles' ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-2"
            disabled={isGeneratingMeta}
            onClick={suggestBlogMetadata}
          >
            {isGeneratingMeta ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
            Suggest excerpt, SEO & tags
          </Button>
        ) : null}
        {visibleFields.map((field) => {
          const Input_ = FIELD_INPUTS[field.type]
          if (!Input_) return null
          return (
            <div key={field.key} className="space-y-1.5">
              <Label className="flex items-center gap-1.5 text-sm font-medium">
                {field.label}
                {field.required && <span className="text-destructive">*</span>}
              </Label>
              {field.helpText && <p className="text-xs text-muted-foreground">{field.helpText}</p>}
              <Input_
                field={field}
                value={data[field.key]}
                onChange={(v) => setFieldValue(field.key, v)}
                projectId={projectId}
                collectionKind={collection.kind}
                cmsItemData={data}
                onPatchFields={(patch) => {
                  dirtyRef.current = true
                  setData((prev) => ({ ...prev, ...patch }))
                }}
              />
            </div>
          )
        })}
      </div>

      <div className="space-y-5">
        <div className="space-y-3 rounded-lg border border-border p-4">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">{t('statusLabel')}</Label>
            <Select value={status} onValueChange={(v) => { dirtyRef.current = true; setStatus(v as CmsItemStatus) }}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(ITEM_STATUS_META).map(([value, meta]) => (
                  <SelectItem key={value} value={value}>
                    {meta.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {status === "scheduled" && (
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5 text-sm font-medium">
                <CalendarClock className="size-3.5" /> {t('publishAt')}
              </Label>
              <Input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => { dirtyRef.current = true; setScheduledAt(e.target.value) }}
              />
              <p className="text-xs text-muted-foreground">{t('publishAtHelp')}</p>
            </div>
          )}

          <div className="space-y-1.5">
            <Label className="text-sm font-medium">{t('slugLabel')}</Label>
            <Input
              value={slug}
              onChange={(e) => { setSlugTouched(true); dirtyRef.current = true; setSlug(e.target.value) }}
              placeholder={t('slugPlaceholder')}
            />
          </div>

          {item && autosaveState !== "idle" && (
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              {autosaveState === "saving" ? (
                <><Loader2 className="size-3 animate-spin" /> {t('savingDraft')}</>
              ) : (
                <><Check className="size-3 text-green-600" /> {t('draftSaved')}</>
              )}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Button onClick={() => save()} disabled={isSaving} variant="outline">
            {isSaving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            {t('save')}
          </Button>
          <Button onClick={() => save("published")} disabled={isSaving}>
            {isSaving ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
            {t('saveAndPublish')}
          </Button>
        </div>
      </div>
    </div>
  )
}
