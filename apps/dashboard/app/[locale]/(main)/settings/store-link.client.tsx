'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import {
  Check,
  Copy,
  ExternalLink,
  Facebook,
  Instagram,
  LoaderCircle,
  MessageCircle,
  Pencil,
  X,
} from 'lucide-react'

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
import { StoreSiteStatusNote } from '@/components/stores/store-site-status-note'
import {
  ADDON_CLASS,
  BUTTON_CLASS,
  INPUT_GROUP_CLASS,
  INPUT_IN_GROUP_CLASS,
  SMALL_BUTTON_CLASS,
} from './settings-ui'

type Availability =
  | { state: 'idle' }
  | { state: 'checking' }
  | { state: 'available' }
  | { state: 'unavailable'; reason: string }

const CHECK_DELAY_MS = 400

/**
 * A store's address ({subdomain}.tallaby.com): copy it to share with
 * customers, or change it. Changing is an explicit save, not an autosave like
 * the rest of the page, because it moves a public link. Once the store has
 * its own domain, that is the link to share. Used on Website › Domain & SEO
 * for any store, and on /settings for the primary store (P4-14).
 */
export function StoreLinkSection ({
  storeId,
  initialSubdomain,
  customDomain,
  readOnly = false,
  siteStatus,
}: {
  storeId: string
  initialSubdomain: string
  customDomain?: string | null
  /** Archived / suspended store: the address can be shared, not changed. */
  readOnly?: boolean
  /** `stores.site_status`: an unpublished or offline store gets a note under its link. */
  siteStatus?: string
}) {
  const t = useTranslations('settings.storeLink')
  const router = useRouter()
  const [subdomain, setSubdomain] = useState(initialSubdomain)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(initialSubdomain)
  const [availability, setAvailability] = useState<Availability>({ state: 'idle' })
  const [isSaving, startSaving] = useTransition()

  const url = storeUrl(subdomain, customDomain)
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
      const res = await checkStoreSubdomain(storeId, normalizedDraft)
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
  }, [editing, normalizedDraft, unchanged, t, storeId])

  const copy = async (message = t('copied')) => {
    try {
      await navigator.clipboard.writeText(url)
      toast.success(message)
    } catch {
      toast.error(t('copyFailed'))
    }
  }

  const cancel = () => {
    setDraft(subdomain)
    setEditing(false)
  }

  const save = () => {
    startSaving(async () => {
      const res = await updateStoreSubdomain(storeId, normalizedDraft)
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

  if (editing) {
    return (
      <div className='flex flex-col gap-1.5'>
        <label htmlFor='store-subdomain' className='text-[13px] font-semibold'>
          {t('fieldLabel')}
        </label>
        <div
          dir='ltr'
          className={cn(
            INPUT_GROUP_CLASS,
            availability.state === 'unavailable' &&
              'border-destructive focus-within:border-destructive focus-within:ring-destructive/20'
          )}
        >
          <span className={cn(ADDON_CLASS, 'border-e')}>https://</span>
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
            className={cn(INPUT_IN_GROUP_CLASS, 'px-2 font-mono text-[13px]')}
          />
          <span className={cn(ADDON_CLASS, 'border-s')}>.{storefrontRootDomain()}</span>
        </div>
        <p
          id='store-subdomain-status'
          aria-live='polite'
          className={cn(
            'flex min-h-5 items-center gap-1.5 text-xs',
            availability.state === 'available' && 'text-success',
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
        <p className='text-xs text-muted-foreground'>{t('redirectNote')}</p>
        <div className='mt-1 flex gap-2'>
          <Button
            type='button'
            variant='secondary'
            className={BUTTON_CLASS}
            onClick={save}
            disabled={unchanged || isSaving || availability.state !== 'available'}
          >
            {isSaving && <LoaderCircle className='animate-spin' />}
            {t('save')}
          </Button>
          <Button
            type='button'
            variant='soft'
            className={BUTTON_CLASS}
            onClick={cancel}
            disabled={isSaving}
          >
            {t('cancel')}
          </Button>
        </div>
      </div>
    )
  }

  const shareText = encodeURIComponent(url)

  return (
    <>
      <div className='flex flex-col gap-1.5'>
        <p className='text-[13px] font-semibold'>{t('title')}</p>
        <div className='flex flex-wrap items-stretch gap-2'>
          <a
            href={url}
            target='_blank'
            rel='noopener noreferrer'
            dir='ltr'
            className='flex h-11 min-w-[240px] flex-1 items-center truncate rounded-[10px] border border-input bg-muted px-3.5 font-mono text-[13px] text-foreground transition-colors hover:border-primary'
          >
            {url}
          </a>
          <Button
            type='button'
            variant='accent'
            className={cn(BUTTON_CLASS, 'flex-1 sm:flex-none')}
            onClick={() => void copy()}
          >
            <Copy />
            {t('copy')}
          </Button>
          <Button variant='neutral' className={cn(BUTTON_CLASS, 'flex-1 sm:flex-none')} asChild>
            <a href={url} target='_blank' rel='noopener noreferrer'>
              <ExternalLink className='rtl:-scale-x-100' />
              {t('open')}
            </a>
          </Button>
          {!readOnly && (
            <Button
              type='button'
              variant='soft'
              className={cn(BUTTON_CLASS, 'flex-1 sm:flex-none')}
              onClick={() => setEditing(true)}
            >
              <Pencil />
              {t('change')}
            </Button>
          )}
        </div>
        <StoreSiteStatusNote siteStatus={siteStatus} />
      </div>

      <div className='flex flex-wrap items-center gap-2'>
        <span className='me-1 text-xs text-muted-foreground'>{t('shareLabel')}</span>
        <Button variant='neutral' className={SMALL_BUTTON_CLASS} asChild>
          <a href={`https://wa.me/?text=${shareText}`} target='_blank' rel='noopener noreferrer'>
            <MessageCircle />
            {t('whatsapp')}
          </a>
        </Button>
        <Button variant='neutral' className={SMALL_BUTTON_CLASS} asChild>
          <a
            href={`https://www.facebook.com/sharer/sharer.php?u=${shareText}`}
            target='_blank'
            rel='noopener noreferrer'
          >
            <Facebook />
            {t('facebook')}
          </a>
        </Button>
        {/* Instagram has no share URL; copy the link for the seller's bio or story. */}
        <Button
          type='button'
          variant='neutral'
          className={SMALL_BUTTON_CLASS}
          onClick={() => void copy(t('instagramCopied'))}
        >
          <Instagram />
          {t('instagram')}
        </Button>
      </div>
    </>
  )
}
