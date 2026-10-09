'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import {
  Check,
  Copy,
  ExternalLink,
  Globe,
  LoaderCircle,
  Pencil,
  X,
} from 'lucide-react'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@workspace/ui/components/card'
import { Button } from '@workspace/ui/components/button'
import { Input } from '@workspace/ui/components/input'
import {
  normalizeSubdomain,
  storeHostname,
  storefrontRootDomain,
  storeUrl,
  SUBDOMAIN_MAX_LENGTH,
} from '@workspace/lib/storefront'
import { cn } from '@/lib/utils'
import { checkStoreSubdomain, updateStoreSubdomain } from '@/actions/seller'

type Availability =
  | { state: 'idle' }
  | { state: 'checking' }
  | { state: 'available' }
  | { state: 'unavailable'; reason: string }

const CHECK_DELAY_MS = 400

/**
 * The seller's own storefront address ({subdomain}.tallaby.com): copy it to
 * share with customers, or change it. Changing is an explicit save, not an
 * autosave like the rest of the page, because it moves a public link.
 */
export function StoreLinkCard ({ initialSubdomain }: { initialSubdomain: string }) {
  const t = useTranslations('settings.storeLink')
  const router = useRouter()
  const [subdomain, setSubdomain] = useState(initialSubdomain)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(initialSubdomain)
  const [availability, setAvailability] = useState<Availability>({ state: 'idle' })
  const [isSaving, startSaving] = useTransition()

  const url = storeUrl(subdomain)
  const normalizedDraft = normalizeSubdomain(draft)
  const unchanged = normalizedDraft === subdomain

  useEffect(() => {
    setSubdomain(initialSubdomain)
  }, [initialSubdomain])

  useEffect(() => {
    if (!editing || unchanged || !normalizedDraft) {
      setAvailability({ state: 'idle' })
      return
    }
    setAvailability({ state: 'checking' })
    let cancelled = false
    const timer = setTimeout(async () => {
      const res = await checkStoreSubdomain(normalizedDraft)
      if (cancelled) return
      setAvailability(
        res.success
          ? { state: 'available' }
          : { state: 'unavailable', reason: t(`errors.${res.error}`) }
      )
    }, CHECK_DELAY_MS)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [editing, normalizedDraft, unchanged, t])

  const copy = async () => {
    await navigator.clipboard.writeText(url)
    toast.success(t('copied'))
  }

  const cancel = () => {
    setDraft(subdomain)
    setEditing(false)
  }

  const save = () => {
    startSaving(async () => {
      const res = await updateStoreSubdomain(normalizedDraft)
      if (!res.success) {
        setAvailability({ state: 'unavailable', reason: t(`errors.${res.error}`) })
        return
      }
      setSubdomain(res.subdomain)
      setDraft(res.subdomain)
      setEditing(false)
      toast.success(t('saved', { host: storeHostname(res.subdomain) }))
      router.refresh()
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2 text-base'>
          <Globe className='size-4' />
          {t('title')}
        </CardTitle>
        <CardDescription>{t('description')}</CardDescription>
      </CardHeader>
      <CardContent className='space-y-4'>
        {!editing ? (
          <div className='flex flex-col gap-3 sm:flex-row sm:items-center'>
            <a
              href={url}
              target='_blank'
              rel='noopener noreferrer'
              dir='ltr'
              className='min-w-0 flex-1 truncate rounded-lg border bg-muted/40 px-4 py-2.5 font-mono text-sm font-medium hover:bg-muted'
            >
              {url}
            </a>
            <div className='flex gap-2'>
              <Button type='button' variant='default' onClick={copy}>
                <Copy className='size-4' />
                {t('copy')}
              </Button>
              <Button type='button' variant='outline' asChild>
                <a href={url} target='_blank' rel='noopener noreferrer'>
                  <ExternalLink className='size-4' />
                  {t('open')}
                </a>
              </Button>
              <Button
                type='button'
                variant='ghost'
                onClick={() => setEditing(true)}
              >
                <Pencil className='size-4' />
                {t('change')}
              </Button>
            </div>
          </div>
        ) : (
          <div className='space-y-3'>
            <label htmlFor='store-subdomain' className='text-sm font-medium'>
              {t('fieldLabel')}
            </label>
            <div
              dir='ltr'
              className={cn(
                'flex items-center overflow-hidden rounded-lg border bg-background focus-within:ring-2 focus-within:ring-ring',
                availability.state === 'unavailable' && 'border-destructive'
              )}
            >
              <span className='ps-3 text-sm text-muted-foreground'>https://</span>
              <Input
                id='store-subdomain'
                value={draft}
                onChange={(e) =>
                  setDraft(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))
                }
                maxLength={SUBDOMAIN_MAX_LENGTH}
                autoComplete='off'
                spellCheck={false}
                autoFocus
                aria-describedby='store-subdomain-status'
                className='h-10 min-w-0 flex-1 rounded-none border-0 px-1 font-mono shadow-none focus-visible:ring-0'
              />
              <span className='pe-3 text-sm text-muted-foreground'>
                .{storefrontRootDomain()}
              </span>
            </div>
            <p
              id='store-subdomain-status'
              aria-live='polite'
              className={cn(
                'flex min-h-5 items-center gap-1.5 text-sm',
                availability.state === 'available' && 'text-emerald-700 dark:text-emerald-400',
                availability.state === 'unavailable' && 'text-destructive',
                (availability.state === 'idle' || availability.state === 'checking') &&
                  'text-muted-foreground'
              )}
            >
              {availability.state === 'checking' && (
                <>
                  <LoaderCircle className='size-3.5 animate-spin' />
                  {t('checking')}
                </>
              )}
              {availability.state === 'available' && (
                <>
                  <Check className='size-3.5' />
                  {t('available', { host: storeHostname(normalizedDraft) })}
                </>
              )}
              {availability.state === 'unavailable' && (
                <>
                  <X className='size-3.5' />
                  {availability.reason}
                </>
              )}
              {availability.state === 'idle' && t('rules')}
            </p>
            <p className='text-sm text-muted-foreground'>{t('redirectNote')}</p>
            <div className='flex gap-2'>
              <Button
                type='button'
                onClick={save}
                disabled={unchanged || isSaving || availability.state !== 'available'}
              >
                {isSaving && <LoaderCircle className='size-4 animate-spin' />}
                {t('save')}
              </Button>
              <Button type='button' variant='ghost' onClick={cancel} disabled={isSaving}>
                {t('cancel')}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
