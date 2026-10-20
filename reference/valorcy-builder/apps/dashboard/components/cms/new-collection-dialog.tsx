"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { notify } from "@/services/toast"
import { Loader2, Plus } from "lucide-react"

import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@workspace/ui/components/dialog"
import { COLLECTION_PRESETS, BLANK_COLLECTION_FIELDS, type CollectionPreset } from "@/lib/cms/presets"
import { createCollectionAction } from "@/actions/cms/collection-actions"
import { Link } from "@/i18n/navigation"

interface NewCollectionDialogProps {
  projectId: string
  /** Custom trigger element; falls back to the default "New collection" button. */
  trigger?: React.ReactNode
  /** Called after a collection is successfully created (e.g. to refresh a nav). */
  onCreated?: () => void
}

const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export function NewCollectionDialog({ projectId, trigger, onCreated }: NewCollectionDialogProps) {
  const t = useTranslations('cms.newCollection')
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [preset, setPreset] = useState<CollectionPreset | null>(null)
  const [name, setName] = useState("")
  const [slug, setSlug] = useState("")
  const [slugTouched, setSlugTouched] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [createdSlug, setCreatedSlug] = useState<string | null>(null)

  const reset = () => {
    setPreset(null)
    setName("")
    setSlug("")
    setSlugTouched(false)
    setCreatedSlug(null)
  }

  const choosePreset = (p: CollectionPreset | null) => {
    setPreset(p)
    setName(p?.name ?? "")
    if (!slugTouched) setSlug(p?.slug ?? "")
  }

  const handleNameChange = (v: string) => {
    setName(v)
    if (!slugTouched) setSlug(slugify(v))
  }

  const handleCreate = async () => {
    if (!name.trim() || !slug.trim() || !SLUG_REGEX.test(slug)) {
      notify.error(t('toastInvalidNameSlug'))
      return
    }

    setIsSaving(true)
    try {
      const result = await createCollectionAction({
        projectId,
        presetSlug: preset?.slug,
        kind: preset?.kind ?? "custom",
        name: name.trim(),
        slug: slug.trim(),
        description: preset?.description ?? null,
        icon: preset?.icon ?? null,
        fields: preset?.fields ?? BLANK_COLLECTION_FIELDS,
        primaryFieldKey: preset?.primaryFieldKey ?? "title",
        slugFieldKey: preset?.slugFieldKey ?? "slug",
      })

      if (!result.ok) {
        notify.error(result.error)
        return
      }

      notify.success(t('toastCreated'))
      setCreatedSlug(result.data.slug)
      onCreated?.()
      router.refresh()
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset() }}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm">
            <Plus className="size-4" /> {t('newCollection')}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('newCollection')}</DialogTitle>
        </DialogHeader>

        {createdSlug ? (
          <div className="space-y-4 py-2 text-center">
            <p className="text-sm text-muted-foreground">{t('ready')}</p>
            <Button asChild>
              <Link href={`/projects/${projectId}/cms/${createdSlug}` as any} onClick={() => setOpen(false)}>
                {t('openCollection')}
              </Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="space-y-2">
              <Label className="text-sm font-medium">{t('startFromTemplate')}</Label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                <button
                  type="button"
                  onClick={() => choosePreset(null)}
                  className={`rounded-md border px-3 py-3 text-start text-sm transition-colors ${!preset ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"}`}
                >
                  <p className="font-medium">{t('blank')}</p>
                  <p className="text-xs text-muted-foreground">{t('blankDescription')}</p>
                </button>
                {COLLECTION_PRESETS.map((p) => (
                  <button
                    key={p.slug}
                    type="button"
                    onClick={() => choosePreset(p)}
                    className={`rounded-md border px-3 py-3 text-start text-sm transition-colors ${preset?.slug === p.slug ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"}`}
                  >
                    <p className="font-medium">{p.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{p.description}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium">{t('nameLabel')}</Label>
              <Input value={name} onChange={(e) => handleNameChange(e.target.value)} placeholder={t('namePlaceholder')} />
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium">{t('slugLabel')}</Label>
              <Input
                value={slug}
                onChange={(e) => { setSlugTouched(true); setSlug(slugify(e.target.value)) }}
                placeholder={t('slugPlaceholder')}
              />
            </div>
          </div>
        )}

        {!createdSlug && (
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>{t('cancel')}</Button>
            <Button onClick={handleCreate} disabled={isSaving}>
              {isSaving && <Loader2 className="size-4 animate-spin" />}
              {t('create')}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}
