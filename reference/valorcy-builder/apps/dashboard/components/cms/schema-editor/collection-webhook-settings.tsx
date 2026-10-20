"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { notify } from "@/services/toast"
import { Loader2, Webhook, Settings2 } from "lucide-react"

import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Textarea } from "@workspace/ui/components/textarea"
import { Label } from "@workspace/ui/components/label"
import { updateCollectionAction } from "@/actions/cms/collection-actions"
import type { CmsCollection } from "@/types/cms/cms.types"

export function CollectionWebhookSettings({ collection, projectId }: { collection: CmsCollection; projectId: string }) {
  const t = useTranslations('cms.webhookSettings')
  const router = useRouter()
  const [name, setName] = useState(collection.name)
  const [description, setDescription] = useState(collection.description ?? "")
  const [url, setUrl] = useState(collection.settings?.webhookUrl ?? "")
  const [savingDetails, setSavingDetails] = useState(false)
  const [savingWebhook, setSavingWebhook] = useState(false)

  const saveDetails = async () => {
    if (!name.trim()) {
      notify.error(t('toastNameRequired'))
      return
    }
    setSavingDetails(true)
    try {
      const result = await updateCollectionAction({
        id: collection.id,
        projectId,
        name: name.trim(),
        description: description.trim() || null,
      })
      if (!result.ok) {
        notify.error(result.error)
        return
      }
      notify.success(t('toastCollectionUpdated'))
      router.refresh()
    } finally {
      setSavingDetails(false)
    }
  }

  const saveWebhook = async () => {
    if (url.trim() && !/^https?:\/\//i.test(url.trim())) {
      notify.error(t('toastInvalidUrl'))
      return
    }
    setSavingWebhook(true)
    try {
      const result = await updateCollectionAction({
        id: collection.id,
        projectId,
        settings: { ...collection.settings, webhookUrl: url.trim() || undefined },
      })
      if (!result.ok) {
        notify.error(result.error)
        return
      }
      notify.success(t('toastWebhookSaved'))
      router.refresh()
    } finally {
      setSavingWebhook(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3 rounded-lg border border-border p-4">
        <div className="flex items-center gap-2">
          <Settings2 className="size-4 text-muted-foreground" />
          <h3 className="text-sm font-medium">{t('collectionDetails')}</h3>
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm font-medium">{t('nameLabel')}</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={t('namePlaceholder')} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm font-medium">{t('descriptionLabel')}</Label>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder={t('descriptionPlaceholder')} />
        </div>
        <div className="flex justify-end">
          <Button onClick={saveDetails} disabled={savingDetails} size="sm">
            {savingDetails && <Loader2 className="size-4 animate-spin" />}
            {t('saveDetails')}
          </Button>
        </div>
      </div>

      <div className="space-y-3 rounded-lg border border-border p-4">
        <div className="flex items-center gap-2">
          <Webhook className="size-4 text-muted-foreground" />
          <h3 className="text-sm font-medium">{t('publishWebhook')}</h3>
        </div>
        <p className="text-xs text-muted-foreground">{t('webhookDescription')}</p>
        <div className="flex gap-2">
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder={t('urlPlaceholder')}
            className="flex-1"
          />
          <Button onClick={saveWebhook} disabled={savingWebhook}>
            {savingWebhook && <Loader2 className="size-4 animate-spin" />}
            {t('save')}
          </Button>
        </div>
      </div>
    </div>
  )
}
