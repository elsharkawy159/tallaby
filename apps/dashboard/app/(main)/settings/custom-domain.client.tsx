'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import {
  ChevronDown,
  CircleCheck,
  CircleAlert,
  Clock,
  Copy,
  ExternalLink,
  Link2,
  LoaderCircle,
  RefreshCw,
  Trash2,
} from 'lucide-react'

import { Badge } from '@workspace/ui/components/badge'
import { Button } from '@workspace/ui/components/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@workspace/ui/components/collapsible'
import { Input } from '@workspace/ui/components/input'
import {
  normalizeCustomDomain,
  storeUrl,
  validateCustomDomain,
} from '@workspace/lib/storefront'
import { cn } from '@/lib/utils'
import {
  addCustomDomain,
  removeCustomDomain,
  verifyCustomDomain,
  type CustomDomainResult,
  type CustomDomainView,
} from '@/actions/custom-domain'
import {
  ADDON_CLASS,
  BUTTON_CLASS,
  FieldHint,
  INPUT_GROUP_CLASS,
  INPUT_IN_GROUP_CLASS,
} from './settings-ui'

/** Vercel's targets; mirrors packages/lib/src/storefront/vercel-domains.ts. */
const APEX_A_RECORD = '76.76.21.21'
const WWW_CNAME = 'cname.vercel-dns.com'

/** Reasons `checkCustomDomain` reports while a domain isn't live. */
const CHECK_KEYS = new Set(['unverified', 'dns', 'not_attached'])

const STEPS = ['buy', 'enter', 'dns'] as const

type DnsRecord = { type: string; name: string; value: string }

function dnsRecords (view: CustomDomainView): DnsRecord[] {
  const records: DnsRecord[] = [
    { type: 'A', name: '@', value: APEX_A_RECORD },
    { type: 'CNAME', name: 'www', value: WWW_CNAME },
  ]
  for (const v of view.verification) {
    // `_vercel.faster-eg.com` → `_vercel` (registrars want the host part).
    const name = v.domain.endsWith(`.${view.domain}`)
      ? v.domain.slice(0, -(view.domain.length + 1))
      : v.domain
    records.push({ type: v.type, name, value: v.value })
  }
  return records
}

/**
 * Lets a seller serve a store from a domain they own (faster-eg.com): add it,
 * follow the DNS instructions at their registrar, then verify. The actions
 * take the store explicitly; until P3-03b only the primary store can have one.
 */
