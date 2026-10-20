'use client'

import { useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { ExternalLink, Loader2 } from 'lucide-react'
import { Input } from '@workspace/ui/components/input'
import { Button } from '@workspace/ui/components/button'
import { Label } from '@workspace/ui/components/label'
import { notify } from '@/services/toast'
import { updateWebsiteDomains } from '@/actions/website-actions'

type Props = {
  projectId: string
  initialSubdomain: string | null
}

export function SubdomainForm ({ projectId, initialSubdomain }: Props) {
  const t = useTranslations('settings.website.subdomain')
  const [subdomain, setSubdomain] = useState(initialSubdomain ?? '')
  const [saved, setSaved] = useState(initialSubdomain ?? '')
  const [isPending, startTransition] = useTransition()

  const liveUrl = saved ? `https://${saved}.valorcy.com` : null
  const devUrl = saved ? `/s/${saved}` : null
  const isDirty = subdomain !== saved

  function handleSave () {
    startTransition(async () => {
      try {
        await updateWebsiteDomains(projectId, { subdomain: subdomain || null })
        setSaved(subdomain)
        notify.success(t('toastSaved'))
      } catch (err) {
        notify.error(err instanceof Error ? err.message : t('toastSaveFailed'))
      }
    })
  }

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor="subdomain-input" className="text-sm text-muted-foreground">
        {t('label')}
      </Label>

      <div className="flex items-center gap-2">
        <div className="flex flex-1 items-center rounded-md border border-input bg-background ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
          <Input
            id="subdomain-input"
            value={subdomain}
            onChange={(e) => setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
            placeholder={t('placeholder')}
            className="border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
          />
          <span className="shrink-0 pe-3 text-sm text-muted-foreground">.valorcy.com</span>
        </div>

        <Button
          size="sm"
          disabled={!isDirty || isPending}
          onClick={handleSave}
        >
          {isPending ? <Loader2 className="size-4 animate-spin" /> : t('save')}
        </Button>
      </div>

      {saved && (
        <div className="flex items-center gap-3">
          <a
            href={liveUrl!}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground hover:underline"
          >
            <ExternalLink className="size-3" />
            {saved}.valorcy.com
          </a>
          <span className="text-xs text-muted-foreground/50">·</span>
          <a
            href={devUrl!}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground hover:underline"
          >
            <ExternalLink className="size-3" />
            {t('devPreview')}
          </a>
        </div>
      )}
    </div>
  )
}
