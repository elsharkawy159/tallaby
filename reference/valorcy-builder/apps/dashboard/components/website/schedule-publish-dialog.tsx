'use client'

import { useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { CalendarClock } from 'lucide-react'
import { notify } from '@/services/toast'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@workspace/ui/components/dialog'
import { Button } from '@workspace/ui/components/button'
import { Input } from '@workspace/ui/components/input'
import { Label } from '@workspace/ui/components/label'

import { schedulePublish } from '@/actions/website-actions'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId: string
  onScheduled?: (scheduledPublishAt: string) => void
}

/** Local `datetime-local` inputs need `YYYY-MM-DDTHH:mm`, not an ISO string. */
function toLocalInputMin(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export function SchedulePublishDialog ({ open, onOpenChange, projectId, onScheduled }: Props) {
  const t = useTranslations('pages.projects.dashboard')
  const [value, setValue] = useState('')
  const [isPending, startTransition] = useTransition()
  const [min] = useState(() => toLocalInputMin(new Date(Date.now() + 5 * 60 * 1000)))

  function handleClose (v: boolean) {
    if (!v) setValue('')
    onOpenChange(v)
  }

  function handleSubmit () {
    if (!value) {
      notify.error(t('schedulePublishPickTime'))
      return
    }
    const iso = new Date(value).toISOString()
    startTransition(async () => {
      try {
        const result = await schedulePublish(projectId, iso)
        if (!result.ok) {
          notify.error(result.error)
          return
        }
        notify.success(t('schedulePublishToastScheduled'))
        onScheduled?.(result.scheduledPublishAt)
        handleClose(false)
      } catch (err) {
        notify.error(t('toastActionFailed'), err)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarClock className="size-4.5" />
            {t('schedulePublishTitle')}
          </DialogTitle>
          <DialogDescription>{t('schedulePublishDescription')}</DialogDescription>
        </DialogHeader>

        <div className="space-y-1.5 py-1">
          <Label htmlFor="schedule-publish-at" className="text-xs">
            {t('schedulePublishDateTimeLabel')}
          </Label>
          <Input
            id="schedule-publish-at"
            type="datetime-local"
            min={min}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            autoFocus
          />
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => handleClose(false)}>
            {t('cancel')}
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={isPending || !value}>
            {isPending ? t('schedulePublishScheduling') : t('schedulePublishConfirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