export function CustomDomainSection ({
  storeId,
  initial,
}: {
  storeId: string
  initial: CustomDomainView | null
}) {
  const t = useTranslations('settings.customDomain')
  const router = useRouter()
  const [view, setView] = useState(initial)
  const [draft, setDraft] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const [action, setAction] = useState<'add' | 'verify' | 'remove' | null>(null)
  const [open, setOpen] = useState(false)

  const normalizedDraft = normalizeCustomDomain(draft)
  const draftProblem = normalizedDraft ? validateCustomDomain(normalizedDraft) : null
  const shownError = error ?? (draftProblem ? t(`errors.${draftProblem}`) : null)

  const run = (
    kind: 'add' | 'verify' | 'remove',
    fn: () => Promise<CustomDomainResult>,
    onSuccess?: (domain: CustomDomainView | null) => void
  ) => {
    setAction(kind)
    setError(null)
    startTransition(async () => {
      const res = await fn()
      setAction(null)
      if (!res.success) {
        setError(t(`errors.${res.error}`))
        return
      }
      setView(res.domain)
      onSuccess?.(res.domain)
      router.refresh()
    })
  }

  const add = () =>
    run('add', () => addCustomDomain(storeId, draft), () => {
      setDraft('')
      toast.success(t('added'))
    })

  const verify = () =>
    run('verify', () => verifyCustomDomain(storeId), (domain) => {
      if (domain?.status === 'active') toast.success(t('nowLive', { host: domain.domain }))
      else toast.info(t('notYet'))
    })

  const remove = () => {
    if (!view) return
    if (!window.confirm(t('removeConfirm', { host: view.domain }))) return
    run('remove', () => removeCustomDomain(storeId), () => toast.success(t('removed')))
  }

  const copy = async (value: string) => {
    await navigator.clipboard.writeText(value)
    toast.success(t('copied'))
  }

  const canAdd = Boolean(normalizedDraft) && !draftProblem && !pending

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className='group -m-2 flex w-[calc(100%+1rem)] cursor-pointer flex-wrap items-center justify-between gap-3 rounded-[10px] p-2 text-start transition-colors hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none'>
        <div className='min-w-0 flex-[1_1_260px]'>
          <h3 className='text-sm font-bold'>{t('title')}</h3>
          <p className='mt-0.5 text-xs text-muted-foreground'>{t('description')}</p>
        </div>
        <div className='flex items-center gap-2'>
          {view ? (
            <StatusBadge status={view.status} />
          ) : (
            <Badge variant='muted' className='h-6 px-2.5'>{t('optional')}</Badge>
          )}
          <ChevronDown className='size-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180' />
        </div>
      </CollapsibleTrigger>

      <CollapsibleContent className='flex flex-col gap-4 pt-4 sm:gap-5 sm:pt-5'>
        {!view ? (
          <>
            <div className='flex flex-wrap items-stretch gap-2'>
              <div
                dir='ltr'
                className={cn(
                  INPUT_GROUP_CLASS,
                  'min-w-[240px] flex-1',
                  shownError &&
                    'border-destructive focus-within:border-destructive focus-within:ring-destructive/20'
                )}
              >
                <span className={cn(ADDON_CLASS, 'border-e')}>https://</span>
                <Input
                  id='custom-domain'
                  value={draft}
                  onChange={(e) => {
                    setDraft(e.target.value)
                    setError(null)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && canAdd) add()
                  }}
                  placeholder='example.com'
                  autoComplete='off'
                  spellCheck={false}
                  aria-label={t('fieldLabel')}
                  aria-invalid={Boolean(shownError)}
                  aria-describedby='custom-domain-status'
                  className={cn(INPUT_IN_GROUP_CLASS, 'font-mono text-[13px]')}
                />
              </div>
              <Button
                type='button'
                variant='secondary'
                className={cn(BUTTON_CLASS, 'flex-1 sm:flex-none')}
                onClick={add}
                disabled={!canAdd}
              >
                {action === 'add' ? <LoaderCircle className='animate-spin' /> : <Link2 />}
                {t('connect')}
              </Button>
            </div>
            <FieldHint
              id='custom-domain-status'
              aria-live='polite'
              className={cn(shownError && 'text-destructive')}
            >
              {shownError ??
                (normalizedDraft
                  ? t('willConnect', { host: normalizedDraft })
                  : t('hint'))}
            </FieldHint>
            <ol className='grid grid-cols-1 gap-3 md:grid-cols-3'>
              {STEPS.map((step, i) => (
                <li
                  key={step}
                  className='rounded-xl border bg-muted p-3.5 text-[13px] leading-relaxed text-muted-foreground'
                >
                  <span className='mb-2 grid size-6 place-items-center rounded-full border border-input bg-card font-montserrat text-xs font-bold text-primary-ink'>
                    {i + 1}
                  </span>
                  <b className='block font-semibold text-foreground'>{t(`steps.${step}.title`)}</b>
                  {t(`steps.${step}.body`)}
                </li>
              ))}
            </ol>
          </>
        ) : (
          <div className='flex flex-col gap-4'>
            <div className='flex flex-wrap items-center gap-2'>
              <span
                dir='ltr'
                className='flex h-11 min-w-[200px] flex-1 items-center truncate rounded-[10px] border border-input bg-muted px-3.5 font-mono text-[13px]'
              >
                {view.domain}
              </span>
              {view.status === 'active' ? (
                <Button variant='neutral' className={cn(BUTTON_CLASS, 'flex-1 sm:flex-none')} asChild>
                  <a href={storeUrl('', view.domain)} target='_blank' rel='noopener noreferrer'>
                    <ExternalLink className='rtl:-scale-x-100' />
                    {t('open')}
                  </a>
                </Button>
              ) : (
                <Button
                  type='button'
                  variant='secondary'
                  className={cn(BUTTON_CLASS, 'flex-1 sm:flex-none')}
                  onClick={verify}
                  disabled={pending}
                >
                  {action === 'verify' ? <LoaderCircle className='animate-spin' /> : <RefreshCw />}
                  {t('verify')}
                </Button>
              )}
              <Button
                type='button'
                variant='soft'
                className={cn(BUTTON_CLASS, 'flex-1 text-destructive hover:bg-destructive-soft hover:text-destructive sm:flex-none')}
                onClick={remove}
                disabled={pending}
              >
                {action === 'remove' ? <LoaderCircle className='animate-spin' /> : <Trash2 />}
                {t('remove')}
              </Button>
            </div>

            {error && <FieldHint className='text-destructive'>{error}</FieldHint>}

            {view.status !== 'active' && (
              <div className='flex flex-col gap-3 rounded-xl border bg-muted p-4'>
                <div>
                  <p className='text-sm font-semibold'>{t('dnsTitle')}</p>
                  <FieldHint className='mt-0.5'>{t('dnsIntro')}</FieldHint>
                </div>
                <div className='overflow-x-auto rounded-[10px] border bg-card' dir='ltr'>
                  <table className='w-full text-[13px]'>
                    <thead>
                      <tr className='text-muted-foreground'>
                        <th className='px-3 py-2 text-start font-medium'>{t('type')}</th>
                        <th className='px-3 py-2 text-start font-medium'>{t('name')}</th>
                        <th className='px-3 py-2 text-start font-medium'>{t('value')}</th>
                      </tr>
                    </thead>
                    <tbody className='font-mono'>
                      {dnsRecords(view).map((r) => (
                        <tr key={`${r.type}-${r.name}-${r.value}`} className='border-t'>
                          <td className='px-3 py-2'>{r.type}</td>
                          <td className='px-3 py-2'>{r.name}</td>
                          <td className='px-3 py-1.5'>
                            <span className='flex items-center gap-1'>
                              <span className='break-all'>{r.value}</span>
                              <Button
                                type='button'
                                variant='soft'
                                size='icon'
                                className='size-7 shrink-0 rounded-lg'
                                onClick={() => copy(r.value)}
                                aria-label={t('copyValue')}
                              >
                                <Copy className='size-3.5' />
                              </Button>
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {view.lastError && (
                  <FieldHint>
                    {t(`checks.${CHECK_KEYS.has(view.lastError) ? view.lastError : 'dns'}`)}
                  </FieldHint>
                )}
                <FieldHint>{t('propagation')}</FieldHint>
                <FieldHint>{t('cloudflare')}</FieldHint>
              </div>
            )}

            {view.status === 'active' && <FieldHint>{t('activeNote')}</FieldHint>}
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  )
}

function StatusBadge ({ status }: { status: CustomDomainView['status'] }) {
  const t = useTranslations('settings.customDomain.status')
  if (status === 'active') {
    return (
      <Badge variant='success' className='h-6 px-2.5'>
        <CircleCheck />
        {t('active')}
      </Badge>
    )
  }
  if (status === 'failed') {
    return (
      <Badge variant='danger' className='h-6 px-2.5'>
        <CircleAlert />
        {t('failed')}
      </Badge>
    )
  }
  return (
    <Badge variant='warning' className='h-6 px-2.5'>
      <Clock />
      {t('pending')}
    </Badge>
  )
}
