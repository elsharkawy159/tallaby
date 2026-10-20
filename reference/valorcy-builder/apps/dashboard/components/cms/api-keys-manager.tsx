"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useTranslations, useLocale } from "next-intl"
import { formatDate } from "@workspace/i18n"
import { notify } from "@/services/toast"
import { Copy, KeyRound, Loader2, Plus, Trash2, Check } from "lucide-react"

import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@workspace/ui/components/dialog"
import { createApiKeyAction, revokeApiKeyAction } from "@/actions/cms/api-key-actions"
import type { CmsApiKeyListItem } from "@/services/cms/api-key-service"

function CopyButton({ value }: { value: string }) {
  const t = useTranslations('cms.apiKeys')
  const [copied, setCopied] = useState(false)
  return (
    <Button
      variant="outline"
      size="icon"
      className="size-8 shrink-0"
      aria-label={t('copyToClipboard')}
      onClick={async () => {
        await navigator.clipboard.writeText(value)
        setCopied(true)
        setTimeout(() => setCopied(false), 1500)
      }}
    >
      {copied ? <Check className="size-4 text-green-600" /> : <Copy className="size-4" />}
    </Button>
  )
}

export function ApiKeysManager({ projectId, initialKeys }: { projectId: string; initialKeys: CmsApiKeyListItem[] }) {
  const t = useTranslations('cms.apiKeys')
  const locale = useLocale()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  const [newKey, setNewKey] = useState<string | null>(null)

  const create = async () => {
    if (!name.trim()) {
      notify.error(t('toastNameRequired'))
      return
    }
    setIsCreating(true)
    try {
      const result = await createApiKeyAction({ projectId, name: name.trim() })
      if (!result.ok) {
        notify.error(result.error)
        return
      }
      setNewKey(result.data.plaintext)
      setName("")
      router.refresh()
    } finally {
      setIsCreating(false)
    }
  }

  const revoke = async (id: string) => {
    await revokeApiKeyAction(id, projectId)
    notify.success(t('toastRevoked'))
    router.refresh()
  }

  return (
    <div className="space-y-4 rounded-lg border border-border p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <KeyRound className="size-4 text-muted-foreground" />
          <h3 className="font-medium">{t('title')}</h3>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setNewKey(null) }}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="size-4" /> {t('newKey')}</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{newKey ? t('copyYourKey') : t('createApiKey')}</DialogTitle>
              <DialogDescription>
                {newKey ? t('copyKeyDescription') : t('createKeyDescription')}
              </DialogDescription>
            </DialogHeader>

            {newKey ? (
              <div className="flex items-center gap-2">
                <Input readOnly value={newKey} className="font-mono text-xs" />
                <CopyButton value={newKey} />
              </div>
            ) : (
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">{t('nameLabel')}</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={t('namePlaceholder')} />
              </div>
            )}

            <DialogFooter>
              {newKey ? (
                <Button onClick={() => { setOpen(false); setNewKey(null) }}>{t('done')}</Button>
              ) : (
                <Button onClick={create} disabled={isCreating}>
                  {isCreating && <Loader2 className="size-4 animate-spin" />}
                  {t('createKey')}
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {initialKeys.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t('empty')}</p>
      ) : (
        <div className="divide-y divide-border rounded-md border border-border">
          {initialKeys.map((key) => (
            <div key={key.id} className="flex items-center justify-between gap-3 px-3 py-2.5">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{key.name}</p>
                <p className="truncate font-mono text-xs text-muted-foreground">
                  {key.keyPrefix}…
                  {key.lastUsedAt
                    ? ` · ${t('lastUsed', { date: formatDate(key.lastUsedAt, locale) })}`
                    : ` · ${t('neverUsed')}`}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 text-destructive hover:text-destructive"
                onClick={() => revoke(key.id)}
                aria-label={t('revokeApiKey')}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
